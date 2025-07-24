<template>
  <div class="art-page">
    <h1 class="large-title">Art Archive</h1>
    
  </div>
</template>

<script setup lang="ts">
import type { Art } from '~/types';
import { getArtworks } from '#imports';

const page = ref(0);

const { data: artworks } = await useAsyncData('art', () => getArtworks(10, page.value));

const loadMore = async () => {
  page.value++;
  const newArtworks = await getArtworks(10, page.value);
  if (artworks.value) {
    artworks.value.push(...newArtworks);
  }
};

const navigateToArt = (artwork: Art) => {
  // temp
  window.open(artwork.image_url, '_blank');
};

// Meta data for the page
useSeoMeta({
  title: 'Art Archive - Echolotl',
  description: 'Explore our collection of artwork featuring Echolotl characters',
});
</script>

<style scoped lang="scss">
.art-page {
  margin: 0 auto;
  padding: 2rem;
  max-width: 1200px;
  text-align: center;
  
  h1 {
    margin-bottom: 1rem;
  }
  
  p {
    font-size: 1.1rem;
    color: var(--text);
  }
}
</style>
