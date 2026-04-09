import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, jsonb, index, boolean, uniqueIndex } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table (required for Replit Auth)
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table (required for Replit Auth + SaaS features)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  passwordHash: varchar("password_hash"),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  stripeCustomerId: varchar("stripe_customer_id"),
  stripeSubscriptionId: varchar("stripe_subscription_id"),
  subscriptionStatus: varchar("subscription_status").default("active"),
  subscriptionTier: varchar("subscription_tier").default("starter"),
  role: varchar("role").default("user"),
  emailVerified: boolean("email_verified").default(false),
  emailVerificationToken: varchar("email_verification_token"),
  emailVerificationExpires: timestamp("email_verification_expires"),
  lastLoginAt: timestamp("last_login_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  // Physical address fields for CAN-SPAM compliance and communication
  addressLine1: varchar("address_line1"),
  addressLine2: varchar("address_line2"),
  city: varchar("city"),
  stateProvince: varchar("state_province"),
  postalCode: varchar("postal_code"),
  country: varchar("country"),
  companyName: varchar("company_name"),
  phone: varchar("phone"),
  emailUnsubscribed: boolean("email_unsubscribed").default(false),
  onboardingEmailsSent: integer("onboarding_emails_sent").default(0),
  lastOnboardingEmailAt: timestamp("last_onboarding_email_at"),
  listVerificationCredits: integer("list_verification_credits").default(0),
});

export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

// Usage tracking table
export const usageCounters = pgTable("usage_counters", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  periodStart: timestamp("period_start").notNull(),
  periodEnd: timestamp("period_end").notNull(),
  gradeCount: integer("grade_count").default(0),
  rewriteCount: integer("rewrite_count").default(0),
  followupCount: integer("followup_count").default(0),
  deliverabilityChecks: integer("deliverability_checks").default(0),
  aiTokensUsed: integer("ai_tokens_used").default(0),
  listVerifications: integer("list_verifications").default(0),
});

export type UsageCounter = typeof usageCounters.$inferSelect;
export type InsertUsageCounter = typeof usageCounters.$inferInsert;

// Daily usage tracking table (resets each day to prevent burst abuse)
export const dailyUsageCounters = pgTable("daily_usage_counters", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  date: varchar("date").notNull(), // YYYY-MM-DD format for easy comparison
  gradeCount: integer("grade_count").default(0),
  rewriteCount: integer("rewrite_count").default(0),
  followupCount: integer("followup_count").default(0),
  deliverabilityChecks: integer("deliverability_checks").default(0),
  listVerifications: integer("list_verifications").default(0),
});

export type DailyUsageCounter = typeof dailyUsageCounters.$inferSelect;
export type InsertDailyUsageCounter = typeof dailyUsageCounters.$inferInsert;

// Email analyses history table (replaces localStorage)
export const emailAnalyses = pgTable("email_analyses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  subject: text("subject"),
  previewText: text("preview_text"),
  body: text("body"),
  variations: jsonb("variations"),
  result: jsonb("result").notNull(),
  score: integer("score"),
  grade: varchar("grade"),
  createdAt: timestamp("created_at").defaultNow(),
});

export type EmailAnalysis = typeof emailAnalyses.$inferSelect;
export type InsertEmailAnalysis = typeof emailAnalyses.$inferInsert;

// Gamification data table
export const userGamification = pgTable("user_gamification", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id).unique(),
  xp: integer("xp").default(0),
  level: integer("level").default(1),
  streak: integer("streak").default(0),
  lastActiveDate: varchar("last_active_date"),
  achievements: jsonb("achievements").default(sql`'[]'::jsonb`),
  totalGrades: integer("total_grades").default(0),
  totalRewrites: integer("total_rewrites").default(0),
  totalFollowups: integer("total_followups").default(0),
  totalDeliverabilityChecks: integer("total_deliverability_checks").default(0),
  bestScore: integer("best_score").default(0),
  perfectScoreCount: integer("perfect_score_count").default(0),
  aPlusCount: integer("a_plus_count").default(0),
  previousRank: integer("previous_rank"),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type UserGamification = typeof userGamification.$inferSelect;
export type InsertUserGamification = typeof userGamification.$inferInsert;

export const insertUserGamificationSchema = createInsertSchema(userGamification).omit({ id: true, updatedAt: true });
export type NewUserGamification = z.infer<typeof insertUserGamificationSchema>;

