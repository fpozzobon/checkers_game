//Board class that create and command the game
/*jshint esversion: 6 */
const translations = {
  en: {
    title: "Checkers Game",
    description:
      "Play checkers with the computer for free, no sign-in required, easy to use, classic Checkers game!",
    whiteTurn: "White's turn",
    blackTurn: "Black's turn",
    menu: "Menu",
    playMode: "Choose a game mode",
    vsComputer: "Against computer",
    vsLocal: "Against local player (coming soon)",
    vsOnline: "Against online player (coming soon)",
    computerSettings: "Computer game setup",
    playerColor: "Play as",
    back: "Back",
    chooseColor: "Choose your color",
    white: "White",
    black: "Black",
    blackWinsPieces: "Black wins!",
    whiteWinsPieces: "White wins!",
    blackWinsMoves: "Black wins!",
    whiteWinsMoves: "White wins!",
    gameOver: "Game over",
    ok: "OK",
    startGame: "Start Game!",
    restartGame: "Restart",
    options: "Options",
    soundOn: "Turn sound on",
    soundOff: "Turn sound off",
    rules: "Rules",
    results: "Results",
    sound: "Sound On/Off",
    forcedHighlight: "Forced capture highlight",
    language: "Language",
    ruleset: "Rule set",
    flyingKings: "Flying kings",
    britishDraughts: "British draughts",
    difficulty: "Difficulty",
    easy: "Easy",
    medium: "Medium",
    hard: "Hard",
    simpleMove: "Simple move:",
    simpleMoveText:
      "Move a piece one square diagonally forward to an adjacent unoccupied dark square.",
    jump: "Jump (capture an opponent's piece):",
    jumpText:
      "Jump over an opponent's piece to an empty square beyond it. Captures are mandatory. If another capture is available after a jump, it must also be made.",
    king: "King:",
    flyingKingText:
      "A piece that reaches the last row becomes a king. Kings can move any number of empty squares diagonally and capture an opponent from a distance, landing on any empty square beyond it.",
    britishKingText:
      "A piece that reaches the last row becomes a king. Kings move one square diagonally forward or backward and capture by jumping an adjacent piece.",
    endOfGame: "End of game:",
    endOfGameText:
      "A player wins by capturing all opposing pieces or leaving the opponent with no legal moves. A draw occurs if neither side can force a win, or after 30 moves by kings without a capture.",
    player: "Player",
    computer: "Computer",
    resetScore: "Reset Score"
  },
  fr: {
    title: "Jeu de dames",
    description:
      "Jouez aux dames gratuitement contre l'ordinateur, sans inscription. Un jeu de dames classique, simple à utiliser !",
    whiteTurn: "Aux Blancs de jouer",
    blackTurn: "Aux Noirs de jouer",
    menu: "Menu",
    playMode: "Choisissez un mode de jeu",
    vsComputer: "Contre l'ordinateur",
    vsLocal: "Contre un joueur local (bientôt)",
    vsOnline: "Contre un joueur en ligne (bientôt)",
    computerSettings: "Paramètres contre l'ordinateur",
    playerColor: "Jouer avec",
    back: "Retour",
    chooseColor: "Choisissez votre couleur",
    white: "Blancs",
    black: "Noirs",
    blackWinsPieces: "Les Noirs gagnent !",
    whiteWinsPieces: "Les Blancs gagnent !",
    blackWinsMoves: "Les Noirs gagnent !",
    whiteWinsMoves: "Les Blancs gagnent !",
    gameOver: "Fin de la partie",
    ok: "OK",
    startGame: "Commencer",
    restartGame: "Recommencer",
    options: "Options",
    soundOn: "Activer le son",
    soundOff: "Désactiver le son",
    rules: "Règles",
    results: "Résultats",
    sound: "Son activé/désactivé",
    forcedHighlight: "Indiquer les prises obligatoires",
    language: "Langue",
    ruleset: "Variante",
    flyingKings: "Dames volantes",
    britishDraughts: "Dames anglaises",
    difficulty: "Difficulté",
    easy: "Facile",
    medium: "Intermédiaire",
    hard: "Difficile",
    simpleMove: "Déplacement simple :",
    simpleMoveText:
      "Déplacez un pion d'une case en diagonale vers l'avant, sur une case foncée adjacente inoccupée.",
    jump: "Prise d'un pion adverse :",
    jumpText:
      "Sautez par-dessus un pion adverse jusqu'à une case vide située après lui. Les prises sont obligatoires. Si une autre prise est possible après un saut, elle doit également être effectuée.",
    king: "Dame :",
    flyingKingText:
      "Lorsqu'un pion atteint la dernière rangée, il devient une dame. Elle peut se déplacer en diagonale sur plusieurs cases libres et prendre un pion adverse à distance en atterrissant sur une case libre après celui-ci.",
    britishKingText:
      "Lorsqu'un pion atteint la dernière rangée, il devient une dame. Elle se déplace d'une case en diagonale vers l'avant ou l'arrière et prend en sautant par-dessus un pion adjacent.",
    endOfGame: "Fin de partie :",
    endOfGameText:
      "Un joueur gagne en prenant tous les pions adverses ou en empêchant l'adversaire de jouer. La partie est nulle si aucun camp ne peut forcer la victoire, ou après 30 déplacements de dames sans prise.",
    player: "Joueur",
    computer: "Ordinateur",
    resetScore: "Réinitialiser les scores"
  }
};

function getPreferredLanguage() {
  const preferredLanguage =
    navigator.languages && navigator.languages.length > 0
      ? navigator.languages[0]
      : navigator.language;
  return preferredLanguage && /^fr(?:-|$)/i.test(preferredLanguage)
    ? "fr"
    : "en";
}

