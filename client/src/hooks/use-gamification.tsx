import { useState, useCallback, useEffect, createContext, useContext, useRef } from 'react';
import { useToast } from './use-toast';
import { useQuery } from '@tanstack/react-query';

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
  unlockedAt?: Date;
}

interface DbAchievement {
  id: string;
  unlocked: boolean;
  unlockedAt?: string;
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
  // Getting Started
  { id: 'first_grade', title: 'First Steps', description: 'Grade your first email', icon: 'target', unlocked: false },
  { id: 'first_rewrite', title: 'AI Apprentice', description: 'Use AI rewrite for the first time', icon: 'sparkles', unlocked: false },
  { id: 'first_deliverability', title: 'Health Check', description: 'Run your first deliverability check', icon: 'activity', unlocked: false },
  
  // Excellence Milestones
  { id: 'perfect_score', title: 'Perfection', description: 'Get a 90%+ inbox placement score', icon: 'star', unlocked: false },
  { id: 'a_plus', title: 'A+ Student', description: 'Get an A+ grade', icon: 'trophy', unlocked: false },
  { id: 'triple_a', title: 'Hat Trick', description: 'Get 3 A+ grades', icon: 'award', unlocked: false },
  { id: 'five_a_plus', title: 'Honor Roll', description: 'Get 5 A+ grades', icon: 'medal', unlocked: false },
  { id: 'ten_a_plus', title: 'Valedictorian', description: 'Get 10 A+ grades', icon: 'crown', unlocked: false },
  { id: 'twenty_a_plus', title: 'A+ Champion', description: 'Get 20 A+ grades', icon: 'trophy', unlocked: false },
  
  // Volume Milestones - Grading
  { id: 'prolific', title: 'Prolific', description: 'Grade 10 emails', icon: 'mail', unlocked: false },
  { id: 'veteran', title: 'Veteran', description: 'Grade 25 emails', icon: 'medal', unlocked: false },
  { id: 'expert', title: 'Expert', description: 'Grade 50 emails', icon: 'graduation', unlocked: false },
  { id: 'centurion', title: 'Centurion', description: 'Grade 100 emails', icon: 'shield', unlocked: false },
  { id: 'grading_legend', title: 'Grading Legend', description: 'Grade 250 emails', icon: 'star', unlocked: false },
  
  // Volume Milestones - Rewrites
  { id: 'rewrite_master', title: 'Rewrite Master', description: 'Use AI rewrite 5 times', icon: 'sparkles', unlocked: false },
  { id: 'rewrite_pro', title: 'Rewrite Pro', description: 'Use AI rewrite 15 times', icon: 'wand', unlocked: false },
  { id: 'rewrite_expert', title: 'Rewrite Expert', description: 'Use AI rewrite 30 times', icon: 'wand', unlocked: false },
  { id: 'rewrite_legend', title: 'Transformation Master', description: 'Use AI rewrite 50 times', icon: 'zap', unlocked: false },
  
  // Volume Milestones - Follow-ups
  { id: 'followup_first', title: 'Follow Through', description: 'Generate your first follow-up', icon: 'reply', unlocked: false },
  { id: 'followup_pro', title: 'Persistent', description: 'Generate 10 follow-ups', icon: 'repeat', unlocked: false },
  { id: 'followup_expert', title: 'Sequence Specialist', description: 'Generate 25 follow-ups', icon: 'mail-plus', unlocked: false },
  { id: 'followup_legend', title: 'Follow-up Wizard', description: 'Generate 50 follow-ups', icon: 'wand', unlocked: false },
  
  // Deliverability Achievements
  { id: 'deliverability_check', title: 'Domain Detective', description: 'Run a deliverability check', icon: 'search', unlocked: false },
  { id: 'deliverability_pro', title: 'Deliverability Pro', description: 'Run 10 deliverability checks', icon: 'check-circle', unlocked: false },
  { id: 'deliverability_expert', title: 'Inbox Guardian', description: 'Run 25 deliverability checks', icon: 'shield', unlocked: false },
  { id: 'deliverability_master', title: 'Deliverability Master', description: 'Run 50 deliverability checks', icon: 'crown', unlocked: false },
  
  // Streak Achievements
  { id: 'streak_3', title: 'On Fire', description: 'Maintain a 3-day streak', icon: 'flame', unlocked: false },
  { id: 'streak_7', title: 'Unstoppable', description: 'Maintain a 7-day streak', icon: 'zap', unlocked: false },
  { id: 'streak_14', title: 'Dedicated', description: 'Maintain a 14-day streak', icon: 'calendar', unlocked: false },
  { id: 'streak_30', title: 'Email Master', description: 'Maintain a 30-day streak', icon: 'crown', unlocked: false },
  { id: 'streak_60', title: 'Iron Will', description: 'Maintain a 60-day streak', icon: 'diamond', unlocked: false },
  { id: 'streak_90', title: 'Legendary Dedication', description: 'Maintain a 90-day streak', icon: 'trophy', unlocked: false },
  
