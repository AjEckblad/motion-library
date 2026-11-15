// 3D paper confetti: each piece tumbles around its own axis (drawn as a squash of its width by cos(angle)),
// so pieces flash their front and back colours. On the black page the paper is lit from above: a piece is brightest
// when it faces you square on, darkens as it turns edge-on, and catches a brief glint as it swings through the light,
// so the tumble reads even on its darker back. Drag slows the fall; a sideways flutter keeps them drifting.
const PARAMS = { pieces: 160, gravity: 1 };

export default function (stage) {
  const canvas = document.createElement('canvas');
  canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block;background:#0c0c0e';
  stage.append(canvas);
  const ctx = canvas.getContext('2d');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  // a seeded random, so a given moment always looks the same (posters, frame stepping)
  let rs = 5;
  const rnd = () => { rs = (rs + 0x6D2B79F5) | 0; let t = Math.imul(rs ^ (rs >>> 15), 1 | rs); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  let W = 0, H = 0;
  // front and back of each paper, as rgb (the backs a shade deeper, but light enough to read on black)
  const colours = [[[255, 77, 109], [214, 51, 108]], [[255, 212, 59], [240, 150, 20]], [[77, 171, 247], [56, 132, 214]], [[105, 219, 124], [66, 170, 92]], [[255, 255, 255], [206, 212, 218]], [[255, 146, 43], [232, 100, 40]]];
  let pieces = [];
  function burst(x, y, n) {
    const S = Math.min(W, H);
    for (let i = 0; i < n; i++) {
      const a = -Math.PI / 2 + (rnd() - 0.5) * 1.6, sp = S * (1.4 + rnd() * 1.6);
      const c = colours[Math.floor(rnd() * colours.length)];
      pieces.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, w: 5 + rnd() * 6, h: 8 + rnd() * 8, spin: rnd() * 6.28, vs: 8 + rnd() * 14, tilt: rnd() * 6.28, vt: (rnd() - 0.5) * 6, front: c[0], back: c[1], wob: rnd() * 6.28, round: rnd() < 0.25 });
    }
  }
  let T = 0, next = 0;
  function update(dt) {
    T += dt;
    if (T >= next) { const n = Math.round(PARAMS.pieces / 2); burst(W * 0.25, H, n); burst(W * 0.75, H, n); next = T + 2.6; }
    const g = Math.min(W, H) * 1.6 * PARAMS.gravity;
    for (const p of pieces) {
      p.vy += g * dt;
      p.vx *= Math.exp(-2.2 * dt); p.vy *= Math.exp(-2.2 * dt);             // paper is mostly drag
      p.wob += dt * 5; p.x += (p.vx + Math.sin(p.wob) * 40) * dt; p.y += p.vy * dt;
      p.spin += p.vs * dt; p.tilt += p.vt * dt;
    }
    pieces = pieces.filter(p => p.y < H + 30);
  }
  function draw() {
    ctx.fillStyle = '#0c0c0e'; ctx.fillRect(0, 0, W, H);
    for (const p of pieces) {
      const c = Math.cos(p.spin), f = Math.abs(c);
      // light from above: square on is brightest, edge-on darkest, and a glint as the face swings through the light
      const lit = 0.5 + 0.5 * f, glint = Math.pow(Math.max(0, Math.sin(p.spin + p.tilt * 0.3)), 24) * 0.5 * f;
      const base = c > 0 ? p.front : p.back, k = c > 0 ? 1 : 0.82;
      const r = Math.min(255, base[0] * lit * k + 255 * glint), gg = Math.min(255, base[1] * lit * k + 255 * glint), b = Math.min(255, base[2] * lit * k + 255 * glint);
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.tilt); ctx.scale(1, f < 0.08 ? 0.08 * Math.sign(c || 1) : c);
      ctx.fillStyle = `rgb(${r | 0},${gg | 0},${b | 0})`;
      if (p.round) { ctx.beginPath(); ctx.arc(0, 0, p.w * 0.6, 0, 7); ctx.fill(); }
      else ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      ctx.restore();
    }
  }
  const resize = () => {
    const d = Math.min(devicePixelRatio, 2); W = stage.clientWidth; H = stage.clientHeight; canvas.width = W * d; canvas.height = H * d; ctx.setTransform(d, 0, 0, d, 0, 0);
    // reduced motion: one volley caught near the top of its flight, kept as a still
    if (reduce) { rs = 5; pieces = []; T = 0; next = 0; for (let i = 0; i < 54; i++) update(1 / 60); draw(); }
  };
  const ro = new ResizeObserver(resize); ro.observe(stage); resize();
  let last = performance.now(), raf;
  function frame(now) {
    update(Math.min(0.033, (now - last) / 1000)); last = now;
    draw();
    raf = requestAnimationFrame(frame);
  }
  if (!reduce) raf = requestAnimationFrame(frame);
  return () => { cancelAnimationFrame(raf); ro.disconnect(); canvas.remove(); };
}
