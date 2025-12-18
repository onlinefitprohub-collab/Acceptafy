import { storage } from "../storage";
import { fetchESPListHealth, type ListHealthData, type ESPCredentials } from "./esp";
import type { ESPProviderType, ListHealthSnapshot, InsertListHealthSnapshot } from "@shared/schema";

export interface ListHealthDashboardData {
  provider: string;
  lists: ListWithHealth[];
  summary: ListHealthSummary;
  lastUpdated: Date | null;
}

export interface ListWithHealth extends ListHealthData {
  healthScore: number;
  healthTrend: 'improving' | 'stable' | 'declining';
  engagementTier: 'high' | 'medium' | 'low';
  growthRate: number;
}

export interface ListHealthSummary {
  totalSubscribers: number;
  activeSubscribers: number;
  unsubscribedTotal: number;
  bouncedTotal: number;
  complaintsTotal: number;
  avgHealthScore: number;
  avgOpenRate: number;
  avgClickRate: number;
  overallEngagementTier: 'high' | 'medium' | 'low';
  listCount: number;
}

function calculateEngagementTier(openRate: number, clickRate: number): 'high' | 'medium' | 'low' {
  const engagementScore = (openRate * 0.6) + (clickRate * 0.4);
  if (engagementScore >= 25) return 'high';
  if (engagementScore >= 12) return 'medium';
  return 'low';
}

function calculateHealthScore(
  openRate: number,
  clickRate: number,
  bounceRate: number,
  complaintRate: number,
  unsubscribeRate: number
): number {
  let score = 50;
  
  if (openRate >= 40) score += 20;
  else if (openRate >= 25) score += 15;
  else if (openRate >= 15) score += 10;
  else if (openRate >= 10) score += 5;
  else score -= 10;
  
  if (clickRate >= 5) score += 15;
  else if (clickRate >= 3) score += 10;
  else if (clickRate >= 1) score += 5;
  
  if (bounceRate <= 0.5) score += 10;
  else if (bounceRate <= 2) score += 5;
  else if (bounceRate >= 5) score -= 15;
  else if (bounceRate >= 3) score -= 10;
  
  if (complaintRate <= 0.01) score += 10;
  else if (complaintRate <= 0.05) score += 5;
  else if (complaintRate >= 0.1) score -= 20;
  else if (complaintRate >= 0.05) score -= 10;
  
  if (unsubscribeRate <= 0.2) score += 5;
  else if (unsubscribeRate >= 1) score -= 10;
  else if (unsubscribeRate >= 0.5) score -= 5;
  
  return Math.max(0, Math.min(100, score));
}

function calculateHealthTrend(
  currentSnapshot: ListHealthData,
  previousSnapshot?: ListHealthSnapshot
): 'improving' | 'stable' | 'declining' {
  if (!previousSnapshot) return 'stable';
  
  const currentScore = calculateHealthScore(
    currentSnapshot.avgOpenRate || 0,
    currentSnapshot.avgClickRate || 0,
    currentSnapshot.bouncedCount && currentSnapshot.totalSubscribers 
      ? (currentSnapshot.bouncedCount / currentSnapshot.totalSubscribers) * 100 
      : 0,
    currentSnapshot.complaintsCount && currentSnapshot.totalSubscribers
      ? (currentSnapshot.complaintsCount / currentSnapshot.totalSubscribers) * 100
      : 0,
    currentSnapshot.unsubscribedCount && currentSnapshot.totalSubscribers
      ? (currentSnapshot.unsubscribedCount / currentSnapshot.totalSubscribers) * 100
      : 0
  );
  
  const previousScore = previousSnapshot.healthScore || 50;
  const diff = currentScore - previousScore;
  
  if (diff >= 5) return 'improving';
  if (diff <= -5) return 'declining';
  return 'stable';
}

function calculateGrowthRate(current: number, previous?: number): number {
  if (!previous || previous === 0) return 0;
  return Math.round(((current - previous) / previous) * 100);
}

