// Background: flowing lines. Rows of thin 3D lines roll like silk or a slow ocean swell.
// The lines lift and glow yellow where the pointer passes, and a click sends a ripple
// through them. Behind the home page intro the camera looks across the lines; as you
// scroll it tips to look straight down and the lines settle into calm straight rows.
// Project pages (data-bg="flat") stay flat. Plain WebGL, no library.
(function () {
  var canvas = document.querySelector('canvas.bg3d');
  if (!canvas) return;
  var gl = canvas.getContext('webgl', { antialias: true, alpha: false });
  if (!gl) { canvas.remove(); return; }

  var LINES = 76, SEGS = 280, X0 = -30, X1 = 30, Z0 = 14, DZ = 0.8;
  var n = LINES * SEGS * 2, data = new Float32Array(n * 2), k = 0;
  for (var l = 0; l < LINES; l++) {
    var z = Z0 - l * DZ;
    for (var s = 0; s < SEGS; s++) {
      var xa = X0 + (X1 - X0) * s / SEGS, xb = X0 + (X1 - X0) * (s + 1) / SEGS;
      data[k++] = xa; data[k++] = z; data[k++] = xb; data[k++] = z;
    }
  }

  var vs = [
    'attribute vec2 xz;',
    'uniform mat4 vp; uniform float t; uniform float depth; uniform vec2 hover; uniform float hoverOn; uniform vec4 rip[3];',
    'varying float vHot; varying float vDist; varying float vY;',
    'void main(){',
    '  float x = xz.x, z = xz.y;',
    '  float w = sin(x * 0.22 + t * 0.55 + z * 0.18) * 0.55',
    '          + sin(x * 0.09 - t * 0.35 + z * 0.32) * 0.75',
    '          + sin((x + z) * 0.35 + t * 0.8) * 0.18;',
    '  vec2 dm = xz - hover;',
    '  float m = hoverOn * exp(-dot(dm, dm) / 14.0);',
    '  float rp = 0.0;',
    '  for (int i = 0; i < 3; i++) {',
    '    float d = length(xz - rip[i].xy); float a = rip[i].z;',
    '    rp += rip[i].w * exp(-pow(d - a * 8.0, 2.0) / 2.5) * exp(-a * 0.8);',
    '  }',
    '  float y = (w + m * 1.6 + rp * 1.3) * depth;',
    '  gl_Position = vp * vec4(x, y, z, 1.0);',
    '  vDist = gl_Position.w; vY = w;',
    '  vHot = clamp(smoothstep(0.6, 1.25, w) * 0.75 + m * 1.5 + rp * 1.2, 0.0, 1.0);',
    '}'
  ].join('\n');
  var fs = [
    'precision mediump float;',
    'uniform vec3 lineCol; uniform vec3 accent; uniform vec2 res; uniform float fogFar; uniform float alphaMul; uniform float flatness;',
    'varying float vHot; varying float vDist; varying float vY;',
    'void main(){',
    '  float side = smoothstep(0.1, 0.7, abs(gl_FragCoord.x / res.x - 0.5) * 2.0);',
    '  float quiet = mix(0.45, 1.0, side);',
    '  float fog = 1.0 - smoothstep(fogFar * 0.5, fogFar, vDist);',
    '  float glow = vHot * quiet * (1.0 - 0.5 * flatness);',
    '  vec3 c = mix(lineCol, accent, glow);',
    '  float a = (0.28 + 0.22 * (vY * 0.5 + 0.5) + 0.5 * glow) * fog * quiet * alphaMul;',
    '  gl_FragColor = vec4(c, a);',
    '}'
  ].join('\n');
  function sh(type, src) { var s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) console.warn(gl.getShaderInfoLog(s)); return s; }
  var prog = gl.createProgram();
  gl.attachShader(prog, sh(gl.VERTEX_SHADER, vs)); gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, fs));
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) { console.warn(gl.getProgramInfoLog(prog)); canvas.remove(); return; }
  gl.useProgram(prog);
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
  var loc = gl.getAttribLocation(prog, 'xz');
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  var u = {};
  ['vp', 't', 'depth', 'hover', 'hoverOn', 'rip', 'lineCol', 'accent', 'res', 'fogFar', 'alphaMul', 'flatness'].forEach(function (nm) { u[nm] = gl.getUniformLocation(prog, nm); });
  gl.enable(gl.BLEND);

  // ---------- camera ----------
  var FOV = 40 * Math.PI / 180, W = 0, H = 0, aspect = 1;
  function camera(depth) {
    var pitch = 0.42 + (1 - depth) * (Math.PI / 2 - 0.42);   // low over the swell, then straight down
    var dist = 14 + (1 - depth) * 4;
    var eye = [0, Math.sin(pitch) * dist + 0.5 * depth, Math.cos(pitch) * dist + depth * 4];
    var target = [0, 0, depth * 4 - 6 * depth];
    var f = norm(sub(target, eye));
    var upHint = Math.abs(f[1]) > 0.999 ? [0, 0, -1] : [0, 1, 0];
    var r = norm(cross(f, upHint)), up = cross(r, f);
    return { eye: eye, f: f, r: r, u: up };
  }
  function sub(a, b) { return [a[0] - b[0], a[1] - b[1], a[2] - b[2]]; }
  function cross(a, b) { return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]; }
  function dot(a, b) { return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]; }
  function norm(a) { var len = Math.hypot(a[0], a[1], a[2]); return [a[0] / len, a[1] / len, a[2] / len]; }
  function viewProj(cam) {
    var e = cam.eye, f = cam.f, r = cam.r, up = cam.u;
    var view = [r[0], up[0], -f[0], 0, r[1], up[1], -f[1], 0, r[2], up[2], -f[2], 0, -dot(r, e), -dot(up, e), dot(f, e), 1];
    var near = 0.5, far = 120, ft = 1 / Math.tan(FOV / 2);
    var proj = [ft / aspect, 0, 0, 0, 0, ft, 0, 0, 0, 0, (far + near) / (near - far), -1, 0, 0, 2 * far * near / (near - far), 0];
    var out = new Float32Array(16);
    for (var i = 0; i < 4; i++) for (var j = 0; j < 4; j++) {
      var s = 0; for (var q = 0; q < 4; q++) s += proj[q * 4 + j] * view[i * 4 + q];
      out[i * 4 + j] = s;
    }
    return out;
  }
  function pick(px, py, cam) {   // where the pointer meets the water (y = 0)
    var nx = (px / W) * 2 - 1, ny = 1 - (py / H) * 2, tn = Math.tan(FOV / 2);
    var d = norm([cam.f[0] + nx * tn * aspect * cam.r[0] + ny * tn * cam.u[0],
                  cam.f[1] + nx * tn * aspect * cam.r[1] + ny * tn * cam.u[1],
                  cam.f[2] + nx * tn * aspect * cam.r[2] + ny * tn * cam.u[2]]);
    if (d[1] > -0.01) return null;
    var s = -cam.eye[1] / d[1];
    return [cam.eye[0] + d[0] * s, cam.eye[2] + d[2] * s];
  }

  var dpr = Math.min(window.devicePixelRatio || 1, 2);
  function size() {
    W = canvas.clientWidth; H = canvas.clientHeight; aspect = W / H;
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.uniform2f(u.res, canvas.width, canvas.height);
  }
  function hex(v) { v = v.trim().replace('#', ''); return [0, 2, 4].map(function (i) { return parseInt(v.substr(i, 2), 16) / 255; }); }
  function colours() {
    var bg = hex(getComputedStyle(document.documentElement).getPropertyValue('--bg'));
    var light = bg[0] > 0.5;
    gl.clearColor(bg[0], bg[1], bg[2], 1);
    gl.uniform3fv(u.lineCol, light ? [0.0, 0.0, 0.0] : [0.45, 0.60, 0.88]);
    gl.uniform3fv(u.accent, light ? [0.88, 0.64, 0.0] : [0.98, 0.80, 0.15]);
    gl.uniform1f(u.alphaMul, light ? 1.0 : 1.0);
    gl.blendFunc(gl.SRC_ALPHA, light ? gl.ONE_MINUS_SRC_ALPHA : gl.ONE);
  }
  size(); colours();

  var pointer = null, hover = [0, 0], hoverOn = 0, ripples = [];
  window.addEventListener('pointermove', function (e) { pointer = [e.clientX, e.clientY]; });
  document.addEventListener('pointerleave', function () { pointer = null; });
  window.addEventListener('pointerdown', function (e) {
    var p = pick(e.clientX, e.clientY, camera(depthNow()));
    if (!p) return;
    ripples.push({ x: p[0], z: p[1], start: performance.now() });
    if (ripples.length > 3) ripples.shift();
  });

  var isIntro = document.body.dataset.bg === 'intro';
  function depthNow() {
    var intro = isIntro && document.querySelector('.hero');
    if (!intro) return 0;
    var k = Math.min(1, Math.max(0, window.scrollY / Math.max(200, intro.offsetHeight * 0.8)));
    return 1 - k * k * (3 - 2 * k);
  }

  var still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function draw(now) {
    var depth = depthNow(), cam = camera(depth);
    gl.uniformMatrix4fv(u.vp, false, viewProj(cam));
    gl.uniform1f(u.t, still ? 8 : now / 1000);
    gl.uniform1f(u.depth, depth);
    gl.uniform1f(u.flatness, 1 - depth);
    gl.uniform1f(u.fogFar, 52 + (1 - depth) * 20);
    var target = pointer && pick(pointer[0], pointer[1], cam);
    if (target) { hover[0] += (target[0] - hover[0]) * 0.12; hover[1] += (target[1] - hover[1]) * 0.12; }
    hoverOn += ((target && !still ? 1 : 0) - hoverOn) * 0.08;
    gl.uniform2f(u.hover, hover[0], hover[1]);
    gl.uniform1f(u.hoverOn, hoverOn);
    var rp = new Float32Array(12);
    ripples = ripples.filter(function (r) { return now - r.start < 5000; });
    ripples.forEach(function (r, i) { rp[i * 4] = r.x; rp[i * 4 + 1] = r.z; rp[i * 4 + 2] = (now - r.start) / 1000; rp[i * 4 + 3] = still ? 0 : 1; });
    gl.uniform4fv(u.rip, rp);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.LINES, 0, n);
  }
  function redraw() { draw(performance.now()); }
  window.addEventListener('resize', function () { size(); redraw(); });
  window.addEventListener('themechange', function () { colours(); redraw(); });
  window.matchMedia('(prefers-color-scheme: light)').addEventListener('change', function () { colours(); redraw(); });
  if (still) { redraw(); window.addEventListener('scroll', redraw, { passive: true }); return; }
  var running = true;
  function loop(now) { if (!running) return; draw(now); requestAnimationFrame(loop); }
  requestAnimationFrame(loop);
  document.addEventListener('visibilitychange', function () { running = !document.hidden; if (running) requestAnimationFrame(loop); });
})();
