import express, { type Express, type Request } from "express";
import fs from "fs";
import path from "path";
import { type Server } from "http";
import { nanoid } from "nanoid";
import { pathToFileURL } from "url";
import { normalizeRoutePath } from "../shared/route-metadata";

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

type SSRRenderResult = {
  html: string;
  dehydratedState?: unknown;
  meta?: string;
  status?: number;
  redirect?: string;
  headers?: Record<string, string>;
};

type SSRModule = {
  render: (url: string) => Promise<SSRRenderResult>;
  shouldSSR: (path: string) => boolean;
  generateMetaTags: (url: string) => string;
};

function acceptsHtml(req: Request) {
  const acceptHeader = req.headers.accept;
  if (!acceptHeader) {
    return true;
  }

  if (acceptHeader.includes("text/html")) {
    return true;
  }

  return acceptHeader.includes("*/*");
}

function serializeState(state: unknown) {
  const json = JSON.stringify(state ?? null);
  return json.replace(/</g, "\\u003c");
}

function replaceMetaTags(template: string, meta?: string) {
  if (!meta) {
    return template;
  }

  const startMarker = "<!--app-meta-start-->";
  const endMarker = "<!--app-meta-end-->";
  const startIndex = template.indexOf(startMarker);
  const endIndex = template.indexOf(endMarker);

  if (startIndex === -1 || endIndex === -1 || endIndex < startIndex) {
    return template;
  }

  const before = template.slice(0, startIndex + startMarker.length);
  const after = template.slice(endIndex);
  return `${before}\n    ${meta}${after}`;
}

function injectIntoTemplate(template: string, result: SSRRenderResult) {
  const { html, dehydratedState } = result;
  let pageWithHtml = template.replace("<!--app-html-->", html ?? "");
  pageWithHtml = replaceMetaTags(pageWithHtml, result.meta);
  const serializedState = serializeState(dehydratedState);
  return pageWithHtml.replace(
    "__SSR_DEHYDRATED_STATE__",
    serializedState,
  );
}

async function loadClientTemplate() {
  const clientTemplate = path.resolve(
    import.meta.dirname,
    "..",
    "client",
    "index.html",
  );

  let template = await fs.promises.readFile(clientTemplate, "utf-8");
  template = template.replace(
    `src="/src/main.tsx"`,
    `src="/src/main.tsx?v=${nanoid()}"`,
  );
  return template;
}

export async function setupVite(app: Express, server: Server) {
  const { createServer: createViteServer, createLogger } = await import("vite");
  const viteConfig = {
    plugins: [
      (await import("@vitejs/plugin-react")).default(),
      (await import("@replit/vite-plugin-runtime-error-modal")).default(),
    ],
    resolve: {
      alias: {
        "@": path.resolve(import.meta.dirname, "..", "client", "src"),
        "@shared": path.resolve(import.meta.dirname, "..", "shared"),
        "@assets": path.resolve(import.meta.dirname, "..", "attached_assets"),
      },
    },
    root: path.resolve(import.meta.dirname, "..", "client"),
    build: {
      outDir: path.resolve(import.meta.dirname, "..", "dist/public"),
      emptyOutDir: true,
    },
  };
  const viteLogger = createLogger();

  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true as const,
  };

  const vite = await createViteServer({
    ...viteConfig,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      },
    },
    server: serverOptions,
    appType: "custom",
  });

  app.use(vite.middlewares);

  app.use(async (req, res, next) => {
    if (req.method !== "GET" || !acceptsHtml(req)) {
      return next();
    }

    const url = req.originalUrl;

    try {
      const ssrModule = (await vite.ssrLoadModule(
        "/src/entry-server.tsx",
      )) as SSRModule;

      const normalizedPath = normalizeRoutePath(req.path);
      if (!ssrModule.shouldSSR(normalizedPath)) {
        return next();
      }

      let template = await loadClientTemplate();
      template = await vite.transformIndexHtml(url, template);
      const result = await ssrModule.render(url);
      log(`SSR render (dev): ${normalizedPath}`, "ssr");

      if (result.redirect) {
        const status = result.status ?? 307;
        return res.redirect(status, result.redirect);
      }

      if (result.headers) {
        for (const [key, value] of Object.entries(result.headers)) {
          res.setHeader(key, value);
        }
      }

      const page = injectIntoTemplate(template, result);
      res
        .status(result.status ?? 200)
        .set({ "Content-Type": "text/html" })
        .end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });

  app.use(async (req, res, next) => {
    if (req.method !== "GET" || !acceptsHtml(req)) {
      return next();
    }

    try {
      const url = req.originalUrl;
      let template = await loadClientTemplate();
      template = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(template);
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });
}

export function serveStatic(app: Express) {
  const distPath = path.resolve(import.meta.dirname, "public");

  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`,
    );
  }

  const templatePath = path.resolve(distPath, "index.html");
  if (!fs.existsSync(templatePath)) {
    throw new Error(
      `Could not find index.html in ${distPath}, make sure to build the client first`,
    );
  }

  const rawTemplate = fs.readFileSync(templatePath, "utf-8");
  const ssrBundlePath = path.resolve(import.meta.dirname, "ssr", "entry-server.js");
  const hasSSRBundle = fs.existsSync(ssrBundlePath);
  let ssrModulePromise: Promise<SSRModule> | null = null;

  async function loadSSRModule() {
    if (!ssrModulePromise) {
      ssrModulePromise = import(pathToFileURL(ssrBundlePath).href) as Promise<SSRModule>;
    }

    return ssrModulePromise;
  }

  if (hasSSRBundle) {
    app.get("*", async (req, res, next) => {
      if (req.method !== "GET" || !acceptsHtml(req)) {
        return next();
      }

      try {
        const ssrModule = await loadSSRModule();
        const normalizedPath = normalizeRoutePath(req.path);

        if (!ssrModule.shouldSSR(normalizedPath)) {
          return next();
        }

        const result = await ssrModule.render(req.originalUrl);
        log(`SSR render (prod): ${normalizedPath}`, "ssr");

        if (result.redirect) {
          const status = result.status ?? 307;
          return res.redirect(status, result.redirect);
        }

        if (result.headers) {
          for (const [key, value] of Object.entries(result.headers)) {
            res.setHeader(key, value);
          }
        }

        const page = injectIntoTemplate(rawTemplate, result);
        res
          .status(result.status ?? 200)
          .set({ "Content-Type": "text/html" })
          .send(page);
      } catch (error) {
        next(error);
      }
    });
  } else {
    log(
      "SSR bundle not found, falling back to CSR for marketing routes",
      "ssr",
    );
  }

  app.use(express.static(distPath));

  app.get("*", (req, res, next) => {
    if (!acceptsHtml(req)) {
      return next();
    }

    res.sendFile(path.resolve(distPath, "index.html"));
  });
}
