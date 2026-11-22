# Architecture

A technical walkthrough of how the Checkers game is built. For the player-facing description, see [README.md](README.md).

## Overview

The game is a static, dependency-free web app: plain HTML, CSS and vanilla JavaScript (ES6 classes). There is no build step and no backend. After clicking Start Game, the player chooses white (bottom) or black (top); the computer plays the other color.

```
.
├── index.html              # Page shell: containers + script/style includes
├── assets/
│   ├── css/style.css       # Board, pieces, menus, switches, captured-piece trays
│   ├── js/script.js        # DOM controller and computer opponent
│   ├── js/core/
│   │   ├── game-state.js   # Serializable, DOM-independent position model
│   │   └── rules-engine.js # Pure move and capture validation
│   ├── audio/              # move.mp3, capture.mp3, menu.mp3
│   └── images/             # Wood textures, piece sprites, README screenshots
├── LICENSE                 # MIT
└── README.md
```

External resources: Font Awesome (CDN) for the cog, close and back icons.

## Page structure (`index.html`)

```
#center
├── #removedb   tray of white pieces captured by black
├── #game       8x8 grid (squares, pieces and menu are all injected here by JS)
├── #removedw   tray of black pieces captured by white
└── #messages   status text ("White's turn")
```

`script.js` is loaded at the end of `<body>`, so the DOM exists when it runs.

## Classes in `assets/js/script.js`

### `Board`
Owns the game state and rules. A single global instance, `board`, is created at the bottom of the file and referenced directly by event handlers and timeouts.

| State | Purpose |
|---|---|
| `colorPlay` | Whose turn it is: `"piece-white"` or `"piece-black"` |
| `playerColor`, `computerColor` | The selected human side and the opposite computer side |
| `needTake` | Pieces that currently have a mandatory capture |
| `takeIt` | Capture descriptors: `[piece, enemySquareId, landingSquareId]` |
| `pieceTaking` | Piece in the middle of a multi-capture (computer only) |
| `optionSound`, `optionHighlight` | Settings toggled from the Options menu |
| `menuIsOpen`, `isPlaying` | UI state |
| `turn` | Turn counter (incremented in `gameControl`, otherwise unused) |

Key methods:

| Method | Responsibility |
|---|---|
| `constructor` | Builds the 64 squares, initialises `localStorage` scores |
| `startGame` | Creates pieces, installs `movestart` guard, starts first turn |
| `gameControl` | Turn dispatcher. Freezes/unfreezes pieces, promotes kings, schedules `checkWinner`, and schedules `computerMove` when it is the computer's turn |
| `createPieces` | Places 12 pieces per side on the dark squares |
| `pieceClick` | Selects a movable piece and highlights its target squares |
| `movePiece` | Executes the human's move, handles capture and multi-capture |
| `computerMove` | Computer's turn: capture if forced, otherwise make a move |
| `takePiece` / `moveComputerPiece` | The computer's capture and plain-move implementations |
| `checkpossibleMove` | Core move generator for one piece (see below) |
| `canTake` | Tests whether an adjacent enemy can be jumped |
| `checkIfcanTake` | Applies the forced-capture rule to a group of pieces |
| `promoteToKing` | Crowns pieces that reached the far row |
| `checkWinner` | Win detection (no pieces or no legal moves), then alert + reload |
| `updateScore` | Increments the winner's counter in `localStorage` |
| `playSound`, `invertPlayerTurn` | Helpers |

### `Piece`
Thin wrapper that creates a `<div class="piece piece-{color}">`. `get_piece(id)` assigns the element id and returns it. King status is stored as an expando property on the DOM element (`element.isKing`), and `element.movable` is used the same way.

### `Menu`
Builds and swaps the in-board menu panel: main menu, color choice, Options, Rules and Results sub-screens, plus the small cog button shown when the menu is hidden. The menu cannot be hidden until a game starts; during a game, clicking outside it closes it. Menu HTML is generated via `innerHTML` template strings and listeners are attached after each render.

