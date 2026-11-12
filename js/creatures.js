// Little creatures drawn in code, in four materials: fur (fine to shaggy), jelly, chrome and knit. Each body is painted
// once to an offscreen sprite; every frame only the transform (breathing, hops, squash, roll) and the face animate.
const reduce = matchMedia('(prefers-reduced-motion: reduce)');
export const pointer = { x: innerWidth * 0.5, y: innerHeight * 0.5 };
addEventListener('pointermove', e => { pointer.x = e.clientX; pointer.y = e.clientY; }, { passive: true });

const hex = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
const rgb = (c, a = 1) => `rgba(${c.map(Math.round).join(',')},${a})`;
const mixc = (a, b, t) => a.map((v, i) => v + (b[i] - v) * Math.min(1, Math.max(0, t)));
const mix = (a, b, t) => rgb(mixc(a, b, t));
export const wob = (t, z = 0.28, w = 20) => t <= 0 ? 0 : Math.exp(-z * w * t) * Math.sin(w * Math.sqrt(1 - z * z) * t);
function rng(seed) { return () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; }; }
function sprite(S) { const d = Math.min(devicePixelRatio || 1, 2), c = document.createElement('canvas'); c.width = c.height = Math.round(S * d); const g = c.getContext('2d'); g.scale(d, d); return [c, g]; }

// body geometry shared by every material: centre (S/2, 0.54 S), radius 0.3 S
export const BODY = { cy: 0.54, r: 0.3 };

