<template>
  <div class="picross-page">
    <h1>Picross (WIP)</h1>
    <div class="game">
      <PicrossGrid v-if="game" :game="game" />
      <p v-if="game?.isCompleted" class="solved-message" role="status">
        The board is solved!
      </p>
      <div class="game-actions">
        <button @click="clearBoard">Clear</button>
        <button :disabled="game?.isCompleted" @click="solveGame">Solve</button>
        <button :disabled="game?.isCompleted" @click="fillOne">Fill One</button>
      </div>
      <div class="game-actions">
        <input
          v-model.number="sizeInput.width"
          type="number"
          min="1"
          max="50"
          aria-label="Board width"
        />
        <input
          v-model.number="sizeInput.height"
          type="number"
          min="1"
          max="50"
          aria-label="Board height"
        />
        <button @click="regeneratePuzzle">Regenerate</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import PicrossGrid from "~/components/picross/PicrossGrid.vue";
import {
  getHints,
  isBoardSolved,
  type PicrossBoard,
  type PicrossGame,
  type PicrossTileState,
} from "~/utils/picross";

const MIN_SIZE = 1;
const MAX_SIZE = 50;
const DEFAULT_SIZE = 10;
const sizeInput = reactive({ width: DEFAULT_SIZE, height: DEFAULT_SIZE });

const game = ref<PicrossGame | null>(null);

// #region GAME INIT
function clampSize(value: number) {
  return Number.isFinite(value)
    ? Math.min(MAX_SIZE, Math.max(MIN_SIZE, Math.round(value)))
    : DEFAULT_SIZE;
}

// Builds a fresh puzzle using the size from the inputs
function regeneratePuzzle() {
  const size = {
    width: clampSize(sizeInput.width),
    height: clampSize(sizeInput.height),
  };
  sizeInput.width = size.width;
  sizeInput.height = size.height;
  const board: PicrossBoard = Array.from({ length: size.height }, () =>
    Array.from({ length: size.width }, () => "empty" as PicrossTileState),
  );
  const solution = generateSolvableSolution(size, getHints);
  game.value = {
    board,
    solution,
    hints: getHints(solution),
    size,
    isCompleted: false,
    moves: 0,
    secondsElapsed: 0,
  };
}

// #endregion GAME INIT

function checkIfCompleted() {
  if (game.value && isBoardSolved(game.value)) game.value.isCompleted = true;
}

function clearBoard() {
  if (!game.value) return;
  for (const row of game.value.board) row.fill("empty");
  game.value.isCompleted = false;
}

function solveGame() {
  if (!game.value || game.value.isCompleted) return;
  // Copy so clearing the board later doesn't mutate the solution
  game.value.board = game.value.solution.map((row) =>
    row.map((filled): PicrossTileState => (filled ? "filled" : "empty")),
  );
  checkIfCompleted();
}

// Fills one random tile with the correct value from the solution
// (empty from the solution will result in a marked being placed)
function fillOne() {
  if (!game.value || game.value.isCompleted) return;
  const { board, solution } = game.value;
  const emptyTiles: { x: number; y: number }[] = [];
  board.forEach((row, y) =>
    row.forEach((tile, x) => {
      if (tile === "empty") emptyTiles.push({ x, y });
    }),
  );
  const randomTile = emptyTiles[Math.floor(Math.random() * emptyTiles.length)];
  const boardRow = randomTile && board[randomTile.y];
  if (!randomTile || !boardRow) return;
  const correctValue = solution[randomTile.y]?.[randomTile.x];
  boardRow[randomTile.x] = correctValue ? "filled" : "marked";
  checkIfCompleted();
}

onMounted(regeneratePuzzle);
</script>

<style scoped>
.picross-page {
  margin-top: 64px;
  display: flex;
  flex-direction: column;
  align-items: center;
  min-height: 80vh; /* Ensure the page takes full viewport height */
}
.game {
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
  gap: 16px;
}
.solved-message {
  margin: 0;
  font-weight: bold;
}
.game-actions {
  display: flex;
  gap: 8px;
  justify-content: center;
}
</style>
