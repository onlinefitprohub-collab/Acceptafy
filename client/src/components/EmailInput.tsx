import { useState, useEffect } from 'react';
import type { SpamTrigger } from '../types';
import { RichTextEditor, type ImageData } from './RichTextEditor';
import { HighlightedInput } from './HighlightedInput';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { ChevronDown, Plus, X, AlertTriangle, Sparkles, Mail, Building2, FileType, Download, Loader2, CheckCircle2, AlertCircle, ExternalLink } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Variation {
  subject: string;
  previewText: string;
}

export const INDUSTRIES = [
  { value: '', label: 'No specific industry (General)' },
  { value: 'saas', label: 'SaaS / Software' },
  { value: 'ecommerce', label: 'E-commerce / Retail' },
  { value: 'real_estate', label: 'Real Estate' },
  { value: 'finance', label: 'Finance / Banking' },
  { value: 'healthcare', label: 'Healthcare' },
  { value: 'agency', label: 'Marketing Agency' },
  { value: 'education', label: 'Education / Coaching' },
  { value: 'recruiting', label: 'Recruiting / HR' },
  { value: 'nonprofit', label: 'Nonprofit' },
  { value: 'consulting', label: 'Consulting / Professional Services' },
] as const;

export const EMAIL_TYPES = [
  { value: '', label: 'No specific type (General)' },
  { value: 'cold_outreach', label: 'Cold Outreach / Sales' },
  { value: 'newsletter', label: 'Newsletter' },
  { value: 'promotional', label: 'Promotional / Sale' },
  { value: 'transactional', label: 'Transactional' },
  { value: 'welcome', label: 'Welcome / Onboarding' },
  { value: 'nurture', label: 'Nurture / Drip Sequence' },
  { value: 'winback', label: 'Win-back / Re-engagement' },
  { value: 'announcement', label: 'Product Announcement' },
  { value: 'event', label: 'Event / Webinar Invite' },
] as const;

export type Industry = typeof INDUSTRIES[number]['value'];
export type EmailType = typeof EMAIL_TYPES[number]['value'];

interface EmailInputProps {
  variations: Variation[];
  setVariations: React.Dispatch<React.SetStateAction<Variation[]>>;
  body: string;
  setBody: (value: string) => void;
  onGrade: () => void;
  isLoading: boolean;
  spamTriggers: SpamTrigger[];
  industry: Industry;
  setIndustry: (value: Industry) => void;
  emailType: EmailType;
  setEmailType: (value: EmailType) => void;
  onImagesChange?: (images: ImageData[]) => void;
}

const SUBJECT_CHAR_LIMIT = 100;
const PREVIEW_CHAR_LIMIT = 250;

interface ESPConnection {
  provider: string;
  isConnected: boolean;
  accountEmail?: string;
}

interface Campaign {
  campaignId: string;
  campaignName: string;
  subject?: string;
  sentAt?: string;
  sent?: number;
  openRate?: number;
}

