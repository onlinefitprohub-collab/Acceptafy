import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Mail, 
  Zap, 
  ShieldCheck, 
  GraduationCap, 
  CheckCircle2,
  ArrowRight,
  Target,
  BarChart3,
  Users,
  TrendingUp,
  AlertTriangle,
  Sparkles
} from "lucide-react";
import { SUBSCRIPTION_LIMITS, PRICING } from "@shared/schema";

export default function Landing() {
  const capabilities = [
    {
      icon: Mail,
      title: "AI-Powered Email Grading",
      description: "Get detailed analysis of subject lines, preview text, body copy, and spam triggers before you hit send."
    },
    {
      icon: Zap,
      title: "Smart Rewriting",
      description: "Transform underperforming copy with AI suggestions tailored to your goals—more opens, clicks, or replies."
    },
    {
      icon: ShieldCheck,
      title: "Deliverability Tools",
      description: "DNS record generators, domain health checks, and warmup plans to help your emails reach the inbox."
    },
    {
      icon: GraduationCap,
      title: "Email Academy",
      description: "Learn email marketing best practices with our comprehensive educational resources."
    }
  ];

  const plans = [
    {
      key: "starter",
      name: PRICING.starter.name,
      tagline: PRICING.starter.tagline,
      price: PRICING.starter.monthly,
      limits: SUBSCRIPTION_LIMITS.starter,
      features: [
        `${SUBSCRIPTION_LIMITS.starter.gradesPerMonth} email grades/month`,
        `${SUBSCRIPTION_LIMITS.starter.rewritesPerMonth} AI rewrites/month`,
        `${SUBSCRIPTION_LIMITS.starter.followupsPerMonth} follow-up generations`,
        `${SUBSCRIPTION_LIMITS.starter.deliverabilityChecksPerMonth} deliverability checks`,
        "Basic spam analysis",
        "Email Academy access",
        `${SUBSCRIPTION_LIMITS.starter.historyLimit} days history`,
      ],
      cta: "Start Free",
      popular: false,
    },
    {
      key: "pro",
      name: PRICING.pro.name,
      tagline: PRICING.pro.tagline,
      price: PRICING.pro.monthly,
      limits: SUBSCRIPTION_LIMITS.pro,
      features: [
        `${SUBSCRIPTION_LIMITS.pro.gradesPerMonth} email grades/month`,
        `${SUBSCRIPTION_LIMITS.pro.rewritesPerMonth} AI rewrites/month`,
        `${SUBSCRIPTION_LIMITS.pro.followupsPerMonth} follow-up generations`,
        `${SUBSCRIPTION_LIMITS.pro.deliverabilityChecksPerMonth} deliverability checks`,
        "Advanced spam analysis",
        "Subject line A/B testing",
        `${SUBSCRIPTION_LIMITS.pro.brandDomains} brand domains`,
        "Priority support",
        "Template library",
      ],
      cta: "Get Pro",
      popular: true,
    },
    {
      key: "scale",
      name: PRICING.scale.name,
      tagline: PRICING.scale.tagline,
      price: PRICING.scale.monthly,
      limits: SUBSCRIPTION_LIMITS.scale,
      features: [
        `${SUBSCRIPTION_LIMITS.scale.gradesPerMonth} email grades/month`,
        `${SUBSCRIPTION_LIMITS.scale.rewritesPerMonth} AI rewrites/month`,
        `${SUBSCRIPTION_LIMITS.scale.followupsPerMonth} follow-up generations`,
        `${SUBSCRIPTION_LIMITS.scale.deliverabilityChecksPerMonth} deliverability checks`,
        `${SUBSCRIPTION_LIMITS.scale.teamSeats} team seats included`,
        `${SUBSCRIPTION_LIMITS.scale.brandDomains} brand domains`,
        "API access",
        "White-label reports",
        "Dedicated support",
      ],
      cta: "Get Scale",
      popular: false,
    },
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
            <a href="#pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors" data-testid="link-pricing">
              Pricing
            </a>
            <a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors" data-testid="link-features">
              Features
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

      <section className="relative py-16 lg:py-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-pink-500/5" />
        <div className="container mx-auto px-4 relative">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-3xl md:text-5xl font-bold tracking-tight mb-6">
              Write Better Emails.
              <span className="block text-muted-foreground mt-2">Get More Opens, Clicks, and Revenue.</span>
            </h1>
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
              Acceptafy helps email marketers improve their campaigns with AI-powered grading, spam detection, and deliverability tools. Know what's working before you send.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600" asChild data-testid="button-start-free">
                <a href="/api/login">
                  Try Free
                  <ArrowRight className="w-4 h-4 ml-2" />
                </a>
              </Button>
              <Button size="lg" variant="outline" asChild data-testid="button-view-pricing">
                <a href="#pricing">See Pricing</a>
              </Button>
            </div>
            <p className="text-sm text-muted-foreground mt-4">
              No credit card required. {SUBSCRIPTION_LIMITS.starter.gradesPerMonth} free email grades included.
            </p>
          </div>
        </div>
      </section>

      <section className="py-12 border-y bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap justify-center gap-8 md:gap-16 text-center">
            <div data-testid="stat-grading">
              <div className="flex items-center justify-center gap-2 text-muted-foreground mb-1">
                <Target className="w-4 h-4" />
                <span className="text-sm font-medium">Spam Detection</span>
              </div>
              <p className="text-xs text-muted-foreground">Catch triggers before you send</p>
            </div>
            <div data-testid="stat-deliverability">
              <div className="flex items-center justify-center gap-2 text-muted-foreground mb-1">
                <ShieldCheck className="w-4 h-4" />
                <span className="text-sm font-medium">Deliverability Checks</span>
              </div>
              <p className="text-xs text-muted-foreground">DNS, DKIM, DMARC helpers</p>
            </div>
            <div data-testid="stat-rewrite">
              <div className="flex items-center justify-center gap-2 text-muted-foreground mb-1">
                <Zap className="w-4 h-4" />
                <span className="text-sm font-medium">AI Rewrites</span>
              </div>
              <p className="text-xs text-muted-foreground">Improve copy with one click</p>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold mb-4">What Acceptafy Does</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Tools designed to help you write emails that reach inboxes and get results.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
            {capabilities.map((item, index) => {
              const Icon = item.icon;
              return (
                <Card key={index} className="hover-elevate" data-testid={`feature-card-${index}`}>
                  <CardContent className="p-6">
                    <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center mb-4">
                      <Icon className="w-5 h-5 text-foreground" />
                    </div>
                    <h3 className="font-semibold mb-2">{item.title}</h3>
                    <p className="text-sm text-muted-foreground">{item.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-2xl md:text-3xl font-bold mb-4">How It Works</h2>
              <p className="text-muted-foreground">Three steps to better email performance</p>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              {[
                { icon: Mail, step: "1", title: "Paste Your Email", description: "Drop in your subject line, preview text, and body copy" },
                { icon: BarChart3, step: "2", title: "Get Analysis", description: "AI grades spam triggers, readability, and deliverability risks" },
                { icon: Target, step: "3", title: "Improve & Send", description: "Apply fixes, use AI rewrites, and send with confidence" }
              ].map((item, index) => {
                const Icon = item.icon;
                return (
                  <div key={index} className="text-center" data-testid={`how-it-works-${index}`}>
                    <div className="relative inline-flex mb-4">
                      <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center">
                        <Icon className="w-6 h-6 text-foreground" />
                      </div>
                      <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-foreground text-background flex items-center justify-center text-xs font-bold">
                        {item.step}
                      </div>
                    </div>
                    <h3 className="font-semibold mb-2">{item.title}</h3>
                    <p className="text-sm text-muted-foreground">{item.description}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <section id="pricing" className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold mb-4">Simple, Transparent Pricing</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Choose the plan that fits your email volume. All plans include core grading and deliverability tools.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {plans.map((plan) => (
              <Card 
                key={plan.key} 
                className={`relative flex flex-col ${plan.popular ? 'border-purple-500 shadow-lg' : ''}`}
                data-testid={`pricing-card-${plan.key}`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0">
                      Most Popular
                    </Badge>
                  </div>
                )}
                
                <CardHeader className="text-center pb-4">
                  <CardTitle className="text-xl">{plan.name}</CardTitle>
                  <CardDescription>{plan.tagline}</CardDescription>
                </CardHeader>
                
                <CardContent className="flex-1">
                  <div className="text-center mb-6">
                    <span className="text-4xl font-bold">${plan.price}</span>
                    {plan.price > 0 && (
                      <span className="text-muted-foreground">/month</span>
                    )}
                  </div>
                  
                  <ul className="space-y-2">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
                
                <CardFooter>
                  <Button 
                    className={`w-full ${plan.popular ? 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600' : ''}`}
                    variant={plan.popular ? "default" : "outline"}
                    asChild
                    data-testid={`button-subscribe-${plan.key}`}
                  >
                    <a href="/api/login">{plan.cta}</a>
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>

          <div className="mt-8 text-center">
            <p className="text-sm text-muted-foreground">
              Need higher limits? <a href="mailto:support@acceptafy.com" className="text-foreground underline">Contact us</a> for custom enterprise plans.
            </p>
          </div>
        </div>
      </section>

      <section className="py-12 border-t">
        <div className="container mx-auto px-4">
          <Card className="max-w-3xl mx-auto border-muted">
            <CardContent className="p-6 md:p-8">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                  <AlertTriangle className="w-5 h-5 text-muted-foreground" />
                </div>
                <div>
                  <h3 className="font-semibold mb-2">What Acceptafy Can't Promise</h3>
                  <p className="text-sm text-muted-foreground">
                    We can't guarantee your emails will always land in the inbox—deliverability depends on many factors including your sender reputation, list quality, and email provider policies. What we can do is help you identify issues, improve your copy, and follow best practices that increase your chances of success.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold mb-4">Ready to Improve Your Email Performance?</h2>
          <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
            Start with {SUBSCRIPTION_LIMITS.starter.gradesPerMonth} free email grades. No credit card required.
          </p>
          <Button size="lg" className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600" asChild data-testid="button-cta-start-free">
            <a href="/api/login">
              Get Started Free
              <ArrowRight className="w-4 h-4 ml-2" />
            </a>
          </Button>
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
              Email optimization tools for marketers
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
