import { useConsentCookie } from "@/hooks/useConsentCookie";
import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

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
  };

  const handleDecline = () => {
    declineConsent();
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent
        className="sm:max-w-md"
        onEscapeKeyDown={() => {}} // Prevent closing on escape
      >
        <DialogHeader>
          <DialogTitle>Analytics Consent</DialogTitle>
          <DialogDescription className="pt-2">
            We use Google Analytics to understand how you use our app and
            improve your experience. Your consent helps us make better features
            for everyone.
          </DialogDescription>
        </DialogHeader>
        <div className="flex gap-3 justify-end pt-4">
          <Button
            variant="outline"
            onClick={handleDecline}
            data-testid="button-decline-analytics"
          >
            Decline
          </Button>
          <Button
            onClick={handleAccept}
            data-testid="button-accept-analytics"
          >
            Accept
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
