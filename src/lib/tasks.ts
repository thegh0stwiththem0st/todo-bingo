import type { BoardSquare, UserTask } from "../types";

export function retireCompletedOneTimeTasks(tasks: UserTask[], squares: BoardSquare[]): UserTask[] {
  const completedTaskIds = new Set(
    squares
      .filter((square) => square.source === "user" && square.completed && square.taskId)
      .map((square) => square.taskId as string),
  );
  return tasks.filter((task) => task.kind === "repeatable" || !completedTaskIds.has(task.id));
}
