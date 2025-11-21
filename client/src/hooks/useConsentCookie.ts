import { useEffect, useState } from "react";

const CONSENT_STORAGE_KEY = "analytics-consent";

export type ConsentChoice = "accepted" | "declined" | null;

export const useConsentCookie = () => {
  const [consent, setConsent] = useState<ConsentChoice>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem(CONSENT_STORAGE_KEY);
    if (stored) {
      setConsent((stored as ConsentChoice) || null);
    }
    setIsLoading(false);
  }, []);

  const acceptConsent = () => {
    localStorage.setItem(CONSENT_STORAGE_KEY, "accepted");
    setConsent("accepted");
  };

  const declineConsent = () => {
    localStorage.setItem(CONSENT_STORAGE_KEY, "declined");
    setConsent("declined");
  };

  const hasConsented = consent === "accepted";

  return { consent, isLoading, acceptConsent, declineConsent, hasConsented };
};
