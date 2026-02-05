import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Rocket, 
  Thermometer, 
  Key, 
  CheckCircle, 
  Wrench, 
  Zap,
  ArrowLeft,
  ExternalLink,
  Mail,
  Shield,
  Globe,
  Users,
  Clock,
  AlertTriangle,
  Info,
  DollarSign,
  Layers
} from 'lucide-react';

interface SectionProps {
  onBack?: () => void;
}

const BackButton = ({ onClick }: { onClick?: () => void }) => (
  <Button 
    variant="ghost" 
    size="sm" 
    onClick={onClick}
    className="mb-4"
    data-testid="button-highlevel-back"
  >
    <ArrowLeft className="w-4 h-4 mr-2" />
    Back to HighLevel Hub
  </Button>
);

const InfoCard = ({ title, children, icon: Icon, variant = 'default' }: { 
  title: string; 
  children: React.ReactNode; 
  icon?: React.ComponentType<{ className?: string }>;
  variant?: 'default' | 'warning' | 'success' | 'info';
}) => {
  const variants = {
    default: 'border-border',
    warning: 'border-amber-500/50 bg-amber-500/5',
    success: 'border-green-500/50 bg-green-500/5',
    info: 'border-blue-500/50 bg-blue-500/5'
  };
  
  return (
    <Card className={variants[variant]}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          {Icon && <Icon className="w-5 h-5" />}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground space-y-3">
        {children}
      </CardContent>
    </Card>
  );
};

export const HighLevelGettingStarted = ({ onBack }: SectionProps) => (
  <div className="space-y-6">
    {onBack && <BackButton onClick={onBack} />}
    
    <div className="space-y-2">
      <h3 className="text-xl font-bold flex items-center gap-2">
        <Rocket className="w-5 h-5 text-orange-500" />
        Getting Started with LC Email
      </h3>
      <p className="text-muted-foreground">
        LC Email is GoHighLevel's built-in email service provider that powers email sending with industry-leading deliverability.
      </p>
    </div>

    <div className="grid md:grid-cols-2 gap-4">
      <InfoCard title="What is LC Email?" icon={Mail}>
        <p>
          LC Email is an Email Service Provider (ESP) hosted by HighLevel. It helps agencies avoid the hassle of 
          setting up third-party providers like Mailgun or SendGrid.
        </p>
        <p>
          With LC Email, sending and receiving email works on every sub-account with minimal setup required.
        </p>
      </InfoCard>

      <InfoCard title="Why Use LC Email?" icon={CheckCircle} variant="success">
        <ul className="list-disc list-inside space-y-1">
          <li>Industry-leading deliverability</li>
          <li>Built-in error monitoring</li>
          <li>Compliance tools included</li>
          <li>Lower cost than alternatives</li>
          <li>Works out-of-the-box</li>
        </ul>
      </InfoCard>
    </div>

    <InfoCard title="LC Email Pricing" icon={DollarSign}>
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="p-4 rounded-lg bg-muted/50">
          <p className="font-semibold text-foreground">Email Sending</p>
          <p className="text-2xl font-bold text-foreground">$0.675</p>
          <p className="text-xs">per 1,000 emails</p>
        </div>
        <div className="p-4 rounded-lg bg-muted/50">
          <p className="font-semibold text-foreground">Email Validation</p>
          <p className="text-2xl font-bold text-foreground">$2.50</p>
          <p className="text-xs">per 1,000 verifications</p>
        </div>
      </div>
      <p className="text-xs mt-2">
        Note: All incoming and outgoing emails (To, CC, and BCC) incur charges.
      </p>
    </InfoCard>

    <InfoCard title="LC Email vs Custom SMTP" icon={Globe}>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b">
              <th className="text-left py-2 font-semibold">Feature</th>
              <th className="text-left py-2 font-semibold">LC Email</th>
              <th className="text-left py-2 font-semibold">Custom SMTP</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b">
              <td className="py-2">Setup</td>
              <td className="py-2"><Badge variant="secondary">Minimal</Badge></td>
              <td className="py-2"><Badge variant="outline">Manual</Badge></td>
            </tr>
            <tr className="border-b">
              <td className="py-2">Dedicated Domain</td>
              <td className="py-2"><Badge variant="secondary">Built-in</Badge></td>
              <td className="py-2"><Badge variant="outline">External</Badge></td>
            </tr>
            <tr className="border-b">
              <td className="py-2">Support</td>
              <td className="py-2"><Badge variant="secondary">HighLevel</Badge></td>
              <td className="py-2"><Badge variant="outline">Provider</Badge></td>
            </tr>
            <tr>
              <td className="py-2">Cold Email</td>
              <td className="py-2"><Badge variant="secondary">Supported</Badge></td>
              <td className="py-2"><Badge variant="outline">Varies</Badge></td>
            </tr>
          </tbody>
        </table>
      </div>
    </InfoCard>
  </div>
);

