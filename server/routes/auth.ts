import type { Express } from 'express';
import { isAuthenticated } from '../replitAuth';
import { storage } from '../storage';

export function setupAuthRoutes(app: Express) {
  // Auth routes are handled by Stack Neon Auth's StackHandler on the client
  // Ensure user exists in app database (lazy creation on first access)
  app.post('/api/ensure-user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      
      // Get user data from Neon Auth
      const neonAuthUser = await storage.getNeonAuthUser(userId);
      
      if (!neonAuthUser) {
        return res.status(404).json({ message: "User not found in Neon Auth" });
      }
      
      // Parse the raw JSON to get profile image URL
      const rawJson = neonAuthUser.rawJson as any;
      const profileImageUrl = rawJson?.profileImageUrl || null;
      
      // Split name into first and last name (if available)
      const nameParts = neonAuthUser.name?.split(' ') || [];
      const firstName = nameParts[0] || null;
      const lastName = nameParts.slice(1).join(' ') || null;
      
      let user = await storage.getUser(userId);
      
      if (!user) {
        // Create user record with free tier defaults and identity fields
        user = await storage.upsertUser({
          id: userId,
          email: neonAuthUser.email || undefined,
          firstName: firstName || undefined,
          lastName: lastName || undefined,
          profileImageUrl: profileImageUrl || undefined,
          subscriptionTier: 'free',
          credits: 30,
          maxCredits: 30,
          subscriptionStatus: 'active',
        });
      } else {
        // Update identity fields if they've changed
        const needsUpdate = 
          user.email !== neonAuthUser.email ||
          user.firstName !== firstName ||
          user.lastName !== lastName ||
          user.profileImageUrl !== profileImageUrl;
        
        if (needsUpdate) {
          user = await storage.upsertUser({
            id: userId,
            email: neonAuthUser.email || undefined,
            firstName: firstName || undefined,
            lastName: lastName || undefined,
            profileImageUrl: profileImageUrl || undefined,
          });
        }
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
