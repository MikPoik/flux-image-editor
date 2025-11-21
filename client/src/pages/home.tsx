import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Images, Plus, Wand2 } from "lucide-react";
import { Link } from "wouter";
import { useSubscription } from "@/hooks/useSubscription";
import { useEffect } from "react";

export default function Home() {
  const { subscription } = useSubscription();

  useEffect(() => {
    document.title = "Home - Flux-a-Image";

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

    updateMetaTag('description', 'Transform your images with AI-powered editing tools. Upload, generate, and edit images using natural language.');
    updateMetaTag('og:title', 'Flux-a-Image | AI Image Editor');
    updateMetaTag('og:description', 'Transform your images with AI-powered editing');
    
    let link = document.querySelector('link[rel="canonical"]');
    if (!link) {
      link = document.createElement('link');
      link.setAttribute('rel', 'canonical');
      document.head.appendChild(link);
    }
    link.setAttribute('href', 'https://fluxaimage.com');
  }, []);

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 container mx-auto px-4 py-8">
        <section className="text-center max-w-2xl mx-auto">
          <h1 className="text-4xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-200 to-purple-200">Welcome to AI Image Editor</h1>
          <p className="text-slate-400 mb-8 text-lg">
            Generate new images from text or upload existing photos, then transform them with AI-powered editing using natural language prompts.
          </p>

          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700/50 rounded-2xl p-6 hover:border-blue-400/50 hover:shadow-xl hover:shadow-blue-500/10 transition-all duration-300">
              <div className="pb-4 mb-4 border-b border-slate-700/50">
                <h3 className="text-xl font-semibold text-white flex items-center gap-2 justify-center">
                  <Plus className="h-5 w-5" />
                  Create New Image
                </h3>
              </div>
              <div>
                <p className="text-slate-400 mb-4">
                  Upload photos or generate images from text, then edit with AI prompts
                </p>
                <Link href="/image-editor">
                  <Button className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700">
                    Start Editing
                  </Button>
                </Link>
              </div>
            </div>

            <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700/50 rounded-2xl p-6 hover:border-purple-400/50 hover:shadow-xl hover:shadow-purple-500/10 transition-all duration-300">
              <div className="pb-4 mb-4 border-b border-slate-700/50">
                <h3 className="text-xl font-semibold text-white flex items-center gap-2 justify-center">
                  <Images className="h-5 w-5" />
                  View Gallery
                </h3>
              </div>
              <div>
                <p className="text-slate-400 mb-4">
                  Browse and manage your previously edited images
                </p>
                <Link href="/gallery">
                  <Button className="w-full border border-slate-600 text-slate-200 hover:bg-slate-700 hover:text-white">
                    Open Gallery
                  </Button>
                </Link>
              </div>
            </div>
          </div>

          {/* Feature Highlights */}
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 border border-slate-700/50">
            <h2 className="text-lg font-semibold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-200 to-purple-200">
              Powered by Flux.ai Kontext{subscription?.subscriptionTier === 'premium' ? ' Max' : ' Pro'}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-slate-700/30 border border-slate-600/50 rounded-lg">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500/20 to-blue-600/20 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Wand2 className="w-6 h-6 text-blue-400" />
                </div>
                <h3 className="font-medium text-white mb-2">AI-Powered</h3>
                <p className="text-sm text-slate-400">
                  {subscription?.subscriptionTier === 'premium' 
                    ? 'Highest quality image editing with Kontext Max model' 
                    : 'State-of-the-art image editing using advanced AI models'
                  }
                </p>
              </div>
              <div className="text-center p-4 bg-slate-700/30 border border-slate-600/50 rounded-lg">
                <div className="w-12 h-12 bg-gradient-to-br from-green-500/20 to-green-600/20 rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </div>
                <h3 className="font-medium text-white mb-2">Iterative Editing</h3>
                <p className="text-sm text-slate-400">Make multiple edits to refine your perfect image</p>
              </div>
              <div className="text-center p-4 bg-slate-700/30 border border-slate-600/50 rounded-lg">
                <div className="w-12 h-12 bg-gradient-to-br from-yellow-500/20 to-yellow-600/20 rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="font-medium text-white mb-2">Mobile Optimized</h3>
                <p className="text-sm text-slate-400">Designed for seamless editing on any device</p>
              </div>
            </div>
          </div>
        </section>
      </main>
  );
}