import {
  createPicrossGame,
  createTileColors,
  isBoardSolved,
  type PicrossGame,
  type PicrossSize,
  type PicrossSolution,
  type PicrossTileState,
} from "~/utils/picross";

export function usePicrossGame() {
  const game = ref<PicrossGame | null>(null);

  function startGame(size: PicrossSize, solution: PicrossSolution) {
    game.value = createPicrossGame(size, solution);
  }

  function checkIfCompleted() {
    if (game.value && isBoardSolved(game.value)) game.value.isCompleted = true;
  }

  function clearBoard() {
    if (!game.value) return;
    for (const row of game.value.board) row.fill("empty");
    game.value.tileColors = createTileColors(game.value.size);
    game.value.isCompleted = false;
  }

  function solveGame() {
    if (!game.value || game.value.isCompleted) return false;
    game.value.board = game.value.solution.map((row) =>
      row.map((filled): PicrossTileState => (filled ? "filled" : "empty")),
    );
    checkIfCompleted();
    return true;
  }

  function fillOne(random = Math.random) {
    if (!game.value || game.value.isCompleted) return false;
    const { board, solution } = game.value;
    const emptyTiles: { x: number; y: number }[] = [];
    board.forEach((row, y) =>
      row.forEach((tile, x) => {
        if (tile === "empty") emptyTiles.push({ x, y });
      }),
    );
    const randomTile = emptyTiles[Math.floor(random() * emptyTiles.length)];
    const boardRow = randomTile && board[randomTile.y];
    if (!randomTile || !boardRow) return false;
    const correctValue = solution[randomTile.y]?.[randomTile.x];
    boardRow[randomTile.x] = correctValue ? "filled" : "marked";
    checkIfCompleted();
    return true;
  }

  return {
    game,
    startGame,
    checkIfCompleted,
    clearBoard,
    solveGame,
    fillOne,
  };
}
