import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { 
  Download, 
  Upload, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Loader2, 
  Users, 
  Mail, 
  AlertCircle,
  Info
} from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface HighLevelContact {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  tags: string[];
  dateCreated?: string;
  lastActivity?: string;
}

interface EmailAnalysis {
  contact: HighLevelContact;
  status: 'valid' | 'risky' | 'invalid';
  issues: string[];
}

interface HighLevelContactCleanerProps {
  isConnected: boolean;
}

export function HighLevelContactCleaner({ isConnected }: HighLevelContactCleanerProps) {
  const [contacts, setContacts] = useState<HighLevelContact[]>([]);
  const [analyzedContacts, setAnalyzedContacts] = useState<EmailAnalysis[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analyzeProgress, setAnalyzeProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchContacts = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/esp/highlevel/contacts?limit=500', {
        credentials: 'include'
      });
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch contacts');
      }
      
      if (data.success && data.contacts) {
        setContacts(data.contacts);
        toast({
          title: 'Contacts Loaded',
          description: `Successfully loaded ${data.contacts.length} contacts from HighLevel.`,
        });
      } else {
        throw new Error(data.error || 'No contacts found');
      }
    } catch (err: any) {
      setError(err.message);
      toast({
        title: 'Error',
        description: err.message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const analyzeEmails = async () => {
    setIsAnalyzing(true);
    setAnalyzeProgress(0);
    const analyzed: EmailAnalysis[] = [];
    
    for (let i = 0; i < contacts.length; i++) {
      const contact = contacts[i];
      const issues: string[] = [];
      let status: 'valid' | 'risky' | 'invalid' = 'valid';
      
      const email = contact.email.toLowerCase().trim();
      
      if (!email) {
        issues.push('No email address');
        status = 'invalid';
      } else {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
          issues.push('Invalid email format');
          status = 'invalid';
        }
        
        const disposableDomains = ['mailinator.com', 'tempmail.com', 'throwaway.email', 'guerrillamail.com', 'temp-mail.org', '10minutemail.com', 'fakeinbox.com', 'trashmail.com'];
        const domain = email.split('@')[1];
        if (domain && disposableDomains.includes(domain)) {
          issues.push('Disposable email domain');
          status = 'risky';
        }
        
        const roleBased = ['info@', 'admin@', 'support@', 'sales@', 'contact@', 'hello@', 'noreply@', 'no-reply@'];
        if (roleBased.some(prefix => email.startsWith(prefix))) {
          issues.push('Role-based email (lower engagement likely)');
          if (status === 'valid') status = 'risky';
        }
        
        const typoPatterns = [
          { pattern: /@gmial\./, suggestion: '@gmail.' },
          { pattern: /@gmal\./, suggestion: '@gmail.' },
          { pattern: /@gamil\./, suggestion: '@gmail.' },
          { pattern: /@hotmal\./, suggestion: '@hotmail.' },
          { pattern: /@yaho\./, suggestion: '@yahoo.' },
          { pattern: /@yahooo\./, suggestion: '@yahoo.' },
          { pattern: /\.con$/, suggestion: '.com' },
          { pattern: /\.cmo$/, suggestion: '.com' },
        ];
        for (const { pattern, suggestion } of typoPatterns) {
          if (pattern.test(email)) {
            issues.push(`Possible typo (did you mean ${suggestion}?)`);
            status = 'risky';
            break;
          }
        }
        
        if (!contact.lastActivity) {
          const createdDate = contact.dateCreated ? new Date(contact.dateCreated) : null;
          if (createdDate) {
            const daysSinceCreated = (Date.now() - createdDate.getTime()) / (1000 * 60 * 60 * 24);
            if (daysSinceCreated > 365) {
              issues.push('No activity in over a year');
              if (status === 'valid') status = 'risky';
            }
          }
        }
      }
      
      analyzed.push({ contact, status, issues });
      setAnalyzeProgress(Math.round(((i + 1) / contacts.length) * 100));
    }
    
    setAnalyzedContacts(analyzed);
    setIsAnalyzing(false);
    
    const invalidCount = analyzed.filter(a => a.status === 'invalid').length;
    const riskyCount = analyzed.filter(a => a.status === 'risky').length;
    
    toast({
      title: 'Analysis Complete',
      description: `Found ${invalidCount} invalid and ${riskyCount} risky emails out of ${analyzed.length} contacts.`,
    });
  };

  const exportCleanList = () => {
    const cleanContacts = analyzedContacts.filter(a => a.status === 'valid');
    const csvContent = [
      ['Email', 'First Name', 'Last Name', 'Phone', 'Tags'].join(','),
      ...cleanContacts.map(({ contact }) => 
        [contact.email, contact.firstName, contact.lastName, contact.phone, contact.tags.join(';')].map(v => `"${v}"`).join(',')
      )
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'highlevel_clean_contacts.csv';
    a.click();
    URL.revokeObjectURL(url);
    
    toast({
      title: 'Export Complete',
      description: `Exported ${cleanContacts.length} clean contacts to CSV.`,
    });
  };

  const exportRiskyList = () => {
    const riskyContacts = analyzedContacts.filter(a => a.status !== 'valid');
    const csvContent = [
      ['Email', 'First Name', 'Last Name', 'Status', 'Issues'].join(','),
      ...riskyContacts.map(({ contact, status, issues }) => 
        [contact.email, contact.firstName, contact.lastName, status, issues.join('; ')].map(v => `"${v}"`).join(',')
      )
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'highlevel_risky_contacts.csv';
    a.click();
    URL.revokeObjectURL(url);
    
    toast({
      title: 'Export Complete',
      description: `Exported ${riskyContacts.length} risky/invalid contacts to CSV.`,
    });
  };

  const validCount = analyzedContacts.filter(a => a.status === 'valid').length;
  const riskyCount = analyzedContacts.filter(a => a.status === 'risky').length;
  const invalidCount = analyzedContacts.filter(a => a.status === 'invalid').length;

  if (!isConnected) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>HighLevel Not Connected</AlertTitle>
        <AlertDescription>
          Please connect your HighLevel account in ESP Settings to use contact export and cleaning.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <Alert className="border-blue-500/20 bg-blue-500/5">
        <Info className="h-4 w-4 text-blue-500" />
        <AlertTitle className="text-blue-500">HighLevel Integration</AlertTitle>
        <AlertDescription className="text-muted-foreground">
          HighLevel's API doesn't provide campaign analytics. Use this tool to export and clean your contact list, 
          then use our Grader and Risk Score tools to analyze your email content manually before sending.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Contact Export & Cleaning
          </CardTitle>
          <CardDescription>
            Export contacts from HighLevel and identify invalid or risky email addresses
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-wrap gap-3">
            <Button 
              onClick={fetchContacts} 
              disabled={isLoading}
              data-testid="button-fetch-contacts"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Loading...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Fetch Contacts
                </>
              )}
            </Button>
            
            {contacts.length > 0 && !analyzedContacts.length && (
              <Button 
                onClick={analyzeEmails} 
                disabled={isAnalyzing}
                variant="secondary"
                data-testid="button-analyze-emails"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Mail className="w-4 h-4 mr-2" />
                    Analyze Emails ({contacts.length})
                  </>
                )}
              </Button>
            )}
          </div>

          {isAnalyzing && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Analyzing contacts...</span>
                <span>{analyzeProgress}%</span>
              </div>
              <Progress value={analyzeProgress} />
            </div>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {analyzedContacts.length > 0 && (
            <>
              <div className="grid grid-cols-3 gap-4">
                <Card className="bg-green-500/10 border-green-500/20">
                  <CardContent className="pt-4 text-center">
                    <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-green-500">{validCount}</div>
                    <div className="text-sm text-muted-foreground">Valid</div>
                  </CardContent>
                </Card>
                <Card className="bg-yellow-500/10 border-yellow-500/20">
                  <CardContent className="pt-4 text-center">
                    <AlertTriangle className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-yellow-500">{riskyCount}</div>
                    <div className="text-sm text-muted-foreground">Risky</div>
                  </CardContent>
                </Card>
                <Card className="bg-red-500/10 border-red-500/20">
                  <CardContent className="pt-4 text-center">
                    <XCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-red-500">{invalidCount}</div>
                    <div className="text-sm text-muted-foreground">Invalid</div>
                  </CardContent>
                </Card>
              </div>

              <div className="flex flex-wrap gap-3">
                <Button onClick={exportCleanList} variant="outline" data-testid="button-export-clean">
                  <Download className="w-4 h-4 mr-2" />
                  Export Clean List ({validCount})
                </Button>
                <Button onClick={exportRiskyList} variant="outline" data-testid="button-export-risky">
                  <Download className="w-4 h-4 mr-2" />
                  Export Risky/Invalid ({riskyCount + invalidCount})
                </Button>
              </div>

              <div>
                <h4 className="text-sm font-medium mb-3">Issues Found</h4>
                <ScrollArea className="h-64 rounded-md border">
                  <div className="p-4 space-y-2">
                    {analyzedContacts
                      .filter(a => a.status !== 'valid')
                      .slice(0, 50)
                      .map(({ contact, status, issues }, i) => (
                        <div 
                          key={contact.id || i} 
                          className="flex items-start gap-3 p-2 rounded-lg bg-muted/30"
                        >
                          {status === 'invalid' ? (
                            <XCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                          ) : (
                            <AlertTriangle className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="font-mono text-sm truncate">
                              {contact.email || 'No email'}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {contact.firstName} {contact.lastName}
                            </div>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {issues.map((issue, j) => (
                                <Badge 
                                  key={j} 
                                  variant="outline" 
                                  className={status === 'invalid' ? 'border-red-500/30 text-red-400' : 'border-yellow-500/30 text-yellow-400'}
                                >
                                  {issue}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </div>
                      ))}
                    {analyzedContacts.filter(a => a.status !== 'valid').length > 50 && (
                      <div className="text-center text-sm text-muted-foreground py-2">
                        ... and {analyzedContacts.filter(a => a.status !== 'valid').length - 50} more
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
