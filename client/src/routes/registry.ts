import {
  DEFAULT_ROUTE_METADATA,
  normalizeRoutePath,
  type RouteDefinition,
  type RouteMetadata,
} from "@shared/route-metadata";

const routeModules = import.meta.glob<{ route?: RouteDefinition }>(
  "../pages/**/*.tsx",
  { eager: true },
);

const routeRegistry = new Map<string, RouteDefinition>();

function inferPathFromFile(filePath: string): string {
  const withoutPrefix = filePath
    .replace("../pages", "")
    .replace(/index\.tsx$/, "/")
    .replace(/\.tsx$/, "");

  const withParams = withoutPrefix.replace(/\[([^\]]+)\]/g, ":$1");
  const normalized = normalizeRoutePath(withParams);
  return normalized === "" ? "/" : normalized;
}

for (const [filePath, module] of Object.entries(routeModules)) {
  let routeExport: RouteDefinition | undefined;
  try {
    routeExport = module?.route;
  } catch (error) {
    if (import.meta.env.DEV) {
      console.warn(
        `[routes] Failed to access route export from ${filePath}:`,
        error,
      );
    }
  }

  const fallbackPath = inferPathFromFile(filePath);
  const definition: RouteDefinition | undefined = routeExport
    ? { ...routeExport, path: normalizeRoutePath(routeExport.path) }
    : { path: fallbackPath, ssr: false };

  if (!definition?.path) {
    if (import.meta.env.DEV) {
      console.warn(
        `[routes] Missing path in route export from ${filePath}. Skipping registration.`,
      );
    }
    continue;
  }

  const normalizedPath = normalizeRoutePath(definition.path);

  if (routeRegistry.has(normalizedPath) && import.meta.env.DEV) {
    console.warn(
      `[routes] Duplicate route registration for path ${normalizedPath} from ${filePath}.`,
    );
  }

  routeRegistry.set(normalizedPath, { ...definition, path: normalizedPath });
}

function getDefaultMetadata(): RouteMetadata {
  return routeRegistry.get("/")?.metadata ?? DEFAULT_ROUTE_METADATA;
}

export function getRouteDefinition(path: string): RouteDefinition | undefined {
  return routeRegistry.get(normalizeRoutePath(path));
}

export function getRouteMetadata(path: string): RouteMetadata {
  const definition = getRouteDefinition(path);
  return definition?.metadata ?? getDefaultMetadata();
}

export function shouldSSR(path: string): boolean {
  return Boolean(getRouteDefinition(path)?.ssr);
}

export function listRegisteredRoutes(): RouteDefinition[] {
  return Array.from(routeRegistry.values());
}
