// The crew: fluffy creatures, from fine soft down to coarse shag, that float weightlessly over the whole page.
// Layering: a fixed layer above the page background and behind the cards, so they slip behind the designs and show in
// the gutters, the margins and around the dial. The top bar hides cards scrolled under it with its background, so a
// creature that floats up there gets a clipped twin inside the bar (above that background, below the controls).
// Words: they never cover text. Every word box (dial words, sheet header, top-bar controls, card titles and notes)
// pushes softly once a creature's fluff comes within RANGE px and soaks up the speed it closes in with. Steering looks
// ahead along 16 directions, rates each for words (more mildly for a neighbour in the way or the viewport's edge) and turns toward the open direction nearest the wandering heading, so they path around words
// and out of pockets rather than bounce. A last-resort slide of at most 3 px a frame clears a word that moved onto one.
// Card images don't block: they pass right behind them and peek out from the edges. Boxes are measured every 250 ms
// and on layout changes, never per frame; the sheet's boxes are kept in page coordinates, so scrolling needs no
// measuring, and creatures over the sheet ride along with it. The first placement waits for a settled layout.
// Motion: each has its own pace (big ones slower), moods (cruising, slow drifts, gentle dashes) and a route (a grid
// search around the words) to a spot that is at least partly in view, away from the others and from where it has been
// lately; 8 s in one area sends it far off, so they spread over the page and never settle. Now and then one follows a
// route to the nearest reachable edge and drifts off, and later floats back in at the most open spot along the edges. With no input for a while they doze. Paused under the detail
// view and in hidden tabs. Phones: hidden. Reduced motion: a slow even drift, no dashes, hops or spins.
import { paintFurLayers, drawFeatures, BODY, PALETTES, pointer } from './creatures.js';

const reduce = matchMedia('(prefers-reduced-motion: reduce)');
const narrow = matchMedia('(max-width: 860px)');
// coarse: 0 = fine soft down … 1 = coarse shag. speed: a personal pace factor. ink: white strokes on a dark coat.
const CREW = [
  { size: 88, palette: PALETTES.mist, seed: 11, coarse: 0.12, speed: 0.85 },
  { size: 62, palette: PALETTES.rose, seed: 19, coarse: 0.55, speed: 1.2, accent: '#ff6f93' },
  { size: 66, palette: PALETTES.graphite, seed: 29, coarse: 1, speed: 0.95, ink: true },
  { size: 74, palette: PALETTES.mustard, seed: 37, coarse: 0.78, speed: 1.05, accent: '#ff8a65' },
  { size: 52, palette: PALETTES.mint, seed: 41, coarse: 0, speed: 1.35 },
  { size: 58, palette: PALETTES.peach, seed: 23, coarse: 0.36, speed: 1.12, accent: '#ff7a8a' },
  { size: 64, palette: PALETTES.plum, seed: 47, coarse: 0.9, speed: 0.78, accent: '#ff8fc0' },
];
const IDLE = 12000, TAU = Math.PI * 2;
const PAD = 0.16;      // sprite padding, in units of S, so long shag isn't clipped
const FEET = 0.36;     // the feet sit this far below the body centre, in units of S
const MARGIN = 8;      // px of clear space the look-ahead keeps between fluff and words
const RANGE = 36;      // px over which a word's push builds up
const BASE = 30;       // px/s cruising pace of an 80 px creature
const FACE = { l: 0.235, t: 0.13, w: 0.47, h: 0.235 };   // the face canvas around the body centre, units of S
// the category section headings and the FAQ count as words too (they came with the scroll-through catalogue)
const PAGE_WORDS = '.sheet-head h1, .sheet-head .count, .head-tools > *, .group-name, .group-count, .group-actions > *, .group-empty, .empty h2, .empty p, .empty .btn, .empty canvas, .cat-head h2, .cat-count, .faq h2, .faq-item, .front-title, .front-lede, .front-points li, .front-actions > *, .front-name, .front-trick, .front-ctl > *, .sp-head h2, .sp-note';
// the front page's live hero counts as a picture, like a card image: they may pass behind it but never rest on it
const PAGE_PICTURES = '.front-media';
const CARD_WORDS = '.card-title span, .kind, .trick';

const rand = (a, b) => a + Math.random() * (b - a);
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const angDiff = (a, b) => { let d = (a - b) % TAU; if (d > Math.PI) d -= TAU; else if (d < -Math.PI) d += TAU; return d; };
const gauss = () => (Math.random() + Math.random() + Math.random() - 1.5) * 2;   // roughly normal, sd ≈ 1

// the project's --ease-in-out token, cubic-bezier(0.77, 0, 0.175, 1), for the happy spin
function bezier(x1, y1, x2, y2) {
  const cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx, cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by;
  const X = t => ((ax * t + bx) * t + cx) * t, Y = t => ((ay * t + by) * t + cy) * t;
  return x => {
    if (x <= 0) return 0; if (x >= 1) return 1;
    let lo = 0, hi = 1, t = x;
    for (let i = 0; i < 24; i++) { const v = X(t); if (Math.abs(v - x) < 1e-5) break; if (v < x) lo = t; else hi = t; t = (lo + hi) / 2; }
    return Y(t);
  };
}
const easeInOut = bezier(0.77, 0, 0.175, 1);

// the 16 look-ahead directions for steering, and a reused list of the boxes near one creature
const NDIR = 16, DX = [], DY = [], near = [], peers = [];
for (let i = 0; i < NDIR; i++) { DX.push(Math.cos(i / NDIR * TAU)); DY.push(Math.sin(i / NDIR * TAU)); }

// signed distance from a point to a box (negative inside), with the outward normal left in NX, NY
let NX = 0, NY = 0;
function gapTo(o, x, y) {
  const dx = x < o.x1 ? o.x1 - x : x > o.x2 ? x - o.x2 : 0, dy = y < o.y1 ? o.y1 - y : y > o.y2 ? y - o.y2 : 0;
  if (dx || dy) { const d = Math.hypot(dx, dy); NX = (x < o.x1 ? -dx : dx) / d; NY = (y < o.y1 ? -dy : dy) / d; return d; }
  const l = x - o.x1, r = o.x2 - x, t = y - o.y1, b = o.y2 - y, m = Math.min(l, r, t, b);
  NX = m === l ? -1 : m === r ? 1 : 0; NY = NX ? 0 : m === t ? -1 : 1;
  return -m;
}

