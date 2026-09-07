import { useState, type FormEvent } from "react";
import type { TaskKind, UserTask } from "../types";
import { ItemEditor } from "./ItemEditor";

type TaskManagerProps = {
  tasks: UserTask[];
  onAdd: (text: string, kind: TaskKind) => void;
  onBulkAdd: (lines: string[], kind: TaskKind) => void;
  onEdit: (id: string, text: string) => void;
  onDelete: (id: string) => void;
  onToggle: (id: string) => void;
  onKindChange: (id: string, kind: TaskKind) => void;
};

function cleanTaskLine(line: string): string {
  return line.replace(/^\s*(?:[-*•]|\d+[.)])\s*/, "").trim();
}

export function TaskManager({ tasks, onAdd, onBulkAdd, onEdit, onDelete, onToggle, onKindChange }: TaskManagerProps) {
  const [showBulk, setShowBulk] = useState(false);
  const [bulkText, setBulkText] = useState("");
  const [bulkKind, setBulkKind] = useState<TaskKind>("one-time");

  function submitBulk(event: FormEvent) {
    event.preventDefault();
    const lines = bulkText.split(/\r?\n/).map(cleanTaskLine).filter(Boolean);
    if (!lines.length) return;
    onBulkAdd(lines, bulkKind);
    setBulkText("");
    setShowBulk(false);
  }

  return (
    <section aria-labelledby="tasks-heading">
      <div className="panel-heading">
        <div>
          <h2 id="tasks-heading">Tasks</h2>
          <p>{tasks.filter((task) => task.active).length} active · {tasks.length} total · One-time tasks retire after a won session.</p>
        </div>
        <button className="text-button" type="button" onClick={() => setShowBulk((value) => !value)}>
          {showBulk ? "Hide bulk paste" : "Bulk paste"}
        </button>
      </div>
      {showBulk && (
        <form className="bulk-form" onSubmit={submitBulk}>
          <label htmlFor="bulk-tasks">One task per line</label>
          <textarea
            id="bulk-tasks"
            rows={5}
            value={bulkText}
            onChange={(event) => setBulkText(event.target.value)}
            placeholder={"Reply to email\nWash dishes\nCall dentist"}
          />
          <label className="repeatable-check bulk-repeatable">
            <input
              type="checkbox"
              checked={bulkKind === "repeatable"}
              onChange={(event) => setBulkKind(event.target.checked ? "repeatable" : "one-time")}
            />
            <span>Make all repeatable</span>
          </label>
          <button className="button button-primary" type="submit">Add tasks</button>
        </form>
      )}
      <ItemEditor
        noun="task"
        items={tasks.map((task) => ({ id: task.id, text: task.text, enabled: task.active, taskKind: task.kind }))}
        onAdd={(text, _tier, kind) => onAdd(text, kind ?? "one-time")}
        onEdit={onEdit}
        onDelete={onDelete}
        onToggle={onToggle}
        onTaskKindChange={onKindChange}
      />
    </section>
  );
}
