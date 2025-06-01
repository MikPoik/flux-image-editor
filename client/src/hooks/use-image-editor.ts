import { useState, useCallback, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { uploadImage, editImage, resetImage, revertImage, getImage, upscaleImage } from '@/lib/flux-api';
import { useToast } from '@/hooks/use-toast';

export function useImageEditor() {
  const [currentImageId, setCurrentImageId] = useState<number | null>(null);
  
  // Check URL parameters for existing image ID
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const imageId = urlParams.get('id');
    if (imageId && !isNaN(Number(imageId))) {
      setCurrentImageId(Number(imageId));
    }
  }, []);
  const [isUploading, setIsUploading] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Get current image data
  const { data: imageData, isLoading: isLoadingImage } = useQuery({
    queryKey: ['/api/images', currentImageId],
    queryFn: () => currentImageId ? getImage(currentImageId) : null,
    enabled: !!currentImageId,
  });

  // Upload mutation
  const uploadMutation = useMutation({
    mutationFn: uploadImage,
    onSuccess: (data) => {
      setCurrentImageId(data.id);
      queryClient.setQueryData(['/api/images', data.id], data);
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
    onSuccess: (data) => {
      // Automatically download the upscaled image
      const link = document.createElement('a');
      link.href = data.upscaledImageUrl;
      link.download = `flux-upscaled-${Date.now()}.png`;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: "Success",
        description: "Image upscaled and downloaded!",
      });
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
  const handleDownload = useCallback((scale: number = 2) => {
    if (!currentImageId) return;
    upscaleMutation.mutate({ imageId: currentImageId, scale });
  }, [currentImageId, upscaleMutation]);

  // Upscale handler
  const handleUpscale = useCallback((scale: number) => {
    if (!currentImageId) return;
    upscaleMutation.mutate({ imageId: currentImageId, scale });
  }, [currentImageId, upscaleMutation]);

  return {
    imageData,
    isLoadingImage,
    isUploading,
    isEditing: editMutation.isPending,
    isResetting: resetMutation.isPending,
    isReverting: revertMutation.isPending,
    isUpscaling: upscaleMutation.isPending,
    handleUpload,
    handleEdit,
    handleReset,
    handleRevert,
    handleNewImage,
    handleDownload,
    handleUpscale,
    hasImage: !!imageData,
  };
}
