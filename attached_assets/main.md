import { createRoot, hydrateRoot } from "react-dom/client";
import { Router } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/contexts/theme-context";
import { queryClient } from "./lib/queryClient";
import App from "./App";
import "./index.css";

const rootElement = document.getElementById("root")!;

// Check if this is an SSR-rendered page by looking for SSR markers
const isSSR = rootElement.innerHTML.trim() !== '';

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
  // Hydrate SSR content
  hydrateRoot(rootElement, <AppWithProviders />);
} else {
  // Regular CSR mount
  createRoot(rootElement).render(<AppWithProviders />);
}
