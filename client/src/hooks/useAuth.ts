import { useUser } from '@stackframe/react';
import { useEffect } from 'react';
import { apiRequest } from '@/lib/queryClient';

export function useAuth() {
  const user = useUser();

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
    isLoading: false,
    isAuthenticated: !!user,
  } as const;
}