class Board {
  // Method to create the board
  constructor() {
    const savedLanguage = localStorage.getItem("language");
    this.language =
      savedLanguage === "en" || savedLanguage === "fr"
        ? savedLanguage
        : getPreferredLanguage();
    const savedRuleset = localStorage.getItem("ruleset");
    this.ruleset =
      savedRuleset === "british" || savedRuleset === "flying"
        ? savedRuleset
        : "flying";
    const savedDifficulty = localStorage.getItem("difficulty");
    this.difficulty =
      savedDifficulty === "easy" ||
      savedDifficulty === "medium" ||
      savedDifficulty === "hard"
        ? savedDifficulty
        : "easy";
    this.applyLanguage();
    this.game = document.getElementById("game");
    this.colorPlay = "piece-white";
    this.playerColor = "piece-white";
    this.computerColor = "piece-black";
    this.whiteKing = false;
    this.blackKing = false;
    this.needTake = []; // save pieces that need to take
    // takeIt info to take a piece: actualPieceId, enemySquareId, opositeSquareId
    this.takeIt = [];
    this.pieceTaking = null; //keeps the piece that is taking
    this.moveSound = new Audio("assets/audio/move.mp3");
    this.takeSound = new Audio("assets/audio/capture.mp3");
    this.menu = new Audio("assets/audio/menu.mp3");
    this.turn = 0;
    this.optionHighlight = true;
    this.optionSound = localStorage.getItem("soundEnabled") === "true";
    this.soundToggle = document.getElementById("sound-toggle");
    this.updateSoundToggle();
    this.soundToggle.addEventListener("click", () => {
      this.optionSound = !this.optionSound;
      localStorage.setItem("soundEnabled", String(this.optionSound));
      this.updateSoundToggle();
      this.playSound("menu");
    });
    this.menuIsOpen = true;
    this.isPlaying = false;
    this.gameOver = false;

    // prepare for score saving
    if (localStorage.getItem("whiteScore") == null) {
      localStorage.setItem("whiteScore", "0");
    }
    if (localStorage.getItem("blackScore") == null) {
      localStorage.setItem("blackScore", "0");
    }

    // create squares
    let color = "white";
    for (let i = 0; i < 64; i++) {
      color = color == "black" ? "white" : "black";
      if (i % 8 == 0) {
        color = color == "black" ? "white" : "black"; // invert the color to the next row
      }
      const newDiv = document.createElement("div");
      newDiv.className = "square";
      newDiv.classList.add(color);
      newDiv.id = i;
      newDiv.setAttribute("occupied", "false");
      this.game.appendChild(newDiv);
    }
  }

  translate(key) {
    return translations[this.language][key];
  }

  applyLanguage() {
    document.documentElement.lang = this.language;
    document.title = this.translate("title");
    document
      .querySelector('meta[name="description"]')
      .setAttribute("content", this.translate("description"));
  }

  setLanguage(language) {
    if (language !== "en" && language !== "fr") {
      throw new RangeError(`Unsupported language: ${language}`);
    }
    this.language = language;
    localStorage.setItem("language", language);
    this.applyLanguage();
    this.updateSoundToggle();
    if (this.isPlaying && this.colorPlay === this.playerColor) {
      document.getElementById("messages").textContent =
        this.translate(
          this.playerColor === "piece-white" ? "whiteTurn" : "blackTurn"
        );
    }
  }

  updateSoundToggle() {
    this.soundToggle.textContent = this.optionSound ? "\u{1f50a}" : "\u{1f507}";
    this.soundToggle.setAttribute(
      "aria-label",
      this.translate(this.optionSound ? "soundOff" : "soundOn")
    );
    this.soundToggle.setAttribute("aria-pressed", String(this.optionSound));
  }

  setPlayerColor(color) {
    if (color !== "white" && color !== "black") {
      throw new RangeError(`Unsupported player color: ${color}`);
    }
    this.playerColor = `piece-${color}`;
    this.computerColor = color === "white" ? "piece-black" : "piece-white";
  }

  setRuleset(ruleset) {
    if (ruleset !== "flying" && ruleset !== "british") {
      throw new RangeError(`Unsupported ruleset: ${ruleset}`);
    }
    this.ruleset = ruleset;
    localStorage.setItem("ruleset", ruleset);

    if (!this.isPlaying || this.colorPlay !== this.playerColor) {
      return;
    }

    document.querySelectorAll(".possible, .moving").forEach((square) => {
      square.classList.remove("possible", "moving");
    });
    const playerPieces = document.querySelectorAll(`.${this.playerColor}`);
    playerPieces.forEach((piece) => {
      piece.classList.remove("highlight");
      piece.movable = true;
    });
    this.takeIt = [];
    this.needTake = [];
    if (!this.checkIfcanTake(playerPieces)) {
      playerPieces.forEach((piece) => {
        piece.movable = true;
        this.checkpossibleMove(piece);
      });
    }
  }

  setDifficulty(difficulty) {
    if (
      difficulty !== "easy" &&
      difficulty !== "medium" &&
      difficulty !== "hard"
    ) {
      throw new RangeError(`Unsupported difficulty: ${difficulty}`);
    }
    this.difficulty = difficulty;
    localStorage.setItem("difficulty", difficulty);
  }

  // Method to start the game
  startGame() {
    /* Start the game*/
    this.gameOver = false;
    this.createPieces();
    this.removeMoving();
    this.gameControl();
  }

  // Method to control the game turns
  gameControl() {
    /* Method to control the game turns*/
    this.turn += 1;
    if (this.colorPlay === this.playerColor) {
      const message = document.getElementById("messages");
      message.textContent = this.translate(
        this.playerColor === "piece-white" ? "whiteTurn" : "blackTurn"
      );
      const computerPieces = document.querySelectorAll(`.${this.computerColor}`);
      computerPieces.forEach((item) => {
        item.movable = false;
        item.addEventListener("click", this.pieceClick);
      });
      this.promoteToKing(computerPieces);
      setTimeout(() => {
        this.checkWinner();
      }, 1000);

      const playerPieces = document.querySelectorAll(`.${this.playerColor}`);
      if (!this.checkIfcanTake(playerPieces)) {
        playerPieces.forEach((item) => {
          item.movable = true;
          item.addEventListener("click", this.pieceClick);
          this.checkpossibleMove(item);
        });
      }
    } else {
      const message = document.getElementById("messages");
      message.innerHTML = "";
      let highlightPieces = document.querySelectorAll(".highlight");
      highlightPieces.forEach((item) => {
        item.classList.remove("highlight");
      });

      const playerPieces = document.querySelectorAll(`.${this.playerColor}`);
      playerPieces.forEach((item) => {
        item.movable = false;
      });
      this.promoteToKing(playerPieces);
      setTimeout(() => {
        this.checkWinner();
      }, 1000);
      const computerPieces = document.querySelectorAll(`.${this.computerColor}`);
      computerPieces.forEach((item) => {
        item.movable = false;
        this.checkpossibleMove(item);
      });
      let timeMove;
      if (this.difficulty === "easy") {
        timeMove = Math.random() * 2000 + 1800;
      } else if (this.difficulty === "medium") {
        timeMove = Math.random() * 1300 + 1200;
      } else {
        timeMove = Math.random() * 700 + 550;
      }
      setTimeout(() => board.computerMove(), timeMove);
    }
    board.pieceTaking = null;
  }

