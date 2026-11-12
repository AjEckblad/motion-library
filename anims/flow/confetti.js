// 3D paper confetti: each piece tumbles around its own axis (drawn as a squash of its width by cos(angle)),
// so pieces flash their front and back colours. Drag slows the fall; a sideways flutter keeps them drifting.
const PARAMS = { pieces: 160, gravity: 1 };

export default function (stage) {
  const canvas = document.createElement('canvas');
  canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block';
  stage.append(canvas);
  const ctx = canvas.getContext('2d');
  let W = 0, H = 0;
  const resize = () => { const d = Math.min(devicePixelRatio, 2); W = stage.clientWidth; H = stage.clientHeight; canvas.width = W * d; canvas.height = H * d; ctx.setTransform(d, 0, 0, d, 0, 0); };
  const ro = new ResizeObserver(resize); ro.observe(stage); resize();
  const colours = [['#ff4d6d', '#c9184a'], ['#ffd43b', '#f08c00'], ['#4dabf7', '#1864ab'], ['#69db7c', '#2b8a3e'], ['#ffffff', '#ced4da'], ['#ff922b', '#d9480f']];
  let pieces = [];
  function burst(x, y, n) {
    const S = Math.min(W, H);
    for (let i = 0; i < n; i++) {
      const a = -Math.PI / 2 + (Math.random() - 0.5) * 1.6, sp = S * (1.4 + Math.random() * 1.6);
      const c = colours[Math.floor(Math.random() * colours.length)];
      pieces.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, w: 5 + Math.random() * 6, h: 8 + Math.random() * 8, spin: Math.random() * 6.28, vs: 8 + Math.random() * 14, tilt: Math.random() * 6.28, vt: (Math.random() - 0.5) * 6, front: c[0], back: c[1], wob: Math.random() * 6.28, round: Math.random() < 0.25 });
    }
  }
  let next = 0, last = performance.now(), raf;
  function frame(now) {
    const dt = Math.min(0.033, (now - last) / 1000); last = now;
    if (now > next) { const n = Math.round(PARAMS.pieces / 2); burst(W * 0.25, H, n); burst(W * 0.75, H, n); next = now + 2600; }
    const g = Math.min(W, H) * 1.6 * PARAMS.gravity;
    ctx.fillStyle = '#1b1530'; ctx.fillRect(0, 0, W, H);
    for (const p of pieces) {
      p.vy += g * dt;
      p.vx *= Math.exp(-2.2 * dt); p.vy *= Math.exp(-2.2 * dt);             // paper is mostly drag
      p.wob += dt * 5; p.x += (p.vx + Math.sin(p.wob) * 40) * dt; p.y += p.vy * dt;
      p.spin += p.vs * dt; p.tilt += p.vt * dt;
      const c = Math.cos(p.spin);
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.tilt); ctx.scale(1, Math.abs(c) < 0.08 ? 0.08 : c);
      ctx.fillStyle = c > 0 ? p.front : p.back;
      if (p.round) { ctx.beginPath(); ctx.arc(0, 0, p.w * 0.6, 0, 7); ctx.fill(); }
      else ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      ctx.restore();
    }
    pieces = pieces.filter(p => p.y < H + 30);
    raf = requestAnimationFrame(frame);
  }
  raf = requestAnimationFrame(frame);
  return () => { cancelAnimationFrame(raf); ro.disconnect(); canvas.remove(); };
}