export const HighLevelWarmup = ({ onBack }: SectionProps) => (
  <div className="space-y-6">
    {onBack && <BackButton onClick={onBack} />}
    
    <div className="space-y-2">
      <h3 className="text-xl font-bold flex items-center gap-2">
        <Thermometer className="w-5 h-5 text-red-500" />
        Domain Warm-Up Guide
      </h3>
      <p className="text-muted-foreground">
        Every new sub-account follows a Ramp-Up Model to build sending reputation and avoid spam filters.
      </p>
    </div>

    <InfoCard title="HighLevel Stage-Based Warm-Up Schedule" icon={Clock} variant="info">
      <p className="text-sm mb-3">HighLevel uses a stage-based warm-up system. As you reach your daily limit consistently and maintain good engagement, you progress to the next stage.</p>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b">
              <th className="text-left py-2 font-semibold">Stage</th>
              <th className="text-left py-2 font-semibold">Daily Limit</th>
              <th className="text-left py-2 font-semibold">Progression</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b"><td className="py-2 font-semibold">Stage 1</td><td className="py-2 font-mono">1,000</td><td className="py-2 text-xs text-muted-foreground">Starting stage for new domains</td></tr>
            <tr className="border-b"><td className="py-2 font-semibold">Stage 2</td><td className="py-2 font-mono">5,000</td><td className="py-2 text-xs text-muted-foreground">After consistent Stage 1 sends</td></tr>
            <tr className="border-b"><td className="py-2 font-semibold">Stage 3</td><td className="py-2 font-mono">10,000</td><td className="py-2 text-xs text-muted-foreground">Good reputation established</td></tr>
            <tr className="border-b bg-muted/50"><td className="py-2 font-semibold">Stage 4 (Shared)</td><td className="py-2 font-mono font-semibold">15,000</td><td className="py-2 text-xs text-muted-foreground">Max for shared domains</td></tr>
            <tr className="bg-green-500/10"><td className="py-2 font-semibold">Stage 4 (Dedicated)</td><td className="py-2 font-mono font-semibold">450,000</td><td className="py-2 text-xs text-muted-foreground">Requires dedicated sending domain</td></tr>
          </tbody>
        </table>
      </div>
      <p className="text-xs mt-2">
        The daily counter resets every day at midnight 00:00:01 AM UTC. Aim to reach your daily limit consistently to progress to the next stage.
      </p>
    </InfoCard>
    
    <InfoCard title="Batch Sending Best Practices" icon={Mail} variant="success">
      <p className="text-sm mb-3">When sending bulk campaigns, proper throttling protects your reputation and improves deliverability.</p>
      <div className="space-y-3">
        <div className="p-3 rounded-lg bg-muted/50">
          <p className="font-semibold text-foreground text-sm">Recommended Batch Sizes</p>
          <ul className="list-disc list-inside space-y-1 mt-2 text-xs">
            <li><span className="font-semibold">Stage 1:</span> Send in batches of 200-300 emails, spaced 15-30 minutes apart</li>
            <li><span className="font-semibold">Stage 2:</span> Send in batches of 500-1,000 emails, spaced 10-15 minutes apart</li>
            <li><span className="font-semibold">Stage 3+:</span> Send in batches of 1,000-2,000 emails, spaced 5-10 minutes apart</li>
          </ul>
        </div>
        <div className="p-3 rounded-lg bg-muted/50">
          <p className="font-semibold text-foreground text-sm">Timing Recommendations</p>
          <ul className="list-disc list-inside space-y-1 mt-2 text-xs">
            <li><span className="font-semibold">Best sending windows:</span> Tuesday-Thursday, 9am-11am or 1pm-3pm recipient's local time</li>
            <li><span className="font-semibold">Avoid:</span> Weekends, early mornings, and late evenings for business emails</li>
            <li><span className="font-semibold">Spread large campaigns:</span> Break 10,000+ sends across multiple days if possible</li>
          </ul>
        </div>
        <div className="p-3 rounded-lg bg-muted/50">
          <p className="font-semibold text-foreground text-sm">Throttling Strategy</p>
          <ul className="list-disc list-inside space-y-1 mt-2 text-xs">
            <li>Never send your entire list at once - even if within limits</li>
            <li>Use HighLevel's built-in batch sending feature when available</li>
            <li>Monitor bounce rates during sending - pause if above 2%</li>
            <li>Start each campaign with your most engaged subscribers first</li>
          </ul>
        </div>
      </div>
    </InfoCard>

    <div className="grid md:grid-cols-2 gap-4">
      <InfoCard title="Shared Domain Limits" icon={Users}>
        <p>Without a Dedicated Sending Domain:</p>
        <ul className="list-disc list-inside space-y-1 mt-2">
          <li>Maximum 15,000 emails per day</li>
          <li>Shares reputation with other HighLevel users</li>
          <li>Good for low to medium volume senders</li>
        </ul>
      </InfoCard>

      <InfoCard title="Dedicated Domain Limits" icon={Shield} variant="success">
        <p>With a Dedicated Sending Domain:</p>
        <ul className="list-disc list-inside space-y-1 mt-2">
          <li>Up to 450,000 emails per day</li>
          <li>Full control of your reputation</li>
          <li>Required for high-volume sending</li>
        </ul>
      </InfoCard>
    </div>

    <InfoCard title="Important Notes" icon={AlertTriangle} variant="warning">
      <ul className="list-disc list-inside space-y-2">
        <li>If the limit is reached before reset, the account is locked until the reset time.</li>
        <li>A sub-account without a Dedicated Domain is considered a shared domain even if the agency has one.</li>
        <li>To increase limits beyond 15,000, you must set up a Dedicated Sending Domain.</li>
      </ul>
    </InfoCard>
  </div>
);

