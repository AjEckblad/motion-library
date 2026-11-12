// Dripping text: drops swell under the letters, stretch, pinch off and fall. A blur + alpha-threshold filter
// (the gooey trick) melts drop and letter into one liquid shape, so the necks thin and snap like real paint.
const PARAMS = { drips: 14, viscosity: 1 };

export default function (stage) {
  const id = 'drip-' + Math.random().toString(36).slice(2, 8);
  const wrap = document.createElement('div');
  wrap.style.cssText = 'position:absolute;inset:0;background:#0d0b0e';
  wrap.innerHTML = `<svg width="0" height="0" style="position:absolute"><filter id="${id}"><feGaussianBlur stdDeviation="5"/><feColorMatrix values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 24 -11"/></filter></svg>`;
  const canvas = document.createElement('canvas');
  canvas.style.cssText = `position:absolute;inset:0;width:100%;height:100%;display:block;filter:url(#${id})`;
  wrap.append(canvas); stage.append(wrap);
  const ctx = canvas.getContext('2d');
  let W = 0, H = 0, font = 0, baseY = 0, spots = [];
  const resize = () => {
    const d = Math.min(devicePixelRatio, 2); W = stage.clientWidth; H = stage.clientHeight; canvas.width = W * d; canvas.height = H * d; ctx.setTransform(d, 0, 0, d, 0, 0);
    font = Math.min(W * 0.24, H * 0.42); baseY = H * 0.46;
    // find where the letters' bottom edges are, so drops start under real ink
    const off = document.createElement('canvas'); off.width = Math.ceil(W); off.height = Math.ceil(H); const o = off.getContext('2d');
    o.font = `900 ${font}px "Mona Sans", system-ui, sans-serif`; o.textAlign = 'center'; o.textBaseline = 'alphabetic'; o.fillText('DRIP', W / 2, baseY);
    const data = o.getImageData(0, 0, off.width, off.height).data; spots = [];
    for (let x = 2; x < off.width - 2; x += 3) { for (let y = Math.min(off.height - 1, Math.ceil(baseY + 4)); y > baseY - font; y--) if (data[(y * off.width + x) * 4 + 3] > 200) { if (y > baseY - font * 0.15) spots.push([x, y]); break; } }
  };
  const ro = new ResizeObserver(resize); ro.observe(stage); resize();
  let drips = [], raf, last = performance.now();
  const newDrip = () => { const [x, y] = spots[Math.floor(Math.random() * spots.length)] || [W / 2, baseY]; return { x, y0: y, len: 0, r: 2 + Math.random() * font * 0.025, grow: (8 + Math.random() * 18) / PARAMS.viscosity, falling: false, fy: 0, fv: 0 }; };
  for (let i = 0; i < PARAMS.drips; i++) { const d = newDrip(); d.len = Math.random() * font * 0.3; drips.push(d); }
  function frame(now) {
    const dt = Math.min(0.033, (now - last) / 1000); last = now;
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#ff2e4a';
    ctx.font = `900 ${font}px "Mona Sans", system-ui, sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic'; ctx.fillText('DRIP', W / 2, baseY);
    for (const d of drips) {
      if (!d.falling) {
        d.len += d.grow * dt * (1 + d.len / (font * 0.2));            // drips accelerate as they get heavier
        d.r = Math.min(font * 0.06, d.r + dt * 2);
        if (d.len > font * (0.35 + Math.random() * 0.002)) { d.falling = true; d.fy = d.y0 + d.len; d.fv = 40; }
        // neck: a column of shrinking circles down to the bulb
        const steps = Math.max(2, d.len / 3);
        for (let i = 0; i <= steps; i++) { const k = i / steps, r = d.r * (0.35 + 0.25 * Math.sin(k * Math.PI)) * (k > 0.85 ? 1.7 : 1); ctx.beginPath(); ctx.arc(d.x, d.y0 + d.len * k, r, 0, 7); ctx.fill(); }
      } else {
        d.fv += 1400 * dt; d.fy += d.fv * dt;
        ctx.beginPath(); ctx.ellipse(d.x, d.fy, d.r * 1.5, d.r * 1.9, 0, 0, 7); ctx.fill();
      }
    }
    // a puddle collects at the bottom
    ctx.fillRect(0, H - H * 0.05, W, H * 0.05);
    drips = drips.map(d => (d.falling && d.fy > H) ? newDrip() : d);
    raf = requestAnimationFrame(frame);
  }
  raf = requestAnimationFrame(frame);
  return () => { cancelAnimationFrame(raf); ro.disconnect(); wrap.remove(); };
}