// Email templates table (saved emails for reuse)
export const emailTemplates = pgTable("email_templates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  name: varchar("name").notNull(),
  subject: text("subject"),
  previewText: text("preview_text"),
  body: text("body").notNull(),
  category: varchar("category"),
  lastScore: integer("last_score"),
  lastGrade: varchar("last_grade"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type EmailTemplate = typeof emailTemplates.$inferSelect;
export type InsertEmailTemplate = typeof emailTemplates.$inferInsert;

export const insertEmailTemplateSchema = createInsertSchema(emailTemplates).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Competitor analyses table
export const competitorAnalyses = pgTable("competitor_analyses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  competitorEmail: text("competitor_email").notNull(),
  analysis: jsonb("analysis").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export type CompetitorAnalysis = typeof competitorAnalyses.$inferSelect;
export type InsertCompetitorAnalysis = typeof competitorAnalyses.$inferInsert;

// Manual campaign statistics table (user-entered metrics)
export const manualCampaignStats = pgTable("manual_campaign_stats", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  campaignName: varchar("campaign_name").notNull(),
  totalSent: integer("total_sent"),
  delivered: integer("delivered"),
  deliveredType: varchar("delivered_type").default("number"), // "number" or "percentage"
  opened: integer("opened"),
  openedType: varchar("opened_type").default("number"),
  clicked: integer("clicked"),
  clickedType: varchar("clicked_type").default("number"),
  conversion: integer("conversion"),
  conversionType: varchar("conversion_type").default("number"),
  softBounced: integer("soft_bounced"),
  softBouncedType: varchar("soft_bounced_type").default("number"),
  hardBounced: integer("hard_bounced"),
  hardBouncedType: varchar("hard_bounced_type").default("number"),
  unsubscribed: integer("unsubscribed"),
  unsubscribedType: varchar("unsubscribed_type").default("number"),
  skipped: integer("skipped"),
  skippedType: varchar("skipped_type").default("number"),
  spam: integer("spam"),
  spamType: varchar("spam_type").default("number"),
  forwards: integer("forwards"),
  forwardsType: varchar("forwards_type").default("number"),
  revenue: integer("revenue"), // Revenue in cents
  revenueType: varchar("revenue_type").default("number"),
  avgTimeToOpen: integer("avg_time_to_open"), // Average time to open in minutes
  avgTimeToOpenType: varchar("avg_time_to_open_type").default("number"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type ManualCampaignStats = typeof manualCampaignStats.$inferSelect;
export type InsertManualCampaignStats = typeof manualCampaignStats.$inferInsert;

export const insertManualCampaignStatsSchema = createInsertSchema(manualCampaignStats).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Subscription tier limits - designed to prevent abuse while providing value
// Daily limits prevent burst abuse while monthly limits cap total usage
export const SUBSCRIPTION_LIMITS = {
  starter: {
    gradesPerMonth: 3,
    rewritesPerMonth: 3,
    followupsPerMonth: 5,
    deliverabilityChecksPerMonth: 3,
    gradesPerDay: 3,
    rewritesPerDay: 3,
    followupsPerDay: 5,
    deliverabilityChecksPerDay: 3,
    historyLimit: 10,
    advancedSpamAnalysis: false,
    whitelabelReports: false,
    monitoredDomains: 1,
    campaignRiskAnalysis: false,
    competitorAnalysis: false,
    inboxSimulation: false,
    funnelAnalysis: false,
    sequenceGenerator: false,
    warmupPlan: false,
    askAcceptafy: false,
    askAcceptafyPerDay: 0,
    askAcceptafyPerMonth: 0,
    listVerificationsPerMonth: 0,
  },
  pro: {
    gradesPerMonth: 600,
    rewritesPerMonth: 300,
    followupsPerMonth: 150,
    deliverabilityChecksPerMonth: 100,
    gradesPerDay: 50,
    rewritesPerDay: 25,
    followupsPerDay: 15,
    deliverabilityChecksPerDay: 10,
    historyLimit: 5000,
    advancedSpamAnalysis: true,
    whitelabelReports: false,
    monitoredDomains: 5,
    campaignRiskAnalysis: true,
    competitorAnalysis: true,
    inboxSimulation: true,
    funnelAnalysis: true,
    sequenceGenerator: true,
    warmupPlan: true,
    askAcceptafy: true,
    askAcceptafyPerDay: 50,
    askAcceptafyPerMonth: 500,
    listVerificationsPerMonth: 2000,
  },
  scale: {
    gradesPerMonth: 2500,
    rewritesPerMonth: 1200,
    followupsPerMonth: 600,
    deliverabilityChecksPerMonth: 400,
    gradesPerDay: 150,
    rewritesPerDay: 75,
    followupsPerDay: 40,
    deliverabilityChecksPerDay: 25,
    historyLimit: 50000,
    advancedSpamAnalysis: true,
    whitelabelReports: true,
    monitoredDomains: 20,
    campaignRiskAnalysis: true,
    competitorAnalysis: true,
    inboxSimulation: true,
    funnelAnalysis: true,
    sequenceGenerator: true,
    warmupPlan: true,
    askAcceptafy: true,
    askAcceptafyPerDay: 200,
    askAcceptafyPerMonth: 2000,
    listVerificationsPerMonth: 5000,
  },
} as const;

// Pricing information (yearly = 10 months, 2 months free = ~17% savings)
export const PRICING = {
  starter: { monthly: 0, yearly: 0, name: 'Starter', tagline: 'Perfect for trying things out' },
  pro: { monthly: 59, yearly: 590, name: 'Pro', tagline: 'For growing email marketers' },
  scale: { monthly: 149, yearly: 1490, name: 'Scale', tagline: 'For teams & agencies' },
} as const;

// Overage pricing (per pack)
export const OVERAGE_PRICING = {
  grades: { amount: 100, price: 5 },
  rewrites: { amount: 50, price: 5 },
  deliverability: { amount: 25, price: 5 },
} as const;

export type SubscriptionTier = keyof typeof SUBSCRIPTION_LIMITS;

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;

// Base types used by both client and server
export const sectionGradeSchema = z.object({
  grade: z.string(),
  summary: z.string(),
  feedback: z.array(z.string()),
});
export type SectionGrade = z.infer<typeof sectionGradeSchema>;

export const spamTriggerSchema = z.object({
  word: z.string(),
  reason: z.string(),
  suggestions: z.array(z.string()),
  suggestion: z.string(),
  severity: z.enum(['High', 'Medium', 'Low']),
  rephraseExamples: z.array(z.string()),
});
export type SpamTrigger = z.infer<typeof spamTriggerSchema>;

export const structuralFindingSchema = z.object({
  type: z.enum(['Capitalization', 'Punctuation', 'Sentence Structure']),
  summary: z.string(),
  feedback: z.string(),
  suggestion: z.string(),
  severity: z.enum(['High', 'Medium', 'Low']),
  originalText: z.string(),
});
export type StructuralFinding = z.infer<typeof structuralFindingSchema>;

export const subjectLineVariationSchema = z.object({
  subject: z.string(),
  previewText: z.string(),
  predictionScore: z.number(),
  rationale: z.string(),
  isWinner: z.boolean(),
});
export type SubjectLineVariation = z.infer<typeof subjectLineVariationSchema>;

export const personalizationScoreSchema = z.object({
  score: z.number(),
  summary: z.string(),
  feedback: z.array(z.string()),
});
export type PersonalizationScore = z.infer<typeof personalizationScoreSchema>;

export const linkAnalysisFindingSchema = z.object({
  url: z.string(),
  anchorText: z.string(),
  status: z.enum(['Good', 'Warning', 'Bad']),
  reason: z.string(),
  suggestion: z.string(),
});
export type LinkAnalysisFinding = z.infer<typeof linkAnalysisFindingSchema>;

export const replyAbilityAnalysisSchema = z.object({
  score: z.number(),
  summary: z.string(),
  feedback: z.array(z.string()),
});
export type ReplyAbilityAnalysis = z.infer<typeof replyAbilityAnalysisSchema>;

export const plainTextAnalysisSchema = z.object({
  plainTextVersion: z.string(),
  readabilityScore: z.number(),
  feedback: z.array(z.string()),
});
export type PlainTextAnalysis = z.infer<typeof plainTextAnalysisSchema>;

export const inboxPlacementPredictionSchema = z.object({
  gmail: z.object({ placement: z.enum(['Primary', 'Promotions', 'Spam']), reason: z.string() }),
  outlook: z.object({ placement: z.enum(['Focused', 'Other', 'Junk']), reason: z.string() }),
  appleMail: z.object({ placement: z.enum(['Inbox', 'Junk']), reason: z.string() }),
});
export type InboxPlacementPrediction = z.infer<typeof inboxPlacementPredictionSchema>;

export const accessibilityFindingSchema = z.object({
  type: z.enum(['Alt Text', 'Contrast', 'Semantic HTML', 'Link Text']),
  summary: z.string(),
  suggestion: z.string(),
  severity: z.enum(['High', 'Medium', 'Low']),
});
export type AccessibilityFinding = z.infer<typeof accessibilityFindingSchema>;

export const imageAnalysisSchema = z.object({
  score: z.number().optional(),
  summary: z.string().optional(),
  textToImageRatio: z.object({
    textPercent: z.number(),
    imagePercent: z.number(),
    status: z.string(),
    recommendation: z.string(),
  }).optional(),
  images: z.array(z.object({
    index: z.number(),
    hasAltText: z.boolean(),
    altTextQuality: z.string(),
    dimensionAnalysis: z.string(),
    sizeAnalysis: z.string(),
    placementFeedback: z.string(),
    deliverabilityImpact: z.string(),
  })).optional(),
  feedback: z.array(z.string()).optional(),
});
export type ImageAnalysis = z.infer<typeof imageAnalysisSchema>;

export const gradingResultSchema = z.object({
  inboxPlacementScore: z.object({ score: z.number(), summary: z.string() }),
  overallGrade: z.object({ grade: z.string(), summary: z.string() }),
  subjectLine: sectionGradeSchema,
  previewText: sectionGradeSchema,
  bodyCopy: sectionGradeSchema,
  callToAction: sectionGradeSchema,
  spamAnalysis: z.array(spamTriggerSchema),
  structuralAnalysis: z.array(structuralFindingSchema),
  subjectLineAnalysis: z.array(subjectLineVariationSchema),
  personalizationScore: personalizationScoreSchema,
  linkAnalysis: z.array(linkAnalysisFindingSchema),
  replyAbilityAnalysis: replyAbilityAnalysisSchema,
  plainTextAnalysis: plainTextAnalysisSchema,
  inboxPlacementPrediction: inboxPlacementPredictionSchema,
  accessibilityAnalysis: z.array(accessibilityFindingSchema),
  imageAnalysis: imageAnalysisSchema.optional(),
});
export type GradingResult = z.infer<typeof gradingResultSchema>;

export const rewrittenEmailSchema = z.object({
  subject: z.string(),
  previewText: z.string(),
  body: z.string(),
});
export type RewrittenEmail = z.infer<typeof rewrittenEmailSchema>;

export const followUpEmailSchema = z.object({
  subject: z.string(),
  body: z.string(),
});
export type FollowUpEmail = z.infer<typeof followUpEmailSchema>;

export const followUpSequenceEmailSchema = z.object({
  timingSuggestion: z.string(),
  subject: z.string(),
  body: z.string(),
  rationale: z.string(),
});
export type FollowUpSequenceEmail = z.infer<typeof followUpSequenceEmailSchema>;

export const dnsRecordsSchema = z.object({
  spf: z.string(),
  dkim: z.string(),
  dmarc: z.string(),
});
export type DnsRecords = z.infer<typeof dnsRecordsSchema>;

export const sentenceGradeSchema = z.object({
  isGood: z.boolean(),
  feedback: z.string(),
});
export type SentenceGrade = z.infer<typeof sentenceGradeSchema>;

export const domainHealthSchema = z.object({
  status: z.enum(['Clean', 'Warning', 'Blacklisted']),
  report: z.string(),
  recommendation: z.string(),
});
export type DomainHealth = z.infer<typeof domainHealthSchema>;

export const listQualityAnalysisSchema = z.object({
  roleBasedAccountPercentage: z.number(),
  freeMailProviderPercentage: z.number(),
  disposableDomainIndicators: z.boolean(),
  spamTrapIndicators: z.boolean(),
  summaryReport: z.string(),
});
export type ListQualityAnalysis = z.infer<typeof listQualityAnalysisSchema>;

export const bimiRecordSchema = z.object({
  dmarcPrerequisite: z.string(),
  logoRequirements: z.string(),
  bimiRecord: z.string(),
});
export type BimiRecord = z.infer<typeof bimiRecordSchema>;

export const glossaryTermSchema = z.object({
  simpleDefinition: z.string(),
  detailedExplanation: z.string(),
  practicalExample: z.string(),
});
export type GlossaryTerm = z.infer<typeof glossaryTermSchema>;

// Subject Variation schemas
export const subjectVariationSchema = z.object({
  subject: z.string(),
  previewText: z.string(),
  predictedOpenRate: z.number(),
  style: z.string(),
  rationale: z.string(),
});

export type SubjectVariation = z.infer<typeof subjectVariationSchema>;

export const generateVariationsRequestSchema = z.object({
  subject: z.string().min(1, "Subject is required"),
  preview: z.string().optional().default(''),
  body: z.string().min(1, "Body is required"),
});

// Optimization Roadmap schemas
export const optimizationItemSchema = z.object({
  priority: z.number(),
  category: z.string(),
  issue: z.string(),
  action: z.string(),
  impact: z.string(),
  actionType: z.enum(["quickfix", "rewrite", "manual"]),
  targetWord: z.string().optional(),
  replacement: z.string().optional(),
});

export type OptimizationItem = z.infer<typeof optimizationItemSchema>;

// Tone Rewrite schemas
export const toneRewriteSchema = z.object({
  subject: z.string(),
  previewText: z.string(),
  body: z.string(),
  toneNotes: z.string(),
});

export type ToneRewrite = z.infer<typeof toneRewriteSchema>;

export const generateToneRewriteRequestSchema = z.object({
  subject: z.string().min(1, "Subject is required"),
  preview: z.string().optional().default(''),
  body: z.string().min(1, "Body is required"),
  tone: z.enum(["professional", "friendly", "urgent", "fomo", "storytelling"]),
});

// Email Preview schemas
export const emailPreviewSchema = z.object({
  gmail: z.object({
    inboxDisplay: z.string(),
    mobileDisplay: z.string(),
  }),
  outlook: z.object({
    inboxDisplay: z.string(),
    mobileDisplay: z.string(),
  }),
  apple: z.object({
    inboxDisplay: z.string(),
    mobileDisplay: z.string(),
  }),
  characterCounts: z.object({
    subject: z.number(),
    preview: z.number(),
    subjectOptimal: z.boolean(),
    previewOptimal: z.boolean(),
  }),
  truncationWarnings: z.array(z.string()),
});

export type EmailPreview = z.infer<typeof emailPreviewSchema>;

export const generatePreviewRequestSchema = z.object({
  subject: z.string().min(1, "Subject is required"),
  previewText: z.string(),
  senderName: z.string().optional(),
});

// Sender Score Estimator schemas
export const senderScoreInputSchema = z.object({
  domain: z.string().min(1, "Domain is required"),
  hasSpf: z.boolean(),
  hasDkim: z.boolean(),
  hasDmarc: z.boolean(),
  listSize: z.number().min(0),
  avgOpenRate: z.number().min(0).max(100),
  avgBounceRate: z.number().min(0).max(100),
  avgComplaintRate: z.number().min(0).max(100),
  sendingFrequency: z.enum(["daily", "weekly", "biweekly", "monthly", "irregular"]),
  listAgeMonths: z.number().min(0),
  usesDoubleOptIn: z.boolean(),
  hasUnsubscribeLink: z.boolean(),
  sendsFromDedicatedIp: z.boolean(),
});

export type SenderScoreInput = z.infer<typeof senderScoreInputSchema>;

export interface SenderScoreResult {
  overallScore: number;
  grade: string;
  categories: {
    authentication: { score: number; feedback: string };
    listHygiene: { score: number; feedback: string };
    engagement: { score: number; feedback: string };
    infrastructure: { score: number; feedback: string };
    bestPractices: { score: number; feedback: string };
  };
  topIssues: string[];
  recommendations: string[];
  comparisonToIndustry: string;
}

// Competitor Analysis schemas
export const competitorAnalysisResultSchema = z.object({
  strengths: z.array(z.object({
    point: z.string(),
    explanation: z.string(),
    howToApply: z.string(),
  })),
  weaknesses: z.array(z.object({
    point: z.string(),
    explanation: z.string(),
    yourOpportunity: z.string(),
  })),
  tactics: z.array(z.object({
    tactic: z.string(),
    description: z.string(),
    effectiveness: z.enum(['High', 'Medium', 'Low']),
  })),
  overallAssessment: z.string(),
  keyTakeaways: z.array(z.string()),
  suggestedImprovements: z.array(z.string()),
});

export type CompetitorAnalysisResult = z.infer<typeof competitorAnalysisResultSchema>;

// Enhanced Inbox Placement Simulation schemas with deep analysis
const confidenceBreakdownSchema = z.object({
  contentScore: z.number().min(0).max(100).default(50),
  structureScore: z.number().min(0).max(100).default(50),
  authenticationScore: z.number().min(0).max(100).default(50),
  reputationScore: z.number().min(0).max(100).default(50),
});

const providerAnalysisSchema = z.object({
  placement: z.string(),
  confidence: z.number().min(0).max(100).default(50),
  confidenceBreakdown: confidenceBreakdownSchema.optional(),
  factors: z.array(z.object({
    factor: z.string(),
    impact: z.enum(['Positive', 'Negative', 'Neutral']).default('Neutral'),
    weight: z.number().min(0).max(100).default(50),
    explanation: z.string(),
  })).default([]),
  providerSpecificNotes: z.string().optional().default(''),
  recommendations: z.array(z.string()).default([]),
});

const htmlAnalysisSchema = z.object({
  hasInlineStyles: z.boolean().default(false),
  usesTableLayout: z.boolean().default(false),
  hasExternalResources: z.boolean().default(false),
  cssComplexity: z.enum(['Simple', 'Moderate', 'Complex']).default('Simple'),
  structureScore: z.number().min(0).max(100).default(50),
  issues: z.array(z.string()).default([]),
  recommendations: z.array(z.string()).default([]),
});

const imageTextRatioSchema = z.object({
  ratio: z.number().min(0).max(1).default(0),
  rating: z.enum(['Excellent', 'Good', 'Fair', 'Poor', 'Critical']).default('Good'),
  estimatedImageCount: z.number().min(0).default(0),
  textPercentage: z.number().min(0).max(100).default(100),
  recommendation: z.string().default(''),
});

const authenticationImpactSchema = z.object({
  spfImpact: z.enum(['Critical', 'High', 'Medium', 'Low']).default('Medium'),
  dkimImpact: z.enum(['Critical', 'High', 'Medium', 'Low']).default('Medium'),
  dmarcImpact: z.enum(['Critical', 'High', 'Medium', 'Low']).default('Medium'),
  overallAuthScore: z.number().min(0).max(100).default(50),
  missingAuthentication: z.array(z.string()).default([]),
  recommendation: z.string().default(''),
});

const patternMatchingSchema = z.object({
  matchedPatterns: z.array(z.object({
    pattern: z.string(),
    category: z.enum(['Spam', 'Promotional', 'Transactional', 'Personal']).default('Personal'),
    severity: z.enum(['High', 'Medium', 'Low']).default('Low'),
    description: z.string(),
  })).default([]),
  spamSignatureScore: z.number().min(0).max(100).default(0),
  promotionalSignatureScore: z.number().min(0).max(100).default(0),
  transactionalSignatureScore: z.number().min(0).max(100).default(0),
  personalSignatureScore: z.number().min(0).max(100).default(0),
  dominantCategory: z.enum(['Spam', 'Promotional', 'Transactional', 'Personal']).default('Personal'),
});

export const inboxPlacementSimulationSchema = z.object({
  gmail: providerAnalysisSchema,
  outlook: providerAnalysisSchema,
  yahoo: providerAnalysisSchema,
  appleMail: providerAnalysisSchema,
  overallScore: z.number().min(0).max(100).default(50),
  summary: z.string().default('Unable to analyze'),
  topRisks: z.array(z.string()).default([]),
  topOpportunities: z.array(z.string()).default([]),
  htmlAnalysis: htmlAnalysisSchema.optional(),
  imageTextRatio: imageTextRatioSchema.optional(),
  authenticationImpact: authenticationImpactSchema.optional(),
  patternMatching: patternMatchingSchema.optional(),
});

export type InboxPlacementSimulation = z.infer<typeof inboxPlacementSimulationSchema>;
export type ProviderAnalysis = z.infer<typeof providerAnalysisSchema>;
export type HtmlAnalysis = z.infer<typeof htmlAnalysisSchema>;
export type ImageTextRatio = z.infer<typeof imageTextRatioSchema>;
export type AuthenticationImpact = z.infer<typeof authenticationImpactSchema>;
export type PatternMatching = z.infer<typeof patternMatchingSchema>;

// Benchmark Feedback schema
export const benchmarkFeedbackSchema = z.object({
  industryComparison: z.string().nullable(),
  emailTypeComparison: z.string().nullable(),
  benchmarkInsights: z.array(z.string()),
  industryPercentile: z.number().nullable(),
  emailTypePercentile: z.number().nullable(),
});
export type BenchmarkFeedback = z.infer<typeof benchmarkFeedbackSchema>;

// Password reset tokens table
export const passwordResetTokens = pgTable("password_reset_tokens", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  token: varchar("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  usedAt: timestamp("used_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export type PasswordResetToken = typeof passwordResetTokens.$inferSelect;
export type InsertPasswordResetToken = typeof passwordResetTokens.$inferInsert;

// Admin notes on users table
export const adminNotes = pgTable("admin_notes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  adminId: varchar("admin_id").notNull().references(() => users.id),
  note: text("note").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export type AdminNote = typeof adminNotes.$inferSelect;
export type InsertAdminNote = typeof adminNotes.$inferInsert;

// Agency Branding table for whitelabel reports
export const agencyBranding = pgTable("agency_branding", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id).unique(),
  agencyName: varchar("agency_name"),
  logoUrl: varchar("logo_url"),
  primaryColor: varchar("primary_color").default("#a855f7"),
  secondaryColor: varchar("secondary_color").default("#ec4899"),
  footerText: text("footer_text"),
  introText: text("intro_text"),
  contactEmail: varchar("contact_email"),
  contactPhone: varchar("contact_phone"),
  website: varchar("website"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type AgencyBranding = typeof agencyBranding.$inferSelect;
export type InsertAgencyBranding = typeof agencyBranding.$inferInsert;

export const insertAgencyBrandingSchema = createInsertSchema(agencyBranding).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Agency Branding Zod schema for validation
export const agencyBrandingSchema = z.object({
  agencyName: z.string().optional(),
  logoUrl: z.string().optional(),
  primaryColor: z.string().optional(),
  secondaryColor: z.string().optional(),
  footerText: z.string().optional(),
  introText: z.string().optional(),
  contactEmail: z.string().email().optional().or(z.literal('')),
  contactPhone: z.string().optional(),
  website: z.string().optional(),
});

// ESP Connections table for storing user's email service provider credentials
export const espConnections = pgTable("esp_connections", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  provider: varchar("provider").notNull(), // sendgrid, mailchimp, activecampaign, hubspot, etc.
  apiKey: text("api_key"), // Encrypted API key
  apiUrl: text("api_url"), // For providers like ActiveCampaign that need a URL
  appId: varchar("app_id"), // For providers like Ontraport
  accessToken: text("access_token"), // For OAuth providers
  refreshToken: text("refresh_token"), // For OAuth providers
  accountName: varchar("account_name"),
  accountEmail: varchar("account_email"),
  isConnected: boolean("is_connected").default(false),
  lastSyncAt: timestamp("last_sync_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type ESPConnection = typeof espConnections.$inferSelect;
export type InsertESPConnection = typeof espConnections.$inferInsert;

export const insertESPConnectionSchema = createInsertSchema(espConnections).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// ESP Provider enum
export const espProviderSchema = z.enum([
  'sendgrid',
  'mailchimp',
  'activecampaign',
  'hubspot',
  'constantcontact',
  'convertkit',
  'klaviyo',
  'drip',
  'aweber',
  'highlevel',
  'ontraport',
  'keap'
]);

export type ESPProviderType = z.infer<typeof espProviderSchema>;

// ESP Campaign Stats schema
export const espCampaignStatsSchema = z.object({
  campaignId: z.string(),
  campaignName: z.string(),
  subject: z.string().optional(),
  sentAt: z.string().optional(),
  totalSent: z.number(),
  delivered: z.number(),
  opened: z.number(),
  clicked: z.number(),
  bounced: z.number(),
  unsubscribed: z.number(),
  spamReports: z.number(),
  openRate: z.number(),
  clickRate: z.number(),
  bounceRate: z.number(),
  unsubscribeRate: z.number(),
});

export type ESPCampaignStats = z.infer<typeof espCampaignStatsSchema>;

// ESP Stats Summary schema
export const espStatsSummarySchema = z.object({
  provider: espProviderSchema,
  accountName: z.string().optional(),
  campaigns: z.array(espCampaignStatsSchema),
  totals: z.object({
    totalCampaigns: z.number(),
    totalSent: z.number(),
    totalDelivered: z.number(),
    totalOpened: z.number(),
    totalClicked: z.number(),
    avgOpenRate: z.number(),
    avgClickRate: z.number(),
    avgBounceRate: z.number(),
  }),
  lastSyncAt: z.string().optional(),
});

export type ESPStatsSummary = z.infer<typeof espStatsSummarySchema>;

// ESP Connection Request schema
export const connectESPRequestSchema = z.object({
  provider: espProviderSchema,
  apiKey: z.string().optional(),
  apiUrl: z.string().optional(),
  appId: z.string().optional(),
});

export type ConnectESPRequest = z.infer<typeof connectESPRequestSchema>;

// Contact messages table for support widget
export const contactMessages = pgTable("contact_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  email: varchar("email").notNull(),
  message: text("message").notNull(),
  status: varchar("status").default("unread"),
  createdAt: timestamp("created_at").defaultNow(),
});

export type ContactMessage = typeof contactMessages.$inferSelect;
export type InsertContactMessage = typeof contactMessages.$inferInsert;

export const insertContactMessageSchema = createInsertSchema(contactMessages).omit({
  id: true,
  status: true,
  createdAt: true,
});

// ============================================
// ESP Deliverability Intelligence Tables
// ============================================

// Historical campaign data for trend analysis
export const espCampaignHistory = pgTable("esp_campaign_history", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  provider: varchar("provider").notNull(),
  campaignId: varchar("campaign_id").notNull(),
  campaignName: varchar("campaign_name"),
  subject: text("subject"),
  sentAt: timestamp("sent_at"),
  totalSent: integer("total_sent").default(0),
  delivered: integer("delivered").default(0),
  opened: integer("opened").default(0),
  clicked: integer("clicked").default(0),
  bounced: integer("bounced").default(0),
  unsubscribed: integer("unsubscribed").default(0),
  spamReports: integer("spam_reports").default(0),
  openRate: integer("open_rate").default(0), // Stored as percentage * 100
  clickRate: integer("click_rate").default(0),
  bounceRate: integer("bounce_rate").default(0),
  unsubscribeRate: integer("unsubscribe_rate").default(0),
  // Provider-specific domain stats (JSON for flexibility)
  domainStats: jsonb("domain_stats"), // {gmail: {...}, outlook: {...}, yahoo: {...}}
  syncedAt: timestamp("synced_at").defaultNow(),
}, (table) => [
  index("idx_campaign_history_user").on(table.userId),
  index("idx_campaign_history_provider").on(table.userId, table.provider),
  index("idx_campaign_history_sent").on(table.sentAt),
  uniqueIndex("idx_campaign_history_unique").on(table.userId, table.campaignId),
]);

export type ESPCampaignHistory = typeof espCampaignHistory.$inferSelect;
export type InsertESPCampaignHistory = typeof espCampaignHistory.$inferInsert;

// Baseline metrics calculated from historical data (30-day rolling averages)
export const espBaselines = pgTable("esp_baselines", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  provider: varchar("provider").notNull(),
  domain: varchar("domain"), // null = aggregate, 'gmail.com', 'outlook.com', etc.
  // Baseline metrics (30-day averages)
  avgOpenRate: integer("avg_open_rate").default(0), // * 100 for precision
  avgClickRate: integer("avg_click_rate").default(0),
  avgBounceRate: integer("avg_bounce_rate").default(0),
  avgComplaintRate: integer("avg_complaint_rate").default(0),
  avgUnsubscribeRate: integer("avg_unsubscribe_rate").default(0),
  avgDeliveryRate: integer("avg_delivery_rate").default(0),
  // Variance thresholds for alerts
  openRateStdDev: integer("open_rate_std_dev").default(0),
  bounceRateStdDev: integer("bounce_rate_std_dev").default(0),
  // Volume baselines
  avgCampaignVolume: integer("avg_campaign_volume").default(0),
  avgSendsPerWeek: integer("avg_sends_per_week").default(0),
  // Tracking
  campaignsAnalyzed: integer("campaigns_analyzed").default(0),
  periodStart: timestamp("period_start"),
  periodEnd: timestamp("period_end"),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_baselines_user_provider").on(table.userId, table.provider),
]);

export type ESPBaseline = typeof espBaselines.$inferSelect;
export type InsertESPBaseline = typeof espBaselines.$inferInsert;

// Deliverability alerts when metrics deviate from baseline
export const deliverabilityAlerts = pgTable("deliverability_alerts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  provider: varchar("provider").notNull(),
  alertType: varchar("alert_type").notNull(), // 'bounce_spike', 'complaint_spike', 'engagement_drop', 'deferral_increase'
  severity: varchar("severity").notNull(), // 'info', 'warning', 'critical'
  title: varchar("title").notNull(),
  message: text("message").notNull(),
  metric: varchar("metric"), // 'openRate', 'bounceRate', etc.
  currentValue: integer("current_value"),
  baselineValue: integer("baseline_value"),
  deviationFactor: integer("deviation_factor"), // How many times baseline (e.g., 300 = 3x)
  domain: varchar("domain"), // Which provider domain affected (gmail.com, etc.)
  campaignId: varchar("campaign_id"),
  isRead: boolean("is_read").default(false),
  isDismissed: boolean("is_dismissed").default(false),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_alerts_user").on(table.userId),
  index("idx_alerts_unread").on(table.userId, table.isRead),
]);

export type DeliverabilityAlert = typeof deliverabilityAlerts.$inferSelect;
export type InsertDeliverabilityAlert = typeof deliverabilityAlerts.$inferInsert;

// Pre-send risk scores for campaigns
export const campaignRiskScores = pgTable("campaign_risk_scores", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  provider: varchar("provider"),
  // Campaign identifiers
  subject: text("subject"),
  templateName: varchar("template_name"),
  segmentName: varchar("segment_name"),
  estimatedVolume: integer("estimated_volume"),
  // Risk assessment
  overallRisk: varchar("overall_risk").notNull(), // 'low', 'medium', 'high'
  riskScore: integer("risk_score").default(0), // 0-100
  riskFactors: jsonb("risk_factors"), // Array of {factor, impact, recommendation}
  // Predictions based on historical data
  predictedOpenRate: integer("predicted_open_rate"),
  predictedBounceRate: integer("predicted_bounce_rate"),
  predictedComplaintRate: integer("predicted_complaint_rate"),
  // Comparison to baseline
  volumeVsBaseline: integer("volume_vs_baseline"), // Percentage difference
  frequencyVsBaseline: integer("frequency_vs_baseline"),
  // Metadata
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_risk_scores_user").on(table.userId),
]);

export type CampaignRiskScore = typeof campaignRiskScores.$inferSelect;
export type InsertCampaignRiskScore = typeof campaignRiskScores.$inferInsert;

// Template health tracking
export const templateHealth = pgTable("template_health", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  templateId: varchar("template_id"),
  templateName: varchar("template_name").notNull(),
  provider: varchar("provider"),
  // Performance metrics
  timesUsed: integer("times_used").default(0),
  avgOpenRate: integer("avg_open_rate").default(0),
  avgClickRate: integer("avg_click_rate").default(0),
  avgBounceRate: integer("avg_bounce_rate").default(0),
  avgComplaintRate: integer("avg_complaint_rate").default(0),
  // Domain-specific performance
  gmailOpenRate: integer("gmail_open_rate"),
  outlookOpenRate: integer("outlook_open_rate"),
  yahooOpenRate: integer("yahoo_open_rate"),
  // Health score
  healthScore: integer("health_score").default(50), // 0-100
  healthTrend: varchar("health_trend"), // 'improving', 'stable', 'declining'
  lastUsedAt: timestamp("last_used_at"),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_template_health_user").on(table.userId),
]);

export type TemplateHealth = typeof templateHealth.$inferSelect;
export type InsertTemplateHealth = typeof templateHealth.$inferInsert;

// Send frequency tracking for fatigue analysis
export const sendFrequencyTracking = pgTable("send_frequency_tracking", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  provider: varchar("provider").notNull(),
  segmentName: varchar("segment_name"),
  // Weekly send patterns
  sendsThisWeek: integer("sends_this_week").default(0),
  sendsLastWeek: integer("sends_last_week").default(0),
  avgSendsPerWeek: integer("avg_sends_per_week").default(0),
  // Engagement vs frequency correlation
  engagementAtCurrentFreq: integer("engagement_at_current_freq"),
  optimalFrequency: integer("optimal_frequency"), // Recommended sends/week
  frequencyRisk: varchar("frequency_risk"), // 'optimal', 'high', 'burnout'
  // Fatigue indicators
  unsubscribeTrend: varchar("unsubscribe_trend"), // 'stable', 'increasing', 'decreasing'
  complaintTrend: varchar("complaint_trend"),
  openRateTrend: varchar("open_rate_trend"),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_frequency_user").on(table.userId),
]);

export type SendFrequencyTracking = typeof sendFrequencyTracking.$inferSelect;
export type InsertSendFrequencyTracking = typeof sendFrequencyTracking.$inferInsert;

// List health snapshots for tracking subscriber list metrics over time
export const listHealthSnapshots = pgTable("list_health_snapshots", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  provider: varchar("provider").notNull(),
  listId: varchar("list_id").notNull(),
  listName: varchar("list_name"),
  // Subscriber counts
  totalSubscribers: integer("total_subscribers").default(0),
  activeSubscribers: integer("active_subscribers").default(0),
  unsubscribedCount: integer("unsubscribed_count").default(0),
  bouncedCount: integer("bounced_count").default(0),
  complaintsCount: integer("complaints_count").default(0),
  // Engagement metrics (stored as percentage * 100)
  avgOpenRate: integer("avg_open_rate").default(0),
  avgClickRate: integer("avg_click_rate").default(0),
  // Growth metrics
  growthRate: integer("growth_rate").default(0), // Net change since last snapshot
  subscribersAdded: integer("subscribers_added").default(0),
  subscribersLost: integer("subscribers_lost").default(0),
  // Health scoring
  healthScore: integer("health_score").default(50), // 0-100
  healthTrend: varchar("health_trend"), // 'improving', 'stable', 'declining'
  engagementTier: varchar("engagement_tier"), // 'high', 'medium', 'low'
  // Timestamps
  lastCampaignSent: timestamp("last_campaign_sent"),
  snapshotAt: timestamp("snapshot_at").defaultNow(),
}, (table) => [
  index("idx_list_health_user").on(table.userId),
  index("idx_list_health_provider").on(table.userId, table.provider),
  index("idx_list_health_list").on(table.userId, table.listId),
  index("idx_list_health_date").on(table.snapshotAt),
]);

export type ListHealthSnapshot = typeof listHealthSnapshots.$inferSelect;
export type InsertListHealthSnapshot = typeof listHealthSnapshots.$inferInsert;

// Admin emails sent to users
export const adminEmails = pgTable("admin_emails", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  adminId: varchar("admin_id").references(() => users.id), // null for system/automation emails
  recipientUserId: varchar("recipient_user_id").references(() => users.id), // null for bulk emails
  recipientEmail: varchar("recipient_email").notNull(),
  subject: text("subject").notNull(),
  body: text("body").notNull(),
  htmlContent: text("html_content"), // Full HTML content for preview
  emailType: varchar("email_type").notNull(), // 'individual', 'bulk', 'announcement', 'onboarding', 'automation'
  segment: varchar("segment"), // 'all', 'starter', 'pro', 'scale', 'at-risk', etc.
  status: varchar("status").default("sent"), // 'sent', 'failed', 'pending', 'scheduled'
  scheduledAt: timestamp("scheduled_at"), // When the email should be sent (null = immediate)
  sentAt: timestamp("sent_at").defaultNow(),
}, (table) => [
  index("idx_admin_emails_admin").on(table.adminId),
  index("idx_admin_emails_recipient").on(table.recipientUserId),
  index("idx_admin_emails_scheduled").on(table.scheduledAt),
]);

export type AdminEmail = typeof adminEmails.$inferSelect;
export type InsertAdminEmail = typeof adminEmails.$inferInsert;

// In-app announcements for users
export const announcements = pgTable("announcements", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  adminId: varchar("admin_id").notNull().references(() => users.id),
  title: varchar("title").notNull(),
  message: text("message").notNull(),
  type: varchar("type").default("info"), // 'info', 'feature', 'maintenance', 'urgent'
  targetAudience: varchar("target_audience").default("all"), // 'all', 'starter', 'pro', 'scale'
  isActive: boolean("is_active").default(true),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_announcements_active").on(table.isActive),
]);

export type Announcement = typeof announcements.$inferSelect;
export type InsertAnnouncement = typeof announcements.$inferInsert;

// User announcement read status
export const announcementReads = pgTable("announcement_reads", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  announcementId: varchar("announcement_id").notNull().references(() => announcements.id),
  userId: varchar("user_id").notNull().references(() => users.id),
  readAt: timestamp("read_at").defaultNow(),
}, (table) => [
  index("idx_announcement_reads_user").on(table.userId),
  uniqueIndex("idx_announcement_reads_unique").on(table.announcementId, table.userId),
]);

