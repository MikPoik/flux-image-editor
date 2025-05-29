import { images, type Image, type InsertImage } from "@shared/schema";

export interface IStorage {
  createImage(image: InsertImage): Promise<Image>;
  getImage(id: number): Promise<Image | undefined>;
  updateImage(id: number, updates: Partial<InsertImage>): Promise<Image | undefined>;
}

export class MemStorage implements IStorage {
  private images: Map<number, Image>;
  private currentId: number;

  constructor() {
    this.images = new Map();
    this.currentId = 1;
  }

  async createImage(insertImage: InsertImage): Promise<Image> {
    const id = this.currentId++;
    const image: Image = {
      ...insertImage,
      id,
      createdAt: new Date(),
    };
    this.images.set(id, image);
    return image;
  }

  async getImage(id: number): Promise<Image | undefined> {
    return this.images.get(id);
  }

  async updateImage(id: number, updates: Partial<InsertImage>): Promise<Image | undefined> {
    const existing = this.images.get(id);
    if (!existing) return undefined;

    const updated: Image = {
      ...existing,
      ...updates,
    };
    this.images.set(id, updated);
    return updated;
  }
}

export const storage = new MemStorage();
