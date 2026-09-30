/* MILO demo: replay of one real search run (Terminal-Bench 2.1, gpt-oss-120b), round by round.
   Data: static/demo-run.js (window.MILO_RUN), extracted from the run's own records by tools/extract_run.py.
   Renders an SVG with per-island lineage trees (x = round), cross-island grafts, mutator badges,
   a best-so-far pass-rate chart, and a narration line from the orchestrator's diagnoses. */

(function () {
  'use strict';
  var root = document.getElementById('demo');
  var D = window.MILO_RUN;
  if (!root || !D) return;

  var ISL = ['#2a78d6', '#7d3c98', '#d55181'];
  var ISL_NAME = ['Island 1', 'Island 2', 'Island 3'];
  var GOOD = '#1b7f3b', REJ = '#9aa3b2', INK = '#101828', SOFT = '#475467', FAINT = '#7b8494', GRID = '#e6e9ef', RED = '#e8710a', BAD = '#c4453a';
  var W = 1000, ROUNDS = D.rounds, H;
  var STALL = [6, 14];
  var ORCH = {}; D.orchestration.forEach(function (o) { ORCH[o.round] = o; });
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ------------------------------------------------------------ helpers
  var NS = 'http://www.w3.org/2000/svg';
  function el(tag, attrs, parent) {
    var e = document.createElementNS(NS, tag);
    for (var k in attrs) { if (attrs[k] !== null && attrs[k] !== undefined) e.setAttribute(k, attrs[k]); }
    if (parent) parent.appendChild(e);
    return e;
  }
  function txt(x, y, s, attrs, parent) {
    var t = el('text', Object.assign({ x: x, y: y, 'font-family': 'Inter, system-ui, sans-serif' }, attrs || {}), parent);
    t.textContent = s; return t;
  }
  function pct(v) { return (v * 100).toFixed(1); }
  var byId = {}; D.nodes.forEach(function (n) { byId[n.id] = n; });

  // ------------------------------------------------------------ layout
  // x: round. y: a "git-graph" row per island. An admitted child continues its parent's row
  // (the lineage line); rejected children (always leaves) borrow the lowest row free at that round.
  var islands = [0, 1, 2].map(function (i) {
    var nodes = D.nodes.filter(function (n) { return n.island === i; })
      .sort(function (a, b) { return a.round - b.round || (a.kind === 'graft') - (b.kind === 'graft') || a.id.localeCompare(b.id); });
    var reserved = {}, lastUse = {}, rows = 4;
    nodes.forEach(function (n) {
      var p = n.parent ? byId[n.parent] : null;
      if (!p) { n.row = 0; reserved[0] = true; return; }
      if (n.admitted && !p._cont) { n.row = p.row; p._cont = true; }
      else {
        var r = 0;
        while (reserved[r] || (lastUse[r] !== undefined && lastUse[r] >= n.round - 1) || (r === p.row)) r++;
        n.row = r;
        if (n.admitted) reserved[r] = true; else lastUse[r] = n.round;
      }
      rows = Math.max(rows, n.row + 1);
    });
    return { i: i, nodes: nodes, rows: rows };
  });
  var LX0 = 118, LX1 = 600, TOP = 70, ROWH = 13, LANE_PAD = 16;
  var totalRows = islands.reduce(function (s, l) { return s + l.rows; }, 0);
  var avail = 430 - TOP - LANE_PAD * 2 * islands.length;
  if (totalRows * ROWH > avail) ROWH = avail / totalRows;
  var y = TOP;
  islands.forEach(function (l) { l.top = y; l.height = LANE_PAD * 2 + l.rows * ROWH; y += l.height; });
  var LANES_BOTTOM = y;
  H = LANES_BOTTOM + 44 + 108 + 12;
  function X(r) { return LX0 + (LX1 - LX0) * r / ROUNDS; }
  function Y(n) { var l = islands[n.island]; return l.top + LANE_PAD + n.row * ROWH + ROWH / 2; }

  // chart geometry
  var CX0 = 664, CX1 = 936, CY0 = TOP, CY1 = LANES_BOTTOM - 6, PMIN = 0.38, PMAX = 0.62;
  function CX(r) { return CX0 + (CX1 - CX0) * r / ROUNDS; }
  function CY(v) { return CY1 - (CY1 - CY0) * (v - PMIN) / (PMAX - PMIN); }

  // ------------------------------------------------------------ static scaffold
  root.innerHTML = '';
  var svg = el('svg', { viewBox: '0 0 ' + W + ' ' + H, class: 'demo-svg', role: 'img',
    'aria-label': 'Replay of a MILO search run: three islands of harness lineages, orchestrator grafts and mutator reassignments, and best-so-far pass-rate over 30 rounds' }, root);
  var defs = el('defs', {}, svg);
  ['ok', 'no'].forEach(function (k) {
    var m = el('marker', { id: 'dm-' + k, viewBox: '0 0 10 10', refX: 8, refY: 5, markerWidth: 6, markerHeight: 6, orient: 'auto' }, defs);
    el('path', { d: 'M0 0L10 5L0 10z', fill: k === 'ok' ? GOOD : REJ }, m);
  });
  var gStatic = el('g', {}, svg), gStall = el('g', {}, svg), gEdges = el('g', {}, svg), gGrafts = el('g', {}, svg),
      gNodes = el('g', {}, svg), gChart = el('g', {}, svg), gBadges = el('g', {}, svg), gOverlay = el('g', {}, svg);

  // round axis over the lanes
  for (var r = 0; r <= ROUNDS; r += 3) {
    el('line', { x1: X(r), y1: TOP - 6, x2: X(r), y2: LANES_BOTTOM, stroke: GRID, 'stroke-width': 1 }, gStatic);
    txt(X(r), TOP - 14, r, { 'text-anchor': 'middle', 'font-size': 11, fill: FAINT }, gStatic);
  }
  txt(LX0, TOP - 36, 'Lineage trees per island (x = evolution round)', { 'font-size': 12, fill: SOFT, 'font-weight': 600 }, gStatic);
  // orchestrator invocation ticks
  Object.keys(ORCH).forEach(function (r) {
    el('line', { x1: X(+r), y1: TOP - 6, x2: X(+r), y2: LANES_BOTTOM, stroke: '#33415c', 'stroke-opacity': .28, 'stroke-width': 1.2 }, gStatic);
    el('circle', { cx: X(+r), cy: TOP - 4, r: 3, fill: '#33415c' }, gStatic);
  });
  // lanes
  islands.forEach(function (l, i) {
    el('rect', { x: LX0 - 8, y: l.top + 4, width: LX1 - LX0 + 26, height: l.height - 8, rx: 10, fill: ISL[i], 'fill-opacity': .045 }, gStatic);
    txt(14, l.top + LANE_PAD + 4, ISL_NAME[i], { 'font-size': 13, 'font-weight': 700, fill: ISL[i] }, gStatic);
    txt(14, l.top + LANE_PAD + 20, 'seed ' + pct(D.seeds[i]) + '%', { 'font-size': 11, fill: FAINT }, gStatic);
  });
  // stall band (rendered when reached)
  var stallRect = el('rect', { x: X(STALL[0]), y: TOP, width: 0, height: LANES_BOTTOM - TOP, fill: '#f59e0b', 'fill-opacity': .10 }, gStall);
  var stallLabel = txt((X(STALL[0]) + X(STALL[1])) / 2, LANES_BOTTOM - 4, 'all islands stalled', { 'text-anchor': 'middle', 'font-size': 10.5, fill: '#b7791f', 'font-weight': 600, opacity: 0 }, gStall);

  // chart scaffold
  [0.40, 0.44, 0.48, 0.52, 0.56, 0.60].forEach(function (v) {
    el('line', { x1: CX0, y1: CY(v), x2: CX1, y2: CY(v), stroke: GRID }, gStatic);
    txt(CX0 - 8, CY(v) + 3.5, Math.round(v * 100), { 'text-anchor': 'end', 'font-size': 11, fill: FAINT }, gStatic);
  });
  [0, 10, 20, 30].forEach(function (r) { txt(CX(r), CY1 + 16, r, { 'text-anchor': 'middle', 'font-size': 11, fill: FAINT }, gStatic); });
  el('line', { x1: CX0, y1: CY1, x2: CX1, y2: CY1, stroke: '#c8d0db' }, gStatic);
  txt(CX0 - 30, TOP - 36, 'Best pass-rate so far (%)', { 'font-size': 12, fill: SOFT, 'font-weight': 600 }, gStatic);
  var chartStall = el('rect', { x: CX(STALL[0]), y: CY0, width: 0, height: CY1 - CY0, fill: '#f59e0b', 'fill-opacity': .10 }, gStall);
  var popPath = el('path', { fill: 'none', stroke: INK, 'stroke-opacity': .10, 'stroke-width': 8, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' }, gChart);
  var islPaths = islands.map(function (l, i) { return el('path', { fill: 'none', stroke: ISL[i], 'stroke-width': 2, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' }, gChart); });
  var islEnd = islands.map(function (l, i) { return el('circle', { r: 4, fill: ISL[i], stroke: '#fff', 'stroke-width': 1.5, opacity: 0 }, gChart); });
  var islEndLabel = islands.map(function (l, i) { return txt(0, 0, '', { 'font-size': 11, 'font-weight': 700, fill: ISL[i] }, gChart); });
  var star = el('polygon', { fill: RED, stroke: '#fff', 'stroke-width': 1.5, opacity: 0 }, gChart);

  // narration + round readout
  var NB = LANES_BOTTOM + 44;
  var narrBg = el('rect', { x: 14, y: NB, width: W - 28, height: 108, rx: 12, fill: '#f6f8fb', stroke: '#e4e7ec' }, gOverlay);
  var narrTag = txt(30, NB + 24, '', { 'font-size': 11, 'font-weight': 700, fill: RED, 'letter-spacing': '.08em' }, gOverlay);
  var readout = txt(W - 30, NB + 24, '', { 'text-anchor': 'end', 'font-size': 12, fill: FAINT, 'font-weight': 600 }, gOverlay);
  var narrLines = [txt(30, NB + 46, '', { 'font-size': 13.5, fill: INK }, gOverlay), txt(30, NB + 66, '', { 'font-size': 13.5, fill: INK }, gOverlay), txt(30, NB + 89, '', { 'font-size': 13, fill: SOFT }, gOverlay)];
  var scratch = txt(0, -200, '', { 'font-size': 13.5, opacity: 0 }, gOverlay);
  function wrap2(s, maxW) {  // greedy word wrap into at most two lines, measured in the rendered font
    var words = s.split(' '), lines = [], line = '';
    for (var i = 0; i < words.length; i++) {
      var t = line ? line + ' ' + words[i] : words[i];
      scratch.textContent = t;
      if (line && scratch.getComputedTextLength() > maxW) {
        lines.push(line); line = words[i];
        if (lines.length === 2) { lines[1] = lines[1].replace(/[,;:]?\s+\S*$/, '') + '\u2026'; return lines; }
      } else line = t;
    }
    lines.push(line); if (lines.length < 2) lines.push('');
    return lines;
  }

  // mutator badges per island (right of each lane)
  var badges = islands.map(function (l, i) {
    var g = el('g', {}, gBadges);
    var bx = 14, by = l.top + LANE_PAD + 30;
    el('rect', { x: bx, y: by, width: 40, height: 20, rx: 10, fill: '#eef2f7', stroke: '#33415c', 'stroke-opacity': .45 }, g);
    var t = txt(bx + 20, by + 14, '', { 'text-anchor': 'middle', 'font-size': 11, 'font-weight': 700, fill: '#33415c', 'font-family': 'JetBrains Mono, ui-monospace, monospace' }, g);
    txt(bx + 47, by + 14, 'mutator', { 'font-size': 9.5, fill: FAINT }, g);
    return { g: g, t: t, cur: null };
  });

  // ------------------------------------------------------------ dynamic elements per node
  function edgePath(x1, y1, x2, y2) {
    if (Math.abs(y1 - y2) < .5) return 'M' + x1 + ' ' + y1 + 'L' + x2 + ' ' + y2;
    var xm = (x1 + x2) / 2;
    return 'M' + x1 + ' ' + y1 + 'C' + xm + ' ' + y1 + ',' + xm + ' ' + y2 + ',' + x2 + ' ' + y2;
  }
  var items = [];  // {round, els:[...]} shown when round <= R
  D.nodes.forEach(function (n) {
    var x = X(n.round), yy = Y(n), els = [];
    if (n.parent) {
      var p = byId[n.parent];
      els.push(el('path', { d: edgePath(X(p.round), Y(p), x, yy), fill: 'none', stroke: n.admitted ? ISL[n.island] : REJ,
        'stroke-width': n.admitted ? 2 : 1.1, 'stroke-opacity': n.admitted ? .9 : .7, class: 'dm-edge' }, gEdges));
    }
    if (n.coparent) {
      var c = byId[n.coparent];
      var gx = X(c.round), gy = Y(c);
      var d = 'M' + gx + ' ' + gy + 'C' + ((gx + x) / 2) + ' ' + gy + ',' + ((gx + x) / 2) + ' ' + yy + ',' + (x - 7) + ' ' + yy;
      els.push(el('path', { d: d, fill: 'none', stroke: n.admitted ? GOOD : REJ, 'stroke-width': n.admitted ? 2 : 1.3,
        'stroke-dasharray': n.admitted ? null : '4 3', 'marker-end': 'url(#dm-' + (n.admitted ? 'ok' : 'no') + ')', class: 'dm-graft' }, gGrafts));
    }
    if (n.admitted) {
      els.push(el('circle', { cx: x, cy: yy, r: n.kind === 'seed' ? 6 : 5, fill: ISL[n.island], stroke: '#fff', 'stroke-width': 1.6, class: 'dm-node' }, gNodes));
      if (n.kind === 'graft') els.push(el('circle', { cx: x, cy: yy, r: 8.5, fill: 'none', stroke: GOOD, 'stroke-width': 1.6, class: 'dm-node' }, gNodes));
    } else {
      els.push(el('circle', { cx: x, cy: yy, r: 3.6, fill: '#fff', stroke: REJ, 'stroke-width': 1.4, class: 'dm-node' }, gNodes));
      els.push(el('path', { d: 'M' + (x - 1.8) + ' ' + (yy - 1.8) + 'l3.6 3.6M' + (x + 1.8) + ' ' + (yy - 1.8) + 'l-3.6 3.6', stroke: BAD, 'stroke-width': 1, 'stroke-opacity': .8, class: 'dm-node' }, gNodes));
    }
    var g = el('g', {}, gNodes);  // hit area with tooltip data
    var hit = el('circle', { cx: x, cy: yy, r: 9, fill: 'transparent', class: 'hit', 'data-name': ISL_NAME[n.island] + ' · round ' + n.round + (n.kind === 'graft' ? ' · graft' : n.kind === 'seed' ? ' · seed' : ''),
      'data-val': 'pass-rate ' + pct(n.pass) + '% · ' + (n.admitted ? 'admitted' : 'rejected'),
      'data-sub': (n.mutator ? 'mutator ' + n.mutator + ' (' + D.mutators[n.mutator] + ')' : (n.kind === 'graft' ? 'bred from ' + ISL_NAME[byId[n.coparent] ? byId[n.coparent].island : n.island] + '’s best' : 'initial harness')) + ' · ' + n.tokens + 'K tokens/attempt',
      'data-color': n.admitted ? ISL[n.island] : REJ }, g);
    els.push(g);
    items.push({ round: n.round, els: els });
  });

  // ------------------------------------------------------------ narration per round
  var mutName = function (c) { return c + ' (' + D.mutators[c] + ')'; };
  function narrate(R) {
    var o = ORCH[R];
    var born = D.nodes.filter(function (n) { return n.round === R; });
    var adm = born.filter(function (n) { return n.admitted; });
    if (R === 0) return ['seeds', 'Three expert-designed seed harnesses, one per island; every island starts with mutator cc.', 'Pass-rates ' + D.seeds.map(pct).join('%, ') + '% on the 62-task search split.', ''];
    if (o) {
      var moves = [];
      o.reassign.forEach(function (m) { moves.push('Reassign ' + ISL_NAME[m.island] + ': ' + m.from + ' → ' + m.to); });
      o.grafts.forEach(function (gr) { moves.push('Graft ' + ISL_NAME[gr.donor] + ' → ' + ISL_NAME[gr.dest] + (gr.admitted ? ' (admitted)' : ' (rejected)')); });
      var note = wrap2(o.summary || o.diagnosis, W - 62);
      return ['orchestrator · round ' + R, note[0], note[1], moves.join('  ·  ')];
    }
    if (adm.length) {
      var best = adm.sort(function (a, b) { return b.pass - a.pass; })[0];
      var gain = best.pass - Math.max.apply(null, D.nodes.filter(function (n) { return n.island === best.island && n.admitted && n.round < R; }).map(function (n) { return n.pass; }).concat([0]));
      return ['round ' + R, ISL_NAME[best.island] + ' admits a ' + (best.kind === 'graft' ? 'grafted' : 'rewritten') + ' harness at ' + pct(best.pass) + '%' + (gain > 0 ? ' (+' + pct(gain) + ')' : ''),
        born.length - adm.length ? (born.length - adm.length) + ' other candidate' + (born.length - adm.length > 1 ? 's' : '') + ' rejected: no Pareto gain, kept as negative evidence.' : 'Every island keeps mutating from its admitted set.', ''];
    }
    var rej = born.length;
    return ['round ' + R, rej ? rej + ' candidate' + (rej > 1 ? 's' : '') + ' evaluated, none admitted.' : 'Grafts from the last orchestrator round are being evaluated.',
      R >= STALL[0] && R <= STALL[1] ? 'All three islands have stalled; rejected children stay in memory as negative evidence.' : 'Mutators keep rewriting from each island’s admitted set.', ''];
  }

  // ------------------------------------------------------------ render state at round R
  var curR = -1;
  function starPts(cx, cy, r) {
    var pts = [];
    for (var i = 0; i < 10; i++) { var a = -Math.PI / 2 + i * Math.PI / 5, rad = i % 2 ? r * .46 : r; pts.push((cx + rad * Math.cos(a)).toFixed(1) + ',' + (cy + rad * Math.sin(a)).toFixed(1)); }
    return pts.join(' ');
  }
  function stepPath(arr, upto) {
    var d = '';
    for (var r = 0; r <= upto; r++) {
      var x = CX(r), yv = CY(arr[r]);
      if (r === 0) d += 'M' + x + ' ' + yv;
      else { d += 'H' + x; if (arr[r] !== arr[r - 1]) d += 'V' + yv; }
    }
    return d;
  }
  function render(R) {
    R = Math.max(0, Math.min(ROUNDS, Math.round(R)));
    if (R === curR) return; curR = R;
    items.forEach(function (it) { var on = it.round <= R; it.els.forEach(function (e) { e.style.opacity = on ? 1 : 0; e.style.pointerEvents = on ? 'auto' : 'none'; }); });
    // stall band grows with R
    var s0 = STALL[0], s1 = Math.min(R, STALL[1]);
    var w = R >= s0 ? X(s1) - X(s0) : 0;
    stallRect.setAttribute('width', w); chartStall.setAttribute('width', R >= s0 ? CX(s1) - CX(s0) : 0);
    stallLabel.style.opacity = R >= s0 + 2 ? 1 : 0;
    // chart
    popPath.setAttribute('d', stepPath(D.pop_best, R));
    islands.forEach(function (l, i) {
      islPaths[i].setAttribute('d', stepPath(D.best[i], R));
      islEnd[i].setAttribute('cx', CX(R)); islEnd[i].setAttribute('cy', CY(D.best[i][R])); islEnd[i].style.opacity = 1;
      islEndLabel[i].setAttribute('x', CX(R) + 8); islEndLabel[i].setAttribute('y', CY(D.best[i][R]) + 4);
      islEndLabel[i].textContent = pct(D.best[i][R]);
    });
    // de-collide end labels
    var lab = islands.map(function (l, i) { return { i: i, y: CY(D.best[i][R]) + 4 }; }).sort(function (a, b) { return a.y - b.y; });
    for (var k = 1; k < lab.length; k++) if (lab[k].y - lab[k - 1].y < 12) lab[k].y = lab[k - 1].y + 12;
    lab.forEach(function (o) { islEndLabel[o.i].setAttribute('y', o.y); });
    var bestR = D.pop_best.indexOf(Math.max.apply(null, D.pop_best));
    if (R >= bestR) { star.setAttribute('points', starPts(CX(bestR), CY(D.pop_best[bestR]), 9)); star.style.opacity = 1; } else star.style.opacity = 0;
    // mutator badges
    var asg = D.assignment[R] || D.assignment[ROUNDS];
    badges.forEach(function (b, i) {
      if (b.cur !== asg[i]) { b.t.textContent = asg[i]; b.g.classList.remove('flash'); void b.g.offsetWidth; if (b.cur !== null) b.g.classList.add('flash'); b.cur = asg[i]; }
    });
    // narration
    var n = narrate(R);
    narrTag.textContent = n[0].toUpperCase(); narrLines[0].textContent = n[1]; narrLines[1].textContent = n[2]; narrLines[2].textContent = n[3] || '';
    narrLines[1].setAttribute('fill', ORCH[R] ? INK : SOFT);
    narrTag.setAttribute('fill', ORCH[R] ? RED : SOFT);
    narrBg.setAttribute('stroke', ORCH[R] ? RED : '#e4e7ec'); narrBg.setAttribute('fill', ORCH[R] ? '#fff7ef' : '#f6f8fb');
    readout.textContent = 'ROUND ' + R + ' / ' + ROUNDS + '   ·   POPULATION BEST ' + pct(D.pop_best[R]) + '%';
    if (slider) slider.value = R;
  }

  // ------------------------------------------------------------ controls + timeline
  var ctl = document.createElement('div'); ctl.className = 'demo-ctl'; root.appendChild(ctl);
  ctl.innerHTML =
    '<button type="button" class="demo-btn demo-play" aria-label="Play or pause"><span class="ic-play"></span><span class="lbl">Pause</span></button>' +
    '<button type="button" class="demo-btn demo-restart" aria-label="Restart">Restart</button>' +
    '<label class="demo-slider"><span class="vis-hidden">Round</span><input type="range" min="0" max="' + ROUNDS + '" value="0" step="1"></label>' +
    '<div class="demo-speed seg" role="group" aria-label="Playback speed"><button type="button" data-speed="1" aria-pressed="true">1&times;</button><button type="button" data-speed="2" aria-pressed="false">2&times;</button></div>';
  var slider = ctl.querySelector('input[type=range]');
  var playBtn = ctl.querySelector('.demo-play'), playLbl = playBtn.querySelector('.lbl');
  var speed = 1, playing = false, timer = null;
  var qs = /[?&]speed=([\d.]+)/.exec(window.location.search); if (qs && root.hasAttribute('data-autoplay')) speed = +qs[1];
  var once = /[?&]once=1/.test(window.location.search) && root.hasAttribute('data-autoplay');  // recording mode: one pass, then hold
  var BASE = 330, HOLD = 950, END_HOLD = 2600;
  function dur(R) { return ((ORCH[R] ? BASE + HOLD : BASE) + (R === ROUNDS ? END_HOLD : 0)) / speed; }
  function tick() {
    if (!playing) return;
    var next = curR + 1;
    if (next > ROUNDS) { if (once) { pause(); return; } next = 0; }
    render(next);
    timer = setTimeout(tick, dur(next));
  }
  function play() { if (playing) return; playing = true; root.classList.add('playing'); playLbl.textContent = 'Pause'; timer = setTimeout(tick, dur(curR)); }
  function pause() { playing = false; root.classList.remove('playing'); playLbl.textContent = 'Play'; clearTimeout(timer); }
  playBtn.addEventListener('click', function () { playing ? pause() : play(); });
  ctl.querySelector('.demo-restart').addEventListener('click', function () { render(0); if (!playing) play(); });
  slider.addEventListener('input', function () { pause(); render(+slider.value); });
  ctl.querySelectorAll('[data-speed]').forEach(function (b) {
    b.addEventListener('click', function () {
      speed = +b.getAttribute('data-speed');
      ctl.querySelectorAll('[data-speed]').forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); });
    });
  });

  render(0);
  var auto = root.hasAttribute('data-autoplay');
  if (auto) { if (once) setTimeout(play, 800); else play(); }
  else if ('IntersectionObserver' in window && !reduced) {
    var io = new IntersectionObserver(function (es) { if (es[0].isIntersecting) { play(); io.disconnect(); } }, { threshold: .35 });
    io.observe(root);
  } else { render(ROUNDS); }
  window.MILO_DEMO = { seek: function (r) { pause(); render(r); }, play: play, pause: pause, setSpeed: function (s) { speed = s; } };
})();
