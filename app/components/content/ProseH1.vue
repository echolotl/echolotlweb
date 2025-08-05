<template>
  <h1 :id="props.id">
    <a
      v-if="generate"
      :href="`#${props.id}`"
    >
      <SketchText :text="extractText(slots.default?.()[0])" size="2.5rem"></SketchText>
    </a>
    <SketchText v-else :text="extractText(slots.default?.()[0])" size="2.5rem"></SketchText>
  </h1>
</template>

<script setup lang="ts">
import { computed, useRuntimeConfig } from '#imports'
import { useSlots } from '#imports';
import SketchText from '@/components/common/SketchText.vue'

const props = defineProps<{ id?: string }>()
const slots = useSlots()

const { headings } = useRuntimeConfig().public.mdc
const generate = computed(() => props.id && ((typeof headings?.anchorLinks === 'boolean' && headings?.anchorLinks === true) || (typeof headings?.anchorLinks === 'object' && headings?.anchorLinks?.h1)))

function extractText(vnode: any): string | undefined {
  if (!vnode) return undefined
  if (typeof vnode.children === 'string') return vnode.children
  if (Array.isArray(vnode.children)) {
    return vnode.children.map((child: any) => typeof child === 'string' ? child : '').join('')
  }
  return undefined
}
</script>