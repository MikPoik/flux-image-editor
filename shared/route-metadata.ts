export interface RouteMetadata {
  title: string;
  description: string;
  keywords?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  canonical?: string;
  structuredData?: Record<string, unknown>;
}

export interface RouteDefinition {
  path: string;
  ssr?: boolean;
  metadata?: RouteMetadata;
}

export const DEFAULT_ROUTE_METADATA: RouteMetadata = {
  title: "Flux-a-Image",
  description:
    "Flux-a-Image brings AI-powered image generation and editing to your browser. Create, transform, and elevate visuals instantly.",
  keywords: "AI image editor, fluxaimage",
  ogTitle: "Flux-a-Image",
  ogDescription:
    "Flux-a-Image brings AI-powered image generation and editing to your browser. Create, transform, and elevate visuals instantly.",
  ogImage: "https://fluxaimage.com/flux-woman-smiling.png",
  canonical: "https://fluxaimage.com",
};

export function normalizeRoutePath(path: string): string {
  if (!path) {
    return "/";
  }

  const hasQuery = path.includes("?");
  const [pathname, ...rest] = hasQuery ? path.split("?") : [path];
  const search = rest.length ? rest.join("?") : "";
  let normalized = pathname.trim();

  if (!normalized.startsWith("/")) {
    normalized = `/${normalized}`;
  }

  normalized = normalized.replace(/\/+$/, "");

  if (normalized === "") {
    normalized = "/";
  }

  return hasQuery ? `${normalized}?${search}` : normalized;
}
