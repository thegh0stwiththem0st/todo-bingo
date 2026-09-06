import { useState, type ChangeEvent } from "react";
import { targetPatterns } from "../lib/patterns";
import { getLocalDateKey, normalizeStreak } from "../lib/progress";
import { createBackup, parseBackup } from "../lib/storage";
import type { AppState } from "../types";

type DataManagerProps = {
  state: AppState;
  onImport: (state: AppState) => void;
};

export function DataManager({ state, onImport }: DataManagerProps) {
  const [status, setStatus] = useState("");
  const streak = normalizeStreak(state.streak);
  const completedPatterns = targetPatterns.filter((pattern) => (state.stats.completedPatterns[pattern.id] ?? 0) > 0);

  function exportBackup() {
    const backup = createBackup(state);
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `productivity-bingo-backup-${getLocalDateKey()}.json`;
    link.click();
    URL.revokeObjectURL(url);
    setStatus("Backup downloaded.");
  }

  async function importBackup(event: ChangeEvent<HTMLInputElement>) {
    const input = event.currentTarget;
    const file = input.files?.[0];
    if (!file) return;
    try {
      const imported = parseBackup(await file.text());
      const confirmed = window.confirm(
        "Import this backup? It will replace all current tasks, rewards, settings, statistics, streaks, and board progress.",
      );
      if (confirmed) {
        onImport(imported);
        setStatus("Backup restored successfully.");
      } else {
        setStatus("Import cancelled. Your current data was not changed.");
      }
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Could not import that backup.");
    } finally {
      input.value = "";
    }
  }

  return (
    <section aria-labelledby="data-heading">
      <div className="panel-heading">
        <div>
          <h2 id="data-heading">Progress & data</h2>
          <p>Your progress is stored only in this browser.</p>
        </div>
      </div>

      <div className="stats-grid" aria-label="Progress statistics">
        <div><strong>{streak.current}</strong><span>Current streak</span></div>
        <div><strong>{streak.best}</strong><span>Best streak</span></div>
        <div><strong>{state.stats.totalBingos}</strong><span>Bingos</span></div>
        <div><strong>{state.stats.completedSquares}</strong><span>Squares finished</span></div>
      </div>

      {completedPatterns.length > 0 && (
        <div className="pattern-history">
          <h3>Completed targets</h3>
          <ul>
            {completedPatterns.map((pattern) => (
              <li key={pattern.id}><span>{pattern.label}</span><strong>{state.stats.completedPatterns[pattern.id]}</strong></li>
            ))}
          </ul>
        </div>
      )}

      <div className="backup-actions">
        <div>
          <h3>Backup</h3>
          <p>Export regularly so clearing browser storage doesn’t erase your progress.</p>
        </div>
        <button className="button button-primary" type="button" onClick={exportBackup}>Export backup</button>
        <label className="button button-secondary" htmlFor="import-backup">Import backup</label>
        <input
          className="sr-only"
          id="import-backup"
          type="file"
          accept="application/json,.json"
          onChange={importBackup}
        />
      </div>
      {status && <p className="notice" role="status">{status}</p>}
    </section>
  );
}
