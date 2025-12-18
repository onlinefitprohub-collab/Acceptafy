import { useState } from 'react';
import type { SubjectLineVariation } from '../types';
import { SubjectShowdownIcon, ChevronDownIcon } from './icons/CategoryIcons';
import { InfoTooltip } from './InfoTooltip';

interface SubjectShowdownCardProps {
  analysis: SubjectLineVariation[];
}

export const SubjectShowdownCard: React.FC<SubjectShowdownCardProps> = ({ analysis }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="bg-card border border-border rounded-2xl shadow-lg" data-testid="subject-showdown-card">
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between text-left p-4 sm:p-6 focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 rounded-2xl"
        aria-expanded={isExpanded}
        data-testid="button-expand-subject-showdown"
      >
        <div className="flex items-center gap-3">
          <span className="text-purple-600 dark:text-purple-400"><SubjectShowdownIcon /></span>
          <h3 className="text-lg sm:text-xl font-semibold text-foreground">Subject Line Showdown</h3>
          <InfoTooltip text="Simulates an A/B test on your subject line variations, predicting which one is most likely to achieve the highest open rate based on clarity and engagement." />
        </div>
        <ChevronDownIcon className={`w-6 h-6 text-muted-foreground transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
      </button>

      <div className={`grid transition-all duration-500 ease-in-out ${isExpanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
        <div className="overflow-hidden">
          <div className="px-4 sm:px-6 pb-4 sm:pb-6">
            <div className="border-t border-border pt-4 mt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {analysis.map((variation, index) => (
                  <div 
                    key={index} 
                    className={`p-4 rounded-lg border-2 ${variation.isWinner ? 'bg-green-100 dark:bg-green-500/10 border-green-500' : 'bg-muted border-border'}`}
                    data-testid={`subject-variation-${index}`}
                  >
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="font-bold text-lg text-foreground">Variation {index + 1}</h4>
                      {variation.isWinner && (
                        <span className="px-3 py-1 text-sm font-bold text-green-900 bg-green-400 rounded-full">
                          Predicted Winner
                        </span>
                      )}
                    </div>
                    
                    <p className="text-sm font-semibold text-foreground">Subject:</p>
                    <p className="mb-2 text-muted-foreground">"{variation.subject}"</p>
                    
                    <p className="text-sm font-semibold text-foreground">Preview:</p>
                    <p className="mb-4 text-muted-foreground">"{variation.previewText}"</p>
                    
                    <div className="text-center font-bold text-2xl sm:text-3xl mb-2 text-foreground" data-testid={`text-prediction-score-${index}`}>
                      {variation.predictionScore}/100
                    </div>

                    <div className="w-full bg-muted rounded-full h-2.5 mb-4 border border-border">
                      <div className="bg-purple-500 h-2 rounded-full m-px" style={{ width: `calc(${variation.predictionScore}% - 2px)` }}></div>
                    </div>

                    <h5 className="font-semibold text-foreground mb-1">Rationale:</h5>
                    <p className="text-sm text-muted-foreground leading-relaxed">{variation.rationale}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
