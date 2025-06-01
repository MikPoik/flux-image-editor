import { Client } from "@replit/object-storage";

export class ObjectStorageService {
  private client: Client;
  private bucketName = "kontext-images";

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

    // Return the storage URL
    return `https://storage.replit.com/${this.bucketName}/${key}`;
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

    return value.map((item: any) => `https://storage.replit.com/${this.bucketName}/${item.key || item}`);
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
   * Extract the storage key from a full storage URL
   */
  private getKeyFromUrl(url: string): string | null {
    const match = url.match(/https:\/\/storage\.replit\.com\/kontext-images\/(.+)$/);
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
}

export const objectStorage = new ObjectStorageService();