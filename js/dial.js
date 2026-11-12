// The category dial: just the words, set on a curve down the right edge. Every entry is always visible.
// Hovering swells the words near the pointer (a fisheye in transform only); choosing one springs it out.
// On phones it becomes a half-dial of dots along the bottom, with the chosen name under the arc.
import { sfx } from './sound.js';

const reduce = matchMedia('(prefers-reduced-motion: reduce)');
const narrow = matchMedia('(max-width: 860px)');

export function createDial({ root, list, entries, onSelect, onLayout }) {
  let selected = entries[0].id, geo = null, hoverY = null, raf = 0, last = performance.now(), snap = false;   // snap: the next frame lands at once (keyboard)
  const items = entries.map((e, i) => {
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'dial-item'; b.setAttribute('role', 'radio'); b.dataset.id = e.id;
    b.setAttribute('aria-label', e.name);
    b.style.setProperty('--hue', e.hue);
    b.innerHTML = `<span class="lbl"></span><span class="dot"></span>`;
    b.querySelector('.lbl').textContent = e.name;
    b.addEventListener('click', () => select(e.id, true));
    b.addEventListener('keydown', ev => {
      const k = ev.key, step = k === 'ArrowDown' || k === 'ArrowRight' ? 1 : k === 'ArrowUp' || k === 'ArrowLeft' ? -1 : 0;
      let to = -1;
      if (step) to = (i + step + items.length) % items.length; else if (k === 'Home') to = 0; else if (k === 'End') to = items.length - 1;
      if (to < 0) return;
      ev.preventDefault(); select(entries[to].id, true, true); items[to].el.focus();
    });
    list.append(b);
    return { el: b, lbl: b.querySelector('.lbl'), dot: b.querySelector('.dot'), s: 1, v: 0, y: 0, tf: '' };
  });
  const caption = document.createElement('div'); caption.className = 'dial-caption'; caption.setAttribute('aria-hidden', 'true'); root.append(caption);
  let counts = {};
  const syncCaption = () => { const e = entries.find(x => x.id === selected); caption.replaceChildren(e.name); const sp = document.createElement('span'); sp.textContent = counts[e.id] ?? ''; caption.append(sp); };

  function layout() {
    const w = root.clientWidth, h = root.clientHeight, mobile = narrow.matches;
    root.classList.toggle('is-mobile', mobile);
    if (mobile) {
      const Rx = Math.min(w * 0.45, 280), Ry = Math.max(60, Math.min(h - 50, 116)), cx = w / 2, cy = h - 10;
      geo = { mobile: true };
      items.forEach((it, i) => {
        const a = (12 + (156 * i) / (items.length - 1)) * Math.PI / 180;
        it.el.style.right = ''; it.el.style.left = (cx - Rx * Math.cos(a)) + 'px'; it.el.style.top = (cy - Ry * Math.sin(a)) + 'px';
      });
      syncCaption(); kick(); onLayout?.(); return;
    }
    // desktop: the words' right edges follow a circular arc that bulges toward the grid in the middle
    const top = Math.max(36, h * 0.06), bottom = h - Math.max(90, h * 0.14), mid = (top + bottom) / 2, half = (bottom - top) / 2;
    const depth = Math.min(80, w * 0.28), padR = 26;
    geo = { mobile: false, w, h, spacing: (bottom - top) / (items.length - 1) };
    items.forEach((it, i) => {
      it.y = top + (bottom - top) * (i / (items.length - 1));
      const k = (it.y - mid) / half;
      const right = padR + depth * Math.sqrt(Math.max(0, 1 - k * k));
      it.el.style.left = ''; it.el.style.right = right + 'px'; it.el.style.top = (it.y - 18) + 'px';
      // remembered for the frame loop, which keeps a swelling word clear of the grid (see frame). The width is taken
      // at the chosen (500) weight, which is a little wider than the resting one.
      it.right = right; it.wd = it.lbl.offsetWidth * 1.04;
    });
    kick(); onLayout?.();
  }

  root.addEventListener('pointermove', e => {
    if (!geo || geo.mobile || reduce.matches) return;
    const b = root.getBoundingClientRect(); hoverY = e.clientY - b.top; kick();
  });
  root.addEventListener('pointerleave', () => { hoverY = null; kick(); });

  function kick() { if (!raf) { last = performance.now(); raf = requestAnimationFrame(frame); } }
  function frame(now) {
    raf = 0;
    const dt = Math.min(0.033, (now - last) / 1000); last = now;
    let moving = false;
    items.forEach((it, i) => {
      const isSel = entries[i].id === selected;
      let target = isSel ? 1.16 : 1;
      if (geo && !geo.mobile && hoverY !== null) { const d = (it.y - hoverY) / geo.spacing; target = Math.max(target, 1 + 0.38 * Math.exp(-(d * d) / 1.3)); }
      // a slightly underdamped spring: the chosen word pops out with a little overshoot. Keyboard moves and reduced
      // motion land at once: a key pressed again and again must not bounce every time
      if (reduce.matches || snap) { it.s = target; it.v = 0; }
      else for (let n = 0; n < 2; n++) { const h = dt / 2, k = 300, c = 2 * Math.sqrt(k) * 0.55; it.v += (-k * (it.s - target) - c * it.v) * h; it.s += it.v * h; }
      if (Math.abs(target - it.s) > 0.001 || Math.abs(it.v) > 0.01) moving = true;
      // transform only: the UI face has no width axis, so stretching the words would relayout text for nothing
      const desk = geo && !geo.mobile;
      let sv = it.s, tx = -(sv - 1) * 34;
      if (desk && it.wd) {
        // every word swells by the same fisheye. One that would cross into the grid slides right, toward the screen
        // edge where the arc leaves room, instead of shrinking: its left edge stays 8px inside the column and its right
        // edge 6px off the screen. Only a word wider than the whole column is held back.
        const room = geo.w - 14;
        if (it.wd * sv > room) sv = Math.max(1, room / it.wd);
        const left = geo.w - it.right + tx - it.wd * sv;
        if (left < 8) tx += 8 - left;
      }
      const tf = desk ? `translateX(${tx.toFixed(2)}px) scale(${sv.toFixed(4)})` : '';
      if (tf !== it.tf) { it.lbl.style.transform = tf; it.tf = tf; }
      it.dot.style.transform = !desk && isSel ? 'scale(1.3)' : '';
    });
    snap = false;
    if (moving) raf = requestAnimationFrame(frame);
  }

  function select(id, user = false, kb = false) {                 // kb: chosen from the keyboard, so the grid swaps with no animation
    if (!entries.some(e => e.id === id)) return;
    const changed = id !== selected;
    selected = id;
    items.forEach((it, i) => { const on = entries[i].id === id; it.el.setAttribute('aria-checked', String(on)); it.el.tabIndex = on ? 0 : -1; });
    if (changed && user) sfx.tick();
    if (kb) snap = true;
    syncCaption(); kick();
    if (user) onSelect(id, kb);
  }
  function setCounts(map) { counts = map; syncCaption(); }
  // the top edges of the words, in dial coordinates: the creatures can stand on them
  function platforms() {
    if (!geo || geo.mobile) return [];
    const b = root.getBoundingClientRect();
    return items.map(it => { const r = it.lbl.getBoundingClientRect(); return { x1: r.left - b.left + 2, x2: r.right - b.left - 2, y: r.top - b.top + r.height * 0.16 }; });
  }

  new ResizeObserver(layout).observe(root);
  document.fonts?.ready.then(layout);                              // the caps depend on the real word widths
  narrow.addEventListener('change', layout);
  select(selected);
  layout();
  return { select, setCounts, layout, platforms, get selected() { return selected; } };
}
