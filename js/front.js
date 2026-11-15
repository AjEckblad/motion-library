// The front page: a headline, one line, one button, and a live Clifford attractor on the right of the first screen with
// a caption under it, light only, fading out under the words (on phones it sits on top, caption and all). The pointer steers it: the words above it let
// pointer events through, except the button. It never delays first paint (the poster is plain HTML; the live stage
// mounts once the page has loaded and the browser is idle), runs only while it is on screen and nothing else is
// playing, and frees its WebGL context after a while off screen. Under reduced motion it stays the poster.
import { ANIMS, animById, srcOf } from '../anims/registry.js';
import { HERO, HERO_PARAMS, HEADLINE, HEADLINE_ACCENT, CAPTION } from './hero.js';
import { t, tr } from './i18n.js';

const reduce = matchMedia('(prefers-reduced-motion: reduce)');
const FREE_AFTER = 30000;                                   // off screen this long: drop the iframe (and its GPU memory)

export function createFront() {
  const root = document.getElementById('front');
  const a = animById[HERO];
  if (!root || !a) return { setBusy() {}, show() {}, enter: () => [] };
  const media = root.querySelector('#front-media'), art = root.querySelector('#front-art');

  /* words, in the chosen language */
  // the headline, its accent phrase in an <em> (Instrument Serif italic, pink): the same markup the static build writes
  const title = root.querySelector('#front-title'), head = t(HEADLINE), acc = t(HEADLINE_ACCENT), at = acc ? head.indexOf(acc) : -1;
  if (at < 0) title.textContent = head;
  else { const em = document.createElement('em'); em.textContent = acc; title.replaceChildren(head.slice(0, at), em, head.slice(at + acc.length)); }
  root.querySelector('#front-sub').textContent = t('Each one is a single JavaScript file. Adjust it with the sliders, then copy the code.');
  root.querySelector('#front-browse').textContent = t('Browse all {n}').replace('{n}', ANIMS.length);
  // the caption names what you are looking at first (the same markup the static build writes)
  const name = document.createElement('b'); name.textContent = tr(a, 'title');
  root.querySelector('#front-cap').replaceChildren(name, ` · ${t(CAPTION)}`);
  media.setAttribute('aria-label', t('A live Clifford attractor: move the pointer over it to reshape it'));

  /* the scroll cue under the hero: it glides to the first category (its href does the same without the script), and
     fades out once the page has scrolled */
  const more = root.querySelector('#front-more');
  if (more) {
    more.querySelector('span').textContent = t('Learn more');
    more.addEventListener('click', e => {
      const sec = document.querySelector('#grid .cat-sec'); if (!sec) return;
      e.preventDefault();
      const bar = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--bar-h')) || 60;
      scrollTo({ top: sec.getBoundingClientRect().top + scrollY - bar - 12, behavior: reduce.matches ? 'instant' : 'smooth' });
    });
    const fade = () => more.classList.toggle('gone', scrollY > 40);
    addEventListener('scroll', fade, { passive: true }); fade();
  }

  /* the live stage */
  let frame = null, inView = false, busy = new Set(), loaded = false, freeT = 0;
  // mode=hero: no click-to-open relay (a click here steers the attractor); HERO_PARAMS sets its point count
  const src = `stage.html?src=${srcOf(a)}${a.v ? '&v=' + a.v : ''}&mode=hero&p=${encodeURIComponent(HERO_PARAMS)}`;
  const wants = () => loaded && inView && !busy.size && !reduce.matches && !document.hidden;
  function sync() {
    const run = wants();
    media.dataset.state = !frame || reduce.matches ? 'poster' : run ? 'live' : 'paused';
    if (reduce.matches) return;
    clearTimeout(freeT);
    if (run) {
      if (!frame) {
        frame = document.createElement('iframe');
        frame.src = src; frame.title = a.title; frame.tabIndex = -1; frame.setAttribute('aria-hidden', 'true');
        media.append(frame); media.dataset.state = 'live';
      } else post('play');
    } else if (frame) {
      post('pause');
      // a long way off screen: give the GPU back; the poster stays and the stage comes back when it is in view again
      if (!inView) freeT = setTimeout(drop, FREE_AFTER);
    }
  }
  const post = type => frame?.contentWindow?.postMessage({ type }, location.origin);
  function drop() { frame?.remove(); frame = null; media.dataset.state = 'poster'; }
  addEventListener('message', e => {
    if (e.data?.type === 'stage-ready' && frame && e.source === frame.contentWindow) { frame.classList.add('live'); if (!wants()) post('pause'); }
  });
  new IntersectionObserver(([en]) => { inView = en.isIntersecting && en.intersectionRatio > 0.15; sync(); }, { threshold: [0, 0.15, 0.5] }).observe(media);
  document.addEventListener('visibilitychange', sync);
  reduce.addEventListener('change', () => { if (reduce.matches) drop(); sync(); });
  // first paint never waits on WebGL: mount after load and after the first contentful paint (a slow font or a busy
  // machine can put that paint after load), when the main thread is idle
  const painted = new Promise(res => {
    if (performance.getEntriesByName('first-contentful-paint').length) return res();
    try { new PerformanceObserver((l, o) => { if (l.getEntriesByName('first-contentful-paint').length) { o.disconnect(); res(); } }).observe({ type: 'paint', buffered: true }); } catch { res(); }
    setTimeout(res, 3000);                                   // no Paint Timing in this browser: the hero still comes
  });
  const ready = () => { loaded = true; sync(); };
  const idle = () => painted.then(() => (window.requestIdleCallback ? requestIdleCallback(ready, { timeout: 1500 }) : setTimeout(ready, 400)));
  if (document.readyState === 'complete') idle(); else addEventListener('load', idle, { once: true });
  sync();

  /* entrances. On a fresh visit the headline's lines rise from behind their own baselines (the one authored moment on
     the page), then the line, the button and the attractor settle in. Coming back from another view, everything uses
     the grid's entrance instead (240 ms, 30 ms apart), so the swap feels like one system. The text is in the HTML at
     rest: if the script never runs, nothing is hidden. */
  const ease = 'cubic-bezier(0.23, 1, 0.32, 1)';
  const parts = () => [root.querySelector('#front-sub'), root.querySelector('#front-browse'), art];   // the picture comes in with its caption
  function lines() {
    // wrap each rendered line of the headline in a mask, measured from the words' tops (works in every language). The
    // accent phrase keeps its <em> on whichever lines it lands.
    const h = root.querySelector('#front-title'), text = h.textContent;
    const cjk = /[　-鿿]/.test(text);
    // (in Chinese the accent phrase is one unbreakable piece, as the CSS sets it)
    const toks = [...h.childNodes].flatMap(n => { const em = n.nodeName === 'EM', s = n.textContent; return (cjk ? (em ? [s] : [...s]) : s.split(/(\s+)/)).filter(Boolean).map(w => ({ w, em })); });
    h.replaceChildren(...toks.map(tk => { const s = document.createElement(tk.em ? 'em' : 'span'); s.textContent = tk.w; tk.el = s; return s; }));
    // the serif phrase is set a little larger, so its top sits a few px higher: group by top within a third of the size
    const tol = parseFloat(getComputedStyle(h).fontSize) / 3, rows = [];
    for (const tk of toks) { const top = tk.el.offsetTop; let r = rows.find(x => Math.abs(x.top - top) < tol); if (!r) rows.push(r = { top, toks: [] }); r.toks.push(tk); }
    h.replaceChildren(...rows.map(r => {
      const m = document.createElement('span'); m.className = 'front-line'; const i = document.createElement('span');
      // consecutive tokens of the same kind join into one text run or one <em>
      for (const tk of r.toks) {
        const last = i.lastChild, isEm = last?.nodeName === 'EM';
        if (last && isEm === tk.em) last.textContent += tk.w;
        else if (tk.em) { const e = document.createElement('em'); e.textContent = tk.w; i.append(e); }
        else i.append(tk.w);
      }
      m.append(i); return m;
    }));
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
