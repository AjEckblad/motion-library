// The detail view: the card grows into a large live stage, with playback controls, tweak sliders,
// the notes, and the code (highlighted, with Copy and Download).
import { catById, srcOf } from '../anims/registry.js';
import { source, readParams, writeParams, paramsLineIndex, formatValue, standalone, download, encodeParams, parseParams, promptFor } from './code.js';
import { highlightLines } from './highlight.js';
import { heartIcon, onHeartPress } from './hearts.js';
import { store } from './store.js';
import { createPlaybar } from './playback.js';
import { Creature, PALETTES } from './creatures.js';
import { t, tr, tl, catName } from './i18n.js';

const reduce = matchMedia('(prefers-reduced-motion: reduce)');
const drawer = 'cubic-bezier(0.32, 0.72, 0, 1)';
const easeOut = 'cubic-bezier(0.23, 1, 0.32, 1)';   // the --ease-out token; the built-in ease-out is too weak

export function createDetail({ celebrate, toast, onClose }) {
  const root = document.getElementById('detail');
  let cur = null, card = null, iframe = null, src = '', code = '', defaults = {}, values = {}, shared = {}, runT = 0, creature = null, playbar = null, busy = false, lastFocus = null, closeAnim = null;

  function teardown() {
    clearTimeout(runT); playbar?.destroy(); creature?.destroy(); iframe = null; playbar = null; creature = null;
    root.replaceChildren();
  }

  function build(a) {
    const cat = catById[a.cat];
    const hint = a.pointer ? t('Interactive: move or press inside') : a.scroll ? t('Scroll inside the stage') : '';
    root.innerHTML = `
      <div class="d-top">
        <button class="icon-btn d-close" type="button" aria-label="${t('Close')}"><svg viewBox="0 0 20 20" aria-hidden="true"><path d="M12.5 4.5L7 10l5.5 5.5"/></svg></button>
        <div class="d-crumb"><span class="cat"><i class="cat-dot" style="--hue:${cat.hue}"></i></span><span class="sep" aria-hidden="true">/</span><h1 id="d-title"></h1></div>
        <div class="d-actions">
          <button class="btn d-share" type="button"><svg viewBox="0 0 20 20" aria-hidden="true"><path class="stroke" d="M8.6 11.4a3 3 0 004.3 0l2.6-2.6a3 3 0 00-4.3-4.3l-1 1"/><path class="stroke" d="M11.4 8.6a3 3 0 00-4.3 0l-2.6 2.6a3 3 0 004.3 4.3l1-1"/></svg><span class="lbl">${t('Share')}</span></button>
          <button class="btn d-embed" type="button"><svg viewBox="0 0 20 20" aria-hidden="true"><path class="stroke" d="M7 6l-4 4 4 4M13 6l4 4-4 4"/></svg><span class="lbl">${t('Embed')}</span></button>
          <button class="heart" type="button">${heartIcon()}</button>
        </div>
      </div>
      <div class="d-body">
        <div class="d-left">
          <div class="d-stage"><img alt="">${a.pointer ? '' : `<button class="d-start" type="button" aria-label="${t('Play')}"><svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4.5 2.8v10.4a.6.6 0 00.9.5l8.2-5.2a.6.6 0 000-1L5.4 2.3a.6.6 0 00-.9.5z"/></svg></button>`}</div>
          <div class="pb-slot"></div>
          <div class="tweak" role="group" aria-label="${t('Tweak the numbers')}"><div class="tweak-head"><h2>${t('Tweak')}</h2><button class="link-btn d-reset" type="button" disabled>${t('Reset')}</button></div></div>
        </div>
        <div class="d-right">
          <div class="notes"><h2>${t('How it works')}</h2><canvas class="creature creature-detail" aria-hidden="true"></canvas></div>
          <div class="npx"><h2>${t('Install')}</h2><code class="npx-cmd"></code>
            <button class="pb-btn d-npx" type="button"><svg viewBox="0 0 16 16" aria-hidden="true"><rect class="stroke" x="5" y="5" width="8.5" height="8.5" rx="1.6"/><path class="stroke" d="M3 10.5V3.6A1.1 1.1 0 014.1 2.5H11"/></svg><span>${t('Copy')}</span></button></div>
          <div class="code-head"><h2>${t('Code')}</h2><span class="file"></span><span class="sp"></span>
            <button class="pb-btn d-copy" type="button"><svg viewBox="0 0 16 16" aria-hidden="true"><rect class="stroke" x="5" y="5" width="8.5" height="8.5" rx="1.6"/><path class="stroke" d="M3 10.5V3.6A1.1 1.1 0 014.1 2.5H11"/></svg><span>${t('Copy')}</span></button>
            <button class="pb-btn d-prompt" type="button" title="Copy as a prompt for an AI coding assistant: the notes, the settings and the code"><svg viewBox="0 0 16 16" aria-hidden="true"><path class="stroke" d="M2.5 4.2c0-.9.7-1.7 1.7-1.7h7.6c.9 0 1.7.8 1.7 1.7v5.1c0 .9-.8 1.7-1.7 1.7H7.2L4.4 13.4v-2.4h-.2c-1 0-1.7-.8-1.7-1.7z"/></svg><span>${t('Prompt')}</span></button>
            <button class="pb-btn d-dl" type="button"><svg viewBox="0 0 16 16" aria-hidden="true"><path class="stroke" d="M8 2.5v7.5M5 7.2l3 3 3-3M3 13h10"/></svg><span>${t('Download .html')}</span></button>
          </div>
          <pre class="code" tabindex="0" aria-label="Source code"><code></code></pre>
        </div>
      </div>`;
    root.querySelector('.cat').append(catName(cat));
    root.querySelector('#d-title').textContent = tr(a, 'title');
    root.querySelector('.file').textContent = srcOf(a);
    root.querySelector('.d-stage img').src = `posters/${a.id}.webp`;
    const notes = root.querySelector('.notes');
    tr(a, 'notes').forEach(n => { const p = document.createElement('p'); p.textContent = n; notes.append(p); });
    root.querySelector('.d-close').addEventListener('click', requestClose);
    const heart = root.querySelector('.d-actions .heart');
    heart.setAttribute('aria-label', `♥ ${tr(a, 'title')}`);
    heart.addEventListener('click', () => onHeartPress(heart, a.id, celebrate));
    root.querySelector('.d-copy').addEventListener('click', copy);
    root.querySelector('.d-npx').addEventListener('click', () => copyText(npxCommand(), root.querySelector('.d-npx span'), t('Command copied: run it in your project folder')));
    root.querySelector('.npx-cmd').textContent = `npx motion-library add ${a.id}`;
    root.querySelector('.d-prompt').addEventListener('click', () => copyText(promptFor(a, code, cat.name), root.querySelector('.d-prompt span'), t('Prompt copied: paste it into Claude or Cursor')));
    root.querySelector('.d-share').addEventListener('click', () => copyText(shareUrl(), root.querySelector('.d-share .lbl'), t('Link copied')));
    root.querySelector('.d-embed').addEventListener('click', () => copyText(embedSnippet(), root.querySelector('.d-embed .lbl'), t('Embed code copied')));
    root.querySelector('.d-dl').addEventListener('click', () => { download(`${a.id}.html`, standalone(code, a.title)); toast(`Downloaded ${a.id}.html`); });
    root.querySelector('.d-reset').addEventListener('click', () => { values = { ...defaults }; syncKnobs(); update(); });
    // opens stopped on the first frame, with a big play button that goes away for good on the first play.
    // Pieces that answer the pointer run from the start instead: you play them by moving over them.
    const start = root.querySelector('.d-start');
    const dropStart = () => { if (!start?.isConnected || start.classList.contains('gone')) return; start.classList.add('gone'); setTimeout(() => start.remove(), 220); };
    playbar = createPlaybar(() => iframe ? [iframe] : [], { startPaused: !a.pointer, onState: p => { if (!p) dropStart(); } });
    start?.addEventListener('click', () => playbar?.play());
    root.querySelector('.pb-slot').replaceWith(playbar.el);
    // the hint sits in the control row, not on the stage: on light demos white text over the animation can't be read,
    // and here it never covers the effect
    if (hint) { const h = document.createElement('span'); h.className = 'pb-hint'; h.innerHTML = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4 2.5l8.2 5.2-3.6.9 2.1 3.9-1.6.9-2.1-3.9L4.4 12z"/></svg>'; h.append(hint); const clock = playbar.el.querySelector('.clock'), end = document.createElement('span'); end.className = 'pb-end'; clock.replaceWith(end); end.append(h, clock); }   // hint and clock wrap as one
    creature = new Creature(root.querySelector('.creature-detail'), { size: 70, palette: PALETTES.mint, seed: 31, accent: '#ff8fab' });
    syncHeart();
  }

  function mountStage() {
    if (!cur) return;
    const box = root.querySelector('.d-stage');
    iframe = document.createElement('iframe');
    const q = query(values) || query(shared);
    iframe.src = `stage.html?src=${srcOf(cur)}&mode=detail${cur.pointer ? '' : '&paused=1'}${q ? '&p=' + encodeURIComponent(q) : ''}`;
    iframe.title = `Live animation: ${cur.title}`;
    box.prepend(iframe);
  }
  addEventListener('message', e => {
    if (!iframe || e.source !== iframe.contentWindow) return;
    if (e.data?.type === 'stage-ready' || e.data?.type === 'stage-ran') {
      // the poster is only a placeholder while loading: once the live stage has faded in over it, drop it
      if (!iframe.classList.contains('live')) { iframe.classList.add('live'); const img = root.querySelector('.d-stage img'); setTimeout(() => img?.remove(), 260); }
      playbar?.ready(iframe);
    }
  });

  async function loadCode(a) {
    src = await source(a);
    if (cur !== a) return;
    defaults = readParams(src); values = { ...defaults, ...shared }; code = Object.keys(shared).length ? writeParams(src, values, a.params) : src;
    const tw = root.querySelector('.tweak');
    for (const [k, r] of Object.entries(a.params)) {
      if (!(k in defaults)) continue;
      const id = `k-${a.id}-${k}`;
      const knob = document.createElement('div'); knob.className = 'knob';
      knob.innerHTML = `<label for="${id}"></label><output for="${id}"></output><input id="${id}" type="range" min="${r.min}" max="${r.max}" step="${r.step}">`;
      knob.querySelector('label').textContent = tl(r.label);
      const input = knob.querySelector('input');
      input.value = defaults[k]; input.dataset.k = k;
      input.addEventListener('input', () => { values[k] = +input.value; knob.querySelector('output').textContent = formatValue(values[k], r.step); update(); });
      tw.append(knob);
    }
    syncKnobs(); renderCode();
  }
  function syncKnobs() {
    root.querySelectorAll('.knob input').forEach(i => { const k = i.dataset.k; i.value = values[k]; i.parentElement.querySelector('output').textContent = formatValue(values[k], cur.params[k].step); });
  }
  const changedKeys = () => new Set(Object.keys(values).filter(k => cur.params[k] && formatValue(values[k], cur.params[k].step) !== formatValue(defaults[k], cur.params[k].step)));
  function renderCode() {
    const hot = changedKeys(), pl = paramsLineIndex(code);
    root.querySelector('.code code').innerHTML = highlightLines(code, hot, pl).map((l, i) => `<span class="ln${i === pl && hot.size ? ' changed' : ''}">${l || ' '}</span>`).join('');
    root.querySelector('.d-reset').disabled = !hot.size;
    root.querySelector('.npx-cmd').textContent = npxCommand();
  }
  // the tuned values, as a link query: only what differs from the defaults
  const query = v => (cur && Object.keys(defaults).length ? encodeParams(v, defaults, cur.params) : Object.entries(v).map(([k, x]) => `${k}=${x}`).join('&'));
  const link = () => { const q = query(values); return `#/a/${cur.id}${q ? '?' + q : ''}`; };
  // the CLI takes the same keys as flags and writes them into the file it copies: npx motion-library add confetti --pieces 300
  const npxCommand = () => { const q = query(values); return `npx motion-library add ${cur.id}${q ? ' ' + q.split('&').map(p => '--' + p.replace('=', ' ')).join(' ') : ''}`; };
  const shareUrl = () => `${location.origin}${location.pathname}${link()}`;
  function embedSnippet() {
    const q = query(values), url = new URL(`stage.html?src=${srcOf(cur)}&mode=embed${q ? '&p=' + encodeURIComponent(q) : ''}`, location.href).href;
    const esc = t => t.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
    return `<iframe src="${esc(url)}" title="${esc(cur.title)} · Motion Library" width="640" height="400" loading="lazy" style="border:0;border-radius:12px;max-width:100%"></iframe>`;
  }
  function update() {
    code = writeParams(src, values, cur.params);
    renderCode();
    // the address bar follows the sliders without adding history entries; Reset brings back the plain link
    history.replaceState(history.state, '', link());
    clearTimeout(runT);
    runT = setTimeout(() => iframe?.contentWindow?.postMessage({ type: 'run', code }, '*'), 120);
  }

  async function copyText(text, lbl, message) {
    try { await navigator.clipboard.writeText(text); }
    catch { const t = Object.assign(document.createElement('textarea'), { value: text }); document.body.append(t); t.select(); document.execCommand('copy'); t.remove(); }
    if (lbl) { const was = lbl.dataset.was ??= lbl.textContent; lbl.textContent = t('Copied'); clearTimeout(lbl.t); lbl.t = setTimeout(() => { if (lbl.isConnected) lbl.textContent = was; }, 1500); }
    toast(message); creature?.react('catch');
  }
  const copy = () => copyText(code, root.querySelector('.d-copy span'), t('Code copied'));
  function syncHeart() {
    const h = root.querySelector('.d-actions .heart'); if (h && cur) h.setAttribute('aria-pressed', String(store.isHearted(cur.id)));
  }

  // FLIP between a card's media box and the stage box, using a ghost of the poster
  // open: 460 ms on the drawer curve; close passes { duration: 300, easing: easeOut } so the exit snaps
  function flip(fromRect, toRect, poster, done, { duration = 460, easing = drawer } = {}) {
    const g = document.createElement('img');
    g.src = poster; g.alt = '';
    Object.assign(g.style, { position: 'fixed', left: toRect.left + 'px', top: toRect.top + 'px', width: toRect.width + 'px', height: toRect.height + 'px', objectFit: 'cover', borderRadius: '12px', zIndex: 45, transformOrigin: '0 0', pointerEvents: 'none' });
    document.body.append(g);
    const anim = g.animate([
      { transform: `translate(${fromRect.left - toRect.left}px, ${fromRect.top - toRect.top}px) scale(${fromRect.width / toRect.width}, ${fromRect.height / toRect.height})` },
      { transform: 'none' },
    ], { duration, easing });
    anim.onfinish = () => { g.remove(); done?.(); };
    return g;
  }
  const visibleRect = el => { if (!el?.isConnected) return null; const r = el.getBoundingClientRect(); return r.width && r.bottom > 0 && r.top < innerHeight ? r : null; };

  function open(a, fromCard, q = '') {
    if (cur?.id === a.id && !root.hidden) {
      // the same animation with other values in the link (pasted, or back/forward): apply them
      if (Object.keys(defaults).length && q !== query(values)) { values = { ...defaults, ...parseParams(q, a.params) }; syncKnobs(); update(); }
      return;
    }
    // reopening while the close fade runs: cancel it, or its finish would hide the new view (cancel skips onfinish)
    closeAnim?.cancel(); closeAnim = null;
    teardown(); cur = a; card = fromCard; busy = false; defaults = {}; values = {}; shared = parseParams(q, a.params);
    lastFocus = document.activeElement;
    build(a);
    root.hidden = false; document.documentElement.style.overflow = 'hidden';
    const media = visibleRect(card?.querySelector('.card-media'));
    const box = root.querySelector('.d-stage');
    if (media && !reduce.matches) {
      box.style.visibility = 'hidden';
      root.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 220, easing: easeOut });
      flip(media, box.getBoundingClientRect(), `posters/${a.id}.webp`, () => { box.style.visibility = ''; mountStage(); });
    } else {
      if (!reduce.matches) root.animate([{ opacity: 0, transform: 'scale(.985)' }, { opacity: 1, transform: 'none' }], { duration: 240, easing: drawer });
      mountStage();
    }
    loadCode(a).catch(err => { root.querySelector('.code code').textContent = String(err.message || err); });
    root.tabIndex = -1; root.focus({ preventScroll: true });
  }

  function close(instant = false) {
    if (root.hidden || busy) return;
    const a = cur, back = visibleRect(card?.querySelector('.card-media')), box = root.querySelector('.d-stage');
    const finish = () => { teardown(); cur = null; busy = false; root.hidden = true; document.documentElement.style.overflow = ''; (card?.querySelector('.card-hit') || lastFocus)?.focus?.({ preventScroll: true }); };
    if (instant || reduce.matches || !a) { finish(); return; }
    busy = true;
    const from = box.getBoundingClientRect();
    if (back) flip(from, back, `posters/${a.id}.webp`, null, { duration: 300, easing: easeOut });
    closeAnim = root.animate([{ opacity: 1 }, { opacity: 0 }], { duration: back ? 220 : 180, easing: easeOut, fill: 'forwards' });
    // once hidden, cancel the fade: a finished fill:forwards animation keeps opacity 0 on #detail and every later open would be invisible
    closeAnim.onfinish = () => { finish(); closeAnim?.cancel(); closeAnim = null; };
  }
  function requestClose() { onClose(); }

  // keep keyboard focus inside the dialog
  root.addEventListener('keydown', e => {
    if (e.key !== 'Tab') return;
    const f = [...root.querySelectorAll('button:not([disabled]), input, [tabindex="0"], iframe')].filter(x => x.offsetParent !== null);
    if (!f.length) return;
    if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f.at(-1).focus(); }
    else if (!e.shiftKey && document.activeElement === f.at(-1)) { e.preventDefault(); f[0].focus(); }
  });

  return { open, close, requestClose, syncHeart, get isOpen() { return !root.hidden; } };
}
