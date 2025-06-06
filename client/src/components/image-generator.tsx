import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Wand2, Sparkles } from 'lucide-react';

interface ImageGeneratorProps {
  onGenerate: (prompt: string) => void;
  isGenerating: boolean;
}

export function ImageGenerator({ onGenerate, isGenerating }: ImageGeneratorProps) {
  const [prompt, setPrompt] = useState('');

  const handleSubmit = useCallback(() => {
    if (prompt.trim()) {
      onGenerate(prompt.trim());
    }
  }, [prompt, onGenerate]);

  const handleKeyPress = useCallback((event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSubmit();
    }
  }, [handleSubmit]);

  const quickPrompts = [
    "A serene mountain landscape at sunset",
    "A futuristic city skyline",
    "A cozy coffee shop interior",
    "A beautiful garden with flowers",
    "An abstract colorful painting"
  ];

  const useQuickPrompt = useCallback((quickPrompt: string) => {
    setPrompt(quickPrompt);
  }, []);

  return (
    <div className="relative bg-background rounded-2xl border-2 border-dashed border-muted-foreground hover:border-blue-500 transition-colors">
      <div className="p-8 text-center space-y-6">
        <div className="space-y-4">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <div>
            <p className="text-lg font-medium text-foreground">
              {isGenerating ? 'Generating...' : 'Generate an image with AI'}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Describe what you want to create
            </p>
          </div>
        </div>

        <div className="space-y-4 max-w-md mx-auto">
          <div className="relative">
            <Input
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="A beautiful sunset over mountains..."
              disabled={isGenerating}
              className="w-full pr-12"
            />
            <Button
              onClick={handleSubmit}
              disabled={!prompt.trim() || isGenerating}
              size="sm"
              className="absolute right-1 top-1/2 -translate-y-1/2 bg-blue-600 hover:bg-blue-700"
            >
              {isGenerating ? (
                <div className="animate-spin w-3 h-3 border border-white/30 border-t-white rounded-full" />
              ) : (
                <Wand2 className="w-3 h-3" />
              )}
            </Button>
          </div>

          <Button 
            onClick={handleSubmit}
            disabled={!prompt.trim() || isGenerating}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
          >
            {isGenerating ? (
              <>
                <div className="animate-spin w-4 h-4 mr-2 border-2 border-white/30 border-t-white rounded-full" />
                Generating Image...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Generate Image
              </>
            )}
          </Button>
        </div>

        {/* Quick Suggestions */}
        <div className="max-w-md mx-auto">
          <p className="text-xs text-muted-foreground mb-3">Quick ideas:</p>
          <div className="flex flex-wrap gap-2 justify-center">
            {quickPrompts.map((quickPrompt, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                onClick={() => useQuickPrompt(quickPrompt)}
                disabled={isGenerating}
                className="text-xs"
              >
                {quickPrompt}
              </Button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}