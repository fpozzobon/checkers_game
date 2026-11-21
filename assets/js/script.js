//Board class that create and command the game
/*jshint esversion: 6 */
const translations = {
  en: {
    title: "Checkers Game",
    description:
      "Play checkers with the computer for free, no sign-in required, easy to use, classic Checkers game!",
    whiteTurn: "White's turn",
    blackWinsPieces: "No pieces left, Black wins!",
    whiteWinsPieces: "Congratulations!!!!\n\nNo pieces left, White wins!",
    blackWinsMoves: "No moves left, Black wins!",
    whiteWinsMoves: "Congratulations!!!!\n\nNo moves left, White wins!",
    startGame: "Start Game!",
    resetGame: "Reset Game!",
    options: "Options",
    rules: "Rules",
    results: "Results",
    sound: "Sound On/Off",
    forcedHighlight: "Forced capture highlight",
    language: "Language",
    ruleset: "Rule set",
    flyingKings: "Flying kings",
    britishDraughts: "British draughts",
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
    blackWinsPieces: "Il ne reste plus de pions, les Noirs gagnent !",
    whiteWinsPieces: "Félicitations !\n\nIl ne reste plus de pions, les Blancs gagnent !",
    blackWinsMoves: "Les Blancs ne peuvent plus jouer, les Noirs gagnent !",
    whiteWinsMoves: "Félicitations !\n\nLes Noirs ne peuvent plus jouer, les Blancs gagnent !",
    startGame: "Commencer",
    resetGame: "Recommencer",
    options: "Options",
    rules: "Règles",
    results: "Résultats",
    sound: "Son activé/désactivé",
    forcedHighlight: "Indiquer les prises obligatoires",
    language: "Langue",
    ruleset: "Variante",
    flyingKings: "Dames volantes",
    britishDraughts: "Dames anglaises",
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
    this.applyLanguage();
    this.game = document.getElementById("game");
    this.colorPlay = "piece-white";
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
    this.optionSound = true;
    this.menuIsOpen = true;
    this.isPlaying = false;

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
    if (this.isPlaying && this.colorPlay === "piece-white") {
      document.getElementById("messages").textContent =
        this.translate("whiteTurn");
    }
  }

  setRuleset(ruleset) {
    if (ruleset !== "flying" && ruleset !== "british") {
      throw new RangeError(`Unsupported ruleset: ${ruleset}`);
    }
    this.ruleset = ruleset;
    localStorage.setItem("ruleset", ruleset);

    if (!this.isPlaying || this.colorPlay !== "piece-white") {
      return;
    }

    document.querySelectorAll(".possible, .moving").forEach((square) => {
      square.classList.remove("possible", "moving");
    });
    const whitePieces = document.querySelectorAll(".piece-white");
    whitePieces.forEach((piece) => {
      piece.classList.remove("highlight");
      piece.movable = true;
    });
    this.takeIt = [];
    this.needTake = [];
    if (!this.checkIfcanTake(whitePieces)) {
      whitePieces.forEach((piece) => {
        piece.movable = true;
        this.checkpossibleMove(piece);
      });
    }
  }

  // Method to start the game
  startGame() {
    /* Start the game*/
    this.createPieces();
    this.removeMoving();
    this.gameControl();
  }

  // Method to control the game turns
  gameControl() {
    /* Method to control the game turns*/
    this.turn += 1;
    if (this.colorPlay == "piece-white") {
      const message = document.getElementById("messages");
      message.textContent = this.translate("whiteTurn");
      // check if white pieces can take
      // freeze black pieces
      let blackPieces = document.querySelectorAll(".piece-black");
      blackPieces.forEach((item) => {
        item.movable = false;
        item.addEventListener("click", this.pieceClick);
      });
      this.promoteToKing(blackPieces);
      setTimeout(() => {
        this.checkWinner();
      }, 1000);

      // check if white pieces can take
      let whitePieces = document.querySelectorAll(".piece-white");
      if (!this.checkIfcanTake(whitePieces)) {
        // unfreeze white pieces
        whitePieces.forEach((item) => {
          item.movable = true;
          item.addEventListener("click", this.pieceClick);
          this.checkpossibleMove(item);
        });
      }
    } else if (this.colorPlay == "piece-black") {
      const message = document.getElementById("messages");
      message.innerHTML = "";
      // remove highlight from white pieces
      let highlightPieces = document.querySelectorAll(".highlight");
      highlightPieces.forEach((item) => {
        item.classList.remove("highlight");
      });

      //freeze white pieces
      const whitePieces = document.querySelectorAll(".piece-white");
      whitePieces.forEach((item) => {
        item.movable = false;
      });
      this.promoteToKing(whitePieces);
      setTimeout(() => {
        this.checkWinner();
      }, 1000);
      const blackPieces = document.querySelectorAll(".piece-black");
      blackPieces.forEach((item) => {
        item.movable = false;
        this.checkpossibleMove(item);
      });
      //random to computer move, sound more
      let timeMove = Math.random() * 2000 + 1200;
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
            // add piece board score
            let whiteCapture = document.getElementById("removedw");
            const outPiece = enemySquare.firstChild;
            outPiece.classList.remove("piece-black");
            outPiece.classList.add("piece-out-black");
            whiteCapture.appendChild(outPiece);
            // remove from board
            enemySquare.innerHTML = "";
            enemySquare.setAttribute("occupied", "false");
            // check if can take again
            board.takeIt = [];
            board.needTake = [];
            //get white pieces
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

  // Method to move the black piece automatically and take if possible
  computerMove() {
    /* Method to move the black piece automatically and take if possible */
    const blackPieces = document.querySelectorAll(".piece-black");
    let piecesToCheck = this.pieceTaking ? [this.pieceTaking] : blackPieces;
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

    const promotes = !wasKing && Number(destination.id) > 55;
    if (promotes) {
      piece.isKing = true;
    }

    let immediateCaptures = 0;
    let capturesOfMovedPiece = 0;
    const whitePieces = document.querySelectorAll(".piece-white");
    whitePieces.forEach((whitePiece) => {
      this.takeIt = [];
      this.needTake = [];
      this.checkpossibleMove(whitePiece);
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
    const score =
      row * 2 +
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

    board.takeIt.forEach((option) => {
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

    if (!group) {
      return false;
    }

    board.playSound("take");
    piece = group[0];
    this.pieceTaking = piece;
    enemySquare = document.getElementById(group[1]);
    oppositeSquare = document.getElementById(group[2]);
    const blackCapture = document.getElementById("removedb");
    const outPiece = enemySquare.firstChild;
    outPiece.classList.remove("piece-white");
    outPiece.classList.add("piece-out-white");
    blackCapture.appendChild(outPiece);
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
    const blackPieces = document.querySelectorAll(".piece-black");
    blackPieces.forEach((piece) => {
      const possibleMoves = this.checkpossibleMove(piece);
      possibleMoves.forEach((moveId) => {
        const destination = document.getElementById(moveId);
        const score = this.scoreComputerMove(piece, destination);
        if (score > bestScore) {
          bestScore = score;
          bestMove = [piece, destination];
        }
      });
    });

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
        if (this.optionHighlight && item.classList.contains("piece-white")) {
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

    let score = localStorage.getItem(color + "Score");
    if (score == null) {
      score = 0;
    } else {
      score = parseInt(score) + 1;
      localStorage.setItem(color + "Score", String(score));
    }
  }

  // check winner
  checkWinner() {
    /* Check if there is a winner */
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
      alert(this.translate("blackWinsPieces"));
      this.updateScore("black");
      location.reload();
      return -1;
    } else if (blackPieces.length == 0) {
      alert(this.translate("whiteWinsPieces"));
      this.updateScore("white");
      location.reload();
      return -1;
    } else if (whitePiecesLeft == 0) {
      alert(this.translate("blackWinsMoves"));
      this.updateScore("black");
      location.reload();
      return -1;
    } else if (blackPiecesLeft == 0) {
      alert(this.translate("whiteWinsMoves"));
      this.updateScore("white");
      location.reload();
      return -1;
    }
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
      dragStarted = false;
      startX = event.clientX;
      startY = event.clientY;
      const rect = piece.getBoundingClientRect();
      grabOffsetX = event.clientX - rect.left;
      grabOffsetY = event.clientY - rect.top;
      piece.setPointerCapture(event.pointerId);
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
      const square = target ? target.closest(".square") : null;
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
    const menu = document.createElement("div");
    menu.id = "menu";
    menu.classList.add("menu");
    menu.innerHTML = `<div id="close-menu"><i class="far fa-times-circle"></i></div>`;
    if (board.isPlaying) {
      menu.innerHTML += `<div class="menu-item" id="new-game">${board.translate(
        "resetGame"
      )}</div>`;
    } else {
      menu.innerHTML += `<div class="menu-item" id="new-game">${board.translate(
        "startGame"
      )}</div>`;
    }
    menu.innerHTML += `
        <div class="menu-item" id="options">${board.translate("options")}</div>
        <div class="menu-item" id="rules">${board.translate("rules")}</div>
        <div class="menu-item" id="results">${board.translate("results")}</div>`;
    board.game.appendChild(menu);

    document.getElementById("close-menu").addEventListener("click", () => {
      board.playSound("menu");
      this.hiddenMenu();
      board.menuIsOpen = false;
    });
    document.getElementById("new-game").addEventListener("click", () => {
      board.playSound("menu");
      if (board.isPlaying == true) {
        this.hiddenMenu();
        location.reload();
      } else {
        board.startGame();
        board.isPlaying = true;
        board.menuIsOpen = false;
        this.hiddenMenu();
      }
    });
    document.getElementById("options").addEventListener("click", () => {
      board.playSound("menu");
      this.options();
    });
    document.getElementById("rules").addEventListener("click", () => {
      board.playSound("menu");
      this.rules();
    });
    document.getElementById("results").addEventListener("click", () => {
      board.playSound("menu");
      this.results();
    });
  }
  //Hidden menu method
  hiddenMenu() {
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
    <div class="menu-item" id="options">${board.translate("options")}</div>
    `;
    if (board.optionSound) {
      menu.innerHTML += `<div class="submenu" id="sound"><span class="space">${board.translate(
        "sound"
      )}</span>
                        <label class="switch" id="sound-switch">
                        <input type="checkbox" checked>
                        <span class="slider round"></span>
                        </label></div>`;
    } else {
      menu.innerHTML += `<div class="submenu" id="sound"><span class="space">${board.translate(
        "sound"
      )}</span>
                        <label class="switch" id="sound-switch">
                        <input type="checkbox">
                        <span class="slider round"></span>
                        </label></div>`;
    }
    if (board.optionHighlight) {
      menu.innerHTML += `<div class="submenu" id="highlight"><span class="space-s">${board.translate(
        "forcedHighlight"
      )}</span>
                          <label class="switch" id="highlight-switch">
                          <input type="checkbox" checked>
                          <span class="slider round"></span>
                          </label></div>`;
    } else {
      menu.innerHTML += `<div class="submenu" id="highlight"><span class="space-s">${board.translate(
        "forcedHighlight"
      )}</span>
                          <label class="switch" id="highlight-switch">
                          <input type="checkbox">
                          <span class="slider round"></span>
                          </label></div>`;
    }
    menu.innerHTML += `<div id="language-control">
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
                       </div>`;
    menu.innerHTML += `<div id="ruleset-control">
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
                         </div>`;
    menu.innerHTML += `<div class="submenu" id="back"><i class="fa fa-backward" aria-hidden="true"></i>
                       </div>`;

    //check if sound switch is off
    const switchSound = document.getElementById("sound-switch");
    switchSound.addEventListener("change", () => {
      if (board.optionSound) {
        board.optionSound = false;
      } else {
        board.optionSound = true;
      }
      board.playSound("menu");
    });

    const switchHighlight = document.getElementById("highlight-switch");
    switchHighlight.addEventListener("change", () => {
      board.playSound("menu");
      if (board.optionHighlight) {
        board.optionHighlight = false;
      } else {
        board.optionHighlight = true;
      }
    });

    document.getElementById("language-select").addEventListener("change", (e) => {
      board.setLanguage(e.target.value);
      this.options();
    });

    document.getElementById("ruleset-select").addEventListener("change", (e) => {
      board.setRuleset(e.target.value);
      this.options();
    });

    // add event listeners
    document.getElementById("close-menu").addEventListener("click", () => {
      board.playSound("menu");
      this.hiddenMenu();
      board.menuIsOpen = false;
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
      board.playSound("menu");
      this.hiddenMenu();
      board.menuIsOpen = false;
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
      board.playSound("menu");
      this.hiddenMenu();
      board.menuIsOpen = false;
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
