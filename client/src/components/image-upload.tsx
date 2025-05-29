import { useCallback } from 'react';
import { Upload, FolderOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ImageUploadProps {
  onUpload: (file: File) => void;
  isUploading: boolean;
}

export function ImageUpload({ onUpload, isUploading }: ImageUploadProps) {
  const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      onUpload(file);
    }
  }, [onUpload]);

  const handleDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      onUpload(file);
    }
  }, [onUpload]);

  const handleDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  }, []);

  return (
    <div className="relative bg-gray-900 rounded-2xl border-2 border-dashed border-gray-600 hover:border-blue-500 transition-colors">
      <div
        className="p-8 text-center cursor-pointer"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onClick={() => document.getElementById('file-input')?.click()}
      >
        <div className="space-y-4">
          <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mx-auto">
            <Upload className="w-8 h-8 text-gray-400" />
          </div>
          <div>
            <p className="text-lg font-medium text-gray-300">
              {isUploading ? 'Uploading...' : 'Upload an image to start editing'}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              Drag and drop or click to browse
            </p>
          </div>
          <Button 
            disabled={isUploading}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <FolderOpen className="w-4 h-4 mr-2" />
            Choose File
          </Button>
        </div>
      </div>
      <input
        id="file-input"
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
        disabled={isUploading}
      />
    </div>
  );
}
