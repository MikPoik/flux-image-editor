import type { Express } from "express";
import { storage } from "../storage";
import { optionalSession } from "../replitAuth";

export function setupAuthRoutes(app: Express) {
  // Get authenticated user
  app.get('/api/auth/user', optionalSession, async (req: any, res) => {
    if (!req.isAuthenticated?.() || !req.user?.claims?.sub) {
      return res.json(null);
    }

    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Logout endpoint
  app.get('/api/logout', (req, res) => {
    req.logout((err: any) => {
      if (err) {
        console.error('Logout error:', err);
        return res.status(500).json({ message: 'Failed to logout' });
      }
      res.redirect('/');
    });
  });
}
