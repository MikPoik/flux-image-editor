import { useUser } from '@stackframe/react';
import { useEffect } from 'react';
import { apiRequest } from '@/lib/queryClient';

export function useAuth() {
  const user = useUser();

  // Initialize user in database on first login
  useEffect(() => {
    if (user?.id) {
      apiRequest('POST', '/api/init-user').catch(error => {
        console.error('Failed to initialize user:', error);
      });
    }
  }, [user?.id]);

  return {
    user: user ?? null,
    isLoading: false,
    isAuthenticated: !!user,
  } as const;
}
