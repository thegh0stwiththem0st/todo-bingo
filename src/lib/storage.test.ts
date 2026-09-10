import { describe, expect, it } from "vitest";
import { createBackup, createInitialState, parseBackup, parseStoredState } from "./storage";
import { generateBoard, setFocusedSquare } from "./board";
import { defaultFillerTasks } from "../data/fillerTasks";

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
    expect(imported.version).toBe(10);
    expect(imported.stats.completedSquares).toBe(25);
    expect(imported.unlocks.themes).toContain("dark");
  });

  it("migrates schema 4 rewards to the medium tier", () => {
    const current = createInitialState();
    const legacyData = {
      ...current,
      version: 4,
      tasks: [{ id: "task-1", text: "Existing task", active: true, createdAt: "2026-09-06" }],
      rewards: [{ id: "reward-1", text: "Take a break", enabled: true, createdAt: "2026-09-06" }],
    };
    const imported = parseBackup(JSON.stringify({
      app: "productivity-bingo",
      schemaVersion: 4,
      exportedAt: "2026-09-06T12:00:00.000Z",
      data: legacyData,
    }));
    expect(imported.version).toBe(10);
    expect(imported.rewards[0].tier).toBe("medium");
    expect(imported.tasks[0].kind).toBe("repeatable");
    expect(imported.settings).toEqual(current.settings);
  });

  it("migrates schema 6 data with default workspace and seasonal settings", () => {
    const current = createInitialState();
    const { workspace: _workspace, ...legacyData } = {
      ...current,
      version: 6,
      settings: { selectedTheme: "simple", selectedDauber: "x" },
    };
    const imported = parseBackup(JSON.stringify({
      app: "productivity-bingo",
      schemaVersion: 6,
      exportedAt: "2026-09-06T12:00:00.000Z",
      data: legacyData,
    }));
    expect(imported.version).toBe(10);
    expect(imported.workspace.pinnedTools).toEqual([]);
    expect(imported.workspace.pomodoro.focusMinutes).toBe(25);
    expect(imported.settings.seasonalEffects).toBe(true);
  });

  it("migrates schema 7 workspace data and adds milestone 7 defaults", () => {
    const current = createInitialState();
    const { rewardFillers: _fillers, ...legacy } = current;
    const { stopwatch: _stopwatch, timer: _timer, timeZones: _zones, timeZoneSource: _source, comparisonDate: _date, comparisonTime: _time, dayCountdowns: _days, ...legacyWorkspace } = current.workspace;
    const legacyData = { ...legacy, version: 7, workspace: { ...legacyWorkspace, notes: [{ id: "note-1", text: "Keep me", createdAt: "2026-09-06", x: 40, y: 50 }] } };
    const imported = parseBackup(JSON.stringify({ app: "productivity-bingo", schemaVersion: 7, exportedAt: "2026-09-06T12:00:00.000Z", data: legacyData }));
    expect(imported.version).toBe(10);
    expect(imported.workspace.notes[0].text).toBe("Keep me");
    expect(imported.workspace.stopwatch.elapsedMs).toBe(0);
    expect(imported.rewardFillers).toHaveLength(33);
  });

  it("migrates schema 8 while preserving reward and workspace choices", () => {
    const current = createInitialState();
    const { floatingTools: _positions, ...legacyWorkspace } = current.workspace;
    const legacyData = { ...current, version: 8, rewardFillers: current.rewardFillers.map((reward, index) => ({ ...reward, enabled: index === 0 })), workspace: { ...legacyWorkspace, pinnedTools: ["stopwatch"] } };
    const imported = parseBackup(JSON.stringify({ app: "productivity-bingo", schemaVersion: 8, exportedAt: "2026-09-07T12:00:00.000Z", data: legacyData }));
    expect(imported.version).toBe(10);
    expect(imported.rewardFillers.filter((reward) => reward.enabled)).toHaveLength(1);
    expect(imported.workspace.pinnedTools).toEqual(["stopwatch"]);
    expect(imported.workspace.floatingTools).toEqual({});
  });

  it("retires the ambient-sounds tool without rejecting an otherwise valid backup", () => {
    const state = createInitialState();
    state.workspace.activeTool = "sounds";
    state.workspace.pinnedTools = ["sounds", "stopwatch"];
    const imported = parseBackup(JSON.stringify(createBackup(state)));
    expect(imported.workspace.activeTool).toBe("pomodoro");
    expect(imported.workspace.pinnedTools).toEqual(["stopwatch"]);
  });

  it("migrates schema 9 with empty metrics and removes only the retired coffee filler", () => {
    const current = createInitialState();
    const { metrics: _metrics, ...legacyWorkspace } = current.workspace;
    const coffee = { id: "filler-fun-wellness-1", text: "Make a cup of tea or coffee", enabled: false, builtIn: true as const, category: "Fun / Wellness" };
    const legacyData = { ...current, version: 9, workspace: legacyWorkspace, fillerTasks: [...current.fillerTasks, coffee] };
    const imported = parseBackup(JSON.stringify({ app: "productivity-bingo", schemaVersion: 9, exportedAt: "2026-09-10T12:00:00.000Z", data: legacyData }));
    expect(imported.version).toBe(10);
    expect(imported.workspace.metrics).toEqual([]);
    expect(imported.fillerTasks.some((task) => /coffee/i.test(task.text))).toBe(false);
    expect(imported.rewardFillers.some((reward) => /coffee/i.test(reward.text))).toBe(true);
  });

  it("persists metrics in current backups", () => {
    const state = createInitialState();
    state.workspace.metrics = [{ id: "metric-1", label: "Pages", value: 12, resetFrequency: "none", createdAt: "2026-09-10T12:00:00.000Z", lastResetAt: "2026-09-10T12:00:00.000Z" }];
    expect(parseBackup(JSON.stringify(createBackup(state))).workspace.metrics).toEqual(state.workspace.metrics);
  });

  it("persists the focused square with the current board", () => {
    const state = createInitialState();
    const board = generateBoard([], defaultFillerTasks, undefined, () => 0.5);
    state.board = setFocusedSquare(board, board.squares[3].id);
    expect(parseBackup(JSON.stringify(createBackup(state))).board?.focusedSquareId).toBe(board.squares[3].id);
  });
});
