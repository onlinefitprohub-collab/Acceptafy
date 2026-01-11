import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mail, Home, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2" data-testid="link-home">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <Mail className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold">Acceptafy</span>
          </Link>
        </div>
      </header>

      <main className="flex items-center justify-center min-h-[calc(100vh-4rem)] p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-8 pb-8 text-center">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-purple-500/10 to-pink-500/10 flex items-center justify-center">
              <span className="text-4xl font-bold bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">404</span>
            </div>
            
            <h1 className="text-2xl font-bold mb-2" data-testid="text-404-heading">Page Not Found</h1>
            <p className="text-muted-foreground mb-6">
              Sorry, we couldn't find the page you're looking for. It may have been moved or deleted.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button asChild variant="default" data-testid="button-go-home">
                <Link href="/">
                  <Home className="w-4 h-4 mr-2" />
                  Go Home
                </Link>
              </Button>
              <Button asChild variant="outline" data-testid="button-go-back" onClick={() => window.history.back()}>
                <span>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Go Back
                </span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