// how far the coat visibly reaches from the body centre: the 95th percentile of the outline, read off the sprite
function reachOf(sprite, S) {
  const n = sprite.width, px = sprite.getContext('2d').getImageData(0, 0, n, n).data, k = n / (S * (1 + 2 * PAD));
  const cx = (0.5 + PAD) * S * k, cy = (BODY.cy + PAD) * S * k, bins = new Float32Array(72);
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
    if (px[(y * n + x) * 4 + 3] < 90) continue;                         // translucent tips count, the haze doesn't
    const dx = x - cx, dy = y - cy, r = Math.hypot(dx, dy), i = Math.floor((Math.atan2(dy, dx) + Math.PI) / TAU * 72) % 72;
    if (r > bins[i]) bins[i] = r;
  }
  return [...bins].sort((a, b) => a - b)[68] / k;
}

export function createCrew({ bar, dial, sheet, grid, covered = () => false }) {
  const dpr = Math.min(devicePixelRatio || 1, 2);
  const low = document.createElement('div'), high = document.createElement('div');
  low.className = 'crew'; high.className = 'crew crew-top';
  low.setAttribute('aria-hidden', 'true'); high.setAttribute('aria-hidden', 'true');
  document.body.prepend(low); bar.prepend(high);

  const canvas = (w, h) => {
    const c = document.createElement('canvas');
    c.width = Math.round(w * dpr); c.height = Math.round(h * dpr); c.style.width = w + 'px'; c.style.height = h + 'px';
    return c;
  };
  // one creature on screen: a static body canvas (undercoat, inner coat, feet), the fringe (long outer strands) on its
  // own canvas so it can trail the movement, a small face canvas that repaints only when the face changes, and the
  // sleepy Zs (CSS). The whole thing moves with a composited transform; the fringe adds its own small one.
  function view(layer, b) {
    const S = b.S, C = b.C, w = document.createElement('div');
    w.className = 'critter'; w.hidden = true; w.style.width = w.style.height = C + 'px';
    const body = canvas(C, C), fur = canvas(C, C), face = canvas(S * FACE.w, S * FACE.h), zs = document.createElement('span');
    fur.className = 'critter-fur';
    face.style.left = (C / 2 - S * FACE.l) + 'px'; face.style.top = (C / 2 - S * FACE.t) + 'px';
    const fs = Math.round(Math.max(10, S * 0.12));
    zs.className = 'critter-zs'; zs.style.cssText = `left:${(C / 2 + S * 0.18).toFixed(1)}px;top:${(C / 2 - S * 0.3 - fs).toFixed(1)}px;font-size:${fs}px;--u:${S}px`;
    zs.innerHTML = '<i style="--i:0">z</i><i style="--i:1">z</i><i style="--i:2">z</i>';
    w.append(body, fur, face, zs); layer.append(w);
    return { w, body, fur, face, bg: body.getContext('2d'), ug: fur.getContext('2d'), fg: face.getContext('2d'), tf: '', ft: '' };
  }

  // built on the first desktop frame (phones never pay for painting them)
  let bodies = [];
  const build = () => { bodies = CREW.map(makeBody); };
  function makeBody(c) {
    const S = c.size, { core, fringe } = paintFurLayers(S, c.palette, c.seed, c.coarse, PAD);
    const sprite = document.createElement('canvas'), sg = sprite.getContext('2d');
    sprite.width = core.width; sprite.height = core.height; sg.drawImage(core, 0, 0); sg.drawImage(fringe, 0, 0);
    const rb = Math.max(reachOf(sprite, S), S * 0.41), bobA = 3.2 * Math.sqrt(S / 90);
    const b = {
      ...c, S, C: Math.ceil(S * 1.42), rb, bobA, R: rb * 1.02 + bobA + 0.5,   // R: the avoidance radius (fluff, breath, bob)
      foot: c.palette[0], accent: c.accent || '#ff8fab',
      x: 0, y: 0, vx: 0, vy: 0, kx: 0, ky: 0, fx: 0, fy: 0, th: rand(0, TAU), om: 0, angle: 0, av: 0, sq: 0, sqv: 0,
      fox: 0, foy: 0, fvx: 0, fvy: 0, fpx: 0, fpy: 0, fsx: 0, fsy: 0, fT: 0,   // the fringe's trail spring
      bob: rand(0, TAU), breath: rand(0, TAU), tiltF: rand(0.16, 0.28), tiltP: rand(0, TAU), paceP: rand(0, TAU),
      boost: 1, boostTo: 1, moodT: 0, state: 'out', life: 0, wait: 0, exit: 0, enterT: 0, wakeAt: 0, spinAt: -1, spinDir: 1, mouth: 0,
      blinkAt: performance.now() + Math.random() * 4000, pick: -1, goal: null, goalT: 0, path: [], trail: [], trailT: 0, stay: null, leaveT: 0, key: '', faceNew: false, shown: false, band: false, asleep: false, follow: false,
    };
    b.views = [view(low, b), view(high, b)];
    const [lo, hi] = b.views, g = lo.bg, P = S * (1 + 2 * PAD);
    g.setTransform(dpr, 0, 0, dpr, 0, 0); g.translate(b.C / 2, b.C / 2);
    g.drawImage(core, -(0.5 + PAD) * S, -(BODY.cy + PAD) * S, P, P);
    g.translate(0, S * FEET); drawFeatures(g, { S, fy: -S * FEET, foot: b.foot, parts: 'feet' });
    const u = lo.ug; u.setTransform(dpr, 0, 0, dpr, 0, 0); u.translate(b.C / 2, b.C / 2);
    u.drawImage(fringe, -(0.5 + PAD) * S, -(BODY.cy + PAD) * S, P, P);
    hi.bg.drawImage(lo.body, 0, 0); hi.ug.drawImage(lo.fur, 0, 0);
    lo.w.dataset.r = rb.toFixed(1);                                       // the visible radius, for layout checks
    mood(b);
    return b;
  }

  /* ───────── where the words are ───────── */
  // fixed boxes (top bar, dial) in viewport coordinates; the sheet's in page coordinates (they scroll)
  let W = 0, H = 0, barBottom = 0, contentRight = 0, barWords = [], dialWords = [], pageWords = [];
  let measuredAt = -1e9, measuredY = 0, pageAt = -1e9, settleUntil = 0, dirty = true, dialY = null, dialMeasuredY = null;
  const box = (r, fixed, soft = false) => {
    if (r.width < 1 || r.height < 1) return null;
    const oy = fixed ? 0 : scrollY;
    return { x1: r.left, x2: r.right, y1: r.top + oy, y2: r.bottom + oy, fixed, soft };
  };
  // the dial words swell under the pointer (fisheye: up to 1.38×, growing leftward), so near the pointer they claim
  // the room they are about to take
  function measureDial() {
    dialWords = [];
    if (dial.classList.contains('is-mobile')) return;
    const rs = [...dial.querySelectorAll('.dial-item .lbl')].map(e => e.getBoundingClientRect());
    const gap = rs.length > 1 ? (rs[rs.length - 1].top - rs[0].top) / (rs.length - 1) : 50;
    for (const r of rs) {
      let q = r;
      if (dialY !== null) {
        const d = (r.top + r.height / 2 - dialY) / gap, s = 0.38 * Math.exp(-(d * d) / 1.3);
        q = { left: r.left - r.width * s - 34 * s - 2, right: r.right + 2, top: r.top - r.height * s / 2, bottom: r.bottom + r.height * s / 2, width: 1, height: 1 };
      }
      const o = box(q, true); if (o) dialWords.push(o);
    }
    dialMeasuredY = dialY;
  }
  // the bar and dial every 250 ms (a handful of boxes); the sheet's words, which only move when the page changes,
  // on every change and every 250 ms while it settles (cards ease in), otherwise once a second as a safety net
  function measure(now) {
    const page = !placed || dirty || now < settleUntil || now - pageAt > 1000 || Math.abs(scrollY - measuredY) > H * 0.5;
    if (dirty) settleUntil = now + 1500;
    W = document.documentElement.clientWidth; H = innerHeight;
    barBottom = bar.getBoundingClientRect().bottom; contentRight = grid.getBoundingClientRect().right;
    barWords = [...bar.querySelectorAll('.brand, .bar-actions > *')].map(e => box(e.getBoundingClientRect(), true)).filter(Boolean);
    measureDial();
    measuredAt = now; dirty = false;
    if (!page) return;
    pageWords = [];
    const add = o => { if (o) pageWords.push(o); };
    for (const e of sheet.querySelectorAll(PAGE_WORDS)) add(box(e.getBoundingClientRect(), false));
    for (const e of sheet.querySelectorAll(PAGE_PICTURES)) add(box(e.getBoundingClientRect(), false, true));
    for (const card of sheet.querySelectorAll('.card')) {
      const r = card.getBoundingClientRect();
      if (r.bottom < -H || r.top > 2 * H) continue;                // far off screen: measured once it comes near
      add(box(card.querySelector('.card-media').getBoundingClientRect(), false, true));
      for (const e of card.querySelectorAll(CARD_WORDS)) add(box(e.getBoundingClientRect(), false));
    }
    pageAt = now; measuredY = scrollY;
  }
  // this frame's obstacles in viewport coordinates (objects reused); sheet boxes are cut at the bar, which hides them
  const obs = [];
  function gather() {
    const sy = scrollY; let n = 0;
    for (const list of [barWords, dialWords, pageWords]) for (const o of list) {
      let y1 = o.y1, y2 = o.y2;
      if (!o.fixed) { y1 -= sy; y2 -= sy; if (y1 < barBottom) y1 = barBottom; if (y2 <= y1) continue; }
      if (y2 < -150 || y1 > H + 150 || o.x2 < -150 || o.x1 > W + 150) continue;
      const q = obs[n] || (obs[n] = {});
      q.x1 = o.x1; q.x2 = o.x2; q.y1 = y1; q.y2 = y2; q.soft = o.soft; n++;
    }
    obs.length = n;
  }

  /* ───────── behaviour ───────── */
  let lastActive = performance.now(), sleeping = false, doze = 0, T = 0, placed = false;
  let hushTo = 1, hush = 1;   // eases toward 0.4 while a card preview plays: the previews are the content
  const wake = () => {
    lastActive = performance.now();
    if (sleeping) { sleeping = false; bodies.forEach((b, i) => { b.wakeAt = performance.now() + i * 140 + Math.random() * 200; }); kick(); }
  };
  ['pointermove', 'pointerdown', 'keydown', 'wheel', 'scroll'].forEach(t => addEventListener(t, wake, { passive: true }));

  // a mood sets the pace for a while: mostly cruising, sometimes a slow drift, now and then a gentle dash
  function mood(b) {
    const r = Math.random();
    if (reduce.matches) { b.boostTo = 1; b.moodT = 6; }
    else if (r < 0.2) { b.boostTo = rand(1.8, 2.3); b.moodT = rand(1.2, 2.6); }
    else if (r < 0.48) { b.boostTo = rand(0.4, 0.65); b.moodT = rand(3, 6); }
    else { b.boostTo = rand(0.85, 1.15); b.moodT = rand(3, 8); }
  }
  const resetMotion = b => { b.vx = b.vy = b.kx = b.ky = b.om = b.angle = b.av = b.sq = b.sqv = b.mouth = 0; b.spinAt = -1; };
  const onScreen = b => b.state !== 'out';
  const fullyIn = b => onScreen(b) && b.x > b.R && b.x < W - b.R && b.y > b.R && b.y < H - b.R;
  const gone = b => b.x < -b.rb || b.x > W + b.rb || b.y < -b.rb || b.y > H + b.rb;      // the fluff is out of view

  // open space around a spot: clearance from words (keeping MARGIN; card images don't count), from the others and
  // (unless it is coming in from an edge) from the viewport's edges
  function room(b, x, y, edges = true) {
    let m = edges ? Math.min(x - b.R, W - x - b.R, y - b.R, H - y - b.R) : Infinity;
    for (const o of obs) if (!o.soft) m = Math.min(m, gapTo(o, x, y) - b.R - MARGIN);
    for (const o of bodies) if (o !== b && onScreen(o)) m = Math.min(m, Math.hypot(o.x - x, o.y - y) - o.R - b.R - 12);
    return m;
  }
  // first placement: each one at an open spot, spread over the screen, staggered times before they wander off.
  // Distance from the ones already placed outweighs being fully in view: the catalogue's only fully visible open space
  // is the strip above the first row of cards, and when visibility won, all seven started lined up in it. A spot partly
  // behind a card image is fine (they peek out from the edges), as long as about a third of the body shows.
  function scatter() {
    const order = [...bodies].sort(() => Math.random() - 0.5);
    order.forEach(b => { b.state = 'out'; });
    const placedAt = [];
    order.forEach((b, i) => {
      let best = null, bs = -Infinity;
      for (let k = 0; k < 240; k++) {
        const x = rand(b.R, W - b.R), y = rand(b.R, H - b.R), vis = shown(b, x, y);
        const apart = placedAt.length ? Math.min(...placedAt.map(([px, py]) => Math.hypot(px - x, py - y))) : 500;
        const s = Math.min(36, room(b, x, y)) + 8 * vis + 0.09 * Math.min(apart, 500) - (vis < 0.34 ? 50 : 0) + Math.random() * 8;
        if (s > bs) { bs = s; best = [x, y]; }
      }
      resetMotion(b);
      if (bs > 6) {
        [b.x, b.y] = best; placedAt.push(best); b.state = 'roam'; b.life = 10 + i * 6 + rand(0, 5);
        // they fade in one after another as the page arrives (opacity only: the transform is driven every frame)
        for (const v of b.views) v.w.animate({ opacity: [0, 1] }, { duration: 420, delay: 120 + i * 70, easing: 'cubic-bezier(0.23, 1, 0.32, 1)', fill: 'backwards' });
      } else b.wait = 0.5 + i * 0.8;
    });
  }
  // float back in from an edge, at the most open spot along all four edges
  function enter(b) {
    let best = null, bs = -Infinity;
    for (let k = 0; k < 40; k++) {
      const e = k % 4, d = b.R + 14;
      const p = e === 0 ? [d, rand(b.R, H - b.R)] : e === 1 ? [W - d, rand(b.R, H - b.R)] : e === 2 ? [rand(b.R, W - b.R), H - d] : [rand(b.R, W - b.R), d];
      const s = Math.min(36, room(b, p[0], p[1], false)) + Math.random() * 6;
      if (s > bs) { bs = s; best = [e, p]; }
    }
    if (bs < 8) return false;
    const [e, [px, py]] = best, o = b.C / 2;
    resetMotion(b);
    b.x = e === 0 ? -o : e === 1 ? W + o : px; b.y = e === 2 ? H + o : e === 3 ? -o : py;
    b.th = [0, Math.PI, -Math.PI / 2, Math.PI / 2][e] + rand(-0.3, 0.3);
    const sp = BASE * Math.sqrt(80 / b.S) * b.speed;
    b.vx = Math.cos(b.th) * sp; b.vy = Math.sin(b.th) * sp; b.angle = rand(-0.2, 0.2);
    b.state = 'enter'; b.enterT = 0; b.follow = false; b.goal = null; b.path = []; mood(b);
    return true;
  }
  // how much of a creature at (x, y) shows (0..1): the share of nine points on its body not behind a card image
  const VX = [0, 1, -1, 0, 0, 0.7, -0.7, 0.7, -0.7], VY = [0, 0, 0, 1, -1, 0.7, 0.7, -0.7, -0.7];
  function shown(b, x, y) {
    let n = 0;
    for (let k = 0; k < 9; k++) {
      const px = x + VX[k] * b.R * 0.8, py = y + VY[k] * b.R * 0.8;
      let hid = false;
      for (const o of obs) if (o.soft && px > o.x1 && px < o.x2 && py > o.y1 && py < o.y2) { hid = true; break; }
      if (!hid) n++;
    }
    return n / 9;
  }

  // routes: card images don't block (they pass behind them) but the words between the rows do, so the way to another
  // row often runs through the strip by the dial. A coarse grid of each cell's distance to the nearest word, rebuilt at
  // most every 250 ms and only when a route is needed, and a breadth-first search over the cells a creature fits in.
  const CELL = 24;
  let gw = 0, gh = 0, clear = new Float32Array(0), clearAt = -1e9, clearY = NaN, seen = new Int16Array(0), from = new Int32Array(0);
  function clearance() {
    const now = performance.now();
    if (now - clearAt < 250 && clearY === scrollY && gw === Math.ceil(W / CELL) && gh === Math.ceil(H / CELL)) return;
    gw = Math.ceil(W / CELL); gh = Math.ceil(H / CELL);
    if (clear.length !== gw * gh) { clear = new Float32Array(gw * gh); seen = new Int16Array(gw * gh); from = new Int32Array(gw * gh); }
    const hard = obs.filter(o => !o.soft);
    for (let j = 0; j < gh; j++) for (let i = 0; i < gw; i++) {
      const x = (i + 0.5) * CELL, y = (j + 0.5) * CELL;
      let m = 1e4;
      for (const o of hard) { const g = gapTo(o, x, y); if (g < m) m = g; }
      clear[j * gw + i] = m;
    }
    clearAt = now; clearY = scrollY;
  }
  // steps from the creature to every cell it can reach (-1: can't), predecessors in `from`
  function reach(b) {
    clearance();
    seen.fill(-1);
    const fit = b.R + 4, ci = clamp(Math.floor(b.x / CELL), 0, gw - 1), cj = clamp(Math.floor(b.y / CELL), 0, gh - 1), q = [ci + cj * gw];
    seen[q[0]] = 0; from[q[0]] = -1;
    for (let h = 0; h < q.length; h++) {
      const c = q[h], i = c % gw, j = (c - i) / gw;
      for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const ni = i + di, nj = j + dj, n = ni + nj * gw;
        if (ni < 0 || nj < 0 || ni >= gw || nj >= gh || seen[n] >= 0 || clear[n] < fit) continue;
        seen[n] = Math.min(seen[c] + 1, 32000); from[n] = c; q.push(n);
      }
    }
  }
  // the waypoints to cell c (every third cell; the steering smooths the corners), ending at (x, y)
  function route(c, x, y) {
    const cells = [];
    for (let k = c; k >= 0; k = from[k]) cells.push(k);
    cells.reverse();
    const pts = [];
    for (let k = 3; k < cells.length - 1; k += 3) pts.push([(cells[k] % gw + 0.5) * CELL, (Math.floor(cells[k] / gw) + 0.5) * CELL]);
    pts.push([x, y]);
    return pts;
  }
  // a new destination: a spot it can reach, clear of words and at least partly in view (peeking out from behind a card
  // counts), away from the others (where they are and where they are heading) and from where it has been lately, so
  // they spread over the page and never settle in one area. `far`: at least 300 px off (it lingered).
  function pickGoal(b, far = false) {
    reach(b);
    let best = null, bs = -Infinity;
    for (let k = 0; k < 60; k++) {
      const c = Math.floor(Math.random() * gw * gh);
      if (seen[c] < 0) continue;
      const x = (c % gw + 0.5) * CELL, y = (Math.floor(c / gw) + 0.5) * CELL, dist = Math.hypot(x - b.x, y - b.y);
      if (far && dist < 300) continue;
      if (x < b.R || x > W - b.R || y < b.R || y > H - b.R) continue;
      const v = shown(b, x, y);
      if (v < 0.35) continue;
      let crowd = 400, been = 400;
      for (const o of bodies) if (o !== b && onScreen(o)) {
        crowd = Math.min(crowd, Math.hypot(o.x - x, o.y - y) - o.R - b.R);
        if (o.goal) crowd = Math.min(crowd, Math.hypot(o.goal[0] - x, o.goal[1] - y) - o.R - b.R);
      }
      for (const t of b.trail) been = Math.min(been, Math.hypot(t[0] - x, t[1] - y));
      const s = 0.03 * dist + 0.1 * Math.max(crowd, -100) + 0.07 * been + 12 * v + Math.random() * 12;
      if (s > bs) { bs = s; best = [x, y, c]; }
    }
    if (!best && far) return pickGoal(b);
    if (!best) { b.goal = null; b.path = []; b.goalT = 2; return; }
    b.goal = [best[0], best[1]]; b.path = route(best[2], best[0], best[1]);
    b.goalT = 10 + seen[best[2]] * CELL / 12;                      // time to get there at their unhurried pace (10-25 px/s)
  }
  // the way out: the nearest edge cell it can reach, then straight out over that edge. The nearest edge alone can be
  // walled off (the right edge sits behind the dial's column of words).
  function exitRoute(b) {
    reach(b);
    let bc = -1, bd = Infinity;
    for (let c = 0; c < gw * gh; c++) {
      if (seen[c] < 0 || seen[c] >= bd) continue;
      const i = c % gw, j = (c - i) / gw;
      if (i === 0 || j === 0 || i === gw - 1 || j === gh - 1) { bd = seen[c]; bc = c; }
    }
    if (bc < 0) { const [d, a] = nearestEdge(b); return { d, a, path: [] }; }
    const i = bc % gw, j = (bc - i) / gw, x = (i + 0.5) * CELL, y = (j + 0.5) * CELL;
    const a = i === 0 ? Math.PI : i === gw - 1 ? 0 : j === 0 ? -Math.PI / 2 : Math.PI / 2;
    return { d: bd * CELL, a, path: route(bc, x, y) };
  }
  // soft viewport edges: how strongly (0..1+) and which way the heading should turn back (they may half leave)
  function inward(b) {
    const z = 56, m = b.R * 0.5, L = m, Rr = W - m, Tp = m, B = H - m;
    let ix = 0, iy = 0;
    if (b.x < L + z) ix += ((L + z - b.x) / z) ** 2;
    if (b.x > Rr - z) ix -= ((b.x - Rr + z) / z) ** 2;
    if (b.y < Tp + z) iy += ((Tp + z - b.y) / z) ** 2;
    if (b.y > B - z) iy -= ((b.y - B + z) / z) ** 2;
    return [ix, iy];
  }
  const nearestEdge = b => [[b.x, Math.PI], [W - b.x, 0], [H - b.y, Math.PI / 2], [b.y, -Math.PI / 2]].reduce((m, o) => (o[0] < m[0] ? o : m));

  function step(dt, now) {
    T += dt;
    doze += ((sleeping ? 1 : 0) - doze) * (1 - Math.exp(-dt / 1.2));      // eases into and out of sleep
    hush += (hushTo - hush) * (1 - Math.exp(-dt / 0.45));
    const calmMode = reduce.matches;
    // personal space: a faint long-range push spreads them out, a firmer one stops overlaps
    for (const b of bodies) b.fx = b.fy = 0;
    for (let i = 0; i < bodies.length; i++) for (let j = i + 1; j < bodies.length; j++) {
      const a = bodies[i], b = bodies[j];
      if (!onScreen(a) || !onScreen(b)) continue;
      const dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy) || 0.01, near = a.R + b.R + 18;
      let f = 0;
      if (d < 280) f += 14 * (1 - d / 280) ** 2;
      if (d < near) f += 120 * (near - d) / near;
      const ux = dx / d * f, uy = dy / d * f;
      a.fx -= ux; a.fy -= uy; b.fx += ux; b.fy += uy;
    }
    let busy = bodies.filter(b => b.state === 'leave' || b.state === 'enter').length;
    const inertia = 1 - Math.exp(-1.8 * dt), fling = Math.exp(-2.6 * dt);
    for (const b of bodies) {
      if (b.state === 'out') {
        if (!sleeping && (b.wait -= dt) <= 0) { if (busy < 2 && enter(b)) busy++; else b.wait = 1; }
        continue;
      }
      if (b.wakeAt && now > b.wakeAt) { b.wakeAt = 0; b.mouth = 0.7; if (!calmMode) { b.ky -= 45; b.sqv += 2; } }   // a little start
      // once it has been around a while, it drifts off the next time it wanders near an edge
      if (b.state === 'roam' && !sleeping && (b.life -= dt) <= 0) {
        const out = exitRoute(b);
        if (busy >= 2) b.life = rand(4, 9);
        else if (out.d < 90 + b.R || b.life < -15) { b.state = 'leave'; b.exit = out.a + rand(-0.3, 0.3); b.path = out.path; b.leaveT = 0; busy++; }
      }
      // pace: personal factor × mood, eased so every change of speed glides
      if ((b.moodT -= dt) <= 0) mood(b);
      b.boost += (b.boostTo - b.boost) * (1 - Math.exp(-dt / 0.7));
      const lazy = b.state === 'roam' ? 1 - 0.94 * doze : 1 - 0.6 * doze;    // asleep: a near-still hover
      const sp = BASE * Math.sqrt(80 / b.S) * b.speed * b.boost * lazy * (b.state === 'leave' ? 1.4 : 1) * (1 + 0.15 * Math.sin(T * 0.37 + b.paceP)) * (calmMode ? 0.35 : 1) * hush;
      // wander: the turn rate is a smooth random walk, so the path meanders without a pattern
      b.om += (-b.om / 2.4) * dt + 0.32 * Math.sqrt(2 / 2.4) * Math.sqrt(dt) * gauss();
      b.th += b.om * dt * (1 - 0.85 * doze);
      // along a route: drop each waypoint once it is close, or once the next one is nearer
      while (b.path.length > 1 && (Math.hypot(b.path[0][0] - b.x, b.path[0][1] - b.y) < CELL * 1.5
        || Math.hypot(b.path[1][0] - b.x, b.path[1][1] - b.y) < Math.hypot(b.path[0][0] - b.x, b.path[0][1] - b.y))) b.path.shift();
      if (b.state === 'leave') {
        // follow the route to the edge, then straight out; a leave that stalls looks for the way again
        if ((b.leaveT += dt) > 10) { b.leaveT = 0; const out = exitRoute(b); b.exit = out.a; b.path = out.path; }
        if (b.path.length && Math.hypot(b.path.at(-1)[0] - b.x, b.path.at(-1)[1] - b.y) < CELL * 1.5) b.path = [];
        const aim = b.path.length ? Math.atan2(b.path[0][1] - b.y, b.path[0][0] - b.x) : b.exit;
        b.th += angDiff(aim, b.th) * Math.min(1, (b.path.length ? 1.8 : 1.1) * dt);
      } else if (b.state === 'roam') {
        // somewhere to go: along a route to an open spot away from the others; then a new one
        if (!sleeping && (!b.goal || (b.goalT -= dt) <= 0 || Math.hypot(b.goal[0] - b.x, b.goal[1] - b.y) < b.R)) pickGoal(b);
        // where it has been (the last 20 s), and how long it has kept to one spot: 8 s within 180 px with no route
        // under way (on a route it is slow, not stuck) sends it far off
        if ((b.trailT -= dt) <= 0) { b.trailT = 2; b.trail.push([b.x, b.y]); if (b.trail.length > 10) b.trail.shift(); }
        if (!b.stay || b.path.length > 1 || Math.hypot(b.x - b.stay[0], b.y - b.stay[1]) > 180) b.stay = [b.x, b.y, T];
        else if (!sleeping && T - b.stay[2] > 8) { pickGoal(b, true); b.stay = [b.x, b.y, T]; }
        const tgt = b.path.length ? b.path[0] : b.goal;
        if (tgt) b.th += angDiff(Math.atan2(tgt[1] - b.y, tgt[0] - b.x), b.th) * Math.min(1, (b.path.length > 1 ? 1.8 : 0.6) * dt * (1 - doze));
        const [ix, iy] = inward(b), w = Math.min(1, Math.hypot(ix, iy));
        if (w > 0) b.th += angDiff(Math.atan2(iy, ix), b.th) * Math.min(1, 1.5 * w * dt);   // turn back, never bounce
      }
      // only the boxes within reach matter this step
      const look = 16 + sp * 0.75, reach = look + b.R + RANGE;
      near.length = 0;
      for (const o of obs) if (o.x1 - reach < b.x && o.x2 + reach > b.x && o.y1 - reach < b.y && o.y2 + reach > b.y) near.push(o);
      // words and cards push, and the push soaks up the speed a creature closes in with
      const ux = b.vx + b.kx, uy = b.vy + b.ky;
      let ax = 0, ay = 0;
      for (const o of near) {
        const g = gapTo(o, b.x, b.y) - b.R, nx = NX, ny = NY;
        if (o.soft) continue;                                            // card images: they pass behind them
        if (g < RANGE) {
          const t = (RANGE - g) / RANGE, w = t * t, vn = ux * nx + uy * ny;
          ax += nx * w * 280; ay += ny * w * 280;
          if (vn < 0) { const k = Math.min(2, w) * 8; ax -= nx * vn * k; ay -= ny * vn * k; }
        }
      }
      // steering: look ahead along 16 directions and rate each for words, more mildly for sinking behind a card, for
      // a neighbour in the way and (while roaming) for the viewport's edge; then turn toward the open direction nearest
      // the wandering heading. A blocked heading always loses to an open one, so pockets and corners resolve outward.
      peers.length = 0;
      for (const o of bodies) if (o !== b && onScreen(o) && Math.abs(o.x - b.x) < reach + o.R && Math.abs(o.y - b.y) < reach + o.R) peers.push(o);
      const roaming = b.state === 'roam';
      if (near.length || peers.length || roaming) {
        const hx0 = Math.cos(b.th), hy0 = Math.sin(b.th), cur = ((Math.round(b.th / TAU * NDIR) % NDIR) + NDIR) % NDIR;
        let best = cur, bestS = -Infinity, ahead = 0;
        for (let i = 0; i < NDIR; i++) {
          let c = Infinity, q = Infinity, e = Infinity;
          for (let f = 0.5; f <= 1; f += 0.5) {
            const px = b.x + DX[i] * look * f, py = b.y + DY[i] * look * f;
            for (const o of near) if (!o.soft) { const g = gapTo(o, px, py) - b.R; if (g < c) c = g; }
            for (const o of peers) q = Math.min(q, Math.hypot(o.x - px, o.y - py) - o.R - b.R - 10);
            if (roaming) e = Math.min(e, px, W - px, py, H - py) + b.R * 0.4;
          }
          const danger = clamp((MARGIN + 4 - c) / (MARGIN + 4 + b.R * 0.6), 0, 1)
            + 0.35 * clamp(-q / b.R, 0, 1) + 0.8 * clamp(-e / b.R, 0, 1);
          const s = DX[i] * hx0 + DY[i] * hy0 - 6 * danger + (i === b.pick ? 0.12 : 0);
          if (s > bestS) { bestS = s; best = i; }
          if (i === cur) ahead = danger;
        }
        b.pick = best;
        if (ahead > 0.01) b.th += angDiff(Math.atan2(DY[best], DX[best]), b.th) * Math.min(1, (1.2 + 7 * Math.min(1, ahead)) * dt);
      }
      const tx = Math.cos(b.th) * sp, ty = Math.sin(b.th) * sp, calm = 1 - 0.7 * doze;
      b.vx += (tx - b.vx) * inertia + (ax + b.fx * calm) * dt;
      b.vy += (ty - b.vy) * inertia + (ay + b.fy * calm) * dt;
      b.x += (b.vx + b.kx) * dt; b.y += (b.vy + b.ky) * dt;
      b.kx *= fling; b.ky *= fling;                                         // a fling or lift eases out
      // last resort: fluff never rests on a word. Only acts when a word moved onto it (a layout change): it slides
      // out toward the clearest spot around it, so two words either side can't pin it; at most 3 px a frame.
      let worst = 0.5;
      for (const o of near) if (!o.soft) { const g = gapTo(o, b.x, b.y) - b.R; if (g < worst) worst = g; }
      if (worst < 0.5) {
        let ex = 0, ey = 0, eb = -Infinity;
        for (let i = 0; i < NDIR; i++) {
          const px = b.x + DX[i] * (b.R + 12), py = b.y + DY[i] * (b.R + 12);
          let c = Infinity;
          for (const o of near) if (!o.soft) c = Math.min(c, gapTo(o, px, py) - b.R);
          if (c > eb) { eb = c; ex = DX[i]; ey = DY[i]; }
        }
        const m = Math.min(0.5 - worst, 3), vn = b.vx * ex + b.vy * ey, kn = b.kx * ex + b.ky * ey;
        b.x += ex * m; b.y += ey * m;
        if (vn < 0) { b.vx -= ex * vn; b.vy -= ey * vn; }
        if (kn < 0) { b.kx -= ex * kn; b.ky -= ey * kn; }
      }
      // lazy tilt: a slow sway plus a lean into the drift, on a soft spring
      const soft = calmMode ? 0.5 : 1;
      const lean = clamp((b.vx + b.kx) / 90, -1, 1) * 0.16 * soft;
      const sway = (0.2 * Math.sin(T * b.tiltF + b.tiltP) + 0.07 * Math.sin(T * b.tiltF * 2.3 + b.tiltP * 1.7)) * (1 - 0.6 * doze) * soft;
      b.av += (-5 * (b.angle - lean - sway) - 2 * Math.sqrt(5) * 0.85 * b.av) * dt; b.angle += b.av * dt;
      // squash spring for reactions
      b.sqv += (-260 * b.sq - 2 * Math.sqrt(260) * 0.4 * b.sqv) * dt; b.sq += b.sqv * dt;
      b.bob += dt * TAU / (3.8 + 2 * doze); b.breath += dt * (2.1 - 0.7 * doze);
      b.mouth = Math.max(0, b.mouth - dt * 1.6);
      if (b.state === 'enter') {
        b.enterT += dt;
        if (fullyIn(b)) { b.state = 'roam'; b.life = rand(20, 45); }
        else if (b.enterT > 14) { b.state = 'out'; b.wait = 1; }
      } else if (gone(b)) { b.state = 'out'; b.wait = rand(1.5, 4.5); b.spinAt = -1; b.follow = false; }
    }
  }

  function paintFace(b, gx, gy, lid, mouth) {
    const g = b.views[0].fg, S = b.S;
    g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, S * FACE.w, S * FACE.h);
    g.translate(S * FACE.l, S * (FACE.t + FEET));                         // feet origin, body centre at (l, t)
    drawFeatures(g, { S, fy: -S * FEET, gx, gy, lid, sleeping, mouthOpen: mouth, accent: b.accent, foot: b.foot, parts: 'face', lightInk: !!b.ink });
  }

  function draw(now) {
    const calmMode = reduce.matches;
    for (const b of bodies) {
      const [lo, hi] = b.views, on = onScreen(b);
      if (on !== b.shown) { lo.w.hidden = !on; b.shown = on; }
      if (!on) { if (b.band) { hi.w.hidden = true; b.band = false; } continue; }
      let spin = 0, spinP = 0;
      if (b.spinAt >= 0) { const p = (now - b.spinAt) / 850; if (p >= 1) b.spinAt = -1; else { spinP = Math.max(0, p); spin = easeInOut(spinP) * TAU * b.spinDir; } }
      const bobY = Math.sin(b.bob) * b.bobA * (1 - 0.3 * doze) * (calmMode ? 0.5 : 1);
      const br = Math.sin(b.breath) * (0.012 + 0.012 * doze);
      const sy = (1 + br) * (1 - b.sq), sx = (1 - br * 0.8) * (1 + b.sq * 0.8);
      const x = b.x, y = b.y + bobY, rot = b.angle + spin;
      const tf = `translate3d(${(x - b.C / 2).toFixed(2)}px,${(y - b.C / 2).toFixed(2)}px,0) rotate(${rot.toFixed(4)}rad) scale(${sx.toFixed(4)},${sy.toFixed(4)})`;
      // the face: eyes follow the pointer, blink now and then, the mouth opens on a reaction, eyes shut in sleep
      let gx = pointer.x - x, gy = pointer.y - y;
      const gl = Math.hypot(gx, gy) || 1, reach = Math.min(1, gl / 240);
      gx = gx / gl * reach; gy = gy / gl * reach;
      const ca = Math.cos(-rot), sa = Math.sin(-rot);                      // gaze in body space
      const bx = Math.round((gx * ca - gy * sa) * 16) / 16, by = Math.round((gx * sa + gy * ca) * 16) / 16;
      let lid = 1;
      if (!sleeping && now > b.blinkAt) { const p = (now - b.blinkAt) / 140; if (p >= 1) b.blinkAt = now + 2000 + Math.random() * 4500; else lid = 1 - Math.sin(Math.PI * p) * 0.92; }
      const mouth = b.mouth > 0.2 ? Math.round(b.mouth * 10) / 10 : 0;
      const key = sleeping ? 'z' : `${bx},${by},${lid.toFixed(2)},${mouth}`;
      if (key !== b.key) { paintFace(b, bx, by, lid, mouth); b.key = key; b.faceNew = true; }
      if (sleeping !== b.asleep) { b.asleep = sleeping; lo.w.classList.toggle('is-asleep', sleeping); hi.w.classList.toggle('is-asleep', sleeping); }
      if (tf !== lo.tf) { lo.w.style.transform = tf; lo.tf = tf; }
      // the fringe trails the body: it streams back against the drift and swings on a loose, slightly bouncy spring
      // when the pace changes; a spin flings it out. Body space, composited. Held still under reduced motion.
      let ft = '';
      if (!calmMode) {
        const dt = (now - b.fT) / 1000; b.fT = now;
        if (dt > 0 && dt < 0.1) {
          const f = Math.min(1, dt * 14), lim = b.S * 0.05;
          b.fsx += ((x - b.fpx) / dt - b.fsx) * f; b.fsy += ((y - b.fpy) / dt - b.fsy) * f;
          const tx = clamp(-b.fsx * 0.024, -lim, lim), ty = clamp(-b.fsy * 0.024, -lim, lim);
          b.fvx += ((tx - b.fox) * 110 - b.fvx * 7.5) * dt; b.fvy += ((ty - b.foy) * 110 - b.fvy * 7.5) * dt;
          b.fox += b.fvx * dt; b.foy += b.fvy * dt;
        }
        b.fpx = x; b.fpy = y;
        const cr = Math.cos(rot), sr = Math.sin(rot), lx = b.fox * cr + b.foy * sr, ly = b.foy * cr - b.fox * sr;
        const puff = 1 + 0.008 * Math.sin(b.breath - 1.1) + 0.05 * Math.sin(Math.PI * spinP);
        ft = `translate(${lx.toFixed(2)}px,${ly.toFixed(2)}px) scale(${puff.toFixed(4)})`;
      }
      if (ft !== lo.ft) { lo.fur.style.transform = ft; lo.ft = ft; }
      // the twin inside the bar, only while some of the creature is up there
      if (y - b.C / 2 < barBottom) {
        if (!b.band) { hi.w.hidden = false; b.band = true; b.faceNew = true; }
        if (b.faceNew) { hi.fg.setTransform(1, 0, 0, 1, 0, 0); hi.fg.clearRect(0, 0, hi.face.width, hi.face.height); hi.fg.drawImage(lo.face, 0, 0); }
        if (tf !== hi.tf) { hi.w.style.transform = tf; hi.tf = tf; }
        if (ft !== hi.ft) { hi.fur.style.transform = ft; hi.ft = ft; }
      } else if (b.band) { hi.w.hidden = true; b.band = false; }
      b.faceNew = false;
    }
  }

  /* ───────── the loop ───────── */
  // scrolling: creatures over the sheet ride along with it, the rest stay put (decided once per scroll gesture)
  let sy0 = scrollY, scrollAt = 0;
  addEventListener('scroll', () => {
    const t = performance.now();
    if (t - scrollAt > 180) for (const b of bodies) b.follow = onScreen(b) && b.y > barBottom + b.R * 0.5 && b.x - b.R < contentRight;
    scrollAt = t;
  }, { passive: true });
  dial.addEventListener('pointermove', e => { dialY = e.clientY; if (dialMeasuredY === null || Math.abs(dialY - dialMeasuredY) > 10) measureDial(); });
  dial.addEventListener('pointerleave', () => { dialY = null; measureDial(); });

  let last = performance.now(), raf = 0, paused = false, steady = 0, lastSig = '';
  function kick() { if (!raf && !narrow.matches && !document.hidden) { last = performance.now(); raf = requestAnimationFrame(crewFrame); } }
  function crewFrame(now) {
    raf = 0;
    if (narrow.matches || document.hidden) return;                       // restarted by the media query / visibility
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    const hide = covered();                                               // nothing to see under the detail view
    if (hide !== paused) { paused = hide; low.classList.toggle('is-paused', hide); high.classList.toggle('is-paused', hide); }
    if (hide) sy0 = scrollY;
    else {
      // first placement waits for a settled layout (fonts in, the same word boxes three frames running), so no word
      // lands on a creature right after it appears
      if (!bodies.length) build();
      if (!placed || dirty || now - measuredAt > 250 || Math.abs(scrollY - measuredY) > H * 0.5) measure(now);
      gather();
      if (!placed) {
        const sig = obs.map(o => `${o.x1 | 0},${o.y1 | 0},${o.x2 | 0},${o.y2 | 0}`).join(';');
        steady = sig === lastSig && document.fonts?.status !== 'loading' ? steady + 1 : 0; lastSig = sig;
        if (steady >= 3) { scatter(); placed = true; } else { raf = requestAnimationFrame(crewFrame); return; }
      }
      if (!sleeping && now - lastActive > IDLE) sleeping = true;
      const dy = scrollY - sy0; sy0 = scrollY;
      if (dy) for (const b of bodies) if (b.follow) { b.y -= dy; if (b.goal) b.goal[1] -= dy; for (const t of b.path) t[1] -= dy; }
      const n = Math.ceil(dt * 60 - 1e-6);
      for (let i = 0; i < n; i++) step(dt / n, now);
      draw(now);
    }
    raf = requestAnimationFrame(crewFrame);
  }
  narrow.addEventListener('change', () => { dirty = true; kick(); });
  document.addEventListener('visibilitychange', kick);
  addEventListener('resize', () => { dirty = true; });
  document.fonts?.ready.then(() => { dirty = true; });
  kick();

  // pick a creature fully in view, so its reaction can be seen
  const pickVisible = (by = null) => {
    const pool = bodies.filter(fullyIn), any = pool.length ? pool : bodies.filter(onScreen);
    if (!any.length) return null;
    return by ? any.reduce((m, b) => (by(b) < by(m) ? b : m)) : any[Math.floor(Math.random() * any.length)];
  };
  return {
    refresh() { dirty = true; },
    // a card preview is playing: everyone slows to about 0.4x, then picks the pace back up
    hush(on) { hushTo = on ? 0.4 : 1; },
    // heart: a happy little lift and spin, by one with room above it (no word or neighbour in the way)
    cheer() {
      const above = b => {
        let m = b.y - b.R;
        for (const o of obs) if (!o.soft && o.y2 <= b.y && o.x1 < b.x + b.R && o.x2 > b.x - b.R) m = Math.min(m, b.y - b.R - o.y2);
        for (const o of bodies) if (o !== b && onScreen(o) && o.y < b.y && Math.abs(o.x - b.x) < o.R + b.R) m = Math.min(m, b.y - o.y - o.R - b.R);
        return m;
      };
      const pool = bodies.filter(fullyIn), roomy = pool.filter(o => above(o) > 60);
      const b = roomy.length ? roomy[Math.floor(Math.random() * roomy.length)] : pool.length ? pool.reduce((m, o) => (above(o) > above(m) ? o : m)) : null;
      if (b) { b.sqv += 2.5; b.mouth = 1; if (!reduce.matches) { b.spinAt = performance.now(); b.spinDir = b.vx >= 0 ? 1 : -1; b.ky -= 110; } }
      wake();
    },
    // a creature throws something toward `to`: returns where it starts (viewport coordinates); the throw flings it back
    toss(to) {
      const b = pickVisible(to ? o => Math.hypot(o.x - to.x, o.y - to.y) : null);
      wake();
      if (!b) return to;
      const dx = to ? b.x - to.x : 1, dy = to ? b.y - to.y : 0, d = Math.hypot(dx, dy) || 1;
      b.kx += dx / d * 150; b.ky += dy / d * 150 - 40; b.av += 3.2 * (dx < 0 ? -1 : 1); b.sqv += 3; b.mouth = 1;
      return { x: b.x, y: b.y - b.S * 0.34 };
    },
    get visible() { return !narrow.matches && bodies.some(fullyIn); },
  };
}
