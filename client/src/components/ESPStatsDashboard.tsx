import { useState, useEffect, useId } from 'react';
import { Link } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
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
  Activity,
  Brain,
  Target,
  Lightbulb,
  ThumbsUp,
  ThumbsDown,
  ChevronDown,
  ChevronUp,
  Shield,
  Zap,
  Copy,
  ExternalLink,
  Calendar,
  Send,
  Plus,
  Trash2,
  Save,
  Filter,
  UserMinus,
  Share2,
  XOctagon,
  DollarSign,
  Clock,
  Inbox
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { ManualCampaignStatsForm } from './ManualCampaignStatsForm';

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
  softBounced?: number;
  hardBounced?: number;
  unsubscribed: number;
  spamReports: number;
  forwards?: number;
  revenue?: number;
  avgTimeToOpen?: number;
  openRate: number;
  clickRate: number;
  bounceRate: number;
  softBounceRate?: number;
  hardBounceRate?: number;
  unsubscribeRate: number;
  spamRate?: number;
  forwardRate?: number;
  revenuePerEmail?: number;
  clickToOpenRate?: number;
  isManual?: boolean;
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
    totalSkipped?: number;
    totalBounced?: number;
    totalSoftBounced?: number;
    totalHardBounced?: number;
    totalUnsubscribed?: number;
    totalSpamReports?: number;
    totalForwards?: number;
    totalRevenue?: number;
    avgOpenRate: number;
    avgClickRate: number;
    avgBounceRate: number;
    avgSkipRate?: number;
    avgSoftBounceRate?: number;
    avgHardBounceRate?: number;
    avgUnsubscribeRate?: number;
    avgSpamRate?: number;
    avgForwardRate?: number;
    avgRevenuePerEmail?: number;
    avgTimeToOpen?: number;
    clickToOpenRate?: number;
    manualCampaignCount?: number;
    espCampaignCount?: number;
  };
}

interface ESPStatsResponse {
  providers: ProviderStats[];
  combinedStats: CombinedStats | null;
}

interface ESPStatsAnalysis {
  overallHealth: string;
  healthScore: number;
  summary: string;
  strengths: string[];
  concerns: string[];
  senderReputation: {
    score: number;
    status: string;
    explanation: string;
  };
  domainHealth: {
    score: number;
    status: string;
    listQuality: string;
    explanation: string;
  };
  spamRisk: {
    level: string;
    score: number;
    factors: string[];
    explanation: string;
  };
  inboxPlacementInsights: {
    estimatedInboxRate: number;
    gmailPrediction: string;
    gmailConfidence: number;
    outlookPrediction: string;
    outlookConfidence: number;
    yahooPrediction: string;
    yahooConfidence: number;
    promotionsRisk: number;
    spamRisk: number;
    recommendations: string[];
  };
  engagementScore: {
    score: number;
    status: string;
    openEngagement: string;
    clickEngagement: string;
    trend: string;
  };
  engagementAnalysis: {
    openRateAssessment: string;
    clickRateAssessment: string;
    bounceRateAssessment: string;
    suggestions: string[];
  };
  actionableRecommendations: Array<{
    priority: string;
    category: string;
    recommendation: string;
    expectedImpact: string;
  }>;
  benchmarkComparison: {
    openRateVsIndustry: string;
    clickRateVsIndustry: string;
    bounceRateVsIndustry: string;
  };
}

// Score gauge component
function ScoreGauge({ score, size = 'md', label, sublabel }: { 
  score: number; 
  size?: 'sm' | 'md' | 'lg';
  label: string;
  sublabel?: string;
}) {
  const uniqueId = useId();
  const getGradient = (s: number) => {
    if (s >= 80) return { 
      text: 'text-green-600 dark:text-green-400', 
      start: '#22c55e', 
      end: '#10b981',
      glow: 'drop-shadow-[0_0_8px_rgba(34,197,94,0.5)]'
    };
    if (s >= 60) return { 
      text: 'text-yellow-600 dark:text-yellow-400', 
      start: '#eab308', 
      end: '#f59e0b',
      glow: 'drop-shadow-[0_0_8px_rgba(234,179,8,0.5)]'
    };
    return { 
      text: 'text-red-600 dark:text-red-400', 
      start: '#ef4444', 
      end: '#f97316',
      glow: 'drop-shadow-[0_0_8px_rgba(239,68,68,0.5)]'
    };
  };
  
  const gradient = getGradient(score);
  const gradientId = `gauge-gradient-${uniqueId}`;
  const sizeClasses = {
    sm: 'w-14 h-14 text-lg',
    md: 'w-20 h-20 text-2xl',
    lg: 'w-24 h-24 text-3xl'
  };
  
  const circumference = 2 * Math.PI * 40;
  const strokeDashoffset = circumference - (score / 100) * circumference;
  
  return (
    <div className="flex flex-col items-center gap-1">
      <div className={`relative ${sizeClasses[size]} flex items-center justify-center ${gradient.glow}`}>
        <svg className="absolute inset-0 -rotate-90" viewBox="0 0 100 100">
          <defs>
            <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={gradient.start} />
              <stop offset="100%" stopColor={gradient.end} />
            </linearGradient>
          </defs>
          <circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" strokeWidth="8" className="text-muted-foreground/20" />
          <circle 
            cx="50" cy="50" r="40" fill="none" 
            stroke={`url(#${gradientId})`} strokeWidth="8" 
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-1000"
          />
        </svg>
        <span className={`font-bold ${gradient.text}`}>{score}</span>
      </div>
      <p className="text-xs text-muted-foreground text-center">{label}</p>
      {sublabel && <p className={`text-xs font-medium ${gradient.text}`}>{sublabel}</p>}
    </div>
  );
}

// Provider prediction card
function ProviderPredictionCard({ 
  provider, 
  prediction, 
  confidence,
  icon: Icon,
  color,
  isNewSender = false
}: { 
  provider: string;
  prediction: string;
  confidence: number;
  icon: any;
  color: string;
  isNewSender?: boolean;
}) {
  const getPredictionColor = (pred: string) => {
    const lowerPred = pred.toLowerCase();
    if (lowerPred.includes('primary') || lowerPred.includes('focused') || lowerPred.includes('inbox')) return 'text-green-600 dark:text-green-400';
    if (lowerPred.includes('promotions') || lowerPred.includes('other')) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };
  
  return (
    <div className="p-3 rounded-lg bg-muted/50 border border-border space-y-2">
      <div className="flex items-center gap-2">
        <Icon className={`w-4 h-4 ${color}`} />
        <span className="text-sm font-medium">{provider}</span>
        {isNewSender && (
          <Badge variant="outline" className="text-xs ml-auto px-1.5 py-0 text-blue-400 border-blue-400/30">
            Content-based
          </Badge>
        )}
      </div>
      <div className="flex items-center justify-between">
        <span className={`text-sm font-semibold ${getPredictionColor(prediction)}`}>{prediction}</span>
        <span className="text-xs text-muted-foreground">{confidence}% confident</span>
      </div>
    </div>
  );
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
    if (rate < 1) return 'text-green-600 dark:text-green-400';
    if (rate < 3) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  }
  if (type === 'open') {
    if (rate >= 25) return 'text-green-600 dark:text-green-400';
    if (rate >= 15) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  }
  if (type === 'click') {
    if (rate >= 3) return 'text-green-600 dark:text-green-400';
    if (rate >= 1.5) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
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
  gradient,
  tooltip
}: { 
  title: string;
  value: string | number;
  subValue?: string;
  icon: React.ElementType;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  gradient: string;
  tooltip?: string;
}) {
  const cardContent = (
    <Card className="border-border bg-gradient-to-br from-muted/50 to-transparent cursor-help" data-testid={`stat-card-${title.toLowerCase().replace(/\s+/g, '-')}`}>
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
              <ArrowUpRight className="w-3 h-3 text-green-600 dark:text-green-400" />
            ) : trend === 'down' ? (
              <ArrowDownRight className="w-3 h-3 text-red-600 dark:text-red-400" />
            ) : (
              <Activity className="w-3 h-3 text-muted-foreground" />
            )}
            <span className={trend === 'up' ? 'text-green-600 dark:text-green-400' : trend === 'down' ? 'text-red-600 dark:text-red-400' : 'text-muted-foreground'}>
              {trendValue}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );

  if (tooltip) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          {cardContent}
        </TooltipTrigger>
        <TooltipContent className="max-w-xs text-sm" side="top">
          <p>{tooltip}</p>
        </TooltipContent>
      </Tooltip>
    );
  }

  return cardContent;
}

