<template v-if="props.icon">
    <img :src="path" :alt="props.alt" :width="props.width" :height="props.height" :class="{ 'invert': props.invert }" />
</template>

<script setup lang="ts">
import { defineProps, computed } from 'vue';


const path = computed(() => {
    return `/images/icons/${props.icon}.png`;
});

const props = defineProps({
    icon: {
        type: String,
        required: true
    },
    alt: {
        type: String,
        default: ''
    },
    width: {
        type: String,
        default: '24px'
    },
    height: {
        type: String,
        default: '24px'
    },
    invert: {
        type: Boolean,
        default: false
    }
});
</script>