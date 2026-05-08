<template>
    <nuxt-link
        :to="`/characters/${slug}`"
        class="link character-link"
        :class="{ 'character-link--sketch': sketchText }"
    >
        <template v-if="sketchText">
            <SketchText v-if="$slots.default">
                <slot></slot>
            </SketchText>
            <SketchText v-else :text="character?.name || ''" />
        </template>
        <template v-else>
            <slot v-if="$slots.default"></slot>
            <span v-else>{{ character?.name }}</span>
        </template>
    </nuxt-link>
</template>

<script setup lang="ts">
import SketchText from "./SketchText.vue";
import { useTheme } from "~~/composables/useTheme";

const props = defineProps<{
    slug: string;
    sketchText?: boolean;
}>();

const { data: character } = await useAsyncData(
    `character-link-${props.slug}`,
    async () => {
        const character = await queryCollection("characters")
            .where("slug", "=", props.slug)
            .first();
        return character;
    },
);

const { theme } = useTheme();

const themeColor = computed(() => {
    if (!character.value) return "";

    // If theme is light (true), use light color if available
    if (theme.value && character.value.theme_color_light) {
        return character.value.theme_color_light;
    }
    // Otherwise use the default theme color
    return character.value.theme_color || "";
});

const darkerColor = computed(() => {
    if (!themeColor.value) return "";
    return `color-mix(in oklab, ${themeColor.value} 50%, black 50%)`;
});
</script>

<style scoped lang="scss">
@use "~/assets/styles/partials/_mixins" as *;

.character-link {
    color: v-bind(themeColor);

    &:not(.character-link--sketch) {
        @include text-stroke(v-bind(darkerColor));
    }

    &--sketch {
        @include drop-shadow-simple(v-bind(darkerColor));
    }
}
</style>
