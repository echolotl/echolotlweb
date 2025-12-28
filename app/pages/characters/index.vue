<template>
    <div class="characters-page">
        <h1 class="large-title">
            <SketchText size="4rem">Characters</SketchText>
        </h1>
        <p class="subtitle">
            Want to know more about my characters? Click on any of their cards
            to go to their page!
        </p>
        <div class="characters-list">
            <CharacterCard
                v-for="(character, index) in sortedCharacters"
                :key="index"
                :character="character"
            />
        </div>
    </div>
</template>

<script setup lang="ts">
import { useAsyncData } from "nuxt/app";
import CharacterCard from "~/components/characters/CharacterCard.vue";
import SketchText from "~/components/common/SketchText.vue";

const { data: characters } = await useAsyncData(() => {
    return queryCollection("characters").all();
});


function hexToHsl(hex: string): { h: number; s: number; l: number } {
    hex = hex.replace(/^#/, "");

    const r = parseInt(hex.slice(0, 2), 16) / 255;
    const g = parseInt(hex.slice(2, 4), 16) / 255;
    const b = parseInt(hex.slice(4, 6), 16) / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0;
    let s = 0;
    const l = (max + min) / 2;

    if (max !== min) {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

        switch (max) {
            case r:
                h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
                break;
            case g:
                h = ((b - r) / d + 2) / 6;
                break;
            case b:
                h = ((r - g) / d + 4) / 6;
                break;
        }
    }

    return { h: h * 360, s, l };
}

const sortedCharacters = computed(() => {
    if (!characters.value) return [];

    return [...characters.value].sort((a, b) => {
        const colorA = a.theme_color || "#000000";
        const colorB = b.theme_color || "#000000";

        const hslA = hexToHsl(colorA);
        const hslB = hexToHsl(colorB);

        return hslA.h - hslB.h;
    });
});

useSeoMeta({
    title: "Characters",
    description: "Check out all of echolotl's characters!",
    ogTitle: "echolotl's Characters",
    ogDescription: "Check out all of echolotl's characters!",
});
</script>

<style scoped lang="scss">
.characters-page {
    margin: 0 auto;
    padding: 2rem;
    max-width: 1600px;
    min-height: 80vh;
    h1 {
        text-align: center;
    }
}

.characters-list {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    flex-direction: row;
    margin-top: 2rem;
}

.subtitle {
    text-align: center;
}
</style>
