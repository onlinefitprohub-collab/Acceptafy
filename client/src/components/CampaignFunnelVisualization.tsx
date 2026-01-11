import { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { 
  TrendingDown, 
  TrendingUp, 
  AlertTriangle, 
  Lightbulb, 
  BarChart3, 
  ArrowRight,
  Mail,
  CheckCircle,
  Eye,
  MousePointerClick,
  Loader2,
  Info,
  Sparkles,
  RefreshCw,
  Link2Off,
  Crown,
  Lock
} from 'lucide-react';
import { Link } from 'wouter';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface FunnelStage {
  name: string;
  count: number;
  percentage: number;
  icon: typeof Mail;
  color: string;
  bgColor: string;
}

interface CampaignData {
  id: string;
  name: string;
  subject: string;
  sentAt: string;
  sent: number;
  delivered: number;
  opened: number;
  clicked: number;
  bounced?: number;
  unsubscribed?: number;
  provider?: string;
}

interface DropOffAnalysis {
  stage: string;
  dropOffRate: number;
  severity: 'low' | 'medium' | 'high';
  recommendation?: string;
}

interface AIRecommendation {
  stage: string;
  issue: string;
  recommendation: string;
  impact: 'high' | 'medium' | 'low';
}

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
  isManual?: boolean;
}

interface ESPStatsResponse {
  providers: Array<{
    provider: string;
    stats: {
      campaigns: ESPCampaignStats[];
    } | null;
    error: string | null;
  }>;
  combinedStats: {
    campaigns: ESPCampaignStats[];
  } | null;
}

function transformESPCampaignToFunnelData(campaign: ESPCampaignStats, provider: string): CampaignData {
  return {
    id: campaign.campaignId,
    name: campaign.campaignName,
    subject: campaign.subject || '',
    sentAt: campaign.sentAt || '',
    sent: campaign.totalSent,
    delivered: campaign.delivered,
    opened: campaign.opened,
    clicked: campaign.clicked,
    bounced: campaign.bounced,
    unsubscribed: campaign.unsubscribed,
    provider
  };
}

const sampleCampaigns: CampaignData[] = [
  {
    id: 'sample-1',
    name: 'Spring Sale Announcement',
    subject: 'Don\'t Miss Our Spring Sale - 30% Off Everything!',
    sentAt: '2024-03-15',
    sent: 10000,
    delivered: 9750,
    opened: 2925,
    clicked: 585,
    bounced: 250,
    unsubscribed: 15
  },
  {
    id: 'sample-2',
    name: 'Product Launch Newsletter',
    subject: 'Introducing Our New Product Line',
    sentAt: '2024-03-10',
    sent: 8500,
    delivered: 8330,
    opened: 2916,
    clicked: 750,
    bounced: 170,
    unsubscribed: 25
  },
  {
    id: 'sample-3',
    name: 'Customer Appreciation Event',
    subject: 'You\'re Invited: Exclusive VIP Event',
    sentAt: '2024-03-05',
    sent: 5000,
    delivered: 4900,
    opened: 1960,
    clicked: 490,
    bounced: 100,
    unsubscribed: 8
  },
  {
    id: 'sample-4',
    name: 'Weekly Tips Newsletter',
    subject: '5 Tips to Boost Your Productivity',
    sentAt: '2024-03-01',
    sent: 12000,
    delivered: 11760,
    opened: 4116,
    clicked: 824,
    bounced: 240,
    unsubscribed: 30
  }
];

function getStages(campaign: CampaignData): FunnelStage[] {
  const deliveryRate = campaign.sent > 0 ? (campaign.delivered / campaign.sent) * 100 : 0;
  const openRate = campaign.delivered > 0 ? (campaign.opened / campaign.delivered) * 100 : 0;
  const clickRate = campaign.opened > 0 ? (campaign.clicked / campaign.opened) * 100 : 0;
  
  return [
    {
      name: 'Sent',
      count: campaign.sent,
      percentage: 100,
      icon: Mail,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10'
    },
    {
      name: 'Delivered',
      count: campaign.delivered,
      percentage: deliveryRate,
      icon: CheckCircle,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10'
    },
    {
      name: 'Opened',
      count: campaign.opened,
      percentage: openRate,
      icon: Eye,
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10'
    },
    {
      name: 'Clicked',
      count: campaign.clicked,
      percentage: clickRate,
      icon: MousePointerClick,
      color: 'text-orange-500',
      bgColor: 'bg-orange-500/10'
    }
  ];
}

