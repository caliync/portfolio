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

// Image viewer: clicking a photo, screenshot or certificate opens it larger on this page.
(function () {
  var sel = '.job-photo img, .cert-img img, .shot img';
  if (!document.querySelector(sel)) return;
  var box = document.createElement('div');
  box.className = 'viewer';
  box.hidden = true;
  box.setAttribute('role', 'dialog');
  box.setAttribute('aria-modal', 'true');
  box.setAttribute('aria-label', 'Image viewer');
  box.innerHTML = '<button type="button" class="viewer-close" aria-label="Close image">&times;</button>' +
    '<figure class="viewer-fig"><img alt=""><figcaption></figcaption></figure>';
  document.body.appendChild(box);
  var img = box.querySelector('img'), cap = box.querySelector('figcaption'), btn = box.querySelector('.viewer-close');
  var last = null;

  function open(src) {
    last = document.activeElement;
    img.src = src.currentSrc || src.src;
    img.alt = src.alt || '';
    var fc = src.closest('figure') && src.closest('figure').querySelector('figcaption');
    cap.textContent = fc ? fc.textContent : '';
    cap.hidden = !cap.textContent;
    box.hidden = false;
    document.documentElement.classList.add('viewer-open');
    requestAnimationFrame(function () { box.classList.add('is-on'); });
    btn.focus();
  }
  function close() {
    box.classList.remove('is-on');
    document.documentElement.classList.remove('viewer-open');
    box.hidden = true;
    img.removeAttribute('src');
    if (last && last.focus) last.focus();
  }

  document.querySelectorAll(sel).forEach(function (el) {
    var a = el.closest('a');
    var target = a || el;
    if (!a) { el.tabIndex = 0; el.setAttribute('role', 'button'); }
    target.setAttribute('aria-label', 'View larger: ' + (el.alt || 'image'));
    target.addEventListener('click', function (e) { e.preventDefault(); open(el); });
    if (!a) el.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(el); }
    });
  });
  btn.addEventListener('click', close);
  box.addEventListener('click', function (e) { if (e.target === box) close(); });
  document.addEventListener('keydown', function (e) { if (!box.hidden && e.key === 'Escape') close(); });
})();
