import { describe, expect, it } from "vitest";
import type { Metric, MetricResetFrequency } from "../types";
import { changeMetricValue, incrementMetric, resetMetricIfDue } from "./metrics";

function metric(resetFrequency: MetricResetFrequency, lastResetAt = "2026-09-09T12:00:00.000Z"): Metric {
  return { id: "metric-1", label: "Water", value: 5, resetFrequency, lastResetAt, createdAt: lastResetAt };
}

describe("metrics", () => {
  it("increments, decrements, and directly edits finite values", () => {
    expect(incrementMetric([metric("none")], "metric-1", 1)[0].value).toBe(6);
    expect(incrementMetric([metric("none")], "metric-1", -1)[0].value).toBe(4);
    expect(changeMetricValue([metric("none")], "metric-1", -12.5)[0].value).toBe(-12.5);
    expect(changeMetricValue([metric("none")], "metric-1", Number.NaN)[0].value).toBe(5);
  });

  it.each([
    ["daily", "2026-09-08T12:00:00", "2026-09-09T12:00:00"],
    ["weekly", "2026-09-06T12:00:00", "2026-09-07T12:00:00"],
    ["monthly", "2026-08-31T12:00:00", "2026-09-01T12:00:00"],
    ["yearly", "2025-12-31T12:00:00", "2026-01-01T12:00:00"],
  ] as const)("resets %s metrics in a new period", (frequency, before, after) => {
    expect(resetMetricIfDue(metric(frequency, new Date(before).toISOString()), new Date(after)).value).toBe(0);
  });

  it("does not reset Never metrics or reset twice in one period", () => {
    const never = metric("none");
    expect(resetMetricIfDue(never, new Date("2027-01-01"))).toBe(never);
    const current = metric("daily", "2026-09-09T08:00:00.000Z");
    expect(resetMetricIfDue(current, new Date("2026-09-09T20:00:00.000Z"))).toBe(current);
    const reset = resetMetricIfDue(current, new Date("2026-09-10T08:00:00.000Z"));
    expect(resetMetricIfDue(reset, new Date("2026-09-10T20:00:00.000Z"))).toBe(reset);
  });
});
