
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Navigation } from "@/components/navigation";
import { Wand2, Upload, Sparkles, ArrowRight, Star, Users, Zap } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen">
      <Navigation />
      
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        <div className="container mx-auto px-4 py-16">
          <div className="text-center mb-16">
            <div className="inline-flex items-center px-4 py-2 bg-blue-100 dark:bg-blue-900 rounded-full text-blue-800 dark:text-blue-200 text-sm font-medium mb-6">
              <Star className="w-4 h-4 mr-2" />
              Powered by Flux.ai Kontext Pro & Max
            </div>
            
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6">
              Transform Images with
              <span className="text-blue-600 block">AI Magic</span>
            </h1>
            
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto">
              Upload any image or generate from text, then edit with simple prompts. 
              Remove objects, change backgrounds, add elements, or completely transform your vision into reality.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
              <Button 
                size="lg" 
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 text-lg"
                onClick={() => window.location.href = '/api/login'}
              >
                Start Editing Free
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              
              <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                <Users className="w-4 h-4 mr-2" />
                Join thousands of creators
              </div>
            </div>

            {/* Trust Indicators */}
            <div className="flex flex-wrap justify-center items-center gap-8 text-sm text-gray-500 dark:text-gray-400">
              <div className="flex items-center">
                <Zap className="w-4 h-4 mr-2 text-yellow-500" />
                Lightning Fast Processing
              </div>
              <div className="flex items-center">
                <Star className="w-4 h-4 mr-2 text-yellow-500" />
                Professional Quality Results
              </div>
              <div className="flex items-center">
                <Upload className="w-4 h-4 mr-2 text-green-500" />
                No Watermarks
              </div>
            </div>
          </div>

          {/* Before/After Examples */}
          <div className="max-w-6xl mx-auto mb-16">
            <h2 className="text-3xl font-bold text-center mb-12">See the Magic in Action</h2>
            
            <div className="grid md:grid-cols-2 gap-8 mb-8">
              {/* Example 1 */}
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
                <h3 className="text-lg font-semibold mb-4">Object Removal & Background Change</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Before</p>
                    <div className="aspect-square bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 rounded-lg flex items-center justify-center">
                      <img 
                        src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxjaXJjbGUgY3g9IjEwMCIgY3k9IjEwMCIgcj0iNDAiIGZpbGw9IiM2QjczODAiLz4KPHN2ZyB4PSI4MCIgeT0iODAiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IndoaXRlIiBzdHJva2Utd2lkdGg9IjIiPgo8cGF0aCBkPSJtOSAxMiAyIDIgNC00Ii8+CjxwYXRoIGQ9Ik0yMSAxMmMwIDQuOTQzLTQgOS05IDlzLTktNC4wNTctOS05IDQuMDU3LTkgOS05IDkgNC4wNTcgOSA5WiIvPgo8L3N2Zz4KPC9zdmc+"
                        alt="Original image of a person standing in a cluttered room with old furniture and distracting background elements"
                        className="w-full h-full object-cover rounded-lg"
                      />
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">After</p>
                    <div className="aspect-square bg-gradient-to-br from-blue-200 to-purple-300 rounded-lg flex items-center justify-center">
                      <img 
                        src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxkZWZzPgo8bGluZWFyR3JhZGllbnQgaWQ9ImJnIiB4MT0iMCUiIHkxPSIwJSIgeDI9IjEwMCUiIHkyPSIxMDAlIj4KPHN0b3Agb2Zmc2V0PSIwJSIgc3R5bGU9InN0b3AtY29sb3I6IzMzOGVmNztzdG9wLW9wYWNpdHk6MSIgLz4KPHN0b3Agb2Zmc2V0PSIxMDAlIiBzdHlsZT0ic3RvcC1jb2xvcjojYzA4NGZjO3N0b3Atb3BhY2l0eToxIiAvPgo8L2xpbmVhckdyYWRpZW50Pgo8L2RlZnM+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSJ1cmwoI2JnKSIvPgo8Y2lyY2xlIGN4PSIxMDAiIGN5PSIxMDAiIHI9IjQwIiBmaWxsPSIjMWY5NzQ5Ii8+Cjwvc3ZnPgo="
                        alt="Same person now in a beautiful modern studio with clean white background and professional lighting, furniture removed"
                        className="w-full h-full object-cover rounded-lg"
                      />
                    </div>
                  </div>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-3 italic">
                  "Remove the old furniture and change background to a modern studio"
                </p>
              </div>

              {/* Example 2 */}
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
                <h3 className="text-lg font-semibold mb-4">Style Transfer & Enhancement</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Before</p>
                    <div className="aspect-square bg-gradient-to-br from-gray-300 to-gray-400 dark:from-gray-600 dark:to-gray-700 rounded-lg flex items-center justify-center">
                      <img 
                        src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRTVFN0VCIi8+CjxyZWN0IHg9IjUwIiB5PSI1MCIgd2lkdGg9IjEwMCIgaGVpZ2h0PSIxMDAiIGZpbGw9IiM2QjczODAiIHJ4PSIxMCIvPgo8L3N2Zz4K"
                        alt="Simple sketch-style drawing of a basic house with plain lines and no color details"
                        className="w-full h-full object-cover rounded-lg"
                      />
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">After</p>
                    <div className="aspect-square bg-gradient-to-br from-yellow-200 to-orange-300 rounded-lg flex items-center justify-center">
                      <img 
                        src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxkZWZzPgo8bGluZWFyR3JhZGllbnQgaWQ9InNreSIgeDE9IjAlIiB5MT0iMCUiIHgyPSIwJSIgeTI9IjEwMCUiPgo8c3RvcCBvZmZzZXQ9IjAlIiBzdHlsZT0ic3RvcC1jb2xvcjojZmVmMDhiO3N0b3Atb3BhY2l0eToxIiAvPgo8c3RvcCBvZmZzZXQ9IjEwMCUiIHN0eWxlPSJzdG9wLWNvbG9yOiNmOTc0MTY7c3RvcC1vcGFjaXR5OjEiIC8+CjwvbGluZWFyR3JhZGllbnQ+CjwvZGVmcz4KPHJlY3Qgd2lkdGg9IjIwMCIgaGVpZ2h0PSIyMDAiIGZpbGw9InVybCgjc2t5KSIvPgo8cmVjdCB4PSI0MCIgeT0iMTIwIiB3aWR0aD0iMTIwIiBoZWlnaHQ9IjYwIiBmaWxsPSIjOTMzNjFkIiByeD0iNSIvPgo8cG9seWdvbiBwb2ludHM9IjEwMCw0MCA0MCwxMjAgMTYwLDEyMCIgZmlsbD0iI2RjMjYyNiIvPgo8Y2lyY2xlIGN4PSI2MCIgY3k9IjMwIiByPSIxNSIgZmlsbD0iI2ZiYmYyNCIvPgo8L3N2Zz4K"
                        alt="Same house transformed into a vibrant watercolor painting with rich colors, dramatic sunset sky, and artistic brush strokes"
                        className="w-full h-full object-cover rounded-lg"
                      />
                    </div>
                  </div>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-3 italic">
                  "Transform into a vibrant watercolor painting with sunset colors"
                </p>
              </div>
            </div>

            {/* Example 3 */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg max-w-3xl mx-auto">
              <h3 className="text-lg font-semibold mb-4">Object Addition & Scene Composition</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Before</p>
                  <div className="aspect-video bg-gradient-to-br from-green-200 to-blue-200 rounded-lg flex items-center justify-center">
                    <img 
                      src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDMwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxkZWZzPgo8bGluZWFyR3JhZGllbnQgaWQ9ImxhbmRzY2FwZSIgeDE9IjAlIiB5MT0iMCUiIHgyPSIwJSIgeTI9IjEwMCUiPgo8c3RvcCBvZmZzZXQ9IjAlIiBzdHlsZT0ic3RvcC1jb2xvcjojYmJmN2Q5O3N0b3Atb3BhY2l0eToxIiAvPgo8c3RvcCBvZmZzZXQ9IjcwJSIgc3R5bGU9InN0b3AtY29sb3I6IzhmZjNkMztzdG9wLW9wYWNpdHk6MSIgLz4KPHN0b3Agb2Zmc2V0PSIxMDAlIiBzdHlsZT0ic3RvcC1jb2xvcjojMTZhMzRhO3N0b3Atb3BhY2l0eToxIiAvPgo8L2xpbmVhckdyYWRpZW50Pgo8L2RlZnM+CjxyZWN0IHdpZHRoPSIzMDAiIGhlaWdodD0iMjAwIiBmaWxsPSJ1cmwoI2xhbmRzY2FwZSkiLz4KPC9zdmc+"
                      alt="Empty green meadow with rolling hills and clear blue sky, peaceful but lacking focal points"
                      className="w-full h-full object-cover rounded-lg"
                    />
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">After</p>
                  <div className="aspect-video bg-gradient-to-br from-green-200 via-purple-200 to-pink-200 rounded-lg flex items-center justify-center">
                    <img 
                      src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDMwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxkZWZzPgo8bGluZWFyR3JhZGllbnQgaWQ9Im1hZ2ljYWwiIHgxPSIwJSIgeTE9IjAlIiB4Mj0iMTAwJSIgeTI9IjEwMCUiPgo8c3RvcCBvZmZzZXQ9IjAlIiBzdHlsZT0ic3RvcC1jb2xvcjojYmJmN2Q5O3N0b3Atb3BhY2l0eToxIiAvPgo8c3RvcCBvZmZzZXQ9IjUwJSIgc3R5bGU9InN0b3AtY29sb3I6I2RkZDZmZTtzdG9wLW9wYWNpdHk6MSIgLz4KPHN0b3Agb2Zmc2V0PSIxMDAlIiBzdHlsZT0ic3RvcC1jb2xvcjojZmNiZmQ5O3N0b3Atb3BhY2l0eToxIiAvPgo8L2xpbmVhckdyYWRpZW50Pgo8L2RlZnM+CjxyZWN0IHdpZHRoPSIzMDAiIGhlaWdodD0iMjAwIiBmaWxsPSJ1cmwoI21hZ2ljYWwpIi8+Cjx0cmVlIHg9IjUwIiB5PSIxMjAiPgo8Y2lyY2xlIGN4PSI2MCIgY3k9IjEzMCIgcj0iMjAiIGZpbGw9IiMxNmEzNGEiLz4KPHJlY3QgeD0iNTciIHk9IjE0NSIgd2lkdGg9IjYiIGhlaWdodD0iMzUiIGZpbGw9IiM5MjQwMGQiLz4KPC90cmVlPgo8ZWxsaXBzZSBjeD0iMjIwIiBjeT0iMTcwIiByeD0iMzAiIHJ5PSIxNSIgZmlsbD0iIzM5OGVmMyIvPgo8cG9seWdvbiBwb2ludHM9IjE1MCw2MCAyMDAsNDAgMjUwLDYwIDIzMCw5MCAyMDAsMTAwIDE3MCw5MCIgZmlsbD0iIzU5Mjh3OSIvPgo8Y2lyY2xlIGN4PSIyODAiIGN5PSI0MCIgcj0iMTAiIGZpbGw9IiNmZWY5ZDMiLz4KPC9zdmc+"
                      alt="Same meadow now featuring a majestic unicorn with rainbow mane, magical sparkles, crystal-clear pond, and ancient oak tree"
                      className="w-full h-full object-cover rounded-lg"
                    />
                  </div>
                </div>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-3 italic">
                "Add a majestic unicorn, rainbow, magical sparkles, and ancient oak tree"
              </p>
            </div>
          </div>

          {/* Feature Cards */}
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardHeader>
                <Upload className="w-12 h-12 text-blue-600 mx-auto mb-4" />
                <CardTitle>Upload or Generate</CardTitle>
                <CardDescription>
                  Start with your own images or create new ones from text descriptions using advanced AI models
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardHeader>
                <Wand2 className="w-12 h-12 text-blue-600 mx-auto mb-4" />
                <CardTitle>Edit with Natural Language</CardTitle>
                <CardDescription>
                  Simply describe what you want changed. Remove objects, add elements, change styles, or transform completely
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardHeader>
                <Sparkles className="w-12 h-12 text-blue-600 mx-auto mb-4" />
                <CardTitle>Professional Results</CardTitle>
                <CardDescription>
                  Get high-quality, professional-grade images powered by cutting-edge Flux AI technology
                </CardDescription>
              </CardHeader>
            </Card>
          </div>

          {/* Social Proof */}
          <div className="mt-16 text-center">
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 max-w-2xl mx-auto shadow-lg">
              <div className="flex justify-center mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                ))}
              </div>
              <blockquote className="text-lg text-gray-700 dark:text-gray-300 mb-4">
                "This AI image editor is incredible! I transformed my old vacation photos into artistic masterpieces in minutes. The results are so professional, my friends thought I hired a designer."
              </blockquote>
              <cite className="text-sm text-gray-500 dark:text-gray-400">
                — Sarah M., Creative Professional
              </cite>
            </div>
          </div>

          <div className="mt-12 text-center">
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              Join thousands of creators transforming their images with AI
            </p>
            <Button 
              size="lg" 
              variant="outline"
              className="border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white"
              onClick={() => window.location.href = '/api/login'}
            >
              Start Your Free Trial
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
