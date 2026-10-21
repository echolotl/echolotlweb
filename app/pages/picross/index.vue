<template>
  <PicrossPage subtitle="Free Play" accent="var(--primary)">
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
        :min="MIN_BOARD_SIZE"
        :max="MAX_BOARD_SIZE"
        aria-label="Board width"
      />
      <span aria-hidden="true">x</span>
      <input
        v-model.number="sizeInput.height"
        type="number"
        :min="MIN_BOARD_SIZE"
        :max="MAX_BOARD_SIZE"
        aria-label="Board height"
      />
      <button @click="regeneratePuzzle" class="round filled">Regenerate</button>
    </div>
  </PicrossPage>
</template>

<script setup lang="ts">
import {
  createPicrossGame,
  clearBoard,
  clampPicrossSize,
  solveGame,
  fillRandomTile,
  DEFAULT_BOARD_SIZE,
  MAX_BOARD_SIZE,
  MIN_BOARD_SIZE,
} from "~/utils/picross";
import PicrossGrid from "~/components/picross/PicrossGrid.vue";
import Icon from "~/components/common/Icon.vue";
import PicrossPage from "~/components/picross/PicrossPage.vue";
import PicrossInputControls from "~/components/picross/PicrossInputControls.vue";
import { getHints } from "~/utils/picross";
import { generateSolvableSolution } from "~/utils/picross/solver";
import type { PicrossGame } from "~/utils/picross";

const sizeInput = reactive({
  width: DEFAULT_BOARD_SIZE,
  height: DEFAULT_BOARD_SIZE,
});
const game = ref<PicrossGame | null>(null);
const grid = ref<InstanceType<typeof PicrossGrid> | null>(null);

function handleClear() {
  if (!game.value) return;
  clearBoard(game.value);
  grid.value?.clearHistory();
}

// Builds a fresh puzzle using the size from the inputs
function regeneratePuzzle() {
  const size = clampPicrossSize(sizeInput);
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
