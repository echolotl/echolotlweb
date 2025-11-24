<template>
    <div class="splash-text">
        {{ getSplashText() }}
    </div>
</template>

<style>
.splash-text {
    font-size: 0.8rem;
    color: var(--text-secondary);
    text-align: center;
    padding: 2rem 1rem;
}
</style>

<script setup lang="ts">
import { SPLASH_TEXTS } from "~~/types/constants";

const getSplashText = () => {
    const index = Math.floor(Math.random() * SPLASH_TEXTS.length);
    return SPLASH_TEXTS[index];
};
</script>