  // Level Achievements
  { id: 'level_5', title: 'Rising Star', description: 'Reach level 5', icon: 'trending-up', unlocked: false },
  { id: 'level_10', title: 'Email Guru', description: 'Reach level 10', icon: 'star', unlocked: false },
  { id: 'level_15', title: 'Marketing Maven', description: 'Reach level 15', icon: 'award', unlocked: false },
  { id: 'level_20', title: 'Email Titan', description: 'Reach level 20', icon: 'crown', unlocked: false },
  { id: 'level_25', title: 'Deliverability Deity', description: 'Reach level 25', icon: 'sparkles', unlocked: false },
  
  // XP Achievements
  { id: 'xp_1000', title: 'XP Hunter', description: 'Earn 1,000 total XP', icon: 'zap', unlocked: false },
  { id: 'xp_5000', title: 'XP Master', description: 'Earn 5,000 total XP', icon: 'bolt', unlocked: false },
  { id: 'xp_10000', title: 'XP Legend', description: 'Earn 10,000 total XP', icon: 'star', unlocked: false },
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

// Helper to convert DB achievement format to local format
function mergeAchievementsWithDefaults(dbAchievements: DbAchievement[] | null): Achievement[] {
  if (!dbAchievements || !Array.isArray(dbAchievements)) {
    return defaultAchievements;
  }
  return defaultAchievements.map(a => {
    const dbAch = dbAchievements.find((d: DbAchievement) => d.id === a.id);
    return dbAch ? { ...a, unlocked: dbAch.unlocked, unlockedAt: dbAch.unlockedAt ? new Date(dbAch.unlockedAt) : undefined } : a;
  });
}

// Helper to convert local achievements to DB format
function achievementsToDbFormat(achievements: Achievement[]): DbAchievement[] {
  return achievements
    .filter(a => a.unlocked)
    .map(a => ({
      id: a.id,
      unlocked: a.unlocked,
      unlockedAt: a.unlockedAt?.toISOString(),
    }));
}

export function GamificationProvider({ children }: { children: React.ReactNode }) {
  const { toast } = useToast();
  const [state, setState] = useState<GamificationState>(getInitialState);
  const hasInitialized = useRef(false);
  const hasSavedMerged = useRef(false);
  const lastSavedState = useRef<string>('');
  const shownAchievementsRef = useRef<Set<string>>(new Set());
  const pendingToastsRef = useRef<Array<{ title: string; description: string }>>([]);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch gamification data from database (enabled for all - will return null if not authenticated)
  const { data: dbGamification, isSuccess: dbLoaded, isError } = useQuery<any>({
    queryKey: ['/api/gamification'],
    retry: false,
    staleTime: 60000, // Cache for 1 minute
  });

  // Save function without React Query mutation to avoid loops
  const saveToDatabase = useCallback(async (data: GamificationState) => {
    const stateStr = JSON.stringify({
      xp: data.xp,
      level: data.level,
      streak: data.streak,
      totalGrades: data.totalGrades,
      totalRewrites: data.totalRewrites,
      totalFollowups: data.totalFollowups,
      totalDeliverabilityChecks: data.totalDeliverabilityChecks,
      bestScore: data.bestScore,
      perfectScoreCount: data.perfectScoreCount,
      aPlusCount: data.aPlusCount,
    });
    
    // Skip if state hasn't changed
    if (stateStr === lastSavedState.current) return;
    lastSavedState.current = stateStr;
    
    try {
      await fetch('/api/gamification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          xp: data.xp,
          level: data.level,
          streak: data.streak,
          lastActiveDate: data.lastActivityDate,
          achievements: achievementsToDbFormat(data.achievements || []),
          totalGrades: data.totalGrades,
          totalRewrites: data.totalRewrites,
          totalFollowups: data.totalFollowups,
          totalDeliverabilityChecks: data.totalDeliverabilityChecks,
          bestScore: data.bestScore,
          perfectScoreCount: data.perfectScoreCount,
          aPlusCount: data.aPlusCount,
        }),
      });
    } catch (err) {
      // Silently fail - localStorage still has the data
    }
  }, []);

  // Merge database data with localStorage on login
  useEffect(() => {
    if (dbLoaded && dbGamification && !hasInitialized.current) {
      hasInitialized.current = true;
      const localState = getInitialState();
      
      // Merge: take the higher value for each stat (keeps user's progress from either source)
      const mergedState: GamificationState = {
        xp: Math.max(localState.xp, dbGamification.xp || 0),
        level: Math.max(localState.level, dbGamification.level || 1),
        streak: Math.max(localState.streak, dbGamification.streak || 0),
        lastActivityDate: localState.lastActivityDate || dbGamification.lastActiveDate || null,
        totalGrades: Math.max(localState.totalGrades, dbGamification.totalGrades || 0),
        totalRewrites: Math.max(localState.totalRewrites, dbGamification.totalRewrites || 0),
        totalFollowups: Math.max(localState.totalFollowups, dbGamification.totalFollowups || 0),
        totalDeliverabilityChecks: Math.max(localState.totalDeliverabilityChecks, dbGamification.totalDeliverabilityChecks || 0),
        bestScore: Math.max(localState.bestScore, dbGamification.bestScore || 0),
        perfectScoreCount: Math.max(localState.perfectScoreCount, dbGamification.perfectScoreCount || 0),
        aPlusCount: Math.max(localState.aPlusCount, dbGamification.aPlusCount || 0),
        achievements: mergeAchievementsWithDefaults(dbGamification.achievements),
      };

      // Merge achievements - unlock if unlocked in either source, preserve earliest unlockedAt
      const localAchMap = new Map(localState.achievements.map(a => [a.id, a]));
      mergedState.achievements = mergedState.achievements.map(a => {
        const localAch = localAchMap.get(a.id);
        const isUnlocked = a.unlocked || (localAch?.unlocked ?? false);
        // Use the earlier unlockedAt date if both are unlocked
        let unlockedAt = a.unlockedAt;
        if (isUnlocked && localAch?.unlockedAt) {
          if (!unlockedAt || new Date(localAch.unlockedAt) < new Date(unlockedAt)) {
            unlockedAt = localAch.unlockedAt;
          }
        }
        return { ...a, unlocked: isUnlocked, unlockedAt };
      });

      setState(mergedState);
      
      // Always save merged data back to database to ensure sync
      if (!hasSavedMerged.current) {
        hasSavedMerged.current = true;
        saveToDatabase(mergedState);
      }
    }
  }, [dbLoaded, dbGamification, saveToDatabase]);

  // If not authenticated (query error/401), just use localStorage
  useEffect(() => {
    if (isError && !hasInitialized.current) {
      hasInitialized.current = true;
      // Already using localStorage state from getInitialState
    }
  }, [isError]);

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  // Debounced save to database (only when state actually changes after init)
  useEffect(() => {
    if (!hasInitialized.current) return;
    
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    
    saveTimeoutRef.current = setTimeout(() => {
      saveToDatabase(state);
    }, 3000); // Debounce: save 3 seconds after last change
    
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [state, saveToDatabase]);

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
    
    // Getting Started
    if (currentState.totalGrades >= 1 && !shownAchievementsRef.current.has('first_grade')) achievementsToUnlock.push('first_grade');
    if (currentState.totalRewrites >= 1 && !shownAchievementsRef.current.has('first_rewrite')) achievementsToUnlock.push('first_rewrite');
    if (currentState.totalDeliverabilityChecks >= 1 && !shownAchievementsRef.current.has('first_deliverability')) achievementsToUnlock.push('first_deliverability');
    
    // Excellence Milestones
    if (currentState.perfectScoreCount >= 1 && !shownAchievementsRef.current.has('perfect_score')) achievementsToUnlock.push('perfect_score');
    if (currentState.aPlusCount >= 1 && !shownAchievementsRef.current.has('a_plus')) achievementsToUnlock.push('a_plus');
    if (currentState.aPlusCount >= 3 && !shownAchievementsRef.current.has('triple_a')) achievementsToUnlock.push('triple_a');
    if (currentState.aPlusCount >= 5 && !shownAchievementsRef.current.has('five_a_plus')) achievementsToUnlock.push('five_a_plus');
    if (currentState.aPlusCount >= 10 && !shownAchievementsRef.current.has('ten_a_plus')) achievementsToUnlock.push('ten_a_plus');
    if (currentState.aPlusCount >= 20 && !shownAchievementsRef.current.has('twenty_a_plus')) achievementsToUnlock.push('twenty_a_plus');
    
    // Volume Milestones - Grading
    if (currentState.totalGrades >= 10 && !shownAchievementsRef.current.has('prolific')) achievementsToUnlock.push('prolific');
    if (currentState.totalGrades >= 25 && !shownAchievementsRef.current.has('veteran')) achievementsToUnlock.push('veteran');
    if (currentState.totalGrades >= 50 && !shownAchievementsRef.current.has('expert')) achievementsToUnlock.push('expert');
    if (currentState.totalGrades >= 100 && !shownAchievementsRef.current.has('centurion')) achievementsToUnlock.push('centurion');
    if (currentState.totalGrades >= 250 && !shownAchievementsRef.current.has('grading_legend')) achievementsToUnlock.push('grading_legend');
    
    // Volume Milestones - Rewrites
    if (currentState.totalRewrites >= 5 && !shownAchievementsRef.current.has('rewrite_master')) achievementsToUnlock.push('rewrite_master');
    if (currentState.totalRewrites >= 15 && !shownAchievementsRef.current.has('rewrite_pro')) achievementsToUnlock.push('rewrite_pro');
    if (currentState.totalRewrites >= 30 && !shownAchievementsRef.current.has('rewrite_expert')) achievementsToUnlock.push('rewrite_expert');
    if (currentState.totalRewrites >= 50 && !shownAchievementsRef.current.has('rewrite_legend')) achievementsToUnlock.push('rewrite_legend');
    
    // Volume Milestones - Follow-ups
    if (currentState.totalFollowups >= 1 && !shownAchievementsRef.current.has('followup_first')) achievementsToUnlock.push('followup_first');
    if (currentState.totalFollowups >= 10 && !shownAchievementsRef.current.has('followup_pro')) achievementsToUnlock.push('followup_pro');
    if (currentState.totalFollowups >= 25 && !shownAchievementsRef.current.has('followup_expert')) achievementsToUnlock.push('followup_expert');
    if (currentState.totalFollowups >= 50 && !shownAchievementsRef.current.has('followup_legend')) achievementsToUnlock.push('followup_legend');
    
    // Deliverability Achievements
    if (currentState.totalDeliverabilityChecks >= 1 && !shownAchievementsRef.current.has('deliverability_check')) achievementsToUnlock.push('deliverability_check');
    if (currentState.totalDeliverabilityChecks >= 10 && !shownAchievementsRef.current.has('deliverability_pro')) achievementsToUnlock.push('deliverability_pro');
    if (currentState.totalDeliverabilityChecks >= 25 && !shownAchievementsRef.current.has('deliverability_expert')) achievementsToUnlock.push('deliverability_expert');
    if (currentState.totalDeliverabilityChecks >= 50 && !shownAchievementsRef.current.has('deliverability_master')) achievementsToUnlock.push('deliverability_master');
    
    // Streak Achievements
    if (currentState.streak >= 3 && !shownAchievementsRef.current.has('streak_3')) achievementsToUnlock.push('streak_3');
    if (currentState.streak >= 7 && !shownAchievementsRef.current.has('streak_7')) achievementsToUnlock.push('streak_7');
    if (currentState.streak >= 14 && !shownAchievementsRef.current.has('streak_14')) achievementsToUnlock.push('streak_14');
    if (currentState.streak >= 30 && !shownAchievementsRef.current.has('streak_30')) achievementsToUnlock.push('streak_30');
    if (currentState.streak >= 60 && !shownAchievementsRef.current.has('streak_60')) achievementsToUnlock.push('streak_60');
    if (currentState.streak >= 90 && !shownAchievementsRef.current.has('streak_90')) achievementsToUnlock.push('streak_90');
    
    // Level Achievements
    if (currentState.level >= 5 && !shownAchievementsRef.current.has('level_5')) achievementsToUnlock.push('level_5');
    if (currentState.level >= 10 && !shownAchievementsRef.current.has('level_10')) achievementsToUnlock.push('level_10');
    if (currentState.level >= 15 && !shownAchievementsRef.current.has('level_15')) achievementsToUnlock.push('level_15');
    if (currentState.level >= 20 && !shownAchievementsRef.current.has('level_20')) achievementsToUnlock.push('level_20');
    if (currentState.level >= 25 && !shownAchievementsRef.current.has('level_25')) achievementsToUnlock.push('level_25');
    
    // XP Achievements
    if (currentState.xp >= 1000 && !shownAchievementsRef.current.has('xp_1000')) achievementsToUnlock.push('xp_1000');
    if (currentState.xp >= 5000 && !shownAchievementsRef.current.has('xp_5000')) achievementsToUnlock.push('xp_5000');
    if (currentState.xp >= 10000 && !shownAchievementsRef.current.has('xp_10000')) achievementsToUnlock.push('xp_10000');

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