function getDropOffAnalysis(campaign: CampaignData): DropOffAnalysis[] {
  const deliveryDropOff = campaign.sent > 0 ? ((campaign.sent - campaign.delivered) / campaign.sent) * 100 : 0;
  const openDropOff = campaign.delivered > 0 ? ((campaign.delivered - campaign.opened) / campaign.delivered) * 100 : 0;
  const clickDropOff = campaign.opened > 0 ? ((campaign.opened - campaign.clicked) / campaign.opened) * 100 : 0;
  
  const getSeverity = (rate: number, stage: string): 'low' | 'medium' | 'high' => {
    if (stage === 'Sent → Delivered') {
      if (rate > 5) return 'high';
      if (rate > 2) return 'medium';
      return 'low';
    }
    if (stage === 'Delivered → Opened') {
      if (rate > 80) return 'high';
      if (rate > 70) return 'medium';
      return 'low';
    }
    if (stage === 'Opened → Clicked') {
      if (rate > 85) return 'high';
      if (rate > 75) return 'medium';
      return 'low';
    }
    return 'low';
  };
  
  return [
    {
      stage: 'Sent → Delivered',
      dropOffRate: deliveryDropOff,
      severity: getSeverity(deliveryDropOff, 'Sent → Delivered'),
      recommendation: deliveryDropOff > 2 ? 'High bounce rate detected. Consider cleaning your email list and verifying sender authentication.' : undefined
    },
    {
      stage: 'Delivered → Opened',
      dropOffRate: openDropOff,
      severity: getSeverity(openDropOff, 'Delivered → Opened'),
      recommendation: openDropOff > 70 ? 'Low open rates suggest issues with subject lines or sender reputation. Try A/B testing subject lines.' : undefined
    },
    {
      stage: 'Opened → Clicked',
      dropOffRate: clickDropOff,
      severity: getSeverity(clickDropOff, 'Opened → Clicked'),
      recommendation: clickDropOff > 80 ? 'Low click-through rates indicate content or CTA issues. Consider stronger calls-to-action and clearer value propositions.' : undefined
    }
  ];
}

