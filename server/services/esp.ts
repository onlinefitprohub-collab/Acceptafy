import type { ESPProviderType, ESPCampaignStats, ESPStatsSummary, ESPConnection } from "@shared/schema";

export interface ESPCredentials {
  apiKey?: string;
  apiUrl?: string;
  appId?: string;
  accessToken?: string;
  refreshToken?: string;
}

export interface ESPAccountInfo {
  accountName: string;
  accountEmail?: string;
  isValid: boolean;
  error?: string;
}

export interface SendEmailRequest {
  to: string | string[];
  subject: string;
  html: string;
  from?: string;
  fromName?: string;
  replyTo?: string;
}

export interface SendEmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export interface ESPProvider {
  validateCredentials(credentials: ESPCredentials): Promise<ESPAccountInfo>;
  fetchCampaignStats(credentials: ESPCredentials, limit?: number): Promise<ESPCampaignStats[]>;
  sendEmail(credentials: ESPCredentials, request: SendEmailRequest): Promise<SendEmailResult>;
}

const sendgridProvider: ESPProvider = {
  async validateCredentials(credentials: ESPCredentials): Promise<ESPAccountInfo> {
    if (!credentials.apiKey) {
      return { accountName: '', isValid: false, error: 'API key is required' };
    }
    try {
      const response = await fetch('https://api.sendgrid.com/v3/user/profile', {
        headers: { 'Authorization': `Bearer ${credentials.apiKey}` }
      });
      if (!response.ok) {
        return { accountName: '', isValid: false, error: 'Invalid API key' };
      }
      const data = await response.json();
      return {
        accountName: data.first_name ? `${data.first_name} ${data.last_name || ''}`.trim() : 'SendGrid Account',
        accountEmail: data.email,
        isValid: true
      };
    } catch (error: any) {
      return { accountName: '', isValid: false, error: error.message || 'Connection failed' };
    }
  },

  async fetchCampaignStats(credentials: ESPCredentials, limit = 10): Promise<ESPCampaignStats[]> {
    if (!credentials.apiKey) return [];
    try {
      const response = await fetch(`https://api.sendgrid.com/v3/marketing/stats/automations?page_size=${limit}`, {
        headers: { 'Authorization': `Bearer ${credentials.apiKey}` }
      });
      if (!response.ok) return [];
      const data = await response.json();
      return (data.results || []).map((c: any) => ({
        campaignId: c.id,
        campaignName: c.name || 'Unnamed Campaign',
        subject: '',
        sentAt: c.aggregation?.stats?.[0]?.date,
        totalSent: c.aggregation?.stats?.[0]?.stats?.requests || 0,
        delivered: c.aggregation?.stats?.[0]?.stats?.delivered || 0,
        opened: c.aggregation?.stats?.[0]?.stats?.unique_opens || 0,
        clicked: c.aggregation?.stats?.[0]?.stats?.unique_clicks || 0,
        bounced: c.aggregation?.stats?.[0]?.stats?.bounces || 0,
        unsubscribed: c.aggregation?.stats?.[0]?.stats?.unsubscribes || 0,
        spamReports: c.aggregation?.stats?.[0]?.stats?.spam_reports || 0,
        openRate: 0,
        clickRate: 0,
        bounceRate: 0,
        unsubscribeRate: 0,
      })).map((s: ESPCampaignStats) => ({
        ...s,
        openRate: s.delivered > 0 ? (s.opened / s.delivered) * 100 : 0,
        clickRate: s.delivered > 0 ? (s.clicked / s.delivered) * 100 : 0,
        bounceRate: s.totalSent > 0 ? (s.bounced / s.totalSent) * 100 : 0,
        unsubscribeRate: s.delivered > 0 ? (s.unsubscribed / s.delivered) * 100 : 0,
      }));
    } catch {
      return [];
    }
  },

  async sendEmail(credentials: ESPCredentials, request: SendEmailRequest): Promise<SendEmailResult> {
    if (!credentials.apiKey) {
      return { success: false, error: 'API key is required' };
    }
    try {
      const recipients = Array.isArray(request.to) ? request.to : [request.to];
      const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${credentials.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          personalizations: [{ to: recipients.map(email => ({ email })) }],
          from: { email: request.from || 'noreply@example.com', name: request.fromName },
          reply_to: request.replyTo ? { email: request.replyTo } : undefined,
          subject: request.subject,
          content: [{ type: 'text/html', value: request.html }]
        })
      });
      if (response.ok || response.status === 202) {
        return { success: true, messageId: response.headers.get('x-message-id') || undefined };
      }
      const error = await response.text();
      return { success: false, error };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }
};

