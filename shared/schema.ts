import { pgTable, text, serial, timestamp, json, varchar, index } from "drizzle-orm/pg-core";
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
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const images = pgTable("images", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  originalUrl: text("original_url").notNull(),
  currentUrl: text("current_url").notNull(),
  editHistory: json("edit_history").$type<EditHistoryItem[]>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const editHistorySchema = z.object({
  prompt: z.string(),
  imageUrl: z.string(),
  timestamp: z.string(),
});

export const insertImageSchema = createInsertSchema(images).pick({
  userId: true,
  originalUrl: true,
  currentUrl: true,
  editHistory: true,
});

export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type EditHistoryItem = z.infer<typeof editHistorySchema>;
export type InsertImage = z.infer<typeof insertImageSchema>;
export type Image = typeof images.$inferSelect;
