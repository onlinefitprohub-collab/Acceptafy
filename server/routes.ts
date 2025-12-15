import type { Express } from "express";
import { type Server } from "http";
import bcrypt from "bcrypt";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { setupAuth, isAuthenticated, optionalAuth, isAdmin } from "./replitAuth";
import { getUncachableStripeClient, getStripePublishableKey } from "./stripeClient";
import { 
  gradeCopy, 
  rewriteCopy, 
  generateFollowUpEmail, 
  generateFollowUpSequence,
  generateDnsRecords,
  checkDomainHealth,
  analyzeEmailList,
  generateBimiRecord,
  explainTerm,
  generateSubjectVariations,
  generateOptimizationRoadmap,
  rewriteWithTone,
  generateEmailPreviews,
  generateWarmupPlan,
  checkSpamTriggers,
  checkSpamTriggersAdvanced,
  analyzeSentiment,
  estimateSenderScore,
  analyzeCompetitorEmail,
  simulateInboxPlacement,
  optimizeSendTime,
  predictEngagement,
  compareToIndustry,
  analyzeReputation
} from "./gemini";
import { insertEmailTemplateSchema, insertContactMessageSchema } from "@shared/schema";
import { SUBSCRIPTION_LIMITS, connectESPRequestSchema, espProviderSchema } from "@shared/schema";
import { validateESPConnection, fetchESPStats, sendEmailViaESP, type ESPCredentials } from "./services/esp";
import { sendWelcomeEmail, sendPasswordResetEmail, sendAccountDeactivatedEmail } from "./services/email";
import { generateBenchmarkFeedback, calculateReadingLevel } from "@shared/benchmarks";
import { 
  generateVariationsRequestSchema,
  generateToneRewriteRequestSchema,
  generatePreviewRequestSchema,
  gradingResultSchema,
  senderScoreInputSchema
} from "@shared/schema";
import { z } from "zod";

const generateRoadmapRequestSchema = z.object({
  analysisResult: gradingResultSchema,
  subject: z.string().default(''),
  body: z.string().default(''),
});

const espStatsAnalysisRequestSchema = z.object({
  stats: z.object({
    totalCampaigns: z.number().min(0),
    totalSent: z.number().min(0),
    totalDelivered: z.number().min(0).optional(),
    totalOpened: z.number().min(0).optional(),
    totalClicked: z.number().min(0).optional(),
    avgOpenRate: z.number().min(0).max(100),
    avgClickRate: z.number().min(0).max(100),
    avgBounceRate: z.number().min(0).max(100),
    campaigns: z.array(z.object({
      campaignName: z.string(),
      subject: z.string().optional(),
      totalSent: z.number().min(0),
      openRate: z.number().min(0).max(100),
      clickRate: z.number().min(0).max(100),
      bounceRate: z.number().min(0).max(100),
    })).optional(),
  }),
});

