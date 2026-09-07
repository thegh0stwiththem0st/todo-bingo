import type { RewardFiller, RewardTier } from "../types";

type RewardSeed = [text: string, category: string, size: RewardTier, involvesSpending?: boolean];

const seeds: RewardSeed[] = [
  ["Take a guilt-free 15-minute break", "Quick", "small"],
  ["Take a guilt-free 30-minute break", "Free", "medium"],
  ["Get cozy and do nothing for 15 minutes", "Quick", "small"],
  ["Step away from your screen for a while", "Free", "small"],
  ["Spend some time doing whatever sounds fun", "Free", "medium"],
  ["Watch one episode of a show", "Entertainment", "medium"],
  ["Play a game for 30 minutes", "Entertainment", "medium"],
  ["Watch a movie", "Entertainment", "big"],
  ["Watch some favorite videos", "Entertainment", "small"],
  ["Listen to a favorite album or playlist", "Entertainment", "medium"],
  ["Make a favorite drink", "Food & Drink", "small"],
  ["Have a favorite snack", "Food & Drink", "small"],
  ["Have dessert", "Food & Drink", "medium"],
  ["Make yourself a nice coffee or tea", "Food & Drink", "small"],
  ["Choose something special for your next meal", "Food & Drink", "medium"],
  ["Read for 20 minutes", "Hobby", "small"],
  ["Spend 30 minutes on a hobby", "Hobby", "medium"],
  ["Work on a fun personal project", "Hobby", "medium"],
  ["Make something just for fun", "Hobby", "medium"],
  ["Spend some time on a creative project", "Hobby", "medium"],
  ["Take a long shower or bath", "Self-Care", "medium"],
  ["Do a little self-care", "Self-Care", "small"],
  ["Put on comfy clothes and relax", "Self-Care", "small"],
  ["Light a candle and unwind", "Self-Care", "small"],
  ["Have an extra-relaxing evening", "Self-Care", "big"],
  ["Play with a pet", "Free", "small"],
  ["Call or message someone you enjoy talking to", "Social", "medium"],
  ["Choose what to watch tonight", "Entertainment", "small"],
  ["Give yourself an early stopping point for the day", "Big Reward", "big"],
  ["Plan something fun to look forward to", "Free", "medium"],
  ["Buy yourself a small treat", "Spending", "small", true],
  ["Order takeout", "Spending", "big", true],
  ["Buy something inexpensive from your wishlist", "Spending", "medium", true],
];

export const defaultRewardFillers: RewardFiller[] = seeds.map(([text, category, size, involvesSpending = false], index) => ({
  id: `reward-filler-${index + 1}`,
  text,
  category,
  size,
  involvesSpending,
  enabled: !involvesSpending,
  builtIn: true,
}));