export const HighLevelAuthentication = ({ onBack }: SectionProps) => (
  <div className="space-y-6">
    {onBack && <BackButton onClick={onBack} />}
    
    <div className="space-y-2">
      <h3 className="text-xl font-bold flex items-center gap-2">
        <Key className="w-5 h-5 text-purple-500" />
        Email Authentication Setup
      </h3>
      <p className="text-muted-foreground">
        Proper authentication is critical for inbox placement. Set up DMARC, SPF, and DKIM correctly.
      </p>
    </div>

    <InfoCard title="1. Set Up a Dedicated Sending Domain" icon={Globe} variant="info">
      <p>
        A Dedicated Email Sending Domain gives you full control of your reputation and deliverability.
        Without one, your emails may go to spam despite good practices.
      </p>
      <div className="mt-3 p-3 rounded-lg bg-muted/50">
        <p className="font-semibold text-foreground text-sm">How to set it up:</p>
        <ol className="list-decimal list-inside space-y-1 mt-2 text-xs">
          <li>Go to Settings in your HighLevel sub-account</li>
          <li>Navigate to Email Services</li>
          <li>Click "Add Dedicated Sending Domain"</li>
          <li>Follow the DNS verification steps</li>
        </ol>
      </div>
    </InfoCard>

    <InfoCard title="2. Add Your DMARC Record" icon={Shield}>
      <p>
        DMARC tells receiving servers how to handle emails that fail authentication checks. 
        Without DMARC, mailbox providers may count it against you.
      </p>
      <div className="mt-3 p-3 rounded-lg bg-muted font-mono text-xs">
        <p className="text-foreground font-semibold mb-2">Add this TXT record to your DNS:</p>
        <p><span className="text-muted-foreground">Type:</span> TXT</p>
        <p><span className="text-muted-foreground">Name:</span> _dmarc</p>
        <p><span className="text-muted-foreground">Content:</span> v=DMARC1; p=reject</p>
      </div>
      <Button variant="outline" size="sm" className="mt-3" asChild data-testid="link-verify-dmarc">
        <a href="https://dmarcian.com/domain-checker/" target="_blank" rel="noopener noreferrer">
          <ExternalLink className="w-3 h-3 mr-2" />
          Verify Your DMARC
        </a>
      </Button>
    </InfoCard>

    <InfoCard title="3. Use the Proper From Email" icon={Mail}>
      <p>Using a "from email" that doesn't match your sending domain can harm deliverability.</p>
      <div className="mt-3 space-y-2">
        <div className="p-2 rounded bg-green-500/10 border border-green-500/30">
          <p className="text-xs font-semibold text-green-600 dark:text-green-400">Valid Examples:</p>
          <p className="text-xs font-mono">Sending: mail.company.com → From: sender@company.com</p>
          <p className="text-xs font-mono">Sending: mail.company.com → From: sender@mail.company.com</p>
        </div>
        <div className="p-2 rounded bg-red-500/10 border border-red-500/30">
          <p className="text-xs font-semibold text-red-600 dark:text-red-400">Invalid Example:</p>
          <p className="text-xs font-mono">Sending: mail.company.com → From: user@otherbrand.com</p>
        </div>
      </div>
    </InfoCard>
  </div>
);

