<template>
  <nuxt-link :to="`/characters/${props.character.slug}`" class="character-card">
    <div class="character-card__content">
      <div class="character-card__image" />
    </div>
  </nuxt-link>
</template>

<script setup lang="ts">
import type { Character } from "~/types";

const props = defineProps({
  character: {
    type: Object as () => Character,
    required: true,
  },
});

const characterColor = props.character?.theme_color || "#000000";
const characterImage = props.character?.icon_image ? `url(${props.character.icon_image})` : "";
const characterHoverImage = props.character?.icon_image_hover ? `url(${props.character.icon_image_hover})` : "";
</script>

<style scoped lang="scss">
@use "~/assets/styles/partials/mixins" as *;

.character-card {
  color: v-bind(characterColor);
  text-decoration: none;
  @include smooth-transition((transform, box-shadow, border-color, color), 0.2s);
}

.character-card:hover {
  transform: translateY(-5px);

}

.character-card__content {
  display: flex;
  flex-direction: row;
  padding: 1rem;
  text-decoration: none;
.character-card__image {
  width: 150px;
  height: 150px;
  object-fit: cover;
  background-image: v-bind(characterImage);
  background-size: cover;
  background-position: center;
  @include smooth-transition(background-image, 0.2s);
}
}

.character-card__content:hover .character-card__image {
  background-image: v-bind(characterHoverImage);
}

</style>
