import { useState, useEffect, useCallback } from 'react';
import { Switch, Route, useLocation } from 'wouter';
import { Logo } from './components/icons/Logo';
import { EmailInput } from './components/EmailInput';
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
import { AcademyHub } from './components/Academy/AcademyHub';
import { AppSidebar } from './components/app-sidebar';
import { ThemeToggle } from './components/ThemeToggle';
import { Dashboard } from './components/Dashboard';
import { OnboardingTour, useOnboarding } from './components/OnboardingTour';
import { CelebrationModal, useCelebration } from './components/CelebrationModal';
import { PriorityIssues } from './components/PriorityIssues';
import { GamificationProvider, useGamification } from './hooks/use-gamification';
import { useAuth } from './hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Toaster } from '@/components/ui/toaster';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { TooltipProvider } from '@/components/ui/tooltip';
import { CookieConsent } from './components/CookieConsent';
import Landing from './pages/Landing';
import Pricing from './pages/Pricing';
import Account from './pages/Account';
import TermsOfService from './pages/TermsOfService';
import PrivacyPolicy from './pages/PrivacyPolicy';
import Contact from './pages/Contact';
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
import { getHistory, saveAnalysis, deleteHistoryItem, clearHistory } from './services/historyService';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Zap, Target, Mail, Flame, Trophy, Star, ShieldAlert, Heart, Download, FileText } from 'lucide-react';
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

