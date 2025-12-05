import type { Express } from "express";
import { type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated, optionalAuth } from "./replitAuth";
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
  analyzeSentiment
} from "./gemini";
import { 
  generateVariationsRequestSchema,
  generateToneRewriteRequestSchema,
  generatePreviewRequestSchema,
  gradingResultSchema
} from "@shared/schema";
import { z } from "zod";

const generateRoadmapRequestSchema = z.object({
  analysisResult: gradingResultSchema,
  subject: z.string().default(''),
  body: z.string().default(''),
});

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  await setupAuth(app);

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
      
      if (!user?.stripeSubscriptionId) {
        return res.json({ 
          subscription: null, 
          tier: user?.subscriptionTier || 'free',
          status: user?.subscriptionStatus || 'free'
        });
      }

      const subscription = await storage.getSubscription(user.stripeSubscriptionId);
      res.json({ 
        subscription, 
        tier: user.subscriptionTier,
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

      const tier = (user?.subscriptionTier || 'starter') as 'starter' | 'pro' | 'scale';
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

      const { body, variations } = req.body;
      const result = await gradeCopy(body, variations);

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

      res.json(result);
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

  app.post('/api/spam/check', async (req, res) => {
    try {
      const { text, subject, previewText } = req.body;
      if (!text || typeof text !== 'string') {
        return res.status(400).json({ error: 'Email text is required' });
      }
      const result = await checkSpamTriggers(text, subject, previewText);
      res.json(result);
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

  return httpServer;
}
