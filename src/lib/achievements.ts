import type {
  AchievementId,
  AchievementProgress,
  AppState,
  DauberId,
  PatternId,
  ThemeId,
  UnlockState,
} from "../types";

type CosmeticReward =
  | { type: "theme"; id: ThemeId; label: string }
  | { type: "dauber"; id: DauberId; label: string };

export type AchievementDefinition = {
  id: AchievementId;
  label: string;
  description: string;
  reward: CosmeticReward;
  progress: (state: Pick<AppState, "stats" | "streak">) => { current: number; target: number };
};

const allPatternIds: PatternId[] = [
  "standard-line", "four-corners", "x", "t", "h", "postage-stamp", "blackout",
];

export const achievementDefinitions: AchievementDefinition[] = [
  {
    id: "first-bingo", label: "First Bingo", description: "Complete your first bingo",
    reward: { type: "dauber", id: "star", label: "Star dauber" },
    progress: ({ stats }) => ({ current: stats.totalBingos, target: 1 }),
  },
  {
    id: "first-blackout", label: "Lights Out", description: "Complete your first Blackout",
    reward: { type: "dauber", id: "ghost", label: "Ghost dauber" },
    progress: ({ stats }) => ({ current: stats.completedPatterns.blackout ?? 0, target: 1 }),
  },
  {
    id: "squares-25", label: "Getting Things Done", description: "Complete 25 squares",
    reward: { type: "dauber", id: "circle", label: "Circle dauber" },
    progress: ({ stats }) => ({ current: stats.completedSquares, target: 25 }),
  },
  {
    id: "squares-100", label: "Century Club", description: "Complete 100 squares",
    reward: { type: "dauber", id: "cat", label: "Cat Paw dauber" },
    progress: ({ stats }) => ({ current: stats.completedSquares, target: 100 }),
  },
  {
    id: "squares-500", label: "Productivity Voyager", description: "Complete 500 squares",
    reward: { type: "theme", id: "space", label: "Space theme" },
    progress: ({ stats }) => ({ current: stats.completedSquares, target: 500 }),
  },
  {
    id: "streak-3", label: "Warm Start", description: "Reach a 3-day streak",
    reward: { type: "theme", id: "cozy", label: "Cozy theme" },
    progress: ({ streak }) => ({ current: streak.best, target: 3 }),
  },
  {
    id: "streak-5", label: "Sweet Momentum", description: "Reach a 5-day streak",
    reward: { type: "theme", id: "candy", label: "Candy theme" },
    progress: ({ streak }) => ({ current: streak.best, target: 5 }),
  },
  {
    id: "streak-10", label: "Locked In", description: "Reach a 10-day streak",
    reward: { type: "theme", id: "terminal", label: "Terminal theme" },
    progress: ({ streak }) => ({ current: streak.best, target: 10 }),
  },
  {
    id: "bingos-10", label: "Bingo Regular", description: "Complete 10 bingo boards",
    reward: { type: "dauber", id: "heart", label: "Heart dauber" },
    progress: ({ stats }) => ({ current: stats.totalBingos, target: 10 }),
  },
  {
    id: "all-patterns", label: "Pattern Master", description: "Complete every supported target",
    reward: { type: "dauber", id: "rainbow", label: "Rainbow dauber" },
    progress: ({ stats }) => ({
      current: allPatternIds.filter((id) => (stats.completedPatterns[id] ?? 0) > 0).length,
      target: allPatternIds.length,
    }),
  },
];

export function createInitialAchievements(): Record<AchievementId, AchievementProgress> {
  return Object.fromEntries(
    achievementDefinitions.map((achievement) => [achievement.id, { unlocked: false, unlockedAt: null }]),
  ) as Record<AchievementId, AchievementProgress>;
}

export function createInitialUnlocks(): UnlockState {
  return { themes: ["simple", "dark"], daubers: ["x"] };
}

export function evaluateAchievements(state: AppState, now = new Date().toISOString()): {
  achievements: AppState["achievements"];
  unlocks: UnlockState;
  newlyUnlocked: AchievementDefinition[];
} {
  const achievements = { ...state.achievements };
  const unlocks = { themes: [...state.unlocks.themes], daubers: [...state.unlocks.daubers] };
  const newlyUnlocked: AchievementDefinition[] = [];

  for (const definition of achievementDefinitions) {
    const progress = definition.progress(state);
    if (!achievements[definition.id].unlocked && progress.current >= progress.target) {
      achievements[definition.id] = { unlocked: true, unlockedAt: now };
      const collection = definition.reward.type === "theme" ? unlocks.themes : unlocks.daubers;
      if (!(collection as string[]).includes(definition.reward.id)) {
        (collection as string[]).push(definition.reward.id);
      }
      newlyUnlocked.push(definition);
    }
  }
  return { achievements, unlocks, newlyUnlocked };
}
