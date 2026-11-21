<script setup lang="ts">
// A project on the home page. The cover is a button: lib/coverReveal.ts swaps it for the real screenshots
// listed in data-shots, with previous/next controls.
import type { Project } from '~/utils/content'

const props = defineProps<{ p: Project }>()
const shots = computed(() => JSON.stringify(props.p.shots.map((s) => ({ src: s.src, alt: s.alt }))))
const page = computed(() => `projects/${props.p.slug}.html`)
</script>

<template>
  <article class="card">
    <div class="card-img art-box" :data-shots="shots">
      <button type="button" class="art-scene" :aria-label="`See the real screens of ${p.name}`">
        <img class="art-svg art-cover" :src="`images/covers/${p.slug}.webp`" :alt="`${p.name} cover`" width="991" height="1300" decoding="async">
        <span class="art-hint"><svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" /><circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" stroke-width="2" /></svg><span>See the real screens</span></span>
      </button>
      <div class="art-real" inert>
        <img class="art-img" alt="" decoding="async">
        <div class="art-bar">
          <button type="button" class="art-prev" aria-label="Previous screen">&#8249;</button>
          <span class="art-count" aria-live="polite">1 / {{ p.shots.length }}</span>
          <button type="button" class="art-next" aria-label="Next screen">&#8250;</button>
          <button type="button" class="art-back">Back to cover</button>
        </div>
      </div>
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
