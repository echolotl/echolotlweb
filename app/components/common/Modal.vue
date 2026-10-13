<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="modelValue"
        ref="overlayRef"
        class="modal-overlay"
        popover="manual"
        @click.self="closeOnBackdrop && close()">
        <SketchFilter
          :id="filterId"
          :std-deviation="1.5"
          :intercept="-6"
          :flood-color="outlineColor" />
        <div
          ref="boxRef"
          class="modal"
          :class="{ 'modal--icon': props.icon }"
          role="dialog"
          aria-modal="true"
          :aria-label="ariaLabel"
          tabindex="-1"
          :style="{ '--filter-url': `url(#${filterId})`, maxWidth }">
          <Icon
            v-if="props.icon"
            :icon="props.icon"
            class="modal__icon"
            :color="props.iconColor"
            width="48px"
            height="48px" />
          <div class="modal__content">
            <slot />
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import Icon from "./Icon.vue";
import SketchFilter from "./SketchFilter.vue";

const props = withDefaults(
  defineProps<{
    modelValue: boolean;
    closeOnBackdrop?: boolean;
    closeOnEscape?: boolean;
    ariaLabel?: string;
    maxWidth?: string;
    outlineColor?: string;
    icon?: string;
    iconColor?: string;
  }>(),
  {
    closeOnBackdrop: true,
    closeOnEscape: true,
    ariaLabel: undefined,
    maxWidth: "600px",
    outlineColor: "var(--surface)",
    icon: undefined,
    iconColor: undefined,
  },
);

const emit = defineEmits<{
  (e: "update:modelValue", value: boolean): void;
  (e: "close"): void;
}>();

const filterId = ref(`modal-sketch-${useId()}`);
const boxRef = ref<HTMLElement | null>(null);
const overlayRef = ref<HTMLElement | null>(null);

function close() {
  emit("update:modelValue", false);
  emit("close");
}

function onKeydown(event: KeyboardEvent) {
  if (props.closeOnEscape && event.key === "Escape") close();
}

watch(
  () => props.modelValue,
  (open) => {
    if (!import.meta.client) return;
    document.body.style.overflow = open ? "hidden" : "";
    if (open) {
      window.addEventListener("keydown", onKeydown);
      nextTick(() => {
        // Top layer, so the modal also appears above open popovers
        overlayRef.value?.showPopover?.();
        boxRef.value?.focus();
      });
    } else {
      window.removeEventListener("keydown", onKeydown);
    }
  },
  { immediate: true },
);

onBeforeUnmount(() => {
  if (!import.meta.client) return;
  document.body.style.overflow = "";
  window.removeEventListener("keydown", onKeydown);
});
</script>

<style scoped lang="scss">
.modal-overlay {
  position: fixed;
  inset: 0;
  width: 100%;
  height: 100%;
  max-width: none;
  max-height: none;
  margin: 0;
  border: none;
  box-sizing: border-box;
  overflow: visible;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: rgb(0 0 0 / 60%);
}

.modal {
  position: relative;
  width: 100%;
  max-height: 100%;
  display: flex;
  border: none;
  outline: none;
  background: var(--surface);
  color: var(--text);
  filter: var(--filter-url);
  border-radius: 16px;

  &__content {
    flex: 1;
    min-width: 0;
    padding: 24px;
    overflow-y: auto;
  }
  &__icon {
    position: absolute;
    top: 8px;
    left: -32px;
  }

  // On narrow screens there's no room beside the box, so the icon
  // sits centered over its top edge
  @media (max-width: 768px) {
    &__icon {
      top: -24px;
      right: 16px;
      left: auto;
    }

    &--icon &__content {
      padding-top: 16px;
    }
  }
}

.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.2s ease;

  .modal {
    transition: transform 0.2s ease;
  }
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;

  .modal {
    transform: translateY(12px) scale(0.97);
  }
}
</style>
