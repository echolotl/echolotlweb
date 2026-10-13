<template>
  <Modal
    :model-value="modelValue"
    max-width="440px"
    aria-label="Age verification"
    icon="warning"
    icon-color="var(--orange)"
    @update:model-value="onUpdate">
    <div class="age-gate">
      <h2 class="age-gate__title lotl-font">Hang on...</h2>
      <p class="age-gate__text">
        This content is NSFW and intended for adults only. Are you 18 or older
        <i class="text-secondary"
          >(or equivalent in whatever region you are in)</i
        >?
      </p>
      <label class="age-gate__remember">
        <input v-model="dontAskAgain" type="checkbox" />
        Don't ask again
      </label>
      <div class="age-gate__actions">
        <button class="filled orange" @click="onYes"><b>Yes</b></button>
        <button class="round" @click="onNo">No</button>
      </div>
    </div>
  </Modal>
</template>

<script setup lang="ts">
import Modal from "../common/Modal.vue";
import { useAgeVerification } from "../../../composables/useAgeVerification";
import Icon from "../common/Icon.vue";

defineProps<{ modelValue: boolean }>();

const emit = defineEmits<{
  (e: "update:modelValue", value: boolean): void;
  (e: "confirm"): void;
  (e: "deny"): void;
}>();

const { confirm } = useAgeVerification();
const dontAskAgain = ref(false);

function onYes() {
  confirm(dontAskAgain.value);
  emit("update:modelValue", false);
  emit("confirm");
}

function onNo() {
  emit("update:modelValue", false);
  emit("deny");
}

function onUpdate(value: boolean) {
  if (!value) emit("deny");
  emit("update:modelValue", value);
}
</script>

<style scoped lang="scss">
.age-gate {
  display: flex;
  flex-direction: column;
  gap: 12px;

  &__title {
    margin: 0;
  }

  &__text {
    margin: 0;
  }

  &__remember {
    display: flex;
    align-items: center;
    gap: 8px;
    cursor: pointer;
    user-select: none;
  }

  &__actions {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
    margin-top: 4px;
  }
}
</style>
