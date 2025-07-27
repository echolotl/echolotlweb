<template>
  <div :class="{ 'light-theme': theme }">
    <Navbar
      :nav-icons="navIcons"
      :light="theme"
      @toggle-theme="toggleTheme"
    />
    <NuxtRouteAnnouncer />
    <NuxtPage/>
  </div>
</template>

<script setup lang="ts">
import Navbar from '~/components/common/Navbar.vue';
import { computed, ref, onMounted, onUnmounted } from 'vue';
import { useTheme } from '../composables/useTheme';

const route = useRoute();
const { theme, toggleTheme, initializeTheme, cleanupTheme } = useTheme();

// Define all possible navigation icons
const allNavIcons = {
  art: { icon: 'art_brush', alt: 'Art', to: '/art' },
  characters: { icon: 'characters-icon', alt: 'Characters', to: '/characters' },
  blog: { icon: 'blog', alt: 'Blog', to: '/blog' },
  home: { icon: 'house-icon', alt: 'Home', to: '/' },
};

// Compute nav icons based on current route
const navIcons = computed(() => {
  const currentPath = route.path;
  const icons = [];
  
  if (currentPath !== '/') {
    icons.push(allNavIcons.home);
  }
  
  if (currentPath !== '/art') {
    icons.push(allNavIcons.art);
  }
  
  if (currentPath !== '/characters') {
    icons.push(allNavIcons.characters);
  }

  if (currentPath !== '/blog') {
    icons.push(allNavIcons.blog);
  }
  
  return icons;
});

onMounted(() => {
  initializeTheme();
  
  // Set up SEO meta with client-side theme color
  const primaryColor = getComputedStyle(document.documentElement).getPropertyValue('--primary').trim();
  if (primaryColor) {
    themeColor.value = primaryColor;
  }
});

onUnmounted(() => {
  cleanupTheme();
});

// Set up SEO meta with client-side theme color
const themeColor = ref('#000000'); // Default fallback color

useSeoMeta({
  ogSiteName: 'echolotl.lol',
  ogType: 'website',
  ogLocale: 'en_US',
  ogTitle: 'echolotl',
  themeColor: themeColor,
})
</script>

<style lang="scss">
@use "sass:color";
@use "~/assets/styles/partials/_variables.scss" as *;
@use "~/assets/styles/partials/_reusables.scss" as *;
@use "~/assets/styles/partials/_mixins.scss" as *;
@use "~/assets/styles/main.scss" as *;

:root {
  --foreground: #{$foreground};
  --text: #{$foreground-light};
  --text-secondary: #{color.scale($foreground-light, $alpha: -60%)};
  --background: #{$background};
  --distant: #{$distant};
  --primary: #{$primary};
  --solid: #{$solid};
  --inverted-solid: #{$solid-light};
  --filter-invert: 0;

  --red: #{$red};
  --green: #{$green};
  --blue: #{$blue};
  --yellow: #{$yellow};
  --purple: #{$purple};
  --orange: #{$orange};

  --surface: #{$surface};

  background-color: var(--background);
  color: var(--text);
}

:root[data-theme="light"] {
  --foreground: #{$foreground-light};
  --text: #{$foreground};
  --text-secondary: #{color.scale($foreground, $alpha: -25%)};
  --background: #{$background-light};
  --distant: #{$distant-light};
  --primary: #{$primary-light};
  --surface: #{$surface-light};
  --solid: #{$solid-light};
  --inverted-solid: #{$solid};
  --filter-invert: 1;

  --red: #{$red-light};
  --green: #{$green-light};
  --blue: #{$blue-light};
  --yellow: #{$yellow-light};
  --purple: #{$purple-light};
  --orange: #{$orange-light};
  
  color: var(--text);
}

.link {
  color: var(--primary);
  text-decoration: none;
  transition: color 0.2s ease-in-out;

  &:hover {
    color: color-mix(in srgb, var(--primary), blue 20%);
    text-decoration: underline;
  }
}

.page-enter-active,
.page-leave-active {
  transition: all 0.4s;
}

.page-enter-from{
  opacity: 0;

  transform: translateY(-1rem);
}
.page-leave-to {
  opacity: 0;
  transform: translateY(1rem);
}
</style>
