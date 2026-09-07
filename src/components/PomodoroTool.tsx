import { useEffect, useState } from "react";
import { getPomodoroSeconds } from "../lib/workspace";
import type { PomodoroState, WorkspaceState } from "../types";

type PomodoroToolProps = {
  workspace: WorkspaceState;
  onChange: (pomodoro: PomodoroState) => void;
};

export function PomodoroTool({ workspace, onChange }: PomodoroToolProps) {
  const timer = workspace.pomodoro;
  const [now, setNow] = useState(Date.now());
  const seconds = getPomodoroSeconds(workspace, now);

  useEffect(() => {
    if (!timer.isRunning) return;
    const interval = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(interval);
  }, [timer.isRunning]);

  useEffect(() => {
    if (!timer.isRunning || seconds > 0) return;
    const phase = timer.phase === "focus" ? "break" : "focus";
    const remainingSeconds = (phase === "focus" ? timer.focusMinutes : timer.breakMinutes) * 60;
    onChange({ ...timer, phase, remainingSeconds, endsAt: null, isRunning: false });
  }, [onChange, seconds, timer]);

  function toggleTimer() {
    if (timer.isRunning) {
      onChange({ ...timer, remainingSeconds: seconds, endsAt: null, isRunning: false });
    } else {
      onChange({ ...timer, endsAt: new Date(Date.now() + timer.remainingSeconds * 1000).toISOString(), isRunning: true });
      setNow(Date.now());
    }
  }

  function resetTimer(phase = timer.phase) {
    const remainingSeconds = (phase === "focus" ? timer.focusMinutes : timer.breakMinutes) * 60;
    onChange({ ...timer, phase, remainingSeconds, endsAt: null, isRunning: false });
  }

  function updateMinutes(field: "focusMinutes" | "breakMinutes", value: number) {
    const minutes = Math.max(1, Math.min(90, value || 1));
    const phaseMatches = (field === "focusMinutes" && timer.phase === "focus") || (field === "breakMinutes" && timer.phase === "break");
    onChange({ ...timer, [field]: minutes, ...(phaseMatches ? { remainingSeconds: minutes * 60 } : {}) });
  }

  const minutes = Math.floor(seconds / 60).toString().padStart(2, "0");
  const remainder = (seconds % 60).toString().padStart(2, "0");

  return (
    <div className="pomodoro-tool">
      <div className="phase-switch" aria-label="Timer phase">
        <button type="button" className={timer.phase === "focus" ? "is-active" : ""} onClick={() => resetTimer("focus")}>Focus</button>
        <button type="button" className={timer.phase === "break" ? "is-active" : ""} onClick={() => resetTimer("break")}>Break</button>
      </div>
      <output className="timer-display" aria-live="off" aria-label={`${minutes} minutes ${remainder} seconds remaining`}>{minutes}:{remainder}</output>
      <div className="timer-actions">
        <button className="button button-primary" type="button" onClick={toggleTimer}>{timer.isRunning ? "Pause" : "Start"}</button>
        <button className="button button-secondary" type="button" onClick={() => resetTimer()}>Reset</button>
      </div>
      <div className="timer-settings">
        <label>Focus <input type="number" min="1" max="90" value={timer.focusMinutes} disabled={timer.isRunning} onChange={(event) => updateMinutes("focusMinutes", Number(event.target.value))} /> min</label>
        <label>Break <input type="number" min="1" max="90" value={timer.breakMinutes} disabled={timer.isRunning} onChange={(event) => updateMinutes("breakMinutes", Number(event.target.value))} /> min</label>
      </div>
    </div>
  );
}
