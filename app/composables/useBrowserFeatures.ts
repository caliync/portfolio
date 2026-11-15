import { startCopyGuard } from '~/lib/copyGuard'
import { startCoverReveal } from '~/lib/coverReveal'
import type { Cleanup } from '~/lib/dom'
import { startGithubStats } from '~/lib/githubStats'
import { startImageViewer } from '~/lib/imageViewer'
import { startNavHighlight } from '~/lib/navHighlight'
import { startShelfScroll } from '~/lib/shelfScroll'
import { startTheme } from '~/lib/theme'

/**
 * The page behaviour that needs a real browser: theme switch, sideways scrolling, the image
 * viewer, cover reveals, live GitHub numbers, and (on the home page) the 3D library.
 * Everything starts once Vue has taken over the page and is undone when the page goes away.
 */
export function useBrowserFeatures(opts: { library: boolean }) {
  const stops: Cleanup[] = []
  let gone = false

  onMounted(() => {
    // Order matters a little: the viewer and covers add the elements the others look for.
    stops.push(startTheme(), startCoverReveal(), startImageViewer(), startShelfScroll(), startNavHighlight(), startCopyGuard(), startGithubStats())
    if (opts.library) {
      // three.js code lives in its own chunk, so project pages never download it.
      import('~/lib/library').then(async (m) => {
        const stop = await m.startLibrary()
        if (gone) stop(); else stops.push(stop)
      })
    }
  })

  onBeforeUnmount(() => {
    gone = true
    stops.splice(0).reverse().forEach((stop) => stop())
  })
}
