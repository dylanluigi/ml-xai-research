/* Figures: click-to-enlarge dialog and tab groups. */
(function () {
  'use strict';

  /* ── enlarge dialog ── */
  var dialog = null, body = null, caption = null, lastTrigger = null;

  function build() {
    dialog = document.createElement('dialog');
    dialog.className = 'lightbox';
    dialog.setAttribute('aria-label', 'Enlarged figure');
    var bar = document.createElement('div');
    bar.className = 'lightbox-bar';
    var hint = document.createElement('span');
    hint.className = 'lightbox-hint';
    hint.textContent = 'Click image for actual size · Esc to close';
    var close = document.createElement('button');
    close.type = 'button';
    close.className = 'btn btn-secondary';
    close.textContent = 'Close';
    close.addEventListener('click', function () { dialog.close(); });
    bar.appendChild(hint);
    bar.appendChild(close);
    body = document.createElement('div');
    body.className = 'lightbox-body';
    caption = document.createElement('p');
    caption.className = 'lightbox-caption';
    dialog.appendChild(bar);
    dialog.appendChild(body);
    dialog.appendChild(caption);
    dialog.addEventListener('click', function (e) { if (e.target === dialog) dialog.close(); });
    dialog.addEventListener('close', function () {
      body.textContent = '';
      if (lastTrigger && document.contains(lastTrigger)) lastTrigger.focus();
    });
    document.body.appendChild(dialog);
  }

  function open(trigger) {
    if (typeof HTMLDialogElement === 'undefined') return;
    if (!dialog) build();
    var thumb = trigger.querySelector('img');
    var fig = trigger.closest('figure');
    var cap = fig ? fig.querySelector('figcaption') : null;
    var img = document.createElement('img');
    img.src = thumb.currentSrc || thumb.src;
    img.alt = thumb.alt;
    img.addEventListener('click', function () { img.classList.toggle('is-actual'); });
    body.textContent = '';
    body.appendChild(img);
    caption.textContent = cap ? cap.textContent : thumb.alt;
    lastTrigger = trigger;
    dialog.showModal();
    body.scrollTop = 0;
  }

  document.addEventListener('click', function (e) {
    var trigger = e.target.closest('.fig-frame');
    if (trigger) open(trigger);
  });

  /* ── tabs ── */
  document.querySelectorAll('[data-tabs]').forEach(function (group) {
    var tabs = Array.prototype.slice.call(group.querySelectorAll('[role="tab"]'));
    function select(tab, focus) {
      tabs.forEach(function (t) {
        var on = t === tab;
        t.setAttribute('aria-selected', on ? 'true' : 'false');
        t.tabIndex = on ? 0 : -1;
        document.getElementById(t.getAttribute('aria-controls')).hidden = !on;
      });
      if (focus) tab.focus();
    }
    tabs.forEach(function (tab, i) {
      tab.addEventListener('click', function () { select(tab, false); });
      tab.addEventListener('keydown', function (e) {
        var next = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: tabs.length - 1 }[e.key];
        if (next === undefined) return;
        e.preventDefault();
        select(tabs[(next + tabs.length) % tabs.length], true);
      });
    });
  });
})();