// Fur, as fluffy as it gets, from fine velvet down (coarse 0) to long soft shag in tufts (coarse 1). Every coat is a
// lit ball of hair: a soft undercoat that melts into the background, thousands of thin tapered strands shaded like a
// sphere (lit from the top left, darker towards the roots), translucent tips that glow at the outline, and a few
// stray flyaways. Painted in two layers: the core (undercoat and inner coat) and the fringe (the long outer strands
// and flyaways), so the crew can let the fringe trail behind its movement. pad grows the sprite on every side (in
// units of S); the coat always stops short of the sprite edge, so nothing is clipped at any pad.
export const FUR_DEFAULT = 0.4;
const lerp3 = (k, a, b, c) => k < FUR_DEFAULT ? a + (b - a) * (k / FUR_DEFAULT) : b + (c - b) * ((k - FUR_DEFAULT) / (1 - FUR_DEFAULT));
const TAU = Math.PI * 2, LIGHT = [-0.42, -0.72, 0.56].map((v, _, a) => v / Math.hypot(...a));
export function paintFurLayers(S, palette, seed, coarse = FUR_DEFAULT, pad = 0) {
  const P = S * (1 + 2 * pad), R = rng(seed), [dark, mid, light] = palette.map(hex);
  const cx = P / 2, cy = S * (BODY.cy + pad), r = S * BODY.r, k = Math.min(1, Math.max(0, coarse));
  const L = (fine, mid0, shag) => lerp3(k, fine, mid0, shag);
  const room = Math.min(cx, cy, P - cy) - S * 0.015;                  // the furthest a tip may go
  const reach = Math.min(r * L(1.5, 1.6, 1.7), room * 0.94);           // the outline of the coat
  const [core, cg] = sprite(P), [fringe, fg] = sprite(P);
  const deep = mixc(dark, [0, 0, 0], 0.3), sheen = mixc(light, [255, 255, 255], 0.55);
  const ramp = s => s < 0.3 ? mixc(deep, dark, s / 0.3) : s < 0.6 ? mixc(dark, mid, (s - 0.3) / 0.3) : s < 0.88 ? mixc(mid, light, (s - 0.6) / 0.28) : mixc(light, sheen, (s - 0.88) / 0.22);

  // the undercoat: a soft lit ball, so no gaps show between strands and the outline melts instead of ending
  const e = r / reach, oy = r * 0.08, under = cg.createRadialGradient(cx - r * 0.3, cy - r * 0.35, r * 0.05, cx, cy - oy, reach);
  under.addColorStop(0, rgb(mixc(mid, light, 0.5)));
  under.addColorStop(e * 0.75, rgb(mid));
  under.addColorStop(e, rgb(mixc(mid, dark, 0.4)));
  under.addColorStop(e + (1 - e) * 0.28, rgb(mixc(mid, dark, 0.3), 0.5 * (1 - 0.6 * k)));
  under.addColorStop(e + (1 - e) * 0.55, rgb(mid, 0));
  cg.fillStyle = under; cg.beginPath(); cg.arc(cx, cy - oy, reach, 0, TAU); cg.fill();
  const down = k < FUR_DEFAULT ? 1 - k / FUR_DEFAULT : 0;
  if (down > 0) {                                                     // fine coats: a downy haze past the tips
    const haze = cg.createRadialGradient(cx, cy - oy, reach * 0.8, cx, cy - oy, Math.min(room, reach * 1.1));
    haze.addColorStop(0, rgb(mixc(mid, light, 0.5), 0.4 * down)); haze.addColorStop(1, rgb(mixc(mid, light, 0.6), 0));
    cg.fillStyle = haze; cg.beginPath(); cg.arc(cx, cy - oy, Math.min(room, reach * 1.1), 0, TAU); cg.fill();
  }

  // strands, binned by shell (inner first), taper step, shade and weight, so thousands draw in a few hundred strokes
  const n = Math.round(L(12000, 8500, 4400) * (S / 120) ** 2);
  const curl = L(0.16, 0.32, 1.05), jit = L(0.28, 0.42, 0.7), droop = L(0.02, 0.05, 0.12), tone = L(0.07, 0.11, 0.16);
  const clump = k > 0.3 ? Math.min(1, (k - 0.3) / 0.7) * 0.88 : 0, shadow = k > 0.5 ? (k - 0.5) / 0.5 : 0;
  const wBase = S / 110 * L(0.48, 0.66, 1.25), Q = 32, SH = 12, FRINGE = 8, TAPER = [1, 0.7, 0.42], ALPHA = [0.95, 0.85, 0.55];
  const tufts = clump > 0 ? Array.from({ length: Math.round(12 + 22 * k) }, () => [R() * TAU, Math.sqrt(R()), R(), R(), R()]) : null;
  const bins = new Map(), pts = new Float64Array(12);
  const bin = (key, a, b, c2, d) => { let p = bins.get(key); if (!p) bins.set(key, p = new Path2D()); p.moveTo(a, b); p.lineTo(c2, d); };
  for (let i = 0; i < n; i++) {
    let a = R() * TAU, rf = Math.sqrt(R()), u = R(), w1 = R() - 0.5, w2 = R() - 0.5, fan = 0;
    const jt = (R() - 0.5) * tone, heavy = R() > 0.72, dj = (R() - 0.5) * jit, ao = 0.86 + 0.28 * R();
    if (tufts && R() < clump) {                                       // a tuft: shared lie, tips fanning out softly
      const t = tufts[(R() * tufts.length) | 0];
      a = t[0] + (R() - 0.5) * 0.24; rf = Math.min(1, Math.max(0.05, t[1] + (R() - 0.5) * 0.14));
      u = t[2] * 0.7 + R() * 0.3; w1 = (t[3] - 0.5) * 0.85 + (R() - 0.5) * 0.15; w2 = (t[4] - 0.5) * 0.85 + (R() - 0.5) * 0.15;
      fan = (R() - 0.5) * 0.55;
    }
    const sa = Math.sin(a), ca = Math.cos(a), x0 = cx + ca * r * rf * 0.95, y0 = cy + sa * r * rf * 0.92;
    const rr = Math.hypot(x0 - cx, y0 - cy), lim = reach * (1 - 0.28 * Math.max(0, sa) ** 3);   // shorter underneath: feet peek out
    const len = Math.max(r * 0.1, (lim - rr) * (0.22 + 0.78 * rf ** 1.6) * (0.5 + 0.5 * u)); // centre strands face us: short
    const dir = a + dj, dx = Math.cos(dir), dy = Math.sin(dir), px = -dy * len * curl, py = dx * len * curl;
    const ex = x0 + Math.cos(dir + fan) * len, ey = y0 + Math.sin(dir + fan) * len + len * droop;
    const c1x = x0 + dx * len * 0.33 + px * w1, c1y = y0 + dy * len * 0.33 + py * w1;
    const c2x = x0 + dx * len * 0.7 + px * w2, c2y = y0 + dy * len * 0.7 + py * w2 + len * droop * 0.5;
    for (let s = 0; s < 6; s++) {                                     // the cubic, sampled at 6 points
      const t = s / 5, m = 1 - t;
      pts[s * 2] = m * m * m * x0 + 3 * m * m * t * c1x + 3 * m * t * t * c2x + t * t * t * ex;
      pts[s * 2 + 1] = m * m * m * y0 + 3 * m * m * t * c1y + 3 * m * t * t * c2y + t * t * t * ey;
    }
    let nx = (ex - cx) / reach, ny = (ey - cy) / reach; const nl = Math.hypot(nx, ny);
    if (nl > 1) { nx /= nl; ny /= nl; }
    const nz = Math.sqrt(Math.max(0, 1 - nx * nx - ny * ny)), lit = Math.max(0, nx * LIGHT[0] + ny * LIGHT[1] + nz * LIGHT[2]);
    const rim = Math.min(1, nl) ** 4, shell = Math.max(0, Math.min(SH - 1, Math.floor(rf * rf * SH + (R() - 0.5) * 3)));  // dithered: no rings
    for (let s = 0; s < 5; s++) {
      const tm = (s + 0.5) / 5, step = s < 2 ? 0 : s < 4 ? 1 : 2;
      const sh = (0.16 + 0.84 * lit) * (0.45 + 0.55 * tm) * ao + jt + 0.16 * rim * tm;
      const q = Math.max(0, Math.min(Q, Math.round(sh / 1.1 * Q)));
      bin(shell * 1e4 + step * 1e3 + q * 10 + (heavy ? 1 : 0), pts[s * 2], pts[s * 2 + 1], pts[s * 2 + 2], pts[s * 2 + 3]);
      if (shadow > 0 && step < 2 && shell >= 4) bin(shell * 1e4 + 9e3 + step, pts[s * 2], pts[s * 2 + 1] + 0.7, pts[s * 2 + 2] + 0.4, pts[s * 2 + 3] + 1.1);
    }
  }
  for (const g of [cg, fg]) { g.lineCap = 'round'; g.lineJoin = 'round'; }
  for (const key of [...bins.keys()].sort((x, y) => x - y)) {
    const shell = Math.floor(key / 1e4), rest = key % 1e4, g = shell >= FRINGE ? fg : cg;
    if (rest >= 9e3) {                                                // shag: a soft shadow under each lock
      g.strokeStyle = rgb(deep, 0.22 * shadow); g.lineWidth = wBase * 1.6 * TAPER[rest - 9e3];
    } else {
      const step = Math.floor(rest / 1e3), q = Math.floor((rest % 1e3) / 10), heavy = rest % 10;
      g.strokeStyle = rgb(ramp(q / Q * 1.1), ALPHA[step] * (shell >= FRINGE ? 0.9 : 1));
      g.lineWidth = wBase * (heavy ? 1.35 : 0.8) * TAPER[step];
    }
    g.stroke(bins.get(key));
  }

  // flyaways: a few long, fine, wandering strays past the outline
  const fly = Math.round(L(12, 15, 20) * S / 80);
  fg.lineWidth = wBase * 0.55;
  for (let i = 0; i < fly; i++) {
    const a = -Math.PI * (0.05 + 0.9 * R()) + (R() < 0.3 ? Math.PI * (R() - 0.5) * 0.9 : 0), rf = 0.82 + 0.18 * R();
    const x0 = cx + Math.cos(a) * r * rf, y0 = cy + Math.sin(a) * r * rf * 0.92;
    const len = Math.min(room - 1, reach * (1.02 + 0.1 * R())) - r * rf, dir = a + (R() - 0.5) * 0.6, w = (R() - 0.5) * 1.6;
    const ex = x0 + Math.cos(dir) * len, ey = y0 + Math.sin(dir) * len;
    const nx = Math.cos(dir), ny = Math.sin(dir), lit = Math.max(0, nx * LIGHT[0] + ny * LIGHT[1]);
    fg.strokeStyle = rgb(ramp(0.55 + 0.45 * lit), 0.4);
    fg.beginPath(); fg.moveTo(x0, y0);
    fg.bezierCurveTo(x0 + nx * len * 0.35 - ny * len * w * 0.3, y0 + ny * len * 0.35 + nx * len * w * 0.3, x0 + nx * len * 0.7 + ny * len * w * 0.3, y0 + ny * len * 0.7 - nx * len * w * 0.3, ex, ey);
    fg.stroke();
  }
  return { core, fringe };
}
function paintFur(S, palette, seed, coarse = FUR_DEFAULT, pad = 0) {
  const { core, fringe } = paintFurLayers(S, palette, seed, coarse, pad), g = core.getContext('2d');
  g.setTransform(1, 0, 0, 1, 0, 0); g.drawImage(fringe, 0, 0);
  return core;
}