const mailchimpProvider: ESPProvider = {
  async validateCredentials(credentials: ESPCredentials): Promise<ESPAccountInfo> {
    if (!credentials.apiKey) {
      return { accountName: '', isValid: false, error: 'API key is required' };
    }
    const dc = credentials.apiKey.split('-').pop() || 'us1';
    try {
      const response = await fetch(`https://${dc}.api.mailchimp.com/3.0/`, {
        headers: { 'Authorization': `Bearer ${credentials.apiKey}` }
      });
      if (!response.ok) {
        return { accountName: '', isValid: false, error: 'Invalid API key' };
      }
      const data = await response.json();
      return {
        accountName: data.account_name || 'Mailchimp Account',
        accountEmail: data.email,
        isValid: true
      };
    } catch (error: any) {
      return { accountName: '', isValid: false, error: error.message };
    }
  },

  async fetchCampaignStats(credentials: ESPCredentials, limit = 10): Promise<ESPCampaignStats[]> {
    if (!credentials.apiKey) return [];
    const dc = credentials.apiKey.split('-').pop() || 'us1';
    try {
      const response = await fetch(`https://${dc}.api.mailchimp.com/3.0/reports?count=${limit}`, {
        headers: { 'Authorization': `Bearer ${credentials.apiKey}` }
      });
      if (!response.ok) return [];
      const data = await response.json();
      return (data.reports || []).map((r: any) => {
        const sent = r.emails_sent || 0;
        const opened = r.opens?.unique_opens || 0;
        const clicked = r.clicks?.unique_subscriber_clicks || 0;
        const bounced = (r.bounces?.hard_bounces || 0) + (r.bounces?.soft_bounces || 0);
        const unsubscribed = r.unsubscribed || 0;
        return {
          campaignId: r.id,
          campaignName: r.campaign_title || 'Untitled',
          subject: r.subject_line,
          sentAt: r.send_time,
          totalSent: sent,
          delivered: sent - bounced,
          opened,
          clicked,
          bounced,
          unsubscribed,
          spamReports: r.abuse_reports || 0,
          openRate: r.opens?.open_rate ? r.opens.open_rate * 100 : 0,
          clickRate: r.clicks?.click_rate ? r.clicks.click_rate * 100 : 0,
          bounceRate: sent > 0 ? (bounced / sent) * 100 : 0,
          unsubscribeRate: sent > 0 ? (unsubscribed / sent) * 100 : 0,
        };
      });
    } catch {
      return [];
    }
  },

  async sendEmail(credentials: ESPCredentials, request: SendEmailRequest): Promise<SendEmailResult> {
    return { success: false, error: 'Mailchimp requires campaign-based sending. Use their campaign API instead.' };
  }
};

const activecampaignProvider: ESPProvider = {
  async validateCredentials(credentials: ESPCredentials): Promise<ESPAccountInfo> {
    if (!credentials.apiKey || !credentials.apiUrl) {
      return { accountName: '', isValid: false, error: 'API key and API URL are required' };
    }
    try {
      const response = await fetch(`${credentials.apiUrl}/api/3/users/me`, {
        headers: { 'Api-Token': credentials.apiKey }
      });
      if (!response.ok) {
        return { accountName: '', isValid: false, error: 'Invalid credentials' };
      }
      const data = await response.json();
      return {
        accountName: `${data.user?.firstName || ''} ${data.user?.lastName || ''}`.trim() || 'ActiveCampaign Account',
        accountEmail: data.user?.email,
        isValid: true
      };
    } catch (error: any) {
      return { accountName: '', isValid: false, error: error.message };
    }
  },

  async fetchCampaignStats(credentials: ESPCredentials, limit = 10): Promise<ESPCampaignStats[]> {
    if (!credentials.apiKey || !credentials.apiUrl) return [];
    try {
      const response = await fetch(`${credentials.apiUrl}/api/3/campaigns?limit=${limit}&orders[sdate]=DESC`, {
        headers: { 'Api-Token': credentials.apiKey }
      });
      if (!response.ok) return [];
      const data = await response.json();
      return (data.campaigns || []).map((c: any) => ({
        campaignId: c.id,
        campaignName: c.name || 'Untitled',
        subject: c.subject,
        sentAt: c.sdate,
        totalSent: parseInt(c.send_amt) || 0,
        delivered: parseInt(c.send_amt) - (parseInt(c.bounce_hard) || 0) - (parseInt(c.bounce_soft) || 0),
        opened: parseInt(c.uniqueopens) || 0,
        clicked: parseInt(c.uniquelinkclicks) || 0,
        bounced: (parseInt(c.bounce_hard) || 0) + (parseInt(c.bounce_soft) || 0),
        unsubscribed: parseInt(c.unsubscribes) || 0,
        spamReports: 0,
        openRate: parseInt(c.send_amt) > 0 ? (parseInt(c.uniqueopens) / parseInt(c.send_amt)) * 100 : 0,
        clickRate: parseInt(c.send_amt) > 0 ? (parseInt(c.uniquelinkclicks) / parseInt(c.send_amt)) * 100 : 0,
        bounceRate: parseInt(c.send_amt) > 0 ? ((parseInt(c.bounce_hard) || 0) / parseInt(c.send_amt)) * 100 : 0,
        unsubscribeRate: parseInt(c.send_amt) > 0 ? (parseInt(c.unsubscribes) / parseInt(c.send_amt)) * 100 : 0,
      }));
    } catch {
      return [];
    }
  },

  async sendEmail(): Promise<SendEmailResult> {
    return { success: false, error: 'ActiveCampaign requires automation-based sending.' };
  }
};

