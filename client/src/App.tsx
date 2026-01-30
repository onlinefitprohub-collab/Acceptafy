import { useState, useEffect, useCallback, useRef, lazy, Suspense } from 'react';
import { Switch, Route } from 'wouter';
import { Logo } from './components/icons/Logo';
import { EmailInput, type Industry, type EmailType } from './components/EmailInput';
import type { ImageData } from './components/RichTextEditor';
import { ResultsHub } from './components/ResultsHub';
import { Loader } from './components/Loader';
import { RewriteComparison } from './components/RewriteComparison';
import { HistoryPanel } from './components/HistoryPanel';
import { HistoryViewBanner } from './components/HistoryViewBanner';
import { FollowUpGenerator } from './components/FollowUpGenerator';
import { FollowUpDisplay } from './components/FollowUpDisplay';
import { FollowUpSequenceDisplay } from './components/FollowUpSequenceDisplay';
import { ReputationDashboard } from './components/ReputationDashboard';
import { ErrorMessage } from './components/ErrorMessage';
import { EnhancedPdfExport } from './components/EnhancedPdfExport';
import { AppSidebar } from './components/app-sidebar';
import { ThemeToggle } from './components/ThemeToggle';
import { useOnboarding } from './components/OnboardingTour';
import { useCelebration } from './components/CelebrationModal';
import { PriorityIssues } from './components/PriorityIssues';
import { GamificationProvider, useGamification } from './hooks/use-gamification';
import { useAuth } from './hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Toaster } from '@/components/ui/toaster';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { TooltipProvider } from '@/components/ui/tooltip';
import { ErrorBoundary } from './components/ErrorBoundary';
import Landing from './pages/Landing';

// Lazy load non-critical widgets to improve initial load
const CookieConsent = lazy(() => import('./components/CookieConsent').then(m => ({ default: m.CookieConsent })));
const ContactWidget = lazy(() => import('./components/ContactWidget').then(m => ({ default: m.ContactWidget })));

// Lazy load heavy components
const AcademyHub = lazy(() => import('./components/Academy/AcademyHub').then(m => ({ default: m.AcademyHub })));
const Dashboard = lazy(() => import('./components/Dashboard').then(m => ({ default: m.Dashboard })));
const OnboardingTour = lazy(() => import('./components/OnboardingTour').then(m => ({ default: m.OnboardingTour })));
const ESPStatsDashboard = lazy(() => import('./components/ESPStatsDashboard').then(m => ({ default: m.ESPStatsDashboard })));
const DeliverabilityIntelligence = lazy(() => import('./components/DeliverabilityIntelligence').then(m => ({ default: m.DeliverabilityIntelligence })));
const CampaignFunnelVisualization = lazy(() => import('./components/CampaignFunnelVisualization').then(m => ({ default: m.CampaignFunnelVisualization })));

// Lazy load pages for better initial load performance
const Pricing = lazy(() => import('./pages/Pricing'));
const Account = lazy(() => import('./pages/Account'));
const TermsOfService = lazy(() => import('./pages/TermsOfService'));
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy'));
const Contact = lazy(() => import('./pages/Contact'));
const Admin = lazy(() => import('./pages/Admin'));
const ResetPassword = lazy(() => import('./pages/reset-password'));
const VerifyEmail = lazy(() => import('./pages/verify-email'));
const Resources = lazy(() => import('./pages/Resources'));
const ResourceArticle = lazy(() => import('./pages/ResourceArticle'));

// Loading fallback for lazy-loaded pages
function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="animate-pulse flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500" />
        <span className="text-lg font-semibold text-foreground">Loading...</span>
      </div>
    </div>
  );
}

// Compact loading fallback for in-page components
function ComponentLoader() {
  return (
    <div className="flex items-center justify-center p-12">
      <div className="animate-pulse flex items-center gap-2">
        <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500" />
        <span className="text-sm font-medium text-muted-foreground">Loading...</span>
      </div>
    </div>
  );
}
import { 
  SidebarProvider, 
  SidebarTrigger,
  SidebarInset 
} from '@/components/ui/sidebar';
import { 
  RewriteIcon,
  HistoryIcon,
  EyeIcon,
  TrashIcon,
  SubjectIcon,
  PreviewIcon,
  BodyIcon,
  CtaIcon,
  SpamIcon,
  SubjectShowdownIcon,
  PersonalizationIcon,
  ReplyIcon,
  CheckIcon,
  CopyIcon,
  FollowUpIcon
} from './components/icons/CategoryIcons';
import { InboxPlacementSimulator } from './components/InboxPlacementSimulator';
import { ResultsTabs } from './components/ResultsTabs';
import { DeliverabilityChecklist } from './components/DeliverabilityChecklist';
import { DomainHealthChecker } from './components/DomainHealthChecker';
import { ListQualityChecker } from './components/ListQualityChecker';
import { BimiGenerator } from './components/BimiGenerator';
import { WarmupPlanner } from './components/WarmupPlanner';
import { EmailPreviewTool } from './components/EmailPreviewTool';
import { SpamChecker } from './components/SpamChecker';
import { SentimentAnalyzer } from './components/SentimentAnalyzer';
import { SenderScoreEstimator } from './components/SenderScoreEstimator';
import { BlacklistMonitor } from './components/BlacklistMonitor';
import { CampaignRiskScore } from './components/CampaignRiskScore';
import { EmailTemplates } from './components/EmailTemplates';
import { EmailImport } from './components/EmailImport';
import { CompetitorAnalysis } from './components/CompetitorAnalysis';
import { SendTimeOptimizer } from './components/SendTimeOptimizer';
import { EmailBuilder } from './components/EmailBuilder';
import ContentGenerator from './components/ContentGenerator';
import { ESPSettings, type ESPProvider } from './components/ESPSettings';
import { ESPContactCleaner } from './components/ESPContactCleaner';
import { PaymentWarningBanner } from './components/PaymentWarningBanner';
import { AnnouncementBanner } from './components/AnnouncementBanner';
import { SEOHead } from './components/SEOHead';
import { StructuredData } from './components/StructuredData';
import { 
  getHistory, 
  saveAnalysis, 
  deleteHistoryItem, 
  clearHistory,
  fetchHistoryFromApi,
  deleteHistoryItemFromApi,
  clearHistoryFromApi,
  migrateLocalStorageToApi
} from './services/historyService';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sparkles, Zap, Target, Mail, Flame, Trophy, Star, Shield, ShieldAlert, ShieldCheck, Heart, Download, FileText, FolderOpen, Upload, Users, Activity, BarChart3, AlertCircle, RotateCcw, Rocket, Thermometer, Key, CheckCircle, Wrench } from 'lucide-react';
import { HighLevelGettingStarted, HighLevelWarmup, HighLevelAuthentication, HighLevelDeliverability, HighLevelTroubleshooting, HighLevelAdvanced } from './components/HighLevelHub';
import { SUBSCRIPTION_LIMITS } from '@shared/schema';
import type { 
  GradingResult, 
  HistoryItem, 
  SpamTrigger, 
  EmailVariation, 
  DnsRecords, 
  RewrittenEmail, 
  FollowUpEmail, 
  FollowUpSequenceEmail,
  RewriteGoal,
  FollowUpGoal,
  SubjectVariation,
  OptimizationItem,
  ToneRewrite,
  ToneProfile,
  EmailPreview
} from './types';

type ActiveView = 'dashboard' | 'grader' | 'history' | 'academy' | 'create' | 'optimize' | 'analytics' | 'deliverability' | 'connections' | 'highlevel' | 'account';
type CreateSubView = 'builder' | 'rewrite' | 'followup' | 'templates' | 'tone' | 'import' | 'content' | null;
type OptimizeSubView = 'variations' | 'preview' | 'spam' | 'sentiment' | 'sendtime' | 'competitor' | null;
type AnalyticsSubView = 'stats' | 'funnel' | 'intelligence' | null;
type DeliverabilitySubView = 'dns' | 'domain-health' | 'list-quality' | 'bimi' | 'warmup' | 'sender-score' | 'blacklist' | 'campaign-risk' | null;
type ConnectionsSubView = 'esp' | 'contact-export' | null;
type HighLevelSubView = 'getting-started' | 'warmup' | 'authentication' | 'deliverability' | 'troubleshooting' | 'advanced' | null;

const EXAMPLE_EMAIL = {
  subject: "",
  previewText: "",
  body: ``
};

