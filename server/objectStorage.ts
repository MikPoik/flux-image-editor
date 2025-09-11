import { Storage } from "@google-cloud/storage";
import sharp from "sharp";

export class ObjectStorageService {
  public storage: Storage;
  public bucketName: string;

  constructor() {
    // Check if GCP environment variables are configured
    if (!process.env.GCP_BUCKET_NAME) {
      console.warn('GCP_BUCKET_NAME not configured - object storage will not function until GCP credentials are provided');
      // Initialize with dummy values to prevent crashes during development
      this.storage = new Storage();
      this.bucketName = 'dummy-bucket';
      return;
    }

    this.bucketName = process.env.GCP_BUCKET_NAME;

    // Initialize Google Cloud Storage client with HMAC key authentication
    const storageOptions: any = {
      projectId: process.env.GCP_PROJECT_ID,
    };

    // Configure HMAC key credentials if provided (simpler than service account JSON)
    if (process.env.GCP_ACCESS_KEY_ID && process.env.GCP_SECRET_ACCESS_KEY) {
      storageOptions.credentials = {
        client_email: 'hmac-service-account@dummy.iam.gserviceaccount.com', // Dummy email for HMAC
        private_key: '-----BEGIN PRIVATE KEY-----\nDUMMY\n-----END PRIVATE KEY-----', // Dummy key for HMAC
      };
      
      // Configure HMAC key authentication
      storageOptions.apiEndpoint = 'https://storage.googleapis.com';
      storageOptions.useAuthHeader = true;
      
      console.log('GCP credentials configured with HMAC key:', process.env.GCP_ACCESS_KEY_ID);
    } else {
      console.warn('No GCP HMAC credentials provided. Set GCP_ACCESS_KEY_ID and GCP_SECRET_ACCESS_KEY environment variables.');
      console.warn('Object storage operations will fail until credentials are configured.');
    }

    this.storage = new Storage(storageOptions);

    // Perform startup self-check
    this.validateConnection();
  }

  /**
   * Validate GCS connection and bucket access
   */
  private async validateConnection(): Promise<void> {
    try {
      const bucket = this.storage.bucket(this.bucketName);
      const [exists] = await bucket.exists();
      if (!exists) {
        console.error(`GCS bucket '${this.bucketName}' does not exist`);
      } else {
        console.log(`GCS bucket '${this.bucketName}' connection validated successfully`);
      }
    } catch (error) {
      console.error('GCS connection validation failed:', error);
    }
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
    
    try {
      const bucket = this.storage.bucket(this.bucketName);
      const file = bucket.file(key);
      
      await file.save(imageBuffer, {
        metadata: {
          contentType: contentType,
          cacheControl: 'public, max-age=31536000',
        },
      });

      console.log(`Image uploaded successfully: ${key}`);
      
      // Return the storage URL that points to our server endpoint
      return `/api/storage/${key}`;
    } catch (error) {
      console.error("GCS upload failed:", error);
      throw new Error(`Failed to upload image: ${error}`);
    }
  }

  /**
   * Upload an image buffer to temporary storage for API processing
   */
  async uploadTempImage(
    imageBuffer: Buffer,
    filename: string,
    contentType: string
  ): Promise<string> {
    const key = `temp/${Date.now()}-${filename}`;
    
    try {
      const bucket = this.storage.bucket(this.bucketName);
      const file = bucket.file(key);
      
      await file.save(imageBuffer, {
        metadata: {
          contentType: contentType,
          cacheControl: 'public, max-age=3600', // 1 hour for temp files
        },
      });

      console.log(`Temp image uploaded successfully: ${key}`);
      
      // Return the full URL that can be accessed externally
      return `https://${process.env.REPL_ID || 'unknown'}.replit.app/api/storage/${key}`;
    } catch (error) {
      console.error("GCS temp upload failed:", error);
      throw new Error(`Failed to upload temp image: ${error}`);
    }
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
    try {
      const bucket = this.storage.bucket(this.bucketName);
      const [files] = await bucket.getFiles({
        prefix: `${userId}/`,
      });

      return files.map((file) => `/api/storage/${file.name}`);
    } catch (error) {
      console.error("Failed to list user images:", error);
      throw new Error(`Failed to list images: ${error}`);
    }
  }

  /**
   * Delete an image from object storage
   */
  async deleteImage(userId: string, filename: string): Promise<boolean> {
    const key = `${userId}/${filename}`;
    
    try {
      const bucket = this.storage.bucket(this.bucketName);
      await bucket.file(key).delete();
      console.log(`Image deleted successfully: ${key}`);
      return true;
    } catch (error) {
      console.error("Failed to delete image:", error);
      return false;
    }
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
      const bucket = this.storage.bucket(this.bucketName);
      const file = bucket.file(key);
      const [buffer] = await file.download();

      // Optimize the image if dimensions or quality are specified
      const shouldOptimize = width || height || quality < 100;
      if (shouldOptimize) {
        const optimizedBuffer = await this.optimizeImage(buffer, width, height, quality);
        return { buffer: optimizedBuffer, contentType: 'image/jpeg' };
      }

      // Get content type from GCS metadata for better accuracy
      let contentType = 'image/png';
      try {
        const [metadata] = await file.getMetadata();
        contentType = metadata.contentType || contentType;
      } catch (error) {
        // Fallback to extension-based detection if metadata fails
        console.warn('Failed to get metadata, using extension-based content type detection:', error);
        if (key.toLowerCase().endsWith('.jpg') || key.toLowerCase().endsWith('.jpeg')) {
          contentType = 'image/jpeg';
        } else if (key.toLowerCase().endsWith('.gif')) {
          contentType = 'image/gif';
        } else if (key.toLowerCase().endsWith('.webp')) {
          contentType = 'image/webp';
        }
      }

      return { buffer, contentType };
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
      const bucket = this.storage.bucket(this.bucketName);
      const file = bucket.file(key);
      const [buffer] = await file.download();
      return buffer;
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

    try {
      const bucket = this.storage.bucket(this.bucketName);
      await bucket.file(key).delete();
      console.log(`Image deleted successfully by URL: ${key}`);
      return true;
    } catch (error) {
      console.error("Failed to delete image by URL:", error);
      return false;
    }
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
      // Skip URL validation for FAL URLs and attempt direct download
      console.log("Attempting to migrate image to permanent storage:", imageUrl);
      
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