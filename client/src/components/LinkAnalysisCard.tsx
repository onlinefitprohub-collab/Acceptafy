import { useState } from 'react';
import type { LinkAnalysisFinding } from '../types';
import { LinkIcon, GoodStatusIcon, WarningStatusIcon, BadStatusIcon, ChevronDownIcon } from './icons/CategoryIcons';
import { InfoTooltip } from './InfoTooltip';

interface LinkAnalysisCardProps {
  linkFindings: LinkAnalysisFinding[];
}

const getStatusIcon = (status: LinkAnalysisFinding['status']) => {
  switch (status) {
    case 'Good':
      return <GoodStatusIcon />;
    case 'Warning':
      return <WarningStatusIcon />;
    case 'Bad':
      return <BadStatusIcon />;
    default:
      return null;
  }
};

export const LinkAnalysisCard: React.FC<LinkAnalysisCardProps> = ({ linkFindings }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!linkFindings || linkFindings.length === 0) {
    return null;
  }

  return (
    <div className="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl shadow-lg" data-testid="link-analysis-card">
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between text-left p-4 sm:p-6 focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 rounded-2xl"
        aria-expanded={isExpanded}
        data-testid="button-expand-link-analysis"
      >
        <div className="flex items-center gap-3">
          <span className="text-purple-400"><LinkIcon /></span>
          <h3 className="text-lg sm:text-xl font-semibold text-white">Link & Reputation Analysis</h3>
          <InfoTooltip text="Checks all links in your email for issues that can harm deliverability, such as the use of public URL shorteners or non-descriptive anchor text." />
        </div>
        <ChevronDownIcon className={`w-6 h-6 text-gray-400 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
      </button>
      
      <div className={`grid transition-all duration-500 ease-in-out ${isExpanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
        <div className="overflow-hidden">
          <div className="px-4 sm:px-6 pb-4 sm:pb-6">
            <div className="border-t border-white/10 pt-4 mt-4 space-y-4">
              {linkFindings.map((finding, index) => (
                <div key={index} className="bg-white/5 p-4 rounded-lg border border-white/10" data-testid={`link-finding-${index}`}>
                  <div className="flex items-start gap-4">
                    <div className="mt-1">{getStatusIcon(finding.status)}</div>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-300 break-all">
                        {finding.anchorText}
                      </p>
                      <p className="text-xs text-purple-400 break-all">{finding.url}</p>

                      <div className="mt-3 border-t border-white/10 pt-3">
                          <p className="text-sm text-gray-400"><span className="font-semibold text-gray-300">Reason:</span> {finding.reason}</p>
                          {finding.suggestion && (
                              <p className="text-sm text-gray-400 mt-1"><span className="font-semibold text-gray-300">Suggestion:</span> {finding.suggestion}</p>
                          )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
