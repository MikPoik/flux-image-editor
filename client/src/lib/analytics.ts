declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
    dataLayer?: any[];
  }
}

const GA_ID = import.meta.env.VITE_GA_ID;
const CONSENT_STORAGE_KEY = "analytics-consent";

const hasConsentedToAnalytics = (): boolean => {
  try {
    const consent = localStorage.getItem(CONSENT_STORAGE_KEY);
    return consent === "accepted";
  } catch {
    return false;
  }
};

export const initializeAnalytics = () => {
  if (!GA_ID) {
    if (import.meta.env.DEV) {
      console.warn(
        "Google Analytics ID not configured. Set VITE_GA_ID environment variable.",
      );
    }
    return;
  }

  if (!hasConsentedToAnalytics()) {
    if (import.meta.env.DEV) {
      console.log("User has not consented to analytics tracking.");
    }
    return;
  }

  // Load Google Analytics script
  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
  document.head.appendChild(script);

  // Initialize gtag
  window.dataLayer = window.dataLayer || [];

  function gtag(..._args: any[]) {
    const dl = window.dataLayer;
    if (dl) {
      dl.push(arguments);
    }
  }

  gtag.l = new Date().getTime();
  window.gtag = gtag;

  gtag("js", new Date());
  gtag("config", GA_ID);
};

export const trackPageView = (path: string, title?: string) => {
  if (!window.gtag || !GA_ID) return;

  window.gtag("config", GA_ID, {
    page_path: path,
    page_title: title || document.title,
  });
};

export const trackEvent = (
  eventName: string,
  eventParams?: Record<string, any>,
) => {
  if (!window.gtag || !GA_ID) return;

  window.gtag("event", eventName, eventParams);
};
