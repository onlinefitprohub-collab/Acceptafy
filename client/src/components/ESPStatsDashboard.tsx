import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown,
  Mail,
  MousePointerClick,
  AlertTriangle,
  RefreshCw,
  Loader2,
  CheckCircle2,
  XCircle,
  Eye,
  Users,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  Activity
} from 'lucide-react';

interface ESPCampaignStats {
  campaignId: string;
  campaignName: string;
  subject?: string;
  sentAt?: string;
  totalSent: number;
  delivered: number;
  opened: number;
  clicked: number;
  bounced: number;
  unsubscribed: number;
  spamReports: number;
  openRate: number;
  clickRate: number;
  bounceRate: number;
  unsubscribeRate: number;
}

interface ProviderStats {
  provider: string;
  stats: {
    provider: string;
    campaigns: ESPCampaignStats[];
    totals: {
      totalCampaigns: number;
      totalSent: number;
      totalDelivered: number;
      totalOpened: number;
      totalClicked: number;
      avgOpenRate: number;
      avgClickRate: number;
      avgBounceRate: number;
    };
    lastSyncAt: string;
  } | null;
  error: string | null;
}

interface CombinedStats {
  campaigns: ESPCampaignStats[];
  totals: {
    totalCampaigns: number;
    totalSent: number;
    totalDelivered: number;
    totalOpened: number;
    totalClicked: number;
    avgOpenRate: number;
    avgClickRate: number;
    avgBounceRate: number;
  };
}

interface ESPStatsResponse {
  providers: ProviderStats[];
  combinedStats: CombinedStats | null;
}

const ESP_PROVIDER_NAMES: Record<string, string> = {
  sendgrid: 'SendGrid',
  mailchimp: 'Mailchimp',
  activecampaign: 'ActiveCampaign',
  hubspot: 'HubSpot',
  constantcontact: 'Constant Contact',
  convertkit: 'ConvertKit',
  klaviyo: 'Klaviyo',
  drip: 'Drip',
  aweber: 'AWeber',
  highlevel: 'HighLevel',
  ontraport: 'Ontraport',
  keap: 'Keap',
};

const ESP_PROVIDER_COLORS: Record<string, string> = {
  sendgrid: 'from-blue-500 to-cyan-500',
  mailchimp: 'from-yellow-500 to-orange-500',
  activecampaign: 'from-indigo-500 to-purple-500',
  hubspot: 'from-orange-500 to-red-500',
  constantcontact: 'from-blue-600 to-blue-400',
  convertkit: 'from-red-500 to-rose-500',
  klaviyo: 'from-emerald-500 to-green-500',
  drip: 'from-violet-500 to-purple-500',
  aweber: 'from-sky-500 to-blue-500',
  highlevel: 'from-green-500 to-emerald-500',
  ontraport: 'from-rose-500 to-pink-500',
  keap: 'from-teal-500 to-cyan-500',
};

function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
}

function formatDate(dateString?: string): string {
  if (!dateString) return 'Unknown';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric',
    year: 'numeric'
  });
}

function getRateColor(rate: number, type: 'open' | 'click' | 'bounce' | 'unsubscribe'): string {
  if (type === 'bounce' || type === 'unsubscribe') {
    if (rate < 1) return 'text-green-400';
    if (rate < 3) return 'text-yellow-400';
    return 'text-red-400';
  }
  if (type === 'open') {
    if (rate >= 25) return 'text-green-400';
    if (rate >= 15) return 'text-yellow-400';
    return 'text-red-400';
  }
  if (type === 'click') {
    if (rate >= 3) return 'text-green-400';
    if (rate >= 1.5) return 'text-yellow-400';
    return 'text-red-400';
  }
  return 'text-muted-foreground';
}

