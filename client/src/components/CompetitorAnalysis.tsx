import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { 
  Users, 
  ThumbsUp, 
  ThumbsDown, 
  Lightbulb, 
  Target, 
  History, 
  Loader2, 
  Sparkles,
  ArrowRight,
  CheckCircle,
  AlertTriangle,
  Zap
} from 'lucide-react';
import type { CompetitorAnalysisResult, CompetitorStrength, CompetitorWeakness, CompetitorTactic } from '../types';

interface HistoryItem {
  id: number;
  competitorEmail: string;
  analysis: CompetitorAnalysisResult;
  createdAt: string;
}

export function CompetitorAnalysis() {
  const { toast } = useToast();
  const [competitorEmail, setCompetitorEmail] = useState('');
  const [result, setResult] = useState<CompetitorAnalysisResult | null>(null);
  const [activeTab, setActiveTab] = useState('analyze');

  const { data: history = [], isLoading: historyLoading } = useQuery<HistoryItem[]>({
    queryKey: ['/api/competitor/history'],
  });

  const analyzeMutation = useMutation({
    mutationFn: async (email: string) => {
      const response = await apiRequest('POST', '/api/competitor/analyze', { competitorEmail: email });
      return response.json();
    },
    onSuccess: (data) => {
      setResult(data);
      queryClient.invalidateQueries({ queryKey: ['/api/competitor/history'] });
      toast({
        title: 'Analysis Complete',
        description: 'Competitor email analyzed successfully!',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Analysis Failed',
        description: error.message || 'Failed to analyze competitor email',
        variant: 'destructive',
      });
    },
  });

  const handleAnalyze = () => {
    if (!competitorEmail.trim()) {
      toast({
        title: 'Email Required',
        description: 'Please paste a competitor email to analyze',
        variant: 'destructive',
      });
      return;
    }
    analyzeMutation.mutate(competitorEmail);
  };

  const handleLoadHistory = (item: HistoryItem) => {
    setCompetitorEmail(item.competitorEmail);
    setResult(item.analysis);
    setActiveTab('analyze');
  };

  const getEffectivenessColor = (effectiveness: string) => {
    switch (effectiveness) {
      case 'High': return 'bg-green-500/10 text-green-500 border-green-500/30';
      case 'Medium': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/30';
      case 'Low': return 'bg-red-500/10 text-red-500 border-red-500/30';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Competitor Analysis
          </CardTitle>
          <Badge className="bg-gradient-to-r from-violet-500 to-purple-500 text-white text-[10px] px-1.5 py-0">NEW</Badge>
        </div>
        <CardDescription>
          Analyze competitor emails to discover their strategies and find opportunities to outperform them
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="analyze" data-testid="tab-analyze">
              <Sparkles className="w-4 h-4 mr-2" />
              Analyze
            </TabsTrigger>
            <TabsTrigger value="history" data-testid="tab-history">
              <History className="w-4 h-4 mr-2" />
              History
            </TabsTrigger>
          </TabsList>

          <TabsContent value="analyze" className="space-y-4 mt-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                Paste Competitor Email
              </label>
              <Textarea
                value={competitorEmail}
                onChange={(e) => setCompetitorEmail(e.target.value)}
                placeholder="Paste the full email content from a competitor here..."
                className="min-h-[150px]"
                data-testid="textarea-competitor-email"
              />
            </div>

            <Button 
              onClick={handleAnalyze} 
              disabled={analyzeMutation.isPending || !competitorEmail.trim()}
              className="w-full"
              data-testid="button-analyze-competitor"
            >
              {analyzeMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Analyze Competitor Email
                </>
              )}
            </Button>

            {result && (
              <div className="space-y-6 mt-6">
                <div className="p-4 rounded-lg bg-gradient-to-r from-violet-500/10 to-purple-500/10 border border-violet-500/20">
                  <h4 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                    <Target className="w-4 h-4" />
                    Overall Assessment
                  </h4>
                  <p className="text-sm text-muted-foreground" data-testid="text-overall-assessment">
                    {result.overallAssessment}
                  </p>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <h4 className="font-semibold text-foreground flex items-center gap-2">
                      <ThumbsUp className="w-4 h-4 text-green-500" />
                      Strengths
                    </h4>
                    <div className="space-y-3" data-testid="list-strengths">
                      {result.strengths.map((strength: CompetitorStrength, i: number) => (
                        <div key={i} className="p-3 rounded-lg bg-green-500/5 border border-green-500/20">
                          <p className="font-medium text-sm text-foreground">{strength.point}</p>
                          <p className="text-xs text-muted-foreground mt-1">{strength.explanation}</p>
                          <div className="mt-2 p-2 rounded bg-green-500/10">
                            <p className="text-xs text-green-600 dark:text-green-400 flex items-start gap-1">
                              <Lightbulb className="w-3 h-3 mt-0.5 flex-shrink-0" />
                              <span><strong>Apply:</strong> {strength.howToApply}</span>
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-semibold text-foreground flex items-center gap-2">
                      <ThumbsDown className="w-4 h-4 text-red-500" />
                      Weaknesses
                    </h4>
                    <div className="space-y-3" data-testid="list-weaknesses">
                      {result.weaknesses.map((weakness: CompetitorWeakness, i: number) => (
                        <div key={i} className="p-3 rounded-lg bg-red-500/5 border border-red-500/20">
                          <p className="font-medium text-sm text-foreground">{weakness.point}</p>
                          <p className="text-xs text-muted-foreground mt-1">{weakness.explanation}</p>
                          <div className="mt-2 p-2 rounded bg-amber-500/10">
                            <p className="text-xs text-amber-600 dark:text-amber-400 flex items-start gap-1">
                              <Zap className="w-3 h-3 mt-0.5 flex-shrink-0" />
                              <span><strong>Your Opportunity:</strong> {weakness.yourOpportunity}</span>
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="font-semibold text-foreground flex items-center gap-2">
                    <Target className="w-4 h-4 text-blue-500" />
                    Marketing Tactics Used
                  </h4>
                  <div className="grid sm:grid-cols-2 gap-3" data-testid="list-tactics">
                    {result.tactics.map((tactic: CompetitorTactic, i: number) => (
                      <div key={i} className="p-3 rounded-lg bg-muted/50 border border-border">
                        <div className="flex items-center justify-between mb-1">
                          <p className="font-medium text-sm text-foreground">{tactic.tactic}</p>
                          <Badge variant="outline" className={getEffectivenessColor(tactic.effectiveness)}>
                            {tactic.effectiveness}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">{tactic.description}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <h4 className="font-semibold text-foreground flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-emerald-500" />
                      Key Takeaways
                    </h4>
                    <ul className="space-y-2" data-testid="list-takeaways">
                      {result.keyTakeaways.map((takeaway: string, i: number) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                          <ArrowRight className="w-4 h-4 mt-0.5 flex-shrink-0 text-emerald-500" />
                          <span>{takeaway}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-semibold text-foreground flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-500" />
                      How to Beat Them
                    </h4>
                    <ul className="space-y-2" data-testid="list-improvements">
                      {result.suggestedImprovements.map((improvement: string, i: number) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                          <ArrowRight className="w-4 h-4 mt-0.5 flex-shrink-0 text-amber-500" />
                          <span>{improvement}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="history" className="mt-4">
            {historyLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : history.length === 0 ? (
              <div className="text-center py-8">
                <History className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
                <p className="text-muted-foreground">No analysis history yet</p>
                <p className="text-sm text-muted-foreground/70 mt-1">
                  Analyze your first competitor email to see it here
                </p>
              </div>
            ) : (
              <div className="space-y-3" data-testid="list-history">
                {history.map((item: HistoryItem) => (
                  <div 
                    key={item.id} 
                    className="p-4 rounded-lg border border-border hover-elevate cursor-pointer"
                    onClick={() => handleLoadHistory(item)}
                    data-testid={`history-item-${item.id}`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-medium text-foreground truncate max-w-[70%]">
                        {item.competitorEmail.substring(0, 50)}...
                      </p>
                      <span className="text-xs text-muted-foreground">
                        {new Date(item.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {item.analysis.overallAssessment}
                    </p>
                    <div className="flex gap-2 mt-2">
                      <Badge variant="outline" className="text-xs">
                        {item.analysis.strengths.length} strengths
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {item.analysis.weaknesses.length} weaknesses
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
