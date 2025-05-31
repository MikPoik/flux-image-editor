import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { Edit, Trash2, Download, ImageIcon, Home, Wand2, Images, LogOut, User } from 'lucide-react';
import { useLocation, Link } from 'wouter';
import { apiRequest } from '@/lib/queryClient';
import { useAuth } from '@/hooks/useAuth';
import type { Image } from '@shared/schema';

export default function Gallery() {
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // Fetch user's images
  const { data: images = [], isLoading } = useQuery({
    queryKey: ['/api/images'],
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (imageId: number) => 
      apiRequest({ url: `/api/images/${imageId}`, method: 'DELETE' }),
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

  const handleDownload = (imageUrl: string, imageId: number) => {
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = `flux-image-${imageId}.png`;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Success",
      description: "Image downloaded!",
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="border-b border-border bg-card">
          <div className="container mx-auto px-4 py-4 flex justify-between items-center">
            <Link href="/">
              <h1 className="text-2xl font-bold text-foreground cursor-pointer">AI Image Editor</h1>
            </Link>
            
            <nav className="flex items-center space-x-4">
              <Link href="/">
                <Button 
                  variant={location === '/' ? 'default' : 'ghost'} 
                  size="sm"
                >
                  <Home className="h-4 w-4 mr-2" />
                  Home
                </Button>
              </Link>
              
              <Link href="/image-editor">
                <Button 
                  variant={location === '/image-editor' ? 'default' : 'ghost'} 
                  size="sm"
                >
                  <Wand2 className="h-4 w-4 mr-2" />
                  Editor
                </Button>
              </Link>
              
              <Link href="/gallery">
                <Button 
                  variant={location === '/gallery' ? 'default' : 'ghost'} 
                  size="sm"
                >
                  <Images className="h-4 w-4 mr-2" />
                  Gallery
                </Button>
              </Link>

              <div className="flex items-center space-x-2 ml-4">
                <Avatar className="h-8 w-8">
                  <AvatarImage src="" alt="User" />
                  <AvatarFallback>
                    <User className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm text-muted-foreground">User</span>
              </div>
              
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => window.location.href = '/api/logout'}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </nav>
          </div>
        </header>

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
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/">
            <h1 className="text-2xl font-bold text-foreground cursor-pointer">AI Image Editor</h1>
          </Link>
          
          <nav className="flex items-center space-x-4">
            <Link href="/">
              <Button 
                variant={location === '/' ? 'default' : 'ghost'} 
                size="sm"
              >
                <Home className="h-4 w-4 mr-2" />
                Home
              </Button>
            </Link>
            
            <Link href="/image-editor">
              <Button 
                variant={location === '/image-editor' ? 'default' : 'ghost'} 
                size="sm"
              >
                <Wand2 className="h-4 w-4 mr-2" />
                Editor
              </Button>
            </Link>
            
            <Link href="/gallery">
              <Button 
                variant={location === '/gallery' ? 'default' : 'ghost'} 
                size="sm"
              >
                <Images className="h-4 w-4 mr-2" />
                Gallery
              </Button>
            </Link>

            <div className="flex items-center space-x-2 ml-4">
              <Avatar className="h-8 w-8">
                <AvatarImage src="" alt="User" />
                <AvatarFallback>
                  <User className="h-4 w-4" />
                </AvatarFallback>
              </Avatar>
              <span className="text-sm text-muted-foreground">User</span>
            </div>
            
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => window.location.href = '/api/logout'}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </nav>
        </div>
      </header>

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
              <Card key={image.id} className="overflow-hidden group hover:shadow-lg transition-shadow">
                <div className="relative aspect-square overflow-hidden">
                  <img
                    src={image.currentUrl}
                    alt="AI edited image"
                    className="w-full h-full object-cover transition-transform group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => handleEdit(image.id)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => handleDownload(image.currentUrl, image.id)}
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button size="sm" variant="destructive">
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
    </div>
  );
}