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

export interface CampaignContentResult {
  success: boolean;
  subject?: string;
  htmlContent?: string;
  textContent?: string;
  previewText?: string;
  error?: string;
}

export interface ESPProvider {
  validateCredentials(credentials: ESPCredentials): Promise<ESPAccountInfo>;
  fetchCampaignStats(credentials: ESPCredentials, limit?: number): Promise<ESPCampaignStats[]>;
  sendEmail(credentials: ESPCredentials, request: SendEmailRequest): Promise<SendEmailResult>;
  fetchCampaignContent?(credentials: ESPCredentials, campaignId: string): Promise<CampaignContentResult>;
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
      const allCampaigns: (ESPCampaignStats & { _sortDate?: string })[] = [];
      
      // Fetch both automation and single-send stats in parallel
      // Request more than limit to ensure we get a good mix after merging
      const fetchSize = Math.max(limit, 25);
      
      const [autoResponse, singleResponse] = await Promise.all([
        fetch(`https://api.sendgrid.com/v3/marketing/stats/automations?page_size=${fetchSize}`, {
          headers: { 'Authorization': `Bearer ${credentials.apiKey}` }
        }),
        fetch(`https://api.sendgrid.com/v3/marketing/stats/singlesends?page_size=${fetchSize}`, {
          headers: { 'Authorization': `Bearer ${credentials.apiKey}` }
        })
      ]);
      
      if (autoResponse.ok) {
        const autoData = await autoResponse.json();
        const automations = (autoData.results || []).map((c: any) => ({
          campaignId: c.id,
          campaignName: c.name || 'Unnamed Automation',
          subject: '',
          sentAt: c.aggregation?.stats?.[0]?.date,
          _sortDate: c.aggregation?.stats?.[0]?.date || '',
          totalSent: c.aggregation?.stats?.[0]?.stats?.requests || 0,
          delivered: c.aggregation?.stats?.[0]?.stats?.delivered || 0,
          opened: c.aggregation?.stats?.[0]?.stats?.unique_opens || 0,
          clicked: c.aggregation?.stats?.[0]?.stats?.unique_clicks || 0,
          bounced: c.aggregation?.stats?.[0]?.stats?.bounces || 0,
          unsubscribed: c.aggregation?.stats?.[0]?.stats?.unsubscribes || 0,
          spamReports: c.aggregation?.stats?.[0]?.stats?.spam_reports || 0,
          openRate: 0, clickRate: 0, bounceRate: 0, unsubscribeRate: 0,
        }));
        allCampaigns.push(...automations);
      }
      
      if (singleResponse.ok) {
        const singleData = await singleResponse.json();
        const singleSends = (singleData.results || []).map((c: any) => ({
          campaignId: c.id,
          campaignName: c.name || 'Unnamed Single Send',
          subject: '',
          sentAt: c.aggregation?.stats?.[0]?.date,
          _sortDate: c.aggregation?.stats?.[0]?.date || '',
          totalSent: c.aggregation?.stats?.[0]?.stats?.requests || 0,
          delivered: c.aggregation?.stats?.[0]?.stats?.delivered || 0,
          opened: c.aggregation?.stats?.[0]?.stats?.unique_opens || 0,
          clicked: c.aggregation?.stats?.[0]?.stats?.unique_clicks || 0,
          bounced: c.aggregation?.stats?.[0]?.stats?.bounces || 0,
          unsubscribed: c.aggregation?.stats?.[0]?.stats?.unsubscribes || 0,
          spamReports: c.aggregation?.stats?.[0]?.stats?.spam_reports || 0,
          openRate: 0, clickRate: 0, bounceRate: 0, unsubscribeRate: 0,
        }));
        allCampaigns.push(...singleSends);
      }
      
      // Sort by date descending and take the most recent 'limit' campaigns
      allCampaigns.sort((a, b) => {
        const dateA = a._sortDate ? new Date(a._sortDate).getTime() : 0;
        const dateB = b._sortDate ? new Date(b._sortDate).getTime() : 0;
        return dateB - dateA;
      });
      
