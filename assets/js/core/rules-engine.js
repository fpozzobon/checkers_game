import { GameState } from "./game-state.js";

export const RULESETS = Object.freeze({
  british: Object.freeze({
    boardSize: 8,
    menCaptureBackward: false,
    flyingKings: false,
    longestCaptureMandatory: false
  }),
  international: Object.freeze({
    boardSize: 10,
    menCaptureBackward: true,
    flyingKings: true,
    longestCaptureMandatory: true
  })
});

export function getBoardSize(ruleset = "international") {
  if (!RULESETS[ruleset]) throw new RangeError(`Unsupported ruleset: ${ruleset}`);
  return RULESETS[ruleset].boardSize;
}

export function getSquareCount(ruleset = "international") {
  return getBoardSize(ruleset) ** 2;
}

export const BOARD_SIZE = 8;
export const SQUARE_COUNT = BOARD_SIZE * BOARD_SIZE;

function inBounds(row, column) {
  return row >= 0 && row < BOARD_SIZE && column >= 0 && column < BOARD_SIZE;
}

function squareAt(row, column) {
  return inBounds(row, column) ? row * BOARD_SIZE + column : -1;
}

export class RulesEngine {
  constructor(ruleset = "international") {
    if (!RULESETS[ruleset]) throw new RangeError(`Unsupported ruleset: ${ruleset}`);
    this.ruleset = ruleset;
    this.config = RULESETS[ruleset];
    this.boardSize = this.config.boardSize;
    this.squareCount = this.boardSize * this.boardSize;
  }

  getCaptureOptions(state, from) {
    if (!(state instanceof GameState) && (!state || !Array.isArray(state.squares))) {
      throw new TypeError("A GameState snapshot is required");
    }

    const piece = state.squares[from];
    if (!piece) return [];

    const size = this.boardSize;
    const inBoard = (row, column) => row >= 0 && row < size && column >= 0 && column < size;
    const at = (row, column) => row * size + column;
    const row = Math.floor(from / size);
    const column = from % size;
    const directions = [[-1, -1], [-1, 1], [1, -1], [1, 1]];
    const occupancy = state.squares.map((item) => item ? { ...item } : null);
    const paths = [];

    const search = (current, isKing, captured) => {
      let foundCapture = false;
      if (isKing && this.config.flyingKings) {
        const currentRow = Math.floor(current / size);
        const currentColumn = current % size;
        directions.forEach(([rowStep, columnStep]) => {
          let enemy = null;
          let nextRow = currentRow + rowStep;
          let nextColumn = currentColumn + columnStep;
          while (inBoard(nextRow, nextColumn)) {
            const square = at(nextRow, nextColumn);
            const occupant = occupancy[square];
            if (enemy === null) {
              if (occupant) {
                if (occupant.color !== piece.color) enemy = square;
                else break;
              }
            } else {
              if (occupant) break;
              const nextOccupancy = occupancy.map((item) => item ? { ...item } : null);
              nextOccupancy[current] = null;
              nextOccupancy[enemy] = null;
              nextOccupancy[square] = { color: piece.color, king: true };
              const original = occupancy.map((item) => item ? { ...item } : null);
              for (let i = 0; i < occupancy.length; i++) occupancy[i] = nextOccupancy[i];
              foundCapture = true;
              search(square, true, [...captured, enemy]);
              for (let i = 0; i < occupancy.length; i++) occupancy[i] = original[i];
            }
            nextRow += rowStep;
            nextColumn += columnStep;
          }
        });
      } else {
        const currentRow = Math.floor(current / size);
        const currentColumn = current % size;
        const manDirections = isKing
          ? directions
          : piece.color === "white"
            ? this.config.menCaptureBackward ? directions : [[-1, -1], [-1, 1]]
            : this.config.menCaptureBackward ? directions : [[1, -1], [1, 1]];
        manDirections.forEach(([rowStep, columnStep]) => {
          const enemyRow = currentRow + rowStep;
          const enemyColumn = currentColumn + columnStep;
          const landingRow = currentRow + rowStep * 2;
          const landingColumn = currentColumn + columnStep * 2;
          if (!inBoard(landingRow, landingColumn)) return;
          const enemy = at(enemyRow, enemyColumn);
          const landing = at(landingRow, landingColumn);
          const enemyPiece = occupancy[enemy];
          if (enemyPiece && enemyPiece.color !== piece.color && occupancy[landing] === null) {
            const nextOccupancy = occupancy.map((item) => item ? { ...item } : null);
            nextOccupancy[current] = null;
            nextOccupancy[enemy] = null;
            const promotionRow = landingRow === 0 || landingRow === size - 1;
            const becomesKing = isKing || promotionRow;
            nextOccupancy[landing] = { color: piece.color, king: becomesKing };
            const original = occupancy.map((item) => item ? { ...item } : null);
            for (let i = 0; i < occupancy.length; i++) occupancy[i] = nextOccupancy[i];
            foundCapture = true;
            if (becomesKing && !isKing) {
              paths.push({ to: landing, captures: [...captured, enemy] });
            } else {
              search(landing, becomesKing, [...captured, enemy]);
            }
            for (let i = 0; i < occupancy.length; i++) occupancy[i] = original[i];
          }
        });
      }
      if (!foundCapture && captured.length > 0) {
        paths.push({ to: current, captures: [...captured] });
      }
    };

    search(from, Boolean(piece.king), []);
    if (paths.length === 0) return [];
    if (this.config.longestCaptureMandatory) {
      const longest = Math.max(...paths.map((path) => path.captures.length));
      return paths.filter((path) => path.captures.length === longest);
    }
    return paths;
  }

