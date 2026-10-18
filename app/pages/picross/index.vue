<template>
  <div class="picross-page">
    <SketchFilter id="picross-sketch" flood-color="var(--surface)" />
    <h1>Picross (WIP)</h1>
    <div class="game">
      <div class="picross-layout">
        <div
          class="column-hints"
          aria-label="Column hints"
          :style="{
            gridTemplateColumns: `repeat(${game?.size.width ?? 10}, ${TILE_SIZE}px)`,
          }"
        >
          <div
            v-for="(hints, column) in game?.hints.columns"
            :key="`column-${column}`"
            class="column-hint lotl-font"
          >
            <span
              v-for="(hint, index) in hints"
              :key="index"
              :class="{ solved: solvedHints.columns[column]?.[index] }"
              >{{ hint }}</span
            >
          </div>
        </div>
        <div class="row-hints" aria-label="Row hints">
          <div
            v-for="(hints, row) in game?.hints.rows"
            :key="`row-${row}`"
            class="row-hint lotl-font"
          >
            <span
              v-for="(hint, index) in hints"
              :key="index"
              :class="{ solved: solvedHints.rows[row]?.[index] }"
              >{{ hint }}</span
            >
          </div>
        </div>
        <div class="game-board">
          <canvas
            ref="gameBoard"
            width="300"
            height="300"
            @mousedown="handleMouseDown"
            @mousemove="handleMouseMove"
            @contextmenu.prevent
          ></canvas>
        </div>
      </div>
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
import SketchFilter from "~/components/common/SketchFilter.vue";
import { useTheme } from "~~/composables/useTheme";

const { theme } = useTheme();

type PicrossTileState = "empty" | "filled" | "marked";

type PicrossBoard = PicrossTileState[][];

type PicrossGame = {
  board: PicrossBoard;
  solution: Exclude<PicrossTileState, "marked">[][]; // The correct solution without any marked tiles
  hints: {
    rows: number[][];
    columns: number[][];
  };
  size: {
    width: number;
    height: number;
  };
  isCompleted: boolean;
  moves: number;
  secondsElapsed: number;
};

const TILE_SIZE = 30;
const MIN_SIZE = 1;
const MAX_SIZE = 50;
const DEFAULT_SIZE = 10;
const sizeInput = reactive({ width: DEFAULT_SIZE, height: DEFAULT_SIZE });
let markImage: HTMLImageElement | null = null;

const gameBoard = ref<HTMLCanvasElement | null>(null);
const game = ref<PicrossGame | null>(null);
let ctx: CanvasRenderingContext2D | null = null;
let markCanvas: OffscreenCanvas | null = null;
let markCtx: OffscreenCanvasRenderingContext2D | null = null;

// #region HINTS FUNCTIONS

// Gets the runs of filled tiles in a line
function getLineRuns(
  line: PicrossTileState[],
): { length: number; start: number }[] {
  const runs: { length: number; start: number }[] = [];
  let start = -1;

  line.forEach((tile, index) => {
    if (tile === "filled") {
      if (start === -1) start = index;
    } else if (start !== -1) {
      runs.push({ length: index - start, start });
      start = -1;
    }
  });

  if (start !== -1) runs.push({ length: line.length - start, start });
  return runs;
}

function getLineHints(line: PicrossTileState[]) {
  const runs = getLineRuns(line).map((run) => run.length);
  return runs.length > 0 ? runs : [0];
}

// Gets the hints for the entire solution board based on the filled runs
function getHints(solution: PicrossBoard) {
  const rows = solution.map(getLineHints);
  const columns =
    solution[0]?.map((_, column) =>
      getLineHints(solution.map((row) => row[column] ?? "empty")),
    ) ?? [];

  return { rows, columns };
}

