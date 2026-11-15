<script setup lang="ts">
import type { Project } from '~/utils/content'

defineProps<{ score: Project['score'] }>()
</script>

<template>
  <p v-if="score" class="score"><span class="score-n">{{ score.value }}<span class="score-of">{{ score.of }}</span></span><span class="score-t">{{ score.text }}</span></p>
</template>
