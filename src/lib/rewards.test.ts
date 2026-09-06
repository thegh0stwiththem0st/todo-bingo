import { describe, expect, it } from "vitest";
import type { Reward } from "../types";
import { preferredRewardTier, selectReward } from "./rewards";

const rewards: Reward[] = [
  { id: "small", text: "Small reward", tier: "small", enabled: true, createdAt: "2026-01-01" },
  { id: "medium", text: "Medium reward", tier: "medium", enabled: true, createdAt: "2026-01-01" },
  { id: "big", text: "Big reward", tier: "big", enabled: true, createdAt: "2026-01-01" },
];

describe("reward tiers", () => {
  it("maps harder patterns to larger reward tiers", () => {
    expect(preferredRewardTier("four-corners")).toBe("small");
    expect(preferredRewardTier("x")).toBe("medium");
    expect(preferredRewardTier("blackout")).toBe("big");
  });

  it("chooses from the preferred enabled tier", () => {
    expect(selectReward(rewards, "standard-line", () => 0)?.id).toBe("small");
    expect(selectReward(rewards, "blackout", () => 0)?.id).toBe("big");
  });

  it("falls back to any enabled reward and returns null for none", () => {
    const onlyMedium = rewards.map((reward) => ({ ...reward, enabled: reward.tier === "medium" }));
    expect(selectReward(onlyMedium, "blackout", () => 0)?.id).toBe("medium");
    expect(selectReward([], "blackout")).toBeNull();
  });
});