export const HighLevelDeliverability = ({ onBack }: SectionProps) => (
  <div className="space-y-6">
    {onBack && <BackButton onClick={onBack} />}
    
    <div className="space-y-2">
      <h3 className="text-xl font-bold flex items-center gap-2">
        <CheckCircle className="w-5 h-5 text-green-500" />
        Email Deliverability Best Practices
      </h3>
      <p className="text-muted-foreground">
        Follow these practices to maximize inbox placement and protect your sender reputation.
      </p>
    </div>

    <div className="grid md:grid-cols-2 gap-4">
      <InfoCard title="Enable Email Validation" icon={CheckCircle} variant="success">
        <p>Sending to invalid emails harms your domain reputation.</p>
        <div className="mt-2 space-y-1 text-xs">
          <p className="font-semibold text-foreground">How to enable:</p>
          <ol className="list-decimal list-inside space-y-1">
            <li>Go to Sub-Account Settings</li>
            <li>Find Business Profile</li>
            <li>Enable "Verify Email Address when first email is sent"</li>
          </ol>
        </div>
        <p className="text-xs mt-2 text-muted-foreground">Cost: $2.50 per 1,000 validations</p>
      </InfoCard>

      <InfoCard title="Add Unsubscribe Links" icon={Users}>
        <p>Not having an unsubscribe link will severely harm your deliverability.</p>
        <div className="mt-2 space-y-1 text-xs">
          <p className="font-semibold text-foreground">Options:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Use LC Email's default unsubscribe link</li>
            <li>Create a custom unsubscribe link</li>
            <li>Use the Footer element in email builder</li>
          </ul>
        </div>
      </InfoCard>
    </div>

    <InfoCard title="Use Double Opt-In" icon={Shield}>
      <p>
        Double opt-in means subscribers confirm their email twice before receiving emails. 
        This ensures your list is clean and engaged.
      </p>
      <div className="mt-3 grid sm:grid-cols-2 gap-3">
        <div className="p-3 rounded-lg bg-muted/50">
          <p className="font-semibold text-foreground text-sm">Single Opt-In</p>
          <p className="text-xs mt-1">Sends immediately after form submission</p>
        </div>
        <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/30">
          <p className="font-semibold text-foreground text-sm">Double Opt-In</p>
          <p className="text-xs mt-1">Requires email verification first</p>
        </div>
      </div>
    </InfoCard>

    <InfoCard title="Maintain List Health" icon={Users} variant="info">
      <ul className="list-disc list-inside space-y-2">
        <li>Only import subscribers who gave direct permission</li>
        <li>Secure forms with ReCaptcha or double opt-in</li>
        <li>Prune your list regularly (every 6-12 months)</li>
        <li>Remove cold subscribers before they harm reputation</li>
        <li>Quality over quantity - engaged lists perform better</li>
      </ul>
    </InfoCard>

    <InfoCard title="Maintain Consistency" icon={Clock}>
      <p>Sudden changes in sending behavior raise red flags with mailbox providers.</p>
      <ul className="list-disc list-inside space-y-2 mt-2">
        <li><strong>Sending Domain:</strong> Use the domain subscribers recognize</li>
        <li><strong>Volume:</strong> Don't jump from 5,000 to 20,000 overnight</li>
        <li><strong>Frequency:</strong> Send at least once per month</li>
      </ul>
    </InfoCard>
  </div>
);