## Data model

The **DOM is the source of truth**. There is no separate in-memory board array.

- Squares are `div.square` with ids `0`–`63` in row-major order (`id = row * 8 + col`), alternating `.white` / `.black`. Only `.black` squares are playable; `.white` has `pointer-events: none`.
- Square 0 is light, so dark squares are those where `row + col` is odd.
- A square holds at most one child (a piece). The `occupied` attribute is also maintained.
- Pieces have ids `100 + startSquare` (black) and `200 + startSquare` (white). These ids do **not** update as pieces move; use `piece.parentNode.id` for the current position.
- Piece color is read from `classList[1]` (`piece-white` / `piece-black`). Kings get an extra class (`white-king` / `black-king`) appended after, so index 1 stays stable. Reordering classes will break the logic.

### Movement geometry
With `id = row * 8 + col`:

| Direction | Offset |
|---|---|
| Up-left / up-right | `-9` / `-7` |
| Down-left / down-right | `+7` / `+9` |

White men move up, black men move down, kings move in all four. Edge squares are handled with hard-coded lists (`leftCorners`, `rightCorners`, `whiteTopCorners`, `blackTopCorners`) to prevent wrap-around.

## Turn flow

```
startGame()
   └─ gameControl()
        ├─ Player's turn
        │    ├─ freeze computer pieces and promote them; schedule checkWinner
        │    ├─ checkIfcanTake(player) → only capturing pieces are movable (+ highlight)
        │    └─ otherwise all player pieces are movable
        │         user clicks piece → pieceClick → target squares get .possible
        │         user clicks square → movePiece
        │              ├─ capture? remove enemy, move it to the tray
        │              ├─ can capture again? keep the turn
        │              └─ invertPlayerTurn(); gameControl()
        └─ Computer's turn
             ├─ freeze player pieces and promote them; schedule checkWinner
             └─ setTimeout(computerMove, 1.2–3.2 s)
                  ├─ forced capture → takePiece()
                  └─ else → moveComputerPiece() (choose a legal move)
                  invertPlayerTurn(); gameControl()
```

White always moves first, so choosing black gives the computer the opening move.

### How `checkpossibleMove` works
1. Resolve the piece (argument, or the one with class `.moving`).
2. Build candidate target ids from direction offsets, trimming edge cases.
3. For each candidate: drop it if blocked by a friendly piece; if blocked by an enemy, call `canTake` to see whether the square behind is empty.
4. **Return value**: if any capture exists, return only the landing squares of captures; otherwise return plain move squares; return `false` on invalid input.

Be aware that `canTake` has **side effects**: it pushes into `board.needTake` and `board.takeIt`. This is how forced-capture detection works, but it means calling `checkpossibleMove` "just to look" mutates state (see [KNOWN_ISSUES.md](KNOWN_ISSUES.md)).

## Persistence

Only the win counters, in `localStorage`:

| Key | Meaning |
|---|---|
| `whiteScore` | Games won by the player |
| `blackScore` | Games won by the computer |

Settings (sound, highlight) and the game state are not persisted. A finished or reset game calls `location.reload()`.

## Rules implemented

- 8x8 board, 12 pieces per side, dark squares only
- Men move one square diagonally forward
- Captures are mandatory, including multi-jumps
- Kings move one square in any direction (no "flying kings")
- Win by capturing everything or leaving the opponent without moves

Not implemented: choosing the maximum capture sequence, draw detection (the in-game Rules text mentions a 30-move rule), and any computer strategy beyond random choice.

## Styling notes

- Sizes are driven by `vmin` units with `max()` floors so the board scales on small phones.
- Menu panels are absolutely positioned inside `#game`.
- Pieces and squares use PNG textures from `assets/images/`; captured pieces use the `.piece-out-*` classes.
