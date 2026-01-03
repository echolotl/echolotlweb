<template>
    <div class="art-page">
        <div style="width: 100%; display: flex; justify-content: center">
            <SketchText size="4rem">ART ARCHIVE</SketchText>
        </div>

        <div v-if="allPinnedArtworks.length > 0" class="section-header">
            <Icon icon="pin" />
            <h2 class="section-title" style="transform: translateY(2px)">
                <SketchText size="1.5rem">PINNED</SketchText>
            </h2>
        </div>
        <hr v-if="allPinnedArtworks.length > 0" />
        <ArtGrid :artworks="allPinnedArtworks" />
        <div class="section-header section-header-with-filter">
            <div class="section-title-group">
                <h2 class="section-title" style="transform: translateY(2px)">
                    <SketchText size="1.5rem">All</SketchText>
                </h2>
            </div>
            <div class="filter-chips" aria-label="Artwork filters">
                <button
                    class="button--chip"
                    :class="{ active: filters.sketches }"
                    @click="toggleFilter('sketches')"
                    :aria-pressed="filters.sketches"
                >
                    <Icon icon="sketch" />
                    <span>Sketches</span>
                </button>
                <button
                    class="button--chip"
                    :class="{ active: filters.characterArt }"
                    @click="toggleFilter('characterArt')"
                    :aria-pressed="filters.characterArt"
                >
                    <Icon icon="character" />
                    <span>Character Art</span>
                </button>
                <button
                    class="button--chip"
                    :class="{ active: filters.generalArt }"
                    @click="toggleFilter('generalArt')"
                    :aria-pressed="filters.generalArt"
                >
                    <Icon icon="art" />
                    <span>General Art</span>
                </button>
            </div>
        </div>
        <hr />
        <ArtGrid
            :artworks="filteredArtworks"
            show-metadata
            show-character-badge
        />
        <SplashText />
    </div>
</template>

<script setup lang="ts">
import { getArtworks, getPinnedArtworks } from "#imports";
import Icon from "~/components/common/Icon.vue";
import SketchText from "~/components/common/SketchText.vue";
import SplashText from "~/components/common/SplashText.vue";
import ArtGrid from "~/components/art/ArtGrid.vue";

const filters = ref({
    sketches: false,
    characterArt: false,
    generalArt: false,
});

const { data: pinnedArtworks } = await useAsyncData("pinned-art", () =>
    getPinnedArtworks(),
);
const { data: allArtworks } = await useAsyncData("all-art", () =>
    getArtworks(),
);

const allPinnedArtworks = ref(pinnedArtworks.value || []);
const allRegularArtworks = ref(
    (allArtworks.value || []).filter((artwork) => !artwork.pinned),
);

const filteredArtworks = computed(() => {
    const nonPinnedArtworks = allRegularArtworks.value;

    return nonPinnedArtworks.filter((artwork) => {
        // If no filters are active, show all non-pinned
        if (
            !filters.value.sketches &&
            !filters.value.characterArt &&
            !filters.value.generalArt
        ) {
            return true;
        }

        let showArtwork = false;

        // Sketch/WIP filter
        if (filters.value.sketches && artwork.sketch) {
            showArtwork = true;
        }

        // Character art filter
        if (
            filters.value.characterArt &&
            (artwork.character ||
                (artwork.related_characters &&
                    artwork.related_characters.length > 0))
        ) {
            showArtwork = true;
        }

        // General art filter
        if (
            filters.value.generalArt &&
            !artwork.character &&
            (!artwork.related_characters ||
                artwork.related_characters.length === 0)
        ) {
            showArtwork = true;
        }

        return showArtwork;
    });
});

const toggleFilter = (
    filterName: "sketches" | "characterArt" | "generalArt",
) => {
    filters.value[filterName] = !filters.value[filterName];
};

useSeoMeta({
    title: "Art Archive",
    description: "Explore all of the art created by echolotl!",
    ogTitle: "echolotl's Art Archive",
    ogDescription: "Explore all of the art created by echolotl!",
});
</script>

<style scoped lang="scss">
.art-page {
    margin: 0 auto;
    padding: 2rem;
    margin-top: 2rem;
    max-width: 1200px;
    text-align: center;
    @media (max-width: 600px) {
        padding: 1rem;
    }
}

.art-title {
    mask-image: url("/images/art/art_archive_title.webp");
    mask-size: contain;
    mask-repeat: no-repeat;
    mask-position: center;
    width: 100%;
    max-width: 500px;
    height: 100px;
    image-rendering: crisp-edges;
    background-color: var(--text);
}

.filter-container {
    position: relative;
}

.filter-chips {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
    justify-content: flex-end;
    max-width: 100%;
    @media (max-width: 700px) {
        justify-content: center;
        margin-top: 0.5rem;
    }
}

/* Filter chips now use .button--chip class from main.scss */

.loading {
    text-align: center;
    padding: 2rem;
    font-size: 1.1rem;
    color: var(--text-secondary);
}

.end-message {
    text-align: center;
    padding: 2rem;
    font-size: 1.1rem;
    color: var(--text-secondaty);
    font-style: italic;
}

.section-header {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin: 1rem 0;
    h2 {
        margin: 0;
    }
}

.section-header-with-filter {
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
}

.section-title-group {
    display: flex;
    align-items: center;
    gap: 0.5rem;
}
</style>
