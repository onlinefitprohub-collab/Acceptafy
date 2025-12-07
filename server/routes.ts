import type { Express } from "express";
import { type Server } from "http";
import bcrypt from "bcrypt";
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
  simulateInboxPlacement
} from "./gemini";
import { insertEmailTemplateSchema } from "@shared/schema";
import { SUBSCRIPTION_LIMITS } from "@shared/schema";
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

function normalizeTier(tier: string | null | undefined): 'starter' | 'pro' | 'scale' {
  if (!tier || tier === 'free') return 'starter';
  if (tier === 'pro' || tier === 'scale') return tier;
  return 'starter';
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
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
          subscriptionStatus: user.subscriptionStatus
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

  return httpServer;
}
