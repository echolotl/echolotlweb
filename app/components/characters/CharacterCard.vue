<template>
    <div
        :to="`/characters/${props.character.slug}`"
        class="character-card"
        :style="{ '--filter-url': `url(#${filterId})` }"
    >
        <svg
            xmlns="http://www.w3.org/2000/svg"
            style="position: absolute; width: 0; height: 0; overflow: hidden"
        >
            <defs>
                <filter
                    :id="filterId"
                    color-interpolation-filters="sRGB"
                    x="-50%"
                    y="-50%"
                    width="200%"
                    height="200%"
                >
                    <feTurbulence
                        type="fractalNoise"
                        baseFrequency="0.1"
                        numOctaves="5"
                        result="noise"
                        :seed="seed"
                    />
                    <feGaussianBlur
                        in="SourceAlpha"
                        stdDeviation="3"
                        result="blurred"
                    />
                    <feComponentTransfer in="blurred" result="expanded">
                        <feFuncA type="linear" slope="500" intercept="-5" />
                    </feComponentTransfer>
                    <feFlood
                        flood-color="var(--theme-color, var(--primary))"
                        result="color"
                    />
                    <feComposite
                        in="color"
                        in2="expanded"
                        operator="in"
                        result="border"
                    />
                    <feDisplacementMap
                        in="border"
                        in2="noise"
                        scale="6"
                        xChannelSelector="A"
                        yChannelSelector="A"
                        result="sketchBorder"
                    />
                    <feMerge>
                        <feMergeNode in="sketchBorder" />
                        <feMergeNode in="SourceGraphic" />
                    </feMerge>
                </filter>
            </defs>
        </svg>
        <NuxtLink
            :to="`/characters/${props.character.slug}`"
            class="character-card__image"
        >
            <div class="character-card__image-bg"></div>

            <div
                class="character-card__image-icon"
                :style="{ backgroundImage: characterImage }"
            ></div>
            <div
                class="character-card__image-icon-hover"
                :style="{ backgroundImage: characterHoverImage }"
            ></div>
        </NuxtLink>
        <SketchText class="character-card__name" size="1.5rem">{{
            props.character.name
        }}</SketchText>
    </div>
</template>

<script setup lang="ts">
import type { Character } from "~~/types";
import SketchText from "../common/SketchText.vue";
import { useTheme } from "~~/composables/useTheme";

const filterId = `outline-${Math.random().toString(36).slice(2)}`;
const seed = Math.floor(Math.random() * 20000);

const props = defineProps({
    character: {
        type: Object as () => Character,
        required: true,
    },
});

const { theme } = useTheme();

const characterColor = computed(() => {
    if (!props.character) return "#000000";

    if (theme.value && props.character.theme_color_light) {
        return props.character.theme_color_light;
    }
    return props.character.theme_color || "#000000";
});

const characterImage = `url(/images/characters/${props.character.slug}/icon.webp)`;
const characterHoverImage = `url(/images/characters/${props.character.slug}/hover.webp)`;

// Generate random frame (0-2)
const randomFrameNumber = Math.floor(Math.random() * 3);
const frameImage = `url(/images/characters/frames/${randomFrameNumber}.webp)`;

//-20 to 20 degrees
const randomRotation = `${Math.floor(Math.random() * 41) - 20}deg`;
</script>

<style scoped lang="scss">
@use "~/assets/styles/partials/mixins" as *;

.character-card {
    --theme-color: v-bind(characterColor);
    position: relative;
    max-width: 300px;
    width: fit-content;
    display: flex;
    flex-direction: column;
    align-items: center;
    text-decoration: none;
    transition: transform 0.3s ease;

    &__image {
        position: relative;
        width: 200px;
        height: 200px;
        margin-bottom: 10px;
        &:focus-within {
            outline: none;
        }
    }

    &__image-frame {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: var(--text);
        mask-image: v-bind(frameImage);
        mask-size: contain;
        mask-repeat: no-repeat;
        mask-position: center;
        transition: background-color 0.3s ease;
        z-index: 2;
    }

    &__image-icon {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-size: cover;
        background-position: center;
        background-repeat: no-repeat;
        z-index: 1;
        mask-image: url("/images/art_mask.png");
        mask-size: 160px 160px;
        mask-repeat: no-repeat;
        mask-position: center;
    }

    &__image-bg {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        z-index: 0;
        mask-image: url("/images/art_mask.png");
        mask-size: 160px 160px;
        mask-repeat: no-repeat;
        mask-position: center;
    }

    &__image-icon-hover {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-size: cover;
        background-position: center;
        background-repeat: no-repeat;
        opacity: 0;
        z-index: 3;
    }

    &__name {
        position: absolute;
        color: transparent;
        bottom: -10px;
        opacity: 0;
        transition:
            opacity 0.3s,
            color 0.3s;
        font-weight: bold;
        text-transform: uppercase;
        text-align: center;
        z-index: 4;
    }

    &:hover,
    &:focus-within {
        z-index: 10;
        .character-card__image {
            filter: var(--filter-url);
        }
        .character-card__image-bg {
            background: var(--theme-color);
            transform: rotate(v-bind(randomRotation));
            transition: transform 0.3s;
        }

        .character-card__image-icon-hover {
            opacity: 1;
            animation: bounceScale 0.3s ease;
        }
        .character-card__image-icon {
            opacity: 0;
        }

        .character-card__name {
            @include drop-shadow-outline(var(--background));
            opacity: 1;
            color: var(--theme-color);
        }
        .character-card__image-frame {
            animation: frameShrinkShake 0.3s ease forwards;
        }
    }
    &:not(:hover) {
        .character-card__image-icon {
            animation: bounceScaleMask 0.3s ease forwards;
        }
    }
}

@keyframes bounceScale {
    0%,
    100% {
        transform: none;
    }
    40% {
        transform: translateY(-2px);
    }
}
@keyframes bounceScaleMask {
    0% {
        background-position: center 6px;
    }
    100% {
        background-position: center 0;
    }
}
</style>
