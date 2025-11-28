import { useState, useEffect, useCallback } from 'react';
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
import { 
  AcademyIcon, 
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
import { getHistory, saveAnalysis, deleteHistoryItem, clearHistory } from './services/historyService';
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

type ActiveView = 'grader' | 'history' | 'academy';

function App() {
  const [variations, setVariations] = useState<EmailVariation[]>([{ subject: '', previewText: '' }]);
  const [body, setBody] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<GradingResult | null>(null);
  const [spamTriggers, setSpamTriggers] = useState<SpamTrigger[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [activeView, setActiveView] = useState<ActiveView>('grader');
  const [showAcademy, setShowAcademy] = useState(false);
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

  useEffect(() => {
    setHistory(getHistory());
  }, []);

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
          preview: variations[0].previewText,
          body
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        setSubjectVariations(data);
      }
    } catch (error) {
      console.error('Error generating variations:', error);
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
          gradingResult: result,
          subject: variations[0]?.subject || '',
          body
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        setOptimizationRoadmap(data);
      }
    } catch (error) {
      console.error('Error generating roadmap:', error);
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
      }
    } catch (error) {
      console.error('Error generating tone rewrite:', error);
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

  const renderSectionGrade = (title: string, icon: React.ReactNode, section: { grade: string; summary: string; feedback: string[] }) => (
    <div className="bg-white/5 p-4 rounded-lg border border-white/10">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {icon}
          <h4 className="font-semibold text-white">{title}</h4>
        </div>
        <span className={`text-2xl font-bold ${getGradeColor(section.grade)}`}>{section.grade}</span>
      </div>
      <p className="text-sm text-gray-300 mb-3">{section.summary}</p>
      {section.feedback.length > 0 && (
        <ul className="space-y-1">
          {section.feedback.map((item, i) => (
            <li key={i} className="text-xs text-gray-400 flex items-start gap-2">
              <span className="text-purple-400 mt-0.5">•</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );

  return (
    <div className="min-h-screen dark-bg">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <header className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12">
              <Logo />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Inbox Authority</h1>
              <p className="text-sm text-gray-400">AI-Powered Email Optimization</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={() => setActiveView(activeView === 'history' ? 'grader' : 'history')}
              className={`p-2 rounded-lg transition-colors ${activeView === 'history' ? 'bg-purple-600 text-white' : 'bg-white/10 text-gray-400 hover:text-white'}`}
              data-testid="button-toggle-history"
            >
              <HistoryIcon className="w-5 h-5" />
            </button>
            <button
              onClick={() => setShowAcademy(true)}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg font-semibold text-white flex items-center gap-2 transition-colors"
              data-testid="button-open-academy"
            >
              <AcademyIcon className="w-5 h-5" />
              Academy
            </button>
          </div>
        </header>

        {activeView === 'history' ? (
          <div className="animate-fade-in">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">Analysis History</h2>
              {history.length > 0 && (
                <button
                  onClick={handleClearHistory}
                  className="px-3 py-1.5 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
                  data-testid="button-clear-history"
                >
                  Clear All
                </button>
              )}
            </div>
            
            {history.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <HistoryIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No analysis history yet.</p>
                <p className="text-sm mt-1">Grade your first email to see it here.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {history.map((item) => (
                  <div 
                    key={item.id} 
                    className="bg-white/5 p-4 rounded-lg border border-white/10 flex items-center justify-between"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3">
                        <span className={`text-xl font-bold ${getGradeColor(item.result.overallGrade.grade)}`}>
                          {item.result.overallGrade.grade}
                        </span>
                        <span className="text-gray-300 truncate">
                          {item.content.variations[0]?.subject || 'No subject'}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {new Date(item.date).toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric', 
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleViewHistory(item)}
                        className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                        data-testid={`button-view-history-${item.id}`}
                      >
                        <EyeIcon className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDeleteHistory(item.id)}
                        className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                        data-testid={`button-delete-history-${item.id}`}
                      >
                        <TrashIcon className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <>
            <EmailInput 
              variations={variations} 
              setVariations={setVariations} 
              body={body} 
              setBody={setBody} 
              onGrade={handleGrade} 
              isLoading={isLoading} 
              spamTriggers={spamTriggers} 
            />

            {result && (
              <div className="mt-8 space-y-8 animate-fade-in">
                <ResultsHub 
                  scoreData={result.inboxPlacementScore} 
                  gradeData={result.overallGrade}
                  inboxPrediction={result.inboxPlacementPrediction}
                />

                <div className="grid md:grid-cols-2 gap-4">
                  {renderSectionGrade('Subject Line', <SubjectIcon className="w-5 h-5 text-purple-400" />, result.subjectLine)}
                  {renderSectionGrade('Preview Text', <PreviewIcon className="w-5 h-5 text-purple-400" />, result.previewText)}
                  {renderSectionGrade('Body Copy', <BodyIcon className="w-5 h-5 text-purple-400" />, result.bodyCopy)}
                  {renderSectionGrade('Call to Action', <CtaIcon className="w-5 h-5 text-purple-400" />, result.callToAction)}
                </div>

                {result.spamAnalysis?.length > 0 && (
                  <div className="bg-white/5 p-6 rounded-xl border border-white/10">
                    <div className="flex items-center gap-2 mb-4">
                      <SpamIcon className="w-5 h-5 text-red-400" />
                      <h3 className="font-bold text-white">Spam Trigger Analysis</h3>
                    </div>
                    <div className="space-y-3">
                      {result.spamAnalysis.map((trigger, i) => (
                        <div key={i} className={`p-4 rounded-lg border ${getSeverityColor(trigger.severity)}`}>
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-semibold">"{trigger.word}"</span>
                            <span className="text-xs uppercase">{trigger.severity}</span>
                          </div>
                          <p className="text-sm opacity-90 mb-2">{trigger.reason}</p>
                          {trigger.suggestions?.length > 0 && (
                            <div className="text-xs mb-2">
                              <span className="opacity-70">Alternatives: </span>
                              {trigger.suggestions.join(', ')}
                            </div>
                          )}
                          {trigger.suggestion && (
                            <button
                              onClick={() => handleQuickFix(trigger.word, trigger.suggestion)}
                              className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-xs rounded-lg transition-colors"
                              data-testid={`button-quickfix-${i}`}
                            >
                              Quick Fix: Replace with "{trigger.suggestion}"
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {result.subjectLineAnalysis?.length > 0 && (
                  <div className="bg-white/5 p-6 rounded-xl border border-white/10">
                    <div className="flex items-center gap-2 mb-4">
                      <SubjectShowdownIcon className="w-5 h-5 text-purple-400" />
                      <h3 className="font-bold text-white">Subject Line Showdown</h3>
                    </div>
                    <div className="space-y-3">
                      {result.subjectLineAnalysis.map((variation, i) => (
                        <div 
                          key={i} 
                          className={`p-4 rounded-lg border ${variation.isWinner ? 'bg-green-500/20 border-green-500' : 'bg-white/5 border-white/10'}`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-semibold text-white">{variation.subject}</span>
                            <div className="flex items-center gap-2">
                              <span className={`text-lg font-bold ${variation.predictionScore >= 80 ? 'text-green-400' : variation.predictionScore >= 60 ? 'text-yellow-400' : 'text-red-400'}`}>
                                {variation.predictionScore}%
                              </span>
                              {variation.isWinner && (
                                <span className="px-2 py-0.5 bg-green-500 text-white text-xs rounded-full">Winner</span>
                              )}
                            </div>
                          </div>
                          <p className="text-sm text-gray-400">{variation.rationale}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="bg-white/5 p-4 rounded-lg border border-white/10">
                    <div className="flex items-center gap-2 mb-3">
                      <PersonalizationIcon className="w-5 h-5 text-purple-400" />
                      <h4 className="font-semibold text-white">Personalization Score</h4>
                    </div>
                    <div className="text-3xl font-bold text-purple-400 mb-2">{result.personalizationScore.score}/100</div>
                    <p className="text-sm text-gray-400">{result.personalizationScore.summary}</p>
                  </div>

                  <div className="bg-white/5 p-4 rounded-lg border border-white/10">
                    <div className="flex items-center gap-2 mb-3">
                      <ReplyIcon className="w-5 h-5 text-purple-400" />
                      <h4 className="font-semibold text-white">Reply-Ability Score</h4>
                    </div>
                    <div className="text-3xl font-bold text-purple-400 mb-2">{result.replyAbilityAnalysis.score}/100</div>
                    <p className="text-sm text-gray-400">{result.replyAbilityAnalysis.summary}</p>
                  </div>
                </div>

                <div className="bg-white/5 p-6 rounded-xl border border-white/10">
                  <div className="flex items-center gap-2 mb-4">
                    <RewriteIcon className="w-5 h-5 text-purple-400" />
                    <h3 className="font-bold text-white">AI Rewrite</h3>
                  </div>
                  
                  <div className="flex flex-wrap gap-2 mb-4">
                    {['general', 'urgency', 'clarity', 'concise'].map((goal) => (
                      <button
                        key={goal}
                        onClick={() => setRewriteGoal(goal)}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                          rewriteGoal === goal 
                            ? 'bg-purple-600 text-white' 
                            : 'bg-white/10 text-gray-300 hover:bg-white/20'
                        }`}
                      >
                        {goal.charAt(0).toUpperCase() + goal.slice(1)}
                      </button>
                    ))}
                  </div>
                  
                  <button
                    onClick={handleRewrite}
                    disabled={isRewriting || !body.trim()}
                    className="w-full py-3 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg font-semibold text-white transition-colors mb-4"
                    data-testid="button-rewrite"
                  >
                    {isRewriting ? 'Rewriting...' : 'Generate Rewrite'}
                  </button>

                  {rewrittenEmail && (
                    <div className="space-y-3 animate-fade-in">
                      <div className="bg-gray-900/50 p-4 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-semibold text-purple-300">Subject</span>
                          <button
                            onClick={() => copyToClipboard(rewrittenEmail.subject, 'rewrite-subject')}
                            className="p-1 hover:bg-white/10 rounded"
                          >
                            {copiedItem === 'rewrite-subject' ? <CheckIcon className="w-4 h-4 text-green-400" /> : <CopyIcon className="w-4 h-4 text-gray-400" />}
                          </button>
                        </div>
                        <p className="text-white">{rewrittenEmail.subject}</p>
                      </div>
                      <div className="bg-gray-900/50 p-4 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-semibold text-purple-300">Preview Text</span>
                          <button
                            onClick={() => copyToClipboard(rewrittenEmail.previewText, 'rewrite-preview')}
                            className="p-1 hover:bg-white/10 rounded"
                          >
                            {copiedItem === 'rewrite-preview' ? <CheckIcon className="w-4 h-4 text-green-400" /> : <CopyIcon className="w-4 h-4 text-gray-400" />}
                          </button>
                        </div>
                        <p className="text-gray-300">{rewrittenEmail.previewText}</p>
                      </div>
                      <div className="bg-gray-900/50 p-4 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-semibold text-purple-300">Body</span>
                          <button
                            onClick={() => copyToClipboard(rewrittenEmail.body, 'rewrite-body')}
                            className="p-1 hover:bg-white/10 rounded"
                          >
                            {copiedItem === 'rewrite-body' ? <CheckIcon className="w-4 h-4 text-green-400" /> : <CopyIcon className="w-4 h-4 text-gray-400" />}
                          </button>
                        </div>
                        <p className="text-gray-300 whitespace-pre-line">{rewrittenEmail.body}</p>
                      </div>
                      <div className="flex gap-3 mt-4">
                        <button
                          onClick={handleAcceptRewrite}
                          className="flex-1 py-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-colors"
                          data-testid="button-accept-rewrite"
                        >
                          Accept & Load into Editor
                        </button>
                        <button
                          onClick={() => setRewrittenEmail(null)}
                          className="px-4 py-2 bg-white/10 hover:bg-white/20 text-gray-300 rounded-lg transition-colors"
                          data-testid="button-discard-rewrite"
                        >
                          Discard
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="bg-white/5 p-6 rounded-xl border border-white/10">
                  <div className="flex items-center gap-2 mb-4">
                    <FollowUpIcon className="w-5 h-5 text-purple-400" />
                    <h3 className="font-bold text-white">Follow-Up Generator</h3>
                  </div>
                  
                  <div className="flex flex-wrap gap-2 mb-4">
                    {['reminder', 'discount', 'query', 'sequence'].map((goal) => (
                      <button
                        key={goal}
                        onClick={() => setFollowUpGoal(goal)}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                          followUpGoal === goal 
                            ? 'bg-purple-600 text-white' 
                            : 'bg-white/10 text-gray-300 hover:bg-white/20'
                        }`}
                      >
                        {goal === 'sequence' ? '10-Email Sequence' : goal.charAt(0).toUpperCase() + goal.slice(1)}
                      </button>
                    ))}
                  </div>

                  {followUpGoal !== 'sequence' && (
                    <textarea
                      value={followUpContext}
                      onChange={(e) => setFollowUpContext(e.target.value)}
                      placeholder="Add additional context for the follow-up (optional)"
                      className="w-full h-20 bg-gray-900/50 border border-gray-600 rounded-lg p-3 text-white placeholder-gray-500 input-glow-focus outline-none resize-none mb-4"
                    />
                  )}
                  
                  <button
                    onClick={handleGenerateFollowUp}
                    disabled={isGeneratingFollowUp}
                    className="w-full py-3 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg font-semibold text-white transition-colors mb-4"
                    data-testid="button-generate-followup"
                  >
                    {isGeneratingFollowUp ? 'Generating...' : followUpGoal === 'sequence' ? 'Generate 10-Email Sequence' : 'Generate Follow-Up'}
                  </button>

                  {followUpEmail && (
                    <div className="space-y-3 animate-fade-in">
                      <div className="bg-gray-900/50 p-4 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-semibold text-purple-300">Subject</span>
                          <button
                            onClick={() => copyToClipboard(followUpEmail.subject, 'followup-subject')}
                            className="p-1 hover:bg-white/10 rounded"
                          >
                            {copiedItem === 'followup-subject' ? <CheckIcon className="w-4 h-4 text-green-400" /> : <CopyIcon className="w-4 h-4 text-gray-400" />}
                          </button>
                        </div>
                        <p className="text-white">{followUpEmail.subject}</p>
                      </div>
                      <div className="bg-gray-900/50 p-4 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-semibold text-purple-300">Body</span>
                          <button
                            onClick={() => copyToClipboard(followUpEmail.body, 'followup-body')}
                            className="p-1 hover:bg-white/10 rounded"
                          >
                            {copiedItem === 'followup-body' ? <CheckIcon className="w-4 h-4 text-green-400" /> : <CopyIcon className="w-4 h-4 text-gray-400" />}
                          </button>
                        </div>
                        <p className="text-gray-300 whitespace-pre-line">{followUpEmail.body}</p>
                      </div>
                      <div className="flex gap-3 mt-4">
                        <button
                          onClick={() => handleLoadFollowUp(followUpEmail)}
                          className="flex-1 py-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition-colors"
                          data-testid="button-load-followup"
                        >
                          Load into Editor
                        </button>
                        <button
                          onClick={() => setFollowUpEmail(null)}
                          className="px-4 py-2 bg-white/10 hover:bg-white/20 text-gray-300 rounded-lg transition-colors"
                          data-testid="button-dismiss-followup"
                        >
                          Dismiss
                        </button>
                      </div>
                    </div>
                  )}

                  {followUpSequence.length > 0 && (
                    <div className="space-y-4 animate-fade-in">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-400">Generated {followUpSequence.length} emails</span>
                        <button
                          onClick={() => setFollowUpSequence([])}
                          className="text-sm text-gray-400 hover:text-white transition-colors"
                        >
                          Clear Sequence
                        </button>
                      </div>
                      {followUpSequence.map((email, i) => (
                        <div key={i} className="bg-gray-900/50 p-4 rounded-lg border border-white/10">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <span className="px-2 py-1 bg-purple-600 text-white text-xs rounded-full">
                                Email {i + 1}
                              </span>
                              <span className="text-sm text-gray-400">{email.timingSuggestion}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleLoadFollowUp(email)}
                                className="p-1.5 hover:bg-white/10 rounded text-purple-400 hover:text-purple-300 transition-colors"
                                title="Load into Editor"
                                data-testid={`button-load-sequence-${i}`}
                              >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                                </svg>
                              </button>
                              <button
                                onClick={() => copyToClipboard(`Subject: ${email.subject}\n\n${email.body}`, `sequence-${i}`)}
                                className="p-1 hover:bg-white/10 rounded"
                              >
                                {copiedItem === `sequence-${i}` ? <CheckIcon className="w-4 h-4 text-green-400" /> : <CopyIcon className="w-4 h-4 text-gray-400" />}
                              </button>
                            </div>
                          </div>
                          <div className="mb-2">
                            <span className="text-xs text-gray-500">Subject:</span>
                            <p className="text-white font-semibold">{email.subject}</p>
                          </div>
                          <div className="mb-2">
                            <span className="text-xs text-gray-500">Body:</span>
                            <p className="text-gray-300 text-sm whitespace-pre-line">{email.body}</p>
                          </div>
                          <div className="mt-3 pt-3 border-t border-white/10">
                            <span className="text-xs text-gray-500">Rationale:</span>
                            <p className="text-xs text-purple-300">{email.rationale}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="bg-white/5 p-6 rounded-xl border border-white/10">
                  <div className="flex items-center gap-2 mb-4">
                    <SubjectShowdownIcon className="w-5 h-5 text-purple-400" />
                    <h3 className="font-bold text-white">A/B Subject Line Lab</h3>
                  </div>
                  <p className="text-sm text-gray-400 mb-4">Generate 5 subject line variations with predicted open rates for A/B testing</p>
                  
                  <button
                    onClick={handleGenerateSubjectVariations}
                    disabled={isGeneratingVariations || !variations[0]?.subject.trim() || !body.trim()}
                    className="w-full py-3 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg font-semibold text-white transition-colors mb-4"
                    data-testid="button-generate-variations"
                  >
                    {isGeneratingVariations ? 'Generating Variations...' : 'Generate A/B Variations'}
                  </button>

                  {subjectVariations.length > 0 && (
                    <div className="space-y-3 animate-fade-in">
                      {subjectVariations.map((variation, i) => (
                        <div key={i} className="bg-gray-900/50 p-4 rounded-lg border border-white/10">
                          <div className="flex items-center justify-between mb-2">
                            <span className="px-2 py-1 bg-purple-600/30 text-purple-300 text-xs rounded-full">
                              {variation.style}
                            </span>
                            <div className="flex items-center gap-2">
                              <span className={`text-sm font-bold ${
                                variation.predictedOpenRate >= 30 ? 'text-green-400' : 
                                variation.predictedOpenRate >= 20 ? 'text-yellow-400' : 'text-red-400'
                              }`}>
                                {variation.predictedOpenRate}% predicted open rate
                              </span>
                              <button
                                onClick={() => handleUseVariation(variation)}
                                className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white text-xs rounded transition-colors"
                                data-testid={`button-use-variation-${i}`}
                              >
                                Use
                              </button>
                            </div>
                          </div>
                          <p className="text-white font-semibold mb-1">{variation.subject}</p>
                          <p className="text-gray-400 text-sm mb-2">{variation.previewText}</p>
                          <p className="text-xs text-gray-500">{variation.rationale}</p>
                        </div>
                      ))}
                      <button
                        onClick={() => setSubjectVariations([])}
                        className="w-full py-2 bg-white/10 hover:bg-white/20 text-gray-300 rounded-lg transition-colors"
                      >
                        Clear Variations
                      </button>
                    </div>
                  )}
                </div>

                <div className="bg-white/5 p-6 rounded-xl border border-white/10">
                  <div className="flex items-center gap-2 mb-4">
                    <PersonalizationIcon className="w-5 h-5 text-purple-400" />
                    <h3 className="font-bold text-white">Tone Profiles</h3>
                  </div>
                  <p className="text-sm text-gray-400 mb-4">Rewrite your email with a specific voice and personality</p>
                  
                  <div className="flex flex-wrap gap-2 mb-4">
                    {(['professional', 'friendly', 'urgent', 'fomo', 'storytelling'] as ToneProfile[]).map((tone) => (
                      <button
                        key={tone}
                        onClick={() => setSelectedTone(tone)}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                          selectedTone === tone 
                            ? 'bg-purple-600 text-white' 
                            : 'bg-white/10 text-gray-300 hover:bg-white/20'
                        }`}
                      >
                        {tone === 'fomo' ? 'FOMO' : tone.charAt(0).toUpperCase() + tone.slice(1)}
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={handleToneRewrite}
                    disabled={isGeneratingTone || !body.trim()}
                    className="w-full py-3 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg font-semibold text-white transition-colors mb-4"
                    data-testid="button-tone-rewrite"
                  >
                    {isGeneratingTone ? 'Rewriting...' : `Rewrite as ${selectedTone === 'fomo' ? 'FOMO' : selectedTone.charAt(0).toUpperCase() + selectedTone.slice(1)}`}
                  </button>

                  {toneRewrite && (
                    <div className="space-y-3 animate-fade-in">
                      <div className="bg-purple-900/20 border border-purple-500/30 p-3 rounded-lg mb-3">
                        <p className="text-sm text-purple-300">{toneRewrite.toneNotes}</p>
                      </div>
                      <div className="bg-gray-900/50 p-4 rounded-lg">
                        <span className="text-sm font-semibold text-purple-300">Subject</span>
                        <p className="text-white mt-1">{toneRewrite.subject}</p>
                      </div>
                      <div className="bg-gray-900/50 p-4 rounded-lg">
                        <span className="text-sm font-semibold text-purple-300">Preview</span>
                        <p className="text-gray-300 mt-1">{toneRewrite.previewText}</p>
                      </div>
                      <div className="bg-gray-900/50 p-4 rounded-lg">
                        <span className="text-sm font-semibold text-purple-300">Body</span>
                        <p className="text-gray-300 mt-1 whitespace-pre-line">{toneRewrite.body}</p>
                      </div>
                      <div className="flex gap-3">
                        <button
                          onClick={handleAcceptToneRewrite}
                          className="flex-1 py-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-colors"
                          data-testid="button-accept-tone"
                        >
                          Accept & Load
                        </button>
                        <button
                          onClick={() => setToneRewrite(null)}
                          className="px-4 py-2 bg-white/10 hover:bg-white/20 text-gray-300 rounded-lg transition-colors"
                        >
                          Discard
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="bg-white/5 p-6 rounded-xl border border-white/10">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <svg className="w-5 h-5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                      </svg>
                      <h3 className="font-bold text-white">Optimization Roadmap</h3>
                    </div>
                    <button
                      onClick={handleGenerateRoadmap}
                      disabled={isGeneratingRoadmap}
                      className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white text-sm rounded-lg transition-colors"
                      data-testid="button-generate-roadmap"
                    >
                      {isGeneratingRoadmap ? 'Generating...' : 'Generate Roadmap'}
                    </button>
                  </div>
                  <p className="text-sm text-gray-400 mb-4">Get a prioritized action plan to improve your email's performance</p>

                  {optimizationRoadmap.length > 0 && (
                    <div className="space-y-3 animate-fade-in">
                      {optimizationRoadmap.map((item, i) => (
                        <div key={i} className="bg-gray-900/50 p-4 rounded-lg border-l-4" style={{
                          borderColor: item.priority <= 2 ? '#ef4444' : item.priority <= 4 ? '#eab308' : '#22c55e'
                        }}>
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <span className={`px-2 py-0.5 text-xs rounded-full ${
                                item.priority <= 2 ? 'bg-red-500/20 text-red-400' :
                                item.priority <= 4 ? 'bg-yellow-500/20 text-yellow-400' :
                                'bg-green-500/20 text-green-400'
                              }`}>
                                Priority {item.priority}
                              </span>
                              <span className="text-xs text-gray-500 uppercase">{item.category}</span>
                            </div>
                            <span className="text-xs text-green-400">{item.impact}</span>
                          </div>
                          <p className="text-white font-medium mb-1">{item.issue}</p>
                          <p className="text-sm text-gray-400 mb-2">{item.action}</p>
                          {item.actionType === 'quickfix' && item.targetWord && item.replacement && (
                            <button
                              onClick={() => handleQuickFix(item.targetWord!, item.replacement!)}
                              className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-xs rounded-lg transition-colors"
                            >
                              Quick Fix: Replace "{item.targetWord}" with "{item.replacement}"
                            </button>
                          )}
                          {item.actionType === 'rewrite' && (
                            <span className="text-xs text-purple-400">Use AI Rewrite to fix</span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {emailPreview && (variations[0]?.subject || variations[0]?.previewText) && (
              <div className="bg-white/5 p-6 rounded-xl border border-white/10 mt-6">
                <div className="flex items-center gap-2 mb-4">
                  <EyeIcon className="w-5 h-5 text-purple-400" />
                  <h3 className="font-bold text-white">Live Inbox Preview</h3>
                </div>

                <div className="flex flex-wrap gap-3 mb-4">
                  <div className={`px-3 py-1 rounded-full text-sm ${emailPreview.characterCounts.subjectOptimal ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                    Subject: {emailPreview.characterCounts.subject} chars {emailPreview.characterCounts.subjectOptimal ? '(optimal)' : ''}
                  </div>
                  <div className={`px-3 py-1 rounded-full text-sm ${emailPreview.characterCounts.previewOptimal ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                    Preview: {emailPreview.characterCounts.preview} chars {emailPreview.characterCounts.previewOptimal ? '(optimal)' : ''}
                  </div>
                </div>

                {emailPreview.truncationWarnings.length > 0 && (
                  <div className="bg-yellow-900/20 border border-yellow-500/30 p-3 rounded-lg mb-4">
                    {emailPreview.truncationWarnings.map((warning, i) => (
                      <p key={i} className="text-sm text-yellow-400">{warning}</p>
                    ))}
                  </div>
                )}

                <div className="grid md:grid-cols-3 gap-4">
                  <div className="bg-gray-900/50 p-4 rounded-lg">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-6 h-6 bg-red-500 rounded flex items-center justify-center text-white text-xs font-bold">G</div>
                      <span className="text-white font-medium">Gmail</span>
                    </div>
                    <div className="space-y-2">
                      <div>
                        <span className="text-xs text-gray-500">Desktop</span>
                        <p className="text-sm text-gray-300 truncate">{emailPreview.gmail.inboxDisplay}</p>
                      </div>
                      <div>
                        <span className="text-xs text-gray-500">Mobile</span>
                        <p className="text-sm text-gray-300">{emailPreview.gmail.mobileDisplay}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-900/50 p-4 rounded-lg">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-6 h-6 bg-blue-500 rounded flex items-center justify-center text-white text-xs font-bold">O</div>
                      <span className="text-white font-medium">Outlook</span>
                    </div>
                    <div className="space-y-2">
                      <div>
                        <span className="text-xs text-gray-500">Desktop</span>
                        <p className="text-sm text-gray-300 truncate">{emailPreview.outlook.inboxDisplay}</p>
                      </div>
                      <div>
                        <span className="text-xs text-gray-500">Mobile</span>
                        <p className="text-sm text-gray-300">{emailPreview.outlook.mobileDisplay}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-900/50 p-4 rounded-lg">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-6 h-6 bg-gray-500 rounded flex items-center justify-center text-white text-xs font-bold">A</div>
                      <span className="text-white font-medium">Apple Mail</span>
                    </div>
                    <div className="space-y-2">
                      <div>
                        <span className="text-xs text-gray-500">Desktop</span>
                        <p className="text-sm text-gray-300 truncate">{emailPreview.apple.inboxDisplay}</p>
                      </div>
                      <div>
                        <span className="text-xs text-gray-500">Mobile</span>
                        <p className="text-sm text-gray-300">{emailPreview.apple.mobileDisplay}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <ReputationDashboard 
              history={history} 
              onGenerateDns={handleGenerateDns} 
              isGeneratingDns={isGeneratingDns} 
              dnsRecords={dnsRecords} 
            />
          </>
        )}

        {showAcademy && <AcademyHub onClose={() => setShowAcademy(false)} />}
      </div>
    </div>
  );
}

export default App;
