import { useState } from 'react';
import { ListHealthIcon, AlertIcon } from './icons/CategoryIcons';
import type { ListQualityAnalysis } from '../types';

export const ListQualityChecker: React.FC = () => {
    const [emailList, setEmailList] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState<ListQualityAnalysis | null>(null);
    const [error, setError] = useState<string | null>(null);

    const analyzeList = async () => {
        if (!emailList.trim()) return;
        
        setIsLoading(true);
        setError(null);
        
        try {
            const response = await fetch('/api/list/analyze', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sample: emailList.trim() })
            });
            
            if (response.ok) {
                const data = await response.json();
                setResult(data);
            } else {
                setError('Failed to analyze email list. Please try again.');
            }
        } catch (err) {
            setError('Network error. Please check your connection.');
        } finally {
            setIsLoading(false);
        }
    };

    const getPercentageColor = (value: number, threshold: number) => {
        if (value <= threshold) return 'text-green-400';
        if (value <= threshold * 2) return 'text-yellow-400';
        return 'text-red-400';
    };

    return (
        <div className="bg-white/5 p-6 rounded-xl border border-white/10">
            <div className="flex items-center gap-3 mb-4">
                <ListHealthIcon className="w-6 h-6 text-purple-400" />
                <h3 className="text-lg font-bold text-white">List Quality Analyzer</h3>
            </div>
            
            <p className="text-sm text-gray-400 mb-4">
                Paste a sample of your email list (one email per line) to analyze its quality.
            </p>

            <textarea
                value={emailList}
                onChange={(e) => setEmailList(e.target.value)}
                placeholder="john@example.com&#10;jane@company.com&#10;info@business.org"
                className="w-full h-32 bg-gray-900/50 border border-gray-600 rounded-lg p-3 text-white placeholder-gray-500 input-glow-focus outline-none resize-none mb-4"
                data-testid="textarea-email-list"
            />

            <button
                onClick={analyzeList}
                disabled={isLoading || !emailList.trim()}
                className="w-full py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg font-semibold text-white transition-colors mb-4"
                data-testid="button-analyze-list"
            >
                {isLoading ? 'Analyzing...' : 'Analyze List'}
            </button>

            {error && (
                <div className="p-3 bg-red-500/20 border border-red-500 rounded-lg text-red-300 text-sm mb-4">
                    {error}
                </div>
            )}

            {result && (
                <div className="animate-fade-in space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-gray-900/50 p-4 rounded-lg text-center">
                            <div className={`text-2xl font-bold ${getPercentageColor(result.roleBasedAccountPercentage, 5)}`}>
                                {result.roleBasedAccountPercentage.toFixed(1)}%
                            </div>
                            <div className="text-xs text-gray-400 mt-1">Role-Based Accounts</div>
                        </div>
                        <div className="bg-gray-900/50 p-4 rounded-lg text-center">
                            <div className={`text-2xl font-bold ${getPercentageColor(result.freeMailProviderPercentage, 30)}`}>
                                {result.freeMailProviderPercentage.toFixed(1)}%
                            </div>
                            <div className="text-xs text-gray-400 mt-1">Free Mail Providers</div>
                        </div>
                    </div>

                    <div className="flex gap-4">
                        <div className={`flex-1 p-3 rounded-lg text-center ${result.disposableDomainIndicators ? 'bg-red-500/20 border border-red-500' : 'bg-green-500/20 border border-green-500'}`}>
                            <div className={`text-sm font-semibold ${result.disposableDomainIndicators ? 'text-red-300' : 'text-green-300'}`}>
                                {result.disposableDomainIndicators ? 'Disposable Domains Detected' : 'No Disposable Domains'}
                            </div>
                        </div>
                        <div className={`flex-1 p-3 rounded-lg text-center ${result.spamTrapIndicators ? 'bg-red-500/20 border border-red-500' : 'bg-green-500/20 border border-green-500'}`}>
                            <div className={`text-sm font-semibold ${result.spamTrapIndicators ? 'text-red-300' : 'text-green-300'}`}>
                                {result.spamTrapIndicators ? 'Spam Trap Risk' : 'No Spam Trap Indicators'}
                            </div>
                        </div>
                    </div>

                    {(result.disposableDomainIndicators || result.spamTrapIndicators) && (
                        <div className="p-3 bg-yellow-500/20 border border-yellow-500 rounded-lg flex items-start gap-2">
                            <AlertIcon className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                            <p className="text-sm text-yellow-300">
                                Your list may contain risky addresses. Consider cleaning it before sending.
                            </p>
                        </div>
                    )}

                    <div className="p-4 bg-gray-900/50 rounded-lg">
                        <h4 className="font-semibold text-gray-200 mb-2">Analysis Summary</h4>
                        <p className="text-sm text-gray-400">{result.summaryReport}</p>
                    </div>
                </div>
            )}
        </div>
    );
};