  // Method to create pieces
  createPieces() {
    /* Create the pieces on the board*/
    const blackPieces = [1, 3, 5, 7, 8, 10, 12, 14, 17, 19, 21, 23];
    const whitePieces = [40, 42, 44, 46, 49, 51, 53, 55, 56, 58, 60, 62];
    // get squares
    const squares = document.querySelectorAll(".square");
    // create pieces
    for (let i = 0; i < 64; i++) {
      const bPiece = new Piece("black");
      const wPiece = new Piece("white");
      if (blackPieces.includes(i)) {
        squares[i].appendChild(bPiece.get_piece(100 + i));
        squares[i].setAttribute("occupied", "true");
      }
      if (whitePieces.includes(i)) {
        squares[i].appendChild(wPiece.get_piece(200 + i));
        squares[i].setAttribute("occupied", "true");
      }
    }
  }

  // Method to avoid bug of piece being moved to another square
  removeMoving() {
    document.addEventListener("movestart", (event) => {
      event.preventDefault();
      const oldPossibleMoves = document.querySelectorAll(".possible");
      if (oldPossibleMoves.length > 0) {
        oldPossibleMoves.forEach((item) => {
          item.classList.remove("possible");
        });
      }
    });
  }

  // Method to add click event listeners
  pieceClick(e) {
    /* Method to add click event listeners to the pieces*/
    if (e.target.suppressClick) {
      return false;
    }
    const moving = document.querySelectorAll(".moving");
    moving.forEach((item) => {
      item.classList.remove("moving");
    });
    const oldPossibleMoves = document.querySelectorAll(".possible");
    if (oldPossibleMoves.length > 0) {
      oldPossibleMoves.forEach((item) => {
        item.classList.remove("possible");
      });
    }
    if (e.target.classList[0] == "piece" && e.target.movable) {
      e.target.classList.add("moving");
      // check for possible moves
      const possibleMove = board.checkpossibleMove(e.target);
      if (possibleMove.length > 0) {
        possibleMove.forEach((item) => {
          const square = document.getElementById(item);
          square.classList.add("possible");
          square.addEventListener("click", board.movePiece);
        });
      } else {
        e.target.classList.remove("moving");
      }
    } else {
      return false;
    }
  }

  // add square click to possible squares
  movePiece(e) {
    /* Method to move the piece to the square*/

    if (e.target.classList[2] == "possible") {
      board.playSound("move");
      const piece = document.querySelector(".moving");
      const square = document.getElementById(e.target.id);
      const oldSquare = document.getElementById(piece.parentNode.id);
      // move piece
      square.appendChild(piece);
      // check if took piece
      if (board.takeIt.length > 0) {
        for (let i = 0; i < board.takeIt.length; i++) {
          let item = board.takeIt[i];
          const movPiece = item[0];
          const enemySquareId = item[1];
          const opositeSquare = document.getElementById(item[2]);
          if (movPiece == piece && opositeSquare == square) {
            board.playSound("take");
            // remove enemy piece
            const enemySquare = document.getElementById(enemySquareId);
            const outPiece = enemySquare.firstChild;
            const capturedColor = outPiece.classList.contains("piece-white")
              ? "white"
              : "black";
            outPiece.classList.remove(`piece-${capturedColor}`);
            outPiece.classList.add(`piece-out-${capturedColor}`);
            const captureTray = document.getElementById(
              piece.classList.contains("piece-white") ? "removedw" : "removedb"
            );
            captureTray.appendChild(outPiece);
            // remove from board
            enemySquare.innerHTML = "";
            enemySquare.setAttribute("occupied", "false");
            // check if can take again
            board.takeIt = [];
            board.needTake = [];
            if (board.checkIfcanTake([piece])) {
              board.needTake = [];
              board.takeIt = [];
              // player can take again
              board.invertPlayerTurn();
              break;
            }
          }
        }
      }
      piece.classList.remove("moving");
      // remove possible class
      const dragSquares = document.querySelectorAll(".possible");
      dragSquares.forEach((item) => {
        item.classList.remove("possible");
      });
      // remove occupied from old square
      oldSquare.setAttribute("occupied", "false");
      square.setAttribute("occupied", "true");
      board.invertPlayerTurn();
      this.pieceTaking = null;
      board.gameControl();
    }
  }

  // Method to move the computer piece automatically and take if possible
  computerMove() {
    /* Method to move the computer piece automatically and take if possible */
    if (this.gameOver) {
      return;
    }

    const computerPieces = document.querySelectorAll(`.${this.computerColor}`);
    let piecesToCheck = this.pieceTaking ? [this.pieceTaking] : computerPieces;
    let captureOptions = this.getComputerCaptures(piecesToCheck);
    let captureCount = 0;

    if (captureOptions.length > 0) {
      while (captureOptions.length > 0 && captureCount < 12) {
        this.takeIt = captureOptions;
        board.takePiece();
        captureCount++;
        captureOptions = this.getComputerCaptures([this.pieceTaking]);
      }
    } else {
      board.moveComputerPiece();
    }
    this.pieceTaking = null;
    board.invertPlayerTurn();
    board.gameControl();
  }

  getComputerCaptures(pieces) {
    this.takeIt = [];
    this.needTake = [];
    pieces.forEach((piece) => {
      this.checkpossibleMove(piece);
    });
    return this.takeIt.slice();
  }

