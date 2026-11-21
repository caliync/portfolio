// The phone menu: a burger button beside the theme switch opens the section links as a list.
// It closes after you pick a section, on Escape, and when you tap outside it.
import { Listeners, type Cleanup } from './dom'

export function startMenu(): Cleanup {
  const bar = document.querySelector<HTMLElement>('.bar')
  const btn = bar?.querySelector<HTMLButtonElement>('.burger')
  const nav = bar?.querySelector<HTMLElement>('nav')
  if (!bar || !btn || !nav) return () => {}
  const L = new Listeners()

  function set(open: boolean, refocus = false) {
    bar!.classList.toggle('menu-open', open)
    btn!.setAttribute('aria-expanded', String(open))
    btn!.setAttribute('aria-label', open ? 'Close menu' : 'Open menu')
    if (!open && refocus) btn!.focus()
  }

  L.on(btn, 'click', () => set(btn.getAttribute('aria-expanded') !== 'true'))
  L.on(nav, 'click', (e) => { if ((e.target as Element).closest('a')) set(false) })
  L.on(document, 'keydown', (e) => { if (e.key === 'Escape' && bar.classList.contains('menu-open')) set(false, true) })
  L.on(document, 'click', (e) => { if (!bar.contains(e.target as Node)) set(false) })
  // Leaving the phone layout (turning the phone, resizing) puts the bar back to normal.
  L.on(window, 'resize', () => { if (!document.documentElement.classList.contains('hs-swipe')) set(false) })
  return () => L.clear()
}
