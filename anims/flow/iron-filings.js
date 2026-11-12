// Iron filings: thousands of steel slivers scattered on paper over hidden bar magnets. Each sliver turns to lie along
// the field, as a tiny compass would. When the paper is tapped the filings hop, and they settle onto field lines:
// they are pulled across the field toward the nearest contour of the flux function (in 2D, the sum of each pole's
// angle, weighted by its charge), which is where real filings chain up end to end. Drag a magnet and tap again.
const PARAMS = { filings: 9000, lines: 36, taps: 1 };

export default function (stage) {
  const canvas = document.createElement('canvas');
  canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block;touch-action:none;cursor:grab';
  stage.append(canvas);
  const ctx = canvas.getContext('2d');
  let W = 1, H = 1, D = 1, paper = null;
  // paper: black card, a little fibre, a vignette, all drawn once
  const makePaper = () => {
    paper = document.createElement('canvas'); paper.width = canvas.width; paper.height = canvas.height;
    const g = paper.getContext('2d'); g.setTransform(D, 0, 0, D, 0, 0);
    g.fillStyle = '#131317'; g.fillRect(0, 0, W, H);
    for (let i = 0; i < W * H / 60; i++) { g.fillStyle = `rgba(${Math.random() < 0.5 ? '0,0,0' : '200,200,215'},${Math.random() * 0.05})`; g.fillRect(Math.random() * W, Math.random() * H, 1 + Math.random() * 3, 0.6); }
    const v = g.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.3, W / 2, H / 2, Math.max(W, H) * 0.75); v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,.45)');
    g.fillStyle = v; g.fillRect(0, 0, W, H);
  };
  const N = Math.max(500, Math.round(PARAMS.filings));
  const fx = new Float32Array(N), fy = new Float32Array(N), fa = new Float32Array(N), fl = new Float32Array(N), shade = new Uint8Array(N);
  const scatter = () => { for (let i = 0; i < N; i++) { fx[i] = Math.random() * W; fy[i] = Math.random() * H; fa[i] = Math.random() * Math.PI; fl[i] = 2.2 + Math.random() * 3.2; shade[i] = (Math.random() * 3) | 0; } };
  const resize = () => {
    D = Math.min(devicePixelRatio, 2); W = stage.clientWidth || 1; H = stage.clientHeight || 1;
    canvas.width = Math.max(1, (W * D) | 0); canvas.height = Math.max(1, (H * D) | 0); ctx.setTransform(D, 0, 0, D, 0, 0); makePaper(); scatter(); place();
  };
  // two bar magnets, each a north and a south pole a bar-length apart
  const mags = [{ x: 0, y: 0, a: 0, len: 0, tx: 0, ty: 0 }, { x: 0, y: 0, a: 0, len: 0, tx: 0, ty: 0 }];
  function place() {
    const s = Math.min(W, H);
    Object.assign(mags[0], { x: W * 0.36, y: H * 0.5, a: 0.2, len: s * 0.34 }); Object.assign(mags[1], { x: W * 0.68, y: H * 0.52, a: Math.PI / 2 + 0.3, len: s * 0.28 });
    mags.forEach(m => { m.tx = m.x; m.ty = m.y; });
  }
  const poles = () => mags.flatMap(m => { const c = Math.cos(m.a) * m.len / 2, s = Math.sin(m.a) * m.len / 2; return [[m.x + c, m.y + s, 1], [m.x - c, m.y - s, -1]]; });
  const ro = new ResizeObserver(resize); ro.observe(stage); resize();

  // drag a magnet
  let drag = null;
  const at = e => { const r = canvas.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
  const down = e => { const [x, y] = at(e); let best = null, bd = Math.min(W, H) * 0.2; for (const m of mags) { const d = Math.hypot(x - m.x, y - m.y); if (d < bd) { bd = d; best = m; } } if (best) { drag = { m: best, dx: best.x - x, dy: best.y - y }; canvas.setPointerCapture(e.pointerId); canvas.style.cursor = 'grabbing'; } };
  const move = e => { if (!drag) return; const [x, y] = at(e); drag.m.tx = x + drag.dx; drag.m.ty = y + drag.dy; };
  const up = () => { if (drag) tapAt = time; drag = null; canvas.style.cursor = 'grab'; };
  canvas.addEventListener('pointerdown', down); canvas.addEventListener('pointermove', move); canvas.addEventListener('pointerup', up); canvas.addEventListener('pointercancel', up);

  let raf, last = performance.now(), time = 0, tapAt = 0.6, nextTap = 0.6;
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000); last = now; time += dt;
    // left alone, the second magnet drifts slowly round, and the paper is tapped every few seconds
    if (!drag) { const m = mags[1]; m.tx = W * (0.66 + 0.1 * Math.sin(time * 0.17)); m.ty = H * (0.5 + 0.18 * Math.sin(time * 0.23)); m.a += dt * 0.12; }
    for (const m of mags) { m.x += (m.tx - m.x) * Math.min(1, dt * 6); m.y += (m.ty - m.y) * Math.min(1, dt * 6); }
    if (time > nextTap) { tapAt = time; nextTap = time + 2.4 / Math.max(0.2, PARAMS.taps); }
    const since = time - tapAt, hop = since < 0.55 ? Math.exp(-since * 5) : 0;   // how loose the filings are right now
    const P = poles(), K = 2 * Math.max(2, Math.round(PARAMS.lines / 2)), s = Math.min(W, H);   // even, so the lines meet seamlessly round each pole
    for (let i = 0; i < N; i++) {
      let bx = 0, by = 0, gpx = 0, gpy = 0, psi = 0;
      for (const [px, py, q] of P) {
        const dx = fx[i] - px, dy = fy[i] - py, r2 = dx * dx + dy * dy + 30;
        bx += (q * dx) / r2; by += (q * dy) / r2;                  // a 2D pole's field falls off as 1/r
        psi += q * Math.atan2(dy, dx); gpx += (-q * dy) / r2; gpy += (q * dx) / r2;   // the flux function and its gradient
      }
      const b = Math.hypot(bx, by) + 1e-9;
      // turn toward the field (a filing has no head or tail, so the nearest of the two directions)
      let da = Math.atan2(by, bx) - fa[i]; da -= Math.PI * Math.round(da / Math.PI);
      fa[i] += da * Math.min(1, dt * (2 + 30 * hop) * Math.min(1, b * s * 0.6));
      if (hop > 0.01) {
        // a gentle pull across the field toward the nearest field line (filings chain up there), lost in the shake far
        // from the magnets where the field is weak; and a slide along the field toward the stronger end
        const g = Math.hypot(gpx, gpy) + 1e-9, pull = -Math.sin(K * psi / 2), grip = Math.min(1, b * s * 0.35);
        const across = Math.max(-1, Math.min(1, pull * 1.5)) * 1.1 * grip * hop;
        fx[i] += (gpx / g) * across + (Math.random() - 0.5) * hop * 2.6;
        fy[i] += (gpy / g) * across + (Math.random() - 0.5) * hop * 2.6;
        const along = (Math.random() - 0.5) * 3.2 * hop;
        fx[i] += (bx / b) * along; fy[i] += (by / b) * along;
        if (fx[i] < 0) fx[i] += W; else if (fx[i] > W) fx[i] -= W; if (fy[i] < 0) fy[i] += H; else if (fy[i] > H) fy[i] -= H;
      }
    }
    // draw: the paper (it jumps a pixel when tapped), the magnets' faint shadows through it, then the filings
    const j = hop * 1.2;
    ctx.save(); ctx.translate((Math.random() - 0.5) * j, (Math.random() - 0.5) * j);
    ctx.drawImage(paper, 0, 0, W, H);
    for (const m of mags) {
      ctx.save(); ctx.translate(m.x, m.y); ctx.rotate(m.a);
      const w = m.len * 1.08, h = m.len * 0.2, g = ctx.createLinearGradient(-w / 2, 0, w / 2, 0);
      g.addColorStop(0, 'rgba(255,70,50,.16)'); g.addColorStop(0.5, 'rgba(120,110,130,.05)'); g.addColorStop(1, 'rgba(60,120,255,.16)');
      ctx.fillStyle = g; ctx.filter = 'blur(6px)'; ctx.fillRect(-w / 2, -h / 2, w, h); ctx.filter = 'none';
      ctx.fillStyle = 'rgba(230,225,240,.2)'; ctx.font = `600 ${Math.round(h * 0.55)}px system-ui, sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('N', w * 0.38, 0); ctx.fillText('S', -w * 0.38, 0);
      ctx.restore();
    }
    ctx.lineCap = 'round';
    ctx.lineWidth = 1.5; ctx.strokeStyle = 'rgba(0,0,0,.55)'; ctx.beginPath();            // tiny cast shadows
    for (let i = 0; i < N; i++) { const c = Math.cos(fa[i]) * fl[i], s2 = Math.sin(fa[i]) * fl[i]; ctx.moveTo(fx[i] - c + 0.8, fy[i] - s2 + 1); ctx.lineTo(fx[i] + c + 0.8, fy[i] + s2 + 1); }
    ctx.stroke();
    const tones = ['#8d929c', '#b9bec7', '#e4e7ec'];   // bright steel catching the light
    ctx.lineWidth = 1.1;
    for (let k = 0; k < 3; k++) {
      ctx.strokeStyle = tones[k]; ctx.beginPath();
      for (let i = 0; i < N; i++) { if (shade[i] !== k) continue; const c = Math.cos(fa[i]) * fl[i], s2 = Math.sin(fa[i]) * fl[i]; ctx.moveTo(fx[i] - c, fy[i] - s2); ctx.lineTo(fx[i] + c, fy[i] + s2); }
      ctx.stroke();
    }
    ctx.restore();
    raf = requestAnimationFrame(frame);
  }
  raf = requestAnimationFrame(frame);
  return () => {
    cancelAnimationFrame(raf); ro.disconnect();
    canvas.removeEventListener('pointerdown', down); canvas.removeEventListener('pointermove', move); canvas.removeEventListener('pointerup', up); canvas.removeEventListener('pointercancel', up);
    canvas.remove();
  };
}
