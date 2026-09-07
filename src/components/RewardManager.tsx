import type { Reward, RewardFiller, RewardTier } from "../types";
import { ItemEditor } from "./ItemEditor";

type RewardManagerProps = {
  rewards: Reward[];
  fillers: RewardFiller[];
  onAdd: (text: string, tier: RewardTier) => void;
  onEdit: (id: string, text: string) => void;
  onDelete: (id: string) => void;
  onToggle: (id: string) => void;
  onTierChange: (id: string, tier: RewardTier) => void;
  onFillerToggle: (id: string) => void;
  onFillersEnabled: (enabled: boolean) => void;
  onFillersReset: () => void;
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
      <h3 className="subsection-heading">Your rewards</h3>
      <ItemEditor
        noun="reward"
        items={props.rewards.map((reward) => ({
          id: reward.id,
          text: reward.text,
          enabled: reward.enabled,
          tier: reward.tier,
        }))}
        onAdd={(text, tier) => props.onAdd(text, tier ?? "medium")}
        onEdit={props.onEdit}
        onDelete={props.onDelete}
        onToggle={props.onToggle}
        onTierChange={props.onTierChange}
      />
      <div className="reward-filler-heading">
        <div><h3>Built-in reward ideas</h3><p>These are separate from your rewards. Spending ideas start disabled.</p></div>
        <div className="compact-actions"><button type="button" onClick={() => props.onFillersEnabled(true)}>Enable all</button><button type="button" onClick={() => props.onFillersEnabled(false)}>Disable all</button><button type="button" onClick={props.onFillersReset}>Reset defaults</button></div>
      </div>
      <div className="reward-filler-groups">
        {[...new Set(props.fillers.map((reward) => reward.category))].map((category) => <section key={category}><h4>{category}</h4><ul className="reward-filler-list">{props.fillers.filter((reward) => reward.category === category).map((reward) => <li key={reward.id}><label><input type="checkbox" checked={reward.enabled} onChange={() => props.onFillerToggle(reward.id)} /><span>{reward.text}<small>{reward.size}{reward.involvesSpending ? " · involves spending" : ""}</small></span></label></li>)}</ul></section>)}
      </div>
    </section>
  );
}
