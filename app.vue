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
import { ref, watch, onMounted } from 'vue';

const theme = ref(false);
const navIcons = ref([
  {
    icon: 'art_brush',
    alt: 'Art',
    to: '/art'
  },
  {
    icon: 'characters-icon',
    alt: 'Characters',
    to: '/characters'
  }
]);

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
@use "~/assets/styles/partials/_variables.scss" as vars;
@use "~/assets/styles/main.scss" as *;

:root {
  --foreground: #{vars.$foreground};
  --text: #{vars.$foreground-light};
  --background: #{vars.$background};
  --distant: #{vars.$distant};
  --primary: #{vars.$primary};

  --surface: #{vars.$surface};
  
  background-color: var(--background);
  color: var(--text);
}

:root[data-theme="light"] {
  --foreground: #{vars.$foreground-light};
  --text: #{vars.$foreground};
  --background: #{vars.$background-light};
  --distant: #{vars.$distant-light};
  --primary: #{vars.$primary-light};
  --surface: #{vars.$surface-light};
  
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
