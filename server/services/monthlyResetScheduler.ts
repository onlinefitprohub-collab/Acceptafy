import { storage } from '../storage';
import { sendStarterMonthlyResetEmail } from './email';

const MONTHLY_RESET_LAST_SENT_KEY = 'monthly_reset_last_sent_month';
let isRunning = false;
let schedulerInterval: NodeJS.Timeout | null = null;

async function checkAndSendMonthlyResetEmails(): Promise<void> {
  if (isRunning) {
    console.log('[MonthlyReset] Scheduler already running, skipping...');
    return;
  }

  isRunning = true;
  const today = new Date();
  const dayOfMonth = today.getDate();
  const currentMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;

  // Only run on the 1st of each month
  if (dayOfMonth !== 1) {
    isRunning = false;
    return;
  }

  try {
    // Check if we already sent for this month (persistent idempotency)
    const lastSentMonth = await storage.getSystemConfig(MONTHLY_RESET_LAST_SENT_KEY);
    if (lastSentMonth === currentMonth) {
      console.log(`[MonthlyReset] Already sent for ${currentMonth}, skipping...`);
      isRunning = false;
      return;
    }

    console.log('[MonthlyReset] Running monthly reset email job...');

    const allUsers = await storage.getAllUsers();
    
    // Filter for starter plan users with verified emails (exclude admins)
    const starterUsers = allUsers.filter(u => 
      u.role !== 'admin' && 
      (u.subscriptionTier || 'starter') === 'starter' &&
      u.email &&
      u.emailVerified !== false
    );

    console.log(`[MonthlyReset] Found ${starterUsers.length} starter users to notify`);

    let sentCount = 0;
    let failedCount = 0;

    for (const user of starterUsers) {
      try {
        // Get lifetime total grades from gamification
        const gamification = await storage.getUserGamification(user.id);
        const totalGrades = gamification?.totalGrades || 0;
        
        await sendStarterMonthlyResetEmail(
          user.email!,
          user.firstName || '',
          totalGrades
        );
        
        sentCount++;
        
        // Small delay between emails to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 200));
      } catch (e) {
        console.error(`[MonthlyReset] Failed to send reset email to ${user.email}:`, e);
        failedCount++;
      }
    }

    console.log(`[MonthlyReset] Completed: ${sentCount} sent, ${failedCount} failed`);
    
    // Mark this month as sent for persistent idempotency
    await storage.setSystemConfig(MONTHLY_RESET_LAST_SENT_KEY, currentMonth);
  } catch (error) {
    console.error('[MonthlyReset] Error in monthly reset job:', error);
  } finally {
    isRunning = false;
  }
}

export function startMonthlyResetScheduler(): void {
  console.log('[MonthlyReset] Starting monthly reset email scheduler...');
  
  // Run immediately on startup to check if it's the 1st
  checkAndSendMonthlyResetEmails().catch(console.error);
  
  // Check every 6 hours (will only send on the 1st of the month)
  schedulerInterval = setInterval(() => {
    checkAndSendMonthlyResetEmails().catch(console.error);
  }, 6 * 60 * 60 * 1000); // 6 hours in milliseconds
  
  console.log('[MonthlyReset] Scheduler started - will check every 6 hours');
}

export function stopMonthlyResetScheduler(): void {
  if (schedulerInterval) {
    clearInterval(schedulerInterval);
    schedulerInterval = null;
    console.log('[MonthlyReset] Scheduler stopped');
  }
}