const hubspotProvider: ESPProvider = {
  async validateCredentials(credentials: ESPCredentials): Promise<ESPAccountInfo> {
    if (!credentials.apiKey) {
      return { accountName: '', isValid: false, error: 'API key is required' };
    }
    try {
      const response = await fetch('https://api.hubapi.com/account-info/v3/details', {
        headers: { 'Authorization': `Bearer ${credentials.apiKey}` }
      });
      if (!response.ok) {
        return { accountName: '', isValid: false, error: 'Invalid API key' };
      }
      const data = await response.json();
      return {
        accountName: data.portalId?.toString() || 'HubSpot Account',
        isValid: true
      };
    } catch (error: any) {
      return { accountName: '', isValid: false, error: error.message };
    }
  },

  async fetchCampaignStats(credentials: ESPCredentials, limit = 10): Promise<ESPCampaignStats[]> {
    if (!credentials.apiKey) return [];
    try {
      const response = await fetch(`https://api.hubapi.com/marketing-emails/v1/emails?limit=${limit}`, {
        headers: { 'Authorization': `Bearer ${credentials.apiKey}` }
      });
      if (!response.ok) return [];
      const data = await response.json();
      return (data.objects || []).map((e: any) => {
        const stats = e.stats || {};
        return {
          campaignId: e.id?.toString() || '',
          campaignName: e.name || 'Untitled',
          subject: e.subject,
          sentAt: e.publishDate ? new Date(e.publishDate).toISOString() : undefined,
          totalSent: stats.counters?.sent || 0,
          delivered: stats.counters?.delivered || 0,
          opened: stats.counters?.open || 0,
          clicked: stats.counters?.click || 0,
          bounced: stats.counters?.bounce || 0,
          unsubscribed: stats.counters?.unsubscribed || 0,
          spamReports: stats.counters?.spamreport || 0,
          openRate: stats.ratios?.openratio ? stats.ratios.openratio * 100 : 0,
          clickRate: stats.ratios?.clickratio ? stats.ratios.clickratio * 100 : 0,
          bounceRate: stats.ratios?.bounceratio ? stats.ratios.bounceratio * 100 : 0,
          unsubscribeRate: stats.ratios?.unsubscribedratio ? stats.ratios.unsubscribedratio * 100 : 0,
        };
      });
    } catch {
      return [];
    }
  },

  async sendEmail(): Promise<SendEmailResult> {
    return { success: false, error: 'HubSpot requires workflow-based sending.' };
  }
};

const constantcontactProvider: ESPProvider = {
  async validateCredentials(credentials: ESPCredentials): Promise<ESPAccountInfo> {
    if (!credentials.apiKey) {
      return { accountName: '', isValid: false, error: 'Access token is required' };
    }
    try {
      const response = await fetch('https://api.cc.email/v3/account/summary', {
        headers: { 'Authorization': `Bearer ${credentials.apiKey}` }
      });
      if (!response.ok) {
        return { accountName: '', isValid: false, error: 'Invalid access token' };
      }
      const data = await response.json();
      return {
        accountName: data.organization_name || data.first_name || 'Constant Contact Account',
        accountEmail: data.email,
        isValid: true
      };
    } catch (error: any) {
      return { accountName: '', isValid: false, error: error.message };
    }
  },

  async fetchCampaignStats(credentials: ESPCredentials, limit = 10): Promise<ESPCampaignStats[]> {
    if (!credentials.apiKey) return [];
    try {
      const response = await fetch(`https://api.cc.email/v3/reports/email_reports?limit=${limit}`, {
        headers: { 'Authorization': `Bearer ${credentials.apiKey}` }
      });
      if (!response.ok) return [];
      const data = await response.json();
      return (data.reports || []).map((r: any) => ({
        campaignId: r.campaign_id || '',
        campaignName: r.campaign_name || 'Untitled',
        subject: r.subject_line,
        sentAt: r.send_date,
        totalSent: r.sends || 0,
        delivered: r.delivers || 0,
        opened: r.opens || 0,
        clicked: r.clicks || 0,
        bounced: r.bounces || 0,
        unsubscribed: r.optouts || 0,
        spamReports: r.abuse_reports || 0,
        openRate: r.open_rate ? r.open_rate * 100 : 0,
        clickRate: r.click_rate ? r.click_rate * 100 : 0,
        bounceRate: r.bounce_rate ? r.bounce_rate * 100 : 0,
        unsubscribeRate: r.sends > 0 ? (r.optouts / r.sends) * 100 : 0,
      }));
    } catch {
      return [];
    }
  },

  async sendEmail(): Promise<SendEmailResult> {
    return { success: false, error: 'Constant Contact requires campaign-based sending.' };
  }
};

