<template>
  <Modal
    v-model="open"
    icon="help"
    icon-color="var(--blue)"
  >
    <div class="how-to-play-modal">
      <h2 class="how-to-play-modal__title lotl-font">
        How to Picross
        <span class="text-secondary">with Nautilus</span>
      </h2>
      <p class="how-to-play-modal__text">
        <b>Picross</b> <span class="text-secondary">(or Nonograms)</span> is a
        puzzle game where you fill in pixels on a grid based on the number hints
        provided by each <b>row</b> and <b>column</b>. Most puzzles can be
        solved logically without guessing.
      </p>
      <p class="how-to-play-modal__text">
        <b>Hints</b> indicate the individual <b>runs of pixels</b> that need to
        be filled in for each row and column. Runs must be separated by
        <b>at least one empty pixel</b>, but that does not mean there can only
        be one empty pixel between runs.
      </p>
      <div class="how-to-play-modal__example">
        <span class="how-to-play-modal__example-hints lotl-font">
          <span v-for="(hint, i) in exampleHints" :key="i">{{ hint }}</span>
        </span>
        <div class="how-to-play-modal__example-board" aria-hidden="true">
          <span
            v-for="(state, i) in exampleRow"
            :key="i"
            class="how-to-play-modal__example-tile"
            :class="state"
          />
        </div>
      </div>
      <p class="how-to-play-modal__text text-secondary">
        The hint <b>2 1</b> means this row has a run of two filled pixels,
        followed by a run of one, with at least one empty pixel between them.
      </p>
      <h3 class="how-to-play-modal__subtitle lotl-font">Tips & Tricks</h3>
      <ul class="how-to-play-modal__list">
        <li>
          Try to start with rows or columns that have the largest numbers!
        </li>
        <li>
          Remember to mark (<Icon icon="close" width="18px" height="18px" />)
          what you think are empty pixels.
        </li>
        <li>
          See if pixels HAVE to be filled based on every possible configuration
          of the row or column.
        </li>
        <li class="text-secondary">hi mimi</li>
      </ul>
    </div>
  </Modal>
</template>

<script lang="ts" setup>
import Modal from "~/components/common/Modal.vue";
import Icon from "../common/Icon.vue";

const open = defineModel<boolean>({ required: true });

const exampleHints = [2, 1];
const exampleRow = ["filled", "filled", "empty", "empty", "filled"];
</script>

<style scoped lang="scss">
.how-to-play-modal {
  display: flex;
  flex-direction: column;
  gap: 12px;

  &::after {
    content: "";
    position: absolute;
    display: block;
    background-image: url("/images/picross/nautilus_how_to_play.webp");
    background-size: contain;
    background-repeat: no-repeat;
    left: -264px;
    top: -6px;

    width: 300px;
    height: 400px;

    @media (max-width: 768px) {
      display: none;
    }
  }

  &__title {
    margin: 0;
  }
  &__subtitle {
    margin: 0;
  }

  &__text {
    margin: 0;
  }

  &__example {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 16px;
  }

  &__example-hints {
    display: flex;
    gap: 8px;
    font-size: 14px;
    line-height: 30px;
  }

  &__example-board {
    --tile: 30px;
    display: grid;
    grid-template-columns: repeat(5, var(--tile));
    grid-auto-rows: var(--tile);
    background-color: var(--surface);
    overflow: hidden;
    box-shadow: 0 0 0 1px var(--foreground);
  }

  &__example-tile {
    position: relative;
    box-sizing: border-box;
    border-left: 1px solid var(--distant);
    background-color: color-mix(in srgb, var(--inverted-solid) 5%, transparent);

    &:first-child {
      border-left: none;
    }

    &.filled::before {
      content: "";
      position: absolute;
      inset: 0;
      background: var(--text);
    }

    &.marked::before {
      content: "";
      position: absolute;
      inset: 0;
      background: var(--text);
      mask-image: url("/images/icons/close.webp");
      mask-size: 100%;
    }
  }

  &__text :deep(.icon),
  li :deep(.icon) {
    vertical-align: -0.125em;
  }

  &__close {
    background: none;
    border: none;
    border-radius: 9999px;
    aspect-ratio: 1 / 1;
    padding: 4px;
    cursor: pointer;
    &:hover {
      background: rgba(0, 0, 0, 0.1);
    }
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
  &__list {
    padding-left: 20px;
    margin: 0;
  }
}
</style>
