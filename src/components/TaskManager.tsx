import { useState, type FormEvent } from "react";
import type { UserTask } from "../types";
import { ItemEditor } from "./ItemEditor";

type TaskManagerProps = {
  tasks: UserTask[];
  onAdd: (text: string) => void;
  onBulkAdd: (lines: string[]) => void;
  onEdit: (id: string, text: string) => void;
  onDelete: (id: string) => void;
  onToggle: (id: string) => void;
};

function cleanTaskLine(line: string): string {
  return line.replace(/^\s*(?:[-*•]|\d+[.)])\s*/, "").trim();
}

export function TaskManager({ tasks, onAdd, onBulkAdd, onEdit, onDelete, onToggle }: TaskManagerProps) {
  const [showBulk, setShowBulk] = useState(false);
  const [bulkText, setBulkText] = useState("");

  function submitBulk(event: FormEvent) {
    event.preventDefault();
    const lines = bulkText.split(/\r?\n/).map(cleanTaskLine).filter(Boolean);
    if (!lines.length) return;
    onBulkAdd(lines);
    setBulkText("");
    setShowBulk(false);
  }

  return (
    <section aria-labelledby="tasks-heading">
      <div className="panel-heading">
        <div>
          <h2 id="tasks-heading">Tasks</h2>
          <p>{tasks.filter((task) => task.active).length} active · {tasks.length} total</p>
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
          <button className="button button-primary" type="submit">Add tasks</button>
        </form>
      )}
      <ItemEditor
        noun="task"
        items={tasks.map((task) => ({ id: task.id, text: task.text, enabled: task.active }))}
        onAdd={onAdd}
        onEdit={onEdit}
        onDelete={onDelete}
        onToggle={onToggle}
      />
    </section>
  );
}
