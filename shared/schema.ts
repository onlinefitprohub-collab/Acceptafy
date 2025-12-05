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
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  stripeCustomerId: varchar("stripe_customer_id"),
  stripeSubscriptionId: varchar("stripe_subscription_id"),
  subscriptionStatus: varchar("subscription_status").default("active"),
  subscriptionTier: varchar("subscription_tier").default("starter"),
  role: varchar("role").default("user"),
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

// Subscription tier limits - designed to prevent abuse while providing value
export const SUBSCRIPTION_LIMITS = {
  starter: {
    gradesPerMonth: 50,
    rewritesPerMonth: 25,
    followupsPerMonth: 20,
    deliverabilityChecksPerMonth: 10,
    historyLimit: 30,
    brandDomains: 1,
    teamSeats: 1,
    apiAccess: false,
  },
  pro: {
    gradesPerMonth: 600,
    rewritesPerMonth: 300,
    followupsPerMonth: 150,
    deliverabilityChecksPerMonth: 100,
    historyLimit: 5000,
    brandDomains: 5,
    teamSeats: 2,
    apiAccess: false,
  },
  scale: {
    gradesPerMonth: 2500,
    rewritesPerMonth: 1200,
    followupsPerMonth: 600,
    deliverabilityChecksPerMonth: 400,
    historyLimit: 50000,
    brandDomains: 25,
    teamSeats: 10,
    apiAccess: true,
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
