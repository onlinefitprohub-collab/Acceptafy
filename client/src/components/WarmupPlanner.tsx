import { useState } from 'react';
import { Calendar, Flame, Target, TrendingUp, AlertTriangle, CheckCircle, ChevronDown, ChevronUp, Mail, Zap, Crown, Lock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Link } from 'wouter';
import type { WarmupPlan, WarmupDay } from '../types';

const PhaseColors: Record<string, { bg: string; border: string; text: string }> = {
  Foundation: { bg: 'bg-blue-500/10', border: 'border-blue-500/30', text: 'text-blue-600 dark:text-blue-400' },
  Growth: { bg: 'bg-green-500/10', border: 'border-green-500/30', text: 'text-green-600 dark:text-green-400' },
  Scale: { bg: 'bg-purple-500/10', border: 'border-purple-500/30', text: 'text-purple-600 dark:text-purple-400' },
  Optimization: { bg: 'bg-orange-500/10', border: 'border-orange-500/30', text: 'text-orange-600 dark:text-orange-400' }
};

const DayCard: React.FC<{ day: WarmupDay; isExpanded: boolean; onToggle: () => void }> = ({ day, isExpanded, onToggle }) => {
  const colors = PhaseColors[day.phase] || PhaseColors.Foundation;
  
  return (
    <Card 
      className={`${colors.bg} ${colors.border} border cursor-pointer transition-all hover:shadow-md`}
      onClick={onToggle}
      data-testid={`warmup-day-${day.day}`}
    >
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full ${colors.bg} border ${colors.border} flex items-center justify-center`}>
              <span className={`font-bold ${colors.text}`}>{day.day}</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-foreground">Day {day.day}</span>
                <Badge variant="outline" className={`${colors.text} border-current`}>
                  {day.phase}
                </Badge>
                {day.milestone && (
                  <Badge className="bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 border-yellow-500/30">
                    <Zap className="w-3 h-3 mr-1" />
                    {day.milestone}
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Mail className="w-3 h-3" />
                  {day.emailVolume} emails
                </span>
                <span className="flex items-center gap-1">
                  <Target className="w-3 h-3" />
                  {day.targetOpenRate}% opens
                </span>
                <span className="flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" />
                  {day.targetReplyRate}% replies
                </span>
              </div>
            </div>
          </div>
          {isExpanded ? <ChevronUp className="w-5 h-5 text-muted-foreground" /> : <ChevronDown className="w-5 h-5 text-muted-foreground" />}
        </div>
        
        {isExpanded && (
          <div className="mt-4 pt-4 border-t border-border/50 space-y-3 animate-fade-in">
            <div>
              <h5 className="text-sm font-semibold text-foreground mb-2">Actions for Day {day.day}</h5>
              <ul className="space-y-1">
                {day.actions.map((action, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                    {action}
                  </li>
                ))}
              </ul>
            </div>
            {day.tips.length > 0 && (
              <div>
                <h5 className="text-sm font-semibold text-foreground mb-2">Tips</h5>
                <ul className="space-y-1">
                  {day.tips.map((tip, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <Flame className="w-4 h-4 text-orange-600 dark:text-orange-400 flex-shrink-0 mt-0.5" />
                      {tip}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export const WarmupPlanner: React.FC = () => {
  const [domain, setDomain] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [plan, setPlan] = useState<WarmupPlan | null>(null);
  const [expandedDays, setExpandedDays] = useState<Set<number>>(new Set([1, 7, 14, 30]));
  const [requiresUpgrade, setRequiresUpgrade] = useState(false);

  const handleGenerate = async () => {
    if (!domain.trim()) return;
    setIsLoading(true);
    setError(null);
    setPlan(null);
    setRequiresUpgrade(false);
    
    try {
      const response = await fetch('/api/warmup/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain: domain.trim() })
      });
      
      if (response.status === 403) {
        const errorData = await response.json();
        if (errorData.error === 'Pro feature') {
          setRequiresUpgrade(true);
          return;
        }
      }
      
      if (response.ok) {
        const data = await response.json();
        setPlan(data);
        setExpandedDays(new Set([1, 7, 14, 30]));
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to generate warmup plan');
      }
    } catch (err) {
      setError('An error occurred while generating the warmup plan.');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleDay = (day: number) => {
    setExpandedDays(prev => {
      const newSet = new Set(prev);
      if (newSet.has(day)) {
        newSet.delete(day);
      } else {
        newSet.add(day);
      }
      return newSet;
    });
  };

  return (
    <div className="space-y-6 animate-fade-in" data-testid="warmup-planner">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Email Warm-up Planner</h2>
        <p className="text-muted-foreground">Generate a personalized 30-day schedule to build your sender reputation</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-purple-400" />
            Generate Your Warm-up Schedule
          </CardTitle>
          <CardDescription>
            Enter your sending domain to get a customized warm-up plan with daily volume targets, engagement goals, and best practices.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <input
              type="text"
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              placeholder="Enter your domain (e.g., yourcompany.com)"
              className="flex-1 bg-background border border-input text-foreground text-sm rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 block w-full p-2.5"
              disabled={isLoading}
              onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
              data-testid="input-warmup-domain"
            />
            <Button
              onClick={handleGenerate}
              disabled={!domain.trim() || isLoading}
              className="w-full sm:w-auto"
              data-testid="button-generate-warmup"
            >
              {isLoading && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />}
              Generate 30-Day Plan
            </Button>
          </div>
          
          {error && <p className="text-destructive text-sm mt-2" data-testid="text-warmup-error">{error}</p>}
          
          {requiresUpgrade && (
            <Card className="bg-gradient-to-br from-purple-900/40 to-pink-900/40 border-purple-500/30 mt-4">
              <CardContent className="p-6 text-center space-y-4">
                <div className="flex justify-center">
                  <div className="p-3 rounded-full bg-purple-500/20">
                    <Crown className="w-8 h-8 text-purple-400" />
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground">Pro Feature</h3>
                  <p className="text-muted-foreground text-sm mt-1">
                    Warmup Plan Generator is available on Pro and Scale plans. Upgrade to get a personalized 30-day warmup schedule for your domain.
                  </p>
                </div>
                <Link href="/pricing">
                  <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700" data-testid="button-upgrade-warmup">
                    <Lock className="w-4 h-4 mr-2" />
                    Upgrade to Pro
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>

      {plan && (
        <div className="space-y-6 animate-fade-in" data-testid="warmup-plan-result">
          <Card className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-purple-500/20">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                  <Flame className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-foreground">30-Day Warm-up Plan for {plan.domain}</h3>
                  <p className="text-muted-foreground text-sm">{plan.overview}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                {plan.phases.map((phase, i) => (
                  <div key={i} className={`p-3 rounded-lg ${PhaseColors[phase.name]?.bg || 'bg-muted'} border ${PhaseColors[phase.name]?.border || 'border-border'}`}>
                    <h4 className={`font-semibold ${PhaseColors[phase.name]?.text || 'text-foreground'}`}>{phase.name}</h4>
                    <p className="text-xs text-muted-foreground">{phase.days}</p>
                    <p className="text-sm mt-1 text-foreground">{phase.goal}</p>
                    <p className="text-xs text-muted-foreground mt-1">{phase.volumeRange}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                  Best Practices
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {plan.bestPractices.map((practice, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                      {practice}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                  Warning Signals
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {plan.warningSignals.map((signal, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <AlertTriangle className="w-4 h-4 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                      {signal}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-purple-400" />
                  Daily Schedule
                </span>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setExpandedDays(new Set(plan.schedule.map(d => d.day)))}
                  >
                    Expand All
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setExpandedDays(new Set())}
                  >
                    Collapse All
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {plan.schedule.map((day) => (
                  <DayCard
                    key={day.day}
                    day={day}
                    isExpanded={expandedDays.has(day.day)}
                    onToggle={() => toggleDay(day.day)}
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {!plan && !isLoading && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="w-16 h-16 rounded-full bg-purple-500/10 flex items-center justify-center mb-4">
              <Calendar className="w-8 h-8 text-purple-400" />
            </div>
            <h3 className="text-lg font-medium text-foreground mb-2">Build Your Sender Reputation</h3>
            <p className="text-sm text-muted-foreground text-center max-w-md">
              A warm-up plan gradually increases your email volume over 30 days, helping you establish trust with inbox providers like Gmail and Outlook.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
