// Neon tubes: each tube is a smooth path (a sum of two slow sines) drawn as layers of light. The bloom is
// stroked thick into a quarter-resolution buffer and scaled up with smoothing, which blurs it for free; on top go
// the coloured glass body and a thin near-white core, added with 'lighter' so crossing tubes brighten each other.
// Now and then one tube stutters, like a transformer warming up.
const PARAMS = { tubes: 5, speed: 1, glow: 1 };

export default function (stage) {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const canvas = document.createElement('canvas');
  canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block';
  stage.append(canvas);
  const ctx = canvas.getContext('2d');
  const glowC = document.createElement('canvas'), gctx = glowC.getContext('2d');
  // a small mip pyramid: each level is the previous one drawn at half size, which blurs it; stacking them = soft bloom
  const mips = [document.createElement('canvas'), document.createElement('canvas')], mctx = mips.map(c => c.getContext('2d'));
  const Q = 4;
  let W = 0, H = 0, D = 1;
  const resize = () => {
    D = Math.min(devicePixelRatio, 2); W = stage.clientWidth || 1; H = stage.clientHeight || 1;
    canvas.width = W * D | 0; canvas.height = H * D | 0;
    glowC.width = Math.ceil(W / Q); glowC.height = Math.ceil(H / Q);
    mips.forEach((c, i) => { c.width = Math.ceil(glowC.width / (2 << i)); c.height = Math.ceil(glowC.height / (2 << i)); });
  };
  const ro = new ResizeObserver(resize); ro.observe(stage); resize();

  const COLORS = [[255, 46, 136], [0, 229, 255], [170, 80, 255], [80, 255, 120], [255, 140, 30], [255, 230, 80]];
  const n = Math.max(1, Math.min(6, Math.round(PARAMS.tubes)));
  const tubes = Array.from({ length: n }, (_, i) => ({
    c: COLORS[i % COLORS.length], k1: 1.6 + Math.random() * 1.6, k2: 3.5 + Math.random() * 2.5, w1: 0.3 + Math.random() * 0.3, w2: -(0.2 + Math.random() * 0.4),
    p1: Math.random() * 6.28, p2: Math.random() * 6.28, a1: 0.07 + Math.random() * 0.05, a2: 0.025 + Math.random() * 0.02, flick: 1, nextFlick: 2 + Math.random() * 8 + i * 2,
  }));
  const pathOf = (tb, t, s) => {
    const pts = [], x0 = W * 0.08, x1 = W * 0.92, steps = Math.ceil((x1 - x0) / 6);
    const i = tubes.indexOf(tb), cy = H * (0.5 + (i - (n - 1) / 2) * (0.62 / Math.max(1, n - 1)) * (n > 1 ? 1 : 0));
    for (let k = 0; k <= steps; k++) {
      const u = k / steps, x = x0 + (x1 - x0) * u;
      const y = cy + H * (tb.a1 * Math.sin(tb.k1 * u * 3.14 + tb.w1 * t + tb.p1) + tb.a2 * Math.sin(tb.k2 * u * 3.14 + tb.w2 * t + tb.p2));
      pts.push(x / s, y / s);
    }
    return pts;
  };
  const stroke = (g, pts) => { g.beginPath(); g.moveTo(pts[0], pts[1]); for (let k = 2; k < pts.length; k += 2) g.lineTo(pts[k], pts[k + 1]); };

  let raf, last = performance.now(), t = 0;
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    t += dt * PARAMS.speed * (reduce ? 0.06 : 1);
    if (!reduce) for (const tb of tubes) {
      if (t > tb.nextFlick && t < tb.nextFlick + 0.5) tb.flick = Math.random() < 0.45 ? 0.15 : 1;
      else { tb.flick = 1; if (t > tb.nextFlick + 0.5) tb.nextFlick = t + 6 + Math.random() * 12; }
    }
    // bloom buffer at quarter resolution
    gctx.setTransform(1, 0, 0, 1, 0, 0); gctx.clearRect(0, 0, glowC.width, glowC.height);
    gctx.globalCompositeOperation = 'lighter'; gctx.lineCap = 'round'; gctx.lineJoin = 'round';
    for (const tb of tubes) {
      const p = pathOf(tb, t, Q), [r, g, b] = tb.c, f = tb.flick * PARAMS.glow;
      for (const [w, a] of [[48, 0.045], [24, 0.07], [10, 0.13]]) {
        stroke(gctx, p); gctx.lineWidth = w / Q; gctx.strokeStyle = `rgba(${r},${g},${b},${a * f})`; gctx.stroke();
      }
    }
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = '#05040a'; ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
    ctx.globalCompositeOperation = 'lighter';
    let src = glowC;
    mctx.forEach((m, i) => { m.clearRect(0, 0, mips[i].width, mips[i].height); m.imageSmoothingEnabled = true; m.drawImage(src, 0, 0, mips[i].width, mips[i].height); src = mips[i]; });
    ctx.globalAlpha = 0.7; ctx.drawImage(glowC, 0, 0, canvas.width, canvas.height);
    ctx.globalAlpha = 1; ctx.drawImage(mips[0], 0, 0, canvas.width, canvas.height);
    ctx.drawImage(mips[1], 0, 0, canvas.width, canvas.height); ctx.drawImage(mips[1], 0, 0, canvas.width, canvas.height);
    ctx.globalAlpha = 1;
    // glass body and hot core at full resolution
    ctx.setTransform(D, 0, 0, D, 0, 0); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    for (const tb of tubes) {
      const p = pathOf(tb, t, 1), [r, g, b] = tb.c, f = tb.flick;
      stroke(ctx, p);
      ctx.lineWidth = 8; ctx.strokeStyle = `rgba(${r},${g},${b},${0.5 * f})`; ctx.stroke();
      ctx.lineWidth = 4; ctx.strokeStyle = `rgba(${(r * 3 + 255) / 4 | 0},${(g * 3 + 255) / 4 | 0},${(b * 3 + 255) / 4 | 0},${0.6 * f})`; ctx.stroke();
      ctx.lineWidth = 1.5; ctx.strokeStyle = `rgba(255,255,255,${0.7 * f})`; ctx.stroke();
      // dark electrode caps at both ends
      ctx.globalCompositeOperation = 'source-over'; ctx.fillStyle = '#16141c';
      for (const e of [0, p.length - 2]) { ctx.beginPath(); ctx.arc(p[e], p[e + 1], 4.5, 0, 6.2832); ctx.fill(); }
      ctx.globalCompositeOperation = 'lighter';
    }
    ctx.globalCompositeOperation = 'source-over';
    raf = requestAnimationFrame(frame);
  }
  raf = requestAnimationFrame(frame);
  return () => { cancelAnimationFrame(raf); ro.disconnect(); canvas.remove(); };
}
