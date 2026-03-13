<template>
    <div style="position: relative; display: flex; justify-content: center" class="art-item-container" :style="{ '--filter-url': `url(#${filterId})` }">
            <svg xmlns="http://www.w3.org/2000/svg" style="position: absolute; width: 0; height: 0; overflow: hidden">
  <defs>
    <filter
      :id="filterId"
      color-interpolation-filters="sRGB"
      x="-50%"
      y="-50%"
      width="200%"
      height="200%"
    >
    <feTurbulence type="fractalNoise" baseFrequency="0.1" numOctaves="5" result="noise" :seed="seed" />
      <feGaussianBlur in="SourceAlpha" stdDeviation="2" result="blurred" />
      <feComponentTransfer in="blurred" result="expanded">
        <feFuncA type="linear" slope="500" intercept="-5" />
      </feComponentTransfer>
      <feFlood flood-color="var(--theme-color, var(--primary))" result="color" />
      <feComposite in="color" in2="expanded" operator="in" result="border" />
      <feDisplacementMap in="border" in2="noise" scale="6" xChannelSelector="A" yChannelSelector="A" result="sketchBorder" />
      <feMerge>
        <feMergeNode in="sketchBorder" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>
  </defs>
</svg>
        <nuxt-link :to="`/art/${artwork.slug}`" class="art-item" :aria-label="`View Artwork: ${artwork.title}`">
            <div
                class="art-item__image"
                :style="`background-image: url(${artwork.images[0]?.thumbnail_url});`"
                :title="artwork.title"
            >
                <div v-if="showMetadata" class="art-item__metadata">
                    <div
                        v-if="artwork.character && showCharacterBadge"
                        class="art-item__metadata-icon"
                        title="Character"
                    >
                        <Icon icon="character" />
                    </div>
                    <div
                        v-if="artwork.pinned"
                        class="art-item__metadata-icon"
                        title="Pinned"
                    >
                        <Icon icon="pin" />
                    </div>
                    <div
                        v-if="artwork.sketch"
                        class="art-item__metadata-icon"
                        title="Sketch"
                    >
                        <Icon icon="sketch" />
                    </div>
                    <div
                        v-if="hasVariants"
                        class="art-item__metadata-icon"
                        title="Has Variants"
                    >
                        <Icon icon="layers" />
                    </div>
                    <div
                        v-if="hasMultipleImages"
                        class="art-item__metadata-icon"
                        title="Multiple Images"
                    >
                        <Icon icon="images" />
                    </div>
                </div>
            </div>
        </nuxt-link>
    </div>
</template>

<script setup lang="ts">
import type { Art } from "~~/types";
import Icon from "~/components/common/Icon.vue";

const filterId = `outline-${Math.random().toString(36).slice(2)}`;
const seed = Math.floor(Math.random() * 20000);

const props = defineProps<{
    artwork: Art;
    showMetadata?: boolean;
    showCharacterBadge?: boolean;
}>();

const hasVariants = computed(() => {
    return (props.artwork.images?.[0]?.variants?.length || 0) > 0;
});

const hasMultipleImages = computed(() => {
    return (props.artwork.images?.length || 0) > 1;
});
</script>

<style scoped lang="scss">
@use "~/assets/styles/partials/_mixins" as *;

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
    transform-origin: center;
    transition: transform 0.3s ease-out;
    will-change: transform filter;
    outline: none;

    &__image {
        width: 100%;
        height: 100%;
        position: relative;
        overflow: hidden;
        background-size: 110%;
        background-position: center;
        background-repeat: no-repeat;
        mask-image: url("/images/art_mask.png");
        mask-size: cover;
        mask-repeat: no-repeat;
        background-color: var(--surface);
        z-index: -1;
        will-change: background-size;
        transition: background-size 0.3s ease-out;
    }

    img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        display: block;
    }

    &:hover, &:focus-within {
        transform: scale(1.1);
        
        .art-item__image {
            background-size: 100%;
        }
        .art-item__metadata {
            color: var(--background);
            &::before {
                background: var(--theme-color, var(--primary));
            }
        }
    }

    &:not(:hover):not(:focus-within) {
        animation: bounceInScale 0.3s;
        .art-item__image {
            animation: bounceInBackground 0.3s;
        }
    }
}
.art-item-container {
    &:hover, &:focus-within {
        filter: var(--filter-url);
    }

}
.art-item__metadata {
    position: absolute;
    display: flex;
    color: var(--theme-color, var(--primary));
    align-items: flex-start;
    justify-content: left;
    transition: filter 0.2s ease;
    z-index: 2;
    width: auto;
    height: auto;
    padding-left: 2%;
    padding-top: 2%;
    padding-right: 2%;
    right: 0;
    bottom: 0;
    pointer-events: none;
    background-blend-mode: darken;
    &::before {
        content: "";
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: var(--background);
        z-index: -3;
        border-radius: 0.5rem 0 0 0;
        corner-shape: superellipse(1.2);
        border: none;
    }

    &-icon {
        pointer-events: auto;
    }
}

@keyframes bounceInScale {
    0%,
    100% {
        transform: scale(1);
    }
    50%{
        transform: scale(0.975);
    }
}

@keyframes bounceInBackground {
    0%,
    100% {
        background-size: 110%;
    }
   50% {
        background-size: 111.26%;
    }
    
}
</style>
