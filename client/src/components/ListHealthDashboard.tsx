import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Users,
  TrendingUp,
  TrendingDown,
  Minus,
  Activity,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Loader2,
  Heart,
  UserMinus,
  UserPlus,
  Mail,
  MousePointer,
  ChevronRight,
} from 'lucide-react';
import { queryClient } from '@/lib/queryClient';

interface ListHealthData {
  listId: string;
  listName: string;
  totalSubscribers: number;
  activeSubscribers?: number;
  unsubscribedCount?: number;
  bouncedCount?: number;
  complaintsCount?: number;
  avgOpenRate?: number;
  avgClickRate?: number;
  lastCampaignSent?: string;
  healthScore: number;
  healthTrend: 'improving' | 'stable' | 'declining';
  engagementTier: 'high' | 'medium' | 'low';
  growthRate: number;
}

interface ListHealthSummary {
  totalSubscribers: number;
  activeSubscribers: number;
  unsubscribedTotal: number;
  bouncedTotal: number;
  complaintsTotal: number;
  avgHealthScore: number;
  avgOpenRate: number;
  avgClickRate: number;
  overallEngagementTier: 'high' | 'medium' | 'low';
  listCount: number;
}

interface ListHealthDashboardData {
  provider: string;
  lists: ListHealthData[];
  summary: ListHealthSummary;
  lastUpdated: string | null;
}

interface ESPConnection {
  provider: string;
  accountName?: string;
  isConnected: boolean;
}

interface ListHealthDashboardProps {
  connections: ESPConnection[];
}

function getHealthScoreColor(score: number): string {
  if (score >= 80) return 'text-green-500';
  if (score >= 60) return 'text-yellow-500';
  if (score >= 40) return 'text-orange-500';
  return 'text-red-500';
}

function getHealthScoreBg(score: number): string {
  if (score >= 80) return 'bg-green-500/10';
  if (score >= 60) return 'bg-yellow-500/10';
  if (score >= 40) return 'bg-orange-500/10';
  return 'bg-red-500/10';
}

function getEngagementBadgeVariant(tier: 'high' | 'medium' | 'low'): 'default' | 'secondary' | 'destructive' {
  switch (tier) {
    case 'high': return 'default';
    case 'medium': return 'secondary';
    case 'low': return 'destructive';
  }
}

function TrendIcon({ trend }: { trend: 'improving' | 'stable' | 'declining' }) {
  switch (trend) {
    case 'improving':
      return <TrendingUp className="h-4 w-4 text-green-500" />;
    case 'declining':
      return <TrendingDown className="h-4 w-4 text-red-500" />;
    default:
      return <Minus className="h-4 w-4 text-muted-foreground" />;
  }
}

function formatNumber(num: number): string {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toLocaleString();
}

