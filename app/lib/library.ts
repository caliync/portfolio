// Background: a 3D library wall. Wooden bookcases full of leather-bound books run
// sideways under brass lamps, with dust drifting in the light. On the home page the
// camera glides along the shelves as you scroll (see shelfScroll.ts), and a book slides
// out when you point at it. Project pages show the shelves faint and still. Every texture
// is drawn in code, so there are no image files to load.
// Uses three.js r128, fetched on demand from the CDN with an integrity check, so visitors
// who won't see it moving (reduced motion, data saver, no WebGL) never download its 603 KB.
import type * as THREE from 'three'
import { Listeners, shelf, type Cleanup } from './dom'

const THREE_URL = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js'
const THREE_SRI = 'sha384-CI3ELBVUz9XQO+97x6nwMDPosPR5XvsxW2ua7N1Xeygeh1IxtgqtCkGfQY9WWdHu' // same bytes as npm three@0.128.0

type Three = typeof THREE

interface Book { x: number; y: number; z: number; w: number; h: number; d: number; rz: number; tone: number; flat?: boolean }
interface Spine { c: HTMLCanvasElement; style: number; bands: number; title: number }

function loadThree(): Promise<Three> {
  if (window.THREE) return Promise.resolve(window.THREE as Three)
  return new Promise((resolve, reject) => {
    const s = document.createElement('script')
    s.src = THREE_URL
    s.integrity = THREE_SRI
    s.crossOrigin = 'anonymous'
    s.onload = () => resolve(window.THREE as Three)
    s.onerror = () => reject(new Error('three.js did not load'))
    document.head.appendChild(s)
  })
}

/** Swap the canvas for the still picture: reduced motion, data saver, and whenever 3D can't start. */
function useStill(canvas: HTMLCanvasElement) {
  const pic = document.createElement('div')
  pic.className = 'bg-still'
  pic.setAttribute('aria-hidden', 'true')
  canvas.replaceWith(pic)
}

