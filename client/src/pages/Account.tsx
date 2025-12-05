import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  User, 
  CreditCard, 
  BarChart3, 
  LogOut, 
  Crown, 
  Zap,
  Mail,
  Shield,
  ArrowLeft,
  Loader2,
  ExternalLink,
  CheckCircle2
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { SUBSCRIPTION_LIMITS, PRICING } from "@shared/schema";

interface UsageData {
  usage: {
    gradeCount: number;
    rewriteCount: number;
    followupCount: number;
    deliverabilityChecks: number;
    periodStart: string;
    periodEnd: string;
  };
  limits: {
    gradesPerMonth: number;
    rewritesPerMonth: number;
    followupsPerMonth: number;
    deliverabilityChecksPerMonth: number;
    historyLimit: number;
  };
  tier: string;
}

interface SubscriptionData {
  subscription: unknown | null;
  tier: string;
  status: string;
}

export default function Account() {
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();

  const { data: usageData, isLoading: usageLoading } = useQuery<UsageData>({
    queryKey: ["/api/usage"],
    enabled: !!user,
  });

  const { data: subscriptionData } = useQuery<SubscriptionData>({
    queryKey: ["/api/subscription"],
    enabled: !!user,
  });

  const billingPortalMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/billing-portal");
      return response.json();
    },
    onSuccess: (data) => {
      if (data.url) {
        window.location.href = data.url;
      }
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to open billing portal. Please try again.",
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("success") === "true") {
      toast({
        title: "Subscription Activated!",
        description: "Your subscription has been successfully activated. Enjoy your new features!",
      });
      window.history.replaceState({}, "", "/account");
    }
  }, [toast]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user) {
    window.location.href = "/api/login";
    return null;
  }

  const currentTier = user.subscriptionTier === 'free' ? 'starter' : (user.subscriptionTier || 'starter');
  const tierInfo = PRICING[currentTier as keyof typeof PRICING] || PRICING.starter;

  const usageItems = usageData ? [
    {
      label: "Email Grades",
      current: usageData.usage.gradeCount,
      limit: usageData.limits.gradesPerMonth,
      icon: Mail,
    },
    {
      label: "AI Rewrites",
      current: usageData.usage.rewriteCount,
      limit: usageData.limits.rewritesPerMonth,
      icon: Zap,
    },
    {
      label: "Follow-ups",
      current: usageData.usage.followupCount,
      limit: usageData.limits.followupsPerMonth,
      icon: Mail,
    },
    {
      label: "Deliverability Checks",
      current: usageData.usage.deliverabilityChecks,
      limit: usageData.limits.deliverabilityChecksPerMonth,
      icon: Shield,
    },
  ] : [];

  const tierColors = {
    starter: "bg-slate-500",
    pro: "bg-gradient-to-r from-purple-500 to-pink-500",
    scale: "bg-gradient-to-r from-blue-500 to-cyan-500",
  };

  const tierBadgeColor = tierColors[currentTier as keyof typeof tierColors] || tierColors.starter;

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
            <Button variant="ghost" asChild data-testid="button-dashboard">
              <a href="/">Dashboard</a>
            </Button>
            <Button variant="ghost" asChild data-testid="button-logout">
              <a href="/api/logout">
                <LogOut className="w-4 h-4 mr-2" />
                Log out
              </a>
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <Button variant="ghost" asChild className="mb-4" data-testid="button-back">
            <a href="/">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </a>
          </Button>
          <h1 className="text-3xl font-bold">Account Settings</h1>
          <p className="text-muted-foreground">Manage your profile, subscription, and usage</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card data-testid="card-profile">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Profile
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <Avatar className="w-16 h-16">
                  <AvatarImage src={user.profileImageUrl || undefined} />
                  <AvatarFallback className="text-lg">
                    {user.firstName?.[0] || user.email?.[0]?.toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold text-lg">
                    {user.firstName ? `${user.firstName} ${user.lastName || ""}`.trim() : "User"}
                  </p>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                  <Badge className={`mt-2 ${tierBadgeColor} text-white border-0`}>
                    <Crown className="w-3 h-3 mr-1" />
                    {tierInfo.name} Plan
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card data-testid="card-subscription">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                Subscription
              </CardTitle>
              <CardDescription>
                {subscriptionData?.subscription ? "Manage your billing and subscription" : "Upgrade for more features"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {subscriptionData?.subscription ? (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Status</span>
                    <Badge variant="outline" className="flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-green-500" />
                      Active
                    </Badge>
                  </div>
                  <Button 
                    onClick={() => billingPortalMutation.mutate()} 
                    disabled={billingPortalMutation.isPending}
                    className="w-full"
                    variant="outline"
                    data-testid="button-manage-billing"
                  >
                    {billingPortalMutation.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        Manage Billing
                        <ExternalLink className="w-4 h-4 ml-2" />
                      </>
                    )}
                  </Button>
                </>
              ) : (
                <>
                  <p className="text-sm text-muted-foreground">
                    You're on the {tierInfo.name} plan. Upgrade to unlock more features and higher limits.
                  </p>
                  <Button asChild className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600" data-testid="button-upgrade">
                    <a href="/pricing">
                      Upgrade Now
                      <Crown className="w-4 h-4 ml-2" />
                    </a>
                  </Button>
                </>
              )}
            </CardContent>
          </Card>

          <Card className="md:col-span-2 lg:col-span-1" data-testid="card-usage">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                This Month's Usage
              </CardTitle>
              {usageData && (
                <CardDescription>
                  Resets on {new Date(usageData.usage.periodEnd).toLocaleDateString()}
                </CardDescription>
              )}
            </CardHeader>
            <CardContent>
              {usageLoading ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <div className="space-y-4">
                  {usageItems.map((item, index) => {
                    const Icon = item.icon;
                    const percentage = (item.current / item.limit) * 100;
                    const isNearLimit = percentage > 80;

                    return (
                      <div key={index} data-testid={`usage-item-${index}`}>
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <Icon className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm font-medium">{item.label}</span>
                          </div>
                          <span className={`text-sm ${isNearLimit ? 'text-orange-500 font-medium' : 'text-muted-foreground'}`}>
                            {item.current} / {item.limit}
                          </span>
                        </div>
                        <Progress 
                          value={Math.min(percentage, 100)} 
                          className={`h-2 ${isNearLimit ? '[&>div]:bg-orange-500' : ''}`}
                        />
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {currentTier === "starter" && (
          <Card className="mt-6 border-purple-500/30 bg-gradient-to-br from-purple-500/5 to-pink-500/5" data-testid="card-upgrade-prompt">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                    <Crown className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">Need More Email Grades?</h3>
                    <p className="text-sm text-muted-foreground">
                      Upgrade to Pro for {SUBSCRIPTION_LIMITS.pro.gradesPerMonth} grades, {SUBSCRIPTION_LIMITS.pro.rewritesPerMonth} rewrites, and priority support.
                    </p>
                  </div>
                </div>
                <Button asChild className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600" data-testid="button-upgrade-cta">
                  <a href="/pricing">
                    View Plans
                    <Zap className="w-4 h-4 ml-2" />
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
