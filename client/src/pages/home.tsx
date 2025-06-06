import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Images, Plus, Wand2 } from "lucide-react";
import { Link } from "wouter";
import { useSubscription } from "@/hooks/useSubscription";

export default function Home() {
  const { subscription } = useSubscription();

  return (
    <main className="container mx-auto px-4 py-8">
        <div className="text-center max-w-2xl mx-auto">
          <h2 className="text-3xl font-bold mb-4">Welcome to AI Image Editor</h2>
          <p className="text-muted-foreground mb-8">
            Generate new images from text or upload existing photos, then transform them with AI-powered editing using natural language prompts.
          </p>
          
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <Card className="p-6 hover:shadow-lg transition-shadow">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2">
                  <Plus className="h-5 w-5" />
                  Create New Image
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  Upload photos or generate images from text, then edit with AI prompts
                </p>
                <Link href="/image-editor">
                  <Button className="w-full">
                    Start Editing
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="p-6 hover:shadow-lg transition-shadow">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2">
                  <Images className="h-5 w-5" />
                  View Gallery
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  Browse and manage your previously edited images
                </p>
                <Link href="/gallery">
                  <Button variant="outline" className="w-full">
                    Open Gallery
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>

          {/* Feature Highlights */}
          <div className="bg-card rounded-xl p-6 border border-border">
            <h2 className="text-lg font-semibold mb-4">
              Powered by Flux.ai Kontext{subscription?.subscriptionTier === 'premium' ? ' Max' : ' Pro'}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4">
                <div className="w-12 h-12 bg-blue-600/20 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Wand2 className="w-6 h-6 text-blue-400" />
                </div>
                <h3 className="font-medium text-foreground mb-2">AI-Powered</h3>
                <p className="text-sm text-muted-foreground">
                  {subscription?.subscriptionTier === 'premium' 
                    ? 'Highest quality image editing with Kontext Max model' 
                    : 'State-of-the-art image editing using advanced AI models'
                  }
                </p>
              </div>
              <div className="text-center p-4">
                <div className="w-12 h-12 bg-green-600/20 rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </div>
                <h3 className="font-medium text-foreground mb-2">Iterative Editing</h3>
                <p className="text-sm text-muted-foreground">Make multiple edits to refine your perfect image</p>
              </div>
              <div className="text-center p-4">
                <div className="w-12 h-12 bg-yellow-600/20 rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="font-medium text-foreground mb-2">Mobile Optimized</h3>
                <p className="text-sm text-muted-foreground">Designed for seamless editing on any device</p>
              </div>
            </div>
          </div>
        </div>
      </main>
  );
}