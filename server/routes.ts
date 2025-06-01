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

      // Upload image to Flux storage first for processing
      const file = new File([req.file.buffer], req.file.originalname, {
        type: req.file.mimetype,
      });
      
      const uploadedUrl = await fal.storage.upload(file);

      // Also upload to Replit object storage for permanent storage
      const permanentUrl = await objectStorage.uploadImage(
        userId,
        req.file.buffer,
        req.file.originalname,
        req.file.mimetype
      );

      // Create image record with both URLs
      const imageData = {
        userId,
        originalUrl: permanentUrl, // Use permanent storage as original
        currentUrl: uploadedUrl, // Keep FAL URL for processing
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

      // Call Flux AI API
      const result = await fal.subscribe("fal-ai/flux-pro/kontext", {
        input: {
          prompt: prompt,
          image_url: image.currentUrl,
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

      // Save edited image to permanent storage
      const permanentEditedUrl = await objectStorage.uploadImageFromUrl(
        userId,
        editedImageUrl,
        `edited-${Date.now()}.png`
      );

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

  // Serve images from object storage
  app.get("/api/storage/*", async (req, res) => {
    try {
      const key = req.url.replace('/api/storage/', ''); // Get everything after /api/storage/
      
      if (!key) {
        return res.status(400).json({ message: "Image key is required" });
      }

      const imageData = await objectStorage.getImageData(key);
      
      if (!imageData) {
        return res.status(404).json({ message: "Image not found" });
      }

      // Set appropriate headers
      res.set({
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=31536000', // Cache for 1 year
      });
      
      res.send(imageData);
    } catch (error) {
      console.error("Serve image error:", error);
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to serve image" 
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

  // Stripe subscription routes
  app.post('/api/create-subscription', isAuthenticated, async (req: any, res) => {
    try {
      const { priceId } = req.body;
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);

      if (!user || !user.email) {
        return res.status(400).json({ message: "User email not found" });
      }

      // If user already has a subscription, return existing subscription
      if (user.stripeSubscriptionId) {
        const subscription = await stripe.subscriptions.retrieve(user.stripeSubscriptionId);
        const latestInvoice = typeof subscription.latest_invoice === 'string' 
          ? await stripe.invoices.retrieve(subscription.latest_invoice)
          : subscription.latest_invoice;
        
        return res.json({
          subscriptionId: subscription.id,
          clientSecret: typeof latestInvoice?.payment_intent === 'string' 
            ? (await stripe.paymentIntents.retrieve(latestInvoice.payment_intent)).client_secret
            : latestInvoice?.payment_intent?.client_secret,
        });
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

      // Create subscription
      const subscription = await stripe.subscriptions.create({
        customer: customerId,
        items: [{ price: priceId }],
        payment_behavior: 'default_incomplete',
        payment_settings: { save_default_payment_method: 'on_subscription' },
        expand: ['latest_invoice.payment_intent'],
      });

      // Update user with subscription info
      await storage.updateUserStripeInfo(userId, customerId, subscription.id);

      // Determine subscription tier and edit limit based on price
      let tier = 'basic';
      let editLimit = 50;
      
      // You'll need to create these price IDs in your Stripe dashboard
      // For now, I'll use placeholder logic - you can update this with your actual price IDs
      if (priceId.includes('premium') || priceId.includes('10')) {
        tier = 'premium';
        editLimit = 100;
      }

      // Update user subscription details
      await storage.updateUserSubscription(userId, tier, editLimit);

      const latestInvoice = typeof subscription.latest_invoice === 'string' 
        ? await stripe.invoices.retrieve(subscription.latest_invoice)
        : subscription.latest_invoice;
      
      res.json({
        subscriptionId: subscription.id,
        clientSecret: typeof latestInvoice?.payment_intent === 'string' 
          ? (await stripe.paymentIntents.retrieve(latestInvoice.payment_intent)).client_secret
          : latestInvoice?.payment_intent?.client_secret,
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

      res.json({
        subscriptionTier: user.subscriptionTier || 'free',
        editCount: user.editCount || 0,
        editLimit: user.editLimit || 10,
        hasActiveSubscription: !!user.stripeSubscriptionId,
      });
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

    // Handle the event
    switch (event.type) {
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted':
        const subscription = event.data.object;
        // Handle subscription status changes
        console.log('Subscription event:', event.type, subscription.id);
        break;
      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    res.json({ received: true });
  });

  const httpServer = createServer(app);
  return httpServer;
}
