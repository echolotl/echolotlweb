<template>
  <PicrossPage subtitle="Editor" accent="var(--orange)">
    <PicrossGrid
      v-if="game"
      ref="grid"
      :game="game"
      :editable="true"
      :paint-color="curPaintColor"
      :style="curPaintColor ? { '--paint-color': curPaintColor } : {}"
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
    <div v-if="grid?.inputMode === 'paint'" class="palette">
      <input type="color" v-model="newColor" />
      <button @click="addColor()">
        <Icon icon="add" width="16px" height="16px" />
      </button>
      <div
        v-for="(color, index) in palette"
        :key="index"
        class="color-swatch"
        :class="{ selected: selectedColor === color }"
        :style="{ '--paint-color': color }"
        @click="selectedColor = color"
      ></div>
    </div>

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
        <legend>Board</legend>
        <label>
          Size
          <div class="size-inputs">
            <input
              v-model.number="sizeInput.width"
              type="number"
              :min="MIN_BOARD_SIZE"
              :max="MAX_BOARD_SIZE"
              aria-label="Board width"
              @change="applySizeInput"
            />
            <span aria-hidden="true">⨯</span>
            <input
              v-model.number="sizeInput.height"
              type="number"
              :min="MIN_BOARD_SIZE"
              :max="MAX_BOARD_SIZE"
              aria-label="Board height"
              @change="applySizeInput"
            />
          </div>
        </label>
      </fieldset>
      <fieldset>
        <legend>Metadata</legend>
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
              v-model="metadata.author"
              placeholder="echolotl"
              type="text"
              maxlength="100"
            />
          </label>
          <label>
            Source
            <input
              v-model="metadata.source"
              placeholder="Some picross game"
              type="text"
              maxlength="100"
            />
          </label>
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
import {
  createPicrossGame,
  clearBoard,
  clampPicrossSize,
  getHints,
  DEFAULT_BOARD_SIZE,
  MAX_BOARD_SIZE,
  MIN_BOARD_SIZE,
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
const metadata = reactive<Omit<PicrossMetadata, "created_at" | "modified_at">>({
  title: "",
  author: "",
  source: "",
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

function addColor() {
  const color = newColor.value.toLowerCase();
  if (!palette.value.includes(color)) palette.value.push(color);
  selectedColor.value = color;
}

function removeColor() {
  const index = palette.value.indexOf(selectedColor.value);
  if (index === -1) return;
  palette.value.splice(index, 1);
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

// Resizes once the user commits a value, so typing never wipes tiles midway
function applySizeInput() {
  const size = clampPicrossSize(sizeInput);
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
    const puzzle = loadPicrossPuzzle(
      new Uint8Array(await file.arrayBuffer()),
    );
    game.value = buildGame(puzzle.size, puzzle);
    sizeInput.width = puzzle.size.width;
    sizeInput.height = puzzle.size.height;
    const { title, author, source, created_at } = puzzle.metadata;
    metadata.title = title;
    metadata.author = author;
    metadata.source = source;
    createdAt = created_at;
  } catch (error) {
    fileError.value =
      error instanceof Error ? error.message : "Couldn't load that file";
  }
}

watch(
  () => game.value?.hints,
  (hints) => {
    if (game.value && hints) solve(hints, game.value.size);
  },
);

useSeoMeta({
  title: "echolotl - Nautilus' Picross (Free Play)",
  description: "Play an unlimited number of Nautilus' picross puzzles.",
  ogDescription: "Play an unlimited number of Nautilus' picross puzzles.",
  ogTitle: "Nautilus' Picross (Free Play)",
  ogUrl: "https://echolotl.lol/picross",
});
</script>

<style scoped>
.size-inputs {
  display: flex;
  align-items: center;
  gap: 4px;
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
  gap: 4px;
  button {
    padding: 0;
    background: none;
    border: none;
  }
  .color-swatch {
    width: 24px;
    height: 24px;
    border-radius: 4px;
    background-color: var(--paint-color);
    cursor: pointer;
    &.selected {
      outline: 2px solid var(--text);
    }
  }
}
</style>
