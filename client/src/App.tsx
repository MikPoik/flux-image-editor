import { Switch, Route, Router, useLocation } from "wouter";
import { useEffect, Suspense, useLayoutEffect, useState } from "react";
import type { BaseLocationHook } from "wouter";
import type { QueryClient } from "@tanstack/react-query";
import { queryClient as defaultQueryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { StackProvider, StackHandler } from '@stackframe/react';
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { useAuth } from "@/hooks/useAuth";
import { Navigation } from "@/components/navigation";
import { Footer } from "@/components/footer";
import { ConsentToast } from "@/components/consent-toast";
import { ClientOnly } from "@/components/client-only";
import Landing from "@/pages/landing";
import Home from "@/pages/home";
import ImageEditor from "@/pages/image-editor";
import Gallery from "@/pages/gallery";
import Subscription from "@/pages/subscription";
import Pricing from "@/pages/pricing";
import TermsOfService from "@/pages/terms-of-service";
import PrivacyPolicy from "@/pages/privacy-policy";
import NotFound from "@/pages/not-found";
import { normalizeRoutePath } from "@shared/route-metadata";
import { trackPageView } from "@/lib/analytics";
import { stackClientApp } from "@/lib/stack";

// Client-side wrapper that delays initializing StackProvider until after the
// initial client render/hydration to avoid provider-driven suspension during
// hydration (keeps initial client render identical to server output).
function ClientStackWrapper({ children }: { children: React.ReactNode }) {
  // If the current route is an auth handler (e.g. /handler/*) we need the
  // StackProvider available immediately (not after a layout effect) so that
  // components like <StackHandler> can run on first render without throwing.
  const isHandlerRoute = typeof window !== 'undefined' && window.location?.pathname?.startsWith?.('/handler');

  const [mounted, setMounted] = useState<boolean>(() => Boolean(isHandlerRoute));

  useLayoutEffect(() => {
    if (!mounted) setMounted(true);
  }, [mounted]);

  if (!mounted) {
    // Render children without StackProvider to match SSR output during hydration.
    return <>{children}</>;
  }

  return <StackProvider app={stackClientApp}>{children}</StackProvider>;
}

function AuthHandler() {
  const [location] = useLocation();
  
  return (
    <StackHandler 
      app={stackClientApp} 
      location={location} 
      fullPage 
    />
  );
}

function LoadingFallback() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="h-10 w-10 animate-spin rounded-full border-2 border-muted border-t-primary" />
    </div>
  );
}

function RouterContent() {
  // Avoid calling `useAuth` during SSR because the stack auth hook may suspend
  // (it performs async user fetches). For SSR-marketing routes we can safely
  // assume unauthenticated and avoid suspending the render.
  const isServer = typeof window === "undefined";
  const { isAuthenticated } = isServer ? { isAuthenticated: false } : useAuth();
  const [location] = useLocation();

  useEffect(() => {
    if (location) {
      trackPageView(location, document.title);
    }
  }, [location]);

  // Handle auth routes
  if (location?.startsWith('/handler')) {
    return <AuthHandler />;
  }

  if (!isAuthenticated) {
    return (
      <Switch>
        <Route path="/" component={Landing} />
        <Route path="/pricing" component={Pricing} />
        <Route path="/privacy-policy" component={PrivacyPolicy} />
        <Route path="/terms-of-service" component={TermsOfService} />
        <Route path="*" component={Landing} />
      </Switch>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-slate-50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-950 flex flex-col">
      <Navigation />
      <main className="flex-1">
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/image-editor" component={ImageEditor} />
          <Route path="/gallery" component={Gallery} />
          <Route path="/subscription" component={Subscription} />
          <Route path="/pricing" component={Pricing} />
          <Route path="/terms-of-service" component={TermsOfService} />
          <Route path="/privacy-policy" component={PrivacyPolicy} />
          <Route path="*" component={NotFound} />
        </Switch>
      </main>
      <Footer />
    </div>
  );
}

export type AppProps = {
  queryClient?: QueryClient;
  routerHook?: BaseLocationHook;
  ssrPath?: string;
  ssrSearch?: string;
};

function App(
  {
    queryClient = defaultQueryClient,
    routerHook,
    ssrPath,
    ssrSearch,
  }: AppProps = {},
) {
  return (
    <QueryClientProvider client={queryClient}>
      {typeof window === "undefined" ? (
        <ThemeProvider>
          <TooltipProvider>
            <Toaster />
            <ConsentToast />
            <Router
              {...(routerHook ? { hook: routerHook } : {})}
              {...(ssrPath !== undefined ? { ssrPath } : {})}
              {...(ssrSearch !== undefined ? { ssrSearch } : {})}
            >
              <ClientOnly fallback={<div />}>
                <Suspense fallback={null}>
                  <RouterContent />
                </Suspense>
              </ClientOnly>
            </Router>
          </TooltipProvider>
        </ThemeProvider>
      ) : (
        <ClientStackWrapper>
          <ThemeProvider>
            <TooltipProvider>
              <Toaster />
              <ConsentToast />
              <Router
                {...(routerHook ? { hook: routerHook } : {})}
                {...(ssrPath !== undefined ? { ssrPath } : {})}
                {...(ssrSearch !== undefined ? { ssrSearch } : {})}
              >
                <ClientOnly fallback={<div />}>
                  <Suspense fallback={null}>
                    <RouterContent />
                  </Suspense>
                </ClientOnly>
              </Router>
            </TooltipProvider>
          </ThemeProvider>
        </ClientStackWrapper>
      )}
    </QueryClientProvider>
  );
}

export default App;
