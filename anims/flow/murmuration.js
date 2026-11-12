// Starling murmuration: a 3D flock where each bird only watches its nearest seven neighbours (as real starlings do),
// matching their heading, keeping close, and not touching. A soft pull keeps the flock in the sky. Every few seconds a
// falcon dives through: birds near it flee, and the panic passes from bird to bird, which is what makes the dark waves
// ripple across the cloud. Birds are projected with perspective, so dense, edge-on parts of the flock read darker.
const PARAMS = { birds: 1600, falcon: 1 };

export default function (stage) {
  const canvas = document.createElement('canvas');
  canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block';
  stage.append(canvas);
  const ctx = canvas.getContext('2d');
  let W = 0, H = 0;
  const resize = () => { const d = Math.min(devicePixelRatio, 2); W = stage.clientWidth || 1; H = stage.clientHeight || 1; canvas.width = W * d; canvas.height = H * d; ctx.setTransform(d, 0, 0, d, 0, 0); };
  const ro = new ResizeObserver(resize); ro.observe(stage); resize();

  const N = Math.round(PARAMS.birds), P = new Float32Array(N * 3), V = new Float32Array(N * 3), fear = new Float32Array(N);
  for (let i = 0; i < N; i++) {
    const a = Math.random() * 6.28, r = Math.cbrt(Math.random()) * 1.2;
    P[i * 3] = Math.cos(a) * r * 1.6; P[i * 3 + 1] = (Math.random() - 0.5) * 0.8; P[i * 3 + 2] = Math.sin(a) * r;
    V[i * 3] = 0.6 + Math.random() * 0.1; V[i * 3 + 1] = 0; V[i * 3 + 2] = (Math.random() - 0.5) * 0.2;
  }
  // a hash grid so each bird only looks at birds in its cell and the 26 around it
  const CELL = 0.22, grid = new Map(), key = (x, y, z) => ((x + 512) << 20) | ((y + 512) << 10) | (z + 512);
  const falcon = { x: 9, y: 0, z: 0, vx: 0, vy: 0, vz: 0, on: false, next: 2 };
  const near = new Int32Array(7), nd = new Float32Array(7);
  let raf, last = performance.now();
  function step(dt, t) {
    grid.clear();
    for (let i = 0; i < N; i++) {
      const k = key(Math.floor(P[i * 3] / CELL), Math.floor(P[i * 3 + 1] / CELL), Math.floor(P[i * 3 + 2] / CELL));
      let b = grid.get(k); if (!b) grid.set(k, b = []); b.push(i);
    }
    // the falcon: dives through the flock's middle, then leaves and waits
    if (PARAMS.falcon > 0 && !falcon.on && t > falcon.next) {
      const a = Math.random() * 6.28; Object.assign(falcon, { on: true, x: Math.cos(a) * 3.5, y: 1.6, z: Math.sin(a) * 3.5 });
      const l = Math.hypot(falcon.x, falcon.y, falcon.z); falcon.vx = -falcon.x / l * 2.6; falcon.vy = -falcon.y / l * 2.6; falcon.vz = -falcon.z / l * 2.6;
    }
    if (falcon.on) {
      falcon.x += falcon.vx * dt; falcon.y += falcon.vy * dt; falcon.z += falcon.vz * dt;
      if (Math.hypot(falcon.x, falcon.y, falcon.z) > 4.5 && falcon.x * falcon.vx + falcon.z * falcon.vz > 0) { falcon.on = false; falcon.next = t + 4 + Math.random() * 4 / Math.max(0.2, PARAMS.falcon); }
    }
    for (let i = 0; i < N; i++) {
      const x = P[i * 3], y = P[i * 3 + 1], z = P[i * 3 + 2], cx = Math.floor(x / CELL), cy = Math.floor(y / CELL), cz = Math.floor(z / CELL);
      let n = 0; nd.fill(1e9);
      for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) for (let c = -1; c <= 1; c++) {
        const bucket = grid.get(key(cx + a, cy + b, cz + c)); if (!bucket) continue;
        for (const j of bucket) {
          if (j === i) continue;
          const d = (P[j * 3] - x) ** 2 + (P[j * 3 + 1] - y) ** 2 + (P[j * 3 + 2] - z) ** 2;
          if (d >= nd[6]) continue;
          let s = 6; while (s > 0 && nd[s - 1] > d) { nd[s] = nd[s - 1]; near[s] = near[s - 1]; s--; }   // keep the seven nearest, sorted
          nd[s] = d; near[s] = j; if (n < 7) n++;
        }
      }
      let ax = 0, ay = 0, az = 0, mx = 0, my = 0, mz = 0, px = 0, py = 0, pz = 0, f = 0;
      for (let k = 0; k < n; k++) {
        const j = near[k], dx = P[j * 3] - x, dy = P[j * 3 + 1] - y, dz = P[j * 3 + 2] - z, d = Math.sqrt(nd[k]) + 1e-4;
        mx += V[j * 3]; my += V[j * 3 + 1]; mz += V[j * 3 + 2]; px += dx; py += dy; pz += dz;
        if (d < 0.05) { ax -= dx / d * (0.05 - d) * 40; ay -= dy / d * (0.05 - d) * 40; az -= dz / d * (0.05 - d) * 40; }
        f = Math.max(f, fear[j] * 0.93);                                  // panic spreads to the nearest neighbours
      }
      if (n) { ax += (mx / n - V[i * 3]) * 1.8 + px / n * 2; ay += (my / n - V[i * 3 + 1]) * 1.8 + py / n * 2; az += (mz / n - V[i * 3 + 2]) * 1.8 + pz / n * 2; }
      // stay in this patch of sky: a soft roost point that wanders, and a firm wall past a radius, so the flock wheels
      // round instead of flying off
      const ox = x - Math.sin(t * 0.13) * 0.5, oy = y - Math.sin(t * 0.21) * 0.25, oz = z, r = Math.hypot(ox, oy * 1.6, oz);
      ax -= ox * 0.35; ay -= oy * 0.9; az -= oz * 0.45;
      if (r > 1.1) { const k = (r - 1.1) * 4 / r; ax -= ox * k; ay -= oy * k; az -= oz * k; }
      if (falcon.on) {
        const dx = x - falcon.x, dy = y - falcon.y, dz = z - falcon.z, d = Math.hypot(dx, dy, dz);
        if (d < 0.7) { const k = (0.7 - d) * 12 / (d + 0.05); ax += dx * k; ay += dy * k; az += dz * k; f = 1; }
      }
      fear[i] += (f - fear[i]) * Math.min(1, dt * 8);
      if (fear[i] > 0.05) { const l = Math.hypot(mx, my, mz) || 1; ax += (V[i * 3 + 2] / l) * fear[i] * 3; az -= (V[i * 3] / l) * fear[i] * 3; }   // frightened birds bank sideways
      let vx = V[i * 3] + ax * dt, vy = V[i * 3 + 1] + ay * dt, vz = V[i * 3 + 2] + az * dt;
      const sp = Math.hypot(vx, vy, vz), target = 0.75 + fear[i] * 0.6, k = (sp + (target - sp) * Math.min(1, dt * 2)) / (sp || 1);
      V[i * 3] = vx * k; V[i * 3 + 1] = vy * k; V[i * 3 + 2] = vz * k;
    }
    for (let i = 0; i < N * 3; i++) P[i] += V[i] * dt;
  }
  function frame(now) {
    const dt = Math.min(0.033, (now - last) / 1000); last = now;
    const t = now / 1000;
    step(dt, t);
    const sky = ctx.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, '#5b6f9a'); sky.addColorStop(0.55, '#d79a8a'); sky.addColorStop(0.85, '#f2c08a'); sky.addColorStop(1, '#f6d7a2');
    ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#2b2530'; ctx.beginPath(); ctx.moveTo(0, H);
    for (let x = 0; x <= W; x += 6) ctx.lineTo(x, H * 0.93 - Math.abs(Math.sin(x * 0.05) * Math.sin(x * 0.013)) * H * 0.05);
    ctx.lineTo(W, H); ctx.fill();
    // camera slowly circles the flock
    const ang = t * 0.05, ca = Math.cos(ang), sa = Math.sin(ang), F = Math.min(W, H) * 1.05, cx = W / 2, cy = H * 0.44, dist = 3.6;
    ctx.fillStyle = 'rgba(25,20,30,.85)';
    const draw = (x, y, z, s) => {
      const rx = x * ca - z * sa, rz = x * sa + z * ca + dist;
      if (rz < 0.3) return;
      const k = F / rz, sz = Math.max(0.6, s * k * 0.012);
      ctx.fillRect(cx + rx * k - sz, cy - y * k - sz * 0.5, sz * 2, sz);   // a bird far away is just a dash
    };
    for (let i = 0; i < N; i++) draw(P[i * 3], P[i * 3 + 1], P[i * 3 + 2], 1);
    if (falcon.on) { ctx.fillStyle = 'rgba(20,15,20,1)'; draw(falcon.x, falcon.y, falcon.z, 2.6); }
    raf = requestAnimationFrame(frame);
  }
  raf = requestAnimationFrame(frame);
  return () => { cancelAnimationFrame(raf); ro.disconnect(); canvas.remove(); };
}
