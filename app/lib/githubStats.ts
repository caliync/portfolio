// GitHub numbers: the page ships with a snapshot from the last build; for public repos this
// checks GitHub for newer ones. One cached result per repo for 6 hours keeps visitors far under
// GitHub's 60-requests-an-hour limit. Any failure just leaves the snapshot showing.
import type { Cleanup } from './dom'

const TTL = 6 * 60 * 60 * 1000
const BACKOFF = 30 * 60 * 1000   // after GitHub says "rate limit", leave it alone for half an hour
const fmt = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' })

interface Numbers { commits: number; pushed: string }

function cached(repo: string): Numbers | null {
  try {
    const hit = JSON.parse(localStorage.getItem(`gh:${repo}`) || 'null')
    return hit && Date.now() - hit.at < TTL ? hit : null
  } catch { return null }
}

function remember(repo: string, d: Numbers) {
  try { localStorage.setItem(`gh:${repo}`, JSON.stringify({ at: Date.now(), ...d })) } catch { /* not remembered */ }
}

function backingOff(): boolean {
  try { return Date.now() - Number(localStorage.getItem('gh:backoff') || 0) < BACKOFF } catch { return false }
}

async function getJSON<T>(url: string, signal: AbortSignal): Promise<{ body: T; link: string }> {
  const r = await fetch(url, { headers: { Accept: 'application/vnd.github+json' }, signal })
  if (r.status === 403 || r.status === 429) {
    try { localStorage.setItem('gh:backoff', String(Date.now())) } catch { /* not remembered */ }
  }
  if (!r.ok) throw new Error(String(r.status))
  return { body: (await r.json()) as T, link: r.headers.get('Link') ?? '' }
}

async function load(repo: string, signal: AbortSignal): Promise<Numbers> {
  const hit = cached(repo)
  if (hit) return hit
  if (backingOff()) throw new Error('backing off')
  const api = `https://api.github.com/repos/${repo}`
  const info = await getJSON<{ default_branch: string; pushed_at: string }>(api, signal)
  // One commit per page: the "last" page number is the commit count.
  const c = await getJSON<unknown[]>(`${api}/commits?per_page=1&sha=${encodeURIComponent(info.body.default_branch)}`, signal)
  const last = /[?&]page=(\d+)>; rel="last"/.exec(c.link)
  const data = { commits: last ? Number(last[1]) : c.body.length, pushed: info.body.pushed_at }
  remember(repo, data)
  return data
}

export function startGithubStats(): Cleanup {
  const items = document.querySelectorAll<HTMLElement>('[data-gh-repo]')
  if (!items.length) return () => {}
  const ctl = new AbortController()

  items.forEach(async (li) => {
    try {
      const data = await load(li.dataset.ghRepo!, ctl.signal)
      const time = li.querySelector<HTMLTimeElement>('[data-gh="updated"]')!
      // never show older numbers than the snapshot
      if (!data.pushed || new Date(data.pushed) < new Date(time.getAttribute('datetime')!)) return
      li.querySelector('[data-gh="commits"]')!.textContent = String(data.commits)
      time.setAttribute('datetime', data.pushed)
      time.textContent = fmt.format(new Date(data.pushed))
    } catch { /* leave the snapshot showing */ }
  })
  return () => ctl.abort()
}
