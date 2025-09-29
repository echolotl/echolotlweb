<template>
  <div class="art-page">
    <div style="width: 100%; display: flex; justify-content: center;">
        <SketchText size="4rem">ART ARCHIVE</SketchText>
    </div>
    <p class="subtitle">This stores all of the art I've made, including character and general art.</p>

        <div v-if="filteredPinnedArtworks.length > 0" class="section-header" >
      <Icon icon="pin" />
      <h2 class="section-title" style="transform: translateY(2px);"><SketchText size="1.5rem">PINNED</SketchText></h2>
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
        <h2 class="section-title" style="transform: translateY(2px);"><SketchText size="1.5rem">All</SketchText></h2>
      </div>
      <div class="filter-chips" aria-label="Artwork filters">
        <button
          class="filter-chip"
          :class="{ active: filters.sketches }"
          @click="toggleFilter('sketches')"
          :aria-pressed="filters.sketches"
        >
          <Icon icon="sketch" />
          <span>Sketches</span>
        </button>
        <button
          class="filter-chip"
          :class="{ active: filters.characterArt }"
          @click="toggleFilter('characterArt')"
          :aria-pressed="filters.characterArt"
        >
          <Icon icon="character" />
          <span>Character Art</span>
        </button>
        <button
          class="filter-chip"
          :class="{ active: filters.generalArt }"
          @click="toggleFilter('generalArt')"
          :aria-pressed="filters.generalArt"
        >
          <Icon icon="art" />
          <span>General Art</span>
        </button>
      </div>
    </div>
            <hr>
    <div class="art-grid">
      <ArtItem v-for="artwork in filteredArtworks" :key="artwork.slug" :artwork="artwork" show-metadata show-character-badge />
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
import { getArtworks, getPinnedArtworks } from '#imports';
import Icon from '~/components/common/Icon.vue';
import SketchText from '~/components/common/SketchText.vue';

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

// Filter state (chip toggles)
const filters = ref({
  sketches: false,
  characterArt: false,
  generalArt: false
});

// Fetch pinned artworks first, then regular artworks
const { data: pinnedArtworks } = await useAsyncData('pinned-art', () => getPinnedArtworks());
const { data: initialRegularArtworks } = await useAsyncData('regular-art', () => getArtworks(ITEMS_PER_PAGE, 1));

// Use reactive refs for artworks that can be modified
const allPinnedArtworks = ref(pinnedArtworks.value || []);
const allRegularArtworks = ref(initialRegularArtworks.value || []);

// Computed filtered artworks - exclude pinned items to prevent showing them twice
const filteredArtworks = computed(() => {
  // Only filter the regular (non-pinned) artworks
  const nonPinnedArtworks = allRegularArtworks.value;
  
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

// Computed filtered pinned artworks - apply same filters to pinned artworks
const filteredPinnedArtworks = computed(() => {
  const pinnedArtworks = allPinnedArtworks.value;
  
  // If no filters are active, show all pinned artworks
  if (!filters.value.sketches && !filters.value.characterArt && !filters.value.generalArt) {
    return pinnedArtworks;
  }
  
  return pinnedArtworks.filter(artwork => {
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

// (Optional) could compute hasActiveFilters if needed elsewhere
// const hasActiveFilters = computed(() => filters.value.sketches || filters.value.characterArt || filters.value.generalArt);

// Filter method
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
    } else {
      // Check for duplicates before adding new artworks
      const existingSlugs = new Set([...allPinnedArtworks.value, ...allRegularArtworks.value].map(artwork => artwork.slug));
      const uniqueNewArtworks = newArtworks.filter(artwork => !existingSlugs.has(artwork.slug));
      
      console.log('Unique new artworks:', uniqueNewArtworks.length, 'out of', newArtworks.length);

      if (uniqueNewArtworks.length > 0) {
        // Add only non-pinned artworks to the regular artworks list
        const nonPinnedNewArtworks = uniqueNewArtworks.filter(artwork => !artwork.pinned);
        allRegularArtworks.value = [...allRegularArtworks.value, ...nonPinnedNewArtworks];
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

// Set up infinite scrolling
onMounted(() => {
  window.addEventListener('scroll', throttledScrollCheck);
});

onUnmounted(() => {
  window.removeEventListener('scroll', throttledScrollCheck);
  if (scrollTimeout) {
    clearTimeout(scrollTimeout);
  }
});

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
  margin-top: 2rem;
  max-width: 1200px;
  text-align: center;
  @media (max-width: 600px) {
    padding: 1rem;
  }
}

.art-title {
  mask-image: url('/images/art/art_archive_title.webp');
  mask-size: contain;
  mask-repeat: no-repeat;
  mask-position: center;
  width: 100%;
  max-width: 500px;
  height: 100px;
  image-rendering: crisp-edges;
  background-color: var(--text);
}

.filter-container {
  position: relative;
}

.filter-chips {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  justify-content: flex-end;
  max-width: 100%;
  @media (max-width: 700px) {
    justify-content: center;
    margin-top: 0.5rem;
  }
}

.filter-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  background: var(--bg-tertiary);
  border: 1px solid var(--distant);
  padding: 0.35rem 0.75rem;
  font-size: 0.75rem;
  border-radius: 999px;
  cursor: pointer;
  line-height: 1;
  color: var(--text);
  transition: background 0.18s ease, border-color 0.18s ease, color 0.18s ease;
  font-family: var(--body-font, 'IBM Plex Sans', sans-serif);
  &:hover {
    background: var(--bg-secondary);
  }
  &:focus-visible {
    outline: 2px solid var(--primary);
    outline-offset: 2px;
  }
  &.active {
    background: var(--primary);
    border-color: var(--primary);
    color: var(--background);
  }
  span { pointer-events: none; }
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
  margin: 1rem 0;
  h2 {
    margin: 0;
  }
}

.section-header-with-filter {
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
}

.section-title-group {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
</style>
