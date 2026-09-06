import { describe, expect, it } from "vitest";
import { getLocalDateKey, normalizeStreak, recordBingoDay, recordBingoStats } from "./progress";

describe("streak progress", () => {
  it("formats local calendar dates", () => {
    expect(getLocalDateKey(new Date(2026, 8, 6, 23, 30))).toBe("2026-09-06");
  });

  it("starts a streak and only counts once per day", () => {
    const initial = { current: 0, best: 0, lastCompletedDate: null };
    const first = recordBingoDay(initial, "2026-09-06");
    expect(first).toEqual({ current: 1, best: 1, lastCompletedDate: "2026-09-06" });
    expect(recordBingoDay(first, "2026-09-06")).toEqual(first);
  });

  it("increments on consecutive days and resets after a gap", () => {
    const first = { current: 3, best: 3, lastCompletedDate: "2026-09-05" };
    expect(recordBingoDay(first, "2026-09-06").current).toBe(4);
    expect(recordBingoDay(first, "2026-09-08")).toEqual({
      current: 1,
      best: 3,
      lastCompletedDate: "2026-09-08",
    });
  });

  it("shows an expired streak as zero without reducing the best", () => {
    expect(normalizeStreak({ current: 4, best: 7, lastCompletedDate: "2026-09-04" }, "2026-09-06"))
      .toEqual({ current: 0, best: 7, lastCompletedDate: "2026-09-04" });
  });
});

describe("bingo statistics", () => {
  it("increments totals by target", () => {
    const stats = recordBingoStats({ completedSquares: 5, totalBingos: 0, completedPatterns: {} }, "four-corners");
    expect(stats.totalBingos).toBe(1);
    expect(stats.completedPatterns["four-corners"]).toBe(1);
    expect(stats.completedSquares).toBe(5);
  });
});
