// Falling sand: a cellular automaton on a grid of fine grains, where every cell is empty, dry sand, wet sand, water
// or stone. Each step, scanning from the bottom up, a grain falls if the cell below is free, gaining speed as it goes
// (so a poured stream thins out and a dropped pile falls as one); otherwise it slides diagonally, and now and then two
// cells over, so dry dunes settle at a gentler slope than 45 degrees. Water also spreads sideways. Every so often the
// spout pours a short burst of water instead of sand: it runs down the dunes, darkens the sand it flows over, pools in
// the hollows and slowly soaks in, leaving damp sand behind. Sand sinks through deep water and comes out wet; wet sand
// does not take the gentler slide, so it holds a steeper face. Stone never moves. The grid is split into 32-cell
// chunks and a chunk where nothing moved sleeps until a neighbour wakes it, so settled dunes cost nothing. The sand is
// poured in desert tones that drift slowly, so the pile records its own history in strata, and every grain gets its
// own shade, with the odd dark mineral speck and pale quartz grain. The cells are written into an ImageData at grid
// size and drawn scaled up without smoothing. When the box is nearly full, the floor opens and it drains out.
const PARAMS = { rate: 200, water: 0.08, cell: 1.5 };

export default function (stage) {
  const canvas = document.createElement('canvas');
  canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block;touch-action:none';
  stage.append(canvas);
  const ctx = canvas.getContext('2d');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const off = document.createElement('canvas'), octx = off.getContext('2d');
  const EMPTY = 0, SAND = 1, WATER = 2, STONE = 3, WET = 4;
  const VMAX = 10, STEPS = 2;                      // cells per step at full speed; steps per frame
  let W = 0, H = 0, D = 1, C = 0, R = 0, CW = 1, CH = 1, cell = 1.5, tick = 0, free = 1, filled = 0, draining = false;
  let type, col, vel, stamp, bg, img, pix, awake, woken;
  const rgb = (r, g, b) => (0xff000000 | (b << 16) | (g << 8) | r) >>> 0;
  const cl = v => v < 0 ? 0 : v > 255 ? 255 : v | 0;

  // desert tones for the strata, in pouring order: buff, honey, ochre, rose clay, pale sand, umber
  const BANDS = [[226, 205, 164], [214, 176, 118], [198, 145, 86], [186, 128, 98], [234, 216, 180], [164, 116, 78]];
  const sandColour = t => {
    const f = (t * 0.3) % BANDS.length, i = f | 0, u = f - i, a = BANDS[i], b = BANDS[(i + 1) % BANDS.length];
    const s = u < 0.55 ? 0 : (u - 0.55) / 0.45, m = s * s * (3 - 2 * s);   // hold a band, then ease into the next
    let r = a[0] + (b[0] - a[0]) * m, g = a[1] + (b[1] - a[1]) * m, bl = a[2] + (b[2] - a[2]) * m;
    const q = Math.random();
    if (q < 0.015) { r *= 0.42; g *= 0.4; bl *= 0.4; }                                            // a dark mineral speck
    else if (q < 0.05) { r += (250 - r) * 0.45; g += (245 - g) * 0.45; bl += (234 - bl) * 0.45; }  // a pale quartz grain
    else { const j = 0.86 + Math.random() * 0.2; r *= j; g *= j; bl *= j; }
    return rgb(cl(r + (Math.random() - 0.5) * 8), cl(g + (Math.random() - 0.5) * 8), cl(bl + (Math.random() - 0.5) * 8));
  };
  const darken = c => rgb((c & 255) * 0.6, ((c >>> 8) & 255) * 0.55, ((c >>> 16) & 255) * 0.5);   // wet sand
  const waterColour = () => rgb(38 + Math.random() * 12, 88 + Math.random() * 14, 112 + Math.random() * 18);
  const HL = rgb(255, 228, 200), WHL = rgb(150, 194, 206);   // dusk light on dune crests, and on the water's surface

  // a chunk (32 x 32 cells) is simulated next step if anything moved in it or at its edge
  const wake = (x, y) => {
    const x0 = x > 0 ? (x - 1) >> 5 : 0, x1 = Math.min(CW - 1, (x + 1) >> 5), y0 = y > 0 ? (y - 1) >> 5 : 0, y1 = Math.min(CH - 1, (y + 1) >> 5);
    woken[y0 * CW + x0] = 1; if (x1 !== x0) woken[y0 * CW + x1] = 1;
    if (y1 !== y0) { woken[y1 * CW + x0] = 1; if (x1 !== x0) woken[y1 * CW + x1] = 1; }
  };

  const resize = () => {
    D = Math.min(devicePixelRatio, 2); W = stage.clientWidth || 1; H = stage.clientHeight || 1;
    canvas.width = Math.round(W * D); canvas.height = Math.round(H * D);
    cell = Math.max(1, Math.min(4, PARAMS.cell));
    const c = Math.ceil(W / cell), r = Math.ceil(H / cell);
    if (c === C && r === R) { if (reduce) draw(); return; }
    C = c; R = r; CW = Math.ceil(C / 32); CH = Math.ceil(R / 32);
    type = new Uint8Array(C * R); col = new Uint32Array(C * R); vel = new Uint8Array(C * R); stamp = new Uint8Array(C * R); bg = new Uint32Array(C * R);
    awake = new Uint8Array(CW * CH); woken = new Uint8Array(CW * CH).fill(1);
    off.width = C; off.height = R; img = octx.createImageData(C, R); pix = new Uint32Array(img.data.buffer);
    // a soft dusk: deep blue-violet overhead, warming to a dusty rose low down, with a little dither against banding
    for (let y = 0; y < R; y++) {
      const u = y / Math.max(1, R - 1), a = Math.min(1, u / 0.62), b = Math.max(0, (u - 0.62) / 0.38);
      const r0 = 26 + 26 * a + 36 * b, g0 = 28 + 12 * a + 18 * b, b0 = 46 + 14 * a + 2 * b;
      for (let x = 0, i = y * C; x < C; x++, i++) { const d = (Math.random() - 0.5) * 3; bg[i] = rgb(cl(r0 + d), cl(g0 + d), cl(b0 + d)); }
    }
    // three slanted sandstone ledges for the sand to pile on and spill from
    const ledge = (x0, y0, x1, y1, th) => {
      const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0));
      for (let k = 0; k <= n; k++) {
        const x = Math.round(x0 + (x1 - x0) * k / n), y = Math.round(y0 + (y1 - y0) * k / n);
        for (let t = 0; t < th; t++) if (y + t < R && x >= 0 && x < C) type[(y + t) * C + x] = STONE;
      }
    };
    const th = Math.max(3, Math.round(R * 0.018));
    ledge(C * 0.12 | 0, R * 0.38 | 0, C * 0.42 | 0, R * 0.48 | 0, th);
    ledge(C * 0.88 | 0, R * 0.52 | 0, C * 0.56 | 0, R * 0.62 | 0, th);
    ledge(C * 0.22 | 0, R * 0.74 | 0, C * 0.46 | 0, R * 0.7 | 0, th);
    // the slabs: warm dark stone, lit along the top edge by the sky and darker underneath
    free = 0;
    for (let i = 0; i < C * R; i++) {
      if (type[i] !== STONE) { free++; continue; }
      const top = i < C || type[i - C] !== STONE, under = i + C >= C * R || type[i + C] !== STONE, n = (Math.random() - 0.5) * 10;
      col[i] = top ? rgb(cl(128 + n), cl(102 + n), cl(90 + n)) : under ? rgb(cl(34 + n), cl(27 + n), cl(30 + n)) : rgb(cl(70 + n), cl(56 + n), cl(54 + n));
    }
    filled = 0; draining = false;
    if (reduce) prefill();
  };

  const move = (i, j, x, y, x2, y2) => {
    type[j] = type[i]; col[j] = col[i]; vel[j] = vel[i]; stamp[j] = tick;
    type[i] = EMPTY; vel[i] = 0;
    wake(x, y); wake(x2, y2);
  };
  // free fall: speed up by one cell per step and drop as far as that allows, drifting a little sideways in the air
  const fall = (i, x, y) => {
    let v = vel[i] + (Math.random() < 0.75 ? 1 : 0); if (v > VMAX) v = VMAX;
    let j = i + C, yy = y + 1, xx = x;
    while (yy < R - 1 && yy - y < v && type[j + C] === EMPTY) { j += C; yy++; }
    if (v > 4 && Math.random() < 0.03) { const s = Math.random() < 0.5 ? -1 : 1, x2 = xx + s; if (x2 >= 0 && x2 < C && type[j + s] === EMPTY) { j += s; xx = x2; } }
    vel[i] = v; move(i, j, x, y, xx, yy);
  };
  const grain = (i, x, y, t) => {
    const b = i + C, tb = type[b];
    if (tb === EMPTY) { fall(i, x, y); return; }
    vel[i] = 0;
    if (tb === WATER) {
      // landing on a film of water over solid ground, the grain soaks it up and drops into its place, wet
      const t2 = y + 2 < R ? type[b + C] : STONE;
      if (t2 !== WATER && t2 !== EMPTY) { type[b] = WET; col[b] = t === WET ? col[i] : darken(col[i]); vel[b] = 0; stamp[b] = tick; type[i] = EMPTY; wake(x, y); wake(x, y + 1); return; }
      // in deeper water it sinks, slowly, swapping places with the water; the sand comes out wet
      if (Math.random() < 0.5) {
        const c = col[i]; type[i] = WATER; col[i] = col[b]; stamp[i] = tick;
        type[b] = WET; col[b] = t === WET ? c : darken(c); stamp[b] = tick; wake(x, y); wake(x, y + 1);
      } else wake(x, y);
      return;
    }
    const L = x > 0 && type[b - 1] === EMPTY, Rt = x < C - 1 && type[b + 1] === EMPTY;
    if (L || Rt) { const s = L && Rt ? (Math.random() < 0.5 ? -1 : 1) : L ? -1 : 1; move(i, b + s, x, y, x + s, y + 1); return; }
    // now and then two cells over, so dry dunes settle at a gentler slope than 45 degrees (wet sand holds a steeper face)
    if (t === SAND && Math.random() < 0.4) {
      const s = Math.random() < 0.5 ? -1 : 1, x2 = x + 2 * s;
      if (x2 >= 0 && x2 < C && type[i + s] === EMPTY && type[b + 2 * s] === EMPTY) move(i, b + 2 * s, x, y, x2, y + 1);
    }
  };
  const water = (i, x, y) => {
    const b = i + C, tb = type[b];
    if (tb === EMPTY) { fall(i, x, y); return; }
    vel[i] = 0;
    // water darkens the sand it runs over, and slowly soaks in, down through damp sand to the first dry grain under it
    if (tb === SAND || tb === WET) {
      wake(x, y);
      if (tb === SAND) { if (Math.random() < 0.3) { type[b] = WET; col[b] = darken(col[b]); } }
      else {
        // the damp reaches a few grains down for free; deeper than that, the water is used up
        const soak = Math.random() < 0.004;
        if (soak || Math.random() < 0.06) for (let j = b + C, n = 0; n < (soak ? 12 : 4) && j < C * R; n++, j += C) {
          const tj = type[j]; if (tj === SAND) { type[j] = WET; col[j] = darken(col[j]); if (soak) type[i] = EMPTY; return; }
          if (tj !== WET) break;
        }
      }
    }
    const L = x > 0 && type[b - 1] === EMPTY, Rt = x < C - 1 && type[b + 1] === EMPTY;
    if (L || Rt) { const s = L && Rt ? (Math.random() < 0.5 ? -1 : 1) : L ? -1 : 1; move(i, b + s, x, y, x + s, y + 1); return; }
    // spread sideways a few cells
    const s = Math.random() < 0.5 ? -1 : 1; let xx = x;
    for (let n = 1; n <= 5; n++) { const x2 = x + s * n; if (x2 < 0 || x2 >= C || type[i + s * n] !== EMPTY) break; xx = x2; }
    if (xx !== x) move(i, i + xx - x, x, y, xx, y);
  };
  const step = () => {
    tick = (tick + 1) & 255 || 1;
    const a = awake; awake = woken; woken = a; woken.fill(0);
    if (draining) { for (let x = 0, i = (R - 1) * C; x < C; x++, i++) if (type[i] !== EMPTY && type[i] !== STONE) { type[i] = EMPTY; vel[i] = 0; wake(x, R - 1); } }
    // water on the bare floor drains away slowly
    else for (let x = 0, i = (R - 1) * C; x < C; x++, i++) if (type[i] === WATER && Math.random() < 0.02) { type[i] = EMPTY; wake(x, R - 1); }
    for (let cy = CH - 1; cy >= 0; cy--) {
      let any = 0; for (let cx = 0; cx < CW; cx++) any |= awake[cy * CW + cx];
      if (!any) continue;
      const yTop = cy * 32, yBot = Math.min(R - 2, yTop + 31);
      for (let y = yBot; y >= yTop; y--) {
        const ltr = Math.random() < 0.5, row = y * C;
        for (let k = 0; k < CW; k++) {
          const cx = ltr ? k : CW - 1 - k; if (!awake[cy * CW + cx]) continue;
          const xa = cx * 32, xb = Math.min(C, xa + 32);
          if (ltr) { for (let x = xa; x < xb; x++) { const i = row + x, t = type[i]; if (t === EMPTY || t === STONE || stamp[i] === tick) continue; if (t === WATER) water(i, x, y); else grain(i, x, y, t); } }
          else for (let x = xb - 1; x >= xa; x--) { const i = row + x, t = type[i]; if (t === EMPTY || t === STONE || stamp[i] === tick) continue; if (t === WATER) water(i, x, y); else grain(i, x, y, t); }
        }
      }
    }
  };

  // pouring: from the pointer while it's over the stage, otherwise from a ghost spout drifting along the top
  let px = 0, py = 0, lastMove = -1e9, held = false, pressed = false;
  const pm = e => { const r = canvas.getBoundingClientRect(); px = (e.clientX - r.left) / cell; py = (e.clientY - r.top) / cell; lastMove = performance.now(); held = e.pointerType === 'mouse'; };
  const pl = () => { held = false; };
  const pd = e => { pressed = true; pm(e); };
  const pu = () => { pressed = false; };
  stage.addEventListener('pointermove', pm); stage.addEventListener('pointerleave', pl); stage.addEventListener('pointerdown', pd);
  addEventListener('pointerup', pu); addEventListener('pointercancel', pu);
  // the spout pours sand, with a short burst of water now and then (the water share is the share of the time)
  const pour = (x, y, n, t) => {
    const wet = (t % 14) / 14 > 1 - PARAMS.water;
    n = Math.round(n * Math.max(0.25, Math.min(1.5, W * H / (1280 * 760))));   // the rate is for a 1280 x 760 box
    // a stream about as wide as the pour is generous
    const r = Math.max(2, Math.sqrt(n) * 0.5), hgt = r * 3;
    for (let k = 0, placed = 0; k < n * 3 && placed < n; k++) {
      const X = Math.round(x + (Math.random() * 2 - 1) * r), Y = Math.round(y + Math.random() * hgt);
      if (X < 0 || X >= C || Y < 0 || Y >= R - 1) continue;
      // never onto a heap that has grown up to the spout, so it can't build a chimney
      const i = Y * C + X; if (type[i] !== EMPTY || (Y + 3 < R && type[i + 3 * C] !== EMPTY && vel[i + 3 * C] === 0)) continue;
      if (wet) { type[i] = WATER; col[i] = waterColour(); } else { type[i] = SAND; col[i] = sandColour(t); }
      vel[i] = 5; wake(X, Y); placed++;
    }
  };

  const draw = sparkle => {
    let n = 0;
    const N = C * R;
    for (let i = 0; i < N; i++) {
      const t = type[i];
      if (t === EMPTY) { pix[i] = bg[i]; continue; }
      let c = col[i];
      if (t !== STONE) {
        n++;
        const up = i >= C ? type[i - C] : EMPTY;
        // the top grain of a pile catches the sky; the water's surface is paler, and glints now and then
        if (up === EMPTY && t !== WATER && vel[i] === 0) c = ((((c >>> 2) & 0x3f3f3f) * 3 + ((HL >>> 2) & 0x3f3f3f)) | 0xff000000) >>> 0;
        else if (t === WATER) {
          // the surface is pale and glints now and then; just under it a little lighter; deeper water is darker
          if (up !== WATER) c = sparkle && Math.random() < 0.015 ? 0xffe8f4f6 : ((((c >>> 1) & 0x7f7f7f) + ((WHL >>> 1) & 0x7f7f7f)) | 0xff000000) >>> 0;
          else if (i >= 2 * C && type[i - 2 * C] !== WATER) c = ((((c >>> 2) & 0x3f3f3f) * 3 + ((WHL >>> 2) & 0x3f3f3f)) | 0xff000000) >>> 0;
          else if (i >= 6 * C && type[i - 6 * C] === WATER) c = (((c >>> 1) & 0x7f7f7f) + ((c >>> 2) & 0x3f3f3f) | 0xff000000) >>> 0;
        }
      }
      pix[i] = c;
    }
    filled = n / free;
    octx.putImageData(img, 0, 0);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(off, 0, 0, C * cell * D, R * cell * D);
  };

  // reduced motion: pour for a while up front and let it settle, so the still shows dunes, strata and a pool or two
  function prefill() {
    for (let k = 0; k < 520; k++) { const t = k / 60 * 1.6; pour(C * (0.5 + 0.38 * Math.sin(t * 0.45) + 0.06 * Math.sin(t * 1.3)), R * 0.06, Math.round(PARAMS.rate * 1.6), t); step(); step(); }
    for (let k = 0; k < 600; k++) { step(); if (!woken.some(v => v)) break; }
    draw(false);
  }

  const ro = new ResizeObserver(resize); ro.observe(stage); resize();
  let raf, lastFilled = 1, drainN = 0; const t0 = performance.now();
  function frame(now) {
    if (!reduce) {
      const t = (now - t0) / 1000, live = held || now - lastMove < 1800;
      const gx = C * (0.5 + 0.36 * Math.sin(t * 0.45) + 0.06 * Math.sin(t * 1.3)), gy = R * 0.06;
      if (!draining) pour(live ? px : gx, live ? py : gy, Math.round(PARAMS.rate * (pressed ? 2 : 1)), t);
      for (let s = 0; s < STEPS; s++) step();
      draw(true);
      // nearly full: open the floor until the box stops emptying (what rests on the ledges stays)
      if (!draining && filled > 0.42) { draining = true; lastFilled = filled; drainN = 0; }
      else if (draining && ++drainN % 30 === 0) { if (filled > lastFilled - 0.004 || filled < 0.03) draining = false; lastFilled = filled; }
    }
    raf = requestAnimationFrame(frame);
  }
  raf = requestAnimationFrame(frame);
  return () => { cancelAnimationFrame(raf); ro.disconnect(); stage.removeEventListener('pointermove', pm); stage.removeEventListener('pointerleave', pl); stage.removeEventListener('pointerdown', pd); removeEventListener('pointerup', pu); removeEventListener('pointercancel', pu); canvas.remove(); };
}
