<template>
    <nuxt-link :to="`/characters/${slug}`" class="link" :style="{ color, textShadow: `1px 0 0 ${darkerColor}, -1px 0 0 ${darkerColor}, 0 1px 0 ${darkerColor}, 0 -1px 0 ${darkerColor}` }"><slot /></nuxt-link>
</template>

<script setup lang="ts">
const props = defineProps<{
    slug: string;
}>();

const { data: color } = await useAsyncData(`character-link-${props.slug}`, async () => {
    const character = await queryCollection("characters").where("slug", "=", props.slug).first();
    return character?.theme_color;
});

const darkerColor = computed(() => {
    if (!color.value) return '';
    const [r, g, b] = (color.value?.match(/\w\w/g) || []).map(x => parseInt(x, 16));
    return `rgb(${Math.max(0, r - 100)}, ${Math.max(0, g - 100)}, ${Math.max(0, b - 100)})`;
});


</script>