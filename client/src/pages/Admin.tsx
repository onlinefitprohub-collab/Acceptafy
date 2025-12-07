import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Users, 
  CreditCard, 
  TrendingUp, 
  Mail,
  Loader2,
  Crown,
  Calendar,
  Activity,
  Clock,
  DollarSign,
  AlertTriangle,
  UserCheck,
  FileText,
  AlertCircle,
  BarChart3
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { format } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from "recharts";

interface AdminUser {
  id: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  profileImageUrl: string | null;
  subscriptionTier: string | null;
  subscriptionStatus: string | null;
  role: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  totalGrades: number;
  totalRewrites: number;
  totalFollowups: number;
  lastActiveDate: string | null;
}

interface AdminStats {
  totalUsers: number;
  activeSubscriptions: number;
  tierBreakdown: { tier: string; count: number }[];
  totalGrades: number;
  recentSignups: number;
}

interface AdminCheckResponse {
  isAdmin: boolean;
}

interface BusinessMetrics {
  mrr: number;
  userGrowth: { date: string; count: number }[];
  churnRate: number;
  subscriptionBreakdown: { tier: string; count: number; revenue: number }[];
  activeUsers30d: number;
}

interface ContentAnalytics {
  topSubjectLines: { subject: string; score: number; grade: string }[];
  commonSpamTriggers: { word: string; count: number }[];
  gradeDistribution: { grade: string; count: number }[];
  scoreDistribution: { range: string; count: number }[];
}

interface FeatureAdoption {
  featureUsage: { feature: string; count: number; percentage: number }[];
  usageTrends: { date: string; grades: number; rewrites: number; followups: number; deliverability: number }[];
  totalUsage: number;
}

const TIER_COLORS: Record<string, string> = {
  'scale': '#8b5cf6',
  'pro': '#06b6d4',
  'starter': '#64748b',
};

const GRADE_COLORS: Record<string, string> = {
  'A': '#22c55e',
  'B': '#84cc16',
  'C': '#eab308',
  'D': '#f97316',
  'F': '#ef4444',
};

