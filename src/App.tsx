import { useEffect, useMemo, useRef, useState } from "react";
import { BingoCelebration, type CelebrationKind } from "./components/BingoCelebration";
import { BingoBoard } from "./components/BingoBoard";
import { AppearanceManager } from "./components/AppearanceManager";
import { DataManager } from "./components/DataManager";
import { FillerManager } from "./components/FillerManager";
import { FloatingNotes } from "./components/FloatingNotes";
import { ModeSelector } from "./components/ModeSelector";
import { RewardManager } from "./components/RewardManager";
import { TaskManager } from "./components/TaskManager";
import { FloatingTools, ToolDrawer } from "./components/Workspace";
import { generateBoard } from "./lib/board";
import { defaultRewardFillers } from "./data/rewardFillers";
import { evaluateAchievements, type AchievementDefinition } from "./lib/achievements";
import { createId } from "./lib/id";
import { detectTargetPatterns, getTargetPattern, pickRandomTarget } from "./lib/patterns";
import { normalizeStreak, recordBingoDay, recordBingoStats } from "./lib/progress";
import { getNextQuestTarget, pickQuestStart } from "./lib/quest";
import { rewardFillerToSelectable, selectReward } from "./lib/rewards";
import { loadState, saveState } from "./lib/storage";
import { retireCompletedOneTimeTasks } from "./lib/tasks";
import { getHolidayTakeover } from "./lib/workspace";
import type { AppState, BingoMode, PatternId, Reward, TaskKind, UserTask, WorkspaceState } from "./types";

type Panel = "tasks" | "rewards" | "fillers" | "appearance" | "data";

