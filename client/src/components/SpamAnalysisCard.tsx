import { useState, useMemo } from 'react';
import type { SpamTrigger } from '../types';
import { SpamIcon, ChevronDownIcon, CtaIcon, InfoIcon, RewriteIcon } from './icons/CategoryIcons';
import { InfoTooltip } from './InfoTooltip';

interface SpamAnalysisCardProps {
  spamTriggers: SpamTrigger[];
  onSuggestionClick: (triggerWord: string, suggestion: string) => void;
  onQuickFix: (triggerWord: string, suggestion: string) => void;
}

const getSeverityStyles = (severity: 'High' | 'Medium' | 'Low'): { pill: string; dot: string, border: string, text: string } => {
  switch (severity) {
    case 'High':
      return {
        pill: 'bg-red-500/20 text-red-300 border-red-500/50',
        dot: 'bg-red-400',
        border: 'border-red-500/50',
        text: 'text-red-300'
      };
    case 'Medium':
      return {
        pill: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/50',
        dot: 'bg-yellow-400',
        border: 'border-yellow-500/50',
        text: 'text-yellow-300'
      };
    case 'Low':
      return {
        pill: 'bg-sky-500/20 text-sky-300 border-sky-500/50',
        dot: 'bg-sky-400',
        border: 'border-sky-500/50',
        text: 'text-sky-300'
      };
    default:
      return {
        pill: 'bg-gray-500/20 text-gray-300 border-gray-500/50',
        dot: 'bg-gray-400',
        border: 'border-gray-500/50',
        text: 'text-gray-300'
      };
  }
};

