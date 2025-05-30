import { Download, RotateCcw, Plus, ChevronDown, ChevronUp, Undo2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useState } from 'react';

interface ImageDisplayProps {
  imageUrl: string;
  isProcessing: boolean;
  editCount: number;
  editHistory?: Array<{
    prompt: string;
    imageUrl: string;
    timestamp: string;
  }>;
  originalUrl: string;
  onReset: () => void;
  onNewImage: () => void;
  onDownload: () => void;
  onRevert: (historyIndex: number) => void;
  isResetting: boolean;
  isReverting: boolean;
}

export function ImageDisplay({
  imageUrl,
  isProcessing,
  editCount,
  editHistory = [],
  originalUrl,
  onReset,
  onNewImage,
  onDownload,
  onRevert,
  isResetting,
  isReverting,
}: ImageDisplayProps) {
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  return (
    <div className="space-y-4">
      {/* Image Container */}
      <div className="relative bg-muted rounded-2xl overflow-hidden flex items-center justify-center min-h-[400px]">
        <img
          src={imageUrl}
          alt="Current editing image"
          className="max-w-full max-h-[600px] object-contain"
        />

        {/* Image Controls Overlay */}
        <div className="absolute top-3 right-3 flex space-x-2">
          <Button
            size="sm"
            variant="secondary"
            onClick={onReset}
            disabled={isProcessing || isResetting}
            className="bg-white/90 backdrop-blur-sm text-gray-700 hover:bg-white"
          >
            <RotateCcw className="w-4 h-4" />
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={onDownload}
            disabled={isProcessing}
            className="bg-white/90 backdrop-blur-sm text-gray-700 hover:bg-white"
          >
            <Download className="w-4 h-4" />
          </Button>
        </div>

        {/* Loading Overlay */}
        {isProcessing && (
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center rounded-2xl">
            <div className="text-center text-white">
              <div className="animate-spin w-8 h-8 border-3 border-white/30 border-t-white rounded-full mx-auto mb-3"></div>
              <p className="text-sm font-medium">AI is editing your image...</p>
              <p className="text-xs text-white/80 mt-1">This may take a few moments</p>
            </div>
          </div>
        )}
      </div>

      {/* Image Actions */}
      <div className="flex justify-between items-center">
        <Button
          variant="outline"
          onClick={onReset}
          disabled={isProcessing || isResetting}
        >
          <RotateCcw className="w-4 h-4 mr-2" />
          Reset to Original
        </Button>
        <Button
          variant="outline"
          onClick={onNewImage}
          disabled={isProcessing}
        >
          <Plus className="w-4 h-4 mr-2" />
          New Image
        </Button>
      </div>

      {/* Edit History */}
      <Collapsible open={isHistoryOpen} onOpenChange={setIsHistoryOpen}>
        <div className="bg-muted rounded-xl p-4 border border-border">
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="w-full p-0 h-auto justify-between">
              <div className="flex items-center justify-between text-sm w-full">
                <span className="text-muted-foreground">Edits made:</span>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-foreground">{editCount}</span>
                  {editCount > 0 && (
                    isHistoryOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                  )}
                </div>
              </div>
            </Button>
          </CollapsibleTrigger>
          
          <CollapsibleContent className="mt-4">
            {editHistory.length > 0 && (
              <div className="space-y-3">
                {/* Original Image */}
                <div className="flex items-center gap-3 p-3 bg-background rounded-lg border border-border">
                  <div className="relative w-16 h-16 bg-muted rounded-lg overflow-hidden flex-shrink-0">
                    <img
                      src={originalUrl}
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
                    onClick={() => onRevert(-1)}
                    disabled={isProcessing || isReverting}
                    className="flex-shrink-0"
                  >
                    <Undo2 className="w-3 h-3 mr-1" />
                    Revert
                  </Button>
                </div>

                {/* Edit History Items */}
                {editHistory.map((edit, index) => (
                  <div key={index} className="flex items-center gap-3 p-3 bg-background rounded-lg border border-border">
                    <div className="relative w-16 h-16 bg-muted rounded-lg overflow-hidden flex-shrink-0">
                      <img
                        src={edit.imageUrl}
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
                    {index < editHistory.length - 1 && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onRevert(index)}
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
  );
}
