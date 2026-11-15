<script setup lang="ts">
import { site } from '~/utils/content'

const items = [
  { icon: 'outlook', href: `mailto:${site.email}`, label: `Email ${site.email}` },
  { icon: 'linkedin', href: site.linkedin, label: 'LinkedIn' },
  { icon: 'github', href: site.github, label: 'GitHub' },
]
</script>

<template>
  <ul class="reach-icons">
    <li v-for="i in items" :key="i.icon"><a :href="i.href" :aria-label="i.label" :title="i.label"><Ico :name="i.icon" /></a></li>
  </ul>
</template>