function paintJelly(S, color) {
  const [c, g] = sprite(S), base = hex(color), cx = S / 2, cy = S * BODY.cy, r = S * BODY.r;
  const body = g.createRadialGradient(cx - r * 0.3, cy - r * 0.35, r * 0.08, cx, cy, r * 1.05);
  body.addColorStop(0, rgb(mixc(base, [255, 255, 255], 0.45), 0.95));
  body.addColorStop(0.55, rgb(base, 0.9));
  body.addColorStop(1, rgb(mixc(base, [0, 0, 0], 0.32), 0.95));
  g.fillStyle = body; g.beginPath(); g.ellipse(cx, cy, r * 1.02, r * 0.97, 0, 0, Math.PI * 2); g.fill();
  const glow = g.createRadialGradient(cx, cy + r * 0.75, 0, cx, cy + r * 0.75, r * 0.7);   // light passing through the bottom
  glow.addColorStop(0, rgb(mixc(base, [255, 255, 255], 0.6), 0.55)); glow.addColorStop(1, rgb(base, 0));
  g.fillStyle = glow; g.beginPath(); g.ellipse(cx, cy, r, r * 0.95, 0, 0, Math.PI * 2); g.fill();
  g.strokeStyle = rgb(mixc(base, [0, 0, 0], 0.4), 0.35); g.lineWidth = r * 0.05; g.stroke();
  const R = rng(base[0] * 7 + base[1] + 1);
  for (let i = 0; i < 5; i++) { g.fillStyle = 'rgba(255,255,255,.28)'; g.beginPath(); g.arc(cx + (R() - 0.5) * r * 1.1, cy + (R() - 0.2) * r * 0.9, r * (0.03 + R() * 0.04), 0, 7); g.fill(); }
  g.save(); g.translate(cx - r * 0.38, cy - r * 0.5); g.rotate(-0.55);
  const hl = g.createLinearGradient(0, -r * 0.14, 0, r * 0.14); hl.addColorStop(0, 'rgba(255,255,255,.95)'); hl.addColorStop(1, 'rgba(255,255,255,.15)');
  g.fillStyle = hl; g.beginPath(); g.ellipse(0, 0, r * 0.36, r * 0.15, 0, 0, Math.PI * 2); g.fill(); g.restore();
  g.fillStyle = 'rgba(255,255,255,.85)'; g.beginPath(); g.arc(cx + r * 0.42, cy - r * 0.22, r * 0.06, 0, 7); g.fill();
  return c;
}

