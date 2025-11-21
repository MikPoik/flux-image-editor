import { createRoot, hydrateRoot } from "react-dom/client";
import { hydrate, type DehydratedState } from "@tanstack/react-query";
import App from "./App";
import { queryClient } from "./lib/queryClient";
import { initializeAnalytics } from "./lib/analytics";
import "./index.css";

// Attempt to initialize analytics if user has already consented
initializeAnalytics();

// Listen for consent changes and reinitialize analytics if needed
window.addEventListener("storage", () => {
  initializeAnalytics();
});

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Failed to find the root element");
}

const dehydratedStateElement = document.getElementById(
  "__REACT_QUERY_DEHYDRATED_STATE__",
);
const rawDehydratedState = dehydratedStateElement?.textContent?.trim();

if (
  rawDehydratedState &&
  rawDehydratedState !== "__SSR_DEHYDRATED_STATE__"
) {
  try {
    const dehydratedState = JSON.parse(
      rawDehydratedState,
    ) as DehydratedState | null;
    if (dehydratedState) {
      hydrate(queryClient, dehydratedState);
    }
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error("Failed to parse dehydrated query state", error);
    }
  }
}

const hasSSRMarkup = rootElement.firstElementChild !== null;

if (hasSSRMarkup) {
  hydrateRoot(rootElement, <App />);
} else {
  createRoot(rootElement).render(<App />);
}
