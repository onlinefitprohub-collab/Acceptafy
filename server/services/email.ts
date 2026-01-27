// Email service using Resend integration
import { Resend } from 'resend';

let connectionSettings: any;

async function getCredentials() {
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY 
    ? 'repl ' + process.env.REPL_IDENTITY 
    : process.env.WEB_REPL_RENEWAL 
    ? 'depl ' + process.env.WEB_REPL_RENEWAL 
    : null;

  if (!xReplitToken) {
    throw new Error('X_REPLIT_TOKEN not found for repl/depl');
  }

  connectionSettings = await fetch(
    'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=resend',
    {
      headers: {
        'Accept': 'application/json',
        'X_REPLIT_TOKEN': xReplitToken
      }
    }
  ).then(res => res.json()).then(data => data.items?.[0]);

  if (!connectionSettings || (!connectionSettings.settings.api_key)) {
    throw new Error('Resend not connected');
  }
  return { apiKey: connectionSettings.settings.api_key, fromEmail: connectionSettings.settings.from_email };
}

async function getUncachableResendClient() {
  const { apiKey, fromEmail } = await getCredentials();
  // Format the from email with display name "Acceptafy"
  const formattedFromEmail = fromEmail ? `Acceptafy <${fromEmail}>` : null;
  return {
    client: new Resend(apiKey),
    fromEmail: formattedFromEmail
  };
}

