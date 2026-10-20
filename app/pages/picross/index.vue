<template>
  <PicrossPage subtitle="Free Play" accent="#e438e4">
    <PicrossGrid v-if="game" ref="grid" :game="game" />
    <p v-else class="lotl-font loading" role="status">
      <Icon icon="loading" width="20px" height="20px" />
      Loading puzzle...
    </p>
    <p v-if="game?.isCompleted" class="solved-message" role="status">
      The board is solved!
    </p>
    <div class="game-actions">
      <PicrossInputControls :grid="grid" />
      <button @click="handleClear" class="round">
          <Icon icon="trash" width="20px" height="20px" />
          Clear
        </button>
        <button
          :disabled="game?.isCompleted"
          @click="solveGame(game!)"
          class="round filled"
        >
          Solve
        </button>
        <button
          :disabled="game?.isCompleted"
          @click="() => fillRandomTile(game!)"
          class="round"
        >
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
  </PicrossPage>
</template>

<script setup lang="ts">
import {
  createPicrossGame,
  clearBoard,
  solveGame,
  fillRandomTile,
} from "~/utils/picross";
import PicrossGrid from "~/components/picross/PicrossGrid.vue";
import Icon from "~/components/common/Icon.vue";
import PicrossPage from "~/components/picross/PicrossPage.vue";
import PicrossInputControls from "~/components/picross/PicrossInputControls.vue";
import { getHints, type PicrossSize } from "~/utils/picross";
import { generateSolvableSolution } from "~/utils/picross/solver";
import type { PicrossGame } from "~/utils/picross";

const MIN_SIZE = 1;
const MAX_SIZE = 50;
const DEFAULT_SIZE = 10;
const sizeInput = reactive({ width: DEFAULT_SIZE, height: DEFAULT_SIZE });
const game = ref<PicrossGame | null>(null);
const grid = ref<typeof PicrossGrid | null>(null);

function handleClear() {
  if (!game.value) return;
  clearBoard(game.value);
  grid.value?.clearHistory();
}

// Builds a fresh puzzle using the size from the inputs
function regeneratePuzzle() {
  const size: PicrossSize = {
    width: clamp(sizeInput.width, MIN_SIZE, MAX_SIZE),
    height: clamp(sizeInput.height, MIN_SIZE, MAX_SIZE),
  };
  sizeInput.width = size.width;
  sizeInput.height = size.height;
  const solution = generateSolvableSolution(size, getHints);
  game.value = createPicrossGame(size, solution);

  // fill with random colors
  game.value.tileColors = Array.from({ length: size.height }, () =>
    Array.from({ length: size.width }, () => rgbToHex(randomColor(0.4, 0.5))),
  );
}

onMounted(regeneratePuzzle);

useSeoMeta({
  title: "echolotl - Nautilus' Picross (Free Play)",
  description: "Play an unlimited number of Nautilus' picross puzzles.",
  ogDescription: "Play an unlimited number of Nautilus' picross puzzles.",
  ogTitle: "Nautilus' Picross (Free Play)",
  ogUrl: "https://echolotl.lol/picross",
});
</script>

<style scoped>
.game-actions > input[type="number"] {
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
</style>
