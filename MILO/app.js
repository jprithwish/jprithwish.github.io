/* MILO project page: sticky nav, scroll reveal, chart tooltips, segmented toggles,
   sortable leaderboard, copy-to-clipboard. Everything is progressive enhancement:
   the page reads fully without JavaScript (all variants render, tables keep the
   paper's order). */

(function () {
  'use strict';

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- sticky nav slides in once the title has scrolled past; progress bar tracks the read ---------- */
  var nav = document.getElementById('nav');
  var progress = nav ? nav.querySelector('.nav-progress') : null;
  var rail = document.getElementById('rail');
  var marker = rail ? rail.querySelector('.rail-marker') : null;
  var railLinks = rail ? Array.prototype.slice.call(rail.querySelectorAll('a[href^="#"]')) : [];
  function navState() {
    if (rail) rail.classList.toggle('show', window.scrollY > 240);
    if (!nav) return;
    nav.classList.toggle('show', window.scrollY > 240);
    if (progress) {
      var max = document.documentElement.scrollHeight - window.innerHeight;
      progress.style.transform = 'scaleX(' + (max > 0 ? Math.min(1, window.scrollY / max) : 0) + ')';
    }
  }

  /* ---------- scroll-spy: highlight the section in view ---------- */
  var navLinks = nav ? Array.prototype.slice.call(nav.querySelectorAll('.links a[href^="#"]')) : [];
  var spied = navLinks.map(function (a) {
    return { a: a, el: document.getElementById(a.getAttribute('href').slice(1)) };
  }).filter(function (s) { return s.el; });
  var spyPending = false;
  function spy() {
    spyPending = false;
    if (!spied.length) return;
    var line = 96; // a section is "current" once its top has passed this line below the viewport top
    var current = null;
    for (var i = 0; i < spied.length; i++) {
      if (spied[i].el.getBoundingClientRect().top <= line) current = spied[i];
    }
    if (window.innerHeight + window.scrollY >= document.body.scrollHeight - 2) current = spied[spied.length - 1];
    spied.forEach(function (s) { s.a.classList.toggle('active', s === current); });
    /* side rail: same section, plus the sliding marker */
    if (rail) {
      rail.classList.toggle('has-current', !!current);
      railLinks.forEach(function (a) {
        var on = !!current && a.getAttribute('href') === '#' + current.el.id;
        a.classList.toggle('active', on);
        if (on && marker) { marker.style.height = (a.offsetHeight - 10) + 'px'; marker.style.transform = 'translateY(' + (a.offsetTop + 5) + 'px)'; }
      });
    }
  }
  function onScroll() {
    if (spyPending) return;
    spyPending = true;
    requestAnimationFrame(function () { navState(); spy(); });
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  navState(); spy();

  /* ---------- reveal on scroll ---------- */
  var targets = document.querySelectorAll('.reveal');
  if (reduced || !('IntersectionObserver' in window)) {
    targets.forEach(function (el) { el.classList.add('in'); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.06 });
    targets.forEach(function (el) { io.observe(el); });
  }

  /* ---------- segmented controls drive .variants ---------- */
  document.querySelectorAll('.variants').forEach(function (v) { v.setAttribute('data-js', ''); });
  document.querySelectorAll('.seg[data-group]').forEach(function (seg) {
    var group = seg.getAttribute('data-group');
    var btns = seg.querySelectorAll('button[data-value]');
    function select(value) {
      btns.forEach(function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-value') === value)); });
      document.querySelectorAll('.variants[data-group="' + group + '"]').forEach(function (box) {
        Array.prototype.forEach.call(box.children, function (el) {
          if (el.classList.contains('variant')) el.classList.toggle('on', el.getAttribute('data-value') === value);
        });
      });
      // keep every control of the same group in sync
      document.querySelectorAll('.seg[data-group="' + group + '"] button[data-value]').forEach(function (b) {
        b.setAttribute('aria-pressed', String(b.getAttribute('data-value') === value));
      });
    }
    btns.forEach(function (b) { b.addEventListener('click', function () { select(b.getAttribute('data-value')); }); });
    var pressed = seg.querySelector('button[aria-pressed="true"]') || btns[0];
    if (pressed) select(pressed.getAttribute('data-value'));
  });

  /* ---------- chart tooltips ---------- */
  var tip = document.getElementById('tip');
  function show(el, x, y) {
    tip.textContent = '';
    var v = document.createElement('span'); v.className = 't-val';
    var sw = document.createElement('i'); sw.style.background = el.dataset.color || '#333';
    v.appendChild(sw); v.appendChild(document.createTextNode(el.dataset.val || ''));
    var n = document.createElement('span'); n.className = 't-name'; n.textContent = el.dataset.name || '';
    tip.appendChild(v); tip.appendChild(n);
    if (el.dataset.sub) { var s = document.createElement('span'); s.className = 't-sub'; s.textContent = el.dataset.sub; tip.appendChild(s); }
    var half = 170;
    x = Math.max(half + 6, Math.min(window.innerWidth - half - 6, x));
    tip.style.left = x + 'px';
    tip.style.top = (y - 12) + 'px';
    tip.classList.add('on');
  }
  function hide() { if (tip) tip.classList.remove('on'); }

  if (tip) {
    document.querySelectorAll('.chart').forEach(function (chart) {
      var hits = chart.querySelectorAll('.hit');
      if (!hits.length) return;
      hits.forEach(function (hit) {
        hit.setAttribute('tabindex', '0');
        hit.setAttribute('role', 'img');
        hit.setAttribute('aria-label', (hit.dataset.name || '') + ': ' + (hit.dataset.val || ''));
        function enter(ev) {
          var r = hit.getBoundingClientRect();
          var x = (ev && ev.clientX && ev.type !== 'focus') ? ev.clientX : r.left + r.width / 2;
          show(hit, x, r.top);
          chart.classList.add('dim');
          var mark = hit.previousElementSibling;
          for (var i = 0; i < 5 && mark && !mark.classList.contains('mark'); i++) mark = mark.previousElementSibling;
          if (mark && mark.classList.contains('mark')) mark.classList.add('on');
          if (ev && ev.type === 'touchstart' && ev.cancelable) ev.preventDefault();
        }
        function move(ev) {
          if (!tip.classList.contains('on')) return;
          var r = hit.getBoundingClientRect();
          tip.style.left = Math.max(176, Math.min(window.innerWidth - 176, ev.clientX)) + 'px';
          tip.style.top = (r.top - 12) + 'px';
        }
        function leave() {
          hide(); chart.classList.remove('dim');
          chart.querySelectorAll('.mark.on').forEach(function (m) { m.classList.remove('on'); });
        }
        hit.addEventListener('mouseenter', enter);
        hit.addEventListener('mousemove', move);
        hit.addEventListener('mouseleave', leave);
        hit.addEventListener('focus', enter);
        hit.addEventListener('blur', leave);
        hit.addEventListener('touchstart', enter, { passive: false });
        hit.addEventListener('touchend', leave);
      });
      chart.addEventListener('mouseleave', function () {
        hide(); chart.classList.remove('dim');
        chart.querySelectorAll('.mark.on').forEach(function (m) { m.classList.remove('on'); });
      });
    });
    window.addEventListener('scroll', hide, { passive: true });
  }

  /* ---------- sortable leaderboard ---------- */
  document.querySelectorAll('.tablewrap.lb').forEach(function (wrap) {
    var table = wrap.querySelector('table');
    var tbody = table.querySelector('tbody');
    var original = Array.prototype.slice.call(tbody.children);
    var reset = wrap.parentElement.querySelector('.resetbtn[data-for="' + wrap.getAttribute('data-model') + '"]');
    var state = { col: null, dir: 'desc' };

    function restore() {
      tbody.textContent = '';
      original.forEach(function (tr) { tbody.appendChild(tr); });
      table.querySelectorAll('th').forEach(function (th) { th.classList.remove('sorted-asc', 'sorted-desc'); });
      state.col = null;
      if (reset) reset.classList.remove('show');
    }

    table.querySelectorAll('.sortbtn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var col = btn.getAttribute('data-col');
        var th = btn.closest('th');
        if (state.col === col) {
          if (state.dir === 'desc') { state.dir = 'asc'; }
          else { restore(); return; }
        } else { state.col = col; state.dir = (col === 'name') ? 'asc' : 'desc'; }
        var rows = original.filter(function (tr) { return tr.classList.contains('row'); });
        var idx = (col === 'name') ? null : parseInt(col, 10);
        rows.sort(function (a, b) {
          var va, vb;
          if (idx === null) { va = a.getAttribute('data-name').toLowerCase(); vb = b.getAttribute('data-name').toLowerCase(); return va < vb ? -1 : va > vb ? 1 : 0; }
          va = parseFloat(a.querySelectorAll('td.num')[idx].getAttribute('data-v'));
          vb = parseFloat(b.querySelectorAll('td.num')[idx].getAttribute('data-v'));
          return va - vb;
        });
        if (state.dir === 'desc') rows.reverse();
        tbody.textContent = '';
        rows.forEach(function (tr) { tbody.appendChild(tr); });
        table.querySelectorAll('th').forEach(function (h) { h.classList.remove('sorted-asc', 'sorted-desc'); });
        th.classList.add(state.dir === 'desc' ? 'sorted-desc' : 'sorted-asc');
        if (reset) reset.classList.add('show');
      });
    });
    if (reset) reset.addEventListener('click', restore);
  });

  /* ---------- copy BibTeX ---------- */
  var copy = document.querySelector('.copybtn');
  var bib = document.querySelector('pre.bibtex');
  if (copy && bib && navigator.clipboard) {
    copy.addEventListener('click', function () {
      navigator.clipboard.writeText(bib.textContent).then(function () {
        var t = copy.textContent; copy.textContent = 'Copied';
        setTimeout(function () { copy.textContent = t; }, 1400);
      });
    });
  } else if (copy) { copy.style.display = 'none'; }
})();
