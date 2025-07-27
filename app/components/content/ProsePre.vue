<template>
  <div class="prose-code">
    <div class="prose-code__header">
      <span class="language">{{ language || 'plaintext' }}</span>
      <span class="filename"><b>{{ filename }}</b></span>
    </div>
    <div class="prose-code__content">
      <pre :class="$props.class"><slot /></pre>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps({
  code: {
    type: String,
    default: ''
  },
  language: {
    type: String,
    default: null
  },
  filename: {
    type: String,
    default: null
  },
  highlights: {
    type: Array as () => number[],
    default: () => []
  },
  meta: {
    type: String,
    default: null
  },
  class: {
    type: String,
    default: null
  }
})
</script>

<style scoped lang="scss">
.prose-code {
  background: var(--background);
  border: 1px solid var(--distant);
  width: fit-content;
  height: fit-content;
  border-radius: 4px;
  overflow-x: auto;
  white-space: pre;
    background: rgba(0, 0, 0, 0.05);
}
.prose-code__header {
  display: flex;
  justify-content: space-between;
  font-size: 0.8em;
  background-color: var(--distant);
  padding: 4px;
}
.prose-code__content {
  padding: 0 8px;
}
</style>