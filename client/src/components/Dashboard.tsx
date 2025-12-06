import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
  Clock,
  PlayCircle
} from 'lucide-react';
import { useGamification } from '@/hooks/use-gamification';
import type { HistoryItem } from '../types';

interface DashboardProps {
  history: HistoryItem[];
  onNavigate: (view: 'grader' | 'history' | 'tools' | 'deliverability', subView?: string) => void;
  onOpenAcademy: () => void;
  onReplayTutorial?: () => void;
}

export function Dashboard({ history, onNavigate, onOpenAcademy, onReplayTutorial }: DashboardProps) {
  const { xp, level, streak, nextLevelXp, achievements, totalGrades, bestScore } = useGamification();
  
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
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Welcome back!</h1>
          <p className="text-muted-foreground">Here's your email marketing overview</p>
        </div>
        <div className="flex items-center gap-3">
          {onReplayTutorial && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onReplayTutorial}
              className="text-muted-foreground"
              data-testid="button-replay-tutorial"
            >
              <PlayCircle className="w-4 h-4 mr-1.5" />
              Replay Tutorial
            </Button>
          )}
          {streak > 0 && (
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-orange-500/20 to-red-500/20 border border-orange-500/30">
              <Flame className="w-5 h-5 text-orange-500 fire-animate" />
              <span className="font-bold text-orange-500">{streak} day streak!</span>
            </div>
          )}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 auto-rows-fr">
        <Card className="relative overflow-visible group transition-all duration-300" data-testid="stats-level">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-lg" />
          <div className="absolute -inset-px bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-sm" />
          <CardContent className="relative p-5 h-full flex flex-col justify-between">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Level</p>
                <p className="text-3xl font-bold text-foreground" data-testid="text-level">{level}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/30 group-hover:shadow-purple-500/50 transition-shadow duration-300 flex-shrink-0">
                <Star className="w-6 h-6 text-white" />
              </div>
            </div>
            <p className="mt-4 text-sm text-muted-foreground">
              XP Progress: {xp}/{nextLevelXp}
            </p>
          </CardContent>
        </Card>

        <Card className="relative overflow-visible group transition-all duration-300" data-testid="stats-best-score">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 rounded-lg" />
          <div className="absolute -inset-px bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-sm" />
          <CardContent className="relative p-5 h-full flex flex-col justify-between">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Best Score</p>
                <p className="text-3xl font-bold text-foreground" data-testid="text-best-score">{bestScore}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/30 group-hover:shadow-blue-500/50 transition-shadow duration-300 flex-shrink-0">
                <Trophy className="w-6 h-6 text-white" />
              </div>
            </div>
            <p className="mt-4 text-sm text-muted-foreground">
              {bestScore >= 90 ? 'Excellent work!' : bestScore >= 70 ? 'Good progress!' : 'Keep improving!'}
            </p>
          </CardContent>
        </Card>

        <Card className="relative overflow-visible group transition-all duration-300" data-testid="stats-emails-graded">
          <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-lg" />
          <div className="absolute -inset-px bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-sm" />
          <CardContent className="relative p-5 h-full flex flex-col justify-between">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Emails Graded</p>
                <p className="text-3xl font-bold text-foreground" data-testid="text-total-grades">{totalGrades}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center shadow-lg shadow-green-500/30 group-hover:shadow-green-500/50 transition-shadow duration-300 flex-shrink-0">
                <Mail className="w-6 h-6 text-white" />
              </div>
            </div>
            <p className="mt-4 text-sm text-muted-foreground">
              Average score: {averageScore || '--'}
            </p>
          </CardContent>
        </Card>

        <Card className="relative overflow-visible group transition-all duration-300" data-testid="stats-achievements">
          <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/10 to-orange-500/10 rounded-lg" />
          <div className="absolute -inset-px bg-gradient-to-br from-yellow-500/20 to-orange-500/20 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-sm" />
          <CardContent className="relative p-5 h-full flex flex-col justify-between">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Achievements</p>
                <p className="text-3xl font-bold text-foreground" data-testid="text-achievements">{unlockedAchievements}/{achievements.length}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center shadow-lg shadow-yellow-500/30 group-hover:shadow-yellow-500/50 transition-shadow duration-300 flex-shrink-0">
                <Sparkles className="w-7 h-7 text-white" />
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
                className="h-auto py-5 flex flex-col gap-2.5 bg-gradient-to-br from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 transition-all duration-300"
                data-testid="quick-action-grade"
              >
                <div className="p-2 rounded-lg bg-white/20">
                  <Mail className="w-5 h-5" />
                </div>
                <span className="font-semibold">Grade Email</span>
              </Button>
              <Button 
                onClick={() => onNavigate('tools', 'rewrite')}
                variant="secondary"
                className="h-auto py-5 flex flex-col gap-2.5 hover:shadow-md transition-all duration-300"
                data-testid="quick-action-rewrite"
              >
                <div className="p-2 rounded-lg bg-blue-500/20">
                  <Zap className="w-5 h-5 text-blue-500" />
                </div>
                <span className="font-semibold">AI Rewrite</span>
              </Button>
              <Button 
                onClick={() => onNavigate('deliverability', 'domain-health')}
                variant="secondary"
                className="h-auto py-5 flex flex-col gap-2.5 hover:shadow-md transition-all duration-300"
                data-testid="quick-action-deliverability"
              >
                <div className="p-2 rounded-lg bg-green-500/20">
                  <ShieldCheck className="w-5 h-5 text-green-500" />
                </div>
                <span className="font-semibold">Check Deliverability</span>
              </Button>
            </CardContent>
          </Card>

          {hasImprovementOpportunity && (
            <Card className="border-yellow-500/30 bg-gradient-to-r from-yellow-500/5 to-orange-500/5 overflow-visible">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="p-2.5 rounded-xl bg-gradient-to-br from-yellow-500 to-orange-500 shadow-lg shadow-yellow-500/30">
                    <AlertTriangle className="w-5 h-5 text-white" />
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
                      className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-black shadow-md shadow-yellow-500/25"
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
                  className="group p-4 rounded-xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20 cursor-pointer hover-elevate transition-all duration-300"
                  onClick={() => onNavigate('grader')}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-1.5 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 shadow-md shadow-purple-500/30 group-hover:shadow-purple-500/50 transition-shadow duration-300">
                      <CheckCircle2 className="w-4 h-4 text-white" />
                    </div>
                    <span className="font-semibold">Get Started</span>
                  </div>
                  <p className="text-sm text-muted-foreground">Grade your first email to unlock AI insights</p>
                </div>
              )}
              
              {totalGrades > 0 && bestScore < 80 && (
                <div 
                  className="group p-4 rounded-xl bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/20 cursor-pointer hover-elevate transition-all duration-300"
                  onClick={() => onNavigate('tools', 'rewrite')}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-1.5 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 shadow-md shadow-blue-500/30 group-hover:shadow-blue-500/50 transition-shadow duration-300">
                      <Zap className="w-4 h-4 text-white" />
                    </div>
                    <span className="font-semibold">Boost Your Score</span>
                  </div>
                  <p className="text-sm text-muted-foreground">Use AI Rewrite to improve email performance</p>
                </div>
              )}
              
              <div 
                className="group p-4 rounded-xl bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/20 cursor-pointer hover-elevate transition-all duration-300"
                onClick={() => onNavigate('deliverability', 'dns')}
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-1.5 rounded-lg bg-gradient-to-br from-green-500 to-emerald-500 shadow-md shadow-green-500/30 group-hover:shadow-green-500/50 transition-shadow duration-300">
                    <ShieldCheck className="w-4 h-4 text-white" />
                  </div>
                  <span className="font-semibold">Setup Authentication</span>
                </div>
                <p className="text-sm text-muted-foreground">Configure SPF, DKIM, DMARC for better delivery</p>
              </div>
              
              <div 
                className="group p-4 rounded-xl bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border border-yellow-500/20 cursor-pointer hover-elevate transition-all duration-300"
                onClick={onOpenAcademy}
              >
                <div className="flex items-center gap-3 mb-2 flex-wrap">
                  <div className="p-1.5 rounded-lg bg-gradient-to-br from-yellow-500 to-orange-500 shadow-md shadow-yellow-500/30 group-hover:shadow-yellow-500/50 transition-shadow duration-300">
                    <GraduationCap className="w-4 h-4 text-white" />
                  </div>
                  <span className="font-semibold">Learn Email Mastery</span>
                  <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white text-[10px] shadow-sm shadow-orange-500/30">+20 XP</Badge>
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
                    <div className="text-center py-6">
                      <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center mb-3 shadow-lg shadow-yellow-500/30">
                        <Trophy className="w-8 h-8 text-white" />
                      </div>
                      <p className="font-semibold text-lg">All achievements unlocked!</p>
                      <p className="text-sm text-muted-foreground">You're an email master!</p>
                    </div>
                  );
                }
                return (
                  <div className="flex items-center gap-4 p-4 rounded-xl bg-gradient-to-br from-muted/50 to-muted/30 border border-border/50">
                    <div className="w-12 h-12 rounded-xl bg-muted/80 flex items-center justify-center border border-border/50">
                      <Target className="w-6 h-6 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-semibold">{nextAchievement.title}</p>
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
