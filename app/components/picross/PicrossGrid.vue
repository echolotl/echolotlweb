<template>
  <div class="picross-layout" :style="{ marginTop: `${columnHintsHeight}px` }">
    <SketchFilter id="picross-sketch" flood-color="var(--surface)" />
    <canvas
      v-if="!locked"
      ref="columnHintsCanvas"
      class="column-hints lotl-font"
      role="img"
      :aria-label="`Column hints: ${game.hints.columns.map((h) => h.join(' ')).join(', ')}`"
    ></canvas>
    <canvas
      v-if="!locked"
      ref="rowHintsCanvas"
      class="row-hints lotl-font"
      role="img"
      :aria-label="`Row hints: ${game.hints.rows.map((h) => h.join(' ')).join(', ')}`"
    ></canvas>
    <div class="game-board">
      <div class="board-backdrop" aria-hidden="true"></div>
      <div
        v-if="hoveredTile && !game.isCompleted && !locked"
        class="hover-tile"
        :class="inputMode"
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
        @pointerdown="handlePointerDown"
        @pointermove="handlePointerMove"
        @pointerleave="handlePointerLeave"
        @contextmenu.prevent
      ></canvas>
    </div>
  </div>
</template>

<script setup lang="ts">
import SketchFilter from "~/components/common/SketchFilter.vue";
import { useTheme } from "~/composables/useTheme";
import { createSoundPlayer, type SoundPlayer } from "~/utils/audio";
import {
  getHints,
  getSolvedHints,
  isBoardSolved,
  isLineOverfilled,
  type InputMode,
  type PicrossGame,
  type PicrossTileState,
} from "~/utils/picross";

// The grid mutates the game it is given (board, moves, isCompleted)
// While locked the board is shown without hints and can't be played
// While editable, tiles edit the solution directly and the hints follow it
const props = defineProps<{
  game: PicrossGame;
  locked?: boolean;
  editable?: boolean;
}>();

// The grid owns the input mode; parents read and set it through the exposed API
const inputMode = ref<InputMode>("fill");

const { theme } = useTheme();

const TILE_SIZE = 30;
const HINT_FONT_SIZE = 14;
const HINT_LINE_HEIGHT = 20;
const COLUMN_HINTS_PADDING = 8;

const targetColumnHintsHeight = computed(
  () =>
    Math.max(0, ...props.game.hints.columns.map((h) => h.length)) *
      HINT_LINE_HEIGHT +
    COLUMN_HINTS_PADDING * 2,
);
// Matches the height of the column hints canvas that sits above the board.
// It's frozen mid-stroke so the board doesn't shift under the pointer.
const strokeActive = ref(false);
const columnHintsHeight = ref(targetColumnHintsHeight.value);
watch(
  [targetColumnHintsHeight, strokeActive],
  ([height, active]) => {
    if (!active) columnHintsHeight.value = height;
  },
  { flush: "sync" },
);
const ROW_HINTS_PADDING = 16;
const ROW_HINT_GAP = 8;
const UNDO_HISTORY_LIMIT = 100;

let markImage: HTMLImageElement | null = null;
let sound: SoundPlayer | null = null;
let placeSounds: AudioBuffer[] = [];

// Each history entry is one pointer stroke, so a drag undoes in a single step
interface TileChange {
  x: number;
  y: number;
  prev: PicrossTileState;
  next: PicrossTileState;
}
let undoStack: TileChange[][] = [];
let redoStack: TileChange[][] = [];
let stroke: TileChange[] | null = null;
// The stacks aren't reactive, so these mirror their sizes for the buttons
const undoCount = ref(0);
const redoCount = ref(0);

function syncHistoryCounts() {
  undoCount.value = undoStack.length;
  redoCount.value = redoStack.length;
}

function commitStroke() {
  if (stroke?.length) {
    undoStack.push(stroke);
    if (undoStack.length > UNDO_HISTORY_LIMIT) undoStack.shift();
    redoStack = [];
    syncHistoryCounts();
  }
  stroke = null;
  strokeActive.value = false;
}

function clearHistory() {
  undoStack = [];
  redoStack = [];
  stroke = null;
  strokeActive.value = false;
  syncHistoryCounts();
}

