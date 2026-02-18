import { Resend } from 'resend';
import { db } from './db';
import { users, onboardingEmails, blogAnnouncementEmails, emailOpens, emailAnalyses, adminEmails } from '@shared/schema';
import { eq, and, lt, isNull, sql } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

const resend = new Resend(process.env.RESEND_API_KEY);

const ACCEPTAFY_URL = 'https://acceptafy.com';

const FROM_EMAIL = 'Acceptafy <hello@updates.acceptafy.com>';

const baseEmailStyles = `
  body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #0f0f23; color: #e2e8f0; }
  .container { max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); }
  .header { padding: 40px 30px; text-align: center; background: linear-gradient(135deg, #7c3aed 0%, #ec4899 100%); }
  .header h1 { margin: 0; font-size: 28px; font-weight: 700; color: #ffffff; }
  .header p { margin: 10px 0 0; font-size: 16px; color: rgba(255,255,255,0.9); }
  .content { padding: 40px 30px; }
  .content h2 { margin: 0 0 20px; font-size: 24px; color: #f8fafc; }
  .content p { margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #cbd5e1; }
  .content ul { margin: 0 0 20px; padding-left: 20px; }
  .content li { margin-bottom: 10px; color: #cbd5e1; line-height: 1.5; }
  .cta-button { display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #7c3aed 0%, #ec4899 100%); color: #ffffff !important; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; margin: 10px 0 20px; }
  .feature-box { background: rgba(124, 58, 237, 0.1); border: 1px solid rgba(124, 58, 237, 0.3); border-radius: 12px; padding: 20px; margin: 20px 0; }
  .feature-box h3 { margin: 0 0 10px; color: #a78bfa; font-size: 18px; }
  .footer { padding: 30px; text-align: center; border-top: 1px solid rgba(255,255,255,0.1); }
  .footer p { margin: 5px 0; font-size: 12px; color: #64748b; }
  .footer a { color: #a78bfa; text-decoration: none; }
  .divider { height: 1px; background: linear-gradient(90deg, transparent, rgba(124, 58, 237, 0.5), transparent); margin: 30px 0; }
`;

export const getBaseEmailStyles = () => baseEmailStyles;

const escapeHtml = (unsafe: string): string => {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
};