  scoreComputerMove(piece, destination, capturedSquare = null) {
    const source = piece.parentNode;
    const capturedPiece = capturedSquare ? capturedSquare.firstChild : null;
    const wasKing = piece.isKing;

    source.removeChild(piece);
    destination.appendChild(piece);
    if (capturedPiece) {
      capturedSquare.removeChild(capturedPiece);
    }

    const destinationId = Number(destination.id);
    const promotes =
      !wasKing &&
      (this.computerColor === "piece-white"
        ? destinationId < 8
        : destinationId > 55);
    if (promotes) {
      piece.isKing = true;
    }

    let immediateCaptures = 0;
    let capturesOfMovedPiece = 0;
    const playerPieces = document.querySelectorAll(`.${this.playerColor}`);
    playerPieces.forEach((playerPiece) => {
      this.takeIt = [];
      this.needTake = [];
      this.checkpossibleMove(playerPiece);
      this.takeIt.forEach((capture) => {
        immediateCaptures++;
        if (capture[1] == destination.id) {
          capturesOfMovedPiece++;
        }
      });
    });

    this.takeIt = [];
    this.needTake = [];
    const mobility = this.checkpossibleMove(piece).length;
    const row = Math.floor(Number(destination.id) / 8);
    const column = Number(destination.id) % 8;
    const centerDistance = Math.abs(column - 3.5) + Math.abs(row - 3.5);
    const advancement = this.computerColor === "piece-white" ? -row : row;
    const score =
      advancement * 2 +
      mobility * 2 -
      centerDistance +
      (promotes ? 80 : 0) -
      capturesOfMovedPiece * 100 -
      (immediateCaptures - capturesOfMovedPiece) * 10;

    piece.isKing = wasKing;
    source.appendChild(piece);
    if (capturedPiece) {
      capturedSquare.appendChild(capturedPiece);
    }

    this.takeIt = [];
    this.needTake = [];
    return score;
  }

  // take a piece
  takePiece() {
    /* Method to take a piece */
    let group = null;
    let piece;
    let enemySquare;
    let oppositeSquare;
    let bestScore = -Infinity;
    const validOptions = board.takeIt.filter((option) => {
      return !this.pieceTaking || option[0] == this.pieceTaking;
    });

    if (
      validOptions.length > 0 &&
      (this.difficulty === "easy" ||
        (this.difficulty === "medium" && Math.random() < 0.35))
    ) {
      group =
        validOptions[Math.floor(Math.random() * validOptions.length)];
    } else {
      validOptions.forEach((option) => {
      if (this.pieceTaking && option[0] != this.pieceTaking) {
        return;
      }
      const target = document.getElementById(option[2]);
      const victim = document.getElementById(option[1]);
      const score = this.scoreComputerMove(option[0], target, victim);
      if (score > bestScore) {
        bestScore = score;
        group = option;
      }
      });
    }

    if (!group) {
      return false;
    }

    board.playSound("take");
    piece = group[0];
    this.pieceTaking = piece;
    enemySquare = document.getElementById(group[1]);
    oppositeSquare = document.getElementById(group[2]);
    const outPiece = enemySquare.firstChild;
    const playerColor = this.playerColor.slice("piece-".length);
    outPiece.classList.remove(this.playerColor);
    outPiece.classList.add(`piece-out-${playerColor}`);
    const captureTray = document.getElementById(
      this.computerColor === "piece-white" ? "removedw" : "removedb"
    );
    captureTray.appendChild(outPiece);
    piece.parentNode.removeChild(piece);
    oppositeSquare.appendChild(piece);
    enemySquare.innerHTML = "";
    enemySquare.setAttribute("occupied", "false");
    oppositeSquare.setAttribute("occupied", "true");
    return true;
  }

  // Method to move a piece
  moveComputerPiece() {
    /* Method to move a piece */
    let bestMove = null;
    let bestScore = -Infinity;
    const possibleMoves = [];
    const computerPieces = document.querySelectorAll(`.${this.computerColor}`);
    computerPieces.forEach((piece) => {
      const pieceMoves = this.checkpossibleMove(piece);
      pieceMoves.forEach((moveId) => {
        const destination = document.getElementById(moveId);
        const score = this.scoreComputerMove(piece, destination);
        possibleMoves.push([piece, destination, score]);
        if (score > bestScore) {
          bestScore = score;
          bestMove = [piece, destination];
        }
      });
    });

    if (possibleMoves.length > 0) {
      if (this.difficulty === "easy") {
        bestMove =
          possibleMoves[Math.floor(Math.random() * possibleMoves.length)];
      } else if (
        this.difficulty === "medium" &&
        Math.random() < 0.35
      ) {
        bestMove =
          possibleMoves[Math.floor(Math.random() * possibleMoves.length)];
      }
    }

    if (!bestMove) {
      return false;
    }

    const piece = bestMove[0];
    const destination = bestMove[1];
    const source = piece.parentNode;
    board.playSound("move");
    destination.appendChild(piece);
    destination.setAttribute("occupied", "true");
    source.setAttribute("occupied", "false");
    return true;
  }

  // Method to check if there is forced take for the pieces
  checkIfcanTake(pieces) {
    /* Check if any piece can take another
    Input (arr(obj)): Pieces

    Output (boolean): true if piece can take */

    this.needTake = [];
    pieces.forEach((item) => {
      this.checkpossibleMove(item);
    });
    if (this.needTake.length > 0) {
      this.needTake.forEach((item) => {
        item.movable = true;
        if (this.optionHighlight && item.classList.contains(this.playerColor)) {
          item.classList.add("highlight");
        }
      });
      // freeze the rest
      pieces.forEach((item) => {
        if (!this.needTake.includes(item)) {
          item.movable = false;
        }
      });
      return true;
    } else {
      return false;
    }
  }

  // Promote to king
  promoteToKing(pieces) {
    /* Change the piece to king if it reaches the end of the board
    Input (obj): Piece
    */

    pieces.forEach((item) => {
      if (item.classList.contains("piece-white") && item.parentNode.id < 8) {
        item.classList.add("white-king");
        item.isKing = true;
      } else if (
        item.classList.contains("piece-black") &&
        item.parentNode.id > 55
      ) {
        item.classList.add("black-king");
        item.isKing = true;
      }
    });
  }

