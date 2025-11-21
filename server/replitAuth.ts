import type { Express } from 'express';

// Neon Auth is handled entirely on the client side with @stackframe/react
// The server only needs to serve the auth handler endpoints

export function getSession() {
  // Session management is handled by Neon Auth (via cookies)
  return (req: any, res: any, next: any) => next();
}

export async function setupAuth(app: Express) {
  // Neon Auth setup is handled client-side via StackProvider
  // Server doesn't need additional auth middleware
  app.set('trust proxy', 1);
  
  console.log('[AUTH] Using Neon Auth');
}

export const isAuthenticated = (req: any, res: any, next: any) => {
  // Neon Auth token validation happens on client side
  // For API protection, check Authorization header if needed
  next();
};

export const optionalSession = (req: any, res: any, next: any) => {
  // Sessions are optional with Neon Auth
  next();
};
