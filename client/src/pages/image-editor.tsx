import { Download, Wand2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ImageUpload } from '@/components/image-upload';
import { ImageDisplay } from '@/components/image-display';
import { PromptInput } from '@/components/prompt-input';
import { Navigation } from '@/components/navigation';
import { useImageEditor } from '@/hooks/use-image-editor';

export default function ImageEditor() {
  const {
    imageData,
    isLoadingImage,
    isUploading,
    isEditing,
    isResetting,
    isReverting,
    handleUpload,
    handleEdit,
    handleReset,
    handleRevert,
    handleNewImage,
    handleDownload,
    hasImage,
  } = useImageEditor();

  const isProcessing = isEditing || isResetting || isReverting || isUploading || isLoadingImage;

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <main className="max-w-4xl mx-auto p-4 space-y-6">
        {/* Image Section */}
        <div className="bg-card rounded-xl p-6 border border-border">
          {!hasImage ? (
            <ImageUpload 
              onUpload={handleUpload} 
              isUploading={isUploading}
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
            />
          )}
        </div>

        {/* Prompt Section */}
        {hasImage && (
          <div className="bg-card rounded-xl p-6 border border-border">
            <h2 className="text-lg font-semibold mb-4">Edit with AI</h2>
            <PromptInput
              onSubmit={handleEdit}
              isProcessing={isProcessing}
              disabled={!hasImage}
            />

            {/* Edit History */}
            {imageData?.editHistory && imageData.editHistory.length > 0 && (
              <div className="mt-6">
                <h3 className="text-sm font-medium text-muted-foreground mb-3">Recent Edits</h3>
                <div className="space-y-2">
                  {imageData.editHistory.slice(-3).reverse().map((edit, index) => (
                    <div key={index} className="bg-muted p-3 rounded-lg border border-border">
                      <p className="text-sm text-foreground">{edit.prompt}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(edit.timestamp).toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Feature Highlights */}
        <div className="bg-card rounded-xl p-6 border border-border">
          <h2 className="text-lg font-semibold mb-4">Powered by Flux.ai Kontext</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4">
              <div className="w-12 h-12 bg-blue-600/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <Wand2 className="w-6 h-6 text-blue-400" />
              </div>
              <h3 className="font-medium text-foreground mb-2">AI-Powered</h3>
              <p className="text-sm text-muted-foreground">State-of-the-art image editing using advanced AI models</p>
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
    </div>
  );
}