function FunnelChart({ stages }: { stages: FunnelStage[] }) {
  const maxWidth = 100;
  
  return (
    <div className="space-y-2">
      {stages.map((stage, index) => {
        const width = index === 0 ? maxWidth : (stage.count / stages[0].count) * maxWidth;
        const StageIcon = stage.icon;
        
        return (
          <div key={stage.name} className="flex items-center gap-4">
            <div className="w-24 flex items-center gap-2">
              <div className={`p-1.5 rounded-lg ${stage.bgColor}`}>
                <StageIcon className={`w-4 h-4 ${stage.color}`} />
              </div>
              <span className="text-sm font-medium text-foreground">{stage.name}</span>
            </div>
            <div className="flex-1">
              <div 
                className="h-10 rounded-lg transition-all duration-500 flex items-center justify-end pr-3"
                style={{ 
                  width: `${Math.max(width, 10)}%`,
                  background: `linear-gradient(90deg, hsl(var(--primary)/0.3) 0%, hsl(var(--primary)/0.6) 100%)`
                }}
              >
                <span className="text-sm font-semibold text-foreground">
                  {stage.count.toLocaleString()}
                </span>
              </div>
            </div>
            <div className="w-16 text-right">
              <span className="text-sm text-muted-foreground">
                {stage.percentage.toFixed(1)}%
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function DropOffIndicator({ analysis }: { analysis: DropOffAnalysis }) {
  const severityColors = {
    low: 'text-green-500 bg-green-500/10 border-green-500/20',
    medium: 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20',
    high: 'text-red-500 bg-red-500/10 border-red-500/20'
  };
  
  const severityIcons = {
    low: TrendingUp,
    medium: AlertTriangle,
    high: TrendingDown
  };
  
  const Icon = severityIcons[analysis.severity];
  
  return (
    <div className={`p-4 rounded-lg border ${severityColors[analysis.severity]}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4" />
          <span className="text-sm font-medium">{analysis.stage}</span>
        </div>
        <Badge variant="outline" className={severityColors[analysis.severity]}>
          {analysis.dropOffRate.toFixed(1)}% drop-off
        </Badge>
      </div>
      {analysis.recommendation && (
        <div className="flex items-start gap-2 mt-2">
          <Lightbulb className="w-4 h-4 text-yellow-500 mt-0.5 shrink-0" />
          <p className="text-xs text-muted-foreground">{analysis.recommendation}</p>
        </div>
      )}
    </div>
  );
}

function ComparisonChart({ campaigns, selectedIds }: { campaigns: CampaignData[], selectedIds: string[] }) {
  const selectedCampaigns = campaigns.filter(c => selectedIds.includes(c.id));
  
  if (selectedCampaigns.length < 2) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center border border-dashed rounded-lg">
        <BarChart3 className="w-12 h-12 text-muted-foreground mb-4" />
        <p className="text-muted-foreground">Select at least 2 campaigns to compare</p>
      </div>
    );
  }
  
  const metrics = ['Delivery Rate', 'Open Rate', 'Click Rate'];
  const colors = ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-orange-500'];
  
  return (
    <div className="space-y-6">
      {metrics.map((metric) => (
        <div key={metric} className="space-y-2">
          <h4 className="text-sm font-medium text-foreground">{metric}</h4>
          <div className="space-y-2">
            {selectedCampaigns.map((campaign, index) => {
              let value = 0;
              if (metric === 'Delivery Rate') {
                value = campaign.sent > 0 ? (campaign.delivered / campaign.sent) * 100 : 0;
              } else if (metric === 'Open Rate') {
                value = campaign.delivered > 0 ? (campaign.opened / campaign.delivered) * 100 : 0;
              } else if (metric === 'Click Rate') {
                value = campaign.opened > 0 ? (campaign.clicked / campaign.opened) * 100 : 0;
              }
              
              return (
                <div key={campaign.id} className="flex items-center gap-3">
                  <div className="w-32 text-xs text-muted-foreground truncate" title={campaign.name}>
                    {campaign.name}
                  </div>
                  <div className="flex-1 h-6 bg-muted rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${colors[index % colors.length]} transition-all duration-500`}
                      style={{ width: `${Math.min(value, 100)}%` }}
                    />
                  </div>
                  <div className="w-14 text-sm font-medium text-right">
                    {value.toFixed(1)}%
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

export function CampaignFunnelVisualization() {
  const [selectedCampaign, setSelectedCampaign] = useState<string>('');
  const [compareMode, setCompareMode] = useState(false);
  const [selectedForComparison, setSelectedForComparison] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState('funnel');
  const [requiresUpgrade, setRequiresUpgrade] = useState(false);
  const { toast } = useToast();
  
  // Fetch real campaigns from connected ESPs
  const { data: espStatsData, isLoading: isLoadingESP, error: espError } = useQuery<ESPStatsResponse>({
    queryKey: ['/api/esp/stats'],
  });
  
  // Transform ESP and manual campaign data to campaign list
  const campaigns = useMemo(() => {
    if (espStatsData?.combinedStats?.campaigns?.length) {
      const allCampaigns: CampaignData[] = espStatsData.combinedStats.campaigns.map(c => {
        const provider = c.isManual ? 'manual' : 
          espStatsData.providers.find(p => 
            p.stats?.campaigns?.some(pc => pc.campaignId === c.campaignId)
          )?.provider || 'unknown';
        return transformESPCampaignToFunnelData(c, provider);
      });
      
      return allCampaigns.length > 0 ? allCampaigns : sampleCampaigns;
    }
    return sampleCampaigns;
  }, [espStatsData]);
  
  const isUsingRealData = useMemo(() => {
    return espStatsData?.combinedStats?.campaigns && espStatsData.combinedStats.campaigns.length > 0;
  }, [espStatsData]);
  
  // Set initial campaign selection once campaigns load
  useEffect(() => {
    if (campaigns.length > 0 && !selectedCampaign) {
      setSelectedCampaign(campaigns[0].id);
    }
  }, [campaigns, selectedCampaign]);
  
  const campaign = useMemo(() => 
    campaigns.find(c => c.id === selectedCampaign) || campaigns[0],
    [selectedCampaign, campaigns]
  );
  
  const stages = useMemo(() => campaign ? getStages(campaign) : [], [campaign]);
  const dropOffAnalysis = useMemo(() => campaign ? getDropOffAnalysis(campaign) : [], [campaign]);
  
  const analyzeWithAIMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/funnel/analyze', {
        campaign,
        stages,
        dropOffAnalysis
      });
      if (response.status === 403) {
        const errorData = await response.json();
        if (errorData.error === 'Pro feature') {
          throw { isUpgradeRequired: true };
        }
      }
      return response.json();
    },
    onSuccess: () => {
      setRequiresUpgrade(false);
      queryClient.invalidateQueries({ queryKey: ['/api/funnel/recommendations', selectedCampaign] });
    },
    onError: (error: any) => {
      if (error?.isUpgradeRequired) {
        setRequiresUpgrade(true);
        return;
      }
      toast({
        title: 'Analysis Failed',
        description: 'Failed to analyze campaign funnel',
        variant: 'destructive',
      });
    }
  });
  
  const toggleCampaignForComparison = (id: string) => {
    setSelectedForComparison(prev => 
      prev.includes(id) 
        ? prev.filter(x => x !== id) 
        : prev.length < 4 ? [...prev, id] : prev
    );
  };
  
  const overallClickThroughRate = campaign?.sent > 0 
    ? (campaign.clicked / campaign.sent) * 100 
    : 0;
  
  return (
    <TooltipProvider>
      <div className="space-y-6">
        <Card className="border-purple-500/20 bg-gradient-to-br from-purple-500/5 to-pink-500/5">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500">
                  <BarChart3 className="w-5 h-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-xl">Campaign Funnel Analysis</CardTitle>
                  <CardDescription>Visualize and optimize your email campaign performance</CardDescription>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant={compareMode ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCompareMode(!compareMode)}
                  data-testid="button-toggle-compare"
                >
                  {compareMode ? 'Exit Compare' : 'Compare Campaigns'}
                </Button>
              </div>
            </div>
          </CardHeader>
        </Card>
        
        {!compareMode ? (
          <>
            {isLoadingESP ? (
              <Card>
                <CardContent className="p-8 flex flex-col items-center justify-center">
                  <Loader2 className="w-8 h-8 text-purple-500 animate-spin mb-4" />
                  <p className="text-muted-foreground">Loading campaigns from your connected ESPs...</p>
                </CardContent>
              </Card>
            ) : !campaign ? (
              <Card>
                <CardContent className="p-8 flex flex-col items-center justify-center text-center">
                  <Link2Off className="w-12 h-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium text-foreground mb-2">No Campaigns Found</h3>
                  <p className="text-muted-foreground mb-4">Connect your ESP in Integrations to analyze your campaigns</p>
                </CardContent>
              </Card>
            ) : (
              <>
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-lg">Select Campaign</CardTitle>
                    {isUsingRealData ? (
                      <Badge className="text-xs bg-green-500/10 text-green-600 border-green-500/20">Live ESP Data</Badge>
                    ) : (
                      <Badge variant="outline" className="text-xs">Sample Data</Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => queryClient.invalidateQueries({ queryKey: ['/api/esp/stats'] })}
                      data-testid="button-refresh-campaigns"
                    >
                      <RefreshCw className="w-3 h-3 mr-1" />
                      Refresh
                    </Button>
                    <Select value={selectedCampaign} onValueChange={setSelectedCampaign}>
                      <SelectTrigger className="w-[280px]" data-testid="select-campaign">
                        <SelectValue placeholder="Select a campaign" />
                      </SelectTrigger>
                      <SelectContent>
                        {campaigns.map(c => (
                          <SelectItem key={c.id} value={c.id}>
                            <div className="flex items-center gap-2">
                              {c.name}
                              {c.provider && <Badge variant="outline" className="text-xs ml-1">{c.provider}</Badge>}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                {!isUsingRealData && (
                  <CardDescription className="mt-2">
                    Connect your ESP in Integrations to see real campaign data
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-4 gap-4 mb-6">
                  <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
                    <div className="flex items-center gap-2 mb-1">
                      <Mail className="w-4 h-4 text-blue-500" />
                      <span className="text-sm text-muted-foreground">Sent</span>
                    </div>
                    <p className="text-2xl font-bold text-foreground">{campaign.sent.toLocaleString()}</p>
                  </div>
                  <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
                    <div className="flex items-center gap-2 mb-1">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span className="text-sm text-muted-foreground">Delivered</span>
                    </div>
                    <p className="text-2xl font-bold text-foreground">{campaign.delivered.toLocaleString()}</p>
                    <p className="text-xs text-green-500">
                      {((campaign.delivered / campaign.sent) * 100).toFixed(1)}% rate
                    </p>
                  </div>
                  <div className="p-4 rounded-lg bg-purple-500/10 border border-purple-500/20">
                    <div className="flex items-center gap-2 mb-1">
                      <Eye className="w-4 h-4 text-purple-500" />
                      <span className="text-sm text-muted-foreground">Opened</span>
                    </div>
                    <p className="text-2xl font-bold text-foreground">{campaign.opened.toLocaleString()}</p>
                    <p className="text-xs text-purple-500">
                      {((campaign.opened / campaign.delivered) * 100).toFixed(1)}% rate
                    </p>
                  </div>
                  <div className="p-4 rounded-lg bg-orange-500/10 border border-orange-500/20">
                    <div className="flex items-center gap-2 mb-1">
                      <MousePointerClick className="w-4 h-4 text-orange-500" />
                      <span className="text-sm text-muted-foreground">Clicked</span>
                    </div>
                    <p className="text-2xl font-bold text-foreground">{campaign.clicked.toLocaleString()}</p>
                    <p className="text-xs text-orange-500">
                      {((campaign.clicked / campaign.opened) * 100).toFixed(1)}% rate
                    </p>
                  </div>
                </div>
                
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">Overall Click-Through Rate</span>
                    <span className="text-sm font-medium text-foreground">{overallClickThroughRate.toFixed(2)}%</span>
                  </div>
                  <Progress value={overallClickThroughRate * 10} className="h-2" />
                </div>
              </CardContent>
            </Card>
            
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="funnel" data-testid="tab-funnel">Funnel View</TabsTrigger>
                <TabsTrigger value="dropoff" data-testid="tab-dropoff">Drop-off Analysis</TabsTrigger>
                <TabsTrigger value="ai" data-testid="tab-ai">AI Recommendations</TabsTrigger>
              </TabsList>
              
              <TabsContent value="funnel" className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Campaign Funnel</CardTitle>
                    <CardDescription>
                      Visual representation of your email journey from send to click
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <FunnelChart stages={stages} />
                    
                    <div className="mt-6 p-4 rounded-lg bg-muted/50">
                      <div className="flex items-center gap-2 mb-2">
                        <Info className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm font-medium text-foreground">Funnel Insights</span>
                      </div>
                      <ul className="space-y-1 text-sm text-muted-foreground">
                        <li className="flex items-center gap-2">
                          <ArrowRight className="w-3 h-3" />
                          {stages[0].count - stages[1].count} emails bounced ({((1 - stages[1].percentage / 100) * 100).toFixed(1)}%)
                        </li>
                        <li className="flex items-center gap-2">
                          <ArrowRight className="w-3 h-3" />
                          {stages[1].count - stages[2].count} delivered but not opened ({((1 - stages[2].count / stages[1].count) * 100).toFixed(1)}%)
                        </li>
                        <li className="flex items-center gap-2">
                          <ArrowRight className="w-3 h-3" />
                          {stages[2].count - stages[3].count} opened but didn't click ({((1 - stages[3].count / stages[2].count) * 100).toFixed(1)}%)
                        </li>
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="dropoff" className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Drop-off Analysis</CardTitle>
                    <CardDescription>
                      Identify bottlenecks in your email funnel
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {dropOffAnalysis.map((analysis, index) => (
                        <DropOffIndicator key={index} analysis={analysis} />
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="ai" className="mt-4">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between flex-wrap gap-4">
                      <div>
                        <CardTitle className="text-lg flex items-center gap-2">
                          <Sparkles className="w-5 h-5 text-purple-500" />
                          AI-Powered Recommendations
                        </CardTitle>
                        <CardDescription>
                          Get personalized insights to improve your campaign performance
                        </CardDescription>
                      </div>
                      <Button 
                        onClick={() => analyzeWithAIMutation.mutate()}
                        disabled={analyzeWithAIMutation.isPending}
                        data-testid="button-analyze-ai"
                      >
                        {analyzeWithAIMutation.isPending ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Analyzing...
                          </>
                        ) : (
                          <>
                            <RefreshCw className="w-4 h-4 mr-2" />
                            Analyze with AI
                          </>
                        )}
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {requiresUpgrade ? (
                      <div className="p-6 text-center space-y-4">
                        <div className="flex justify-center">
                          <div className="p-3 rounded-full bg-purple-500/20">
                            <Crown className="w-8 h-8 text-purple-400" />
                          </div>
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-foreground">Pro Feature</h3>
                          <p className="text-muted-foreground text-sm mt-1">
                            AI Funnel Analysis is available on Pro and Scale plans. Upgrade to get personalized insights to improve your campaign performance.
                          </p>
                        </div>
                        <Link href="/pricing">
                          <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700" data-testid="button-upgrade-funnel">
                            <Lock className="w-4 h-4 mr-2" />
                            Upgrade to Pro
                          </Button>
                        </Link>
                      </div>
                    ) : analyzeWithAIMutation.isPending ? (
                      <div className="flex flex-col items-center justify-center p-8">
                        <Loader2 className="w-8 h-8 text-purple-500 animate-spin mb-4" />
                        <p className="text-muted-foreground">Analyzing your campaign data...</p>
                      </div>
                    ) : analyzeWithAIMutation.data ? (
                      <div className="space-y-4">
                        {(analyzeWithAIMutation.data as { overallAssessment?: string })?.overallAssessment && (
                          <div className="p-4 rounded-lg bg-purple-500/10 border border-purple-500/20 mb-4">
                            <div className="flex items-center gap-2 mb-2">
                              <Info className="w-4 h-4 text-purple-500" />
                              <span className="text-sm font-medium text-foreground">Overall Assessment</span>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {(analyzeWithAIMutation.data as { overallAssessment?: string }).overallAssessment}
                            </p>
                          </div>
                        )}
                        
                        {(analyzeWithAIMutation.data as { priorityAction?: string })?.priorityAction && (
                          <div className="p-4 rounded-lg bg-orange-500/10 border border-orange-500/20 mb-4">
                            <div className="flex items-center gap-2 mb-2">
                              <AlertTriangle className="w-4 h-4 text-orange-500" />
                              <span className="text-sm font-medium text-foreground">Priority Action</span>
                            </div>
                            <p className="text-sm text-foreground">
                              {(analyzeWithAIMutation.data as { priorityAction?: string }).priorityAction}
                            </p>
                          </div>
                        )}
                        
                        {(analyzeWithAIMutation.data as { recommendations?: AIRecommendation[] }).recommendations?.map((rec: AIRecommendation, index: number) => (
                          <div 
                            key={index} 
                            className={`p-4 rounded-lg border ${
                              rec.impact === 'high' 
                                ? 'border-red-500/20 bg-red-500/5' 
                                : rec.impact === 'medium'
                                ? 'border-yellow-500/20 bg-yellow-500/5'
                                : 'border-green-500/20 bg-green-500/5'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-medium text-foreground">{rec.stage}</span>
                              <Badge variant="outline">
                                {rec.impact} impact
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mb-2">{rec.issue}</p>
                            <div className="flex items-start gap-2 p-3 rounded bg-background/50">
                              <Lightbulb className="w-4 h-4 text-yellow-500 mt-0.5 shrink-0" />
                              <p className="text-sm text-foreground">{rec.recommendation}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center p-8 text-center border border-dashed rounded-lg">
                        <Sparkles className="w-12 h-12 text-muted-foreground mb-4" />
                        <p className="text-muted-foreground mb-2">
                          Click "Analyze with AI" to get personalized recommendations
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Our AI will analyze your funnel data and provide actionable insights
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
              </>
            )}
          </>
        ) : (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                  <CardTitle className="text-lg">Campaign Comparison</CardTitle>
                  <CardDescription>
                    Select up to 4 campaigns to compare their performance metrics
                  </CardDescription>
                </div>
                {isUsingRealData && (
                  <Badge className="text-xs bg-green-500/10 text-green-600 border-green-500/20">Live ESP Data</Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4 mb-6">
                {campaigns.map(c => (
                  <div 
                    key={c.id}
                    className={`p-4 rounded-lg border cursor-pointer transition-all ${
                      selectedForComparison.includes(c.id)
                        ? 'border-purple-500 bg-purple-500/10'
                        : 'border-border hover:border-purple-500/50'
                    }`}
                    onClick={() => toggleCampaignForComparison(c.id)}
                    data-testid={`card-campaign-compare-${c.id}`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-foreground">{c.name}</span>
                        {c.provider && <Badge variant="outline" className="text-xs">{c.provider}</Badge>}
                      </div>
                      {selectedForComparison.includes(c.id) && (
                        <CheckCircle className="w-5 h-5 text-purple-500" />
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground truncate">{c.subject}</p>
                    <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                      <span>{c.sent.toLocaleString()} sent</span>
                      <span>{c.sentAt}</span>
                    </div>
                  </div>
                ))}
              </div>
              
              <ComparisonChart campaigns={campaigns} selectedIds={selectedForComparison} />
            </CardContent>
          </Card>
        )}
      </div>
    </TooltipProvider>
  );
}

export default CampaignFunnelVisualization;
