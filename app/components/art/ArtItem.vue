<template>
  <nuxt-link :to="`/art/${artwork.slug}`" class="art-item">
    <div class="art-item__image">
                      <div v-if="showMetadata" class="art-item__metadata">
          <div v-if="artwork.character && showCharacterBadge">
            <Icon icon="character" />
          </div>
          <div v-if="artwork.pinned">
            <Icon icon="pin" />
          </div>
          <div v-if="artwork.sketch">
            <Icon icon="sketch" />
            </div>
        </div>
      <nuxt-img :src="artwork.thumbnail_url" :alt="artwork.title" />
    </div>
  </nuxt-link>
</template>

<script setup lang="ts">
import type { Art } from "~~/types";
import Icon from "~/components/common/Icon.vue";

defineProps<{
  artwork: Art;
  showMetadata?: boolean;
  showCharacterBadge?: boolean;
}>();
</script>

<style scoped lang="scss">
.art-item {
  display: flex;
  position: relative;
  flex-direction: column;
  align-items: center;
  text-decoration: none;
  color: inherit;
  width: 100%;
  aspect-ratio: 1;
  max-width: 200px;

  &__image {
    width: 100%;
    height: 100%;
    position: relative;
    overflow: hidden;
    border-radius: 0.5rem;
    border: 1px solid var(--distant);
    border-bottom-width: 2px;

    .art-item__metadata {
      position: absolute;
      display: flex;
      width: 100%;
      height: 100%;
      color: var(--primary);
      align-items: flex-end;
      justify-content: center;
      filter: drop-shadow(0 1px 0 var(--background)) drop-shadow(1px 0 0 var(--background)) drop-shadow(-1px 0 0 var(--background)) drop-shadow(0 -1px 0 var(--background));
      transition: filter 0.2s ease;
    }
  }

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }


  &:hover {
    transform: scale(1.05);
  }
}
</style>