export const HighLevelTroubleshooting = ({ onBack }: SectionProps) => (
  <div className="space-y-6">
    {onBack && <BackButton onClick={onBack} />}
    
    <div className="space-y-2">
      <h3 className="text-xl font-bold flex items-center gap-2">
        <Wrench className="w-5 h-5 text-amber-500" />
        Troubleshooting Common Issues
      </h3>
      <p className="text-muted-foreground">
        Solutions for the most common email deliverability problems in HighLevel.
      </p>
    </div>

    <InfoCard title="Emails Going to Spam?" icon={AlertTriangle} variant="warning">
      <div className="space-y-4">
        <div>
          <p className="font-semibold text-foreground">1. Sending from a public domain</p>
          <p className="text-xs mt-1">
            If you're sending from gmail.com, yahoo.com, etc., your emails will likely go to spam. 
            Use your own branded domain.
          </p>
        </div>
        <div>
          <p className="font-semibold text-foreground">2. Missing DMARC record</p>
          <p className="text-xs mt-1">
            If your domain has no DMARC policy, emails will likely go to spam. 
            Add the DMARC TXT record to your DNS.
          </p>
        </div>
        <div>
          <p className="font-semibold text-foreground">3. Poor list quality</p>
          <p className="text-xs mt-1">
            Sending to unengaged subscribers or purchased lists harms reputation.
            Clean your list regularly.
          </p>
        </div>
        <div>
          <p className="font-semibold text-foreground">4. Sending internal mail</p>
          <p className="text-xs mt-1">
            Sending from info@domain.com to susan@domain.com often triggers spam filters.
            Use a different email provider for internal tests.
          </p>
        </div>
      </div>
    </InfoCard>

    <InfoCard title="Volume or Frequency Issues" icon={Clock}>
      <p>Sudden spikes in sending volume raise red flags.</p>
      <ul className="list-disc list-inside space-y-2 mt-2">
        <li>Warm up your domain gradually (follow the 7-day schedule)</li>
        <li>Maintain a consistent sending schedule</li>
        <li>Avoid long silences followed by massive blasts</li>
      </ul>
    </InfoCard>

    <InfoCard title="Content Triggering Spam Filters" icon={Mail}>
      <p>Even with proper setup, content can trigger spam filters.</p>
      <div className="mt-2 grid sm:grid-cols-2 gap-3">
        <div className="p-2 rounded bg-red-500/10 border border-red-500/30">
          <p className="text-xs font-semibold text-red-600 dark:text-red-400">Avoid:</p>
          <ul className="text-xs list-disc list-inside space-y-1 mt-1">
            <li>Link shorteners (bit.ly)</li>
            <li>Spammy words ("FREE $$$")</li>
            <li>Too many images, little text</li>
            <li>Gimmicky subject lines</li>
          </ul>
        </div>
        <div className="p-2 rounded bg-green-500/10 border border-green-500/30">
          <p className="text-xs font-semibold text-green-600 dark:text-green-400">Do:</p>
          <ul className="text-xs list-disc list-inside space-y-1 mt-1">
            <li>Link directly to websites</li>
            <li>Write conversationally</li>
            <li>Balance images and text</li>
            <li>Be authentic and helpful</li>
          </ul>
        </div>
      </div>
    </InfoCard>

    <InfoCard title="Gmail Error: 4.7.28" icon={AlertTriangle} variant="warning">
      <p className="font-semibold text-foreground">Unusual Rate of Unsolicited Mail Detected</p>
      <p className="mt-2">
        This error means Gmail has flagged your sending as suspicious. To resolve:
      </p>
      <ul className="list-disc list-inside space-y-1 mt-2">
        <li>Reduce sending volume immediately</li>
        <li>Clean your list of inactive subscribers</li>
        <li>Improve engagement rates</li>
        <li>Wait 24-48 hours before resuming</li>
      </ul>
    </InfoCard>
  </div>
);

