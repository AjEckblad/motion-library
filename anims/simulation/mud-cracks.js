// Mud cracks: a flat of wet clay dries in the sun and tears into curled plates, then rain closes it up and it begins
// again. The wet mud is dark and glossy and holds the sky; it dries unevenly, edges and high spots first, and as the
// drying front passes, the shrinking surface tears. Clay shrinks the same in every direction, so it breaks into
// polygons of a fairly even size: the network is a Voronoi diagram of jittered seeds, its edges warped by noise so they
// wander like real cracks. Each edge tears open from its middle, where the stress is greatest, and runs out to the
// junctions; some edges open later and stay thinner. Older cracks keep widening as the clay shrinks, and every plate
// curls up at its rim: lit on the sunward side, shaded on the other, with a dark gap below. Then rain darkens the
// clay drop by drop, the plates soak and swell and the cracks close, and the next drying starts on a new pattern.
// Press and drag to wet a patch: its cracks close, and open again as it dries.
// Canvas 2D on a 2 px raster: a distance transform from every open crack pixel (carrying that crack's age and
// strength) tells each pixel how far it is from a gap, how wide that gap is, and which way it lies; the plate's curl
// is a height that rises toward the gap, shaded by a low sun from the upper left.
const PARAMS = { spacing: 1, speed: 1, curl: 1 };

