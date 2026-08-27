/* ============================================================
   yara — boot, decoy render, glitch transition, reveal render
   ============================================================ */
(function () {
  'use strict';

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var params = new URLSearchParams(location.search);
  var STAGE_OVERRIDE = params.get('stage');            // ?stage=menu | ?stage=reveal
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var stage   = $('#stage');
  var decoy   = $('#decoy');
  var glitch  = $('#glitch');
  var veil    = $('#veil');
  var reveal  = $('#reveal');

  var fired = false;

  /* ---------- helpers ---------- */
  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
  // keeps line breaks the writers typed in the JSON
  function para(s) {
    return esc(s).split(/\n{2,}/).map(function (p) {
      return p.replace(/\n/g, '<br />');
    }).join('</p><p>');
  }
  function pad2(n) { return n < 10 ? '0' + n : String(n); }

  /* ============================================================
     1. render the decoy menu
     ============================================================ */
  function renderMenu(m) {
    var h = '';
    h += '<header class="m-head">';
    h += '<h1 class="m-mark">' + esc(m.brand.ar) + '</h1>';
    h += '<p class="m-latin">' + esc(m.brand.latin) + '</p>';
    if (m.brand.tagline) h += '<p class="m-tag">' + esc(m.brand.tagline) + '</p>';
    h += '<hr class="m-rule" />';
    h += '</header>';

    m.sections.forEach(function (sec) {
      h += '<section class="m-section">';
      h += '<div class="m-section-head">';
      h += '<h2 class="m-section-title">' + esc(sec.title) + '</h2>';
      if (sec.ar) h += '<p class="m-section-ar">' + esc(sec.ar) + '</p>';
      h += '</div>';
      if (sec.note) h += '<p class="m-note">' + esc(sec.note) + '</p>';
      sec.items.forEach(function (it) {
        h += '<div class="m-item"><div class="m-item-main">';
        h += '<p class="m-item-name">' + esc(it.name) + '</p>';
        if (it.ar) h += '<p class="m-item-ar">' + esc(it.ar) + '</p>';
        if (it.desc) h += '<p class="m-item-desc">' + esc(it.desc) + '</p>';
        h += '</div>';
        h += '<div class="m-item-price">' + esc(it.price) +
             '<span>' + esc(m.currency) + '</span></div>';
        h += '</div>';
      });
      h += '</section>';
    });

    h += '<footer class="m-foot">';
    (m.footer || []).forEach(function (line) { h += '<p>' + esc(line) + '</p>'; });
    h += '</footer>';

    $('#decoy-body').innerHTML = h;
  }

  /* ============================================================
     2. render the reveal (built up-front so photos are cached
        long before the transition runs)
     ============================================================ */
  function renderReveal(d) {
    var h = '';

    h += '<section class="hero"><div class="wrap">';
    h += '<p class="eyebrow">' + esc(d.eyebrow || '') + '</p>';
    h += '<h1>' + esc(d.headline || 'Happy Birthday,') + '<em>' + esc(d.name) + '</em></h1>';
    h += '<hr class="hero-rule" />';
    if (d.intro) h += '<p class="hero-sub">' + esc(d.intro) + '</p>';
    h += '</div></section>';

    h += '<section class="notes"><div class="wrap">';
    h += '<div class="notes-head"><h2>' + esc(d.notesLabel || 'From the table') + '</h2>';
    h += '<span class="count">' + pad2(d.people.length) + ' notes</span></div>';
    h += '<div class="grid">';

    d.people.forEach(function (p, i) {
      // a bare filename means photos/ — easy thing to forget while editing the JSON
      var src = String(p.photo || '').trim();
      if (src && src.indexOf('/') === -1 && src.indexOf(':') === -1) src = 'photos/' + src;
      var hasPhoto = !!src;
      var cls = 'card' + (hasPhoto ? '' : ' is-quote');
      h += '<article class="' + cls + '">';
      if (hasPhoto) {
        h += '<figure class="card-figure"><img src="' + esc(src) +
             '" alt="" loading="eager" decoding="async" /></figure>';
      }
      h += '<div class="card-body">';
      h += '<p class="card-index">' + pad2(i + 1) + '</p>';
      h += '<div class="card-msg"><p>' + para(p.message) + '</p></div>';
      if (p.memory && String(p.memory).trim()) {
        h += '<div class="card-memory"><span class="label">' +
             esc(d.memoryLabel || 'A memory') + '</span><p>' + para(p.memory) + '</p></div>';
      }
      h += '<div class="card-sign"><p class="card-name">' + esc(p.name) + '</p>';
      if (p.role) h += '<p class="card-role">' + esc(p.role) + '</p>';
      h += '</div></div></article>';
    });

    h += '</div></div></section>';

    h += '<div class="gap" aria-hidden="true"></div>';
    h += '<section class="finale"><hr class="finale-rule" />';
    h += '<p class="finale-line">' + esc(d.finale.line) + '</p>';
    if (d.finale.sub) h += '<p class="finale-sub">' + esc(d.finale.sub) + '</p>';
    h += '</section>';

    if (d.colophon) h += '<footer class="colophon"><p>' + esc(d.colophon) + '</p></footer>';

    reveal.innerHTML = h;

    // a photo that never loads collapses cleanly into a quote card
    Array.prototype.forEach.call(reveal.querySelectorAll('.card-figure img'), function (img) {
      img.addEventListener('error', function () {
        var card = img.closest('.card');
        var fig = img.closest('.card-figure');
        // she never sees a broken image — but say so loudly in the console,
        // otherwise a typo'd filename just looks like a note with no photo
        console.warn('[photo missing] ' + img.getAttribute('src') +
                     ' — check the filename and that it is inside photos/');
        if (fig) fig.remove();
        if (card) card.classList.add('is-quote');
      });
    });
  }

  function observeReveal() {
    if (!('IntersectionObserver' in window)) {
      Array.prototype.forEach.call(reveal.querySelectorAll('.card,.finale'), function (el) {
        el.classList.add('in');
      });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
      });
    }, { rootMargin: '0px 0px -12% 0px', threshold: 0.12 });

    Array.prototype.forEach.call(reveal.querySelectorAll('.card'), function (el, i) {
      el.style.transitionDelay = (i % 3) * 90 + 'ms';
      io.observe(el);
    });
    var fin = reveal.querySelector('.finale');
    if (fin) io.observe(fin);
  }

  /* ============================================================
     3. the transition
     ============================================================ */
  function buildVeil() {
    var n = 12, h = '';
    for (var i = 0; i < n; i++) h += '<div class="band" style="--i:' + i + '"></div>';
    veil.innerHTML = h;
  }

  function freezeDecoy() {
    var y = window.scrollY || window.pageYOffset || 0;
    document.body.classList.add('is-locked');
    decoy.style.top = (-y) + 'px';
    decoy.classList.add('is-frozen');

    // two torn copies of exactly what she is looking at
    var inner = $('#decoy-body').innerHTML;
    glitch.innerHTML =
      '<div class="gl gl-a"><div class="gl-inner" style="--gy:' + (-y) + 'px">' +
        '<div class="decoy-body">' + inner + '</div></div></div>' +
      '<div class="gl gl-b"><div class="gl-inner" style="--gy:' + (-y) + 'px">' +
        '<div class="decoy-body">' + inner + '</div></div></div>' +
      '<div class="gl-fx"></div><div class="gl-flash"></div>';
  }

  function swapToReveal(d) {
    stage.setAttribute('hidden', '');
    decoy.classList.remove('is-frozen');
    stage.classList.remove('is-glitching');
    glitch.innerHTML = '';

    reveal.hidden = false;
    document.body.classList.add('is-revealed');
    document.body.classList.remove('is-locked');
    window.scrollTo(0, 0);

    document.title = (d.headline || 'Happy Birthday,') + ' ' + d.name;
    var tc = document.getElementById('theme-color');
    if (tc) tc.setAttribute('content', '#080e1a');

    observeReveal();
    // plain timers, not rAF — a backgrounded tab throttles rAF and would
    // leave the veil sitting there opaque
    veil.classList.add('is-solid');
    setTimeout(function () {
      reveal.classList.add('ready');
      veil.classList.add('is-out');
    }, 40);
    // hard guarantee the veil is gone even if the fade never runs
    setTimeout(function () {
      veil.className = 'veil';
      veil.innerHTML = '';
    }, 900);
  }

  function fire(d) {
    if (fired) return;
    fired = true;

    if (reduced) {
      freezeDecoy();
      veil.classList.add('is-on');
      setTimeout(function () { swapToReveal(d); }, 420);
      return;
    }

    freezeDecoy();
    // force a frame so the clones are painted before the animations start
    void glitch.offsetHeight;
    stage.classList.add('is-glitching');

    var tA = setTimeout(function () { veil.classList.add('is-on'); }, 1120);
    var tB = setTimeout(function () { swapToReveal(d); }, 1560);

    // if she backgrounds the tab mid-glitch the browser throttles the timers
    // and the sequence would stall — land on the reveal instead of a frozen tear
    document.addEventListener('visibilitychange', function once() {
      if (!document.hidden) return;
      document.removeEventListener('visibilitychange', once);
      clearTimeout(tA); clearTimeout(tB);
      veil.classList.add('is-on');
      swapToReveal(d);
    });
  }

  function armTrigger(d) {
    var t0 = Date.now();
    var MIN = 2600;     // never fire before she has had a moment with the menu
    var MAX = 8000;     // fires on its own even if she does not scroll
    var DEPTH = 0.45;

    var hard = setTimeout(function () { fire(d); }, MAX);

    function onScroll() {
      if (fired) return;
      var doc = document.documentElement;
      var max = Math.max(1, doc.scrollHeight - window.innerHeight);
      var depth = (window.scrollY || window.pageYOffset || 0) / max;
      if (depth >= DEPTH && Date.now() - t0 >= MIN) {
        clearTimeout(hard);
        window.removeEventListener('scroll', onScroll);
        fire(d);
      }
    }
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  /* ============================================================
     boot
     ============================================================ */
  function bootError(err) {
    document.body.innerHTML =
      '<div class="boot-error"><p><strong>Content did not load.</strong></p>' +
      '<p>' + esc(err) + '</p>' +
      '<p>If you are opening this file directly, run a small server instead — ' +
      'the browser blocks <code>fetch</code> on <code>file://</code>:<br />' +
      '<code>npx serve</code> &nbsp;or&nbsp; <code>python3 -m http.server</code></p></div>';
  }

  Promise.all([
    fetch('data/menu.json', { cache: 'no-store' }).then(function (r) {
      if (!r.ok) throw new Error('data/menu.json — ' + r.status); return r.json();
    }),
    fetch('data/messages.json', { cache: 'no-store' }).then(function (r) {
      if (!r.ok) throw new Error('data/messages.json — ' + r.status); return r.json();
    })
  ]).then(function (res) {
    var menu = res[0], d = res[1];

    renderMenu(menu);
    renderReveal(d);
    buildVeil();

    if (STAGE_OVERRIDE === 'reveal') {          // preview the second half
      stage.setAttribute('hidden', '');
      reveal.hidden = false;
      document.body.classList.add('is-revealed');
      document.title = (d.headline || 'Happy Birthday,') + ' ' + d.name;
      reveal.classList.add('ready');
      observeReveal();
      return;
    }
    // rehearsal hook: run __fire() from the console to trigger the transition now
    window.__fire = function () { fire(d); };

    if (STAGE_OVERRIDE === 'menu') return;      // preview the menu, no transition

    armTrigger(d);
  }).catch(function (e) {
    bootError(e && e.message ? e.message : e);
  });
})();
