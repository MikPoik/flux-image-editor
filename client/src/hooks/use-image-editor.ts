import { useState, useCallback, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { uploadImage, editImage, resetImage, revertImage, getImage, upscaleImage, generateImage } from '@/lib/flux-api';
import { useToast } from '@/hooks/use-toast';

export function useImageEditor() {
  const [currentImageId, setCurrentImageId] = useState<number | null>(null);

  // Check URL parameters for existing image ID
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const imageId = urlParams.get('id');
    if (imageId && !isNaN(Number(imageId))) {
      const id = Number(imageId);
      setCurrentImageId(id);
      console.log('Loading image with ID:', id);
    }
  }, []);
  const [isUploading, setIsUploading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Get current image data
  const { data: imageData, isLoading: isLoadingImage, error } = useQuery({
    queryKey: ['/api/images', currentImageId],
    queryFn: () => {
      if (!currentImageId) return null;
      console.log('Fetching image data for ID:', currentImageId);
      return getImage(currentImageId);
    },
    enabled: !!currentImageId,
    retry: 3,
  });

  // Log any errors for debugging
  useEffect(() => {
    if (error) {
      console.error('Error loading image:', error);
      toast({
        title: "Error Loading Image",
        description: "Failed to load the image. Please try again.",
        variant: "destructive",
      });
    }
  }, [error, toast]);

  // Upload mutation
  const uploadMutation = useMutation({
    mutationFn: uploadImage,
    onSuccess: (data) => {
      setCurrentImageId(data.id);
      queryClient.setQueryData(['/api/images', data.id], data);
      // Invalidate the gallery images list to show the new upload
      queryClient.invalidateQueries({ queryKey: ['/api/images'] });
      toast({
        title: "Success",
        description: "Image uploaded successfully!",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Upload Failed",
        description: error.message,
        variant: "destructive",
      });
    },
    onSettled: () => {
      setIsUploading(false);
    },
  });

  // Generate mutation
  const generateMutation = useMutation({
    mutationFn: generateImage,
    onSuccess: (data) => {
      setCurrentImageId(data.id);
      queryClient.setQueryData(['/api/images', data.id], data);
      // Invalidate the gallery images list to show the new image
      queryClient.invalidateQueries({ queryKey: ['/api/images'] });
      // Invalidate subscription query to refresh edit count
      queryClient.invalidateQueries({ queryKey: ['/api/subscription'] });
      toast({
        title: "Success",
        description: "Image generated successfully!",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Generation Failed",
        description: error.message,
        variant: "destructive",
      });
    },
    onSettled: () => {
      setIsGenerating(false);
    },
  });

  // Edit mutation
  const editMutation = useMutation({
    mutationFn: ({ imageId, prompt }: { imageId: number; prompt: string }) =>
      editImage(imageId, prompt),
    onSuccess: (data) => {
      queryClient.setQueryData(['/api/images', data.id], data);
      // Invalidate subscription query to refresh edit count
      queryClient.invalidateQueries({ queryKey: ['/api/subscription'] });
      toast({
        title: "Success",
        description: "Image edited successfully!",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Edit Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Reset mutation
  const resetMutation = useMutation({
    mutationFn: resetImage,
    onSuccess: (data) => {
      queryClient.setQueryData(['/api/images', data.id], data);
      toast({
        title: "Success",
        description: "Image reset to original!",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Reset Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Revert mutation
  const revertMutation = useMutation({
    mutationFn: ({ imageId, historyIndex }: { imageId: number; historyIndex: number }) =>
      revertImage(imageId, historyIndex),
    onSuccess: (data) => {
      queryClient.setQueryData(['/api/images', data.id], data);
      toast({
        title: "Success",
        description: "Image reverted successfully!",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Revert Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Upscale mutation
  const upscaleMutation = useMutation({
    mutationFn: ({ imageId, scale }: { imageId: number; scale: number }) =>
      upscaleImage(imageId, scale),
    onSuccess: async (data) => {
      try {
        // Fetch the image as a blob to force download
        const response = await fetch(data.upscaledImageUrl);
        const blob = await response.blob();
        
        // Create object URL and download
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `flux-upscaled-${Date.now()}.png`;
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Clean up object URL
        window.URL.revokeObjectURL(url);

        toast({
          title: "Success",
          description: "Image upscaled and downloaded!",
        });
      } catch (error) {
        console.error('Download error:', error);
        toast({
          title: "Download Failed", 
          description: "Failed to download the upscaled image.",
          variant: "destructive",
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Upscale Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Upload handler
  const handleUpload = useCallback((file: File) => {
    setIsUploading(true);
    uploadMutation.mutate(file);
  }, [uploadMutation]);

  // Generate handler
  const handleGenerate = useCallback((prompt: string) => {
    setIsGenerating(true);
    generateMutation.mutate(prompt);
  }, [generateMutation]);

  // Edit handler
  const handleEdit = useCallback((prompt: string) => {
    if (!currentImageId) return;
    editMutation.mutate({ imageId: currentImageId, prompt });
  }, [currentImageId, editMutation]);

  // Reset handler
  const handleReset = useCallback(() => {
    if (!currentImageId) return;
    resetMutation.mutate(currentImageId);
  }, [currentImageId, resetMutation]);

  // Revert handler
  const handleRevert = useCallback((historyIndex: number) => {
    if (!currentImageId) return;
    revertMutation.mutate({ imageId: currentImageId, historyIndex });
  }, [currentImageId, revertMutation]);

  // New image handler
  const handleNewImage = useCallback(() => {
    setCurrentImageId(null);
    queryClient.removeQueries({ queryKey: ['/api/images'] });
  }, [queryClient]);

  // Download handler (now uses upscaling)
  const handleDownload = async (scale: number = 2) => {
    if (!imageData?.id) return;

    try {
      await upscaleMutation.mutateAsync({
        imageId: imageData.id,
        scale,
      });
    } catch (error: any) {
      console.error('Download failed:', error);

      // Handle subscription tier restrictions
      if (error.message?.includes('not available on the free plan') || 
          error.message?.includes('only available for premium users')) {
        toast({
          title: "Upgrade Required",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Download Failed",
          description: error instanceof Error ? error.message : "Failed to process download",
          variant: "destructive",
        });
      }
    }
  };

  // Upscale handler
  const handleUpscale = useCallback((scale: number) => {
    if (!currentImageId) return;
    upscaleMutation.mutate({ imageId: currentImageId, scale });
  }, [currentImageId, upscaleMutation]);

  return {
    imageData,
    isLoadingImage,
    isUploading,
    isGenerating,
    isEditing: editMutation.isPending,
    isResetting: resetMutation.isPending,
    isReverting: revertMutation.isPending,
    isUpscaling: upscaleMutation.isPending,
    handleUpload,
    handleGenerate,
    handleEdit,
    handleReset,
    handleRevert,
    handleNewImage,
    handleDownload,
    handleUpscale,
    hasImage: !!imageData,
  };
}