export const EmailInput: React.FC<EmailInputProps> = ({
  variations,
  setVariations,
  body,
  setBody,
  onGrade,
  isLoading,
  spamTriggers,
  industry,
  setIndustry,
  emailType,
  setEmailType,
  onImagesChange,
}) => {
  const [openVariations, setOpenVariations] = useState<Set<number>>(new Set());
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [espConnections, setEspConnections] = useState<ESPConnection[]>([]);
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [isLoadingESPs, setIsLoadingESPs] = useState(false);
  const [isLoadingCampaigns, setIsLoadingCampaigns] = useState(false);
  const [isImportingContent, setIsImportingContent] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    setOpenVariations(new Set(variations.map((_, i) => i)));
  }, [variations.length]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onGrade();
  };

  const handleVariationChange = (index: number, field: keyof Variation, value: string) => {
    const newVariations = [...variations];
    newVariations[index][field] = value;
    setVariations(newVariations);
  };

  const addVariation = () => {
    const newIndex = variations.length;
    setVariations([...variations, { subject: '', previewText: '' }]);
    setOpenVariations(prev => new Set(prev).add(newIndex));
  };

  const removeVariation = (index: number) => {
    const newVariations = variations.filter((_, i) => i !== index);
    setVariations(newVariations);
    setOpenVariations(prev => {
      const newSet = new Set(prev);
      newSet.delete(index);
      return newSet;
    });
  };

  const toggleVariation = (index: number) => {
    setOpenVariations(prev => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  const openImportModal = async () => {
    setIsImportModalOpen(true);
    setSelectedProvider(null);
    setCampaigns([]);
    setIsLoadingESPs(true);
    
    try {
      const response = await fetch('/api/esp/connections', { credentials: 'include' });
      if (response.ok) {
        const data = await response.json();
        const connected = data.filter((c: ESPConnection) => c.isConnected);
        setEspConnections(connected);
      }
    } catch (error) {
      console.error('Failed to fetch ESP connections:', error);
      toast({
        title: 'Error',
        description: 'Failed to load your ESP connections',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingESPs(false);
    }
  };

  const selectProvider = async (provider: string) => {
    setSelectedProvider(provider);
    setIsLoadingCampaigns(true);
    setCampaigns([]);
    
    try {
      const response = await fetch(`/api/esp/stats/${provider}?limit=20`, { credentials: 'include' });
      if (response.ok) {
        const data = await response.json();
        const campaignsList = data.campaigns || data.stats?.campaigns || [];
        if (Array.isArray(campaignsList)) {
          setCampaigns(campaignsList);
        }
      }
    } catch (error) {
      console.error('Failed to fetch campaigns:', error);
      toast({
        title: 'Error',
        description: 'Failed to load campaigns from this ESP',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingCampaigns(false);
    }
  };

  const importCampaign = async (campaign: Campaign) => {
    if (!selectedProvider) return;
    
    setIsImportingContent(campaign.campaignId);
    
    try {
      const response = await fetch(`/api/esp/${selectedProvider}/campaign/${campaign.campaignId}/content`, { credentials: 'include' });
      if (response.ok) {
        const data = await response.json();
        
        if (data.htmlContent || data.textContent) {
          const textContent = data.textContent || stripHtml(data.htmlContent);
          setBody(textContent);
          
          if (campaign.subject || data.subject) {
            const newSubject = campaign.subject || data.subject || '';
            const newPreviewText = data.previewText || '';
            setVariations(prev => {
              const updated = [...prev];
              if (updated.length > 0) {
                updated[0] = { subject: newSubject, previewText: newPreviewText };
              } else {
                updated.push({ subject: newSubject, previewText: newPreviewText });
              }
              return updated;
            });
          }
          
          setIsImportModalOpen(false);
          toast({
            title: 'Email Imported',
            description: `"${campaign.campaignName}" has been loaded into the grader`,
          });
        } else {
          toast({
            title: 'No Content Available',
            description: 'This campaign does not have accessible email content',
            variant: 'destructive',
          });
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        toast({
          title: 'Import Failed',
          description: errorData.error || 'Could not fetch campaign content',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Failed to import campaign:', error);
      toast({
        title: 'Error',
        description: 'Failed to import campaign content',
        variant: 'destructive',
      });
    } finally {
      setIsImportingContent(null);
    }
  };

  const stripHtml = (html: string): string => {
    if (typeof document !== 'undefined') {
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = html;
      return tempDiv.textContent || tempDiv.innerText || '';
    }
    return html.replace(/<[^>]*>/g, '');
  };

  const getProviderLabel = (provider: string) => {
    const labels: Record<string, string> = {
      sendgrid: 'SendGrid',
      mailchimp: 'Mailchimp',
      hubspot: 'HubSpot',
      klaviyo: 'Klaviyo',
      ontraport: 'Ontraport',
      highlevel: 'HighLevel',
    };
    return labels[provider] || provider;
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 animate-fade-in">
      <Card className="card-lift">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500">
                <Mail className="w-5 h-5 text-white" />
              </div>
              <div>
                <CardTitle>Email Content</CardTitle>
                <CardDescription>Enter your email to analyze</CardDescription>
              </div>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={openImportModal}
              disabled={isLoading}
              data-testid="button-import-from-esp"
            >
              <Download className="w-4 h-4 mr-2" />
              Import from ESP
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid md:grid-cols-2 gap-4 p-4 rounded-lg bg-muted/30 border border-border/50">
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
                <Building2 className="w-4 h-4" />
                Industry (Optional)
              </label>
              <Select value={industry} onValueChange={(val) => setIndustry(val as Industry)}>
                <SelectTrigger className="w-full" data-testid="select-industry">
                  <SelectValue placeholder="Select your industry for benchmarks" />
                </SelectTrigger>
                <SelectContent>
                  {INDUSTRIES.map((ind) => (
                    <SelectItem key={ind.value} value={ind.value || '_none'} data-testid={`option-industry-${ind.value || 'none'}`}>
                      {ind.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">Get industry-specific benchmarks and feedback</p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
                <FileType className="w-4 h-4" />
                Email Type (Optional)
              </label>
              <Select value={emailType} onValueChange={(val) => setEmailType(val as EmailType)}>
                <SelectTrigger className="w-full" data-testid="select-email-type">
                  <SelectValue placeholder="Select email type for benchmarks" />
                </SelectTrigger>
                <SelectContent>
                  {EMAIL_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value || '_none'} data-testid={`option-email-type-${type.value || 'none'}`}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">Tailored advice for your email purpose</p>
            </div>
          </div>

          {variations.map((variation, index) => {
            const isOpen = openVariations.has(index);
            const subjectLength = variation.subject.length;
            const isSubjectOverLimit = subjectLength > SUBJECT_CHAR_LIMIT;
            const previewLength = variation.previewText.length;
            const isPreviewOverLimit = previewLength > PREVIEW_CHAR_LIMIT;

            return (
              <div 
                key={index} 
                className="rounded-lg border border-border bg-card/50 transition-all duration-300 hover:border-primary/30"
              >
                <button
                  type="button"
                  onClick={() => toggleVariation(index)}
                  aria-expanded={isOpen}
                  className={`w-full flex justify-between items-center text-left p-4 transition-colors group ${isOpen ? 'rounded-t-lg' : 'rounded-lg'}`}
                  data-testid={`button-toggle-variation-${index}`}
                >
                  <div className="flex items-center gap-3">
                    <Badge variant="secondary" className="px-2 py-0.5">
                      {index + 1}
                    </Badge>
                    <span className="font-medium text-foreground group-hover:text-primary transition-colors">
                      Subject Variation {index > 0 ? index + 1 : ''}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {variations.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeVariation(index);
                        }}
                        className="text-muted-foreground hover:text-destructive"
                        data-testid={`button-remove-variation-${index}`}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                    <ChevronDown className={`w-5 h-5 text-muted-foreground transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
                  </div>
                </button>
                
                <div className={`grid transition-all duration-500 ease-in-out ${isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
                  <div className="overflow-hidden">
                    <div className="space-y-4 p-4 border-t border-border">
                      <div>
                        <div className="flex justify-between items-baseline mb-2">
                          <label htmlFor={`subject-${index}`} className="text-sm font-medium text-muted-foreground">
                            Subject Line
                          </label>
                          <span className={`text-xs transition-colors ${isSubjectOverLimit ? 'text-destructive font-bold' : 'text-muted-foreground'}`}>
                            {subjectLength} / {SUBJECT_CHAR_LIMIT}
                          </span>
                        </div>
                        <div className="relative">
                          <HighlightedInput
                            id={`subject-${index}`}
                            type="text"
                            value={variation.subject}
                            onChange={(e) => handleVariationChange(index, 'subject', e.target.value)}
                            placeholder="e.g., Big News! Our Summer Sale is Here!"
                            className={`w-full bg-muted/50 border rounded-lg focus:outline-none transition-all duration-300 ${
                              isSubjectOverLimit 
                                ? 'border-destructive ring-2 ring-destructive/20' 
                                : 'border-border focus:border-primary focus:ring-2 focus:ring-primary/20'
                            }`}
                            disabled={isLoading}
                            spamTriggers={spamTriggers}
                          />
                          {isSubjectOverLimit && (
                            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                              <AlertTriangle className="h-4 w-4 text-destructive" />
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div>
                        <div className="flex justify-between items-baseline mb-2">
                          <label htmlFor={`preview-${index}`} className="text-sm font-medium text-muted-foreground">
                            Preview Text
                          </label>
                          <span className={`text-xs transition-colors ${isPreviewOverLimit ? 'text-destructive font-bold' : 'text-muted-foreground'}`}>
                            {previewLength} / {PREVIEW_CHAR_LIMIT}
                          </span>
                        </div>
                        <div className="relative">
                          <HighlightedInput
                            id={`preview-${index}`}
                            type="text"
                            value={variation.previewText}
                            onChange={(e) => handleVariationChange(index, 'previewText', e.target.value)}
                            placeholder="e.g., Don't miss out on guaranteed savings..."
                            className={`w-full bg-muted/50 border rounded-lg focus:outline-none transition-all duration-300 ${
                              isPreviewOverLimit 
                                ? 'border-destructive ring-2 ring-destructive/20' 
                                : 'border-border focus:border-primary focus:ring-2 focus:ring-primary/20'
                            }`}
                            disabled={isLoading}
                            spamTriggers={spamTriggers}
                          />
                          {isPreviewOverLimit && (
                            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                              <AlertTriangle className="h-4 w-4 text-destructive" />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          <Button
            type="button"
            variant="secondary"
            onClick={addVariation}
            disabled={isLoading}
            className="w-full"
            data-testid="button-add-variation"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Variation
          </Button>

          <div className="space-y-3">
            <div>
              <label htmlFor="body" className="text-sm font-medium text-muted-foreground mb-2 block">
                Email Body
              </label>
              <p className="text-xs text-muted-foreground mb-2">
                Paste email content with images, or drag and drop images directly
              </p>
              <RichTextEditor
                content={body}
                onChange={setBody}
                placeholder="Hi [Name]... (paste or type your email content, including images)"
                onImagesChange={onImagesChange}
              />
            </div>
          </div>

          {/* Spam Triggers Section - displayed separately with proper spacing */}
          {spamTriggers && spamTriggers.filter(t => (t.word || t.phrase || '').trim().length > 0).length > 0 && (
            <div className="flex flex-wrap items-center gap-2 p-3 bg-muted/80 rounded-lg border border-border">
              <div className="flex items-center gap-1 text-sm text-muted-foreground mr-2">
                <AlertTriangle className="w-4 h-4" />
                <span>Spam triggers found:</span>
              </div>
              {spamTriggers.filter(t => (t.word || t.phrase || '').trim().length > 0).map((trigger, index) => {
                const word = (trigger.word || trigger.phrase || '').trim();
                const severityStyles = trigger.severity === 'High' 
                  ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-300 dark:border-red-700'
                  : trigger.severity === 'Medium'
                  ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 border-yellow-300 dark:border-yellow-700'
                  : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-300 dark:border-blue-700';
                return (
                  <Badge 
                    key={index} 
                    variant="outline"
                    className={`${severityStyles} border`}
                    title={trigger.reason}
                  >
                    {word}
                  </Badge>
                );
              })}
            </div>
          )}

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full h-12 text-lg font-bold bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 shadow-lg shadow-purple-500/25"
            data-testid="button-grade-email"
          >
            {isLoading ? (
              <>
                <Sparkles className="w-5 h-5 mr-2 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5 mr-2" />
                Grade My Email
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      <Dialog open={isImportModalOpen} onOpenChange={setIsImportModalOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Download className="w-5 h-5" />
              Import Email from ESP
            </DialogTitle>
            <DialogDescription>
              Select a connected ESP and choose a campaign to import into the grader
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-auto space-y-4 py-4">
            {isLoadingESPs ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                <span className="ml-2 text-muted-foreground">Loading your ESPs...</span>
              </div>
            ) : espConnections.length === 0 ? (
              <div className="text-center py-8 space-y-4">
                <AlertCircle className="w-12 h-12 mx-auto text-muted-foreground" />
                <div>
                  <p className="text-lg font-medium">No ESPs Connected</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Connect an ESP in the Deliverability section to import campaigns
                  </p>
                </div>
                <Button
                  variant="outline"
                  onClick={() => setIsImportModalOpen(false)}
                >
                  Close
                </Button>
              </div>
            ) : !selectedProvider ? (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">Select an ESP:</p>
                <div className="grid gap-2">
                  {espConnections.map((esp) => (
                    <button
                      key={esp.provider}
                      type="button"
                      onClick={() => selectProvider(esp.provider)}
                      className="flex items-center justify-between p-4 rounded-lg border border-border bg-card hover-elevate transition-all"
                      data-testid={`button-select-esp-${esp.provider}`}
                    >
                      <div className="flex items-center gap-3">
                        <CheckCircle2 className="w-5 h-5 text-green-500" />
                        <div className="text-left">
                          <p className="font-medium">{getProviderLabel(esp.provider)}</p>
                          {esp.accountEmail && (
                            <p className="text-xs text-muted-foreground">{esp.accountEmail}</p>
                          )}
                        </div>
                      </div>
                      <ExternalLink className="w-4 h-4 text-muted-foreground" />
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedProvider(null)}
                  >
                    <ChevronDown className="w-4 h-4 mr-1 rotate-90" />
                    Back to ESPs
                  </Button>
                  <Badge variant="secondary">{getProviderLabel(selectedProvider)}</Badge>
                </div>

                {isLoadingCampaigns ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                    <span className="ml-2 text-muted-foreground">Loading campaigns...</span>
                  </div>
                ) : campaigns.length === 0 ? (
                  <div className="text-center py-8 space-y-2">
                    <AlertCircle className="w-10 h-10 mx-auto text-muted-foreground" />
                    <p className="text-muted-foreground">No campaigns found</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[400px] overflow-auto">
                    <p className="text-sm text-muted-foreground">
                      Select a campaign to import ({campaigns.length} available):
                    </p>
                    {campaigns.map((campaign) => (
                      <button
                        key={campaign.campaignId}
                        type="button"
                        onClick={() => importCampaign(campaign)}
                        disabled={isImportingContent === campaign.campaignId}
                        className="w-full flex items-center justify-between p-4 rounded-lg border border-border bg-card hover-elevate transition-all disabled:opacity-50"
                        data-testid={`button-import-campaign-${campaign.campaignId}`}
                      >
                        <div className="text-left flex-1 min-w-0">
                          <p className="font-medium truncate">{campaign.campaignName}</p>
                          {campaign.subject && (
                            <p className="text-sm text-muted-foreground truncate">
                              Subject: {campaign.subject}
                            </p>
                          )}
                          <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                            {campaign.sentAt && (
                              <span>Sent: {new Date(campaign.sentAt).toLocaleDateString()}</span>
                            )}
                            {campaign.sent !== undefined && (
                              <span>{campaign.sent.toLocaleString()} sent</span>
                            )}
                            {campaign.openRate !== undefined && (
                              <span>{campaign.openRate.toFixed(1)}% opened</span>
                            )}
                          </div>
                        </div>
                        {isImportingContent === campaign.campaignId ? (
                          <Loader2 className="w-5 h-5 animate-spin ml-3 shrink-0" />
                        ) : (
                          <Download className="w-5 h-5 ml-3 shrink-0 text-muted-foreground" />
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </form>
  );
};
