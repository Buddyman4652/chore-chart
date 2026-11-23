/* D-pad / remote support: the arrow keys move between buttons, Enter presses the one in focus,
   and Up/Down scroll long panels (rewards, parent portal). Does nothing for touch use. */
(function () {
  'use strict';
  var OVERLAYS = ['celebrate', 'recov', 'setup', 'pin', 'chat', 'editor', 'sheet', 'parent'];
  var SEL = 'button,a[href],select,input:not([type=hidden]):not([type=file]),textarea,[tabindex]:not([tabindex="-1"])';
  var lastSig = '', lastRect = null, active = false;

  var st = document.createElement('style');
  st.textContent = 'body.dpad :focus{outline:5px solid #FFB300!important;outline-offset:4px!important;box-shadow:0 0 0 10px rgba(255,179,0,.35)!important;position:relative;z-index:1}';
  document.head.appendChild(st);

  function $(id) { return document.getElementById(id); }
  function shown(el) { return el && !el.hidden; }
  function visible(el) {
    if (!el.getClientRects().length) { return false; }
    var cs = getComputedStyle(el);
    return cs.visibility !== 'hidden' && cs.display !== 'none' && !el.closest('[aria-hidden="true"]');
  }
  function scopeEl() {
    var best = null, bz = -1, i, el, z;
    for (i = 0; i < OVERLAYS.length; i++) {
      el = $(OVERLAYS[i]);
      if (shown(el)) { z = parseInt(getComputedStyle(el).zIndex, 10) || 0; if (z >= bz) { bz = z; best = el; } }
    }
    return best || $('app') || document.body;
  }
  function cands(scope) {
    return [].slice.call(scope.querySelectorAll(SEL)).filter(function (el) {
      return !el.disabled && visible(el) && !(el.type === 'checkbox' && el.classList.contains('photoin'));
    });
  }
  function sig(el) {
    var s = el.tagName, k;
    for (k in el.dataset) { s += '|' + k + '=' + el.dataset[k]; }
    if (!Object.keys(el.dataset).length) { s += '|' + (el.id || '') + '|' + (el.textContent || '').trim().slice(0, 30); }
    return s;
  }
  function typing(t) {
    if (!t || !t.tagName) { return false; }
    if (t.tagName === 'TEXTAREA' || t.tagName === 'SELECT') { return true; }
    if (t.tagName === 'INPUT') { return !/^(button|checkbox|radio|submit|reset|range)$/.test(t.type); }
    return false;
  }
  function scroller(el, scope) {
    var n = el;
    while (n && n !== document.body && n !== document.documentElement) {
      var cs = getComputedStyle(n);
      if (/(auto|scroll)/.test(cs.overflowY) && n.scrollHeight > n.clientHeight + 2) { return n; }
      n = n.parentElement;
    }
    if (scope && scope.scrollHeight > scope.clientHeight + 2 && /(auto|scroll)/.test(getComputedStyle(scope).overflowY)) { return scope; }
    return document.scrollingElement || document.documentElement;
  }
  function focusEl(el, scroll) {
    try { el.focus({ preventScroll: true }); } catch (e) { el.focus(); }
    if (scroll !== false) { try { el.scrollIntoView({ block: 'nearest', inline: 'nearest' }); } catch (e) {} }
    lastSig = sig(el); lastRect = el.getBoundingClientRect();
  }
  function pick(cur, list, dir) {
    var r = cur.getBoundingClientRect(), best = null, bs = 1e12, i, c, cr, p, o, ov;
    var cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    for (i = 0; i < list.length; i++) {
      c = list[i]; if (c === cur) { continue; }
      cr = c.getBoundingClientRect();
      var dx = cr.left + cr.width / 2 - cx, dy = cr.top + cr.height / 2 - cy;
      if (dir === 'ArrowDown') { if (!(dy > 4 && cr.top >= r.top + 2)) { continue; } p = dy; ov = !(cr.right <= r.left || cr.left >= r.right); o = ov ? 0 : Math.abs(dx); }
      else if (dir === 'ArrowUp') { if (!(dy < -4 && cr.bottom <= r.bottom - 2)) { continue; } p = -dy; ov = !(cr.right <= r.left || cr.left >= r.right); o = ov ? 0 : Math.abs(dx); }
      else if (dir === 'ArrowRight') { if (!(dx > 4 && cr.left >= r.left + 2)) { continue; } p = dx; ov = !(cr.bottom <= r.top || cr.top >= r.bottom); o = ov ? 0 : Math.abs(dy); }
      else { if (!(dx < -4 && cr.right <= r.right - 2)) { continue; } p = -dx; ov = !(cr.bottom <= r.top || cr.top >= r.bottom); o = ov ? 0 : Math.abs(dy); }
      var s = p + 2.5 * o;
      if (s < bs) { bs = s; best = c; }
    }
    return best;
  }
  function firstIn(list) {
    var best = null, bt = 1e12, i, r;
    for (i = 0; i < list.length; i++) {
      r = list[i].getBoundingClientRect();
      if (r.bottom < 0 || r.top > innerHeight) { continue; }
      var s = Math.round(r.top / 20) * 10000 + r.left;
      if (s < bt) { bt = s; best = list[i]; }
    }
    return best || list[0] || null;
  }

  document.addEventListener('keydown', function (e) {
    var k = e.key;
    if (e.defaultPrevented || e.ctrlKey || e.altKey || e.metaKey) { return; }
    if (shown($('arcade'))) { return; }
    if (k === 'Backspace' && !typing(e.target)) {
      e.preventDefault();
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }));
      return;
    }
    if (k !== 'ArrowUp' && k !== 'ArrowDown' && k !== 'ArrowLeft' && k !== 'ArrowRight') { return; }
    // text boxes keep Left/Right for the cursor but let Up/Down move away; dates, number boxes, menus and notes keep all arrows
    var tg = e.target, vert = (k === 'ArrowUp' || k === 'ArrowDown');
    if (tg && tg.tagName && (tg.tagName === 'TEXTAREA' || tg.tagName === 'SELECT' || (tg.tagName === 'INPUT' && /^(date|time|number|range|datetime-local|month|week)$/.test(tg.type)))) { return; }
    if (typing(tg) && !vert) { return; }
    active = true; document.body.classList.add('dpad');
    var scope = scopeEl(), list = cands(scope);
    var cur = document.activeElement;
    if (!cur || cur === document.body || !scope.contains(cur) || list.indexOf(cur) < 0) { cur = null; }
    e.preventDefault();
    if (!cur) {
      var f = firstIn(list);
      if (f) { focusEl(f); }
      else if (k === 'ArrowDown' || k === 'ArrowUp') { var s0 = scroller(scope, scope); s0.scrollBy({ top: (k === 'ArrowDown' ? 1 : -1) * Math.round(innerHeight * 0.6), behavior: 'smooth' }); }
      return;
    }
    var nxt = pick(cur, list, k);
    if (nxt) {
      // if the next button is off screen, scroll toward it a page at a time so everything in between gets seen
      if (vert) {
        var sc0 = scroller(cur, scope), dir0 = k === 'ArrowDown' ? 1 : -1, nr = nxt.getBoundingClientRect();
        var sr = sc0 === document.scrollingElement || sc0 === document.documentElement ? { top: 0, bottom: innerHeight } : sc0.getBoundingClientRect();
        var vt = Math.max(0, sr.top), vb = Math.min(innerHeight, sr.bottom);
        var off = dir0 > 0 ? nr.top > vb - 24 : nr.bottom < vt + 24;
        var can0 = dir0 > 0 ? sc0.scrollTop + sc0.clientHeight < sc0.scrollHeight - 2 : sc0.scrollTop > 2;
        if (off && can0) { sc0.scrollBy({ top: dir0 * Math.round((vb - vt) * 0.7), behavior: 'smooth' }); return; }
      }
      focusEl(nxt);
      return;
    }
    if (k === 'ArrowDown' || k === 'ArrowUp') {
      var sc = scroller(cur, scope), dir = k === 'ArrowDown' ? 1 : -1;
      var can = dir > 0 ? sc.scrollTop + sc.clientHeight < sc.scrollHeight - 2 : sc.scrollTop > 2;
      if (can) { sc.scrollBy({ top: dir * Math.round(innerHeight * 0.6), behavior: 'smooth' }); }
    }
  }, true);

  // when the page redraws after a button press, put the highlight back on the same button
  var pend = false;
  new MutationObserver(function () {
    if (!active || pend) { return; }
    pend = true;
    requestAnimationFrame(function () {
      pend = false;
      var a = document.activeElement;
      if (a && a !== document.body && document.contains(a)) { lastSig = sig(a); lastRect = a.getBoundingClientRect(); return; }
      if (!lastSig) { return; }
      var scope = scopeEl(), list = cands(scope), i, hit = null;
      for (i = 0; i < list.length; i++) { if (sig(list[i]) === lastSig) { hit = list[i]; break; } }
      if (!hit && lastRect && list.length) {
        var bd = 1e12, cx = lastRect.left + lastRect.width / 2, cy = lastRect.top + lastRect.height / 2;
        list.forEach(function (c) { var r = c.getBoundingClientRect(), d = Math.abs(r.left + r.width / 2 - cx) + Math.abs(r.top + r.height / 2 - cy); if (d < bd) { bd = d; hit = c; } });
      }
      if (hit) { focusEl(hit, false); }
    });
  }).observe(document.body, { childList: true, subtree: true });

  ['pointerdown', 'touchstart'].forEach(function (ev) {
    document.addEventListener(ev, function () { active = false; document.body.classList.remove('dpad'); }, true);
  });
  document.addEventListener('focusin', function (e) { if (e.target && e.target.tagName) { lastSig = sig(e.target); lastRect = e.target.getBoundingClientRect(); } });

  // The remote's Back key is "browser back". In the desktop Edge window, treat it like Esc instead of leaving the chart.
  try {
    if (/Edg\//.test(navigator.userAgent) && !navigator.maxTouchPoints && history.pushState) {
      history.replaceState({ cc: 0 }, '');
      history.pushState({ cc: 1 }, '');
      window.addEventListener('popstate', function () {
        try { history.pushState({ cc: 1 }, ''); } catch (e) {}
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }));
      });
    }
  } catch (e) {}
})();
