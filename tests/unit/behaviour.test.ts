import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { startCopyGuard } from '~/lib/copyGuard'
import { startCoverReveal } from '~/lib/coverReveal'
import { startGithubStats } from '~/lib/githubStats'
import { startImageViewer } from '~/lib/imageViewer'
import { startTheme } from '~/lib/theme'

let stop: (() => void) | undefined
beforeEach(() => { document.body.innerHTML = ''; localStorage.clear(); delete document.documentElement.dataset.theme })
afterEach(() => { stop?.(); stop = undefined; vi.restoreAllMocks(); vi.unstubAllGlobals() })

const click = (el: Element) => el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }))
const key = (target: EventTarget, k: string) => target.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true }))

describe('theme', () => {
  beforeEach(() => {
    document.body.innerHTML = '<button data-theme-toggle aria-label="x"></button>'
    vi.stubGlobal('matchMedia', () => ({ matches: false, addEventListener() {}, removeEventListener() {} }))
  })

  it('follows the system until you choose, labels the button, then remembers the choice', () => {
    stop = startTheme()
    const btn = document.querySelector<HTMLElement>('[data-theme-toggle]')!
    expect(btn.getAttribute('aria-label')).toBe('Switch to light mode')   // system is dark
    const changed = vi.fn(); window.addEventListener('themechange', changed)
    click(btn)
    expect(document.documentElement.dataset.theme).toBe('light')
    expect(localStorage.getItem('theme')).toBe('light')
    expect(btn.getAttribute('aria-label')).toBe('Switch to dark mode')
    expect(changed).toHaveBeenCalledOnce()
    window.removeEventListener('themechange', changed)
  })

  it('stops listening when cleaned up', () => {
    stop = startTheme(); stop(); stop = undefined
    click(document.querySelector('[data-theme-toggle]')!)
    expect(document.documentElement.dataset.theme).toBeUndefined()
  })
})

describe('image viewer', () => {
  beforeEach(() => {
    document.body.innerHTML = '<figure class="shot"><img src="/a.webp" alt="A screen"><figcaption>The home page.</figcaption></figure>'
    stop = startImageViewer()
  })
  const viewer = () => document.querySelector<HTMLElement>('.viewer')!

  it('opens the picture larger with its caption, and labels it for screen readers', () => {
    const img = document.querySelector<HTMLImageElement>('.shot img')!
    expect(img.getAttribute('aria-label')).toBe('View larger: A screen')
    click(img)
    expect(viewer().hidden).toBe(false)
    expect(viewer().querySelector('figcaption')!.textContent).toBe('The home page.')
    expect(viewer().querySelector('img')!.getAttribute('src')).toContain('/a.webp')
    expect(document.documentElement.classList.contains('viewer-open')).toBe(true)
  })

  it('closes with Escape or the close button', () => {
    const img = document.querySelector<HTMLImageElement>('.shot img')!
    click(img); key(document, 'Escape')
    expect(viewer().hidden).toBe(true)
    click(img); click(viewer().querySelector('.viewer-close')!)
    expect(viewer().hidden).toBe(true)
  })

  it('opens from the keyboard (Enter) because the picture is a button', () => {
    const img = document.querySelector<HTMLImageElement>('.shot img')!
    expect(img.getAttribute('role')).toBe('button')
    key(img, 'Enter')
    expect(viewer().hidden).toBe(false)
  })

  it('removes the viewer when cleaned up', () => {
    stop!(); stop = undefined
    expect(document.querySelector('.viewer')).toBeNull()
  })
})

describe('cover reveal', () => {
  beforeEach(() => {
    const shots = JSON.stringify([{ src: '/1.webp', alt: 'one' }, { src: '/2.webp', alt: 'two' }, { src: '/3.webp', alt: 'three' }])
    document.body.innerHTML = `<div class="art-box" data-shots='${shots}'>
      <button class="art-scene"></button>
      <div class="art-real" inert><img class="art-img" alt="">
        <button class="art-prev"></button><span class="art-count"></span><button class="art-next"></button><button class="art-back"></button></div></div>`
    stop = startCoverReveal()
  })
  const q = <T extends Element>(s: string) => document.querySelector<T>(s)!

  it('reveals the first real screen when the cover is clicked, and swaps what is clickable', () => {
    click(q('.art-scene'))
    expect(q('.art-box').classList.contains('is-real')).toBe(true)
    expect(q('.art-img').getAttribute('src')).toBe('/1.webp')
    expect(q('.art-count').textContent).toBe('1 / 3')
    expect(q('.art-scene').hasAttribute('inert')).toBe(true)
    expect(q('.art-real').hasAttribute('inert')).toBe(false)
  })

  it('goes forward and back, and wraps around at both ends', () => {
    click(q('.art-scene'))
    click(q('.art-prev'))
    expect(q('.art-count').textContent).toBe('3 / 3')
    click(q('.art-next'))
    expect(q('.art-count').textContent).toBe('1 / 3')
    key(q('.art-box'), 'ArrowRight')
    expect(q('.art-img').getAttribute('alt')).toBe('two')
  })

  it('goes back to the cover with the button or Escape', () => {
    click(q('.art-scene')); click(q('.art-back'))
    expect(q('.art-box').classList.contains('is-real')).toBe(false)
    expect(q('.art-real').hasAttribute('inert')).toBe(true)
    click(q('.art-scene')); key(q('.art-box'), 'Escape')
    expect(q('.art-box').classList.contains('is-real')).toBe(false)
  })
})

