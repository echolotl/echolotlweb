<template>
  <nuxt-link :to="`/characters/${props.character.slug}`" class="link no-underline character-card">
    <div class="character-card__content">
      <nuxt-img :src="props.character.icon_image" :alt="props.character.name" class="character-card__image" height="150" width="150"/>
      <div class="character-card__text">
        <h2>{{ props.character.name }}</h2>
        <p>{{ props.character.short_description }}</p>
      </div>
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
</script>

<style scoped lang="scss">
.character-card {
  display: inline-flex;
  background-color: var(--surface);
  border: 1px solid var(--distant);
  border-bottom: 3px solid v-bind(characterColor);
  border-radius: 1rem 1rem 0 0;
  width: fit-content;
  min-width: 33%;
  transition: transform 0.2s, box-shadow 0.2s;
}

.character-card__content {
  display: flex;
  flex-direction: row;
  align-items: center;
  padding: 1rem;
  text-decoration: none;
}

.character-card__image {
  width: 150px;
  height: 150px;
  border-radius: 50%;
  object-fit: cover;
}

.character-card__text {
  display: flex;
  flex-direction: column;
  justify-content: center;
  margin-left: 1rem;
  text-decoration: none;
  color: var(--text);
  h2 {
    font-size: 1.5rem;
    margin: 0;
    color: v-bind(characterColor);
  }
}
.character-card:hover {
  transform: translateY(-0.5rem);
  border-color: v-bind(characterColor);
  box-shadow: 0px .5rem 5px var(--surface);
}
</style>
