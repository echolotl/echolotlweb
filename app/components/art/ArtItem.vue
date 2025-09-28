<template>
  <nuxt-link :to="`/art/${artwork.slug}`" class="art-item">
    <div class="art-item__image" :style="`background-image: url(${artwork.images[0]?.thumbnail_url});`" >
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
  filter: drop-shadow(0 1px 0 var(--distant)) drop-shadow(1px 0 0 var(--distant)) drop-shadow(-1px 0 0 var(--distant)) drop-shadow(0 -1px 0 var(--distant) ) drop-shadow(1px 1px 0 var(--distant)) drop-shadow(-1px -1px 0 var(--distant)) drop-shadow(1px -1px 0 var(--distant)) drop-shadow(-1px 1px 0 var(--distant));
  transition: filter 0.3s ease , transform 0.3s ease;
  will-change: filter transform;

  &__image {
    width: 100%;
    height: 100%;
    position: relative;
    overflow: hidden;
    background-size: cover;
    mask-image: url('/images/art_mask.png');
    mask-size: cover;
    mask-repeat: no-repeat;

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
    filter: drop-shadow(0 1px 0 var(--primary)) drop-shadow(1px 0 0 var(--primary)) drop-shadow(-1px 0 0 var(--primary)) drop-shadow(0 -1px 0 var(--primary)) drop-shadow(1px 1px 0 var(--primary)) drop-shadow(-1px -1px 0 var(--primary)) drop-shadow(1px -1px 0 var(--primary)) drop-shadow(-1px 1px 0 var(--primary));
    transform: scale(1.03);
  }
}
</style>