// Email Templates
const templates = {
  welcome: (email: string) => ({
    subject: 'Welcome to Acceptafy!',
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
            <h1 style="background: linear-gradient(135deg, #a855f7, #ec4899); -webkit-background-clip: text; -webkit-text-fill-color: transparent; font-size: 28px; margin: 0;">Welcome to Acceptafy</h1>
          </div>
          <p style="font-size: 16px; line-height: 1.6; margin-bottom: 24px;">Hi there!</p>
          <p style="font-size: 16px; line-height: 1.6; margin-bottom: 24px;">Thanks for signing up for Acceptafy. You're now ready to start optimizing your email campaigns with AI-powered analysis.</p>
          <p style="font-size: 16px; line-height: 1.6; margin-bottom: 24px;">Here's what you can do:</p>
          <ul style="font-size: 16px; line-height: 1.8; margin-bottom: 24px; padding-left: 24px;">
            <li>Grade your emails for deliverability and engagement</li>
            <li>Get AI-powered rewrites to improve your copy</li>
            <li>Generate follow-up sequences automatically</li>
            <li>Check your domain reputation and DNS settings</li>
          </ul>
          <div style="text-align: center; margin: 32px 0;">
            <a href="https://acceptafy.com" style="display: inline-block; background: linear-gradient(135deg, #a855f7, #ec4899); color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600;">Start Grading Emails</a>
          </div>
          <p style="font-size: 14px; color: #94a3b8; text-align: center; margin-top: 40px;">Questions? Just reply to this email and we'll help you out.</p>
        </div>
      </body>
      </html>
    `,
    text: `Welcome to Acceptafy!

Hi there!

Thanks for signing up for Acceptafy. You're now ready to start optimizing your email campaigns with AI-powered analysis.

Here's what you can do:
- Grade your emails for deliverability and engagement
- Get AI-powered rewrites to improve your copy
- Generate follow-up sequences automatically
- Check your domain reputation and DNS settings

Visit https://acceptafy.com to get started.

Questions? Just reply to this email and we'll help you out.`
  }),

  passwordReset: (resetUrl: string) => ({
    subject: 'Reset Your Acceptafy Password',
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
            <h1 style="background: linear-gradient(135deg, #a855f7, #ec4899); -webkit-background-clip: text; -webkit-text-fill-color: transparent; font-size: 28px; margin: 0;">Password Reset</h1>
          </div>
          <p style="font-size: 16px; line-height: 1.6; margin-bottom: 24px;">You requested to reset your password. Click the button below to create a new password:</p>
          <div style="text-align: center; margin: 32px 0;">
            <a href="${resetUrl}" style="display: inline-block; background: linear-gradient(135deg, #a855f7, #ec4899); color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600;">Reset Password</a>
          </div>
          <p style="font-size: 14px; color: #94a3b8; margin-bottom: 16px;">This link will expire in 1 hour.</p>
          <p style="font-size: 14px; color: #94a3b8;">If you didn't request this, you can safely ignore this email. Your password won't be changed.</p>
          <hr style="border: none; border-top: 1px solid #2d2150; margin: 32px 0;">
          <p style="font-size: 12px; color: #64748b; text-align: center;">Can't click the button? Copy and paste this URL into your browser:<br><span style="color: #a855f7; word-break: break-all;">${resetUrl}</span></p>
        </div>
      </body>
      </html>
    `,
    text: `Password Reset

You requested to reset your password. Click the link below to create a new password:

${resetUrl}

This link will expire in 1 hour.

If you didn't request this, you can safely ignore this email. Your password won't be changed.`
  }),

  accountDeactivated: (email: string) => ({
    subject: 'Your Acceptafy Account Has Been Deactivated',
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
            <h1 style="color: #e2e8f0; font-size: 28px; margin: 0;">Account Deactivated</h1>
          </div>
          <p style="font-size: 16px; line-height: 1.6; margin-bottom: 24px;">Your Acceptafy account has been deactivated.</p>
          <p style="font-size: 16px; line-height: 1.6; margin-bottom: 24px;">If you believe this was done in error or would like to reactivate your account, please contact our support team.</p>
          <p style="font-size: 14px; color: #94a3b8; text-align: center; margin-top: 40px;">Questions? Reply to this email for assistance.</p>
        </div>
      </body>
      </html>
    `,
    text: `Account Deactivated

Your Acceptafy account has been deactivated.

If you believe this was done in error or would like to reactivate your account, please contact our support team.

Questions? Reply to this email for assistance.`
  }),

  usageLimitWarning: (email: string, feature: string, current: number, limit: number) => ({
    subject: `You're approaching your ${feature} limit`,
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
            <h1 style="color: #f59e0b; font-size: 28px; margin: 0;">Usage Limit Warning</h1>
          </div>
          <p style="font-size: 16px; line-height: 1.6; margin-bottom: 24px;">You've used ${current} of your ${limit} monthly ${feature}.</p>
          <p style="font-size: 16px; line-height: 1.6; margin-bottom: 24px;">Upgrade your plan to get more ${feature} and unlock additional features.</p>
          <div style="text-align: center; margin: 32px 0;">
            <a href="https://acceptafy.com/pricing" style="display: inline-block; background: linear-gradient(135deg, #a855f7, #ec4899); color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600;">View Plans</a>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `Usage Limit Warning

You've used ${current} of your ${limit} monthly ${feature}.

Upgrade your plan to get more ${feature} and unlock additional features.

Visit https://acceptafy.com/pricing to view plans.`
  }),

  emailVerification: (verifyUrl: string) => ({
    subject: 'Verify Your Acceptafy Email',
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
            <h1 style="background: linear-gradient(135deg, #a855f7, #ec4899); -webkit-background-clip: text; -webkit-text-fill-color: transparent; font-size: 28px; margin: 0;">Verify Your Email</h1>
          </div>
          <p style="font-size: 16px; line-height: 1.6; margin-bottom: 24px;">Welcome to Acceptafy! Please verify your email address by clicking the button below:</p>
          <div style="text-align: center; margin: 32px 0;">
            <a href="${verifyUrl}" style="display: inline-block; background: linear-gradient(135deg, #a855f7, #ec4899); color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600;">Verify Email</a>
          </div>
          <p style="font-size: 14px; color: #94a3b8; margin-bottom: 16px;">This link will expire in 24 hours.</p>
          <p style="font-size: 14px; color: #94a3b8;">If you didn't create an account with Acceptafy, you can safely ignore this email.</p>
          <hr style="border: none; border-top: 1px solid #2d2150; margin: 32px 0;">
          <p style="font-size: 12px; color: #64748b; text-align: center;">Can't click the button? Copy and paste this URL into your browser:<br><span style="color: #a855f7; word-break: break-all;">${verifyUrl}</span></p>
        </div>
      </body>
      </html>
    `,
    text: `Verify Your Email

Welcome to Acceptafy! Please verify your email address by clicking the link below:

${verifyUrl}

This link will expire in 24 hours.

If you didn't create an account with Acceptafy, you can safely ignore this email.`
  }),

  adminNewSignup: (firstName: string, lastName: string, userEmail: string, signupDate: string) => ({
    subject: `New Signup: ${firstName} ${lastName}`,
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
            <h1 style="background: linear-gradient(135deg, #22c55e, #16a34a); -webkit-background-clip: text; -webkit-text-fill-color: transparent; font-size: 28px; margin: 0;">New User Signup!</h1>
          </div>
          <p style="font-size: 16px; line-height: 1.6; margin-bottom: 24px;">A new user has signed up for Acceptafy:</p>
          <div style="background: rgba(255,255,255,0.05); border-radius: 12px; padding: 20px; margin-bottom: 24px;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #94a3b8; font-size: 14px;">First Name:</td>
                <td style="padding: 8px 0; font-size: 16px; font-weight: 600;">${firstName || 'Not provided'}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #94a3b8; font-size: 14px;">Last Name:</td>
                <td style="padding: 8px 0; font-size: 16px; font-weight: 600;">${lastName || 'Not provided'}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #94a3b8; font-size: 14px;">Email:</td>
                <td style="padding: 8px 0; font-size: 16px; font-weight: 600;"><a href="mailto:${userEmail}" style="color: #a855f7; text-decoration: none;">${userEmail}</a></td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #94a3b8; font-size: 14px;">Signed Up:</td>
                <td style="padding: 8px 0; font-size: 16px;">${signupDate}</td>
              </tr>
            </table>
          </div>
          <div style="text-align: center; margin: 32px 0;">
            <a href="https://acceptafy.com/admin" style="display: inline-block; background: linear-gradient(135deg, #a855f7, #ec4899); color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600;">View in Admin Dashboard</a>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `New User Signup!

A new user has signed up for Acceptafy:

First Name: ${firstName || 'Not provided'}
Last Name: ${lastName || 'Not provided'}
Email: ${userEmail}
Signed Up: ${signupDate}

View in Admin Dashboard: https://acceptafy.com/admin`
  }),

  starterMonthlyReset: (firstName: string, totalGrades: number) => ({
    subject: 'Your Monthly Grades Have Been Renewed!',
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
            <h1 style="background: linear-gradient(135deg, #a855f7, #ec4899); -webkit-background-clip: text; -webkit-text-fill-color: transparent; font-size: 28px; margin: 0;">Fresh Grades Ready!</h1>
          </div>
          <p style="font-size: 16px; line-height: 1.6; margin-bottom: 24px;">Hi ${firstName || 'there'}!</p>
          <p style="font-size: 16px; line-height: 1.6; margin-bottom: 24px;">Great news - your monthly email grades have been renewed! You now have <strong style="color: #a855f7;">3 free grades</strong> ready to use this month.</p>
          ${totalGrades > 0 ? `<p style="font-size: 14px; color: #94a3b8; margin-bottom: 24px;">You've graded ${totalGrades} email${totalGrades !== 1 ? 's' : ''} so far. Keep up the great work!</p>` : ''}
          <div style="background: rgba(168, 85, 247, 0.1); border-radius: 12px; padding: 20px; margin-bottom: 24px; border: 1px solid rgba(168, 85, 247, 0.2);">
            <p style="font-size: 14px; color: #e2e8f0; margin: 0; text-align: center;">
              <strong>Your Starter Plan includes:</strong><br>
              <span style="color: #a855f7;">3 email grades per month</span>
            </p>
          </div>
          <p style="font-size: 16px; line-height: 1.6; margin-bottom: 24px;">Need more grades? Upgrade to Pro for unlimited grading plus AI rewrites, follow-up generation, and advanced deliverability tools.</p>
          <div style="text-align: center; margin: 32px 0;">
            <a href="https://acceptafy.com" style="display: inline-block; background: linear-gradient(135deg, #a855f7, #ec4899); color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; margin-right: 12px;">Start Grading</a>
            <a href="https://acceptafy.com/pricing" style="display: inline-block; background: transparent; color: #a855f7; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; border: 1px solid #a855f7;">View Plans</a>
          </div>
          <p style="font-size: 14px; color: #94a3b8; text-align: center; margin-top: 40px;">Questions? Just reply to this email and we'll help you out.</p>
        </div>
      </body>
      </html>
    `,
    text: `Fresh Grades Ready!

Hi ${firstName || 'there'}!

Great news - your monthly email grades have been renewed! You now have 3 free grades ready to use this month.

${totalGrades > 0 ? `You've graded ${totalGrades} email${totalGrades !== 1 ? 's' : ''} so far. Keep up the great work!` : ''}

Your Starter Plan includes: 3 email grades per month

Need more grades? Upgrade to Pro for unlimited grading plus AI rewrites, follow-up generation, and advanced deliverability tools.

Start grading: https://acceptafy.com
View plans: https://acceptafy.com/pricing

Questions? Just reply to this email and we'll help you out.`
  }),

  paymentFailed: (email: string, amountDue: string) => ({
    subject: 'Action Required: Payment Failed for Your Acceptafy Subscription',
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
            <h1 style="color: #ef4444; font-size: 28px; margin: 0;">Payment Failed</h1>
          </div>
          <p style="font-size: 16px; line-height: 1.6; margin-bottom: 24px;">We were unable to process your payment of ${amountDue} for your Acceptafy subscription.</p>
          <p style="font-size: 16px; line-height: 1.6; margin-bottom: 24px;">To avoid any interruption to your service, please update your payment method as soon as possible.</p>
          <p style="font-size: 16px; line-height: 1.6; margin-bottom: 24px;">If your payment method is not updated, your access to premium features may be restricted.</p>
          <div style="text-align: center; margin: 32px 0;">
            <a href="https://acceptafy.com/settings" style="display: inline-block; background: linear-gradient(135deg, #a855f7, #ec4899); color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600;">Update Payment Method</a>
          </div>
          <p style="font-size: 14px; color: #94a3b8; text-align: center; margin-top: 40px;">Need help? Reply to this email and we'll assist you.</p>
        </div>
      </body>
      </html>
    `,
    text: `Payment Failed

We were unable to process your payment of ${amountDue} for your Acceptafy subscription.

To avoid any interruption to your service, please update your payment method as soon as possible.

If your payment method is not updated, your access to premium features may be restricted.

Visit https://acceptafy.com/settings to update your payment method.

Need help? Reply to this email and we'll assist you.`
  })
};

