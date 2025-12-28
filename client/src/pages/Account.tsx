import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  CheckCircle2,
  Building2,
  Palette,
  Save,
  Key,
  Eye,
  EyeOff
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { SUBSCRIPTION_LIMITS, PRICING } from "@shared/schema";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

// Profile update schema
const profileFormSchema = z.object({
  firstName: z.string().max(100, "Maximum 100 characters").optional().or(z.literal('')),
  lastName: z.string().max(100, "Maximum 100 characters").optional().or(z.literal('')),
  companyName: z.string().max(200, "Maximum 200 characters").optional().or(z.literal('')),
  phone: z.string().max(30, "Maximum 30 characters").optional().or(z.literal('')),
  addressLine1: z.string().max(255, "Maximum 255 characters").optional().or(z.literal('')),
  addressLine2: z.string().max(255, "Maximum 255 characters").optional().or(z.literal('')),
  city: z.string().max(100, "Maximum 100 characters").optional().or(z.literal('')),
  stateProvince: z.string().max(100, "Maximum 100 characters").optional().or(z.literal('')),
  postalCode: z.string().max(20, "Maximum 20 characters").optional().or(z.literal('')),
  country: z.string().max(100, "Maximum 100 characters").optional().or(z.literal('')),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

interface AgencyBranding {
  agencyName?: string;
  logoUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
  footerText?: string;
  introText?: string;
  contactEmail?: string;
  contactPhone?: string;
  website?: string;
}

interface UsageData {
  usage: {
    gradeCount: number;
    rewriteCount: number;
    followupCount: number;
    deliverabilityChecks: number;
    periodStart: string;
    periodEnd: string;
  };
  dailyUsage?: {
    gradeCount: number;
    rewriteCount: number;
    followupCount: number;
    deliverabilityChecks: number;
  };
  limits: {
    gradesPerMonth: number;
    rewritesPerMonth: number;
    followupsPerMonth: number;
    deliverabilityChecksPerMonth: number;
    gradesPerDay: number;
    rewritesPerDay: number;
    followupsPerDay: number;
    deliverabilityChecksPerDay: number;
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
  
  // Agency branding state
  const [agencyName, setAgencyName] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [primaryColor, setPrimaryColor] = useState('#a855f7');
  const [secondaryColor, setSecondaryColor] = useState('#ec4899');
  const [footerText, setFooterText] = useState('');
  const [introText, setIntroText] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [website, setWebsite] = useState('');

  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Profile form with react-hook-form
  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      companyName: '',
      phone: '',
      addressLine1: '',
      addressLine2: '',
      city: '',
      stateProvince: '',
      postalCode: '',
      country: '',
    },
  });

  const { data: usageData, isLoading: usageLoading } = useQuery<UsageData>({
    queryKey: ["/api/usage"],
    enabled: !!user,
  });

  const { data: subscriptionData } = useQuery<SubscriptionData>({
    queryKey: ["/api/subscription"],
    enabled: !!user,
  });
  
  const isScaleTier = user?.subscriptionTier === 'scale';
  
  const { data: brandingData, isLoading: brandingLoading } = useQuery<AgencyBranding>({
    queryKey: ["/api/agency-branding"],
    enabled: !!user && isScaleTier,
  });
  
  // Update form when branding data loads
  useEffect(() => {
    if (brandingData) {
      setAgencyName(brandingData.agencyName || '');
      setLogoUrl(brandingData.logoUrl || '');
      setPrimaryColor(brandingData.primaryColor || '#a855f7');
      setSecondaryColor(brandingData.secondaryColor || '#ec4899');
      setFooterText(brandingData.footerText || '');
      setIntroText(brandingData.introText || '');
      setContactEmail(brandingData.contactEmail || '');
      setContactPhone(brandingData.contactPhone || '');
      setWebsite(brandingData.website || '');
    }
  }, [brandingData]);
  
  const saveBrandingMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/agency-branding", {
        agencyName,
        logoUrl,
        primaryColor,
        secondaryColor,
        footerText,
        introText,
        contactEmail,
        contactPhone,
        website,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/agency-branding"] });
      toast({
        title: "Branding Saved",
        description: "Your agency branding has been updated successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save branding. Please try again.",
        variant: "destructive",
      });
    },
  });

  const changePasswordMutation = useMutation({
    mutationFn: async () => {
      if (newPassword !== confirmPassword) {
        throw new Error("Passwords do not match");
      }
      if (newPassword.length < 8) {
        throw new Error("Password must be at least 8 characters");
      }
      const response = await apiRequest("POST", "/api/change-password", {
        currentPassword,
        newPassword,
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Failed to change password");
      }
      return response.json();
    },
    onSuccess: () => {
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      toast({
        title: "Password Changed",
        description: "Your password has been updated successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to change password. Please try again.",
        variant: "destructive",
      });
    },
  });
  
  // Fetch user profile for address data
  interface UserProfile {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
    addressLine1?: string;
    addressLine2?: string;
    city?: string;
    stateProvince?: string;
    postalCode?: string;
    country?: string;
    companyName?: string;
    phone?: string;
  }
  
  const { data: userProfile, isLoading: profileLoading } = useQuery<UserProfile>({
    queryKey: ["/api/auth/user"],
    enabled: !!user,
  });
  
  // Update form when profile data loads
  useEffect(() => {
    if (userProfile) {
      profileForm.reset({
        firstName: userProfile.firstName || '',
        lastName: userProfile.lastName || '',
        addressLine1: userProfile.addressLine1 || '',
        addressLine2: userProfile.addressLine2 || '',
        city: userProfile.city || '',
        stateProvince: userProfile.stateProvince || '',
        postalCode: userProfile.postalCode || '',
        country: userProfile.country || '',
        companyName: userProfile.companyName || '',
        phone: userProfile.phone || '',
      });
    }
  }, [userProfile, profileForm]);
  
  const saveProfileMutation = useMutation({
    mutationFn: async (data: ProfileFormValues) => {
      const response = await apiRequest("PATCH", "/api/user/profile", data);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update profile");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/session"] });
      toast({
        title: "Profile Updated",
        description: "Your profile and address have been saved successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    },
  });
  
  const onProfileSubmit = (data: ProfileFormValues) => {
    saveProfileMutation.mutate(data);
  };

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
    window.location.href = "/";
    return null;
  }

  const currentTier = user.subscriptionTier === 'free' ? 'starter' : (user.subscriptionTier || 'starter');
  const tierInfo = PRICING[currentTier as keyof typeof PRICING] || PRICING.starter;

  const usageItems = usageData ? [
    {
      label: "Email Grades",
      current: usageData.usage.gradeCount,
      limit: usageData.limits.gradesPerMonth,
      dailyCurrent: usageData.dailyUsage?.gradeCount ?? 0,
      dailyLimit: usageData.limits.gradesPerDay,
      icon: Mail,
    },
    {
      label: "AI Rewrites",
      current: usageData.usage.rewriteCount,
      limit: usageData.limits.rewritesPerMonth,
      dailyCurrent: usageData.dailyUsage?.rewriteCount ?? 0,
      dailyLimit: usageData.limits.rewritesPerDay,
      icon: Zap,
    },
    {
      label: "Follow-ups",
      current: usageData.usage.followupCount,
      limit: usageData.limits.followupsPerMonth,
      dailyCurrent: usageData.dailyUsage?.followupCount ?? 0,
      dailyLimit: usageData.limits.followupsPerDay,
      icon: Mail,
    },
    {
      label: "Deliverability Checks",
      current: usageData.usage.deliverabilityChecks,
      limit: usageData.limits.deliverabilityChecksPerMonth,
      dailyCurrent: usageData.dailyUsage?.deliverabilityChecks ?? 0,
      dailyLimit: usageData.limits.deliverabilityChecksPerDay,
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
                Usage Limits
              </CardTitle>
              {usageData && (
                <CardDescription>
                  Monthly resets on {new Date(usageData.usage.periodEnd).toLocaleDateString()} • Daily resets at midnight UTC
                </CardDescription>
              )}
            </CardHeader>
            <CardContent>
              {usageLoading ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <div className="space-y-5">
                  {usageItems.map((item, index) => {
                    const Icon = item.icon;
                    const monthlyPercentage = (item.current / item.limit) * 100;
                    const dailyPercentage = item.dailyLimit === -1 ? 0 : ((item.dailyCurrent ?? 0) / item.dailyLimit) * 100;
                    const isMonthlyNearLimit = monthlyPercentage > 80;
                    const isDailyNearLimit = dailyPercentage > 80;

                    return (
                      <div key={index} data-testid={`usage-item-${index}`} className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Icon className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm font-medium">{item.label}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs text-muted-foreground">Monthly</span>
                              <span className={`text-xs ${isMonthlyNearLimit ? 'text-orange-500 font-medium' : 'text-muted-foreground'}`}>
                                {item.current} / {item.limit}
                              </span>
                            </div>
                            <Progress 
                              value={Math.min(monthlyPercentage, 100)} 
                              className={`h-1.5 ${isMonthlyNearLimit ? '[&>div]:bg-orange-500' : ''}`}
                            />
                          </div>
                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs text-muted-foreground">Daily</span>
                              <span className={`text-xs ${isDailyNearLimit ? 'text-orange-500 font-medium' : 'text-muted-foreground'}`}>
                                {item.dailyCurrent ?? 0} / {item.dailyLimit === -1 ? '∞' : item.dailyLimit}
                              </span>
                            </div>
                            <Progress 
                              value={item.dailyLimit === -1 ? 0 : Math.min(dailyPercentage, 100)} 
                              className={`h-1.5 ${isDailyNearLimit ? '[&>div]:bg-orange-500' : ''}`}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Profile & Address Card */}
        <Card className="mt-6" data-testid="card-profile-address">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              Profile & Address
            </CardTitle>
            <CardDescription>
              Update your personal information and mailing address
            </CardDescription>
          </CardHeader>
          <CardContent>
            {profileLoading ? (
              <div className="flex justify-center py-4">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <Form {...profileForm}>
                <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-6">
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <FormField
                      control={profileForm.control}
                      name="firstName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>First Name</FormLabel>
                          <FormControl>
                            <Input placeholder="John" data-testid="input-first-name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={profileForm.control}
                      name="lastName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Last Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Doe" data-testid="input-last-name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={profileForm.control}
                      name="companyName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Company Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Acme Inc." data-testid="input-company-name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={profileForm.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone</FormLabel>
                          <FormControl>
                            <Input type="tel" placeholder="+1 (555) 123-4567" data-testid="input-phone" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="border-t pt-4">
                    <h4 className="font-medium mb-4">Mailing Address</h4>
                    <div className="grid gap-4 md:grid-cols-2">
                      <FormField
                        control={profileForm.control}
                        name="addressLine1"
                        render={({ field }) => (
                          <FormItem className="md:col-span-2">
                            <FormLabel>Street Address</FormLabel>
                            <FormControl>
                              <Input placeholder="123 Main Street" data-testid="input-address-line1" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={profileForm.control}
                        name="addressLine2"
                        render={({ field }) => (
                          <FormItem className="md:col-span-2">
                            <FormLabel>Apartment, Suite, etc. (optional)</FormLabel>
                            <FormControl>
                              <Input placeholder="Suite 100" data-testid="input-address-line2" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={profileForm.control}
                        name="city"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>City</FormLabel>
                            <FormControl>
                              <Input placeholder="New York" data-testid="input-city" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={profileForm.control}
                        name="stateProvince"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>State / Province</FormLabel>
                            <FormControl>
                              <Input placeholder="NY" data-testid="input-state-province" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={profileForm.control}
                        name="postalCode"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Postal Code</FormLabel>
                            <FormControl>
                              <Input placeholder="10001" data-testid="input-postal-code" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={profileForm.control}
                        name="country"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Country</FormLabel>
                            <FormControl>
                              <Input placeholder="United States" data-testid="input-country" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  <Button 
                    type="submit" 
                    disabled={saveProfileMutation.isPending}
                    className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                    data-testid="button-save-profile"
                  >
                    {saveProfileMutation.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : (
                      <Save className="w-4 h-4 mr-2" />
                    )}
                    Save Profile
                  </Button>
                </form>
              </Form>
            )}
          </CardContent>
        </Card>

        {user.isEmailPasswordUser && (
          <Card className="mt-6" data-testid="card-security">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="w-5 h-5" />
                Security
              </CardTitle>
              <CardDescription>
                Update your password to keep your account secure
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  changePasswordMutation.mutate();
                }}
                className="space-y-4 max-w-md"
              >
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">Current Password</Label>
                  <div className="relative">
                    <Input
                      id="currentPassword"
                      type={showCurrentPassword ? "text" : "password"}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Enter your current password"
                      data-testid="input-current-password"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      data-testid="button-toggle-current-password"
                    >
                      {showCurrentPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <div className="relative">
                    <Input
                      id="newPassword"
                      type={showNewPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter your new password"
                      data-testid="input-new-password"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      data-testid="button-toggle-new-password"
                    >
                      {showNewPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Must be at least 8 characters
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm your new password"
                      data-testid="input-confirm-password"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      data-testid="button-toggle-confirm-password"
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                  {confirmPassword && newPassword !== confirmPassword && (
                    <p className="text-xs text-destructive">
                      Passwords do not match
                    </p>
                  )}
                </div>
                <Button
                  type="submit"
                  disabled={changePasswordMutation.isPending || !currentPassword || !newPassword || !confirmPassword || newPassword !== confirmPassword}
                  className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                  data-testid="button-change-password"
                >
                  {changePasswordMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <Key className="w-4 h-4 mr-2" />
                  )}
                  Update Password
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

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

        {isScaleTier && (
          <Card className="mt-6" data-testid="card-agency-branding">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="w-5 h-5" />
                Agency Branding
              </CardTitle>
              <CardDescription>
                Customize your whitelabel reports with your agency's branding
              </CardDescription>
            </CardHeader>
            <CardContent>
              {brandingLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="grid gap-6 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="agencyName">Agency Name</Label>
                      <Input
                        id="agencyName"
                        placeholder="Your Agency Name"
                        value={agencyName}
                        onChange={(e) => setAgencyName(e.target.value)}
                        data-testid="input-agency-name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="logoUrl">Logo URL</Label>
                      <Input
                        id="logoUrl"
                        placeholder="https://yoursite.com/logo.png"
                        value={logoUrl}
                        onChange={(e) => setLogoUrl(e.target.value)}
                        data-testid="input-logo-url"
                      />
                    </div>
                  </div>

                  <div className="grid gap-6 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="primaryColor" className="flex items-center gap-2">
                        <Palette className="w-4 h-4" />
                        Primary Color
                      </Label>
                      <div className="flex gap-2">
                        <Input
                          id="primaryColor"
                          type="color"
                          value={primaryColor}
                          onChange={(e) => setPrimaryColor(e.target.value)}
                          className="w-12 h-10 p-1 cursor-pointer"
                          data-testid="input-primary-color"
                        />
                        <Input
                          value={primaryColor}
                          onChange={(e) => setPrimaryColor(e.target.value)}
                          placeholder="#a855f7"
                          className="flex-1"
                          data-testid="input-primary-color-hex"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="secondaryColor" className="flex items-center gap-2">
                        <Palette className="w-4 h-4" />
                        Secondary Color
                      </Label>
                      <div className="flex gap-2">
                        <Input
                          id="secondaryColor"
                          type="color"
                          value={secondaryColor}
                          onChange={(e) => setSecondaryColor(e.target.value)}
                          className="w-12 h-10 p-1 cursor-pointer"
                          data-testid="input-secondary-color"
                        />
                        <Input
                          value={secondaryColor}
                          onChange={(e) => setSecondaryColor(e.target.value)}
                          placeholder="#ec4899"
                          className="flex-1"
                          data-testid="input-secondary-color-hex"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="introText">Report Introduction Text</Label>
                    <Textarea
                      id="introText"
                      placeholder="Add a custom introduction message for your client reports..."
                      value={introText}
                      onChange={(e) => setIntroText(e.target.value)}
                      rows={3}
                      data-testid="input-intro-text"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="footerText">Report Footer Text</Label>
                    <Textarea
                      id="footerText"
                      placeholder="Add custom footer text for your reports (e.g., disclaimers, contact info)..."
                      value={footerText}
                      onChange={(e) => setFooterText(e.target.value)}
                      rows={2}
                      data-testid="input-footer-text"
                    />
                  </div>

                  <div className="grid gap-6 md:grid-cols-3">
                    <div className="space-y-2">
                      <Label htmlFor="contactEmail">Contact Email</Label>
                      <Input
                        id="contactEmail"
                        type="email"
                        placeholder="contact@youragency.com"
                        value={contactEmail}
                        onChange={(e) => setContactEmail(e.target.value)}
                        data-testid="input-contact-email"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="contactPhone">Contact Phone</Label>
                      <Input
                        id="contactPhone"
                        placeholder="+1 (555) 123-4567"
                        value={contactPhone}
                        onChange={(e) => setContactPhone(e.target.value)}
                        data-testid="input-contact-phone"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="website">Website</Label>
                      <Input
                        id="website"
                        placeholder="https://youragency.com"
                        value={website}
                        onChange={(e) => setWebsite(e.target.value)}
                        data-testid="input-website"
                      />
                    </div>
                  </div>

                  {logoUrl && (
                    <div className="p-4 border rounded-lg bg-muted/30">
                      <Label className="text-sm text-muted-foreground mb-2 block">Logo Preview</Label>
                      <img
                        src={logoUrl}
                        alt="Agency Logo"
                        className="max-h-16 max-w-48 object-contain"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    </div>
                  )}

                  <div className="flex justify-end">
                    <Button
                      onClick={() => saveBrandingMutation.mutate()}
                      disabled={saveBrandingMutation.isPending}
                      className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                      data-testid="button-save-branding"
                    >
                      {saveBrandingMutation.isPending ? (
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      ) : (
                        <Save className="w-4 h-4 mr-2" />
                      )}
                      Save Branding
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
