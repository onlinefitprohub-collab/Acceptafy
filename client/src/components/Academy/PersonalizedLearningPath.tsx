import { useMemo } from 'react';
import { 
  Sparkles, 
  ArrowRight, 
  Target, 
  TrendingUp,
  BookOpen,
  CheckCircle2,
  AlertCircle,
  Zap
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { HistoryItem } from '../../types';

interface LearningRecommendation {
  id: string;
  moduleKey: string;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  reason: string;
  skillGap: number;
}

interface PersonalizedLearningPathProps {
  history: HistoryItem[];
  onSelectModule: (moduleKey: string) => void;
}

export function PersonalizedLearningPath({ history, onSelectModule }: PersonalizedLearningPathProps) {
  const analysis = useMemo(() => {
    if (history.length === 0) {
      return {
        recommendations: [],
        strengths: [],
        weaknesses: [],
        overallProgress: 0,
        totalEmails: 0
      };
    }

    const metrics = {
      subjectLine: { total: 0, count: 0 },
      previewText: { total: 0, count: 0 },
      bodyCopy: { total: 0, count: 0 },
      callToAction: { total: 0, count: 0 },
      spamTriggers: { total: 0, count: 0 },
      personalization: { total: 0, count: 0 },
      replyAbility: { total: 0, count: 0 },
      inboxPlacement: { total: 0, count: 0 }
    };

    history.forEach(item => {
      const result = item.result;
      
      if (result.subjectLine?.grade) {
        metrics.subjectLine.total += gradeToScore(result.subjectLine.grade);
        metrics.subjectLine.count++;
      }
      if (result.previewText?.grade) {
        metrics.previewText.total += gradeToScore(result.previewText.grade);
        metrics.previewText.count++;
      }
      if (result.bodyCopy?.grade) {
        metrics.bodyCopy.total += gradeToScore(result.bodyCopy.grade);
        metrics.bodyCopy.count++;
      }
      if (result.callToAction?.grade) {
        metrics.callToAction.total += gradeToScore(result.callToAction.grade);
        metrics.callToAction.count++;
      }
      if (result.spamAnalysis) {
        const spamScore = Math.max(0, 100 - (result.spamAnalysis.length * 15));
        metrics.spamTriggers.total += spamScore;
        metrics.spamTriggers.count++;
      }
      if (result.personalizationScore?.score !== undefined) {
        metrics.personalization.total += result.personalizationScore.score;
        metrics.personalization.count++;
      }
      if (result.replyAbilityAnalysis?.score !== undefined) {
        metrics.replyAbility.total += result.replyAbilityAnalysis.score;
        metrics.replyAbility.count++;
      }
      if (result.inboxPlacementScore?.score !== undefined) {
        metrics.inboxPlacement.total += result.inboxPlacementScore.score;
        metrics.inboxPlacement.count++;
      }
    });

    const averages: Record<string, number> = {};
    Object.entries(metrics).forEach(([key, { total, count }]) => {
      averages[key] = count > 0 ? Math.round(total / count) : 50;
    });

    const recommendations: LearningRecommendation[] = [];

    if (averages.subjectLine < 70) {
      recommendations.push({
        id: 'subject-line',
        moduleKey: 'art',
        title: 'Write Emails That Get Opened & Read',
        description: 'Master subject lines that grab attention and avoid spam filters',
        priority: averages.subjectLine < 50 ? 'high' : 'medium',
        reason: `Your average subject line score is ${averages.subjectLine}%. This module will help you craft compelling subject lines.`,
        skillGap: 100 - averages.subjectLine
      });
    }

    if (averages.spamTriggers < 80) {
      recommendations.push({
        id: 'spam-triggers',
        moduleKey: 'foundations',
        title: 'Unlock the Inbox: Master Authentication',
        description: 'Learn to avoid spam triggers and improve deliverability',
        priority: averages.spamTriggers < 60 ? 'high' : 'medium',
        reason: `Your emails contain spam triggers. Learn how to write clean, deliverable content.`,
        skillGap: 100 - averages.spamTriggers
      });
    }

    if (averages.callToAction < 70) {
      recommendations.push({
        id: 'cta',
        moduleKey: 'strategy',
        title: 'Double Your Clicks: Advanced Copywriting',
        description: 'Create powerful calls-to-action that drive conversions',
        priority: averages.callToAction < 50 ? 'high' : 'medium',
        reason: `Your call-to-action scores average ${averages.callToAction}%. Learn advanced CTA techniques.`,
        skillGap: 100 - averages.callToAction
      });
    }

    if (averages.personalization < 70) {
      recommendations.push({
        id: 'personalization',
        moduleKey: 'segmentation',
        title: 'Target Like a Pro: Master Your List',
        description: 'Learn segmentation and personalization strategies',
        priority: averages.personalization < 50 ? 'high' : 'medium',
        reason: `Your personalization score is ${averages.personalization}%. Learn to create more relevant emails.`,
        skillGap: 100 - averages.personalization
      });
    }

    if (averages.bodyCopy < 70) {
      recommendations.push({
        id: 'body-copy',
        moduleKey: 'art',
        title: 'Write Emails That Get Opened & Read',
        description: 'Master the art of compelling email body copy',
        priority: averages.bodyCopy < 50 ? 'high' : 'medium',
        reason: `Your body copy scores average ${averages.bodyCopy}%. Improve your email writing skills.`,
        skillGap: 100 - averages.bodyCopy
      });
    }

    if (averages.inboxPlacement < 80) {
      recommendations.push({
        id: 'sender-reputation',
        moduleKey: 'senderReputation',
        title: 'Sender Reputation Management',
        description: 'Learn how to maintain and improve your sender reputation',
        priority: averages.inboxPlacement < 60 ? 'high' : 'medium',
        reason: `Your inbox placement score is ${averages.inboxPlacement}%. Protect your sender reputation.`,
        skillGap: 100 - averages.inboxPlacement
      });
    }

    recommendations.sort((a, b) => b.skillGap - a.skillGap);

    const uniqueRecommendations = recommendations.reduce((acc, curr) => {
      if (!acc.find(r => r.moduleKey === curr.moduleKey)) {
        acc.push(curr);
      }
      return acc;
    }, [] as LearningRecommendation[]);

    const strengths: string[] = [];
    const weaknesses: string[] = [];

    if (averages.subjectLine >= 80) strengths.push('Subject Lines');
    else if (averages.subjectLine < 60) weaknesses.push('Subject Lines');

    if (averages.bodyCopy >= 80) strengths.push('Body Copy');
    else if (averages.bodyCopy < 60) weaknesses.push('Body Copy');

    if (averages.callToAction >= 80) strengths.push('Calls to Action');
    else if (averages.callToAction < 60) weaknesses.push('Calls to Action');

    if (averages.personalization >= 80) strengths.push('Personalization');
    else if (averages.personalization < 60) weaknesses.push('Personalization');

    if (averages.spamTriggers >= 90) strengths.push('Spam Avoidance');
    else if (averages.spamTriggers < 70) weaknesses.push('Spam Triggers');

    const overallProgress = Math.round(
      (averages.subjectLine + averages.bodyCopy + averages.callToAction + 
       averages.personalization + averages.spamTriggers + averages.inboxPlacement) / 6
    );

    return {
      recommendations: uniqueRecommendations.slice(0, 3),
      strengths,
      weaknesses,
      overallProgress,
      totalEmails: history.length
    };
  }, [history]);

  if (history.length === 0) {
    return (
      <Card className="border-purple-500/30 bg-gradient-to-br from-purple-500/5 to-pink-500/5" data-testid="learning-path-empty">
        <CardContent className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-full bg-purple-500/20">
              <Sparkles className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Personalized Learning Path</h3>
              <p className="text-sm text-muted-foreground">Grade some emails to get personalized recommendations</p>
            </div>
          </div>
          <p className="text-muted-foreground text-sm">
            Once you've graded a few emails, we'll analyze your patterns and suggest the best learning modules to improve your skills.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-purple-500/30 bg-gradient-to-br from-purple-500/5 to-pink-500/5" data-testid="learning-path">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-400" />
            <CardTitle className="text-lg text-foreground">Your Learning Path</CardTitle>
          </div>
          <Badge variant="outline" className="text-purple-400 border-purple-500/30">
            Based on {analysis.totalEmails} graded emails
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-lg bg-muted/50 border border-border">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-purple-400" />
              <span className="text-sm font-medium text-muted-foreground">Overall Progress</span>
            </div>
            <div className="text-2xl font-bold text-foreground mb-2">{analysis.overallProgress}%</div>
            <Progress value={analysis.overallProgress} className="h-2" />
          </div>
          
          <div className="p-4 rounded-lg bg-muted/50 border border-border">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 className="w-4 h-4 text-green-400" />
              <span className="text-sm font-medium text-muted-foreground">Strengths</span>
            </div>
            {analysis.strengths.length > 0 ? (
              <div className="flex flex-wrap gap-1">
                {analysis.strengths.map(s => (
                  <Badge key={s} variant="secondary" className="bg-green-500/20 text-green-600 dark:text-green-400 border-green-500/30">
                    {s}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Keep grading to discover your strengths</p>
            )}
          </div>
          
          <div className="p-4 rounded-lg bg-muted/50 border border-border">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="w-4 h-4 text-yellow-400" />
              <span className="text-sm font-medium text-muted-foreground">Areas to Improve</span>
            </div>
            {analysis.weaknesses.length > 0 ? (
              <div className="flex flex-wrap gap-1">
                {analysis.weaknesses.map(w => (
                  <Badge key={w} variant="secondary" className="bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 border-yellow-500/30">
                    {w}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">You're doing great across all areas!</p>
            )}
          </div>
        </div>

        {analysis.recommendations.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-purple-400" />
              <h4 className="font-medium text-foreground">Recommended Modules</h4>
            </div>
            
            {analysis.recommendations.map((rec, index) => (
              <div 
                key={rec.id}
                className="p-4 rounded-lg bg-muted/50 border border-border hover:border-purple-500/50 transition-colors cursor-pointer group"
                onClick={() => onSelectModule(rec.moduleKey)}
                data-testid={`recommendation-${rec.id}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                      rec.priority === 'high' ? 'bg-red-500/20 text-red-600 dark:text-red-400' :
                      rec.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-600 dark:text-yellow-400' :
                      'bg-blue-500/20 text-blue-600 dark:text-blue-400'
                    }`}>
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h5 className="font-medium text-foreground group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                          {rec.title}
                        </h5>
                        <Badge 
                          variant="outline" 
                          className={`text-xs ${
                            rec.priority === 'high' ? 'border-red-500/30 text-red-600 dark:text-red-400' :
                            rec.priority === 'medium' ? 'border-yellow-500/30 text-yellow-600 dark:text-yellow-400' :
                            'border-blue-500/30 text-blue-600 dark:text-blue-400'
                          }`}
                        >
                          {rec.priority === 'high' ? 'High Priority' : rec.priority === 'medium' ? 'Recommended' : 'Optional'}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{rec.description}</p>
                      <p className="text-xs text-purple-600 dark:text-purple-400">{rec.reason}</p>
                    </div>
                  </div>
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    className="flex-shrink-0 group-hover:bg-purple-500/20"
                  >
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {analysis.recommendations.length === 0 && (
          <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/30 flex items-center gap-3">
            <Zap className="w-5 h-5 text-green-400" />
            <div>
              <h4 className="font-medium text-foreground">You're a Pro!</h4>
              <p className="text-sm text-muted-foreground">Your email skills are excellent. Explore advanced modules to take it even further.</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function gradeToScore(grade: string): number {
  const upperGrade = grade.toUpperCase();
  if (upperGrade.startsWith('A+')) return 98;
  if (upperGrade.startsWith('A-')) return 90;
  if (upperGrade.startsWith('A')) return 95;
  if (upperGrade.startsWith('B+')) return 87;
  if (upperGrade.startsWith('B-')) return 80;
  if (upperGrade.startsWith('B')) return 85;
  if (upperGrade.startsWith('C+')) return 77;
  if (upperGrade.startsWith('C-')) return 70;
  if (upperGrade.startsWith('C')) return 75;
  if (upperGrade.startsWith('D+')) return 67;
  if (upperGrade.startsWith('D-')) return 60;
  if (upperGrade.startsWith('D')) return 65;
  if (upperGrade.startsWith('F')) return 50;
  return 70;
}
