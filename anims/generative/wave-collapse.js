// Wave function collapse: an island map that writes itself, one cell at a time. Every cell starts as a superposition of
// seven terrains, from deep water up through shallows, sand, grass, forest and hills to snow, and the only rule is that
// neighbours may differ by one step at most. The solver keeps collapsing the cell with the least uncertainty left
// (lowest Shannon entropy over the terrains it can still be, weighted by how common each is) to one terrain, then
// propagates: each neighbour can now only be what that terrain allows, and so on outward, which is why the map grows
// as a coherent frontier with coastlines, beaches and ridges. A contradiction (a cell left with no possible terrain)
// is repaired locally: the patch around it dissolves back into superposition and is solved again. The frame is fixed to
// deep water, so the land comes out as islands. Finished, it holds, dissolves and starts again from a new seed.
// Press and drag to dissolve a patch yourself and watch it regrow to fit everything around it.
// Drawn as pixel art: the collapsed cells form a height field that is interpolated between cell centres and banded by
// terrain, so coastlines are smooth contours rather than squares; unsolved cells show their remaining options.
const PARAMS = { cell: 22, speed: 5, land: 1 };

export default function (stage) {
  const canvas = document.createElement('canvas');
  canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block;touch-action:none;image-rendering:pixelated';
  stage.append(canvas);
  const ctx = canvas.getContext('2d');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  const NL = 7, FULL = (1 << NL) - 1, ART = 6;                        // terrains, the all-possible mask, art pixels per cell
  const COL = [[22, 52, 92], [44, 104, 150], [222, 204, 150], [104, 160, 72], [48, 104, 56], [128, 120, 104], [238, 242, 246]];
  const DARK = [[14, 34, 66], [30, 78, 118], [188, 168, 116], [78, 128, 52], [30, 74, 40], [96, 90, 78], [196, 204, 214]];
  let gw = 0, gh = 0, cs = 22, mask, lvl, flash, bias, seed = 1, state = 'solve', holdT = 0, dissolveOrder = [], dIdx = 0;
  let art, artData, ox = 0, oy = 0;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const W8 = () => { const k = PARAMS.land; return [3.2 / k, 1.4, 1 * k, 2.2 * k, 1.7 * k, 0.9 * k, 0.45 * k]; };
  const pop = m => { let c = 0; while (m) { c += m & 1; m >>= 1; } return c; };
  const spread = m => (m | (m << 1) | (m >> 1)) & FULL;              // what a neighbour may be, given this cell's options

  function reset(newSeed) {
    if (newSeed) seed = 1 + Math.floor(Math.random() * 2147483646);
    mask = new Uint8Array(gw * gh).fill(FULL); lvl = new Int8Array(gw * gh).fill(-1); flash = new Float32Array(gw * gh);
    // a soft preference per cell from low-frequency noise (falling off toward the frame): it only tilts the odds of
    // each terrain, the adjacency rule still decides, so the land comes out as a few continents rather than confetti
    bias = new Float32Array(gw * gh);
    const s0 = rnd() * 100, s1 = rnd() * 100;
    const vn = (x, y) => { const xi = Math.floor(x), yi = Math.floor(y), fx = x - xi, fy = y - yi, u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy);
      const h = (a, b) => { const k = Math.sin(a * 127.1 + b * 311.7 + s0) * 43758.5453; return k - Math.floor(k); };
      return (h(xi, yi) * (1 - u) + h(xi + 1, yi) * u) * (1 - v) + (h(xi, yi + 1) * (1 - u) + h(xi + 1, yi + 1) * u) * v; };
    for (let y = 0; y < gh; y++) for (let x = 0; x < gw; x++) {
      const nx = x / gw, ny = y / gh, n = vn(nx * 3.2 + s1, ny * 3.2 * gh / gw * 1.6) * 0.65 + vn(nx * 7 + 9, ny * 7 * gh / gw * 1.6 + s1) * 0.35;
      const edge = Math.min(nx, 1 - nx, ny, 1 - ny) * 2;
      bias[y * gw + x] = Math.max(0, Math.min(NL - 1, (n * 1.45 - 0.24) * (NL - 0.5) * Math.min(1, edge * 2.6) * PARAMS.land));
    }
    for (let x = 0; x < gw; x++) for (const y of [0, gh - 1]) fix(x, y, 0);
    for (let y = 0; y < gh; y++) for (const x of [0, gw - 1]) fix(x, y, 0);
    // a few peaks somewhere inside, so the islands have somewhere to rise from (they must sit far enough from the frame)
    const peaks = 2 + Math.floor(rnd() * 3);
    for (let k = 0, tries = 0; k < peaks && tries < 40; tries++) {
      const l = 4 + Math.floor(rnd() * 3), x = l + 1 + Math.floor(rnd() * Math.max(1, gw - 2 * l - 2)), y = l + 1 + Math.floor(rnd() * Math.max(1, gh - 2 * l - 2));
      if (x >= gw - l - 1 || y >= gh - l - 1 || bias[y * gw + x] < 3.2) continue;
      const keep = mask.slice(), keepL = lvl.slice(); fix(x, y, l);
      if (propagate([y * gw + x]) >= 0) { mask.set(keep); lvl.set(keepL); continue; }
      k++;
    }
    propagateAll();
    state = 'solve';
  }
  function fix(x, y, l) { const i = y * gw + x; mask[i] = 1 << l; lvl[i] = l; }
  // arc consistency: shrink every neighbour to what its cell allows, until nothing changes
  function propagate(stack) {
    while (stack.length) {
      const i = stack.pop(), x = i % gw, y = (i / gw) | 0, allow = spread(mask[i]);
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = x + dx, ny = y + dy; if (nx < 0 || ny < 0 || nx >= gw || ny >= gh) continue;
        const j = ny * gw + nx, m = mask[j] & allow;
        if (m === mask[j]) continue;
        if (!m) return j;                                              // a contradiction at j
        mask[j] = m; stack.push(j);
      }
    }
    return -1;
  }
  function propagateAll() { const st = []; for (let i = 0; i < gw * gh; i++) if (mask[i] !== FULL) st.push(i); return propagate(st); }
  // entropy of every possible option set, recomputed once per solving step (the weights follow the land slider)
  const ENT = new Float32Array(FULL + 1);
  function entropies() { const w = W8(); for (let m = 1; m <= FULL; m++) { let s = 0, sl = 0; for (let l = 0; l < NL; l++) if (m >> l & 1) { s += w[l]; sl += w[l] * Math.log(w[l]); } ENT[m] = Math.log(s) - sl / s; } }
  // dissolve a patch back into superposition (a repair, or the pointer), then make it consistent with what surrounds it
  function dissolve(cx0, cy0, r) {
    for (let y = Math.max(1, cy0 - r); y <= Math.min(gh - 2, cy0 + r); y++) for (let x = Math.max(1, cx0 - r); x <= Math.min(gw - 2, cx0 + r); x++) {
      if ((x - cx0) ** 2 + (y - cy0) ** 2 > r * r + 0.5) continue;
      const i = y * gw + x; mask[i] = FULL; lvl[i] = -1;
    }
    // re-derive every open cell's options from the solved cells around it
    for (let i = 0; i < gw * gh; i++) if (lvl[i] < 0) mask[i] = FULL;
    const bad = propagateAll(); if (bad >= 0) dissolve(bad % gw, (bad / gw) | 0, r + 1);
  }
  function step() {
    entropies();
    let best = -1, be = 1e9;
    for (let i = 0; i < gw * gh; i++) {
      if (lvl[i] >= 0) continue;
      const m = mask[i];
      if (pop(m) === 1) { lvl[i] = 31 - Math.clz32(m); flash[i] = 1; continue; }   // already decided by its neighbours
      const e = ENT[m] + rnd() * 0.02;
      if (e < be) { be = e; best = i; }
    }
    if (best < 0) return false;
    // collapse: pick one of its terrains by weight, favouring what its solved neighbours already are (so regions come
    // out coherent instead of speckled)
    const w = W8().slice(), m = mask[best], bx = best % gw, by = (best / gw) | 0, bb = bias[best];
    for (let l = 0; l < NL; l++) w[l] *= Math.exp(-((l - bb) ** 2) / 1.6);
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, -1], [1, -1], [-1, 1]]) { const nx = bx + dx, ny = by + dy; if (nx < 0 || ny < 0 || nx >= gw || ny >= gh) continue; const l = lvl[ny * gw + nx]; if (l >= 0) w[l] *= 2.2; }
    let tot = 0; for (let l = 0; l < NL; l++) if (m >> l & 1) tot += w[l];
    let r = rnd() * tot, pick = 0; for (let l = 0; l < NL; l++) if (m >> l & 1) { r -= w[l]; if (r <= 0) { pick = l; break; } pick = l; }
    mask[best] = 1 << pick; lvl[best] = pick; flash[best] = 1;
    const bad = propagate([best]);
    if (bad >= 0) dissolve(bad % gw, (bad / gw) | 0, 3);
    return true;
  }

  function resize() {
    const w = stage.clientWidth || 1, h = stage.clientHeight || 1;
    cs = Math.max(12, Math.round(PARAMS.cell * Math.min(1, Math.sqrt(w * h / (1280 * 760)) * 1.15)));
    gw = Math.max(8, Math.floor(w / cs)); gh = Math.max(6, Math.floor(h / cs));
    canvas.width = gw * ART; canvas.height = gh * ART;
    // the art buffer is gw*ART by gh*ART pixels, shown scaled up with crisp pixels and centred (cover)
    const scale = Math.max(w / (gw * ART), h / (gh * ART));
    canvas.style.inset = ''; canvas.style.width = gw * ART * scale + 'px'; canvas.style.height = gh * ART * scale + 'px';
    canvas.style.left = (w - gw * ART * scale) / 2 + 'px'; canvas.style.top = (h - gh * ART * scale) / 2 + 'px';
    art = ctx.createImageData(gw * ART, gh * ART); artData = art.data;
    seed = 12345; reset(false);
    if (reduce) { while (step()); flash.fill(0); state = 'hold'; render(0); }   // a finished map, with no just-solved flashes
  }

  // ── drawing: interpolate the solved levels between cell centres, band them into terrains, add texture
  const hash = (x, y) => { let h = (x * 374761393 + y * 668265263) ^ seed; h = (h ^ (h >>> 13)) * 1274126177; return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
  const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map(v => v / 16 - 0.47);
  function render(t) {
    const AW = gw * ART, d = artData;
    for (let py = 0; py < gh * ART; py++) {
      const fy = (py + 0.5) / ART - 0.5, y0 = Math.max(0, Math.min(gh - 1, Math.floor(fy))), y1 = Math.min(gh - 1, y0 + 1), ty = Math.max(0, Math.min(1, fy - y0));
      for (let px = 0; px < AW; px++) {
        const fx = (px + 0.5) / ART - 0.5, x0 = Math.max(0, Math.min(gw - 1, Math.floor(fx))), x1 = Math.min(gw - 1, x0 + 1), tx = Math.max(0, Math.min(1, fx - x0));
        const own = ((py / ART) | 0) * gw + ((px / ART) | 0), o = (py * AW + px) * 4;
        const a = lvl[y0 * gw + x0], b = lvl[y0 * gw + x1], c = lvl[y1 * gw + x0], e = lvl[y1 * gw + x1];
        let r, g, bl;
        if (lvl[own] < 0) {
          // unsolved: a dark blueprint, its options shown as faint stripes of their colours, flickering at the frontier
          const m = mask[own], n = pop(m), lx = px % ART, ly = py % ART;
          const opt = (lx + ly + ((t * 6) | 0)) % NL; let l = opt; while (!(m >> l & 1)) l = (l + 1) % NL;
          const k = n === NL ? 0.1 : 0.32 - n * 0.03;
          r = 13 + COL[l][0] * k; g = 17 + COL[l][1] * k; bl = 24 + COL[l][2] * k;
          if (lx === 0 || ly === 0) { r += 10; g += 12; bl += 16; }
        } else {
          // solved: blend the neighbouring levels (treating unsolved ones as this cell's own) and band the result
          const s = lvl[own], A = a < 0 ? s : a, B2 = b < 0 ? s : b, C = c < 0 ? s : c, E2 = e < 0 ? s : e;
          const h = (A * (1 - tx) + B2 * tx) * (1 - ty) + (C * (1 - tx) + E2 * tx) * ty + BAYER[(py & 3) * 4 + (px & 3)] * 0.22;
          const L = Math.max(0, Math.min(NL - 1, Math.round(h))), f = h - L;
          const nz = hash(px, py);
          let base = COL[L], dk = DARK[L];
          r = base[0]; g = base[1]; bl = base[2];
          if (L <= 1) {   // water: deeper toward the middle of its band, with moving wave glints
            const wv = Math.sin(px * 0.35 + py * 0.9 - t * 2.2) * Math.sin(py * 0.5 - t * 1.3 + px * 0.1);
            if (wv > 0.9 && nz > 0.55 && hash(px >> 3, py >> 2) > 0.5) { r += 34; g += 44; bl += 44; }
            if (L === 1 && f > 0.3) { r += 40; g += 40; bl += 30; }   // surf at the beach
          } else if (L === 4) {   // forest: tree crowns with a shadow underneath
            const tx2 = px % 4, ty2 = py % 4, crown = hash(px >> 2, py >> 2) > 0.3;
            if (crown && tx2 > 0 && ty2 > 0 && tx2 + ty2 < 6) { if (ty2 === 3 || tx2 === 3) { r = dk[0]; g = dk[1]; bl = dk[2]; } else if (tx2 === 1 && ty2 === 1) { r += 30; g += 40; bl += 20; } }
          } else if (L === 5) {   // hills: lit from the upper left by their slope
            const sl = (B2 - A) * 0.6 + (C - A) * 0.6; if (sl > 0.2) { r = dk[0]; g = dk[1]; bl = dk[2]; } else if (sl < -0.2) { r += 26; g += 26; bl += 22; }
          } else if (L === 2 || L === 3) {   // sand and grass: speckle
            if (nz > 0.86) { r = dk[0]; g = dk[1]; bl = dk[2]; } else if (L === 3 && nz < 0.03) { r = 240; g = 220; bl = 120; }   // the odd flower
          }
          if (f < -0.38 && L > 1) { r *= 0.82; g *= 0.82; bl *= 0.82; }   // a darker rim at each step down
          const fl = flash[own]; if (fl > 0) { r += (255 - r) * fl * 0.7; g += (255 - g) * fl * 0.7; bl += (255 - bl) * fl * 0.7; }
        }
        d[o] = r; d[o + 1] = g; d[o + 2] = bl; d[o + 3] = 255;
      }
    }
    ctx.putImageData(art, 0, 0);
  }

  // ── pointer: press and drag to dissolve a patch
  let down = false;
  const cellAt = e => { const b = canvas.getBoundingClientRect(); return [Math.floor((e.clientX - b.left) / b.width * gw), Math.floor((e.clientY - b.top) / b.height * gh)]; };
  const onDown = e => { down = true; canvas.setPointerCapture?.(e.pointerId); const [x, y] = cellAt(e); dissolve(x, y, 3); if (state !== 'solve') state = 'solve'; };
  const onMove = e => { if (!down) return; const [x, y] = cellAt(e); dissolve(x, y, 3); state = 'solve'; };
  const onUp = () => { down = false; };
  canvas.addEventListener('pointerdown', onDown); canvas.addEventListener('pointermove', onMove); canvas.addEventListener('pointerup', onUp); canvas.addEventListener('pointercancel', onUp);

  const ro = new ResizeObserver(resize); ro.observe(stage); resize();
  let raf = 0, last = performance.now(), t = 0, acc = 0;
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000); last = now; t += dt;
    for (let i = 0; i < flash.length; i++) if (flash[i] > 0) flash[i] = Math.max(0, flash[i] - dt * 3);
    if (state === 'solve') {
      acc += PARAMS.speed * dt * 60;
      while (acc >= 1) { acc -= 1; if (!step()) { state = 'hold'; holdT = 0; break; } }
    } else if (state === 'hold') {
      holdT += dt;
      if (holdT > 4.5) { state = 'dissolve'; dissolveOrder = [...Array(gw * gh).keys()].filter(i => { const x = i % gw, y = (i / gw) | 0; return x > 0 && y > 0 && x < gw - 1 && y < gh - 1; }).sort(() => Math.random() - 0.5); dIdx = 0; }
    } else if (state === 'dissolve') {
      const n = Math.ceil(dissolveOrder.length * dt / 0.9);
      for (let k = 0; k < n && dIdx < dissolveOrder.length; k++, dIdx++) { const i = dissolveOrder[dIdx]; mask[i] = FULL; lvl[i] = -1; }
      if (dIdx >= dissolveOrder.length) reset(true);
    }
    render(t);
    raf = requestAnimationFrame(frame);
  }
  if (!reduce) raf = requestAnimationFrame(frame);
  return () => {
    cancelAnimationFrame(raf); ro.disconnect();
    canvas.removeEventListener('pointerdown', onDown); canvas.removeEventListener('pointermove', onMove); canvas.removeEventListener('pointerup', onUp); canvas.removeEventListener('pointercancel', onUp);
    canvas.remove();
  };
}
