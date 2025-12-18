import { useState } from 'react';
import type { StructuralFinding } from '../types';
import { rewriteSentence, gradeSentence } from '../services/geminiService';
import type { SentenceGrade } from '../types';
import { StructuralIcon, CapitalizationIcon, PunctuationIcon, SentenceStructureIcon, ChevronDownIcon, RewriteIcon } from './icons/CategoryIcons';
import { InfoTooltip } from './InfoTooltip';

interface StructuralAnalysisCardProps {
  structuralFindings: StructuralFinding[];
  onFullRewrite: (originalText: string, newText: string) => void;
}

const getSeverityStyles = (severity: 'High' | 'Medium' | 'Low'): { pill: string; dot: string } => {
  switch (severity) {
    case 'High':
      return {
        pill: 'bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-300 border-red-300 dark:border-red-500/50',
        dot: 'bg-red-400'
      };
    case 'Medium':
      return {
        pill: 'bg-yellow-100 dark:bg-yellow-500/20 text-yellow-700 dark:text-yellow-300 border-yellow-300 dark:border-yellow-500/50',
        dot: 'bg-yellow-400'
      };
    case 'Low':
      return {
        pill: 'bg-sky-100 dark:bg-sky-500/20 text-sky-700 dark:text-sky-300 border-sky-300 dark:border-sky-500/50',
        dot: 'bg-sky-400'
      };
    default:
      return {
        pill: 'bg-muted text-muted-foreground border-border',
        dot: 'bg-muted-foreground'
      };
  }
};

const getFindingIcon = (type: StructuralFinding['type']): React.ReactNode => {
    switch(type) {
        case 'Capitalization':
            return <CapitalizationIcon />;
        case 'Punctuation':
            return <PunctuationIcon />;
        case 'Sentence Structure':
            return <SentenceStructureIcon />;
        default:
            return null;
    }
}

