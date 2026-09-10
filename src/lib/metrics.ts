import type { Metric, MetricResetFrequency } from "../types";

function localDateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function metricPeriodKey(frequency: MetricResetFrequency, date: Date) {
  if (frequency === "none") return "none";
  if (frequency === "daily") return localDateKey(date);
  if (frequency === "monthly") return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
  if (frequency === "yearly") return String(date.getFullYear());
  const monday = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const daysSinceMonday = (monday.getDay() + 6) % 7;
  monday.setDate(monday.getDate() - daysSinceMonday);
  return localDateKey(monday);
}

export function resetMetricIfDue(metric: Metric, now = new Date()): Metric {
  if (metric.resetFrequency === "none") return metric;
  const previous = new Date(metric.lastResetAt || metric.createdAt);
  if (!Number.isFinite(previous.getTime()) || metricPeriodKey(metric.resetFrequency, previous) !== metricPeriodKey(metric.resetFrequency, now)) {
    return { ...metric, value: 0, lastResetAt: now.toISOString() };
  }
  return metric;
}

export function resetDueMetrics(metrics: Metric[], now = new Date()) {
  let changed = false;
  const result = metrics.map((metric) => {
    const reset = resetMetricIfDue(metric, now);
    if (reset !== metric) changed = true;
    return reset;
  });
  return changed ? result : metrics;
}

export function changeMetricValue(metrics: Metric[], id: string, value: number) {
  if (!Number.isFinite(value)) return metrics;
  return metrics.map((metric) => metric.id === id ? { ...metric, value } : metric);
}

export function incrementMetric(metrics: Metric[], id: string, amount: number) {
  if (!Number.isFinite(amount)) return metrics;
  return metrics.map((metric) => metric.id === id ? { ...metric, value: metric.value + amount } : metric);
}
