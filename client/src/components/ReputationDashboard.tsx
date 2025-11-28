import { useState } from 'react';
import { DomainHealthChecker } from './DomainHealthChecker';
import { ListQualityChecker } from './ListQualityChecker';
import { DeliverabilityChecklist } from './DeliverabilityChecklist';
import { BimiGenerator } from './BimiGenerator';
import { ScoreHistoryChart } from './ScoreHistoryChart';
import { ChevronDownIcon, PreFlightIcon } from './icons/CategoryIcons';
import type { HistoryItem, DnsRecords } from '../types';

interface ReputationDashboardProps {
    history: HistoryItem[];
    onGenerateDns: (domain: string) => void;
    isGeneratingDns: boolean;
    dnsRecords: DnsRecords | null;
}

export const ReputationDashboard: React.FC<ReputationDashboardProps> = ({ 
    history, 
    onGenerateDns, 
    isGeneratingDns, 
    dnsRecords 
}) => {
    const [isExpanded, setIsExpanded] = useState(false);

    return (
        <div className="mt-8 bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
            <button 
                onClick={() => setIsExpanded(!isExpanded)} 
                className="w-full p-6 flex justify-between items-center text-white hover:bg-white/5 transition-colors"
                data-testid="button-toggle-dashboard"
            >
                <div className="flex items-center gap-3">
                    <PreFlightIcon className="w-6 h-6 text-purple-400" />
                    <h3 className="text-xl font-bold">Sender Reputation Dashboard</h3>
                </div>
                <ChevronDownIcon className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
            </button>
            
            {isExpanded && (
                <div className="p-6 border-t border-white/10 space-y-8 animate-fade-in">
                    <ScoreHistoryChart history={history} />
                    
                    <div className="grid md:grid-cols-2 gap-8">
                        <DomainHealthChecker />
                        <ListQualityChecker />
                    </div>
                    
                    <DeliverabilityChecklist 
                        onGenerateDns={onGenerateDns} 
                        isGeneratingDns={isGeneratingDns} 
                        dnsRecords={dnsRecords} 
                    />
                    
                    <BimiGenerator />
                </div>
            )}
        </div>
    );
};
