<template>
    <div v-if="post" class="blog-page">
        <div class="blog-header">
            <nuxt-img
            v-if="post.thumbnail_image"
                :src="post.thumbnail_image"
                alt="Blog Post Thumbnail"
                class="blog-header__image"
                />
            <h1 class="large-title">{{ post.title }}</h1>
            <p class="subtitle">{{ post.abstract }}</p>
            
            <!-- Tags and Characters -->
            <div class="blog-meta">
                <div v-if="post.tags && post.tags.length > 0" class="blog-meta__section">
                    <Icon icon="tag" color="var(--text-secondary)"/>
                    <div class="blog-meta__items">
                        <span v-for="tag in post.tags" :key="tag" class="blog-meta__tag">
                            {{ tag }}
                        </span>
                    </div>
                </div>
                
                <div v-if="post.related_characters && post.related_characters.length > 0" class="blog-meta__section">
                    <Icon icon="character" color="var(--text-secondary)"/>
                    <div class="blog-meta__items">
                        <nuxt-link 
                            v-for="character in post.related_characters" 
                            :key="character.slug" 
                            :to="`/characters/${character.slug}`" 
                            class="blog-meta__character link"
                        >
                            {{ character.name }}
                        </nuxt-link>
                    </div>
                </div>
            </div>
            
            <hr>
        </div>
        <div class="blog-content">
            <content-renderer :value="post" class="blog-text" prose />
            </div>
    </div>
</template>

<script setup lang="ts">
import { useRoute } from 'vue-router';
import Icon from '~/components/common/Icon.vue';

const route = useRoute();

// Fetch post data based on the slug
const { data: post } = await useAsyncData(() => {
    const slug = route.params.slug;
    return queryCollection("blog").where("slug", "=", slug).first();
});

// Redirect to 404 if post is not found
if (!post.value) {
    throw createError({
        statusCode: 404,
        statusMessage: 'Post not found'
    });
} else {
    console.log("Post data loaded:", post.value);
}
</script>
<style scoped lang="scss">
.blog-page {
    min-height: 100vh;
    padding: 2rem;
}
.blog-header__image {
    width: 100%;
    height: 300px;
    object-fit: cover;
    border-radius: 0 0 1rem 1rem;
    margin-bottom: 20px;
    border: 1px solid var(--distant);
}

.blog-content {
    max-width: 1200px;
    margin: 0 auto;
}
.blog-header {
    max-width: 1200px;
    margin: 0 auto;
}

.blog-meta {
    margin: 1rem 0;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
}

.blog-meta__section {
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.blog-meta__items {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
}

.blog-meta__tag {
    border: 1px solid var(--distant);
    color: var(--text-secondary);
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
    font-size: 0.8rem;
    text-transform: uppercase;
    background: rgba(0, 0, 0, 0.05);
}

.blog-meta__character {
    border: 1px solid var(--distant);
    color: var(--text-secondary);
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
    font-size: 0.8rem;
    text-decoration: none;
    background: rgba(0, 0, 0, 0.05);
    transition: background-color 0.2s ease, color 0.2s ease;
    
    &:hover {
        background: var(--distant);
        color: var(--text);
    }
}
</style>