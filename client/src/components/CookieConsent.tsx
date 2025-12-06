import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Cookie, X } from "lucide-react";

const COOKIE_CONSENT_KEY = "acceptafy_cookie_consent";

export function CookieConsent() {
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (!consent) {
      const timer = setTimeout(() => setShowBanner(true), 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify({ 
      accepted: true, 
      essential: true,
      analytics: true,
      date: new Date().toISOString() 
    }));
    setShowBanner(false);
  };

  const handleEssentialOnly = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify({ 
      accepted: true, 
      essential: true,
      analytics: false,
      date: new Date().toISOString() 
    }));
    setShowBanner(false);
  };

  const handleDecline = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify({ 
      accepted: false, 
      essential: true,
      analytics: false,
      date: new Date().toISOString() 
    }));
    setShowBanner(false);
  };

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 animate-fade-in" data-testid="cookie-consent-banner">
      <Card className="max-w-4xl mx-auto shadow-lg border-purple-500/20">
        <CardContent className="p-4 md:p-6">
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
            <div className="flex items-start gap-3 flex-1">
              <div className="p-2 rounded-lg bg-purple-500/10 shrink-0">
                <Cookie className="w-5 h-5 text-purple-500" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-sm mb-1">Cookie Preferences</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  We use cookies to ensure our website works properly and to improve your experience. 
                  Essential cookies are required for authentication and basic functionality. 
                  Analytics cookies help us understand how you use our service.{" "}
                  <a href="/privacy" className="text-purple-500 hover:underline">Learn more</a>
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDecline}
                className="text-muted-foreground"
                data-testid="button-cookie-decline"
              >
                Decline
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleEssentialOnly}
                data-testid="button-cookie-essential"
              >
                Essential Only
              </Button>
              <Button
                size="sm"
                onClick={handleAccept}
                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                data-testid="button-cookie-accept"
              >
                Accept All
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleEssentialOnly}
                className="md:hidden"
                data-testid="button-cookie-close"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