function paintChrome(S) {
  const [c, g] = sprite(S), cx = S / 2, cy = S * BODY.cy, r = S * BODY.r;
  g.save(); g.beginPath(); g.arc(cx, cy, r, 0, Math.PI * 2); g.clip();
  const env = g.createLinearGradient(0, cy - r, 0, cy + r);       // the reflected studio: sky, horizon, warm floor
  env.addColorStop(0, '#fbfcfe'); env.addColorStop(0.3, '#c6ccd4'); env.addColorStop(0.47, '#4a4f57'); env.addColorStop(0.53, '#2a2d32');
  env.addColorStop(0.62, '#9b8a78'); env.addColorStop(0.82, '#5b524a'); env.addColorStop(1, '#1d1f22');
  g.fillStyle = env; g.fillRect(cx - r, cy - r, r * 2, r * 2);
  for (const [x, col] of [[-0.55, 'rgba(255,140,60,.75)'], [0.62, 'rgba(70,140,255,.7)']]) {
    g.fillStyle = col; g.beginPath(); g.ellipse(cx + x * r, cy - r * 0.1, r * 0.08, r * 0.55, x * 0.5, 0, Math.PI * 2); g.fill();
  }
  const rim = g.createRadialGradient(cx, cy, r * 0.55, cx, cy, r);
  rim.addColorStop(0, 'rgba(0,0,0,0)'); rim.addColorStop(1, 'rgba(10,12,16,.55)');
  g.fillStyle = rim; g.fillRect(cx - r, cy - r, r * 2, r * 2);
  g.fillStyle = 'rgba(255,255,255,.95)'; g.beginPath(); g.ellipse(cx - r * 0.35, cy - r * 0.55, r * 0.28, r * 0.12, -0.5, 0, Math.PI * 2); g.fill();
  g.restore();
  return c;
}

