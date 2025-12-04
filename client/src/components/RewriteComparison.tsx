import { useState } from 'react';
import type { GradingResult, RewrittenEmail } from '../types';
import { ResultsHub } from './ResultsHub';
import { CopyIcon, CheckIcon } from './icons/CategoryIcons';

interface RewriteComparisonProps {
    originalResult: GradingResult;
    rewrittenResult: GradingResult;
    originalContent: { body: string, variations: { subject: string, previewText: string }[] };
    rewrittenContent: RewrittenEmail;
    onAccept: () => void;
    onDiscard: () => void;
}

interface MetricRowProps {
    label: string;
    originalValue: number | string;
    newValue: number | string;
    higherIsBetter?: boolean;
    isGrade?: boolean;
}

const gradeMap: { [key: string]: number } = {
    'A+': 12, 'A': 11, 'A-': 10,
    'B+': 9,  'B': 8,  'B-': 7,
    'C+': 6,  'C': 5,  'C-': 4,
    'D+': 3,  'D': 2, 'D-': 1, 'F': 0,
};

const gradeToScore = (grade: string) => gradeMap[grade.toUpperCase()] ?? -1;

const MetricRow: React.FC<MetricRowProps> = ({ label, originalValue, newValue, higherIsBetter = true, isGrade = false }) => {
    let diff = 0;
    
    if (isGrade) {
        const originalScore = gradeToScore(String(originalValue));
        const newScore = gradeToScore(String(newValue));
        if (originalScore !== -1 && newScore !== -1) {
            diff = newScore - originalScore;
        }
    } else {
        diff = Number(newValue) - Number(originalValue);
    }
    
    const isImprovement = higherIsBetter ? diff > 0 : diff < 0;
    const isRegression = higherIsBetter ? diff < 0 : diff > 0;

    const changeColor = isImprovement ? 'text-green-500' : isRegression ? 'text-red-500' : 'text-gray-400';
    const changeIcon = isImprovement ? '▲' : isRegression ? '▼' : '';

    return (
        <div className="flex justify-between items-center text-sm p-3 bg-white/5 rounded-md">
            <span className="font-semibold text-gray-300">{label}</span>
            <div className="flex items-center gap-2 sm:gap-4">
                <span className="text-gray-400">{originalValue}</span>
                <span className="text-2xl text-gray-500 font-light">→</span>
                <div className="flex items-baseline gap-1 w-20 sm:w-24 justify-end">
                    <span className="font-bold text-lg text-purple-300">{newValue}</span>
                    {diff !== 0 && (
                        <span className={`font-bold ${changeColor}`}>
                            {changeIcon} {!isGrade ? ` ${Math.abs(diff)}` : ''}
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
}

export const RewriteComparison: React.FC<RewriteComparisonProps> = ({
    originalResult,
    rewrittenResult,
    originalContent,
    rewrittenContent,
    onAccept,
    onDiscard,
}) => {
    const [copiedState, setCopiedState] = useState({
        subject: false,
        preview: false,
        body: false,
    });

    const handleCopy = (text: string, type: 'subject' | 'preview' | 'body') => {
        navigator.clipboard.writeText(text).then(() => {
            setCopiedState(prev => ({ ...prev, [type]: true }));
            setTimeout(() => {
                setCopiedState(prev => ({ ...prev, [type]: false }));
            }, 2000);
        });
    };

    const originalWinner = originalResult.subjectLineAnalysis?.find(v => v.isWinner) || originalResult.subjectLineAnalysis?.[0] || originalContent.variations[0];

    const CopyButton: React.FC<{text: string, type: 'subject' | 'preview' | 'body'}> = ({ text, type }) => {
        const isCopied = copiedState[type];
        return (
            <button 
                onClick={() => handleCopy(text, type)} 
                className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full transition-colors ${isCopied ? 'bg-green-500/20 text-green-300' : 'bg-white/10 text-gray-300 hover:bg-white/20'}`}
                data-testid={`button-copy-${type}`}
            >
                {isCopied ? <CheckIcon className="w-4 h-4" /> : <CopyIcon className="w-4 h-4" />}
                <span>{isCopied ? 'Copied!' : 'Copy'}</span>
            </button>
        );
    };

    return (
        <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-4 sm:p-6 shadow-lg space-y-8 animate-fade-in" data-testid="rewrite-comparison">
            <h2 className="text-xl sm:text-2xl font-bold text-center text-white">Rewrite Comparison</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* BEFORE Column */}
                <div>
                    <h3 className="text-lg sm:text-xl font-semibold text-center text-gray-400 mb-4">Before</h3>
                    <ResultsHub scoreData={originalResult.inboxPlacementScore} gradeData={originalResult.overallGrade} isComparison={true} />
                    <div className="mt-6 space-y-4 text-sm">
                        <div>
                            <h4 className="font-semibold text-gray-300 mb-1">Subject:</h4>
                            <p className="p-3 bg-white/5 rounded-lg text-gray-400 border border-white/10">{originalWinner?.subject}</p>
                        </div>
                        <div>
                            <h4 className="font-semibold text-gray-300 mb-1">Preview Text:</h4>
                            <p className="p-3 bg-white/5 rounded-lg text-gray-400 border border-white/10">{originalWinner?.previewText}</p>
                        </div>
                    </div>
                </div>

                {/* AFTER Column */}
                <div>
                    <h3 className="text-lg sm:text-xl font-semibold text-center text-green-300 mb-4">After (Enhanced)</h3>
                    <ResultsHub scoreData={rewrittenResult.inboxPlacementScore} gradeData={rewrittenResult.overallGrade} isComparison={true} />
                     <div className="mt-6 space-y-4 text-sm">
                        <div>
                            <div className="flex justify-between items-center mb-1">
                                <h4 className="font-semibold text-gray-300">Subject:</h4>
                                <CopyButton text={rewrittenContent.subject} type="subject" />
                            </div>
                            <p className="p-3 bg-white/5 rounded-lg text-gray-400 border border-white/10">{rewrittenContent.subject}</p>
                        </div>
                        <div>
                            <div className="flex justify-between items-center mb-1">
                                <h4 className="font-semibold text-gray-300">Preview Text:</h4>
                                <CopyButton text={rewrittenContent.previewText} type="preview" />
                            </div>
                            <p className="p-3 bg-white/5 rounded-lg text-gray-400 border border-white/10">{rewrittenContent.previewText}</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="border-t border-b border-white/10 py-6">
                <h3 className="text-lg sm:text-xl font-semibold text-center text-gray-300 mb-4">Key Metric Improvements</h3>
                <div className="max-w-xl mx-auto space-y-2">
                    <MetricRow label="Inbox Score" originalValue={originalResult.inboxPlacementScore.score} newValue={rewrittenResult.inboxPlacementScore.score} higherIsBetter={true} />
                    <MetricRow label="Overall Grade" originalValue={originalResult.overallGrade.grade} newValue={rewrittenResult.overallGrade.grade} isGrade={true} />
                    <MetricRow label="Personalization Score" originalValue={originalResult.personalizationScore?.score || 0} newValue={rewrittenResult.personalizationScore?.score || 0} higherIsBetter={true} />
                    <MetricRow label="Spam Triggers" originalValue={originalResult.spamAnalysis?.length || 0} newValue={rewrittenResult.spamAnalysis?.length || 0} higherIsBetter={false} />
                    <MetricRow label="Formatting Issues" originalValue={originalResult.structuralAnalysis?.length || 0} newValue={rewrittenResult.structuralAnalysis?.length || 0} higherIsBetter={false} />
                </div>
            </div>
            
            <div className="pt-6">
                 <h3 className="text-lg sm:text-xl font-semibold text-center text-gray-300 mb-4">Body Copy Comparison</h3>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                         <h4 className="font-semibold text-center text-gray-400 mb-2">Before</h4>
                         <div className="p-4 bg-gray-900/50 rounded-lg text-gray-400 h-48 sm:h-64 overflow-y-auto whitespace-pre-wrap font-sans text-sm border border-white/10">
                            {originalContent.body}
                         </div>
                    </div>
                     <div>
                         <div className="flex justify-between items-center mb-2">
                            <h4 className="font-semibold text-center text-green-300">After</h4>
                            <CopyButton text={rewrittenContent.body} type="body" />
                         </div>
                         <div className="p-4 bg-gray-900/50 rounded-lg text-gray-400 h-48 sm:h-64 overflow-y-auto whitespace-pre-wrap font-sans text-sm border border-green-500/50">
                            {rewrittenContent.body}
                         </div>
                    </div>
                 </div>
            </div>


            <div className="flex flex-col sm:flex-row justify-center gap-4 mt-8">
                <button
                    onClick={onDiscard}
                    className="w-full sm:w-auto px-6 py-3 bg-gray-600 text-white font-semibold rounded-lg hover:bg-gray-700 transition-all duration-200"
                    data-testid="button-discard-rewrite"
                >
                    Discard Rewrite
                </button>
                <button
                    onClick={onAccept}
                    className="w-full sm:w-auto px-6 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-all duration-200"
                    data-testid="button-accept-rewrite"
                >
                    Accept & Use This Version
                </button>
            </div>
        </div>
    );
};
