import { renderToPipeableStream } from "react-dom/server";
import { Writable } from "node:stream";
import { Router } from "wouter";
import App from "./App";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/contexts/theme-context";
import { normalizeRoutePath } from "@shared/route-metadata";
import { getRouteMetadata } from "@/routes/registry";

export interface SSRContext {
  redirectTo?: string;
}

export function render(url: string, search?: string) {
  const ssrContext: SSRContext = {};
  
  // Create a fresh QueryClient for each SSR request
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        staleTime: Infinity,
      },
    },
  });

  const stream = renderToPipeableStream(
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <ThemeProvider>
          <Router ssrPath={url} ssrSearch={search}>
            <App />
          </Router>
        </ThemeProvider>
      </TooltipProvider>
    </QueryClientProvider>,
    {
      onShellReady() {
        // Stream is ready to be consumed
      },
      onError(error) {
        console.error('SSR Error:', error);
      },
    }
  );

  return { stream, ssrContext };
}

export function generateHTML(url: string, search?: string): Promise<{ html: string; ssrContext: SSRContext }> {
  return new Promise((resolve, reject) => {
    const ssrContext: SSRContext = {};
    
    // Create a fresh QueryClient for each SSR request
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
          staleTime: Infinity,
        },
      },
    });

    const stream = renderToPipeableStream(
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <ThemeProvider>
            <Router ssrPath={url} ssrSearch={search}>
              <App />
            </Router>
          </ThemeProvider>
        </TooltipProvider>
      </QueryClientProvider>,
      {
        onShellReady() {
          // Use a proper Node.js Writable stream
          const chunks: Buffer[] = [];

          const writableStream = new Writable({
            write(chunk: any, encoding: any, callback: any) {
              chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
              callback();
            },
            final(callback: any) {
              const html = Buffer.concat(chunks).toString('utf8');
              resolve({ html, ssrContext });
              callback();
            }
          });
          
          writableStream.on('error', (error: Error) => {
            reject(error);
          });
          
          try {
            stream.pipe(writableStream);
          } catch (error) {
            reject(error);
          }
        },
        onError(error) {
          console.error('SSR Error:', error);
          reject(error);
        },
      }
    );
  });
}

const HTML_ESCAPE_LOOKUP: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

function escapeHtml(value?: string): string {
  if (!value) {
    return "";
  }

  return value.replace(/[&<>"']/g, (char) => HTML_ESCAPE_LOOKUP[char] || char);
}

export function generateMetaTags(url: string): string {
  const normalizedPath = normalizeRoutePath(url);
  const metadata = getRouteMetadata(normalizedPath);
  const canonicalUrl = metadata.canonical || `https://site-url.com${normalizedPath === '/' ? '' : normalizedPath}`;
  
  const metaTags = [
    `<title>${escapeHtml(metadata.title)}</title>`,
    `<meta name="description" content="${escapeHtml(metadata.description)}" />`,
    metadata.keywords ? `<meta name="keywords" content="${escapeHtml(metadata.keywords)}" />` : '',
    `<meta name="author" content="Title" />`,
    `<meta name="robots" content="index, follow" />`,
    '',
    '<!-- Open Graph / Facebook -->',
    `<meta property="og:type" content="website" />`,
    `<meta property="og:url" content="${escapeHtml(canonicalUrl)}" />`,
    `<meta property="og:title" content="${escapeHtml(metadata.ogTitle || metadata.title)}" />`,
    `<meta property="og:description" content="${escapeHtml(metadata.ogDescription || metadata.description)}" />`,
    `<meta property="og:image" content="${escapeHtml(metadata.ogImage || 'https://site-url.com/og-image.jpg')}" />`,
    '',
    '<!-- Twitter -->',
    `<meta property="twitter:card" content="summary_large_image" />`,
    `<meta property="twitter:url" content="${escapeHtml(canonicalUrl)}" />`,
    `<meta property="twitter:title" content="${escapeHtml(metadata.ogTitle || metadata.title)}" />`,
    `<meta property="twitter:description" content="${escapeHtml(metadata.ogDescription || metadata.description)}" />`,
    `<meta property="twitter:image" content="${escapeHtml(metadata.ogImage || 'https://site-url.com/og-image.jpg')}" />`,
    '',
    '<!-- Canonical URL -->',
    `<link rel="canonical" href="${escapeHtml(canonicalUrl)}" />`,
  ].filter(Boolean).join('\n    ');

  const structuredData = (metadata as any).structuredData ? 
    `\n    <!-- Structured Data -->\n    <script type="application/ld+json">\n    ${JSON.stringify((metadata as any).structuredData, null, 2)}\n    </script>` : '';

  return metaTags + structuredData;
}

export { shouldSSR } from "@/routes/registry";