// Determines which hints are solved based on the current line state
function getSolvedHints(line: PicrossTileState[], hints: number[]) {
  const runs = getLineRuns(line);
  if (hints.length === 1 && hints[0] === 0) return [runs.length === 0];

  const count = hints.length;
  const sum = (values: number[]) => values.reduce((a, b) => a + b, 0);
  const minStart = (k: number) => sum(hints.slice(0, k)) + k;
  const minTail = (k: number) => sum(hints.slice(k + 1)) + (count - k - 1);

  let agreed: boolean[] | null = null;

  function assign(j: number, previous: number, chosen: number[]) {
    if (j === runs.length) {
      agreed = hints.map(
        (_, i) => chosen.includes(i) && (agreed ? agreed[i]! : true),
      );
      return;
    }

    const run = runs[j]!;
    for (let k = previous + 1; k < count; k++) {
      if (hints[k] !== run.length) continue;
      if (run.start < minStart(k)) continue;
      if (run.start + run.length > line.length - minTail(k)) continue;
      if (j > 0) {
        const prev = runs[j - 1]!;
        const between = hints.slice(previous + 1, k);
        const needed = 1 + sum(between) + between.length;
        if (run.start - (prev.start + prev.length) < needed) continue;
      }
      assign(j + 1, k, [...chosen, k]);
    }
  }

  assign(0, -1, []);
  return agreed ?? hints.map(() => false);
}
// #endregion HINTS

const solvedHints = computed(() => {
  if (!game.value) return { rows: [], columns: [] };
  const { board, hints } = game.value;
  return {
    rows: hints.rows.map((rowHints, row) =>
      getSolvedHints(board[row] ?? [], rowHints),
    ),
    columns: hints.columns.map((columnHints, column) =>
      getSolvedHints(
        board.map((row) => row[column] ?? "empty"),
        columnHints,
      ),
    ),
  };
});

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
  stopHold();
  const board: PicrossBoard = Array.from({ length: size.height }, () =>
    Array.from({ length: size.width }, () => "empty" as PicrossTileState),
  );
  const solution = generateRandomSolution(size);
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

function generateRandomSolution(size: {
  width: number;
  height: number;
}): Exclude<PicrossTileState, "marked">[][] {
  const solution = generateSolvableSolution(size, (filled) =>
    getHints(filled.map((row) => row.map(toTileState))),
  );
  return solution.map((row) => row.map(toTileState));
}

function toTileState(filled: boolean): Exclude<PicrossTileState, "marked"> {
  return filled ? "filled" : "empty";
}

function initializeCanvas() {
  if (gameBoard.value) {
    ctx = gameBoard.value.getContext("2d");
    markCanvas = new OffscreenCanvas(TILE_SIZE, TILE_SIZE);
    markCtx = markCanvas.getContext("2d");
  }
}
// #endregion GAME INIT

