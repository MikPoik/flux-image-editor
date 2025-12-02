import { useConsentCookie } from "@/hooks/useConsentCookie";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { initializeAnalytics } from "@/lib/analytics";

export function ConsentToast() {
  const { consent, isLoading, acceptConsent, declineConsent } =
    useConsentCookie();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!isLoading && consent === null) {
      setIsOpen(true);
    }
  }, [consent, isLoading]);

  const handleAccept = () => {
    acceptConsent();
    setIsOpen(false);
    // Initialize analytics immediately after consent
    initializeAnalytics();
  };

  const handleDecline = () => {
    declineConsent();
    setIsOpen(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-background border-t border-border shadow-lg p-4">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex-1">
          <h3 className="font-semibold text-sm mb-1">Analytics Consent</h3>
          <p className="text-xs text-muted-foreground">
            We use Google Analytics to understand how you use our app and
            improve your experience. You can accept or decline at any time.
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={handleDecline}
            data-testid="button-decline-analytics"
          >
            Decline
          </Button>
          <Button
            size="sm"
            onClick={handleAccept}
            data-testid="button-accept-analytics"
          >
            Accept
          </Button>
        </div>
      </div>
    </div>
  );
}
