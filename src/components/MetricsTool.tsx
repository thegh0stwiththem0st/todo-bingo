import { useEffect, useState, type FormEvent, type KeyboardEvent } from "react";
import { createId } from "../lib/id";
import { changeMetricValue, incrementMetric, resetDueMetrics } from "../lib/metrics";
import type { Metric, MetricResetFrequency } from "../types";

const frequencyLabels: Record<MetricResetFrequency, string> = { none: "Never", daily: "Daily", weekly: "Weekly", monthly: "Monthly", yearly: "Yearly" };

function MetricValue({ metric, onChange }: { metric: Metric; onChange: (value: number) => void }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(metric.value));
  function save() { const value = Number(draft.trim()); if (draft.trim() && Number.isFinite(value)) { onChange(value); setEditing(false); } }
  function handleKey(event: KeyboardEvent<HTMLInputElement>) { if (event.key === "Enter") save(); if (event.key === "Escape") { setDraft(String(metric.value)); setEditing(false); } }
  if (editing) return <span className="metric-value-editor"><input autoFocus aria-label={`Value for ${metric.label}`} type="number" step="any" value={draft} onChange={(event) => setDraft(event.target.value)} onKeyDown={handleKey} /><button type="button" onClick={save}>Save</button></span>;
  return <button className="metric-value" type="button" aria-label={`Edit value for ${metric.label}, currently ${metric.value}`} onClick={() => { setDraft(String(metric.value)); setEditing(true); }}>{metric.value.toLocaleString()}</button>;
}

export function MetricsTool({ metrics, onChange }: { metrics: Metric[]; onChange: (metrics: Metric[]) => void }) {
  const [adding, setAdding] = useState(false); const [label, setLabel] = useState(""); const [startingValue, setStartingValue] = useState("0"); const [frequency, setFrequency] = useState<MetricResetFrequency>("none");
  const [editingId, setEditingId] = useState<string | null>(null);
  useEffect(() => { const reset = resetDueMetrics(metrics); if (reset !== metrics) onChange(reset); }, [metrics, onChange]);
  function addMetric(event: FormEvent) { event.preventDefault(); const value = Number(startingValue); if (!label.trim() || !Number.isFinite(value)) return; const now = new Date().toISOString(); onChange([...metrics, { id: createId("metric"), label: label.trim(), value, resetFrequency: frequency, createdAt: now, lastResetAt: now }]); setLabel(""); setStartingValue("0"); setFrequency("none"); setAdding(false); }
  return <div className="metrics-tool">
    <div className="metric-list">{metrics.map((metric) => <article className="metric-card" key={metric.id}>
      {editingId === metric.id ? <div className="metric-settings"><label>Name<input value={metric.label} onChange={(event) => onChange(metrics.map((item) => item.id === metric.id ? { ...item, label: event.target.value } : item))} /></label><label>Reset<select value={metric.resetFrequency} onChange={(event) => onChange(metrics.map((item) => item.id === metric.id ? { ...item, resetFrequency: event.target.value as MetricResetFrequency, lastResetAt: new Date().toISOString() } : item))}>{Object.entries(frequencyLabels).map(([value, text]) => <option key={value} value={value}>{text}</option>)}</select></label><button type="button" onClick={() => setEditingId(null)}>Done</button></div> : <div className="metric-card-heading"><span><strong>{metric.label}</strong><small>Reset: {frequencyLabels[metric.resetFrequency]}</small></span><button type="button" aria-label={`Edit ${metric.label}`} onClick={() => setEditingId(metric.id)}>Edit</button></div>}
      <div className="metric-counter"><button type="button" aria-label={`Decrease ${metric.label}`} onClick={() => onChange(incrementMetric(metrics, metric.id, -1))}>−</button><MetricValue metric={metric} onChange={(value) => onChange(changeMetricValue(metrics, metric.id, value))} /><button type="button" aria-label={`Increase ${metric.label}`} onClick={() => onChange(incrementMetric(metrics, metric.id, 1))}>+</button></div>
      <div className="metric-card-actions"><button type="button" onClick={() => { if (window.confirm(`Reset ${metric.label} to 0?`)) onChange(changeMetricValue(metrics, metric.id, 0)); }}>Reset to 0</button><button className="danger" type="button" onClick={() => onChange(metrics.filter((item) => item.id !== metric.id))}>Delete</button></div>
    </article>)}</div>
    {adding ? <form className="metric-add-form" onSubmit={addMetric}><label>Name<input value={label} onChange={(event) => setLabel(event.target.value)} placeholder="Glasses of water" /></label><label>Starting value<input type="number" step="any" value={startingValue} onChange={(event) => setStartingValue(event.target.value)} /></label><label>Reset<select value={frequency} onChange={(event) => setFrequency(event.target.value as MetricResetFrequency)}>{Object.entries(frequencyLabels).map(([value, text]) => <option key={value} value={value}>{text}</option>)}</select></label><div><button className="button button-primary" type="submit">Add metric</button><button className="button button-secondary" type="button" onClick={() => setAdding(false)}>Cancel</button></div></form> : <button className="button button-secondary metric-add-button" type="button" onClick={() => setAdding(true)}>+ Add metric</button>}
    {metrics.length === 0 && !adding && <p className="empty-copy">No metrics yet.</p>}
  </div>;
}
