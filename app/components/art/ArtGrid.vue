<template>
    <div class="art-grid grid-auto-fill">
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
/* Grid layout now uses .grid-auto-fill utility class from _reusables.scss */
.art-grid {
    margin-bottom: 1rem;
}
</style>
