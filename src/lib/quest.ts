import type { PatternId } from "../types";

export type QuestTransition = {
  from: PatternId;
  to: PatternId | null;
  completedVariants?: string[];
};

export const questTransitions: QuestTransition[] = [
  { from: "postage-stamp", to: "four-corners" },
  { from: "four-corners", to: "x" },
  { from: "standard-line", completedVariants: ["diagonal-main", "diagonal-reverse"], to: "x" },
  { from: "standard-line", completedVariants: ["row-1", "column-3"], to: "t" },
  { from: "standard-line", completedVariants: ["row-3", "column-1", "column-5"], to: "h" },
  { from: "standard-line", to: "x" },
  { from: "x", to: "blackout" },
  { from: "t", to: "blackout" },
  { from: "h", to: "blackout" },
  { from: "blackout", to: null },
];

const questStarts: Array<{ id: PatternId; weight: number }> = [
  { id: "standard-line", weight: 4 },
  { id: "four-corners", weight: 3 },
  { id: "postage-stamp", weight: 3 },
];

export function pickQuestStart(random: () => number = Math.random): PatternId {
  const total = questStarts.reduce((sum, entry) => sum + entry.weight, 0);
  let roll = random() * total;
  for (const entry of questStarts) {
    roll -= entry.weight;
    if (roll < 0) return entry.id;
  }
  return questStarts[questStarts.length - 1].id;
}

export function getNextQuestTarget(current: PatternId, completedVariants: string[]): PatternId | null {
  const transition = questTransitions.find((entry) =>
    entry.from === current &&
    (!entry.completedVariants || entry.completedVariants.some((variant) => completedVariants.includes(variant))),
  );
  return transition?.to ?? null;
}
