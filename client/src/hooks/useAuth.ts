import { useQuery } from "@tanstack/react-query";

export function useAuth() {
  const { data: user, isLoading, error } = useQuery({
    queryKey: ["/api/auth/user"],
    queryFn: async () => {
      try {
        const res = await fetch("/api/auth/user", {
          credentials: "include",
        });
        
        if (res.status === 401) {
          return null; // User is not authenticated
        }
        
        if (!res.ok) {
          throw new Error(`${res.status}: ${res.statusText}`);
        }
        
        return await res.json();
      } catch (error) {
        if (error instanceof Error && error.message.includes('401')) {
          return null; // User is not authenticated
        }
        throw error;
      }
    },
    retry: false,
    staleTime: Infinity, // Don't refetch automatically
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchInterval: false,
  });

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
  };
}