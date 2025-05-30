import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Wand2, Upload, Sparkles } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-6">
            AI Image Editor
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
            Transform your images with AI-powered editing using simple text prompts. 
            Upload, edit, and perfect your images with the power of artificial intelligence.
          </p>
          
          <Button 
            size="lg" 
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-lg"
            onClick={() => window.location.href = '/api/login'}
          >
            Get Started
          </Button>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          <Card className="text-center">
            <CardHeader>
              <Upload className="w-12 h-12 text-blue-600 mx-auto mb-4" />
              <CardTitle>Upload Your Image</CardTitle>
              <CardDescription>
                Start by uploading any image you want to edit
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <Wand2 className="w-12 h-12 text-blue-600 mx-auto mb-4" />
              <CardTitle>Describe Your Edit</CardTitle>
              <CardDescription>
                Use simple text prompts to describe how you want to change your image
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <Sparkles className="w-12 h-12 text-blue-600 mx-auto mb-4" />
              <CardTitle>Get AI Results</CardTitle>
              <CardDescription>
                Watch as AI transforms your image based on your instructions
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        <div className="mt-16 text-center">
          <p className="text-gray-500 dark:text-gray-400">
            Sign in to start editing your images with AI
          </p>
        </div>
      </div>
    </div>
  );
}