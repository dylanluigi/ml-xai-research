/* Shared behaviour: scroll reveal, bottom progress dots, KaTeX auto-render. */
(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ── scroll reveal ── */
  function initReveal() {
    var items = document.querySelectorAll('.reveal');
    if (!('IntersectionObserver' in window)) {
      items.forEach(function (el) { el.classList.add('visible'); });
      return;
    }
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -32px 0px' });
    items.forEach(function (el) { observer.observe(el); });
  }

  /* ── progress dots: filled = visited, hollow = not yet reached ── */
  function initProgress() {
    var host = document.getElementById('progressLine');
    var sections = document.querySelectorAll('main section[data-od-id]');
    if (!host || !sections.length) return;

    var wrap = document.createElement('div');
    wrap.className = 'progress-track-wrap';
    var track = document.createElement('div');
    track.className = 'progress-track';
    var fill = document.createElement('div');
    fill.className = 'progress-fill';
    var nodesWrap = document.createElement('div');
    nodesWrap.className = 'progress-nodes';
    track.appendChild(fill);
    wrap.appendChild(track);
    wrap.appendChild(nodesWrap);
    host.appendChild(wrap);

    var nodes = [];
    sections.forEach(function (section, i) {
      var label = section.getAttribute('data-progress-label') || 'Section ' + (i + 1);
      var level = section.getAttribute('data-progress-level') === 'section' ? 'section' : 'sub';
      var node = document.createElement('button');
      node.type = 'button';
      node.className = 'progress-node progress-node--' + level;
      node.setAttribute('aria-label', 'Go to ' + label);
      var tip = document.createElement('span');
      tip.className = 'progress-tooltip';
      tip.setAttribute('aria-hidden', 'true');
      tip.textContent = label;
      node.appendChild(tip);
      node.addEventListener('click', function () {
        section.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
      });
      nodesWrap.appendChild(node);
      nodes.push(node);
    });

    var tops = [];
    var positions = [];

    function measure() {
      tops = Array.prototype.map.call(sections, function (s) {
        return s.getBoundingClientRect().top + window.scrollY;
      });
      var span = tops[tops.length - 1] - tops[0];
      positions = tops.map(function (t) { return span > 0 ? (t - tops[0]) / span : 0; });
      nodes.forEach(function (node, i) { node.style.left = (positions[i] * 100) + '%'; });
      update();
    }

    function update() {
      if (!tops.length) return;
      var y = window.scrollY + window.innerHeight * 0.4;
      var last = -1;
      tops.forEach(function (t, i) { if (t <= y) last = i; });
      nodes.forEach(function (node, i) {
        node.classList.toggle('is-visited', i <= last);
        if (i === last) node.setAttribute('aria-current', 'location');
        else node.removeAttribute('aria-current');
      });
      var frac = 0;
      if (last >= 0 && last < tops.length - 1) {
        var seg = (y - tops[last]) / (tops[last + 1] - tops[last]);
        frac = positions[last] + seg * (positions[last + 1] - positions[last]);
      } else if (last === tops.length - 1) {
        frac = 1;
      }
      fill.style.transform = 'scaleX(' + Math.max(0, Math.min(1, frac)) + ')';
    }

    var ticking = false;
    window.addEventListener('scroll', function () {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(function () { ticking = false; update(); });
    }, { passive: true });
    window.addEventListener('resize', measure);
    window.addEventListener('load', measure);
    if ('ResizeObserver' in window) new ResizeObserver(measure).observe(document.body);
    measure();
  }

  /* ── equations (pages that load KaTeX) ── */
  function initMath() {
    if (typeof window.renderMathInElement !== 'function') return;
    window.renderMathInElement(document.body, {
      delimiters: [
        { left: '$$', right: '$$', display: true },
        { left: '$', right: '$', display: false }
      ],
      throwOnError: false
    });
  }

  initMath();
  initReveal();
  initProgress();
})();
