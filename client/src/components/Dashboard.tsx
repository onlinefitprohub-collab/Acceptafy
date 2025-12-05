import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Mail, 
  Zap, 
  Target, 
  ShieldCheck, 
  GraduationCap, 
  History as HistoryIcon,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Trophy,
  Flame,
  Star,
  Clock
} from 'lucide-react';
import { useGamification } from '@/hooks/use-gamification';
import type { HistoryItem } from '../types';

interface DashboardProps {
  history: HistoryItem[];
  onNavigate: (view: 'grader' | 'history' | 'tools' | 'deliverability', subView?: string) => void;
  onOpenAcademy: () => void;
}

export function Dashboard({ history, onNavigate, onOpenAcademy }: DashboardProps) {
  const { xp, level, streak, nextLevelXp, achievements, totalGrades, bestScore } = useGamification();
  
  const xpProgress = (xp / nextLevelXp) * 100;
  const unlockedAchievements = achievements.filter(a => a.unlocked).length;
  
  const recentGrades = history.slice(0, 3);
  const averageScore = history.length > 0 
    ? Math.round(history.reduce((acc, item) => acc + (item.result.inboxPlacementScore?.score || 0), 0) / history.length)
    : 0;
  
  const lowScoreEmails = history.filter(item => (item.result.inboxPlacementScore?.score || 0) < 70);
  const hasImprovementOpportunity = lowScoreEmails.length > 0;

  const getGradeColor = (grade: string) => {
    if (grade.startsWith('A')) return 'text-green-500';
    if (grade.startsWith('B')) return 'text-yellow-500';
    if (grade.startsWith('C')) return 'text-orange-500';
    return 'text-red-500';
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'from-green-500 to-emerald-500';
    if (score >= 60) return 'from-yellow-500 to-orange-500';
    return 'from-red-500 to-orange-500';
  };

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Welcome back!</h1>
          <p className="text-muted-foreground">Here's your email marketing overview</p>
        </div>
        {streak > 0 && (
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-orange-500/20 to-red-500/20 border border-orange-500/30">
            <Flame className="w-5 h-5 text-orange-500 fire-animate" />
            <span className="font-bold text-orange-500">{streak} day streak!</span>
          </div>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="relative overflow-hidden" data-testid="stats-level">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-pink-500/10" />
          <CardContent className="relative p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Level</p>
                <p className="text-3xl font-bold text-foreground" data-testid="text-level">{level}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                <Star className="w-6 h-6 text-white" />
              </div>
            </div>
            <div className="mt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">XP Progress</span>
                <span className="font-medium">{xp}/{nextLevelXp}</span>
              </div>
              <Progress value={xpProgress} className="h-2" />
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden" data-testid="stats-best-score">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-cyan-500/10" />
          <CardContent className="relative p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Best Score</p>
                <p className="text-3xl font-bold text-foreground" data-testid="text-best-score">{bestScore}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                <Trophy className="w-6 h-6 text-white" />
              </div>
            </div>
            <p className="mt-4 text-sm text-muted-foreground">
              {bestScore >= 90 ? 'Excellent work!' : bestScore >= 70 ? 'Good progress!' : 'Keep improving!'}
            </p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden" data-testid="stats-emails-graded">
          <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-emerald-500/10" />
          <CardContent className="relative p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Emails Graded</p>
                <p className="text-3xl font-bold text-foreground" data-testid="text-total-grades">{totalGrades}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
                <Mail className="w-6 h-6 text-white" />
              </div>
            </div>
            <p className="mt-4 text-sm text-muted-foreground">
              Average score: {averageScore || '--'}
            </p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden" data-testid="stats-achievements">
          <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/10 to-orange-500/10" />
          <CardContent className="relative p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Achievements</p>
                <p className="text-3xl font-bold text-foreground" data-testid="text-achievements">{unlockedAchievements}/{achievements.length}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
            </div>
            <p className="mt-4 text-sm text-muted-foreground">
              {achievements.length - unlockedAchievements} more to unlock
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Quick Actions</CardTitle>
              <CardDescription>Jump right into your most common tasks</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-3">
              <Button 
                onClick={() => onNavigate('grader')}
                className="h-auto py-4 flex flex-col gap-2 bg-gradient-to-br from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                data-testid="quick-action-grade"
              >
                <Mail className="w-6 h-6" />
                <span>Grade Email</span>
              </Button>
              <Button 
                onClick={() => onNavigate('tools', 'rewrite')}
                variant="secondary"
                className="h-auto py-4 flex flex-col gap-2"
                data-testid="quick-action-rewrite"
              >
                <Zap className="w-6 h-6" />
                <span>AI Rewrite</span>
              </Button>
              <Button 
                onClick={() => onNavigate('deliverability', 'domain-health')}
                variant="secondary"
                className="h-auto py-4 flex flex-col gap-2"
                data-testid="quick-action-deliverability"
              >
                <ShieldCheck className="w-6 h-6" />
                <span>Check Deliverability</span>
              </Button>
            </CardContent>
          </Card>

          {hasImprovementOpportunity && (
            <Card className="border-yellow-500/30 bg-yellow-500/5">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="p-2 rounded-lg bg-yellow-500/20">
                    <AlertTriangle className="w-5 h-5 text-yellow-500" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground mb-1">Improvement Opportunity</h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      You have {lowScoreEmails.length} email{lowScoreEmails.length > 1 ? 's' : ''} scoring below 70. 
                      Use AI Rewrite to improve them!
                    </p>
                    <Button 
                      onClick={() => onNavigate('tools', 'rewrite')} 
                      size="sm"
                      className="bg-yellow-500 hover:bg-yellow-600 text-black"
                    >
                      Improve with AI
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Recent Activity</CardTitle>
                  <CardDescription>Your latest email analyses</CardDescription>
                </div>
                {history.length > 0 && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => onNavigate('history')}
                    data-testid="view-all-history"
                  >
                    View all
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {recentGrades.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 mx-auto rounded-full bg-muted flex items-center justify-center mb-4">
                    <HistoryIcon className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <p className="text-muted-foreground mb-4">No emails graded yet</p>
                  <Button onClick={() => onNavigate('grader')} data-testid="start-grading">
                    Grade your first email
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentGrades.map((item) => (
                    <div 
                      key={item.id} 
                      className="flex items-center gap-4 p-3 rounded-lg bg-muted/50 hover-elevate cursor-pointer"
                      onClick={() => onNavigate('history')}
                    >
                      <div className={`text-2xl font-bold ${getGradeColor(item.result.overallGrade.grade)}`}>
                        {item.result.overallGrade.grade}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{item.content.variations[0]?.subject || 'No subject'}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Clock className="w-3 h-3" />
                          {new Date(item.date).toLocaleDateString()}
                        </div>
                      </div>
                      <div className={`px-3 py-1 rounded-full bg-gradient-to-r ${getScoreColor(item.result.inboxPlacementScore?.score || 0)} text-white text-sm font-bold`}>
                        {item.result.inboxPlacementScore?.score || 0}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Recommended for You</CardTitle>
              <CardDescription>Based on your activity</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {totalGrades === 0 && (
                <div 
                  className="p-4 rounded-lg bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20 cursor-pointer hover-elevate"
                  onClick={() => onNavigate('grader')}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <CheckCircle2 className="w-5 h-5 text-purple-500" />
                    <span className="font-medium">Get Started</span>
                  </div>
                  <p className="text-sm text-muted-foreground">Grade your first email to unlock AI insights</p>
                </div>
              )}
              
              {totalGrades > 0 && bestScore < 80 && (
                <div 
                  className="p-4 rounded-lg bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/20 cursor-pointer hover-elevate"
                  onClick={() => onNavigate('tools', 'rewrite')}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <Zap className="w-5 h-5 text-blue-500" />
                    <span className="font-medium">Boost Your Score</span>
                  </div>
                  <p className="text-sm text-muted-foreground">Use AI Rewrite to improve email performance</p>
                </div>
              )}
              
              <div 
                className="p-4 rounded-lg bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/20 cursor-pointer hover-elevate"
                onClick={() => onNavigate('deliverability', 'dns')}
              >
                <div className="flex items-center gap-3 mb-2">
                  <ShieldCheck className="w-5 h-5 text-green-500" />
                  <span className="font-medium">Setup Authentication</span>
                </div>
                <p className="text-sm text-muted-foreground">Configure SPF, DKIM, DMARC for better delivery</p>
              </div>
              
              <div 
                className="p-4 rounded-lg bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border border-yellow-500/20 cursor-pointer hover-elevate"
                onClick={onOpenAcademy}
              >
                <div className="flex items-center gap-3 mb-2">
                  <GraduationCap className="w-5 h-5 text-yellow-500" />
                  <span className="font-medium">Learn Email Mastery</span>
                  <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white text-[10px]">+20 XP</Badge>
                </div>
                <p className="text-sm text-muted-foreground">Access courses to become an email pro</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Next Achievement</CardTitle>
            </CardHeader>
            <CardContent>
              {(() => {
                const nextAchievement = achievements.find(a => !a.unlocked);
                if (!nextAchievement) {
                  return (
                    <div className="text-center py-4">
                      <Trophy className="w-12 h-12 mx-auto text-yellow-500 mb-2" />
                      <p className="font-medium">All achievements unlocked!</p>
                      <p className="text-sm text-muted-foreground">You're an email master!</p>
                    </div>
                  );
                }
                return (
                  <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/50">
                    <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                      <Target className="w-6 h-6 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-medium">{nextAchievement.title}</p>
                      <p className="text-sm text-muted-foreground">{nextAchievement.description}</p>
                    </div>
                  </div>
                );
              })()}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
