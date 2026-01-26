<template>
    <div :class="{ 'light-theme': theme }">
        <Navbar
            :light="theme"
            @toggle-theme="toggleTheme"
        />
        <Analytics />
        <SpeedInsights />
        <slot />
        <Footer></Footer>
    </div>
</template>

<script setup lang="ts">
import Navbar from "~/components/common/Navbar.vue";
import Footer from "~/components/common/Footer.vue";
import { useTheme } from "~~/composables/useTheme";
import { Analytics } from "@vercel/analytics/nuxt";
import { SpeedInsights } from "@vercel/speed-insights/nuxt";

const { theme, toggleTheme, initializeTheme, cleanupTheme } = useTheme();

const route = useRoute();


onMounted(() => {
    initializeTheme();
});

onUnmounted(() => {
    cleanupTheme();
});

useSeoMeta({
    ogSiteName: "echolotl.lol",
    description:
        "echolotl's personal website, containing their art, characters, and more.",
    ogType: "website",
    ogLocale: "en_US",
    ogTitle: "echolotl",
    themeColor: "#DA39A4",
    ogUrl: "https://www.echolotl.lol" + route.fullPath,
});
</script>
