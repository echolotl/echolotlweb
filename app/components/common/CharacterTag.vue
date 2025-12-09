<template>
    <CharacterLink :slug="slug" class="character-tag">
        <Tag
            variant="character"
            :clickable="true"
            :custom-color="character?.theme_color"
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

const darkerColor = computed(() => {
    if (!character.value?.theme_color) return "";
    return `color-mix(in oklab, ${character.value.theme_color} 50%, black 50%)`;
});
const textStroke = computed(() => {
    return `drop-shadow(1px 0 0 ${darkerColor.value}) drop-shadow(-1px 0 0 ${darkerColor.value}) drop-shadow(0 1px 0 ${darkerColor.value}) drop-shadow(0 -1px 0 ${darkerColor.value})`;
});
</script>

<style scoped lang="scss">
.character-tag {
    text-decoration: none;

    :deep(.tag--character) {
        transition: transform 0.2s ease;

        &:hover {
            transform: translateY(-1px);
        }
        &:active {
            transform: translateY(-1px);
        }
    }
}
.sketch-text-stroke {
    filter: v-bind(textStroke);
}
</style>
