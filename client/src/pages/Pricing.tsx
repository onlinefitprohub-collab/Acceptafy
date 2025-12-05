import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, ArrowLeft, Loader2, Mail, Sparkles, Users } from "lucide-react";
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
        `${SUBSCRIPTION_LIMITS.starter.rewritesPerMonth} AI rewrites/month`,
        `${SUBSCRIPTION_LIMITS.starter.followupsPerMonth} follow-up generations`,
        `${SUBSCRIPTION_LIMITS.starter.deliverabilityChecksPerMonth} deliverability checks`,
        "Basic spam analysis",
        "Email Academy access",
        `${SUBSCRIPTION_LIMITS.starter.historyLimit} days history`,
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
        `${SUBSCRIPTION_LIMITS.pro.rewritesPerMonth} AI rewrites/month`,
        `${SUBSCRIPTION_LIMITS.pro.followupsPerMonth} follow-up generations`,
        `${SUBSCRIPTION_LIMITS.pro.deliverabilityChecksPerMonth} deliverability checks`,
        "Advanced spam analysis",
        "Subject line A/B testing",
        `${SUBSCRIPTION_LIMITS.pro.brandDomains} brand domains`,
        "Priority support",
        "Template library",
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
        `${SUBSCRIPTION_LIMITS.scale.rewritesPerMonth} AI rewrites/month`,
        `${SUBSCRIPTION_LIMITS.scale.followupsPerMonth} follow-up generations`,
        `${SUBSCRIPTION_LIMITS.scale.deliverabilityChecksPerMonth} deliverability checks`,
        `${SUBSCRIPTION_LIMITS.scale.teamSeats} team seats included`,
        `${SUBSCRIPTION_LIMITS.scale.brandDomains} brand domains`,
        "API access",
        "White-label reports",
        "Dedicated support",
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
                  <a href="/api/login">Get Started</a>
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">Simple, Transparent Pricing</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Choose the plan that fits your email volume. All plans include core grading and deliverability tools.
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
                    <div className="w-10 h-10 mx-auto rounded-lg bg-muted flex items-center justify-center mb-3">
                      <Icon className="w-5 h-5 text-foreground" />
                    </div>
                    <CardTitle className="text-xl">{plan.name}</CardTitle>
                    <CardDescription>{plan.description}</CardDescription>
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
                      onClick={() => handleSubscribe(plan.priceId, plan.key)}
                      disabled={checkoutMutation.isPending || isCurrentPlan}
                      data-testid={`button-subscribe-${plan.key}`}
                    >
                      {checkoutMutation.isPending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : isCurrentPlan ? (
                        "Current Plan"
                      ) : plan.key === "starter" ? (
                        "Get Started"
                      ) : (
                        "Subscribe"
                      )}
                    </Button>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        )}

        <div className="mt-12 text-center space-y-4">
          <p className="text-muted-foreground">
            Need higher limits? <a href="mailto:support@acceptafy.com" className="text-foreground underline">Contact us</a> for custom enterprise plans.
          </p>
          <p className="text-sm text-muted-foreground">
            14-day money-back guarantee on all paid plans.
          </p>
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
