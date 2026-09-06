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
import { targetPatterns } from "./patterns";

export const STORAGE_KEY = "productivity-bingo-state-v3";
const LEGACY_STORAGE_KEYS = ["productivity-bingo-state-v2", "productivity-bingo-state-v1"];
const patternIds = targetPatterns.map((pattern) => pattern.id);

export function createInitialState(): AppState {
  return {
    version: 3,
    tasks: [],
    rewards: [],
    fillerTasks: defaultFillerTasks.map((task) => ({ ...task })),
    board: null,
    stats: { completedSquares: 0, totalBingos: 0, completedPatterns: {} },
    streak: { current: 0, best: 0, lastCompletedDate: null },
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

function isValidReward(value: unknown): value is Reward {
  return isRecord(value) && typeof value.id === "string" && typeof value.text === "string" &&
    typeof value.enabled === "boolean" && typeof value.createdAt === "string";
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

function hasValidModeFields(value: Record<string, unknown>): boolean {
  return (value.mode === "choose" || value.mode === "random") &&
    typeof value.targetPattern === "string" && patternIds.includes(value.targetPattern as PatternId) &&
    typeof value.targetCompleted === "boolean" &&
    (value.awardedReward === null || (isRecord(value.awardedReward) &&
      typeof value.awardedReward.id === "string" && typeof value.awardedReward.text === "string"));
}

function isValidBoard(value: unknown): value is BoardState | null {
  if (value === null) return true;
  return isRecord(value) && hasValidBoardCore(value) && hasValidModeFields(value) &&
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

function hasValidCollections(value: Record<string, unknown>): boolean {
  return Array.isArray(value.tasks) && value.tasks.every(isValidTask) &&
    Array.isArray(value.rewards) && value.rewards.every(isValidReward) &&
    Array.isArray(value.fillerTasks) && value.fillerTasks.every(isValidFiller);
}

function isValidState(value: unknown): value is AppState {
  return isRecord(value) && value.version === 3 && hasValidCollections(value) &&
    isValidBoard(value.board) && isValidStats(value.stats) && isValidStreak(value.streak);
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
    };
  }
  if (!hasValidModeFields(value)) return undefined;
  return {
    id: value.id as string,
    createdAt: value.createdAt as string,
    squares,
    mode: value.mode as BingoMode,
    targetPattern: value.targetPattern as PatternId,
    completedPatterns: value.completedPatterns as string[],
    targetCompleted: value.targetCompleted as boolean,
    completionRecorded: value.targetCompleted as boolean,
    awardedReward: value.awardedReward as BoardState["awardedReward"],
  };
}

function migrateState(raw: string | null): AppState | null {
  if (!raw) return null;
  try {
    const value: unknown = JSON.parse(raw);
    if (isValidState(value)) return value;
    if (!isRecord(value) || (value.version !== 1 && value.version !== 2) || !hasValidCollections(value)) return null;
    const board = migrateBoard(value.board, value.version);
    if (board === undefined) return null;
    return {
      version: 3,
      tasks: value.tasks as UserTask[],
      rewards: value.rewards as Reward[],
      fillerTasks: value.fillerTasks as FillerTask[],
      board,
      stats: { completedSquares: 0, totalBingos: 0, completedPatterns: {} },
      streak: { current: 0, best: 0, lastCompletedDate: null },
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
  return { app: "productivity-bingo", schemaVersion: 3, exportedAt, data: state };
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
  if (value.schemaVersion !== 3) {
    throw new Error("This backup uses an unsupported schema version.");
  }
  if (typeof value.exportedAt !== "string" || !isValidState(value.data)) {
    throw new Error("The backup is incomplete or contains invalid data.");
  }
  return value.data;
}