function paintKnit(S, palette, stripe) {
  const [c, g] = sprite(S), [dark, mid, light] = palette.map(hex), st = hex(stripe), cx = S / 2, cy = S * BODY.cy, r = S * BODY.r;
  g.save(); g.beginPath(); g.ellipse(cx, cy, r * 1.02, r * 0.98, 0, 0, Math.PI * 2); g.clip();
  g.fillStyle = rgb(mid); g.fillRect(cx - r * 1.1, cy - r * 1.1, r * 2.2, r * 2.2);
  const s = Math.max(3, r * 0.17);
  let row = 0;
  for (let y = cy - r * 1.1; y < cy + r * 1.1; y += s * 0.78, row++) {
    const col = row % 7 === 4 || row % 7 === 5 ? st : mid;        // a sweater stripe
    for (let x = cx - r * 1.1 + (row % 2) * s * 0.45; x < cx + r * 1.1; x += s * 0.9) {
      g.fillStyle = rgb(mixc(col, [255, 255, 255], 0.22)); g.beginPath(); g.ellipse(x - s * 0.2, y, s * 0.24, s * 0.42, -0.5, 0, Math.PI * 2); g.fill();
      g.fillStyle = rgb(mixc(col, [0, 0, 0], 0.12)); g.beginPath(); g.ellipse(x + s * 0.2, y, s * 0.24, s * 0.42, 0.5, 0, Math.PI * 2); g.fill();
    }
  }
  const shade = g.createRadialGradient(cx - r * 0.3, cy - r * 0.4, r * 0.2, cx, cy, r * 1.05);
  shade.addColorStop(0, rgb(light, 0.25)); shade.addColorStop(0.6, 'rgba(0,0,0,0)'); shade.addColorStop(1, rgb(dark, 0.55));
  g.fillStyle = shade; g.fillRect(cx - r * 1.1, cy - r * 1.1, r * 2.2, r * 2.2);
  g.restore();
  g.fillStyle = rgb(st);                                         // a pom-pom on top
  for (let i = 0; i < 26; i++) { const a = i / 26 * Math.PI * 2; g.beginPath(); g.arc(cx + Math.cos(a) * r * 0.12, cy - r * 1.02 + Math.sin(a) * r * 0.1, r * 0.09, 0, 7); g.fill(); }
  return c;
}

export const PALETTES = {
  mist: ['#7f8ea3', '#b9c6d6', '#eef3f8'],
  peach: ['#c98a6b', '#efc1a4', '#fff0e4'],
  mint: ['#6fa58f', '#a9d9c4', '#eafaf2'],
  mustard: ['#8a6a1f', '#d8a53a', '#f6dfa4'],
  plum: ['#5d3b52', '#9a6b88', '#dcc3d3'],
  rose: ['#b23a62', '#f28aa8', '#ffe3ec'],
  graphite: ['#2b3038', '#5f6875', '#b4bcc7'],
};

export function paintBody(material, S, opts = {}) {
  if (material === 'jelly') return paintJelly(S, opts.color || '#ff5c8a');
  if (material === 'chrome') return paintChrome(S);
  if (material === 'knit') return paintKnit(S, opts.palette || PALETTES.mustard, opts.stripe || '#3b5bdb');
  return paintFur(S, opts.palette || PALETTES.mist, opts.seed || 7, opts.coarse ?? FUR_DEFAULT, opts.pad || 0);
}
export function footColour(material, opts = {}) {
  if (material === 'jelly') return rgb(mixc(hex(opts.color || '#ff5c8a'), [0, 0, 0], 0.3));
  if (material === 'chrome') return '#3b3f46';
  return (opts.palette || PALETTES.mist)[0];
}

