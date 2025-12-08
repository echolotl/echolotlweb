<template>
    <div v-if="character" class="character-page">
        <CharacterBanner :character="character" />
        <div class="character-content">
            <div class="character-main-content">
                <div class="character-infobox">
                    <span
                        class="character-infobox__label"
                        :style="{ color: character.theme_color }"
                        >... CHARACTER INFO</span
                    >
                    <div
                        class="character-infobox__details"
                        :style="{
                            borderTop: `2px solid ${character.theme_color}`,
                        }"
                    >
                        <span
                            class="font-display character-infobox__title"
                            :style="{ color: character.theme_color }"
                            ><SketchText
                                size="1.75em"
                                style="margin: 0.25rem 0"
                                >{{ character.name }}</SketchText
                            ></span
                        >
                        <hr />
                        <div class="character-infobox__header">
                            <figure style="text-align: center; margin: 0">
                                <nuxt-img
                                    :src="
                                        character.image ||
                                        '/images/no_image.png'
                                    "
                                    alt="Character Image"
                                />
                                <figcaption
                                    style="color: var(--text-secondary)"
                                >
                                    <i>{{
                                        character.image_description ||
                                        "no description available"
                                    }}</i>
                                </figcaption>
                            </figure>
                        </div>
                        <hr />
                        <table class="character-infobox__table">
                            <tbody>
                                <tr>
                                    <td class="character-infobox__item-label">
                                        Age
                                    </td>
                                    <td>{{ character.age || "Unknown" }}</td>
                                </tr>
                                <tr>
                                    <td class="character-infobox__item-label">
                                        Pronouns
                                    </td>
                                    <td>
                                        {{ character.pronouns || "Unknown" }}
                                    </td>
                                </tr>
                                <tr>
                                    <td class="character-infobox__item-label">
                                        Species
                                    </td>
                                    <td>
                                        {{ character.species || "Unknown" }}
                                    </td>
                                </tr>
                                <tr>
                                    <td class="character-infobox__item-label">
                                        Creation Date
                                    </td>
                                    <td>
                                        {{
                                            utils.formatDate(
                                                new Date(
                                                    character.created_date,
                                                ),
                                            ) || "Unknown"
                                        }}
                                    </td>
                                </tr>
                                <tr>
                                    <td class="character-infobox__item-label">
                                        Height
                                    </td>
                                    <td>
                                        {{
                                            `${character.height} (${utils.feetStringToCm(character.height)}cm)` ||
                                            "Unknown"
                                        }}
                                    </td>
                                </tr>
                                <tr>
                                    <td class="character-infobox__item-label">
                                        Friends
                                    </td>
                                    <td>
                                        <span
                                            v-if="
                                                character.friends &&
                                                character.friends.length > 0
                                            "
                                        >
                                            <template
                                                v-for="(
                                                    friend, index
                                                ) in character.friends"
                                                :key="friend.slug"
                                            >
                                                <CharacterLink
                                                    :slug="friend.slug"
                                                    sketch-text
                                                ></CharacterLink>
                                                <span
                                                    v-if="
                                                        index <
                                                        character.friends
                                                            .length -
                                                            1
                                                    "
                                                    style="
                                                        display: block;
                                                        margin-bottom: 0.25rem;
                                                    "
                                                ></span>
                                            </template>
                                        </span>
                                        <span v-else>None</span>
                                    </td>
                                </tr>
                                <tr>
                                    <td class="character-infobox__item-label">
                                        Enemies
                                    </td>
                                    <td>
                                        <span
                                            v-if="
                                                character.enemies &&
                                                character.enemies.length > 0
                                            "
                                        >
                                            <template
                                                v-for="(
                                                    enemy, index
                                                ) in character.enemies"
                                                :key="enemy.slug"
                                            >
                                                <CharacterLink
                                                    :slug="enemy.slug"
                                                    sketch-text
                                                ></CharacterLink>
                                                <span
                                                    v-if="
                                                        index <
                                                        character.enemies
                                                            .length -
                                                            1
                                                    "
                                                    style="
                                                        display: block;
                                                        margin-bottom: 0.25rem;
                                                    "
                                                ></span>
                                            </template>
                                        </span>
                                        <span v-else>None</span>
                                    </td>
                                </tr>
                                <tr>
                                    <td class="character-infobox__item-label">
                                        Type
                                    </td>
                                    <td>
                                        {{ character.clan || "Unknown" }}
                                        <Icon
                                            :icon="character.clan"
                                            height="24"
                                            class="character-infobox__clan-icon"
                                        />
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
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
            <div
                v-if="characterArtworks && characterArtworks.length > 0"
                class="character-images__grid"
            >
                <ArtItem
                    v-for="artwork in characterArtworks"
                    :key="artwork.slug"
                    :artwork="artwork"
                    show-metadata
                />
            </div>
            <div v-else-if="!artworkLoading" class="no-artwork">
                <p>No artwork found for this character yet.</p>
            </div>
            <div v-if="artworkLoading" class="loading">
                <Icon icon="loading" />
                Loading more artwork...
            </div>
            <SplashText
                v-if="
                    hasReachedEnd &&
                    characterArtworks &&
                    characterArtworks.length > 0
                "
            />
        </div>
    </div>