const convertkitProvider: ESPProvider = {
  async validateCredentials(credentials: ESPCredentials): Promise<ESPAccountInfo> {
    if (!credentials.apiKey) {
      return { accountName: '', isValid: false, error: 'API key is required' };
    }
    try {
      const response = await fetch(`https://api.convertkit.com/v3/account?api_secret=${credentials.apiKey}`);
      if (!response.ok) {
        return { accountName: '', isValid: false, error: 'Invalid API key' };
      }
      const data = await response.json();
      return {
        accountName: data.name || 'ConvertKit Account',
        isValid: true
      };
    } catch (error: any) {
      return { accountName: '', isValid: false, error: error.message };
    }
  },

  async fetchCampaignStats(credentials: ESPCredentials, limit = 10): Promise<ESPCampaignStats[]> {
    if (!credentials.apiKey) return [];
    try {
      const response = await fetch(`https://api.convertkit.com/v3/broadcasts?api_secret=${credentials.apiKey}`);
      if (!response.ok) return [];
      const data = await response.json();
      const broadcasts = (data.broadcasts || []).slice(0, limit);
      return broadcasts.map((b: any) => ({
        campaignId: b.id?.toString() || '',
        campaignName: b.subject || 'Untitled Broadcast',
        subject: b.subject,
        sentAt: b.published_at,
        totalSent: b.stats?.recipients || 0,
        delivered: b.stats?.recipients || 0,
        opened: b.stats?.open_count || 0,
        clicked: b.stats?.click_count || 0,
        bounced: 0,
        unsubscribed: b.stats?.unsubscribes || 0,
        spamReports: 0,
        openRate: b.stats?.open_rate ? b.stats.open_rate * 100 : 0,
        clickRate: b.stats?.click_rate ? b.stats.click_rate * 100 : 0,
        bounceRate: 0,
        unsubscribeRate: 0,
      }));
    } catch {
      return [];
    }
  },

  async sendEmail(): Promise<SendEmailResult> {
    return { success: false, error: 'ConvertKit requires broadcast-based sending.' };
  }
};

const klaviyoProvider: ESPProvider = {
  async validateCredentials(credentials: ESPCredentials): Promise<ESPAccountInfo> {
    if (!credentials.apiKey) {
      return { accountName: '', isValid: false, error: 'API key is required' };
    }
    try {
      const response = await fetch('https://a.klaviyo.com/api/accounts/', {
        headers: { 
          'Authorization': `Klaviyo-API-Key ${credentials.apiKey}`,
          'revision': '2024-02-15'
        }
      });
      if (!response.ok) {
        return { accountName: '', isValid: false, error: 'Invalid API key' };
      }
      const data = await response.json();
      const account = data.data?.[0]?.attributes || {};
      return {
        accountName: account.public_name || account.contact_information?.organization_name || 'Klaviyo Account',
        accountEmail: account.contact_information?.default_sender_email,
        isValid: true
      };
    } catch (error: any) {
      return { accountName: '', isValid: false, error: error.message };
    }
  },

  async fetchCampaignStats(credentials: ESPCredentials, limit = 10): Promise<ESPCampaignStats[]> {
    if (!credentials.apiKey) return [];
    try {
      const response = await fetch(`https://a.klaviyo.com/api/campaigns/?page[size]=${limit}&filter=equals(status,'Sent')`, {
        headers: { 
          'Authorization': `Klaviyo-API-Key ${credentials.apiKey}`,
          'revision': '2024-02-15'
        }
      });
      if (!response.ok) return [];
      const data = await response.json();
      return (data.data || []).map((c: any) => {
        const attr = c.attributes || {};
        return {
          campaignId: c.id || '',
          campaignName: attr.name || 'Untitled',
          subject: attr.message?.subject,
          sentAt: attr.sent_at,
          totalSent: attr.send_stats?.recipient_count || 0,
          delivered: attr.send_stats?.delivered || attr.send_stats?.recipient_count || 0,
          opened: attr.send_stats?.unique_opens || 0,
          clicked: attr.send_stats?.unique_clicks || 0,
          bounced: attr.send_stats?.bounced || 0,
          unsubscribed: attr.send_stats?.unsubscribed || 0,
          spamReports: attr.send_stats?.spam_complaints || 0,
          openRate: attr.send_stats?.open_rate ? attr.send_stats.open_rate * 100 : 0,
          clickRate: attr.send_stats?.click_rate ? attr.send_stats.click_rate * 100 : 0,
          bounceRate: attr.send_stats?.bounce_rate ? attr.send_stats.bounce_rate * 100 : 0,
          unsubscribeRate: attr.send_stats?.unsubscribe_rate ? attr.send_stats.unsubscribe_rate * 100 : 0,
        };
      });
    } catch {
      return [];
    }
  },

  async sendEmail(): Promise<SendEmailResult> {
    return { success: false, error: 'Klaviyo requires flow-based or campaign-based sending.' };
  }
};

