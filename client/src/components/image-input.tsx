import { useState } from 'react';
import { ImageUpload } from './image-upload';
import { ImageGenerator } from './image-generator';
import { MultiImageUpload } from './multi-image-upload';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Upload, Sparkles, Images } from 'lucide-react';

interface ImageInputProps {
  onUpload: (file: File) => void;
  onGenerate: (prompt: string) => void;
  onMultiGenerate: (files: File[], prompt: string) => void;
  isUploading: boolean;
  isGenerating: boolean;
  isMultiGenerating: boolean;
  isGenerationDisabled?: boolean;
}

export function ImageInput({ 
  onUpload, 
  onGenerate, 
  onMultiGenerate,
  isUploading, 
  isGenerating, 
  isMultiGenerating,
  isGenerationDisabled = false 
}: ImageInputProps) {
  const [activeTab, setActiveTab] = useState('upload');

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <TabsList className="grid w-full grid-cols-3 mb-6">
        <TabsTrigger value="upload" className="flex items-center gap-2">
          <Upload className="w-4 h-4" />
          Upload Image
        </TabsTrigger>
        <TabsTrigger value="generate" className="flex items-center gap-2">
          <Sparkles className="w-4 h-4" />
          Generate Image
        </TabsTrigger>
        <TabsTrigger value="multi" className="flex items-center gap-2">
          <Images className="w-4 h-4" />
          Multi-Image
        </TabsTrigger>
      </TabsList>
      
      <TabsContent value="upload">
        <ImageUpload 
          onUpload={onUpload} 
          isUploading={isUploading}
        />
      </TabsContent>
      
      <TabsContent value="generate">
        <ImageGenerator 
          onGenerate={onGenerate} 
          isGenerating={isGenerating}
          isDisabled={isGenerationDisabled}
        />
      </TabsContent>
      
      <TabsContent value="multi">
        <MultiImageUpload 
          onGenerate={onMultiGenerate} 
          isGenerating={isMultiGenerating}
          isDisabled={isGenerationDisabled}
        />
      </TabsContent>
    </Tabs>
  );
}