// Email sending functions
export async function sendWelcomeEmail(toEmail: string): Promise<boolean> {
  try {
    const { client, fromEmail } = await getUncachableResendClient();
    const template = templates.welcome(toEmail);
    
    await client.emails.send({
      from: fromEmail || 'Acceptafy <hello@updates.acceptafy.com>',
      to: toEmail,
      subject: template.subject,
      html: template.html,
      text: template.text
    });
    
    console.log(`Welcome email sent to ${toEmail}`);
    return true;
  } catch (error) {
    console.error('Failed to send welcome email:', error);
    return false;
  }
}

export async function sendPasswordResetEmail(toEmail: string, resetUrl: string): Promise<boolean> {
  try {
    const { client, fromEmail } = await getUncachableResendClient();
    const template = templates.passwordReset(resetUrl);
    
    await client.emails.send({
      from: fromEmail || 'Acceptafy <hello@updates.acceptafy.com>',
      to: toEmail,
      subject: template.subject,
      html: template.html,
      text: template.text
    });
    
    console.log(`Password reset email sent to ${toEmail}`);
    return true;
  } catch (error) {
    console.error('Failed to send password reset email:', error);
    return false;
  }
}

export async function sendAccountDeactivatedEmail(toEmail: string): Promise<boolean> {
  try {
    const { client, fromEmail } = await getUncachableResendClient();
    const template = templates.accountDeactivated(toEmail);
    
    await client.emails.send({
      from: fromEmail || 'Acceptafy <hello@updates.acceptafy.com>',
      to: toEmail,
      subject: template.subject,
      html: template.html,
      text: template.text
    });
    
    console.log(`Account deactivated email sent to ${toEmail}`);
    return true;
  } catch (error) {
    console.error('Failed to send account deactivated email:', error);
    return false;
  }
}

