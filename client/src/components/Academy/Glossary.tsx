import { useState } from 'react';
import { SearchIcon } from '../icons/CategoryIcons';
import { explainTerm } from '../../services/geminiService';
import type { GlossaryTerm } from '../../types';

export const Glossary: React.FC = () => {
    const [term, setTerm] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [result, setResult] = useState<GlossaryTerm | null>(null);

    const handleSearch = async () => {
        if (!term.trim()) return;
        setIsLoading(true);
        setError(null);
        setResult(null);
        try {
            const explanation = await explainTerm(term.trim());
            setResult(explanation);
        } catch (err) {
            setError('Could not explain this term. Please try another one.');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        handleSearch();
    };

    return (
        <div className="animate-fade-in">
            <h3 className="text-2xl font-bold text-purple-600 dark:text-purple-300 mb-2">AI-Powered Glossary</h3>
            <p className="text-muted-foreground mb-6">Confused by email jargon? Type any term below and get a simple explanation.</p>

            <form onSubmit={handleSubmit} className="flex items-center gap-3 mb-8">
                <input
                    type="text"
                    value={term}
                    onChange={(e) => setTerm(e.target.value)}
                    placeholder="e.g., Sender Reputation, Hard Bounce..."
                    className="flex-grow bg-card border border-input text-foreground text-sm rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 block w-full p-2.5"
                    disabled={isLoading}
                    data-testid="input-glossary-search"
                />
                <button
                    type="submit"
                    disabled={!term.trim() || isLoading}
                    className="px-5 py-2.5 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 disabled:bg-gray-600 transition-colors flex items-center justify-center gap-2"
                    data-testid="button-explain-term"
                >
                    {isLoading ? (
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                        <SearchIcon className="w-5 h-5" />
                    )}
                    <span>Explain</span>
                </button>
            </form>

            {isLoading && (
                <div className="text-center text-muted-foreground">
                    <p>Thinking...</p>
                </div>
            )}
            
            {error && <p className="text-center text-red-400" data-testid="text-glossary-error">{error}</p>}
            
            {result && (
                <div className="space-y-6 bg-muted/50 p-4 sm:p-6 rounded-lg border border-border animate-fade-in" data-testid="glossary-result">
                    <div>
                        <h4 className="font-bold text-lg text-foreground mb-1">Simple Definition</h4>
                        <p className="text-muted-foreground">{result.simpleDefinition}</p>
                    </div>
                    <div className="border-t border-border pt-4">
                        <h4 className="font-bold text-lg text-foreground mb-1">Detailed Explanation</h4>
                        <p className="text-muted-foreground leading-relaxed text-sm">{result.detailedExplanation}</p>
                    </div>
                     <div className="border-t border-border pt-4">
                        <h4 className="font-bold text-lg text-foreground mb-1">Why It Matters (Practical Example)</h4>
                        <p className="text-muted-foreground leading-relaxed text-sm">{result.practicalExample}</p>
                    </div>
                </div>
            )}
        </div>
    );
};
