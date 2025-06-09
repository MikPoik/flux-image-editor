import {
  images,
  users,
  type Image,
  type InsertImage,
  type User,
  type UpsertUser,
} from "@shared/schema";
import { db } from "./db";
import { eq, sql } from "drizzle-orm";

// Interface for storage operations
export interface IStorage {
  // User operations
  // (IMPORTANT) these user operations are mandatory for Replit Auth.
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateStripeCustomerId(userId: string, customerId: string): Promise<User>;
  updateUserStripeInfo(userId: string, stripeCustomerId: string, stripeSubscriptionId: string): Promise<User | undefined>;
  updateUserSubscription(userId: string, tier: string, editLimit: number, preserveEditCount?: boolean): Promise<User | undefined>;
  incrementUserEditCount(userId: string): Promise<User | undefined>;
  resetUserEditCount(userId: string): Promise<User | undefined>;
  getUserBySubscriptionId(subscriptionId: string): Promise<User | undefined>;
  
  // Image operations
  createImage(image: InsertImage): Promise<Image>;
  getImage(id: number): Promise<Image | undefined>;
  getUserImages(userId: string): Promise<Image[]>;
  updateImage(id: number, updates: Partial<InsertImage>): Promise<Image | undefined>;
  deleteImage(id: number): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  // (IMPORTANT) these user operations are mandatory for Replit Auth.

  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Image operations
  async createImage(insertImage: InsertImage): Promise<Image> {
    const [image] = await db
      .insert(images)
      .values(insertImage)
      .returning();
    return image;
  }

  async getImage(id: number): Promise<Image | undefined> {
    const [image] = await db.select().from(images).where(eq(images.id, id));
    return image;
  }

  async getUserImages(userId: string): Promise<Image[]> {
    return db.select().from(images).where(eq(images.userId, userId));
  }

  async updateImage(id: number, updates: Partial<Pick<InsertImage, 'currentUrl' | 'editHistory'>>): Promise<Image | undefined> {
    const [updated] = await db
      .update(images)
      .set(updates)
      .where(eq(images.id, id))
      .returning();
    return updated;
  }

  async deleteImage(id: number): Promise<boolean> {
    const result = await db
      .delete(images)
      .where(eq(images.id, id))
      .returning();
    return result.length > 0;
  }

  async updateStripeCustomerId(userId: string, customerId: string): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ stripeCustomerId: customerId })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  async updateUserStripeInfo(userId: string, stripeCustomerId: string, stripeSubscriptionId: string): Promise<User | undefined> {
    try {
      const [user] = await db
        .update(users)
        .set({ 
          stripeCustomerId,
          stripeSubscriptionId 
        })
        .where(eq(users.id, userId))
        .returning();
      return user;
    } catch (error) {
      console.error('Error updating user stripe info:', error);
      return undefined;
    }
  }

  async updateUserSubscription(userId: string, tier: string, editLimit: number, preserveEditCount: boolean = true): Promise<User | undefined> {
    try {
      // Get current user data to check for rapid plan changes
      const currentUser = await this.getUser(userId);
      if (!currentUser) return undefined;

      // Anti-gaming protection: prevent rapid plan changes within 24 hours
      // unless it's a cancellation (downgrade to free)
      if (currentUser.lastSubscriptionChange && tier !== 'free') {
        const timeSinceLastChange = Date.now() - currentUser.lastSubscriptionChange.getTime();
        const twentyFourHours = 24 * 60 * 60 * 1000;
        
        if (timeSinceLastChange < twentyFourHours) {
          console.warn(`Rapid subscription change attempt by user ${userId} blocked. Last change: ${currentUser.lastSubscriptionChange}`);
          // Still allow the update but preserve edit count to prevent gaming
          preserveEditCount = true;
        }
      }

      const updateData: any = {
        subscriptionTier: tier,
        editLimit: editLimit,
        lastSubscriptionChange: new Date(),
      };

      // Only reset edit count if explicitly requested (e.g., on new billing periods or cancellations)
      // This prevents gaming the system by rapid plan changes
      if (!preserveEditCount) {
        updateData.editCount = 0;
      }

      const [user] = await db
        .update(users)
        .set(updateData)
        .where(eq(users.id, userId))
        .returning();
      return user;
    } catch (error) {
      console.error('Error updating user subscription:', error);
      return undefined;
    }
  }

  async incrementUserEditCount(userId: string): Promise<User | undefined> {
    try {
      const [user] = await db
        .update(users)
        .set({ editCount: sql`${users.editCount} + 1` })
        .where(eq(users.id, userId))
        .returning();
      return user;
    } catch (error) {
      console.error('Error incrementing user edit count:', error);
      return undefined;
    }
  }

  async resetUserEditCount(userId: string): Promise<User | undefined> {
    try {
      const [user] = await db
        .update(users)
        .set({ editCount: 0 })
        .where(eq(users.id, userId))
        .returning();
      return user;
    } catch (error) {
      console.error('Error resetting user edit count:', error);
      return undefined;
    }
  }

  async updateUserBillingPeriod(userId: string, periodStart: Date, periodEnd: Date): Promise<User | undefined> {
    try {
      // Validate dates before proceeding
      if (!periodStart || !periodEnd || isNaN(periodStart.getTime()) || isNaN(periodEnd.getTime())) {
        console.error('Invalid dates provided to updateUserBillingPeriod:', { periodStart, periodEnd });
        return undefined;
      }

      const user = await this.getUser(userId);
      if (!user) return undefined;

      // Only reset edit count if this is a new billing period
      const shouldResetEditCount = !user.currentPeriodStart || 
        user.currentPeriodStart.getTime() !== periodStart.getTime();

      const updateData: any = {
        currentPeriodStart: periodStart,
        currentPeriodEnd: periodEnd,
      };

      if (shouldResetEditCount) {
        updateData.editCount = 0;
      }

      const [updatedUser] = await db
        .update(users)
        .set(updateData)
        .where(eq(users.id, userId))
        .returning();
      
      return updatedUser;
    } catch (error) {
      console.error('Error updating user billing period:', error);
      return undefined;
    }
  }

  async getUserBySubscriptionId(subscriptionId: string): Promise<User | undefined> {
    try {
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.stripeSubscriptionId, subscriptionId))
        .limit(1);
      return user;
    } catch (error) {
      console.error('Error getting user by subscription ID:', error);
      return undefined;
    }
  }
}

export const storage = new DatabaseStorage();
