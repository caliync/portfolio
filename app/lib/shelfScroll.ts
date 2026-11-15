// Sideways scrolling on the home page. On computers, scrolling down moves along the
// shelves; on phones, you swipe left and right between sections and scroll up and down
// inside one. Each section fades in as it reaches the middle of the screen.
import { Listeners, navLinks, shelf, type Cleanup } from './dom'

type Panel = HTMLElement & { _kids?: HTMLElement[]; _staged?: boolean }

// One signature curve for the whole site: cubic-bezier(0.4, 0, 0.2, 1), solved here for the glide.
function ease(t: number): number {
  const x1 = 0.4, y1 = 0, x2 = 0.2, y2 = 1
  let u = t
  for (let i = 0; i < 6; i++) {
    const cx = 3 * x1 * u * (1 - u) * (1 - u) + 3 * x2 * u * u * (1 - u) + u * u * u - t
    const dx = 3 * x1 * (1 - u) * (1 - u) + 6 * (x2 - x1) * u * (1 - u) + 3 * (1 - x2) * u * u
    if (Math.abs(cx) < 1e-5 || !dx) break
    u -= cx / dx
  }
  return 3 * y1 * u * (1 - u) * (1 - u) + 3 * y2 * u * u * (1 - u) + u * u * u
}

const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n))

