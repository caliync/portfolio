<script setup lang="ts">
// A "How I built it" page. The address stays projects/<slug>.html, as before the port.
import { caseStudies, projects, site } from '~/utils/content'

definePageMeta({
  path: '/projects/:slug.html',
  validate: (route) => projects.some((p) => p.slug === route.params.slug),
})

const slug = useRoute().params.slug as string
const i = projects.findIndex((p) => p.slug === slug)
const p = projects[i]!
const next = projects[(i + 1) % projects.length]!
const team = p.slug === 'baylo' // the capstone was a team of four; Casey built the web side

useSiteHead({
  path: `projects/${p.slug}.html`,
  title: `${p.name} · ${site.name}`,
  description: p.og,
  image: `images/og/${p.slug}.jpg`,
  imageAlt: `${p.name}: ${p.og}`,
  kind: 'article',
  bg: 'flat',
  ld: {
    '@context': 'https://schema.org', '@type': 'CreativeWork',
    name: p.name, description: p.summary,
    url: `${site.url}projects/${p.slug}.html`, image: `${site.url}images/og/${p.slug}.jpg`,
    keywords: p.stack.join(', '),
    [team ? 'contributor' : 'creator']: { '@id': `${site.url}#casey`, '@type': 'Person', name: site.fullName },
  },
})
</script>

<template>
  <a class="skip" href="#main">Skip to content</a>
  <div class="bg-still" aria-hidden="true" />

  <header class="bar">
    <div class="bar-in">
      <a class="mark" href="../index.html" :aria-label="`${site.name}, home`"><img :src="asset('../', 'logo.svg')" alt="CY" width="44" height="44"></a>
      <nav aria-label="Project"><a href="../index.html#projects"><Ico name="back" /> Back to projects</a><a v-for="l in p.links" :key="l.href" :href="l.href">{{ l.text }} <Ico name="out" /></a></nav>
      <ThemeButton />
    </div>
  </header>

  <main id="main" class="col">
    <header class="box box-head">
      <p class="kind">{{ p.kind }}</p>
      <h1 class="page-title">{{ p.name }}</h1>
      <p class="lede">{{ p.summary }}</p>
      <ScoreLine :score="p.score" />
      <TagList :names="p.stack" />
      <GhStats :repos="p.repos" />
    </header>

    <section class="box" aria-labelledby="design-h">
      <h2 id="design-h">The design</h2>
      <div class="shots">
        <figure v-for="s in p.shots" :key="s.src" class="shot"><img :src="`../${s.src}`" :alt="s.alt" :width="s.width" :height="s.height" loading="lazy" decoding="async" onerror="this.closest('figure').hidden=true"><figcaption>{{ s.caption }}</figcaption></figure>
      </div>
    </section>

    <section class="box" aria-labelledby="mission-h">
      <h2 id="mission-h">The mission</h2>
      <div class="prose"><p v-for="(t, j) in p.mission" :key="j">{{ t }}</p></div>
    </section>

    <section class="box" aria-labelledby="roles-h">
      <h2 id="roles-h">What I did</h2>
      <ul class="list roles"><li v-for="r in p.roles" :key="r.title"><strong>{{ r.title }}:</strong> {{ r.text }}</li></ul>
    </section>

    <CaseStudy :c="caseStudies[p.slug]" :arch="p.arch" />

    <nav class="box box-end" aria-label="More">
      <p v-if="p.links.length" class="btns"><a v-for="(l, j) in p.links" :key="l.href" :class="j === 0 ? 'btn btn-solid' : 'btn'" :href="l.href">{{ l.text }}</a></p>
      <p class="next">Next project: <a :href="`${next.slug}.html`">{{ next.name }}</a></p>
    </nav>
  </main>
  <SiteFoot />
</template>
