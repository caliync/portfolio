// Background: a 3D capiz-shell window. Raised shell panes sit in a frame that tilts
// gently toward the pointer. A slow warm "sun" and the pointer light the bevelled
// edges, and each pane casts a small shadow on the frame. The middle stays quiet so
// the text is easy to read. Plain WebGL, no library.
(function () {
  var canvas = document.querySelector('canvas.capiz');
  if (!canvas) return;
  var gl = canvas.getContext('webgl', { antialias: false, alpha: false });
  if (!gl) { canvas.remove(); return; }

  var vs = 'attribute vec2 p; void main(){ gl_Position = vec4(p, 0.0, 1.0); }';
  var fs = [
    'precision mediump float;',
    'uniform vec2 res; uniform float t; uniform vec2 mouse; uniform vec2 tilt; uniform float scroll; uniform float cell;',
    'uniform vec3 bg; uniform vec3 warm; uniform vec3 cool; uniform float strength; uniform float light; uniform float depth;',
    'float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }',
    // rounded pane: negative inside
    'float sd(vec2 f){ vec2 q = abs(f) - 0.33; return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - 0.07; }',
    'float height(vec2 f){ return smoothstep(0.0, 0.13, -sd(f)); }',
    'vec3 rx(vec3 v, float a){ float c = cos(a), s = sin(a); return vec3(v.x, c*v.y - s*v.z, s*v.y + c*v.z); }',
    'vec3 ry(vec3 v, float a){ float c = cos(a), s = sin(a); return vec3(c*v.x + s*v.z, v.y, -s*v.x + c*v.z); }',
    'void main(){',
    '  vec2 px = vec2(gl_FragCoord.x, res.y - gl_FragCoord.y);',
    '  vec2 ndc = (px - 0.5 * res) / res.y;',
    // cast a ray at the tilted window plane
    '  vec3 dir = ry(rx(vec3(ndc, -1.0), -tilt.y), -tilt.x);',
    '  vec2 P = dir.xy * (-1.0 / dir.z) * res.y;',
    '  P.y += scroll * 0.35;',
    '  vec2 g = P / cell; vec2 id = floor(g); vec2 f = fract(g) - 0.5;',
    '  float h = hash(id), h2 = hash(id + 17.3);',
    '  float d = sd(f); float pane = 1.0 - smoothstep(-0.01, 0.01, d);',
    // bevel normal from the height field
    '  float e = 0.015;',
    '  float dx = height(f + vec2(e, 0.0)) - height(f - vec2(e, 0.0));',
    '  float dy = height(f + vec2(0.0, e)) - height(f - vec2(0.0, e));',
    '  vec3 n = normalize(vec3(-dx / (2.0 * e) * 0.11, dy / (2.0 * e) * 0.11, 1.0));',
    // lights: a slow sun and the pointer, both in window space
    '  vec2 sunPx = vec2(res.x * (0.5 + 0.42 * sin(t * 0.045)), res.y * (0.3 + 0.2 * cos(t * 0.06))) - 0.5 * res;',
    '  sunPx.y += scroll * 0.35;',
    '  vec2 mPx = mouse - 0.5 * res; mPx.y += scroll * 0.35;',
    '  vec2 toS = sunPx - P, toM = mPx - P;',
    '  vec3 Ls = normalize(vec3(toS.x, -toS.y, res.y * 0.55));',
    '  vec3 Lm = normalize(vec3(toM.x, -toM.y, cell * 1.6));',
    '  float sI = exp(-pow(length(toS) / (res.y * 0.75), 2.0));',
    '  float mI = exp(-pow(length(toM) / (cell * 3.2), 2.0));',
    '  float dif = max(dot(n, Ls), 0.0) * (0.35 + 0.65 * sI) + max(dot(n, Lm), 0.0) * mI * 1.2;',
    '  float spec = pow(max(dot(reflect(-Ls, n), vec3(0.0, 0.0, 1.0)), 0.0), 30.0) * sI',
    '             + pow(max(dot(reflect(-Lm, n), vec3(0.0, 0.0, 1.0)), 0.0), 30.0) * mI * 1.4;',
    // pearly shell: grain and a slow sheen per pane
    '  float sheen = 0.6 + 0.4 * sin(h * 6.283 + t * 0.25 + (f.x - f.y) * 2.4);',
    '  float grain = 0.8 + 0.2 * sin(f.x * 11.0 + f.y * 6.0 + h2 * 20.0);',
    // shadow the pane casts onto the frame, away from the sun
    '  vec2 away = normalize(vec2(toS.x, toS.y) + 1e-4) * 0.09;',
    '  float shadow = (1.0 - pane) * (1.0 - smoothstep(-0.01, 0.03, sd(f + away)));',
    // keep the reading column calm
    '  float side = smoothstep(0.16, 0.66, abs(px.x / res.x - 0.5) * 2.0);',
    '  float quiet = mix(0.4, 1.0, side);',
    '  vec3 tint = mix(cool, warm, clamp(h * 0.55 + sI * 0.6, 0.0, 1.0));',
    '  vec3 col = bg;',
    '  col += pane * tint * strength * (0.35 + 1.25 * dif * sheen * grain) * quiet;',
    '  col += pane * spec * strength * 1.6 * quiet * vec3(1.0, 0.93, 0.82);',
    '  col *= 1.0 - shadow * (0.22 + 0.1 * light) * quiet;',
    '  col *= 1.0 - (1.0 - pane) * 0.06;',
    // below the intro the window flattens into soft glowing panes
    '  float glow = (0.18 + 0.82 * sI) * sheen * grain * quiet + mI * 0.9;',
    '  vec3 flatCol = bg + pane * tint * glow * strength * 1.05;',
    '  flatCol -= (1.0 - pane) * light * 0.02;',
    '  gl_FragColor = vec4(mix(flatCol, col, depth), 1.0);',
    '}'
  ].join('\n');

  function sh(type, src) { var s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); return s; }
  var prog = gl.createProgram();
  gl.attachShader(prog, sh(gl.VERTEX_SHADER, vs));
  gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, fs));
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) { canvas.remove(); return; }
  gl.useProgram(prog);
  var buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  var loc = gl.getAttribLocation(prog, 'p');
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  var u = {};
  ['res', 't', 'mouse', 'tilt', 'scroll', 'cell', 'bg', 'warm', 'cool', 'strength', 'light', 'depth'].forEach(function (n) { u[n] = gl.getUniformLocation(prog, n); });

  // Render below full resolution; the panes are soft, so it still looks sharp enough.
  var scale = 0.75, W = 0, H = 0;
  function size() {
    W = canvas.clientWidth; H = canvas.clientHeight;
    canvas.width = Math.round(W * scale); canvas.height = Math.round(H * scale);
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.uniform2f(u.res, canvas.width, canvas.height);
    gl.uniform1f(u.cell, Math.max(60, Math.min(96, W / 15)) * scale);
  }
  function hex(v) { v = v.trim().replace('#', ''); return [0, 2, 4].map(function (i) { return parseInt(v.substr(i, 2), 16) / 255; }); }
  function colours() {
    var bg = hex(getComputedStyle(document.documentElement).getPropertyValue('--bg'));
    var isLight = bg[0] > 0.5;
    gl.uniform3fv(u.bg, bg);
    gl.uniform3fv(u.warm, isLight ? [0.95, 0.70, 0.40] : [0.95, 0.66, 0.33]);
    gl.uniform3fv(u.cool, isLight ? [0.75, 0.68, 0.62] : [0.62, 0.50, 0.44]);
    gl.uniform1f(u.strength, isLight ? 0.09 : 0.15);
    gl.uniform1f(u.light, isLight ? 1 : 0);
  }
  size(); colours();

  var mouse = [-9999, -9999], goal = [-9999, -9999];
  var tilt = [0, 0], tiltGoal = [0, 0];
  window.addEventListener('pointermove', function (e) {
    goal = [e.clientX * scale, e.clientY * scale];
    if (mouse[0] < -999) mouse = goal.slice();
    tiltGoal = [(e.clientX / W - 0.5) * 0.16, (e.clientY / H - 0.5) * 0.12];
  });
  document.addEventListener('pointerleave', function () { goal = [-9999, -9999]; mouse = goal.slice(); tiltGoal = [0, 0]; });

  var last = 0;
  function draw(time) {
    var s = time / 1000;
    mouse[0] += (goal[0] - mouse[0]) * 0.08;
    mouse[1] += (goal[1] - mouse[1]) * 0.08;
    tilt[0] += (tiltGoal[0] + 0.03 * Math.sin(s * 0.07) - tilt[0]) * 0.05;
    tilt[1] += (tiltGoal[1] + 0.02 * Math.cos(s * 0.05) - tilt[1]) * 0.05;
    gl.uniform1f(u.t, s);
    gl.uniform2f(u.mouse, mouse[0], mouse[1]);
    // 3D in the intro, easing to flat over the first screen of scrolling.
    // Project pages have a short intro, so they flatten sooner.
    var intro = document.querySelector('.hero');
    var span = intro ? Math.max(200, intro.offsetHeight * 0.8) : H * 0.8;
    var k = Math.min(1, Math.max(0, window.scrollY / span));
    var depth = 1 - k * k * (3 - 2 * k);
    gl.uniform1f(u.depth, depth);
    gl.uniform2f(u.tilt, tilt[0] * depth, tilt[1] * depth);
    gl.uniform1f(u.scroll, window.scrollY * scale);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }
  function redraw() { draw(last); }
  window.addEventListener('resize', function () { size(); redraw(); });
  window.addEventListener('themechange', function () { colours(); redraw(); });
  window.matchMedia('(prefers-color-scheme: light)').addEventListener('change', function () { colours(); redraw(); });

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    // Still panes with a fixed light; no tilt or drift.
    tiltGoal = [0, 0]; last = 20000; redraw();
    window.addEventListener('scroll', redraw, { passive: true });
    return;
  }
  var running = true;
  function loop(time) { if (!running) return; last = time + 20000; draw(last); requestAnimationFrame(loop); }
  requestAnimationFrame(loop);
  document.addEventListener('visibilitychange', function () {
    running = !document.hidden;
    if (running) requestAnimationFrame(loop);
  });
})();