  updateScore(color) {
    /* Update the score
    Input (str): Color of the piece
    */

    const scoreKey =
      `piece-${color}` === this.playerColor ? "whiteScore" : "blackScore";
    let score = localStorage.getItem(scoreKey);
    if (score == null) {
      score = 0;
    } else {
      score = parseInt(score) + 1;
      localStorage.setItem(scoreKey, String(score));
    }
  }

  // check winner
  checkWinner() {
    /* Check if there is a winner */
    if (this.gameOver) {
      return -1;
    }

    let whitePiecesLeft = 0;
    let blackPiecesLeft = 0;

    // No pieces left
    const whitePieces = document.querySelectorAll(".piece-white");
    const blackPieces = document.querySelectorAll(".piece-black");
    whitePieces.forEach((item) => {
      whitePiecesLeft += this.checkpossibleMove(item).length;
    });
    blackPieces.forEach((item) => {
      blackPiecesLeft += this.checkpossibleMove(item).length;
    });

    if (whitePieces.length == 0) {
      this.updateScore("black");
      this.showGameOver(this.translate("blackWinsPieces"));
      return -1;
    } else if (blackPieces.length == 0) {
      this.updateScore("white");
      this.showGameOver(this.translate("whiteWinsPieces"));
      return -1;
    } else if (whitePiecesLeft == 0) {
      this.updateScore("black");
      this.showGameOver(this.translate("blackWinsMoves"));
      return -1;
    } else if (blackPiecesLeft == 0) {
      this.updateScore("white");
      this.showGameOver(this.translate("whiteWinsMoves"));
      return -1;
    }
  }

  showGameOver(message) {
    this.gameOver = true;
    const overlay = document.createElement("div");
    overlay.id = "game-over";
    overlay.className = "game-over";
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-modal", "true");
    overlay.setAttribute("aria-labelledby", "game-over-title");

    const card = document.createElement("div");
    card.className = "game-over-card";
    const heading = document.createElement("h2");
    heading.id = "game-over-title";
    heading.textContent = this.translate("gameOver");
    const result = document.createElement("p");
    result.textContent = message;
    const button = document.createElement("button");
    button.className = "game-over-button";
    button.type = "button";
    button.textContent = this.translate("ok");

    card.append(heading, result, button);
    overlay.appendChild(card);
    this.game.appendChild(overlay);

    const returnToMenu = () => location.reload();
    button.addEventListener("click", returnToMenu);
    overlay.addEventListener("click", (event) => {
      if (event.target === overlay) {
        returnToMenu();
      }
    });
    button.focus();
  }

  // play sound
  playSound(soundType) {
    /* Play sound */
    if (this.optionSound) {
      if (soundType == "move") {
        this.moveSound.play();
      } else if (soundType == "take") {
        this.takeSound.play();
      } else if (soundType == "menu") {
        this.menu.play();
      } else if (soundType == "notify") {
        this.notify.play();
      }
    }
  }

  // invert Player turn
  invertPlayerTurn() {
    /* Invert the player turn */
    const colors = ["piece-white", "piece-black"];
    if (this.colorPlay == colors[0]) {
      this.colorPlay = colors[1];
    } else {
      this.colorPlay = colors[0];
    }
  }

  // Method to check possible targets
  checkpossibleMove(pieceToCheck = null) {
    /* This method will check the possible moves for the piece that is being moved
    and will return an array with the possible squares

    Inpunt: pieceToCheck = can be a piece or null, when null,
    the method will check the piece that is being moved

    Output: returns an array of possible squares or array of squares to take a piece
    or an empty array if there is no possible move.
    */

    let taking = [];
    // left corners
    const leftCorners = [8, 24, 40, 56];
    // right corners
    const rightCorners = [7, 23, 39, 55];
    // white top corners
    const whiteTopCorners = [1, 3, 5, 7];
    // black top corners
    const blackTopCorners = [56, 58, 60, 62];
    // get piece
    let movPiece = document.querySelector(".moving");
    if (pieceToCheck) {
      movPiece = pieceToCheck;
    }
    if (!movPiece) {
      return false;
    }
    // get piece color
    const pieceColor = movPiece.classList[1];
    // get piece id
    const pieceId = parseInt(movPiece.parentNode.id);
    // get piece position
    let possibleMoves = [];
    if (movPiece.isKing && this.ruleset === "flying") {
      const directions = [
        [-1, -1],
        [-1, 1],
        [1, -1],
        [1, 1]
      ];
      const row = Math.floor(pieceId / 8);
      const column = pieceId % 8;
      const flyingMoves = [];
      const flyingCaptures = [];

      directions.forEach(([rowStep, columnStep]) => {
        let nextRow = row + rowStep;
        let nextColumn = column + columnStep;
        let enemySquareId = null;
        while (
          nextRow >= 0 &&
          nextRow < 8 &&
          nextColumn >= 0 &&
          nextColumn < 8
        ) {
          const squareId = nextRow * 8 + nextColumn;
          const square = document.getElementById(squareId);
          if (!square.hasChildNodes()) {
            if (enemySquareId === null) {
              flyingMoves.push(squareId);
            } else {
              flyingCaptures.push([movPiece, enemySquareId, squareId]);
            }
          } else if (
            enemySquareId === null &&
            !square.firstChild.classList.contains(pieceColor)
          ) {
            enemySquareId = squareId;
          } else {
            break;
          }
          nextRow += rowStep;
          nextColumn += columnStep;
        }
      });

      if (flyingCaptures.length > 0) {
        this.needTake.push(movPiece);
        flyingCaptures.forEach((capture) => this.takeIt.push(capture));
        return flyingCaptures.map((capture) => capture[2]);
      }
      return flyingMoves;
    }

    // check if is a isKing
    if (movPiece.isKing) {
      possibleMoves.push(pieceId - 9);
      possibleMoves.push(pieceId - 7);
      possibleMoves.push(pieceId + 7);
      possibleMoves.push(pieceId + 9);
      // check for borders for King
      if (leftCorners.includes(pieceId)) {
        possibleMoves = possibleMoves.filter((item) => item != pieceId - 9);
        possibleMoves = possibleMoves.filter((item) => item != pieceId + 7);
      }
      if (rightCorners.includes(pieceId)) {
        possibleMoves = possibleMoves.filter((item) => item != pieceId - 7);
        possibleMoves = possibleMoves.filter((item) => item != pieceId + 9);
      }
      if (whiteTopCorners.includes(pieceId)) {
        possibleMoves = possibleMoves.filter((item) => item != pieceId - 9);
        possibleMoves = possibleMoves.filter((item) => item != pieceId - 7);
      }
      if (blackTopCorners.includes(pieceId)) {
        possibleMoves = possibleMoves.filter((item) => item != pieceId + 7);
        possibleMoves = possibleMoves.filter((item) => item != pieceId + 9);
      }
    } else {
      switch (pieceColor) {
        case "piece-white":
          possibleMoves.push(pieceId - 9);
          possibleMoves.push(pieceId - 7);
          if (leftCorners.includes(pieceId)) {
            possibleMoves.shift();
          }
          if (rightCorners.includes(pieceId)) {
            possibleMoves.pop();
          }
          break;
        case "piece-black":
          possibleMoves.push(pieceId + 9);
          possibleMoves.push(pieceId + 7);
          if (leftCorners.includes(pieceId)) {
            possibleMoves.pop();
          }
          if (rightCorners.includes(pieceId)) {
            possibleMoves.shift();
          }
          break;
      }
    }
    // check for pieces on the way
    if (possibleMoves.length > 0 && possibleMoves != null) {
      for (let i = 0; i < possibleMoves.length + 1; i++) {
        const targetSquare = document.getElementById(possibleMoves[i]);
        try {
          if (targetSquare != null && targetSquare.hasChildNodes()) {
            // square has piece of same color
            if (targetSquare.firstChild.classList[1] == pieceColor) {
              // remove move
              possibleMoves.splice(i, 1);
              i--;
              // if square has piece of different color
            } else if (targetSquare.firstChild.classList[1] != pieceColor) {
              // check if the next square is occupied
              let targetSquare = this.canTake(possibleMoves[i], movPiece);
              if (targetSquare) {
                // send the square with the piece to take and the square to move to
                taking.push(targetSquare);
              }
              possibleMoves.splice(i, 1);
              i--;
            }
          }
        } catch (err) {
          continue;
        }
        // There is no position to go! (out of the board)
        if (possibleMoves[i] < 0 || possibleMoves[i] > 63) {
          possibleMoves.splice(i, 1);
          i--;
        }
      }
    }
    // check if there is nan
    if (possibleMoves.includes(NaN)) {
      return false;
    }
    // check if there is a taking
    if (taking.length > 0) {
      return taking;
    }
    return possibleMoves;
  }

