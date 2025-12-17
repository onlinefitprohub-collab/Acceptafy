import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { queryClient, apiRequest } from '@/lib/queryClient';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Minus,
  Bell,
  BellOff,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Loader2,
  Shield,
  Activity,
  BarChart3,
  Zap,
  Target,
  Clock,
  Mail,
  ArrowUpDown,
  Eye,
  EyeOff,
  ChevronRight,
  ArrowUpRight,
  ArrowDownRight,
  GitCompare,
  FileText,
  Calendar,
  Gauge,
  Info,
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

interface ProviderHealth {
  provider: string;
  domain: string;
  metrics: {
    openRate: number;
    clickRate: number;
    bounceRate: number;
    complaintRate: number;
    deliveryRate: number;
  };
  baseline: {
    openRate: number;
    clickRate: number;
    bounceRate: number;
    complaintRate: number;
  };
  trend: 'improving' | 'stable' | 'declining';
  alerts: string[];
}

interface DeliverabilityAlert {
  id: string;
  provider: string;
  alertType: string;
  severity: 'info' | 'warning' | 'critical';
  title: string;
  message: string;
  metric?: string;
  currentValue?: number;
  baselineValue?: number;
  isRead: boolean;
  createdAt: string;
}

interface RiskAssessment {
  overallRisk: 'low' | 'medium' | 'high';
  riskScore: number;
  riskFactors: Array<{
    factor: string;
    impact: 'low' | 'medium' | 'high';
    recommendation: string;
  }>;
  predictions: {
    openRate: number;
    bounceRate: number;
    complaintRate: number;
  };
}

interface CampaignHistory {
  id: string;
  campaignId: string;
  campaignName?: string;
  subject?: string;
  sentAt?: string;
  totalSent: number;
  openRate: number;
  clickRate: number;
  bounceRate: number;
  provider: string;
}

interface CampaignComparison {
  campaign1: CampaignHistory;
  campaign2: CampaignHistory;
  differences: Array<{
    metric: string;
    value1: number;
    value2: number;
    change: number;
    impact: string;
  }>;
  insights: string[];
}

interface TemplateHealth {
  templateId: string;
  templateName: string;
  timesUsed: number;
  avgOpenRate: number;
  avgClickRate: number;
  avgBounceRate: number;
  trend: 'improving' | 'stable' | 'declining';
  lastUsed?: string;
}

interface FrequencyInsights {
  currentSendsPerWeek: number;
  baselineSendsPerWeek: number;
  fatigueRisk: 'low' | 'medium' | 'high';
  recommendations: string[];
  optimalSendTimes: string[];
  dayOfWeekBreakdown: Array<{ day: string; count: number; performance: number }>;
}

interface DeliverabilityIntelligenceProps {
  connections: Array<{ provider: string; isConnected: boolean }>;
}

