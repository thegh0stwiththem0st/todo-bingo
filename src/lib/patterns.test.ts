import { describe, expect, it } from "vitest";
import { detectCompletedPatterns, detectTargetPatterns, pickRandomTarget } from "./patterns";

describe("detectCompletedPatterns", () => {
  it("detects a completed row", () => {
    expect(detectCompletedPatterns([0, 1, 2, 3, 4]).map((pattern) => pattern.id)).toContain("row-1");
  });

  it("detects a completed column", () => {
    expect(detectCompletedPatterns([2, 7, 12, 17, 22]).map((pattern) => pattern.id)).toContain("column-3");
  });

  it("detects both diagonals independently", () => {
    const ids = detectCompletedPatterns([0, 4, 6, 8, 12, 16, 18, 20, 24]).map((pattern) => pattern.id);
    expect(ids).toContain("diagonal-main");
    expect(ids).toContain("diagonal-reverse");
  });

  it("does not report incomplete patterns", () => {
    expect(detectCompletedPatterns([0, 1, 2, 3])).toEqual([]);
  });
});

describe("Milestone 2 target patterns", () => {
  const cases = [
    ["four-corners", [0, 4, 20, 24]],
    ["x", [0, 4, 6, 8, 12, 16, 18, 20, 24]],
    ["t", [0, 1, 2, 3, 4, 7, 12, 17, 22]],
    ["h", [0, 4, 5, 9, 10, 11, 12, 13, 14, 15, 19, 20, 24]],
    ["postage-stamp", [0, 1, 5, 6]],
    ["blackout", Array.from({ length: 25 }, (_, index) => index)],
  ] as const;

  it.each(cases)("detects %s", (target, indexes) => {
    expect(detectTargetPatterns(indexes, target)).toHaveLength(1);
  });

  it("accepts any corner for postage stamp", () => {
    expect(detectTargetPatterns([18, 19, 23, 24], "postage-stamp")[0]?.id).toBe("postage-bottom-right");
  });

  it("weights blackout as the final and smallest random interval", () => {
    expect(pickRandomTarget(() => 0)).toBe("standard-line");
    expect(pickRandomTarget(() => 0.999)).toBe("blackout");
  });
});
