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
import { ref, watch, onMounted, computed } from 'vue';

const route = useRoute();
const theme = ref(false);

// Define all possible navigation icons
const allNavIcons = {
  home: { icon: 'house-icon', alt: 'Home', to: '/' },
  art: { icon: 'art_brush', alt: 'Art', to: '/art' },
  characters: { icon: 'characters-icon', alt: 'Characters', to: '/characters' }
};

// Compute nav icons based on current route
const navIcons = computed(() => {
  const currentPath = route.path;
  
  // Always show home if not on home page
  const icons = [];
  
  if (currentPath !== '/') {
    icons.push(allNavIcons.home);
  }
  
  // Show other pages that aren't the current page
  if (currentPath !== '/art') {
    icons.push(allNavIcons.art);
  }
  
  if (currentPath !== '/characters') {
    icons.push(allNavIcons.characters);
  }
  
  return icons;
});

function toggleTheme() {
  theme.value = !theme.value;
  localStorage.setItem('theme', theme.value ? 'light' : 'dark');
  updateDocumentTheme();
}

function updateDocumentTheme() {
  document.documentElement.setAttribute('data-theme', theme.value ? 'light' : 'dark');
}

onMounted(() => {
  // Load theme from localStorage if available
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme) {
    theme.value = savedTheme === 'light';
  } else {
    // Check if user prefers dark mode at system level
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    theme.value = prefersDark;
    localStorage.setItem('theme', theme.value ? 'light' : 'dark');
  }
  updateDocumentTheme();
});

// Watch for system theme preference changes
watch(theme, () => {
  updateDocumentTheme();
});
</script>

<style lang="scss">
@use "~/assets/styles/partials/_reusables.scss" as *;
@use "~/assets/styles/partials/_mixins.scss" as *;
@use "~/assets/styles/main.scss" as *;

:root {
  --foreground: #{$foreground};
  --text: #{$foreground-light};
  --text-secondary: #{transparentize($foreground-light, 0.6)};
  --background: #{$background};
  --distant: #{$distant};
  --primary: #{$primary};
  --solid: #{$solid};
  --inverted-solid: #{$solid-light};

  --surface: #{$surface};

  background-color: var(--background);
  color: var(--text);
}

:root[data-theme="light"] {
  --foreground: #{$foreground-light};
  --text: #{$foreground};
  --text-secondary: #{transparentize($foreground, 0.25)};
  --background: #{$background-light};
  --distant: #{$distant-light};
  --primary: #{$primary-light};
  --surface: #{$surface-light};
  --solid: #{$solid-light};
  --inverted-solid: #{$solid};
  
  color: var(--text);
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
