<template>
    <div v-if="artworks.length > 0" class="art-grid grid-auto-fill">
        <ArtItem
            v-for="artwork in artworks"
            :key="artwork.slug"
            :artwork="artwork"
            :show-metadata="showMetadata"
            :show-character-badge="showCharacterBadge" />
    </div>
    <p
        v-else
        style="color: var(--text-secondary); text-align: center; width: 100%">
        No artworks found! Try adjusting your filters?
    </p>
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
