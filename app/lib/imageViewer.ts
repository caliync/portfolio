// Image viewer: clicking a photo, screenshot or certificate opens it larger on this page.
import { Listeners, type Cleanup } from './dom'

const SELECTOR = '.job-photo img, .cert-img img, .shot img, .art-img'

export function startImageViewer(): Cleanup {
  if (!document.querySelector(SELECTOR)) return () => {}
  const L = new Listeners()

  const box = document.createElement('div')
  box.className = 'viewer'
  box.hidden = true
  box.setAttribute('role', 'dialog')
  box.setAttribute('aria-modal', 'true')
  box.setAttribute('aria-label', 'Image viewer')
  box.innerHTML = '<button type="button" class="viewer-close" aria-label="Close image">&times;</button>'
    + '<figure class="viewer-fig"><img alt=""><figcaption></figcaption></figure>'
  document.body.appendChild(box)
  const img = box.querySelector('img')!
  const cap = box.querySelector('figcaption')!
  const btn = box.querySelector<HTMLButtonElement>('.viewer-close')!
  let last: HTMLElement | null = null

  function open(src: HTMLImageElement) {
    last = document.activeElement as HTMLElement | null
    img.src = src.currentSrc || src.src
    img.alt = src.alt || ''
    cap.textContent = src.closest('figure')?.querySelector('figcaption')?.textContent ?? ''
    cap.hidden = !cap.textContent
    box.hidden = false
    document.documentElement.classList.add('viewer-open')
    requestAnimationFrame(() => box.classList.add('is-on'))
    btn.focus()
  }
  function close() {
    box.classList.remove('is-on')
    document.documentElement.classList.remove('viewer-open')
    box.hidden = true
    img.removeAttribute('src')
    last?.focus?.()
  }

  document.querySelectorAll<HTMLImageElement>(SELECTOR).forEach((el) => {
    const a = el.closest('a')
    const target: HTMLElement = a ?? el
    if (!a) { el.tabIndex = 0; el.setAttribute('role', 'button') }
    target.setAttribute('aria-label', `View larger: ${el.alt || 'image'}`)
    L.on(target, 'click', (e) => { e.preventDefault(); open(el) })
    if (!a) L.on(el, 'keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(el) }
    })
  })
  L.on(btn, 'click', close)
  L.on(box, 'click', (e) => { if (e.target === box) close() })
  L.on(document, 'keydown', (e) => { if (!box.hidden && e.key === 'Escape') close() })

  return () => { L.clear(); box.remove(); document.documentElement.classList.remove('viewer-open') }
}
