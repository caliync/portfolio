import versions from '~/generated.json'
import { site } from '~/utils/content'

const THREE_URL = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js'
const THREE_SRI = 'sha384-CI3ELBVUz9XQO+97x6nwMDPosPR5XvsxW2ua7N1Xeygeh1IxtgqtCkGfQY9WWdHu' // same bytes as npm three@0.128.0

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

/** Title, search and link-preview tags, the theme and font setup, and the browser scripts. */
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
      { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
      { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
      { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Young+Serif&family=Karla:ital,wght@0,400..700;1,400&display=swap' },
      { rel: 'stylesheet', href: asset(rel, 'site.css') },
    ],
    script: [
      { type: 'application/ld+json', innerHTML: ld },
      // Apply a saved light/dark choice before the first paint.
      { innerHTML: "try{var t=localStorage.getItem('theme');if(t)document.documentElement.dataset.theme=t}catch(e){}" },
    ],
  })

  // The browser scripts run once Vue has taken over the page, so their changes to the page
  // (theme label, sideways scroll, refreshed GitHub numbers) never fight hydration.
  onMounted(() => {
    const add = (src: string, data: Record<string, string> = {}) => {
      const s = document.createElement('script')
      s.src = src
      s.async = false // keep the order: site.js first
      Object.assign(s.dataset, data)
      document.body.appendChild(s)
    }
    add(asset(rel, 'site.js'))
    // The home page draws the 3D library; library.js fetches three.js itself, and falls back to the
    // still picture for reduced motion or when WebGL is missing. Other pages only show the still picture.
    if (p.bg === 'intro') add(asset(rel, 'library.js'), { three: THREE_URL, threeSri: THREE_SRI })
  })
}
