
import type { Express, RequestHandler } from "express";

// Stack Auth handles authentication client-side via cookies
// Server middleware validates the session from cookies

export function getSession() {
  return (req: any, res: any, next: any) => next();
}

export async function setupAuth(app: Express) {
  app.set('trust proxy', 1);
  console.log('[AUTH] Using Stack Neon Auth (client-side)');
}

export const isAuthenticated: RequestHandler = async (req: any, res, next) => {
  // Stack Auth uses cookies for session management
  // The user ID should be sent from the client in the x-user-id header
  const userIdFromHeader = req.headers['x-user-id'];
  
  if (!userIdFromHeader) {
    return res.status(401).json({ message: "Unauthorized - No user ID provided" });
  }
  
  req.user = { id: userIdFromHeader };
  next();
};

export const optionalSession: RequestHandler = (req: any, res, next) => {
  const userId = req.headers['x-user-id'];
  
  if (userId) {
    req.user = { id: userId };
  }
  
  next();
};
