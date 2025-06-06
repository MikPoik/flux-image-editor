import { useQuery } from "@tanstack/react-query";
import { isUnauthorizedError } from "@/lib/authUtils";

export function useAuth() {
  const { data: user, isLoading, error } = useQuery({
    queryKey: ["/api/auth/user"],
    retry: false,
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
    refetchOnWindowFocus: false, // Don't refetch on window focus
    refetchOnMount: false, // Don't refetch on component mount after initial load
  });

  // Check if we got a 401 Unauthorized error using the utility function
  const isUnauthenticated = error && isUnauthorizedError(error);
  
  return {
    user,
    isLoading: isLoading && !isUnauthenticated,
    isAuthenticated: !!user,
  };
}