<script setup lang="ts">
import { skills } from '~/utils/content'

withDefaults(defineProps<{ names: string[]; cls?: string }>(), { cls: 'tags' })
</script>

<template>
  <ul :class="cls">
    <li v-for="n in names" :key="n" class="tag"><Ico v-if="skills.tech[n]" :name="skills.tech[n]!" /><span>{{ n }}</span></li>
  </ul>
</template>
