import { useState } from 'react';
import type { HistoryItem } from '../types';
import { DomainHealthChecker } from './DomainHealthChecker';
import { ListQualityChecker } from './ListQualityChecker';
import { ScoreHistoryChart } from './ScoreHistoryChart';
import { ChevronDownIcon, PreFlightIcon, AnalyticsIcon } from './icons/CategoryIcons';

interface ReputationDashboardProps {
    history: HistoryItem[];
}

export const ReputationDashboard: React.FC<ReputationDashboardProps> = ({ history }) => {
    const [isExpanded, setIsExpanded] = useState(false);

    return (
        <div className="mt-8 bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl shadow-lg" data-testid="reputation-dashboard">
            <button
                type="button"
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full flex items-center justify-between text-left p-4 sm:p-6 focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 rounded-2xl"
                aria-expanded={isExpanded}
                data-testid="button-toggle-dashboard"
            >
                <div className="flex items-center gap-3">
                    <span className="text-purple-400"><PreFlightIcon /></span>
                    <h3 className="text-lg sm:text-xl font-semibold text-white">Reputation Dashboard</h3>
                </div>
                <div className="flex items-center gap-2">
                    <ChevronDownIcon className={`w-6 h-6 text-gray-400 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
                </div>
            </button>

            <div className={`grid transition-all duration-500 ease-in-out ${isExpanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
                <div className="overflow-hidden">
                    <div className="px-4 sm:px-6 pb-4 sm:pb-6">
                        <div className="border-t border-white/10 pt-4 mt-4">
                            <div className="space-y-8">
                               <div>
                                    <div className="flex items-center gap-3 mb-4">
                                        <span className="text-purple-400"><AnalyticsIcon /></span>
                                        <h3 className="text-xl font-bold text-white">Score History</h3>
                                    </div>
                                    <p className="text-sm text-gray-400 mb-4">
                                        Track your Inbox Authority Score over your last 10 analyses to see how your improvements are affecting your deliverability.
                                    </p>
                                    <ScoreHistoryChart history={history} />
                               </div>
                               <div className="border-t border-white/10"></div>
                               <DomainHealthChecker />
                               <div className="border-t border-white/10"></div>
                               <ListQualityChecker />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
