/* MILO discovery replay: an EinsteinArena search over wall-clock days.
   Data: static/einstein-run.js (window.MILO_EINSTEIN), extracted by tools/extract_einstein.py from the run
   directories: every harness evaluation and every sub-record construction, timestamped by its file on disk,
   plus the starting and record constructions. Left: objective vs. day, with the arena's #1 as a line.
   Right: the discovered function drawn against the arena entry the agent started from. */

(function () {
  'use strict';
  var root = document.getElementById('einstein');
  var ALL = window.MILO_EINSTEIN;
  if (!root || !ALL) return;

  var INK = '#101828', SOFT = '#475467', FAINT = '#7b8494', GRID = '#e6e9ef', RED = '#d9412f', REDINK = '#b8321f', BLUE = '#2f6db3', GRAY = '#9aa3b2';
  var NS = 'http://www.w3.org/2000/svg';
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function el(tag, attrs, parent) {
    var e = document.createElementNS(NS, tag);
    for (var k in attrs) if (attrs[k] !== null && attrs[k] !== undefined) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e); return e;
  }
  function txt(x, y, s, attrs, parent) {
    var t = el('text', Object.assign({ x: x, y: y, 'font-family': 'Inter, system-ui, sans-serif' }, attrs || {}), parent);
    t.textContent = s; return t;
  }
  function fmtDay(d) {
    var days = Math.floor(d), hours = Math.floor((d - days) * 24);
    return 'Day ' + days + ', ' + (hours < 10 ? '0' : '') + hours + ' h';
  }
  function fmtDate(iso) { // 2026-09-15T05:48Z -> Sep 15, 05:48 UTC
    var m = iso.match(/(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/); if (!m) return iso;
    var mon = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][+m[2] - 1];
    return mon + ' ' + (+m[3]) + ', ' + m[4] + ':' + m[5] + ' UTC';
  }
  function dateAt(t0iso, day) {
    var m = t0iso.match(/(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/);
    var t = Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5]) + day * 86400000;
    var d = new Date(t);
    return fmtDate(d.toISOString().slice(0, 16) + 'Z');
  }

  var state = { key: 'c3', day: 0, playing: false, timer: null, speed: 1 };
  var ctl = document.createElement('div'); ctl.className = 'demo-ctl';
  ctl.innerHTML =
    '<button type="button" class="demo-btn demo-play"><span class="ic-play"></span><span class="lbl">Pause</span></button>' +
    '<button type="button" class="demo-btn demo-restart">Restart</button>' +
    '<label class="demo-slider"><span class="vis-hidden">Day</span><input type="range" min="0" max="1000" value="0" step="1"></label>' +
    '<div class="seg demo-speed" role="group" aria-label="Problem"><button type="button" data-prob="c3" aria-pressed="true">3rd autocorrelation</button><button type="button" data-prob="erdos" aria-pressed="false">Erdős overlap</button></div>';
  var stage = document.createElement('div'); stage.className = 'einstein-stage';
  root.appendChild(stage); root.appendChild(ctl);
  var slider = ctl.querySelector('input'), playBtn = ctl.querySelector('.demo-play'), playLbl = playBtn.querySelector('.lbl');

  var view = null;
  function build(key) {
    var P = ALL.problems[key];
    stage.innerHTML = '';
    var W = 1000, H = 540;
    var HALO = { 'paint-order': 'stroke', stroke: '#fff', 'stroke-width': 3, 'stroke-linejoin': 'round' };
    var svg = el('svg', { viewBox: '0 0 ' + W + ' ' + H, class: 'demo-svg', role: 'img', 'aria-label': P.title + ': objective over wall-clock days and the discovered construction' }, stage);
    // ---- left: objective vs day
    var LX0 = 84, LX1 = 586, LY0 = 70, LY1 = 400;
    var days = Math.ceil(P.days);
    var scores = P.evals.map(function (e) { return e[1]; }).concat(P.discoveries.map(function (d) { return d[1]; }), [P.prior, P.ours]);
    var smin = Math.min.apply(null, scores), smax = Math.max.apply(null, scores);
    var pad = (smax - smin) * 0.10; smin -= pad; smax += pad * 1.6;
    function X(d) { return LX0 + (LX1 - LX0) * d / days; }
    function Y(s) { return LY1 - (LY1 - LY0) * (s - smin) / (smax - smin); }
    var g = el('g', {}, svg);
    txt(LX0, 36, 'Objective of every candidate over wall-clock time', { 'font-size': 12, fill: SOFT, 'font-weight': 600 }, g);
    txt(LX0, 52, P.objective, { 'font-size': 11, fill: FAINT }, g);
    // y ticks: 6 nice values
    var digits = key === 'erdos' ? 7 : 5, tickN = 5;
    for (var i = 0; i <= tickN; i++) {
      var v = smin + (smax - smin) * i / tickN;
      el('line', { x1: LX0, y1: Y(v), x2: LX1, y2: Y(v), stroke: GRID }, g);
      txt(LX0 - 8, Y(v) + 3.5, v.toFixed(digits), { 'text-anchor': 'end', 'font-size': 10.5, fill: FAINT, 'font-variant-numeric': 'tabular-nums' }, g);
    }
    for (var d = 0; d <= days; d += (days > 12 ? 2 : 1)) {
      el('line', { x1: X(d), y1: LY1, x2: X(d), y2: LY1 + 4, stroke: '#c8d0db' }, g);
      txt(X(d), LY1 + 16, d, { 'text-anchor': 'middle', 'font-size': 11, fill: FAINT }, g);
    }
    el('line', { x1: LX0, y1: LY1, x2: LX1, y2: LY1, stroke: '#c8d0db' }, g);
    txt((LX0 + LX1) / 2, LY1 + 34, 'Days since the search started (' + fmtDate(P.t0).replace(/, .*/, '') + ' → ' + fmtDate(dateAt(P.t0, P.days)).replace(/, .*/, '') + ')', { 'text-anchor': 'middle', 'font-size': 11.5, fill: SOFT, 'font-weight': 500 }, g);
    // prior best line
    el('line', { x1: LX0, y1: Y(P.prior), x2: LX1, y2: Y(P.prior), stroke: REDINK, 'stroke-width': 1.2, 'stroke-opacity': .7 }, g);
    // off-scale references
    var refs = Object.keys(P.others).map(function (k) { return k + ' ' + P.others[k]; }).join('  ·  ');
    txt(LX1, LY0 - 4, '▲ off the chart: ' + refs, { 'text-anchor': 'end', 'font-size': 10, fill: FAINT }, g);
    // dynamic layers
    var gEval = el('g', {}, svg), gDisc = el('g', {}, svg), gRun = el('g', {}, svg), gCursor = el('g', {}, svg), gAnn = el('g', {}, svg);
    txt(LX1, Y(P.prior) - 6, 'arena #1 before MILO · ' + P.prior.toFixed(digits) + ' (' + P.prior_who.split(',')[0] + ')', Object.assign({ 'text-anchor': 'end', 'font-size': 10.5, fill: REDINK, 'font-weight': 600 }, HALO), gAnn);
    var evalEls = P.evals.map(function (e) {
      return { day: e[0], el: el('circle', { cx: X(e[0]), cy: Y(e[1]), r: 4.2, fill: '#fff', stroke: e[4] ? BLUE : GRAY, 'stroke-width': 1.5, opacity: 0 }, gEval) };
    });
    var discEls = P.discoveries.map(function (d) {
      return { day: d[0], el: el('circle', { cx: X(d[0]), cy: Y(d[1]), r: 2.2, fill: BLUE, 'fill-opacity': .55, opacity: 0 }, gDisc) };
    });
    var runPath = el('path', { fill: 'none', stroke: RED, 'stroke-width': 2.2, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' }, gRun);
    var runDot = el('circle', { r: 4.5, fill: RED, stroke: '#fff', 'stroke-width': 1.5 }, gRun);
    var cursor = el('line', { x1: X(0), y1: LY0 - 10, x2: X(0), y2: LY1, stroke: INK, 'stroke-opacity': .35, 'stroke-width': 1 }, gCursor);
    var clockBg = el('rect', { x: LX1 - 178, y: LY0 - 44, width: 178, height: 26, rx: 13, fill: '#fff', stroke: '#e4e7ec' }, gCursor);
    var clock = txt(LX1 - 89, LY0 - 26, '', { 'text-anchor': 'middle', 'font-size': 11.5, fill: INK, 'font-weight': 600, 'font-variant-numeric': 'tabular-nums' }, gCursor);
    var crossLbl = txt(0, 0, '', Object.assign({ 'font-size': 11, fill: REDINK, 'font-weight': 700, opacity: 0 }, HALO), gAnn);
    var recLbl1 = txt(0, 0, '', Object.assign({ 'font-size': 11.5, fill: REDINK, 'font-weight': 700, opacity: 0, 'text-anchor': 'end' }, HALO), gAnn);
    var recLbl2 = txt(0, 0, '', Object.assign({ 'font-size': 10.5, fill: SOFT, opacity: 0, 'text-anchor': 'end' }, HALO), gAnn);
    var star = el('polygon', { fill: RED, stroke: '#fff', 'stroke-width': 1.4, opacity: 0 }, gAnn);

    // ---- right: construction
    var RX0 = 650, RX1 = 976, RY0 = 90, RY1 = 380;
    var gR = el('g', {}, svg);
    txt(RX0, 36, key === 'erdos' ? 'The discovered step function h' : 'The discovered function f', { 'font-size': 12, fill: SOFT, 'font-weight': 600 }, gR);
    txt(RX0, 52, (P.record_n).toLocaleString() + ' samples on [' + P.domain[0] + ', ' + P.domain[1] + ']', { 'font-size': 10.5, fill: FAINT }, gR);
    txt(RX0, 66, 'gray: ' + P.start_who.replace(/ \(.*/, '') + ', the entry the agent started from', { 'font-size': 10.5, fill: FAINT }, gR);
    var vals = P.record, start = P.start;
    var vmin = Math.min.apply(null, vals.concat(start)), vmax = Math.max.apply(null, vals.concat(start));
    if (key === 'erdos') { vmin = -0.04; vmax = 1.04; }
    function RX(i, n) { return RX0 + (RX1 - RX0) * i / (n - 1); }
    function RY(v) { return RY1 - (RY1 - RY0) * (v - vmin) / (vmax - vmin); }
    el('rect', { x: RX0, y: RY0, width: RX1 - RX0, height: RY1 - RY0, fill: '#f6f8fb', rx: 8 }, gR);
    if (vmin < 0 && vmax > 0) el('line', { x1: RX0, y1: RY(0), x2: RX1, y2: RY(0), stroke: '#c8d0db' }, gR);
    txt(RX0, RY1 + 16, P.domain[0], { 'font-size': 10.5, fill: FAINT }, gR);
    txt(RX1, RY1 + 16, P.domain[1], { 'font-size': 10.5, fill: FAINT, 'text-anchor': 'end' }, gR);
    txt((RX0 + RX1) / 2, RY1 + 16, key === 'erdos' ? 'x' : 'x', { 'font-size': 10.5, fill: FAINT, 'text-anchor': 'middle', 'font-style': 'italic' }, gR);
    txt(RX0 - 6, RY(vmax) + 4, key === 'erdos' ? '1' : Math.round(vmax), { 'font-size': 10, fill: FAINT, 'text-anchor': 'end' }, gR);
    txt(RX0 - 6, RY(vmin) + 4, key === 'erdos' ? '0' : Math.round(vmin), { 'font-size': 10, fill: FAINT, 'text-anchor': 'end' }, gR);
    function curve(arr, step) {
      var d = '';
      for (var i = 0; i < arr.length; i++) {
        var x = RX(i, arr.length), yv = RY(arr[i]);
        if (i === 0) d += 'M' + x.toFixed(1) + ' ' + yv.toFixed(1);
        else if (step) d += 'H' + x.toFixed(1) + 'V' + yv.toFixed(1);
        else d += 'L' + x.toFixed(1) + ' ' + yv.toFixed(1);
      }
      return d;
    }
    var isStep = P.kind === 'step';
    el('path', { d: curve(start, isStep), fill: 'none', stroke: GRAY, 'stroke-width': isStep ? 1.4 : 1, 'stroke-opacity': .8 }, gR);
    var recPath = el('path', { d: curve(vals, isStep), fill: 'none', stroke: RED, 'stroke-width': isStep ? 2 : 1.1, 'stroke-linejoin': 'round', opacity: 0 }, gR);
    var recBadge = el('g', { opacity: 0 }, gR);
    el('rect', { x: RX0 + 10, y: RY0 + 10, width: 150, height: 22, rx: 11, fill: '#fff6f4', stroke: RED }, recBadge);
    txt(RX0 + 85, RY0 + 25, 'new arena record', { 'text-anchor': 'middle', 'font-size': 11, fill: REDINK, 'font-weight': 700 }, recBadge);

    // ---- footer strip
    var FY = 472;
    el('rect', { x: 14, y: FY - 26, width: W - 28, height: 74, rx: 12, fill: '#f6f8fb', stroke: '#e4e7ec' }, svg);
    var fTag = txt(30, FY - 4, '', { 'font-size': 11, 'font-weight': 700, fill: SOFT, 'letter-spacing': '.08em' }, svg);
    var fLine1 = txt(30, FY + 17, '', { 'font-size': 13.5, fill: INK }, svg);
    var fLine2 = txt(30, FY + 37, '', { 'font-size': 13, fill: SOFT }, svg);

    var recordDay = P.running_min[P.running_min.length - 1][0];
    function render(day) {
      day = Math.max(0, Math.min(P.days, day));
      evalEls.forEach(function (o) { o.el.style.opacity = o.day <= day ? 1 : 0; });
      discEls.forEach(function (o) { o.el.style.opacity = o.day <= day ? 1 : 0; });
      // running minimum step path up to `day`
      var d = '', last = null, cur = null;
      P.running_min.forEach(function (r) {
        if (r[0] > day) return;
        if (!d) d = 'M' + X(r[0]) + ' ' + Y(r[1]); else d += 'H' + X(r[0]) + 'V' + Y(r[1]);
        cur = r;
      });
      if (cur) { d += 'H' + X(day); runDot.setAttribute('cx', X(day)); runDot.setAttribute('cy', Y(cur[1])); runDot.style.opacity = 1; } else runDot.style.opacity = 0;
      runPath.setAttribute('d', d);
      cursor.setAttribute('x1', X(day)); cursor.setAttribute('x2', X(day));
      clock.textContent = fmtDay(day) + ' · ' + dateAt(P.t0, day);
      // annotations
      var fb = P.first_below_prior;
      if (fb && day >= fb[0]) {
        crossLbl.textContent = '↓ below the arena’s #1 on day ' + Math.floor(fb[0]) + ' (' + fmtDate(fb[2]).replace(/, .*/, '') + ')';
        crossLbl.setAttribute('x', Math.min(X(fb[0]) + 8, LX1 - 260)); crossLbl.setAttribute('y', Y(P.prior) + 16); crossLbl.style.opacity = 1;
      } else crossLbl.style.opacity = 0;
      var rec = day >= recordDay;
      if (rec) {
        var rx = X(recordDay), ry = Y(P.ours);
        var pts = []; for (var i = 0; i < 10; i++) { var a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? 4.4 : 9.5; pts.push((rx + rr * Math.cos(a)).toFixed(1) + ',' + (ry + rr * Math.sin(a)).toFixed(1)); }
        star.setAttribute('points', pts.join(' ')); star.style.opacity = 1;
        var lx = rx - 16 > LX0 + 200 ? rx - 16 : rx + 16, anchor = rx - 16 > LX0 + 200 ? 'end' : 'start';
        recLbl1.setAttribute('x', lx); recLbl1.setAttribute('y', ry + 4); recLbl1.setAttribute('text-anchor', anchor); recLbl1.textContent = 'record ' + P.ours.toFixed(10); recLbl1.style.opacity = 1;
        recLbl2.setAttribute('x', lx); recLbl2.setAttribute('y', ry + 18); recLbl2.setAttribute('text-anchor', anchor); recLbl2.textContent = fmtDay(recordDay) + ' · ' + fmtDate(P.running_min[P.running_min.length - 1][2]); recLbl2.style.opacity = 1;
        recPath.style.opacity = 1; recBadge.style.opacity = 1;
      } else { star.style.opacity = 0; recLbl1.style.opacity = 0; recLbl2.style.opacity = 0; recPath.style.opacity = 0; recBadge.style.opacity = 0; }
      // footer narration
      var nd = P.discoveries.filter(function (x) { return x[0] <= day; }).length, ne = P.evals.filter(function (x) { return x[0] <= day; }).length;
      if (day < (fb ? fb[0] : 1)) {
        fTag.textContent = 'SEARCH UNDER WAY'; fTag.setAttribute('fill', SOFT);
        fLine1.textContent = ne + ' harness' + (ne === 1 ? '' : 'es') + ' evaluated so far, each on 30 optimizer-writing tasks against frozen arena entries (ranks 2–6; rank 1 held out).';
        fLine2.textContent = 'Every candidate construction that beats the frozen #1 is saved by a discovery hook and rescored by the arena’s own verifier.';
      } else if (!rec) {
        fTag.textContent = 'BELOW THE ARENA’S #1'; fTag.setAttribute('fill', REDINK);
        fLine1.textContent = nd + ' sub-record construction' + (nd === 1 ? '' : 's') + ' so far; the running best keeps ratcheting down while the harness itself keeps evolving.';
        fLine2.textContent = 'Blue dots: constructions written by the evolved agents. Hollow circles: harness evaluations (best of 30 tasks).';
      } else {
        var margin = (P.prior - P.ours);
        fTag.textContent = 'NEW RECORD · ' + P.title.toUpperCase(); fTag.setAttribute('fill', REDINK);
        fLine1.textContent = P.prior.toFixed(10) + ' → ' + P.ours.toFixed(10) + '   (margin ' + margin.toExponential(1).replace('e-', ' × 10⁻') + ', confirmed by the arena’s verifier)';
        fLine2.textContent = 'Set on ' + fmtDay(recordDay).toLowerCase() + ' of the search; ' + P.n_discoveries + ' sub-record constructions were found in total over ' + Math.round(P.days) + ' days.';
      }
      slider.value = Math.round(1000 * day / P.days);
      state.day = day;
    }
    view = { P: P, render: render };
    render(state.day);
  }

  // ---- playback: sweep the wall-clock at constant speed, then hold
  var SWEEP_MS = 13000, HOLD_MS = 3000, last = null;
  function frame(ts) {
    if (!state.playing) return;
    if (last === null) last = ts;
    var dt = (ts - last) * state.speed; last = ts;
    var P = view.P;
    var day = state.day + dt / SWEEP_MS * P.days;
    if (day >= P.days) {
      view.render(P.days);
      state.timer = setTimeout(function () { state.day = 0; last = null; if (state.playing) requestAnimationFrame(frame); }, HOLD_MS);
      return;
    }
    view.render(day);
    requestAnimationFrame(frame);
  }
  function play() { if (state.playing) return; state.playing = true; last = null; playLbl.textContent = 'Pause'; root.classList.add('playing'); requestAnimationFrame(frame); }
  function pause() { state.playing = false; clearTimeout(state.timer); playLbl.textContent = 'Play'; root.classList.remove('playing'); }
  playBtn.addEventListener('click', function () { state.playing ? pause() : play(); });
  ctl.querySelector('.demo-restart').addEventListener('click', function () { state.day = 0; view.render(0); if (!state.playing) play(); });
  slider.addEventListener('input', function () { pause(); view.render(+slider.value / 1000 * view.P.days); });
  ctl.querySelectorAll('[data-prob]').forEach(function (b) {
    b.addEventListener('click', function () {
      ctl.querySelectorAll('[data-prob]').forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); });
      state.key = b.getAttribute('data-prob'); state.day = 0; pause(); build(state.key); play();
    });
  });

  build(state.key);
  if (root.hasAttribute('data-autoplay')) play();
  else if ('IntersectionObserver' in window && !reduced) {
    var io = new IntersectionObserver(function (es) { if (es[0].isIntersecting) { play(); io.disconnect(); } }, { threshold: .35 });
    io.observe(root);
  } else view.render(view.P.days);
  window.MILO_EINSTEIN_DEMO = { seek: function (d) { pause(); view.render(d); }, play: play, pause: pause, show: function (k) { state.key = k; build(k); } };
})();