export type AnnouncementRead = typeof announcementReads.$inferSelect;
export type InsertAnnouncementRead = typeof announcementReads.$inferInsert;

// User activity log for admin visibility
export const userActivityLogs = pgTable("user_activity_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  action: varchar("action").notNull(), // 'grade', 'rewrite', 'login', 'upgrade', 'esp_connect', etc.
  details: jsonb("details"), // Additional context
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_activity_user").on(table.userId),
  index("idx_activity_date").on(table.createdAt),
]);

export type UserActivityLog = typeof userActivityLogs.$inferSelect;
export type InsertUserActivityLog = typeof userActivityLogs.$inferInsert;

// Admin activity log for audit trail
export const adminActivityLogs = pgTable("admin_activity_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  adminId: varchar("admin_id").notNull().references(() => users.id),
  action: varchar("action").notNull(), // 'email_sent', 'user_deactivated', 'tier_changed', etc.
  targetUserId: varchar("target_user_id").references(() => users.id),
  details: jsonb("details"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_admin_activity_admin").on(table.adminId),
  index("idx_admin_activity_date").on(table.createdAt),
]);

export type AdminActivityLog = typeof adminActivityLogs.$inferSelect;
export type InsertAdminActivityLog = typeof adminActivityLogs.$inferInsert;

