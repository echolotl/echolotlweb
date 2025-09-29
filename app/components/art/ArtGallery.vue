<template>
  <div
    class="gallery"
    v-if="art.images && art.images.length"
    @keydown="onKey"
    tabindex="0"
    ref="galleryRoot"
  >
    <div class="viewer">
      <button
        v-if="hasMultiple"
        class="nav prev"
        @click="prevImage"
        aria-label="Previous image"
      >
        <Icon icon="small-arrow" style="transform: rotate(180deg);" />
      </button>

      <div class="image-wrapper">
        <nuxt-img
          v-if="activeSource"
          :src="activeSource.image_url"
          :alt="activeSource.alt"
          class="hero"
          :data-index="currentImageIndex"
          :data-variant="currentVariantIndex ?? 'base'"
          loading="lazy"
        />
        <div v-else class="placeholder">No image</div>
      </div>

      <button
        v-if="hasMultiple"
        class="nav next"
        @click="nextImage"
        aria-label="Next image"
      >
        <Icon icon="small-arrow" />
      </button>
    </div>

    <!-- Thumbnails (base images) -->
    <div v-if="hasMultiple" class="thumb-strip">
      <button
        v-for="(img, i) in art.images"
        :key="img.id || i"
        class="thumb"
        :class="{ active: i === currentImageIndex }"
        @click="selectImage(i)"
        :aria-label="`Select image ${i + 1} of ${art.images.length}`"
      >
        <nuxt-img
          :src="img.thumbnail_url || img.image_url"
          :alt="img.alt || art.title"
          loading="lazy"
        />
        <span
          v-if="img.variants?.length"
          class="variant-count"
          :title="img.variants.length + ' variants'"
          >{{ img.variants.length }}</span
        >
      </button>
    </div>

    <!-- Variant selector for current base image -->
    <div
      v-if="currentImage?.variants && currentImage.variants.length"
      class="variants"
    >
      <div class="variants__label"><Icon icon="layers" /> Alts</div>
      <div class="variants__list">
        <button
          class="variant-chip"
          :class="{ active: currentVariantIndex === null }"
          @click="currentVariantIndex = null"
        >
          Original
        </button>
        <button
          v-for="(variant, vIndex) in currentImage.variants"
          :key="vIndex"
          class="variant-chip"
          :class="{ active: currentVariantIndex === vIndex }"
          @click="selectVariant(vIndex)"
        >
          {{ variant.label || "Alt " + (vIndex + 1) }}
        </button>
      </div>
    </div>
  </div>
  <div v-else class="gallery-empty">No images available.</div>
</template>

<script setup lang="ts">
import type { Art, ArtImage } from "~~/types";
import Icon from "~/components/common/Icon.vue";

const props = defineProps<{ art: Art }>();

const currentImageIndex = ref(0);
const currentVariantIndex = ref<number | null>(null);
const galleryRoot = ref<HTMLElement | null>(null);

const hasMultiple = computed(() => (props.art.images?.length || 0) > 1);
const currentImage = computed<ArtImage | undefined>(
  () => props.art.images?.[currentImageIndex.value]
);

const activeSource = computed(() => {
  const base = currentImage.value;
  if (!base) return null;
  if (currentVariantIndex.value !== null && base.variants) {
    const maybe = base.variants[currentVariantIndex.value];
    if (maybe) {
      return {
        image_url: maybe.image_url,
        thumbnail_url: maybe.thumbnail_url || base.thumbnail_url,
        alt: maybe.alt || base.alt || props.art.title,
      };
    }
  }
  return {
    image_url: base.image_url,
    thumbnail_url: base.thumbnail_url,
    alt: base.alt || props.art.title,
  };
});

function selectImage(index: number) {
  if (index < 0 || !props.art.images || index >= props.art.images.length)
    return;
  currentImageIndex.value = index;
  currentVariantIndex.value = null; // reset variant selection
}

function selectVariant(vIndex: number) {
  currentVariantIndex.value = vIndex;
}

function prevImage() {
  if (!props.art.images?.length) return;
  currentImageIndex.value =
    (currentImageIndex.value - 1 + props.art.images.length) %
    props.art.images.length;
  currentVariantIndex.value = null;
}

function nextImage() {
  if (!props.art.images?.length) return;
  currentImageIndex.value =
    (currentImageIndex.value + 1) % props.art.images.length;
  currentVariantIndex.value = null;
}

function onKey(e: KeyboardEvent) {
  switch (e.key) {
    case "ArrowLeft":
      prevImage();
      break;
    case "ArrowRight":
      nextImage();
      break;
    case "Escape":
      currentVariantIndex.value = null;
      break;
    default:
      // Number keys 1..9 to pick variants quickly
      if (currentImage.value?.variants?.length) {
        const n = parseInt(e.key, 10);
        if (!isNaN(n) && n >= 1) {
          if (n === 1) currentVariantIndex.value = null; // original
          else if (n - 2 < currentImage.value.variants.length)
            currentVariantIndex.value = n - 2;
        }
      }
  }
}

onMounted(() => {
  galleryRoot.value?.focus();
});
</script>

<style scoped lang="scss">
.gallery {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  outline: none;
}

.viewer {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
}

.nav {
  padding: 0.5rem;
  cursor: pointer;
  color: var(--text);
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  &:hover {
    background: var(--bg-secondary);
  }
}

.image-wrapper {
  position: relative;
  max-width: 100%;
  max-height: 75vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-tertiary);
  border: 1px solid var(--distant);
  padding: 0.5rem;
  .hero {
    max-height: 70vh;
    max-width: 100%;
    object-fit: contain;
  }
  .variant-badge {
    position: absolute;
    top: 0.5rem;
    right: 0.5rem;
    background: var(--bg-secondary);
    color: var(--primary);
    font-size: 0.75rem;
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
    border: 1px solid var(--primary);
  }
}

.thumb-strip {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  justify-content: center;
  .thumb {
    position: relative;
    padding: 0;
    border: 2px solid transparent;
    background: transparent;
    cursor: pointer;
    border-radius: 4px;
    overflow: hidden;
    &:focus-visible {
      outline: 2px solid var(--primary);
    }
    &.active {
      border-color: var(--primary);
    }
    img {
      width: 60px;
      height: 60px;
      object-fit: cover;
      display: block;
    }
    .variant-count {
      position: absolute;
      bottom: 2px;
      right: 2px;
      background: var(--primary);
      color: var(--background);
      font-size: 0.65rem;
      line-height: 1;
      padding: 2px 4px;
      border-radius: 3px;
    }
  }
}

.variants {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  align-items: flex-start;
  max-width: 1200px;
  width: 100%;
  margin: 0 auto;
  .variants__label {
    font-size: 1rem;
    color: var(--text-secondary);
    display: flex;
    gap: 0.35rem;
    align-items: center;
  }
  .variants__list {
    display: flex;
    gap: 0.4rem;
    flex-wrap: wrap;
  }
  .variant-chip {
    background: var(--bg-tertiary);
    border: 1px solid var(--distant);
    padding: 0.25rem 0.6rem;
    font-size: 0.75rem;
    border-radius: 999px;
    cursor: pointer;
    &:hover {
      background: var(--bg-secondary);
    }
    &.active {
      background: var(--primary);
      color: var(--background);
      border-color: var(--primary);
    }
  }
}

.gallery-empty {
  color: var(--text-secondary);
  font-style: italic;
}
</style>
