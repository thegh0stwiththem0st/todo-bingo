import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import { DeveloperUtilitiesTool } from "./DeveloperUtilitiesTool";
import { PomodoroTool } from "./PomodoroTool";
import { StickyNotesTool } from "./StickyNotesTool";
import { StopwatchTool } from "./StopwatchTool";
import { CountdownTimerTool } from "./CountdownTimerTool";
import { TimeZoneTool } from "./TimeZoneTool";
import { DaysUntilTool } from "./DaysUntilTool";
import { CaseConverterTool } from "./CaseConverterTool";
import { MetricsTool } from "./MetricsTool";
import type { ToolId, WorkspaceState } from "../types";

type WorkspaceProps = {
  workspace: WorkspaceState;
  onChange: (workspace: WorkspaceState) => void;
};

const tools: Array<{ id: ToolId; label: string; icon: string; description: string }> = [
  { id: "pomodoro", label: "Pomodoro", icon: "◷", description: "A focused work-and-break timer" },
  { id: "stopwatch", label: "Stopwatch", icon: "⏱", description: "Track elapsed time accurately" },
  { id: "timer", label: "Countdown timer", icon: "⌛", description: "A flexible hours, minutes, seconds timer" },
  { id: "time-zones", label: "Time zones", icon: "◎", description: "World clocks and time comparison" },
  { id: "days-until", label: "Days until", icon: "▦", description: "Count down to important dates" },
  { id: "metrics", label: "Metrics", icon: "±", description: "Track values that grow or shrink" },
  { id: "notes", label: "Sticky notes", icon: "▤", description: "Quick notes saved in this browser" },
  { id: "case-converter", label: "Case converter", icon: "Aa", description: "Convert text between common cases" },
  { id: "developer", label: "Developer utilities", icon: "{ }", description: "Format JSON, XML, SQL, and lists" },
];

function ToolContent({ tool, workspace, onChange }: WorkspaceProps & { tool: ToolId }) {
  if (tool === "pomodoro") {
    return <PomodoroTool workspace={workspace} onChange={(pomodoro) => onChange({ ...workspace, pomodoro })} />;
  }
  if (tool === "stopwatch") return <StopwatchTool stopwatch={workspace.stopwatch} onChange={(stopwatch) => onChange({ ...workspace, stopwatch })} />;
  if (tool === "timer") return <CountdownTimerTool timer={workspace.timer} onChange={(timer) => onChange({ ...workspace, timer })} />;
  if (tool === "time-zones") return <TimeZoneTool timeZones={workspace.timeZones} timeZoneSource={workspace.timeZoneSource} comparisonDate={workspace.comparisonDate} comparisonTime={workspace.comparisonTime} onChange={(patch) => onChange({ ...workspace, ...patch })} />;
  if (tool === "days-until") return <DaysUntilTool items={workspace.dayCountdowns} onChange={(dayCountdowns) => onChange({ ...workspace, dayCountdowns })} />;
  if (tool === "metrics") return <MetricsTool metrics={workspace.metrics} onChange={(metrics) => onChange({ ...workspace, metrics })} />;
  if (tool === "notes") {
    return <StickyNotesTool notes={workspace.notes} pinned={workspace.pinnedTools.includes("notes")} onChange={(notes) => onChange({ ...workspace, notes })} />;
  }
  if (tool === "case-converter") return <CaseConverterTool />;
  return <DeveloperUtilitiesTool />;
}

function PinButton({ tool, workspace, onChange }: WorkspaceProps & { tool: ToolId }) {
  const pinned = workspace.pinnedTools.includes(tool);
  return (
    <button
      className="pin-button"
      type="button"
      aria-pressed={pinned}
      onClick={() => {
        const nextPinned = pinned ? workspace.pinnedTools.filter((id) => id !== tool) : [...workspace.pinnedTools, tool];
        const nextFloating = { ...workspace.floatingTools };
        if (!pinned && tool !== "notes" && !nextFloating[tool]) {
          const offset = workspace.pinnedTools.length * 24;
          const maxZ = Math.max(50, ...Object.values(nextFloating).map((position) => position?.z ?? 50));
          nextFloating[tool] = { x: Math.min(32 + offset, Math.max(8, window.innerWidth - 380)), y: Math.min(100 + offset, Math.max(8, window.innerHeight - 280)), z: maxZ + 1 };
        }
        onChange({ ...workspace, pinnedTools: nextPinned, floatingTools: nextFloating });
      }}
    >
      {pinned ? "Unpin" : "Pin to workspace"}
    </button>
  );
}

