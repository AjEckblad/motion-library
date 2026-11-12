// Stagger grid: tap a paint swatch and the whole colour chart turns into its shades, one ripple spreading out from your finger.
// Each swatch waits in proportion to its distance from the tap, so dozens of separate changes read as a single wave that started where you touched.
const PARAMS = { delayPerCell: 28, cols: 10 };

export default function (stage) {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const AW = 440, AH = 292, PAD = 16, GAP = 5;
  const root = document.createElement('div');
  root.className = 'sg-root';
  root.innerHTML = `<style>
    .sg-root { position: absolute; inset: 0; background: radial-gradient(120% 100% at 50% 0%, #1b1b1e, #0d0d0f); overflow: hidden; color: #15171a; font-family: "Mona Sans", system-ui, -apple-system, sans-serif; }
    .sg-board { position: absolute; left: 50%; top: 50%; width: ${AW}px; height: ${AH}px; box-sizing: border-box; padding: ${PAD}px; background: #fff; border-radius: 18px; box-shadow: 0 1px 2px rgba(20,30,60,.06), 0 18px 40px -24px rgba(20,30,60,.35); }
    .sg-head { display: flex; align-items: center; justify-content: space-between; height: 40px; }
    .sg-head h3 { margin: 0; font-size: 17px; font-weight: 700; letter-spacing: -0.015em; font-stretch: 106%; }
    .sg-sub { position: relative; height: 16px; margin-top: 2px; font-size: 12px; color: #5b6066; }
    .sg-sub span { position: absolute; left: 0; top: 0; white-space: nowrap; }
    .sg-all { height: 28px; padding: 0 12px; border-radius: 999px; font-size: 12px; font-weight: 600; display: grid; place-items: center; background: #f1f3f6; color: #33373c; }
    .sg-grid { position: relative; display: grid; gap: ${GAP}px; margin-top: 12px; }
    .sg-cell { position: relative; border-radius: 7px; aspect-ratio: 1; }
    .sg-cell i { position: absolute; inset: 0; border-radius: inherit; opacity: 0; }
    .sg-ring { position: absolute; border-radius: 10px; box-shadow: 0 0 0 2px #fff, 0 0 0 4px #15171a; opacity: 0; pointer-events: none; }
    .sg-tap { position: absolute; width: 34px; height: 34px; margin: -17px 0 0 -17px; border-radius: 50%; background: rgba(21,23,26,.22); box-shadow: 0 0 0 1.5px rgba(255,255,255,.8); opacity: 0; pointer-events: none; }
  </style>
  <div class="sg-board">
    <div class="sg-head"><div><h3>Interior paint</h3><div class="sg-sub"><span>All colours · chalky matt finish</span></div></div><span class="sg-all">All colours</span></div>
    <div class="sg-grid"></div>
    <div class="sg-tap"></div>
  </div>`;
  stage.append(root);
  const board = root.querySelector('.sg-board'), grid = root.querySelector('.sg-grid'), sub = root.querySelector('.sg-sub'), all = root.querySelector('.sg-all'), tapEl = root.querySelector('.sg-tap');

  const cols = Math.round(PARAMS.cols);
  const size = (AW - PAD * 2 - (cols - 1) * GAP) / cols;
  const rows = Math.max(2, Math.floor((AH - PAD * 2 - 52 + GAP) / (size + GAP)));
  grid.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
  const cells = [];
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
    const el = document.createElement('div'); el.className = 'sg-cell';
    const top = document.createElement('i'); el.append(top); grid.append(el);
    cells.push({ el, top, r, c });
  }
  const ring = document.createElement('div'); ring.className = 'sg-ring'; grid.append(ring);

  // Colours in OKLCH, so every row is an even step of lightness whatever the hue.
  const L = r => 0.94 - (r / Math.max(1, rows - 1)) * 0.46;
  // Paint is muted: chroma stays low near white and peaks in the middle rows.
  const spectrum = (r, c) => { const l = L(r); return [l, (0.04 + 0.04 * Math.sin(c * 1.7) ** 2) * (1 - Math.abs(l - 0.68) * 1.3), 18 + c * (330 / cols)]; };
  const family = ([l0, c0, h0], r0, k0) => (r, c) => { const l = Math.min(0.96, l0 + (L(r) - L(r0))); return [l, Math.min(0.11, Math.max(0.012, c0 * (1 + (c - k0) * 0.14))) * (1 - Math.abs(l - 0.68) * 0.9), h0 + (c - k0) * 3]; };
  const css = ([l, c, h]) => `oklch(${l.toFixed(3)} ${c.toFixed(3)} ${h.toFixed(1)})`;
  const names = [[40, 'Clay'], [75, 'Ochre'], [110, 'Olive'], [160, 'Moss'], [200, 'Sea glass'], [250, 'Harbour'], [295, 'Iris'], [335, 'Plum'], [400, 'Rose']];
  const nameOf = h => names.find(([max]) => h % 360 < max)[1];
  let current = cells.map(({ r, c }) => spectrum(r, c));
  cells.forEach((cell, i) => { cell.el.style.background = css(current[i]); });

  const fit = () => { const s = Math.min(stage.clientWidth / AW, stage.clientHeight / AH) * 0.92; board.style.transform = `translate(-50%, -50%) scale(${Math.min(s, 1.6)})`; };
  const ro = new ResizeObserver(fit); ro.observe(stage); fit();

  const timers = new Set();
  const later = (fn, ms) => { const id = setTimeout(() => { timers.delete(id); fn(); }, ms); timers.add(id); };
  const easeOut = 'cubic-bezier(0.23, 1, 0.32, 1)';

  function setSub(text) {
    const old = sub.firstElementChild, next = document.createElement('span');
    next.textContent = text; sub.append(next);
    old.animate([{ opacity: 1 }, { opacity: 0, transform: reduce ? 'none' : 'translateY(-4px)' }], { duration: 120, easing: easeOut, fill: 'forwards' }).onfinish = () => old.remove();
    next.animate([{ opacity: 0, transform: reduce ? 'none' : 'translateY(4px)' }, { opacity: 1, transform: 'none' }], { duration: 240, delay: 110, easing: easeOut, fill: 'backwards' });
  }
  function tap(x, y) {
    tapEl.style.left = x + 'px'; tapEl.style.top = y + 'px';
    tapEl.animate([{ opacity: 0, transform: reduce ? 'none' : 'scale(0.8)' }, { opacity: 1, transform: 'scale(1)', offset: 0.25 }, { opacity: 0, transform: reduce ? 'none' : 'scale(1.25)' }], { duration: 520, easing: easeOut });
  }
  // One rule for every cell: wait (distance × delayPerCell), dip, fade the new colour in, pop back.
  function ripple(or, oc, next) {
    let last = 0;
    cells.forEach((cell, i) => {
      const delay = Math.hypot(cell.r - or, cell.c - oc) * PARAMS.delayPerCell;
      last = Math.max(last, delay);
      cell.top.style.background = css(next[i]);
      cell.el.animate([
        { transform: 'scale(1)' }, { transform: 'scale(0.8)', offset: 0.3 }, { transform: 'scale(1.05)', offset: 0.68 }, { transform: 'scale(1)' },
      ], { duration: reduce ? 0 : 360, delay, easing: 'cubic-bezier(0.37, 0, 0.63, 1)' });
      cell.top.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 280, delay: delay + 60, easing: easeOut, fill: 'forwards' });
    });
    later(() => {
      cells.forEach((cell, i) => { cell.el.style.background = css(next[i]); cell.top.getAnimations().forEach(a => a.cancel()); });
      current = next;
    }, last + 620);
  }

  const picks = [[2, 3], [1, 7], [3, 1], [0, 5], [4, 8], [2, 6]];
  let n = 0;
  function pick() {
    const [pr, pc] = picks[n++ % picks.length];
    const r0 = Math.min(pr, rows - 1), c0 = Math.min(pc, cols - 1);
    const cell = cells[r0 * cols + c0];
    const base = current[r0 * cols + c0], f = family(base, r0, c0);
    tap(cell.el.offsetLeft + size / 2, grid.offsetTop + cell.el.offsetTop + size / 2);
    ring.style.cssText = `left:${cell.el.offsetLeft - 2}px;top:${cell.el.offsetTop - 2}px;width:${size + 4}px;height:${size + 4}px`;
    ring.animate([{ opacity: 0, transform: reduce ? 'none' : 'scale(0.9)' }, { opacity: 1, transform: 'none' }], { duration: 220, delay: 80, easing: easeOut, fill: 'forwards' });
    ripple(r0, c0, cells.map(({ r, c }) => f(r, c)));
    setSub(`Shades of ${nameOf(base[2])} · ${cells.length} colours`);
    later(back, 2600);
  }
  function back() {
    // "All colours" sits above the top-right corner, so the wave starts from there.
    tap(all.offsetLeft + all.offsetWidth / 2, all.offsetTop + all.offsetHeight / 2);
    all.animate([{ transform: 'scale(1)' }, { transform: 'scale(0.95)' }, { transform: 'scale(1)' }], { duration: reduce ? 0 : 220, easing: easeOut });
    ring.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 150, easing: easeOut, fill: 'forwards' });
    ripple(-1.5, cols - 0.5, cells.map(({ r, c }) => spectrum(r, c)));
    setSub('All colours · chalky matt finish');
    later(pick, 2100);
  }
  later(pick, 700);

  return () => { timers.forEach(clearTimeout); ro.disconnect(); root.getAnimations({ subtree: true }).forEach(a => a.cancel()); root.remove(); };
}