  // Method to check if the piece can take another piece
  canTake(enemySquareId, pieceToCheck) {
    // define corners
    const corners = [1, 3, 5, 7, 8, 24, 40, 56, 58, 60, 62, 55, 39, 23];
    // check if the oposite square is occupied
    let movPiece = document.querySelector(".moving");
    if (pieceToCheck) {
      movPiece = pieceToCheck;
    }
    // test for different directions
    const piecePositionId = parseInt(movPiece.parentNode.id);
    // target piece position
    if (corners.includes(enemySquareId)) {
      return false;
    } else {
      let relation = enemySquareId - piecePositionId;
      let opositeSquareId = enemySquareId + relation;
      const opositeSquare = document.getElementById(opositeSquareId);
      if (opositeSquare.hasChildNodes()) {
        return false;
      } else {
        // movePiece : piece that need to move
        this.needTake.push(movPiece);
        // enemySquare : square with the piece to take
        this.takeIt.push([movPiece, enemySquareId, opositeSquareId]);
        return opositeSquareId;
      }
    }
  }

  // Method to enable drag-to-move on a piece
  setupPieceDrag(piece) {
    piece.draggable = false;
    let dragStarted = false;
    let startX = 0;
    let startY = 0;
    let dragPreview = null;
    let grabOffsetX = 0;
    let grabOffsetY = 0;

    const removeDragPreview = () => {
      if (dragPreview) {
        dragPreview.remove();
        dragPreview = null;
      }
      piece.classList.remove("dragging");
      piece.style.pointerEvents = "";
    };

    piece.addEventListener("pointerdown", (event) => {
      if (!piece.movable || event.button !== 0) {
        return;
      }
      event.preventDefault();
      dragStarted = false;
      startX = event.clientX;
      startY = event.clientY;
      const rect = piece.getBoundingClientRect();
      grabOffsetX = event.clientX - rect.left;
      grabOffsetY = event.clientY - rect.top;
      piece.setPointerCapture(event.pointerId);
    });

    piece.addEventListener("dragstart", (event) => {
      event.preventDefault();
    });

    piece.addEventListener("pointermove", (event) => {
      if (!piece.hasPointerCapture(event.pointerId)) {
        return;
      }
      const distance = Math.hypot(event.clientX - startX, event.clientY - startY);
      if (!dragStarted && distance > 6) {
        dragStarted = true;
        board.pieceClick({ target: piece });
        piece.classList.add("dragging");

        const rect = piece.getBoundingClientRect();
        dragPreview = piece.cloneNode(false);
        dragPreview.removeAttribute("id");
        dragPreview.classList.add("drag-preview");
        dragPreview.style.width = rect.width + "px";
        dragPreview.style.height = rect.height + "px";
        dragPreview.style.left = event.clientX - grabOffsetX + "px";
        dragPreview.style.top = event.clientY - grabOffsetY + "px";
        document.body.appendChild(dragPreview);
      }
      if (dragStarted) {
        dragPreview.style.left = event.clientX - grabOffsetX + "px";
        dragPreview.style.top = event.clientY - grabOffsetY + "px";
      }
    });

    piece.addEventListener("pointerup", (event) => {
      if (!piece.hasPointerCapture(event.pointerId)) {
        return;
      }
      piece.releasePointerCapture(event.pointerId);

      if (!dragStarted) {
        return;
      }

      removeDragPreview();

      // Ignore the synthetic click generated after a drag.
      piece.suppressClick = true;
      setTimeout(() => {
        piece.suppressClick = false;
      }, 100);

      const target = document.elementFromPoint(event.clientX, event.clientY);
      let square = target ? target.closest(".square") : null;
      if (square && !square.classList.contains("possible")) {
        const capture = board.takeIt
          .filter(
            (item) =>
              item[0] === piece &&
              item[1] === Number(square.id)
          )
          .sort((first, second) =>
            Math.abs(first[2] - first[1]) - Math.abs(second[2] - second[1])
          )[0];
        if (capture) {
          square = document.getElementById(capture[2]);
        }
      }
      if (square && square.classList.contains("possible")) {
        board.movePiece({ target: square });
      }
      dragStarted = false;
    });

    piece.addEventListener("pointercancel", () => {
      removeDragPreview();
      dragStarted = false;
    });
  }
}

