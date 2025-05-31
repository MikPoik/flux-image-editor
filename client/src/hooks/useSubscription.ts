import { useQuery } from "@tanstack/react-query";

interface SubscriptionInfo {
  subscriptionTier: string;
  editCount: number;
  editLimit: number;
  hasActiveSubscription: boolean;
}

export function useSubscription() {
  const { data: subscription, isLoading, error } = useQuery<SubscriptionInfo>({
    queryKey: ["/api/subscription"],
    retry: false,
  });

  return {
    subscription,
    isLoading,
    error,
    isAtLimit: subscription ? subscription.editCount >= subscription.editLimit : false,
    remainingEdits: subscription ? Math.max(0, subscription.editLimit - subscription.editCount) : 0,
  };
}