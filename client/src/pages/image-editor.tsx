import { useEffect, useState } from 'react';
import { Download, Wand2, Crown, AlertTriangle, ChevronDown, ChevronUp, Undo2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ImageInput } from '@/components/image-input';
import { ImageDisplay } from '@/components/image-display';
import { PromptInput } from '@/components/prompt-input';
import { useImageEditor } from '@/hooks/use-image-editor';
import { useSubscription } from '@/hooks/useSubscription';
import { Link } from 'wouter';
import type { RouteDefinition } from '@shared/route-metadata';

export const route: RouteDefinition = {
  path: "/image-editor",
  ssr: false,
  metadata: {
    title: "Image Editor - Flux-a-Image",
    description: "Edit and transform your images with AI-powered tools using natural language prompts.",
    canonical: "https://fluxaimage.com/image-editor",
    ogTitle: "AI Image Editor | Flux-a-Image",
    ogDescription: "Transform your images with AI-powered editing",
  },
};

// Helper function to create optimized image URLs
function getOptimizedImageUrl(url: string, width?: number, height?: number, quality: number = 80): string {
  if (!url.startsWith('/api/storage/')) {
    return url; // Return original URL if not from our storage
  }
  
  const params = new URLSearchParams();
  if (width) params.set('w', width.toString());
  if (height) params.set('h', height.toString());
  if (quality !== 80) params.set('q', quality.toString());
  
  const queryString = params.toString();
  return queryString ? `${url}?${queryString}` : url;
}