export const generateEmailPreview = (subject: string, body: string, previewText: string = ''): string => {
  const safeSubject = escapeHtml(subject);
  const safePreviewText = escapeHtml(previewText);
  const isHtmlBody = /<[a-z][\s\S]*>/i.test(body);
  const htmlContent = isHtmlBody 
    ? body.replace(/<a\s/gi, '<a style="color: #a855f7; text-decoration: underline;" ')
    : escapeHtml(body)
      .replace(/\n/g, '<br>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Email Preview</title>
  <style>${baseEmailStyles}</style>
</head>
<body>
  <div style="display:none;max-height:0;overflow:hidden;">${safePreviewText}</div>
  <div class="container">
    <div class="header">
      <h1>${safeSubject}</h1>
      ${safePreviewText ? `<p>${safePreviewText}</p>` : ''}
    </div>
    <div class="content">
      <p>${htmlContent}</p>
    </div>
    <div class="footer">
      <p>Acceptafy - Email Marketing Intelligence</p>
      <p><a href="#">Unsubscribe</a> | <a href="#">Visit Acceptafy</a></p>
      <p style="margin-top: 15px;">This email was sent by Acceptafy.</p>
    </div>
  </div>
</body>
</html>
`;
};

const emailWrapper = (content: string, previewText: string = '') => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
  <title>Acceptafy</title>
  <style>${baseEmailStyles}</style>
</head>
<body>
  <div style="display:none;max-height:0;overflow:hidden;">${previewText}</div>
  <div class="container">
    ${content}
    <div class="footer">
      <p>Acceptafy - Email Marketing Intelligence</p>
      <p><a href="${ACCEPTAFY_URL}/api/unsubscribe/{{userId}}">Unsubscribe</a> | <a href="${ACCEPTAFY_URL}">Visit Acceptafy</a></p>
      <p style="margin-top: 15px;">This email was sent by Acceptafy.</p>
    </div>
  </div>
  <!-- Email open tracking pixel -->
  <img src="${ACCEPTAFY_URL}/api/track/open/{{trackingId}}" width="1" height="1" alt="" style="display:none;width:1px;height:1px;border:0;" />
</body>
</html>
`;

// Generate personalization data for emails
async function getUserPersonalization(userId: string): Promise<{
  emailsAnalyzed: number;
  averageScore: number;
  daysSinceSignup: number;
  subscriptionTier: string;
  tierDisplayName: string;
}> {
  try {
    const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (!user.length) {
      return { emailsAnalyzed: 0, averageScore: 0, daysSinceSignup: 0, subscriptionTier: 'starter', tierDisplayName: 'Starter' };
    }
    
    const analyses = await db.select().from(emailAnalyses).where(eq(emailAnalyses.userId, userId));
    const emailsAnalyzed = analyses.length;
    const averageScore = analyses.length > 0 
      ? Math.round(analyses.reduce((sum, a) => sum + (a.score || 0), 0) / analyses.length)
      : 0;
    
    const createdAt = user[0].createdAt ? new Date(user[0].createdAt) : new Date();
    const daysSinceSignup = Math.floor((Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24));
    
    const tierNames: Record<string, string> = {
      'starter': 'Starter',
      'pro': 'Pro',
      'scale': 'Scale'
    };
    
    return {
      emailsAnalyzed,
      averageScore,
      daysSinceSignup,
      subscriptionTier: user[0].subscriptionTier || 'starter',
      tierDisplayName: tierNames[user[0].subscriptionTier || 'starter'] || 'Starter',
    };
  } catch (error) {
    console.error('[Personalization] Error fetching user stats:', error);
    return { emailsAnalyzed: 0, averageScore: 0, daysSinceSignup: 0, subscriptionTier: 'starter', tierDisplayName: 'Starter' };
  }
}

// Create email tracking record
async function createTrackingRecord(userId: string, emailType: string, emailId?: string): Promise<string> {
  const trackingId = uuidv4();
  try {
    await db.insert(emailOpens).values({
      userId,
      emailType,
      emailId,
      trackingId,
    });
    return trackingId;
  } catch (error) {
    console.error('[EmailTracking] Error creating tracking record:', error);
    return trackingId; // Still return the ID even if DB insert fails
  }
}

export const onboardingEmailTemplates = {
  welcome: (firstName: string) => ({
    subject: `Welcome to Acceptafy, ${firstName}!`,
    previewText: 'Your journey to email marketing mastery starts now',
    html: emailWrapper(`
      <div class="header">
        <h1>Welcome to Acceptafy!</h1>
        <p>Your email marketing journey starts here</p>
      </div>
      <div class="content">
        <h2>Hi ${firstName},</h2>
        <p>Thank you for joining Acceptafy! We're excited to help you master email marketing and achieve inbox success.</p>
        
        <p>Here's what you can do right now:</p>
        <ul>
          <li><strong>Grade your emails</strong> - Get instant AI-powered feedback on your email content</li>
          <li><strong>Improve deliverability</strong> - Learn what makes emails land in the inbox</li>
          <li><strong>Track your progress</strong> - Earn XP and unlock achievements as you learn</li>
        </ul>

        <div style="text-align: center;">
          <a href="${ACCEPTAFY_URL}" class="cta-button">Start Grading Emails</a>
        </div>

        <div class="divider"></div>

        <p>Over the next two weeks, we'll send you helpful tips to get the most out of Acceptafy. Stay tuned!</p>
        
        <p>Best,<br>The Acceptafy Team</p>
      </div>
    `, 'Your journey to email marketing mastery starts now')
  }),

  gettingStarted: (firstName: string) => ({
    subject: firstName === 'there' ? `Here's how to get the most out of your Email Grader` : `${firstName}, here's how to get the most out of your Email Grader`,
    previewText: 'Quick tips to improve your email scores instantly',
    html: emailWrapper(`
      <div class="header">
        <h1>Getting Started Guide</h1>
        <p>Master the Email Grader in 5 minutes</p>
      </div>
      <div class="content">
        <h2>Hi ${firstName},</h2>
        <p>Ready to start improving your emails? Here's how to use the Email Grader like a pro:</p>

        <div class="feature-box">
          <h3>Step 1: Paste Your Email</h3>
          <p style="margin: 0; color: #cbd5e1;">Copy your email content into the grader. Include your subject line for the best results.</p>
        </div>

        <div class="feature-box">
          <h3>Step 2: Review Your Score</h3>
          <p style="margin: 0; color: #cbd5e1;">Get detailed feedback on deliverability, engagement, and content quality.</p>
        </div>

        <div class="feature-box">
          <h3>Step 3: Apply the Fixes</h3>
          <p style="margin: 0; color: #cbd5e1;">Use our AI-powered suggestions to rewrite and improve your email.</p>
        </div>

        <div style="text-align: center;">
          <a href="${ACCEPTAFY_URL}" class="cta-button">Grade Your First Email</a>
        </div>

        <div class="divider"></div>

        <p><strong>Pro tip:</strong> Check your History tab to track your progress over time. You'll see your scores improving!</p>
        
        <p>Happy grading,<br>The Acceptafy Team</p>
      </div>
    `, 'Quick tips to improve your email scores instantly')
  }),

  academy: (firstName: string) => ({
    subject: firstName === 'there' ? `Unlock the secrets of email marketing` : `${firstName}, unlock the secrets of email marketing`,
    previewText: 'Free courses inside the Acceptafy Academy',
    html: emailWrapper(`
      <div class="header">
        <h1>Discover the Academy</h1>
        <p>Your free email marketing education</p>
      </div>
      <div class="content">
        <h2>Hi ${firstName},</h2>
        <p>Did you know Acceptafy includes a complete email marketing education platform?</p>

        <p>Inside the <strong>Academy</strong>, you'll find:</p>
        <ul>
          <li><strong>Deliverability Foundations</strong> - Master SPF, DKIM, and DMARC</li>
          <li><strong>The Art of the Inbox</strong> - Write emails that get opened and clicked</li>
          <li><strong>Campaign Blueprints</strong> - Ready-to-use strategies for cold outreach, newsletters, and e-commerce</li>
          <li><strong>Scenario Simulator</strong> - Test your skills with real-world challenges</li>
        </ul>

        <div style="text-align: center;">
          <a href="${ACCEPTAFY_URL}" class="cta-button">Explore the Academy</a>
        </div>

        <div class="divider"></div>

        <p>Each module you complete earns you XP and unlocks achievements. Can you reach the top of the leaderboard?</p>
        
        <p>Keep learning,<br>The Acceptafy Team</p>
      </div>
    `, 'Free courses inside the Acceptafy Academy')
  }),

  deliverabilityTips: (firstName: string) => ({
    subject: firstName === 'there' ? `5 quick wins for better email deliverability` : `${firstName}, 5 quick wins for better email deliverability`,
    previewText: 'Boost your inbox placement with these proven tactics',
    html: emailWrapper(`
      <div class="header">
        <h1>Pro Deliverability Tips</h1>
        <p>Get more emails into the inbox</p>
      </div>
      <div class="content">
        <h2>Hi ${firstName},</h2>
        <p>Want to boost your email deliverability? Here are 5 quick wins you can implement today:</p>

        <div class="feature-box">
          <h3>1. Authenticate Your Domain</h3>
          <p style="margin: 0; color: #cbd5e1;">Set up SPF, DKIM, and DMARC records. Our Deliverability Checklist tool can help!</p>
        </div>

        <div class="feature-box">
          <h3>2. Clean Your List Regularly</h3>
          <p style="margin: 0; color: #cbd5e1;">Remove inactive subscribers every 6 months. Quality beats quantity.</p>
        </div>

        <div class="feature-box">
          <h3>3. Watch Your Sender Reputation</h3>
          <p style="margin: 0; color: #cbd5e1;">Use our Sender Score tool to monitor your domain health.</p>
        </div>

        <div class="feature-box">
          <h3>4. Avoid Spam Triggers</h3>
          <p style="margin: 0; color: #cbd5e1;">Skip ALL CAPS, excessive punctuation, and spammy phrases.</p>
        </div>

        <div class="feature-box">
          <h3>5. Always Include an Unsubscribe Link</h3>
          <p style="margin: 0; color: #cbd5e1;">It's not just good practice - it's the law.</p>
        </div>

        <div style="text-align: center;">
          <a href="${ACCEPTAFY_URL}" class="cta-button">Check Your Deliverability</a>
        </div>
        
        <p>To your inbox success,<br>The Acceptafy Team</p>
      </div>
    `, 'Boost your inbox placement with these proven tactics')
  }),

  upgrade: (firstName: string, tier: string) => ({
    subject: firstName === 'there' ? `Unlock unlimited email grades` : `${firstName}, unlock unlimited email grades`,
    previewText: 'Get Pro features and take your email marketing to the next level',
    html: emailWrapper(`
      <div class="header">
        <h1>Ready for More?</h1>
        <p>Upgrade to unlock your full potential</p>
      </div>
      <div class="content">
        <h2>Hi ${firstName},</h2>
        <p>You've been using Acceptafy for two weeks now - how's it going?</p>

        ${tier === 'starter' ? `
        <p>As a Starter member, you have access to 3 email grades per month. Ready to do more?</p>

        <p><strong>Upgrade to Pro</strong> and get:</p>
        <ul>
          <li>Unlimited email grades</li>
          <li>Advanced AI rewriting tools</li>
          <li>Competitor analysis features</li>
          <li>Priority support</li>
          <li>And much more!</li>
        </ul>

        <div style="text-align: center;">
          <a href="${ACCEPTAFY_URL}/account" class="cta-button">View Upgrade Options</a>
        </div>
        ` : `
        <p>Thank you for being a valued ${tier} member! We appreciate your support.</p>

        <p>Don't forget to explore all the features available to you:</p>
        <ul>
          <li>Unlimited email grades</li>
          <li>Advanced AI tools</li>
          <li>Full Academy access</li>
          <li>Deliverability monitoring</li>
        </ul>

        <div style="text-align: center;">
          <a href="${ACCEPTAFY_URL}" class="cta-button">Continue Learning</a>
        </div>
        `}

        <div class="divider"></div>

        <p>Have questions? Reply to this email - we're here to help!</p>
        
        <p>Best,<br>The Acceptafy Team</p>
      </div>
    `, 'Get Pro features and take your email marketing to the next level')
  }),
};

export const blogAnnouncementTemplate = (
  blogTitle: string,
  blogSummary: string,
  blogUrl: string,
  firstName: string
) => ({
  html: emailWrapper(`
    <div class="header">
      <h1>New on the Blog</h1>
      <p>Fresh insights for email marketers</p>
    </div>
    <div class="content">
      <h2>Hi ${firstName},</h2>
      <p>We just published a new article you'll love:</p>

      <div class="feature-box">
        <h3>${blogTitle}</h3>
        <p style="margin: 0; color: #cbd5e1;">${blogSummary}</p>
      </div>

      <div style="text-align: center;">
        <a href="${blogUrl}" class="cta-button">Read the Article</a>
      </div>

      <div class="divider"></div>

      <p>We publish new content regularly to help you master email marketing. Stay tuned for more!</p>
      
      <p>Happy reading,<br>The Acceptafy Team</p>
    </div>
  `, blogSummary)
});

export async function sendOnboardingEmail(
  userId: string,
  emailNumber: number,
  emailType: 'welcome' | 'getting-started' | 'academy' | 'tips' | 'upgrade'
): Promise<boolean> {
  try {
    const [user] = await db.select().from(users).where(eq(users.id, userId));
    if (!user || !user.email || user.emailUnsubscribed) {
      console.log(`[OnboardingEmail] Skipping user ${userId}: no email or unsubscribed`);
      return false;
    }

    const firstName = user.firstName || 'there';
    
    // Get personalization data for enhanced emails
    const personalization = await getUserPersonalization(userId);
    
    let emailContent;

    switch (emailType) {
      case 'welcome':
        emailContent = onboardingEmailTemplates.welcome(firstName);
        break;
      case 'getting-started':
        emailContent = onboardingEmailTemplates.gettingStarted(firstName);
        break;
      case 'academy':
        emailContent = onboardingEmailTemplates.academy(firstName);
        break;
      case 'tips':
        emailContent = onboardingEmailTemplates.deliverabilityTips(firstName);
        break;
      case 'upgrade':
        emailContent = onboardingEmailTemplates.upgrade(firstName, user.subscriptionTier || 'starter');
        break;
      default:
        console.error(`[OnboardingEmail] Unknown email type: ${emailType}`);
        return false;
    }

    // Generate tracking ID first (without inserting to DB yet)
    const trackingId = uuidv4();

    // Replace placeholders with actual values
    let html = emailContent.html
      .replace(/\{\{userId\}\}/g, userId)
      .replace(/\{\{trackingId\}\}/g, trackingId)
      .replace(/\{\{emailsAnalyzed\}\}/g, personalization.emailsAnalyzed.toString())
      .replace(/\{\{averageScore\}\}/g, personalization.averageScore.toString())
      .replace(/\{\{daysSinceSignup\}\}/g, personalization.daysSinceSignup.toString())
      .replace(/\{\{tierDisplayName\}\}/g, personalization.tierDisplayName);

    // Send email first - only create records if successful
    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to: user.email,
      subject: emailContent.subject,
      html: html,
    });

    if (result.error) {
      console.error(`[OnboardingEmail] Failed to send to ${user.email}:`, result.error);
      return false;
    }

    // Only create database records AFTER successful email send
    const [onboardingEmailRecord] = await db.insert(onboardingEmails).values({
      userId,
      emailNumber,
      emailType,
    }).returning();

    // Log to admin email history for visibility FIRST to get the ID for tracking
    const [adminEmailRecord] = await db.insert(adminEmails).values({
      adminId: null, // System-generated email
      recipientUserId: userId,
      recipientEmail: user.email,
      subject: emailContent.subject,
      body: `Onboarding Email #${emailNumber}: ${emailType}`,
      htmlContent: html,
      emailType: 'onboarding',
      status: 'sent',
    }).returning();

    // Create tracking record with the admin email ID (so Email History can show opens)
    await db.insert(emailOpens).values({
      userId,
      emailType: 'onboarding',
      emailId: adminEmailRecord.id,
      trackingId,
    });

    await db.update(users)
      .set({ 
        onboardingEmailsSent: emailNumber,
        lastOnboardingEmailAt: new Date()
      })
      .where(eq(users.id, userId));

    console.log(`[OnboardingEmail] Sent email #${emailNumber} (${emailType}) to ${user.email}`);
    return true;
  } catch (error) {
    console.error(`[OnboardingEmail] Error sending email:`, error);
    return false;
  }
}

