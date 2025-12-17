import { storage } from '../storage';
import type { 
  ESPCampaignStats, 
  ESPProviderType,
  InsertESPCampaignHistory,
  InsertESPBaseline,
  InsertDeliverabilityAlert,
  InsertCampaignRiskScore,
  RiskLevel,
  ProviderHealth,
} from '@shared/schema';

interface TrendAnalysis {
  metric: string;
  current: number;
  baseline: number;
  deviationFactor: number;
  trend: 'improving' | 'stable' | 'declining';
  severity: 'info' | 'warning' | 'critical';
}

interface RiskFactor {
  factor: string;
  impact: 'low' | 'medium' | 'high';
  recommendation: string;
}

export class DeliverabilityIntelligenceService {
  
  async syncCampaignHistory(
    userId: string, 
    provider: ESPProviderType, 
    campaigns: ESPCampaignStats[]
  ): Promise<void> {
    for (const campaign of campaigns) {
      const historyEntry: InsertESPCampaignHistory = {
        userId,
        provider,
        campaignId: campaign.campaignId,
        campaignName: campaign.campaignName,
        subject: campaign.subject,
        sentAt: campaign.sentAt ? new Date(campaign.sentAt) : undefined,
        totalSent: campaign.totalSent,
        delivered: campaign.delivered,
        opened: campaign.opened,
        clicked: campaign.clicked,
        bounced: campaign.bounced,
        unsubscribed: campaign.unsubscribed,
        spamReports: campaign.spamReports,
        openRate: Math.round(campaign.openRate * 100),
        clickRate: Math.round(campaign.clickRate * 100),
        bounceRate: Math.round(campaign.bounceRate * 100),
        unsubscribeRate: Math.round(campaign.unsubscribeRate * 100),
      };
      
      await storage.saveCampaignHistory(historyEntry);
    }
    
    await this.updateBaselines(userId, provider);
    await this.checkForAlerts(userId, provider, campaigns);
  }

  async updateBaselines(userId: string, provider: ESPProviderType): Promise<void> {
    const history = await storage.getCampaignHistory(userId, provider, 100);
    
    if (history.length < 3) {
      return;
    }

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentCampaigns = history.filter(
      h => h.sentAt && new Date(h.sentAt) >= thirtyDaysAgo
    );
    
    if (recentCampaigns.length < 3) {
      return;
    }

    const avgOpenRate = this.calculateAverage(recentCampaigns.map(c => c.openRate || 0));
    const avgClickRate = this.calculateAverage(recentCampaigns.map(c => c.clickRate || 0));
    const avgBounceRate = this.calculateAverage(recentCampaigns.map(c => c.bounceRate || 0));
    const avgUnsubscribeRate = this.calculateAverage(recentCampaigns.map(c => c.unsubscribeRate || 0));
    const avgComplaintRate = this.calculateAverage(
      recentCampaigns.map(c => c.totalSent > 0 ? (c.spamReports || 0) / c.totalSent * 10000 : 0)
    );
    const avgDeliveryRate = this.calculateAverage(
      recentCampaigns.map(c => c.totalSent > 0 ? (c.delivered || 0) / c.totalSent * 10000 : 0)
    );
    const avgVolume = this.calculateAverage(recentCampaigns.map(c => c.totalSent || 0));
    
    const openRateStdDev = this.calculateStdDev(recentCampaigns.map(c => c.openRate || 0), avgOpenRate);
    const bounceRateStdDev = this.calculateStdDev(recentCampaigns.map(c => c.bounceRate || 0), avgBounceRate);

    const baseline: InsertESPBaseline = {
      userId,
      provider,
      avgOpenRate: Math.round(avgOpenRate),
      avgClickRate: Math.round(avgClickRate),
      avgBounceRate: Math.round(avgBounceRate),
      avgComplaintRate: Math.round(avgComplaintRate),
      avgUnsubscribeRate: Math.round(avgUnsubscribeRate),
      avgDeliveryRate: Math.round(avgDeliveryRate),
      openRateStdDev: Math.round(openRateStdDev),
      bounceRateStdDev: Math.round(bounceRateStdDev),
      avgCampaignVolume: Math.round(avgVolume),
      avgSendsPerWeek: Math.round(recentCampaigns.length / 4),
      campaignsAnalyzed: recentCampaigns.length,
      periodStart: thirtyDaysAgo,
      periodEnd: new Date(),
    };

    await storage.upsertBaseline(baseline);
  }

