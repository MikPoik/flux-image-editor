import { useQuery } from "@tanstack/react-query";

export function useAuth() {
  const { data: user, isLoading, error } = useQuery({
    queryKey: ["/api/auth/user"],
    retry: false,
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
    refetchOnWindowFocus: false, // Don't refetch on window focus
    refetchOnMount: false, // Don't refetch on component mount after initial load
  });

  // Check if we got a 401 Unauthorized error
  const isUnauthenticated = error && (
    error.message?.includes('401') || 
    error.message?.includes('Unauthorized')
  );
  
  return {
    user,
    isLoading: isLoading && !isUnauthenticated,
    isAuthenticated: !!user,
  };
}