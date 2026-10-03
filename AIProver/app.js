/* AIProver project page: nav, scroll-spy, reveal, pipeline walkthrough, chart tooltips, copy. Progressive: the page reads without JS. */
(function () {
  'use strict';
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* nav + scroll-spy */
  var nav = document.getElementById('nav');
  var progress = nav ? nav.querySelector('.progress') : null;
  var links = nav ? Array.prototype.slice.call(nav.querySelectorAll('.links a[href^="#"]')) : [];
  var spied = links.map(function (a) { return { a: a, el: document.getElementById(a.getAttribute('href').slice(1)) }; }).filter(function (s) { return s.el; });
  var pending = false;
  function update() {
    pending = false;
    if (nav) nav.classList.toggle('show', window.scrollY > 320);
    if (progress) { var max = document.documentElement.scrollHeight - window.innerHeight; progress.style.transform = 'scaleX(' + (max > 0 ? Math.min(1, window.scrollY / max) : 0) + ')'; }
    var cur = null;
    spied.forEach(function (s) { if (s.el.getBoundingClientRect().top <= 100) cur = s; });
    spied.forEach(function (s) { s.a.classList.toggle('active', s === cur); });
  }
  window.addEventListener('scroll', function () { if (!pending) { pending = true; requestAnimationFrame(update); } }, { passive: true });
  window.addEventListener('resize', update);
  update();

  /* reveal */
  var targets = document.querySelectorAll('.reveal');
  if (reduced || !('IntersectionObserver' in window)) { targets.forEach(function (el) { el.classList.add('in'); }); }
  else {
    var io = new IntersectionObserver(function (entries) { entries.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }); }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });
    targets.forEach(function (el) { io.observe(el); });
  }

  /* pipeline walkthrough: one state machine, driven by the step list */
  var pipe = document.getElementById('pipe');
  if (pipe) {
    var steps = Array.prototype.slice.call(pipe.querySelectorAll('.steps li[data-step]'));
    var svg = pipe.querySelector('svg');
    var q = function (sel) { return Array.prototype.slice.call(svg.querySelectorAll(sel)); };
    var mVer = svg.querySelector('#m-ver'), hVer = svg.querySelector('#h-ver');
    var round = svg.querySelector('#round');
    /* each state: which operator box, arrows and version labels light up; the model/harness subscripts */
    var states = [
      { op: null,      arrows: [],         m: '0', h: '0', mOn: false, hOn: false, round: 'start' },
      { op: 'op-he1',  arrows: ['a-he1'],  m: '0', h: '1', mOn: false, hOn: true,  round: 'phase 1' },
      { op: 'op-sam',  arrows: ['a-sam'],  m: '1', h: '1', mOn: true,  hOn: false, round: 'phase 1' },
      { op: 'op-he2',  arrows: ['a-he2'],  m: 'i', h: 'i+1', mOn: false, hOn: true, round: 'round i' },
      { op: 'op-rl',   arrows: ['a-rl'],   m: 'i+1', h: 'i+1', mOn: true, hOn: false, round: 'round i' },
      { op: 'op-gate', arrows: ['a-gate'], m: 'i+1', h: 'i+1', mOn: true, hOn: true, round: 'round i, gated' }
    ];
    var cur = 0, timer = null, playing = !reduced;
    function render(i) {
      cur = i; var s = states[i];
      q('.op').forEach(function (el) { el.classList.toggle('on', el.id === s.op); });
      q('.pulse').forEach(function (el) { el.classList.toggle('on', el.getAttribute('data-for') === s.op); });
      q('.arrow').forEach(function (el) { el.classList.toggle('on', s.arrows.indexOf(el.id) >= 0); });
      if (mVer) { mVer.textContent = s.m; mVer.classList.toggle('on', s.mOn); }
      if (hVer) { hVer.textContent = s.h; hVer.classList.toggle('on', s.hOn); }
      if (round) round.textContent = s.round;
      steps.forEach(function (li, k) { li.classList.toggle('on', k === i); });
    }
    function next() { render((cur + 1) % states.length); }
    function schedule() { clearTimeout(timer); if (playing) timer = setTimeout(function () { next(); schedule(); }, 3000); }
    steps.forEach(function (li, k) {
      li.addEventListener('click', function () { render(k); schedule(); });
      li.setAttribute('tabindex', '0');
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
        function enter(ev) {
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
        hit.addEventListener('touchstart', function (e) { enter(e); }, { passive: true }); hit.addEventListener('touchend', leave);
      });
    });
  }

  /* copy bibtex */
  document.querySelectorAll('.copybtn').forEach(function (b) {
    b.addEventListener('click', function () {
      var pre = b.parentNode.querySelector('pre'); if (!pre) return;
      var done = function () { b.textContent = 'Copied'; setTimeout(function () { b.textContent = 'Copy'; }, 1600); };
      if (navigator.clipboard) navigator.clipboard.writeText(pre.textContent).then(done, done);
      else { var r = document.createRange(); r.selectNodeContents(pre); var sel = window.getSelection(); sel.removeAllRanges(); sel.addRange(r); try { document.execCommand('copy'); } catch (e) {} sel.removeAllRanges(); done(); }
    });
  });
})();
