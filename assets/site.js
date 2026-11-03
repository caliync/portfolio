// Theme switch: follows the system until you pick one, then remembers it.
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

// CV buttons show only once the PDFs are in the repo.
document.querySelectorAll('[data-optional-file]').forEach(function (a) {
  fetch(a.getAttribute('href'), { method: 'HEAD' }).then(function (r) {
    if (r.ok) a.hidden = false;
  }).catch(function () {});
});

// Mark the section you're reading in the top bar.
(function () {
  var links = {};
  document.querySelectorAll('.bar nav a[href^="#"]').forEach(function (a) { links[a.hash.slice(1)] = a; });
  if (!Object.keys(links).length || !('IntersectionObserver' in window)) return;
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