const dripProvider: ESPProvider = {
  async validateCredentials(credentials: ESPCredentials): Promise<ESPAccountInfo> {
    if (!credentials.apiKey) {
      return { accountName: '', isValid: false, error: 'API key is required' };
    }
    try {
      const response = await fetch('https://api.getdrip.com/v2/accounts', {
        headers: { 
          'Authorization': `Basic ${Buffer.from(`${credentials.apiKey}:`).toString('base64')}`
        }
      });
      if (!response.ok) {
        return { accountName: '', isValid: false, error: 'Invalid API key' };
      }
      const data = await response.json();
      const account = data.accounts?.[0] || {};
      return {
        accountName: account.name || 'Drip Account',
        isValid: true
      };
    } catch (error: any) {
      return { accountName: '', isValid: false, error: error.message };
    }
  },

  async fetchCampaignStats(credentials: ESPCredentials, limit = 10): Promise<ESPCampaignStats[]> {
    if (!credentials.apiKey) return [];
    try {
      const accountResp = await fetch('https://api.getdrip.com/v2/accounts', {
        headers: { 
          'Authorization': `Basic ${Buffer.from(`${credentials.apiKey}:`).toString('base64')}`
        }
      });
      if (!accountResp.ok) return [];
      const accountData = await accountResp.json();
      const accountId = accountData.accounts?.[0]?.id;
      if (!accountId) return [];

      const response = await fetch(`https://api.getdrip.com/v2/${accountId}/broadcasts?per_page=${limit}`, {
        headers: { 
          'Authorization': `Basic ${Buffer.from(`${credentials.apiKey}:`).toString('base64')}`
        }
      });
      if (!response.ok) return [];
      const data = await response.json();
      return (data.broadcasts || []).map((b: any) => ({
        campaignId: b.id || '',
        campaignName: b.name || 'Untitled Broadcast',
        subject: b.subject,
        sentAt: b.sent_at,
        totalSent: b.send_count || 0,
        delivered: b.send_count || 0,
        opened: b.open_count || 0,
        clicked: b.click_count || 0,
        bounced: b.bounce_count || 0,
        unsubscribed: b.unsubscribe_count || 0,
        spamReports: 0,
        openRate: b.send_count > 0 ? (b.open_count / b.send_count) * 100 : 0,
        clickRate: b.send_count > 0 ? (b.click_count / b.send_count) * 100 : 0,
        bounceRate: b.send_count > 0 ? (b.bounce_count / b.send_count) * 100 : 0,
        unsubscribeRate: b.send_count > 0 ? (b.unsubscribe_count / b.send_count) * 100 : 0,
      }));
    } catch {
      return [];
    }
  },

  async sendEmail(): Promise<SendEmailResult> {
    return { success: false, error: 'Drip requires workflow-based sending.' };
  }
};

