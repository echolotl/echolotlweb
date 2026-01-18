<template>
    <div :class="{ 'light-theme': theme }">
        <Navbar
            :nav-icons="navIcons"
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

const allNavIcons = {
    art: { icon: "art_brush", alt: "Art", to: "/art" },
    characters: {
        icon: "character",
        alt: "Characters",
        to: "/characters",
    },
    home: { icon: "house-icon", alt: "Home", to: "/" },
};
const route = useRoute();
// Compute nav icons based on current route
const navIcons = computed(() => {
    const currentPath = route.path;
    const icons = [];

    if (currentPath !== "/") {
        icons.push(allNavIcons.home);
    }

    if (currentPath !== "/art") {
        icons.push(allNavIcons.art);
    }

    if (currentPath !== "/characters") {
        icons.push(allNavIcons.characters);
    }

    return icons;
});

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
