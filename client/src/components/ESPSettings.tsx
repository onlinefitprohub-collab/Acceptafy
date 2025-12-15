import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { 
  Link2, 
  Unlink, 
  Check, 
  Loader2, 
  Key, 
  ExternalLink,
  Mail,
  BarChart3,
  Send,
  AlertCircle
} from 'lucide-react';

export type ESPProvider = 'sendgrid' | 'mailchimp' | 'activecampaign' | 'hubspot' | 'constantcontact' | 'convertkit' | 'klaviyo' | 'drip' | 'aweber' | 'highlevel' | 'ontraport' | 'keap';

interface ESPConnection {
  provider: ESPProvider;
  connected: boolean;
  apiKey?: string;
  accountName?: string;
  lastSync?: string;
}

interface ESPProviderInfo {
  id: ESPProvider;
  name: string;
  description: string;
  color: string;
  gradient: string;
  features: string[];
  authType: 'api_key' | 'oauth' | 'api_key_url';
  docsUrl: string;
  fields: { key: string; label: string; placeholder: string; type?: string }[];
}

const ESP_PROVIDERS: ESPProviderInfo[] = [
  {
    id: 'ontraport',
    name: 'Ontraport',
    description: 'Business automation for growing companies',
    color: 'rose',
    gradient: 'from-rose-500 to-pink-500',
    features: ['Email Sending', 'Campaign Stats', 'Contact Management'],
    authType: 'api_key',
    docsUrl: 'https://api.ontraport.com/doc/',
    fields: [
      { key: 'appId', label: 'App ID', placeholder: 'Your App ID' },
      { key: 'apiKey', label: 'API Key', placeholder: 'Your API key', type: 'password' }
    ]
  },
  {
    id: 'highlevel',
    name: 'HighLevel',
    description: 'All-in-one CRM and marketing automation',
    color: 'green',
    gradient: 'from-green-500 to-emerald-500',
    features: ['Email Sending', 'Campaign Stats', 'CRM Sync'],
    authType: 'api_key',
    docsUrl: 'https://highlevel.stoplight.io/docs/integrations',
    fields: [
      { key: 'apiKey', label: 'API Key', placeholder: 'Your HighLevel API key', type: 'password' }
    ]
  },
  {
    id: 'sendgrid',
    name: 'SendGrid',
    description: 'Reliable email delivery with powerful analytics',
    color: 'blue',
    gradient: 'from-blue-500 to-cyan-500',
    features: ['Email Sending', 'Campaign Stats', 'Deliverability Tracking'],
    authType: 'api_key',
    docsUrl: 'https://docs.sendgrid.com/for-developers/sending-email/api-getting-started',
    fields: [
      { key: 'apiKey', label: 'API Key', placeholder: 'SG.xxxxxxxxxx', type: 'password' }
    ]
  },
  {
    id: 'mailchimp',
    name: 'Mailchimp',
    description: 'All-in-one marketing platform for email campaigns',
    color: 'yellow',
    gradient: 'from-yellow-500 to-orange-500',
    features: ['Email Sending', 'Campaign Stats', 'Audience Insights'],
    authType: 'api_key',
    docsUrl: 'https://mailchimp.com/developer/marketing/guides/quick-start/',
    fields: [
      { key: 'apiKey', label: 'API Key', placeholder: 'xxxxxxxxxx-us1', type: 'password' }
    ]
  },
  {
    id: 'activecampaign',
    name: 'ActiveCampaign',
    description: 'Marketing automation with CRM integration',
    color: 'indigo',
    gradient: 'from-indigo-500 to-purple-500',
    features: ['Email Sending', 'Campaign Stats', 'Automation Metrics'],
    authType: 'api_key_url',
    docsUrl: 'https://developers.activecampaign.com/reference/overview',
    fields: [
      { key: 'apiUrl', label: 'API URL', placeholder: 'https://youraccountname.api-us1.com' },
      { key: 'apiKey', label: 'API Key', placeholder: 'Your API key', type: 'password' }
    ]
  },
  {
    id: 'keap',
    name: 'Keap',
    description: 'CRM and sales & marketing automation',
    color: 'teal',
    gradient: 'from-teal-500 to-cyan-500',
    features: ['Email Sending', 'Campaign Stats', 'Sales Pipeline'],
    authType: 'oauth',
    docsUrl: 'https://developer.keap.com/docs/restv2/',
    fields: []
  },
  {
    id: 'hubspot',
    name: 'HubSpot',
    description: 'Inbound marketing, sales, and CRM platform',
    color: 'orange',
    gradient: 'from-orange-500 to-red-500',
    features: ['Email Sending', 'Campaign Stats', 'CRM Integration'],
    authType: 'api_key',
    docsUrl: 'https://developers.hubspot.com/docs/api/overview',
    fields: [
      { key: 'apiKey', label: 'Private App Access Token', placeholder: 'pat-na1-xxxxxxxxxx', type: 'password' }
    ]
  },
  {
    id: 'constantcontact',
    name: 'Constant Contact',
    description: 'Email marketing for small businesses',
    color: 'blue',
    gradient: 'from-blue-600 to-blue-400',
    features: ['Email Sending', 'Campaign Stats', 'Contact Lists'],
    authType: 'api_key',
    docsUrl: 'https://developer.constantcontact.com/api_guide/',
    fields: [
      { key: 'apiKey', label: 'API Key', placeholder: 'Your API key', type: 'password' }
    ]
  },
  {
    id: 'convertkit',
    name: 'ConvertKit',
    description: 'Email marketing for creators and bloggers',
    color: 'red',
    gradient: 'from-red-500 to-rose-500',
    features: ['Email Sending', 'Campaign Stats', 'Subscriber Tags'],
    authType: 'api_key',
    docsUrl: 'https://developers.convertkit.com/',
    fields: [
      { key: 'apiKey', label: 'API Key', placeholder: 'Your API key', type: 'password' }
    ]
  },
  {
    id: 'klaviyo',
    name: 'Klaviyo',
    description: 'E-commerce email and SMS marketing',
    color: 'emerald',
    gradient: 'from-emerald-500 to-green-500',
    features: ['Email Sending', 'Campaign Stats', 'E-commerce Flows'],
    authType: 'api_key',
    docsUrl: 'https://developers.klaviyo.com/en',
    fields: [
      { key: 'apiKey', label: 'Private API Key', placeholder: 'pk_xxxxxxxxxx', type: 'password' }
    ]
  },
  {
    id: 'drip',
    name: 'Drip',
    description: 'E-commerce CRM and automation platform',
    color: 'violet',
    gradient: 'from-violet-500 to-purple-500',
    features: ['Email Sending', 'Campaign Stats', 'Automation Workflows'],
    authType: 'api_key',
    docsUrl: 'https://developer.drip.com/',
    fields: [
      { key: 'apiKey', label: 'API Key', placeholder: 'Your API key', type: 'password' },
      { key: 'accountId', label: 'Account ID', placeholder: 'Your account ID' }
    ]
  },
  {
    id: 'aweber',
    name: 'AWeber',
    description: 'Email marketing and automation for creators',
    color: 'sky',
    gradient: 'from-sky-500 to-blue-500',
    features: ['Email Sending', 'Campaign Stats', 'Broadcast Emails'],
    authType: 'api_key',
    docsUrl: 'https://api.aweber.com/',
    fields: [
      { key: 'apiKey', label: 'API Key', placeholder: 'Your API key', type: 'password' }
    ]
  }
];

