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

    changedPieces.forEach((piece) => {
      const currentSquare = piece.parentElement && piece.parentElement.classList.contains("square")
        ? piece.parentElement
        : null;
      const previousSquare = piecePositions.get(piece);

      // Newly created pieces and simulated AI moves that are immediately undone
      // do not represent a completed move on the board.
      if (previousSquare && currentSquare && previousSquare !== currentSquare) {
        game.querySelectorAll(".square.last-move").forEach((square) => {
          square.classList.remove("last-move");
        });
        previousSquare.classList.add("last-move");
        currentSquare.classList.add("last-move");
      }

      piecePositions.set(piece, currentSquare);
    });
  });

  observer.observe(game, { childList: true, subtree: true });
})();
