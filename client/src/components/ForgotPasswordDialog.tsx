import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Mail, ArrowLeft, CheckCircle } from "lucide-react";

interface ForgotPasswordDialogProps {
  trigger?: React.ReactNode;
  children?: React.ReactNode;
}

export function ForgotPasswordDialog({ trigger, children }: ForgotPasswordDialogProps) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);
    
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
        credentials: "include",
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        setError(data.message || "Failed to send reset link");
      } else {
        setIsSuccess(true);
      }
    } catch (err: any) {
      setError(err.message || "Failed to send reset link");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      setEmail("");
      setError("");
      setIsSuccess(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger || children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-xl">
            {isSuccess ? "Check your email" : "Reset your password"}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {isSuccess ? (
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <CheckCircle className="w-16 h-16 text-green-500" />
              </div>
              <p className="text-muted-foreground">
                If an account exists with <strong>{email}</strong>, you will receive a password reset link shortly.
              </p>
              <p className="text-sm text-muted-foreground">
                Please check your inbox and spam folder.
              </p>
              <Button 
                onClick={() => handleOpenChange(false)}
                className="w-full"
                data-testid="button-close-forgot-password"
              >
                Close
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <p className="text-sm text-muted-foreground text-center">
                Enter your email address and we'll send you a link to reset your password.
              </p>
              
              <div className="space-y-2">
                <Label htmlFor="forgot-email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="forgot-email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    data-testid="input-forgot-email"
                    required
                  />
                </div>
              </div>

              {error && (
                <p className="text-sm text-red-500 text-center" data-testid="text-forgot-error">{error}</p>
              )}

              <Button 
                type="submit" 
                className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                disabled={isSubmitting}
                data-testid="button-forgot-submit"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  "Send reset link"
                )}
              </Button>
            </form>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
