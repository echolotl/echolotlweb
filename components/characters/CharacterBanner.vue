<template>
            <div class="character-banner">
            <div class="character-banner__content">
            <div class="character-banner__texture" :style="{ maskImage: `url(${character.background_texture || '/images/no_image.png'})` }" />
            <div class="character-banner__underlay" :style="{ '--character-theme-color': character.theme_color }" />
            <div class="character-banner__images">
                <div class="character-banner__image" :style="{ maskImage: `url(${character.banner_image || '/images/no_image.png'})`}" />
                <div class="character-banner__image left" :style="{ maskImage: `url(${character.banner_image || '/images/no_image.png'})`}" />
            </div>
            <div class="character-banner__title">
                <nuxt-img
                    :src="character.title_image || '/images/no_image.png'"
                    :alt="character.name"
                />
            </div>
        </div>
        </div>
</template>

<script setup lang="ts">
import type { CharactersCollectionItem } from '@nuxt/content';

defineProps<{
    character: CharactersCollectionItem;
}>();
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
    @media (max-width: 768px) {
        justify-content: flex-start;
    }
}

.character-banner__texture {
    display: block;
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: var(--inverted-solid);
    background-attachment: fixed;
    background-position: center;
    opacity: 0.3;
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
     @media (max-width: 768px) {
        display: none;
    }
    }
}
.character-banner__underlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: -1;
    background: linear-gradient(to bottom, var(--character-theme-color), transparent);
    @include theme-transition;
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
    @include theme-transition;
}
.character-banner__images {
    mask-image: linear-gradient(to top, transparent, black 70%);
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    backdrop-filter: drop-shadow(0 0 2px rgba(0, 0, 0, 0.5));
}
.character-banner__title {
    filter: drop-shadow(0 0 2px rgba(0, 0, 0, 0.5)) invert(var(--filter-invert));
    @include smooth-transition(filter, 0.2s);
        @media (max-width: 768px) {
        min-width: 50%;
        img {
            width: 100%;
            height: auto;
        }
    }
}
</style>