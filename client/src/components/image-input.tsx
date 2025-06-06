import { useState } from 'react';
import { ImageUpload } from './image-upload';
import { ImageGenerator } from './image-generator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Upload, Sparkles } from 'lucide-react';

interface ImageInputProps {
  onUpload: (file: File) => void;
  onGenerate: (prompt: string) => void;
  isUploading: boolean;
  isGenerating: boolean;
}

export function ImageInput({ onUpload, onGenerate, isUploading, isGenerating }: ImageInputProps) {
  const [activeTab, setActiveTab] = useState('upload');

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <TabsList className="grid w-full grid-cols-2 mb-6">
        <TabsTrigger value="upload" className="flex items-center gap-2">
          <Upload className="w-4 h-4" />
          Upload Image
        </TabsTrigger>
        <TabsTrigger value="generate" className="flex items-center gap-2">
          <Sparkles className="w-4 h-4" />
          Generate Image
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
        />
      </TabsContent>
    </Tabs>
  );
}