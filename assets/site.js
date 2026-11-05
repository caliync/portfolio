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
      if (a && en.isIntersecting && !window.shelfScroll?.active) {
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


// Sideways scrolling on the home page. On computers, scrolling down moves along the
// shelves; on phones, you swipe left and right between sections and scroll up and down
// inside one. Each section fades in as it reaches the middle of the screen.
(function () {
  var hs = document.querySelector('.hs');
  if (!hs) return;
  var root = document.documentElement;
  var track = hs.querySelector('.hs-track');
  var panels = Array.prototype.slice.call(track.querySelectorAll('.panel'));
  var bar = hs.querySelector('.hs-progress span');
  var navLinks = {};
  document.querySelectorAll('.bar nav a[href^="#"]').forEach(function (a) { navLinks[a.hash.slice(1)] = a; });
  var wide = window.matchMedia('(min-width: 900px) and (min-height: 560px)');
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  var state = window.shelfScroll = { active: false, mode: 'off', p: 0, span: 0 };
  var vw = window.innerWidth, current = -1;

  function base() { return hs.getBoundingClientRect().top + window.scrollY; }
  function setup() {
    var mode = reduce.matches ? 'off' : (wide.matches ? 'wide' : 'swipe');
    state.mode = mode;
    state.active = mode !== 'off';
    state.span = (panels.length - 1) * (mode === 'swipe' ? 4.5 : 7);
    root.classList.toggle('hs-on', mode === 'wide');
    root.classList.toggle('hs-swipe', mode === 'swipe');
    vw = mode === 'swipe' ? track.clientWidth || window.innerWidth : window.innerWidth;
    track.style.transform = '';
    if (mode === 'wide') hs.style.height = ((panels.length - 1) * vw + window.innerHeight) + 'px';
    else hs.style.height = '';
    if (mode === 'off') panels.forEach(function (p) {
      var b = p.firstElementChild; b.style.opacity = ''; b.style.transform = ''; p.removeAttribute('inert');
    });
    update();
  }
  function position() {
    if (state.mode === 'swipe') return track.scrollLeft;
    return Math.min((panels.length - 1) * vw, Math.max(0, window.scrollY - base()));
  }
  function update() {
    if (!state.active) return;
    var max = (panels.length - 1) * vw, x = position();
    state.p = max ? Math.min(1, Math.max(0, x / max)) : 0;
    if (state.mode === 'wide') track.style.transform = 'translate3d(' + (-x).toFixed(1) + 'px,0,0)';
    if (bar) bar.style.transform = 'scaleX(' + state.p.toFixed(4) + ')';
    var swipe = state.mode === 'swipe';
    panels.forEach(function (p, i) {
      var d = (i * vw - x) / vw, a = Math.abs(d), b = p.firstElementChild;
      var o = Math.max(0, Math.min(1, 1 - (a - 0.08) * (swipe ? 1.5 : 1.7)));
      b.style.opacity = o.toFixed(3);
      b.style.transform = swipe
        ? 'translate3d(' + (d * 12).toFixed(1) + 'vw,' + (a * 18).toFixed(1) + 'px,0) scale(' + (1 - Math.min(a, 1) * 0.04).toFixed(4) + ')'
        : 'translate3d(' + (d * 18).toFixed(1) + 'vw,' + (a * 26).toFixed(1) + 'px,0) scale(' + (1 - Math.min(a, 1) * 0.05).toFixed(4) + ')';
      p.toggleAttribute('inert', a > 0.6);
    });
    var idx = Math.max(0, Math.min(panels.length - 1, Math.round(x / vw)));
    if (idx !== current) {
      current = idx;
      var key = (panels[idx].id || '').split('-')[0];
      Object.keys(navLinks).forEach(function (k) {
        if (k === key) navLinks[k].setAttribute('aria-current', 'true'); else navLinks[k].removeAttribute('aria-current');
      });
      var link = navLinks[key];
      if (swipe && link) { var nav = link.parentNode; nav.scrollTo({ left: link.offsetLeft - nav.offsetLeft - (nav.clientWidth - link.offsetWidth) / 2, behavior: 'smooth' }); }
    }
  }
  function goTo(i, smooth) {
    i = Math.max(0, Math.min(panels.length - 1, i));
    if (state.mode === 'swipe') track.scrollTo({ left: i * vw, behavior: smooth ? 'smooth' : 'auto' });
    else window.scrollTo({ top: base() + i * vw, behavior: smooth ? 'smooth' : 'auto' });
  }

  document.addEventListener('click', function (e) {
    if (!state.active) return;
    var a = e.target.closest('a[href^="#"]');
    if (!a) return;
    var target = document.getElementById(a.hash.slice(1));
    var p = target && target.closest('.panel');
    if (!p) return;
    e.preventDefault();
    goTo(panels.indexOf(p), true);
    history.replaceState(null, '', a.hash);
  });
  document.addEventListener('focusin', function (e) {
    if (!state.active) return;
    var p = e.target.closest && e.target.closest('.panel');
    if (p && panels.indexOf(p) !== current) goTo(panels.indexOf(p), false);
  });
  window.addEventListener('wheel', function (e) {
    if (state.mode !== 'wide' || e.ctrlKey) return;
    if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) { e.preventDefault(); window.scrollBy(0, e.deltaX); }
  }, { passive: false });
  document.addEventListener('keydown', function (e) {
    if (!state.active || e.altKey || e.metaKey || e.ctrlKey) return;
    if (/^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement.tagName)) return;
    if (document.querySelector('.viewer:not([hidden])')) return;
    if (e.key === 'ArrowRight') { e.preventDefault(); goTo(current + 1, true); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); goTo(current - 1, true); }
  });

  window.addEventListener('scroll', update, { passive: true });
  track.addEventListener('scroll', update, { passive: true });
  var lastW = window.innerWidth;
  window.addEventListener('resize', function () {
    // Phones fire resize when the address bar hides; only redo the layout when the width changes.
    if (state.mode === 'swipe' && window.innerWidth === lastW) return;
    lastW = window.innerWidth;
    var keep = current;
    setup();
    if (state.active && keep > 0) goTo(keep, false);
  });
  wide.addEventListener('change', setup);
  reduce.addEventListener('change', setup);
  setup();
  if (state.active && location.hash) {
    var t = document.getElementById(location.hash.slice(1));
    var tp = t && t.closest('.panel');
    if (tp) goTo(panels.indexOf(tp), false);
  }
})();
