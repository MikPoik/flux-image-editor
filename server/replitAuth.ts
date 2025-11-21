import type { Express, RequestHandler } from "express";

// Neon Auth is handled entirely on the client side with @stackframe/react
// The server middleware just validates the request

export function getSession() {
  // Session management is handled by Neon Auth (via cookies)
  return (req: any, res: any, next: any) => next();
}

export async function setupAuth(app: Express) {
  // Neon Auth setup is handled client-side via StackProvider
  app.set('trust proxy', 1);
  console.log('[AUTH] Using Neon Auth');
}

export const isAuthenticated: RequestHandler = (req: any, res, next) => {
  // With Neon Auth, client sends userId in headers after authentication
  const userId = req.headers['x-user-id'];
  
  if (!userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  
  // Attach userId to request for downstream routes
  req.user = { id: userId };
  next();
};

export const optionalSession: RequestHandler = (req: any, res, next) => {
  // Sessions are optional with Neon Auth
  const userId = req.headers['x-user-id'];
  
  if (userId) {
    req.user = { id: userId };
  }
  
  next();
};
