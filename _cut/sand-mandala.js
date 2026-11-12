// Sand mandala: chalk guide lines first, then coloured sand poured grain by grain from eight funnels moving in step,
// from the centre outward, ring by ring: a lotus, a palace with four gates, flames, petals, a ring of fire. Every
// grain takes the colour of the design under it with a little variation, so the colours read as sand. When it is
// finished it is swept away (impermanence is the point): the whole picture is turned and drawn in on itself a little
// every frame, so the colours spiral into a mixed pile at the centre. Then a fresh cloth.
const PARAMS = { grains: 2200, symmetry: 8, speed: 1 };

export default function (stage) {
  const canvas = document.createElement('canvas');
  canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block;background:#3a1416';
  stage.append(canvas);
  const ctx = canvas.getContext('2d');
  let W = 1, H = 1, D = 1, R = 1, cx = 0, cy = 0, cloth = null, sand = null, sg = null, tmp = null, design = null, guide = null;
  const PAL = { saffron: [232, 163, 23], crimson: [178, 30, 40], white: [240, 236, 226], blue: [30, 62, 150], green: [24, 130, 82], gold: [240, 200, 60], black: [24, 20, 22], pink: [232, 120, 140], sky: [90, 170, 220], orange: [236, 104, 30] };
  // the design, as a colour at polar position (r 0..1 of the mandala's radius, angle a)
  function paint(r, a, x, y) {
    const S = Math.round(PARAMS.symmetry);
    if (r < 0.06) return r < 0.035 ? PAL.gold : PAL.crimson;
    if (r < 0.2) { const petal = 0.07 + 0.13 * Math.pow(Math.abs(Math.cos(a * S / 2)), 0.7); return r < petal ? (r > petal - 0.015 ? PAL.white : PAL.crimson) : PAL.saffron; }
    if (r < 0.235) { const k = (a / (Math.PI * 2)) * 32; return Math.hypot((k - Math.round(k)) * 0.04, r - 0.218) < 0.011 ? PAL.white : PAL.blue; }
    // the palace: a square with a T-shaped gate in each side; each quarter its direction's colour
    const ax = Math.abs(x), ay = Math.abs(y), m = Math.max(ax, ay);
    if (r < 0.54) {
      const gate = Math.min(ax, ay) < 0.07 && m > 0.33 && m < 0.44;
      if (m < 0.38 || gate) {
        if (m > 0.355 || (gate && (m > 0.42 || Math.min(ax, ay) > 0.055))) return PAL.gold;
        const q = ax > ay ? (x > 0 ? 0 : 2) : (y > 0 ? 1 : 3);
        return [PAL.white, PAL.saffron, PAL.crimson, PAL.green][q];
      }
      return m < 0.39 ? PAL.black : PAL.blue;
    }
    if (r < 0.6) { const k = ((a / (Math.PI * 2)) * 48) % 1, tri = (r - 0.54) / 0.06 < 1 - Math.abs(k - 0.5) * 2; return tri ? (Math.floor((a / (Math.PI * 2)) * 48) % 2 ? PAL.orange : PAL.gold) : PAL.crimson; }
    if (r < 0.68) { const k = ((a / (Math.PI * 2)) * 36) % 1, petal = 0.6 + 0.08 * Math.sin(k * Math.PI); return r < petal ? (Math.abs(k - 0.5) < 0.06 ? PAL.white : PAL.pink) : PAL.green; }
    if (r < 0.76) { const k = ((a / (Math.PI * 2)) * 24) % 1, mid = Math.abs(r - 0.72); return (Math.abs(k - 0.5) < 0.05 && mid < 0.03) || (mid < 0.006 && Math.abs(k - 0.5) < 0.2) ? PAL.gold : PAL.blue; }
    if (r < 0.84) { const flame = Math.sin(a * 60 + Math.sin(a * 15) * 2) * 0.018, k = (r - 0.76 + flame) / 0.08; return k < 0.33 ? PAL.gold : k < 0.66 ? PAL.orange : PAL.crimson; }
    if (r < 0.86) return PAL.black;
    return null;
  }
  const resize = () => {
    D = Math.min(devicePixelRatio, 2); W = stage.clientWidth || 1; H = stage.clientHeight || 1;
    canvas.width = Math.max(1, (W * D) | 0); canvas.height = Math.max(1, (H * D) | 0); ctx.setTransform(D, 0, 0, D, 0, 0);
    R = Math.min(W, H) * 0.47 / 0.86; cx = W / 2; cy = H / 2;
    // cloth: deep red, a woven texture
    cloth = document.createElement('canvas'); cloth.width = canvas.width; cloth.height = canvas.height; const c = cloth.getContext('2d'); c.setTransform(D, 0, 0, D, 0, 0);
    c.fillStyle = '#3a1416'; c.fillRect(0, 0, W, H);
    for (let y = 0; y < H; y += 2) { c.fillStyle = `rgba(0,0,0,${0.05 + Math.random() * 0.05})`; c.fillRect(0, y, W, 1); }
    for (let x = 0; x < W; x += 3) { c.fillStyle = `rgba(255,200,180,${Math.random() * 0.03})`; c.fillRect(x, 0, 1, H); }
    const v = c.createRadialGradient(cx, cy, R * 0.3, cx, cy, Math.max(W, H) * 0.7); v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,.45)'); c.fillStyle = v; c.fillRect(0, 0, W, H);
    // chalk guides: the rings and the palace square, thin and pale
    guide = document.createElement('canvas'); guide.width = canvas.width; guide.height = canvas.height; const g = guide.getContext('2d'); g.setTransform(D, 0, 0, D, 0, 0);
    g.strokeStyle = 'rgba(240,230,215,.35)'; g.lineWidth = 0.8;
    for (const k of [0.06, 0.2, 0.235, 0.54, 0.6, 0.68, 0.76, 0.84, 0.86]) { g.beginPath(); g.arc(cx, cy, k * R, 0, 7); g.stroke(); }
    g.strokeRect(cx - 0.38 * R, cy - 0.38 * R, 0.76 * R, 0.76 * R);
    for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2; g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx + Math.cos(a) * 0.86 * R, cy + Math.sin(a) * 0.86 * R); g.stroke(); }
    sand = document.createElement('canvas'); sand.width = canvas.width; sand.height = canvas.height; sg = sand.getContext('2d'); sg.setTransform(D, 0, 0, D, 0, 0);
    tmp = document.createElement('canvas'); tmp.width = canvas.width; tmp.height = canvas.height;
    restart();
  };
  let progress = 0, phase = 'build', phaseT = 0, theta = 0;
  function restart() { sg.setTransform(1, 0, 0, 1, 0, 0); sg.clearRect(0, 0, sand.width, sand.height); sg.setTransform(D, 0, 0, D, 0, 0); progress = 0; phase = 'build'; phaseT = 0; }
  let swept = [];
  function gather() {
    const img = sg.getImageData(0, 0, sand.width, sand.height).data, groups = new Map();
    for (let n = 0; n < 70000; n++) {
      const px = (Math.random() * sand.width) | 0, py = (Math.random() * sand.height) | 0, o = (py * sand.width + px) * 4;
      if (img[o + 3] < 200) continue;
      const key = `rgb(${img[o] & 0xf8},${img[o + 1] & 0xf8},${img[o + 2] & 0xf8})`;
      let gp = groups.get(key); if (!gp) groups.set(key, gp = { style: key, g: [] });
      const x = px / D - cx, y = py / D - cy;
      gp.g.push(Math.hypot(x, y) / R, Math.atan2(y, x), 0.8 + Math.random() * 1.6, Math.random() ** 2 * 0.12);   // radius, angle, speed, where it ends up in the pile
    }
    swept = [...groups.values()];
  }
  const ro = new ResizeObserver(resize); ro.observe(stage); resize();

  let raf, last = performance.now();
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000) * PARAMS.speed; last = now; phaseT += dt;
    if (phase === 'build') {
      // the funnels work outward; each grain lands near one of them, mirrored round the circle
      progress = Math.min(1, progress + dt / 21); theta += dt * 2.4;
      const S = Math.max(3, Math.round(PARAMS.symmetry)), band = 0.07, rc = 0.03 + progress * 0.85;
      const n = Math.round(PARAMS.grains), buckets = new Map();
      for (let i = 0; i < n; i++) {
        const k = i % S, a = theta * (0.8 + 0.4 * ((i >> 3) % 2)) + (k / S) * Math.PI * 2 + (Math.random() - 0.5) * 0.9, r = Math.max(0, rc - Math.random() * band);
        const x = Math.cos(a) * r, y = Math.sin(a) * r, col = paint(r, ((a % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2), x, y);
        if (!col) continue;
        const j = (Math.random() * 3) | 0, key = col.join() + j; let b = buckets.get(key); if (!b) buckets.set(key, b = { col, j, pts: [] });
        b.pts.push(cx + x * R, cy + y * R);
      }
      for (const { col, j, pts } of buckets.values()) {
        const f = [0.82, 1, 1.12][j]; sg.fillStyle = `rgb(${Math.min(255, col[0] * f) | 0},${Math.min(255, col[1] * f) | 0},${Math.min(255, col[2] * f) | 0})`;
        const s = Math.max(1, R / 300);
        for (let i = 0; i < pts.length; i += 2) sg.fillRect(pts[i], pts[i + 1], s, s);
      }
      if (progress >= 1) { phase = 'admire'; phaseT = 0; }
    } else if (phase === 'admire' && phaseT > 5) { phase = 'sweep'; phaseT = 0; gather(); }
    else if (phase === 'sweep') {
      // a brush comes in from the rim; every grain it passes is swept round and inward to the pile at the centre
      const brush = 1 - phaseT / 4.2;
      sg.setTransform(1, 0, 0, 1, 0, 0); sg.clearRect(0, 0, sand.width, sand.height); sg.setTransform(D, 0, 0, D, 0, 0);
      const sz = Math.max(1, R / 300);
      for (const b of swept) {
        sg.fillStyle = b.style;
        for (let i = 0; i < b.g.length; i += 4) {
          let r = b.g[i], a = b.g[i + 1]; const end = b.g[i + 3];
          if (r > brush * 0.86 && r > end) { const k = Math.min(1, dt * b.g[i + 2] * 0.55); r += (end - r) * k; a += dt * 3.2 * (1.1 - r) * b.g[i + 2] * 0.5; b.g[i] = r; b.g[i + 1] = a; }
          sg.fillRect(cx + Math.cos(a) * r * R, cy + Math.sin(a) * r * R, sz, sz);
        }
      }
      if (phaseT > 6.5) restart();
    }
    ctx.drawImage(cloth, 0, 0, W, H);
    if (phase === 'build') { ctx.globalAlpha = 1 - progress * 0.6; ctx.drawImage(guide, 0, 0, W, H); ctx.globalAlpha = 1; }
    ctx.drawImage(sand, 0, 0, W, H);
    if (phase === 'sweep' && phaseT > 5.5) { ctx.fillStyle = `rgba(58,20,22,${(phaseT - 5.5)})`; ctx.fillRect(0, 0, W, H); }
    raf = requestAnimationFrame(frame);
  }
  raf = requestAnimationFrame(frame);
  return () => { cancelAnimationFrame(raf); ro.disconnect(); canvas.remove(); };
}