export function startShelfScroll(): Cleanup {
  const hs = document.querySelector<HTMLElement>('.hs')
  if (!hs) return () => {}
  const L = new Listeners()
  const root = document.documentElement
  const track = hs.querySelector<HTMLElement>('.hs-track')!
  const sticky = hs.querySelector<HTMLElement>('.hs-sticky')!
  const panels = Array.from(track.querySelectorAll<Panel>('.panel'))
  const bar = hs.querySelector<HTMLElement>('.hs-progress span')
  const links = navLinks()
  const wide = window.matchMedia('(min-width: 900px) and (min-height: 560px)')
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)')
  const boxOf = (p: Panel) => p.firstElementChild as HTMLElement

  window.shelfScroll = shelf
  Object.assign(shelf, { active: false, mode: 'off', p: 0, span: 0 })
  let vw = window.innerWidth
  let current = -1, lastX = 0, dir = 1

  const base = () => hs.getBoundingClientRect().top + window.scrollY

  function setup() {
    const mode = reduce.matches ? 'off' : (wide.matches ? 'wide' : 'swipe')
    shelf.mode = mode
    shelf.active = mode !== 'off'
    shelf.span = (panels.length - 1) * (mode === 'swipe' ? 4.5 : 7)
    root.classList.toggle('hs-on', mode === 'wide')
    root.classList.toggle('hs-swipe', mode === 'swipe')
    vw = mode === 'swipe' ? track.clientWidth || window.innerWidth : window.innerWidth
    track.style.transform = ''
    hs!.style.height = mode === 'wide' ? `${(panels.length - 1) * vw + window.innerHeight}px` : ''
    if (mode === 'off') panels.forEach((p) => {
      const b = boxOf(p); b.style.opacity = ''; b.style.transform = ''; p.removeAttribute('inert')
    })
    matchSizes()
    update()
  }

  // Every Experience box and every Projects box takes the height of the tallest one in
  // its group (Baylo for Projects), so nothing gets cut off; About and the rest keep their own.
  function matchSizes() {
    for (const g of ['experience', 'projects', 'credentials']) {
      const boxes = panels.filter((p) => p.id.split('-')[0] === g).map(boxOf)
      boxes.forEach((b) => { b.style.height = '' })
      if (shelf.mode !== 'wide') continue
      const limit = window.innerHeight - 150
      const h = Math.min(limit, Math.max(...boxes.map((b) => b.offsetHeight)))
      boxes.forEach((b) => { b.style.height = `${h}px` })
    }
    for (const p of panels) {
      const b = boxOf(p)
      if (!b.classList.contains('panel-box')) continue
      const more = shelf.mode === 'wide' && b.scrollHeight > b.clientHeight + 2
      b.classList.toggle('has-more', more)
      if (more && !b.dataset.fade) {
        b.dataset.fade = '1'
        L.on(b, 'scroll', () => b.classList.toggle('at-end', b.scrollTop + b.clientHeight >= b.scrollHeight - 4), { passive: true })
      }
    }
  }

  const position = () => (shelf.mode === 'swipe'
    ? track.scrollLeft
    : Math.min((panels.length - 1) * vw, Math.max(0, window.scrollY - base())))

  function update() {
    if (!shelf.active) return
    // Following a link like #projects makes the browser scroll this frame sideways on
    // its own, which pushes every section off screen. Keep it at the start.
    if (sticky.scrollLeft || sticky.scrollTop) { sticky.scrollLeft = 0; sticky.scrollTop = 0 }
    const max = (panels.length - 1) * vw
    const x = position()
    shelf.p = max ? clamp(x / max, 0, 1) : 0
    if (shelf.mode === 'wide') track.style.transform = `translate3d(${(-x).toFixed(1)}px,0,0)`
    if (bar) bar.style.transform = `scaleX(${shelf.p.toFixed(4)})`
    const swipe = shelf.mode === 'swipe'
    if (x !== lastX) { dir = x > lastX ? 1 : -1; lastX = x }

    panels.forEach((p, i) => {
      const d = (i * vw - x) / vw, a = Math.abs(d), b = boxOf(p)
      // A section that is arriving fades in gently; one that is leaving goes about 40% faster.
      const arriving = dir > 0 ? d > 0 : d < 0
      const k = arriving ? (swipe ? 1.5 : 1.7) : (swipe ? 2.2 : 2.6)
      const o = clamp(1 - (a - 0.08) * k, 0, 1)
      // The heading leads; the rest of the box follows a beat later (about 80 ms of scroll).
      const kids = p._kids ?? (p._kids = Array.from(b.children) as HTMLElement[])
      if (a < 1.4) {
        kids.forEach((c, j) => {
          const oj = clamp(1 - (a - 0.08 + (arriving ? j * 0.06 : 0)) * k, 0, 1)
          if (oj > 0.995) { c.style.opacity = ''; c.style.transform = ''; return }   // fully in: let CSS (hover lift) take over
          c.style.opacity = oj.toFixed(3)
          c.style.transform = j ? `translate3d(0,${((1 - oj) * 14).toFixed(1)}px,0)` : ''
        })
        p._staged = true
      } else if (p._staged) {
        kids.forEach((c) => { c.style.opacity = ''; c.style.transform = '' })
        p._staged = false
      }
      b.style.opacity = o.toFixed(3)
      b.style.transform = swipe
        ? `translate3d(${(d * 12).toFixed(1)}vw,${(a * 18).toFixed(1)}px,0) scale(${(1 - Math.min(a, 1) * 0.04).toFixed(4)})`
        : `translate3d(${(d * 18).toFixed(1)}vw,${(a * 26).toFixed(1)}px,0) scale(${(1 - Math.min(a, 1) * 0.05).toFixed(4)})`
      p.toggleAttribute('inert', a > 0.6)
    })

    const idx = clamp(Math.round(x / vw), 0, panels.length - 1)
    if (idx !== current) {
      current = idx
      const key = (panels[idx]!.id || '').split('-')[0]!
      for (const [k, a] of Object.entries(links)) {
        if (k === key) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current')
      }
      const link = links[key]
      if (swipe && link) {
        const nav = link.parentElement!
        nav.scrollTo({ left: link.offsetLeft - nav.offsetLeft - (nav.clientWidth - link.offsetWidth) / 2, behavior: 'smooth' })
      }
    }
  }

  // On computers every move between sections is one eased glide.
  let anim: { target: number; raf: number } | null = null
  let lastWheel = 0, wheelSum = 0, gestureUsed = false, idleTimer = 0
  L.add(() => { if (anim) cancelAnimationFrame(anim.raf); clearTimeout(idleTimer); root.style.scrollBehavior = '' })

  function glide(top: number) {
    const from = window.scrollY, dist = top - from
    if (Math.abs(dist) < 1) return
    const dur = Math.min(900, 560 + Math.abs(dist) / vw * 90), t0 = performance.now()
    if (anim) cancelAnimationFrame(anim.raf)
    const a = (anim = { target: top, raf: 0 })
    root.style.scrollBehavior = 'auto'
    const step = (now: number) => {
      const k = Math.min(1, (now - t0) / dur)
      window.scrollTo(0, from + dist * ease(k))
      if (k < 1) a.raf = requestAnimationFrame(step)
      else { anim = null; root.style.scrollBehavior = '' }
    }
    step(t0)
  }

  function goTo(i: number, smooth: boolean) {
    i = clamp(i, 0, panels.length - 1)
    if (shelf.mode === 'swipe') track.scrollTo({ left: i * vw, behavior: smooth ? 'smooth' : 'auto' })
    else if (smooth) { current = i; glide(base() + i * vw) }
    else window.scrollTo({ top: base() + i * vw, behavior: 'instant' })
  }
  const target = () => (anim ? Math.round((anim.target - base()) / vw) : current)

  // A box with more to read scrolls first; the page only moves at its top or bottom.
  function boxCanScroll(el: Element | null, dy: number): boolean {
    const box = el?.closest?.('.panel-box') as HTMLElement | null
    if (!box || box.scrollHeight <= box.clientHeight + 2) return false
    return dy > 0 ? box.scrollTop + box.clientHeight < box.scrollHeight - 2 : box.scrollTop > 2
  }
  const viewerOpen = () => !!document.querySelector('.viewer:not([hidden])')
  const panelOf = (id: string) => document.getElementById(id)?.closest<Panel>('.panel') ?? null

  L.on(document, 'click', (e) => {
    if (!shelf.active) return
    const a = (e.target as Element).closest<HTMLAnchorElement>('a[href^="#"]')
    if (!a) return
    const p = panelOf(a.hash.slice(1))
    if (!p) return
    e.preventDefault()
    goTo(panels.indexOf(p), true)
    history.replaceState(null, '', a.hash)
  })
  L.on(document, 'focusin', (e) => {
    if (!shelf.active) return
    const p = (e.target as Element).closest?.('.panel') as Panel | null
    if (p && panels.indexOf(p) !== current) goTo(panels.indexOf(p), false)
  })
  L.on(window, 'wheel', (e) => {
    if (shelf.mode !== 'wide' || e.ctrlKey || viewerOpen()) return
    let dy = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY
    if (e.deltaMode === 1) dy *= 32
    if (boxCanScroll(e.target as Element, dy)) return
    e.preventDefault()
    const now = performance.now()
    // A new gesture starts after a short pause; trackpad momentum never skips two sections.
    if (now - lastWheel > 220) { wheelSum = 0; gestureUsed = false }
    lastWheel = now
    if (gestureUsed) return
    wheelSum += dy
    if (Math.abs(wheelSum) >= 40) { gestureUsed = true; goTo(target() + (wheelSum > 0 ? 1 : -1), true) }
  }, { passive: false })
  L.on(document, 'keydown', (e) => {
    if (!shelf.active || e.altKey || e.metaKey || e.ctrlKey) return
    const focus = document.activeElement as HTMLElement
    if (/^(INPUT|TEXTAREA|SELECT)$/.test(focus.tagName) || viewerOpen()) return
    const wideMode = shelf.mode === 'wide'
    const fwd = ['ArrowRight', 'PageDown'].includes(e.key) || (e.key === ' ' && !e.shiftKey) || (e.key === 'ArrowDown' && wideMode)
    const back = ['ArrowLeft', 'PageUp'].includes(e.key) || (e.key === ' ' && e.shiftKey) || (e.key === 'ArrowUp' && wideMode)
    if ((e.key === 'ArrowDown' || e.key === 'ArrowUp') && boxCanScroll(focus, e.key === 'ArrowDown' ? 1 : -1)) return
    if (/^(A|BUTTON)$/.test(focus.tagName) && e.key === ' ') return
    if (fwd) { e.preventDefault(); goTo(target() + 1, true) }
    else if (back) { e.preventDefault(); goTo(target() - 1, true) }
    else if (e.key === 'Home' && wideMode) { e.preventDefault(); goTo(0, true) }
    else if (e.key === 'End' && wideMode) { e.preventDefault(); goTo(panels.length - 1, true) }
  })

  L.on(window, 'scroll', () => {
    update()
    // Dragging the scroll bar or a touch screen on a big tablet: settle on the nearest section.
    if (shelf.mode !== 'wide' || anim) return
    clearTimeout(idleTimer)
    idleTimer = window.setTimeout(() => {
      if (anim || shelf.mode !== 'wide') return
      const x = window.scrollY - base(), i = Math.round(x / vw)
      if (x > 0 && x < (panels.length - 1) * vw && Math.abs(x - i * vw) > 2) goTo(i, true)
    }, 160)
  }, { passive: true })
  L.on(track, 'scroll', update, { passive: true })
  L.on(sticky, 'scroll', update, { passive: true })
  L.on(window, 'hashchange', () => {
    if (!shelf.active) return
    const tp = panelOf(location.hash.slice(1))
    if (tp) goTo(panels.indexOf(tp), false)
  })
  L.on(window, 'pageshow', () => setup())
  let lastW = window.innerWidth
  L.on(window, 'resize', () => {
    // Phones fire resize when the address bar hides; only redo the layout when the width changes.
    if (shelf.mode === 'swipe' && window.innerWidth === lastW) return
    lastW = window.innerWidth
    const keep = current
    setup()
    if (shelf.active && keep > 0) goTo(keep, false)
  })
  L.on(wide, 'change', setup)
  L.on(reduce, 'change', setup)

  setup()
  if (shelf.active && location.hash) {
    const tp = panelOf(location.hash.slice(1))
    if (tp) goTo(panels.indexOf(tp), false)
  }

  return () => {
    L.clear()
    root.classList.remove('hs-on', 'hs-swipe')
    track.style.transform = ''
    hs.style.height = ''
    Object.assign(shelf, { active: false, mode: 'off', p: 0, span: 0 })
  }
}
