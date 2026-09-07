import { useState, type FormEvent } from "react";
import { createId } from "../lib/id";
import { calendarDayDifference, formatDayDifference } from "../lib/timeTools";
import type { DayCountdown } from "../types";

export function DaysUntilTool({ items, onChange }: { items: DayCountdown[]; onChange: (items: DayCountdown[]) => void }) {
  const [title, setTitle] = useState(""); const [date, setDate] = useState(""); const [editing, setEditing] = useState<string | null>(null);
  function submit(event: FormEvent) { event.preventDefault(); if (!title.trim() || !date) return; if (editing) onChange(items.map((item) => item.id === editing ? { ...item, title: title.trim(), targetDate: date } : item)); else onChange([...items, { id: createId("day"), title: title.trim(), targetDate: date }]); setTitle(""); setDate(""); setEditing(null); }
  return <div className="days-until-tool"><form onSubmit={submit}><label>Event<input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Vacation" /></label><label>Date<input type="date" value={date} onChange={(event) => setDate(event.target.value)} /></label><button className="button button-primary" type="submit">{editing ? "Save" : "Add"}</button>{editing && <button className="button button-secondary" type="button" onClick={() => { setEditing(null); setTitle(""); setDate(""); }}>Cancel</button>}</form><ul>{items.map((item) => { const days = calendarDayDifference(item.targetDate); return <li key={item.id}><span><strong>{item.title}</strong><small>{item.targetDate}</small></span><b>{days === null ? "Invalid date" : formatDayDifference(days)}</b><div><button type="button" onClick={() => { setEditing(item.id); setTitle(item.title); setDate(item.targetDate); }}>Edit</button><button type="button" onClick={() => onChange(items.filter((other) => other.id !== item.id))}>Delete</button></div></li>; })}</ul>{items.length === 0 && <p className="empty-copy">No dates saved yet.</p>}</div>;
}
