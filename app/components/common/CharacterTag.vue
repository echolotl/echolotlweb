<template>
    <CharacterLink :slug="slug" class="character-tag">
        <Tag
            variant="character"
            :clickable="true"
            :custom-color="themeColor"
        >
            <SketchText
                v-if="sketchText && character?.name"
                :text="character.name"
                class="sketch-text-stroke"
            />
            <span v-else-if="character?.name">{{ character.name }}</span>
            <slot v-else></slot>
        </Tag>
    </CharacterLink>
</template>

<script setup lang="ts">
import Tag from "./Tag.vue";
import CharacterLink from "./CharacterLink.vue";
import SketchText from "./SketchText.vue";
import { useTheme } from "~~/composables/useTheme";

interface Props {
    slug: string;
    sketchText?: boolean;
}

const props = defineProps<Props>();

const { data: character } = await useAsyncData(
    `character-tag-${props.slug}`,
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
    
    if (theme.value && character.value.theme_color_light) {
        return character.value.theme_color_light;
    }
    return character.value.theme_color || "";
});
</script>

<style scoped lang="scss">
@use "~/assets/styles/partials/_mixins" as *;

.character-tag {
    text-decoration: none;
}
</style>
