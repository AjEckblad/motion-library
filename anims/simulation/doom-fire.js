// The PlayStation Doom fire. A grid of heat values 0–36; the bottom row is held at 36. Every frame each cell copies
// its heat to the cell above, randomly nudged one column left or right and randomly cooled by 0 or 1. That’s the
// whole algorithm: the random cooling makes the flame tongues, the random sideways copy makes them lick and sway, and
// a 37-colour palette from black through red and yellow to white does the rest. Every so often the source goes out
// and the fire collapses, then it reignites. Wind skews the sideways copy; drag to add heat.
const PARAMS = { wind: 0.5, pixel: 5, height: 1 };

export default function (stage) {
  const canvas = document.createElement('canvas');
  canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block;touch-action:none';
  stage.append(canvas);
  const ctx = canvas.getContext('2d');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const off = document.createElement('canvas'), octx = off.getContext('2d');
  // the 37-entry fire ramp, black -> deep red -> orange -> gold -> white (the original’s, with its olive yellows warmed)
  const RAMP = [
    0x0a0709, 0x1f0707, 0x2f0f07, 0x470f07, 0x571707, 0x671f07, 0x771f07, 0x8f2707, 0x9f2f07, 0xaf3f07, 0xbf4707, 0xc74707,
    0xdf4f07, 0xdf5707, 0xdf5707, 0xd75f07, 0xd75f07, 0xd7670f, 0xcf6f0f, 0xcf770f, 0xcf7f0f, 0xcf8717, 0xc78717, 0xc78f17,
    0xd79a1f, 0xdfa327, 0xdfa327, 0xe7ae2f, 0xe7ae2f, 0xefb837, 0xf0bf3f, 0xf4c747, 0xf7d055, 0xfadc7a, 0xfce8a8, 0xfff4d6, 0xffffff];
  const PAL = new Uint32Array(37);
  RAMP.forEach((c, i) => { PAL[i] = 0xff000000 | ((c & 255) << 16) | (c & 0xff00) | (c >> 16); });
  let W = 0, H = 0, D = 1, C = 0, R = 0, fire, img;
  const px = () => Math.max(2, Math.round(PARAMS.pixel));
  const resize = () => {
    D = Math.min(devicePixelRatio, 2); W = stage.clientWidth || 1; H = stage.clientHeight || 1;
    canvas.width = Math.round(W * D); canvas.height = Math.round(H * D);
    const c = Math.ceil(W / px()), r = Math.ceil(H / px());
    if (c === C && r === R) return;
    C = c; R = r; fire = new Uint8Array(C * R); off.width = C; off.height = R; img = octx.createImageData(C, R);
    for (let i = 0; i < R * 1.5; i++) spread();
  };
  let source = 36;
  const spread = () => {
    const wind = Math.max(-1, Math.min(1, PARAMS.wind));
    // cooling odds per row (the original uses 0.5), scaled so the flames reach about half-way up any stage
    const cool = Math.max(0.05, Math.min(0.95, 36 / (0.68 * R * Math.max(0.2, PARAMS.height))));
    for (let x = 0; x < C; x++) fire[(R - 1) * C + x] = source;
    for (let y = 1; y < R; y++) {
      for (let x = 0; x < C; x++) {
        const src = y * C + x, p = fire[src];
        if (p === 0) { fire[src - C] = 0; continue; }
        // the original: one random r in 0..3 picks both the sideways step (1 - r) and whether to cool (r & 1)
        const r = Math.random() * 4 | 0;
        let dx = 1 - r;
        if (Math.random() < Math.abs(wind)) dx += wind > 0 ? 1 : -1;
        let nx = x + dx; if (nx < 0) nx += C; else if (nx >= C) nx -= C;
        const v = p - ((r & 1) && Math.random() < cool * 2 ? 1 : 0);
        fire[(y - 1) * C + nx] = v > 0 ? v : 0;
      }
    }
  };

  const ro = new ResizeObserver(resize); ro.observe(stage); resize();

  let down = false, hx = -1, hy = -1;
  const pm = e => { const r = canvas.getBoundingClientRect(); hx = (e.clientX - r.left) / px() | 0; hy = (e.clientY - r.top) / px() | 0; };
  const pd = e => { down = true; pm(e); };
  const pu = () => { down = false; };
  stage.addEventListener('pointermove', pm); stage.addEventListener('pointerdown', pd); addEventListener('pointerup', pu);

  const draw = () => {
    const p = new Uint32Array(img.data.buffer);
    for (let i = 0; i < C * R; i++) p[i] = PAL[fire[i]];
    octx.putImageData(img, 0, 0);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(off, 0, 0, C * px() * D, R * px() * D);
  };

  let raf, n = 0; const t0 = performance.now();
  function frame(now) {
    const t = ((now - t0) / 1000) % 18;
    source = t > 15 && t < 16.4 ? 0 : 36;          // the source goes out briefly, then reignites
    if (down && hx >= 0) for (let y = -3; y <= 3; y++) for (let x = -3; x <= 3; x++) {
      const X = hx + x, Y = hy + y; if (X >= 0 && X < C && Y >= 0 && Y < R && x * x + y * y <= 9) fire[Y * C + X] = 36;
    }
    if (!reduce || n++ % 10 === 0) spread();
    draw();
    raf = requestAnimationFrame(frame);
  }
  raf = requestAnimationFrame(frame);
  return () => { cancelAnimationFrame(raf); ro.disconnect(); stage.removeEventListener('pointermove', pm); stage.removeEventListener('pointerdown', pd); removeEventListener('pointerup', pu); canvas.remove(); };
}
