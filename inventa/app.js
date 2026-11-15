(function () {
  "use strict";
  var D = window.INVENTA_DATA;
  var NS = "http://www.w3.org/2000/svg";
  var C = { inv: "#c47612", milo: "#2f7bc4", coral: "#16a085", base: "#98a1ae", base2: "#b8bfca", ink: "#0f1a2a", soft: "#4b5565", faint: "#7b8494", grid: "#edf0f4", axis: "#c9cfd8" };
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function el(tag, attrs, parent) {
    var e = document.createElementNS(NS, tag);
    for (var k in attrs) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  }
  function txt(parent, x, y, s, attrs) {
    var t = el("text", Object.assign({ x: x, y: y }, attrs || {}), parent);
    t.textContent = s;
    return t;
  }
  function fmt(v, d) { return (d === undefined ? v.toFixed(1) : v.toFixed(d)); }

  /* ---------- nav ---------- */
  var nav = document.getElementById("nav");
  function onScroll() { nav.classList.toggle("show", window.scrollY > 420); }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();
  var secs = ["video", "overview", "method", "results", "discoveries", "bibtex"].map(function (id) { return document.getElementById(id); });
  var links = Array.prototype.slice.call(document.querySelectorAll(".nav .links a"));
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (e.isIntersecting) links.forEach(function (a) { a.classList.toggle("active", a.getAttribute("href") === "#" + e.target.id); });
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    secs.forEach(function (s) { if (s) io.observe(s); });
  }

  /* ---------- tooltip ---------- */
  var tip = document.getElementById("tip");
  function showTip(html, ev) {
    tip.innerHTML = html; tip.hidden = false;
    var x = ev.clientX + 14, y = ev.clientY + 14, w = tip.offsetWidth, h = tip.offsetHeight;
    if (x + w > window.innerWidth - 8) x = ev.clientX - w - 14;
    if (y + h > window.innerHeight - 8) y = ev.clientY - h - 14;
    tip.style.left = x + "px"; tip.style.top = y + "px";
  }
  function hideTip() { tip.hidden = true; }
  function sw(c) { return '<span class="sw" style="background:' + c + '"></span>'; }

  /* ---------- reveal on scroll ---------- */
  var revealers = [];
  function onReveal(node, fn) { revealers.push({ node: node, fn: fn, done: false }); }
  function checkReveal() {
    revealers.forEach(function (r) {
      if (r.done) return;
      var b = r.node.getBoundingClientRect();
      if (b.top < window.innerHeight * 0.88 && b.bottom > 0) { r.done = true; r.fn(); }
    });
  }
  window.addEventListener("scroll", checkReveal, { passive: true });
  window.addEventListener("resize", checkReveal);

  /* ---------- hero background: parallel idea trees ---------- */
  (function hero() {
    var cv = document.getElementById("heroBg");
    if (!cv) return;
    var ctx = cv.getContext("2d"), W, H, dpr = Math.min(window.devicePixelRatio || 1, 2), t0 = performance.now();
    var lanes = [];
    function rng(s) { return function () { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; }; }
    function build() {
      W = cv.clientWidth; H = cv.clientHeight; cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      lanes = [];
      var n = W > 900 ? 6 : 4, r = rng(7);
      for (var i = 0; i < n; i++) {
        var side = i < n / 2 ? 0 : 1, k = side ? i - n / 2 : i;
        var x0 = side ? W - 40 - k * 46 : 40 + k * 46;
        var nodes = [{ x: x0, y: H - 30, p: -1, ok: true, d: 0 }];
        for (var j = 1; j < 16; j++) {
          var par = Math.floor(r() * nodes.length * 0.6 + nodes.length * 0.4) % nodes.length;
          var P = nodes[par];
          var dir = side ? -1 : 1;
          nodes.push({ x: P.x + dir * (8 + r() * 26), y: P.y - 24 - r() * 22, p: par, ok: r() > 0.3, d: j });
        }
        lanes.push({ nodes: nodes, phase: r() * 4 });
      }
    }
    function draw(now) {
      var t = (now - t0) / 1000;
      ctx.clearRect(0, 0, W, H);
      lanes.forEach(function (L, li) {
        var grown = reduce ? 16 : Math.min(16, ((t * 1.1 + L.phase) % 22));
        L.nodes.forEach(function (nd, j) {
          if (j > grown || nd.p < 0) return;
          var P = L.nodes[nd.p];
          ctx.strokeStyle = "rgba(63,112,184,0.22)"; ctx.lineWidth = 1.2;
          ctx.beginPath(); ctx.moveTo(P.x, P.y); ctx.lineTo(nd.x, nd.y); ctx.stroke();
        });
        L.nodes.forEach(function (nd, j) {
          if (j > grown) return;
          var a = Math.min(1, grown - j + 0.2);
          ctx.globalAlpha = 0.65 * a;
          ctx.beginPath(); ctx.arc(nd.x, nd.y, nd.ok ? 3.4 : 2.8, 0, 6.283);
          if (nd.ok) { ctx.fillStyle = "#3f70b8"; ctx.fill(); }
          else { ctx.strokeStyle = "#9aa3b2"; ctx.lineWidth = 1.1; ctx.stroke(); }
          ctx.globalAlpha = 1;
        });
      });
      if (!reduce) requestAnimationFrame(draw);
    }
    build(); window.addEventListener("resize", build);
    requestAnimationFrame(draw);
  })();

  /* ---------- at a glance ---------- */
  (function glance() {
    var g = document.getElementById("glance");
    D.stage.forEach(function (s) {
      var max = s.bench === "IdeaBench" ? 30 : 100;
      var d = document.createElement("div"); d.className = "gc rv";
      d.innerHTML = '<p class="gs">' + s.stage + '</p><p class="gb">' + s.bench + '</p>' +
        '<div class="gv">' + fmt(s.inv) + (s.bench === "IdeaBench" ? '<small>ideas</small>' : '<small>%</small>') + '</div>' +
        '<p class="gm">' + s.metric + '</p>' +
        '<div class="gbar"><i class="b" data-w="' + (100 * s.b / max) + '"></i></div>' +
        '<div class="gbar"><i class="v" data-w="' + (100 * s.inv / max) + '"></i></div>' +
        '<div class="gl"><span>' + s.base + ' ' + fmt(s.b) + '</span></div>' +
        '<span class="gain">' + s.gain + '</span>';
      g.appendChild(d);
    });
    onReveal(g, function () {
      g.querySelectorAll(".gc").forEach(function (c, i) {
        setTimeout(function () { c.classList.add("in"); c.querySelectorAll(".gbar i").forEach(function (b) { b.style.width = b.getAttribute("data-w") + "%"; }); }, i * 90);
      });
    });
  })();

  /* ---------- interactive Figure 1 ---------- */
  (function figure() {
    var R = {
      task: [7, 21, 228, 347], best: [7, 377, 228, 192], units: [418, 5, 346, 40], unit: [287, 60, 405, 469],
      s0: [575, 97, 97, 26], kTop: [660, 49, 560, 12], s1: [308, 113, 177, 131], s2: [494, 96, 178, 148],
      s3a: [694, 128, 66, 100], ver: [759, 62, 272, 467], s3b: [694, 252, 66, 72], s3c: [1030, 240, 70, 62],
      know: [1099, 62, 253, 467], s4: [494, 254, 178, 131], s5: [308, 254, 177, 131], s6: [308, 395, 364, 115], xstar: [828, 534, 131, 28]
    };
    var S = [
      { b: "τ", c: "s", n: "Research task", r: ["task"], h: "A research task τ = ⟨q, W, C, V⟩", t: "A research question q, a workspace W of literature, tools and data, a set C of task-specific constraints, and verifiers V that run a full experiment on each candidate. Agents fit on the training split; only verifiers see validation data." },
      { b: "N", c: "u", n: "Units in parallel", r: ["units", "unit"], h: "N autonomous research units", t: "Decentralized units explore candidate ideas in parallel. Each keeps its own lineage memory and its own mutator, and advances at its own pace with a bounded lag." },
      { b: "0", c: "k", n: "Read the knowledge", r: ["s0", "kTop", "know"], h: "⓪ Read a snapshot of the shared knowledge", t: "At the start of each round the unit reads the shared knowledge K: verified bests, partial components and refuted constraint violations, written by verifiers." },
      { b: "1", c: "u", n: "Parent selection", r: ["s1"], h: "① Select a parent from the idea tree", t: "Thompson sampling treats accepted nodes as arms of a multi-armed bandit rewarded by fitness, exploiting promising lineages and exploring nodes with few children." },
      { b: "2", c: "u", n: "Idea mutation", r: ["s2"], h: "② The mutator agent writes a child", t: "A model run in a harness, the junior researcher, revises the parent into a child idea x using the parent's certificate, recent lineage nodes and the knowledge snapshot." },
      { b: "3a", c: "v", n: "Verify", r: ["s3a", "ver"], h: "③a Verifiers test the new idea", t: "Held-out scoring on D_val, constraint checking, out-of-distribution testing on D_ood, and component ablation: four checks, run on data the mutator never sees." },
      { b: "3b", c: "v", n: "Certificate", r: ["s3b"], h: "③b Return the certificate", t: "The verifiers return Cert(x), recording the outcome of every check and the evidence behind each failure, together with the fitness F(x)." },
      { b: "3c", c: "k", n: "Publish findings", r: ["s3c", "know"], h: "③c Publish qualifying findings", t: "Only verifiers write to the shared knowledge: a new verified best, a partial component worth reusing, or a refuted idea that violates a constraint, so that no unit builds on it again." },
      { b: "4", c: "u", n: "Child acceptance", r: ["s4"], h: "④ Accept or reject the child", t: "A child is accepted only if no accepted idea is at least as simple and nearly as fit. Extra complexity must buy fitness." },
      { b: "5", c: "u", n: "Memory update", r: ["s5"], h: "⑤ Record the child in the unit's memory", t: "The child joins the lineage as accepted or rejected; rejected children remain as negative evidence, and every scored child updates its parent's value." },
      { b: "6", c: "s", n: "Orchestration", r: ["s6"], h: "⑥ The orchestrator adapts the unit", t: "The principal investigator of the lab: Retool evolves the harness every P rounds via a twin trial, Redraw replaces the model on a stall, and Restart changes the research direction if the stall repeats." },
      { b: "x*", c: "k", n: "Best verified idea", r: ["xstar", "best"], h: "Output: the best verified idea, with its certificate", t: "Inventa returns x* = Best(K_ver), for example an improved flow law as code plus an explanation, along with the verifier certificate that supports it." }
    ];
    var list = document.getElementById("stepList"), ov = document.getElementById("figOv"), cap = document.getElementById("figCap");
    var prog = document.getElementById("figProg"), btn = document.getElementById("figPlay");
    var mask = el("mask", { id: "figMask" }, el("defs", {}, ov));
    el("rect", { x: 0, y: 0, width: 1374, height: 576, fill: "#fff" }, mask);
    var holes = el("g", {}, mask);
    el("rect", { class: "dim", x: 0, y: 0, width: 1374, height: 576, mask: "url(#figMask)" }, ov);
    var hlg = el("g", {}, ov);
    S.forEach(function (s, i) {
      var li = document.createElement("li");
      li.innerHTML = '<span class="sb ' + s.c + '">' + s.b + "</span>" + s.n;
      li.addEventListener("click", function () { go(i); stop(); });
      list.appendChild(li);
    });
    var cur = 0, playing = !reduce, timer = null, start = 0, DUR = 5200;
    function go(i) {
      cur = i;
      Array.prototype.forEach.call(list.children, function (li, k) { li.classList.toggle("on", k === i); });
      while (holes.firstChild) holes.removeChild(holes.firstChild);
      while (hlg.firstChild) hlg.removeChild(hlg.firstChild);
      S[i].r.forEach(function (k) {
        var q = R[k];
        el("rect", { x: q[0] - 3, y: q[1] - 3, width: q[2] + 6, height: q[3] + 6, rx: 10, fill: "#000" }, holes);
        el("rect", { class: "hl", x: q[0] - 3, y: q[1] - 3, width: q[2] + 6, height: q[3] + 6, rx: 10 }, hlg);
      });
      cap.innerHTML = '<span class="ct">' + S[i].h + "</span>" + S[i].t;
      start = performance.now();
    }
    function tick(now) {
      if (!playing) return;
      var f = (now - start) / DUR;
      prog.style.width = Math.min(100, ((cur + Math.min(1, f)) / S.length) * 100) + "%";
      if (f >= 1) go((cur + 1) % S.length);
      timer = requestAnimationFrame(tick);
    }
    function play() { playing = true; btn.textContent = "Pause"; start = performance.now(); timer = requestAnimationFrame(tick); }
    function stop() { playing = false; btn.textContent = "Play"; cancelAnimationFrame(timer); prog.style.width = ((cur + 1) / S.length) * 100 + "%"; }
    btn.addEventListener("click", function () { playing ? stop() : play(); });
    go(0);
    var fig = document.getElementById("figstep");
    var visible = false;
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (es) {
        es.forEach(function (e) {
          visible = e.isIntersecting;
          if (visible && playing) { start = performance.now() - 0; timer = requestAnimationFrame(tick); }
          else cancelAnimationFrame(timer);
        });
      }, { threshold: 0.3 }).observe(fig);
    }
    if (reduce) stop();
  })();

  /* ---------- chart helpers ---------- */
  function lin(d0, d1, r0, r1) { return function (v) { return r0 + (v - d0) * (r1 - r0) / (d1 - d0); }; }
  function axes(g, x, y, xt, yt, W, H, m, xl, yl, yfmt) {
    var gr = el("g", { class: "grid" }, g);
    yt.forEach(function (v) { el("line", { x1: m.l, x2: W - m.r, y1: y(v), y2: y(v) }, gr); });
    var ax = el("g", { class: "axis" }, g);
    el("line", { x1: m.l, x2: W - m.r, y1: H - m.b, y2: H - m.b }, ax);
    xt.forEach(function (v) { txt(ax, x(v), H - m.b + 17, String(v), { "text-anchor": "middle" }); });
    yt.forEach(function (v) { txt(ax, m.l - 8, y(v) + 4, yfmt ? yfmt(v) : String(v), { "text-anchor": "end" }); });
    if (xl) txt(ax, (m.l + W - m.r) / 2, H - 6, xl, { "text-anchor": "middle", style: "font-size:12px;fill:#4b5565" });
    if (yl) txt(ax, 14, (m.t + H - m.b) / 2, yl, { "text-anchor": "middle", transform: "rotate(-90 14 " + (m.t + H - m.b) / 2 + ")", style: "font-size:12px;fill:#4b5565" });
  }
  function path(pts, x, y) { return pts.map(function (p, i) { return (i ? "L" : "M") + x(p[0]).toFixed(1) + "," + y(p[1]).toFixed(1); }).join(""); }
  function drawIn(p, delay) {
    if (reduce) return;
    var L = p.getTotalLength(); p.style.strokeDasharray = L; p.style.strokeDashoffset = L;
    p.getBoundingClientRect();
    p.style.transition = "stroke-dashoffset 1.4s cubic-bezier(.3,.6,.2,1) " + (delay || 0) + "s";
    p.style.strokeDashoffset = 0;
  }

  /* ---------- A: stage gains ---------- */
  (function stage() {
    var host = document.getElementById("plotStage"), W = 1060, rowH = 56, m = { l: 400, r: 150, t: 14, b: 40 }, H = m.t + m.b + rowH * D.stage.length;
    var svg = el("svg", { viewBox: "0 0 " + W + " " + H, role: "img", "aria-label": "Relative gain of Inventa over the best baseline at each research stage" }, host);
    var x = lin(0, 45, m.l, W - m.r);
    var gr = el("g", { class: "grid" }, svg);
    [0, 10, 20, 30, 40].forEach(function (v) { el("line", { x1: x(v), x2: x(v), y1: m.t, y2: H - m.b }, gr); });
    var ax = el("g", { class: "axis" }, svg);
    [0, 10, 20, 30, 40].forEach(function (v) { txt(ax, x(v), H - m.b + 18, (v ? "+" : "") + v + "%", { "text-anchor": "middle" }); });
    txt(ax, (m.l + W - m.r) / 2, H - 4, "Relative gain of Inventa over the best baseline, on each benchmark's primary metric", { "text-anchor": "middle", style: "font-size:12px;fill:#4b5565" });
    var items = [];
    D.stage.forEach(function (s, i) {
      var yc = m.t + rowH * i + rowH / 2, g = parseFloat(s.gain);
      var row = el("g", {}, svg);
      if (i % 2 === 0) el("rect", { x: 0, y: yc - rowH / 2 + 3, width: W, height: rowH - 6, rx: 8, fill: "#f8f9fb" }, row);
      txt(row, 16, yc - 4, s.stage, { style: "font:700 10.5px 'JetBrains Mono',monospace;letter-spacing:.06em;fill:#3f70b8;text-transform:uppercase" });
      txt(row, 16, yc + 14, s.bench, { style: "font:600 15.5px 'Source Serif 4',Georgia,serif;fill:#0f1a2a" });
      txt(row, m.l - 16, yc - 2, s.base, { "text-anchor": "end", style: "font-size:12.5px;fill:#4b5565" });
      txt(row, m.l - 16, yc + 13, "best baseline · " + fmt(s.b), { "text-anchor": "end", style: "font-size:11.5px;fill:#7b8494" });
      var ln = el("line", { x1: x(0), x2: x(0), y1: yc, y2: yc, stroke: "#f0c88f", "stroke-width": 6, "stroke-linecap": "round" }, row);
      el("circle", { cx: x(0), cy: yc, r: 6, fill: C.base, stroke: "#fff", "stroke-width": 2 }, row);
      var ci = el("circle", { cx: x(0), cy: yc, r: 8, fill: C.inv, stroke: "#fff", "stroke-width": 2 }, row);
      var lb = txt(row, x(g) + 16, yc - 1, s.gain, { style: "font:700 15px Inter,sans-serif;fill:#0f1a2a", opacity: 0 });
      var lb2 = txt(row, x(g) + 16, yc + 15, fmt(s.b) + " → " + fmt(s.inv) + (s.bench === "IdeaBench" ? " ideas" : "%"), { style: "font-size:12px;fill:#4b5565", opacity: 0 });
      var hit = el("rect", { x: 0, y: yc - rowH / 2, width: W, height: rowH, fill: "transparent" }, row);
      hit.addEventListener("mousemove", function (ev) { showTip("<b>" + s.bench + "</b> · " + s.metric + "<br>" + sw(C.base) + s.base + ": <b>" + fmt(s.b) + "</b><br>" + sw(C.inv) + "Inventa: <b>" + fmt(s.inv) + "</b> (" + s.gain + ")", ev); });
      hit.addEventListener("mouseleave", hideTip);
      items.push(function () {
        var dur = reduce ? "0s" : "1.1s";
        [ln, ci].forEach(function (e) { e.style.transition = "all " + dur + " cubic-bezier(.2,.7,.2,1) " + (i * 0.12) + "s"; });
        ln.setAttribute("x2", x(g)); ci.setAttribute("cx", x(g));
        [lb, lb2].forEach(function (e) { e.style.transition = "opacity .6s " + (0.8 + i * 0.12) + "s"; e.setAttribute("opacity", 1); });
      });
    });
    onReveal(host, function () { items.forEach(function (f) { f(); }); });
  })();

  /* ---------- B: EurekaBench cost curves ---------- */
  (function cost() {
    var host = document.getElementById("plotCost"), W = 540, H = 360, m = { l: 52, r: 18, t: 16, b: 46 };
    var svg = el("svg", { viewBox: "0 0 " + W + " " + H, role: "img", "aria-label": "EurekaBench validation conditioned score versus cost" }, host);
    var x = lin(0, 840, m.l, W - m.r), y = lin(20, 80, H - m.b, m.t);
    axes(svg, x, y, [0, 200, 400, 600, 800], [20, 30, 40, 50, 60, 70, 80], W, H, m, "Cost per task (units)", "Conditioned score on D_val (%)");
    var styleOf = { "CORAL": { c: C.coral, w: 2.2 }, "MILO": { c: C.milo, w: 2 }, "Agentic Scientist": { c: C.base, w: 1.6, dash: "5 3" }, "OpenEvolve": { c: C.base, w: 1.6, dash: "1.5 3" }, "Best of agents ①–⑭": { c: C.base2, w: 1.6 } };
    var paths = [];
    D.cost.baselines.forEach(function (s) {
      var st = styleOf[s.name] || { c: C.base, w: 1.5 };
      var p = el("path", { d: path(s.pts, x, y), fill: "none", stroke: st.c, "stroke-width": st.w, "stroke-linejoin": "round", "stroke-linecap": "round" }, svg);
      if (st.dash) p.setAttribute("stroke-dasharray", st.dash);
      paths.push({ p: p, dash: st.dash });
    });
    var last = D.cost.baselines.filter(function (s) { return s.name === "CORAL"; })[0];
    var inv = D.cost.inventa;
    var ip = el("path", { d: path(inv, x, y), fill: "none", stroke: C.inv, "stroke-width": 2.6, "stroke-linecap": "round" }, svg);
    var marks = el("g", {}, svg);
    inv.forEach(function (p, i) {
      var ref = i ? 55.5 : 52.8;
      el("line", { x1: x(p[0]), x2: x(p[0]), y1: y(ref), y2: y(p[1]) + 8, stroke: C.inv, "stroke-width": 1.4, "stroke-dasharray": "2 2" }, marks);
      el("circle", { cx: x(p[0]), cy: y(p[1]), r: 6, fill: C.inv, stroke: "#fff", "stroke-width": 2 }, marks);
      txt(marks, x(p[0]) + (i ? -10 : 10), y((p[1] + ref) / 2) + 4, (i ? "+17.0" : "+11.9"), { "text-anchor": i ? "end" : "start", style: "font-size:12.5px;font-weight:700;fill:#9c5a07" });
      txt(marks, x(p[0]) + (i ? -6 : 0), y(p[1]) - 12, fmt(p[1]) + "%", { "text-anchor": i ? "end" : "middle", style: "font-size:12.5px;font-weight:700;fill:#0f1a2a" });
    });
    txt(marks, x(inv[0][0]) - 14, y(inv[0][1]) + 4, "Inventa", { "text-anchor": "end", style: "font-size:12.5px;font-weight:700;fill:#9c5a07" });
    marks.style.opacity = 0; marks.style.transition = "opacity .6s 1.2s";
    // hover crosshair
    var cross = el("line", { y1: m.t, y2: H - m.b, stroke: "#c9cfd8", "stroke-width": 1, opacity: 0 }, svg);
    var hit = el("rect", { x: m.l, y: m.t, width: W - m.l - m.r, height: H - m.t - m.b, fill: "transparent" }, svg);
    hit.addEventListener("mousemove", function (ev) {
      var b = svg.getBoundingClientRect(), px = (ev.clientX - b.left) * W / b.width;
      var c = Math.max(40, Math.min(800, Math.round((px - m.l) / (W - m.l - m.r) * 840 / 40) * 40));
      cross.setAttribute("x1", x(c)); cross.setAttribute("x2", x(c)); cross.setAttribute("opacity", 1);
      var rows = D.cost.baselines.map(function (s) { var q = s.pts.filter(function (p) { return p[0] === c; })[0]; return [s.name, q ? q[1] : null, (styleOf[s.name] || {}).c || C.base]; })
        .sort(function (a, b) { return b[1] - a[1]; });
      var h = "<b>Cost " + c + " units</b>";
      if (Math.abs(c - 393) <= 20) h += "<br>" + sw(C.inv) + "Inventa (10 rounds): <b>64.7%</b>";
      if (Math.abs(c - 786) <= 20) h += "<br>" + sw(C.inv) + "Inventa (20 rounds): <b>72.5%</b>";
      rows.forEach(function (r) { h += "<br>" + sw(r[2]) + r[0] + ": <b>" + fmt(r[1]) + "%</b>"; });
      showTip(h, ev);
    });
    hit.addEventListener("mouseleave", function () { hideTip(); cross.setAttribute("opacity", 0); });
    document.getElementById("legCost").innerHTML =
      '<span><i style="border-color:' + C.inv + ';border-top-width:3px"></i>Inventa</span>' +
      '<span><i style="border-color:' + C.coral + '"></i>CORAL</span>' +
      '<span><i style="border-color:' + C.milo + '"></i>MILO</span>' +
      '<span><i class="dash" style="border-color:' + C.base + '"></i>Agentic Scientist</span>' +
      '<span><i style="border-color:' + C.base + ';border-top-style:dotted"></i>OpenEvolve</span>' +
      '<span><i style="border-color:' + C.base2 + '"></i>Best of 14 frontier agents</span>';
    onReveal(host, function () {
      paths.forEach(function (q, i) { if (!q.dash) drawIn(q.p, i * 0.08); });
      drawIn(ip, 0.5); marks.style.opacity = 1;
    });
  })();

  /* ---------- C: IdeaBench ideas vs calls ---------- */
  (function ideas() {
    var host = document.getElementById("plotIdeas"), W = 540, H = 360, m = { l: 52, r: 18, t: 16, b: 46 };
    var svg = el("svg", { viewBox: "0 0 " + W + " " + H, role: "img", "aria-label": "IdeaBench distinct novel ideas versus model calls" }, host);
    var x = lin(0, 520, m.l, W - m.r), y = lin(0, 140, H - m.b, m.t);
    axes(svg, x, y, [0, 100, 200, 300, 400, 500], [0, 20, 40, 60, 80, 100, 120, 140], W, H, m, "Model calls per paper", "Distinct novel ideas per paper");
    var settings = ["27 ideas", "122 ideas", "241 ideas"];
    var ser = [["Best-of-N", C.base, "1.5 3"], ["MILO", C.milo, "6 3"], ["Inventa", C.inv, null]];
    var drawn = [];
    ser.forEach(function (s) {
      var pts = D.ideas[s[0]];
      var p = el("path", { d: path(pts, x, y), fill: "none", stroke: s[1], "stroke-width": s[0] === "Inventa" ? 2.6 : 2, "stroke-linecap": "round" }, svg);
      if (s[2]) p.setAttribute("stroke-dasharray", s[2]);
      var g = el("g", {}, svg);
      pts.forEach(function (q, i) {
        var mk = s[0] === "MILO" ? el("rect", { x: x(q[0]) - 5, y: y(q[1]) - 5, width: 10, height: 10, rx: 2, fill: s[1], stroke: "#fff", "stroke-width": 1.6 }, g)
          : el("circle", { cx: x(q[0]), cy: y(q[1]), r: s[0] === "Inventa" ? 6.5 : 5, fill: s[1], stroke: "#fff", "stroke-width": 1.8 }, g);
        var hit = el("circle", { cx: x(q[0]), cy: y(q[1]), r: 14, fill: "transparent" }, g);
        hit.addEventListener("mousemove", function (ev) { showTip(sw(s[1]) + "<b>" + s[0] + "</b> · " + settings[i] + "<br>" + fmt(q[1]) + " novel ideas / paper<br>" + q[0] + " calls / paper", ev); });
        hit.addEventListener("mouseleave", hideTip);
      });
      drawn.push({ p: p, g: g, dash: !!s[2] });
    });
    var inv = D.ideas.Inventa, mi = D.ideas.MILO;
    txt(svg, x(inv[2][0]) + 10, y(inv[2][1]) + 4, "Inventa 130.2", { style: "font-size:12.5px;font-weight:700;fill:#9c5a07" });
    txt(svg, x(inv[1][0]) + 10, y(inv[1][1]) + 14, "61.6 with 95 calls", { style: "font-size:11.5px;fill:#4b5565" });
    txt(svg, x(mi[1][0]) + 10, y(mi[1][1]) + 16, "MILO 48.2 with 250", { style: "font-size:11.5px;fill:#4b5565" });
    txt(svg, x(inv[0][0]) + 12, y(inv[0][1]) + 4, "26.0", { style: "font-size:11.5px;font-weight:700;fill:#9c5a07" });
    txt(svg, x(242) + 8, y(8.8) - 8, "Best-of-N 8.8", { style: "font-size:11.5px;fill:#4b5565" });
    document.getElementById("legIdeas").innerHTML =
      '<span><i class="dot" style="background:' + C.inv + '"></i>Inventa</span>' +
      '<span><i style="border-color:' + C.milo + ';border-top-style:dashed"></i>MILO (3, 15, 30 islands)</span>' +
      '<span><i style="border-color:' + C.base + ';border-top-style:dotted"></i>Best-of-N</span>';
    onReveal(host, function () { drawn.forEach(function (d, i) { if (!d.dash) drawIn(d.p, 0.2 + i * 0.2); }); });
  })();

  /* ---------- benchmark explorer ---------- */
  (function explorer() {
    var tabs = [
      { k: "eureka", n: "EurekaBench", unit: "%", note: "Conditioned score (CS, %) on the test split of 16 tasks: predictive accuracy and scientific insight, zero unless the law passes all constraint tests. Frontier agents use Best-of-20.", rows: D.eureka.map(function (r) { return [r[0], r[1]]; }), max: 80 },
      { k: "scilaws", n: "SciLaws-Bench", unit: "%", note: "Held-out predictive fit S_N (%) over 38 tasks; in brackets, tasks where the law beats the published law.", rows: D.scilaws.map(function (r) { return [r[0] + "  (" + r[2] + "/38)", r[1]]; }), max: 70, min: 40 },
      { k: "ideabench", n: "IdeaBench", unit: "", note: "Distinct novel ideas per paper rated ≥7 by the calibrated novelty judge, 27-idea setting, 736 test papers. In brackets, model calls per paper.", rows: D.ideabench27.map(function (r) { return [r[0] + "  (" + r[1] + " calls)", r[2]]; }), max: 28 },
      { k: "ideascientist", n: "IdeaScientist", unit: "%", note: "Combined novelty and quality score (%) over 277 problems; IdeaScientist rows are from Liu et al. (2026a).", rows: D.ideascientist, max: 90, min: 60 },
      { k: "scholar", n: "ScholarCatalyst", unit: "%", note: "Mean of the eight retrieval metrics (nDCG@20, Recall@5/20/100 over core and subfield queries), 894 queries.", rows: D.scholar, max: 50 }
    ];
    var tabHost = document.getElementById("exTabs"), plot = document.getElementById("plotEx"), note = document.getElementById("exNote"), tbl = document.getElementById("exTable");
    tabs.forEach(function (t, i) {
      var b = document.createElement("button"); b.type = "button"; b.setAttribute("role", "tab"); b.textContent = t.n;
      b.addEventListener("click", function () { show(i); });
      tabHost.appendChild(b);
    });
    function show(i) {
      var t = tabs[i];
      Array.prototype.forEach.call(tabHost.children, function (b, k) { b.setAttribute("aria-selected", k === i ? "true" : "false"); });
      note.textContent = t.note;
      var rows = t.rows.slice().sort(function (a, b) { return a[1] - b[1]; });
      var W = 1060, rh = 26, m = { l: 300, r: 70, t: 6, b: 28 }, H = m.t + m.b + rh * rows.length;
      plot.innerHTML = "";
      var svg = el("svg", { viewBox: "0 0 " + W + " " + H, role: "img", "aria-label": t.n + " results" }, plot);
      var lo = t.min || 0, x = lin(lo, t.max, m.l, W - m.r);
      var ticks = []; var step = (t.max - lo) > 40 ? 10 : 5; for (var v = lo; v <= t.max + 1e-9; v += step) ticks.push(v);
      var gr = el("g", { class: "grid" }, svg);
      ticks.forEach(function (v) { el("line", { x1: x(v), x2: x(v), y1: m.t, y2: H - m.b }, gr); });
      var ax = el("g", { class: "axis" }, svg);
      ticks.forEach(function (v) { txt(ax, x(v), H - m.b + 17, String(v), { "text-anchor": "middle" }); });
      rows.forEach(function (r, j) {
        var ours = r[0].indexOf("Inventa") === 0, yc = m.t + j * rh + rh / 2;
        txt(svg, m.l - 10, yc + 4, r[0], { "text-anchor": "end", style: "font-size:13px;" + (ours ? "font-weight:700;fill:#9c5a07" : "fill:#344054") });
        var bar = el("rect", { x: m.l, y: yc - 8, width: 0, height: 16, rx: 4, fill: ours ? C.inv : "#c3cad5" }, svg);
        var val = txt(svg, m.l + 6, yc + 4.5, fmt(r[1]) + t.unit, { style: "font-size:12.5px;font-variant-numeric:tabular-nums;" + (ours ? "font-weight:700;fill:#0f1a2a" : "fill:#4b5565"), opacity: 0 });
        var hit = el("rect", { x: 0, y: yc - rh / 2, width: W, height: rh, fill: "transparent" }, svg);
        hit.addEventListener("mousemove", function (ev) { showTip("<b>" + r[0] + "</b><br>" + fmt(r[1]) + t.unit, ev); });
        hit.addEventListener("mouseleave", hideTip);
        requestAnimationFrame(function () {
          bar.style.transition = reduce ? "none" : "width .8s cubic-bezier(.2,.7,.2,1) " + (j * 0.03) + "s";
          var w = Math.max(2, x(r[1]) - m.l); bar.setAttribute("width", w);
          val.setAttribute("x", m.l + w + 6); val.style.transition = "opacity .4s " + (0.4 + j * 0.03) + "s"; val.setAttribute("opacity", 1);
        });
      });
      var h = "<table><thead><tr><th>Method</th><th>" + t.n + "</th></tr></thead><tbody>";
      t.rows.forEach(function (r) { h += "<tr" + (r[0].indexOf("Inventa") === 0 ? ' class="ours"' : "") + "><td>" + r[0] + '</td><td class="n">' + fmt(r[1]) + t.unit + "</td></tr>"; });
      tbl.innerHTML = h + "</tbody></table>";
    }
    var ex = document.getElementById("explorer"); var shown = false;
    onReveal(ex, function () { if (!shown) { shown = true; show(0); } });
  })();

  /* ---------- judges mini ---------- */
  (function judges() {
    var host = document.getElementById("plotJudges"), W = 320, rh = 15, gH = 3 * rh + 14, H = gH * 3 + 4;
    var svg = el("svg", { viewBox: "0 0 " + W + " " + H, role: "img", "aria-label": "Distinct novel ideas per paper under three judges" }, host);
    var x = lin(0, 28, 104, W - 34);
    D.judges.forEach(function (j, gi) {
      var y0 = gi * gH;
      txt(svg, 0, y0 + 11, j[0], { style: "font:700 10px JetBrains Mono,monospace;letter-spacing:.05em;fill:#7b8494;text-transform:uppercase" });
      j[1].forEach(function (r, k) {
        var yc = y0 + 16 + k * rh + rh / 2, ours = r[0] === "Inventa";
        txt(svg, 98, yc + 3.5, r[0], { "text-anchor": "end", style: "font-size:11px;" + (ours ? "font-weight:700;fill:#9c5a07" : "fill:#4b5565") });
        el("rect", { x: 104, y: yc - 5, width: x(r[1]) - 104, height: 10, rx: 3, fill: ours ? C.inv : "#c3cad5" }, svg);
        txt(svg, x(r[1]) + 4, yc + 3.5, fmt(r[1]), { style: "font-size:11px;font-variant-numeric:tabular-nums;" + (ours ? "font-weight:700;fill:#0f1a2a" : "fill:#4b5565") });
      });
    });
  })();

  /* ---------- discoveries (filled by discoveries.js if present) ---------- */
  if (window.renderDiscoveries) window.renderDiscoveries(document.getElementById("discoveryBody"), { el: el, txt: txt, lin: lin, showTip: showTip, hideTip: hideTip, onReveal: onReveal, C: C, reduce: reduce });

  /* ---------- figure lightbox ---------- */
  (function () {
    var lbx = document.getElementById("lightbox"), close = document.getElementById("lbClose"), img = document.getElementById("lbImg"), cap = document.getElementById("lbCap"), last = null;
    var F = { fig1: ["static/fig1-pipeline.svg", "Figure 1 of the paper: overview of Inventa.", "Figure 1 of the paper"],
              fig2: ["static/fig2-search.svg", "Figure 2 of the paper: comparison of search mechanisms.", "Figure 2 of the paper"] };
    function show(key, ev) {
      if (ev) ev.preventDefault();
      var f = F[key] || F.fig1, t = document.getElementById("cap-" + key);
      img.src = f[0]; img.alt = f[1]; lbx.setAttribute("aria-label", f[2]); cap.innerHTML = t ? t.innerHTML : "";
      last = document.activeElement; lbx.hidden = false; document.body.classList.add("lb-on");
      requestAnimationFrame(function () { lbx.classList.add("open"); }); close.focus();
    }
    function hide() { lbx.classList.remove("open"); document.body.classList.remove("lb-on"); setTimeout(function () { lbx.hidden = true; }, 180); if (last) last.focus(); }
    document.querySelectorAll("[data-lb]").forEach(function (n) { n.addEventListener("click", function (e) { show(n.getAttribute("data-lb"), e); }); });
    document.getElementById("figImg").addEventListener("click", function (e) { show("fig1", e); });
    close.addEventListener("click", hide);
    lbx.addEventListener("click", function (e) { if (e.target === lbx) hide(); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape" && !lbx.hidden) hide(); });
  })();

  /* ---------- bibtex copy ---------- */
  var cb = document.getElementById("copyBib");
  cb.addEventListener("click", function () {
    var s = document.getElementById("bibText").textContent;
    (navigator.clipboard ? navigator.clipboard.writeText(s) : Promise.reject()).then(function () { cb.textContent = "Copied"; setTimeout(function () { cb.textContent = "Copy"; }, 1600); }, function () {});
  });

  document.querySelectorAll(".tldr, .ch, .relfig, .comp, .st, .act, .chart, .explorer, .rqc").forEach(function (n) { n.classList.add("rv"); onReveal(n, function () { n.classList.add("in"); }); });
  checkReveal();
})();
