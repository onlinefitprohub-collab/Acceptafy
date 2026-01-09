import {
  users,
  usageCounters,
  dailyUsageCounters,
  emailAnalyses,
  userGamification,
  emailTemplates,
  competitorAnalyses,
  agencyBranding,
  espConnections,
  contactMessages,
  passwordResetTokens,
  adminNotes,
  espCampaignHistory,
  espBaselines,
  deliverabilityAlerts,
  campaignRiskScores,
  templateHealth,
  sendFrequencyTracking,
  listHealthSnapshots,
  adminEmails,
  announcements,
  announcementReads,
  userActivityLogs,
  adminActivityLogs,
  monitoredDomains,
  blacklistCheckHistory,
  articles,
  SUBSCRIPTION_LIMITS,
  type User,
  type UpsertUser,
  type UsageCounter,
  type InsertUsageCounter,
  type DailyUsageCounter,
  type InsertDailyUsageCounter,
  type EmailAnalysis,
  type InsertEmailAnalysis,
  type UserGamification,
  type InsertUserGamification,
  type EmailTemplate,
  type InsertEmailTemplate,
  type CompetitorAnalysis,
  type InsertCompetitorAnalysis,
  type AgencyBranding,
  type InsertAgencyBranding,
  type SubscriptionTier,
  type ESPConnection,
  type InsertESPConnection,
  type ESPProviderType,
  type ContactMessage,
  type InsertContactMessage,
  type PasswordResetToken,
  type AdminNote,
  type InsertAdminNote,
  type ESPCampaignHistory,
  type InsertESPCampaignHistory,
  type ESPBaseline,
  type InsertESPBaseline,
  type DeliverabilityAlert,
  type InsertDeliverabilityAlert,
  type CampaignRiskScore,
  type InsertCampaignRiskScore,
  type TemplateHealth,
  type InsertTemplateHealth,
  type SendFrequencyTracking,
  type InsertSendFrequencyTracking,
  type ListHealthSnapshot,
  type InsertListHealthSnapshot,
  type AdminEmail,
  type InsertAdminEmail,
  type Announcement,
  type InsertAnnouncement,
  type AnnouncementRead,
  type InsertAnnouncementRead,
  type UserActivityLog,
  type InsertUserActivityLog,
  type AdminActivityLog,
  type InsertAdminActivityLog,
  type MonitoredDomain,
  type InsertMonitoredDomain,
  type BlacklistCheckHistory,
  type InsertBlacklistCheckHistory,
  type Article,
  type InsertArticle,
  manualCampaignStats,
  type ManualCampaignStats,
  type InsertManualCampaignStats,
} from "@shared/schema";
import { db } from "./db";
import { eq, sql, and, gte, lte, desc } from "drizzle-orm";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByStripeCustomerId(customerId: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  createUserWithPassword(email: string, passwordHash: string, role?: string, subscriptionTier?: string): Promise<User>;
  updateUser(userId: string, updates: Partial<User>): Promise<User>;
  deleteUser(userId: string): Promise<boolean>;
  updateUserStripeInfo(userId: string, stripeInfo: {
    stripeCustomerId?: string;
    stripeSubscriptionId?: string;
    subscriptionStatus?: string;
    subscriptionTier?: string;
  }): Promise<User>;
  
  getUsageCounter(userId: string): Promise<UsageCounter | undefined>;
  createOrResetUsageCounter(userId: string): Promise<UsageCounter>;
  incrementUsage(userId: string, field: 'gradeCount' | 'rewriteCount' | 'followupCount' | 'deliverabilityChecks'): Promise<UsageCounter>;
  checkUsageLimit(userId: string, field: 'gradeCount' | 'rewriteCount' | 'followupCount' | 'deliverabilityChecks'): Promise<{ allowed: boolean; current: number; limit: number }>;
  
  // Daily usage tracking (anti-abuse)
  getDailyUsageCounter(userId: string): Promise<DailyUsageCounter | undefined>;
  createDailyUsageCounter(userId: string): Promise<DailyUsageCounter>;
  incrementDailyUsage(userId: string, field: 'gradeCount' | 'rewriteCount' | 'followupCount' | 'deliverabilityChecks'): Promise<DailyUsageCounter>;
  checkDailyUsageLimit(userId: string, field: 'gradeCount' | 'rewriteCount' | 'followupCount' | 'deliverabilityChecks'): Promise<{ allowed: boolean; current: number; limit: number }>;
  checkBothUsageLimits(userId: string, field: 'gradeCount' | 'rewriteCount' | 'followupCount' | 'deliverabilityChecks'): Promise<{
    allowed: boolean;
    monthly: { current: number; limit: number };
    daily: { current: number; limit: number };
    reason?: 'monthly' | 'daily';
  }>;
  incrementBothUsages(userId: string, field: 'gradeCount' | 'rewriteCount' | 'followupCount' | 'deliverabilityChecks'): Promise<void>;
  
  getEmailAnalyses(userId: string, limit?: number): Promise<EmailAnalysis[]>;
  createEmailAnalysis(analysis: InsertEmailAnalysis): Promise<EmailAnalysis>;
  getEmailAnalysis(id: string, userId: string): Promise<EmailAnalysis | undefined>;
  deleteEmailAnalysis(id: string, userId: string): Promise<boolean>;
  clearAllEmailAnalyses(userId: string): Promise<boolean>;
  
  getUserGamification(userId: string): Promise<UserGamification | undefined>;
  upsertUserGamification(data: InsertUserGamification): Promise<UserGamification>;
  
  // Email Templates
  getEmailTemplates(userId: string): Promise<EmailTemplate[]>;
  getEmailTemplate(id: string, userId: string): Promise<EmailTemplate | undefined>;
  createEmailTemplate(template: InsertEmailTemplate): Promise<EmailTemplate>;
  updateEmailTemplate(id: string, userId: string, updates: Partial<EmailTemplate>): Promise<EmailTemplate | undefined>;
  deleteEmailTemplate(id: string, userId: string): Promise<boolean>;
  
  // Competitor Analyses
  getCompetitorAnalyses(userId: string, limit?: number): Promise<CompetitorAnalysis[]>;
  createCompetitorAnalysis(analysis: InsertCompetitorAnalysis): Promise<CompetitorAnalysis>;
  
  getProduct(productId: string): Promise<any>;
  listProducts(active?: boolean, limit?: number, offset?: number): Promise<any[]>;
  listProductsWithPrices(active?: boolean, limit?: number, offset?: number): Promise<any[]>;
  getPrice(priceId: string): Promise<any>;
  listPrices(active?: boolean, limit?: number, offset?: number): Promise<any[]>;
  getPricesForProduct(productId: string): Promise<any[]>;
  getSubscription(subscriptionId: string): Promise<any>;
  
  // Admin methods
  getAllUsers(): Promise<User[]>;
  getAllUsersWithUsage(): Promise<Array<User & { 
    totalGrades: number; 
    totalRewrites: number;
    totalFollowups: number;
    lastActiveDate: string | null;
  }>>;
  getAdminStats(): Promise<{
    totalUsers: number;
    activeSubscriptions: number;
    tierBreakdown: { tier: string; count: number }[];
    totalGrades: number;
    recentSignups: number;
  }>;
  getBusinessMetrics(): Promise<{
    mrr: number;
    userGrowth: { date: string; count: number }[];
    churnRate: number;
    subscriptionBreakdown: { tier: string; count: number; revenue: number }[];
    activeUsers30d: number;
  }>;
  getContentAnalytics(): Promise<{
    topSubjectLines: { subject: string; score: number; grade: string }[];
    commonSpamTriggers: { word: string; count: number }[];
    gradeDistribution: { grade: string; count: number }[];
    scoreDistribution: { range: string; count: number }[];
  }>;
  getFeatureAdoption(): Promise<{
    featureUsage: { feature: string; count: number; percentage: number }[];
    usageTrends: { date: string; grades: number; rewrites: number; followups: number; deliverability: number }[];
    totalUsage: number;
  }>;
  getESPMetrics(): Promise<{
    totalConnections: number;
    activeConnections: number;
    providerBreakdown: { provider: string; count: number }[];
    usersWithConnections: number;
  }>;
  
  // Agency Branding
  getAgencyBranding(userId: string): Promise<AgencyBranding | undefined>;
  upsertAgencyBranding(userId: string, branding: Partial<InsertAgencyBranding>): Promise<AgencyBranding>;
  
  // ESP Connections
  getESPConnections(userId: string): Promise<ESPConnection[]>;
  getESPConnection(userId: string, provider: ESPProviderType): Promise<ESPConnection | undefined>;
  upsertESPConnection(connection: InsertESPConnection): Promise<ESPConnection>;
  deleteESPConnection(userId: string, provider: ESPProviderType): Promise<boolean>;
  
  // Contact Messages
  createContactMessage(message: InsertContactMessage): Promise<ContactMessage>;
  getContactMessages(): Promise<ContactMessage[]>;
  
  // Password Reset Tokens
  createPasswordResetToken(userId: string, token: string, expiresAt: Date): Promise<any>;
  getPasswordResetToken(token: string): Promise<any>;
  markPasswordResetTokenUsed(token: string): Promise<boolean>;
  deleteExpiredPasswordResetTokens(): Promise<number>;
  
  // Admin Notes
  getAdminNotes(userId: string): Promise<AdminNote[]>;
  createAdminNote(note: InsertAdminNote): Promise<AdminNote>;
  
  // Deliverability Intelligence
  getCampaignHistory(userId: string, provider?: string, limit?: number): Promise<ESPCampaignHistory[]>;
  saveCampaignHistory(campaign: InsertESPCampaignHistory): Promise<ESPCampaignHistory>;
  getBaselines(userId: string, provider?: string): Promise<ESPBaseline[]>;
  upsertBaseline(baseline: InsertESPBaseline): Promise<ESPBaseline>;
  getDeliverabilityAlerts(userId: string, unreadOnly?: boolean): Promise<DeliverabilityAlert[]>;
  createDeliverabilityAlert(alert: InsertDeliverabilityAlert): Promise<DeliverabilityAlert>;
  markAlertRead(alertId: string, userId: string): Promise<boolean>;
  dismissAlert(alertId: string, userId: string): Promise<boolean>;
  getCampaignRiskScores(userId: string, limit?: number): Promise<CampaignRiskScore[]>;
  saveCampaignRiskScore(score: InsertCampaignRiskScore): Promise<CampaignRiskScore>;
  getTemplateHealth(userId: string): Promise<TemplateHealth[]>;
  upsertTemplateHealth(health: InsertTemplateHealth): Promise<TemplateHealth>;
  getSendFrequencyTracking(userId: string, provider?: string): Promise<SendFrequencyTracking[]>;
  upsertSendFrequencyTracking(tracking: InsertSendFrequencyTracking): Promise<SendFrequencyTracking>;
  
  // List Health Snapshots
  getListHealthSnapshots(userId: string, provider?: string): Promise<ListHealthSnapshot[]>;
  getLatestListHealthSnapshot(userId: string, provider: string, listId: string): Promise<ListHealthSnapshot | undefined>;
  saveListHealthSnapshot(snapshot: InsertListHealthSnapshot): Promise<ListHealthSnapshot>;
  getListHealthHistory(userId: string, listId: string, limit?: number): Promise<ListHealthSnapshot[]>;
  
  // Blacklist Monitoring
  getMonitoredDomains(userId: string): Promise<MonitoredDomain[]>;
  getMonitoredDomain(userId: string, domain: string): Promise<MonitoredDomain | undefined>;
  getMonitoredDomainById(id: string, userId: string): Promise<MonitoredDomain | undefined>;
  createMonitoredDomain(data: InsertMonitoredDomain): Promise<MonitoredDomain>;
  updateMonitoredDomain(id: string, userId: string, updates: Partial<MonitoredDomain>): Promise<MonitoredDomain | undefined>;
  updateMonitoredDomainStatus(id: string, status: string, listedCount: number): Promise<void>;
  deleteMonitoredDomain(id: string, userId: string): Promise<boolean>;
  getDomainsForScheduledCheck(frequencies: string[]): Promise<MonitoredDomain[]>;
  
  saveBlacklistCheck(data: InsertBlacklistCheckHistory): Promise<BlacklistCheckHistory>;
  getBlacklistCheckHistory(userId: string, domain?: string, limit?: number): Promise<BlacklistCheckHistory[]>;
  
  // Articles/Resources
  getArticles(publishedOnly?: boolean): Promise<Article[]>;
  getArticleById(id: string): Promise<Article | undefined>;
  getArticleBySlug(slug: string): Promise<Article | undefined>;
  createArticle(data: InsertArticle): Promise<Article>;
  updateArticle(id: string, updates: Partial<Article>): Promise<Article | undefined>;
  deleteArticle(id: string): Promise<boolean>;
  incrementArticleViewCount(id: string): Promise<void>;
  
  // Manual Campaign Stats
  getManualCampaignStats(userId: string): Promise<ManualCampaignStats[]>;
  getManualCampaignStatsById(id: string, userId: string): Promise<ManualCampaignStats | undefined>;
  createManualCampaignStats(data: InsertManualCampaignStats): Promise<ManualCampaignStats>;
  updateManualCampaignStats(id: string, userId: string, updates: Partial<ManualCampaignStats>): Promise<ManualCampaignStats | undefined>;
  deleteManualCampaignStats(id: string, userId: string): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async getUserByStripeCustomerId(customerId: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.stripeCustomerId, customerId));
    return user;
  }

  async createUserWithPassword(email: string, passwordHash: string, role: string = 'user', subscriptionTier: string = 'starter'): Promise<User> {
    const [user] = await db
      .insert(users)
      .values({
        email,
        passwordHash,
        role,
        subscriptionTier,
        subscriptionStatus: 'active',
      })
      .returning();
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.email,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async updateUser(userId: string, updates: Partial<User>): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  async deleteUser(userId: string): Promise<boolean> {
    await db.delete(usageCounters).where(eq(usageCounters.userId, userId));
    await db.delete(emailAnalyses).where(eq(emailAnalyses.userId, userId));
    await db.delete(userGamification).where(eq(userGamification.userId, userId));
    await db.delete(emailTemplates).where(eq(emailTemplates.userId, userId));
    await db.delete(competitorAnalyses).where(eq(competitorAnalyses.userId, userId));
    const result = await db.delete(users).where(eq(users.id, userId));
    return true;
  }

  async updateUserStripeInfo(userId: string, stripeInfo: {
    stripeCustomerId?: string;
    stripeSubscriptionId?: string;
    subscriptionStatus?: string;
    subscriptionTier?: string;
  }): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ ...stripeInfo, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  async getUsageCounter(userId: string): Promise<UsageCounter | undefined> {
    const now = new Date();
    const [counter] = await db
      .select()
      .from(usageCounters)
      .where(
        and(
          eq(usageCounters.userId, userId),
          lte(usageCounters.periodStart, now),
          gte(usageCounters.periodEnd, now)
        )
      );
    return counter;
  }

  async createOrResetUsageCounter(userId: string): Promise<UsageCounter> {
    const now = new Date();
    const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    const [counter] = await db
      .insert(usageCounters)
      .values({
        userId,
        periodStart,
        periodEnd,
        gradeCount: 0,
        rewriteCount: 0,
        followupCount: 0,
        deliverabilityChecks: 0,
        aiTokensUsed: 0,
      })
      .returning();
    return counter;
  }

  async incrementUsage(userId: string, field: 'gradeCount' | 'rewriteCount' | 'followupCount' | 'deliverabilityChecks'): Promise<UsageCounter> {
    let counter = await this.getUsageCounter(userId);
    if (!counter) {
      counter = await this.createOrResetUsageCounter(userId);
    }

    const [updated] = await db
      .update(usageCounters)
      .set({ [field]: sql`${usageCounters[field]} + 1` })
      .where(eq(usageCounters.id, counter.id))
      .returning();
    return updated;
  }

  async checkUsageLimit(userId: string, field: 'gradeCount' | 'rewriteCount' | 'followupCount' | 'deliverabilityChecks'): Promise<{ allowed: boolean; current: number; limit: number }> {
    const user = await this.getUser(userId);
    const tier = (user?.subscriptionTier || 'starter') as SubscriptionTier;
    const limits = SUBSCRIPTION_LIMITS[tier] || SUBSCRIPTION_LIMITS.starter;
    
    const fieldToLimit: Record<string, 'gradesPerMonth' | 'rewritesPerMonth' | 'followupsPerMonth' | 'deliverabilityChecksPerMonth'> = {
      gradeCount: 'gradesPerMonth',
      rewriteCount: 'rewritesPerMonth',
      followupCount: 'followupsPerMonth',
      deliverabilityChecks: 'deliverabilityChecksPerMonth',
    };

    const limit = limits[fieldToLimit[field]] as number;
    
    let counter = await this.getUsageCounter(userId);
    if (!counter) {
      counter = await this.createOrResetUsageCounter(userId);
    }

    const current = counter[field] || 0;
    const allowed = limit === -1 || current < limit;

    return { allowed, current, limit };
  }

  // Daily usage tracking methods
  async getDailyUsageCounter(userId: string): Promise<DailyUsageCounter | undefined> {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const [counter] = await db
      .select()
      .from(dailyUsageCounters)
      .where(eq(dailyUsageCounters.userId, userId))
      .orderBy(desc(dailyUsageCounters.date))
      .limit(1);
    
    // If counter exists but is from a previous day, reset it
    if (counter && counter.date !== today) {
      const [updated] = await db
        .update(dailyUsageCounters)
        .set({
          date: today,
          gradeCount: 0,
          rewriteCount: 0,
          followupCount: 0,
          deliverabilityChecks: 0,
        })
        .where(eq(dailyUsageCounters.id, counter.id))
        .returning();
      return updated;
    }
    
    return counter;
  }

  async createDailyUsageCounter(userId: string): Promise<DailyUsageCounter> {
    const today = new Date().toISOString().split('T')[0];
    
    // First check if there's an existing counter for this user (from any day)
    const [existing] = await db
      .select()
      .from(dailyUsageCounters)
      .where(eq(dailyUsageCounters.userId, userId))
      .limit(1);
    
    // If exists but from previous day, reset it
    if (existing) {
      const [updated] = await db
        .update(dailyUsageCounters)
        .set({
          date: today,
          gradeCount: 0,
          rewriteCount: 0,
          followupCount: 0,
          deliverabilityChecks: 0,
        })
        .where(eq(dailyUsageCounters.id, existing.id))
        .returning();
      return updated;
    }
    
    // Create new counter
    const [counter] = await db
      .insert(dailyUsageCounters)
      .values({
        userId,
        date: today,
        gradeCount: 0,
        rewriteCount: 0,
        followupCount: 0,
        deliverabilityChecks: 0,
      })
      .returning();
    return counter;
  }

  async incrementDailyUsage(userId: string, field: 'gradeCount' | 'rewriteCount' | 'followupCount' | 'deliverabilityChecks'): Promise<DailyUsageCounter> {
    let counter = await this.getDailyUsageCounter(userId);
    if (!counter) {
      counter = await this.createDailyUsageCounter(userId);
    }

    const [updated] = await db
      .update(dailyUsageCounters)
      .set({ [field]: sql`${dailyUsageCounters[field]} + 1` })
      .where(eq(dailyUsageCounters.id, counter.id))
      .returning();
    return updated;
  }

  async checkDailyUsageLimit(userId: string, field: 'gradeCount' | 'rewriteCount' | 'followupCount' | 'deliverabilityChecks'): Promise<{ allowed: boolean; current: number; limit: number }> {
    const user = await this.getUser(userId);
    const tier = (user?.subscriptionTier || 'starter') as SubscriptionTier;
    const limits = SUBSCRIPTION_LIMITS[tier] || SUBSCRIPTION_LIMITS.starter;
    
    const fieldToDailyLimit: Record<string, 'gradesPerDay' | 'rewritesPerDay' | 'followupsPerDay' | 'deliverabilityChecksPerDay'> = {
      gradeCount: 'gradesPerDay',
      rewriteCount: 'rewritesPerDay',
      followupCount: 'followupsPerDay',
      deliverabilityChecks: 'deliverabilityChecksPerDay',
    };

    const limit = limits[fieldToDailyLimit[field]] as number;
    
    // Always ensure counter exists for today (this handles day rollover)
    let counter = await this.getOrCreateDailyUsageCounter(userId);

    const current = counter[field] || 0;
    const allowed = limit === -1 || current < limit;

    return { allowed, current, limit };
  }

  // Helper method that ensures we always have a valid daily counter for today
  async getOrCreateDailyUsageCounter(userId: string): Promise<DailyUsageCounter> {
    let counter = await this.getDailyUsageCounter(userId);
    if (!counter) {
      counter = await this.createDailyUsageCounter(userId);
    }
    return counter;
  }

  async checkBothUsageLimits(userId: string, field: 'gradeCount' | 'rewriteCount' | 'followupCount' | 'deliverabilityChecks'): Promise<{
    allowed: boolean;
    monthly: { current: number; limit: number };
    daily: { current: number; limit: number };
    reason?: 'monthly' | 'daily';
  }> {
    const monthly = await this.checkUsageLimit(userId, field);
    const daily = await this.checkDailyUsageLimit(userId, field);
    
    let allowed = true;
    let reason: 'monthly' | 'daily' | undefined;
    
    if (!monthly.allowed) {
      allowed = false;
      reason = 'monthly';
    } else if (!daily.allowed) {
      allowed = false;
      reason = 'daily';
    }

    return {
      allowed,
      monthly: { current: monthly.current, limit: monthly.limit },
      daily: { current: daily.current, limit: daily.limit },
      reason,
    };
  }

  async incrementBothUsages(userId: string, field: 'gradeCount' | 'rewriteCount' | 'followupCount' | 'deliverabilityChecks'): Promise<void> {
    await this.incrementUsage(userId, field);
    await this.incrementDailyUsage(userId, field);
  }

  async getEmailAnalyses(userId: string, limit: number = 50): Promise<EmailAnalysis[]> {
    return db
      .select()
      .from(emailAnalyses)
      .where(eq(emailAnalyses.userId, userId))
      .orderBy(desc(emailAnalyses.createdAt))
      .limit(limit);
  }

  async createEmailAnalysis(analysis: InsertEmailAnalysis): Promise<EmailAnalysis> {
    const [created] = await db
      .insert(emailAnalyses)
      .values(analysis)
      .returning();
    return created;
  }

  async getEmailAnalysis(id: string, userId: string): Promise<EmailAnalysis | undefined> {
    const [analysis] = await db
      .select()
      .from(emailAnalyses)
      .where(and(eq(emailAnalyses.id, id), eq(emailAnalyses.userId, userId)));
    return analysis;
  }

  async deleteEmailAnalysis(id: string, userId: string): Promise<boolean> {
    const result = await db
      .delete(emailAnalyses)
      .where(and(eq(emailAnalyses.id, id), eq(emailAnalyses.userId, userId)));
    return true;
  }

  async clearAllEmailAnalyses(userId: string): Promise<boolean> {
    await db
      .delete(emailAnalyses)
      .where(eq(emailAnalyses.userId, userId));
    return true;
  }

  async getUserGamification(userId: string): Promise<UserGamification | undefined> {
    const [data] = await db
      .select()
      .from(userGamification)
      .where(eq(userGamification.userId, userId));
    return data;
  }

  async upsertUserGamification(data: InsertUserGamification): Promise<UserGamification> {
    const [result] = await db
      .insert(userGamification)
      .values(data)
      .onConflictDoUpdate({
        target: userGamification.userId,
        set: data,
      })
      .returning();
    return result;
  }

  // Email Templates
  async getEmailTemplates(userId: string): Promise<EmailTemplate[]> {
    return db
      .select()
      .from(emailTemplates)
      .where(eq(emailTemplates.userId, userId))
      .orderBy(desc(emailTemplates.updatedAt));
  }

  async getEmailTemplate(id: string, userId: string): Promise<EmailTemplate | undefined> {
    const [template] = await db
      .select()
      .from(emailTemplates)
      .where(and(eq(emailTemplates.id, id), eq(emailTemplates.userId, userId)));
    return template;
  }

  async createEmailTemplate(template: InsertEmailTemplate): Promise<EmailTemplate> {
    const [created] = await db
      .insert(emailTemplates)
      .values(template)
      .returning();
    return created;
  }

  async updateEmailTemplate(id: string, userId: string, updates: Partial<EmailTemplate>): Promise<EmailTemplate | undefined> {
    const [updated] = await db
      .update(emailTemplates)
      .set({ ...updates, updatedAt: new Date() })
      .where(and(eq(emailTemplates.id, id), eq(emailTemplates.userId, userId)))
      .returning();
    return updated;
  }

  async deleteEmailTemplate(id: string, userId: string): Promise<boolean> {
    await db
      .delete(emailTemplates)
      .where(and(eq(emailTemplates.id, id), eq(emailTemplates.userId, userId)));
    return true;
  }

  // Competitor Analyses
  async getCompetitorAnalyses(userId: string, limit: number = 20): Promise<CompetitorAnalysis[]> {
    return db
      .select()
      .from(competitorAnalyses)
      .where(eq(competitorAnalyses.userId, userId))
      .orderBy(desc(competitorAnalyses.createdAt))
      .limit(limit);
  }

  async createCompetitorAnalysis(analysis: InsertCompetitorAnalysis): Promise<CompetitorAnalysis> {
    const [created] = await db
      .insert(competitorAnalyses)
      .values(analysis)
      .returning();
    return created;
  }

  async getProduct(productId: string) {
    const result = await db.execute(
      sql`SELECT * FROM stripe.products WHERE id = ${productId}`
    );
    return result.rows[0] || null;
  }

  async listProducts(active = true, limit = 20, offset = 0) {
    const result = await db.execute(
      sql`SELECT * FROM stripe.products WHERE active = ${active} LIMIT ${limit} OFFSET ${offset}`
    );
    return result.rows;
  }

  async listProductsWithPrices(active = true, limit = 20, offset = 0) {
    const result = await db.execute(
      sql`
        WITH paginated_products AS (
          SELECT id, name, description, metadata, active
          FROM stripe.products
          WHERE active = ${active}
          ORDER BY id
          LIMIT ${limit} OFFSET ${offset}
        )
        SELECT 
          p.id as product_id,
          p.name as product_name,
          p.description as product_description,
          p.active as product_active,
          p.metadata as product_metadata,
          pr.id as price_id,
          pr.unit_amount,
          pr.currency,
          pr.recurring,
          pr.active as price_active,
          pr.metadata as price_metadata
        FROM paginated_products p
        LEFT JOIN stripe.prices pr ON pr.product = p.id AND pr.active = true
        ORDER BY p.id, pr.unit_amount
      `
    );
    return result.rows;
  }

  async getPrice(priceId: string) {
    const result = await db.execute(
      sql`SELECT * FROM stripe.prices WHERE id = ${priceId}`
    );
    return result.rows[0] || null;
  }

  async listPrices(active = true, limit = 20, offset = 0) {
    const result = await db.execute(
      sql`SELECT * FROM stripe.prices WHERE active = ${active} LIMIT ${limit} OFFSET ${offset}`
    );
    return result.rows;
  }

  async getPricesForProduct(productId: string) {
    const result = await db.execute(
      sql`SELECT * FROM stripe.prices WHERE product = ${productId} AND active = true`
    );
    return result.rows;
  }

  async getSubscription(subscriptionId: string) {
    const result = await db.execute(
      sql`SELECT * FROM stripe.subscriptions WHERE id = ${subscriptionId}`
    );
    return result.rows[0] || null;
  }

  async getAllUsers(): Promise<User[]> {
    const allUsers = await db
      .select()
      .from(users)
      .orderBy(desc(users.createdAt));
    return allUsers;
  }

  async getAllUsersWithUsage(): Promise<Array<User & { 
    totalGrades: number; 
    totalRewrites: number;
    totalFollowups: number;
    lastActiveDate: string | null;
  }>> {
    const allUsers = await db
      .select()
      .from(users)
      .orderBy(desc(users.createdAt));
    
    const allGamification = await db.select().from(userGamification);
    const allUsage = await db.select().from(usageCounters);
    
    const gamificationMap = new Map(allGamification.map(g => [g.userId, g]));
    const usageMap = new Map<string, { grades: number; rewrites: number; followups: number }>();
    
    for (const usage of allUsage) {
      const existing = usageMap.get(usage.userId) || { grades: 0, rewrites: 0, followups: 0 };
      usageMap.set(usage.userId, {
        grades: existing.grades + (usage.gradeCount || 0),
        rewrites: existing.rewrites + (usage.rewriteCount || 0),
        followups: existing.followups + (usage.followupCount || 0),
      });
    }
    
    return allUsers.map(user => {
      const gamification = gamificationMap.get(user.id);
      const usage = usageMap.get(user.id) || { grades: 0, rewrites: 0, followups: 0 };
      return {
        ...user,
        totalGrades: usage.grades,
        totalRewrites: usage.rewrites,
        totalFollowups: usage.followups,
        lastActiveDate: gamification?.lastActiveDate || null,
      };
    });
  }

  async getAdminStats(): Promise<{
    totalUsers: number;
    activeSubscriptions: number;
    tierBreakdown: { tier: string; count: number }[];
    totalGrades: number;
    recentSignups: number;
  }> {
    const allUsers = await db.select().from(users);
    // Exclude admin accounts from stats
    const nonAdminUsers = allUsers.filter(u => u.role !== 'admin');
    const totalUsers = nonAdminUsers.length;
    
    const activeSubscriptions = nonAdminUsers.filter(
      u => u.subscriptionStatus === 'active' && u.subscriptionTier && u.subscriptionTier !== 'starter'
    ).length;
    
    const tierCounts: Record<string, number> = {};
    for (const user of nonAdminUsers) {
      const tier = user.subscriptionTier || 'starter';
      tierCounts[tier] = (tierCounts[tier] || 0) + 1;
    }
    const tierBreakdown = Object.entries(tierCounts).map(([tier, count]) => ({ tier, count }));
    
    const allAnalyses = await db.select().from(emailAnalyses);
    const totalGrades = allAnalyses.length;
    
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentSignups = nonAdminUsers.filter(
      u => u.createdAt && u.createdAt > sevenDaysAgo
    ).length;
    
    return {
      totalUsers,
      activeSubscriptions,
      tierBreakdown,
      totalGrades,
      recentSignups,
    };
  }

  async getBusinessMetrics(): Promise<{
    mrr: number;
    userGrowth: { date: string; count: number }[];
    churnRate: number;
    subscriptionBreakdown: { tier: string; count: number; revenue: number }[];
    activeUsers30d: number;
  }> {
    const allUsers = await db.select().from(users);
    // Exclude admin accounts from business metrics
    const nonAdminUsers = allUsers.filter(u => u.role !== 'admin');
    const nonAdminUserIds = new Set(nonAdminUsers.map(u => u.id));
    
    // MRR calculation based on subscription tiers (pro = $59/mo, scale = $149/mo)
    const tierPrices: Record<string, number> = {
      'pro': 5900, // cents
      'scale': 14900,
      'starter': 0,
    };
    
    let mrr = 0;
    const subscriptionCounts: Record<string, { count: number; revenue: number }> = {};
    
    for (const user of nonAdminUsers) {
      const tier = user.subscriptionTier || 'starter';
      const price = tierPrices[tier] || 0;
      
      if (user.subscriptionStatus === 'active' && tier !== 'starter') {
        mrr += price;
      }
      
      if (!subscriptionCounts[tier]) {
        subscriptionCounts[tier] = { count: 0, revenue: 0 };
      }
      subscriptionCounts[tier].count++;
      if (user.subscriptionStatus === 'active') {
        subscriptionCounts[tier].revenue += price;
      }
    }
    
    const subscriptionBreakdown = Object.entries(subscriptionCounts).map(([tier, data]) => ({
      tier,
      count: data.count,
      revenue: data.revenue / 100, // Convert to dollars
    }));
    
    // User growth over last 12 weeks
    const userGrowth: { date: string; count: number }[] = [];
    for (let i = 11; i >= 0; i--) {
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - (i * 7));
      weekStart.setHours(0, 0, 0, 0);
      
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 7);
      
      const count = nonAdminUsers.filter(u => {
        if (!u.createdAt) return false;
        const created = new Date(u.createdAt);
        return created >= weekStart && created < weekEnd;
      }).length;
      
      userGrowth.push({
        date: weekStart.toISOString().split('T')[0],
        count,
      });
    }
    
    // Churn rate: canceled paid users / (active + canceled paid users)
    // Only count users who have or had a paid subscription (pro or scale)
    const paidTierUsers = nonAdminUsers.filter(u => 
      u.subscriptionTier && 
      u.subscriptionTier !== 'starter' && 
      (u.subscriptionStatus === 'active' || u.subscriptionStatus === 'canceled')
    );
    const canceledPaidUsers = paidTierUsers.filter(u => u.subscriptionStatus === 'canceled');
    const churnRate = paidTierUsers.length > 0 ? (canceledPaidUsers.length / paidTierUsers.length) * 100 : 0;
    
    // Active users in last 30 days (excluding admins)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const allGamification = await db.select().from(userGamification);
    const activeUsers30d = allGamification.filter(g => {
      if (!g.lastActiveDate) return false;
      if (!nonAdminUserIds.has(g.userId)) return false; // Exclude admins
      return new Date(g.lastActiveDate) >= thirtyDaysAgo;
    }).length;
    
    return {
      mrr: mrr / 100, // Convert to dollars
      userGrowth,
      churnRate: Math.round(churnRate * 10) / 10,
      subscriptionBreakdown,
      activeUsers30d,
    };
  }

  async getContentAnalytics(): Promise<{
    topSubjectLines: { subject: string; score: number; grade: string }[];
    commonSpamTriggers: { word: string; count: number }[];
    gradeDistribution: { grade: string; count: number }[];
    scoreDistribution: { range: string; count: number }[];
  }> {
    const allAnalyses = await db.select().from(emailAnalyses);
    
    // Top subject lines by score (highest scores first)
    const withSubjects = allAnalyses
      .filter(a => a.subject && a.score !== null && a.grade)
      .sort((a, b) => (b.score || 0) - (a.score || 0))
      .slice(0, 10);
    
    const topSubjectLines = withSubjects.map(a => ({
      subject: a.subject || '',
      score: a.score || 0,
      grade: a.grade || 'N/A',
    }));
    
    // Common spam triggers from analysis results
    const spamWordCounts: Record<string, number> = {};
    for (const analysis of allAnalyses) {
      const result = analysis.result as any;
      if (result?.spamAnalysis && Array.isArray(result.spamAnalysis)) {
        for (const spam of result.spamAnalysis) {
          if (spam.word) {
            const word = spam.word.toLowerCase();
            spamWordCounts[word] = (spamWordCounts[word] || 0) + 1;
          }
        }
      }
    }
    
    const commonSpamTriggers = Object.entries(spamWordCounts)
      .map(([word, count]) => ({ word, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 15);
    
    // Grade distribution
    const gradeCounts: Record<string, number> = { 'A': 0, 'B': 0, 'C': 0, 'D': 0, 'F': 0 };
    for (const analysis of allAnalyses) {
      if (analysis.grade) {
        const gradeKey = analysis.grade.charAt(0).toUpperCase();
        if (gradeKey in gradeCounts) {
          gradeCounts[gradeKey]++;
        }
      }
    }
    
    const gradeDistribution = Object.entries(gradeCounts)
      .map(([grade, count]) => ({ grade, count }))
      .sort((a, b) => {
        const order = ['A', 'B', 'C', 'D', 'F'];
        return order.indexOf(a.grade) - order.indexOf(b.grade);
      });
    
    // Score distribution (ranges: 0-20, 21-40, 41-60, 61-80, 81-100)
    // Using exclusive upper bounds to handle fractional scores correctly
    const scoreRanges = [
      { range: '0-20', min: 0, max: 21, count: 0 },
      { range: '21-40', min: 21, max: 41, count: 0 },
      { range: '41-60', min: 41, max: 61, count: 0 },
      { range: '61-80', min: 61, max: 81, count: 0 },
      { range: '81-100', min: 81, max: 101, count: 0 },
    ];
    
    for (const analysis of allAnalyses) {
      if (analysis.score !== null && analysis.score !== undefined) {
        const score = analysis.score;
        for (const range of scoreRanges) {
          // min <= score < max (exclusive upper bound)
          if (score >= range.min && score < range.max) {
            range.count++;
            break;
          }
        }
      }
    }
    
    const scoreDistribution = scoreRanges.map(r => ({ range: r.range, count: r.count }));
    
    return {
      topSubjectLines,
      commonSpamTriggers,
      gradeDistribution,
      scoreDistribution,
    };
  }

  async getFeatureAdoption(): Promise<{
    featureUsage: { feature: string; count: number; percentage: number }[];
    usageTrends: { date: string; grades: number; rewrites: number; followups: number; deliverability: number }[];
    totalUsage: number;
  }> {
    const allUsage = await db.select().from(usageCounters);
    
    // Aggregate feature usage across all users and periods
    let totalGrades = 0;
    let totalRewrites = 0;
    let totalFollowups = 0;
    let totalDeliverability = 0;
    
    for (const usage of allUsage) {
      totalGrades += usage.gradeCount || 0;
      totalRewrites += usage.rewriteCount || 0;
      totalFollowups += usage.followupCount || 0;
      totalDeliverability += usage.deliverabilityChecks || 0;
    }
    
    const totalUsage = totalGrades + totalRewrites + totalFollowups + totalDeliverability;
    
    const featureUsage = [
      { 
        feature: 'Email Grading', 
        count: totalGrades, 
        percentage: totalUsage > 0 ? Math.round((totalGrades / totalUsage) * 100) : 0 
      },
      { 
        feature: 'Rewrites', 
        count: totalRewrites, 
        percentage: totalUsage > 0 ? Math.round((totalRewrites / totalUsage) * 100) : 0 
      },
      { 
        feature: 'Follow-ups', 
        count: totalFollowups, 
        percentage: totalUsage > 0 ? Math.round((totalFollowups / totalUsage) * 100) : 0 
      },
      { 
        feature: 'Deliverability', 
        count: totalDeliverability, 
        percentage: totalUsage > 0 ? Math.round((totalDeliverability / totalUsage) * 100) : 0 
      },
    ].sort((a, b) => b.count - a.count);
    
    // Calculate usage trends over last 12 months (each usage counter represents a month)
    // Group usage counters by month to avoid double-counting
    const monthlyUsage = new Map<string, { grades: number; rewrites: number; followups: number; deliverability: number }>();
    
    for (const usage of allUsage) {
      if (!usage.periodStart) continue;
      const periodDate = new Date(usage.periodStart);
      const monthKey = `${periodDate.getFullYear()}-${String(periodDate.getMonth() + 1).padStart(2, '0')}`;
      
      const existing = monthlyUsage.get(monthKey) || { grades: 0, rewrites: 0, followups: 0, deliverability: 0 };
      monthlyUsage.set(monthKey, {
        grades: existing.grades + (usage.gradeCount || 0),
        rewrites: existing.rewrites + (usage.rewriteCount || 0),
        followups: existing.followups + (usage.followupCount || 0),
        deliverability: existing.deliverability + (usage.deliverabilityChecks || 0),
      });
    }
    
    // Generate last 12 weeks of data
    const usageTrends: { date: string; grades: number; rewrites: number; followups: number; deliverability: number }[] = [];
    
    for (let i = 11; i >= 0; i--) {
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - (i * 7));
      weekStart.setHours(0, 0, 0, 0);
      
      // Get month key for this week
      const monthKey = `${weekStart.getFullYear()}-${String(weekStart.getMonth() + 1).padStart(2, '0')}`;
      const monthData = monthlyUsage.get(monthKey);
      
      // Distribute monthly usage evenly across 4 weeks (approximate)
      // Only count if this is the first week of the month to avoid inflation
      const weekOfMonth = Math.ceil(weekStart.getDate() / 7);
      const isFirstWeekOfMonth = weekOfMonth === 1;
      
      usageTrends.push({
        date: weekStart.toISOString().split('T')[0],
        grades: isFirstWeekOfMonth && monthData ? Math.round(monthData.grades / 4) : (monthData ? Math.round(monthData.grades / 4) : 0),
        rewrites: isFirstWeekOfMonth && monthData ? Math.round(monthData.rewrites / 4) : (monthData ? Math.round(monthData.rewrites / 4) : 0),
        followups: isFirstWeekOfMonth && monthData ? Math.round(monthData.followups / 4) : (monthData ? Math.round(monthData.followups / 4) : 0),
        deliverability: isFirstWeekOfMonth && monthData ? Math.round(monthData.deliverability / 4) : (monthData ? Math.round(monthData.deliverability / 4) : 0),
      });
    }
    
    return {
      featureUsage,
      usageTrends,
      totalUsage,
    };
  }

  async getESPMetrics(): Promise<{
    totalConnections: number;
    activeConnections: number;
    providerBreakdown: { provider: string; count: number }[];
    usersWithConnections: number;
  }> {
    const allConnections = await db.select().from(espConnections);
    
    const totalConnections = allConnections.length;
    const activeConnections = allConnections.filter(c => c.isConnected).length;
    
    const providerCounts: Record<string, number> = {};
    for (const conn of allConnections) {
      providerCounts[conn.provider] = (providerCounts[conn.provider] || 0) + 1;
    }
    const providerBreakdown = Object.entries(providerCounts)
      .map(([provider, count]) => ({ provider, count }))
      .sort((a, b) => b.count - a.count);
    
    const uniqueUsers = new Set(allConnections.map(c => c.userId));
    const usersWithConnections = uniqueUsers.size;
    
    return {
      totalConnections,
      activeConnections,
      providerBreakdown,
      usersWithConnections,
    };
  }

  // Agency Branding
  async getAgencyBranding(userId: string): Promise<AgencyBranding | undefined> {
    const [branding] = await db
      .select()
      .from(agencyBranding)
      .where(eq(agencyBranding.userId, userId));
    return branding;
  }

  async upsertAgencyBranding(userId: string, branding: Partial<InsertAgencyBranding>): Promise<AgencyBranding> {
    const [result] = await db
      .insert(agencyBranding)
      .values({
        ...branding,
        userId,
      })
      .onConflictDoUpdate({
        target: agencyBranding.userId,
        set: {
          ...branding,
          updatedAt: new Date(),
        },
      })
      .returning();
    return result;
  }

  // ESP Connections
  async getESPConnections(userId: string): Promise<ESPConnection[]> {
    return db
      .select()
      .from(espConnections)
      .where(eq(espConnections.userId, userId))
      .orderBy(desc(espConnections.updatedAt));
  }

  async getESPConnection(userId: string, provider: ESPProviderType): Promise<ESPConnection | undefined> {
    const [connection] = await db
      .select()
      .from(espConnections)
      .where(and(eq(espConnections.userId, userId), eq(espConnections.provider, provider)));
    return connection;
  }

  async upsertESPConnection(connection: InsertESPConnection): Promise<ESPConnection> {
    const existing = await this.getESPConnection(connection.userId, connection.provider as ESPProviderType);
    
    if (existing) {
      const [updated] = await db
        .update(espConnections)
        .set({ ...connection, updatedAt: new Date() })
        .where(eq(espConnections.id, existing.id))
        .returning();
      return updated;
    }
    
    const [created] = await db
      .insert(espConnections)
      .values(connection)
      .returning();
    return created;
  }

  async deleteESPConnection(userId: string, provider: ESPProviderType): Promise<boolean> {
    await db
      .delete(espConnections)
      .where(and(eq(espConnections.userId, userId), eq(espConnections.provider, provider)));
    return true;
  }

  // Contact Messages
  async createContactMessage(message: InsertContactMessage): Promise<ContactMessage> {
    const [created] = await db
      .insert(contactMessages)
      .values(message)
      .returning();
    return created;
  }

  async getContactMessages(): Promise<ContactMessage[]> {
    return db
      .select()
      .from(contactMessages)
      .orderBy(desc(contactMessages.createdAt));
  }

  // Password Reset Tokens
  async createPasswordResetToken(userId: string, token: string, expiresAt: Date): Promise<PasswordResetToken> {
    const [created] = await db
      .insert(passwordResetTokens)
      .values({
        userId,
        token,
        expiresAt,
      })
      .returning();
    return created;
  }

  async getPasswordResetToken(token: string): Promise<(PasswordResetToken & { user: User }) | undefined> {
    const [result] = await db
      .select()
      .from(passwordResetTokens)
      .innerJoin(users, eq(passwordResetTokens.userId, users.id))
      .where(eq(passwordResetTokens.token, token));
    
    if (!result) return undefined;
    
    return {
      ...result.password_reset_tokens,
      user: result.users,
    };
  }

  async markPasswordResetTokenUsed(token: string): Promise<boolean> {
    await db
      .update(passwordResetTokens)
      .set({ usedAt: new Date() })
      .where(eq(passwordResetTokens.token, token));
    return true;
  }

  async deleteExpiredPasswordResetTokens(): Promise<number> {
    const result = await db
      .delete(passwordResetTokens)
      .where(lte(passwordResetTokens.expiresAt, new Date()));
    return 0;
  }

  // Admin Notes
  async getAdminNotes(userId: string): Promise<AdminNote[]> {
    return db
      .select()
      .from(adminNotes)
      .where(eq(adminNotes.userId, userId))
      .orderBy(desc(adminNotes.createdAt));
  }

  async createAdminNote(note: InsertAdminNote): Promise<AdminNote> {
    const [created] = await db
      .insert(adminNotes)
      .values(note)
      .returning();
    return created;
  }

  // Enhanced Analytics with Date Range
  async getAnalyticsWithDateRange(startDate: Date, endDate: Date): Promise<{
    userMetrics: {
      newUsers: number;
      activeUsers: number;
      churnedUsers: number;
      upgrades: number;
      downgrades: number;
    };
    emailMetrics: {
      totalAnalyses: number;
      avgScore: number;
      gradeDistribution: { grade: string; count: number }[];
    };
    revenueMetrics: {
      mrr: number;
      mrrChange: number;
      newRevenue: number;
    };
    dailyActivity: { date: string; users: number; analyses: number }[];
  }> {
    const allUsers = await db.select().from(users);
    const allAnalyses = await db.select().from(emailAnalyses);
    const allUsage = await db.select().from(usageCounters);

    // Filter users created in date range
    const newUsers = allUsers.filter(u => 
      u.createdAt && u.createdAt >= startDate && u.createdAt <= endDate
    ).length;

    // Active users (those with usage in the period)
    const activeUserIds = new Set<string>();
    for (const usage of allUsage) {
      if (usage.periodStart >= startDate && usage.periodEnd <= endDate) {
        if ((usage.gradeCount || 0) > 0 || (usage.rewriteCount || 0) > 0) {
          activeUserIds.add(usage.userId);
        }
      }
    }
    
    // Analyses in date range
    const analysesInRange = allAnalyses.filter(a =>
      a.createdAt && a.createdAt >= startDate && a.createdAt <= endDate
    );

    // Grade distribution
    const gradeCount: Record<string, number> = {};
    let totalScore = 0;
    let scoreCount = 0;
    for (const analysis of analysesInRange) {
      if (analysis.grade) {
        const grade = analysis.grade.charAt(0);
        gradeCount[grade] = (gradeCount[grade] || 0) + 1;
      }
      if (analysis.score) {
        totalScore += analysis.score;
        scoreCount++;
      }
    }

    // Daily activity
    const dailyMap: Record<string, { users: Set<string>; analyses: number }> = {};
    for (const analysis of analysesInRange) {
      if (analysis.createdAt) {
        const dateKey = analysis.createdAt.toISOString().split('T')[0];
        if (!dailyMap[dateKey]) {
          dailyMap[dateKey] = { users: new Set(), analyses: 0 };
        }
        dailyMap[dateKey].users.add(analysis.userId);
        dailyMap[dateKey].analyses++;
      }
    }

    const dailyActivity = Object.entries(dailyMap)
      .map(([date, data]) => ({ date, users: data.users.size, analyses: data.analyses }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // MRR calculation
    const tierPrices: Record<string, number> = { pro: 59, scale: 149, starter: 0 };
    let mrr = 0;
    for (const user of allUsers) {
      if (user.subscriptionStatus === 'active' && user.subscriptionTier && user.subscriptionTier !== 'starter') {
        mrr += tierPrices[user.subscriptionTier] || 0;
      }
    }

    return {
      userMetrics: {
        newUsers,
        activeUsers: activeUserIds.size,
        churnedUsers: allUsers.filter(u => u.subscriptionStatus === 'canceled').length,
        upgrades: 0,
        downgrades: 0,
      },
      emailMetrics: {
        totalAnalyses: analysesInRange.length,
        avgScore: scoreCount > 0 ? Math.round(totalScore / scoreCount) : 0,
        gradeDistribution: ['A', 'B', 'C', 'D', 'F'].map(grade => ({
          grade,
          count: gradeCount[grade] || 0,
        })),
      },
      revenueMetrics: {
        mrr,
        mrrChange: 0,
        newRevenue: 0,
      },
      dailyActivity,
    };
  }

  // User Health Scores
  async getUserHealthScores(): Promise<Array<{
    userId: string;
    email: string;
    healthScore: number;
    riskLevel: 'healthy' | 'at_risk' | 'critical';
    factors: {
      usageScore: number;
      paymentScore: number;
      engagementScore: number;
      tenureScore: number;
    };
    lastActivity: string | null;
    daysSinceActive: number;
  }>> {
    const allUsers = await db.select().from(users);
    const allUsage = await db.select().from(usageCounters);
    const allAnalyses = await db.select().from(emailAnalyses);

    const now = new Date();
    const healthScores: Array<{
      userId: string;
      email: string;
      healthScore: number;
      riskLevel: 'healthy' | 'at_risk' | 'critical';
      factors: {
        usageScore: number;
        paymentScore: number;
        engagementScore: number;
        tenureScore: number;
      };
      lastActivity: string | null;
      daysSinceActive: number;
    }> = [];

    for (const user of allUsers) {
      // Get user's usage data
      const userUsage = allUsage.filter(u => u.userId === user.id);
      const userAnalyses = allAnalyses.filter(a => a.userId === user.id);

      // Calculate usage score (0-100)
      const totalGrades = userUsage.reduce((sum, u) => sum + (u.gradeCount || 0), 0);
      const usageScore = Math.min(100, totalGrades * 10);

      // Payment score
      let paymentScore = 50;
      if (user.subscriptionStatus === 'active') paymentScore = 100;
      else if (user.subscriptionStatus === 'past_due') paymentScore = 25;
      else if (user.subscriptionStatus === 'canceled') paymentScore = 0;

      // Engagement score based on recency
      const lastAnalysis = userAnalyses.sort((a, b) => 
        (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0)
      )[0];
      const lastActivityDate = lastAnalysis?.createdAt || user.lastLoginAt;
      const daysSinceActive = lastActivityDate 
        ? Math.floor((now.getTime() - lastActivityDate.getTime()) / (1000 * 60 * 60 * 24))
        : 999;

      let engagementScore = 100;
      if (daysSinceActive > 7) engagementScore = 80;
      if (daysSinceActive > 14) engagementScore = 60;
      if (daysSinceActive > 30) engagementScore = 40;
      if (daysSinceActive > 60) engagementScore = 20;
      if (daysSinceActive > 90) engagementScore = 0;

      // Tenure score
      const accountAge = user.createdAt 
        ? Math.floor((now.getTime() - user.createdAt.getTime()) / (1000 * 60 * 60 * 24))
        : 0;
      const tenureScore = Math.min(100, accountAge * 2);

      // Calculate overall health score
      const healthScore = Math.round(
        (usageScore * 0.3) + 
        (paymentScore * 0.3) + 
        (engagementScore * 0.3) + 
        (tenureScore * 0.1)
      );

      // Determine risk level
      let riskLevel: 'healthy' | 'at_risk' | 'critical' = 'healthy';
      if (healthScore < 40) riskLevel = 'critical';
      else if (healthScore < 70) riskLevel = 'at_risk';

      healthScores.push({
        userId: user.id,
        email: user.email || '',
        healthScore,
        riskLevel,
        factors: {
          usageScore,
          paymentScore,
          engagementScore,
          tenureScore,
        },
        lastActivity: lastActivityDate?.toISOString() || null,
        daysSinceActive,
      });
    }

    return healthScores.sort((a, b) => a.healthScore - b.healthScore);
  }

  // Cohort Retention Analysis
  async getCohortRetention(): Promise<{
    cohorts: Array<{
      cohort: string;
      totalUsers: number;
      week1: number;
      week2: number;
      week3: number;
      week4: number;
      week8: number;
      week12: number;
    }>;
    funnel: Array<{
      stage: string;
      count: number;
      percentage: number;
    }>;
  }> {
    const allUsers = await db.select().from(users);
    const allAnalyses = await db.select().from(emailAnalyses);
    const now = new Date();

    // Group users by signup week
    const cohortMap: Record<string, {
      users: Array<{ id: string; createdAt: Date }>;
      activeByWeek: Record<number, Set<string>>;
    }> = {};

    for (const user of allUsers) {
      if (!user.createdAt) continue;
      
      const weekStart = new Date(user.createdAt);
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
      const cohortKey = weekStart.toISOString().split('T')[0];

      if (!cohortMap[cohortKey]) {
        cohortMap[cohortKey] = { users: [], activeByWeek: {} };
      }
      cohortMap[cohortKey].users.push({ id: user.id, createdAt: user.createdAt });
    }

    // Calculate activity by week for each cohort
    for (const analysis of allAnalyses) {
      if (!analysis.createdAt) continue;
      
      const user = allUsers.find(u => u.id === analysis.userId);
      if (!user?.createdAt) continue;

      const weekStart = new Date(user.createdAt);
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
      const cohortKey = weekStart.toISOString().split('T')[0];

      if (!cohortMap[cohortKey]) continue;

      const weeksSinceSignup = Math.floor(
        (analysis.createdAt.getTime() - user.createdAt.getTime()) / (1000 * 60 * 60 * 24 * 7)
      );

      if (!cohortMap[cohortKey].activeByWeek[weeksSinceSignup]) {
        cohortMap[cohortKey].activeByWeek[weeksSinceSignup] = new Set();
      }
      cohortMap[cohortKey].activeByWeek[weeksSinceSignup].add(analysis.userId);
    }

    // Build cohort data (last 8 weeks)
    const cohorts: Array<{
      cohort: string;
      totalUsers: number;
      week1: number;
      week2: number;
      week3: number;
      week4: number;
      week8: number;
      week12: number;
    }> = [];

    const sortedCohorts = Object.entries(cohortMap)
      .sort((a, b) => b[0].localeCompare(a[0]))
      .slice(0, 8);

    for (const [cohort, data] of sortedCohorts) {
      const totalUsers = data.users.length;
      cohorts.push({
        cohort,
        totalUsers,
        week1: Math.round((data.activeByWeek[0]?.size || 0) / totalUsers * 100) || 0,
        week2: Math.round((data.activeByWeek[1]?.size || 0) / totalUsers * 100) || 0,
        week3: Math.round((data.activeByWeek[2]?.size || 0) / totalUsers * 100) || 0,
        week4: Math.round((data.activeByWeek[3]?.size || 0) / totalUsers * 100) || 0,
        week8: Math.round((data.activeByWeek[7]?.size || 0) / totalUsers * 100) || 0,
        week12: Math.round((data.activeByWeek[11]?.size || 0) / totalUsers * 100) || 0,
      });
    }

    // Funnel analysis
    const totalSignups = allUsers.length;
    const usersWithAnalysis = new Set(allAnalyses.map(a => a.userId)).size;
    const paidUsers = allUsers.filter(u => 
      u.subscriptionTier && u.subscriptionTier !== 'starter' && u.subscriptionStatus === 'active'
    ).length;
    const activeThisMonth = new Set(
      allAnalyses
        .filter(a => a.createdAt && a.createdAt >= new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000))
        .map(a => a.userId)
    ).size;

    const funnel = [
      { stage: 'Signed Up', count: totalSignups, percentage: 100 },
      { stage: 'First Analysis', count: usersWithAnalysis, percentage: Math.round(usersWithAnalysis / totalSignups * 100) || 0 },
      { stage: 'Subscribed', count: paidUsers, percentage: Math.round(paidUsers / totalSignups * 100) || 0 },
      { stage: 'Active (30d)', count: activeThisMonth, percentage: Math.round(activeThisMonth / totalSignups * 100) || 0 },
    ];

    return { cohorts, funnel };
  }

  // Get at-risk users for insights
  async getAtRiskUsers(limit: number = 10): Promise<Array<{
    user: {
      id: string;
      email: string;
      subscriptionTier: string;
      subscriptionStatus: string;
    };
    healthScore: number;
    reason: string;
    suggestedAction: string;
  }>> {
    const healthScores = await this.getUserHealthScores();
    const atRisk = healthScores
      .filter(h => h.riskLevel === 'critical' || h.riskLevel === 'at_risk')
      .slice(0, limit);

    const allUsers = await db.select().from(users);

    return atRisk.map(h => {
      const user = allUsers.find(u => u.id === h.userId);
      let reason = '';
      let suggestedAction = '';

      if (h.factors.paymentScore < 50) {
        reason = 'Payment issues detected';
        suggestedAction = 'Reach out about billing';
      } else if (h.factors.engagementScore < 50) {
        reason = `Inactive for ${h.daysSinceActive} days`;
        suggestedAction = 'Send re-engagement email';
      } else if (h.factors.usageScore < 30) {
        reason = 'Low feature adoption';
        suggestedAction = 'Offer onboarding call';
      } else {
        reason = 'Multiple risk factors';
        suggestedAction = 'Review account';
      }

      return {
        user: {
          id: h.userId,
          email: h.email,
          subscriptionTier: user?.subscriptionTier || 'starter',
          subscriptionStatus: user?.subscriptionStatus || 'active',
        },
        healthScore: h.healthScore,
        reason,
        suggestedAction,
      };
    });
  }

  // ==========================================
  // Deliverability Intelligence Methods
  // ==========================================

  async getCampaignHistory(userId: string, provider?: string, limit: number = 50): Promise<ESPCampaignHistory[]> {
    if (provider) {
      return db
        .select()
        .from(espCampaignHistory)
        .where(and(eq(espCampaignHistory.userId, userId), eq(espCampaignHistory.provider, provider)))
        .orderBy(desc(espCampaignHistory.sentAt))
        .limit(limit);
    }
    return db
      .select()
      .from(espCampaignHistory)
      .where(eq(espCampaignHistory.userId, userId))
      .orderBy(desc(espCampaignHistory.sentAt))
      .limit(limit);
  }

  async saveCampaignHistory(campaign: InsertESPCampaignHistory): Promise<ESPCampaignHistory> {
    const [result] = await db
      .insert(espCampaignHistory)
      .values(campaign)
      .onConflictDoUpdate({
        target: [espCampaignHistory.userId, espCampaignHistory.campaignId],
        set: {
          ...campaign,
          syncedAt: new Date(),
        },
      })
      .returning();
    return result;
  }

  async getBaselines(userId: string, provider?: string): Promise<ESPBaseline[]> {
    if (provider) {
      return db
        .select()
        .from(espBaselines)
        .where(and(eq(espBaselines.userId, userId), eq(espBaselines.provider, provider)));
    }
    return db.select().from(espBaselines).where(eq(espBaselines.userId, userId));
  }

  async upsertBaseline(baseline: InsertESPBaseline): Promise<ESPBaseline> {
    const [result] = await db
      .insert(espBaselines)
      .values(baseline)
      .onConflictDoUpdate({
        target: [espBaselines.userId, espBaselines.provider],
        set: {
          ...baseline,
          updatedAt: new Date(),
        },
      })
      .returning();
    return result;
  }

  async getDeliverabilityAlerts(userId: string, unreadOnly: boolean = false): Promise<DeliverabilityAlert[]> {
    if (unreadOnly) {
      return db
        .select()
        .from(deliverabilityAlerts)
        .where(and(
          eq(deliverabilityAlerts.userId, userId),
          eq(deliverabilityAlerts.isRead, false),
          eq(deliverabilityAlerts.isDismissed, false)
        ))
        .orderBy(desc(deliverabilityAlerts.createdAt));
    }
    return db
      .select()
      .from(deliverabilityAlerts)
      .where(and(eq(deliverabilityAlerts.userId, userId), eq(deliverabilityAlerts.isDismissed, false)))
      .orderBy(desc(deliverabilityAlerts.createdAt));
  }

  async createDeliverabilityAlert(alert: InsertDeliverabilityAlert): Promise<DeliverabilityAlert> {
    const [result] = await db.insert(deliverabilityAlerts).values(alert).returning();
    return result;
  }

  async markAlertRead(alertId: string, userId: string): Promise<boolean> {
    const result = await db
      .update(deliverabilityAlerts)
      .set({ isRead: true })
      .where(and(eq(deliverabilityAlerts.id, alertId), eq(deliverabilityAlerts.userId, userId)));
    return true;
  }

  async dismissAlert(alertId: string, userId: string): Promise<boolean> {
    const result = await db
      .update(deliverabilityAlerts)
      .set({ isDismissed: true })
      .where(and(eq(deliverabilityAlerts.id, alertId), eq(deliverabilityAlerts.userId, userId)));
    return true;
  }

  async getCampaignRiskScores(userId: string, limit: number = 20): Promise<CampaignRiskScore[]> {
    return db
      .select()
      .from(campaignRiskScores)
      .where(eq(campaignRiskScores.userId, userId))
      .orderBy(desc(campaignRiskScores.createdAt))
      .limit(limit);
  }

  async saveCampaignRiskScore(score: InsertCampaignRiskScore): Promise<CampaignRiskScore> {
    const [result] = await db.insert(campaignRiskScores).values(score).returning();
    return result;
  }

  async getTemplateHealth(userId: string): Promise<TemplateHealth[]> {
    return db
      .select()
      .from(templateHealth)
      .where(eq(templateHealth.userId, userId))
      .orderBy(desc(templateHealth.healthScore));
  }

  async upsertTemplateHealth(health: InsertTemplateHealth): Promise<TemplateHealth> {
    const [result] = await db
      .insert(templateHealth)
      .values(health)
      .onConflictDoUpdate({
        target: [templateHealth.userId, templateHealth.templateName],
        set: {
          ...health,
          updatedAt: new Date(),
        },
      })
      .returning();
    return result;
  }

  async getSendFrequencyTracking(userId: string, provider?: string): Promise<SendFrequencyTracking[]> {
    if (provider) {
      return db
        .select()
        .from(sendFrequencyTracking)
        .where(and(eq(sendFrequencyTracking.userId, userId), eq(sendFrequencyTracking.provider, provider)));
    }
    return db.select().from(sendFrequencyTracking).where(eq(sendFrequencyTracking.userId, userId));
  }

  async upsertSendFrequencyTracking(tracking: InsertSendFrequencyTracking): Promise<SendFrequencyTracking> {
    const [result] = await db
      .insert(sendFrequencyTracking)
      .values(tracking)
      .onConflictDoUpdate({
        target: [sendFrequencyTracking.userId, sendFrequencyTracking.provider],
        set: {
          ...tracking,
          updatedAt: new Date(),
        },
      })
      .returning();
    return result;
  }

  async getListHealthSnapshots(userId: string, provider?: string): Promise<ListHealthSnapshot[]> {
    if (provider) {
      return db
        .select()
        .from(listHealthSnapshots)
        .where(and(eq(listHealthSnapshots.userId, userId), eq(listHealthSnapshots.provider, provider)))
        .orderBy(desc(listHealthSnapshots.snapshotAt));
    }
    return db
      .select()
      .from(listHealthSnapshots)
      .where(eq(listHealthSnapshots.userId, userId))
      .orderBy(desc(listHealthSnapshots.snapshotAt));
  }

  async getLatestListHealthSnapshot(userId: string, provider: string, listId: string): Promise<ListHealthSnapshot | undefined> {
    const [result] = await db
      .select()
      .from(listHealthSnapshots)
      .where(and(
        eq(listHealthSnapshots.userId, userId),
        eq(listHealthSnapshots.provider, provider),
        eq(listHealthSnapshots.listId, listId)
      ))
      .orderBy(desc(listHealthSnapshots.snapshotAt))
      .limit(1);
    return result;
  }

  async saveListHealthSnapshot(snapshot: InsertListHealthSnapshot): Promise<ListHealthSnapshot> {
    const [result] = await db.insert(listHealthSnapshots).values(snapshot).returning();
    return result;
  }

  async getListHealthHistory(userId: string, listId: string, limit: number = 30): Promise<ListHealthSnapshot[]> {
    return db
      .select()
      .from(listHealthSnapshots)
      .where(and(eq(listHealthSnapshots.userId, userId), eq(listHealthSnapshots.listId, listId)))
      .orderBy(desc(listHealthSnapshots.snapshotAt))
      .limit(limit);
  }

  // ========== ADMIN ANALYTICS METHODS ==========

  async getRevenueAnalytics(): Promise<{
    lifetimeRevenue: number;
    arpu: number;
    mrrTrend: { date: string; mrr: number }[];
    revenueByTier: { tier: string; revenue: number; percentage: number }[];
    projectedRevenue: number;
    upgradeRevenue: number;
    downgradeImpact: number;
  }> {
    const allUsers = await db.select().from(users);
    // Exclude admin accounts from revenue calculations
    const nonAdminUsers = allUsers.filter(u => u.role !== 'admin');
    const tierPrices: Record<string, number> = { pro: 59, scale: 149, starter: 0 };
    
    let currentMRR = 0;
    const revenueByTier: Record<string, number> = { starter: 0, pro: 0, scale: 0 };
    let paidUserCount = 0;
    
    for (const user of nonAdminUsers) {
      const tier = user.subscriptionTier || 'starter';
      const price = tierPrices[tier] || 0;
      
      if (user.subscriptionStatus === 'active' && tier !== 'starter') {
        currentMRR += price;
        paidUserCount++;
      }
      revenueByTier[tier] = (revenueByTier[tier] || 0) + (user.subscriptionStatus === 'active' ? price : 0);
    }
    
    const lifetimeRevenue = currentMRR * 12;
    const arpu = paidUserCount > 0 ? currentMRR / paidUserCount : 0;
    const totalRevenue = Object.values(revenueByTier).reduce((a, b) => a + b, 0);
    
    const mrrTrend: { date: string; mrr: number }[] = [];
    for (let i = 11; i >= 0; i--) {
      const monthStart = new Date();
      monthStart.setMonth(monthStart.getMonth() - i);
      monthStart.setDate(1);
      monthStart.setHours(0, 0, 0, 0);
      
      const usersAtTime = nonAdminUsers.filter(u => {
        if (!u.createdAt) return false;
        return u.createdAt <= monthStart && 
               u.subscriptionStatus === 'active' && 
               u.subscriptionTier && 
               u.subscriptionTier !== 'starter';
      });
      
      let monthMRR = 0;
      for (const u of usersAtTime) {
        monthMRR += tierPrices[u.subscriptionTier || 'starter'] || 0;
      }
      
      mrrTrend.push({
        date: monthStart.toISOString().split('T')[0],
        mrr: monthMRR,
      });
    }
    
    const growthRate = mrrTrend.length >= 2 && mrrTrend[mrrTrend.length - 2].mrr > 0
      ? (currentMRR - mrrTrend[mrrTrend.length - 2].mrr) / mrrTrend[mrrTrend.length - 2].mrr
      : 0.05;
    const projectedRevenue = Math.round(currentMRR * (1 + growthRate));
    
    return {
      lifetimeRevenue,
      arpu: Math.round(arpu * 100) / 100,
      mrrTrend,
      revenueByTier: Object.entries(revenueByTier).map(([tier, revenue]) => ({
        tier,
        revenue,
        percentage: totalRevenue > 0 ? Math.round((revenue / totalRevenue) * 100) : 0,
      })),
      projectedRevenue,
      upgradeRevenue: 0,
      downgradeImpact: 0,
    };
  }

  async getConversionFunnelAnalytics(): Promise<{
    freeToProRate: number;
    proToScaleRate: number;
    avgTimeToUpgrade: number;
    conversionsBySource: { source: string; count: number; rate: number }[];
    monthlyConversions: { date: string; upgrades: number; downgrades: number }[];
    featureCorrelation: { feature: string; upgradeLikelihood: number }[];
  }> {
    const allUsers = await db.select().from(users);
    // Exclude admin accounts from conversion metrics
    const nonAdminUsers = allUsers.filter(u => u.role !== 'admin');
    const allUsage = await db.select().from(usageCounters);
    
    const starterUsers = nonAdminUsers.filter(u => (u.subscriptionTier || 'starter') === 'starter').length;
    const proUsers = nonAdminUsers.filter(u => u.subscriptionTier === 'pro').length;
    const scaleUsers = nonAdminUsers.filter(u => u.subscriptionTier === 'scale').length;
    const totalPaid = proUsers + scaleUsers;
    
    const freeToProRate = starterUsers > 0 ? (totalPaid / (starterUsers + totalPaid)) * 100 : 0;
    const proToScaleRate = proUsers > 0 ? (scaleUsers / (proUsers + scaleUsers)) * 100 : 0;
    
    // Generate monthly conversions from real user data (based on createdAt and tier)
    const monthlyConversions: { date: string; upgrades: number; downgrades: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const monthStart = new Date();
      monthStart.setMonth(monthStart.getMonth() - i);
      monthStart.setDate(1);
      const monthEnd = new Date(monthStart);
      monthEnd.setMonth(monthEnd.getMonth() + 1);
      
      // Count users who became paid in this month
      const upgrades = nonAdminUsers.filter(u => {
        if (!u.createdAt) return false;
        const created = new Date(u.createdAt);
        return created >= monthStart && created < monthEnd && 
               (u.subscriptionTier === 'pro' || u.subscriptionTier === 'scale');
      }).length;
      
      monthlyConversions.push({
        date: monthStart.toISOString().split('T')[0].substring(0, 7),
        upgrades,
        downgrades: 0, // Would need subscription history table to track actual downgrades
      });
    }
    
    const usageByUser = new Map<string, { grades: number; rewrites: number; followups: number; deliverability: number }>();
    for (const usage of allUsage) {
      const existing = usageByUser.get(usage.userId) || { grades: 0, rewrites: 0, followups: 0, deliverability: 0 };
      usageByUser.set(usage.userId, {
        grades: existing.grades + (usage.gradeCount || 0),
        rewrites: existing.rewrites + (usage.rewriteCount || 0),
        followups: existing.followups + (usage.followupCount || 0),
        deliverability: existing.deliverability + (usage.deliverabilityChecks || 0),
      });
    }
    
    let gradesUpgrades = 0, rewritesUpgrades = 0, followupsUpgrades = 0, delivUpgrades = 0;
    let gradeUsers = 0, rewriteUsers = 0, followupUsers = 0, delivUsers = 0;
    
    for (const user of nonAdminUsers) {
      const usage = usageByUser.get(user.id);
      if (!usage) continue;
      
      const isPaid = user.subscriptionTier === 'pro' || user.subscriptionTier === 'scale';
      if (usage.grades > 0) { gradeUsers++; if (isPaid) gradesUpgrades++; }
      if (usage.rewrites > 0) { rewriteUsers++; if (isPaid) rewritesUpgrades++; }
      if (usage.followups > 0) { followupUsers++; if (isPaid) followupsUpgrades++; }
      if (usage.deliverability > 0) { delivUsers++; if (isPaid) delivUpgrades++; }
    }
    
    return {
      freeToProRate: Math.round(freeToProRate * 10) / 10,
      proToScaleRate: Math.round(proToScaleRate * 10) / 10,
      avgTimeToUpgrade: 14,
      conversionsBySource: [],
      monthlyConversions,
      featureCorrelation: [
        { feature: 'Email Grading', upgradeLikelihood: gradeUsers > 0 ? Math.round((gradesUpgrades / gradeUsers) * 100) : 0 },
        { feature: 'Rewrites', upgradeLikelihood: rewriteUsers > 0 ? Math.round((rewritesUpgrades / rewriteUsers) * 100) : 0 },
        { feature: 'Follow-ups', upgradeLikelihood: followupUsers > 0 ? Math.round((followupsUpgrades / followupUsers) * 100) : 0 },
        { feature: 'Deliverability', upgradeLikelihood: delivUsers > 0 ? Math.round((delivUpgrades / delivUsers) * 100) : 0 },
      ].sort((a, b) => b.upgradeLikelihood - a.upgradeLikelihood),
    };
  }

  async getQualityMetrics(): Promise<{
    avgScoreOverTime: { date: string; avgScore: number; count: number }[];
    rewriteEffectiveness: { before: number; after: number; improvement: number };
    commonIssues: { issue: string; count: number; percentage: number }[];
    gradeImprovement: { grade: string; firstTimeCount: number; repeatCount: number }[];
  }> {
    const allAnalyses = await db.select().from(emailAnalyses).orderBy(desc(emailAnalyses.createdAt));
    
    const weeklyScores = new Map<string, { total: number; count: number }>();
    for (const analysis of allAnalyses) {
      if (!analysis.createdAt || analysis.score === null) continue;
      const weekStart = new Date(analysis.createdAt);
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
      const weekKey = weekStart.toISOString().split('T')[0];
      
      const existing = weeklyScores.get(weekKey) || { total: 0, count: 0 };
      weeklyScores.set(weekKey, {
        total: existing.total + analysis.score,
        count: existing.count + 1,
      });
    }
    
    const avgScoreOverTime = Array.from(weeklyScores.entries())
      .map(([date, { total, count }]) => ({
        date,
        avgScore: Math.round(total / count),
        count,
      }))
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-12);
    
    const issueCounts: Record<string, number> = {};
    for (const analysis of allAnalyses) {
      const result = analysis.result as any;
      if (result?.spamAnalysis && Array.isArray(result.spamAnalysis)) {
        for (const spam of result.spamAnalysis) {
          if (spam.suggestion) {
            const issue = spam.suggestion.substring(0, 50);
            issueCounts[issue] = (issueCounts[issue] || 0) + 1;
          }
        }
      }
      if (result?.structuralIssues && Array.isArray(result.structuralIssues)) {
        for (const issue of result.structuralIssues) {
          issueCounts[issue] = (issueCounts[issue] || 0) + 1;
        }
      }
    }
    
    const totalIssues = Object.values(issueCounts).reduce((a, b) => a + b, 0);
    const commonIssues = Object.entries(issueCounts)
      .map(([issue, count]) => ({
        issue,
        count,
        percentage: totalIssues > 0 ? Math.round((count / totalIssues) * 100) : 0,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
    
    // Calculate rewrite effectiveness from actual data
    // Look for analyses where score improved after rewrite (based on user pattern)
    const userScores = new Map<string, number[]>();
    for (const analysis of allAnalyses) {
      if (analysis.userId && analysis.score !== null) {
        const scores = userScores.get(analysis.userId) || [];
        scores.push(analysis.score);
        userScores.set(analysis.userId, scores);
      }
    }
    
    let beforeTotal = 0, afterTotal = 0, usersWithMultiple = 0;
    Array.from(userScores.values()).forEach(scores => {
      if (scores.length >= 2) {
        beforeTotal += scores[scores.length - 1]; // Oldest (first analysis)
        afterTotal += scores[0]; // Newest (most recent)
        usersWithMultiple++;
      }
    });
    
    const avgBefore = usersWithMultiple > 0 ? Math.round(beforeTotal / usersWithMultiple) : 0;
    const avgAfter = usersWithMultiple > 0 ? Math.round(afterTotal / usersWithMultiple) : 0;
    const improvement = avgBefore > 0 ? Math.round(((avgAfter - avgBefore) / avgBefore) * 100) : 0;
    
    // Calculate grade distribution from actual analyses
    const gradeCount: Record<string, { first: number; repeat: number }> = {
      'A': { first: 0, repeat: 0 }, 'B': { first: 0, repeat: 0 }, 'C': { first: 0, repeat: 0 },
      'D': { first: 0, repeat: 0 }, 'F': { first: 0, repeat: 0 }
    };
    const userAnalysisCounts = new Map<string, number>();
    
    for (const analysis of allAnalyses) {
      if (!analysis.userId) continue;
      const count = (userAnalysisCounts.get(analysis.userId) || 0) + 1;
      userAnalysisCounts.set(analysis.userId, count);
      
      const result = analysis.result as any;
      const grade = result?.grade || (analysis.score !== null ? (
        analysis.score >= 90 ? 'A' : analysis.score >= 80 ? 'B' : analysis.score >= 70 ? 'C' : analysis.score >= 60 ? 'D' : 'F'
      ) : null);
      
      if (grade && gradeCount[grade]) {
        if (count === 1) gradeCount[grade].first++;
        else gradeCount[grade].repeat++;
      }
    }
    
    return {
      avgScoreOverTime,
      rewriteEffectiveness: { before: avgBefore, after: avgAfter, improvement: Math.max(0, improvement) },
      commonIssues,
      gradeImprovement: Object.entries(gradeCount).map(([grade, counts]) => ({
        grade,
        firstTimeCount: counts.first,
        repeatCount: counts.repeat,
      })),
    };
  }

  async getSystemHealth(): Promise<{
    apiUsageTrend: { date: string; requests: number }[];
    peakUsageTimes: { hour: number; requests: number }[];
    errorRate: number;
    avgResponseTime: number;
    activeConnections: number;
    limitHitUsers: { userId: string; email: string; tier: string; feature: string; usage: number; limit: number }[];
  }> {
    const allUsage = await db.select().from(usageCounters);
    const allUsers = await db.select().from(users);
    const userMap = new Map(allUsers.map(u => [u.id, u]));
    
    const dailyRequests = new Map<string, number>();
    for (const usage of allUsage) {
      if (!usage.periodStart) continue;
      const dateKey = usage.periodStart.toISOString().split('T')[0];
      const total = (usage.gradeCount || 0) + (usage.rewriteCount || 0) + (usage.followupCount || 0) + (usage.deliverabilityChecks || 0);
      dailyRequests.set(dateKey, (dailyRequests.get(dateKey) || 0) + total);
    }
    
    const apiUsageTrend = Array.from(dailyRequests.entries())
      .map(([date, requests]) => ({ date, requests }))
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-30);
    
    // Calculate peak usage times from actual usage data (using period start times)
    const hourlyRequests = new Map<number, number>();
    for (const usage of allUsage) {
      if (!usage.periodStart) continue;
      const hour = usage.periodStart.getHours();
      const total = (usage.gradeCount || 0) + (usage.rewriteCount || 0) + (usage.followupCount || 0) + (usage.deliverabilityChecks || 0);
      hourlyRequests.set(hour, (hourlyRequests.get(hour) || 0) + total);
    }
    
    const peakUsageTimes = Array.from({ length: 24 }, (_, hour) => ({
      hour,
      requests: hourlyRequests.get(hour) || 0,
    }));
    
    // Exclude admin accounts from limit tracking
    const nonAdminUsers = allUsers.filter(u => u.role !== 'admin');
    const nonAdminUserMap = new Map(nonAdminUsers.map(u => [u.id, u]));
    
    const limitHitUsers: { userId: string; email: string; tier: string; feature: string; usage: number; limit: number }[] = [];
    const tierLimits: Record<string, Record<string, number>> = {
      starter: { gradeCount: 3, rewriteCount: 3, followupCount: 20, deliverabilityChecks: 10 },
      pro: { gradeCount: 600, rewriteCount: 300, followupCount: 150, deliverabilityChecks: 100 },
      scale: { gradeCount: 2500, rewriteCount: 1200, followupCount: 600, deliverabilityChecks: 400 },
    };
    
    for (const usage of allUsage) {
      const user = nonAdminUserMap.get(usage.userId);
      if (!user) continue;
      
      const tier = user.subscriptionTier || 'starter';
      const limits = tierLimits[tier] || tierLimits.starter;
      
      const features = ['gradeCount', 'rewriteCount', 'followupCount', 'deliverabilityChecks'] as const;
      for (const feature of features) {
        const usageVal = usage[feature] || 0;
        const limitVal = limits[feature];
        if (usageVal >= limitVal * 0.8) {
          limitHitUsers.push({
            userId: user.id,
            email: user.email || 'Unknown',
            tier,
            feature: feature.replace('Count', '').replace('deliverabilityChecks', 'Deliverability'),
            usage: usageVal,
            limit: limitVal,
          });
        }
      }
    }
    
    return {
      apiUsageTrend,
      peakUsageTimes,
      errorRate: 0.2,
      avgResponseTime: 245,
      activeConnections: await db.select().from(espConnections).then(r => r.length),
      limitHitUsers: limitHitUsers.slice(0, 20),
    };
  }

  // ========== ADMIN EMAIL METHODS ==========

  async createAdminEmail(email: InsertAdminEmail): Promise<AdminEmail> {
    const [result] = await db.insert(adminEmails).values(email).returning();
    return result;
  }

  async getAdminEmails(limit: number = 50): Promise<AdminEmail[]> {
    return db
      .select()
      .from(adminEmails)
      .orderBy(desc(adminEmails.sentAt))
      .limit(limit);
  }

  async getEmailsByRecipient(userId: string): Promise<AdminEmail[]> {
    return db
      .select()
      .from(adminEmails)
      .where(eq(adminEmails.recipientUserId, userId))
      .orderBy(desc(adminEmails.sentAt));
  }

  // ========== ANNOUNCEMENT METHODS ==========

  async createAnnouncement(announcement: InsertAnnouncement): Promise<Announcement> {
    const [result] = await db.insert(announcements).values(announcement).returning();
    return result;
  }

  async getActiveAnnouncements(userTier?: string): Promise<Announcement[]> {
    const now = new Date();
    const allActive = await db
      .select()
      .from(announcements)
      .where(eq(announcements.isActive, true))
      .orderBy(desc(announcements.createdAt));
    
    return allActive.filter(a => {
      if (a.expiresAt && a.expiresAt < now) return false;
      if (!userTier || a.targetAudience === 'all') return true;
      return a.targetAudience === userTier;
    });
  }

  async getAllAnnouncements(): Promise<Announcement[]> {
    return db
      .select()
      .from(announcements)
      .orderBy(desc(announcements.createdAt));
  }

  async updateAnnouncement(id: string, updates: Partial<Announcement>): Promise<Announcement | undefined> {
    const [result] = await db
      .update(announcements)
      .set(updates)
      .where(eq(announcements.id, id))
      .returning();
    return result;
  }

  async deleteAnnouncement(id: string): Promise<boolean> {
    await db.delete(announcements).where(eq(announcements.id, id));
    return true;
  }

  async markAnnouncementRead(announcementId: string, userId: string): Promise<AnnouncementRead> {
    const [result] = await db
      .insert(announcementReads)
      .values({ announcementId, userId })
      .onConflictDoNothing()
      .returning();
    return result;
  }

  async getUnreadAnnouncementCount(userId: string, userTier?: string): Promise<number> {
    const active = await this.getActiveAnnouncements(userTier);
    const reads = await db
      .select()
      .from(announcementReads)
      .where(eq(announcementReads.userId, userId));
    
    const readIds = new Set(reads.map(r => r.announcementId));
    return active.filter(a => !readIds.has(a.id)).length;
  }

  // ========== USER ACTIVITY LOG METHODS ==========

  async logUserActivity(userId: string, action: string, details?: any): Promise<UserActivityLog> {
    const [result] = await db.insert(userActivityLogs).values({
      userId,
      action,
      details,
    }).returning();
    return result;
  }

  async getUserActivityLogs(userId: string, limit: number = 50): Promise<UserActivityLog[]> {
    return db
      .select()
      .from(userActivityLogs)
      .where(eq(userActivityLogs.userId, userId))
      .orderBy(desc(userActivityLogs.createdAt))
      .limit(limit);
  }

  // ========== ADMIN ACTIVITY LOG METHODS ==========

  async logAdminActivity(adminId: string, action: string, targetUserId?: string, details?: any): Promise<AdminActivityLog> {
    const [result] = await db.insert(adminActivityLogs).values({
      adminId,
      action,
      targetUserId,
      details,
    }).returning();
    return result;
  }

  async getAdminActivityLogs(limit: number = 100): Promise<AdminActivityLog[]> {
    return db
      .select()
      .from(adminActivityLogs)
      .orderBy(desc(adminActivityLogs.createdAt))
      .limit(limit);
  }

  // ========== USER MANAGEMENT HELPER METHODS ==========

  async getUsersNearLimit(): Promise<{
    user: User;
    feature: string;
    usage: number;
    limit: number;
    percentage: number;
  }[]> {
    const allUsers = await db.select().from(users);
    const allUsage = await db.select().from(usageCounters);
    
    const tierLimits: Record<string, Record<string, number>> = {
      starter: { gradeCount: 3, rewriteCount: 3, followupCount: 20, deliverabilityChecks: 10 },
      pro: { gradeCount: 600, rewriteCount: 300, followupCount: 150, deliverabilityChecks: 100 },
      scale: { gradeCount: 2500, rewriteCount: 1200, followupCount: 600, deliverabilityChecks: 400 },
    };
    
    const results: { user: User; feature: string; usage: number; limit: number; percentage: number }[] = [];
    
    for (const user of allUsers) {
      const usage = allUsage.find(u => u.userId === user.id);
      if (!usage) continue;
      
      const tier = user.subscriptionTier || 'starter';
      const limits = tierLimits[tier] || tierLimits.starter;
      
      for (const [feature, limit] of Object.entries(limits)) {
        const usageVal = usage[feature as keyof typeof usage] as number || 0;
        const percentage = (usageVal / limit) * 100;
        
        if (percentage >= 80) {
          results.push({
            user,
            feature: feature.replace('Count', '').replace('deliverabilityChecks', 'Deliverability'),
            usage: usageVal,
            limit,
            percentage: Math.round(percentage),
          });
        }
      }
    }
    
    return results.sort((a, b) => b.percentage - a.percentage).slice(0, 30);
  }

  async updateUserTier(userId: string, tier: string): Promise<User | undefined> {
    const [result] = await db
      .update(users)
      .set({ subscriptionTier: tier, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();
    return result;
  }

  // ========== BLACKLIST MONITORING METHODS ==========

  async getMonitoredDomains(userId: string): Promise<MonitoredDomain[]> {
    return db
      .select()
      .from(monitoredDomains)
      .where(eq(monitoredDomains.userId, userId))
      .orderBy(desc(monitoredDomains.createdAt));
  }

  async getMonitoredDomain(userId: string, domain: string): Promise<MonitoredDomain | undefined> {
    const [result] = await db
      .select()
      .from(monitoredDomains)
      .where(and(eq(monitoredDomains.userId, userId), eq(monitoredDomains.domain, domain)));
    return result;
  }

  async getMonitoredDomainById(id: string, userId: string): Promise<MonitoredDomain | undefined> {
    const [result] = await db
      .select()
      .from(monitoredDomains)
      .where(and(eq(monitoredDomains.id, id), eq(monitoredDomains.userId, userId)));
    return result;
  }

  async createMonitoredDomain(data: InsertMonitoredDomain): Promise<MonitoredDomain> {
    const [result] = await db.insert(monitoredDomains).values(data).returning();
    return result;
  }

  async updateMonitoredDomain(id: string, userId: string, updates: Partial<MonitoredDomain>): Promise<MonitoredDomain | undefined> {
    const [result] = await db
      .update(monitoredDomains)
      .set(updates)
      .where(and(eq(monitoredDomains.id, id), eq(monitoredDomains.userId, userId)))
      .returning();
    return result;
  }

  async deleteMonitoredDomain(id: string, userId: string): Promise<boolean> {
    await db
      .delete(monitoredDomains)
      .where(and(eq(monitoredDomains.id, id), eq(monitoredDomains.userId, userId)));
    return true;
  }

  async updateMonitoredDomainStatus(id: string, status: string, listedCount: number): Promise<void> {
    const current = await db.select().from(monitoredDomains).where(eq(monitoredDomains.id, id));
    const previousStatus = current[0]?.lastStatus || null;
    
    await db
      .update(monitoredDomains)
      .set({
        lastStatus: status,
        previousStatus: previousStatus,
        listedCount: listedCount,
        lastCheckedAt: new Date(),
      })
      .where(eq(monitoredDomains.id, id));
  }

  async getDomainsForScheduledCheck(frequencies: string[]): Promise<MonitoredDomain[]> {
    if (frequencies.length === 0) return [];
    
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    
    return db
      .select()
      .from(monitoredDomains)
      .where(
        and(
          sql`${monitoredDomains.checkFrequency} = ANY(${frequencies})`,
          sql`(${monitoredDomains.lastCheckedAt} IS NULL OR ${monitoredDomains.lastCheckedAt} < ${oneDayAgo})`
        )
      );
  }

  async saveBlacklistCheck(data: InsertBlacklistCheckHistory): Promise<BlacklistCheckHistory> {
    const [result] = await db.insert(blacklistCheckHistory).values(data).returning();
    return result;
  }

  async getBlacklistCheckHistory(userId: string, domain?: string, limit: number = 20): Promise<BlacklistCheckHistory[]> {
    if (domain) {
      return db
        .select()
        .from(blacklistCheckHistory)
        .where(and(eq(blacklistCheckHistory.userId, userId), eq(blacklistCheckHistory.domain, domain)))
        .orderBy(desc(blacklistCheckHistory.createdAt))
        .limit(limit);
    }
    return db
      .select()
      .from(blacklistCheckHistory)
      .where(eq(blacklistCheckHistory.userId, userId))
      .orderBy(desc(blacklistCheckHistory.createdAt))
      .limit(limit);
  }

  // Articles/Resources
  async getArticles(publishedOnly: boolean = false): Promise<Article[]> {
    if (publishedOnly) {
      return db
        .select()
        .from(articles)
        .where(eq(articles.published, true))
        .orderBy(desc(articles.publishedAt));
    }
    return db
      .select()
      .from(articles)
      .orderBy(desc(articles.createdAt));
  }

  async getArticleById(id: string): Promise<Article | undefined> {
    const [article] = await db.select().from(articles).where(eq(articles.id, id));
    return article;
  }

  async getArticleBySlug(slug: string): Promise<Article | undefined> {
    const [article] = await db.select().from(articles).where(eq(articles.slug, slug));
    return article;
  }

  async createArticle(data: InsertArticle): Promise<Article> {
    const [article] = await db.insert(articles).values(data).returning();
    return article;
  }

  async updateArticle(id: string, updates: Partial<Article>): Promise<Article | undefined> {
    const [article] = await db
      .update(articles)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(articles.id, id))
      .returning();
    return article;
  }

  async deleteArticle(id: string): Promise<boolean> {
    await db.delete(articles).where(eq(articles.id, id));
    return true;
  }

  async incrementArticleViewCount(id: string): Promise<void> {
    await db
      .update(articles)
      .set({ viewCount: sql`${articles.viewCount} + 1` })
      .where(eq(articles.id, id));
  }

  // Manual Campaign Stats
  async getManualCampaignStats(userId: string): Promise<ManualCampaignStats[]> {
    return db
      .select()
      .from(manualCampaignStats)
      .where(eq(manualCampaignStats.userId, userId))
      .orderBy(desc(manualCampaignStats.createdAt));
  }

  async getManualCampaignStatsById(id: string, userId: string): Promise<ManualCampaignStats | undefined> {
    const [stats] = await db
      .select()
      .from(manualCampaignStats)
      .where(and(eq(manualCampaignStats.id, id), eq(manualCampaignStats.userId, userId)));
    return stats;
  }

  async createManualCampaignStats(data: InsertManualCampaignStats): Promise<ManualCampaignStats> {
    const [stats] = await db.insert(manualCampaignStats).values(data).returning();
    return stats;
  }

  async updateManualCampaignStats(id: string, userId: string, updates: Partial<ManualCampaignStats>): Promise<ManualCampaignStats | undefined> {
    const [stats] = await db
      .update(manualCampaignStats)
      .set({ ...updates, updatedAt: new Date() })
      .where(and(eq(manualCampaignStats.id, id), eq(manualCampaignStats.userId, userId)))
      .returning();
    return stats;
  }

  async deleteManualCampaignStats(id: string, userId: string): Promise<boolean> {
    await db
      .delete(manualCampaignStats)
      .where(and(eq(manualCampaignStats.id, id), eq(manualCampaignStats.userId, userId)));
    return true;
  }
}

export const storage = new DatabaseStorage();
