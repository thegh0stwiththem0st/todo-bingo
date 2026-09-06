import { getTargetPattern, targetPatterns } from "../lib/patterns";
import type { BingoMode, PatternId } from "../types";

type ModeSelectorProps = {
  mode: BingoMode;
  target: PatternId;
  onModeChange: (mode: BingoMode) => void;
  onTargetChange: (target: PatternId) => void;
};

export function ModeSelector({ mode, target, onModeChange, onTargetChange }: ModeSelectorProps) {
  return (
    <div className="mode-picker" aria-label="Bingo mode">
      <div className="mode-buttons">
        <button
          type="button"
          className={mode === "choose" ? "is-active" : ""}
          aria-pressed={mode === "choose"}
          onClick={() => onModeChange("choose")}
        >
          Choose my bingo
        </button>
        <button
          type="button"
          className={mode === "random" ? "is-active" : ""}
          aria-pressed={mode === "random"}
          onClick={() => onModeChange("random")}
        >
          Pick for me
        </button>
        <button
          type="button"
          className={mode === "quest" ? "is-active" : ""}
          aria-pressed={mode === "quest"}
          onClick={() => onModeChange("quest")}
        >
          Quest mode
        </button>
      </div>
      {mode === "choose" ? (
        <label className="target-select">
          <span>Target pattern</span>
          <select value={target} onChange={(event) => onTargetChange(event.target.value as PatternId)}>
            {targetPatterns.map((pattern) => (
              <option value={pattern.id} key={pattern.id}>{pattern.label}</option>
            ))}
          </select>
          <small>{getTargetPattern(target).description}</small>
        </label>
      ) : mode === "random" ? (
        <p className="random-hint">We’ll choose a surprise target when the board is made. Blackout is intentionally rare.</p>
      ) : (
        <p className="random-hint">Build through connected patterns on one board, earn a reward at every level, and finish with Blackout.</p>
      )}
    </div>
  );
}
