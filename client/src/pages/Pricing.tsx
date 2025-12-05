import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, ArrowLeft, Loader2, Mail, Sparkles, Zap, Building2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { SUBSCRIPTION_LIMITS } from "@shared/schema";

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
  free: Mail,
  pro: Sparkles,
  business: Building2,
};

const PLAN_GRADIENTS = {
  free: "from-slate-500 to-slate-600",
  pro: "from-purple-500 to-pink-500",
  business: "from-blue-500 to-cyan-500",
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
      key: "free",
      name: "Free",
      description: "Perfect for trying out Acceptafy",
      price: 0,
      priceId: null,
      features: [
        `${SUBSCRIPTION_LIMITS.free.gradesPerMonth} email grades per month`,
        `${SUBSCRIPTION_LIMITS.free.rewritesPerMonth} AI rewrites per month`,
        `${SUBSCRIPTION_LIMITS.free.deliverabilityChecksPerMonth} deliverability checks`,
        "Basic spam analysis",
        "Email Academy access",
      ],
    },
    {
      key: "pro",
      name: "Pro",
      description: "For serious email marketers",
      price: 29,
      priceId: null,
      popular: true,
      features: [
        `${SUBSCRIPTION_LIMITS.pro.gradesPerMonth} email grades per month`,
        `${SUBSCRIPTION_LIMITS.pro.rewritesPerMonth} AI rewrites per month`,
        `${SUBSCRIPTION_LIMITS.pro.deliverabilityChecksPerMonth} deliverability checks`,
        "Advanced spam analysis",
        "Subject line A/B testing",
        "Priority support",
        "Full history access",
      ],
    },
    {
      key: "business",
      name: "Business",
      description: "For teams and agencies",
      price: 99,
      priceId: null,
      features: [
        "Unlimited email grades",
        "Unlimited AI rewrites",
        "Unlimited deliverability checks",
        "Team collaboration",
        "API access",
        "Custom integrations",
        "Dedicated support",
        "White-label reports",
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
    
    if (planKey === "free") {
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
          <h1 className="text-4xl font-bold mb-4">Simple, Transparent Pricing</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Choose the plan that's right for you. All plans include access to our core email optimization features.
          </p>
        </div>

        {productsLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {enrichedPlans.map((plan) => {
              const Icon = PLAN_ICONS[plan.key as keyof typeof PLAN_ICONS] || Mail;
              const gradient = PLAN_GRADIENTS[plan.key as keyof typeof PLAN_GRADIENTS] || "from-slate-500 to-slate-600";
              const isCurrentPlan = user?.subscriptionTier === plan.key;

              return (
                <Card 
                  key={plan.key} 
                  className={`relative flex flex-col ${plan.popular ? 'border-purple-500 shadow-lg shadow-purple-500/20' : ''}`}
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
                    <div className={`w-12 h-12 mx-auto rounded-lg bg-gradient-to-br ${gradient} flex items-center justify-center mb-3`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <CardTitle className="text-2xl">{plan.name}</CardTitle>
                    <CardDescription>{plan.description}</CardDescription>
                  </CardHeader>
                  
                  <CardContent className="flex-1">
                    <div className="text-center mb-6">
                      <span className="text-4xl font-bold">${plan.price}</span>
                      {plan.price > 0 && (
                        <span className="text-muted-foreground">/month</span>
                      )}
                    </div>
                    
                    <ul className="space-y-3">
                      {plan.features.map((feature, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
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
                      ) : plan.key === "free" ? (
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

        <div className="mt-16 text-center">
          <p className="text-muted-foreground mb-4">
            All plans include a 14-day money-back guarantee. No questions asked.
          </p>
          <Button variant="link" asChild data-testid="link-back-home">
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
