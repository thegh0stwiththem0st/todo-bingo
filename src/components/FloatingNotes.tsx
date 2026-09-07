import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import type { StickyNote } from "../types";

type FloatingNotesProps = {
  notes: StickyNote[];
  onChange: (notes: StickyNote[]) => void;
};

type Position = { x: number; y: number };

const NOTE_WIDTH = 250;
const NOTE_HEIGHT = 154;

function clampPosition(position: Position, width = NOTE_WIDTH, height = NOTE_HEIGHT): Position {
  return {
    x: Math.max(8, Math.min(position.x, window.innerWidth - width - 8)),
    y: Math.max(8, Math.min(position.y, window.innerHeight - height - 8)),
  };
}

function FloatingNote({ note, notes, onChange }: FloatingNotesProps & { note: StickyNote }) {
  const width = note.width ?? NOTE_WIDTH;
  const height = note.height ?? NOTE_HEIGHT;
  const initial = clampPosition({ x: note.x ?? 24, y: note.y ?? 110 }, width, height);
  const [position, setPosition] = useState(initial);
  const [dragging, setDragging] = useState(false);
  const dragOffset = useRef<Position>({ x: 0, y: 0 });

  useEffect(() => {
    if (!dragging) setPosition(clampPosition({ x: note.x ?? 24, y: note.y ?? 110 }, width, height));
  }, [dragging, note.x, note.y, width, height]);

  function savePosition(next: Position) {
    const clamped = clampPosition(next, width, height);
    setPosition(clamped);
    onChange(notes.map((item) => item.id === note.id ? { ...item, ...clamped } : item));
  }

  function startDrag(event: PointerEvent<HTMLButtonElement>) {
    event.currentTarget.setPointerCapture(event.pointerId);
    dragOffset.current = { x: event.clientX - position.x, y: event.clientY - position.y };
    setDragging(true);
  }

  function moveDrag(event: PointerEvent<HTMLButtonElement>) {
    if (!dragging) return;
    setPosition(clampPosition({
      x: event.clientX - dragOffset.current.x,
      y: event.clientY - dragOffset.current.y,
    }, width, height));
  }

  function endDrag(event: PointerEvent<HTMLButtonElement>) {
    if (!dragging) return;
    event.currentTarget.releasePointerCapture(event.pointerId);
    setDragging(false);
    savePosition(position);
  }

  function nudge(event: KeyboardEvent<HTMLButtonElement>) {
    const amount = event.shiftKey ? 25 : 10;
    const offsets: Partial<Record<string, Position>> = {
      ArrowLeft: { x: -amount, y: 0 },
      ArrowRight: { x: amount, y: 0 },
      ArrowUp: { x: 0, y: -amount },
      ArrowDown: { x: 0, y: amount },
    };
    const offset = offsets[event.key];
    if (!offset) return;
    event.preventDefault();
    savePosition({ x: position.x + offset.x, y: position.y + offset.y });
  }

  return (
    <article
      className={`floating-note ${dragging ? "is-dragging" : ""}`}
      style={{ left: position.x, top: position.y, width, height }}
    >
      <button
        className="note-drag-handle"
        type="button"
        aria-label="Drag sticky note; use arrow keys to move"
        onPointerDown={startDrag}
        onPointerMove={moveDrag}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onKeyDown={nudge}
      ><span aria-hidden="true">••••••</span></button>
      <textarea
        aria-label="Sticky note"
        value={note.text}
        onChange={(event) => onChange(notes.map((item) => item.id === note.id ? { ...item, text: event.target.value } : item))}
      />
      <button className="floating-note-delete" type="button" aria-label="Delete sticky note" onClick={() => onChange(notes.filter((item) => item.id !== note.id))}>×</button>
    </article>
  );
}

export function FloatingNotes({ notes, onChange }: FloatingNotesProps) {
  return (
    <div className="floating-notes-layer" aria-label="Floating sticky notes">
      {notes.map((note) => <FloatingNote key={note.id} note={note} notes={notes} onChange={onChange} />)}
    </div>
  );
}
