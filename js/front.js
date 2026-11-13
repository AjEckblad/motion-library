// The front page's hero: one showpiece running live across the content column, with two of its real sliders.
// It never delays first paint (the poster is plain HTML; the live stage mounts once the page has loaded and the
// browser is idle), runs only while it is on screen and nothing else is playing, and frees its WebGL context after
// a while off screen. Under reduced motion it stays the poster. A slider swaps in a retuned stage under the running
// one and crossfades, so the picture never blanks while the shader compiles.
import { animById, catById, srcOf } from '../anims/registry.js';
import { HERO, HERO_KNOBS } from './showpieces.js';
import { t, tr, tl, catName } from './i18n.js';
import { readParams, formatValue, encodeParams } from './code.js';

const reduce = matchMedia('(prefers-reduced-motion: reduce)');
const FREE_AFTER = 30000;                                   // off screen this long: drop the iframe (and its GPU memory)

export function createFront({ onOpen, toast }) {
  const root = document.getElementById('front');
  const a = animById[HERO];
  if (!root || !a) return { setBusy() {}, show() {} };
  const media = root.querySelector('#front-media'), stageEl = root.querySelector('#front-stage');

  /* words, in the chosen language */
  root.querySelector('#front-title').textContent = t('Showpiece web effects that run in any stack');
  const n = document.querySelectorAll('[data-count]')[0]?.textContent || '';
  root.querySelector('#front-lede').textContent = t('{n} live effects, from button springs to real-time ferrofluid and ocean. Every preview is the code itself running: what you see is what you copy.').replace('{n}', n);
  const points = ['One plain-JS file each, no dependencies', 'Live sliders on every effect', 'Copy as prompt for your AI assistant'];
  root.querySelectorAll('#front-points li').forEach((li, i) => { li.textContent = t(points[i]); });
  root.querySelector('#front-browse > span').textContent = t('Browse all {n}').replace('{n}', n);
  root.querySelector('#front-name').textContent = tr(a, 'title');
  root.querySelector('#front-trick').textContent = tr(a, 'trick');
  root.querySelector('.front-cap .cat-dot').setAttribute('title', catName(catById[a.cat]));
  media.setAttribute('aria-label', `${tr(a, 'title')}: ${t('See the code')}`);

  /* controls: two real sliders, pause, and the way into the detail view with the tuned values */
  const ctl = document.createElement('div'); ctl.className = 'front-ctl';
  const knobs = HERO_KNOBS.filter(k => a.params[k]);
  ctl.innerHTML = knobs.map(k => `<div class="knob"><label for="fk-${k}"></label><output for="fk-${k}"></output><input id="fk-${k}" type="range" data-k="${k}" min="${a.params[k].min}" max="${a.params[k].max}" step="${a.params[k].step}"></div>`).join('')
    + `<button class="pb-btn front-pause" type="button" aria-pressed="false"><svg viewBox="0 0 16 16" aria-hidden="true"><path class="i-pause" d="M5 3.5v9M11 3.5v9"/><path class="i-play" d="M5 3v10l8-5z"/></svg><span></span></button>`
    + `<a class="pb-btn front-open" href="#/a/${a.id}"><span></span><svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3 8h9M8.5 4.5L12 8l-3.5 3.5"/></svg></a>`;
  knobs.forEach(k => { ctl.querySelector(`label[for="fk-${k}"]`).textContent = tl(a.params[k].label); });
  const pauseBtn = ctl.querySelector('.front-pause'), openLink = ctl.querySelector('.front-open');
  openLink.querySelector('span').textContent = t('See the code');
  root.querySelector('.front-cap').append(ctl);

  let defaults = {}, values = {};
  const query = () => Object.keys(defaults).length ? encodeParams(values, defaults, a.params) : '';
  // the install line follows the sliders: the CLI takes the same keys as flags and writes them into the file it copies
  const npx = root.querySelector('#front-npx'), npxCode = npx.querySelector('code');
  const npxCommand = () => { const q = query(); return `npx motion-library add ${a.id}${q ? ' ' + q.split('&').map(p => '--' + p.replace('=', ' ')).join(' ') : ''}`; };
  const syncLinks = () => { const q = query(); openLink.href = `#/a/${a.id}${q ? '?' + q : ''}`; npxCode.textContent = npxCommand(); };
  npx.setAttribute('title', t('Copy'));
  npx.addEventListener('click', () => {
    navigator.clipboard?.writeText(npxCommand()).then(() => toast?.(t('Command copied: run it in your project folder')), () => {});
  });
  fetch(srcOf(a) + (a.v ? '?v=' + a.v : '')).then(r => r.text()).then(src => {
    defaults = readParams(src); values = { ...defaults };
    for (const k of knobs) {
      const input = ctl.querySelector(`#fk-${k}`), out = ctl.querySelector(`output[for="fk-${k}"]`);
      input.value = values[k]; out.textContent = formatValue(values[k], a.params[k].step);
      input.addEventListener('input', () => { values[k] = +input.value; out.textContent = formatValue(values[k], a.params[k].step); syncLinks(); retune(); });
    }
    syncLinks();
  }).catch(() => {});
  // the stage itself opens the effect too (the iframe relays a click as stage-click)
  media.addEventListener('click', e => { e.preventDefault(); onOpen(openLink.getAttribute('href')); });
  openLink.addEventListener('click', e => { e.preventDefault(); onOpen(openLink.getAttribute('href')); });

  /* the live stage */
  let frame = null, next = null, inView = false, busy = new Set(), userPaused = false, loaded = false, freeT = 0, retuneT = 0;
  const src = p => `stage.html?src=${srcOf(a)}${a.v ? '&v=' + a.v : ''}&mode=preview${p ? '&p=' + encodeURIComponent(p) : ''}`;
  const wants = () => loaded && inView && !busy.size && !userPaused && !reduce.matches && !document.hidden;
  function mountFrame(p) {
    const f = document.createElement('iframe');
    f.src = src(p); f.title = tr(a, 'title'); f.tabIndex = -1; f.setAttribute('aria-hidden', 'true');
    media.append(f);
    return f;
  }
  function sync() {
    const run = wants();
    stageEl.dataset.state = !frame ? 'poster' : run ? 'live' : 'paused';
    pauseBtn.setAttribute('aria-pressed', String(userPaused));
    pauseBtn.querySelector('span').textContent = t(userPaused ? 'Play' : 'Pause');
    if (reduce.matches) { stageEl.dataset.state = 'poster'; return; }
    clearTimeout(freeT);
    if (run) {
      if (!frame) { frame = mountFrame(query()); stageEl.dataset.state = 'live'; }
      else post(frame, 'play');
    } else if (frame) {
      post(frame, 'pause'); post(next, 'pause');
      // a long way off screen: give the GPU back; the poster stays and the stage comes back when it is in view again
      if (!inView) freeT = setTimeout(drop, FREE_AFTER);
    }
  }
  const post = (f, type) => f?.contentWindow?.postMessage({ type }, location.origin);
  function drop() { frame?.remove(); next?.remove(); frame = next = null; stageEl.dataset.state = 'poster'; }
  function retune() {
    clearTimeout(retuneT);
    retuneT = setTimeout(() => { if (!frame) return; next?.remove(); next = mountFrame(query()); next.classList.add('is-next'); }, 260);
  }
  addEventListener('message', e => {
    if (e.data?.type === 'stage-ready') {
      if (frame && e.source === frame.contentWindow) { frame.classList.add('live'); if (!wants()) post(frame, 'pause'); }
      else if (next && e.source === next.contentWindow) {
        // give the new stage two real frames to draw before it covers the old one, then fade it in and drop the old
        const n = next;
        requestAnimationFrame(() => requestAnimationFrame(() => {
          if (n !== next) return;
          n.classList.add('live');
          setTimeout(() => { if (n !== next) return; frame?.remove(); frame = n; next = null; frame.classList.remove('is-next'); if (!wants()) post(frame, 'pause'); }, 320);
        }));
      }
    }
    if (e.data?.type === 'stage-click' && (e.source === frame?.contentWindow || e.source === next?.contentWindow)) onOpen(openLink.getAttribute('href'));
  });
  pauseBtn.addEventListener('click', () => { userPaused = !userPaused; sync(); });
  new IntersectionObserver(([en]) => { inView = en.isIntersecting && en.intersectionRatio > 0.15; sync(); }, { threshold: [0, 0.15, 0.5] }).observe(media);
  document.addEventListener('visibilitychange', sync);
  reduce.addEventListener('change', () => { if (reduce.matches) drop(); sync(); });
  // first paint never waits on WebGL: mount after load, when the main thread is idle
  const ready = () => { loaded = true; sync(); };
  const idle = () => (window.requestIdleCallback ? requestIdleCallback(ready, { timeout: 1500 }) : setTimeout(ready, 400));
  if (document.readyState === 'complete') idle(); else addEventListener('load', idle, { once: true });
  sync();

  /* entrances. On a fresh visit the headline's lines rise from behind their own baselines (the one authored moment on
     the page), then the words and the stage settle in. Coming back from another view, everything uses the grid's
     entrance instead (240 ms, 30 ms apart), so the swap feels like one system. The text is in the HTML at rest: if the
     script never runs, nothing is hidden. */
  const ease = 'cubic-bezier(0.23, 1, 0.32, 1)';
  const parts = () => [root.querySelector('.front-lede'), root.querySelector('.front-side'), stageEl];
  function lines() {
    // wrap each rendered line of the headline in a mask, measured from the words' tops (works in every language)
    const h = root.querySelector('#front-title'), text = h.textContent;
    const cjk = /[\u3000-\u9fff]/.test(text), toks = cjk ? [...text] : text.split(/(\s+)/);
    h.replaceChildren(...toks.map(w => { const s = document.createElement('span'); s.textContent = w; return s; }));
    const rows = [];
    for (const s of h.children) { const top = s.offsetTop; let r = rows.find(x => Math.abs(x.top - top) < 4); if (!r) rows.push(r = { top, words: [] }); r.words.push(s.textContent); }
    h.replaceChildren(...rows.map(r => { const m = document.createElement('span'); m.className = 'front-line'; const i = document.createElement('span'); i.textContent = r.words.join(''); m.append(i); return m; }));
    h.setAttribute('aria-label', text);
    return [...h.querySelectorAll('.front-line > span')];
  }
  function enter(firstVisit) {
    if (reduce.matches || root.hidden) return [];
    if (firstVisit) {
      const ls = lines();
      ls.forEach((l, i) => l.animate([{ transform: 'translateY(105%)' }, { transform: 'none' }], { duration: 760, delay: 80 + i * 110, easing: ease, fill: 'backwards' }));
      parts().forEach((p, i) => p.animate([{ opacity: 0, transform: 'translateY(16px)' }, { opacity: 1, transform: 'none' }], { duration: 520, delay: 300 + i * 80, easing: ease, fill: 'backwards' }));
      return [];
    }
    return [root.querySelector('#front-title'), ...parts()];   // the caller staggers these with the cards
  }

  return {
    enter,
    // something else needs the GPU or the screen: a card preview, the detail view, another view than the full list
    setBusy(reason, on) { if (on) busy.add(reason); else busy.delete(reason); sync(); },
    show(on) { root.hidden = !on; if (!on) { busy.add('hidden'); } else busy.delete('hidden'); sync(); },
  };
}
