import { useState, useRef } from 'react';
import { analyzeEmailList } from '../services/geminiService';
import type { ListQualityAnalysis, EmailQualityStatus } from '../types';
import { Download, CheckCircle, XCircle, AlertTriangle, Upload, FileText, HelpCircle } from 'lucide-react';

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
    const [isDragging, setIsDragging] = useState(false);
    const [fileName, setFileName] = useState<string | null>(null);
    const [showInstructions, setShowInstructions] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const parseCSV = (content: string): string[] => {
        const lines = content.split(/\r?\n/).filter(line => line.trim());
        if (lines.length === 0) return [];
        
        const firstLineParts = lines[0].split(/[,;\t]/).map(p => p.trim().replace(/^["']|["']$/g, '').toLowerCase());
        const headerKeywords = ['email', 'e-mail', 'email_address', 'emailaddress', 'mail_address'];
        const hasHeader = firstLineParts.some(part => headerKeywords.includes(part));
        const dataLines = hasHeader ? lines.slice(1) : lines;
        
        const emails: string[] = [];
        for (const line of dataLines) {
            const parts = line.split(/[,;\t]/).map(p => p.trim().replace(/^["']|["']$/g, ''));
            
            for (const part of parts) {
                if (part.includes('@') && part.includes('.')) {
                    emails.push(part);
                    break;
                }
            }
        }
        
        return emails;
    };

    const handleFileUpload = (file: File) => {
        if (!file) return;
        
        const validTypes = ['text/csv', 'application/vnd.ms-excel', 'text/plain'];
        const isValidType = validTypes.includes(file.type) || file.name.endsWith('.csv') || file.name.endsWith('.txt');
        
        if (!isValidType) {
            setError('Please upload a CSV or TXT file');
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            setError('File size must be less than 5MB');
            return;
        }

        setFileName(file.name);
        setError(null);

        const reader = new FileReader();
        reader.onload = (e) => {
            const content = e.target?.result as string;
            const emails = parseCSV(content);
            
            if (emails.length === 0) {
                setError('No valid email addresses found in the file. Check the format instructions.');
                setFileName(null);
                return;
            }
            
            setListSample(emails.join('\n'));
        };
        reader.onerror = () => {
            setError('Failed to read file. Please try again.');
            setFileName(null);
        };
        reader.readAsText(file);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files[0];
        if (file) handleFileUpload(file);
    };

    const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) handleFileUpload(file);
    };

    const downloadTemplate = () => {
        const templateContent = `email,first_name,last_name
john.doe@example.com,John,Doe
jane.smith@company.org,Jane,Smith
sales@business.net,Sales,Team
info@startup.io,Info,Startup`;
        
        const blob = new Blob([templateContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'email_list_template.csv';
        link.click();
    };

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

    const getCleanedEmails = (): EmailQualityStatus[] => {
        if (!result?.emailStatuses) return [];
        return result.emailStatuses.filter(e => 
            e.isValid && 
            !e.isDisposable && 
            !e.isPotentialSpamTrap
        );
    };

    const getBadEmails = (): EmailQualityStatus[] => {
        if (!result?.emailStatuses) return [];
        return result.emailStatuses.filter(e => 
            !e.isValid || 
            e.isDisposable || 
            e.isPotentialSpamTrap
        );
    };

    const exportCleanedCSV = () => {
        const cleanedEmails = getCleanedEmails();
        if (cleanedEmails.length === 0) return;

        const csvContent = "email\n" + cleanedEmails.map(e => e.email).join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `cleaned_emails_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const exportRemovedCSV = () => {
        const badEmails = getBadEmails();
        if (badEmails.length === 0) return;

        const csvContent = "email,reason\n" + badEmails.map(e => `${e.email},"${e.reason || 'Quality issue detected'}"`).join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `removed_emails_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const cleanedCount = getCleanedEmails().length;
    const removedCount = getBadEmails().length;
    const totalCount = result?.emailStatuses?.length || 0;
    
    return (
        <div className="space-y-4" data-testid="list-quality-checker">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-xl font-bold text-white">List Cleaner</h3>
                    <p className="text-sm text-gray-400">Upload a CSV file or paste email addresses to identify and remove problematic contacts.</p>
                </div>
                <button
                    onClick={() => setShowInstructions(!showInstructions)}
                    className="flex items-center gap-2 text-purple-400 hover:text-purple-300 text-sm transition-colors"
                    data-testid="button-toggle-instructions"
                >
                    <HelpCircle className="w-4 h-4" />
                    CSV Format Guide
                </button>
            </div>

            {showInstructions && (
                <div className="p-4 rounded-lg border border-purple-500/30 bg-purple-500/5 animate-fade-in" data-testid="csv-instructions">
                    <h4 className="font-semibold text-purple-300 mb-3 flex items-center gap-2">
                        <FileText className="w-4 h-4" />
                        How to Format Your CSV File
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                            <h5 className="font-medium text-white mb-2">Supported Formats:</h5>
                            <ul className="text-gray-400 space-y-1">
                                <li>CSV files (.csv) with comma, semicolon, or tab separators</li>
                                <li>Plain text files (.txt) with one email per line</li>
                                <li>Header row is optional (will be auto-detected)</li>
                                <li>Email column can be in any position</li>
                            </ul>
                        </div>
                        <div>
                            <h5 className="font-medium text-white mb-2">Example CSV:</h5>
                            <pre className="bg-gray-900/50 p-2 rounded text-gray-300 font-mono text-xs overflow-x-auto">
{`email,first_name,last_name
john@example.com,John,Doe
jane@company.org,Jane,Smith`}
                            </pre>
                            <button
                                onClick={downloadTemplate}
                                className="mt-2 text-purple-400 hover:text-purple-300 text-xs flex items-center gap-1"
                                data-testid="button-download-template"
                            >
                                <Download className="w-3 h-3" />
                                Download Template
                            </button>
                        </div>
                    </div>
                    <div className="mt-3 pt-3 border-t border-purple-500/20">
                        <h5 className="font-medium text-white mb-1">What We Check:</h5>
                        <div className="flex flex-wrap gap-2 text-xs">
                            <span className="px-2 py-1 bg-red-500/20 text-red-300 rounded">Invalid format</span>
                            <span className="px-2 py-1 bg-red-500/20 text-red-300 rounded">Disposable domains</span>
                            <span className="px-2 py-1 bg-red-500/20 text-red-300 rounded">Spam traps</span>
                            <span className="px-2 py-1 bg-yellow-500/20 text-yellow-300 rounded">Role-based (info@, admin@)</span>
                            <span className="px-2 py-1 bg-yellow-500/20 text-yellow-300 rounded">Free providers</span>
                        </div>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="space-y-3">
                    <div
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                        className={`relative border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all
                            ${isDragging 
                                ? 'border-purple-500 bg-purple-500/10' 
                                : 'border-gray-600 hover:border-purple-500/50 hover:bg-gray-800/30'
                            }`}
                        data-testid="dropzone-csv"
                    >
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".csv,.txt"
                            onChange={handleFileInputChange}
                            className="hidden"
                            data-testid="input-file-csv"
                        />
                        <Upload className={`w-8 h-8 mx-auto mb-2 ${isDragging ? 'text-purple-400' : 'text-gray-500'}`} />
                        <p className="text-gray-300 font-medium">
                            {fileName ? fileName : 'Drop your CSV file here'}
                        </p>
                        <p className="text-gray-500 text-sm mt-1">
                            or click to browse (max 5MB)
                        </p>
                        {fileName && (
                            <p className="text-green-400 text-xs mt-2">
                                File loaded - emails extracted below
                            </p>
                        )}
                    </div>

                    <div className="relative">
                        <p className="text-gray-500 text-xs mb-1">Or paste emails directly:</p>
                        <textarea
                            value={listSample}
                            onChange={(e) => { setListSample(e.target.value); setFileName(null); }}
                            placeholder="test@example.com&#10;info@company.com&#10;user@gmail.com"
                            className="bg-gray-900/50 border border-gray-600 text-white text-sm rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 block w-full p-2.5 h-36 resize-none font-mono"
                            disabled={isLoading}
                            data-testid="textarea-email-list"
                        />
                        {listSample && (
                            <span className="absolute top-0 right-0 text-xs text-gray-500">
                                {listSample.split('\n').filter(l => l.trim()).length} emails
                            </span>
                        )}
                    </div>
                </div>

                <div className="flex flex-col gap-3">
                    <button
                        onClick={handleAnalyze}
                        disabled={!listSample.trim() || isLoading}
                        className="w-full px-5 py-3 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 disabled:bg-gray-600 transition-colors flex items-center justify-center gap-2"
                        data-testid="button-analyze-list"
                    >
                        {isLoading ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                Analyzing...
                            </>
                        ) : (
                            <>
                                <CheckCircle className="w-4 h-4" />
                                Analyze & Clean List
                            </>
                        )}
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
                <>
                    <div className="mt-4 p-4 rounded-lg border border-purple-500/50 bg-purple-500/10 animate-fade-in" data-testid="list-quality-result">
                        <h4 className="font-bold text-purple-300">Summary Report</h4>
                        <p className="text-gray-300 text-sm mt-2">{result.summaryReport}</p>
                    </div>

                    {result.emailStatuses && result.emailStatuses.length > 0 && (
                        <div className="mt-4 space-y-4 animate-fade-in">
                            <div className="flex flex-wrap items-center justify-between gap-4">
                                <div className="flex items-center gap-4">
                                    <span className="text-sm text-gray-400">
                                        Total: <span className="text-white font-medium">{totalCount}</span>
                                    </span>
                                    <span className="text-sm text-gray-400">
                                        Clean: <span className="text-green-400 font-medium">{cleanedCount}</span>
                                    </span>
                                    <span className="text-sm text-gray-400">
                                        Removed: <span className="text-red-400 font-medium">{removedCount}</span>
                                    </span>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={exportCleanedCSV}
                                        disabled={cleanedCount === 0}
                                        className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                                        data-testid="button-export-cleaned"
                                    >
                                        <Download className="w-4 h-4" />
                                        Export Cleaned ({cleanedCount})
                                    </button>
                                    <button
                                        onClick={exportRemovedCSV}
                                        disabled={removedCount === 0}
                                        className="px-4 py-2 bg-red-600/80 text-white text-sm font-medium rounded-lg hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                                        data-testid="button-export-removed"
                                    >
                                        <Download className="w-4 h-4" />
                                        Export Removed ({removedCount})
                                    </button>
                                </div>
                            </div>

                            <div className="border border-gray-700 rounded-lg overflow-hidden">
                                <div className="bg-gray-800/50 px-4 py-2 border-b border-gray-700">
                                    <h5 className="text-sm font-medium text-white">Email Quality Details</h5>
                                </div>
                                <div className="max-h-64 overflow-y-auto">
                                    <table className="w-full text-sm">
                                        <thead className="bg-gray-800/30 sticky top-0">
                                            <tr>
                                                <th className="text-left px-4 py-2 text-gray-400 font-medium">Status</th>
                                                <th className="text-left px-4 py-2 text-gray-400 font-medium">Email</th>
                                                <th className="text-left px-4 py-2 text-gray-400 font-medium">Issues</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-700/50">
                                            {result.emailStatuses.map((emailStatus, idx) => {
                                                const isBad = !emailStatus.isValid || emailStatus.isDisposable || emailStatus.isPotentialSpamTrap;
                                                const hasWarning = emailStatus.isRoleBased;
                                                
                                                const issues: string[] = [];
                                                if (!emailStatus.isValid) issues.push('Invalid');
                                                if (emailStatus.isRoleBased) issues.push('Role-based');
                                                if (emailStatus.isFreeProvider) issues.push('Free provider');
                                                if (emailStatus.isDisposable) issues.push('Disposable');
                                                if (emailStatus.isPotentialSpamTrap) issues.push('Spam trap');
                                                
                                                return (
                                                    <tr key={idx} className={isBad ? 'bg-red-500/5' : hasWarning ? 'bg-yellow-500/5' : ''}>
                                                        <td className="px-4 py-2">
                                                            {isBad ? (
                                                                <XCircle className="w-4 h-4 text-red-400" />
                                                            ) : hasWarning ? (
                                                                <AlertTriangle className="w-4 h-4 text-yellow-400" />
                                                            ) : (
                                                                <CheckCircle className="w-4 h-4 text-green-400" />
                                                            )}
                                                        </td>
                                                        <td className="px-4 py-2 text-gray-300 font-mono text-xs">{emailStatus.email}</td>
                                                        <td className="px-4 py-2">
                                                            <div className="flex flex-wrap gap-1">
                                                                {issues.length === 0 ? (
                                                                    <span className="text-green-400 text-xs">Clean</span>
                                                                ) : (
                                                                    issues.map((issue, i) => (
                                                                        <span 
                                                                            key={i} 
                                                                            className={`px-2 py-0.5 rounded text-xs ${
                                                                                issue === 'Invalid' || issue === 'Disposable' || issue === 'Spam trap' 
                                                                                    ? 'bg-red-500/20 text-red-300' 
                                                                                    : 'bg-yellow-500/20 text-yellow-300'
                                                                            }`}
                                                                        >
                                                                            {issue}
                                                                        </span>
                                                                    ))
                                                                )}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};
