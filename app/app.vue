<template>
  <div>
    <NuxtLayout>
      <NuxtRouteAnnouncer />
      <NuxtPage />
    </NuxtLayout>
  </div>
</template>

<script setup lang="ts">
import { useAuth } from "~~/composables/useAuth";

const { fetchUser } = useAuth();

onMounted(() => {
  fetchUser();
});

useHead({
  script: [
    {
      src: "https://umami.echolotl.lol/script.js",
      "data-website-id": "77e4ea44-c716-4370-822b-c56b37406967",
      defer: true,
    },
  ],
});
</script>
