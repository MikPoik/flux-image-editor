import { useUser } from '@stackframe/react';

export function useAuth() {
  const user = useUser();

  return {
    user: user ?? null,
    isLoading: false,
    isAuthenticated: !!user,
  } as const;
}
