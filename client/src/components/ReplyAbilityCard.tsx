import { useState } from 'react';
import type { ReplyAbilityAnalysis } from '../types';
import { ReplyIcon, ChevronDownIcon, RewriteIcon } from './icons/CategoryIcons';
import { InfoTooltip } from './InfoTooltip';

interface ReplyAbilityCardProps {
  analysis: ReplyAbilityAnalysis;
  onGeneratePs: () => void;
  isGeneratingPs: boolean;
  generatedPs: string | null;
  onAppendPs: () => void;
}

export const ReplyAbilityCard: React.FC<ReplyAbilityCardProps> = ({
    analysis,
    onGeneratePs,
    isGeneratingPs,
    generatedPs,
    onAppendPs,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const circumference = 2 * Math.PI * 28;
  const offset = circumference - (analysis.score / 100) * circumference;

  const getColor = (score: number) => {
    if (score > 75) return 'stroke-green-400 text-green-300';
    if (score > 40) return 'stroke-yellow-400 text-yellow-300';
    return 'stroke-red-400 text-red-300';
  };
  const colorClasses = getColor(analysis.score);

  return (
    <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-4 sm:p-6 shadow-lg transition-all duration-300 h-full flex flex-col" data-testid="reply-ability-card">
        <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full flex items-center justify-between text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 rounded-md"
            aria-expanded={isExpanded}
            tabIndex={0}
            data-testid="button-expand-reply-ability"
        >
            <div className="flex items-center gap-3">
                <span className="text-purple-400"><ReplyIcon /></span>
                <h3 className="text-lg sm:text-xl font-semibold text-white">Reply-Ability Score</h3>
                <InfoTooltip text="Predicts how likely your email is to get a reply. Replies are a strong positive signal to inbox providers, significantly improving your sender reputation." />
            </div>
            <ChevronDownIcon className={`w-6 h-6 text-gray-400 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
        </button>
        
        <div className="flex-grow flex flex-col md:flex-row items-center gap-4 mt-4">
            <div className="flex-shrink-0">
                <div className="relative w-20 h-20">
                    <svg className="w-full h-full" viewBox="0 0 60 60">
                        <circle className="stroke-current text-gray-900/50" strokeWidth="4" fill="transparent" r="28" cx="30" cy="30" />
                        <circle
                            className={`transition-all duration-1000 ease-in-out ${colorClasses}`}
                            strokeWidth="4"
                            strokeDasharray={circumference}
                            strokeDashoffset={offset}
                            strokeLinecap="round"
                            fill="transparent"
                            r="28"
                            cx="30"
                            cy="30"
                            transform="rotate(-90 30 30)"
                        />
                    </svg>
                    <span className={`absolute inset-0 flex items-center justify-center text-xl font-bold ${colorClasses}`} data-testid="text-reply-score">
                        {analysis.score}
                    </span>
                </div>
            </div>
            <div className="flex-1 text-center md:text-left">
                <p className="text-gray-400 italic text-sm">"{analysis.summary}"</p>
            </div>
        </div>

        <div className={`grid transition-all duration-500 ease-in-out ${isExpanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
            <div className="overflow-hidden">
                <div className="border-t border-white/10 pt-4 mt-4">
                    <h4 className="font-semibold text-gray-300 mb-2">How to improve:</h4>
                    <ul className="space-y-1.5 list-disc list-inside text-gray-300 text-sm">
                        {analysis.feedback.map((item, index) => (
                            <li key={index}>{item}</li>
                        ))}
                    </ul>

                    <div className="mt-4 pt-4 border-t border-white/10">
                        {!generatedPs ? (
                            <button
                                onClick={onGeneratePs}
                                disabled={isGeneratingPs}
                                className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-semibold text-purple-300 bg-purple-500/20 rounded-lg hover:bg-purple-500/30 transition-colors disabled:opacity-50"
                                data-testid="button-generate-ps"
                            >
                                {isGeneratingPs ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                                        <span>Generating...</span>
                                    </>
                                ) : (
                                    <>
                                        <RewriteIcon className="w-4 h-4" />
                                        <span>Generate P.S. to Boost Replies</span>
                                    </>
                                )}
                            </button>
                        ) : (
                            <div className="p-3 bg-gray-900/50 rounded-lg border border-white/10 space-y-2 animate-fade-in">
                                <p className="text-sm text-green-300 italic" data-testid="text-generated-ps">"{generatedPs}"</p>
                                <div className="flex justify-end">
                                    <button 
                                        onClick={onAppendPs}
                                        className="px-3 py-1 text-xs font-bold text-white bg-green-600 hover:bg-green-700 rounded"
                                        data-testid="button-append-ps"
                                    >
                                        Append to Body
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    </div>
  );
};
