<template>
    <div style="position: relative">
        <nuxt-link :to="`/art/${artwork.slug}`" class="art-item">
            <div
                class="art-item__image"
                :style="`background-image: url(${artwork.images[0]?.thumbnail_url});`"
            >
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
                    <div v-if="hasVariants">
                        <Icon icon="layers" />
                    </div>
                    <div v-if="hasMultipleImages">
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
    transition: transform 0.3s ease;
    will-change: transform;

    &__image {
        width: 100%;
        height: 100%;
        position: relative;
        overflow: hidden;
        background-size: cover;
        mask-image: url("/images/art_mask.png");
        mask-size: cover;
        mask-repeat: no-repeat;
        background-color: var(--background);
    }

    img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        display: block;
    }

    &:hover {
        filter: drop-shadow(0 1px 0 var(--primary))
            drop-shadow(1px 0 0 var(--primary))
            drop-shadow(-1px 0 0 var(--primary))
            drop-shadow(0 -1px 0 var(--primary))
            drop-shadow(1px 1px 0 var(--primary))
            drop-shadow(-1px -1px 0 var(--primary))
            drop-shadow(1px -1px 0 var(--primary))
            drop-shadow(-1px 1px 0 var(--primary));
        transform: scale(1.01);
    }
}
.art-item__metadata {
    position: absolute;
    display: flex;
    color: var(--primary);
    align-items: flex-end;
    justify-content: center;
    transition: filter 0.2s ease;
    z-index: 2;
    width: calc(100% - 0.5rem);
    height: calc(100% - 0.5rem);
    padding: 0.25rem;
    left: 0;
    top: 0;
    aspect-ratio: 1 / 1;
    pointer-events: none;
    filter: drop-shadow(0 0 4px black);
    background-blend-mode: darken;
}
</style>
