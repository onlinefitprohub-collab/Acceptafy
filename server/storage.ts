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
}

export const storage = new DatabaseStorage();
