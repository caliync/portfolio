<script setup lang="ts">
// One icon: either a hand-drawn one from data/site.json, or a brand icon from the shared sprite.
import { site } from '~/utils/content'

const props = defineProps<{ name: string }>()
const rel = useRel()

const custom = computed(() => {
  const svg = site.customIcons[props.name]
  if (!svg) return null
  const m = svg.match(/^<svg([^>]*)>([\s\S]*)<\/svg>$/)!
  const attrs: Record<string, string> = {}
  for (const [, k, v] of m[1]!.matchAll(/([\w:-]+)="([^"]*)"/g)) attrs[k!] = v!
  return { attrs, inner: m[2]! }
})
</script>

<template>
  <svg v-if="custom" v-bind="custom.attrs" v-html="custom.inner" />
  <svg v-else viewBox="0 0 24 24" aria-hidden="true" focusable="false"><use :href="`${spriteHref(rel)}#si-${name}`" /></svg>
</template>
