import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Clock, 
  TrendingUp, 
  BarChart3, 
  Shield, 
  Loader2,
  Calendar,
  ThumbsUp,
  ThumbsDown,
  Minus,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Lightbulb,
  ArrowUp,
  ArrowDown,
  Target
} from 'lucide-react';
import type { 
  SendTimeOptimization, 
  EngagementPrediction, 
  IndustryBenchmark, 
  ReputationInsight 
} from '../types';

interface InsightsPanelProps {
  emailContent: string;
  subject: string;
  preview: string;
  industry?: string;
  overallScore?: number;
}

export function InsightsPanel({ emailContent, subject, preview, industry = 'general', overallScore = 70 }: InsightsPanelProps) {
  const [sendTimeData, setSendTimeData] = useState<SendTimeOptimization | null>(null);
  const [engagementData, setEngagementData] = useState<EngagementPrediction | null>(null);
  const [benchmarkData, setBenchmarkData] = useState<IndustryBenchmark | null>(null);
  const [reputationData, setReputationData] = useState<ReputationInsight | null>(null);

  const sendTimeMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('POST', '/api/insights/send-time', { 
        emailContent, 
        industry 
      });
      return res.json();
    },
    onSuccess: (data) => setSendTimeData(data)
  });

  const engagementMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('POST', '/api/insights/engagement', { 
        subject, 
        preview, 
        body: emailContent, 
        industry 
      });
      return res.json();
    },
    onSuccess: (data) => setEngagementData(data)
  });

  const benchmarkMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('POST', '/api/insights/benchmark', { 
        emailContent, 
        subject, 
        industry, 
        overallScore 
      });
      return res.json();
    },
    onSuccess: (data) => setBenchmarkData(data)
  });

  const reputationMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('POST', '/api/insights/reputation', { 
        emailContent 
      });
      return res.json();
    },
    onSuccess: (data) => setReputationData(data)
  });

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => sendTimeMutation.mutate()}
          disabled={sendTimeMutation.isPending}
          className="flex flex-col items-center gap-1 h-auto py-3 text-xs"
          data-testid="btn-send-time"
        >
          {sendTimeMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Clock className="w-4 h-4" />}
          <span>Send Time</span>
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => engagementMutation.mutate()}
          disabled={engagementMutation.isPending}
          className="flex flex-col items-center gap-1 h-auto py-3 text-xs"
          data-testid="btn-engagement"
        >
          {engagementMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <TrendingUp className="w-4 h-4" />}
          <span>Engagement</span>
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => benchmarkMutation.mutate()}
          disabled={benchmarkMutation.isPending}
          className="flex flex-col items-center gap-1 h-auto py-3 text-xs"
          data-testid="btn-benchmark"
        >
          {benchmarkMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <BarChart3 className="w-4 h-4" />}
          <span>Benchmark</span>
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => reputationMutation.mutate()}
          disabled={reputationMutation.isPending}
          className="flex flex-col items-center gap-1 h-auto py-3 text-xs"
          data-testid="btn-reputation"
        >
          {reputationMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Shield className="w-4 h-4" />}
          <span>Reputation</span>
        </Button>
      </div>

      {sendTimeData && <SendTimeCard data={sendTimeData} />}
      {engagementData && <EngagementCard data={engagementData} />}
      {benchmarkData && <BenchmarkCard data={benchmarkData} />}
      {reputationData && <ReputationCard data={reputationData} />}
    </div>
  );
}

