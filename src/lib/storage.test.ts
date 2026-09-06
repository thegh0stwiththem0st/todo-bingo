import { describe, expect, it } from "vitest";
import { createBackup, createInitialState, parseBackup, parseStoredState } from "./storage";

describe("stored state", () => {
  it("round-trips a valid state", () => {
    const state = createInitialState();
    expect(parseStoredState(JSON.stringify(state))).toEqual(state);
  });

  it("rejects malformed and unsupported state", () => {
    expect(parseStoredState("not json")).toBeNull();
    expect(parseStoredState(JSON.stringify({ version: 3 }))).toBeNull();
  });
});

describe("backup validation", () => {
  it("round-trips a complete backup", () => {
    const state = createInitialState();
    const backup = createBackup(state, "2026-09-06T12:00:00.000Z");
    expect(parseBackup(JSON.stringify(backup))).toEqual(state);
  });

  it("rejects the wrong app and schema", () => {
    expect(() => parseBackup(JSON.stringify({ app: "other", schemaVersion: 4 }))).toThrow(/not a Productivity Bingo/);
    expect(() => parseBackup(JSON.stringify({ app: "productivity-bingo", schemaVersion: 2 }))).toThrow(/unsupported/);
  });

  it("rejects malformed state even with the right envelope", () => {
    expect(() => parseBackup(JSON.stringify({
      app: "productivity-bingo",
      schemaVersion: 4,
      exportedAt: "2026-09-06T12:00:00.000Z",
      data: { version: 4 },
    }))).toThrow(/invalid data/);
  });

  it("migrates a valid schema 3 backup", () => {
    const current = createInitialState();
    const legacyData = {
      version: 3,
      tasks: current.tasks,
      rewards: current.rewards,
      fillerTasks: current.fillerTasks,
      board: current.board,
      stats: { completedSquares: 25, totalBingos: 1, completedPatterns: { "standard-line": 1 } },
      streak: { current: 1, best: 1, lastCompletedDate: "2026-09-06" },
    };
    const imported = parseBackup(JSON.stringify({
      app: "productivity-bingo",
      schemaVersion: 3,
      exportedAt: "2026-09-06T12:00:00.000Z",
      data: legacyData,
    }));
    expect(imported.version).toBe(5);
    expect(imported.stats.completedSquares).toBe(25);
    expect(imported.unlocks.themes).toContain("dark");
  });

  it("migrates schema 4 rewards to the medium tier", () => {
    const current = createInitialState();
    const legacyData = {
      ...current,
      version: 4,
      rewards: [{ id: "reward-1", text: "Take a break", enabled: true, createdAt: "2026-09-06" }],
    };
    const imported = parseBackup(JSON.stringify({
      app: "productivity-bingo",
      schemaVersion: 4,
      exportedAt: "2026-09-06T12:00:00.000Z",
      data: legacyData,
    }));
    expect(imported.version).toBe(5);
    expect(imported.rewards[0].tier).toBe("medium");
    expect(imported.settings).toEqual(current.settings);
  });
});
