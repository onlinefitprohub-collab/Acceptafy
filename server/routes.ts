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
  analyzeReputation,
  generateSEOSuggestions,
  generateFullArticle,
  generateArticleImage,
  analyzeCampaignRisk,
  generateContent
} from "./gemini";
import { registerObjectStorageRoutes, objectStorageClient } from "./replit_integrations/object_storage";
import { randomUUID } from "crypto";
import { insertEmailTemplateSchema, insertContactMessageSchema } from "@shared/schema";
import { SUBSCRIPTION_LIMITS, connectESPRequestSchema, espProviderSchema } from "@shared/schema";
import { validateESPConnection, fetchESPStats, sendEmailViaESP, type ESPCredentials } from "./services/esp";
import { sendWelcomeEmail, sendPasswordResetEmail, sendAccountDeactivatedEmail, sendEmailVerification, sendAdminNewSignupNotification, sendStarterMonthlyResetEmail } from "./services/email";
import { sendOnboardingEmail, sendBlogAnnouncement } from "./emailService";
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

// Validation schemas for security-sensitive endpoints
const gamificationUpdateSchema = z.object({
  xp: z.number().int().min(0).optional(),
  level: z.number().int().min(1).optional(),
  streak: z.number().int().min(0).optional(),
  lastActiveDate: z.string().optional(),
  achievements: z.array(z.object({
    id: z.string(),
    unlocked: z.boolean(),
    unlockedAt: z.string().optional(),
  })).optional(),
  totalGrades: z.number().int().min(0).optional(),
  totalRewrites: z.number().int().min(0).optional(),
  totalFollowups: z.number().int().min(0).optional(),
  totalDeliverabilityChecks: z.number().int().min(0).optional(),
  bestScore: z.number().min(0).max(100).optional(),
  perfectScoreCount: z.number().int().min(0).optional(),
  aPlusCount: z.number().int().min(0).optional(),
});

const metricTypeSchema = z.enum(['number', 'percentage']).nullable().optional();

const manualCampaignStatsSchema = z.object({
  campaignName: z.string().min(1).max(200),
  totalSent: z.number().min(0).nullable().optional(),
  delivered: z.number().min(0).nullable().optional(),
  deliveredType: metricTypeSchema,
  opened: z.number().min(0).nullable().optional(),
  openedType: metricTypeSchema,
  clicked: z.number().min(0).nullable().optional(),
  clickedType: metricTypeSchema,
  softBounced: z.number().min(0).nullable().optional(),
  softBouncedType: metricTypeSchema,
  hardBounced: z.number().min(0).nullable().optional(),
  hardBouncedType: metricTypeSchema,
  bounced: z.number().min(0).nullable().optional(),
  unsubscribed: z.number().min(0).nullable().optional(),
  unsubscribedType: metricTypeSchema,
  spam: z.number().min(0).nullable().optional(),
  spamType: metricTypeSchema,
  complaints: z.number().min(0).nullable().optional(),
  openRate: z.number().min(0).max(100).nullable().optional(),
  clickRate: z.number().min(0).max(100).nullable().optional(),
  bounceRate: z.number().min(0).max(100).nullable().optional(),
});

const adminNoteSchema = z.object({
  note: z.string().min(1).max(5000),
});

// AI endpoint validation schemas
const imageDataSchema = z.object({
  src: z.string(),
  width: z.number().optional(),
  height: z.number().optional(),
  alt: z.string().optional(),
  sizeKB: z.number().optional(),
});

const gradeRequestSchema = z.object({
  body: z.string().min(1, 'Email body is required').max(50000, 'Email body too long'),
  variations: z.array(z.object({
    subject: z.string().max(500).optional(),
    previewText: z.string().max(500).optional(),
  })).optional(),
  industry: z.string().max(100).optional(),
  emailType: z.string().max(100).optional(),
  images: z.array(imageDataSchema).max(10).optional(),
});

const rewriteRequestSchema = z.object({
  body: z.string().min(1, 'Email body is required').max(50000, 'Email body too long'),
  subject: z.string().max(500).optional(),
  preview: z.string().max(500).optional(),
  goal: z.string().max(1000).optional(),
});

const followupRequestSchema = z.object({
  original: z.string().min(1, 'Original email is required').max(50000),
  analysis: z.any().optional(),
  goal: z.string().max(100).optional(),
  context: z.string().max(2000).optional(),
});

const sequenceRequestSchema = z.object({
  original: z.string().min(1, 'Original email is required').max(50000),
  analysis: z.any().optional(),
  goal: z.string().max(100).optional(),
  context: z.string().min(1, 'Goal description is required').max(2000),
});

const domainRequestSchema = z.object({
  domain: z.string().min(1, 'Domain is required').max(255).regex(/^[a-zA-Z0-9][a-zA-Z0-9-_.]*\.[a-zA-Z]{2,}$/, 'Invalid domain format'),
});

const spamCheckRequestSchema = z.object({
  text: z.string().min(1, 'Text is required').max(50000),
});

const competitorAnalyzeRequestSchema = z.object({
  competitorEmail: z.string().min(1, 'Competitor email is required').max(50000),
  userEmail: z.string().max(50000).optional(),
});

// Rate limiting for security-critical endpoints
interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

function getClientIp(req: any): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    return (typeof forwarded === 'string' ? forwarded : forwarded[0]).split(',')[0].trim();
  }
  return req.ip || req.connection?.remoteAddress || 'unknown';
}

function createRateLimiter(maxRequests: number, windowMs: number) {
  return (req: any, res: any, next: any) => {
    const key = `${req.path}:${getClientIp(req)}`;
    const now = Date.now();
    const entry = rateLimitStore.get(key);

    if (!entry || now > entry.resetAt) {
      rateLimitStore.set(key, { count: 1, resetAt: now + windowMs });
      return next();
    }

    if (entry.count >= maxRequests) {
      const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
      res.setHeader('Retry-After', retryAfter);
      return res.status(429).json({ 
        message: 'Too many requests. Please try again later.',
        retryAfter 
      });
    }

    entry.count++;
    return next();
  };
}

// Rate limiters for different endpoint types
const authRateLimiter = createRateLimiter(5, 15 * 60 * 1000); // 5 attempts per 15 min
const passwordResetRateLimiter = createRateLimiter(3, 60 * 60 * 1000); // 3 attempts per hour
const aiRateLimiter = createRateLimiter(30, 60 * 1000); // 30 requests per minute
const contactRateLimiter = createRateLimiter(5, 60 * 60 * 1000); // 5 messages per hour

// Clean up old rate limit entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore) {
    if (now > entry.resetAt) {
      rateLimitStore.delete(key);
    }
  }
}, 5 * 60 * 1000); // Clean every 5 minutes

