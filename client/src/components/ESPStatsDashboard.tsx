import { useState, useEffect, useId } from 'react';
import Papa from 'papaparse';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
  Upload,
  HelpCircle
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

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
      text: 'text-green-400', 
      start: '#22c55e', 
      end: '#10b981',
      glow: 'drop-shadow-[0_0_8px_rgba(34,197,94,0.5)]'
    };
    if (s >= 60) return { 
      text: 'text-yellow-400', 
      start: '#eab308', 
      end: '#f59e0b',
      glow: 'drop-shadow-[0_0_8px_rgba(234,179,8,0.5)]'
    };
    return { 
      text: 'text-red-400', 
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
          <circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" strokeWidth="8" className="text-white/10" />
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
  color 
}: { 
  provider: string;
  prediction: string;
  confidence: number;
  icon: any;
  color: string;
}) {
  const getPredictionColor = (pred: string) => {
    const lowerPred = pred.toLowerCase();
    if (lowerPred.includes('primary') || lowerPred.includes('focused') || lowerPred.includes('inbox')) return 'text-green-400';
    if (lowerPred.includes('promotions') || lowerPred.includes('other')) return 'text-yellow-400';
    return 'text-red-400';
  };
  
  return (
    <div className="p-3 rounded-lg bg-white/5 border border-white/10 space-y-2">
      <div className="flex items-center gap-2">
        <Icon className={`w-4 h-4 ${color}`} />
        <span className="text-sm font-medium">{provider}</span>
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
      className="w-full text-left flex flex-col md:flex-row md:items-center gap-3 md:gap-4 p-4 border border-white/10 rounded-xl bg-white/5 hover:bg-white/10 hover:border-purple-500/30 transition-all cursor-pointer group"
      data-testid={`campaign-row-${campaign.campaignId}`}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <Badge variant="secondary" className="text-xs" data-testid={`badge-provider-${campaign.campaignId}`}>
            {ESP_PROVIDER_NAMES[provider] || provider}
          </Badge>
          <span className="text-xs text-muted-foreground">{formatDate(campaign.sentAt)}</span>
          <ExternalLink className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity ml-auto" />
        </div>
        <p className="font-medium truncate group-hover:text-purple-300 transition-colors" data-testid={`text-campaign-name-${campaign.campaignId}`}>
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
    </button>
  );
}

