// Copy protection: no selecting, copying, right-clicking or dragging on the page.
// Contact details stay copyable so recruiters can take your email and links.
import { Listeners, type Cleanup } from './dom'

export function startCopyGuard(): Cleanup {
  const L = new Listeners()
  const allowed = (el: Element | null | undefined) => !!el?.closest?.('.copy-ok, input, textarea')

  for (const type of ['copy', 'cut'] as const) {
    L.on(document, type, (e) => {
      const node = window.getSelection()?.anchorNode
      const el = node?.nodeType === 1 ? (node as Element) : node?.parentElement
      if (!allowed(el)) e.preventDefault()
    })
  }
  L.on(document, 'contextmenu', (e) => { if (!allowed(e.target as Element)) e.preventDefault() })
  L.on(document, 'dragstart', (e) => {
    const tag = (e.target as Element).tagName
    if (tag === 'IMG' || tag === 'A') e.preventDefault()
  })
  return () => L.clear()
}