type ActiveView = 'dashboard' | 'grader' | 'history' | 'academy' | 'tools' | 'deliverability';
type ToolsSubView = 'rewrite' | 'followup' | 'variations' | 'tone' | 'preview' | 'spam' | 'sentiment' | null;
type DeliverabilitySubView = 'dns' | 'domain-health' | 'list-quality' | 'bimi' | 'warmup' | 'sender-score' | null;

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
  
  // Export results as PDF (white-label for Scale tier)
  const handleExportPdf = useCallback((analysisResult: GradingResult) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast({ title: 'Unable to open print window', description: 'Please allow popups for this site.', variant: 'destructive' });
      return;
    }
    
    const brandingHtml = hasWhitelabelReports ? '' : 
      '<div style="text-align: center; margin-bottom: 24px; padding-bottom: 16px; border-bottom: 1px solid #e5e7eb;">' +
      '<div style="display: inline-flex; align-items: center; gap: 8px;">' +
      '<div style="width: 32px; height: 32px; background: linear-gradient(135deg, #a855f7, #ec4899); border-radius: 8px;"></div>' +
      '<span style="font-size: 20px; font-weight: bold;">Acceptafy</span>' +
      '</div>' +
      '<p style="color: #6b7280; font-size: 12px; margin-top: 8px;">Email Analysis Report</p>' +
      '</div>';
    
    const footerText = hasWhitelabelReports 
      ? 'Generated on ' + new Date().toLocaleDateString()
      : 'Generated on ' + new Date().toLocaleDateString() + ' | Powered by Acceptafy';
    
    const spamCount = analysisResult.spamAnalysis?.length || 0;
    const spamRisk = spamCount === 0 ? 'Low' : spamCount <= 3 ? 'Medium' : 'High';
    
    const html = '<!DOCTYPE html><html><head><title>Email Analysis Report</title>' +
      '<style>' +
      'body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; max-width: 800px; margin: 0 auto; padding: 40px; color: #1f2937; }' +
      '.score-box { text-align: center; padding: 24px; background: #f3f4f6; border-radius: 12px; margin-bottom: 24px; }' +
      '.score { font-size: 64px; font-weight: bold; color: #a855f7; }' +
      '.grade { font-size: 48px; font-weight: bold; margin-left: 16px; }' +
      '.section { margin-bottom: 24px; padding: 16px; background: #f9fafb; border-radius: 8px; }' +
      '.section-title { font-weight: 600; margin-bottom: 8px; color: #374151; }' +
      '.feedback-item { padding: 8px 0; border-bottom: 1px solid #e5e7eb; }' +
      '.feedback-item:last-child { border-bottom: none; }' +
      '.label { color: #6b7280; font-size: 14px; }' +
      '.value { font-weight: 500; }' +
      '@media print { body { padding: 20px; } }' +
      '</style></head><body>' +
      brandingHtml +
      '<div class="score-box">' +
      '<span class="score">' + (analysisResult.inboxPlacementScore?.score || 0) + '</span>' +
      '<span class="grade">' + (analysisResult.overallGrade?.grade || 'N/A') + '</span>' +
      '<p style="color: #6b7280; margin-top: 8px;">' + (analysisResult.overallGrade?.summary || '') + '</p>' +
      '</div>' +
      '<div class="section"><div class="section-title">Subject Line Analysis</div>' +
      '<div class="feedback-item"><span class="label">Grade:</span> <span class="value">' + (analysisResult.subjectLine?.grade || 'N/A') + '</span></div>' +
      '<div class="feedback-item"><span class="label">Summary:</span> <span class="value">' + (analysisResult.subjectLine?.summary || 'N/A') + '</span></div></div>' +
      '<div class="section"><div class="section-title">Preview Text Analysis</div>' +
      '<div class="feedback-item"><span class="label">Grade:</span> <span class="value">' + (analysisResult.previewText?.grade || 'N/A') + '</span></div>' +
      '<div class="feedback-item"><span class="label">Summary:</span> <span class="value">' + (analysisResult.previewText?.summary || 'N/A') + '</span></div></div>' +
      '<div class="section"><div class="section-title">Body Copy Analysis</div>' +
      '<div class="feedback-item"><span class="label">Grade:</span> <span class="value">' + (analysisResult.bodyCopy?.grade || 'N/A') + '</span></div>' +
      '<div class="feedback-item"><span class="label">Summary:</span> <span class="value">' + (analysisResult.bodyCopy?.summary || 'N/A') + '</span></div></div>' +
      '<div class="section"><div class="section-title">Spam Risk Analysis</div>' +
      '<div class="feedback-item"><span class="label">Risk Level:</span> <span class="value">' + spamRisk + ' (' + spamCount + ' triggers found)</span></div></div>' +
      '<p style="text-align: center; color: #9ca3af; font-size: 12px; margin-top: 32px;">' + footerText + '</p>' +
      '</body></html>';
    
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.print();
  }, [hasWhitelabelReports, toast]);
  const [variations, setVariations] = useState<EmailVariation[]>([{ 
    subject: EXAMPLE_EMAIL.subject, 
    previewText: EXAMPLE_EMAIL.previewText 
  }]);
  const [body, setBody] = useState(EXAMPLE_EMAIL.body);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<GradingResult | null>(null);
  const [spamTriggers, setSpamTriggers] = useState<SpamTrigger[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [activeView, setActiveView] = useState<ActiveView>('dashboard');
  const [toolsSubView, setToolsSubView] = useState<ToolsSubView>(null);
  const [deliverabilitySubView, setDeliverabilitySubView] = useState<DeliverabilitySubView>(null);
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

  useEffect(() => {
    setHistory(getHistory());
  }, []);

  useEffect(() => {
    if (level > prevLevel && prevLevel > 0) {
      celebrate('level_up', { level });
    }
    setPrevLevel(level);
  }, [level, prevLevel, celebrate]);

  const handleDashboardNavigate = (view: 'grader' | 'history' | 'tools' | 'deliverability', subView?: string) => {
    setActiveView(view);
    if (view === 'tools' && subView) {
      setToolsSubView(subView as ToolsSubView);
    } else if (view === 'deliverability' && subView) {
      setDeliverabilitySubView(subView as DeliverabilitySubView);
    } else {
      setToolsSubView(null);
      setDeliverabilitySubView(null);
    }
  };

  const handleGrade = async () => {
    if (!body.trim() && !variations.some(v => v.subject.trim())) return;
    
    setIsLoading(true);
    setResult(null);
    setRewrittenEmail(null);
    setFollowUpEmail(null);
    setFollowUpSequence([]);
    
    try {
      const response = await fetch('/api/grade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body, variations })
      });
      
      if (response.ok) {
        const data = await response.json();
        setResult(data);
        setSpamTriggers(data.spamAnalysis || []);
        const newHistory = saveAnalysis({ body, variations }, data);
        setHistory(newHistory);
        const score = data.inboxPlacementScore?.score || 0;
        const grade = data.overallGrade?.grade || 'C';
        recordGrade(score, grade);
        
        if (score >= 90) {
          setTimeout(() => {
            celebrate('perfect_score', { score });
          }, 500);
        }
      } else {
        console.error('Grading failed');
      }
    } catch (error) {
      console.error('Error grading email:', error);
    } finally {
      setIsLoading(false);
    }
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
      }
    } catch (error) {
      console.error('Error rewriting email:', error);
    } finally {
      setIsRewriting(false);
    }
  };

  const handleGenerateFollowUp = async () => {
    setIsGeneratingFollowUp(true);
    
    try {
      if (followUpGoal === 'sequence') {
        const response = await fetch('/api/followup/sequence', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            original: { body, variations },
            analysis: result,
            goal: followUpGoal
          })
        });
        
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
    setToolsSubView(null);
  };

  const handleDeleteHistory = (id: string) => {
    const newHistory = deleteHistoryItem(id);
    setHistory(newHistory);
  };

  const handleClearHistory = () => {
    const newHistory = clearHistory();
    setHistory(newHistory);
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
    
    setSpamTriggers(prev => prev.filter(t => t.word.toLowerCase() !== word.toLowerCase()));
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

  const handleAcceptRewrite = () => {
    if (rewrittenEmail) {
      setBody(rewrittenEmail.body);
      setVariations([{ 
        subject: rewrittenEmail.subject, 
        previewText: rewrittenEmail.previewText 
      }]);
      setRewrittenEmail(null);
      setResult(null);
    }
  };

  const handleLoadFollowUp = (email: { subject: string; body: string }) => {
    setBody(email.body);
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
          {history.map((item) => (
            <Card 
              key={item.id} 
              className="card-lift cursor-pointer"
              onClick={() => handleViewHistory(item)}
              data-testid={`history-item-${item.id}`}
            >
              <CardContent className="flex items-center justify-between p-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3">
                    <div className={`text-2xl font-bold ${getGradeColor(item.result.overallGrade.grade)}`}>
                      {item.result.overallGrade.grade}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-foreground font-medium truncate">
                        {item.content.variations[0]?.subject || 'No subject'}
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

  const renderToolsView = () => (
    <div className="animate-fade-in space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">AI Tools</h2>
        <p className="text-muted-foreground">Powerful tools to optimize your emails</p>
      </div>

      {toolsSubView === 'rewrite' && (
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
            <div className="flex flex-wrap gap-2">
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

      {toolsSubView === 'followup' && (
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
            <div className="flex flex-wrap gap-2">
              {['reminder', 'discount', 'query', 'sequence'].map((goal) => (
                <Button
                  key={goal}
                  onClick={() => setFollowUpGoal(goal)}
                  variant={followUpGoal === goal ? 'default' : 'secondary'}
                  size="sm"
                >
                  {goal === 'sequence' ? '10-Email Sequence' : goal.charAt(0).toUpperCase() + goal.slice(1)}
                </Button>
              ))}
            </div>

            {followUpGoal !== 'sequence' && (
              <textarea
                value={followUpContext}
                onChange={(e) => setFollowUpContext(e.target.value)}
                placeholder="Add additional context for the follow-up (optional)"
                className="w-full h-20 bg-muted border border-border rounded-lg p-3 text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary outline-none resize-none"
              />
            )}
            
            <Button
              onClick={handleGenerateFollowUp}
              disabled={isGeneratingFollowUp}
              className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600"
              data-testid="button-generate-followup"
            >
              {isGeneratingFollowUp ? (
                <>
                  <Sparkles className="w-4 h-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : followUpGoal === 'sequence' ? (
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

      {toolsSubView === 'variations' && (
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

      {toolsSubView === 'tone' && (
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

      {toolsSubView === 'preview' && (
        <EmailPreviewTool />
      )}

      {toolsSubView === 'spam' && (
        <SpamChecker />
      )}

      {toolsSubView === 'sentiment' && (
        <SentimentAnalyzer />
      )}

      {!toolsSubView && (
        <div className="grid md:grid-cols-2 gap-4">
          <Card className="card-lift cursor-pointer" onClick={() => setToolsSubView('rewrite')}>
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">AI Rewrite</h3>
                <p className="text-sm text-muted-foreground">Transform your email</p>
              </div>
            </CardContent>
          </Card>
          <Card className="card-lift cursor-pointer" onClick={() => setToolsSubView('followup')}>
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500">
                <Mail className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Follow-ups</h3>
                <p className="text-sm text-muted-foreground">Generate follow-up emails</p>
              </div>
            </CardContent>
          </Card>
          <Card className="card-lift cursor-pointer" onClick={() => setToolsSubView('variations')}>
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
          <Card className="card-lift cursor-pointer" onClick={() => setToolsSubView('tone')}>
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
          <Card className="card-lift cursor-pointer" onClick={() => setToolsSubView('preview')}>
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500">
                <Mail className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Email Preview</h3>
                <p className="text-sm text-muted-foreground">See how emails look in Gmail, Outlook & Apple Mail</p>
              </div>
            </CardContent>
          </Card>
          <Card className="card-lift cursor-pointer" onClick={() => setToolsSubView('spam')}>
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-orange-500 to-red-500">
                <ShieldAlert className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Spam Checker</h3>
                <p className="text-sm text-muted-foreground">Scan for spam trigger words</p>
              </div>
            </CardContent>
          </Card>
          <Card className="card-lift cursor-pointer" onClick={() => setToolsSubView('sentiment')}>
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-pink-500 to-rose-500">
                <Heart className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-foreground">Sentiment Analysis</h3>
                  <Badge className="bg-gradient-to-r from-pink-500 to-rose-500 text-white text-[10px] px-1.5 py-0">NEW</Badge>
                </div>
                <p className="text-sm text-muted-foreground">Analyze emotional tone & improve engagement</p>
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
                  <Badge className="bg-gradient-to-r from-indigo-500 to-violet-500 text-white text-[10px] px-1.5 py-0">NEW</Badge>
                </div>
                <p className="text-sm text-muted-foreground">Analyze your authentication, list hygiene, and sending practices to estimate sender reputation</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );

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
        isLoading={isLoading} 
        spamTriggers={spamTriggers} 
      />

      {isLoading && <Loader />}

      {result && !isLoading && (
        <div className="mt-8 space-y-8 animate-fade-in">
          <div className="flex items-start justify-between gap-4">
            <ResultsHub 
              scoreData={result.inboxPlacementScore} 
              gradeData={result.overallGrade}
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
              <Button
                onClick={() => handleExportPdf(result)}
                variant="outline"
                size="sm"
                data-testid="button-export-pdf"
              >
                <FileText className="w-4 h-4 mr-2" />
                Export Report
                {hasWhitelabelReports && (
                  <Badge variant="secondary" className="ml-2 text-xs">White-label</Badge>
                )}
              </Button>
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
                      <CardTitle className="text-lg">AI-Improved Version</CardTitle>
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

          <PriorityIssues 
            result={result}
            onApplyFix={(issue) => {
              if (issue.originalText && issue.replacement) {
                const newBody = body.replace(new RegExp(issue.originalText, 'gi'), issue.replacement);
                setBody(newBody);
                toast({
                  title: 'Fix Applied',
                  description: `Replaced "${issue.originalText}" with "${issue.replacement}"`,
                });
              }
            }}
            onRequestRewrite={(category) => {
              setActiveView('tools');
              setToolsSubView('rewrite');
              toast({
                title: 'AI Rewrite Ready',
                description: `Use the rewrite tool to improve your ${category.toLowerCase()}`,
              });
            }}
          />

          <ResultsTabs
            result={result}
            body={body}
            onSuggestionClick={handleSuggestionClick}
            onFullRewrite={handleFullRewrite}
            onQuickFix={handleQuickFix}
            onGeneratePs={handleGeneratePs}
            isGeneratingPs={isGeneratingPs}
            generatedPs={generatedPs}
            onAppendPs={handleAppendPs}
          />

          <div className="grid md:grid-cols-2 gap-4">
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
          toolsSubView={toolsSubView}
          setToolsSubView={setToolsSubView}
          deliverabilitySubView={deliverabilitySubView}
          setDeliverabilitySubView={setDeliverabilitySubView}
        />
        
        <SidebarInset className="flex flex-col flex-1 overflow-hidden">
          <header className="flex items-center justify-between h-14 px-4 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-10">
            <div className="flex items-center gap-3">
              <SidebarTrigger data-testid="button-sidebar-toggle" />
              <div className="h-6 w-px bg-border" />
              <h2 className="font-semibold text-foreground">
                {activeView === 'dashboard' && 'Dashboard'}
                {activeView === 'grader' && 'Email Grader'}
                {activeView === 'history' && 'History'}
                {activeView === 'tools' && 'AI Tools'}
                {activeView === 'deliverability' && 'Deliverability Tools'}
              </h2>
            </div>
            <div className="flex items-center gap-4">
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted">
                <Trophy className="w-4 h-4 text-yellow-500" />
                <span className="text-sm font-medium">Best: {bestScore}</span>
              </div>
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-orange-500/20 border border-orange-500/30">
                <Flame className={`w-4 h-4 ${streak > 0 ? 'text-orange-500 fire-animate' : 'text-muted-foreground'}`} />
                <span className={`text-sm font-bold ${streak > 0 ? 'text-orange-500' : 'text-muted-foreground'}`}>
                  {streak} day streak
                </span>
              </div>
              <ThemeToggle />
            </div>
          </header>

          <main className="flex-1 overflow-y-auto p-6">
            <div className="max-w-5xl mx-auto">
              {activeView === 'dashboard' && (
                <Dashboard 
                  history={history}
                  onNavigate={handleDashboardNavigate}
                  onOpenAcademy={() => setShowAcademy(true)}
                  onReplayTutorial={resetOnboarding}
                />
              )}
              {activeView === 'grader' && renderGraderView()}
              {activeView === 'history' && renderHistoryView()}
              {activeView === 'tools' && renderToolsView()}
              {activeView === 'deliverability' && renderDeliverabilityView()}
            </div>
          </main>
        </SidebarInset>
      </div>

      {showAcademy && (
        <div className="fixed inset-0 z-50 bg-background">
          <AcademyHub onClose={() => setShowAcademy(false)} history={history} />
        </div>
      )}

      {showOnboarding && (
        <OnboardingTour 
          onComplete={completeOnboarding}
          onSkip={completeOnboarding}
        />
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
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Switch>
          <Route path="/pricing" component={Pricing} />
          <Route path="/account" component={Account} />
          <Route path="/terms" component={TermsOfService} />
          <Route path="/privacy" component={PrivacyPolicy} />
          <Route path="/contact" component={Contact} />
          <Route path="/" component={AuthenticatedApp} />
          <Route component={AuthenticatedApp} />
        </Switch>
        <CookieConsent />
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
