<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="open"
        ref="overlayRef"
        class="modal-overlay"
        popover="manual"
        @click.self="closeOnBackdrop && close()"
      >
        <SketchFilter
          :id="filterId"
          :std-deviation="1.5"
          :intercept="-6"
          :flood-color="outlineColor"
        />
        <div
          ref="boxRef"
          class="modal"
          :class="{ 'modal--icon': props.icon }"
          role="dialog"
          aria-modal="true"
          :aria-label="ariaLabel"
          tabindex="-1"
          :style="{ '--filter-url': `url(#${filterId})`, maxWidth }"
        >
          <Icon
            v-if="props.icon"
            :icon="props.icon"
            class="modal__icon"
            :color="props.iconColor"
            width="48px"
            height="48px"
          />
          <button
            v-if="props.closeButton"
            class="modal__close"
            @click="close()"
          >
            <Icon icon="close" width="28px" height="28px" />
          </button>
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
    closeOnBackdrop?: boolean;
    closeOnEscape?: boolean;
    closeButton?: boolean;
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
    closeButton: true,
  },
);

const open = defineModel<boolean>({ required: true });

const emit = defineEmits<{
  (e: "close"): void;
}>();

const filterId = ref(`modal-sketch-${useId()}`);
const boxRef = ref<HTMLElement | null>(null);
const overlayRef = ref<HTMLElement | null>(null);

function close() {
  open.value = false;
  emit("close");
}

function onKeydown(event: KeyboardEvent) {
  if (props.closeOnEscape && event.key === "Escape") close();
}

watch(
  open,
  (isOpen) => {
    if (!import.meta.client) return;
    document.body.style.overflow = isOpen ? "hidden" : "";
    if (isOpen) {
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
  &__close {
    position: absolute;
    top: -16px;
    right: -16px;
    background: none;
    border: none;
    border-radius: 9999px;
    aspect-ratio: 1 / 1;
    padding: 4px;
    cursor: pointer;
    &:hover {
      background: var(--surface);
    }
  }
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
      right: 24px;
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
