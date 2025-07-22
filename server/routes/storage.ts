import type { Express } from "express";
import { storage } from "../storage";
import { isAuthenticated } from "../replitAuth";
import { objectStorage } from "../objectStorage";

export function setupStorageRoutes(app: Express) {
  // Serve images from object storage with optimization support
  app.get("/api/storage/:key(*)", isAuthenticated, async (req: any, res) => {
    try {
      const { key } = req.params;
      const { w, h, q } = req.query;
      const userId = req.user.claims.sub;

      // Allow temp images to be accessed without user verification (for API processing)
      const isTemp = key.startsWith('temp/');
      if (!isTemp) {
        // Extract user ID from key path and verify ownership for non-temp images
        const keyUserId = key.split('/')[0];
        if (keyUserId !== userId) {
          return res.status(403).json({ message: "Unauthorized to access this image" });
        }
      }

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
  app.get("/api/image-fallback/:imageId", isAuthenticated, async (req: any, res) => {
    try {
      const { imageId } = req.params;
      const { w, h, q } = req.query;
      const userId = req.user.claims.sub;

      // Parse optimization parameters
      const width = w ? parseInt(w as string) : undefined;
      const height = h ? parseInt(h as string) : undefined;
      const quality = q ? parseInt(q as string) : 80;

      // Get image from database
      const image = await storage.getImage(parseInt(imageId));
      if (!image) {
        return res.status(404).json({ message: "Image not found" });
      }

      // Check if user owns the image
      if (image.userId !== userId) {
        return res.status(403).json({ message: "Unauthorized to access this image" });
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
}