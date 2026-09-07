export const timeZoneOptions = [
  ["Honolulu", "Pacific/Honolulu"], ["Anchorage", "America/Anchorage"],
  ["Los Angeles", "America/Los_Angeles"], ["Denver", "America/Denver"],
  ["Chicago", "America/Chicago"], ["New York", "America/New_York"],
  ["Toronto", "America/Toronto"], ["Mexico City", "America/Mexico_City"],
  ["São Paulo", "America/Sao_Paulo"], ["UTC", "UTC"], ["London", "Europe/London"],
  ["Paris", "Europe/Paris"], ["Berlin", "Europe/Berlin"], ["Cairo", "Africa/Cairo"],
  ["Johannesburg", "Africa/Johannesburg"], ["Dubai", "Asia/Dubai"],
  ["Delhi", "Asia/Kolkata"], ["Singapore", "Asia/Singapore"], ["Tokyo", "Asia/Tokyo"],
  ["Seoul", "Asia/Seoul"], ["Sydney", "Australia/Sydney"], ["Auckland", "Pacific/Auckland"],
] as const;

export function getStopwatchElapsedMs(elapsedMs: number, startedAt: string | null, isRunning: boolean, now = Date.now()) {
  if (!isRunning || !startedAt) return elapsedMs;
  return elapsedMs + Math.max(0, now - new Date(startedAt).getTime());
}

export function getTimerRemainingSeconds(remainingSeconds: number, endsAt: string | null, isRunning: boolean, now = Date.now()) {
  if (!isRunning || !endsAt) return remainingSeconds;
  return Math.max(0, Math.ceil((new Date(endsAt).getTime() - now) / 1000));
}

export function formatClockSeconds(totalSeconds: number) {
  const seconds = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return [hours, minutes, seconds % 60].map((part) => String(part).padStart(2, "0")).join(":");
}

function parseDateKey(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  const [year, month, day] = match.slice(1).map(Number);
  const timestamp = Date.UTC(year, month - 1, day);
  const date = new Date(timestamp);
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day ? timestamp : null;
}

export function calendarDayDifference(targetDate: string, today = new Date()) {
  const target = parseDateKey(targetDate);
  if (target === null) return null;
  const current = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
  return Math.round((target - current) / 86_400_000);
}

export function formatDayDifference(days: number) {
  if (days === 0) return "Today!";
  if (days === 1) return "Tomorrow";
  if (days === -1) return "Yesterday";
  return days > 1 ? `${days} days` : `${Math.abs(days)} days ago`;
}

function zoneParts(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23",
  }).formatToParts(date);
  const get = (type: Intl.DateTimeFormatPartTypes) => Number(parts.find((part) => part.type === type)?.value);
  return { year: get("year"), month: get("month"), day: get("day"), hour: get("hour"), minute: get("minute"), second: get("second") };
}

export function zonedDateTimeToInstant(dateKey: string, time: string, timeZone: string) {
  const dateMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateKey);
  const timeMatch = /^(\d{2}):(\d{2})$/.exec(time);
  if (!dateMatch || !timeMatch) return null;
  const desired = Date.UTC(+dateMatch[1], +dateMatch[2] - 1, +dateMatch[3], +timeMatch[1], +timeMatch[2]);
  let guess = desired;
  try {
    for (let index = 0; index < 3; index += 1) {
      const parts = zoneParts(new Date(guess), timeZone);
      const shown = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second);
      guess += desired - shown;
    }
    return new Date(guess);
  } catch { return null; }
}

export function getZonedDateKey(date: Date, timeZone: string) {
  const parts = zoneParts(date, timeZone);
  return `${parts.year}-${String(parts.month).padStart(2, "0")}-${String(parts.day).padStart(2, "0")}`;
}

export function formatTimeInZone(date: Date, timeZone: string) {
  return new Intl.DateTimeFormat(undefined, { timeZone, hour: "numeric", minute: "2-digit", timeZoneName: "short" }).format(date);
}

export function formatComparedTime(date: Date, sourceDate: string, targetZone: string) {
  const targetDate = getZonedDateKey(date, targetZone);
  const dayDelta = (parseDateKey(targetDate)! - parseDateKey(sourceDate)!) / 86_400_000;
  const suffix = dayDelta === 1 ? " · tomorrow" : dayDelta === -1 ? " · yesterday" : dayDelta !== 0 ? ` · ${Math.abs(dayDelta)} days ${dayDelta > 0 ? "later" : "earlier"}` : "";
  return `${formatTimeInZone(date, targetZone)}${suffix}`;
}
