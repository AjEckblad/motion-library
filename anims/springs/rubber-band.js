// Rubber-band: in a photo viewer a finger swipes to the last photo, then keeps pulling. Past the end the photo follows less and less, and on release it springs back carrying the speed your hand had.
// Inside the album the photo tracks the finger 1:1. Past the edge Apple's rubber-band curve (offset × d × c / (d + c × offset)) gives rising resistance, so the edge says "that's all" without a wall: it never stops dead and never jumps.
const PARAMS = { constant: 0.55, stiffness: 200 };

export default function (stage) {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const K = 'rbd', BG = 'radial-gradient(120% 100% at 50% 0%,#fff3e8,#f3dcc8)', SC = '#0b0b0c', SBC = '#fff';
  const PH = [
    ['Lisbon', '12 Oct', '<defs><linearGradient id="rbdA" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f6b26b"/><stop offset=".6" stop-color="#f7d9a8"/><stop offset="1" stop-color="#e9a066"/></linearGradient></defs><rect width="266" height="330" fill="url(#rbdA)"/><circle cx="180" cy="120" r="34" fill="#fff4dc"/><path d="M0 230 L30 190 h20 v-30 h26 v40 h30 v-60 h22 v50 h40 v-20 h30 v40 h30 v-30 h38 V330 H0z" fill="#b8573a"/><path d="M0 260 h266 V330 H0z" fill="#7d3a2a"/><g fill="#ffd9a0"><rect x="60" y="210" width="6" height="8"/><rect x="118" y="190" width="6" height="8"/><rect x="190" y="220" width="6" height="8"/></g>'],
    ['Sintra', '13 Oct', '<defs><linearGradient id="rbdB" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#a9d3e8"/><stop offset="1" stop-color="#e8f3ea"/></linearGradient></defs><rect width="266" height="330" fill="url(#rbdB)"/><path d="M0 200 L70 110 L120 170 L170 90 L266 200 V330 H0z" fill="#5f8b7a"/><path d="M0 240 C80 210 170 260 266 230 V330 H0z" fill="#3e6b55"/><path d="M150 112 h20 v-24 l10 -12 l10 12 v24 h10 v40 h-50z" fill="#e7c35a"/><path d="M0 290 C90 270 180 300 266 285 V330 H0z" fill="#2c4d3c"/>'],
    ['Cascais', '14 Oct', '<defs><linearGradient id="rbdC" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6fb7d6"/><stop offset=".55" stop-color="#bfe3ef"/><stop offset=".56" stop-color="#2f86a8"/><stop offset="1" stop-color="#1d5d7d"/></linearGradient></defs><rect width="266" height="330" fill="url(#rbdC)"/><path d="M0 250 C60 236 120 262 190 244 S 266 250 266 250 V330 H0z" fill="#f1dcb4"/><path d="M150 168 l18 -42 l18 42z" fill="#fff"/><path d="M146 170 h44 l-6 8 h-32z" fill="#5a3b2a"/><g stroke="#fff" stroke-opacity=".5" stroke-width="2"><path d="M20 200 h40"/><path d="M90 215 h30"/><path d="M200 205 h36"/></g>'],
    ['Comporta', '15 Oct', '<defs><linearGradient id="rbdD" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2b2a5c"/><stop offset=".55" stop-color="#d9637a"/><stop offset="1" stop-color="#f8b26a"/></linearGradient></defs><rect width="266" height="330" fill="url(#rbdD)"/><circle cx="133" cy="214" r="40" fill="#ffd38a"/><path d="M0 228 h266 V330 H0z" fill="#3a2e55"/><g stroke="#ffd38a" stroke-opacity=".6" stroke-width="3" stroke-linecap="round"><path d="M100 244 h66"/><path d="M114 258 h38"/><path d="M124 272 h18"/></g><path d="M30 228 v-70 M30 160 c-20 -6 -30 4 -36 14 M30 160 c18 -10 32 -2 38 8 M30 160 c-8 -16 -2 -26 10 -30" stroke="#16122b" stroke-width="5" fill="none" stroke-linecap="round"/>']];
  const CSS = `.rbd-top{position:absolute;left:0;right:0;top:46px;display:flex;justify-content:space-between;align-items:center;padding:0 16px;color:#fff;font-size:13.5px;z-index:3}.rbd-top span:first-child{color:#4ea2ff}.rbd-top b{text-align:center;font-size:13.5px;font-weight:650;line-height:1.2}.rbd-top b small{display:block;font-size:11px;font-weight:500;color:#9a9aa0}.rbd-top span:last-child{color:#4ea2ff}
    .rbd-view{position:absolute;left:0;top:118px;width:266px;height:330px}.rbd-track{position:absolute;left:0;top:0;height:330px;will-change:transform}
    .rbd-p{position:absolute;top:0;width:266px;height:330px}.rbd-p svg{display:block}
    .rbd-thumbs{position:absolute;left:0;right:0;top:470px;display:flex;justify-content:center;gap:3px}.rbd-thumbs i{width:28px;height:36px;border-radius:3px;overflow:hidden;opacity:.55;transition:transform .3s cubic-bezier(.23,1,.32,1),opacity .3s}.rbd-thumbs i.on{opacity:1;transform:scale(1.12);box-shadow:0 0 0 1.5px #fff}.rbd-thumbs svg{width:28px;height:36px;display:block}
    .rbd-bar{position:absolute;left:0;right:0;bottom:22px;display:flex;justify-content:space-around;color:#4ea2ff;font-size:19px}`;
  const svg = (p, w, h) => `<svg width="${w}" height="${h}" viewBox="0 0 266 330" preserveAspectRatio="xMidYMid slice">${p[2]}</svg>`;
  const HTML = `<div class="rbd-top"><span>‹ Trip</span><b class="rbd-ttl"></b><span>Edit</span></div><div class="rbd-view"><div class="rbd-track">${PH.map((p, i) => `<div class="rbd-p" style="left:${i * 276}px">${svg(p, 266, 330)}</div>`).join('')}</div></div>
    <div class="rbd-thumbs">${PH.map(p => `<i>${svg(p, 28, 36).replace(/id="(rbd\w)"/, 'id="$1t"').replace(/url\(#(rbd\w)\)/, 'url(#$1t)')}</i>`).join('')}</div><div class="rbd-bar"><span>⇪</span><span>♡</span><span>ⓘ</span><span>⌫</span></div>`;
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
  const trk = $('track'), ttl = $('ttl'), thumbs = [...$('thumbs').children], PW = 276, MIN = -3 * PW;
  const s = { x: -2 * PW, v: 0 };
  let page = 2, shownPage = -1, grab = null, vel = 0, lastX = 0, last = performance.now(), raf;
  // ghost finger: swipe to the last photo, pull past it slowly and hold, let go; then swipe back
  const keys = [[0, 200, 290, 0], [400, 200, 290, 1], [600, 200, 290, 2], [860, 70, 292, 2], [1000, 60, 292, 1], [1200, 60, 292, 0],
    [2000, 210, 290, 0], [2200, 210, 290, 1], [2400, 210, 290, 2], [3300, 20, 296, 2], [3700, 26, 296, 2], [3900, 30, 296, 1], [4100, 30, 296, 0],
    [5000, 60, 290, 0], [5200, 60, 290, 1], [5400, 60, 290, 2], [5660, 210, 288, 2], [5800, 220, 288, 1], [6000, 220, 288, 0], [7200, 200, 290, 0]];
  function frame(now) {
    const dt = Math.min(0.032, (now - last) / 1000); last = now;
    const f = input(now, keys, 7200);
    if (f.down) {
      if (!grab) { grab = { fx: f.x, s0: s.x, p0: page }; lastX = f.x; vel = 0; }
      vel = vel * 0.6 + ((f.x - lastX) / Math.max(dt, 0.001)) * 0.4; lastX = f.x;
      const raw = grab.s0 + f.x - grab.fx;
      s.x = reduce ? Math.max(MIN, Math.min(0, raw)) : raw < MIN ? MIN - rubber(MIN - raw, 266, PARAMS.constant) : raw > 0 ? rubber(raw, 266, PARAMS.constant) : raw; s.v = vel;   // reduced motion: the edge is a hard stop
    } else {
      if (grab) { const aim = -(s.x + s.v * 0.18) / PW; page = Math.max(0, Math.min(3, Math.max(grab.p0 - 1, Math.min(grab.p0 + 1, Math.round(aim))))); grab = null; }
      spring(s, -page * PW, PARAMS.stiffness, 2 * Math.sqrt(PARAMS.stiffness) * 0.85, dt);
    }
    trk.style.transform = `translateX(${s.x}px)`;
    const cur = Math.max(0, Math.min(3, Math.round(-s.x / PW)));
    if (cur !== shownPage) { shownPage = cur; ttl.innerHTML = `${PH[cur][0]}<small>${PH[cur][1]} · ${cur + 1} of 4</small>`; thumbs.forEach((t, i) => t.classList.toggle('on', i === cur)); }
    raf = requestAnimationFrame(frame);
  }
  raf = requestAnimationFrame(frame);
  return () => { cancelAnimationFrame(raf); ro.disconnect(); unlisten(); root.remove(); };
}
