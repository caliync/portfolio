<script setup lang="ts">
// "How this site is built": what it's made of, what is checked, and what I'd still change.
// The address is how-its-built.html, like the project pages, so it works on GitHub Pages as a file.
import { site } from '~/utils/content'

definePageMeta({ path: '/how-its-built.html' })
useBrowserFeatures({ library: false })

const description = 'How this portfolio is built: Nuxt and TypeScript generating static HTML, what is tested on every push, the real numbers, and what I would still change.'
useSiteHead({
  path: 'how-its-built.html',
  title: `How this site is built · ${site.name}`,
  description,
  image: 'images/og/home.jpg',
  imageAlt: `${site.name}, web and mobile application developer`,
  kind: 'article',
  bg: 'flat',
  ld: {
    '@context': 'https://schema.org', '@type': 'TechArticle',
    headline: 'How this site is built', description,
    url: `${site.url}how-its-built.html`, image: `${site.url}images/og/home.jpg`,
    author: { '@id': `${site.url}#casey`, '@type': 'Person', name: site.fullName },
  },
})

const parts = [
  ['Framework', 'Nuxt 4 and Vue 3, written in TypeScript with strict type checking. The pages are generated to plain HTML at build time, so they show up in search and link previews without any JavaScript.'],
  ['Content', 'Projects, skills, experience and credentials are typed JSON files. The two case studies are Markdown. A mistyped heading or a blank that was never filled in stops the build.'],
  ['Behaviour', 'The theme switch, sideways scrolling, image viewer, cover reveals and live GitHub numbers are small TypeScript modules. Each one undoes what it set up when the page goes away.'],
  ['Background', 'A 3D library drawn with three.js r128. Every texture is drawn in code, so there are no image files. It is fetched only for visitors who will see it move: reduced motion, data saver or no WebGL get a still picture instead.'],
  ['Styling', 'One hand-written stylesheet with tokens for spacing, type, colour and motion, in light and dark mode. No CSS framework.'],
  ['Fonts and icons', 'Karla and Young Serif are served from this site, and the brand icons come from one cached SVG file.'],
  ['Hosting', 'GitHub Pages. A GitHub Action checks and tests every push, and deploys the pushes to the main branch.'],
]

const checks = [
  ['Type check', 'Strict TypeScript over the pages, components and browser modules.'],
  ['Unit and component tests (Vitest)', 'The Markdown reader and the errors it must give, unfilled-blank handling, the GitHub numbers, the image viewer, cover reveal, copy guard and theme switch.'],
  ['Browser tests (Playwright)', 'Every page on a phone, a tablet and a desktop width; automated accessibility checks (axe) in light and dark mode; broken links and files; link previews; the fallbacks for reduced motion and for no WebGL.'],
  ['Lighthouse', 'On a throttled phone profile. The build fails if performance drops under 75, or accessibility, best practices or SEO under 95.'],
]

const numbers = [
  ['85 KB', 'of JavaScript a page downloads, gzipped. Most of it is Vue and Nuxt.'],
  ['0', 'requests to other websites before the first paint. The fonts come from this site.'],
  ['2.5 s', 'to first paint on a throttled phone profile, measured with Lighthouse in November 2026. It was 3.4 s while the fonts came from Google.'],
  ['81', 'Lighthouse performance score (out of 100) on a project page. Accessibility, best practices and SEO all scored 100 in the same run.'],
]

const decisions = [
  ['Static HTML, not a server', 'Nothing on this site changes between visits, so there is nothing to run on a server. GitHub Pages serves finished pages for free.'],
  ['A small Markdown reader, not Nuxt Content', 'Nuxt Content puts a database in the browser, which is far more than two case studies need. About 80 lines turn each Markdown file into the same data the pages already use, and fail with the file name when something is wrong.'],
  ['Fonts from this site', 'Loading them from Google added a round trip before any text could appear. Hosting two small font files cut the first paint from 3.4 s to 2.5 s.'],
  ['Page transitions in CSS', 'The fade between pages is eight lines of CSS (view transitions). It adds no JavaScript, and it does nothing with reduced motion or in a browser that does not support it.'],
  ['A fallback for the 3D library', 'The first version of the library crashed in a browser without WebGL and left an empty canvas. It now falls back to the still picture, and a test keeps it that way.'],
]

const again = [
  'Every page downloads Vue, even though the page behaviour is plain TypeScript. If the site stays this small, I would look at shipping less of it.',
  'The screenshots on the project pages are bigger than a phone needs, about 300 KB over a whole page according to Lighthouse. They are below the fold, so the first paint is not affected, but smaller versions would be kinder to mobile data.',
  'Lighthouse cannot measure the 3D scene. The build machine has no graphics card, so the home page is measured with the still picture. I have not measured the 3D scene on a real phone yet.',
]
</script>

<template>
  <a class="skip" href="#main">Skip to content</a>
  <div class="bg-still" aria-hidden="true" />

  <header class="bar">
    <div class="bar-in">
      <a class="mark" href="index.html" :aria-label="`${site.name}, home`"><img :src="asset('', 'logo.svg')" alt="CY" width="44" height="44"></a>
      <nav aria-label="Page"><a href="index.html"><Ico name="back" /> Back to portfolio</a><a :href="`https://github.com/${site.siteRepo}`">View the code <Ico name="out" /></a></nav>
      <ThemeButton />
    </div>
  </header>

  <main id="main" class="col">
    <header class="box box-head">
      <p class="kind">About this site</p>
      <h1 class="page-title">How this site is built</h1>
      <p class="lede">A short tour of what this portfolio is made of, what gets checked on every push, the real numbers, and what I would still change. The code is public.</p>
      <GhStats :repos="[{ repo: site.siteRepo, label: 'This site\'s code' }]" />
    </header>

    <section class="box" aria-labelledby="parts-h">
      <h2 id="parts-h">What it's made of</h2>
      <dl class="rows"><div v-for="[k, v] in parts" :key="k"><dt>{{ k }}</dt><dd>{{ v }}</dd></div></dl>
    </section>

    <section class="box" aria-labelledby="checks-h">
      <h2 id="checks-h">What is checked on every push</h2>
      <dl class="rows"><div v-for="[k, v] in checks" :key="k"><dt>{{ k }}</dt><dd>{{ v }}</dd></div></dl>
    </section>

    <section class="box" aria-labelledby="nums-h">
      <h2 id="nums-h">In numbers</h2>
      <ul class="numbers"><li v-for="[n, t] in numbers" :key="n"><strong>{{ n }}</strong><span>{{ t }}</span></li></ul>
    </section>

    <section class="box" aria-labelledby="dec-h">
      <h2 id="dec-h">Decisions</h2>
      <ol class="decisions"><li v-for="[t, x] in decisions" :key="t"><h3>{{ t }}</h3><p>{{ x }}</p></li></ol>
    </section>

    <section class="box" aria-labelledby="again-h">
      <h2 id="again-h">What I'd change</h2>
      <ul class="list"><li v-for="t in again" :key="t">{{ t }}</li></ul>
    </section>

    <nav class="box box-end" aria-label="More">
      <p class="btns"><a class="btn btn-solid" href="index.html">Back to portfolio</a><a class="btn" :href="`https://github.com/${site.siteRepo}`">View the code</a></p>
    </nav>
  </main>
  <SiteFoot />
</template>