// Feet and face, in body space: origin at the feet, body centre at fy. gx, gy: gaze from -1 to 1.
// parts: 'feet' or 'face' draws only that half (the crew paints the feet once and repaints only the face);
// lightInk draws the strokes in white, for dark bodies.
export function drawFeatures(g, { S, fy, gx = 0, gy = 0, lid = 1, sleeping = false, mouthOpen = 0, accent = '#ff8fab', foot = '#7f8ea3', material = 'fur', parts = 'all', lightInk = material === 'chrome' }) {
  const r = S * BODY.r, light = lightInk;
  g.fillStyle = foot;
  if (parts !== 'face') for (const fx of [-0.42, 0.42]) { g.beginPath(); g.ellipse(fx * r, -r * 0.04, r * 0.26, r * 0.14, 0, 0, Math.PI * 2); g.fill(); }
  if (parts === 'feet') return;
  const ex = r * 0.34, ey = fy - r * 0.12, er = r * 0.21;
  g.lineCap = 'round';
  for (const s of [-1, 1]) {
    const x = s * ex;
    if (sleeping) {
      g.strokeStyle = light ? '#f4f6f8' : '#2a2d33'; g.lineWidth = Math.max(1.4, S * 0.018);
      g.beginPath(); g.arc(x, ey - er * 0.2, er * 0.7, Math.PI * 0.15, Math.PI * 0.85); g.stroke();
    } else {
      g.fillStyle = '#fff'; g.beginPath(); g.ellipse(x, ey, er, er * 1.12 * lid, 0, 0, Math.PI * 2); g.fill();
      if (lid > 0.3) {
        g.fillStyle = '#17191d'; g.beginPath(); g.ellipse(x + gx * er * 0.42, ey + gy * er * 0.42, er * 0.52, er * 0.58 * lid, 0, 0, Math.PI * 2); g.fill();
        g.fillStyle = 'rgba(255,255,255,.9)'; g.beginPath(); g.arc(x + gx * er * 0.42 - er * 0.2, ey + gy * er * 0.42 - er * 0.25, er * 0.16, 0, Math.PI * 2); g.fill();
      }
    }
  }
  g.fillStyle = accent; g.globalAlpha = light ? 0.3 : 0.45;
  for (const s of [-1, 1]) { g.beginPath(); g.ellipse(s * r * 0.58, ey + er * 1.15, er * 0.45, er * 0.28, 0, 0, Math.PI * 2); g.fill(); }
  g.globalAlpha = 1;
  g.strokeStyle = light ? '#f4f6f8' : '#2a2d33'; g.fillStyle = '#5a2730'; g.lineWidth = Math.max(1.3, S * 0.015);
  if (mouthOpen > 0.2) { g.beginPath(); g.ellipse(0, ey + er * 1.35, er * 0.3, er * 0.36 * mouthOpen, 0, 0, Math.PI * 2); g.fill(); }
  else { g.beginPath(); g.arc(0, ey + er * 0.95, er * 0.34, Math.PI * 0.2, Math.PI * 0.8); g.stroke(); }
}

export function drawZs(g, S, now, x0 = S * 0.68, y0 = S * 0.32) {
  g.fillStyle = '#6b7178'; g.font = `700 ${Math.round(Math.max(10, S * 0.12))}px "Mona Sans", system-ui, sans-serif`;
  for (let i = 0; i < 3; i++) {
    const p = ((now / 1000 + i * 0.9) % 2.7) / 2.7;
    g.globalAlpha = Math.sin(Math.PI * p) * 0.9;
    g.fillText('z', x0 + S * (0.08 * i + 0.05 * Math.sin(p * 6)), y0 - S * p * 0.24);
  }
  g.globalAlpha = 1;
}

const all = new Set();
let raf = 0;
const seen = new IntersectionObserver(es => es.forEach(e => { for (const c of all) if (c.canvas === e.target) { c.visible = e.isIntersecting; c.rect = e.boundingClientRect; } }));
addEventListener('scroll', () => all.forEach(c => { if (c.visible) c.rect = c.canvas.getBoundingClientRect(); }), { passive: true, capture: true });
function loop(now) { raf = 0; for (const c of all) if (c.visible && c.canvas.isConnected) c.draw(now); if (all.size) raf = requestAnimationFrame(loop); }

