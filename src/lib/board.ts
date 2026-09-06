import type { BingoMode, BoardSquare, BoardState, FillerTask, PatternId, UserTask } from "../types";
import { createId } from "./id";

export function shuffle<T>(values: readonly T[], random: () => number = Math.random): T[] {
  const result = [...values];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
  }
  return result;
}

export function generateBoard(
  tasks: UserTask[],
  fillerTasks: FillerTask[],
  options: { mode: BingoMode; targetPattern: PatternId } = {
    mode: "choose",
    targetPattern: "standard-line",
  },
  random: () => number = Math.random,
): BoardState {
  const activeTasks = shuffle(
    tasks.filter((task) => task.active),
    random,
  ).slice(0, 25);
  const enabledFillers = shuffle(
    fillerTasks.filter((task) => task.enabled),
    random,
  );

  if (activeTasks.length < 25 && enabledFillers.length === 0) {
    throw new Error("Enable at least one filler task or add 25 active tasks.");
  }

  const userSquares: BoardSquare[] = activeTasks.map((task) => ({
    id: createId("square"),
    taskId: task.id,
    text: task.text,
    source: "user",
    completed: false,
    countedComplete: false,
  }));

  const fillerSquares: BoardSquare[] = [];
  const needed = 25 - userSquares.length;
  for (let index = 0; index < needed; index += 1) {
    const filler = enabledFillers[index % enabledFillers.length];
    fillerSquares.push({
      id: createId("square"),
      taskId: filler.id,
      text: filler.text,
      source: "filler",
      completed: false,
      countedComplete: false,
    });
  }

  return {
    id: createId("board"),
    createdAt: new Date().toISOString(),
    squares: shuffle([...userSquares, ...fillerSquares], random),
    mode: options.mode,
    targetPattern: options.targetPattern,
    completedPatterns: [],
    targetCompleted: false,
    completionRecorded: false,
    awardedReward: null,
    quest: options.mode === "quest" ? { history: [], completed: false } : null,
  };
}
