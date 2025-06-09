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

interface SubscriptionInfo {
  subscriptionTier: string;
  editCount: number;
  editLimit: number;
  generationCount: number;
  generationLimit: number;
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
            Your edit limit will be reduced immediately.
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


  const { data: subscription, isLoading } = useQuery<SubscriptionInfo>({
    queryKey: ["/api/subscription"],
  });

  // Handle success/cancel from Stripe checkout
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const success = urlParams.get('success');
    const canceled = urlParams.get('canceled');
    const sessionId = urlParams.get('session_id');

    if (success === 'true') {
      // Poll for subscription updates since webhook processing might be delayed
      const pollForUpdates = async () => {
        for (let i = 0; i < 10; i++) {
          await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
          await queryClient.invalidateQueries({ queryKey: ["/api/subscription"] });
          const currentData = queryClient.getQueryData(["/api/subscription"]) as SubscriptionInfo | undefined;
          if (currentData?.hasActiveSubscription) {
            break; // Stop polling once subscription is active
          }
        }
      };

      toast({
        title: "Subscription Successful!",
        description: "Your subscription has been activated.",
      });
      pollForUpdates();
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
      price: "$4.99",
      period: "/month",
      edits: 50,
      features: ["50 image edits per month", "25 image generations per month", "Kontext Pro AI model", "2X image upscale"],
      priceId: import.meta.env.VITE_STRIPE_PRICE_5, // Replace with your actual Stripe price ID
      popular: false,
    },
    {
      id: "premium",
      name: "Premium Plan", 
      price: "$9.99",
      period: "/month",
      edits: 50,
      features: ["50 image edits per month", "25 image generations per month", "Kontext Max AI model (highest quality)", "Up to 4X image upscale"],
      priceId: import.meta.env.VITE_STRIPE_PRICE_999, // Replace with your actual Stripe price ID for $9.99 plan
      popular: true,
    },
    {
      id: "premium-plus",
      name: "Premium Plus Plan", 
      price: "$14.99",
      period: "/month",
      edits: 100,
      features: ["100 image edits per month", "Kontext Max AI model (highest quality)", "Up to 4X image upscale"],
      priceId: import.meta.env.VITE_STRIPE_PRICE_1499, // Replace with your actual Stripe price ID
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
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-4">Subscription Plans</h1>
        <p className="text-muted-foreground">
          Choose the plan that fits your image editing needs
        </p>
      </div>

      {/* Current Subscription Status */}
      {subscription && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Current Plan
              {subscription.subscriptionTier === 'premium' && <Crown className="h-5 w-5 text-yellow-500" />}
              {subscription.subscriptionTier === 'basic' && <Zap className="h-5 w-5 text-blue-500" />}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-lg font-semibold capitalize">
                  {subscription.subscriptionTier} Plan
                </p>
                <p className="text-muted-foreground">
                  {subscription.editCount} / {subscription.editLimit} edits used this month
                </p>
                <p className="text-muted-foreground">
                  {subscription.generationCount} / {subscription.generationLimit} generations used this month
                </p>
              </div>
              <div className="text-right">
                <div className="flex flex-col items-end gap-2">
                  <Badge variant={subscription.hasActiveSubscription ? "default" : "secondary"}>
                    {subscription.hasActiveSubscription ? "Active" : "Free"}
                  </Badge>
                  {subscription.cancelAtPeriodEnd && (
                    <div className="flex flex-col items-end gap-2">
                      <Badge variant="destructive" className="text-xs">
                        {subscription.currentPeriodEnd 
                          ? `Cancels ${new Date(subscription.currentPeriodEnd * 1000).toLocaleDateString()}`
                          : "Scheduled for cancellation"
                        }
                      </Badge>
                      <Button
                        variant="outline"
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
                      variant="outline"
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
          </CardContent>
        </Card>
      )}

      {/* Paid Plans */}
      <div className="grid md:grid-cols-3 gap-6 mb-8">
        {plans.map((plan) => (
          <Card key={plan.id} className={`relative ${plan.popular ? 'ring-2 ring-primary' : ''}`}>
            {plan.popular && (
              <Badge className="absolute -top-2 left-1/2 transform -translate-x-1/2">
                Most Popular
              </Badge>
            )}
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                {plan.name}
                {subscription?.subscriptionTier === plan.id && <Badge>Current</Badge>}
              </CardTitle>
              <CardDescription>
                <span className="text-2xl font-bold">{plan.price}</span>
                {plan.period}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center">
                <p className="text-lg font-semibold">{plan.edits} edits/month</p>
              </div>
              <ul className="space-y-2">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-500" />
                    {feature}
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
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="text-center text-sm text-muted-foreground">
        <p>All plans include secure payment processing and can be canceled anytime.</p>
        <p>Edit counts reset monthly on your billing date.</p>
      </div>
    </div>
  );
}