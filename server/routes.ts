import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertImageSchema, editHistorySchema } from "@shared/schema";
import { fal } from "@fal-ai/client";
import multer from "multer";
import { setupAuth, isAuthenticated } from "./replitAuth";
import Stripe from "stripe";
import { objectStorage } from "./objectStorage";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing required Stripe secret: STRIPE_SECRET_KEY');
}
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Upload image and create initial record
  app.post("/api/images/upload", isAuthenticated, upload.single('image'), async (req: any, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No image file provided" });
      }

      const userId = req.user.claims.sub;

      // Process image locally - detect orientation and apply correction
      const orientationInfo = await objectStorage.getImageOrientation(req.file.buffer);
      console.log("Detected orientation info:", orientationInfo);

      // Apply orientation correction directly to the uploaded image
      const correctedImageBuffer = await objectStorage.autoRotateImage(req.file.buffer);
      console.log("Image orientation corrected locally");

      // Upload corrected image directly to permanent storage
      const permanentUrl = await objectStorage.uploadImage(
        userId,
        correctedImageBuffer,
        req.file.originalname,
        req.file.mimetype
      );

      // Create image record with processed image
      const imageData = {
        userId,
        originalUrl: permanentUrl, // Use locally processed image as original
        currentUrl: permanentUrl, // Start with the same processed image
        editHistory: [],
      };

      const validatedData = insertImageSchema.parse(imageData);
      const image = await storage.createImage(validatedData);

      res.json(image);
    } catch (error) {
      console.error("Upload error:", error);
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to upload image" 
      });
    }
  });

  // Generate image using Flux AI text-to-image
  app.post("/api/images/generate", isAuthenticated, async (req: any, res) => {
    try {
      const { prompt } = req.body;

      if (!prompt || typeof prompt !== 'string') {
        return res.status(400).json({ message: "Prompt is required" });
      }

      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Check if user has reached their edit limit (generation counts as an edit)
      if (user.editCount >= user.editLimit) {
        return res.status(403).json({ 
          message: "Edit limit reached. Please upgrade your subscription to continue generating images.",
          editCount: user.editCount,
          editLimit: user.editLimit
        });
      }

      // Determine which model to use based on subscription tier
      // Free and basic users get "pro" model, premium and premium-plus users get "max" model
      const modelEndpoint = (user.subscriptionTier === 'premium' || user.subscriptionTier === 'premium-plus')
        ? "fal-ai/flux-pro/kontext/max/text-to-image"
        : "fal-ai/flux-pro/kontext/text-to-image";

      console.log(`Generating image with model: ${modelEndpoint} for user tier: ${user.subscriptionTier}`);

      // Call Flux AI text-to-image API
      const result = await fal.subscribe(modelEndpoint, {
        input: {
          prompt: prompt,
        },
        logs: true,
        onQueueUpdate: (update) => {
          if (update.status === "IN_PROGRESS") {
            update.logs?.map((log) => log.message).forEach(console.log);
          }
        },
      });

      if (!result.data?.images?.[0]?.url) {
        throw new Error("No generated image returned from Flux API");
      }

      const generatedImageUrl = result.data.images[0].url;
      console.log("FAL AI generated image URL:", generatedImageUrl);

      // Try to migrate the image to permanent storage, but use original URL if migration fails
      let permanentUrl = await objectStorage.migrateImageToPermanentStorage(
        userId,
        generatedImageUrl,
        `generated-${Date.now()}`
      );

      // If migration failed, use the original FAL URL directly
      if (!permanentUrl) {
        console.log("Migration failed, using original FAL URL");
        permanentUrl = generatedImageUrl;
      }

      // Create image record in database
      const imageData = {
        userId: userId,
        originalUrl: permanentUrl,
        currentUrl: permanentUrl,
        editHistory: [{
          prompt: `Generated: ${prompt}`,
          imageUrl: permanentUrl,
          timestamp: new Date().toISOString(),
        }]
      };

      const validatedData = insertImageSchema.parse(imageData);
      const image = await storage.createImage(validatedData);

      // Increment user's edit count
      await storage.incrementUserEditCount(userId);

      res.json(image);
    } catch (error) {
      console.error("Generation error:", error);
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to generate image" 
      });
    }
  });

  // Edit image using Flux AI
  app.post("/api/images/:id/edit", isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const { prompt } = req.body;

      if (!prompt || typeof prompt !== 'string') {
        return res.status(400).json({ message: "Prompt is required" });
      }

      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Check if user has reached their edit limit
      if (user.editCount >= user.editLimit) {
        return res.status(403).json({ 
          message: "Edit limit reached. Please upgrade your subscription to continue editing.",
          editCount: user.editCount,
          editLimit: user.editLimit
        });
      }

      const image = await storage.getImage(parseInt(id));
      if (!image) {
        return res.status(404).json({ message: "Image not found" });
      }

      // Get the current image data and prepare for editing
      let imageInput: string;
      const isFirstEdit = !image.editHistory || image.editHistory.length === 0;

      if (isFirstEdit && image.currentUrl.startsWith('/api/storage/')) {
        // First edit: Upload original (potentially large) image to FAL storage
        const imageKey = image.currentUrl.match(/\/api\/storage\/(.+)$/)?.[1];
        if (!imageKey) {
          throw new Error("Invalid storage URL format");
        }

        const imageBuffer = await objectStorage.getImageData(imageKey);
        if (!imageBuffer) {
          throw new Error("Could not retrieve image data for editing");
        }

        // Upload to FAL storage for first edit (more efficient for large images)
        const file = new File([imageBuffer], `edit-input-${Date.now()}.png`, {
          type: 'image/png',
        });

        const uploadedUrl = await fal.storage.upload(file);
        imageInput = uploadedUrl;
        console.log("First edit: Original image uploaded to FAL storage");
      } else if (!isFirstEdit) {
        // Subsequent edits: Use base64 encoding for smaller processed images
        let imageBuffer: Buffer | null = null;

        if (image.currentUrl.startsWith('/api/storage/')) {
          // Get from our storage
          const imageKey = image.currentUrl.match(/\/api\/storage\/(.+)$/)?.[1];
          if (imageKey) {
            imageBuffer = await objectStorage.getImageData(imageKey);
          }
        } else {
          // Download from FAL URL
          try {
            const response = await fetch(image.currentUrl);
            if (response.ok) {
              const arrayBuffer = await response.arrayBuffer();
              imageBuffer = Buffer.from(arrayBuffer);
            }
          } catch (error) {
            console.error("Failed to download image for subsequent edit:", error);
          }
        }

        if (!imageBuffer) {
          throw new Error("Could not retrieve image data for editing");
        }

        // Convert to base64 for subsequent edits (processed images are smaller)
        const base64Data = imageBuffer.toString('base64');
        imageInput = `data:image/png;base64,${base64Data}`;
        console.log("Subsequent edit: Using base64 encoding for processed image");
      } else {
        // Current image is already a FAL URL (fallback), use directly
        imageInput = image.currentUrl;
        console.log("Using existing FAL URL directly");
      }

      // Determine which model to use based on subscription tier
      const modelEndpoint = (user.subscriptionTier === 'premium' || user.subscriptionTier === 'premium-plus')
        ? "fal-ai/flux-pro/kontext/max"
        : "fal-ai/flux-pro/kontext";

      console.log(`Using model: ${modelEndpoint} for user tier: ${user.subscriptionTier}`);

      // Call Flux AI API
      const result = await fal.subscribe(modelEndpoint, {
        input: {
          prompt: prompt,
          image_url: imageInput,
        },
        logs: true,
        onQueueUpdate: (update) => {
          if (update.status === "IN_PROGRESS") {
            update.logs?.map((log) => log.message).forEach(console.log);
          }
        },
      });

      if (!result.data?.images?.[0]?.url) {
        throw new Error("No edited image returned from Flux API");
      }

      const editedImageUrl = result.data.images[0].url;
      console.log("FAL AI returned image URL:", editedImageUrl);

      // Immediately migrate edited image to permanent storage to avoid URL expiration
      const permanentEditedUrl = await objectStorage.uploadImageFromUrl(
        userId,
        editedImageUrl,
        `edited-${Date.now()}.png`
      );
      console.log("Edited image migrated to permanent storage:", permanentEditedUrl);

      // Update image record with permanent URL and history
      const newHistoryItem = {
        prompt,
        imageUrl: permanentEditedUrl, // Use permanent storage URL
        timestamp: new Date().toISOString(),
      };

      const updatedImage = await storage.updateImage(parseInt(id), {
        currentUrl: permanentEditedUrl, // Use permanent storage URL
        editHistory: [...(image.editHistory || []), newHistoryItem],
      });

      // Increment user's edit count
      await storage.incrementUserEditCount(userId);

      res.json(updatedImage);
    } catch (error) {
      console.error("Edit error:", error);
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to edit image" 
      });
    }
  });

  // Reset image to original
  app.post("/api/images/:id/reset", async (req, res) => {
    try {
      const { id } = req.params;
      const image = await storage.getImage(parseInt(id));

      if (!image) {
        return res.status(404).json({ message: "Image not found" });
      }

      const updatedImage = await storage.updateImage(parseInt(id), {
        currentUrl: image.originalUrl,
        editHistory: [],
      });

      res.json(updatedImage);
    } catch (error) {
      console.error("Reset error:", error);
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to reset image" 
      });
    }
  });

  // Revert to a specific edit in history
  app.post("/api/images/:id/revert", async (req, res) => {
    try {
      const { id } = req.params;
      const { historyIndex } = req.body;

      if (typeof historyIndex !== 'number') {
        return res.status(400).json({ message: "History index is required" });
      }

      const image = await storage.getImage(parseInt(id));
      if (!image) {
        return res.status(404).json({ message: "Image not found" });
      }

      if (!image.editHistory || historyIndex < -1 || historyIndex >= image.editHistory.length) {
        return res.status(400).json({ message: "Invalid history index" });
      }

      let targetUrl: string;
      let newHistory: any[];

      if (historyIndex === -1) {
        // Revert to original
        targetUrl = image.originalUrl;
        newHistory = [];
      } else {
        // Revert to specific edit - we want the image URL from the NEXT edit after the one we're reverting to
        const targetEdit = image.editHistory[historyIndex];
        targetUrl = targetEdit.imageUrl;
        newHistory = image.editHistory.slice(0, historyIndex + 1);
      }

      const updatedImage = await storage.updateImage(parseInt(id), {
        currentUrl: targetUrl,
        editHistory: newHistory,
      });

      res.json(updatedImage);
    } catch (error) {
      console.error("Revert error:", error);
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to revert image" 
      });
    }
  });

  // Get user's images
  app.get("/api/images", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const images = await storage.getUserImages(userId);



      res.json(images);
    } catch (error) {
      console.error("Get user images error:", error);
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to get images" 
      });
    }
  });

  // Get image by ID
  app.get("/api/images/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const image = await storage.getImage(parseInt(id));

      if (!image) {
        return res.status(404).json({ message: "Image not found" });
      }

      res.json(image);
    } catch (error) {
      console.error("Get image error:", error);
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to get image" 
      });
    }
  });

  // Serve images from object storage with optimization support
  app.get("/api/storage/:key(*)", async (req, res) => {
    try {
      const { key } = req.params;
      const { w, h, q } = req.query;

      // Parse optimization parameters
      const width = w ? parseInt(w as string) : undefined;
      const height = h ? parseInt(h as string) : undefined;
      const quality = q ? parseInt(q as string) : 80;

      // Validate parameters
      if (width && (width < 1 || width > 4000)) {
        return res.status(400).json({ message: "Width must be between 1 and 4000 pixels" });
      }
      if (height && (height < 1 || height > 4000)) {
        return res.status(400).json({ message: "Height must be between 1 and 4000 pixels" });
      }
      if (quality < 1 || quality > 100) {
        return res.status(400).json({ message: "Quality must be between 1 and 100" });
      }

      const result = await objectStorage.getOptimizedImageData(key, width, height, quality);

      if (!result) {
        return res.status(404).json({ message: "Image not found" });
      }

      const { buffer, contentType } = result;

      // Set appropriate headers
      res.set({
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000', // Cache for 1 year
        'Access-Control-Allow-Origin': '*', // Allow CORS for images
        'Vary': 'Accept-Encoding', // Vary on encoding for better caching
      });

      res.send(buffer);
    } catch (error) {
      console.error("Serve image error:", error);
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to serve image" 
      });
    }
  });

  // Fallback endpoint for expired FAL URLs
  app.get("/api/image-fallback/:imageId", async (req, res) => {
    try {
      const { imageId } = req.params;
      const { w, h, q } = req.query;

      // Parse optimization parameters
      const width = w ? parseInt(w as string) : undefined;
      const height = h ? parseInt(h as string) : undefined;
      const quality = q ? parseInt(q as string) : 80;

      // Get image from database
      const image = await storage.getImage(parseInt(imageId));
      if (!image) {
        return res.status(404).json({ message: "Image not found" });
      }

      // Try to serve from our object storage (original image)
      if (image.originalUrl.startsWith('/api/storage/')) {
        const imageKey = image.originalUrl.match(/\/api\/storage\/(.+)$/)?.[1];
        if (imageKey) {
          const result = await objectStorage.getOptimizedImageData(imageKey, width, height, quality);
          if (result) {
            const { buffer, contentType } = result;
            res.set({
              'Content-Type': contentType,
              'Cache-Control': 'public, max-age=31536000',
              'Access-Control-Allow-Origin': '*',
              'Vary': 'Accept-Encoding',
            });
            return res.send(buffer);
          }
        }
      }

      return res.status(404).json({ message: "No fallback image available" });
    } catch (error) {
      console.error("Fallback image error:", error);
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to serve fallback image" 
      });
    }
  });

  // Upscale image using ESRGAN or Aura-SR based on subscription tier
  app.post("/api/images/:id/upscale", isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const { scale = 2 } = req.body;
      const userId = req.user.claims.sub;

      // Get user to check subscription tier
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Check subscription tier restrictions
      if (user.subscriptionTier === 'free') {
        return res.status(403).json({ 
          message: "Upscaling is not available on the free plan. Please upgrade to access this feature.",
          requiresUpgrade: true
        });
      }

      // Validate scale parameter based on subscription tier
      if (user.subscriptionTier === 'basic' && scale !== 2) {
        return res.status(403).json({ 
          message: "4x upscaling is only available for premium users. Basic users can use 2x upscaling.",
          requiresUpgrade: true
        });
      }

      if (![2, 4].includes(scale)) {
        return res.status(400).json({ message: "Scale must be 2 or 4" });
      }

      // Get the image from database
      const image = await storage.getImage(parseInt(id));
      if (!image) {
        return res.status(404).json({ message: "Image not found" });
      }

      // Check if user owns the image
      if (image.userId !== userId) {
        return res.status(403).json({ message: "Unauthorized" });
      }

      console.log(`Starting upscale for image ${id} with scale ${scale}x for ${user.subscriptionTier} user`);
      console.log(`Image currentUrl: ${image.currentUrl}`);
      console.log(`Image originalUrl: ${image.originalUrl}`);

      // Try to get image data from storage - handle both FAL URLs and our storage URLs
      let imageBuffer: Buffer | null = null;

      if (image.currentUrl.startsWith('/api/storage/')) {
        // Our object storage URL
        const imageKey = image.currentUrl.match(/\/api\/storage\/(.+)$/)?.[1];
        if (imageKey) {
          imageBuffer = await objectStorage.getImageData(imageKey);
        }
      } else if (image.originalUrl.startsWith('/api/storage/')) {
        // Fall back to original URL if current is external (FAL URL)
        const imageKey = image.originalUrl.match(/\/api\/storage\/(.+)$/)?.[1];
        if (imageKey) {
          imageBuffer = await objectStorage.getImageData(imageKey);
        }
      } else {
        // Both URLs are external, need to download the image first
        try {
          const response = await fetch(image.currentUrl);
          if (response.ok) {
            const arrayBuffer = await response.arrayBuffer();
            imageBuffer = Buffer.from(arrayBuffer);
          }
        } catch (error) {
          console.error("Failed to download external image:", error);
        }
      }

      if (!imageBuffer) {
        return res.status(404).json({ message: "Image data not found or could not be retrieved" });
      }

      // Convert image buffer to base64 data URI for upscaling
      const base64Data = imageBuffer.toString('base64');
      const imageDataUri = `data:image/png;base64,${base64Data}`;
      console.log("Image converted to base64 data URI for upscaling");

      let result;

      // Use different upscaling models based on scale and subscription tier
      if (scale === 4 && (user.subscriptionTier === 'premium' || user.subscriptionTier === 'premium-plus')) {
        // Premium users get Aura-SR for 4x upscaling
        console.log("Using Aura-SR for 4x upscaling (premium user)");
        result = await fal.subscribe("fal-ai/aura-sr", {
          input: {
            image_url: imageDataUri
          },
          logs: true,
          onQueueUpdate: (update) => {
            if (update.status === "IN_PROGRESS") {
              update.logs?.map((log) => log.message).forEach(console.log);
            }
          },
        });
      } else {
        // Basic and premium users get ESRGAN for 2x upscaling
        console.log(`Using ESRGAN for ${scale}x upscaling`);
        result = await fal.subscribe("fal-ai/esrgan", {
          input: {
            image_url: imageDataUri,
            model: "RealESRGAN_x4plus",
            scale: scale
          },
          logs: true,
          onQueueUpdate: (update) => {
            if (update.status === "IN_PROGRESS") {
              update.logs?.map((log) => log.message).forEach(console.log);
            }
          },
        });
      }

      if (!result.data?.image?.url) {
        throw new Error("No upscaled image returned from FAL AI");
      }

      console.log("FAL AI upscale completed");

      // Return the upscaled image URL directly for download
      res.json({ upscaledImageUrl: result.data.image.url });

    } catch (error) {
      console.error("Upscale error:", error);
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to upscale image" 
      });
    }
  });

  // Delete image by ID
  app.delete("/api/images/:id", isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.claims.sub;

      // First check if the image exists and belongs to the user
      const image = await storage.getImage(parseInt(id));
      if (!image) {
        return res.status(404).json({ message: "Image not found" });
      }

      if (image.userId !== userId) {
        return res.status(403).json({ message: "Unauthorized to delete this image" });
      }

      // Delete from object storage first
      try {
        // Delete original image
        await objectStorage.deleteImageByUrl(image.originalUrl);

        // Delete all edited versions from history
        if (image.editHistory) {
          for (const edit of image.editHistory) {
            await objectStorage.deleteImageByUrl(edit.imageUrl);
          }
        }

        // Delete current image if different from original
        if (image.currentUrl !== image.originalUrl) {
          await objectStorage.deleteImageByUrl(image.currentUrl);
        }
      } catch (storageError) {
        console.error("Error deleting from object storage:", storageError);
        // Continue with database deletion even if storage cleanup fails
      }

      const deleted = await storage.deleteImage(parseInt(id));
      if (!deleted) {
        return res.status(404).json({ message: "Image not found" });
      }

      res.json({ message: "Image deleted successfully" });
    } catch (error) {
      console.error("Delete image error:", error);
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to delete image" 
      });
    }
  });

  // Stripe subscription routes - Create checkout session
  app.post('/api/create-subscription', isAuthenticated, async (req: any, res) => {
    try {
      const { priceId } = req.body;
      const userId = req.user.claims.sub;

      console.log('Create subscription request:', { priceId, userId });

      if (!priceId) {
        return res.status(400).json({ message: "Price ID is required" });
      }

      const user = await storage.getUser(userId);

      if (!user || !user.email) {
        return res.status(400).json({ message: "User email not found" });
      }

      // Check if user has an existing subscription for upgrade handling
      let isUpgrade = false;
      if (user.stripeSubscriptionId) {
        const subscription = await stripe.subscriptions.retrieve(user.stripeSubscriptionId);
        if (subscription.status === 'active') {
          isUpgrade = true;
        }
      }

      // Create Stripe customer if doesn't exist
      let customerId = user.stripeCustomerId;
      if (!customerId) {
        const customer = await stripe.customers.create({
          email: user.email,
          name: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
        });
        customerId = customer.id;
        await storage.updateStripeCustomerId(userId, customerId);
      }

      // Create checkout session for subscription
      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        payment_method_types: ['card'],
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        mode: 'subscription',
        success_url: `${req.headers.origin}/subscription?success=true&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${req.headers.origin}/subscription?canceled=true`,
        metadata: {
          userId: userId,
          priceId: priceId,
          isUpgrade: isUpgrade.toString(),
          existingSubscriptionId: user.stripeSubscriptionId || '',
        },
      });

      console.log('Checkout session created:', session.id);

      res.json({
        sessionId: session.id,
        url: session.url,
      });
    } catch (error: any) {
      console.error('Subscription creation error:', error);
      res.status(400).json({ message: error.message });
    }
  });

  // Get subscription info
  app.get('/api/subscription', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      let cancelAtPeriodEnd = false;
      let currentPeriodEnd = null;
      let hasActiveSubscription = false;

      // If user has a subscription, check its cancellation status
      if (user.stripeSubscriptionId) {
        try {
          const subscription = await stripe.subscriptions.retrieve(user.stripeSubscriptionId);
          cancelAtPeriodEnd = subscription.cancel_at_period_end || false;
          hasActiveSubscription = subscription.status === 'active';

          // Use database current_period_end as primary source, fallback to Stripe
          console.log(`Debug currentPeriodEnd for user ${userId}:`, {
            databaseValue: user.currentPeriodEnd,
            databaseType: typeof user.currentPeriodEnd,
            stripeValue: subscription.current_period_end,
            stripePeriodEnd: subscription.items?.data?.[0]?.current_period_end
          });

          if (user.currentPeriodEnd) {
            currentPeriodEnd = Math.floor(user.currentPeriodEnd.getTime() / 1000);
          } else if (subscription.current_period_end) {
            currentPeriodEnd = subscription.current_period_end;
            
            // Update database with the period end from Stripe if it's missing
            try {
              const periodStart = new Date((subscription.current_period_start || subscription.created) * 1000);
              const periodEnd = new Date(subscription.current_period_end * 1000);
              await storage.updateUserBillingPeriod(userId, periodStart, periodEnd);
              console.log(`Updated missing billing period for user ${userId}`);
            } catch (error) {
              console.error('Failed to update missing billing period:', error);
            }
          }

          console.log(`Subscription status for user ${userId}:`, {
            id: subscription.id,
            status: subscription.status,
            cancelAtPeriodEnd: subscription.cancel_at_period_end,
            currentPeriodEnd: currentPeriodEnd,
            databasePeriodEnd: user.currentPeriodEnd,
            stripePeriodEnd: subscription.items?.data?.[0]?.current_period_end
          });
        } catch (error) {
          console.error('Error retrieving subscription:', error);
          // If subscription retrieval fails, user probably doesn't have an active subscription
          hasActiveSubscription = false;
        }
      } else {
        console.log(`User ${userId} has no subscription`);
        // Still check if user has currentPeriodEnd in database (for canceled subscriptions)
        if (user.currentPeriodEnd) {
          currentPeriodEnd = Math.floor(user.currentPeriodEnd.getTime() / 1000);
        }
      }

      const response = {
        subscriptionTier: user.subscriptionTier || 'free',
        editCount: user.editCount || 0,
        editLimit: user.editLimit || 10,
        hasActiveSubscription,
        cancelAtPeriodEnd,
        currentPeriodEnd,
      };

      console.log(`Subscription info response for user ${userId}:`, response);

      res.json(response);
    } catch (error) {
      console.error('Get subscription error:', error);
      res.status(500).json({ message: "Failed to get subscription info" });
    }
  });

  // Cancel subscription
  app.post('/api/cancel-subscription', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);

      if (!user || !user.stripeSubscriptionId) {
        return res.status(400).json({ message: "No active subscription found" });
      }

      // Get current subscription status first
      const subscription = await stripe.subscriptions.retrieve(user.stripeSubscriptionId);

      if (subscription.status === 'canceled') {
        return res.status(400).json({ message: "Subscription is already canceled" });
      }

      if (subscription.cancel_at_period_end) {
        return res.status(400).json({ message: "Subscription is already scheduled for cancellation" });
      }

      // Cancel subscription at period end
      await stripe.subscriptions.update(user.stripeSubscriptionId, {
        cancel_at_period_end: true,
      });

      res.json({ message: "Subscription will be canceled at the end of the billing period" });
    } catch (error: any) {
      console.error('Cancel subscription error:', error);
      res.status(400).json({ message: error.message });
    }
  });

  // Resume subscription
  app.post('/api/resume-subscription', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;      const user = await storage.getUser(userId);

      if (!user || !user.stripeSubscriptionId) {
        return res.status(400).json({ message: "No active subscription found" });
      }

      // Get current subscription status first
      const subscription = await stripe.subscriptions.retrieve(user.stripeSubscriptionId);

      if (subscription.status === 'canceled') {
        return res.status(400).json({ message: "Subscription is already canceled and cannot be resumed" });
      }

      if (!subscription.cancel_at_period_end) {
        return res.status(400).json({ message: "Subscription is not scheduled for cancellation" });
      }

      // Resume subscription by removing cancellation
      await stripe.subscriptions.update(user.stripeSubscriptionId, {
        cancel_at_period_end: false,
      });

      res.json({ message: "Subscription has been resumed successfully" });
    } catch (error: any) {
      console.error('Resume subscription error:', error);
      res.status(400).json({ message: error.message });
    }
  });

  // Upgrade subscription endpoint
  app.post('/api/upgrade-subscription', isAuthenticated, async (req: any, res) => {
    try {
      const { priceId } = req.body;
      const userId = req.user.claims.sub;

      console.log('Upgrade subscription request:', { priceId, userId });

      if (!priceId) {
        return res.status(400).json({ message: "Price ID is required" });
      }

      const user = await storage.getUser(userId);

      if (!user || !user.stripeSubscriptionId) {
        return res.status(400).json({ message: "No active subscription found to upgrade" });
      }

      // Get current subscription
      const subscription = await stripe.subscriptions.retrieve(user.stripeSubscriptionId);

      if (subscription.status !== 'active') {
        return res.status(400).json({ message: "Subscription is not active" });
      }

      // Update subscription with new price
      const updatedSubscription = await stripe.subscriptions.update(user.stripeSubscriptionId, {
        items: [
          {
            id: subscription.items.data[0].id,
            price: priceId,
          },
        ],
        proration_behavior: 'always_invoice',
      });

      // Determine subscription tier and edit limit based on price
      let tier = 'basic';
      let editLimit = 50;

      if (priceId === process.env.VITE_STRIPE_PRICE_1499) {
        tier = 'premium-plus';
        editLimit = 100;
      } else if (priceId === process.env.VITE_STRIPE_PRICE_999) {
        tier = 'premium';
        editLimit = 50;
      } else if (priceId === process.env.VITE_STRIPE_PRICE_5) {
        tier = 'basic';
        editLimit = 50;
      }

      // Update user subscription details - preserve edit count for upgrades
      await storage.updateUserSubscription(userId, tier, editLimit, true, "active");

      console.log(`Subscription upgraded for user ${userId}: ${tier} plan`);

      res.json({ 
        message: "Subscription upgraded successfully",
        tier,
        editLimit 
      });

    } catch (error: any) {
      console.error('Upgrade subscription error:', error);
      res.status(400).json({ message: error.message });
    }
  });

  // Add route to handle successful checkout session
  app.get('/api/checkout-session/:sessionId', isAuthenticated, async (req: any, res) => {
    try {
      const { sessionId } = req.params;
      const session = await stripe.checkout.sessions.retrieve(sessionId);

      res.json({
        status: session.payment_status,
        subscriptionId: session.subscription,
      });
    } catch (error: any) {
      console.error('Error retrieving checkout session:', error);
      res.status(400).json({ message: error.message });
    }
  });

  // Manual billing period reset endpoint (for testing)
  app.post('/api/reset-billing-period', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.triggerBillingPeriodReset(userId);

      if (user) {
        res.json({ 
          message: "Billing period reset successfully",
          editCount: user.editCount,
          currentPeriodStart: user.currentPeriodStart,
          currentPeriodEnd: user.currentPeriodEnd
        });
      } else {
        res.status(500).json({ message: "Failed to reset billing period" });
      }
    } catch (error) {
      console.error('Manual billing period reset error:', error);
      res.status(500).json({ message: "Failed to reset billing period" });
    }
  });

  // Stripe webhook endpoint for handling subscription events
  app.post('/api/stripe-webhook', async (req, res) => {
    const sig = req.headers['stripe-signature'];
    let event;

    try {
      // You'll need to set STRIPE_WEBHOOK_SECRET in your environment
      event = stripe.webhooks.constructEvent(req.body, sig as string, process.env.STRIPE_WEBHOOK_SECRET || '');
    } catch (err: any) {
      console.error('Webhook signature verification failed:', err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    console.log('Webhook event received:', event.type);

    // Handle the event
    switch (event.type) {
      case 'invoice.payment_succeeded': {
        const invoice = event.data.object;
        console.log('Invoice payment succeeded:', invoice.id);

        // Update billing period for subscription-related payments
        if (invoice.subscription) {
          try {
            const user = await storage.getUserBySubscriptionId(invoice.subscription as string);
            if (user) {
              // Get subscription to get the current period
              const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string);

              // Get billing period timestamps from subscription items (primary source)
              let periodStartTimestamp = null;
              let periodEndTimestamp = null;

              if (subscription.items?.data?.[0]) {
                const firstItem = subscription.items.data[0];
                periodStartTimestamp = firstItem.current_period_start;
                periodEndTimestamp = firstItem.current_period_end;
              }

              // Fallback to root subscription if items don't have the fields
              if (!periodStartTimestamp || !periodEndTimestamp) {
                periodStartTimestamp = subscription.current_period_start || periodStartTimestamp;
                periodEndTimestamp = subscription.current_period_end || periodEndTimestamp;
              }

              // Final fallback: use invoice period if subscription doesn't have billing period
              if (!periodStartTimestamp || !periodEndTimestamp) {
                periodStartTimestamp = invoice.period_start || periodStartTimestamp;
                periodEndTimestamp = invoice.period_end || periodEndTimestamp;
                console.log(`Using invoice period as fallback: start=${invoice.period_start}, end=${invoice.period_end}`);
              }

              console.log(`Billing period extraction result: start=${periodStartTimestamp}, end=${periodEndTimestamp}`);

              // Only update billing period if we have valid timestamps
              if (periodStartTimestamp && periodEndTimestamp && 
                  typeof periodStartTimestamp === 'number' && 
                  typeof periodEndTimestamp === 'number' &&
                  periodStartTimestamp > 0 && periodEndTimestamp > 0) {
                try {
                  const periodStart = new Date(periodStartTimestamp * 1000);
                  const periodEnd = new Date(periodEndTimestamp * 1000);

                  // Validate the dates are actually valid
                  if (!isNaN(periodStart.getTime()) && !isNaN(periodEnd.getTime()) && 
                      periodStart.getTime() > 0 && periodEnd.getTime() > 0) {
                    await storage.updateUserBillingPeriod(user.id, periodStart, periodEnd);
                    console.log(`Billing period updated for user ${user.id} on payment success: ${periodStart.toISOString()} to ${periodEnd.toISOString()}`);
                  } else {
                    console.log(`Invalid billing period dates for user ${user.id}, falling back to edit count reset`);
                    await storage.resetUserEditCount(user.id);
                  }
                } catch (error) {
                  console.log(`Billing period update failed for user ${user.id}, falling back to edit count reset:`, error.message);
                  await storage.resetUserEditCount(user.id);
                }
              } else {
                // Fallback: If billing period timestamps are not available, reset edit count on payment success
                console.log(`Missing or invalid billing period timestamps for user ${user.id} - start=${periodStartTimestamp}, end=${periodEndTimestamp}`);
                console.log(`Falling back to edit count reset on payment success`);
                await storage.resetUserEditCount(user.id);
              }
            } else {
              console.log(`No user found for subscription ${invoice.subscription}`);
            }
          } catch (error) {
            console.error('Error updating billing period on payment:', error);
          }
        }
        break;
      }
      case 'checkout.session.completed': {
        const session = event.data.object;
        console.log('Checkout session completed:', session.id);

        if (session.mode === 'subscription' && session.subscription) {
          try {
            const userId = session.metadata?.userId;
            const priceId = session.metadata?.priceId;
            const isUpgrade = session.metadata?.isUpgrade === 'true';
            const existingSubscriptionId = session.metadata?.existingSubscriptionId;

            if (userId && priceId) {
              let finalSubscriptionId = session.subscription as string;

              // Handle subscription upgrade
              if (isUpgrade && existingSubscriptionId) {
                try {
                  const existingSubscription = await stripe.subscriptions.retrieve(existingSubscriptionId);

                  if (existingSubscription.status === 'active' && existingSubscription.items.data.length > 0) {
                    // Update existing subscription with new price
                    const updatedSubscription = await stripe.subscriptions.update(existingSubscriptionId, {
                      items: [
                        {
                          id: existingSubscription.items.data[0].id,
                          deleted: true,
                        },
                        {
                          price: priceId,
                        },
                      ],
                      proration_behavior: 'always_invoice',
                    });

                    // Cancel the new subscription created by checkout since we updated the existing one
                    await stripe.subscriptions.cancel(session.subscription as string);

                    finalSubscriptionId = existingSubscriptionId;
                    console.log('Subscription upgraded:', existingSubscriptionId);
                  }
                } catch (upgradeError) {
                  console.error('Subscription upgrade failed, using new subscription:', upgradeError);
                  // If upgrade fails, we'll use the new subscription created by checkout
                }
              }

              // Update user with subscription info
              await storage.updateUserStripeInfo(userId, session.customer as string, finalSubscriptionId);

              // Determine subscription tier and edit limit based on price
              let tier = 'basic';
              let editLimit = 50;

              // Map actual Stripe price IDs to subscription tiers
              if (priceId === process.env.VITE_STRIPE_PRICE_1499) {
                tier = 'premium-plus';
                editLimit = 100;
              } else if (priceId === process.env.VITE_STRIPE_PRICE_999) {
                tier = 'premium';
                editLimit = 50;
              } else if (priceId === process.env.VITE_STRIPE_PRICE_5) {
                tier = 'basic';
                editLimit = 50;
              }

              // Update user subscription details - preserve edit count for initial subscription/upgrades
              await storage.updateUserSubscription(userId, tier, editLimit, true, "active");

              // Get subscription details to set billing period
              const subscription = await stripe.subscriptions.retrieve(finalSubscriptionId);

              // Get billing period timestamps from subscription items (primary source)
              let periodStartTimestamp = null;
              let periodEndTimestamp = null;

              if (subscription.items?.data?.[0]) {
                const firstItem = subscription.items.data[0];
                periodStartTimestamp = firstItem.current_period_start;
                periodEndTimestamp = firstItem.current_period_end;
              }

              // Fallback to root subscription if items don't have the fields
              if (!periodStartTimestamp || !periodEndTimestamp) {
                periodStartTimestamp = subscription.current_period_start || periodStartTimestamp;
                periodEndTimestamp = subscription.current_period_end || periodEndTimestamp;
              }

              // Only update billing period if we have valid timestamps
              if (periodStartTimestamp && periodEndTimestamp && 
                  typeof periodStartTimestamp === 'number' && 
                  typeof periodEndTimestamp === 'number' &&
                  periodStartTimestamp > 0 && periodEndTimestamp > 0) {
                try {
                  const periodStart = new Date(periodStartTimestamp * 1000);
                  const periodEnd = new Date(periodEndTimestamp * 1000);

                  // Validate the dates are actually valid
                  if (!isNaN(periodStart.getTime()) && !isNaN(periodEnd.getTime()) && 
                      periodStart.getTime() > 0 && periodEnd.getTime() > 0) {
                    await storage.updateUserBillingPeriod(userId, periodStart, periodEnd);
                    console.log(`Billing period updated for user ${userId} on checkout completion`);
                  } else {
                    console.log(`Invalid billing period dates for user ${userId}, falling back to edit count reset`);
                    await storage.resetUserEditCount(userId);
                  }
                } catch (error) {
                  console.log(`Billing period update failed for user ${userId}, falling back to edit count reset:`, error.message);
                  await storage.resetUserEditCount(userId);
                }
              } else {
                // Fallback: If billing period timestamps are not available, reset edit count on subscription start
                console.log(`Missing billing period timestamps for user ${userId}, resetting edit count on subscription activation`);
                await storage.resetUserEditCount(userId);
              }

              console.log(`Subscription activated for user ${userId}: ${tier} plan`);
            }
          } catch (error) {
            console.error('Error processing subscription:', error);
          }
        }
        break;
      }
      case 'customer.subscription.updated': {
        const subscription = event.data.object;
        console.log('Subscription updated:', subscription.id, 'Status:', subscription.status);

        // Handle subscription status changes (active, canceled, etc.)
        if (subscription.status === 'canceled' || subscription.status === 'incomplete_expired') {
          // Find user by subscription ID and downgrade to free
          try {
            const users = await storage.getUserBySubscriptionId?.(subscription.id);
            if (users) {
              await storage.updateUserSubscription(users.id, 'free', 10, false, 'canceled');
              await storage.updateUserStripeInfo(users.id, users.stripeCustomerId || '', '');
              console.log(`Subscription canceled for user ${users.id}`);
            }
          } catch (error) {
            console.error('Error handling subscription cancellation:', error);
          }
        }
        break;
      }
      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        console.log('Subscription deleted:', subscription.id);

        // Find user by subscription ID and downgrade to free
        try {
          const users = await storage.getUserBySubscriptionId?.(subscription.id);
          if (users) {
            await storage.updateUserSubscription(users.id, 'free', 10, false, 'canceled');
            await storage.updateUserStripeInfo(users.id, users.stripeCustomerId || '', '');
            console.log(`Subscription deleted for user ${users.id}`);
          }
        } catch (error) {
          console.error('Error handling subscription deletion:', error);
        }
        break;
      }
      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    res.json({ received: true });
  });

  const httpServer = createServer(app);
  return httpServer;
}