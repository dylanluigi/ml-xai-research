/* Hero visuals and count-up numbers.
   Each visual plays once when it scrolls into view, then reacts to hover,
   tap and keyboard focus. Nothing loops. The bar charts plot values reported
   in the thesis (Table 3.7 and Section 4.2.2). */
(function () {
  'use strict';

  var NS = 'http://www.w3.org/2000/svg';
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function el(tag, attrs, parent) {
    var node = document.createElementNS(NS, tag);
    Object.keys(attrs || {}).forEach(function (k) { node.setAttribute(k, attrs[k]); });
    if (parent) parent.appendChild(node);
    return node;
  }
  function label(parent, x, y, str, cls, anchor) {
    var t = el('text', { x: x, y: y }, parent);
    if (cls) t.setAttribute('class', cls);
    if (anchor) t.setAttribute('text-anchor', anchor);
    t.textContent = str;
    return t;
  }
  function round(n) { return Math.round(n * 10) / 10; }
  function mount(host, w, h) { return el('svg', { viewBox: '0 0 ' + w + ' ' + h }, host); }
  function delay(node, ms) { node.style.setProperty('--d', ms + 'ms'); }

  /* ── concept activation space (after Kim et al. 2018) ──
     Layer-l activations of random images and of concept images. The CAV is the
     unit difference of the two centroids, normal to the dashed linear boundary.
     Each zebra input carries the gradient of the zebra logit; its conceptual
     sensitivity S = ∇h · v is positive when the angle to the CAV is acute, and
     the TCAV score is the fraction of zebra inputs with S > 0. Geometry is
     illustrative; the scores are computed from it. */
  var csCount = 0;
  function conceptSpace(host) {
    var W = 320, H = 244, PX = 4, PY = 4, PW = 312, PH = 210;
    var svg = mount(host, W, H);
    var clipId = 'ca-clip-' + (++csCount);
    var defs = el('defs', {}, svg);
    var clip = el('clipPath', { id: clipId }, defs);
    el('rect', { x: PX, y: PY, width: PW, height: PH, rx: 6 }, clip);
    el('rect', { class: 'ca-plane', x: PX, y: PY, width: PW, height: PH, rx: 6 }, svg);
    label(svg, 12, 207, 'layer l activations', 'ca-label ca-label--meta');
    var readout = label(svg, 160, 238, '', 'viz-readout');

    var NEG = { x: 110, y: 140 };
    var CONCEPTS = [
      { id: 'striped', x: 226, y: 62, ly: -20 },
      { id: 'zigzagged', x: 47, y: 50, ly: -20 },
      { id: 'dotted', x: 177, y: 190, ly: -22 }
    ];
    var NEG_OFF = [[20, -18], [-20, 18], [8, 24], [-8, -24], [26, 6], [-26, -6], [0, 0], [14, 16], [-14, -16]];
    var POS_OFF = [[12, -6], [-12, 6], [5, 13], [-5, -13], [15, 8], [-15, -8], [0, 0]];
    var ZEBRAS = [
      { x: 254, y: 132, a: -55 }, { x: 280, y: 108, a: -30 }, { x: 264, y: 164, a: -70 },
      { x: 290, y: 146, a: -22 }, { x: 244, y: 104, a: -85 }
    ];

    var clipped = el('g', { 'clip-path': 'url(#' + clipId + ')' }, svg);
    var boundary = el('line', { class: 'ca-boundary' }, clipped);

    NEG_OFF.forEach(function (o, i) {
      var g = el('g', { class: 'ca-pt', transform: 'translate(' + (NEG.x + o[0]) + ' ' + (NEG.y + o[1]) + ')' }, svg);
      g.style.transitionDelay = (i * 30) + 'ms';
      el('circle', { class: 'ca-neg', r: 3.5 }, g);
    });
    label(svg, NEG.x, NEG.y + 40, 'random', 'ca-label', 'middle');
    el('circle', { class: 'ca-centroid', cx: NEG.x, cy: NEG.y, r: 5 }, svg);

    var pos = POS_OFF.map(function (o, i) {
      var g = el('g', { class: 'ca-pt ca-pt--pos' }, svg);
      g.style.transitionDelay = (250 + i * 40) + 'ms';
      el('circle', { class: 'ca-pos', r: 3.5 }, g);
      return { g: g, o: o };
    });
    var conceptLabel = label(svg, 0, 0, '', 'ca-label ca-label--accent', 'middle');

    var cav = el('g', { class: 'ca-cav' }, svg);
    var cavLine = el('line', {}, cav);
    var cavHead = el('path', {}, cav);
    var cavText = label(cav, 0, 0, 'CAV', 'ca-label ca-label--accent', 'middle');

    function head(path, x1, y1, x2, y2, len) {
      var a = Math.atan2(y2 - y1, x2 - x1), s = 0.45;
      path.setAttribute('d', 'M' + round(x2) + ' ' + round(y2) +
        ' L' + round(x2 - len * Math.cos(a - s)) + ' ' + round(y2 - len * Math.sin(a - s)) +
        ' L' + round(x2 - len * Math.cos(a + s)) + ' ' + round(y2 - len * Math.sin(a + s)) + ' Z');
    }

    var zebras = ZEBRAS.map(function (z, i) {
      var rad = z.a * Math.PI / 180;
      z.gx = Math.cos(rad); z.gy = Math.sin(rad);
      var g = el('g', { class: 'ca-input', tabindex: 0, role: 'img' }, svg);
      var grad = el('g', { class: 'ca-grad' }, g);
      grad.style.transitionDelay = (700 + i * 60) + 'ms';
      var ex = z.x + z.gx * 24, ey = z.y + z.gy * 24;
      el('line', { x1: z.x, y1: z.y, x2: round(ex), y2: round(ey) }, grad);
      head(el('path', {}, grad), z.x, z.y, ex, ey, 6);
      el('circle', { class: 'ca-ring', cx: z.x, cy: z.y, r: 9 }, g);
      var d = el('rect', { class: 'ca-in', x: z.x - 3.5, y: z.y - 3.5, width: 7, height: 7 }, g);
      d.setAttribute('transform', 'rotate(45 ' + z.x + ' ' + z.y + ')');
      z.n = i + 1; z.g = g; z.grad = grad;
      g.addEventListener('pointerenter', function () { activate(z); });
      g.addEventListener('focus', function () { activate(z); });
      g.addEventListener('pointerleave', function () { activate(null); });
      g.addEventListener('blur', function () { activate(null); });
      return z;
    });
    label(svg, 312, 196, 'zebra inputs, ∇h', 'ca-label', 'end');

    var current, v = { x: 1, y: 0 };
    function score() {
      return zebras.filter(function (z) { return z.s > 0; }).length;
    }
    function summary() {
      var k = score();
      return 'TCAV score, ' + current.id + ': ' + k + ' of ' + zebras.length + ' = ' + (k / zebras.length).toFixed(2);
    }
    function setConcept(c) {
      current = c;
      var dx = c.x - NEG.x, dy = c.y - NEG.y, len = Math.sqrt(dx * dx + dy * dy);
      v = { x: dx / len, y: dy / len };
      pos.forEach(function (p) {
        p.g.setAttribute('transform', 'translate(' + (c.x + p.o[0]) + ' ' + (c.y + p.o[1]) + ')');
        p.g.style.transform = 'translate(' + (c.x + p.o[0]) + 'px,' + (c.y + p.o[1]) + 'px)';
      });
      conceptLabel.setAttribute('x', c.x);
      conceptLabel.setAttribute('y', c.y + c.ly);
      conceptLabel.textContent = c.id;

      var mx = (NEG.x + c.x) / 2, my = (NEG.y + c.y) / 2;
      boundary.setAttribute('x1', round(mx - v.y * 200)); boundary.setAttribute('y1', round(my + v.x * 200));
      boundary.setAttribute('x2', round(mx + v.y * 200)); boundary.setAttribute('y2', round(my - v.x * 200));

      var sx = NEG.x + v.x * 8, sy = NEG.y + v.y * 8, ex = c.x - v.x * 12, ey = c.y - v.y * 12;
      cavLine.setAttribute('x1', round(sx)); cavLine.setAttribute('y1', round(sy));
      cavLine.setAttribute('x2', round(ex)); cavLine.setAttribute('y2', round(ey));
      head(cavHead, sx, sy, ex, ey, 7);
      cavText.setAttribute('x', round(mx + v.y * 14));
      cavText.setAttribute('y', round(my - v.x * 14 + 4));

      zebras.forEach(function (z) {
        z.s = z.gx * v.x + z.gy * v.y;
        z.grad.classList.toggle('is-neg', z.s <= 0);
        z.g.setAttribute('aria-label', 'Zebra input ' + z.n + ', conceptual sensitivity to ' + c.id + ' ' +
          (z.s > 0 ? 'positive' : 'negative') + ', ' + (z.s > 0 ? '+' : '−') + Math.abs(z.s).toFixed(2));
      });
      buttons.forEach(function (b) { b.setAttribute('aria-pressed', String(b.__c === c)); });
      readout.textContent = summary();
    }
    function activate(z) {
      host.classList.toggle('has-hover', !!z);
      zebras.forEach(function (o) { o.g.classList.toggle('is-active', o === z); });
      if (!z) { readout.textContent = summary(); return; }
      readout.textContent = 'Zebra ' + z.n + ' · S = ∇h · v = ' + (z.s > 0 ? '+' : '−') + Math.abs(z.s).toFixed(2) +
        (z.s > 0 ? ' (> 0)' : ' (< 0)');
    }

    var bar = document.createElement('div');
    bar.className = 'ca-controls';
    bar.setAttribute('role', 'group');
    bar.setAttribute('aria-label', 'Concept tested against the zebra class');
    var buttons = CONCEPTS.map(function (c) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'ca-chip';
      b.textContent = c.id;
      b.__c = c;
      b.addEventListener('click', function () { setConcept(c); });
      bar.appendChild(b);
      return b;
    });
    host.appendChild(bar);
    setConcept(CONCEPTS[0]);
  }

  /* ── this project: the interpretation g : E_m → E_h in its two phases ──
     Left, a layer's activation map in the model space E_m; right, the human
     concept vocabulary E_h of each phase; the links are the mapping g. The map
     pattern is schematic; concepts and phase facts come from the thesis. */
  function interpretationMap(host) {
    var W = 320, H = 244;
    var svg = mount(host, W, H);
    var readout = label(svg, 160, 238, '', 'viz-readout');
    label(svg, 64, 22, 'Eₘ · model', 'ca-label ca-label--meta', 'middle');
    label(svg, 256, 22, 'Eₕ · concepts', 'ca-label ca-label--meta', 'middle');
    label(svg, 160, 22, 'g : Eₘ → Eₕ', 'ca-label ca-label--accent', 'middle');

    var PHASES = [
      {
        id: 'controlled', name: 'Controlled phase',
        note: 'AIXI-Shape and TXUXI · ground truth known',
        blobs: [[2.2, 2.0, 1.1, 1], [4.2, 4.0, 0.8, 0.7]],
        concepts: [
          { c: 'circle', d: 'Circle · per-pixel mask available' },
          { c: 'square', d: 'Square · per-pixel mask available' },
          { c: 'cross', d: 'Cross · per-pixel mask available' }
        ]
      },
      {
        id: 'clinical', name: 'Clinical phase',
        note: 'V-MedCAV · 17 dermoscopic concepts',
        blobs: [[2.6, 2.6, 1.7, 1], [1.4, 3.8, 0.9, 0.55], [4.0, 1.6, 0.8, 0.45]],
        concepts: [
          { c: 'PN_T', d: 'Typical Pigment Network · derm7pt · Mel−' },
          { c: 'BWV', d: 'Blue-Whitish Veil · derm7pt · Mel+' },
          { c: 'ASYM', d: 'Asymmetry · PH2 · Mel+' },
          { c: 'COL3', d: 'Three or More Colours · PH2 · Mel+' }
        ]
      }
    ];

    /* activation map: 6 × 6 cells, one feature map of layer l */
    var GX = 16, GY = 48, STEP = 16, CELL = 14, N = 6;
    el('rect', { class: 'im-sheet', x: GX - 2 + 8, y: GY - 2 - 8, width: N * STEP + 2, height: N * STEP + 2, rx: 3 }, svg);
    el('rect', { class: 'im-sheet', x: GX - 2 + 4, y: GY - 2 - 4, width: N * STEP + 2, height: N * STEP + 2, rx: 3 }, svg);
    el('rect', { class: 'im-frame', x: GX - 2, y: GY - 2, width: N * STEP + 2, height: N * STEP + 2, rx: 3 }, svg);
    var cells = [];
    for (var r = 0; r < N; r++) {
      for (var c = 0; c < N; c++) {
        var cell = el('rect', { class: 'im-cell', x: GX + c * STEP, y: GY + r * STEP, width: CELL, height: CELL, rx: 1.5 }, svg);
        cell.style.setProperty('--d', (r * N + c) * 12 + 'ms');
        cells.push({ el: cell, r: r, c: c });
      }
    }
    label(svg, 64, 162, 'layer l activations', 'ca-label', 'middle');
    var source = { x: GX + N * STEP + 4, y: GY + (N * STEP) / 2 };

    var links = el('g', {}, svg);
    var chips = el('g', {}, svg);
    var noteText = label(svg, 160, 196, '', 'ca-label', 'middle');
    var items = [], current;

    function setPhase(p) {
      current = p;
      cells.forEach(function (k) {
        var v = 0;
        p.blobs.forEach(function (b) {
          var dx = k.c - b[0], dy = k.r - b[1];
          v += b[3] * Math.exp(-(dx * dx + dy * dy) / (2 * b[2] * b[2]));
        });
        k.el.style.setProperty('--v', Math.min(1, 0.08 + v * 0.92).toFixed(2));
      });
      while (links.firstChild) links.removeChild(links.firstChild);
      while (chips.firstChild) chips.removeChild(chips.firstChild);
      var n = p.concepts.length, gap = 32, top = source.y - ((n - 1) * gap) / 2;
      items = p.concepts.map(function (k, i) {
        var y = top + i * gap, x = 204;
        var path = el('path', {
          class: 'im-link', pathLength: 1,
          d: 'M' + source.x + ' ' + source.y + ' C' + (source.x + 48) + ' ' + source.y + ' ' + (x - 48) + ' ' + y + ' ' + x + ' ' + y
        }, links);
        path.style.setProperty('--d', (200 + i * 80) + 'ms');
        var g = el('g', { class: 'im-chip', tabindex: 0, role: 'img', 'aria-label': k.d }, chips);
        g.style.setProperty('--d', (360 + i * 80) + 'ms');
        el('rect', { x: x, y: y - 11, width: 104, height: 22, rx: 3 }, g);
        label(g, x + 52, y + 4, k.c, '', 'middle');
        var item = { g: g, path: path, k: k };
        function on() { activate(item); }
        function off() { activate(null); }
        g.addEventListener('pointerenter', on);
        g.addEventListener('focus', on);
        g.addEventListener('pointerleave', off);
        g.addEventListener('blur', off);
        return item;
      });
      noteText.textContent = p.note;
      buttons.forEach(function (b) { b.setAttribute('aria-pressed', String(b.__p === p)); });
      readout.textContent = 'Hover a concept to read it';
    }
    function activate(item) {
      host.classList.toggle('has-hover', !!item);
      items.forEach(function (o) {
        o.g.classList.toggle('is-active', o === item);
        o.path.classList.toggle('is-active', o === item);
      });
      readout.textContent = item ? item.k.d : 'Hover a concept to read it';
    }

    var bar = document.createElement('div');
    bar.className = 'ca-controls';
    bar.setAttribute('role', 'group');
    bar.setAttribute('aria-label', 'Phase of the project');
    var buttons = PHASES.map(function (p) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'ca-chip';
      b.textContent = p.name;
      b.__p = p;
      b.addEventListener('click', function () { setPhase(p); });
      bar.appendChild(b);
      return b;
    });
    host.appendChild(bar);
    setPhase(PHASES[0]);
  }

  /* ── taxonomy of the methods reviewed in Chapter 2 ── */
  function taxonomy(host) {
    var W = 320, H = 210, DEFAULT = 'Hover a branch to see its methods';
    var svg = mount(host, W, H);
    var readout = label(svg, 160, 196, DEFAULT, 'viz-readout');

    var root = el('g', { class: 'tx-node' }, svg);
    el('rect', { x: 100, y: 8, width: 120, height: 28, rx: 4 }, root);
    label(root, 160, 26, 'Concept-based');

    var branches = [
      { n: 'Supervised', x: 56, m: ['TCAV', 'RCV', 'Net. Dissection', 'Visual-TCAV'], focus: true },
      { n: 'Unsupervised', x: 160, m: ['ACE', 'CRAFT', 'ConceptSHAP'] },
      { n: 'Beyond CAVs', x: 264, m: ['CBM', 'CaCE', 'CRP'] }
    ];
    branches.forEach(function (b, i) {
      var g = el('g', {
        class: 'tx-branch' + (b.focus ? ' is-focus' : ''), tabindex: 0, role: 'img',
        'aria-label': b.n + ' methods: ' + b.m.join(', ')
      }, svg);
      var path = el('path', { class: 'tx-path', pathLength: 1, d: 'M160 36 V66 H' + b.x + ' V94' }, g);
      delay(path, 150 + i * 150);
      var node = el('g', { class: 'tx-node' }, g);
      delay(node, 450 + i * 150);
      el('rect', { x: b.x - 46, y: 94, width: 92, height: 28, rx: 4 }, node);
      label(node, b.x, 112, b.n);
      b.m.forEach(function (name, j) {
        var lx = b.x + (j - (b.m.length - 1) / 2) * 24;
        var lp = el('path', { class: 'tx-path', pathLength: 1, d: 'M' + b.x + ' 122 V132 H' + lx + ' V142' }, g);
        delay(lp, 700 + i * 150 + j * 60);
        var leaf = el('circle', { class: 'tx-leaf', cx: lx, cy: 146, r: 4 }, g);
        el('title', {}, leaf).textContent = name;
      });
      b.g = g;
      function on() { activate(b); }
      function off() { activate(null); }
      g.addEventListener('pointerenter', on);
      g.addEventListener('focus', on);
      g.addEventListener('pointerleave', off);
      g.addEventListener('blur', off);
    });
    function activate(b) {
      svg.parentNode.classList.toggle('has-hover', !!b);
      branches.forEach(function (o) { o.g.classList.toggle('is-active', o === b); });
      readout.textContent = b ? b.m.join(', ') : DEFAULT;
    }
  }

  /* ── grouped bar chart of values reported in the thesis ── */
  function bars(host, cfg) {
    var W = 320, H = cfg.rotate ? 258 : 236, top = 14, base = 168, full = base - top;
    var left = 34, right = 312, n = cfg.groups.length, step = (right - left) / n;
    var bw = Math.min(22, (step - 8) / 2);
    var svg = mount(host, W, H);
    var readout = label(svg, 160, H - 4, cfg.prompt, 'viz-readout');
    el('line', { class: 'lb-axis', x1: left, x2: right, y1: base, y2: base }, svg);
    label(svg, left - 6, base + 4, '0', '', 'end');
    label(svg, left - 6, top + 4, cfg.maxLabel, '', 'end');
    if (cfg.chance != null) {
      var cy = base - cfg.chance / cfg.max * full;
      el('line', { class: 'lb-chance', x1: left, x2: right, y1: cy, y2: cy }, svg);
      label(svg, left - 6, cy + 4, String(cfg.chance), '', 'end');
    }

    var hits = [];
    cfg.groups.forEach(function (gname, i) {
      var gx = left + i * step + (step - 2 * bw - 3) / 2;
      cfg.series.forEach(function (s, k) {
        var v = s.v[i], x = round(gx + k * (bw + 3));
        var h = Math.max(0, Math.min(1, v / cfg.max)) * full;
        var text = gname + ' · ' + s.n + ' · ' + cfg.fmt(v);
        var bar = el('rect', { class: 'lb-bar ' + s.cls, x: x, y: round(base - h), width: round(bw), height: round(h), rx: 1 }, svg);
        delay(bar, i * 60 + k * 30);
        var hit = el('rect', {
          class: 'lb-hit', x: x, y: top, width: round(bw), height: full,
          tabindex: 0, role: 'img', 'aria-label': text
        }, svg);
        hit.__bar = bar;
        hit.__text = text;
        hits.push(hit);
        hit.addEventListener('pointerenter', function () { activate(hit); });
        hit.addEventListener('focus', function () { activate(hit); });
        hit.addEventListener('pointerleave', function () { activate(null); });
        hit.addEventListener('blur', function () { activate(null); });
      });
      var tx = round(left + i * step + step / 2);
      var tick = label(svg, tx, base + 14, gname, cfg.rotate ? 'lb-tick lb-tick--rot' : 'lb-tick');
      if (cfg.rotate) tick.setAttribute('transform', 'rotate(-35 ' + tx + ' ' + (base + 14) + ')');
    });

    var ly = H - 30, lx = left;
    cfg.series.forEach(function (s) {
      el('rect', { class: 'lb-swatch ' + s.cls, x: lx, y: ly - 9, width: 10, height: 10, rx: 1 }, svg);
      label(svg, lx + 14, ly, s.n);
      lx += 24 + s.n.length * 7;
    });

    function activate(hit) {
      host.classList.toggle('has-hover', !!hit);
      hits.forEach(function (o) { o.__bar.classList.toggle('is-active', o === hit); });
      readout.textContent = hit ? hit.__text : cfg.prompt;
    }
  }

  /* Table 3.7: mean Spatial-AuC on AIXI per negative pool and CAV method */
  function poolAuc(host) {
    bars(host, {
      groups: ['OOD', 'Matched-absent', 'Matched-blind'],
      series: [
        { n: 'Centroid', cls: 'lb-bar--a', v: [0.227, 0.901, 0.620] },
        { n: 'Classifier', cls: 'lb-bar--b', v: [0.803, 0.909, 0.806] }
      ],
      max: 1, maxLabel: '1.0', chance: 0.5,
      prompt: 'Hover a bar for its mean Spatial-AuC',
      fmt: function (v) { return v.toFixed(3); }
    });
  }

  /* Section 4.2.2: mean global Visual-TCAV attribution at the deepest block */
  function dermAttr(host) {
    var LOW = 0.001;
    bars(host, {
      groups: ['COL3', 'ASYM_2AX', 'ASYM', 'RS_CO', 'DG_R', 'PIG_R', 'ST_R', 'PN_T'],
      series: [
        { n: 'Melanoma', cls: 'lb-bar--a', v: [0.237, 0.172, 0.123, 0.080, LOW, LOW, LOW, LOW] },
        { n: 'Nevus', cls: 'lb-bar--b', v: [LOW, LOW, LOW, LOW, 0.116, 0.101, 0.097, 0.075] }
      ],
      max: 0.25, maxLabel: '0.25', rotate: true,
      prompt: 'Hover a bar for its mean attribution',
      fmt: function (v) { return v <= LOW ? '≤ 0.001' : v.toFixed(3); }
    });
  }

  /* ── build visuals, start each when it scrolls into view ── */
  var builders = { 'concept-space': conceptSpace, 'interpretation-map': interpretationMap, taxonomy: taxonomy, 'pool-auc': poolAuc, 'derm-attr': dermAttr };
  var hosts = document.querySelectorAll('[data-visual]');
  var seen = 'IntersectionObserver' in window && !reduceMotion
    ? new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('in');
          seen.unobserve(entry.target);
        });
      }, { threshold: 0.3 })
    : null;
  hosts.forEach(function (host) {
    var build = builders[host.getAttribute('data-visual')];
    if (!build) return;
    build(host);
    if (seen) seen.observe(host); else host.classList.add('in');
  });

  /* ── count-up numbers: <div class="stat-num" data-count="48"> ── */
  var counters = document.querySelectorAll('.stat-num[data-count]');
  function format(el, v) {
    var dec = +(el.getAttribute('data-decimals') || 0);
    return (el.getAttribute('data-prefix') || '') +
      v.toLocaleString('en-US', { minimumFractionDigits: dec, maximumFractionDigits: dec }) +
      (el.getAttribute('data-suffix') || '');
  }
  function run(el) {
    var node = el.firstChild;
    var target = +el.getAttribute('data-count');
    var start = null, dur = 900;
    function frame(now) {
      if (start === null) start = now;
      var t = Math.min(1, (now - start) / dur);
      node.nodeValue = format(el, target * (1 - Math.pow(1 - t, 3)));
      if (t < 1) window.requestAnimationFrame(frame);
    }
    window.requestAnimationFrame(frame);
  }
  if (counters.length && !reduceMotion && 'IntersectionObserver' in window) {
    var counterObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        counterObs.unobserve(entry.target);
        run(entry.target);
      });
    }, { threshold: 0.6 });
    counters.forEach(function (el) {
      if (el.firstChild && el.firstChild.nodeType === 3) {
        el.firstChild.nodeValue = format(el, 0);
        counterObs.observe(el);
      }
    });
  }
})();
