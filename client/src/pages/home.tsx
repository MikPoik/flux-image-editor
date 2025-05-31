import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LogOut, User, Wand2, Images, Plus } from "lucide-react";
import { Link, useLocation } from "wouter";

export default function Home() {
  const { user } = useAuth();
  const [location] = useLocation();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/">
            <h1 className="text-2xl font-bold text-foreground cursor-pointer">AI Image Editor</h1>
          </Link>
          
          <nav className="flex items-center space-x-4">
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
                <AvatarImage src={user?.profileImageUrl || ""} alt={user?.firstName || "User"} />
                <AvatarFallback>
                  <User className="h-4 w-4" />
                </AvatarFallback>
              </Avatar>
              <span className="text-sm text-muted-foreground">
                {user?.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : user?.email}
              </span>
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

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="text-center max-w-2xl mx-auto">
          <h2 className="text-3xl font-bold mb-4">Welcome to AI Image Editor</h2>
          <p className="text-muted-foreground mb-8">
            Transform your images with AI-powered editing. Upload photos and use natural language prompts to make stunning modifications.
          </p>
          
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="p-6 hover:shadow-lg transition-shadow">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2">
                  <Plus className="h-5 w-5" />
                  Create New Image
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  Upload a photo and start editing with AI prompts
                </p>
                <Link href="/image-editor">
                  <Button className="w-full">
                    Start Editing
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="p-6 hover:shadow-lg transition-shadow">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2">
                  <Images className="h-5 w-5" />
                  View Gallery
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  Browse and manage your previously edited images
                </p>
                <Link href="/gallery">
                  <Button variant="outline" className="w-full">
                    Open Gallery
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}