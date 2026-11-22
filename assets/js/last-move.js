// Track completed piece moves so both player and computer moves are highlighted.
(() => {
  const game = document.getElementById("game");
  const piecePositions = new WeakMap();

  const observer = new MutationObserver((mutations) => {
    const changedPieces = new Set();

    mutations.forEach((mutation) => {
      mutation.removedNodes.forEach((node) => {
        if (node.nodeType === Node.ELEMENT_NODE && node.classList.contains("piece")) {
          changedPieces.add(node);
        }
      });
      mutation.addedNodes.forEach((node) => {
        if (node.nodeType === Node.ELEMENT_NODE && node.classList.contains("piece")) {
          changedPieces.add(node);
        }
      });
    });

    const completedMoves = [];
    const capturedPieces = [];
    changedPieces.forEach((piece) => {
      const currentSquare = piece.parentElement && piece.parentElement.classList.contains("square")
        ? piece.parentElement
        : null;
      const previousSquare = piecePositions.get(piece);

      if (previousSquare && currentSquare && previousSquare !== currentSquare) {
        completedMoves.push([previousSquare, currentSquare]);
      } else if (
        previousSquare &&
        !currentSquare &&
        (piece.classList.contains("piece-out-white") ||
          piece.classList.contains("piece-out-black"))
      ) {
        capturedPieces.push([piece, previousSquare]);
      }

      piecePositions.set(piece, currentSquare);
    });

    if (completedMoves.length > 0) {
      game.querySelectorAll(".square.last-move").forEach((square) => {
        square.classList.remove("last-move");
      });
      game.querySelectorAll(".last-captured-ghost").forEach((ghost) => {
        ghost.remove();
      });

      const [fromSquare, toSquare] = completedMoves[completedMoves.length - 1];
      fromSquare.classList.add("last-move");
      toSquare.classList.add("last-move");

      capturedPieces.forEach(([piece, square]) => {
        const ghost = piece.cloneNode(true);
        const color = piece.classList.contains("piece-out-white") ? "white" : "black";
        ghost.removeAttribute("id");
        ghost.classList.remove(
          "piece",
          "piece-white",
          "piece-black",
          "piece-out-white",
          "piece-out-black",
          "moving",
          "highlight"
        );
        ghost.classList.add(`captured-ghost-${color}`, "last-captured-ghost");
        ghost.setAttribute("aria-hidden", "true");
        ghost.setAttribute("tabindex", "-1");
        square.appendChild(ghost);
      });
    }
  });

  observer.observe(game, { childList: true, subtree: true });
})();
