import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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

interface ESPContact {
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
  contact: ESPContact;
  status: 'valid' | 'risky' | 'invalid';
  issues: string[];
}

interface ESPConnection {
  provider: string;
  accountName?: string;
  isConnected: boolean;
  hasLocationId?: boolean;
}

interface ESPContactCleanerProps {
  connections?: ESPConnection[];
}

const PROVIDER_NAMES: Record<string, string> = {
  highlevel: 'HighLevel',
  sendgrid: 'SendGrid',
  mailchimp: 'Mailchimp',
  activecampaign: 'ActiveCampaign',
  hubspot: 'HubSpot',
  constantcontact: 'Constant Contact',
  convertkit: 'ConvertKit',
  klaviyo: 'Klaviyo',
  drip: 'Drip',
  aweber: 'AWeber',
  ontraport: 'Ontraport',
  keap: 'Keap',
};

const PROVIDERS_WITH_CONTACTS = ['highlevel', 'sendgrid', 'mailchimp', 'activecampaign', 'hubspot'];

export function ESPContactCleaner({ connections: propConnections }: ESPContactCleanerProps) {
  const [selectedProvider, setSelectedProvider] = useState<string>('');
  const [contacts, setContacts] = useState<ESPContact[]>([]);
  const [analyzedContacts, setAnalyzedContacts] = useState<EmailAnalysis[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analyzeProgress, setAnalyzeProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [localConnections, setLocalConnections] = useState<ESPConnection[]>([]);
  const [isLoadingConnections, setIsLoadingConnections] = useState(false);
  const { toast } = useToast();

  const connections = propConnections ?? localConnections;

  useEffect(() => {
    if (!propConnections) {
      setIsLoadingConnections(true);
      fetch('/api/esp/connections', { credentials: 'include' })
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) {
            setLocalConnections(data);
          }
        })
        .catch(err => {
          console.error('Failed to fetch ESP connections:', err);
        })
        .finally(() => {
          setIsLoadingConnections(false);
        });
    }
  }, [propConnections]);

  const availableProviders = connections.filter(
    c => c.isConnected && PROVIDERS_WITH_CONTACTS.includes(c.provider)
  );

  const fetchContacts = async () => {
    if (!selectedProvider) {
      toast({
        title: 'Select Provider',
        description: 'Please select an ESP provider first.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    setError(null);
    setContacts([]);
    setAnalyzedContacts([]);
    
    try {
      const response = await fetch(`/api/esp/${selectedProvider}/contacts?limit=500`, {
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
          description: `Successfully loaded ${data.contacts.length} contacts from ${PROVIDER_NAMES[selectedProvider] || selectedProvider}.`,
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
    const providerName = PROVIDER_NAMES[selectedProvider] || selectedProvider;
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
    a.download = `${selectedProvider}_clean_contacts.csv`;
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
    a.download = `${selectedProvider}_risky_contacts.csv`;
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

  if (availableProviders.length === 0) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>No Compatible ESPs Connected</AlertTitle>
        <AlertDescription>
          Connect an ESP with contact export support (HighLevel, SendGrid, Mailchimp, ActiveCampaign, or HubSpot) in ESP Settings to use contact cleaning.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <Alert className="border-blue-500/20 bg-blue-500/5">
        <Info className="h-4 w-4 text-blue-500" />
        <AlertTitle className="text-blue-500">Contact Export & Cleaning</AlertTitle>
        <AlertDescription className="text-muted-foreground">
          Export contacts from your connected ESP and identify invalid or risky email addresses before sending campaigns.
          This helps improve deliverability and reduce bounce rates.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Contact Export & Cleaning
          </CardTitle>
          <CardDescription>
            Select an ESP, fetch contacts, and analyze for email validity issues
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-wrap gap-3 items-center">
            <Select value={selectedProvider} onValueChange={setSelectedProvider}>
              <SelectTrigger className="w-[200px]" data-testid="select-esp-provider">
                <SelectValue placeholder="Select ESP" />
              </SelectTrigger>
              <SelectContent>
                {availableProviders.map(conn => (
                  <SelectItem key={conn.provider} value={conn.provider}>
                    {PROVIDER_NAMES[conn.provider] || conn.provider}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button 
              onClick={fetchContacts} 
              disabled={isLoading || !selectedProvider}
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
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {analyzedContacts.length > 0 && (
            <>
              <div className="grid grid-cols-3 gap-4">
                <Card className="bg-green-500/10 border-green-500/20">
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Valid</p>
                        <p className="text-2xl font-bold text-green-500">{validCount}</p>
                      </div>
                      <CheckCircle className="w-8 h-8 text-green-500" />
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="bg-yellow-500/10 border-yellow-500/20">
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Risky</p>
                        <p className="text-2xl font-bold text-yellow-500">{riskyCount}</p>
                      </div>
                      <AlertTriangle className="w-8 h-8 text-yellow-500" />
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="bg-red-500/10 border-red-500/20">
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Invalid</p>
                        <p className="text-2xl font-bold text-red-500">{invalidCount}</p>
                      </div>
                      <XCircle className="w-8 h-8 text-red-500" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="flex flex-wrap gap-3">
                <Button onClick={exportCleanList} variant="default" data-testid="button-export-clean">
                  <Download className="w-4 h-4 mr-2" />
                  Export Clean List ({validCount})
                </Button>
                <Button onClick={exportRiskyList} variant="outline" data-testid="button-export-risky">
                  <Download className="w-4 h-4 mr-2" />
                  Export Risky/Invalid ({riskyCount + invalidCount})
                </Button>
              </div>

              <ScrollArea className="h-[300px] border rounded-lg">
                <div className="p-4 space-y-2">
                  {analyzedContacts.filter(a => a.status !== 'valid').map((analysis, idx) => (
                    <div 
                      key={idx} 
                      className="flex items-center justify-between p-2 rounded-lg bg-muted/50"
                      data-testid={`contact-issue-${idx}`}
                    >
                      <div className="flex items-center gap-3">
                        {analysis.status === 'invalid' ? (
                          <XCircle className="w-4 h-4 text-red-500" />
                        ) : (
                          <AlertTriangle className="w-4 h-4 text-yellow-500" />
                        )}
                        <div>
                          <p className="font-medium text-sm">{analysis.contact.email || '(no email)'}</p>
                          <p className="text-xs text-muted-foreground">{analysis.contact.firstName} {analysis.contact.lastName}</p>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-1 justify-end max-w-[200px]">
                        {analysis.issues.map((issue, i) => (
                          <Badge key={i} variant="outline" className="text-xs">
                            {issue}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  ))}
                  {analyzedContacts.filter(a => a.status !== 'valid').length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <CheckCircle className="w-12 h-12 mx-auto mb-2 text-green-500" />
                      <p>All contacts have valid emails!</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