  async checkForAlerts(
    userId: string, 
    provider: ESPProviderType, 
    campaigns: ESPCampaignStats[]
  ): Promise<void> {
    const baselines = await storage.getBaselines(userId, provider);
    const baseline = baselines.find(b => !b.domain);
    
    if (!baseline || baseline.campaignsAnalyzed === 0) {
      return;
    }

    for (const campaign of campaigns.slice(0, 5)) {
      const alerts = this.analyzeCampaignMetrics(campaign, baseline, provider);
      
      for (const alert of alerts) {
        const alertData: InsertDeliverabilityAlert = {
          userId,
          provider,
          alertType: alert.alertType,
          severity: alert.severity,
          title: alert.title,
          message: alert.message,
          metric: alert.metric,
          currentValue: alert.currentValue,
          baselineValue: alert.baselineValue,
          deviationFactor: alert.deviationFactor,
          campaignId: campaign.campaignId,
        };
        
        await storage.createDeliverabilityAlert(alertData);
      }
    }
  }

  private analyzeCampaignMetrics(
    campaign: ESPCampaignStats, 
    baseline: any,
    provider: string
  ): Array<{
    alertType: string;
    severity: 'info' | 'warning' | 'critical';
    title: string;
    message: string;
    metric: string;
    currentValue: number;
    baselineValue: number;
    deviationFactor: number;
  }> {
    const alerts: any[] = [];
    
    const currentBounceRate = Math.round(campaign.bounceRate * 100);
    const baselineBounceRate = baseline.avgBounceRate || 0;
    
    if (baselineBounceRate > 0 && currentBounceRate > baselineBounceRate * 2) {
      const factor = Math.round(currentBounceRate / baselineBounceRate * 100);
      alerts.push({
        alertType: 'bounce_spike',
        severity: factor > 300 ? 'critical' : 'warning',
        title: 'Bounce Rate Spike Detected',
        message: `Campaign "${campaign.campaignName}" has ${(campaign.bounceRate).toFixed(1)}% bounce rate, which is ${(factor / 100).toFixed(1)}× your baseline of ${(baselineBounceRate / 100).toFixed(1)}%.`,
        metric: 'bounceRate',
        currentValue: currentBounceRate,
        baselineValue: baselineBounceRate,
        deviationFactor: factor,
      });
    }

    const complaintRate = campaign.totalSent > 0 
      ? (campaign.spamReports / campaign.totalSent) * 100 
      : 0;
    
    if (complaintRate > 0.1) {
      alerts.push({
        alertType: 'complaint_spike',
        severity: complaintRate > 0.3 ? 'critical' : 'warning',
        title: 'High Complaint Rate Warning',
        message: `Campaign "${campaign.campaignName}" has ${complaintRate.toFixed(2)}% complaint rate. This may harm your sender reputation.`,
        metric: 'complaintRate',
        currentValue: Math.round(complaintRate * 100),
        baselineValue: baseline.avgComplaintRate || 0,
        deviationFactor: 200,
      });
    }

    const currentOpenRate = Math.round(campaign.openRate * 100);
    const baselineOpenRate = baseline.avgOpenRate || 0;
    
    if (baselineOpenRate > 0 && currentOpenRate < baselineOpenRate * 0.5) {
      const factor = Math.round(baselineOpenRate / Math.max(currentOpenRate, 1) * 100);
      alerts.push({
        alertType: 'engagement_drop',
        severity: factor > 300 ? 'critical' : 'warning',
        title: 'Significant Engagement Drop',
        message: `Campaign "${campaign.campaignName}" has ${campaign.openRate.toFixed(1)}% open rate, which is ${(100 - currentOpenRate / baselineOpenRate * 100).toFixed(0)}% below your baseline.`,
        metric: 'openRate',
        currentValue: currentOpenRate,
        baselineValue: baselineOpenRate,
        deviationFactor: factor,
      });
    }

    return alerts;
  }

