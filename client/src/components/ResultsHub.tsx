import { useState, useEffect } from 'react';
import { Trophy, Zap, Star, TrendingUp, Award, BarChart3, Lightbulb, Building2, FileType } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { BenchmarkFeedback } from '../types';

interface ResultsHubProps {
  scoreData: {
    score: number;
    summary: string;
  };
  gradeData: {
    grade: string;
    summary: string;
  };
  isComparison?: boolean;
  benchmarkFeedback?: BenchmarkFeedback;
}

const getScoreVisualStyle = (score: number) => {
  if (score >= 90) {
    return { 
      stroke: 'stroke-green-400', 
      text: 'text-green-400',
      bg: 'from-green-500/20 to-emerald-500/10',
      glow: 'glow-green',
      icon: <Trophy className="w-5 h-5" />,
      label: 'Excellent!'
    };
  }
  if (score >= 70) {
    return { 
      stroke: 'stroke-blue-400', 
      text: 'text-blue-400',
      bg: 'from-blue-500/20 to-cyan-500/10',
      glow: 'glow-purple',
      icon: <Star className="w-5 h-5" />,
      label: 'Great Job!'
    };
  }
  if (score >= 50) {
    return { 
      stroke: 'stroke-yellow-400', 
      text: 'text-yellow-400',
      bg: 'from-yellow-500/20 to-orange-500/10',
      glow: 'glow-yellow',
      icon: <TrendingUp className="w-5 h-5" />,
      label: 'Room to Grow'
    };
  }
  return { 
    stroke: 'stroke-red-400', 
    text: 'text-red-400',
    bg: 'from-red-500/20 to-orange-500/10',
    glow: '',
    icon: <Zap className="w-5 h-5" />,
    label: 'Needs Work'
  };
};

const getGradeInfo = (grade: string) => {
  const upperGrade = grade.toUpperCase();
  if (upperGrade.startsWith('A+')) return { 
    title: "Inbox Legend", 
    color: 'from-green-400 to-emerald-400',
    badge: 'bg-gradient-to-r from-green-500 to-emerald-500'
  };
  if (upperGrade.startsWith('A')) return { 
    title: "Deliverability Master", 
    color: 'from-green-400 to-teal-400',
    badge: 'bg-gradient-to-r from-green-500 to-teal-500'
  };
  if (upperGrade.startsWith('B')) return { 
    title: "Solid Performer", 
    color: 'from-blue-400 to-cyan-400',
    badge: 'bg-gradient-to-r from-blue-500 to-cyan-500'
  };
  if (upperGrade.startsWith('C')) return { 
    title: "Needs Polish", 
    color: 'from-yellow-400 to-orange-400',
    badge: 'bg-gradient-to-r from-yellow-500 to-orange-500'
  };
  if (upperGrade.startsWith('D') || upperGrade.startsWith('F')) return { 
    title: "Spam Risk", 
    color: 'from-red-400 to-orange-400',
    badge: 'bg-gradient-to-r from-red-500 to-orange-500'
  };
  return { 
    title: "Content Grade", 
    color: 'from-purple-400 to-pink-400',
    badge: 'bg-gradient-to-r from-purple-500 to-pink-500'
  };
};

