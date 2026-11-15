// Project covers: each card shows artwork; clicking it reveals the real screens, with
// previous and next buttons and a way back. Clicking a real screen zooms it (see imageViewer).
import { Listeners, type Cleanup } from './dom'

interface Shot { src: string; alt: string }

export function startCoverReveal(): Cleanup {
  const L = new Listeners()

  document.querySelectorAll<HTMLElement>('.art-box').forEach((box) => {
    let shots: Shot[]
    try { shots = JSON.parse(box.dataset.shots || '[]') } catch { shots = [] }
    if (!shots.length) return

    const scene = box.querySelector<HTMLElement>('.art-scene')!
    const real = box.querySelector<HTMLElement>('.art-real')!
    const img = box.querySelector<HTMLImageElement>('.art-img')!
    const count = box.querySelector<HTMLElement>('.art-count')!
    const back = box.querySelector<HTMLElement>('.art-back')!
    let i = 0

    const show = (n: number) => {
      i = (n + shots.length) % shots.length
      const s = shots[i]!
      img.src = s.src
      img.alt = s.alt
      count.textContent = `${i + 1} / ${shots.length}`
    }
    const setReal = (on: boolean) => {
      box.classList.toggle('is-real', on)
      if (on) { scene.setAttribute('inert', ''); real.removeAttribute('inert') }
      else { real.setAttribute('inert', ''); scene.removeAttribute('inert') }
    }

    L.on(scene, 'click', () => { show(i); setReal(true); back.focus({ preventScroll: true }) })
    L.on(back, 'click', () => { setReal(false); scene.focus({ preventScroll: true }) })
    L.on(box.querySelector<HTMLElement>('.art-prev')!, 'click', () => show(i - 1))
    L.on(box.querySelector<HTMLElement>('.art-next')!, 'click', () => show(i + 1))
    L.on(box, 'keydown', (e) => {
      if (!box.classList.contains('is-real')) return
      if (e.key === 'ArrowRight') { e.stopPropagation(); show(i + 1) }
      else if (e.key === 'ArrowLeft') { e.stopPropagation(); show(i - 1) }
      else if (e.key === 'Escape') { setReal(false); scene.focus({ preventScroll: true }) }
    })
  })
  return () => L.clear()
}
