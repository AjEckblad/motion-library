// Image follow on a project list: hovering a row brings up a preview of that project, which trails the cursor with a lag
// and leans into the direction it is dragged. Moving to another row slides the next image into the same frame, so the
// preview never blinks out between rows. It feels right because the image behaves like a card held loosely in your hand.
const PARAMS = { lag: 0.12, tilt: 0.5, swap: 280 };

export default function (stage) {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const W = 540, H = 380;
  const rows = [['Field notes app', 'Mobile app', '2024'], ['Harbour museum wayfinding', 'Signage', '2023'], ['Night train booking', 'Web', '2023'], ['Online shop for a ceramics studio', 'E-commerce', '2022'], ['Food bank annual report', 'Editorial', '2022']];
  const art = [
    `<rect width="180" height="124" fill="#cfe3c8"/><rect x="66" y="14" width="48" height="96" rx="9" fill="#15171a"/><rect x="70" y="20" width="40" height="84" rx="6" fill="#f7f5ef"/><rect x="75" y="28" width="22" height="4" rx="2" fill="#5c8a52"/><rect x="75" y="38" width="30" height="3" rx="1.5" fill="#c9c4b8"/><rect x="75" y="45" width="26" height="3" rx="1.5" fill="#c9c4b8"/><rect x="75" y="56" width="30" height="20" rx="3" fill="#a7c79a"/><rect x="75" y="82" width="30" height="3" rx="1.5" fill="#c9c4b8"/>`,
    `<rect width="180" height="124" fill="#f2c14e"/><rect x="30" y="34" width="120" height="56" rx="6" fill="#15171a"/><path d="M50 62h52M88 50l14 12-14 12" fill="none" stroke="#f2c14e" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/><rect x="112" y="52" width="26" height="4" rx="2" fill="#fff" opacity=".7"/><rect x="112" y="62" width="18" height="4" rx="2" fill="#fff" opacity=".4"/>`,
    `<rect width="180" height="124" fill="#1b2340"/><circle cx="138" cy="34" r="14" fill="#f4e8c1"/><circle cx="144" cy="30" r="12" fill="#1b2340"/><path d="M0 92h180" stroke="#3a4570" stroke-width="2"/><rect x="22" y="72" width="110" height="18" rx="5" fill="#e8615a"/><g fill="#ffe8a3"><rect x="30" y="77" width="10" height="6" rx="1"/><rect x="46" y="77" width="10" height="6" rx="1"/><rect x="62" y="77" width="10" height="6" rx="1"/><rect x="78" y="77" width="10" height="6" rx="1"/><rect x="94" y="77" width="10" height="6" rx="1"/></g><g fill="#c9d1f0"><circle cx="30" cy="22" r="1.4"/><circle cx="70" cy="40" r="1.2"/><circle cx="100" cy="18" r="1.4"/><circle cx="20" cy="50" r="1"/></g>`,
    `<rect width="180" height="124" fill="#efe4d6"/><path d="M48 104c-14 0-16-24-10-40 4-10 4-18 0-24h20c-4 6-4 14 0 24 6 16 4 40-10 40z" fill="#b5694b"/><path d="M100 104c-18 0-22-18-16-34 3-8 10-12 10-22h12c0 10 7 14 10 22 6 16 2 34-16 34z" fill="#6f8f8a"/><ellipse cx="142" cy="96" rx="20" ry="9" fill="#d9b48f"/><path d="M122 96c0 6 9 9 20 9s20-3 20-9" fill="#c09774"/><rect y="104" width="180" height="20" fill="#e2d4c2"/>`,
    `<rect width="180" height="124" fill="#f08c4a"/><g fill="#fff4ea"><rect x="34" y="70" width="16" height="34" rx="2"/><rect x="58" y="56" width="16" height="48" rx="2"/><rect x="82" y="44" width="16" height="60" rx="2"/><rect x="106" y="30" width="16" height="74" rx="2"/></g><rect x="130" y="20" width="16" height="84" rx="2" fill="#15171a"/><rect x="28" y="104" width="124" height="2" fill="#fff4ea"/><rect x="28" y="16" width="40" height="5" rx="2.5" fill="#fff4ea"/>`,
  ];
  const root = document.createElement('div');
  root.className = 'if-root';
  root.innerHTML = `<style>
    .if-root { position: absolute; inset: 0; overflow: hidden; background: #f7f6f2; font-family: system-ui, -apple-system, "Segoe UI", sans-serif; color: #15171a; }
    .if-scene { position: absolute; left: 0; top: 0; width: ${W}px; height: ${H}px; transform-origin: 0 0; }
    .if-head { position: absolute; left: 30px; right: 30px; top: 30px; display: flex; justify-content: space-between; align-items: baseline; }
    .if-head h2 { margin: 0; font-size: 13px; font-weight: 650; letter-spacing: .06em; text-transform: uppercase; }
    .if-head span { font-size: 12px; color: #7a7f85; }
    .if-list { position: absolute; left: 30px; right: 30px; top: 66px; border-top: 1px solid #dedbd3; }
    .if-row { display: flex; align-items: baseline; height: 56px; border-bottom: 1px solid #dedbd3; transition: opacity .2s cubic-bezier(.23,1,.32,1); }
    .if-list.on .if-row:not(.hot) { opacity: .4; }
    .if-t { font-size: 20px; font-weight: 620; letter-spacing: -0.02em; line-height: 56px; transition: transform .2s cubic-bezier(.23,1,.32,1); }
    .if-row.hot .if-t { transform: ${reduce ? 'none' : 'translateX(8px)'}; }
    .if-m { margin-left: auto; font-size: 12px; color: #6b7076; } .if-y { width: 52px; text-align: right; font-size: 12px; color: #6b7076; font-variant-numeric: tabular-nums; }
    .if-prev { position: absolute; left: 0; top: 0; width: 180px; height: 124px; margin: -62px 0 0 -90px; pointer-events: none; z-index: 5; will-change: transform; }
    .if-frame { width: 100%; height: 100%; border-radius: 10px; overflow: hidden; box-shadow: 0 18px 40px -12px rgba(30,25,15,.4); opacity: 0; transform: ${reduce ? 'none' : 'scale(0.95)'}; transition: opacity .2s cubic-bezier(.23,1,.32,1), transform .2s cubic-bezier(.23,1,.32,1); }
    .if-prev.on .if-frame { opacity: 1; transform: none; }
    .if-strip { will-change: transform; } .if-strip svg { display: block; width: 180px; height: 124px; }
    .if-cur { position: absolute; left: 0; top: 0; z-index: 9; pointer-events: none; transition: opacity .2s; filter: drop-shadow(0 1px 1.5px rgba(0,0,0,.3)); }
  </style><div class="if-scene">
    <div class="if-head"><h2>Selected work</h2><span>5 of 23 projects</span></div>
    <div class="if-list">${rows.map(([t, m, y]) => `<div class="if-row"><span class="if-t">${t}</span><span class="if-m">${m}</span><span class="if-y">${y}</span></div>`).join('')}</div>
    <div class="if-prev"><div class="if-frame"><div class="if-strip">${art.map(a => `<svg viewBox="0 0 180 124">${a}</svg>`).join('')}</div></div></div>
  </div>`;
  stage.append(root);
  const scene = root.querySelector('.if-scene'), list = root.querySelector('.if-list'), prev = root.querySelector('.if-prev'), strip = root.querySelector('.if-strip');
  const rowEls = [...scene.querySelectorAll('.if-row')];
  let s = 1;
  const fit = () => { const w = stage.clientWidth, h = stage.clientHeight; s = Math.min(w / W, h / H, 1.3); scene.style.transform = `translate(${(w - W * s) / 2}px, ${(h - H * s) / 2}px) scale(${s})`; };
  const ro = new ResizeObserver(fit); ro.observe(stage); fit();
  const box = el => { let x = 0, y = 0, e = el; while (e && e !== scene) { x += e.offsetLeft; y += e.offsetTop; e = e.offsetParent; } return { x, y, w: el.offsetWidth, h: el.offsetHeight }; };
  const at = (el, fx, fy) => () => { const b = box(el); return { x: b.x + b.w * fx, y: b.y + b.h * fy }; };
  const pt = (x, y) => () => ({ x, y });

  // simulated cursor: slides down the list, pausing on each row; the real pointer takes over while it is on the stage
  const steps = [
    { to: pt(60, 372), move: 300, hold: 300 },
    { to: at(rowEls[0], 0.42, 0.5), move: 800, hold: 900 },
    { to: at(rowEls[1], 0.56, 0.55), move: 600, hold: 900 },
    { to: at(rowEls[2], 0.44, 0.5), move: 600, hold: 900 },
    { to: at(rowEls[3], 0.58, 0.45), move: 600, hold: 900 },
    { to: at(rowEls[4], 0.5, 0.5), move: 600, hold: 900 },
    { to: pt(300, 372), move: 800, hold: 700 },
  ];
  const ghost = document.createElement('div'); ghost.className = 'if-cur';
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

  let px = c.x, py = c.y, rot = 0, active = -1, shown = -1, last = performance.now(), raf;
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    if (real) { c.x = real.x; c.y = real.y; } else sim(now);
    ghost.style.transform = `translate(${c.x - 1}px, ${c.y - 1}px)`;
    ghost.style.opacity = real ? 0 : 1;
    active = -1;
    rowEls.forEach((r, i) => { const b = box(r); if (c.x > b.x && c.x < b.x + b.w && c.y >= b.y && c.y < b.y + b.h) active = i; });
    rowEls.forEach((r, i) => r.classList.toggle('hot', i === active));
    list.classList.toggle('on', active >= 0);
    prev.classList.toggle('on', active >= 0);
    if (active >= 0 && active !== shown) {
      // first appearance jumps straight to the row's image; after that it slides between them
      if (reduce && shown >= 0) strip.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 200 });
      strip.style.transition = shown < 0 || reduce ? 'none' : `transform ${PARAMS.swap}ms cubic-bezier(0.77, 0, 0.175, 1)`;
      strip.style.transform = `translateY(${-124 * active}px)`;
      shown = active;
    }
    if (reduce) {
      // reduced motion: the preview doesn't trail or lean; it sits beside the hovered row and cuts between images with a fade
      if (active >= 0) { const b = box(rowEls[active]); prev.style.transform = `translate(${b.x + b.w - 100}px, ${b.y + b.h / 2}px)`; }
      raf = requestAnimationFrame(frame); return;
    }
    const a = 1 - Math.pow(1 - PARAMS.lag, dt * 60);              // the same lag at any frame rate
    const tx = c.x + 106, ty = c.y;                              // sits just right of the cursor, so the title stays readable
    const vx = (tx - px) * a;
    px += vx; py += (ty - py) * a;
    rot += (Math.max(-12, Math.min(12, vx * PARAMS.tilt * 1.6)) - rot) * Math.min(1, dt * 12);
    prev.style.transform = `translate(${px}px, ${py}px) rotate(${rot}deg)`;
    raf = requestAnimationFrame(frame);
  }
  raf = requestAnimationFrame(frame);
  return () => { cancelAnimationFrame(raf); ro.disconnect(); root.removeEventListener('pointermove', onMove); root.removeEventListener('pointerleave', onLeave); root.remove(); };
}
