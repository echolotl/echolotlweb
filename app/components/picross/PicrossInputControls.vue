<template>
  <div class="input-modes">
    <button
      v-for="mode in modes"
      :key="mode.mode"
      :class="{ active: grid?.inputMode === mode.mode }"
      :disabled="disabled"
      @click="grid?.setInputMode(mode.mode)"
      class="round"
    >
      <Icon :icon="mode.icon" width="20px" height="20px" />
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
</template>

<script setup lang="ts">
import Icon from "~/components/common/Icon.vue";
import type PicrossGrid from "~/components/picross/PicrossGrid.vue";

defineProps<{
  grid: InstanceType<typeof PicrossGrid> | null;
  disabled?: boolean;
}>();

const modes = [
  { mode: "fill", icon: "edit" },
  { mode: "mark", icon: "close" },
  { mode: "erase", icon: "trash" },
] as const;
</script>

<style scoped>
.input-modes {
  display: flex;
  gap: 6px;
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
</style>
