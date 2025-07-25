<template>
    <nuxt-link :to="`/characters/${slug}`" class="link" :style="{ color: character?.theme_color, textShadow: `1px 0 0 ${darkerColor}, -1px 0 0 ${darkerColor}, 0 1px 0 ${darkerColor}, 0 -1px 0 ${darkerColor}, 1px 1px 0 ${darkerColor}, -1px -1px 0 ${darkerColor}, -1px 1px 0 ${darkerColor}, 1px -1px 0 ${darkerColor}` }">
        <slot v-if="$slots.default"></slot>
        <span v-else>{{ character?.name }}</span>
    </nuxt-link>
</template>

<script setup lang="ts">
const props = defineProps<{
    slug: string;
}>();

const { data: character } = await useAsyncData(`character-link-${props.slug}`, async () => {
    const character = await queryCollection("characters").where("slug", "=", props.slug).first();
    return character;
});

const darkerColor = computed(() => {
    if (!character.value?.theme_color) return '';
    return `color-mix(in srgb, ${character.value.theme_color} 50%, var(--solid) 50%)`;
});


</script>