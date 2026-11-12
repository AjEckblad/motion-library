// Dock magnification: icons swell as the cursor passes, biggest under it and tapering over a few neighbours on a cosine
// curve. Each icon only scales and slides (transforms), and the slides are worked out from the new sizes, so the row
// spreads apart exactly as wide as the icons grew. It feels right because the target you are heading for grows to meet you.
const PARAMS = { magnify: 1.8, range: 140 };

export default function (stage) {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const W = 540, H = 380, SZ = 38, GAP = 7;
  const g = (bg, d) => ({ bg, d });
  const apps = [
    ['Files', g('linear-gradient(#6cc4ff,#2f8be0)', '<path d="M9 15h9l3 3h12v15H9z" fill="#fff" opacity=".95"/>')],
    ['Mail', g('linear-gradient(#73b8ff,#2c6fe6)', '<rect x="9" y="13" width="24" height="17" rx="2.5" fill="#fff"/><path d="M10 15l11 8 11-8" fill="none" stroke="#2c6fe6" stroke-width="2"/>')],
    ['Calendar', g('#fff', '<rect x="0" y="0" width="42" height="11" fill="#f0473e"/><text x="21" y="33" text-anchor="middle" font-size="18" font-weight="700" fill="#15171a" font-family="system-ui">11</text>')],
    ['Notes', g('linear-gradient(#ffe27a,#f5c518)', '<rect x="9" y="9" width="24" height="25" rx="3" fill="#fffbea"/><path d="M13 17h16M13 22h16M13 27h10" stroke="#d9b440" stroke-width="2" stroke-linecap="round"/>')],
    ['Music', g('linear-gradient(#ff6b8a,#e5294c)', '<path d="M18 29V14l11-2.5v15" fill="none" stroke="#fff" stroke-width="2.4"/><circle cx="15.5" cy="29" r="3.5" fill="#fff"/><circle cx="26.5" cy="26.5" r="3.5" fill="#fff"/>')],
    ['Photos', g('#fff', '<g opacity=".9"><ellipse cx="21" cy="13" rx="4" ry="7" fill="#f7b32b"/><ellipse cx="21" cy="29" rx="4" ry="7" fill="#4dabf7"/><ellipse cx="13" cy="21" rx="7" ry="4" fill="#69db7c"/><ellipse cx="29" cy="21" rx="7" ry="4" fill="#da77f2"/></g>')],
    ['Maps', g('linear-gradient(135deg,#b2f2bb 50%,#d0ebff 50%)', '<path d="M21 9a7 7 0 0 1 7 7c0 6-7 14-7 14s-7-8-7-14a7 7 0 0 1 7-7z" fill="#f0473e"/><circle cx="21" cy="16" r="2.6" fill="#fff"/>')],
    ['Settings', g('linear-gradient(#adb5bd,#6c757d)', '<circle cx="21" cy="21" r="10" fill="none" stroke="#fff" stroke-width="4" stroke-dasharray="4 3.3"/><circle cx="21" cy="21" r="5" fill="#fff"/>')],
    ['Trash', g('rgba(255,255,255,.25)', '<path d="M13 15h16l-1.5 17h-13z" fill="#e9ecef"/><rect x="11" y="12" width="20" height="3" rx="1.5" fill="#e9ecef"/>')],
  ];
  const root = document.createElement('div');
  root.className = 'dk-root';
  root.innerHTML = `<style>
    .dk-root { position: absolute; inset: 0; overflow: hidden; background: radial-gradient(120% 90% at 20% 10%, #f4a361 0, transparent 55%), radial-gradient(90% 80% at 90% 30%, #8e6bd8 0, transparent 60%), linear-gradient(#3b4a7a, #1f2747); font-family: system-ui, -apple-system, "Segoe UI", sans-serif; }
    .dk-scene { position: absolute; left: 0; top: 0; width: ${W}px; height: ${H}px; transform-origin: 0 0; }
    .dk-menu { position: absolute; left: 0; right: 0; top: 0; border-radius: 6px; height: 22px; background: rgba(20,22,40,.35); backdrop-filter: blur(8px); color: #fff; font-size: 11px; display: flex; align-items: center; gap: 14px; padding: 0 12px; }
    .dk-menu b { font-weight: 700; } .dk-menu span:last-child { margin-left: auto; }
    .dk-win { position: absolute; left: 70px; top: 52px; width: 300px; height: 190px; border-radius: 10px; background: rgba(250,250,252,.92); box-shadow: 0 20px 50px rgba(10,10,30,.35); }
    .dk-win i { position: absolute; top: 10px; width: 9px; height: 9px; border-radius: 50%; }
    .dk-win p { position: absolute; left: 18px; right: 18px; top: 40px; margin: 0; font-size: 12px; line-height: 1.6; color: #3a3e43; }
    .dk-plate { position: absolute; bottom: 10px; height: ${SZ + 14}px; border-radius: 16px; background: rgba(255,255,255,.22); box-shadow: inset 0 0 0 1px rgba(255,255,255,.3); backdrop-filter: blur(14px); transform-origin: 50% 100%; will-change: transform; }
    .dk-ico { position: absolute; bottom: 17px; width: ${SZ}px; height: ${SZ}px; border-radius: 10px; transform-origin: 50% 100%; will-change: transform; box-shadow: 0 2px 5px rgba(0,0,0,.25); overflow: hidden; }
    .dk-ico svg { display: block; width: 100%; height: 100%; }
    .dk-tip { position: absolute; bottom: 0; left: 0; padding: 4px 9px; border-radius: 6px; background: rgba(30,32,40,.85); color: #fff; font-size: 11.5px; font-weight: 550; white-space: nowrap; pointer-events: none; opacity: 0; transition: opacity .15s cubic-bezier(.23,1,.32,1); }
    .dk-cur { position: absolute; left: 0; top: 0; z-index: 9; pointer-events: none; transition: opacity .2s; filter: drop-shadow(0 1px 1.5px rgba(0,0,0,.35)); }
  </style><div class="dk-scene">
    <div class="dk-menu"><b>Files</b><span>File</span><span>Edit</span><span>View</span><span>Tue 11 Nov  9:41</span></div>
    <div class="dk-win"><i style="left:12px;background:#ff5f57"></i><i style="left:26px;background:#febc2e"></i><i style="left:40px;background:#28c840"></i><p>Quarterly plan.pdf<br>Interview notes.txt<br>Homepage draft.fig<br>Receipts, October</p></div>
    <div class="dk-plate"></div>${apps.map(([, a]) => `<div class="dk-ico" style="background:${a.bg}"><svg viewBox="0 0 42 42" preserveAspectRatio="xMidYMid meet">${a.d}</svg></div>`).join('')}<div class="dk-tip"></div>
  </div>`;
  stage.append(root);
  const scene = root.querySelector('.dk-scene'), plate = root.querySelector('.dk-plate'), tip = root.querySelector('.dk-tip');
  const icons = [...scene.querySelectorAll('.dk-ico')];
  let s = 1;
  const fit = () => { const w = stage.clientWidth, h = stage.clientHeight; s = Math.min(w / W, h / H, 1.3); scene.style.transform = `translate(${(w - W * s) / 2}px, ${(h - H * s) / 2}px) scale(${s})`; };
  const ro = new ResizeObserver(fit); ro.observe(stage); fit();
  // resting layout: icons centred along the bottom
  const n = apps.length, baseW = n * SZ + (n - 1) * GAP, x0 = (W - baseW) / 2;
  const centre = i => x0 + i * (SZ + GAP) + SZ / 2, dockY = H - 17 - SZ / 2;
  icons.forEach((el, i) => { el.style.left = `${centre(i) - SZ / 2}px`; });
  plate.style.left = `${x0 - 7}px`; plate.style.width = `${baseW + 14}px`;
  const pt = (x, y) => () => ({ x, y });

  // simulated cursor: drops onto the dock, sweeps along it with pauses, then leaves; the real pointer takes over while it is on the stage
  const steps = [
    { to: pt(420, 200), move: 300, hold: 400 },
    { to: pt(centre(1), dockY + 4), move: 900, hold: 700 },
    { to: pt(centre(4) + 6, dockY + 2), move: 900, hold: 700 },
    { to: pt(centre(7), dockY + 6), move: 900, hold: 700 },
    { to: pt(centre(5) - 10, dockY), move: 600, hold: 600 },
    { to: pt(400, 150), move: 900, hold: 600 },
  ];
  const ghost = document.createElement('div'); ghost.className = 'dk-cur';
  ghost.innerHTML = '<svg width="17" height="24" viewBox="-1 -1 17 24"><path d="M0 0v17.6l4.3-4.1 2.9 6.6 2.9-1.2-2.8-6.5h6.1z" fill="#15171a" stroke="#fff" stroke-width="1.3" stroke-linejoin="round"/></svg>';
  scene.append(ghost);
  const inOut = t => t < 0.5 ? 8 * t ** 4 : 1 - (-2 * t + 2) ** 4 / 2;
  let si = 0, t0 = performance.now(), from = steps[0].to(), real = null;
  const c = { x: from.x, y: from.y };
  function sim(now) {
    let st = steps[si];
    while (now - t0 > st.move + st.hold) { t0 += st.move + st.hold; from = st.to(); si = (si + 1) % steps.length; st = steps[si]; }
    const k = inOut(Math.min(1, (now - t0) / st.move)), to = st.to(), dx = to.x - from.x, dy = to.y - from.y, bow = Math.sin(Math.PI * k) * 0.05;
    c.x = from.x + dx * k - dy * bow; c.y = from.y + dy * k + dx * bow;
  }
  const toScene = e => { const r = scene.getBoundingClientRect(); return { x: (e.clientX - r.left) / s, y: (e.clientY - r.top) / s }; };
  const onMove = e => { real = toScene(e); };
  const onLeave = () => { if (real) { from = { ...real }; t0 = performance.now(); } real = null; };
  root.addEventListener('pointermove', onMove); root.addEventListener('pointerleave', onLeave);

  let p = 0, fx = c.x, last = performance.now(), raf;
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    if (real) { c.x = real.x; c.y = real.y; } else sim(now);
    ghost.style.transform = `translate(${c.x - 1}px, ${c.y - 1}px)`;
    ghost.style.opacity = real ? 0 : 1;
    // presence eases in and out, so entering or leaving the dock grows and settles instead of snapping
    const over = c.y > H - SZ - 40 && c.x > x0 - 20 && c.x < x0 + baseW + 20;
    p += ((over ? 1 : 0) - p) * (1 - Math.exp(-dt * 14));
    fx += (c.x - fx) * (1 - Math.exp(-dt * 30));
    // reduced motion: icons keep their size and place; the name label still shows over the one under the cursor
    const sc = icons.map((_, i) => { const d = Math.abs(fx - centre(i)); return 1 + (reduce ? 0 : PARAMS.magnify - 1) * p * (d < PARAMS.range ? (Math.cos(Math.PI * d / PARAMS.range) + 1) / 2 : 0); });
    const total = sc.reduce((a, v) => a + v * SZ, 0) + (n - 1) * GAP;
    // keep the point under the cursor still: grow outward from it rather than from the dock's centre
    const anchor = Math.max(0, Math.min(1, (fx - x0) / baseW));
    let x = x0 + baseW * anchor - total * anchor, best = -1, bestD = 1e9;
    icons.forEach((el, i) => {
      const w = sc[i] * SZ, cx = x + w / 2;
      el.style.transform = `translateX(${cx - centre(i)}px) scale(${sc[i]})`;
      if (over && Math.abs(c.x - cx) < bestD) { bestD = Math.abs(c.x - cx); best = i; }
      x += w + GAP;
    });
    plate.style.transform = `translateX(${(x0 + baseW * anchor - total * anchor) - x0}px) scaleX(${(total + 14) / (baseW + 14)})`;
    plate.style.transformOrigin = '0 100%';
    if (best >= 0 && bestD < SZ) {
      let bx = x0 + baseW * anchor - total * anchor; for (let i = 0; i < best; i++) bx += sc[i] * SZ + GAP;
      tip.textContent = apps[best][0];
      tip.style.transform = `translate(${bx + sc[best] * SZ / 2 - tip.offsetWidth / 2}px, ${-(17 + sc[best] * SZ + 10)}px)`;
      tip.style.opacity = 1;
    } else tip.style.opacity = 0;
    raf = requestAnimationFrame(frame);
  }
  raf = requestAnimationFrame(frame);
  return () => { cancelAnimationFrame(raf); ro.disconnect(); root.removeEventListener('pointermove', onMove); root.removeEventListener('pointerleave', onLeave); root.remove(); };
}
