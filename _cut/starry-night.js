// Starry night in brushstrokes: a painting made only of strokes, laid down thousands per second, after Van Gogh.
// The sky is one stream function: a long wave across it, two swirls locked together in the middle, and a bump around
// every star and the moon. Its contour lines are the flow, so every stroke follows the swirl it sits in, and the
// colour bands come from the same function, so stripes of colour run along the strokes as his do. Each stroke is a
// few bristles side by side with a lighter edge for the ridge of paint. The sky keeps turning; new strokes keep
// painting over old ones. Move the pointer to stir it.
const PARAMS = { strokes: 320, size: 1, swirl: 1 };

export default function (stage) {
  const canvas = document.createElement('canvas');
  canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block;background:#e9dfc8';
  stage.append(canvas);
  const ctx = canvas.getContext('2d');
  let W = 1, H = 1, A = 1, D = 1, painted = 0;
  const resize = () => {
    D = Math.min(devicePixelRatio, 2); const w = stage.clientWidth || 1, h = stage.clientHeight || 1;
    canvas.width = Math.max(1, (w * D) | 0); canvas.height = Math.max(1, (h * D) | 0); W = w; H = h; A = w / h;
    ctx.setTransform(D, 0, 0, D, 0, 0); ctx.fillStyle = '#e9dfc8'; ctx.fillRect(0, 0, W, H); painted = 0;   // a fresh canvas
  };
  const ro = new ResizeObserver(resize); ro.observe(stage); resize();

  // the scene, in units of the stage height: x from 0 to A, y from 0 (top) to 1
  const STARS = [[0.07, 0.12, 0.035], [0.25, 0.08, 0.03], [0.37, 0.2, 0.028], [0.55, 0.1, 0.03], [0.66, 0.24, 0.026], [0.78, 0.36, 0.03],
    [0.47, 0.48, 0.022], [0.92, 0.46, 0.024], [0.2, 0.33, 0.026], [0.98, 0.3, 0.02]];
  const MOON = [0.88, 0.15, 0.05];
  const hill = u => 0.66 + 0.04 * Math.sin(u * 7 + 1) + 0.025 * Math.sin(u * 15 + 2);
  const cypress = (u, y, t) => {                                // > 0 inside the flame-shaped tree
    if (y < 0.1) return -1;
    const k = (y - 0.1) / 0.9, cx = 0.15 + 0.012 * Math.sin(y * 22 + t * 0.8) * (1 - k), w = 0.065 * Math.pow(Math.sin(Math.PI * Math.min(1, k * 0.62 + 0.04)), 0.8);
    return w - Math.abs(u - cx);
  };
  const h1 = n => { const s = Math.sin(n * 127.1) * 43758.5453; return s - Math.floor(s); };
  const houseAt = (u, y) => {                                   // the village: returns 0 none, 1 wall, 2 roof, 3 window
    if (u < 0.32 || u > 0.9) return 0;
    const cell = Math.floor(u / 0.045), r = h1(cell), base = hill(cell * 0.045 + 0.022) + 0.05 + r * 0.07;
    const fx = u / 0.045 - cell, top = base - 0.035 - r * 0.025;
    if (Math.abs(u - 0.6) < 0.0055 * Math.min(1, (y - 0.5) / 0.1) && y > 0.5 && y < base) return 2;   // the church spire
    if (fx < 0.08 || fx > 0.92 || y < top - 0.018 || y > base) return 0;
    if (y < top) return Math.abs(fx - 0.5) < (y - top + 0.018) / 0.018 * 0.45 ? 2 : 0;
    return h1(cell * 3.1 + Math.floor((y - top) / 0.014)) > 0.5 && Math.abs(fx - 0.5) < 0.2 ? 3 : 1;
  };
  const VORT = [[0.44, 0.37, 0.13, 0.085], [0.6, 0.31, 0.1, -0.075], [0.75, 0.47, 0.065, 0.035], [0.27, 0.5, 0.075, -0.03]];
  const ptr = { x: 0, y: 0, s: 0, on: false };
  // the sky's stream function: flow runs along its contours
  const psi = (x, y, t) => {
    const u = x / A, sw = PARAMS.swirl;
    let s = y + 0.03 * Math.sin(u * 9 + t * 0.25) + 0.018 * Math.sin(u * 17 - y * 6 - t * 0.2);
    for (const [vu, vy, r, g] of VORT) { const dx = (u - vu) * A, dy = y - vy; s += g * sw * Math.exp(-(dx * dx + dy * dy) / (r * r)) * (1 + 0.15 * Math.sin(t * 0.4 + vu * 9)); }
    for (const [su, sy, r] of [...STARS, MOON]) { const dx = (u - su) * A, dy = y - sy; s += 0.02 * Math.exp(-(dx * dx + dy * dy) / (r * r * 4)); }
    if (ptr.s > 0.01) { const dx = x - ptr.x, dy = y - ptr.y; s += 0.06 * ptr.s * Math.exp(-(dx * dx + dy * dy) / 0.012); }
    return s;
  };
  const mix = (a, b, k) => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];
  const C = { deep: [23, 50, 128], mid: [43, 92, 182], light: [116, 172, 214], pale: [214, 230, 200], core: [255, 247, 207], gold: [246, 214, 74],
    lime: [214, 226, 136], teal: [140, 196, 196], moon: [244, 182, 58], cy1: [14, 22, 20], cy2: [30, 48, 34], cy3: [58, 76, 46],
    h1: [22, 36, 66], h2: [38, 64, 104], h3: [64, 96, 118], wall: [98, 116, 150], roof: [30, 42, 78], win: [246, 210, 80], ground: [28, 48, 52] };
  // where a stroke at (x, y) points, and what colour it carries; also the stroke's scale for that region
  function sample(x, y, t) {
    const u = x / A, hy = hill(u), cyp = cypress(u, y, t), house = houseAt(u, y);
    if (cyp > 0) {                                                // the cypress: upward, flickering flames
      const a = -Math.PI / 2 + 0.75 * Math.sin(y * 26 + u * 60 + t * 0.6) + 0.3 * Math.sin(y * 71);   // curling upward like flames
      const k = 0.5 + 0.5 * Math.sin(y * 40 + u * 120 + Math.sin(y * 13) * 3);
      return { a, c: k < 0.33 ? C.cy1 : k < 0.75 ? C.cy2 : C.cy3, s: 0.85 };
    }
    if (house) return { a: house === 2 ? -Math.PI / 2 : (Math.floor(y * 200) % 2 ? 0 : Math.PI / 2), c: house === 3 ? C.win : house === 2 ? C.roof : C.wall, s: 0.38 };
    if (y > hy) {                                                 // the hills: strokes follow their curves
      const e = 0.002, dy = (hill(u + e) - hill(u - e)) / (2 * e * A), band = 0.5 + 0.5 * Math.sin((y - hy) * 70 + u * 3);
      const deep = Math.min(1, (y - hy) / 0.3);
      return { a: Math.atan(dy) + 0.15 * Math.sin(u * 40 + y * 30), c: mix(mix(C.h3, C.h2, band), mix(C.h1, C.ground, band), deep), s: 0.8 };
    }
    // the sky
    const e = 0.004, gx = (psi(x + e, y, t) - psi(x - e, y, t)) / (2 * e), gy = (psi(x, y + e, t) - psi(x, y - e, t)) / (2 * e);
    const a = Math.atan2(-gx, gy);                                // along the contour
    const v = psi(x, y, t), band = 0.5 + 0.5 * Math.sin(v * 75);
    let c = mix(mix(C.deep, C.mid, band), C.light, Math.max(0, Math.sin(v * 31 + 1)) ** 3 * 0.8);
    for (const [vu, vy, r] of VORT) { const d = Math.hypot((u - vu) * A, y - vy) / r; if (d < 1.3) c = mix(c, Math.sin(v * 140) > 0 ? C.pale : C.light, (1 - d / 1.3) * 0.8); }   // the swirls are lighter, ringed
    for (const [su, sy, r] of STARS) {                            // stars: a hot core inside rings of gold and green
      const d = Math.hypot((u - su) * A, y - sy) / r;
      if (d < 0.38) c = C.core; else if (d < 1) c = mix(Math.sin(d * 18) > 0 ? C.gold : C.core, c, (d - 0.38) * 0.4);
      else if (d < 1.7) c = mix(Math.sin(d * 14) > 0 ? C.lime : C.teal, c, (d - 1) / 0.7);
    }
    const md = Math.hypot((u - MOON[0]) * A, y - MOON[1]) / MOON[2], inner = Math.hypot((u - MOON[0] - 0.02) * A, y - MOON[1] + 0.012) / MOON[2];
    if (md < 1 && inner > 0.82) c = C.moon; else if (md < 1) c = C.core; else if (md < 2.4) c = mix(Math.sin(md * 10) > 0 ? C.gold : C.lime, c, (md - 1) / 1.4);
    return { a, c, s: 1 };
  }

  function stroke(t, big) {
    const x = Math.random() * A, y = Math.random();
    const f = sample(x, y, t), L = (0.03 + Math.random() * 0.04) * f.s * PARAMS.size * (big ? 1.6 : 1), w = (0.006 + Math.random() * 0.005) * f.s * PARAMS.size * (big ? 2.4 : 1);
    // walk the field to bend the stroke along the flow
    const pts = [[x, y]]; let px = x, py = y, a = f.a;
    for (let i = 0; i < 5; i++) { px += Math.cos(a) * L / 5; py += Math.sin(a) * L / 5; pts.push([px, py]); a = sample(px, py, t).a; if (Math.abs(a - f.a) > 1.2) break; }
    const j = (Math.random() - 0.5) * 26, base = f.c.map(v => Math.max(0, Math.min(255, v + j)));
    const nx = -Math.sin(f.a), ny = Math.cos(f.a);
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    for (let b = 0; b < 4; b++) {                                 // bristles, side by side
      const off = (b / 3 - 0.5) * w, k = b === 0 ? 1.18 : b === 3 ? 0.84 : 1 + (Math.random() - 0.5) * 0.12;
      ctx.strokeStyle = `rgb(${Math.min(255, base[0] * k) | 0},${Math.min(255, base[1] * k) | 0},${Math.min(255, base[2] * k) | 0})`;
      ctx.lineWidth = Math.max(0.6, (w / 3.6) * H * (0.85 + Math.random() * 0.35));
      ctx.beginPath();
      for (let i = 0; i < pts.length; i++) { const taper = i === 0 || i === pts.length - 1 ? 0.6 : 1; const X = (pts[i][0] + nx * off * taper) * H, Y = (pts[i][1] + ny * off * taper) * H; i ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y); }
      ctx.stroke();
    }
  }

  const move = e => { const r = canvas.getBoundingClientRect(); ptr.x = (e.clientX - r.left) / r.height; ptr.y = (e.clientY - r.top) / r.height; ptr.on = true; };
  const leave = () => { ptr.on = false; };
  canvas.addEventListener('pointermove', move); canvas.addEventListener('pointerleave', leave);
  let raf, last = performance.now(), t = 0;
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000); last = now; t += dt;
    ptr.s += ((ptr.on ? 1 : 0) - ptr.s) * Math.min(1, dt * 3);
    // the first second lays a broad underpainting fast, then the fine strokes take over
    const n = painted < 9000 ? 700 : Math.round(PARAMS.strokes);
    for (let i = 0; i < n; i++) stroke(t, painted + i < 4500);
    painted += n;
    raf = requestAnimationFrame(frame);
  }
  raf = requestAnimationFrame(frame);
  return () => { cancelAnimationFrame(raf); ro.disconnect(); canvas.removeEventListener('pointermove', move); canvas.removeEventListener('pointerleave', leave); canvas.remove(); };
}
