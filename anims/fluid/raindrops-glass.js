// Rain on glass: the city behind the window is blurred, but every drop is a tiny lens that shows it sharp,
// upside down and magnified. Heavy drops slide, wobble and leave a trail of small droplets behind them.
const PARAMS = { rain: 1, size: 1 };

export default function (stage) {
  const canvas = document.createElement('canvas');
  canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block';
  stage.append(canvas);
  const ctx = canvas.getContext('2d');
  let W = 0, H = 0, sharp, blurred;
  function paintCity() {
    sharp = document.createElement('canvas'); sharp.width = W; sharp.height = H;
    const g = sharp.getContext('2d');
    const sky = g.createLinearGradient(0, 0, 0, H); sky.addColorStop(0, '#1b2238'); sky.addColorStop(1, '#3a2a3a'); g.fillStyle = sky; g.fillRect(0, 0, W, H);
    for (let i = 0; i < 26; i++) { const x = Math.random() * W, w = 20 + Math.random() * 60, h = H * (0.25 + Math.random() * 0.5); g.fillStyle = '#121626'; g.fillRect(x, H - h, w, h);
      for (let y = H - h + 8; y < H - 6; y += 10) for (let xx = x + 5; xx < x + w - 5; xx += 9) if (Math.random() < 0.35) { g.fillStyle = ['#ffd27a', '#ffb35c', '#9fd3ff', '#ff8aa0'][Math.random() * 4 | 0]; g.fillRect(xx, y, 4, 5); } }
    for (let i = 0; i < 18; i++) { const x = Math.random() * W, y = H * (0.7 + Math.random() * 0.3), c = ['#ff5c5c', '#ffd27a', '#ffffff'][Math.random() * 3 | 0]; const rg = g.createRadialGradient(x, y, 0, x, y, 30); rg.addColorStop(0, c); rg.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = rg; g.fillRect(x - 30, y - 30, 60, 60); }
    blurred = document.createElement('canvas'); blurred.width = W; blurred.height = H;
    const b = blurred.getContext('2d'); b.filter = 'blur(10px) brightness(.85)'; b.drawImage(sharp, -20, -20, W + 40, H + 40);
  }
  const resize = () => { const d = Math.min(devicePixelRatio, 2); W = stage.clientWidth; H = stage.clientHeight; canvas.width = W * d; canvas.height = H * d; ctx.setTransform(d, 0, 0, d, 0, 0); paintCity(); };
  const ro = new ResizeObserver(resize); ro.observe(stage); resize();

  const S = () => Math.min(W, H) * 0.012 * PARAMS.size;
  let drops = [], beads = [];
  const newDrop = (y = Math.random() * H) => ({ x: Math.random() * W, y, r: S() * (0.6 + Math.random() * 1.8), vy: 0, wob: Math.random() * 6.28, lastTrail: 0 });
  for (let i = 0; i < 40; i++) drops.push(newDrop());
  for (let i = 0; i < 260; i++) beads.push({ x: Math.random() * W, y: Math.random() * H, r: S() * (0.2 + Math.random() * 0.5) });
  function lens(x, y, r) {
    // a drop flips and magnifies what is behind it: draw the sharp city through a clipped, inverted window
    ctx.save(); ctx.beginPath(); ctx.ellipse(x, y, r, r * 1.08, 0, 0, Math.PI * 2); ctx.clip();
    ctx.translate(x, y); ctx.scale(-0.35, -0.35); ctx.translate(-x, -y);
    ctx.drawImage(sharp, x - W / 2 + (x - W / 2) * 0.3, y - H / 2 + (y - H / 2) * 0.3, W, H);
    ctx.restore();
    ctx.strokeStyle = 'rgba(0,0,0,.35)'; ctx.lineWidth = Math.max(1, r * 0.12); ctx.beginPath(); ctx.ellipse(x, y + r * 0.04, r, r * 1.08, 0, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,.55)'; ctx.beginPath(); ctx.ellipse(x - r * 0.3, y - r * 0.38, r * 0.22, r * 0.14, -0.6, 0, Math.PI * 2); ctx.fill();
  }
  let last = performance.now(), raf;
  function frame(now) {
    const dt = Math.min(0.033, (now - last) / 1000); last = now;
    if (Math.random() < dt * 14 * PARAMS.rain) beads.push({ x: Math.random() * W, y: Math.random() * H, r: S() * (0.2 + Math.random() * 0.5) });
    if (Math.random() < dt * 3 * PARAMS.rain) drops.push(newDrop(-10));
    if (beads.length > 420) beads.splice(0, beads.length - 420);
    ctx.drawImage(blurred, 0, 0, W, H);
    for (const b of beads) lens(b.x, b.y, b.r);
    for (const d of drops) {
      // big drops overcome surface tension and slide, in fits and starts
      const heavy = d.r > S() * 1.4;
      if (heavy) { d.vy += (Math.random() < 0.05 ? 0 : 900 * dt) * (d.r / S()) * 0.4; d.vy *= 0.92; d.y += d.vy * dt; d.wob += dt * 6; d.x += Math.sin(d.wob) * 0.3; }
      if (heavy && d.y - d.lastTrail > d.r * 1.2) { beads.push({ x: d.x + (Math.random() - 0.5) * d.r * 0.4, y: d.y - d.r, r: d.r * (0.2 + Math.random() * 0.25) }); d.lastTrail = d.y; d.r *= 0.985; }
      // absorb beads in the path
      for (let i = beads.length - 1; i >= 0; i--) { const b = beads[i]; if (Math.abs(b.x - d.x) < d.r && b.y > d.y - d.r && b.y < d.y + d.r) { d.r = Math.min(S() * 3.5, Math.hypot(d.r, b.r)); beads.splice(i, 1); } }
      lens(d.x, d.y, d.r);
    }
    drops = drops.filter(d => d.y < H + 30);
    raf = requestAnimationFrame(frame);
  }
  raf = requestAnimationFrame(frame);
  return () => { cancelAnimationFrame(raf); ro.disconnect(); canvas.remove(); };
}
