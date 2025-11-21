import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Home } from "lucide-react";
import { useEffect } from "react";
import type { RouteDefinition } from "@shared/route-metadata";

export const route: RouteDefinition = {
  path: "*",
  ssr: false,
  metadata: {
    title: "Page Not Found - Flux-a-Image",
    description: "The page you're looking for doesn't exist.",
    canonical: "https://fluxaimage.com",
  },
};

export default function NotFound() {
  useEffect(() => {
    document.title = route.metadata?.title || "Page Not Found";

    const updateMetaTag = (name: string, content: string) => {
      let element = document.querySelector(`meta[name="${name}"]`) || document.querySelector(`meta[property="${name}"]`);
      if (!element) {
        element = document.createElement('meta');
        if (name.startsWith('og:')) {
          element.setAttribute('property', name);
        } else {
          element.setAttribute('name', name);
        }
        document.head.appendChild(element);
      }
      element.setAttribute('content', content);
    };

    if (route.metadata) {
      if (route.metadata.description) updateMetaTag('description', route.metadata.description);
      if (route.metadata.canonical) {
        let link = document.querySelector('link[rel="canonical"]');
        if (!link) {
          link = document.createElement('link');
          link.setAttribute('rel', 'canonical');
          document.head.appendChild(link);
        }
        link.setAttribute('href', route.metadata.canonical);
      }
    }
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-950 container mx-auto px-4 py-16 text-center flex flex-col items-center justify-center">
      <h1 className="text-4xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-200 to-purple-200">404 - Page Not Found</h1>
      <p className="text-slate-400 mb-8 text-lg">
        The page you're looking for doesn't exist.
      </p>
      <Link href="/">
        <Button className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700">Go Home</Button>
      </Link>
    </div>
  );
}