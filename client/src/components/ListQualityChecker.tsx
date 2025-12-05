import { useState } from 'react';
import { analyzeEmailList } from '../services/geminiService';
import type { ListQualityAnalysis } from '../types';

const StatCard: React.FC<{ label: string, value: string, good?: boolean }> = ({ label, value, good }) => (
    <div className="bg-gray-900/50 p-3 rounded-lg text-center">
        <p className="text-xs text-gray-400 uppercase tracking-wider">{label}</p>
        <p className={`text-xl font-bold ${good ? 'text-green-400' : 'text-yellow-400'}`}>{value}</p>
    </div>
);

export const ListQualityChecker: React.FC = () => {
    const [listSample, setListSample] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [result, setResult] = useState<ListQualityAnalysis | null>(null);

    const handleAnalyze = async () => {
        if (!listSample.trim()) return;
        setIsLoading(true);
        setError(null);
        setResult(null);
        try {
            const analysis = await analyzeEmailList(listSample.trim());
            setResult(analysis);
        } catch (err) {
            setError('An error occurred while analyzing the list. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };
    
    return (
        <div className="space-y-4" data-testid="list-quality-checker">
            <h3 className="text-xl font-bold text-white">List Quality Analyzer</h3>
            <p className="text-sm text-gray-400">Paste a sample of your email list (one address per line, up to 100) to check for common quality issues that can harm deliverability.</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <textarea
                    value={listSample}
                    onChange={(e) => setListSample(e.target.value)}
                    placeholder="test@example.com&#10;info@company.com&#10;user@gmail.com"
                    className="bg-gray-900/50 border border-gray-600 text-white text-sm rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 block w-full p-2.5 h-48 resize-none font-mono"
                    disabled={isLoading}
                    rows={10}
                    data-testid="textarea-email-list"
                />
                <div className="flex flex-col">
                    <button
                        onClick={handleAnalyze}
                        disabled={!listSample.trim() || isLoading}
                        className="w-full px-5 py-2.5 mb-4 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 disabled:bg-gray-600 transition-colors flex items-center justify-center gap-2"
                        data-testid="button-analyze-list"
                    >
                        {isLoading && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
                        Analyze List Sample
                    </button>
                    {result && !isLoading && (
                        <div className="grid grid-cols-2 gap-3 animate-fade-in">
                            <StatCard label="Role-Based" value={`${result.roleBasedAccountPercentage}%`} />
                            <StatCard label="Free Provider" value={`${result.freeMailProviderPercentage}%`} />
                            <StatCard label="Disposable" value={result.disposableDomainIndicators ? 'Yes' : 'No'} good={!result.disposableDomainIndicators} />
                            <StatCard label="Spam Traps" value={result.spamTrapIndicators ? 'Yes' : 'No'} good={!result.spamTrapIndicators} />
                        </div>
                    )}
                </div>
            </div>
            
            {error && <p className="text-red-400 text-sm" data-testid="text-list-error">{error}</p>}

            {result && (
                <div className="mt-4 p-4 rounded-lg border border-purple-500/50 bg-purple-500/10 animate-fade-in" data-testid="list-quality-result">
                    <h4 className="font-bold text-purple-300">AI Summary Report</h4>
                    <p className="text-gray-300 text-sm mt-2">{result.summaryReport}</p>
                </div>
            )}
        </div>
    );
};
