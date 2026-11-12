// Phyllotaxis: how a sunflower packs its seeds. Each new seed is born at the centre, turned by a fixed angle from
// the one before, and pushed outward as later seeds arrive (radius ∝ √age, so the area per seed stays constant).
// At the golden angle, 137.508°, no two seeds ever line up, and the packing is perfect. Colouring every seed by
// its index mod 21 lights up the 21 spirals your eye finds; nudge the angle by half a degree and gaps open into spokes.
// The pointer, left to right, turns the angle from 130.5° to 144.5°, with a soft catch at 137.508° in the middle.
const PARAMS = { angle: 137.508, sweep: 0.6, dots: 1500 };

export default function (stage) {
  const canvas = document.createElement('canvas');
  canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block';
  stage.append(canvas);
  const ctx = canvas.getContext('2d');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let W = 0, H = 0, D = 1;
  const resize = () => { D = Math.min(devicePixelRatio, 2); W = stage.clientWidth || 1; H = stage.clientHeight || 1; canvas.width = W * D | 0; canvas.height = H * D | 0; };
  const ro = new ResizeObserver(resize); ro.observe(stage); resize();
  const M = 21;   // a Fibonacci number: seeds i and i+21 are neighbours, so each colour traces one spiral arm
  // neighbouring arms differ by 8 in index (8·8 = 64 ≡ 1 mod 21), so hue = 8k mod 21 makes colour sweep smoothly
  // from arm to arm round the head instead of jumping
  const stops = [[255, 196, 92], [255, 112, 92], [236, 72, 153], [139, 92, 246], [56, 189, 248], [52, 211, 153]];
  const pal = [];
  for (let k = 0; k < M; k++) {
    const h = ((k * 8) % M) / M * stops.length, i = Math.floor(h), f = h - i, A = stops[i], B = stops[(i + 1) % stops.length];
    pal.push(`rgb(${A.map((v, n) => Math.round(v + (B[n] - v) * f)).join(',')})`);
  }
  // the pointer sets the angle: finer near the middle, where 137.508° catches it, coarser toward 3/8 (135°) and 2/5 (144°)
  let tx = .5, mx = .5, ma = 0, lastMove = -1e9;
  const onMove = e => { const b = canvas.getBoundingClientRect(); tx = (e.clientX - b.left) / b.width; lastMove = performance.now(); };
  const onLeave = () => { lastMove = -1e9; };
  canvas.addEventListener('pointermove', onMove); canvas.addEventListener('pointerdown', onMove); canvas.addEventListener('pointerleave', onLeave);
  let raf, last = performance.now(); const t0 = performance.now();
  function frame(now) {
    const dt = Math.min(.05, (now - last) / 1000); last = now;
    const t = (now - t0) / 1000;
    const live = now - lastMove < 2500;
    if (live && ma < .01) mx = tx;
    mx += (tx - mx) * (1 - Math.exp(-dt * 14)); ma += ((live ? 1 : 0) - ma) * (1 - Math.exp(-dt * (live ? 6 : 2.5)));
    const F = 1200 + (reduce ? 0 : t * 14);                                // seeds born so far
    const u = Math.max(-.5, Math.min(.5, mx - .5)), q = Math.max(0, Math.abs(u) - .025) / .475;
    const pdeg = 137.508 + Math.sign(u) * 7 * q * q, e = ma * ma * (3 - 2 * ma);
    let deg = PARAMS.angle + (reduce ? 0 : PARAMS.sweep * Math.sin(t * .22) * Math.min(1, t / 6));
    deg += (pdeg - deg) * e;
    const a = deg * Math.PI / 180;
    const N = Math.round(PARAMS.dots);
    const Rout = Math.hypot(W, H) * .5, c = Rout / Math.sqrt(N);
    ctx.setTransform(D, 0, 0, D, 0, 0);
    ctx.fillStyle = '#0a0a0f'; ctx.fillRect(0, 0, W, H);
    const cx = W / 2, cy = H / 2, top = Math.floor(F);
    for (let k = 0; k < M; k++) {
      ctx.fillStyle = pal[k]; ctx.beginPath();
      // seed j: fixed angle j·a, radius c·√age; walk only the seeds of this colour
      let j = top - ((top - k) % M + M) % M;
      for (; j > top - N; j -= M) {
        const age = F - j; if (age <= 0) continue;
        const r = c * Math.sqrt(age), th = j * a;
        const s = c * .56 * Math.min(1, .25 + age / 40);
        const x = cx + r * Math.cos(th), y = cy + r * Math.sin(th);
        if (x < -s || x > W + s || y < -s || y > H + s) continue;
        ctx.moveTo(x + s, y); ctx.arc(x, y, s, 0, 6.2832);
      }
      ctx.fill();
    }
    // a soft dark core where seeds are born, so the eye lands in the centre
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, c * 3.5);
    g.addColorStop(0, 'rgba(10,10,15,.85)'); g.addColorStop(1, 'rgba(10,10,15,0)');
    ctx.fillStyle = g; ctx.fillRect(cx - c * 3.5, cy - c * 3.5, c * 7, c * 7);
    // the angle readout
    ctx.font = '600 12px ui-monospace, SFMono-Regular, Menlo, monospace'; ctx.textBaseline = 'bottom';
    const lbl = deg.toFixed(3) + '°', w = ctx.measureText(lbl).width;
    ctx.fillStyle = 'rgba(10,10,15,.78)'; ctx.fillRect(12, H - 34, w + 16, 22);
    ctx.fillStyle = Math.abs(deg - 137.508) < .01 ? '#ffd65c' : 'rgba(240,236,228,.85)'; ctx.fillText(lbl, 20, H - 16);
    raf = requestAnimationFrame(frame);
  }
  raf = requestAnimationFrame(frame);
  return () => { cancelAnimationFrame(raf); ro.disconnect(); canvas.removeEventListener('pointermove', onMove); canvas.removeEventListener('pointerdown', onMove); canvas.removeEventListener('pointerleave', onLeave); canvas.remove(); };
}
