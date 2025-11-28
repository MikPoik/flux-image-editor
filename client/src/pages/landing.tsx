import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Navigation } from "@/components/navigation";
import { Footer } from "@/components/footer";
import {
  Wand2,
  Upload,
  Sparkles,
  ArrowRight,
  Star,
  Users,
  Zap,
} from "lucide-react";

import type { RouteDefinition } from "@shared/route-metadata";

export const route: RouteDefinition = {
  path: "/",
  ssr: true,
  metadata: {
    title: "AI Image Editor - Transform Images with AI Magic | Free Online Tool",
    description:
      "Create and edit images with AI using natural language. Upload photos or generate from text, then transform with simple prompts. Free tier available with professional results.",
    keywords:
      "AI image editor, image generation, photo editing, artificial intelligence, flux ai, text to image, image transformation",
    canonical: "https://fluxaimage.com",
    ogTitle: "AI Image Editor - Transform Images with AI Magic",
    ogDescription:
      "Create and edit images with AI using natural language. Upload photos or generate from text, then transform with simple prompts.",
    ogImage: "https://fluxaimage.com/flux-woman-smiling.png",
    structuredData: {
      "@context": "https://schema.org",
      "@type": "WebApplication",
      name: "AI Image Editor",
      description: "Create and edit images with AI using natural language prompts",
      url: "https://fluxaimage.com",
      applicationCategory: "DesignApplication",
      operatingSystem: "Web Browser",
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "USD",
        description: "Free tier with premium upgrades available",
      },
      featureList: [
        "AI Image Generation",
        "Natural Language Editing",
        "Photo Upload and Transform",
        "Professional Quality Results",
      ],
    },
  },
};

