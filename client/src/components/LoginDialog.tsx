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
  const { login, isLoggingIn } = useAuth();

  const isSignup = currentMode === "signup";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    try {
      const result = await login({ email, password });
      if (result.success) {
        setOpen(false);
        window.location.reload();
      } else {
        setError(result.message || "Login failed");
      }
    } catch (err: any) {
      setError(err.message || "Login failed");
    }
  };

  const handleReplitLogin = () => {
    window.location.href = "/api/login";
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
          <Button 
            type="button" 
            variant="outline" 
            className="w-full"
            onClick={handleReplitLogin}
            data-testid="button-login-replit"
          >
            <svg className="w-4 h-4 mr-2" viewBox="0 0 32 32" fill="none">
              <path d="M7 5.5C7 4.67157 7.67157 4 8.5 4H15.5C16.3284 4 17 4.67157 17 5.5V12H8.5C7.67157 12 7 11.3284 7 10.5V5.5Z" fill="currentColor"/>
              <path d="M17 12H25.5C26.3284 12 27 12.6716 27 13.5V18.5C27 19.3284 26.3284 20 25.5 20H17V12Z" fill="currentColor"/>
              <path d="M7 21.5C7 20.6716 7.67157 20 8.5 20H17V26.5C17 27.3284 16.3284 28 15.5 28H8.5C7.67157 28 7 27.3284 7 26.5V21.5Z" fill="currentColor"/>
            </svg>
            {isSignup ? "Sign up with Replit" : "Continue with Replit"}
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">Or {isSignup ? "sign up" : "continue"} with email</span>
            </div>
          </div>

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
              disabled={isLoggingIn}
              data-testid="button-login-submit"
            >
              {isLoggingIn ? (
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