export default function Admin() {
  const { user, isLoading: authLoading } = useAuth();

  const { data: adminCheck, isLoading: adminCheckLoading, isSuccess: adminCheckSuccess } = useQuery<AdminCheckResponse>({
    queryKey: ["/api/admin/check"],
    enabled: !!user,
  });

  const isAdmin = adminCheckSuccess && adminCheck?.isAdmin === true;

  const { data: users, isLoading: usersLoading } = useQuery<AdminUser[]>({
    queryKey: ["/api/admin/users"],
    enabled: isAdmin,
  });

  const { data: stats, isLoading: statsLoading } = useQuery<AdminStats>({
    queryKey: ["/api/admin/stats"],
    enabled: isAdmin,
  });

  const { data: metrics, isLoading: metricsLoading } = useQuery<BusinessMetrics>({
    queryKey: ["/api/admin/metrics"],
    enabled: isAdmin,
  });

  const { data: contentAnalytics, isLoading: contentAnalyticsLoading } = useQuery<ContentAnalytics>({
    queryKey: ["/api/admin/content-analytics"],
    enabled: isAdmin,
  });

  const { data: featureAdoption, isLoading: featureAdoptionLoading } = useQuery<FeatureAdoption>({
    queryKey: ["/api/admin/feature-adoption"],
    enabled: isAdmin,
  });

  if (authLoading || adminCheckLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" data-testid="admin-loading">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user || !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center" data-testid="admin-forbidden">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="text-destructive">Access Denied</CardTitle>
            <CardDescription>
              You do not have permission to view this page.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const getTierBadgeVariant = (tier: string | null) => {
    switch (tier) {
      case 'scale': return 'default';
      case 'pro': return 'secondary';
      default: return 'outline';
    }
  };

  const getStatusBadgeVariant = (status: string | null) => {
    switch (status) {
      case 'active': return 'default';
      case 'canceled': return 'destructive';
      case 'past_due': return 'destructive';
      default: return 'outline';
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'N/A';
    try {
      return format(new Date(dateStr), 'MMM d, yyyy');
    } catch {
      return 'N/A';
    }
  };

  const formatLastActive = (dateStr: string | null) => {
    if (!dateStr) return 'Never';
    try {
      return format(new Date(dateStr), 'MMM d');
    } catch {
      return 'Never';
    }
  };

  const getUserInitials = (u: AdminUser) => {
    if (u.firstName && u.lastName) {
      return `${u.firstName[0]}${u.lastName[0]}`.toUpperCase();
    }
    if (u.email) {
      return u.email[0].toUpperCase();
    }
    return '?';
  };

  return (
    <div className="min-h-screen p-6 lg:p-8 space-y-8" data-testid="admin-dashboard">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
          Admin Dashboard
        </h1>
        <p className="text-muted-foreground">
          Manage users and monitor platform activity
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card data-testid="stat-total-users">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : (
              <div className="text-2xl font-bold">{stats?.totalUsers || 0}</div>
            )}
          </CardContent>
        </Card>

        <Card data-testid="stat-active-subs">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Subscriptions</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : (
              <div className="text-2xl font-bold">{stats?.activeSubscriptions || 0}</div>
            )}
          </CardContent>
        </Card>

        <Card data-testid="stat-total-grades">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Grades</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : (
              <div className="text-2xl font-bold">{stats?.totalGrades || 0}</div>
            )}
          </CardContent>
        </Card>

        <Card data-testid="stat-recent-signups">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recent Signups (7d)</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : (
              <div className="text-2xl font-bold">{stats?.recentSignups || 0}</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Business Metrics Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card data-testid="stat-mrr">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Recurring Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {metricsLoading ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : (
              <div className="text-2xl font-bold text-green-500">
                ${metrics?.mrr?.toLocaleString() || 0}
              </div>
            )}
          </CardContent>
        </Card>

        <Card data-testid="stat-churn">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Churn Rate</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {metricsLoading ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : (
              <div className={`text-2xl font-bold ${(metrics?.churnRate || 0) > 5 ? 'text-red-500' : 'text-green-500'}`}>
                {metrics?.churnRate || 0}%
              </div>
            )}
          </CardContent>
        </Card>

        <Card data-testid="stat-active-30d">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users (30d)</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {metricsLoading ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : (
              <div className="text-2xl font-bold">{metrics?.activeUsers30d || 0}</div>
            )}
          </CardContent>
        </Card>

        <Card data-testid="stat-paid-users">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Paid Users</CardTitle>
            <Crown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {metricsLoading ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : (
              <div className="text-2xl font-bold">
                {metrics?.subscriptionBreakdown?.filter(s => s.tier !== 'starter').reduce((acc, s) => acc + s.count, 0) || 0}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card data-testid="user-growth-chart">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              User Growth (12 Weeks)
            </CardTitle>
            <CardDescription>
              New user signups per week
            </CardDescription>
          </CardHeader>
          <CardContent>
            {metricsLoading || !metrics ? (
              <div className="flex items-center justify-center h-[250px]">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : metrics.userGrowth && metrics.userGrowth.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={metrics.userGrowth}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                    tickFormatter={(value) => {
                      const date = new Date(value);
                      return `${date.getMonth() + 1}/${date.getDate()}`;
                    }}
                  />
                  <YAxis 
                    tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                    allowDecimals={false}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '6px'
                    }}
                    labelFormatter={(value) => format(new Date(value), 'MMM d, yyyy')}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="count" 
                    stroke="#8b5cf6" 
                    fill="url(#colorGradient)" 
                    strokeWidth={2}
                    name="New Users"
                  />
                  <defs>
                    <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[250px] text-muted-foreground">
                No user growth data available
              </div>
            )}
          </CardContent>
        </Card>

        <Card data-testid="subscription-breakdown-chart">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Subscription Breakdown
            </CardTitle>
            <CardDescription>
              Revenue and users by tier
            </CardDescription>
          </CardHeader>
          <CardContent>
            {metricsLoading || !metrics ? (
              <div className="flex items-center justify-center h-[250px]">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : metrics.subscriptionBreakdown && metrics.subscriptionBreakdown.length > 0 && metrics.subscriptionBreakdown.some(s => s.count > 0) ? (
              <div className="flex gap-4">
                <ResponsiveContainer width="50%" height={250}>
                  <PieChart>
                    <Pie
                      data={metrics.subscriptionBreakdown}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      dataKey="count"
                      nameKey="tier"
                      label={({ tier, percent }) => `${tier} (${(percent * 100).toFixed(0)}%)`}
                      labelLine={false}
                    >
                      {metrics.subscriptionBreakdown.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={TIER_COLORS[entry.tier] || '#64748b'}
                        />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '6px'
                      }}
                      formatter={(value: number, name: string) => [`${value} users`, name]}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="w-1/2 flex flex-col justify-center space-y-3">
                  {metrics.subscriptionBreakdown.map((item) => (
                    <div key={item.tier} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: TIER_COLORS[item.tier] || '#64748b' }}
                        />
                        <span className="text-sm font-medium capitalize">{item.tier}</span>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium">{item.count} users</div>
                        <div className="text-xs text-muted-foreground">${item.revenue}/mo</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-[250px] text-muted-foreground">
                No subscription data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <Card className="lg:col-span-3" data-testid="users-table-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              All Users
            </CardTitle>
            <CardDescription>
              Complete list of registered users with subscription and usage details
            </CardDescription>
          </CardHeader>
          <CardContent>
            {usersLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <ScrollArea className="h-[500px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Tier</TableHead>
                      <TableHead>Usage</TableHead>
                      <TableHead>Last Active</TableHead>
                      <TableHead>Joined</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users?.map((u) => (
                      <TableRow key={u.id} data-testid={`user-row-${u.id}`}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={u.profileImageUrl || undefined} />
                              <AvatarFallback className="text-xs">
                                {getUserInitials(u)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium flex items-center gap-2">
                                {u.firstName && u.lastName 
                                  ? `${u.firstName} ${u.lastName}` 
                                  : u.email || 'Unknown'}
                                {u.role === 'admin' && (
                                  <Badge variant="default" className="bg-purple-600 text-xs">
                                    Admin
                                  </Badge>
                                )}
                              </div>
                              {u.email && (
                                <div className="text-xs text-muted-foreground">
                                  {u.email}
                                </div>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            <Badge variant={getTierBadgeVariant(u.subscriptionTier)}>
                              {u.subscriptionTier === 'scale' && <Crown className="h-3 w-3 mr-1" />}
                              {u.subscriptionTier || 'starter'}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {u.subscriptionStatus || 'free'}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm space-y-1">
                            <div className="flex items-center gap-1">
                              <Mail className="h-3 w-3 text-muted-foreground" />
                              <span>{u.totalGrades || 0} grades</span>
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {u.totalRewrites || 0} rewrites, {u.totalFollowups || 0} followups
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatLastActive(u.lastActiveDate)}
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatDate(u.createdAt)}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {(!users || users.length === 0) && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                          No users found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </ScrollArea>
            )}
          </CardContent>
        </Card>

        <Card data-testid="tier-breakdown-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Tier Breakdown
            </CardTitle>
            <CardDescription>
              Users by subscription tier
            </CardDescription>
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="space-y-4">
                {stats?.tierBreakdown?.map((item) => {
                  const percentage = stats.totalUsers > 0 
                    ? Math.round((item.count / stats.totalUsers) * 100) 
                    : 0;
                  return (
                    <div key={item.tier} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium capitalize">{item.tier}</span>
                        <span className="text-muted-foreground">
                          {item.count} ({percentage}%)
                        </span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
                {(!stats?.tierBreakdown || stats.tierBreakdown.length === 0) && (
                  <p className="text-muted-foreground text-sm text-center py-4">
                    No tier data available
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Content Intelligence Analytics Section */}
      <div className="space-y-2">
        <h2 className="text-2xl font-bold">Content Intelligence</h2>
        <p className="text-muted-foreground">
          Insights from analyzed emails across the platform
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card data-testid="grade-distribution-chart">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Grade Distribution
            </CardTitle>
            <CardDescription>
              Distribution of email grades across all analyses
            </CardDescription>
          </CardHeader>
          <CardContent>
            {contentAnalyticsLoading || !contentAnalytics ? (
              <div className="flex items-center justify-center h-[250px]">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : contentAnalytics.gradeDistribution && contentAnalytics.gradeDistribution.some(g => g.count > 0) ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={contentAnalytics.gradeDistribution}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="grade" 
                    tick={{ fontSize: 14, fill: 'hsl(var(--muted-foreground))' }}
                  />
                  <YAxis 
                    tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                    allowDecimals={false}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '6px'
                    }}
                    formatter={(value: number) => [`${value} emails`, 'Count']}
                  />
                  <Bar dataKey="count" name="Emails">
                    {contentAnalytics.gradeDistribution.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={GRADE_COLORS[entry.grade] || '#64748b'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[250px] text-muted-foreground">
                No grade data available
              </div>
            )}
          </CardContent>
        </Card>

        <Card data-testid="score-distribution-chart">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Score Distribution
            </CardTitle>
            <CardDescription>
              Email scores grouped by range
            </CardDescription>
          </CardHeader>
          <CardContent>
            {contentAnalyticsLoading || !contentAnalytics ? (
              <div className="flex items-center justify-center h-[250px]">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : contentAnalytics.scoreDistribution && contentAnalytics.scoreDistribution.some(s => s.count > 0) ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={contentAnalytics.scoreDistribution}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="range" 
                    tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                  />
                  <YAxis 
                    tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                    allowDecimals={false}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '6px'
                    }}
                    formatter={(value: number) => [`${value} emails`, 'Count']}
                  />
                  <Bar dataKey="count" fill="#8b5cf6" name="Emails" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[250px] text-muted-foreground">
                No score data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card data-testid="top-subject-lines-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Top Performing Subject Lines
            </CardTitle>
            <CardDescription>
              Highest scoring subject lines analyzed
            </CardDescription>
          </CardHeader>
          <CardContent>
            {contentAnalyticsLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : contentAnalytics?.topSubjectLines && contentAnalytics.topSubjectLines.length > 0 ? (
              <ScrollArea className="h-[300px]">
                <div className="space-y-3">
                  {contentAnalytics.topSubjectLines.map((item, index) => (
                    <div 
                      key={index} 
                      className="flex items-start justify-between gap-4 p-3 rounded-lg bg-muted/50"
                      data-testid={`subject-line-${index}`}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{item.subject}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Badge 
                          variant="outline"
                          style={{ 
                            borderColor: GRADE_COLORS[item.grade.charAt(0)] || '#64748b',
                            color: GRADE_COLORS[item.grade.charAt(0)] || '#64748b'
                          }}
                        >
                          {item.grade}
                        </Badge>
                        <span className="text-sm font-medium">{item.score}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            ) : (
              <div className="flex items-center justify-center py-8 text-muted-foreground">
                No subject line data available
              </div>
            )}
          </CardContent>
        </Card>

        <Card data-testid="common-spam-triggers-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Common Spam Triggers
            </CardTitle>
            <CardDescription>
              Most frequently detected spam trigger words
            </CardDescription>
          </CardHeader>
          <CardContent>
            {contentAnalyticsLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : contentAnalytics?.commonSpamTriggers && contentAnalytics.commonSpamTriggers.length > 0 ? (
              <ScrollArea className="h-[300px]">
                <div className="space-y-2">
                  {contentAnalytics.commonSpamTriggers.map((item, index) => {
                    const maxCount = contentAnalytics.commonSpamTriggers[0]?.count || 1;
                    const percentage = Math.round((item.count / maxCount) * 100);
                    return (
                      <div 
                        key={index} 
                        className="space-y-1"
                        data-testid={`spam-trigger-${index}`}
                      >
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium">{item.word}</span>
                          <span className="text-muted-foreground">{item.count} occurrences</span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-orange-500 to-red-500 transition-all"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            ) : (
              <div className="flex items-center justify-center py-8 text-muted-foreground">
                No spam trigger data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Feature Adoption Section */}
      <div className="space-y-2">
        <h2 className="text-2xl font-bold">Feature Adoption</h2>
        <p className="text-muted-foreground">
          Track which features are used most and usage trends over time
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card data-testid="feature-usage-chart">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Feature Usage
            </CardTitle>
            <CardDescription>
              Total usage by feature ({featureAdoption?.totalUsage?.toLocaleString() || 0} total actions)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {featureAdoptionLoading || !featureAdoption ? (
              <div className="flex items-center justify-center h-[250px]">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : featureAdoption.featureUsage && featureAdoption.featureUsage.some(f => f.count > 0) ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={featureAdoption.featureUsage} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    type="number"
                    tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                  />
                  <YAxis 
                    type="category"
                    dataKey="feature"
                    tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                    width={100}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '6px'
                    }}
                    formatter={(value: number, name: string, props: any) => [
                      `${value.toLocaleString()} (${props.payload.percentage}%)`,
                      'Usage'
                    ]}
                  />
                  <Bar dataKey="count" fill="#8b5cf6" name="Usage" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[250px] text-muted-foreground">
                No feature usage data available
              </div>
            )}
          </CardContent>
        </Card>

        <Card data-testid="usage-trends-chart">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Usage Trends (12 Weeks)
            </CardTitle>
            <CardDescription>
              Feature usage over time
            </CardDescription>
          </CardHeader>
          <CardContent>
            {featureAdoptionLoading || !featureAdoption ? (
              <div className="flex items-center justify-center h-[250px]">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : featureAdoption.usageTrends && featureAdoption.usageTrends.some(t => t.grades > 0 || t.rewrites > 0 || t.followups > 0 || t.deliverability > 0) ? (
              <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={featureAdoption.usageTrends}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                    tickFormatter={(value) => {
                      const date = new Date(value);
                      return `${date.getMonth() + 1}/${date.getDate()}`;
                    }}
                  />
                  <YAxis 
                    tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                    allowDecimals={false}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '6px'
                    }}
                    labelFormatter={(value) => format(new Date(value), 'MMM d, yyyy')}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="grades" 
                    stackId="1"
                    stroke="#8b5cf6" 
                    fill="#8b5cf6" 
                    fillOpacity={0.6}
                    name="Grades"
                  />
                  <Area 
                    type="monotone" 
                    dataKey="rewrites" 
                    stackId="1"
                    stroke="#06b6d4" 
                    fill="#06b6d4" 
                    fillOpacity={0.6}
                    name="Rewrites"
                  />
                  <Area 
                    type="monotone" 
                    dataKey="followups" 
                    stackId="1"
                    stroke="#22c55e" 
                    fill="#22c55e" 
                    fillOpacity={0.6}
                    name="Follow-ups"
                  />
                  <Area 
                    type="monotone" 
                    dataKey="deliverability" 
                    stackId="1"
                    stroke="#f59e0b" 
                    fill="#f59e0b" 
                    fillOpacity={0.6}
                    name="Deliverability"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[250px] text-muted-foreground">
                No usage trend data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Feature Adoption Summary */}
      <Card data-testid="feature-summary-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Feature Breakdown
          </CardTitle>
          <CardDescription>
            Usage distribution across all features
          </CardDescription>
        </CardHeader>
        <CardContent>
          {featureAdoptionLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : featureAdoption?.featureUsage && featureAdoption.featureUsage.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {featureAdoption.featureUsage.map((feature, index) => {
                const colors = ['#8b5cf6', '#06b6d4', '#22c55e', '#f59e0b'];
                return (
                  <div 
                    key={feature.feature} 
                    className="p-4 rounded-lg bg-muted/50 space-y-2"
                    data-testid={`feature-stat-${index}`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{feature.feature}</span>
                      <Badge variant="outline" style={{ borderColor: colors[index] || '#64748b', color: colors[index] || '#64748b' }}>
                        {feature.percentage}%
                      </Badge>
                    </div>
                    <div className="text-2xl font-bold">{feature.count.toLocaleString()}</div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full transition-all"
                        style={{ 
                          width: `${feature.percentage}%`,
                          backgroundColor: colors[index] || '#64748b'
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex items-center justify-center py-8 text-muted-foreground">
              No feature data available
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
