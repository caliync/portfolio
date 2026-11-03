// Theme toggle: follows the system until you pick one, then remembers it.
(function () {
  var root = document.documentElement;
  function current() {
    if (root.dataset.theme) return root.dataset.theme;
    return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  }
  function label() {
    var next = current() === 'dark' ? 'light' : 'dark';
    document.querySelectorAll('[data-theme-toggle]').forEach(function (b) {
      b.setAttribute('aria-label', 'Switch to ' + next + ' mode');
    });
  }
  document.querySelectorAll('[data-theme-toggle]').forEach(function (b) {
    b.addEventListener('click', function () {
      var next = current() === 'dark' ? 'light' : 'dark';
      root.dataset.theme = next;
      try { localStorage.setItem('theme', next); } catch (e) {}
      label();
      window.dispatchEvent(new Event('themechange'));
    });
  });
  label();
})();

// Home: the name widens near the pointer and condenses away from it.
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
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  var MIN = 62, MAX = 140, REST = 100, raf = 0, target = null;
  function set(px, py) {
    chars.forEach(function (c) {
      var r = c.getBoundingClientRect();
      var d = Math.hypot(px - (r.left + r.width / 2), (py - (r.top + r.height / 2)) * 1.6);
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

  var fine = window.matchMedia('(pointer: fine)');
  document.addEventListener('pointermove', function (e) {
    if (!fine.matches) return;
    target = [e.clientX, e.clientY];
    if (!raf) raf = requestAnimationFrame(function () { raf = 0; if (target) set(target[0], target[1]); });
  });
  document.addEventListener('pointerleave', function () { target = null; rest(); });
})();

// CV buttons show only once the PDFs are in the repo.
document.querySelectorAll('[data-optional-file]').forEach(function (a) {
  fetch(a.getAttribute('href'), { method: 'HEAD' }).then(function (r) {
    if (r.ok) a.hidden = false;
  }).catch(function () {});
});
