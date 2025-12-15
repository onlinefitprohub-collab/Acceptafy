import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, jsonb, index, boolean } from "drizzle-orm/pg-core";
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
  lastLoginAt: timestamp("last_login_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
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
});

export type UsageCounter = typeof usageCounters.$inferSelect;
export type InsertUsageCounter = typeof usageCounters.$inferInsert;

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
  bestScore: integer("best_score").default(0),
});

export type UserGamification = typeof userGamification.$inferSelect;
export type InsertUserGamification = typeof userGamification.$inferInsert;

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

// Subscription tier limits - designed to prevent abuse while providing value
export const SUBSCRIPTION_LIMITS = {
  starter: {
    gradesPerMonth: 3,
    rewritesPerMonth: 3,
    followupsPerMonth: 20,
    deliverabilityChecksPerMonth: 10,
    historyLimit: 30,
    advancedSpamAnalysis: false,
    whitelabelReports: false,
  },
  pro: {
    gradesPerMonth: 600,
    rewritesPerMonth: 300,
    followupsPerMonth: 150,
    deliverabilityChecksPerMonth: 100,
    historyLimit: 5000,
    advancedSpamAnalysis: true,
    whitelabelReports: false,
  },
  scale: {
    gradesPerMonth: 2500,
    rewritesPerMonth: 1200,
    followupsPerMonth: 600,
    deliverabilityChecksPerMonth: 400,
    historyLimit: 50000,
    advancedSpamAnalysis: true,
    whitelabelReports: true,
  },
} as const;

// Pricing information
export const PRICING = {
  starter: { monthly: 0, name: 'Starter', tagline: 'Perfect for trying things out' },
  pro: { monthly: 59, name: 'Pro', tagline: 'For growing email marketers' },
  scale: { monthly: 149, name: 'Scale', tagline: 'For teams & agencies' },
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