// Piece class to create pieces
class Piece {
  constructor(color) {
    this.color = color;
    this.isKing = false;
    this.piece = document.createElement("div");
    this.piece.className = "piece";
    this.piece.classList.add("piece-" + color);
  }
  // create a new piece
  get_piece(id) {
    this.piece.id = id;
    board.setupPieceDrag(this.piece);
    return this.piece;
  }
}

// Menu class
class Menu {
  /* Menu class to create the menu and the buttons */

  createMenu() {
    /* Create menu */
    document.querySelectorAll(".menu-hidden").forEach((button) => {
      button.remove();
    });
    const menu = document.createElement("div");
    menu.id = "menu";
    menu.classList.add("menu");
    if (board.isPlaying) {
      menu.classList.add("is-playing");
      menu.innerHTML = `
        <div id="close-menu"><i class="far fa-times-circle"></i></div>
        <div class="menu-title">${board.translate("menu")}</div>
        <button class="menu-item menu-action" id="restart-game" type="button">${board.translate(
          "restartGame"
        )}</button>
        <button class="menu-item menu-action" id="rules" type="button">${board.translate(
          "rules"
        )}</button>
        <button class="menu-item menu-action" id="results" type="button">${board.translate(
          "results"
        )}</button>`;
    } else {
      menu.classList.add("menu-main");
      menu.innerHTML = `
        <div class="menu-title">${board.translate("playMode")}</div>
        <button class="menu-item menu-action" id="vs-computer" type="button">${board.translate(
          "vsComputer"
        )}</button>
        <button class="menu-item menu-action" id="vs-local" type="button" disabled>${board.translate(
          "vsLocal"
        )}</button>
        <button class="menu-item menu-action" id="vs-online" type="button" disabled>${board.translate(
          "vsOnline"
        )}</button>
        <div class="menu-divider"></div>
        <div class="menu-footer">
          <button class="menu-footer-button" id="options" type="button">${board.translate(
            "options"
          )}</button>
          <button class="menu-footer-button" id="rules" type="button">${board.translate(
            "rules"
          )}</button>
          <button class="menu-footer-button" id="results" type="button">${board.translate(
            "results"
          )}</button>
        </div>`;
    }
    board.game.appendChild(menu);

    const closeButton = document.getElementById("close-menu");
    if (closeButton) {
      closeButton.addEventListener("click", () => this.closeMenu());
    }
    const restartButton = document.getElementById("restart-game");
    if (restartButton) {
      restartButton.addEventListener("click", () => location.reload());
    }
    const computerButton = document.getElementById("vs-computer");
    if (computerButton) {
      computerButton.addEventListener("click", () => {
        board.playSound("menu");
        this.setupComputerGame();
      });
    }
    const optionsButton = document.getElementById("options");
    if (optionsButton) {
      optionsButton.addEventListener("click", () => {
        board.playSound("menu");
        this.options();
      });
    }
    document.getElementById("rules").addEventListener("click", () => {
      board.playSound("menu");
      this.rules();
    });
    document.getElementById("results").addEventListener("click", () => {
      board.playSound("menu");
      this.results();
    });
  }

  setupComputerGame() {
    const menu = document.getElementById("menu");
    menu.classList.remove("menu-main");
    menu.classList.add("menu-setup");
    menu.innerHTML = `
      <div class="menu-title">${board.translate("computerSettings")}</div>
      <div class="setup-control" id="player-color-control">
        <label class="submenu" for="player-color-select">${board.translate(
          "playerColor"
        )}</label>
        <select id="player-color-select">
          <option value="white" ${
            board.playerColor === "piece-white" ? "selected" : ""
          }>${board.translate("white")}</option>
          <option value="black" ${
            board.playerColor === "piece-black" ? "selected" : ""
          }>${board.translate("black")}</option>
        </select>
      </div>
      <div class="setup-control" id="difficulty-control">
        <label class="submenu" for="difficulty-select">${board.translate(
          "difficulty"
        )}</label>
        <select id="difficulty-select">
          <option value="easy" ${
            board.difficulty === "easy" ? "selected" : ""
          }>${board.translate("easy")}</option>
          <option value="medium" ${
            board.difficulty === "medium" ? "selected" : ""
          }>${board.translate("medium")}</option>
          <option value="hard" ${
            board.difficulty === "hard" ? "selected" : ""
          }>${board.translate("hard")}</option>
        </select>
      </div>
      <div class="setup-control" id="ruleset-control">
        <label class="submenu" for="ruleset-select">${board.translate(
          "ruleset"
        )}</label>
        <select id="ruleset-select">
          <option value="flying" ${
            board.ruleset === "flying" ? "selected" : ""
          }>${board.translate("flyingKings")}</option>
          <option value="british" ${
            board.ruleset === "british" ? "selected" : ""
          }>${board.translate("britishDraughts")}</option>
        </select>
      </div>
      <button class="menu-item menu-action start-button" id="start-computer" type="button">${board.translate(
        "startGame"
      )}</button>
      <button class="submenu setup-back" id="setup-back" type="button">${board.translate(
        "back"
      )}</button>`;

    document.getElementById("difficulty-select").addEventListener("change", (event) => {
      board.setDifficulty(event.target.value);
    });
    document.getElementById("ruleset-select").addEventListener("change", (event) => {
      board.setRuleset(event.target.value);
    });
    document.getElementById("start-computer").addEventListener("click", () => {
      board.playSound("menu");
      board.setPlayerColor(
        document.getElementById("player-color-select").value
      );
      board.startGame();
      board.isPlaying = true;
      board.menuIsOpen = false;
      this.hiddenMenu();
    });
    document.getElementById("setup-back").addEventListener("click", () => {
      board.playSound("menu");
      this.clearMenu();
      this.createMenu();
    });
  }

