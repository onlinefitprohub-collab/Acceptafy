import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Loader2, Send, CheckCircle2, AlertCircle } from 'lucide-react';
import type { ESPConnection } from '@shared/schema';

interface SendViaESPDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subject: string;
  body: string;
  previewText?: string;
}

const ESP_PROVIDER_NAMES: Record<string, string> = {
  sendgrid: 'SendGrid',
  mailchimp: 'Mailchimp',
  activecampaign: 'ActiveCampaign',
  hubspot: 'HubSpot',
  constantcontact: 'Constant Contact',
  convertkit: 'ConvertKit',
  klaviyo: 'Klaviyo',
  drip: 'Drip',
  aweber: 'AWeber',
  highlevel: 'HighLevel',
  ontraport: 'Ontraport',
  keap: 'Keap',
};

export function SendViaESPDialog({ 
  open, 
  onOpenChange, 
  subject, 
  body,
  previewText 
}: SendViaESPDialogProps) {
  const { toast } = useToast();
  const [selectedProvider, setSelectedProvider] = useState<string>('');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [fromEmail, setFromEmail] = useState('');
  const [fromName, setFromName] = useState('');
  const [sendSuccess, setSendSuccess] = useState(false);

  const { data: connections = [], isLoading: isLoadingConnections } = useQuery<ESPConnection[]>({
    queryKey: ['/api/esp/connections'],
    enabled: open,
  });

  const activeConnections = connections.filter(c => c.isConnected);

  useEffect(() => {
    if (open) {
      setSendSuccess(false);
      if (activeConnections.length > 0 && !selectedProvider) {
        setSelectedProvider(activeConnections[0].provider);
      }
    }
  }, [open, activeConnections, selectedProvider]);

  const sendMutation = useMutation({
    mutationFn: async (data: {
      provider: string;
      to: string;
      subject: string;
      html: string;
      from?: string;
      fromName?: string;
    }) => {
      const response = await apiRequest('POST', '/api/esp/send', data);
      return response.json();
    },
    onSuccess: (result) => {
      if (result.success) {
        setSendSuccess(true);
        toast({
          title: "Email Sent!",
          description: `Your email was sent to ${recipientEmail}`,
        });
      } else {
        toast({
          title: "Send Failed",
          description: result.error || 'Failed to send email',
          variant: "destructive"
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "An error occurred while sending the email",
        variant: "destructive"
      });
    }
  });

  const handleSend = () => {
    if (!selectedProvider || !recipientEmail) {
      toast({
        title: "Missing Information",
        description: "Please select a provider and enter a recipient email.",
        variant: "destructive"
      });
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(recipientEmail)) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address.",
        variant: "destructive"
      });
      return;
    }

    const htmlBody = body.replace(/\n/g, '<br>');
    
    sendMutation.mutate({
      provider: selectedProvider,
      to: recipientEmail,
      subject: subject,
      html: htmlBody,
      from: fromEmail || undefined,
      fromName: fromName || undefined,
    });
  };

  const handleClose = () => {
    onOpenChange(false);
    setRecipientEmail('');
    setFromEmail('');
    setFromName('');
    setSendSuccess(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md" data-testid="send-via-esp-dialog">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="w-5 h-5 text-purple-400" />
            Send via ESP
          </DialogTitle>
          <DialogDescription>
            Send this email through one of your connected email service providers.
          </DialogDescription>
        </DialogHeader>

        {isLoadingConnections ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-purple-400" />
          </div>
        ) : activeConnections.length === 0 ? (
          <div className="py-6 text-center" data-testid="no-esp-connected">
            <AlertCircle className="w-12 h-12 text-yellow-400 mx-auto mb-3" />
            <p className="text-muted-foreground mb-2">No ESP Connected</p>
            <p className="text-sm text-muted-foreground">
              Connect an email service provider in the ESP Settings to send emails.
            </p>
          </div>
        ) : sendSuccess ? (
          <div className="py-6 text-center" data-testid="send-success">
            <CheckCircle2 className="w-12 h-12 text-green-600 dark:text-green-400 mx-auto mb-3" />
            <p className="text-green-600 dark:text-green-400 font-medium mb-2">Email Sent!</p>
            <p className="text-sm text-muted-foreground">
              Email sent successfully via {ESP_PROVIDER_NAMES[selectedProvider] || selectedProvider}!
            </p>
          </div>
        ) : (
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="provider">Email Provider</Label>
              <Select value={selectedProvider} onValueChange={setSelectedProvider}>
                <SelectTrigger id="provider" data-testid="select-esp-provider">
                  <SelectValue placeholder="Select a provider" />
                </SelectTrigger>
                <SelectContent>
                  {activeConnections.map(conn => (
                    <SelectItem key={conn.provider} value={conn.provider}>
                      {ESP_PROVIDER_NAMES[conn.provider] || conn.provider}
                      {conn.accountName && ` (${conn.accountName})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="recipient">Recipient Email *</Label>
              <Input
                id="recipient"
                type="email"
                placeholder="recipient@example.com"
                value={recipientEmail}
                onChange={(e) => setRecipientEmail(e.target.value)}
                data-testid="input-recipient-email"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="fromEmail">From Email (optional)</Label>
              <Input
                id="fromEmail"
                type="email"
                placeholder="noreply@yourdomain.com"
                value={fromEmail}
                onChange={(e) => setFromEmail(e.target.value)}
                data-testid="input-from-email"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="fromName">From Name (optional)</Label>
              <Input
                id="fromName"
                placeholder="Your Company Name"
                value={fromName}
                onChange={(e) => setFromName(e.target.value)}
                data-testid="input-from-name"
              />
            </div>

            <div className="p-3 bg-muted/50 rounded-lg border border-border">
              <p className="text-xs text-muted-foreground mb-1">Subject:</p>
              <p className="text-sm font-medium truncate">{subject}</p>
            </div>

            {sendMutation.isError && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                <p className="text-sm text-red-600 dark:text-red-400">
                  {sendMutation.error?.message || 'Failed to send email'}
                </p>
              </div>
            )}
          </div>
        )}

        <DialogFooter className="gap-2">
          {sendSuccess ? (
            <Button onClick={handleClose} data-testid="button-close-dialog">
              Close
            </Button>
          ) : activeConnections.length > 0 ? (
            <>
              <Button variant="outline" onClick={handleClose} data-testid="button-cancel-send">
                Cancel
              </Button>
              <Button 
                onClick={handleSend} 
                disabled={sendMutation.isPending || !selectedProvider || !recipientEmail}
                className="gap-2"
                data-testid="button-send-email"
              >
                {sendMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                {sendMutation.isPending ? 'Sending...' : 'Send Email'}
              </Button>
            </>
          ) : (
            <Button onClick={handleClose} data-testid="button-close-dialog">
              Close
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
