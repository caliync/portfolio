// Small helpers shared by the browser-side modules in this folder.
// Every module's start function returns a cleanup function; `Listeners` collects what to undo.

export type Cleanup = () => void

export class Listeners {
  private off: Cleanup[] = []

  on<K extends keyof WindowEventMap>(t: Window, type: K, fn: (e: WindowEventMap[K]) => void, opts?: AddEventListenerOptions): void
  on<K extends keyof DocumentEventMap>(t: Document, type: K, fn: (e: DocumentEventMap[K]) => void, opts?: AddEventListenerOptions): void
  on<K extends keyof HTMLElementEventMap>(t: HTMLElement, type: K, fn: (e: HTMLElementEventMap[K]) => void, opts?: AddEventListenerOptions): void
  on(t: MediaQueryList, type: 'change', fn: (e: MediaQueryListEvent) => void): void
  on(t: EventTarget, type: string, fn: (e: never) => void, opts?: AddEventListenerOptions): void {
    t.addEventListener(type, fn as EventListener, opts)
    this.off.push(() => t.removeEventListener(type, fn as EventListener, opts))
  }

  /** Run something at cleanup time too (timers, observers, animation frames). */
  add(fn: Cleanup): void {
    this.off.push(fn)
  }

  clear(): void {
    this.off.splice(0).reverse().forEach((f) => f())
  }
}

/** The sections' links in the top bar, by section id: "projects" -> <a href="#projects">. */
export function navLinks(): Record<string, HTMLAnchorElement> {
  const links: Record<string, HTMLAnchorElement> = {}
  document.querySelectorAll<HTMLAnchorElement>('.bar nav a[href^="#"]').forEach((a) => { links[a.hash.slice(1)] = a })
  return links
}

/** State the sideways scroll shares with the nav highlight and the 3D library. */
export interface ShelfState { active: boolean; mode: 'off' | 'wide' | 'swipe'; p: number; span: number }
export const shelf: ShelfState = { active: false, mode: 'off', p: 0, span: 0 }

declare global {
  interface Window { shelfScroll?: ShelfState; THREE?: typeof import('three') }
  interface WindowEventMap { themechange: Event }
}
