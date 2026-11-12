// Magnetic buttons in a signup section: once the cursor comes close, each button leans toward it and its label leans
// further, through springs. The pull fades out toward the edge of the radius, so there is no jump when it takes hold.
// It feels right because the button seems to notice you before you arrive, and the springs let it settle with a little life.
const PARAMS = { strength: 0.4, radius: 140 };

export default function (stage) {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const W = 540, H = 380;
  const root = document.createElement('div');
  root.className = 'mg-root';
  root.innerHTML = `<style>
    .mg-root { position: absolute; inset: 0; overflow: hidden; background: #f6f3ee; font-family: system-ui, -apple-system, "Segoe UI", sans-serif; color: #15171a; }
    .mg-scene { position: absolute; left: 0; top: 0; width: ${W}px; height: ${H}px; transform-origin: 0 0; }
    .mg-nav { position: absolute; left: 32px; right: 32px; top: 22px; display: flex; align-items: center; gap: 20px; font-size: 12.5px; color: #5b6066; }
    .mg-mark { width: 22px; height: 22px; border-radius: 7px; background: #15171a; position: relative; margin-right: auto; }
    .mg-mark::after { content: ''; position: absolute; inset: 6px; border-radius: 50%; border: 2px solid #f6f3ee; }
    .mg-copy { position: absolute; left: 0; right: 0; top: 84px; text-align: center; }
    .mg-eyebrow { display: inline-block; font-size: 11.5px; font-weight: 600; color: #8a5a00; background: #f6e6c4; padding: 4px 9px; border-radius: 999px; }
    .mg-h { margin: 14px 0 10px; font-size: 34px; line-height: 1.05; font-weight: 720; letter-spacing: -0.03em; }
    .mg-p { margin: 0; font-size: 14px; line-height: 1.5; color: #4a4f55; width: 360px; margin: 0 auto; }
    .mg-row { position: absolute; left: 0; right: 0; top: 262px; display: flex; justify-content: center; gap: 22px; align-items: center; }
    .mg-btn { height: 50px; padding: 0 24px; border-radius: 999px; border: 0; font: 620 14.5px system-ui, -apple-system, sans-serif; display: inline-flex; align-items: center; gap: 8px; cursor: pointer; will-change: transform; transition: background-color .15s ease; }
    .mg-btn span { display: inline-flex; align-items: center; gap: 8px; will-change: transform; pointer-events: none; }
    .mg-a { background: #15171a; color: #fff; } .mg-a.hot { background: #2c3035; }
    .mg-b { background: #fff; color: #15171a; box-shadow: inset 0 0 0 1px #dcd6cc; } .mg-b.hot { background: #fbf8f3; }
    .mg-note { position: absolute; left: 0; right: 0; text-align: center; top: 336px; font-size: 12px; color: #7a7f85; }
    .mg-cur { position: absolute; left: 0; top: 0; z-index: 9; pointer-events: none; transition: opacity .2s; filter: drop-shadow(0 1px 1.5px rgba(0,0,0,.3)); }
  </style><div class="mg-scene">
    <div class="mg-nav"><div class="mg-mark"></div><span>Product</span><span>Pricing</span><span>Docs</span><span style="color:#15171a;font-weight:600">Sign in</span></div>
    <div class="mg-copy"><span class="mg-eyebrow">Free for 14 days</span><h2 class="mg-h">Put your site live<br>this afternoon.</h2><p class="mg-p">Import a design, connect your domain and publish when you are ready. No card needed to start.</p></div>
    <div class="mg-row"><button class="mg-btn mg-a" type="button"><span>Start free trial <svg width="14" height="14" viewBox="0 0 14 14"><path d="M2 7h9M7.5 3.5 11 7l-3.5 3.5" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg></span></button><button class="mg-btn mg-b" type="button"><span>Talk to sales</span></button></div>
    <div class="mg-note">Used by 4,000 small teams · Cancel any time</div>
  </div>`;
  stage.append(root);
  const scene = root.querySelector('.mg-scene');
  let s = 1;
  const fit = () => { const w = stage.clientWidth, h = stage.clientHeight; s = Math.min(w / W, h / H, 1.3); scene.style.transform = `translate(${(w - W * s) / 2}px, ${(h - H * s) / 2}px) scale(${s})`; };
  const ro = new ResizeObserver(fit); ro.observe(stage); fit();
  // layout box in scene pixels, ignoring transforms (so a leaning button does not chase its own offset)
  const box = el => { let x = 0, y = 0, e = el; while (e && e !== scene) { x += e.offsetLeft; y += e.offsetTop; e = e.offsetParent; } return { x, y, w: el.offsetWidth, h: el.offsetHeight }; };
  const at = (el, fx, fy) => () => { const b = box(el); return { x: b.x + b.w * fx, y: b.y + b.h * fy }; };
  const pt = (x, y) => () => ({ x, y });
  const [A, B] = scene.querySelectorAll('.mg-btn');

  // simulated cursor: eased, slightly curved moves with pauses; the real pointer takes over while it is on the stage
  const steps = [
    { to: pt(90, 350), move: 400, hold: 500 },
    { to: at(A, 0.2, 1.7), move: 900, hold: 700 },
    { to: at(A, 0.55, 0.45), move: 700, hold: 900 },
    { to: at(A, 0.85, -0.9), move: 600, hold: 500 },
    { to: at(B, 0.5, 0.6), move: 800, hold: 900 },
    { to: pt(500, 130), move: 1000, hold: 700 },
  ];
  const ghost = document.createElement('div'); ghost.className = 'mg-cur';
  ghost.innerHTML = '<svg width="17" height="24" viewBox="-1 -1 17 24"><path d="M0 0v17.6l4.3-4.1 2.9 6.6 2.9-1.2-2.8-6.5h6.1z" fill="#15171a" stroke="#fff" stroke-width="1.3" stroke-linejoin="round"/></svg>';
  scene.append(ghost);
  const inOut = t => t < 0.5 ? 8 * t ** 4 : 1 - (-2 * t + 2) ** 4 / 2;
  let si = 0, t0 = performance.now(), from = steps[0].to(), real = null;
  const c = { x: from.x, y: from.y };
  function sim(now) {
    let st = steps[si];
    while (now - t0 > st.move + st.hold) { t0 += st.move + st.hold; from = st.to(); si = (si + 1) % steps.length; st = steps[si]; }
    const k = inOut(Math.min(1, (now - t0) / st.move)), to = st.to(), dx = to.x - from.x, dy = to.y - from.y, bow = Math.sin(Math.PI * k) * 0.12;
    c.x = from.x + dx * k - dy * bow; c.y = from.y + dy * k + dx * bow;
  }
  const toScene = e => { const r = scene.getBoundingClientRect(); return { x: (e.clientX - r.left) / s, y: (e.clientY - r.top) / s }; };
  const onMove = e => { real = toScene(e); };
  const onLeave = () => { if (real) { from = { ...real }; t0 = performance.now(); } real = null; };
  root.addEventListener('pointermove', onMove); root.addEventListener('pointerleave', onLeave);

  const mags = [A, B].map(el => ({ el, label: el.firstElementChild, S: { x: 0, y: 0, vx: 0, vy: 0 }, L: { x: 0, y: 0, vx: 0, vy: 0 } }));
  const step = (p, tx, ty, k, d, dt) => { p.vx += (-k * (p.x - tx) - d * p.vx) * dt; p.vy += (-k * (p.y - ty) - d * p.vy) * dt; p.x += p.vx * dt; p.y += p.vy * dt; };
  let last = performance.now(), raf;
  function frame(now) {
    const dt = Math.min(0.032, (now - last) / 1000); last = now;
    if (real) { c.x = real.x; c.y = real.y; } else sim(now);
    ghost.style.transform = `translate(${c.x - 1}px, ${c.y - 1}px)`;
    ghost.style.opacity = real ? 0 : 1;
    for (const m of mags) {
      const b = box(m.el), dx = c.x - (b.x + b.w / 2), dy = c.y - (b.y + b.h / 2), d = Math.hypot(dx, dy);
      const f = reduce ? 0 : Math.max(0, 1 - d / PARAMS.radius);   // reduced motion: no pull; the hover colour still changes     // strongest near the centre, fading to nothing at the edge of the radius
      const tx = dx * PARAMS.strength * f, ty = dy * PARAMS.strength * f;
      for (let i = 0; i < 2; i++) { step(m.S, tx, ty, 170, 16, dt / 2); step(m.L, tx * 0.55, ty * 0.55, 220, 18, dt / 2); }
      m.el.style.transform = `translate(${m.S.x}px, ${m.S.y}px)`;
      m.label.style.transform = `translate(${m.L.x}px, ${m.L.y}px)`;
      m.el.classList.toggle('hot', c.x > b.x + m.S.x && c.x < b.x + b.w + m.S.x && c.y > b.y + m.S.y && c.y < b.y + b.h + m.S.y);
    }
    raf = requestAnimationFrame(frame);
  }
  raf = requestAnimationFrame(frame);
  return () => { cancelAnimationFrame(raf); ro.disconnect(); root.removeEventListener('pointermove', onMove); root.removeEventListener('pointerleave', onLeave); root.remove(); };
}
