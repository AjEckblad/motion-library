// Directional fill on call-to-action buttons: the dark fill sweeps in from whichever side the cursor came through, and
// sweeps out toward the side it leaves by, using a clip-path on a filled copy of the button. Leaving halfway through an
// entry reverses from wherever the fill has got to. It feels right because the button seems to be pushed by the cursor itself.
const PARAMS = { duration: 240, exit: 200 };

export default function (stage) {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const W = 540, H = 380;
  const btn = (label, cls = '') => `<button class="df-btn ${cls}" type="button"><span class="df-lab">${label}</span><span class="df-fill"><span class="df-lab">${label}</span></span></button>`;
  const root = document.createElement('div');
  root.className = 'df-root';
  root.innerHTML = `<style>
    .df-root { position: absolute; inset: 0; overflow: hidden; background: #e9ece6; font-family: system-ui, -apple-system, "Segoe UI", sans-serif; color: #15171a; }
    .df-scene { position: absolute; left: 0; top: 0; width: ${W}px; height: ${H}px; transform-origin: 0 0; }
    .df-panel { position: absolute; left: 30px; right: 30px; top: 30px; bottom: 30px; border-radius: 18px; background: #fbfbf8; box-shadow: 0 0 0 1px rgba(20,24,30,.06); }
    .df-h { position: absolute; left: 36px; top: 34px; margin: 0; font-size: 30px; line-height: 1.05; font-weight: 720; letter-spacing: -0.03em; }
    .df-p { position: absolute; left: 36px; top: 108px; margin: 0; font-size: 13.5px; color: #5b6066; }
    .df-row { position: absolute; left: 36px; top: 148px; display: flex; gap: 14px; }
    .df-btn { position: relative; height: 52px; width: 196px; border: 1.5px solid #15171a; border-radius: 12px; background: transparent; color: #15171a; font: 620 14.5px system-ui, -apple-system, sans-serif; cursor: pointer; padding: 0; overflow: hidden; }
    .df-btn > .df-lab, .df-fill { position: absolute; inset: 0; display: grid; place-items: center; pointer-events: none; }
    .df-fill { background: #15171a; color: #fff; clip-path: inset(0 100% 0 0); }
    .df-alt { border-color: #2f6b3a; color: #2f6b3a; } .df-alt .df-fill { background: #2f6b3a; }
    .df-news { position: absolute; left: 36px; right: 36px; top: 236px; padding-top: 18px; border-top: 1px solid #e3e5df; }
    .df-news label { display: block; font-size: 12px; font-weight: 600; color: #3a3e43; margin-bottom: 8px; }
    .df-form { display: flex; gap: 10px; }
    .df-in { width: 196px; height: 44px; box-sizing: border-box; border-radius: 10px; border: 1px solid #d5d8d1; background: #fff; padding: 0 12px; display: flex; align-items: center; font-size: 13px; color: #8a8f94; }
    .df-form .df-btn { height: 44px; width: 120px; font-size: 13.5px; border-radius: 10px; }
    .df-cur { position: absolute; left: 0; top: 0; z-index: 9; pointer-events: none; transition: opacity .2s; filter: drop-shadow(0 1px 1.5px rgba(0,0,0,.3)); }
  </style><div class="df-scene"><div class="df-panel">
    <h2 class="df-h">Ready when you are.</h2>
    <p class="df-p">Setting up takes about two minutes. Bring your team later.</p>
    <div class="df-row">${btn('Start free trial')}${btn('Book a demo', 'df-alt')}</div>
    <div class="df-news"><label>Or get one short email a month</label><div class="df-form"><div class="df-in">you@example.com</div>${btn('Subscribe')}</div></div>
  </div></div>`;
  stage.append(root);
  const scene = root.querySelector('.df-scene');
  let s = 1;
  const fit = () => { const w = stage.clientWidth, h = stage.clientHeight; s = Math.min(w / W, h / H, 1.3); scene.style.transform = `translate(${(w - W * s) / 2}px, ${(h - H * s) / 2}px) scale(${s})`; };
  const ro = new ResizeObserver(fit); ro.observe(stage); fit();
  const box = el => { let x = 0, y = 0, e = el; while (e && e !== scene) { x += e.offsetLeft; y += e.offsetTop; e = e.offsetParent; } return { x, y, w: el.offsetWidth, h: el.offsetHeight }; };
  const at = (el, fx, fy) => () => { const b = box(el); return { x: b.x + b.w * fx, y: b.y + b.h * fy }; };
  const pt = (x, y) => () => ({ x, y });
  const [A, B, C] = scene.querySelectorAll('.df-btn');

  // simulated cursor: enters and leaves each button through a different side; the real pointer takes over while it is on the stage
  const steps = [
    { to: pt(20, 205), move: 300, hold: 300 },
    { to: at(A, 0.5, 0.5), move: 800, hold: 900 },        // in from the left
    { to: at(C, 0.5, 2.4), move: 900, hold: 300 },        // out through the bottom
    { to: at(C, 0.5, 0.5), move: 600, hold: 900 },        // in from the bottom
    { to: at(B, 1.12, 0.5), move: 900, hold: 200 },        // out through the top
    { to: at(B, 0.55, 0.5), move: 600, hold: 900 },       // in from the right
    { to: at(B, 0.4, -2.2), move: 700, hold: 500 },       // out through the top
  ];
  const ghost = document.createElement('div'); ghost.className = 'df-cur';
  ghost.innerHTML = '<svg width="17" height="24" viewBox="-1 -1 17 24"><path d="M0 0v17.6l4.3-4.1 2.9 6.6 2.9-1.2-2.8-6.5h6.1z" fill="#15171a" stroke="#fff" stroke-width="1.3" stroke-linejoin="round"/></svg>';
  scene.append(ghost);
  const inOut = t => t < 0.5 ? 8 * t ** 4 : 1 - (-2 * t + 2) ** 4 / 2;
  let si = 0, t0 = performance.now(), from = steps[0].to(), real = null;
  const c = { x: from.x, y: from.y };
  function sim(now) {
    let st = steps[si];
    while (now - t0 > st.move + st.hold) { t0 += st.move + st.hold; from = st.to(); si = (si + 1) % steps.length; st = steps[si]; }
    const k = inOut(Math.min(1, (now - t0) / st.move)), to = st.to(), dx = to.x - from.x, dy = to.y - from.y, bow = Math.sin(Math.PI * k) * 0.06;
    c.x = from.x + dx * k - dy * bow; c.y = from.y + dy * k + dx * bow;
  }
  const toScene = e => { const r = scene.getBoundingClientRect(); return { x: (e.clientX - r.left) / s, y: (e.clientY - r.top) / s }; };
  const onMove = e => { real = toScene(e); };
  const onLeave = () => { if (real) { from = { ...real }; t0 = performance.now(); } real = null; };
  root.addEventListener('pointermove', onMove); root.addEventListener('pointerleave', onLeave);

  // where the fill collapses to on each side
  const edge = { left: 'inset(0 100% 0 0)', right: 'inset(0 0 0 100%)', top: 'inset(0 0 100% 0)', bottom: 'inset(100% 0 0 0)' };
  const sideOf = (b, x, y) => { const dx = (x - b.x - b.w / 2) / b.w, dy = (y - b.y - b.h / 2) / b.h; return Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? 'left' : 'right') : (dy < 0 ? 'top' : 'bottom'); };
  const items = [A, B, C].map(el => ({ el, fill: el.querySelector('.df-fill'), inside: false, anim: null }));
  // reduced motion: the fill fades in and out in place instead of sweeping across from a side
  if (reduce) items.forEach(it => { it.fill.style.opacity = 0; });
  function sweep(it, kf, ms) {
    if (reduce) {
      const o = getComputedStyle(it.fill).opacity, to = kf === 'inset(0 0 0 0)' ? 1 : 0;
      it.anim?.cancel(); it.fill.style.clipPath = 'none'; it.fill.style.opacity = to;
      it.anim = it.fill.animate([{ opacity: o }, { opacity: to }], { duration: ms, easing: 'cubic-bezier(0.23, 1, 0.32, 1)' });
      return;
    }
    const now = getComputedStyle(it.fill).clipPath;              // start from wherever the last sweep got to
    it.anim?.cancel();
    it.fill.style.clipPath = kf;
    it.anim = it.fill.animate([{ clipPath: now }, { clipPath: kf }], { duration: ms, easing: 'cubic-bezier(0.23, 1, 0.32, 1)' });
  }
  let lx = c.x, ly = c.y, raf;
  function frame(now) {
    if (real) { c.x = real.x; c.y = real.y; } else sim(now);
    ghost.style.transform = `translate(${c.x - 1}px, ${c.y - 1}px)`;
    ghost.style.opacity = real ? 0 : 1;
    for (const it of items) {
      const b = box(it.el), inside = c.x > b.x && c.x < b.x + b.w && c.y > b.y && c.y < b.y + b.h;
      if (inside && !it.inside) { const side = sideOf(b, lx, ly); it.fill.style.clipPath = edge[side]; sweep(it, 'inset(0 0 0 0)', PARAMS.duration); }
      if (!inside && it.inside) {
        sweep(it, edge[sideOf(b, c.x, c.y)], PARAMS.exit);   // collapse onto the exit side: the fill leaves the way the cursor went
      }
      it.inside = inside;
    }
    lx = c.x; ly = c.y;
    raf = requestAnimationFrame(frame);
  }
  raf = requestAnimationFrame(frame);
  return () => { cancelAnimationFrame(raf); ro.disconnect(); items.forEach(it => it.anim?.cancel()); root.removeEventListener('pointermove', onMove); root.removeEventListener('pointerleave', onLeave); root.remove(); };
}
