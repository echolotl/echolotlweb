<template>
  <div class="picross-page">
    <h1 class="picross-header">Nautilus' Picross</h1>
    <span class="header-games lotl-font">Free Play</span>
    <div class="game">
      <PicrossGrid v-if="game" :game="game" :input-mode="inputMode" @mode-request="inputMode = $event" />
      <p v-if="game?.isCompleted" class="solved-message" role="status">
        The board is solved!
      </p>
      <div class="game-actions">
        <div class="input-modes">
          <button
            :class="{ active: inputMode === 'fill' }"
            @click="inputMode = 'fill'"
            class="round"
          >
            <Icon icon="edit" width="20px" height="20px" />
          </button>
          <button
            :class="{ active: inputMode === 'mark' }"
            @click="inputMode = 'mark'"
            class="round"
          >
            <Icon icon="close" width="20px" height="20px" />
          </button>
          <button
            :class="{ active: inputMode === 'erase' }"
            @click="inputMode = 'erase'"
            class="round"
          >
            <Icon icon="trash" width="20px" height="20px" />
          </button>
        </div>
        <button @click="clearBoard(game!)" class="round">
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
import { createPicrossGame, clearBoard, solveGame, fillRandomTile } from "~/utils/picross";
import PicrossGrid from "~/components/picross/PicrossGrid.vue";
import Icon from "~/components/common/Icon.vue";
import { getHints, type PicrossSize } from "~/utils/picross";
import { generateSolvableSolution } from "~/utils/picross/solver";
import type { PicrossGame, InputMode } from "~/utils/picross";

const MIN_SIZE = 1;
const MAX_SIZE = 50;
const DEFAULT_SIZE = 10;
const sizeInput = reactive({ width: DEFAULT_SIZE, height: DEFAULT_SIZE });
const game = ref<PicrossGame | null>(null);
const inputMode = ref<InputMode>("fill");

// #region GAME INIT

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
    Array.from({ length: size.width }, () => rgbToHex(randomColor(0.7, 0.7)))
  );
}

// #endregion GAME INIT

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
  .input-modes {
    display: flex;
    gap: 8px;
    padding: 4px;
    background: var(--surface);
    border-radius: 8px;
    > button {
      background: none;
      border: none;
      padding: 2px;
      
      &.active {
        background: var(--foreground);
        color: var(--on-primary);
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
</style>
