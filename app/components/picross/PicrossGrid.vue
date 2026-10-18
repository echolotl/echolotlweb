<template>
  <div class="picross-layout">
    <SketchFilter id="picross-sketch" flood-color="var(--surface)" />
    <canvas
      ref="columnHintsCanvas"
      class="column-hints lotl-font"
      role="img"
      :aria-label="`Column hints: ${game.hints.columns.map((h) => h.join(' ')).join(', ')}`"
    ></canvas>
    <canvas
      ref="rowHintsCanvas"
      class="row-hints lotl-font"
      role="img"
      :aria-label="`Row hints: ${game.hints.rows.map((h) => h.join(' ')).join(', ')}`"
    ></canvas>
    <div class="game-board">
      <div class="board-backdrop" aria-hidden="true"></div>
      <div
        v-if="hoveredTile && !game.isCompleted"
        class="hover-tile"
        aria-hidden="true"
        :style="{
          width: `${TILE_SIZE}px`,
          height: `${TILE_SIZE}px`,
          transform: `translate(${hoveredTile.x * TILE_SIZE}px, ${hoveredTile.y * TILE_SIZE}px)`,
        }"
      ></div>
      <canvas
        ref="gameBoard"
        width="300"
        height="300"
        @mousedown="handleMouseDown"
        @mousemove="handleMouseMove"
        @mouseleave="handleMouseLeave"
        @contextmenu.prevent
      ></canvas>
    </div>
  </div>
</template>

<script setup lang="ts">
import SketchFilter from "~/components/common/SketchFilter.vue";
import { useTheme } from "~~/composables/useTheme";
import { createSoundPlayer, type SoundPlayer } from "~/utils/audio";
import {
  getSolvedHints,
  isBoardSolved,
  type PicrossGame,
  type PicrossTileState,
} from "~/utils/picross";

// The grid mutates the game it is given (board, moves, isCompleted)
const props = defineProps<{
  game: PicrossGame;
}>();

const { theme } = useTheme();

const TILE_SIZE = 30;
const HINT_FONT_SIZE = 14;
const HINT_LINE_HEIGHT = 20;
const COLUMN_HINTS_PADDING = 8;
const ROW_HINTS_PADDING = 16;
const ROW_HINT_GAP = 8;

let markImage: HTMLImageElement | null = null;
let sound: SoundPlayer | null = null;
let placeSounds: AudioBuffer[] = [];

