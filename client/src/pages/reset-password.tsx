import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Lock, CheckCircle, XCircle, ArrowLeft } from "lucide-react";

export default function ResetPasswordPage() {
  const [, setLocation] = useLocation();
  const [token, setToken] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isValidating, setIsValidating] = useState(true);
  const [isValid, setIsValid] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [validationMessage, setValidationMessage] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tokenParam = params.get("token");
    setToken(tokenParam);

    if (!tokenParam) {
      setIsValidating(false);
      setIsValid(false);
      setValidationMessage("No reset token provided");
      return;
    }

    const verifyToken = async () => {
      try {
        const res = await fetch(`/api/auth/verify-reset-token?token=${tokenParam}`);
        const data = await res.json();
        
        setIsValid(data.valid);
        if (data.valid) {
          setEmail(data.email);
        } else {
          setValidationMessage(data.message || "Invalid reset link");
        }
      } catch (err) {
        setIsValid(false);
        setValidationMessage("Failed to verify reset link");
      } finally {
        setIsValidating(false);
      }
    };

    verifyToken();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    setIsSubmitting(true);
    
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword: password }),
        credentials: "include",
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        setError(data.message || "Failed to reset password");
      } else {
        setIsSuccess(true);
      }
    } catch (err: any) {
      setError(err.message || "Failed to reset password");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isValidating) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
              <p className="text-muted-foreground">Verifying reset link...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isValid && !isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center gap-4 text-center">
              <XCircle className="w-16 h-16 text-red-500" />
              <h2 className="text-xl font-semibold">Invalid Reset Link</h2>
              <p className="text-muted-foreground">{validationMessage}</p>
              <Button 
                onClick={() => setLocation("/")}
                variant="outline"
                className="mt-4"
                data-testid="button-back-home"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to home
              </Button>
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
              <CheckCircle className="w-16 h-16 text-green-500" />
              <h2 className="text-xl font-semibold">Password Reset Successfully</h2>
              <p className="text-muted-foreground">
                Your password has been reset. You can now sign in with your new password.
              </p>
              <Button 
                onClick={() => setLocation("/")}
                className="mt-4 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                data-testid="button-go-signin"
              >
                Go to sign in
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
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Reset your password</CardTitle>
          <CardDescription>
            Enter a new password for {email}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-password">New Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="new-password"
                  type="password"
                  placeholder="Enter new password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10"
                  data-testid="input-new-password"
                  required
                  minLength={8}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="confirm-password"
                  type="password"
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="pl-10"
                  data-testid="input-confirm-password"
                  required
                  minLength={8}
                />
              </div>
            </div>

            {error && (
              <p className="text-sm text-red-500 text-center" data-testid="text-reset-error">{error}</p>
            )}

            <Button 
              type="submit" 
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
              disabled={isSubmitting}
              data-testid="button-reset-submit"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Resetting...
                </>
              ) : (
                "Reset password"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
