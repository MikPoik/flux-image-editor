import { useState } from 'react';
import { Wand2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

interface PromptInputProps {
  onSubmit: (prompt: string) => void;
  isProcessing: boolean;
  disabled: boolean;
}

const quickPrompts = [
  "Change the lighting to golden hour",
  "Add a beautiful sky",
  "Make it more vibrant",
  "Add a sunset in the background",
  "Change to black and white",
  "Add dramatic lighting",
];

export function PromptInput({ onSubmit, isProcessing, disabled }: PromptInputProps) {
  const [prompt, setPrompt] = useState('');

  const handleSubmit = () => {
    if (prompt.trim() && !isProcessing && !disabled) {
      onSubmit(prompt.trim());
      setPrompt('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const useQuickPrompt = (quickPrompt: string) => {
    setPrompt(quickPrompt);
  };

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="prompt" className="flex items-center text-foreground mb-2">
          <Wand2 className="w-4 h-4 mr-1" />
          Describe your edit
        </Label>
        <Textarea
          id="prompt"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="e.g., 'Add a sunset background' or 'Change the shirt color to blue'"
          className="bg-background border-input text-foreground placeholder-muted-foreground focus:border-blue-500 resize-none"
          rows={3}
          disabled={disabled || isProcessing}
        />
      </div>

      <Button
        onClick={handleSubmit}
        disabled={!prompt.trim() || isProcessing || disabled}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 text-lg font-semibold"
      >
        {isProcessing ? (
          <>
            <div className="animate-spin w-4 h-4 mr-2 border-2 border-white/30 border-t-white rounded-full" />
            Processing...
          </>
        ) : (
          <>
            <Wand2 className="w-4 h-4 mr-2" />
            Edit Image
          </>
        )}
      </Button>

      {/* Quick Suggestions */}
      <div>
        <p className="text-xs text-muted-foreground mb-2">Quick suggestions:</p>
        <div className="flex flex-wrap gap-2">
          {quickPrompts.map((quickPrompt, index) => (
            <Button
              key={index}
              variant="outline"
              size="sm"
              onClick={() => useQuickPrompt(quickPrompt)}
              disabled={disabled || isProcessing}
              className="text-xs"
            >
              {quickPrompt}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}