const useCountUp = (end: number, duration: number = 1500) => {
  const [count, setCount] = useState(0);
  
  useEffect(() => {
    let animationFrame: number;
    const startTime = Date.now();
    
    const animate = () => {
      const now = Date.now();
      const progress = Math.min((now - startTime) / duration, 1);
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const current = Math.floor(end * easeOut);
      setCount(current);
      
      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [end, duration]);
  
  return count;
};

export const ResultsHub: React.FC<ResultsHubProps> = ({ scoreData, gradeData, isComparison = false, benchmarkFeedback }) => {
  const { stroke, text, bg, glow, icon, label } = getScoreVisualStyle(scoreData.score);
  const gradeInfo = getGradeInfo(gradeData.grade);
  const animatedScore = useCountUp(scoreData.score);
  const isExcellentScore = scoreData.score >= 90;
  const hasBenchmarks = Boolean(
    benchmarkFeedback && 
    (benchmarkFeedback.industryComparison || 
     benchmarkFeedback.emailTypeComparison || 
     (benchmarkFeedback.benchmarkInsights && benchmarkFeedback.benchmarkInsights.length > 0))
  );

  const circumference = 2 * Math.PI * 54;
  const offset = circumference - (animatedScore / 100) * circumference;

  return (
    <Card 
      className={`relative overflow-hidden border-0 ${glow} ${isExcellentScore && !isComparison ? 'shimmer-effect' : ''}`} 
      data-testid="results-hub"
    >
      <div className={`absolute inset-0 bg-gradient-to-br ${bg} opacity-50`} />
      {isExcellentScore && !isComparison && (
        <div className="absolute inset-0 aurora-background opacity-30" />
      )}
      
      <CardContent className="relative p-6 sm:p-8">
        <div className="flex flex-col md:flex-row items-center justify-center gap-8 md:gap-12">
          
          <div className="flex-shrink-0 relative">
            <div className={`absolute inset-0 ${glow} blur-2xl opacity-50 scale-110`} />
            
            <div className="relative w-36 h-36 sm:w-44 sm:h-44">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
                <defs>
                  <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#a855f7" />
                    <stop offset="50%" stopColor="#ec4899" />
                    <stop offset="100%" stopColor="#8b5cf6" />
                  </linearGradient>
                </defs>
                
                <circle
                  className="stroke-muted/30"
                  strokeWidth="8"
                  fill="transparent"
                  r="54"
                  cx="60"
                  cy="60"
                />
                
                <circle
                  className={`transition-all duration-1000 ease-out ${stroke}`}
                  stroke="url(#scoreGradient)"
                  strokeWidth="8"
                  strokeDasharray={circumference}
                  strokeDashoffset={offset}
                  strokeLinecap="round"
                  fill="transparent"
                  r="54"
                  cx="60"
                  cy="60"
                />
              </svg>
              
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className="flex items-baseline">
                  <span 
                    className={`text-5xl sm:text-6xl font-bold tracking-tight gradient-text`} 
                    data-testid="text-inbox-score"
                  >
                    {animatedScore}
                  </span>
                  <span className="text-2xl font-semibold text-muted-foreground ml-1">%</span>
                </div>
              </div>
            </div>
            
            <div className="text-center mt-4">
              <div className="flex items-center justify-center gap-2">
                <div className={`p-1.5 rounded-full ${text} bg-white/10`}>
                  {icon}
                </div>
                <span className={`font-bold ${text}`}>{label}</span>
              </div>
              <p className="text-sm text-muted-foreground mt-1">Acceptafy Score</p>
            </div>
          </div>
          
          <div className="flex-1 max-w-lg text-center md:text-left space-y-4">
            <div className="flex items-center justify-center md:justify-start gap-3">
              <div className={`p-2 rounded-xl ${gradeInfo.badge}`}>
                <Award className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{gradeInfo.title}</p>
                <p 
                  className={`text-4xl font-bold bg-gradient-to-r ${gradeInfo.color} bg-clip-text text-transparent`}
                  data-testid="text-overall-grade"
                >
                  {gradeData.grade}
                </p>
              </div>
            </div>
            
            <blockquote className="pl-4 border-l-2 border-primary/50">
              <p className="text-muted-foreground italic" data-testid="text-score-summary">
                "{scoreData.summary}"
              </p>
            </blockquote>
            
            <div className="pt-4 border-t border-border">
              <p className="text-sm text-muted-foreground" data-testid="text-grade-summary">
                {gradeData.summary}
              </p>
            </div>
            
            {isExcellentScore && !isComparison && (
              <div className="flex items-center gap-2 justify-center md:justify-start">
                <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white border-0">
                  <Star className="w-3 h-3 mr-1 fill-current" />
                  Top Performer
                </Badge>
                <Badge variant="secondary">
                  <Zap className="w-3 h-3 mr-1" />
                  +25 XP
                </Badge>
              </div>
            )}
          </div>
        </div>
        
        {hasBenchmarks && !isComparison && (
          <div className="mt-8 pt-6 border-t border-border/50" data-testid="benchmark-section">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-1.5 rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/20">
                <BarChart3 className="w-4 h-4 text-purple-400" />
              </div>
              <h3 className="font-semibold text-foreground">Industry Benchmarks</h3>
            </div>
            
            <div className="grid gap-4 md:grid-cols-2">
              {benchmarkFeedback?.industryComparison && (
                <div className="p-4 rounded-lg bg-gradient-to-br from-blue-500/10 to-cyan-500/5 border border-blue-500/20" data-testid="benchmark-industry">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <Building2 className="w-4 h-4 text-blue-400" />
                    <span className="text-sm font-medium text-muted-foreground">Industry Comparison</span>
                    {typeof benchmarkFeedback.industryPercentile === 'number' && 
                     isFinite(benchmarkFeedback.industryPercentile) && 
                     benchmarkFeedback.industryPercentile > 0 && (
                      <Badge variant="secondary" className="ml-auto text-xs">
                        {benchmarkFeedback.industryPercentile}th percentile
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-foreground">{benchmarkFeedback.industryComparison}</p>
                </div>
              )}
              
              {benchmarkFeedback?.emailTypeComparison && (
                <div className="p-4 rounded-lg bg-gradient-to-br from-green-500/10 to-emerald-500/5 border border-green-500/20" data-testid="benchmark-email-type">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <FileType className="w-4 h-4 text-green-400" />
                    <span className="text-sm font-medium text-muted-foreground">Email Type Comparison</span>
                    {typeof benchmarkFeedback.emailTypePercentile === 'number' && 
                     isFinite(benchmarkFeedback.emailTypePercentile) && 
                     benchmarkFeedback.emailTypePercentile > 0 && (
                      <Badge variant="secondary" className="ml-auto text-xs">
                        {benchmarkFeedback.emailTypePercentile}th percentile
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-foreground">{benchmarkFeedback.emailTypeComparison}</p>
                </div>
              )}
            </div>
            
            {benchmarkFeedback?.benchmarkInsights && benchmarkFeedback.benchmarkInsights.length > 0 && (
              <div className="mt-4 p-4 rounded-lg bg-gradient-to-br from-purple-500/5 to-pink-500/5 border border-purple-500/20" data-testid="benchmark-insights">
                <div className="flex items-center gap-2 mb-3">
                  <Lightbulb className="w-4 h-4 text-yellow-400" />
                  <span className="text-sm font-medium text-foreground">Benchmark Insights</span>
                </div>
                <ul className="space-y-2">
                  {benchmarkFeedback.benchmarkInsights.map((insight, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm text-muted-foreground" data-testid={`text-insight-${index}`}>
                      <span className="text-purple-400 mt-1">•</span>
                      <span>{insight}</span>
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
