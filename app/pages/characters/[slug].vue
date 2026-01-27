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
                                <img
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
                        <div
                            v-if="character.color_palette"
                            class="character-color-palette-container"
                        >
                            <Icon
                                :icon="paletteIcon"
                                width="24px"
                                height="24px"
                                @mouseenter="isPaletteIconHovered = true"
                                @mouseleave="isPaletteIconHovered = false"
                                @click="openPaletteImage"
                                style="cursor: pointer"
                            />
                            <div class="character-color-palette">
                                <div
                                    v-for="color in character.color_palette"
                                    :key="color"
                                    class="swatch"
                                    :style="{
                                        backgroundColor: color,
                                        '--swatch-border-color':
                                            getContrastColor(color),
                                    }"
                                    @click="copyColorToClipboard(color)"
                                    @mouseenter="hoveredColor = color"
                                    @mouseleave="hoveredColor = null"
                                ></div>
                            </div>
                        </div>
                        <table class="character-infobox__table">
                            <tbody>
                                <tr>
                                    <td class="character-infobox__item-label">
                                        <span>Age</span>
                                    </td>
                                    <td>{{ character.age || "Unknown" }}</td>
                                </tr>
                                <tr>
                                    <td class="character-infobox__item-label">
                                        <span>Pronouns</span>
                                    </td>
                                    <td>
                                        {{ character.pronouns || "Unknown" }}
                                    </td>
                                </tr>
                                <tr>
                                    <td class="character-infobox__item-label">
                                        <span>Species</span>
                                    </td>
                                    <td>
                                        {{ character.species || "Unknown" }}
                                    </td>
                                </tr>
                                <tr>
                                    <td class="character-infobox__item-label">
                                        <span>Creation Date</span>
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
                                        <span>Height</span>
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
                                        <span>Friends</span>
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
                                        <span>Enemies</span>
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
                                        <span> Type </span>
                                    </td>
                                    <td>
                                        {{ character.clan || "Unknown" }}
                                        <Icon
                                            :icon="character.clan.toLowerCase()"
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
import CharacterLink from "~/components/common/CharacterLink.vue";
import SketchText from "~/components/common/SketchText.vue";
import ArtGrid from "~/components/art/ArtGrid.vue";

import Icon from "~/components/common/Icon.vue";
import { getArtworksByCharacter } from "~/utils/art";

import utils from "~/utils";
import SplashText from "~/components/common/SplashText.vue";

// Helper function to calculate relative luminance
function getLuminance(color: string): number {
    const hex = color.replace("#", "");
    const r = parseInt(hex.substring(0, 2), 16) / 255;
    const g = parseInt(hex.substring(2, 4), 16) / 255;
    const b = parseInt(hex.substring(4, 6), 16) / 255;

    // Apply gamma correction
    const sr = r <= 0.03928 ? r / 12.92 : Math.pow((r + 0.055) / 1.055, 2.4);
    const sg = g <= 0.03928 ? g / 12.92 : Math.pow((g + 0.055) / 1.055, 2.4);
    const sb = b <= 0.03928 ? b / 12.92 : Math.pow((b + 0.055) / 1.055, 2.4);

    return 0.2126 * sr + 0.7152 * sg + 0.0722 * sb;
}

// Helper function to calculate contrast ratio
function getContrastRatio(color1: string, color2: string): number {
    const lum1 = getLuminance(color1);
    const lum2 = getLuminance(color2);
    const lighter = Math.max(lum1, lum2);
    const darker = Math.min(lum1, lum2);
    return (lighter + 0.05) / (darker + 0.05);
}

// Helper function to get contrasting color based on WCAG threshold
function getContrastColor(baseColor: string, threshold: number = 4.5): string {
    const whiteRatio = getContrastRatio(baseColor, "#ffffff");
    return whiteRatio >= threshold ? "#ffffff" : "#000000";
}

const hoveredColor = ref<string | null>(null);
const copiedColor = ref<string | null>(null);
const isPaletteIconHovered = ref(false);

const paletteIcon = computed(() => {
    if (copiedColor.value) {
        return "check";
    }
    if (isPaletteIconHovered.value) {
        return "open-in-new";
    }
    if (hoveredColor.value) {
        return "copy";
    }
    return "palette";
});

function openPaletteImage(): void {
    if (character.value?.slug) {
        window.open(`/images/palettes/${character.value.slug}.png`, "_blank");
    }
}

function copyColorToClipboard(color: string): void {
    navigator.clipboard.writeText(color);
    copiedColor.value = color;
    setTimeout(() => {
        copiedColor.value = null;
    }, 2000);
}

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

// Set scrollbar color to character theme
onMounted(() => {
    document.documentElement.style.setProperty(
        "--scrollbar-bar",
        character.value?.theme_color || "#000000",
    );
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
    themeColor: character.value.theme_color || "#000000",
});
</script>

<style lang="scss" scoped>
@use "~/assets/styles/partials/mixins" as *;
.character-page {
    position: relative;
    --theme-color: v-bind(character.theme_color);
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
    font-size: var(--base-text);
    margin-bottom: 5px;
    text-transform: uppercase;
    width: 100%;
    display: inline-block;
    text-align: right;
}
.character-infobox__item-label {
    font-weight: bold;
    font-size: var(--small-text);
    box-sizing: border-box;
    text-transform: uppercase;
    span {
        background: var(--theme-color);
        padding: 2px 4px;
        border-radius: 4px;
        color: var(--background);
        corner-shape: superellipse(1.3);
    }
}
.character-infobox__details {
    padding: 10px;
    font-size: var(--small-text);
    line-height: 1.5;
    color: var(--text);
    border: 1px solid var(--distant);
    background-color: rgb(
        from var(--background) calc(r * 0.9) calc(g * 0.9) calc(b * 0.9)
    );
    box-shadow: 0 -10px 8px -8px rgb(from var(--theme-color) r g b / 0.75);
}
.character-infobox__title {
    font-size: var(--large-text);
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
.character-color-palette-container {
    width: 100%;
    height: 24px;
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 4px;
    margin: 0.25rem;
}
.character-color-palette {
    width: 100%;
    height: 1rem;
    display: flex;
    flex-direction: row;
    justify-content: space-evenly;
    border: 2px solid var(--distant);
    .swatch {
        position: relative;
        flex: 1;
        height: 100%;
        &:hover {
            &::after {
                content: "";
                position: absolute;
                top: 0;
                left: 0;
                width: calc(100% - 2px);
                height: calc(100% - 2px);
                border: 1px solid var(--swatch-border-color);
                pointer-events: none;
            }
        }
    }
}
.character-infobox__table {
    width: 100%;
    border-collapse: collapse;
    margin-top: 10px;

    tr {
        &:nth-child(even) {
            background-color: color-mix(
                in srgb,
                var(--theme-color) 5%,
                transparent
            );
        }
        td {
            padding: 6px 4px;
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
