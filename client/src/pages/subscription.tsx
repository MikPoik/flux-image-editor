import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Crown, Zap } from "lucide-react";
import { Navigation } from "@/components/navigation";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import type { RouteDefinition } from "@shared/route-metadata";

export const route: RouteDefinition = {
  path: "/subscription",
  ssr: false,
  metadata: {
    title: "Subscription Plans - Flux-a-Image",
    description: "Choose the perfect AI image editing plan for your needs. Flexible pricing with generous credits.",
    canonical: "https://fluxaimage.com/subscription",
    ogTitle: "Subscription Plans | Flux-a-Image",
    ogDescription: "Flexible pricing for AI-powered image editing",
  },
};

interface SubscriptionInfo {
  subscriptionTier: string;
  credits: number;
  maxCredits: number;
  creditsResetDate: number | null;
  hasActiveSubscription: boolean;
  cancelAtPeriodEnd: boolean;
  currentPeriodEnd: number | null;
}



const SubscriptionCheckout = ({ priceId }: { priceId: string }) => {
  const createSubscriptionMutation = useMutation({
    mutationFn: async (priceId: string) => {
      const response = await apiRequest("POST", "/api/create-subscription", { priceId });
      return response.json();
    },
    onSuccess: (data) => {
      // Redirect to Stripe Checkout
      if (data.url) {
        window.location.href = data.url;
      }
    },
    onError: (error) => {
      console.error("Subscription creation failed:", error);
    },
  });

  const handleStartSubscription = () => {
    createSubscriptionMutation.mutate(priceId);
  };

  return (
    <div className="space-y-4">
      <Button 
        onClick={handleStartSubscription} 
        disabled={createSubscriptionMutation.isPending}
        className="w-full"
      >
        {createSubscriptionMutation.isPending ? "Setting up..." : `Subscribe to ${priceId === import.meta.env.VITE_STRIPE_PRICE_1499 ? 'Premium Plus' : priceId === import.meta.env.VITE_STRIPE_PRICE_999 ? 'Premium' : 'Basic'} Plan`}
      </Button>
    </div>
  );
};

