# Component-Level SSR & Metadata Framework

This document summarizes the current server-side rendering (SSR) infrastructure and outlines how to apply the same approach to other React/Vite projects. The design keeps route concerns close to their components while giving the server enough metadata to render head tags and decide when SSR is required.

## System Architecture

**Frontend**
- Node.js 20 runtime, React 18 + TypeScript, bundled with Vite.
- UI stack mixes shadcn/ui (Radix primitives) with Tailwind CSS and CSS variables.
- TanStack Query manages server state; Wouter handles routing.
- UX decisions include responsive layouts, customizable chat surfaces, theme layering (embed params → UI designer settings → defaults), and optional background imagery with readability overlays.

**Backend**
- Express.js (TypeScript, ESM) running on Node.js.
- Drizzle ORM targeting Neon’s serverless PostgreSQL.
- Session storage currently in-memory with hooks for persistence.

---

## 1. Context & Goals

- **Runtime baseline**: Node.js 20 + Express in ESM mode, React 18 + TypeScript on the client, bundled by Vite.
- **Client stack**: TanStack Query for server state, Wouter for routing, Tailwind + shadcn/ui for styling/components.
- **Motivation**: The SPA-only delivery returned an empty `#root` and generic metadata to crawlers, breaking SEO, link previews, and canonical accuracy. SSR (or at least selective pre-rendering) was required to hydrate marketing routes with real HTML, share structured metadata across server and client, and enable automated sitemap generation.

The remainder of this guide documents the SSR framework that addresses those goals and can be transplanted into similar React/Vite + Express projects.

---

## 2. High-Level Architecture

1. **Route Contracts live with components** – every page module exports a small `route` object describing its canonical path, SEO metadata, and whether it prefers SSR.
2. **A manifest builder runs at load time** – a lightweight registry module (`client/src/routes/registry.ts`) eagerly gathers those contracts via `import.meta.glob` and exposes helper functions for the rest of the app.
3. **The server entry uses the manifest** – `client/src/entry-server.tsx` imports `getRouteMetadata` and re-exports `shouldSSR`, keeping rendering logic declarative.
4. **Express/Vite middleware consults the manifest** – both dev and prod servers load the SSR bundle, ask `shouldSSR(path)`, log the decision, and only render when the page opts in.
5. **Head tags are generated centrally** – metadata from the manifest feeds a `generateMetaTags()` helper that injects `<title>`, Open Graph tags, canonical URLs, and optional structured data into the HTML template.

This pattern removes the need for a static `SSR_ROUTES` list or hard-coded metadata maps while making SSR behavior obvious during development (explicit console logs).

---

## 3. Route Contract Specification

The shared contract lives in `shared/route-metadata.ts` and can be reused across projects:

```ts
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
  path: string;        // canonical, normalized path (e.g. "/pricing")
  ssr?: boolean;       // opt-in flag for SSR
  metadata?: RouteMetadata;
}
```

Each page component co-locates its contract:

```ts
// client/src/pages/pricing.tsx
export const route: RouteDefinition = {
  path: "/pricing",
  ssr: true,
  metadata: {
    title: "Pricing – …",
    description: "Choose the perfect plan…",
    canonical: "https://example.com/pricing",
    ogImage: "https://example.com/og-pricing.jpg",
  },
};

export default function Pricing() {
  return <div>…</div>;
}
```

Key points:

- **Path normalization** happens later, so developers can write familiar strings.
- **SSR flag defaults to false**, so only pages that need hydration on first load opt in.
- **Metadata is optional**; pages without specific requirements inherit the home-page defaults.

---

## 4. Manifest Builder (Client Runtime)

`client/src/routes/registry.ts` is responsible for turning scattered exports into a single source of truth.

```ts
const routeModules = import.meta.glob<{ route?: RouteDefinition }>(
  "../pages/**/*.tsx",
  { eager: true },
);

function inferPathFromFile(filePath: string) {
  return filePath
    .replace("../pages", "")
    .replace(/index\.tsx$/, "/")
    .replace(/\.tsx$/, "")
    .replace(/\/$/, "") || "/";
}

const routeRegistry = new Map<string, RouteDefinition>();

for (const [filePath, module] of Object.entries(routeModules)) {
  const explicit = module?.route;
  const definition: RouteDefinition | undefined = explicit ?? {
    path: inferPathFromFile(filePath),
    ssr: false,
  };

  if (!definition?.path) continue;

  const normalized = normalizeRoutePath(definition.path);
  routeRegistry.set(normalized, { ...definition, path: normalized });
}
```

