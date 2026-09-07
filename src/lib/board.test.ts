import { describe, expect, it } from "vitest";
import { defaultFillerTasks } from "../data/fillerTasks";
import type { UserTask } from "../types";
import { generateBoard } from "./board";

function task(index: number): UserTask {
  return { id: `task-${index}`, text: `Task ${index}`, kind: "repeatable", active: true, createdAt: "2026-01-01" };
}

describe("generateBoard", () => {
  it("creates 25 squares and prioritizes all active user tasks", () => {
    const board = generateBoard(Array.from({ length: 8 }, (_, index) => task(index)), defaultFillerTasks, undefined, () => 0.5);
    expect(board.squares).toHaveLength(25);
    expect(board.squares.filter((square) => square.source === "user")).toHaveLength(8);
    expect(new Set(board.squares.filter((square) => square.source === "user").map((square) => square.taskId)).size).toBe(8);
  });

  it("selects 25 unique tasks when more than 25 are active", () => {
    const board = generateBoard(Array.from({ length: 30 }, (_, index) => task(index)), defaultFillerTasks, undefined, () => 0.25);
    expect(board.squares.every((square) => square.source === "user")).toBe(true);
    expect(new Set(board.squares.map((square) => square.taskId)).size).toBe(25);
  });

  it("duplicates fillers only when the enabled unique pool is insufficient", () => {
    const oneFiller = defaultFillerTasks.slice(0, 1);
    const board = generateBoard([], oneFiller, undefined, () => 0.5);
    expect(board.squares).toHaveLength(25);
    expect(new Set(board.squares.map((square) => square.taskId)).size).toBe(1);
  });

  it("requires a filler when fewer than 25 tasks exist", () => {
    expect(() => generateBoard([], [], undefined, () => 0.5)).toThrow(/Enable at least one filler/);
  });

  it("stores the selected mode and target", () => {
    const board = generateBoard([], defaultFillerTasks, { mode: "random", targetPattern: "x" }, () => 0.5);
    expect(board.mode).toBe("random");
    expect(board.targetPattern).toBe("x");
    expect(board.targetCompleted).toBe(false);
    expect(board.completionRecorded).toBe(false);
    expect(board.awardedReward).toBeNull();
    expect(board.squares.every((square) => !square.countedComplete)).toBe(true);
  });

  it("initializes quest state only in quest mode", () => {
    const board = generateBoard([], defaultFillerTasks, { mode: "quest", targetPattern: "four-corners" }, () => 0.5);
    expect(board.quest).toEqual({ history: [], completed: false });
  });
});
