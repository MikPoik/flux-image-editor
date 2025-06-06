import { useQuery } from "@tanstack/react-query";

export function useAuth() {
  const { data: user, isLoading, error } = useQuery({
    queryKey: ["/api/auth/user"],
    retry: false,
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
    refetchOnWindowFocus: false, // Don't refetch on window focus
    refetchOnMount: false, // Don't refetch on component mount after initial load
  });

  // If we get a 401 error, the user is not authenticated but loading should be false
  const isUnauthenticated = error && error.message?.includes('401');
  
  return {
    user,
    isLoading: isLoading && !isUnauthenticated,
    isAuthenticated: !!user,
  };
}