// Zod schemas for API validation
export const deliverabilityAlertSchema = z.object({
  id: z.string(),
  alertType: z.enum(['bounce_spike', 'complaint_spike', 'engagement_drop', 'deferral_increase', 'volume_spike', 'frequency_warning']),
  severity: z.enum(['info', 'warning', 'critical']),
  title: z.string(),
  message: z.string(),
  metric: z.string().optional(),
  currentValue: z.number().optional(),
  baselineValue: z.number().optional(),
  deviationFactor: z.number().optional(),
  domain: z.string().optional(),
  campaignId: z.string().optional(),
  isRead: z.boolean(),
  createdAt: z.string(),
});

export type DeliverabilityAlertData = z.infer<typeof deliverabilityAlertSchema>;

export const riskLevelSchema = z.enum(['low', 'medium', 'high']);
export type RiskLevel = z.infer<typeof riskLevelSchema>;

export const providerHealthSchema = z.object({
  provider: z.string(),
  domain: z.string(), // 'gmail.com', 'outlook.com', 'yahoo.com', 'aggregate'
  metrics: z.object({
    openRate: z.number(),
    clickRate: z.number(),
    bounceRate: z.number(),
    complaintRate: z.number(),
    deliveryRate: z.number(),
  }),
  baseline: z.object({
    openRate: z.number(),
    clickRate: z.number(),
    bounceRate: z.number(),
    complaintRate: z.number(),
  }),
  trend: z.enum(['improving', 'stable', 'declining']),
  alerts: z.array(z.string()),
});

