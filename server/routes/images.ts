import type { Express } from "express";
import { storage } from "../storage";
import { insertImageSchema } from "@shared/schema";
import { fal } from "@fal-ai/client";
import multer from "multer";
import { isAuthenticated } from "../replitAuth";
import { objectStorage } from "../objectStorage";

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

export function setupImageRoutes(app: Express) {
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

      // Check if user has enough credits (3 credits per generation)
      const GENERATION_COST = 3;
      if (user.credits < GENERATION_COST) {
        return res.status(403).json({ 
          message: "Not enough credits. Please upgrade your subscription to continue generating images.",
          credits: user.credits,
          requiredCredits: GENERATION_COST
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

      // Deduct credits for generation
      await storage.deductCredits(userId, GENERATION_COST);

      res.json(image);
    } catch (error) {
      console.error("Generation error:", error);
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to generate image" 
      });
    }
  });

  // Multi-image generation using Flux AI
  app.post("/api/images/multi-generate", isAuthenticated, upload.array('images', 5), async (req: any, res) => {
    try {
      const { prompt } = req.body;
      const files = req.files as Express.Multer.File[];

      if (!prompt || typeof prompt !== 'string') {
        return res.status(400).json({ message: "Prompt is required" });
      }

      if (!files || files.length < 2) {
        return res.status(400).json({ message: "At least 2 images are required for multi-image generation" });
      }

      if (files.length > 5) {
        return res.status(400).json({ message: "Maximum 5 images allowed" });
      }

      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Check if user has enough credits (5 credits per multi-image generation)
      const MULTI_GENERATION_COST = 5;
      if (user.credits < MULTI_GENERATION_COST) {
        return res.status(403).json({ 
          message: "Not enough credits. Please upgrade your subscription to continue generating images.",
          credits: user.credits,
          requiredCredits: MULTI_GENERATION_COST
        });
      }

      // Upload all images to Fal storage and get URLs
      const imageUrls: string[] = [];
      for (const file of files) {
        // Process image locally - detect orientation and apply correction
        const correctedImageBuffer = await objectStorage.autoRotateImage(file.buffer);
        
        // Create a File object and upload to FAL storage
        const fileObj = new File([correctedImageBuffer], file.originalname, {
          type: file.mimetype,
        });
        
        const falUrl = await fal.storage.upload(fileObj);
        imageUrls.push(falUrl);
        console.log("Uploaded image to FAL storage:", falUrl);
      }

      console.log(`Multi-image generation with ${imageUrls.length} images for user tier: ${user.subscriptionTier}`);

      // Call Flux AI multi-image API
      const result = await fal.subscribe("fal-ai/flux-pro/kontext/max/multi", {
        input: {
          prompt: prompt,
          image_urls: imageUrls,
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
      console.log("FAL AI generated multi-image URL:", generatedImageUrl);

      // Try to migrate the image to permanent storage
      let permanentUrl = await objectStorage.migrateImageToPermanentStorage(
        userId,
        generatedImageUrl,
        `multi-generated-${Date.now()}`
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
          prompt: `Multi-image generated: ${prompt}`,
          imageUrl: permanentUrl,
          timestamp: new Date().toISOString(),
        }]
      };

      const validatedData = insertImageSchema.parse(imageData);
      const image = await storage.createImage(validatedData);

      // Deduct credits for multi-image generation
      await storage.deductCredits(userId, MULTI_GENERATION_COST);

      res.json(image);
    } catch (error) {
      console.error("Multi-image generation error:", error);
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to generate multi-image" 
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

      // Check if user has enough credits (2 credits per edit)
      const EDIT_COST = 2;
      if (user.credits < EDIT_COST) {
        return res.status(403).json({ 
          message: "Not enough credits. Please upgrade your subscription to continue editing.",
          credits: user.credits,
          requiredCredits: EDIT_COST
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
          safety_tolerance: 5,
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

      // Deduct credits for edit
      await storage.deductCredits(userId, EDIT_COST);

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
  app.get("/api/images/:id", isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.claims.sub;
      const image = await storage.getImage(parseInt(id));

      if (!image) {
        return res.status(404).json({ message: "Image not found" });
      }

      // Check if user owns the image
      if (image.userId !== userId) {
        return res.status(403).json({ message: "Unauthorized to access this image" });
      }

      res.json(image);
    } catch (error) {
      console.error("Get image error:", error);
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to get image" 
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
}