describe('copy guard', () => {
  beforeEach(() => {
    document.body.innerHTML = '<p id="prose">My prose</p><dl class="copy-ok"><dd id="mail">me@example.com</dd></dl>'
    stop = startCopyGuard()
  })
  const fire = (target: Element, type: string) => { const e = new Event(type, { bubbles: true, cancelable: true }); target.dispatchEvent(e); return e }

  it('blocks right-click and drag on the page, but not on contact details', () => {
    expect(fire(document.getElementById('prose')!, 'contextmenu').defaultPrevented).toBe(true)
    expect(fire(document.getElementById('mail')!, 'contextmenu').defaultPrevented).toBe(false)
  })

  it('blocks dragging images and links', () => {
    document.body.insertAdjacentHTML('beforeend', '<img id="pic" alt=""><a id="lnk" href="/x">x</a>')
    expect(fire(document.getElementById('pic')!, 'dragstart').defaultPrevented).toBe(true)
    expect(fire(document.getElementById('lnk')!, 'dragstart').defaultPrevented).toBe(true)
  })

  it('lets recruiters copy the email and links, but not the prose', () => {
    const select = (el: Element) => vi.spyOn(window, 'getSelection').mockReturnValue({ anchorNode: el.firstChild } as Selection)
    select(document.getElementById('mail')!)
    expect(fire(document, 'copy').defaultPrevented).toBe(false)
    select(document.getElementById('prose')!)
    expect(fire(document, 'copy').defaultPrevented).toBe(true)
  })
})

describe('live GitHub numbers', () => {
  const li = () => `<ul><li data-gh-repo="caliync/portfolio"><span data-gh="commits">51</span> commits · <time data-gh="updated" datetime="2026-11-12T08:45:45Z">Nov 12, 2026</time></li></ul>`
  const reply = (body: unknown, init: { status?: number; link?: string } = {}) =>
    new Response(JSON.stringify(body), { status: init.status ?? 200, headers: init.link ? { Link: init.link } : {} })
  const settle = () => new Promise((r) => setTimeout(r, 20))

  beforeEach(() => { document.body.innerHTML = li() })

  it('replaces the saved numbers when GitHub has newer ones, and remembers them', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(reply({ default_branch: 'main', pushed_at: '2026-11-15T18:35:00Z' }))
      .mockResolvedValueOnce(reply([{}], { link: '<https://api.github.com/x?per_page=1&page=60>; rel="last"' }))
    vi.stubGlobal('fetch', fetchMock)
    stop = startGithubStats(); await settle()
    expect(document.querySelector('[data-gh="commits"]')!.textContent).toBe('60')
    expect(document.querySelector('[data-gh="updated"]')!.textContent).toBe('Nov 15, 2026')
    expect(localStorage.getItem('gh:caliync/portfolio')).toContain('"commits":60')
  })

  it('never shows older numbers than the saved ones', async () => {
    vi.stubGlobal('fetch', vi.fn()
      .mockResolvedValueOnce(reply({ default_branch: 'main', pushed_at: '2026-01-01T00:00:00Z' }))
      .mockResolvedValueOnce(reply([{}], { link: '<x?page=3>; rel="last"' })))
    stop = startGithubStats(); await settle()
    expect(document.querySelector('[data-gh="commits"]')!.textContent).toBe('51')
  })

  it('leaves the saved numbers alone when GitHub fails, and backs off after a rate limit', async () => {
    const fetchMock = vi.fn().mockResolvedValue(reply({ message: 'rate limit exceeded' }, { status: 403 }))
    vi.stubGlobal('fetch', fetchMock)
    stop = startGithubStats(); await settle()
    expect(document.querySelector('[data-gh="commits"]')!.textContent).toBe('51')
    expect(fetchMock).toHaveBeenCalledTimes(1)

    stop(); document.body.innerHTML = li()   // the next page load, within half an hour
    stop = startGithubStats(); await settle()
    expect(fetchMock).toHaveBeenCalledTimes(1)   // no new request
  })

  it('uses the cached numbers without asking GitHub again', async () => {
    localStorage.setItem('gh:caliync/portfolio', JSON.stringify({ at: Date.now(), commits: 99, pushed: '2026-11-20T00:00:00Z' }))
    const fetchMock = vi.fn(); vi.stubGlobal('fetch', fetchMock)
    stop = startGithubStats(); await settle()
    expect(fetchMock).not.toHaveBeenCalled()
    expect(document.querySelector('[data-gh="commits"]')!.textContent).toBe('99')
  })
})
