import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { Edit, Trash2, Download, ImageIcon } from 'lucide-react';
import { useLocation } from 'wouter';
import { apiRequest } from '@/lib/queryClient';
import type { Image } from '@shared/schema';
import { useState } from 'react';

export default function Gallery() {
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeImageId, setActiveImageId] = useState<number | null>(null);

  // Fetch user's images
  const { data: images = [], isLoading } = useQuery({
    queryKey: ['/api/images'],
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (imageId: number) => 
      apiRequest('DELETE', `/api/images/${imageId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/images'] });
      toast({
        title: "Success",
        description: "Image deleted successfully!",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Delete Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleEdit = (imageId: number) => {
    setLocation(`/image-editor?id=${imageId}`);
  };

  const handleDelete = (imageId: number) => {
    deleteMutation.mutate(imageId);
  };

  const handleDownload = (imageUrl: string, imageId: number, scale: number = 2) => {
    // Use the upscaling API for downloads
    upscaleMutation.mutate({ imageId, scale });
  };

  // Upscale mutation for gallery downloads
  const upscaleMutation = useMutation({
    mutationFn: async ({ imageId, scale }: { imageId: number; scale: number }) => {
      const response = await apiRequest('POST', `/api/images/${imageId}/upscale`, { scale });
      return response.json();
    },
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
        title: "Download Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto p-4">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">My Gallery</h1>
          <p className="text-muted-foreground">View and manage your AI-edited images</p>
        </div>
      
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <Skeleton className="aspect-square w-full" />
              <CardContent className="p-4">
                <Skeleton className="h-4 w-3/4 mb-2" />
                <Skeleton className="h-3 w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-4">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">My Gallery</h1>
        <p className="text-muted-foreground">View and manage your AI-edited images</p>
      </div>

        {(images as any[]).length === 0 ? (
          <div className="text-center py-12">
            <ImageIcon className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No images yet</h3>
            <p className="text-muted-foreground mb-4">
              Start by uploading and editing your first image
            </p>
            <Button onClick={() => setLocation('/image-editor')}>
              Create First Image
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {(images as any[]).map((image: any) => (
              <Card key={image.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                <div className="relative aspect-square overflow-hidden">
                  <img
                    src={image.currentUrl}
                    alt="AI edited image"
                    className="w-full h-full object-cover transition-transform hover:scale-105 cursor-pointer"
                    onClick={() => setActiveImageId(activeImageId === image.id ? null : image.id)}
                  />
                  <div className={`absolute inset-0 bg-black/60 transition-opacity flex items-center justify-center gap-2 ${
                    activeImageId === image.id ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
                  }`}>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEdit(image.id);
                      }}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          size="sm"
                          variant="secondary"
                          disabled={upscaleMutation.isPending}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Download className="w-4 h-4" />
                          {upscaleMutation.isPending && (
                            <div className="ml-1 animate-spin w-3 h-3 border-2 border-gray-400/30 border-t-gray-400 rounded-full"></div>
                          )}
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-40">
                        <DropdownMenuItem onClick={async (e) => {
                          e.stopPropagation();
                          try {
                            // Fetch the image as a blob to force download
                            const response = await fetch(image.currentUrl);
                            const blob = await response.blob();
                            
                            // Create object URL and download
                            const url = window.URL.createObjectURL(blob);
                            const link = document.createElement('a');
                            link.href = url;
                            link.download = `flux-current-${Date.now()}.png`;
                            link.style.display = 'none';
                            document.body.appendChild(link);
                            link.click();
                            document.body.removeChild(link);
                            
                            // Clean up object URL
                            window.URL.revokeObjectURL(url);
                          } catch (error) {
                            console.error('Download error:', error);
                          }
                        }}>
                          Download Current
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={(e) => {
                          e.stopPropagation();
                          handleDownload(image.currentUrl, image.id, 2);
                        }}>
                          Download 2x Enhanced
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={(e) => {
                          e.stopPropagation();
                          handleDownload(image.currentUrl, image.id, 4);
                        }}>
                          Download 4x Enhanced
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button 
                          size="sm" 
                          variant="destructive"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Image</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete this image? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(image.id)}
                            disabled={deleteMutation.isPending}
                          >
                            {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
                
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <p className="text-sm text-muted-foreground">
                        Created: {new Date(image.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    {image.editHistory && image.editHistory.length > 0 && (
                      <Badge variant="secondary" className="text-xs">
                        {image.editHistory.length} edit{image.editHistory.length === 1 ? '' : 's'}
                      </Badge>
                    )}
                  </div>
                  
                  {image.editHistory && image.editHistory.length > 0 && (
                    <p className="text-sm text-muted-foreground truncate">
                      Last edit: {image.editHistory[image.editHistory.length - 1]?.prompt}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
    </div>
  );
}