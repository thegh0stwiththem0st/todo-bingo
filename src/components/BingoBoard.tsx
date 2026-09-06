import type { BoardState } from "../types";
import type { DauberId } from "../types";
import { dauberSymbols } from "../lib/cosmetics";
import { getWinningIndexes } from "../lib/patterns";

type BingoBoardProps = {
  board: BoardState | null;
  onToggleSquare: (index: number) => void;
  dauber: DauberId;
};

export function BingoBoard({ board, onToggleSquare, dauber }: BingoBoardProps) {
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
    <div className="bingo-board" role="grid" aria-label="Productivity bingo board">
      {board.squares.map((square, index) => (
        <button
          className={`bingo-square ${square.completed ? "is-complete" : ""} ${
            winningIndexes.has(index) ? "is-winning" : ""
          }`}
          type="button"
          role="gridcell"
          aria-pressed={square.completed}
          aria-label={`${square.text}. ${square.completed ? "Completed" : "Not completed"}`}
          key={square.id}
          onClick={() => onToggleSquare(index)}
        >
          <span className="square-text">{square.text}</span>
          {square.completed && (
            <span className={`completion-mark dauber-${dauber}`} aria-hidden="true">{dauberSymbols[dauber]}</span>
          )}
        </button>
      ))}
    </div>
  );
}
