// Serves the generated site the way GitHub Pages does: under /portfolio/, with folder URLs
// answered by their index.html. Used by the tests and for checking a build locally.
//   node scripts/serve.mjs [port]
import { createServer } from 'node:http'
import { readFile, stat } from 'node:fs/promises'
import { extname, join, normalize } from 'node:path'

const root = new URL('../.output/public/', import.meta.url).pathname
const port = Number(process.argv[2] ?? 4173)
const types = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css',
  '.svg': 'image/svg+xml', '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg', '.json': 'application/json',
  '.pdf': 'application/pdf', '.xml': 'application/xml', '.txt': 'text/plain',
}

createServer(async (req, res) => {
  const path = decodeURIComponent(new URL(req.url, 'http://x').pathname)
  if (!path.startsWith('/portfolio/')) { res.writeHead(404).end('not found'); return }
  let file = normalize(join(root, path.slice('/portfolio/'.length)))
  if (!file.startsWith(root)) { res.writeHead(403).end(); return }
  try {
    if ((await stat(file)).isDirectory()) file = join(file, 'index.html')
    const body = await readFile(file)
    res.writeHead(200, { 'content-type': types[extname(file)] ?? 'application/octet-stream' }).end(body)
  } catch {
    res.writeHead(404, { 'content-type': 'text/html' }).end(await readFile(join(root, '404.html')).catch(() => 'not found'))
  }
}).listen(port, '127.0.0.1', () => console.log(`http://127.0.0.1:${port}/portfolio/`))