Exported helpers:

- `getRouteDefinition(path)` – retrieve the full contract for a normalized path.
- `getRouteMetadata(path)` – fall back to a default homepage metadata block when missing.
- `shouldSSR(path)` – return the boolean flag consumed by the server tier.
- `listRegisteredRoutes()` – useful for diagnostics or sitemap generation.

Because the registry executes in both SSR and browser contexts, client code can also call `shouldSSR()` at runtime to mirror server decisions (e.g. skipping an auth-loading spinner on marketing pages).

Because `import.meta.glob` runs both in the browser and within Vite’s SSR context, the manifest is available everywhere without manual bookkeeping.

### Porting Tips

1. **Adjust the glob if your pages sit elsewhere** (e.g. `"./routes/**/*.tsx"`).
2. **Keep the helper module side-effectful** (build the registry at import time) so server code can call `shouldSSR()` synchronously.
3. **Guard dev-only warnings** behind `import.meta.env.DEV` to avoid noisy logs in production bundles.
4. **Default to client rendering when a route lacks metadata** – the example above registers a fallback with `ssr: false`, so missing exports never surprise the server.

---

## 5. Server Entry Responsibilities

`client/src/entry-server.tsx` renders the React tree and exposes metadata helpers. The important exports are:

- `generateHTML(url, search?)` – resolves a full HTML string by piping React’s `renderToPipeableStream` into an in-memory buffer. This is used in production to inject markup into the built template.
- `generateMetaTags(url)` – reads the manifest metadata and produces escaped `<head>` tags; structured data is appended when provided.
- `shouldSSR` (re-export) – makes dynamic SSR decisions available to the HTTP layer.

This file remains framework-agnostic: swap in your own providers (Redux, Styled Components, etc.) as needed while keeping the manifest lookups intact.

---

## 6. HTTP Middleware Integration

Both the Vite dev server middleware and the production Express server follow the same algorithm:

1. Load the SSR entry module (`/src/entry-server.tsx` during development, the built bundle in production).
2. Ask `shouldSSR(pathname)` to determine whether the current route opted in.
3. If true, render via `generateHTML()` and replace the root div in the HTML template; otherwise serve the client bundle unchanged.
4. Inject `<head>` tags with `generateMetaTags()`.
5. Emit structured logs for observability.

Example (simplified from `server/vite.ts`):

```ts
const ssrModule = await vite.ssrLoadModule("/src/entry-server.tsx");

if (ssrModule.shouldSSR(pathname)) {
  log(`SSR render (dev): ${pathname}`, "ssr");
  const { html, ssrContext } = await renderTemplateWithSSR({
    template,
    pathname,
    search: url.search,
    ssrModule,
  });

  if (ssrContext.redirectTo) return res.redirect(302, ssrContext.redirectTo);
  template = html;
}
```

The production variant is identical except it reuses a lazily-imported SSR bundle (`loadProdSSRModule`). Centralizing the logic ensures dev/prod parity.

### Logging

- Dev: `SSR render (dev): /pricing`
- Prod: `SSR render (prod): /pricing`

Use these breadcrumbs to confirm new routes are wired correctly.

---

### Wouter specifics

Wouter requires a top-level `<Router>` in both environments:

- **Server**: provide `ssrPath` (and optionally `ssrSearch`) so the router knows which route to render. The `Router` also accepts an `ssrContext` object for redirects.
- **Client**: keep the same `<Router>` wrapper during hydration to avoid mismatched markup; no need to pass `ssrPath`—Wouter derives it from `location`.

Those requirements are already baked into `entry-server.tsx` and `main.tsx`, but remember them if you restructure the provider tree.

---

## 7. Client Entry (Hydration vs. CSR)

`client/src/main.tsx` decides between hydration and a fresh client-side render:

```ts
const rootElement = document.getElementById("root")!;
const isSSR = rootElement.innerHTML.trim() !== "";

const AppWithProviders = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <ThemeProvider>
        <Router>
          <App />
        </Router>
      </ThemeProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

if (isSSR) {
  hydrateRoot(rootElement, <AppWithProviders />);
} else {
  createRoot(rootElement).render(<AppWithProviders />);
}
```

Guidelines when porting:

- Use the presence of pre-rendered HTML inside `#root` as the hydration check.
- Reuse the exact provider tree configured in `entry-server.tsx` so the client and server agree on context state.
- Keep this file free of manifest logic—SSR decisions already happened on the server.
- Ensure client-only data fetches (auth checks, personalization requests, etc.) return deterministic defaults during SSR and only refetch after mount so the streamed HTML matches the first client render.

