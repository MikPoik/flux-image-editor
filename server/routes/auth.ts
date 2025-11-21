import type { Express } from 'express';

export function setupAuthRoutes(app: Express) {
  // Auth routes are handled by Neon Auth's StackHandler on the client
  // This endpoint returns the current user info from the session
  app.get('/api/auth/user', async (req: any, res) => {
    // With Neon Auth, user info is managed client-side
    // This endpoint can remain for backwards compatibility but is not required
    res.json(null);
  });
}
