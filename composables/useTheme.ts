import { ref, watch, readonly } from 'vue';

export const useTheme = () => {
  const theme = ref(false); // true = light, false = dark
  const userHasManualOverride = ref(false);
  let mediaQueryCleanup: (() => void) | null = null;

  function toggleTheme() {
    theme.value = !theme.value;
    userHasManualOverride.value = true;
    localStorage.setItem('theme', theme.value ? 'light' : 'dark');
    localStorage.setItem('userHasManualOverride', 'true');
    updateDocumentTheme();
  }

  function updateDocumentTheme() {
    document.documentElement.setAttribute('data-theme', theme.value ? 'light' : 'dark');
    document.documentElement.classList.toggle('light', theme.value);
    updateFavicon();
  }

  function updateFavicon() {
    const favicon = document.querySelector('link[rel="icon"]') as HTMLLinkElement;
    const faviconPath = theme.value ? '/images/favicon-light.ico' : '/images/favicon-dark.ico';
    
    if (favicon) {
      favicon.href = faviconPath;
    } else {
      // Create favicon link if it doesn't exist
      const newFavicon = document.createElement('link');
      newFavicon.rel = 'icon';
      newFavicon.href = faviconPath;
      document.head.appendChild(newFavicon);
    }
  }

  function initializeTheme() {
    // Check if user has manually overridden theme
    const hasManualOverride = localStorage.getItem('userHasManualOverride') === 'true';
    userHasManualOverride.value = hasManualOverride;
    
    // Load theme from localStorage if available
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme && hasManualOverride) {
      theme.value = savedTheme === 'light';
    } else {
      // Check if user prefers dark mode at system level
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      theme.value = !prefersDark; // theme.value true = light, false = dark
      if (!hasManualOverride) {
        localStorage.setItem('theme', theme.value ? 'light' : 'dark');
      }
    }
    updateDocumentTheme();

    // Listen for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleSystemThemeChange = (e: MediaQueryListEvent) => {
      // Only update if user hasn't manually overridden the theme
      if (!userHasManualOverride.value) {
        theme.value = !e.matches; // true = light, false = dark
        localStorage.setItem('theme', theme.value ? 'light' : 'dark');
        updateDocumentTheme();
      }
    };
    
    mediaQuery.addEventListener('change', handleSystemThemeChange);
    
    // Store the cleanup function
    mediaQueryCleanup = () => {
      mediaQuery.removeEventListener('change', handleSystemThemeChange);
    };
  }

  function cleanupTheme() {
    if (mediaQueryCleanup) {
      mediaQueryCleanup();
      mediaQueryCleanup = null;
    }
  }

  // Watch for theme changes to update document
  watch(theme, () => {
    updateDocumentTheme();
  });

  return {
    theme: readonly(theme),
    toggleTheme,
    initializeTheme,
    cleanupTheme
  };
};