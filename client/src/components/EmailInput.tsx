import { useState, useEffect } from 'react';
import type { SpamTrigger } from '../types';
import { HighlightedTextarea } from './HighlightedTextarea';
import { HighlightedInput } from './HighlightedInput';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChevronDown, Plus, X, AlertTriangle, Sparkles, Mail, Building2, FileType } from 'lucide-react';

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
}

const SUBJECT_CHAR_LIMIT = 100;
const PREVIEW_CHAR_LIMIT = 250;

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
}) => {
  const [openVariations, setOpenVariations] = useState<Set<number>>(new Set());

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

  return (
    <form onSubmit={handleSubmit} className="space-y-6 animate-fade-in">
      <Card className="card-lift">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500">
              <Mail className="w-5 h-5 text-white" />
            </div>
            <div>
              <CardTitle>Email Content</CardTitle>
              <CardDescription>Enter your email to analyze</CardDescription>
            </div>
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

          <div>
            <label htmlFor="body" className="text-sm font-medium text-muted-foreground mb-2 block">
              Email Body
            </label>
            <HighlightedTextarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              spamTriggers={spamTriggers}
              disabled={isLoading}
              placeholder="Hi [Name]..."
              className="w-full h-64 bg-muted/50 border border-border rounded-lg focus:outline-none transition-all duration-300 font-sans focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>

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
    </form>
  );
};