function SendTimeCard({ data }: { data: SendTimeOptimization }) {
  return (
    <Card className="border-blue-500/30" data-testid="card-send-time">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Clock className="w-4 h-4 text-blue-400" />
          Optimal Send Times
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">{data.summary}</p>
        
        <div className="space-y-2">
          <h4 className="text-sm font-medium flex items-center gap-1 text-green-400">
            <ThumbsUp className="w-3 h-3" /> Best Times
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {data.bestTimes?.slice(0, 3).map((slot, i) => (
              <div key={i} className="bg-green-500/10 border border-green-500/30 rounded-lg p-2 text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <Calendar className="w-3 h-3 text-green-400" />
                  <span className="text-xs font-medium">{slot.day}</span>
                </div>
                <div className="text-lg font-bold text-green-400">{slot.hour}</div>
                <div className="text-[10px] text-muted-foreground line-clamp-2">{slot.reason}</div>
              </div>
            ))}
          </div>
        </div>

        {data.worstTimes && data.worstTimes.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium flex items-center gap-1 text-red-400">
              <ThumbsDown className="w-3 h-3" /> Avoid These Times
            </h4>
            <div className="flex flex-wrap gap-2">
              {data.worstTimes.slice(0, 2).map((slot, i) => (
                <Badge key={i} variant="outline" className="text-red-400 border-red-500/30">
                  {slot.day} {slot.hour}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {data.industryInsight && (
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <Lightbulb className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-muted-foreground">{data.industryInsight}</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function EngagementCard({ data }: { data: EngagementPrediction }) {
  const getScoreColor = (score: number) => {
    if (score >= 70) return 'text-green-400';
    if (score >= 40) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getImpactIcon = (impact: string) => {
    if (impact === 'positive') return <ThumbsUp className="w-3 h-3 text-green-400" />;
    if (impact === 'negative') return <ThumbsDown className="w-3 h-3 text-red-400" />;
    return <Minus className="w-3 h-3 text-gray-400" />;
  };

  return (
    <Card className="border-purple-500/30" data-testid="card-engagement">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <TrendingUp className="w-4 h-4 text-purple-400" />
          Engagement Prediction
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="text-center p-3 bg-card/50 rounded-lg border border-border/50">
            <div className={`text-2xl font-bold ${getScoreColor(data.predictedOpenRate)}`}>
              {data.predictedOpenRate?.toFixed(0)}%
            </div>
            <div className="text-xs text-muted-foreground">Open Rate</div>
          </div>
          <div className="text-center p-3 bg-card/50 rounded-lg border border-border/50">
            <div className={`text-2xl font-bold ${getScoreColor(data.predictedClickRate)}`}>
              {data.predictedClickRate?.toFixed(0)}%
            </div>
            <div className="text-xs text-muted-foreground">Click Rate</div>
          </div>
          <div className="text-center p-3 bg-card/50 rounded-lg border border-border/50">
            <div className="text-2xl font-bold text-blue-400">
              {data.predictedUnsubscribeRate?.toFixed(1)}%
            </div>
            <div className="text-xs text-muted-foreground">Unsub Rate</div>
          </div>
          <div className="text-center p-3 bg-card/50 rounded-lg border border-border/50">
            <div className={`text-2xl font-bold ${getScoreColor(data.engagementScore)}`}>
              {data.engagementScore}
            </div>
            <div className="text-xs text-muted-foreground">Score</div>
          </div>
        </div>

        <p className="text-sm text-muted-foreground">{data.summary}</p>

        {data.factors && data.factors.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Key Factors</h4>
            <div className="space-y-1">
              {data.factors.slice(0, 4).map((factor, i) => (
                <div key={i} className="flex items-center gap-2 text-xs p-2 bg-background/50 rounded">
                  {getImpactIcon(factor.impact)}
                  <span className="flex-1">{factor.factor}</span>
                  <span className="text-muted-foreground">{factor.weight}%</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {data.recommendations && data.recommendations.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium flex items-center gap-1">
              <Target className="w-3 h-3" /> Recommendations
            </h4>
            <ul className="text-xs text-muted-foreground space-y-1">
              {data.recommendations.slice(0, 3).map((rec, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-purple-400">•</span>
                  {rec}
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function BenchmarkCard({ data }: { data: IndustryBenchmark }) {
  const getStatusIcon = (status: string) => {
    if (status === 'above') return <ArrowUp className="w-3 h-3 text-green-400" />;
    if (status === 'below') return <ArrowDown className="w-3 h-3 text-red-400" />;
    return <Minus className="w-3 h-3 text-yellow-400" />;
  };

  const getStatusColor = (status: string) => {
    if (status === 'above') return 'text-green-400 bg-green-500/10 border-green-500/30';
    if (status === 'below') return 'text-red-400 bg-red-500/10 border-red-500/30';
    return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30';
  };

  return (
    <Card className="border-amber-500/30" data-testid="card-benchmark">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <BarChart3 className="w-4 h-4 text-amber-400" />
          Industry Benchmark: {data.industry}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between p-3 bg-card/50 rounded-lg border border-border/50">
          <div className="text-center flex-1">
            <div className="text-2xl font-bold text-amber-400">{data.yourScore}</div>
            <div className="text-xs text-muted-foreground">Your Score</div>
          </div>
          <div className="h-8 w-px bg-border" />
          <div className="text-center flex-1">
            <div className="text-2xl font-bold text-muted-foreground">{data.industryAverage}</div>
            <div className="text-xs text-muted-foreground">Industry Avg</div>
          </div>
          <div className="h-8 w-px bg-border" />
          <div className="text-center flex-1">
            <div className="text-2xl font-bold text-green-400">{data.topPerformers}</div>
            <div className="text-xs text-muted-foreground">Top 10%</div>
          </div>
        </div>

        <div className="space-y-1">
          <div className="flex justify-between text-xs">
            <span>Your Percentile</span>
            <span className="font-medium">{data.percentile}%</span>
          </div>
          <Progress value={data.percentile} className="h-2" />
        </div>

        <p className="text-sm text-muted-foreground">{data.summary}</p>

        {data.metrics && data.metrics.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Metrics Comparison</h4>
            <div className="space-y-2">
              {data.metrics.slice(0, 5).map((metric, i) => (
                <div key={i} className={`p-2 rounded border ${getStatusColor(metric.status)}`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium flex items-center gap-1">
                      {getStatusIcon(metric.status)}
                      {metric.metric}
                    </span>
                    <div className="text-xs">
                      <span className="font-medium">{metric.yourValue}</span>
                      <span className="text-muted-foreground"> vs {metric.benchmark}</span>
                    </div>
                  </div>
                  <p className="text-[10px] text-muted-foreground">{metric.tip}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ReputationCard({ data }: { data: ReputationInsight }) {
  const getHealthColor = (health: string) => {
    switch (health) {
      case 'Excellent': return 'text-green-400 bg-green-500/10 border-green-500/30';
      case 'Good': return 'text-blue-400 bg-blue-500/10 border-blue-500/30';
      case 'Fair': return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30';
      default: return 'text-red-400 bg-red-500/10 border-red-500/30';
    }
  };

  const getStatusIcon = (status: string) => {
    if (status === 'good') return <CheckCircle className="w-4 h-4 text-green-400" />;
    if (status === 'warning') return <AlertTriangle className="w-4 h-4 text-yellow-400" />;
    return <XCircle className="w-4 h-4 text-red-400" />;
  };

  return (
    <Card className="border-emerald-500/30" data-testid="card-reputation">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Shield className="w-4 h-4 text-emerald-400" />
          Reputation Insights
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4">
          <div className={`px-4 py-2 rounded-lg border ${getHealthColor(data.overallHealth)}`}>
            <div className="text-lg font-bold">{data.overallHealth}</div>
            <div className="text-xs">Health Status</div>
          </div>
          <div className="flex-1">
            <div className="flex justify-between text-xs mb-1">
              <span>Reputation Score</span>
              <span className="font-medium">{data.score}/100</span>
            </div>
            <Progress value={data.score} className="h-2" />
          </div>
        </div>

        <p className="text-sm text-muted-foreground">{data.summary}</p>

        {data.factors && data.factors.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Reputation Factors</h4>
            <div className="space-y-2">
              {data.factors.map((factor, i) => (
                <div key={i} className="p-2 bg-background/50 rounded border border-border/50">
                  <div className="flex items-center gap-2 mb-1">
                    {getStatusIcon(factor.status)}
                    <span className="text-sm font-medium">{factor.factor}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mb-1">{factor.description}</p>
                  <p className="text-xs text-emerald-400">{factor.actionItem}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {data.tips && data.tips.length > 0 && (
          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-3">
            <h4 className="text-sm font-medium flex items-center gap-1 mb-2">
              <Lightbulb className="w-3 h-3" /> Quick Tips
            </h4>
            <ul className="text-xs text-muted-foreground space-y-1">
              {data.tips.slice(0, 4).map((tip, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-emerald-400">•</span>
                  {tip}
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
