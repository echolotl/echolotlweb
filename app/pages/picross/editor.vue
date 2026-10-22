<template>
  <PicrossPage subtitle="Editor (WIP!!)" accent="var(--orange)">
    <PicrossGrid
      v-if="game"
      ref="grid"
      :game="game"
      :editable="true"
      :paint-color="curPaintColor"
      :style="{ '--paint-color': curPaintColor ?? 'var(--text)' }"
    />
    <div class="game-actions">
      <PicrossInputControls
        :grid="grid"
        :remove-modes="['mark']"
        :add-modes="['paint']"
      />
      <button @click="handleClear" class="round">
        <Icon icon="trash" width="20px" height="20px" />
        Clear
      </button>
      <PicrossSizeInput
        :model-value="sizeInput"
        @update:model-value="applySizeInput"
      />
    </div>
    <template v-if="grid?.inputMode === 'paint'">
      <div class="palette">
        <div class="new-color">
          <input type="color" v-model="newColor" />
          <button @click="addColor()">
            <Icon icon="add" width="16px" height="16px" />
          </button>
        </div>
        <div class="swatches">
          <button
            type="button"
            class="color-swatch default-swatch"
            :class="{ selected: !selectedColor }"
            title="Default color"
            aria-label="Default color"
            :aria-pressed="!selectedColor"
            @click="selectedColor = ''"
          ></button>
        </div>
        <div v-if="palette.length" class="swatches">
          <div
            v-for="(color, index) in palette"
            :key="index"
            class="color-swatch"
            :class="{ selected: selectedColor === color }"
            :style="{ '--paint-color': color }"
            @click="selectedColor = color"
          ></div>
        </div>
        <button
          v-if="selectedColor"
          class="filled red round"
          @click="deleteColor()"
        >
          <Icon icon="trash" width="20px" height="20px" />
        </button>
      </div>
    </template>

    <div class="solve-result">
      <div class="solve-result-header text-secondary lotl-font">
        SOLVABILITY
      </div>
      <div v-if="solving" style="color: var(--text-secondary)">Checking...</div>
      <div
        v-else-if="
          solveResult?.logicSolvable && solveResult?.solutionCount === 1
        "
        style="color: var(--green)"
      >
        <Icon icon="check" width="20px" height="20px" />
        Solvable
      </div>
      <div
        v-else-if="solveResult && solveResult.solutionCount > 1"
        style="color: var(--orange)"
      >
        <Icon icon="warning" width="20px" height="20px" />
        Multiple solutions
      </div>
      <div v-else style="color: var(--red)">
        <Icon icon="danger" width="20px" height="20px" />
        Unsolvable...
      </div>
    </div>
    <div class="settings">
      <fieldset>
        <legend>Metadata (optional)</legend>
        <label>
          Title
          <input
            v-model="metadata.title"
            placeholder="Untitled"
            type="text"
            maxlength="100"
          />
        </label>
        <div class="row">
          <label>
            Author
            <input
              v-model="metadata.author.name"
              placeholder="echolotl"
              type="text"
              maxlength="100"
            />
          </label>
          <label>
            Source
            <input
              v-model="metadata.source.name"
              placeholder="Some picross game"
              type="text"
              maxlength="100"
            />
          </label>
        </div>
        <div class="file-actions">
          <button @click="handleSave" class="round">
            <Icon icon="download" width="20px" height="20px" />
            Save
          </button>
          <button @click="fileInput?.click()" class="round">
            <Icon icon="upload" width="20px" height="20px" />
            Load
          </button>
          <input
            ref="fileInput"
            type="file"
            :accept="`.${FILE_EXTENSION}`"
            hidden
            @change="handleLoad"
          />
        </div>
      </fieldset>
      <p v-if="fileError" class="file-error" role="alert">{{ fileError }}</p>
    </div>
  </PicrossPage>
</template>

<script setup lang="ts">
import PicrossGrid from "~/components/picross/PicrossGrid.vue";
import Icon from "~/components/common/Icon.vue";
import PicrossPage from "~/components/picross/PicrossPage.vue";
import PicrossInputControls from "~/components/picross/PicrossInputControls.vue";
import PicrossSizeInput from "~/components/picross/PicrossSizeInput.vue";
import {
  createPicrossGame,
  clearBoard,
  clampPicrossSize,
  getHints,
  DEFAULT_BOARD_SIZE,
  type PicrossGame,
  type PicrossSize,
  type PicrossMetadata,
} from "~/utils/picross";
import {
  FILE_EXTENSION,
  loadPicrossPuzzle,
  savePicrossPuzzle,
} from "~/utils/picross/file";

