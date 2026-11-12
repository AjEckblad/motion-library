// DNA double helix: two backbones winding round a common axis, a quarter turn apart in the minor/major groove way real
// DNA is, joined by base pairs (A–T, C–G). Everything is built as points in 3D, turned, projected and drawn back to
// front as shaded spheres, so it reads as solid without a 3D engine. A replication fork travels along it: there the
// strands peel apart, rungs split into their two halves, then zip back together behind it.
const PARAMS = { spin: 1, unzip: 1 };

export default function (stage) {
  const canvas = document.createElement('canvas');
  canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block';
  stage.append(canvas);
  const ctx = canvas.getContext('2d');
  let W = 0, H = 0;
  const resize = () => { const d = Math.min(devicePixelRatio, 2); W = stage.clientWidth || 1; H = stage.clientHeight || 1; canvas.width = W * d; canvas.height = H * d; ctx.setTransform(d, 0, 0, d, 0, 0); };
  const ro = new ResizeObserver(resize); ro.observe(stage); resize();
  const BASES = { A: '#ff5d73', T: '#ffd166', C: '#4cc9f0', G: '#7bd389' }, PAIR = { A: 'T', T: 'A', C: 'G', G: 'C' };
  const N = 44, seq = Array.from({ length: N }, () => 'ATCG'[Math.random() * 4 | 0]);
  // a shaded sphere sprite per colour, made once
  const ball = col => { const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d'), gr = g.createRadialGradient(24, 22, 2, 32, 32, 31); gr.addColorStop(0, '#fff'); gr.addColorStop(0.25, col); gr.addColorStop(1, 'rgba(0,0,0,.85)'); g.fillStyle = gr; g.beginPath(); g.arc(32, 32, 31, 0, 7); g.fill(); return c; };
  const SPR = Object.fromEntries([...Object.entries(BASES), ['bb1', '#9aa7ff'], ['bb2', '#c7a0ff']].map(([k, v]) => [k, ball(v)]));
  let raf; const t0 = performance.now();
  function frame(now) {
    const t = (now - t0) / 1000, S = Math.min(W, H), F = S * 2.4;
    const bg = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, Math.max(W, H) * 0.7); bg.addColorStop(0, '#141a33'); bg.addColorStop(1, '#05060d');
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
    const spin = t * 0.6 * PARAMS.spin, tilt = 1.05, ct = Math.cos(tilt), st = Math.sin(tilt);
    const fork = ((t * 0.09) % 1.4 - 0.2) * N;                             // where the strands are open, travelling along
    const items = [];
    const put = (x, y, z, spr, r) => {
      // tilt the helix's axis diagonally across the view, then project
      const X = x * ct - y * st, Y = x * st + y * ct, k = F / (F + z * S * 0.5);
      items.push({ x: W / 2 + X * S * 0.34 * k, y: H / 2 + Y * S * 0.34 * k, z, s: r * S * 0.045 * k, spr });
    };
    for (let i = 0; i < N; i++) {
      const y = (i / (N - 1) - 0.5) * 2.6, a = i * 0.6 + spin;
      const open = PARAMS.unzip * Math.max(0, 1 - Math.abs(i - fork) / 5) ** 1.5;   // how far apart the strands are here
      const R = 0.32 + open * 0.35, a2 = a + 2.4 + open * 0.8;               // the second strand sits ~140° round (the grooves)
      const p1 = [Math.cos(a) * R, y, Math.sin(a) * R], p2 = [Math.cos(a2) * R, y, Math.sin(a2) * R];
      put(...p1, 'bb1', 0.55); put(...p2, 'bb2', 0.55);
      const b1 = seq[i], b2 = PAIR[b1], gap = 0.5 + open * 0.5;
      for (let k = 1; k <= 4; k++) {                                       // the rung: each half its base's colour, split where open
        const u = k / 9; put(p1[0] + (p2[0] - p1[0]) * u * gap, y, p1[2] + (p2[2] - p1[2]) * u * gap, b1, 0.36);
        put(p2[0] + (p1[0] - p2[0]) * u * gap, y, p2[2] + (p1[2] - p2[2]) * u * gap, b2, 0.36);
      }
    }
    items.sort((a, b) => b.z - a.z);
    for (const it of items) { const fog = Math.min(1, Math.max(0.35, 0.75 - it.z * 0.5)); ctx.globalAlpha = fog; ctx.drawImage(SPR[it.spr], it.x - it.s, it.y - it.s, it.s * 2, it.s * 2); }
    ctx.globalAlpha = 1;
    raf = requestAnimationFrame(frame);
  }
  raf = requestAnimationFrame(frame);
  return () => { cancelAnimationFrame(raf); ro.disconnect(); canvas.remove(); };
}
