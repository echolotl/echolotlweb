<template>
    <nuxt-link :to="`/characters/${slug}`" class="link" :style="linkStyle">
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
import SketchText from './SketchText.vue';
const props = defineProps<{
    slug: string;
    sketchText?: boolean;
}>();

const { data: character } = await useAsyncData(`character-link-${props.slug}`, async () => {
    const character = await queryCollection("characters").where("slug", "=", props.slug).first();
    return character;
});

const darkerColor = computed(() => {
    if (!character.value?.theme_color) return '';
    return `color-mix(in oklab, ${character.value.theme_color} 50%, black 50%)`;
});

const linkStyle = computed(() => {
    if (!character.value?.theme_color) return {};
    
    if (props.sketchText) {
        return {
            color: character.value.theme_color,
            filter: `drop-shadow(1px 0 0 ${darkerColor.value}) drop-shadow(-1px 0 0 ${darkerColor.value}) drop-shadow(0 1px 0 ${darkerColor.value}) drop-shadow(0 -1px 0 ${darkerColor.value})`
        };
    } else {
        return {
            color: character.value.theme_color,
            textShadow: `1px 0 0 ${darkerColor.value}, -1px 0 0 ${darkerColor.value}, 0 1px 0 ${darkerColor.value}, 0 -1px 0 ${darkerColor.value}, 1px 1px 0 ${darkerColor.value}, -1px -1px 0 ${darkerColor.value}, -1px 1px 0 ${darkerColor.value}, 1px -1px 0 ${darkerColor.value}`
        };
    }
});


</script>