// Variant that skips the user table update (used when atomic update was already done)
export async function sendOnboardingEmailWithoutDbUpdate(
  userId: string,
  emailNumber: number,
  emailType: 'welcome' | 'getting-started' | 'academy' | 'tips' | 'upgrade'
): Promise<boolean> {
  try {
    const [user] = await db.select().from(users).where(eq(users.id, userId));
    if (!user || !user.email || user.emailUnsubscribed) {
      console.log(`[OnboardingEmail] Skipping user ${userId}: no email or unsubscribed`);
      return false;
    }

    const firstName = user.firstName || 'there';
    const personalization = await getUserPersonalization(userId);
    
    let emailContent;

    switch (emailType) {
      case 'welcome':
        emailContent = onboardingEmailTemplates.welcome(firstName);
        break;
      case 'getting-started':
        emailContent = onboardingEmailTemplates.gettingStarted(firstName);
        break;
      case 'academy':
        emailContent = onboardingEmailTemplates.academy(firstName);
        break;
      case 'tips':
        emailContent = onboardingEmailTemplates.deliverabilityTips(firstName);
        break;
      case 'upgrade':
        emailContent = onboardingEmailTemplates.upgrade(firstName, user.subscriptionTier || 'starter');
        break;
      default:
        console.error(`[OnboardingEmail] Unknown email type: ${emailType}`);
        return false;
    }

    const trackingId = uuidv4();

    let html = emailContent.html
      .replace(/\{\{userId\}\}/g, userId)
      .replace(/\{\{trackingId\}\}/g, trackingId)
      .replace(/\{\{emailsAnalyzed\}\}/g, personalization.emailsAnalyzed.toString())
      .replace(/\{\{averageScore\}\}/g, personalization.averageScore.toString())
      .replace(/\{\{daysSinceSignup\}\}/g, personalization.daysSinceSignup.toString())
      .replace(/\{\{tierDisplayName\}\}/g, personalization.tierDisplayName);

    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to: user.email,
      subject: emailContent.subject,
      html: html,
    });

    if (result.error) {
      console.error(`[OnboardingEmail] Failed to send to ${user.email}:`, result.error);
      return false;
    }

    // Log records (but skip user table update - already done atomically)
    const [onboardingEmailRecord] = await db.insert(onboardingEmails).values({
      userId,
      emailNumber,
      emailType,
    }).returning();

    // Log to admin email history FIRST to get the ID for tracking
    const [adminEmailRecord] = await db.insert(adminEmails).values({
      adminId: null,
      recipientUserId: userId,
      recipientEmail: user.email,
      subject: emailContent.subject,
      body: `Onboarding Email #${emailNumber}: ${emailType}`,
      htmlContent: html,
      emailType: 'onboarding',
      status: 'sent',
    }).returning();

    // Create tracking record with the admin email ID (so Email History can show opens)
    await db.insert(emailOpens).values({
      userId,
      emailType: 'onboarding',
      emailId: adminEmailRecord.id,
      trackingId,
    });

    // NOTE: User table update already done atomically before calling this function

    console.log(`[OnboardingEmail] Sent email #${emailNumber} (${emailType}) to ${user.email}`);
    return true;
  } catch (error) {
    console.error(`[OnboardingEmail] Error sending email:`, error);
    return false;
  }
}

