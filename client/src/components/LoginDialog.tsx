import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { Loader2, Mail, Lock, LogIn, UserPlus } from "lucide-react";

interface LoginDialogProps {
  trigger?: React.ReactNode;
  children?: React.ReactNode;
  mode?: "signin" | "signup";
}

export function LoginDialog({ trigger, children, mode = "signin" }: LoginDialogProps) {
  const [open, setOpen] = useState(false);
  const [currentMode, setCurrentMode] = useState(mode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { login, isLoggingIn, register, isRegistering } = useAuth();

  const isSignup = currentMode === "signup";
  const isSubmitting = isLoggingIn || isRegistering;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    try {
      const authFn = isSignup ? register : login;
      const result = await authFn({ email, password });
      if (result.success) {
        setOpen(false);
        window.location.reload();
      } else {
        setError(result.message || (isSignup ? "Registration failed" : "Login failed"));
      }
    } catch (err: any) {
      setError(err.message || (isSignup ? "Registration failed" : "Login failed"));
    }
  };

  const toggleMode = () => {
    setCurrentMode(currentMode === "signin" ? "signup" : "signin");
    setError("");
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      setOpen(isOpen);
      if (isOpen) setCurrentMode(mode);
    }}>
      <DialogTrigger asChild>
        {trigger || children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-xl">
            {isSignup ? "Create your Acceptafy account" : "Sign in to Acceptafy"}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  data-testid="input-login-email"
                  required
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder={isSignup ? "Create a password" : "Enter your password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10"
                  data-testid="input-login-password"
                  required
                />
              </div>
            </div>

            {error && (
              <p className="text-sm text-red-500 text-center" data-testid="text-login-error">{error}</p>
            )}

            <Button 
              type="submit" 
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
              disabled={isSubmitting}
              data-testid="button-login-submit"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {isSignup ? "Creating account..." : "Signing in..."}
                </>
              ) : (
                <>
                  {isSignup ? <UserPlus className="w-4 h-4 mr-2" /> : <LogIn className="w-4 h-4 mr-2" />}
                  {isSignup ? "Create account" : "Sign in"}
                </>
              )}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground">
            {isSignup ? "Already have an account?" : "Don't have an account?"}{" "}
            <button 
              type="button"
              onClick={toggleMode}
              className="text-purple-500 hover:text-purple-600 font-medium"
              data-testid="button-toggle-auth-mode"
            >
              {isSignup ? "Sign in" : "Sign up"}
            </button>
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
