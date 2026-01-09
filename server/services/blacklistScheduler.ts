import { storage } from '../storage';
import { checkBlacklists } from './blacklistChecker';
import { Resend } from 'resend';

let cachedCredentials: { apiKey: string; fromEmail: string | null } | null = null;

async function getResendCredentials(): Promise<{ apiKey: string; fromEmail: string | null } | null> {
  if (cachedCredentials) return cachedCredentials;
  
  // First, try the Replit connector
  try {
    const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
    const xReplitToken = process.env.REPL_IDENTITY 
      ? 'repl ' + process.env.REPL_IDENTITY 
      : process.env.WEB_REPL_RENEWAL 
      ? 'depl ' + process.env.WEB_REPL_RENEWAL 
      : null;

    if (xReplitToken && hostname) {
      const response = await fetch(
        'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=resend',
        {
          headers: {
            'Accept': 'application/json',
            'X_REPLIT_TOKEN': xReplitToken
          }
        }
      );
      
      const data = await response.json();
      const connectionSettings = data.items?.[0];

      if (connectionSettings?.settings?.api_key) {
        cachedCredentials = { 
          apiKey: connectionSettings.settings.api_key, 
          fromEmail: connectionSettings.settings.from_email || null 
        };
        return cachedCredentials;
      }
    }
  } catch (error) {
    console.log('Resend connector not available, trying env var fallback:', error);
  }
  
  // Fallback to RESEND_API_KEY environment variable
  const apiKey = process.env.RESEND_API_KEY;
  if (apiKey) {
    cachedCredentials = { 
      apiKey, 
      fromEmail: null 
    };
    return cachedCredentials;
  }
  
  console.log('No Resend credentials available (neither connector nor RESEND_API_KEY)');
  return null;
}

async function getResendClient(): Promise<{ client: Resend; fromEmail: string } | null> {
  const credentials = await getResendCredentials();
  if (!credentials) return null;
  
  const formattedFromEmail = credentials.fromEmail 
    ? `Acceptafy <${credentials.fromEmail}>` 
    : 'Acceptafy <hello@updates.acceptafy.com>';
  
  return {
    client: new Resend(credentials.apiKey),
    fromEmail: formattedFromEmail
  };
}

interface SchedulerConfig {
  dailyHour: number;
  weeklyDay: number;
  weeklyHour: number;
}

const config: SchedulerConfig = {
  dailyHour: 6,
  weeklyDay: 1,
  weeklyHour: 6,
};

let schedulerInterval: NodeJS.Timeout | null = null;
let isRunning = false;

async function sendBlacklistAlert(
  userEmail: string,
  domain: string,
  listedOn: number,
  blacklists: string[]
): Promise<void> {
  const resendClient = await getResendClient();
  if (!resendClient) {
    console.log('Resend not configured, skipping blacklist alert email');
    return;
  }

  try {
    await resendClient.client.emails.send({
      from: resendClient.fromEmail,
      to: userEmail,
      subject: `Alert: ${domain} found on ${listedOn} blacklist(s)`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #0f0a1e; color: #e2e8f0; padding: 40px 20px; margin: 0;">
          <div style="max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #1a1033 0%, #0f0a1e 100%); border-radius: 16px; padding: 40px; border: 1px solid #2d2150;">
            <div style="text-align: center; margin-bottom: 32px;">
              <h1 style="color: #ef4444; font-size: 28px; margin: 0;">Blacklist Alert</h1>
            </div>
            <p style="font-size: 16px; line-height: 1.6; margin-bottom: 24px;">Your domain/IP <strong style="color: #a855f7;">${domain}</strong> has been found on <strong>${listedOn}</strong> blacklist(s):</p>
            <ul style="font-size: 16px; line-height: 1.8; margin-bottom: 24px; padding-left: 24px; color: #ef4444;">
              ${blacklists.map(bl => `<li>${bl}</li>`).join('')}
            </ul>
            <p style="font-size: 16px; line-height: 1.6; margin-bottom: 24px;">This can severely impact your email deliverability. We recommend taking immediate action to get delisted.</p>
            <div style="text-align: center; margin: 32px 0;">
              <a href="https://acceptafy.com/blacklist-monitor" style="display: inline-block; background: linear-gradient(135deg, #a855f7, #ec4899); color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600;">View Details & Delisting Guide</a>
            </div>
            <hr style="border: none; border-top: 1px solid #2d2150; margin: 32px 0;" />
            <p style="font-size: 12px; color: #64748b; text-align: center;">You're receiving this alert because you have monitoring enabled for ${domain} on Acceptafy.</p>
          </div>
        </body>
        </html>
      `,
      text: `Blacklist Alert

Your domain/IP ${domain} has been found on ${listedOn} blacklist(s):
${blacklists.map(bl => `- ${bl}`).join('\n')}

This can severely impact your email deliverability. We recommend taking immediate action to get delisted.

Visit https://acceptafy.com/blacklist-monitor for details and delisting guides.`
    });
    console.log(`Blacklist alert sent to ${userEmail} for ${domain}`);
  } catch (error) {
    console.error('Failed to send blacklist alert email:', error);
  }
}