const TriggerGroup: React.FC<{
    severity: 'High' | 'Medium' | 'Low';
    triggers: SpamTrigger[];
    onSuggestionClick: (triggerWord: string, suggestion: string) => void;
    onQuickFix: (triggerWord: string, suggestion: string) => void;
}> = ({ severity, triggers, onSuggestionClick, onQuickFix }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const styles = getSeverityStyles(severity);

    return (
        <div className={`bg-white/5 rounded-lg border ${styles.border}`}>
            <button
                type="button"
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full flex justify-between items-center text-left p-3 sm:p-4 hover:bg-white/5 transition-colors"
                data-testid={`button-expand-${severity.toLowerCase()}-triggers`}
            >
                <div className="flex items-center gap-3">
                    <div className={`flex items-center justify-center w-8 h-8 rounded-full bg-gray-900/50 border ${styles.border}`}>
                        <span className={`w-3 h-3 rounded-full ${styles.dot}`}></span>
                    </div>
                    <h4 className={`text-base sm:text-lg font-bold ${styles.text}`}>{severity} Severity Triggers</h4>
                </div>
                <div className="flex items-center gap-3">
                    <span className="text-sm px-2.5 py-1 bg-gray-900/50 text-gray-400 rounded-md font-medium">{triggers.length} {triggers.length === 1 ? 'issue' : 'issues'}</span>
                    <ChevronDownIcon className={`w-6 h-6 text-gray-400 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
                </div>
            </button>
            <div className={`grid transition-all duration-500 ease-in-out ${isExpanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
                <div className="overflow-hidden">
                    <div className="p-3 sm:p-4 border-t border-white/10 space-y-4">
                        {triggers.map((trigger, index) => (
                            <div key={index} className="bg-gray-900/50 p-4 rounded-lg border border-white/10" data-testid={`spam-trigger-${index}`}>
                                <h4 className="text-lg sm:text-xl font-bold text-purple-300 mb-2">"{trigger.word}"</h4>
                                
                                <div className="grid md:grid-cols-2 gap-x-6 gap-y-4 border-t border-white/10 pt-4">
                                <div>
                                    <h5 className="font-semibold text-gray-200 mb-2">Why it's a flag</h5>
                                    <p className="text-gray-400 text-sm leading-relaxed">{trigger.reason}</p>
                                </div>
                                
                                <div>
                                    <h5 className="font-semibold text-gray-200 mb-2">What to use instead</h5>
                                    <div className="flex items-start gap-2 p-2 rounded-md bg-gray-900/50 border border-white/10 mb-3">
                                        <InfoIcon className="w-4 h-4 text-purple-400 flex-shrink-0 mt-0.5" />
                                        <p className="text-xs text-gray-400 leading-relaxed">
                                            Clicking a suggestion will replace "<strong className="text-gray-300">{trigger.word}</strong>" everywhere in your subject, preview, and body text.
                                        </p>
                                    </div>
                                    <div className="flex flex-wrap gap-2 items-center">
                                    {trigger.suggestion && (
                                        <button
                                        onClick={() => onSuggestionClick(trigger.word, trigger.suggestion)}
                                        className="bg-purple-600 text-white px-3 py-1 rounded-full text-sm font-medium hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-gray-900 transition-colors cursor-pointer"
                                        title={`Replace "${trigger.word}" with "${trigger.suggestion}"`}
                                        data-testid={`button-suggestion-primary-${index}`}
                                        >
                                        {trigger.suggestion}
                                        </button>
                                    )}
                                    {trigger.suggestions.filter(s => s !== trigger.suggestion).map((suggestion, sIndex) => (
                                        <button
                                        key={sIndex}
                                        onClick={() => onSuggestionClick(trigger.word, suggestion)}
                                        className="bg-gray-700 text-gray-300 px-3 py-1 rounded-full text-sm font-medium hover:bg-gray-600 hover:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-gray-900 transition-colors cursor-pointer"
                                        title={`Replace "${trigger.word}" with "${suggestion}"`}
                                        data-testid={`button-suggestion-${index}-${sIndex}`}
                                        >
                                        {suggestion}
                                        </button>
                                    ))}
                                    {trigger.suggestion && (
                                        <button
                                        onClick={() => onQuickFix(trigger.word, trigger.suggestion)}
                                        className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold text-purple-300 bg-purple-500/20 rounded-full hover:bg-purple-500/30 transition-colors"
                                        title={`Automatically replace "${trigger.word}" with "${trigger.suggestion}" and re-grade`}
                                        data-testid={`button-quickfix-${index}`}
                                        >
                                        <RewriteIcon className="w-4 h-4" />
                                        <span>Quick Fix</span>
                                        </button>
                                    )}
                                    </div>
                                </div>
                                {trigger.rephraseExamples && trigger.rephraseExamples.length > 0 && (
                                    <div className="md:col-span-2 mt-2">
                                        <h5 className="font-semibold text-gray-200 mb-2">Rephrasing Examples</h5>
                                        <ul className="space-y-2">
                                            {trigger.rephraseExamples.map((example, exIndex) => (
                                                <li key={exIndex} className="text-sm text-gray-400 italic bg-gray-900/50 p-3 rounded-md border-l-4 border-purple-500 flex items-start">
                                                <CtaIcon />
                                                <span className="ml-2 flex-1">{example}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export const SpamAnalysisCard: React.FC<SpamAnalysisCardProps> = ({ spamTriggers, onSuggestionClick, onQuickFix }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const groupedTriggers = useMemo(() => {
    return spamTriggers.reduce((acc, trigger) => {
      (acc[trigger.severity] = acc[trigger.severity] || []).push(trigger);
      return acc;
    }, {} as Record<SpamTrigger['severity'], SpamTrigger[]>);
  }, [spamTriggers]);

  const severityOrder: SpamTrigger['severity'][] = ['High', 'Medium', 'Low'];

  return (
    <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl shadow-lg" data-testid="spam-analysis-card">
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between text-left p-4 sm:p-6 focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 rounded-2xl"
        aria-expanded={isExpanded}
        data-testid="button-expand-spam-analysis"
      >
        <div className="flex items-center gap-3">
          <span className="text-purple-400"><SpamIcon /></span>
          <h3 className="text-lg sm:text-xl font-semibold text-white">Spam Trigger Analysis</h3>
          <InfoTooltip text="Scans your email for words and phrases known to be flagged by spam filters. Avoiding these increases the chance of landing in the primary inbox." />
        </div>
        <ChevronDownIcon className={`w-6 h-6 text-gray-400 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
      </button>

      <div className={`grid transition-all duration-500 ease-in-out ${isExpanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
        <div className="overflow-hidden">
          <div className="px-4 sm:px-6 pb-4 sm:pb-6">
            <div className="pt-4 mt-4 border-t border-white/10">
              {spamTriggers.length === 0 ? (
                <div className="text-center py-8 bg-green-500/10 border border-green-500/20 rounded-lg">
                  <p className="text-lg font-semibold text-green-300">Great news!</p>
                  <p className="text-gray-300">No common spam trigger words were found in your copy.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {severityOrder.map((severity) => {
                    if (groupedTriggers[severity] && groupedTriggers[severity].length > 0) {
                      return (
                        <TriggerGroup
                          key={severity}
                          severity={severity}
                          triggers={groupedTriggers[severity]}
                          onSuggestionClick={onSuggestionClick}
                          onQuickFix={onQuickFix}
                        />
                      );
                    }
                    return null;
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