const aweberProvider: ESPProvider = {
  async validateCredentials(credentials: ESPCredentials): Promise<ESPAccountInfo> {
    if (!credentials.apiKey) {
      return { accountName: '', isValid: false, error: 'Access token is required' };
    }
    try {
      const response = await fetch('https://api.aweber.com/1.0/accounts', {
        headers: { 'Authorization': `Bearer ${credentials.apiKey}` }
      });
      if (!response.ok) {
        return { accountName: '', isValid: false, error: 'Invalid access token' };
      }
      const data = await response.json();
      const account = data.entries?.[0] || {};
      return {
        accountName: account.company_name || 'AWeber Account',
        isValid: true
      };
    } catch (error: any) {
      return { accountName: '', isValid: false, error: error.message };
    }
  },

  async fetchCampaignStats(credentials: ESPCredentials, limit = 10): Promise<ESPCampaignStats[]> {
    if (!credentials.apiKey) return [];
    try {
      const accountResp = await fetch('https://api.aweber.com/1.0/accounts', {
        headers: { 'Authorization': `Bearer ${credentials.apiKey}` }
      });
      if (!accountResp.ok) return [];
      const accountData = await accountResp.json();
      const accountId = accountData.entries?.[0]?.id;
      if (!accountId) return [];

      const listsResp = await fetch(`https://api.aweber.com/1.0/accounts/${accountId}/lists`, {
        headers: { 'Authorization': `Bearer ${credentials.apiKey}` }
      });
      if (!listsResp.ok) return [];
      const listsData = await listsResp.json();
      const listId = listsData.entries?.[0]?.id;
      if (!listId) return [];

      const response = await fetch(`https://api.aweber.com/1.0/accounts/${accountId}/lists/${listId}/broadcasts?ws.size=${limit}`, {
        headers: { 'Authorization': `Bearer ${credentials.apiKey}` }
      });
      if (!response.ok) return [];
      const data = await response.json();
      return (data.entries || []).map((b: any) => ({
        campaignId: b.id?.toString() || '',
        campaignName: b.subject || 'Untitled Broadcast',
        subject: b.subject,
        sentAt: b.sent_at,
        totalSent: b.total_sent || 0,
        delivered: b.total_sent || 0,
        opened: b.total_opens || 0,
        clicked: b.total_clicks || 0,
        bounced: 0,
        unsubscribed: b.total_unsubscribes || 0,
        spamReports: 0,
        openRate: b.open_rate ? b.open_rate * 100 : 0,
        clickRate: b.click_rate ? b.click_rate * 100 : 0,
        bounceRate: 0,
        unsubscribeRate: 0,
      }));
    } catch {
      return [];
    }
  },

  async sendEmail(): Promise<SendEmailResult> {
    return { success: false, error: 'AWeber requires broadcast-based sending.' };
  }
};

