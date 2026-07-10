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
</script>
