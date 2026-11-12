// Falling sand: a cellular automaton where every cell is empty, sand, water or stone. Each step, scanning from the
// bottom up, a grain moves into the cell below if it’s free, else slides diagonally; water also spreads sideways, and
// sand sinks through water by swapping places. Stone never moves. The poured colour drifts over time, so the pile
// records its own history in strata. When the box is nearly full, the floor opens and it all drains out.
const PARAMS = { rate: 30, water: 0.12, cell: 3 };

export default function (stage) {
  const canvas = document.createElement('canvas');
  canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block;touch-action:none';
  stage.append(canvas);
  const ctx = canvas.getContext('2d');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const off = document.createElement('canvas'), octx = off.getContext('2d');
  const EMPTY = 0, SAND = 1, WATER = 2, STONE = 3;
  let W = 0, H = 0, D = 1, C = 0, R = 0, type, col, stamp, img, tick = 0, free = 1;
  const cp = () => Math.max(2, Math.round(PARAMS.cell));
  const BG = 0xff000000 | (14 << 16) | (10 << 8) | 9;
  const rgb = (r, g, b) => 0xff000000 | (b << 16) | (g << 8) | r;
  const bands = [[255, 106, 74], [255, 178, 72], [255, 232, 170], [236, 84, 122], [148, 98, 255], [80, 214, 196]];
  const sandColour = t => {
    const f = (t * 0.4) % bands.length, i = f | 0, u = f - i, a = bands[i], b = bands[(i + 1) % bands.length];
    const s = u < 0.75 ? 0 : (u - 0.75) / 0.25, j = 0.82 + Math.random() * 0.18;    // hold each band, then blend fast
    return rgb(Math.min(255, (a[0] + (b[0] - a[0]) * s) * j) | 0, Math.min(255, (a[1] + (b[1] - a[1]) * s) * j) | 0, Math.min(255, (a[2] + (b[2] - a[2]) * s) * j) | 0);
  };
  const waterColour = () => rgb(40 + Math.random() * 30 | 0, 120 + Math.random() * 40 | 0, 255);

  const resize = () => {
    D = Math.min(devicePixelRatio, 2); W = stage.clientWidth || 1; H = stage.clientHeight || 1;
    canvas.width = Math.round(W * D); canvas.height = Math.round(H * D);
    const c = Math.ceil(W / cp()), r = Math.ceil(H / cp());
    if (c === C && r === R) return;
    C = c; R = r;
    type = new Uint8Array(C * R); col = new Uint32Array(C * R).fill(BG); stamp = new Uint8Array(C * R);
    off.width = C; off.height = R; img = octx.createImageData(C, R);
    // three slanted stone ledges for the sand to pile on and spill from
    const ledge = (x0, y0, x1, y1, th) => {
      const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0));
      for (let k = 0; k <= n; k++) {
        const x = Math.round(x0 + (x1 - x0) * k / n), y = Math.round(y0 + (y1 - y0) * k / n);
        for (let t = 0; t < th; t++) { const i = (y + t) * C + x; if (y + t < R && x >= 0 && x < C) { type[i] = STONE; const v = 46 + ((x + y) % 3) * 6; col[i] = rgb(v, v + 4, v + 14); } }
      }
    };
    const th = Math.max(2, Math.round(R * 0.012));
    ledge(C * 0.12 | 0, R * 0.38 | 0, C * 0.42 | 0, R * 0.48 | 0, th);
    ledge(C * 0.88 | 0, R * 0.52 | 0, C * 0.56 | 0, R * 0.62 | 0, th);
    ledge(C * 0.22 | 0, R * 0.74 | 0, C * 0.46 | 0, R * 0.7 | 0, th);
    free = 0; for (let i = 0; i < C * R; i++) if (type[i] !== STONE) free++;
  };
  const ro = new ResizeObserver(resize); ro.observe(stage); resize();

  let filled = 0, draining = false;
  const move = (i, j) => { type[j] = type[i]; col[j] = col[i]; stamp[j] = tick; type[i] = EMPTY; col[i] = BG; };
  const swap = (i, j) => { const t = type[i], c = col[i]; type[i] = type[j]; col[i] = col[j]; type[j] = t; col[j] = c; stamp[j] = tick; stamp[i] = tick; };
  const step = () => {
    tick = (tick + 1) & 255 || 1;
    if (draining) for (let x = 0; x < C; x++) { const i = (R - 1) * C + x; if (type[i] === SAND || type[i] === WATER) { type[i] = EMPTY; col[i] = BG; } }
    for (let y = R - 2; y >= 0; y--) {
      const ltr = Math.random() < 0.5;
      for (let k = 0; k < C; k++) {
        const x = ltr ? k : C - 1 - k, i = y * C + x, t = type[i];
        if ((t !== SAND && t !== WATER) || stamp[i] === tick) continue;
        const b = i + C, dl = x > 0 ? b - 1 : -1, dr = x < C - 1 ? b + 1 : -1;
        const first = Math.random() < 0.5 ? dl : dr, second = first === dl ? dr : dl;
        if (t === SAND) {
          if (type[b] === EMPTY) move(i, b);
          else if (type[b] === WATER) swap(i, b);
          else if (first >= 0 && type[first] === EMPTY) move(i, first);
          else if (second >= 0 && type[second] === EMPTY) move(i, second);
        } else {
          if (type[b] === EMPTY) move(i, b);
          else if (first >= 0 && type[first] === EMPTY) move(i, first);
          else if (second >= 0 && type[second] === EMPTY) move(i, second);
          else {
            // spread sideways a few cells
            const s = Math.random() < 0.5 ? -1 : 1; let j = i;
            for (let n = 1; n <= 3; n++) { const xx = x + s * n; if (xx < 0 || xx >= C || type[y * C + xx] !== EMPTY) break; j = y * C + xx; }
            if (j !== i) move(i, j);
          }
        }
      }
    }
  };

  // pouring: from the pointer while it’s over the stage, otherwise from a ghost spout drifting along the top
  let px = 0, py = 0, lastPointer = -1e9, pressed = false;
  const pm = e => { const r = canvas.getBoundingClientRect(); px = (e.clientX - r.left) / cp(); py = (e.clientY - r.top) / cp(); lastPointer = performance.now(); };
  const pd = e => { pressed = true; pm(e); };
  const pu = () => { pressed = false; };
  stage.addEventListener('pointermove', pm); stage.addEventListener('pointerdown', pd); addEventListener('pointerup', pu);
  const pour = (x, y, n, t) => {
    for (let k = 0; k < n; k++) {
      const a = Math.random() * 6.283, r = Math.sqrt(Math.random()) * 3.2;
      const X = Math.round(x + Math.cos(a) * r), Y = Math.round(y + Math.sin(a) * r);
      if (X < 0 || X >= C || Y < 0 || Y >= R) continue;
      const i = Y * C + X; if (type[i] !== EMPTY) continue;
      if (Math.random() < PARAMS.water) { type[i] = WATER; col[i] = waterColour(); } else { type[i] = SAND; col[i] = sandColour(t); }
    }
  };

  const draw = () => {
    const p = new Uint32Array(img.data.buffer);
    let n = 0;
    for (let i = 0; i < C * R; i++) { p[i] = col[i]; if (type[i] === SAND || type[i] === WATER) n++; }
    filled = n / free;
    octx.putImageData(img, 0, 0);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(off, 0, 0, C * cp() * D, R * cp() * D);
  };

  let raf, frameN = 0; const t0 = performance.now();
  // reduced motion: pour for a few seconds up front, so the still shows piles
  if (reduce) for (let k = 0; k < 420; k++) { const t = k / 60; pour(C * (0.5 + 0.36 * Math.sin(t * 0.45)), R * 0.08, Math.round(PARAMS.rate), t); step(); step(); step(); }
  function frame(now) {
    const t = (now - t0) / 1000;
    frameN++;
    if (!reduce || frameN % 12 === 0) {
      const live = now - lastPointer < 1500;
      const gx = C * (0.5 + 0.36 * Math.sin(t * 0.45) + 0.06 * Math.sin(t * 1.3)), gy = R * 0.08;
      if (!draining) pour(live ? px : gx, live ? py : gy, Math.round(PARAMS.rate * (pressed ? 2 : 1)), t);
      step(); step(); step();
      if (!draining && filled > 0.42) draining = true;
      if (draining && filled < 0.04) draining = false;
    }
    draw();
    raf = requestAnimationFrame(frame);
  }
  raf = requestAnimationFrame(frame);
  return () => { cancelAnimationFrame(raf); ro.disconnect(); stage.removeEventListener('pointermove', pm); stage.removeEventListener('pointerdown', pd); removeEventListener('pointerup', pu); canvas.remove(); };
}