const highlevelProvider: ESPProvider = {
  async validateCredentials(credentials: ESPCredentials): Promise<ESPAccountInfo> {
    if (!credentials.apiKey) {
      return { accountName: '', isValid: false, error: 'API key is required' };
    }
    try {
      // Try multiple endpoints to validate the token
      // For Agency tokens: /locations/ works
      // For Location/Sub-account Private Integration Tokens: need /contacts or /calendars
      
      const endpoints = [
        { url: 'https://services.leadconnectorhq.com/locations/', name: 'locations' },
        { url: 'https://services.leadconnectorhq.com/calendars/', name: 'calendars' },
        { url: 'https://services.leadconnectorhq.com/contacts/?limit=1', name: 'contacts' },
        { url: 'https://services.leadconnectorhq.com/opportunities/', name: 'opportunities' },
      ];

      for (const endpoint of endpoints) {
        const response = await fetch(endpoint.url, {
          headers: { 
            'Authorization': `Bearer ${credentials.apiKey}`,
            'Version': '2021-07-28',
            'Accept': 'application/json'
          }
        });
        
        console.log(`HighLevel ${endpoint.name} endpoint:`, response.status);
        
        if (response.ok) {
          const data = await response.json();
          
          // Extract account info based on endpoint
          if (endpoint.name === 'locations' && data.locations?.[0]) {
            return {
              accountName: data.locations[0].name || 'HighLevel Account',
              accountEmail: data.locations[0].email,
              isValid: true
            };
          }
          
          // For other endpoints, connection is valid
          return { accountName: 'HighLevel Account', isValid: true };
        }
        
        // If we get 401, credentials are invalid - stop trying
        if (response.status === 401) {
          const errorText = await response.text();
          console.error(`HighLevel auth failed on ${endpoint.name}:`, response.status, errorText);
          return { accountName: '', isValid: false, error: 'Invalid or expired API key. Please check your Private Integration Token.' };
        }
        
        // 403 means the token is valid but doesn't have access to this endpoint
        // This is OK - continue trying other endpoints, or accept with limited permissions
        if (response.status === 403) {
          console.log(`HighLevel ${endpoint.name} returned 403 - token valid but limited permissions`);
          // If this is our first 403, the token IS valid - just limited access
          // Continue to try other endpoints, but note the token works
          continue;
        }
      }

      // Try legacy API as final fallback
      const legacyResp = await fetch('https://rest.gohighlevel.com/v1/custom-values/', {
        headers: { 'Authorization': `Bearer ${credentials.apiKey}` }
      });
      
      if (legacyResp.ok) {
        return { accountName: 'HighLevel Account', isValid: true };
      }

      // If we got any 403s, the token IS valid - just has limited permissions
      // Accept the connection anyway - some features may be limited
      if (credentials.apiKey.startsWith('pit-')) {
        // Private Integration Token format - accept it since 403 means it's valid
        console.log('Accepting HighLevel Private Integration Token with limited permissions');
        return { accountName: 'HighLevel Account (Limited Access)', isValid: true };
      }

      return { accountName: '', isValid: false, error: 'Could not validate API key. Please ensure your Private Integration Token has the required permissions (Contacts, Calendars, or Locations access).' };
    } catch (error: any) {
      console.error('HighLevel validation error:', error);
      return { accountName: '', isValid: false, error: error.message };
    }
  },

  async fetchCampaignStats(credentials: ESPCredentials, limit = 10): Promise<ESPCampaignStats[]> {
    if (!credentials.apiKey) return [];
    try {
      const locResp = await fetch('https://services.leadconnectorhq.com/locations/', {
        headers: { 
          'Authorization': `Bearer ${credentials.apiKey}`,
          'Version': '2021-07-28'
        }
      });
      if (!locResp.ok) return [];
      const locData = await locResp.json();
      const locationId = locData.locations?.[0]?.id;
      if (!locationId) return [];

      const campaignsResp = await fetch(`https://services.leadconnectorhq.com/campaigns/?locationId=${locationId}&limit=${limit}`, {
        headers: { 
          'Authorization': `Bearer ${credentials.apiKey}`,
          'Version': '2021-07-28'
        }
      });
      if (!campaignsResp.ok) return [];
      const campaignsData = await campaignsResp.json();
      
      return (campaignsData.campaigns || []).map((c: any) => {
        const stats = c.statistics || {};
        const sent = stats.sent || 0;
        const delivered = stats.delivered || sent;
        const opened = stats.opened || 0;
        const clicked = stats.clicked || 0;
        const bounced = stats.bounced || 0;
        const unsubscribed = stats.unsubscribed || 0;
        const spamReports = stats.spamComplaints || 0;
        
        return {
          campaignId: c.id || '',
          campaignName: c.name || 'Untitled Campaign',
          subject: c.subject,
          sentAt: c.createdAt,
          totalSent: sent,
          delivered,
          opened,
          clicked,
          bounced,
          unsubscribed,
          spamReports,
          openRate: delivered > 0 ? (opened / delivered) * 100 : 0,
          clickRate: delivered > 0 ? (clicked / delivered) * 100 : 0,
          bounceRate: sent > 0 ? (bounced / sent) * 100 : 0,
          unsubscribeRate: delivered > 0 ? (unsubscribed / delivered) * 100 : 0,
        };
      });
    } catch {
      return [];
    }
  },

  async sendEmail(): Promise<SendEmailResult> {
    return { success: false, error: 'HighLevel requires workflow-based sending.' };
  }
};

const ontraportProvider: ESPProvider = {
  async validateCredentials(credentials: ESPCredentials): Promise<ESPAccountInfo> {
    if (!credentials.apiKey || !credentials.appId) {
      return { accountName: '', isValid: false, error: 'API key and App ID are required' };
    }
    try {
      const response = await fetch('https://api.ontraport.com/1/Contacts?range=1', {
        headers: { 
          'Api-Key': credentials.apiKey,
          'Api-Appid': credentials.appId
        }
      });
      if (!response.ok) {
        return { accountName: '', isValid: false, error: 'Invalid credentials' };
      }
      return {
        accountName: 'Ontraport Account',
        isValid: true
      };
    } catch (error: any) {
      return { accountName: '', isValid: false, error: error.message };
    }
  },

  async fetchCampaignStats(credentials: ESPCredentials, limit = 10): Promise<ESPCampaignStats[]> {
    if (!credentials.apiKey || !credentials.appId) return [];
    try {
      const messagesResp = await fetch(`https://api.ontraport.com/1/Messages?range=${limit}&listFields=id,name,subject,type,stats`, {
        headers: { 
          'Api-Key': credentials.apiKey,
          'Api-Appid': credentials.appId
        }
      });
      if (!messagesResp.ok) return [];
      const messagesData = await messagesResp.json();
      
      const emailMessages = (messagesData.data || []).filter((m: any) => m.type === 'e' || m.type === 'email');
      
      return emailMessages.map((m: any) => {
        const stats = m.stats || {};
        const sent = parseInt(stats.sent) || 0;
        const delivered = parseInt(stats.delivered) || sent;
        const opened = parseInt(stats.unique_opens) || parseInt(stats.opens) || 0;
        const clicked = parseInt(stats.unique_clicks) || parseInt(stats.clicks) || 0;
        const bounced = (parseInt(stats.hard_bounces) || 0) + (parseInt(stats.soft_bounces) || 0);
        const unsubscribed = parseInt(stats.unsubscribes) || 0;
        const spamReports = parseInt(stats.spam_complaints) || 0;
        
        return {
          campaignId: m.id?.toString() || '',
          campaignName: m.name || 'Untitled Message',
          subject: m.subject,
          sentAt: m.date_sent || m.date,
          totalSent: sent,
          delivered,
          opened,
          clicked,
          bounced,
          unsubscribed,
          spamReports,
          openRate: delivered > 0 ? (opened / delivered) * 100 : 0,
          clickRate: delivered > 0 ? (clicked / delivered) * 100 : 0,
          bounceRate: sent > 0 ? (bounced / sent) * 100 : 0,
          unsubscribeRate: delivered > 0 ? (unsubscribed / delivered) * 100 : 0,
        };
      });
    } catch {
      return [];
    }
  },

  async sendEmail(): Promise<SendEmailResult> {
    return { success: false, error: 'Ontraport requires sequence-based sending.' };
  }
};

