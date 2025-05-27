<template>
    <div v-if="character" class="character-page">
        <h1>{{ character.name }}</h1>
        <div class="character-details">
        <img :src="character.image" alt="Character Image" />
        <p>{{ character.description }}</p>
        </div>
    </div>
</template>

<script setup lang="ts">

const route = useRoute();

const { data: character } = await useAsyncData(() => {
    const slug = route.params.slug;
    return queryCollection("characters").where("slug", "=", slug).first();
});

</script>