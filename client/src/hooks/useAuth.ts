import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";

export function useAuth() {
  const isBrowser = typeof window !== "undefined";
  const [hasHydrated, setHasHydrated] = useState(false);

  useEffect(() => {
    if (isBrowser) {
      setHasHydrated(true);
    }
  }, [isBrowser]);

  const queryEnabled = isBrowser && hasHydrated;

  const { data: user, isPending } = useQuery({
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
    enabled: queryEnabled,
  });

  if (!queryEnabled) {
    return {
      user: null,
      isLoading: true,
      isAuthenticated: false,
    } as const;
  }

  const normalizedUser = user ?? null;

  return {
    user: normalizedUser,
    isLoading: isPending,
    isAuthenticated: !!normalizedUser,
  } as const;
}