  getSimpleMoves(state, from) {
    const piece = state.squares[from];
    if (!piece) return [];
    const row = Math.floor(from / this.boardSize);
    const column = from % this.boardSize;
    const inBoard = (nextRow, nextColumn) =>
      nextRow >= 0 && nextRow < this.boardSize &&
      nextColumn >= 0 && nextColumn < this.boardSize;
    const at = (nextRow, nextColumn) => nextRow * this.boardSize + nextColumn;
    const directions = piece.king
      ? [[-1, -1], [-1, 1], [1, -1], [1, 1]]
      : piece.color === "white"
        ? [[-1, -1], [-1, 1]]
        : [[1, -1], [1, 1]];

    const moves = [];
    if (piece.king && this.config.flyingKings) {
      directions.forEach(([rowStep, columnStep]) => {
        let nextRow = row + rowStep;
        let nextColumn = column + columnStep;
        while (inBoard(nextRow, nextColumn)) {
          const square = at(nextRow, nextColumn);
          if (state.squares[square]) break;
          moves.push(square);
          nextRow += rowStep;
          nextColumn += columnStep;
        }
      });
    } else {
      directions.forEach(([rowStep, columnStep]) => {
        const nextRow = row + rowStep;
        const nextColumn = column + columnStep;
        if (!inBoard(nextRow, nextColumn)) return;
        const square = at(nextRow, nextColumn);
        if (state.squares[square] === null) moves.push(square);
      });
    }
    return moves;
  }

  getMandatoryCaptures(state, color) {
    const captures = new Map();
    let longest = 0;
    for (let from = 0; from < this.squareCount; from++) {
      const piece = state.squares[from];
      if (piece && piece.color === color) {
        const options = this.getCaptureOptions(state, from);
        if (options.length > 0) {
          const length = Math.max(...options.map((option) => option.captures.length));
          longest = Math.max(longest, length);
          captures.set(from, options);
        }
      }
    }
    if (this.config.longestCaptureMandatory) {
      for (const [from, options] of captures) {
        const longestForPiece = options.filter(
          (option) => option.captures.length === longest
        );
        captures.set(from, longestForPiece);
        if (longestForPiece.length === 0) captures.delete(from);
      }
    }
    return captures;
  }

  getLegalMoves(state, from) {
    if (!state || !Array.isArray(state.squares)) {
      throw new TypeError("A GameState snapshot is required");
    }
    const piece = state.squares[from];
    if (!piece) return [];

    const captures = this.getCaptureOptions(state, from);
    if (captures.length > 0) return captures.map((option) => option.to);

    const mandatory = this.getMandatoryCaptures(state, piece.color);
    if (mandatory.size > 0) return [];
    return this.getSimpleMoves(state, from);
  }

  getCaptureMoves(state, from) {
    return this.getCaptureOptions(state, from).map((option) => option.to);
  }

  validateMove(state, command) {
    if (!command || !Number.isInteger(command.from) || !Number.isInteger(command.to)) {
      return { valid: false, error: "Move must contain integer from and to squares" };
    }
    const piece = state.squares[command.from];
    if (!piece) return { valid: false, error: "The source square is empty" };
    if (piece.color !== state.turn) return { valid: false, error: "It is not this piece's turn" };
    if (state.squares[command.to]) return { valid: false, error: "The destination square is occupied" };

    const mandatory = this.getMandatoryCaptures(state, piece.color);
    const options = this.getCaptureOptions(state, command.from);
    if (mandatory.size > 0) {
      if (!mandatory.has(command.from)) {
        return { valid: false, error: "A capture is mandatory" };
      }
      const match = options.find((option) => option.to === command.to);
      if (!match) return { valid: false, error: "The capture is illegal" };
      return { valid: true, captures: match.captures, capture: true };
    }

    if (options.length > 0) {
      const match = options.find((option) => option.to === command.to);
      if (match) return { valid: true, captures: match.captures, capture: true };
    }
    if (!this.getSimpleMoves(state, command.from).includes(command.to)) {
      return { valid: false, error: "The move is illegal" };
    }
    return { valid: true, captures: [], capture: false };
  }

  hasLegalMoves(state, color) {
    for (let from = 0; from < this.squareCount; from++) {
      const piece = state.squares[from];
      if (!piece || piece.color !== color) continue;
      if (this.getLegalMoves(state, from).length > 0) return true;
    }
    return false;
  }
}

export class CheckersRules extends RulesEngine {}

export function getLegalMoves(state, from, ruleset = "international") {
  return new RulesEngine(ruleset).getLegalMoves(state, from);
}

export function validateMove(state, command, ruleset = "international") {
  return new RulesEngine(ruleset).validateMove(state, command);
}
