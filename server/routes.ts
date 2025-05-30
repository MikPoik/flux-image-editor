import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertImageSchema, editHistorySchema } from "@shared/schema";
import { fal } from "@fal-ai/client";
import multer from "multer";

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
  // Upload image and create initial record
  app.post("/api/images/upload", upload.single('image'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No image file provided" });
      }

      // Upload image to Flux storage
      const file = new File([req.file.buffer], req.file.originalname, {
        type: req.file.mimetype,
      });
      
      const uploadedUrl = await fal.storage.upload(file);

      // Create image record
      const imageData = {
        originalUrl: uploadedUrl,
        currentUrl: uploadedUrl,
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
  app.post("/api/images/:id/edit", async (req, res) => {
    try {
      const { id } = req.params;
      const { prompt } = req.body;

      if (!prompt || typeof prompt !== 'string') {
        return res.status(400).json({ message: "Prompt is required" });
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

      // Update image record with new URL and history
      const newHistoryItem = {
        prompt,
        imageUrl: image.currentUrl,
        timestamp: new Date().toISOString(),
      };

      const updatedImage = await storage.updateImage(parseInt(id), {
        currentUrl: editedImageUrl,
        editHistory: [...(image.editHistory || []), newHistoryItem],
      });

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
        // Revert to specific edit
        targetUrl = image.editHistory[historyIndex].imageUrl;
        newHistory = image.editHistory.slice(0, historyIndex);
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

  const httpServer = createServer(app);
  return httpServer;
}
