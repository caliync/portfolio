// Mark the section you're reading in the top bar (when the sideways scroll isn't doing it).
import { navLinks, shelf, type Cleanup } from './dom'

export function startNavHighlight(): Cleanup {
  const links = navLinks()
  if (!Object.keys(links).length || !('IntersectionObserver' in window)) return () => {}
  const io = new IntersectionObserver((entries) => {
    for (const en of entries) {
      const a = links[en.target.id]
      if (a && en.isIntersecting && !shelf.active) {
        Object.values(links).forEach((l) => l.removeAttribute('aria-current'))
        a.setAttribute('aria-current', 'true')
      }
    }
  }, { rootMargin: '-40% 0px -55% 0px' })
  Object.keys(links).forEach((id) => { const s = document.getElementById(id); if (s) io.observe(s) })
  return () => io.disconnect()
}