export async function sendBlogAnnouncement(
  subject: string,
  previewText: string,
  blogTitle: string,
  blogSummary: string,
  blogUrl: string,
  sentBy: string
): Promise<{ success: boolean; recipientCount: number; errors: string[] }> {
  const errors: string[] = [];
  let successCount = 0;

  try {
    const allUsers = await db.select()
      .from(users)
      .where(
        and(
          eq(users.emailUnsubscribed, false),
          sql`${users.email} IS NOT NULL`,
          eq(users.emailVerified, true)
        )
      );

    console.log(`[BlogAnnouncement] Sending to ${allUsers.length} users`);

    for (const user of allUsers) {
      if (!user.email) continue;

      try {
        const firstName = user.firstName || 'there';
        const emailContent = blogAnnouncementTemplate(blogTitle, blogSummary, blogUrl, firstName);
        
        // Generate tracking ID (but don't insert to DB yet)
        const trackingId = uuidv4();
        
        // Replace placeholders
        const html = emailContent.html
          .replace(/\{\{userId\}\}/g, user.id)
          .replace(/\{\{trackingId\}\}/g, trackingId);

        const result = await resend.emails.send({
          from: FROM_EMAIL,
          to: user.email,
          subject: subject,
          html: html,
        });

        if (result.error) {
          errors.push(`${user.email}: ${result.error.message}`);
        } else {
          successCount++;
          // Log to admin email history FIRST to get the ID
          const [adminEmailRecord] = await db.insert(adminEmails).values({
            adminId: sentBy,
            recipientUserId: user.id,
            recipientEmail: user.email,
            subject: subject,
            body: `Blog Announcement: ${blogTitle}`,
            htmlContent: html,
            emailType: 'announcement',
            status: 'sent',
          }).returning();
          
          // Create tracking record with the admin email ID
          await db.insert(emailOpens).values({
            userId: user.id,
            emailType: 'blog-announcement',
            emailId: adminEmailRecord.id,
            trackingId,
          });
        }

        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (err: any) {
        errors.push(`${user.email}: ${err.message}`);
      }
    }

    await db.insert(blogAnnouncementEmails).values({
      subject,
      previewText,
      blogTitle,
      blogSummary,
      blogUrl,
      recipientCount: successCount,
      sentBy,
    });

    console.log(`[BlogAnnouncement] Sent to ${successCount}/${allUsers.length} users`);
    return { success: true, recipientCount: successCount, errors };
  } catch (error: any) {
    console.error(`[BlogAnnouncement] Error:`, error);
    return { success: false, recipientCount: 0, errors: [error.message] };
  }
}

export async function processOnboardingEmails(): Promise<void> {
  console.log('[OnboardingScheduler] Checking for pending onboarding emails...');

  try {
    const now = new Date();

    // Get candidate users (initial filter)
    const usersToProcess = await db.select()
      .from(users)
      .where(
        and(
          eq(users.emailUnsubscribed, false),
          sql`${users.email} IS NOT NULL`,
          lt(users.onboardingEmailsSent || sql`0`, 5)
        )
      );

    const schedule = [
      { day: 0, emailNumber: 1, type: 'welcome' as const },
      { day: 1, emailNumber: 2, type: 'getting-started' as const },
      { day: 3, emailNumber: 3, type: 'academy' as const },
      { day: 7, emailNumber: 4, type: 'tips' as const },
      { day: 14, emailNumber: 5, type: 'upgrade' as const },
    ];

    for (const user of usersToProcess) {
      if (!user.createdAt) continue;

      // RACE CONDITION FIX: Re-fetch user state fresh before processing
      // This prevents duplicate sends when scheduler runs concurrently
      const [freshUser] = await db.select()
        .from(users)
        .where(eq(users.id, user.id))
        .limit(1);

      if (!freshUser || freshUser.emailUnsubscribed) {
        console.log(`[OnboardingScheduler] Skipping user ${user.id}: unsubscribed or not found`);
        continue;
      }

      const daysSinceSignup = Math.floor(
        (now.getTime() - new Date(freshUser.createdAt!).getTime()) / (1000 * 60 * 60 * 24)
      );
      const emailsSent = freshUser.onboardingEmailsSent || 0;

      // Enforce minimum 24-hour gap between onboarding emails (using fresh data)
      if (freshUser.lastOnboardingEmailAt) {
        const hoursSinceLastEmail = (now.getTime() - new Date(freshUser.lastOnboardingEmailAt).getTime()) / (1000 * 60 * 60);
        if (hoursSinceLastEmail < 24) {
          console.log(`[OnboardingScheduler] Skipping user ${freshUser.id}: last email sent ${hoursSinceLastEmail.toFixed(1)} hours ago`);
          continue;
        }
      }

      // Determine which email to send based on fresh data
      let emailToSend: typeof schedule[0] | null = null;
      for (const email of schedule) {
        if (daysSinceSignup >= email.day && emailsSent < email.emailNumber) {
          emailToSend = email;
          break;
        }
      }

      if (!emailToSend) continue;

      // ATOMIC COMPARE-AND-SET: Only proceed if emailsSent hasn't changed
      // This uses an atomic UPDATE with WHERE clause to prevent race conditions
      const updateResult = await db.update(users)
        .set({ 
          onboardingEmailsSent: emailToSend.emailNumber,
          lastOnboardingEmailAt: new Date()
        })
        .where(
          and(
            eq(users.id, user.id),
            eq(users.onboardingEmailsSent, emailsSent) // Only update if value matches expected
          )
        )
        .returning({ id: users.id });

      // If no rows updated, another process already incremented the counter
      if (updateResult.length === 0) {
        console.log(`[OnboardingScheduler] Race condition prevented for user ${user.id}: emailsSent already changed from ${emailsSent}`);
        continue;
      }

      // Counter was atomically updated, now safe to send the email
      // Note: sendOnboardingEmail will try to update again, so we pass skipDbUpdate flag
      await sendOnboardingEmailWithoutDbUpdate(user.id, emailToSend.emailNumber, emailToSend.type);
    }

    console.log('[OnboardingScheduler] Completed processing');
  } catch (error) {
    console.error('[OnboardingScheduler] Error:', error);
  }
}

export function startOnboardingEmailScheduler(): void {
  console.log('[OnboardingScheduler] Starting scheduler...');
  
  processOnboardingEmails();
  
  setInterval(() => {
    processOnboardingEmails();
  }, 6 * 60 * 60 * 1000);
  
  console.log('[OnboardingScheduler] Scheduler started - will check every 6 hours');
}

// Add user as a contact in Resend for newsletter/marketing emails
// Uses the Acceptafy audience/segment for subscribers
const RESEND_AUDIENCE_ID = process.env.RESEND_AUDIENCE_ID || '';

export async function addResendContact(email: string, firstName?: string, lastName?: string): Promise<boolean> {
  try {
    // If no audience ID configured, skip contact creation
    if (!RESEND_AUDIENCE_ID) {
      console.log('[ResendContact] No RESEND_AUDIENCE_ID configured, skipping contact creation for:', email);
      return false;
    }

    const result = await resend.contacts.create({
      email: email,
      firstName: firstName || '',
      lastName: lastName || '',
      unsubscribed: false,
      audienceId: RESEND_AUDIENCE_ID,
    });

    if (result.error) {
      console.error('[ResendContact] Error adding contact:', result.error);
      return false;
    }

    console.log('[ResendContact] Successfully added contact:', email);
    return true;
  } catch (error) {
    console.error('[ResendContact] Exception adding contact:', error);
    return false;
  }
}
