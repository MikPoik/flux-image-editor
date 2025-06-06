import { useQuery } from "@tanstack/react-query";

interface SubscriptionInfo {
  subscriptionTier: string;
  editCount: number;
  editLimit: number;
  hasActiveSubscription: boolean;
  cancelAtPeriodEnd: boolean;
  currentPeriodEnd: number | null;
}

export function useSubscription() {
  const { data: subscription, isLoading, error } = useQuery<SubscriptionInfo>({
    queryKey: ["/api/subscription"],
    retry: false,
    refetchOnWindowFocus: true,
    // Remove automatic polling - only fetch when explicitly needed
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
  });

  return {
    subscription,
    isLoading,
    error,
    isAtLimit: subscription ? subscription.editCount >= subscription.editLimit : false,
    remainingEdits: subscription ? Math.max(0, subscription.editLimit - subscription.editCount) : 0,
  };
}