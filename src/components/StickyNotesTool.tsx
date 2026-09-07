import { useState, type FormEvent } from "react";
import { createId } from "../lib/id";
import type { StickyNote } from "../types";

type StickyNotesToolProps = {
  notes: StickyNote[];
  pinned?: boolean;
  onChange: (notes: StickyNote[]) => void;
};

export function StickyNotesTool({ notes, pinned = false, onChange }: StickyNotesToolProps) {
  const [draft, setDraft] = useState("");

  function addNote(event: FormEvent) {
    event.preventDefault();
    const text = draft.trim();
    if (!text) return;
    const offset = (notes.length % 6) * 18;
    onChange([...notes, {
      id: createId("note"),
      text,
      createdAt: new Date().toISOString(),
      x: Math.min(24 + offset, Math.max(12, window.innerWidth - 270)),
      y: 110 + offset,
      width: 240,
      height: 240,
    }]);
    setDraft("");
  }

  return (
    <div className="sticky-notes-tool">
      <form className="note-add" onSubmit={addNote}>
        <label className="sr-only" htmlFor="new-sticky-note">New sticky note</label>
        <textarea id="new-sticky-note" rows={2} value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Jot something down…" />
        <button className="button button-primary" type="submit">Add note</button>
      </form>
      <p className="note-summary">
        {notes.length === 0
          ? "No notes yet. Notes stay here until Sticky Notes is pinned."
          : pinned ? `${notes.length} note${notes.length === 1 ? " is" : "s are"} floating over the workspace.` : `${notes.length} note${notes.length === 1 ? "" : "s"} saved in the toolbox.`}
      </p>
      {notes.length > 0 && <ul className="toolbox-note-list">{notes.map((note) => <li key={note.id}><textarea aria-label="Sticky note text" rows={3} value={note.text} onChange={(event) => onChange(notes.map((item) => item.id === note.id ? { ...item, text: event.target.value } : item))} /><button className="icon-button danger" type="button" aria-label="Delete sticky note" onClick={() => onChange(notes.filter((item) => item.id !== note.id))}>×</button></li>)}</ul>}
    </div>
  );
}
