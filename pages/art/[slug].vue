<template>
    <div v-if="art" class="art-page">
        <div class="art-header">
            <h1 class="large-title">{{ art.title }}</h1>
            <div v-if="art.description" class="art-description">
                <MDC :value="art.description" />
            </div>
            <div v-else class="art-description">
                <p>No description available.</p>
            </div>
            <div class="art-meta">
                <div v-if="art.tags && art.tags.length > 0" class="art-meta__section">
                    <Icon icon="tag" color="var(--text-secondary)"/>
                    <div class="art-meta__items">
                        <span v-for="tag in art.tags" :key="tag" class="art-meta__tag">
                            {{ tag }}
                        </span>
                    </div>
                </div>

                <div v-if="art.related_characters && art.related_characters.length > 0 || art.character" class="art-meta__section">
                    <Icon icon="character" color="var(--text-secondary)"/>
                    <div class="art-meta__items">
                        <CharacterLink v-if="art.character" :slug="art.character" class="art-meta__character" />
                        <CharacterLink v-for="character in art.related_characters" :key="character" :slug="character" class="art-meta__character" />
                    </div>
                </div>
            </div>
        </div>

        <!-- Main Art Section -->
        <div class="art-content">
            <nuxt-img
                v-if="art.image_url"
                :src="art.image_url"
                alt="Art Image"
                class="art-image"
                loading="lazy"
            />
        </div>
    </div>
</template>

<script setup lang="ts">
import { useRoute } from 'vue-router';
import CharacterLink from '~/components/common/CharacterLink.vue';
import Icon from '~/components/common/Icon.vue';

const route = useRoute();

const { data: art, refresh } = await useAsyncData(`art-${route.params.slug}`, () => {
    const slug = route.params.slug;
    return queryCollection("art").where("slug", "=", slug).first();
}, {
    watch: [() => route.params.slug],
    server: true,
    default: () => null
});

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
        statusMessage: 'Art not found'
    });
}

useSeoMeta({
    title: art.value.title,
    description: art.value.description || 'No description available for this artwork.',
    ogTitle: art.value.title,
    ogDescription: art.value.description || 'No description available for this artwork.',
    ogImage: art.value.image_url || '/images/no_image.png',
    twitterCard: 'summary_large_image',
    twitterImage: art.value.image_url || '/images/no_image.png'
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
    border: 1px solid var(--distant);
    border-radius: .25rem;
    padding: .25rem;
    display: flex;
    justify-content: center;
    align-items: center;
    max-width: 100%;
    overflow: hidden;
}

.art-image {
    max-height: 75vh;
    max-width: 100%;
    width: auto;
    height: auto;
    object-fit: contain;
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

.art-meta__items {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
}

.art-meta__tag {
    border: 1px solid var(--distant);
    color: var(--text-secondary);
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
    font-size: 0.8rem;
    text-transform: uppercase;
    background: rgba(0, 0, 0, 0.05);
}

.art-meta__character {
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