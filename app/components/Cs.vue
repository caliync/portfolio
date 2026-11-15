<script setup lang="ts">
// Case-study text. An unfilled ?{blank} shows as a highlighted note; scripts/prebuild.mjs
// stops a real build that still has one, so they only ever appear in local previews.
const props = defineProps<{ text: string }>()
const parts = computed(() =>
  props.text.split(/(\?\{.*?\})/).filter(Boolean).map((s) => {
    const m = s.match(/^\?\{(.*)\}$/)
    return m ? { blank: true, text: m[1]! } : { blank: false, text: s }
  }),
)
</script>

<template>
  <template v-for="(s, i) in parts" :key="i"><mark v-if="s.blank" class="fill">{{ s.text }}</mark><template v-else>{{ s.text }}</template></template>
</template>
