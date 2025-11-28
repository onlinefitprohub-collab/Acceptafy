import { useState } from 'react';
import { ChecklistIcon, CheckIcon, CloseIcon, CopyIcon, DnsIcon } from './icons/CategoryIcons';
import type { DnsRecords } from '../types';

interface DeliverabilityChecklistProps {
    onGenerateDns: (domain: string) => void;
    isGeneratingDns: boolean;
    dnsRecords: DnsRecords | null;
}

const checklistItems = [
    {
        id: 'spf',
        title: 'SPF Record',
        description: 'Sender Policy Framework - Lists authorized mail servers',
        importance: 'Critical'
    },
    {
        id: 'dkim',
        title: 'DKIM Signing',
        description: 'DomainKeys Identified Mail - Digital signature verification',
        importance: 'Critical'
    },
    {
        id: 'dmarc',
        title: 'DMARC Policy',
        description: 'Domain-based Message Authentication - Enforcement policy',
        importance: 'Critical'
    },
    {
        id: 'warmup',
        title: 'IP/Domain Warmup',
        description: 'Gradually increase send volume on new infrastructure',
        importance: 'Important'
    },
    {
        id: 'list-hygiene',
        title: 'List Hygiene',
        description: 'Regularly clean bounces and unengaged subscribers',
        importance: 'Important'
    },
    {
        id: 'double-optin',
        title: 'Double Opt-in',
        description: 'Confirm subscriber intent with verification email',
        importance: 'Recommended'
    },
    {
        id: 'unsubscribe',
        title: 'Easy Unsubscribe',
        description: 'One-click unsubscribe in every email',
        importance: 'Required'
    },
    {
        id: 'physical-address',
        title: 'Physical Address',
        description: 'Include your mailing address (CAN-SPAM requirement)',
        importance: 'Required'
    }
];

export const DeliverabilityChecklist: React.FC<DeliverabilityChecklistProps> = ({
    onGenerateDns,
    isGeneratingDns,
    dnsRecords
}) => {
    const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());
    const [domain, setDomain] = useState('');
    const [copiedRecord, setCopiedRecord] = useState<string | null>(null);

    const toggleItem = (id: string) => {
        const newChecked = new Set(checkedItems);
        if (newChecked.has(id)) {
            newChecked.delete(id);
        } else {
            newChecked.add(id);
        }
        setCheckedItems(newChecked);
    };

    const copyToClipboard = async (text: string, recordType: string) => {
        await navigator.clipboard.writeText(text);
        setCopiedRecord(recordType);
        setTimeout(() => setCopiedRecord(null), 2000);
    };

    const getImportanceColor = (importance: string) => {
        switch (importance) {
            case 'Critical': return 'text-red-400';
            case 'Required': return 'text-orange-400';
            case 'Important': return 'text-yellow-400';
            default: return 'text-gray-400';
        }
    };

    const completionPercentage = Math.round((checkedItems.size / checklistItems.length) * 100);

    return (
        <div className="bg-white/5 p-6 rounded-xl border border-white/10">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <ChecklistIcon className="w-6 h-6 text-purple-400" />
                    <h3 className="text-lg font-bold text-white">Deliverability Checklist</h3>
                </div>
                <div className="text-sm">
                    <span className="text-purple-400 font-bold">{completionPercentage}%</span>
                    <span className="text-gray-400"> complete</span>
                </div>
            </div>

            <div className="w-full bg-gray-700 rounded-full h-2 mb-6">
                <div 
                    className="bg-purple-600 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${completionPercentage}%` }}
                />
            </div>

            <div className="space-y-3 mb-6">
                {checklistItems.map((item) => (
                    <button
                        key={item.id}
                        onClick={() => toggleItem(item.id)}
                        className={`w-full text-left p-3 rounded-lg border transition-all ${
                            checkedItems.has(item.id)
                                ? 'bg-green-500/20 border-green-500/50'
                                : 'bg-gray-900/50 border-gray-600 hover:bg-gray-800/50'
                        }`}
                        data-testid={`checkbox-${item.id}`}
                    >
                        <div className="flex items-center gap-3">
                            <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                                checkedItems.has(item.id)
                                    ? 'bg-green-500 border-green-500'
                                    : 'border-gray-500'
                            }`}>
                                {checkedItems.has(item.id) && <CheckIcon className="w-3 h-3 text-white" />}
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center gap-2">
                                    <span className={`font-semibold ${checkedItems.has(item.id) ? 'text-green-300' : 'text-white'}`}>
                                        {item.title}
                                    </span>
                                    <span className={`text-xs ${getImportanceColor(item.importance)}`}>
                                        {item.importance}
                                    </span>
                                </div>
                                <p className="text-xs text-gray-400 mt-0.5">{item.description}</p>
                            </div>
                        </div>
                    </button>
                ))}
            </div>

            <div className="border-t border-white/10 pt-6">
                <div className="flex items-center gap-3 mb-4">
                    <DnsIcon className="w-5 h-5 text-purple-400" />
                    <h4 className="font-semibold text-white">DNS Record Generator</h4>
                </div>
                
                <div className="flex gap-2 mb-4">
                    <input
                        type="text"
                        value={domain}
                        onChange={(e) => setDomain(e.target.value)}
                        placeholder="Enter your domain"
                        className="flex-1 bg-gray-900/50 border border-gray-600 rounded-lg px-4 py-2 text-white placeholder-gray-500 input-glow-focus outline-none"
                        data-testid="input-dns-domain"
                    />
                    <button
                        onClick={() => onGenerateDns(domain)}
                        disabled={isGeneratingDns || !domain.trim()}
                        className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg font-semibold text-white transition-colors"
                        data-testid="button-generate-dns"
                    >
                        {isGeneratingDns ? 'Generating...' : 'Generate'}
                    </button>
                </div>

                {dnsRecords && (
                    <div className="space-y-3 animate-fade-in">
                        {['spf', 'dkim', 'dmarc'].map((recordType) => (
                            <div key={recordType} className="bg-gray-900/50 p-3 rounded-lg">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm font-semibold text-purple-300 uppercase">{recordType}</span>
                                    <button
                                        onClick={() => copyToClipboard(dnsRecords[recordType as keyof DnsRecords], recordType)}
                                        className="p-1.5 hover:bg-white/10 rounded transition-colors"
                                    >
                                        {copiedRecord === recordType ? (
                                            <CheckIcon className="w-4 h-4 text-green-400" />
                                        ) : (
                                            <CopyIcon className="w-4 h-4 text-gray-400" />
                                        )}
                                    </button>
                                </div>
                                <code className="text-xs text-gray-300 break-all">
                                    {dnsRecords[recordType as keyof DnsRecords]}
                                </code>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};
