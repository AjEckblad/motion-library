// Brian’s Brain, a three-state cellular automaton on a crisp grid. A cell fires (white) when exactly two of its eight
// neighbours are firing; a firing cell is always "dying" (blue) on the next step and off the step after. That one-step
// refractory period makes everything move: the board fills with gliders and spaceships that streak in straight lines
// and collide into new ones. Cells that turn off keep an afterglow, so every ship leaves a comet tail. Drag to paint.
const PARAMS = { cell: 6, rate: 18, trail: 0.88 };

export default function (stage) {
  const canvas = document.createElement('canvas');
  canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block;touch-action:none';
  stage.append(canvas);
  const ctx = canvas.getContext('2d');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const off = document.createElement('canvas'), octx = off.getContext('2d');
  let W = 0, H = 0, D = 1, C = 0, R = 0, cur, nxt, glow, img, grid;
  const cellPx = () => Math.max(3, Math.round(PARAMS.cell));
  // afterglow ramp: 0 = background, 1 = freshly dead
  const stops = [[0, [7, 8, 14]], [0.2, [16, 18, 52]], [0.5, [44, 40, 140]], [0.8, [60, 90, 220]], [1, [90, 150, 255]]];
  const LUT = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    const t = i / 255; let k = 0; while (k < stops.length - 2 && t > stops[k + 1][0]) k++;
    const [t0, a] = stops[k], [t1, b] = stops[k + 1], u = (t - t0) / (t1 - t0);
    const c = a.map((v, j) => Math.round(v + (b[j] - v) * u));
    LUT[i] = 0xff000000 | (c[2] << 16) | (c[1] << 8) | c[0];
  }
  const DYING = 0xff000000 | (255 << 16) | (205 << 8) | 70;
  const ALIVE = 0xff000000 | (246 << 16) | (255 << 8) | 236;
  const soup = (cx, cy, r, p) => {
    for (let y = -r; y <= r; y++) for (let x = -r; x <= r; x++) {
      if (x * x + y * y > r * r || Math.random() > p) continue;
      const X = (cx + x + C) % C, Y = (cy + y + R) % R; cur[Y * C + X] = 1;
    }
  };
  const resize = () => {
    D = Math.min(devicePixelRatio, 2); W = stage.clientWidth || 1; H = stage.clientHeight || 1;
    canvas.width = Math.round(W * D); canvas.height = Math.round(H * D);
    const cp = cellPx(), c = Math.ceil(W / cp), r = Math.ceil(H / cp);
    if (c === C && r === R) return;
    C = c; R = r;
    cur = new Uint8Array(C * R); nxt = new Uint8Array(C * R); glow = new Float32Array(C * R);
    off.width = C; off.height = R; img = octx.createImageData(C, R);
    for (let i = 0; i < C * R; i++) cur[i] = Math.random() < 0.06 ? 1 : 0;
    // gap overlay: one cell's worth of pattern with dark gutters on two sides
    const s = Math.round(cp * D), g = document.createElement('canvas'); g.width = g.height = s;
    const gc = g.getContext('2d'); gc.fillStyle = '#05060a'; gc.fillRect(0, 0, s, Math.max(1, Math.round(D))); gc.fillRect(0, 0, Math.max(1, Math.round(D)), s);
    grid = ctx.createPattern(g, 'repeat');
  };
  const ro = new ResizeObserver(resize); ro.observe(stage); resize();

  let quiet = 0;
  const step = () => {
    let changes = 0, pop = 0;
    for (let y = 0; y < R; y++) {
      const ym = ((y - 1 + R) % R) * C, y0 = y * C, yp = ((y + 1) % R) * C;
      for (let x = 0; x < C; x++) {
        const xm = (x - 1 + C) % C, xp = (x + 1) % C;
        const i = y0 + x, a = cur[i];
        let v;
        if (a === 1) v = 2; else if (a === 2) v = 0;
        else { const n = (cur[ym + xm] === 1) + (cur[ym + x] === 1) + (cur[ym + xp] === 1) + (cur[y0 + xm] === 1) + (cur[y0 + xp] === 1) + (cur[yp + xm] === 1) + (cur[yp + x] === 1) + (cur[yp + xp] === 1); v = n === 2 ? 1 : 0; }
        nxt[i] = v; if (v !== a) changes++; pop += v === 1;
      }
    }
    [cur, nxt] = [nxt, cur];
    // stagnation: almost nothing changing for a while (still lifes and blinkers only) -> drop in new soup
    quiet = changes < C * R * 0.004 ? quiet + 1 : 0;
    if (quiet > 40 || pop < C * R * 0.01) {
      quiet = 0;
      for (let k = 0; k < 3; k++) soup(Math.random() * C | 0, Math.random() * R | 0, 6 + Math.random() * 10 | 0, 0.4);
    }
  };

  // pointer painting
  let down = false;
  const paint = e => {
    const r = canvas.getBoundingClientRect(), cp = cellPx();
    const cx = Math.floor((e.clientX - r.left) / cp), cy = Math.floor((e.clientY - r.top) / cp);
    soup(cx, cy, 3, 0.55); draw();
  };
  const pd = e => { down = true; paint(e); };
  const pm = e => { if (down) paint(e); };
  const pu = () => { down = false; };
  stage.addEventListener('pointerdown', pd); stage.addEventListener('pointermove', pm); addEventListener('pointerup', pu);

  const draw = () => {
    const px = new Uint32Array(img.data.buffer);
    for (let i = 0; i < C * R; i++) {
      if (cur[i] === 1) { glow[i] = 1; px[i] = ALIVE; }
      else if (cur[i] === 2) { glow[i] = 1; px[i] = DYING; }
      else { const g = glow[i]; px[i] = LUT[(g * 255) | 0]; }
    }
    octx.putImageData(img, 0, 0);
    ctx.imageSmoothingEnabled = false;
    const s = cellPx() * D;
    ctx.drawImage(off, 0, 0, C * s, R * s);
    ctx.fillStyle = grid; ctx.fillRect(0, 0, canvas.width, canvas.height);
  };
  const decay = k => { const tr = Math.min(0.99, Math.max(0, PARAMS.trail)); for (let i = 0; i < C * R; i++) if (!cur[i]) glow[i] *= Math.pow(tr, k); };

  let raf, acc = 0, last = performance.now();
  function frame(now) {
    const dt = Math.min(0.1, (now - last) / 1000); last = now;
    const rate = Math.max(1, PARAMS.rate) * (reduce ? 0.08 : 1);
    acc += dt * rate;
    let n = 0;
    while (acc >= 1 && n < 4) { acc -= 1; n++; step(); decay(1); }
    draw();
    raf = requestAnimationFrame(frame);
  }
  for (let i = 0; i < 30; i++) { step(); decay(1); }
  draw();
  raf = requestAnimationFrame(frame);
  return () => { cancelAnimationFrame(raf); ro.disconnect(); stage.removeEventListener('pointerdown', pd); stage.removeEventListener('pointermove', pm); removeEventListener('pointerup', pu); canvas.remove(); };
}
