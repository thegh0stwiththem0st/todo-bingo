import type { Reward } from "../types";
import { ItemEditor } from "./ItemEditor";

type RewardManagerProps = {
  rewards: Reward[];
  onAdd: (text: string) => void;
  onEdit: (id: string, text: string) => void;
  onDelete: (id: string) => void;
  onToggle: (id: string) => void;
};

export function RewardManager(props: RewardManagerProps) {
  return (
    <section aria-labelledby="rewards-heading">
      <div className="panel-heading">
        <div>
          <h2 id="rewards-heading">Rewards</h2>
          <p>An enabled reward is chosen when you complete your target.</p>
        </div>
      </div>
      <ItemEditor
        noun="reward"
        items={props.rewards.map((reward) => ({
          id: reward.id,
          text: reward.text,
          enabled: reward.enabled,
        }))}
        onAdd={props.onAdd}
        onEdit={props.onEdit}
        onDelete={props.onDelete}
        onToggle={props.onToggle}
      />
    </section>
  );
}