export async function sendUsageLimitWarningEmail(
  toEmail: string, 
  feature: string, 
  current: number, 
  limit: number
): Promise<boolean> {
  try {
    const { client, fromEmail } = await getUncachableResendClient();
    const template = templates.usageLimitWarning(toEmail, feature, current, limit);
    
    await client.emails.send({
      from: fromEmail || 'Acceptafy <hello@updates.acceptafy.com>',
      to: toEmail,
      subject: template.subject,
      html: template.html,
      text: template.text
    });
    
    console.log(`Usage limit warning email sent to ${toEmail}`);
    return true;
  } catch (error) {
    console.error('Failed to send usage limit warning email:', error);
    return false;
  }
}

export async function sendPaymentFailedEmail(toEmail: string, amountDue: string): Promise<boolean> {
  try {
    const { client, fromEmail } = await getUncachableResendClient();
    const template = templates.paymentFailed(toEmail, amountDue);
    
    await client.emails.send({
      from: fromEmail || 'Acceptafy <hello@updates.acceptafy.com>',
      to: toEmail,
      subject: template.subject,
      html: template.html,
      text: template.text
    });
    
    console.log(`Payment failed email sent to ${toEmail}`);
    return true;
  } catch (error) {
    console.error('Failed to send payment failed email:', error);
    return false;
  }
}

