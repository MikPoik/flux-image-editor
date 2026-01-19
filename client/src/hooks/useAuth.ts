import { useEffect, useState } from 'react';
import { apiRequest } from '@/lib/queryClient';
import { stackClientApp } from '@/lib/stack';

export function useAuth() {
  // During SSR, avoid calling stack client which may perform async work and
  // suspend the render. Assume unauthenticated on the server for marketing
  // pages to prevent unexpected Suspense fallbacks.
  if (typeof window === 'undefined') {
    return {
      user: null,
      isLoading: false,
      isAuthenticated: false,
    } as const;
  }

  const [user, setUser] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch the current user from the Stack client imperatively to avoid
  // using `useUser()` which may suspend during render.
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const u = await stackClientApp.getUser();
        if (!mounted) return;
        setUser(u ?? null);
      } catch (e) {
        console.warn('Failed to fetch stack user', e);
        if (!mounted) return;
        setUser(null);
      } finally {
        if (mounted) setIsLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  // Ensure user exists in app database on first login (lazy creation)
  useEffect(() => {
    if (user?.id) {
      apiRequest('POST', '/api/ensure-user').catch(error => {
        console.error('Failed to ensure user:', error);
      });
    }
  }, [user?.id]);

  return {
    user: user ?? null,
    isLoading,
    isAuthenticated: !!user,
  } as const;
}