  async calculateRiskScore(
    userId: string,
    provider: ESPProviderType,
    subject?: string,
    estimatedVolume?: number
  ): Promise<{
    overallRisk: RiskLevel;
    riskScore: number;
    riskFactors: RiskFactor[];
    predictions: {
      openRate: number;
      bounceRate: number;
      complaintRate: number;
    };
  }> {
    const baselines = await storage.getBaselines(userId, provider);
    const baseline = baselines.find(b => !b.domain);
    const history = await storage.getCampaignHistory(userId, provider, 10);
    
    const riskFactors: RiskFactor[] = [];
    let riskScore = 0;

    if (!baseline || history.length < 3) {
      return {
        overallRisk: 'low',
        riskScore: 20,
        riskFactors: [{
          factor: 'Insufficient Data',
          impact: 'low',
          recommendation: 'Continue sending to build historical data for better predictions.',
        }],
        predictions: {
          openRate: 20,
          bounceRate: 2,
          complaintRate: 0.05,
        },
      };
    }

    if (estimatedVolume && baseline.avgCampaignVolume) {
      const volumeRatio = estimatedVolume / baseline.avgCampaignVolume;
      if (volumeRatio > 2) {
        riskScore += 25;
        riskFactors.push({
          factor: `Volume ${volumeRatio.toFixed(1)}× higher than usual`,
          impact: volumeRatio > 3 ? 'high' : 'medium',
          recommendation: 'Consider splitting into smaller batches to avoid triggering spam filters.',
        });
      }
    }

    const recentCampaigns = history.slice(0, 3);
    const avgRecentBounce = this.calculateAverage(
      recentCampaigns.map(c => c.bounceRate || 0)
    );
    if (avgRecentBounce > (baseline.avgBounceRate || 0) * 1.5) {
      riskScore += 20;
      riskFactors.push({
        factor: 'Recent campaigns show elevated bounce rates',
        impact: 'medium',
        recommendation: 'Review your list hygiene and remove invalid addresses.',
      });
    }

    const avgRecentComplaints = this.calculateAverage(
      recentCampaigns.map(c => c.spamReports || 0)
    );
    if (avgRecentComplaints > 0) {
      riskScore += 15;
      riskFactors.push({
        factor: 'Recent spam complaints detected',
        impact: 'medium',
        recommendation: 'Ensure clear unsubscribe options and avoid aggressive subject lines.',
      });
    }

    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const sendsThisWeek = history.filter(
      h => h.sentAt && new Date(h.sentAt) >= weekAgo
    ).length;
    
    if (sendsThisWeek > (baseline.avgSendsPerWeek || 1) * 2) {
      riskScore += 15;
      riskFactors.push({
        factor: `Sending frequency ${(sendsThisWeek / (baseline.avgSendsPerWeek || 1)).toFixed(1)}× higher than usual`,
        impact: 'medium',
        recommendation: 'Higher frequency can lead to subscriber fatigue. Consider spacing out campaigns.',
      });
    }

    let overallRisk: RiskLevel = 'low';
    if (riskScore >= 50) {
      overallRisk = 'high';
    } else if (riskScore >= 25) {
      overallRisk = 'medium';
    }

    const predictions = {
      openRate: (baseline.avgOpenRate || 2000) / 100,
      bounceRate: (baseline.avgBounceRate || 200) / 100,
      complaintRate: (baseline.avgComplaintRate || 5) / 10000,
    };

    return {
      overallRisk,
      riskScore,
      riskFactors,
      predictions,
    };
  }

