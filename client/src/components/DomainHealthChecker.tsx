import React, { useState, useEffect } from 'react';
import { checkDomainHealth } from '../services/geminiService';
import type { DomainHealth } from '../types';
import { GoodStatusIcon, WarningStatusIcon, BadStatusIcon, InfoIcon } from './icons/CategoryIcons';

// ── helpers ──────────────────────────────────────────────────────────────────

const sectionHeaders = [
  { key: 'SPF',                      label: 'SPF (Sender Policy Framework)' },
  { key: 'DKIM',                     label: 'DKIM (DomainKeys Identified Mail)' },
  { key: 'DMARC',                    label: 'DMARC (Domain-based Message Authentication)' },
  { key: 'Reverse DNS',              label: 'Reverse DNS (rDNS)' },
  { key: 'Blacklist Status',         label: 'Blacklist Status' },
  { key: 'Mail Server Configuration',label: 'Mail Server Configuration' },
  { key: 'Content & Engagement',     label: 'Content & Engagement' },
];

function formatTextWithSections(text: string | undefined): { introText: string; sections: { label: string; content: string }[] } {
  if (!text || typeof text !== 'string') return { introText: '', sections: [] };

  const sections: { label: string; content: string }[] = [];
  let introText = '';
  let workingText = text;

  const numberedPattern = /\d+\.\s*\*\*([^*]+)\*\*:?\s*/g;
  const hasNumberedFormat = numberedPattern.test(workingText);

  if (hasNumberedFormat) {
    workingText = text;
    const matches: { index: number; label: string; fullMatch: string }[] = [];
    const regex = /\d+\.\s*\*\*([^*]+)\*\*:?\s*/g;
    let match;
    while ((match = regex.exec(workingText)) !== null) {
      matches.push({ index: match.index, label: match[1].trim(), fullMatch: match[0] });
    }
    if (matches.length > 0 && matches[0].index > 0) {
      introText = workingText.substring(0, matches[0].index).trim();
    }
    for (let i = 0; i < matches.length; i++) {
      const startPos = matches[i].index + matches[i].fullMatch.length;
      const endPos = i + 1 < matches.length ? matches[i + 1].index : workingText.length;
      const content = workingText.substring(startPos, endPos).trim();
      if (content) sections.push({ label: matches[i].label, content });
    }
    if (sections.length > 0) return { introText, sections };
  }

  const firstMatch = workingText.match(/(?:SPF|DKIM|DMARC|Reverse DNS|Blacklist Status|Mail Server|Content &)/i);
  if (firstMatch?.index && firstMatch.index > 0) {
    introText = workingText.substring(0, firstMatch.index).trim();
  }

  for (const { key, label } of sectionHeaders) {
    const regex = new RegExp(`${key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*(?:\\([^)]*\\))?\\s*:`, 'i');
    const match = workingText.match(regex);
    if (match?.index !== undefined) {
      const startPos = match.index + match[0].length;
      let endPos = workingText.length;
      for (const { key: nextKey } of sectionHeaders) {
        if (nextKey === key) continue;
        const nextRegex = new RegExp(`${nextKey.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*(?:\\([^)]*\\))?\\s*:`, 'i');
        const nextMatch = workingText.substring(startPos).match(nextRegex);
        if (nextMatch?.index !== undefined) {
          const possibleEnd = startPos + nextMatch.index;
          if (possibleEnd < endPos) endPos = possibleEnd;
        }
      }
      const content = workingText.substring(startPos, endPos).trim();
      if (content) sections.push({ label, content });
    }
  }

  return sections.length === 0 ? { introText: text, sections: [] } : { introText, sections };
}

// ── Google Postmaster types ───────────────────────────────────────────────────

interface PostmasterStatus {
  connected: boolean;
  accountEmail: string | null;
  domains: string[];
}

interface PostmasterReputation {
  domainReputation: 'HIGH' | 'MEDIUM' | 'LOW' | 'BAD' | null;
  userReportedSpamRatio: number | null;
  spfSuccessRatio: number | null;
  dkimSuccessRatio: number | null;
  dmarcSuccessRatio: number | null;
  dataPoints: number;
  periodStart: string;
  periodEnd: string;
  verifiedDomain: boolean;
}

