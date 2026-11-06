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
  var vw = window.innerWidth, current = -1, lastX = 0, dir = 1;

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
    matchSizes();
    update();
  }
  // Every Experience box and every Projects box takes the height of the tallest one in
  // its group (Baylo for Projects), so nothing gets cut off; About and the rest keep their own.
  function matchSizes() {
    ['experience', 'projects', 'credentials'].forEach(function (g) {
      var boxes = panels.filter(function (p) { return p.id.split('-')[0] === g; }).map(function (p) { return p.firstElementChild; });
      boxes.forEach(function (b) { b.style.height = ''; });
      if (state.mode !== 'wide') return;
      var limit = window.innerHeight - 150;
      var h = Math.min(limit, Math.max.apply(null, boxes.map(function (b) { return b.offsetHeight; })));
      boxes.forEach(function (b) { b.style.height = h + 'px'; });
    });
    panels.forEach(function (p) {
      var b = p.firstElementChild;
      if (!b.classList.contains('panel-box')) return;
      var more = state.mode === 'wide' && b.scrollHeight > b.clientHeight + 2;
      b.classList.toggle('has-more', more);
      if (more && !b.dataset.fade) {
        b.dataset.fade = '1';
        b.addEventListener('scroll', function () { b.classList.toggle('at-end', b.scrollTop + b.clientHeight >= b.scrollHeight - 4); }, { passive: true });
      }
    });
  }
  function position() {
    if (state.mode === 'swipe') return track.scrollLeft;
    return Math.min((panels.length - 1) * vw, Math.max(0, window.scrollY - base()));
  }
  var sticky = hs.querySelector('.hs-sticky');
  function update() {
    if (!state.active) return;
    // Following a link like #projects makes the browser scroll this frame sideways on
    // its own, which pushes every section off screen. Keep it at the start.
    if (sticky.scrollLeft || sticky.scrollTop) { sticky.scrollLeft = 0; sticky.scrollTop = 0; }
    var max = (panels.length - 1) * vw, x = position();
    state.p = max ? Math.min(1, Math.max(0, x / max)) : 0;
    if (state.mode === 'wide') track.style.transform = 'translate3d(' + (-x).toFixed(1) + 'px,0,0)';
    if (bar) bar.style.transform = 'scaleX(' + state.p.toFixed(4) + ')';
    var swipe = state.mode === 'swipe';
    if (x !== lastX) { dir = x > lastX ? 1 : -1; lastX = x; }
    panels.forEach(function (p, i) {
      var d = (i * vw - x) / vw, a = Math.abs(d), b = p.firstElementChild;
      // A section that is arriving fades in gently; one that is leaving goes about 40% faster.
      var arriving = dir > 0 ? d > 0 : d < 0;
      var k = arriving ? (swipe ? 1.5 : 1.7) : (swipe ? 2.2 : 2.6);
      var o = Math.max(0, Math.min(1, 1 - (a - 0.08) * k));
      // The heading leads; the rest of the box follows a beat later (about 80 ms of scroll).
      var kids = p._kids || (p._kids = Array.prototype.slice.call(b.children));
      if (a < 1.4) {
        kids.forEach(function (c, j) {
          var oj = Math.max(0, Math.min(1, 1 - (a - 0.08 + (arriving ? j * 0.06 : 0)) * k));
          if (oj > 0.995) { c.style.opacity = ''; c.style.transform = ''; return; }   // fully in: let CSS (hover lift) take over
          c.style.opacity = oj.toFixed(3);
          c.style.transform = j ? 'translate3d(0,' + ((1 - oj) * 14).toFixed(1) + 'px,0)' : '';
        });
        p._staged = true;
      } else if (p._staged) {
        kids.forEach(function (c) { c.style.opacity = ''; c.style.transform = ''; });
        p._staged = false;
      }
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
  // On computers every move between sections is one eased glide.
  var anim = null, lastWheel = 0, wheelSum = 0, gestureUsed = false, idleTimer = 0;
  // One signature curve for the whole site: cubic-bezier(0.4, 0, 0.2, 1), solved here for the glide.
  function ease(t) {
    var x1 = 0.4, y1 = 0, x2 = 0.2, y2 = 1, u = t;
    for (var i = 0; i < 6; i++) {
      var cx = 3 * x1 * u * (1 - u) * (1 - u) + 3 * x2 * u * u * (1 - u) + u * u * u - t;
      var dx = 3 * x1 * (1 - u) * (1 - u) + 6 * (x2 - x1) * u * (1 - u) + 3 * (1 - x2) * u * u;
      if (Math.abs(cx) < 1e-5 || !dx) break;
      u -= cx / dx;
    }
    return 3 * y1 * u * (1 - u) * (1 - u) + 3 * y2 * u * u * (1 - u) + u * u * u;
  }
  function glide(top) {
    var from = window.scrollY, dist = top - from;
    if (Math.abs(dist) < 1) return;
    var dur = Math.min(900, 560 + Math.abs(dist) / vw * 90), t0 = performance.now();
    if (anim) cancelAnimationFrame(anim.raf);
    anim = { target: top };
    root.style.scrollBehavior = 'auto';
    (function step(now) {
      var k = Math.min(1, (now - t0) / dur);
      window.scrollTo(0, from + dist * ease(k));
      if (k < 1) anim.raf = requestAnimationFrame(step);
      else { anim = null; root.style.scrollBehavior = ''; }
    })(t0);
  }
  function goTo(i, smooth) {
    i = Math.max(0, Math.min(panels.length - 1, i));
    if (state.mode === 'swipe') track.scrollTo({ left: i * vw, behavior: smooth ? 'smooth' : 'auto' });
    else if (smooth) { current = i; glide(base() + i * vw); }
    else window.scrollTo({ top: base() + i * vw, behavior: 'instant' });
  }
  function target() { return anim ? Math.round((anim.target - base()) / vw) : current; }
  // A box with more to read scrolls first; the page only moves at its top or bottom.
  function boxCanScroll(el, dy) {
    var box = el && el.closest && el.closest('.panel-box');
    if (!box || box.scrollHeight <= box.clientHeight + 2) return false;
    return dy > 0 ? box.scrollTop + box.clientHeight < box.scrollHeight - 2 : box.scrollTop > 2;
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
    if (document.querySelector('.viewer:not([hidden])')) return;
    var dy = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
    if (e.deltaMode === 1) dy *= 32;
    if (boxCanScroll(e.target, dy)) return;
    e.preventDefault();
    var now = performance.now();
    // A new gesture starts after a short pause; trackpad momentum never skips two sections.
    if (now - lastWheel > 220) { wheelSum = 0; gestureUsed = false; }
    lastWheel = now;
    if (gestureUsed) return;
    wheelSum += dy;
    if (Math.abs(wheelSum) >= 40) {
      gestureUsed = true;
      goTo(target() + (wheelSum > 0 ? 1 : -1), true);
    }
  }, { passive: false });
  document.addEventListener('keydown', function (e) {
    if (!state.active || e.altKey || e.metaKey || e.ctrlKey) return;
    if (/^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement.tagName)) return;
    if (document.querySelector('.viewer:not([hidden])')) return;
    var fwd = ['ArrowRight', 'PageDown'].indexOf(e.key) >= 0 || (e.key === ' ' && !e.shiftKey) || (e.key === 'ArrowDown' && state.mode === 'wide');
    var back = ['ArrowLeft', 'PageUp'].indexOf(e.key) >= 0 || (e.key === ' ' && e.shiftKey) || (e.key === 'ArrowUp' && state.mode === 'wide');
    if ((e.key === 'ArrowDown' || e.key === 'ArrowUp') && boxCanScroll(document.activeElement, e.key === 'ArrowDown' ? 1 : -1)) return;
    if (/^(A|BUTTON)$/.test(document.activeElement.tagName) && e.key === ' ') return;
    if (fwd) { e.preventDefault(); goTo(target() + 1, true); }
    else if (back) { e.preventDefault(); goTo(target() - 1, true); }
    else if (e.key === 'Home' && state.mode === 'wide') { e.preventDefault(); goTo(0, true); }
    else if (e.key === 'End' && state.mode === 'wide') { e.preventDefault(); goTo(panels.length - 1, true); }
  });

  window.addEventListener('scroll', function () {
    update();
    // Dragging the scroll bar or a touch screen on a big tablet: settle on the nearest section.
    if (state.mode !== 'wide' || anim) return;
    clearTimeout(idleTimer);
    idleTimer = setTimeout(function () {
      if (anim || state.mode !== 'wide') return;
      var x = window.scrollY - base(), i = Math.round(x / vw);
      if (x > 0 && x < (panels.length - 1) * vw && Math.abs(x - i * vw) > 2) goTo(i, true);
    }, 160);
  }, { passive: true });
  track.addEventListener('scroll', update, { passive: true });
  sticky.addEventListener('scroll', update, { passive: true });
  window.addEventListener('hashchange', function () {
    if (!state.active) return;
    var t = document.getElementById(location.hash.slice(1)), tp = t && t.closest('.panel');
    if (tp) goTo(panels.indexOf(tp), false);
  });
  window.addEventListener('pageshow', function () { setup(); });
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

// Copy protection: no selecting, copying, right-clicking or dragging on the page.
// Contact details stay copyable so recruiters can take your email and links.
(function () {
  function allowed(el) { return el && el.closest && el.closest('.copy-ok, input, textarea'); }
  ['copy', 'cut'].forEach(function (type) {
    document.addEventListener(type, function (e) {
      var sel = window.getSelection && window.getSelection();
      var node = sel && sel.anchorNode && (sel.anchorNode.nodeType === 1 ? sel.anchorNode : sel.anchorNode.parentElement);
      if (!allowed(node)) e.preventDefault();
    });
  });
  document.addEventListener('contextmenu', function (e) { if (!allowed(e.target)) e.preventDefault(); });
  document.addEventListener('dragstart', function (e) { if (e.target.tagName === 'IMG' || e.target.tagName === 'A') e.preventDefault(); });
})();
