<template>
  <div class="picross-page">
    <SketchFilter id="picross-sketch-filter" flood-color="var(--background)" />
    <div class="picross-header-container">
      <h1 class="picross-header">Nautilus' Picross</h1>
    </div>
    <span class="header-games lotl-font">Free Play</span>
    <div class="game">
      <PicrossGrid v-if="game" ref="grid" :game="game" />
      <p v-else class="lotl-font loading" role="status">
        <Icon icon="loading" width="20px" height="20px" />
        Loading puzzle...
      </p>
      <p v-if="game?.isCompleted" class="solved-message" role="status">
        The board is solved!
      </p>
      <div class="game-actions">
        <div class="input-modes">
          <button
            :class="{ active: grid?.inputMode === 'fill' }"
            @click="grid?.setInputMode('fill')"
            class="round"
          >
            <Icon icon="edit" width="20px" height="20px" />
          </button>
          <button
            :class="{ active: grid?.inputMode === 'mark' }"
            @click="grid?.setInputMode('mark')"
            class="round"
          >
            <Icon icon="close" width="20px" height="20px" />
          </button>
          <button
            :class="{ active: grid?.inputMode === 'erase' }"
            @click="grid?.setInputMode('erase')"
            class="round"
          >
            <Icon icon="trash" width="20px" height="20px" />
          </button>
        </div>
        <div class="input-modes">
          <button
            :disabled="!grid?.canUndo"
            @click="grid?.undo()"
            class="round"
            aria-label="Undo"
          >
            <Icon icon="undo" width="20px" height="20px" />
          </button>
          <button
            :disabled="!grid?.canRedo"
            @click="grid?.redo()"
            class="round"
            aria-label="Redo"
          >
            <Icon icon="redo" width="20px" height="20px" />
          </button>
        </div>
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
    </div>
  </div>
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
import SketchFilter from "~/components/common/SketchFilter.vue";
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
.picross-page {
  margin-top: 64px;
  display: flex;
  flex-direction: column;
  align-items: center;
  min-height: 80vh; /* Ensure the page takes full viewport height */
  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    display: block;
    height: 500px;
    width: 100%;
    opacity: 0.5;
    background: radial-gradient(circle 400px at 50% -10%, #e438e4, transparent);
  }
}
.picross-header-container {
  position: relative;
  width: 100%;
  filter: url(#picross-sketch-filter);
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
  .input-modes,
  .history-actions {
    display: flex;
    gap: 6px;
  }
  .input-modes {
    padding: 4px;
    background: var(--surface);
    border-radius: 8px;
    > button {
      background: none;
      border: none;
      padding: 2px;
      border-radius: 4px;

      &.active {
        background: var(--foreground);
      }
    }
  }
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

.loading {
  font-size: 1rem;
  color: var(--text);
  display: flex;
  align-items: center;
  gap: 8px;
  height: 400px;
  justify-content: center;
}
</style>
