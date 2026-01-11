import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle, XCircle, ArrowLeft, Mail } from "lucide-react";

export default function VerifyEmailPage() {
  const [, setLocation] = useLocation();
  const [isVerifying, setIsVerifying] = useState(true);
  const [isSuccess, setIsSuccess] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");

    if (!token) {
      setIsVerifying(false);
      setIsSuccess(false);
      setMessage("No verification token provided");
      return;
    }

    const verifyEmail = async () => {
      try {
        const res = await fetch(`/api/auth/verify-email?token=${token}`);
        const data = await res.json();
        
        setIsSuccess(data.success);
        setMessage(data.message || (data.success ? "Email verified successfully!" : "Verification failed"));
      } catch (err) {
        setIsSuccess(false);
        setMessage("Failed to verify email. Please try again.");
      } finally {
        setIsVerifying(false);
      }
    };

    verifyEmail();
  }, []);

  if (isVerifying) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
              <p className="text-muted-foreground">Verifying your email...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center gap-4 text-center">
              <div className="rounded-full bg-green-500/10 p-4">
                <CheckCircle className="w-16 h-16 text-green-500" />
              </div>
              <h2 className="text-xl font-semibold">Email Verified!</h2>
              <p className="text-muted-foreground">{message}</p>
              <p className="text-sm text-muted-foreground">
                Your account is now fully activated. You can access all features.
              </p>
              <Button 
                onClick={() => setLocation("/")}
                className="mt-4 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                data-testid="button-go-to-app"
              >
                <Mail className="w-4 h-4 mr-2" />
                Start Using Acceptafy
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="rounded-full bg-red-500/10 p-4">
              <XCircle className="w-16 h-16 text-red-500" />
            </div>
            <h2 className="text-xl font-semibold">Verification Failed</h2>
            <p className="text-muted-foreground">{message}</p>
            <p className="text-sm text-muted-foreground">
              If your link has expired, you can request a new verification email from your account settings.
            </p>
            <div className="flex gap-3 mt-4">
              <Button 
                onClick={() => setLocation("/")}
                variant="outline"
                data-testid="button-back-home"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to home
              </Button>
              <Button 
                onClick={() => setLocation("/account")}
                data-testid="button-go-to-account"
              >
                Go to Account
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
