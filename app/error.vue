<script setup lang="ts">
// GitHub Pages serves this for any address that doesn't exist (it's written to 404.html).
import type { NuxtError } from '#app'
import { site } from '~/utils/content'

defineProps<{ error: NuxtError }>()
const home = useRuntimeConfig().app.baseURL

useHead({
  title: `Page not found · ${site.name}`,
  bodyAttrs: { 'data-bg': 'flat' },
  meta: [{ name: 'robots', content: 'noindex' }],
  link: [
    { rel: 'icon', type: 'image/svg+xml', href: `${home}assets/logo.svg` },
    { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Young+Serif&family=Karla:ital,wght@0,400..700;1,400&display=swap' },
    { rel: 'stylesheet', href: `${home}assets/site.css` },
  ],
  script: [{ innerHTML: "try{var t=localStorage.getItem('theme');if(t)document.documentElement.dataset.theme=t}catch(e){}" }],
})
</script>

<template>
  <div class="bg-still" aria-hidden="true" />
  <main id="main" class="col">
    <header class="box box-head">
      <p class="kind">Error {{ error.statusCode }}</p>
      <h1 class="page-title">This page isn't on the shelf</h1>
      <p class="lede">The address may be old or mistyped.</p>
      <p class="btns"><a class="btn btn-solid" :href="home">Go to the portfolio</a><a class="btn" :href="`${home}index.html#projects`">See my projects</a></p>
    </header>
  </main>
</template>