interface ESPSettingsProps {
  connections: ESPConnection[];
  onConnect: (provider: ESPProvider, credentials: Record<string, string>) => Promise<void>;
  onDisconnect: (provider: ESPProvider) => Promise<void>;
}

export function ESPSettings({ connections, onConnect, onDisconnect }: ESPSettingsProps) {
  const { toast } = useToast();
  const [expandedProvider, setExpandedProvider] = useState<ESPProvider | null>(null);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [connecting, setConnecting] = useState<ESPProvider | null>(null);
  const [disconnecting, setDisconnecting] = useState<ESPProvider | null>(null);

  const getConnection = (provider: ESPProvider) => {
    return connections.find(c => c.provider === provider);
  };

  const handleConnect = async (provider: ESPProviderInfo) => {
    if (provider.authType === 'oauth') {
      toast({
        title: "OAuth Coming Soon",
        description: `${provider.name} uses OAuth authentication which will be available soon.`,
      });
      return;
    }

    const missingFields = provider.fields.filter(f => !formData[f.key]?.trim());
    if (missingFields.length > 0) {
      toast({
        title: "Missing Information",
        description: `Please fill in: ${missingFields.map(f => f.label).join(', ')}`,
        variant: "destructive"
      });
      return;
    }

    setConnecting(provider.id);
    try {
      await onConnect(provider.id, formData);
      setFormData({});
      setExpandedProvider(null);
      toast({
        title: "Connected",
        description: `Successfully connected to ${provider.name}`,
      });
    } catch (error) {
      toast({
        title: "Connection Failed",
        description: error instanceof Error ? error.message : "Failed to connect",
        variant: "destructive"
      });
    } finally {
      setConnecting(null);
    }
  };

  const handleDisconnect = async (provider: ESPProviderInfo) => {
    setDisconnecting(provider.id);
    try {
      await onDisconnect(provider.id);
      toast({
        title: "Disconnected",
        description: `Disconnected from ${provider.name}`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to disconnect",
        variant: "destructive"
      });
    } finally {
      setDisconnecting(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
          Email Service Providers
        </h2>
        <p className="text-muted-foreground">
          Connect your ESP to send emails directly and import campaign statistics for AI-powered analysis.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {ESP_PROVIDERS.map((provider) => {
          const connection = getConnection(provider.id);
          const isExpanded = expandedProvider === provider.id;
          const isConnecting = connecting === provider.id;
          const isDisconnecting = disconnecting === provider.id;

          return (
            <Card 
              key={provider.id}
              className={`transition-all duration-300 ${
                connection?.connected 
                  ? `border-${provider.color}-500/30 bg-gradient-to-br from-${provider.color}-500/5 to-transparent` 
                  : 'hover:border-white/20'
              }`}
              data-testid={`esp-card-${provider.id}`}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${provider.gradient} flex items-center justify-center shadow-lg`}>
                      <Mail className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-base">{provider.name}</CardTitle>
                      <CardDescription className="text-xs mt-0.5">
                        {provider.description}
                      </CardDescription>
                    </div>
                  </div>
                  {connection?.connected && (
                    <Badge className="bg-green-500/20 text-green-400 border-green-500/30" data-testid={`status-connected-${provider.id}`}>
                      <Check className="w-3 h-3 mr-1" />
                      Connected
                    </Badge>
                  )}
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-1.5">
                  {provider.features.map((feature, i) => (
                    <Badge key={i} variant="secondary" className="text-xs" data-testid={`badge-feature-${provider.id}-${i}`}>
                      {feature === 'Email Sending' && <Send className="w-3 h-3 mr-1" />}
                      {feature === 'Campaign Stats' && <BarChart3 className="w-3 h-3 mr-1" />}
                      {feature}
                    </Badge>
                  ))}
                </div>

                {connection?.connected ? (
                  <div className="space-y-3">
                    {connection.accountName && (
                      <p className="text-sm text-muted-foreground" data-testid={`text-account-${provider.id}`}>
                        Account: <span className="text-foreground">{connection.accountName}</span>
                      </p>
                    )}
                    {connection.lastSync && (
                      <p className="text-xs text-muted-foreground" data-testid={`text-lastsync-${provider.id}`}>
                        Last synced: {connection.lastSync}
                      </p>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDisconnect(provider)}
                      disabled={isDisconnecting}
                      className="w-full text-red-400 border-red-500/30 hover:bg-red-500/10"
                      data-testid={`button-disconnect-${provider.id}`}
                    >
                      {isDisconnecting ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Unlink className="w-4 h-4 mr-2" />
                      )}
                      Disconnect
                    </Button>
                  </div>
                ) : (
                  <>
                    {provider.authType === 'oauth' ? (
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 text-xs text-amber-400" data-testid={`status-oauth-pending-${provider.id}`}>
                          <AlertCircle className="w-3 h-3" />
                          <span>OAuth integration coming soon</span>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled
                          className="w-full opacity-50"
                          data-testid={`button-oauth-${provider.id}`}
                        >
                          <Link2 className="w-4 h-4 mr-2" />
                          Connect with OAuth
                        </Button>
                      </div>
                    ) : isExpanded ? (
                      <div className="space-y-3">
                        {provider.fields.map((field) => (
                          <div key={field.key} className="space-y-1.5">
                            <Label className="text-xs">{field.label}</Label>
                            <Input
                              type={field.type || 'text'}
                              placeholder={field.placeholder}
                              value={formData[field.key] || ''}
                              onChange={(e) => setFormData({ ...formData, [field.key]: e.target.value })}
                              className="h-8 text-sm"
                              data-testid={`input-${provider.id}-${field.key}`}
                            />
                          </div>
                        ))}
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleConnect(provider)}
                            disabled={isConnecting}
                            className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500"
                            data-testid={`button-save-${provider.id}`}
                          >
                            {isConnecting ? (
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            ) : (
                              <Check className="w-4 h-4 mr-2" />
                            )}
                            Connect
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setExpandedProvider(null);
                              setFormData({});
                            }}
                            data-testid={`button-cancel-${provider.id}`}
                          >
                            Cancel
                          </Button>
                        </div>
                        <a
                          href={provider.docsUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                          data-testid={`link-docs-${provider.id}`}
                        >
                          <ExternalLink className="w-3 h-3" />
                          View API documentation
                        </a>
                      </div>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setExpandedProvider(provider.id)}
                        className="w-full"
                        data-testid={`button-connect-${provider.id}`}
                      >
                        <Key className="w-4 h-4 mr-2" />
                        Connect with API Key
                      </Button>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="border-dashed border-muted-foreground/30 bg-muted/5" data-testid="card-esp-feedback">
        <CardContent className="py-6 text-center">
          <p className="text-sm text-muted-foreground" data-testid="text-esp-feedback">
            Need a different ESP? <span className="text-purple-400">Let us know</span> which integrations you'd like to see.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
