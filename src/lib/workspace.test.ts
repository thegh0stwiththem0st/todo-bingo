import { describe, expect, it } from "vitest";
import { createInitialWorkspace, getHolidayTakeover, getPomodoroSeconds } from "./workspace";

describe("workspace helpers", () => {
  it("creates an unpinned, paused focus timer", () => {
    const workspace = createInitialWorkspace();
    expect(workspace.pinnedTools).toEqual([]);
    expect(workspace.pomodoro.remainingSeconds).toBe(1500);
    expect(workspace.pomodoro.isRunning).toBe(false);
  });

  it("derives a running timer from its end time", () => {
    const workspace = createInitialWorkspace();
    workspace.pomodoro = { ...workspace.pomodoro, isRunning: true, endsAt: "2026-09-06T12:01:00.000Z" };
    expect(getPomodoroSeconds(workspace, Date.parse("2026-09-06T12:00:10.000Z"))).toBe(50);
  });

  it("selects automatic and preview holiday takeovers", () => {
    expect(getHolidayTakeover(new Date(2026, 9, 31))?.id).toBe("halloween");
    expect(getHolidayTakeover(new Date(2026, 8, 6))).toBeNull();
    expect(getHolidayTakeover(new Date(2026, 8, 6), "pride")?.id).toBe("pride");
  });
});
