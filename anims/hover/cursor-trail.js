// Cursor trail on a portfolio landing page: the head of a ribbon follows the cursor and every point behind it eases
// toward the point ahead, so the ribbon tapers and curls behind each movement and then catches up when the cursor rests.
// It feels right because the trail records the gesture you just made, which gives a quiet page some personality without hiding the text.
const PARAMS = { points: 24, ease: 0.35 };

export default function (stage) {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const W = 540, H = 380;
  const root = document.createElement('div');
  root.className = 'ct-root';
  root.innerHTML = `<style>
    .ct-root { position: absolute; inset: 0; overflow: hidden; background: #141310; font-family: system-ui, -apple-system, "Segoe UI", sans-serif; color: #f4efe6; }
    .ct-scene { position: absolute; left: 0; top: 0; width: ${W}px; height: ${H}px; transform-origin: 0 0; }
    .ct-nav { position: absolute; left: 30px; right: 30px; top: 24px; display: flex; align-items: center; gap: 22px; font-size: 12.5px; color: #a8a196; }
    .ct-mono { margin-right: auto; width: 28px; height: 28px; border-radius: 50%; border: 1.5px solid #f4efe6; display: grid; place-items: center; font-size: 11px; font-weight: 700; color: #f4efe6; letter-spacing: .02em; }
    .ct-dot { width: 7px; height: 7px; border-radius: 50%; background: #7bd88f; display: inline-block; margin-right: 6px; }
    .ct-hero { position: absolute; left: 30px; top: 104px; width: 470px; }
    .ct-hero h1 { margin: 0; font-size: 38px; line-height: 1.04; font-weight: 700; letter-spacing: -0.035em; }
    .ct-hero h1 em { font-style: italic; font-weight: 500; color: #f2b84b; }
    .ct-hero p { margin: 16px 0 0; width: 330px; font-size: 14px; line-height: 1.5; color: #a8a196; }
    .ct-foot { position: absolute; left: 30px; right: 30px; bottom: 26px; display: flex; justify-content: space-between; font-size: 12px; color: #7d776d; border-top: 1px solid #2b2924; padding-top: 14px; }
    .ct-foot b { color: #f4efe6; font-weight: 600; }
    .ct-canvas { position: absolute; left: 0; top: 0; width: ${W}px; height: ${H}px; pointer-events: none; mix-blend-mode: screen; }
    .ct-cur { position: absolute; left: 0; top: 0; z-index: 9; pointer-events: none; transition: opacity .2s; filter: drop-shadow(0 1px 1.5px rgba(0,0,0,.4)); }
  </style><div class="ct-scene">
    <div class="ct-nav"><div class="ct-mono">RA</div><span>Work</span><span>About</span><span>Notes</span><span style="color:#f4efe6"><i class="ct-dot"></i>Available in March</span></div>
    <div class="ct-hero"><h1>Interfaces that feel <em>calm</em>, quick and a little playful.</h1><p>Independent product designer. Ten years of apps, tools and the small details in between.</p></div>
    <div class="ct-foot"><span>Selected work, 2019 to now</span><span><b>12</b> projects ↓</span></div>
    <canvas class="ct-canvas"></canvas>
  </div>`;
  stage.append(root);
  const scene = root.querySelector('.ct-scene'), canvas = root.querySelector('.ct-canvas'), ctx = canvas.getContext('2d');
  let s = 1;
  const fit = () => {
    const w = stage.clientWidth, h = stage.clientHeight, d = Math.min(devicePixelRatio, 2);
    s = Math.min(w / W, h / H, 1.3); scene.style.transform = `translate(${(w - W * s) / 2}px, ${(h - H * s) / 2}px) scale(${s})`;
    canvas.width = Math.round(W * s * d); canvas.height = Math.round(H * s * d); ctx.setTransform(s * d, 0, 0, s * d, 0, 0);
  };
  const ro = new ResizeObserver(fit); ro.observe(stage); fit();
  const pt = (x, y) => () => ({ x, y });

  // simulated cursor: long, curving gestures with short rests so the trail always has something to draw
  const steps = [
    { to: pt(380, 300), move: 600, hold: 150, bow: 0.3 },
    { to: pt(150, 140), move: 900, hold: 120, bow: -0.35 },
    { to: pt(430, 110), move: 800, hold: 400, bow: 0.3 },
    { to: pt(260, 250), move: 700, hold: 120, bow: 0.45 },
    { to: pt(80, 300), move: 800, hold: 120, bow: -0.3 },
    { to: pt(300, 190), move: 750, hold: 500, bow: 0.4 },
  ];
  const ghost = document.createElement('div'); ghost.className = 'ct-cur';
  ghost.innerHTML = '<svg width="17" height="24" viewBox="-1 -1 17 24"><path d="M0 0v17.6l4.3-4.1 2.9 6.6 2.9-1.2-2.8-6.5h6.1z" fill="#fff" stroke="#141310" stroke-width="1.3" stroke-linejoin="round"/></svg>';
  scene.append(ghost);
  const inOut = t => t < 0.5 ? 8 * t ** 4 : 1 - (-2 * t + 2) ** 4 / 2;
  let si = 0, t0 = performance.now(), from = steps[0].to(), real = null;
  const c = { x: from.x, y: from.y };
  function sim(now) {
    let st = steps[si];
    while (now - t0 > st.move + st.hold) { t0 += st.move + st.hold; from = st.to(); si = (si + 1) % steps.length; st = steps[si]; }
    const k = inOut(Math.min(1, (now - t0) / st.move)), to = st.to(), dx = to.x - from.x, dy = to.y - from.y, bow = Math.sin(Math.PI * k) * st.bow;
    c.x = from.x + dx * k - dy * bow; c.y = from.y + dy * k + dx * bow;
  }
  const toScene = e => { const r = scene.getBoundingClientRect(); return { x: (e.clientX - r.left) / s, y: (e.clientY - r.top) / s }; };
  const onMove = e => { real = toScene(e); };
  const onLeave = () => { if (real) { from = { ...real }; t0 = performance.now(); } real = null; };
  root.addEventListener('pointermove', onMove); root.addEventListener('pointerleave', onLeave);

  const n = Math.max(2, Math.round(PARAMS.points));
  const pts = Array.from({ length: n }, () => ({ x: from.x, y: from.y }));
  let raf;
  function frame(now) {
    if (real) { c.x = real.x; c.y = real.y; } else sim(now);
    ghost.style.transform = `translate(${c.x - 1}px, ${c.y - 1}px)`;
    ghost.style.opacity = real ? 0 : 1;
    if (reduce) {
      // reduced motion: no ribbon chasing the cursor; the stroke is inked where the cursor passes and fades out in place
      ctx.globalCompositeOperation = 'destination-out'; ctx.fillStyle = 'rgba(0,0,0,.12)'; ctx.fillRect(0, 0, W, H); ctx.globalCompositeOperation = 'source-over';
      ctx.lineCap = 'round'; ctx.strokeStyle = 'hsl(40, 90%, 62%)'; ctx.lineWidth = 6;
      ctx.beginPath(); ctx.moveTo(pts[0].x, pts[0].y); ctx.lineTo(c.x, c.y); ctx.stroke();
      pts[0].x = c.x; pts[0].y = c.y;
      raf = requestAnimationFrame(frame); return;
    }
    pts[0].x = c.x; pts[0].y = c.y;
    for (let i = 1; i < n; i++) { pts[i].x += (pts[i - 1].x - pts[i].x) * PARAMS.ease; pts[i].y += (pts[i - 1].y - pts[i].y) * PARAMS.ease; }
    ctx.clearRect(0, 0, W, H);
    ctx.lineCap = 'round';
    for (let i = n - 1; i > 0; i--) {
      const k = 1 - i / n;
      ctx.strokeStyle = `hsl(${40 - 30 * (1 - k)}, ${60 + 30 * k}%, ${16 + 46 * k}%)`;   // opaque, fading into the page colour, so joints never bead
      ctx.lineWidth = 1.5 + 13 * k;
      ctx.beginPath(); ctx.moveTo(pts[i].x, pts[i].y); ctx.lineTo(pts[i - 1].x, pts[i - 1].y); ctx.stroke();
    }
    raf = requestAnimationFrame(frame);
  }
  raf = requestAnimationFrame(frame);
  return () => { cancelAnimationFrame(raf); ro.disconnect(); root.removeEventListener('pointermove', onMove); root.removeEventListener('pointerleave', onLeave); root.remove(); };
}