const espStatsAnalysisRequestSchema = z.object({
  stats: z.object({
    totalCampaigns: z.number().min(0),
    totalSent: z.number().min(0),
    totalDelivered: z.number().min(0).optional(),
    totalOpened: z.number().min(0).optional(),
    totalClicked: z.number().min(0).optional(),
    totalSkipped: z.number().min(0).optional(),
    totalBounced: z.number().min(0).optional(),
    totalSoftBounced: z.number().min(0).optional(),
    totalHardBounced: z.number().min(0).optional(),
    totalUnsubscribed: z.number().min(0).optional(),
    totalSpamReports: z.number().min(0).optional(),
    totalForwards: z.number().min(0).optional(),
    totalRevenue: z.number().min(0).optional(),
    avgOpenRate: z.number().min(0).max(100),
    avgClickRate: z.number().min(0).max(100),
    avgBounceRate: z.number().min(0).max(100),
    avgSkipRate: z.number().min(0).max(100).optional(),
    avgSoftBounceRate: z.number().min(0).max(100).optional(),
    avgHardBounceRate: z.number().min(0).max(100).optional(),
    avgUnsubscribeRate: z.number().min(0).max(100).optional(),
    avgSpamRate: z.number().min(0).max(100).optional(),
    avgForwardRate: z.number().min(0).max(100).optional(),
    avgRevenuePerEmail: z.number().min(0).optional(),
    avgTimeToOpen: z.number().min(0).optional(),
    clickToOpenRate: z.number().min(0).max(100).optional(),
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

type FeatureKey = 'campaignRiskAnalysis' | 'competitorAnalysis' | 'inboxSimulation' | 'funnelAnalysis' | 'sequenceGenerator' | 'warmupPlan' | 'advancedSpamAnalysis';

async function checkFeatureAccess(req: any, res: any, feature: FeatureKey): Promise<boolean> {
  if (!req.user) {
    res.status(403).json({ 
      error: 'Pro feature', 
      message: 'This feature requires a Pro or Scale subscription. Please sign in and upgrade to access.',
      requiredTier: 'pro',
      feature 
    });
    return false;
  }
  
  const userId = req.user.claims.sub;
  const user = await storage.getUser(userId);
  const tier = normalizeTier(user?.subscriptionTier);
  const limits = SUBSCRIPTION_LIMITS[tier];
  
  if (!limits[feature]) {
    res.status(403).json({ 
      error: 'Pro feature', 
      message: `This feature is only available on Pro and Scale plans. Upgrade to unlock ${feature.replace(/([A-Z])/g, ' $1').toLowerCase()}.`,
      requiredTier: 'pro',
      currentTier: tier,
      feature 
    });
    return false;
  }
  
  return true;
}

interface NormalizedManualCampaign {
  campaignId: string;
  campaignName: string;
  subject?: string;
  sentAt?: string;
  totalSent: number;
  delivered: number;
  opened: number;
  clicked: number;
  bounced: number;
  softBounced?: number;
  hardBounced?: number;
  unsubscribed: number;
  spamReports: number;
  forwards?: number;
  revenue?: number;
  avgTimeToOpen?: number;
  openRate: number;
  clickRate: number;
  bounceRate: number;
  softBounceRate?: number;
  hardBounceRate?: number;
  unsubscribeRate: number;
  spamRate?: number;
  forwardRate?: number;
  revenuePerEmail?: number;
  clickToOpenRate?: number;
  isManual: boolean;
}

function normalizeManualCampaignStats(manual: any): NormalizedManualCampaign | null {
  const deliveredRaw = manual.delivered || 0;
  const softBouncedRaw = manual.softBounced || 0;
  const hardBouncedRaw = manual.hardBounced || 0;
  
  let totalSent = manual.totalSent || 0;
  if (totalSent === 0) {
    totalSent = deliveredRaw + softBouncedRaw + hardBouncedRaw;
  }
  if (totalSent === 0) return null;

  const convertValue = (value: number | null | undefined, type: string | null | undefined, maxValue: number): number => {
    if (value === null || value === undefined) return 0;
    let result: number;
    if (type === 'percentage') {
      const clampedPercent = Math.min(100, Math.max(0, value));
      result = Math.round((clampedPercent / 100) * totalSent);
    } else {
      result = value;
    }
    return Math.min(Math.max(0, result), maxValue);
  };

  const softBounced = convertValue(manual.softBounced, manual.softBouncedType, totalSent);
  const hardBounced = convertValue(manual.hardBounced, manual.hardBouncedType, totalSent - softBounced);
  const bounced = Math.min(softBounced + hardBounced, totalSent);
  
  const deliveredInput = convertValue(manual.delivered, manual.deliveredType, totalSent);
  const delivered = deliveredInput > 0 
    ? Math.min(deliveredInput, totalSent - bounced)
    : Math.max(0, totalSent - bounced);
  const effectiveDelivered = Math.max(delivered, 1);
  
  const opened = convertValue(manual.opened, manual.openedType, effectiveDelivered);
  const clicked = convertValue(manual.clicked, manual.clickedType, opened > 0 ? opened : effectiveDelivered);
  const unsubscribed = convertValue(manual.unsubscribed, manual.unsubscribedType, effectiveDelivered);
  const spamReports = convertValue(manual.spam, manual.spamType, effectiveDelivered);
  const forwards = manual.forwards || 0;
  const revenue = manual.revenue || 0;
  const avgTimeToOpen = manual.avgTimeToOpen || 0;

  const openRate = effectiveDelivered > 0 ? (opened / effectiveDelivered) * 100 : 0;
  const clickRate = effectiveDelivered > 0 ? (clicked / effectiveDelivered) * 100 : 0;
  const bounceRate = totalSent > 0 ? (bounced / totalSent) * 100 : 0;
  const softBounceRate = totalSent > 0 ? (softBounced / totalSent) * 100 : 0;
  const hardBounceRate = totalSent > 0 ? (hardBounced / totalSent) * 100 : 0;
  const unsubscribeRate = effectiveDelivered > 0 ? (unsubscribed / effectiveDelivered) * 100 : 0;
  const spamRate = effectiveDelivered > 0 ? (spamReports / effectiveDelivered) * 100 : 0;
  const forwardRate = effectiveDelivered > 0 ? (forwards / effectiveDelivered) * 100 : 0;
  const revenuePerEmail = totalSent > 0 ? revenue / totalSent / 100 : 0;
  const clickToOpenRate = opened > 0 ? (clicked / opened) * 100 : 0;

  return {
    campaignId: `manual-${manual.id}`,
    campaignName: manual.campaignName,
    subject: undefined,
    sentAt: manual.createdAt?.toISOString?.() || manual.createdAt,
    totalSent,
    delivered,
    opened,
    clicked,
    bounced,
    softBounced,
    hardBounced,
    unsubscribed,
    spamReports,
    forwards,
    revenue,
    avgTimeToOpen,
    openRate: Math.round(openRate * 100) / 100,
    clickRate: Math.round(clickRate * 100) / 100,
    bounceRate: Math.round(bounceRate * 100) / 100,
    softBounceRate: Math.round(softBounceRate * 100) / 100,
    hardBounceRate: Math.round(hardBounceRate * 100) / 100,
    unsubscribeRate: Math.round(unsubscribeRate * 100) / 100,
    spamRate: Math.round(spamRate * 100) / 100,
    forwardRate: Math.round(forwardRate * 100) / 100,
    revenuePerEmail: Math.round(revenuePerEmail * 100) / 100,
    clickToOpenRate: Math.round(clickToOpenRate * 100) / 100,
    isManual: true,
  };
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // Helper function to get base URL securely (prevents host header injection)
  // Always use acceptafy.com for email links
  function getBaseUrl(req: any): string {
    return 'https://acceptafy.com';
  }

  await setupAuth(app);
  
  // Register object storage routes for image uploads
  registerObjectStorageRoutes(app);

  // Email/Password Login (rate limited to prevent brute force)
  app.post('/api/auth/login', authRateLimiter, async (req, res) => {
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

  // Email/Password Registration (rate limited to prevent spam)
  app.post('/api/auth/register', authRateLimiter, async (req, res) => {
    try {
      const { email, password, firstName, lastName } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
      }

      if (!firstName || !lastName) {
        return res.status(400).json({ message: "First name and last name are required" });
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
      const user = await storage.createUserWithPassword(email, passwordHash, 'user', 'starter', firstName, lastName);

      // Generate email verification token
      const verificationToken = randomUUID();
      const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
      await storage.updateUser(user.id, {
        emailVerificationToken: verificationToken,
        emailVerificationExpires: verificationExpires,
      });

      // Create Stripe customer for the new user (don't block registration if it fails)
      try {
        const stripe = await getUncachableStripeClient();
        const customer = await stripe.customers.create({
          email,
          metadata: { userId: user.id },
        });
        await storage.updateUserStripeInfo(user.id, { stripeCustomerId: customer.id });
      } catch (stripeErr) {
        console.error('Stripe customer creation failed:', stripeErr);
      }

      // Send email verification (don't block registration if email fails)
      // Always use acceptafy.com for email links
      const baseUrl = 'https://acceptafy.com';
      const verifyUrl = `${baseUrl}/verify-email?token=${verificationToken}`;
      sendEmailVerification(email, verifyUrl).catch(err => console.error('Verification email failed:', err));

      // Send admin notification for new signup (don't block registration)
      sendAdminNewSignupNotification(
        user.firstName || '',
        user.lastName || '',
        email
      ).catch(err => console.error('Admin signup notification failed:', err));

      // Send welcome onboarding email (don't block registration)
      sendOnboardingEmail(user.id, 1, 'welcome').catch(err => 
        console.error('Welcome onboarding email failed:', err)
      );

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

  // Update user profile (including address fields)
  const profileUpdateSchema = z.object({
    firstName: z.string().max(100).optional(),
    lastName: z.string().max(100).optional(),
    addressLine1: z.string().max(255).optional(),
    addressLine2: z.string().max(255).optional(),
    city: z.string().max(100).optional(),
    stateProvince: z.string().max(100).optional(),
    postalCode: z.string().max(20).optional(),
    country: z.string().max(100).optional(),
    companyName: z.string().max(200).optional(),
    phone: z.string().max(30).optional(),
  });

  app.patch('/api/user/profile', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      // Validate input with zod
      const parseResult = profileUpdateSchema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({ 
          message: "Invalid profile data", 
          errors: parseResult.error.flatten() 
        });
      }
      
      const validData = parseResult.data;

      // Only update fields that were provided
      const updates: Record<string, string | undefined | null> = {};
      if (validData.firstName !== undefined) updates.firstName = validData.firstName || null;
      if (validData.lastName !== undefined) updates.lastName = validData.lastName || null;
      if (validData.addressLine1 !== undefined) updates.addressLine1 = validData.addressLine1 || null;
      if (validData.addressLine2 !== undefined) updates.addressLine2 = validData.addressLine2 || null;
      if (validData.city !== undefined) updates.city = validData.city || null;
      if (validData.stateProvince !== undefined) updates.stateProvince = validData.stateProvince || null;
      if (validData.postalCode !== undefined) updates.postalCode = validData.postalCode || null;
      if (validData.country !== undefined) updates.country = validData.country || null;
      if (validData.companyName !== undefined) updates.companyName = validData.companyName || null;
      if (validData.phone !== undefined) updates.phone = validData.phone || null;

      if (Object.keys(updates).length === 0) {
        return res.status(400).json({ message: "No fields to update" });
      }

      await storage.updateUser(userId, updates);
      const updatedUser = await storage.getUser(userId);

      res.json({ 
        success: true, 
        message: "Profile updated successfully",
        user: updatedUser 
      });
    } catch (error) {
      console.error("Update profile error:", error);
      res.status(500).json({ message: "Failed to update profile" });
    }
  });

  // Request password reset (rate limited to prevent abuse)
  app.post('/api/auth/forgot-password', passwordResetRateLimiter, async (req, res) => {
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

  // Verify email with token
  app.get('/api/auth/verify-email', async (req, res) => {
    try {
      const { token } = req.query;
      
      if (!token || typeof token !== 'string') {
        return res.status(400).json({ success: false, message: "No token provided" });
      }

      const user = await storage.getUserByVerificationToken(token);
      
      if (!user) {
        return res.status(400).json({ success: false, message: "Invalid verification link" });
      }

      if (user.emailVerified) {
        return res.json({ success: true, message: "Email already verified" });
      }

      if (user.emailVerificationExpires && new Date() > user.emailVerificationExpires) {
        return res.status(400).json({ success: false, message: "Verification link has expired. Please request a new one." });
      }

      // Mark email as verified
      await storage.updateUser(user.id, {
        emailVerified: true,
        emailVerificationToken: null,
        emailVerificationExpires: null,
      });

      // Send welcome email after successful verification
      sendWelcomeEmail(user.email!).catch(err => console.error('Welcome email failed:', err));

      res.json({ success: true, message: "Email verified successfully!" });
    } catch (error) {
      console.error("Email verification error:", error);
      res.status(500).json({ success: false, message: "Failed to verify email" });
    }
  });

  // Resend verification email
  app.post('/api/auth/resend-verification', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);

      if (!user || !user.email) {
        return res.status(404).json({ message: "User not found" });
      }

      if (user.emailVerified) {
        return res.json({ success: true, message: "Email is already verified" });
      }

      // Generate new verification token
      const verificationToken = randomUUID();
      const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
      await storage.updateUser(user.id, {
        emailVerificationToken: verificationToken,
        emailVerificationExpires: verificationExpires,
      });

      // Always use acceptafy.com for email links
      const baseUrl = 'https://acceptafy.com';
      const verifyUrl = `${baseUrl}/verify-email?token=${verificationToken}`;
      
      await sendEmailVerification(user.email, verifyUrl);

      res.json({ success: true, message: "Verification email sent" });
    } catch (error) {
      console.error("Resend verification error:", error);
      res.status(500).json({ message: "Failed to send verification email" });
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

      // Get daily usage as well
      let dailyCounter = await storage.getDailyUsageCounter(userId);
      if (!dailyCounter) {
        dailyCounter = await storage.createDailyUsageCounter(userId);
      }

      const tier = normalizeTier(user?.subscriptionTier);
      const { SUBSCRIPTION_LIMITS } = await import("@shared/schema");
      const limits = SUBSCRIPTION_LIMITS[tier];

      res.json({
        usage: counter,
        dailyUsage: dailyCounter,
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

  // Export user data (GDPR compliance)
  app.get('/api/export-data', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      const analyses = await storage.getEmailAnalyses(userId, 10000);
      const usageCounter = await storage.getUsageCounter(userId);

      const exportData = {
        exportDate: new Date().toISOString(),
        account: {
          id: user?.id,
          email: user?.email,
          firstName: user?.firstName,
          lastName: user?.lastName,
          subscriptionTier: user?.subscriptionTier,
          createdAt: user?.createdAt,
        },
        usage: usageCounter,
        analysisHistory: analyses.map((a: any) => ({
          id: a.id,
          createdAt: a.createdAt,
          body: a.body,
          score: a.score,
          grade: a.grade,
          result: a.result,
        })),
      };

      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="acceptafy-export-${new Date().toISOString().split('T')[0]}.json"`);
      res.json(exportData);
    } catch (error) {
      console.error("Export data error:", error);
      res.status(500).json({ message: "Failed to export data" });
    }
  });

  // Get retention offer (for cancellation flow)
  app.get('/api/retention-offer', isAuthenticated, async (req: any, res) => {
    try {
      const stripe = await getUncachableStripeClient();
      const coupons = await stripe.coupons.list({ limit: 100 });
      const retentionCoupon = coupons.data.find(c => c.metadata?.type === 'retention' || c.name === 'Stay With Us - 50% Off');
      
      if (retentionCoupon) {
        res.json({
          available: true,
          couponId: retentionCoupon.id,
          percentOff: retentionCoupon.percent_off,
          description: retentionCoupon.name,
        });
      } else {
        res.json({ available: false });
      }
    } catch (error) {
      console.error("Retention offer error:", error);
      res.json({ available: false });
    }
  });

  // Apply retention offer to subscription
  app.post('/api/apply-retention-offer', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      const { couponId } = req.body;

      if (!user?.stripeSubscriptionId) {
        return res.status(400).json({ error: 'No active subscription found' });
      }

      const stripe = await getUncachableStripeClient();
      await stripe.subscriptions.update(user.stripeSubscriptionId, {
        discounts: [{ coupon: couponId }],
      });

      res.json({ success: true, message: 'Discount applied to your next billing cycle' });
    } catch (error) {
      console.error("Apply retention offer error:", error);
      res.status(500).json({ message: "Failed to apply offer" });
    }
  });

  // Migrate localStorage history to database
  app.post('/api/history/migrate', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { items } = req.body;
      
      if (!Array.isArray(items) || items.length === 0) {
        return res.json({ migrated: 0 });
      }

      let migrated = 0;
      for (const item of items) {
        try {
          await storage.createEmailAnalysis({
            userId,
            body: item.content?.body || '',
            variations: item.content?.variations || [],
            result: item.result,
            score: item.result?.inboxPlacementScore?.score,
            grade: item.result?.overallGrade?.grade,
          });
          migrated++;
        } catch (err) {
          console.error('Error migrating history item:', err);
        }
      }

      res.json({ migrated });
    } catch (error) {
      console.error("History migration error:", error);
      res.status(500).json({ message: "Failed to migrate history" });
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
          lastActiveDate: null,
          achievements: [],
          totalGrades: 0,
          totalRewrites: 0,
          totalFollowups: 0,
          totalDeliverabilityChecks: 0,
          bestScore: 0,
          perfectScoreCount: 0,
          aPlusCount: 0,
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
      const parseResult = gamificationUpdateSchema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({ message: 'Invalid gamification data', errors: parseResult.error.flatten() });
      }
      const gamification = await storage.upsertUserGamification({
        ...parseResult.data,
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
    
    // Check both daily and monthly limits
    const usageLimits = await storage.checkBothUsageLimits(userId, field);
    
    if (!usageLimits.allowed) {
      if (usageLimits.reason === 'daily') {
        res.status(403).json({ 
          error: 'Daily limit reached',
          message: `You've reached your daily limit of ${usageLimits.daily.limit}. Your daily limit will reset at midnight UTC.`,
          daily: usageLimits.daily,
          monthly: usageLimits.monthly
        });
      } else {
        res.status(403).json({ 
          error: 'Monthly limit reached',
          message: `You've reached your monthly limit of ${usageLimits.monthly.limit}. Upgrade your plan for more.`,
          daily: usageLimits.daily,
          monthly: usageLimits.monthly
        });
      }
      return false;
    }
    
    // Increment both daily and monthly counters
    await storage.incrementBothUsages(userId, field);
    return true;
  }

  app.post('/api/grade', aiRateLimiter, optionalAuth, async (req: any, res) => {
    try {
      const parseResult = gradeRequestSchema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({ error: 'Invalid request', details: parseResult.error.flatten() });
      }

      if (req.user) {
        const allowed = await checkAndIncrementUsage(req, res, 'gradeCount');
        if (!allowed) return;
      }

      const { body, variations, industry, emailType, images } = parseResult.data;
      const normalizedVariations = (variations || []).map(v => ({
        subject: v.subject || '',
        previewText: v.previewText || ''
      }));
      const result = await gradeCopy(body, normalizedVariations, images);

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
          // Save current ranks for ALL users before XP update for leaderboard position tracking
          await storage.updateLeaderboardRanks();
          
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

  app.post('/api/rewrite', aiRateLimiter, optionalAuth, async (req: any, res) => {
    try {
      const parseResult = rewriteRequestSchema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({ error: 'Invalid request', details: parseResult.error.flatten() });
      }

      if (req.user) {
        const allowed = await checkAndIncrementUsage(req, res, 'rewriteCount');
        if (!allowed) return;
      }

      const { body, subject, preview, goal } = parseResult.data;
      const result = await rewriteCopy(body, subject || '', preview || '', goal || '');
      res.json(result);
    } catch (error) {
      console.error('Rewrite error:', error);
      res.status(500).json({ error: 'Failed to rewrite email' });
    }
  });

  app.post('/api/followup', aiRateLimiter, optionalAuth, async (req: any, res) => {
    try {
      const parseResult = followupRequestSchema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({ error: 'Invalid request', details: parseResult.error.flatten() });
      }

      if (req.user) {
        const allowed = await checkAndIncrementUsage(req, res, 'followupCount');
        if (!allowed) return;
      }

      const { original, analysis, goal, context } = parseResult.data;
      const originalEmail = { subject: '', body: original };
      const result = await generateFollowUpEmail(originalEmail, analysis, goal || 'reminder', context);
      res.json(result);
    } catch (error) {
      console.error('Follow-up error:', error);
      res.status(500).json({ error: 'Failed to generate follow-up' });
    }
  });

  // Sequence Generator (Pro+ only)
  app.post('/api/followup/sequence', optionalAuth, async (req: any, res) => {
    try {
      const parseResult = sequenceRequestSchema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({ error: 'Invalid request', details: parseResult.error.flatten() });
      }

      const hasAccess = await checkFeatureAccess(req, res, 'sequenceGenerator');
      if (!hasAccess) return;
      
      if (req.user) {
        const allowed = await checkAndIncrementUsage(req, res, 'followupCount');
        if (!allowed) return;
      }

      const { original, analysis, goal, context } = parseResult.data;
      const originalEmail = { subject: '', body: original };
      // goal = sequence type (nurture, welcome, etc), context = goal description
      const result = await generateFollowUpSequence(originalEmail, analysis, context, goal || 'sequence');
      res.json(result);
    } catch (error) {
      console.error('Sequence error:', error);
      res.status(500).json({ error: 'Failed to generate sequence' });
    }
  });

  app.post('/api/dns/generate', optionalAuth, async (req: any, res) => {
    try {
      const parseResult = domainRequestSchema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({ error: 'Invalid request', details: parseResult.error.flatten() });
      }

      if (req.user) {
        const allowed = await checkAndIncrementUsage(req, res, 'deliverabilityChecks');
        if (!allowed) return;
      }

      const { domain } = parseResult.data;
      const result = await generateDnsRecords(domain);
      res.json(result);
    } catch (error) {
      console.error('DNS generation error:', error);
      res.status(500).json({ error: 'Failed to generate DNS records' });
    }
  });

  app.post('/api/domain/health', optionalAuth, async (req: any, res) => {
    try {
      const parseResult = domainRequestSchema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({ error: 'Invalid request', details: parseResult.error.flatten() });
      }

      if (req.user) {
        const allowed = await checkAndIncrementUsage(req, res, 'deliverabilityChecks');
        if (!allowed) return;
      }

      const { domain } = parseResult.data;
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

  // Warmup Plan Generator (Pro+ only) - Now with real domain analysis
  app.post('/api/warmup/generate', optionalAuth, async (req: any, res) => {
    try {
      const hasAccess = await checkFeatureAccess(req, res, 'warmupPlan');
      if (!hasAccess) return;
      
      if (req.user) {
        const allowed = await checkAndIncrementUsage(req, res, 'deliverabilityChecks');
        if (!allowed) return;
      }

      const { domain } = req.body;
      if (!domain || typeof domain !== 'string') {
        return res.status(400).json({ error: 'Domain is required' });
      }

      // Import DNS checker dynamically to avoid circular deps
      const { analyzeDomain } = await import('./services/dnsChecker');
      const { checkBlacklists } = await import('./services/blacklistChecker');
      
      // Run DNS analysis and blacklist check in parallel
      const [dnsAnalysis, blacklistResult] = await Promise.all([
        analyzeDomain(domain).catch(err => {
          console.warn('DNS analysis failed:', err.message);
          return null;
        }),
        checkBlacklists(domain).catch(err => {
          console.warn('Blacklist check failed:', err.message);
          return null;
        })
      ]);

      // Build domain analysis input for AI
      const analysisInput = dnsAnalysis ? {
        domain: dnsAnalysis.domain,
        overallScore: dnsAnalysis.overallScore,
        overallStatus: dnsAnalysis.overallStatus,
        warmupIntensity: dnsAnalysis.warmupIntensity,
        records: dnsAnalysis.records.map(r => ({
          type: r.type,
          found: r.found,
          status: r.status,
          feedback: r.feedback
        })),
        recommendations: dnsAnalysis.recommendations,
        blacklistStatus: blacklistResult?.status === 'listed' ? 'listed' as const : 'clean' as const,
        blacklistCount: blacklistResult?.listedOn || 0
      } : undefined;

      const result = await generateWarmupPlan(domain, analysisInput);
      
      // Include raw analysis data in response for frontend display
      res.json({
        ...result,
        domainAnalysis: dnsAnalysis || undefined,
        blacklistCheck: blacklistResult ? {
          status: blacklistResult.status,
          listedOn: blacklistResult.listedOn,
          cleanOn: blacklistResult.cleanOn,
          totalChecked: blacklistResult.totalBlacklists
        } : undefined
      });
    } catch (error) {
      console.error('Warmup plan generation error:', error);
      res.status(500).json({ error: 'Failed to generate warmup plan' });
    }
  });

  // Lightweight domain DNS analysis endpoint (no Pro+ required, for Sender Score DNS scan)
  app.post('/api/domain/analyze', async (req, res) => {
    try {
      const { domain } = req.body;
      if (!domain || typeof domain !== 'string') {
        return res.status(400).json({ error: 'Domain is required' });
      }

      const { analyzeDomain } = await import('./services/dnsChecker');
      
      const dnsAnalysis = await analyzeDomain(domain).catch(err => {
        console.warn('DNS analysis failed:', err.message);
        return null;
      });

      if (!dnsAnalysis) {
        return res.status(422).json({ error: 'Could not analyze domain DNS records' });
      }

      res.json({
        domainAnalysis: dnsAnalysis
      });
    } catch (error) {
      console.error('Domain analysis error:', error);
      res.status(500).json({ error: 'Failed to analyze domain' });
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

  // Acceptafy Content Generator - AI-powered content generation
  app.post('/api/content/generate', optionalAuth, async (req: any, res) => {
    try {
      const { contentType, prompt, tone, industry, targetAudience, length } = req.body;
      
      if (!contentType || !['email', 'social', 'blog', 'ad'].includes(contentType)) {
        return res.status(400).json({ error: 'Valid content type is required (email, social, blog, ad)' });
      }
      if (!prompt || typeof prompt !== 'string' || prompt.trim().length < 10) {
        return res.status(400).json({ error: 'Prompt must be at least 10 characters' });
      }
      
      const result = await generateContent({
        contentType,
        prompt: prompt.slice(0, 2000),
        tone: tone?.slice(0, 50),
        industry: industry?.slice(0, 100),
        targetAudience: targetAudience?.slice(0, 200),
        length: ['short', 'medium', 'long'].includes(length) ? length : 'medium'
      });
      
      res.json(result);
    } catch (error) {
      console.error('Content generation error:', error);
      res.status(500).json({ error: 'Failed to generate content' });
    }
  });

  // Content Drafts CRUD
  app.get('/api/content/drafts', isAuthenticated, async (req: any, res) => {
    try {
      const drafts = await storage.getContentDrafts(req.user.id);
      res.json(drafts);
    } catch (error) {
      console.error('Error fetching drafts:', error);
      res.status(500).json({ error: 'Failed to fetch drafts' });
    }
  });

  app.post('/api/content/drafts', isAuthenticated, async (req: any, res) => {
    try {
      const { name, contentType, prompt, generatedContent, editedContent, tone, industry } = req.body;
      
      if (!name || typeof name !== 'string') {
        return res.status(400).json({ error: 'Draft name is required' });
      }
      if (!contentType || typeof contentType !== 'string') {
        return res.status(400).json({ error: 'Content type is required' });
      }
      
      const draft = await storage.createContentDraft({
        userId: req.user.id,
        name: name.slice(0, 200),
        contentType: contentType.slice(0, 50),
        prompt: prompt?.slice(0, 2000),
        generatedContent: generatedContent?.slice(0, 10000),
        editedContent: editedContent?.slice(0, 10000),
        tone: tone?.slice(0, 50),
        industry: industry?.slice(0, 100)
      });
      
      res.json(draft);
    } catch (error) {
      console.error('Error creating draft:', error);
      res.status(500).json({ error: 'Failed to create draft' });
    }
  });

  app.put('/api/content/drafts/:id', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const { name, editedContent, generatedContent } = req.body;
      
      const draft = await storage.updateContentDraft(id, req.user.id, {
        name: name?.slice(0, 200),
        editedContent: editedContent?.slice(0, 10000),
        generatedContent: generatedContent?.slice(0, 10000)
      });
      
      if (!draft) {
        return res.status(404).json({ error: 'Draft not found' });
      }
      
      res.json(draft);
    } catch (error) {
      console.error('Error updating draft:', error);
      res.status(500).json({ error: 'Failed to update draft' });
    }
  });

  app.delete('/api/content/drafts/:id', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const deleted = await storage.deleteContentDraft(id, req.user.id);
      
      if (!deleted) {
        return res.status(404).json({ error: 'Draft not found' });
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting draft:', error);
      res.status(500).json({ error: 'Failed to delete draft' });
    }
  });

  // Campaign Risk Analysis - Pre-send reputation impact prediction (Pro+ only)
  app.post('/api/campaign/risk-analysis', optionalAuth, async (req: any, res) => {
    try {
      const hasAccess = await checkFeatureAccess(req, res, 'campaignRiskAnalysis');
      if (!hasAccess) return;
      
      if (req.user) {
        const allowed = await checkAndIncrementUsage(req, res, 'deliverabilityChecks');
        if (!allowed) return;
      }

      const { subject, content, estimatedVolume, listAge } = req.body;
      
      if (!subject || typeof subject !== 'string') {
        return res.status(400).json({ error: 'Subject line is required' });
      }
      if (!content || typeof content !== 'string') {
        return res.status(400).json({ error: 'Email content is required' });
      }
      
      // Limit content length to prevent very long prompts
      const trimmedContent = content.slice(0, 10000);
      const trimmedSubject = subject.slice(0, 500);
      
      const result = await analyzeCampaignRisk(
        trimmedSubject, 
        trimmedContent, 
        estimatedVolume ? parseInt(estimatedVolume, 10) : undefined,
        typeof listAge === 'string' ? listAge.slice(0, 200) : undefined
      );
      
      // The analyzeCampaignRisk function now always returns a valid response
      // with fallback values if there's an error, so we can return it directly
      res.json(result);
    } catch (error) {
      console.error('Campaign risk analysis error:', error);
      res.status(500).json({ error: 'Failed to analyze campaign risk' });
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

  // Campaign Funnel Analysis (Pro+ only)
  app.post('/api/funnel/analyze', optionalAuth, async (req: any, res) => {
    try {
      const hasAccess = await checkFeatureAccess(req, res, 'funnelAnalysis');
      if (!hasAccess) return;
      
      const { campaign, stages, dropOffAnalysis } = req.body;
      
      if (!campaign || !stages || !dropOffAnalysis) {
        return res.status(400).json({ error: 'Campaign data, stages, and drop-off analysis are required' });
      }
      
      const { GoogleGenAI } = await import('@google/genai');
      const ai = new GoogleGenAI({ apiKey: process.env.AI_INTEGRATIONS_GOOGLE_GEMINI_API_KEY });
      
      const prompt = `You are an email marketing expert. Analyze this campaign funnel data and provide actionable recommendations.

Campaign: ${campaign.name}
Subject: ${campaign.subject}

Funnel Metrics:
- Sent: ${campaign.sent}
- Delivered: ${campaign.delivered} (${((campaign.delivered / campaign.sent) * 100).toFixed(1)}% delivery rate)
- Opened: ${campaign.opened} (${((campaign.opened / campaign.delivered) * 100).toFixed(1)}% open rate)
- Clicked: ${campaign.clicked} (${((campaign.clicked / campaign.opened) * 100).toFixed(1)}% click rate)

Drop-off Analysis:
${dropOffAnalysis.map((d: any) => `- ${d.stage}: ${d.dropOffRate.toFixed(1)}% drop-off (${d.severity} severity)`).join('\n')}

Provide 3-4 specific, actionable recommendations to improve this campaign's funnel performance. For each recommendation, identify:
1. The stage it addresses (Sent → Delivered, Delivered → Opened, or Opened → Clicked)
2. The specific issue identified
3. A detailed, actionable recommendation
4. The expected impact (high, medium, or low)

Return your response as a JSON object with this exact structure:
{
  "recommendations": [
    {
      "stage": "Stage name",
      "issue": "Brief description of the problem",
      "recommendation": "Detailed actionable recommendation",
      "impact": "high" | "medium" | "low"
    }
  ],
  "overallAssessment": "Brief overall assessment of the campaign",
  "priorityAction": "The single most important action to take"
}`;

      try {
        const response = await ai.models.generateContent({
          model: 'gemini-2.0-flash-001',
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
        });
        
        const text = response.text ?? '';
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        
        if (jsonMatch) {
          const result = JSON.parse(jsonMatch[0]);
          return res.json(result);
        }
      } catch (aiError) {
        console.error('AI analysis error:', aiError);
      }
      
      // Fallback recommendations based on the data
      const recommendations = [];
      
      const deliveryRate = campaign.sent > 0 ? (campaign.delivered / campaign.sent) * 100 : 0;
      const openRate = campaign.delivered > 0 ? (campaign.opened / campaign.delivered) * 100 : 0;
      const clickRate = campaign.opened > 0 ? (campaign.clicked / campaign.opened) * 100 : 0;
      
      if (deliveryRate < 97) {
        recommendations.push({
          stage: 'Sent → Delivered',
          issue: `Low delivery rate (${deliveryRate.toFixed(1)}%)`,
          recommendation: 'Clean your email list to remove invalid addresses. Verify SPF, DKIM, and DMARC records are properly configured. Consider using a dedicated IP with good reputation.',
          impact: 'high'
        });
      }
      
      // Industry average open rate is ~20%
      if (openRate < 15) {
        recommendations.push({
          stage: 'Delivered → Opened',
          issue: `Open rate below industry average (${openRate.toFixed(1)}% vs ~20% average)`,
          recommendation: 'A/B test subject lines with different approaches: curiosity-driven, benefit-focused, or personalized. Optimize send timing based on your audience\'s engagement patterns.',
          impact: 'high'
        });
      } else if (openRate < 20) {
        recommendations.push({
          stage: 'Delivered → Opened',
          issue: `Open rate near industry average (${openRate.toFixed(1)}%)`,
          recommendation: 'Your open rate is close to industry standards. Consider A/B testing subject lines and send times to push above 20%.',
          impact: 'medium'
        });
      }
      
      if (clickRate < 20) {
        recommendations.push({
          stage: 'Opened → Clicked',
          issue: `Click-through rate needs improvement (${clickRate.toFixed(1)}%)`,
          recommendation: 'Make CTAs more prominent with contrasting button colors. Place primary CTA above the fold. Use action-oriented language and create urgency.',
          impact: 'medium'
        });
      }
      
      if (recommendations.length === 0) {
        recommendations.push({
          stage: 'Overall',
          issue: 'Campaign performing well',
          recommendation: 'Continue monitoring metrics and run incremental A/B tests to maintain strong performance.',
          impact: 'low'
        });
      }
      
      res.json({
        recommendations,
        overallAssessment: `Campaign metrics: ${deliveryRate.toFixed(1)}% delivery, ${openRate.toFixed(1)}% opens, ${clickRate.toFixed(1)}% clicks.`,
        priorityAction: recommendations[0]?.recommendation || 'Continue monitoring performance.'
      });
    } catch (error) {
      console.error('Funnel analysis error:', error);
      res.status(500).json({ error: 'Failed to analyze funnel' });
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

  // Competitor Analysis (Pro+ only)
  app.post('/api/competitor/analyze', optionalAuth, async (req: any, res) => {
    try {
      const hasAccess = await checkFeatureAccess(req, res, 'competitorAnalysis');
      if (!hasAccess) return;
      
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

  // Inbox Placement Simulation (Pro+ only)
  app.post('/api/inbox/simulate', optionalAuth, async (req: any, res) => {
    try {
      const hasAccess = await checkFeatureAccess(req, res, 'inboxSimulation');
      if (!hasAccess) return;
      
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

  app.get('/api/admin/leaderboard', isAdmin, async (req: any, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 20;
      const leaderboard = await storage.getXPLeaderboard(limit);
      res.json(leaderboard);
    } catch (error) {
      console.error('Admin leaderboard error:', error);
      res.status(500).json({ error: 'Failed to fetch leaderboard' });
    }
  });

  app.post('/api/admin/leaderboard/update-ranks', isAdmin, async (req: any, res) => {
    try {
      await storage.updateLeaderboardRanks();
      res.json({ success: true, message: 'Leaderboard ranks updated' });
    } catch (error) {
      console.error('Update ranks error:', error);
      res.status(500).json({ error: 'Failed to update ranks' });
    }
  });

  app.get('/api/admin/metrics', isAdmin, async (req: any, res) => {
    try {
      const { startDate, endDate } = req.query;
      let start: Date | undefined;
      let end: Date | undefined;
      
      if (startDate) {
        const [year, month, day] = (startDate as string).split('-').map(Number);
        start = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
      }
      
      if (endDate) {
        const [year, month, day] = (endDate as string).split('-').map(Number);
        end = new Date(Date.UTC(year, month - 1, day, 23, 59, 59, 999));
      }
      
      const metrics = await storage.getBusinessMetrics(start, end);
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

  // Enhanced Analytics with Date Range
  app.get('/api/admin/analytics', isAdmin, async (req: any, res) => {
    try {
      const { startDate, endDate } = req.query;
      // Parse date strings and set proper UTC boundaries
      let start: Date;
      let end: Date;
      
      if (startDate) {
        // Parse YYYY-MM-DD and set to start of day UTC
        const [year, month, day] = (startDate as string).split('-').map(Number);
        start = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
      } else {
        start = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      }
      
      if (endDate) {
        // Parse YYYY-MM-DD and set to end of day UTC
        const [year, month, day] = (endDate as string).split('-').map(Number);
        end = new Date(Date.UTC(year, month - 1, day, 23, 59, 59, 999));
      } else {
        end = new Date();
      }
      
      const analytics = await storage.getAnalyticsWithDateRange(start, end);
      res.json(analytics);
    } catch (error) {
      console.error('Admin analytics error:', error);
      res.status(500).json({ error: 'Failed to fetch analytics' });
    }
  });

  // User Health Scores
  app.get('/api/admin/health-scores', isAdmin, async (req: any, res) => {
    try {
      const healthScores = await storage.getUserHealthScores();
      res.json(healthScores);
    } catch (error) {
      console.error('Admin health scores error:', error);
      res.status(500).json({ error: 'Failed to fetch health scores' });
    }
  });

  // Cohort Retention
  app.get('/api/admin/cohort-retention', isAdmin, async (req: any, res) => {
    try {
      const retention = await storage.getCohortRetention();
      res.json(retention);
    } catch (error) {
      console.error('Admin cohort retention error:', error);
      res.status(500).json({ error: 'Failed to fetch cohort retention' });
    }
  });

  // At-Risk Users / Insights
  app.get('/api/admin/at-risk-users', isAdmin, async (req: any, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const atRiskUsers = await storage.getAtRiskUsers(limit);
      res.json(atRiskUsers);
    } catch (error) {
      console.error('Admin at-risk users error:', error);
      res.status(500).json({ error: 'Failed to fetch at-risk users' });
    }
  });

  // Revenue Analytics
  app.get('/api/admin/revenue-analytics', isAdmin, async (req: any, res) => {
    try {
      const analytics = await storage.getRevenueAnalytics();
      res.json(analytics);
    } catch (error) {
      console.error('Admin revenue analytics error:', error);
      res.status(500).json({ error: 'Failed to fetch revenue analytics' });
    }
  });

  // Conversion Funnel Analytics
  app.get('/api/admin/conversion-funnel', isAdmin, async (req: any, res) => {
    try {
      const funnel = await storage.getConversionFunnelAnalytics();
      res.json(funnel);
    } catch (error) {
      console.error('Admin conversion funnel error:', error);
      res.status(500).json({ error: 'Failed to fetch conversion funnel' });
    }
  });

  // Quality Metrics
  app.get('/api/admin/quality-metrics', isAdmin, async (req: any, res) => {
    try {
      const metrics = await storage.getQualityMetrics();
      res.json(metrics);
    } catch (error) {
      console.error('Admin quality metrics error:', error);
      res.status(500).json({ error: 'Failed to fetch quality metrics' });
    }
  });

  // System Health
  app.get('/api/admin/system-health', isAdmin, async (req: any, res) => {
    try {
      const health = await storage.getSystemHealth();
      res.json(health);
    } catch (error) {
      console.error('Admin system health error:', error);
      res.status(500).json({ error: 'Failed to fetch system health' });
    }
  });

  // Admin Email - Send to Individual User
  app.post('/api/admin/send-email', isAdmin, async (req: any, res) => {
    try {
      const adminId = req.user.claims.sub;
      const { recipientUserId, recipientEmail, subject, previewLine, body } = req.body;
      
      if (!recipientEmail || !subject || !body) {
        return res.status(400).json({ error: 'recipientEmail, subject, and body are required' });
      }

      // Get user data for variable replacement
      // Try to find user by ID first, then by email
      let firstName = '';
      let lastName = '';
      let email = recipientEmail;
      
      if (recipientUserId) {
        const user = await storage.getUser(recipientUserId);
        if (user) {
          firstName = user.firstName || '';
          lastName = user.lastName || '';
          email = user.email || recipientEmail;
        }
      } else if (recipientEmail) {
        // Look up user by email for merge tag replacement
        const user = await storage.getUserByEmail(recipientEmail);
        if (user) {
          firstName = user.firstName || '';
          lastName = user.lastName || '';
        }
      }
      
      // Replace merge tags in subject and body
      const replaceVars = (text: string) => text
        .replace(/\{\{firstName\}\}/g, firstName)
        .replace(/\{\{lastName\}\}/g, lastName)
        .replace(/\{\{email\}\}/g, email);
      
      const processedSubject = replaceVars(subject);
      const processedBody = replaceVars(body);
      const processedPreviewLine = previewLine ? replaceVars(previewLine) : '';
      
      // Build styled HTML email matching the Acceptafy design
      const preheaderHtml = processedPreviewLine 
        ? `<span style="display:none!important;visibility:hidden;mso-hide:all;font-size:1px;color:#ffffff;line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;">${processedPreviewLine}</span>`
        : '';
      
      // Convert newlines to <br> for proper formatting and wrap in styled template
      const formattedBody = processedBody.replace(/\n/g, '<br>');
      const finalHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #0f0a1e; color: #e2e8f0; padding: 40px 20px; margin: 0;">
  ${preheaderHtml}
  <div style="max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #1a1033 0%, #0f0a1e 100%); border-radius: 16px; padding: 40px; border: 1px solid #2d2150;">
    <div style="text-align: center; margin-bottom: 32px;">
      <h1 style="background: linear-gradient(135deg, #a855f7, #ec4899); -webkit-background-clip: text; -webkit-text-fill-color: transparent; font-size: 28px; margin: 0;">Acceptafy</h1>
    </div>
    <div style="font-size: 16px; line-height: 1.6; color: #e2e8f0;">
      ${formattedBody}
    </div>
    <p style="font-size: 14px; color: #94a3b8; text-align: center; margin-top: 40px;">Questions? Reply to this email for assistance.</p>
  </div>
</body>
</html>`;

      // Send email using Resend
      const { Resend } = await import('resend');
      const resend = new Resend(process.env.RESEND_API_KEY);
      
      await resend.emails.send({
        from: 'Acceptafy <hello@updates.acceptafy.com>',
        to: recipientEmail,
        subject: processedSubject,
        html: finalHtml,
      });

      // Log the email
      const emailRecord = await storage.createAdminEmail({
        adminId,
        recipientUserId,
        recipientEmail,
        subject: processedSubject,
        body: processedBody,
        emailType: 'individual',
        status: 'sent',
      });

      // Log admin activity
      await storage.logAdminActivity(adminId, 'email_sent', recipientUserId, { subject: processedSubject });

      res.json({ success: true, emailId: emailRecord.id });
    } catch (error) {
      console.error('Admin send email error:', error);
      res.status(500).json({ error: 'Failed to send email' });
    }
  });

  // Admin Email - Bulk Send
  app.post('/api/admin/send-bulk-email', isAdmin, async (req: any, res) => {
    try {
      const adminId = req.user.claims.sub;
      const { segment, subject, previewLine, body } = req.body;
      
      if (!segment || !subject || !body) {
        return res.status(400).json({ error: 'segment, subject, and body are required' });
      }
      
      // Helper to replace merge tags with user data
      const replaceVars = (text: string, user: { firstName?: string | null; lastName?: string | null; email?: string | null }) => text
        .replace(/\{\{firstName\}\}/g, user.firstName || '')
        .replace(/\{\{lastName\}\}/g, user.lastName || '')
        .replace(/\{\{email\}\}/g, user.email || '');

      // Get users based on segment
      const allUsers = await storage.getAllUsersWithUsage();
      // Exclude admin accounts from all segments
      const nonAdminUsers = allUsers.filter(u => u.role !== 'admin');
      let targetUsers = nonAdminUsers;
      
      // Tier-based segments
      if (segment === 'starter') {
        targetUsers = nonAdminUsers.filter(u => (u.subscriptionTier || 'starter') === 'starter');
      } else if (segment === 'pro') {
        targetUsers = nonAdminUsers.filter(u => u.subscriptionTier === 'pro');
      } else if (segment === 'scale') {
        targetUsers = nonAdminUsers.filter(u => u.subscriptionTier === 'scale');
      } else if (segment === 'paid') {
        targetUsers = nonAdminUsers.filter(u => u.subscriptionTier === 'pro' || u.subscriptionTier === 'scale');
      } 
      // Advanced behavioral segments
      else if (segment === 'approaching-limits') {
        // Users at 80%+ of their monthly quota
        const LIMITS: Record<string, number> = { starter: 3, pro: 600, scale: 2500 };
        targetUsers = nonAdminUsers.filter(u => {
          const tier = u.subscriptionTier || 'starter';
          const limit = LIMITS[tier] || 3;
          const usage = u.totalGrades || 0;
          return usage >= limit * 0.8;
        });
      } else if (segment === 'inactive') {
        // Users with no activity in 14+ days
        const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
        targetUsers = nonAdminUsers.filter(u => {
          if (!u.lastActiveDate) return true;
          return new Date(u.lastActiveDate) < fourteenDaysAgo;
        });
      } else if (segment === 'power-users') {
        // Users with 50+ grades total (high engagement)
        targetUsers = nonAdminUsers.filter(u => (u.totalGrades || 0) >= 50);
      } else if (segment === 'at-risk') {
        // Users showing churn signals: paid users with declining activity
        targetUsers = nonAdminUsers.filter(u => {
          const isPaid = u.subscriptionTier === 'pro' || u.subscriptionTier === 'scale';
          const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
          const isInactive = !u.lastActiveDate || new Date(u.lastActiveDate) < sevenDaysAgo;
          return isPaid && isInactive;
        });
      } else if (segment === 'high-graders') {
        // Active graders: 10+ grades this week
        targetUsers = nonAdminUsers.filter(u => (u.totalGrades || 0) >= 10);
      } else if (segment === 'high-rewriters') {
        // Active rewriters: users who use rewrites
        targetUsers = nonAdminUsers.filter(u => (u.totalRewrites || 0) >= 10);
      } else if (segment === 'esp-connected') {
        // Users with ESP connections - check for any ESP connections for each user
        const usersWithEsp = new Set<string>();
        for (const user of nonAdminUsers) {
          const userConnections = await storage.getESPConnections(user.id);
          if (userConnections && userConnections.length > 0) {
            usersWithEsp.add(user.id);
          }
        }
        targetUsers = nonAdminUsers.filter(u => usersWithEsp.has(u.id));
      } else if (segment === 'new-signups') {
        // New signups in last 7 days
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        targetUsers = nonAdminUsers.filter(u => {
          if (!u.createdAt) return false;
          return new Date(u.createdAt) >= sevenDaysAgo;
        });
      }
      
      // Filter to users with valid emails
      const usersWithEmails = targetUsers.filter(u => u.email);

      // Send emails using Resend
      const { Resend } = await import('resend');
      const resend = new Resend(process.env.RESEND_API_KEY);
      
      let sentCount = 0;
      let failedCount = 0;

      for (const user of usersWithEmails) {
        try {
          // Replace merge tags for this user
          const processedSubject = replaceVars(subject, user);
          const processedBody = replaceVars(body, user);
          const processedPreviewLine = previewLine ? replaceVars(previewLine, user) : '';
          
          // Build styled HTML email matching the Acceptafy design
          const preheaderHtml = processedPreviewLine 
            ? `<span style="display:none!important;visibility:hidden;mso-hide:all;font-size:1px;color:#ffffff;line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;">${processedPreviewLine}</span>`
            : '';
          
          // Convert newlines to <br> for proper formatting and wrap in styled template
          const formattedBody = processedBody.replace(/\n/g, '<br>');
          const finalHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #0f0a1e; color: #e2e8f0; padding: 40px 20px; margin: 0;">
  ${preheaderHtml}
  <div style="max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #1a1033 0%, #0f0a1e 100%); border-radius: 16px; padding: 40px; border: 1px solid #2d2150;">
    <div style="text-align: center; margin-bottom: 32px;">
      <h1 style="background: linear-gradient(135deg, #a855f7, #ec4899); -webkit-background-clip: text; -webkit-text-fill-color: transparent; font-size: 28px; margin: 0;">Acceptafy</h1>
    </div>
    <div style="font-size: 16px; line-height: 1.6; color: #e2e8f0;">
      ${formattedBody}
    </div>
    <p style="font-size: 14px; color: #94a3b8; text-align: center; margin-top: 40px;">Questions? Reply to this email for assistance.</p>
  </div>
</body>
</html>`;
          
          await resend.emails.send({
            from: 'Acceptafy <hello@updates.acceptafy.com>',
            to: user.email!,
            subject: processedSubject,
            html: finalHtml,
          });
          
          await storage.createAdminEmail({
            adminId,
            recipientUserId: user.id,
            recipientEmail: user.email!,
            subject: processedSubject,
            body: processedBody,
            emailType: 'bulk',
            segment,
            status: 'sent',
          });
          
          sentCount++;
        } catch (e) {
          failedCount++;
        }
      }

      // Log admin activity
      await storage.logAdminActivity(adminId, 'bulk_email_sent', undefined, { 
        segment, 
        subject, 
        sentCount, 
        failedCount 
      });

      res.json({ success: true, sentCount, failedCount, totalTargeted: usersWithEmails.length });
    } catch (error) {
      console.error('Admin bulk email error:', error);
      res.status(500).json({ error: 'Failed to send bulk email' });
    }
  });

  // Send Monthly Reset Reminder Emails to Starter Users
  app.post('/api/admin/send-starter-reset-reminders', isAdmin, async (req: any, res) => {
    try {
      const adminId = req.user.claims.sub;
      const allUsers = await storage.getAllUsers();
      
      // Filter for starter plan users with verified emails (exclude admins)
      const starterUsers = allUsers.filter(u => 
        u.role !== 'admin' && 
        (u.subscriptionTier || 'starter') === 'starter' &&
        u.email &&
        u.emailVerified !== false
      );

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
        } catch (e) {
          console.error(`Failed to send reset email to ${user.email}:`, e);
          failedCount++;
        }
      }

      // Log admin activity
      await storage.logAdminActivity(adminId, 'starter_reset_emails_sent', undefined, { 
        sentCount, 
        failedCount,
        totalTargeted: starterUsers.length
      });

      res.json({ 
        success: true, 
        sentCount, 
        failedCount, 
        totalTargeted: starterUsers.length,
        message: `Monthly reset reminder emails sent to ${sentCount} Starter plan users`
      });
    } catch (error) {
      console.error('Starter reset email error:', error);
      res.status(500).json({ error: 'Failed to send starter reset emails' });
    }
  });

  // Get Admin Email History
  app.get('/api/admin/emails', isAdmin, async (req: any, res) => {
    try {
      const emails = await storage.getAdminEmails();
      res.json(emails);
    } catch (error) {
      console.error('Admin emails error:', error);
      res.status(500).json({ error: 'Failed to fetch email history' });
    }
  });

  // Announcements CRUD
  app.get('/api/admin/announcements', isAdmin, async (req: any, res) => {
    try {
      const announcements = await storage.getAllAnnouncements();
      res.json(announcements);
    } catch (error) {
      console.error('Admin announcements error:', error);
      res.status(500).json({ error: 'Failed to fetch announcements' });
    }
  });

  app.post('/api/admin/announcements', isAdmin, async (req: any, res) => {
    try {
      const adminId = req.user.claims.sub;
      const { title, message, type, targetAudience, expiresAt } = req.body;
      
      if (!title || !message) {
        return res.status(400).json({ error: 'title and message are required' });
      }

      const announcement = await storage.createAnnouncement({
        adminId,
        title,
        message,
        type: type || 'info',
        targetAudience: targetAudience || 'all',
        expiresAt: expiresAt ? new Date(expiresAt) : undefined,
      });

      await storage.logAdminActivity(adminId, 'announcement_created', undefined, { title });

      res.json(announcement);
    } catch (error) {
      console.error('Admin create announcement error:', error);
      res.status(500).json({ error: 'Failed to create announcement' });
    }
  });

  app.patch('/api/admin/announcements/:id', isAdmin, async (req: any, res) => {
    try {
      const { id } = req.params;
      const { title, message, type, targetAudience, isActive, expiresAt } = req.body;

      const announcement = await storage.updateAnnouncement(id, {
        title,
        message,
        type,
        targetAudience,
        isActive,
        expiresAt: expiresAt ? new Date(expiresAt) : undefined,
      });

      res.json(announcement);
    } catch (error) {
      console.error('Admin update announcement error:', error);
      res.status(500).json({ error: 'Failed to update announcement' });
    }
  });

  app.delete('/api/admin/announcements/:id', isAdmin, async (req: any, res) => {
    try {
      const { id } = req.params;
      await storage.deleteAnnouncement(id);
      res.json({ success: true });
    } catch (error) {
      console.error('Admin delete announcement error:', error);
      res.status(500).json({ error: 'Failed to delete announcement' });
    }
  });

  // User-facing announcements endpoint
  app.get('/api/announcements', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      const announcements = await storage.getActiveAnnouncements(user?.subscriptionTier || 'starter');
      res.json(announcements);
    } catch (error) {
      console.error('Announcements error:', error);
      res.status(500).json({ error: 'Failed to fetch announcements' });
    }
  });

  app.post('/api/announcements/:id/read', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { id } = req.params;
      await storage.markAnnouncementRead(id, userId);
      res.json({ success: true });
    } catch (error) {
      console.error('Mark announcement read error:', error);
      res.status(500).json({ error: 'Failed to mark announcement as read' });
    }
  });

  // Contact Messages Management
  app.get('/api/admin/contact-messages', isAdmin, async (req: any, res) => {
    try {
      const messages = await storage.getContactMessages();
      res.json(messages);
    } catch (error) {
      console.error('Admin contact messages error:', error);
      res.status(500).json({ error: 'Failed to fetch contact messages' });
    }
  });

  // User Activity Logs
  app.get('/api/admin/users/:userId/activity', isAdmin, async (req: any, res) => {
    try {
      const { userId } = req.params;
      const activity = await storage.getUserActivityLogs(userId, 100);
      res.json(activity);
    } catch (error) {
      console.error('Admin user activity error:', error);
      res.status(500).json({ error: 'Failed to fetch user activity' });
    }
  });

  // User Detail View - comprehensive user data for admin
  app.get('/api/admin/users/:userId/detail', isAdmin, async (req: any, res) => {
    try {
      const { userId } = req.params;
      
      // Get user profile
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Get email analyses (graded emails)
      const emailAnalyses = await storage.getEmailAnalyses(userId);

      // Get gamification data
      const gamification = await storage.getUserGamification(userId);

      // Get usage counters
      const usage = await storage.getUsageCounter(userId);

      // Get admin notes
      const notes = await storage.getAdminNotes(userId);

      res.json({
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          subscriptionTier: user.subscriptionTier,
          subscriptionStatus: user.subscriptionStatus,
          role: user.role,
          emailVerified: user.emailVerified,
          createdAt: user.createdAt,
          lastLoginAt: user.lastLoginAt,
          companyName: user.companyName,
        },
        emailAnalyses: emailAnalyses || [],
        gamification: gamification || null,
        usage: usage || null,
        notes: notes || [],
      });
    } catch (error) {
      console.error('Admin user detail error:', error);
      res.status(500).json({ error: 'Failed to fetch user details' });
    }
  });

  // Admin Activity Log (Audit Trail)
  app.get('/api/admin/activity-log', isAdmin, async (req: any, res) => {
    try {
      const activity = await storage.getAdminActivityLogs();
      res.json(activity);
    } catch (error) {
      console.error('Admin activity log error:', error);
      res.status(500).json({ error: 'Failed to fetch admin activity log' });
    }
  });

  // Users Near Limit (Upgrade Candidates)
  app.get('/api/admin/users-near-limit', isAdmin, async (req: any, res) => {
    try {
      const users = await storage.getUsersNearLimit();
      res.json(users);
    } catch (error) {
      console.error('Admin users near limit error:', error);
      res.status(500).json({ error: 'Failed to fetch users near limit' });
    }
  });

  // Update User Tier (Admin action)
  app.post('/api/admin/users/:userId/update-tier', isAdmin, async (req: any, res) => {
    try {
      const adminId = req.user.claims.sub;
      const { userId } = req.params;
      const { tier } = req.body;
      
      if (!['starter', 'pro', 'scale'].includes(tier)) {
        return res.status(400).json({ error: 'Invalid tier' });
      }

      const user = await storage.updateUserTier(userId, tier);
      await storage.logAdminActivity(adminId, 'tier_changed', userId, { newTier: tier });

      res.json(user);
    } catch (error) {
      console.error('Admin update tier error:', error);
      res.status(500).json({ error: 'Failed to update user tier' });
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

      const limit = parseInt(req.query.limit as string) || 10;
      
      const [allStats, manualCampaigns] = await Promise.all([
        Promise.all(
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
        ),
        storage.getManualCampaignStats(userId)
      ]);

      const successfulStats = allStats.filter(s => s.stats !== null);
      const normalizedManualCampaigns = manualCampaigns
        .map(normalizeManualCampaignStats)
        .filter((c): c is NormalizedManualCampaign => c !== null);
      
      let combinedStats = null;
      const espCampaigns = successfulStats.flatMap(s => 
        s.stats!.campaigns.map(c => ({ ...c, isManual: false }))
      );
      const allCampaigns = [...espCampaigns, ...normalizedManualCampaigns];
      
      if (allCampaigns.length > 0) {
        const totalSent = allCampaigns.reduce((sum, c) => sum + c.totalSent, 0);
        const totalDelivered = allCampaigns.reduce((sum, c) => sum + c.delivered, 0);
        const totalBounced = allCampaigns.reduce((sum, c) => sum + c.bounced, 0);
        const totalOpened = allCampaigns.reduce((sum, c) => sum + c.opened, 0);
        const totalClicked = allCampaigns.reduce((sum, c) => sum + c.clicked, 0);
        const totalSkipped = Math.max(0, totalSent - totalDelivered - totalBounced);
        const totalSoftBounced = allCampaigns.reduce((sum, c) => sum + (c.softBounced || 0), 0);
        const totalHardBounced = allCampaigns.reduce((sum, c) => sum + (c.hardBounced || 0), 0);
        const totalUnsubscribed = allCampaigns.reduce((sum, c) => sum + (c.unsubscribed || 0), 0);
        const totalSpamReports = allCampaigns.reduce((sum, c) => sum + (c.spamReports || 0), 0);
        const totalForwards = allCampaigns.reduce((sum, c) => sum + (c.forwards || 0), 0);
        const totalRevenue = allCampaigns.reduce((sum, c) => sum + (c.revenue || 0), 0);
        
        const campaignsWithTimeToOpen = allCampaigns.filter(c => c.avgTimeToOpen && c.avgTimeToOpen > 0);
        const avgTimeToOpen = campaignsWithTimeToOpen.length > 0 
          ? campaignsWithTimeToOpen.reduce((sum, c) => sum + (c.avgTimeToOpen || 0), 0) / campaignsWithTimeToOpen.length 
          : 0;
        
        const totals = {
          totalCampaigns: allCampaigns.length,
          totalSent,
          totalDelivered,
          totalOpened,
          totalClicked,
          totalSkipped,
          totalBounced,
          totalSoftBounced,
          totalHardBounced,
          totalUnsubscribed,
          totalSpamReports,
          totalForwards,
          totalRevenue,
          avgOpenRate: allCampaigns.length > 0 ? allCampaigns.reduce((sum, c) => sum + c.openRate, 0) / allCampaigns.length : 0,
          avgClickRate: allCampaigns.length > 0 ? allCampaigns.reduce((sum, c) => sum + c.clickRate, 0) / allCampaigns.length : 0,
          avgBounceRate: allCampaigns.length > 0 ? allCampaigns.reduce((sum, c) => sum + c.bounceRate, 0) / allCampaigns.length : 0,
          avgSkipRate: totalSent > 0 ? (totalSkipped / totalSent) * 100 : 0,
          avgSoftBounceRate: totalSent > 0 ? (totalSoftBounced / totalSent) * 100 : 0,
          avgHardBounceRate: totalSent > 0 ? (totalHardBounced / totalSent) * 100 : 0,
          avgUnsubscribeRate: totalDelivered > 0 ? (totalUnsubscribed / totalDelivered) * 100 : 0,
          avgSpamRate: totalDelivered > 0 ? (totalSpamReports / totalDelivered) * 100 : 0,
          avgForwardRate: totalDelivered > 0 ? (totalForwards / totalDelivered) * 100 : 0,
          avgRevenuePerEmail: totalSent > 0 ? totalRevenue / totalSent / 100 : 0,
          avgTimeToOpen,
          clickToOpenRate: totalOpened > 0 ? (totalClicked / totalOpened) * 100 : 0,
          manualCampaignCount: normalizedManualCampaigns.length,
          espCampaignCount: espCampaigns.length,
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
        totalSkipped: Math.max(0, validation.data.stats.totalSkipped ?? 0),
        totalSoftBounced: Math.max(0, validation.data.stats.totalSoftBounced ?? 0),
        totalHardBounced: Math.max(0, validation.data.stats.totalHardBounced ?? 0),
        totalUnsubscribed: Math.max(0, validation.data.stats.totalUnsubscribed ?? 0),
        totalSpamReports: Math.max(0, validation.data.stats.totalSpamReports ?? 0),
        totalForwards: Math.max(0, validation.data.stats.totalForwards ?? 0),
        totalRevenue: Math.max(0, validation.data.stats.totalRevenue ?? 0),
        avgSkipRate: validation.data.stats.avgSkipRate ?? 0,
        avgSoftBounceRate: validation.data.stats.avgSoftBounceRate ?? 0,
        avgHardBounceRate: validation.data.stats.avgHardBounceRate ?? 0,
        avgUnsubscribeRate: validation.data.stats.avgUnsubscribeRate ?? 0,
        avgSpamRate: validation.data.stats.avgSpamRate ?? 0,
        avgForwardRate: validation.data.stats.avgForwardRate ?? 0,
        avgRevenuePerEmail: validation.data.stats.avgRevenuePerEmail ?? 0,
        avgTimeToOpen: validation.data.stats.avgTimeToOpen ?? 0,
        clickToOpenRate: validation.data.stats.clickToOpenRate ?? 0,
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

  // Get campaign content for email analysis
  app.get('/api/esp/:provider/campaign/:campaignId/content', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { provider, campaignId } = req.params;

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

      const { fetchESPCampaignContent } = await import('./services/esp');
      const result = await fetchESPCampaignContent(providerValidation.data, credentials, campaignId);

      res.json(result);
    } catch (error) {
      console.error('ESP campaign content error:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch campaign content' });
    }
  });

  // Generic ESP Contact Export for List Cleaning (supports all providers with fetchContacts)
  app.get('/api/esp/:provider/contacts', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { provider } = req.params;
      const limit = parseInt(req.query.limit as string) || 500;

      const providerValidation = espProviderSchema.safeParse(provider);
      if (!providerValidation.success) {
        return res.status(400).json({ error: 'Invalid provider' });
      }

      const connection = await storage.getESPConnection(userId, providerValidation.data);
      if (!connection || !connection.isConnected) {
        return res.status(404).json({ error: `${provider} connection not found. Please connect your account first.` });
      }

      const credentials: ESPCredentials = {
        apiKey: connection.apiKey || undefined,
        apiUrl: connection.apiUrl || undefined,
        appId: connection.appId || undefined,
      };

      const { fetchESPContacts } = await import('./services/esp');
      const result = await fetchESPContacts(providerValidation.data, credentials, Math.min(limit, 1000));

      res.json(result);
    } catch (error: any) {
      console.error('ESP contacts export error:', error);
      const errorMessage = error?.message || 'Failed to export contacts';
      res.status(400).json({ success: false, error: errorMessage });
    }
  });

  // ============================================
  // Deliverability Intelligence Routes (Scale-tier only)
  // ============================================

  const { deliverabilityIntelligence } = await import('./services/deliverabilityIntelligence');

  app.get('/api/deliverability/provider-health', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (normalizeTier(user?.subscriptionTier) !== 'scale') {
        return res.status(403).json({ error: 'Scale tier required for deliverability intelligence features' });
      }

      const healthPanels = await deliverabilityIntelligence.getProviderHealthPanels(userId);
      res.json(healthPanels);
    } catch (error) {
      console.error('Provider health error:', error);
      res.status(500).json({ error: 'Failed to fetch provider health' });
    }
  });

  app.get('/api/deliverability/alerts', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const unreadOnly = req.query.unread === 'true';
      
      const alerts = await storage.getDeliverabilityAlerts(userId, unreadOnly);
      res.json(alerts);
    } catch (error) {
      console.error('Alerts fetch error:', error);
      res.status(500).json({ error: 'Failed to fetch alerts' });
    }
  });

  app.patch('/api/deliverability/alerts/:id/read', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { id } = req.params;
      
      await storage.markAlertRead(id, userId);
      res.json({ success: true });
    } catch (error) {
      console.error('Mark alert read error:', error);
      res.status(500).json({ error: 'Failed to mark alert as read' });
    }
  });

  app.patch('/api/deliverability/alerts/:id/dismiss', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { id } = req.params;
      
      await storage.dismissAlert(id, userId);
      res.json({ success: true });
    } catch (error) {
      console.error('Dismiss alert error:', error);
      res.status(500).json({ error: 'Failed to dismiss alert' });
    }
  });

  app.post('/api/deliverability/risk-score', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (normalizeTier(user?.subscriptionTier) !== 'scale') {
        return res.status(403).json({ error: 'Scale tier required for risk scoring' });
      }

      const { provider, subject, estimatedVolume } = req.body;
      
      const providerValidation = espProviderSchema.safeParse(provider);
      if (!providerValidation.success) {
        return res.status(400).json({ error: 'Invalid provider' });
      }

      const riskAssessment = await deliverabilityIntelligence.calculateRiskScore(
        userId,
        providerValidation.data,
        subject,
        estimatedVolume
      );

      await storage.saveCampaignRiskScore({
        userId,
        provider: providerValidation.data,
        subject,
        estimatedVolume,
        overallRisk: riskAssessment.overallRisk,
        riskScore: riskAssessment.riskScore,
        riskFactors: riskAssessment.riskFactors,
        predictedOpenRate: Math.round(riskAssessment.predictions.openRate * 100),
        predictedBounceRate: Math.round(riskAssessment.predictions.bounceRate * 100),
        predictedComplaintRate: Math.round(riskAssessment.predictions.complaintRate * 10000),
      });

      res.json(riskAssessment);
    } catch (error) {
      console.error('Risk score error:', error);
      res.status(500).json({ error: 'Failed to calculate risk score' });
    }
  });

  app.post('/api/deliverability/compare', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (normalizeTier(user?.subscriptionTier) !== 'scale') {
        return res.status(403).json({ error: 'Scale tier required for campaign comparison' });
      }

      const { campaignId1, campaignId2 } = req.body;
      
      if (!campaignId1 || !campaignId2) {
        return res.status(400).json({ error: 'Two campaign IDs required for comparison' });
      }

      const comparison = await deliverabilityIntelligence.compareCampaigns(
        userId,
        campaignId1,
        campaignId2
      );

      res.json(comparison);
    } catch (error: any) {
      console.error('Campaign comparison error:', error);
      res.status(500).json({ error: error.message || 'Failed to compare campaigns' });
    }
  });

  app.get('/api/deliverability/campaign-history/:provider?', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const provider = req.params.provider || req.query.provider as string | undefined;
      const limit = parseInt(req.query.limit as string) || 50;
      
      const history = await storage.getCampaignHistory(userId, provider, limit);
      res.json(history);
    } catch (error) {
      console.error('Campaign history error:', error);
      res.status(500).json({ error: 'Failed to fetch campaign history' });
    }
  });

  app.get('/api/deliverability/baselines', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const provider = req.query.provider as string | undefined;
      
      const baselines = await storage.getBaselines(userId, provider);
      res.json(baselines);
    } catch (error) {
      console.error('Baselines fetch error:', error);
      res.status(500).json({ error: 'Failed to fetch baselines' });
    }
  });

  app.get('/api/deliverability/template-health', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (normalizeTier(user?.subscriptionTier) !== 'scale') {
        return res.status(403).json({ error: 'Scale tier required for template health tracking' });
      }

      const templates = await storage.getTemplateHealth(userId);
      const formattedTemplates = templates.map(t => ({
        templateId: t.templateId || t.id,
        templateName: t.templateName,
        timesUsed: t.timesUsed || 0,
        avgOpenRate: (t.avgOpenRate || 0) / 100,
        avgClickRate: (t.avgClickRate || 0) / 100,
        avgBounceRate: (t.avgBounceRate || 0) / 100,
        trend: (t.healthTrend as 'improving' | 'stable' | 'declining') || 'stable',
        lastUsed: t.lastUsedAt?.toISOString(),
      }));
      res.json(formattedTemplates);
    } catch (error) {
      console.error('Template health error:', error);
      res.status(500).json({ error: 'Failed to fetch template health' });
    }
  });

  app.get('/api/deliverability/frequency-tracking/:provider?', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (normalizeTier(user?.subscriptionTier) !== 'scale') {
        return res.status(403).json({ error: 'Scale tier required for frequency tracking' });
      }

      const provider = req.params.provider || req.query.provider as string | undefined;
      if (!provider) {
        return res.json(null);
      }

      const trackingRecords = await storage.getSendFrequencyTracking(userId, provider);
      const campaignHistory = await storage.getCampaignHistory(userId, provider as any, 30);
      
      if (trackingRecords.length === 0 && campaignHistory.length === 0) {
        return res.json(null);
      }

      const tracking = trackingRecords[0];
      
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      const sendsThisWeek = campaignHistory.filter(
        c => c.sentAt && new Date(c.sentAt) >= weekAgo
      ).length;

      const dayBreakdown: Record<string, { count: number; openRates: number[] }> = {
        Sunday: { count: 0, openRates: [] },
        Monday: { count: 0, openRates: [] },
        Tuesday: { count: 0, openRates: [] },
        Wednesday: { count: 0, openRates: [] },
        Thursday: { count: 0, openRates: [] },
        Friday: { count: 0, openRates: [] },
        Saturday: { count: 0, openRates: [] },
      };
      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

      for (const campaign of campaignHistory) {
        if (campaign.sentAt) {
          const dayName = dayNames[new Date(campaign.sentAt).getDay()];
          dayBreakdown[dayName].count++;
          if (campaign.openRate) {
            dayBreakdown[dayName].openRates.push(campaign.openRate / 100);
          }
        }
      }

      const dayOfWeekBreakdown = dayNames.map(day => ({
        day,
        count: dayBreakdown[day].count,
        performance: dayBreakdown[day].openRates.length > 0
          ? dayBreakdown[day].openRates.reduce((a, b) => a + b, 0) / dayBreakdown[day].openRates.length
          : 0,
      }));

      const recommendations: string[] = [];
      const currentSendsPerWeek = sendsThisWeek;
      const baselineSendsPerWeek = tracking?.avgSendsPerWeek || 3;
      
      let fatigueRisk: 'low' | 'medium' | 'high' = 'low';
      if (currentSendsPerWeek > baselineSendsPerWeek * 2) {
        fatigueRisk = 'high';
        recommendations.push('Consider reducing send frequency to prevent subscriber fatigue');
      } else if (currentSendsPerWeek > baselineSendsPerWeek * 1.5) {
        fatigueRisk = 'medium';
        recommendations.push('Monitor engagement closely - your send frequency is above average');
      }
      
      if (tracking?.unsubscribeTrend === 'increasing') {
        recommendations.push('Unsubscribe rates are increasing - review content quality and targeting');
      }
      if (tracking?.openRateTrend === 'decreasing') {
        recommendations.push('Open rates are declining - consider A/B testing subject lines');
      }

      const bestDays = [...dayOfWeekBreakdown]
        .filter(d => d.count > 0)
        .sort((a, b) => b.performance - a.performance)
        .slice(0, 2);
      
      const optimalSendTimes = bestDays.map(d => d.day);
      if (optimalSendTimes.length === 0) {
        optimalSendTimes.push('Tuesday', 'Thursday');
      }

      const response = {
        currentSendsPerWeek,
        baselineSendsPerWeek,
        fatigueRisk,
        recommendations: recommendations.length > 0 ? recommendations : ['Send frequency looks healthy - keep up the good work!'],
        optimalSendTimes,
        dayOfWeekBreakdown,
      };

      res.json(response);
    } catch (error) {
      console.error('Frequency tracking error:', error);
      res.status(500).json({ error: 'Failed to fetch frequency tracking' });
    }
  });

  app.post('/api/deliverability/sync', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { provider } = req.body;
      
      const providerValidation = espProviderSchema.safeParse(provider);
      if (!providerValidation.success) {
        return res.status(400).json({ error: 'Invalid provider' });
      }

      const connection = await storage.getESPConnection(userId, providerValidation.data);
      if (!connection || !connection.isConnected) {
        return res.status(404).json({ error: 'ESP connection not found' });
      }

      const credentials: ESPCredentials = {
        apiKey: connection.apiKey || undefined,
        apiUrl: connection.apiUrl || undefined,
        appId: connection.appId || undefined,
      };

      const stats = await fetchESPStats(providerValidation.data, credentials);
      
      if (stats.campaigns && stats.campaigns.length > 0) {
        await deliverabilityIntelligence.syncCampaignHistory(
          userId, 
          providerValidation.data, 
          stats.campaigns
        );
      }

      res.json({ success: true, campaignsSynced: stats.campaigns?.length || 0 });
    } catch (error) {
      console.error('Deliverability sync error:', error);
      res.status(500).json({ error: 'Failed to sync campaign data' });
    }
  });

  // ============================================
  // List Health Dashboard Routes (Scale-tier only)
  // ============================================

  const { getListHealthDashboard, getListHealthHistory: getListHistory } = await import('./services/listHealthService');

  app.get('/api/list-health/:provider', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (normalizeTier(user?.subscriptionTier) !== 'scale') {
        return res.status(403).json({ error: 'Scale tier required for list health dashboard' });
      }

      const { provider } = req.params;
      const providerValidation = espProviderSchema.safeParse(provider);
      if (!providerValidation.success) {
        return res.status(400).json({ error: 'Invalid provider' });
      }

      const dashboardData = await getListHealthDashboard(userId, providerValidation.data);
      
      if (!dashboardData) {
        return res.status(404).json({ error: 'No list health data available for this provider' });
      }

      res.json(dashboardData);
    } catch (error) {
      console.error('List health dashboard error:', error);
      res.status(500).json({ error: 'Failed to fetch list health data' });
    }
  });

  app.get('/api/list-health/:provider/:listId/history', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (normalizeTier(user?.subscriptionTier) !== 'scale') {
        return res.status(403).json({ error: 'Scale tier required for list health history' });
      }

      const { provider, listId } = req.params;
      
      const providerValidation = espProviderSchema.safeParse(provider);
      if (!providerValidation.success) {
        return res.status(400).json({ error: 'Invalid provider' });
      }
      
      const limit = parseInt(req.query.limit as string) || 30;

      const history = await getListHistory(userId, listId, limit);
      
      const filteredHistory = history.filter(h => h.provider === providerValidation.data);
      res.json(filteredHistory);
    } catch (error) {
      console.error('List health history error:', error);
      res.status(500).json({ error: 'Failed to fetch list health history' });
    }
  });

  // Contact form endpoint (rate limited to prevent spam)
  app.post('/api/contact', contactRateLimiter, async (req, res) => {
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
      const parseResult = adminNoteSchema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({ message: 'Invalid note data', errors: parseResult.error.flatten() });
      }
      const adminId = req.user.claims.sub;
      
      const user = await storage.getUser(id);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      const created = await storage.createAdminNote({
        userId: id,
        adminId,
        note: parseResult.data.note.trim(),
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

  // ========== BLACKLIST MONITORING ROUTES ==========
  
  app.post('/api/blacklist/check', isAuthenticated, async (req: any, res) => {
    try {
      const { target } = req.body;
      
      if (!target || typeof target !== 'string') {
        return res.status(400).json({ message: 'Target (IP or domain) is required' });
      }
      
      const userId = req.user.claims.sub;
      
      const { checkBlacklists } = await import('./services/blacklistChecker');
      const result = await checkBlacklists(target.trim().toLowerCase());
      
      await storage.saveBlacklistCheck({
        userId,
        domain: result.domain,
        type: result.type,
        totalBlacklists: result.totalBlacklists,
        listedOn: result.listedOn,
        cleanOn: result.cleanOn,
        results: result.results,
      });
      
      res.json(result);
    } catch (error: any) {
      console.error('Blacklist check error:', error);
      res.status(400).json({ message: error.message || 'Failed to check blacklists' });
    }
  });
  
  app.get('/api/blacklist/history', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const domain = req.query.domain as string | undefined;
      const limit = parseInt(req.query.limit as string) || 20;
      
      const history = await storage.getBlacklistCheckHistory(userId, domain, limit);
      res.json(history);
    } catch (error) {
      console.error('Blacklist history error:', error);
      res.status(500).json({ message: 'Failed to get blacklist history' });
    }
  });
  
  app.get('/api/blacklist/domains', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const domains = await storage.getMonitoredDomains(userId);
      res.json(domains);
    } catch (error) {
      console.error('Get monitored domains error:', error);
      res.status(500).json({ message: 'Failed to get monitored domains' });
    }
  });
  
  app.post('/api/blacklist/domains', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { domain, type } = req.body;
      
      if (!domain || typeof domain !== 'string') {
        return res.status(400).json({ message: 'Domain or IP is required' });
      }
      
      const existing = await storage.getMonitoredDomain(userId, domain.trim().toLowerCase());
      if (existing) {
        return res.status(400).json({ message: 'This domain/IP is already being monitored' });
      }
      
      const user = await storage.getUser(userId);
      const tier = (user?.subscriptionTier || 'starter') as keyof typeof SUBSCRIPTION_LIMITS;
      const domains = await storage.getMonitoredDomains(userId);
      
      const limit = SUBSCRIPTION_LIMITS[tier]?.monitoredDomains || 3;
      
      if (domains.length >= limit) {
        return res.status(403).json({ 
          message: `${tier.charAt(0).toUpperCase() + tier.slice(1)} plan allows monitoring ${limit} domain(s). Upgrade for more.` 
        });
      }
      
      const result = await storage.createMonitoredDomain({
        userId,
        domain: domain.trim().toLowerCase(),
        type: type || 'domain',
      });
      
      res.json(result);
    } catch (error) {
      console.error('Create monitored domain error:', error);
      res.status(500).json({ message: 'Failed to add domain to monitoring' });
    }
  });
  
  app.delete('/api/blacklist/domains/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { id } = req.params;
      
      await storage.deleteMonitoredDomain(id, userId);
      res.json({ success: true });
    } catch (error) {
      console.error('Delete monitored domain error:', error);
      res.status(500).json({ message: 'Failed to remove domain from monitoring' });
    }
  });
  
  app.patch('/api/blacklist/domains/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { id } = req.params;
      const { checkFrequency, alertsEnabled } = req.body;
      
      const updates: any = {};
      if (checkFrequency !== undefined) {
        const validFrequencies = ['daily', 'weekly', 'manual'];
        if (!validFrequencies.includes(checkFrequency)) {
          return res.status(400).json({ message: 'Invalid check frequency. Must be daily, weekly, or manual.' });
        }
        updates.checkFrequency = checkFrequency;
      }
      if (alertsEnabled !== undefined) {
        if (typeof alertsEnabled !== 'boolean') {
          return res.status(400).json({ message: 'alertsEnabled must be a boolean.' });
        }
        updates.alertsEnabled = alertsEnabled;
      }
      
      const result = await storage.updateMonitoredDomain(id, userId, updates);
      if (!result) {
        return res.status(404).json({ message: 'Domain not found' });
      }
      res.json(result);
    } catch (error) {
      console.error('Update monitored domain error:', error);
      res.status(500).json({ message: 'Failed to update monitoring settings' });
    }
  });
  
  app.post('/api/blacklist/domains/:id/check', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { id } = req.params;
      
      const { runManualCheck } = await import('./services/blacklistScheduler');
      await runManualCheck(id, userId);
      
      const domain = await storage.getMonitoredDomainById(id, userId);
      res.json(domain);
    } catch (error) {
      console.error('Manual check error:', error);
      res.status(500).json({ message: 'Failed to run manual check' });
    }
  });
  
  app.get('/api/blacklist/guidance/:zone', async (req, res) => {
    try {
      const { zone } = req.params;
      const { getDelistingGuidance } = await import('./services/blacklistChecker');
      const guidance = getDelistingGuidance(zone);
      res.json(guidance);
    } catch (error) {
      console.error('Get delisting guidance error:', error);
      res.status(500).json({ message: 'Failed to get delisting guidance' });
    }
  });

  // ========== ARTICLES / RESOURCES API ==========
  
  // Public: Get all published articles
  app.get('/api/articles', async (req, res) => {
    try {
      const articles = await storage.getArticles(true);
      res.json(articles);
    } catch (error) {
      console.error('Get articles error:', error);
      res.status(500).json({ message: 'Failed to get articles' });
    }
  });
  
  // Public: Get article by slug
  app.get('/api/articles/slug/:slug', async (req, res) => {
    try {
      const { slug } = req.params;
      const article = await storage.getArticleBySlug(slug);
      
      if (!article || !article.published) {
        return res.status(404).json({ message: 'Article not found' });
      }
      
      // Increment view count
      await storage.incrementArticleViewCount(article.id);
      
      res.json(article);
    } catch (error) {
      console.error('Get article by slug error:', error);
      res.status(500).json({ message: 'Failed to get article' });
    }
  });
  
  // Admin: Get all articles (including drafts)
  app.get('/api/admin/articles', isAdmin, async (req: any, res) => {
    try {
      const articles = await storage.getArticles(false);
      res.json(articles);
    } catch (error) {
      console.error('Admin get articles error:', error);
      res.status(500).json({ message: 'Failed to get articles' });
    }
  });
  
  // Admin: Get article by ID
  app.get('/api/admin/articles/:id', isAdmin, async (req: any, res) => {
    try {
      const { id } = req.params;
      const article = await storage.getArticleById(id);
      
      if (!article) {
        return res.status(404).json({ message: 'Article not found' });
      }
      
      res.json(article);
    } catch (error) {
      console.error('Admin get article error:', error);
      res.status(500).json({ message: 'Failed to get article' });
    }
  });
  
  // Admin: Generate full article from topic
  app.post('/api/admin/articles/generate', isAdmin, async (req: any, res) => {
    try {
      const { topic, title: providedTitle } = req.body;
      
      if (!topic || topic.trim().length < 5) {
        return res.status(400).json({ message: 'Please provide a topic with at least 5 characters' });
      }
      
      // Fetch existing published articles for internal linking and format rotation
      const existingArticles = await storage.getArticles(true);
      const existingArticleData = existingArticles.map(a => ({
        title: a.title,
        slug: a.slug
      }));
      
      // Track formats used in recent articles for rotation
      const recentFormats = existingArticles
        .slice(0, 10)
        .map((a: any) => a.articleFormat)
        .filter(Boolean);
      
      const rawArticle = await generateFullArticle({
        topic: topic.trim(),
        title: providedTitle?.trim() || undefined,
        existingArticles: existingArticleData,
        existingFormats: recentFormats
      });
      
      // Generate fallbacks for missing fields
      const generateSlug = (title: string): string => {
        return title
          .toLowerCase()
          .replace(/[^a-z0-9\s-]/g, '')
          .replace(/\s+/g, '-')
          .replace(/-+/g, '-')
          .substring(0, 60)
          .trim();
      };
      
      const extractExcerpt = (content: string): string => {
        // Strip HTML and get first 150 chars
        const text = content.replace(/<[^>]*>/g, '').trim();
        return text.length > 150 ? text.substring(0, 147) + '...' : text;
      };
      
      // Use provided title if specified, otherwise use generated title
      const finalTitle = providedTitle?.trim() || rawArticle.title || topic.trim();
      
      const article = {
        title: finalTitle,
        slug: rawArticle.slug || generateSlug(finalTitle),
        excerpt: rawArticle.excerpt || extractExcerpt(rawArticle.content || ''),
        content: rawArticle.content || '',
        featuredImageKeywords: rawArticle.featuredImageKeywords || 'email marketing',
        tags: rawArticle.tags || [],
        metaTitle: rawArticle.metaTitle || finalTitle.substring(0, 60),
        metaDescription: rawArticle.metaDescription || (rawArticle.excerpt || extractExcerpt(rawArticle.content || '')).substring(0, 160),
        primaryKeyword: rawArticle.primaryKeyword || '',
        secondaryKeywords: rawArticle.secondaryKeywords || [],
        articleFormat: rawArticle.articleFormat || 'deep-dive'
      };
      
      let featuredImage = '';
      
      // Try to generate image with Nano Banana (Gemini image generation)
      try {
        const imageResult = await generateArticleImage(topic.trim(), article.featuredImageKeywords || 'email marketing');
        
        if (imageResult) {
          // Upload the image to object storage using private directory (used by /objects route)
          const privateDir = process.env.PRIVATE_OBJECT_DIR || '';
          
          if (privateDir) {
            const imageId = randomUUID();
            const extension = imageResult.mimeType === 'image/jpeg' ? 'jpg' : 'png';
            const objectName = `uploads/${imageId}.${extension}`;
            
            // Parse the private directory path (format: /bucket-name/path)
            const fullPath = privateDir.startsWith('/') ? privateDir.slice(1) : privateDir;
            const pathParts = fullPath.split('/');
            const bucketName = pathParts[0];
            const basePath = pathParts.slice(1).join('/');
            
            const bucket = objectStorageClient.bucket(bucketName);
            const filePath = basePath ? `${basePath}/${objectName}` : objectName;
            const file = bucket.file(filePath);
            
            await file.save(imageResult.imageData, {
              contentType: imageResult.mimeType,
              metadata: {
                'custom:aclPolicy': JSON.stringify({ owner: 'system', visibility: 'public' })
              }
            });
            
            // Return the URL to access the image via /objects route
            featuredImage = `/objects/${objectName}`;
          }
        }
      } catch (imageError) {
        console.error('Image generation failed, using fallback:', imageError);
      }
      
      // Fallback to Unsplash if image generation failed
      if (!featuredImage) {
        const imageQuery = encodeURIComponent(article.featuredImageKeywords || 'email marketing');
        featuredImage = `https://source.unsplash.com/1200x630/?${imageQuery}`;
      }
      
      res.json({
        ...article,
        featuredImage
      });
    } catch (error) {
      console.error('Generate article error:', error);
      res.status(500).json({ message: 'Failed to generate article' });
    }
  });
  
  // Admin: Generate SEO suggestions for article
  app.post('/api/admin/articles/seo-suggestions', isAdmin, async (req: any, res) => {
    try {
      const { title, excerpt, content } = req.body;
      
      if (!title || !content) {
        return res.status(400).json({ message: 'Title and content are required' });
      }
      
      if (content.length < 100) {
        return res.status(400).json({ message: 'Content must be at least 100 characters for SEO analysis' });
      }
      
      const suggestions = await generateSEOSuggestions(title, excerpt || '', content);
      res.json(suggestions);
    } catch (error) {
      console.error('Generate SEO suggestions error:', error);
      res.status(500).json({ message: 'Failed to generate SEO suggestions' });
    }
  });
  
  // Admin: Regenerate featured image for article
  app.post('/api/admin/articles/regenerate-image', aiRateLimiter, isAdmin, async (req: any, res) => {
    try {
      const { topic, keywords } = req.body;
      
      if (!topic || typeof topic !== 'string' || topic.trim().length < 3) {
        return res.status(400).json({ message: 'Topic is required (at least 3 characters)' });
      }
      
      // Validate and sanitize keywords - limit length to prevent excessively long prompts
      const rawKeywords = typeof keywords === 'string' ? keywords : '';
      const imageKeywords = rawKeywords.substring(0, 200) || 'email marketing';
      let featuredImage = '';
      
      const imageResult = await generateArticleImage(topic, imageKeywords);
      
      if (imageResult) {
        const privateDir = process.env.PRIVATE_OBJECT_DIR || '';
        
        if (privateDir) {
          const imageId = randomUUID();
          const extension = imageResult.mimeType === 'image/jpeg' ? 'jpg' : 'png';
          const objectName = `uploads/${imageId}.${extension}`;
          
          const fullPath = privateDir.startsWith('/') ? privateDir.slice(1) : privateDir;
          const pathParts = fullPath.split('/');
          const bucketName = pathParts[0];
          const basePath = pathParts.slice(1).join('/');
          
          const bucket = objectStorageClient.bucket(bucketName);
          const filePath = basePath ? `${basePath}/${objectName}` : objectName;
          const file = bucket.file(filePath);
          
          await file.save(imageResult.imageData, {
            contentType: imageResult.mimeType,
            metadata: {
              'custom:aclPolicy': JSON.stringify({ owner: 'system', visibility: 'public' })
            }
          });
          
          featuredImage = `/objects/${objectName}`;
        }
      }
      
      if (!featuredImage) {
        const imageQuery = encodeURIComponent(imageKeywords);
        featuredImage = `https://source.unsplash.com/1200x630/?${imageQuery}`;
      }
      
      res.json({ featuredImage });
    } catch (error) {
      console.error('Regenerate image error:', error);
      res.status(500).json({ message: 'Failed to regenerate image' });
    }
  });
  
  // Admin: Rewrite article content (keeps same topic but generates fresh content)
  app.post('/api/admin/articles/rewrite', aiRateLimiter, isAdmin, async (req: any, res) => {
    try {
      const { topic, title } = req.body;
      
      if (!topic || typeof topic !== 'string' || topic.trim().length < 5) {
        return res.status(400).json({ message: 'Topic is required (at least 5 characters)' });
      }
      
      if (title && typeof title !== 'string') {
        return res.status(400).json({ message: 'Title must be a string' });
      }
      
      // Fetch existing published articles for internal linking and format rotation
      const existingArticles = await storage.getArticles(true);
      const existingArticleData = existingArticles.map(a => ({
        title: a.title,
        slug: a.slug
      }));
      
      // Track formats used in recent articles for rotation
      const recentFormats = existingArticles
        .slice(0, 10)
        .map((a: any) => a.articleFormat)
        .filter(Boolean);
      
      const rawArticle = await generateFullArticle({
        topic: topic.trim(),
        title: title?.trim() || undefined,
        existingArticles: existingArticleData,
        existingFormats: recentFormats
      });
      
      const generateSlug = (t: string): string => {
        return t.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').substring(0, 60).trim();
      };
      
      const extractExcerpt = (content: string): string => {
        const text = content.replace(/<[^>]*>/g, '').trim();
        return text.length > 150 ? text.substring(0, 147) + '...' : text;
      };
      
      const finalTitle = title?.trim() || rawArticle.title || topic.trim();
      
      const article = {
        title: finalTitle,
        slug: rawArticle.slug || generateSlug(finalTitle),
        excerpt: rawArticle.excerpt || extractExcerpt(rawArticle.content || ''),
        content: rawArticle.content || '',
        tags: rawArticle.tags || [],
        metaTitle: rawArticle.metaTitle || finalTitle.substring(0, 60),
        metaDescription: rawArticle.metaDescription || (rawArticle.excerpt || extractExcerpt(rawArticle.content || '')).substring(0, 160)
      };
      
      res.json(article);
    } catch (error) {
      console.error('Rewrite article error:', error);
      res.status(500).json({ message: 'Failed to rewrite article' });
    }
  });
  
  // Admin: Create article
  app.post('/api/admin/articles', isAdmin, async (req: any, res) => {
    try {
      const adminId = req.user.claims.sub;
      const { title, slug, excerpt, content, featuredImage, tags, metaTitle, metaDescription, published } = req.body;
      
      if (!title || !slug || !content) {
        return res.status(400).json({ message: 'Title, slug, and content are required' });
      }
      
      // Check for duplicate slug
      const existing = await storage.getArticleBySlug(slug);
      if (existing) {
        return res.status(400).json({ message: 'An article with this URL slug already exists' });
      }
      
      const article = await storage.createArticle({
        title,
        slug: slug.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-'),
        excerpt: excerpt || null,
        content,
        featuredImage: featuredImage || null,
        tags: tags || [],
        metaTitle: metaTitle || title,
        metaDescription: metaDescription || excerpt || null,
        published: published || false,
        authorId: adminId,
        publishedAt: published ? new Date() : null,
      });
      
      res.json(article);
    } catch (error) {
      console.error('Create article error:', error);
      res.status(500).json({ message: 'Failed to create article' });
    }
  });
  
  // Admin: Update article
  app.patch('/api/admin/articles/:id', isAdmin, async (req: any, res) => {
    try {
      const { id } = req.params;
      const { title, slug, excerpt, content, featuredImage, tags, metaTitle, metaDescription, published } = req.body;
      
      const existing = await storage.getArticleById(id);
      if (!existing) {
        return res.status(404).json({ message: 'Article not found' });
      }
      
      // Check for duplicate slug if changed
      if (slug && slug !== existing.slug) {
        const slugCheck = await storage.getArticleBySlug(slug);
        if (slugCheck && slugCheck.id !== id) {
          return res.status(400).json({ message: 'An article with this URL slug already exists' });
        }
      }
      
      const updates: any = {};
      if (title !== undefined) updates.title = title;
      if (slug !== undefined) updates.slug = slug.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-');
      if (excerpt !== undefined) updates.excerpt = excerpt;
      if (content !== undefined) updates.content = content;
      if (featuredImage !== undefined) updates.featuredImage = featuredImage;
      if (tags !== undefined) updates.tags = tags;
      if (metaTitle !== undefined) updates.metaTitle = metaTitle;
      if (metaDescription !== undefined) updates.metaDescription = metaDescription;
      if (published !== undefined) {
        updates.published = published;
        if (published && !existing.publishedAt) {
          updates.publishedAt = new Date();
        }
      }
      
      const article = await storage.updateArticle(id, updates);
      res.json(article);
    } catch (error) {
      console.error('Update article error:', error);
      res.status(500).json({ message: 'Failed to update article' });
    }
  });
  
  // Admin: Delete article
  app.delete('/api/admin/articles/:id', isAdmin, async (req: any, res) => {
    try {
      const { id } = req.params;
      await storage.deleteArticle(id);
      res.json({ success: true });
    } catch (error) {
      console.error('Delete article error:', error);
      res.status(500).json({ message: 'Failed to delete article' });
    }
  });

  // Manual Campaign Stats Routes
  app.get('/api/manual-campaign-stats', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const stats = await storage.getManualCampaignStats(userId);
      res.json(stats);
    } catch (error) {
      console.error('Get manual campaign stats error:', error);
      res.status(500).json({ message: 'Failed to get manual campaign stats' });
    }
  });

  app.get('/api/manual-campaign-stats/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { id } = req.params;
      const stats = await storage.getManualCampaignStatsById(id, userId);
      
      if (!stats) {
        return res.status(404).json({ message: 'Stats not found' });
      }
      
      res.json(stats);
    } catch (error) {
      console.error('Get manual campaign stats by id error:', error);
      res.status(500).json({ message: 'Failed to get manual campaign stats' });
    }
  });

  app.post('/api/manual-campaign-stats', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const parseResult = manualCampaignStatsSchema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({ message: 'Invalid campaign data', errors: parseResult.error.flatten() });
      }
      
      const { campaignName, ...metrics } = parseResult.data;
      const stats = await storage.createManualCampaignStats({
        userId,
        campaignName: campaignName.trim(),
        ...metrics
      });
      
      res.json(stats);
    } catch (error) {
      console.error('Create manual campaign stats error:', error);
      res.status(500).json({ message: 'Failed to create manual campaign stats' });
    }
  });

  app.patch('/api/manual-campaign-stats/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { id } = req.params;
      const parseResult = manualCampaignStatsSchema.partial().safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({ message: 'Invalid update data', errors: parseResult.error.flatten() });
      }
      
      const existing = await storage.getManualCampaignStatsById(id, userId);
      if (!existing) {
        return res.status(404).json({ message: 'Stats not found' });
      }
      
      const stats = await storage.updateManualCampaignStats(id, userId, parseResult.data);
      res.json(stats);
    } catch (error) {
      console.error('Update manual campaign stats error:', error);
      res.status(500).json({ message: 'Failed to update manual campaign stats' });
    }
  });

  app.delete('/api/manual-campaign-stats/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { id } = req.params;
      
      const existing = await storage.getManualCampaignStatsById(id, userId);
      if (!existing) {
        return res.status(404).json({ message: 'Stats not found' });
      }
      
      await storage.deleteManualCampaignStats(id, userId);
      res.json({ success: true });
    } catch (error) {
      console.error('Delete manual campaign stats error:', error);
      res.status(500).json({ message: 'Failed to delete manual campaign stats' });
    }
  });

  // Email unsubscribe endpoint
  app.get('/api/unsubscribe/:userId', async (req, res) => {
    try {
      const { userId } = req.params;
      if (!userId) {
        return res.status(400).json({ message: 'Invalid unsubscribe link' });
      }

      await storage.updateUser(userId, { emailUnsubscribed: true });
      res.json({ 
        success: true, 
        message: 'You have been unsubscribed from Acceptafy emails.' 
      });
    } catch (error) {
      console.error('Unsubscribe error:', error);
      res.status(500).json({ message: 'Failed to process unsubscribe request' });
    }
  });

  // Admin blog announcement endpoint
  app.post('/api/admin/blog-announcement', isAdmin, async (req: any, res) => {
    try {
      const { subject, previewText, blogTitle, blogSummary, blogUrl } = req.body;

      if (!subject || !blogTitle || !blogUrl) {
        return res.status(400).json({ 
          message: 'Subject, blog title, and blog URL are required' 
        });
      }

      const adminId = req.user?.claims?.sub;
      if (!adminId) {
        return res.status(401).json({ message: 'Admin not authenticated' });
      }

      const result = await sendBlogAnnouncement(
        subject,
        previewText || '',
        blogTitle,
        blogSummary || '',
        blogUrl,
        adminId
      );

      if (result.success) {
        res.json({ 
          success: true, 
          recipientCount: result.recipientCount,
          message: `Blog announcement sent to ${result.recipientCount} users`
        });
      } else {
        res.status(500).json({ 
          success: false, 
          message: 'Failed to send blog announcement',
          errors: result.errors
        });
      }
    } catch (error) {
      console.error('Blog announcement error:', error);
      res.status(500).json({ message: 'Failed to send blog announcement' });
    }
  });

  // Get blog announcement history
  app.get('/api/admin/blog-announcements', isAdmin, async (req: any, res) => {
    try {
      const announcements = await storage.getBlogAnnouncementHistory();
      res.json(announcements);
    } catch (error) {
      console.error('Get blog announcements error:', error);
      res.status(500).json({ message: 'Failed to get blog announcement history' });
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
