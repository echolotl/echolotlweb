<template>
    <div class="blog-page">
        <h1 class="large-title">Blog</h1>
        <p class="subtitle">
            This contains all of my blog posts, which are mostly about me, or my characters, or my website.
        </p>
        
        <div v-if="filteredPinnedPosts.length > 0" class="section-header">
            <Icon icon="pin"/>
            <h2 class="section-title">Pinned</h2>
        </div>
        <hr v-if="filteredPinnedPosts.length > 0">
        <div class="blog-list">
            <BlogCard
                v-for="post in filteredPinnedPosts"
                :key="post.slug"
                :post="post"
            />
        </div>
        
        <div class="section-header section-header-with-filter">
            <div class="section-title-group">
                <Icon icon="blog"/>
                <h2 class="section-title">All Posts</h2>
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
                    <div class="filter-option" @click="toggleFilter('blog')">
                        <Icon 
                            :icon="filters.blog ? 'checkbox' : 'checkbox-empty'" 
                            color="var(--text)"
                        />
                        <Icon icon="blog" />
                        <span>Blog Posts</span>
                    </div>
                    
                    <div class="filter-option" @click="toggleFilter('lore')">
                        <Icon 
                            :icon="filters.lore ? 'checkbox' : 'checkbox-empty'" 
                            color="var(--text)"
                        />
                        <Icon icon="lore" />
                        <span>Lore Posts</span>
                    </div>
                    
                    <div class="filter-option" @click="toggleFilter('site_update')">
                        <Icon 
                            :icon="filters.site_update ? 'checkbox' : 'checkbox-empty'" 
                            color="var(--text)"
                        />
                        <Icon icon="site_update" />
                        <span>Site Updates</span>
                    </div>
                </div>
            </div>
        </div>
        <hr>
        <div class="blog-list">
            <BlogCard
                v-for="post in filteredPosts"
                :key="post.slug"
                :post="post"
            />
        </div>
        <div v-if="loading" class="loading">
            <Icon icon="loading" />
            Loading more posts...
        </div>
        <div v-if="hasReachedEnd" class="end-message">
            {{ SPLASH_TEXTS[Math.floor(Math.random() * SPLASH_TEXTS.length)] }}
        </div>
    </div>
</template>

<script setup lang="ts">
import { getBlogPosts } from '#imports';
import BlogCard from "~/components/blog/BlogCard.vue";
import Icon from "~/components/common/Icon.vue";

const ITEMS_PER_PAGE = 20;

const SPLASH_TEXTS = [
  "What? You want me to write more?",
  "There might be more posts, but I'm not loading them for you.",
  "I forgot how to load more posts.",
  "You've reached the end of the blog!",
  "I don't know what a blog is.",
  "Can't load any more, ate them all.",
  "what"
];

const page = ref(1);
const loading = ref(false);
const hasReachedEnd = ref(false);

// Filter state
const isDropdownOpen = ref(false);
const filters = ref({
  blog: false,
  lore: false,
  site_update: false
});

const { data: allPosts } = await useAsyncData('blog', () => getBlogPosts(ITEMS_PER_PAGE, 1));

// Computed filtered posts - exclude pinned items to prevent showing them twice
const filteredPosts = computed(() => {
  if (!allPosts.value) return [];
  
  // First exclude pinned posts to prevent duplicates
  const nonPinnedPosts = allPosts.value.filter(post => !post.pinned);
  
  return nonPinnedPosts.filter(post => {
    // If no filters are active, show all non-pinned
    if (!filters.value.blog && !filters.value.lore && !filters.value.site_update) {
      return true;
    }
    
    let showPost = false;
    
    // Check each filter
    if (filters.value.blog && post.type === 'blog') {
      showPost = true;
    }
    
    if (filters.value.lore && post.type === 'lore') {
      showPost = true;
    }
    
    if (filters.value.site_update && post.type === 'site_update') {
      showPost = true;
    }
    
    return showPost;
  });
});

// Computed filtered pinned posts - prevent duplicates by using a Set to track seen slugs
const filteredPinnedPosts = computed(() => {
  if (!allPosts.value) return [];
  
  // Use a Set to track seen slugs and prevent duplicates
  const seenSlugs = new Set();
  return allPosts.value.filter(p => {
    if (p.pinned && !seenSlugs.has(p.slug)) {
      seenSlugs.add(p.slug);
      return true;
    }
    return false;
  });
});

// Computed filter helpers
const hasActiveFilters = computed(() => {
  return filters.value.blog || filters.value.lore || filters.value.site_update;
});

const activeFilterCount = computed(() => {
  let count = 0;
  if (filters.value.blog) count++;
  if (filters.value.lore) count++;
  if (filters.value.site_update) count++;
  return count;
});

// Filter methods
const toggleDropdown = () => {
  isDropdownOpen.value = !isDropdownOpen.value;
};

const toggleFilter = (filterName: 'blog' | 'lore' | 'site_update') => {
  filters.value[filterName] = !filters.value[filterName];
};

const loadMore = async () => {
  if (loading.value || hasReachedEnd.value) return;
  
  loading.value = true;
  page.value++;
  
  try {
    const newPosts = await getBlogPosts(ITEMS_PER_PAGE, page.value);

    console.log('Loaded posts for page', page.value, ':', newPosts.length, 'items');
    
    if (newPosts.length === 0) {
      hasReachedEnd.value = true;
    } else if (allPosts.value) {
      // Check for duplicates before adding new posts
      const existingSlugs = new Set(allPosts.value.map(post => post.slug));
      const uniqueNewPosts = newPosts.filter(post => !existingSlugs.has(post.slug));
      
      console.log('Unique new posts:', uniqueNewPosts.length, 'out of', newPosts.length);
      
      if (uniqueNewPosts.length > 0) {
        allPosts.value.push(...uniqueNewPosts);
      }
      
      // If we got less than expected or all were duplicates, we might have reached the end
      if (newPosts.length < ITEMS_PER_PAGE) {
        hasReachedEnd.value = true;
      }
    }
  } catch (error) {
    console.error('Error loading more posts:', error);
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

useSeoMeta({
  title: 'Blog',
  description: 'Read the latest blog posts from echolotl.',
  ogTitle: 'echolotl\'s Blog',
  ogDescription: 'read my posts',
});
</script>

<style scoped lang="scss">
.blog-page {
  margin: 0 auto;
  max-width: 1600px;
  padding: 2rem;
  margin-top: 2rem;
  @media (max-width: 600px) {
    padding: 1rem;
  }
  h1 {
    text-align: center;
  }
}

.subtitle {
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

.blog-list {
  display: flex;
  flex-wrap: wrap;
  gap: 1.5rem;
  margin-top: 2rem;
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
  color: var(--text-secondary);
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
}

.section-title-group {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
</style>
