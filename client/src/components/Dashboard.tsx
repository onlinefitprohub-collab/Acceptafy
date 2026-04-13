import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Mail,
  Zap,
  ShieldCheck,
  History as HistoryIcon,
  ArrowRight,
  Trophy,
  Flame,
  Star,
  Clock,
  PlayCircle,
  Target,
  Sparkles,
} from 'lucide-react';
import { useGamification } from '@/hooks/use-gamification';
import type { HistoryItem } from '../types';

interface DashboardProps {
  history: HistoryItem[];
  onNavigate: (view: 'grader' | 'history' | 'create' | 'optimize' | 'analytics' | 'deliverability' | 'connections', subView?: string) => void;
  onOpenAcademy: () => void;
  onReplayTutorial?: () => void;
  userName?: string;
}

export function Dashboard({ history, onNavigate, onOpenAcademy, onReplayTutorial, userName }: DashboardProps) {
  const { xp, level, streak, nextLevelXp, achievements, totalGrades, bestScore } = useGamification();

  const unlockedAchievements = achievements.filter(a => a.unlocked).length;
  const recentGrades = history.slice(0, 5);
  const averageScore = history.length > 0
    ? Math.round(history.reduce((acc, item) => acc + (item.result.inboxPlacementScore?.score || 0), 0) / history.length)
    : 0;

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

  const nextAchievement = achievements.find(a => !a.unlocked);

  return (
    <div className="animate-fade-in space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Welcome back{userName ? `, ${userName}` : ''}!</h1>
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

      {/* Stats row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="relative overflow-visible group transition-all duration-300" data-testid="stats-level">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-lg" />
          <CardContent className="relative p-5 flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/30 flex-shrink-0">
              <Star className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">Level</p>
              <p className="text-2xl font-bold text-foreground" data-testid="text-level">{level}</p>
              <p className="text-xs text-muted-foreground">{xp}/{nextLevelXp} XP</p>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-visible group transition-all duration-300" data-testid="stats-best-score">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 rounded-lg" />
          <CardContent className="relative p-5 flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/30 flex-shrink-0">
              <Trophy className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">Best Score</p>
              <p className="text-2xl font-bold text-foreground" data-testid="text-best-score">{bestScore || '--'}</p>
              <p className="text-xs text-muted-foreground">Avg: {averageScore || '--'}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-visible group transition-all duration-300" data-testid="stats-emails-graded">
          <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-lg" />
          <CardContent className="relative p-5 flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center shadow-lg shadow-green-500/30 flex-shrink-0">
              <Mail className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">Graded</p>
              <p className="text-2xl font-bold text-foreground" data-testid="text-total-grades">{totalGrades}</p>
              <p className="text-xs text-muted-foreground">emails analysed</p>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-visible group transition-all duration-300" data-testid="stats-achievements">
          <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/10 to-orange-500/10 rounded-lg" />
          <CardContent className="relative p-5 flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center shadow-lg shadow-yellow-500/30 flex-shrink-0">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">Achievements</p>
              <p className="text-2xl font-bold text-foreground" data-testid="text-achievements">{unlockedAchievements}/{achievements.length}</p>
              <p className="text-xs text-muted-foreground">{achievements.length - unlockedAchievements} remaining</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions + Next Achievement */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
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
                onClick={() => onNavigate('create', 'rewrite')}
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
        </div>

        {/* Next Achievement */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Next Achievement</CardTitle>
          </CardHeader>
          <CardContent>
            {nextAchievement ? (
              <div className="flex items-center gap-4 p-4 rounded-xl bg-muted/50 border border-border/50">
                <div className="w-11 h-11 rounded-xl bg-muted flex items-center justify-center border border-border/50 flex-shrink-0">
                  <Target className="w-5 h-5 text-muted-foreground" />
                </div>
                <div className="min-w-0">
                  <p className="font-semibold truncate">{nextAchievement.title}</p>
                  <p className="text-sm text-muted-foreground line-clamp-2">{nextAchievement.description}</p>
                </div>
              </div>
            ) : (
              <div className="text-center py-4">
                <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center mb-3 shadow-lg shadow-yellow-500/30">
                  <Trophy className="w-7 h-7 text-white" />
                </div>
                <p className="font-semibold">All achievements unlocked!</p>
                <p className="text-sm text-muted-foreground">You're an email master!</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-2 flex-wrap">
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
            <div className="divide-y divide-border">
              {recentGrades.filter(item => item?.result?.overallGrade?.grade).map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-4 py-3 hover-elevate cursor-pointer rounded-lg px-2 -mx-2 transition-colors"
                  onClick={() => onNavigate('history')}
                >
                  <div className={`text-2xl font-bold w-10 text-center flex-shrink-0 ${getGradeColor(item.result?.overallGrade?.grade || 'N/A')}`}>
                    {item.result?.overallGrade?.grade || 'N/A'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{item.content.variations[0]?.subject || 'No subject'}</p>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      {new Date(item.date).toLocaleDateString()}
                    </div>
                  </div>
                  <div className={`px-3 py-1 rounded-full bg-gradient-to-r ${getScoreColor(item.result.inboxPlacementScore?.score || 0)} text-white text-sm font-bold flex-shrink-0`}>
                    {item.result.inboxPlacementScore?.score || 0}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
