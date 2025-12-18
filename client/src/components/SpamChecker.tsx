import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { AlertTriangle, CheckCircle2, ShieldAlert, ShieldCheck, Shield, Copy, Check, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { SpamCheckResult, HistoryItem } from '../types';

const escapeHtml = (text: string): string => {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
};

const escapeRegExp = (string: string): string => {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

const getSeverityHighlightColor = (severity: 'High' | 'Medium' | 'Low'): string => {
  switch (severity) {
    case 'High': return 'rgba(239, 68, 68, 0.4)';
    case 'Medium': return 'rgba(234, 179, 8, 0.4)';
    case 'Low': return 'rgba(59, 130, 246, 0.4)';
    default: return 'transparent';
  }
};

interface SpamCheckerProps {
  history?: HistoryItem[];
}

export const SpamChecker: React.FC<SpamCheckerProps> = ({ history = [] }) => {
  const { toast } = useToast();
  const [subject, setSubject] = useState('');
  const [previewText, setPreviewText] = useState('');
  const [body, setBody] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<SpamCheckResult | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const handleCheck = async () => {
    if (!body.trim()) return;
    
    setIsLoading(true);
    try {
      const response = await fetch('/api/spam/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          text: body.trim(),
          subject: subject.trim() || undefined,
          previewText: previewText.trim() || undefined
        })
      });
      if (response.ok) {
        const data = await response.json();
        setResult(data);
      } else {
        toast({
          title: "Check Failed",
          description: "Could not analyze email for spam triggers. Please try again.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Failed to check spam triggers:', error);
      toast({
        title: "Connection Error",
        description: "Failed to connect to the analysis service. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const getRiskIcon = (risk: string) => {
    switch (risk) {
      case 'Low': return <ShieldCheck className="w-5 h-5 text-green-500" />;
      case 'Medium': return <Shield className="w-5 h-5 text-yellow-500" />;
      case 'High': return <ShieldAlert className="w-5 h-5 text-red-500" />;
      default: return <Shield className="w-5 h-5" />;
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'Low': return 'text-green-500';
      case 'Medium': return 'text-yellow-500';
      case 'High': return 'text-red-500';
      default: return 'text-muted-foreground';
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'High': return <Badge variant="destructive" className="text-xs">High Risk</Badge>;
      case 'Medium': return <Badge className="bg-yellow-500/20 text-yellow-500 text-xs">Medium</Badge>;
      case 'Low': return <Badge variant="secondary" className="text-xs">Low</Badge>;
      default: return <Badge variant="secondary" className="text-xs">{severity}</Badge>;
    }
  };

  const overallRisk = result?.overallRisk || 'Medium';
  const riskSummary = result?.riskSummary || 'Analysis complete';
  const inboxProbability = (result && typeof result.inboxProbability === 'number' && !isNaN(result.inboxProbability))
    ? result.inboxProbability 
    : 50;
  const triggers = result?.triggers || [];

  const highlightedHtml = useMemo(() => {
    const fullText = [subject, previewText, body].filter(Boolean).join('\n\n---\n\n');
    if (!fullText || !triggers || triggers.length === 0) {
      return escapeHtml(fullText).replace(/\n/g, '<br>');
    }

    const triggerMap = new Map<string, { word: string; severity: 'High' | 'Medium' | 'Low' }>();
    triggers.forEach(trigger => {
      triggerMap.set(trigger.word.toLowerCase(), { 
        word: trigger.word, 
        severity: trigger.severity as 'High' | 'Medium' | 'Low' 
      });
    });

    const wordsToMatch = triggers.map(t => escapeRegExp(t.word));
    const regex = new RegExp(`\\b(${wordsToMatch.join('|')})\\b`, 'gi');

    const parts: string[] = [];
    let lastIndex = 0;
    let match;

    while ((match = regex.exec(fullText)) !== null) {
      if (match.index > lastIndex) {
        parts.push(escapeHtml(fullText.substring(lastIndex, match.index)));
      }
      const matchedWord = match[0];
      const trigger = triggerMap.get(matchedWord.toLowerCase());
      const bgColor = trigger ? getSeverityHighlightColor(trigger.severity) : 'transparent';
      parts.push(`<mark style="background-color: ${bgColor}; color: inherit; padding: 2px 4px; border-radius: 3px;">${escapeHtml(matchedWord)}</mark>`);
      lastIndex = regex.lastIndex;
    }

    if (lastIndex < fullText.length) {
      parts.push(escapeHtml(fullText.substring(lastIndex)));
    }

    return parts.join('').replace(/\n/g, '<br>');
  }, [subject, previewText, body, triggers]);

  return (
    <div className="space-y-6 animate-fade-in">
      <Card className="card-lift">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-orange-500 to-red-500">
              <ShieldAlert className="w-5 h-5 text-white" />
            </div>
            <div>
              <CardTitle>Spam Trigger Checker</CardTitle>
              <CardDescription>Scan your email for words and phrases that trigger spam filters</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {history.length > 0 && (
            <div className="p-4 rounded-lg bg-gradient-to-r from-orange-500/10 to-red-500/10 border border-orange-500/20">
              <label className="text-sm font-medium text-foreground mb-2 block">
                Load from Previous Email
              </label>
              <select
                className="w-full h-10 px-3 py-2 rounded-md border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                data-testid="select-spam-email"
                defaultValue=""
                onChange={(e) => {
                  const value = e.target.value;
                  if (!value) return;
                  const item = history.find(h => h.id === value);
                  if (item) {
                    const subjectLine = item.content.variations?.[0]?.subject || '';
                    const preview = item.content.variations?.[0]?.previewText || '';
                    const emailBody = item.content.body || '';
                    
                    setSubject(subjectLine);
                    setPreviewText(preview);
                    setBody(emailBody);
                    toast({
                      title: 'Email Loaded',
                      description: `Loaded "${subjectLine || 'Untitled'}" for spam checking`,
                    });
                  }
                }}
              >
                <option value="">Select an email to check...</option>
                {history.map((item) => {
                  const subjectLine = item.content?.variations?.[0]?.subject || 'No subject';
                  const truncatedSubject = subjectLine.length > 50 ? subjectLine.slice(0, 50) + '...' : subjectLine;
                  const formattedDate = item.date ? new Date(item.date).toLocaleDateString() : '';
                  return (
                    <option 
                      key={item.id} 
                      value={item.id}
                      data-testid={`select-spam-email-${item.id}`}
                    >
                      {truncatedSubject}{formattedDate ? ` (${formattedDate})` : ''}
                    </option>
                  );
                })}
              </select>
              {(subject || body) && (
                <div className="mt-3 p-3 rounded-lg bg-background/50 border border-border/50 space-y-2">
                  <div>
                    <span className="text-xs font-medium text-muted-foreground">Subject:</span>
                    <p className="text-sm text-foreground">{subject || 'No subject'}</p>
                  </div>
                  {body && (
                    <div>
                      <span className="text-xs font-medium text-muted-foreground">Body Preview:</span>
                      <p className="text-sm text-muted-foreground line-clamp-3">{body}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Subject Line (optional)</label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Your email subject"
                className="w-full bg-muted border border-border rounded-lg p-3 text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary outline-none"
                data-testid="input-spam-subject"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Preview Text (optional)</label>
              <input
                type="text"
                value={previewText}
                onChange={(e) => setPreviewText(e.target.value)}
                placeholder="Preview text shown in inbox"
                className="w-full bg-muted border border-border rounded-lg p-3 text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary outline-none"
                data-testid="input-spam-preview"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Email Body *</label>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Paste your email content here..."
                rows={8}
                className="w-full bg-muted border border-border rounded-lg p-3 text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary outline-none resize-none"
                data-testid="input-spam-body"
              />
            </div>
          </div>

          <Button
            onClick={handleCheck}
            disabled={isLoading || !body.trim()}
            className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
            data-testid="button-check-spam"
          >
            {isLoading ? 'Scanning for Spam Triggers...' : 'Check for Spam Triggers'}
          </Button>
        </CardContent>
      </Card>

      {result && (
        <div className="space-y-4 animate-fade-in">
          <Card className={`border-2 ${
            overallRisk === 'Low' ? 'border-green-500/30' : 
            overallRisk === 'Medium' ? 'border-yellow-500/30' : 'border-red-500/30'
          }`}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  {getRiskIcon(overallRisk)}
                  <div>
                    <h3 className={`font-bold text-lg ${getRiskColor(overallRisk)}`}>
                      {overallRisk} Spam Risk
                    </h3>
                    <p className="text-sm text-muted-foreground">{riskSummary}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-foreground">{inboxProbability}%</p>
                  <p className="text-xs text-muted-foreground">Inbox Probability</p>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Inbox Placement Score</span>
                  <span className={`font-medium ${
                    inboxProbability >= 80 ? 'text-green-500' :
                    inboxProbability >= 60 ? 'text-yellow-500' : 'text-red-500'
                  }`}>{inboxProbability}/100</span>
                </div>
                <Progress 
                  value={inboxProbability} 
                  className={`h-2 ${
                    inboxProbability >= 80 ? '[&>div]:bg-green-500' :
                    inboxProbability >= 60 ? '[&>div]:bg-yellow-500' : '[&>div]:bg-red-500'
                  }`}
                />
              </div>

              <div className="mt-4 pt-4 border-t border-border flex items-center gap-2">
                {triggers.length === 0 ? (
                  <div className="flex items-center gap-2 text-green-500">
                    <CheckCircle2 className="w-4 h-4" />
                    <span className="text-sm font-medium">No spam triggers detected</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <AlertTriangle className="w-4 h-4" />
                    <span className="text-sm">{triggers.length} trigger{triggers.length !== 1 ? 's' : ''} found</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {triggers.length > 0 && (
            <Card className="bg-card/50">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-muted-foreground" />
                  <CardTitle className="text-base">Email Preview with Highlighted Triggers</CardTitle>
                </div>
                <CardDescription className="text-xs">
                  <span className="inline-flex items-center gap-2">
                    <span className="inline-block w-3 h-3 rounded" style={{ backgroundColor: 'rgba(239, 68, 68, 0.4)' }} /> High
                    <span className="inline-block w-3 h-3 rounded ml-2" style={{ backgroundColor: 'rgba(234, 179, 8, 0.4)' }} /> Medium
                    <span className="inline-block w-3 h-3 rounded ml-2" style={{ backgroundColor: 'rgba(59, 130, 246, 0.4)' }} /> Low
                  </span>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div 
                  className="p-4 rounded-lg bg-muted/50 border border-border text-sm text-foreground leading-relaxed max-h-64 overflow-y-auto"
                  dangerouslySetInnerHTML={{ __html: highlightedHtml }}
                  data-testid="spam-highlighted-preview"
                />
              </CardContent>
            </Card>
          )}

          {triggers.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-yellow-500" />
                Spam Triggers Found
              </h3>
              
              {triggers.map((trigger, i) => {
                const word = trigger.word || 'Unknown';
                const reason = trigger.reason || 'May trigger spam filters';
                const severity = trigger.severity || 'Medium';
                const suggestion = trigger.suggestion || 'Consider rephrasing';
                const suggestions = trigger.suggestions || [];
                const rephraseExamples = trigger.rephraseExamples || [];
                
                return (
                  <Card key={i} className="bg-card/50">
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <code className="px-2 py-0.5 rounded bg-red-500/20 text-red-400 font-mono text-sm">
                              {word}
                            </code>
                            {getSeverityBadge(severity)}
                          </div>
                          <p className="text-sm text-muted-foreground">{reason}</p>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-border/50">
                        <p className="text-xs font-medium text-foreground mb-2">Suggested replacement:</p>
                        <div className="flex items-center gap-2">
                          <code className="px-2 py-1 rounded bg-green-500/20 text-green-400 font-mono text-sm">
                            {suggestion}
                          </code>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7"
                            onClick={() => copyToClipboard(suggestion, i)}
                            data-testid={`button-copy-suggestion-${i}`}
                          >
                            {copiedIndex === i ? (
                              <Check className="w-3.5 h-3.5 text-green-500" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </Button>
                        </div>
                      </div>

                      {suggestions.length > 1 && (
                        <div className="pt-2">
                          <p className="text-xs font-medium text-muted-foreground mb-1.5">Other alternatives:</p>
                          <div className="flex flex-wrap gap-1.5">
                            {suggestions.filter(s => s !== suggestion).slice(0, 4).map((alt, j) => (
                              <Badge key={j} variant="secondary" className="text-xs font-mono">
                                {alt}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {rephraseExamples.length > 0 && (
                        <div className="pt-2 border-t border-border/50">
                          <p className="text-xs font-medium text-muted-foreground mb-1.5">Rephrase examples:</p>
                          <ul className="space-y-1">
                            {rephraseExamples.map((example, j) => (
                              <li key={j} className="text-sm text-foreground/80 pl-3 border-l-2 border-primary/30">
                                {example}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
