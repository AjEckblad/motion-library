// Sliding underline in a site nav: one underline travels to whichever link is hovered and goes home to the current page
// when the cursor leaves the nav. Its two ends ride separate springs, the leading end quicker than the trailing one, so the
// bar stretches as it travels and gathers up when it lands. It feels right because one object moving is easier to follow than links blinking on and off.
const PARAMS = { stiffness: 260, stretch: 0.45 };

export default function (stage) {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const W = 540, H = 380;
  const links = ['Work', 'Services', 'Studio', 'Journal', 'Contact'], current = 3;
  const root = document.createElement('div');
  root.className = 'us-root';
  root.innerHTML = `<style>
    .us-root { position: absolute; inset: 0; overflow: hidden; background: #fff; font-family: system-ui, -apple-system, "Segoe UI", sans-serif; color: #15171a; }
    .us-scene { position: absolute; left: 0; top: 0; width: ${W}px; height: ${H}px; transform-origin: 0 0; }
    .us-bar { position: absolute; left: 0; right: 0; top: 0; height: 68px; display: flex; align-items: center; padding: 0 28px; border-bottom: 1px solid #eceef0; }
    .us-mark { width: 24px; height: 24px; border-radius: 7px; background: #b07a00; margin-right: 22px; position: relative; flex: none; } .us-mark::after { content: ''; position: absolute; inset: 7px; border-radius: 50%; background: #fff; }
    .us-nav { position: relative; display: flex; gap: 4px; height: 100%; align-items: center; }
    .us-link { padding: 0 11px; height: 100%; display: flex; align-items: center; font-size: 14px; font-weight: 560; color: #6b7076; transition: color .15s ease; }
    .us-link.hot, .us-link.cur { color: #15171a; }
    .us-line { position: absolute; left: 0; bottom: -1px; width: 100px; height: 2.5px; border-radius: 2px; background: #15171a; transform-origin: 0 50%; will-change: transform; }
    .us-cta { margin-left: auto; height: 34px; padding: 0 14px; border-radius: 999px; background: #15171a; color: #fff; font-size: 12.5px; font-weight: 620; display: flex; align-items: center; white-space: nowrap; }
    .us-body { position: absolute; left: 28px; right: 28px; top: 100px; }
    .us-body h1 { margin: 0; font-size: 40px; font-weight: 740; letter-spacing: -0.04em; }
    .us-body p { margin: 6px 0 22px; font-size: 13.5px; color: #5b6066; }
    .us-post { display: flex; gap: 14px; align-items: center; padding: 12px 0; border-top: 1px solid #eceef0; }
    .us-thumb { width: 64px; height: 44px; border-radius: 8px; flex: none; }
    .us-post b { display: block; font-size: 14.5px; font-weight: 650; letter-spacing: -0.01em; } .us-post span { font-size: 12px; color: #7a7f85; }
    .us-cur { position: absolute; left: 0; top: 0; z-index: 9; pointer-events: none; transition: opacity .2s; filter: drop-shadow(0 1px 1.5px rgba(0,0,0,.3)); }
  </style><div class="us-scene">
    <div class="us-bar"><div class="us-mark"></div><nav class="us-nav">${links.map((l, i) => `<span class="us-link${i === current ? ' cur' : ''}">${l}</span>`).join('')}<i class="us-line"></i></nav><span class="us-cta">Get in touch</span></div>
    <div class="us-body"><h1>Journal</h1><p>Notes on building small, careful products.</p>
      <div class="us-post"><i class="us-thumb" style="background:linear-gradient(135deg,#ffd8a8,#f08c4a)"></i><div><b>How we price fixed-scope projects</b><span>Business · 4 min read</span></div></div>
      <div class="us-post"><i class="us-thumb" style="background:linear-gradient(135deg,#c5f6fa,#3bc9db)"></i><div><b>Designing empty states people actually read</b><span>Design · 7 min read</span></div></div>
    </div>
  </div>`;
  stage.append(root);
  const scene = root.querySelector('.us-scene'), nav = root.querySelector('.us-nav'), line = root.querySelector('.us-line');
  const L = [...scene.querySelectorAll('.us-link')];
  let s = 1;
  const fit = () => { const w = stage.clientWidth, h = stage.clientHeight; s = Math.min(w / W, h / H, 1.3); scene.style.transform = `translate(${(w - W * s) / 2}px, ${(h - H * s) / 2}px) scale(${s})`; };
  const ro = new ResizeObserver(fit); ro.observe(stage); fit();
  const box = el => { let x = 0, y = 0, e = el; while (e && e !== scene) { x += e.offsetLeft; y += e.offsetTop; e = e.offsetParent; } return { x, y, w: el.offsetWidth, h: el.offsetHeight }; };
  const at = (el, fx, fy) => () => { const b = box(el); return { x: b.x + b.w * fx, y: b.y + b.h * fy }; };
  const pt = (x, y) => () => ({ x, y });

  // simulated cursor: browses the nav link by link, then drops into the page; the real pointer takes over while it is on the stage
  const steps = [
    { to: pt(120, 250), move: 300, hold: 500 },
    { to: at(L[0], 0.5, 0.62), move: 800, hold: 800 },
    { to: at(L[1], 0.5, 0.6), move: 380, hold: 700 },
    { to: at(L[2], 0.5, 0.64), move: 380, hold: 700 },
    { to: at(L[4], 0.45, 0.6), move: 600, hold: 900 },
    { to: at(L[1], 0.55, 0.6), move: 700, hold: 800 },
    { to: pt(330, 230), move: 800, hold: 1000 },
  ];
  const ghost = document.createElement('div'); ghost.className = 'us-cur';
  ghost.innerHTML = '<svg width="17" height="24" viewBox="-1 -1 17 24"><path d="M0 0v17.6l4.3-4.1 2.9 6.6 2.9-1.2-2.8-6.5h6.1z" fill="#15171a" stroke="#fff" stroke-width="1.3" stroke-linejoin="round"/></svg>';
  scene.append(ghost);
  const inOut = t => t < 0.5 ? 8 * t ** 4 : 1 - (-2 * t + 2) ** 4 / 2;
  let si = 0, t0 = performance.now(), from = steps[0].to(), real = null;
  const c = { x: from.x, y: from.y };
  function sim(now) {
    let st = steps[si];
    while (now - t0 > st.move + st.hold) { t0 += st.move + st.hold; from = st.to(); si = (si + 1) % steps.length; st = steps[si]; }
    const k = inOut(Math.min(1, (now - t0) / st.move)), to = st.to(), dx = to.x - from.x, dy = to.y - from.y, bow = Math.sin(Math.PI * k) * 0.08;
    c.x = from.x + dx * k - dy * bow; c.y = from.y + dy * k + dx * bow;
  }
  const toScene = e => { const r = scene.getBoundingClientRect(); return { x: (e.clientX - r.left) / s, y: (e.clientY - r.top) / s }; };
  const onMove = e => { real = toScene(e); };
  const onLeave = () => { if (real) { from = { ...real }; t0 = performance.now(); } real = null; };
  root.addEventListener('pointermove', onMove); root.addEventListener('pointerleave', onLeave);

  // the underline's two ends, in nav coordinates; each rides a critically damped spring
  const nb = () => box(nav);
  const span = i => ({ l: L[i].offsetLeft + 11, r: L[i].offsetLeft + L[i].offsetWidth - 11 });
  const home = span(current);
  const left = { x: home.l, v: 0 }, right = { x: home.r, v: 0 };
  const spring = (p, t, k, dt) => { p.v += (-k * (p.x - t) - 2 * Math.sqrt(k) * p.v) * dt; p.x += p.v * dt; };
  let last = performance.now(), raf;
  function frame(now) {
    const dt = Math.min(0.032, (now - last) / 1000); last = now;
    if (real) { c.x = real.x; c.y = real.y; } else sim(now);
    ghost.style.transform = `translate(${c.x - 1}px, ${c.y - 1}px)`;
    ghost.style.opacity = real ? 0 : 1;
    const n = nb(); let hot = -1;
    L.forEach((el, i) => { const x = n.x + el.offsetLeft; if (c.y > n.y && c.y < n.y + n.h && c.x >= x && c.x < x + el.offsetWidth) hot = i; });
    L.forEach((el, i) => el.classList.toggle('hot', i === hot));
    const t = span(hot >= 0 ? hot : current);
    const goingRight = t.l > left.x;
    const fast = PARAMS.stiffness, slow = PARAMS.stiffness * (1 - PARAMS.stretch);
    // reduced motion: the underline doesn't slide or stretch; it cuts to the new link and fades in there
    if (reduce) { if (t.l !== left.x) line.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 180 }); left.x = t.l; right.x = t.r; }
    else for (let i = 0; i < 2; i++) { spring(left, t.l, goingRight ? slow : fast, dt / 2); spring(right, t.r, goingRight ? fast : slow, dt / 2); }
    line.style.transform = `translateX(${left.x}px) scaleX(${Math.max(0.02, (right.x - left.x) / 100)})`;
    raf = requestAnimationFrame(frame);
  }
  raf = requestAnimationFrame(frame);
  return () => { cancelAnimationFrame(raf); ro.disconnect(); root.removeEventListener('pointermove', onMove); root.removeEventListener('pointerleave', onLeave); root.remove(); };
}