function normalizeTier(tier: string | null | undefined): 'starter' | 'pro' | 'scale' {
  if (!tier || tier === 'free') return 'starter';
  if (tier === 'pro' || tier === 'scale') return tier;
  return 'starter';
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // Helper function to get base URL securely (prevents host header injection)
  function getBaseUrl(req: any): string {
    if (process.env.REPLIT_DEV_DOMAIN) {
      return `https://${process.env.REPLIT_DEV_DOMAIN}`;
    }
    if (process.env.APP_URL) {
      return process.env.APP_URL;
    }
    return `${req.protocol}://${req.get('host')}`;
  }

  await setupAuth(app);

  // Email/Password Login
  app.post('/api/auth/login', async (req, res) => {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
      }

      const user = await storage.getUserByEmail(email);
      if (!user || !user.passwordHash) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      const isValid = await bcrypt.compare(password, user.passwordHash);
      if (!isValid) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      // Update last login time
      await storage.updateUser(user.id, { lastLoginAt: new Date() });

      // Create session for password-authenticated user
      (req as any).login({ 
        claims: { sub: user.id, email: user.email },
        expires_at: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60) // 7 days
      }, (err: any) => {
        if (err) {
          console.error("Login error:", err);
          return res.status(500).json({ message: "Login failed" });
        }
        res.json({ 
          success: true, 
          user: { 
            id: user.id, 
            email: user.email, 
            role: user.role,
            subscriptionTier: user.subscriptionTier 
          } 
        });
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Login failed" });
    }
  });

  // Email/Password Registration
  app.post('/api/auth/register', async (req, res) => {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ message: "Please enter a valid email address" });
      }

      // Validate password strength
      if (password.length < 8) {
        return res.status(400).json({ message: "Password must be at least 8 characters" });
      }

      // Check if user already exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(409).json({ message: "An account with this email already exists" });
      }

      // Hash password and create user
      const passwordHash = await bcrypt.hash(password, 10);
      const user = await storage.createUserWithPassword(email, passwordHash, 'user', 'starter');

      // Send welcome email (don't block registration if email fails)
      sendWelcomeEmail(email).catch(err => console.error('Welcome email failed:', err));

      // Create session for newly registered user
      (req as any).login({ 
        claims: { sub: user.id, email: user.email },
        expires_at: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60) // 7 days
      }, (err: any) => {
        if (err) {
          console.error("Registration login error:", err);
          return res.status(500).json({ message: "Account created but login failed" });
        }
        res.json({ 
          success: true, 
          user: { 
            id: user.id, 
            email: user.email, 
            role: user.role,
            subscriptionTier: user.subscriptionTier 
          } 
        });
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ message: "Registration failed" });
    }
  });

  // Check if email/password auth user
  app.get('/api/auth/session', async (req: any, res) => {
    try {
      if (!req.isAuthenticated || !req.isAuthenticated()) {
        return res.json({ authenticated: false });
      }
      
      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.json({ authenticated: false });
      }

      const user = await storage.getUser(userId);
      if (!user) {
        return res.json({ authenticated: false });
      }

      res.json({ 
        authenticated: true, 
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          subscriptionTier: user.subscriptionTier,
          subscriptionStatus: user.subscriptionStatus,
          isEmailPasswordUser: !!user.passwordHash
        }
      });
    } catch (error) {
      console.error("Session check error:", error);
      res.json({ authenticated: false });
    }
  });

  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Change password (for email/password users only)
  app.post('/api/change-password', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { currentPassword, newPassword } = req.body;

      if (!currentPassword || !newPassword) {
        return res.status(400).json({ message: "Current and new password are required" });
      }

      if (newPassword.length < 8) {
        return res.status(400).json({ message: "Password must be at least 8 characters" });
      }

      const user = await storage.getUser(userId);
      if (!user || !user.passwordHash) {
        return res.status(400).json({ message: "Password change not available for OAuth accounts" });
      }

      const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
      if (!isValid) {
        return res.status(401).json({ message: "Current password is incorrect" });
      }

      const newHash = await bcrypt.hash(newPassword, 10);
      await storage.updateUser(userId, { passwordHash: newHash });

      res.json({ success: true, message: "Password changed successfully" });
    } catch (error) {
      console.error("Change password error:", error);
      res.status(500).json({ message: "Failed to change password" });
    }
  });

  // Request password reset
  app.post('/api/auth/forgot-password', async (req, res) => {
    try {
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({ message: "Email is required" });
      }

      const user = await storage.getUserByEmail(email);
      
      // Always return success to prevent email enumeration
      if (!user || !user.passwordHash) {
        console.log(`Password reset requested for non-existent or OAuth email: ${email}`);
        return res.json({ success: true, message: "If an account exists with this email, you will receive a password reset link." });
      }

      // Generate secure token
      const crypto = await import('crypto');
      const token = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      await storage.createPasswordResetToken(user.id, token, expiresAt);

      // Send password reset email
      const resetUrl = `${getBaseUrl(req)}/reset-password?token=${token}`;
      sendPasswordResetEmail(email, resetUrl).catch(err => console.error('Password reset email failed:', err));

      res.json({ success: true, message: "If an account exists with this email, you will receive a password reset link." });
    } catch (error) {
      console.error("Password reset request error:", error);
      res.status(500).json({ message: "Failed to process password reset request" });
    }
  });

  // Reset password with token
  app.post('/api/auth/reset-password', async (req, res) => {
    try {
      const { token, newPassword } = req.body;
      
      if (!token || !newPassword) {
        return res.status(400).json({ message: "Token and new password are required" });
      }

      if (newPassword.length < 8) {
        return res.status(400).json({ message: "Password must be at least 8 characters" });
      }

      const resetToken = await storage.getPasswordResetToken(token);
      
      if (!resetToken) {
        return res.status(400).json({ message: "Invalid or expired reset link" });
      }

      if (resetToken.usedAt) {
        return res.status(400).json({ message: "This reset link has already been used" });
      }

      if (new Date() > resetToken.expiresAt) {
        return res.status(400).json({ message: "This reset link has expired" });
      }

      // Hash new password and update user
      const passwordHash = await bcrypt.hash(newPassword, 10);
      await storage.updateUser(resetToken.userId, { passwordHash });
      
      // Mark token as used
      await storage.markPasswordResetTokenUsed(token);

      res.json({ success: true, message: "Password has been reset successfully" });
    } catch (error) {
      console.error("Password reset error:", error);
      res.status(500).json({ message: "Failed to reset password" });
    }
  });

  // Verify reset token (for frontend to check if token is valid before showing form)
  app.get('/api/auth/verify-reset-token', async (req, res) => {
    try {
      const { token } = req.query;
      
      if (!token || typeof token !== 'string') {
        return res.json({ valid: false, message: "No token provided" });
      }

      const resetToken = await storage.getPasswordResetToken(token);
      
      if (!resetToken) {
        return res.json({ valid: false, message: "Invalid reset link" });
      }

      if (resetToken.usedAt) {
        return res.json({ valid: false, message: "This reset link has already been used" });
      }

      if (new Date() > resetToken.expiresAt) {
        return res.json({ valid: false, message: "This reset link has expired" });
      }

      res.json({ valid: true, email: resetToken.user.email });
    } catch (error) {
      console.error("Token verification error:", error);
      res.json({ valid: false, message: "Failed to verify token" });
    }
  });

  // Delete account
  app.delete('/api/delete-account', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Cancel Stripe subscription if exists
      if (user.stripeSubscriptionId) {
        try {
          const stripe = await getUncachableStripeClient();
          await stripe.subscriptions.cancel(user.stripeSubscriptionId);
        } catch (stripeError) {
          console.error("Error canceling subscription:", stripeError);
        }
      }

      // Delete the user
      await storage.deleteUser(userId);

      // Logout the session
      req.logout((err: any) => {
        if (err) {
          console.error("Logout error during account deletion:", err);
        }
        res.json({ success: true, message: "Account deleted successfully" });
      });
    } catch (error) {
      console.error("Delete account error:", error);
      res.status(500).json({ message: "Failed to delete account" });
    }
  });

  app.get('/api/stripe/publishable-key', async (req, res) => {
    try {
      const publishableKey = await getStripePublishableKey();
      res.json({ publishableKey });
    } catch (error) {
      console.error("Error fetching Stripe key:", error);
      res.status(500).json({ message: "Failed to fetch Stripe key" });
    }
  });

  app.get('/api/subscription', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      const tier = normalizeTier(user?.subscriptionTier);
      
      if (!user?.stripeSubscriptionId) {
        return res.json({ 
          subscription: null, 
          tier,
          status: user?.subscriptionStatus || 'free'
        });
      }

      const subscription = await storage.getSubscription(user.stripeSubscriptionId);
      res.json({ 
        subscription, 
        tier,
        status: user.subscriptionStatus 
      });
    } catch (error) {
      console.error("Error fetching subscription:", error);
      res.status(500).json({ message: "Failed to fetch subscription" });
    }
  });

  app.get('/api/usage', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      let counter = await storage.getUsageCounter(userId);
      
      if (!counter) {
        counter = await storage.createOrResetUsageCounter(userId);
      }

      const tier = normalizeTier(user?.subscriptionTier);
      const { SUBSCRIPTION_LIMITS } = await import("@shared/schema");
      const limits = SUBSCRIPTION_LIMITS[tier];

      res.json({
        usage: counter,
        limits,
        tier
      });
    } catch (error) {
      console.error("Error fetching usage:", error);
      res.status(500).json({ message: "Failed to fetch usage" });
    }
  });

  app.post('/api/checkout', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      const { priceId } = req.body;

      if (!priceId) {
        return res.status(400).json({ error: 'Price ID is required' });
      }

      const stripe = await getUncachableStripeClient();

      let customerId = user?.stripeCustomerId;
      if (!customerId) {
        const customer = await stripe.customers.create({
          email: user?.email || undefined,
          metadata: { userId },
        });
        await storage.updateUserStripeInfo(userId, { stripeCustomerId: customer.id });
        customerId = customer.id;
      }

      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        payment_method_types: ['card'],
        line_items: [{ price: priceId, quantity: 1 }],
        mode: 'subscription',
        success_url: `${req.protocol}://${req.get('host')}/account?success=true`,
        cancel_url: `${req.protocol}://${req.get('host')}/pricing?canceled=true`,
      });

      res.json({ url: session.url });
    } catch (error) {
      console.error("Checkout error:", error);
      res.status(500).json({ message: "Failed to create checkout session" });
    }
  });

  app.post('/api/billing-portal', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);

      if (!user?.stripeCustomerId) {
        return res.status(400).json({ error: 'No billing account found' });
      }

      const stripe = await getUncachableStripeClient();
      const session = await stripe.billingPortal.sessions.create({
        customer: user.stripeCustomerId,
        return_url: `${req.protocol}://${req.get('host')}/account`,
      });

      res.json({ url: session.url });
    } catch (error) {
      console.error("Billing portal error:", error);
      res.status(500).json({ message: "Failed to create billing portal session" });
    }
  });

  app.get('/api/products', async (req, res) => {
    try {
      const rows = await storage.listProductsWithPrices();

      const productsMap = new Map();
      for (const row of rows as any[]) {
        if (!productsMap.has(row.product_id)) {
          productsMap.set(row.product_id, {
            id: row.product_id,
            name: row.product_name,
            description: row.product_description,
            active: row.product_active,
            metadata: row.product_metadata,
            prices: []
          });
        }
        if (row.price_id) {
          productsMap.get(row.product_id).prices.push({
            id: row.price_id,
            unit_amount: row.unit_amount,
            currency: row.currency,
            recurring: row.recurring,
            active: row.price_active,
            metadata: row.price_metadata,
          });
        }
      }

      res.json({ data: Array.from(productsMap.values()) });
    } catch (error) {
      console.error("Products error:", error);
      res.status(500).json({ message: "Failed to fetch products" });
    }
  });

  app.get('/api/history', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const limit = parseInt(req.query.limit as string) || 50;
      const analyses = await storage.getEmailAnalyses(userId, limit);
      res.json(analyses);
    } catch (error) {
      console.error("History error:", error);
      res.status(500).json({ message: "Failed to fetch history" });
    }
  });

  app.delete('/api/history/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { id } = req.params;
      await storage.deleteEmailAnalysis(id, userId);
      res.json({ success: true });
    } catch (error) {
      console.error("Delete history item error:", error);
      res.status(500).json({ message: "Failed to delete history item" });
    }
  });

  app.delete('/api/history', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      await storage.clearAllEmailAnalyses(userId);
      res.json({ success: true });
    } catch (error) {
      console.error("Clear history error:", error);
      res.status(500).json({ message: "Failed to clear history" });
    }
  });

  app.get('/api/gamification', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      let gamification = await storage.getUserGamification(userId);
      
      if (!gamification) {
        gamification = await storage.upsertUserGamification({
          userId,
          xp: 0,
          level: 1,
          streak: 0,
          achievements: [],
          totalGrades: 0,
          bestScore: 0,
        });
      }

      res.json(gamification);
    } catch (error) {
      console.error("Gamification error:", error);
      res.status(500).json({ message: "Failed to fetch gamification data" });
    }
  });

  app.post('/api/gamification', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const data = req.body;
      const gamification = await storage.upsertUserGamification({
        ...data,
        userId,
      });
      res.json(gamification);
    } catch (error) {
      console.error("Gamification update error:", error);
      res.status(500).json({ message: "Failed to update gamification data" });
    }
  });

  async function checkAndIncrementUsage(req: any, res: any, field: 'gradeCount' | 'rewriteCount' | 'followupCount' | 'deliverabilityChecks') {
    if (!req.user) return true;
    
    const userId = req.user.claims.sub;
    
    // Check subscription status first
    const user = await storage.getUser(userId);
    if (user) {
      const restrictedStatuses = ['past_due', 'canceled', 'unpaid', 'incomplete_expired'];
      if (user.subscriptionStatus && restrictedStatuses.includes(user.subscriptionStatus)) {
        res.status(403).json({ 
          error: 'Subscription issue',
          message: 'Your subscription has a payment issue. Please update your payment method to continue using premium features.',
          subscriptionStatus: user.subscriptionStatus
        });
        return false;
      }
    }
    
    const { allowed, current, limit } = await storage.checkUsageLimit(userId, field);
    
    if (!allowed) {
      res.status(403).json({ 
        error: 'Usage limit reached',
        message: `You've reached your monthly limit of ${limit}. Upgrade your plan for more.`,
        current,
        limit
      });
      return false;
    }
    
    await storage.incrementUsage(userId, field);
    return true;
  }

  app.post('/api/grade', optionalAuth, async (req: any, res) => {
    try {
      if (req.user) {
        const allowed = await checkAndIncrementUsage(req, res, 'gradeCount');
        if (!allowed) return;
      }

      const { body, variations, industry, emailType } = req.body;
      const result = await gradeCopy(body, variations);

      // Generate benchmark feedback only if industry or emailType is provided
      let benchmarkFeedback = null;
      if (industry || emailType) {
        // Extract metrics for benchmark comparison
        const lines = body.split('\n');
        const subjectLine = lines[0] || '';
        const subjectLength = subjectLine.length;
        const words = body.split(/\s+/).filter((w: string) => w.length > 0);
        const wordCount = words.length;
        const readingLevel = calculateReadingLevel(body);
        const spamWordsFound = result.spamAnalysis?.map((s: any) => s.word) || [];

        benchmarkFeedback = generateBenchmarkFeedback(
          industry,
          emailType,
          { subjectLength, wordCount, readingLevel, spamWordsFound }
        );
      }

      if (req.user) {
        const userId = req.user.claims.sub;
        await storage.createEmailAnalysis({
          userId,
          body,
          variations: variations || [],
          result,
          score: result.inboxPlacementScore?.score,
          grade: result.overallGrade?.grade,
        });

        const gamification = await storage.getUserGamification(userId);
        if (gamification) {
          const newTotalGrades = (gamification.totalGrades || 0) + 1;
          const newBestScore = Math.max(gamification.bestScore || 0, result.inboxPlacementScore?.score || 0);
          const newXp = (gamification.xp || 0) + 10;
          const newLevel = Math.floor(newXp / 100) + 1;
          
          await storage.upsertUserGamification({
            ...gamification,
            totalGrades: newTotalGrades,
            bestScore: newBestScore,
            xp: newXp,
            level: newLevel,
            lastActiveDate: new Date().toISOString().split('T')[0],
          });
        }
      }

      // Return result with benchmarkFeedback only if it was calculated
      if (benchmarkFeedback) {
        res.json({ ...result, benchmarkFeedback });
      } else {
        res.json(result);
      }
    } catch (error) {
      console.error('Grading error:', error);
      res.status(500).json({ error: 'Failed to grade email' });
    }
  });

  app.post('/api/rewrite', optionalAuth, async (req: any, res) => {
    try {
      if (req.user) {
        const allowed = await checkAndIncrementUsage(req, res, 'rewriteCount');
        if (!allowed) return;
      }

      const { body, subject, preview, goal } = req.body;
      const result = await rewriteCopy(body, subject, preview, goal);
      res.json(result);
    } catch (error) {
      console.error('Rewrite error:', error);
      res.status(500).json({ error: 'Failed to rewrite email' });
    }
  });

  app.post('/api/followup', optionalAuth, async (req: any, res) => {
    try {
      if (req.user) {
        const allowed = await checkAndIncrementUsage(req, res, 'followupCount');
        if (!allowed) return;
      }

      const { original, analysis, goal, context } = req.body;
      const result = await generateFollowUpEmail(original, analysis, goal, context);
      res.json(result);
    } catch (error) {
      console.error('Follow-up error:', error);
      res.status(500).json({ error: 'Failed to generate follow-up' });
    }
  });

  app.post('/api/followup/sequence', optionalAuth, async (req: any, res) => {
    try {
      if (req.user) {
        const allowed = await checkAndIncrementUsage(req, res, 'followupCount');
        if (!allowed) return;
      }

      const { original, analysis, goal } = req.body;
      const result = await generateFollowUpSequence(original, analysis, goal);
      res.json(result);
    } catch (error) {
      console.error('Sequence error:', error);
      res.status(500).json({ error: 'Failed to generate sequence' });
    }
  });

  app.post('/api/dns/generate', optionalAuth, async (req: any, res) => {
    try {
      if (req.user) {
        const allowed = await checkAndIncrementUsage(req, res, 'deliverabilityChecks');
        if (!allowed) return;
      }

      const { domain } = req.body;
      const result = await generateDnsRecords(domain);
      res.json(result);
    } catch (error) {
      console.error('DNS generation error:', error);
      res.status(500).json({ error: 'Failed to generate DNS records' });
    }
  });

  app.post('/api/domain/health', optionalAuth, async (req: any, res) => {
    try {
      if (req.user) {
        const allowed = await checkAndIncrementUsage(req, res, 'deliverabilityChecks');
        if (!allowed) return;
      }

      const { domain } = req.body;
      const result = await checkDomainHealth(domain);
      res.json(result);
    } catch (error) {
      console.error('Domain health check error:', error);
      res.status(500).json({ error: 'Failed to check domain health' });
    }
  });

  app.post('/api/list/analyze', optionalAuth, async (req: any, res) => {
    try {
      if (req.user) {
        const allowed = await checkAndIncrementUsage(req, res, 'deliverabilityChecks');
        if (!allowed) return;
      }

      const { sample } = req.body;
      const result = await analyzeEmailList(sample);
      res.json(result);
    } catch (error) {
      console.error('List analysis error:', error);
      res.status(500).json({ error: 'Failed to analyze email list' });
    }
  });

  app.post('/api/bimi/generate', optionalAuth, async (req: any, res) => {
    try {
      if (req.user) {
        const allowed = await checkAndIncrementUsage(req, res, 'deliverabilityChecks');
        if (!allowed) return;
      }

      const { domain } = req.body;
      const result = await generateBimiRecord(domain);
      res.json(result);
    } catch (error) {
      console.error('BIMI generation error:', error);
      res.status(500).json({ error: 'Failed to generate BIMI record' });
    }
  });

  app.post('/api/glossary/explain', async (req, res) => {
    try {
      const { term } = req.body;
      const result = await explainTerm(term);
      res.json(result);
    } catch (error) {
      console.error('Glossary explanation error:', error);
      res.status(500).json({ error: 'Failed to explain term' });
    }
  });

  app.post('/api/subjects/variations', optionalAuth, async (req: any, res) => {
    try {
      if (req.user) {
        const allowed = await checkAndIncrementUsage(req, res, 'rewriteCount');
        if (!allowed) return;
      }

      const validated = generateVariationsRequestSchema.safeParse(req.body);
      if (!validated.success) {
        return res.status(400).json({ error: validated.error.errors[0]?.message || 'Invalid request' });
      }
      const { subject, preview, body } = validated.data;
      const result = await generateSubjectVariations(subject, preview, body);
      res.json(result);
    } catch (error) {
      console.error('Subject variations error:', error);
      res.status(500).json({ error: 'Failed to generate subject variations' });
    }
  });

  app.post('/api/optimization/roadmap', async (req, res) => {
    try {
      const validated = generateRoadmapRequestSchema.safeParse(req.body);
      if (!validated.success) {
        return res.status(400).json({ error: validated.error.errors[0]?.message || 'Invalid request' });
      }
      const { analysisResult, subject, body } = validated.data;
      const result = await generateOptimizationRoadmap(analysisResult, subject, body);
      res.json(result);
    } catch (error) {
      console.error('Optimization roadmap error:', error);
      res.status(500).json({ error: 'Failed to generate optimization roadmap' });
    }
  });

  app.post('/api/rewrite/tone', optionalAuth, async (req: any, res) => {
    try {
      if (req.user) {
        const allowed = await checkAndIncrementUsage(req, res, 'rewriteCount');
        if (!allowed) return;
      }

      const validated = generateToneRewriteRequestSchema.safeParse(req.body);
      if (!validated.success) {
        return res.status(400).json({ error: validated.error.errors[0]?.message || 'Invalid request' });
      }
      const { body, subject, preview, tone } = validated.data;
      const result = await rewriteWithTone(body, subject, preview, tone);
      res.json(result);
    } catch (error) {
      console.error('Tone rewrite error:', error);
      res.status(500).json({ error: 'Failed to rewrite with tone' });
    }
  });

  app.post('/api/email/preview', async (req, res) => {
    try {
      const validated = generatePreviewRequestSchema.safeParse(req.body);
      if (!validated.success) {
        return res.status(400).json({ error: validated.error.errors[0]?.message || 'Invalid request' });
      }
      const { subject, previewText, senderName } = validated.data;
      const result = await generateEmailPreviews(subject, previewText, senderName || 'Your Brand');
      res.json(result);
    } catch (error) {
      console.error('Email preview error:', error);
      res.status(500).json({ error: 'Failed to generate email previews' });
    }
  });

  app.post('/api/warmup/generate', optionalAuth, async (req: any, res) => {
    try {
      if (req.user) {
        const allowed = await checkAndIncrementUsage(req, res, 'deliverabilityChecks');
        if (!allowed) return;
      }

      const { domain } = req.body;
      if (!domain || typeof domain !== 'string') {
        return res.status(400).json({ error: 'Domain is required' });
      }
      const result = await generateWarmupPlan(domain);
      res.json(result);
    } catch (error) {
      console.error('Warmup plan generation error:', error);
      res.status(500).json({ error: 'Failed to generate warmup plan' });
    }
  });

  app.post('/api/spam/check', optionalAuth, async (req: any, res) => {
    try {
      const { text, subject, previewText } = req.body;
      if (!text || typeof text !== 'string') {
        return res.status(400).json({ error: 'Email text is required' });
      }
      
      // Check if user has advanced spam analysis access (Pro or Scale tier)
      let useAdvanced = false;
      if (req.user) {
        const userId = req.user.claims.sub;
        const user = await storage.getUser(userId);
        if (user) {
          const tier = normalizeTier(user.subscriptionTier);
          useAdvanced = SUBSCRIPTION_LIMITS[tier].advancedSpamAnalysis;
        }
      }
      
      if (useAdvanced) {
        const result = await checkSpamTriggersAdvanced(text, subject, previewText);
        res.json({ ...result, isAdvanced: true });
      } else {
        const result = await checkSpamTriggers(text, subject, previewText);
        res.json({ ...result, isAdvanced: false });
      }
    } catch (error) {
      console.error('Spam check error:', error);
      res.status(500).json({ error: 'Failed to check for spam triggers' });
    }
  });

  app.post('/api/sentiment/analyze', async (req, res) => {
    try {
      const { text, subject, previewText } = req.body;
      if (!text || typeof text !== 'string') {
        return res.status(400).json({ error: 'Email text is required' });
      }
      const result = await analyzeSentiment(text, subject, previewText);
      res.json(result);
    } catch (error) {
      console.error('Sentiment analysis error:', error);
      res.status(500).json({ error: 'Failed to analyze sentiment' });
    }
  });

  app.post('/api/sender-score/estimate', async (req, res) => {
    try {
      const parseResult = senderScoreInputSchema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({ 
          error: 'Invalid input', 
          details: parseResult.error.flatten().fieldErrors 
        });
      }
      
      const result = await estimateSenderScore(parseResult.data);
      res.json(result);
    } catch (error) {
      console.error('Sender score estimation error:', error);
      res.status(500).json({ error: 'Failed to estimate sender score' });
    }
  });

  // Email Templates API
  app.get('/api/templates', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const templates = await storage.getEmailTemplates(userId);
      res.json(templates);
    } catch (error) {
      console.error('Get templates error:', error);
      res.status(500).json({ error: 'Failed to fetch templates' });
    }
  });

  app.get('/api/templates/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const template = await storage.getEmailTemplate(req.params.id, userId);
      if (!template) {
        return res.status(404).json({ error: 'Template not found' });
      }
      res.json(template);
    } catch (error) {
      console.error('Get template error:', error);
      res.status(500).json({ error: 'Failed to fetch template' });
    }
  });

  app.post('/api/templates', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const validated = insertEmailTemplateSchema.safeParse({ ...req.body, userId });
      if (!validated.success) {
        return res.status(400).json({ error: validated.error.errors[0]?.message || 'Invalid template data' });
      }
      const template = await storage.createEmailTemplate(validated.data);
      res.json(template);
    } catch (error) {
      console.error('Create template error:', error);
      res.status(500).json({ error: 'Failed to create template' });
    }
  });

  app.patch('/api/templates/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const template = await storage.updateEmailTemplate(req.params.id, userId, req.body);
      if (!template) {
        return res.status(404).json({ error: 'Template not found' });
      }
      res.json(template);
    } catch (error) {
      console.error('Update template error:', error);
      res.status(500).json({ error: 'Failed to update template' });
    }
  });

  app.delete('/api/templates/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      await storage.deleteEmailTemplate(req.params.id, userId);
      res.json({ success: true });
    } catch (error) {
      console.error('Delete template error:', error);
      res.status(500).json({ error: 'Failed to delete template' });
    }
  });

  // Competitor Analysis API
  app.post('/api/competitor/analyze', optionalAuth, async (req: any, res) => {
    try {
      if (req.user) {
        const allowed = await checkAndIncrementUsage(req, res, 'gradeCount');
        if (!allowed) return;
      }

      const { competitorEmail } = req.body;
      if (!competitorEmail || typeof competitorEmail !== 'string') {
        return res.status(400).json({ error: 'Competitor email content is required' });
      }

      const analysis = await analyzeCompetitorEmail(competitorEmail);

      if (req.user) {
        const userId = req.user.claims.sub;
        await storage.createCompetitorAnalysis({
          userId,
          competitorEmail,
          analysis,
        });
      }

      res.json(analysis);
    } catch (error) {
      console.error('Competitor analysis error:', error);
      res.status(500).json({ error: 'Failed to analyze competitor email' });
    }
  });

  app.get('/api/competitor/history', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const limit = parseInt(req.query.limit as string) || 20;
      const analyses = await storage.getCompetitorAnalyses(userId, limit);
      res.json(analyses);
    } catch (error) {
      console.error('Competitor history error:', error);
      res.status(500).json({ error: 'Failed to fetch competitor analyses' });
    }
  });

  // Inbox Placement Simulation API
  app.post('/api/inbox/simulate', optionalAuth, async (req: any, res) => {
    try {
      if (req.user) {
        const allowed = await checkAndIncrementUsage(req, res, 'deliverabilityChecks');
        if (!allowed) return;
      }

      const { subject, previewText, body, senderDomain } = req.body;
      if (!body || typeof body !== 'string') {
        return res.status(400).json({ error: 'Email body is required' });
      }

      const result = await simulateInboxPlacement(subject || '', previewText || '', body, senderDomain || '');
      res.json(result);
    } catch (error) {
      console.error('Inbox simulation error:', error);
      res.status(500).json({ error: 'Failed to simulate inbox placement' });
    }
  });

  // Admin Routes - Protected with isAdmin middleware
  app.get('/api/admin/check', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json({ isAdmin: user?.role === 'admin' });
    } catch (error) {
      console.error('Admin check error:', error);
      res.json({ isAdmin: false });
    }
  });

  app.get('/api/admin/users', isAdmin, async (req: any, res) => {
    try {
      const users = await storage.getAllUsersWithUsage();
      const sanitizedUsers = users.map(({ passwordHash, ...user }) => user);
      res.json(sanitizedUsers);
    } catch (error) {
      console.error('Admin users error:', error);
      res.status(500).json({ error: 'Failed to fetch users' });
    }
  });

  app.get('/api/admin/stats', isAdmin, async (req: any, res) => {
    try {
      const stats = await storage.getAdminStats();
      res.json(stats);
    } catch (error) {
      console.error('Admin stats error:', error);
      res.status(500).json({ error: 'Failed to fetch admin stats' });
    }
  });

  app.get('/api/admin/metrics', isAdmin, async (req: any, res) => {
    try {
      const metrics = await storage.getBusinessMetrics();
      res.json(metrics);
    } catch (error) {
      console.error('Admin metrics error:', error);
      res.status(500).json({ error: 'Failed to fetch business metrics' });
    }
  });

  app.get('/api/admin/content-analytics', isAdmin, async (req: any, res) => {
    try {
      const analytics = await storage.getContentAnalytics();
      res.json(analytics);
    } catch (error) {
      console.error('Admin content analytics error:', error);
      res.status(500).json({ error: 'Failed to fetch content analytics' });
    }
  });

  app.get('/api/admin/feature-adoption', isAdmin, async (req: any, res) => {
    try {
      const adoption = await storage.getFeatureAdoption();
      res.json(adoption);
    } catch (error) {
      console.error('Admin feature adoption error:', error);
      res.status(500).json({ error: 'Failed to fetch feature adoption data' });
    }
  });

  app.get('/api/admin/esp-metrics', isAdmin, async (req: any, res) => {
    try {
      const espMetrics = await storage.getESPMetrics();
      res.json(espMetrics);
    } catch (error) {
      console.error('Admin ESP metrics error:', error);
      res.status(500).json({ error: 'Failed to fetch ESP metrics' });
    }
  });

  // Agency Branding endpoints (Scale tier only)
  app.get('/api/agency-branding', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      
      if (user?.subscriptionTier !== 'scale') {
        return res.status(403).json({ error: 'Agency branding is only available for Scale tier' });
      }
      
      const branding = await storage.getAgencyBranding(userId);
      res.json(branding || {});
    } catch (error) {
      console.error('Get agency branding error:', error);
      res.status(500).json({ error: 'Failed to fetch agency branding' });
    }
  });

  app.post('/api/agency-branding', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      
      if (user?.subscriptionTier !== 'scale') {
        return res.status(403).json({ error: 'Agency branding is only available for Scale tier' });
      }
      
      const { agencyName, logoUrl, primaryColor, secondaryColor, footerText, introText, contactEmail, contactPhone, website } = req.body;
      
      const branding = await storage.upsertAgencyBranding(userId, {
        agencyName,
        logoUrl,
        primaryColor,
        secondaryColor,
        footerText,
        introText,
        contactEmail,
        contactPhone,
        website,
      });
      
      res.json(branding);
    } catch (error) {
      console.error('Save agency branding error:', error);
      res.status(500).json({ error: 'Failed to save agency branding' });
    }
  });

  // AI Insights Endpoints
  app.post('/api/insights/send-time', optionalAuth, async (req: any, res) => {
    try {
      if (req.user) {
        const allowed = await checkAndIncrementUsage(req, res, 'deliverabilityChecks');
        if (!allowed) return;
      }

      const { emailContent, industry, audienceType } = req.body;
      const result = await optimizeSendTime(emailContent, industry, audienceType);
      res.json(result);
    } catch (error) {
      console.error('Send time optimization error:', error);
      res.status(500).json({ error: 'Failed to optimize send time' });
    }
  });

  app.post('/api/insights/engagement', optionalAuth, async (req: any, res) => {
    try {
      if (req.user) {
        const allowed = await checkAndIncrementUsage(req, res, 'deliverabilityChecks');
        if (!allowed) return;
      }

      const { subject, preview, body, industry } = req.body;
      const result = await predictEngagement(subject, preview, body, industry);
      res.json(result);
    } catch (error) {
      console.error('Engagement prediction error:', error);
      res.status(500).json({ error: 'Failed to predict engagement' });
    }
  });

  app.post('/api/insights/benchmark', optionalAuth, async (req: any, res) => {
    try {
      if (req.user) {
        const allowed = await checkAndIncrementUsage(req, res, 'deliverabilityChecks');
        if (!allowed) return;
      }

      const { emailContent, subject, industry, overallScore } = req.body;
      const result = await compareToIndustry(emailContent, subject, industry, overallScore);
      res.json(result);
    } catch (error) {
      console.error('Industry benchmark error:', error);
      res.status(500).json({ error: 'Failed to compare to industry benchmarks' });
    }
  });

  app.post('/api/insights/reputation', optionalAuth, async (req: any, res) => {
    try {
      if (req.user) {
        const allowed = await checkAndIncrementUsage(req, res, 'deliverabilityChecks');
        if (!allowed) return;
      }

      const { emailContent, domain } = req.body;
      const result = await analyzeReputation(emailContent, domain);
      res.json(result);
    } catch (error) {
      console.error('Reputation analysis error:', error);
      res.status(500).json({ error: 'Failed to analyze reputation' });
    }
  });

  // ESP Integration Routes
  app.get('/api/esp/connections', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const connections = await storage.getESPConnections(userId);
      res.json(connections);
    } catch (error) {
      console.error('Get ESP connections error:', error);
      res.status(500).json({ error: 'Failed to fetch ESP connections' });
    }
  });

  app.post('/api/esp/connect', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const validated = connectESPRequestSchema.safeParse(req.body);
      
      if (!validated.success) {
        return res.status(400).json({ error: validated.error.errors[0]?.message || 'Invalid request' });
      }

      const { provider, apiKey, apiUrl, appId } = validated.data;
      
      const credentials: ESPCredentials = { apiKey, apiUrl, appId };
      const accountInfo = await validateESPConnection(provider, credentials);
      
      if (!accountInfo.isValid) {
        return res.status(400).json({ error: accountInfo.error || 'Invalid credentials' });
      }

      const connection = await storage.upsertESPConnection({
        userId,
        provider,
        apiKey,
        apiUrl,
        appId,
        accountName: accountInfo.accountName,
        accountEmail: accountInfo.accountEmail,
        isConnected: true,
        lastSyncAt: new Date(),
      });

      res.json({ success: true, connection, accountInfo });
    } catch (error) {
      console.error('ESP connect error:', error);
      res.status(500).json({ error: 'Failed to connect to ESP provider' });
    }
  });

  app.delete('/api/esp/disconnect/:provider', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const providerValidation = espProviderSchema.safeParse(req.params.provider);
      
      if (!providerValidation.success) {
        return res.status(400).json({ error: 'Invalid provider' });
      }

      await storage.deleteESPConnection(userId, providerValidation.data);
      res.json({ success: true });
    } catch (error) {
      console.error('ESP disconnect error:', error);
      res.status(500).json({ error: 'Failed to disconnect from ESP provider' });
    }
  });

  app.post('/api/esp/test/:provider', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const providerValidation = espProviderSchema.safeParse(req.params.provider);
      
      if (!providerValidation.success) {
        return res.status(400).json({ error: 'Invalid provider' });
      }

      const connection = await storage.getESPConnection(userId, providerValidation.data);
      if (!connection) {
        return res.status(404).json({ error: 'ESP connection not found' });
      }

      const credentials: ESPCredentials = {
        apiKey: connection.apiKey || undefined,
        apiUrl: connection.apiUrl || undefined,
        appId: connection.appId || undefined,
      };
      
      const accountInfo = await validateESPConnection(providerValidation.data, credentials);
      
      if (accountInfo.isValid) {
        await storage.upsertESPConnection({
          ...connection,
          isConnected: true,
          lastSyncAt: new Date(),
        });
      }

      res.json({ success: accountInfo.isValid, accountInfo });
    } catch (error) {
      console.error('ESP test connection error:', error);
      res.status(500).json({ error: 'Failed to test ESP connection' });
    }
  });

  app.get('/api/esp/stats/:provider', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const providerValidation = espProviderSchema.safeParse(req.params.provider);
      
      if (!providerValidation.success) {
        return res.status(400).json({ error: 'Invalid provider' });
      }

      const connection = await storage.getESPConnection(userId, providerValidation.data);
      if (!connection || !connection.isConnected) {
        return res.status(404).json({ error: 'ESP connection not found or not active' });
      }

      const credentials: ESPCredentials = {
        apiKey: connection.apiKey || undefined,
        apiUrl: connection.apiUrl || undefined,
        appId: connection.appId || undefined,
      };

      const limit = parseInt(req.query.limit as string) || 10;
      const stats = await fetchESPStats(providerValidation.data, credentials, limit);
      
      await storage.upsertESPConnection({
        ...connection,
        lastSyncAt: new Date(),
      });

      res.json(stats);
    } catch (error) {
      console.error('ESP stats error:', error);
      res.status(500).json({ error: 'Failed to fetch ESP stats' });
    }
  });

  app.get('/api/esp/stats', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const connections = await storage.getESPConnections(userId);
      const activeConnections = connections.filter(c => c.isConnected);

      if (activeConnections.length === 0) {
        return res.json({ providers: [], combinedStats: null });
      }

      const limit = parseInt(req.query.limit as string) || 10;
      const allStats = await Promise.all(
        activeConnections.map(async (connection) => {
          try {
            const credentials: ESPCredentials = {
              apiKey: connection.apiKey || undefined,
              apiUrl: connection.apiUrl || undefined,
              appId: connection.appId || undefined,
            };
            const stats = await fetchESPStats(connection.provider as any, credentials, limit);
            return { provider: connection.provider, stats, error: null };
          } catch (error: any) {
            return { provider: connection.provider, stats: null, error: error.message };
          }
        })
      );

      const successfulStats = allStats.filter(s => s.stats !== null);
      
      let combinedStats = null;
      if (successfulStats.length > 0) {
        const allCampaigns = successfulStats.flatMap(s => s.stats!.campaigns);
        const totals = {
          totalCampaigns: allCampaigns.length,
          totalSent: allCampaigns.reduce((sum, c) => sum + c.totalSent, 0),
          totalDelivered: allCampaigns.reduce((sum, c) => sum + c.delivered, 0),
          totalOpened: allCampaigns.reduce((sum, c) => sum + c.opened, 0),
          totalClicked: allCampaigns.reduce((sum, c) => sum + c.clicked, 0),
          avgOpenRate: allCampaigns.length > 0 ? allCampaigns.reduce((sum, c) => sum + c.openRate, 0) / allCampaigns.length : 0,
          avgClickRate: allCampaigns.length > 0 ? allCampaigns.reduce((sum, c) => sum + c.clickRate, 0) / allCampaigns.length : 0,
          avgBounceRate: allCampaigns.length > 0 ? allCampaigns.reduce((sum, c) => sum + c.bounceRate, 0) / allCampaigns.length : 0,
        };
        combinedStats = { campaigns: allCampaigns, totals };
      }

      res.json({ providers: allStats, combinedStats });
    } catch (error) {
      console.error('ESP combined stats error:', error);
      res.status(500).json({ error: 'Failed to fetch combined ESP stats' });
    }
  });

  app.post('/api/esp/analyze', isAuthenticated, async (req: any, res) => {
    try {
      const validation = espStatsAnalysisRequestSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ 
          error: 'Invalid stats data provided',
          details: validation.error.flatten()
        });
      }

      const { analyzeESPStats } = await import('./gemini');
      const normalizedStats = {
        ...validation.data.stats,
        totalDelivered: validation.data.stats.totalDelivered ?? 0,
        totalOpened: validation.data.stats.totalOpened ?? 0,
        totalClicked: validation.data.stats.totalClicked ?? 0,
      };
      const analysis = await analyzeESPStats(normalizedStats);
      
      if (!analysis || typeof analysis.healthScore !== 'number') {
        return res.status(500).json({ error: 'AI analysis returned invalid response' });
      }
      
      res.json(analysis);
    } catch (error: any) {
      console.error('ESP stats analysis error:', error);
      res.status(500).json({ 
        error: 'Failed to analyze ESP stats',
        message: error.message || 'Unknown error occurred'
      });
    }
  });

  app.post('/api/esp/send', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { provider, to, subject, html, from, fromName, replyTo } = req.body;

      const providerValidation = espProviderSchema.safeParse(provider);
      if (!providerValidation.success) {
        return res.status(400).json({ error: 'Invalid provider' });
      }

      const connection = await storage.getESPConnection(userId, providerValidation.data);
      if (!connection || !connection.isConnected) {
        return res.status(404).json({ error: 'ESP connection not found or not active' });
      }

      const credentials: ESPCredentials = {
        apiKey: connection.apiKey || undefined,
        apiUrl: connection.apiUrl || undefined,
        appId: connection.appId || undefined,
      };

      const result = await sendEmailViaESP(providerValidation.data, credentials, {
        to,
        subject,
        html,
        from,
        fromName,
        replyTo,
      });

      res.json(result);
    } catch (error) {
      console.error('ESP send error:', error);
      res.status(500).json({ error: 'Failed to send email via ESP' });
    }
  });

  // Contact form endpoint
  app.post('/api/contact', async (req, res) => {
    try {
      const validation = insertContactMessageSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ 
          message: 'Invalid input', 
          errors: validation.error.errors 
        });
      }

      const message = await storage.createContactMessage(validation.data);
      res.json({ success: true, id: message.id });
    } catch (error) {
      console.error('Contact form error:', error);
      res.status(500).json({ message: 'Failed to send message' });
    }
  });

  // Admin endpoint to view contact messages
  app.get('/api/admin/contact-messages', isAdmin, async (req, res) => {
    try {
      const messages = await storage.getContactMessages();
      res.json(messages);
    } catch (error) {
      console.error('Get contact messages error:', error);
      res.status(500).json({ message: 'Failed to fetch messages' });
    }
  });

  // Admin action: Trigger password reset for a user
  app.post('/api/admin/users/:id/reset-password', isAdmin, async (req: any, res) => {
    try {
      const { id } = req.params;
      const user = await storage.getUser(id);
      
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      if (!user.passwordHash) {
        return res.status(400).json({ message: 'User uses OAuth authentication, cannot reset password' });
      }
      
      // Generate secure token
      const crypto = await import('crypto');
      const token = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
      
      await storage.createPasswordResetToken(user.id, token, expiresAt);
      
      const resetUrl = `${getBaseUrl(req)}/reset-password?token=${token}`;
      console.log(`Admin triggered password reset for ${user.email}: ${resetUrl}`);
      
      // Send password reset email to user
      if (user.email) {
        sendPasswordResetEmail(user.email, resetUrl).catch(err => console.error('Admin reset email failed:', err));
      }
      
      res.json({ 
        success: true, 
        message: 'Password reset link generated and sent to user',
        resetUrl // Include URL for admin to share as backup
      });
    } catch (error) {
      console.error('Admin password reset error:', error);
      res.status(500).json({ message: 'Failed to generate password reset' });
    }
  });

  // Admin action: Deactivate user account
  app.post('/api/admin/users/:id/deactivate', isAdmin, async (req: any, res) => {
    try {
      const { id } = req.params;
      const adminId = req.user.claims.sub;
      
      // Prevent self-deactivation
      if (id === adminId) {
        return res.status(400).json({ message: 'Cannot deactivate your own account' });
      }
      
      const user = await storage.getUser(id);
      
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      if (user.role === 'admin') {
        return res.status(400).json({ message: 'Cannot deactivate admin accounts' });
      }
      
      await storage.updateUser(id, { subscriptionStatus: 'inactive' });
      
      // Send notification email if user has email
      if (user.email) {
        sendAccountDeactivatedEmail(user.email).catch(err => console.error('Deactivation email failed:', err));
      }
      
      res.json({ success: true, message: 'User account deactivated' });
    } catch (error) {
      console.error('Admin deactivate user error:', error);
      res.status(500).json({ message: 'Failed to deactivate user' });
    }
  });

  // Admin action: Reactivate user account
  app.post('/api/admin/users/:id/reactivate', isAdmin, async (req: any, res) => {
    try {
      const { id } = req.params;
      const user = await storage.getUser(id);
      
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      await storage.updateUser(id, { subscriptionStatus: 'active' });
      
      res.json({ success: true, message: 'User account reactivated' });
    } catch (error) {
      console.error('Admin reactivate user error:', error);
      res.status(500).json({ message: 'Failed to reactivate user' });
    }
  });

  // Admin action: Get notes for a user
  app.get('/api/admin/users/:id/notes', isAdmin, async (req: any, res) => {
    try {
      const { id } = req.params;
      const notes = await storage.getAdminNotes(id);
      res.json(notes);
    } catch (error) {
      console.error('Get admin notes error:', error);
      res.status(500).json({ message: 'Failed to fetch notes' });
    }
  });

  // Admin action: Add note to a user
  app.post('/api/admin/users/:id/notes', isAdmin, async (req: any, res) => {
    try {
      const { id } = req.params;
      const { note } = req.body;
      const adminId = req.user.claims.sub;
      
      if (!note || typeof note !== 'string' || note.trim().length === 0) {
        return res.status(400).json({ message: 'Note content is required' });
      }
      
      const user = await storage.getUser(id);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      const created = await storage.createAdminNote({
        userId: id,
        adminId,
        note: note.trim(),
      });
      
      res.json(created);
    } catch (error) {
      console.error('Create admin note error:', error);
      res.status(500).json({ message: 'Failed to create note' });
    }
  });

  // Admin action: Export users as CSV
  app.get('/api/admin/users/export/csv', isAdmin, async (req: any, res) => {
    try {
      const usersWithUsage = await storage.getAllUsersWithUsage();
      
      // Build CSV content
      const headers = [
        'ID',
        'Email',
        'First Name',
        'Last Name',
        'Role',
        'Subscription Tier',
        'Subscription Status',
        'Total Grades',
        'Total Rewrites',
        'Total Followups',
        'Last Login',
        'Last Active',
        'Created At'
      ].join(',');
      
      const rows = usersWithUsage.map(user => {
        const escapeCsv = (val: any) => {
          if (val === null || val === undefined) return '';
          const str = String(val);
          if (str.includes(',') || str.includes('"') || str.includes('\n')) {
            return `"${str.replace(/"/g, '""')}"`;
          }
          return str;
        };
        
        return [
          escapeCsv(user.id),
          escapeCsv(user.email),
          escapeCsv(user.firstName),
          escapeCsv(user.lastName),
          escapeCsv(user.role),
          escapeCsv(user.subscriptionTier),
          escapeCsv(user.subscriptionStatus),
          escapeCsv(user.totalGrades),
          escapeCsv(user.totalRewrites),
          escapeCsv(user.totalFollowups),
          escapeCsv(user.lastLoginAt ? new Date(user.lastLoginAt).toISOString() : ''),
          escapeCsv(user.lastActiveDate),
          escapeCsv(user.createdAt ? new Date(user.createdAt).toISOString() : '')
        ].join(',');
      });
      
      const csv = [headers, ...rows].join('\n');
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="users-export-${new Date().toISOString().split('T')[0]}.csv"`);
      res.send(csv);
    } catch (error) {
      console.error('CSV export error:', error);
      res.status(500).json({ message: 'Failed to export users' });
    }
  });

  // WebSocket Chat Support
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  interface ChatClient {
    ws: WebSocket;
    id: string;
    name: string;
    isSupport: boolean;
    connectedAt: Date;
  }
  
  const clients = new Map<string, ChatClient>();
  const supportQueue: string[] = [];
  
  wss.on('connection', (ws) => {
    const clientId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const client: ChatClient = {
      ws,
      id: clientId,
      name: 'Guest',
      isSupport: false,
      connectedAt: new Date()
    };
    
    clients.set(clientId, client);
    
    // Send welcome message
    ws.send(JSON.stringify({
      type: 'system',
      message: 'Welcome to Acceptafy Support! How can we help you today?',
      timestamp: new Date().toISOString(),
      clientId
    }));
    
    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data.toString());
        
        switch (message.type) {
          case 'chat':
            // Broadcast to all connected clients (in a real app, you'd route to specific support agents)
            const chatMessage = {
              type: 'chat',
              clientId,
              name: client.name,
              message: message.content,
              timestamp: new Date().toISOString()
            };
            
            // Send to all other clients
            clients.forEach((c) => {
              if (c.ws.readyState === WebSocket.OPEN) {
                c.ws.send(JSON.stringify(chatMessage));
              }
            });
            
            // Auto-response for demo (simulate support agent)
            setTimeout(() => {
              if (ws.readyState === WebSocket.OPEN) {
                const autoResponse = generateAutoResponse(message.content);
                ws.send(JSON.stringify({
                  type: 'chat',
                  clientId: 'support',
                  name: 'Support Team',
                  message: autoResponse,
                  timestamp: new Date().toISOString(),
                  isSupport: true
                }));
              }
            }, 1000 + Math.random() * 2000);
            break;
            
          case 'setName':
            client.name = message.name || 'Guest';
            break;
            
          case 'typing':
            // Broadcast typing indicator
            clients.forEach((c) => {
              if (c.id !== clientId && c.ws.readyState === WebSocket.OPEN) {
                c.ws.send(JSON.stringify({
                  type: 'typing',
                  clientId,
                  name: client.name,
                  isTyping: message.isTyping
                }));
              }
            });
            break;
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
      }
    });
    
    ws.on('close', () => {
      clients.delete(clientId);
    });
    
    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
      clients.delete(clientId);
    });
  });
  
  function generateAutoResponse(userMessage: string): string {
    const lowerMessage = userMessage.toLowerCase();
    
    if (lowerMessage.includes('pricing') || lowerMessage.includes('cost') || lowerMessage.includes('plan')) {
      return "Great question! We offer three plans: Starter (free), Pro ($19/month), and Scale ($49/month). Each plan comes with different limits for grading, rewrites, and deliverability checks. Would you like me to explain the differences?";
    }
    
    if (lowerMessage.includes('help') || lowerMessage.includes('how')) {
      return "I'd be happy to help! Our platform helps you optimize your email campaigns with AI-powered grading, rewriting tools, and deliverability analysis. What specific feature would you like to learn more about?";
    }
    
    if (lowerMessage.includes('grade') || lowerMessage.includes('score')) {
      return "Our Email Grader analyzes your subject lines, preview text, and body copy. It checks for spam triggers, readability, and overall effectiveness. Just paste your email content in the Grader section and click 'Analyze' to get your score!";
    }
    
    if (lowerMessage.includes('deliverability') || lowerMessage.includes('spam')) {
      return "Deliverability is crucial! We offer tools to check your domain health, generate DNS records (SPF, DKIM, DMARC), and analyze your sender reputation. Head to the Deliverability section in the sidebar to get started.";
    }
    
    if (lowerMessage.includes('thanks') || lowerMessage.includes('thank you')) {
      return "You're welcome! Is there anything else I can help you with today?";
    }
    
    if (lowerMessage.includes('bye') || lowerMessage.includes('goodbye')) {
      return "Thanks for chatting with us! Feel free to reach out anytime you have questions. Have a great day!";
    }
    
    return "Thanks for your message! Our team is here to help with any questions about email marketing, deliverability, or using our platform. What would you like to know more about?";
  }

  return httpServer;
}
