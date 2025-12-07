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
  { id: 'perfect_score', title: 'Perfection', description: 'Get a 90%+ chance of reaching inbox', icon: 'star', unlocked: false },
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
  const pendingToastsRef = useRef<Array<{ title: string; description: string }>>([]);

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
    if (pendingToastsRef.current.length > 0) {
      const toasts = [...pendingToastsRef.current];
      pendingToastsRef.current = [];
      toasts.forEach(t => {
        toast(t);
      });
    }
  });

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

  const queueToast = useCallback((title: string, description: string) => {
    pendingToastsRef.current.push({ title, description });
  }, []);

  const addXp = useCallback((amount: number, reason: string) => {
    setState(prev => {
      let newXp = prev.xp + amount;
      let newLevel = prev.level;
      const levelThreshold = prev.level * XP_PER_LEVEL;
      
      if (newXp >= levelThreshold) {
        newXp = newXp - levelThreshold;
        newLevel = prev.level + 1;
        queueToast(`Level Up! You're now Level ${newLevel}`, 'Keep going to unlock more achievements!');
      } else {
        queueToast(`+${amount} XP`, reason);
      }

      return { ...prev, xp: newXp, level: newLevel };
    });
  }, [queueToast]);

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

  const checkAndUnlockAchievements = useCallback((currentState: GamificationState) => {
    const achievementsToUnlock: string[] = [];
    
    if (currentState.totalGrades >= 1 && !shownAchievementsRef.current.has('first_grade')) achievementsToUnlock.push('first_grade');
    if (currentState.totalGrades >= 10 && !shownAchievementsRef.current.has('prolific')) achievementsToUnlock.push('prolific');
    if (currentState.totalGrades >= 25 && !shownAchievementsRef.current.has('veteran')) achievementsToUnlock.push('veteran');
    if (currentState.totalGrades >= 50 && !shownAchievementsRef.current.has('expert')) achievementsToUnlock.push('expert');
    if (currentState.totalRewrites >= 5 && !shownAchievementsRef.current.has('rewrite_master')) achievementsToUnlock.push('rewrite_master');
    if (currentState.totalRewrites >= 15 && !shownAchievementsRef.current.has('rewrite_pro')) achievementsToUnlock.push('rewrite_pro');
    if (currentState.totalFollowups >= 1 && !shownAchievementsRef.current.has('followup_first')) achievementsToUnlock.push('followup_first');
    if (currentState.totalFollowups >= 10 && !shownAchievementsRef.current.has('followup_pro')) achievementsToUnlock.push('followup_pro');
    if (currentState.totalDeliverabilityChecks >= 1 && !shownAchievementsRef.current.has('deliverability_check')) achievementsToUnlock.push('deliverability_check');
    if (currentState.totalDeliverabilityChecks >= 10 && !shownAchievementsRef.current.has('deliverability_pro')) achievementsToUnlock.push('deliverability_pro');
    if (currentState.streak >= 3 && !shownAchievementsRef.current.has('streak_3')) achievementsToUnlock.push('streak_3');
    if (currentState.streak >= 7 && !shownAchievementsRef.current.has('streak_7')) achievementsToUnlock.push('streak_7');
    if (currentState.streak >= 14 && !shownAchievementsRef.current.has('streak_14')) achievementsToUnlock.push('streak_14');
    if (currentState.streak >= 30 && !shownAchievementsRef.current.has('streak_30')) achievementsToUnlock.push('streak_30');
    if (currentState.aPlusCount >= 3 && !shownAchievementsRef.current.has('triple_a')) achievementsToUnlock.push('triple_a');
    if (currentState.level >= 5 && !shownAchievementsRef.current.has('level_5')) achievementsToUnlock.push('level_5');
    if (currentState.level >= 10 && !shownAchievementsRef.current.has('level_10')) achievementsToUnlock.push('level_10');
    if (currentState.perfectScoreCount >= 1 && !shownAchievementsRef.current.has('perfect_score')) achievementsToUnlock.push('perfect_score');
    if (currentState.aPlusCount >= 1 && !shownAchievementsRef.current.has('a_plus')) achievementsToUnlock.push('a_plus');

    if (achievementsToUnlock.length > 0) {
      achievementsToUnlock.forEach(id => shownAchievementsRef.current.add(id));
      
      setState(prev => {
        const newAchievements = prev.achievements.map(a => 
          achievementsToUnlock.includes(a.id) ? { ...a, unlocked: true, unlockedAt: new Date() } : a
        );
        
        achievementsToUnlock.forEach(id => {
          const achievement = newAchievements.find(a => a.id === id);
          if (achievement) {
            queueToast(`Achievement Unlocked: ${achievement.title}`, achievement.description);
          }
        });
        
        return { ...prev, achievements: newAchievements };
      });
    }
  }, [queueToast]);

  const checkAchievements = useCallback(() => {
    checkAndUnlockAchievements(state);
  }, [state, checkAndUnlockAchievements]);

  const recordGrade = useCallback((score: number, grade: string) => {
    updateStreak();
    setState(prev => {
      const isAPlusGrade = grade.toUpperCase() === 'A+';
      const newState = {
        ...prev,
        totalGrades: prev.totalGrades + 1,
        bestScore: Math.max(prev.bestScore, score),
        perfectScoreCount: score >= 90 ? prev.perfectScoreCount + 1 : prev.perfectScoreCount,
        aPlusCount: isAPlusGrade ? prev.aPlusCount + 1 : prev.aPlusCount,
      };
      
      setTimeout(() => checkAndUnlockAchievements(newState), 50);
      
      return newState;
    });
    addXp(25, 'Email graded!');
    
    if (score >= 90) {
      addXp(10, 'Bonus: Perfect score!');
    }
  }, [addXp, updateStreak, checkAndUnlockAchievements]);

  const recordRewrite = useCallback(() => {
    updateStreak();
    setState(prev => {
      const newState = { ...prev, totalRewrites: prev.totalRewrites + 1 };
      setTimeout(() => checkAndUnlockAchievements(newState), 50);
      return newState;
    });
    addXp(15, 'AI rewrite used!');
  }, [addXp, updateStreak, checkAndUnlockAchievements]);

  const recordFollowup = useCallback(() => {
    updateStreak();
    setState(prev => {
      const newState = { ...prev, totalFollowups: prev.totalFollowups + 1 };
      setTimeout(() => checkAndUnlockAchievements(newState), 50);
      return newState;
    });
    addXp(15, 'Follow-up generated!');
  }, [addXp, updateStreak, checkAndUnlockAchievements]);

  const recordDeliverabilityCheck = useCallback(() => {
    updateStreak();
    setState(prev => {
      const newState = { ...prev, totalDeliverabilityChecks: prev.totalDeliverabilityChecks + 1 };
      setTimeout(() => checkAndUnlockAchievements(newState), 50);
      return newState;
    });
    addXp(10, 'Deliverability check completed!');
  }, [addXp, updateStreak, checkAndUnlockAchievements]);

  const recordAcademyProgress = useCallback(() => {
    updateStreak();
    addXp(20, 'Academy progress!');
    setTimeout(() => checkAndUnlockAchievements(state), 50);
  }, [addXp, updateStreak, checkAndUnlockAchievements, state]);

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
