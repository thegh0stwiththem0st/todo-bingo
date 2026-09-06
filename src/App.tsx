import { useEffect, useMemo, useState } from "react";
import { BingoBoard } from "./components/BingoBoard";
import { DataManager } from "./components/DataManager";
import { FillerManager } from "./components/FillerManager";
import { ModeSelector } from "./components/ModeSelector";
import { RewardManager } from "./components/RewardManager";
import { TaskManager } from "./components/TaskManager";
import { generateBoard } from "./lib/board";
import { createId } from "./lib/id";
import { detectTargetPatterns, getTargetPattern, pickRandomTarget } from "./lib/patterns";
import { normalizeStreak, recordBingoDay, recordBingoStats } from "./lib/progress";
import { loadState, saveState } from "./lib/storage";
import type { AppState, BingoMode, PatternId, Reward, UserTask } from "./types";

type Panel = "tasks" | "rewards" | "fillers" | "data";

export default function App() {
  const [state, setState] = useState<AppState>(() => {
    const loaded = loadState();
    return { ...loaded, streak: normalizeStreak(loaded.streak) };
  });
  const [activePanel, setActivePanel] = useState<Panel>("tasks");
  const [message, setMessage] = useState("");
  const [selectedMode, setSelectedMode] = useState<BingoMode>(state.board?.mode ?? "choose");
  const [selectedTarget, setSelectedTarget] = useState<PatternId>(state.board?.targetPattern ?? "standard-line");

  useEffect(() => {
    saveState(state);
  }, [state]);

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

  function addTask(text: string) {
    const task: UserTask = { id: createId("task"), text, active: true, createdAt: new Date().toISOString() };
    updateTasks((tasks) => [...tasks, task]);
  }

  function addTasks(lines: string[]) {
    const createdAt = new Date().toISOString();
    updateTasks((tasks) => [
      ...tasks,
      ...lines.map((text) => ({ id: createId("task"), text, active: true, createdAt })),
    ]);
  }

  function updateRewards(updater: (rewards: Reward[]) => Reward[]) {
    setState((current) => ({ ...current, rewards: updater(current.rewards) }));
  }

  function makeBoard() {
    if (state.board && completedCount > 0 && !window.confirm("Replace this in-progress board? Your marks will be lost.")) return;
    try {
      const targetPattern = selectedMode === "random" ? pickRandomTarget() : selectedTarget;
      const board = generateBoard(state.tasks, state.fillerTasks, { mode: selectedMode, targetPattern });
      const activeTaskCount = state.tasks.filter((task) => task.active).length;
      setState((current) => ({ ...current, board }));
      setMessage(activeTaskCount > 25
        ? `Today's challenge: ${getTargetPattern(targetPattern).label}. 25 of your ${activeTaskCount} active tasks were chosen; the rest remain in your pool.`
        : `Today's challenge: ${getTargetPattern(targetPattern).label}. Pick a square and get rolling!`);
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
        const enabledRewards = current.rewards.filter((reward) => reward.enabled);
        const reward = enabledRewards[Math.floor(Math.random() * enabledRewards.length)];
        awardedReward = reward ? { id: reward.id, text: reward.text } : null;
      }
      let streak = current.streak;
      if (firstBoardCompletion) {
        stats = recordBingoStats(stats, current.board.targetPattern);
        streak = recordBingoDay(streak);
      }
      return {
        ...current,
        stats,
        streak,
        board: {
          ...current.board,
          squares,
          completedPatterns,
          targetCompleted,
          completionRecorded: current.board.completionRecorded || firstBoardCompletion,
          awardedReward,
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
                {currentTarget ? currentTarget.label : selectedMode === "random" ? "A surprise pattern" : getTargetPattern(selectedTarget).label}
              </p>
              <p className="status-description">
                {currentTarget ? currentTarget.description : selectedMode === "random" ? "Your target will be revealed with the board." : getTargetPattern(selectedTarget).description}
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
                  ? <>Your reward: <strong>{state.board.awardedReward.text}</strong></>
                  : "No enabled rewards yet—add one for your next board."}
              </div>
            </div>
          )}
          {message && <p className="notice" role="status">{message}</p>}
          <BingoBoard board={state.board} onToggleSquare={toggleSquare} />
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
            {(["tasks", "rewards", "fillers", "data"] as Panel[]).map((panel) => (
              <button
                type="button"
                key={panel}
                className={activePanel === panel ? "is-active" : ""}
                aria-pressed={activePanel === panel}
                onClick={() => setActivePanel(panel)}
              >
                {panel === "fillers" ? "Fillers" : panel[0].toUpperCase() + panel.slice(1)}
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
              />
            )}
            {activePanel === "rewards" && (
              <RewardManager
                rewards={state.rewards}
                onAdd={(text) => updateRewards((rewards) => [...rewards, { id: createId("reward"), text, enabled: true, createdAt: new Date().toISOString() }])}
                onEdit={(id, text) => updateRewards((rewards) => rewards.map((reward) => reward.id === id ? { ...reward, text } : reward))}
                onDelete={(id) => updateRewards((rewards) => rewards.filter((reward) => reward.id !== id))}
                onToggle={(id) => updateRewards((rewards) => rewards.map((reward) => reward.id === id ? { ...reward, enabled: !reward.enabled } : reward))}
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
          </div>
        </section>
      </main>
      <footer>Saved automatically in this browser.</footer>
    </div>
  );
}
