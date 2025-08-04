<script lang="ts" setup>
import { computed, useSlots, ref, onMounted, onUnmounted } from 'vue';
import { SpritesheetFont, type FontData } from '~~/types/SpritesheetFont';
import sketchFontData from '@/assets/fonts/sketch.json';


interface Props {
    text?: string;
    scale?: number;
    spacing?: number;
    size?: string; 
}

const props = withDefaults(defineProps<Props>(), {
    text: '',
    scale: 1,
    spacing: 0,
    size: '16px'
});

// Create font
const font = new SpritesheetFont(sketchFontData as FontData);

const slots = useSlots();

const getCharacterStyle = (char: string, nextChar: string | undefined) => {
    return font.getCharacterStyle(char, props.scale, props.spacing, props.size, nextChar);
};

const getSpaceStyle = () => {
    return font.getSpaceStyle(props.scale, props.spacing, props.size);
};

// Extract text from slots or props
const displayText = computed(() => {
    if (props.text) {
        return props.text;
    }
    
    // Extract text from default slot, and replace br vnodes with newlines
    const defaultSlot = slots.default?.();
    if (defaultSlot && defaultSlot.length > 0) {
        return defaultSlot
            .map(vnode => {
                // Handle text nodes
                if (typeof vnode.children === 'string') {
                    return vnode.children;
                }
                // Handle <br> tags
                if (vnode.type === 'br') {
                    return '\n';
                }
                // Handle other elements that might contain text
                if (vnode.children && Array.isArray(vnode.children)) {
                    return vnode.children
                        .map(child => {
                            if (typeof child === 'string') {
                                return child;
                            }
                            if (typeof child === 'object' && child !== null && 'type' in child && child.type === 'br') {
                                return '\n';
                            }
                            return '';
                        })
                        .join('');
                }
                return '';
            })
            .join('');
    }
    
    return '';
});

// Split text into lines and words for rendering
const textLines = computed(() => {
    const text = displayText.value;
    return text.split('\n').map(line => {
        // Split line into words, preserving spaces as separate elements
        const words = line.split(/(\s+)/);
        return words.map(word => ({
            isSpace: /^\s+$/.test(word),
            content: word.split(''),
            originalWord: word
        }));
    });
});

// Get the computed text alignment from the element
const textAlign = ref('left');

const updateTextAlign = (el: HTMLElement) => {
    const computedStyle = window.getComputedStyle(el);
    textAlign.value = computedStyle.textAlign || 'left';
};

// Use template ref to access the root element
const sketchTextRef = ref<HTMLElement>();

onMounted(() => {
    if (sketchTextRef.value) {
        updateTextAlign(sketchTextRef.value);
        
        // Watch for style changes
        const observer = new MutationObserver(() => {
            if (sketchTextRef.value) {
                updateTextAlign(sketchTextRef.value);
            }
        });
        
        observer.observe(sketchTextRef.value, {
            attributes: true,
            attributeFilter: ['style', 'class']
        });
        
        onUnmounted(() => {
            observer.disconnect();
        });
    }
});

const getJustifyContent = computed(() => {
    switch (textAlign.value) {
        case 'center':
            return 'center';
        case 'right':
            return 'flex-end';
        case 'left':
        default:
            return 'flex-start';
    }
});

</script>

<template>
    <div ref="sketchTextRef" class="sketch-text">
        <div 
            v-for="(line, lineIndex) in textLines" 
            :key="`line-${lineIndex}`"
            class="sketch-text-line"
            :style="{ justifyContent: getJustifyContent }"
        >
            <div
                v-for="(word, wordIndex) in line"
                :key="`word-${lineIndex}-${wordIndex}`"
                class="sketch-word"
                :class="{ 'sketch-space': word.isSpace }"
            >
                <template v-for="(char, charIndex) in word.content" :key="`char-${lineIndex}-${wordIndex}-${charIndex}`">
                    <span 
                        v-if="char === ' '"
                        :style="getSpaceStyle()"
                        class="sketch-space-char"
                    ></span>
                    <span 
                        v-else
                        :style="getCharacterStyle(char, word.content[charIndex + 1])"
                        class="sketch-char"
                    ></span>
                </template>
            </div>
        </div>
    </div>
</template>

<style scoped>
.sketch-text {
    font-family: monospace;
    image-rendering: pixelated;
    image-rendering: -moz-crisp-edges;
    image-rendering: crisp-edges;
    line-height: normal;
}

.sketch-text-line {
    display: flex;
    width: 100%;
    flex-wrap: wrap;
    align-items: baseline;
}

.sketch-word {
    display: flex;
    align-items: baseline;
    flex-shrink: 0;
}

.sketch-word.sketch-space {
    flex-shrink: 1;
}

.sketch-char {
    image-rendering: pixelated;
    image-rendering: -moz-crisp-edges;
    image-rendering: crisp-edges;
    flex-shrink: 0;
    align-self: baseline;
}

.sketch-space-char {
    flex-shrink: 0;
    align-self: baseline;
}
</style>