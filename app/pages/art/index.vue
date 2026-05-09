<template>
    <div class="art-page">
        <h1 class="art-title">Artchive</h1>
        <p class="subtitle">
            echolotl's archive of art! Currently contains
            <b>{{ allArtworks?.length }}</b> artworks. Click on any piece to
            view details.
        </p>

        <div v-if="allPinnedArtworks.length > 0" class="section-header">
            <h2 class="section-title">
                <Icon icon="pin" />
                <SketchText size="1.2em">Pinned</SketchText>
            </h2>
        </div>
        <ArtGrid :artworks="allPinnedArtworks" />
        <div class="section-header section-header-with-filter">
            <div class="section-title-group">
                <h2 class="section-title">
                    <SketchText size="1.2em">All</SketchText>
                </h2>
            </div>
            <button id="filter-button" popovertarget="filter-popover">
                <Icon icon="filter" />
            </button>
            <div id="filter-popover" popover="auto" anchor="filter-button">
                <div>
                    <fieldset>
                        <label>
                            <input
                                type="checkbox"
                                v-model="filters.generalArt" />
                            General
                            <Icon icon="art" />
                        </label>
                        <label>
                            <input
                                type="checkbox"
                                v-model="filters.characterArt" />
                            Character
                            <Icon icon="character" />
                        </label>
                    </fieldset>
                    <hr />
                    <fieldset>
                        <legend>METADATA</legend>
                        <label>
                            <input type="checkbox" v-model="filters.sketches" />
                            Sketches
                            <Icon icon="sketch" />
                        </label>
                        <label>
                            <input type="checkbox" v-model="filters.gallery" />
                            Gallery
                            <Icon icon="images" />
                        </label>
                        <label>
                            <input type="checkbox" v-model="filters.variants" />
                            Variants
                            <Icon icon="layers" />
                        </label>
                        <div class="tag-filter-input">
                            <div class="tag-search-wrapper">
                                <input
                                    type="text"
                                    v-model="tagInput"
                                    placeholder="Search tags..."
                                    @focus="tagDropdownOpen = true"
                                    @blur="onTagInputBlur"
                                    autocomplete="off" />
                                <Icon icon="tag" style="margin-right: 0.5rem" />
                            </div>
                            <div
                                v-if="filters.tags.length > 0"
                                class="tag-filter-chips">
                                <span
                                    v-for="tag in filters.tags"
                                    :key="tag"
                                    class="tag-chip"
                                    @click="removeTag(tag)"
                                    >{{ tag }} &times;</span
                                >
                            </div>
                        </div>
                    </fieldset>
                </div>
                <div v-if="tagDropdownOpen" class="tag-suggestions-scroll">
                    <ul
                        v-if="tagSuggestions.length > 0"
                        class="tag-suggestions">
                        <li
                            v-for="tag in tagSuggestions"
                            :key="tag"
                            @mousedown.prevent="addTag(tag)">
                            {{ tag }}
                        </li>
                    </ul>
                    <div
                        v-else
                        v-if="tagInput.trim() !== ''"
                        style="color: var(--text-secondary)">
                        No matching tags found.
                    </div>
                </div>
            </div>
        </div>

        <ArtGrid
            :artworks="filteredArtworks"
            show-metadata
            show-character-badge />
        <SplashText />
    </div>
</template>

<script setup lang="ts">
import { getArtworks, getPinnedArtworks } from "#imports";
import Icon from "~/components/common/Icon.vue";
import SketchText from "~/components/common/SketchText.vue";
import SplashText from "~/components/common/SplashText.vue";
import ArtGrid from "~/components/art/ArtGrid.vue";

interface Filters {
    sketches: boolean;
    characterArt: boolean;
    generalArt: boolean;
    gallery: boolean;
    variants: boolean;
    tags: string[];
}

const filters = ref<Filters>({
    sketches: false,
    characterArt: false,
    generalArt: false,
    gallery: false,
    variants: false,
    tags: [] as string[],
});

const tagInput = ref("");
const tagDropdownOpen = ref(false);

const allKnownTags = computed(() => {
    const tagSet = new Set<string>();
    for (const artwork of allArtworks.value || []) {
        for (const tag of artwork.tags || []) {
            tagSet.add(tag);
        }
    }
    return [...tagSet].sort();
});

const tagSuggestions = computed(() => {
    const search = tagInput.value.trim().toLowerCase();
    return allKnownTags.value.filter(
        (tag) =>
            !filters.value.tags.includes(tag) &&
            (search === "" || tag.toLowerCase().includes(search)),
    );
});

function addTag(tag: string) {
    if (!filters.value.tags.includes(tag)) {
        filters.value.tags.push(tag);
    }
    tagInput.value = "";
}

function removeTag(tag: string) {
    filters.value.tags = filters.value.tags.filter((t) => t !== tag);
}

