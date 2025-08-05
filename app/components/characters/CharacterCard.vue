<template>
  <nuxt-link :to="`/characters/${props.character.slug}`" class="character-card">
    <div class="character-card__image">
      <div class="character-card__image-frame"></div>
        <div class="character-card__image-icon" :style="{ backgroundImage: characterImage }"></div>
        <div class="character-card__image-icon-hover" :style="{ backgroundImage: characterHoverImage }"></div>
    </div>
    <SketchText class="character-card__name" size="1.5rem">{{ props.character.name }}</SketchText>

  </nuxt-link>
</template>

<script setup lang="ts">
import type { Character } from "~~/types";
import SketchText from "../common/SketchText.vue";

const props = defineProps({
  character: {
    type: Object as () => Character,
    required: true,
  },
});

const characterColor = props.character?.theme_color || "#000000";
const characterImage = props.character?.icon_image ? `url(${props.character.icon_image})` : "";
const characterHoverImage = props.character?.icon_image_hover ? `url(${props.character.icon_image_hover})` : "";

// Generate random frame (0-2)
const randomFrameNumber = Math.floor(Math.random() * 3);
const frameImage = `url(/images/characters/frames/${randomFrameNumber}.webp)`;
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
  transition: all 0.3s ease;

  &__image {
    position: relative;
    width: 200px;
    height: 200px;
    margin-bottom: 10px;
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
    transition: opacity 0.3s ease, color 0.3s ease;
    font-weight: bold;
    text-transform: uppercase;
    text-align: center;
  }

  &:hover {
    .character-card__image-frame {
      background-color: v-bind(characterColor);
    }

    .character-card__image-icon-hover {
      opacity: 1;
          animation: bounceScale 0.3s ease forwards;
    }
    .character-card__image-icon {
      opacity: 0;
    }

    .character-card__name {
      opacity: 1;
      color: v-bind(characterColor);
    }
    .character-card__image-frame {
      animation: frameShrinkShake 0.3s ease forwards;
    }
  }
}

@keyframes bounceScale {
  0%, 100% {
    transform: scale(1);
  }
  45% {
    transform: scale(1.01) translateY(1px);
  }
}

@keyframes frameShrinkShake {
  0% {
    transform: scale(1);
  }
  50% {
    transform: rotate3d(0, 0, 1, -1deg);
  }
  100% {
    transform: scale(1);
  }

}
</style>
