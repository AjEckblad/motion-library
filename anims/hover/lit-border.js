// Lit border on a feature grid: every card's edge and surface catch a soft light centred on the cursor, so the card under
// it glows brightest and its neighbours pick up the spill along their nearest edges. One radial gradient per card, positioned
// in that card's own coordinates, does all of it. It feels right because the grid reacts like one surface under one lamp.
const PARAMS = { radius: 220, glow: 0.2 };

export default function (stage) {
  const W = 540, H = 380;
  const icon = d => `<svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`;
  const feats = [
    [icon('<path d="M3 9h12M9 3v12"/>'), 'Instant previews', 'Every branch gets its own link to share.'],
    [icon('<circle cx="9" cy="9" r="6"/><path d="M9 5.5V9l2.5 1.5"/>'), 'Scheduling', 'Queue changes to go live at 9 a.m.'],
    [icon('<path d="M4 14V8M9 14V4M14 14v-4"/>'), 'Analytics', 'Visits and sources, no cookie banner.'],
    [icon('<rect x="3" y="7.5" width="12" height="7.5" rx="2"/><path d="M6 7.5V5.5a3 3 0 0 1 6 0v2"/>'), 'Password pages', 'Keep drafts private until launch day.'],
    [icon('<path d="M3 5h12M3 9h8M3 13h5"/>'), 'Audit history', 'See who changed what, and roll it back.'],
    [icon('<path d="M5 12.5 9 4l4 8.5M6.5 9.5h5"/>'), 'Image resizing', 'Compressed on upload.'],
  ];
  const root = document.createElement('div');
  root.className = 'lb2-root';
  root.innerHTML = `<style>
    .lb2-root { position: absolute; inset: 0; overflow: hidden; background: #0c0d10; font-family: system-ui, -apple-system, "Segoe UI", sans-serif; color: #eef0f3; }
    .lb2-scene { position: absolute; left: 0; top: 0; width: ${W}px; height: ${H}px; transform-origin: 0 0; }
    .lb2-head { position: absolute; left: 28px; right: 28px; top: 26px; }
    .lb2-head small { font-size: 11px; font-weight: 650; letter-spacing: .08em; text-transform: uppercase; color: #f2b84b; }
    .lb2-head h2 { margin: 6px 0 0; font-size: 24px; font-weight: 720; letter-spacing: -0.03em; }
    .lb2-grid { position: absolute; left: 28px; right: 28px; top: 104px; display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
    .lb2-card { position: relative; min-height: 124px; border-radius: 12px; background: #15171c; padding: 16px 14px; box-sizing: border-box; overflow: hidden; }
    .lb2-card::before, .lb2-card::after { content: ''; position: absolute; inset: 0; border-radius: inherit; pointer-events: none; opacity: var(--on, 0); }
    .lb2-card::before { padding: 1px; background: radial-gradient(${PARAMS.radius}px circle at var(--x) var(--y), rgba(255,222,160,1), rgba(255,200,120,.3) 40%, transparent 72%);
      -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0); -webkit-mask-composite: xor; mask: linear-gradient(#000 0 0) content-box exclude, linear-gradient(#000 0 0); }
    .lb2-card::after { background: radial-gradient(${PARAMS.radius * 0.8}px circle at var(--x) var(--y), rgba(255,214,140,${PARAMS.glow}), transparent 70%); }
    .lb2-rest { position: absolute; inset: 0; border-radius: inherit; box-shadow: inset 0 0 0 1px #23262d; pointer-events: none; }
    .lb2-ico { width: 30px; height: 30px; border-radius: 8px; background: #20232a; color: #f2b84b; display: grid; place-items: center; }
    .lb2-card b { display: block; margin-top: 12px; font-size: 13.5px; font-weight: 650; }
    .lb2-card span { display: block; margin-top: 4px; font-size: 11.5px; line-height: 1.4; color: #8b9098; }
    .lb2-cur { position: absolute; left: 0; top: 0; z-index: 9; pointer-events: none; transition: opacity .2s; filter: drop-shadow(0 1px 1.5px rgba(0,0,0,.5)); }
  </style><div class="lb2-scene">
    <div class="lb2-head"><small>Everything included</small><h2>The boring parts, handled.</h2></div>
    <div class="lb2-grid">${feats.map(([ic, t, d]) => `<div class="lb2-card"><i class="lb2-rest"></i><div class="lb2-ico">${ic}</div><b>${t}</b><span>${d}</span></div>`).join('')}</div>
  </div>`;
  stage.append(root);
  const scene = root.querySelector('.lb2-scene'), grid = root.querySelector('.lb2-grid');
  const cards = [...scene.querySelectorAll('.lb2-card')];
  let s = 1;
  const fit = () => { const w = stage.clientWidth, h = stage.clientHeight; s = Math.min(w / W, h / H, 1.3); scene.style.transform = `translate(${(w - W * s) / 2}px, ${(h - H * s) / 2}px) scale(${s})`; };
  const ro = new ResizeObserver(fit); ro.observe(stage); fit();
  const box = el => { let x = 0, y = 0, e = el; while (e && e !== scene) { x += e.offsetLeft; y += e.offsetTop; e = e.offsetParent; } return { x, y, w: el.offsetWidth, h: el.offsetHeight }; };
  const at = (el, fx, fy) => () => { const b = box(el); return { x: b.x + b.w * fx, y: b.y + b.h * fy }; };
  const pt = (x, y) => () => ({ x, y });

  // simulated cursor: wanders over the grid with pauses; the real pointer takes over while it is on the stage
  const steps = [
    { to: pt(60, 365), move: 300, hold: 300 },
    { to: at(cards[0], 0.55, 0.45), move: 800, hold: 700 },
    { to: at(cards[1], 0.9, 0.95), move: 900, hold: 800 },     // on the gap: four cards share the light
    { to: at(cards[5], 0.4, 0.6), move: 800, hold: 700 },
    { to: at(cards[3], 0.6, 0.3), move: 1000, hold: 700 },
    { to: pt(470, 40), move: 900, hold: 700 },
  ];
  const ghost = document.createElement('div'); ghost.className = 'lb2-cur';
  ghost.innerHTML = '<svg width="17" height="24" viewBox="-1 -1 17 24"><path d="M0 0v17.6l4.3-4.1 2.9 6.6 2.9-1.2-2.8-6.5h6.1z" fill="#fff" stroke="#0c0d10" stroke-width="1.3" stroke-linejoin="round"/></svg>';
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

  let on = 0, last = performance.now(), raf;
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    if (real) { c.x = real.x; c.y = real.y; } else sim(now);
    ghost.style.transform = `translate(${c.x - 1}px, ${c.y - 1}px)`;
    ghost.style.opacity = real ? 0 : 1;
    // the light fades in near the grid and out away from it, so it never pops
    const g = box(grid), m = 40, near = c.x > g.x - m && c.x < g.x + g.w + m && c.y > g.y - m && c.y < g.y + g.h + m;
    on += ((near ? 1 : 0) - on) * (1 - Math.exp(-dt * 10));
    for (const el of cards) {
      const b = box(el);
      el.style.setProperty('--x', `${c.x - b.x}px`); el.style.setProperty('--y', `${c.y - b.y}px`); el.style.setProperty('--on', on.toFixed(3));
    }
    raf = requestAnimationFrame(frame);
  }
  raf = requestAnimationFrame(frame);
  return () => { cancelAnimationFrame(raf); ro.disconnect(); root.removeEventListener('pointermove', onMove); root.removeEventListener('pointerleave', onLeave); root.remove(); };
}
