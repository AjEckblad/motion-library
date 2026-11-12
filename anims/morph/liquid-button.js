// Liquid button: the button outline is a ring of points, each on its own spring back to the rounded rectangle, and the pointer pushes the points it passes. On a checkout the Place order button ripples like a drop of liquid under the cursor and squeezes in when pressed, so the most important button on the page feels alive to the touch.
const PARAMS = { wobble: 1, stiffness: 140 };

export default function (stage) {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const canvas = document.createElement('canvas');
  canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block';
  stage.append(canvas);
  const ctx = canvas.getContext('2d');
  let W = 0, H = 0, S = 1, OX = 0, OY = 0;
  const resize = () => { const d = Math.min(devicePixelRatio, 2); W = stage.clientWidth; H = stage.clientHeight; canvas.width = W * d; canvas.height = H * d; S = Math.min(W / 420, H / 320); OX = W / 2 - 210 * S; OY = H / 2 - 160 * S; };
  const ro = new ResizeObserver(resize); ro.observe(stage); resize();

  // button in board space (420x320)
  const BX = 210, BY = 262, BW = 130, BH = 23, N = 90;
  const pts = Array.from({ length: N }, () => ({ off: 0, v: 0 }));
  const base = i => {   // a superellipse is close enough to a pill-ish rounded rectangle
    const a = (i / N) * Math.PI * 2, c = Math.cos(a), s = Math.sin(a), n = 5;
    return { x: BX + Math.sign(c) * Math.abs(c) ** (2 / n) * BW, y: BY + Math.sign(s) * Math.abs(s) ** (2 / n) * BH, nx: c, ny: s };
  };
  const inside = (x, y) => Math.abs(x - BX) < BW && Math.abs(y - BY) < BH;
  let px = -999, py = -999, lpx = px, lpy = py, lastMove = -1e9, state = 'idle', stateAt = 0, down = 0;
  const toBoard = e => { const b = canvas.getBoundingClientRect(); return [(e.clientX - b.left - OX) / S, (e.clientY - b.top - OY) / S]; };
  const onMove = e => { [px, py] = toBoard(e); lastMove = performance.now(); canvas.style.cursor = inside(px, py) ? 'pointer' : ''; };
  const press = now => { if (state !== 'idle') return; state = 'placing'; stateAt = now; down = now; pts.forEach(p => { p.v -= 2.2; }); };
  const onDown = e => { const [x, y] = toBoard(e); if (inside(x, y)) press(performance.now()); };
  canvas.addEventListener('pointermove', onMove); canvas.addEventListener('pointerdown', onDown);

  const rr = (x, y, w, h, r) => { ctx.beginPath(); ctx.roundRect ? ctx.roundRect(x, y, w, h, r) : ctx.rect(x, y, w, h); };
  const font = (w, s) => `${w} ${s}px system-ui, -apple-system, sans-serif`;
  const items = [['Linen overshirt', 'Size M · Sand', '$68.00', '#e9d8c4'], ['Wool beanie', 'One size · Rust', '$24.00', '#d9601a']];
  let last = performance.now(), raf, cycleT0 = performance.now();
  function frame(now) {
    const dt = Math.min(0.025, (now - last) / 1000); last = now;
    // simulated cursor: drift in, sweep along the button, press, wait, reset
    let x = px, y = py;
    const auto = now - lastMove > 2000;
    if (auto) {
      const t = ((now - cycleT0) % 6400) / 1000;
      if (t < 1.2) { const k = 1 - (1 - t / 1.2) ** 3; x = 380 - k * 260; y = 312 - k * 46; }
      else if (t < 2.6) { const k = (t - 1.2) / 1.4; x = 120 + Math.sin(k * Math.PI) * 200 * (k < .5 ? 1 : 1) + k * 60; y = 262 + Math.sin(k * Math.PI * 3) * 26; }
      else { const k = Math.min(1, (t - 2.6) / 0.5); x = 316 - k * 12; y = 270; if (t > 3.2 && state === 'idle' && t < 3.4) press(now); }
      if (t > 6.2 && state !== 'idle') state = 'idle';
    }
    if (state === 'placing' && now - stateAt > 1100) { state = 'done'; stateAt = now; pts.forEach(p => { p.v += 1.6; }); }
    if (!auto && state === 'done' && now - stateAt > 2500) state = 'idle';
    const vx = (x - lpx) / Math.max(dt, 1e-3), vy = (y - lpy) / Math.max(dt, 1e-3); lpx = x; lpy = y;
    const k = PARAMS.stiffness, c = 2 * Math.sqrt(k) * 0.32;
    if (!reduce) {   // reduced motion: no ripple or squeeze, the outline stays a clean pill
      for (let i = 0; i < N; i++) {
        const b = base(i), p = pts[i], d = Math.hypot(x - b.x, y - b.y), reach = 46;
        if (d < reach && Math.abs(vx) + Math.abs(vy) < 4000) p.v += (1 - d / reach) ** 2 * (vx * b.nx + vy * b.ny) * 0.0007 * PARAMS.wobble * 60;
        p.v += (-k * p.off - c * p.v) * dt; p.off += p.v * dt;
      }
      for (let i = 0; i < N; i++) { const a = pts[(i + N - 1) % N], b = pts[(i + 1) % N]; pts[i].v += ((a.off + b.off) / 2 - pts[i].off) * 0.2 * dt * 60; }
    }

    ctx.setTransform(canvas.width / W, 0, 0, canvas.height / H, 0, 0);
    { const g = ctx.createRadialGradient(W / 2, 0, 0, W / 2, 0, Math.hypot(W / 2, H)); g.addColorStop(0, '#1b1b1e'); g.addColorStop(1, '#0d0d0f'); ctx.fillStyle = g; } ctx.fillRect(0, 0, W, H);   // the library's near-black ground
    ctx.translate(OX, OY); ctx.scale(S, S);
    ctx.save(); ctx.shadowColor = 'rgba(42,15,38,.2)'; ctx.shadowBlur = 30; ctx.shadowOffsetY = 12; rr(50, 14, 320, 296, 20); ctx.fillStyle = '#fff'; ctx.fill(); ctx.restore();
    ctx.fillStyle = '#1d0b1a'; ctx.font = font(720, 16); ctx.fillText('Order summary', 74, 46);
    items.forEach(([n, m, pr, col], i) => {
      const y = 66 + i * 52; ctx.fillStyle = col; rr(74, y, 38, 38, 9); ctx.fill();
      ctx.fillStyle = '#1d0b1a'; ctx.font = font(620, 12.5); ctx.fillText(n, 124, y + 16); ctx.fillStyle = '#8a7686'; ctx.font = font(400, 11); ctx.fillText(m, 124, y + 32);
      ctx.fillStyle = '#1d0b1a'; ctx.font = font(620, 12.5); ctx.textAlign = 'right'; ctx.fillText(pr, 346, y + 16); ctx.textAlign = 'left';
    });
    ctx.fillStyle = '#f1e8ef'; ctx.fillRect(74, 172, 272, 1);
    [['Shipping', 'Free'], ['Tax', '$7.36']].forEach(([a, b], i) => { ctx.fillStyle = '#7a6676'; ctx.font = font(400, 11.5); ctx.fillText(a, 74, 192 + i * 18); ctx.textAlign = 'right'; ctx.fillText(b, 346, 192 + i * 18); ctx.textAlign = 'left'; });
    ctx.fillStyle = '#1d0b1a'; ctx.font = font(720, 14); ctx.fillText('Total', 74, 228); ctx.textAlign = 'right'; ctx.fillText('$99.36', 346, 228); ctx.textAlign = 'left';
    // the liquid button
    ctx.beginPath();
    for (let i = 0; i <= N; i++) { const b = base(i % N), o = Math.max(-0.35, Math.min(0.35, pts[i % N].off)) * 40, X = b.x + b.nx * o, Y = b.y + b.ny * o * 0.6; i ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y); }
    ctx.fillStyle = state === 'done' ? '#1f7a45' : '#b8359a'; ctx.fill();
    ctx.fillStyle = '#fff'; ctx.font = font(680, 14); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    const label = state === 'idle' ? 'Place order · $99.36' : state === 'placing' ? 'Placing order' : 'Order placed';
    const fade = Math.min(1, (now - stateAt) / 200); ctx.globalAlpha = state === 'idle' ? 1 : fade;
    ctx.fillText(label, BX + (state === 'done' ? 10 : 0), BY + 1 + (reduce ? 0 : (1 - fade) * (state === 'idle' ? 0 : 4)));
    if (state === 'placing') { ctx.strokeStyle = 'rgba(255,255,255,.9)'; ctx.lineWidth = 2; ctx.beginPath(); const a = now / 160; ctx.arc(BX - 62, BY, 6, a, a + 4.2); ctx.stroke(); }
    if (state === 'done') { ctx.strokeStyle = '#fff'; ctx.lineWidth = 2.4; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(BX - 60, BY); ctx.lineTo(BX - 55, BY + 5); ctx.lineTo(BX - 47, BY - 5); ctx.stroke(); }
    ctx.globalAlpha = 1; ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
    if (auto) {   // drawn cursor
      const pr = now - down < 140 ? 0.86 : 1;
      ctx.save(); ctx.translate(x - 5, y - 3); ctx.scale(pr, pr); ctx.beginPath(); ctx.moveTo(5, 3); ctx.lineTo(19, 11); ctx.lineTo(12.8, 12.6); ctx.lineTo(10, 19); ctx.closePath();
      ctx.fillStyle = '#1d0b1a'; ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.6; ctx.lineJoin = 'round'; ctx.fill(); ctx.stroke(); ctx.restore();
    }
    raf = requestAnimationFrame(frame);
  }
  raf = requestAnimationFrame(frame);
  return () => { cancelAnimationFrame(raf); ro.disconnect(); canvas.removeEventListener('pointermove', onMove); canvas.removeEventListener('pointerdown', onDown); canvas.remove(); };
}
