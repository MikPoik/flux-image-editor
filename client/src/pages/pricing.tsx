
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Navigation } from "@/components/navigation";
import { Check, Crown, Zap, Star } from "lucide-react";
import type { RouteDefinition } from "@shared/route-metadata";

export const route: RouteDefinition = {
  path: "/pricing",
  ssr: true,
  metadata: {
    title: "Pricing - Flux-a-Image",
    description:
      "Choose the perfect AI image editing plan for your workflow. Flexible pricing tiers with generous free credits and premium features.",
    canonical: "https://fluxaimage.com/pricing",
    ogTitle: "Pricing Plans | Flux-a-Image",
    ogDescription:
      "Flexible pricing for AI-powered image editing. Start for free and upgrade when you’re ready.",
  },
};

export default function Pricing() {
  const plans = [
    {
      id: "free",
      name: "Free Plan",
      price: "0€",
      period: "/month",
      credits: 10,
      features: [
        "10 credits per month",
        "Editing/Generation: 1 credit each",
        "Upscales: Free",
        "Kontext Pro AI model",
        "Basic support"
      ],
      popular: false,
      cta: "Get Started Free"
    },
    {
      id: "basic",
      name: "Basic Plan",
      price: "5€",
      period: "/month",
      credits: 60,
      features: [
        "60 credits per month",
        "Editing/Generation: 1 credit each",
        "Upscales: Free",
        "Kontext Pro AI model",
        "Email support"
      ],
      popular: false,
      cta: "Start Basic Plan"
    },
    {
      id: "premium",
      name: "Premium Plan", 
      price: "10€",
      period: "/month",
      credits: 70,
      features: [
        "70 credits per month",
        "Editing/Generation: 1 credit each",
        "Upscales: Free",
        "Kontext Max AI model (highest quality)",
        "Priority support"
      ],
      popular: true,
      cta: "Start Premium Plan"
    },
    {
      id: "premium-plus",
      name: "Premium Plus Plan", 
      price: "15€",
      period: "/month",
      credits: 110,
      features: [
        "110 credits per month",
        "Editing/Generation: 1 credit each",
        "Upscales: Free",
        "Kontext Max AI model (highest quality)",
        "Priority support",
        "Advanced features"
      ],
      popular: false,
      cta: "Start Premium Plus Plan"
    },
  ];

  const handleGetStarted = () => {
    window.location.href = "/api/login";
  };

  return (
    <div className="min-h-screen">
      <Navigation />
      
      <div className="container mx-auto px-4 py-16 max-w-6xl">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center px-4 py-2 bg-blue-100 dark:bg-blue-900 rounded-full text-blue-800 dark:text-blue-200 text-sm font-medium mb-6">
            <Star className="w-4 h-4 mr-2" />
            Powered by Flux.ai Kontext Pro & Max
          </div>
          
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
            Choose Your Perfect Plan
          </h1>
          
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto">
            Transform your images with AI-powered editing. Start free and upgrade as you grow.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {plans.map((plan) => (
            <Card key={plan.id} className={`relative ${plan.popular ? 'ring-2 ring-blue-600 scale-105' : ''} hover:shadow-lg transition-all`}>
              {plan.popular && (
                <Badge className="absolute -top-2 left-1/2 transform -translate-x-1/2 bg-blue-600">
                  Most Popular
                </Badge>
              )}
              <CardHeader className="text-center">
                <div className="flex justify-center mb-4">
                  {plan.id === 'premium' || plan.id === 'premium-plus' ? (
                    <Crown className="h-8 w-8 text-yellow-500" />
                  ) : plan.id === 'basic' ? (
                    <Zap className="h-8 w-8 text-blue-500" />
                  ) : (
                    <Star className="h-8 w-8 text-gray-500" />
                  )}
                </div>
                <CardTitle className="text-xl">{plan.name}</CardTitle>
                <CardDescription>
                  <span className="text-3xl font-bold text-foreground">{plan.price}</span>
                  <span className="text-muted-foreground">{plan.period}</span>
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="text-center">
                  <p className="text-lg font-semibold">{plan.credits} credits/month</p>
                  <p className="text-sm text-muted-foreground">Credits reset monthly</p>
                </div>
                
                <ul className="space-y-3">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
                
                <Button 
                  className={`w-full ${plan.popular ? 'bg-blue-600 hover:bg-blue-700' : ''}`}
                  variant={plan.popular ? 'default' : 'outline'}
                  onClick={handleGetStarted}
                >
                  {plan.cta}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Features Comparison */}
        <div className="bg-card rounded-xl p-8 border border-border mb-16">
          <h2 className="text-2xl font-bold text-center mb-8">What's Included</h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-600/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold mb-2">Advanced AI Models</h3>
              <p className="text-muted-foreground">
                Access to Flux.ai Kontext Pro and Max models for the highest quality image editing and generation.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-green-600/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold mb-2">Lightning Fast</h3>
              <p className="text-muted-foreground">
                Fast processing times with optimized infrastructure for the best user experience.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-600/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold mb-2">Full Control</h3>
              <p className="text-muted-foreground">
                Complete editing history, revert capabilities, and fine-grained control over your creations.
              </p>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="bg-card rounded-xl p-8 border border-border">
          <h2 className="text-2xl font-bold text-center mb-8">Frequently Asked Questions</h2>
          
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="font-semibold mb-2">How do credits work?</h3>
              <p className="text-muted-foreground text-sm">
                Each edit or generation costs 1 credit. Upscaling is free. Credits reset monthly on your billing date.
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold mb-2">Can I cancel anytime?</h3>
              <p className="text-muted-foreground text-sm">
                Yes, you can cancel your subscription at any time. You'll retain access until the end of your billing period.
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold mb-2">What's the difference between models?</h3>
              <p className="text-muted-foreground text-sm">
                Kontext Pro provides excellent quality, while Kontext Max offers the highest quality results with more detail and accuracy.
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold mb-2">Do unused credits roll over?</h3>
              <p className="text-muted-foreground text-sm">
                Credits reset monthly and don't roll over. We recommend choosing a plan that fits your monthly usage.
              </p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center mt-16">
          <h2 className="text-3xl font-bold mb-4">Ready to Transform Your Images?</h2>
          <p className="text-muted-foreground mb-8">
            Join thousands of creators using AI to bring their vision to life.
          </p>
          <Button 
            size="lg" 
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 text-lg"
            onClick={handleGetStarted}
          >
            Start Creating Today
          </Button>
        </div>
      </div>
    </div>
  );
}