function onTagInputBlur() {
    tagDropdownOpen.value = false;
}

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
    return allRegularArtworks.value.filter((artwork) => {
        if (
            !filters.value.sketches &&
            !filters.value.characterArt &&
            !filters.value.generalArt &&
            !filters.value.gallery &&
            !filters.value.variants &&
            filters.value.tags.length === 0
        ) {
            return true;
        }

        if (filters.value.sketches && artwork.sketch) {
            return true;
        } else if (
            filters.value.characterArt &&
            (artwork.character ||
                (artwork.related_characters &&
                    artwork.related_characters.length > 0))
        ) {
            return true;
        } else if (
            filters.value.generalArt &&
            !artwork.character &&
            !artwork.related_characters?.length
        ) {
            return true;
        } else if (filters.value.gallery && artwork.images.length > 1) {
            return true;
        } else if (
            filters.value.variants &&
            artwork.images.some(
                (img) => img.variants && img.variants.length > 0,
            )
        ) {
            return true;
        } else if (
            filters.value.tags.length > 0 &&
            filters.value.tags.some((tag) => artwork.tags?.includes(tag))
        ) {
            return true;
        }

        return false;
    });
});

useSeoMeta({
    title: "Art Archive",
    description: "Explore all of the art created by echolotl!",
    ogTitle: "echolotl's Art Archive",
    ogDescription: "Explore all of the art created by echolotl!",
});
</script>

<style scoped lang="scss">
@use "~/assets/styles/partials/mixins" as *;
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
    mask-image: url("/images/art/title.webp");
    mask-size: contain;
    mask-repeat: no-repeat;
    mask-position: center;
    width: 100%;
    height: 100px;
    image-rendering: crisp-edges;
    background-color: var(--text);
}

#filter-button {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    background: none;
    border: none;
    border-radius: 4px;
    padding: 0.1rem 0.5rem;
    cursor: pointer;
    font-size: var(--base-text);
    color: var(--text-secondary);
    &:hover {
        background-color: var(--foreground);
    }
}

#filter-popover:popover-open {
    position: absolute;
    display: flex;
    position-area: bottom span-x-start;
    margin: 0.25rem 0;
    border: none;
    padding: 0;
    background: none;
    flex-direction: column;
    gap: 0.25rem;
    > div {
        border: 1px solid var(--distant);
        background: var(--surface);
        padding: 0.5rem;
        width: 200px;
        inset: auto;
        border-radius: 6px;
        box-shadow: 0 4px 4px rgba(0, 0, 0, 0.1);
    }

    fieldset {
        border: none;
        padding: 0;
        margin: 0;
        display: flex;
        flex-direction: column;
        gap: 0.1rem;
        align-items: flex-start;

        legend {
            margin-bottom: 0.25rem;
            font-size: var(--small-text);
            font-weight: bold;
            text-transform: uppercase;
            color: var(--text-secondary);
            text-align: left;
        }
        label {
            display: flex;
            width: calc(100% - 1rem);
            border-radius: 4px;
            padding: 0.25rem 0.5rem;
            align-items: center;
            justify-content: space-between;
            color: var(--text);
            input[type="checkbox"] {
                display: none;
            }

            &:has(input[type="checkbox"]) {
                cursor: pointer;
            }

            &:hover {
                transition: background-color 0s;
                background-color: var(--foreground);
            }

            &:has(input[type="checkbox"]:checked) {
                background-color: var(--primary);
                color: var(--background);
            }
        }

        .tag-filter-input {
            width: 100%;
            display: flex;
            flex-direction: column;
            gap: 0.25rem;
            padding: 0.25rem 0;
        }

        .tag-search-wrapper {
            position: relative;
            width: 100%;
            color: var(--text);
            display: flex;
            flex-direction: row;
            align-items: center;
            gap: 1rem;

            input[type="text"] {
                width: 100%;
                box-sizing: border-box;
                background: var(--background);
                border: 1px solid var(--distant);
                border-radius: 4px;
                padding: 0.25rem 0.5rem;
                font-size: var(--small-text);
                font-family: inherit;
                color: var(--text);
                outline: none;

                &:focus {
                    border-color: var(--primary);
                }

                &::placeholder {
                    color: var(--text-secondary);
                }
            }
        }

        .tag-filter-chips {
            display: flex;
            flex-wrap: wrap;
            gap: 0.25rem;
        }

        .tag-chip {
            display: inline-flex;
            align-items: center;
            gap: 0.2rem;
            background: var(--primary);
            color: var(--background);
            border-radius: 4px;
            padding: 0.1rem 0.4rem;
            font-size: var(--small-text);
            cursor: pointer;

            &:hover {
                opacity: 0.8;
            }
        }
    }
}

.tag-suggestions-scroll {
    max-height: 100px;
    overflow-y: auto;
    scroll-snap-type: y mandatory;
    scroll-padding: 0.3rem;
}

.tag-suggestions {
    margin: 0;
    padding: 0;
    list-style: none;

    li {
        padding: 0.25rem 0.5rem;
        font-size: var(--small-text);
        color: var(--text);
        cursor: pointer;
        text-align: left;
        border-radius: 4px;
        scroll-snap-align: start;
        scroll-snap-stop: always;

        &:hover {
            background: var(--foreground);
        }
    }
}

.loading {
    text-align: center;
    padding: 2rem;
    font-size: var(--base-text);
    color: var(--text-secondary);
}

.end-message {
    text-align: center;
    padding: 2rem;
    font-size: var(--base-text);
    color: var(--text-secondary);
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
    margin: 0.5rem 0;
}

.section-title-group {
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.section-title {
    @include drop-shadow-outline(var(--text), 1px);
    color: var(--background);
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 0.75rem;
}
</style>
