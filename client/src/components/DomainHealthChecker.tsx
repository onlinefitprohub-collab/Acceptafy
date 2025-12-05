import { useState } from 'react';
import { checkDomainHealth } from '../services/geminiService';
import type { DomainHealth } from '../types';
import { GoodStatusIcon, WarningStatusIcon, BadStatusIcon, InfoIcon } from './icons/CategoryIcons';

const formatReport = (report: string | undefined): { introText: string; sections: { label: string; content: string }[] } => {
    if (!report || typeof report !== 'string') {
        return { introText: '', sections: [] };
    }

    const sectionPatterns = [
        { pattern: /SPF\s*\([^)]+\):/gi, label: 'SPF (Sender Policy Framework)' },
        { pattern: /DKIM\s*\([^)]+\):/gi, label: 'DKIM (DomainKeys Identified Mail)' },
        { pattern: /DMARC\s*\([^)]+\):/gi, label: 'DMARC (Domain-based Message Authentication)' },
        { pattern: /Reverse DNS\s*\([^)]*\):/gi, label: 'Reverse DNS (rDNS)' },
        { pattern: /Blacklist Status:/gi, label: 'Blacklist Status' },
        { pattern: /Mail Server Configuration:/gi, label: 'Mail Server Configuration' },
        { pattern: /Content & Engagement:/gi, label: 'Content & Engagement' },
    ];

    let sections: { label: string; content: string }[] = [];
    let remainingText = report;
    let introText = '';

    const firstSectionMatch = remainingText.match(/(?:SPF|DKIM|DMARC|Reverse DNS|Blacklist Status|Mail Server|Content &)/i);
    if (firstSectionMatch && firstSectionMatch.index && firstSectionMatch.index > 0) {
        introText = remainingText.substring(0, firstSectionMatch.index).trim();
        remainingText = remainingText.substring(firstSectionMatch.index);
    }

    for (const { pattern, label } of sectionPatterns) {
        const match = remainingText.match(pattern);
        if (match) {
            const startIndex = remainingText.indexOf(match[0]);
            const afterHeader = startIndex + match[0].length;
            
            let endIndex = remainingText.length;
            for (const { pattern: nextPattern } of sectionPatterns) {
                if (nextPattern === pattern) continue;
                const nextMatch = remainingText.substring(afterHeader).match(nextPattern);
                if (nextMatch && nextMatch.index !== undefined) {
                    const possibleEnd = afterHeader + nextMatch.index;
                    if (possibleEnd < endIndex && possibleEnd > afterHeader) {
                        endIndex = possibleEnd;
                    }
                }
            }
            
            const content = remainingText.substring(afterHeader, endIndex).trim();
            if (content) {
                sections.push({ label, content });
            }
        }
    }

    if (sections.length === 0) {
        return { introText: report, sections: [] };
    }

    return { introText, sections };
};

export const DomainHealthChecker: React.FC = () => {
    const [domain, setDomain] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [result, setResult] = useState<DomainHealth | null>(null);

    const handleCheck = async () => {
        if (!domain.trim()) return;
        setIsLoading(true);
        setError(null);
        setResult(null);
        try {
            const health = await checkDomainHealth(domain.trim());
            setResult(health);
        } catch (err) {
            setError('An error occurred while checking the domain. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const getStatusStyles = (status: DomainHealth['status']) => {
        switch (status) {
            case 'Clean':
                return { icon: <GoodStatusIcon />, text: 'text-green-300', bg: 'bg-green-500/10', border: 'border-green-500/50' };
            case 'Warning':
                return { icon: <WarningStatusIcon />, text: 'text-yellow-300', bg: 'bg-yellow-500/10', border: 'border-yellow-500/50' };
            case 'Blacklisted':
                return { icon: <BadStatusIcon />, text: 'text-red-300', bg: 'bg-red-500/10', border: 'border-red-500/50' };
        }
    };

    const formattedReport = result ? formatReport(result.report) : { introText: '', sections: [] };

    return (
        <div className="space-y-4" data-testid="domain-health-checker">
            <h3 className="text-xl font-bold text-white">Domain Health Scan</h3>
            <p className="text-sm text-gray-400">Enter your sending domain (e.g., yourcompany.com) to simulate a check against major DNS blacklists and assess its reputation.</p>
            
            <div className="flex flex-col sm:flex-row items-center gap-3">
                <input
                    type="text"
                    value={domain}
                    onChange={(e) => setDomain(e.target.value)}
                    placeholder="yourdomain.com"
                    className="bg-gray-900/50 border border-gray-600 text-white text-sm rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 block w-full p-2.5"
                    disabled={isLoading}
                    data-testid="input-domain-health"
                />
                <button
                    onClick={handleCheck}
                    disabled={!domain.trim() || isLoading}
                    className="w-full sm:w-auto px-5 py-2.5 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 disabled:bg-gray-600 transition-colors flex items-center justify-center gap-2"
                    data-testid="button-check-domain"
                >
                    {isLoading && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
                    Scan Domain
                </button>
            </div>
            
            {error && <p className="text-red-400 text-sm" data-testid="text-domain-error">{error}</p>}

            {result && (
                <div className={`mt-4 p-4 rounded-lg border ${getStatusStyles(result.status).bg} ${getStatusStyles(result.status).border} animate-fade-in`} data-testid="domain-health-result">
                    <div className="flex items-center gap-3">
                        <div className="flex-shrink-0">{getStatusStyles(result.status).icon}</div>
                        <h4 className={`text-lg font-bold ${getStatusStyles(result.status).text}`}>{result.status}</h4>
                    </div>
                    
                    {formattedReport.introText && (
                        <p className="text-gray-300 mt-3 text-sm">{formattedReport.introText}</p>
                    )}
                    
                    {formattedReport.sections.length > 0 && (
                        <div className="mt-4 space-y-4">
                            {formattedReport.sections.map((section, index) => (
                                <div key={index} className="border-l-2 border-white/20 pl-3">
                                    <h5 className="font-semibold text-gray-200 text-sm mb-1">{section.label}</h5>
                                    <p className="text-gray-400 text-sm leading-relaxed">{section.content}</p>
                                </div>
                            ))}
                        </div>
                    )}
                    
                    {formattedReport.sections.length === 0 && (
                        <p className="text-gray-300 mt-2 text-sm">{result.report}</p>
                    )}
                    
                    {result.recommendation && (
                         <div className="mt-4 pt-4 border-t border-white/10">
                            <h5 className="font-semibold text-gray-200">Recommendation</h5>
                            <p className="text-gray-300 text-sm mt-1">{result.recommendation}</p>
                        </div>
                    )}
                </div>
            )}

            {!result && !isLoading && (
                 <div className="mt-4 p-4 rounded-lg border border-sky-500/50 bg-sky-500/10 text-sky-200 flex items-start gap-3" data-testid="domain-health-info">
                    <InfoIcon className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    <p className="text-sm">Why is this important? Being on a blacklist is one of the fastest ways to have all your emails land in the spam folder. Regular checks are crucial for maintaining a healthy sender reputation.</p>
                 </div>
            )}

        </div>
    );
};
