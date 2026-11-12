// Fireworks: rockets climb, slow, and burst at the top of their arc into stars that obey gravity and air drag. Six
// shell types, each a different rule set: peony (a sphere of stars), ring (a tilted circle, so it reads as an
// ellipse), willow (heavy drag, long-lived gold that droops and leaves trails), crossette (a few stars that each split
// into four), crackle (glitter that pops into tiny white flashes) and two-tone (an inner core in a second colour).
// Each star keeps its last few positions and is drawn as a tapering additive streak. Click to launch.
const PARAMS = { rate: 1, gravity: 1, drag: 1 };

export default function (stage) {
  const canvas = document.createElement('canvas');
  canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block;touch-action:none';
  stage.append(canvas);
  const ctx = canvas.getContext('2d');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let W = 0, H = 0, D = 1;
  const BG = '#05050b';
  const resize = () => { D = Math.min(devicePixelRatio, 2); W = stage.clientWidth || 1; H = stage.clientHeight || 1; canvas.width = Math.round(W * D); canvas.height = Math.round(H * D); ctx.setTransform(D, 0, 0, D, 0, 0); ctx.fillStyle = BG; ctx.fillRect(0, 0, W, H); };
  const ro = new ResizeObserver(resize); ro.observe(stage); resize();

  const HUES = [350, 18, 45, 140, 190, 215, 275, 310];
  const parts = [], flashes = [];
  // a star: position, velocity, age/life, colour, width, drag, gravity scale, kind, and its recent positions (tr)
  const spark = (x, y, vx, vy, o) => parts.push({ x, y, vx, vy, age: 0, life: 1.6, hue: 40, sat: 90, light: 62, w: 2, drag: 0.972, g: 1, kind: 'star', tl: 14, tr: [x, y], ...o });
  const launch = (x, ty) => {
    const s = Math.min(W, H), vy = -Math.sqrt(2 * 260 * Math.max(0.2, PARAMS.gravity) * Math.max(40, H - ty));    // just enough speed to reach ty
    spark(x, H + 4, (Math.random() - 0.5) * 20, vy, { kind: 'rocket', life: 9, light: 80, sat: 40, hue: 40, w: 2, drag: 1, g: 1, tl: 10 });
  };
  const sphere = n => { const out = []; for (let i = 0; i < n; i++) { const u = Math.random() * 2 - 1, a = Math.random() * 6.2832, r = Math.sqrt(1 - u * u); out.push([r * Math.cos(a), r * Math.sin(a) * 0.95 + u * 0.05, u]); } return out; };
  const burst = (x, y) => {
    const s = Math.min(W, H), sp = s * (0.5 + Math.random() * 0.15), hue = HUES[Math.random() * HUES.length | 0];
    const type = ['peony', 'ring', 'willow', 'crossette', 'crackle', 'twotone'][Math.random() * 6 | 0];
    flashes.push({ x, y, age: 0, r: s * 0.1, hue: type === 'willow' ? 40 : hue });
    if (type === 'peony' || type === 'twotone') {
      for (const [a, b] of sphere(170)) spark(x, y, a * sp, b * sp, { hue, life: 1.5 + Math.random() * 0.5 });
      if (type === 'twotone') { const h2 = (hue + 150) % 360; for (const [a, b] of sphere(60)) spark(x, y, a * sp * 0.45, b * sp * 0.45, { hue: h2, light: 70, life: 1.3 }); }
    } else if (type === 'ring') {
      const tilt = Math.random() * 3.14, squash = 0.25 + Math.random() * 0.6, n = 90;
      for (let i = 0; i < n; i++) {
        const a = i / n * 6.2832, cx = Math.cos(a), cy = Math.sin(a) * squash, c = Math.cos(tilt), sn = Math.sin(tilt);
        spark(x, y, (cx * c - cy * sn) * sp, (cx * sn + cy * c) * sp, { hue, light: 66, life: 1.5 });
      }
      for (const [a, b] of sphere(24)) spark(x, y, a * sp * 0.25, b * sp * 0.25, { hue: 50, sat: 30, light: 85, life: 0.9 });
    } else if (type === 'willow') {
      for (const [a, b] of sphere(110)) spark(x, y, a * sp * 0.85, b * sp * 0.85, { kind: 'willow', hue: 38, sat: 85, light: 58, life: 3.2 + Math.random(), drag: 0.955, g: 0.5, w: 1.3, tl: 30 });
    } else if (type === 'crossette') {
      for (const [a, b] of sphere(16)) spark(x, y, a * sp * 0.9, b * sp * 0.9, { kind: 'cross', hue, light: 72, life: 0.75 + Math.random() * 0.15, w: 2.2 });
    } else {
      for (const [a, b] of sphere(120)) spark(x, y, a * sp, b * sp, { kind: 'crackle', hue: 48, sat: 60, light: 75, life: 0.9 + Math.random() * 0.6, w: 1.4 });
    }
  };

  let lastPointer = -1e9;
  const pd = e => { const r = canvas.getBoundingClientRect(); launch(e.clientX - r.left, e.clientY - r.top); lastPointer = performance.now(); };
  stage.addEventListener('pointerdown', pd);

  let raf, last = performance.now(), next = reduce ? 1e9 : 0, t = 0;
  if (reduce) for (let k = 0; k < 3; k++) burst(W * (0.25 + k * 0.25), H * (0.3 + k % 2 * 0.15));   // a still: bursts already open
  else for (let k = 0; k < 3; k++) launch(W * (0.25 + k * 0.25), H * (0.2 + k % 2 * 0.15));
  function frame(now) {
    const dt = Math.min(0.033, (now - last) / 1000) * (reduce ? 0.08 : 1); last = now; t += dt;
    if (t > next && PARAMS.rate > 0) {
      launch(W * (0.15 + Math.random() * 0.7), H * (0.14 + Math.random() * 0.3));
      next = t + (0.3 + Math.random() * 0.6) / PARAMS.rate;
    }
    ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
    ctx.fillStyle = BG; ctx.fillRect(0, 0, W, H);
    ctx.globalCompositeOperation = 'lighter'; ctx.lineCap = 'round';
    const G = 260 * PARAMS.gravity;
    for (let i = flashes.length - 1; i >= 0; i--) {
      const f = flashes[i]; f.age += dt; if (f.age > 0.18) { flashes.splice(i, 1); continue; }
      const a = 1 - f.age / 0.18, g = ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, f.r);
      g.addColorStop(0, `hsla(${f.hue},80%,80%,${0.5 * a})`); g.addColorStop(1, `hsla(${f.hue},80%,50%,0)`);
      ctx.fillStyle = g; ctx.fillRect(f.x - f.r, f.y - f.r, f.r * 2, f.r * 2);
    }
    for (let i = parts.length - 1; i >= 0; i--) {
      const p = parts[i];
      p.age += dt;
      const dr = Math.pow(1 - (1 - p.drag) * PARAMS.drag, dt * 60);
      p.vx *= dr; p.vy = p.vy * dr + G * p.g * dt;
      p.x += p.vx * dt; p.y += p.vy * dt;
      p.tr.push(p.x, p.y); if (p.tr.length > p.tl * 2) p.tr.splice(0, 2);
      if (p.kind === 'rocket') {
        if (Math.random() < 0.7) spark(p.x, p.y, (Math.random() - 0.5) * 30, 20 + Math.random() * 30, { hue: 35, sat: 80, light: 60, life: 0.45, w: 1, drag: 0.94 });
        if (p.vy > -40) { burst(p.x, p.y); parts.splice(i, 1); continue; }
      } else if (p.kind === 'willow' && Math.random() < 0.25) {
        spark(p.x, p.y, 0, 0, { hue: 32, sat: 85, light: 45, life: 0.9, w: 0.8, drag: 0.9, g: 0.15 });
      }
      if (p.age > p.life) {
        if (p.kind === 'cross') for (let k = 0; k < 4; k++) { const a = k * 1.5708 + Math.random() * 0.4; const v = Math.min(W, H) * 0.14; spark(p.x, p.y, Math.cos(a) * v, Math.sin(a) * v, { hue: p.hue, light: 70, life: 0.8, w: 1.4 }); }
        if (p.kind === 'crackle') { flashes.push({ x: p.x, y: p.y, age: 0.1, r: 10, hue: 50 }); for (let k = 0; k < 3; k++) spark(p.x, p.y, (Math.random() - 0.5) * 140, (Math.random() - 0.5) * 140, { hue: 55, sat: 20, light: 92, life: 0.12, w: 1.2, drag: 0.85 }); }
        parts.splice(i, 1); continue;
      }
      const k = 1 - p.age / p.life;
      let a = p.kind === 'rocket' ? 1 : Math.min(1, k * 1.6);
      if (p.kind === 'crackle' || (p.kind === 'star' && k < 0.35)) a *= Math.random() < 0.5 ? 1 : 0.15;   // glitter strobe
      ctx.globalAlpha = a;
      const col = `hsl(${p.hue},${p.sat}%,${p.light + (1 - k) * -18}%)`, tr = p.tr;
      // tail: the stored positions as one faint polyline, then a bright head segment
      ctx.strokeStyle = col; ctx.lineWidth = p.w * 0.7; ctx.globalAlpha = a * 0.35;
      ctx.beginPath(); ctx.moveTo(tr[0], tr[1]); for (let j = 2; j < tr.length; j += 2) ctx.lineTo(tr[j], tr[j + 1]); ctx.stroke();
      const n = tr.length, h0 = Math.max(0, n - 6);
      ctx.globalAlpha = a; ctx.lineWidth = p.w;
      ctx.beginPath(); ctx.moveTo(tr[h0], tr[h0 + 1]); for (let j = h0 + 2; j < n; j += 2) ctx.lineTo(tr[j], tr[j + 1]); ctx.stroke();
      if (p.age < 0.15 && p.kind !== 'rocket') { ctx.globalAlpha = 0.7; ctx.strokeStyle = '#fff'; ctx.lineWidth = p.w * 0.6; ctx.stroke(); }  // white-hot at birth
    }
    if (parts.length > 6000) parts.splice(0, parts.length - 6000);
    raf = requestAnimationFrame(frame);
  }
  raf = requestAnimationFrame(frame);
  return () => { cancelAnimationFrame(raf); ro.disconnect(); stage.removeEventListener('pointerdown', pd); canvas.remove(); };
}
