export type UserTask = {
  id: string;
  text: string;
  active: boolean;
  createdAt: string;
  kind: TaskKind;
};

export type TaskKind = "one-time" | "repeatable";

export type Reward = {
  id: string;
  text: string;
  enabled: boolean;
  createdAt: string;
  tier: RewardTier;
};

export type RewardTier = "small" | "medium" | "big";

export type FillerTask = {
  id: string;
  text: string;
  enabled: boolean;
  builtIn: true;
  category: string;
};

export type BoardSquare = {
  id: string;
  taskId?: string;
  text: string;
  source: "user" | "filler";
  completed: boolean;
  countedComplete: boolean;
};

export type PatternId =
  | "standard-line"
  | "four-corners"
  | "x"
  | "t"
  | "h"
  | "postage-stamp"
  | "blackout";

export type BingoMode = "choose" | "random" | "quest";

export type AwardedReward = Pick<Reward, "id" | "text" | "tier">;

export type QuestStageResult = {
  targetPattern: PatternId;
  completedVariants: string[];
  completedAt: string;
  awardedReward: AwardedReward | null;
};

export type QuestState = {
  history: QuestStageResult[];
  completed: boolean;
};

export type BoardState = {
  id: string;
  createdAt: string;
  squares: BoardSquare[];
  mode: BingoMode;
  targetPattern: PatternId;
  completedPatterns: string[];
  targetCompleted: boolean;
  completionRecorded: boolean;
  awardedReward: AwardedReward | null;
  quest: QuestState | null;
};

export type UserStats = {
  completedSquares: number;
  totalBingos: number;
  completedPatterns: Partial<Record<PatternId, number>>;
};

export type StreakState = {
  current: number;
  best: number;
  lastCompletedDate: string | null;
};

export type ThemeId = "simple" | "dark" | "cozy" | "candy" | "terminal" | "space";
export type DauberId = "x" | "circle" | "star" | "heart" | "cat" | "ghost" | "rainbow";

export type AchievementId =
  | "first-bingo"
  | "first-blackout"
  | "squares-25"
  | "squares-100"
  | "squares-500"
  | "streak-3"
  | "streak-5"
  | "streak-10"
  | "bingos-10"
  | "all-patterns";

export type AchievementProgress = {
  unlocked: boolean;
  unlockedAt: string | null;
};

export type UnlockState = {
  themes: ThemeId[];
  daubers: DauberId[];
};

export type AppearanceSettings = {
  selectedTheme: ThemeId;
  selectedDauber: DauberId;
};

export type AppState = {
  version: 6;
  tasks: UserTask[];
  rewards: Reward[];
  fillerTasks: FillerTask[];
  board: BoardState | null;
  stats: UserStats;
  streak: StreakState;
  settings: AppearanceSettings;
  unlocks: UnlockState;
  achievements: Record<AchievementId, AchievementProgress>;
};

export type BackupFile = {
  app: "productivity-bingo";
  schemaVersion: 6;
  exportedAt: string;
  data: AppState;
};
