import type { DauberId, ThemeId } from "../types";

export type CosmeticDefinition<T extends string> = {
  id: T;
  label: string;
  description: string;
};

export const themes: CosmeticDefinition<ThemeId>[] = [
  { id: "simple", label: "Simple", description: "Clean, warm, and distraction-free" },
  { id: "dark", label: "Dark", description: "A comfortable low-light palette" },
  { id: "cozy", label: "Cozy", description: "Soft autumn colors and warm paper" },
  { id: "candy", label: "Candy", description: "Bright, cheerful pastel colors" },
  { id: "terminal", label: "Terminal", description: "Green-screen focus mode" },
  { id: "space", label: "Space", description: "A deep cosmic night palette" },
];

export const daubers: CosmeticDefinition<DauberId>[] = [
  { id: "x", label: "X", description: "The classic mark" },
  { id: "circle", label: "Circle", description: "A clean ring" },
  { id: "star", label: "Star", description: "A little victory" },
  { id: "heart", label: "Heart", description: "Progress with affection" },
  { id: "cat", label: "Cat Paw", description: "Tiny helpful toe beans" },
  { id: "ghost", label: "Ghost", description: "A spooky little helper" },
  { id: "rainbow", label: "Rainbow", description: "Every color at once" },
];

export const dauberSymbols: Record<DauberId, string> = {
  x: "×",
  circle: "○",
  star: "★",
  heart: "♥",
  cat: "🐾",
  ghost: "👻",
  rainbow: "●",
};
