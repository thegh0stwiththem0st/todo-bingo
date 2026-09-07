import { useEffect, useState } from "react";
import { formatClockSeconds, getTimerRemainingSeconds } from "../lib/timeTools";
import type { CountdownTimerState } from "../types";

export function CountdownTimerTool({ timer, onChange }: { timer: CountdownTimerState; onChange: (value: CountdownTimerState) => void }) {
  const [now, setNow] = useState(Date.now());
  const remaining = getTimerRemainingSeconds(timer.remainingSeconds, timer.endsAt, timer.isRunning, now);
  useEffect(() => {
    if (!timer.isRunning) return;
    const interval = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(interval);
  }, [timer.isRunning]);
  useEffect(() => {
    if (timer.isRunning && remaining === 0) onChange({ ...timer, remainingSeconds: 0, endsAt: null, isRunning: false, completed: true });
  }, [remaining, timer, onChange]);
  function setDuration(seconds: number) { onChange({ durationSeconds: seconds, remainingSeconds: seconds, endsAt: null, isRunning: false, completed: false }); }
  function setPart(part: "hours" | "minutes" | "seconds", value: number) {
    const hours = Math.floor(timer.remainingSeconds / 3600), minutes = Math.floor(timer.remainingSeconds % 3600 / 60), seconds = timer.remainingSeconds % 60;
    setDuration((part === "hours" ? value : hours) * 3600 + (part === "minutes" ? value : minutes) * 60 + (part === "seconds" ? value : seconds));
  }
  function toggle() {
    if (timer.isRunning) onChange({ ...timer, remainingSeconds: remaining, endsAt: null, isRunning: false });
    else if (remaining > 0) onChange({ ...timer, endsAt: new Date(Date.now() + remaining * 1000).toISOString(), isRunning: true, completed: false });
  }
  return <div className={`clock-tool ${timer.completed ? "is-complete" : ""}`}>
    <output className="clock-display" aria-label="Timer remaining time">{formatClockSeconds(remaining)}</output>
    {timer.completed && <p className="timer-complete" role="status">Time’s up!</p>}
    <div className="time-inputs">
      {[{ key: "hours", label: "Hours", value: Math.floor(timer.remainingSeconds / 3600), max: 99 }, { key: "minutes", label: "Minutes", value: Math.floor(timer.remainingSeconds % 3600 / 60), max: 59 }, { key: "seconds", label: "Seconds", value: timer.remainingSeconds % 60, max: 59 }].map((item) => <label key={item.key}>{item.label}<input type="number" min="0" max={item.max} disabled={timer.isRunning} value={item.value} onChange={(event) => setPart(item.key as "hours" | "minutes" | "seconds", Math.max(0, Math.min(item.max, Number(event.target.value))))} /></label>)}
    </div>
    <div className="preset-row" aria-label="Timer presets">{[5, 10, 15, 30, 60].map((minutes) => <button type="button" key={minutes} disabled={timer.isRunning} onClick={() => setDuration(minutes * 60)}>{minutes}m</button>)}</div>
    <div className="tool-actions"><button className="button button-primary" type="button" disabled={remaining === 0 && !timer.isRunning} onClick={toggle}>{timer.isRunning ? "Pause" : remaining < timer.durationSeconds ? "Resume" : "Start"}</button><button className="button button-secondary" type="button" onClick={() => setDuration(timer.durationSeconds)}>Reset</button></div>
  </div>;
}
