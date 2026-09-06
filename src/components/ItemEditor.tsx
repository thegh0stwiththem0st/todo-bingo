import { useState, type FormEvent } from "react";

export type EditableItem = {
  id: string;
  text: string;
  enabled: boolean;
};

type ItemEditorProps = {
  noun: "task" | "reward";
  items: EditableItem[];
  onAdd: (text: string) => void;
  onEdit: (id: string, text: string) => void;
  onDelete: (id: string) => void;
  onToggle: (id: string) => void;
};

export function ItemEditor({ noun, items, onAdd, onEdit, onDelete, onToggle }: ItemEditorProps) {
  const [draft, setDraft] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState("");

  function submit(event: FormEvent) {
    event.preventDefault();
    const text = draft.trim();
    if (!text) return;
    onAdd(text);
    setDraft("");
  }

  function saveEdit(id: string) {
    const text = editingText.trim();
    if (text) onEdit(id, text);
    setEditingId(null);
  }

  return (
    <>
      <form className="add-form" onSubmit={submit}>
        <label className="sr-only" htmlFor={`new-${noun}`}>New {noun}</label>
        <input
          id={`new-${noun}`}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder={noun === "task" ? "Add something to do…" : "Add something to look forward to…"}
        />
        <button className="button button-primary" type="submit">Add</button>
      </form>
      {items.length === 0 ? (
        <p className="empty-message">No {noun}s yet.</p>
      ) : (
        <ul className="item-list">
          {items.map((item) => (
            <li key={item.id} className={!item.enabled ? "is-disabled" : ""}>
              <input
                type="checkbox"
                checked={item.enabled}
                onChange={() => onToggle(item.id)}
                aria-label={`${item.enabled ? "Disable" : "Enable"} ${item.text}`}
              />
              {editingId === item.id ? (
                <form
                  className="inline-edit"
                  onSubmit={(event) => {
                    event.preventDefault();
                    saveEdit(item.id);
                  }}
                >
                  <input
                    autoFocus
                    value={editingText}
                    onChange={(event) => setEditingText(event.target.value)}
                    aria-label={`Edit ${noun}`}
                  />
                  <button className="text-button" type="submit">Save</button>
                  <button className="text-button" type="button" onClick={() => setEditingId(null)}>Cancel</button>
                </form>
              ) : (
                <>
                  <span className="item-text">{item.text}</span>
                  <button
                    className="icon-button"
                    type="button"
                    aria-label={`Edit ${item.text}`}
                    onClick={() => {
                      setEditingId(item.id);
                      setEditingText(item.text);
                    }}
                  >✎</button>
                  <button
                    className="icon-button danger"
                    type="button"
                    aria-label={`Delete ${item.text}`}
                    onClick={() => onDelete(item.id)}
                  >×</button>
                </>
              )}
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
