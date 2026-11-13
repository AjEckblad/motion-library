// Search: a palette over the page, opened by the Search button in the top bar, ⌘K / Ctrl+K, or "/" anywhere outside a
// text field. Type to filter every effect by its title (in the chosen language and in English), its id, its category,
// its one-line trick and its notes; every word typed has to match somewhere. Titles that start with the query rank
// first, then titles with a word that starts with it, then titles that contain it, then the rest. ↑ ↓ move, ↵ opens,
// Esc closes. With nothing typed it lists the newest effects.
// Opened from the keyboard it appears at once (a shortcut you use many times a day should not animate); opened with
// the pointer it fades and settles in 150 ms. Keyboard focus stays in the field; the list follows aria-activedescendant.
import { ANIMS, catById, CATEGORIES } from '../anims/registry.js';
import { t, tr, catName } from './i18n.js';

const fold = s => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const KIND = { dom: 'DOM', canvas: 'Canvas', webgl: 'WebGL' };
const isMac = /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);

export function createSearch({ onOpen, newIds = [] }) {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const order = CATEGORIES.flatMap(c => ANIMS.filter(a => a.cat === c.id));      // the order of the full list
  const rank = new Map(order.map((a, i) => [a.id, i]));
  const idx = order.map(a => {
    const title = fold(tr(a, 'title')), en = fold(a.title);
    return { a, title, en, id: a.id.replace(/-/g, ' '), cat: fold(catName(catById[a.cat]) + ' ' + catById[a.cat].name),
      body: fold(tr(a, 'trick') + ' ' + (tr(a, 'notes') || []).join(' ') + ' ' + KIND[a.kind]) };
  });

  const root = document.createElement('div');
  root.className = 'pal'; root.hidden = true;
  root.innerHTML = `<div class="pal-scrim"></div>
    <div class="pal-box" role="dialog" aria-modal="true" aria-label="${t('Search')}">
      <div class="pal-field">
        <svg viewBox="0 0 20 20" aria-hidden="true"><circle cx="8.8" cy="8.8" r="5.6"/><path d="M13 13l4 4"/></svg>
        <input class="pal-input" type="text" role="combobox" aria-expanded="true" aria-controls="pal-list" aria-autocomplete="list" autocomplete="off" autocapitalize="off" spellcheck="false">
        <button class="pal-esc" type="button" aria-label="${t('Close')}">esc</button>
      </div>
      <div class="pal-sub" aria-hidden="true"></div>
      <ul class="pal-list" id="pal-list" role="listbox" aria-label="${t('Effects')}"></ul>
      <p class="pal-empty" hidden></p>
      <div class="pal-foot" aria-hidden="true"><span><kbd>↑</kbd><kbd>↓</kbd> ${t('to move')}</span><span><kbd>↵</kbd> ${t('to open')}</span><span><kbd>esc</kbd> ${t('to close')}</span></div>
    </div>`;
  document.body.append(root);
  const box = root.querySelector('.pal-box'), input = root.querySelector('.pal-input'), list = root.querySelector('.pal-list');
  const sub = root.querySelector('.pal-sub'), empty = root.querySelector('.pal-empty');
  input.placeholder = t('Search {n} effects').replace('{n}', ANIMS.length);
  input.setAttribute('aria-label', t('Search'));

  let results = [], active = 0, lastFocus = null, anim = null, overflow = '';

  function score(e, words) {
    let s = 0;
    for (const w of words) {
      let best = 0;
      for (const ttl of [e.title, e.en]) {
        if (ttl.startsWith(w)) best = Math.max(best, 100);
        else if ((' ' + ttl).includes(' ' + w)) best = Math.max(best, 60);
        else if (ttl.includes(w)) best = Math.max(best, 40);
      }
      if (!best && e.id.includes(w)) best = 30;
      if (!best && e.cat.includes(w)) best = 20;
      if (!best && e.body.includes(w)) best = 8;
      if (!best) return 0;                                          // every word has to match somewhere
      s += best;
    }
    return s;
  }

  // the query's words, marked inside the title (on the original text, so accents and case survive)
  function marked(text, words) {
    const f = fold(text), hits = [];
    for (const w of words) { let i = f.indexOf(w); while (w && i >= 0) { hits.push([i, i + w.length]); i = f.indexOf(w, i + w.length); } }
    if (!hits.length || f.length !== text.length) return esc(text);   // folding changed the length (rare): no marks
    hits.sort((p, q) => p[0] - q[0]);
    let out = '', at = 0;
    for (const [s, e] of hits) { if (s < at) continue; out += esc(text.slice(at, s)) + '<mark>' + esc(text.slice(s, e)) + '</mark>'; at = e; }
    return out + esc(text.slice(at));
  }
  const esc = s => s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  function update() {
    const q = fold(input.value).trim(), words = q.split(/\s+/).filter(Boolean);
    if (!words.length) {
      results = newIds.map(id => idx.find(e => e.a.id === id)).filter(Boolean).slice(0, 8).map(e => e.a);
      sub.textContent = results.length ? t('Recently added') : '';
    } else {
      results = idx.map(e => [e, score(e, words)]).filter(r => r[1] > 0)
        .sort((p, q2) => q2[1] - p[1] || rank.get(p[0].a.id) - rank.get(q2[0].a.id)).slice(0, 60).map(r => r[0].a);
      sub.textContent = '';
    }
    sub.hidden = !sub.textContent;
    list.replaceChildren(...results.map((a, i) => {
      const li = document.createElement('li'), cat = catById[a.cat];
      li.id = `pal-opt-${a.id}`; li.setAttribute('role', 'option'); li.dataset.i = i;
      li.style.setProperty('--hue', cat.hue);
      li.innerHTML = `<img alt="" loading="lazy" decoding="async" src="posters/${a.id}.webp${a.pv ? '?v=' + a.pv : ''}">
        <span class="pal-txt"><span class="pal-title">${marked(tr(a, 'title'), words)}</span><span class="pal-trick"></span></span>
        <span class="pal-cat"><i class="cat-dot" aria-hidden="true"></i><span></span></span>`;
      li.querySelector('.pal-trick').textContent = tr(a, 'trick');
      li.querySelector('.pal-cat span').textContent = catName(cat);
      return li;
    }));
    empty.hidden = results.length > 0 || !words.length;
    if (!empty.hidden) { const q0 = [...input.value.trim()]; empty.textContent = t('No effects match “{q}”').replace('{q}', q0.length > 40 ? q0.slice(0, 40).join('') + '…' : q0.join('')); }
    setActive(0, false);
  }

  function setActive(i, scroll = true) {
    const items = list.children;
    if (!items.length) { input.removeAttribute('aria-activedescendant'); return; }
    active = (i + items.length) % items.length;
    for (const li of items) li.setAttribute('aria-selected', String(+li.dataset.i === active));
    const el = items[active];
    input.setAttribute('aria-activedescendant', el.id);
    if (scroll) el.scrollIntoView({ block: 'nearest' });
  }

  function choose(i) { const a = results[i]; if (!a) return; close(false); onOpen(a.id); }

  function open(animate = false) {
    if (!root.hidden) { input.select(); return; }
    lastFocus = document.activeElement;
    anim?.cancel(); anim = null;
    root.hidden = false;
    overflow = document.documentElement.style.overflow; document.documentElement.style.overflow = 'hidden';
    input.value = ''; update();
    input.focus({ preventScroll: true });
    if (animate && !reduce.matches) {
      root.querySelector('.pal-scrim').animate([{ opacity: 0 }, { opacity: 1 }], { duration: 150, easing: 'cubic-bezier(0.23, 1, 0.32, 1)' });
      box.animate([{ opacity: 0, transform: 'translateY(-6px) scale(.985)' }, { opacity: 1, transform: 'none' }], { duration: 150, easing: 'cubic-bezier(0.23, 1, 0.32, 1)' });
    }
  }
  function close(refocus = true) {
    if (root.hidden) return;
    root.hidden = true;
    document.documentElement.style.overflow = overflow;
    if (refocus) lastFocus?.focus?.({ preventScroll: true });
  }

  input.addEventListener('input', update);
  input.addEventListener('keydown', e => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive(active + 1); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive(active - 1); }
    else if (e.key === 'Enter') { e.preventDefault(); if (!e.isComposing) choose(active); }
    else if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); if (input.value) { input.value = ''; update(); } else close(); }
    else if (e.key === 'Tab') e.preventDefault();                    // focus stays in the field
  });
  list.addEventListener('pointermove', e => { const li = e.target.closest('li'); if (li && +li.dataset.i !== active) setActive(+li.dataset.i, false); });
  list.addEventListener('click', e => { const li = e.target.closest('li'); if (li) choose(+li.dataset.i); });
  root.querySelector('.pal-scrim').addEventListener('click', () => close());
  root.querySelector('.pal-esc').addEventListener('click', () => close());

  // ⌘K / Ctrl+K toggles from anywhere; "/" opens unless you are typing somewhere
  addEventListener('keydown', e => {
    const typing = e.target.closest?.('input, textarea, select, [contenteditable="true"]');
    if ((e.metaKey || e.ctrlKey) && !e.altKey && !e.shiftKey && e.key.toLowerCase() === 'k') { e.preventDefault(); root.hidden ? open(false) : close(); }
    else if (e.key === '/' && !typing && !e.metaKey && !e.ctrlKey && !e.altKey && root.hidden) { e.preventDefault(); open(false); }
  });

  return { open, close, get isOpen() { return !root.hidden; }, shortcut: isMac ? '⌘K' : 'Ctrl K' };
}
