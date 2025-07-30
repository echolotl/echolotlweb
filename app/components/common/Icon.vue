<template>
    <div 
        v-if="props.icon"
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
    const style: Record<string, string> = {
        width,
        height,
        display: 'inline-block'
    };
    if (props.disableMask) {
        style.backgroundImage = `url(/images/icons/${props.icon}.webp)`;
        style.backgroundSize = 'contain';
        style.backgroundRepeat = 'no-repeat';
        style.backgroundPosition = 'center';
    } else {
        style.maskImage = `url(/images/icons/${props.icon}.webp)`;
        style.WebkitMaskImage = `url(/images/icons/${props.icon}.webp)`;
        style.maskSize = 'contain';
        style.WebkitMaskSize = 'contain';
        style.maskRepeat = 'no-repeat';
        style.WebkitMaskRepeat = 'no-repeat';
        style.maskPosition = 'center';
        style.WebkitMaskPosition = 'center';
        style.backgroundColor = props.color;
    }
    return style;
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
    },
    disableMask: {
        type: Boolean,
        default: false
    }
});
</script>