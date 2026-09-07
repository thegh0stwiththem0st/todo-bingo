import { describe, expect, it } from "vitest";
import { calendarDayDifference, formatClockSeconds, formatComparedTime, formatDayDifference, getStopwatchElapsedMs, getTimerRemainingSeconds, zonedDateTimeToInstant } from "./timeTools";

describe("time tools", () => {
  it("derives stopwatch and countdown values from timestamps", () => {
    expect(getStopwatchElapsedMs(2_000, "2026-09-07T12:00:00.000Z", true, Date.parse("2026-09-07T12:00:03.500Z"))).toBe(5_500);
    expect(getTimerRemainingSeconds(60, "2026-09-07T12:01:00.000Z", true, Date.parse("2026-09-07T12:00:10.250Z"))).toBe(50);
    expect(formatClockSeconds(3661)).toBe("01:01:01");
  });

  it("counts calendar days without daylight-saving drift", () => {
    expect(calendarDayDifference("2026-03-09", new Date(2026, 2, 8, 23, 30))).toBe(1);
    expect(formatDayDifference(0)).toBe("Today!");
    expect(formatDayDifference(-3)).toBe("3 days ago");
  });

  it("converts a wall-clock time in an IANA zone to an instant", () => {
    const instant = zonedDateTimeToInstant("2026-01-15", "23:00", "America/New_York");
    expect(instant?.toISOString()).toBe("2026-01-16T04:00:00.000Z");
    expect(formatComparedTime(instant!, "2026-01-15", "Asia/Tokyo")).toMatch(/tomorrow/);
  });
});
