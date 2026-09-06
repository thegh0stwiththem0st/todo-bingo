import type { FillerTask } from "../types";

type FillerManagerProps = {
  fillerTasks: FillerTask[];
  onToggle: (id: string) => void;
};

export function FillerManager({ fillerTasks, onToggle }: FillerManagerProps) {
  const categories = [...new Set(fillerTasks.map((task) => task.category))];
  return (
    <section aria-labelledby="fillers-heading">
      <div className="panel-heading">
        <div>
          <h2 id="fillers-heading">Friendly fillers</h2>
          <p>Used only when you have fewer than 25 active tasks.</p>
        </div>
      </div>
      <div className="filler-groups">
        {categories.map((category) => (
          <fieldset key={category}>
            <legend>{category}</legend>
            {fillerTasks.filter((task) => task.category === category).map((task) => (
              <label key={task.id} className="toggle-row">
                <input type="checkbox" checked={task.enabled} onChange={() => onToggle(task.id)} />
                <span>{task.text}</span>
              </label>
            ))}
          </fieldset>
        ))}
      </div>
    </section>
  );
}
