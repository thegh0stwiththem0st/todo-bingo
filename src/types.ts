export type UserTask = {
  id: string;
  text: string;
  active: boolean;
  createdAt: string;
};

export type Reward = {
  id: string;
  text: string;
  enabled: boolean;
  createdAt: string;
};

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

export type BingoMode = "choose" | "random";

export type AwardedReward = Pick<Reward, "id" | "text">;

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

export type AppState = {
  version: 3;
  tasks: UserTask[];
  rewards: Reward[];
  fillerTasks: FillerTask[];
  board: BoardState | null;
  stats: UserStats;
  streak: StreakState;
};

export type BackupFile = {
  app: "productivity-bingo";
  schemaVersion: 3;
  exportedAt: string;
  data: AppState;
};
