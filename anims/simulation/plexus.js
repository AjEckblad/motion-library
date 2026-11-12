// Plexus: drifting points joined by lines whose opacity falls with distance, so the mesh knits and unknits as they
// move. Each point also has a depth: far points are smaller, dimmer and slower (parallax), and only points at a
// similar depth link up, which layers the web. Neighbours are found through a uniform grid, so it stays linear in
// the number of points. The cursor (or a wandering ghost) pulls nearby points in and links to them in a warm accent.
const PARAMS = { density: 1, link: 120, pull: 1 };

export default function (stage) {
  const canvas = document.createElement('canvas');
  canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block';
  stage.append(canvas);
  const ctx = canvas.getContext('2d');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let W = 0, H = 0, D = 1, pts = [];
  const make = () => {
    const n = Math.round(W * H / 2400 * PARAMS.density);
    pts = Array.from({ length: n }, () => {
      const z = Math.random(), a = Math.random() * 6.2832, s = 6 + 14 * z;
      return { x: Math.random() * W, y: Math.random() * H, vx: Math.cos(a) * s, vy: Math.sin(a) * s, z, ox: 0, oy: 0 };
    });
  };
  const resize = () => { D = Math.min(devicePixelRatio, 2); const w = stage.clientWidth || 1, h = stage.clientHeight || 1; const remake = Math.abs(w * h - W * H) > W * H * 0.2; W = w; H = h; canvas.width = Math.round(W * D); canvas.height = Math.round(H * D); if (remake || !pts.length) make(); };
  const ro = new ResizeObserver(resize); ro.observe(stage); resize();

  let mx = -1e4, my = -1e4, lastPointer = -1e9;
  const pm = e => { const r = canvas.getBoundingClientRect(); mx = e.clientX - r.left; my = e.clientY - r.top; lastPointer = performance.now(); };
  stage.addEventListener('pointermove', pm);

  const BUCKETS = 8, buckets = Array.from({ length: BUCKETS }, () => []), warm = [];
  let raf, last = performance.now(); const t0 = last;
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000) * (reduce ? 0.08 : 1); last = now;
    const t = (now - t0) / 1000, L = PARAMS.link, L2 = L * L;
    let cx = mx, cy = my;
    if (now - lastPointer > 2500) { cx = W * (0.5 + 0.32 * Math.sin(t * 0.37)); cy = H * (0.5 + 0.3 * Math.sin(t * 0.61 + 0.8)); }
    const R = L * 1.6;
    for (const p of pts) {
      p.x += p.vx * dt; p.y += p.vy * dt;
      if (p.x < -20) p.x += W + 40; else if (p.x > W + 20) p.x -= W + 40;
      if (p.y < -20) p.y += H + 40; else if (p.y > H + 20) p.y -= H + 40;
      // pointer pull: an offset that eases toward the cursor when close and relaxes back when not
      const dx = cx - p.x, dy = cy - p.y, d = Math.hypot(dx, dy);
      const f = d < R ? (1 - d / R) * 0.35 * PARAMS.pull : 0;
      const k = 1 - Math.exp(-dt * 5);
      p.ox += (dx * f - p.ox) * k; p.oy += (dy * f - p.oy) * k;
    }
    // uniform grid for neighbour search
    const cs = L, gw = Math.ceil((W + 40) / cs) + 1, gh = Math.ceil((H + 40) / cs) + 1, grid = new Map();
    for (let i = 0; i < pts.length; i++) {
      const p = pts[i], gx = Math.floor((p.x + p.ox + 20) / cs), gy = Math.floor((p.y + p.oy + 20) / cs), key = gy * gw + gx;
      let c = grid.get(key); if (!c) grid.set(key, c = []); c.push(i);
    }
    for (const b of buckets) b.length = 0; warm.length = 0;
    for (let i = 0; i < pts.length; i++) {
      const p = pts[i], px = p.x + p.ox, py = p.y + p.oy, gx = Math.floor((px + 20) / cs), gy = Math.floor((py + 20) / cs);
      for (let oy = -1; oy <= 1; oy++) for (let ox = -1; ox <= 1; ox++) {
        const c = grid.get((gy + oy) * gw + gx + ox); if (!c) continue;
        for (const j of c) {
          if (j <= i) continue;
          const q = pts[j], dz = Math.abs(p.z - q.z); if (dz > 0.35) continue;
          const dx = q.x + q.ox - px, dy = q.y + q.oy - py, d2 = dx * dx + dy * dy; if (d2 > L2) continue;
          const a = (1 - Math.sqrt(d2) / L) * (1 - dz / 0.35) * (0.35 + 0.65 * (p.z + q.z) / 2);
          buckets[Math.min(BUCKETS - 1, a * BUCKETS | 0)].push(px, py, q.x + q.ox, q.y + q.oy);
        }
      }
      const d = Math.hypot(cx - px, cy - py); if (d < R) warm.push(px, py, d / R);
    }
    ctx.setTransform(D, 0, 0, D, 0, 0); ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
    ctx.fillStyle = '#05070d'; ctx.fillRect(0, 0, W, H);
    ctx.lineWidth = 1; ctx.strokeStyle = '#a9d8ff';
    for (let b = 0; b < BUCKETS; b++) {
      const s = buckets[b]; if (!s.length) continue;
      ctx.globalAlpha = Math.pow((b + 0.5) / BUCKETS, 0.9);
      ctx.beginPath(); for (let j = 0; j < s.length; j += 4) { ctx.moveTo(s[j], s[j + 1]); ctx.lineTo(s[j + 2], s[j + 3]); } ctx.stroke();
    }
    ctx.strokeStyle = '#ffb36b'; ctx.lineWidth = 0.9;
    for (let j = 0; j < warm.length; j += 3) {
      ctx.globalAlpha = (1 - warm[j + 2]) * 0.8; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(warm[j], warm[j + 1]); ctx.stroke();
    }
    for (const p of pts) {
      ctx.globalAlpha = 0.35 + 0.65 * p.z; ctx.fillStyle = '#e6f3ff';
      const r = 0.7 + 1.5 * p.z; ctx.beginPath(); ctx.arc(p.x + p.ox, p.y + p.oy, r, 0, 6.2832); ctx.fill();
    }
    ctx.globalAlpha = 1; ctx.fillStyle = '#ffd2a1'; ctx.beginPath(); ctx.arc(cx, cy, 3, 0, 6.2832); ctx.fill();
    raf = requestAnimationFrame(frame);
  }
  raf = requestAnimationFrame(frame);
  return () => { cancelAnimationFrame(raf); ro.disconnect(); stage.removeEventListener('pointermove', pm); canvas.remove(); };
}
