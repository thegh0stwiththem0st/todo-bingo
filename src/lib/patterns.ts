import type { PatternId } from "../types";

export type BingoPattern = {
  id: string;
  label: string;
  indexes: number[];
};

export type TargetPattern = {
  id: PatternId;
  label: string;
  description: string;
  variants: BingoPattern[];
};

const rows = Array.from({ length: 5 }, (_, row) => ({
  id: `row-${row + 1}`,
  label: `Row ${row + 1}`,
  indexes: Array.from({ length: 5 }, (_, column) => row * 5 + column),
}));

const columns = Array.from({ length: 5 }, (_, column) => ({
  id: `column-${column + 1}`,
  label: `Column ${column + 1}`,
  indexes: Array.from({ length: 5 }, (_, row) => row * 5 + column),
}));

export const standardPatterns: BingoPattern[] = [
  ...rows,
  ...columns,
  { id: "diagonal-main", label: "Main diagonal", indexes: [0, 6, 12, 18, 24] },
  { id: "diagonal-reverse", label: "Reverse diagonal", indexes: [4, 8, 12, 16, 20] },
];

function variant(id: string, label: string, indexes: number[]): BingoPattern {
  return { id, label, indexes: [...new Set(indexes)] };
}

export const targetPatterns: TargetPattern[] = [
  {
    id: "standard-line",
    label: "Standard Line",
    description: "Any full row, column, or diagonal",
    variants: standardPatterns,
  },
  {
    id: "four-corners",
    label: "Four Corners",
    description: "Complete all four corner squares",
    variants: [variant("four-corners", "Four Corners", [0, 4, 20, 24])],
  },
  {
    id: "x",
    label: "X",
    description: "Complete both diagonals",
    variants: [variant("x", "X", [0, 4, 6, 8, 12, 16, 18, 20, 24])],
  },
  {
    id: "t",
    label: "T",
    description: "Complete the top row and center column",
    variants: [variant("t", "T", [0, 1, 2, 3, 4, 7, 12, 17, 22])],
  },
  {
    id: "h",
    label: "H",
    description: "Complete both outer columns and the middle bar",
    variants: [variant("h", "H", [0, 4, 5, 9, 10, 11, 12, 13, 14, 15, 19, 20, 24])],
  },
  {
    id: "postage-stamp",
    label: "Postage Stamp",
    description: "Complete a 2×2 block in any corner",
    variants: [
      variant("postage-top-left", "Top-left Postage Stamp", [0, 1, 5, 6]),
      variant("postage-top-right", "Top-right Postage Stamp", [3, 4, 8, 9]),
      variant("postage-bottom-left", "Bottom-left Postage Stamp", [15, 16, 20, 21]),
      variant("postage-bottom-right", "Bottom-right Postage Stamp", [18, 19, 23, 24]),
    ],
  },
  {
    id: "blackout",
    label: "Blackout",
    description: "Complete every square on the board",
    variants: [variant("blackout", "Blackout", Array.from({ length: 25 }, (_, index) => index))],
  },
];

export function getTargetPattern(id: PatternId): TargetPattern {
  return targetPatterns.find((pattern) => pattern.id === id) ?? targetPatterns[0];
}

export function detectCompletedPatterns(
  completedIndexes: Iterable<number>,
  patterns: BingoPattern[] = standardPatterns,
): BingoPattern[] {
  const completed = new Set(completedIndexes);
  return patterns.filter((pattern) => pattern.indexes.every((index) => completed.has(index)));
}

export function detectTargetPatterns(
  completedIndexes: Iterable<number>,
  targetId: PatternId,
): BingoPattern[] {
  return detectCompletedPatterns(completedIndexes, getTargetPattern(targetId).variants);
}

const randomTargetWeights: Array<{ id: PatternId; weight: number }> = [
  { id: "standard-line", weight: 5 },
  { id: "four-corners", weight: 4 },
  { id: "x", weight: 3 },
  { id: "t", weight: 3 },
  { id: "h", weight: 2 },
  { id: "postage-stamp", weight: 4 },
  { id: "blackout", weight: 1 },
];

export function pickRandomTarget(random: () => number = Math.random): PatternId {
  const total = randomTargetWeights.reduce((sum, entry) => sum + entry.weight, 0);
  let roll = random() * total;
  for (const entry of randomTargetWeights) {
    roll -= entry.weight;
    if (roll < 0) return entry.id;
  }
  return randomTargetWeights[randomTargetWeights.length - 1].id;
}

export function getWinningIndexes(patternIds: string[]): Set<number> {
  const variants = targetPatterns.flatMap((pattern) => pattern.variants);
  return new Set(
    variants
      .filter((pattern) => patternIds.includes(pattern.id))
      .flatMap((pattern) => pattern.indexes),
  );
}
