import { useState } from 'react';
import { CheckIcon, DnsIcon, InfoIcon, CopyIcon } from './icons/CategoryIcons';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { HelpCircle } from 'lucide-react';
import type { DnsRecords } from '../types';

const ChecklistItem: React.FC<{ title: string, children: React.ReactNode }> = ({ title, children }) => (
    <div className="flex items-start gap-3">
        <div className="w-5 h-5 mt-1 flex-shrink-0 bg-green-500/20 text-green-300 dark:text-green-300 rounded-full flex items-center justify-center">
            <CheckIcon className="w-3 h-3" />
        </div>
        <div>
            <h4 className="font-semibold text-foreground">{title}</h4>
            <p className="text-sm text-muted-foreground">{children}</p>
        </div>
    </div>
);

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

interface RecordDisplayProps {
    label: string;
    value: string;
    hostValue: string;
    hostTooltip: string;
    valueTooltip: string;
}

const RecordDisplay: React.FC<RecordDisplayProps> = ({ label, value, hostValue, hostTooltip, valueTooltip }) => {
    const [isCopied, copy] = useCopyToClipboard();
    const [isHostCopied, copyHost] = useCopyToClipboard();
    
    return (
        <div className="space-y-2">
            <div className="flex items-center gap-2">
                <h5 className="text-sm font-semibold text-foreground">{label} Record</h5>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <button 
                            className="text-muted-foreground hover:text-foreground transition-colors" 
                            data-testid={`tooltip-${label.toLowerCase()}-info`}
                            aria-label={`Learn more about ${label} record`}
                        >
                            <HelpCircle className="w-4 h-4" />
                        </button>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                        <p>{valueTooltip}</p>
                    </TooltipContent>
                </Tooltip>
            </div>
            
            <div className="flex items-center gap-2 flex-wrap">
                <div className="flex items-center gap-1">
                    <span className="text-xs font-medium text-muted-foreground">Host:</span>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <button 
                                className="text-muted-foreground hover:text-foreground transition-colors" 
                                data-testid={`tooltip-${label.toLowerCase()}-host`}
                                aria-label={`Help for ${label} host field`}
                            >
                                <HelpCircle className="w-3 h-3" />
                            </button>
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs">
                            <p>{hostTooltip}</p>
                        </TooltipContent>
                    </Tooltip>
                </div>
                <code className="px-2 py-1 bg-muted text-foreground text-xs rounded border border-border font-mono">
                    {hostValue}
                </code>
                <button 
                    onClick={() => copyHost(hostValue)}
                    className={`flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-md transition-colors ${isHostCopied ? 'bg-green-500/20 text-green-600 dark:text-green-300' : 'bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground'}`}
                    data-testid={`button-copy-${label.toLowerCase()}-host`}
                    aria-label={`Copy ${label} host value`}
                >
                    {isHostCopied ? <CheckIcon className="w-3 h-3" /> : <CopyIcon className="w-3 h-3" />}
                    <span>{isHostCopied ? 'Copied' : 'Copy'}</span>
                </button>
            </div>
            
            <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-muted-foreground shrink-0">Value:</span>
                <div className="flex-1 flex items-center gap-2 min-w-0">
                    <pre className="flex-1 p-2 bg-muted text-foreground rounded border border-border text-xs overflow-x-auto font-mono">
                        <code>{value}</code>
                    </pre>
                    <button 
                        onClick={() => copy(value)}
                        className={`flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-md transition-colors shrink-0 ${isCopied ? 'bg-green-500/20 text-green-600 dark:text-green-300' : 'bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground'}`}
                        data-testid={`button-copy-${label.toLowerCase()}`}
                    >
                        {isCopied ? <CheckIcon className="w-3 h-3" /> : <CopyIcon className="w-3 h-3" />}
                        <span>{isCopied ? 'Copied' : 'Copy'}</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export const DeliverabilityChecklist: React.FC = () => {
    const [domain, setDomain] = useState('');
    const [isGeneratingDns, setIsGeneratingDns] = useState(false);
    const [dnsRecords, setDnsRecords] = useState<DnsRecords | null>(null);

    const onGenerateDns = async (domainName: string) => {
        setIsGeneratingDns(true);
        try {
            const response = await fetch('/api/dns/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ domain: domainName })
            });
            if (response.ok) {
                const data = await response.json();
                setDnsRecords(data);
            }
        } catch (error) {
            console.error('Failed to generate DNS records:', error);
        } finally {
            setIsGeneratingDns(false);
        }
    };

    const handleGenerateClick = () => {
        if (domain.trim()) {
            onGenerateDns(domain.trim());
        }
    };
    
    return (
        <div className="space-y-6" data-testid="deliverability-checklist">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <ChecklistItem title="Use a Custom Domain">
                    Sending from a professional email address (e.g., `you@yourdomain.com`) drastically improves trust and deliverability over free providers like Gmail or Yahoo.
                </ChecklistItem>
                <ChecklistItem title="Warm Up Your Domain">
                    If your domain is new, start by sending emails to a small, engaged group. Gradually increase volume to build a positive sender reputation with inbox providers.
                </ChecklistItem>
                <ChecklistItem title="Maintain List Health">
                    Never use purchased lists. Regularly clean your subscriber list by removing users who haven't engaged with your emails in the last 90-120 days.
                </ChecklistItem>
            </div>
            
            <div className="p-4 bg-card rounded-lg border border-border">
                <div className="flex items-center gap-3 mb-4">
                    <span className="text-purple-500 dark:text-purple-400"><DnsIcon /></span>
                    <h4 className="text-lg font-semibold text-foreground">Authentication (SPF, DKIM, DMARC)</h4>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                    These DNS records are like a digital passport for your emails, proving to inbox providers that you are a legitimate sender. This is the single most important technical step for deliverability.
                </p>

                <div className="flex flex-col sm:flex-row items-center gap-3">
                    <input
                        type="text"
                        value={domain}
                        onChange={(e) => setDomain(e.target.value)}
                        placeholder="Enter your domain (e.g., yourcompany.com)"
                        className="bg-muted border border-border text-foreground text-sm rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 block w-full p-2.5"
                        disabled={isGeneratingDns}
                        data-testid="input-dns-domain"
                    />
                    <button
                        onClick={handleGenerateClick}
                        disabled={!domain.trim() || isGeneratingDns}
                        className="w-full sm:w-auto px-5 py-2.5 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 disabled:bg-muted disabled:text-muted-foreground transition-colors flex items-center justify-center gap-2"
                        data-testid="button-generate-dns"
                    >
                        {isGeneratingDns && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
                        Generate Records
                    </button>
                </div>
                
                {dnsRecords && (
                    <div className="mt-4 pt-4 border-t border-border space-y-4 animate-fade-in" data-testid="dns-records-display">
                        <div className="flex items-start gap-2 p-3 rounded-md bg-purple-100 dark:bg-purple-900/30 border border-purple-300 dark:border-purple-500/50 text-purple-800 dark:text-purple-200 text-xs">
                            <InfoIcon className="w-4 h-4 flex-shrink-0 mt-px" />
                            <span>Copy these values and add them as TXT records in your domain provider's (e.g., GoDaddy, Namecheap) DNS settings. Each record needs both a Host/Name and a Value.</span>
                        </div>
                        
                        <RecordDisplay 
                            label="SPF" 
                            value={dnsRecords.spf}
                            hostValue="@"
                            hostTooltip="In most DNS providers like Namecheap or GoDaddy, enter '@' in the Host or Name field. This represents your root domain. Some providers may require you to leave it blank or enter your full domain name."
                            valueTooltip="SPF (Sender Policy Framework) tells email servers which mail servers are authorized to send emails for your domain. Paste this entire value in the Value or Content field."
                        />
                        
                        <RecordDisplay 
                            label="DKIM" 
                            value={dnsRecords.dkim}
                            hostValue="default._domainkey"
                            hostTooltip="Enter 'default._domainkey' in the Host/Name field. Note: Your email service provider (like SendGrid, Mailchimp, or Mailgun) may give you a different selector name to use instead of 'default'."
                            valueTooltip="DKIM (DomainKeys Identified Mail) adds a digital signature to your emails. Important: The public key value shown here is a placeholder. You must get your actual DKIM public key from your email service provider (SendGrid, Mailchimp, Mailgun, etc.) in their domain authentication settings."
                        />
                        
                        <div className="p-3 rounded-md bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-500/40 text-amber-800 dark:text-amber-200 text-xs">
                            <div className="flex items-start gap-2">
                                <HelpCircle className="w-4 h-4 flex-shrink-0 mt-px" />
                                <div>
                                    <p className="font-semibold mb-1">Where do I get my DKIM public key?</p>
                                    <p>Your email service provider generates this for you. Log into your email platform (SendGrid, Mailchimp, Mailgun, Amazon SES, etc.) and look for "Domain Authentication" or "Sender Authentication" in settings. They will provide the exact DKIM record to add.</p>
                                </div>
                            </div>
                        </div>
                        
                        <RecordDisplay 
                            label="DMARC" 
                            value={dnsRecords.dmarc}
                            hostValue="_dmarc"
                            hostTooltip="Enter '_dmarc' in the Host/Name field. This is the standard subdomain for DMARC records and should be the same across all DNS providers."
                            valueTooltip="DMARC (Domain-based Message Authentication) tells receiving servers what to do with emails that fail SPF or DKIM checks. The 'rua' email address will receive reports about your email authentication."
                        />
                    </div>
                )}
            </div>
        </div>
    );
};
