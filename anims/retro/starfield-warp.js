// Warp starfield: stars sit in 3D and fly toward the camera; each is projected through a vanishing point (x/z, y/z).
// The streak runs from where the star was a moment ago to where it is now, so its length grows with speed: dots
// at cruise, long lines at warp. The pointer steers the vanishing point; the tail end follows a lagging copy of it,
// so steering bends the streaks.
const PARAMS = { count: 1400, speed: 1, steer: 1 };

export default function (stage) {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const canvas = document.createElement('canvas');
  canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block;touch-action:none';
  stage.append(canvas);
  const ctx = canvas.getContext('2d');
  let W = 0, H = 0, D = 1;
  const resize = () => { D = Math.min(devicePixelRatio, 2); W = stage.clientWidth || 1; H = stage.clientHeight || 1; canvas.width = W * D | 0; canvas.height = H * D | 0; };
  const ro = new ResizeObserver(resize); ro.observe(stage); resize();

  const n = Math.round(PARAMS.count);
  const X = new Float32Array(n), Y = new Float32Array(n), Z = new Float32Array(n), C = new Uint8Array(n);
  const spawn = (i, far) => {
    const a = Math.random() * Math.PI * 2, r = 0.04 + Math.sqrt(Math.random()) * 1.6;
    X[i] = Math.cos(a) * r; Y[i] = Math.sin(a) * r; Z[i] = far ? 1 : 0.02 + Math.random() * 0.98;
    C[i] = Math.random() < 0.7 ? 0 : Math.random() < 0.6 ? 1 : 2;
  };
  for (let i = 0; i < n; i++) spawn(i, false);
  const HUES = [[226, 236, 255], [150, 200, 255], [255, 214, 170]];
  const LEVELS = 6;
  const style = []; for (let h = 0; h < 3; h++) for (let l = 0; l < LEVELS; l++) style.push(`rgba(${HUES[h]},${((l + 1) / LEVELS).toFixed(3)})`);
  const paths = Array.from({ length: 3 * LEVELS }, () => []);

  // vanishing point (relative to centre, in px); pointer or an idle ghost sets the target
  const vp = { x: 0, y: 0 }, lag = { x: 0, y: 0 }, tgt = { x: 0, y: 0 };
  let pointer = false, lastMove = -1e9;
  const onMove = e => { const r = canvas.getBoundingClientRect(); tgt.x = (e.clientX - r.left - W / 2) * 0.9 * PARAMS.steer; tgt.y = (e.clientY - r.top - H / 2) * 0.9 * PARAMS.steer; pointer = true; lastMove = performance.now(); };
  const onLeave = () => { pointer = false; };
  canvas.addEventListener('pointermove', onMove); canvas.addEventListener('pointerdown', onMove); canvas.addEventListener('pointerleave', onLeave);

  let raf, last = performance.now(), t = 0;
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000); last = now; t += dt;
    if (!pointer || now - lastMove > 4000) {
      if (reduce) { tgt.x = 0; tgt.y = 0; }
      else { tgt.x = Math.sin(t * 0.31) * W * 0.16 * PARAMS.steer; tgt.y = Math.sin(t * 0.47 + 1) * H * 0.12 * PARAMS.steer; }
    }
    const kv = 1 - Math.exp(-dt * 3), kl = 1 - Math.exp(-dt * 1.4);
    vp.x += (tgt.x - vp.x) * kv; vp.y += (tgt.y - vp.y) * kv;
    lag.x += (vp.x - lag.x) * kl; lag.y += (vp.y - lag.y) * kl;
    // cruise → jump to warp → drop back, on a 10 s cycle
    const ph = (t % 10) / 10, ss = (a, b, x) => { const k = Math.min(1, Math.max(0, (x - a) / (b - a))); return k * k * (3 - 2 * k); };
    const warp = reduce ? 0 : ss(0.3, 0.52, ph) * (1 - ss(0.78, 0.97, ph));
    const v = (reduce ? 0.004 : 0.07 + 1.5 * warp * warp) * PARAMS.speed;
    const F = Math.max(W, H) * 0.42, cx = W / 2, cy = H / 2, trail = 0.004 + v * 0.07;
    // the tail sees a slightly lagging vanishing point: steering bends the streaks (capped so a fast flick stays tidy)
    let bx = (lag.x - vp.x) * 0.3, by = (lag.y - vp.y) * 0.3; const bl = Math.hypot(bx, by); if (bl > 40) { bx *= 40 / bl; by *= 40 / bl; }

    ctx.setTransform(D, 0, 0, D, 0, 0);
    ctx.fillStyle = '#02030a'; ctx.fillRect(0, 0, W, H);
    // a faint bloom at the vanishing point that swells at warp
    const gx = cx + vp.x, gy = cy + vp.y, gr = Math.max(W, H) * (0.25 + 0.35 * warp);
    const g = ctx.createRadialGradient(gx, gy, 0, gx, gy, gr);
    g.addColorStop(0, `rgba(120,160,255,${0.05 + 0.18 * warp})`); g.addColorStop(1, 'rgba(120,160,255,0)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);

    for (const p of paths) p.length = 0;
    for (let i = 0; i < n; i++) {
      Z[i] -= v * dt;
      const z = Z[i];
      if (z <= 0.015) { spawn(i, true); continue; }
      const hx = cx + vp.x + X[i] / z * F, hy = cy + vp.y + Y[i] / z * F;
      if (hx < -50 || hx > W + 50 || hy < -50 || hy > H + 50) { spawn(i, true); continue; }
      const zt = Math.min(1.2, z + trail), near = 1 - z;
      const tx = cx + vp.x + bx * near + X[i] / zt * F, ty = cy + vp.y + by * near + Y[i] / zt * F;
      const b = Math.min(1, near * near * 1.3 + 0.3) * Math.min(1, near * 8);   // fade in from the far plane
      const l = Math.max(0, Math.min(LEVELS - 1, b * LEVELS | 0));
      paths[C[i] * LEVELS + l].push(tx, ty, hx, hy, 0.5 + near * near * 2.6);
    }
    ctx.lineCap = 'round'; ctx.globalCompositeOperation = 'lighter';
    for (let s = 0; s < paths.length; s++) {
      const p = paths[s]; if (!p.length) continue;
      ctx.strokeStyle = style[s];
      // three width classes per bucket keep the batching cheap
      for (let w = 0; w < 3; w++) {
        ctx.lineWidth = [0.8, 1.6, 2.8][w]; ctx.beginPath();
        for (let k = 0; k < p.length; k += 5) {
          const lw = p[k + 4], cls = lw < 1.2 ? 0 : lw < 2.2 ? 1 : 2;
          if (cls !== w) continue;
          ctx.moveTo(p[k], p[k + 1]); ctx.lineTo(p[k + 2] + 0.01, p[k + 3]);
        }
        ctx.stroke();
      }
    }
    ctx.globalCompositeOperation = 'source-over';
    raf = requestAnimationFrame(frame);
  }
  raf = requestAnimationFrame(frame);
  return () => { cancelAnimationFrame(raf); ro.disconnect(); canvas.removeEventListener('pointermove', onMove); canvas.removeEventListener('pointerdown', onMove); canvas.removeEventListener('pointerleave', onLeave); canvas.remove(); };
}
