<script setup lang="ts">
// A project on the home page: its cover, then the text, tags and links. The real screenshots are on the
// project's own page.
import type { Project } from '~/utils/content'

const props = defineProps<{ p: Project }>()
const page = computed(() => `projects/${props.p.slug}.html`)
</script>

<template>
  <article class="card">
    <div class="card-img art-box">
      <img class="art-cover" :src="`images/covers/${p.slug}.webp`" :alt="`${p.name} cover`" width="991" height="1300" decoding="async">
    </div>
    <div class="card-body">
      <p class="kind">{{ p.kind }}</p>
      <h3><a :href="page">{{ p.name }}</a></h3>
      <p>{{ p.summary }}</p>
      <p v-if="p.detail">{{ p.detail }}</p>
      <ScoreLine :score="p.score" />
      <TagList :names="p.stack" cls="tags tags-sm" />
      <GhStats :repos="p.repos" />
      <p class="card-links"><a v-for="l in p.links" :key="l.href" :href="l.href">{{ l.text }}</a><a :href="page">How I built it</a></p>
    </div>
  </article>
</template>
