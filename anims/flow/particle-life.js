// Particle life: six species of particles and one table that says how much each species likes or dislikes each
// other one. Every pair pushes apart when very close, then attracts or repels by its table entry, fading out at
// a fixed range. The rule is not symmetric (red may chase green while green flees red), and out of that come things
// that look alive: cells with membranes, worms, spinners, swarms that hunt each other. Every half minute the table
// slowly drifts to a new random one, and the creatures melt and different ones form. Drag to stir.
const PARAMS = { particles: 2400, species: 6, range: 0.105 };

export default function (stage) {
  const canvas = document.createElement('canvas');
  canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block;background:#05060a;touch-action:none';
  stage.append(canvas);
  const ctx = canvas.getContext('2d');
  let W = 1, H = 1, A = 1;
  const resize = () => { const d = Math.min(devicePixelRatio, 2); W = stage.clientWidth || 1; H = stage.clientHeight || 1; A = W / H; canvas.width = Math.max(1, (W * d) | 0); canvas.height = Math.max(1, (H * d) | 0); ctx.setTransform(d, 0, 0, d, 0, 0); ctx.fillStyle = '#05060a'; ctx.fillRect(0, 0, W, H); };
  const ro = new ResizeObserver(resize); ro.observe(stage); resize();

  const N = Math.max(300, Math.round(PARAMS.particles)), K = Math.max(2, Math.min(8, Math.round(PARAMS.species)));
  const HUES = ['#ff4d6d', '#ffd166', '#06d6a0', '#4cc9f0', '#b388ff', '#ff9e5e', '#f2f2f2', '#7bdff2'];
  const sprites = HUES.map(c => { const s = document.createElement('canvas'); s.width = s.height = 24; const g = s.getContext('2d'), r = g.createRadialGradient(12, 12, 0, 12, 12, 12); r.addColorStop(0, '#fff'); r.addColorStop(0.22, c); r.addColorStop(0.6, c + '44'); r.addColorStop(1, c + '00'); g.fillStyle = r; g.fillRect(0, 0, 24, 24); return s; });
  // positions live in a wrapping box A wide and 1 tall
  const x = new Float32Array(N), y = new Float32Array(N), vx = new Float32Array(N), vy = new Float32Array(N), sp = new Uint8Array(N);
  for (let i = 0; i < N; i++) { x[i] = Math.random() * A; y[i] = Math.random(); sp[i] = i % K; }
  const rand = () => { const m = new Float32Array(K * K); for (let i = 0; i < K * K; i++) m[i] = Math.random() * 2 - 1; return m; };
  let from = rand(), to = rand(), M = new Float32Array(K * K), epoch = 0;
  const ptr = { x: 0, y: 0, on: false };
  const at = e => { const r = canvas.getBoundingClientRect(); ptr.x = ((e.clientX - r.left) / r.width) * A; ptr.y = (e.clientY - r.top) / r.height; };
  const down = e => { ptr.on = true; at(e); canvas.setPointerCapture(e.pointerId); };
  const move = e => { if (ptr.on) at(e); };
  const up = () => { ptr.on = false; };
  canvas.addEventListener('pointerdown', down); canvas.addEventListener('pointermove', move); canvas.addEventListener('pointerup', up); canvas.addEventListener('pointercancel', up);

  const BETA = 0.3, cell = new Int32Array(N), heads = new Map();
  function step(dt) {
    const R = PARAMS.range, gx = Math.max(1, Math.floor(A / R)), gy = Math.max(1, Math.floor(1 / R));
    heads.clear();
    for (let i = 0; i < N; i++) { const k = (Math.floor((x[i] / A) * gx) % gx) * gy + (Math.floor(y[i] * gy) % gy); cell[i] = heads.get(k) ?? -1; heads.set(k, i); }   // linked lists per cell
    const fr = Math.pow(0.5, dt / 0.04), F = 9 * R;
    for (let i = 0; i < N; i++) {
      let ax = 0, ay = 0;
      const cx = Math.floor((x[i] / A) * gx), cy = Math.floor(y[i] * gy), row = sp[i] * K;
      for (let ox = -1; ox <= 1; ox++) for (let oy = -1; oy <= 1; oy++) {
        let j = heads.get((((cx + ox) % gx + gx) % gx) * gy + (((cy + oy) % gy + gy) % gy)) ?? -1;
        while (j >= 0) {
          if (j !== i) {
            let dx = x[j] - x[i], dy = y[j] - y[i];
            if (dx > A / 2) dx -= A; else if (dx < -A / 2) dx += A; if (dy > 0.5) dy -= 1; else if (dy < -0.5) dy += 1;   // the box wraps
            const d = Math.sqrt(dx * dx + dy * dy) / R;
            if (d > 0 && d < 1) {
              const f = d < BETA ? d / BETA - 1 : M[row + sp[j]] * (1 - Math.abs(2 * d - 1 - BETA) / (1 - BETA));
              ax += (dx / (d * R)) * f; ay += (dy / (d * R)) * f;
            }
          }
          j = cell[j];
        }
      }
      if (ptr.on) { const dx = x[i] - ptr.x, dy = y[i] - ptr.y, d2 = dx * dx + dy * dy; if (d2 < 0.02) { ax += (dx / Math.sqrt(d2 + 1e-4)) * 8; ay += (dy / Math.sqrt(d2 + 1e-4)) * 8; } }
      vx[i] = vx[i] * fr + ax * F * dt; vy[i] = vy[i] * fr + ay * F * dt;
    }
    for (let i = 0; i < N; i++) { x[i] = (x[i] + vx[i] * dt + A) % A; y[i] = (y[i] + vy[i] * dt + 1) % 1; }
  }

  let raf, last = performance.now(), time = 0;
  function frame(now) {
    const dt = Math.min(0.033, (now - last) / 1000); last = now; time += dt;
    // the table drifts to a new random one every 30 s (over 6 s)
    if (time - epoch * 30 > 30) { epoch++; from = M.slice(); to = rand(); }
    const k = Math.min(1, (time - epoch * 30) / 6), e = k * k * (3 - 2 * k);
    for (let i = 0; i < K * K; i++) M[i] = from[i] + (to[i] - from[i]) * e;
    step(dt);
    // short trails: fade the last frame instead of clearing it
    ctx.globalCompositeOperation = 'source-over'; ctx.fillStyle = 'rgba(5,6,10,.22)'; ctx.fillRect(0, 0, W, H);
    ctx.globalCompositeOperation = 'lighter';
    const s = Math.max(6, H / 66);
    for (let i = 0; i < N; i++) ctx.drawImage(sprites[sp[i]], (x[i] / A) * W - s / 2, y[i] * H - s / 2, s, s);
    ctx.globalCompositeOperation = 'source-over';
    raf = requestAnimationFrame(frame);
  }
  // let the first creatures form before anyone looks
  for (let i = 0; i < K * K; i++) M[i] = from[i];
  for (let i = 0; i < 90; i++) step(1 / 60);
  raf = requestAnimationFrame(frame);
  return () => {
    cancelAnimationFrame(raf); ro.disconnect();
    canvas.removeEventListener('pointerdown', down); canvas.removeEventListener('pointermove', move); canvas.removeEventListener('pointerup', up); canvas.removeEventListener('pointercancel', up);
    canvas.remove();
  };
}
