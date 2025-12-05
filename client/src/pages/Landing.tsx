import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Mail, 
  Zap, 
  ShieldCheck, 
  GraduationCap, 
  Trophy,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Target,
  BarChart3
} from "lucide-react";

export default function Landing() {
  const features = [
    {
      icon: Mail,
      title: "AI Email Grading",
      description: "Get instant feedback on subject lines, body copy, spam triggers, and deliverability predictions.",
      gradient: "from-purple-500 to-pink-500"
    },
    {
      icon: Zap,
      title: "Smart Rewriting",
      description: "Transform underperforming emails with AI-powered rewrites tailored to your goals.",
      gradient: "from-blue-500 to-cyan-500"
    },
    {
      icon: ShieldCheck,
      title: "Deliverability Tools",
      description: "DNS record generators, domain health checks, and warmup plans to maximize inbox placement.",
      gradient: "from-green-500 to-emerald-500"
    },
    {
      icon: GraduationCap,
      title: "Email Academy",
      description: "Master email marketing with our comprehensive educational content and best practices.",
      gradient: "from-orange-500 to-yellow-500"
    }
  ];

  const stats = [
    { value: "95%", label: "Inbox Placement Rate" },
    { value: "2.5x", label: "Higher Open Rates" },
    { value: "10K+", label: "Emails Optimized" },
    { value: "500+", label: "Happy Users" }
  ];

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <Mail className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold">Acceptafy</span>
          </div>
          <div className="flex items-center gap-4">
            <a href="/pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors" data-testid="link-pricing">
              Pricing
            </a>
            <Button variant="ghost" asChild data-testid="button-login">
              <a href="/api/login">Log in</a>
            </Button>
            <Button asChild data-testid="button-get-started-header">
              <a href="/api/login">Get Started</a>
            </Button>
          </div>
        </div>
      </header>

      <section className="relative py-20 lg:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-transparent to-pink-500/10" />
        <div className="container mx-auto px-4 relative">
          <div className="max-w-4xl mx-auto text-center">
            <Badge variant="secondary" className="mb-4" data-testid="badge-ai-powered">
              <Sparkles className="w-3 h-3 mr-1" />
              AI-Powered Email Optimization
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
              Write Emails That
              <span className="bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent"> Actually Get Read</span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Stop guessing what works. Acceptafy uses AI to grade your emails, suggest improvements, and ensure they land in the inbox - not the spam folder.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600" asChild data-testid="button-start-free">
                <a href="/api/login">
                  Start Free
                  <ArrowRight className="w-4 h-4 ml-2" />
                </a>
              </Button>
              <Button size="lg" variant="outline" asChild data-testid="button-view-pricing">
                <a href="/pricing">View Pricing</a>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 border-y bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center" data-testid={`stat-${index}`}>
                <div className="text-3xl md:text-4xl font-bold text-foreground mb-1">{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Everything You Need to Master Email</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Comprehensive tools and insights to transform your email marketing from guesswork to science.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <Card key={index} className="relative overflow-hidden group hover-elevate" data-testid={`feature-card-${index}`}>
                  <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-5 group-hover:opacity-10 transition-opacity`} />
                  <CardContent className="relative p-6">
                    <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-4`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground">{feature.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">How It Works</h2>
              <p className="text-muted-foreground">Three simple steps to better email performance</p>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              {[
                { icon: Mail, step: "1", title: "Paste Your Email", description: "Drop in your subject line, preview text, and body copy" },
                { icon: BarChart3, step: "2", title: "Get Instant Analysis", description: "AI grades every aspect from spam triggers to personalization" },
                { icon: Target, step: "3", title: "Optimize & Send", description: "Apply fixes, use AI rewrites, and watch results improve" }
              ].map((item, index) => {
                const Icon = item.icon;
                return (
                  <div key={index} className="text-center" data-testid={`how-it-works-${index}`}>
                    <div className="relative inline-flex mb-4">
                      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                        <Icon className="w-8 h-8 text-white" />
                      </div>
                      <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-background border-2 border-purple-500 flex items-center justify-center text-sm font-bold">
                        {item.step}
                      </div>
                    </div>
                    <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
                    <p className="text-sm text-muted-foreground">{item.description}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="container mx-auto px-4">
          <Card className="relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-pink-500 opacity-90" />
            <CardContent className="relative p-8 md:p-12 text-center">
              <Trophy className="w-12 h-12 text-white mx-auto mb-4" />
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
                Ready to Level Up Your Email Game?
              </h2>
              <p className="text-white/80 mb-6 max-w-xl mx-auto">
                Join thousands of marketers who've improved their email performance with Acceptafy. Start for free today.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" variant="secondary" asChild data-testid="button-cta-start-free">
                  <a href="/api/login">
                    Start Free
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </a>
                </Button>
              </div>
              <div className="flex items-center justify-center gap-6 mt-6 text-white/80 text-sm">
                <div className="flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>No credit card required</span>
                </div>
                <div className="flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>5 free analyses</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <footer className="border-t py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                <Mail className="w-4 h-4 text-white" />
              </div>
              <span className="font-semibold">Acceptafy</span>
            </div>
            <p className="text-sm text-muted-foreground">
              AI-powered email optimization for modern marketers
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
