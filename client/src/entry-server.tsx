import { renderToString } from "react-dom/server";
import { dehydrate } from "@tanstack/react-query";
import App from "./App";
import { createQueryClient } from "./lib/queryClient";
import { createStaticRouterHook } from "./lib/staticRouter";
import { getRouteMetadata, shouldSSR as registryShouldSSR } from "./routes/registry";
import { normalizeRoutePath } from "@shared/route-metadata";

function escapeHtml(value?: string): string {
  if (!value) {
    return "";
  }

  return value.replace(/[&<>"']/g, (char) => {
    switch (char) {
      case "&":
        return "&amp;";
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case '"':
        return "&quot;";
      case "'":
        return "&#39;";
      default:
        return char;
    }
  });
}

export function generateMetaTags(url: string): string {
  const normalizedPath = normalizeRoutePath(url);
  const metadata = getRouteMetadata(normalizedPath);

  const title = escapeHtml(metadata.title);
  const description = escapeHtml(metadata.description);
  const keywords = metadata.keywords ? escapeHtml(metadata.keywords) : undefined;
  const ogTitle = escapeHtml(metadata.ogTitle ?? metadata.title);
  const ogDescription = escapeHtml(metadata.ogDescription ?? metadata.description);
  const ogImage = escapeHtml(
    metadata.ogImage ?? "https://fluxaimage.com/flux-woman-smiling.png",
  );
  const canonical = escapeHtml(metadata.canonical ?? `https://fluxaimage.com${normalizedPath === "/" ? "" : normalizedPath}`);

  const metaTags = [
    `<title>${title}</title>`,
    `<meta name="description" content="${description}" />`,
    keywords ? `<meta name="keywords" content="${keywords}" />` : "",
    `<meta name="author" content="Flux-a-Image" />`,
    `<meta name="robots" content="index, follow" />`,
    `<meta property="og:type" content="website" />`,
    `<meta property="og:title" content="${ogTitle}" />`,
    `<meta property="og:description" content="${ogDescription}" />`,
    `<meta property="og:image" content="${ogImage}" />`,
    `<meta property="og:url" content="${canonical}" />`,
    `<meta property="og:site_name" content="Flux-a-Image" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${ogTitle}" />`,
    `<meta name="twitter:description" content="${ogDescription}" />`,
    `<meta name="twitter:image" content="${ogImage}" />`,
    `<link rel="canonical" href="${canonical}" />`,
  ].filter(Boolean);

  const structuredData = metadata.structuredData
    ? `\n    <script type="application/ld+json">${JSON.stringify(metadata.structuredData).replace(/</g, "\\u003c")}</script>`
    : "";

  return metaTags.join("\n    ") + structuredData;
}

export async function render(url: string) {
  const queryClient = createQueryClient();
  const origin = "http://localhost";
  const location = new URL(url, origin);
  const pathname = location.pathname || "/";
  const routerHook = createStaticRouterHook(pathname);

  const html = renderToString(
    <App
      queryClient={queryClient}
      routerHook={routerHook}
      ssrPath={pathname}
      ssrSearch={location.search}
    />
  );

  const dehydratedState = dehydrate(queryClient);
  const meta = generateMetaTags(pathname + location.search);

  return { html, dehydratedState, meta };
}

export const shouldSSR = registryShouldSSR;
