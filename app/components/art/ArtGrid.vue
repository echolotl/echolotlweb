<template>
    <div class="art-grid">
        <ArtItem
            v-for="artwork in artworks"
            :key="artwork.slug"
            :artwork="artwork"
            :show-metadata="showMetadata"
            :show-character-badge="showCharacterBadge"
        />
    </div>
</template>

<script setup lang="ts">
import type { Art } from "~~/types";
import ArtItem from "~/components/art/ArtItem.vue";

defineProps<{
    artworks: Art[];
    showMetadata?: boolean;
    showCharacterBadge?: boolean;
}>();
</script>

<style scoped lang="scss">
.art-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: 1rem;
    margin-bottom: 1rem;
    justify-content: center;
    @media (max-width: 600px) {
        grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    }
}
</style>