async function sendStatusImprovedEmail(
  userEmail: string,
  domain: string
): Promise<void> {
  const resendClient = await getResendClient();
  if (!resendClient) {
    console.log('Resend not configured, skipping status improved email');
    return;
  }

  try {
    await resendClient.client.emails.send({
      from: resendClient.fromEmail,
      to: userEmail,
      subject: `Good news: ${domain} is now clean!`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #0f0a1e; color: #e2e8f0; padding: 40px 20px; margin: 0;">
          <div style="max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #1a1033 0%, #0f0a1e 100%); border-radius: 16px; padding: 40px; border: 1px solid #2d2150;">
            <div style="text-align: center; margin-bottom: 32px;">
              <h1 style="color: #22c55e; font-size: 28px; margin: 0;">Status Improved</h1>
            </div>
            <p style="font-size: 16px; line-height: 1.6; margin-bottom: 24px;">Great news! Your domain/IP <strong style="color: #a855f7;">${domain}</strong> is no longer listed on any blacklists.</p>
            <p style="font-size: 16px; line-height: 1.6; margin-bottom: 24px;">Your sender reputation has improved, which should help with email deliverability.</p>
            <div style="text-align: center; margin: 32px 0;">
              <a href="https://acceptafy.com/blacklist-monitor" style="display: inline-block; background: linear-gradient(135deg, #a855f7, #ec4899); color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600;">View Your Dashboard</a>
            </div>
            <hr style="border: none; border-top: 1px solid #2d2150; margin: 32px 0;" />
            <p style="font-size: 12px; color: #64748b; text-align: center;">You're receiving this update because you have monitoring enabled for ${domain} on Acceptafy.</p>
          </div>
        </body>
        </html>
      `,
      text: `Status Improved

Great news! Your domain/IP ${domain} is no longer listed on any blacklists.

Your sender reputation has improved, which should help with email deliverability.

Visit https://acceptafy.com/blacklist-monitor to view your dashboard.`
    });
    console.log(`Status improved email sent to ${userEmail} for ${domain}`);
  } catch (error) {
    console.error('Failed to send status improved email:', error);
  }
}

async function checkDomainAndNotify(domain: { id: string; userId: string; domain: string; type: string; alertsEnabled: boolean | null; lastStatus: string | null }): Promise<void> {
  try {
    const result = await checkBlacklists(domain.domain);
    
    const listedBlacklists = result.results
      .filter(r => r.listed)
      .map(r => r.name);
    
    await storage.saveBlacklistCheck({
      userId: domain.userId,
      domain: domain.domain,
      type: domain.type || 'domain',
      totalBlacklists: result.totalBlacklists,
      listedOn: result.listedOn,
      cleanOn: result.cleanOn,
      results: result.results,
    });
    
    const newStatus = result.listedOn > 0 ? 'listed' : 'clean';
    const previousStatus = domain.lastStatus;
    
    await storage.updateMonitoredDomainStatus(domain.id, newStatus, result.listedOn);
    
    if (domain.alertsEnabled) {
      const user = await storage.getUser(domain.userId);
      if (user?.email) {
        if (newStatus === 'listed' && previousStatus !== 'listed') {
          await sendBlacklistAlert(user.email, domain.domain, result.listedOn, listedBlacklists);
        } else if (newStatus === 'clean' && previousStatus === 'listed') {
          await sendStatusImprovedEmail(user.email, domain.domain);
        }
      }
    }
    
    console.log(`Checked ${domain.domain}: ${newStatus} (${result.listedOn}/${result.totalBlacklists} listed)`);
  } catch (error) {
    console.error(`Failed to check domain ${domain.domain}:`, error);
  }
}

export async function runScheduledChecks(): Promise<void> {
  if (isRunning) {
    console.log('Scheduler already running, skipping...');
    return;
  }
  
  isRunning = true;
  console.log('Starting scheduled blacklist checks...');
  
  try {
    const now = new Date();
    const currentHour = now.getUTCHours();
    const currentDay = now.getUTCDay();
    
    let frequenciesToCheck: string[] = [];
    
    if (currentHour === config.dailyHour) {
      frequenciesToCheck.push('daily');
    }
    
    if (currentDay === config.weeklyDay && currentHour === config.weeklyHour) {
      frequenciesToCheck.push('weekly');
    }
    
    if (frequenciesToCheck.length === 0) {
      console.log('No scheduled checks due at this time');
      isRunning = false;
      return;
    }
    
    const domains = await storage.getDomainsForScheduledCheck(frequenciesToCheck);
    console.log(`Found ${domains.length} domains to check for frequencies: ${frequenciesToCheck.join(', ')}`);
    
    const batchSize = 5;
    for (let i = 0; i < domains.length; i += batchSize) {
      const batch = domains.slice(i, i + batchSize);
      await Promise.all(batch.map(domain => checkDomainAndNotify(domain)));
      
      if (i + batchSize < domains.length) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
    
    console.log(`Completed scheduled checks for ${domains.length} domains`);
  } catch (error) {
    console.error('Scheduler error:', error);
  } finally {
    isRunning = false;
  }
}

export async function runManualCheck(domainId: string, userId: string): Promise<void> {
  const domain = await storage.getMonitoredDomainById(domainId, userId);
  if (!domain) {
    throw new Error('Domain not found');
  }
  
  await checkDomainAndNotify({
    ...domain,
    alertsEnabled: domain.alertsEnabled ?? true,
    lastStatus: domain.lastStatus ?? null,
  });
}

export function startScheduler(): void {
  if (schedulerInterval) {
    console.log('Scheduler already started');
    return;
  }
  
  console.log('Starting blacklist monitoring scheduler...');
  schedulerInterval = setInterval(runScheduledChecks, 60 * 60 * 1000);
  
  setTimeout(() => {
    runScheduledChecks().catch(console.error);
  }, 5000);
}

export function stopScheduler(): void {
  if (schedulerInterval) {
    clearInterval(schedulerInterval);
    schedulerInterval = null;
    console.log('Blacklist monitoring scheduler stopped');
  }
}