export const StructuralAnalysisCard: React.FC<StructuralAnalysisCardProps> = ({ structuralFindings, onFullRewrite }) => {
  const [isExpanded, setIsExpanded] =useState(false);
  const [rewriteState, setRewriteState] = useState<{ [key: number]: { isRewriting: boolean; rewrittenText: string | null; error: string | null; isGrading?: boolean; grade?: SentenceGrade | null; } }>({});
  
  if (!structuralFindings || structuralFindings.length === 0) {
    return null; 
  }

  const handleRewriteClick = async (sentence: string, index: number) => {
    setRewriteState(prev => ({
        ...prev,
        [index]: { isRewriting: true, rewrittenText: null, error: null }
    }));
    try {
        const rewritten = await rewriteSentence(sentence);
        setRewriteState(prev => ({
            ...prev,
            [index]: { ...prev[index], isRewriting: false, rewrittenText: rewritten, isGrading: true }
        }));
        
        try {
            const grade = await gradeSentence(rewritten);
            setRewriteState(prev => ({
                ...prev,
                [index]: { ...prev[index], isGrading: false, grade: grade }
            }));
        } catch (gradeError) {
            console.error("Grading failed:", gradeError);
            setRewriteState(prev => ({
                ...prev,
                [index]: { ...prev[index], isGrading: false, grade: null }
            }));
        }

    } catch (err) {
        setRewriteState(prev => ({
            ...prev,
            [index]: { isRewriting: false, rewrittenText: null, error: "Failed to rewrite sentence.", isGrading: false }
        }));
    }
  };

  const handleAccept = (originalText: string, rewrittenText: string, index: number) => {
    onFullRewrite(originalText, rewrittenText);
    setRewriteState(prev => {
        const newState = { ...prev };
        delete newState[index];
        return newState;
    });
  };

  const handleCancel = (index: number) => {
    setRewriteState(prev => {
        const newState = { ...prev };
        delete newState[index];
        return newState;
    });
  };

  return (
    <div className="bg-card border border-border rounded-2xl shadow-lg" data-testid="structural-analysis-card">
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between text-left p-4 sm:p-6 focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 rounded-2xl"
        aria-expanded={isExpanded}
        data-testid="button-expand-structural-analysis"
      >
        <div className="flex items-center gap-3">
          <span className="text-purple-600 dark:text-purple-400"><StructuralIcon /></span>
          <h3 className="text-lg sm:text-xl font-semibold text-foreground">Formatting & Style Analysis</h3>
          <InfoTooltip text="Checks for stylistic issues like excessive capitalization or punctuation that can make your email look unprofessional and trigger spam filters." />
        </div>
        <ChevronDownIcon className={`w-6 h-6 text-muted-foreground transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
      </button>

      <div className={`grid transition-all duration-500 ease-in-out ${isExpanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
        <div className="overflow-hidden">
           <div className="px-4 sm:px-6 pb-4 sm:pb-6">
            <div className="border-t border-border pt-4 mt-4 space-y-4">
              {structuralFindings.map((finding, index) => {
                const severityStyles = getSeverityStyles(finding.severity);
                const currentRewrite = rewriteState[index];
                return (
                  <div key={index} className="bg-muted p-4 rounded-lg border border-border" data-testid={`structural-finding-${index}`}>
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-3">
                          <span className="flex items-center justify-center w-10 h-10 rounded-full bg-muted border border-border text-purple-600 dark:text-purple-400">
                              {getFindingIcon(finding.type)}
                          </span>
                          <h4 className="text-lg sm:text-xl font-bold text-purple-600 dark:text-purple-300">{finding.type}</h4>
                      </div>
                      <div className={`inline-flex items-center gap-2 text-sm font-semibold px-3 py-1 border rounded-full ${severityStyles.pill}`}>
                        <span className={`w-2 h-2 rounded-full ${severityStyles.dot}`}></span>
                        <span>{finding.severity}</span>
                      </div>
                    </div>
                    
                    <div className="space-y-3 border-t border-border pt-4">
                      <div>
                        <h5 className="font-semibold text-foreground mb-1">Finding</h5>
                        <p className="text-muted-foreground text-sm italic">"{finding.summary}"</p>
                      </div>
                      <div>
                        <h5 className="font-semibold text-foreground mb-1">Why it's a flag</h5>
                        <p className="text-muted-foreground text-sm leading-relaxed">{finding.feedback}</p>
                      </div>
                      <div>
                        <h5 className="font-semibold text-foreground mb-1">Suggestion</h5>
                        <p className="text-muted-foreground text-sm leading-relaxed">{finding.suggestion}</p>
                      </div>
                      
                      {finding.type === 'Sentence Structure' && finding.originalText && (
                        <div className="pt-3 border-t border-border">
                            {!currentRewrite ? (
                                <div className="p-3 bg-muted rounded-lg border-l-4 border-purple-500/60">
                                    <p className="text-sm text-muted-foreground italic mb-3">"{finding.originalText}"</p>
                                    <button 
                                        onClick={() => handleRewriteClick(finding.originalText, index)} 
                                        className="flex items-center gap-2 px-3 py-1 text-sm font-semibold text-purple-600 dark:text-purple-300 bg-purple-500/20 rounded-full hover:bg-purple-500/30 transition-colors"
                                        data-testid={`button-rewrite-${index}`}
                                    >
                                        <RewriteIcon className="w-4 h-4" />
                                        <span>Quick Fix</span>
                                    </button>
                                </div>
                            ) : (
                                <div>
                                    {currentRewrite.isRewriting && (
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                            <div className="w-4 h-4 border-2 border-muted-foreground border-t-transparent rounded-full animate-spin"></div>
                                            <span>Rewriting sentence...</span>
                                        </div>
                                    )}
                                    {currentRewrite.error && <p className="text-sm text-red-500">{currentRewrite.error}</p>}
                                    {currentRewrite.rewrittenText && (
                                        <div className="space-y-3 p-3 bg-muted rounded-lg border border-border">
                                            <p className="text-sm text-muted-foreground italic line-through">Original: "{finding.originalText}"</p>
                                            <div>
                                              <p className="text-sm text-foreground font-semibold mb-1">Suggestion:</p>
                                              <p className="text-sm text-green-600 dark:text-green-300 italic">"{currentRewrite.rewrittenText}"</p>
                                            </div>

                                            <div className="h-6">
                                                {currentRewrite.isGrading && (
                                                    <div className="flex items-center gap-2 text-xs text-muted-foreground animate-pulse">
                                                        <div className="w-3 h-3 border-2 border-muted-foreground border-t-transparent rounded-full animate-spin"></div>
                                                        <span>Analyzing fix...</span>
                                                    </div>
                                                )}
                                                {currentRewrite.grade && (
                                                    <div className={`flex items-center gap-2 text-xs font-semibold ${currentRewrite.grade.isGood ? 'text-green-600' : 'text-yellow-600'}`}>
                                                        {currentRewrite.grade.isGood ? 
                                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg> :
                                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M8.257 3.099c.636-1.21 2.27-1.21 2.906 0l4.257 8.122c.636 1.21-.242 2.779-1.636 2.779H5.636c-1.394 0-2.272-1.569-1.636-2.779l4.257-8.122zM9 11a1 1 0 112 0v1a1 1 0 11-2 0v-1zm1-4a1 1 0 011 1v3a1 1 0 11-2 0V8a1 1 0 011-1z" clipRule="evenodd" /></svg>
                                                        }
                                                        <span>{currentRewrite.grade.feedback}</span>
                                                    </div>
                                                )}
                                            </div>
                                            
                                            <div className="flex gap-2 pt-2 border-t border-border">
                                                <button 
                                                    onClick={() => handleAccept(finding.originalText, currentRewrite.rewrittenText!, index)} 
                                                    className="px-3 py-1 text-xs font-bold text-white bg-green-600 hover:bg-green-700 rounded"
                                                    data-testid={`button-accept-rewrite-${index}`}
                                                >
                                                    Accept
                                                </button>
                                                <button 
                                                    onClick={() => handleCancel(index)} 
                                                    className="px-3 py-1 text-xs font-bold text-foreground bg-muted hover:bg-muted-foreground/20 rounded border border-border"
                                                    data-testid={`button-cancel-rewrite-${index}`}
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
