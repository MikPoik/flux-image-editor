import { useQuery } from "@tanstack/react-query";

export function useAuth() {
  const isBrowser = typeof window !== "undefined";
  const { data: user, isLoading } = useQuery({
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
        if (error instanceof Error && error.message.includes("401")) {
          return null; // User is not authenticated
        }
        throw error;
      }
    },
    retry: false,
    staleTime: 0,
    refetchOnWindowFocus: false,
    refetchOnMount: "always",
    refetchInterval: false,
    enabled: isBrowser,
    initialData: null,
    initialDataUpdatedAt: 0,
  });

  if (!isBrowser) {
    return {
      user: null,
      isLoading: false,
      isAuthenticated: false,
    } as const;
  }

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
  } as const;
}
