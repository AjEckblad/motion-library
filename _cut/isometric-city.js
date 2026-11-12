// Isometric city: a grid of blocks drawn back to front (painter's order by row + column), each building a box
// with three visible faces. Buildings rise in on springs, cars drive the road grid, and a day–night cycle
// dims the sky and lights the windows. Every so often a block is demolished and rebuilt taller.
const PARAMS = { size: 12, cycle: 16, traffic: 14 };

export default function (stage) {
  const canvas = document.createElement('canvas');
  canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block';
  stage.append(canvas);
  const ctx = canvas.getContext('2d');
  let W = 0, H = 0;
  const resize = () => { const d = Math.min(devicePixelRatio, 2); W = stage.clientWidth; H = stage.clientHeight; canvas.width = W * d; canvas.height = H * d; ctx.setTransform(d, 0, 0, d, 0, 0); };
  const ro = new ResizeObserver(resize); ro.observe(stage); resize();

  const N = Math.round(PARAMS.size), road = (i) => i % 4 === 0;
  const tiles = [];
  const palette = [['#e9e4da', '#c9c1b3', '#a99f8f'], ['#d8e2ea', '#aebccb', '#8797aa'], ['#f0d9c4', '#d4b49a', '#b38f74'], ['#dfe8d9', '#b7c7ab', '#93a585']];
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
    const isRoad = road(i) || road(j), park = !isRoad && Math.random() < 0.1;
    const centre = 1 - Math.hypot(i - N / 2, j - N / 2) / (N * 0.75);
    tiles.push({ i, j, isRoad, park, target: isRoad || park ? 0 : 0.6 + Math.random() * 2.4 * Math.max(0.2, centre) + (Math.random() < 0.08 ? 2.5 : 0), h: 0, v: 0, delay: (i + j) * 0.05 + Math.random() * 0.2, col: palette[Math.random() * 4 | 0], seed: Math.random() * 1000 });
  }
  const cars = Array.from({ length: Math.round(PARAMS.traffic) }, () => { const alongI = Math.random() < 0.5, lane = Math.floor(Math.random() * (N / 4)) * 4; return { alongI, lane, s: Math.random() * N, v: (0.9 + Math.random() * 0.8) * (Math.random() < 0.5 ? 1 : -1), col: ['#e5484d', '#f5d90a', '#3e63dd', '#ffffff', '#30a46c'][Math.random() * 5 | 0] }; });
  const hash = (a, b) => { const s = Math.sin(a * 127.1 + b * 311.7) * 43758.5; return s - Math.floor(s); };

  let raf, last = performance.now(), nextRebuild = 5; const t0 = last;
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000); last = now; const t = (now - t0) / 1000;
    const tw = Math.min(W / (N + 1), H * 1.6 / (N + 1)), th = tw / 2, unit = th * 1.1;
    const ox = W / 2, oy = H / 2 - (N * th) / 2 + th * 1.2;
    const P = (x, y, z) => [ox + (x - y) * tw / 2, oy + (x + y) * th / 2 - z * unit];
    // day and night: 0 = noon, 0.5 = midnight
    const ph = (t / PARAMS.cycle) % 1, night = Math.max(0, Math.min(1, (Math.cos(ph * 6.283) * -1 + 0.2) * 1.4));
    const sky = ctx.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, `rgb(${lerp3([168, 210, 240], [12, 16, 38], night)})`); sky.addColorStop(1, `rgb(${lerp3([236, 228, 214], [34, 30, 58], night)})`);
    ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H);
    // springs: each building rises toward its target height after its delay; occasionally one is rebuilt
    if (t > nextRebuild) {
      const pick = tiles.filter(x => x.target > 0), k = pick[Math.random() * pick.length | 0];
      if (k) { k.target = 0; k.rebuild = t + 1.2; }
      nextRebuild = t + 3 + Math.random() * 3;
    }
    for (const tl of tiles) {
      if (tl.rebuild && t > tl.rebuild) { tl.target = 1 + Math.random() * 3.5; tl.rebuild = 0; tl.col = palette[Math.random() * 4 | 0]; tl.seed = Math.random() * 1000; }
      if (t < tl.delay) continue;
      tl.v += ((tl.target - tl.h) * 120 - tl.v * 14) * dt; tl.h += tl.v * dt; if (tl.h < 0) { tl.h = 0; tl.v = 0; }
    }
    const carsOn = new Map();
    for (const c of cars) {
      c.s = (c.s + c.v * dt * 1.2 + N) % N;
      const i = c.alongI ? Math.floor(c.s) : c.lane, j = c.alongI ? c.lane : Math.floor(c.s), key = j * N + i;
      if (!carsOn.has(key)) carsOn.set(key, []); carsOn.get(key).push(c);
    }
    const quad = (pts, fill) => { ctx.fillStyle = fill; ctx.beginPath(); pts.forEach(([x, y], k) => k ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.closePath(); ctx.fill(); };
    const shade = (hex, k) => { const n = parseInt(hex.slice(1), 16); return `rgb(${[(n >> 16) & 255, (n >> 8) & 255, n & 255].map(v => Math.round(v * k)).join(',')})`; };
    const dim = 1 - night * 0.62;
    // painter's order: rows and columns summed, back to front
    const order = [...tiles].sort((a, b) => (a.i + a.j) - (b.i + b.j));
    for (const tl of order) {
      const { i, j } = tl;
      quad([P(i, j, 0), P(i + 1, j, 0), P(i + 1, j + 1, 0), P(i, j + 1, 0)], tl.isRoad ? shade('#5b5f68', dim) : tl.park ? shade('#7fb069', dim) : shade('#cfc8bb', dim));
      if (tl.isRoad && ((road(i) && !road(j)) || (road(j) && !road(i)))) {   // lane dashes
        ctx.strokeStyle = `rgba(255,240,200,${0.5 * dim + 0.2})`; ctx.lineWidth = 1; ctx.beginPath();
        const a = road(i) ? P(i + 0.5, j + 0.2, 0) : P(i + 0.2, j + 0.5, 0), b = road(i) ? P(i + 0.5, j + 0.8, 0) : P(i + 0.8, j + 0.5, 0);
        ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke();
      }
      if (tl.park) { const c = P(i + 0.5, j + 0.5, 0); ctx.fillStyle = shade('#3f7f3a', dim); ctx.beginPath(); ctx.ellipse(c[0], c[1] - unit * 0.35, tw * 0.16, tw * 0.2, 0, 0, 7); ctx.fill(); }
      for (const c of carsOn.get(j * N + i) || []) {
        const f = c.s % 1, x = c.alongI ? i + f : i + 0.5 + (c.v > 0 ? 0.18 : -0.18), y = c.alongI ? j + 0.5 + (c.v > 0 ? -0.18 : 0.18) : j + f;
        const l = 0.22, w = 0.13, hx = c.alongI ? l : w, hy = c.alongI ? w : l, z = 0.18;
        quad([P(x - hx, y - hy, z), P(x + hx, y - hy, z), P(x + hx, y + hy, z), P(x - hx, y + hy, z)], shade(c.col, 0.6 + 0.4 * dim));
        quad([P(x + hx, y - hy, 0), P(x + hx, y + hy, 0), P(x + hx, y + hy, z), P(x + hx, y - hy, z)], shade(c.col, 0.45 * dim + 0.15));
        quad([P(x - hx, y + hy, 0), P(x + hx, y + hy, 0), P(x + hx, y + hy, z), P(x - hx, y + hy, z)], shade(c.col, 0.6 * dim + 0.15));
        if (night > 0.3) { const hl = P(x + (c.alongI ? Math.sign(c.v) * (l + 0.1) : 0), y + (c.alongI ? 0 : Math.sign(c.v) * (l + 0.1)), 0.05); ctx.fillStyle = `rgba(255,236,170,${night * 0.6})`; ctx.beginPath(); ctx.arc(hl[0], hl[1], tw * 0.08, 0, 7); ctx.fill(); }
      }
      if (tl.h > 0.02) {
        const h = tl.h, m = 0.1, x0 = i + m, x1 = i + 1 - m, y0 = j + m, y1 = j + 1 - m;
        quad([P(x1, y0, 0), P(x1, y1, 0), P(x1, y1, h), P(x1, y0, h)], shade(tl.col[1], dim));   // right face
        quad([P(x0, y1, 0), P(x1, y1, 0), P(x1, y1, h), P(x0, y1, h)], shade(tl.col[2], dim));   // left face
        quad([P(x0, y0, h), P(x1, y0, h), P(x1, y1, h), P(x0, y1, h)], shade(tl.col[0], dim));   // roof
        // windows: lit at night by a per-window hash, so the pattern holds still instead of flickering
        const floors = Math.floor(h / 0.32);
        for (let f = 0; f < floors; f++) for (let k = 0; k < 3; k++) {
          const z = 0.12 + f * 0.32, on = hash(tl.seed + f, k) < 0.55 && night > hash(k, tl.seed + f) * 0.8;
          const col = on ? `rgba(255,214,130,${0.6 + 0.4 * night})` : `rgba(40,55,80,${0.35 + 0.25 * night})`;
          const u0 = 0.18 + k * 0.24, u1 = u0 + 0.14;
          quad([P(x1, y0 + (y1 - y0) * u0, z), P(x1, y0 + (y1 - y0) * u1, z), P(x1, y0 + (y1 - y0) * u1, z + 0.17), P(x1, y0 + (y1 - y0) * u0, z + 0.17)], col);
          quad([P(x0 + (x1 - x0) * u0, y1, z), P(x0 + (x1 - x0) * u1, y1, z), P(x0 + (x1 - x0) * u1, y1, z + 0.17), P(x0 + (x1 - x0) * u0, y1, z + 0.17)], col);
        }
      }
    }
    raf = requestAnimationFrame(frame);
  }
  const lerp3 = (a, b, k) => a.map((v, i) => Math.round(v + (b[i] - v) * k)).join(',');
  raf = requestAnimationFrame(frame);
  return () => { cancelAnimationFrame(raf); ro.disconnect(); canvas.remove(); };
}