  async getProviderHealthPanels(userId: string): Promise<ProviderHealth[]> {
    const baselines = await storage.getBaselines(userId);
    const history = await storage.getCampaignHistory(userId, undefined, 50);
    const alerts = await storage.getDeliverabilityAlerts(userId, true);
    
    const providers = [...new Set(baselines.map(b => b.provider))];
    const healthPanels: ProviderHealth[] = [];

    for (const provider of providers) {
      const providerBaseline = baselines.find(b => b.provider === provider && !b.domain);
      const recentCampaigns = history.filter(h => h.provider === provider).slice(0, 10);
      const providerAlerts = alerts.filter(a => a.provider === provider);
      
      if (!providerBaseline || recentCampaigns.length === 0) continue;

      const currentMetrics = {
        openRate: this.calculateAverage(recentCampaigns.map(c => (c.openRate || 0) / 100)),
        clickRate: this.calculateAverage(recentCampaigns.map(c => (c.clickRate || 0) / 100)),
        bounceRate: this.calculateAverage(recentCampaigns.map(c => (c.bounceRate || 0) / 100)),
        complaintRate: this.calculateAverage(
          recentCampaigns.map(c => c.totalSent > 0 ? (c.spamReports || 0) / c.totalSent * 100 : 0)
        ),
        deliveryRate: this.calculateAverage(
          recentCampaigns.map(c => c.totalSent > 0 ? (c.delivered || 0) / c.totalSent * 100 : 0)
        ),
      };

      const baselineMetrics = {
        openRate: (providerBaseline.avgOpenRate || 0) / 100,
        clickRate: (providerBaseline.avgClickRate || 0) / 100,
        bounceRate: (providerBaseline.avgBounceRate || 0) / 100,
        complaintRate: (providerBaseline.avgComplaintRate || 0) / 10000,
      };

      let trend: 'improving' | 'stable' | 'declining' = 'stable';
      if (currentMetrics.openRate > baselineMetrics.openRate * 1.1) {
        trend = 'improving';
      } else if (currentMetrics.openRate < baselineMetrics.openRate * 0.9) {
        trend = 'declining';
      }

      healthPanels.push({
        provider,
        domain: 'aggregate',
        metrics: currentMetrics,
        baseline: baselineMetrics,
        trend,
        alerts: providerAlerts.map(a => a.title),
      });
    }

    return healthPanels;
  }

  async compareCampaigns(
    userId: string,
    campaignId1: string,
    campaignId2: string
  ): Promise<{
    campaign1: any;
    campaign2: any;
    differences: Array<{
      metric: string;
      value1: number;
      value2: number;
      change: number;
      impact: string;
    }>;
    insights: string[];
  }> {
    const history = await storage.getCampaignHistory(userId);
    const campaign1 = history.find(h => h.campaignId === campaignId1);
    const campaign2 = history.find(h => h.campaignId === campaignId2);

    if (!campaign1 || !campaign2) {
      throw new Error('One or both campaigns not found');
    }

    const differences = [];
    const insights: string[] = [];

    const metrics = [
      { key: 'openRate', label: 'Open Rate', divisor: 100 },
      { key: 'clickRate', label: 'Click Rate', divisor: 100 },
      { key: 'bounceRate', label: 'Bounce Rate', divisor: 100 },
      { key: 'totalSent', label: 'Volume', divisor: 1 },
    ];

    for (const metric of metrics) {
      const value1 = (campaign1 as any)[metric.key] || 0;
      const value2 = (campaign2 as any)[metric.key] || 0;
      const change = value1 > 0 ? ((value2 - value1) / value1 * 100) : 0;
      
      let impact = 'neutral';
      if (metric.key === 'openRate' || metric.key === 'clickRate') {
        impact = change > 10 ? 'positive' : change < -10 ? 'negative' : 'neutral';
      } else if (metric.key === 'bounceRate') {
        impact = change > 10 ? 'negative' : change < -10 ? 'positive' : 'neutral';
      }

      differences.push({
        metric: metric.label,
        value1: value1 / metric.divisor,
        value2: value2 / metric.divisor,
        change,
        impact,
      });

      if (Math.abs(change) > 20) {
        insights.push(`${metric.label} changed by ${change > 0 ? '+' : ''}${change.toFixed(0)}% between campaigns`);
      }
    }

    if (campaign1.subject !== campaign2.subject) {
      insights.push('Subject lines differ between campaigns');
    }

    if (Math.abs((campaign1.totalSent || 0) - (campaign2.totalSent || 0)) > (campaign1.totalSent || 1) * 0.5) {
      insights.push('Significant volume difference may affect deliverability metrics');
    }

    return {
      campaign1,
      campaign2,
      differences,
      insights,
    };
  }

  private calculateAverage(values: number[]): number {
    if (values.length === 0) return 0;
    return values.reduce((sum, v) => sum + v, 0) / values.length;
  }

  private calculateStdDev(values: number[], mean: number): number {
    if (values.length < 2) return 0;
    const squaredDiffs = values.map(v => Math.pow(v - mean, 2));
    return Math.sqrt(squaredDiffs.reduce((sum, v) => sum + v, 0) / values.length);
  }
}

export const deliverabilityIntelligence = new DeliverabilityIntelligenceService();
