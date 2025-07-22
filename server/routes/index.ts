import type { Express } from "express";
import type { Server } from "http";
import { createServer } from "http";
import { setupAuth } from "../replitAuth";
import { setupAuthRoutes } from "./auth";
import { setupImageRoutes } from "./images";
import { setupStorageRoutes } from "./storage";
import { setupSubscriptionRoutes } from "./subscriptions";
import { setupWebhookRoutes } from "./webhooks";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware setup
  await setupAuth(app);

  // Register all route modules
  setupAuthRoutes(app);
  setupImageRoutes(app);
  setupStorageRoutes(app);
  setupSubscriptionRoutes(app);
  setupWebhookRoutes(app);

  return createServer(app);
}