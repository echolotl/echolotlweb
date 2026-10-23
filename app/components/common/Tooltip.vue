<template>
  <div class="tooltip" :style="{ anchorName }">
    <slot></slot>
    <span class="tooltiptext" :style="{ positionAnchor: anchorName }">
      <slot name="text"></slot>
    </span>
  </div>
</template>

<script setup lang="ts">
// Unique per instance so each tooltip anchors to its own wrapper
const anchorName = `--tooltip-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
</script>

<style scoped>
.tooltip .tooltiptext {
  visibility: hidden;
  position: absolute;
  z-index: 1;
  position-area: bottom center;
  margin: 8px;
  background: var(--foreground);
  padding: 5px 10px;
  border: 2px solid var(--background);
  border-radius: 12px;
  opacity: 0;
  transform: scale(0.5);
  transform-origin: top center;
  transition:
    opacity 0.3s,
    transform 0.3s;

  &:after {
    content: "";
    position: absolute;
    bottom: 100%;
    left: 50%;
    transform: translateX(-50%);
    border-width: 5px;
    border-style: solid;
    border-color: transparent transparent var(--foreground) transparent;
  }
}

.tooltip:hover .tooltiptext {
  visibility: visible;
  opacity: 1;
  transform: scale(1);
}
</style>