</template>

<script setup lang="ts">
import CharacterBanner from "~/components/characters/CharacterBanner.vue";
import CharacterLink from "~/components/common/CharacterLink.vue";
import SketchText from "~/components/common/SketchText.vue";
import ArtItem from "~/components/art/ArtItem.vue";

import Icon from "~/components/common/Icon.vue";
import { getArtworksByCharacter } from "~/utils/art";

import utils from "~/utils";
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
const ITEMS_PER_PAGE = 12;
const artworkPage = ref(1);
const artworkLoading = ref(false);
const hasReachedEnd = ref(false);

const { data: initialCharacterArtworks } = await useAsyncData(
    `character-artworks-${route.params.slug}`,
    async () => {
        if (!character.value) return [];
        const artworks = await getArtworksByCharacter(
            character.value.slug,
            ITEMS_PER_PAGE,
            1,
        );

        // Remove any potential duplicates from the initial load
        const uniqueArtworks = artworks.filter(
            (artwork, index, arr) =>
                arr.findIndex((a) => a.slug === artwork.slug) === index,
        );

        return uniqueArtworks;
    },
    {
        watch: [() => route.params.slug],
    },
);

const characterArtworks = ref(initialCharacterArtworks.value || []);

const loadMoreArtwork = async () => {
    if (artworkLoading.value || hasReachedEnd.value || !character.value) return;

    artworkLoading.value = true;
    artworkPage.value++;

    try {
        const newArtworks = await getArtworksByCharacter(
            character.value.slug,
            ITEMS_PER_PAGE,
            artworkPage.value,
        );

        console.log(
            "Loaded character artworks for page",
            artworkPage.value,
            ":",
            newArtworks.length,
            "items",
        );

        if (newArtworks.length === 0) {
            hasReachedEnd.value = true;
        } else {
            // Filter out duplicates by checking if artwork slug already exists
            const existingArtworkSlugs = new Set(
                characterArtworks.value.map((artwork) => artwork.slug),
            );
            const uniqueNewArtworks = newArtworks.filter(
                (artwork) => !existingArtworkSlugs.has(artwork.slug),
            );

            console.log(
                "Unique new character artworks:",
                uniqueNewArtworks.length,
                "out of",
                newArtworks.length,
            );

            if (uniqueNewArtworks.length > 0) {
                characterArtworks.value = [
                    ...characterArtworks.value,
                    ...uniqueNewArtworks,
                ];
            }

            if (newArtworks.length < ITEMS_PER_PAGE) {
                hasReachedEnd.value = true;
            }
        }
    } catch (error) {
        console.error("Error loading more character artworks:", error);
        // Revert page increment on error
        artworkPage.value--;
    } finally {
        artworkLoading.value = false;
    }
};

