import { pgTable, text, serial, timestamp, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const images = pgTable("images", {
  id: serial("id").primaryKey(),
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

export const insertImageSchema = createInsertSchema(images).pick({
  originalUrl: true,
  currentUrl: true,
  editHistory: true,
});

export type EditHistoryItem = z.infer<typeof editHistorySchema>;
export type InsertImage = z.infer<typeof insertImageSchema>;
export type Image = typeof images.$inferSelect;
