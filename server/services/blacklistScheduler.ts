import { storage } from '../storage';
import { checkBlacklists } from './blacklistChecker';
import { Resend } from 'resend';

const FROM_EMAIL = 'hello@updates.acceptafy.com';

function getResend(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return null;
  return new Resend(apiKey);
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
  const resend = getResend();
  if (!resend) {
    console.log('Resend API key not configured, skipping email alert');
    return;
  }

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: userEmail,
      subject: `Alert: ${domain} found on ${listedOn} blacklist(s)`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #dc2626;">Blacklist Alert</h2>
          <p>Your domain/IP <strong>${domain}</strong> has been found on ${listedOn} blacklist(s):</p>
          <ul style="color: #dc2626;">
            ${blacklists.map(bl => `<li>${bl}</li>`).join('')}
          </ul>
          <p>This can severely impact your email deliverability. We recommend taking immediate action to get delisted.</p>
          <p><a href="https://acceptafy.com/blacklist-monitor" style="background: #7c3aed; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">View Details & Delisting Guide</a></p>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
          <p style="color: #6b7280; font-size: 12px;">You're receiving this alert because you have monitoring enabled for ${domain} on Acceptafy.</p>
        </div>
      `,
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
  const resend = getResend();
  if (!resend) {
    console.log('Resend API key not configured, skipping email');
    return;
  }

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: userEmail,
      subject: `Good news: ${domain} is now clean!`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #16a34a;">Status Improved</h2>
          <p>Great news! Your domain/IP <strong>${domain}</strong> is no longer listed on any blacklists.</p>
          <p>Your sender reputation has improved, which should help with email deliverability.</p>
          <p><a href="https://acceptafy.com/blacklist-monitor" style="background: #7c3aed; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">View Your Dashboard</a></p>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
          <p style="color: #6b7280; font-size: 12px;">You're receiving this update because you have monitoring enabled for ${domain} on Acceptafy.</p>
        </div>
      `,
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