export type ProviderHealth = z.infer<typeof providerHealthSchema>;

// Blacklist Monitor - Saved domains for ongoing monitoring
export const monitoredDomains = pgTable("monitored_domains", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  domain: varchar("domain").notNull(),
  type: varchar("type").notNull().default("domain"), // 'domain' or 'ip'
  checkFrequency: varchar("check_frequency").default("daily"), // 'daily', 'weekly', 'manual'
  alertsEnabled: boolean("alerts_enabled").default(true),
  lastCheckedAt: timestamp("last_checked_at"),
  lastStatus: varchar("last_status"), // 'clean', 'listed', 'error'
  previousStatus: varchar("previous_status"), // To track status changes
  listedCount: integer("listed_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_monitored_domains_user").on(table.userId),
  index("idx_monitored_domains_frequency").on(table.checkFrequency),
]);

export type MonitoredDomain = typeof monitoredDomains.$inferSelect;
export type InsertMonitoredDomain = typeof monitoredDomains.$inferInsert;
export const insertMonitoredDomainSchema = createInsertSchema(monitoredDomains).omit({ id: true, createdAt: true, lastCheckedAt: true, lastStatus: true, previousStatus: true, listedCount: true });

// Blacklist check history
export const blacklistCheckHistory = pgTable("blacklist_check_history", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  domain: varchar("domain").notNull(),
  type: varchar("type").notNull().default("domain"), // 'domain' or 'ip'
  totalBlacklists: integer("total_blacklists").notNull(),
  listedOn: integer("listed_on").default(0),
  cleanOn: integer("clean_on").default(0),
  results: jsonb("results").notNull(), // Array of { blacklist, listed, error? }
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_blacklist_history_user").on(table.userId),
  index("idx_blacklist_history_domain").on(table.domain),
]);

