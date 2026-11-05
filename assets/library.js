// Background: a 3D library wall. Wooden bookcases full of leather-bound books run
// sideways under brass lamps, with dust drifting in the light. On the home page the
// camera glides along the shelves as you scroll (see the sideways scroll in site.js),
// and a book slides out when you point at it. Project pages show the shelves faint
// and still. Every texture is drawn in code, so there are no image files to load.
// Uses three.js r128.
(function () {
  var canvas = document.querySelector('canvas.bg3d');
  if (!canvas || !window.THREE) { if (canvas) canvas.remove(); return; }
  var T = window.THREE;
  var renderer;
  try { renderer = new T.WebGLRenderer({ canvas: canvas, antialias: true, alpha: false }); }
  catch (e) { canvas.remove(); return; }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));

  var isHome = document.body.dataset.bg === 'intro';
  var still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var scene = new T.Scene();
  var camera = new T.PerspectiveCamera(44, 1, 0.1, 80);

  // Seeded random, so the shelves look the same on every visit.
  var seed = 11;
  function rnd() { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; }
  function mkCanvas(w, h) { var c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
  function tex(c, rx, ry) {
    var t = new T.CanvasTexture(c);
    t.wrapS = t.wrapT = T.RepeatWrapping; t.repeat.set(rx || 1, ry || 1);
    t.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
    return t;
  }

  // ---------- layout ----------
  var UNIT = 2.3, H = 4.3, DEPTH = 0.62, ROWS = [0.14, 1.0, 1.86, 2.72, 3.58], BOARD = 0.07;
  var START = -14, UNITS = 52, wallLen = UNITS * UNIT;

  // ---------- wood ----------
  function woodCanvas(base, dark, w, h, vertical) {
    var c = mkCanvas(w, h), g = c.getContext('2d');
    g.fillStyle = base; g.fillRect(0, 0, w, h);
    var lines = vertical ? w : h;
    for (var i = 0; i < 260; i++) {
      var p = rnd() * lines, wave = 2 + rnd() * 6, alpha = 0.04 + rnd() * 0.14;
      g.strokeStyle = (rnd() < 0.6 ? dark : 'rgba(255,230,200,1)');
      g.globalAlpha = alpha * (g.strokeStyle === 'rgba(255,230,200,1)' ? 0.35 : 1);
      g.lineWidth = 0.6 + rnd() * 1.6;
      g.beginPath();
      var len = vertical ? h : w, ph = rnd() * 6;
      for (var s = 0; s <= len; s += 8) {
        var o = Math.sin(s / (40 + wave * 20) + ph) * wave;
        if (vertical) { if (s === 0) g.moveTo(p + o, s); else g.lineTo(p + o, s); }
        else { if (s === 0) g.moveTo(s, p + o); else g.lineTo(s, p + o); }
      }
      g.stroke();
    }
    g.globalAlpha = 1;
    return c;
  }
  var woodC = mkCanvas(1, 1), panelC = mkCanvas(1, 1);
  var woodTex = tex(woodC), panelTex = tex(panelC, 18, 1);
  var frameMat = new T.MeshStandardMaterial({ map: woodTex, roughness: 0.62, metalness: 0.0 });
  var wallMat = new T.MeshStandardMaterial({ map: panelTex, roughness: 0.9 });
  var floorMat = new T.MeshStandardMaterial({ roughness: 0.7 });
  var brassMat = new T.MeshStandardMaterial({ color: 0xb08a3e, roughness: 0.35, metalness: 0.85 });
  var bulbMat = new T.MeshBasicMaterial({ color: 0xffe08a });

  var wall = new T.Mesh(new T.PlaneGeometry(wallLen + 40, 12), wallMat);
  wall.position.set(START + wallLen / 2, 5, -DEPTH - 0.01); scene.add(wall);
  var floor = new T.Mesh(new T.PlaneGeometry(wallLen + 40, 30), floorMat);
  floor.rotation.x = -Math.PI / 2; floor.position.set(START + wallLen / 2, 0, 10); scene.add(floor);

  // ---------- bookcase frames ----------
  var box = new T.BoxGeometry(1, 1, 1);
  var frames = [];
  for (var u = 0; u < UNITS; u++) {
    var x0 = START + u * UNIT;
    frames.push([x0, H / 2, -DEPTH / 2 + 0.03, 0.09, H, DEPTH + 0.06]);
    ROWS.forEach(function (y) { frames.push([x0 + UNIT / 2, y - BOARD / 2, -DEPTH / 2 + 0.02, UNIT, BOARD, DEPTH]); });
    frames.push([x0 + UNIT / 2, H + 0.04, -DEPTH / 2 + 0.05, UNIT + 0.12, 0.16, DEPTH + 0.12]); // cornice
    frames.push([x0 + UNIT / 2, 0.07, 0.0, UNIT, 0.14, 0.05]);                                     // plinth
  }
  frames.push([START + UNITS * UNIT, H / 2, -DEPTH / 2 + 0.03, 0.09, H, DEPTH + 0.06]);
  var frameMesh = new T.InstancedMesh(box, frameMat, frames.length);
  var m4 = new T.Matrix4(), q = new T.Quaternion(), v = new T.Vector3(), sc = new T.Vector3();
  frames.forEach(function (f, i) {
    m4.compose(v.set(f[0], f[1], f[2]), q.set(0, 0, 0, 1), sc.set(f[3], f[4], f[5]));
    frameMesh.setMatrixAt(i, m4);
  });
  scene.add(frameMesh);

  // Soft shadow at the back and top of every shelf, so the books sit inside the case.
  var shadeC = mkCanvas(4, 128), sg = shadeC.getContext('2d'), grd = sg.createLinearGradient(0, 0, 0, 128);
  grd.addColorStop(0, 'rgba(0,0,0,.85)'); grd.addColorStop(0.35, 'rgba(0,0,0,.35)'); grd.addColorStop(1, 'rgba(0,0,0,0)');
  sg.fillStyle = grd; sg.fillRect(0, 0, 4, 128);
  var aoMat = new T.MeshBasicMaterial({ map: new T.CanvasTexture(shadeC), transparent: true, depthWrite: false });
  var aoGeo = new T.PlaneGeometry(1, 1);
  var aoMesh = new T.InstancedMesh(aoGeo, aoMat, UNITS * ROWS.length);
  var ai = 0;
  for (u = 0; u < UNITS; u++) ROWS.forEach(function (y, r) {
    var top = (ROWS[r + 1] || H) - BOARD;
    m4.compose(v.set(START + u * UNIT + UNIT / 2, top - 0.22, -DEPTH + 0.02), q.set(0, 0, 0, 1), sc.set(UNIT, 0.44, 1));
    aoMesh.setMatrixAt(ai++, m4);
  });
  scene.add(aoMesh);

  // ---------- books ----------
  var books = [];
  for (u = 0; u < UNITS; u++) {
    for (var r = 0; r < ROWS.length; r++) {
      var y0 = ROWS[r], gap = (ROWS[r + 1] || H) - y0 - BOARD;
      var x = START + u * UNIT + 0.1, end = START + (u + 1) * UNIT - 0.07, stackDone = false;
      while (x < end - 0.05) {
        var roll = rnd();
        if (roll < 0.04) { x += 0.08 + rnd() * 0.2; continue; }
        if (!stackDone && roll < 0.09 && end - x > 0.5) {
          var sw = 0.36 + rnd() * 0.12, n = 2 + Math.floor(rnd() * 3), sy = y0;
          for (var k = 0; k < n; k++) {
            var th = 0.05 + rnd() * 0.04;
            books.push({ x: x + sw / 2 + (rnd() - 0.5) * 0.03, y: sy + th / 2, z: -0.27, w: sw, h: th, d: 0.3 + rnd() * 0.06, rz: 0, flat: true, tone: rnd() });
            sy += th;
          }
          x += sw + 0.05; stackDone = true; continue;
        }
        var w = 0.045 + rnd() * 0.075, h = Math.min(gap - 0.04, gap * (0.64 + rnd() * 0.32)), d = 0.34 + rnd() * 0.16;
        var lean = (rnd() < 0.035 && x + w + 0.12 < end) ? 0.16 + rnd() * 0.12 : 0;
        if (lean) {
          books.push({ x: x + w / 2 + Math.sin(lean) * h / 2, y: y0 + Math.cos(lean) * h / 2, z: -DEPTH + d / 2 + 0.05, w: w, h: h, d: d, rz: -lean, tone: rnd() });
          x += w + Math.sin(lean) * h + 0.01;
        } else {
          books.push({ x: x + w / 2, y: y0 + h / 2, z: -DEPTH + d / 2 + 0.04 + rnd() * 0.05, w: w, h: h, d: d, rz: 0, tone: rnd() });
          x += w + 0.003;
        }
      }
    }
  }

  // Spine designs: each group of books shares one drawn spine and cover colour.
  var GROUPS = 14;
  var spineCanvases = [], spineMats = [], coverMats = [];
  var pagesMat = new T.MeshStandardMaterial({ color: 0xe9dcc0, roughness: 0.95 });
  for (var gi = 0; gi < GROUPS; gi++) {
    var c = mkCanvas(64, 256);
    spineCanvases.push({ c: c, style: Math.floor(rnd() * 4), bands: 1 + Math.floor(rnd() * 3), title: 0.3 + rnd() * 0.25 });
    spineMats.push(new T.MeshStandardMaterial({ map: tex(c), roughness: 0.55 }));
    coverMats.push(new T.MeshStandardMaterial({ roughness: 0.7 }));
  }
  function drawSpine(s, base, gold) {
    var g = s.c.getContext('2d'), W = 64, Hh = 256;
    g.fillStyle = base; g.fillRect(0, 0, W, Hh);
    var gr = g.createLinearGradient(0, 0, W, 0);                       // rounded spine shading
    gr.addColorStop(0, 'rgba(0,0,0,.45)'); gr.addColorStop(0.3, 'rgba(255,255,255,.10)');
    gr.addColorStop(0.55, 'rgba(255,255,255,.04)'); gr.addColorStop(1, 'rgba(0,0,0,.5)');
    g.fillStyle = gr; g.fillRect(0, 0, W, Hh);
    for (var i = 0; i < 900; i++) {                                    // leather grain
      g.fillStyle = rnd() < 0.5 ? 'rgba(0,0,0,.08)' : 'rgba(255,255,255,.04)';
      g.fillRect(rnd() * W, rnd() * Hh, 1.5, 1.5);
    }
    g.fillStyle = gold;
    var bandY = [22, 230];
    if (s.style !== 3) bandY.forEach(function (y) { g.fillRect(4, y, W - 8, 3); g.fillRect(4, y + 6, W - 8, 1.5); });
    for (var b = 0; b < s.bands; b++) {                                // raised bands
      var y = 60 + b * 50;
      g.fillStyle = 'rgba(0,0,0,.35)'; g.fillRect(0, y + 3, W, 3);
      g.fillStyle = 'rgba(255,255,255,.14)'; g.fillRect(0, y - 1, W, 3);
      if (s.style < 2) { g.fillStyle = gold; g.fillRect(6, y + 8, W - 12, 1.5); }
    }
    if (s.style !== 2) {                                               // title label
      var ty = Hh * s.title;
      if (s.style === 1) { g.fillStyle = 'rgba(0,0,0,.4)'; g.fillRect(8, ty - 4, W - 16, 34); }
      g.fillStyle = gold;
      for (var l = 0; l < 3; l++) g.fillRect(14 + (l % 2) * 6, ty + l * 9, W - 28 - (l % 2) * 12, 3);
    }
  }
  var groupOf = books.map(function (b) { return Math.floor(b.tone * GROUPS) % GROUPS; });
  var meshes = [], idxIn = [], counts = new Array(GROUPS).fill(0);
  books.forEach(function (b, i) { idxIn[i] = counts[groupOf[i]]++; });
  for (gi = 0; gi < GROUPS; gi++) {
    // BoxGeometry faces: +x, -x, +y, -y, +z (spine, facing the room), -z
    var mesh = new T.InstancedMesh(box, [coverMats[gi], coverMats[gi], pagesMat, pagesMat, spineMats[gi], coverMats[gi]], Math.max(1, counts[gi]));
    mesh.count = counts[gi];
    mesh.userData.g = gi;
    meshes.push(mesh); scene.add(mesh);
  }
  var byGroup = meshes.map(function () { return []; });
  books.forEach(function (b, i) { byGroup[groupOf[i]][idxIn[i]] = i; });
  var pull = new Float32Array(books.length), pullGoal = new Float32Array(books.length);
  var e3 = new T.Euler();
  function placeBook(i) {
    var b = books[i];
    e3.set(0, 0, b.rz); q.setFromEuler(e3);
    m4.compose(v.set(b.x, b.y, b.z + pull[i]), q, sc.set(b.w, b.h, b.d));
    meshes[groupOf[i]].setMatrixAt(idxIn[i], m4);
  }
  for (var i = 0; i < books.length; i++) placeBook(i);

  // ---------- brass lamps ----------
  var glowTex = (function () {
    var c = mkCanvas(128, 128), g = c.getContext('2d'), gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    gr.addColorStop(0, 'rgba(255,224,140,1)'); gr.addColorStop(0.22, 'rgba(255,196,90,.55)'); gr.addColorStop(1, 'rgba(255,180,60,0)');
    g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
    return new T.CanvasTexture(c);
  })();
  var lampXs = [], glows = [];
  var shadeGeo = new T.CylinderGeometry(0.09, 0.3, 0.26, 28, 1, true);
  var bulbGeo = new T.SphereGeometry(0.075, 14, 10);
  var cordGeo = new T.CylinderGeometry(0.008, 0.008, 1.4, 6);
  var capGeo = new T.CylinderGeometry(0.05, 0.05, 0.08, 12);
  for (u = 0; u < UNITS; u += 2) {
    var lx = START + u * UNIT + UNIT;
    lampXs.push(lx);
    var grp = new T.Group(); grp.position.set(lx, 4.8, 0.85);
    var shade = new T.Mesh(shadeGeo, brassMat); shade.material.side = T.DoubleSide; grp.add(shade);
    var cap = new T.Mesh(capGeo, brassMat); cap.position.y = 0.16; grp.add(cap);
    var bulb = new T.Mesh(bulbGeo, bulbMat); bulb.position.y = -0.08; grp.add(bulb);
    var cord = new T.Mesh(cordGeo, brassMat); cord.position.y = 0.88; grp.add(cord);
    var spr = new T.Sprite(new T.SpriteMaterial({ map: glowTex, transparent: true, depthWrite: false, blending: T.AdditiveBlending }));
    spr.scale.set(1.7, 1.7, 1); spr.position.y = -0.16; grp.add(spr); glows.push(spr);
    scene.add(grp);
  }
  var lights = [];
  for (i = 0; i < 5; i++) { var pl = new T.PointLight(0xffc060, 1, 8, 1.5); scene.add(pl); lights.push(pl); }
  var amb = new T.AmbientLight(0xffffff, 0.3); scene.add(amb);
  var hemi = new T.HemisphereLight(0xffe2c0, 0x2a1012, 0.35); scene.add(hemi);
  var key = new T.DirectionalLight(0xffe6c8, 0.25); key.position.set(-3, 6, 8); scene.add(key);

  // ---------- dust ----------
  var DUST = 500, dpos = new Float32Array(DUST * 3), dvel = new Float32Array(DUST);
  for (i = 0; i < DUST; i++) { dpos[i * 3] = (rnd() - 0.5) * 20; dpos[i * 3 + 1] = rnd() * 4.8; dpos[i * 3 + 2] = 0.2 + rnd() * 4.5; dvel[i] = 0.02 + rnd() * 0.05; }
  var dgeo = new T.BufferGeometry(); dgeo.setAttribute('position', new T.BufferAttribute(dpos, 3));
  var dmat = new T.PointsMaterial({ size: 0.03, transparent: true, depthWrite: false, opacity: 0.6, blending: T.AdditiveBlending, map: glowTex });
  scene.add(new T.Points(dgeo, dmat));

  // ---------- theme ----------
  var light = false;
  function hex(s) { return parseInt(String(s).trim().replace('#', ''), 16); }
  function css(n) { return '#' + ('000000' + n.toString(16)).slice(-6); }
  function colours() {
    var bg = new T.Color(hex(getComputedStyle(document.documentElement).getPropertyValue('--bg') || '#160A0C'));
    light = bg.r > 0.5;
    scene.background = bg;
    scene.fog = new T.Fog(bg, light ? 9 : 8, light ? 26 : 22);
    renderer.setClearColor(bg);

    // leather: oxblood, crimson, burgundy, brown, tan, forest, black, navy, mustard, cream
    var pal = light
      ? [0x8f2a36, 0xa8404b, 0x7a2c30, 0x8a6448, 0xae9170, 0x51665a, 0x3f3c40, 0x47536b, 0xc29a32, 0xe3d8c2, 0x9c4c42, 0x6e3e33, 0xc8b08c, 0x632631]
      : [0x5e1419, 0x7c1c24, 0x4a1015, 0x4b2a19, 0x7a5430, 0x1f3326, 0x1a1414, 0x1c2438, 0xa67c12, 0xcbbd9b, 0x8a2a1f, 0x3a1a14, 0x9a7a4a, 0x611828];
    var gold = light ? '#8a6a10' : '#d8b545';
    for (var gi = 0; gi < GROUPS; gi++) {
      var c = pal[gi % pal.length];
      drawSpine(spineCanvases[gi], css(c), c === 0xe8dcc0 || c === 0xcbbd9b || c === 0xd6b98a ? (light ? '#7a1f2a' : '#6a1a20') : gold);
      spineMats[gi].map.needsUpdate = true;
      coverMats[gi].color.setHex(c).multiplyScalar(0.82);
    }
    pagesMat.color.setHex(light ? 0xf0e6d0 : 0xb7a888);
    woodC.width = 512; woodC.height = 512; woodC.getContext('2d').drawImage(woodCanvas(light ? '#a8896c' : '#3a2218', light ? 'rgba(80,52,34,1)' : 'rgba(10,4,2,1)', 512, 512, false), 0, 0);
    woodTex.needsUpdate = true;
    panelC.width = 256; panelC.height = 256; panelC.getContext('2d').drawImage(woodCanvas(light ? '#8c735f' : '#1f110d', light ? 'rgba(55,35,22,1)' : 'rgba(0,0,0,1)', 256, 256, true), 0, 0);
    panelTex.needsUpdate = true;
    frameMat.color.setHex(light ? 0xe8e2dc : 0xffffff);
    wallMat.color.setHex(light ? 0xd8c8b6 : 0x7a5a50);
    floorMat.color.setHex(light ? 0xd9cfc4 : 0x140808);
    aoMat.opacity = light ? 0.45 : 0.9;
    lights.forEach(function (l) { l.intensity = light ? 0.28 : 1.35; l.color.setHex(light ? 0xffd27a : 0xffbc55); });
    amb.intensity = light ? 0.42 : 0.22;
    hemi.intensity = light ? 0.32 : 0.3;
    hemi.groundColor.setHex(light ? 0xc8b49c : 0x2a0e10);
    key.intensity = light ? 0.45 : 0.16;
    glows.forEach(function (s) { s.material.opacity = light ? 0.45 : 1; });
    dmat.opacity = light ? 0.0 : 0.55;
  }
  colours();

  function size() {
    var w = canvas.clientWidth, h = canvas.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.fov = w / h < 0.9 ? 58 : 44;
    camera.updateProjectionMatrix();
  }
  size();

  // ---------- input ----------
  var mouse = new T.Vector2(9, 9), hasMouse = false, look = [0, 0], lookGoal = [0, 0];
  var ray = new T.Raycaster(), hovered = -1, mouseMoved = false, lastPX = 0, lastPY = 0;
  window.addEventListener('pointermove', function (e) {
    lastPX = e.clientX; lastPY = e.clientY;
    if (e.pointerType !== 'mouse') return;
    mouse.set(e.clientX / window.innerWidth * 2 - 1, -(e.clientY / window.innerHeight) * 2 + 1);
    lookGoal = [mouse.x, mouse.y]; hasMouse = true; mouseMoved = true;
  });
  document.addEventListener('pointerleave', function () { hasMouse = false; lookGoal = [0, 0]; });

  // ---------- frame ----------
  var START_X = START + 8, camX = START_X, lastT = 0;
  function progress() {
    var s = window.shelfScroll;
    if (s && s.active) return s.p * s.span;
    var max = document.documentElement.scrollHeight - window.innerHeight;
    return max > 0 ? window.scrollY / max * 12 : 0;
  }
  function frame(now) {
    var t = now / 1000, dt = Math.min(0.05, (now - lastT) / 1000 || 0.016); lastT = now;
    camX += (START_X + progress() - camX) * (still ? 1 : 0.09);
    look[0] += (lookGoal[0] - look[0]) * 0.05; look[1] += (lookGoal[1] - look[1]) * 0.05;
    var bob = still ? 0 : Math.sin(t * 0.35) * 0.05;
    camera.position.set(camX + look[0] * 0.6, 2.1 + bob + look[1] * 0.3, 7.2);
    camera.lookAt(camX + look[0] * 0.25, 2.2 + look[1] * 0.1, 0);

    var near = lampXs.slice().sort(function (a, b) { return Math.abs(a - camX) - Math.abs(b - camX); });
    lights.forEach(function (l, i) { l.position.set(near[i] || 0, 4.4, 1.25); });

    if (!still && !light) {
      for (var i = 0; i < DUST; i++) {
        dpos[i * 3 + 1] += dvel[i] * dt * 4;
        dpos[i * 3] += Math.sin(t * 0.3 + i) * dt * 0.05;
        if (dpos[i * 3 + 1] > 4.9) dpos[i * 3 + 1] = 0;
        var rel = dpos[i * 3] - (camX - 10);
        if (rel < 0 || rel > 20) dpos[i * 3] = camX - 10 + ((rel % 20) + 20) % 20;
      }
      dgeo.attributes.position.needsUpdate = true;
    }

    if (isHome && hasMouse && !still && mouseMoved) {
      mouseMoved = false;
      ray.setFromCamera(mouse, camera);
      var hit = ray.intersectObjects(meshes, false)[0];
      var el = document.elementFromPoint(lastPX, lastPY);
      var free = !el || !el.closest('.panel-box, .hero, .bar, .viewer');
      var id = hit && free ? byGroup[hit.object.userData.g][hit.instanceId] : -1;
      if (id !== hovered) { if (hovered >= 0) pullGoal[hovered] = 0; if (id >= 0) pullGoal[id] = 0.17; hovered = id; }
    }
    var dirty = {};
    for (i = 0; i < books.length; i++) {
      if (pull[i] !== pullGoal[i]) {
        pull[i] += (pullGoal[i] - pull[i]) * 0.18;
        if (Math.abs(pull[i] - pullGoal[i]) < 0.001) pull[i] = pullGoal[i];
        placeBook(i); dirty[groupOf[i]] = 1;
      }
    }
    Object.keys(dirty).forEach(function (g) { meshes[g].instanceMatrix.needsUpdate = true; });
    renderer.render(scene, camera);
  }

  window.addEventListener('resize', function () { size(); frame(performance.now()); });
  window.addEventListener('themechange', function () { colours(); frame(performance.now()); });
  window.matchMedia('(prefers-color-scheme: light)').addEventListener('change', function () { colours(); frame(performance.now()); });

  if (still || !isHome) {
    frame(performance.now());
    window.addEventListener('scroll', function () { requestAnimationFrame(frame); }, { passive: true });
    return;
  }
  var running = true;
  function loop(now) { if (!running) return; frame(now); requestAnimationFrame(loop); }
  requestAnimationFrame(loop);
  document.addEventListener('visibilitychange', function () { running = !document.hidden; if (running) requestAnimationFrame(loop); });
})();
