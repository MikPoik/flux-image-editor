import type { Express } from 'express';
import { isAuthenticated } from '../replitAuth';
import { storage } from '../storage';

export function setupAuthRoutes(app: Express) {
  // Auth routes are handled by Stack Neon Auth's StackHandler on the client
  // Ensure user exists in app database (lazy creation on first access)
  app.post('/api/ensure-user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      let user = await storage.getUser(userId);
      
      if (!user) {
        // Create user record with free tier defaults
        user = await storage.upsertUser({
          id: userId,
          subscriptionTier: 'free',
          credits: 30,
          maxCredits: 30,
          subscriptionStatus: 'active',
        });
      }
      
      res.json({ 
        message: "User record ensured",
        user 
      });
    } catch (error: any) {
      console.error('Ensure user error:', error);
      res.status(500).json({ message: error.message || "Failed to ensure user" });
    }
  });
}
