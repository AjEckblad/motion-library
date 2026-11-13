// Leaf venation: a leaf grows against the light and its veins grow with it, by space colonisation (Runions et al.,
// 2005). As the blade enlarges, points of auxin, the hormone that calls veins, appear wherever there is room between
// the veins already there. Each point pulls on the one vein tip nearest to it; every tip that is pulled grows a step
// toward the average direction of its points, and a point is used up once a vein reaches it. That is all: the midrib,
// the secondary veins arching toward the margin and the fine net closing into small areoles all come out of it.
// Vein thickness follows the pipe model (Murray's law): a vein's radius cubed is the sum of its branches' radii cubed,
// so the midrib is heavy and the last twigs are hairlines. Backlit by a low sun, the lamina glows and the veins show
// as pale channels; when the leaf is grown, autumn creeps in from the margin, the leaf lets go, and a new one, of
// another shape, begins. Move across it to move the sun behind it.
// Canvas 2D: the veins live in the leaf's own coordinates (it grows uniformly, so they scale with it), a grid makes
// the nearest-tip search cheap, and segments are drawn in a few batches by width.
const PARAMS = { density: 1, speed: 1, light: 1 };

export default function (stage) {
  const canvas = document.createElement('canvas');
  canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block;touch-action:pan-y';
  stage.append(canvas);
  const ctx = canvas.getContext('2d');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const TAU = Math.PI * 2;

  let W = 1, H = 1, dpr = 1, seed = 11;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;

  // ── one leaf: its shape, its veins and the auxin points still waiting for one
  let leaf, nodes, sources, T = 0, phase = 'grow', phaseT = 0;
  const STEP = 0.012, KILL = 0.014, SHAPES = [
    { wide: 0.46, at: 0.12, tip: 1.5, base: 0.7, teeth: 0 },          // ovate, smooth
    { wide: 0.32, at: -0.05, tip: 1.2, base: 1.1, teeth: 0.012 },     // lanceolate, finely toothed
    { wide: 0.56, at: 0.25, tip: 1.9, base: 0.5, teeth: 0.02 },       // broad, cordate-ish, toothed
    { wide: 0.4, at: 0.05, tip: 1.35, base: 0.85, teeth: 0 },         // elliptic
  ];
  // half-width of the blade at height y (the leaf runs from the petiole at y = 1 to the tip at y = -1)
  function halfW(y, s) {
    if (y <= -1 || y >= 1) return 0;
    const u = (1 - y) / 2;                                             // 0 at the base, 1 at the tip
    const body = Math.pow(Math.sin(Math.PI * Math.pow(u, s.base)), 1) * Math.pow(1 - u, s.tip - 1);
    return s.wide * body * (1 + s.at * (0.5 - u)) * 1.3;
  }
  function inside(x, y, grow) { const s = leaf.shape, hw = halfW(y, s); if (hw <= 0) return false; const tooth = s.teeth ? s.teeth * Math.abs(Math.sin(y * 70)) * Math.min(1, hw / 0.15) : 0; return Math.abs(x) < (hw - tooth) * grow; }

  function newLeaf() {
    seed = 1 + Math.floor(Math.random() * 2147483646);
    const shape = SHAPES[Math.floor(rnd() * SHAPES.length)];
    leaf = { shape, tilt: (rnd() - 0.5) * 0.5, hue: rnd(), grow: 0.08 };
    nodes = [{ x: 0, y: 1, p: -1, r: 0, kids: 0, born: 0 }];
    // the midrib forms first, from the petiole to just short of the apex (in a real leaf it is laid down before the
    // rest); everything else branches off it, so the pipe model tapers it smoothly toward the tip
    const nMid = Math.floor(1.9 / STEP);
    for (let i = 1; i <= nMid; i++) nodes.push({ x: 0, y: 1 - i * STEP, p: i - 1, r: 0, kids: 0, born: 0 });
    sources = []; T = 0; phase = 'grow'; phaseT = 0;
    grid = new Map();
    for (let i = 0; i < nodes.length; i++) gridAdd(i);
  }

  // ── a coarse grid over leaf space for nearest-node searches
  let grid = new Map(); const GC = 0.06;
  const gkey = (x, y) => (Math.floor(x / GC) + 100) * 1000 + Math.floor(y / GC) + 100;
  function gridAdd(i) { const k = gkey(nodes[i].x, nodes[i].y); let a = grid.get(k); if (!a) grid.set(k, a = []); a.push(i); }
  function nearest(x, y, maxR) {
    let best = -1, bd = maxR * maxR; const r = Math.ceil(maxR / GC), cx = Math.floor(x / GC) + 100, cy = Math.floor(y / GC) + 100;
    for (let gx = cx - r; gx <= cx + r; gx++) for (let gy = cy - r; gy <= cy + r; gy++) { const a = grid.get(gx * 1000 + gy); if (!a) continue; for (const i of a) { const dx = nodes[i].x - x, dy = nodes[i].y - y, d = dx * dx + dy * dy; if (d < bd) { bd = d; best = i; } } }
    return best;
  }

  // ── one growth step: the leaf enlarges, new auxin points fill the room it made, veins grow toward them
  function step() {
    const g = leaf.grow;
    leaf.grow = Math.min(1, g + 0.0022 * PARAMS.speed);
    // new sources: try a handful of random points; keep those clear of veins and of other sources (in grown space,
    // so their spacing stays the same as the leaf enlarges)
    const minD = 0.034 / Math.sqrt(PARAMS.density) / Math.max(0.25, leaf.grow);
    for (let k = 0; k < 40; k++) {
      const y = 1 - rnd() * 2, x = (rnd() * 2 - 1) * 0.8;
      if (!inside(x, y, leaf.grow)) continue;
      // marginal growth: while the blade is still enlarging, auxin appears only in a band just inside its edge, so
      // veins chase the margin outward as long secondaries; once grown, the interior fills in and closes the net
      const edge = halfW(y, leaf.shape) * leaf.grow - Math.abs(x);
      if (leaf.grow < 1 && edge > 0.07 && y > -0.85) continue;
      if (nearest(x, y, minD) >= 0) continue;
      let ok = true; for (const s of sources) if ((s.x - x) ** 2 + (s.y - y) ** 2 < minD * minD) { ok = false; break; }
      if (ok) sources.push({ x, y });
    }
    // each source pulls only the vein node nearest to it (open venation)
    const pull = new Map();
    for (const s of sources) { const i = nearest(s.x, s.y, 0.6); if (i < 0) continue; const n = nodes[i], dx = s.x - n.x, dy = s.y - n.y, l = Math.hypot(dx, dy) || 1; const v = pull.get(i) || [0, 0, 0]; v[0] += dx / l; v[1] += dy / l; v[2]++; pull.set(i, v); }
    for (const [i, v] of pull) {
      const n = nodes[i]; let dx = v[0] / v[2], dy = v[1] / v[2];
      // a vein keeps some of its own heading (no zigzag) and leans a little toward the tip, so secondaries arch
      if (n.p >= 0) { const q = nodes[n.p], qx = n.x - q.x, qy = n.y - q.y, ql = Math.hypot(qx, qy) || 1; dx += qx / ql * 0.45; dy += qy / ql * 0.45; }
      dy -= 0.3;
      const l = Math.hypot(dx, dy); if (l < 1e-3) continue;
      const nx = n.x + dx / l * STEP, ny = n.y + dy / l * STEP;
      if (!inside(nx, ny, leaf.grow * 1.02)) continue;
      nodes.push({ x: nx, y: ny, p: i, r: 0, kids: 0, born: T }); n.kids++; gridAdd(nodes.length - 1);
    }
    // a source is used up once a vein reaches it
    sources = sources.filter(s => { const i = nearest(s.x, s.y, KILL); return i < 0; });
  }

  // the pipe model: from the tips back to the petiole, r³ of a node is the sum of its children's r³
  function radii() {
    for (const n of nodes) n.r = 0;
    for (let i = nodes.length - 1; i >= 0; i--) { const n = nodes[i]; if (n.r === 0) n.r = 1; if (n.p >= 0) nodes[n.p].r += n.r; }   // r here holds the r³ sum
    for (const n of nodes) n.r = Math.cbrt(n.r);
  }

  // ── drawing
  let sunX = 0.3, sunY = -0.2;
  function draw() {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const w = W, h = H;
    // the sky behind: a warm low sun glowing through
    const sx = w * (0.5 + sunX * 0.35), sy = h * (0.45 + sunY * 0.3);
    const bg = ctx.createRadialGradient(sx, sy, 0, sx, sy, Math.max(w, h) * 0.9);
    bg.addColorStop(0, `rgba(255,214,140,${0.85 * PARAMS.light})`); bg.addColorStop(0.25, '#6a5a3a'); bg.addColorStop(1, '#14130f');
    ctx.fillStyle = bg; ctx.fillRect(0, 0, w, h);

    const L = Math.min(w * 0.42, h * 0.35) * (0.25 + 0.75 * leaf.grow), cx = w / 2, cy = h * 0.43;
    const fall = phase === 'fall' ? phaseT : 0, alpha = phase === 'fall' ? Math.max(0, 1 - phaseT / 1.6) : 1;
    ctx.save();
    ctx.translate(cx + fall * fall * 30, cy + fall * fall * 120); ctx.rotate(leaf.tilt + fall * 0.5);
    ctx.globalAlpha = alpha;
    // the petiole
    ctx.strokeStyle = '#6f7a2c'; ctx.lineCap = 'round'; ctx.lineWidth = Math.max(1.5, L * 0.028);
    ctx.beginPath(); ctx.moveTo(0, L); ctx.quadraticCurveTo(L * 0.04, L * 1.25, L * 0.12, L * 1.45); ctx.stroke();
    // the blade outline
    const s = leaf.shape, path = new Path2D(), N = 160;
    for (let i = 0; i <= N; i++) { const y = -1 + 2 * i / N, hw0 = halfW(y, s), hw = hw0 - (s.teeth ? s.teeth * Math.abs(Math.sin(y * 70)) * Math.min(1, hw0 / 0.15) : 0); i ? path.lineTo(hw * L, y * L) : path.moveTo(hw * L, y * L); }
    for (let i = N; i >= 0; i--) { const y = -1 + 2 * i / N, hw0 = halfW(y, s), hw = hw0 - (s.teeth ? s.teeth * Math.abs(Math.sin(y * 70)) * Math.min(1, hw0 / 0.15) : 0); path.lineTo(-hw * L, y * L); }
    path.closePath();
    // the lamina, backlit: brightest where the sun is behind it, autumn spreading from the margin when it is time
    const au = phase === 'autumn' ? Math.min(1, phaseT / 4) : phase === 'fall' ? 1 : 0;
    const lx = (sx - cx), ly = (sy - cy);
    const lg = ctx.createRadialGradient(lx * 0.4, ly * 0.4, 0, 0, 0, L * 1.1);
    const green = [[150, 196, 60], [92, 140, 40], [40, 78, 26]], fallC = [[250, 196, 70], [226, 120, 34], [150, 52, 22]];
    const mix = (a, b, t) => a.map((v, k) => Math.round(v + (b[k] - v) * t));
    const c0 = mix(green[0], fallC[0], au * au), c1 = mix(green[1], fallC[1], au), c2 = mix(green[2], fallC[2], Math.min(1, au * 1.4));
    lg.addColorStop(0, `rgb(${c0})`); lg.addColorStop(0.55, `rgb(${c1})`); lg.addColorStop(1, `rgb(${c2})`);
    ctx.fillStyle = lg; ctx.fill(path);
    ctx.save(); ctx.clip(path);
    // a fine cell texture in the lamina, and darker toward the margin
    const rim = ctx.createRadialGradient(0, 0, L * 0.4, 0, 0, L * 1.05); rim.addColorStop(0, 'rgba(0,0,0,0)'); rim.addColorStop(1, 'rgba(20,30,8,.45)'); ctx.fillStyle = rim; ctx.fillRect(-L, -L, L * 2, L * 2);
    // the veins: pale translucent channels, widest at the midrib (batched by width)
    radii();
    const k = L * 0.0022, bins = 7, paths = Array.from({ length: bins }, () => new Path2D());
    for (let i = 1; i < nodes.length; i++) {
      const n = nodes[i], p = nodes[n.p], wv = Math.max(0.6, k * n.r);    // n.r: the pipe-model radius, 1 at a tip
      const b = Math.min(bins - 1, Math.floor(Math.log2(wv * 2 + 1)));
      paths[b].moveTo(p.x * L, p.y * L); paths[b].lineTo(n.x * L, n.y * L);
    }
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    for (let b = 0; b < bins; b++) {
      const wv = (Math.pow(2, b + 0.5) - 1) / 2;
      ctx.strokeStyle = 'rgba(28,48,10,.4)'; ctx.lineWidth = wv + 1.4; ctx.stroke(paths[b]);                 // a thin dark rim either side
      ctx.strokeStyle = au > 0.5 ? `rgba(255,236,170,${0.75})` : `rgba(226,240,160,${0.78})`; ctx.lineWidth = wv; ctx.stroke(paths[b]);
    }
    ctx.restore();
    ctx.lineWidth = 1; ctx.strokeStyle = 'rgba(30,40,10,.5)'; ctx.stroke(path);
    ctx.restore();
    // a soft vignette
    const vg = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.35, w / 2, h / 2, Math.max(w, h) * 0.75); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,.5)');
    ctx.fillStyle = vg; ctx.fillRect(0, 0, w, h);
  }

  function resize() {
    W = stage.clientWidth || 1; H = stage.clientHeight || 1; dpr = Math.min(devicePixelRatio || 1, 2);
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    if (reduce) draw();
  }

  // the pointer moves the sun behind the leaf
  let px = 0.3, py = -0.2, lastMove = -1e9, held = false;
  const onMove = e => { const b = canvas.getBoundingClientRect(); px = ((e.clientX - b.left) / b.width) * 2 - 1; py = ((e.clientY - b.top) / b.height) * 2 - 1; lastMove = performance.now(); held = e.pointerType === 'mouse'; };
  const onLeave = () => { held = false; };
  canvas.addEventListener('pointermove', onMove); canvas.addEventListener('pointerleave', onLeave);

  newLeaf();
  if (reduce) { while (leaf.grow < 1) step(); for (let i = 0; i < 200; i++) step(); }
  const ro = new ResizeObserver(resize); ro.observe(stage); resize();
  let raf = 0, last = performance.now(), acc = 0;
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000); last = now; T += dt; phaseT += dt;
    const live = held || now - lastMove < 1800;
    const tx = live ? px : 0.3 * Math.sin(T * 0.15) + 0.1, ty = live ? py : -0.25 + 0.1 * Math.sin(T * 0.11);
    sunX += (tx - sunX) * Math.min(1, dt * 3); sunY += (ty - sunY) * Math.min(1, dt * 3);
    if (phase === 'grow') {
      acc += dt * 60 * PARAMS.speed;
      while (acc >= 1) { acc -= 1; step(); }
      if (leaf.grow >= 1 && sources.length === 0 && phaseT > 4) { phase = 'hold'; phaseT = 0; }
      if (leaf.grow >= 1 && phaseT > 30) { phase = 'hold'; phaseT = 0; }
    } else if (phase === 'hold' && phaseT > 3.5) { phase = 'autumn'; phaseT = 0; }
    else if (phase === 'autumn' && phaseT > 5) { phase = 'fall'; phaseT = 0; }
    else if (phase === 'fall' && phaseT > 1.6) newLeaf();
    draw();
    raf = requestAnimationFrame(frame);
  }
  if (!reduce) raf = requestAnimationFrame(frame);
  return () => { cancelAnimationFrame(raf); ro.disconnect(); canvas.removeEventListener('pointermove', onMove); canvas.removeEventListener('pointerleave', onLeave); canvas.remove(); };
}
