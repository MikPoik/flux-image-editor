import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Crown, Zap } from "lucide-react";

if (!import.meta.env.VITE_STRIPE_PUBLIC_KEY) {
  throw new Error('Missing required Stripe key: VITE_STRIPE_PUBLIC_KEY');
}
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

interface SubscriptionInfo {
  subscriptionTier: string;
  editCount: number;
  editLimit: number;
  hasActiveSubscription: boolean;
}

const CheckoutForm = ({ priceId, onSuccess }: { priceId: string; onSuccess: () => void }) => {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: window.location.origin + "/subscription?success=true",
        },
      });

      if (error) {
        toast({
          title: "Payment Failed",
          description: error.message,
          variant: "destructive",
        });
      } else {
        onSuccess();
      }
    } catch (error) {
      toast({
        title: "Payment Failed",
        description: "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement />
      <Button type="submit" disabled={!stripe || isLoading} className="w-full">
        {isLoading ? "Processing..." : "Subscribe"}
      </Button>
    </form>
  );
};

const SubscriptionCheckout = ({ priceId, onSuccess }: { priceId: string; onSuccess: () => void }) => {
  const [clientSecret, setClientSecret] = useState("");

  const createSubscriptionMutation = useMutation({
    mutationFn: async (priceId: string) => {
      const response = await apiRequest("POST", "/api/create-subscription", { priceId });
      return response.json();
    },
    onSuccess: (data) => {
      setClientSecret(data.clientSecret);
    },
    onError: (error) => {
      console.error("Subscription creation failed:", error);
    },
  });

  const handleStartSubscription = () => {
    createSubscriptionMutation.mutate(priceId);
  };

  if (!clientSecret) {
    return (
      <div className="space-y-4">
        <Button 
          onClick={handleStartSubscription} 
          disabled={createSubscriptionMutation.isPending}
          className="w-full"
        >
          {createSubscriptionMutation.isPending ? "Setting up..." : "Subscribe Now"}
        </Button>
      </div>
    );
  }

  return (
    <Elements stripe={stripePromise} options={{ clientSecret }}>
      <CheckoutForm priceId={priceId} onSuccess={onSuccess} />
    </Elements>
  );
};

export default function Subscription() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

  const { data: subscription, isLoading } = useQuery<SubscriptionInfo>({
    queryKey: ["/api/subscription"],
  });

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

  const plans = [
    {
      id: "basic",
      name: "Basic Plan",
      price: "$5",
      period: "/month",
      edits: 50,
      features: ["50 image edits per month", "High-quality AI processing", "Edit history", "Basic support"],
      priceId: import.meta.env.VITE_STRIPE_PRICE_5, // Replace with your actual Stripe price ID
      popular: false,
    },
    {
      id: "premium",
      name: "Premium Plan", 
      price: "$10",
      period: "/month",
      edits: 100,
      features: ["100 image edits per month", "Priority AI processing", "Advanced edit history", "Priority support"],
      priceId: import.meta.env.VITE_STRIPE_PRICE_10, // Replace with your actual Stripe price ID
      popular: true,
    },
  ];

  const handleSubscriptionSuccess = () => {
    setSelectedPlan(null);
    queryClient.invalidateQueries({ queryKey: ["/api/subscription"] });
    toast({
      title: "Subscription Successful",
      description: "Welcome to your new plan! You can now enjoy additional edits.",
    });
  };

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
              </div>
              <div className="text-right">
                <Badge variant={subscription.hasActiveSubscription ? "default" : "secondary"}>
                  {subscription.hasActiveSubscription ? "Active" : "Free"}
                </Badge>
                {subscription.hasActiveSubscription && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="ml-2"
                    onClick={() => cancelSubscriptionMutation.mutate()}
                    disabled={cancelSubscriptionMutation.isPending}
                  >
                    {cancelSubscriptionMutation.isPending ? "Canceling..." : "Cancel"}
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Free Plan */}
      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <Card className={subscription?.subscriptionTier === 'free' ? 'ring-2 ring-primary' : ''}>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Free Plan
              {subscription?.subscriptionTier === 'free' && <Badge>Current</Badge>}
            </CardTitle>
            <CardDescription>
              <span className="text-2xl font-bold">$0</span> /month
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center">
              <p className="text-lg font-semibold">10 edits/month</p>
            </div>
            <ul className="space-y-2">
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500" />
                10 image edits per month
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500" />
                Basic AI processing
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-500" />
                Standard support
              </li>
            </ul>
          </CardContent>
        </Card>

        {/* Paid Plans */}
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
                  {selectedPlan === plan.id ? (
                    <SubscriptionCheckout 
                      priceId={plan.priceId} 
                      onSuccess={handleSubscriptionSuccess}
                    />
                  ) : (
                    <Button 
                      className="w-full" 
                      onClick={() => setSelectedPlan(plan.id)}
                    >
                      Subscribe to {plan.name}
                    </Button>
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