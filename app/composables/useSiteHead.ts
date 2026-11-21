import versions from '~/generated.json'
import { site } from '~/utils/content'

/** "" on the home page, "../" on project pages: links stay relative, as they were before the port. */
export function useRel(): string {
  return useRoute().path.startsWith('/projects/') ? '../' : ''
}

export function asset(rel: string, name: keyof typeof versions): string {
  return `${rel}assets/${name}?v=${versions[name]}`
}

export function spriteHref(rel: string): string {
  return `${rel}assets/icons.svg?v=${versions.icons}`
}

interface PageHead {
  path: string // '' for the home page, or 'projects/baylo.html'
  title: string
  description: string
  image: string
  imageAlt: string
  kind: 'website' | 'article'
  ld: object
  bg: 'intro' | 'flat'
}

/** Title, search and link-preview tags, and the theme and font setup. */
export function useSiteHead(p: PageHead) {
  const rel = useRel()
  const url = site.url + p.path
  const img = site.url + p.image
  // "</" can't appear inside a script tag, so escape it in the JSON.
  const ld = JSON.stringify(p.ld).replace(/<\//g, '<\\/')

  useHead({
    title: p.title,
    bodyAttrs: { 'data-bg': p.bg },
    meta: [
      { name: 'description', content: p.description },
      { property: 'og:type', content: p.kind },
      { property: 'og:site_name', content: site.name },
      { property: 'og:url', content: url },
      { property: 'og:title', content: p.title },
      { property: 'og:description', content: p.description },
      { property: 'og:image', content: img },
      { property: 'og:image:type', content: 'image/jpeg' },
      { property: 'og:image:width', content: '1200' },
      { property: 'og:image:height', content: '630' },
      { property: 'og:image:alt', content: p.imageAlt },
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:title', content: p.title },
      { name: 'twitter:description', content: p.description },
      { name: 'twitter:image', content: img },
      { name: 'theme-color', content: '#160A0C', media: '(prefers-color-scheme: dark)', key: 'theme-dark' },
      { name: 'theme-color', content: '#F1EBE3', media: '(prefers-color-scheme: light)', key: 'theme-light' },
    ],
    link: [
      { rel: 'canonical', href: url },
      { rel: 'icon', type: 'image/svg+xml', href: asset(rel, 'logo.svg') },
      // The three fonts every page starts with, fetched alongside the stylesheet instead of after it.
      { rel: 'preload', as: 'font', type: 'font/woff2', href: `${rel}assets/fonts/karla-normal-latin.woff2`, crossorigin: '' },
      { rel: 'preload', as: 'font', type: 'font/woff2', href: `${rel}assets/fonts/young-serif-normal-latin.woff2`, crossorigin: '' },
      { rel: 'preload', as: 'font', type: 'font/woff2', href: `${rel}assets/fonts/karla-italic-latin.woff2`, crossorigin: '' },
      { rel: 'stylesheet', href: asset(rel, 'site.css') },
    ],
    script: [
      { type: 'application/ld+json', innerHTML: ld },
      // The page behaviour (scrolling, theme, viewer, 3D library). A module script is deferred, so it
      // runs after the page is parsed, and it never blocks the first paint.
      { src: asset(rel, 'js/site.js'), type: 'module', tagPosition: 'bodyClose' },
      // Apply a saved light/dark choice before the first paint.
      { innerHTML: "try{var t=localStorage.getItem('theme');if(t)document.documentElement.dataset.theme=t}catch(e){}" },
    ],
  })
}
