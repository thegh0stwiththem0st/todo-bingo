import { describe, expect, it } from "vitest";
import type { BoardSquare, UserTask } from "../types";
import { retireCompletedOneTimeTasks } from "./tasks";

const tasks: UserTask[] = [
  { id: "once-done", text: "File form", kind: "one-time", active: true, createdAt: "2026-01-01" },
  { id: "once-open", text: "Call dentist", kind: "one-time", active: true, createdAt: "2026-01-01" },
  { id: "repeat", text: "Check email", kind: "repeatable", active: true, createdAt: "2026-01-01" },
];

function square(taskId: string, completed: boolean, source: BoardSquare["source"] = "user"): BoardSquare {
  return { id: `square-${taskId}`, taskId, text: taskId, source, completed, countedComplete: completed };
}

describe("one-time task retirement", () => {
  it("removes only completed one-time user tasks", () => {
    const result = retireCompletedOneTimeTasks(tasks, [
      square("once-done", true),
      square("once-open", false),
      square("repeat", true),
    ]);
    expect(result.map((task) => task.id)).toEqual(["once-open", "repeat"]);
  });

  it("ignores filler squares even when IDs overlap", () => {
    expect(retireCompletedOneTimeTasks(tasks, [square("once-done", true, "filler")])).toEqual(tasks);
  });
});
