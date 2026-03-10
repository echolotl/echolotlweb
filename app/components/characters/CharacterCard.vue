<template>
  <div :to="`/characters/${props.character.slug}`" class="character-card">
    <NuxtLink :to="`/characters/${props.character.slug}`" class="character-card__image">
      <div class="character-card__image-bg"></div>

      <div
        class="character-card__image-icon"
        :style="{ backgroundImage: characterImage }"
      ></div>
      <div
        class="character-card__image-icon-hover"
        :style="{ backgroundImage: characterHoverImage }"
      ></div>
    </NuxtLink>
    <SketchText class="character-card__name" size="1.5rem">{{
      props.character.name
    }}</SketchText>
  </div>
</template>

<script setup lang="ts">
import type { Character } from "~~/types";
import SketchText from "../common/SketchText.vue";
import { useTheme } from "~~/composables/useTheme";

const props = defineProps({
  character: {
    type: Object as () => Character,
    required: true,
  },
});

const { theme } = useTheme();

const characterColor = computed(() => {
  if (!props.character) return "#000000";

  if (theme.value && props.character.theme_color_light) {
    return props.character.theme_color_light;
  }
  return props.character.theme_color || "#000000";
});

const characterImage = `url(/images/characters/${props.character.slug}/icon.webp)`;
const characterHoverImage = `url(/images/characters/${props.character.slug}/hover.webp)`;

// Generate random frame (0-2)
const randomFrameNumber = Math.floor(Math.random() * 3);
const frameImage = `url(/images/characters/frames/${randomFrameNumber}.webp)`;

//-20 to 20 degrees
const randomRotation = `${Math.floor(Math.random() * 41) - 20}deg`;
</script>

<style scoped lang="scss">
@use "~/assets/styles/partials/mixins" as *;

.character-card {
  position: relative;
  max-width: 300px;
  width: fit-content;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-decoration: none;
  transition: transform 0.3s ease;

  &__image {
    position: relative;
    width: 200px;
    height: 200px;
    margin-bottom: 10px;
    &:focus-within {
      outline: none;
    }
  }

  &__image-frame {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: var(--text);
    mask-image: v-bind(frameImage);
    mask-size: contain;
    mask-repeat: no-repeat;
    mask-position: center;
    transition: background-color 0.3s ease;
    z-index: 2;
  }

  &__image-icon {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-size: cover;
    background-position: center;
    background-repeat: no-repeat;
    z-index: 1;
    mask-image: url("/images/art_mask.png");
    mask-size: 160px 160px;
    mask-repeat: no-repeat;
    mask-position: center;
  }

  &__image-bg {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 0;
    mask-image: url("/images/art_mask.png");
    mask-size: 160px 160px;
    mask-repeat: no-repeat;
    mask-position: center;
  }

  &__image-icon-hover {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-size: cover;
    background-position: center;
    background-repeat: no-repeat;
    opacity: 0;
    z-index: 3;
  }

  &__name {
    position: absolute;
    color: transparent;
    bottom: -10px;
    opacity: 0;
    transition:
      opacity 0.3s,
      color 0.3s;
    font-weight: bold;
    text-transform: uppercase;
    text-align: center;
    z-index: 4;
  }

  &:hover, &:focus-within {
    z-index: 10;
    .character-card__image-bg {
      background: v-bind(characterColor);
      transform: rotate(v-bind(randomRotation));
      transition: transform 0.3s;
    }

    .character-card__image-icon-hover {
      opacity: 1;
      animation: bounceScale 0.3s ease;
      @include drop-shadow-outline(v-bind(characterColor));
    }
    .character-card__image-icon {
      opacity: 0;
    }

    .character-card__name {
        @include drop-shadow-outline(var(--background));
      opacity: 1;
      color: v-bind(characterColor);
    }
    .character-card__image-frame {
      animation: frameShrinkShake 0.3s ease forwards;
    }
  }
  &:not(:hover) {
    .character-card__image-icon {
      animation: bounceScaleMask 0.3s ease forwards;
    }
  }
}

@keyframes bounceScale {
  0%,
  100% {
    transform: none;
  }
  40% {
    transform: translateY(-2px);
  }
}
@keyframes bounceScaleMask {
  0% {
    background-position: center 6px;
  }
  100% {
    background-position: center 0;
  }
}
</style>
