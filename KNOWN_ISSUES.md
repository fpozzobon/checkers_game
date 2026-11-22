# Known Issues and Improvement Notes

Findings from reading the source in `assets/js/script.js`, `assets/css/style.css`, `index.html` and the README. Items marked **(read from code)** were identified by inspection and have not all been reproduced in a browser. Treat them as leads to verify.

## Already documented in the README

- Captures are forced, but the player is not required to take the *maximum* number of pieces.
- The computer picks pieces at random and has no strategy.
- A crash on Android was reported but not reproduced.

## Likely bugs

### 1. Capture loop condition in `computerMove` (read from code)
```js
while (board.checkIfcanTake(blackPieces) || whiteCounter > 5) {
```
This looks like it was meant to be `&&` (stop after a safety limit). With `||`, once `whiteCounter` exceeds 5 the loop can never end. It would hang the tab if the computer ever chains more than five captures. Also, `takePiece()` uses `pieceTaking` to continue a chain with the same piece, but `computerMove` runs with `this` bound to `window` (it is passed as `setTimeout(board.computerMove, ...)`), so `this.pieceTaking = null` there does not reset the board's value.

**Suggested fix:** use `&&`, and call it as `setTimeout(() => board.computerMove(), timeMove)`.

### 2. `moveComputerPiece` can crash with no moves (read from code)
If no black piece has a move, `allMoves` is empty, `pieceId` is `undefined` and `piece.parentNode` throws. `checkWinner` normally ends the game first, but it runs on a 1 s timer while the computer moves after 1.2 s or more, so the ordering is fragile.

**Suggested fix:** return early when `keys.length === 0`.

### 3. Move sound plays once per black piece (read from code)
`board.playSound("move")` is inside the `forEach` that scans every black piece, so up to 12 sounds are triggered per computer move. It should be played once, after the move is chosen.

### 4. `checkWinner` has side effects (read from code)
It calls `checkpossibleMove` on every piece of both colours to count moves. That method fills `needTake` and `takeIt` through `canTake`, so a winner check can leave stale capture data behind and affect the next forced-capture detection.

**Suggested fix:** split `checkpossibleMove` into a pure "generate moves" function and a separate step that records forced captures.

### 5. `canTake` can read off the board (read from code)
The landing square is `enemySquareId + relation` and `document.getElementById(...)` returns `null` when the id is outside 0–63. `opositeSquare.hasChildNodes()` then throws. The exception is swallowed by the `try/catch` in `checkpossibleMove`, which works by accident. The hard-coded `corners` list also approximates edge detection rather than computing row/column, which makes wrap-around errors possible for kings.

**Suggested fix:** compute `row = Math.floor(id / 8)` and `col = id % 8` and bounds-check explicitly.

### 6. Undefined `this.notify` sound (read from code)
`playSound("notify")` references `this.notify`, which is never created. Nothing calls it today, but it would throw.

## Rules text vs behaviour

The in-game Rules screen says things the code does not do:

| Rules text | Actual behaviour |
|---|---|
| "A draw will also occur after 30 moves made just by kings without piece taking" | No draw logic exists |
| Jumps are "forward only" | Kings can capture backwards (correct for checkers, but the text is misleading) |
| Stray word "Kings" before the King heading | Typo in the template |
| "jungs" | Typo for "kings" |

## README discrepancies

- The README states each side has 16 pieces; the code creates **12** per side (the standard 8x8 count).
- The Introduction says the pieces occupy "the 12 squares closest", which matches the code but contradicts the 16 figure above.
- The W3C validation line has a stray `-->` and the image is not embedded.
- The `rel="nofolow"` attribute is misspelled (should be `rel="nofollow"`, or better `noopener`).
- `index.html` metadata lists "247games LLC" as author and copyright holder, while the LICENSE names `__cafa__`. Worth confirming which is correct.

## Code quality and maintainability

- **Global `board` / `menu` instances** are referenced inside class methods. This makes the classes hard to test; passing dependencies in would help.
- **State stored on DOM nodes** (`movable`, `isKing`) and color read from `classList[1]` are fragile. A separate board model (an array of 64 cells) would make move generation, AI and testing much simpler.
- **`innerHTML` string templates** in `Menu` repeat the same close/back wiring in four places and could share a helper.
- **`updateScore`** has a redundant null-branch (scores are initialised in the constructor).
- **`turn` counter** is incremented but never used.
- **Win/loss handling** now uses an in-game dialog; acknowledging it reloads to the main menu and resets the board. The forced-capture highlight setting is still reset on reload.
- **Accessibility:** pieces and squares are not keyboard-accessible and have no ARIA labels. Menu items are `div`s rather than buttons.
- **Font Awesome** is loaded twice, v4.7 CSS and v5.0.6 JS. Only one is needed (the code uses v5 class names such as `far fa-times-circle`).
- **`favicon.ico?`** in `index.html` has a stray `?`.

## Suggested roadmap

1. Fix the loop condition and the null-move crash (items 1 and 2).
2. Separate pure move generation from forced-capture bookkeeping (items 4 and 5).
3. Introduce a board model and add unit tests for move generation.
4. Implement maximum-capture rule and the draw rule, or remove them from the Rules text.
5. Improve the AI (e.g. prefer captures, avoid immediate losses, then minimax with a shallow depth).
6. Move timer, smoother animations, multiplayer.