const sizeInput = reactive<PicrossSize>({
  width: DEFAULT_BOARD_SIZE,
  height: DEFAULT_BOARD_SIZE,
});
const metadata = reactive({
  title: "",
  author: { name: "" },
  source: { name: "" },
});

let createdAt: string | null = null;
const game = ref<PicrossGame | null>(null);
const grid = ref<InstanceType<typeof PicrossGrid> | null>(null);
const fileInput = ref<HTMLInputElement | null>(null);
const fileError = ref("");
const palette = ref<string[]>([]);
const selectedColor = ref("");
const newColor = ref("#000000");
const curPaintColor = computed(() => selectedColor.value || null);

definePageMeta({
  pageTransition: false,
  viewTransition: true,
});

function addColor() {
  const color = newColor.value.toLowerCase();
  if (!palette.value.includes(color)) palette.value.push(color);
  selectedColor.value = color;
}

function eraseColor(color: string) {
  const current = game.value;
  if (!current) return;
  let changed = false;
  current.tileColors.forEach((row) =>
    row.forEach((tileColor, x) => {
      if (tileColor !== color) return;
      row[x] = null;
      changed = true;
    }),
  );
  if (changed) grid.value?.clearHistory();
}

function removeColor() {
  const index = palette.value.indexOf(selectedColor.value);
  if (index === -1) return;
  const removed = selectedColor.value;
  palette.value.splice(index, 1);
  eraseColor(removed);
  selectedColor.value =
    palette.value[Math.min(index, palette.value.length - 1)] ?? "";
}
const { result: solveResult, solving, solve } = usePicrossSolver();

// Builds a game of the given size, keeping any tiles that still fit
function buildGame(
  size: PicrossSize,
  previous?: Pick<PicrossGame, "solution" | "tileColors"> | null,
) {
  const solution = Array.from({ length: size.height }, (_, y) =>
    Array.from(
      { length: size.width },
      (_, x) => previous?.solution[y]?.[x] ?? false,
    ),
  );
  const next = createPicrossGame(size, solution);
  next.board.forEach((row, y) =>
    row.forEach((_, x) => {
      if (solution[y]?.[x]) row[x] = "filled";
      next.tileColors[y]![x] = previous?.tileColors[y]?.[x] ?? null;
    }),
  );
  return next;
}

function init() {
  game.value = buildGame(clampPicrossSize(sizeInput));
}

function applySizeInput(size: PicrossSize) {
  sizeInput.width = size.width;
  sizeInput.height = size.height;
  game.value = buildGame(size, game.value);
}

function handleClear() {
  if (!game.value) return;
  clearBoard(game.value);
  game.value.solution.forEach((row) => row.fill(false));
  game.value.hints = getHints(game.value.solution);
  grid.value?.clearHistory();
}

function deleteColor() {
  if (!selectedColor.value) return;
  removeColor();
}

onMounted(init);