// Campaign Detail Modal
function CampaignDetailModal({ 
  campaign, 
  provider, 
  isOpen, 
  onClose,
  onCopyToGrader 
}: { 
  campaign: ESPCampaignStats | null; 
  provider: string;
  isOpen: boolean;
  onClose: () => void;
  onCopyToGrader: (subject: string) => void;
}) {
  const { toast } = useToast();
  
  if (!campaign) return null;
  
  const copySubject = () => {
    if (campaign.subject) {
      navigator.clipboard.writeText(campaign.subject);
      toast({
        title: "Copied!",
        description: "Subject line copied to clipboard",
      });
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
              <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-2">
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
            <div className="p-3 rounded-lg bg-white/5 border border-white/10 text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Send className="w-4 h-4 text-blue-400" />
              </div>
              <p className="text-xl font-bold">{formatNumber(campaign.totalSent)}</p>
              <p className="text-xs text-muted-foreground">Sent</p>
            </div>
            <div className="p-3 rounded-lg bg-white/5 border border-white/10 text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Eye className="w-4 h-4 text-purple-400" />
              </div>
              <p className={`text-xl font-bold ${getRateColor(campaign.openRate, 'open')}`}>
                {campaign.openRate.toFixed(1)}%
              </p>
              <p className="text-xs text-muted-foreground">Open Rate</p>
            </div>
            <div className="p-3 rounded-lg bg-white/5 border border-white/10 text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <MousePointerClick className="w-4 h-4 text-green-400" />
              </div>
              <p className={`text-xl font-bold ${getRateColor(campaign.clickRate, 'click')}`}>
                {campaign.clickRate.toFixed(1)}%
              </p>
              <p className="text-xs text-muted-foreground">Click Rate</p>
            </div>
            <div className="p-3 rounded-lg bg-white/5 border border-white/10 text-center">
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
          
          {campaign.subject && (
            <div className="pt-4 border-t border-white/10">
              <Button 
                onClick={() => onCopyToGrader(campaign.subject || '')}
                className="w-full gap-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                data-testid="button-copy-to-grader"
              >
                <Sparkles className="w-4 h-4" />
                Analyze Subject Line in Email Grader
              </Button>
              <p className="text-xs text-muted-foreground text-center mt-2">
                Opens the email grader with your subject line pre-filled
              </p>
            </div>
          )}
          
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
}

export function ESPStatsDashboard({ onAnalyzeSubject }: ESPStatsDashboardProps) {
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

  const handleHighLevelCsvUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header: string) => header.toLowerCase().trim(),
      complete: (results) => {
        try {
          const rows = results.data as Record<string, string>[];
          
          if (rows.length === 0) {
            toast({
              title: "Invalid CSV",
              description: "The CSV file appears to be empty or has no data rows",
              variant: "destructive",
            });
            return;
          }

          const campaigns: ESPCampaignStats[] = [];

          rows.forEach((row, index) => {
            const findValue = (keys: string[]): string => {
              for (const key of keys) {
                const normalizedKey = key.toLowerCase();
                for (const rowKey of Object.keys(row)) {
                  if (rowKey.toLowerCase() === normalizedKey && row[rowKey]) {
                    return row[rowKey];
                  }
                }
              }
              return '';
            };

            const parseNum = (keys: string[]): number => {
              const val = findValue(keys);
              return parseInt(val.replace(/[^0-9]/g, ''), 10) || 0;
            };

            const parseRate = (keys: string[]): number => {
              const val = findValue(keys);
              return parseFloat(val.replace(/[^0-9.]/g, '')) || 0;
            };

            const sent = parseNum(['sent', 'total sent', 'emails sent', 'recipients', 'total']);
            const delivered = parseNum(['delivered', 'total delivered']) || sent;
            const opened = parseNum(['opened', 'opens', 'unique opens', 'total opens']);
            const clicked = parseNum(['clicked', 'clicks', 'unique clicks', 'total clicks']);
            const bounced = parseNum(['bounced', 'bounces', 'hard bounces', 'soft bounces']);
            const unsubscribed = parseNum(['unsubscribed', 'unsubscribes', 'unsubs']);
            const spamReports = parseNum(['spam', 'spam reports', 'complaints', 'spam complaints']);

            campaigns.push({
              campaignId: `hl-csv-${index + 1}`,
              campaignName: findValue(['name', 'campaign name', 'campaign', 'email name']) || findValue(['subject']) || `Campaign ${index + 1}`,
              subject: findValue(['subject', 'subject line', 'email subject']),
              sentAt: findValue(['date', 'sent date', 'sent at', 'created', 'send date']) || undefined,
              totalSent: sent,
              delivered,
              opened,
              clicked,
              bounced,
              unsubscribed,
              spamReports,
              openRate: delivered > 0 ? parseRate(['open rate', 'openrate']) || (opened / delivered) * 100 : 0,
              clickRate: delivered > 0 ? parseRate(['click rate', 'clickrate', 'ctr']) || (clicked / delivered) * 100 : 0,
              bounceRate: sent > 0 ? parseRate(['bounce rate', 'bouncerate']) || (bounced / sent) * 100 : 0,
              unsubscribeRate: delivered > 0 ? parseRate(['unsubscribe rate', 'unsub rate']) || (unsubscribed / delivered) * 100 : 0,
            });
          });

          if (campaigns.length === 0) {
            toast({
              title: "No campaigns found",
              description: "Could not parse any campaign data from the CSV",
              variant: "destructive",
            });
            return;
          }

          const totals = {
            totalCampaigns: campaigns.length,
            totalSent: campaigns.reduce((sum, c) => sum + c.totalSent, 0),
            totalDelivered: campaigns.reduce((sum, c) => sum + c.delivered, 0),
            totalOpened: campaigns.reduce((sum, c) => sum + c.opened, 0),
            totalClicked: campaigns.reduce((sum, c) => sum + c.clicked, 0),
            avgOpenRate: campaigns.length > 0 ? campaigns.reduce((sum, c) => sum + c.openRate, 0) / campaigns.length : 0,
            avgClickRate: campaigns.length > 0 ? campaigns.reduce((sum, c) => sum + c.clickRate, 0) / campaigns.length : 0,
            avgBounceRate: campaigns.length > 0 ? campaigns.reduce((sum, c) => sum + c.bounceRate, 0) / campaigns.length : 0,
          };

          setStats(prev => {
            if (!prev) {
              return {
                providers: [{
                  provider: 'highlevel',
                  stats: { provider: 'highlevel', campaigns, totals, lastSyncAt: new Date().toISOString() },
                  error: null
                }],
                combinedStats: { campaigns, totals }
              };
            }

            const updatedProviders = prev.providers.map(p => 
              p.provider === 'highlevel' 
                ? { ...p, stats: { provider: 'highlevel', campaigns, totals, lastSyncAt: new Date().toISOString() }, error: null }
                : p
            );

            if (!updatedProviders.find(p => p.provider === 'highlevel')) {
              updatedProviders.push({
                provider: 'highlevel',
                stats: { provider: 'highlevel', campaigns, totals, lastSyncAt: new Date().toISOString() },
                error: null
              });
            }

            const allCampaigns = updatedProviders.flatMap(p => p.stats?.campaigns || []);
            const combinedTotals = {
              totalCampaigns: allCampaigns.length,
              totalSent: allCampaigns.reduce((sum, c) => sum + c.totalSent, 0),
              totalDelivered: allCampaigns.reduce((sum, c) => sum + c.delivered, 0),
              totalOpened: allCampaigns.reduce((sum, c) => sum + c.opened, 0),
              totalClicked: allCampaigns.reduce((sum, c) => sum + c.clicked, 0),
              avgOpenRate: allCampaigns.length > 0 ? allCampaigns.reduce((sum, c) => sum + c.openRate, 0) / allCampaigns.length : 0,
              avgClickRate: allCampaigns.length > 0 ? allCampaigns.reduce((sum, c) => sum + c.clickRate, 0) / allCampaigns.length : 0,
              avgBounceRate: allCampaigns.length > 0 ? allCampaigns.reduce((sum, c) => sum + c.bounceRate, 0) / allCampaigns.length : 0,
            };

            return {
              ...prev,
              providers: updatedProviders,
              combinedStats: { campaigns: allCampaigns, totals: combinedTotals }
            };
          });

          toast({
            title: "CSV imported successfully!",
            description: `Imported ${campaigns.length} campaign${campaigns.length !== 1 ? 's' : ''} from HighLevel`,
          });
        } catch (err) {
          console.error('CSV parsing error:', err);
          toast({
            title: "Failed to parse CSV",
            description: "Please ensure the file is a valid CSV with campaign data",
            variant: "destructive",
          });
        }
      },
      error: (error) => {
        console.error('Papa Parse error:', error);
        toast({
          title: "Failed to read file",
          description: error.message || "There was an error reading the CSV file",
          variant: "destructive",
        });
      }
    });

    event.target.value = '';
  };

  const isScaleMember = user?.subscriptionTier === 'scale';

  if (isAuthLoading) {
    return (
      <div className="space-y-6">
        <Card className="border-white/10 bg-gradient-to-br from-white/5 to-transparent" data-testid="esp-stats-loading">
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
              <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                <Target className="w-6 h-6 mx-auto mb-2 text-purple-400" />
                <p className="font-medium text-sm">Inbox Prediction</p>
                <p className="text-xs text-muted-foreground">AI-powered analysis</p>
              </div>
              <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                <Activity className="w-6 h-6 mx-auto mb-2 text-pink-400" />
                <p className="font-medium text-sm">Health Scoring</p>
                <p className="text-xs text-muted-foreground">Comprehensive grades</p>
              </div>
              <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                <BarChart3 className="w-6 h-6 mx-auto mb-2 text-blue-400" />
                <p className="font-medium text-sm">Deep Analytics</p>
                <p className="text-xs text-muted-foreground">Beyond ESP dashboards</p>
              </div>
              <div className="p-4 rounded-xl bg-white/5 border border-white/10">
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
    if (!stats?.combinedStats) return;
    
    setIsAnalyzing(true);
    try {
      const allCampaigns = stats.providers.flatMap(p => 
        p.stats?.campaigns?.map(c => ({
          campaignName: c.campaignName,
          subject: c.subject,
          totalSent: c.totalSent,
          openRate: c.openRate,
          clickRate: c.clickRate,
          bounceRate: c.bounceRate,
        })) || []
      );

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
              trend={(totals?.avgBounceRate ?? 0) < 1 ? 'up' : (totals?.avgBounceRate ?? 0) < 3 ? 'neutral' : 'down'}
              trendValue={(totals?.avgBounceRate ?? 0) < 1 ? 'Excellent' : (totals?.avgBounceRate ?? 0) < 3 ? 'Acceptable' : 'Needs attention'}
              gradient="from-orange-500 to-red-500"
            />
          </div>

          {analysis && (
            <Card className="border-white/10 bg-gradient-to-br from-purple-500/5 via-transparent to-pink-500/5 overflow-hidden" data-testid="ai-analysis-section">
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
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4 p-4 rounded-xl bg-gradient-to-br from-white/5 to-transparent border border-white/10">
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
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <ProviderPredictionCard 
                        provider="Gmail" 
                        prediction={analysis.inboxPlacementInsights.gmailPrediction}
                        confidence={analysis.inboxPlacementInsights.gmailConfidence || 75}
                        icon={Mail}
                        color="text-red-400"
                      />
                      <ProviderPredictionCard 
                        provider="Outlook" 
                        prediction={analysis.inboxPlacementInsights.outlookPrediction}
                        confidence={analysis.inboxPlacementInsights.outlookConfidence || 75}
                        icon={Mail}
                        color="text-blue-400"
                      />
                      <ProviderPredictionCard 
                        provider="Yahoo" 
                        prediction={analysis.inboxPlacementInsights.yahooPrediction || 'Inbox'}
                        confidence={analysis.inboxPlacementInsights.yahooConfidence || 70}
                        icon={Mail}
                        color="text-purple-400"
                      />
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
                    <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-2">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-blue-400" />
                        <span className="text-sm font-medium">Sender Reputation</span>
                      </div>
                      <p className="text-xs text-muted-foreground">{analysis.senderReputation?.explanation}</p>
                    </div>
                    
                    {/* Domain Health */}
                    <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-2">
                      <div className="flex items-center gap-2">
                        <Shield className="w-4 h-4 text-green-400" />
                        <span className="text-sm font-medium">Domain Health</span>
                        <Badge variant="outline" className="text-xs ml-auto">{analysis.domainHealth?.listQuality} List</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">{analysis.domainHealth?.explanation}</p>
                    </div>
                    
                    {/* Engagement Trend */}
                    <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-2">
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
                              : 'bg-white/5 border-white/10'
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
                  {providerStats.provider === 'highlevel' && (providerStats.stats?.campaigns.length || 0) === 0 ? (
                    <div className="text-center py-4 space-y-3">
                      <AlertTriangle className="w-8 h-8 mx-auto text-yellow-500/70" />
                      <p className="text-sm text-muted-foreground">
                        HighLevel doesn't offer email stats through their API yet.
                      </p>
                      <p className="text-xs text-muted-foreground/70">
                        This is a platform limitation. You can import your stats manually using CSV.
                      </p>
                      <div className="flex items-center justify-center gap-2 pt-2">
                        <label htmlFor="highlevel-csv-upload">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="cursor-pointer gap-2"
                            asChild
                          >
                            <span>
                              <Upload className="w-4 h-4" />
                              Upload CSV
                            </span>
                          </Button>
                          <input 
                            id="highlevel-csv-upload"
                            type="file"
                            accept=".csv"
                            className="hidden"
                            onChange={handleHighLevelCsvUpload}
                            data-testid="input-highlevel-csv"
                          />
                        </label>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <HelpCircle className="w-4 h-4 text-muted-foreground" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent side="top" className="max-w-[280px] text-left">
                            <p className="font-medium mb-1">How to export from HighLevel:</p>
                            <ol className="text-xs space-y-1 list-decimal list-inside">
                              <li>Go to Marketing → Emails</li>
                              <li>Select your campaign</li>
                              <li>Click the "..." menu → Export</li>
                              <li>Choose CSV format and download</li>
                            </ol>
                          </TooltipContent>
                        </Tooltip>
                      </div>
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
                <p className="text-center text-sm text-muted-foreground pt-2">
                  Showing 10 of {allCampaigns.length} campaigns
                </p>
              )}
            </CardContent>
          </Card>
        </>
      )}

      <CampaignDetailModal
        campaign={selectedCampaign?.campaign || null}
        provider={selectedCampaign?.provider || ''}
        isOpen={!!selectedCampaign}
        onClose={() => setSelectedCampaign(null)}
        onCopyToGrader={handleCopyToGrader}
      />
    </div>
  );
}
