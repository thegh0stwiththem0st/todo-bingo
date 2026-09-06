import type { PatternId, StreakState, UserStats } from "../types";

export function getLocalDateKey(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function dayNumber(dateKey: string): number {
  const [year, month, day] = dateKey.split("-").map(Number);
  return Math.floor(Date.UTC(year, month - 1, day) / 86_400_000);
}

export function normalizeStreak(streak: StreakState, today = getLocalDateKey()): StreakState {
  if (!streak.lastCompletedDate) return streak;
  const elapsedDays = dayNumber(today) - dayNumber(streak.lastCompletedDate);
  if (elapsedDays <= 1) return streak;
  return { ...streak, current: 0 };
}

export function recordBingoDay(streak: StreakState, today = getLocalDateKey()): StreakState {
  if (streak.lastCompletedDate === today) return normalizeStreak(streak, today);
  const previous = streak.lastCompletedDate ? dayNumber(streak.lastCompletedDate) : null;
  const next = previous !== null && dayNumber(today) - previous === 1 ? streak.current + 1 : 1;
  return {
    current: next,
    best: Math.max(streak.best, next),
    lastCompletedDate: today,
  };
}

export function recordBingoStats(stats: UserStats, pattern: PatternId): UserStats {
  return {
    ...stats,
    totalBingos: stats.totalBingos + 1,
    completedPatterns: {
      ...stats.completedPatterns,
      [pattern]: (stats.completedPatterns[pattern] ?? 0) + 1,
    },
  };
}
