import { useState, useEffect, useCallback } from "react";
import { useLocalStorage } from "./useLocalStorage";
import { useStreak } from "./useStreak";
import { useDailyReading } from "./useDailyReading";
import { useHifz } from "./useHifz";
import { SURAH_META } from "@/data/surah-meta";

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: "streak" | "reading" | "hifz" | "goals";
  unlocked: boolean;
  unlockedAt?: string;
  progress?: number;
  target?: number;
}

interface AchievementState {
  unlocked: Record<string, string>; // id -> unlocked date
  lastChecked: string;
}

const ACHIEVEMENT_DEFINITIONS: Omit<Achievement, "unlocked" | "unlockedAt" | "progress">[] = [
  // Streak achievements
  { id: "streak_3", title: "بداية موفقة", description: "٣ أيام متواصلة من القراءة", icon: "🔥", category: "streak", target: 3 },
  { id: "streak_7", title: "أسبوع كامل", description: "٧ أيام متواصلة من القراءة", icon: "🔥", category: "streak", target: 7 },
  { id: "streak_30", title: "شهر من الإلتزام", description: "٣٠ يوم متواصل", icon: "🏆", category: "streak", target: 30 },
  { id: "streak_100", title: "المثابر", description: "١٠٠ يوم متواصل", icon: "👑", category: "streak", target: 100 },
  { id: "streak_365", title: "سنة كاملة", description: "٣٦٥ يوم متواصل", icon: "💎", category: "streak", target: 365 },
  
  // Reading achievements
  { id: "read_100", title: "القارئ", description: "قراءة ١٠٠ آية", icon: "📖", category: "reading", target: 100 },
  { id: "read_1000", title: "الحافظ", description: "قراءة ١٠٠٠ آية", icon: "📚", category: "reading", target: 1000 },
  { id: "read_5000", title: "المتقن", description: "قراءة ٥٠٠٠ آية", icon: "🌟", category: "reading", target: 5000 },
  { id: "read_6236", title: "ختمة القرآن", description: "قراءة القرآن كاملاً", icon: "🏅", category: "reading", target: 6236 },
  
  // Hifz achievements
  { id: "hifz_1", title: "أول سورة", description: "حفظ أول سورة", icon: "🎯", category: "hifz", target: 1 },
  { id: "hifz_10", title: "عشر سور", description: "حفظ ١٠ سور", icon: "⭐", category: "hifz", target: 10 },
  { id: "hifz_30", title: "جزء كامل", description: "حفظ ٣٠ سورة", icon: "🌙", category: "hifz", target: 30 },
  { id: "hifz_50", title: "نصف الطريق", description: "حفظ ٥٠ سورة", icon: "🏆", category: "hifz", target: 50 },
  { id: "hifz_114", title: "حافظ القرآن", description: "حفظ القرآن كاملاً", icon: "👑", category: "hifz", target: 114 },
  
  // Goal achievements
  { id: "goal_first", title: "أول هدف", description: "تحقيق الهدف اليومي لأول مرة", icon: "🎯", category: "goals", target: 1 },
  { id: "goal_7", title: "أسبوع من النجاح", description: "تحقيق الهدف اليومي ٧ مرات", icon: "🏅", category: "goals", target: 7 },
  { id: "goal_30", title: "شهر من الإنجاز", description: "تحقيق الهدف اليومي ٣٠ مرة", icon: "🏆", category: "goals", target: 30 },
];

export function useAchievements() {
  const [state, setState] = useLocalStorage<AchievementState>("wise-achievements", {
    unlocked: {},
    lastChecked: new Date().toISOString(),
  });
  const [newUnlock, setNewUnlock] = useState<Achievement | null>(null);
  
  const { streak, maxStreak } = useStreak();
  const { todayCount, goal } = useDailyReading();
  const { getSurahsByStatus, getProgress } = useHifz();
  
  // Get total reading stats from localStorage
  const getTotalAyahs = useCallback(() => {
    try {
      const stats = localStorage.getItem("wise-reading-stats");
      if (stats) {
        const parsed = JSON.parse(stats);
        return parsed.totalAyahs || 0;
      }
    } catch {}
    return 0;
  }, []);
  
  const getGoalCompletions = useCallback(() => {
    try {
      const data = localStorage.getItem("wise-goal-completions");
      if (data) return JSON.parse(data) as number;
    } catch {}
    return 0;
  }, []);

  const checkAndUnlock = useCallback(() => {
    const totalAyahs = getTotalAyahs();
    const memorizedCount = getSurahsByStatus("memorized").length;
    const goalCompletions = getGoalCompletions();
    const currentStreak = Math.max(streak, maxStreak);
    
    const newUnlocks: string[] = [];
    
    for (const def of ACHIEVEMENT_DEFINITIONS) {
      if (state.unlocked[def.id]) continue;
      
      let shouldUnlock = false;
      
      switch (def.category) {
        case "streak":
          shouldUnlock = currentStreak >= (def.target || 0);
          break;
        case "reading":
          shouldUnlock = totalAyahs >= (def.target || 0);
          break;
        case "hifz":
          shouldUnlock = memorizedCount >= (def.target || 0);
          break;
        case "goals":
          shouldUnlock = goalCompletions >= (def.target || 0);
          break;
      }
      
      if (shouldUnlock) {
        newUnlocks.push(def.id);
      }
    }
    
    if (newUnlocks.length > 0) {
      const now = new Date().toISOString();
      const updatedUnlocked = { ...state.unlocked };
      newUnlocks.forEach((id) => {
        updatedUnlocked[id] = now;
      });
      
      setState({ unlocked: updatedUnlocked, lastChecked: now });
      
      // Show notification for first new unlock
      const firstNew = ACHIEVEMENT_DEFINITIONS.find((d) => d.id === newUnlocks[0]);
      if (firstNew) {
        setNewUnlock({ ...firstNew, unlocked: true, unlockedAt: now });
      }
    }
  }, [state, setState, streak, maxStreak, getTotalAyahs, getSurahsByStatus, getGoalCompletions]);

  // Check for new achievements periodically
  useEffect(() => {
    checkAndUnlock();
    const interval = setInterval(checkAndUnlock, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const getAchievements = useCallback((): Achievement[] => {
    const totalAyahs = getTotalAyahs();
    const memorizedCount = getSurahsByStatus("memorized").length;
    const goalCompletions = getGoalCompletions();
    const currentStreak = Math.max(streak, maxStreak);
    
    return ACHIEVEMENT_DEFINITIONS.map((def) => {
      let progress = 0;
      
      switch (def.category) {
        case "streak":
          progress = currentStreak;
          break;
        case "reading":
          progress = totalAyahs;
          break;
        case "hifz":
          progress = memorizedCount;
          break;
        case "goals":
          progress = goalCompletions;
          break;
      }
      
      return {
        ...def,
        unlocked: !!state.unlocked[def.id],
        unlockedAt: state.unlocked[def.id],
        progress,
      };
    });
  }, [state.unlocked, streak, maxStreak, getTotalAyahs, getSurahsByStatus, getGoalCompletions]);

  const dismissNewUnlock = useCallback(() => {
    setNewUnlock(null);
  }, []);

  const getUnlockedCount = useCallback(() => {
    return Object.keys(state.unlocked).length;
  }, [state.unlocked]);

  return {
    achievements: getAchievements(),
    newUnlock,
    dismissNewUnlock,
    unlockedCount: getUnlockedCount(),
    totalCount: ACHIEVEMENT_DEFINITIONS.length,
    checkAndUnlock,
  };
}
