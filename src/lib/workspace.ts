import type { HolidayId, WorkspaceState } from "../types";

export const toolIds = ["pomodoro", "stopwatch", "timer", "time-zones", "days-until", "metrics", "notes", "case-converter", "sounds", "developer"] as const;

export function createInitialWorkspace(): WorkspaceState {
  return {
    drawerOpen: false,
    activeTool: "pomodoro",
    pinnedTools: [],
    floatingTools: {},
    notes: [],
    pomodoro: {
      phase: "focus",
      focusMinutes: 25,
      breakMinutes: 5,
      remainingSeconds: 25 * 60,
      endsAt: null,
      isRunning: false,
    },
    stopwatch: { elapsedMs: 0, startedAt: null, isRunning: false },
    timer: { durationSeconds: 600, remainingSeconds: 600, endsAt: null, isRunning: false, completed: false },
    timeZones: [
      { id: "zone-new-york", label: "New York", timeZone: "America/New_York" },
      { id: "zone-los-angeles", label: "Los Angeles", timeZone: "America/Los_Angeles" },
      { id: "zone-london", label: "London", timeZone: "Europe/London" },
    ],
    timeZoneSource: "America/New_York",
    comparisonDate: new Date().toISOString().slice(0, 10),
    comparisonTime: "15:00",
    dayCountdowns: [],
    metrics: [],
    sound: { selected: "rain", volume: 35 },
  };
}

export type HolidayTakeover = {
  id: HolidayId;
  label: string;
};

const holidayLabels: Record<HolidayId, string> = {
  "new-year": "New Year",
  valentine: "Valentine's Day",
  pride: "Pride Month",
  halloween: "Halloween",
  winter: "Winter holidays",
};

export function getHolidayTakeover(date = new Date(), preview: HolidayId | null = null): HolidayTakeover | null {
  if (preview) return { id: preview, label: holidayLabels[preview] };
  const month = date.getMonth() + 1;
  const day = date.getDate();
  let id: HolidayId | null = null;
  if (month === 1 && day === 1) id = "new-year";
  else if (month === 2 && day === 14) id = "valentine";
  else if (month === 6) id = "pride";
  else if (month === 10 && day === 31) id = "halloween";
  else if (month === 12 || (month === 1 && day <= 5)) id = "winter";
  return id ? { id, label: holidayLabels[id] } : null;
}

export function getPomodoroSeconds(workspace: WorkspaceState, now = Date.now()): number {
  const timer = workspace.pomodoro;
  if (!timer.isRunning || !timer.endsAt) return timer.remainingSeconds;
  return Math.max(0, Math.ceil((new Date(timer.endsAt).getTime() - now) / 1000));
}
