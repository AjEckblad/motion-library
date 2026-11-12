// Lightning arcs: midpoint displacement makes a fractal path (split each segment, push the middle sideways,
// repeat), some segments fork into fading branches, and a blurred under-stroke plus a white core makes the glow.
const PARAMS = { branches: 0.5, rate: 14 };

export default function (stage) {
  const canvas = document.createElement('canvas');
  canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block';
  stage.append(canvas);
  const ctx = canvas.getContext('2d');
  let W = 0, H = 0;
  const resize = () => { const d = Math.min(devicePixelRatio, 2); W = stage.clientWidth; H = stage.clientHeight; canvas.width = W * d; canvas.height = H * d; ctx.setTransform(d, 0, 0, d, 0, 0); };
  const ro = new ResizeObserver(resize); ro.observe(stage); resize();

  let px = 0, py = 0, lastMove = -1e9;
  const onMove = e => { const b = canvas.getBoundingClientRect(); px = e.clientX - b.left; py = e.clientY - b.top; lastMove = performance.now(); };
  canvas.addEventListener('pointermove', onMove);

  function bolt(x1, y1, x2, y2, rough, depth, out, width) {
    const pts = [[x1, y1], [x2, y2]];
    let disp = Math.hypot(x2 - x1, y2 - y1) * rough;
    for (let k = 0; k < depth; k++) {
      for (let i = pts.length - 1; i > 0; i--) {
        const [ax, ay] = pts[i - 1], [bx, by] = pts[i], mx = (ax + bx) / 2, my = (ay + by) / 2, nx = -(by - ay), ny = bx - ax, l = Math.hypot(nx, ny) || 1, o = (Math.random() - 0.5) * disp;
        pts.splice(i, 0, [mx + nx / l * o, my + ny / l * o]);
      }
      disp *= 0.55;
    }
    out.push({ pts, width });
    if (width > 0.6) for (let i = 2; i < pts.length - 2; i++) {
      if (Math.random() < PARAMS.branches * 0.06) {
        const [sx, sy] = pts[i], ang = Math.atan2(y2 - y1, x2 - x1) + (Math.random() - 0.5) * 1.8, len = Math.hypot(x2 - x1, y2 - y1) * (0.15 + Math.random() * 0.3);
        bolt(sx, sy, sx + Math.cos(ang) * len, sy + Math.sin(ang) * len, rough, Math.max(2, depth - 2), out, width * 0.45);
      }
    }
    return out;
  }
  const nodes = () => [[W * 0.18, H * 0.22], [W * 0.82, H * 0.2], [W * 0.5, H * 0.86]];
  let strikes = [], acc = 0, last = performance.now(), raf;
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    let tx = px, ty = py;
    if (now - lastMove > 1500) { const t = now / 1000; tx = W / 2 + Math.cos(t * 0.8) * W * 0.18; ty = H * 0.5 + Math.sin(t * 1.3) * H * 0.14; }
    acc += dt * PARAMS.rate;
    while (acc >= 1) {
      acc -= 1;
      const [nx, ny] = nodes()[Math.floor(Math.random() * 3)];
      strikes.push({ segs: bolt(tx, ty, nx, ny, 0.22, 7, [], 2.2), life: 1 });
    }
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = 'rgba(6, 8, 18, 0.32)'; ctx.fillRect(0, 0, W, H);
    ctx.globalCompositeOperation = 'lighter';
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    for (const s of strikes) {
      const flick = 0.6 + Math.random() * 0.4;
      for (const { pts, width } of s.segs) {
        ctx.beginPath(); pts.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y));
        ctx.strokeStyle = `rgba(110, 150, 255, ${0.35 * s.life * flick})`; ctx.lineWidth = width * 7; ctx.shadowColor = 'rgba(120,160,255,.9)'; ctx.shadowBlur = 18; ctx.stroke();
        ctx.shadowBlur = 0; ctx.strokeStyle = `rgba(235, 242, 255, ${s.life * flick})`; ctx.lineWidth = width; ctx.stroke();
      }
      s.life -= dt * 7;
    }
    strikes = strikes.filter(s => s.life > 0);
    // electrodes and the pointer's charge
    ctx.globalCompositeOperation = 'source-over';
    for (const [x, y] of nodes()) { ctx.fillStyle = '#c9d6ff'; ctx.beginPath(); ctx.arc(x, y, 5, 0, 7); ctx.fill(); }
    const g = ctx.createRadialGradient(tx, ty, 0, tx, ty, 26); g.addColorStop(0, 'rgba(220,230,255,.9)'); g.addColorStop(1, 'rgba(120,150,255,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(tx, ty, 26, 0, 7); ctx.fill();
    raf = requestAnimationFrame(frame);
  }
  raf = requestAnimationFrame(frame);
  return () => { cancelAnimationFrame(raf); ro.disconnect(); canvas.removeEventListener('pointermove', onMove); canvas.remove(); };
}
