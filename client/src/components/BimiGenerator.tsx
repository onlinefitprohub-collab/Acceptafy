import { useState } from 'react';
import { generateBimiRecord } from '../services/geminiService';
import type { BimiRecord } from '../types';
import { BimiIcon, InfoIcon, CopyIcon, CheckIcon } from './icons/CategoryIcons';

const useCopyToClipboard = (): [boolean, (text: string) => void] => {
    const [isCopied, setIsCopied] = useState(false);
    const copy = (text: string) => {
        navigator.clipboard.writeText(text).then(() => {
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000);
        });
    };
    return [isCopied, copy];
};

export const BimiGenerator: React.FC = () => {
    const [domain, setDomain] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [result, setResult] = useState<BimiRecord | null>(null);
    const [isCopied, copy] = useCopyToClipboard();

    const handleGenerate = async () => {
        if (!domain.trim()) return;
        setIsLoading(true);
        setError(null);
        setResult(null);
        try {
            const record = await generateBimiRecord(domain.trim());
            setResult(record);
        } catch (err) {
            setError('An error occurred while generating the BIMI record.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="p-4 bg-white/5 rounded-lg border border-white/10" data-testid="bimi-generator">
            <div className="flex items-center gap-3 mb-4">
                <span className="text-purple-400"><BimiIcon /></span>
                <h4 className="text-lg font-semibold text-white">BIMI Record Generator</h4>
            </div>
            <p className="text-sm text-gray-400 mb-4">
                BIMI is an advanced standard that allows your logo to appear next to your email in the inbox, acting as a powerful visual trust signal.
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-3">
                <input
                    type="text"
                    value={domain}
                    onChange={(e) => setDomain(e.target.value)}
                    placeholder="Enter your domain (e.g., yourcompany.com)"
                    className="bg-card border border-input text-foreground text-sm rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 block w-full p-2.5"
                    disabled={isLoading}
                    data-testid="input-bimi-domain"
                />
                <button
                    onClick={handleGenerate}
                    disabled={!domain.trim() || isLoading}
                    className="w-full sm:w-auto px-5 py-2.5 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 disabled:bg-gray-600 transition-colors flex items-center justify-center gap-2"
                    data-testid="button-generate-bimi"
                >
                    {isLoading && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
                    Generate BIMI Info
                </button>
            </div>

            {error && <p className="text-red-400 text-sm mt-2" data-testid="text-bimi-error">{error}</p>}

            {result && (
                <div className="mt-4 pt-4 border-t border-white/10 space-y-4 animate-fade-in" data-testid="bimi-result">
                    <div className="flex items-start gap-3 p-3 rounded-md bg-yellow-500/10 border border-yellow-500/50 text-yellow-200">
                        <InfoIcon className="w-5 h-5 flex-shrink-0 mt-0.5" />
                        <div>
                            <h5 className="font-bold">Prerequisite: DMARC Enforcement</h5>
                            <p className="text-xs">{result.dmarcPrerequisite}</p>
                        </div>
                    </div>
                     <div className="flex items-start gap-3 p-3 rounded-md bg-sky-500/10 border border-sky-500/50 text-sky-200">
                        <InfoIcon className="w-5 h-5 flex-shrink-0 mt-0.5" />
                         <div>
                            <h5 className="font-bold">Logo Requirement</h5>
                            <p className="text-xs">{result.logoRequirements}</p>
                        </div>
                    </div>
                    <div>
                        <h5 className="text-sm font-semibold text-muted-foreground">Generated TXT Record for `default._bimi.{domain}`</h5>
                        <div className="flex items-center gap-2 mt-1">
                            <pre className="flex-1 p-2 bg-muted/50 rounded text-xs text-muted-foreground overflow-x-auto">
                                <code>{result.bimiRecord}</code>
                            </pre>
                            <button 
                                onClick={() => copy(result.bimiRecord)}
                                className={`flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-md transition-colors ${isCopied ? 'bg-green-500/20 text-green-300' : 'bg-white/10 text-gray-300 hover:bg-white/20'}`}
                                data-testid="button-copy-bimi"
                            >
                                {isCopied ? <CheckIcon className="w-3 h-3" /> : <CopyIcon className="w-3 h-3" />}
                                <span>{isCopied ? 'Copied' : 'Copy'}</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