  closeMenu() {
    if (!board.isPlaying) {
      return;
    }
    board.playSound("menu");
    this.hiddenMenu();
    board.menuIsOpen = false;
  }

  //Hidden menu method
  hiddenMenu() {
    if (!board.isPlaying) {
      return;
    }
    const smallMenu = document.createElement("div");
    smallMenu.classList.add("menu-hidden");
    board.game.appendChild(smallMenu);
    board.game.removeChild(document.getElementById("menu"));
    smallMenu.innerHTML = `<i class="fa fa-cog" aria-hidden="true"></i>`;

    smallMenu.addEventListener("click", () => {
      board.playSound("menu");
      if (!board.menuIsOpen) {
        this.createMenu();
        board.menuIsOpen = true;
      } else if (board.menuIsOpen) {
        this.hiddenMenu();
        board.menuIsOpen = false;
      }
    });
  }

  // Menu options
  options() {
    const menu = document.getElementById("menu");
    menu.classList.add("menu-options");
    menu.innerHTML = `
      <div id="close-menu"><i class="far fa-times-circle"></i></div>
      <div class="menu-title">${board.translate("options")}</div>
      <div class="submenu" id="highlight">
        <span>${board.translate("forcedHighlight")}</span>
        <label class="switch" id="highlight-switch">
          <input type="checkbox" ${board.optionHighlight ? "checked" : ""}>
          <span class="slider round"></span>
        </label>
      </div>
      <div id="language-control">
        <label class="submenu" for="language-select">${board.translate(
          "language"
        )}</label>
        <select id="language-select">
          <option value="en" ${
            board.language === "en" ? "selected" : ""
          }>English</option>
          <option value="fr" ${
            board.language === "fr" ? "selected" : ""
          }>Français</option>
        </select>
      </div>
      <button class="submenu setup-back" id="back" type="button">${board.translate(
        "back"
      )}</button>`;

    document.getElementById("highlight-switch").addEventListener("change", () => {
      board.optionHighlight = !board.optionHighlight;
      board.playSound("menu");
    });
    document.getElementById("language-select").addEventListener("change", (event) => {
      board.setLanguage(event.target.value);
      this.options();
    });
    document.getElementById("close-menu").addEventListener("click", () => {
      this.closeMenu();
    });
    document.getElementById("back").addEventListener("click", () => {
      board.playSound("menu");
      this.clearMenu();
      this.createMenu();
    });
  }
  // Menu rules
  rules() {
    const menu = document.getElementById("menu");
    menu.classList.add("menu-rules");
    menu.innerHTML = `
    <div id="close-menu"><i class="far fa-times-circle"></i></div>
    <div class="menu-item new-page" id="options">${board.translate("rules")}</div>
    <p class="text-g">${board.translate("simpleMove")}</p>
    <p>${board.translate("simpleMoveText")}</p>
    <p class="text-g">${board.translate("jump")}</p>
    <p>${board.translate("jumpText")}</p>
    <p class="text-g">${board.translate("king")}</p>
    <p>${board.translate(
      board.ruleset === "flying" ? "flyingKingText" : "britishKingText"
    )}</p>
    <p class="text-g">${board.translate("endOfGame")}</p>
    <p>${board.translate("endOfGameText")}</p>
    <div class="submenu" id="rules-back"><i class="fa fa-backward" aria-hidden="true"></i></div>`;

    // add event listeners
    document.getElementById("close-menu").addEventListener("click", () => {
      this.closeMenu();
    });

    document.getElementById("rules-back").addEventListener("click", () => {
      board.playSound("menu");
      this.clearMenu();
      this.createMenu();
    });
  }

  // Menu results
  results() {
    const menu = document.getElementById("menu");
    menu.classList.add("menu");
    menu.innerHTML = `
    <div id="close-menu"><i class="far fa-times-circle"></i></div>
    <div class="menu-item new-page" id="results">${board.translate("results")}</div>`;
    // add scores
    let plyerScore = localStorage.getItem("whiteScore");
    let computerScore = localStorage.getItem("blackScore");
    menu.innerHTML += `<p class="submenu results-menu" id="player-score">${board.translate(
      "player"
    )}  ${plyerScore}</p>`;
    menu.innerHTML += `<p class="submenu results-menu" id="computer-score">${board.translate(
      "computer"
    )}  ${computerScore}</p>`;
    menu.innerHTML += `<div class="submenu results-menu" id="reset-score">${board.translate(
      "resetScore"
    )}</div>`;
    menu.innerHTML += `<div class="submenu results-menu" id="rules-back"><i class="fa fa-backward" aria-hidden="true"></i></div>`;
    // add event listeners
    document.getElementById("close-menu").addEventListener("click", () => {
      this.closeMenu();
    });

    document.getElementById("rules-back").addEventListener("click", () => {
      board.playSound("menu");
      this.clearMenu();
      this.createMenu();
    });

    document.getElementById("reset-score").addEventListener("click", () => {
      board.playSound("menu");
      localStorage.setItem("whiteScore", 0);
      localStorage.setItem("blackScore", 0);
      document.getElementById("player-score").textContent = `${board.translate(
        "player"
      )} 0`;
      document.getElementById("computer-score").textContent = `${board.translate(
        "computer"
      )} 0`;
    });
  }

  clearMenu() {
    const game = document.getElementById("menu");
    game.remove();
  }
}

// Game menu
const board = new Board();
const menu = new Menu();
menu.createMenu();
document.addEventListener("click", (event) => {
  if (!board.isPlaying || !board.menuIsOpen) {
    return;
  }
  const openMenu = document.getElementById("menu");
  if (
    !openMenu ||
    openMenu.contains(event.target) ||
    event.target.closest(".menu-hidden") ||
    event.target.closest("#sound-toggle")
  ) {
    return;
  }
  menu.closeMenu();
}, true);
