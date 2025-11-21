import type { Express } from 'express';
import { isAuthenticated } from '../replitAuth';
import { storage } from '../storage';
import { db } from '../db';

export function setupAuthRoutes(app: Express) {
  // Auth routes are handled by Neon Auth's StackHandler on the client
  // This endpoint returns the current user info from the session
  app.get('/api/auth/user', async (req: any, res) => {
    // With Neon Auth, user info is managed client-side
    // This endpoint can remain for backwards compatibility but is not required
    res.json(null);
  });

  // Initialize/sync user from Neon Auth on first login
  app.post('/api/init-user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      
      // Check if user already exists in our table
      let user = await storage.getUser(userId);
      
      if (!user) {
        // Query neon_auth.users_sync to get user data
        const result = await db.execute(`
          SELECT id, email, name, created_at, updated_at 
          FROM neon_auth.users_sync 
          WHERE id = $1
        `, [userId]);
        
        if (!result.rows || result.rows.length === 0) {
          return res.status(404).json({ message: "User not found in auth system" });
        }
        
        const syncedUser = result.rows[0] as any;
        
        // Parse name into firstName and lastName
        const nameParts = (syncedUser.name || '').split(' ');
        const firstName = nameParts[0] || '';
        const lastName = nameParts.slice(1).join(' ') || '';
        
        // Create user in our database with free tier defaults
        user = await storage.upsertUser({
          id: userId,
          email: syncedUser.email,
          firstName,
          lastName,
          subscriptionTier: 'free',
          credits: 10,
          maxCredits: 10,
          subscriptionStatus: 'active',
        });
      }
      
      res.json({ 
        message: "User initialized successfully",
        user 
      });
    } catch (error: any) {
      console.error('User init error:', error);
      res.status(500).json({ message: error.message || "Failed to initialize user" });
    }
  });
}
