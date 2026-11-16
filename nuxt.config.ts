// The site is generated to static HTML (`npm run generate`) and served by GitHub Pages
// at https://caliync.github.io/portfolio/, so every page lives under /portfolio/.
import projects from './data/projects.json'

export default defineNuxtConfig({
  compatibilityDate: '2026-11-01',
  devtools: { enabled: false },
  app: {
    baseURL: '/portfolio/',
    head: {
      htmlAttrs: { lang: 'en' },
      charset: 'utf-8',
      viewport: 'width=device-width, initial-scale=1',
    },
  },
  nitro: {
    prerender: {
      // Project pages keep their old addresses, projects/<slug>.html, so existing links still work.
      routes: ['/', '/how-its-built.html', ...projects.map((p) => `/projects/${p.slug}.html`)],
      crawlLinks: false,
      failOnError: true,
    },
  },
  // The pages are finished HTML, and the behaviour is plain TypeScript (app/lib/entry.ts), so the
  // browser doesn't need Vue or Nuxt: this leaves their scripts out of the pages.
  features: { noScripts: 'production' },
  experimental: {
    // All content is bundled at build time; there is no per-page data to fetch.
    payloadExtraction: false,
  },
  typescript: { strict: true },
})
