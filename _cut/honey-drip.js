// Honey drip: a strand hangs from a twirling dipper. Honey flows down into a bulb at its end, the bulb's weight
// stretches the strand (viscous creep that speeds up as it gets longer and heavier), the neck thins until it
// snaps, the strand springs back, and the drop plops into a slow, thick pool. The strand is a Verlet chain.
const PARAMS = { viscosity: 1, flow: 1 };

export default function (stage) {
  const canvas = document.createElement('canvas');
  canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block';
  stage.append(canvas);
  const ctx = canvas.getContext('2d');
  let W = 0, H = 0, u = 1;
  const COLS = 96, ph = new Float32Array(COLS), pv = new Float32Array(COLS), mound = new Float32Array(COLS);
  const resize = () => { const d = Math.min(devicePixelRatio, 2); W = stage.clientWidth; H = stage.clientHeight; canvas.width = W * d; canvas.height = H * d; ctx.setTransform(d, 0, 0, d, 0, 0); u = H / 215; };
  const ro = new ResizeObserver(resize); ro.observe(stage); resize();

  const N = 18;
  const pts = Array.from({ length: N }, () => ({ x: 0, y: 0, px: 0, py: 0 }));
  let L = 18, Lv = 0, M = 0.3, state = 'grow', stateT = 0, snapAt = 0.8;
  const drops = [];
  const tipOf = (t) => {                     // the dipper sways from a pivot above the frame; its tip carries the strand
    const a = Math.sin(t * 0.9) * 0.06 + Math.sin(t * 2.3) * 0.012, px = W * 0.5, py = -70 * u, r = 70 * u + 72 * u;
    return { a, x: px - Math.sin(a) * r, y: py + Math.cos(a) * r };
  };
  { const tp = tipOf(0); pts.forEach((p, i) => { p.x = p.px = tp.x; p.y = p.py = tp.y + i * L * u / (N - 1); }); }
  const poolY = x => { const i = Math.max(0, Math.min(COLS - 1, Math.round(x / W * (COLS - 1)))); return H - 34 * u - ph[i] - mound[i]; };

  function physics(dt, t) {
    const tp = tipOf(t), visc = PARAMS.viscosity;
    stateT += dt;
    if (state === 'grow') {
      M = Math.min(1.5, M + dt * 0.36 * PARAMS.flow / Math.sqrt(visc));      // honey runs down into the bulb
      Lv = Math.min(420, M * M * L / visc);                                     // the heavier and longer, the faster it creeps
      L += Lv * dt;
      const neck = Math.max(0.3, 5.5 * Math.pow(18 / L, 1.2));
      if (neck < 0.6 || L * u > (H - 34 * u - tp.y) * snapAt) snap();
    } else if (state === 'recoil') {
      Lv += (-(L - 16) * 140 - Lv * 7) * dt; L += Lv * dt;                      // elastic snap-back, a little overshoot
      if (stateT > 0.7) { state = 'grow'; stateT = 0; M = 0.22; }
    }
    // Verlet chain: pinned at the dipper, segment rest length = current strand length / segments
    const rest = L * u / (N - 1), g = 700 * u;
    for (let i = 1; i < N; i++) {
      const p = pts[i], vx = (p.x - p.px) * 0.985, vy = (p.y - p.py) * 0.985;
      p.px = p.x; p.py = p.y; p.x += vx; p.y += vy + g * dt * dt;
    }
    pts[0].x = pts[0].px = tp.x; pts[0].y = pts[0].py = tp.y;
    const heavy = state === 'grow' ? 0.12 : 1;
    for (let k = 0; k < 14; k++) for (let i = 0; i < N - 1; i++) {
      const a = pts[i], b = pts[i + 1], dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy) || 1e-6;
      const wa = i === 0 ? 0 : 1, wb = i + 1 === N - 1 ? heavy : 1, diff = (d - rest) / d / (wa + wb);
      a.x += dx * diff * wa; a.y += dy * diff * wa; b.x -= dx * diff * wb; b.y -= dy * diff * wb;
    }
    // falling drops and the beaded tail
    for (let i = drops.length - 1; i >= 0; i--) {
      const d = drops[i]; d.vy += g * 1.25 * dt; d.x += d.vx * dt; d.y += d.vy * dt; d.age += dt;
      if (d.y + d.r * 0.6 > poolY(d.x)) { splash(d.x, d.r, d.vy); drops.splice(i, 1); }
    }
    // the pool: a damped row of springs for ripples, plus a mound that spreads like thick honey
    for (let s = 0; s < 3; s++) {
      for (let i = 0; i < COLS; i++) { const l = ph[Math.max(0, i - 1)] + ph[Math.min(COLS - 1, i + 1)] - 2 * ph[i]; pv[i] += (l * 380 - ph[i] * 6 - pv[i] * 4.5 / visc) * dt / 3; }
      for (let i = 0; i < COLS; i++) ph[i] += pv[i] * dt / 3;
      let mean = 0; const m2 = Float32Array.from(mound);
      for (let i = 0; i < COLS; i++) { mound[i] += (m2[Math.max(0, i - 1)] + m2[Math.min(COLS - 1, i + 1)] - 2 * m2[i]) * 0.03 / Math.sqrt(visc); mean += mound[i]; }
      mean /= COLS; for (let i = 0; i < COLS; i++) mound[i] -= mean;
    }
  }
  function snap() {
    const b = pts[N - 1], prev = pts[N - 2], rb = bulbR();
    const vy = Math.max(Lv * u, (b.y - b.py) * 60);
    drops.push({ x: b.x, y: b.y, vx: (b.x - b.px) * 60, vy, r: rb, age: 0, main: true });
    for (let k = 1; k <= 5; k++) {                         // the neck breaks into a string of tiny beads
      const f = k / 6; drops.push({ x: prev.x + (b.x - prev.x) * f * 0.5, y: b.y - rb - k * 4.5 * u, vx: 0, vy: vy * (0.75 - k * 0.07), r: (0.5 + Math.random() * 0.8) * u, age: 0 });
    }
    state = 'recoil'; stateT = 0; Lv = -Lv * 0.2; L = Math.max(18, L * 0.32); snapAt = 0.7 + Math.random() * 0.18;
  }
  function splash(x, r, vy) {
    const i = Math.round(x / W * (COLS - 1)), big = r / u;
    for (let k = -3; k <= 3; k++) { const j = i + k; if (j >= 0 && j < COLS) { pv[j] -= vy * 0.02 * big * Math.exp(-k * k / 4) / 6; mound[j] += big * 0.7 * Math.exp(-k * k / 2.5) * u; } }
  }
  const bulbR = () => (3 + 9 * Math.cbrt(M)) * u;

  // ── drawing
  function dipper(t) {
    const tp = tipOf(t);
    ctx.save(); ctx.translate(W * 0.5, -70 * u); ctx.rotate(tp.a);
    // handle
    const hg = ctx.createLinearGradient(-5 * u, 0, 5 * u, 0); hg.addColorStop(0, '#7a4a22'); hg.addColorStop(0.4, '#c48a52'); hg.addColorStop(1, '#6a3d1a');
    ctx.fillStyle = hg; ctx.fillRect(-4.5 * u, 0, 9 * u, 90 * u);
    // grooved head: a barrel with ring grooves
    const y0 = 80 * u, y1 = 138 * u, R = 31 * u, steps = 60, prof = [];
    for (let s = 0; s <= steps; s++) {
      const f = s / steps, env = Math.pow(Math.sin(Math.PI * (0.08 + 0.84 * f)), 0.45), gr = Math.pow(0.5 + 0.5 * Math.cos(f * Math.PI * 2 * 6), 6);
      prof.push([R * env * (1 - 0.16 * gr), y0 + (y1 - y0) * f]);
    }
    ctx.beginPath(); prof.forEach(([r, y], i) => i ? ctx.lineTo(r, y) : ctx.moveTo(r, y)); for (let i = prof.length - 1; i >= 0; i--) ctx.lineTo(-prof[i][0], prof[i][1]); ctx.closePath();
    const wg = ctx.createLinearGradient(-R, 0, R, 0); wg.addColorStop(0, '#5e3415'); wg.addColorStop(0.32, '#d29a5e'); wg.addColorStop(0.55, '#b07640'); wg.addColorStop(1, '#4a280f');
    ctx.fillStyle = wg; ctx.fill();
    ctx.strokeStyle = 'rgba(60,30,10,.45)'; ctx.lineWidth = 1.2 * u;
    for (let k = 1; k < 6; k++) { const f = k / 6, y = y0 + (y1 - y0) * f, r = R * Math.pow(Math.sin(Math.PI * (0.08 + 0.84 * f)), 0.45) * 0.86; ctx.beginPath(); ctx.ellipse(0, y, r, 2.6 * u, 0, 0.1, Math.PI - 0.1); ctx.stroke(); }
    // honey coating the lower half and gathering at the tip, with sagging drips in the grooves
    ctx.beginPath();
    const start = Math.floor(steps * 0.56);
    for (let s = start; s <= steps; s++) { const [r, y] = prof[s]; const sag = Math.sin(s * 0.9 + t * 0.6) * 1.2 * u; ctx.lineTo(r + 2 * u, y + sag); }
    ctx.quadraticCurveTo(10 * u, y1 + 6 * u, 3.5 * u, y1 + 8 * u); ctx.lineTo(-3.5 * u, y1 + 8 * u); ctx.quadraticCurveTo(-10 * u, y1 + 6 * u, -prof[steps][0] - 2 * u, prof[steps][1]);
    for (let s = steps; s >= start; s--) { const [r, y] = prof[s]; const sag = Math.sin(s * 1.1 - t * 0.5) * 1.2 * u; ctx.lineTo(-r - 2 * u, y + sag); }
    ctx.quadraticCurveTo(0, prof[start][1] - 6 * u, prof[start][0] + 2 * u, prof[start][1]);
    const cg = ctx.createLinearGradient(-R, 0, R, 0); cg.addColorStop(0, 'rgba(150,72,6,.85)'); cg.addColorStop(0.35, 'rgba(250,180,50,.66)'); cg.addColorStop(0.7, 'rgba(214,128,18,.74)'); cg.addColorStop(1, 'rgba(120,56,4,.88)');
    ctx.fillStyle = cg; ctx.fill();
    ctx.strokeStyle = 'rgba(255,240,200,.75)'; ctx.lineWidth = 1.4 * u; ctx.beginPath();
    for (let s = start + 3; s < steps - 4; s++) { const [r, y] = prof[s]; ctx.lineTo(-r * 0.55, y); } ctx.stroke();
    ctx.restore();
  }
  function strand() {
    const neck = Math.max(0.3, 5.5 * Math.pow(18 / L, 1.2)) * u, tipW = 8 * u, n = pts.length;
    const left = [], right = [];
    for (let i = 0; i < n; i++) {
      const a = pts[Math.max(0, i - 1)], b = pts[Math.min(n - 1, i + 1)], dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy) || 1;
      const s = i / (n - 1), w = (neck + (tipW - neck) * Math.pow(1 - s, 2.4)) / 2;
      left.push([pts[i].x - dy / d * w, pts[i].y + dx / d * w, w]); right.push([pts[i].x + dy / d * w, pts[i].y - dx / d * w]);
    }
    ctx.beginPath(); left.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); for (let i = n - 1; i >= 0; i--) ctx.lineTo(right[i][0], right[i][1]); ctx.closePath();
    ctx.fillStyle = 'rgba(206,124,14,.93)'; ctx.fill();
    // a brighter core (light passing through the thick part) and a hairline highlight
    ctx.strokeStyle = 'rgba(255,205,90,.7)'; ctx.lineCap = 'round';
    for (let i = 0; i < n - 1; i++) { ctx.lineWidth = Math.max(0.3, left[i][2] * 0.7); ctx.beginPath(); ctx.moveTo(pts[i].x - left[i][2] * 0.15, pts[i].y); ctx.lineTo(pts[i + 1].x - left[i + 1][2] * 0.15, pts[i + 1].y); ctx.stroke(); }
    ctx.strokeStyle = 'rgba(255,250,235,.85)'; ctx.lineWidth = Math.max(0.5, 0.9 * u); ctx.beginPath();
    for (let i = 0; i < n * 0.8; i++) { const x = pts[i].x - left[i][2] * 0.55, y = pts[i].y; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); } ctx.stroke();
  }
  function drop(x, y, r, stretch) {
    const ry = r * (1 + stretch), rx = r / Math.sqrt(1 + stretch);
    const g = ctx.createRadialGradient(x - rx * 0.1, y + ry * 0.35, r * 0.1, x, y, Math.max(rx, ry));
    g.addColorStop(0, '#ffe08a'); g.addColorStop(0.45, '#eaa022'); g.addColorStop(0.85, '#b25f08'); g.addColorStop(1, '#7c3a03');
    ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,.85)'; ctx.beginPath(); ctx.ellipse(x - rx * 0.38, y - ry * 0.42, rx * 0.22, ry * 0.13, -0.5, 0, Math.PI * 2); ctx.fill();
  }
  function pool() {
    const top = H - 34 * u;
    ctx.beginPath(); ctx.moveTo(0, H);
    for (let i = 0; i < COLS; i++) ctx.lineTo(i / (COLS - 1) * W, top - ph[i] - mound[i]);
    ctx.lineTo(W, H); ctx.closePath();
    const g = ctx.createLinearGradient(0, top - 6 * u, 0, H); g.addColorStop(0, '#f2ae35'); g.addColorStop(0.18, '#d98516'); g.addColorStop(1, '#6e3104');
    ctx.fillStyle = g; ctx.fill();
    ctx.strokeStyle = 'rgba(255,236,180,.9)'; ctx.lineWidth = 1.3 * u; ctx.beginPath();
    for (let i = 0; i < COLS; i++) ctx.lineTo(i / (COLS - 1) * W, top - ph[i] - mound[i] + 1.2 * u); ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,.25)'; ctx.lineWidth = 3 * u; ctx.beginPath();
    for (let i = 0; i < COLS; i++) ctx.lineTo(i / (COLS - 1) * W, top - ph[i] - mound[i] + 5 * u); ctx.stroke();
  }

  let raf, last = performance.now();
  const t0 = last;
  function frame(now) {
    const dt = Math.min(0.033, (now - last) / 1000); last = now; const t = (now - t0) / 1000;
    physics(dt / 2, t); physics(dt / 2, t);
    const bg = ctx.createRadialGradient(W * 0.3, H * 0.15, 0, W * 0.5, H * 0.5, Math.max(W, H) * 0.8);
    bg.addColorStop(0, '#fbf5ea'); bg.addColorStop(1, '#e6d6bc'); ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
    strand();
    dipper(t);
    const b = pts[N - 1];
    if (state === 'grow') drop(b.x, b.y, bulbR(), Math.min(0.6, Lv / 220));
    else drop(b.x, b.y, (1.5 + 3 * Math.max(0, 1 - stateT * 2)) * u, 0);
    for (const d of drops) drop(d.x, d.y, d.r, d.main ? Math.min(0.5, d.vy / (900 * u)) : 0);
    pool();
    raf = requestAnimationFrame(frame);
  }
  raf = requestAnimationFrame(frame);
  return () => { cancelAnimationFrame(raf); ro.disconnect(); canvas.remove(); };
}