export type BlacklistCheckHistory = typeof blacklistCheckHistory.$inferSelect;
export type InsertBlacklistCheckHistory = typeof blacklistCheckHistory.$inferInsert;

// Blacklist result type for API responses
export const blacklistResultSchema = z.object({
  blacklist: z.string(),
  name: z.string(),
  listed: z.boolean(),
  error: z.string().optional(),
  delistUrl: z.string().optional(),
});

export type BlacklistResult = z.infer<typeof blacklistResultSchema>;

export const blacklistCheckResponseSchema = z.object({
  domain: z.string(),
  type: z.enum(['domain', 'ip']),
  checkedAt: z.string(),
  totalBlacklists: z.number(),
  listedOn: z.number(),
  cleanOn: z.number(),
  status: z.enum(['clean', 'listed', 'error']),
  resolvedIP: z.string().optional(),
  results: z.array(blacklistResultSchema),
});

export type BlacklistCheckResponse = z.infer<typeof blacklistCheckResponseSchema>;

// Resources/Articles - SEO-focused content management
export const articles = pgTable("articles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: varchar("title").notNull(),
  slug: varchar("slug").notNull().unique(),
  excerpt: text("excerpt"),
  content: text("content").notNull(),
  featuredImage: varchar("featured_image"),
  tags: text("tags").array(),
  metaTitle: varchar("meta_title"),
  metaDescription: text("meta_description"),
  primaryKeyword: varchar("primary_keyword"),
  secondaryKeywords: text("secondary_keywords").array(),
  articleFormat: varchar("article_format"),
  published: boolean("published").default(false),
  authorId: varchar("author_id").notNull().references(() => users.id),
  viewCount: integer("view_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  publishedAt: timestamp("published_at"),
}, (table) => [
  index("idx_articles_slug").on(table.slug),
  index("idx_articles_published").on(table.published),
  index("idx_articles_author").on(table.authorId),
]);

