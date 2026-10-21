<template>
  <PicrossPage subtitle="Editor" accent="var(--orange)">
    <PicrossGrid v-if="game" ref="grid" :game="game" :editable="true" />
    <div class="game-actions">
      <PicrossInputControls :grid="grid" :remove-modes="['mark']" />
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
      <div class="solve-result">
        <Icon
          v-if="solving"
          icon="loading"
          alt="Checking solvability"
          width="20px"
          height="20px"
        />
        <Icon
          v-else-if="
            solveResult?.logicSolvable && solveResult?.solutionCount === 1
          "
          style="color: var(--green)"
          icon="check"
          width="20px"
          height="20px"
        />
        <Icon
          v-else-if="solveResult && solveResult.solutionCount > 0"
          style="color: var(--orange)"
          icon="warning"
          width="20px"
          height="20px"
        />
        <Icon
          v-else
          style="color: var(--red)"
          icon="danger"
          width="20px"
          height="20px"
        />
      </div>
    </div>
    <div class="settings">
      <fieldset>
        <legend>Board Settings</legend>
        <label>
          Size
          <input
            v-model.number="sizeInput.width"
            type="number"
            :min="MIN_BOARD_SIZE"
            :max="MAX_BOARD_SIZE"
            aria-label="Board width"
            @change="applySizeInput"
          />
          <span aria-hidden="true">x</span>
          <input
            v-model.number="sizeInput.height"
            type="number"
            :min="MIN_BOARD_SIZE"
            :max="MAX_BOARD_SIZE"
            aria-label="Board height"
            @change="applySizeInput"
          />
        </label>
      </fieldset>
      <fieldset>
        <legend>Puzzle Info</legend>
        <label>
          Title
          <input v-model="metadata.title" type="text" maxlength="100" />
        </label>
        <label>
          Author
          <input v-model="metadata.author" type="text" maxlength="100" />
        </label>
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
const metadata = reactive({ title: "", author: "", createdAt: "" });
const game = ref<PicrossGame | null>(null);
const grid = ref<InstanceType<typeof PicrossGrid> | null>(null);
const fileInput = ref<HTMLInputElement | null>(null);
const fileError = ref("");
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
  if (
    game.value &&
    size.width === game.value.size.width &&
    size.height === game.value.size.height
  ) {
    return;
  }
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
  const now = new Date().toISOString();
  metadata.createdAt ||= now;
  const title = metadata.title.trim();
  const author = metadata.author.trim();
  let contents: string;
  try {
    contents = savePicrossPuzzle({
      metadata: {
        title: title || undefined,
        author: author || undefined,
        created_at: metadata.createdAt,
        modified_at: now,
      },
      size: game.value.size,
      solution: game.value.solution,
      tileColors: game.value.tileColors,
    });
  } catch (error) {
    fileError.value = error instanceof Error ? error.message : "Couldn't save";
    return;
  }

  const filename =
    (title || "puzzle")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "puzzle";
  const url = URL.createObjectURL(new Blob([contents], { type: "text/plain" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = `${filename}.${FILE_EXTENSION}`;
  link.click();
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
    const puzzle = loadPicrossPuzzle(await file.text());
    game.value = buildGame(puzzle.size, puzzle);
    sizeInput.width = puzzle.size.width;
    sizeInput.height = puzzle.size.height;
    const { title, author, created_at } = puzzle.metadata;
    metadata.title = typeof title === "string" ? title : "";
    metadata.author =
      typeof author === "string" ? author : (author?.placeholder ?? "");
    metadata.createdAt = typeof created_at === "string" ? created_at : "";
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
.settings > fieldset > label > input[type="number"],
.settings > fieldset > label > input[type="text"] {
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

.file-error {
  color: var(--red);
}

.solve-result {
  align-items: center;
  justify-content: center;
}
</style>
