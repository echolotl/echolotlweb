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
  z-index: 10;
  top: anchor(bottom);
  left: anchor(center);
  width: max-content;
  margin: 8px 0 0;
  background: var(--surface);
  padding: 5px 10px;
  border: 2px solid var(--distant);
  border-radius: 12px;
  opacity: 0;
  transform: translateX(-50%) scale(0.5);
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
    border-color: transparent transparent var(--surface) transparent;
  }
  /** bigger hover area, bridging the gap to the anchor */
  &:before {
    content: "";
    position: absolute;
    top: -10px;
    left: 50%;
    transform: translateX(-50%);
    width: 100%;
    height: calc(100% + 10px);
  }
}

.tooltip:hover .tooltiptext {
  visibility: visible;
  opacity: 1;
  transform: translateX(-50%) scale(1);
}
</style>
