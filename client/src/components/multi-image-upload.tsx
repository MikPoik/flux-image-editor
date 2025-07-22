import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { FolderOpen, X, Upload, Images } from 'lucide-react';
import { generateMultiImage } from '@/lib/flux-api';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface MultiImageUploadProps {
  onGenerate: (files: File[], prompt: string) => void;
  isGenerating: boolean;
  isDisabled?: boolean;
}

export function MultiImageUpload({ onGenerate, isGenerating, isDisabled = false }: MultiImageUploadProps) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [prompt, setPrompt] = useState('');
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // Limit to 5 files maximum
    const validFiles = files.slice(0, 5).filter(file => file.type.startsWith('image/'));
    
    if (validFiles.length !== files.length) {
      console.warn('Some files were filtered out. Only image files are allowed.');
    }

    setSelectedFiles(validFiles);
    
    // Create preview URLs
    const urls = validFiles.map(file => URL.createObjectURL(file));
    setPreviewUrls(urls);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();

    const files = Array.from(e.dataTransfer.files);
    const validFiles = files.slice(0, 5).filter(file => file.type.startsWith('image/'));
    
    if (validFiles.length > 0) {
      setSelectedFiles(validFiles);
      const urls = validFiles.map(file => URL.createObjectURL(file));
      setPreviewUrls(urls);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const removeFile = useCallback((index: number) => {
    const newFiles = selectedFiles.filter((_, i) => i !== index);
    const newUrls = previewUrls.filter((_, i) => i !== index);
    
    // Revoke the URL to free memory
    URL.revokeObjectURL(previewUrls[index]);
    
    setSelectedFiles(newFiles);
    setPreviewUrls(newUrls);
  }, [selectedFiles, previewUrls]);

  const handleSubmit = useCallback(() => {
    if (selectedFiles.length >= 2 && prompt.trim() && !isGenerating) {
      onGenerate(selectedFiles, prompt.trim());
    }
  }, [selectedFiles, prompt, isGenerating, onGenerate]);

  const isSubmitDisabled = selectedFiles.length < 2 || !prompt.trim() || isGenerating || isDisabled;

  return (
    <div className="relative space-y-6">
      {/* Processing Overlay for entire component */}
      {isGenerating && (
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center rounded-2xl z-10">
          <div className="text-center text-white">
            <div className="animate-spin w-8 h-8 border-3 border-white/30 border-t-white rounded-full mx-auto mb-3"></div>
            <p className="text-sm font-medium">AI is combining your images...</p>
            <p className="text-xs text-white/80 mt-1">This may take a few moments</p>
          </div>
        </div>
      )}
      
      {/* File Upload Area */}
      <div className="relative bg-background rounded-2xl border-2 border-dashed border-muted-foreground hover:border-blue-500 transition-colors">
        <div
          className="p-8 text-center cursor-pointer"
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onClick={() => document.getElementById('multi-file-input')?.click()}
        >
          <div className="space-y-4">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto">
              <Images className="w-8 h-8 text-muted-foreground" />
            </div>
            <div>
              <p className="text-lg font-medium text-foreground">
                {selectedFiles.length > 0 ? `${selectedFiles.length} images selected` : 'Upload multiple images to combine'}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Drag and drop 2-5 images or click to browse
              </p>
            </div>
            <Button 
              disabled={isGenerating}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <FolderOpen className="w-4 h-4 mr-2" />
              Choose Images
            </Button>
          </div>
        </div>
        <input
          id="multi-file-input"
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileChange}
          className="hidden"
          disabled={isGenerating}
        />
      </div>

      {/* Image Previews */}
      {selectedFiles.length > 0 && (
        <div className="space-y-4">
          <Label className="text-sm font-medium">Selected Images ({selectedFiles.length}/5)</Label>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {previewUrls.map((url, index) => (
              <div key={index} className="relative group">
                <div className="aspect-square rounded-lg overflow-hidden bg-muted">
                  <img
                    src={url}
                    alt={`Preview ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFile(index);
                  }}
                  className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  disabled={isGenerating}
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Prompt Input */}
      {selectedFiles.length >= 2 && (
        <div className="space-y-4">
          <Label htmlFor="multi-prompt" className="text-sm font-medium">
            Describe how you want to combine these images
          </Label>
          <Textarea
            id="multi-prompt"
            placeholder="e.g., 'Combine these images into a single artistic composition' or 'Create a collage with these photos'"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            disabled={isGenerating}
            rows={3}
            className="resize-none"
          />
          <Button
            onClick={handleSubmit}
            disabled={isSubmitDisabled}
            className="w-full"
          >
            {isGenerating ? (
              <>
                <div className="animate-spin w-4 h-4 border-2 border-white/30 border-t-white rounded-full mr-2"></div>
                Combining Images...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Combine Images with AI
              </>
            )}
          </Button>
        </div>
      )}

      {selectedFiles.length === 1 && (
        <p className="text-sm text-muted-foreground text-center">
          Add at least one more image to start combining
        </p>
      )}
    </div>
  );
}