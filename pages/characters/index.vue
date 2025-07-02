<template>
  <div class="characters-page">
    <h1 class="large-title">Characters</h1>
    <p class="subtitle">Want to know more about my characters? Click on any of their cards to go to their page!</p>
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
  margin: 0 auto;
  padding: 2rem;
  max-width: 1600px;
  h1 {
    text-align: center;
  }
}

.characters-list {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  flex-direction: row;
  gap: 2rem;
  margin-top: 2rem;
}

.subtitle {
  text-align: center;
}
</style>
