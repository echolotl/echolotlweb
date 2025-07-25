<template>
    <nuxt-link :to="`/art/${artwork.slug}`" class="art-item">
        <div class="art-item__image">
            <nuxt-img :src="artwork.thumbnail_url" :alt="artwork.title" />
        </div>
        <div v-if="!showMetadata" class="art-item__metadata">
            <div v-if="artwork.character">
                <Icon icon="character"/>
            </div>
            <div v-if="artwork.pinned">
                <Icon icon="pin"/>
            </div>
        </div>
    </nuxt-link>
</template>

<script setup lang="ts">
import type { Art } from '~/types';
import Icon from '~/components/common/Icon.vue';

defineProps<{
    artwork: Art;
    showMetadata?: boolean;
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

    &__image {
        width: 200px;
        height: 200px; // Adjust height as needed
        overflow: hidden;
        border-radius: .5rem;
        border: 1px solid var(--distant);
        border-bottom-width: 2px;
        
    }

    &__metadata {
        position: absolute;
        display: flex;
        width: 100%;
        height: 100%;
        justify-content: flex-end;
        align-items: flex-end;
        color: var(--primary);
        filter: drop-shadow(0 1px 2px black);
    }

    nuxt-img {
        width: 100%;
        height: 100%;
        object-fit: cover;
    }

    &:hover {
        transform: scale(1.05);
    }
}
</style>