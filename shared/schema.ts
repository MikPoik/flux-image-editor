import { pgTable, text, serial, timestamp, json, varchar, index, integer, pgSchema } from "drizzle-orm/pg-core";
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

// User app-specific data table.
// Basic user identity (id, email, name) comes from neon_auth.users_sync
// This table only stores app-specific fields for subscriptions and credits
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  stripeCustomerId: varchar("stripe_customer_id"),
  stripeSubscriptionId: varchar("stripe_subscription_id"),
  subscriptionTier: varchar("subscription_tier").default("free"), // 'free', 'basic', 'premium', 'premium-plus'
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

// Reference to Neon Auth's synced users table
// This is a view/reference only - don't create this table, Neon Auth manages it
export const neonAuthSchema = pgSchema("neon_auth");
export const neonAuthUsers = neonAuthSchema.table("users_sync", {
  id: text("id").primaryKey(),
  name: text("name"),
  email: text("email"),
  createdAt: timestamp("created_at"),
  updatedAt: timestamp("updated_at"),
  deletedAt: timestamp("deleted_at"),
  rawJson: json("raw_json"),
});

export const images = pgTable("images", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull(),
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
