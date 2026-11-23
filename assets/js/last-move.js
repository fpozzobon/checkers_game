// Render move history from accepted game-state commands.
document.addEventListener("checkers:move", (event) => {
  const { from, to, captures, capturedColors, capturedPieces } = event.detail;
  document.querySelectorAll(".square.last-move").forEach((square) => {
    square.classList.remove("last-move");
  });
  document.querySelectorAll(".last-captured-ghost").forEach((ghost) => {
    ghost.remove();
  });

  const sourceSquare = document.getElementById(from);
  const destinationSquare = document.getElementById(to);
  sourceSquare.classList.add("last-move");
  destinationSquare.classList.add("last-move");

  captures.forEach((capturedSquareId) => {
    const capturedSquare = document.getElementById(capturedSquareId);
    const capturedIndex = captures.indexOf(capturedSquareId);
    const color = capturedColors?.[capturedIndex]
      || (capturedSquare.classList.contains("piece-white") ? "white" : "black");
    const piece = capturedPieces?.[capturedIndex];
    if (!piece) return;
    const ghost = piece.cloneNode(true);
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
    capturedSquare.appendChild(ghost);
  });
});