// #region HINT CANVASES
const solvedHints = computed(() => {
  const { board, hints } = props.game;
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

// Hints only need to be redrawn when a hint's solved state flips, not on every move
const solvedHintsKey = computed(() => JSON.stringify(solvedHints.value));

const columnHintsCanvas = shallowRef<HTMLCanvasElement | null>(null);
const rowHintsCanvas = shallowRef<HTMLCanvasElement | null>(null);

function prepareHintCanvas(
  canvas: HTMLCanvasElement,
  width: number,
  height: number,
) {
  const dpr = window.devicePixelRatio || 1;
  canvas.width = Math.max(1, Math.ceil(width * dpr));
  canvas.height = Math.max(1, Math.ceil(height * dpr));
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  const hintCtx = canvas.getContext("2d");
  if (!hintCtx) return null;
  hintCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
  hintCtx.textBaseline = "middle";
  return hintCtx;
}

function drawHints() {
  const columnCanvas = columnHintsCanvas.value;
  const rowCanvas = rowHintsCanvas.value;
  if (!columnCanvas || !rowCanvas) return;

  const { hints, size } = props.game;
  const rootStyle = window.getComputedStyle(document.documentElement);
  const textColor = rootStyle.getPropertyValue("--text");
  const solvedColor = rootStyle.getPropertyValue("--text-secondary");
  const fontFamily = window.getComputedStyle(columnCanvas).fontFamily;
  const font = `${HINT_FONT_SIZE}px ${fontFamily}`;

  const columnHeight =
    Math.max(0, ...hints.columns.map((h) => h.length)) * HINT_LINE_HEIGHT +
    COLUMN_HINTS_PADDING;
  const columnCtx = prepareHintCanvas(
    columnCanvas,
    size.width * TILE_SIZE,
    columnHeight,
  );
  if (columnCtx) {
    columnCtx.font = font;
    columnCtx.textAlign = "center";
    hints.columns.forEach((columnHints, column) => {
      columnHints.forEach((hint, index) => {
        columnCtx.fillStyle = solvedHints.value.columns[column]?.[index]
          ? solvedColor
          : textColor;
        const fromBottom = columnHints.length - 1 - index;
        columnCtx.fillText(
          String(hint),
          column * TILE_SIZE + TILE_SIZE / 2,
          columnHeight -
            COLUMN_HINTS_PADDING -
            fromBottom * HINT_LINE_HEIGHT -
            HINT_LINE_HEIGHT / 2,
        );
      });
    });
  }

  // Measure with a scratch context so the canvas can be sized before drawing
  const measureCtx = rowCanvas.getContext("2d");
  if (!measureCtx) return;
  measureCtx.font = font;
  const rowWidths = hints.rows.map((rowHints) =>
    rowHints.reduce(
      (total, hint, index) =>
        total +
        measureCtx.measureText(String(hint)).width +
        (index > 0 ? ROW_HINT_GAP : 0),
      0,
    ),
  );
  const rowWidth = Math.ceil(Math.max(0, ...rowWidths)) + ROW_HINTS_PADDING;
  const rowCtx = prepareHintCanvas(
    rowCanvas,
    rowWidth,
    size.height * TILE_SIZE,
  );
  if (!rowCtx) return;
  rowCtx.font = font;
  rowCtx.textAlign = "right";
  hints.rows.forEach((rowHints, row) => {
    let right = rowWidth - ROW_HINTS_PADDING;
    for (let index = rowHints.length - 1; index >= 0; index--) {
      const text = String(rowHints[index]);
      rowCtx.fillStyle = solvedHints.value.rows[row]?.[index]
        ? solvedColor
        : textColor;
      rowCtx.fillText(text, right, row * TILE_SIZE + TILE_SIZE / 2);
      right -= rowCtx.measureText(text).width + ROW_HINT_GAP;
    }
  });
}
// #endregion HINT CANVASES

// #region MAIN CANVAS

const gameBoard = shallowRef<HTMLCanvasElement | null>(null);
let ctx: CanvasRenderingContext2D | null = null;
let markCanvas: OffscreenCanvas | null = null;
let markCtx: OffscreenCanvasRenderingContext2D | null = null;

function initializeCanvas() {
  if (gameBoard.value) {
    ctx = gameBoard.value.getContext("2d");
    markCanvas = new OffscreenCanvas(TILE_SIZE, TILE_SIZE);
    markCtx = markCanvas.getContext("2d");
  }
}

interface BoardColors {
  line: string;
  tile: string;
  stripe: string;
  completed: string;
}

// Cached so drawing doesn't hit getComputedStyle
let colors: BoardColors | null = null;

function readColors(): BoardColors {
  const style = window.getComputedStyle(document.documentElement);
  return {
    line: style.getPropertyValue("--distant"),
    tile: style.getPropertyValue("--text"),
    stripe: style.getPropertyValue("--inverted-solid"),
    completed: style.getPropertyValue("--primary"),
  };
}

// Redraws are coalesced to at most one per frame
let boardFrame: number | null = null;
function scheduleDrawBoard() {
  if (boardFrame !== null) return;
  boardFrame = requestAnimationFrame(() => {
    boardFrame = null;
    drawBoard();
  });
}

function drawBoard() {
  if (!ctx || !gameBoard.value) return;
  const { board, size } = props.game;

  const CANVAS_WIDTH = size.width * TILE_SIZE;
  const CANVAS_HEIGHT = size.height * TILE_SIZE;
  const DPR = window.devicePixelRatio || 1;
  colors ??= readColors();

  // Resizing clears and reallocates the canvas, so only do it when needed
  const pixelWidth = Math.ceil(CANVAS_WIDTH * DPR);
  const pixelHeight = Math.ceil(CANVAS_HEIGHT * DPR);
  if (
    gameBoard.value.width !== pixelWidth ||
    gameBoard.value.height !== pixelHeight
  ) {
    gameBoard.value.width = pixelWidth;
    gameBoard.value.height = pixelHeight;
    gameBoard.value.style.width = `${CANVAS_WIDTH}px`;
    gameBoard.value.style.height = `${CANVAS_HEIGHT}px`;
  }

  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  ctx.strokeStyle = colors.line;
  ctx.lineCap = "round";

  // Draw checkered background for the grid
  ctx.fillStyle = colors.stripe;
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
    ctx.lineWidth = y % 5 === 0 ? 2 : 1;
    ctx.beginPath();
    ctx.moveTo(0, y * TILE_SIZE);
    ctx.lineTo(CANVAS_WIDTH, y * TILE_SIZE);
    ctx.stroke();
  }
  for (let x = 1; x < size.width; x++) {
    ctx.lineWidth = x % 5 === 0 ? 2 : 1;
    ctx.beginPath();
    ctx.moveTo(x * TILE_SIZE, 0);
    ctx.lineTo(x * TILE_SIZE, CANVAS_HEIGHT);
    ctx.stroke();
  }

  // Draw tiles
  const color = props.game.isCompleted ? colors.completed : colors.tile;
  for (let y = 0; y < size.height; y++) {
    for (let x = 0; x < size.width; x++) {
      switch (board[y]?.[x]) {
        case "filled":
          ctx.fillStyle = color;
          ctx.fillRect(
            x * TILE_SIZE + 1,
            y * TILE_SIZE + 1,
            TILE_SIZE - 2,
            TILE_SIZE - 2,
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
// The hover outline is a DOM overlay so moving the cursor never redraws the canvas
const hoveredTile = ref<{ x: number; y: number } | null>(null);

// #endregion MAIN CANVAS

// #region GAME LOGIC
function checkIfCompleted() {
  if (!isBoardSolved(props.game)) return;
  props.game.isCompleted = true;
  stopHold();
}

function getTileAt(event: MouseEvent) {
  if (!gameBoard.value) return null;
  const rect = gameBoard.value.getBoundingClientRect();
  const x = Math.floor(
    ((event.clientX - rect.left) / rect.width) * props.game.size.width,
  );
  const y = Math.floor(
    ((event.clientY - rect.top) / rect.height) * props.game.size.height,
  );
  return props.game.board[y]?.[x] ? { x, y } : null;
}

function applyAction(x: number, y: number) {
  const row = props.game.board[y];
  if (!row || !action || row[x] === action) return;
  row[x] = action;

  if (action === "filled") props.game.moves++;
  if (placeSounds.length > 0) {
    sound?.play(
      placeSounds[Math.floor(Math.random() * placeSounds.length)],
      0.85 + Math.random() * 0.3,
    );
  }
  checkIfCompleted();
}

function handleMouseDown(event: MouseEvent) {
  if (props.game.isCompleted) return;
  if (event.button !== 0 && event.button !== 2) return;
  const tile = getTileAt(event);
  if (!tile) return;
  event.preventDefault();
  heldButton = event.button;
  action =
    props.game.board[tile.y]?.[tile.x] !== "empty"
      ? "empty"
      : heldButton === 0
        ? "filled"
        : "marked";
  applyAction(tile.x, tile.y);
}

function handleMouseMove(event: MouseEvent) {
  if (props.game.isCompleted) return;
  const tile = getTileAt(event);
  setHoveredTile(tile);
  if (!tile || heldButton === null || !action) return;
  applyAction(tile.x, tile.y);
}

function handleMouseLeave() {
  setHoveredTile(null);
}

function setHoveredTile(tile: { x: number; y: number } | null) {
  if (hoveredTile.value?.x === tile?.x && hoveredTile.value?.y === tile?.y)
    return;
  hoveredTile.value = tile;
}

function stopHold() {
  heldButton = null;
  action = null;
}
// #endregion GAME LOGIC

onMounted(() => {
  markImage = new Image();
  markImage.onload = scheduleDrawBoard;
  markImage.src = "/images/icons/close.webp";

  const player = createSoundPlayer();
  sound = player;
  Promise.all(
    [1, 3, 5].map((i) => player.load(`/sounds/picross/click${i}.wav`)),
  ).then((buffers) => {
    placeSounds = buffers.filter((b): b is AudioBuffer => b !== null);
  });
  initializeCanvas();
  drawBoard();
  drawHints();
  document.fonts?.load(`${HINT_FONT_SIZE}px Lotl`).then(drawHints);
  window.addEventListener("mouseup", stopHold);
});

onBeforeUnmount(() => {
  window.removeEventListener("mouseup", stopHold);
  if (boardFrame !== null) cancelAnimationFrame(boardFrame);
  boardFrame = null;
  sound?.close();
  sound = null;
});

// A different game object means a new puzzle, so drop any in-progress drag
watch(
  () => props.game,
  () => {
    stopHold();
    hoveredTile.value = null;
  },
);

watch(
  [theme, () => props.game, () => props.game.isCompleted],
  () => {
    colors = null;
    scheduleDrawBoard();
  },
  { flush: "post" },
);

watch(() => props.game.board, scheduleDrawBoard, {
  deep: true,
  flush: "post",
});

watch([theme, () => props.game, solvedHintsKey], drawHints, { flush: "post" });
</script>

<style scoped>
.picross-layout {
  position: relative;
  width: fit-content;
  margin-top: 6rem; /* room for the absolutely positioned column hints */
}
.column-hints {
  position: absolute;
  bottom: 100%;
  left: 0;
  display: block;
}
.row-hints {
  position: absolute;
  top: 0;
  right: 100%;
  display: block;
}
.game-board {
  position: relative;
  width: fit-content;
  height: auto;
  box-sizing: border-box;
  border-radius: 8px;
  canvas {
    position: relative;
    display: block;
    border-radius: 12px;
  }
}
/* The sketch filter lives here so canvas redraws never re-run it */
.board-backdrop {
  position: absolute;
  inset: 0;
  background-color: var(--surface);
  border-radius: 8px;
  filter: url(#picross-sketch) drop-shadow(0 0 6px rgba(0, 0, 0, 0.2));
  pointer-events: none;
}
.hover-tile {
  position: absolute;
  top: 0;
  left: 0;
  z-index: 1;
  box-sizing: border-box;
  box-shadow: inset 0 0 0 2px color-mix(var(--inverted-solid) 40%, var(--solid));
  pointer-events: none;
}
</style>
