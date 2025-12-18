import { useState } from 'react';
import type { AccessibilityFinding } from '../types';
import { AccessibilityIcon, ChevronDownIcon } from './icons/CategoryIcons';
import { InfoTooltip } from './InfoTooltip';

interface AccessibilityCardProps {
  findings: AccessibilityFinding[];
}

const getSeverityStyles = (severity: 'High' | 'Medium' | 'Low'): { pill: string; dot: string } => {
  switch (severity) {
    case 'High':
      return { pill: 'bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-300 border-red-300 dark:border-red-500/50', dot: 'bg-red-400' };
    case 'Medium':
      return { pill: 'bg-yellow-100 dark:bg-yellow-500/20 text-yellow-700 dark:text-yellow-300 border-yellow-300 dark:border-yellow-500/50', dot: 'bg-yellow-400' };
    case 'Low':
      return { pill: 'bg-sky-100 dark:bg-sky-500/20 text-sky-700 dark:text-sky-300 border-sky-300 dark:border-sky-500/50', dot: 'bg-sky-400' };
    default:
      return { pill: 'bg-muted text-muted-foreground border-border', dot: 'bg-muted-foreground' };
  }
};

export const AccessibilityCard: React.FC<AccessibilityCardProps> = ({ findings }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!findings || findings.length === 0) {
    return null; 
  }

  return (
    <div className="bg-card border border-border rounded-2xl shadow-lg" data-testid="accessibility-card">
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between text-left p-4 sm:p-6 focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 rounded-2xl"
        aria-expanded={isExpanded}
        data-testid="button-expand-accessibility"
      >
        <div className="flex items-center gap-3">
          <span className="text-purple-600 dark:text-purple-400"><AccessibilityIcon /></span>
          <h3 className="text-lg sm:text-xl font-semibold text-foreground">Accessibility & Inclusivity</h3>
          <InfoTooltip text="Checks for common issues that can make your email difficult to read for people with disabilities, such as poor color contrast or missing image descriptions." />
        </div>
        <ChevronDownIcon className={`w-6 h-6 text-muted-foreground transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
      </button>

      <div className={`grid transition-all duration-500 ease-in-out ${isExpanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
        <div className="overflow-hidden">
           <div className="px-4 sm:px-6 pb-4 sm:pb-6">
            <div className="border-t border-border pt-4 mt-4 space-y-4">
              {findings.map((finding, index) => {
                const severityStyles = getSeverityStyles(finding.severity);
                return (
                  <div key={index} className="bg-muted p-4 rounded-lg border border-border" data-testid={`accessibility-finding-${index}`}>
                    <div className="flex justify-between items-start mb-3">
                        <h4 className="text-lg font-bold text-purple-600 dark:text-purple-300">{finding.type}</h4>
                        <div className={`inline-flex items-center gap-2 text-sm font-semibold px-3 py-1 border rounded-full ${severityStyles.pill}`}>
                            <span className={`w-2 h-2 rounded-full ${severityStyles.dot}`}></span>
                            <span>{finding.severity}</span>
                        </div>
                    </div>
                    <div className="space-y-2 text-sm">
                        <p className="text-muted-foreground italic">"{finding.summary}"</p>
                        <div>
                            <h5 className="font-semibold text-foreground">Suggestion:</h5>
                            <p className="text-muted-foreground">{finding.suggestion}</p>
                        </div>
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
