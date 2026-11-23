// The browser script every page loads. It starts the page behaviour: theme switch,
// image viewer, sideways scrolling, nav highlight, copy guard and live GitHub numbers; and on the
// home page the 3D library, which is its own file fetched only when the page has a canvas for it.
//
// The pages are plain HTML made at build time, so none of Vue runs in the browser: this is bundled
// by esbuild (scripts/prebuild.mjs) into public/assets/js/site.js.
import { startCopyGuard } from './copyGuard'
import { startGithubStats } from './githubStats'
import { startImageViewer } from './imageViewer'
import { startMenu } from './menu'
import { startNavHighlight } from './navHighlight'
import { startShelfScroll } from './shelfScroll'
import { startTheme } from './theme'

// Order matters a little: the viewer and covers add the elements the others look for.
startTheme()
startImageViewer()
startShelfScroll()
startNavHighlight()
startMenu()
startCopyGuard()
startGithubStats()

if (document.querySelector('canvas.bg3d')) {
  import('./library').then((m) => m.startLibrary())
}