function CampaignRow({ 
  campaign, 
  provider,
  onClick 
}: { 
  campaign: ESPCampaignStats; 
  provider: string;
  onClick: () => void;
}) {
  return (
    <button 
      type="button"
      onClick={onClick}
      className="w-full text-left flex flex-col md:flex-row md:items-center gap-3 md:gap-4 p-4 border border-border rounded-xl bg-muted/50 hover:bg-muted hover:border-purple-500/30 transition-all cursor-pointer group"
      data-testid={`campaign-row-${campaign.campaignId}`}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          {campaign.isManual ? (
            <Badge variant="outline" className="text-xs border-purple-500/50 text-purple-600 dark:text-purple-400" data-testid={`badge-manual-${campaign.campaignId}`}>
              Manual
            </Badge>
          ) : (
            <Badge variant="secondary" className="text-xs" data-testid={`badge-provider-${campaign.campaignId}`}>
              {ESP_PROVIDER_NAMES[provider] || provider}
            </Badge>
          )}
          <span className="text-xs text-muted-foreground">{formatDate(campaign.sentAt)}</span>
          <ExternalLink className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity ml-auto" />
        </div>
        <p className="font-medium truncate group-hover:text-purple-600 dark:group-hover:text-purple-300 transition-colors" data-testid={`text-campaign-name-${campaign.campaignId}`}>
          {campaign.campaignName}
        </p>
        {campaign.subject && (
          <p className="text-sm text-muted-foreground truncate" data-testid={`text-subject-${campaign.campaignId}`}>
            {campaign.subject}
          </p>
        )}
      </div>
      
      <div className="flex flex-wrap gap-4 md:gap-6 text-sm">
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-1.5 cursor-help" data-testid={`metric-sent-${campaign.campaignId}`}>
              <Mail className="w-4 h-4 text-muted-foreground" />
              <span className="font-medium">{formatNumber(campaign.totalSent)}</span>
              <span className="text-muted-foreground text-xs">sent</span>
            </div>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="max-w-[200px]">
            <p className="font-medium">Emails Sent</p>
            <p className="text-xs text-muted-foreground">Total number of emails sent in this campaign</p>
          </TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-1.5 cursor-help" data-testid={`metric-open-rate-${campaign.campaignId}`}>
              <Eye className="w-4 h-4 text-muted-foreground" />
              <span className={`font-medium ${getRateColor(campaign.openRate, 'open')}`}>
                {campaign.openRate.toFixed(1)}%
              </span>
              <span className="text-muted-foreground text-xs">opens</span>
            </div>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="max-w-[220px]">
            <p className="font-medium">Open Rate</p>
            <p className="text-xs text-muted-foreground mb-1">Percentage of recipients who opened your email</p>
            <div className="text-xs space-y-0.5 pt-1 border-t border-border">
              <p><span className="text-green-400">25%+</span> = Excellent</p>
              <p><span className="text-yellow-400">15-25%</span> = Average</p>
              <p><span className="text-red-400">&lt;15%</span> = Needs work</p>
            </div>
          </TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-1.5 cursor-help" data-testid={`metric-click-rate-${campaign.campaignId}`}>
              <MousePointerClick className="w-4 h-4 text-muted-foreground" />
              <span className={`font-medium ${getRateColor(campaign.clickRate, 'click')}`}>
                {campaign.clickRate.toFixed(1)}%
              </span>
              <span className="text-muted-foreground text-xs">clicks</span>
            </div>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="max-w-[220px]">
            <p className="font-medium">Click Rate</p>
            <p className="text-xs text-muted-foreground mb-1">Percentage of recipients who clicked a link</p>
            <div className="text-xs space-y-0.5 pt-1 border-t border-border">
              <p><span className="text-green-400">3%+</span> = Excellent</p>
              <p><span className="text-yellow-400">1.5-3%</span> = Average</p>
              <p><span className="text-red-400">&lt;1.5%</span> = Needs work</p>
            </div>
          </TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-1.5 cursor-help" data-testid={`metric-bounce-rate-${campaign.campaignId}`}>
              <AlertTriangle className="w-4 h-4 text-muted-foreground" />
              <span className={`font-medium ${getRateColor(campaign.bounceRate, 'bounce')}`}>
                {campaign.bounceRate.toFixed(1)}%
              </span>
              <span className="text-muted-foreground text-xs">bounces</span>
            </div>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="max-w-[220px]">
            <p className="font-medium">Bounce Rate</p>
            <p className="text-xs text-muted-foreground mb-1">Percentage of emails that couldn't be delivered</p>
            <div className="text-xs space-y-0.5 pt-1 border-t border-border">
              <p><span className="text-green-400">&lt;1%</span> = Excellent</p>
              <p><span className="text-yellow-400">1-3%</span> = Average</p>
              <p><span className="text-red-400">3%+</span> = Clean your list</p>
            </div>
          </TooltipContent>
        </Tooltip>
      </div>
    </button>
  );
}

