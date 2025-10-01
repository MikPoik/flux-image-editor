import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/contexts/theme-context";
import { useAuth } from "@/hooks/useAuth";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import NotFound from "@/pages/not-found";
import ChatWidget from "@/pages/chat-widget";
import { Suspense } from "react";
import { normalizeRoutePath } from "@shared/route-metadata";
import { shouldSSR } from "@/routes/registry";

import Dashboard from "@/pages/dashboard";
import Home from "@/pages/home";
import ChatbotForm from "@/pages/chatbot-form";
import ChatbotEdit from "@/pages/chatbot-edit";
import ChatbotTest from "@/pages/chatbot-test";
import UIDesigner from "@/pages/ui-designer";
import AddData from "@/pages/add-data";
import SurveyBuilder from "@/pages/survey-builder";
import SurveyAnalytics from "@/pages/survey-analytics";
import ChatHistory from "@/pages/chat-history";
import ChatbotEmbed from "@/pages/chatbot-embed";
import Docs from "@/pages/docs";
import Pricing from "@/pages/pricing";
import Subscription from "@/pages/Subscription";
import Contact from "@/pages/contact";
import Privacy from "@/pages/privacy";
import Terms from "@/pages/terms";

function AuthenticatedRouter() {
  // Check if this is an embedded widget context
  // Check both URL params and injected config (SSR-safe)
  const urlEmbedded = typeof window !== 'undefined' ? 
    new URLSearchParams(window.location.search).get('embedded') === 'true' : false;
  const configEmbedded = typeof window !== 'undefined' ? 
    (window as any).__CHAT_WIDGET_CONFIG__?.embedded : false;
  const isEmbedded = urlEmbedded || configEmbedded;

  if (isEmbedded) {
    // For embedded widgets, skip authentication entirely
    return (
      <Switch>
        <Route path="/widget" component={ChatWidget} />
        <Route path="/chat-widget" component={ChatWidget} />
        <Route component={ChatWidget} />
      </Switch>
    );
  }

  const { isAuthenticated, isLoading } = useAuth();
  const [location] = useLocation();
  const currentPath = location ?? '/';
  const normalizedLocation = normalizeRoutePath(currentPath);
  const isPublicRoute = shouldSSR(normalizedLocation);

  if (isLoading && !isPublicRoute) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <Switch>
      {!isAuthenticated ? (
        <>
          <Route path="/" component={Home} />
          <Route path="/docs" component={Docs} />
          <Route path="/pricing" component={Pricing} />
          <Route path="/contact" component={Contact} />
          <Route path="/privacy" component={Privacy} />
          <Route path="/terms" component={Terms} />
          <Route path="/widget" component={ChatWidget} />
          <Route path="/chat-widget" component={ChatWidget} />
        </>
      ) : (
        <>
          <Route path="/" component={Home} />
          <Route path="/contact" component={Contact} />
          <Route path="/privacy" component={Privacy} />
          <Route path="/terms" component={Terms} />
          <Route path="/dashboard" component={Dashboard} />
          <Route path="/chatbots/new" component={ChatbotForm} />
          <Route path="/chatbots/:guid/add-data" component={AddData} />
          <Route path="/chatbots/:guid/test" component={ChatbotTest} />
          <Route path="/chatbots/:guid/ui-designer" component={UIDesigner} />
          <Route path="/chatbots/:guid/analytics" component={ChatHistory} />
          <Route path="/chatbots/:guid/survey-analytics" component={SurveyAnalytics} />
          <Route path="/chatbots/:guid/surveys" component={SurveyBuilder} />
          <Route path="/chatbots/:guid/embed" component={ChatbotEmbed} />
          <Route path="/chatbots/:guid" component={ChatbotEdit} />
          <Route path="/widget" component={ChatWidget} />
          <Route path="/chat-widget" component={ChatWidget} />
          <Route path="/subscription" component={Subscription} />
          <Route path="/pricing" component={Pricing} />
          <Route path="/docs" component={Docs} />
          <Route path="/support" component={Docs} />
          <Route component={NotFound} />
        </>
      )}
      <Route component={NotFound} />
    </Switch>
  );
}

function Router() {
  // Check if this is an embedded widget context
  // Check both URL params and injected config (SSR-safe)
  const urlEmbedded = typeof window !== 'undefined' ? 
    new URLSearchParams(window.location.search).get('embedded') === 'true' : false;
  const configEmbedded = typeof window !== 'undefined' ? 
    (window as any).__CHAT_WIDGET_CONFIG__?.embedded : false;
  const isEmbedded = urlEmbedded || configEmbedded;

  if (isEmbedded) {
    // For embedded widgets, bypass authentication and navbar entirely
    return (
      <Suspense fallback={
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      }>
        <AuthenticatedRouter />
      </Suspense>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Suspense fallback={
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      }>
        <Navbar />
        <main className="flex-1">
          <AuthenticatedRouter />
        </main>
        <Footer />
      </Suspense>
    </div>
  );
}

function App() {
  return (
    <>
      <Toaster />
      <Router />
    </>
  );
}

export default App;
