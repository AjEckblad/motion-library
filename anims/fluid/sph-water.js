// SPH water: smoothed-particle hydrodynamics. Each particle's density comes from its neighbours; pressure pushes
// crowded particles apart and viscosity evens out their velocities. Gravity swings to slosh the tank.
// Rendered by splatting soft blobs and thresholding them into one liquid surface.
const PARAMS = { particles: 600, slosh: 1 };

export default function (stage) {
  const canvas = document.createElement('canvas');
  canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block';
  stage.append(canvas);
  const ctx = canvas.getContext('2d');
  const buf = document.createElement('canvas'), bctx = buf.getContext('2d', { willReadFrequently: true });
  let W = 0, H = 0, bw = 0, bh = 0;
  const resize = () => { const d = Math.min(devicePixelRatio, 2); W = stage.clientWidth; H = stage.clientHeight; canvas.width = W * d; canvas.height = H * d; ctx.setTransform(d, 0, 0, d, 0, 0); bw = Math.ceil(W / 2); bh = Math.ceil(H / 2); buf.width = bw; buf.height = bh; };
  const ro = new ResizeObserver(resize); ro.observe(stage); resize();

  const N = Math.round(PARAMS.particles), h = 16, h2 = h * h, mass = 1, k = 8000, mu = 2.2;
  let rho0 = 0;   // measured from the starting packing, so the water keeps its volume
  const POLY6 = 4 / (Math.PI * h2 ** 4), SPIKY = -10 / (Math.PI * h ** 5), VISC = 40 / (Math.PI * h ** 5);
  const P = Array.from({ length: N }, (_, i) => ({ x: W * 0.15 + (i % 30) * h * 0.55, y: H * 0.2 + Math.floor(i / 30) * h * 0.55, vx: 0, vy: 0, fx: 0, fy: 0, rho: 0, p: 0 }));
  const grid = new Map(), key = (x, y) => (x << 16) | (y & 0xffff);
  let raf, last = performance.now();
  function step(dt, gx, gy) {
    grid.clear();
    for (const a of P) { const kk = key(a.x / h | 0, a.y / h | 0); let c = grid.get(kk); if (!c) grid.set(kk, c = []); c.push(a); }
    const near = a => { const out = [], cx = a.x / h | 0, cy = a.y / h | 0; for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) { const c = grid.get(key(cx + i, cy + j)); if (c) out.push(...c); } return out; };
    const lists = P.map(near);
    P.forEach((a, n) => { a.rho = 0; for (const b of lists[n]) { const r2 = (a.x - b.x) ** 2 + (a.y - b.y) ** 2; if (r2 < h2) a.rho += mass * POLY6 * (h2 - r2) ** 3; } });
    if (!rho0) rho0 = P.reduce((sum, a) => sum + a.rho, 0) / P.length;
    for (const a of P) a.p = k * (a.rho - rho0) / rho0;
    P.forEach((a, n) => {
      let fx = 0, fy = 0;
      for (const b of lists[n]) {
        if (a === b) continue;
        const dx = b.x - a.x, dy = b.y - a.y, r = Math.hypot(dx, dy);
        if (r >= h || r === 0) continue;
        const press = -mass * (a.p + b.p) / (2 * b.rho) * SPIKY * (h - r) ** 3 / r;   // pressure pushes apart
        fx -= press * dx; fy -= press * dy;
        const vis = mu * mass / b.rho * VISC * (h - r);                               // viscosity evens velocities
        fx += vis * (b.vx - a.vx); fy += vis * (b.vy - a.vy);
      }
      a.fx = fx + gx * a.rho; a.fy = fy + gy * a.rho;
    });
    for (const a of P) {
      a.vx += dt * a.fx / a.rho; a.vy += dt * a.fy / a.rho;
      const sp = Math.hypot(a.vx, a.vy); if (sp > 700) { a.vx *= 700 / sp; a.vy *= 700 / sp; }   // keep the stiff solver stable
      a.x += dt * a.vx; a.y += dt * a.vy;
      const m = 4, damp = -0.4;
      if (a.x < m) { a.x = m; a.vx *= damp; } if (a.x > W - m) { a.x = W - m; a.vx *= damp; }
      if (a.y < m) { a.y = m; a.vy *= damp; } if (a.y > H - m) { a.y = H - m; a.vy *= damp; }
    }
  }
  function frame(now) {
    const real = Math.min(0.033, (now - last) / 1000); last = now; const t = now / 1000;
    const ang = Math.sin(t * 0.7) * 0.6 * PARAMS.slosh, g = 1600;
    for (let s = 0; s < 8; s++) step(Math.min(real, 0.02) / 8, Math.sin(ang) * g, Math.cos(ang) * g);
    // splat soft blobs at half resolution, then threshold alpha into a liquid surface
    bctx.clearRect(0, 0, bw, bh);
    for (const a of P) { const x = a.x / 2, y = a.y / 2, r = h * 0.8; const g2 = bctx.createRadialGradient(x, y, 0, x, y, r); g2.addColorStop(0, 'rgba(0,0,0,1)'); g2.addColorStop(1, 'rgba(0,0,0,0)'); bctx.fillStyle = g2; bctx.fillRect(x - r, y - r, r * 2, r * 2); }
    const img = bctx.getImageData(0, 0, bw, bh), d = img.data;
    for (let y = 0; y < bh; y++) for (let x = 0; x < bw; x++) {
      const i = (y * bw + x) * 4, a = d[i + 3];
      if (a > 150) { const edge = a < 200 ? 1 : 0, depth = y / bh; d[i] = edge ? 175 : 40 - 20 * depth; d[i + 1] = edge ? 240 : 150 - 70 * depth; d[i + 2] = edge ? 255 : 255 - 70 * depth; d[i + 3] = 255; }
      else { d[i] = 17; d[i + 1] = 20; d[i + 2] = 28; d[i + 3] = 255; }   // the dark, empty tank
    }
    bctx.putImageData(img, 0, 0);
    ctx.fillStyle = '#0b0b0f'; ctx.fillRect(0, 0, W, H);            // clear behind the tilted tank so its corners never smear
    ctx.save(); ctx.translate(W / 2, H / 2); ctx.rotate(-ang * 0.35); ctx.scale(0.86, 0.86); ctx.translate(-W / 2, -H / 2);
    ctx.imageSmoothingEnabled = true; ctx.drawImage(buf, 0, 0, W, H);
    ctx.strokeStyle = '#46546a'; ctx.lineWidth = 3; ctx.strokeRect(1.5, 1.5, W - 3, H - 3);
    ctx.restore();
    raf = requestAnimationFrame(frame);
  }
  raf = requestAnimationFrame(frame);
  return () => { cancelAnimationFrame(raf); ro.disconnect(); canvas.remove(); };
}
