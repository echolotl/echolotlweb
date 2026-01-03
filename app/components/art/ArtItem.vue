<template>
    <div style="position: relative">
        <nuxt-link :to="`/art/${artwork.slug}`" class="art-item">
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

const metadataTitle = computed(() => {
    const titles = [];
    if (props.artwork.character && props.showCharacterBadge) {
        titles.push("Character");
    }
    if (props.artwork.pinned) {
        titles.push("Pinned");
    }
    if (props.artwork.sketch) {
        titles.push("Sketch");
    }
    if (hasVariants.value) {
        titles.push("Has Variants");
    }
    if (hasMultipleImages.value) {
        titles.push("Multiple Images");
    }
    return titles.join(", ");
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
    transition: transform 0.3s ease;
    will-change: transform;
    outline: none;

    &__image {
        width: 100%;
        height: 100%;
        position: relative;
        overflow: hidden;
        background-size: cover;
        mask-image: url("/images/art_mask.png");
        mask-size: cover;
        mask-repeat: no-repeat;
        background-color: var(--surface);
        z-index: -1;
    }

    img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        display: block;
    }

    &:hover {
        transform: scale(1.01);
        @include drop-shadow-outline(var(--primary));
        .art-item__metadata {
            color: var(--background);
            &::before {
                background: var(--primary);
            }
        }
    }
}
.art-item__metadata {
    position: absolute;
    display: flex;
    color: var(--primary);
    align-items: flex-start;
    justify-content: left;
    transition: filter 0.2s ease;
    z-index: 2;
    width: auto;
    height: auto;
    padding-left: 0.25rem;
    padding-top: 0.25rem;
    padding-right: 0.25rem;
    right: 0;
    bottom: -2%;
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
</style>
