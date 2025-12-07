import {
  users,
  usageCounters,
  emailAnalyses,
  userGamification,
  emailTemplates,
  competitorAnalyses,
  SUBSCRIPTION_LIMITS,
  type User,
  type UpsertUser,
  type UsageCounter,
  type InsertUsageCounter,
  type EmailAnalysis,
  type InsertEmailAnalysis,
  type UserGamification,
  type InsertUserGamification,
  type EmailTemplate,
  type InsertEmailTemplate,
  type CompetitorAnalysis,
  type InsertCompetitorAnalysis,
  type SubscriptionTier,
} from "@shared/schema";
import { db } from "./db";
import { eq, sql, and, gte, lte, desc } from "drizzle-orm";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
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
    const tier = (user?.subscriptionTier || 'free') as SubscriptionTier;
    const limits = SUBSCRIPTION_LIMITS[tier];
    
    const fieldToLimit: Record<string, keyof typeof limits> = {
      gradeCount: 'gradesPerMonth',
      rewriteCount: 'rewritesPerMonth',
      followupCount: 'followupsPerMonth',
      deliverabilityChecks: 'deliverabilityChecksPerMonth',
    };

    const limit = limits[fieldToLimit[field]];
    
    let counter = await this.getUsageCounter(userId);
    if (!counter) {
      counter = await this.createOrResetUsageCounter(userId);
    }

    const current = counter[field] || 0;
    const allowed = limit === -1 || current < limit;

    return { allowed, current, limit };
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
    const totalUsers = allUsers.length;
    
    const activeSubscriptions = allUsers.filter(
      u => u.subscriptionStatus === 'active' && u.subscriptionTier && u.subscriptionTier !== 'starter'
    ).length;
    
    const tierCounts: Record<string, number> = {};
    for (const user of allUsers) {
      const tier = user.subscriptionTier || 'starter';
      tierCounts[tier] = (tierCounts[tier] || 0) + 1;
    }
    const tierBreakdown = Object.entries(tierCounts).map(([tier, count]) => ({ tier, count }));
    
    const allAnalyses = await db.select().from(emailAnalyses);
    const totalGrades = allAnalyses.length;
    
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentSignups = allUsers.filter(
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
    
    // MRR calculation based on subscription tiers (pro = $29/mo, scale = $79/mo)
    const tierPrices: Record<string, number> = {
      'pro': 2900, // cents
      'scale': 7900,
      'starter': 0,
    };
    
    let mrr = 0;
    const subscriptionCounts: Record<string, { count: number; revenue: number }> = {};
    
    for (const user of allUsers) {
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
      
      const count = allUsers.filter(u => {
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
    const paidTierUsers = allUsers.filter(u => 
      u.subscriptionTier && 
      u.subscriptionTier !== 'starter' && 
      (u.subscriptionStatus === 'active' || u.subscriptionStatus === 'canceled')
    );
    const canceledPaidUsers = paidTierUsers.filter(u => u.subscriptionStatus === 'canceled');
    const churnRate = paidTierUsers.length > 0 ? (canceledPaidUsers.length / paidTierUsers.length) * 100 : 0;
    
    // Active users in last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const allGamification = await db.select().from(userGamification);
    const activeUsers30d = allGamification.filter(g => {
      if (!g.lastActiveDate) return false;
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
}

export const storage = new DatabaseStorage();
