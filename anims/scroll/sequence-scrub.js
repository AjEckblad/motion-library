// Image-sequence scrub, on a running shoe's product page: the shoe turns a full circle as you scroll, one pre-rendered frame at a time, while the feature callouts change beside it.
// This is how big product pages spin objects: render the turntable once as a stack of frames, then let scroll position pick the frame. Here the frames are drawn in code (a small 3D mesh, flat-shaded) and cached on first use; fewer frames step visibly, more frames look like video. The page scrolls itself; a real wheel or swipe takes over.
const PARAMS = { frames: 48, turns: 1 };

export default function (stage) {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const AH = 340, MINW = 400, NAV = 40;
  const N = Math.max(8, Math.round(PARAMS.frames));
  const notes = [
    ['Knit upper', 'Breathes like a T-shirt. 212 g in a size 42.'],
    ['Foam midsole', 'Made from recycled foam. 38 mm at the heel, 30 at the toe.'],
    ['Rubber outsole', 'Tested over 800 km of wet city streets.'],
  ];
  const root = document.createElement('div');
  root.className = 'sq-root';
  root.innerHTML = `<style>
    .sq-root { position: absolute; inset: 0; overflow: hidden; background: #e8e9eb; color: #15181f; font-family: "Mona Sans", system-ui, -apple-system, sans-serif; }
    .sq-art { position: absolute; left: 0; top: 0; height: ${AH}px; transform-origin: 0 0; }
    .sq-scroll { position: absolute; inset: 0; overflow-y: auto; overflow-x: hidden; scrollbar-width: none; }
    .sq-scroll::-webkit-scrollbar { display: none; }
    .sq-nav { position: sticky; top: 0; z-index: 3; height: ${NAV}px; display: flex; align-items: center; gap: 16px; padding: 0 20px; background: #e8e9eb; font-size: 11.5px; font-weight: 560; color: #555a66; }
    .sq-nav strong { margin-right: auto; color: #15181f; font-weight: 680; }
    .sq-nav b { color: #fff; background: #15181f; padding: 6px 12px; border-radius: 999px; font-weight: 650; }
    .sq-track { position: relative; }
    .sq-stage { position: sticky; top: ${NAV}px; height: ${AH - NAV}px; display: grid; grid-template-columns: 38% 1fr; align-items: center; }
    .sq-copy { padding-left: 22px; }
    .sq-copy small { font-size: 10.5px; font-weight: 700; letter-spacing: .12em; color: #d4572a; }
    .sq-copy h1 { margin: 6px 0 4px; font-size: 26px; line-height: 1.04; font-weight: 740; letter-spacing: -0.03em; }
    .sq-price { font-size: 12px; color: #555a66; }
    .sq-note { margin-top: 18px; min-height: 64px; }
    .sq-note b { display: block; font-size: 14px; font-weight: 680; }
    .sq-note span { display: block; margin-top: 3px; font-size: 12px; line-height: 1.4; color: #4a4f5a; max-width: 190px; }
    .sq-dots { display: flex; gap: 5px; margin-top: 10px; }
    .sq-dots i { width: 18px; height: 3px; border-radius: 3px; background: #c9ccd2; }
    .sq-dots i.on { background: #15181f; }
    .sq-view { position: relative; height: 100%; }
    .sq-view canvas { position: absolute; inset: 0; width: 100%; height: 100%; }
    .sq-frame { position: absolute; right: 18px; bottom: 14px; font: 600 10px ui-monospace, "SF Mono", Menlo, monospace; color: #7a7f8a; font-variant-numeric: tabular-nums; }
    .sq-specs { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; padding: 20px 20px 70px; }
    .sq-specs div { padding: 12px; border-radius: 12px; background: #f4f5f6; font-size: 11px; color: #555a66; }
    .sq-specs b { display: block; font-size: 20px; color: #15181f; font-weight: 720; letter-spacing: -0.02em; }
  </style>
  <div class="sq-art"><div class="sq-scroll">
    <div class="sq-nav"><strong>Road running</strong><span>Men</span><span>Women</span><span>Fit guide</span><b>Add to bag</b></div>
    <div class="sq-track"><div class="sq-stage">
      <div class="sq-copy"><small>DAILY TRAINER</small><h1>Made for the long way home.</h1><div class="sq-price">€140 · Sizes 36 to 47</div><div class="sq-note"><b></b><span></span></div><div class="sq-dots"><i></i><i></i><i></i></div></div>
      <div class="sq-view"><canvas></canvas><div class="sq-frame"></div></div>
    </div></div>
    <div class="sq-specs"><div><b>8 mm</b>heel-to-toe drop</div><div><b>254 g</b>size 42</div><div><b>800 km</b>tested life</div></div>
  </div></div>`;
  stage.append(root);
  const box = root.querySelector('.sq-art'), sc = root.querySelector('.sq-scroll'), track = root.querySelector('.sq-track');
  const view = root.querySelector('.sq-view'), canvas = root.querySelector('canvas'), ctx = canvas.getContext('2d');
  const label = root.querySelector('.sq-frame'), note = root.querySelector('.sq-note'), dots = [...root.querySelectorAll('.sq-dots i')];
  track.style.height = (AH - NAV) * 3.4 + 'px';

  // ── the shoe: a lofted mesh, heel at x = -1, toe at x = +1, y up, z across
  const S = 26, R = 12, V = [], F = [];
  const w = x => 0.31 * Math.sqrt(Math.max(0, 1 - ((x - 0.08) / 1.06) ** 2)) * (0.86 + 0.14 * (x + 1) / 2) + 0.012;
  const lift = x => 0.11 * Math.max(0, (x - 0.5) / 0.5) ** 2 + 0.03 * Math.max(0, (-x - 0.8) / 0.2) ** 2;
  const thick = x => 0.16 - 0.04 * (x + 1) / 2;
  const top = x => x < -0.45 ? 0.68 - 0.1 * Math.max(0, (x + 0.75) / 0.3) : x < -0.1 ? 0.58 : 0.58 - 0.32 * ((x + 0.1) / 1.1) ** 1.3;
  const add = (x, y, z) => V.push([x, y, z]) - 1;
  const sole = [], upper = [];
  for (let i = 0; i < S; i++) {
    const x = -1 + 2 * i / (S - 1), b = lift(x), t = b + thick(x), ww = w(x) * 1.07;
    sole.push([add(x, b, -ww), add(x, b + 0.035, -ww), add(x, t, -ww), add(x, t, ww), add(x, b + 0.035, ww), add(x, b, ww)]);
    const ring = [];
    for (let j = 0; j <= R; j++) {
      const th = Math.PI * j / R, c = Math.cos(th), s = Math.sin(th);
      ring.push(add(x, t + (top(x) + b - t) * Math.pow(s, 0.75), -w(x) * 0.97 * Math.sign(c) * Math.abs(c) ** 0.7));
    }
    upper.push(ring);
  }
  const C = { out: [58, 54, 51], foam: [243, 240, 234], body: [44, 74, 122], panel: [108, 143, 199], tab: [240, 138, 60], lining: [27, 34, 54], tongue: [64, 92, 140] };
  for (let i = 0; i < S - 1; i++) {
    const a = sole[i], b2 = sole[i + 1], xm = -1 + 2 * (i + 0.5) / (S - 1);
    for (let k = 0; k < 5; k++) F.push([[a[k], b2[k], b2[k + 1], a[k + 1]], k === 0 || k === 4 ? C.out : C.foam]);
    F.push([[a[5], b2[5], b2[0], a[0]], C.out]);
    for (let j = 0; j < R; j++) {
      const up = j > 2 && j < R - 2, mid = j >= 4 && j <= R - 4;
      let col = C.body;
      if (mid && xm < -0.35 && xm > -0.95) col = C.lining;
      else if (mid && xm >= -0.35 && xm < 0.5) col = C.tongue;
      else if (xm < -0.8 && up) col = C.tab;
      else if ((j === 1 || j === 2 || j === R - 2 || j === R - 1) && xm > -0.5 && xm < 0.55) col = C.panel;
      F.push([[upper[i][j], upper[i + 1][j], upper[i + 1][j + 1], upper[i][j + 1]], col]);
    }
  }
  // end caps of the sole at heel and toe
  F.push([sole[0], C.foam], [sole[S - 1], C.foam]);
  const laces = [-0.28, -0.14, 0, 0.14, 0.28].map(x => { const y = lift(x) + top(x) + 0.012; return [[x - 0.03, y, -0.11], [x + 0.03, y, 0.11]]; });

  const pitch = 0.32, L = [-0.45, 0.75, 0.5], Ln = Math.hypot(...L);
  const cache = new Map();
  let cw = 0, ch = 0;
  function render(k) {
    const c = document.createElement('canvas'); c.width = cw; c.height = ch;
    const g = c.getContext('2d'), a = (k / N) * Math.PI * 2 * PARAMS.turns + 0.5;
    const sz = Math.min(cw * 0.38, ch * 0.6), cx = cw * 0.5, cy = ch * 0.6;
    const ca = Math.cos(a), sa = Math.sin(a), cb = Math.cos(pitch), sb = Math.sin(pitch);
    const P = V.map(([x, y, z]) => { const x1 = x * ca + z * sa, z1 = -x * sa + z * ca, y2 = y * cb - z1 * sb, z2 = y * sb + z1 * cb; return [cx + x1 * sz, cy - y2 * sz, z2, x1, y2]; });
    // soft contact shadow, stretched along the shoe's current direction
    g.save(); g.translate(cx, cy + 0.02 * sz); g.scale(1, 0.16);
    const rg = g.createRadialGradient(0, 0, 0, 0, 0, sz * (0.5 + 0.55 * Math.abs(ca)));
    rg.addColorStop(0, 'rgba(20,24,32,.32)'); rg.addColorStop(1, 'rgba(20,24,32,0)');
    g.fillStyle = rg; g.beginPath(); g.arc(0, 0, sz * 1.1, 0, Math.PI * 2); g.fill(); g.restore();
    const faces = F.map(([idx, col]) => {
      const p = idx.map(i => P[i]);
      const ux = p[1][3] - p[0][3], uy = p[1][4] - p[0][4], uz = p[1][2] - p[0][2], vx = p[2 % p.length][3] - p[0][3], vy = p[2 % p.length][4] - p[0][4], vz = p[2 % p.length][2] - p[0][2];
      let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx; const nl = Math.hypot(nx, ny, nz) || 1;
      if (nz < 0) { nx = -nx; ny = -ny; nz = -nz; }
      const lit = Math.max(0, (nx * L[0] + ny * L[1] + nz * L[2]) / (nl * Ln));
      return { p, col, z: p.reduce((s, q) => s + q[2], 0) / p.length, k: 0.5 + 0.55 * lit };
    }).sort((f1, f2) => f1.z - f2.z);
    for (const f of faces) {
      const rgb = `rgb(${f.col.map(v => Math.min(255, Math.round(v * f.k))).join(',')})`;
      g.fillStyle = g.strokeStyle = rgb; g.lineWidth = 0.8; g.lineJoin = 'round';
      g.beginPath(); f.p.forEach((q, i) => i ? g.lineTo(q[0], q[1]) : g.moveTo(q[0], q[1])); g.closePath(); g.fill(); g.stroke();
    }
    g.strokeStyle = '#f4f1ea'; g.lineWidth = Math.max(1.5, sz * 0.022); g.lineCap = 'round';
    for (const [p1, p2] of laces) {
      const pr = ([x, y, z]) => { const x1 = x * ca + z * sa, z1 = -x * sa + z * ca; return [cx + x1 * sz, cy - (y * cb - z1 * sb) * sz]; };
      const A = pr(p1), B = pr(p2); g.beginPath(); g.moveTo(A[0], A[1]); g.lineTo(B[0], B[1]); g.stroke();
    }
    return c;
  }
  const fit = () => {
    const W = stage.clientWidth, H = stage.clientHeight, s = Math.min(H / AH, W / MINW) || 1;
    box.style.width = W / s + 'px'; box.style.top = (H - AH * s) / 2 + 'px'; box.style.transform = `scale(${s})`;
    const dpr = Math.min(2, window.devicePixelRatio || 1) * s;
    cw = Math.round(view.clientWidth * dpr); ch = Math.round(view.clientHeight * dpr);
    canvas.width = cw; canvas.height = ch; cache.clear(); shown = -1;
  };
  let shown = -1, part = -1;
  const ro = new ResizeObserver(fit); ro.observe(stage); fit();

  // Simulated shopper: stop on each feature, then the specs, then back up (the shoe turns backwards too).
  const T = () => track.offsetTop - NAV, span = () => track.offsetHeight - (AH - NAV), end = () => sc.scrollHeight - sc.clientHeight;
  const stops = [[() => 0, 0, 900], [() => T() + span() * 0.3, 1900, 700], [() => T() + span() * 0.64, 1500, 700], [() => T() + span(), 1500, 700], [end, 800, 1000], [() => 0, 2200, 300]];
  const ease = t => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  let seg = null, si = 0, userUntil = 0, raf;
  const take = () => { userUntil = performance.now() + 3000; seg = null; };
  ['wheel', 'touchstart', 'pointerdown'].forEach(e => sc.addEventListener(e, take, { passive: true }));
  function drive(now) {
    if (now < userUntil) return;
    if (!seg) { const [to, dur, hold] = stops[si++ % stops.length]; seg = { from: sc.scrollTop, to: Math.min(end(), to()), t0: now, dur, hold }; }
    const k = seg.dur ? Math.min(1, (now - seg.t0) / seg.dur) : 1;
    sc.scrollTop = seg.from + (seg.to - seg.from) * ease(k);
    if (now - seg.t0 >= seg.dur + seg.hold) seg = null;
  }
  const easeOut = 'cubic-bezier(0.23, 1, 0.32, 1)';
  function frame(now) {
    drive(now);
    const p = span() > 0 ? Math.min(1, Math.max(0, (sc.scrollTop - T()) / span())) : 0;
    // scroll position picks a frame; nothing in between is interpolated
    const q = Math.min(2, Math.floor(p * 3));
    // reduced motion: no turntable; one fixed view per feature, swapped with a fade
    const k = reduce ? Math.floor(q * N / 3) : Math.min(N - 1, Math.floor(p * N));
    if (k !== shown && cw > 0) {
      if (!cache.has(k)) cache.set(k, render(k));
      ctx.clearRect(0, 0, cw, ch); ctx.drawImage(cache.get(k), 0, 0);
      if (reduce) canvas.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 260 });
      label.textContent = `frame ${String(k + 1).padStart(2, '0')} / ${N}`; shown = k;
    }
    if (q !== part) {
      part = q; note.firstChild.textContent = notes[q][0]; note.lastChild.textContent = notes[q][1];
      dots.forEach((d, i) => d.classList.toggle('on', i === q));
      note.animate([{ opacity: 0, transform: reduce ? 'none' : 'translateY(6px)' }, { opacity: 1, transform: 'none' }], { duration: 260, easing: easeOut });
    }
    raf = requestAnimationFrame(frame);
  }
  raf = requestAnimationFrame(frame);
  return () => { cancelAnimationFrame(raf); ro.disconnect(); cache.clear(); root.getAnimations({ subtree: true }).forEach(a => a.cancel()); root.remove(); };
}
