import { useState } from 'react';
import { DomainHealthIcon, CheckIcon, AlertIcon, CloseIcon } from './icons/CategoryIcons';
import type { DomainHealth } from '../types';

export const DomainHealthChecker: React.FC = () => {
    const [domain, setDomain] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState<DomainHealth | null>(null);
    const [error, setError] = useState<string | null>(null);

    const checkDomain = async () => {
        if (!domain.trim()) return;
        
        setIsLoading(true);
        setError(null);
        
        try {
            const response = await fetch('/api/domain/health', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ domain: domain.trim() })
            });
            
            if (response.ok) {
                const data = await response.json();
                setResult(data);
            } else {
                setError('Failed to check domain health. Please try again.');
            }
        } catch (err) {
            setError('Network error. Please check your connection.');
        } finally {
            setIsLoading(false);
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'Clean': return <CheckIcon className="w-6 h-6 text-green-400" />;
            case 'Warning': return <AlertIcon className="w-6 h-6 text-yellow-400" />;
            case 'Blacklisted': return <CloseIcon className="w-6 h-6 text-red-400" />;
            default: return null;
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Clean': return 'bg-green-500/20 border-green-500 text-green-300';
            case 'Warning': return 'bg-yellow-500/20 border-yellow-500 text-yellow-300';
            case 'Blacklisted': return 'bg-red-500/20 border-red-500 text-red-300';
            default: return 'bg-gray-500/20 border-gray-500 text-gray-300';
        }
    };

    return (
        <div className="bg-white/5 p-6 rounded-xl border border-white/10">
            <div className="flex items-center gap-3 mb-4">
                <DomainHealthIcon className="w-6 h-6 text-purple-400" />
                <h3 className="text-lg font-bold text-white">Domain Health Checker</h3>
            </div>
            
            <p className="text-sm text-gray-400 mb-4">
                Check if your sending domain is on any blacklists and get reputation insights.
            </p>

            <div className="flex gap-2 mb-4">
                <input
                    type="text"
                    value={domain}
                    onChange={(e) => setDomain(e.target.value)}
                    placeholder="Enter your domain (e.g., example.com)"
                    className="flex-1 bg-gray-900/50 border border-gray-600 rounded-lg px-4 py-2 text-white placeholder-gray-500 input-glow-focus outline-none"
                    data-testid="input-domain-health"
                />
                <button
                    onClick={checkDomain}
                    disabled={isLoading || !domain.trim()}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg font-semibold text-white transition-colors"
                    data-testid="button-check-domain"
                >
                    {isLoading ? 'Checking...' : 'Check'}
                </button>
            </div>

            {error && (
                <div className="p-3 bg-red-500/20 border border-red-500 rounded-lg text-red-300 text-sm mb-4">
                    {error}
                </div>
            )}

            {result && (
                <div className="animate-fade-in space-y-4">
                    <div className={`p-4 rounded-lg border ${getStatusColor(result.status)}`}>
                        <div className="flex items-center gap-3 mb-2">
                            {getStatusIcon(result.status)}
                            <span className="text-xl font-bold">{result.status}</span>
                        </div>
                        <p className="text-sm opacity-90">{result.report}</p>
                    </div>
                    
                    {result.recommendation && (
                        <div className="p-4 bg-purple-900/30 border border-purple-500/50 rounded-lg">
                            <h4 className="font-semibold text-purple-300 mb-2">Recommendation</h4>
                            <p className="text-sm text-gray-300">{result.recommendation}</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