export const HighLevelAdvanced = ({ onBack }: SectionProps) => (
  <div className="space-y-6">
    {onBack && <BackButton onClick={onBack} />}
    
    <div className="space-y-2">
      <h3 className="text-xl font-bold flex items-center gap-2">
        <Zap className="w-5 h-5 text-blue-500" />
        Advanced Features
      </h3>
      <p className="text-muted-foreground">
        Dedicated IPs, high-volume sending, and advanced deliverability features for power users.
      </p>
    </div>

    <InfoCard title="Dedicated Sending IP Address" icon={Globe} variant="info">
      <p>
        A dedicated IP gives you exclusive ownership of an IP address, providing full control 
        over your sender reputation.
      </p>
      <div className="mt-3 grid sm:grid-cols-2 gap-3">
        <div className="p-3 rounded-lg bg-muted/50">
          <p className="font-semibold text-foreground">Who needs it?</p>
          <p className="text-xs mt-1">Businesses sending 200,000+ emails per week</p>
        </div>
        <div className="p-3 rounded-lg bg-muted/50">
          <p className="font-semibold text-foreground">Cost</p>
          <p className="text-2xl font-bold text-foreground">$59/mo</p>
          <p className="text-xs">per IP address</p>
        </div>
      </div>
      <div className="mt-3 p-3 rounded-lg bg-green-500/10 border border-green-500/30">
        <p className="text-xs font-semibold text-green-600 dark:text-green-400">Benefits:</p>
        <ul className="text-xs list-disc list-inside space-y-1 mt-1">
          <li>Full control of IP reputation</li>
          <li>Up to 450,000 emails/day limit</li>
          <li>Not affected by other senders</li>
          <li>Better for high-volume campaigns</li>
        </ul>
      </div>
    </InfoCard>

    <InfoCard title="High-Volume Sending Limits" icon={Mail}>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b">
              <th className="text-left py-2 font-semibold">Setup</th>
              <th className="text-left py-2 font-semibold">Daily Limit</th>
              <th className="text-left py-2 font-semibold">To Increase</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b">
              <td className="py-2">Shared IP</td>
              <td className="py-2 font-mono">15,000</td>
              <td className="py-2 text-xs">Add Dedicated Domain</td>
            </tr>
            <tr className="border-b">
              <td className="py-2">Dedicated Domain</td>
              <td className="py-2 font-mono">450,000</td>
              <td className="py-2 text-xs">Contact Support</td>
            </tr>
          </tbody>
        </table>
      </div>
    </InfoCard>

    <InfoCard title="HIPAA Compliance" icon={Shield} variant="success">
      <p>
        LC Email is HIPAA compliant! HighLevel has a signed BAA with Twilio for HIPAA compliance.
      </p>
      <p className="mt-2 text-xs">
        As long as you have the HIPAA compliance package, you're covered.
      </p>
    </InfoCard>

    <InfoCard title="Cold Email Support" icon={Users}>
      <p>
        Yes, cold email works with LC Email! Unlike some providers, HighLevel supports cold outreach.
      </p>
      <div className="mt-3 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30">
        <p className="text-xs font-semibold text-amber-600 dark:text-amber-400">Best Practices:</p>
        <ul className="text-xs list-disc list-inside space-y-1 mt-1">
          <li>Always warm up your domain first</li>
          <li>Start with small batches</li>
          <li>Personalize your outreach</li>
          <li>Include unsubscribe options</li>
          <li>Monitor bounce rates closely</li>
        </ul>
      </div>
    </InfoCard>

    <InfoCard title="Rebilling for Agencies" icon={DollarSign}>
      <p>
        On the Pro Plan, you can rebill your clients for email usage automatically. 
        With LC Email's lower costs, there's more margin for your agency!
      </p>
      <div className="mt-2 text-xs">
        <p className="font-semibold text-foreground">To set up:</p>
        <p>Agency View → Billing → Rebilling Settings</p>
      </div>
    </InfoCard>
  </div>
);

type HighLevelView = 'overview' | 'getting-started' | 'warmup' | 'authentication' | 'deliverability' | 'troubleshooting' | 'advanced';

interface HighLevelHubProps {
  onBack: () => void;
}