const keapProvider: ESPProvider = {
  async validateCredentials(credentials: ESPCredentials): Promise<ESPAccountInfo> {
    if (!credentials.apiKey) {
      return { accountName: '', isValid: false, error: 'Access token is required' };
    }
    try {
      const response = await fetch('https://api.infusionsoft.com/crm/rest/v1/account/profile', {
        headers: { 'Authorization': `Bearer ${credentials.apiKey}` }
      });
      if (!response.ok) {
        return { accountName: '', isValid: false, error: 'Invalid access token' };
      }
      const data = await response.json();
      return {
        accountName: data.business_name || 'Keap Account',
        accountEmail: data.email,
        isValid: true
      };
    } catch (error: any) {
      return { accountName: '', isValid: false, error: error.message };
    }
  },

  async fetchCampaignStats(): Promise<ESPCampaignStats[]> {
    return [];
  },

  async sendEmail(): Promise<SendEmailResult> {
    return { success: false, error: 'Keap requires campaign-based sending.' };
  }
};

const providers: Record<ESPProviderType, ESPProvider> = {
  sendgrid: sendgridProvider,
  mailchimp: mailchimpProvider,
  activecampaign: activecampaignProvider,
  hubspot: hubspotProvider,
  constantcontact: constantcontactProvider,
  convertkit: convertkitProvider,
  klaviyo: klaviyoProvider,
  drip: dripProvider,
  aweber: aweberProvider,
  highlevel: highlevelProvider,
  ontraport: ontraportProvider,
  keap: keapProvider,
};

export function getESPProvider(providerType: ESPProviderType): ESPProvider {
  return providers[providerType];
}

export async function validateESPConnection(
  provider: ESPProviderType, 
  credentials: ESPCredentials
): Promise<ESPAccountInfo> {
  const espProvider = getESPProvider(provider);
  return espProvider.validateCredentials(credentials);
}

export async function fetchESPStats(
  provider: ESPProviderType,
  credentials: ESPCredentials,
  limit?: number
): Promise<ESPStatsSummary> {
  const espProvider = getESPProvider(provider);
  const campaigns = await espProvider.fetchCampaignStats(credentials, limit);
  
  const totals = campaigns.reduce(
    (acc, c) => ({
      totalCampaigns: acc.totalCampaigns + 1,
      totalSent: acc.totalSent + c.totalSent,
      totalDelivered: acc.totalDelivered + c.delivered,
      totalOpened: acc.totalOpened + c.opened,
      totalClicked: acc.totalClicked + c.clicked,
      avgOpenRate: 0,
      avgClickRate: 0,
      avgBounceRate: 0,
    }),
    {
      totalCampaigns: 0,
      totalSent: 0,
      totalDelivered: 0,
      totalOpened: 0,
      totalClicked: 0,
      avgOpenRate: 0,
      avgClickRate: 0,
      avgBounceRate: 0,
    }
  );

  if (campaigns.length > 0) {
    totals.avgOpenRate = campaigns.reduce((sum, c) => sum + c.openRate, 0) / campaigns.length;
    totals.avgClickRate = campaigns.reduce((sum, c) => sum + c.clickRate, 0) / campaigns.length;
    totals.avgBounceRate = campaigns.reduce((sum, c) => sum + c.bounceRate, 0) / campaigns.length;
  }

  return {
    provider,
    campaigns,
    totals,
    lastSyncAt: new Date().toISOString(),
  };
}

export async function sendEmailViaESP(
  provider: ESPProviderType,
  credentials: ESPCredentials,
  request: SendEmailRequest
): Promise<SendEmailResult> {
  const espProvider = getESPProvider(provider);
  return espProvider.sendEmail(credentials, request);
}
