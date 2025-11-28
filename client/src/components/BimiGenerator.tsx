import { useState } from 'react';
import { BimiIcon, CopyIcon, CheckIcon, InfoIcon } from './icons/CategoryIcons';
import type { BimiRecord } from '../types';

export const BimiGenerator: React.FC = () => {
    const [domain, setDomain] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState<BimiRecord | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [copiedRecord, setCopiedRecord] = useState(false);

    const generateBimi = async () => {
        if (!domain.trim()) return;
        
        setIsLoading(true);
        setError(null);
        
        try {
            const response = await fetch('/api/bimi/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ domain: domain.trim() })
            });
            
            if (response.ok) {
                const data = await response.json();
                setResult(data);
            } else {
                setError('Failed to generate BIMI record. Please try again.');
            }
        } catch (err) {
            setError('Network error. Please check your connection.');
        } finally {
            setIsLoading(false);
        }
    };

    const copyToClipboard = async (text: string) => {
        await navigator.clipboard.writeText(text);
        setCopiedRecord(true);
        setTimeout(() => setCopiedRecord(false), 2000);
    };

    return (
        <div className="bg-white/5 p-6 rounded-xl border border-white/10">
            <div className="flex items-center gap-3 mb-4">
                <BimiIcon className="w-6 h-6 text-purple-400" />
                <h3 className="text-lg font-bold text-white">BIMI Record Generator</h3>
            </div>
            
            <div className="p-3 bg-purple-900/30 border border-purple-500/50 rounded-lg mb-4 flex items-start gap-2">
                <InfoIcon className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-purple-200">
                    BIMI (Brand Indicators for Message Identification) displays your brand logo next to emails in supported inboxes, increasing trust and recognition.
                </p>
            </div>

            <div className="flex gap-2 mb-4">
                <input
                    type="text"
                    value={domain}
                    onChange={(e) => setDomain(e.target.value)}
                    placeholder="Enter your domain"
                    className="flex-1 bg-gray-900/50 border border-gray-600 rounded-lg px-4 py-2 text-white placeholder-gray-500 input-glow-focus outline-none"
                    data-testid="input-bimi-domain"
                />
                <button
                    onClick={generateBimi}
                    disabled={isLoading || !domain.trim()}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg font-semibold text-white transition-colors"
                    data-testid="button-generate-bimi"
                >
                    {isLoading ? 'Generating...' : 'Generate'}
                </button>
            </div>

            {error && (
                <div className="p-3 bg-red-500/20 border border-red-500 rounded-lg text-red-300 text-sm mb-4">
                    {error}
                </div>
            )}

            {result && (
                <div className="animate-fade-in space-y-4">
                    <div className="bg-gray-900/50 p-4 rounded-lg">
                        <h4 className="font-semibold text-yellow-400 mb-2">Prerequisites</h4>
                        <p className="text-sm text-gray-300">{result.dmarcPrerequisite}</p>
                    </div>

                    <div className="bg-gray-900/50 p-4 rounded-lg">
                        <h4 className="font-semibold text-purple-300 mb-2">Logo Requirements</h4>
                        <p className="text-sm text-gray-300">{result.logoRequirements}</p>
                    </div>

                    <div className="bg-gray-900/50 p-4 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                            <h4 className="font-semibold text-green-400">Your BIMI Record</h4>
                            <button
                                onClick={() => copyToClipboard(result.bimiRecord)}
                                className="p-1.5 hover:bg-white/10 rounded transition-colors flex items-center gap-1"
                            >
                                {copiedRecord ? (
                                    <>
                                        <CheckIcon className="w-4 h-4 text-green-400" />
                                        <span className="text-xs text-green-400">Copied!</span>
                                    </>
                                ) : (
                                    <CopyIcon className="w-4 h-4 text-gray-400" />
                                )}
                            </button>
                        </div>
                        <code className="text-sm text-gray-300 break-all block bg-black/30 p-2 rounded">
                            {result.bimiRecord}
                        </code>
                    </div>

                    <div className="text-xs text-gray-500">
                        Add this TXT record to your domain's DNS settings at: default._bimi.{domain}
                    </div>
                </div>
            )}
        </div>
    );
};
