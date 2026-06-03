<template>
    <div v-if="art" class="art-page">
        <div class="art-header">
            <h1
                class="large-title"
                style="margin-bottom: 0rem; line-height: 1.2">
                <span class="lotl-font" style="font-size: 3rem">{{
                    art.title
                }}</span>
            </h1>

            <div class="art-description">
                <p v-if="art.description" v-html="parsedDescription"></p>
                <p v-else>No description available.</p>
            </div>
            <div class="art-meta">
                <div class="left">
                    <TagList
                        v-if="art.tags && art.tags.length > 0"
                        icon="tag"
                        :items="art.tags"
                        class="art-meta__tag-list">
                        <Tag
                            v-for="tag in art.tags"
                            :key="tag"
                            clickable
                            @click="goToArtWithTag(tag)">
                            {{ tag }}
                        </Tag>
                    </TagList>

                    <TagList
                        v-if="
                            (art.related_characters &&
                                art.related_characters.length > 0) ||
                            art.character
                        "
                        icon="character"
                        :items="
                            art.related_characters ||
                            [art.character].filter(Boolean)
                        ">
                        <CharacterTag
                            v-if="art.character"
                            :slug="art.character" />
                        <CharacterTag
                            v-for="character in art.related_characters"
                            :key="character"
                            :slug="character" />
                    </TagList>
                    <div v-if="art.created_at" class="art-meta__section">
                        <Icon icon="date" color="var(--text-secondary)" />
                        <span class="art-meta__date">{{
                            new Date(art.created_at).toLocaleDateString()
                        }}</span>
                    </div>
                    <div v-if="art.artist_name" class="art-meta__section">
                        <Icon icon="pencil" color="var(--text-secondary)" />
                        <span class="art-meta__date">{{
                            art.artist_name
                        }}</span>
                    </div>
                </div>
                <div class="right">
                    <Icon
                        v-if="art.character"
                        icon="character"
                        color="var(--primary)" />
                    <Icon v-if="art.pinned" icon="pin" color="var(--primary)" />
                    <Icon
                        v-if="art.sketch"
                        icon="sketch"
                        color="var(--primary)" />
                    <Icon
                        v-if="art.images.length > 1"
                        icon="images"
                        color="var(--primary)" />
                </div>
            </div>
            <hr style="margin-top: 0.5rem" />
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
import { micromark } from "micromark";

const route = useRoute();
const router = useRouter();

function goToArtWithTag(tag: string) {
    router.push({ path: "/art", query: { tags: tag } });
}

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
    },
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
    min-width: 200px; /* Ensures some dimension for the border */
}

.art-description {
    color: var(--text-secondary);
    font-size: var(--base-text);
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
    margin: 0.75rem 0;
    display: flex;
    gap: 0.75rem;
    justify-content: space-between;
    .right {
        display: flex;
        flex: 0 0 auto;
        gap: 0.25rem;
    }
    .left {
        flex: 1 1 auto;
        display: flex;
        gap: 0.75rem;
        flex-wrap: wrap;
    }
}

.art-meta__section {
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.art-meta__tag-list {
    display: inline-flex;
}

.art-meta__date {
    color: var(--text-secondary);
    font-size: var(--small-text);
}

.art-title {
    font-size: var(--xl-text);
    font-weight: bold;
    margin-bottom: 0.5rem;
}

.art-date {
    color: var(--text-secondary);
    font-size: var(--small-text);
    margin-bottom: 1rem;
}
</style>
