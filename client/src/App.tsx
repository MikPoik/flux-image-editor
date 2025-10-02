import { Switch, Route, Router, useLocation } from "wouter";
import type { BaseLocationHook } from "wouter";
import type { QueryClient } from "@tanstack/react-query";
import { queryClient as defaultQueryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { useAuth } from "@/hooks/useAuth";
import { Navigation } from "@/components/navigation";
import { Footer } from "@/components/footer";
import Landing from "@/pages/landing";
import Home from "@/pages/home";
import ImageEditor from "@/pages/image-editor";
import Gallery from "@/pages/gallery";
import Subscription from "@/pages/subscription";
import Pricing from "@/pages/pricing";
import TermsOfService from "@/pages/terms-of-service";
import PrivacyPolicy from "@/pages/privacy-policy";
import NotFound from "@/pages/not-found";
import { getRouteDefinition } from "./routes/registry";
import { normalizeRoutePath } from "@shared/route-metadata";

function RouterContent() {
  const { isAuthenticated, isLoading } = useAuth();
  const [location] = useLocation();
  const normalizedPath = normalizeRoutePath(location ?? "/");
  const currentRoute = getRouteDefinition(normalizedPath);
  const loadingAllowed = !(currentRoute?.ssr ?? false);

  if (isLoading && loadingAllowed) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div
          className="h-10 w-10 animate-spin rounded-full border-2 border-muted border-t-primary"
          aria-label="Loading"
        />
      </div>
    );
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
    <div className="min-h-screen bg-background flex flex-col">
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
      <ThemeProvider>
        <TooltipProvider>
          <Toaster />
          <Router
            {...(routerHook ? { hook: routerHook } : {})}
            {...(ssrPath !== undefined ? { ssrPath } : {})}
            {...(ssrSearch !== undefined ? { ssrSearch } : {})}
          >
            <RouterContent />
          </Router>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
