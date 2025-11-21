import {
  images,
  users,
  type Image,
  type InsertImage,
  type User,
  type UpsertUser,
} from "@shared/schema";
import { db } from "./db";
import { eq, sql, desc, and, gte } from "drizzle-orm";

// Interface for storage operations
export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateStripeCustomerId(userId: string, customerId: string): Promise<User>;
  updateUserStripeInfo(userId: string, stripeCustomerId: string, stripeSubscriptionId: string): Promise<User | undefined>;
  updateUserSubscription(userId: string, tier: string, preserveCredits?: boolean, subscriptionStatus?: string): Promise<User | undefined>;
  deductCredits(userId: string, operation: 'edit' | 'generation' | 'multi-generation' | 'upscale'): Promise<boolean>;
  refreshCredits(userId: string): Promise<User | undefined>;
  addCredits(userId: string, amount: number): Promise<User | undefined>;
  updateUserBillingPeriod(userId: string, periodStart: Date, periodEnd: Date): Promise<User | undefined>;
  triggerBillingPeriodReset(userId: string): Promise<User | undefined>;
  updateUserSubscriptionStatus(userId: string, status: string): Promise<User | undefined>;
  getUserBySubscriptionId(subscriptionId: string): Promise<User | undefined>;
  getUserByCustomerId(customerId: string): Promise<User | undefined>;

  // Image operations
  createImage(image: InsertImage): Promise<Image>;
  getImage(id: number): Promise<Image | undefined>;
  getUserImages(userId: string, limit?: number, offset?: number): Promise<{images: Image[], total: number}>;
  updateImage(id: number, updates: Partial<InsertImage>): Promise<Image | undefined>;
  deleteImage(id: number): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    // If user doesn't exist, create a record with defaults
    if (!user) {
      try {
        const [newUser] = await db
          .insert(users)
          .values({
            id,
            subscriptionTier: 'free',
            credits: 30,
            maxCredits: 30,
            subscriptionStatus: 'active',
          })
          .onConflictDoNothing()
          .returning();
        return newUser;
      } catch {
        // If creation fails, just return undefined
        return undefined;
      }
    }
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
    const imageData: any = { ...insertImage };
    if (imageData.editHistory) {
      imageData.editHistory = Array.isArray(imageData.editHistory) ? imageData.editHistory : [];
    }
    const [image] = await db
      .insert(images)
      .values(imageData)
      .returning();
    return image;
  }

  async getImage(id: number): Promise<Image | undefined> {
    const [image] = await db.select().from(images).where(eq(images.id, id));
    return image;
  }

  async getUserImages(userId: string, limit: number = 50, offset: number = 0): Promise<{images: Image[], total: number}> {
    const [totalResult] = await db
      .select({ count: sql`count(*)` })
      .from(images)
      .where(eq(images.userId, userId));

    const total = Number(totalResult.count);

    const imageResults = await db
      .select()
      .from(images)
      .where(eq(images.userId, userId))
      .orderBy(desc(images.createdAt))
      .limit(limit)
      .offset(offset);

    return { images: imageResults, total };
  }

  async updateImage(id: number, updates: Partial<Pick<InsertImage, 'currentUrl' | 'editHistory'>>): Promise<Image | undefined> {
    const updateData: any = { ...updates };
    if (updateData.editHistory && Array.isArray(updateData.editHistory)) {
      updateData.editHistory = updateData.editHistory;
    }
    const [updated] = await db
      .update(images)
      .set(updateData)
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

  private getCreditLimitsByTier(tier: string): number {
    switch (tier) {
      case 'basic':
        return 120;
      case 'premium':
        return 200;
      case 'premium-plus':
        return 300;
      case 'free':
      default:
        return 30;
    }
  }

  async updateUserSubscription(userId: string, tier: string, preserveCredits: boolean = true, subscriptionStatus: string = "active"): Promise<User | undefined> {
    try {
      const currentUser = await this.getUser(userId);
      if (!currentUser) return undefined;

      const isBillingPeriodReset = currentUser.currentPeriodStart && 
        currentUser.currentPeriodEnd && 
        Date.now() > currentUser.currentPeriodEnd.getTime();

      if (currentUser.lastSubscriptionChange && tier !== 'free' && !isBillingPeriodReset) {
        const timeSinceLastChange = Date.now() - currentUser.lastSubscriptionChange.getTime();
        const twentyFourHours = 24 * 60 * 60 * 1000;

        if (timeSinceLastChange < twentyFourHours) {
          console.log(`Rapid subscription change attempt by user ${userId} blocked.`);
          preserveCredits = true;
        }
      }

      const maxCredits = this.getCreditLimitsByTier(tier);
      const updateData: any = {
        subscriptionTier: tier,
        maxCredits: maxCredits,
        subscriptionStatus: subscriptionStatus,
        lastSubscriptionChange: new Date(),
      };

      if (!preserveCredits) {
        updateData.credits = maxCredits;
        const nextReset = new Date();
        nextReset.setMonth(nextReset.getMonth() + 1);
        updateData.creditsResetDate = nextReset;
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

  async deductCredits(userId: string, operation: 'edit' | 'generation' | 'multi-generation' | 'upscale'): Promise<boolean> {
    try {
      const creditCosts = {
        'edit': 1,
        'generation': 1,
        'multi-generation': 1,
        'upscale': 0
      };

      const cost = creditCosts[operation];
      if (cost === undefined) {
        console.error(`Invalid operation: ${operation}`);
        return false;
      }

      const [user] = await db
        .update(users)
        .set({ credits: sql`${users.credits} - ${cost}` })
        .where(and(eq(users.id, userId), gte(users.credits, cost)))
        .returning();

      return user !== undefined;
    } catch (error) {
      console.error('Error deducting credits:', error);
      return false;
    }
  }

  async refreshCredits(userId: string): Promise<User | undefined> {
    try {
      const currentUser = await this.getUser(userId);
      if (!currentUser) return undefined;

      const [user] = await db
        .update(users)
        .set({ 
          credits: currentUser.maxCredits,
          creditsResetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        })
        .where(eq(users.id, userId))
        .returning();
      return user;
    } catch (error) {
      console.error('Error refreshing credits:', error);
      return undefined;
    }
  }

  async addCredits(userId: string, amount: number): Promise<User | undefined> {
    try {
      const [user] = await db
        .update(users)
        .set({ credits: sql`${users.credits} + ${amount}` })
        .where(eq(users.id, userId))
        .returning();
      return user;
    } catch (error) {
      console.error('Error adding credits:', error);
      return undefined;
    }
  }

  async updateUserSubscriptionStatus(userId: string, status: string): Promise<User | undefined> {
    try {
      const [updatedUser] = await db
        .update(users)
        .set({
          subscriptionStatus: status,
          updatedAt: new Date()
        })
        .where(eq(users.id, userId))
        .returning();

      return updatedUser;
    } catch (error) {
      console.error("Error updating user subscription status:", error);
      return undefined;
    }
  }

  async updateUserBillingPeriod(userId: string, periodStart: Date, periodEnd: Date): Promise<User | undefined> {
    try {
      if (!periodStart || !periodEnd || 
          isNaN(periodStart.getTime()) || isNaN(periodEnd.getTime()) ||
          periodStart.getTime() <= 0 || periodEnd.getTime() <= 0) {
        console.log('Invalid dates provided to updateUserBillingPeriod');
        return undefined;
      }

      const user = await this.getUser(userId);
      if (!user) {
        console.log('User not found for billing period update:', userId);
        return undefined;
      }

      const shouldResetCredits = !user.currentPeriodStart || 
        user.currentPeriodStart.getTime() !== periodStart.getTime();

      const updateData: any = {
        currentPeriodStart: periodStart,
        currentPeriodEnd: periodEnd,
      };

      if (shouldResetCredits) {
        updateData.credits = user.maxCredits;
        updateData.creditsResetDate = periodEnd;
        console.log(`Resetting credits for user ${userId}`);
      }

      const [updatedUser] = await db
        .update(users)
        .set(updateData)
        .where(eq(users.id, userId))
        .returning();

      return updatedUser;
    } catch (error: any) {
      console.log('Skipping billing period update due to error:', error?.message || error);
      return undefined;
    }
  }

  async triggerBillingPeriodReset(userId: string): Promise<User | undefined> {
    try {
      const now = new Date();
      const nextMonth = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

      const user = await this.getUser(userId);
      if (!user) return undefined;

      const [updatedUser] = await db
        .update(users)
        .set({
          currentPeriodStart: now,
          currentPeriodEnd: nextMonth,
          credits: user.maxCredits,
          creditsResetDate: nextMonth,
        })
        .where(eq(users.id, userId))
        .returning();

      console.log(`Manual billing period reset triggered for user ${userId}`);
      return updatedUser;
    } catch (error) {
      console.error('Error triggering billing period reset:', error);
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

  async getUserByCustomerId(customerId: string): Promise<User | undefined> {
    try {
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.stripeCustomerId, customerId))
        .limit(1);
      return user;
    } catch (error) {
      console.error('Error getting user by customer ID:', error);
      return undefined;
    }
  }
}

export const storage = new DatabaseStorage();
