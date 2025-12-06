import { useState, useCallback, useEffect, createContext, useContext, useRef } from 'react';
import { useToast } from './use-toast';

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
  unlockedAt?: Date;
}

interface GamificationState {
  xp: number;
  level: number;
  streak: number;
  lastActivityDate: string | null;
  achievements: Achievement[];
  totalGrades: number;
  totalRewrites: number;
  totalFollowups: number;
  totalDeliverabilityChecks: number;
  bestScore: number;
  perfectScoreCount: number;
  aPlusCount: number;
}

interface GamificationContextType extends GamificationState {
  nextLevelXp: number;
  addXp: (amount: number, reason: string) => void;
  recordGrade: (score: number, grade: string) => void;
  recordRewrite: () => void;
  recordFollowup: () => void;
  recordDeliverabilityCheck: () => void;
  recordAcademyProgress: () => void;
  checkAchievements: () => void;
}

const defaultAchievements: Achievement[] = [
  { id: 'first_grade', title: 'First Steps', description: 'Grade your first email', icon: 'target', unlocked: false },
  { id: 'perfect_score', title: 'Perfection', description: 'Get a 90+ inbox score', icon: 'star', unlocked: false },
  { id: 'a_plus', title: 'A+ Student', description: 'Get an A+ grade', icon: 'trophy', unlocked: false },
  { id: 'triple_a', title: 'Hat Trick', description: 'Get 3 A+ grades', icon: 'award', unlocked: false },
  { id: 'spam_slayer', title: 'Spam Slayer', description: 'Fix 10 spam triggers', icon: 'shield', unlocked: false },
  { id: 'rewrite_master', title: 'Rewrite Master', description: 'Use AI rewrite 5 times', icon: 'sparkles', unlocked: false },
  { id: 'rewrite_pro', title: 'Rewrite Pro', description: 'Use AI rewrite 15 times', icon: 'wand', unlocked: false },
  { id: 'streak_3', title: 'On Fire', description: 'Maintain a 3-day streak', icon: 'flame', unlocked: false },
  { id: 'streak_7', title: 'Unstoppable', description: 'Maintain a 7-day streak', icon: 'zap', unlocked: false },
  { id: 'streak_14', title: 'Dedicated', description: 'Maintain a 14-day streak', icon: 'calendar', unlocked: false },
  { id: 'streak_30', title: 'Email Master', description: 'Maintain a 30-day streak', icon: 'crown', unlocked: false },
  { id: 'prolific', title: 'Prolific', description: 'Grade 10 emails', icon: 'mail', unlocked: false },
  { id: 'veteran', title: 'Veteran', description: 'Grade 25 emails', icon: 'medal', unlocked: false },
  { id: 'expert', title: 'Expert', description: 'Grade 50 emails', icon: 'graduation', unlocked: false },
  { id: 'followup_first', title: 'Follow Through', description: 'Generate your first follow-up', icon: 'reply', unlocked: false },
  { id: 'followup_pro', title: 'Persistent', description: 'Generate 10 follow-ups', icon: 'repeat', unlocked: false },
  { id: 'deliverability_check', title: 'Domain Detective', description: 'Run a deliverability check', icon: 'search', unlocked: false },
  { id: 'deliverability_pro', title: 'Deliverability Pro', description: 'Run 10 deliverability checks', icon: 'check-circle', unlocked: false },
  { id: 'level_5', title: 'Rising Star', description: 'Reach level 5', icon: 'trending-up', unlocked: false },
  { id: 'level_10', title: 'Email Guru', description: 'Reach level 10', icon: 'star', unlocked: false },
];

const STORAGE_KEY = 'acceptafy_gamification';
const XP_PER_LEVEL = 100;

