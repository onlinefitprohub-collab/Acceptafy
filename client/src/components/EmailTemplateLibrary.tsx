import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  LayoutTemplate,
  Search,
  Mail,
  Megaphone,
  Heart,
  ShoppingCart,
  Bell,
  Sparkles,
  Users,
  Check,
  Eye,
} from 'lucide-react';

export interface EmailTemplateData {
  id: string;
  name: string;
  description: string;
  category: 'welcome' | 'newsletter' | 'promotional' | 're-engagement' | 'transactional' | 'announcement';
  subject: string;
  previewText: string;
  body: string;
  thumbnail?: string;
}

const CATEGORY_ICONS: Record<string, any> = {
  welcome: Heart,
  newsletter: Mail,
  promotional: Megaphone,
  're-engagement': Users,
  transactional: ShoppingCart,
  announcement: Bell,
};

const CATEGORY_LABELS: Record<string, string> = {
  welcome: 'Welcome',
  newsletter: 'Newsletter',
  promotional: 'Promotional',
  're-engagement': 'Re-engagement',
  transactional: 'Transactional',
  announcement: 'Announcement',
};

const PRE_DESIGNED_TEMPLATES: EmailTemplateData[] = [
  {
    id: 'welcome-1',
    name: 'Warm Welcome',
    description: 'A friendly welcome email for new subscribers with a personal touch.',
    category: 'welcome',
    subject: 'Welcome to {{company_name}} - Let\'s Get Started!',
    previewText: 'We\'re excited to have you join us. Here\'s what to expect...',
    body: `Hi {{first_name}},

Welcome to {{company_name}}! We're thrilled to have you join our community.

Here's what you can expect from us:

✨ **Weekly insights** - Tips and strategies delivered to your inbox
📚 **Exclusive resources** - Access to guides, templates, and tools
🎯 **Special offers** - Early access to new features and promotions

To get started, here are a few quick wins:

1. **Complete your profile** - Help us personalize your experience
2. **Check out our getting started guide** - [Link]
3. **Join our community** - Connect with fellow members

If you have any questions, just hit reply - we read every email!

Best,
The {{company_name}} Team

P.S. Follow us on social media for daily tips and updates!`,
  },
  {
    id: 'welcome-2',
    name: 'Product Onboarding',
    description: 'Guide new users through your product with clear next steps.',
    category: 'welcome',
    subject: 'Your {{product_name}} Account is Ready!',
    previewText: 'Quick setup guide to get you started in minutes...',
    body: `Hi {{first_name}},

Your {{product_name}} account is all set up and ready to go!

**Here's your quick start checklist:**

☐ **Step 1: Log in to your dashboard**
Visit [dashboard link] and explore your new workspace.

☐ **Step 2: Connect your first integration**
Link your favorite tools to supercharge your workflow.

☐ **Step 3: Complete the tutorial**
Our 5-minute walkthrough will show you the essentials.

**Need help?**
- 📖 Knowledge Base: [link]
- 💬 Live Chat: Available 9am-6pm EST
- 📧 Email: support@example.com

We're here to help you succeed!

Cheers,
{{sender_name}}
{{company_name}}`,
  },
  {
    id: 'newsletter-1',
    name: 'Weekly Digest',
    description: 'Clean weekly newsletter format with featured content sections.',
    category: 'newsletter',
    subject: '📬 This Week\'s Top Stories | {{company_name}} Weekly',
    previewText: 'Your weekly roundup of the best content, tips, and updates...',
    body: `Hey {{first_name}},

Here's your weekly dose of insights and updates!

---

## 🌟 Featured Article

**[Article Title Here]**
A brief description of the featured article that entices readers to click through and learn more about this fascinating topic.

[Read More →]

---

## 📚 This Week's Highlights

**1. [First Topic Title]**
Brief summary of the first topic or article, providing just enough information to spark curiosity.

**2. [Second Topic Title]**
Brief summary of the second topic, highlighting key takeaways or interesting points.

**3. [Third Topic Title]**
Brief summary of the third topic, making it scannable and engaging.

---

## 💡 Quick Tip of the Week

> "Insert a valuable, actionable tip here that readers can immediately apply."

---

## 🎯 What's Coming Next Week

A teaser about upcoming content, events, or announcements to keep readers engaged.

---

Thanks for being part of our community!

Best,
{{sender_name}}

[Manage Preferences] | [Unsubscribe]`,
  },
  {
    id: 'newsletter-2',
    name: 'Monthly Roundup',
    description: 'Comprehensive monthly summary with metrics and highlights.',
    category: 'newsletter',
    subject: '📊 Your {{month}} Recap + What\'s New',
    previewText: 'Your monthly summary: achievements, insights, and what\'s ahead...',
    body: `Hi {{first_name}},

Can you believe {{month}} is already over? Here's a look at what happened and what's coming up!

## 📈 Your {{month}} Highlights

| Metric | This Month | Last Month | Change |
|--------|------------|------------|--------|
| [Metric 1] | Value | Value | +X% |
| [Metric 2] | Value | Value | +X% |
| [Metric 3] | Value | Value | +X% |

## 🏆 Top Achievements

✅ [Achievement 1]
✅ [Achievement 2]
✅ [Achievement 3]

## 🆕 What's New

**Feature Update: [Name]**
Brief description of the new feature and how it benefits users.

## 📅 Coming in {{next_month}}

🚀 [Upcoming feature or event]
📚 [Educational content or webinar]
🎁 [Special offer or promotion]

---

Questions or feedback? Just reply to this email!

Best,
The {{company_name}} Team`,
  },
  {
    id: 'promo-1',
    name: 'Flash Sale',
    description: 'Urgent promotional email with countdown and clear CTA.',
    category: 'promotional',
    subject: '⚡ {{discount}}% OFF - Ends in 24 Hours!',
    previewText: 'Don\'t miss our biggest sale of the season...',
    body: `{{first_name}}, this won't last long!

# 🔥 FLASH SALE 🔥

## {{discount}}% OFF EVERYTHING

---

**⏰ Ends: [Date/Time]**

This is our biggest sale of the season, and it's only available for the next 24 hours!

**What's included:**
- ✅ All products
- ✅ All subscriptions
- ✅ No code needed

---

## [SHOP NOW →]

---

**Why act now?**

🎯 Limited time only - Sale ends at midnight
📦 Free shipping on orders over $50
💳 Easy returns within 30 days

Don't miss out on these savings!

---

[GRAB YOUR DISCOUNT →]

---

Best,
{{company_name}}

P.S. Forward this to a friend - they'll thank you later! 😉`,
  },
  {
    id: 'promo-2',
    name: 'New Product Launch',
    description: 'Announce a new product or feature with excitement.',
    category: 'promotional',
    subject: '🚀 Introducing {{product_name}} - You\'re Going to Love This',
    previewText: 'The wait is over! Discover what we\'ve been working on...',
    body: `Hi {{first_name}},

We've been working on something special, and today we're thrilled to share it with you!

# Introducing {{product_name}}

[Product Image Placeholder]

## What is it?

A brief, compelling description of what the product does and why it matters. Focus on the transformation it provides, not just features.

## Why you'll love it:

🎯 **Benefit 1** - Description of how this helps the user
⚡ **Benefit 2** - Another key benefit explained simply
🔒 **Benefit 3** - Third compelling benefit

## Special Launch Offer

As a valued subscriber, you get **exclusive early access** plus:

- 🎁 {{discount}}% off for the first 100 customers
- 🚀 Priority onboarding support
- 📚 Free bonus resources

**[GET EARLY ACCESS →]**

---

*Offer expires {{expiry_date}}*

Can't wait to hear what you think!

{{sender_name}}
{{company_name}}`,
  },
  {
    id: 'reengagement-1',
    name: 'We Miss You',
    description: 'Win back inactive subscribers with a friendly nudge.',
    category: 're-engagement',
    subject: 'We miss you, {{first_name}}! 💔',
    previewText: 'It\'s been a while - here\'s what you\'ve been missing...',
    body: `Hi {{first_name}},

We noticed you haven't visited in a while, and honestly? We miss you!

## Here's what you've been missing:

🆕 **[New Feature/Content 1]**
Brief description of something exciting they missed.

📚 **[New Feature/Content 2]**
Another update that might interest them.

🎁 **[Special Offer]**
An incentive to come back.

---

## Come back with a special gift

To welcome you back, we're offering:

**[SPECIAL OFFER DETAILS]**

Use code: **WELCOME{{discount}}**

[COME BACK →]

---

If things have changed and you'd prefer fewer emails, no worries! You can update your preferences below.

We hope to see you soon!

Best,
{{company_name}}

[Update Preferences] | [Unsubscribe]`,
  },
  {
    id: 'reengagement-2',
    name: 'Last Chance',
    description: 'Final attempt to re-engage before list cleanup.',
    category: 're-engagement',
    subject: 'Still want to hear from us, {{first_name}}?',
    previewText: 'Quick check-in before we update our list...',
    body: `Hi {{first_name}},

We're doing some spring cleaning of our email list, and we want to make sure we only send to people who actually want to hear from us.

**We haven't heard from you in a while.**

If you'd still like to receive our emails, simply click the button below:

[YES, KEEP ME SUBSCRIBED →]

---

**What you'll continue to get:**
- Weekly tips and insights
- Exclusive offers and early access
- Industry news and updates

---

If we don't hear from you, we'll automatically unsubscribe you to keep your inbox clean. No hard feelings! 

You can always re-subscribe later at [website].

Thanks for being part of our community,
{{company_name}}`,
  },
  {
    id: 'transactional-1',
    name: 'Order Confirmation',
    description: 'Professional order confirmation with details.',
    category: 'transactional',
    subject: 'Order Confirmed! #{{order_number}}',
    previewText: 'Thanks for your purchase - here are your order details...',
    body: `Hi {{first_name}},

Thanks for your order! We're on it. 🎉

---

## Order Summary

**Order #:** {{order_number}}
**Date:** {{order_date}}
**Payment Method:** {{payment_method}}

---

| Item | Qty | Price |
|------|-----|-------|
| {{item_name}} | {{qty}} | {{price}} |

**Subtotal:** {{subtotal}}
**Shipping:** {{shipping}}
**Tax:** {{tax}}
**Total:** {{total}}

---

## What's Next?

📦 **Processing** - We're preparing your order
🚚 **Shipping** - Expect tracking info within 24-48 hours
📬 **Delivery** - Estimated arrival: {{delivery_date}}

---

**Need Help?**
- Track your order: [Order Status]
- Contact support: support@example.com
- FAQ: [Help Center]

Thank you for choosing {{company_name}}!

Best,
The {{company_name}} Team`,
  },
  {
    id: 'transactional-2',
    name: 'Shipping Notification',
    description: 'Notify customers when their order ships.',
    category: 'transactional',
    subject: '📦 Your Order is On Its Way! #{{order_number}}',
    previewText: 'Great news - your package has shipped...',
    body: `Hi {{first_name}},

Great news! Your order has shipped and is on its way to you.

---

## Shipment Details

**Order #:** {{order_number}}
**Carrier:** {{carrier_name}}
**Tracking #:** {{tracking_number}}

[TRACK YOUR PACKAGE →]

---

## Delivery Information

📍 **Shipping to:**
{{shipping_address}}

📅 **Estimated Delivery:**
{{delivery_date}}

---

## What's in Your Package

{{item_list}}

---

## Need Help?

If you have any questions about your shipment:
- Track your order: [Tracking Link]
- Contact support: support@example.com
- FAQ: [Help Center]

We hope you love your order!

Best,
The {{company_name}} Team`,
  },
  {
    id: 'announcement-1',
    name: 'Company Update',
    description: 'Share important company news or announcements.',
    category: 'announcement',
    subject: '📢 Important Update from {{company_name}}',
    previewText: 'Big news to share with you today...',
    body: `Dear {{first_name}},

We have some exciting news to share with you today!

## {{announcement_title}}

[Main announcement content here - explain what's happening, why it matters, and what it means for your subscribers.]

---

## What This Means for You

**✅ [Benefit/Change 1]**
Explain how this affects the reader positively.

**✅ [Benefit/Change 2]**
Another way this impacts them.

**✅ [Benefit/Change 3]**
Final key point.

---

## Questions?

We're here to help! If you have any questions about this update:

- 📧 Email: support@example.com
- 💬 Live chat: [Link]
- 📖 FAQ: [Link]

Thank you for being part of the {{company_name}} community!

Best regards,
{{sender_name}}
{{title}}
{{company_name}}`,
  },
  {
    id: 'announcement-2',
    name: 'Event Invitation',
    description: 'Invite subscribers to webinars, events, or launches.',
    category: 'announcement',
    subject: '🎉 You\'re Invited: {{event_name}}',
    previewText: 'Save your spot for our upcoming event...',
    body: `Hi {{first_name}},

You're invited to something special!

# {{event_name}}

📅 **Date:** {{event_date}}
⏰ **Time:** {{event_time}} {{timezone}}
📍 **Location:** {{location_or_online}}

---

## What to Expect

Join us for an exclusive session where you'll learn:

🎯 **[Topic 1]** - Brief description
💡 **[Topic 2]** - Brief description
🔥 **[Topic 3]** - Brief description

---

## Featured Speakers

**{{speaker_name}}**
{{speaker_title}}

[Brief bio or credential]

---

## Reserve Your Spot

Space is limited! Register now to secure your place.

[REGISTER NOW →]

---

**Can't make it live?**
Register anyway! We'll send you the recording afterward.

See you there!
{{company_name}}`,
  },
];

