import { Client } from "@replit/object-storage";
import sharp from "sharp";

export class ObjectStorageService {
  public client: Client;

  constructor() {
    this.client = new Client();
  }

  /**
   * Upload an image buffer to object storage in a user-specific folder
   */
  async uploadImage(
    userId: string,
    imageBuffer: Buffer,
    filename: string,
    contentType: string
  ): Promise<string> {
    const key = `${userId}/${Date.now()}-${filename}`;
    
    const { ok, error } = await this.client.uploadFromBytes(
      key,
      imageBuffer
    );

    if (!ok) {
      console.error("Object storage upload failed:", error);
      throw new Error(`Failed to upload image: ${error}`);
    }

    // Return the storage URL that points to our server endpoint
    return `/api/storage/${key}`;
  }

  /**
   * Download image from a URL and upload to object storage
   */
  async uploadImageFromUrl(
    userId: string,
    imageUrl: string,
    filename?: string
  ): Promise<string> {
    try {
      const response = await fetch(imageUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.statusText}`);
      }

      const buffer = Buffer.from(await response.arrayBuffer());
      const contentType = response.headers.get('content-type') || 'image/png';
      const finalFilename = filename || `image-${Date.now()}.png`;

      return await this.uploadImage(userId, buffer, finalFilename, contentType);
    } catch (error) {
      console.error("Error uploading image from URL:", error);
      throw error;
    }
  }

  /**
   * List all images for a specific user
   */
  async listUserImages(userId: string): Promise<string[]> {
    const { ok, value, error } = await this.client.list({
      prefix: `${userId}/`,
    });

    if (!ok) {
      console.error("Failed to list user images:", error);
      throw new Error(`Failed to list images: ${error}`);
    }

    return value.map((item: any) => `/api/storage/${item.key || item}`);
  }

  /**
   * Delete an image from object storage
   */
  async deleteImage(userId: string, filename: string): Promise<boolean> {
    const key = `${userId}/${filename}`;
    
    const { ok, error } = await this.client.delete(key);

    if (!ok) {
      console.error("Failed to delete image:", error);
      return false;
    }

    return true;
  }

  /**
   * Detect image orientation and return orientation info
   */
  async getImageOrientation(imageBuffer: Buffer): Promise<{ orientation?: number; needsRotation: boolean }> {
    try {
      const metadata = await sharp(imageBuffer).metadata();
      console.log("Original image metadata:", { 
        format: metadata.format, 
        orientation: metadata.orientation,
        width: metadata.width,
        height: metadata.height 
      });

      const needsRotation = metadata.orientation && metadata.orientation > 1;
      return {
        orientation: metadata.orientation,
        needsRotation: Boolean(needsRotation)
      };
    } catch (error) {
      console.error("Error getting image orientation:", error);
      return { needsRotation: false };
    }
  }

  /**
   * Auto-rotate image based on EXIF orientation data
   */
  async autoRotateImage(imageBuffer: Buffer): Promise<Buffer> {
    try {
      // Get image metadata to determine format
      const metadata = await sharp(imageBuffer).metadata();
      console.log("Image metadata:", { 
        format: metadata.format, 
        orientation: metadata.orientation,
        width: metadata.width,
        height: metadata.height 
      });

      let sharpInstance = sharp(imageBuffer);

      // Only rotate if there's an orientation that needs correction
      if (metadata.orientation && metadata.orientation > 1) {
        console.log("Applying EXIF rotation for orientation:", metadata.orientation);
        sharpInstance = sharpInstance.rotate(); // This applies EXIF rotation automatically
      }

      // Preserve original format and quality
      let rotatedBuffer: Buffer;
      if (metadata.format === 'jpeg') {
        rotatedBuffer = await sharpInstance
          .jpeg({ quality: 98, mozjpeg: true })
          .toBuffer();
      } else if (metadata.format === 'png') {
        rotatedBuffer = await sharpInstance
          .png({ quality: 95, compressionLevel: 6 })
          .toBuffer();
      } else if (metadata.format === 'webp') {
        rotatedBuffer = await sharpInstance
          .webp({ quality: 95 })
          .toBuffer();
      } else {
        // Default to high-quality JPEG for other formats
        rotatedBuffer = await sharpInstance
          .jpeg({ quality: 98, mozjpeg: true })
          .toBuffer();
      }
      
      console.log("Image auto-rotation completed successfully");
      return rotatedBuffer;
    } catch (error) {
      console.error("Error auto-rotating image:", error);
      return imageBuffer; // Return original if rotation fails
    }
  }

  /**
   * Apply rotation correction to FAL-processed image
   */
  async correctFalImageOrientation(imageBuffer: Buffer, originalOrientation?: number): Promise<Buffer> {
    try {
      // If no original orientation info, return as-is
      if (!originalOrientation || originalOrientation <= 1) {
        console.log("No orientation correction needed");
        return imageBuffer;
      }

      console.log("Applying orientation correction to FAL-processed image, original orientation:", originalOrientation);

      let sharpInstance = sharp(imageBuffer);

      // Apply specific rotation based on original EXIF orientation
      switch (originalOrientation) {
        case 2:
          sharpInstance = sharpInstance.flop(); // horizontal flip
          break;
        case 3:
          sharpInstance = sharpInstance.rotate(180);
          break;
        case 4:
          sharpInstance = sharpInstance.flip(); // vertical flip
          break;
        case 5:
          sharpInstance = sharpInstance.flip().rotate(90);
          break;
        case 6:
          sharpInstance = sharpInstance.rotate(90);
          break;
        case 7:
          sharpInstance = sharpInstance.flop().rotate(90);
          break;
        case 8:
          sharpInstance = sharpInstance.rotate(270);
          break;
        default:
          console.log("Unknown orientation value:", originalOrientation);
          return imageBuffer;
      }

      const correctedBuffer = await sharpInstance
        .jpeg({ quality: 98, mozjpeg: true })
        .toBuffer();
      
      console.log("FAL image orientation correction completed");
      return correctedBuffer;
    } catch (error) {
      console.error("Error correcting FAL image orientation:", error);
      return imageBuffer; // Return original if correction fails
    }
  }

  /**
   * Optimize image with specified dimensions and quality
   */
  async optimizeImage(
    imageBuffer: Buffer,
    width?: number,
    height?: number,
    quality: number = 80
  ): Promise<Buffer> {
    try {
      let sharpInstance = sharp(imageBuffer);
      
      // Resize if dimensions are specified
      if (width || height) {
        sharpInstance = sharpInstance.resize(width, height, {
          fit: 'inside',
          withoutEnlargement: true
        });
      }
      
      // Convert to JPEG with specified quality for better compression
      const optimized = await sharpInstance
        .jpeg({ quality, progressive: true })
        .toBuffer();
      
      return optimized;
    } catch (error) {
      console.error("Error optimizing image:", error);
      return imageBuffer; // Return original if optimization fails
    }
  }

  /**
   * Get optimized image data from object storage
   */
  async getOptimizedImageData(
    key: string,
    width?: number,
    height?: number,
    quality: number = 80
  ): Promise<{ buffer: Buffer; contentType: string } | null> {
    try {
      const result = await this.client.downloadAsBytes(key);

      if (!result.ok) {
        console.error("Failed to download image:", result.error);
        return null;
      }

      const { value } = result;
      let originalBuffer: Buffer;
      
      if (Array.isArray(value) && value.length > 0) {
        originalBuffer = value[0];
      } else if (Buffer.isBuffer(value)) {
        originalBuffer = value;
      } else if (value instanceof Uint8Array) {
        originalBuffer = Buffer.from(value);
      } else {
        console.error("Could not handle value type:", typeof value);
        return null;
      }

      // Optimize the image if dimensions or quality are specified
      const shouldOptimize = width || height || quality < 100;
      if (shouldOptimize) {
        const optimizedBuffer = await this.optimizeImage(originalBuffer, width, height, quality);
        return { buffer: optimizedBuffer, contentType: 'image/jpeg' };
      }

      // Return original with detected content type
      let contentType = 'image/png';
      if (key.toLowerCase().endsWith('.jpg') || key.toLowerCase().endsWith('.jpeg')) {
        contentType = 'image/jpeg';
      } else if (key.toLowerCase().endsWith('.gif')) {
        contentType = 'image/gif';
      } else if (key.toLowerCase().endsWith('.webp')) {
        contentType = 'image/webp';
      }

      return { buffer: originalBuffer, contentType };
    } catch (error) {
      console.error("Error getting optimized image data:", error);
      return null;
    }
  }

  /**
   * Get image data from object storage
   */
  async getImageData(key: string): Promise<Buffer | null> {
    try {
      const result = await this.client.downloadAsBytes(key);

      if (!result.ok) {
        console.error("Failed to download image:", result.error);
        return null;
      }

      // Handle the returned value - Replit object storage returns an array containing a Buffer
      const { value } = result;
      
      if (Array.isArray(value) && value.length > 0) {
        return value[0]; // Extract the Buffer from the array
      }
      
      // Fallback to other possible types
      if (Buffer.isBuffer(value)) {
        return value;
      }
      
      if (value instanceof Uint8Array) {
        return Buffer.from(value);
      }
      
      console.error("Could not handle value type:", typeof value);
      return null;
    } catch (error) {
      console.error("Error getting image data:", error);
      return null;
    }
  }

  /**
   * Extract the storage key from a full storage URL
   */
  private getKeyFromUrl(url: string): string | null {
    const match = url.match(/\/api\/storage\/(.+)$/);
    return match ? match[1] : null;
  }

  /**
   * Delete an image using its full storage URL
   */
  async deleteImageByUrl(url: string): Promise<boolean> {
    const key = this.getKeyFromUrl(url);
    if (!key) {
      console.error("Invalid storage URL:", url);
      return false;
    }

    const { ok, error } = await this.client.delete(key);

    if (!ok) {
      console.error("Failed to delete image by URL:", error);
      return false;
    }

    return true;
  }

  /**
   * Check if a URL is accessible (not expired)
   */
  async isUrlValid(url: string): Promise<boolean> {
    try {
      const response = await fetch(url, { method: 'HEAD' });
      return response.ok;
    } catch (error) {
      console.error("URL validation failed:", error);
      return false;
    }
  }

  /**
   * Migrate an external image URL to permanent storage
   */
  async migrateImageToPermanentStorage(
    userId: string,
    imageUrl: string,
    filename?: string
  ): Promise<string | null> {
    try {
      // Check if URL is still valid first
      const isValid = await this.isUrlValid(imageUrl);
      if (!isValid) {
        console.log("URL is no longer valid:", imageUrl);
        return null;
      }

      // Download and upload to permanent storage
      const permanentUrl = await this.uploadImageFromUrl(userId, imageUrl, filename);
      console.log("Image migrated to permanent storage:", permanentUrl);
      return permanentUrl;
    } catch (error) {
      console.error("Error migrating image to permanent storage:", error);
      return null;
    }
  }
}

export const objectStorage = new ObjectStorageService();