// One creature on its own canvas: the detail view, empty states, the one peeking from behind the grid.
export class Creature {
  constructor(canvas, { size = 110, material = 'fur', palette = PALETTES.mist, color, stripe, seed = 7, accent = '#ff8fab' } = {}) {
    this.canvas = canvas; this.size = size; this.accent = accent; this.material = material;
    this.foot = footColour(material, { palette, color });
    const d = Math.min(devicePixelRatio || 1, 2);
    canvas.width = canvas.height = Math.round(size * d);
    canvas.style.width = canvas.style.height = size + 'px';
    this.ctx = canvas.getContext('2d'); this.ctx.setTransform(d, 0, 0, d, 0, 0);
    this.body = paintBody(material, size, { palette, color, stripe, seed });
    this.reaction = null; this.reactT = 0; this.sleeping = false; this.visible = false; this.rect = null;
    this.blinkAt = performance.now() + 1200 + Math.random() * 3000;
    all.add(this); seen.observe(canvas);
    new ResizeObserver(() => { this.rect = canvas.getBoundingClientRect(); }).observe(canvas);
    if (!raf) raf = requestAnimationFrame(loop);
  }
  react(kind) {
    if (kind === 'sleep') { this.sleeping = true; return; }
    if (kind === 'wake') { this.sleeping = false; return; }
    this.sleeping = false; this.reaction = kind; this.reactT = performance.now();
  }
  destroy() { all.delete(this); seen.unobserve(this.canvas); }
  draw(now) {
    const g = this.ctx, S = this.size, calm = reduce.matches;
    g.clearRect(0, 0, S, S);
    let jump = 0, sx = 1, sy = 1, lean = 0, mouthOpen = 0;
    if (!calm) { const b = Math.sin(now / 1000 * 2.1) * (this.sleeping ? 0.03 : 0.016); sy += b; sx -= b; }
    const t = (now - this.reactT) / 1000, jelly = this.material === 'jelly' ? 1.6 : 1;
    if (this.reaction && !calm) {
      const H = this.reaction === 'bounce' ? 0.26 : 0.18;
      if (t < 0.1) { const k = t / 0.1; sy *= 1 - 0.14 * k; sx *= 1 + 0.1 * k; }
      else if (t < 0.5) { const k = (t - 0.1) / 0.4; jump = Math.sin(Math.PI * k) * S * H; sy *= 1 + 0.12 * Math.cos(Math.PI * k); sx = 1 / sy; mouthOpen = 1; }
      else if (t < 1.3) { const w = wob(t - 0.5); sy *= 1 - 0.16 * w * jelly; sx = 1 / sy; mouthOpen = Math.max(0, 1 - (t - 0.5) * 3); }
      else this.reaction = null;
      if (this.reaction === 'catch' && t > 0.1 && t < 0.5) lean = Math.sin(Math.PI * (t - 0.1) / 0.4) * 0.12;
    }
    const feetY = S * 0.92;
    g.save(); g.translate(S / 2, feetY - jump); g.rotate(lean); g.scale(sx, sy);
    g.drawImage(this.body, -S / 2, -feetY + S * 0.02, S, S);
    const box = this.rect || { left: 0, top: 0, width: S, height: S };
    let gx = pointer.x - (box.left + box.width / 2), gy = pointer.y - (box.top + box.height * 0.45);
    const gl = Math.hypot(gx, gy) || 1, reach = Math.min(1, gl / 260);
    gx = calm ? 0 : gx / gl * reach; gy = calm ? 0 : gy / gl * reach;
    let lid = 1;
    if (!calm && !this.sleeping && now > this.blinkAt) { const p = (now - this.blinkAt) / 140; if (p >= 1) this.blinkAt = now + 2200 + Math.random() * 4200; else lid = 1 - Math.sin(Math.PI * p) * 0.92; }
    drawFeatures(g, { S, fy: -feetY + S * 0.02 + S * BODY.cy, gx, gy, lid, sleeping: this.sleeping, mouthOpen, accent: this.accent, foot: this.foot, material: this.material });
    g.restore();
    if (this.sleeping && !calm) drawZs(g, S, now);
  }
}
