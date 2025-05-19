<template>
  <nuxt-link :to="`/characters/${props.character.id}`" class="link">
    <div class="character-card">
      <img :src="props.character.icon_image" :alt="props.character.name" />
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
  background-color: var(--background);
  border: 1px solid var(--distant);
  border-bottom: 3px solid v-bind(characterColor);
  border-radius: 1rem 1rem 0 0;
  width: 100%;
  padding: 1rem;
  margin: 1rem;
  transition: transform 0.2s, box-shadow 0.2s;
  box-shadow: 5px 5px 0 var(--distant);
    display: flex;
    flex-direction: row;
  h2 {
    color: v-bind(characterColor);
    font-size: 1.5rem;
    margin: 0;
    margin-bottom: 0.5rem;
  }
}
.character-card:hover {
  transform: translateY(-0.5rem);
  border-color: v-bind(characterColor);
  box-shadow: 3px 5px 5px var(--slightbg);
}
</style>
