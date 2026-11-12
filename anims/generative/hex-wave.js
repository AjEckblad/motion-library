// Hex wave: a honeycomb of prisms lit by travelling waves. A slow swell rolls diagonally across the grid, and every
// tap (or, when idle, a ghost tap) sends out a ring: a pulse whose radius grows at constant speed, followed by two
// fainter echoes. Each cell sums the swell and every live ring at its own distance, so rings pass through each other
// and brighten where they cross. Height lifts the prism and heats its top from indigo through cyan to white.
const PARAMS = { cell: 16, speed: 1, lift: 1 };

export default function (stage) {
  const canvas = document.createElement('canvas');
  canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block;touch-action:none';
  stage.append(canvas);
  const ctx = canvas.getContext('2d');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let W = 0, H = 0, D = 1, px = [], py = [], R = 16;
  function build() {
    R = PARAMS.cell; const dx = Math.sqrt(3) * R, dy = 1.5 * R;
    const cols = Math.ceil(W / dx) + 2, rows = Math.ceil(H / dy) + 3; px = []; py = [];
    for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) { px.push((i - .5 + (j & 1) * .5) * dx); py.push((j - 1) * dy); }
  }
  const resize = () => { D = Math.min(devicePixelRatio, 2); W = stage.clientWidth || 1; H = stage.clientHeight || 1; canvas.width = W * D | 0; canvas.height = H * D | 0; build(); };
  const ro = new ResizeObserver(resize); ro.observe(stage); resize();

  const rings = [];   // { x, y, t0, a }
  let T = 0, lastSeed = -1, lastMove = -1e9, lastP = null;
  const seed = (x, y, a) => { rings.push({ x, y, t0: T, a }); if (rings.length > 14) rings.shift(); };
  const pos = e => { const r = stage.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
  const onMove = e => { const p = pos(e); lastMove = performance.now(); if (!lastP || Math.hypot(p[0] - lastP[0], p[1] - lastP[1]) > R * 5) { seed(p[0], p[1], .55); lastP = p; } };
  const onDown = e => { const p = pos(e); lastMove = performance.now(); seed(p[0], p[1], 1.2); lastP = p; };
  stage.addEventListener('pointermove', onMove); stage.addEventListener('pointerdown', onDown);

  const ang = [-90, -30, 30, 90, 150, 210].map(a => a * Math.PI / 180), cs = ang.map(Math.cos), sn = ang.map(Math.sin);
  const STOPS = [[0, 12, 16, 38], [.4, 22, 96, 196], [.72, 56, 206, 246], [1, 240, 253, 255]];
  const ramp = b => { let i = 0; while (i < STOPS.length - 2 && b > STOPS[i + 1][0]) i++; const A = STOPS[i], B = STOPS[i + 1], f = Math.max(0, Math.min(1, (b - A[0]) / (B[0] - A[0])));
    return `rgb(${A[1] + (B[1] - A[1]) * f | 0},${A[2] + (B[2] - A[2]) * f | 0},${A[3] + (B[3] - A[3]) * f | 0})`; };
  const SPEED = 230, LIFE = 3.2;
  let raf, last = performance.now(), ghostAt = .2;
  if (reduce) { T = 1.1; seed(W * .38, H * .45, 1); rings[0].t0 = 0; }
  function frame(now) {
    const dt = Math.min(.05, (now - last) / 1000); last = now;
    if (!reduce) {
      T += dt * PARAMS.speed;
      if (now - lastMove > 2500 && T > ghostAt) { seed(W * (.15 + .7 * Math.random()), H * (.15 + .7 * Math.random()), .9 + Math.random() * .3); ghostAt = T + 1.3 + Math.random() * .9; }
    }
    while (rings.length && T - rings[0].t0 > LIFE) rings.shift();
    ctx.setTransform(D, 0, 0, D, 0, 0);
    ctx.fillStyle = '#06080e'; ctx.fillRect(0, 0, W, H);
    const r = R * .92, K = 9 * PARAMS.lift, w = R * 1.25;
    for (let k = 0; k < px.length; k++) {
      const x = px[k], y = py[k];
      let h = .1 * Math.sin((x * .6 + y) * .012 - T * 1.3) + .05 * Math.sin((x - y * .4) * .021 + T * .9);   // the swell
      for (const g of rings) {
        const age = T - g.t0, d = Math.hypot(x - g.x, y - g.y) - SPEED * age, fade = g.a * (1 - age / LIFE) ** 1.5;
        if (d > w * 3 || d < -w * 9) continue;
        // a bright front, then two weaker echoes trailing behind it
        h += fade * (Math.exp(-(d * d) / (w * w)) + .45 * Math.exp(-((d + w * 3.2) ** 2) / (w * w)) + .2 * Math.exp(-((d + w * 6.4) ** 2) / (w * w)));
      }
      const e = Math.tanh(h * 1.6), b = Math.max(0, .1 + e * .9), lift = Math.max(0, 1.5 + e * K);
      ctx.beginPath();
      for (let q = 0; q < 6; q++) { const up = q === 0 || q === 1 || q === 5 ? lift : 0; const X = x + cs[q] * r, Y = y + sn[q] * r - up; q ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y); }
      ctx.closePath(); ctx.fillStyle = `rgb(${6 + 24 * b | 0},${10 + 50 * b | 0},${22 + 80 * b | 0})`; ctx.fill();
      ctx.beginPath();
      for (let q = 0; q < 6; q++) { const X = x + cs[q] * r, Y = y + sn[q] * r - lift; q ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y); }
      ctx.closePath(); ctx.fillStyle = ramp(b); ctx.fill();
    }
    raf = requestAnimationFrame(frame);
  }
  raf = requestAnimationFrame(frame);
  return () => { cancelAnimationFrame(raf); ro.disconnect(); stage.removeEventListener('pointermove', onMove); stage.removeEventListener('pointerdown', onDown); canvas.remove(); };
}