export default function (stage) {
  const canvas = document.createElement('canvas');
  canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block;touch-action:none';
  stage.append(canvas);
  const ctx = canvas.getContext('2d');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const TAU = Math.PI * 2, INF = 1e9;

  let w = 1, h = 1, dpr = 1, rw = 0, rh = 0, MW = 0, MH = 0, RS = 2;          // RS: CSS px per raster cell
  let ground, groundData, moist, dryRate, wetC, wg, wetImg, sheen, sg, skyImg, shadeC, shadeX, shadeImg;
  let crackT, crackW, dist, dAge, dWt, T = 0, phase = 'dry', phaseT = 0, drops = [], seed = 3;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const hash = (x, y) => { const k = Math.sin(x * 127.1 + y * 311.7 + seed * 0.0007) * 43758.5453; return k - Math.floor(k); };
  const vn = (x, y) => { const xi = Math.floor(x), yi = Math.floor(y), fx = x - xi, fy = y - yi, u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy);
    return (hash(xi, yi) * (1 - u) + hash(xi + 1, yi) * u) * (1 - v) + (hash(xi, yi + 1) * (1 - u) + hash(xi + 1, yi + 1) * u) * v; };
  const DRY = 0.11;                                                   // moisture lost per second at dry rate 1

  function paintGround() {
    // dry clay at the raster's resolution: two octaves of noise, a little grain, faint bleached patches
    ground = document.createElement('canvas'); ground.width = rw; ground.height = rh;
    const g = ground.getContext('2d'), im = g.createImageData(rw, rh), d = im.data;
    for (let y = 0; y < rh; y++) for (let x = 0; x < rw; x++) {
      const X = x * RS / 2, Y = y * RS / 2, n = vn(X / 40, Y / 40) * 0.6 + vn(X / 9, Y / 9) * 0.3 + hash(x, y) * 0.1, b = vn(X / 120 + 7, Y / 120) * 0.5;
      const o = (y * rw + x) * 4, k = 0.82 + n * 0.3 + b * 0.12;
      d[o] = 192 * k; d[o + 1] = 160 * k; d[o + 2] = 118 * k; d[o + 3] = 255;
    }
    g.putImageData(im, 0, 0); groundData = d;
  }

  // the crack network for one drying: which raster pixels are crack, when each one tears open, and how strong it is
  function network() {
    const S = 78 * PARAMS.spacing * Math.min(1.15, Math.max(0.65, Math.sqrt(w * h / (1280 * 760)))) / RS;   // seed spacing in raster cells
    const cw = Math.ceil(rw / S) + 2, ch = Math.ceil(rh / S) + 2, seeds = new Float32Array(cw * ch * 2);
    for (let j = 0; j < ch; j++) for (let i = 0; i < cw; i++) { const k = (j * cw + i) * 2; seeds[k] = (i - 1 + 0.15 + rnd() * 0.7) * S; seeds[k + 1] = (j - 1 + 0.15 + rnd() * 0.7) * S; }
    crackT.fill(INF);
    const ox = rnd() * 100, oy = rnd() * 100;
    for (let y = 0; y < rh; y++) for (let x = 0; x < rw; x++) {
      // warp the point, so the cell walls wander
      const qx = x + (vn(x * RS / 44 + ox, y * RS / 44) - 0.5) * S * 0.34 + (vn(x * RS / 12, y * RS / 12 + oy) - 0.5) * 4.4 / RS;
      const qy = y + (vn(x * RS / 44, y * RS / 44 + oy) - 0.5) * S * 0.34 + (vn(x * RS / 12 + ox, y * RS / 12) - 0.5) * 4.4 / RS;
      const gi = Math.floor(qx / S) + 1, gj = Math.floor(qy / S) + 1;
      let d1 = INF, d2 = INF, a = -1, b = -1;
      for (let j = gj - 1; j <= gj + 1; j++) for (let i = gi - 1; i <= gi + 1; i++) {
        if (i < 0 || j < 0 || i >= cw || j >= ch) continue;
        const k = j * cw + i, dx = seeds[k * 2] - qx, dy = seeds[k * 2 + 1] - qy, dd = dx * dx + dy * dy;
        if (dd < d1) { d2 = d1; b = a; d1 = dd; a = k; } else if (dd < d2) { d2 = dd; b = k; }
      }
      // on a wall: the two nearest seeds are about equally near
      if (b < 0 || Math.sqrt(d2) - Math.sqrt(d1) > 4.6 / RS) continue;
      const lo = Math.min(a, b), hi = Math.max(a, b), eh = hash(lo, hi);
      const mx = (seeds[a * 2] + seeds[b * 2]) / 2, my = (seeds[a * 2 + 1] + seeds[b * 2 + 1]) / 2;
      const along = Math.hypot(qx - mx, qy - my) * RS;                // CSS px from the wall's middle
      const i = y * rw + x, mi = Math.min(MH - 1, (y * RS / 8) | 0) * MW + Math.min(MW - 1, (x * RS / 8) | 0);
      const tDry = Math.max(0, (moist[mi] - 0.5) / (DRY * PARAMS.speed * dryRate[mi]));
      const late = eh < 0.3 ? 2.5 + eh * 6 : 0;                         // a few walls tear late, and stay thin
      crackT[i] = tDry + (late + along / 55) / PARAMS.speed;
      crackW[i] = eh < 0.3 ? 0.45 + eh : 0.85 + (eh - 0.3) * 0.5;
    }
  }

  function reset() {
    drops = []; phase = 'dry'; phaseT = 0; T = 0;
    seed = 1 + Math.floor(Math.random() * 2147483646);
    for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++) {
      const e = Math.min(x, MW - 1 - x, y, MH - 1 - y) / Math.max(MW, MH);
      dryRate[y * MW + x] = 0.8 + vn(x / 14, y / 14) * 0.7 + vn(x / 5 + 3, y / 5) * 0.2 - e * 0.6;
      moist[y * MW + x] = 0.8;
    }
    network();
  }

  function resize() {
    w = stage.clientWidth || 1; h = stage.clientHeight || 1; dpr = Math.min(devicePixelRatio || 1, 2);
    canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
    RS = w * h > 520000 ? 3 : 2; rw = Math.ceil(w / RS); rh = Math.ceil(h / RS);
    MW = Math.ceil(w / 8); MH = Math.ceil(h / 8); moist = new Float32Array(MW * MH); dryRate = new Float32Array(MW * MH);
    crackT = new Float32Array(rw * rh); crackW = new Float32Array(rw * rh); dist = new Float32Array(rw * rh); dAge = new Float32Array(rw * rh); dWt = new Float32Array(rw * rh);
    wetC = document.createElement('canvas'); wetC.width = MW; wetC.height = MH; wg = wetC.getContext('2d'); wetImg = wg.createImageData(MW, MH);
    shadeC = document.createElement('canvas'); shadeC.width = rw; shadeC.height = rh; shadeX = shadeC.getContext('2d'); shadeImg = shadeX.createImageData(rw, rh);
    sheen = document.createElement('canvas'); sheen.width = Math.ceil(w / 4); sheen.height = Math.ceil(h / 4); sg = sheen.getContext('2d');
    skyImg = document.createElement('canvas'); skyImg.width = sheen.width; skyImg.height = sheen.height;
    { const k = skyImg.getContext('2d'), sw = skyImg.width, sh = skyImg.height, gr = k.createLinearGradient(0, 0, 0, sh);
      gr.addColorStop(0, '#c9d6e2'); gr.addColorStop(0.5, '#6e7d8c'); gr.addColorStop(1, '#2c333b'); k.fillStyle = gr; k.fillRect(0, 0, sw, sh);
      for (let i = 0; i < 7; i++) { const x = hash(i, 1) * sw, y = hash(i, 2) * sh * 0.5, r = (0.18 + hash(i, 3) * 0.2) * sw; const c = k.createRadialGradient(x, y, 0, x, y, r); c.addColorStop(0, 'rgba(255,255,255,.22)'); c.addColorStop(1, 'rgba(255,255,255,0)'); k.fillStyle = c; k.fillRect(0, 0, sw, sh); } }
    paintGround(); reset();
    if (reduce) { for (let i = 0; i < 600; i++) sim(1 / 30); distances(); shade(); draw(); }
  }

  function sim(dt) {
    T += dt; phaseT += dt;
    if (phase === 'dry') {
      for (let i = 0; i < MW * MH; i++) moist[i] = Math.max(0, moist[i] - dt * DRY * PARAMS.speed * dryRate[i]);
      if (phaseT > 26 / PARAMS.speed) { phase = 'hold'; phaseT = 0; }
    } else if (phase === 'hold') {
      if (phaseT > 4) { phase = 'rain'; phaseT = 0; }
    } else if (phase === 'rain') {
      // drops land and spread as dark spots, then the whole flat soaks and the cracks close
      for (let k = 0; k < Math.round(dt * 90); k++) drops.push({ x: rnd() * w, y: rnd() * h, t: T, r: 6 + rnd() * 10 });
      for (let i = 0; i < MW * MH; i++) moist[i] = Math.min(1, moist[i] + dt * (0.06 + phaseT * 0.05));
      if (phaseT > 6.5) reset();
    }
  }

  // the gaps and plates, from a distance transform of every open crack pixel (each carrying its age and strength)
  function distances() {
    const N = rw * rh;
    for (let i = 0; i < N; i++) {
      const t0 = crackT[i];
      if (t0 < T) { dist[i] = 0; dAge[i] = T - t0; dWt[i] = crackW[i]; } else { dist[i] = INF; dAge[i] = 0; dWt[i] = 0; }
    }
    const relax = (i, j, c) => { if (dist[j] + c < dist[i]) { dist[i] = dist[j] + c; dAge[i] = dAge[j]; dWt[i] = dWt[j]; } };
    for (let y = 0; y < rh; y++) for (let x = 0; x < rw; x++) { const i = y * rw + x; if (x > 0) relax(i, i - 1, 1); if (y > 0) { relax(i, i - rw, 1); if (x > 0) relax(i, i - rw - 1, 1.414); if (x < rw - 1) relax(i, i - rw + 1, 1.414); } }
    for (let y = rh - 1; y >= 0; y--) for (let x = rw - 1; x >= 0; x--) { const i = y * rw + x; if (x < rw - 1) relax(i, i + 1, 1); if (y < rh - 1) { relax(i, i + rw, 1); if (x < rw - 1) relax(i, i + rw + 1, 1.414); if (x > 0) relax(i, i + rw - 1, 1.414); } }
  }
  function shade() {
    const maxW = 6.2 * Math.min(1.2, Math.max(0.7, w / 1100)) * PARAMS.spacing;
    const out = shadeImg.data, Lx = -0.55, Ly = -0.62, Lz = 0.56, Rc = 5.5, curl = 1.5 * PARAMS.curl;
    for (let y = 0; y < rh; y++) for (let x = 0; x < rw; x++) {
      const i = y * rw + x, o = i * 4, d = dist[i] * RS;
      // the gap's half-width: it opens over a few seconds, keeps widening as the clay shrinks, and closes when wet
      const m = moist[Math.min(MH - 1, (y * RS / 8) | 0) * MW + Math.min(MW - 1, (x * RS / 8) | 0)];
      const age = dAge[i], wet = Math.max(0, Math.min(1, (m - 0.25) / 0.35));
      const hw = dist[i] >= INF ? 0 : maxW * 0.5 * dWt[i] * Math.min(1, age / 2.5) * (0.5 + 0.5 * Math.min(1, age / 18)) * (1 - wet);
      let r = groundData[o], g = groundData[o + 1], b = groundData[o + 2];
      const edge = Math.max(0, Math.min(1, (hw - d) / 2 + 0.5));             // a pixel-wide blend across the rim
      if (hw > 0.2 && edge < 1) {
        // the plate: its height rises toward the gap (it curls), so the normal tips away from it
        const e = d - hw, C = curl * Math.min(1, hw / 2.2), s = C / Rc * Math.exp(-e / Rc);
        const gx = x > 0 && x < rw - 1 ? (dist[i + 1] - dist[i - 1]) * 0.5 : 0, gy = y > 0 && y < rh - 1 ? (dist[i + rw] - dist[i - rw]) * 0.5 : 0;
        const nx = s * gx, ny = s * gy, lam = (nx * Lx + ny * Ly + Lz) / Math.sqrt(nx * nx + ny * ny + 1) / Lz;
        const sh = Math.max(0.42, Math.min(1.4, lam)) * (0.93 + 0.07 * Math.min(1, e / 14));
        r *= sh; g *= sh; b *= sh;
      }
      if (edge > 0 && hw > 0.2) {
        // the gap: dark, its floor a little lighter toward the middle
        const f = Math.min(1, d / Math.max(0.5, hw)), k = 0.2 + 0.12 * (1 - f);
        r += (230 * k - r) * edge; g += (160 * k - g) * edge; b += (100 * k - b) * edge;
      }
      out[o] = r; out[o + 1] = g; out[o + 2] = b; out[o + 3] = 255;
    }
    shadeX.putImageData(shadeImg, 0, 0);
  }

  function draw() {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(shadeC, 0, 0, w, h);
    // wetness: dark mud where it is still wet, fading as it dries (drawn small, scaled up smooth)
    const im = wetImg, d = im.data;
    for (let i = 0; i < MW * MH; i++) { const m = moist[i], a = m * m * (3 - 2 * m); d[i * 4] = 52; d[i * 4 + 1] = 38; d[i * 4 + 2] = 26; d[i * 4 + 3] = a * 240; }
    wg.putImageData(im, 0, 0);
    ctx.drawImage(wetC, 0, 0, w, h);
    // the sheen of wet mud: the sky reflected only where it is still wet
    sg.globalCompositeOperation = 'copy'; sg.drawImage(wetC, 0, 0, sheen.width, sheen.height);
    sg.globalCompositeOperation = 'source-in'; sg.drawImage(skyImg, 0, 0, sheen.width, sheen.height);
    ctx.save(); ctx.globalCompositeOperation = 'screen'; ctx.globalAlpha = 0.38; ctx.drawImage(sheen, 0, 0, w, h); ctx.restore();
    // rain: each drop a dark spot that spreads and soaks in, with a brief bright ring where it lands
    for (let i = drops.length - 1; i >= 0; i--) {
      const dr = drops[i], age = T - dr.t; if (age > 1.6) { drops.splice(i, 1); continue; }
      const r = dr.r * (0.4 + Math.min(1, age * 3) * 0.8);
      ctx.fillStyle = `rgba(50,36,24,${0.5 * (1 - age / 1.6)})`; ctx.beginPath(); ctx.arc(dr.x, dr.y, r, 0, TAU); ctx.fill();
      if (age < 0.25) { ctx.strokeStyle = `rgba(230,236,240,${0.6 * (1 - age / 0.25)})`; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(dr.x, dr.y, r * 1.3, 0, TAU); ctx.stroke(); }
    }
    // a warm low sun from the top left and a soft vignette
    const vg = ctx.createRadialGradient(w * 0.3, h * 0.2, 0, w * 0.5, h * 0.5, Math.max(w, h) * 0.8);
    vg.addColorStop(0, 'rgba(255,230,190,.10)'); vg.addColorStop(1, 'rgba(20,12,6,.45)'); ctx.fillStyle = vg; ctx.fillRect(0, 0, w, h);
  }

  // ── pointer: press and drag to wet a patch
  let down = false;
  const wetAt = e => { const b = canvas.getBoundingClientRect(), x = e.clientX - b.left, y = e.clientY - b.top, R = 60;
    for (let my = Math.max(0, ((y - R) / 8) | 0); my <= Math.min(MH - 1, ((y + R) / 8) | 0); my++) for (let mx = Math.max(0, ((x - R) / 8) | 0); mx <= Math.min(MW - 1, ((x + R) / 8) | 0); mx++) {
      const d = Math.hypot(mx * 8 + 4 - x, my * 8 + 4 - y); if (d < R) moist[my * MW + mx] = Math.max(moist[my * MW + mx], 1 - d / R * 0.6); }
    if (phase === 'hold') { phase = 'dry'; phaseT = 0; } };
  const onDown = e => { down = true; canvas.setPointerCapture?.(e.pointerId); wetAt(e); };
  const onMove = e => { if (down) wetAt(e); };
  const onUp = () => { down = false; };
  canvas.addEventListener('pointerdown', onDown); canvas.addEventListener('pointermove', onMove); canvas.addEventListener('pointerup', onUp); canvas.addEventListener('pointercancel', onUp);

  const ro = new ResizeObserver(resize); ro.observe(stage); resize();
  let raf = 0, last = performance.now(), n = 0;
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    sim(dt);
    if (n++ % 2 === 0) distances(); else shade();                   // the two halves of a refresh on alternate frames
    draw();
    raf = requestAnimationFrame(frame);
  }
  if (!reduce) raf = requestAnimationFrame(frame);
  return () => {
    cancelAnimationFrame(raf); ro.disconnect();
    canvas.removeEventListener('pointerdown', onDown); canvas.removeEventListener('pointermove', onMove); canvas.removeEventListener('pointerup', onUp); canvas.removeEventListener('pointercancel', onUp);
    canvas.remove();
  };
}
