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
import { Zap } from 'lucide-react';

interface ResultsTabsProps {
  result: GradingResult;
  body: string;
  onSuggestionClick: (triggerWord: string, suggestion: string) => void;
  onFullRewrite: (originalText: string, newText: string) => void;
  onQuickFix: (triggerWord: string, suggestion: string) => void;
  onGeneratePs: () => void;
  isGeneratingPs: boolean;
  generatedPs: string | null;
  onAppendPs: () => void;
}

type ActiveTab = 'fixes' | 'core' | 'risks' | 'technical';

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
  onSuggestionClick,
  onFullRewrite,
  onQuickFix,
  onGeneratePs,
  isGeneratingPs,
  generatedPs,
  onAppendPs,
}) => {
    const [activeTab, setActiveTab] = useState<ActiveTab>('fixes');

    const getPriorityFixes = () => {
        const fixes: Array<{ type: 'spam' | 'structural' | 'link' | 'accessibility'; severity: 'High' | 'Medium' | 'Low'; title: string; description: string; suggestion?: string }> = [];
        
        if (result.spamAnalysis) {
            result.spamAnalysis.forEach(spam => {
                fixes.push({
                    type: 'spam',
                    severity: spam.severity,
                    title: `Spam Trigger: "${spam.word}"`,
                    description: spam.reason,
                    suggestion: spam.suggestion
                });
            });
        }
        
        if (result.structuralAnalysis) {
            result.structuralAnalysis.forEach(issue => {
                fixes.push({
                    type: 'structural',
                    severity: issue.severity,
                    title: `${issue.type}: ${issue.summary}`,
                    description: issue.feedback,
                    suggestion: issue.suggestion
                });
            });
        }
        
        if (result.linkAnalysis) {
            result.linkAnalysis.forEach(link => {
                if (link.status === 'Bad' || link.status === 'Warning') {
                    fixes.push({
                        type: 'link',
                        severity: link.status === 'Bad' ? 'High' : 'Medium',
                        title: `Link Issue: ${link.url}`,
                        description: link.reason,
                        suggestion: link.suggestion
                    });
                }
            });
        }
        
        if (result.accessibilityAnalysis) {
            result.accessibilityAnalysis.forEach(issue => {
                if (issue.severity === 'High' || issue.severity === 'Medium') {
                    fixes.push({
                        type: 'accessibility',
                        severity: issue.severity,
                        title: `Accessibility: ${issue.type}`,
                        description: issue.summary,
                        suggestion: issue.suggestion
                    });
                }
            });
        }
        
        return fixes.sort((a, b) => {
            const order = { 'High': 0, 'Medium': 1, 'Low': 2 };
            return order[a.severity] - order[b.severity];
        });
    };

    const renderTabContent = () => {
        switch (activeTab) {
            case 'fixes':
                const priorityFixes = getPriorityFixes();
                const highCount = priorityFixes.filter(f => f.severity === 'High').length;
                const mediumCount = priorityFixes.filter(f => f.severity === 'Medium').length;
                
                return (
                    <div className="space-y-6 animate-fade-in">
                        <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/30 rounded-lg p-4">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="p-2 bg-amber-500/20 rounded-lg">
                                    <Zap className="w-5 h-5 text-amber-400" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-white">Priority Fixes</h3>
                                    <p className="text-sm text-gray-400">
                                        {highCount > 0 && <span className="text-red-400 font-medium">{highCount} critical</span>}
                                        {highCount > 0 && mediumCount > 0 && ' · '}
                                        {mediumCount > 0 && <span className="text-yellow-400 font-medium">{mediumCount} important</span>}
                                        {highCount === 0 && mediumCount === 0 && <span className="text-green-400">No urgent fixes needed!</span>}
                                    </p>
                                </div>
                            </div>
                        </div>
                        
                        {priorityFixes.length === 0 ? (
                            <div className="text-center py-12 text-gray-400">
                                <Zap className="w-12 h-12 mx-auto mb-4 text-green-400" />
                                <p className="text-lg font-medium text-white">Great job!</p>
                                <p>No priority issues found in your email.</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {priorityFixes.map((fix, index) => (
                                    <div 
                                        key={index}
                                        className={`p-4 rounded-lg border ${
                                            fix.severity === 'High' 
                                                ? 'bg-red-500/10 border-red-500/30' 
                                                : fix.severity === 'Medium'
                                                    ? 'bg-yellow-500/10 border-yellow-500/30'
                                                    : 'bg-blue-500/10 border-blue-500/30'
                                        }`}
                                        data-testid={`priority-fix-${index}`}
                                    >
                                        <div className="flex items-start gap-3">
                                            <span className={`px-2 py-0.5 text-xs font-bold rounded ${
                                                fix.severity === 'High' 
                                                    ? 'bg-red-500/20 text-red-400' 
                                                    : fix.severity === 'Medium'
                                                        ? 'bg-yellow-500/20 text-yellow-400'
                                                        : 'bg-blue-500/20 text-blue-400'
                                            }`}>
                                                {fix.severity}
                                            </span>
                                            <div className="flex-1">
                                                <h4 className="font-medium text-white mb-1">{fix.title}</h4>
                                                <p className="text-sm text-gray-400 mb-2">{fix.description}</p>
                                                {fix.suggestion && (
                                                    <p className="text-sm text-green-400 bg-green-500/10 px-3 py-2 rounded">
                                                        <span className="font-medium">Fix:</span> {fix.suggestion}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
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
            default:
                return null;
        }
    }

  return (
    <div className="space-y-6" data-testid="results-tabs">
        <div className="flex flex-col sm:flex-row items-center gap-2 border border-white/10 p-1.5 rounded-lg bg-white/5 w-full">
            <TabButton label="Priority Fixes" icon={<Zap className="w-5 h-5" />} isActive={activeTab === 'fixes'} onClick={() => setActiveTab('fixes')} highlighted />
            <TabButton label="Core Analysis" icon={<ChecklistIcon />} isActive={activeTab === 'core'} onClick={() => setActiveTab('core')} />
            <TabButton label="Deliverability Risks" icon={<SpamIcon className="w-5 h-5" />} isActive={activeTab === 'risks'} onClick={() => setActiveTab('risks')} />
            <TabButton label="Technical & Previews" icon={<MonitorIcon />} isActive={activeTab === 'technical'} onClick={() => setActiveTab('technical')} />
        </div>
        <div className="mt-6">
            {renderTabContent()}
        </div>
    </div>
  );
};
