import { achievementDefinitions } from "../lib/achievements";
import { daubers, dauberSymbols, themes } from "../lib/cosmetics";
import type { AppState, DauberId, ThemeId } from "../types";

type AppearanceManagerProps = {
  state: AppState;
  onThemeChange: (theme: ThemeId) => void;
  onDauberChange: (dauber: DauberId) => void;
};

export function AppearanceManager({ state, onThemeChange, onDauberChange }: AppearanceManagerProps) {
  return (
    <section aria-labelledby="appearance-heading">
      <div className="panel-heading">
        <div>
          <h2 id="appearance-heading">Appearance</h2>
          <p>Cosmetics stay unlocked even if a streak resets.</p>
        </div>
      </div>

      <h3 className="cosmetic-heading">Themes</h3>
      <div className="cosmetic-grid">
        {themes.map((theme) => {
          const unlocked = state.unlocks.themes.includes(theme.id);
          return (
            <button
              type="button"
              key={theme.id}
              className={`cosmetic-option theme-swatch-${theme.id} ${state.settings.selectedTheme === theme.id ? "is-selected" : ""}`}
              disabled={!unlocked}
              aria-pressed={state.settings.selectedTheme === theme.id}
              onClick={() => onThemeChange(theme.id)}
            >
              <span className="cosmetic-preview" aria-hidden="true"><i /><i /><i /></span>
              <strong>{theme.label}</strong>
              <small>{unlocked ? theme.description : "Locked"}</small>
            </button>
          );
        })}
      </div>

      <h3 className="cosmetic-heading">Daubers</h3>
      <div className="dauber-grid">
        {daubers.map((dauber) => {
          const unlocked = state.unlocks.daubers.includes(dauber.id);
          return (
            <button
              type="button"
              key={dauber.id}
              className={`dauber-option dauber-${dauber.id} ${state.settings.selectedDauber === dauber.id ? "is-selected" : ""}`}
              disabled={!unlocked}
              aria-pressed={state.settings.selectedDauber === dauber.id}
              onClick={() => onDauberChange(dauber.id)}
            >
              <span aria-hidden="true">{dauberSymbols[dauber.id]}</span>
              <small>{dauber.label}{!unlocked && " · Locked"}</small>
            </button>
          );
        })}
      </div>

      <div className="achievement-list">
        <h3>Achievements</h3>
        {achievementDefinitions.map((definition) => {
          const status = state.achievements[definition.id];
          const progress = definition.progress(state);
          const percent = Math.min(100, (progress.current / progress.target) * 100);
          return (
            <article className={status.unlocked ? "is-unlocked" : ""} key={definition.id}>
              <div className="achievement-copy">
                <strong>{status.unlocked ? "✓ " : ""}{definition.label}</strong>
                <span>{definition.description} · Unlocks {definition.reward.label}</span>
              </div>
              <span className="achievement-count">{Math.min(progress.current, progress.target)}/{progress.target}</span>
              <div className="progress-track" aria-hidden="true"><span style={{ width: `${percent}%` }} /></div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
