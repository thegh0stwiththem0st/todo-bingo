import { useState, type FormEvent } from "react";
import type { RewardTier } from "../types";

export type EditableItem = {
  id: string;
  text: string;
  enabled: boolean;
  tier?: RewardTier;
};

type ItemEditorProps = {
  noun: "task" | "reward";
  items: EditableItem[];
  onAdd: (text: string, tier?: RewardTier) => void;
  onEdit: (id: string, text: string) => void;
  onDelete: (id: string) => void;
  onToggle: (id: string) => void;
  onTierChange?: (id: string, tier: RewardTier) => void;
};

export function ItemEditor({ noun, items, onAdd, onEdit, onDelete, onToggle, onTierChange }: ItemEditorProps) {
  const [draft, setDraft] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState("");
  const [draftTier, setDraftTier] = useState<RewardTier>("medium");

  function submit(event: FormEvent) {
    event.preventDefault();
    const text = draft.trim();
    if (!text) return;
    onAdd(text, noun === "reward" ? draftTier : undefined);
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
        {noun === "reward" && (
          <select aria-label="New reward tier" value={draftTier} onChange={(event) => setDraftTier(event.target.value as RewardTier)}>
            <option value="small">Small</option>
            <option value="medium">Medium</option>
            <option value="big">Big</option>
          </select>
        )}
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
                  {item.tier && onTierChange && (
                    <select
                      className="item-tier"
                      aria-label={`Reward tier for ${item.text}`}
                      value={item.tier}
                      onChange={(event) => onTierChange(item.id, event.target.value as RewardTier)}
                    >
                      <option value="small">Small</option>
                      <option value="medium">Medium</option>
                      <option value="big">Big</option>
                    </select>
                  )}
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
