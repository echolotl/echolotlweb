<template>
  <div class="picross-page">
    <h1 class="picross-header">Nautilus' Picross</h1>
    <span class="header-games lotl-font">Free Play</span>
    <div class="game">
      <PicrossGrid v-if="game" :game="game" />
      <p v-if="game?.isCompleted" class="solved-message" role="status">
        The board is solved!
      </p>
      <div class="game-actions">
        <button @click="clearBoard" class="round">
          <Icon icon="trash" width="20px" height="20px" />
          Clear
        </button>
        <button
          :disabled="game?.isCompleted"
          @click="solveGame"
          class="round filled"
        >
          Solve
        </button>
        <button :disabled="game?.isCompleted" @click="fillOne" class="round">
          <Icon icon="tip" width="20px" height="20px" />
          Hint
        </button>
      </div>
      <div class="game-actions">
        <input
          v-model.number="sizeInput.width"
          type="number"
          min="1"
          max="50"
          aria-label="Board width"
        />
        <span aria-hidden="true">x</span>
        <input
          v-model.number="sizeInput.height"
          type="number"
          min="1"
          max="50"
          aria-label="Board height"
        />
        <button @click="regeneratePuzzle" class="round filled">
          Regenerate
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import PicrossGrid from "~/components/picross/PicrossGrid.vue";
import Icon from "~/components/common/Icon.vue";
import {
  createTileColors,
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
    tileColors: createTileColors(size),
    solution,
    hints: getHints(solution),
    size,
    isCompleted: false,
    moves: 0,
    hintsUsed: 0,
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
  game.value.tileColors = createTileColors(game.value.size);
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
.picross-header {
  position: relative;
  mask-image: url("/images/picross/daily.webp");
  mask-size: contain;
  mask-repeat: no-repeat;
  mask-position: center;
  background-color: var(--text);
  height: 100px;
  width: 100%;
}
.header-games {
  position: relative;
  z-index: 1;
  margin-top: -28px;
  font-size: 1.25rem;
  paint-order: stroke;
  -webkit-text-stroke: 6px var(--background);
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
  > button {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 4px;
    padding: 4px 8px;
  }
  > input[type="number"] {
    background: var(--surface);
    color: var(--text);
    border: none;
    font-family: inherit;
    text-align: center;
    font-weight: bold;
    border-radius: 6px;
    &::-webkit-inner-spin-button,
    &::-webkit-outer-spin-button {
      -webkit-appearance: none;
      margin: 0;
    }
  }
}
</style>