export async function getListHealthDashboard(
  userId: string,
  provider: ESPProviderType
): Promise<ListHealthDashboardData | null> {
  const connection = await storage.getESPConnection(userId, provider);
  if (!connection) {
    return null;
  }
  
  const credentials: ESPCredentials = {
    apiKey: connection.apiKey || undefined,
    apiUrl: connection.apiUrl || undefined,
    accessToken: connection.accessToken || undefined,
    refreshToken: connection.refreshToken || undefined,
    appId: connection.appId || undefined,
  };

  const listHealthResult = await fetchESPListHealth(provider, credentials);
  if (!listHealthResult.success || listHealthResult.lists.length === 0) {
    return null;
  }

  const listsWithHealth: ListWithHealth[] = [];
  let totalSubscribers = 0;
  let activeSubscribers = 0;
  let unsubscribedTotal = 0;
  let bouncedTotal = 0;
  let complaintsTotal = 0;
  let totalOpenRate = 0;
  let totalClickRate = 0;
  let totalHealthScore = 0;

  for (const list of listHealthResult.lists) {
    const previousSnapshot = await storage.getLatestListHealthSnapshot(userId, provider, list.listId);
    
    const bounceRate = list.totalSubscribers > 0 
      ? ((list.bouncedCount || 0) / list.totalSubscribers) * 100 
      : 0;
    const complaintRate = list.totalSubscribers > 0
      ? ((list.complaintsCount || 0) / list.totalSubscribers) * 100
      : 0;
    const unsubscribeRate = list.totalSubscribers > 0
      ? ((list.unsubscribedCount || 0) / list.totalSubscribers) * 100
      : 0;
    
    const healthScore = calculateHealthScore(
      list.avgOpenRate || 0,
      list.avgClickRate || 0,
      bounceRate,
      complaintRate,
      unsubscribeRate
    );
    
    const healthTrend = calculateHealthTrend(list, previousSnapshot);
    const engagementTier = calculateEngagementTier(list.avgOpenRate || 0, list.avgClickRate || 0);
    const growthRate = calculateGrowthRate(list.totalSubscribers, previousSnapshot?.totalSubscribers ?? undefined);
    
    const snapshotData: InsertListHealthSnapshot = {
      userId,
      provider,
      listId: list.listId,
      listName: list.listName,
      totalSubscribers: list.totalSubscribers,
      activeSubscribers: list.activeSubscribers || list.totalSubscribers,
      unsubscribedCount: list.unsubscribedCount || 0,
      bouncedCount: list.bouncedCount || 0,
      complaintsCount: list.complaintsCount || 0,
      avgOpenRate: Math.round((list.avgOpenRate || 0) * 100),
      avgClickRate: Math.round((list.avgClickRate || 0) * 100),
      growthRate,
      subscribersAdded: previousSnapshot 
        ? Math.max(0, list.totalSubscribers - (previousSnapshot.totalSubscribers || 0))
        : 0,
      subscribersLost: previousSnapshot
        ? Math.max(0, (previousSnapshot.totalSubscribers || 0) - list.totalSubscribers)
        : 0,
      healthScore,
      healthTrend,
      engagementTier,
      lastCampaignSent: list.lastCampaignSent ? new Date(list.lastCampaignSent) : null,
    };
    
    await storage.saveListHealthSnapshot(snapshotData);
    
    listsWithHealth.push({
      ...list,
      healthScore,
      healthTrend,
      engagementTier,
      growthRate,
    });
    
    totalSubscribers += list.totalSubscribers;
    activeSubscribers += list.activeSubscribers || list.totalSubscribers;
    unsubscribedTotal += list.unsubscribedCount || 0;
    bouncedTotal += list.bouncedCount || 0;
    complaintsTotal += list.complaintsCount || 0;
    totalOpenRate += list.avgOpenRate || 0;
    totalClickRate += list.avgClickRate || 0;
    totalHealthScore += healthScore;
  }

  const listCount = listsWithHealth.length;
  const avgOpenRate = listCount > 0 ? totalOpenRate / listCount : 0;
  const avgClickRate = listCount > 0 ? totalClickRate / listCount : 0;
  const avgHealthScore = listCount > 0 ? Math.round(totalHealthScore / listCount) : 50;
  const overallEngagementTier = calculateEngagementTier(avgOpenRate, avgClickRate);

  return {
    provider,
    lists: listsWithHealth,
    summary: {
      totalSubscribers,
      activeSubscribers,
      unsubscribedTotal,
      bouncedTotal,
      complaintsTotal,
      avgHealthScore,
      avgOpenRate,
      avgClickRate,
      overallEngagementTier,
      listCount,
    },
    lastUpdated: new Date(),
  };
}

export async function getListHealthHistory(
  userId: string,
  listId: string,
  limit: number = 30
): Promise<ListHealthSnapshot[]> {
  return storage.getListHealthHistory(userId, listId, limit);
}