export type Article = typeof articles.$inferSelect;
export type InsertArticle = typeof articles.$inferInsert;
export const insertArticleSchema = createInsertSchema(articles).omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true,
  viewCount: true,
});

// Content Generator Drafts table
export const contentDrafts = pgTable("content_drafts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  name: varchar("name").notNull(),
  contentType: varchar("content_type").notNull(), // email, social, blog, ad
  prompt: text("prompt"),
  generatedContent: text("generated_content"),
  editedContent: text("edited_content"),
  tone: varchar("tone"),
  industry: varchar("industry"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_content_drafts_user").on(table.userId),
]);

export type ContentDraft = typeof contentDrafts.$inferSelect;
export type InsertContentDraft = typeof contentDrafts.$inferInsert;
export const insertContentDraftSchema = createInsertSchema(contentDrafts).omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true,
});

// Content Generation Result type
export interface GeneratedContent {
  subject?: string;
  previewText?: string;
  body: string;
  suggestions: string[];
}

// System Configuration table for scheduler state and app settings
export const systemConfig = pgTable("system_config", {
  key: varchar("key").primaryKey(),
  value: text("value").notNull(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type SystemConfig = typeof systemConfig.$inferSelect;
export type InsertSystemConfig = typeof systemConfig.$inferInsert;

// Onboarding email tracking table
export const onboardingEmails = pgTable("onboarding_emails", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  emailNumber: integer("email_number").notNull(), // 1-5 for the sequence
  emailType: varchar("email_type").notNull(), // welcome, getting-started, academy, tips, upgrade
  sentAt: timestamp("sent_at").defaultNow(),
  opened: boolean("opened").default(false),
  clicked: boolean("clicked").default(false),
}, (table) => [
  // Prevent duplicate emails - each user can only receive each email number once
  uniqueIndex("onboarding_user_email_unique").on(table.userId, table.emailNumber)
]);

export type OnboardingEmail = typeof onboardingEmails.$inferSelect;
export type InsertOnboardingEmail = typeof onboardingEmails.$inferInsert;

// Blog announcement emails tracking
export const blogAnnouncementEmails = pgTable("blog_announcement_emails", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  subject: text("subject").notNull(),
  previewText: text("preview_text"),
  blogTitle: text("blog_title").notNull(),
  blogSummary: text("blog_summary"),
  blogUrl: text("blog_url"),
  sentAt: timestamp("sent_at").defaultNow(),
  recipientCount: integer("recipient_count").default(0),
  sentBy: varchar("sent_by").references(() => users.id),
});

export type BlogAnnouncementEmail = typeof blogAnnouncementEmails.$inferSelect;
export type InsertBlogAnnouncementEmail = typeof blogAnnouncementEmails.$inferInsert;

// Email opens tracking table for analytics
export const emailOpens = pgTable("email_opens", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  emailType: varchar("email_type").notNull(), // onboarding, blog-announcement, etc.
  emailId: varchar("email_id"), // Reference to specific email record
  trackingId: varchar("tracking_id").notNull().unique(), // Unique tracking pixel ID
  openedAt: timestamp("opened_at"),
  userAgent: text("user_agent"),
  ipAddress: varchar("ip_address"),
  createdAt: timestamp("created_at").defaultNow(),
});

export type EmailOpen = typeof emailOpens.$inferSelect;
export type InsertEmailOpen = typeof emailOpens.$inferInsert;

