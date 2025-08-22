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
    canAffordEdit: subscription ? subscription.credits >= 1 : false, // Edit costs 1 credit
    canAffordGeneration: subscription ? subscription.credits >= 1 : false, // Generation costs 1 credit
    canAffordMultiGeneration: subscription ? subscription.credits >= 1 : false, // Multi-generation costs 1 credit
    canAffordUpscale: true, // Upscales are now free
  };
}