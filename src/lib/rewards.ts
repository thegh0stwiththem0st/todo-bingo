import type { PatternId, Reward, RewardFiller, RewardTier } from "../types";

export type SelectableReward = Pick<Reward, "id" | "text" | "enabled"> & { tier: RewardTier };

export function rewardFillerToSelectable(reward: RewardFiller): SelectableReward {
  return { id: reward.id, text: reward.text, enabled: reward.enabled, tier: reward.size };
}

const targetTiers: Record<PatternId, RewardTier> = {
  "standard-line": "small",
  "four-corners": "small",
  "postage-stamp": "small",
  x: "medium",
  t: "medium",
  h: "medium",
  blackout: "big",
};

export function preferredRewardTier(target: PatternId): RewardTier {
  return targetTiers[target];
}

export function selectReward(
  rewards: SelectableReward[],
  target: PatternId,
  random: () => number = Math.random,
): SelectableReward | null {
  const enabled = rewards.filter((reward) => reward.enabled);
  if (enabled.length === 0) return null;
  const preferred = enabled.filter((reward) => reward.tier === preferredRewardTier(target));
  const pool = preferred.length > 0 ? preferred : enabled;
  return pool[Math.floor(random() * pool.length)];
}
