<template>
    <div v-if="character" class="character-page">
        <div class="character-banner">
            <div class="character-banner__content">
            <div class="character-banner__texture" :style="{ maskImage: `url(${character.background_texture})` }" />
            <div class="character-banner__underlay" :style="{ '--character-theme-color': character.theme_color }" />
            <div class="character-banner__images">
                <div class="character-banner__image" :style="{ maskImage: `url(${character.banner_image})`}" />
                <div class="character-banner__image left" :style="{ maskImage: `url(${character.banner_image})`}" />
            </div>
        </div>
    </div>
    </div>
</template>

<script setup lang="ts">

const route = useRoute();

const { data: character } = await useAsyncData(() => {
    const slug = route.params.slug;
    return queryCollection("characters").where("slug", "=", slug).first();
});
</script>

<style scoped lang="scss">
@use '~/assets/styles/partials/_mixins' as *;
.character-banner {
    top: 64px;
    height: 600px;
    overflow: hidden;
    z-index: -1;
}

.character-banner__content {
    position: relative;
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: -1;
}

.character-banner__texture {
    display:block;
    position: fixed;
    top: 64px;
    left: 0;
    width: 100%;
    height: 600px;
    background-color: var(--inverted-solid);
    opacity: 0.3;
    background-position: center;
    z-index: -1;
    mask-origin: content-box;
}

.character-banner__image {
    display: block;
    position: absolute;
    top: 0;
    right: 0;
    width: 100%;
    height: 100%;
    background-color: var(--inverted-solid);
    background-position: center;
    z-index: -1;
    mask-origin: content-box;
    mask-repeat: no-repeat;
    mask-position: right;
    &.left {
        left: 0;
        right: auto;
        transform: scaleX(-1);
    }
}
.character-banner__underlay {
    --gradient-end: var(--background);
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: -1;
    background: linear-gradient(in oklab to bottom, var(--character-theme-color), transparent);
    transition: --gradient-end .3s;
}
.character-banner__underlay::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: -1;
    background-color: var(--background);
    mask-image: linear-gradient(to top, black, transparent);
    transition: background-color .3s ease;
}
.character-banner__images {
    mask-image: linear-gradient(to top, transparent, black 70%);
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
}

</style>