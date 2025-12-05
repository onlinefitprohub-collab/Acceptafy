import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, ArrowLeft, Loader2, Mail, Sparkles, Users, Clock, Zap, ShieldCheck } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { SUBSCRIPTION_LIMITS, PRICING } from "@shared/schema";

interface Price {
  id: string;
  unit_amount: number;
  currency: string;
  recurring: { interval: string } | null;
}

interface Product {
  id: string;
  name: string;
  description: string;
  metadata: Record<string, string>;
  prices: Price[];
}

const PLAN_ICONS = {
  starter: Mail,
  pro: Sparkles,
  scale: Users,
};

export default function Pricing() {
  const { user, isAuthenticated } = useAuth();

  const { data: productsData, isLoading: productsLoading } = useQuery<{ data: Product[] }>({
    queryKey: ["/api/products"],
  });

  const checkoutMutation = useMutation({
    mutationFn: async (priceId: string) => {
      const response = await apiRequest("POST", "/api/checkout", { priceId });
      return response.json();
    },
    onSuccess: (data) => {
      if (data.url) {
        window.location.href = data.url;
      }
    },
  });

  const plans = [
    {
      key: "starter",
      name: PRICING.starter.name,
      description: PRICING.starter.tagline,
      price: PRICING.starter.monthly,
      priceId: null,
      features: [
        `${SUBSCRIPTION_LIMITS.starter.gradesPerMonth} email grades/month`,
        `${SUBSCRIPTION_LIMITS.starter.rewritesPerMonth} AI rewrites`,
        "Spam & deliverability checks",
        "Email Academy access",
        "No credit card required",
      ],
    },
    {
      key: "pro",
      name: PRICING.pro.name,
      description: PRICING.pro.tagline,
      price: PRICING.pro.monthly,
      priceId: null,
      popular: true,
      features: [
        `${SUBSCRIPTION_LIMITS.pro.gradesPerMonth} email grades/month`,
        `${SUBSCRIPTION_LIMITS.pro.rewritesPerMonth} AI rewrites`,
        "Advanced spam analysis (ISP-specific)",
        "Subject line A/B testing",
        `${SUBSCRIPTION_LIMITS.pro.teamSeats} team seats`,
        `${SUBSCRIPTION_LIMITS.pro.brandDomains} brand domains`,
      ],
    },
    {
      key: "scale",
      name: PRICING.scale.name,
      description: PRICING.scale.tagline,
      price: PRICING.scale.monthly,
      priceId: null,
      features: [
        `${SUBSCRIPTION_LIMITS.scale.gradesPerMonth} email grades/month`,
        `${SUBSCRIPTION_LIMITS.scale.rewritesPerMonth} AI rewrites`,
        `${SUBSCRIPTION_LIMITS.scale.teamSeats} team seats`,
        "API access",
        "White-label PDF reports",
        `${SUBSCRIPTION_LIMITS.scale.brandDomains} brand domains`,
      ],
    },
  ];

  const enrichedPlans = plans.map(plan => {
    const product = productsData?.data?.find(p => 
      p.name.toLowerCase().includes(plan.key) || 
      p.metadata?.tier === plan.key
    );
    const monthlyPrice = product?.prices?.find(p => p.recurring?.interval === 'month');
    
    return {
      ...plan,
      priceId: monthlyPrice?.id || null,
      price: monthlyPrice ? monthlyPrice.unit_amount / 100 : plan.price,
    };
  });

  const handleSubscribe = (priceId: string | null, planKey: string) => {
    if (!isAuthenticated) {
      window.location.href = "/api/login";
      return;
    }
    
    if (planKey === "starter") {
      window.location.href = "/";
      return;
    }

    if (priceId) {
      checkoutMutation.mutate(priceId);
    }
  };

  const faqs = [
    {
      q: "Can I upgrade or downgrade anytime?",
      a: "Yes! You can change your plan at any time. When upgrading, you'll be charged the prorated difference. When downgrading, your new rate starts at the next billing cycle."
    },
    {
      q: "What happens if I hit my limit?",
      a: "You'll get a warning at 80% usage. At 100%, you can upgrade to a higher tier for more capacity, or wait until your next billing cycle when limits reset."
    },
    {
      q: "Is there a free trial for paid plans?",
      a: "Yes! All paid plans come with a 14-day free trial. Cancel anytime during the trial and you won't be charged."
    },
    {
      q: "Do unused grades roll over?",
      a: "No, usage resets each billing cycle. This keeps our pricing simple and affordable for everyone."
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <a href="/" className="flex items-center gap-2" data-testid="link-home">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <Mail className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold">Acceptafy</span>
          </a>
          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              <Button variant="ghost" asChild data-testid="button-dashboard">
                <a href="/">Dashboard</a>
              </Button>
            ) : (
              <>
                <Button variant="ghost" asChild data-testid="button-login">
                  <a href="/api/login">Log in</a>
                </Button>
                <Button asChild data-testid="button-get-started">
                  <a href="/api/login">Get Started Free</a>
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-bold mb-4" data-testid="text-pricing-heading">Simple Pricing, No Surprises</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto" data-testid="text-pricing-description">
            Start free, upgrade when you need more. All plans include core grading and spam detection.
          </p>
        </div>

        {productsLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {enrichedPlans.map((plan) => {
              const Icon = PLAN_ICONS[plan.key as keyof typeof PLAN_ICONS] || Mail;
              const isCurrentPlan = user?.subscriptionTier === plan.key || 
                (user?.subscriptionTier === 'free' && plan.key === 'starter') ||
                (!user?.subscriptionTier && plan.key === 'starter');

              return (
                <Card 
                  key={plan.key} 
                  className={`relative flex flex-col ${plan.popular ? 'border-purple-500 shadow-xl scale-105' : ''}`}
                  data-testid={`pricing-card-${plan.key}`}
                >
                  {plan.popular && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                      <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0 shadow-lg px-4 py-1" data-testid="badge-most-popular">
                        <Sparkles className="w-3 h-3 mr-1" />
                        Most Popular
                      </Badge>
                    </div>
                  )}
                  
                  <CardHeader className="text-center pb-4">
                    <div className="w-12 h-12 mx-auto rounded-xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 flex items-center justify-center mb-3">
                      <Icon className="w-6 h-6 text-foreground" />
                    </div>
                    <CardTitle className="text-xl">{plan.name}</CardTitle>
                    <CardDescription>{plan.description}</CardDescription>
                  </CardHeader>
                  
                  <CardContent className="flex-1">
                    <div className="text-center mb-6">
                      <span className="text-5xl font-bold">${plan.price}</span>
                      {plan.price > 0 && (
                        <span className="text-muted-foreground">/mo</span>
                      )}
                    </div>
                    
                    <ul className="space-y-3">
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
                      size="lg"
                      onClick={() => handleSubscribe(plan.priceId, plan.key)}
                      disabled={checkoutMutation.isPending || isCurrentPlan}
                      data-testid={`button-subscribe-${plan.key}`}
                    >
                      {checkoutMutation.isPending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : isCurrentPlan ? (
                        "Current Plan"
                      ) : plan.key === "starter" ? (
                        "Get Started Free"
                      ) : (
                        "Start 14-Day Trial"
                      )}
                    </Button>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        )}

        <div className="mt-8 text-center">
          <p className="text-sm text-muted-foreground">
            Enterprise needs? <a href="mailto:hello@acceptafy.com" className="text-foreground underline" data-testid="link-enterprise">Contact us</a> for custom plans.
          </p>
        </div>

        <section className="mt-20 max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-8">Frequently Asked Questions</h2>
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <Card key={index} data-testid={`faq-${index}`}>
                <CardContent className="p-5">
                  <h3 className="font-semibold mb-2">{faq.q}</h3>
                  <p className="text-sm text-muted-foreground">{faq.a}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section className="mt-16 max-w-2xl mx-auto" data-testid="section-all-plans">
          <Card className="bg-gradient-to-br from-purple-500/5 to-pink-500/5 border-purple-500/20" data-testid="card-all-plans-include">
            <CardContent className="p-6 flex flex-col md:flex-row items-center gap-6">
              <div className="flex-1">
                <h3 className="font-semibold text-lg mb-2">All Plans Include</h3>
                <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2" data-testid="feature-spam">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    <span>Spam detection</span>
                  </div>
                  <div className="flex items-center gap-2" data-testid="feature-deliverability">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    <span>Deliverability checks</span>
                  </div>
                  <div className="flex items-center gap-2" data-testid="feature-academy">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    <span>Email Academy</span>
                  </div>
                  <div className="flex items-center gap-2" data-testid="feature-history">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    <span>Analysis history</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm" data-testid="badge-14-day-guarantee">
                <ShieldCheck className="w-5 h-5 text-green-500" />
                <span className="font-medium">14-day guarantee</span>
              </div>
            </CardContent>
          </Card>
        </section>

        <div className="mt-12 text-center">
          <Button variant="ghost" asChild data-testid="link-back-home">
            <a href="/">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </a>
          </Button>
        </div>
      </main>
    </div>
  );
}