export const HighLevelHub: React.FC<HighLevelHubProps> = ({ onBack }) => {
  const [activeView, setActiveView] = useState<HighLevelView>('overview');

  const handleBack = () => {
    if (activeView === 'overview') {
      onBack();
    } else {
      setActiveView('overview');
    }
  };

  if (activeView === 'getting-started') return <HighLevelGettingStarted onBack={handleBack} />;
  if (activeView === 'warmup') return <HighLevelWarmup onBack={handleBack} />;
  if (activeView === 'authentication') return <HighLevelAuthentication onBack={handleBack} />;
  if (activeView === 'deliverability') return <HighLevelDeliverability onBack={handleBack} />;
  if (activeView === 'troubleshooting') return <HighLevelTroubleshooting onBack={handleBack} />;
  if (activeView === 'advanced') return <HighLevelAdvanced onBack={handleBack} />;

  return (
    <div className="space-y-6 animate-fade-in">
      <Button 
        variant="ghost" 
        size="sm" 
        onClick={onBack}
        className="mb-4"
        data-testid="button-highlevel-back-to-academy"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Academy
      </Button>

      <div className="space-y-2">
        <h3 className="text-2xl font-bold flex items-center gap-2">
          <Layers className="w-6 h-6 text-orange-500" />
          HighLevel Email Hub
        </h3>
        <p className="text-muted-foreground">
          Your complete guide to email deliverability in GoHighLevel. Master LC Email setup, authentication, and best practices.
        </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card className="cursor-pointer transition-all hover:shadow-md hover:border-orange-500/30" onClick={() => setActiveView('getting-started')} data-testid="card-highlevel-getting-started">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-gradient-to-br from-orange-500 to-yellow-500">
              <Rocket className="w-5 h-5 text-white" />
            </div>
            <div>
              <h4 className="font-semibold text-foreground">Getting Started</h4>
              <p className="text-xs text-muted-foreground">Introduction to LC Email</p>
            </div>
          </CardContent>
        </Card>
        
        <Card className="cursor-pointer transition-all hover:shadow-md hover:border-red-500/30" onClick={() => setActiveView('warmup')} data-testid="card-highlevel-warmup">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-gradient-to-br from-red-500 to-orange-500">
              <Thermometer className="w-5 h-5 text-white" />
            </div>
            <div>
              <h4 className="font-semibold text-foreground">Domain Warm-Up</h4>
              <p className="text-xs text-muted-foreground">Ramp-up schedule & limits</p>
            </div>
          </CardContent>
        </Card>
        
        <Card className="cursor-pointer transition-all hover:shadow-md hover:border-purple-500/30" onClick={() => setActiveView('authentication')} data-testid="card-highlevel-authentication">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-500">
              <Key className="w-5 h-5 text-white" />
            </div>
            <div>
              <h4 className="font-semibold text-foreground">Authentication</h4>
              <p className="text-xs text-muted-foreground">DMARC, SPF & DKIM setup</p>
            </div>
          </CardContent>
        </Card>
        
        <Card className="cursor-pointer transition-all hover:shadow-md hover:border-green-500/30" onClick={() => setActiveView('deliverability')} data-testid="card-highlevel-deliverability">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500">
              <CheckCircle className="w-5 h-5 text-white" />
            </div>
            <div>
              <h4 className="font-semibold text-foreground">Best Practices</h4>
              <p className="text-xs text-muted-foreground">Deliverability tips</p>
            </div>
          </CardContent>
        </Card>
        
        <Card className="cursor-pointer transition-all hover:shadow-md hover:border-amber-500/30" onClick={() => setActiveView('troubleshooting')} data-testid="card-highlevel-troubleshooting">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-gradient-to-br from-amber-500 to-yellow-500">
              <Wrench className="w-5 h-5 text-white" />
            </div>
            <div>
              <h4 className="font-semibold text-foreground">Troubleshooting</h4>
              <p className="text-xs text-muted-foreground">Fix common issues</p>
            </div>
          </CardContent>
        </Card>
        
        <Card className="cursor-pointer transition-all hover:shadow-md hover:border-blue-500/30" onClick={() => setActiveView('advanced')} data-testid="card-highlevel-advanced">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div>
              <h4 className="font-semibold text-foreground">Advanced Features</h4>
              <p className="text-xs text-muted-foreground">Dedicated IPs & more</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
