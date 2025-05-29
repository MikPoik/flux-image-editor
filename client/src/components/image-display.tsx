import { Download, RotateCcw, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ImageDisplayProps {
  imageUrl: string;
  isProcessing: boolean;
  editCount: number;
  onReset: () => void;
  onNewImage: () => void;
  onDownload: () => void;
  isResetting: boolean;
}

export function ImageDisplay({
  imageUrl,
  isProcessing,
  editCount,
  onReset,
  onNewImage,
  onDownload,
  isResetting,
}: ImageDisplayProps) {
  return (
    <div className="space-y-4">
      {/* Image Container */}
      <div className="relative bg-gray-800 rounded-2xl overflow-hidden aspect-square">
        <img
          src={imageUrl}
          alt="Current editing image"
          className="w-full h-full object-cover"
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
          className="bg-gray-700 hover:bg-gray-600 text-gray-300 border-gray-600"
        >
          <RotateCcw className="w-4 h-4 mr-2" />
          Reset to Original
        </Button>
        <Button
          variant="outline"
          onClick={onNewImage}
          disabled={isProcessing}
          className="bg-gray-700 hover:bg-gray-600 text-gray-300 border-gray-600"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Image
        </Button>
      </div>

      {/* Image Stats */}
      <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-400">Edits made:</span>
          <span className="font-medium text-gray-200">{editCount}</span>
        </div>
      </div>
    </div>
  );
}
