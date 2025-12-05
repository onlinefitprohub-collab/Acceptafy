import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Monitor, Smartphone, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { GmailIcon, OutlookIcon, AppleMailIcon } from './icons/CategoryIcons';
import { useToast } from '@/hooks/use-toast';
import type { EmailPreview } from '../types';

export const EmailPreviewTool: React.FC = () => {
  const { toast } = useToast();
  const [subject, setSubject] = useState('');
  const [previewText, setPreviewText] = useState('');
  const [senderName, setSenderName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [preview, setPreview] = useState<EmailPreview | null>(null);
  const [viewMode, setViewMode] = useState<'desktop' | 'mobile'>('desktop');

  const handleGenerate = async () => {
    if (!subject.trim()) return;
    
    setIsLoading(true);
    try {
      const response = await fetch('/api/email/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          subject: subject.trim(), 
          previewText: previewText.trim() || subject.trim(),
          senderName: senderName.trim() || 'Your Brand'
        })
      });
      if (response.ok) {
        const data = await response.json();
        setPreview(data);
      } else {
        toast({
          title: "Preview Failed",
          description: "Could not generate email preview. Please try again.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Failed to generate preview:', error);
      toast({
        title: "Connection Error",
        description: "Failed to connect to the preview service. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const ClientPreviewCard: React.FC<{
    name: string;
    icon: React.ReactNode;
    inboxDisplay: string;
    mobileDisplay: string;
    bgColor: string;
  }> = ({ name, icon, inboxDisplay, mobileDisplay, bgColor }) => (
    <Card className="overflow-hidden">
      <div className={`${bgColor} px-4 py-3 flex items-center gap-2`}>
        {icon}
        <span className="font-semibold text-foreground">{name}</span>
        <Badge variant="secondary" className="ml-auto text-xs">
          {viewMode === 'desktop' ? 'Desktop' : 'Mobile'}
        </Badge>
      </div>
      <CardContent className="p-4">
        <div className="bg-muted/50 rounded-lg p-3 border border-border">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold flex-shrink-0">
              {(senderName.trim() || 'YB').charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-foreground truncate">
                {senderName.trim() || 'Your Brand'}
              </p>
              <p className="text-sm text-muted-foreground truncate mt-0.5">
                {viewMode === 'desktop' ? inboxDisplay : mobileDisplay}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <Card className="card-lift">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500">
              <Monitor className="w-5 h-5 text-white" />
            </div>
            <div>
              <CardTitle>Email Client Preview</CardTitle>
              <CardDescription>See how your email appears across Gmail, Outlook, and Apple Mail</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Subject Line</label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Enter your email subject line"
                className="w-full bg-muted border border-border rounded-lg p-3 text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary outline-none"
                data-testid="input-preview-subject"
              />
              <p className="text-xs text-muted-foreground mt-1">
                {subject.length}/70 characters (50 for mobile)
              </p>
            </div>
            
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Preview Text</label>
              <input
                type="text"
                value={previewText}
                onChange={(e) => setPreviewText(e.target.value)}
                placeholder="The snippet shown after the subject line"
                className="w-full bg-muted border border-border rounded-lg p-3 text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary outline-none"
                data-testid="input-preview-text"
              />
              <p className="text-xs text-muted-foreground mt-1">
                {previewText.length}/90 characters (40-90 recommended)
              </p>
            </div>

            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Sender Name (optional)</label>
              <input
                type="text"
                value={senderName}
                onChange={(e) => setSenderName(e.target.value)}
                placeholder="Your Brand"
                className="w-full bg-muted border border-border rounded-lg p-3 text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary outline-none"
                data-testid="input-sender-name"
              />
            </div>
          </div>

          <Button
            onClick={handleGenerate}
            disabled={isLoading || !subject.trim()}
            className="w-full bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600"
            data-testid="button-generate-preview"
          >
            {isLoading ? 'Generating Preview...' : 'Generate Preview'}
          </Button>
        </CardContent>
      </Card>

      {preview && (
        <div className="space-y-4 animate-fade-in">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-foreground">Preview Results</h3>
            <div className="flex items-center gap-2 p-1 bg-muted rounded-lg">
              <Button
                size="sm"
                variant={viewMode === 'desktop' ? 'default' : 'ghost'}
                onClick={() => setViewMode('desktop')}
                className="gap-1.5"
                data-testid="button-view-desktop"
              >
                <Monitor className="w-4 h-4" />
                Desktop
              </Button>
              <Button
                size="sm"
                variant={viewMode === 'mobile' ? 'default' : 'ghost'}
                onClick={() => setViewMode('mobile')}
                className="gap-1.5"
                data-testid="button-view-mobile"
              >
                <Smartphone className="w-4 h-4" />
                Mobile
              </Button>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            <ClientPreviewCard
              name="Gmail"
              icon={<GmailIcon className="w-5 h-5" />}
              inboxDisplay={preview.gmail.inboxDisplay}
              mobileDisplay={preview.gmail.mobileDisplay}
              bgColor="bg-red-500/10"
            />
            <ClientPreviewCard
              name="Outlook"
              icon={<OutlookIcon className="w-5 h-5" />}
              inboxDisplay={preview.outlook.inboxDisplay}
              mobileDisplay={preview.outlook.mobileDisplay}
              bgColor="bg-blue-500/10"
            />
            <ClientPreviewCard
              name="Apple Mail"
              icon={<AppleMailIcon className="w-5 h-5" />}
              inboxDisplay={preview.apple.inboxDisplay}
              mobileDisplay={preview.apple.mobileDisplay}
              bgColor="bg-gray-500/10"
            />
          </div>

          <Card>
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center gap-2">
                <h4 className="font-semibold text-foreground">Character Analysis</h4>
              </div>
              
              <div className="grid sm:grid-cols-2 gap-3">
                <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
                  {preview.characterCounts.subjectOptimal ? (
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                  ) : (
                    <AlertTriangle className="w-5 h-5 text-yellow-500" />
                  )}
                  <div>
                    <p className="text-sm font-medium text-foreground">Subject Length</p>
                    <p className="text-xs text-muted-foreground">
                      {preview.characterCounts.subject} chars {preview.characterCounts.subjectOptimal ? '(optimal)' : '(may truncate)'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
                  {preview.characterCounts.previewOptimal ? (
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                  ) : (
                    <AlertTriangle className="w-5 h-5 text-yellow-500" />
                  )}
                  <div>
                    <p className="text-sm font-medium text-foreground">Preview Length</p>
                    <p className="text-xs text-muted-foreground">
                      {preview.characterCounts.preview} chars {preview.characterCounts.previewOptimal ? '(optimal)' : '(not ideal)'}
                    </p>
                  </div>
                </div>
              </div>

              {preview.truncationWarnings.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-yellow-500 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4" />
                    Truncation Warnings
                  </p>
                  <ul className="space-y-1">
                    {preview.truncationWarnings.map((warning, i) => (
                      <li key={i} className="text-sm text-muted-foreground pl-6">
                        • {warning}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};
