import { useUser } from '@stackframe/react';

export function useAuth() {
  try {
    const user = useUser();
    return {
      user: user ?? null,
      isLoading: false,
      isAuthenticated: !!user,
    } as const;
  } catch (error) {
    // If useUser throws (e.g., suspending), return loading state
    throw error;
  }
}
