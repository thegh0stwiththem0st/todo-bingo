import type { CSSProperties } from "react";
import type { HolidayId } from "../types";

export type CelebrationKind = HolidayId | "confetti";

type BingoCelebrationProps = {
  kind: CelebrationKind;
};

const labels: Record<CelebrationKind, string> = {
  confetti: "Confetti",
  "new-year": "New Year fireworks",
  valentine: "Valentine's Day hearts",
  pride: "rainbow confetti",
  halloween: "Halloween bats",
  winter: "falling snow",
};

function particleStyle(index: number): CSSProperties {
  return {
    "--x": `${(index * 37 + 7) % 100}%`,
    "--y": `${(index * 29 + 12) % 68}%`,
    "--delay": `${((index * 13) % 24) / 10}s`,
    "--duration": `${3.1 + ((index * 7) % 18) / 10}s`,
    "--drift": `${((index * 19) % 120) - 60}px`,
    "--hue": `${(index * 47) % 360}`,
    "--size": `${12 + (index % 5) * 3}px`,
  } as CSSProperties;
}

export function BingoCelebration({ kind }: BingoCelebrationProps) {
  const count = kind === "new-year" ? 8 : kind === "halloween" ? 18 : kind === "valentine" ? 28 : 44;
  return (
    <div className={`bingo-celebration celebration-${kind}`}>
      {Array.from({ length: count }, (_, index) => (
        <span className="celebration-particle" style={particleStyle(index)} key={index} aria-hidden="true">
          {kind === "valentine" ? "♥" : kind === "halloween" ? "🦇" : kind === "winter" ? "❄" : ""}
        </span>
      ))}
      <span className="sr-only" aria-live="polite">Bingo! {labels[kind]} celebration.</span>
    </div>
  );
}
