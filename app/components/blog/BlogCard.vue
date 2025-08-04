<template>
  <div :class="`blog-post-card ${post.type}`">
    <nuxt-link :to="`/blog/${post.slug}`" class="blog-post-card__link">
      <div class="blog-post-card__content">
        <div
          v-if="post.thumbnail_image"
          class="blog-post-card__image"
          :style="{ backgroundImage: `url(${post.thumbnail_image})` }"
        ></div>
        <div class="blog-post-card__details">
          <h2 class="blog-post-card__header font-display">
            <div class="blog-post-card__title">
              <Icon :icon="`${post.type}`" />
              <span class="blog-post-card__title-text">{{ post.title }}</span>
            </div>
            <TagList
              v-if="post.tags && !post.related_characters"
              icon="tag"
              :items="post.tags"
            >
              <Tag>{{ post.tags[0] }}</Tag>
              <Tag
                v-if="post.tags.length > 1"
                variant="more"
              >+{{ post.tags.length - 1 }}</Tag>
            </TagList>
            <TagList
              v-if="post.related_characters && post.related_characters.length > 0"
              icon="character"
              :items="post.related_characters"
            >
              <CharacterTag 
                v-if="post.related_characters[0]" 
                :slug="post.related_characters[0].slug" 
                sketch-text 
              />
              <Tag
                v-if="post.related_characters.length > 1"
                variant="more"
              >+{{ post.related_characters.length - 1 }}</Tag>
            </TagList>
          </h2>
          <div class="blog-post-card__other-details">
            <span class="blog-post-card__other-detail">
              <Icon icon="date" color="var(--text-secondary)" height="16" width="16" />
              {{ new Date(post.created_date).toLocaleDateString() }}
            </span>
            <span class="blog-post-card__other-detail">
              <Icon icon="pencil" color="var(--text-secondary)" height="16" width="16" />
              {{ post.author }}
            </span>
          </div>
          <p class="blog-post-card__excerpt">{{ post.abstract }}</p>
            <span class="blog-post-card__other-detail-type" :style="{ color: post.type === 'blog' ? 'var(--primary)' : post.type === 'lore' ? 'var(--purple)' : 'var(--green)', textTransform: 'uppercase' }">
              <span>{{ utils.blogTypeToString(post.type) }}</span>
            </span>
        </div>
      </div>
    </nuxt-link>
  </div>
</template>

<script setup lang="ts">
import type { BlogPost } from "~~/types";
import utils from "~/utils";
import Icon from "~/components/common/Icon.vue";
import Tag from "~/components/common/Tag.vue";
import TagList from "~/components/common/TagList.vue";
import CharacterTag from "~/components/common/CharacterTag.vue";

defineProps<{
  post: BlogPost;
}>();
</script>
<style scoped lang="scss">
@use "~/assets/styles/partials/_variables" as *;
.blog-post-card {
  border: 1px solid var(--distant);
  border-bottom: 2px solid var(--distant);
  background: rgba(0, 0, 0, 0.05);
  display: flex;
  flex-direction: column;
  flex: 1 1 300px; // Flex grow, shrink, and basis for responsive grid
  min-width: 300px;
  max-width: 400px;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  &.blog {
    color: var(--primary);
    border-bottom-color: var(--primary);
  }
  &.lore {
    color: var(--purple);
    border-bottom-color: var(--purple);
  }
  &.site_update {
    color: var(--green);
    border-bottom-color: var(--green);
  }
  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  }
}
.blog-post-card__content {
  display: flex;
  flex-direction: column;
  padding: 1rem;
  text-decoration: none;
  height: 100%; // Ensure content fills the card
}
.blog-post-card__link {
  text-decoration: none;
  color: inherit;
  display: flex;
  flex-direction: column;
  height: 100%;
}
.blog-post-card__image {
  width: 100%;
  max-height: 200px;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  border-radius: 4px;
  margin-bottom: 1rem;
}
.blog-post-card__details {
  flex: 1;
  display: flex;
  flex-direction: column;
  h2 {
    font-weight: 800;
  }
}
.blog-post-card__header {
  margin: 0 0 0.5rem 0;
  font-size: 1.25rem;
  font-weight: 600;
  line-height: 1.3;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 0.5rem;
}
.blog-post-card__title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex: 1;
  min-width: 0;
  &-text {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    flex: 1;
    min-width: 0;
  }
}
.blog-post-card__excerpt {
  margin: .5rem 0;
  flex: 1;
  font-size: 0.9rem;
  line-height: 1.4;
  color: var(--text-secondary);
}

.blog-post-card__other-details {
  display: flex;
  align-items: center;
  gap: .5rem;
  font-size: 0.8rem;
  color: var(--text-secondary);
  justify-content: space-between; /* Add this to create space between elements */
}
.blog-post-card__other-detail {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  &-type {
    font-weight: 600;
    color: var(--text);
    margin-left: auto;
    font-size: 0.8rem;
  }
}
</style>
