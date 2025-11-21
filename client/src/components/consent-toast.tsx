import { useConsentCookie } from "@/hooks/useConsentCookie";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { useEffect } from "react";

export function ConsentToast() {
  const { consent, isLoading, acceptConsent, declineConsent } =
    useConsentCookie();
  const { toast } = useToast();

  useEffect(() => {
    if (!isLoading && consent === null) {
      const toastId = toast({
        title: "Analytics Consent",
        description:
          "We use Google Analytics to understand how you use our app. This helps us improve your experience.",
        duration: Infinity,
        action: (
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="default"
              onClick={() => {
                acceptConsent();
                toast({
                  description: "Analytics enabled. Thank you!",
                  duration: 3000,
                });
              }}
              data-testid="button-accept-analytics"
            >
              Accept
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                declineConsent();
                toast({
                  description:
                    "Analytics disabled. We respect your privacy.",
                  duration: 3000,
                });
              }}
              data-testid="button-decline-analytics"
            >
              Decline
            </Button>
          </div>
        ),
      });
    }
  }, [consent, isLoading, acceptConsent, declineConsent, toast]);

  return null;
}
