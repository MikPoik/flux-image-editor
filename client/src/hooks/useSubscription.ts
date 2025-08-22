import { useQuery } from "@tanstack/react-query";

interface SubscriptionInfo {
  subscriptionTier: string;
  credits: number;
  maxCredits: number;
  creditsResetDate: number | null;
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
    hasInsufficientCredits: (creditsNeeded: number) => subscription ? subscription.credits < creditsNeeded : true,
    remainingCredits: subscription ? subscription.credits : 0,
    canAffordEdit: subscription ? subscription.credits >= 4 : false, // Edit costs 4 credits
    canAffordGeneration: subscription ? subscription.credits >= 4 : false, // Generation costs 4 credits
    canAffordMultiGeneration: subscription ? subscription.credits >= 4 : false, // Multi-generation costs 4 credits
    canAffordUpscale: subscription ? subscription.credits >= 1 : false, // Upscale costs 1 credit
  };
}