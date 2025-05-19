<template>
  <div class="characters-page">
    <h1>Characters</h1>
    <div class="characters-list">
      <CharacterCard
        v-for="(character, index) in characters"
        :key="index"
        :character="character"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useAsyncData } from "nuxt/app";
import CharacterCard from "~/components/characters/CharacterCard.vue";

const { data: characters } = await useAsyncData(() => {
  return queryCollection("characters").all();
});
</script>

<style scoped lang="scss">
.characters-page {
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
  h1 {
    text-align: center;
  }
}

.characters-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1rem;
}
</style>
