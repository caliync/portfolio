// Hero name: letters widen near the pointer and condense away from it.
(function () {
  var name = document.getElementById('name');
  if (!name) return;
  var chars = [];
  name.querySelectorAll('[data-word]').forEach(function (word) {
    var text = word.textContent;
    word.textContent = '';
    word.setAttribute('aria-hidden', 'true');
    for (var i = 0; i < text.length; i++) {
      var s = document.createElement('span');
      s.className = 'ch';
      s.textContent = text[i];
      word.appendChild(s);
      chars.push(s);
    }
  });

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (reduce.matches) return;

  var MIN = 62, MAX = 140, REST = 100;
  var target = null, raf = 0;

  function set(px, py) {
    chars.forEach(function (c) {
      var r = c.getBoundingClientRect();
      var cx = r.left + r.width / 2, cy = r.top + r.height / 2;
      var d = Math.hypot((px - cx) * 1, (py - cy) * 1.6);
      var t = Math.max(0, 1 - d / (window.innerWidth * 0.35));
      c.style.setProperty('--w', (MIN + (MAX - MIN) * t * t).toFixed(1) + '%');
    });
  }
  function rest() { chars.forEach(function (c) { c.style.setProperty('--w', REST + '%'); }); }

  // One load sequence: the name opens from condensed to its resting width.
  chars.forEach(function (c, i) {
    c.style.setProperty('--w', MIN + '%');
    c.style.transition = 'font-stretch .9s cubic-bezier(.2,.7,.2,1) ' + (i * 40) + 'ms';
  });
  requestAnimationFrame(function () { requestAnimationFrame(rest); });
  setTimeout(function () { chars.forEach(function (c) { c.style.transition = 'font-stretch .25s ease-out'; }); }, 1500);

  var hero = name.closest('.hero');
  var fine = window.matchMedia('(pointer: fine)');
  hero.addEventListener('pointermove', function (e) {
    if (!fine.matches) return;
    target = [e.clientX, e.clientY];
    if (!raf) raf = requestAnimationFrame(function () { raf = 0; if (target) set(target[0], target[1]); });
  });
  hero.addEventListener('pointerleave', function () { target = null; rest(); });
})();

// Show the CV buttons only once the PDFs are in the repo.
document.querySelectorAll('[data-optional-file]').forEach(function (a) {
  fetch(a.getAttribute('href'), { method: 'HEAD' }).then(function (r) {
    if (r.ok) a.hidden = false;
  }).catch(function () {});
});

// Mark the section you're reading in the header.
(function () {
  var links = {};
  document.querySelectorAll('.bar nav a').forEach(function (a) { links[a.hash.slice(1)] = a; });
  if (!('IntersectionObserver' in window)) return;
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      var a = links[en.target.id];
      if (a && en.isIntersecting) {
        Object.values(links).forEach(function (l) { l.removeAttribute('aria-current'); });
        a.setAttribute('aria-current', 'true');
      }
    });
  }, { rootMargin: '-40% 0px -55% 0px' });
  Object.keys(links).forEach(function (id) { var s = document.getElementById(id); if (s) io.observe(s); });
})();
