<template>
  <div class="character-banner">
    <SketchFilter
      id="sketch-banner-title"
      :seed="64"
      flood-color="var(--background)" />

    <div class="character-banner__content">
      <div
        class="character-banner__texture"
        :style="{
          maskImage: `url(/images/characters/${character.slug}/texture.png)`,
          maskPosition: `0 ${scrollY}px`,
        }" />
      <div class="character-banner__underlay" />
      <div class="character-banner__images">
        <div
          class="character-banner__image"
          :style="{
            maskImage: `url(/images/characters/${character.slug}/banner.png)`,
          }" />
        <div
          class="character-banner__image left"
          :style="{
            maskImage: `url(/images/characters/${character.slug}/banner.png)`,
          }" />
      </div>
      <div class="character-banner__title">
        <h1 class="character-banner__title-image">
          {{ character.name }}
        </h1>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { CharactersCollectionItem } from "@nuxt/content";
import SketchFilter from "../common/SketchFilter.vue";

const scrollY = ref(0);

function onScroll() {
  if (window.scrollY > 600) return;
  scrollY.value = window.scrollY * 0.5;
}

onMounted(() => {
  scrollY.value = window.scrollY;
  window.addEventListener("scroll", onScroll, { passive: true });
});

onUnmounted(() => {
  window.removeEventListener("scroll", onScroll);
});

const props = defineProps<{
  character: CharactersCollectionItem;
}>();

const titleImage = `url(/images/characters/${props.character.slug}/title.png)`;
</script>

<style scoped lang="scss">
@use "~/assets/styles/partials/_mixins" as *;
.character-banner {
  position: relative;
  height: 600px;
  overflow: hidden;
  z-index: -1;
  @media not screen {
    display: none;
  }
}

.character-banner__content {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: -1;
  @media (max-width: 768px) {
    justify-content: flex-start;
  }
}

.character-banner__texture {
  display: block;
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: var(--theme-color);
  opacity: 0.3;
  z-index: -1;
  mask-repeat: repeat;
  mask-size: 300px 300px;
  mask-origin: content-box;
  @include theme-transition;
}

.character-banner__image {
  display: block;
  position: absolute;
  top: 0;
  right: 0;
  width: 100%;
  height: 100%;
  background-color: var(--inverted-solid);
  background-position: center;
  z-index: -1;
  mask-origin: content-box;
  mask-repeat: no-repeat;
  mask-position: right;
  &.left {
    left: 0;
    right: auto;
    transform: scaleX(-1);
    @media (max-width: 768px) {
      display: none;
    }
  }
}
.character-banner__underlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: -1;
  @include gradient-fade-bottom(var(--theme-color));
  @include theme-transition;
}
.character-banner__underlay::after {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: -1;
  background-color: var(--background);
  mask-image: linear-gradient(to top, black, transparent);
  @include theme-transition;
}
.character-banner__images {
  @include mask-gradient(to top, transparent, 0%, black, 70%);
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  backdrop-filter: drop-shadow(0 0 2px rgba(0, 0, 0, 0.5));
}
.character-banner__title {
  &-image {
    background-color: color-mix(
      in oklch,
      var(--theme-color) 50%,
      var(--inverted-solid) 50%
    );
    mask-image: v-bind(titleImage);
    width: 600px;
    height: 200px;
    mask-repeat: no-repeat;
    mask-position: center;
    image-rendering: crisp-edges;
  }
  filter: url(#sketch-banner-title);

  @include smooth-transition(background-color, 0.2s);
  @media (max-width: 768px) {
    &-image {
      width: calc(2 / 3) * 100vw;
      mask-size: contain;
      mask-position: left;
    }
    margin-left: 1rem;
  }
}
</style>