export function DeliverabilityIntelligence({ connections }: DeliverabilityIntelligenceProps) {
  const { toast } = useToast();
  const [selectedProvider, setSelectedProvider] = useState<string>('');
  const [riskSubject, setRiskSubject] = useState('');
  const [riskVolume, setRiskVolume] = useState('');
  const [compareId1, setCompareId1] = useState('');
  const [compareId2, setCompareId2] = useState('');

  const connectedProviders = connections.filter(c => c.isConnected);

  const { data: healthPanels, isLoading: loadingHealth } = useQuery<ProviderHealth[]>({
    queryKey: ['/api/deliverability/provider-health'],
    enabled: connectedProviders.length > 0,
  });

  const { data: alerts, isLoading: loadingAlerts, refetch: refetchAlerts } = useQuery<DeliverabilityAlert[]>({
    queryKey: ['/api/deliverability/alerts'],
    enabled: connectedProviders.length > 0,
  });

  const { data: campaignHistory, isLoading: loadingHistory } = useQuery<CampaignHistory[]>({
    queryKey: ['/api/deliverability/campaign-history', selectedProvider],
    enabled: connectedProviders.length > 0,
  });

  const { data: templateHealth, isLoading: loadingTemplates } = useQuery<TemplateHealth[]>({
    queryKey: ['/api/deliverability/template-health'],
    enabled: connectedProviders.length > 0,
  });

  const { data: frequencyInsights, isLoading: loadingFrequency } = useQuery<FrequencyInsights>({
    queryKey: ['/api/deliverability/frequency-tracking', selectedProvider],
    enabled: connectedProviders.length > 0 && !!selectedProvider,
  });

  const syncMutation = useMutation({
    mutationFn: async (provider: string) => {
      const response = await apiRequest('POST', '/api/deliverability/sync', { provider });
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: 'Sync Complete',
        description: `Synced ${data.campaignsSynced} campaigns for trend analysis.`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/deliverability'] });
    },
    onError: () => {
      toast({
        title: 'Sync Failed',
        description: 'Failed to sync campaign data. Please try again.',
        variant: 'destructive',
      });
    },
  });

  const riskScoreMutation = useMutation({
    mutationFn: async (data: { provider: string; subject?: string; estimatedVolume?: number }) => {
      const response = await apiRequest('POST', '/api/deliverability/risk-score', data);
      return response.json() as Promise<RiskAssessment>;
    },
    onError: () => {
      toast({
        title: 'Risk Analysis Failed',
        description: 'Could not calculate risk score.',
        variant: 'destructive',
      });
    },
  });

  const dismissAlertMutation = useMutation({
    mutationFn: async (alertId: string) => {
      await apiRequest('PATCH', `/api/deliverability/alerts/${alertId}/dismiss`, {});
    },
    onSuccess: () => {
      refetchAlerts();
    },
  });

  const markReadMutation = useMutation({
    mutationFn: async (alertId: string) => {
      await apiRequest('PATCH', `/api/deliverability/alerts/${alertId}/read`, {});
    },
    onSuccess: () => {
      refetchAlerts();
    },
  });

  const compareMutation = useMutation({
    mutationFn: async (data: { campaignId1: string; campaignId2: string }) => {
      const response = await apiRequest('POST', '/api/deliverability/compare', data);
      return response.json() as Promise<CampaignComparison>;
    },
    onError: () => {
      toast({
        title: 'Comparison Failed',
        description: 'Could not compare campaigns.',
        variant: 'destructive',
      });
    },
  });

  const unreadAlerts = alerts?.filter(a => !a.isRead) || [];

  const getTrendIcon = (trend: 'improving' | 'stable' | 'declining') => {
    switch (trend) {
      case 'improving':
        return <TrendingUp className="w-4 h-4 text-green-500" />;
      case 'declining':
        return <TrendingDown className="w-4 h-4 text-red-500" />;
      default:
        return <Minus className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getSeverityColor = (severity: 'info' | 'warning' | 'critical') => {
    switch (severity) {
      case 'critical':
        return 'destructive';
      case 'warning':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const getRiskColor = (risk: 'low' | 'medium' | 'high') => {
    switch (risk) {
      case 'high':
        return 'text-red-500';
      case 'medium':
        return 'text-yellow-500';
      default:
        return 'text-green-500';
    }
  };

  const handleRiskCheck = () => {
    if (!selectedProvider) {
      toast({
        title: 'Select Provider',
        description: 'Please select an ESP provider first.',
        variant: 'destructive',
      });
      return;
    }

    riskScoreMutation.mutate({
      provider: selectedProvider,
      subject: riskSubject || undefined,
      estimatedVolume: riskVolume ? parseInt(riskVolume) : undefined,
    });
  };

  if (connectedProviders.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Activity className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-medium mb-2">Connect an ESP to Get Started</h3>
          <p className="text-muted-foreground">
            Connect your email service provider to unlock deliverability intelligence features.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Deliverability Intelligence</h2>
          <p className="text-muted-foreground">
            Advanced insights and trend detection for your email campaigns
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={selectedProvider} onValueChange={setSelectedProvider}>
            <SelectTrigger className="w-[180px]" data-testid="select-provider">
              <SelectValue placeholder="Select ESP" />
            </SelectTrigger>
            <SelectContent>
              {connectedProviders.map(p => (
                <SelectItem key={p.provider} value={p.provider}>
                  {p.provider.charAt(0).toUpperCase() + p.provider.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="sm"
            onClick={() => selectedProvider && syncMutation.mutate(selectedProvider)}
            disabled={!selectedProvider || syncMutation.isPending}
            data-testid="button-sync-data"
          >
            {syncMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
            <span className="ml-2">Sync Data</span>
          </Button>
        </div>
      </div>

      {unreadAlerts.length > 0 && (
        <Card className="border-yellow-500/50 bg-yellow-500/5">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Bell className="w-5 h-5 text-yellow-500" />
              Active Alerts ({unreadAlerts.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {unreadAlerts.slice(0, 5).map(alert => (
              <div
                key={alert.id}
                className="flex items-start justify-between gap-4 p-3 rounded-lg bg-background border"
                data-testid={`alert-${alert.id}`}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant={getSeverityColor(alert.severity)}>
                      {alert.severity}
                    </Badge>
                    <span className="font-medium">{alert.title}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{alert.message}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {alert.provider} • {new Date(alert.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex gap-1">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => markReadMutation.mutate(alert.id)}
                        data-testid={`button-mark-read-${alert.id}`}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Mark as read</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => dismissAlertMutation.mutate(alert.id)}
                        data-testid={`button-dismiss-${alert.id}`}
                      >
                        <BellOff className="w-4 h-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Dismiss</TooltipContent>
                  </Tooltip>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loadingHealth ? (
          <>
            <Skeleton className="h-[200px]" />
            <Skeleton className="h-[200px]" />
            <Skeleton className="h-[200px]" />
          </>
        ) : healthPanels && healthPanels.length > 0 ? (
          healthPanels.map((panel, idx) => (
            <Card key={idx} data-testid={`health-panel-${panel.provider}`}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Shield className="w-4 h-4" />
                    {panel.provider.charAt(0).toUpperCase() + panel.provider.slice(1)}
                  </CardTitle>
                  <div className="flex items-center gap-1">
                    {getTrendIcon(panel.trend)}
                    <span className="text-xs text-muted-foreground">{panel.trend}</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <MetricDisplay
                    label="Open Rate"
                    value={panel.metrics.openRate}
                    baseline={panel.baseline.openRate}
                    isPercentage
                    higherIsBetter
                  />
                  <MetricDisplay
                    label="Click Rate"
                    value={panel.metrics.clickRate}
                    baseline={panel.baseline.clickRate}
                    isPercentage
                    higherIsBetter
                  />
                  <MetricDisplay
                    label="Bounce Rate"
                    value={panel.metrics.bounceRate}
                    baseline={panel.baseline.bounceRate}
                    isPercentage
                    higherIsBetter={false}
                  />
                  <MetricDisplay
                    label="Delivery"
                    value={panel.metrics.deliveryRate}
                    baseline={100}
                    isPercentage
                    higherIsBetter
                  />
                </div>
                {panel.alerts.length > 0 && (
                  <div className="pt-2 border-t">
                    <p className="text-xs text-muted-foreground mb-1">Active issues:</p>
                    <div className="flex flex-wrap gap-1">
                      {panel.alerts.slice(0, 2).map((alert, i) => (
                        <Badge key={i} variant="outline" className="text-xs">
                          {alert}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        ) : (
          <Card className="col-span-full">
            <CardContent className="py-8 text-center">
              <Activity className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-muted-foreground">
                No health data yet. Sync campaign data to start tracking trends.
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5" />
              Pre-Send Risk Score
            </CardTitle>
            <CardDescription>
              Analyze potential deliverability risks before sending a campaign
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="risk-subject">Subject Line (optional)</Label>
                <Input
                  id="risk-subject"
                  placeholder="Enter subject line"
                  value={riskSubject}
                  onChange={(e) => setRiskSubject(e.target.value)}
                  data-testid="input-risk-subject"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="risk-volume">Send Volume (optional)</Label>
                <Input
                  id="risk-volume"
                  type="number"
                  placeholder="e.g., 10000"
                  value={riskVolume}
                  onChange={(e) => setRiskVolume(e.target.value)}
                  data-testid="input-risk-volume"
                />
              </div>
            </div>
            <Button
              onClick={handleRiskCheck}
              disabled={!selectedProvider || riskScoreMutation.isPending}
              className="w-full"
              data-testid="button-check-risk"
            >
              {riskScoreMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 mr-2" />
                  Check Risk Score
                </>
              )}
            </Button>

            {riskScoreMutation.data && (
              <div className="mt-4 p-4 rounded-lg bg-muted/50 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Overall Risk</span>
                  <div className="flex items-center gap-2">
                    <span className={`text-2xl font-bold ${getRiskColor(riskScoreMutation.data.overallRisk)}`}>
                      {riskScoreMutation.data.riskScore}
                    </span>
                    <Badge variant={riskScoreMutation.data.overallRisk === 'high' ? 'destructive' : 'secondary'}>
                      {riskScoreMutation.data.overallRisk.toUpperCase()}
                    </Badge>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="p-2 rounded bg-background">
                    <p className="text-xs text-muted-foreground">Pred. Open</p>
                    <p className="font-medium">{riskScoreMutation.data.predictions.openRate.toFixed(1)}%</p>
                  </div>
                  <div className="p-2 rounded bg-background">
                    <p className="text-xs text-muted-foreground">Pred. Bounce</p>
                    <p className="font-medium">{riskScoreMutation.data.predictions.bounceRate.toFixed(1)}%</p>
                  </div>
                  <div className="p-2 rounded bg-background">
                    <p className="text-xs text-muted-foreground">Pred. Complaint</p>
                    <p className="font-medium">{riskScoreMutation.data.predictions.complaintRate.toFixed(2)}%</p>
                  </div>
                </div>

                {riskScoreMutation.data.riskFactors.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Risk Factors</p>
                    {riskScoreMutation.data.riskFactors.map((factor, i) => (
                      <div key={i} className="p-3 rounded bg-background border text-sm">
                        <div className="flex items-center gap-2 mb-1">
                          <AlertTriangle className={`w-4 h-4 ${
                            factor.impact === 'high' ? 'text-red-500' : 
                            factor.impact === 'medium' ? 'text-yellow-500' : 'text-blue-500'
                          }`} />
                          <span className="font-medium">{factor.factor}</span>
                        </div>
                        <p className="text-muted-foreground">{factor.recommendation}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Recent Campaigns
            </CardTitle>
            <CardDescription>
              Historical campaign performance for trend analysis
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loadingHistory ? (
              <div className="space-y-3">
                <Skeleton className="h-16" />
                <Skeleton className="h-16" />
                <Skeleton className="h-16" />
              </div>
            ) : campaignHistory && campaignHistory.length > 0 ? (
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {campaignHistory.slice(0, 10).map((campaign) => (
                  <div
                    key={campaign.id}
                    className="p-3 rounded-lg border hover-elevate cursor-pointer"
                    data-testid={`campaign-${campaign.campaignId}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">
                          {campaign.campaignName || campaign.subject || 'Untitled Campaign'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {campaign.sentAt ? new Date(campaign.sentAt).toLocaleDateString() : 'No date'} • {campaign.totalSent.toLocaleString()} sent
                        </p>
                      </div>
                      <div className="flex gap-2 text-xs">
                        <Tooltip>
                          <TooltipTrigger>
                            <span className="text-green-500 font-medium">{(campaign.openRate / 100).toFixed(1)}%</span>
                          </TooltipTrigger>
                          <TooltipContent>Open Rate</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger>
                            <span className="text-blue-500 font-medium">{(campaign.clickRate / 100).toFixed(1)}%</span>
                          </TooltipTrigger>
                          <TooltipContent>Click Rate</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger>
                            <span className={`font-medium ${campaign.bounceRate > 300 ? 'text-red-500' : 'text-muted-foreground'}`}>
                              {(campaign.bounceRate / 100).toFixed(1)}%
                            </span>
                          </TooltipTrigger>
                          <TooltipContent>Bounce Rate</TooltipContent>
                        </Tooltip>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center">
                <Mail className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-muted-foreground text-sm">
                  No campaign history yet. Sync your ESP data to start tracking.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Accordion type="single" collapsible className="space-y-2">
        <AccordionItem value="compare" className="border rounded-lg">
          <AccordionTrigger className="px-4 hover:no-underline">
            <div className="flex items-center gap-2">
              <GitCompare className="w-5 h-5" />
              <span>Campaign Comparison</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Compare two campaigns to identify what changed and understand performance differences.
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>First Campaign</Label>
                  <Select value={compareId1} onValueChange={setCompareId1}>
                    <SelectTrigger data-testid="select-compare-campaign-1">
                      <SelectValue placeholder="Select campaign" />
                    </SelectTrigger>
                    <SelectContent>
                      {campaignHistory?.map(c => (
                        <SelectItem key={c.campaignId} value={c.campaignId}>
                          {c.campaignName || c.subject || c.campaignId}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Second Campaign</Label>
                  <Select value={compareId2} onValueChange={setCompareId2}>
                    <SelectTrigger data-testid="select-compare-campaign-2">
                      <SelectValue placeholder="Select campaign" />
                    </SelectTrigger>
                    <SelectContent>
                      {campaignHistory?.filter(c => c.campaignId !== compareId1).map(c => (
                        <SelectItem key={c.campaignId} value={c.campaignId}>
                          {c.campaignName || c.subject || c.campaignId}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button
                onClick={() => compareMutation.mutate({ campaignId1: compareId1, campaignId2: compareId2 })}
                disabled={!compareId1 || !compareId2 || compareMutation.isPending}
                data-testid="button-compare-campaigns"
              >
                {compareMutation.isPending ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <GitCompare className="w-4 h-4 mr-2" />
                )}
                Compare Campaigns
              </Button>

              {compareMutation.data && (
                <div className="mt-4 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">{compareMutation.data.campaign1.campaignName || 'Campaign 1'}</CardTitle>
                        <CardDescription className="text-xs">
                          {compareMutation.data.campaign1.sentAt ? new Date(compareMutation.data.campaign1.sentAt).toLocaleDateString() : 'No date'}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="text-sm space-y-1">
                        <p>Sent: {compareMutation.data.campaign1.totalSent.toLocaleString()}</p>
                        <p>Open: {(compareMutation.data.campaign1.openRate / 100).toFixed(1)}%</p>
                        <p>Click: {(compareMutation.data.campaign1.clickRate / 100).toFixed(1)}%</p>
                        <p>Bounce: {(compareMutation.data.campaign1.bounceRate / 100).toFixed(1)}%</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">{compareMutation.data.campaign2.campaignName || 'Campaign 2'}</CardTitle>
                        <CardDescription className="text-xs">
                          {compareMutation.data.campaign2.sentAt ? new Date(compareMutation.data.campaign2.sentAt).toLocaleDateString() : 'No date'}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="text-sm space-y-1">
                        <p>Sent: {compareMutation.data.campaign2.totalSent.toLocaleString()}</p>
                        <p>Open: {(compareMutation.data.campaign2.openRate / 100).toFixed(1)}%</p>
                        <p>Click: {(compareMutation.data.campaign2.clickRate / 100).toFixed(1)}%</p>
                        <p>Bounce: {(compareMutation.data.campaign2.bounceRate / 100).toFixed(1)}%</p>
                      </CardContent>
                    </Card>
                  </div>

                  {compareMutation.data.differences.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="font-medium text-sm">Metric Changes</h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        {compareMutation.data.differences.map((diff, idx) => (
                          <div key={idx} className="p-3 rounded-lg border text-center">
                            <p className="text-xs text-muted-foreground mb-1">{diff.metric}</p>
                            <p className={`font-medium ${
                              diff.impact === 'positive' ? 'text-green-500' : 
                              diff.impact === 'negative' ? 'text-red-500' : 'text-muted-foreground'
                            }`}>
                              {diff.change > 0 ? '+' : ''}{diff.change.toFixed(1)}%
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {compareMutation.data.insights.length > 0 && (
                    <div className="p-3 rounded-lg bg-muted/50 space-y-2">
                      <h4 className="font-medium text-sm flex items-center gap-2">
                        <Info className="w-4 h-4" />
                        Insights
                      </h4>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        {compareMutation.data.insights.map((insight, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <ChevronRight className="w-4 h-4 mt-0.5 shrink-0" />
                            {insight}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="templates" className="border rounded-lg">
          <AccordionTrigger className="px-4 hover:no-underline">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              <span>Template Health</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            {loadingTemplates ? (
              <div className="space-y-2">
                <Skeleton className="h-16" />
                <Skeleton className="h-16" />
              </div>
            ) : templateHealth && templateHealth.length > 0 ? (
              <div className="space-y-2">
                {templateHealth.map((template) => (
                  <div
                    key={template.templateId}
                    className="p-3 rounded-lg border flex items-center justify-between"
                    data-testid={`template-health-${template.templateId}`}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{template.templateName}</p>
                        <div className="flex items-center gap-1">
                          {getTrendIcon(template.trend)}
                          <span className="text-xs text-muted-foreground">{template.trend}</span>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Used {template.timesUsed} times
                        {template.lastUsed && ` • Last used ${new Date(template.lastUsed).toLocaleDateString()}`}
                      </p>
                    </div>
                    <div className="flex gap-4 text-sm">
                      <Tooltip>
                        <TooltipTrigger>
                          <span className="text-green-500 font-medium">{template.avgOpenRate.toFixed(1)}%</span>
                        </TooltipTrigger>
                        <TooltipContent>Avg Open Rate</TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger>
                          <span className="text-blue-500 font-medium">{template.avgClickRate.toFixed(1)}%</span>
                        </TooltipTrigger>
                        <TooltipContent>Avg Click Rate</TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger>
                          <span className={`font-medium ${template.avgBounceRate > 3 ? 'text-red-500' : 'text-muted-foreground'}`}>
                            {template.avgBounceRate.toFixed(1)}%
                          </span>
                        </TooltipTrigger>
                        <TooltipContent>Avg Bounce Rate</TooltipContent>
                      </Tooltip>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-6 text-center">
                <FileText className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-muted-foreground text-sm">
                  No template data yet. Save and reuse templates to track their performance.
                </p>
              </div>
            )}
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="frequency" className="border rounded-lg">
          <AccordionTrigger className="px-4 hover:no-underline">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              <span>Frequency & Fatigue Insights</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            {!selectedProvider ? (
              <div className="py-6 text-center">
                <Gauge className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-muted-foreground text-sm">
                  Select an ESP provider above to view frequency insights.
                </p>
              </div>
            ) : loadingFrequency ? (
              <div className="space-y-2">
                <Skeleton className="h-24" />
                <Skeleton className="h-32" />
              </div>
            ) : frequencyInsights ? (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <Card>
                    <CardContent className="pt-4 text-center">
                      <p className="text-2xl font-bold">{frequencyInsights.currentSendsPerWeek}</p>
                      <p className="text-xs text-muted-foreground">Sends This Week</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-4 text-center">
                      <p className="text-2xl font-bold">{frequencyInsights.baselineSendsPerWeek}</p>
                      <p className="text-xs text-muted-foreground">Baseline Per Week</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-4 text-center">
                      <Badge variant={
                        frequencyInsights.fatigueRisk === 'high' ? 'destructive' :
                        frequencyInsights.fatigueRisk === 'medium' ? 'secondary' : 'outline'
                      } className="text-base">
                        {frequencyInsights.fatigueRisk.toUpperCase()}
                      </Badge>
                      <p className="text-xs text-muted-foreground mt-1">Fatigue Risk</p>
                    </CardContent>
                  </Card>
                </div>

                {frequencyInsights.dayOfWeekBreakdown && frequencyInsights.dayOfWeekBreakdown.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm">Day Performance</h4>
                    <div className="flex gap-1">
                      {frequencyInsights.dayOfWeekBreakdown.map((day) => (
                        <Tooltip key={day.day}>
                          <TooltipTrigger asChild>
                            <div
                              className="flex-1 h-12 rounded-md flex items-end justify-center pb-1"
                              style={{
                                backgroundColor: `hsl(var(--primary) / ${Math.min(day.performance / 100, 1)})`,
                              }}
                            >
                              <span className="text-xs font-medium text-primary-foreground">
                                {day.day.slice(0, 3)}
                              </span>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            {day.day}: {day.count} sends, {day.performance.toFixed(0)}% performance
                          </TooltipContent>
                        </Tooltip>
                      ))}
                    </div>
                  </div>
                )}

                {frequencyInsights.recommendations.length > 0 && (
                  <div className="p-3 rounded-lg bg-muted/50 space-y-2">
                    <h4 className="font-medium text-sm flex items-center gap-2">
                      <Target className="w-4 h-4" />
                      Recommendations
                    </h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      {frequencyInsights.recommendations.map((rec, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0 text-green-500" />
                          {rec}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {frequencyInsights.optimalSendTimes.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    <span className="text-sm text-muted-foreground">Optimal times:</span>
                    {frequencyInsights.optimalSendTimes.map((time, idx) => (
                      <Badge key={idx} variant="secondary">
                        <Clock className="w-3 h-3 mr-1" />
                        {time}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="py-6 text-center">
                <Calendar className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-muted-foreground text-sm">
                  No frequency data yet. Sync campaign data to analyze send patterns.
                </p>
              </div>
            )}
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}

function MetricDisplay({
  label,
  value,
  baseline,
  isPercentage = false,
  higherIsBetter = true,
}: {
  label: string;
  value: number;
  baseline: number;
  isPercentage?: boolean;
  higherIsBetter?: boolean;
}) {
  const difference = value - baseline;
  const isGood = higherIsBetter ? difference >= 0 : difference <= 0;
  const displayValue = isPercentage ? `${value.toFixed(1)}%` : value.toFixed(0);

  return (
    <div className="space-y-1">
      <p className="text-xs text-muted-foreground">{label}</p>
      <div className="flex items-center gap-1">
        <span className="font-medium">{displayValue}</span>
        {difference !== 0 && (
          <span className={`text-xs flex items-center ${isGood ? 'text-green-500' : 'text-red-500'}`}>
            {isGood ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
            {Math.abs(difference).toFixed(1)}
          </span>
        )}
      </div>
    </div>
  );
}
