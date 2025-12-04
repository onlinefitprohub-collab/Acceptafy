import React, { useState, useEffect, useCallback } from 'react';
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
import { RewriteIcon, AcademyIcon } from './components/icons/CategoryIcons';
import { InboxPlacementSimulator } from './components/InboxPlacementSimulator';
import { ResultsTabs } from './components/ResultsTabs';
import {
  gradeCopy,
  rewriteCopy,
  generateFollowUpEmail,
  generateFollowUpSequence,
  generateDnsRecords,
  generatePostscript,
} from './services/geminiService';
// Fix: Import history management functions to resolve errors related to undefined functions like 'getHistory' and 'saveAnalysis'.
import {
  getHistory,
  saveAnalysis,
  deleteHistoryItem,
  clearHistory,
} from './services/historyService';
// Fix: Import types from types.ts where they are now correctly defined and exported.
import type {
  GradingResult,
  RewrittenEmail,
  FollowUpEmail,
  FollowUpSequenceEmail,
  HistoryItem,
  DnsRecords,
  SpamTrigger,
  RewriteGoal,
  FollowUpGoal,
} from './types';

type ViewState = 'input' | 'loading' | 'results' | 'comparison' | 'history_view';

const App: React.FC = () => {
  const [variations, setVariations] = useState([{ subject: 'Big News!', previewText: 'Our Summer Sale is Here!' }]);
  const [body, setBody] = useState("Hi [Name],\n\nDon't miss out on our biggest sale of the year. You can get up to 50% off on all our products. This is a limited time offer, so act now!\n\nClick here to shop: https://example.com/sale\n\nThanks,\nThe Team");
  
  const [isLoading, setIsLoading] = useState(false);
  const [isRewriting, setIsRewriting] = useState(false);
  const [isGeneratingFollowUp, setIsGeneratingFollowUp] = useState(false);
  const [isGeneratingDns, setIsGeneratingDns] = useState(false);
  const [isGeneratingPs, setIsGeneratingPs] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [viewState, setViewState] = useState<ViewState>('input');
  const [result, setResult] = useState<GradingResult | null>(null);
  
  const [originalContent, setOriginalContent] = useState<{ body: string, variations: { subject: string, previewText: string }[] } | null>(null);
  const [rewrittenContent, setRewrittenContent] = useState<RewrittenEmail | null>(null);
  const [rewrittenResult, setRewrittenResult] = useState<GradingResult | null>(null);

  const [followUpEmail, setFollowUpEmail] = useState<FollowUpEmail | null>(null);
  const [followUpSequence, setFollowUpSequence] = useState<FollowUpSequenceEmail[] | null>(null);

  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [viewingHistoryItem, setViewingHistoryItem] = useState<HistoryItem | null>(null);

  const [dnsRecords, setDnsRecords] = useState<DnsRecords | null>(null);
  const [generatedPs, setGeneratedPs] = useState<string | null>(null);

  const [isAcademyOpen, setIsAcademyOpen] = useState(false);
  
  const spamTriggers = result?.spamAnalysis ?? [];
  
  useEffect(() => {
    setHistory(getHistory());
  }, []);

  const handleGrade = useCallback(async () => {
    if (variations.some(v => !v.subject.trim()) || !body.trim()) {
      setError("Please fill in all subject lines and the email body.");
      return;
    }
    setIsLoading(true);
    setViewState('loading');
    setResult(null);
    setViewingHistoryItem(null);
    setError(null);
    try {
      const gradingResult = await gradeCopy(body, variations);
      setResult(gradingResult);
      setViewState('results');
      const updatedHistory = saveAnalysis({ body, variations }, gradingResult);
      setHistory(updatedHistory);
    } catch (error) {
      console.error(error);
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred while grading the email.";
      setError(errorMessage);
      setViewState('input');
    } finally {
      setIsLoading(false);
    }
  }, [body, variations]);
  
  const handleSuggestionClick = useCallback((triggerWord: string, suggestion: string) => {
    const regex = new RegExp(`\\b${triggerWord}\\b`, 'gi');
    setBody(prev => prev.replace(regex, suggestion));
    setVariations(prev => prev.map(v => ({
      subject: v.subject.replace(regex, suggestion),
      previewText: v.previewText.replace(regex, suggestion),
    })));
  }, []);

  const handleFullRewrite = useCallback((originalText: string, newText: string) => {
    setBody(prev => prev.replace(originalText, newText));
  }, []);
  
  const handleQuickFix = useCallback(async (triggerWord: string, suggestion: string) => {
    handleSuggestionClick(triggerWord, suggestion);
    // Use a timeout to allow state to update before re-grading
    setTimeout(handleGrade, 100);
  }, [handleSuggestionClick, handleGrade]);

  const handleRewrite = useCallback(async (goal: RewriteGoal) => {
    if (!result) return;
    setIsRewriting(true);
    setViewState('loading');
    setError(null);

    const winningVariation = result.subjectLineAnalysis.find(v => v.isWinner) || variations[0];
    
    setOriginalContent({ body, variations });
    setRewrittenContent(null);
    setRewrittenResult(null);

    try {
      const rewritten = await rewriteCopy(body, winningVariation.subject, winningVariation.previewText, goal);
      setRewrittenContent(rewritten);
      
      const newVariations = [{ subject: rewritten.subject, previewText: rewritten.previewText }];
      const newResult = await gradeCopy(rewritten.body, newVariations);
      setRewrittenResult(newResult);
      
      setViewState('comparison');

    } catch (error) {
      console.error(error);
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred during the rewrite process.";
      setError(errorMessage);
      setViewState('results');
    } finally {
      setIsRewriting(false);
    }
  }, [result, body, variations]);

  const handleAcceptRewrite = useCallback(() => {
    if (!rewrittenContent || !rewrittenResult) return;
    setBody(rewrittenContent.body);
    setVariations([{ subject: rewrittenContent.subject, previewText: rewrittenContent.previewText }]);
    setResult(rewrittenResult);
    setViewState('results');
    const updatedHistory = saveAnalysis({ body: rewrittenContent.body, variations: [{ subject: rewrittenContent.subject, previewText: rewrittenContent.previewText }] }, rewrittenResult);
    setHistory(updatedHistory);
  }, [rewrittenContent, rewrittenResult]);

  const handleDiscardRewrite = useCallback(() => {
    if (!originalContent) return;
    setBody(originalContent.body);
    setVariations(originalContent.variations);
    setViewState('results');
  }, [originalContent]);
  
  const handleGenerateFollowUp = useCallback(async (goal: FollowUpGoal, context: string) => {
    if (!result) return;
    setIsGeneratingFollowUp(true);
    setFollowUpEmail(null);
    setFollowUpSequence(null);
    setError(null);
    try {
      const winner = result.subjectLineAnalysis.find(v => v.isWinner) || variations[0];
      const originalEmail = { subject: winner.subject, body };
      
      if (goal === 'sequence') {
          const sequence = await generateFollowUpSequence(originalEmail, result, context);
          setFollowUpSequence(sequence);
      } else {
          const followup = await generateFollowUpEmail(originalEmail, result, goal, context);
          setFollowUpEmail(followup);
      }

    } catch (error) {
        console.error(error);
        const errorMessage = error instanceof Error ? error.message : 'Failed to generate follow-up. Please try again.';
        setError(errorMessage);
    } finally {
        setIsGeneratingFollowUp(false);
    }
  }, [result, body, variations]);

  const handleLoadFollowUp = useCallback((followUp: FollowUpEmail | FollowUpSequenceEmail) => {
    setBody(followUp.body);
    setVariations([{ subject: followUp.subject, previewText: '' }]);
    setFollowUpEmail(null);
    setFollowUpSequence(null);
    window.scrollTo(0, 0);
  }, []);
  
  const handleViewHistory = useCallback((item: HistoryItem) => {
      setResult(item.result);
      setViewState('history_view');
      setViewingHistoryItem(item);
      window.scrollTo(0, 0);
  }, []);

  const handleLoadHistory = useCallback((item: HistoryItem) => {
      setBody(item.content.body);
      setVariations(item.content.variations);
      setResult(item.result);
      setViewState('results');
      setViewingHistoryItem(null);
      window.scrollTo(0, 0);
  }, []);
  
  const handleDeleteHistory = useCallback((id: string) => {
      setHistory(deleteHistoryItem(id));
  }, []);
  
  const handleClearHistory = useCallback(() => {
      if (window.confirm('Are you sure you want to clear all analysis history?')) {
          setHistory(clearHistory());
      }
  }, []);

  const handleCloseHistoryView = useCallback(() => {
      setViewState('results');
      setViewingHistoryItem(null);
  }, []);
  
  const handleGenerateDns = useCallback(async (domain: string) => {
    setIsGeneratingDns(true);
    setError(null);
    try {
      const records = await generateDnsRecords(domain);
      setDnsRecords(records);
    } catch (error) {
      console.error(error);
      setError('Failed to generate DNS records.');
    } finally {
      setIsGeneratingDns(false);
    }
  }, []);
  
  const handleGeneratePs = useCallback(async () => {
    setIsGeneratingPs(true);
    setError(null);
    try {
      const ps = await generatePostscript(body);
      setGeneratedPs(ps);
    } catch (error) {
      console.error(error);
      setError('Failed to generate P.S.');
    } finally {
      setIsGeneratingPs(false);
    }
  }, [body]);
  
  const handleAppendPs = useCallback(() => {
    if (generatedPs) {
      setBody(prev => `${prev}\n\n${generatedPs}`);
      setGeneratedPs(null);
    }
  }, [generatedPs]);
  
  const renderContent = () => {
    switch (viewState) {
      case 'loading':
        return <Loader />;
      case 'results':
      case 'history_view':
        if (!result) return null;
        return (
          <div className="space-y-8">
            {viewingHistoryItem && <HistoryViewBanner date={viewingHistoryItem.date} onClose={handleCloseHistoryView} />}
            <ResultsHub scoreData={result.inboxPlacementScore} gradeData={result.overallGrade} />
            {result.inboxPlacementPrediction && <InboxPlacementSimulator prediction={result.inboxPlacementPrediction} />}
            
            {/* Actions Bar */}
            <div className="space-y-4 p-4 bg-white/5 rounded-lg border border-white/10">
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                  <h3 className="text-lg font-semibold flex-shrink-0">Next Steps & Actions</h3>
                  <div className="flex gap-2 flex-wrap justify-center">
                     <button onClick={() => handleRewrite('general')} disabled={isRewriting} className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-purple-300 bg-purple-500/20 rounded-full hover:bg-purple-500/30 transition-colors disabled:opacity-50">
                        <RewriteIcon className="w-4 h-4" /> General Rewrite
                    </button>
                    <button onClick={() => handleRewrite('clarity')} disabled={isRewriting} className="px-4 py-2 text-sm font-semibold text-gray-300 bg-white/10 rounded-full hover:bg-white/20 transition-colors disabled:opacity-50">Make it Clearer</button>
                    <button onClick={() => handleRewrite('concise')} disabled={isRewriting} className="px-4 py-2 text-sm font-semibold text-gray-300 bg-white/10 rounded-full hover:bg-white/20 transition-colors disabled:opacity-50">Make it Shorter</button>
                    <button onClick={() => handleRewrite('urgency')} disabled={isRewriting} className="px-4 py-2 text-sm font-semibold text-gray-300 bg-white/10 rounded-full hover:bg-white/20 transition-colors disabled:opacity-50">Add Urgency</button>
                  </div>
                </div>
                 <div className="pt-4 border-t border-white/10">
                    <FollowUpGenerator onGenerate={handleGenerateFollowUp} isGenerating={isGeneratingFollowUp} isRewriting={isRewriting} />
                 </div>
            </div>

            {followUpEmail && <FollowUpDisplay followUp={followUpEmail} onLoad={handleLoadFollowUp} onDiscard={() => setFollowUpEmail(null)} />}
            {followUpSequence && <FollowUpSequenceDisplay sequence={followUpSequence} onLoad={handleLoadFollowUp} onDiscard={() => setFollowUpSequence(null)} />}
            
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
          </div>
        );
      case 'comparison':
        if (!result || !rewrittenResult || !originalContent || !rewrittenContent) return <Loader />;
        return <RewriteComparison 
            originalResult={result} 
            rewrittenResult={rewrittenResult}
            originalContent={originalContent}
            rewrittenContent={rewrittenContent}
            onAccept={handleAcceptRewrite}
            onDiscard={handleDiscardRewrite}
        />;
      case 'input':
      default:
        return null;
    }
  };

  return (
      <div className="min-h-screen bg-gray-900 text-white font-sans transition-colors duration-300 dark-bg">
        <header className="py-4 sm:py-6 border-b border-white/10 sticky top-0 bg-gray-900/80 backdrop-blur-lg z-20">
          <div className="container mx-auto px-4 sm:px-8 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12"><Logo /></div>
              <h1 className="text-xl sm:text-3xl font-bold">Inbox Authority</h1>
            </div>
            <button
                onClick={() => setIsAcademyOpen(true)}
                className="flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-white/10 rounded-lg hover:bg-white/20 transition-colors"
            >
                <AcademyIcon />
                <span className="hidden sm:inline">Academy</span>
            </button>
          </div>
        </header>

        <main className="container mx-auto p-4 sm:p-8">
          <p className="text-center text-lg text-gray-400 mb-8 max-w-3xl mx-auto">
            Write emails with authority. Our powerful grader analyzes every aspect of your copy—from spam triggers and formatting to deliverability red flags—giving you the expert insights to land in the primary inbox and convert with confidence.
          </p>
          {error && <ErrorMessage message={error} onDismiss={() => setError(null)} />}
          <EmailInput 
            variations={variations}
            setVariations={setVariations}
            body={body}
            setBody={setBody}
            onGrade={handleGrade}
            isLoading={isLoading || isRewriting}
            spamTriggers={spamTriggers}
          />
          {renderContent()}

          {(viewState === 'results' || viewState === 'history_view') && (
            <>
              <HistoryPanel 
                history={history}
                onView={handleViewHistory}
                onLoad={handleLoadHistory}
                onDelete={handleDeleteHistory}
                onClear={handleClearHistory}
              />
              
              <ReputationDashboard history={history} />
            </>
          )}

        </main>
        
        <footer className="text-center py-8 text-gray-500 text-sm border-t border-white/10 mt-8">
            <p>&copy; {new Date().getFullYear()} Inbox Authority. All rights reserved.</p>
        </footer>

        {isAcademyOpen && <AcademyHub onClose={() => setIsAcademyOpen(false)} />}
      </div>
  );
}

export default App;