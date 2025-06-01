import { useState, useCallback, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { uploadImage, editImage, resetImage, revertImage, getImage } from '@/lib/flux-api';
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

  // Download handler
  const handleDownload = useCallback(() => {
    if (!imageData?.currentUrl) return;

    // Create download URL with original quality for downloads
    const downloadUrl = imageData.currentUrl.startsWith('/api/storage/') 
      ? `${imageData.currentUrl}?q=100` // Original quality for download
      : imageData.currentUrl;

    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = `flux-edited-image-${Date.now()}.png`;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Success",
      description: "Image downloaded!",
    });
  }, [imageData?.currentUrl, toast]);

  return {
    imageData,
    isLoadingImage,
    isUploading,
    isEditing: editMutation.isPending,
    isResetting: resetMutation.isPending,
    isReverting: revertMutation.isPending,
    handleUpload,
    handleEdit,
    handleReset,
    handleRevert,
    handleNewImage,
    handleDownload,
    hasImage: !!imageData,
  };
}