export default function App() {
  const [state, setState] = useState<AppState>(() => {
    const loaded = loadState();
    return { ...loaded, streak: normalizeStreak(loaded.streak) };
  });
  const [activePanel, setActivePanel] = useState<Panel>("tasks");
  const [message, setMessage] = useState("");
  const [achievementToast, setAchievementToast] = useState<{
    achievement: AchievementDefinition;
    additional: number;
  } | null>(null);
  const [selectedMode, setSelectedMode] = useState<BingoMode>(state.board?.mode ?? "choose");
  const [selectedTarget, setSelectedTarget] = useState<PatternId>(state.board?.targetPattern ?? "standard-line");
  const initialCompletionKey = state.board?.targetCompleted
    ? `${state.board.id}:${state.board.targetPattern}:${state.board.quest?.history.length ?? 0}`
    : null;
  const celebratedCompletions = useRef(new Set(initialCompletionKey ? [initialCompletionKey] : []));
  const [celebration, setCelebration] = useState<{ key: string; kind: CelebrationKind } | null>(null);

  useEffect(() => {
    saveState(state);
  }, [state]);

  useEffect(() => {
    document.documentElement.dataset.theme = state.settings.selectedTheme;
  }, [state.settings.selectedTheme]);

  useEffect(() => {
    function applyHoliday() {
      const holiday = getHolidayTakeover(new Date());
      if (holiday) document.documentElement.dataset.holiday = holiday.id;
      else delete document.documentElement.dataset.holiday;
    }
    applyHoliday();
    const interval = window.setInterval(applyHoliday, 15 * 60 * 1000);
    return () => window.clearInterval(interval);
  }, []);

  const completionKey = state.board?.targetCompleted
    ? `${state.board.id}:${state.board.targetPattern}:${state.board.quest?.history.length ?? 0}`
    : null;

  useEffect(() => {
    if (!completionKey || celebratedCompletions.current.has(completionKey)) return;
    celebratedCompletions.current.add(completionKey);
    const holiday = getHolidayTakeover(new Date());
    setCelebration({ key: completionKey, kind: holiday?.id ?? "confetti" });
  }, [completionKey]);

  useEffect(() => {
    if (!celebration) return;
    const timeout = window.setTimeout(() => setCelebration(null), 5200);
    return () => window.clearTimeout(timeout);
  }, [celebration]);

  useEffect(() => {
    const result = evaluateAchievements(state);
    if (result.newlyUnlocked.length === 0) return;
    setState((current) => ({
      ...current,
      achievements: result.achievements,
      unlocks: result.unlocks,
    }));
    setAchievementToast({
      achievement: result.newlyUnlocked[0],
      additional: result.newlyUnlocked.length - 1,
    });
  }, [state.stats, state.streak]);

  useEffect(() => {
    if (!achievementToast) return;
    const timeout = window.setTimeout(() => setAchievementToast(null), 6000);
    return () => window.clearTimeout(timeout);
  }, [achievementToast]);

  const completedCount = state.board?.squares.filter((square) => square.completed).length ?? 0;
  const visibleStreak = normalizeStreak(state.streak);
  const currentTarget = state.board ? getTargetPattern(state.board.targetPattern) : null;
  const completedVariantLabels = useMemo(() => {
    if (!state.board) return [];
    const target = getTargetPattern(state.board.targetPattern);
    return target.variants
      .filter((variant) => state.board?.completedPatterns.includes(variant.id))
      .map((variant) => variant.label);
  }, [state.board]);

  function updateTasks(updater: (tasks: UserTask[]) => UserTask[]) {
    setState((current) => ({ ...current, tasks: updater(current.tasks) }));
  }

  function addTask(text: string, kind: TaskKind) {
    const task: UserTask = { id: createId("task"), text, kind, active: true, createdAt: new Date().toISOString() };
    updateTasks((tasks) => [...tasks, task]);
  }

  function addTasks(lines: string[], kind: TaskKind) {
    const createdAt = new Date().toISOString();
    updateTasks((tasks) => [
      ...tasks,
      ...lines.map((text) => ({ id: createId("task"), text, kind, active: true, createdAt })),
    ]);
  }

  function updateRewards(updater: (rewards: Reward[]) => Reward[]) {
    setState((current) => ({ ...current, rewards: updater(current.rewards) }));
  }

  function updateWorkspace(workspace: WorkspaceState) {
    setState((current) => ({ ...current, workspace }));
  }

  function makeBoard() {
    if (state.board && completedCount > 0 && !window.confirm("Replace this in-progress board? Your marks will be lost.")) return;
    try {
      const targetPattern = selectedMode === "random"
        ? pickRandomTarget()
        : selectedMode === "quest" ? pickQuestStart() : selectedTarget;
      const board = generateBoard(state.tasks, state.fillerTasks, { mode: selectedMode, targetPattern });
      const activeTaskCount = state.tasks.filter((task) => task.active).length;
      setState((current) => ({ ...current, board }));
      const challenge = selectedMode === "quest" ? `Quest level 1: ${getTargetPattern(targetPattern).label}` : `Today's challenge: ${getTargetPattern(targetPattern).label}`;
      setMessage(activeTaskCount > 25
        ? `${challenge}. 25 of your ${activeTaskCount} active tasks were chosen; the rest remain in your pool.`
        : `${challenge}. Pick a square and get rolling!`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not make a board.");
    }
  }

  function toggleSquare(index: number) {
    setState((current) => {
      if (!current.board) return current;
      const squares = current.board.squares.map((square, squareIndex) =>
        squareIndex === index
          ? { ...square, completed: !square.completed, countedComplete: square.countedComplete || !square.completed }
          : square,
      );
      const toggledSquare = current.board.squares[index];
      let stats = current.stats;
      if (!toggledSquare.completed && !toggledSquare.countedComplete) {
        stats = { ...stats, completedSquares: stats.completedSquares + 1 };
      }
      const completedIndexes = squares.flatMap((square, squareIndex) => square.completed ? [squareIndex] : []);
      const completedPatterns = detectTargetPatterns(completedIndexes, current.board.targetPattern).map((pattern) => pattern.id);
      const targetCompleted = completedPatterns.length > 0;
      const firstBoardCompletion = targetCompleted && !current.board.completionRecorded;
      let awardedReward = current.board.awardedReward;
      if (targetCompleted && !current.board.targetCompleted && !awardedReward) {
        const reward = selectReward([...current.rewards, ...current.rewardFillers.map(rewardFillerToSelectable)], current.board.targetPattern);
        awardedReward = reward ? { id: reward.id, text: reward.text, tier: reward.tier } : null;
      }
      let streak = current.streak;
      let quest = current.board.quest;
      if (firstBoardCompletion) {
        stats = recordBingoStats(stats, current.board.targetPattern);
        streak = recordBingoDay(streak);
        if (quest) {
          const nextTarget = getNextQuestTarget(current.board.targetPattern, completedPatterns);
          quest = {
            history: [...quest.history, {
              targetPattern: current.board.targetPattern,
              completedVariants: completedPatterns,
              completedAt: new Date().toISOString(),
              awardedReward,
            }],
            completed: nextTarget === null,
          };
        }
      }
      const sessionComplete = targetCompleted && (quest === null || quest.completed);
      const tasks = sessionComplete ? retireCompletedOneTimeTasks(current.tasks, squares) : current.tasks;
      return {
        ...current,
        tasks,
        stats,
        streak,
        board: {
          ...current.board,
          squares,
          completedPatterns,
          targetCompleted,
          completionRecorded: current.board.completionRecorded || firstBoardCompletion,
          awardedReward,
          quest,
        },
      };
    });
  }

  function advanceQuest() {
    setState((current) => {
      const board = current.board;
      if (!board?.quest || board.quest.completed || !board.completionRecorded) return current;
      const completedStage = board.quest.history[board.quest.history.length - 1];
      const nextTarget = getNextQuestTarget(board.targetPattern, completedStage?.completedVariants ?? []);
      if (!nextTarget) return current;
      setMessage(`Quest level ${board.quest.history.length + 1}: ${getTargetPattern(nextTarget).label}. Your completed squares carry forward.`);
      return {
        ...current,
        board: {
          ...board,
          targetPattern: nextTarget,
          completedPatterns: [],
          targetCompleted: false,
          completionRecorded: false,
          awardedReward: null,
        },
      };
    });
  }

  function importState(imported: AppState) {
    const normalized = { ...imported, streak: normalizeStreak(imported.streak) };
    setState(normalized);
    setSelectedMode(normalized.board?.mode ?? "choose");
    setSelectedTarget(normalized.board?.targetPattern ?? "standard-line");
    setMessage("Backup restored. Your imported board and progress are ready.");
  }

  return (
    <div className="app-shell">
      <header className="site-header">
        <div>
          <p className="eyebrow">Make progress, five squares at a time</p>
          <h1>Productivity Bingo</h1>
        </div>
        <div className="header-actions">
          <span className="streak-badge" aria-label={`${visibleStreak.current} day streak`}>🔥 {visibleStreak.current} day streak</span>
          <button
            className="button button-secondary tools-button"
            type="button"
            aria-expanded={state.workspace.drawerOpen}
            onClick={() => updateWorkspace({ ...state.workspace, drawerOpen: !state.workspace.drawerOpen })}
          >
            Tools{state.workspace.pinnedTools.length > 0 ? ` (${state.workspace.pinnedTools.length})` : ""}
          </button>
          <button className="button button-primary new-board-button" type="button" onClick={makeBoard}>
            {state.board ? "New board" : "Make my board"}
          </button>
        </div>
      </header>

      <main>
        <section className="game-area" aria-labelledby="game-heading">
          <div className="game-status">
            <div>
              <p className="status-label" id="game-heading">Current goal</p>
              <p className="status-value">
                {currentTarget ? currentTarget.label : selectedMode === "random" ? "A surprise pattern" : selectedMode === "quest" ? "A multi-level quest" : getTargetPattern(selectedTarget).label}
              </p>
              <p className="status-description">
                {currentTarget ? currentTarget.description : selectedMode === "random" ? "Your target will be revealed with the board." : selectedMode === "quest" ? "Build through connected targets and finish with Blackout." : getTargetPattern(selectedTarget).description}
              </p>
            </div>
            {state.board && <span className="progress-pill">{completedCount}/25 complete</span>}
          </div>

          {state.board?.targetCompleted && (
            <div className="bingo-alert" role="status">
              <span aria-hidden="true">★</span>
              <div>
                <strong>Bingo! {currentTarget?.label} complete.</strong>
                {completedVariantLabels.length > 1 && <><br />{completedVariantLabels.join(" · ")}</>}
                <br />
                {state.board.awardedReward
                  ? <>Your {state.board.awardedReward.tier} reward: <strong>{state.board.awardedReward.text}</strong></>
                  : "No rewards enabled yet! Add one for your next board."}
                {state.board.quest && !state.board.quest.completed && state.board.completionRecorded && (
                  <button className="button quest-next-button" type="button" onClick={advanceQuest}>Continue quest</button>
                )}
                {state.board.quest?.completed && <span className="quest-complete-copy">Quest complete — Blackout conquered!</span>}
              </div>
            </div>
          )}
          {state.board?.quest && (
            <div className="quest-progress" aria-label="Quest progress">
              <strong>{state.board.quest.completed ? "Quest complete" : `Quest level ${Math.max(1, state.board.quest.history.length + (state.board.completionRecorded ? 0 : 1))}`}</strong>
              {state.board.quest.history.length > 0 && (
                <span>{state.board.quest.history.map((stage) => getTargetPattern(stage.targetPattern).label).join(" → ")}</span>
              )}
              <div className="quest-rewards">
                {state.board.quest.history.map((stage, index) => (
                  <span key={`${stage.targetPattern}-${stage.completedAt}`}>Level {index + 1}: {stage.awardedReward?.text ?? "No reward"}</span>
                ))}
              </div>
            </div>
          )}
          {message && <p className="notice" role="status">{message}</p>}
          <BingoBoard
            board={state.board}
            onToggleSquare={toggleSquare}
            dauber={state.settings.selectedDauber}
          />
        </section>

        <section className="manage-area" aria-label="Manage bingo content">
          <div className="mode-config">
            <h2>Game mode</h2>
            <ModeSelector
              mode={selectedMode}
              target={selectedTarget}
              onModeChange={setSelectedMode}
              onTargetChange={setSelectedTarget}
            />
            {state.board && <p className="next-board-note">Changes apply to your next board.</p>}
          </div>
          <nav className="panel-tabs" aria-label="Content managers">
            {(["tasks", "rewards", "fillers", "appearance", "data"] as Panel[]).map((panel) => (
              <button
                type="button"
                key={panel}
                className={activePanel === panel ? "is-active" : ""}
                aria-pressed={activePanel === panel}
                onClick={() => setActivePanel(panel)}
              >
                {panel === "appearance" ? "Look" : panel[0].toUpperCase() + panel.slice(1)}
              </button>
            ))}
          </nav>
          <div className="panel-content">
            {activePanel === "tasks" && (
              <TaskManager
                tasks={state.tasks}
                onAdd={addTask}
                onBulkAdd={addTasks}
                onEdit={(id, text) => updateTasks((tasks) => tasks.map((task) => task.id === id ? { ...task, text } : task))}
                onDelete={(id) => updateTasks((tasks) => tasks.filter((task) => task.id !== id))}
                onToggle={(id) => updateTasks((tasks) => tasks.map((task) => task.id === id ? { ...task, active: !task.active } : task))}
                onKindChange={(id, kind) => updateTasks((tasks) => tasks.map((task) => task.id === id ? { ...task, kind } : task))}
              />
            )}
            {activePanel === "rewards" && (
              <RewardManager
                rewards={state.rewards}
                fillers={state.rewardFillers}
                onAdd={(text, tier) => updateRewards((rewards) => [...rewards, { id: createId("reward"), text, tier, enabled: true, createdAt: new Date().toISOString() }])}
                onEdit={(id, text) => updateRewards((rewards) => rewards.map((reward) => reward.id === id ? { ...reward, text } : reward))}
                onDelete={(id) => updateRewards((rewards) => rewards.filter((reward) => reward.id !== id))}
                onToggle={(id) => updateRewards((rewards) => rewards.map((reward) => reward.id === id ? { ...reward, enabled: !reward.enabled } : reward))}
                onTierChange={(id, tier) => updateRewards((rewards) => rewards.map((reward) => reward.id === id ? { ...reward, tier } : reward))}
                onFillerToggle={(id) => setState((current) => ({ ...current, rewardFillers: current.rewardFillers.map((reward) => reward.id === id ? { ...reward, enabled: !reward.enabled } : reward) }))}
                onFillersEnabled={(enabled) => setState((current) => ({ ...current, rewardFillers: current.rewardFillers.map((reward) => ({ ...reward, enabled })) }))}
                onFillersReset={() => setState((current) => ({ ...current, rewardFillers: defaultRewardFillers.map((reward) => ({ ...reward })) }))}
              />
            )}
            {activePanel === "fillers" && (
              <FillerManager
                fillerTasks={state.fillerTasks}
                onToggle={(id) => setState((current) => ({
                  ...current,
                  fillerTasks: current.fillerTasks.map((task) => task.id === id ? { ...task, enabled: !task.enabled } : task),
                }))}
              />
            )}
            {activePanel === "data" && <DataManager state={state} onImport={importState} />}
            {activePanel === "appearance" && (
              <AppearanceManager
                state={state}
                onThemeChange={(selectedTheme) => setState((current) => ({
                  ...current,
                  settings: { ...current.settings, selectedTheme },
                }))}
                onDauberChange={(selectedDauber) => setState((current) => ({
                  ...current,
                  settings: { ...current.settings, selectedDauber },
                }))}
              />
            )}
          </div>
        </section>
      </main>
      <ToolDrawer workspace={state.workspace} onChange={updateWorkspace} />
      <FloatingTools workspace={state.workspace} onChange={updateWorkspace} />
      {state.workspace.pinnedTools.includes("notes") && <FloatingNotes
          notes={state.workspace.notes}
          onChange={(notes) => updateWorkspace({ ...state.workspace, notes })}
        />}
      {celebration && <BingoCelebration key={celebration.key} kind={celebration.kind} />}
      {achievementToast && (
        <div className="achievement-toast" role="status">
          <span aria-hidden="true">✦</span>
          <div>
            <strong>Achievement unlocked: {achievementToast.achievement.label}</strong>
            <p>{achievementToast.achievement.reward.label} is now available
              {achievementToast.additional > 0 ? ` · plus ${achievementToast.additional} more unlock${achievementToast.additional === 1 ? "" : "s"}` : ""}
            </p>
          </div>
          <button type="button" aria-label="Dismiss achievement" onClick={() => setAchievementToast(null)}>×</button>
        </div>
      )}
      <footer>Saved automatically in this browser.</footer>
    </div>
  );
}
