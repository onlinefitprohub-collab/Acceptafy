import { storage } from '../storage';
import { sendStarterMonthlyResetEmail } from './email';

const LAST_SENT_PREFIX = 'monthly_reset_user_';
let isRunning = false;
let schedulerInterval: NodeJS.Timeout | null = null;

async function checkAndSendMonthlyResetEmails(): Promise<void> {
  if (isRunning) {
    console.log('[MonthlyReset] Scheduler already running, skipping...');
    return;
  }

  isRunning = true;
  const today = new Date();
  const todayDayOfMonth = today.getDate();
  const currentMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;

  console.log(`[MonthlyReset] Checking for users with signup day ${todayDayOfMonth}...`);

  try {
    const allUsers = await storage.getAllUsers();
    
    // Filter for starter plan users with verified emails (exclude admins)
    const starterUsers = allUsers.filter(u => 
      u.role !== 'admin' && 
      (u.subscriptionTier || 'starter') === 'starter' &&
      u.email &&
      u.emailVerified !== false &&
      u.createdAt // Must have a signup date
    );

    // Filter to users whose signup day matches today
    const usersToNotify = starterUsers.filter(u => {
      const signupDate = new Date(u.createdAt!);
      const signupDay = signupDate.getDate();
      return signupDay === todayDayOfMonth;
    });

    if (usersToNotify.length === 0) {
      console.log(`[MonthlyReset] No users with signup day ${todayDayOfMonth} to notify`);
      isRunning = false;
      return;
    }

    console.log(`[MonthlyReset] Found ${usersToNotify.length} users with signup day ${todayDayOfMonth}`);

    let sentCount = 0;
    let skippedCount = 0;
    let failedCount = 0;

    for (const user of usersToNotify) {
      try {
        // Check if we already sent to this user this month (per-user idempotency)
        const lastSentMonth = await storage.getSystemConfig(`${LAST_SENT_PREFIX}${user.id}`);
        if (lastSentMonth === currentMonth) {
          console.log(`[MonthlyReset] Already sent to ${user.email} for ${currentMonth}, skipping`);
          skippedCount++;
          continue;
        }

        // Get lifetime total grades from gamification
        const gamification = await storage.getUserGamification(user.id);
        const totalGrades = gamification?.totalGrades || 0;
        
        await sendStarterMonthlyResetEmail(
          user.email!,
          user.firstName || '',
          totalGrades
        );
        
        // Mark this user as sent for this month
        await storage.setSystemConfig(`${LAST_SENT_PREFIX}${user.id}`, currentMonth);
        
        sentCount++;
        console.log(`[MonthlyReset] Sent reminder to ${user.email}`);
        
        // Small delay between emails to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 200));
      } catch (e) {
        console.error(`[MonthlyReset] Failed to send reset email to ${user.email}:`, e);
        failedCount++;
      }
    }

    console.log(`[MonthlyReset] Completed: ${sentCount} sent, ${skippedCount} skipped, ${failedCount} failed`);
  } catch (error) {
    console.error('[MonthlyReset] Error in monthly reset job:', error);
  } finally {
    isRunning = false;
  }
}

export function startMonthlyResetScheduler(): void {
  console.log('[MonthlyReset] Starting per-user monthly reset email scheduler...');
  
  // Run immediately on startup
  checkAndSendMonthlyResetEmails().catch(console.error);
  
  // Check every 6 hours to catch users whose signup day matches today
  schedulerInterval = setInterval(() => {
    checkAndSendMonthlyResetEmails().catch(console.error);
  }, 6 * 60 * 60 * 1000); // 6 hours in milliseconds
  
  console.log('[MonthlyReset] Scheduler started - will check every 6 hours for user signup anniversaries');
}

export function stopMonthlyResetScheduler(): void {
  if (schedulerInterval) {
    clearInterval(schedulerInterval);
    schedulerInterval = null;
    console.log('[MonthlyReset] Scheduler stopped');
  }
}