export default function Landing() {
  return (
    <div className="min-h-screen">
      <Navigation />

      {/* Hero Section */}
      <header className="relative overflow-hidden bg-gradient-to-br from-white via-slate-100 to-white dark:from-slate-950 dark:via-purple-950 dark:to-slate-950">
        {/* Animated background orbs */}
        <div className="absolute top-0 left-0 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-float"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-float" style={{animationDelay: '2s'}}></div>
        <div className="absolute -bottom-8 left-20 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-float" style={{animationDelay: '4s'}}></div>
        
        <div className="container mx-auto px-4 py-16 relative z-10">
          <section className="text-center mb-16">
            <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-500/20 to-purple-500/20 backdrop-blur-sm border border-blue-400/30 rounded-full text-blue-700 dark:text-blue-200 text-sm font-medium mb-6 hover:from-blue-500/30 hover:to-purple-500/30 transition-all">
              <Star className="w-4 h-4 mr-2" />
              Powered by Flux.ai Kontext Pro & Max
            </div>

            <h1 className="text-5xl md:text-7xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 dark:from-blue-200 dark:via-purple-200 dark:to-pink-200 mb-6 leading-tight">
              Transform Images with
              <span className="block">AI Magic</span>
            </h1>

            <p className="text-xl text-slate-700 dark:text-slate-400 mb-8 max-w-3xl mx-auto leading-relaxed">
              Upload any image or generate from text, then edit with simple
              prompts. Remove objects, change backgrounds, add elements, or
              completely transform your vision into reality.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
              <Button
                size="lg"
                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-8 py-4 text-lg font-semibold shadow-lg shadow-purple-500/50 hover:shadow-xl hover:shadow-purple-600/60 transition-all duration-300 animate-glow"
                onClick={() => (window.location.href = "/api/login")}
              >
                Start Editing Free
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>

              <Button
                size="lg"
                className="border-2 border-purple-400 text-purple-600 dark:text-purple-600 dark:text-purple-200 hover:bg-purple-100 dark:hover:bg-purple-600/20 backdrop-blur-sm px-8 py-4 text-lg font-semibold transition-all duration-300"
                onClick={() => (window.location.href = "/pricing")}
              >
                View Pricing
              </Button>
            </div>

            <div className="flex justify-center items-center text-sm text-slate-700 dark:text-slate-400 mb-8">
              <Users className="w-4 h-4 mr-2" />
              Join thousands of creators
            </div>

            {/* Trust Indicators */}
            <div className="flex flex-wrap justify-center items-center gap-8 text-sm text-slate-700 dark:text-slate-400">
              <div className="flex items-center bg-gradient-to-r from-yellow-500/10 to-orange-500/10 px-3 py-2 rounded-lg backdrop-blur-sm">
                <Zap className="w-4 h-4 mr-2 text-yellow-600 dark:text-yellow-400" />
                Lightning Fast Processing
              </div>
              <div className="flex items-center bg-gradient-to-r from-blue-500/10 to-cyan-500/10 px-3 py-2 rounded-lg backdrop-blur-sm">
                <Star className="w-4 h-4 mr-2 text-cyan-600 dark:text-cyan-400" />
                Professional Quality Results
              </div>
              <div className="flex items-center bg-gradient-to-r from-green-500/10 to-emerald-500/10 px-3 py-2 rounded-lg backdrop-blur-sm">
                <Upload className="w-4 h-4 mr-2 text-green-600 dark:text-green-400" />
                No Watermarks
              </div>
            </div>
          </section>

          {/* Before/After Examples */}
          <section className="max-w-6xl mx-auto mb-16">
            <h2 className="text-4xl font-bold text-center mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-200 dark:to-purple-200">
              See the Magic in Action
            </h2>
            <p className="text-center text-slate-700 dark:text-slate-300 mb-12">Real transformations powered by AI</p>

            <div className="grid md:grid-cols-2 gap-8 mb-8">
              {/* Example 1 */}
              <div className="bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-900 border border-purple-500/20 rounded-2xl p-6 shadow-xl hover:shadow-2xl hover:shadow-purple-500/10 transition-all duration-300">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
                  Object Removal & Background Change
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-2 font-medium">
                      Before
                    </p>
                    <div className="aspect-square bg-gradient-to-br from-gray-600 to-gray-700 rounded-xl flex items-center justify-center border border-slate-300/50 dark:border-slate-600/50 overflow-hidden">
                      <img
                        src="/flux-woman-smiling.png"
                        alt="Woman smiling"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-2 font-medium">
                      After
                    </p>
                    <div className="aspect-square bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center border border-purple-400/50 overflow-hidden">
                      <img
                        src="/flux-woman-smiling-futuristic.png"
                        alt="Same person now in futuristic city"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-3 italic font-medium">
                  "Change the background to a futuristic city"
                </p>
              </div>

              {/* Example 2 */}
              <div className="bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-900 border border-cyan-500/20 rounded-2xl p-6 shadow-xl hover:shadow-2xl hover:shadow-cyan-500/10 transition-all duration-300">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
                  Style Transfer & Enhancement
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-2 font-medium">
                      Before
                    </p>
                    <div className="aspect-square bg-gradient-to-br from-gray-600 to-gray-700 rounded-xl flex items-center justify-center border border-slate-300/50 dark:border-slate-600/50 overflow-hidden">
                      <img
                        src="/flux-garden-daylight.jpg"
                        alt="Simple sketch-style drawing of a basic house with plain lines and no color details"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-2 font-medium">
                      After
                    </p>
                    <div className="aspect-square bg-gradient-to-br from-yellow-600 to-orange-600 rounded-xl flex items-center justify-center border border-orange-400/50 overflow-hidden">
                      <img
                        src="/flux-garden-night.png"
                        alt="Garden at night"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-3 italic font-medium">
                  "Change the lighting to night, add vibrant colors, and enhance"
                </p>
              </div>
            </div>

            {/* Example 3 */}
            <div className="bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-900 border border-pink-500/20 rounded-2xl p-6 shadow-xl hover:shadow-2xl hover:shadow-pink-500/10 transition-all duration-300 max-w-3xl mx-auto">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
                Object Addition & Scene Composition
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-2 font-medium">
                    Before
                  </p>
                  <div className="aspect-square bg-gradient-to-br from-green-600 to-blue-600 rounded-xl flex items-center justify-center border border-green-400/50 overflow-hidden">
                    <img
                      src="/flux-robot.png"
                      alt="Robot smiling"
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-2 font-medium">
                    After
                  </p>
                  <div className="aspect-square bg-gradient-to-br from-pink-600 via-purple-600 to-blue-600 rounded-xl flex items-center justify-center border border-pink-400/50 overflow-hidden">
                    <img
                      src="/flux-robot-dancing.png"
                      alt="Robot dancing"
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-3 italic font-medium">
                "Make the robot dance with vibrant lights and confetti"
              </p>
            </div>
          </section>

          {/* Feature Cards */}
          <section className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto" aria-labelledby="features-heading">
            <h2 id="features-heading" className="sr-only">Key Features</h2>
            <div className="bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-900 border border-blue-500/20 rounded-2xl p-8 text-center hover:border-blue-400/50 hover:shadow-xl hover:shadow-blue-500/10 transition-all duration-300">
              <Upload className="w-12 h-12 text-blue-400 mx-auto mb-4" />
              <h3 className="font-semibold text-slate-900 dark:text-white text-lg mb-2">Upload or Generate</h3>
              <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                Start with your own images or create new ones from text descriptions using advanced AI models
              </p>
            </div>

            <div className="bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-900 border border-purple-500/20 rounded-2xl p-8 text-center hover:border-purple-400/50 hover:shadow-xl hover:shadow-purple-500/10 transition-all duration-300">
              <Wand2 className="w-12 h-12 text-purple-400 mx-auto mb-4" />
              <h3 className="font-semibold text-slate-900 dark:text-white text-lg mb-2">Edit with Natural Language</h3>
              <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                Simply describe what you want changed. Remove objects, add elements, change styles, or transform completely
              </p>
            </div>

            <div className="bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-900 border border-pink-500/20 rounded-2xl p-8 text-center hover:border-pink-400/50 hover:shadow-xl hover:shadow-pink-500/10 transition-all duration-300">
              <Sparkles className="w-12 h-12 text-pink-400 mx-auto mb-4" />
              <h3 className="font-semibold text-slate-900 dark:text-white text-lg mb-2">Professional Results</h3>
              <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                Get high-quality, professional-grade images powered by cutting-edge Flux AI technology
              </p>
            </div>
          </section>

          {/* Social Proof */}
          <section className="mt-20 text-center" aria-labelledby="testimonials-heading">
            <h2 id="testimonials-heading" className="sr-only">Customer Testimonials</h2>
            <div className="bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-900 border border-yellow-500/20 rounded-2xl p-8 max-w-2xl mx-auto shadow-xl hover:shadow-2xl hover:shadow-yellow-500/10 transition-all duration-300">
              <div className="flex justify-center mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className="w-5 h-5 text-yellow-600 dark:text-yellow-400 fill-current"
                  />
                ))}
              </div>
              <blockquote className="text-lg text-slate-900 dark:text-slate-200 mb-4 leading-relaxed">
                "This AI image editor is incredible! I transformed my old
                vacation photos into artistic masterpieces in minutes. The
                results are so professional, my friends thought I hired a
                designer."
              </blockquote>
              <cite className="text-sm text-slate-600 dark:text-slate-400">
                — Sarah M., Creative Professional
              </cite>
            </div>

            <div className="mt-12 text-center">
              <p className="text-slate-600 dark:text-slate-400 mb-6">
                Join thousands of creators transforming their images with AI
              </p>
              <Button
                size="lg"
                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-8 py-4 text-lg font-semibold shadow-lg shadow-purple-500/50 hover:shadow-xl hover:shadow-purple-600/60 transition-all duration-300"
                onClick={() => (window.location.href = "/api/login")}
              >
                Start Your Free Trial
              </Button>
            </div>
          </section>
        </div>
      </header>
      <Footer />
    </div>
  );
}