export default function ImageEditor() {
  useEffect(() => {
    document.title = route.metadata?.title || "Image Editor";
    
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
  const {
    imageData,
    isLoadingImage,
    isUploading,
    isGenerating,
    isMultiGenerating,
    isEditing,
    isResetting,
    isReverting,
    isUpscaling,
    handleUpload,
    handleGenerate,
    handleMultiGenerate,
    handleEdit,
    handleReset,
    handleRevert,
    handleNewImage,
    handleDownload,
    hasImage,
  } = useImageEditor();

  const { subscription, canAffordEdit, canAffordGeneration, canAffordMultiGeneration, canAffordUpscale, remainingCredits } = useSubscription();
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  const isProcessing = isEditing || isResetting || isReverting || isUploading || isGenerating || isMultiGenerating || isLoadingImage || isUpscaling;

  // Scroll to top when image is loaded or when page loads
  useEffect(() => {
    if (hasImage || (!hasImage && !isLoadingImage)) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [hasImage, isLoadingImage]);

  return (
    <main className="max-w-4xl mx-auto p-4 space-y-6">

        {/* Credit Warning */}
        {!canAffordEdit && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              You don't have enough credits to edit images (1 credit needed). 
              <Link href="/subscription" className="underline ml-1">
                Upgrade your plan
              </Link> to get more credits.
            </AlertDescription>
          </Alert>
        )}

        {/* Low Credit Warning */}
        {canAffordEdit && remainingCredits <= 10 && remainingCredits > 0 && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              You have {remainingCredits} credits remaining this month. 
              <Link href="/subscription" className="underline ml-1">
                Consider upgrading
              </Link> to get more credits.
            </AlertDescription>
          </Alert>
        )}

        {/* Generation Credit Warning */}
        {!canAffordGeneration && canAffordEdit && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              You don't have enough credits to generate images (1 credit needed). 
              <Link href="/subscription" className="underline ml-1">
                Upgrade your plan
              </Link> to get more credits.
            </AlertDescription>
          </Alert>
        )}

        {/* Image Section */}
        <div className="bg-card rounded-xl p-6 border border-border">
          {!hasImage ? (
            <ImageInput 
              onUpload={handleUpload} 
              onGenerate={handleGenerate}
              onMultiGenerate={handleMultiGenerate}
              isUploading={isUploading}
              isGenerating={isGenerating}
              isMultiGenerating={isMultiGenerating}
              isGenerationDisabled={!canAffordGeneration}
              isMultiGenerationDisabled={!canAffordMultiGeneration}
            />
          ) : (
            <ImageDisplay
              imageUrl={imageData!.currentUrl}
              isProcessing={isProcessing}
              editCount={imageData!.editHistory?.length || 0}
              editHistory={imageData!.editHistory}
              originalUrl={imageData!.originalUrl}
              onReset={handleReset}
              onNewImage={handleNewImage}
              onDownload={handleDownload}
              onRevert={handleRevert}
              isResetting={isResetting}
              isReverting={isReverting}
              isUpscaling={isUpscaling}
            />
          )}
        </div>

        {/* Prompt Section */}
        {hasImage && (
          <div className="bg-card rounded-xl p-6 border border-border">
            <PromptInput
              onSubmit={handleEdit}
              isProcessing={isProcessing}
              disabled={!hasImage || !canAffordEdit}
            />

            {/* Edit History */}
            <div className="mt-6">
              <Collapsible open={isHistoryOpen} onOpenChange={setIsHistoryOpen}>
                <div className="bg-muted rounded-xl p-4 border border-border">
                  <CollapsibleTrigger asChild>
                    <Button variant="ghost" className="w-full p-0 h-auto justify-between">
                      <div className="flex items-center justify-between text-sm w-full">
                        <span className="text-muted-foreground">Edits made:</span>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-foreground">{imageData?.editHistory?.length || 0}</span>
                          {(imageData?.editHistory?.length || 0) > 0 && (
                            isHistoryOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                          )}
                        </div>
                      </div>
                    </Button>
                  </CollapsibleTrigger>
                  
                  <CollapsibleContent className="mt-4">
                    {imageData?.editHistory && imageData.editHistory.length > 0 && (
                      <div className="space-y-3">
                        {/* Original Image */}
                        <div className="flex items-center gap-3 p-3 bg-background rounded-lg border border-border">
                          <div className="relative w-16 h-16 bg-muted rounded-lg overflow-hidden flex-shrink-0">
                            <img
                              src={getOptimizedImageUrl(imageData.originalUrl, 128, 128, 70)}
                              alt="Original image"
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground">Original Image</p>
                            <p className="text-xs text-muted-foreground">Starting point</p>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleRevert(-1)}
                            disabled={isProcessing || isReverting}
                            className="flex-shrink-0"
                          >
                            <Undo2 className="w-3 h-3 mr-1" />
                            Revert
                          </Button>
                        </div>

                        {/* Edit History Items */}
                        {imageData.editHistory.map((edit, index) => (
                          <div key={index} className="flex items-center gap-3 p-3 bg-background rounded-lg border border-border">
                            <div className="relative w-16 h-16 bg-muted rounded-lg overflow-hidden flex-shrink-0">
                              <img
                                src={getOptimizedImageUrl(edit.imageUrl, 128, 128, 70)}
                                alt={`Edit ${index + 1}`}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-foreground">Edit {index + 1}</p>
                              <p className="text-xs text-muted-foreground truncate">{edit.prompt}</p>
                              <p className="text-xs text-muted-foreground">
                                {new Date(edit.timestamp).toLocaleString()}
                              </p>
                            </div>
                            {index < imageData.editHistory.length - 1 && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleRevert(index)}
                                disabled={isProcessing || isReverting}
                                className="flex-shrink-0"
                              >
                                <Undo2 className="w-3 h-3 mr-1" />
                                Revert
                              </Button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </CollapsibleContent>
                </div>
              </Collapsible>
            </div>
          </div>
        )}

        {/* Subscription Status */}
        {subscription && (
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CardTitle className="text-lg">
                    {subscription.subscriptionTier === 'premium' && <Crown className="h-5 w-5 text-yellow-500" />}
                    {subscription.subscriptionTier === 'basic' && <Wand2 className="h-5 w-5 text-blue-500" />}
                    {subscription.subscriptionTier !== 'free' ? `${subscription.subscriptionTier} Plan` : 'Free Plan'}
                  </CardTitle>
                  <Badge variant={subscription.hasActiveSubscription ? "default" : "secondary"}>
                    {subscription.hasActiveSubscription ? "Active" : "Free"}
                  </Badge>
                </div>
                {!subscription.hasActiveSubscription && (
                  <Link href="/subscription">
                    <Button size="sm">
                      Upgrade
                    </Button>
                  </Link>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      {subscription.credits} / {subscription.maxCredits} credits remaining
                    </p>
                    <div className="w-full bg-secondary rounded-full h-2 mt-2">
                      <div 
                        className={`h-2 rounded-full transition-all ${
                          subscription.credits <= 0 ? 'bg-destructive' : 
                          subscription.credits <= 10 ? 'bg-yellow-500' : 'bg-primary'
                        }`}
                        style={{ width: `${Math.min((subscription.credits / subscription.maxCredits) * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-semibold">
                      {subscription.credits} credits
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 text-xs text-muted-foreground">
                  <div>Edit/Generation: 1 credit</div>
                  
                </div>
                {subscription.creditsResetDate && (
                  <p className="text-xs text-muted-foreground">
                    Credits reset on {new Date(subscription.creditsResetDate * 1000).toLocaleDateString()}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        )}

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
                {(subscription?.subscriptionTier === 'premium' || subscription?.subscriptionTier === 'premium-plus')
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
      </main>
  );
}