const UpgradeButton = ({ priceId, planName, currentTier }: { priceId: string, planName: string, currentTier: string }) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const upgradeSubscriptionMutation = useMutation({
    mutationFn: async (priceId: string) => {
      const response = await apiRequest("POST", "/api/upgrade-subscription", { priceId });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Subscription Upgraded!",
        description: `Your subscription has been upgraded to ${planName}.`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/subscription"] });
    },
    onError: (error: any) => {
      toast({
        title: "Upgrade Failed",
        description: error.message || "Failed to upgrade subscription. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleUpgrade = () => {
    upgradeSubscriptionMutation.mutate(priceId);
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button className="w-full">
          Upgrade to {planName}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Confirm Subscription Upgrade</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to upgrade from {currentTier} to {planName}? 
            You'll be charged the prorated amount for the remainder of your billing period and your new rate will apply going forward.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction 
            onClick={handleUpgrade} 
            disabled={upgradeSubscriptionMutation.isPending}
          >
            {upgradeSubscriptionMutation.isPending ? "Upgrading..." : "Confirm Upgrade"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

const DowngradeButton = ({ priceId, planName, currentTier }: { priceId: string, planName: string, currentTier: string }) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const downgradeSubscriptionMutation = useMutation({
    mutationFn: async (priceId: string) => {
      const response = await apiRequest("POST", "/api/upgrade-subscription", { priceId });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Subscription Downgraded!",
        description: `Your subscription has been downgraded to ${planName}.`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/subscription"] });
    },
    onError: (error: any) => {
      toast({
        title: "Downgrade Failed",
        description: error.message || "Failed to downgrade subscription. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleDowngrade = () => {
    downgradeSubscriptionMutation.mutate(priceId);
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="outline" className="w-full">
          Downgrade to {planName}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Confirm Subscription Downgrade</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to downgrade from {currentTier} to {planName}? 
            You'll receive a prorated credit for the remainder of your billing period and your new rate will apply going forward.
            Your credit allowance will be adjusted immediately.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction 
            onClick={handleDowngrade} 
            disabled={downgradeSubscriptionMutation.isPending}
          >
            {downgradeSubscriptionMutation.isPending ? "Downgrading..." : "Confirm Downgrade"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default function Subscription() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    document.title = route.metadata?.title || "Subscription Plans";
    
    const updateMetaTag = (name: string, content: string) => {
      let element = document.querySelector(`meta[name="${name}"]`) || document.querySelector(`meta[property="${name}"]`);
      if (!element) {
        element = document.createElement('meta');
        if (name.startsWith('og:')) {
          element.setAttribute('property', name);
        } else {
          element.setAttribute('name', name);
        }
        document.head.appendChild(element);
      }
      element.setAttribute('content', content);
    };

    if (route.metadata) {
      if (route.metadata.description) updateMetaTag('description', route.metadata.description);
      if (route.metadata.ogTitle) updateMetaTag('og:title', route.metadata.ogTitle);
      if (route.metadata.ogDescription) updateMetaTag('og:description', route.metadata.ogDescription);
      if (route.metadata.canonical) {
        let link = document.querySelector('link[rel="canonical"]');
        if (!link) {
          link = document.createElement('link');
          link.setAttribute('rel', 'canonical');
          document.head.appendChild(link);
        }
        link.setAttribute('href', route.metadata.canonical);
      }
    }
  }, []);

  const { data: subscription, isLoading } = useQuery<SubscriptionInfo>({
    queryKey: ["/api/subscription"],
  });

  // Handle success/cancel from Stripe checkout
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const success = urlParams.get('success');
    const canceled = urlParams.get('canceled');
    const sessionId = urlParams.get('session_id');

    if (success === 'true' && sessionId) {
      // Immediately verify the checkout session
      const verifyCheckout = async () => {
        try {
          const response = await apiRequest("POST", "/api/verify-checkout", { sessionId });
          const data = await response.json();
          
          if (data.success) {
            toast({
              title: "Subscription Activated!",
              description: `Your ${data.tier} plan is now active.`,
            });
            // Refresh subscription data
            await queryClient.invalidateQueries({ queryKey: ["/api/subscription"] });
          }
        } catch (error) {
          console.error('Failed to verify checkout:', error);
          // Fallback to polling if verification fails
          toast({
            title: "Subscription Processing",
            description: "Your subscription is being activated. This may take a moment.",
          });
          
          // Poll for subscription updates as fallback
          const pollForUpdates = async () => {
            for (let i = 0; i < 10; i++) {
              await new Promise(resolve => setTimeout(resolve, 1000));
              await queryClient.invalidateQueries({ queryKey: ["/api/subscription"] });
              const currentData = queryClient.getQueryData(["/api/subscription"]) as SubscriptionInfo | undefined;
              if (currentData?.hasActiveSubscription) {
                break;
              }
            }
          };
          pollForUpdates();
        }
      };
      
      verifyCheckout();
      // Clean up URL
      window.history.replaceState({}, document.title, "/subscription");
    } else if (canceled === 'true') {
      toast({
        title: "Subscription Canceled",
        description: "You can try subscribing again at any time.",
        variant: "destructive",
      });
      // Clean up URL
      window.history.replaceState({}, document.title, "/subscription");
    }
  }, [toast, queryClient]);

  // Invalidate subscription cache when page gains focus
  useEffect(() => {
    const handleFocus = () => {
      queryClient.invalidateQueries({ queryKey: ["/api/subscription"] });
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [queryClient]);

  const cancelSubscriptionMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/cancel-subscription");
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Subscription Canceled",
        description: "Your subscription will be canceled at the end of the billing period.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/subscription"] });
    },
    onError: (error) => {
      toast({
        title: "Cancellation Failed",
        description: "Failed to cancel subscription. Please try again.",
        variant: "destructive",
      });
    },
  });

  const resumeSubscriptionMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/resume-subscription");
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Subscription Resumed",
        description: "Your subscription has been resumed and will continue.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/subscription"] });
    },
    onError: (error) => {
      toast({
        title: "Resume Failed",
        description: "Failed to resume subscription. Please try again.",
        variant: "destructive",
      });
    },
  });

  const plans = [
    {
      id: "basic",
      name: "Basic Plan",
      price: "5€",
      period: "/month",
      credits: 60,
      features: ["60 credits per month", "Editing/Generation: 1 credit each", "Upscales: Free", "Kontext Pro AI model"],
      priceId: import.meta.env.VITE_STRIPE_PRICE_499,
      popular: false,
    },
    {
      id: "premium",
      name: "Premium Plan", 
      price: "10€",
      period: "/month",
      credits: 70,
      features: ["70 credits per month", "Editing/Generation: 1 credit each", "Upscales: Free", "Kontext Max AI model (highest quality)"],
      priceId: import.meta.env.VITE_STRIPE_PRICE_999,
      popular: true,
    },
    {
      id: "premium-plus",
      name: "Premium Plus Plan", 
      price: "15€",
      period: "/month",
      credits: 110,
      features: ["110 credits per month", "Editing/Generation: 1 credit each", "Upscales: Free", "Kontext Max AI model (highest quality)"],
      priceId: import.meta.env.VITE_STRIPE_PRICE_1499,
      popular: false,
    },
  ];



  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="h-screen flex items-center justify-center">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-slate-50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-950 container mx-auto px-4 py-8 max-w-6xl">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-200 dark:to-purple-200">Subscription Plans</h1>
        <p className="text-slate-600 dark:text-slate-400">
          Choose the plan that fits your image editing needs
        </p>
      </div>

      {/* Current Subscription Status */}
      {subscription && (
        <div className="bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-900 border border-slate-300 dark:border-slate-700/50 rounded-2xl p-6 mb-8">
          <div className="flex items-center gap-2 mb-4 pb-4 border-b border-slate-300 dark:border-slate-700/50">
            <h3 className="text-xl font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              Current Plan
              {subscription.subscriptionTier === 'premium' && <Crown className="h-5 w-5 text-yellow-400" />}
              {subscription.subscriptionTier === 'basic' && <Zap className="h-5 w-5 text-blue-400" />}
            </h3>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-lg font-semibold capitalize text-slate-900 dark:text-white">
                {subscription.subscriptionTier} Plan
              </p>
              <p className="text-slate-600 dark:text-slate-400">
                {subscription.credits} / {subscription.maxCredits} credits remaining
              </p>
              {subscription.creditsResetDate && (
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Credits reset on {new Date(subscription.creditsResetDate * 1000).toLocaleDateString()}
                </p>
              )}
            </div>
            <div className="text-right">
              <div className="flex flex-col items-end gap-2">
                <div className={`px-3 py-1 rounded-full text-sm font-medium ${subscription.hasActiveSubscription ? 'bg-green-500/20 text-green-300' : 'bg-slate-600/50 text-slate-300'}`}>
                  {subscription.hasActiveSubscription ? "Active" : "Free"}
                </div>
                {subscription.cancelAtPeriodEnd && (
                  <div className="flex flex-col items-end gap-2">
                    <div className="px-3 py-1 rounded-full text-xs font-medium bg-red-500/20 text-red-300">
                      {subscription.currentPeriodEnd 
                        ? `Cancels ${new Date(subscription.currentPeriodEnd * 1000).toLocaleDateString()}`
                        : "Scheduled for cancellation"
                      }
                    </div>
                    <Button
                      className="bg-slate-600 hover:bg-slate-500 text-white"
                      size="sm"
                      onClick={() => resumeSubscriptionMutation.mutate()}
                      disabled={resumeSubscriptionMutation.isPending}
                    >
                      {resumeSubscriptionMutation.isPending ? "Resuming..." : "Resume"}
                    </Button>
                  </div>
                )}
                {subscription.hasActiveSubscription && !subscription.cancelAtPeriodEnd && (
                  <Button
                    className="border border-slate-600 text-slate-200 hover:bg-slate-700"
                    size="sm"
                    onClick={() => cancelSubscriptionMutation.mutate()}
                    disabled={cancelSubscriptionMutation.isPending}
                  >
                    {cancelSubscriptionMutation.isPending ? "Canceling..." : "Cancel"}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Paid Plans */}
      <div className="grid md:grid-cols-3 gap-6 mb-8">
        {plans.map((plan) => (
          <div key={plan.id} className={`relative bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-900 border rounded-2xl p-8 transition-all duration-300 ${plan.popular ? 'border-2 border-purple-400 dark:border-purple-400 scale-105 shadow-2xl shadow-purple-500/20 dark:shadow-purple-500/20' : 'border-slate-300 dark:border-slate-700/50 hover:border-blue-400/50 dark:hover:border-blue-400/50 hover:shadow-xl hover:shadow-blue-500/10 dark:hover:shadow-blue-500/10'}`}>
            {plan.popular && (
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-1 rounded-full text-xs font-semibold">
                Most Popular
              </div>
            )}
            <div className="text-center mb-6">
              <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">{plan.name}</h3>
              <div className="text-center">
                <span className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-300 dark:to-purple-300">
                  {plan.price}
                </span>
                <span className="text-slate-600 dark:text-slate-400 ml-2">{plan.period}</span>
              </div>
              {subscription?.subscriptionTier === plan.id && (
                <div className="mt-2 px-3 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-300 inline-block">Current</div>
              )}
            </div>

            <div className="space-y-4">
              <div className="text-center pb-4 border-b border-slate-300 dark:border-slate-700/50">
                <p className="text-lg font-semibold text-slate-900 dark:text-slate-200">
                  {plan.credits} credits/month
                </p>
              </div>
              <ul className="space-y-3 mb-6">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <Check className="h-4 w-4 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-slate-700 dark:text-slate-300">{feature}</span>
                  </li>
                ))}
              </ul>
              {subscription?.subscriptionTier !== plan.id && (
                <div className="pt-4">
                  {subscription?.hasActiveSubscription ? (
                    <>
                      {/* Show upgrade button for higher tier plans */}
                      {((subscription.subscriptionTier === 'basic' && (plan.id === 'premium' || plan.id === 'premium-plus')) ||
                        (subscription.subscriptionTier === 'premium' && plan.id === 'premium-plus') ||
                        (subscription.subscriptionTier === 'free' && (plan.id === 'basic' || plan.id === 'premium' || plan.id === 'premium-plus'))) && (
                        <UpgradeButton 
                          priceId={plan.priceId}
                          planName={plan.name}
                          currentTier={subscription.subscriptionTier}
                        />
                      )}
                      {/* Show downgrade button for lower tier plans */}
                      {((subscription.subscriptionTier === 'premium' && plan.id === 'basic') ||
                        (subscription.subscriptionTier === 'premium-plus' && (plan.id === 'basic' || plan.id === 'premium'))) && (
                        <DowngradeButton 
                          priceId={plan.priceId}
                          planName={plan.name}
                          currentTier={subscription.subscriptionTier}
                        />
                      )}
                    </>
                  ) : (
                    <SubscriptionCheckout 
                      priceId={plan.priceId}
                    />
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="text-center text-sm text-slate-600 dark:text-slate-400">
        <p>All plans include secure payment processing and can be canceled anytime.</p>
        <p>Edit counts reset monthly on your billing date.</p>
      </div>
    </div>
  );
}