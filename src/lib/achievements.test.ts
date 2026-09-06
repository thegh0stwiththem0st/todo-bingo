import { describe, expect, it } from "vitest";
import { createInitialState } from "./storage";
import { evaluateAchievements } from "./achievements";

describe("achievement unlocks", () => {
  it("keeps accessibility themes available from the start", () => {
    const state = createInitialState();
    expect(state.unlocks.themes).toEqual(["simple", "dark"]);
    expect(state.unlocks.daubers).toEqual(["x"]);
  });

  it("unlocks the first bingo reward once", () => {
    const state = createInitialState();
    state.stats.totalBingos = 1;
    const first = evaluateAchievements(state, "2026-09-06T12:00:00.000Z");
    expect(first.newlyUnlocked.map((item) => item.id)).toContain("first-bingo");
    expect(first.unlocks.daubers).toContain("star");

    const updated = { ...state, achievements: first.achievements, unlocks: first.unlocks };
    expect(evaluateAchievements(updated).newlyUnlocked).toEqual([]);
  });

  it("unlocks several earned cosmetics together", () => {
    const state = createInitialState();
    state.stats.completedSquares = 100;
    state.streak = { current: 0, best: 5, lastCompletedDate: "2026-08-01" };
    const result = evaluateAchievements(state);
    expect(result.unlocks.daubers).toEqual(expect.arrayContaining(["circle", "cat"]));
    expect(result.unlocks.themes).toEqual(expect.arrayContaining(["cozy", "candy"]));
  });

  it("unlocks rainbow after every target has been completed", () => {
    const state = createInitialState();
    state.stats.completedPatterns = {
      "standard-line": 1,
      "four-corners": 1,
      x: 1,
      t: 1,
      h: 1,
      "postage-stamp": 1,
      blackout: 1,
    };
    const result = evaluateAchievements(state);
    expect(result.achievements["all-patterns"].unlocked).toBe(true);
    expect(result.unlocks.daubers).toContain("rainbow");
  });

  it("never removes an existing unlock when progress changes", () => {
    const state = createInitialState();
    state.unlocks.themes.push("cozy");
    state.achievements["streak-3"] = { unlocked: true, unlockedAt: "2026-09-01T12:00:00.000Z" };
    state.streak = { current: 0, best: 3, lastCompletedDate: "2026-09-01" };
    expect(evaluateAchievements(state).unlocks.themes).toContain("cozy");
  });
});