function handleSave() {
  if (!game.value) return;
  fileError.value = "";
  const created_at = createdAt || new Date().toISOString();
  let contents: Uint8Array;
  try {
    contents = savePicrossPuzzle({
      metadata: {
        title: metadata.title,
        author: metadata.author,
        source: metadata.source,
        created_at,
        modified_at: new Date().toISOString(),
      },
      size: game.value.size,
      solution: game.value.solution,
      tileColors: game.value.tileColors,
    });
  } catch (error) {
    fileError.value = error instanceof Error ? error.message : "Couldn't save";
    return;
  }
  createdAt = created_at;

  const filename =
    (metadata.title || "puzzle")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "puzzle";
  const url = URL.createObjectURL(
    new Blob([contents as BlobPart], { type: "application/octet-stream" }),
  );
  const link = document.createElement("a");
  link.href = url;
  link.download = `${filename}.${FILE_EXTENSION}`;
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

async function handleLoad(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  // Clearing the value lets the same file be picked again
  input.value = "";
  if (!file) return;
  fileError.value = "";
  try {
    const puzzle = loadPicrossPuzzle(new Uint8Array(await file.arrayBuffer()));
    game.value = buildGame(puzzle.size, puzzle);
    sizeInput.width = puzzle.size.width;
    sizeInput.height = puzzle.size.height;
    const { title, author, source, created_at } = puzzle.metadata;
    metadata.title = title ?? "";
    metadata.author = author ?? { name: "" };
    metadata.source = source ?? { name: "" };
    createdAt = created_at;
  } catch (error) {
    fileError.value =
      error instanceof Error ? error.message : "Couldn't load that file";
  }
}

// Solvability is only checked once a stroke finishes, not on every tile painted
let solvePending = false;

function solveIfIdle() {
  if (!solvePending || grid.value?.strokeActive) return;
  const current = game.value;
  if (!current) return;
  solvePending = false;
  solve(current.hints, current.size);
}

watch(
  () => game.value?.hints,
  (hints) => {
    if (!hints) return;
    solvePending = true;
    solveIfIdle();
  },
);

watch(() => grid.value?.strokeActive, solveIfIdle);

useSeoMeta({
  title: "echolotl - Nautilus' Picross (Editor)",
  description: "Make your own picross puzzle for Nautilus to eat!",
  ogDescription: "Make your own picross puzzle for Nautilus to eat!",
  ogTitle: "Nautilus' Picross (Editor)",
  ogUrl: "https://echolotl.lol/picross/editor",
});
</script>

<style scoped>
.file-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 0.5rem 0.5rem 0;

  > button {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 4px 8px;
  }
}

.file-error {
  color: var(--red);
}

.solve-result {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;

  gap: 4px;
  > div {
    display: flex;
    align-items: center;
    gap: 6px;
  }
}

.settings {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  align-items: start;
  justify-content: start;
  width: 100%;
  gap: 1rem;

  fieldset {
    border: none;
    padding: 0;
    > legend {
      margin: 1rem 0 0.5rem;
      font-size: var(--small-text);
      text-transform: uppercase;
      color: var(--text-secondary);
      font-family: "Lotl";
    }
    label {
      display: flex;
      flex-direction: column;
      padding: 0.25rem 0.5rem;
      font-size: var(--small-text);
      text-transform: uppercase;
      color: var(--text-secondary);

      input {
        margin-top: 4px;
        &[type="number"] {
          background: var(--surface);
          color: var(--text);
          border: none;
          padding: 4px;
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
        &[type="text"] {
          background: none;
          color: var(--text);
          border: none;
          font-family: inherit;
          box-shadow: inset 0 -2px 0 var(--surface);
          outline: none;
          padding: 6px 4px;
        }
      }
    }
    > .row {
      display: flex;
      flex-direction: row;
      align-items: center;

      > label {
        flex: 1;
        min-width: 0;
      }
    }
  }
}

.palette {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;

  button {
    padding: 0;
    background: none;
    border: none;
  }
  input[type="color"] {
    appearance: none;
    -moz-appearance: none;
    -webkit-appearance: none;
    width: 48px;
    padding: 0;
    border: 0;
    background: none;

    &::-webkit-color-swatch-wrapper {
      padding: 0;
    }

    &::-webkit-color-swatch {
      border: 1px solid var(--distant);
      border-radius: 0;
    }

    &::-moz-color-swatch,
    & ::-moz-focus-inner {
      border: 1px solid var(--distant);
    }

    &::-moz-focus-inner {
      padding: 0;
    }
  }
  .new-color {
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .swatches {
    align-self: flex-start;
    border: 1px solid var(--foreground);
    display: flex;
    flex-wrap: wrap;
    flex-direction: row;
    gap: 1px;
    background: var(--surface);

    .color-swatch {
      width: 24px;
      height: 24px;
      background-color: var(--paint-color);
      cursor: pointer;
      display: block;

      &.selected {
        outline: 2px solid
          color-mix(in srgb, var(--paint-color) 33%, var(--inverted-solid));
        z-index: 1;
      }

      &.default-swatch {
        padding: 0;
        border: none;
        background: repeating-conic-gradient(
            var(--distant) 0% 25%,
            transparent 0% 50%
          )
          50% / 24px 24px;

        &.selected {
          outline: 2px solid var(--inverted-solid);
          z-index: 1;
        }
      }
    }
  }
}
</style>