function getInitialState(): GamificationState {
  if (typeof window === 'undefined') {
    return {
      xp: 0,
      level: 1,
      streak: 0,
      lastActivityDate: null,
      achievements: defaultAchievements,
      totalGrades: 0,
      totalRewrites: 0,
      totalFollowups: 0,
      totalDeliverabilityChecks: 0,
      bestScore: 0,
      perfectScoreCount: 0,
      aPlusCount: 0,
    };
  }
  
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      return {
        xp: parsed.xp || 0,
        level: parsed.level || 1,
        streak: parsed.streak || 0,
        lastActivityDate: parsed.lastActivityDate || null,
        totalGrades: parsed.totalGrades || 0,
        totalRewrites: parsed.totalRewrites || 0,
        totalFollowups: parsed.totalFollowups || 0,
        totalDeliverabilityChecks: parsed.totalDeliverabilityChecks || 0,
        bestScore: parsed.bestScore || 0,
        perfectScoreCount: parsed.perfectScoreCount || 0,
        aPlusCount: parsed.aPlusCount || 0,
        achievements: defaultAchievements.map(a => ({
          ...a,
          unlocked: parsed.achievements?.find((pa: Achievement) => pa.id === a.id)?.unlocked || false,
          unlockedAt: parsed.achievements?.find((pa: Achievement) => pa.id === a.id)?.unlockedAt,
        }))
      };
    } catch {
      return {
        xp: 0,
        level: 1,
        streak: 0,
        lastActivityDate: null,
        achievements: defaultAchievements,
        totalGrades: 0,
        totalRewrites: 0,
        totalFollowups: 0,
        totalDeliverabilityChecks: 0,
        bestScore: 0,
        perfectScoreCount: 0,
        aPlusCount: 0,
      };
    }
  }
  return {
    xp: 0,
    level: 1,
    streak: 0,
    lastActivityDate: null,
    achievements: defaultAchievements,
    totalGrades: 0,
    totalRewrites: 0,
    totalFollowups: 0,
    totalDeliverabilityChecks: 0,
    bestScore: 0,
    perfectScoreCount: 0,
    aPlusCount: 0,
  };
}

const GamificationContext = createContext<GamificationContextType | null>(null);

