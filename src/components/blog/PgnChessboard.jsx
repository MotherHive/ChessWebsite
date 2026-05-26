import { useMemo, useState } from "react"
import { Chess } from "chess.js"
import { Chessboard } from "react-chessboard"

const buildPgnReplay = (pgn) => {
  if (!pgn) {
    return null
  }

  const game = new Chess()

  try {
    game.loadPgn(pgn, { strict: false })
  } catch (error) {
    return { error: error.message }
  }

  const moves = game.history({ verbose: true })

  return {
    headers: game.header(),
    moves,
    positions: [new Chess().fen(), ...moves.map((move) => move.after)],
  }
}

export default function PgnChessboard({ pgn }) {
  const replay = useMemo(() => buildPgnReplay(pgn), [pgn])
  const [moveIndex, setMoveIndex] = useState(0)

  if (!replay) {
    return null
  }

  if (replay.error) {
    return (
      <aside className="blog-pgn-viewer blog-pgn-error">
        <h2>PGN could not be loaded</h2>
        <p>{replay.error}</p>
      </aside>
    )
  }

  const activeMove = replay.moves[moveIndex - 1]
  const position = replay.positions[moveIndex]
  const moveLabel = activeMove ? `${Math.ceil(moveIndex / 2)}. ${activeMove.san}` : "Starting position"
  const gameTitle = [replay.headers.White, replay.headers.Black].filter((value) => value && value !== "?").join(" vs ")
  const highlightedSquares = activeMove
    ? {
        [activeMove.from]: {
          boxShadow: "inset 0 0 0 4px #71ff7d",
        },
        [activeMove.to]: {
          boxShadow: "inset 0 0 0 4px #71ff7d",
        },
      }
    : {}

  return (
    <aside className="blog-pgn-viewer" aria-label="PGN chessboard replay">
      <div className="blog-pgn-header">
        <div>
          <span>PGN Replay</span>
          <h2>{gameTitle || replay.headers.Event || "Chess game"}</h2>
        </div>
        <p>{moveLabel}</p>
      </div>

      <div className="blog-pgn-layout">
        <div className="blog-chessboard" aria-label={`Chessboard showing ${moveLabel}`}>
          <Chessboard
            options={{
              id: "blog-pgn-board",
              position,
              allowDragging: false,
              allowDrawingArrows: false,
              showAnimations: true,
              animationDurationInMs: 180,
              darkSquareStyle: { backgroundColor: "#4c6849" },
              lightSquareStyle: { backgroundColor: "#f2f2ec" },
              boardStyle: {
                border: "2px solid #191919",
                borderRadius: "4px",
                overflow: "hidden",
              },
              squareStyles: highlightedSquares,
            }}
          />
        </div>

        <div className="blog-pgn-controls">
          <div className="blog-pgn-buttons">
            <button type="button" onClick={() => setMoveIndex(0)} disabled={moveIndex === 0}>
              Start
            </button>
            <button type="button" onClick={() => setMoveIndex((index) => Math.max(0, index - 1))} disabled={moveIndex === 0}>
              Prev
            </button>
            <button
              type="button"
              onClick={() => setMoveIndex((index) => Math.min(replay.moves.length, index + 1))}
              disabled={moveIndex === replay.moves.length}
            >
              Next
            </button>
            <button type="button" onClick={() => setMoveIndex(replay.moves.length)} disabled={moveIndex === replay.moves.length}>
              End
            </button>
          </div>

          <ol className="blog-pgn-moves">
            {replay.moves.map((move, index) => (
              <li key={`${move.lan}-${index}`}>
                <button
                  className={moveIndex === index + 1 ? "blog-pgn-move-active" : ""}
                  type="button"
                  onClick={() => setMoveIndex(index + 1)}
                >
                  <span>{Math.ceil((index + 1) / 2)}{move.color === "w" ? "." : "..."}</span>
                  {move.san}
                </button>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </aside>
  )
}
