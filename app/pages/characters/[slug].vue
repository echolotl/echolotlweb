<template>
    <div v-if="character" class="character-page" :style="{ '--theme-color': themeColor }">
        <CharacterBanner :character="character" />
        <div class="character-content">
            <div class="character-main-content">
                <CharacterInfobox :character="character" />
                <content-renderer
                    :value="character"
                    class="character-text"
                    prose
                />
            </div>
        </div>
        <div class="character-images">
            <h2 class="section-title"><Icon icon="art" /> Character Images</h2>
            <hr />
            <ArtGrid
                v-if="characterArtworks && characterArtworks.length > 0"
                :artworks="characterArtworks"
                show-metadata
            />
            <div v-else class="no-artwork">
                <p>No artwork found for this character yet.</p>
            </div>
            <SplashText
                v-if="characterArtworks && characterArtworks.length > 0"
            />
        </div>
    </div>
</template>

<script setup lang="ts">
import CharacterBanner from "~/components/characters/CharacterBanner.vue";
import CharacterInfobox from "~/components/characters/CharacterInfobox.vue";
import ArtGrid from "~/components/art/ArtGrid.vue";
import Icon from "~/components/common/Icon.vue";
import { getArtworksByCharacter } from "~/utils/art";

import { useTheme } from "~~/composables/useTheme";
import SplashText from "~/components/common/SplashText.vue";

const route = useRoute();

const { data: character } = await useAsyncData(
    `character-${route.params.slug}`,
    () => {
        const slug = route.params.slug;
        return queryCollection("characters").where("slug", "=", slug).first();
    },
    {
        watch: [() => route.params.slug],
    },
);

// Redirect to 404 if character is not found
if (!character.value) {
    throw createError({
        statusCode: 404,
        statusMessage: "Character not found",
    });
} else {
    console.log("Character data loaded:", character.value);
}

// Character artwork loading
const { data: characterArtworks } = await useAsyncData(
    `character-artworks-${route.params.slug}`,
    async () => {
        if (!character.value) return [];
        return await getArtworksByCharacter(character.value.slug);
    },
    {
        watch: [() => route.params.slug],
    },
);

const { theme } = useTheme();

const themeColor = computed(() => {
    if (!character.value) return "#000000";
    
    // If theme is light (true), use light color if available
    if (theme.value && character.value.theme_color_light) {
        return character.value.theme_color_light;
    }
    // Otherwise use the default theme color
    return character.value.theme_color || "#000000";
});

onBeforeUnmount(() => {
    // Reset scrollbar color on unmount
    document.documentElement.style.setProperty(
        "--scrollbar-bar",
        "var(--primary)",
    );
});

useSeoMeta({
    title: character.value.name,
    description: character.value.short_description,
    ogTitle: character.value.name,
    ogDescription: character.value.short_description,
    ogImage: character.value.image || null,
    ogImageAlt: character.value.image_description || "",
    twitterCard: "summary_large_image",
    twitterImage: character.value.image || null,
    themeColor: themeColor.value || "#000000",
});
</script>

<style lang="scss" scoped>
@use "~/assets/styles/partials/mixins" as *;
.character-page {
    position: relative;
    min-height: 100vh;
}

.character-content,
.character-images {
    padding: 20px;
    max-width: 1200px;
    margin: 0 auto;

    @media (max-width: 768px) {
        /* On mobile, stack vertically */
        display: flex;
        flex-direction: column;
    }

    /* Clear floats after content */
    &::after {
        content: "";
        display: table;
        clear: both;
    }
}
.character-text {
    /* Text will naturally wrap around the floated infobox */
    text-align: justify;

    @media (max-width: 768px) {
        order: 1;
    }
}
.section-title {
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.no-posts {
    text-align: center;
    padding: 2rem;
    color: var(--text-secondary);
    font-style: italic;
}

.no-artwork {
    text-align: center;
    padding: 2rem;
    color: var(--text-secondary);
    font-style: italic;
}

.loading {
    text-align: center;
    padding: 2rem;
}

.end-message {
    text-align: center;
    padding: 2rem;
    font-size: var(--base-text);
    color: var(--text-secondary);
    font-style: italic;
}
</style>
