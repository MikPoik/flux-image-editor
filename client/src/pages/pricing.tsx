import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
      name: "Trial",
      price: "0€",
      period: " (one-time)",
      credits: 30,
      features: [
        "30 one-time credits",
        "Editing/Generation: 1 credit each",
        "Upscales: Free",
        "Kontext Pro AI model",
        "Basic support",
      ],
      popular: false,
      cta: "Get Started Free",
    },
    {
      id: "basic",
      name: "Basic Plan",
      price: "5€",
      period: "/month",
      credits: 120,
      features: [
        "120 credits per month",
        "Editing/Generation: 1 credit each",
        "Upscales: Free",
        "Kontext Pro AI model",
        "Email support",
      ],
      popular: false,
      cta: "Start Basic Plan",
    },
    {
      id: "premium",
      name: "Premium Plan",
      price: "10€",
      period: "/month",
      credits: 200,
      features: [
        "200 credits per month",
        "Editing/Generation: 1 credit each",
        "Upscales: Free",
        "Kontext Max AI model (highest quality)",
        "Priority support",
      ],
      popular: true,
      cta: "Start Premium Plan",
    },
    {
      id: "premium-plus",
      name: "Premium Plus Plan",
      price: "15€",
      period: "/month",
      credits: 300,
      features: [
        "300 credits per month",
        "Editing/Generation: 1 credit each",
        "Upscales: Free",
        "Kontext Max AI model (highest quality)",
        "Priority support",
        "Advanced features",
      ],
      popular: false,
      cta: "Start Premium Plus Plan",
    },
  ];

  const handleGetStarted = () => {
    window.location.href = "/api/login";
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-slate-50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-950">
      <Navigation />

      <div className="container mx-auto px-4 py-16 max-w-6xl">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-500/20 to-purple-500/20 backdrop-blur-sm border border-blue-400/30 rounded-full text-blue-300 dark:text-blue-200 text-sm font-medium mb-6 hover:from-blue-500/30 hover:to-purple-500/30 transition-all">
            <Star className="w-4 h-4 mr-2" />
            Powered by Flux.ai Kontext Pro & Max
          </div>

          <h1 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-200 via-purple-200 to-pink-200 mb-6">
            Choose Your Perfect Plan
          </h1>

          <p className="text-xl text-slate-600 dark:text-slate-300 mb-8 max-w-3xl mx-auto leading-relaxed">
            Transform your images with AI-powered editing. Start free and
            upgrade as you grow.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`relative bg-gradient-to-br from-slate-800 to-slate-900 border rounded-2xl p-8 transition-all duration-300 ${plan.popular ? "border-2 border-purple-400 scale-105 shadow-2xl shadow-purple-500/20" : "border border-slate-700/50 hover:border-blue-400/50 hover:shadow-xl hover:shadow-blue-500/10"}`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-1 rounded-full text-xs font-semibold">
                  Most Popular
                </div>
              )}
              <div className="text-center mb-6">
                <div className="flex justify-center mb-4">
                  {plan.id === "premium" || plan.id === "premium-plus" ? (
                    <Crown className="h-8 w-8 text-yellow-400" />
                  ) : plan.id === "basic" ? (
                    <Zap className="h-8 w-8 text-blue-400" />
                  ) : (
                    <Star className="h-8 w-8 text-slate-400" />
                  )}
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">{plan.name}</h3>
                <div className="text-center">
                  <span className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-300 to-purple-300">
                    {plan.price}
                  </span>
                  <span className="text-slate-400 ml-2">{plan.period}</span>
                </div>
              </div>

              <div className="space-y-6">
                <div className="text-center pb-6 border-b border-slate-700/50">
                  <p className="text-lg font-semibold text-slate-200">
                    {plan.id === "free" ? `${plan.credits} one-time credits` : `${plan.credits} credits/month`}
                  </p>
                  {plan.id !== "free" && (
                    <p className="text-sm text-slate-400 mt-1">
                      Credits reset monthly
                    </p>
                  )}
                </div>

                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <Check className="h-4 w-4 text-green-400 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-slate-300">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  className={`w-full font-semibold transition-all duration-300 ${plan.popular ? "bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white shadow-lg shadow-purple-500/50" : "bg-slate-700 hover:bg-slate-600 text-white border border-slate-600 hover:border-blue-400"}`}
                  onClick={handleGetStarted}
                >
                  {plan.cta}
                </Button>
              </div>
            </div>
          ))}
        </div>

        {/* Features Comparison */}
        <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-8 border border-slate-700/50 mb-16">
          <h2 className="text-2xl font-bold text-center mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-200 dark:to-purple-200">
            What's Included
          </h2>
          <p className="text-center text-slate-400 mb-12">Everything you need to transform your images</p>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500/20 to-blue-600/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-blue-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v14a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold mb-2 text-white">Advanced AI Models</h3>
              <p className="text-slate-400 text-sm">
                Access to Flux.ai Kontext Pro and Max models for the highest
                quality image editing and generation.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-green-500/20 to-green-600/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-green-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold mb-2 text-white">Lightning Fast</h3>
              <p className="text-slate-400 text-sm">
                Fast processing times with optimized infrastructure for the best
                user experience.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500/20 to-purple-600/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-purple-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold mb-2 text-white">Full Control</h3>
              <p className="text-slate-400 text-sm">
                Complete editing history, revert capabilities, and fine-grained
                control over your creations.
              </p>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-8 border border-slate-700/50 mb-16">
          <h2 className="text-2xl font-bold text-center mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-200 dark:to-purple-200">
            Frequently Asked Questions
          </h2>
          <p className="text-center text-slate-400 mb-8">Common questions about our pricing and plans</p>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-slate-200/30 dark:bg-slate-700/30 border border-slate-300/50 dark:border-slate-600/50 rounded-lg p-4">
              <h3 className="font-semibold mb-2 text-white">How do credits work?</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Each edit or generation costs 1 credit. Upscaling is free.
                Credits reset monthly on your billing date.
              </p>
            </div>

            <div className="bg-slate-200/30 dark:bg-slate-700/30 border border-slate-300/50 dark:border-slate-600/50 rounded-lg p-4">
              <h3 className="font-semibold mb-2 text-white">Can I cancel anytime?</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Yes, you can cancel your subscription at any time. You'll retain
                access until the end of your billing period.
              </p>
            </div>

            <div className="bg-slate-200/30 dark:bg-slate-700/30 border border-slate-300/50 dark:border-slate-600/50 rounded-lg p-4">
              <h3 className="font-semibold mb-2 text-white">
                What's the difference between models?
              </h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Kontext Pro provides excellent quality, while Kontext Max offers
                the highest quality results with more detail and accuracy.
              </p>
            </div>

            <div className="bg-slate-200/30 dark:bg-slate-700/30 border border-slate-300/50 dark:border-slate-600/50 rounded-lg p-4">
              <h3 className="font-semibold mb-2 text-white">
                Do unused credits roll over?
              </h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Credits reset monthly and don't roll over. We recommend choosing
                a plan that fits your monthly usage.
              </p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center mt-16 bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-900 border border-slate-300 dark:border-slate-700/50 rounded-2xl p-12">
          <h2 className="text-3xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-200 via-purple-200 to-pink-200">
            Ready to Transform Your Images?
          </h2>
          <p className="text-slate-400 mb-8 text-lg">
            Join thousands of creators using AI to bring their vision to life.
          </p>
          <Button
            size="lg"
            className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-8 py-4 text-lg font-semibold shadow-lg shadow-purple-500/50 hover:shadow-xl hover:shadow-purple-600/60 transition-all duration-300"
            onClick={handleGetStarted}
          >
            Start Creating Today
          </Button>
        </div>
      </div>
    </div>
  );
}