const REP_COLORS: Record<string, { badge: string; label: string }> = {
  HIGH:   { badge: 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-300',   label: 'High' },
  MEDIUM: { badge: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-300', label: 'Medium' },
  LOW:    { badge: 'bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-300', label: 'Low' },
  BAD:    { badge: 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300',           label: 'Bad' },
};

function pct(ratio: number | null): string {
  if (ratio == null) return 'N/A';
  return `${(ratio * 100).toFixed(1)}%`;
}

// ── component ─────────────────────────────────────────────────────────────────

export const DomainHealthChecker: React.FC = () => {
  const [domain, setDomain]       = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError]         = useState<string | null>(null);
  const [result, setResult]       = useState<DomainHealth | null>(null);

  // Google Postmaster state
  const [pmStatus, setPmStatus]               = useState<PostmasterStatus | null>(null);
  const [pmStatusLoading, setPmStatusLoading] = useState(true);
  const [pmReputation, setPmReputation]       = useState<PostmasterReputation | null>(null);
  const [pmRepLoading, setPmRepLoading]       = useState(false);
  const [pmRepError, setPmRepError]           = useState<string | null>(null);
  const [isConnecting, setIsConnecting]       = useState(false);

  // Fetch Google Postmaster connection status on mount
  useEffect(() => {
    fetch('/api/google-postmaster/status', { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : null))
      .then((data: PostmasterStatus | null) => setPmStatus(data))
      .catch(() => setPmStatus(null))
      .finally(() => setPmStatusLoading(false));
  }, []);

  const handleConnect = async () => {
    setIsConnecting(true);
    try {
      const r = await fetch('/api/google-postmaster/auth', { credentials: 'include' });
      const data = await r.json();
      if (data.error) { setIsConnecting(false); return; }
      window.location.href = data.url;
    } catch {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    await fetch('/api/google-postmaster/disconnect', { method: 'DELETE', credentials: 'include' });
    setPmStatus({ connected: false, accountEmail: null, domains: [] });
    setPmReputation(null);
  };

  const handleCheck = async () => {
    if (!domain.trim()) return;
    setIsLoading(true);
    setError(null);
    setResult(null);
    setPmReputation(null);
    setPmRepError(null);

    // Run AI analysis
    try {
      const health = await checkDomainHealth(domain.trim());
      setResult(health);
    } catch {
      setError('An error occurred while checking the domain. Please try again.');
    } finally {
      setIsLoading(false);
    }

    // If Google Postmaster is connected, fetch real reputation in parallel
    if (pmStatus?.connected) {
      setPmRepLoading(true);
      try {
        const r = await fetch(`/api/google-postmaster/reputation/${encodeURIComponent(domain.trim())}`, {
          credentials: 'include',
        });
        const data: PostmasterReputation = await r.json();
        if (r.ok) {
          setPmReputation(data);
        } else {
          setPmRepError((data as any).error ?? 'Could not fetch Postmaster data');
        }
      } catch {
        setPmRepError('Could not fetch Postmaster data');
      } finally {
        setPmRepLoading(false);
      }
    }
  };

  const getStatusStyles = (status: DomainHealth['status'] | undefined) => {
    switch (status) {
      case 'Clean':
        return { icon: <GoodStatusIcon />, text: 'text-green-700 dark:text-green-300', bg: 'bg-green-100 dark:bg-green-500/10', border: 'border-green-300 dark:border-green-500/50' };
      case 'Warning':
        return { icon: <WarningStatusIcon />, text: 'text-yellow-700 dark:text-yellow-300', bg: 'bg-yellow-100 dark:bg-yellow-500/10', border: 'border-yellow-300 dark:border-yellow-500/50' };
      case 'Blacklisted':
        return { icon: <BadStatusIcon />, text: 'text-red-700 dark:text-red-300', bg: 'bg-red-100 dark:bg-red-500/10', border: 'border-red-300 dark:border-red-500/50' };
      default:
        return { icon: <InfoIcon className="w-6 h-6 text-muted-foreground" />, text: 'text-muted-foreground', bg: 'bg-muted', border: 'border-border' };
    }
  };

  const formattedReport          = result ? formatTextWithSections(result.report) : { introText: '', sections: [] };
  const formattedRecommendation  = result ? formatTextWithSections(result.recommendation) : { introText: '', sections: [] };

  return (
    <div className="space-y-4" data-testid="domain-health-checker">
      <h3 className="text-xl font-bold text-foreground">Domain Health Scan</h3>
      <p className="text-sm text-muted-foreground">
        Enter your sending domain to check DNS blacklists and assess sender reputation.
      </p>

      {/* ── Google Postmaster connection banner ───────────────────────────── */}
      {!pmStatusLoading && (
        pmStatus?.connected ? (
          <div className="flex items-center justify-between p-3 rounded-lg border border-green-500/30 bg-green-500/5">
            <div className="flex items-center gap-2">
              <svg viewBox="0 0 24 24" className="w-5 h-5 flex-shrink-0" aria-hidden="true">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              <div>
                <span className="text-sm font-medium text-green-700 dark:text-green-300">
                  Google Postmaster connected
                </span>
                {pmStatus.accountEmail && (
                  <span className="text-xs text-muted-foreground ml-1.5">— {pmStatus.accountEmail}</span>
                )}
                {pmStatus.domains.length > 0 && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Verified domains: {pmStatus.domains.join(', ')}
                  </p>
                )}
              </div>
            </div>
            <button
              onClick={handleDisconnect}
              className="text-xs text-muted-foreground hover:text-foreground underline ml-4 flex-shrink-0"
            >
              Disconnect
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between p-3 rounded-lg border border-blue-500/30 bg-blue-500/5">
            <div className="flex items-center gap-2">
              <svg viewBox="0 0 24 24" className="w-5 h-5 flex-shrink-0 opacity-80" aria-hidden="true">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                Connect Google Postmaster Tools to see <strong>real</strong> domain reputation from Gmail's perspective.
              </p>
            </div>
            <button
              onClick={handleConnect}
              disabled={isConnecting}
              className="ml-4 flex-shrink-0 px-3 py-1.5 text-xs font-semibold rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60 transition-colors"
            >
              {isConnecting ? 'Redirecting…' : 'Connect'}
            </button>
          </div>
        )
      )}

      {/* ── Domain input ──────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <input
          type="text"
          value={domain}
          onChange={(e) => setDomain(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleCheck()}
          placeholder="yourdomain.com"
          className="bg-background border border-border text-foreground text-sm rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 block w-full p-2.5 placeholder:text-muted-foreground"
          disabled={isLoading}
          data-testid="input-domain-health"
        />
        <button
          onClick={handleCheck}
          disabled={!domain.trim() || isLoading}
          className="w-full sm:w-auto px-5 py-2.5 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 disabled:bg-gray-600 transition-colors flex items-center justify-center gap-2"
          data-testid="button-check-domain"
        >
          {isLoading && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
          Scan Domain
        </button>
      </div>

      {error && <p className="text-red-400 text-sm" data-testid="text-domain-error">{error}</p>}

      {/* ── Google Postmaster real data panel ────────────────────────────── */}
      {pmStatus?.connected && (result || pmRepLoading) && (
        <div className="rounded-lg border border-blue-500/30 bg-blue-500/5 overflow-hidden" data-testid="postmaster-reputation-panel">
          <div className="flex items-center gap-2 px-4 py-2.5 border-b border-blue-500/20 bg-blue-500/10">
            <svg viewBox="0 0 24 24" className="w-4 h-4 flex-shrink-0" aria-hidden="true">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            <span className="text-sm font-semibold text-blue-700 dark:text-blue-300">
              Google Postmaster Tools — Live Data
            </span>
          </div>

          <div className="p-4">
            {pmRepLoading && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                Fetching real reputation data from Google…
              </div>
            )}

            {!pmRepLoading && pmRepError && (
              <p className="text-sm text-muted-foreground">{pmRepError}</p>
            )}

            {!pmRepLoading && pmReputation && !pmReputation.verifiedDomain && (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  <strong>{domain}</strong> is not verified in your Google Postmaster account, or your send volume to Gmail is too low for data to appear (Google requires ~100 emails/day).
                </p>
                <div className="rounded-lg border border-border bg-muted/30 p-3 space-y-2">
                  <p className="text-xs font-medium text-foreground">How to verify your domain in Postmaster Tools:</p>
                  <ol className="text-xs text-muted-foreground space-y-1 list-decimal list-inside">
                    <li>Go to <a href="https://postmaster.google.com" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">postmaster.google.com</a></li>
                    <li>Click <strong>+</strong> and enter <strong>{domain}</strong></li>
                    <li>Add the TXT record Google provides to your domain's DNS settings</li>
                    <li>Click <strong>Verify</strong> in Postmaster Tools once DNS propagates (up to 48h)</li>
                  </ol>
                  <p className="text-xs text-muted-foreground">Once verified and sending ≥100 emails/day to Gmail, reputation data will appear here automatically.</p>
                </div>
              </div>
            )}

            {!pmRepLoading && pmReputation?.verifiedDomain && pmReputation.dataPoints === 0 && (
              <p className="text-sm text-muted-foreground">
                Domain is verified but no data is available for the last 30 days. Google requires sufficient sending volume to generate reports.
              </p>
            )}

            {!pmRepLoading && pmReputation?.verifiedDomain && pmReputation.dataPoints > 0 && (
              <div className="space-y-4">
                {/* Domain Reputation */}
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-foreground">Domain Reputation</span>
                  {pmReputation.domainReputation ? (
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${REP_COLORS[pmReputation.domainReputation]?.badge}`}>
                      {REP_COLORS[pmReputation.domainReputation]?.label}
                    </span>
                  ) : (
                    <span className="text-xs text-muted-foreground">Insufficient data</span>
                  )}
                </div>

                {/* Auth ratios */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { label: 'SPF Pass Rate',   value: pct(pmReputation.spfSuccessRatio) },
                    { label: 'DKIM Pass Rate',  value: pct(pmReputation.dkimSuccessRatio) },
                    { label: 'DMARC Pass Rate', value: pct(pmReputation.dmarcSuccessRatio) },
                    { label: 'Spam Rate',       value: pct(pmReputation.userReportedSpamRatio), warn: (pmReputation.userReportedSpamRatio ?? 0) > 0.001 },
                  ].map(({ label, value, warn }) => (
                    <div key={label} className="p-3 rounded-lg bg-background border border-border text-center">
                      <p className={`text-lg font-bold ${warn ? 'text-red-500' : 'text-foreground'}`}>{value}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
                    </div>
                  ))}
                </div>

                <p className="text-xs text-muted-foreground">
                  Based on {pmReputation.dataPoints} day{pmReputation.dataPoints !== 1 ? 's' : ''} of data
                  ({pmReputation.periodStart} – {pmReputation.periodEnd}) · Source: Google Postmaster Tools
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── AI analysis result ────────────────────────────────────────────── */}
      {result && (
        <div className={`mt-2 p-4 rounded-lg border ${getStatusStyles(result.status).bg} ${getStatusStyles(result.status).border} animate-fade-in`} data-testid="domain-health-result">
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0">{getStatusStyles(result.status).icon}</div>
            <div>
              <h4 className={`text-lg font-bold ${getStatusStyles(result.status).text}`}>{result.status}</h4>
              <p className="text-xs text-muted-foreground">AI-based analysis</p>
            </div>
          </div>

          {formattedReport.introText && (
            <p className="text-muted-foreground mt-3 text-sm">{formattedReport.introText}</p>
          )}

          {formattedReport.sections.length > 0 && (
            <div className="mt-4 space-y-4">
              {formattedReport.sections.map((section, index) => (
                <div key={index} className="border-l-2 border-border pl-3">
                  <h5 className="font-semibold text-foreground text-sm mb-1">{section.label}</h5>
                  <p className="text-muted-foreground text-sm leading-relaxed">{section.content}</p>
                </div>
              ))}
            </div>
          )}

          {formattedReport.sections.length === 0 && result.report && (
            <p className="text-muted-foreground mt-2 text-sm">{result.report}</p>
          )}

          {result.recommendation && (
            <div className="mt-4 pt-4 border-t border-border">
              <h5 className="font-semibold text-foreground mb-3">Recommendations</h5>
              {formattedRecommendation.introText && (
                <p className="text-muted-foreground text-sm mb-3">{formattedRecommendation.introText}</p>
              )}
              {formattedRecommendation.sections.length > 0 ? (
                <div className="space-y-3">
                  {formattedRecommendation.sections.map((section, index) => (
                    <div key={index} className="border-l-2 border-green-300 dark:border-green-500/30 pl-3">
                      <h6 className="font-medium text-green-700 dark:text-green-300 text-sm mb-1">{section.label}</h6>
                      <p className="text-muted-foreground text-sm leading-relaxed">{section.content}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-sm">{result.recommendation}</p>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── Empty state ───────────────────────────────────────────────────── */}
      {!result && !isLoading && (
        <div className="mt-4 p-4 rounded-lg border border-sky-600/50 bg-sky-100 dark:bg-sky-500/10 flex items-start gap-3" data-testid="domain-health-info">
          <InfoIcon className="w-5 h-5 flex-shrink-0 mt-0.5 text-sky-600 dark:text-sky-400" />
          <p className="text-sm text-sky-800 dark:text-sky-200">
            Why is this important? Being on a blacklist is one of the fastest ways to have all your emails land in the spam folder. Regular checks are crucial for maintaining a healthy sender reputation.
          </p>
        </div>
      )}
    </div>
  );
};
