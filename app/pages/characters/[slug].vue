<template>
  <div
    v-if="character"
    class="character-page"
    :style="{ '--theme-color': themeColor }">
    <CharacterBanner :character="character" />
    <div class="character-content">
      <div class="character-main-content">
        <CharacterInfobox :character="character" />
        <h2 class="section-title">
          <span class="lotl-font" style="font-size: 1.2em">Description</span>
        </h2>
        <content-renderer :value="character" class="character-text" prose />
      </div>
    </div>
    <div class="character-images">
      <h2 class="section-title">
        <Icon
          icon="art_brush"
          width="36px"
          height="36px"
          style="color: var(--theme-color)" />
        <span class="lotl-font" style="font-size: 1.2em">Artwork</span>
      </h2>
      <ArtGrid
        v-if="characterArtworks && characterArtworks.length > 0"
        :artworks="characterArtworks"
        show-metadata />
      <div v-else class="no-artwork">
        <p>No artwork found for this character yet.</p>
      </div>
      <SplashText v-if="characterArtworks && characterArtworks.length > 0" />
    </div>
  </div>
</template>

<script setup lang="ts">
import CharacterBanner from "~/components/characters/CharacterBanner.vue";
import CharacterInfobox from "~/components/characters/CharacterInfobox.vue";
import ArtGrid from "~/components/art/ArtGrid.vue";
import Icon from "~/components/common/Icon.vue";
import { getArtworksByCharacter } from "~/utils/art";

import { useTheme } from "~~/composables/useTheme";
import SplashText from "~/components/common/SplashText.vue";

const route = useRoute();

const { data: character } = await useAsyncData(
  `character-${route.params.slug}`,
  () => {
    const slug = route.params.slug;
    return queryCollection("characters").where("slug", "=", slug).first();
  },
  {
    watch: [() => route.params.slug],
    server: true,
  },
);

// Redirect to 404 if character is not found
if (!character.value) {
  throw createError({
    statusCode: 404,
    statusMessage: "Character not found",
  });
}

// Character artwork loading
const { data: characterArtworks } = await useAsyncData(
  `character-artworks-${route.params.slug}`,
  async () => {
    if (!character.value) return [];
    return await getArtworksByCharacter(character.value.slug);
  },
  {
    watch: [() => route.params.slug],
    server: true,
  },
);

const { theme } = useTheme();

const themeColor = computed(() => {
  if (!character.value) return "#000000";

  // If theme is light (true), use light color if available
  if (theme.value && character.value.theme_color_light) {
    return character.value.theme_color_light;
  }
  // Otherwise use the default theme color
  return character.value.theme_color || "#000000";
});

const updateScrollbarColor = () => {
  document.documentElement.style.setProperty(
    "--scrollbar-bar",
    themeColor.value,
  );
};

watch(themeColor, () => {
  updateScrollbarColor();
});

onMounted(() => {
  updateScrollbarColor();
});

onBeforeUnmount(() => {
  // Reset scrollbar color on unmount
  document.documentElement.style.setProperty(
    "--scrollbar-bar",
    "var(--primary)",
  );
});

useSeoMeta({
  title: character.value.name,
  description: character.value.short_description,
  ogTitle: character.value.name,
  ogDescription: `${character.value.species} ◆ ${character.value.pronouns} ◆ ${character.value.short_description}`,
  themeColor: themeColor.value || "#000000",
});
</script>

<style lang="scss" scoped>
@use "~/assets/styles/partials/mixins" as *;
.character-page {
  position: relative;
  min-height: 100vh;
}

.character-content,
.character-images {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;

  @media (max-width: 768px) {
    /* On mobile, stack vertically */
    display: flex;
    flex-direction: column;
  }

  /* Clear floats after content */
  &::after {
    content: "";
    display: table;
    clear: both;
  }
}
.character-text {
  /* Text will naturally wrap around the floated infobox */
  text-align: left;

  @media (max-width: 768px) {
    order: 1;
  }

  :deep(p) {
    font-size: var(--base-text);
  }

  :deep(h1),
  :deep(h2),
  :deep(h3),
  :deep(h4),
  :deep(h5),
  :deep(h6) {
    font-weight: 800;
    line-height: 1.25;
    margin-bottom: 1rem;
    margin-top: 1.5rem;
  }

  :deep(h2) {
    padding-bottom: 0.3rem;
    border-bottom: 1px solid var(--distant);
    font-size: var(--large-text);
  }

  :deep(h3) {
    font-size: var(--medium-text);
  }

  :deep(h4) {
    font-size: var(--base-text);
  }

  :deep(h5) {
    font-size: var(--small-text);
  }

  :deep(h6) {
    font-size: var(--small-text);
    color: var(--text-secondary);
  }
}
.section-title {
  @include color-text-stroke(var(--theme-color), 6px);
  color: var(--background);
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
}

.no-posts {
  text-align: center;
  padding: 2rem;
  color: var(--text-secondary);
  font-style: italic;
}

.no-artwork {
  text-align: center;
  padding: 2rem;
  color: var(--text-secondary);
  font-style: italic;
}

.loading {
  text-align: center;
  padding: 2rem;
}

.end-message {
  text-align: center;
  padding: 2rem;
  font-size: var(--base-text);
  color: var(--text-secondary);
  font-style: italic;
}
</style>