Navbar example
```ts
const currentPath = location ?? '/';
const normalizedPath = normalizeRoutePath(currentPath);
const isPublicRoute = shouldSSR(normalizedPath);
```

---

## 8. Metadata & SEO Handling

- `generateMetaTags()` escapes user-provided strings and injects Open Graph, Twitter, robots, and canonical tags.
- Structured data objects pass straight through `JSON.stringify` for schema.org snippets.
- A default metadata object (`DEFAULT_ROUTE_METADATA`) provides sensible fallbacks for pages without explicit copy.
- `npm run generate:seo` walks the route contracts (via the AST) to regenerate `public/sitemap.xml` and `public/robots.txt`, ensuring SSR-capable pages are crawlable; the command runs automatically inside `npm run build`.

When transplanting the pattern, update `DEFAULT_ROUTE_METADATA` with your brand defaults and adjust canonical URL construction to reference the correct domain.

---

## 9. server/vite.ts Responsibilities

The Express/Vite bridge is where SSR is toggled per request. Key steps to replicate:

1. **Vite configuration** – ensure the dev server is created with the same alias map the client uses (`@`, `@shared`, etc.).
2. **Template handling** – read `index.html`, optionally append cache-busting query params for dev scripts, and keep `<div id="root"></div>` as the injection target.
3. **Dynamic SSR check** – load the SSR module (`vite.ssrLoadModule` in dev, cached import in prod) and call `shouldSSR(pathname)`.
4. **Render + meta injection** – when true, call `generateHTML()` to replace the root container and `generateMetaTags()` to swap the head block. Always log the decision (`SSR render (dev|prod): /path`).
5. **Graceful fallback** – wrap SSR in `try/catch`; on failure, log the error and serve the untouched template so the SPA still boots.
6. **Additional payloads** – inject any request-scoped scripts (like widget config) before the closing `</head>`.

The same flow works with other HTTP stacks (Fastify, Cloudflare workers) as long as you can load the SSR bundle and mutate the HTML template prior to responding.

---

## 10. Adapting to Other Projects

Follow this checklist to bring the framework into a fresh codebase:

1. **Share the contract** – copy `RouteMetadata`, `RouteDefinition`, and `normalizeRoutePath` into a shared module.
2. **Co-locate route exports** – teach page authors to export `route` alongside the component.
3. **Instantiate a registry** – replicate `registry.ts`, adjusting the glob and default metadata as needed.
4. **Update the SSR entry** – import your registry helpers, expose `shouldSSR`, and ensure meta tag generation uses the shared contract.
5. **Hook the server** – whether you serve through Express, Fastify, or another adapter, load the SSR module, check `shouldSSR`, and inject markup/meta tags.
6. **Instrument logging** – log SSR hits in both environments to catch regressions early.
7. **Test** – run through opt-in and opt-out routes to confirm the CSR/SSR split behaves as expected, and view source to verify `<head>` content.

Optional enhancements:

- **Lazy manifest** – if eager imports become heavy, switch to `import.meta.glob` with lazy loading and cache resolved modules.
- **Dynamic parameters** – extend `normalizeRoutePath` / registry to handle parameterized routes (`/posts/:id`) by storing patterns or matcher functions.
- **Sitemap generation** – leverage `listRegisteredRoutes()` to generate sitemap.xml or robots metadata.

---

## 11. Operational Guidelines

- **Adding a page**: export `route`, set `ssr: true` only if the page benefits from hydration before client boot, fill metadata.
- **Auditing SSR coverage**: run the app, hit the route, and check terminal logs for `SSR render` lines.
- **Fallback behavior**: if metadata is missing, the home-page defaults apply; if `ssr` is omitted, the page ships purely as CSR.
- **Error handling**: server middleware catches SSR errors and falls back to CSR so users still receive a page.

---

## 12. File Map (for reference)

- `shared/route-metadata.ts` – shared contract, defaults, normalization helpers.
- `client/src/routes/registry.ts` – manifest builder and helper exports.
- `client/src/entry-server.tsx` – React SSR entry, metadata generator, `shouldSSR` re-export.
- `server/vite.ts` – dev + prod middleware that consumes the manifest and injects HTML/metadata.
- `client/src/main.tsx` – hydrates SSR markup or mounts the SPA when no server render is present.

Port these pieces together and you’ll have a reusable, declarative SSR layer that scales with your routing needs while keeping page authors in control of SEO and rendering mode.
