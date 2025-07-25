<template v-if="props.icon">
    <div 
        :style="maskStyle" 
        :class="{ 'invert': props.invert }"
        role="img"
        :aria-label="props.alt"
    />
</template>

<script setup lang="ts">
import { defineProps, computed } from 'vue';

const maskStyle = computed(() => {
    const width = props.width.includes('px') ? props.width : `${props.width}px`;
    const height = props.height.includes('px') ? props.height : `${props.height}px`;
    
    return {
        width,
        height,
        backgroundColor: props.color,
        maskImage: `url(/images/icons/${props.icon}.webp)`,
        WebkitMaskImage: `url(/images/icons/${props.icon}.webp)`,
        maskSize: 'contain',
        WebkitMaskSize: 'contain',
        maskRepeat: 'no-repeat',
        WebkitMaskRepeat: 'no-repeat',
        maskPosition: 'center',
        WebkitMaskPosition: 'center',
        display: 'inline-block'
    };
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
    },
    color: {
        type: String,
        default: 'currentColor'
    }
});
</script>