// Campaign Detail Modal
function CampaignDetailModal({ 
  campaign, 
  provider, 
  isOpen, 
  onClose,
  onCopyToGrader,
  onAnalyzeFullEmail
}: { 
  campaign: ESPCampaignStats | null; 
  provider: string;
  isOpen: boolean;
  onClose: () => void;
  onCopyToGrader: (subject: string) => void;
  onAnalyzeFullEmail: (provider: string, campaignId: string) => void;
}) {
  const { toast } = useToast();
  const [isLoadingContent, setIsLoadingContent] = useState(false);
  const [emailContent, setEmailContent] = useState<{ htmlContent?: string; textContent?: string; subject?: string; previewText?: string } | null>(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [prevCampaignId, setPrevCampaignId] = useState<string | null>(null);

  if (campaign && campaign.campaignId !== prevCampaignId) {
    setPrevCampaignId(campaign.campaignId);
    setEmailContent(null);
    setIsLoadingPreview(false);
    setIsLoadingContent(false);
  }
  
  if (!campaign) return null;
  
  const isManualCampaign = campaign.campaignId.startsWith('hl-manual-');
  const supportsContent = ['sendgrid', 'mailchimp', 'hubspot', 'klaviyo', 'ontraport'].includes(provider);
  
  const copySubject = () => {
    if (campaign.subject) {
      navigator.clipboard.writeText(campaign.subject);
      toast({
        title: "Copied!",
        description: "Subject line copied to clipboard",
      });
    }
  };

  const handlePreviewEmail = async () => {
    if (isManualCampaign || !supportsContent) return;
    setIsLoadingPreview(true);
    try {
      const response = await fetch(`/api/esp/${provider}/campaign/${campaign.campaignId}/content`, {
        credentials: 'include',
      });
      if (!response.ok) {
        toast({
          title: "Preview Not Available",
          description: "Could not fetch email content from your ESP",
          variant: "destructive",
        });
        return;
      }
      const data = await response.json();
      if (data.success === false) {
        toast({
          title: "Preview Not Available",
          description: data.error || "Could not fetch email content",
          variant: "destructive",
        });
        return;
      }
      setEmailContent({
        htmlContent: data.htmlContent || '',
        textContent: data.textContent || '',
        subject: data.subject || '',
        previewText: data.previewText || '',
      });
    } catch {
      toast({
        title: "Error",
        description: "Failed to load email preview",
        variant: "destructive",
      });
    } finally {
      setIsLoadingPreview(false);
    }
  };

  const handleAnalyzeFullEmail = async () => {
    if (isManualCampaign) {
      toast({
        title: "Not Available",
        description: "Email body is not available for manually entered campaigns",
        variant: "destructive",
      });
      return;
    }
    if (!supportsContent) {
      toast({
        title: "Not Supported",
        description: `${ESP_PROVIDER_NAMES[provider] || provider} doesn't support fetching email content`,
        variant: "destructive",
      });
      return;
    }
    setIsLoadingContent(true);
    try {
      onAnalyzeFullEmail(provider, campaign.campaignId);
    } finally {
      setIsLoadingContent(false);
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl" data-testid="campaign-detail-modal">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5 text-purple-400" />
            Campaign Details
          </DialogTitle>
          <DialogDescription>
            View campaign performance and copy content to the email grader
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-xs">
                {ESP_PROVIDER_NAMES[provider] || provider}
              </Badge>
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {formatDate(campaign.sentAt)}
              </span>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold">{campaign.campaignName}</h3>
            </div>
            
            {campaign.subject && (
              <div className="p-4 rounded-xl bg-muted/50 border border-border space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Subject Line</p>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={copySubject}
                    className="h-7 gap-1 text-xs"
                    data-testid="button-copy-subject"
                  >
                    <Copy className="w-3 h-3" />
                    Copy
                  </Button>
                </div>
                <p className="font-medium text-lg">{campaign.subject}</p>
              </div>
            )}
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-3 rounded-lg bg-muted/50 border border-border text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Send className="w-4 h-4 text-blue-400" />
              </div>
              <p className="text-xl font-bold">{formatNumber(campaign.totalSent)}</p>
              <p className="text-xs text-muted-foreground">Sent</p>
            </div>
            <div className="p-3 rounded-lg bg-muted/50 border border-border text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Eye className="w-4 h-4 text-purple-400" />
              </div>
              <p className={`text-xl font-bold ${getRateColor(campaign.openRate, 'open')}`}>
                {campaign.openRate.toFixed(1)}%
              </p>
              <p className="text-xs text-muted-foreground">Open Rate</p>
            </div>
            <div className="p-3 rounded-lg bg-muted/50 border border-border text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <MousePointerClick className="w-4 h-4 text-green-400" />
              </div>
              <p className={`text-xl font-bold ${getRateColor(campaign.clickRate, 'click')}`}>
                {campaign.clickRate.toFixed(1)}%
              </p>
              <p className="text-xs text-muted-foreground">Click Rate</p>
            </div>
            <div className="p-3 rounded-lg bg-muted/50 border border-border text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <AlertTriangle className="w-4 h-4 text-yellow-400" />
              </div>
              <p className={`text-xl font-bold ${getRateColor(campaign.bounceRate, 'bounce')}`}>
                {campaign.bounceRate.toFixed(1)}%
              </p>
              <p className="text-xs text-muted-foreground">Bounce Rate</p>
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div className="text-center">
              <p className="font-medium">{formatNumber(campaign.delivered)}</p>
              <p className="text-xs text-muted-foreground">Delivered</p>
            </div>
            <div className="text-center">
              <p className="font-medium">{formatNumber(campaign.opened)}</p>
              <p className="text-xs text-muted-foreground">Opened</p>
            </div>
            <div className="text-center">
              <p className="font-medium">{formatNumber(campaign.clicked)}</p>
              <p className="text-xs text-muted-foreground">Clicked</p>
            </div>
          </div>
          
          {supportsContent && !isManualCampaign && !emailContent && (
            <div className="flex justify-center">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePreviewEmail}
                disabled={isLoadingPreview}
                className="gap-2"
                data-testid="button-preview-email"
              >
                {isLoadingPreview ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Loading Preview...
                  </>
                ) : (
                  <>
                    <Eye className="w-4 h-4" />
                    Preview Email
                  </>
                )}
              </Button>
            </div>
          )}

          {emailContent && (
            <div className="space-y-3 border border-border rounded-xl overflow-hidden" data-testid="email-preview-container">
              <div className="p-3 bg-muted/50 border-b border-border space-y-2">
                {emailContent.subject && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground uppercase tracking-wide">Subject:</span>
                    <span className="text-sm font-medium" data-testid="preview-subject">{emailContent.subject}</span>
                  </div>
                )}
                {emailContent.previewText && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground uppercase tracking-wide">Preview:</span>
                    <span className="text-sm text-muted-foreground" data-testid="preview-text">{emailContent.previewText}</span>
                  </div>
                )}
              </div>
              <div className="max-h-64 overflow-y-auto" data-testid="email-preview-body">
                {emailContent.htmlContent ? (
                  <iframe
                    srcDoc={emailContent.htmlContent}
                    className="w-full h-64 border-0 bg-white"
                    sandbox=""
                    title="Email Preview"
                    data-testid="email-preview-iframe"
                  />
                ) : emailContent.textContent ? (
                  <pre className="p-3 text-sm whitespace-pre-wrap font-sans" data-testid="email-preview-text-content">
                    {emailContent.textContent}
                  </pre>
                ) : (
                  <p className="p-3 text-sm text-muted-foreground text-center">No email body content available</p>
                )}
              </div>
            </div>
          )}

          <div className="pt-4 border-t border-border space-y-3">
            {campaign.subject && (
              <div>
                <Button 
                  onClick={() => onCopyToGrader(campaign.subject || '')}
                  className="w-full gap-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                  data-testid="button-copy-to-grader"
                >
                  <Sparkles className="w-4 h-4" />
                  Grade Subject Line
                </Button>
                <p className="text-xs text-muted-foreground text-center mt-2">
                  Opens the email grader with your subject line pre-filled
                </p>
              </div>
            )}
            
            {supportsContent && !isManualCampaign && (
              <div>
                <Button 
                  onClick={handleAnalyzeFullEmail}
                  variant="outline"
                  className="w-full gap-2"
                  disabled={isLoadingContent}
                  data-testid="button-analyze-full-email"
                >
                  {isLoadingContent ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Loading Email Content...
                    </>
                  ) : (
                    <>
                      <Mail className="w-4 h-4" />
                      Grade This Email
                    </>
                  )}
                </Button>
                <p className="text-xs text-muted-foreground text-center mt-2">
                  Fetches the email content from your ESP and analyzes it
                </p>
              </div>
            )}

            {isManualCampaign && (
              <div className="p-3 rounded-lg bg-muted/50 text-center">
                <p className="text-xs text-muted-foreground">
                  Email body analysis is not available for manually entered campaigns
                </p>
              </div>
            )}

            {!supportsContent && !isManualCampaign && (
              <div className="p-3 rounded-lg bg-muted/50 text-center">
                <p className="text-xs text-muted-foreground">
                  Email body analysis is not yet supported for {ESP_PROVIDER_NAMES[provider] || provider}
                </p>
              </div>
            )}
          </div>
          
          {!campaign.subject && (
            <div className="p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/20 text-center">
              <AlertTriangle className="w-6 h-6 text-yellow-400 mx-auto mb-2" />
              <p className="text-sm text-yellow-400">No subject line available</p>
              <p className="text-xs text-muted-foreground mt-1">
                This campaign doesn't have a subject line stored in your ESP
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface ESPStatsDashboardProps {
  onAnalyzeSubject?: (subject: string) => void;
  onNavigateToFunnel?: () => void;
}

const HIGHLEVEL_MANUAL_CAMPAIGNS_KEY = 'highlevel_manual_campaigns';

interface ManualCampaignForm {
  campaignName: string;
  subject: string;
  sentAt: string;
  totalSent: string;
  delivered: string;
  opened: string;
  clicked: string;
  bounced: string;
  softBounced: string;
  hardBounced: string;
  unsubscribed: string;
  spamReports: string;
  forwards: string;
  revenue: string;
  avgTimeToOpen: string;
}

const emptyManualCampaignForm: ManualCampaignForm = {
  campaignName: '',
  subject: '',
  sentAt: '',
  totalSent: '',
  delivered: '',
  opened: '',
  clicked: '',
  bounced: '',
  softBounced: '',
  hardBounced: '',
  unsubscribed: '',
  spamReports: '',
  forwards: '',
  revenue: '',
  avgTimeToOpen: '',
};

export function ESPStatsDashboard({ onAnalyzeSubject, onNavigateToFunnel }: ESPStatsDashboardProps) {
  const { toast } = useToast();
  const { user, isLoading: isAuthLoading } = useAuth();
  const [stats, setStats] = useState<ESPStatsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<ESPStatsAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showAnalysis, setShowAnalysis] = useState(true);
  const [selectedCampaign, setSelectedCampaign] = useState<{ campaign: ESPCampaignStats; provider: string } | null>(null);
  const [showManualEntryForm, setShowManualEntryForm] = useState(false);
  const [manualCampaignForm, setManualCampaignForm] = useState<ManualCampaignForm>(emptyManualCampaignForm);
  const [manualCampaigns, setManualCampaigns] = useState<ESPCampaignStats[]>([]);
  const [showAllCampaigns, setShowAllCampaigns] = useState(false);

  // Load manual campaigns from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(HIGHLEVEL_MANUAL_CAMPAIGNS_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as ESPCampaignStats[];
        setManualCampaigns(parsed);
      }
    } catch (e) {
      // Ignore parse errors
    }
  }, []);

  const saveManualCampaign = () => {
    const sent = parseInt(manualCampaignForm.totalSent) || 0;
    const delivered = parseInt(manualCampaignForm.delivered) || sent;
    const opened = parseInt(manualCampaignForm.opened) || 0;
    const clicked = parseInt(manualCampaignForm.clicked) || 0;
    const bounced = parseInt(manualCampaignForm.bounced) || 0;
    const softBounced = parseInt(manualCampaignForm.softBounced) || 0;
    const hardBounced = parseInt(manualCampaignForm.hardBounced) || 0;
    const unsubscribed = parseInt(manualCampaignForm.unsubscribed) || 0;
    const spamReports = parseInt(manualCampaignForm.spamReports) || 0;
    const forwards = parseInt(manualCampaignForm.forwards) || 0;
    const revenue = parseFloat(manualCampaignForm.revenue) || 0;
    const avgTimeToOpen = parseFloat(manualCampaignForm.avgTimeToOpen) || 0;

    if (!manualCampaignForm.campaignName.trim()) {
      toast({
        title: "Campaign name required",
        description: "Please enter a name for this campaign",
        variant: "destructive",
      });
      return;
    }

    if (sent <= 0) {
      toast({
        title: "Invalid sent count",
        description: "Please enter the number of emails sent",
        variant: "destructive",
      });
      return;
    }

    const openRate = delivered > 0 ? (opened / delivered) * 100 : 0;
    const clickRate = delivered > 0 ? (clicked / delivered) * 100 : 0;

    const newCampaign: ESPCampaignStats = {
      campaignId: `hl-manual-${Date.now()}`,
      campaignName: manualCampaignForm.campaignName.trim(),
      subject: manualCampaignForm.subject.trim() || undefined,
      sentAt: manualCampaignForm.sentAt || new Date().toISOString(),
      totalSent: sent,
      delivered,
      opened,
      clicked,
      bounced,
      softBounced,
      hardBounced,
      unsubscribed,
      spamReports,
      forwards,
      revenue: Math.round(revenue * 100),
      avgTimeToOpen: Math.round(avgTimeToOpen * 60),
      openRate,
      clickRate,
      bounceRate: sent > 0 ? (bounced / sent) * 100 : 0,
      softBounceRate: sent > 0 ? (softBounced / sent) * 100 : 0,
      hardBounceRate: sent > 0 ? (hardBounced / sent) * 100 : 0,
      unsubscribeRate: delivered > 0 ? (unsubscribed / delivered) * 100 : 0,
      spamRate: delivered > 0 ? (spamReports / delivered) * 100 : 0,
      forwardRate: delivered > 0 ? (forwards / delivered) * 100 : 0,
      revenuePerEmail: sent > 0 ? revenue / sent : 0,
      clickToOpenRate: opened > 0 ? (clicked / opened) * 100 : 0,
    };

    const updatedCampaigns = [...manualCampaigns, newCampaign];
    setManualCampaigns(updatedCampaigns);
    localStorage.setItem(HIGHLEVEL_MANUAL_CAMPAIGNS_KEY, JSON.stringify(updatedCampaigns));
    
    setManualCampaignForm(emptyManualCampaignForm);
    setShowManualEntryForm(false);
    
    toast({
      title: "Campaign added!",
      description: `"${newCampaign.campaignName}" has been added to your stats`,
    });
  };

  const deleteManualCampaign = (campaignId: string) => {
    const updatedCampaigns = manualCampaigns.filter(c => c.campaignId !== campaignId);
    setManualCampaigns(updatedCampaigns);
    localStorage.setItem(HIGHLEVEL_MANUAL_CAMPAIGNS_KEY, JSON.stringify(updatedCampaigns));
    
    toast({
      title: "Campaign removed",
      description: "The campaign has been removed from your stats",
    });
  };

  const handleCopyToGrader = (subject: string) => {
    setSelectedCampaign(null);
    if (onAnalyzeSubject && subject && subject.trim()) {
      onAnalyzeSubject(subject);
      toast({
        title: "Subject copied!",
        description: "Opening the email grader with your subject line",
      });
    } else if (!subject || !subject.trim()) {
      toast({
        title: "No subject line",
        description: "This campaign doesn't have a subject line to analyze",
        variant: "destructive",
      });
    }
  };

  const handleAnalyzeFullEmail = async (provider: string, campaignId: string) => {
    try {
      const response = await fetch(`/api/esp/${provider}/campaign/${campaignId}/content`, {
        credentials: 'include',
      });
      
      if (!response.ok) {
        toast({
          title: "Content Not Available",
          description: "Could not fetch email content from your ESP",
          variant: "destructive",
        });
        return;
      }
      
      const data = await response.json();
      
      // Check for explicit failure
      if (data.success === false) {
        toast({
          title: "Content Not Available",
          description: data.error || "Could not fetch email content from your ESP",
          variant: "destructive",
        });
        return;
      }
      
      // Check if we have actual content
      const htmlContent = data.htmlContent || '';
      const textContentFromResponse = data.textContent || '';
      
      if (!htmlContent && !textContentFromResponse) {
        toast({
          title: "No Email Content Found",
          description: "This campaign doesn't have email body content available in your ESP",
          variant: "destructive",
        });
        return;
      }
      
      // Extract text content from HTML for grading, using DOMParser for safe extraction
      let textContent = textContentFromResponse;
      if (!textContent && htmlContent) {
        try {
          const parser = new DOMParser();
          const doc = parser.parseFromString(htmlContent, 'text/html');
          
          // Remove script, style, and other non-content elements
          const elementsToRemove = doc.querySelectorAll('script, style, noscript, svg, head, meta, link');
          elementsToRemove.forEach(el => el.remove());
          
          // Get text content preserving paragraph structure
          const bodyContent = doc.body?.textContent || doc.documentElement?.textContent || '';
          // Normalize whitespace: collapse multiple spaces/newlines but preserve paragraph breaks
          textContent = bodyContent
            .replace(/\s+/g, ' ')
            .replace(/\s*\n\s*/g, '\n')
            .trim();
        } catch {
          // Fallback to simple regex approach
          const cleanHtml = htmlContent.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
            .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');
          const tempDiv = document.createElement('div');
          tempDiv.innerHTML = cleanHtml;
          textContent = tempDiv.textContent || tempDiv.innerText || '';
        }
      }
      
      // Check if extracted content is meaningful
      const cleanedText = textContent.trim();
      if (!cleanedText || cleanedText.length < 10) {
        toast({
          title: "Insufficient Content",
          description: "The email content retrieved is too short to analyze",
          variant: "destructive",
        });
        return;
      }
      
      // Build full email content for analysis
      const subject = data.subject || selectedCampaign?.campaign?.subject || '';
      const previewText = data.previewText || '';
      let fullContent = '';
      if (subject) fullContent += `Subject: ${subject}\n`;
      if (previewText) fullContent += `Preview Text: ${previewText}\n`;
      if (fullContent) fullContent += '\n';
      fullContent += cleanedText;
      
      setSelectedCampaign(null);
      
      if (onAnalyzeSubject) {
        onAnalyzeSubject(fullContent);
        toast({
          title: "Email content loaded!",
          description: "Opening the email grader with your full email",
        });
      }
    } catch (error) {
      toast({
        title: "Failed to load content",
        description: "There was an error fetching the email content",
        variant: "destructive",
      });
    }
  };

  const isScaleMember = user?.subscriptionTier === 'scale';

  if (isAuthLoading) {
    return (
      <div className="space-y-6">
        <Card className="border-border bg-gradient-to-br from-muted/50 to-transparent" data-testid="esp-stats-loading">
          <CardContent className="p-8">
            <div className="flex items-center justify-center gap-3">
              <Loader2 className="w-6 h-6 animate-spin text-purple-400" />
              <p className="text-muted-foreground">Loading ESP Stats Dashboard...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isScaleMember) {
    return (
      <div className="space-y-6">
        <Card className="border-purple-500/20 bg-gradient-to-br from-purple-500/5 to-pink-500/5" data-testid="scale-only-esp-stats">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mb-4">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-2xl">Scale Plan Required</CardTitle>
            <CardDescription className="text-base mt-2">
              ESP Stats Dashboard is an exclusive feature for Scale plan members.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div className="p-4 rounded-xl bg-muted/50 border border-border">
                <Target className="w-6 h-6 mx-auto mb-2 text-purple-400" />
                <p className="font-medium text-sm">Inbox Prediction</p>
                <p className="text-xs text-muted-foreground">AI-powered analysis</p>
              </div>
              <div className="p-4 rounded-xl bg-muted/50 border border-border">
                <Activity className="w-6 h-6 mx-auto mb-2 text-pink-400" />
                <p className="font-medium text-sm">Health Scoring</p>
                <p className="text-xs text-muted-foreground">Comprehensive grades</p>
              </div>
              <div className="p-4 rounded-xl bg-muted/50 border border-border">
                <BarChart3 className="w-6 h-6 mx-auto mb-2 text-blue-400" />
                <p className="font-medium text-sm">Deep Analytics</p>
                <p className="text-xs text-muted-foreground">Beyond ESP dashboards</p>
              </div>
              <div className="p-4 rounded-xl bg-muted/50 border border-border">
                <Zap className="w-6 h-6 mx-auto mb-2 text-yellow-400" />
                <p className="font-medium text-sm">Action Items</p>
                <p className="text-xs text-muted-foreground">Prioritized steps</p>
              </div>
            </div>
            <p className="text-center text-muted-foreground">
              Connect your email service provider and get AI-powered insights on your email deliverability, 
              inbox placement predictions, and personalized recommendations to improve your sender reputation.
            </p>
            <div className="flex justify-center">
              <Button asChild className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600" data-testid="button-upgrade-scale">
                <a href="/pricing">Upgrade to Scale</a>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

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

  const analyzeStats = async () => {
    console.log('[ESPStats] analyzeStats called', { 
      hasStats: !!stats, 
      hasCombinedStats: !!stats?.combinedStats,
      campaignsLength: stats?.combinedStats?.campaigns?.length 
    });
    if (!stats?.combinedStats?.campaigns?.length) {
      console.log('[ESPStats] No campaigns available for analysis');
      return;
    }
    
    setIsAnalyzing(true);
    try {
      const allCampaigns = stats.combinedStats.campaigns.map(c => ({
        campaignName: c.campaignName,
        subject: c.subject,
        totalSent: c.totalSent,
        openRate: c.openRate,
        clickRate: c.clickRate,
        bounceRate: c.bounceRate,
        isManual: c.isManual || false,
      }));

      const response = await fetch('/api/esp/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stats: {
            ...stats.combinedStats.totals,
            campaigns: allCampaigns,
          }
        })
      });

      if (!response.ok) {
        throw new Error('Failed to analyze stats');
      }

      const data = await response.json();
      setAnalysis(data);
      toast({
        title: "Analysis Complete",
        description: "AI-powered insights are now available.",
      });
    } catch (err: any) {
      toast({
        title: "Analysis Failed",
        description: err.message || "Failed to analyze campaign statistics",
        variant: "destructive"
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

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
  const hasOnlyManualData = hasNoProviders && stats.combinedStats && stats.combinedStats.campaigns.length > 0;

  if (hasNoProviders && !hasOnlyManualData) {
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
        
        <ManualCampaignStatsForm />
      </div>
    );
  }

  const totals = stats.combinedStats?.totals;
  
  const allCampaigns: Array<{ campaign: ESPCampaignStats; provider: string }> = 
    stats.combinedStats?.campaigns?.map(campaign => ({
      campaign,
      provider: campaign.isManual ? 'manual' : 
        stats.providers.find(p => 
          p.stats?.campaigns?.some(c => c.campaignId === campaign.campaignId)
        )?.provider || 'unknown'
    })) || [];

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
            {hasOnlyManualData ? (
              `Performance metrics from ${totals?.manualCampaignCount || 0} manual campaign${(totals?.manualCampaignCount || 0) !== 1 ? 's' : ''}.`
            ) : (
              <>
                Performance metrics from {stats.providers.filter(p => p.stats !== null).length} connected provider{stats.providers.filter(p => p.stats !== null).length !== 1 ? 's' : ''}
                {totals?.manualCampaignCount ? ` + ${totals.manualCampaignCount} manual campaign${totals.manualCampaignCount !== 1 ? 's' : ''}` : ''}.
              </>
            )}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
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
          <Button 
            onClick={analyzeStats} 
            disabled={isAnalyzing || !stats?.combinedStats}
            className="gap-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
            data-testid="button-analyze-stats"
          >
            {isAnalyzing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Brain className="w-4 h-4" />
            )}
            Analyze with AI
          </Button>
          <Button 
            variant="outline"
            className="gap-2"
            onClick={onNavigateToFunnel}
            data-testid="button-funnel-analysis"
          >
            <Filter className="w-4 h-4" />
            Funnel Analysis
          </Button>
        </div>
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
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
              tooltip="Percentage of delivered emails that were opened. Ideal: Above 20%. Industry average is 15-25% depending on your niche."
            />
            <StatCard
              title="Avg Click Rate"
              value={`${(totals?.avgClickRate || 0).toFixed(1)}%`}
              subValue={`${formatNumber(totals?.totalClicked || 0)} clicks`}
              icon={MousePointerClick}
              trend={totals?.avgClickRate && totals.avgClickRate >= 2.5 ? 'up' : totals?.avgClickRate && totals.avgClickRate >= 1.5 ? 'neutral' : 'down'}
              trendValue={totals?.avgClickRate && totals.avgClickRate >= 2.5 ? 'Above average' : totals?.avgClickRate && totals.avgClickRate >= 1.5 ? 'Average' : 'Below average'}
              gradient="from-emerald-500 to-green-500"
              tooltip="Percentage of delivered emails where a link was clicked. Ideal: Above 2.5%. Shows how effective your calls-to-action are."
            />
            <StatCard
              title="Avg Bounce Rate"
              value={`${(totals?.avgBounceRate || 0).toFixed(1)}%`}
              subValue="Lower is better"
              icon={AlertTriangle}
              trend={(totals?.avgBounceRate ?? 0) < 1 ? 'up' : (totals?.avgBounceRate ?? 0) < 3 ? 'neutral' : 'down'}
              trendValue={(totals?.avgBounceRate ?? 0) < 1 ? 'Excellent' : (totals?.avgBounceRate ?? 0) < 3 ? 'Acceptable' : 'Needs attention'}
              gradient="from-orange-500 to-red-500"
              tooltip="Percentage of emails that failed to deliver. Ideal: Below 2%. High rates damage sender reputation. Note: Some providers (e.g. Ontraport) do not expose bounce data through their API."
            />
            <StatCard
              title="Avg Skip Rate"
              value={`${(totals?.avgSkipRate || 0).toFixed(1)}%`}
              subValue={`${formatNumber(totals?.totalSkipped || 0)} skipped`}
              icon={XCircle}
              trend={(totals?.avgSkipRate ?? 0) < 5 ? 'up' : (totals?.avgSkipRate ?? 0) < 15 ? 'neutral' : 'down'}
              trendValue={(totals?.avgSkipRate ?? 0) < 5 ? 'Excellent' : (totals?.avgSkipRate ?? 0) < 15 ? 'Acceptable' : 'List quality issue'}
              gradient="from-yellow-500 to-amber-500"
              tooltip="Emails not sent due to invalid addresses or opt-outs. Ideal: Below 5%. High rates indicate list hygiene issues."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <StatCard
              title="Unsubscribe Rate"
              value={`${(totals?.avgUnsubscribeRate || 0).toFixed(2)}%`}
              subValue={`${formatNumber(totals?.totalUnsubscribed || 0)} unsubscribes`}
              icon={UserMinus}
              trend={(totals?.avgUnsubscribeRate ?? 0) < 0.5 ? 'up' : (totals?.avgUnsubscribeRate ?? 0) < 2 ? 'neutral' : 'down'}
              trendValue={(totals?.avgUnsubscribeRate ?? 0) < 0.5 ? 'Excellent' : (totals?.avgUnsubscribeRate ?? 0) < 2 ? 'Acceptable' : 'High unsubs'}
              gradient="from-amber-500 to-orange-500"
              tooltip="Percentage of recipients who clicked unsubscribe. Ideal: Below 0.5%. High rates signal content mismatch or sending too frequently."
            />
            <StatCard
              title="Spam Complaint Rate"
              value={`${(totals?.avgSpamRate || 0).toFixed(3)}%`}
              subValue={`${formatNumber(totals?.totalSpamReports || 0)} complaints`}
              icon={AlertTriangle}
              trend={(totals?.avgSpamRate ?? 0) < 0.1 ? 'up' : (totals?.avgSpamRate ?? 0) < 0.3 ? 'neutral' : 'down'}
              trendValue={(totals?.avgSpamRate ?? 0) < 0.1 ? 'Safe zone' : (totals?.avgSpamRate ?? 0) < 0.3 ? 'Warning' : 'Critical'}
              gradient="from-red-500 to-rose-600"
              tooltip="Percentage of recipients marking your email as spam. Ideal: Below 0.1%. Above 0.3% risks blocklisting by major providers."
            />
            <StatCard
              title="Forward Rate"
              value={`${(totals?.avgForwardRate || 0).toFixed(2)}%`}
              subValue={`${formatNumber(totals?.totalForwards || 0)} forwards`}
              icon={Share2}
              trend={(totals?.avgForwardRate ?? 0) > 1 ? 'up' : (totals?.avgForwardRate ?? 0) > 0.5 ? 'neutral' : 'down'}
              trendValue={(totals?.avgForwardRate ?? 0) > 1 ? 'Viral content' : (totals?.avgForwardRate ?? 0) > 0.5 ? 'Good' : 'Low sharing'}
              gradient="from-cyan-500 to-blue-500"
              tooltip="Percentage of recipients who forwarded your email. Ideal: Above 0.5%. High rates indicate highly shareable, valuable content."
            />
            <StatCard
              title="Soft Bounce Rate"
              value={`${(totals?.avgSoftBounceRate || 0).toFixed(2)}%`}
              subValue={`${formatNumber(totals?.totalSoftBounced || 0)} soft bounces`}
              icon={RefreshCw}
              trend={(totals?.avgSoftBounceRate ?? 0) < 2 ? 'up' : (totals?.avgSoftBounceRate ?? 0) < 5 ? 'neutral' : 'down'}
              trendValue={(totals?.avgSoftBounceRate ?? 0) < 2 ? 'Normal' : (totals?.avgSoftBounceRate ?? 0) < 5 ? 'Elevated' : 'High'}
              gradient="from-yellow-400 to-orange-400"
              tooltip="Temporary delivery failures (full inbox, server issues). Ideal: Below 2%. These may succeed on retry but high rates suggest list quality issues."
            />
            <StatCard
              title="Hard Bounce Rate"
              value={`${(totals?.avgHardBounceRate || 0).toFixed(2)}%`}
              subValue={`${formatNumber(totals?.totalHardBounced || 0)} hard bounces`}
              icon={XOctagon}
              trend={(totals?.avgHardBounceRate ?? 0) < 0.5 ? 'up' : (totals?.avgHardBounceRate ?? 0) < 2 ? 'neutral' : 'down'}
              trendValue={(totals?.avgHardBounceRate ?? 0) < 0.5 ? 'Clean list' : (totals?.avgHardBounceRate ?? 0) < 2 ? 'Needs cleaning' : 'Critical'}
              gradient="from-red-600 to-red-700"
              tooltip="Permanent delivery failures (invalid addresses). Ideal: Below 0.5%. Remove these addresses immediately to protect sender reputation."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Click-to-Open Rate"
              value={`${(totals?.clickToOpenRate || 0).toFixed(1)}%`}
              subValue="Content effectiveness"
              icon={Target}
              trend={(totals?.clickToOpenRate ?? 0) > 15 ? 'up' : (totals?.clickToOpenRate ?? 0) > 10 ? 'neutral' : 'down'}
              trendValue={(totals?.clickToOpenRate ?? 0) > 15 ? 'Excellent' : (totals?.clickToOpenRate ?? 0) > 10 ? 'Good' : 'Improve content'}
              gradient="from-emerald-500 to-green-600"
              tooltip="Clicks divided by opens - measures content engagement. Ideal: Above 10%. Shows how compelling your email content is once opened."
            />
            <StatCard
              title="Revenue per Email"
              value={`$${(totals?.avgRevenuePerEmail || 0).toFixed(2)}`}
              subValue={`$${formatNumber((totals?.totalRevenue || 0) / 100)} total`}
              icon={DollarSign}
              trend={(totals?.avgRevenuePerEmail ?? 0) > 0.1 ? 'up' : (totals?.avgRevenuePerEmail ?? 0) > 0.05 ? 'neutral' : 'down'}
              trendValue={(totals?.avgRevenuePerEmail ?? 0) > 0.1 ? 'High ROI' : (totals?.avgRevenuePerEmail ?? 0) > 0.05 ? 'Moderate' : 'Low ROI'}
              gradient="from-green-500 to-emerald-500"
              tooltip="Average revenue generated per email sent. Track ROI of your campaigns by entering revenue in campaign data."
            />
            <StatCard
              title="Avg Time to Open"
              value={totals?.avgTimeToOpen ? `${Math.floor((totals.avgTimeToOpen || 0) / 60)}h ${Math.round((totals.avgTimeToOpen || 0) % 60)}m` : 'N/A'}
              subValue="From send to open"
              icon={Clock}
              trend={(totals?.avgTimeToOpen ?? 0) > 0 && (totals?.avgTimeToOpen ?? 0) < 120 ? 'up' : (totals?.avgTimeToOpen ?? 0) < 360 ? 'neutral' : 'down'}
              trendValue={(totals?.avgTimeToOpen ?? 0) > 0 && (totals?.avgTimeToOpen ?? 0) < 120 ? 'Quick opens' : (totals?.avgTimeToOpen ?? 0) < 360 ? 'Normal' : 'Slow opens'}
              gradient="from-indigo-500 to-violet-500"
              tooltip="Average time between sending and first open. Ideal: Under 2 hours. Helps optimize send times for your audience."
            />
            {(() => {
              // Comprehensive inbox placement score based on all metrics that affect deliverability
              // Start with 100 and apply penalties for each factor
              
              let score = 100;
              let sublabel = "Estimated inbox rate";
              const issues: string[] = [];
              
              // === HARD BOUNCE PENALTY (Heavy weight - damages reputation significantly) ===
              // Ideal: <0.5%, Warning: 0.5-2%, Critical: >2%
              const hardBounceRate = totals?.avgHardBounceRate || 0;
              if (hardBounceRate > 0) {
                if (hardBounceRate >= 2) {
                  score -= 30 + (hardBounceRate - 2) * 5; // Critical: -30 base + 5 per % over 2
                  issues.push('hard bounces');
                } else if (hardBounceRate >= 0.5) {
                  score -= 10 + (hardBounceRate - 0.5) * 10; // Warning: -10 to -25
                  issues.push('hard bounces');
                } else {
                  score -= hardBounceRate * 10; // Minor: up to -5
                }
              }
              
              // === SOFT BOUNCE PENALTY (Moderate weight) ===
              // Ideal: <2%, Warning: 2-5%, High: >5%
              const softBounceRate = totals?.avgSoftBounceRate || 0;
              if (softBounceRate > 2) {
                score -= (softBounceRate - 2) * 2; // -2 per % over 2
              }
              
              // === SPAM COMPLAINT PENALTY (Extremely heavy - can get you blocklisted) ===
              // Ideal: <0.1%, Warning: 0.1-0.3%, Critical: >0.3%
              const spamRate = totals?.avgSpamRate || 0;
              if (spamRate > 0) {
                if (spamRate >= 0.3) {
                  score -= 40 + (spamRate - 0.3) * 50; // Critical: -40 base
                  issues.push('spam complaints');
                } else if (spamRate >= 0.1) {
                  score -= 15 + (spamRate - 0.1) * 50; // Warning: -15 to -25
                } else {
                  score -= spamRate * 50; // Minor: up to -5
                }
              }
              
              // === UNSUBSCRIBE PENALTY (Moderate - signals poor engagement) ===
              // Ideal: <0.5%, Warning: 0.5-2%, High: >2%
              const unsubscribeRate = totals?.avgUnsubscribeRate || 0;
              if (unsubscribeRate > 0.5) {
                score -= (unsubscribeRate - 0.5) * 3; // -3 per % over 0.5
              }
              
              // === ENGAGEMENT SIGNALS (Positive/negative based on benchmarks) ===
              // Open rate: Ideal >20%, Average 15-20%, Poor <15%
              const openRate = totals?.avgOpenRate || 0;
              if (openRate < 15) {
                score -= (15 - openRate) * 1.5; // Penalty for low opens
                issues.push('low engagement');
              } else if (openRate >= 25) {
                score += 5; // Bonus for excellent opens
              }
              
              // Click rate: Ideal >2.5%, Average 1.5-2.5%, Poor <1.5%
              const clickRate = totals?.avgClickRate || 0;
              if (clickRate < 1.5) {
                score -= (1.5 - clickRate) * 3; // Penalty for low clicks
              } else if (clickRate >= 3) {
                score += 3; // Bonus for excellent clicks
              }
              
              // Click-to-open rate: Ideal >10%, Poor <5%
              const ctor = totals?.clickToOpenRate || 0;
              if (ctor > 0 && ctor < 5) {
                score -= (5 - ctor) * 1; // Penalty for poor CTOR
              }
              
              // === AI PREDICTION ADJUSTMENTS (when available) ===
              if (analysis?.inboxPlacementInsights) {
                const gmailPrediction = analysis.inboxPlacementInsights.gmailPrediction?.toLowerCase() || '';
                const promotionsRisk = analysis.inboxPlacementInsights.promotionsRisk || 0;
                
                if (gmailPrediction.includes('spam') || gmailPrediction.includes('junk')) {
                  score = Math.min(score, 25);
                  sublabel = "Spam folder risk";
                } else if (gmailPrediction.includes('promotions') || gmailPrediction.includes('promo')) {
                  score = Math.min(score, 70);
                  sublabel = "Promotions tab likely";
                } else if (gmailPrediction.includes('primary') || gmailPrediction.includes('inbox')) {
                  sublabel = "Primary inbox likely";
                }
                
                // Additional penalty for high promotions risk
                if (promotionsRisk > 50) {
                  score -= (promotionsRisk - 50) * 0.3;
                }
              }
              
              // Determine sublabel based on score if not set by AI
              if (sublabel === "Estimated inbox rate") {
                if (issues.length > 0) {
                  sublabel = `Issues: ${issues.slice(0, 2).join(', ')}`;
                } else if (score >= 85) {
                  sublabel = "Strong deliverability";
                } else if (score >= 70) {
                  sublabel = "Moderate deliverability";
                } else {
                  sublabel = "At risk";
                }
              }
              
              // Clamp to 0-100
              const inboxPlacement = Math.max(0, Math.min(100, score));
              
              return (
                <StatCard
                  title="Inbox Placement"
                  value={`${inboxPlacement.toFixed(0)}%`}
                  subValue={sublabel}
                  icon={Inbox}
                  trend={inboxPlacement > 85 ? 'up' : inboxPlacement > 70 ? 'neutral' : 'down'}
                  trendValue={inboxPlacement > 85 ? 'Excellent' : inboxPlacement > 70 ? 'Good' : 'Needs work'}
                  gradient="from-blue-500 to-indigo-500"
                  tooltip="Estimated inbox placement based on bounce rates, spam complaints, engagement metrics, and AI predictions. Ideal: Above 85%."
                />
              );
            })()}
          </div>

          {analysis && (
            <Card className="border-border bg-gradient-to-br from-purple-500/5 via-transparent to-pink-500/5 overflow-hidden" data-testid="ai-analysis-section">
              <div className="h-1 w-full bg-gradient-to-r from-purple-500 via-pink-500 to-purple-500" />
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/20">
                      <Sparkles className="w-4 h-4 text-purple-400" />
                    </div>
                    Acceptafy Powered Insights
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowAnalysis(!showAnalysis)}
                    className="gap-1"
                    data-testid="button-toggle-analysis"
                  >
                    {showAnalysis ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    {showAnalysis ? 'Hide' : 'Show'}
                  </Button>
                </div>
                <CardDescription className="text-sm leading-relaxed">{analysis.summary}</CardDescription>
              </CardHeader>
              
              {showAnalysis && (
                <CardContent className="space-y-6">
                  {/* Score Gauges Row */}
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4 p-4 rounded-xl bg-gradient-to-br from-muted/50 to-transparent border border-border">
                    <ScoreGauge 
                      score={analysis.healthScore} 
                      size="lg" 
                      label="Overall Health" 
                      sublabel={analysis.overallHealth}
                    />
                    <ScoreGauge 
                      score={analysis.senderReputation?.score || 0} 
                      size="md" 
                      label="Sender Rep" 
                      sublabel={analysis.senderReputation?.status}
                    />
                    <ScoreGauge 
                      score={analysis.domainHealth?.score || 0} 
                      size="md" 
                      label="Domain Health" 
                      sublabel={analysis.domainHealth?.status}
                    />
                    <ScoreGauge 
                      score={analysis.engagementScore?.score || 0} 
                      size="md" 
                      label="Engagement" 
                      sublabel={analysis.engagementScore?.status}
                    />
                    <ScoreGauge 
                      score={100 - (analysis.spamRisk?.score || 0)} 
                      size="md" 
                      label="Spam Safety" 
                      sublabel={analysis.spamRisk?.level === 'Low' ? 'Safe' : analysis.spamRisk?.level === 'Medium' ? 'Caution' : 'At Risk'}
                    />
                  </div>

                  {/* Inbox Placement Predictions */}
                  <div className="space-y-3">
                    <h4 className="font-medium flex items-center gap-2">
                      <Target className="w-4 h-4 text-blue-400" />
                      Where Your Emails Land
                      <Badge variant="secondary" className="text-xs ml-auto">
                        {analysis.inboxPlacementInsights.estimatedInboxRate}% inbox rate
                      </Badge>
                    </h4>
                    
                    {/* New Domain Disclaimer - show when limited sending history */}
                    {stats.combinedStats && (stats.combinedStats.totals.totalCampaigns < 3 || stats.combinedStats.totals.totalSent < 1000) && (
                      <div className="flex items-start gap-2 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 text-sm" data-testid="text-new-sender-disclaimer">
                        <Lightbulb className="w-4 h-4 text-blue-400 mt-0.5 shrink-0" />
                        <div>
                          <span className="font-medium text-blue-400">New Sender Predictions</span>
                          <p className="text-muted-foreground text-xs mt-1">
                            With limited sending history, these predictions are based on your email content quality, 
                            DNS configuration, and industry patterns rather than your actual sender reputation. 
                            Build your sending history to get more accurate predictions.
                          </p>
                        </div>
                      </div>
                    )}
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {(() => {
                        const isNewSender = stats.combinedStats && (stats.combinedStats.totals.totalCampaigns < 3 || stats.combinedStats.totals.totalSent < 1000);
                        const confidenceAdjustment = isNewSender ? 0.6 : 1; // Reduce confidence by 40% for new senders
                        return (
                          <>
                            <ProviderPredictionCard 
                              provider="Gmail" 
                              prediction={analysis.inboxPlacementInsights.gmailPrediction}
                              confidence={Math.round((analysis.inboxPlacementInsights.gmailConfidence || 75) * confidenceAdjustment)}
                              icon={Mail}
                              color="text-red-400"
                              isNewSender={!!isNewSender}
                            />
                            <ProviderPredictionCard 
                              provider="Outlook" 
                              prediction={analysis.inboxPlacementInsights.outlookPrediction}
                              confidence={Math.round((analysis.inboxPlacementInsights.outlookConfidence || 75) * confidenceAdjustment)}
                              icon={Mail}
                              color="text-blue-400"
                              isNewSender={!!isNewSender}
                            />
                            <ProviderPredictionCard 
                              provider="Yahoo" 
                              prediction={analysis.inboxPlacementInsights.yahooPrediction || 'Inbox'}
                              confidence={Math.round((analysis.inboxPlacementInsights.yahooConfidence || 70) * confidenceAdjustment)}
                              icon={Mail}
                              color="text-purple-400"
                              isNewSender={!!isNewSender}
                            />
                          </>
                        );
                      })()}
                    </div>
                    {(analysis.inboxPlacementInsights.promotionsRisk > 20 || analysis.inboxPlacementInsights.spamRisk > 10) && (
                      <div className="flex flex-wrap gap-3 mt-2">
                        {analysis.inboxPlacementInsights.promotionsRisk > 20 && (
                          <div className="flex items-center gap-2 text-xs px-3 py-1.5 rounded-full bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">
                            <AlertTriangle className="w-3 h-3" />
                            {analysis.inboxPlacementInsights.promotionsRisk}% chance of Promotions tab
                          </div>
                        )}
                        {analysis.inboxPlacementInsights.spamRisk > 10 && (
                          <div className="flex items-center gap-2 text-xs px-3 py-1.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/20">
                            <Shield className="w-3 h-3" />
                            {analysis.inboxPlacementInsights.spamRisk}% spam risk
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Quick Insights Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Sender Reputation */}
                    <div className="p-4 rounded-xl bg-muted/50 border border-border space-y-2">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-blue-400" />
                        <span className="text-sm font-medium">Sender Reputation</span>
                      </div>
                      <p className="text-xs text-muted-foreground">{analysis.senderReputation?.explanation}</p>
                    </div>
                    
                    {/* Domain Health */}
                    <div className="p-4 rounded-xl bg-muted/50 border border-border space-y-2">
                      <div className="flex items-center gap-2">
                        <Shield className="w-4 h-4 text-green-400" />
                        <span className="text-sm font-medium">Domain Health</span>
                        <Badge variant="outline" className="text-xs ml-auto">{analysis.domainHealth?.listQuality} List</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">{analysis.domainHealth?.explanation}</p>
                    </div>
                    
                    {/* Engagement Trend */}
                    <div className="p-4 rounded-xl bg-muted/50 border border-border space-y-2">
                      <div className="flex items-center gap-2">
                        <Activity className="w-4 h-4 text-purple-400" />
                        <span className="text-sm font-medium">Engagement Trend</span>
                        <Badge 
                          variant={analysis.engagementScore?.trend === 'Improving' ? 'default' : 'secondary'} 
                          className="text-xs ml-auto"
                        >
                          {analysis.engagementScore?.trend}
                        </Badge>
                      </div>
                      <div className="flex gap-4 text-xs">
                        <span className="text-muted-foreground">Opens: <span className={analysis.engagementScore?.openEngagement === 'Strong' ? 'text-green-400' : 'text-yellow-400'}>{analysis.engagementScore?.openEngagement}</span></span>
                        <span className="text-muted-foreground">Clicks: <span className={analysis.engagementScore?.clickEngagement === 'Strong' ? 'text-green-400' : 'text-yellow-400'}>{analysis.engagementScore?.clickEngagement}</span></span>
                      </div>
                    </div>
                  </div>

                  {/* Strengths & Concerns */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {analysis.strengths && analysis.strengths.length > 0 && (
                    <div className="p-4 rounded-xl bg-green-500/5 border border-green-500/20 space-y-3">
                      <h4 className="font-medium flex items-center gap-2 text-green-400">
                        <ThumbsUp className="w-4 h-4" />
                        What's Working Well
                      </h4>
                      <ul className="space-y-2">
                        {analysis.strengths.map((strength, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm">
                            <CheckCircle2 className="w-4 h-4 text-green-400 mt-0.5 shrink-0" />
                            <span>{strength}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    )}
                    {analysis.concerns && analysis.concerns.length > 0 && (
                    <div className="p-4 rounded-xl bg-yellow-500/5 border border-yellow-500/20 space-y-3">
                      <h4 className="font-medium flex items-center gap-2 text-yellow-400">
                        <Zap className="w-4 h-4" />
                        Room to Improve
                      </h4>
                      <ul className="space-y-2">
                        {analysis.concerns.map((concern, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm">
                            <AlertTriangle className="w-4 h-4 text-yellow-400 mt-0.5 shrink-0" />
                            <span>{concern}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    )}
                  </div>

                  {/* Spam Risk Factors */}
                  {analysis.spamRisk?.factors && analysis.spamRisk.factors.length > 0 && (
                    <div className="p-4 rounded-xl bg-red-500/5 border border-red-500/20 space-y-3">
                      <h4 className="font-medium flex items-center gap-2 text-red-400">
                        <Shield className="w-4 h-4" />
                        Spam Risk Factors
                      </h4>
                      <p className="text-xs text-muted-foreground mb-2">{analysis.spamRisk.explanation}</p>
                      <div className="flex flex-wrap gap-2">
                        {analysis.spamRisk.factors.map((factor, i) => (
                          <Badge key={i} variant="outline" className="text-xs border-red-500/30 text-red-300">
                            {factor}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Recommendations */}
                  {analysis.actionableRecommendations && analysis.actionableRecommendations.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="font-medium flex items-center gap-2">
                      <Lightbulb className="w-4 h-4 text-purple-400" />
                      Action Plan
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {analysis.actionableRecommendations.map((rec, i) => (
                        <div 
                          key={i} 
                          className={`p-4 rounded-xl border space-y-2 ${
                            rec.priority === 'High' 
                              ? 'bg-red-500/5 border-red-500/20' 
                              : rec.priority === 'Medium'
                              ? 'bg-yellow-500/5 border-yellow-500/20'
                              : 'bg-muted/50 border-border'
                          }`}
                          data-testid={`recommendation-${i}`}
                        >
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge 
                              variant={rec.priority === 'High' ? 'destructive' : rec.priority === 'Medium' ? 'secondary' : 'outline'}
                              className="text-xs"
                            >
                              {rec.priority}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {rec.category}
                            </Badge>
                          </div>
                          <p className="text-sm font-medium">{rec.recommendation}</p>
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <TrendingUp className="w-3 h-3" />
                            {rec.expectedImpact}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                  )}

                  {/* Industry Benchmarks */}
                  {analysis.benchmarkComparison && (
                  <div className="p-4 rounded-xl bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border border-cyan-500/20">
                    <h4 className="font-medium mb-4 flex items-center gap-2">
                      <BarChart3 className="w-4 h-4 text-cyan-400" />
                      How You Compare to Industry
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">Open Rate</span>
                          <Eye className="w-3 h-3 text-muted-foreground" />
                        </div>
                        <p className="text-sm font-medium">{analysis.benchmarkComparison.openRateVsIndustry || 'N/A'}</p>
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">Click Rate</span>
                          <MousePointerClick className="w-3 h-3 text-muted-foreground" />
                        </div>
                        <p className="text-sm font-medium">{analysis.benchmarkComparison.clickRateVsIndustry || 'N/A'}</p>
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">Bounce Rate</span>
                          <AlertTriangle className="w-3 h-3 text-muted-foreground" />
                        </div>
                        <p className="text-sm font-medium">{analysis.benchmarkComparison.bounceRateVsIndustry || 'N/A'}</p>
                      </div>
                    </div>
                  </div>
                  )}
                </CardContent>
              )}
            </Card>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {stats.providers.filter(p => p.stats !== null).map(providerStats => (
              <Card 
                key={providerStats.provider} 
                className={`border-border bg-gradient-to-br from-muted/50 to-transparent overflow-hidden`}
                data-testid={`provider-card-${providerStats.provider}`}
              >
                <div className={`h-1 w-full bg-gradient-to-r ${ESP_PROVIDER_COLORS[providerStats.provider] || 'from-gray-500 to-gray-400'}`} />
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center justify-between gap-2">
                    <span>{ESP_PROVIDER_NAMES[providerStats.provider] || providerStats.provider}</span>
                    <Badge variant="secondary" className="text-xs" data-testid={`badge-campaigns-${providerStats.provider}`}>
                      {providerStats.provider === 'highlevel' 
                        ? manualCampaigns.length 
                        : (providerStats.stats?.campaigns.length || 0)} campaigns
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {providerStats.provider === 'highlevel' ? (
                    <div className="space-y-4">
                      {/* Manual campaigns stats if any */}
                      {manualCampaigns.length > 0 && (
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div>
                            <p className="text-muted-foreground text-xs">Sent</p>
                            <p className="font-medium">{formatNumber(manualCampaigns.reduce((sum, c) => sum + c.totalSent, 0))}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground text-xs">Delivered</p>
                            <p className="font-medium">{formatNumber(manualCampaigns.reduce((sum, c) => sum + c.delivered, 0))}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground text-xs">Open Rate</p>
                            <p className={`font-medium ${getRateColor(manualCampaigns.reduce((sum, c) => sum + c.openRate, 0) / manualCampaigns.length, 'open')}`}>
                              {(manualCampaigns.reduce((sum, c) => sum + c.openRate, 0) / manualCampaigns.length).toFixed(1)}%
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground text-xs">Click Rate</p>
                            <p className={`font-medium ${getRateColor(manualCampaigns.reduce((sum, c) => sum + c.clickRate, 0) / manualCampaigns.length, 'click')}`}>
                              {(manualCampaigns.reduce((sum, c) => sum + c.clickRate, 0) / manualCampaigns.length).toFixed(1)}%
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Info about API limitation */}
                      <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                        <div className="flex items-start gap-2">
                          <AlertTriangle className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="text-xs text-amber-400 font-medium">No API Analytics</p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              Add campaigns manually from your HighLevel dashboard.
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Manual entry form */}
                      {showManualEntryForm ? (
                        <div className="space-y-3 p-3 rounded-lg bg-muted/30 border border-border">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium">Add Campaign Stats</p>
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              onClick={() => setShowManualEntryForm(false)}
                              className="h-6 px-2 text-xs"
                            >
                              Cancel
                            </Button>
                          </div>
                          
                          <div className="space-y-2">
                            <div>
                              <Label className="text-xs">Campaign Name *</Label>
                              <Input 
                                placeholder="e.g., Black Friday Sale"
                                value={manualCampaignForm.campaignName}
                                onChange={(e) => setManualCampaignForm(prev => ({ ...prev, campaignName: e.target.value }))}
                                className="h-8 text-sm"
                                data-testid="input-campaign-name"
                              />
                            </div>
                            <div>
                              <Label className="text-xs">Subject Line</Label>
                              <Input 
                                placeholder="e.g., Don't miss 50% off!"
                                value={manualCampaignForm.subject}
                                onChange={(e) => setManualCampaignForm(prev => ({ ...prev, subject: e.target.value }))}
                                className="h-8 text-sm"
                                data-testid="input-subject"
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <Label className="text-xs">Emails Sent *</Label>
                                <Input 
                                  type="number"
                                  placeholder="1000"
                                  value={manualCampaignForm.totalSent}
                                  onChange={(e) => setManualCampaignForm(prev => ({ ...prev, totalSent: e.target.value }))}
                                  className="h-8 text-sm"
                                  data-testid="input-total-sent"
                                />
                              </div>
                              <div>
                                <Label className="text-xs">Delivered</Label>
                                <Input 
                                  type="number"
                                  placeholder="980"
                                  value={manualCampaignForm.delivered}
                                  onChange={(e) => setManualCampaignForm(prev => ({ ...prev, delivered: e.target.value }))}
                                  className="h-8 text-sm"
                                  data-testid="input-delivered"
                                />
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <Label className="text-xs">Opened</Label>
                                <Input 
                                  type="number"
                                  placeholder="245"
                                  value={manualCampaignForm.opened}
                                  onChange={(e) => setManualCampaignForm(prev => ({ ...prev, opened: e.target.value }))}
                                  className="h-8 text-sm"
                                  data-testid="input-opened"
                                />
                              </div>
                              <div>
                                <Label className="text-xs">Clicked</Label>
                                <Input 
                                  type="number"
                                  placeholder="50"
                                  value={manualCampaignForm.clicked}
                                  onChange={(e) => setManualCampaignForm(prev => ({ ...prev, clicked: e.target.value }))}
                                  className="h-8 text-sm"
                                  data-testid="input-clicked"
                                />
                              </div>
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                              <div>
                                <Label className="text-xs">Bounced</Label>
                                <Input 
                                  type="number"
                                  placeholder="20"
                                  value={manualCampaignForm.bounced}
                                  onChange={(e) => setManualCampaignForm(prev => ({ ...prev, bounced: e.target.value }))}
                                  className="h-8 text-sm"
                                  data-testid="input-bounced"
                                />
                              </div>
                              <div>
                                <Label className="text-xs">Unsubs</Label>
                                <Input 
                                  type="number"
                                  placeholder="5"
                                  value={manualCampaignForm.unsubscribed}
                                  onChange={(e) => setManualCampaignForm(prev => ({ ...prev, unsubscribed: e.target.value }))}
                                  className="h-8 text-sm"
                                  data-testid="input-unsubscribed"
                                />
                              </div>
                              <div>
                                <Label className="text-xs">Spam</Label>
                                <Input 
                                  type="number"
                                  placeholder="0"
                                  value={manualCampaignForm.spamReports}
                                  onChange={(e) => setManualCampaignForm(prev => ({ ...prev, spamReports: e.target.value }))}
                                  className="h-8 text-sm"
                                  data-testid="input-spam-reports"
                                />
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <Label className="text-xs">Soft Bounces</Label>
                                <Input 
                                  type="number"
                                  placeholder="10"
                                  value={manualCampaignForm.softBounced}
                                  onChange={(e) => setManualCampaignForm(prev => ({ ...prev, softBounced: e.target.value }))}
                                  className="h-8 text-sm"
                                  data-testid="input-soft-bounced"
                                />
                              </div>
                              <div>
                                <Label className="text-xs">Hard Bounces</Label>
                                <Input 
                                  type="number"
                                  placeholder="5"
                                  value={manualCampaignForm.hardBounced}
                                  onChange={(e) => setManualCampaignForm(prev => ({ ...prev, hardBounced: e.target.value }))}
                                  className="h-8 text-sm"
                                  data-testid="input-hard-bounced"
                                />
                              </div>
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                              <div>
                                <Label className="text-xs">Forwards</Label>
                                <Input 
                                  type="number"
                                  placeholder="12"
                                  value={manualCampaignForm.forwards}
                                  onChange={(e) => setManualCampaignForm(prev => ({ ...prev, forwards: e.target.value }))}
                                  className="h-8 text-sm"
                                  data-testid="input-forwards"
                                />
                              </div>
                              <div>
                                <Label className="text-xs">Revenue ($)</Label>
                                <Input 
                                  type="number"
                                  placeholder="250"
                                  value={manualCampaignForm.revenue}
                                  onChange={(e) => setManualCampaignForm(prev => ({ ...prev, revenue: e.target.value }))}
                                  className="h-8 text-sm"
                                  data-testid="input-revenue"
                                />
                              </div>
                              <div>
                                <Label className="text-xs">Avg Open (hrs)</Label>
                                <Input 
                                  type="number"
                                  placeholder="2.5"
                                  step="0.1"
                                  value={manualCampaignForm.avgTimeToOpen}
                                  onChange={(e) => setManualCampaignForm(prev => ({ ...prev, avgTimeToOpen: e.target.value }))}
                                  className="h-8 text-sm"
                                  data-testid="input-avg-time-to-open"
                                />
                              </div>
                            </div>
                          </div>
                          
                          <Button 
                            onClick={saveManualCampaign}
                            className="w-full gap-2"
                            size="sm"
                            data-testid="button-save-campaign"
                          >
                            <Save className="w-3 h-3" />
                            Save Campaign
                          </Button>
                        </div>
                      ) : (
                        <Button 
                          onClick={() => setShowManualEntryForm(true)}
                          variant="outline"
                          className="w-full gap-2"
                          size="sm"
                          data-testid="button-add-manual-campaign"
                        >
                          <Plus className="w-3 h-3" />
                          Add Campaign Stats
                        </Button>
                      )}

                      {/* List of manual campaigns */}
                      {manualCampaigns.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-xs text-muted-foreground font-medium">Your Campaigns ({manualCampaigns.length})</p>
                          <div className="space-y-1 max-h-40 overflow-y-auto">
                            {manualCampaigns.map(campaign => (
                              <div 
                                key={campaign.campaignId}
                                className="flex items-center justify-between p-2 rounded-md bg-muted/50 hover-elevate group"
                              >
                                <div className="min-w-0 flex-1">
                                  <p className="text-xs font-medium truncate">{campaign.campaignName}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {campaign.openRate.toFixed(1)}% open · {campaign.clickRate.toFixed(1)}% click
                                  </p>
                                </div>
                                <Button 
                                  size="icon"
                                  variant="ghost"
                                  className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                                  onClick={() => deleteManualCampaign(campaign.campaignId)}
                                  data-testid={`button-delete-campaign-${campaign.campaignId}`}
                                >
                                  <Trash2 className="w-3 h-3 text-destructive" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <a 
                        href="https://app.gohighlevel.com" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs text-purple-400 hover:text-purple-300 transition-colors"
                      >
                        <ExternalLink className="w-3 h-3" />
                        Open HighLevel Dashboard
                      </a>
                    </div>
                  ) : (
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
                  )}
                  {providerStats.stats?.lastSyncAt && (
                    <p className="text-xs text-muted-foreground" data-testid={`text-last-sync-${providerStats.provider}`}>
                      Last synced: {formatDate(providerStats.stats.lastSyncAt)}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="border-border" data-testid="campaigns-list">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-purple-400" />
                Recent Campaigns
              </CardTitle>
              <CardDescription className="flex flex-col gap-2">
                <span>Performance breakdown for your {allCampaigns.length} most recent campaigns</span>
                <span className="flex items-center gap-3 text-xs">
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-green-400" />
                    <span>Excellent</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-yellow-400" />
                    <span>Average</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-red-400" />
                    <span>Needs work</span>
                  </span>
                  <span className="text-muted-foreground ml-1">(Hover metrics for details)</span>
                </span>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {(showAllCampaigns ? allCampaigns : allCampaigns.slice(0, 10)).map(({ campaign, provider }) => (
                <CampaignRow 
                  key={`${provider}-${campaign.campaignId}`} 
                  campaign={campaign} 
                  provider={provider}
                  onClick={() => setSelectedCampaign({ campaign, provider })}
                />
              ))}
              {allCampaigns.length === 0 && (
                <div className="text-center py-8 text-muted-foreground" data-testid="no-campaigns">
                  <Mail className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No campaign data available</p>
                </div>
              )}
              {allCampaigns.length > 10 && (
                <div className="flex justify-center pt-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowAllCampaigns(!showAllCampaigns)}
                    className="gap-1"
                    data-testid="button-toggle-all-campaigns"
                  >
                    {showAllCampaigns ? (
                      <>
                        <ChevronUp className="w-4 h-4" />
                        Show Less
                      </>
                    ) : (
                      <>
                        <ChevronDown className="w-4 h-4" />
                        View All {allCampaigns.length} Campaigns
                      </>
                    )}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      <ManualCampaignStatsForm />

      <CampaignDetailModal
        campaign={selectedCampaign?.campaign || null}
        provider={selectedCampaign?.provider || ''}
        isOpen={!!selectedCampaign}
        onClose={() => setSelectedCampaign(null)}
        onCopyToGrader={handleCopyToGrader}
        onAnalyzeFullEmail={handleAnalyzeFullEmail}
      />
    </div>
  );
}
