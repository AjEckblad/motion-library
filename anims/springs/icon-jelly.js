// Jelly icon: on a home screen a finger lifts an app icon, drags it across the grid and drops it in an empty slot. The icon stretches along the way it is moving, squashes as it lands and wobbles still.
// Position and shape are two separate springs. The shape spring chases the drag speed, so fast moves stretch the icon along its path and stopping lets it snap back past round, which reads as soft and alive instead of a rigid sticker.
const PARAMS = { stiffness: 240, jelly: 1 };

export default function (stage) {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const K = 'icj', BG = 'radial-gradient(120% 100% at 50% 0%,#fff3e8,#f3dcc8)', SC = 'linear-gradient(170deg,#ffe3c9,#f4b58a 55%,#d9774a)', SBC = '#15171a';
  const A = [['#5ac8fa', '#007aff', 'Mail', '✉'], ['#ffd60a', '#ff9f0a', 'Notes', '✎'], ['#ff6b6b', '#e5294c', 'Music', '♫'], ['#8e8e93', '#48484a', 'Settings', '⚙'],
    ['#34c759', '#248a3d', 'Phone', '✆'], ['#64d2ff', '#0a84ff', 'Weather', '☀'], ['#bf5af2', '#7d3cbf', 'Podcasts', '◉'], ['#ffcc80', '#d9601a', 'Books', '▤'],
    ['#30d158', '#0a7d40', 'Maps', '➤'], ['#ff9f0a', '#c45c00', 'Photos', '✿'], ['#5e5ce6', '#3634a3', 'Files', '▣'], ['#ff375f', '#b0213f', 'Health', '♥'],
    ['#0a84ff', '#003e9c', 'Wallet', '▭'], ['#66d4cf', '#178a85', 'Fitness', '◎']];
  const ic = (a, cls = '') => `<div class="icj-app ${cls}"><i style="background:linear-gradient(135deg,${a[0]},${a[1]})">${a[3]}</i><span>${a[2]}</span></div>`;
  const CSS = `.icj-app{position:absolute;left:0;top:0;width:60px;margin-left:-30px;display:grid;justify-items:center;gap:5px;font-size:10.5px;color:#3a2516;font-weight:500}
    .icj-app i{width:50px;height:50px;border-radius:13px;display:grid;place-items:center;color:#fff;font-style:normal;font-size:23px;box-shadow:0 2px 6px rgba(80,30,0,.15)}
    .icj-drag{z-index:20}.icj-drag i{will-change:transform;transition:box-shadow .2s}.icj-drag.up i{box-shadow:0 14px 26px rgba(80,30,0,.32)}.icj-drag span{transition:opacity .2s}.icj-drag.up span{opacity:0}
    .icj-slot{position:absolute;width:50px;height:50px;margin-left:-25px;border-radius:13px;border:1.5px dashed rgba(58,37,22,.28);box-sizing:border-box;opacity:0;transition:opacity .25s}
    .icj-dock{position:absolute;left:10px;right:10px;bottom:10px;height:74px;border-radius:26px;background:rgba(255,255,255,.35)}`;
  const HTML = `<div class="icj-dock"></div><div class="icj-slot"></div>` + A.map(a => ic(a)).join('') + ic(['#ffffff', '#e5e5ea', 'Camera', '<b style="width:22px;height:22px;border-radius:50%;border:4px solid #3a3a3c;box-sizing:border-box"></b>'], 'icj-drag');
  // ── phone shell: a 280 × 580 phone drawn in CSS, scaled to fit the stage (screen is 266 × 566)
  const root = document.createElement('div');
  root.className = K + '-root';
  root.innerHTML = `<style>
    .${K}-root{position:absolute;inset:0;overflow:hidden;background:${BG};font-family:system-ui,-apple-system,"Segoe UI",sans-serif;color:#15171a;user-select:none;-webkit-user-select:none}
    .${K}-ph{position:absolute;left:50%;top:0;width:280px;height:580px;border-radius:46px;background:#0f1113;box-shadow:inset 0 0 0 1.5px #2b2f34,0 40px 80px -30px rgba(70,30,5,.45),0 12px 30px -12px rgba(70,30,5,.3);transform-origin:50% 0}
    .${K}-sc{position:absolute;inset:7px;border-radius:39px;overflow:hidden;background:${SC};isolation:isolate;touch-action:none}
    .${K}-is{position:absolute;left:50%;top:17px;width:76px;height:22px;margin-left:-38px;border-radius:12px;background:#000;z-index:30}
    .${K}-sb{position:absolute;left:0;right:0;top:0;height:44px;padding:0 26px 0 34px;display:flex;align-items:center;justify-content:space-between;font-size:13px;font-weight:650;z-index:29;pointer-events:none;color:${SBC}}
    .${K}-sb i{width:22px;height:11px;border-radius:3.5px;border:1.2px solid currentColor;box-sizing:border-box;padding:1px;opacity:.85}.${K}-sb i:after{content:"";display:block;height:100%;width:78%;background:currentColor;border-radius:1.5px}
    .${K}-f{position:absolute;left:0;top:0;width:34px;height:34px;margin:-17px 0 0 -17px;border-radius:50%;background:rgba(60,60,67,.32);box-shadow:0 0 0 1.5px rgba(255,255,255,.85),0 4px 12px rgba(0,0,0,.18);z-index:40;pointer-events:none;opacity:0;transition:opacity .2s}
    ${CSS}
  </style><div class="${K}-ph"><div class="${K}-sc"><div class="${K}-sb"><span>9:41</span><i></i></div>${HTML}<div class="${K}-f"></div></div><div class="${K}-is"></div></div>`;
  stage.append(root);
  const $ = s => root.querySelector('.' + K + '-' + s), $$ = s => [...root.querySelectorAll('.' + K + '-' + s)];
  const phone = $('ph'), scr = $('sc'), fingerEl = $('f');
  let scale = 1;
  const fit = () => { const W = stage.clientWidth, H = stage.clientHeight; scale = Math.min(H * 0.94 / 580, W * 0.9 / 280); phone.style.transform = `translate(-50%, ${(H - 580 * scale) / 2}px) scale(${scale})`; };
  const ro = new ResizeObserver(fit); ro.observe(stage); fit();
  const finger = (x, y, on, press) => { fingerEl.style.opacity = on ? 1 : 0; fingerEl.style.transform = `translate(${x}px,${y}px) scale(${press ? 0.84 : 1})`; };
  // a damped spring step (semi-implicit Euler, 4 substeps), which settles instantly under reduced motion, and Apple's rubber-band curve
  const spring = (s, to, k, c, dt) => { if (reduce) { s.x = to; s.v = 0; return; } for (let i = 0; i < 4; i++) { const h = dt / 4; s.v += (-k * (s.x - to) - c * s.v) * h; s.x += s.v * h; } };
  const rubber = (o, d, c) => o * d * c / (d + c * Math.abs(o));
  // the simulated finger: keys are [ms, x, y, state(0 hidden, 1 hover, 2 pressed), linear?]; real touches take over for 2.5 s
  const track = (keys, t) => { let i = 0; while (i < keys.length - 2 && t >= keys[i + 1][0]) i++; const a = keys[i], b = keys[i + 1]; let u = Math.min(1, Math.max(0, (t - a[0]) / ((b[0] - a[0]) || 1))); if (!a[4]) u = u < .5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2; return [a[1] + (b[1] - a[1]) * u, a[2] + (b[2] - a[2]) * u, a[3]]; };
  const U = { on: false, x: 0, y: 0, last: -1e9 };
  const toLocal = e => { const r = scr.getBoundingClientRect(); return [(e.clientX - r.left) / scale, (e.clientY - r.top) / scale]; };
  const pd = e => { U.on = true; [U.x, U.y] = toLocal(e); U.last = performance.now(); try { scr.setPointerCapture(e.pointerId); } catch (_) {} };
  const pm = e => { if (!U.on) return; [U.x, U.y] = toLocal(e); U.last = performance.now(); };
  const pu = () => { if (U.on) { U.on = false; U.last = performance.now(); } };
  scr.addEventListener('pointerdown', pd); scr.addEventListener('pointermove', pm); scr.addEventListener('pointerup', pu); scr.addEventListener('pointercancel', pu);
  const unlisten = () => { scr.removeEventListener('pointerdown', pd); scr.removeEventListener('pointermove', pm); scr.removeEventListener('pointerup', pu); scr.removeEventListener('pointercancel', pu); };
  let T0 = performance.now(), wasUser = false;
  const input = (now, keys, loop) => {
    if (now - U.last < 2500) { wasUser = true; finger(0, 0, false); return { x: U.x, y: U.y, down: U.on, t: -1, n: 0 }; }
    if (wasUser) { wasUser = false; T0 = now; }
    const t = (now - T0) % loop, [x, y, st] = track(keys, t);
    finger(x, y, st > 0, st === 2);
    return { x, y, down: st === 2, t, n: Math.floor((now - T0) / loop) };
  };
  const cx = c => 43 + c * 60, cy = r => 62 + r * 84;
  // 12 grid apps on 4 rows (two gaps), 2 more in the dock
  const spots = [[0, 0], [1, 0], [2, 0], [3, 0], [0, 1], [1, 1], [2, 1], [3, 1], [0, 2], [1, 2], [2, 2], [3, 2]];
  const apps = $$('app'), drag = apps.pop(), slot = $('slot'), ico = drag.querySelector('i');
  apps.forEach((el, i) => { const [x, y] = i < 12 ? [cx(spots[i][0]), cy(spots[i][1])] : [cx(i - 12 + 1), 497]; el.style.transform = `translate(${x}px, ${y}px)`; });
  const S1 = [cx(0), cy(3)], S2 = [cx(2), cy(4)];
  const p = { x: { x: S1[0], v: 0 }, y: { x: S1[1], v: 0 } }, j = { x: { x: 0, v: 0 }, y: { x: 0, v: 0 } };
  // ghost finger: long-press, then drag along an arc to the empty slot; in the second half, bring it back
  const o = 25;
  const keys = [[0, S1[0], S1[1] + o, 0], [500, S1[0], S1[1] + o, 1], [700, S1[0], S1[1] + o, 2], [1150, S1[0], S1[1] + o, 2], [1700, 170, 230, 2], [2150, S2[0], S2[1] + o, 2], [2350, S2[0], S2[1] + o, 1], [2550, S2[0], S2[1] + o, 0],
    [4300, S2[0], S2[1] + o, 0], [4500, S2[0], S2[1] + o, 1], [4700, S2[0], S2[1] + o, 2], [5150, S2[0], S2[1] + o, 2], [5500, 210, 260, 2], [5850, 90, 330, 2], [6200, S1[0], S1[1] + o, 2], [6400, S1[0], S1[1] + o, 1], [6600, S1[0], S1[1] + o, 0], [8400, S1[0], S1[1] + o, 0]];
  let grab = null, home = S1, pvx = 0, pvy = 0, last = performance.now(), raf;
  function frame(now) {
    const dt = Math.min(0.032, (now - last) / 1000); last = now;
    const f = input(now, keys, 8400), k = PARAMS.stiffness, c = 2 * Math.sqrt(k) * 0.72;
    if (f.down) {
      if (!grab) grab = { dx: p.x.x - f.x, dy: p.y.x - f.y, t: now };
      const lifted = now - grab.t > 300;
      drag.classList.toggle('up', lifted); slot.style.opacity = lifted ? 1 : 0;
      if (lifted) { const nx = f.x + grab.dx, ny = f.y + grab.dy; pvx = (nx - p.x.x) / Math.max(dt, 0.001); pvy = (ny - p.y.x) / Math.max(dt, 0.001); p.x.x = nx; p.y.x = ny; p.x.v = pvx; p.y.v = pvy; }
    } else {
      if (grab) { grab = null; drag.classList.remove('up'); home = Math.hypot(p.x.x - S1[0], p.y.x - S1[1]) < Math.hypot(p.x.x - S2[0], p.y.x - S2[1]) ? S1 : S2; }
      spring(p.x, home[0], k, c, dt); spring(p.y, home[1], k, c, dt);
      const other = home === S1 ? S2 : S1; slot.style.transform = `translate(${other[0]}px, ${other[1]}px)`; slot.style.opacity = 0;
    }
    if (grab) { const other = Math.hypot(p.x.x - S1[0], p.y.x - S1[1]) > 40 ? (home === S1 ? S2 : S1) : home; slot.style.transform = `translate(${other[0]}px, ${other[1]}px)`; }
    // the shape spring chases the current velocity: stretch along the motion, overshoot when it stops
    const kj = 520, cj = 2 * Math.sqrt(kj) * 0.35;
    spring(j.x, p.x.v * 0.00045 * PARAMS.jelly, kj, cj, dt); spring(j.y, p.y.v * 0.00045 * PARAMS.jelly, kj, cj, dt);
    const sp = reduce ? 0 : Math.min(0.35, Math.hypot(j.x.x, j.y.x)), ang = Math.atan2(j.y.x, j.x.x) * 180 / Math.PI;   // reduced motion: no stretch or wobble
    const lift = drag.classList.contains('up') ? 1.12 : 1;
    drag.style.transform = `translate(${p.x.x}px, ${p.y.x}px)`;
    ico.style.transform = `scale(${lift}) rotate(${ang}deg) scale(${1 + sp}, ${1 / (1 + sp)}) rotate(${-ang}deg)`;
    raf = requestAnimationFrame(frame);
  }
  raf = requestAnimationFrame(frame);
  return () => { cancelAnimationFrame(raf); ro.disconnect(); unlisten(); root.remove(); };
}
