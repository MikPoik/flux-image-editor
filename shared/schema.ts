import { pgTable, text, serial, timestamp, json, varchar, index, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: json("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  stripeCustomerId: varchar("stripe_customer_id"),
  stripeSubscriptionId: varchar("stripe_subscription_id"),
  subscriptionTier: varchar("subscription_tier"), // 'free', 'basic', 'premium', 'premium-plus'
  credits: integer("credits").default(30).notNull(), // Current available credits
  maxCredits: integer("max_credits").default(30).notNull(), // Maximum credits for current tier
  creditsResetDate: timestamp("credits_reset_date"), // Next credit reset date
  subscriptionStatus: varchar("subscription_status").default("active"), // 'active', 'canceled', 'past_due'
  currentPeriodStart: timestamp("current_period_start"),
  currentPeriodEnd: timestamp("current_period_end"),
  lastSubscriptionChange: timestamp("last_subscription_change"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const images = pgTable("images", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  originalUrl: text("original_url").notNull(),
  currentUrl: text("current_url").notNull(),
  editHistory: json("edit_history").$type<EditHistoryItem[]>().default([]),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const editHistorySchema = z.object({
  prompt: z.string(),
  imageUrl: z.string(),
  timestamp: z.string(),
});

export const insertImageSchema = createInsertSchema(images).omit({
  id: true,
  createdAt: true,
});

export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type EditHistoryItem = z.infer<typeof editHistorySchema>;
export type InsertImage = z.infer<typeof insertImageSchema>;
export type Image = typeof images.$inferSelect;
