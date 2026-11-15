// Theme switch: follows the system until you pick one, then remembers it.
import { Listeners, type Cleanup } from './dom'

export function startTheme(): Cleanup {
  const root = document.documentElement
  const buttons = document.querySelectorAll<HTMLElement>('[data-theme-toggle]')
  const L = new Listeners()

  const current = () => root.dataset.theme ?? (window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark')
  const label = () => {
    const next = current() === 'dark' ? 'light' : 'dark'
    buttons.forEach((b) => b.setAttribute('aria-label', `Switch to ${next} mode`))
  }

  buttons.forEach((b) => L.on(b, 'click', () => {
    const next = current() === 'dark' ? 'light' : 'dark'
    root.dataset.theme = next
    try { localStorage.setItem('theme', next) } catch { /* private mode: the choice just isn't remembered */ }
    label()
    window.dispatchEvent(new Event('themechange'))
  }))
  label()
  return () => L.clear()
}