      // Calculate rates for all campaigns and remove sort helper
      return allCampaigns.slice(0, limit).map(({ _sortDate, ...s }) => ({
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
  },

  async fetchCampaignContent(credentials: ESPCredentials, campaignId: string): Promise<CampaignContentResult> {
    if (!credentials.apiKey) {
      return { success: false, error: 'API key is required' };
    }
    try {
      const response = await fetch(`https://api.sendgrid.com/v3/marketing/singlesends/${campaignId}`, {
        headers: { 'Authorization': `Bearer ${credentials.apiKey}` }
      });
      if (!response.ok) {
        return { success: false, error: 'Campaign not found or API error' };
      }
      const data = await response.json();
      return {
        success: true,
        subject: data.email_config?.subject,
        htmlContent: data.email_config?.html_content,
        textContent: data.email_config?.plain_content,
        previewText: data.email_config?.custom_unsubscribe_url,
      };
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
  },

  async fetchCampaignContent(credentials: ESPCredentials, campaignId: string): Promise<CampaignContentResult> {
    if (!credentials.apiKey) {
      return { success: false, error: 'API key is required' };
    }
    const dc = credentials.apiKey.split('-').pop() || 'us1';
    try {
      const response = await fetch(`https://${dc}.api.mailchimp.com/3.0/campaigns/${campaignId}/content`, {
        headers: { 'Authorization': `Bearer ${credentials.apiKey}` }
      });
      if (!response.ok) {
        return { success: false, error: 'Campaign not found or API error' };
      }
      const data = await response.json();
      return {
        success: true,
        htmlContent: data.html,
        textContent: data.plain_text,
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
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
      // Use v3 API with includeStats parameter
      const response = await fetch(`https://api.hubapi.com/marketing/v3/emails?limit=${limit}&includeStats=true`, {
        headers: { 'Authorization': `Bearer ${credentials.apiKey}` }
      });
      if (!response.ok) return [];
      const data = await response.json();
      
      // Get stats for these emails - v3 requires millisecond timestamps and repeated emailId params
      const now = Date.now();
      const yearAgo = now - (365 * 24 * 60 * 60 * 1000);
      const emailIds = (data.results || []).map((e: any) => e.id).filter(Boolean);
      
      let statsMap: Record<string, any> = {};
      if (emailIds.length > 0) {
        // Build URL with repeated emailId parameters
        const emailIdParams = emailIds.map((id: string) => `emailId=${id}`).join('&');
        const statsResp = await fetch(
          `https://api.hubapi.com/marketing/v3/emails/statistics/list?startTimestamp=${yearAgo}&endTimestamp=${now}&${emailIdParams}`,
          { headers: { 'Authorization': `Bearer ${credentials.apiKey}` } }
        );
        if (statsResp.ok) {
          const statsData = await statsResp.json();
          (statsData.results || []).forEach((s: any) => {
            statsMap[s.emailId] = s;
          });
        }
      }
      
      return (data.results || []).map((e: any) => {
        const stats = statsMap[e.id] || {};
        const sent = stats.counters?.sent || e.stats?.counters?.sent || 0;
        const delivered = stats.counters?.delivered || e.stats?.counters?.delivered || sent;
        const opened = stats.counters?.open || e.stats?.counters?.open || 0;
        const clicked = stats.counters?.click || e.stats?.counters?.click || 0;
        const bounced = stats.counters?.bounce || e.stats?.counters?.bounce || 0;
        // HubSpot v3 uses 'unsubscribe' (not 'unsubscribed')
        const unsubscribed = stats.counters?.unsubscribe || e.stats?.counters?.unsubscribe || 0;
        const spamReports = stats.counters?.spamreport || e.stats?.counters?.spamreport || 0;
        
        return {
          campaignId: e.id?.toString() || '',
          campaignName: e.name || 'Untitled',
          subject: e.subject,
          sentAt: e.publishDate ? new Date(e.publishDate).toISOString() : undefined,
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
    return { success: false, error: 'HubSpot requires workflow-based sending.' };
  },

  async fetchCampaignContent(credentials: ESPCredentials, campaignId: string): Promise<CampaignContentResult> {
    if (!credentials.apiKey) {
      return { success: false, error: 'API key is required' };
    }
    try {
      // HubSpot v3: fetch email with content included using includeDetails parameter
      const emailResp = await fetch(`https://api.hubapi.com/marketing/v3/emails/${campaignId}?includeDetails=true&archived=false`, {
        headers: { 
          'Authorization': `Bearer ${credentials.apiKey}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });
      if (!emailResp.ok) {
        return { success: false, error: 'Email not found or API error' };
      }
      const emailData = await emailResp.json();
      
      // HubSpot stores content in various locations depending on email type
      let htmlContent = emailData.content?.html || 
                        emailData.primaryRichTextModuleHtml || 
                        emailData.htmlBody || '';
      let textContent = emailData.content?.plainText || emailData.textBody || '';
      
      // If no content in main response, try fetching the rendered content
      if (!htmlContent) {
        try {
          const contentResp = await fetch(`https://api.hubapi.com/marketing/v3/emails/${campaignId}/content?archived=false`, {
            headers: { 
              'Authorization': `Bearer ${credentials.apiKey}`,
              'Accept': 'application/json'
            }
          });
          if (contentResp.ok) {
            const contentData = await contentResp.json();
            htmlContent = contentData.html || contentData.body || contentData.content || '';
            textContent = contentData.plainText || textContent;
          }
        } catch {
          // Content endpoint may not exist for all email types
        }
      }
      
      return {
        success: true,
        subject: emailData.subject,
        htmlContent,
        textContent,
        previewText: emailData.previewText,
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
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
  },

  async fetchCampaignContent(credentials: ESPCredentials, campaignId: string): Promise<CampaignContentResult> {
    if (!credentials.apiKey) {
      return { success: false, error: 'API key is required' };
    }
    try {
      // Klaviyo 2024 revision: get campaign with message relationship
      const campaignResp = await fetch(`https://a.klaviyo.com/api/campaigns/${campaignId}/?include=campaign-messages`, {
        headers: { 
          'Authorization': `Klaviyo-API-Key ${credentials.apiKey}`,
          'revision': '2024-10-15',
          'Accept': 'application/json'
        }
      });
      if (!campaignResp.ok) {
        return { success: false, error: 'Campaign not found or API error' };
      }
      
      const campaignData = await campaignResp.json();
      const campaign = campaignData.data?.attributes || {};
      
      // Look for included messages in the response
      const includedMessages = campaignData.included || [];
      let htmlContent = '';
      let textContent = '';
      let subject = campaign.name || '';
      let previewText = '';
      
      // Get content from included messages
      for (const item of includedMessages) {
        if (item.type === 'campaign-message') {
          const msgAttrs = item.attributes || {};
          if (msgAttrs.content) {
            htmlContent = msgAttrs.content.html_body || msgAttrs.content.html || htmlContent;
            textContent = msgAttrs.content.text_body || msgAttrs.content.text || textContent;
          }
          subject = msgAttrs.subject || subject;
          previewText = msgAttrs.preview_text || previewText;
          break; // Take first message
        }
      }
      
      // Fallback: try campaign-messages endpoint directly
      if (!htmlContent) {
        const msgResp = await fetch(`https://a.klaviyo.com/api/campaign-messages/?filter=equals(campaign.id,"${campaignId}")`, {
          headers: { 
            'Authorization': `Klaviyo-API-Key ${credentials.apiKey}`,
            'revision': '2024-10-15',
            'Accept': 'application/json'
          }
        });
        if (msgResp.ok) {
          const msgData = await msgResp.json();
          const message = msgData.data?.[0]?.attributes || {};
          if (message.content) {
            htmlContent = message.content.html_body || message.content.html || '';
            textContent = message.content.text_body || message.content.text || '';
          }
          subject = message.subject || subject;
          previewText = message.preview_text || previewText;
        }
      }
      
      return {
        success: true,
        subject,
        htmlContent,
        textContent,
        previewText,
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
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
      // For Private Integration Tokens (pit-*), try different approaches
      const isPIT = credentials.apiKey.startsWith('pit-');
      
      // Try to get location ID first (works for Agency tokens)
      let locationId: string | null = null;
      const locResp = await fetch('https://services.leadconnectorhq.com/locations/', {
        headers: { 
          'Authorization': `Bearer ${credentials.apiKey}`,
          'Version': '2021-07-28'
        }
      });
      
      if (locResp.ok) {
        const locData = await locResp.json();
        locationId = locData.locations?.[0]?.id;
      }

      // Try email/campaigns endpoints with multiple approaches
      const endpoints = [
        // V2 API campaigns endpoint
        locationId 
          ? `https://services.leadconnectorhq.com/campaigns/?locationId=${locationId}&limit=${limit}`
          : null,
        // Email campaigns/statistics endpoint
        'https://services.leadconnectorhq.com/emails/stats',
        // Marketing email stats
        'https://services.leadconnectorhq.com/marketing/emails',
        // Conversations/messages (has email stats)
        'https://services.leadconnectorhq.com/conversations/messages',
      ].filter(Boolean);

      for (const endpoint of endpoints) {
        if (!endpoint) continue;
        
        const resp = await fetch(endpoint, {
          headers: { 
            'Authorization': `Bearer ${credentials.apiKey}`,
            'Version': '2021-07-28',
            'Accept': 'application/json'
          }
        });
        
        
        if (resp.ok) {
          const data = await resp.json();
          
          // Parse campaigns from response
          const campaigns = data.campaigns || data.emails || data.data || data.messages || [];
          if (campaigns.length > 0) {
            return campaigns.slice(0, limit).map((c: any) => {
              const stats = c.statistics || c.stats || c;
              const sent = stats.sent || stats.totalSent || 0;
              const delivered = stats.delivered || sent;
              const opened = stats.opened || stats.opens || stats.uniqueOpens || 0;
              const clicked = stats.clicked || stats.clicks || stats.uniqueClicks || 0;
              const bounced = stats.bounced || stats.bounces || 0;
              const unsubscribed = stats.unsubscribed || stats.unsubscribes || 0;
              const spamReports = stats.spamComplaints || stats.complaints || 0;
              
              return {
                campaignId: c.id || c._id || '',
                campaignName: c.name || c.subject || 'Untitled Campaign',
                subject: c.subject || c.name,
                sentAt: c.createdAt || c.sentAt || c.date,
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
          }
        }
      }

      return [];
    } catch (error) {
      console.error('HighLevel fetchCampaignStats error:', error);
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
      // Use the Messages endpoint - it contains mcsent, mcopened, mcclicked stats
      // Filter for messages that have been sent (mcsent > 0)
      const endpoint = `https://api.ontraport.com/1/Messages?range=${limit}&sort=date&sortDir=desc`;
      
      console.log(`Ontraport fetching messages: ${endpoint}`);
      const resp = await fetch(endpoint, {
        headers: { 
          'Api-Key': credentials.apiKey,
          'Api-Appid': credentials.appId
        }
      });
      
      console.log(`Ontraport messages response:`, resp.status);
      
      if (resp.ok) {
        const data = await resp.json();
        console.log('Ontraport messages raw:', JSON.stringify(data).slice(0, 1500));
        
        const messages = data.data || [];
        // Filter for messages that have actually been sent (mcsent > 0)
        const sentMessages = messages.filter((m: any) => parseInt(m.mcsent) > 0);
        
        console.log(`Ontraport found ${sentMessages.length} sent messages out of ${messages.length} total`);
        
        if (sentMessages.length > 0) {
          return sentMessages.slice(0, limit).map((m: any) => {
            // Ontraport uses mc* prefix for stats: mcsent, mcopened, mcclicked, mcabuse, mcunsub
            const sent = parseInt(m.mcsent) || 0;
            const delivered = sent; // Ontraport doesn't provide separate delivered count
            const opened = parseInt(m.mcopened) || 0;
            const clicked = parseInt(m.mcclicked) || 0;
            const bounced = 0; // Not directly available in Messages endpoint
            const unsubscribed = parseInt(m.mcunsub) || 0;
            const spamReports = parseInt(m.mcabuse) || 0;
            
            // Calculate rates
            const openRate = sent > 0 ? (opened / sent) * 100 : 0;
            const clickRate = sent > 0 ? (clicked / sent) * 100 : 0;
            
            return {
              campaignId: m.id?.toString() || '',
              campaignName: m.alias || m.subject || m.name || 'Untitled Message',
              subject: m.subject || m.alias || m.name,
              sentAt: m.date ? new Date(parseInt(m.date) * 1000).toISOString() : undefined,
              totalSent: sent,
              delivered,
              opened,
              clicked,
              bounced,
              unsubscribed,
              spamReports,
              openRate,
              clickRate,
              bounceRate: 0,
              unsubscribeRate: sent > 0 ? (unsubscribed / sent) * 100 : 0,
            };
          });
        }
      }
      
      console.log('Ontraport: No sent messages found');
      return [];
    } catch (error) {
      console.error('Ontraport fetchCampaignStats error:', error);
      return [];
    }
  },

  async sendEmail(): Promise<SendEmailResult> {
    return { success: false, error: 'Ontraport requires sequence-based sending.' };
  },

  async fetchCampaignContent(credentials: ESPCredentials, campaignId: string): Promise<CampaignContentResult> {
    if (!credentials.apiKey || !credentials.appId) {
      return { success: false, error: 'API key and App ID are required' };
    }
    try {
      // Ontraport: Use Message endpoint with encode=0 to get raw content
      const response = await fetch(`https://api.ontraport.com/1/Message?id=${campaignId}&encode=0`, {
        headers: { 
          'Api-Key': credentials.apiKey,
          'Api-Appid': credentials.appId,
          'Content-Type': 'application/json'
        }
      });
      if (!response.ok) {
        return { success: false, error: 'Message not found or API error' };
      }
      const data = await response.json();
      const message = data.data || {};
      
      // Ontraport stores HTML in message_body, content, or email_message
      let htmlContent = message.message_body || message.email_message || message.content || message.body || '';
      
      // Handle case where content might still be encoded
      if (htmlContent && typeof htmlContent === 'string' && htmlContent.includes('%')) {
        try {
          // Only decode if it looks like URL encoding
          if (/%[0-9A-Fa-f]{2}/.test(htmlContent)) {
            htmlContent = decodeURIComponent(htmlContent);
          }
        } catch {
          // Keep original if decoding fails
        }
      }
      
      return {
        success: true,
        subject: message.subject || message.alias || message.name,
        htmlContent,
        textContent: message.plaintext || message.text_body || '',
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
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

  async fetchCampaignStats(credentials: ESPCredentials, limit = 10): Promise<ESPCampaignStats[]> {
    if (!credentials.apiKey) return [];
    try {
      // Get list of emails first
      const listResponse = await fetch(`https://api.infusionsoft.com/crm/rest/v1/emails?limit=${limit}`, {
        headers: { 'Authorization': `Bearer ${credentials.apiKey}` }
      });
      
      if (!listResponse.ok) {
        console.log('Keap emails list endpoint failed:', listResponse.status);
        return [];
      }
      
      const listData = await listResponse.json();
      const emails = listData.emails || [];
      
      // Fetch detailed stats for each email
      const results: ESPCampaignStats[] = [];
      for (const email of emails.slice(0, limit)) {
        try {
          const statsResponse = await fetch(`https://api.infusionsoft.com/crm/rest/v1/emails/${email.id}`, {
            headers: { 'Authorization': `Bearer ${credentials.apiKey}` }
          });
          
          if (statsResponse.ok) {
            const e = await statsResponse.json();
            const sent = e.sent_count || e.sent_to_count || 0;
            const delivered = sent;
            const opened = e.opened_count || e.unique_opens || 0;
            const clicked = e.clicked_count || e.unique_clicks || 0;
            const bounced = e.bounced_count || e.bounce_count || 0;
            const unsubscribed = e.unsubscribed_count || e.unsubscribe_count || 0;
            const spamReports = e.complaint_count || e.spam_count || 0;
            
            results.push({
              campaignId: e.id?.toString() || '',
              campaignName: e.subject || e.name || 'Untitled Email',
              subject: e.subject,
              sentAt: e.sent_date || e.date_sent,
              totalSent: sent,
              delivered,
              opened,
              clicked,
              bounced,
              unsubscribed,
              spamReports,
              openRate: sent > 0 ? (opened / sent) * 100 : 0,
              clickRate: sent > 0 ? (clicked / sent) * 100 : 0,
              bounceRate: sent > 0 ? (bounced / sent) * 100 : 0,
              unsubscribeRate: sent > 0 ? (unsubscribed / sent) * 100 : 0,
            });
          }
        } catch {
          // Skip emails that fail to fetch stats
        }
      }
      
      return results;
    } catch (error) {
      console.error('Keap fetchCampaignStats error:', error);
      return [];
    }
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

export async function fetchESPCampaignContent(
  provider: ESPProviderType,
  credentials: ESPCredentials,
  campaignId: string
): Promise<CampaignContentResult> {
  const espProvider = getESPProvider(provider);
  if (!espProvider.fetchCampaignContent) {
    return { 
      success: false, 
      error: `${provider} does not support fetching email content` 
    };
  }
  return espProvider.fetchCampaignContent(credentials, campaignId);
}
