// Firefly sync: a forest of fireflies flashing at random slowly falls into one rhythm, with nobody in charge. Each
// one is a clock that flashes when it runs out and resets. Whenever it sees a neighbour flash, it nudges its own
// clock forward a little, and if that tips it over, it flashes right away (the Mirollo–Strogatz model of
// pulse-coupled oscillators). Small groups lock together, waves of flashes start to roll through the trees, and in
// the end the whole forest blinks as one. Fireflies sit between three layers of trees, near ones blurred to bokeh.
// Wave the pointer to startle the ones nearby and break the spell.
const PARAMS = { fireflies: 700, coupling: 0.07, spread: 0.05 };

export default function (stage) {
  const canvas = document.createElement('canvas');
  canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block;background:#04070a';
  stage.append(canvas);
  const ctx = canvas.getContext('2d');
  let W = 1, H = 1, layers = [];
  const rnd = (a, b) => a + Math.random() * (b - a);
  // three layers of trees, painted once: far ones misty blue, near ones black
  function paintForest() {
    const d = Math.min(devicePixelRatio, 2);
    layers = [0, 1, 2].map(L => {
      const c = document.createElement('canvas'); c.width = Math.max(1, (W * d) | 0); c.height = Math.max(1, (H * d) | 0);
      const g = c.getContext('2d'); g.setTransform(d, 0, 0, d, 0, 0);
      const tone = ['#14262f', '#0a161c', '#020405'][L], n = [16, 9, 4][L];
      g.fillStyle = tone;
      for (let i = 0; i < n; i++) {
        const x = (i + rnd(0.1, 0.9)) * (W / n), w = [W * 0.01, W * 0.022, W * 0.05][L] * rnd(0.7, 1.3), top = -H * 0.1;
        g.beginPath(); g.moveTo(x - w * 0.5, H); g.lineTo(x - w * 0.36, top); g.lineTo(x + w * 0.36, top); g.lineTo(x + w * 0.5, H); g.fill();
        for (let b = 0; b < 3; b++) {                             // a few branches
          const y = H * rnd(0.15, 0.6), s = Math.random() < 0.5 ? -1 : 1, len = w * rnd(2, 5);
          g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + s * len * 0.6, y - len * 0.3, x + s * len, y - len * 0.5); g.lineWidth = w * 0.18; g.strokeStyle = tone; g.stroke();
        }
      }
      if (L === 2) { g.fillStyle = '#020304'; for (let x = 0; x < W; x += 3) { const h = H * rnd(0.02, 0.07); g.fillRect(x, H - h, 1.6, h); } }   // grass
      return c;
    });
  }
  const resize = () => { const d = Math.min(devicePixelRatio, 2); W = stage.clientWidth || 1; H = stage.clientHeight || 1; canvas.width = Math.max(1, (W * d) | 0); canvas.height = Math.max(1, (H * d) | 0); ctx.setTransform(d, 0, 0, d, 0, 0); paintForest(); };
  const ro = new ResizeObserver(resize); ro.observe(stage); resize();

  // a soft yellow-green glow, stamped for every flash
  const glow = document.createElement('canvas'); glow.width = glow.height = 64;
  { const g = glow.getContext('2d'), r = g.createRadialGradient(32, 32, 0, 32, 32, 32); r.addColorStop(0, 'rgba(250,255,200,1)'); r.addColorStop(0.18, 'rgba(200,255,90,.75)'); r.addColorStop(0.5, 'rgba(120,220,60,.18)'); r.addColorStop(1, 'rgba(80,180,40,0)'); g.fillStyle = r; g.fillRect(0, 0, 64, 64); }
  const disc = document.createElement('canvas'); disc.width = disc.height = 64;
  { const g = disc.getContext('2d'), r = g.createRadialGradient(32, 32, 20, 32, 32, 32); r.addColorStop(0, 'rgba(200,255,110,.5)'); r.addColorStop(0.85, 'rgba(210,255,120,.62)'); r.addColorStop(1, 'rgba(190,255,100,0)'); g.fillStyle = r; g.beginPath(); g.arc(32, 32, 32, 0, 7); g.fill(); }

  const N = Math.max(50, Math.round(PARAMS.fireflies));
  // each firefly: position (x, y in 0..1 of the stage, depth 0 far .. 1 near), its clock, its own natural period
  const F = Array.from({ length: N }, () => { const z = Math.random() ** 2.2; return { x: Math.random(), y: rnd(0.25, 0.92), z, layer: z < 0.4 ? 0 : z < 0.8 ? 1 : 2, c: Math.random(), T: 1 + rnd(-1, 1) * PARAMS.spread, since: 9, vx: rnd(-1, 1), vy: rnd(-1, 1) }; });
  const ptr = { x: 0, y: 0, on: false };
  const move = e => { const r = canvas.getBoundingClientRect(); ptr.x = (e.clientX - r.left) / r.width; ptr.y = (e.clientY - r.top) / r.height; ptr.on = true; };
  const leave = () => { ptr.on = false; };
  canvas.addEventListener('pointermove', move); canvas.addEventListener('pointerleave', leave);

  let raf, last = performance.now(), time = 0, syncedFor = 0;
  const SEE = 0.2;                                               // how far a firefly can see a flash (stage widths)
  function frame(now) {
    const dt = Math.min(0.04, (now - last) / 1000); last = now; time += dt;
    // advance every clock; collect who fires, then let each flash nudge the neighbours who see it (which can cascade)
    const queue = [];
    for (const f of F) {
      f.c += dt / f.T; f.since += dt;
      f.x += f.vx * dt * 0.004; f.y += f.vy * dt * 0.004; f.vx += rnd(-1, 1) * dt * 2; f.vy += rnd(-1, 1) * dt * 2; f.vx *= 0.99; f.vy *= 0.99;
      if (f.x < 0 || f.x > 1) f.vx = -f.vx; if (f.y < 0.2 || f.y > 0.95) f.vy = -f.vy;
      if (ptr.on && Math.hypot(f.x - ptr.x, (f.y - ptr.y) * H / W) < 0.08) f.c = Math.random();   // startled
      if (f.c >= 1) { f.c = 0; f.since = 0; queue.push(f); }
    }
    for (let q = 0; q < queue.length; q++) {
      const s = queue[q];
      for (const f of F) {
        if (f === s || f.since < 0.12 || f.c < 0.18) continue;    // a refractory moment just after flashing
        const d = Math.hypot(f.x - s.x, (f.y - s.y) * H / W, (f.z - s.z) * 0.6);
        if (d > SEE) continue;
        f.c += PARAMS.coupling * (1 - d / SEE);
        if (f.c >= 1) { f.c = 0; f.since = 0; queue.push(f); }
      }
    }
    // once the forest has blinked as one for a while, a gust scrambles a patch of it and the story starts again
    const lit = F.reduce((a, f) => a + (f.since < 0.15 ? 1 : 0), 0) / N;
    syncedFor = lit > 0.6 ? syncedFor + 1 : syncedFor;
    if (syncedFor > 110) { syncedFor = 0; const cx = Math.random(); for (const f of F) if (Math.abs(f.x - cx) < 0.35) f.c = Math.random(); }

    // draw: night sky glow, then each tree layer with its fireflies behind the next layer
    const sky = ctx.createLinearGradient(0, 0, 0, H); sky.addColorStop(0, '#1b2f3b'); sky.addColorStop(0.55, '#14252e'); sky.addColorStop(1, '#1a2c28');   // moonlit haze between the trunks
    ctx.globalCompositeOperation = 'source-over'; ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H);
    const mist = ctx.createLinearGradient(0, H * 0.55, 0, H); mist.addColorStop(0, 'rgba(60,90,90,0)'); mist.addColorStop(1, 'rgba(60,90,90,.18)');
    for (let L = 0; L < 3; L++) {
      ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
      ctx.drawImage(layers[L], 0, 0, W, H);
      if (L === 0) { ctx.fillStyle = mist; ctx.fillRect(0, 0, W, H); }
      ctx.globalCompositeOperation = 'lighter';
      for (const f of F) {
        if (f.layer !== L) continue;
        const flash = f.since < 0.05 ? f.since / 0.05 : Math.exp(-(f.since - 0.05) / 0.22), ember = 0;
        const b = Math.max(ember, flash); if (b < 0.02) continue;
        const sx = f.x * W, sy = f.y * H, size = (1.3 + f.z * f.z * 6) * Math.min(W, H) / 560;
        const blur = Math.max(0, f.z - 0.72) * 70 * Math.min(W, H) / 560;   // depth of field: the nearest go soft
        if (blur > 6 && flash > 0.05) { const r = size + blur; ctx.globalAlpha = Math.min(1, b * 0.9 * (size * 4) / r); ctx.drawImage(disc, sx - r, sy - r, r * 2, r * 2); }
        else { const r = size * 4.5; ctx.globalAlpha = b; ctx.drawImage(glow, sx - r, sy - r, r * 2, r * 2); }
      }
    }
    // when many flash at once, the air itself lights up a little
    ctx.globalAlpha = Math.min(0.2, lit * 0.35); ctx.fillStyle = '#4f7a2c'; ctx.fillRect(0, 0, W, H);
    ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
    raf = requestAnimationFrame(frame);
  }
  raf = requestAnimationFrame(frame);
  return () => { cancelAnimationFrame(raf); ro.disconnect(); canvas.removeEventListener('pointermove', move); canvas.removeEventListener('pointerleave', leave); canvas.remove(); };
}
