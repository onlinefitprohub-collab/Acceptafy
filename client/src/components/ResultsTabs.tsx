import { useState } from 'react';
import type { GradingResult } from '../types';
import { ResultCard } from './ResultCard';
import { SpamAnalysisCard } from './SpamAnalysisCard';
import { StructuralAnalysisCard } from './StructuralAnalysisCard';
import { SubjectShowdownCard } from './SubjectShowdownCard';
import { PersonalizationScoreCard } from './PersonalizationScoreCard';
import { LinkAnalysisCard } from './LinkAnalysisCard';
import { ReplyAbilityCard } from './ReplyAbilityCard';
import { PlainTextAnalysisCard } from './PlainTextAnalysisCard';
import { AccessibilityCard } from './AccessibilityCard';
import { EmailClientPreview } from './EmailClientPreview';
import { InboxPlacementSimulator } from './InboxPlacementSimulator';
import { SubjectIcon, PreviewIcon, BodyIcon, CtaIcon, ChecklistIcon, SpamIcon, MonitorIcon } from './icons/CategoryIcons';
import { Zap, Sparkles } from 'lucide-react';
import { PriorityIssues } from './PriorityIssues';
import { InsightsPanel } from './InsightsPanel';

interface ResultsTabsProps {
  result: GradingResult;
  body: string;
  subject?: string;
  preview?: string;
  onSuggestionClick: (triggerWord: string, suggestion: string) => void;
  onFullRewrite: (originalText: string, newText: string) => void;
  onQuickFix: (triggerWord: string, suggestion: string) => void;
  onGeneratePs: () => void;
  isGeneratingPs: boolean;
  generatedPs: string | null;
  onAppendPs: () => void;
}

type ActiveTab = 'fixes' | 'core' | 'risks' | 'technical' | 'insights';

const TabButton: React.FC<{
    label: string;
    icon: React.ReactNode;
    isActive: boolean;
    onClick: () => void;
    highlighted?: boolean;
}> = ({ label, icon, isActive, onClick, highlighted }) => (
    <button
        onClick={onClick}
        className={`w-full sm:w-auto flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-md transition-all duration-300 ${
            isActive 
                ? highlighted 
                    ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg shadow-orange-500/30 ring-2 ring-orange-400/50' 
                    : 'bg-purple-600 text-white shadow-md'
                : highlighted
                    ? 'text-amber-400 hover:bg-amber-500/20 ring-1 ring-amber-500/30'
                    : 'text-gray-300 hover:bg-white/10'
        }`}
        data-testid={`tab-${label.toLowerCase().replace(/\s+/g, '-')}`}
    >
        {icon}
        <span>{label}</span>
    </button>
);


export const ResultsTabs: React.FC<ResultsTabsProps> = ({
  result,
  body,
  subject = '',
  preview = '',
  onSuggestionClick,
  onFullRewrite,
  onQuickFix,
  onGeneratePs,
  isGeneratingPs,
  generatedPs,
  onAppendPs,
}) => {
    const [activeTab, setActiveTab] = useState<ActiveTab>('fixes');

    const renderTabContent = () => {
        switch (activeTab) {
            case 'fixes':
                return (
                    <div className="animate-fade-in">
                        <PriorityIssues result={result} />
                    </div>
                );
            case 'core':
                return (
                    <div className="space-y-8 animate-fade-in">
                        {result.subjectLineAnalysis && <SubjectShowdownCard analysis={result.subjectLineAnalysis} />}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {result.personalizationScore && <PersonalizationScoreCard scoreData={result.personalizationScore} />}
                            {result.replyAbilityAnalysis && (
                                <ReplyAbilityCard
                                    analysis={result.replyAbilityAnalysis}
                                    onGeneratePs={onGeneratePs}
                                    isGeneratingPs={isGeneratingPs}
                                    generatedPs={generatedPs}
                                    onAppendPs={onAppendPs}
                                />
                            )}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <ResultCard title="Subject Line" icon={<SubjectIcon />} gradeData={result.subjectLine} tooltipText="Analyzes the clarity, impact, and potential spam risk of your subject line. This is the single most important factor for getting your email opened." />
                            <ResultCard title="Preview Text" icon={<PreviewIcon />} gradeData={result.previewText} tooltipText="Grades the short snippet of text that appears after the subject line in most inboxes. A strong preview text complements the subject and boosts open rates." />
                            <ResultCard title="Body Copy" icon={<BodyIcon />} gradeData={result.bodyCopy} tooltipText="Evaluates the main content of your email for clarity, readability, and engagement. Good body copy keeps the reader's attention and guides them to the call to action." />
                            <ResultCard title="Call to Action" icon={<CtaIcon />} gradeData={result.callToAction} tooltipText="Assesses the strength and clarity of your primary link or button. A single, focused CTA is crucial for driving conversions and achieving your email's goal." />
                        </div>
                    </div>
                );
            case 'risks':
                return (
                     <div className="space-y-8 animate-fade-in">
                        {result.inboxPlacementPrediction && <InboxPlacementSimulator prediction={result.inboxPlacementPrediction} />}
                        <SpamAnalysisCard spamTriggers={result.spamAnalysis} onSuggestionClick={onSuggestionClick} onQuickFix={onQuickFix} />
                        {result.linkAnalysis && result.linkAnalysis.length > 0 && <LinkAnalysisCard linkFindings={result.linkAnalysis} />}
                        <StructuralAnalysisCard structuralFindings={result.structuralAnalysis} onFullRewrite={onFullRewrite} />
                     </div>
                );
            case 'technical':
                 return (
                     <div className="space-y-8 animate-fade-in">
                        {result.accessibilityAnalysis && <AccessibilityCard findings={result.accessibilityAnalysis} />}
                        {result.plainTextAnalysis && <PlainTextAnalysisCard analysis={result.plainTextAnalysis} />}
                        <EmailClientPreview result={result} body={body} />
                    </div>
                );
            case 'insights':
                return (
                    <div className="animate-fade-in">
                        <InsightsPanel 
                            emailContent={body}
                            subject={subject}
                            preview={preview}
                            overallScore={result.inboxPlacementScore?.score}
                        />
                    </div>
                );
            default:
                return null;
        }
    }

  return (
    <div className="space-y-6" data-testid="results-tabs">
        <div className="flex flex-col sm:flex-row items-center gap-2 border border-white/10 p-1.5 rounded-lg bg-white/5 w-full overflow-x-auto">
            <TabButton label="Priority Fixes" icon={<Zap className="w-5 h-5" />} isActive={activeTab === 'fixes'} onClick={() => setActiveTab('fixes')} highlighted />
            <TabButton label="Core Analysis" icon={<ChecklistIcon />} isActive={activeTab === 'core'} onClick={() => setActiveTab('core')} />
            <TabButton label="Deliverability Risks" icon={<SpamIcon className="w-5 h-5" />} isActive={activeTab === 'risks'} onClick={() => setActiveTab('risks')} />
            <TabButton label="Technical & Previews" icon={<MonitorIcon />} isActive={activeTab === 'technical'} onClick={() => setActiveTab('technical')} />
            <TabButton label="AI Insights" icon={<Sparkles className="w-5 h-5" />} isActive={activeTab === 'insights'} onClick={() => setActiveTab('insights')} />
        </div>
        <div className="mt-6">
            {renderTabContent()}
        </div>
    </div>
  );
};
