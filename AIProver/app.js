/* AIProver project page: nav, scroll-spy, reveal, Fig. 1 spotlight walkthrough, chart tooltips, copy. Progressive: the page reads without JS. */
(function () {
  'use strict';
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* nav + scroll-spy */
  var nav = document.getElementById('nav');
  var progress = nav ? nav.querySelector('.progress') : null;
  var links = nav ? Array.prototype.slice.call(nav.querySelectorAll('.links a[href^="#"]')) : [];
  var rail = document.getElementById('rail');
  var marker = rail ? rail.querySelector('.rail-marker') : null;
  var railLinks = rail ? Array.prototype.slice.call(rail.querySelectorAll('a[href^="#"]')) : [];
  var spied = links.concat(railLinks).map(function (a) { return { a: a, el: document.getElementById(a.getAttribute('href').slice(1)) }; }).filter(function (s) { return s.el; });
  var pending = false;
  function update() {
    pending = false;
    if (nav) nav.classList.toggle('show', window.scrollY > 320);
    if (rail) rail.classList.toggle('show', window.scrollY > 320);
    if (progress) { var max = document.documentElement.scrollHeight - window.innerHeight; progress.style.transform = 'scaleX(' + (max > 0 ? Math.min(1, window.scrollY / max) : 0) + ')'; }
    var cur = null;
    spied.forEach(function (s) { if (s.el.getBoundingClientRect().top <= 100) cur = s; });
    if (window.innerHeight + window.scrollY >= document.body.scrollHeight - 2) cur = spied[spied.length - 1];
    var curId = cur ? cur.el.id : null;
    spied.forEach(function (s) { s.a.classList.toggle('active', !!curId && s.el.id === curId); });
    if (rail) {
      rail.classList.toggle('has-current', !!curId);
      railLinks.forEach(function (a) {
        var on = !!curId && a.getAttribute('href') === '#' + curId;
        if (on && marker) { marker.style.height = (a.offsetHeight - 10) + 'px'; marker.style.transform = 'translateY(' + (a.offsetTop + 5) + 'px)'; }
      });
    }
  }
  window.addEventListener('scroll', function () { if (!pending) { pending = true; requestAnimationFrame(update); } }, { passive: true });
  window.addEventListener('resize', update);
  update();

  /* reveal on scroll */
  var targets = document.querySelectorAll('.reveal');
  if (reduced || !('IntersectionObserver' in window)) {
    targets.forEach(function (el) { el.classList.add('in'); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });
    targets.forEach(function (el) { io.observe(el); });
  }

  /* Fig. 1 walkthrough: a spotlight moves over the paper's figure, driven by the step list */
  var pipe = document.getElementById('pipe');
  if (pipe) {
    var steps = Array.prototype.slice.call(pipe.querySelectorAll('.steps li[data-step]'));
    var spot = pipe.querySelector('.spot');
    var regions = [ /* percent boxes on the (frame-cropped, 838x694) figure: left, top, width, height */
      [0.6, 6.6, 17.8, 41.2], [17.4, 6.6, 37.7, 41.2], [55.0, 6.6, 44.7, 42.2], [14.3, 54.0, 40.7, 40.1], [55.0, 54.0, 24.4, 38.1], [79.5, 45.7, 20.2, 54.0]
    ];
    var cur = 0, timer = null, playing = !reduced;
    function render(i) {
      cur = i; var r = regions[i];
      if (spot) { spot.style.left = r[0] + '%'; spot.style.top = r[1] + '%'; spot.style.width = r[2] + '%'; spot.style.height = r[3] + '%'; }
      steps.forEach(function (li, k) { li.classList.toggle('on', k === i); li.setAttribute('aria-current', k === i ? 'true' : 'false'); });
    }
    function next() { render((cur + 1) % regions.length); }
    function schedule() { clearTimeout(timer); if (playing) timer = setTimeout(function () { next(); schedule(); }, 3200); }
    steps.forEach(function (li, k) {
      li.setAttribute('tabindex', '0');
      li.addEventListener('click', function () { render(k); schedule(); });
      li.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); render(k); schedule(); } });
    });
    var btn = pipe.querySelector('.ctl button');
    if (btn) {
      btn.textContent = playing ? 'Pause' : 'Play';
      btn.addEventListener('click', function () { playing = !playing; btn.textContent = playing ? 'Pause' : 'Play'; schedule(); });
    }
    pipe.addEventListener('mouseenter', function () { clearTimeout(timer); });
    pipe.addEventListener('mouseleave', function () { schedule(); });
    render(0); schedule();
  }

  /* chart tooltips */
  var tip = document.getElementById('tip');
  if (tip) {
    document.querySelectorAll('.chart').forEach(function (chart) {
      chart.querySelectorAll('.hit').forEach(function (hit) {
        hit.setAttribute('tabindex', '0'); hit.setAttribute('role', 'img');
        hit.setAttribute('aria-label', (hit.dataset.name || '') + ': ' + (hit.dataset.val || ''));
        var mark = hit.previousElementSibling;
        function enter() {
          tip.textContent = '';
          var v = document.createElement('span'); v.className = 'v';
          var sw = document.createElement('i'); sw.style.background = hit.dataset.color || '#333';
          v.appendChild(sw); v.appendChild(document.createTextNode(hit.dataset.val || ''));
          var n = document.createElement('span'); n.className = 'n'; n.textContent = hit.dataset.name || '';
          tip.appendChild(v); tip.appendChild(n);
          if (hit.dataset.sub) { var s = document.createElement('span'); s.className = 's'; s.textContent = hit.dataset.sub; tip.appendChild(s); }
          var r = hit.getBoundingClientRect();
          tip.style.left = Math.max(160, Math.min(window.innerWidth - 160, r.left + r.width / 2)) + 'px';
          tip.style.top = (r.top - 10) + 'px';
          tip.classList.add('on'); chart.classList.add('dim');
          if (mark && mark.classList.contains('mark')) mark.classList.add('on');
        }
        function leave() { tip.classList.remove('on'); chart.classList.remove('dim'); if (mark) mark.classList.remove('on'); }
        hit.addEventListener('mouseenter', enter); hit.addEventListener('mouseleave', leave);
        hit.addEventListener('focus', enter); hit.addEventListener('blur', leave);
        hit.addEventListener('touchstart', enter, { passive: true }); hit.addEventListener('touchend', leave);
      });
    });
  }

  /* copy BibTeX */
  document.querySelectorAll('.copybtn').forEach(function (b) {
    b.addEventListener('click', function () {
      var pre = b.parentNode.querySelector('pre'); if (!pre) return;
      var done = function () { b.textContent = 'Copied'; setTimeout(function () { b.textContent = 'Copy'; }, 1600); };
      if (navigator.clipboard) { navigator.clipboard.writeText(pre.textContent).then(done, done); }
      else {
        var r = document.createRange(); r.selectNodeContents(pre); var sel = window.getSelection(); sel.removeAllRanges(); sel.addRange(r);
        try { document.execCommand('copy'); } catch (e) {}
        sel.removeAllRanges(); done();
      }
    });
  });
})();
