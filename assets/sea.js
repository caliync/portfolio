// Background: a 3D sea of lights, like Manila Bay at night. Plain WebGL, no library.
// A grid of points rolls in slow waves; the camera tilts a little toward the pointer.
(function () {
  var canvas = document.querySelector('canvas.sea');
  if (!canvas) return;
  var gl = canvas.getContext('webgl', { antialias: false, alpha: true, premultipliedAlpha: false });
  if (!gl) { canvas.remove(); return; }

  var COLS = 140, ROWS = 70, SPACING = 0.5;
  var pos = new Float32Array(COLS * ROWS * 2), k = 0;
  for (var j = 0; j < ROWS; j++) for (var i = 0; i < COLS; i++) {
    pos[k++] = (i - COLS / 2) * SPACING;
    pos[k++] = -j * SPACING;
  }

  var vs = [
    'attribute vec2 p;',
    'uniform float t; uniform vec2 tilt; uniform float aspect; uniform float px;',
    'varying float fade;',
    'void main(){',
    '  float x=p.x, z=p.y-2.0;',
    '  float y=sin(x*0.35+t*0.6)*0.35+cos(z*0.45+t*0.45)*0.3+sin((x+z)*0.2+t*0.3)*0.25;',
    '  vec3 v=vec3(x, y-2.2, z);',
    '  float a=0.32+tilt.y*0.05; float c=cos(a), s=sin(a);',  // pitch
    '  v=vec3(v.x, v.y*c - v.z*s, v.y*s + v.z*c);',
    '  float b=tilt.x*0.08; float cb=cos(b), sb=sin(b);',       // yaw
    '  v=vec3(v.x*cb + v.z*sb, v.y, -v.x*sb + v.z*cb);',
    '  float d=-v.z+0.001;',
    '  gl_Position=vec4(v.x/(d*aspect)*1.6, v.y/d*1.6, 0.0, 1.0);',
    '  if(d<0.5) gl_Position=vec4(2.0,2.0,2.0,1.0);',
    '  fade=clamp(1.0-(d-2.0)/30.0,0.0,1.0)*clamp((y+0.9)/1.8,0.35,1.0)*clamp((d-1.0)/3.0,0.0,1.0);',
    '  gl_PointSize=max(2.0, 60.0/d)*px;',
    '}'
  ].join('\n');
  var fs = [
    'precision mediump float;',
    'uniform vec3 col; uniform float alpha;',
    'varying float fade;',
    'void main(){',
    '  vec2 q=gl_PointCoord-0.5; float r=length(q);',
    '  float g=smoothstep(0.5,0.0,r); g*=g;',
    '  gl_FragColor=vec4(col, g*fade*alpha);',
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
  gl.bufferData(gl.ARRAY_BUFFER, pos, gl.STATIC_DRAW);
  var loc = gl.getAttribLocation(prog, 'p');
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  var u = {};
  ['t', 'tilt', 'aspect', 'px', 'col', 'alpha'].forEach(function (n) { u[n] = gl.getUniformLocation(prog, n); });
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE);

  var dpr = Math.min(window.devicePixelRatio || 1, 1.5);
  function size() {
    var w = canvas.clientWidth, h = canvas.clientHeight;
    canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.uniform1f(u.aspect, w / h);
    gl.uniform1f(u.px, dpr * Math.min(1.4, Math.max(0.7, w / 1200)));
  }
  function colour() {
    var rgb = getComputedStyle(document.documentElement).getPropertyValue('--sea-dot').split(',').map(function (n) { return parseFloat(n) / 255; });
    var light = rgb[0] < 0.3;
    gl.uniform3f(u.col, rgb[0], rgb[1], rgb[2]);
    gl.uniform1f(u.alpha, light ? 0.45 : 1.0);
    gl.blendFunc(gl.SRC_ALPHA, light ? gl.ONE_MINUS_SRC_ALPHA : gl.ONE);
  }
  size(); colour();
  window.addEventListener('resize', function () { size(); draw(last); });
  window.addEventListener('themechange', function () { colour(); draw(last); });
  window.matchMedia('(prefers-color-scheme: light)').addEventListener('change', function () { colour(); draw(last); });

  var tilt = [0, 0], goal = [0, 0];
  window.addEventListener('pointermove', function (e) {
    goal[0] = e.clientX / window.innerWidth * 2 - 1;
    goal[1] = e.clientY / window.innerHeight * 2 - 1;
  });

  var last = 0;
  function draw(t) {
    tilt[0] += (goal[0] - tilt[0]) * 0.04;
    tilt[1] += (goal[1] - tilt[1]) * 0.04;
    gl.uniform1f(u.t, t / 1000);
    gl.uniform2f(u.tilt, tilt[0], tilt[1]);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.POINTS, 0, COLS * ROWS);
  }

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce) { draw(4000); return; }
  var running = true;
  function loop(t) { if (!running) return; last = t; draw(t); requestAnimationFrame(loop); }
  requestAnimationFrame(loop);
  document.addEventListener('visibilitychange', function () {
    running = !document.hidden;
    if (running) requestAnimationFrame(loop);
  });
})();
