import { useState } from 'react';
import { ImageUpload } from './image-upload';
import { ImageGenerator } from './image-generator';
import { MultiImageUpload } from './multi-image-upload';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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

  const tabOptions = [
    { value: 'upload', label: 'Upload Image', icon: Upload },
    { value: 'generate', label: 'Generate Image', icon: Sparkles },
    { value: 'multi', label: 'Multi-Image', icon: Images },
  ];

  const getCurrentTabLabel = () => {
    return tabOptions.find(option => option.value === activeTab)?.label || 'Select Option';
  };

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      {/* Desktop Tab Navigation */}
      <TabsList className="hidden sm:grid w-full grid-cols-3 mb-6">
        {tabOptions.map(({ value, label, icon: Icon }) => (
          <TabsTrigger key={value} value={value} className="flex items-center gap-2">
            <Icon className="w-4 h-4" />
            <span className="hidden md:inline">{label}</span>
            <span className="md:hidden">{label.split(' ')[0]}</span>
          </TabsTrigger>
        ))}
      </TabsList>

      {/* Mobile Dropdown Navigation */}
      <div className="sm:hidden mb-6">
        <Select value={activeTab} onValueChange={setActiveTab}>
          <SelectTrigger className="w-full">
            <div className="flex items-center gap-2">
              {(() => {
                const currentTab = tabOptions.find(option => option.value === activeTab);
                const Icon = currentTab?.icon || Upload;
                return (
                  <>
                    <Icon className="w-4 h-4" />
                    <SelectValue />
                  </>
                );
              })()}
            </div>
          </SelectTrigger>
          <SelectContent>
            {tabOptions.map(({ value, label, icon: Icon }) => (
              <SelectItem key={value} value={value}>
                <div className="flex items-center gap-2">
                  <Icon className="w-4 h-4" />
                  {label}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
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