export async function startLibrary(): Promise<Cleanup> {
  const canvas = document.querySelector<HTMLCanvasElement>('canvas.bg3d')
  if (!canvas) return () => {}

  const conn = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  if (reducedMotion || conn?.saveData) { useStill(canvas); return () => {} }

  let T: Three
  try { T = await loadThree() } catch { useStill(canvas); return () => {} }
  if (!canvas.isConnected) return () => {}   // the page changed while three.js was loading

  let renderer: THREE.WebGLRenderer
  try { renderer = new T.WebGLRenderer({ canvas, antialias: true, alpha: false }) } catch { useStill(canvas); return () => {} }

  const L = new Listeners()
  const small = window.matchMedia('(max-width: 899px)').matches   // phones get a lighter library
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, small ? 1.5 : 1.75))
  // Colour maps are drawn in sRGB, so the renderer lights them in linear space and
  // converts back on output; filmic tone mapping keeps the lamp hot spots from clipping.
  renderer.outputEncoding = T.sRGBEncoding
  renderer.toneMapping = T.ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.0

  const isHome = document.body.dataset.bg === 'intro'
  const scene = new T.Scene()
  const camera = new T.PerspectiveCamera(44, 1, 0.1, 80)

  // Seeded random, so the shelves look the same on every visit.
  let seed = 11
  const rnd = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646 }
  const mkCanvas = (w: number, h: number) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c }
  function tex(c: HTMLCanvasElement, rx = 1, ry = 1) {
    const t = new T.CanvasTexture(c)
    t.wrapS = t.wrapT = T.RepeatWrapping
    t.repeat.set(rx, ry)
    t.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy())
    t.encoding = T.sRGBEncoding
    return t
  }

  // ---------- layout ----------
  const UNIT = 2.3, H = 4.3, DEPTH = 0.62, ROWS = [0.14, 1.0, 1.86, 2.72, 3.58], BOARD = 0.07
  const START = -14, UNITS = small ? 34 : 52, wallLen = UNITS * UNIT

  // ---------- wood ----------
  function woodCanvas(base: string, dark: string, w: number, h: number, vertical: boolean) {
    const c = mkCanvas(w, h), g = c.getContext('2d')!
    g.fillStyle = base; g.fillRect(0, 0, w, h)
    const lines = vertical ? w : h
    for (let i = 0; i < 260; i++) {
      const p = rnd() * lines, wave = 2 + rnd() * 6, alpha = 0.04 + rnd() * 0.14
      g.strokeStyle = rnd() < 0.6 ? dark : 'rgba(255,230,200,1)'
      g.globalAlpha = alpha * (g.strokeStyle === 'rgba(255,230,200,1)' ? 0.35 : 1)
      g.lineWidth = 0.6 + rnd() * 1.6
      g.beginPath()
      const len = vertical ? h : w, ph = rnd() * 6
      for (let s = 0; s <= len; s += 8) {
        const o = Math.sin(s / (40 + wave * 20) + ph) * wave
        if (vertical) { if (s === 0) g.moveTo(p + o, s); else g.lineTo(p + o, s) }
        else { if (s === 0) g.moveTo(s, p + o); else g.lineTo(s, p + o) }
      }
      g.stroke()
    }
    g.globalAlpha = 1
    return c
  }
  const woodC = mkCanvas(1, 1), panelC = mkCanvas(1, 1)
  const woodTex = tex(woodC), panelTex = tex(panelC, 18, 1)
  const frameMat = new T.MeshStandardMaterial({ map: woodTex, roughness: 0.62, metalness: 0.0 })
  const wallMat = new T.MeshStandardMaterial({ map: panelTex, roughness: 0.9 })
  const floorMat = new T.MeshStandardMaterial({ roughness: 0.7 })
  const brassMat = new T.MeshStandardMaterial({ color: new T.Color(0xb08a3e).convertSRGBToLinear(), roughness: 0.35, metalness: 0.85 })
  brassMat.side = T.DoubleSide
  const bulbMat = new T.MeshBasicMaterial({ color: 0xffe08a })

  const wall = new T.Mesh(new T.PlaneGeometry(wallLen + 40, 12), wallMat)
  wall.position.set(START + wallLen / 2, 5, -DEPTH - 0.01); scene.add(wall)
  const floor = new T.Mesh(new T.PlaneGeometry(wallLen + 40, 30), floorMat)
  floor.rotation.x = -Math.PI / 2; floor.position.set(START + wallLen / 2, 0, 10); scene.add(floor)

  // ---------- bookcase frames ----------
  const box = new T.BoxGeometry(1, 1, 1)
  const frames: number[][] = []
  for (let u = 0; u < UNITS; u++) {
    const x0 = START + u * UNIT
    frames.push([x0, H / 2, -DEPTH / 2 + 0.03, 0.09, H, DEPTH + 0.06])
    ROWS.forEach((y) => frames.push([x0 + UNIT / 2, y - BOARD / 2, -DEPTH / 2 + 0.02, UNIT, BOARD, DEPTH]))
    frames.push([x0 + UNIT / 2, H + 0.04, -DEPTH / 2 + 0.05, UNIT + 0.12, 0.16, DEPTH + 0.12]) // cornice
    frames.push([x0 + UNIT / 2, 0.07, 0.0, UNIT, 0.14, 0.05])                                     // plinth
  }
  frames.push([START + UNITS * UNIT, H / 2, -DEPTH / 2 + 0.03, 0.09, H, DEPTH + 0.06])
  const frameMesh = new T.InstancedMesh(box, frameMat, frames.length)
  const m4 = new T.Matrix4(), q = new T.Quaternion(), v = new T.Vector3(), sc = new T.Vector3()
  frames.forEach((f, i) => {
    m4.compose(v.set(f[0]!, f[1]!, f[2]!), q.set(0, 0, 0, 1), sc.set(f[3]!, f[4]!, f[5]!))
    frameMesh.setMatrixAt(i, m4)
  })
  scene.add(frameMesh)

  // Soft shadow at the back and top of every shelf, so the books sit inside the case.
  const shadeC = mkCanvas(4, 128), sg = shadeC.getContext('2d')!, grd = sg.createLinearGradient(0, 0, 0, 128)
  grd.addColorStop(0, 'rgba(0,0,0,.85)'); grd.addColorStop(0.35, 'rgba(0,0,0,.35)'); grd.addColorStop(1, 'rgba(0,0,0,0)')
  sg.fillStyle = grd; sg.fillRect(0, 0, 4, 128)
  const aoMat = new T.MeshBasicMaterial({ map: new T.CanvasTexture(shadeC), transparent: true, depthWrite: false })
  const aoMesh = new T.InstancedMesh(new T.PlaneGeometry(1, 1), aoMat, UNITS * ROWS.length)
  let ai = 0
  for (let u = 0; u < UNITS; u++) {
    ROWS.forEach((_, r) => {
      const top = (ROWS[r + 1] ?? H) - BOARD
      m4.compose(v.set(START + u * UNIT + UNIT / 2, top - 0.22, -DEPTH + 0.02), q.set(0, 0, 0, 1), sc.set(UNIT, 0.44, 1))
      aoMesh.setMatrixAt(ai++, m4)
    })
  }
  scene.add(aoMesh)

  // ---------- books ----------
  const books: Book[] = []
  for (let u = 0; u < UNITS; u++) {
    for (let r = 0; r < ROWS.length; r++) {
      const y0 = ROWS[r]!, gap = (ROWS[r + 1] ?? H) - y0 - BOARD
      let x = START + u * UNIT + 0.1
      const end = START + (u + 1) * UNIT - 0.07
      let stackDone = false
      while (x < end - 0.05) {
        const roll = rnd()
        if (roll < 0.04) { x += 0.08 + rnd() * 0.2; continue }
        if (!stackDone && roll < 0.09 && end - x > 0.5) {
          const sw = 0.36 + rnd() * 0.12, n = 2 + Math.floor(rnd() * 3)
          let sy = y0
          for (let k = 0; k < n; k++) {
            const th = 0.05 + rnd() * 0.04
            books.push({ x: x + sw / 2 + (rnd() - 0.5) * 0.03, y: sy + th / 2, z: -0.27, w: sw, h: th, d: 0.3 + rnd() * 0.06, rz: 0, flat: true, tone: rnd() })
            sy += th
          }
          x += sw + 0.05; stackDone = true; continue
        }
        const w = 0.045 + rnd() * 0.075, h = Math.min(gap - 0.04, gap * (0.64 + rnd() * 0.32)), d = 0.34 + rnd() * 0.16
        const lean = (rnd() < 0.035 && x + w + 0.12 < end) ? 0.16 + rnd() * 0.12 : 0
        if (lean) {
          books.push({ x: x + w / 2 + Math.sin(lean) * h / 2, y: y0 + Math.cos(lean) * h / 2, z: -DEPTH + d / 2 + 0.05, w, h, d, rz: -lean, tone: rnd() })
          x += w + Math.sin(lean) * h + 0.01
        } else {
          books.push({ x: x + w / 2, y: y0 + h / 2, z: -DEPTH + d / 2 + 0.04 + rnd() * 0.05, w, h, d, rz: 0, tone: rnd() })
          x += w + 0.003
        }
      }
    }
  }

  // Spine designs: each group of books shares one drawn spine and cover colour.
  const GROUPS = 14
  const spineCanvases: Spine[] = []
  const spineMats: THREE.MeshStandardMaterial[] = []
  const coverMats: THREE.MeshStandardMaterial[] = []
  const pagesMat = new T.MeshStandardMaterial({ color: 0xe9dcc0, roughness: 0.95 })
  const grainC = mkCanvas(128, 128), gg = grainC.getContext('2d')!
  gg.fillStyle = '#808080'; gg.fillRect(0, 0, 128, 128)
  for (let gn = 0; gn < 2600; gn++) {
    const gv = 90 + Math.floor(rnd() * 80)
    gg.fillStyle = `rgb(${gv},${gv},${gv})`
    gg.fillRect(rnd() * 128, rnd() * 128, 1 + rnd() * 1.5, 1 + rnd() * 1.5)
  }
  const grainTex = new T.CanvasTexture(grainC); grainTex.wrapS = grainTex.wrapT = T.RepeatWrapping   // data, not colour: stays linear
  for (let gi = 0; gi < GROUPS; gi++) {
    const c = mkCanvas(64, 256)
    spineCanvases.push({ c, style: Math.floor(rnd() * 4), bands: 1 + Math.floor(rnd() * 3), title: 0.3 + rnd() * 0.25 })
    spineMats.push(new T.MeshStandardMaterial({ map: tex(c), roughness: 0.55, bumpMap: grainTex, bumpScale: 0.004 }))
    coverMats.push(new T.MeshStandardMaterial({ roughness: 0.7, bumpMap: grainTex, bumpScale: 0.004 }))
  }
  function drawSpine(s: Spine, base: string, gold: string) {
    const g = s.c.getContext('2d')!, W = 64, Hh = 256
    g.fillStyle = base; g.fillRect(0, 0, W, Hh)
    const gr = g.createLinearGradient(0, 0, W, 0)                       // rounded spine shading
    gr.addColorStop(0, 'rgba(0,0,0,.45)'); gr.addColorStop(0.3, 'rgba(255,255,255,.10)')
    gr.addColorStop(0.55, 'rgba(255,255,255,.04)'); gr.addColorStop(1, 'rgba(0,0,0,.5)')
    g.fillStyle = gr; g.fillRect(0, 0, W, Hh)
    for (let i = 0; i < 900; i++) {                                    // leather grain
      g.fillStyle = rnd() < 0.5 ? 'rgba(0,0,0,.08)' : 'rgba(255,255,255,.04)'
      g.fillRect(rnd() * W, rnd() * Hh, 1.5, 1.5)
    }
    g.fillStyle = gold
    if (s.style !== 3) [22, 230].forEach((y) => { g.fillRect(4, y, W - 8, 3); g.fillRect(4, y + 6, W - 8, 1.5) })
    for (let b = 0; b < s.bands; b++) {                                // raised bands
      const y = 60 + b * 50
      g.fillStyle = 'rgba(0,0,0,.35)'; g.fillRect(0, y + 3, W, 3)
      g.fillStyle = 'rgba(255,255,255,.14)'; g.fillRect(0, y - 1, W, 3)
      if (s.style < 2) { g.fillStyle = gold; g.fillRect(6, y + 8, W - 12, 1.5) }
    }
    if (s.style !== 2) {                                               // title label
      const ty = Hh * s.title
      if (s.style === 1) { g.fillStyle = 'rgba(0,0,0,.4)'; g.fillRect(8, ty - 4, W - 16, 34) }
      g.fillStyle = gold
      for (let l = 0; l < 3; l++) g.fillRect(14 + (l % 2) * 6, ty + l * 9, W - 28 - (l % 2) * 12, 3)
    }
  }
  const groupOf = books.map((b) => Math.floor(b.tone * GROUPS) % GROUPS)
  const meshes: THREE.InstancedMesh[] = []
  const idxIn: number[] = []
  const counts: number[] = new Array(GROUPS).fill(0)
  books.forEach((_, i) => { idxIn[i] = counts[groupOf[i]!]!++ })
  for (let gi = 0; gi < GROUPS; gi++) {
    // BoxGeometry faces: +x, -x, +y, -y, +z (spine, facing the room), -z
    const mesh = new T.InstancedMesh(box, [coverMats[gi]!, coverMats[gi]!, pagesMat, pagesMat, spineMats[gi]!, coverMats[gi]!], Math.max(1, counts[gi]!))
    mesh.count = counts[gi]!
    meshes.push(mesh); scene.add(mesh)
  }
  const pull = new Float32Array(books.length), pullGoal = new Float32Array(books.length), dirty = new Uint8Array(GROUPS)
  const e3 = new T.Euler()
  function placeBook(i: number) {
    const b = books[i]!
    e3.set(0, 0, b.rz); q.setFromEuler(e3)
    m4.compose(v.set(b.x, b.y, b.z + pull[i]!), q, sc.set(b.w, b.h, b.d))
    meshes[groupOf[i]!]!.setMatrixAt(idxIn[i]!, m4)
  }
  for (let i = 0; i < books.length; i++) placeBook(i)

  // ---------- brass lamps ----------
  const glowTex = (() => {
    const c = mkCanvas(128, 128), g = c.getContext('2d')!, gr = g.createRadialGradient(64, 64, 0, 64, 64, 64)
    gr.addColorStop(0, 'rgba(255,224,140,1)'); gr.addColorStop(0.22, 'rgba(255,196,90,.55)'); gr.addColorStop(1, 'rgba(255,180,60,0)')
    g.fillStyle = gr; g.fillRect(0, 0, 128, 128)
    return new T.CanvasTexture(c)
  })()
  const lampXs: number[] = []
  const glowMat = new T.SpriteMaterial({ map: glowTex, transparent: true, depthWrite: false, blending: T.AdditiveBlending })
  const shadeGeo = new T.CylinderGeometry(0.09, 0.3, 0.26, 28, 1, true)
  const bulbGeo = new T.SphereGeometry(0.075, 14, 10)
  const cordGeo = new T.CylinderGeometry(0.008, 0.008, 1.4, 6)
  const capGeo = new T.CylinderGeometry(0.05, 0.05, 0.08, 12)
  for (let u = 0; u < UNITS; u += 2) {
    const lx = START + u * UNIT + UNIT
    lampXs.push(lx)
    const grp = new T.Group(); grp.position.set(lx, 4.8, 0.85)
    grp.add(new T.Mesh(shadeGeo, brassMat))
    const cap = new T.Mesh(capGeo, brassMat); cap.position.y = 0.16; grp.add(cap)
    const bulb = new T.Mesh(bulbGeo, bulbMat); bulb.position.y = -0.08; grp.add(bulb)
    const cord = new T.Mesh(cordGeo, brassMat); cord.position.y = 0.88; grp.add(cord)
    const spr = new T.Sprite(glowMat)
    spr.scale.set(1.7, 1.7, 1); spr.position.y = -0.16; grp.add(spr)
    scene.add(grp)
    grp.updateMatrixWorld(true)
    grp.traverse((o) => { o.matrixAutoUpdate = false })
  }
  const lights: THREE.PointLight[] = []
  for (let i = 0; i < 5; i++) { const pl = new T.PointLight(0xffc060, 1, 8, 1.5); scene.add(pl); lights.push(pl) }
  const amb = new T.AmbientLight(0xffffff, 0.3); scene.add(amb)
  ;(() => {
    const envScene = new T.Scene(), panel = new T.PlaneGeometry(1, 1)
    envScene.background = new T.Color(0x1a0c08)
    const panels: [number, number, number, number, number, number, number][] = [
      [0, 3, -2, 6, 1.2, 0xffc070, 3], [-4, 1, 1, 2, 3, 0x6a3018, 1], [4, 1, 1, 2, 3, 0x6a3018, 1], [0, -3, 0, 8, 8, 0x2a1408, 1],
    ]
    for (const p of panels) {
      const m = new T.Mesh(panel, new T.MeshBasicMaterial({ color: new T.Color(p[5]).multiplyScalar(p[6]), side: T.DoubleSide }))
      m.position.set(p[0], p[1], p[2]); m.scale.set(p[3], p[4], 1); m.lookAt(0, 0, 0); envScene.add(m)
    }
    const pm = new T.PMREMGenerator(renderer)
    scene.environment = pm.fromScene(envScene, 0.04).texture
    pm.dispose(); panel.dispose()
    // the room light should only tint and add sheen, the lamps do the lighting
    for (const m of [frameMat, wallMat, floorMat, pagesMat, ...spineMats, ...coverMats]) m.envMapIntensity = 0.35
    envScene.traverse((o) => { (o as THREE.Mesh).material && ((o as THREE.Mesh).material as THREE.Material).dispose() })
  })()
  const hemi = new T.HemisphereLight(new T.Color(0xffe2c0).convertSRGBToLinear(), 0x2a1012, 0.35); scene.add(hemi)
  const key = new T.DirectionalLight(new T.Color(0xffe6c8).convertSRGBToLinear(), 0.25); key.position.set(-3, 6, 8); scene.add(key)

  // ---------- dust ----------
  const DUST = small ? 140 : 500, dpos = new Float32Array(DUST * 3), dvel = new Float32Array(DUST)
  for (let i = 0; i < DUST; i++) { dpos[i * 3] = (rnd() - 0.5) * 20; dpos[i * 3 + 1] = rnd() * 4.8; dpos[i * 3 + 2] = 0.2 + rnd() * 4.5; dvel[i] = 0.02 + rnd() * 0.05 }
  const dgeo = new T.BufferGeometry(); dgeo.setAttribute('position', new T.BufferAttribute(dpos, 3))
  const dmat = new T.PointsMaterial({ size: 0.03, transparent: true, depthWrite: false, opacity: 0.6, blending: T.AdditiveBlending, map: glowTex })
  scene.add(new T.Points(dgeo, dmat))

  // ---------- theme ----------
  let light = false
  const hex = (s: string) => parseInt(String(s).trim().replace('#', ''), 16)
  // hex colours are authored in sRGB; lit maths runs in linear space
  const lin = (n: number) => new T.Color(n).convertSRGBToLinear()
  const css = (n: number) => '#' + ('000000' + n.toString(16)).slice(-6)
  const CREAMS = [0xe8dcc0, 0xcbbd9b, 0xd6b98a, 0xe3d8c2, 0xd6c8a6, 0xc8b08c]
  function colours() {
    const bg = new T.Color(hex(getComputedStyle(document.documentElement).getPropertyValue('--bg') || '#160A0C'))
    light = bg.r > 0.5
    scene.background = bg
    scene.fog = new T.Fog(bg.clone().convertSRGBToLinear(), light ? 9 : 8, light ? 26 : 22)   // fog mixes in linear, then output converts it back to --bg
    renderer.setClearColor(bg)

    // leather: oxblood, crimson, burgundy, brown, tan, forest, black, navy, mustard, cream
    const pal = light
      ? [0x6e1a20, 0x8e2430, 0x581419, 0x5a3420, 0x8a6238, 0x26402f, 0x221a1a, 0x24304a, 0xb08516, 0xd6c8a6, 0x9a3324, 0x45211a, 0xa8865a, 0x701d2e]
      : [0x5e1419, 0x7c1c24, 0x4a1015, 0x4b2a19, 0x7a5430, 0x1f3326, 0x1a1414, 0x1c2438, 0xa67c12, 0xcbbd9b, 0x8a2a1f, 0x3a1a14, 0x9a7a4a, 0x611828]
    const gold = light ? '#e0bd52' : '#d8b545'
    for (let gi = 0; gi < GROUPS; gi++) {
      const c = pal[gi % pal.length]!
      drawSpine(spineCanvases[gi]!, css(c), CREAMS.includes(c) ? '#6a1a20' : gold)
      spineMats[gi]!.map!.needsUpdate = true
      coverMats[gi]!.color.copy(lin(c)).multiplyScalar(0.82)
    }
    pagesMat.color.copy(lin(light ? 0xd9ccb0 : 0xb7a888))
    woodC.width = 512; woodC.height = 512
    woodC.getContext('2d')!.drawImage(woodCanvas(light ? '#5a3624' : '#3a2218', light ? 'rgba(20,8,4,1)' : 'rgba(10,4,2,1)', 512, 512, false), 0, 0)
    woodTex.needsUpdate = true
    panelC.width = 256; panelC.height = 256
    panelC.getContext('2d')!.drawImage(woodCanvas(light ? '#3a2318' : '#1f110d', 'rgba(0,0,0,1)', 256, 256, true), 0, 0)
    panelTex.needsUpdate = true
    frameMat.color.setHex(0xffffff)
    wallMat.color.copy(lin(light ? 0x9a7466 : 0x7a5a50))
    floorMat.color.copy(lin(light ? 0x3a2219 : 0x140808))
    aoMat.opacity = light ? 0.8 : 0.9
    lights.forEach((l) => { l.intensity = light ? 1.05 : 1.35; l.color.copy(lin(light ? 0xffc666 : 0xffbc55)) })
    amb.intensity = light ? 0.12 : 0.08
    hemi.intensity = light ? 0.22 : 0.18
    hemi.groundColor.copy(lin(light ? 0x5a3326 : 0x2a0e10))
    key.intensity = light ? 0.34 : 0.16
    glowMat.opacity = light ? 0.9 : 1
    dmat.opacity = light ? 0.0 : 0.55
  }
  colours()

  function size() {
    const w = canvas!.clientWidth, h = canvas!.clientHeight
    renderer.setSize(w, h, false)
    camera.aspect = w / h
    camera.fov = w / h < 0.9 ? 58 : 44
    camera.updateProjectionMatrix()
  }
  size()

  // ---------- input ----------
  const mouse = new T.Vector2(9, 9)
  let hasMouse = false   // the cursor only picks books; the camera does not follow it
  const ray = new T.Raycaster()
  let hovered = -1, mouseMoved = false, lastPX = 0, lastPY = 0
  const shelfFront = new T.Plane(new T.Vector3(0, 0, 1), 0.15), hitV = new T.Vector3()
  // books sorted into bookcase units, so a lookup scans one unit's books only
  const byUnit: number[][] = []
  books.forEach((b, i) => { const uu = Math.floor((b.x - START) / UNIT); (byUnit[uu] = byUnit[uu] ?? []).push(i) })
  function bookAt(px: number, py: number) {
    const list = byUnit[Math.floor((px - START) / UNIT)]
    if (!list) return -1
    for (const i of list) {
      const b = books[i]!
      if (b.rz) continue
      if (Math.abs(px - b.x) <= b.w / 2 && Math.abs(py - b.y) <= b.h / 2) return i
    }
    return -1
  }
  L.on(window, 'pointermove', (e) => {
    lastPX = e.clientX; lastPY = e.clientY
    if (e.pointerType !== 'mouse') return
    mouse.set(e.clientX / window.innerWidth * 2 - 1, -(e.clientY / window.innerHeight) * 2 + 1)
    hasMouse = true; mouseMoved = true
  })
  L.on(document, 'pointerleave', () => { hasMouse = false })

  // ---------- frame ----------
  const START_X = START + 8
  let camX = START_X, lastT = 0
  function progress() {
    if (shelf.active) return shelf.p * shelf.span
    const max = document.documentElement.scrollHeight - window.innerHeight
    return max > 0 ? window.scrollY / max * 12 : 0
  }
  function frame(now: number) {
    const t = now / 1000, dt = Math.min(0.05, (now - lastT) / 1000 || 0.016); lastT = now
    camX += (START_X + progress() - camX) * (reducedMotion ? 1 : 0.09)
    const bob = reducedMotion ? 0 : Math.sin(t * 0.35) * 0.05
    camera.position.set(camX, 2.1 + bob, 7.2)
    camera.lookAt(camX, 2.2, 0)

    // lamps are evenly spaced, so the five nearest are a window around the closest one
    const step = lampXs.length > 1 ? lampXs[1]! - lampXs[0]! : 1
    const first = Math.max(0, Math.min(lampXs.length - lights.length, Math.round((camX - lampXs[0]!) / step) - 2))
    for (let li = 0; li < lights.length; li++) lights[li]!.position.set(lampXs[first + li] || 0, 4.4, 1.25)

    if (!reducedMotion && !light) {
      for (let i = 0; i < DUST; i++) {
        dpos[i * 3 + 1]! += dvel[i]! * dt * 4
        dpos[i * 3]! += Math.sin(t * 0.3 + i) * dt * 0.05
        if (dpos[i * 3 + 1]! > 4.9) dpos[i * 3 + 1] = 0
        const rel = dpos[i * 3]! - (camX - 10)
        if (rel < 0 || rel > 20) dpos[i * 3] = camX - 10 + ((rel % 20) + 20) % 20
      }
      dgeo.attributes.position!.needsUpdate = true
    }

    if (isHome && hasMouse && !reducedMotion && mouseMoved) {
      mouseMoved = false
      ray.setFromCamera(mouse, camera)
      const hitP = ray.ray.intersectPlane(shelfFront, hitV) ? hitV : null
      const el = document.elementFromPoint(lastPX, lastPY)
      const free = !el || !el.closest('.panel-box, .hero, .bar, .viewer')
      const id = hitP && free ? bookAt(hitP.x, hitP.y) : -1
      if (id !== hovered) { if (hovered >= 0) pullGoal[hovered] = 0; if (id >= 0) pullGoal[id] = 0.17; hovered = id }
    }
    dirty.fill(0)
    for (let i = 0; i < books.length; i++) {
      if (pull[i] !== pullGoal[i]) {
        pull[i]! += (pullGoal[i]! - pull[i]!) * 0.18
        if (Math.abs(pull[i]! - pullGoal[i]!) < 0.001) pull[i] = pullGoal[i]!
        placeBook(i); dirty[groupOf[i]!] = 1
      }
    }
    for (let gd = 0; gd < meshes.length; gd++) if (dirty[gd]) meshes[gd]!.instanceMatrix.needsUpdate = true
    renderer.render(scene, camera)
  }

  L.on(window, 'resize', () => { size(); frame(performance.now()) })
  L.on(window, 'themechange', () => { colours(); frame(performance.now()) })
  L.on(window.matchMedia('(prefers-color-scheme: light)'), 'change', () => { colours(); frame(performance.now()) })

  let raf = 0
  if (reducedMotion || !isHome) {
    frame(performance.now())
    L.on(window, 'scroll', () => { raf = requestAnimationFrame(frame) }, { passive: true })
  } else {
    let running = true
    const loop = (now: number) => { if (!running) return; frame(now); raf = requestAnimationFrame(loop) }
    raf = requestAnimationFrame(loop)
    L.on(document, 'visibilitychange', () => { running = !document.hidden; if (running) raf = requestAnimationFrame(loop) })
    L.add(() => { running = false })
  }

  return () => {
    cancelAnimationFrame(raf)
    L.clear()
    scene.traverse((o) => {
      const m = o as THREE.Mesh
      m.geometry?.dispose()
      const mat = m.material as THREE.Material | THREE.Material[] | undefined
      ;(Array.isArray(mat) ? mat : mat ? [mat] : []).forEach((x) => x.dispose())
    })
    renderer.dispose()
    renderer.forceContextLoss()
  }
}
