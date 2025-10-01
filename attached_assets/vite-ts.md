
import express, { type Express } from "express";
import fs from "fs";
import path from "path";
import { type Server } from "http";
import { nanoid } from "nanoid";
import { pathToFileURL } from "url";

type SSRModule = {
  generateHTML: (url: string, search?: string) => Promise<{ html: string; ssrContext: { redirectTo?: string } }>;
  generateMetaTags: (url: string) => string;
  shouldSSR: (url: string) => boolean;
};

interface RenderWithSSROptions {
  template: string;
  pathname: string;
  search?: string;
  ssrModule: SSRModule;
  styleHref?: string;
}

async function renderTemplateWithSSR({
  template,
  pathname,
  search,
  ssrModule,
  styleHref,
}: RenderWithSSROptions): Promise<{ html: string; ssrContext: { redirectTo?: string } }> {
  const { generateHTML, generateMetaTags } = ssrModule;

  if (typeof generateHTML !== "function" || typeof generateMetaTags !== "function") {
    throw new Error("SSR entry module must export generateHTML and generateMetaTags functions");
  }

  const { html: appHtml, ssrContext } = await generateHTML(pathname, search);
  const metaTags = generateMetaTags(pathname);

  let html = template.replace(
    /<!-- SSR_META_START -->[\s\S]*?<!-- SSR_META_END -->/,
    () => {
      const indentedMeta = metaTags
        .split("\n")
        .map((line) => (line ? `    ${line}` : ""))
        .join("\n");
      return `<!-- SSR_META_START -->\n${indentedMeta}\n    <!-- SSR_META_END -->`;
    },
  );

  if (styleHref && !html.includes("data-ssr-styles")) {
    const styleTag = `    <link rel="stylesheet" href="${styleHref}" data-ssr-styles />`;
    html = html.replace("</head>", `${styleTag}\n  </head>`);
  }

  html = html.replace('<div id="root"></div>', `<div id="root">${appHtml}</div>`);

  return { html, ssrContext };
}

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
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
  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;

    try {
      const clientTemplate = path.resolve(
        import.meta.dirname,
        "..",
        "client",
        "index.html",
      );

      // always reload the index.html file from disk incase it changes
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`,
      );

      // Check if this route should be server-side rendered
      const requestUrl = new URL(url, "http://localhost");
      const pathname = requestUrl.pathname;
      let pageTemplate = template;

      try {
        const ssrModule = (await vite.ssrLoadModule("/src/entry-server.tsx")) as SSRModule;

        if (ssrModule.shouldSSR(pathname)) {
          log(`SSR render (dev): ${pathname}`, "ssr");
          const { html, ssrContext } = await renderTemplateWithSSR({
            template: pageTemplate,
            pathname,
            search: requestUrl.search,
            styleHref: "/src/index.css",
            ssrModule,
          });

          if (ssrContext?.redirectTo) {
            return res.redirect(302, ssrContext.redirectTo);
          }

          pageTemplate = html;
        }
      } catch (ssrError) {
        console.error("SSR Error, falling back to CSR:", ssrError);
      }

      const page = await vite.transformIndexHtml(url, pageTemplate);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });
}

export function serveStatic(app: Express) {
  const distPath = path.resolve(import.meta.dirname, "public");
  const indexPath = path.resolve(distPath, "index.html");

  if (!fs.existsSync(distPath) || !fs.existsSync(indexPath)) {
    throw new Error(
      `Could not find the build output. Expected client assets at: ${indexPath}`,
    );
  }

  const baseTemplate = fs.readFileSync(indexPath, "utf-8");
  const ssrEntryPath = path.resolve(import.meta.dirname, "server", "entry-server.js");
  let ssrModulePromise: Promise<SSRModule> | null = null;

  const loadProdSSRModule = async () => {
    if (!ssrModulePromise) {
      ssrModulePromise = import(pathToFileURL(ssrEntryPath).href) as Promise<SSRModule>;
    }
    return ssrModulePromise;
  };

  app.use(
    express.static(distPath, {
      index: false,
    }),
  );

  app.get("*", async (req, res, next) => {
    if (req.method !== "GET") {
      return next();
    }

    try {
      const originHost = req.get("host") || "localhost";
      const originProtocol = req.protocol || "http";
      const origin = `${originProtocol}://${originHost}`;
      const requestUrl = new URL(req.originalUrl, origin);
      const pathname = requestUrl.pathname;

      let pageTemplate = baseTemplate;

      try {
        const ssrModule = await loadProdSSRModule();

        if (ssrModule.shouldSSR(pathname)) {
          //log(`SSR render (prod): ${pathname}`, "ssr");
          const { html, ssrContext } = await renderTemplateWithSSR({
            template: pageTemplate,
            pathname,
            search: requestUrl.search,
            ssrModule,
          });

          if (ssrContext?.redirectTo) {
            return res.redirect(302, ssrContext.redirectTo);
          }

          pageTemplate = html;
        }
      } catch (ssrError) {
        console.error("SSR Error, falling back to CSR:", ssrError);
      }


      res.status(200).set({ "Content-Type": "text/html" }).send(pageTemplate);
    } catch (error) {
      next(error);
    }
  });
}
