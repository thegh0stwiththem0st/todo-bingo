import { useEffect, useState } from "react";
import { formatClockSeconds, getStopwatchElapsedMs } from "../lib/timeTools";
import type { StopwatchState } from "../types";

export function StopwatchTool({ stopwatch, onChange }: { stopwatch: StopwatchState; onChange: (value: StopwatchState) => void }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    if (!stopwatch.isRunning) return;
    const interval = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(interval);
  }, [stopwatch.isRunning]);
  const elapsed = getStopwatchElapsedMs(stopwatch.elapsedMs, stopwatch.startedAt, stopwatch.isRunning, now);
  function toggle() {
    if (stopwatch.isRunning) onChange({ elapsedMs: elapsed, startedAt: null, isRunning: false });
    else onChange({ ...stopwatch, startedAt: new Date().toISOString(), isRunning: true });
  }
  return <div className="clock-tool">
    <output className="clock-display" aria-label="Stopwatch elapsed time">{formatClockSeconds(elapsed / 1000)}</output>
    <div className="tool-actions"><button className="button button-primary" type="button" onClick={toggle}>{stopwatch.isRunning ? "Pause" : elapsed > 0 ? "Resume" : "Start"}</button><button className="button button-secondary" type="button" onClick={() => onChange({ elapsedMs: 0, startedAt: null, isRunning: false })}>Reset</button></div>
  </div>;
}
