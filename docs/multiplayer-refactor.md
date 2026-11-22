# Game architecture and multiplayer preparation

The browser game currently uses `assets/js/script.js` as its runtime: it owns the board DOM, move rules, computer opponent, and menu. The last-move indication is already separated into `assets/js/last-move.js` and `assets/css/last-move.css`.

`assets/js/core/game-state.js` adds a DOM-independent, serializable position model. It is intentionally an ES module and is not loaded by the current page yet. A future refactor can move rules into a rules engine that reads/writes `GameState`, while the existing browser board becomes a renderer and input controller. A server or peer transport can exchange the JSON snapshots and move commands without depending on DOM elements.

## State and command contract

A snapshot contains 64 entries in `squares`, where each entry is `null` or `{ color: "white" | "black", king: boolean }`, plus `turn`, `ruleset`, and a monotonically increasing `revision`.

An accepted move command contains `{ from, to, captures, keepTurn, revision }`. `revision` lets a multiplayer host reject stale commands; `keepTurn` supports continued captures. `GameState.applyMove` checks structure, turn ownership, occupancy, captures, and promotion. It does **not** check move geometry or mandatory-capture rules. Those must be enforced by the rules engine before a command is applied; this model alone is not a security boundary for a networked game.

## Suggested next refactor steps

1. Extract legal-move generation and capture validation from `Board` into a pure rules engine that consumes `GameState`.
2. Change the UI/controller to render snapshots and submit move commands, rather than treating the DOM as the source of truth.
3. Route computer moves through the same command validation path.
4. Add a transport adapter (WebSocket or WebRTC) that sends commands with the current revision and applies authoritative snapshots.
5. Add rules-engine and protocol tests before enabling remote play.
