<template>
  <nuxt-link :to="`/characters/${props.character.slug}`" class="character-card">
    <div class="character-card__image">
        <div class="character-card__image-bg"></div>

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

// Generate random rotation (-20 to 20 degrees)
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
    transition: filter 0.3s ease;
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
    mask-image: url('/images/art_mask.png');
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
    background: var(--background);
    z-index: 0;
    mask-image: url('/images/art_mask.png');
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
    transition: opacity 0.3s, color 0.3s;
    font-weight: bold;
    text-transform: uppercase;
    text-align: center;
  }

  &:hover {
    .character-card__image {
      filter: drop-shadow(0 1px 0 v-bind(characterColor)) drop-shadow(1px 0 0 v-bind(characterColor)) drop-shadow(-1px 0 0 v-bind(characterColor)) drop-shadow(0 -1px 0 v-bind(characterColor)) drop-shadow(1px 1px 0 v-bind(characterColor)) drop-shadow(-1px -1px 0 v-bind(characterColor)) drop-shadow(1px -1px 0 v-bind(characterColor)) drop-shadow(-1px 1px 0 v-bind(characterColor));
    }
    .character-card__image-bg {
      background: linear-gradient(to bottom, v-bind(characterColor), transparent);
      transform: rotate(v-bind(randomRotation));
      transition: transform 0.3s;
    }

    .character-card__image-icon-hover {
      opacity: 1;
        animation: bounceScale 0.3s ease;
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
  &:not(:hover) {
    .character-card__image-icon {
      animation: bounceScaleMask 0.3s ease forwards;
    }
  }
}

@keyframes bounceScale {
  0%, 100% {
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
