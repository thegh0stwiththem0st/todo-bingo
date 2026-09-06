import { describe, expect, it } from "vitest";
import { getNextQuestTarget, pickQuestStart } from "./quest";

describe("quest paths", () => {
  it("starts with an easier target", () => {
    expect(pickQuestStart(() => 0)).toBe("standard-line");
    expect(pickQuestStart(() => 0.99)).toBe("postage-stamp");
  });

  it("expands diagonals into X", () => {
    expect(getNextQuestTarget("standard-line", ["diagonal-main"])).toBe("x");
  });

  it("expands the center row into H", () => {
    expect(getNextQuestTarget("standard-line", ["row-3"])).toBe("h");
  });

  it("builds postage stamp through corners and X", () => {
    expect(getNextQuestTarget("postage-stamp", ["postage-top-left"])).toBe("four-corners");
    expect(getNextQuestTarget("four-corners", ["four-corners"])).toBe("x");
    expect(getNextQuestTarget("x", ["x"])).toBe("blackout");
  });

  it("always ends after Blackout", () => {
    expect(getNextQuestTarget("blackout", ["blackout"])).toBeNull();
  });
});