interface EmailTemplateLibraryProps {
  onSelectTemplate: (template: EmailTemplateData) => void;
}

export function EmailTemplateLibrary({ onSelectTemplate }: EmailTemplateLibraryProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [previewTemplate, setPreviewTemplate] = useState<EmailTemplateData | null>(null);

  const filteredTemplates = PRE_DESIGNED_TEMPLATES.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = ['all', ...Array.from(new Set(PRE_DESIGNED_TEMPLATES.map(t => t.category)))];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search templates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
            data-testid="input-search-templates"
          />
        </div>
      </div>

      <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
        <TabsList className="flex-wrap h-auto gap-1">
          {categories.map(cat => {
            const Icon = cat === 'all' ? LayoutTemplate : CATEGORY_ICONS[cat];
            return (
              <TabsTrigger key={cat} value={cat} className="gap-1">
                {Icon && <Icon className="h-4 w-4" />}
                {cat === 'all' ? 'All' : CATEGORY_LABELS[cat]}
              </TabsTrigger>
            );
          })}
        </TabsList>
      </Tabs>

      <ScrollArea className="h-[400px]">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pr-4">
          {filteredTemplates.map(template => {
            const Icon = CATEGORY_ICONS[template.category];
            return (
              <Card
                key={template.id}
                className="cursor-pointer hover-elevate group"
                data-testid={`template-card-${template.id}`}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-md bg-primary/10 flex items-center justify-center">
                        {Icon && <Icon className="h-4 w-4 text-primary" />}
                      </div>
                      <div>
                        <CardTitle className="text-sm">{template.name}</CardTitle>
                        <Badge variant="secondary" className="text-xs mt-1">
                          {CATEGORY_LABELS[template.category]}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <CardDescription className="text-xs line-clamp-2">
                    {template.description}
                  </CardDescription>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPreviewTemplate(template)}
                      data-testid={`button-preview-${template.id}`}
                    >
                      <Eye className="h-3 w-3 mr-1" />
                      Preview
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => onSelectTemplate(template)}
                      data-testid={`button-use-${template.id}`}
                    >
                      <Check className="h-3 w-3 mr-1" />
                      Use
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </ScrollArea>

      <Dialog open={!!previewTemplate} onOpenChange={() => setPreviewTemplate(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              {previewTemplate?.name}
            </DialogTitle>
            <DialogDescription>
              {previewTemplate?.description}
            </DialogDescription>
          </DialogHeader>
          {previewTemplate && (
            <div className="space-y-4">
              <div className="rounded-lg border bg-muted/50 p-4 space-y-2">
                <div className="text-sm">
                  <span className="font-medium">Subject:</span>{' '}
                  <span className="text-muted-foreground">{previewTemplate.subject}</span>
                </div>
                <div className="text-sm">
                  <span className="font-medium">Preview:</span>{' '}
                  <span className="text-muted-foreground">{previewTemplate.previewText}</span>
                </div>
              </div>
              <ScrollArea className="h-[300px] rounded-lg border bg-background p-4">
                <pre className="whitespace-pre-wrap text-sm font-sans">{previewTemplate.body}</pre>
              </ScrollArea>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setPreviewTemplate(null)}>
                  Close
                </Button>
                <Button onClick={() => {
                  onSelectTemplate(previewTemplate);
                  setPreviewTemplate(null);
                }}>
                  <Check className="h-4 w-4 mr-1" />
                  Use This Template
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export { PRE_DESIGNED_TEMPLATES };
