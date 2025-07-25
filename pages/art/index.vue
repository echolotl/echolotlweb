<template>
  <div class="art-page">
    <h1 class="large-title">Art Archive</h1>
    <p class="subtitle">This contains all of the art that I've made!</p>
    
        <div v-if="filteredPinnedArtworks.length > 0" class="section-header" >
      <Icon icon="pin" />
      <h2 class="section-title">Pinned</h2>
      </div>
      <hr v-if="filteredPinnedArtworks.length > 0">
    <div class="art-grid">
      <ArtItem
        v-for="artwork in filteredPinnedArtworks"
        :key="artwork.slug"
        :artwork="artwork"
      />
      </div>
    <div class="section-header section-header-with-filter">
      <div class="section-title-group">
        <Icon icon="art" />
        <h2 class="section-title">All Art</h2>
      </div>
      
      <!-- Filter Dropdown -->
      <div class="filter-container">
        <button 
          class="filter-button body-font" 
          :class="{ 'active': isDropdownOpen || hasActiveFilters }"
          @click="toggleDropdown"
        >
          <Icon icon="filter" />
          <span style="font-family: 'IBM Plex Sans', sans-serif;">Filters</span>
          <span v-if="activeFilterCount > 0" class="filter-count">{{ activeFilterCount }}</span>
          <Icon 
            icon="dropdown" 
            :style="{ transform: isDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)' }"
          />
        </button>
        
        <div v-if="isDropdownOpen" class="filter-dropdown">
          <div class="filter-option" @click="toggleFilter('sketches')">
            <Icon 
              :icon="filters.sketches ? 'checkbox' : 'checkbox-empty'" 
              color="var(--text)"
            />
            <Icon icon="sketch" />
            <span>Sketches</span>
          </div>
          
          <div class="filter-option" @click="toggleFilter('characterArt')">
            <Icon 
              :icon="filters.characterArt ? 'checkbox' : 'checkbox-empty'" 
              color="var(--text)"
            />
            <Icon icon="character" />
            <span>Character Art</span>
          </div>
          
          <div class="filter-option" @click="toggleFilter('generalArt')">
            <Icon 
              :icon="filters.generalArt ? 'checkbox' : 'checkbox-empty'" 
              color="var(--text)"
            />
            <Icon icon="art" />
            <span>General Art</span>
          </div>
        </div>
      </div>
    </div>
            <hr>
    <div class="art-grid">
      <ArtItem v-for="artwork in filteredArtworks" :key="artwork.slug" :artwork="artwork" />
    </div>
    <div v-if="loading" class="loading">
      <Icon icon="loading" />
      Loading more artwork...
    </div>
    <div v-if="hasReachedEnd" class="end-message">
      {{ SPLASH_TEXTS[Math.floor(Math.random() * SPLASH_TEXTS.length)] }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { getArtworks } from '#imports';
import Icon from '~/components/common/Icon.vue';

const ITEMS_PER_PAGE = 20;

const SPLASH_TEXTS = [
  "What? You want me to draw more?",
  "There might be more art, but I'm not loading it for you.",
  "I forgot how to load more art.",
  "You've reached the end of the archive!",
  "I don't know what an art is.",
  "Can't load any more, ate it all.",
  "what"
]

const page = ref(1);
const loading = ref(false);
const hasReachedEnd = ref(false);

// Filter state
const isDropdownOpen = ref(false);
const filters = ref({
  sketches: false,
  characterArt: false,
  generalArt: false
});

const { data: artworks } = await useAsyncData('art', () => getArtworks(ITEMS_PER_PAGE, 1));

// Computed filtered artworks - exclude pinned items to prevent showing them twice
const filteredArtworks = computed(() => {
  if (!artworks.value) return [];
  
  // First exclude pinned artworks to prevent duplicates
  const nonPinnedArtworks = artworks.value.filter(artwork => !artwork.pinned);
  
  return nonPinnedArtworks.filter(artwork => {
    // If no filters are active, show all non-pinned
    if (!filters.value.sketches && !filters.value.characterArt && !filters.value.generalArt) {
      return true;
    }
    
    let showArtwork = false;
    
    // Check sketch filter
    if (filters.value.sketches && artwork.sketch) {
      showArtwork = true;
    }
    
    // Check character art filter
    if (filters.value.characterArt && (artwork.character || (artwork.related_characters && artwork.related_characters.length > 0))) {
      showArtwork = true;
    }
    
    // Check general art filter (art without characters)
    if (filters.value.generalArt && !artwork.character && (!artwork.related_characters || artwork.related_characters.length === 0)) {
      showArtwork = true;
    }
    
    return showArtwork;
  });
});

// Computed filtered pinned artworks - prevent duplicates by using a Set to track seen slugs
const filteredPinnedArtworks = computed(() => {
  if (!artworks.value) return [];
  
  // Use a Set to track seen slugs and prevent duplicates
  const seenSlugs = new Set();
  return artworks.value.filter(a => {
    if (a.pinned && !seenSlugs.has(a.slug)) {
      seenSlugs.add(a.slug);
      return true;
    }
    return false;
  });
});

// Computed filter helpers
const hasActiveFilters = computed(() => {
  return filters.value.sketches || filters.value.characterArt || filters.value.generalArt;
});

const activeFilterCount = computed(() => {
  let count = 0;
  if (filters.value.sketches) count++;
  if (filters.value.characterArt) count++;
  if (filters.value.generalArt) count++;
  return count;
});

// Filter methods
const toggleDropdown = () => {
  isDropdownOpen.value = !isDropdownOpen.value;
};

const toggleFilter = (filterName: 'sketches' | 'characterArt' | 'generalArt') => {
  filters.value[filterName] = !filters.value[filterName];
};

const loadMore = async () => {
  if (loading.value || hasReachedEnd.value) return;
  
  loading.value = true;
  page.value++;
  
  try {
    const newArtworks = await getArtworks(ITEMS_PER_PAGE, page.value);

    console.log('Loaded artworks for page', page.value, ':', newArtworks.length, 'items');
    
    if (newArtworks.length === 0) {
      hasReachedEnd.value = true;
    } else if (artworks.value) {
      // Check for duplicates before adding new artworks
      const existingSlugs = new Set(artworks.value.map(artwork => artwork.slug));
      const uniqueNewArtworks = newArtworks.filter(artwork => !existingSlugs.has(artwork.slug));
      
      console.log('Unique new artworks:', uniqueNewArtworks.length, 'out of', newArtworks.length);
      
      if (uniqueNewArtworks.length > 0) {
        artworks.value.push(...uniqueNewArtworks);
      }
      
      // If we got less than expected or all were duplicates, we might have reached the end
      if (newArtworks.length < ITEMS_PER_PAGE) {
        hasReachedEnd.value = true;
      }
    }
  } catch (error) {
    console.error('Error loading more artworks:', error);
    // Revert page increment on error
    page.value--;
  } finally {
    loading.value = false;
  }
};

const checkScrollPosition = () => {
  const scrollPosition = window.innerHeight + window.scrollY;
  const threshold = document.body.offsetHeight - 1000; // Load when 1000px from bottom
  
  if (scrollPosition >= threshold) {
    loadMore();
  }
};

// Throttle scroll events for better performance
let scrollTimeout: NodeJS.Timeout | null = null;
const throttledScrollCheck = () => {
  if (scrollTimeout) return;
  
  scrollTimeout = setTimeout(() => {
    checkScrollPosition();
    scrollTimeout = null;
  }, 100);
};

// Set up infinite scrolling and click outside handler
onMounted(() => {
  window.addEventListener('scroll', throttledScrollCheck);
  document.addEventListener('click', handleClickOutside);
});

onUnmounted(() => {
  window.removeEventListener('scroll', throttledScrollCheck);
  document.removeEventListener('click', handleClickOutside);
  if (scrollTimeout) {
    clearTimeout(scrollTimeout);
  }
});

// Handle click outside to close dropdown
const handleClickOutside = (event: Event) => {
  const target = event.target as HTMLElement;
  const filterContainer = document.querySelector('.filter-container');
  
  if (filterContainer && !filterContainer.contains(target)) {
    isDropdownOpen.value = false;
  }
};

// Meta data for the page
useSeoMeta({
  title: 'Art Archive',
  description: 'Explore all of the art created by echolotl!',
  ogTitle: 'echolotl\'s Art Archive',
  ogDescription: 'Explore all of the art created by echolotl!',
});
</script>

<style scoped lang="scss">
.art-page {
  margin: 0 auto;
  padding: 2rem;
  max-width: 1200px;
  text-align: center;
}

.filter-container {
  position: relative;
}

.filter-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: transparent;
  border: none;
  color: var(--text);
  cursor: pointer;
  font-size: 1rem;
  
  
  &.active {
    color: var(--primary);
  }
  
  .filter-count {
    background: var(--distant);
    border-radius: 50%;
    min-width: 1.2rem;
    height: 1.2rem;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.75rem;
    font-weight: bold;
    margin: 0 0.25rem;
  }
}