function AppContent() {
  const { toast } = useToast();
  const { user } = useAuth();
  const { recordGrade, recordRewrite, streak, level, xp, bestScore } = useGamification();
  const { showOnboarding, completeOnboarding, resetOnboarding } = useOnboarding();
  const { celebrations, celebrate, CelebrationRenderer } = useCelebration();
  
  // Check if user has white-label report access (Scale tier)
  const userTier = user?.subscriptionTier === 'scale' ? 'scale' : (user?.subscriptionTier === 'pro' ? 'pro' : 'starter');
  const hasWhitelabelReports = SUBSCRIPTION_LIMITS[userTier].whitelabelReports;
  
  const [variations, setVariations] = useState<EmailVariation[]>([{ 
    subject: EXAMPLE_EMAIL.subject, 
    previewText: EXAMPLE_EMAIL.previewText 
  }]);
  const [body, setBody] = useState(EXAMPLE_EMAIL.body);
  const [emailImages, setEmailImages] = useState<ImageData[]>([]);
  const [industry, setIndustry] = useState<Industry>('');
  const [emailType, setEmailType] = useState<EmailType>('');
  const [isLoading, setIsLoading] = useState(false);
  const [gradingError, setGradingError] = useState<string | null>(null);
  const [result, setResult] = useState<GradingResult | null>(null);
  const [spamTriggers, setSpamTriggers] = useState<SpamTrigger[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [activeView, setActiveView] = useState<ActiveView>('dashboard');
  const [createSubView, setCreateSubView] = useState<CreateSubView>(null);
  const [optimizeSubView, setOptimizeSubView] = useState<OptimizeSubView>(null);
  const [analyticsSubView, setAnalyticsSubView] = useState<AnalyticsSubView>(null);
  const [deliverabilitySubView, setDeliverabilitySubView] = useState<DeliverabilitySubView>(null);
  const [connectionsSubView, setConnectionsSubView] = useState<ConnectionsSubView>(null);
  const [highlevelSubView, setHighlevelSubView] = useState<HighLevelSubView>(null);
  const [espConnections, setEspConnections] = useState<{ provider: ESPProvider; connected: boolean; accountName?: string; lastSync?: string }[]>([]);
  const [showAcademy, setShowAcademy] = useState(false);
  const [prevLevel, setPrevLevel] = useState(level);
  const [dnsRecords, setDnsRecords] = useState<DnsRecords | null>(null);
  const [isGeneratingDns, setIsGeneratingDns] = useState(false);
  const [selectedHistoryItem, setSelectedHistoryItem] = useState<HistoryItem | null>(null);
  const [rewrittenEmail, setRewrittenEmail] = useState<RewrittenEmail | null>(null);
  const [isRewriting, setIsRewriting] = useState(false);
  const [rewriteGoal, setRewriteGoal] = useState<string>('general');
  const [followUpEmail, setFollowUpEmail] = useState<FollowUpEmail | null>(null);
  const [followUpSequence, setFollowUpSequence] = useState<FollowUpSequenceEmail[]>([]);
  const [isGeneratingFollowUp, setIsGeneratingFollowUp] = useState(false);
  const [followUpGoal, setFollowUpGoal] = useState<string>('reminder');
  const [followUpContext, setFollowUpContext] = useState('');
  const [copiedItem, setCopiedItem] = useState<string | null>(null);
  const [subjectVariations, setSubjectVariations] = useState<SubjectVariation[]>([]);
  const [isGeneratingVariations, setIsGeneratingVariations] = useState(false);
  const [optimizationRoadmap, setOptimizationRoadmap] = useState<OptimizationItem[]>([]);
  const [isGeneratingRoadmap, setIsGeneratingRoadmap] = useState(false);
  const [toneRewrite, setToneRewrite] = useState<ToneRewrite | null>(null);
  const [isGeneratingTone, setIsGeneratingTone] = useState(false);
  const [selectedTone, setSelectedTone] = useState<ToneProfile>('professional');
  const [emailPreview, setEmailPreview] = useState<EmailPreview | null>(null);
  const [generatedPs, setGeneratedPs] = useState<string | null>(null);
  const [isGeneratingPs, setIsGeneratingPs] = useState(false);
  const loadingRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadHistory = async () => {
      if (user) {
        // Migrate any localStorage history to database on first load
        await migrateLocalStorageToApi();
        const apiHistory = await fetchHistoryFromApi();
        setHistory(apiHistory);
      } else {
        setHistory(getHistory());
      }
    };
    loadHistory();
  }, [user]);

  useEffect(() => {
    const loadESPConnections = async () => {
      if (user) {
        try {
          const response = await fetch('/api/esp/connections', {
            credentials: 'include',
          });
          if (response.ok) {
            const connections = await response.json();
            setEspConnections(connections.map((c: any) => ({
              provider: c.provider,
              connected: c.isConnected,
              accountName: c.accountName,
              lastSync: c.lastSyncAt ? new Date(c.lastSyncAt).toLocaleString() : undefined,
            })));
          }
        } catch (error) {
          console.error('Failed to load ESP connections:', error);
        }
      }
    };
    loadESPConnections();
  }, [user]);

  useEffect(() => {
    if (level > prevLevel && prevLevel > 0) {
      celebrate('level_up', { level });
    }
    setPrevLevel(level);
  }, [level, prevLevel, celebrate]);

  const handleAnalyzeSubject = (subject: string) => {
    setVariations([{ subject, previewText: '' }]);
    setActiveView('grader');
  };

  const clearAllSubViews = () => {
    setCreateSubView(null);
    setOptimizeSubView(null);
    setAnalyticsSubView(null);
    setDeliverabilitySubView(null);
    setConnectionsSubView(null);
    setHighlevelSubView(null);
  };

  const handleDashboardNavigate = (view: 'grader' | 'history' | 'create' | 'optimize' | 'analytics' | 'deliverability' | 'connections', subView?: string) => {
    setActiveView(view);
    clearAllSubViews();
    if (view === 'create' && subView) {
      setCreateSubView(subView as CreateSubView);
    } else if (view === 'optimize' && subView) {
      setOptimizeSubView(subView as OptimizeSubView);
    } else if (view === 'analytics' && subView) {
      setAnalyticsSubView(subView as AnalyticsSubView);
    } else if (view === 'deliverability' && subView) {
      setDeliverabilitySubView(subView as DeliverabilitySubView);
    } else if (view === 'connections' && subView) {
      setConnectionsSubView(subView as ConnectionsSubView);
    }
  };

  const handleGrade = async () => {
    if (!body.trim() && !variations.some(v => v.subject.trim())) return;
    
    setIsLoading(true);
    setResult(null);
    setGradingError(null);
    setRewrittenEmail(null);
    setFollowUpEmail(null);
    setFollowUpSequence([]);
    
    // Scroll to loading indicator
    setTimeout(() => {
      loadingRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
    
    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 second timeout
    
    try {
      const response = await fetch('/api/grade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          body, 
          variations, 
          industry: industry || undefined, 
          emailType: emailType || undefined,
          images: emailImages.length > 0 ? emailImages : undefined
        }),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        const data = await response.json();
        setResult(data);
        setSpamTriggers(data.spamAnalysis || []);
        if (user) {
          const apiHistory = await fetchHistoryFromApi();
          setHistory(apiHistory);
        } else {
          const newHistory = saveAnalysis({ body, variations }, data);
          setHistory(newHistory);
        }
        const score = data.inboxPlacementScore?.score || 0;
        const grade = data.overallGrade?.grade || 'C';
        recordGrade(score, grade);
        
        if (score >= 90) {
          setTimeout(() => {
            celebrate('perfect_score', { score });
          }, 500);
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        setGradingError(errorData.error || 'Grading failed. Please try again.');
        console.error('Grading failed:', errorData);
      }
    } catch (error: unknown) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === 'AbortError') {
        setGradingError('The analysis is taking longer than expected. Please try again.');
      } else {
        setGradingError('Something went wrong. Please try again.');
      }
      console.error('Error grading email:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartFresh = () => {
    setVariations([{ subject: '', previewText: '' }]);
    setBody('');
    setEmailImages([]);
    setIndustry('');
    setEmailType('');
    setResult(null);
    setRewrittenEmail(null);
    setFollowUpEmail(null);
    setFollowUpSequence([]);
    setSpamTriggers([]);
    setSelectedHistoryItem(null);
  };

  const handleGenerateDns = async (domain: string) => {
    if (!domain.trim()) return;
    
    setIsGeneratingDns(true);
    
    try {
      const response = await fetch('/api/dns/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain })
      });
      
      if (response.ok) {
        const data = await response.json();
        setDnsRecords(data);
      }
    } catch (error) {
      console.error('Error generating DNS records:', error);
    } finally {
      setIsGeneratingDns(false);
    }
  };

  const handleRewrite = async () => {
    if (!body.trim()) return;
    
    setIsRewriting(true);
    
    try {
      const response = await fetch('/api/rewrite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          body, 
          subject: variations[0]?.subject || '',
          preview: variations[0]?.previewText || '',
          goal: rewriteGoal 
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        setRewrittenEmail(data);
        recordRewrite();
      } else {
        const errorData = await response.json().catch(() => ({}));
        toast({
          title: "Rewrite failed",
          description: errorData?.error || "Unable to rewrite email. Please try again.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error rewriting email:', error);
      toast({
        title: "Connection error",
        description: "Failed to connect to the server. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsRewriting(false);
    }
  };

  const handleGenerateFollowUp = async () => {
    setIsGeneratingFollowUp(true);
    
    const sequenceTypes = [
      'sequence', 'nurture', 'welcome', 're-engagement', 'launch', 
      'book-a-call', 'abandoned-cart', 'webinar', 'testimonial', 'upsell', 'survey'
    ];
    const isSequenceType = sequenceTypes.includes(followUpGoal);
    
    try {
      if (isSequenceType) {
        const response = await fetch('/api/followup/sequence', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            original: { body, variations },
            analysis: result,
            goal: followUpGoal,
            context: followUpContext
          })
        });
        
        if (response.status === 403) {
          const errorData = await response.json();
          if (errorData.error === 'Pro feature') {
            toast({
              title: "Pro Feature",
              description: "Email Sequence Generator is available on Pro and Scale plans. Upgrade to unlock this feature.",
              variant: "default",
            });
            return;
          }
        }
        
        if (response.ok) {
          const data = await response.json();
          setFollowUpSequence(data);
          setFollowUpEmail(null);
        }
      } else {
        const response = await fetch('/api/followup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            original: { body, variations },
            analysis: result,
            goal: followUpGoal,
            context: followUpContext
          })
        });
        
        if (response.ok) {
          const data = await response.json();
          setFollowUpEmail(data);
          setFollowUpSequence([]);
        }
      }
    } catch (error) {
      console.error('Error generating follow-up:', error);
    } finally {
      setIsGeneratingFollowUp(false);
    }
  };

  const handleViewHistory = (item: HistoryItem) => {
    setSelectedHistoryItem(item);
    setResult(item.result);
    setBody(item.content.body);
    setVariations(item.content.variations);
    setSpamTriggers(item.result.spamAnalysis || []);
    setActiveView('grader');
    clearAllSubViews();
  };

  const handleDeleteHistory = async (id: string) => {
    if (user) {
      await deleteHistoryItemFromApi(id);
      const apiHistory = await fetchHistoryFromApi();
      setHistory(apiHistory);
    } else {
      const newHistory = deleteHistoryItem(id);
      setHistory(newHistory);
    }
  };

  const handleClearHistory = async () => {
    if (user) {
      await clearHistoryFromApi();
      setHistory([]);
    } else {
      const newHistory = clearHistory();
      setHistory(newHistory);
    }
  };

  const copyToClipboard = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedItem(id);
    setTimeout(() => setCopiedItem(null), 2000);
  };

  const handleQuickFix = (word: string, replacement: string) => {
    const escapedWord = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(escapedWord, 'gi');
    
    setBody(prev => prev.replace(regex, replacement));
    setVariations(prev => prev.map(v => ({
      ...v,
      subject: v.subject.replace(regex, replacement),
      previewText: v.previewText.replace(regex, replacement)
    })));
    
    setSpamTriggers(prev => prev.filter(t => (t.word || t.phrase || '').toLowerCase() !== word.toLowerCase()));
  };

  const handleSuggestionClick = (triggerWord: string, suggestion: string) => {
    handleQuickFix(triggerWord, suggestion);
  };

  const handleFullRewrite = (originalText: string, newText: string) => {
    setBody(prev => prev.replace(originalText, newText));
  };

  const handleGeneratePs = async () => {
    if (!body.trim()) return;
    
    setIsGeneratingPs(true);
    try {
      const response = await fetch('/api/generate-ps', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emailBody: body })
      });
      
      if (response.ok) {
        const data = await response.json();
        setGeneratedPs(data.ps);
      }
    } catch (error) {
      console.error('Error generating P.S.:', error);
    } finally {
      setIsGeneratingPs(false);
    }
  };

  const handleAppendPs = () => {
    if (generatedPs) {
      setBody(prev => prev + '\n\n' + generatedPs);
      setGeneratedPs(null);
    }
  };

  const convertPlainTextToHtml = (text: string): string => {
    if (!text) return '';
    return text
      .split('\n\n')
      .map(paragraph => `<p>${paragraph.replace(/\n/g, '<br>')}</p>`)
      .join('');
  };

  const handleAcceptRewrite = () => {
    if (rewrittenEmail) {
      const htmlBody = convertPlainTextToHtml(rewrittenEmail.body);
      setBody(htmlBody);
      setVariations([{ 
        subject: rewrittenEmail.subject, 
        previewText: rewrittenEmail.previewText 
      }]);
      setRewrittenEmail(null);
      setResult(null);
    }
  };

  const handleLoadFollowUp = (email: { subject: string; body: string }) => {
    const htmlBody = convertPlainTextToHtml(email.body);
    setBody(htmlBody);
    setVariations([{ 
      subject: email.subject, 
      previewText: '' 
    }]);
    setFollowUpEmail(null);
    setFollowUpSequence([]);
    setResult(null);
  };

  const handleGenerateSubjectVariations = async () => {
    if (!variations[0]?.subject.trim() || !body.trim()) return;
    
    setIsGeneratingVariations(true);
    try {
      const response = await fetch('/api/subjects/variations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: variations[0].subject,
          preview: variations[0].previewText || '',
          body
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        setSubjectVariations(data);
      } else {
        const error = await response.json();
        toast({
          title: "Error",
          description: error.error || "Failed to generate subject variations",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error generating variations:', error);
      toast({
        title: "Error",
        description: "Failed to generate subject variations. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsGeneratingVariations(false);
    }
  };

  const handleGenerateRoadmap = async () => {
    if (!result) return;
    
    setIsGeneratingRoadmap(true);
    try {
      const response = await fetch('/api/optimization/roadmap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          analysisResult: result,
          subject: variations[0]?.subject || '',
          body
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        setOptimizationRoadmap(data);
      } else {
        const error = await response.json();
        toast({
          title: "Error",
          description: error.error || "Failed to generate optimization roadmap",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error generating roadmap:', error);
      toast({
        title: "Error",
        description: "Failed to generate optimization roadmap. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsGeneratingRoadmap(false);
    }
  };

  const handleToneRewrite = async () => {
    if (!body.trim()) return;
    
    setIsGeneratingTone(true);
    try {
      const response = await fetch('/api/rewrite/tone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          body,
          subject: variations[0]?.subject || '',
          preview: variations[0]?.previewText || '',
          tone: selectedTone
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        setToneRewrite(data);
        recordRewrite();
      } else {
        const error = await response.json();
        toast({
          title: "Error",
          description: error.error || "Failed to generate tone rewrite",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error generating tone rewrite:', error);
      toast({
        title: "Error",
        description: "Failed to generate tone rewrite. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsGeneratingTone(false);
    }
  };

  const handleAcceptToneRewrite = () => {
    if (toneRewrite) {
      setBody(toneRewrite.body);
      setVariations([{
        subject: toneRewrite.subject,
        previewText: toneRewrite.previewText
      }]);
      setToneRewrite(null);
      setResult(null);
    }
  };

  const handleUseVariation = (variation: SubjectVariation) => {
    setVariations([{
      subject: variation.subject,
      previewText: variation.previewText
    }]);
    setSubjectVariations([]);
  };

  const updateEmailPreview = useCallback(() => {
    if (variations[0]?.subject || variations[0]?.previewText) {
      const subject = variations[0].subject;
      const preview = variations[0].previewText;
      const subjectLength = subject.length;
      const previewLength = preview.length;
      
      const truncationWarnings: string[] = [];
      if (subjectLength > 50) truncationWarnings.push(`Subject may truncate on mobile (${subjectLength} chars)`);
      if (subjectLength > 70) truncationWarnings.push(`Subject may truncate on desktop (${subjectLength} chars)`);
      if (previewLength > 90) truncationWarnings.push(`Preview may truncate (${previewLength} chars)`);
      if (previewLength < 40 && previewLength > 0) truncationWarnings.push(`Preview is short (${previewLength} chars)`);

      setEmailPreview({
        gmail: {
          inboxDisplay: `${subject.slice(0, 70)}${subject.length > 70 ? '...' : ''} - ${preview.slice(0, 90)}`,
          mobileDisplay: `${subject.slice(0, 40)}${subject.length > 40 ? '...' : ''}`
        },
        outlook: {
          inboxDisplay: `${subject.slice(0, 60)}${subject.length > 60 ? '...' : ''} ${preview.slice(0, 50)}`,
          mobileDisplay: `${subject.slice(0, 35)}${subject.length > 35 ? '...' : ''}`
        },
        apple: {
          inboxDisplay: `${subject.slice(0, 65)}${subject.length > 65 ? '...' : ''} - ${preview.slice(0, 75)}`,
          mobileDisplay: `${subject.slice(0, 38)}${subject.length > 38 ? '...' : ''}`
        },
        characterCounts: {
          subject: subjectLength,
          preview: previewLength,
          subjectOptimal: subjectLength >= 30 && subjectLength <= 50,
          previewOptimal: previewLength >= 40 && previewLength <= 90
        },
        truncationWarnings
      });
    } else {
      setEmailPreview(null);
    }
  }, [variations]);

  useEffect(() => {
    updateEmailPreview();
  }, [variations, updateEmailPreview]);

  const getGradeColor = (grade: string) => {
    if (grade.startsWith('A')) return 'text-green-400 border-green-500';
    if (grade.startsWith('B')) return 'text-yellow-400 border-yellow-500';
    if (grade.startsWith('C')) return 'text-orange-400 border-orange-500';
    return 'text-red-400 border-red-500';
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'High': return 'bg-red-500/20 border-red-500 text-red-300';
      case 'Medium': return 'bg-yellow-500/20 border-yellow-500 text-yellow-300';
      case 'Low': return 'bg-blue-500/20 border-blue-500 text-blue-300';
      default: return 'bg-gray-500/20 border-gray-500 text-gray-300';
    }
  };

  const sidebarStyle = {
    "--sidebar-width": "18rem",
    "--sidebar-width-icon": "4rem",
  };

  const renderHistoryView = () => (
    <div className="animate-fade-in space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Analysis History</h2>
          <p className="text-muted-foreground">Your past email analyses and scores</p>
        </div>
        {history.length > 0 && (
          <Button
            onClick={handleClearHistory}
            variant="destructive"
            size="sm"
            data-testid="button-clear-history"
          >
            Clear All
          </Button>
        )}
      </div>
      
      {history.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <HistoryIcon className="w-8 h-8 text-muted-foreground" />
            </div>
            <p className="text-lg font-medium text-foreground mb-1">No analysis history yet</p>
            <p className="text-sm text-muted-foreground">Grade your first email to see it here</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {history.filter(item => item?.result?.overallGrade?.grade).map((item) => (
            <Card 
              key={item.id} 
              className="card-lift cursor-pointer"
              onClick={() => handleViewHistory(item)}
              data-testid={`history-item-${item.id}`}
            >
              <CardContent className="flex items-center justify-between p-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3">
                    <div className={`text-2xl font-bold ${getGradeColor(item.result?.overallGrade?.grade || 'N/A')}`}>
                      {item.result?.overallGrade?.grade || 'N/A'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-foreground font-medium truncate">
                        {item.content?.variations?.[0]?.subject || 'No subject'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(item.date).toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric', 
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => handleViewHistory(item)}
                    data-testid={`button-view-history-${item.id}`}
                  >
                    <EyeIcon className="w-4 h-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => handleDeleteHistory(item.id)}
                    className="text-destructive hover:text-destructive"
                    data-testid={`button-delete-history-${item.id}`}
                  >
                    <TrashIcon className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );

  const renderCreateView = () => (
    <div className="animate-fade-in space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Create</h2>
        <p className="text-muted-foreground">Build and write emails with powerful tools</p>
      </div>

      {createSubView === 'rewrite' && (
        <Card className="card-lift">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <div>
                <CardTitle>AI Rewrite</CardTitle>
                <CardDescription>Transform your email with AI assistance</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {history.length > 0 && (
              <div className="p-4 rounded-lg bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20">
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Load from Previous Email
                </label>
                <select
                  className="w-full h-10 px-3 py-2 rounded-md border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  data-testid="select-previous-email"
                  defaultValue=""
                  onChange={(e) => {
                    const value = e.target.value;
                    if (!value) return;
                    const item = history.find(h => h.id === value);
                    if (item) {
                      const subject = item.content.variations?.[0]?.subject || '';
                      const previewText = item.content.variations?.[0]?.previewText || '';
                      const emailBody = item.content.body || '';
                      
                      setVariations([{ subject, previewText }]);
                      setBody(emailBody);
                      toast({
                        title: 'Email Loaded',
                        description: `Loaded "${subject || 'Untitled'}" for rewriting`,
                      });
                    }
                  }}
                >
                  <option value="">Select a previous email to improve...</option>
                  {history.map((item) => {
                    const score = item.result?.inboxPlacementScore?.score || 0;
                    const isLowScore = score < 70;
                    const subject = item.content?.variations?.[0]?.subject || 'No subject';
                    const truncatedSubject = subject.length > 40 ? subject.slice(0, 40) + '...' : subject;
                    return (
                      <option 
                        key={item.id} 
                        value={item.id}
                        data-testid={`select-email-${item.id}`}
                        className={isLowScore ? 'text-amber-500' : ''}
                      >
                        {score} - {truncatedSubject}{isLowScore ? ' (needs improvement)' : ''}
                      </option>
                    );
                  })}
                </select>
                <p className="text-xs text-muted-foreground mt-2">
                  {history.filter(h => (h.result?.inboxPlacementScore?.score || 0) < 70).length} email(s) scoring below 70
                </p>
              </div>
            )}
            
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-2 block">Subject Line</label>
                <Input
                  value={variations[0]?.subject || ''}
                  onChange={(e) => {
                    const newVariations = [...variations];
                    if (newVariations[0]) {
                      newVariations[0].subject = e.target.value;
                      setVariations(newVariations);
                    }
                  }}
                  placeholder="Enter your email subject line..."
                  className="bg-muted/50"
                  data-testid="input-rewrite-subject"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-2 block">Email Body</label>
                <Textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="Paste your email content here to rewrite..."
                  className="h-40 bg-muted/50 resize-none"
                  data-testid="textarea-rewrite-body"
                />
              </div>
            </div>
            
            <div className="flex flex-wrap gap-2">
              <span className="text-sm text-muted-foreground self-center mr-2">Optimize for:</span>
              {['general', 'urgency', 'clarity', 'concise'].map((goal) => (
                <Button
                  key={goal}
                  onClick={() => setRewriteGoal(goal)}
                  variant={rewriteGoal === goal ? 'default' : 'secondary'}
                  size="sm"
                >
                  {goal.charAt(0).toUpperCase() + goal.slice(1)}
                </Button>
              ))}
            </div>
            
            <Button
              onClick={handleRewrite}
              disabled={isRewriting || !body.trim()}
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
              data-testid="button-rewrite"
            >
              {isRewriting ? (
                <>
                  <Sparkles className="w-4 h-4 mr-2 animate-spin" />
                  Rewriting...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Generate Rewrite
                </>
              )}
            </Button>

            {rewrittenEmail && (
              <div className="space-y-3 animate-fade-in">
                <Card className="bg-card/50">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-semibold text-primary">Subject</span>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => copyToClipboard(rewrittenEmail.subject, 'rewrite-subject')}
                      >
                        {copiedItem === 'rewrite-subject' ? <CheckIcon className="w-4 h-4 text-green-400" /> : <CopyIcon className="w-4 h-4" />}
                      </Button>
                    </div>
                    <p className="text-foreground">{rewrittenEmail.subject}</p>
                  </CardContent>
                </Card>
                <Card className="bg-card/50">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-semibold text-primary">Preview Text</span>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => copyToClipboard(rewrittenEmail.previewText, 'rewrite-preview')}
                      >
                        {copiedItem === 'rewrite-preview' ? <CheckIcon className="w-4 h-4 text-green-400" /> : <CopyIcon className="w-4 h-4" />}
                      </Button>
                    </div>
                    <p className="text-muted-foreground">{rewrittenEmail.previewText}</p>
                  </CardContent>
                </Card>
                <Card className="bg-card/50">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-semibold text-primary">Body</span>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => copyToClipboard(rewrittenEmail.body, 'rewrite-body')}
                      >
                        {copiedItem === 'rewrite-body' ? <CheckIcon className="w-4 h-4 text-green-400" /> : <CopyIcon className="w-4 h-4" />}
                      </Button>
                    </div>
                    <p className="text-muted-foreground whitespace-pre-line">{rewrittenEmail.body}</p>
                  </CardContent>
                </Card>
                <div className="flex gap-3">
                  <Button
                    onClick={handleAcceptRewrite}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                    data-testid="button-accept-rewrite"
                  >
                    Accept & Load into Editor
                  </Button>
                  <Button
                    onClick={() => setRewrittenEmail(null)}
                    variant="secondary"
                    data-testid="button-discard-rewrite"
                  >
                    Discard
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {createSubView === 'followup' && (
        <Card className="card-lift">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500">
                <Mail className="w-5 h-5 text-white" />
              </div>
              <div>
                <CardTitle>Follow-Up Generator</CardTitle>
                <CardDescription>Generate intelligent follow-up emails</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {history.length > 0 && (
              <div className="p-4 rounded-lg bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-500/20">
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Select Original Email
                </label>
                <select
                  className="w-full h-10 px-3 py-2 rounded-md border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  data-testid="select-followup-email"
                  defaultValue=""
                  onChange={(e) => {
                    const value = e.target.value;
                    if (!value) return;
                    const item = history.find(h => h.id === value);
                    if (item) {
                      const subject = item.content.variations?.[0]?.subject || '';
                      const previewText = item.content.variations?.[0]?.previewText || '';
                      const emailBody = item.content.body || '';
                      
                      setVariations([{ subject, previewText }]);
                      setBody(emailBody);
                      setResult(item.result);
                      toast({
                        title: 'Email Selected',
                        description: `Selected "${subject || 'Untitled'}" for follow-up`,
                      });
                    }
                  }}
                >
                  <option value="">Select an email to follow up on...</option>
                  {history.map((item) => {
                    const subject = item.content?.variations?.[0]?.subject || 'No subject';
                    const truncatedSubject = subject.length > 50 ? subject.slice(0, 50) + '...' : subject;
                    const formattedDate = item.date ? new Date(item.date).toLocaleDateString() : '';
                    return (
                      <option 
                        key={item.id} 
                        value={item.id}
                        data-testid={`select-followup-email-${item.id}`}
                      >
                        {truncatedSubject}{formattedDate ? ` (${formattedDate})` : ''}
                      </option>
                    );
                  })}
                </select>
                {(variations[0]?.subject || body) && (
                  <div className="mt-3 p-3 rounded-lg bg-background/50 border border-border/50 space-y-2">
                    <div>
                      <span className="text-xs font-medium text-muted-foreground">Subject:</span>
                      <p className="text-sm text-foreground">{variations[0]?.subject || 'No subject'}</p>
                    </div>
                    {body && (
                      <div>
                        <span className="text-xs font-medium text-muted-foreground">Body Preview:</span>
                        <p className="text-sm text-muted-foreground line-clamp-3">{body}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row gap-3">
                <select
                  value={followUpGoal}
                  onChange={(e) => setFollowUpGoal(e.target.value)}
                  className="bg-muted border border-border text-foreground text-sm rounded-lg focus:ring-2 focus:ring-primary focus:border-primary block w-full sm:w-auto p-2.5"
                  data-testid="select-followup-goal"
                >
                  <optgroup label="Single Follow-Up">
                    <option value="reminder">Gentle Reminder</option>
                    <option value="discount">Offer Discount</option>
                    <option value="query">Address a Query</option>
                  </optgroup>
                  <optgroup label="Email Sequences">
                    <option value="sequence">Custom Sequence</option>
                    <option value="nurture">Nurture Sequence</option>
                    <option value="welcome">Welcome Sequence</option>
                    <option value="re-engagement">Re-engagement Sequence</option>
                    <option value="launch">Product Launch Sequence</option>
                    <option value="book-a-call">Book a Call Sequence</option>
                    <option value="abandoned-cart">Abandoned Cart Sequence</option>
                    <option value="webinar">Webinar Sequence</option>
                    <option value="testimonial">Testimonial Request Sequence</option>
                    <option value="upsell">Upsell/Cross-sell Sequence</option>
                    <option value="survey">Survey/Feedback Sequence</option>
                  </optgroup>
                </select>
              </div>
            </div>

            <textarea
              value={followUpContext}
              onChange={(e) => setFollowUpContext(e.target.value)}
              placeholder={
                ['sequence', 'nurture', 'welcome', 're-engagement', 'launch', 'book-a-call', 'abandoned-cart', 'webinar', 'testimonial', 'upsell', 'survey'].includes(followUpGoal)
                  ? "Describe the sequence goal (e.g., convert trial users to paid, onboard new customers...)"
                  : "Add additional context for the follow-up (optional)"
              }
              className="w-full h-20 bg-muted border border-border rounded-lg p-3 text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary outline-none resize-none"
            />
            
            <Button
              onClick={handleGenerateFollowUp}
              disabled={isGeneratingFollowUp || (['sequence', 'nurture', 'welcome', 're-engagement', 'launch', 'book-a-call', 'abandoned-cart', 'webinar', 'testimonial', 'upsell', 'survey'].includes(followUpGoal) && !followUpContext.trim())}
              className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600"
              data-testid="button-generate-followup"
            >
              {isGeneratingFollowUp ? (
                <>
                  <Sparkles className="w-4 h-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : ['sequence', 'nurture', 'welcome', 're-engagement', 'launch', 'book-a-call', 'abandoned-cart', 'webinar', 'testimonial', 'upsell', 'survey'].includes(followUpGoal) ? (
                'Generate 10-Email Sequence'
              ) : (
                'Generate Follow-Up'
              )}
            </Button>

            {followUpEmail && (
              <div className="space-y-3 animate-fade-in">
                <Card className="bg-card/50">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-semibold text-primary">Subject</span>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => copyToClipboard(followUpEmail.subject, 'followup-subject')}
                      >
                        {copiedItem === 'followup-subject' ? <CheckIcon className="w-4 h-4 text-green-400" /> : <CopyIcon className="w-4 h-4" />}
                      </Button>
                    </div>
                    <p className="text-foreground">{followUpEmail.subject}</p>
                  </CardContent>
                </Card>
                <Card className="bg-card/50">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-semibold text-primary">Body</span>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => copyToClipboard(followUpEmail.body, 'followup-body')}
                      >
                        {copiedItem === 'followup-body' ? <CheckIcon className="w-4 h-4 text-green-400" /> : <CopyIcon className="w-4 h-4" />}
                      </Button>
                    </div>
                    <p className="text-muted-foreground whitespace-pre-line">{followUpEmail.body}</p>
                  </CardContent>
                </Card>
                <div className="flex gap-3">
                  <Button
                    onClick={() => handleLoadFollowUp(followUpEmail)}
                    className="flex-1"
                    data-testid="button-load-followup"
                  >
                    Load into Editor
                  </Button>
                  <Button
                    onClick={() => setFollowUpEmail(null)}
                    variant="secondary"
                    data-testid="button-dismiss-followup"
                  >
                    Dismiss
                  </Button>
                </div>
              </div>
            )}

            {followUpSequence.length > 0 && (
              <div className="space-y-4 animate-fade-in">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Generated {followUpSequence.length} emails</span>
                  <Button
                    onClick={() => setFollowUpSequence([])}
                    variant="ghost"
                    size="sm"
                  >
                    Clear Sequence
                  </Button>
                </div>
                {followUpSequence.map((email, i) => (
                  <Card key={i} className="bg-card/50">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Badge className="bg-primary text-primary-foreground">
                            Email {i + 1}
                          </Badge>
                          <span className="text-sm text-muted-foreground">{email.timingSuggestion}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleLoadFollowUp(email)}
                            title="Load into Editor"
                            data-testid={`button-load-sequence-${i}`}
                          >
                            <Mail className="w-4 h-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => copyToClipboard(`Subject: ${email.subject}\n\n${email.body}`, `sequence-${i}`)}
                          >
                            {copiedItem === `sequence-${i}` ? <CheckIcon className="w-4 h-4 text-green-400" /> : <CopyIcon className="w-4 h-4" />}
                          </Button>
                        </div>
                      </div>
                      <div className="mb-2">
                        <span className="text-xs text-muted-foreground">Subject:</span>
                        <p className="text-foreground font-medium">{email.subject}</p>
                      </div>
                      <div className="mb-2">
                        <span className="text-xs text-muted-foreground">Body:</span>
                        <p className="text-muted-foreground text-sm whitespace-pre-line">{email.body}</p>
                      </div>
                      <div className="mt-3 pt-3 border-t border-border">
                        <span className="text-xs text-muted-foreground">Rationale:</span>
                        <p className="text-xs text-primary">{email.rationale}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {optimizeSubView === 'variations' && (
        <Card className="card-lift">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-green-500 to-emerald-500">
                <Target className="w-5 h-5 text-white" />
              </div>
              <div>
                <CardTitle>A/B Subject Line Lab</CardTitle>
                <CardDescription>Generate 5 subject line variations with predicted open rates</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {history.length > 0 && (
              <div className="p-4 rounded-lg bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20">
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Load from Previous Email
                </label>
                <select
                  className="w-full h-10 px-3 py-2 rounded-md border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  data-testid="select-variations-email"
                  defaultValue=""
                  onChange={(e) => {
                    const value = e.target.value;
                    if (!value) return;
                    const item = history.find(h => h.id === value);
                    if (item) {
                      const subject = item.content.variations?.[0]?.subject || '';
                      const previewText = item.content.variations?.[0]?.previewText || '';
                      const emailBody = item.content.body || '';
                      
                      setVariations([{ subject, previewText }]);
                      setBody(emailBody);
                      toast({
                        title: 'Email Loaded',
                        description: `Loaded "${subject || 'Untitled'}" for A/B testing`,
                      });
                    }
                  }}
                >
                  <option value="">Select an email to test...</option>
                  {history.map((item) => {
                    const subject = item.content?.variations?.[0]?.subject || 'No subject';
                    const truncatedSubject = subject.length > 50 ? subject.slice(0, 50) + '...' : subject;
                    const formattedDate = item.date ? new Date(item.date).toLocaleDateString() : '';
                    return (
                      <option 
                        key={item.id} 
                        value={item.id}
                        data-testid={`select-variations-email-${item.id}`}
                      >
                        {truncatedSubject}{formattedDate ? ` (${formattedDate})` : ''}
                      </option>
                    );
                  })}
                </select>
                {(variations[0]?.subject || body) && (
                  <div className="mt-3 p-3 rounded-lg bg-background/50 border border-border/50 space-y-2">
                    <div>
                      <span className="text-xs font-medium text-muted-foreground">Subject:</span>
                      <p className="text-sm text-foreground">{variations[0]?.subject || 'No subject'}</p>
                    </div>
                    {body && (
                      <div>
                        <span className="text-xs font-medium text-muted-foreground">Body Preview:</span>
                        <p className="text-sm text-muted-foreground line-clamp-3">{body}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {(!variations[0]?.subject.trim() || !body.trim()) && !history.length && (
              <Card className="bg-muted/50 border-dashed">
                <CardContent className="p-4">
                  <p className="text-sm text-muted-foreground mb-3">
                    Enter your email content below to generate subject line variations, or go to the <button onClick={() => { setActiveView('grader'); clearAllSubViews(); }} className="text-primary underline">Email Grader</button> first.
                  </p>
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1 block">Subject Line (required)</label>
                      <Input
                        value={variations[0]?.subject || ''}
                        onChange={(e) => setVariations([{ ...variations[0], subject: e.target.value }])}
                        placeholder="Enter your current subject line..."
                        data-testid="input-variations-subject"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1 block">Email Body (required for context)</label>
                      <Textarea
                        value={body}
                        onChange={(e) => setBody(e.target.value)}
                        placeholder="Paste or type your email content here..."
                        rows={6}
                        data-testid="input-variations-body"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <Button
              onClick={handleGenerateSubjectVariations}
              disabled={isGeneratingVariations || !variations[0]?.subject.trim() || !body.trim()}
              className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
              data-testid="button-generate-variations"
            >
              {isGeneratingVariations ? (
                <>
                  <Sparkles className="w-4 h-4 mr-2 animate-spin" />
                  Generating Variations...
                </>
              ) : (
                <>
                  <Target className="w-4 h-4 mr-2" />
                  Generate A/B Variations
                </>
              )}
            </Button>

            {subjectVariations.length > 0 && (
              <div className="space-y-3 animate-fade-in">
                {subjectVariations.map((variation, i) => (
                  <Card key={i} className="bg-card/50">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <Badge variant="secondary">{variation.style}</Badge>
                        <div className="flex items-center gap-2">
                          <span className={`text-sm font-bold ${
                            variation.predictedOpenRate >= 30 ? 'text-green-400' : 
                            variation.predictedOpenRate >= 20 ? 'text-yellow-400' : 'text-red-400'
                          }`}>
                            {variation.predictedOpenRate}% predicted open rate
                          </span>
                          <Button
                            onClick={() => handleUseVariation(variation)}
                            size="sm"
                            data-testid={`button-use-variation-${i}`}
                          >
                            Use
                          </Button>
                        </div>
                      </div>
                      <p className="text-foreground font-medium mb-1">{variation.subject}</p>
                      <p className="text-muted-foreground text-sm mb-2">{variation.previewText}</p>
                      <p className="text-xs text-muted-foreground">{variation.rationale}</p>
                    </CardContent>
                  </Card>
                ))}
                <Button
                  onClick={() => setSubjectVariations([])}
                  variant="secondary"
                  className="w-full"
                >
                  Clear Variations
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {createSubView === 'tone' && (
        <Card className="card-lift">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-pink-500 to-rose-500">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <CardTitle>Tone Profiles</CardTitle>
                <CardDescription>Rewrite your email with a specific voice and personality</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {history.length > 0 && (
              <div className="p-4 rounded-lg bg-gradient-to-r from-pink-500/10 to-rose-500/10 border border-pink-500/20">
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Load from Previous Email
                </label>
                <select
                  className="w-full h-10 px-3 py-2 rounded-md border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  data-testid="select-tone-email"
                  defaultValue=""
                  onChange={(e) => {
                    const value = e.target.value;
                    if (!value) return;
                    const item = history.find(h => h.id === value);
                    if (item) {
                      const subject = item.content.variations?.[0]?.subject || '';
                      const previewText = item.content.variations?.[0]?.previewText || '';
                      const emailBody = item.content.body || '';
                      
                      setVariations([{ subject, previewText }]);
                      setBody(emailBody);
                      toast({
                        title: 'Email Loaded',
                        description: `Loaded "${subject || 'Untitled'}" for tone rewriting`,
                      });
                    }
                  }}
                >
                  <option value="">Select an email to rewrite...</option>
                  {history.map((item) => {
                    const subject = item.content?.variations?.[0]?.subject || 'No subject';
                    const truncatedSubject = subject.length > 50 ? subject.slice(0, 50) + '...' : subject;
                    const formattedDate = item.date ? new Date(item.date).toLocaleDateString() : '';
                    return (
                      <option 
                        key={item.id} 
                        value={item.id}
                        data-testid={`select-tone-email-${item.id}`}
                      >
                        {truncatedSubject}{formattedDate ? ` (${formattedDate})` : ''}
                      </option>
                    );
                  })}
                </select>
                {(variations[0]?.subject || body) && (
                  <div className="mt-3 p-3 rounded-lg bg-background/50 border border-border/50 space-y-2">
                    <div>
                      <span className="text-xs font-medium text-muted-foreground">Subject:</span>
                      <p className="text-sm text-foreground">{variations[0]?.subject || 'No subject'}</p>
                    </div>
                    {body && (
                      <div>
                        <span className="text-xs font-medium text-muted-foreground">Body Preview:</span>
                        <p className="text-sm text-muted-foreground line-clamp-3">{body}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {!body.trim() && !history.length && (
              <Card className="bg-muted/50 border-dashed">
                <CardContent className="p-4">
                  <p className="text-sm text-muted-foreground mb-3">
                    Enter your email content below, or go to the <button onClick={() => { setActiveView('grader'); clearAllSubViews(); }} className="text-primary underline">Email Grader</button> first to input your email.
                  </p>
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1 block">Subject Line</label>
                      <Input
                        value={variations[0]?.subject || ''}
                        onChange={(e) => setVariations([{ ...variations[0], subject: e.target.value }])}
                        placeholder="Enter your subject line..."
                        data-testid="input-tone-subject"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1 block">Email Body</label>
                      <Textarea
                        value={body}
                        onChange={(e) => setBody(e.target.value)}
                        placeholder="Paste or type your email content here..."
                        rows={6}
                        data-testid="input-tone-body"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="flex flex-wrap gap-2">
              {(['professional', 'friendly', 'urgent', 'fomo', 'storytelling'] as ToneProfile[]).map((tone) => (
                <Button
                  key={tone}
                  onClick={() => setSelectedTone(tone)}
                  variant={selectedTone === tone ? 'default' : 'secondary'}
                  size="sm"
                >
                  {tone === 'fomo' ? 'FOMO' : tone.charAt(0).toUpperCase() + tone.slice(1)}
                </Button>
              ))}
            </div>

            <Button
              onClick={handleToneRewrite}
              disabled={isGeneratingTone || !body.trim()}
              className="w-full bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600"
              data-testid="button-tone-rewrite"
            >
              {isGeneratingTone ? (
                <>
                  <Sparkles className="w-4 h-4 mr-2 animate-spin" />
                  Rewriting...
                </>
              ) : (
                `Rewrite as ${selectedTone === 'fomo' ? 'FOMO' : selectedTone.charAt(0).toUpperCase() + selectedTone.slice(1)}`
              )}
            </Button>

            {toneRewrite && (
              <div className="space-y-3 animate-fade-in">
                <Card className="bg-primary/10 border-primary/30">
                  <CardContent className="p-4">
                    <p className="text-sm text-primary">{toneRewrite.toneNotes}</p>
                  </CardContent>
                </Card>
                <Card className="bg-card/50">
                  <CardContent className="p-4">
                    <span className="text-sm font-semibold text-primary">Subject</span>
                    <p className="text-foreground mt-1">{toneRewrite.subject}</p>
                  </CardContent>
                </Card>
                <Card className="bg-card/50">
                  <CardContent className="p-4">
                    <span className="text-sm font-semibold text-primary">Preview</span>
                    <p className="text-muted-foreground mt-1">{toneRewrite.previewText}</p>
                  </CardContent>
                </Card>
                <Card className="bg-card/50">
                  <CardContent className="p-4">
                    <span className="text-sm font-semibold text-primary">Body</span>
                    <p className="text-muted-foreground mt-1 whitespace-pre-line">{toneRewrite.body}</p>
                  </CardContent>
                </Card>
                <div className="flex gap-3">
                  <Button
                    onClick={handleAcceptToneRewrite}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                    data-testid="button-accept-tone"
                  >
                    Accept & Load into Editor
                  </Button>
                  <Button
                    onClick={() => setToneRewrite(null)}
                    variant="secondary"
                    data-testid="button-discard-tone"
                  >
                    Discard
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {optimizeSubView === 'preview' && (
        <EmailPreviewTool />
      )}

      {optimizeSubView === 'spam' && (
        <SpamChecker history={history} />
      )}

      {optimizeSubView === 'sentiment' && (
        <SentimentAnalyzer />
      )}

      {createSubView === 'templates' && (
        <EmailTemplates
          currentSubject={variations[0]?.subject || ''}
          currentPreviewText={variations[0]?.previewText || ''}
          currentBody={body}
          onLoadTemplate={(subject, previewText, bodyContent) => {
            setVariations([{ subject, previewText }]);
            setBody(bodyContent);
          }}
        />
      )}

      {createSubView === 'import' && (
        <EmailImport
          onLoadEmail={(subject, previewText, bodyContent) => {
            setVariations([{ subject, previewText }]);
            setBody(bodyContent);
            setActiveView('grader');
            clearAllSubViews();
          }}
        />
      )}

      {optimizeSubView === 'competitor' && (
        <CompetitorAnalysis />
      )}

      {optimizeSubView === 'sendtime' && (
        <SendTimeOptimizer />
      )}

      {createSubView === 'builder' && (
        <EmailBuilder />
      )}

      {createSubView === 'content' && (
        <ContentGenerator />
      )}

      {!createSubView && (
        <div className="grid md:grid-cols-2 gap-4">
          <Card className="card-lift cursor-pointer" onClick={() => setCreateSubView('content')} data-testid="card-create-content">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Content Generator</h3>
                <p className="text-sm text-muted-foreground">AI-powered content with undo/redo</p>
              </div>
            </CardContent>
          </Card>
          <Card className="card-lift cursor-pointer" onClick={() => setCreateSubView('builder')} data-testid="card-create-builder">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500">
                <Mail className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Email Builder</h3>
                <p className="text-sm text-muted-foreground">Build emails visually</p>
              </div>
            </CardContent>
          </Card>
          <Card className="card-lift cursor-pointer" onClick={() => setCreateSubView('rewrite')} data-testid="card-create-rewrite">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Rewrite</h3>
                <p className="text-sm text-muted-foreground">Transform your email</p>
              </div>
            </CardContent>
          </Card>
          <Card className="card-lift cursor-pointer" onClick={() => setCreateSubView('followup')} data-testid="card-create-followup">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500">
                <Mail className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Follow-ups</h3>
                <p className="text-sm text-muted-foreground">Generate follow-up emails</p>
              </div>
            </CardContent>
          </Card>
          <Card className="card-lift cursor-pointer" onClick={() => setCreateSubView('templates')} data-testid="card-create-templates">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Templates</h3>
                <p className="text-sm text-muted-foreground">Save and reuse your best emails</p>
              </div>
            </CardContent>
          </Card>
          <Card className="card-lift cursor-pointer" onClick={() => setCreateSubView('tone')} data-testid="card-create-tone">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-pink-500 to-rose-500">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Tone Profiles</h3>
                <p className="text-sm text-muted-foreground">Change your email's voice</p>
              </div>
            </CardContent>
          </Card>
          <Card className="card-lift cursor-pointer" onClick={() => setCreateSubView('import')} data-testid="card-create-import">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-500">
                <Upload className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Import Email</h3>
                <p className="text-sm text-muted-foreground">Import .eml files to analyze</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );

  const renderOptimizeView = () => (
    <div className="animate-fade-in space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Optimize</h2>
        <p className="text-muted-foreground">Test and optimize your emails for better results</p>
      </div>

      {optimizeSubView === 'variations' && (
        <Card className="card-lift">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-green-500 to-emerald-500">
                <Target className="w-5 h-5 text-white" />
              </div>
              <div>
                <CardTitle>A/B Subject Line Lab</CardTitle>
                <CardDescription>Generate 5 subject line variations with predicted open rates</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Show current email content if available */}
            {variations[0]?.subject.trim() && body.trim() ? (
              <div className="p-3 rounded-lg bg-muted/50 border border-border space-y-2">
                <div>
                  <span className="text-xs font-medium text-muted-foreground">Subject:</span>
                  <p className="text-sm text-foreground">{variations[0]?.subject || 'No subject'}</p>
                </div>
                {body && (
                  <div>
                    <span className="text-xs font-medium text-muted-foreground">Body Preview:</span>
                    <p className="text-sm text-muted-foreground line-clamp-3">{body}</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-4 rounded-lg bg-muted/50 border border-dashed border-border">
                <p className="text-sm text-muted-foreground mb-3">
                  Enter your email content below to generate subject line variations, or go to the <button onClick={() => { setActiveView('grader'); clearAllSubViews(); }} className="text-primary underline">Email Grader</button> first.
                </p>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">Subject Line (required)</label>
                    <Input
                      value={variations[0]?.subject || ''}
                      onChange={(e) => setVariations([{ ...variations[0], subject: e.target.value }])}
                      placeholder="Enter your current subject line..."
                      data-testid="input-optimize-variations-subject"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">Email Body (required for context)</label>
                    <Textarea
                      value={body}
                      onChange={(e) => setBody(e.target.value)}
                      placeholder="Paste or type your email content here..."
                      rows={6}
                      data-testid="input-optimize-variations-body"
                    />
                  </div>
                </div>
              </div>
            )}

            <Button
              onClick={handleGenerateSubjectVariations}
              disabled={isGeneratingVariations || !variations[0]?.subject.trim() || !body.trim()}
              className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
              data-testid="button-generate-variations"
            >
              {isGeneratingVariations ? (
                <>
                  <Sparkles className="w-4 h-4 mr-2 animate-spin" />
                  Generating Variations...
                </>
              ) : (
                <>
                  <Target className="w-4 h-4 mr-2" />
                  Generate A/B Variations
                </>
              )}
            </Button>

            {/* Show generated variations */}
            {subjectVariations.length > 0 && (
              <div className="space-y-3 animate-fade-in">
                {subjectVariations.map((variation, i) => (
                  <Card key={i} className="bg-card/50">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <Badge variant="secondary">{variation.style}</Badge>
                        <div className="flex items-center gap-2">
                          <span className={`text-sm font-bold ${
                            variation.predictedOpenRate >= 30 ? 'text-green-600 dark:text-green-400' : 
                            variation.predictedOpenRate >= 20 ? 'text-yellow-600 dark:text-yellow-400' : 'text-red-600 dark:text-red-400'
                          }`}>
                            {variation.predictedOpenRate}% predicted open rate
                          </span>
                          <Button
                            onClick={() => handleUseVariation(variation)}
                            size="sm"
                            data-testid={`button-use-variation-optimize-${i}`}
                          >
                            Use
                          </Button>
                        </div>
                      </div>
                      <p className="text-foreground font-medium mb-1">{variation.subject}</p>
                      <p className="text-muted-foreground text-sm mb-2">{variation.previewText}</p>
                      <p className="text-xs text-muted-foreground">{variation.rationale}</p>
                    </CardContent>
                  </Card>
                ))}
                <Button
                  onClick={() => setSubjectVariations([])}
                  variant="secondary"
                  className="w-full"
                >
                  Clear Variations
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {optimizeSubView === 'preview' && <EmailPreviewTool />}
      {optimizeSubView === 'spam' && <SpamChecker history={history} />}
      {optimizeSubView === 'sentiment' && <SentimentAnalyzer />}
      {optimizeSubView === 'sendtime' && <SendTimeOptimizer />}
      {optimizeSubView === 'competitor' && <CompetitorAnalysis />}

      {!optimizeSubView && (
        <div className="grid md:grid-cols-2 gap-4">
          <Card className="card-lift cursor-pointer" onClick={() => setOptimizeSubView('variations')} data-testid="card-optimize-variations">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500">
                <Target className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">A/B Subject Lab</h3>
                <p className="text-sm text-muted-foreground">Test subject variations</p>
              </div>
            </CardContent>
          </Card>
          <Card className="card-lift cursor-pointer" onClick={() => setOptimizeSubView('preview')} data-testid="card-optimize-preview">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500">
                <Mail className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Email Preview</h3>
                <p className="text-sm text-muted-foreground">See how emails look</p>
              </div>
            </CardContent>
          </Card>
          <Card className="card-lift cursor-pointer" onClick={() => setOptimizeSubView('spam')} data-testid="card-optimize-spam">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-orange-500 to-red-500">
                <ShieldAlert className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Spam Checker</h3>
                <p className="text-sm text-muted-foreground">Scan for spam triggers</p>
              </div>
            </CardContent>
          </Card>
          <Card className="card-lift cursor-pointer" onClick={() => setOptimizeSubView('sentiment')} data-testid="card-optimize-sentiment">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-pink-500 to-rose-500">
                <Heart className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Sentiment</h3>
                <p className="text-sm text-muted-foreground">Analyze emotional tone</p>
              </div>
            </CardContent>
          </Card>
          <Card className="card-lift cursor-pointer" onClick={() => setOptimizeSubView('sendtime')} data-testid="card-optimize-sendtime">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-amber-500 to-yellow-500">
                <Activity className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Send Time</h3>
                <p className="text-sm text-muted-foreground">Optimize send timing</p>
              </div>
            </CardContent>
          </Card>
          <Card className="card-lift cursor-pointer" onClick={() => setOptimizeSubView('competitor')} data-testid="card-optimize-competitor">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-violet-500 to-purple-500">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Competitor Analysis</h3>
                <p className="text-sm text-muted-foreground">Analyze competitor strategies</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );

  const renderAnalyticsView = () => (
    <div className="animate-fade-in space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Analytics</h2>
        <p className="text-muted-foreground">Track and analyze your email performance</p>
      </div>

      {analyticsSubView === 'stats' && (
        <Suspense fallback={<ComponentLoader />}>
          <ESPStatsDashboard onNavigateToFunnel={() => setAnalyticsSubView('funnel')} />
        </Suspense>
      )}

      {analyticsSubView === 'funnel' && (
        <Suspense fallback={<ComponentLoader />}>
          <CampaignFunnelVisualization />
        </Suspense>
      )}

      {analyticsSubView === 'intelligence' && (
        <Suspense fallback={<ComponentLoader />}>
          <DeliverabilityIntelligence />
        </Suspense>
      )}

      {!analyticsSubView && (
        <div className="grid md:grid-cols-2 gap-4">
          <Card className="card-lift cursor-pointer" onClick={() => setAnalyticsSubView('stats')} data-testid="card-analytics-stats">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Campaign Stats</h3>
                <p className="text-sm text-muted-foreground">View campaign performance</p>
              </div>
            </CardContent>
          </Card>
          <Card className="card-lift cursor-pointer" onClick={() => setAnalyticsSubView('funnel')} data-testid="card-analytics-funnel">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500">
                <Activity className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Campaign Funnel</h3>
                <p className="text-sm text-muted-foreground">Visualize email funnel</p>
              </div>
            </CardContent>
          </Card>
          <Card className="card-lift cursor-pointer" onClick={() => setAnalyticsSubView('intelligence')} data-testid="card-analytics-intelligence">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500">
                <Activity className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Trend Intelligence</h3>
                <p className="text-sm text-muted-foreground">Deliverability trends</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );

  const renderHighlevelView = () => (
    <div className="animate-fade-in space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">HighLevel Email Hub</h2>
        <p className="text-muted-foreground">Your complete guide to email deliverability in GoHighLevel</p>
      </div>

      {highlevelSubView === 'getting-started' && <HighLevelGettingStarted />}
      {highlevelSubView === 'warmup' && <HighLevelWarmup />}
      {highlevelSubView === 'authentication' && <HighLevelAuthentication />}
      {highlevelSubView === 'deliverability' && <HighLevelDeliverability />}
      {highlevelSubView === 'troubleshooting' && <HighLevelTroubleshooting />}
      {highlevelSubView === 'advanced' && <HighLevelAdvanced />}

      {!highlevelSubView && (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card className="card-lift cursor-pointer" onClick={() => setHighlevelSubView('getting-started')} data-testid="card-highlevel-getting-started">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-orange-500 to-yellow-500">
                <Rocket className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Getting Started</h3>
                <p className="text-sm text-muted-foreground">Introduction to LC Email</p>
              </div>
            </CardContent>
          </Card>
          <Card className="card-lift cursor-pointer" onClick={() => setHighlevelSubView('warmup')} data-testid="card-highlevel-warmup">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-red-500 to-orange-500">
                <Thermometer className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Domain Warm-Up</h3>
                <p className="text-sm text-muted-foreground">Ramp-up schedule & limits</p>
              </div>
            </CardContent>
          </Card>
          <Card className="card-lift cursor-pointer" onClick={() => setHighlevelSubView('authentication')} data-testid="card-highlevel-authentication">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-500">
                <Key className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Authentication</h3>
                <p className="text-sm text-muted-foreground">DMARC, SPF & DKIM setup</p>
              </div>
            </CardContent>
          </Card>
          <Card className="card-lift cursor-pointer" onClick={() => setHighlevelSubView('deliverability')} data-testid="card-highlevel-deliverability">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500">
                <CheckCircle className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Best Practices</h3>
                <p className="text-sm text-muted-foreground">Deliverability tips</p>
              </div>
            </CardContent>
          </Card>
          <Card className="card-lift cursor-pointer" onClick={() => setHighlevelSubView('troubleshooting')} data-testid="card-highlevel-troubleshooting">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-amber-500 to-yellow-500">
                <Wrench className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Troubleshooting</h3>
                <p className="text-sm text-muted-foreground">Fix common issues</p>
              </div>
            </CardContent>
          </Card>
          <Card className="card-lift cursor-pointer" onClick={() => setHighlevelSubView('advanced')} data-testid="card-highlevel-advanced">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Advanced Features</h3>
                <p className="text-sm text-muted-foreground">Dedicated IPs & more</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );

  const renderConnectionsView = () => (
    <div className="animate-fade-in space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Connections</h2>
        <p className="text-muted-foreground">Connect your email service providers</p>
      </div>

      {connectionsSubView === 'esp' && (
        <ESPSettings
          connections={espConnections}
          onConnect={async (provider) => {
            setEspConnections(prev => 
              prev.map(c => c.provider === provider ? { ...c, connected: true } : c)
            );
          }}
          onDisconnect={async (provider) => {
            setEspConnections(prev => 
              prev.map(c => c.provider === provider ? { ...c, connected: false } : c)
            );
          }}
        />
      )}

      {connectionsSubView === 'contact-export' && (
        <ESPContactCleaner />
      )}

      {!connectionsSubView && (
        <div className="grid md:grid-cols-2 gap-4">
          <Card className="card-lift cursor-pointer" onClick={() => setConnectionsSubView('esp')} data-testid="card-connections-esp">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-rose-500 to-pink-500">
                <Mail className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">ESP Settings</h3>
                <p className="text-sm text-muted-foreground">Connect email providers</p>
              </div>
            </CardContent>
          </Card>
          <Card className="card-lift cursor-pointer" onClick={() => setConnectionsSubView('contact-export')} data-testid="card-connections-contact-export">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-teal-500 to-green-500">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Contact Export</h3>
                <p className="text-sm text-muted-foreground">Export and clean contacts</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );

  const renderDeliverabilityView = () => (
    <div className="animate-fade-in space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Deliverability Tools</h2>
        <p className="text-muted-foreground">Ensure your emails land in the inbox, not spam</p>
      </div>

      {deliverabilitySubView === 'dns' && (
        <DeliverabilityChecklist />
      )}

      {deliverabilitySubView === 'domain-health' && (
        <DomainHealthChecker />
      )}

      {deliverabilitySubView === 'list-quality' && (
        <ListQualityChecker />
      )}

      {deliverabilitySubView === 'bimi' && (
        <BimiGenerator />
      )}

      {deliverabilitySubView === 'warmup' && (
        <WarmupPlanner />
      )}

      {deliverabilitySubView === 'sender-score' && (
        <SenderScoreEstimator />
      )}

      {deliverabilitySubView === 'blacklist' && (
        <BlacklistMonitor />
      )}

      {deliverabilitySubView === 'campaign-risk' && (
        <CampaignRiskScore />
      )}

      {!deliverabilitySubView && (
        <div className="grid md:grid-cols-2 gap-4">
          <Card className="card-lift cursor-pointer" onClick={() => setDeliverabilitySubView('dns')}>
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500">
                <Target className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">DNS Records</h3>
                <p className="text-sm text-muted-foreground">Generate SPF, DKIM, DMARC</p>
              </div>
            </CardContent>
          </Card>
          <Card className="card-lift cursor-pointer" onClick={() => setDeliverabilitySubView('domain-health')}>
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500">
                <Mail className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Domain Health</h3>
                <p className="text-sm text-muted-foreground">Check domain reputation</p>
              </div>
            </CardContent>
          </Card>
          <Card className="card-lift cursor-pointer" onClick={() => setDeliverabilitySubView('list-quality')}>
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-orange-500 to-yellow-500">
                <Star className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">List Quality</h3>
                <p className="text-sm text-muted-foreground">Analyze email list health</p>
              </div>
            </CardContent>
          </Card>
          <Card className="card-lift cursor-pointer" onClick={() => setDeliverabilitySubView('bimi')}>
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500">
                <Trophy className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">BIMI Generator</h3>
                <p className="text-sm text-muted-foreground">Add your logo to emails</p>
              </div>
            </CardContent>
          </Card>
          <Card className="card-lift cursor-pointer" onClick={() => setDeliverabilitySubView('warmup')}>
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-red-500 to-orange-500">
                <Flame className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Warmup Planner</h3>
                <p className="text-sm text-muted-foreground">30-day warmup schedule</p>
              </div>
            </CardContent>
          </Card>
          <Card className="card-lift cursor-pointer" onClick={() => setDeliverabilitySubView('sender-score')}>
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500">
                <ShieldAlert className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-foreground">Sender Score Estimator</h3>
                </div>
                <p className="text-sm text-muted-foreground">Analyze your authentication, list hygiene, and sending practices to estimate sender reputation</p>
              </div>
            </CardContent>
          </Card>
          <Card className="card-lift cursor-pointer" onClick={() => setDeliverabilitySubView('blacklist')}>
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-rose-500 to-red-600">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-foreground">Blacklist Monitor</h3>
                </div>
                <p className="text-sm text-muted-foreground">Check if your sending domain or IP is on major email blacklists (Spamhaus, Barracuda, etc.)</p>
              </div>
            </CardContent>
          </Card>
          <Card className="card-lift cursor-pointer" onClick={() => setDeliverabilitySubView('campaign-risk')}>
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500">
                <ShieldCheck className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-foreground">Campaign Risk Score</h3>
                  <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[10px] px-1.5 py-0">NEW</Badge>
                </div>
                <p className="text-sm text-muted-foreground">Predict how a campaign will affect your sender reputation before you send it</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );

  const handleESPConnect = async (provider: ESPProvider, credentials: Record<string, string>) => {
    const response = await fetch('/api/esp/connect', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        provider,
        apiKey: credentials.apiKey,
        apiUrl: credentials.apiUrl,
        appId: credentials.appId,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to connect');
    }

    const data = await response.json();
    setEspConnections(prev => [
      ...prev.filter(c => c.provider !== provider),
      { 
        provider, 
        connected: true, 
        accountName: data.accountInfo?.accountName || data.connection?.accountName,
        lastSync: new Date().toLocaleString() 
      }
    ]);
  };

  const handleESPDisconnect = async (provider: ESPProvider) => {
    const response = await fetch(`/api/esp/disconnect/${provider}`, {
      method: 'DELETE',
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to disconnect');
    }

    setEspConnections(prev => prev.filter(c => c.provider !== provider));
  };

  const AccountView = () => {
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [deleteConfirmText, setDeleteConfirmText] = useState('');
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isChangingPassword, setIsChangingPassword] = useState(false);
    const limits = SUBSCRIPTION_LIMITS[userTier];
    const isPasswordUser = !!user?.passwordHash;
    
    const handleLogout = () => {
      setIsLoggingOut(true);
      window.location.href = '/api/logout';
    };

    const handleChangePassword = async () => {
      if (newPassword !== confirmPassword) {
        toast({ title: 'Error', description: 'New passwords do not match', variant: 'destructive' });
        return;
      }
      if (newPassword.length < 8) {
        toast({ title: 'Error', description: 'Password must be at least 8 characters', variant: 'destructive' });
        return;
      }
      setIsChangingPassword(true);
      try {
        const response = await fetch('/api/change-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ currentPassword, newPassword }),
        });
        if (response.ok) {
          toast({ title: 'Success', description: 'Password changed successfully' });
          setCurrentPassword('');
          setNewPassword('');
          setConfirmPassword('');
        } else {
          const data = await response.json();
          toast({ title: 'Error', description: data.message || 'Failed to change password', variant: 'destructive' });
        }
      } catch (error) {
        toast({ title: 'Error', description: 'Failed to change password', variant: 'destructive' });
      } finally {
        setIsChangingPassword(false);
      }
    };

    const handleDeleteAccount = async () => {
      if (deleteConfirmText !== 'DELETE') {
        toast({ title: 'Error', description: 'Please type DELETE to confirm', variant: 'destructive' });
        return;
      }
      setIsDeleting(true);
      try {
        const response = await fetch('/api/delete-account', {
          method: 'DELETE',
          credentials: 'include',
        });
        if (response.ok) {
          toast({ title: 'Account Deleted', description: 'Your account has been permanently deleted' });
          window.location.href = '/';
        } else {
          const data = await response.json();
          toast({ title: 'Error', description: data.message || 'Failed to delete account', variant: 'destructive' });
        }
      } catch (error) {
        toast({ title: 'Error', description: 'Failed to delete account', variant: 'destructive' });
      } finally {
        setIsDeleting(false);
        setShowDeleteConfirm(false);
      }
    };

    return (
      <div className="animate-fade-in space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Account Settings</h2>
          <p className="text-muted-foreground">Manage your profile, subscription, and security</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card data-testid="card-profile">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="w-5 h-5" />
                Profile
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-xl font-bold">
                  {user?.email?.[0]?.toUpperCase() || 'U'}
                </div>
                <div>
                  <p className="font-semibold text-foreground">{user?.email}</p>
                  <Badge className={`mt-1 ${userTier === 'scale' ? 'bg-gradient-to-r from-purple-500 to-pink-500' : userTier === 'pro' ? 'bg-gradient-to-r from-blue-500 to-cyan-500' : 'bg-muted'} text-white border-0`}>
                    <Star className="w-3 h-3 mr-1" />
                    {userTier.charAt(0).toUpperCase() + userTier.slice(1)} Plan
                  </Badge>
                </div>
              </div>
              <div className="text-sm text-muted-foreground">
                Secure account
              </div>
            </CardContent>
          </Card>

          <Card data-testid="card-subscription">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5" />
                Subscription
              </CardTitle>
              <CardDescription>Your current plan and usage limits</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <span className="text-sm">Email Grades</span>
                <span className="font-medium">{limits.gradesPerMonth.toLocaleString()}/mo</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <span className="text-sm">AI Rewrites</span>
                <span className="font-medium">{limits.rewritesPerMonth.toLocaleString()}/mo</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <span className="text-sm">Follow-ups</span>
                <span className="font-medium">{limits.followupsPerMonth.toLocaleString()}/mo</span>
              </div>
              {userTier !== 'scale' && (
                <Button 
                  className="w-full bg-gradient-to-r from-purple-500 to-pink-500"
                  onClick={() => window.location.href = '/pricing'}
                  data-testid="button-upgrade"
                >
                  <Zap className="w-4 h-4 mr-2" />
                  Upgrade Plan
                </Button>
              )}
              {userTier !== 'starter' && (
                <Button 
                  variant="outline"
                  className="w-full"
                  onClick={async () => {
                    try {
                      const response = await fetch('/api/billing-portal', {
                        method: 'POST',
                        credentials: 'include',
                      });
                      if (response.ok) {
                        const { url } = await response.json();
                        window.location.href = url;
                      }
                    } catch (error) {
                      toast({ title: 'Error', description: 'Failed to open billing portal', variant: 'destructive' });
                    }
                  }}
                  data-testid="button-manage-billing"
                >
                  Manage Billing
                </Button>
              )}
            </CardContent>
          </Card>
        </div>

        <Card data-testid="card-security">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldAlert className="w-5 h-5" />
              Security
            </CardTitle>
            <CardDescription>Manage your account security</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {isPasswordUser && (
              <div className="space-y-4 pb-4 border-b border-border">
                <div>
                  <p className="font-medium">Change Password</p>
                  <p className="text-sm text-muted-foreground">Update your account password</p>
                </div>
                <div className="space-y-3">
                  <Input
                    type="password"
                    placeholder="Current password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    data-testid="input-current-password"
                  />
                  <Input
                    type="password"
                    placeholder="New password (min 8 characters)"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    data-testid="input-new-password"
                  />
                  <Input
                    type="password"
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    data-testid="input-confirm-password"
                  />
                  <Button
                    onClick={handleChangePassword}
                    disabled={isChangingPassword || !currentPassword || !newPassword || !confirmPassword}
                    data-testid="button-change-password"
                  >
                    {isChangingPassword ? 'Changing...' : 'Change Password'}
                  </Button>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between pb-4 border-b border-border">
              <div>
                <p className="font-medium">Sign Out</p>
                <p className="text-sm text-muted-foreground">Sign out of your account on this device</p>
              </div>
              <Button 
                variant="outline" 
                onClick={handleLogout}
                disabled={isLoggingOut}
                data-testid="button-logout"
              >
                {isLoggingOut ? 'Signing out...' : 'Sign Out'}
              </Button>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-destructive">Delete Account</p>
                  <p className="text-sm text-muted-foreground">Permanently delete your account and all data</p>
                </div>
                <Button 
                  variant="destructive"
                  onClick={() => setShowDeleteConfirm(true)}
                  data-testid="button-delete-account"
                >
                  Delete Account
                </Button>
              </div>
              
              {showDeleteConfirm && (
                <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20 space-y-3">
                  <p className="text-sm font-medium text-destructive">This action cannot be undone!</p>
                  <p className="text-sm text-muted-foreground">
                    All your data including analysis history, subscription, and account settings will be permanently deleted.
                  </p>
                  <div className="space-y-2">
                    <p className="text-sm">Type <strong>DELETE</strong> to confirm:</p>
                    <Input
                      value={deleteConfirmText}
                      onChange={(e) => setDeleteConfirmText(e.target.value)}
                      placeholder="Type DELETE"
                      data-testid="input-delete-confirm"
                    />
                    <div className="flex gap-2">
                      <Button
                        variant="destructive"
                        onClick={handleDeleteAccount}
                        disabled={isDeleting || deleteConfirmText !== 'DELETE'}
                        data-testid="button-confirm-delete"
                      >
                        {isDeleting ? 'Deleting...' : 'Permanently Delete'}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setShowDeleteConfirm(false);
                          setDeleteConfirmText('');
                        }}
                        data-testid="button-cancel-delete"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderGraderView = () => (
    <>
      {selectedHistoryItem && (
        <HistoryViewBanner
          date={selectedHistoryItem.date}
          onClose={() => setSelectedHistoryItem(null)}
        />
      )}

      <EmailInput 
        variations={variations} 
        setVariations={setVariations} 
        body={body} 
        setBody={setBody} 
        onGrade={handleGrade}
        onStartFresh={handleStartFresh}
        isLoading={isLoading} 
        spamTriggers={spamTriggers}
        industry={industry}
        setIndustry={setIndustry}
        emailType={emailType}
        setEmailType={setEmailType}
        onImagesChange={setEmailImages}
      />

      <div ref={loadingRef}>
        {isLoading && <Loader />}
      </div>

      {gradingError && !isLoading && (
        <div className="mt-8 flex flex-col items-center justify-center space-y-6 animate-fade-in px-4" data-testid="grading-error">
          <div className="relative w-20 h-20">
            <div className="absolute inset-0 rounded-full bg-red-500/20 animate-pulse" />
            <div className="absolute inset-0 flex items-center justify-center">
              <AlertCircle className="w-10 h-10 text-red-500" />
            </div>
          </div>
          <div className="text-center space-y-2 max-w-md">
            <h3 className="text-lg font-semibold text-foreground">Grading Failed</h3>
            <p className="text-sm text-muted-foreground">{gradingError}</p>
          </div>
          <div className="flex gap-3">
            <Button
              onClick={handleGrade}
              className="bg-gradient-to-r from-purple-500 to-pink-500"
              data-testid="button-retry-grading"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Try Again
            </Button>
            <Button
              variant="outline"
              onClick={() => setGradingError(null)}
              data-testid="button-dismiss-error"
            >
              Dismiss
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Your email content has been preserved. Click "Try Again" to retry.
          </p>
        </div>
      )}

      {result && !isLoading && (
        <div className="mt-8 space-y-8 animate-fade-in">
          <div className="flex items-start justify-between gap-4">
            <ResultsHub 
              scoreData={result.inboxPlacementScore} 
              gradeData={result.overallGrade}
              benchmarkFeedback={result.benchmarkFeedback}
            />
            <div className="flex flex-col gap-2 shrink-0">
              <Button
                onClick={() => {
                  setRewriteGoal('general');
                  handleRewrite();
                }}
                disabled={isRewriting || !body.trim()}
                size="sm"
                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 shadow-md"
                data-testid="button-auto-improve"
              >
                {isRewriting ? (
                  <>
                    <Sparkles className="w-4 h-4 mr-2 animate-spin" />
                    Improving...
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 mr-2" />
                    Auto-Improve
                  </>
                )}
              </Button>
              <EnhancedPdfExport 
                analysisResult={result}
                hasWhitelabelReports={hasWhitelabelReports}
                previousResult={history.length > 1 ? history[1]?.result : null}
                emailContent={{
                  subject: variations[0]?.subject || '',
                  previewText: variations[0]?.previewText || '',
                  body: body
                }}
              />
            </div>
          </div>

          {rewrittenEmail && (
            <Card className="border-2 border-purple-500/50 bg-gradient-to-br from-purple-500/5 to-pink-500/5" data-testid="card-auto-improve-result">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500">
                      <Sparkles className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">Acceptafy Improved Version</CardTitle>
                      <CardDescription>Ready to apply to your email</CardDescription>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="bg-card/50 rounded-lg p-4 border border-border">
                    <span className="text-sm font-semibold text-primary">Subject</span>
                    <p className="text-foreground mt-1">{rewrittenEmail.subject}</p>
                  </div>
                  <div className="bg-card/50 rounded-lg p-4 border border-border">
                    <span className="text-sm font-semibold text-primary">Preview Text</span>
                    <p className="text-muted-foreground mt-1">{rewrittenEmail.previewText}</p>
                  </div>
                  <div className="bg-card/50 rounded-lg p-4 border border-border">
                    <span className="text-sm font-semibold text-primary">Body</span>
                    <p className="text-muted-foreground mt-1 whitespace-pre-line max-h-60 overflow-y-auto">{rewrittenEmail.body}</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Button
                    onClick={handleAcceptRewrite}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                    data-testid="button-accept-auto-improve"
                  >
                    Apply Improvements
                  </Button>
                  <Button
                    onClick={() => setRewrittenEmail(null)}
                    variant="secondary"
                    data-testid="button-discard-auto-improve"
                  >
                    Discard
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          <ResultsTabs
            result={result}
            body={body}
            subject={variations[0]?.subject || ''}
            preview={variations[0]?.previewText || ''}
            onSuggestionClick={handleSuggestionClick}
            onFullRewrite={handleFullRewrite}
            onQuickFix={handleQuickFix}
            onGeneratePs={handleGeneratePs}
            isGeneratingPs={isGeneratingPs}
            generatedPs={generatedPs}
            onAppendPs={handleAppendPs}
          />

          <div className="grid md:grid-cols-2 gap-4">
            {result.personalizationScore && (
              <Card className="card-lift">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <PersonalizationIcon className="w-5 h-5 text-primary" />
                    <h4 className="font-semibold text-foreground">Personalization Score</h4>
                  </div>
                  <div className="text-3xl font-bold gradient-text mb-2">{result.personalizationScore.score}/100</div>
                  <p className="text-sm text-muted-foreground">{result.personalizationScore.summary}</p>
                </CardContent>
              </Card>
            )}

            {result.replyAbilityAnalysis && (
              <Card className="card-lift">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <ReplyIcon className="w-5 h-5 text-primary" />
                    <h4 className="font-semibold text-foreground">Reply-Ability Score</h4>
                  </div>
                  <div className="text-3xl font-bold gradient-text mb-2">{result.replyAbilityAnalysis.score}/100</div>
                  <p className="text-sm text-muted-foreground">{result.replyAbilityAnalysis.summary}</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}
    </>
  );

  return (
    <SidebarProvider style={sidebarStyle as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <AppSidebar 
          activeView={activeView}
          setActiveView={setActiveView}
          onOpenAcademy={() => setShowAcademy(true)}
          createSubView={createSubView}
          setCreateSubView={setCreateSubView}
          optimizeSubView={optimizeSubView}
          setOptimizeSubView={setOptimizeSubView}
          analyticsSubView={analyticsSubView}
          setAnalyticsSubView={setAnalyticsSubView}
          deliverabilitySubView={deliverabilitySubView}
          setDeliverabilitySubView={setDeliverabilitySubView}
          connectionsSubView={connectionsSubView}
          setConnectionsSubView={setConnectionsSubView}
          highlevelSubView={highlevelSubView}
          setHighlevelSubView={setHighlevelSubView}
          clearAllSubViews={clearAllSubViews}
        />
        
        <SidebarInset className="flex flex-col flex-1 overflow-hidden">
          <AnnouncementBanner />
          <PaymentWarningBanner />
          <header className="flex flex-col border-b border-border/50 bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/60 sticky top-0 z-10">
            <div className="flex items-center justify-between h-14 px-4">
              <div className="flex items-center gap-3">
                <SidebarTrigger 
                  data-testid="button-sidebar-toggle" 
                  className="p-2 rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30 shadow-sm transition-all duration-200 hover:shadow-md hover:border-purple-500/50"
                />
                <div className="hidden sm:block h-6 w-px bg-border/50" />
                <h2 className="font-semibold text-foreground tracking-tight">
                  {activeView === 'dashboard' && 'Dashboard'}
                  {activeView === 'grader' && 'Email Grader'}
                  {activeView === 'history' && 'History'}
                  {activeView === 'create' && 'Create'}
                  {activeView === 'optimize' && 'Optimize'}
                  {activeView === 'analytics' && 'Analytics'}
                  {activeView === 'deliverability' && 'Deliverability'}
                  {activeView === 'connections' && 'Connections'}
                  {activeView === 'highlevel' && 'HighLevel Hub'}
                  {activeView === 'account' && 'Account Settings'}
                </h2>
              </div>
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/20 shadow-sm">
                  <Trophy className="w-4 h-4 text-yellow-500" />
                  <span className="text-sm font-semibold text-yellow-600 dark:text-yellow-400">Best: {bestScore}</span>
                </div>
                <div className={`hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full transition-all duration-300 ${streak > 0 ? 'bg-gradient-to-r from-orange-500/15 to-red-500/15 border border-orange-500/30 shadow-sm shadow-orange-500/10' : 'bg-muted/50 border border-border/50'}`}>
                  <Flame className={`w-4 h-4 transition-all duration-300 ${streak > 0 ? 'text-orange-500 fire-animate' : 'text-muted-foreground/50'}`} />
                  <span className={`text-sm font-bold transition-all duration-300 ${streak > 0 ? 'text-orange-500' : 'text-muted-foreground/50'}`}>
                    {streak} day streak
                  </span>
                </div>
                <ThemeToggle />
              </div>
            </div>
            <div className="flex sm:hidden items-center gap-2 px-4 pb-3 overflow-x-auto">
              <Button
                size="sm"
                variant={activeView === 'grader' ? 'default' : 'outline'}
                onClick={() => { setActiveView('grader'); clearAllSubViews(); }}
                className={`flex-shrink-0 ${activeView === 'grader' ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:opacity-90 border-0' : ''}`}
                data-testid="mobile-quick-grader"
              >
                <Mail className="w-4 h-4 mr-1.5" />
                Grade
              </Button>
              <Button
                size="sm"
                variant={activeView === 'create' && createSubView === 'rewrite' ? 'default' : 'outline'}
                onClick={() => { setActiveView('create'); clearAllSubViews(); setCreateSubView('rewrite'); }}
                className={`flex-shrink-0 ${activeView === 'create' && createSubView === 'rewrite' ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:opacity-90 border-0' : ''}`}
                data-testid="mobile-quick-rewrite"
              >
                <Zap className="w-4 h-4 mr-1.5" />
                Rewrite
              </Button>
              <Button
                size="sm"
                variant={activeView === 'deliverability' ? 'default' : 'outline'}
                onClick={() => { setActiveView('deliverability'); clearAllSubViews(); setDeliverabilitySubView('domain-health'); }}
                className={`flex-shrink-0 ${activeView === 'deliverability' ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:opacity-90 border-0' : ''}`}
                data-testid="mobile-quick-deliverability"
              >
                <ShieldCheck className="w-4 h-4 mr-1.5" />
                Deliverability
              </Button>
            </div>
          </header>

          <main className="flex-1 overflow-y-auto p-6">
            <div className="max-w-5xl mx-auto">
              {activeView === 'dashboard' && (
                <Suspense fallback={<ComponentLoader />}>
                  <Dashboard 
                    history={history}
                    onNavigate={handleDashboardNavigate}
                    onOpenAcademy={() => setShowAcademy(true)}
                    onReplayTutorial={resetOnboarding}
                  />
                </Suspense>
              )}
              {activeView === 'grader' && renderGraderView()}
              {activeView === 'history' && renderHistoryView()}
              {activeView === 'create' && renderCreateView()}
              {activeView === 'optimize' && renderOptimizeView()}
              {activeView === 'analytics' && renderAnalyticsView()}
              {activeView === 'deliverability' && renderDeliverabilityView()}
              {activeView === 'connections' && renderConnectionsView()}
              {activeView === 'highlevel' && renderHighlevelView()}
              {activeView === 'account' && <AccountView />}
            </div>
          </main>
        </SidebarInset>
      </div>

      {showAcademy && (
        <div className="fixed inset-0 z-50 bg-background">
          <Suspense fallback={<ComponentLoader />}>
            <AcademyHub onClose={() => setShowAcademy(false)} history={history} />
          </Suspense>
        </div>
      )}

      {showOnboarding && (
        <Suspense fallback={null}>
          <OnboardingTour 
            onComplete={completeOnboarding}
            onSkip={completeOnboarding}
          />
        </Suspense>
      )}

      <CelebrationRenderer />
      <Toaster />
    </SidebarProvider>
  );
}

function AuthenticatedApp() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500" />
          <span className="text-lg font-semibold">Loading...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Landing />;
  }

  return (
    <GamificationProvider>
      <AppContent />
    </GamificationProvider>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <SEOHead />
          <StructuredData />
          <Suspense fallback={<PageLoader />}>
            <Switch>
              <Route path="/pricing" component={Pricing} />
              <Route path="/account" component={Account} />
              <Route path="/terms" component={TermsOfService} />
              <Route path="/privacy" component={PrivacyPolicy} />
              <Route path="/contact" component={Contact} />
              <Route path="/admin" component={Admin} />
              <Route path="/reset-password" component={ResetPassword} />
              <Route path="/verify-email" component={VerifyEmail} />
              <Route path="/resources/:slug" component={ResourceArticle} />
              <Route path="/resources" component={Resources} />
              <Route path="/" component={AuthenticatedApp} />
              <Route component={AuthenticatedApp} />
            </Switch>
          </Suspense>
          <Suspense fallback={null}>
            <CookieConsent />
            <ContactWidget />
          </Suspense>
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
