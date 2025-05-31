import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Navigation } from "@/components/navigation";
import { Images, Plus } from "lucide-react";
import { Link } from "wouter";

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />

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