function StatCard({ 
  title, 
  value, 
  subValue,
  icon: Icon, 
  trend,
  trendValue,
  gradient 
}: { 
  title: string;
  value: string | number;
  subValue?: string;
  icon: React.ElementType;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  gradient: string;
}) {
  return (
    <Card className="border-white/10 bg-gradient-to-br from-white/5 to-transparent" data-testid={`stat-card-${title.toLowerCase().replace(/\s+/g, '-')}`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
            {subValue && <p className="text-xs text-muted-foreground">{subValue}</p>}
          </div>
          <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-lg`}>
            <Icon className="w-5 h-5 text-white" />
          </div>
        </div>
        {trend && trendValue && (
          <div className="mt-3 flex items-center gap-1 text-xs">
            {trend === 'up' ? (
              <ArrowUpRight className="w-3 h-3 text-green-400" />
            ) : trend === 'down' ? (
              <ArrowDownRight className="w-3 h-3 text-red-400" />
            ) : (
              <Activity className="w-3 h-3 text-muted-foreground" />
            )}
            <span className={trend === 'up' ? 'text-green-400' : trend === 'down' ? 'text-red-400' : 'text-muted-foreground'}>
              {trendValue}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function CampaignRow({ campaign, provider }: { campaign: ESPCampaignStats; provider: string }) {
  return (
    <div 
      className="flex flex-col md:flex-row md:items-center gap-3 md:gap-4 p-4 border border-white/10 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
      data-testid={`campaign-row-${campaign.campaignId}`}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <Badge variant="secondary" className="text-xs" data-testid={`badge-provider-${campaign.campaignId}`}>
            {ESP_PROVIDER_NAMES[provider] || provider}
          </Badge>
          <span className="text-xs text-muted-foreground">{formatDate(campaign.sentAt)}</span>
        </div>
        <p className="font-medium truncate" data-testid={`text-campaign-name-${campaign.campaignId}`}>
          {campaign.campaignName}
        </p>
        {campaign.subject && (
          <p className="text-sm text-muted-foreground truncate" data-testid={`text-subject-${campaign.campaignId}`}>
            {campaign.subject}
          </p>
        )}
      </div>
      
      <div className="flex flex-wrap gap-4 md:gap-6 text-sm">
        <div className="flex items-center gap-1.5" data-testid={`metric-sent-${campaign.campaignId}`}>
          <Mail className="w-4 h-4 text-muted-foreground" />
          <span className="font-medium">{formatNumber(campaign.totalSent)}</span>
          <span className="text-muted-foreground text-xs">sent</span>
        </div>
        <div className="flex items-center gap-1.5" data-testid={`metric-open-rate-${campaign.campaignId}`}>
          <Eye className="w-4 h-4 text-muted-foreground" />
          <span className={`font-medium ${getRateColor(campaign.openRate, 'open')}`}>
            {campaign.openRate.toFixed(1)}%
          </span>
          <span className="text-muted-foreground text-xs">opens</span>
        </div>
        <div className="flex items-center gap-1.5" data-testid={`metric-click-rate-${campaign.campaignId}`}>
          <MousePointerClick className="w-4 h-4 text-muted-foreground" />
          <span className={`font-medium ${getRateColor(campaign.clickRate, 'click')}`}>
            {campaign.clickRate.toFixed(1)}%
          </span>
          <span className="text-muted-foreground text-xs">clicks</span>
        </div>
        <div className="flex items-center gap-1.5" data-testid={`metric-bounce-rate-${campaign.campaignId}`}>
          <AlertTriangle className="w-4 h-4 text-muted-foreground" />
          <span className={`font-medium ${getRateColor(campaign.bounceRate, 'bounce')}`}>
            {campaign.bounceRate.toFixed(1)}%
          </span>
          <span className="text-muted-foreground text-xs">bounces</span>
        </div>
      </div>
    </div>
  );
}

export function ESPStatsDashboard() {
  const { toast } = useToast();
  const [stats, setStats] = useState<ESPStatsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async (showRefreshToast = false) => {
    if (showRefreshToast) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    setError(null);

    try {
      const response = await fetch('/api/esp/stats?limit=20');
      if (!response.ok) {
        throw new Error('Failed to fetch stats');
      }
      const data = await response.json();
      setStats(data);
      
      if (showRefreshToast) {
        toast({
          title: "Stats Refreshed",
          description: "Campaign statistics have been updated.",
        });
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load statistics');
      toast({
        title: "Error",
        description: "Failed to fetch campaign statistics",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-6" data-testid="stats-loading">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-96" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            Campaign Statistics
          </h2>
          <p className="text-muted-foreground">
            View performance metrics from your connected email service providers.
          </p>
        </div>
        <Card className="border-red-500/30 bg-red-500/5" data-testid="stats-error">
          <CardContent className="py-8 text-center">
            <XCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <p className="text-red-400 font-medium mb-2">Failed to load statistics</p>
            <p className="text-sm text-muted-foreground mb-4">{error}</p>
            <Button onClick={() => fetchStats()} variant="outline" data-testid="button-retry">
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const hasNoProviders = stats.providers.length === 0;
  const hasNoData = !stats.combinedStats || stats.combinedStats.campaigns.length === 0;

  if (hasNoProviders) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            Campaign Statistics
          </h2>
          <p className="text-muted-foreground">
            View performance metrics from your connected email service providers.
          </p>
        </div>
        <Card className="border-dashed border-muted-foreground/30 bg-muted/5" data-testid="stats-no-providers">
          <CardContent className="py-12 text-center">
            <BarChart3 className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-semibold mb-2">No ESP Connected</h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto mb-4">
              Connect an email service provider to start viewing your campaign statistics and get AI-powered insights.
            </p>
            <p className="text-xs text-muted-foreground">
              Go to ESP Settings to connect your first provider.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const totals = stats.combinedStats?.totals;
  const allCampaigns: Array<{ campaign: ESPCampaignStats; provider: string }> = [];
  
  stats.providers.forEach(p => {
    if (p.stats?.campaigns) {
      p.stats.campaigns.forEach(campaign => {
        allCampaigns.push({ campaign, provider: p.provider });
      });
    }
  });

  allCampaigns.sort((a, b) => {
    const dateA = a.campaign.sentAt ? new Date(a.campaign.sentAt).getTime() : 0;
    const dateB = b.campaign.sentAt ? new Date(b.campaign.sentAt).getTime() : 0;
    return dateB - dateA;
  });

  return (
    <div className="space-y-6" data-testid="stats-dashboard">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-2">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            Campaign Statistics
          </h2>
          <p className="text-muted-foreground">
            Performance metrics from {stats.providers.filter(p => p.stats !== null).length} connected provider{stats.providers.filter(p => p.stats !== null).length !== 1 ? 's' : ''}.
          </p>
        </div>
        <Button 
          onClick={() => fetchStats(true)} 
          disabled={isRefreshing}
          variant="outline"
          className="gap-2"
          data-testid="button-refresh-stats"
        >
          {isRefreshing ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4" />
          )}
          Refresh Stats
        </Button>
      </div>

      {stats.providers.some(p => p.error) && (
        <Card className="border-yellow-500/30 bg-yellow-500/5" data-testid="stats-partial-error">
          <CardContent className="py-3 flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-400" />
            <p className="text-sm text-yellow-400">
              Some providers returned errors: {stats.providers.filter(p => p.error).map(p => ESP_PROVIDER_NAMES[p.provider] || p.provider).join(', ')}
            </p>
          </CardContent>
        </Card>
      )}

      {hasNoData ? (
        <Card className="border-dashed border-muted-foreground/30 bg-muted/5" data-testid="stats-no-data">
          <CardContent className="py-12 text-center">
            <Mail className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-semibold mb-2">No Campaign Data Yet</h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              Your connected providers don't have any campaign statistics to display. Send some campaigns to see your performance metrics here.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Total Sent"
              value={formatNumber(totals?.totalSent || 0)}
              subValue={`${totals?.totalCampaigns || 0} campaigns`}
              icon={Mail}
              gradient="from-purple-500 to-pink-500"
            />
            <StatCard
              title="Avg Open Rate"
              value={`${(totals?.avgOpenRate || 0).toFixed(1)}%`}
              subValue={`${formatNumber(totals?.totalOpened || 0)} opens`}
              icon={Eye}
              trend={totals?.avgOpenRate && totals.avgOpenRate >= 20 ? 'up' : totals?.avgOpenRate && totals.avgOpenRate >= 15 ? 'neutral' : 'down'}
              trendValue={totals?.avgOpenRate && totals.avgOpenRate >= 20 ? 'Above average' : totals?.avgOpenRate && totals.avgOpenRate >= 15 ? 'Average' : 'Below average'}
              gradient="from-blue-500 to-cyan-500"
            />
            <StatCard
              title="Avg Click Rate"
              value={`${(totals?.avgClickRate || 0).toFixed(1)}%`}
              subValue={`${formatNumber(totals?.totalClicked || 0)} clicks`}
              icon={MousePointerClick}
              trend={totals?.avgClickRate && totals.avgClickRate >= 2.5 ? 'up' : totals?.avgClickRate && totals.avgClickRate >= 1.5 ? 'neutral' : 'down'}
              trendValue={totals?.avgClickRate && totals.avgClickRate >= 2.5 ? 'Above average' : totals?.avgClickRate && totals.avgClickRate >= 1.5 ? 'Average' : 'Below average'}
              gradient="from-emerald-500 to-green-500"
            />
            <StatCard
              title="Avg Bounce Rate"
              value={`${(totals?.avgBounceRate || 0).toFixed(1)}%`}
              subValue="Lower is better"
              icon={AlertTriangle}
              trend={totals?.avgBounceRate && totals.avgBounceRate < 1 ? 'up' : totals?.avgBounceRate && totals.avgBounceRate < 3 ? 'neutral' : 'down'}
              trendValue={totals?.avgBounceRate && totals.avgBounceRate < 1 ? 'Excellent' : totals?.avgBounceRate && totals.avgBounceRate < 3 ? 'Acceptable' : 'Needs attention'}
              gradient="from-orange-500 to-red-500"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {stats.providers.filter(p => p.stats !== null).map(providerStats => (
              <Card 
                key={providerStats.provider} 
                className={`border-white/10 bg-gradient-to-br from-white/5 to-transparent overflow-hidden`}
                data-testid={`provider-card-${providerStats.provider}`}
              >
                <div className={`h-1 w-full bg-gradient-to-r ${ESP_PROVIDER_COLORS[providerStats.provider] || 'from-gray-500 to-gray-400'}`} />
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center justify-between gap-2">
                    <span>{ESP_PROVIDER_NAMES[providerStats.provider] || providerStats.provider}</span>
                    <Badge variant="secondary" className="text-xs" data-testid={`badge-campaigns-${providerStats.provider}`}>
                      {providerStats.stats?.campaigns.length || 0} campaigns
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-muted-foreground text-xs">Sent</p>
                      <p className="font-medium">{formatNumber(providerStats.stats?.totals.totalSent || 0)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs">Delivered</p>
                      <p className="font-medium">{formatNumber(providerStats.stats?.totals.totalDelivered || 0)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs">Open Rate</p>
                      <p className={`font-medium ${getRateColor(providerStats.stats?.totals.avgOpenRate || 0, 'open')}`}>
                        {(providerStats.stats?.totals.avgOpenRate || 0).toFixed(1)}%
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs">Click Rate</p>
                      <p className={`font-medium ${getRateColor(providerStats.stats?.totals.avgClickRate || 0, 'click')}`}>
                        {(providerStats.stats?.totals.avgClickRate || 0).toFixed(1)}%
                      </p>
                    </div>
                  </div>
                  {providerStats.stats?.lastSyncAt && (
                    <p className="text-xs text-muted-foreground" data-testid={`text-last-sync-${providerStats.provider}`}>
                      Last synced: {formatDate(providerStats.stats.lastSyncAt)}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="border-white/10" data-testid="campaigns-list">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-purple-400" />
                Recent Campaigns
              </CardTitle>
              <CardDescription>
                Performance breakdown for your {allCampaigns.length} most recent campaigns
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {allCampaigns.slice(0, 10).map(({ campaign, provider }) => (
                <CampaignRow 
                  key={`${provider}-${campaign.campaignId}`} 
                  campaign={campaign} 
                  provider={provider} 
                />
              ))}
              {allCampaigns.length === 0 && (
                <div className="text-center py-8 text-muted-foreground" data-testid="no-campaigns">
                  <Mail className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No campaign data available</p>
                </div>
              )}
              {allCampaigns.length > 10 && (
                <p className="text-center text-sm text-muted-foreground pt-2">
                  Showing 10 of {allCampaigns.length} campaigns
                </p>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
