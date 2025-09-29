<template>
  <div v-if="art" class="art-page">
    <div class="art-header">
      <h1 class="large-title">
        <SketchText size="3rem">{{ art.title }}</SketchText>
      </h1>
      <div class="art-description">
        <p v-if="art.description" v-html="parsedDescription"></p>
        <p v-else>No description available.</p>
      </div>
      <div class="art-meta">
        <TagList
          v-if="art.tags && art.tags.length > 0"
          icon="tag"
          :items="art.tags"
        >
          <Tag v-for="tag in art.tags" :key="tag">
            {{ tag }}
          </Tag>
        </TagList>

        <TagList
          v-if="
            (art.related_characters && art.related_characters.length > 0) ||
            art.character
          "
          icon="character"
          :items="art.related_characters || [art.character].filter(Boolean)"
        >
          <CharacterTag
            v-if="art.character"
            :slug="art.character"
            sketch-text
          />
          <CharacterTag
            v-for="character in art.related_characters"
            :key="character"
            :slug="character"
            sketch-text
          />
        </TagList>
        <div v-if="art.created_at" class="art-meta__section">
          <Icon icon="date" color="var(--text-secondary)" />
          <span class="art-meta__date">{{
            new Date(art.created_at).toLocaleDateString()
          }}</span>
        </div>
      </div>
    </div>

    <!-- Main Art Section -->
     <ArtGallery :art="art" />
  </div>
</template>

<script setup lang="ts">
import { useRoute } from "vue-router";
import CharacterTag from "~/components/common/CharacterTag.vue";
import Icon from "~/components/common/Icon.vue";
import Tag from "~/components/common/Tag.vue";
import TagList from "~/components/common/TagList.vue";
import SketchText from "~/components/common/SketchText.vue";
import { micromark } from "micromark";

const route = useRoute();

const parsedDescription = computed(() => {
  return art.value?.description ? micromark(art.value.description) : "";
});

const { data: art, refresh } = await useAsyncData(
  `art-${route.params.slug}`,
  () => {
    const slug = route.params.slug;
    return queryCollection("art").where("slug", "=", slug).first();
  },
  {
    watch: [() => route.params.slug],
    server: true,
    default: () => null,
  }
);

// Force refresh when navigating to ensure fresh data
onMounted(() => {
  if (import.meta.client) {
    refresh();
  }
});

// Redirect to 404 if art is not found
if (!art.value) {
  throw createError({
    statusCode: 404,
    statusMessage: "Art not found",
  });
}

useSeoMeta({
  title: art.value.title,
  description:
    art.value.description || "No description available for this artwork.",
  ogTitle: art.value.title,
  ogDescription:
    art.value.description || "No description available for this artwork.",
  ogImage: art.value.images[0]?.image_url || "/images/no_image.png",
  twitterCard: "summary_large_image",
  twitterImage: art.value.images[0]?.image_url || "/images/no_image.png",
});
</script>

<style scoped lang="scss">
.art-page {
  min-height: 100vh;
  padding: 2rem;
}

.art-header {
  max-width: 1200px;
  margin: 0 auto;
  margin-bottom: 2rem;
}

.art-content {
  margin: 0 auto;
  display: flex;
  justify-content: center;
  align-items: center;
  max-width: 100%;
  overflow: hidden;
  img {
    margin: 1rem;
    border: 1px solid var(--distant);
  }
}

.art-image {
  max-height: 75vh;
  max-width: 100%;
  width: auto;
  height: auto;
  object-fit: contain;
  min-height: 200px; /* Prevents border collapse while loading */
  min-width: 200px;  /* Ensures some dimension for the border */
}

.art-description {
  color: var(--text-secondary);
  font-size: 1.1rem;
  line-height: 1.6;
  margin: 0.5rem 0 1rem 0;

  :deep(p) {
    margin: 0;
  }

  :deep(a) {
    color: var(--accent);
    text-decoration: none;

    &:hover {
      text-decoration: underline;
    }
  }
}

.art-meta {
  margin: 1rem 0;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.art-meta__section {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.art-title {
  font-size: 2.5rem;
  font-weight: bold;
  margin-bottom: 0.5rem;
}

.art-date {
  color: var(--text-secondary);
  font-size: 0.9rem;
  margin-bottom: 1rem;
}
</style>
