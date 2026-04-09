import { useState, useRef, useCallback, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import {
  Upload, Download, CheckCircle2, XCircle, AlertTriangle, Zap, FileText,
  ShieldCheck, Coins, RefreshCw, Loader2, ArrowRight, Lock
} from 'lucide-react';

// ── Types ───────────────────────────────────────────────────────────────────

interface VerificationCredits {
  tier: string;
  monthlyLimit: number;
  usedThisMonth: number;
  bonusCredits: number;
  remaining: number;
  totalAvailable: number;
}

interface DebounceResult {
  email: string;
  status: 'valid' | 'invalid' | 'disposable' | 'spamtrap' | 'catch_all' | 'unknown';
  reason: string;
  recommendation: 'keep' | 'remove';
  safeToSend: boolean;
}

interface BulkStatusResponse {
  done: boolean;
  total: number;
  processed: number;
  results?: DebounceResult[];
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function parseEmailsFromText(raw: string): string[] {
  const lines = raw.split(/\r?\n/).filter(l => l.trim());
  const emails: string[] = [];
  for (const line of lines) {
    const parts = line.split(/[,;\t]/).map(p => p.trim().replace(/^["']|["']$/g, ''));
    for (const part of parts) {
      if (part.includes('@') && part.includes('.') && !part.includes(' ')) {
        emails.push(part.toLowerCase());
        break;
      }
    }
  }
  return [...new Set(emails)];
}

function parseCSVContent(content: string): string[] {
  const lines = content.split(/\r?\n/).filter(l => l.trim());
  if (!lines.length) return [];
  const header = lines[0].split(/[,;\t]/).map(p => p.trim().toLowerCase().replace(/^["']|["']$/g, ''));
  const emailKeywords = ['email', 'e-mail', 'email_address', 'emailaddress', 'mail', 'address'];
  const hasHeader = header.some(h => emailKeywords.includes(h));
  const dataLines = hasHeader ? lines.slice(1) : lines;
  return parseEmailsFromText(dataLines.join('\n'));
}

const STATUS_CONFIG = {
  valid:      { label: 'Valid',       color: 'text-emerald-600 dark:text-emerald-400',   bg: 'bg-emerald-500/10',  border: 'border-emerald-500/20',  icon: CheckCircle2 },
  invalid:    { label: 'Invalid',     color: 'text-red-600 dark:text-red-400',           bg: 'bg-red-500/10',      border: 'border-red-500/20',      icon: XCircle },
  disposable: { label: 'Disposable',  color: 'text-amber-600 dark:text-amber-400',       bg: 'bg-amber-500/10',    border: 'border-amber-500/20',    icon: AlertTriangle },
  spamtrap:   { label: 'Spam Trap',   color: 'text-rose-800 dark:text-rose-300',         bg: 'bg-rose-900/10',     border: 'border-rose-800/30',     icon: XCircle },
  catch_all:  { label: 'Catch-All',   color: 'text-amber-600 dark:text-amber-400',       bg: 'bg-amber-500/10',    border: 'border-amber-500/20',    icon: AlertTriangle },
  unknown:    { label: 'Unknown',     color: 'text-slate-500 dark:text-slate-400',       bg: 'bg-slate-500/10',    border: 'border-slate-500/20',    icon: AlertTriangle },
} as const;

function downloadCSV(filename: string, rows: string[][]) {
  const content = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
}

// ── Sub-components ───────────────────────────────────────────────────────────

function CreditBar({ credits, isLoading }: { credits?: VerificationCredits; isLoading: boolean }) {
  if (isLoading) return <Skeleton className="h-20 w-full rounded-xl" />;
  if (!credits) return null;

  const { totalAvailable, monthlyLimit, usedThisMonth, bonusCredits, tier } = credits;
  const usedPct = monthlyLimit > 0 ? Math.min(100, (usedThisMonth / monthlyLimit) * 100) : 0;

  return (
    <div className="rounded-xl border border-border bg-gradient-to-r from-violet-500/5 via-purple-500/5 to-fuchsia-500/5 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <Coins className="w-5 h-5 text-violet-500" />
          <span className="font-semibold text-foreground">Verification Credits</span>
          <Badge variant="secondary" className="capitalize">{tier}</Badge>
        </div>
        <div className="text-right">
          <span className="text-2xl font-bold text-foreground">{totalAvailable.toLocaleString()}</span>
          <span className="text-sm text-muted-foreground ml-1">available</span>
        </div>
      </div>
      {monthlyLimit > 0 && (
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Monthly allowance: {usedThisMonth.toLocaleString()} / {monthlyLimit.toLocaleString()} used</span>
            {bonusCredits > 0 && <span className="text-violet-500">+{bonusCredits.toLocaleString()} bonus credits</span>}
          </div>
          <Progress value={usedPct} className="h-1.5" />
        </div>
      )}
    </div>
  );
}

function StarterUpgrade() {
  return (
    <Card className="border-violet-500/30 bg-violet-500/5">
      <CardContent className="pt-6 text-center space-y-3">
        <div className="mx-auto w-12 h-12 rounded-full bg-violet-500/10 flex items-center justify-center">
          <Lock className="w-6 h-6 text-violet-500" />
        </div>
        <h3 className="font-semibold text-foreground">Upgrade to Unlock List Cleaning</h3>
        <p className="text-sm text-muted-foreground max-w-sm mx-auto">
          Advanced email verification is available on Pro and Scale plans.
          Pro includes 2,000 verifications/month, Scale includes 5,000.
        </p>
        <Button className="mt-2" onClick={() => window.location.href = '/?tab=account'}>
          View Plans <ArrowRight className="w-4 h-4 ml-1" />
        </Button>
      </CardContent>
    </Card>
  );
}

function CreditPackCard({
  pack, credits, price, tag, onBuy, isPending,
}: {
  pack: '5000' | '10000';
  credits: number;
  price: string;
  tag?: string;
  onBuy: () => void;
  isPending: boolean;
}) {
  return (
    <Card className={`relative ${tag ? 'border-violet-500/40' : 'border-border'}`}>
      {tag && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <Badge className="bg-violet-600 text-white">{tag}</Badge>
        </div>
      )}
      <CardContent className="pt-6 pb-5 text-center space-y-3">
        <div className="text-3xl font-bold text-foreground">{credits.toLocaleString()}</div>
        <div className="text-sm text-muted-foreground">verification credits</div>
        <div className="text-2xl font-semibold text-foreground">{price}</div>
        <div className="text-xs text-muted-foreground">
          {pack === '5000' ? '$0.0050' : '$0.0045'} per verification
        </div>
        <Button
          className="w-full"
          variant={tag ? 'default' : 'outline'}
          onClick={onBuy}
          disabled={isPending}
          data-testid={`button-buy-credits-${pack}`}
        >
          {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Buy Now <Zap className="w-4 h-4 ml-1" /></>}
        </Button>
      </CardContent>
    </Card>
  );
}

type SortField = 'email' | 'status' | 'recommendation';
type SortDir = 'asc' | 'desc';

function ResultsTable({ results }: { results: DebounceResult[] }) {
  const [filter, setFilter] = useState<'all' | 'keep' | 'remove'>('all');
  const [sortField, setSortField] = useState<SortField>('recommendation');
  const [sortDir, setSortDir] = useState<SortDir>('asc');

  const keepCount = results.filter(r => r.recommendation === 'keep').length;
  const removeCount = results.filter(r => r.recommendation === 'remove').length;
  const validCount = results.filter(r => r.status === 'valid').length;
  const invalidCount = results.filter(r => r.status === 'invalid' || r.status === 'disposable' || r.status === 'spamtrap').length;
  const riskyCount = results.filter(r => r.status === 'catch_all' || r.status === 'unknown').length;

  const handleSort = (field: SortField) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('asc'); }
  };

  const shown = [...results]
    .filter(r => filter === 'all' || r.recommendation === filter)
    .sort((a, b) => {
      let aVal = a[sortField] as string;
      let bVal = b[sortField] as string;
      return sortDir === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
    });

  const exportClean = () => {
    const rows = [
      ['email', 'status', 'reason'],
      ...results.filter(r => r.recommendation === 'keep').map(r => [r.email, r.status, r.reason]),
    ];
    downloadCSV(`clean_list_${new Date().toISOString().split('T')[0]}.csv`, rows);
  };

  const exportRemove = () => {
    const rows = [
      ['email', 'status', 'reason', 'tag'],
      ...results.filter(r => r.recommendation === 'remove').map(r => [r.email, r.status, r.reason, 'remove']),
    ];
    downloadCSV(`remove_list_${new Date().toISOString().split('T')[0]}.csv`, rows);
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-lg border border-border bg-card p-3 text-center">
          <div className="text-2xl font-bold text-foreground">{results.length.toLocaleString()}</div>
          <div className="text-xs text-muted-foreground mt-0.5">Total Checked</div>
        </div>
        <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3 text-center">
          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{validCount.toLocaleString()}</div>
          <div className="text-xs text-muted-foreground mt-0.5">Valid</div>
        </div>
        <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-3 text-center">
          <div className="text-2xl font-bold text-red-600 dark:text-red-400">{invalidCount.toLocaleString()}</div>
          <div className="text-xs text-muted-foreground mt-0.5">Invalid</div>
        </div>
        <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3 text-center">
          <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">{riskyCount.toLocaleString()}</div>
          <div className="text-xs text-muted-foreground mt-0.5">Risky</div>
        </div>
      </div>

      {/* Export + filter bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-1">
          {(['all', 'keep', 'remove'] as const).map(f => (
            <Button
              key={f}
              size="sm"
              variant={filter === f ? 'default' : 'outline'}
              onClick={() => setFilter(f)}
              data-testid={`button-filter-${f}`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
              {f !== 'all' && (
                <Badge variant="secondary" className="ml-1.5 text-xs">
                  {f === 'keep' ? keepCount : removeCount}
                </Badge>
              )}
            </Button>
          ))}
        </div>
        <div className="flex gap-2">
          <Button
            size="sm"
            className="bg-emerald-600 hover:bg-emerald-700 text-white border-0"
            onClick={exportClean}
            disabled={keepCount === 0}
            data-testid="button-export-clean"
          >
            <Download className="w-3.5 h-3.5 mr-1.5" />
            Export Clean ({keepCount})
          </Button>
          <Button
            size="sm"
            className="bg-red-600 hover:bg-red-700 text-white border-0"
            onClick={exportRemove}
            disabled={removeCount === 0}
            data-testid="button-export-remove"
          >
            <Download className="w-3.5 h-3.5 mr-1.5" />
            Export Remove ({removeCount})
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-lg border border-border overflow-hidden">
        <div className="max-h-72 overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 sticky top-0 z-10">
              <tr>
                {(['email', 'status', 'recommendation'] as SortField[]).map((field, i) => (
                  <th
                    key={field}
                    onClick={() => handleSort(field)}
                    className={`text-left px-4 py-2.5 text-muted-foreground font-medium text-xs uppercase tracking-wide cursor-pointer select-none hover:text-foreground transition-colors ${i === 1 ? '' : i === 2 ? '' : ''}`}
                    data-testid={`th-sort-${field}`}
                  >
                    <span className="inline-flex items-center gap-1">
                      {field === 'recommendation' ? 'Action' : field.charAt(0).toUpperCase() + field.slice(1)}
                      {sortField === field ? (
                        sortDir === 'asc' ? ' ↑' : ' ↓'
                      ) : (
                        <span className="opacity-30"> ↕</span>
                      )}
                    </span>
                  </th>
                ))}
                <th className="text-left px-4 py-2.5 text-muted-foreground font-medium text-xs uppercase tracking-wide hidden sm:table-cell">Reason</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {shown.map((r, i) => {
                const cfg = STATUS_CONFIG[r.status];
                const Icon = cfg.icon;
                return (
                  <tr key={i} className={r.recommendation === 'remove' ? 'bg-red-500/3' : ''} data-testid={`row-result-${i}`}>
                    <td className="px-4 py-2.5 font-mono text-xs text-foreground">{r.email}</td>
                    <td className="px-4 py-2.5">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium border ${cfg.bg} ${cfg.color} ${cfg.border}`}>
                        <Icon className="w-3 h-3" />
                        {cfg.label}
                      </span>
                    </td>
                    <td className="px-4 py-2.5">
                      {r.recommendation === 'keep' ? (
                        <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 text-xs font-bold">
                          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                          {r.safeToSend ? 'Safe' : 'Keep'}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-red-600 dark:text-red-400 text-xs font-bold">
                          <XCircle className="w-4 h-4 flex-shrink-0" />
                          Remove
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-muted-foreground text-xs hidden sm:table-cell">{r.reason}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export const ListQualityChecker: React.FC = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [pastedText, setPastedText] = useState('');
  const [parsedEmails, setParsedEmails] = useState<string[]>([]);
  const [listId, setListId] = useState<string | null>(null);
  const [results, setResults] = useState<DebounceResult[] | null>(null);
  const [buyingPack, setBuyingPack] = useState<'5000' | '10000' | null>(null);

  // ── Credits ──────────────────────────────────────────────────────────────

  const { data: credits, isLoading: creditsLoading, error: creditsError } = useQuery<VerificationCredits>({
    queryKey: ['/api/list/verification-credits'],
    retry: false,
  });

  // ── Polling for bulk result ───────────────────────────────────────────────

  const { data: bulkStatus, isFetching: isPolling } = useQuery<BulkStatusResponse>({
    queryKey: ['/api/list/verify-bulk', listId],
    enabled: !!listId && !results,
    refetchInterval: (query) => {
      if (!query.state.data?.done) return 3000;
      return false;
    },
  });

  useEffect(() => {
    if (bulkStatus?.done && bulkStatus.results) {
      setResults(bulkStatus.results);
      setListId(null);
      queryClient.invalidateQueries({ queryKey: ['/api/list/verification-credits'] });
    }
  }, [bulkStatus, queryClient]);

  const verifyProgress = bulkStatus
    ? Math.min(99, Math.round((bulkStatus.processed / Math.max(bulkStatus.total, 1)) * 100))
    : 0;

  // ── Start verification ────────────────────────────────────────────────────

  const verifyMutation = useMutation({
    mutationFn: async (emails: string[]) => {
      const res = await apiRequest('POST', '/api/list/verify-bulk', { emails });
      return res.json() as Promise<{ listId: string; emailCount: number }>;
    },
    onSuccess: (data) => {
      setListId(data.listId);
      toast({ title: 'Verification started', description: `Verifying ${data.emailCount.toLocaleString()} emails…` });
    },
    onError: (err: Error) => {
      toast({ title: 'Error', description: err.message || 'Failed to start verification', variant: 'destructive' });
    },
  });

  // ── Buy credit pack ───────────────────────────────────────────────────────

  const handleBuyPack = async (pack: '5000' | '10000') => {
    setBuyingPack(pack);
    try {
      const res = await apiRequest('POST', '/api/checkout/verification-credits', { pack });
      const data = await res.json() as { url?: string; error?: string };
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error(data.error || 'No checkout URL returned');
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to start checkout';
      toast({ title: 'Checkout error', description: msg, variant: 'destructive' });
    } finally {
      setBuyingPack(null);
    }
  };

  // ── File handling ─────────────────────────────────────────────────────────

  const processFile = useCallback((file: File) => {
    const validTypes = ['text/csv', 'application/vnd.ms-excel', 'text/plain'];
    if (!validTypes.includes(file.type) && !file.name.endsWith('.csv') && !file.name.endsWith('.txt')) {
      toast({ title: 'Invalid file', description: 'Please upload a .csv or .txt file', variant: 'destructive' });
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast({ title: 'File too large', description: 'Maximum file size is 10MB', variant: 'destructive' });
      return;
    }
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      const emails = parseCSVContent(content);
      if (!emails.length) {
        toast({ title: 'No emails found', description: 'No valid email addresses found in the file', variant: 'destructive' });
        setFileName(null);
        return;
      }
      setParsedEmails(emails);
      setPastedText(emails.join('\n'));
    };
    reader.readAsText(file);
  }, [toast]);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  };

  const handlePasteChange = (raw: string) => {
    setPastedText(raw);
    setFileName(null);
    const emails = parseEmailsFromText(raw);
    setParsedEmails(emails);
  };

  const emailCount = parsedEmails.length;
  const canVerify = emailCount > 0 && !verifyMutation.isPending && !listId;
  const isUnauthenticated = creditsError && (creditsError as Error)?.message?.startsWith('401');
  const isStarterTier = credits && credits.monthlyLimit === 0 && credits.bonusCredits === 0;

  const handleVerify = () => {
    if (!canVerify) return;
    if (emailCount > 50000) {
      toast({ title: 'Too many emails', description: 'Maximum 50,000 emails per batch', variant: 'destructive' });
      return;
    }
    setResults(null);
    verifyMutation.mutate(parsedEmails);
  };

  const handleReset = () => {
    setResults(null);
    setListId(null);
    setParsedEmails([]);
    setPastedText('');
    setFileName(null);
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6" data-testid="list-quality-checker">

      {/* Header */}
      <div className="rounded-xl bg-gradient-to-r from-violet-600/10 via-purple-600/10 to-fuchsia-600/10 border border-violet-500/20 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-violet-600/15 p-2">
              <ShieldCheck className="w-6 h-6 text-violet-500" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-foreground">Email List Cleaner</h3>
              <p className="text-sm text-muted-foreground">Real-time email verification &amp; hygiene</p>
            </div>
          </div>
        </div>
      </div>

      {/* Auth gate */}
      {isUnauthenticated && (
        <Card className="border-border">
          <CardContent className="pt-6 text-center space-y-3">
            <Lock className="w-8 h-8 mx-auto text-muted-foreground" />
            <p className="text-foreground font-medium">Sign in to use the List Cleaner</p>
            <p className="text-sm text-muted-foreground">Create an account to access real email verification.</p>
            <Button onClick={() => window.location.href = '/api/login'}>Sign In</Button>
          </CardContent>
        </Card>
      )}

      {/* Starter upgrade gate */}
      {!isUnauthenticated && !creditsLoading && isStarterTier && <StarterUpgrade />}

      {/* Main content for Pro/Scale users */}
      {!isUnauthenticated && !isStarterTier && (
        <>
          {/* Credits bar */}
          <CreditBar credits={credits} isLoading={creditsLoading} />

          {/* Upload area */}
          {!results && !listId && (
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
              {/* Drop zone + paste - 3 cols */}
              <div className="lg:col-span-3 space-y-3">
                <div
                  onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                  onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`relative border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                    isDragging ? 'border-violet-500 bg-violet-500/5' : 'border-input hover:border-violet-500/40 hover:bg-muted/20'
                  }`}
                  data-testid="dropzone-csv"
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv,.txt"
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) processFile(f); }}
                    className="hidden"
                    data-testid="input-file-csv"
                  />
                  <Upload className={`w-7 h-7 mx-auto mb-2 ${isDragging ? 'text-violet-500' : 'text-muted-foreground'}`} />
                  <p className="font-medium text-foreground text-sm">
                    {fileName ? fileName : 'Drop CSV or TXT file here'}
                  </p>
                  <p className="text-muted-foreground text-xs mt-1">or click to browse · max 10MB</p>
                  {fileName && emailCount > 0 && (
                    <p className="text-emerald-600 dark:text-emerald-400 text-xs mt-2">
                      {emailCount.toLocaleString()} emails extracted
                    </p>
                  )}
                </div>

                <div className="relative">
                  <p className="text-xs text-muted-foreground mb-1.5">Or paste email addresses (one per line):</p>
                  <textarea
                    value={pastedText}
                    onChange={(e) => handlePasteChange(e.target.value)}
                    placeholder={"user@example.com\ncontact@company.org\n..."}
                    className="w-full h-36 resize-none rounded-lg border border-input bg-background text-foreground text-sm font-mono p-3 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50"
                    disabled={verifyMutation.isPending}
                    data-testid="textarea-email-list"
                  />
                  {emailCount > 0 && (
                    <span className="absolute top-7 right-2 text-xs text-muted-foreground bg-background px-1">
                      {emailCount.toLocaleString()} emails
                    </span>
                  )}
                </div>

                <Button
                  className="w-full"
                  onClick={handleVerify}
                  disabled={!canVerify || !credits || credits.totalAvailable < emailCount}
                  data-testid="button-verify-list"
                >
                  {verifyMutation.isPending ? (
                    <><Loader2 className="w-4 h-4 animate-spin mr-2" />Submitting…</>
                  ) : (
                    <><ShieldCheck className="w-4 h-4 mr-2" />Verify {emailCount > 0 ? `${emailCount.toLocaleString()} Emails` : 'List'}</>
                  )}
                </Button>

                {credits && emailCount > 0 && credits.totalAvailable < emailCount && (
                  <p className="text-sm text-red-600 dark:text-red-400 text-center" data-testid="text-insufficient-credits">
                    You need {emailCount.toLocaleString()} credits but have {credits.totalAvailable.toLocaleString()} available.
                    Purchase a credit pack below.
                  </p>
                )}
              </div>

              {/* Credit packs - 2 cols */}
              <div className="lg:col-span-2 space-y-3">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Top-up Credit Packs</p>
                <CreditPackCard
                  pack="5000"
                  credits={5000}
                  price="$25"
                  onBuy={() => handleBuyPack('5000')}
                  isPending={buyingPack === '5000'}
                />
                <CreditPackCard
                  pack="10000"
                  credits={10000}
                  price="$45"
                  tag="Best Value"
                  onBuy={() => handleBuyPack('10000')}
                  isPending={buyingPack === '10000'}
                />
                <p className="text-xs text-muted-foreground text-center">Credits never expire · one-time purchase</p>

                <div className="rounded-lg border border-border bg-muted/30 p-3 space-y-2 text-xs text-muted-foreground">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 mt-0.5 flex-shrink-0" />
                    <span>Validates mailbox existence in real-time</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 mt-0.5 flex-shrink-0" />
                    <span>Detects disposable &amp; temporary addresses</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 mt-0.5 flex-shrink-0" />
                    <span>Flags spam traps before they hurt you</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 mt-0.5 flex-shrink-0" />
                    <span>Export clean + remove CSVs instantly</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Verification in progress — shimmer skeleton */}
          {listId && !results && (
            <div className="space-y-4" data-testid="card-verification-progress">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-violet-500" />
                  <span className="text-sm font-medium text-foreground">
                    Verifying {emailCount.toLocaleString()} emails…
                  </span>
                </div>
                <span className="text-xs text-muted-foreground">
                  {bulkStatus ? `${bulkStatus.processed.toLocaleString()} / ${bulkStatus.total.toLocaleString()}` : 'Starting…'}
                </span>
              </div>
              <Progress value={verifyProgress} className="h-1.5" />
              {/* Shimmer skeleton simulating the results table */}
              <div className="rounded-lg border border-border overflow-hidden">
                <div className="bg-muted/50 px-4 py-2.5 grid grid-cols-3 gap-4">
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-3 w-12" />
                  <Skeleton className="h-3 w-14" />
                </div>
                <div className="divide-y divide-border">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="px-4 py-3 grid grid-cols-3 gap-4 items-center">
                      <Skeleton className="h-3 w-full max-w-[160px]" style={{ opacity: 1 - i * 0.1 }} />
                      <Skeleton className="h-5 w-16 rounded-md" style={{ opacity: 1 - i * 0.1 }} />
                      <Skeleton className="h-3 w-12" style={{ opacity: 1 - i * 0.1 }} />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Results */}
          {results && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-foreground flex items-center gap-2">
                  <FileText className="w-4 h-4 text-violet-500" />
                  Verification Results
                </h4>
                <Button variant="outline" size="sm" onClick={handleReset} data-testid="button-reset">
                  <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
                  Verify Another List
                </Button>
              </div>
              <ResultsTable results={results} />
            </div>
          )}
        </>
      )}
    </div>
  );
};
