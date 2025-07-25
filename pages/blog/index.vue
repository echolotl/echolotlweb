<template>
    <div class="blog-page">
        <h1 class="large-title">Blog</h1>
        <p class="subtitle">
            This contains all of my blog posts, which are mostly about me, or my characters, or my website.
        </p>
        <div class="section-header">
            <Icon icon="pin"/>
            <h2 class="section-title">Pinned</h2>
        </div>
        <hr>
        <div class="blog-list">
            <BlogCard
                v-for="(post, index) in posts"
                :key="index"
                :post="post"
            />
        </div>
        <div class="section-header" style="margin-top: 2rem;">
            <Icon icon="blog"/>
            <h2 class="section-title">All Posts</h2>
        </div>
        <hr>
        <div class="blog-list">
            <BlogCard
                v-for="(post, index) in allPosts"
                :key="index"
                :post="post"
            />
        </div>
    </div>
</template>

<script setup lang="ts">
import { useAsyncData } from "nuxt/app";
import { computed } from "vue";
import BlogCard from "~/components/blog/BlogCard.vue";
import Icon from "~/components/common/Icon.vue";

const { data: allPosts } = await useAsyncData(() => {
  return queryCollection("blog").all();
});

const posts = computed(() => {
  return allPosts.value?.filter(post => post.pinned) || [];
});

useSeoMeta({
  title: 'Blog',
  description: 'Read the latest blog posts from echolotl.',
  ogTitle: 'echolotl\'s Blog',
  ogDescription: 'Read the latest blog posts from echolotl.',
});
</script>

<style scoped lang="scss">
.blog-page {
  margin: 0 auto;
  max-width: 1600px;
    padding: 1rem;
  h1 {
    text-align: center;
  }
}

.subtitle {
  text-align: center;
}

.blog-list {
  display: flex;
  flex-wrap: wrap;
  gap: 1.5rem;
  margin-top: 2rem;
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
</style>