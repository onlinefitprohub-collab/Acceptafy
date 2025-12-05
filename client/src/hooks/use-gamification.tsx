import { useState, useCallback, useEffect, createContext, useContext } from 'react';
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
  bestScore: number;
}

interface GamificationContextType extends GamificationState {
  nextLevelXp: number;
  addXp: (amount: number, reason: string) => void;
  recordGrade: (score: number) => void;
  recordRewrite: () => void;
  recordAcademyProgress: () => void;
  checkAchievements: () => void;
}

const defaultAchievements: Achievement[] = [
  { id: 'first_grade', title: 'First Steps', description: 'Grade your first email', icon: 'target', unlocked: false },
  { id: 'perfect_score', title: 'Perfection', description: 'Get a 90+ inbox score', icon: 'star', unlocked: false },
  { id: 'a_plus', title: 'A+ Student', description: 'Get an A+ grade', icon: 'trophy', unlocked: false },
  { id: 'spam_slayer', title: 'Spam Slayer', description: 'Fix 10 spam triggers', icon: 'shield', unlocked: false },
  { id: 'rewrite_master', title: 'Rewrite Master', description: 'Use AI rewrite 5 times', icon: 'sparkles', unlocked: false },
  { id: 'streak_3', title: 'On Fire', description: 'Maintain a 3-day streak', icon: 'flame', unlocked: false },
  { id: 'streak_7', title: 'Unstoppable', description: 'Maintain a 7-day streak', icon: 'zap', unlocked: false },
  { id: 'prolific', title: 'Prolific', description: 'Grade 10 emails', icon: 'mail', unlocked: false },
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
      bestScore: 0,
    };
  }
  
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      return {
        ...parsed,
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
        bestScore: 0,
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
    bestScore: 0,
  };
}

const GamificationContext = createContext<GamificationContextType | null>(null);

export function GamificationProvider({ children }: { children: React.ReactNode }) {
  const { toast } = useToast();
  const [state, setState] = useState<GamificationState>(getInitialState);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

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
      let updated = { ...prev };
      
      if (prev.totalGrades >= 1 && !prev.achievements.find(a => a.id === 'first_grade')?.unlocked) {
        unlockAchievement('first_grade');
      }
      if (prev.totalGrades >= 10 && !prev.achievements.find(a => a.id === 'prolific')?.unlocked) {
        unlockAchievement('prolific');
      }
      if (prev.totalRewrites >= 5 && !prev.achievements.find(a => a.id === 'rewrite_master')?.unlocked) {
        unlockAchievement('rewrite_master');
      }
      if (prev.streak >= 3 && !prev.achievements.find(a => a.id === 'streak_3')?.unlocked) {
        unlockAchievement('streak_3');
      }
      if (prev.streak >= 7 && !prev.achievements.find(a => a.id === 'streak_7')?.unlocked) {
        unlockAchievement('streak_7');
      }
      
      return updated;
    });
  }, [unlockAchievement]);

  const recordGrade = useCallback((score: number) => {
    updateStreak();
    setState(prev => ({
      ...prev,
      totalGrades: prev.totalGrades + 1,
      bestScore: Math.max(prev.bestScore, score),
    }));
    addXp(25, 'Email graded!');
    
    if (score >= 90) {
      unlockAchievement('perfect_score');
      addXp(10, 'Bonus: Perfect score!');
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
      bestScore: 0,
      nextLevelXp: 100,
      addXp: () => {},
      recordGrade: () => {},
      recordRewrite: () => {},
      recordAcademyProgress: () => {},
      checkAchievements: () => {},
    };
  }
  return context;
}
