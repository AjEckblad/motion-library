// Calligraphy: a brush writes 永 (eternity), the character students practise because it holds the eight basic
// strokes. The brush is forty bristles in a teardrop footprint that turns with the stroke and grows with pressure.
// Each bristle carries its own ink and lays it down as it moves, so as a stroke runs long the outer bristles run dry
// first and leave the streaked "flying white" (飛白). Where the brush slows, at a turn or the end of a stroke, ink
// pools darker; a quick flick lifts it to a sharp point. Then the seal goes on, and a fresh sheet.
const PARAMS = { pressure: 1, ink: 1, speed: 1 };

export default function (stage) {
  const canvas = document.createElement('canvas');
  canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block;background:#0f0d14';
  stage.append(canvas);
  const ctx = canvas.getContext('2d');
  let W = 1, H = 1, paper = null, ink = null, ig = null, box = { x: 0, y: 0, s: 1 };
  const resize = () => {
    const d = Math.min(devicePixelRatio, 2); W = stage.clientWidth || 1; H = stage.clientHeight || 1;
    canvas.width = Math.max(1, (W * d) | 0); canvas.height = Math.max(1, (H * d) | 0); ctx.setTransform(d, 0, 0, d, 0, 0);
    // dark indigo sutra paper (written in gold, as on the old illuminated sutras): a little uneven, with fibres
    paper = document.createElement('canvas'); paper.width = canvas.width; paper.height = canvas.height;
    const g = paper.getContext('2d'); g.setTransform(d, 0, 0, d, 0, 0); g.fillStyle = '#0f0d14'; g.fillRect(0, 0, W, H);
    for (let i = 0; i < W * H / 40; i++) { g.fillStyle = `rgba(${Math.random() < 0.5 ? '0,0,0' : '170,160,200'},${Math.random() * 0.06})`; g.fillRect(Math.random() * W, Math.random() * H, 1 + Math.random() * 2, 1 + Math.random() * 2); }
    g.lineWidth = 0.6; for (let i = 0; i < W * H / 900; i++) { const x = Math.random() * W, y = Math.random() * H, a = Math.random() * 6.28, l = 6 + Math.random() * 18; g.strokeStyle = `rgba(150,140,185,${0.04 + Math.random() * 0.05})`; g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + Math.cos(a + 0.5) * l * 0.5, y + Math.sin(a + 0.5) * l * 0.5, x + Math.cos(a) * l, y + Math.sin(a) * l); g.stroke(); }
    ink = document.createElement('canvas'); ink.width = canvas.width; ink.height = canvas.height; ig = ink.getContext('2d'); ig.setTransform(d, 0, 0, d, 0, 0);
    const s = Math.min(W, H) * 0.78; box = { x: (W - s) / 2 - s * 0.05, y: (H - s) / 2, s };
    restart();
  };

  // 永, stroke by stroke: points are [x, y, pressure] in a unit square, y downward
  const STROKES = [
    [[0.46, 0.06, 0.25], [0.5, 0.11, 0.85], [0.54, 0.17, 0.75], [0.53, 0.19, 0.2]],                                               // 點 the dot
    [[0.31, 0.29, 0.5], [0.42, 0.275, 0.55], [0.53, 0.265, 0.6], [0.56, 0.3, 0.95], [0.545, 0.45, 0.7], [0.545, 0.68, 0.72], [0.55, 0.86, 0.85], [0.52, 0.9, 0.7], [0.44, 0.84, 0.05]],   // 橫折鉤 across, down, hook
    [[0.17, 0.46, 0.45], [0.3, 0.45, 0.5], [0.4, 0.44, 0.7], [0.36, 0.52, 0.65], [0.27, 0.63, 0.5], [0.12, 0.76, 0.06]],            // 橫撇 across, then sweep down-left
    [[0.81, 0.36, 0.7], [0.74, 0.43, 0.6], [0.65, 0.5, 0.35], [0.61, 0.53, 0.08]],                                                   // 撇 the short throw
    [[0.6, 0.5, 0.35], [0.68, 0.6, 0.55], [0.77, 0.72, 0.85], [0.86, 0.8, 1], [0.92, 0.82, 0.55], [0.99, 0.83, 0.04]],                 // 捺 the long press and release
  ];
  const cat = (a, b, c, d, t) => 0.5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t * t + (-a + 3 * b - 3 * c + d) * t * t * t);
  // sample each stroke densely, with a little hand wobble so no two sheets are the same
  let paths = [];
  function prepare() {
    paths = STROKES.map(k => {
      const pts = k.map(([x, y, p]) => [x + (Math.random() - 0.5) * 0.012, y + (Math.random() - 0.5) * 0.012, p]);
      const out = [];
      for (let i = 0; i < pts.length - 1; i++) {
        const a = pts[Math.max(0, i - 1)], b = pts[i], c = pts[i + 1], d = pts[Math.min(pts.length - 1, i + 2)];
        for (let s = 0; s < 24; s++) { const t = s / 24; out.push([cat(a[0], b[0], c[0], d[0], t), cat(a[1], b[1], c[1], d[1], t), Math.max(0.02, cat(a[2], b[2], c[2], d[2], t))]); }
      }
      out.push(pts[pts.length - 1]);
      let L = 0; for (let i = 1; i < out.length; i++) { L += Math.hypot(out[i][0] - out[i - 1][0], out[i][1] - out[i - 1][1]); out[i].push(L); } out[0].push(0);
      return out;
    });
  }
  const NB = 40;
  const bristles = Array.from({ length: NB }, (_, i) => {
    const a = Math.random() * 6.283, r = Math.sqrt(Math.random());
    return { ox: Math.cos(a) * r, oy: Math.sin(a) * r, edge: r, ink: 1, px: 0, py: 0, on: false, w: 0.7 + Math.random() * 0.6 };
  });
  let si = 0, sd = 0, state = 'write', stateT = 0, seal = 0;
  function restart() { ig.clearRect(0, 0, W, H); prepare(); si = 0; sd = 0; state = 'write'; stateT = 0; seal = 0; dip(); }
  function dip() { for (const b of bristles) { b.ink = PARAMS.ink * (1.1 - b.edge * 0.35) * (0.85 + Math.random() * 0.3); b.on = false; } }
  const ro = new ResizeObserver(resize); ro.observe(stage); resize();

  // where the brush is along the current stroke, at arc length s
  const at = (path, s) => {
    let i = 1; while (i < path.length - 1 && path[i][3] < s) i++;
    const a = path[i - 1], b = path[i], k = Math.min(1, Math.max(0, (s - a[3]) / Math.max(1e-6, b[3] - a[3])));
    return [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k, Math.atan2(b[1] - a[1], b[0] - a[0])];
  };
  function brushTo(x, y, p, dir, speed) {
    const R = box.s * 0.068 * p * PARAMS.pressure, X = box.x + x * box.s, Y = box.y + y * box.s;
    const c = Math.cos(dir), s = Math.sin(dir), slow = Math.min(2.2, 0.35 / Math.max(0.05, speed));   // slow brush: more ink soaks in
    for (const b of bristles) {
      // the footprint is a teardrop trailing behind the tip: long along the stroke, as wide as the pressure
      const along = b.ox * R * 0.75 - R * 0.25, across = b.oy * R;
      const bx = X + c * along - s * across, by = Y + s * along + c * across;
      if (b.on && b.ink > 0.02) {
        const dist = Math.hypot(bx - b.px, by - b.py), a = Math.min(0.9, b.ink * 0.5 * (0.6 + 0.4 * slow));
        ig.strokeStyle = `rgba(240,214,150,${a})`; ig.lineWidth = Math.max(0.8, R * 0.2 * b.w);
        ig.beginPath(); ig.moveTo(b.px, b.py); ig.lineTo(bx, by); ig.stroke();
        if (b.ink > 0.4 && Math.random() < 0.15) { ig.fillStyle = `rgba(240,214,150,${0.04 * slow})`; ig.beginPath(); ig.arc(bx, by, R * 0.35, 0, 7); ig.fill(); }   // wet ink feathers into the paper
        b.ink -= dist / box.s * (0.45 + b.edge * 1.5) * (0.8 + Math.random() * 0.4);   // edge bristles run dry first
      }
      b.px = bx; b.py = by; b.on = true;
    }
  }

  let raf, last = performance.now();
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000) * PARAMS.speed; last = now; stateT += dt;
    if (state === 'write') {
      const path = paths[si], L = path[path.length - 1][3];
      // speed along the stroke: settle in slowly, run through the middle, slow again into the end (except flicks)
      const u = sd / L, flick = path[path.length - 1][2] < 0.1;
      const v = 0.35 * (0.35 + Math.sin(Math.PI * Math.min(1, u * 1.05)) * (flick && u > 0.7 ? 2.6 : 1.4));
      const steps = 6, ds = (v * dt) / steps;
      for (let k = 0; k < steps && sd < L; k++) { sd = Math.min(L, sd + ds); const [x, y, p, dir] = at(path, sd); brushTo(x, y, p, dir, v); }
      if (sd >= L) { si++; sd = 0; stateT = 0; for (const b of bristles) b.on = false; if (si >= paths.length) { state = 'seal'; } else { state = 'lift'; dip(); } }   // back to the inkstone between strokes
    } else if (state === 'lift' && stateT > 0.32) { state = 'write'; stateT = 0; }
    else if (state === 'seal') { seal = Math.min(1, stateT / 0.25); if (stateT > 4.2) { state = 'fade'; stateT = 0; } }
    else if (state === 'fade' && stateT > 1) restart();

    ctx.globalAlpha = 1; ctx.drawImage(paper, 0, 0, W, H);
    ctx.globalAlpha = state === 'fade' ? 1 - stateT : 1; ctx.drawImage(ink, 0, 0, W, H);
    if (seal > 0) {                                                // the red seal, pressed in at the lower right
      const s = box.s * 0.1, x = box.x + box.s * 1.13, y = box.y + box.s * 0.95, k = 1 + (1 - seal) * 0.25;
      ctx.save(); ctx.translate(x, y); ctx.scale(k, k); ctx.globalAlpha *= seal * 0.92;
      ctx.fillStyle = '#d8382a'; ctx.beginPath(); ctx.roundRect(-s / 2, -s / 2, s, s, s * 0.08); ctx.fill();
      ctx.strokeStyle = '#0f0d14'; ctx.lineWidth = s * 0.07; ctx.lineCap = 'square';
      const g = [[-0.3, -0.3, 0.3, -0.3], [0, -0.3, 0, 0.32], [-0.3, 0, 0.3, 0], [-0.3, 0.32, -0.05, 0.12], [0.3, 0.32, 0.05, 0.12]];   // carved lines
      ctx.beginPath(); for (const [a, b, c, d] of g) { ctx.moveTo(a * s, b * s); ctx.lineTo(c * s, d * s); } ctx.stroke();
      ctx.restore();
    }
    ctx.globalAlpha = 1;
    raf = requestAnimationFrame(frame);
  }
  raf = requestAnimationFrame(frame);
  return () => { cancelAnimationFrame(raf); ro.disconnect(); canvas.remove(); };
}