export async function sendEmailVerification(toEmail: string, verifyUrl: string): Promise<boolean> {
  try {
    const { client, fromEmail } = await getUncachableResendClient();
    const template = templates.emailVerification(verifyUrl);
    
    await client.emails.send({
      from: fromEmail || 'Acceptafy <hello@updates.acceptafy.com>',
      to: toEmail,
      subject: template.subject,
      html: template.html,
      text: template.text
    });
    
    console.log(`Email verification sent to ${toEmail}`);
    return true;
  } catch (error) {
    console.error('Failed to send email verification:', error);
    return false;
  }
}

export async function sendAdminNewSignupNotification(
  firstName: string,
  lastName: string,
  userEmail: string
): Promise<boolean> {
  const adminEmail = 'hello@acceptafy.com';
  
  try {
    const { client, fromEmail } = await getUncachableResendClient();
    const signupDate = new Date().toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short'
    });
    const template = templates.adminNewSignup(firstName, lastName, userEmail, signupDate);
    
    await client.emails.send({
      from: fromEmail || 'Acceptafy <hello@updates.acceptafy.com>',
      to: adminEmail,
      subject: template.subject,
      html: template.html,
      text: template.text
    });
    
    console.log(`Admin signup notification sent for ${userEmail}`);
    return true;
  } catch (error) {
    console.error('Failed to send admin signup notification:', error);
    return false;
  }
}

export async function sendStarterMonthlyResetEmail(
  toEmail: string,
  firstName: string,
  gradesUsed: number
): Promise<boolean> {
  try {
    const { client, fromEmail } = await getUncachableResendClient();
    const template = templates.starterMonthlyReset(firstName, gradesUsed);
    
    await client.emails.send({
      from: fromEmail || 'Acceptafy <hello@updates.acceptafy.com>',
      to: toEmail,
      subject: template.subject,
      html: template.html,
      text: template.text
    });
    
    console.log(`Starter monthly reset email sent to ${toEmail}`);
    return true;
  } catch (error) {
    console.error('Failed to send starter monthly reset email:', error);
    return false;
  }
}