.filter-dropdown {
  position: absolute;
  top: 100%;
  right: 0;
  background: var(--background);
  border: 1px solid var(--distant);
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  z-index: 100;
  min-width: 200px;
  margin-top: 0.5rem;
  overflow: hidden;
  
  @media (max-width: 600px) {
    right: 0;
    min-width: auto;
    margin: 0.5rem 0 0;
  }
}

.filter-option {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  cursor: pointer;
  transition: background-color 0.2s ease;
  border-bottom: 1px solid var(--border-color);
  
  &:last-child {
    border-bottom: none;
  }
  
  &:hover {
    background: var(--bg-tertiary);
  }
  
  span {
    flex: 1;
    text-align: left;
    font-size: 0.95rem;
  }
}


.art-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 1rem;
  
  @media (max-width: 600px) {
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  }
}

.loading {
  text-align: center;
  padding: 2rem;
  font-size: 1.1rem;
  color: var(--text-secondary);
}

.end-message {
  text-align: center;
  padding: 2rem;
  font-size: 1.1rem;
  color: var(--text-secondaty);
  font-style: italic;
}

.section-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1rem;
  h2 {
    margin: 0;
  }
}

.section-header-with-filter {
  justify-content: space-between;
  align-items: center;
}

.section-title-group {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
</style>