const checkScrollPosition = () => {
    const scrollPosition = window.innerHeight + window.scrollY;
    const threshold = document.body.offsetHeight - 1000; // Load when 1000px from bottom

    if (scrollPosition >= threshold) {
        loadMoreArtwork();
    }
};

// Throttle scroll events for better performance
let scrollTimeout: NodeJS.Timeout | null = null;
const throttledScrollCheck = () => {
    if (scrollTimeout) return;

    scrollTimeout = setTimeout(() => {
        checkScrollPosition();
        scrollTimeout = null;
    }, 100);
};

// Set up infinite scrolling
onMounted(() => {
    window.addEventListener("scroll", throttledScrollCheck);
    // Manually change the --scrollbar-bar-- CSS variable to character theme color
    document.documentElement.style.setProperty(
        "--scrollbar-bar",
        character.value?.theme_color || "#000000",
    );
});

onUnmounted(() => {
    window.removeEventListener("scroll", throttledScrollCheck);
    if (scrollTimeout) {
        clearTimeout(scrollTimeout);
    }
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
    ogImage: character.value.image || "/images/no_image.png",
    ogImageAlt: character.value.image_description || "",
    twitterCard: "summary_large_image",
    twitterImage: character.value.image || "/images/no_image.png",
    themeColor: character.value.theme_color || "#000000",
});
</script>

<style lang="scss" scoped>
.character-page {
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
.character-infobox {
    float: right;
    width: 300px;
    margin-left: 20px;
    margin-bottom: 20px;

    @media (max-width: 768px) {
        float: none;
        width: 100%;
        margin: 0 0 20px 0;
        order: -1; /* Places infobox above content on mobile */
    }
}
.character-infobox__label {
    font-weight: bold;
    font-size: 0.9em;
    margin-bottom: 5px;
    letter-spacing: 0.05em;
    color: var(--distant);
    text-transform: uppercase;
    width: 100%;
    display: inline-block;
    text-align: right;
}
.character-infobox__item-label {
    font-weight: bold;
    font-size: 1em;
    letter-spacing: 0.05em;
    color: var(--text);
    text-transform: uppercase;
}
.character-infobox__details {
    padding: 10px;
    font-size: 0.8em;
    line-height: 1.5;
    color: var(--text);
    border: 1px solid var(--distant);
    background-color: rgba(0, 0, 0, 0.05);
}
.character-infobox__title {
    font-size: 1.75em;
    margin-bottom: 10px;
    display: block;
    font-weight: 900;
    text-align: center;
}
.section-title {
    display: flex;
    align-items: center;
    gap: 0.5rem;
}
.character-infobox__header {
    display: flex;
    flex-direction: column;
    align-items: center;
    margin-bottom: 10px;
    img {
        width: 100%;
        height: auto;
        max-width: 200px;
        border-radius: 8px;
        margin-bottom: 5px;
    }
}
.character-infobox__table {
    width: 100%;
    border-collapse: collapse;
    margin-top: 10px;
    --theme-color: v-bind(character.theme_color);
    tr {
        &:nth-child(even) {
            background-color: color-mix(
                in srgb,
                var(--theme-color) 5%,
                transparent
            );
        }
        td {
            padding: 8px 4px;
            vertical-align: middle;
            &:last-child {
                display: flex;
                align-items: center;
                gap: 4px;
            }
        }
    }
}
.character-infobox__clan-icon {
    width: 24px;
    height: 24px;
}

.character-images {
    &__grid {
        display: grid;
        row-gap: 0.5rem;
        column-gap: 1rem;
        grid-template-columns: repeat(auto-fill, 200px);
        justify-content: center;
    }
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
    font-size: 1.1rem;
}

.end-message {
    text-align: center;
    padding: 2rem;
    font-size: 1.1rem;
    color: var(--text-secondary);
    font-style: italic;
}
</style>