// #region HINT CANVASES
const solvedHints = computed(() => {
  const { board, hints } = props.game;
  // The board always matches the solution when editing, so nothing is "solved"
  if (props.editable) {
    return {
      rows: hints.rows.map((rowHints) => rowHints.map(() => false)),
      columns: hints.columns.map((columnHints) => columnHints.map(() => false)),
    };
  }
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

// A line whose hints are all solved but still has untouched tiles left to mark out
const unmarkedLines = computed(() => {
  const { board } = props.game;
  const needsMarks = (
    line: PicrossTileState[],
    solved: boolean[] | undefined,
  ) => !!solved?.length && solved.every(Boolean) && line.includes("empty");
  return {
    rows: solvedHints.value.rows.map((solved, row) =>
      needsMarks(board[row] ?? [], solved),
    ),
    columns: solvedHints.value.columns.map((solved, column) =>
      needsMarks(
        board.map((row) => row[column] ?? "empty"),
        solved,
      ),
    ),
  };
});

const incorrectLines = computed(() => {
  const { board, hints } = props.game;
  return {
    rows: hints.rows.map((rowHints, row) =>
      isLineOverfilled(board[row] ?? [], rowHints),
    ),
    columns: hints.columns.map((columnHints, column) =>
      isLineOverfilled(
        board.map((row) => row[column] ?? "empty"),
        columnHints,
      ),
    ),
  };
});

// Hints only need to be redrawn when a hint's solved, outlined or incorrect state flips, not on every move
const solvedHintsKey = computed(() =>
  JSON.stringify([
    props.game.hints,
    solvedHints.value,
    unmarkedLines.value,
    incorrectLines.value,
  ]),
);

function drawHint(
  hintCtx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  solved: boolean | undefined,
  outlined: boolean,
  incorrect: boolean,
) {
  if (outlined) {
    hintCtx.strokeStyle = incorrect ? colors!.incorrect : colors!.stripe;
    hintCtx.lineWidth = 3;
    hintCtx.lineJoin = "round";
    hintCtx.globalAlpha = 0.5;
    hintCtx.strokeText(text, x, y);
    hintCtx.globalAlpha = 1;
  }
  hintCtx.fillStyle = incorrect
    ? colors!.incorrect
    : solved
      ? colors!.solvedHint
      : colors!.text;
  hintCtx.fillText(text, x, y);
}

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
  colors ??= readColors();
  const fontFamily = window.getComputedStyle(columnCanvas).fontFamily;
  const font = `${HINT_FONT_SIZE}px ${fontFamily}`;

  const columnHeight = columnHintsHeight.value;
  const columnCtx = prepareHintCanvas(
    columnCanvas,
    size.width * TILE_SIZE,
    columnHeight,
  );
  if (columnCtx) {
    columnCtx.font = font;
    columnCtx.textAlign = "center";
    hints.columns.forEach((columnHints, column) => {
      const columnSolvedHints = solvedHints.value.columns[column] ?? [];
      const isColumnSolved =
        columnSolvedHints.length > 0 && columnSolvedHints.every(Boolean);
      columnHints.forEach((hint, index) => {
        const fromBottom = columnHints.length - 1 - index;
        drawHint(
          columnCtx,
          String(hint),
          column * TILE_SIZE + TILE_SIZE / 2,
          columnHeight -
            COLUMN_HINTS_PADDING -
            fromBottom * HINT_LINE_HEIGHT -
            HINT_LINE_HEIGHT / 2,
          columnSolvedHints[index],
          (unmarkedLines.value.columns[column] ||
            incorrectLines.value.columns[column]) ??
            false,
          incorrectLines.value.columns[column] ?? false,
        );
      });
      // if solved, draw a line through the column hints
      if (isColumnSolved && !unmarkedLines.value.columns[column]) {
        columnCtx.strokeStyle = colors?.solvedHint ?? "black";
        columnCtx.lineWidth = 2;
        columnCtx.beginPath();
        const bottom = columnHeight - COLUMN_HINTS_PADDING;
        columnCtx.moveTo(
          column * TILE_SIZE + TILE_SIZE / 2,
          bottom - columnHints.length * HINT_LINE_HEIGHT,
        );
        columnCtx.lineTo(column * TILE_SIZE + TILE_SIZE / 2, bottom);
        columnCtx.stroke();
      }
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
    const rowSolvedHints = solvedHints.value.rows[row] ?? [];
    const isRowSolved =
      rowSolvedHints.length > 0 && rowSolvedHints.every(Boolean);
    let right = rowWidth - ROW_HINTS_PADDING;
    for (let index = rowHints.length - 1; index >= 0; index--) {
      const text = String(rowHints[index]);
      drawHint(
        rowCtx,
        text,
        right,
        row * TILE_SIZE + TILE_SIZE / 2,
        solvedHints.value.rows[row]?.[index],
        (unmarkedLines.value.rows[row] || incorrectLines.value.rows[row]) ??
          false,
        incorrectLines.value.rows[row] ?? false,
      );
      right -= rowCtx.measureText(text).width + ROW_HINT_GAP;
    }

    // if solved, draw a line through the row hints
    if (isRowSolved && !unmarkedLines.value.rows[row]) {
      rowCtx.strokeStyle = colors?.solvedHint ?? "black";
      rowCtx.lineWidth = 2;
      rowCtx.beginPath();
      const lineRight = rowWidth - ROW_HINTS_PADDING;
      rowCtx.moveTo(
        lineRight - (rowWidths[row] ?? 0),
        row * TILE_SIZE + TILE_SIZE / 2,
      );
      rowCtx.lineTo(lineRight, row * TILE_SIZE + TILE_SIZE / 2);
      rowCtx.stroke();
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
  text: string;
  solvedHint: string;
  incorrect: string;
}

// Cached so drawing doesn't hit getComputedStyle
let colors: BoardColors | null = null;

function readColors(): BoardColors {
  const style = window.getComputedStyle(document.documentElement);
  const invertedSolid = style.getPropertyValue("--inverted-solid").trim();
  const solid = style.getPropertyValue("--solid").trim();
  return {
    line: style.getPropertyValue("--distant"),
    tile: style.getPropertyValue("--text"),
    stripe: invertedSolid,
    completed: style.getPropertyValue("--primary"),
    text: style.getPropertyValue("--text"),
    // Canvas can't resolve var() inside color-mix, so substitute the values
    solvedHint: `color-mix(in srgb, ${invertedSolid} 40%, ${solid})`,
    incorrect: style.getPropertyValue("--red"),
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
  const { board, size, tileColors } = props.game;

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
          ctx.fillStyle = props.game.isCompleted
            ? (tileColors[y]?.[x] ?? color)
            : color;
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
            markCtx.fillStyle = colors.tile;
            markCtx.globalAlpha = props.game.isCompleted ? 0.25 : 1;
            markCtx.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
            markCtx.globalAlpha = 1;
            markCtx.globalCompositeOperation = "source-over";
            ctx.drawImage(markCanvas, x * TILE_SIZE, y * TILE_SIZE);
          }
          break;
      }
    }
  }
}

let heldPointer: number | null = null;
let action: PicrossTileState | null = null;
// The hover outline is a DOM overlay so moving the cursor never redraws the canvas
const hoveredTile = ref<{ x: number; y: number } | null>(null);

// #endregion MAIN CANVAS

// #region GAME LOGIC
function checkIfCompleted() {
  if (props.editable || !isBoardSolved(props.game)) return;
  props.game.isCompleted = true;
  stopHold();
}

function getTileAt(event: PointerEvent) {
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

// Shared by player input, undo and redo; the board is the source of truth
function setTile(x: number, y: number, state: PicrossTileState) {
  const row = props.game.board[y];
  if (!row) return;
  row[x] = state;
  if (props.editable) {
    const solutionRow = props.game.solution[y];
    if (solutionRow) solutionRow[x] = state === "filled";
    props.game.hints = getHints(props.game.solution);
  }
}

function applyAction(x: number, y: number) {
  const row = props.game.board[y];
  if (!row || !action || row[x] === action) return;
  stroke?.push({ x, y, prev: row[x] ?? "empty", next: action });
  setTile(x, y, action);

  if (!props.editable && action === "filled") {
    props.game.moves++;
  }
  if (placeSounds.length > 0) {
    sound?.play(
      placeSounds[Math.floor(Math.random() * placeSounds.length)],
      0.85 + Math.random() * 0.3,
    );
  }
  checkIfCompleted();
}

function getToggledState(
  current: PicrossTileState | undefined,
  button: number,
): PicrossTileState {
  const mode = inputMode.value;
  if (mode === "erase") return "empty"; // Erase mode always returns empty
  const swapped = button === 2;
  const target: PicrossTileState =
    (mode === "fill") !== swapped ? "filled" : "marked";
  return current === target ? "empty" : target;
}

function handlePointerDown(event: PointerEvent) {
  if (props.game.isCompleted || props.locked) return;
  if (event.button !== 0 && event.button !== 2) return;
  const tile = getTileAt(event);
  if (!tile) return;
  event.preventDefault();
  heldPointer = event.pointerId;
  stroke = [];
  strokeActive.value = true;
  gameBoard.value?.setPointerCapture(event.pointerId);
  const current = props.game.board[tile.y]?.[tile.x];
  if (props.editable) {
    // Editing ignores the input mode and only toggles between filled and empty
    action = event.button === 0 && current !== "filled" ? "filled" : "empty";
  } else {
    action = getToggledState(current, event.button);
  }
  applyAction(tile.x, tile.y);
}

function handlePointerMove(event: PointerEvent) {
  if (props.game.isCompleted || props.locked) return;
  const tile = getTileAt(event);
  setHoveredTile(event.pointerType === "touch" ? null : tile);
  if (!tile || heldPointer !== event.pointerId || !action) return;
  applyAction(tile.x, tile.y);
}

function handlePointerLeave() {
  setHoveredTile(null);
}

function handleKeys(event: KeyboardEvent) {
  switch (event.code) {
    case "KeyB":
    case "Key1":
      inputMode.value = "fill";
      break;
    case "KeyM":
    case "Key2":
      inputMode.value = "mark";
      break;
    case "KeyE":
    case "Key3":
      inputMode.value = "erase";
      break;
    case "KeyZ":
    case "KeyY":
      if (!(event.ctrlKey || event.metaKey)) {
        break;
      }
      event.preventDefault();
      if (event.code === "KeyY" || event.shiftKey) {
        handleRedo();
      } else {
        handleUndo();
      }
      break;
    default:
      break;
  }
}

function canEditHistory() {
  return !props.game.isCompleted && !props.locked && heldPointer === null;
}

function handleUndo() {
  if (!canEditHistory()) return;
  const changes = undoStack.pop();
  if (!changes) return;
  for (let i = changes.length - 1; i >= 0; i--) {
    const { x, y, prev } = changes[i]!;
    setTile(x, y, prev);
  }
  redoStack.push(changes);
  syncHistoryCounts();
}

function handleRedo() {
  if (!canEditHistory()) return;
  const changes = redoStack.pop();
  if (!changes) return;
  for (const { x, y, next } of changes) setTile(x, y, next);
  undoStack.push(changes);
  syncHistoryCounts();
}

defineExpose({
  inputMode,
  setInputMode: (mode: InputMode) => {
    inputMode.value = mode;
  },
  undo: handleUndo,
  redo: handleRedo,
  clearHistory,
  canUndo: computed(() => undoCount.value > 0 && canEditHistory()),
  canRedo: computed(() => redoCount.value > 0 && canEditHistory()),
});

function setHoveredTile(tile: { x: number; y: number } | null) {
  if (hoveredTile.value?.x === tile?.x && hoveredTile.value?.y === tile?.y)
    return;
  hoveredTile.value = tile;
}

function stopHold() {
  heldPointer = null;
  action = null;
  commitStroke();
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
  window.addEventListener("pointerup", stopHold);
  window.addEventListener("pointercancel", stopHold);
  window.addEventListener("keydown", handleKeys);
});

onBeforeUnmount(() => {
  window.removeEventListener("pointerup", stopHold);
  window.removeEventListener("pointercancel", stopHold);
  window.removeEventListener("keydown", handleKeys);
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
    clearHistory();
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

watch(() => props.game.tileColors, scheduleDrawBoard, {
  deep: true,
  flush: "post",
});

watch(solvedHintsKey, drawHints, { flush: "post" });
// Redraw once the frozen height catches up after a stroke
watch(columnHintsHeight, drawHints, { flush: "post" });
// The hint canvases are recreated when unlocking, so they need a fresh draw
watch(() => props.locked, drawHints, { flush: "post" });
watch(
  [theme, () => props.game],
  () => {
    colors = null;
    drawHints();
  },
  { flush: "post" },
);
</script>

<style scoped>
.picross-layout {
  position: relative;
  width: fit-content;
  transition: margin-top 0.3s ease;
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
    touch-action: none; /* keep touch drags from scrolling the page */
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
  --color: color-mix(var(--inverted-solid) 40%, var(--solid));
  position: absolute;
  top: 0;
  left: 0;
  z-index: 1;
  box-sizing: border-box;
  box-shadow: inset 0 0 0 2px var(--color);
  pointer-events: none;
  &.mark::after {
    content: "";
    position: absolute;
    left: 0;
    top: 0;
    background: var(--color);
    width: 30px;
    height: 30px;
    mask-image: url("/images/icons/close.webp");
    mask-size: 30px;
  }
  &.erase {
    box-shadow: inset 0 0 0 2px var(--red);
  }
}
</style>