export function ToolDrawer({ workspace, onChange }: WorkspaceProps) {
  if (!workspace.drawerOpen) return null;
  const active = tools.find((tool) => tool.id === workspace.activeTool) ?? tools[0];
  const activePinned = workspace.pinnedTools.includes(active.id);

  return (
    <>
      <button className="drawer-backdrop" type="button" aria-label="Close toolbox" onClick={() => onChange({ ...workspace, drawerOpen: false })} />
      <aside className="tool-drawer" aria-label="Productivity toolbox">
        <header>
          <div><p className="eyebrow">Workspace</p><h2>Toolbox</h2></div>
          <button className="drawer-close" type="button" aria-label="Close toolbox" onClick={() => onChange({ ...workspace, drawerOpen: false })}>×</button>
        </header>
        <nav className="tool-list" aria-label="Available tools">
          {tools.map((tool) => (
            <button
              type="button"
              key={tool.id}
              className={workspace.activeTool === tool.id ? "is-active" : ""}
              aria-pressed={workspace.activeTool === tool.id}
              onClick={() => onChange({ ...workspace, activeTool: tool.id })}
            >
              <span aria-hidden="true">{tool.icon}</span>
              <span><strong>{tool.label}</strong><small>{tool.description}</small></span>
            </button>
          ))}
        </nav>
        <section className="drawer-tool" aria-labelledby={`drawer-${active.id}`}>
          <div className="tool-heading">
            <h3 id={`drawer-${active.id}`}>{active.label}</h3>
            <PinButton tool={active.id} workspace={workspace} onChange={onChange} />
          </div>
          {activePinned && active.id !== "notes"
            ? <p className="pinned-message">This tool is open in your pinned workspace.</p>
            : <ToolContent tool={active.id} workspace={workspace} onChange={onChange} />}
        </section>
      </aside>
    </>
  );
}

type Position = { x: number; y: number };

function FloatingTool({ toolId, defaultIndex, workspace, onChange }: WorkspaceProps & { toolId: ToolId; defaultIndex: number }) {
  const tool = tools.find((item) => item.id === toolId);
  const saved = workspace.floatingTools[toolId] ?? { x: 32 + defaultIndex * 24, y: 100 + defaultIndex * 24, z: 50 + defaultIndex };
  const [position, setPosition] = useState<Position>({ x: saved.x, y: saved.y });
  const [dragging, setDragging] = useState(false);
  const offset = useRef<Position>({ x: 0, y: 0 });
  const size = useRef({ width: 360, height: 300 });

  function clamp(next: Position) {
    return { x: Math.max(8, Math.min(next.x, window.innerWidth - size.current.width - 8)), y: Math.max(8, Math.min(next.y, window.innerHeight - Math.min(size.current.height, window.innerHeight - 16) - 8)) };
  }

  useEffect(() => {
    if (!dragging) setPosition(clamp({ x: saved.x, y: saved.y }));
  }, [saved.x, saved.y, dragging]);

  if (!tool) return null;
  function save(next: Position, z = saved.z) {
    const clamped = clamp(next);
    setPosition(clamped);
    onChange({ ...workspace, floatingTools: { ...workspace.floatingTools, [toolId]: { ...clamped, z } } });
  }
  function startDrag(event: PointerEvent<HTMLButtonElement>) {
    const card = event.currentTarget.closest("article");
    if (card) { const rect = card.getBoundingClientRect(); size.current = { width: rect.width, height: rect.height }; }
    event.currentTarget.setPointerCapture(event.pointerId);
    offset.current = { x: event.clientX - position.x, y: event.clientY - position.y };
    setDragging(true);
    const nextZ = Math.max(50, ...Object.values(workspace.floatingTools).map((item) => item?.z ?? 50)) + 1;
    onChange({ ...workspace, floatingTools: { ...workspace.floatingTools, [toolId]: { ...position, z: nextZ } } });
  }
  function moveDrag(event: PointerEvent<HTMLButtonElement>) { if (dragging) setPosition(clamp({ x: event.clientX - offset.current.x, y: event.clientY - offset.current.y })); }
  function endDrag(event: PointerEvent<HTMLButtonElement>) { if (!dragging) return; event.currentTarget.releasePointerCapture(event.pointerId); setDragging(false); save(position, workspace.floatingTools[toolId]?.z ?? saved.z); }
  function nudge(event: KeyboardEvent<HTMLButtonElement>) {
    const amount = event.shiftKey ? 25 : 10;
    const moves: Partial<Record<string, Position>> = { ArrowLeft: { x: -amount, y: 0 }, ArrowRight: { x: amount, y: 0 }, ArrowUp: { x: 0, y: -amount }, ArrowDown: { x: 0, y: amount } };
    const move = moves[event.key];
    if (!move) return; event.preventDefault(); save({ x: position.x + move.x, y: position.y + move.y });
  }
  return (
    <article className={`floating-tool ${dragging ? "is-dragging" : ""}`} style={{ left: position.x, top: position.y, zIndex: saved.z }}>
      <div className="floating-tool-heading">
        <button className="floating-tool-handle" type="button" aria-label={`Move ${tool.label}; use arrow keys to move`} onPointerDown={startDrag} onPointerMove={moveDrag} onPointerUp={endDrag} onPointerCancel={endDrag} onKeyDown={nudge}><span aria-hidden="true">••••</span> {tool.icon} {tool.label}</button>
        <PinButton tool={toolId} workspace={workspace} onChange={onChange} />
      </div>
      <div className="floating-tool-content"><ToolContent tool={toolId} workspace={workspace} onChange={onChange} /></div>
    </article>
  );
}

export function FloatingTools({ workspace, onChange }: WorkspaceProps) {
  return (
    <div className="floating-tools-layer" aria-label="Pinned tools">
      {workspace.pinnedTools.filter((tool) => tool !== "notes").map((toolId, index) => <FloatingTool key={toolId} toolId={toolId} defaultIndex={index} workspace={workspace} onChange={onChange} />)}
    </div>
  );
}
