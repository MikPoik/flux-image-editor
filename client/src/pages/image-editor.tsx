import { useEffect } from 'react';
import { Download, Wand2, Crown, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ImageInput } from '@/components/image-input';
import { ImageDisplay } from '@/components/image-display';
import { PromptInput } from '@/components/prompt-input';
import { useImageEditor } from '@/hooks/use-image-editor';
import { useSubscription } from '@/hooks/useSubscription';
import { Link } from 'wouter';

export default function ImageEditor() {
  const {
    imageData,
    isLoadingImage,
    isUploading,
    isGenerating,
    isEditing,
    isResetting,
    isReverting,
    isUpscaling,
    handleUpload,
    handleGenerate,
    handleEdit,
    handleReset,
    handleRevert,
    handleNewImage,
    handleDownload,
    hasImage,
  } = useImageEditor();

  const { subscription, isAtLimit, remainingEdits, isAtGenerationLimit, remainingGenerations } = useSubscription();

  const isProcessing = isEditing || isResetting || isReverting || isUploading || isGenerating || isLoadingImage || isUpscaling;

  // Scroll to top when image is loaded or when page loads
  useEffect(() => {
    if (hasImage || (!hasImage && !isLoadingImage)) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [hasImage, isLoadingImage]);

  return (
    <main className="max-w-4xl mx-auto p-4 space-y-6">

        {/* Edit Limit Warning */}
        {isAtLimit && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              You've reached your monthly edit limit. 
              <Link href="/subscription" className="underline ml-1">
                Upgrade your plan
              </Link> to continue editing images.
            </AlertDescription>
          </Alert>
        )}

        {/* Low Edit Warning */}
        {!isAtLimit && remainingEdits <= 3 && remainingEdits > 0 && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              You have {remainingEdits} edit{remainingEdits !== 1 ? 's' : ''} remaining this month. 
              <Link href="/subscription" className="underline ml-1">
                Consider upgrading
              </Link> to get more edits.
            </AlertDescription>
          </Alert>
        )}

        {/* Generation Limit Warning */}
        {isAtGenerationLimit && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              You've reached your monthly generation limit. 
              <Link href="/subscription" className="underline ml-1">
                Upgrade your plan
              </Link> to continue generating images.
            </AlertDescription>
          </Alert>
        )}

        {/* Low Generation Warning */}
        {!isAtGenerationLimit && remainingGenerations <= 3 && remainingGenerations > 0 && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              You have {remainingGenerations} generation{remainingGenerations !== 1 ? 's' : ''} remaining this month. 
              <Link href="/subscription" className="underline ml-1">
                Consider upgrading
              </Link> to get more generations.
            </AlertDescription>
          </Alert>
        )}

        {/* Image Section */}
        <div className="bg-card rounded-xl p-6 border border-border">
          {!hasImage ? (
            <ImageInput 
              onUpload={handleUpload} 
              onGenerate={handleGenerate}
              isUploading={isUploading}
              isGenerating={isGenerating}
              isGenerationDisabled={isAtGenerationLimit}
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
              disabled={!hasImage || isAtLimit}
            />

            {/* Edit History */}

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
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">
                    {subscription.editCount} / {subscription.editLimit} edits used this month
                  </p>
                  <div className="w-full bg-secondary rounded-full h-2 mt-2">
                    <div 
                      className={`h-2 rounded-full transition-all ${
                        isAtLimit ? 'bg-destructive' : 
                        remainingEdits <= 3 ? 'bg-yellow-500' : 'bg-primary'
                      }`}
                      style={{ width: `${Math.min((subscription.editCount / subscription.editLimit) * 100, 100)}%` }}
                    />
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-semibold">
                    {remainingEdits} left
                  </p>
                </div>
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