function drawBoard() {
  if (!ctx || !game.value || !gameBoard.value) return;
  const { board, size } = game.value;

  const CANVAS_WIDTH = size.width * TILE_SIZE;
  const CANVAS_HEIGHT = size.height * TILE_SIZE;
  const DPR = window.devicePixelRatio || 1;
  const LINE_COLOR = window
    .getComputedStyle(document.documentElement)
    .getPropertyValue("--distant");
  const TILE_COLOR = window
    .getComputedStyle(document.documentElement)
    .getPropertyValue("--text");
  const STRIPE_COLOR = window
    .getComputedStyle(document.documentElement)
    .getPropertyValue("--inverted-solid");
  const COMPLETED_TILE_COLOR = window
    .getComputedStyle(document.documentElement)
    .getPropertyValue("--primary");

  gameBoard.value.width = CANVAS_WIDTH * DPR;
  gameBoard.value.height = CANVAS_HEIGHT * DPR;
  gameBoard.value.style.width = `${CANVAS_WIDTH}px`;
  gameBoard.value.style.height = `${CANVAS_HEIGHT}px`;

  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  ctx.strokeStyle = LINE_COLOR;
  ctx.lineCap = "round";

  // Draw checkered background for the grid
  ctx.fillStyle = STRIPE_COLOR;
  ctx.globalAlpha = 0.05;
  for (let y = 0; y < size.height; y++) {
    for (let x = 0; x < size.width; x++) {
      if ((x + y) % 2 === 0) {
        ctx.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
      }
    }
  }
  ctx.globalAlpha = 1;

  // Draw dividing lines
  for (let y = 1; y < size.height; y++) {
    if (y % 5 === 0) {
      ctx.lineWidth = 2;
    } else {
      ctx.lineWidth = 1;
    }
    ctx.beginPath();
    ctx.moveTo(0, y * TILE_SIZE);
    ctx.lineTo(CANVAS_WIDTH, y * TILE_SIZE);
    ctx.stroke();
  }
  for (let x = 1; x < size.width; x++) {
    if (x % 5 === 0) {
      ctx.lineWidth = 2;
    } else {
      ctx.lineWidth = 1;
    }
    ctx.beginPath();
    ctx.moveTo(x * TILE_SIZE, 0);
    ctx.lineTo(x * TILE_SIZE, CANVAS_HEIGHT);
    ctx.stroke();
  }

  // Draw tiles
  const color = game.value?.isCompleted ? COMPLETED_TILE_COLOR : TILE_COLOR;
  for (let y = 0; y < size.height; y++) {
    for (let x = 0; x < size.width; x++) {
      switch (board[y]?.[x]) {
        case "filled":
          ctx.fillStyle = color;
          ctx.fillRect(
            x * TILE_SIZE + 2,
            y * TILE_SIZE + 2,
            TILE_SIZE - 4,
            TILE_SIZE - 4,
          );
          break;
        case "marked":
          if (
            markImage?.complete &&
            markImage.naturalWidth > 0 &&
            markCtx &&
            markCanvas
          ) {
            markCtx.clearRect(0, 0, TILE_SIZE, TILE_SIZE);
            markCtx.globalCompositeOperation = "source-over";
            markCtx.drawImage(markImage, 0, 0, TILE_SIZE, TILE_SIZE);
            markCtx.globalCompositeOperation = "source-in";
            markCtx.fillStyle = color;
            markCtx.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
            markCtx.globalCompositeOperation = "source-over";
            ctx.drawImage(markCanvas, x * TILE_SIZE, y * TILE_SIZE);
          }
          break;
      }
    }
  }
}

let heldButton: number | null = null;
let action: PicrossTileState | null = null;

function checkIfCompleted() {
  if (!game.value || !game.value.board) return;
  const { board, solution } = game.value;
  // Solved when the filled tiles match the solution; marks and empties are equivalent
  for (let y = 0; y < solution.length; y++) {
    const row = solution[y];
    if (!row) continue;
    for (let x = 0; x < row.length; x++) {
      if ((board[y]?.[x] === "filled") !== (row[x] === "filled")) return;
    }
  }
  game.value.isCompleted = true;
  stopHold();
}

function getTileAt(event: MouseEvent) {
  if (!game.value || !gameBoard.value) return null;
  const rect = gameBoard.value.getBoundingClientRect();
  const x = Math.floor(
    ((event.clientX - rect.left) / rect.width) * game.value.size.width,
  );
  const y = Math.floor(
    ((event.clientY - rect.top) / rect.height) * game.value.size.height,
  );
  return game.value.board[y]?.[x] ? { x, y } : null;
}

function applyAction(x: number, y: number) {
  const row = game.value?.board[y];
  if (!row || !action || row[x] === action) return;
  row[x] = action;

  // Check if the game is completed
  if (game.value && action === "filled") game.value.moves++;
  checkIfCompleted();
}

function handleMouseDown(event: MouseEvent) {
  if (game.value?.isCompleted) return;
  if (event.button !== 0 && event.button !== 2) return;
  const tile = getTileAt(event);
  if (!tile) return;
  event.preventDefault();
  heldButton = event.button;
  action =
    game.value?.board[tile.y]?.[tile.x] !== "empty"
      ? "empty"
      : heldButton === 0
        ? "filled"
        : "marked";
  applyAction(tile.x, tile.y);
}

