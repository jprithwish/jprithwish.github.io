window.renderDiscoveries = function (host, U) {
  "use strict";
  var el = U.el, txt = U.txt, lin = U.lin;
  function bars(rows, note) {
    var h = '<div class="sbars"><p class="sbk">Conditioned score on this task (test)</p>';
    rows.forEach(function (r) {
      h += '<div class="sbr' + (r[3] ? ' ours' : '') + '"><span class="sbn">' + r[0] + '</span><span class="sbt"><i style="width:' + r[1] + '%;background:' + r[2] + '"></i></span><span class="sbv">' + r[1].toFixed(1) + '</span></div>';
    });
    return h + '<p class="sbnote">' + note + '</p></div>';
  }
  host.innerHTML =
    '<p class="lede-s">Two laws Inventa discovered on EurekaBench tasks, one in astrophysics and one in plasma physics, each compared with the law the task starts from and with the best competing method. Both pass every scientific-constraint test of their task.</p>' +
    '<article class="disc">' +
      '<div class="disc-text">' +
        '<p class="dk">Astrophysics &middot; DREAMS simulations of Milky-Way-mass halos</p>' +
        '<h3>Baryons pull dark matter inward, but only about halfway</h3>' +
        '<p><b>The question.</b> When a galaxy forms, its stars and gas sink to the centre of its dark-matter halo and drag the dark matter inward. How much denser does the dark matter become than in a gravity-only twin of the same halo, and what sets the response?</p>' +
        '<p><b>The textbook law.</b> Adiabatic contraction (Blumenthal et al., 1986) assumes the dark matter responds fully: it moves inward by the whole displacement the baryons imply.</p>' +
        '<p><b>What Inventa found.</b> Dark matter follows only a fraction &nu; of that displacement, about 0.45 on average, and &nu; is set by the galaxy (its star formation, stellar concentration and stellar-to-halo mass), not by the halo&rsquo;s mass:</p>' +
        '<div class="law" id="lawMW"></div>' +
        '<div class="cmp3"><p class="ck">At the centre of the halo</p>' +
          '<div><span class="cl r">Textbook law</span><b>+0.30 dex</b><em>off by 0.08</em></div>' +
          '<div><span class="cl">Simulation</span><b>+0.22 dex</b><em>&nbsp;</em></div>' +
          '<div><span class="cl o">Inventa&rsquo;s law</span><b>+0.19 dex</b><em>off by 0.03, about 3&times; closer</em></div></div>' +
        bars([["Inventa", 75.8, "#c47612", 1], ["Best baseline: Goose + Grok 4.7", 52.4, "#98a1ae"], ["CORAL (fails a constraint)", 31.8, "#c9cfd8"]],
          "Inventa&rsquo;s best graded checkpoint; all 7 of its graded checkpoints beat the best baseline. Other methods&rsquo; laws are not recorded, only their scores.") +
      '</div>' +
      '<div class="disc-vis">' +
        '<div class="halo-wrap"><svg id="haloSvg" viewBox="0 0 420 300" role="img" aria-label="Schematic of dark-matter shells contracting around a stellar disk"></svg>' +
          '<div class="seg" role="tablist" id="haloSeg"><button type="button" data-k="0">Gravity-only twin</button><button type="button" data-k="1">Textbook law</button><button type="button" data-k="2" aria-selected="true">Inventa&rsquo;s law</button></div>' +
          '<p class="vnote">Dark-matter shells at five radii (log scale). Each starts where it sits in the gravity-only twin and moves inward as each law predicts.</p></div>' +
        '<div class="plot" id="plotMW"></div>' +
        '<p class="vnote">How much denser the dark matter is than in the gravity-only twin, from the centre outwards. Circles: the simulations. Line: Inventa&rsquo;s law. Cross: the textbook law at the centre.</p>' +
      '</div>' +
    '</article>' +
    '<article class="disc disc-2">' +
      '<div class="disc-text">' +
        '<p class="dk">Plasma physics &middot; TORAX tokamak simulations</p>' +
        '<h3>Why a reversed-D plasma never forms an edge barrier</h3>' +
        '<p><b>The question.</b> Tokamaks usually run with a D-shaped plasma, whose edge forms a transport barrier (H-mode) once it is heated past a threshold. Flip the D (negative triangularity) and the barrier never forms, however hard the plasma is heated. Why does the shape matter, and what does it cost?</p>' +
        '<p><b>The textbook law.</b> The L&ndash;H power threshold (Martin et al., 2008): a barrier forms once the exhaust power exceeds P<sub>LH</sub>, which depends on density, magnetic field and plasma surface, never on the sign of the triangularity. For the reversed shape P<sub>LH</sub> = 1.64&nbsp;MW, so it predicts a barrier at any higher power.</p>' +
        '<p><b>What Inventa found.</b> A barrier needs power past the threshold <i>and</i> a magnetic well at the plasma edge, where the field strength grows outward. The well lets the edge carry the self-reinforcing current a barrier feeds on. Flipping the D turns the well into a hill, so that current flows only in a narrow window and no amount of heating opens a barrier. The same chain sets the edge gradient, the heat-flux width and the heat load on the wall:</p>' +
        '<div class="law" id="lawNT"></div>' +
        '<div class="cmp3"><p class="ck">Reversed D heated to 18 MW, 11&times; the textbook threshold</p>' +
          '<div><span class="cl r">Textbook law</span><b>barrier</b><em>wrong</em></div>' +
          '<div><span class="cl">Simulation</span><b>no barrier</b><em>&nbsp;</em></div>' +
          '<div><span class="cl o">Inventa&rsquo;s law</span><b>no barrier</b><em>correct</em></div>' +
          '<p class="ck ck2">Heat-flux width across the 110 training settings</p>' +
          '<div><span class="cl r">Textbook law</span><b>R&sup2; 0.02</b><em>Eich et al. (2013) width alone</em></div>' +
          '<div><span class="cl o">Inventa&rsquo;s law</span><b>R&sup2; 0.90</b><em>Eich width plus turbulent broadening</em></div></div>' +
        bars([["Inventa", 77.7, "#c47612", 1], ["Best baseline: Agentic Scientist", 53.5, "#98a1ae"], ["CORAL (fails a constraint)", 36.8, "#c9cfd8"]],
          "Test score of the law shown, graded at two checkpoints (75.3 and 77.7) and passing every constraint both times. Other methods&rsquo; laws are not recorded, only their scores.") +
      '</div>' +
      '<div class="disc-vis">' +
        '<div class="halo-wrap"><svg id="ntSvg" viewBox="0 0 420 300" role="img" aria-label="Cross-section of a tokamak plasma morphing between a D shape and a reversed D shape"></svg>' +
          '<div class="seg" role="tablist" id="ntSeg"><button type="button" data-k="0">D shape, &delta; = +0.5</button><button type="button" data-k="1" aria-selected="true">Reversed D, &delta; = &minus;0.5</button></div></div>' +
        '<table class="ptab" id="ntTab"><thead><tr><th>Simulated at 6 MW</th><th>D shape</th><th>Reversed D</th></tr></thead><tbody>' +
          '<tr><td>Edge transport barrier</td><td>yes</td><td>no</td></tr>' +
          '<tr><td>Edge pressure gradient &alpha;</td><td>4.35</td><td>1.09</td></tr>' +
          '<tr><td>Heat-flux width</td><td>2.51 mm</td><td>6.06 mm</td></tr>' +
          '<tr><td>Peak heat flux on the divertor</td><td>45.0 MW/m&sup2;</td><td>2.94 MW/m&sup2;</td></tr>' +
          '<tr><td>Confinement, H98</td><td>1.30</td><td>0.70</td></tr></tbody></table>' +
        '<div class="plot" id="plotNT"></div>' +
        '<p class="vnote">Edge pressure gradient against heating power, from simulations Inventa ran during its search. Shaded: where the textbook threshold predicts a barrier. The D-shaped edge forms one and stays flat with power; the reversed edge climbs toward the ceiling its magnetic surfaces allow (&Sigma;) but never forms a barrier, even at 18 MW.</p>' +
      '</div>' +
    '</article>';

  function renderLaw() {
    var tex = "\\frac{u_f}{u_i} = X^{\\nu},\\qquad X = \\frac{M_{n}(\\bar r_i) + M_{\\mathrm{ref}}(\\bar r_i)}{M_{n}(\\bar r_i) + M_{b}(\\bar r_f)},\\qquad \\bar r = A\\,u_0\\Big(\\frac{u}{u_0}\\Big)^{w}";
    var tex2 = "\\nu = \\Big[1 + \\big(\\nu_0^{-1} - 1\\big)\\,10^{-(a_s s_\\perp + a_b \\lambda_b + a_q \\lambda_q)}\\Big]^{-1}";
    var n = document.getElementById("lawMW");
    if (window.katex) {
      n.innerHTML = '<div class="eq"></div><div class="eq"></div>';
      window.katex.render(tex, n.children[0], { displayMode: true, throwOnError: false });
      window.katex.render(tex2, n.children[1], { displayMode: true, throwOnError: false });
    } else {
      n.innerHTML = '<code>u_f/u_i = X^ν,  ν = 1 / [1 + (1/ν0 − 1)·10^−(a_s s⊥ + a_b λ_b + a_q λ_q)]</code>';
    }
  }
  function renderLawNT() {
    var t1 = "\\theta=\\underbrace{\\sigma\\!\\Big(\\frac{X/c_{\\mathrm{LH}}-1}{W_P}\\Big)}_{\\text{power past threshold}}\\;\\underbrace{\\big[a_w+(1-a_w)\\,a_{\\mathrm{win}}\\big]}_{\\text{edge can carry the current}}";
    var t2 = "a_w=\\sigma\\!\\Big(\\frac{W_{\\mathrm{fsa}}}{W_W}\\Big),\\qquad W_{\\mathrm{fsa}}=\\frac{d\\ln\\langle B^2\\rangle}{d\\rho}\\Big|_{\\rho\\,=\\,0.94\\,\\text{to}\\,0.98}";
    var t3 = "X=\\frac{P_{\\mathrm{net}}}{P_{\\mathrm{LH}}},\\qquad \\text{barrier}\\iff\\theta>\\tfrac12";
    var n = document.getElementById("lawNT");
    if (window.katex) {
      n.innerHTML = '<div class="eq"></div><div class="eq"></div><div class="eq"></div>';
      window.katex.render(t1, n.children[0], { displayMode: true, throwOnError: false });
      window.katex.render(t2, n.children[1], { displayMode: true, throwOnError: false });
      window.katex.render(t3, n.children[2], { displayMode: true, throwOnError: false });
    } else {
      n.innerHTML = '<code>θ = σ((X/c_LH − 1)/W_P) · [a_w + (1 − a_w)·a_win],  a_w = σ(W_fsa/W_W),  barrier if θ > 1/2</code>';
    }
  }
  if (window.katex) { renderLaw(); renderLawNT(); } else window.addEventListener("load", function () { renderLaw(); renderLawNT(); });

  /* halo schematic */
  var rows = [[0.0108, 0.434, 0.696], [0.0233, 0.515, 0.754], [0.050, 0.641, 0.828], [0.108, 0.754, 0.893], [0.200, 0.854, 0.937]];
  var svg = document.getElementById("haloSvg");
  var defs = el("defs", {}, svg);
  var rg = el("radialGradient", { id: "dmGlow", cx: "50%", cy: "50%", r: "50%" }, defs);
  el("stop", { offset: "0%", "stop-color": "#5b4aa8", "stop-opacity": ".34" }, rg);
  el("stop", { offset: "60%", "stop-color": "#5b4aa8", "stop-opacity": ".10" }, rg);
  el("stop", { offset: "100%", "stop-color": "#5b4aa8", "stop-opacity": "0" }, rg);
  var sg = el("radialGradient", { id: "starGlow", cx: "50%", cy: "50%", r: "50%" }, defs);
  el("stop", { offset: "0%", "stop-color": "#fff6dc", "stop-opacity": "1" }, sg);
  el("stop", { offset: "35%", "stop-color": "#f3c66b", "stop-opacity": ".85" }, sg);
  el("stop", { offset: "100%", "stop-color": "#d28418", "stop-opacity": "0" }, sg);
  el("rect", { x: 0, y: 0, width: 420, height: 300, rx: 14, fill: "#0f1626" }, svg);
  for (var i = 0; i < 70; i++) {
    var sx = (i * 97.13) % 420, sy = (i * 53.71 + 17) % 300;
    el("circle", { cx: sx, cy: sy, r: (i % 5 === 0) ? 1.1 : 0.6, fill: "#c9d6f0", opacity: (i % 3 === 0) ? 0.5 : 0.25 }, svg);
  }
  var cx = 210, cy = 150;
  var rad = lin(Math.log10(0.0055), Math.log10(0.26), 14, 138);
  el("circle", { cx: cx, cy: cy, r: 140, fill: "url(#dmGlow)" }, svg);
  var shells = rows.map(function (r, k) {
    var ui = r[0] / r[2];
    var c = el("circle", { cx: cx, cy: cy, r: rad(Math.log10(ui)), fill: "none", stroke: "#a99cf0", "stroke-width": 1.4, "stroke-dasharray": "3 4", opacity: 0.9 }, svg);
    var ghost = el("circle", { cx: cx, cy: cy, r: rad(Math.log10(ui)), fill: "none", stroke: "#a99cf0", "stroke-width": 0.8, opacity: 0.22 }, svg);
    return { c: c, g: ghost, ui: ui, cl: ui * r[1], inv: r[0] };
  });
  el("ellipse", { cx: cx, cy: cy, rx: 44, ry: 12, fill: "url(#starGlow)", transform: "rotate(-18 " + cx + " " + cy + ")" }, svg);
  el("circle", { cx: cx, cy: cy, r: 5, fill: "#fff3d0" }, svg);
  var lab = txt(svg, 16, 26, "", { style: "font:600 12.5px Inter,sans-serif;fill:#e7ecf6" });
  var lab2 = txt(svg, 16, 44, "", { style: "font:500 11.5px Inter,sans-serif;fill:#9fb0cc" });
  txt(svg, 404, 290, "dark matter", { "text-anchor": "end", style: "font:500 10.5px Inter,sans-serif;fill:#a99cf0" });
  txt(svg, cx + 52, cy + 30, "stars and gas", { style: "font:500 10.5px Inter,sans-serif;fill:#f3c66b" });
  var states = [
    ["Gravity-only twin", "Shells where the dark matter sits without baryons"],
    ["Textbook law, full response", "Full adiabatic displacement: the centre overshoots"],
    ["Inventa’s law, ν ≈ 0.45", "Partial response: matches the simulated profile"]
  ];
  var seg = document.getElementById("haloSeg");
  function setState(k) {
    Array.prototype.forEach.call(seg.children, function (b) { b.setAttribute("aria-selected", b.getAttribute("data-k") == k ? "true" : "false"); });
    shells.forEach(function (s, j) {
      var u = k === 0 ? s.ui : (k === 1 ? s.cl : s.inv);
      s.c.style.transition = U.reduce ? "none" : "r 1s cubic-bezier(.2,.7,.2,1) " + (j * 0.06) + "s, stroke .6s";
      s.c.setAttribute("r", rad(Math.log10(u)));
      s.c.setAttribute("stroke", k === 2 ? "#f0b25a" : (k === 1 ? "#ff8f8f" : "#a99cf0"));
    });
    lab.textContent = states[k][0]; lab2.textContent = states[k][1];
  }
  Array.prototype.forEach.call(seg.children, function (b) { b.addEventListener("click", function () { setState(+b.getAttribute("data-k")); auto = false; }); });
  setState(0);
  var auto = !U.reduce, k0 = 0;
  U.onReveal(svg, function () {
    if (!auto) return;
    setTimeout(function () { if (auto) setState(1); }, 900);
    setTimeout(function () { if (auto) setState(2); }, 2600);
  });

  /* profile chart */
  (function () {
    var host = document.getElementById("plotMW"), W = 420, H = 250, m = { l: 50, r: 14, t: 14, b: 42 };
    var s = el("svg", { viewBox: "0 0 " + W + " " + H, role: "img", "aria-label": "Dark-matter density change versus radius: measured and Inventa" }, host);
    var x = lin(Math.log10(0.008), Math.log10(1.1), m.l, W - m.r), y = lin(-0.05, 0.32, H - m.b, m.t);
    var gr = el("g", { class: "grid" }, s);
    [0, 0.1, 0.2, 0.3].forEach(function (v) { el("line", { x1: m.l, x2: W - m.r, y1: y(v), y2: y(v) }, gr); });
    var ax = el("g", { class: "axis" }, s);
    el("line", { x1: m.l, x2: W - m.r, y1: y(0), y2: y(0), stroke: "#9aa3b2" }, ax);
    [0.01, 0.03, 0.1, 0.3, 1].forEach(function (v) { txt(ax, x(Math.log10(v)), H - m.b + 16, String(v), { "text-anchor": "middle" }); });
    [0, 0.1, 0.2, 0.3].forEach(function (v) { txt(ax, m.l - 7, y(v) + 4, (v > 0 ? "+" : "") + v.toFixed(1), { "text-anchor": "end" }); });
    txt(ax, (m.l + W - m.r) / 2, H - 6, "Radius r / R200 (log scale)", { "text-anchor": "middle", style: "font-size:11.5px;fill:#4b5565" });
    txt(ax, 12, (m.t + H - m.b) / 2, "Δ log ρ_DM vs twin (dex)", { "text-anchor": "middle", transform: "rotate(-90 12 " + (m.t + H - m.b) / 2 + ")", style: "font-size:11.5px;fill:#4b5565" });
    var X = [0.0108, 0.0233, 0.050, 0.108, 0.200, 0.501, 0.926], meas = [0.219, 0.103, 0.058, 0.024, -0.002, -0.018, -0.020], pred = [0.192, 0.115, 0.054, 0.021, -0.002, -0.014, -0.018];
    var d = pred.map(function (v, i) { return (i ? "L" : "M") + x(Math.log10(X[i])).toFixed(1) + "," + y(v).toFixed(1); }).join("");
    el("path", { d: d, fill: "none", stroke: U.C.inv, "stroke-width": 2.6, "stroke-linecap": "round", "stroke-linejoin": "round" }, s);
    meas.forEach(function (v, i) {
      el("circle", { cx: x(Math.log10(X[i])), cy: y(v), r: 4.6, fill: "#fff", stroke: "#2f3742", "stroke-width": 1.8 }, s);
      var hit = el("circle", { cx: x(Math.log10(X[i])), cy: y(v), r: 12, fill: "transparent" }, s);
      hit.addEventListener("mousemove", function (ev) { U.showTip("<b>r = " + X[i] + " R200</b><br>measured " + (v > 0 ? "+" : "") + v.toFixed(3) + " dex<br>Inventa " + (pred[i] > 0 ? "+" : "") + pred[i].toFixed(3) + " dex", ev); });
      hit.addEventListener("mouseleave", U.hideTip);
    });
    var cxp = x(Math.log10(0.0108)), cyp = y(0.30);
    el("path", { d: "M" + (cxp - 5) + "," + (cyp - 5) + "L" + (cxp + 5) + "," + (cyp + 5) + "M" + (cxp + 5) + "," + (cyp - 5) + "L" + (cxp - 5) + "," + (cyp + 5), stroke: "#c2463b", "stroke-width": 2.2, "stroke-linecap": "round" }, s);
    txt(s, cxp + 10, cyp + 4, "textbook law ≈ +0.30", { style: "font-size:11.5px;fill:#a43a30;font-weight:600" });
    txt(s, x(Math.log10(0.03)) + 8, y(0.13) - 2, "Inventa", { style: "font-size:12px;font-weight:700;fill:#9c5a07" });
    txt(s, x(Math.log10(0.0108)) + 10, y(0.219) + 12, "simulation", { style: "font-size:11.5px;fill:#2f3742" });
  })();

  /* plasma cross-section */
  (function () {
    var svg = document.getElementById("ntSvg");
    var defs = el("defs", {}, svg);
    var pg = el("radialGradient", { id: "plGlow", cx: "50%", cy: "50%", r: "55%" }, defs);
    el("stop", { offset: "0%", "stop-color": "#ffe9fb", "stop-opacity": ".95" }, pg);
    el("stop", { offset: "45%", "stop-color": "#d77be0", "stop-opacity": ".55" }, pg);
    el("stop", { offset: "100%", "stop-color": "#5b2a8f", "stop-opacity": ".22" }, pg);
    var bl = el("filter", { id: "plBlur", x: "-30%", y: "-30%", width: "160%", height: "160%" }, defs);
    el("feGaussianBlur", { stdDeviation: "2.2" }, bl);
    el("rect", { x: 0, y: 0, width: 420, height: 300, rx: 14, fill: "#0f1626" }, svg);
    var CX = 300, CY = 150, A = 74, KAP = 1.58;
    function surf(rho, dl) {
      var d = "", n = 96, del = Math.asin(Math.max(-0.95, Math.min(0.95, dl * Math.min(1, rho * 1.15))));
      for (var i = 0; i <= n; i++) { var t = 2 * Math.PI * i / n, R = CX + A * rho * Math.cos(t + del * Math.sin(t)), Z = CY - KAP * A * rho * Math.sin(t); d += (i ? "L" : "M") + R.toFixed(1) + "," + Z.toFixed(1); }
      return d + "Z";
    }
    var sol = [1.03, 1.06, 1.09, 1.12].map(function (r, i) { return [r, el("path", { fill: "none", stroke: "#f0a8ff", "stroke-width": 1.2, opacity: 0 }, svg)]; });
    var core = el("path", { fill: "url(#plGlow)" }, svg);
    var inner = [0.25, 0.5, 0.75].map(function (r) { return [r, el("path", { fill: "none", stroke: "#ffffff", "stroke-opacity": 0.2, "stroke-width": 0.9 }, svg)]; });
    var band = el("path", { fill: "none", "stroke-width": 5.5, "stroke-linejoin": "round", opacity: 0.95 }, svg);
    var rim = el("path", { fill: "none", stroke: "#ffffff", "stroke-width": 1.6 }, svg);
    el("circle", { cx: CX, cy: CY, r: 2.4, fill: "#fff" }, svg);
    var t1 = txt(svg, 18, 40, "", { style: "font:600 14px Inter,sans-serif;fill:#e7ecf6" });
    var t2 = txt(svg, 18, 60, "", { style: "font:500 11.5px Inter,sans-serif;fill:#9fb0cc" });
    var t3 = txt(svg, 18, 76, "", { style: "font:500 11.5px Inter,sans-serif;fill:#9fb0cc" });
    var pill = el("rect", { x: 18, y: 92, rx: 11, height: 22, width: 120 }, svg);
    var pt = txt(svg, 28, 107, "", { style: "font:700 11.5px Inter,sans-serif;fill:#0f1626" });
    txt(svg, 18, 238, "Edge band, ρ = 0.94–0.98:", { style: "font:500 10.5px Inter,sans-serif;fill:#9fb0cc" });
    el("rect", { x: 18, y: 247, width: 14, height: 6, rx: 3, fill: "#3fd3a0" }, svg);
    txt(svg, 37, 253, "magnetic well", { style: "font:500 10.5px Inter,sans-serif;fill:#c9d6f0" });
    el("rect", { x: 18, y: 262, width: 14, height: 6, rx: 3, fill: "#ff6b6b" }, svg);
    txt(svg, 37, 268, "magnetic hill", { style: "font:500 10.5px Inter,sans-serif;fill:#c9d6f0" });
    var ST = [
      ["D shape, δ = +0.5", "Magnetic well at the edge:", "it carries the barrier current", "barrier forms", "#3fd3a0"],
      ["Reversed D, δ = −0.5", "Magnetic hill at the edge:", "current only in a narrow window", "no barrier at any power", "#ff6b6b"]
    ];
    function draw(dl, w) {
      core.setAttribute("d", surf(1, dl)); rim.setAttribute("d", surf(1, dl)); band.setAttribute("d", surf(0.96, dl));
      inner.forEach(function (q) { q[1].setAttribute("d", surf(q[0], dl)); });
      sol.forEach(function (q, i) { q[1].setAttribute("d", surf(q[0], dl)); q[1].setAttribute("opacity", (w * (0.34 - i * 0.07)).toFixed(3)); });
      rim.setAttribute("stroke-opacity", (0.95 - 0.6 * w).toFixed(3));
    }
    function label(k) {
      var q = ST[k]; t1.textContent = q[0]; t2.textContent = q[1]; t3.textContent = q[2]; pt.textContent = q[3];
      pill.setAttribute("fill", q[4]); pill.setAttribute("width", k ? 152 : 100); band.setAttribute("stroke", q[4]);
      var tb = document.getElementById("ntTab"); if (tb) tb.setAttribute("data-k", k);
    }
    var seg = document.getElementById("ntSeg"), cur = 0.5, raf = 0, auto = !U.reduce;
    function setState(k, anim) {
      Array.prototype.forEach.call(seg.children, function (b) { b.setAttribute("aria-selected", b.getAttribute("data-k") == k ? "true" : "false"); });
      var from = cur, to = k ? -0.5 : 0.5, t0 = null, D = 1100, sw = false;
      cancelAnimationFrame(raf);
      if (!anim || U.reduce) { cur = to; draw(to, k ? 1 : 0); label(k); return; }
      function step(ts) {
        if (t0 === null) t0 = ts; var u = Math.min(1, (ts - t0) / D), e = u < 0.5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2;
        cur = from + (to - from) * e; var w = (0.5 - cur);
        draw(cur, Math.max(0, Math.min(1, w)));
        if (!sw && e >= 0.5) { label(k); sw = true; }
        if (u < 1) raf = requestAnimationFrame(step);
      }
      raf = requestAnimationFrame(step);
    }
    Array.prototype.forEach.call(seg.children, function (b) { b.addEventListener("click", function () { auto = false; setState(+b.getAttribute("data-k"), true); }); });
    setState(0, false);
    U.onReveal(svg, function () { if (!auto) return; setTimeout(function () { if (auto) setState(1, true); }, 1200); });
  })();

  /* power scan chart */
  (function () {
    var host = document.getElementById("plotNT"), W = 420, H = 250, m = { l: 46, r: 14, t: 16, b: 42 };
    var s = el("svg", { viewBox: "0 0 " + W + " " + H, role: "img", "aria-label": "Edge pressure gradient versus heating power for the D shape and the reversed D shape" }, host);
    var x = lin(0, 20, m.l, W - m.r), y = lin(0, 5, H - m.b, m.t), PLH = 1.64, SIG = 2.42;
    el("rect", { x: x(PLH), y: m.t, width: x(20) - x(PLH), height: H - m.b - m.t, fill: "#fbeae6", opacity: 0.55 }, s);
    var gr = el("g", { class: "grid" }, s);
    [1, 2, 3, 4, 5].forEach(function (v) { el("line", { x1: m.l, x2: W - m.r, y1: y(v), y2: y(v) }, gr); });
    var ax = el("g", { class: "axis" }, s);
    el("line", { x1: m.l, x2: W - m.r, y1: y(0), y2: y(0), stroke: "#9aa3b2" }, ax);
    [0, 5, 10, 15, 20].forEach(function (v) { txt(ax, x(v), H - m.b + 16, String(v), { "text-anchor": "middle" }); });
    [0, 1, 2, 3, 4, 5].forEach(function (v) { txt(ax, m.l - 7, y(v) + 4, String(v), { "text-anchor": "end" }); });
    txt(ax, (m.l + W - m.r) / 2, H - 6, "Heating power (MW)", { "text-anchor": "middle", style: "font-size:11.5px;fill:#4b5565" });
    txt(ax, 12, (m.t + H - m.b) / 2, "Edge pressure gradient α", { "text-anchor": "middle", transform: "rotate(-90 12 " + (m.t + H - m.b) / 2 + ")", style: "font-size:11.5px;fill:#4b5565" });
    el("line", { x1: x(PLH), x2: x(PLH), y1: m.t, y2: H - m.b, stroke: "#c2463b", "stroke-width": 1.4, "stroke-dasharray": "4 3" }, s);
    txt(s, x(PLH) + 6, m.t + 12, "textbook law: barrier above 1.64 MW", { style: "font-size:11px;fill:#a43a30;font-weight:600" });
    el("line", { x1: m.l, x2: W - m.r, y1: y(SIG), y2: y(SIG), stroke: "#b0368a", "stroke-width": 1.2, "stroke-dasharray": "2 3", opacity: 0.8 }, s);
    txt(s, W - m.r - 2, y(SIG) - 6, "ceiling of the reversed edge, Σ = 2.42", { "text-anchor": "end", style: "font-size:10.5px;fill:#8a2a6c" });
    var D = [[2, 4.18, "D shape at 2 MW: barrier, α 4.18"], [6, 4.34, "D shape at 6 MW: barrier, α 4.34"]];
    var Rv = [[3, 0.27 * SIG, "Reversed D at 3 MW: no barrier, α = 0.27 Σ"], [6, 1.09, "Reversed D at 6 MW: no barrier, α 1.09"], [18, 0.89 * SIG, "Reversed D at 18 MW (11× the threshold): no barrier, α = 0.89 Σ"]];
    function line(P, c) { el("path", { d: P.map(function (p, i) { return (i ? "L" : "M") + x(p[0]).toFixed(1) + "," + y(p[1]).toFixed(1); }).join(""), fill: "none", stroke: c, "stroke-width": 2, "stroke-linecap": "round" }, s); }
    line(D, "#3f70b8"); line(Rv, "#b0368a");
    function dots(P, c, open) {
      P.forEach(function (p) {
        el("circle", { cx: x(p[0]), cy: y(p[1]), r: 5, fill: open ? "#fff" : c, stroke: open ? c : "#fff", "stroke-width": open ? 2.2 : 1.6 }, s);
        var hit = el("circle", { cx: x(p[0]), cy: y(p[1]), r: 13, fill: "transparent" }, s);
        hit.addEventListener("mousemove", function (ev) { U.showTip('<span class="sw" style="background:' + c + '"></span>' + p[2], ev); });
        hit.addEventListener("mouseleave", U.hideTip);
      });
    }
    dots(D, "#3f70b8", false); dots(Rv, "#b0368a", true);
    txt(s, x(6) + 10, y(4.34) + 16, "D shape: barrier, flat with power", { style: "font-size:11.5px;font-weight:700;fill:#2c5a9c" });
    txt(s, x(6) + 9, y(1.09) + 15, "Reversed D: climbs, never a barrier", { style: "font-size:11.5px;font-weight:700;fill:#8a2a6c" });
    txt(s, x(18), y(0.89 * SIG) + 20, "18 MW = 11×", { "text-anchor": "middle", style: "font-size:10.5px;fill:#8a2a6c" });
  })();
};