export function ListHealthDashboard({ connections }: ListHealthDashboardProps) {
  const [selectedProvider, setSelectedProvider] = useState<string>(
    connections.find(c => c.isConnected)?.provider || ''
  );

  const connectedProviders = connections.filter(c => c.isConnected);

  const { data: dashboardData, isLoading, isFetching, refetch } = useQuery<ListHealthDashboardData>({
    queryKey: ['/api/list-health', selectedProvider],
    enabled: !!selectedProvider,
  });

  if (connectedProviders.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Connect an ESP to view list health data</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Select value={selectedProvider} onValueChange={setSelectedProvider}>
            <SelectTrigger className="w-[200px]" data-testid="select-list-provider">
              <SelectValue placeholder="Select provider" />
            </SelectTrigger>
            <SelectContent>
              {connectedProviders.map((conn) => (
                <SelectItem key={conn.provider} value={conn.provider}>
                  {conn.provider.charAt(0).toUpperCase() + conn.provider.slice(1)}
                  {conn.accountName && ` - ${conn.accountName}`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            queryClient.invalidateQueries({ queryKey: ['/api/list-health', selectedProvider] });
            refetch();
          }}
          disabled={isFetching}
          data-testid="button-refresh-list-health"
        >
          {isFetching ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
          <span className="ml-2">Refresh</span>
        </Button>
      </div>

      {isLoading ? (
        <ListHealthSkeleton />
      ) : dashboardData ? (
        <>
          <SummaryCards summary={dashboardData.summary} />
          <ListsTable lists={dashboardData.lists} />
        </>
      ) : (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-muted-foreground">
              <AlertTriangle className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No list health data available for this provider</p>
              <p className="text-sm mt-2">This ESP may not support list health metrics</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function SummaryCards({ summary }: { summary: ListHealthSummary }) {
  const bouncedPct = summary.totalSubscribers > 0 
    ? (summary.bouncedTotal / summary.totalSubscribers * 100).toFixed(2)
    : '0';
  const unsubPct = summary.totalSubscribers > 0
    ? (summary.unsubscribedTotal / summary.totalSubscribers * 100).toFixed(2)
    : '0';

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Subscribers</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold" data-testid="text-total-subscribers">
            {formatNumber(summary.totalSubscribers)}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Across {summary.listCount} list{summary.listCount !== 1 ? 's' : ''}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Health Score</CardTitle>
          <Heart className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <span className={`text-2xl font-bold ${getHealthScoreColor(summary.avgHealthScore)}`} data-testid="text-health-score">
              {summary.avgHealthScore}
            </span>
            <span className="text-lg text-muted-foreground">/100</span>
          </div>
          <Progress 
            value={summary.avgHealthScore} 
            className="mt-2 h-2" 
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Engagement</CardTitle>
          <Activity className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 mb-2">
            <Badge variant={getEngagementBadgeVariant(summary.overallEngagementTier)} data-testid="badge-engagement-tier">
              {summary.overallEngagementTier.charAt(0).toUpperCase() + summary.overallEngagementTier.slice(1)}
            </Badge>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <Tooltip>
              <TooltipTrigger className="flex items-center gap-1">
                <Mail className="h-3 w-3" />
                <span>{summary.avgOpenRate.toFixed(1)}%</span>
              </TooltipTrigger>
              <TooltipContent>Average Open Rate</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger className="flex items-center gap-1">
                <MousePointer className="h-3 w-3" />
                <span>{summary.avgClickRate.toFixed(1)}%</span>
              </TooltipTrigger>
              <TooltipContent>Average Click Rate</TooltipContent>
            </Tooltip>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">List Hygiene</CardTitle>
          <UserMinus className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Bounced</span>
              <span data-testid="text-bounced-pct">{bouncedPct}%</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Unsubscribed</span>
              <span data-testid="text-unsub-pct">{unsubPct}%</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Complaints</span>
              <span data-testid="text-complaints-count">{formatNumber(summary.complaintsTotal)}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function ListsTable({ lists }: { lists: ListHealthData[] }) {
  if (lists.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Lists Overview
        </CardTitle>
        <CardDescription>
          Individual list performance and health metrics
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {lists.map((list) => (
            <ListRow key={list.listId} list={list} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function ListRow({ list }: { list: ListHealthData }) {
  return (
    <div 
      className="flex items-center justify-between p-4 rounded-lg border bg-card hover-elevate"
      data-testid={`list-row-${list.listId}`}
    >
      <div className="flex items-center gap-4 min-w-0 flex-1">
        <div className={`h-10 w-10 rounded-full flex items-center justify-center ${getHealthScoreBg(list.healthScore)}`}>
          <span className={`text-sm font-bold ${getHealthScoreColor(list.healthScore)}`}>
            {list.healthScore}
          </span>
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="font-medium truncate">{list.listName}</h4>
            <TrendIcon trend={list.healthTrend} />
          </div>
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <span>{formatNumber(list.totalSubscribers)} subscribers</span>
            {list.growthRate !== 0 && (
              <span className={list.growthRate > 0 ? 'text-green-500' : 'text-red-500'}>
                {list.growthRate > 0 ? '+' : ''}{list.growthRate}%
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-6">
        <div className="text-center hidden sm:block">
          <div className="text-sm font-medium">{list.avgOpenRate?.toFixed(1) || 0}%</div>
          <div className="text-xs text-muted-foreground">Open Rate</div>
        </div>
        <div className="text-center hidden sm:block">
          <div className="text-sm font-medium">{list.avgClickRate?.toFixed(1) || 0}%</div>
          <div className="text-xs text-muted-foreground">Click Rate</div>
        </div>
        <Badge variant={getEngagementBadgeVariant(list.engagementTier)}>
          {list.engagementTier.charAt(0).toUpperCase() + list.engagementTier.slice(1)}
        </Badge>
        <ChevronRight className="h-4 w-4 text-muted-foreground" />
      </div>
    </div>
  );
}

function ListHealthSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-20 mb-2" />
              <Skeleton className="h-3 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center gap-4 p-4 rounded-lg border">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="flex-1">
                <Skeleton className="h-5 w-48 mb-2" />
                <Skeleton className="h-4 w-32" />
              </div>
              <Skeleton className="h-6 w-16" />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
