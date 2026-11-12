// Scramble crossing in the rain, from above: umbrellas wait on four corners while the cars go, then every light
// turns to walk at once and the crowds pour across in all directions, diagonals included, and stream through each
// other. Each walker follows the social force model: a pull toward where they're going and a soft push away from
// everyone near them. Nobody plans lanes, yet lanes form: people fall in behind others heading their way. The
// asphalt is wet, so signs and headlights smear across it, and rain rings it.
const PARAMS = { people: 260, rain: 1, pace: 1 };

export default function (stage) {
  const canvas = document.createElement('canvas');
  canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block;background:#101216';
  stage.append(canvas);
  const ctx = canvas.getContext('2d');
  let W = 1, H = 1, S = 1, cx = 0, cy = 0, ground = null;
  // the world, in metres: the crossing is a 24 m square of road, with corners of pavement beyond it
  const R = 12, PAVE = 26;
  const toX = x => cx + x * S, toY = y => cy + y * S;
  function paintGround() {
    ground = document.createElement('canvas'); ground.width = canvas.width; ground.height = canvas.height;
    const g = ground.getContext('2d'), d = canvas.width / W; g.setTransform(d, 0, 0, d, 0, 0);
    g.fillStyle = '#2a2c31'; g.fillRect(0, 0, W, H);                         // pavement
    g.fillStyle = '#121418'; g.fillRect(toX(-R), 0, 2 * R * S, H); g.fillRect(0, toY(-R), W, 2 * R * S);   // the two roads
    for (let i = 0; i < 4000; i++) { g.fillStyle = `rgba(255,255,255,${Math.random() * 0.025})`; g.fillRect(Math.random() * W, Math.random() * H, 1 + Math.random() * 2, 1); }
    // zebra crossings on all four sides, and the two diagonals
    g.fillStyle = 'rgba(225,228,232,.78)';
    const zebra = (x0, y0, x1, y1, w) => {
      const len = Math.hypot(x1 - x0, y1 - y0), ux = (x1 - x0) / len, uy = (y1 - y0) / len, n = Math.floor(len / 1.1);
      for (let i = 0; i < n; i++) { const x = x0 + ux * (i + 0.5) * 1.1, y = y0 + uy * (i + 0.5) * 1.1; g.save(); g.translate(toX(x), toY(y)); g.rotate(Math.atan2(uy, ux)); g.fillRect(-0.28 * S, -w / 2 * S, 0.56 * S, w * S); g.restore(); }
    };
    zebra(-R + 1, -R - 2.2, R - 1, -R - 2.2, 3.2); zebra(-R + 1, R + 2.2, R - 1, R + 2.2, 3.2); zebra(-R - 2.2, -R + 1, -R - 2.2, R - 1, 3.2); zebra(R + 2.2, -R + 1, R + 2.2, R - 1, 3.2);
    g.globalAlpha = 0.6; zebra(-R + 2, -R + 2, R - 2, R - 2, 3); zebra(R - 2, -R + 2, -R + 2, R - 2, 3); g.globalAlpha = 1;
    // neon signs along the pavement edges, and their smeared reflections on the wet road
    const NEON = ['#ff3d7f', '#38e1ff', '#ffd23f', '#9b5cff', '#3dff9e'];
    for (let i = 0; i < 18; i++) {
      const c = NEON[i % NEON.length], side = i % 4, k = ((i * 0.6180339) % 1) * 2 - 1, edge = PAVE * 1.1;
      const x = side < 2 ? k * edge : (side === 2 ? -1 : 1) * edge, y = side < 2 ? (side === 0 ? -1 : 1) * edge : k * edge;
      const rg = g.createRadialGradient(toX(x), toY(y), 0, toX(x), toY(y), 9 * S); rg.addColorStop(0, c + '30'); rg.addColorStop(1, c + '00');
      g.fillStyle = rg; g.fillRect(toX(x) - 9 * S, toY(y) - 9 * S, 18 * S, 18 * S);
    }
  }
  const resize = () => {
    const d = Math.min(devicePixelRatio, 2); W = stage.clientWidth || 1; H = stage.clientHeight || 1;
    canvas.width = Math.max(1, (W * d) | 0); canvas.height = Math.max(1, (H * d) | 0); ctx.setTransform(d, 0, 0, d, 0, 0);
    S = Math.min(W, H) / (2 * R + 13); cx = W / 2; cy = H / 2; paintGround();
  };
  const ro = new ResizeObserver(resize); ro.observe(stage); resize();

  // umbrellas from above: canopy panels with ribs, a few clear plastic ones, one sprite per colour
  const COLS = ['#16181c', '#1d2230', '#26262a', '#0f1a2a', '#3b0f19', '#c8263a', '#f2b632', '#2a9d8f', '#e9e5dc', 'clear', 'clear', 'clear', '#16181c', '#3c3f46'];
  const umbrella = c => {
    const s = document.createElement('canvas'), n = 64; s.width = s.height = n; const g = s.getContext('2d'), r = n / 2 - 2;
    const clear = c === 'clear';
    for (let k = 0; k < 8; k++) {                                // eight panels, alternately lit
      const a0 = (k / 8) * Math.PI * 2, a1 = ((k + 1) / 8) * Math.PI * 2;
      g.beginPath(); g.moveTo(n / 2, n / 2); g.arc(n / 2, n / 2, r, a0, a1); g.closePath();
      g.fillStyle = clear ? `rgba(205,225,240,${k % 2 ? 0.28 : 0.38})` : c; g.fill();
      if (!clear) { g.fillStyle = `rgba(255,255,255,${k % 2 ? 0.04 : 0.12})`; g.fill(); }
    }
    g.strokeStyle = clear ? 'rgba(235,245,255,.6)' : 'rgba(0,0,0,.35)'; g.lineWidth = 1.2;
    for (let k = 0; k < 8; k++) { const a = (k / 8) * Math.PI * 2; g.beginPath(); g.moveTo(n / 2, n / 2); g.lineTo(n / 2 + Math.cos(a) * r, n / 2 + Math.sin(a) * r); g.stroke(); }
    g.beginPath(); g.arc(n / 2, n / 2, r, 0, 7); g.stroke();
    const hl = g.createRadialGradient(n * 0.38, n * 0.36, 0, n / 2, n / 2, r); hl.addColorStop(0, 'rgba(255,255,255,.22)'); hl.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = hl; g.beginPath(); g.arc(n / 2, n / 2, r, 0, 7); g.fill();
    g.fillStyle = clear ? '#d8e6f0' : '#c9c9c9'; g.beginPath(); g.arc(n / 2, n / 2, 2.2, 0, 7); g.fill();
    return s;
  };
  const SPR = COLS.map(umbrella);

  // the four corners where people wait (centre of each waiting area)
  const CORNERS = [[-R - 3.5, -R - 3.5], [R + 3.5, -R - 3.5], [R + 3.5, R + 3.5], [-R - 3.5, R + 3.5]];
  const spotIn = c => { const [x, y] = CORNERS[c]; return [x + Math.sign(x) * Math.random() * 7 - Math.sign(x) * 1, y + Math.sign(y) * Math.random() * 7 - Math.sign(y) * 1]; };
  const N = Math.max(40, Math.round(PARAMS.people));
  const P = Array.from({ length: N }, (_, i) => { const c = i % 4, [x, y] = spotIn(c); return { x, y, vx: 0, vy: 0, c, gx: x, gy: y, v0: 1.6 + Math.random() * 0.7, spr: (Math.random() * SPR.length) | 0, rot: Math.random() * 6.28, r: 0.36 + Math.random() * 0.1 }; });
  // cars, only while the cars have the green
  const cars = [];
  const CYCLE = 26, CARS = 11;                                   // seconds per cycle; the first 11 belong to the cars
  let lastPhase = '';

  const drops = Array.from({ length: 220 }, () => ({ x: Math.random(), y: Math.random(), s: 0.7 + Math.random() * 0.6 }));
  const rings = [];
  let raf, last = performance.now(), time = 0, grid = new Map();
  function frame(now) {
    const dt = Math.min(0.04, (now - last) / 1000) * PARAMS.pace; last = now; time += dt;
    const ct = time % CYCLE, phase = ct < CARS ? 'cars' : ct < CYCLE - 3 ? 'walk' : 'flash';
    if (phase === 'walk' && lastPhase === 'cars') for (const p of P) { let d = (p.c + 1 + ((Math.random() * 3) | 0)) % 4; p.c = d; [p.gx, p.gy] = spotIn(d); }   // everyone picks another corner
    if (phase === 'cars' && lastPhase !== 'cars') cars.length = 0;
    lastPhase = phase;
    // cars: north–south for the first half of their green, then east–west
    if (phase === 'cars' && ct < CARS - 3 && Math.random() < dt * 2.4) {   // the last cars clear the box before the walk
      const ns = ct < CARS / 2, lane = (Math.random() < 0.5 ? -1 : 1), off = lane * (Math.random() < 0.5 ? 3 : 7.5);
      cars.push(ns ? { x: off, y: -lane * (PAVE + 10), vx: 0, vy: lane * 15, ns } : { x: lane * (PAVE + 10), y: off, vx: -lane * 15, vy: 0, ns });
    }
    for (const c of cars) { c.x += c.vx * dt; c.y += c.vy * dt; }
    // walkers: the social force model, neighbours found through a 2 m grid
    grid.clear();
    for (let i = 0; i < N; i++) { const k = Math.floor(P[i].x / 2) * 1000 + Math.floor(P[i].y / 2); let a = grid.get(k); if (!a) grid.set(k, a = []); a.push(i); }
    for (let i = 0; i < N; i++) {
      const p = P[i];
      let dx = p.gx - p.x, dy = p.gy - p.y; const dist = Math.hypot(dx, dy) + 1e-6, hurry = phase === 'flash' ? 1.5 : 1;
      const want = dist > 0.6 ? p.v0 * hurry : 0;
      let ax = ((dx / dist) * want - p.vx) / 0.5, ay = ((dy / dist) * want - p.vy) / 0.5;
      const gx = Math.floor(p.x / 2), gy = Math.floor(p.y / 2);
      for (let ox = -1; ox <= 1; ox++) for (let oy = -1; oy <= 1; oy++) {
        const a = grid.get((gx + ox) * 1000 + gy + oy); if (!a) continue;
        for (const j of a) {
          if (j === i) continue;
          const q = P[j], ex = p.x - q.x, ey = p.y - q.y, d = Math.hypot(ex, ey) + 1e-6, rr = p.r + q.r;
          const f = 2.6 * Math.exp((rr - d) / 0.35);
          // people look ahead: someone in front pushes harder than someone behind
          const ahead = ((-ex) * p.vx + (-ey) * p.vy) / (d * (Math.hypot(p.vx, p.vy) + 1e-6)), wgt = 0.45 + 0.55 * Math.max(0, ahead);
          ax += (ex / d) * f * wgt; ay += (ey / d) * f * wgt;
          if (d < rr) { const push = (rr - d) * 0.5; p.x += (ex / d) * push; p.y += (ey / d) * push; }
        }
      }
      p.vx += ax * dt; p.vy += ay * dt;
      const sp = Math.hypot(p.vx, p.vy), mx = p.v0 * 1.4; if (sp > mx) { p.vx *= mx / sp; p.vy *= mx / sp; }
      p.x += p.vx * dt; p.y += p.vy * dt;
      if (sp > 0.2) { let da = Math.atan2(p.vy, p.vx) - p.rot; da -= Math.PI * 2 * Math.round(da / (Math.PI * 2)); p.rot += da * Math.min(1, dt * 2); }
    }
    // draw: wet ground, headlight smears, then umbrellas, then the rain
    ctx.globalCompositeOperation = 'source-over'; ctx.drawImage(ground, 0, 0, W, H);
    for (const c of cars) {
      const x = toX(c.x), y = toY(c.y), ang = Math.atan2(c.vy, c.vx);
      ctx.save(); ctx.translate(x, y); ctx.rotate(ang);
      const beam = ctx.createLinearGradient(2.2 * S, 0, 14 * S, 0); beam.addColorStop(0, 'rgba(255,245,220,.28)'); beam.addColorStop(1, 'rgba(255,245,220,0)');
      ctx.fillStyle = beam; ctx.beginPath(); ctx.moveTo(2.2 * S, -0.8 * S); ctx.lineTo(14 * S, -3 * S); ctx.lineTo(14 * S, 3 * S); ctx.lineTo(2.2 * S, 0.8 * S); ctx.fill();
      ctx.fillStyle = '#0b0c0f'; ctx.beginPath(); ctx.roundRect(-2.2 * S, -0.95 * S, 4.4 * S, 1.9 * S, 0.5 * S); ctx.fill();
      ctx.fillStyle = 'rgba(160,180,200,.18)'; ctx.fillRect(-0.6 * S, -0.8 * S, 1.6 * S, 1.6 * S);
      ctx.fillStyle = '#ff3b3b'; ctx.fillRect(-2.25 * S, -0.8 * S, 0.18 * S, 0.4 * S); ctx.fillRect(-2.25 * S, 0.4 * S, 0.18 * S, 0.4 * S);
      ctx.restore();
    }
    for (const p of P) {
      const r = p.r * 1.45 * S;
      ctx.fillStyle = 'rgba(0,0,0,.28)'; ctx.beginPath(); ctx.arc(toX(p.x) + r * 0.18, toY(p.y) + r * 0.22, r * 0.95, 0, 7); ctx.fill();   // shadow
      ctx.save(); ctx.translate(toX(p.x), toY(p.y)); ctx.rotate(p.rot + Math.sin(time * 6 + p.v0 * 9) * 0.06 * Math.min(1, Math.hypot(p.vx, p.vy)));
      ctx.drawImage(SPR[p.spr], -r, -r, r * 2, r * 2); ctx.restore();
    }
    // the walk signal
    const lamp = phase === 'walk' ? '#3dff9e' : phase === 'flash' ? (Math.floor(time * 4) % 2 ? '#3dff9e' : '#1a2a22') : '#ff4d4d';
    for (const [x, y] of CORNERS) { ctx.fillStyle = lamp; ctx.shadowColor = lamp; ctx.shadowBlur = 10; ctx.beginPath(); ctx.arc(toX(x * 0.82), toY(y * 0.82), Math.max(2.5, S * 0.35), 0, 7); ctx.fill(); }
    ctx.shadowBlur = 0;
    // rain: streaks, and rings where drops land
    const rate = PARAMS.rain;
    ctx.strokeStyle = 'rgba(200,215,235,.22)'; ctx.lineWidth = 1; ctx.beginPath();
    for (const d of drops) { d.y += dt * 2.2 * d.s; if (d.y > 1) { d.y -= 1; d.x = Math.random(); if (Math.random() < rate) rings.push({ x: d.x * W, y: Math.random() * H, t: 0 }); } if (Math.random() > rate) continue; const x = d.x * W + d.y * 18, y = d.y * H; ctx.moveTo(x, y); ctx.lineTo(x + 2.2, y + 11 * d.s); }
    ctx.stroke();
    ctx.lineWidth = 1;
    for (let i = rings.length - 1; i >= 0; i--) { const r = rings[i]; r.t += dt; if (r.t > 0.5) { rings.splice(i, 1); continue; } ctx.strokeStyle = `rgba(210,225,240,${0.35 * (1 - r.t / 0.5)})`; ctx.beginPath(); ctx.ellipse(r.x, r.y, 1 + r.t * 14, (1 + r.t * 14) * 0.6, 0, 0, 7); ctx.stroke(); }
    raf = requestAnimationFrame(frame);
  }
  raf = requestAnimationFrame(frame);
  return () => { cancelAnimationFrame(raf); ro.disconnect(); canvas.remove(); };
}