export function GamificationProvider({ children }: { children: React.ReactNode }) {
  const { toast } = useToast();
  const [state, setState] = useState<GamificationState>(getInitialState);
  const shownAchievementsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  useEffect(() => {
    state.achievements.forEach(a => {
      if (a.unlocked) {
        shownAchievementsRef.current.add(a.id);
      }
    });
  }, []);

  useEffect(() => {
    const today = new Date().toDateString();
    if (state.lastActivityDate) {
      const lastDate = new Date(state.lastActivityDate).toDateString();
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      
      if (lastDate !== today && lastDate !== yesterday.toDateString()) {
        setState(prev => ({ ...prev, streak: 0 }));
      }
    }
  }, []);

  const nextLevelXp = state.level * XP_PER_LEVEL;

  const addXp = useCallback((amount: number, reason: string) => {
    setState(prev => {
      let newXp = prev.xp + amount;
      let newLevel = prev.level;
      const levelThreshold = prev.level * XP_PER_LEVEL;
      
      if (newXp >= levelThreshold) {
        newXp = newXp - levelThreshold;
        newLevel = prev.level + 1;
        toast({
          title: `Level Up! You're now Level ${newLevel}`,
          description: 'Keep going to unlock more achievements!',
        });
      } else {
        toast({
          title: `+${amount} XP`,
          description: reason,
        });
      }

      return { ...prev, xp: newXp, level: newLevel };
    });
  }, [toast]);

  const updateStreak = useCallback(() => {
    const today = new Date().toDateString();
    setState(prev => {
      if (prev.lastActivityDate === today) {
        return prev;
      }
      
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const isConsecutive = prev.lastActivityDate === yesterday.toDateString();
      
      return {
        ...prev,
        streak: isConsecutive ? prev.streak + 1 : 1,
        lastActivityDate: today,
      };
    });
  }, []);

  const unlockAchievement = useCallback((id: string) => {
    if (shownAchievementsRef.current.has(id)) {
      return;
    }
    
    shownAchievementsRef.current.add(id);
    
    setState(prev => {
      const achievement = prev.achievements.find(a => a.id === id);
      if (achievement?.unlocked) return prev;

      const newAchievements = prev.achievements.map(a => 
        a.id === id ? { ...a, unlocked: true, unlockedAt: new Date() } : a
      );

      const unlockedAchievement = newAchievements.find(a => a.id === id);
      if (unlockedAchievement) {
        toast({
          title: `Achievement Unlocked: ${unlockedAchievement.title}`,
          description: unlockedAchievement.description,
        });
      }

      return { ...prev, achievements: newAchievements };
    });
  }, [toast]);

  const checkAchievements = useCallback(() => {
    setState(prev => {
      if (prev.totalGrades >= 1) unlockAchievement('first_grade');
      if (prev.totalGrades >= 10) unlockAchievement('prolific');
      if (prev.totalGrades >= 25) unlockAchievement('veteran');
      if (prev.totalGrades >= 50) unlockAchievement('expert');
      if (prev.totalRewrites >= 5) unlockAchievement('rewrite_master');
      if (prev.totalRewrites >= 15) unlockAchievement('rewrite_pro');
      if (prev.totalFollowups >= 1) unlockAchievement('followup_first');
      if (prev.totalFollowups >= 10) unlockAchievement('followup_pro');
      if (prev.totalDeliverabilityChecks >= 1) unlockAchievement('deliverability_check');
      if (prev.totalDeliverabilityChecks >= 10) unlockAchievement('deliverability_pro');
      if (prev.streak >= 3) unlockAchievement('streak_3');
      if (prev.streak >= 7) unlockAchievement('streak_7');
      if (prev.streak >= 14) unlockAchievement('streak_14');
      if (prev.streak >= 30) unlockAchievement('streak_30');
      if (prev.aPlusCount >= 3) unlockAchievement('triple_a');
      if (prev.level >= 5) unlockAchievement('level_5');
      if (prev.level >= 10) unlockAchievement('level_10');
      
      return prev;
    });
  }, [unlockAchievement]);

  const recordGrade = useCallback((score: number, grade: string) => {
    updateStreak();
    setState(prev => {
      const isAPlusGrade = grade.toUpperCase() === 'A+';
      return {
        ...prev,
        totalGrades: prev.totalGrades + 1,
        bestScore: Math.max(prev.bestScore, score),
        perfectScoreCount: score >= 90 ? prev.perfectScoreCount + 1 : prev.perfectScoreCount,
        aPlusCount: isAPlusGrade ? prev.aPlusCount + 1 : prev.aPlusCount,
      };
    });
    addXp(25, 'Email graded!');
    
    if (score >= 90) {
      unlockAchievement('perfect_score');
      addXp(10, 'Bonus: Perfect score!');
    }
    
    if (grade.toUpperCase() === 'A+') {
      unlockAchievement('a_plus');
    }
    
    setTimeout(checkAchievements, 100);
  }, [addXp, updateStreak, unlockAchievement, checkAchievements]);

  const recordRewrite = useCallback(() => {
    updateStreak();
    setState(prev => ({
      ...prev,
      totalRewrites: prev.totalRewrites + 1,
    }));
    addXp(15, 'AI rewrite used!');
    setTimeout(checkAchievements, 100);
  }, [addXp, updateStreak, checkAchievements]);

  const recordFollowup = useCallback(() => {
    updateStreak();
    setState(prev => ({
      ...prev,
      totalFollowups: prev.totalFollowups + 1,
    }));
    addXp(15, 'Follow-up generated!');
    setTimeout(checkAchievements, 100);
  }, [addXp, updateStreak, checkAchievements]);

  const recordDeliverabilityCheck = useCallback(() => {
    updateStreak();
    setState(prev => ({
      ...prev,
      totalDeliverabilityChecks: prev.totalDeliverabilityChecks + 1,
    }));
    addXp(10, 'Deliverability check completed!');
    setTimeout(checkAchievements, 100);
  }, [addXp, updateStreak, checkAchievements]);

  const recordAcademyProgress = useCallback(() => {
    updateStreak();
    addXp(20, 'Academy progress!');
    setTimeout(checkAchievements, 100);
  }, [addXp, updateStreak, checkAchievements]);

  const value: GamificationContextType = {
    ...state,
    nextLevelXp,
    addXp,
    recordGrade,
    recordRewrite,
    recordFollowup,
    recordDeliverabilityCheck,
    recordAcademyProgress,
    checkAchievements,
  };

  return (
    <GamificationContext.Provider value={value}>
      {children}
    </GamificationContext.Provider>
  );
}

export function useGamification() {
  const context = useContext(GamificationContext);
  if (!context) {
    return {
      xp: 0,
      level: 1,
      streak: 0,
      lastActivityDate: null,
      achievements: defaultAchievements,
      totalGrades: 0,
      totalRewrites: 0,
      totalFollowups: 0,
      totalDeliverabilityChecks: 0,
      bestScore: 0,
      perfectScoreCount: 0,
      aPlusCount: 0,
      nextLevelXp: 100,
      addXp: () => {},
      recordGrade: () => {},
      recordRewrite: () => {},
      recordFollowup: () => {},
      recordDeliverabilityCheck: () => {},
      recordAcademyProgress: () => {},
      checkAchievements: () => {},
    };
  }
  return context;
}
