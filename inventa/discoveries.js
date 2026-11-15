window.renderDiscoveries = function (host, U) {
  "use strict";
  var el = U.el, txt = U.txt, lin = U.lin;
  host.innerHTML =
    '<p class="lede-s">Two laws Inventa discovered on EurekaBench tasks. Both pass every scientific-constraint test of their task. The plots show each run&rsquo;s own evidence on the training simulations.</p>' +
    '<article class="disc">' +
      '<div class="disc-text">' +
        '<p class="dk">Astrophysics &middot; DREAMS simulations of Milky-Way-mass halos</p>' +
        '<h3>Baryons pull dark matter inward, but only about halfway</h3>' +
        '<p><b>The question.</b> When a galaxy forms, its stars and gas sink to the centre of the dark-matter halo. How much denser does the dark matter become than in a gravity-only twin of the same halo, and what sets the response?</p>' +
        '<p><b>The textbook law.</b> Adiabatic contraction (Blumenthal et al., 1986) conserves r&middot;M(r): dark matter moves inward by the full displacement the baryons imply. Fed the same baryons, it overshoots the central density, about +0.30 dex where the simulations show +0.22.</p>' +
        '<p><b>What Inventa found.</b> Dark matter follows only a fraction &nu; of the classical displacement, evaluated on orbit-averaged radii, and &nu; is set by the galaxy rather than the halo mass:</p>' +
        '<div class="law" id="lawMW"></div>' +
        '<p class="fitted">Fitted: &nu;<sub>0</sub> = 0.456, A = 0.904, w = 0.756. The response &nu; ranges from 0.23 to 0.69 across galaxies, set by the star-formation birthrate, stellar concentration and stellar-to-halo residual. 187 of 193 hosts are predicted denser at the centre than their twin (184 measured), and the sign changes at 0.190&nbsp;R<sub>200</sub> (measured 0.188).</p>' +
      '</div>' +
      '<div class="disc-vis">' +
        '<div class="halo-wrap"><svg id="haloSvg" viewBox="0 0 420 300" role="img" aria-label="Schematic of dark-matter shells contracting around a stellar disk"></svg>' +
          '<div class="seg" role="tablist" id="haloSeg"><button type="button" data-k="0">Gravity-only twin</button><button type="button" data-k="1">Classical, &nu; = 1</button><button type="button" data-k="2" aria-selected="true">Inventa&rsquo;s law</button></div>' +
          '<p class="vnote">Dark-matter shells at five radii, log-scaled. Each shell starts where it sits in the gravity-only twin and moves inward by the displacement each law predicts.</p></div>' +
        '<div class="plot" id="plotMW"></div>' +
      '</div>' +
    '</article>' +
    '<article class="disc disc-2">' +
      '<div class="disc-text">' +
        '<p class="dk">Astrophysics &middot; CAMELS, four galaxy-formation codes</p>' +
        '<h3>Same neighbourhood, opposite outcomes</h3>' +
        '<p><b>The question.</b> In crowded environments, small halos lose gas in SIMBA, gain gas in Swift-EAGLE, and barely change in IllustrisTNG and ASTRID. None of the four codes contains an environment rule. Why do they disagree?</p>' +
        '<p><b>The starting law.</b> A straight line in log halo mass with one offset and one slope per code: a description, not an explanation.</p>' +
        '<p><b>What Inventa found.</b> The offset is a balance of gas exchanges with the medium that the neighbouring groups&rsquo; black holes have heated, with thresholds set on the halo&rsquo;s virial temperature. Each code enters only through four categorical facts about its feedback recipe: how its black holes inject energy (jets, kinetic or thermal), and whether they expel gas, empty groups, and leave gas bound. One mechanism with 15 fitted constants reproduces the opposite signs of all four codes.</p>' +
        '<pre class="code"><span class="c"># the only model-specific input: four recipe facts per code</span>\nFEEDBACK = {\n  <span class="s">"SIMBA"</span>:        {agn: <span class="s">"jets"</span>,    expels: <span class="t">True</span>,  empties: <span class="t">True</span>,  bound: <span class="t">True</span>},\n  <span class="s">"IllustrisTNG"</span>: {agn: <span class="s">"kinetic"</span>, expels: <span class="t">True</span>,  empties: <span class="f">False</span>, bound: <span class="t">True</span>},\n  <span class="s">"ASTRID"</span>:       {agn: <span class="s">"kinetic"</span>, expels: <span class="f">False</span>, empties: <span class="f">False</span>, bound: <span class="t">True</span>},\n  <span class="s">"Swift-EAGLE"</span>:  {agn: <span class="s">"thermal"</span>, expels: <span class="t">True</span>,  empties: <span class="t">True</span>,  bound: <span class="f">False</span>}}\noff_cgm = shell_stripped + shell_emptied + linked - heat + groups</pre>' +
      '</div>' +
      '<div class="disc-vis"><div class="plot" id="plotGE"></div>' +
        '<p class="vnote">Environmental offset of circumgalactic gas (overdense minus underdense quartile, relative to the bin median) predicted by Inventa&rsquo;s law across halo mass.</p></div>' +
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
  if (window.katex) renderLaw(); else window.addEventListener("load", renderLaw);

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
    ["Classical contraction, ν = 1", "Full adiabatic displacement: the centre overshoots"],
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
    txt(s, cxp + 10, cyp + 4, "classical contraction ≈ +0.30", { style: "font-size:11.5px;fill:#a43a30;font-weight:600" });
    txt(s, x(Math.log10(0.03)) + 8, y(0.13) - 2, "Inventa", { style: "font-size:12px;font-weight:700;fill:#9c5a07" });
    txt(s, x(Math.log10(0.0108)) + 10, y(0.219) + 12, "measured", { style: "font-size:11.5px;fill:#2f3742" });
  })();

  /* galaxy environment chart */
  (function () {
    var host = document.getElementById("plotGE"), W = 460, H = 300, m = { l: 50, r: 96, t: 16, b: 44 };
    var s = el("svg", { viewBox: "0 0 " + W + " " + H, role: "img", "aria-label": "Predicted environmental gas offset versus halo mass for four simulation codes" }, host);
    var M = [10.5, 11, 11.5, 12, 12.5, 13, 13.5];
    var ser = [
      ["SIMBA", "jets", "#2a78d6", [-1.07, -0.58, -0.38, 0.01, 0.34, 0.33, 0.00]],
      ["IllustrisTNG", "kinetic", "#1baf7a", [-0.18, -0.01, 0.06, 0.07, 0.41, 0.40, 0.07]],
      ["ASTRID", "kinetic, no expulsion", "#6250d6", [-0.05, 0.00, 0.02, 0.02, 0.02, 0.02, 0.02]],
      ["Swift-EAGLE", "thermal", "#e34948", [0.10, 0.53, 0.52, 0.48, 0.31, 0.09, 0.02]]
    ];
    var x = lin(10.4, 13.6, m.l, W - m.r), y = lin(-1.15, 0.65, H - m.b, m.t);
    var gr = el("g", { class: "grid" }, s);
    [-1, -0.5, 0, 0.5].forEach(function (v) { el("line", { x1: m.l, x2: W - m.r, y1: y(v), y2: y(v) }, gr); });
    var ax = el("g", { class: "axis" }, s);
    el("line", { x1: m.l, x2: W - m.r, y1: y(0), y2: y(0), stroke: "#9aa3b2" }, ax);
    [10.5, 11, 11.5, 12, 12.5, 13, 13.5].forEach(function (v) { txt(ax, x(v), H - m.b + 16, String(v), { "text-anchor": "middle" }); });
    [-1, -0.5, 0, 0.5].forEach(function (v) { txt(ax, m.l - 7, y(v) + 4, (v > 0 ? "+" : "") + v.toFixed(1), { "text-anchor": "end" }); });
    txt(ax, (m.l + W - m.r) / 2, H - 6, "Halo mass, log10(M / Msun)", { "text-anchor": "middle", style: "font-size:11.5px;fill:#4b5565" });
    txt(ax, 12, (m.t + H - m.b) / 2, "Gas offset, crowded vs isolated", { "text-anchor": "middle", transform: "rotate(-90 12 " + (m.t + H - m.b) / 2 + ")", style: "font-size:11.5px;fill:#4b5565" });
    txt(s, x(13.55), y(0.6), "gains gas", { "text-anchor": "end", style: "font-size:10.5px;fill:#7b8494" });
    txt(s, x(12.9), y(-0.98), "loses gas", { style: "font-size:10.5px;fill:#7b8494" });
    var ends = [];
    ser.forEach(function (q) {
      var d = q[3].map(function (v, i) { return (i ? "L" : "M") + x(M[i]).toFixed(1) + "," + y(v).toFixed(1); }).join("");
      el("path", { d: d, fill: "none", stroke: q[2], "stroke-width": 2.3, "stroke-linecap": "round", "stroke-linejoin": "round" }, s);
      q[3].forEach(function (v, i) {
        el("circle", { cx: x(M[i]), cy: y(v), r: 3.6, fill: q[2], stroke: "#fff", "stroke-width": 1.4 }, s);
        var hit = el("circle", { cx: x(M[i]), cy: y(v), r: 10, fill: "transparent" }, s);
        hit.addEventListener("mousemove", function (ev) { U.showTip('<span class="sw" style="background:' + q[2] + '"></span><b>' + q[0] + "</b> · AGN " + q[1] + "<br>log M = " + M[i] + ": " + (v > 0 ? "+" : "") + v.toFixed(2), ev); });
        hit.addEventListener("mouseleave", U.hideTip);
      });
      ends.push([q, y(q[3][0])]);
    });
    var labs = [["SIMBA", "jets", 10.5, -1.07, 12, 4], ["Swift-EAGLE", "thermal", 11.25, 0.53, -10, -10], ["IllustrisTNG", "kinetic", 12.5, 0.41, 6, -10], ["ASTRID", "kinetic", 13.5, 0.02, 8, 4]];
    labs.forEach(function (L) {
      var q = ser.filter(function (z) { return z[0] === L[0]; })[0];
      txt(s, x(L[2]) + L[4], y(L[3]) + L[5], L[0], { style: "font-size:11.5px;font-weight:700;fill:" + (L[0] === "IllustrisTNG" ? "#0f7a55" : q[2]) });
    });
  })();
};
