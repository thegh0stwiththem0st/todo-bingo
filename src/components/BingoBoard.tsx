import type { BoardState } from "../types";
import type { DauberId } from "../types";
import { dauberSymbols } from "../lib/cosmetics";
import { getWinningIndexes } from "../lib/patterns";

type BingoBoardProps = {
  board: BoardState | null;
  onToggleSquare: (index: number) => void;
  onFocusSquare: (index: number) => void;
  dauber: DauberId;
};

export function BingoBoard({ board, onToggleSquare, onFocusSquare, dauber }: BingoBoardProps) {
  const winningIndexes = getWinningIndexes(board?.completedPatterns ?? []);

  if (!board) {
    return (
      <div className="board-placeholder" aria-live="polite">
        <span className="placeholder-icon" aria-hidden="true">✦</span>
        <h2>Your board is ready when you are.</h2>
        <p>Add your tasks, then make a new board. Friendly filler tasks will cover any open spaces.</p>
      </div>
    );
  }

  return (
    <>
    <div className="bingo-board" role="grid" aria-label="Productivity bingo board">
      {board.squares.map((square, index) => {
        const focused = board.focusedSquareId === square.id;
        return <div className={`bingo-cell ${focused ? "is-focused" : ""}`} role="gridcell" aria-current={focused ? "true" : undefined} key={square.id}>
        <button
          className={`bingo-square ${square.completed ? "is-complete" : ""} ${
            winningIndexes.has(index) ? "is-winning" : ""
          } ${focused ? "is-focused" : ""}`}
          type="button"
          aria-pressed={square.completed}
          aria-label={`${square.text}. ${square.completed ? "Completed" : "Not completed"}${focused ? ". Current focused task" : ""}`}
          onClick={() => onToggleSquare(index)}
          onContextMenu={(event) => { event.preventDefault(); onFocusSquare(index); }}
        >
          <span className="square-text">{square.text}</span>
          {focused && <span className="focus-badge">FOCUS</span>}
          {square.completed && (
            <span className={`completion-mark dauber-${dauber}`} aria-hidden="true">{dauberSymbols[dauber]}</span>
          )}
        </button>
        {!square.completed && <button className="square-focus-action" type="button" aria-pressed={focused} aria-label={`${focused ? "Unfocus" : "Focus"} ${square.text}`} onClick={() => onFocusSquare(index)} title={focused ? "Remove current focus" : "Mark as current focus"}>◎</button>}
        </div>;
      })}
    </div>
    <p className="focus-help">Right-click a square, or use its ◎ button, to mark your current focus.</p>
    </>
  );
}
