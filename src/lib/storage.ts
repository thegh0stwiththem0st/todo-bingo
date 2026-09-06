import { defaultFillerTasks } from "../data/fillerTasks";
import type {
  AppState,
  BackupFile,
  BingoMode,
  BoardSquare,
  BoardState,
  FillerTask,
  PatternId,
  Reward,
  StreakState,
  UserStats,
  UserTask,
} from "../types";
import { achievementDefinitions, createInitialAchievements, createInitialUnlocks } from "./achievements";
import { daubers, themes } from "./cosmetics";
import { targetPatterns } from "./patterns";

export const STORAGE_KEY = "productivity-bingo-state-v5";
const LEGACY_STORAGE_KEYS = ["productivity-bingo-state-v4", "productivity-bingo-state-v3", "productivity-bingo-state-v2", "productivity-bingo-state-v1"];
const patternIds = targetPatterns.map((pattern) => pattern.id);

export function createInitialState(): AppState {
  return {
    version: 5,
    tasks: [],
    rewards: [],
    fillerTasks: defaultFillerTasks.map((task) => ({ ...task })),
    board: null,
    stats: { completedSquares: 0, totalBingos: 0, completedPatterns: {} },
    streak: { current: 0, best: 0, lastCompletedDate: null },
    settings: { selectedTheme: "simple", selectedDauber: "x" },
    unlocks: createInitialUnlocks(),
    achievements: createInitialAchievements(),
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isNonNegativeInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= 0;
}

function isValidTask(value: unknown): value is UserTask {
  return isRecord(value) && typeof value.id === "string" && typeof value.text === "string" &&
    typeof value.active === "boolean" && typeof value.createdAt === "string";
}

function isRewardTier(value: unknown): value is Reward["tier"] {
  return value === "small" || value === "medium" || value === "big";
}

function isValidRewardCore(value: unknown): value is Omit<Reward, "tier"> & { tier?: Reward["tier"] } {
  return isRecord(value) && typeof value.id === "string" && typeof value.text === "string" &&
    typeof value.enabled === "boolean" && typeof value.createdAt === "string";
}

function isValidReward(value: unknown): value is Reward {
  return isValidRewardCore(value) && isRewardTier(value.tier);
}

function isValidFiller(value: unknown): value is FillerTask {
  return isRecord(value) && typeof value.id === "string" && typeof value.text === "string" &&
    typeof value.enabled === "boolean" && value.builtIn === true && typeof value.category === "string";
}

function isValidSquareCore(value: unknown): value is Omit<BoardSquare, "countedComplete"> & { countedComplete?: boolean } {
  return isRecord(value) && typeof value.id === "string" && typeof value.text === "string" &&
    (value.source === "user" || value.source === "filler") && typeof value.completed === "boolean" &&
    (value.countedComplete === undefined || typeof value.countedComplete === "boolean");
}

function hasValidBoardCore(value: Record<string, unknown>): boolean {
  return typeof value.id === "string" && typeof value.createdAt === "string" &&
    Array.isArray(value.squares) && value.squares.length === 25 && value.squares.every(isValidSquareCore) &&
    Array.isArray(value.completedPatterns) && value.completedPatterns.every((pattern) => typeof pattern === "string");
}

function isValidAwardedReward(value: unknown, requireTier: boolean): boolean {
  return value === null || (isRecord(value) && typeof value.id === "string" && typeof value.text === "string" &&
    (!requireTier || isRewardTier(value.tier)));
}

function hasValidModeFields(value: Record<string, unknown>, allowQuest: boolean, requireTier: boolean): boolean {
  return (value.mode === "choose" || value.mode === "random" || (allowQuest && value.mode === "quest")) &&
    typeof value.targetPattern === "string" && patternIds.includes(value.targetPattern as PatternId) &&
    typeof value.targetCompleted === "boolean" &&
    isValidAwardedReward(value.awardedReward, requireTier);
}

function isValidQuest(value: unknown): boolean {
  return value === null || (isRecord(value) && typeof value.completed === "boolean" &&
    Array.isArray(value.history) && value.history.every((stage) =>
      isRecord(stage) && typeof stage.targetPattern === "string" &&
      patternIds.includes(stage.targetPattern as PatternId) &&
      Array.isArray(stage.completedVariants) && stage.completedVariants.every((item) => typeof item === "string") &&
      typeof stage.completedAt === "string" && isValidAwardedReward(stage.awardedReward, true)));
}

function isValidBoard(value: unknown): value is BoardState | null {
  if (value === null) return true;
  return isRecord(value) && hasValidBoardCore(value) && hasValidModeFields(value, true, true) &&
    value.squares instanceof Array && value.squares.every(
      (square) => isRecord(square) && typeof square.countedComplete === "boolean",
    ) && typeof value.completionRecorded === "boolean" && isValidQuest(value.quest) &&
    ((value.mode === "quest" && value.quest !== null) || (value.mode !== "quest" && value.quest === null));
}

function isValidLegacyBoard(value: unknown): value is Omit<BoardState, "quest"> | null {
  if (value === null) return true;
  return isRecord(value) && hasValidBoardCore(value) && hasValidModeFields(value, false, false) &&
    value.squares instanceof Array && value.squares.every(
      (square) => isRecord(square) && typeof square.countedComplete === "boolean",
    ) && typeof value.completionRecorded === "boolean";
}

function isValidStats(value: unknown): value is UserStats {
  if (!isRecord(value) || !isNonNegativeInteger(value.completedSquares) ||
    !isNonNegativeInteger(value.totalBingos) || !isRecord(value.completedPatterns)) return false;
  return Object.entries(value.completedPatterns).every(
    ([key, count]) => patternIds.includes(key as PatternId) && isNonNegativeInteger(count),
  );
}

function isDateKey(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

function isValidStreak(value: unknown): value is StreakState {
  return isRecord(value) && isNonNegativeInteger(value.current) && isNonNegativeInteger(value.best) &&
    value.current <= value.best && (value.lastCompletedDate === null || isDateKey(value.lastCompletedDate));
}

function isValidCosmetics(value: Record<string, unknown>): boolean {
  if (!isRecord(value.settings) || !isRecord(value.unlocks) || !isRecord(value.achievements)) return false;
  const achievements = value.achievements;
  const themeIds = themes.map((theme) => theme.id);
  const dauberIds = daubers.map((dauber) => dauber.id);
  if (!Array.isArray(value.unlocks.themes) || !value.unlocks.themes.every((id) => themeIds.includes(id)) ||
    !Array.isArray(value.unlocks.daubers) || !value.unlocks.daubers.every((id) => dauberIds.includes(id)) ||
    typeof value.settings.selectedTheme !== "string" ||
    !value.unlocks.themes.includes(value.settings.selectedTheme) ||
    typeof value.settings.selectedDauber !== "string" ||
    !value.unlocks.daubers.includes(value.settings.selectedDauber)) return false;

  return achievementDefinitions.every((definition) => {
    const progress = achievements[definition.id];
    return isRecord(progress) && typeof progress.unlocked === "boolean" &&
      (progress.unlockedAt === null || typeof progress.unlockedAt === "string");
  });
}

function hasValidCollections(value: Record<string, unknown>, requireTier = true): boolean {
  return Array.isArray(value.tasks) && value.tasks.every(isValidTask) &&
    Array.isArray(value.rewards) && value.rewards.every(requireTier ? isValidReward : isValidRewardCore) &&
    Array.isArray(value.fillerTasks) && value.fillerTasks.every(isValidFiller);
}

function isValidState(value: unknown): value is AppState {
  return isRecord(value) && value.version === 5 && hasValidCollections(value) &&
    isValidBoard(value.board) && isValidStats(value.stats) && isValidStreak(value.streak) &&
    isValidCosmetics(value);
}

function migrateBoard(value: unknown, version: 1 | 2): BoardState | null | undefined {
  if (value === null) return null;
  if (!isRecord(value) || !hasValidBoardCore(value)) return undefined;

  const squares = (value.squares as Array<Omit<BoardSquare, "countedComplete">>).map((square) => ({
    ...square,
    countedComplete: square.completed,
  }));
  if (version === 1) {
    const completedPatterns = value.completedPatterns as string[];
    return {
      id: value.id as string,
      createdAt: value.createdAt as string,
      squares,
      mode: "choose",
      targetPattern: "standard-line",
      completedPatterns,
      targetCompleted: completedPatterns.length > 0,
      completionRecorded: completedPatterns.length > 0,
      awardedReward: null,
      quest: null,
    };
  }
  if (!hasValidModeFields(value, false, false)) return undefined;
  const legacyReward = value.awardedReward as { id: string; text: string } | null;
  return {
    id: value.id as string,
    createdAt: value.createdAt as string,
    squares,
    mode: value.mode as BingoMode,
    targetPattern: value.targetPattern as PatternId,
    completedPatterns: value.completedPatterns as string[],
    targetCompleted: value.targetCompleted as boolean,
    completionRecorded: value.targetCompleted as boolean,
    awardedReward: legacyReward ? { ...legacyReward, tier: "medium" } : null,
    quest: null,
  };
}

function migrateLegacyModernBoard(value: unknown): BoardState | null | undefined {
  if (!isValidLegacyBoard(value)) return undefined;
  if (value === null) return null;
  const reward = value.awardedReward as { id: string; text: string } | null;
  return {
    ...value,
    awardedReward: reward ? { ...reward, tier: "medium" } : null,
    quest: null,
  } as BoardState;
}

function migrateState(raw: string | null): AppState | null {
  if (!raw) return null;
  try {
    const value: unknown = JSON.parse(raw);
    if (isValidState(value)) return value;
    if (!isRecord(value) || ![1, 2, 3, 4].includes(value.version as number) ||
      !hasValidCollections(value, false)) return null;
    const version = value.version as 1 | 2 | 3 | 4;
    const board = version >= 3
      ? migrateLegacyModernBoard(value.board)
      : migrateBoard(value.board, version as 1 | 2);
    if (board === undefined || (version >= 3 && (!isValidStats(value.stats) || !isValidStreak(value.streak))) ||
      (version === 4 && !isValidCosmetics(value))) return null;
    const rewards = (value.rewards as Array<Omit<Reward, "tier"> & { tier?: Reward["tier"] }>).map((reward) => ({
      ...reward,
      tier: reward.tier ?? "medium",
    }));
    return {
      version: 5,
      tasks: value.tasks as UserTask[],
      rewards,
      fillerTasks: value.fillerTasks as FillerTask[],
      board,
      stats: version >= 3 ? value.stats as UserStats : { completedSquares: 0, totalBingos: 0, completedPatterns: {} },
      streak: version >= 3 ? value.streak as StreakState : { current: 0, best: 0, lastCompletedDate: null },
      settings: version === 4 ? value.settings as AppState["settings"] : { selectedTheme: "simple", selectedDauber: "x" },
      unlocks: version === 4 ? value.unlocks as AppState["unlocks"] : createInitialUnlocks(),
      achievements: version === 4 ? value.achievements as AppState["achievements"] : createInitialAchievements(),
    };
  } catch {
    return null;
  }
}

export function parseStoredState(raw: string | null): AppState | null {
  if (!raw) return null;
  try {
    const value: unknown = JSON.parse(raw);
    return isValidState(value) ? value : null;
  } catch {
    return null;
  }
}

export function loadState(): AppState {
  if (typeof localStorage === "undefined") return createInitialState();
  const current = migrateState(localStorage.getItem(STORAGE_KEY));
  if (current) return current;
  for (const key of LEGACY_STORAGE_KEYS) {
    const migrated = migrateState(localStorage.getItem(key));
    if (migrated) return migrated;
  }
  return createInitialState();
}

export function saveState(state: AppState): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function createBackup(state: AppState, exportedAt = new Date().toISOString()): BackupFile {
  return { app: "productivity-bingo", schemaVersion: 5, exportedAt, data: state };
}

export function parseBackup(raw: string): AppState {
  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch {
    throw new Error("That file is not valid JSON.");
  }
  if (!isRecord(value) || value.app !== "productivity-bingo") {
    throw new Error("That file is not a Productivity Bingo backup.");
  }
  if (value.schemaVersion !== 3 && value.schemaVersion !== 4 && value.schemaVersion !== 5) {
    throw new Error("This backup uses an unsupported schema version.");
  }
  if (typeof value.exportedAt !== "string") {
    throw new Error("The backup is incomplete or contains invalid data.");
  }
  const state = migrateState(JSON.stringify(value.data));
  if (!state) throw new Error("The backup is incomplete or contains invalid data.");
  return state;
}