function handleMouseMove(event: MouseEvent) {
  if (game.value?.isCompleted) return;
  if (heldButton === null || !action) return;
  const tile = getTileAt(event);
  if (!tile) return;
  applyAction(tile.x, tile.y);
}

function stopHold() {
  heldButton = null;
  action = null;
}

function clearBoard() {
  if (!game.value || !game.value.board) return;
  const board = game.value.board;
  for (let y = 0; y < board.length; y++) {
    const row = board[y];
    if (!row) continue;
    for (let x = 0; x < row.length; x++) {
      row[x] = "empty";
    }
  }
  game.value.isCompleted = false;
}

function solveGame() {
  if (!game.value || !game.value.board || !game.value.solution) return;
  if (game.value.isCompleted) return;
  // Copy so clearing the board later doesn't mutate the solution
  game.value.board = game.value.solution.map((row) => [...row]);
  checkIfCompleted();
}

function fillOne() {
  // Fills one random tile with the correct value from the solution
  // (empty from the solution will result in a marked being placed)

  if (!game.value || !game.value.board || !game.value.solution) return;
  if (game.value.isCompleted) return;
  const board = game.value.board;
  const solution = game.value.solution;
  const emptyTiles: { x: number; y: number }[] = [];
  for (let y = 0; y < board.length; y++) {
    const row = board[y];
    if (!row) continue;
    for (let x = 0; x < row.length; x++) {
      if (row[x] === "empty") emptyTiles.push({ x, y });
    }
  }
  if (emptyTiles.length === 0) return;
  const randomTile = emptyTiles[Math.floor(Math.random() * emptyTiles.length)];
  if (!randomTile) return;
  const boardRow = board[randomTile.y];
  if (!boardRow) return;
  const correctValue = solution[randomTile.y]?.[randomTile.x];
  boardRow[randomTile.x] = correctValue === "filled" ? "filled" : "marked";
  checkIfCompleted();
}

onMounted(() => {
  markImage = new Image();
  markImage.onload = drawBoard;
  markImage.src = "/images/icons/close.webp";
  regeneratePuzzle();
  initializeCanvas();
  drawBoard();
  window.addEventListener("mouseup", stopHold);
});

onBeforeUnmount(() => {
  window.removeEventListener("mouseup", stopHold);
});

watch([() => game.value?.size.height, () => game.value?.size.width], () => {});

watch(
  [theme, () => game.value?.board],
  () => {
    drawBoard();
  },
  { deep: true },
);
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
.picross-layout {
  position: relative;
  width: fit-content;
  margin-top: 6rem; /* room for the absolutely positioned column hints */
}
.column-hints {
  position: absolute;
  bottom: 100%;
  left: 0;
  display: grid;
  grid-template-columns: repeat(10, 30px);
  padding-bottom: 8px;
  text-align: center;
  font-size: 0.875rem;
  line-height: 1.25rem;
}
.column-hint {
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
}
.row-hints {
  position: absolute;
  top: 0;
  right: 100%;
  display: flex;
  flex-direction: column;
  padding-right: 16px;
  text-align: right;
  font-size: 0.875rem;
  line-height: 1.25rem;
}
.row-hint {
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
}
.row-hint .solved,
.column-hint .solved {
  color: var(--text-secondary);
}
.solved-message {
  margin: 0;
  font-weight: bold;
}
.game-board {
  width: fit-content;
  height: auto;
  background-color: var(--surface);
  filter: url(#picross-sketch) drop-shadow(0 0 6px rgba(0, 0, 0, 0.2));
  box-sizing: border-box;
  border-radius: 8px;
  canvas {
    display: block;
    border-radius: 12px;
  }
}
.game-actions {
  display: flex;
  gap: 8px;
  justify-content: center;
}
</style>
