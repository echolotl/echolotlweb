<template>
  <span :class="['tag', `tag--${variant}`, { 'tag--clickable': clickable }]" :style="customStyles">
    <Icon v-if="icon" :icon="icon" :color="iconColor" />
    <slot></slot>
  </span>
</template>

<script setup lang="ts">
import Icon from './Icon.vue';

interface Props {
  variant?: 'default' | 'character' | 'more';
  icon?: string;
  iconColor?: string;
  clickable?: boolean;
  customColor?: string;
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'default',
  clickable: false,
});

const customStyles = computed(() => {
  if (props.customColor && props.variant === 'character') {
    return {
      borderColor: `color-mix(in oklab, ${props.customColor} 20%, var(--distant) 80%)`,
      color: props.customColor,
      backgroundColor: `color-mix(in oklab, ${props.customColor} 10%, color-mix(in oklab, transparent 50%, var(--background) 90%) 50%)`,
    };
  }
  return {};
});
</script>

<style scoped lang="scss">
@use "~/assets/styles/partials/_variables" as *;

.tag {
  border: 1px solid var(--distant);
  background: rgba(0, 0, 0, 0.05);
  color: var(--text-secondary);
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.8rem;
  font-family: $body-font;
  font-weight: 400;
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  transition: background-color 0.2s ease, color 0.2s ease, border-color 0.2s ease;
  
  &--default {
    text-transform: uppercase;
  }
  
  &--character {
    text-transform: none;
    text-decoration: none;
    
    &.tag--clickable:hover {
      background: var(--distant);
      color: var(--text);
    }
  }
  
  &--more {
    border: none;
    font-weight: 600;
    padding: 0.25rem 0;
    background: transparent;
  }
  
  &--clickable {
    cursor: pointer;
    
    &:hover {
      background: var(--distant);
    }
  }
}
</style>
