// Spotlight reveal on a product landing page: the app preview sits under a dark veil, and a soft round hole in the
// veil follows the cursor, so the colourful calendar shows only where you look. The light trails the cursor slightly.
// It feels right because it turns a static screenshot into something you explore, and the trailing light reads like a real torch.
const PARAMS = { radius: 110 };

export default function (stage) {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const W = 540, H = 380;
  const days = ['Mon 12', 'Tue 13', 'Wed 14', 'Thu 15', 'Fri 16'];
  // [day, start row, rows, colour, title]
  const ev = [[0, 0, 2, '#4dabf7', 'Standup'], [0, 3, 3, '#ffa94d', 'Design review'], [1, 1, 2, '#69db7c', 'Lunch with Priya'], [1, 4, 2, '#4dabf7', 'Standup'],
    [2, 0, 4, '#da77f2', 'Focus: onboarding flow'], [2, 5, 1, '#ffa94d', '1:1 with Sam'], [3, 2, 2, '#ff8787', 'Quarterly planning'], [3, 4, 2, '#69db7c', 'Gym'],
    [4, 0, 1, '#4dabf7', 'Standup'], [4, 2, 3, '#ffd43b', 'Ship release 4.2'], [4, 5, 1, '#da77f2', 'Demo day']];
  const root = document.createElement('div');
  root.className = 'sl-root';
  root.innerHTML = `<style>
    .sl-root { position: absolute; inset: 0; overflow: hidden; background: #0e0f12; font-family: system-ui, -apple-system, "Segoe UI", sans-serif; color: #f1f3f5; }
    .sl-scene { position: absolute; left: 0; top: 0; width: ${W}px; height: ${H}px; transform-origin: 0 0; }
    .sl-head { position: absolute; left: 0; right: 0; top: 24px; text-align: center; z-index: 2; }
    .sl-head h2 { margin: 0; font-size: 26px; font-weight: 720; letter-spacing: -0.03em; }
    .sl-head p { margin: 6px 0 0; font-size: 13px; color: #8d939a; }
    .sl-app { position: absolute; left: 40px; right: 40px; top: 100px; bottom: 0; border-radius: 14px 14px 0 0; background: #fff; color: #15171a; padding: 12px 12px 0; box-sizing: border-box; overflow: hidden; }
    .sl-bar { display: flex; align-items: center; gap: 8px; font-size: 12px; font-weight: 650; margin-bottom: 10px; }
    .sl-bar i { width: 8px; height: 8px; border-radius: 50%; background: #e9ecef; } .sl-bar span { margin-left: 8px; } .sl-bar em { margin-left: auto; font-style: normal; font-weight: 500; color: #868e96; }
    .sl-cal { display: grid; grid-template-columns: repeat(5, 1fr); gap: 6px; }
    .sl-day { font-size: 10.5px; color: #868e96; font-weight: 600; padding: 0 2px 6px; }
    .sl-col { position: relative; height: 210px; border-radius: 8px; background: repeating-linear-gradient(#f8f9fa 0 34px, #f1f3f5 34px 35px); }
    .sl-ev { position: absolute; left: 3px; right: 3px; border-radius: 6px; padding: 5px 6px; font-size: 10.5px; font-weight: 650; line-height: 1.2; color: #15171a; box-sizing: border-box; overflow: hidden; }
    .sl-veil { position: absolute; left: 0; top: 0; width: ${W}px; height: ${H}px; background: rgba(14,15,18,.9); pointer-events: none; z-index: 1; }
    .sl-cur { position: absolute; left: 0; top: 0; z-index: 9; pointer-events: none; transition: opacity .2s; filter: drop-shadow(0 1px 1.5px rgba(0,0,0,.4)); }
  </style><div class="sl-scene">
    <div class="sl-app"><div class="sl-bar"><i></i><i></i><i></i><span>Week 46</span><em>5 meetings · 2 focus blocks</em></div>
      <div class="sl-cal">${days.map(d => `<div><div class="sl-day">${d}</div><div class="sl-col">${ev.filter(e => days[e[0]] === d).map(e => `<div class="sl-ev" style="top:${e[1] * 35 + 2}px;height:${e[2] * 35 - 4}px;background:${e[3]}">${e[4]}</div>`).join('')}</div></div>`).join('')}</div></div>
    <div class="sl-veil"></div>
    <div class="sl-head"><h2>Your whole week, in one view.</h2><p>Meetings, focus time and deadlines on a single calendar.</p></div>
  </div>`;
  stage.append(root);
  const scene = root.querySelector('.sl-scene'), veil = root.querySelector('.sl-veil');
  let s = 1;
  const fit = () => { const w = stage.clientWidth, h = stage.clientHeight; s = Math.min(w / W, h / H, 1.3); scene.style.transform = `translate(${(w - W * s) / 2}px, ${(h - H * s) / 2}px) scale(${s})`; };
  const ro = new ResizeObserver(fit); ro.observe(stage); fit();
  const pt = (x, y) => () => ({ x, y });

  // simulated cursor: looks around the calendar with pauses; the real pointer takes over while it is on the stage
  const steps = [
    { to: pt(130, 200), move: 500, hold: 700 },
    { to: pt(270, 230), move: 900, hold: 800 },
    { to: pt(420, 290), move: 900, hold: 800 },
    { to: pt(330, 330), move: 700, hold: 600 },
    { to: pt(170, 300), move: 900, hold: 700 },
  ];
  const ghost = document.createElement('div'); ghost.className = 'sl-cur';
  ghost.innerHTML = '<svg width="17" height="24" viewBox="-1 -1 17 24"><path d="M0 0v17.6l4.3-4.1 2.9 6.6 2.9-1.2-2.8-6.5h6.1z" fill="#15171a" stroke="#fff" stroke-width="1.3" stroke-linejoin="round"/></svg>';
  scene.append(ghost);
  const inOut = t => t < 0.5 ? 8 * t ** 4 : 1 - (-2 * t + 2) ** 4 / 2;
  let si = 0, t0 = performance.now(), from = steps[0].to(), real = null;
  const c = { x: from.x, y: from.y };
  function sim(now) {
    let st = steps[si];
    while (now - t0 > st.move + st.hold) { t0 += st.move + st.hold; from = st.to(); si = (si + 1) % steps.length; st = steps[si]; }
    const k = inOut(Math.min(1, (now - t0) / st.move)), to = st.to(), dx = to.x - from.x, dy = to.y - from.y, bow = Math.sin(Math.PI * k) * 0.15;
    c.x = from.x + dx * k - dy * bow; c.y = from.y + dy * k + dx * bow;
  }
  const toScene = e => { const r = scene.getBoundingClientRect(); return { x: (e.clientX - r.left) / s, y: (e.clientY - r.top) / s }; };
  const onMove = e => { real = toScene(e); };
  const onLeave = () => { if (real) { from = { ...real }; t0 = performance.now(); } real = null; };
  root.addEventListener('pointermove', onMove); root.addEventListener('pointerleave', onLeave);

  let sx = c.x, sy = c.y, last = performance.now(), raf;
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    if (real) { c.x = real.x; c.y = real.y; } else sim(now);
    ghost.style.transform = `translate(${c.x - 1}px, ${c.y - 1}px)`;
    ghost.style.opacity = real ? 0 : 1;
    const a = reduce ? 1 : 1 - Math.exp(-dt * 9);   // reduced motion: the light sits exactly on the cursor, no trailing                       // the light trails the cursor, the same at any frame rate
    sx += (c.x - sx) * a; sy += (c.y - sy) * a;
    const r = PARAMS.radius;
    const mask = `radial-gradient(circle ${r}px at ${sx}px ${sy}px, transparent 0, transparent ${r * 0.5}px, #000 ${r}px)`;
    veil.style.maskImage = mask; veil.style.webkitMaskImage = mask;
    raf = requestAnimationFrame(frame);
  }
  raf = requestAnimationFrame(frame);
  return () => { cancelAnimationFrame(raf); ro.disconnect(); root.removeEventListener('pointermove', onMove); root.removeEventListener('pointerleave', onLeave); root.remove(); };
}
