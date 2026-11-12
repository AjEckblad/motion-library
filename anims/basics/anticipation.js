// Anticipation & follow-through: press "Add to bag" and the product hops into the bag. It crouches before the leap, stretches in flight, and the bag squashes and its handle swings on landing.
// The crouch tells your eye where the energy is about to go, and the follow-through after landing gives the hop weight. Remove the crouch and the same jump feels pushed.
const PARAMS = { anticipation: 0.25, overshoot: 0.18 };

export default function (stage) {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const AW = 440, AH = 240;
  const root = document.createElement('div');
  root.className = 'an-root';
  root.innerHTML = `<style>
    .an-root { position: absolute; inset: 0; background: #e9edf7; overflow: hidden; color: #15171a; font-family: "Mona Sans", system-ui, -apple-system, sans-serif; }
    .an-board { position: absolute; left: 50%; top: 50%; width: ${AW}px; height: ${AH}px; box-sizing: border-box; background: #fff; border-radius: 18px; box-shadow: 0 1px 2px rgba(20,30,60,.06), 0 18px 40px -24px rgba(20,30,60,.35); }
    .an-img { position: absolute; left: 16px; top: 16px; width: 208px; height: 208px; border-radius: 12px; background: #efe6da; display: grid; place-items: center; }
    .an-img svg { width: 168px; height: 168px; }
    .an-info { position: absolute; left: 244px; top: 62px; right: 18px; }
    .an-info h3 { margin: 0; font-size: 19px; font-weight: 700; letter-spacing: -0.02em; font-stretch: 106%; }
    .an-info p { margin: 4px 0 0; font-size: 12px; color: #5b6066; }
    .an-price { margin-top: 12px; font-size: 17px; font-weight: 660; }
    .an-dots { display: flex; gap: 7px; margin-top: 10px; }
    .an-dots i { width: 16px; height: 16px; border-radius: 50%; box-shadow: inset 0 0 0 1px rgba(0,0,0,.08); }
    .an-dots i:first-child { box-shadow: 0 0 0 2px #fff, 0 0 0 3.5px #15171a; }
    .an-btn { position: absolute; left: 244px; right: 18px; bottom: 16px; height: 40px; border-radius: 999px; background: #15171a; color: #fff; font-size: 13.5px; font-weight: 620; display: grid; place-items: center; overflow: hidden; }
    .an-btn span { grid-area: 1 / 1; display: flex; align-items: center; gap: 6px; }
    .an-bagbtn { position: absolute; right: 16px; top: 14px; width: 40px; height: 40px; border-radius: 50%; background: #f1f3f6; }
    .an-bag { position: absolute; left: 10px; top: 9px; width: 20px; height: 22px; transform-origin: 50% 100%; }
    .an-handle { position: absolute; left: 6px; top: -1px; width: 8px; height: 8px; transform-origin: 50% 100%; }
    .an-badge { position: absolute; right: -4px; top: -4px; min-width: 18px; height: 18px; border-radius: 999px; background: #3b5bdb; color: #fff; font-size: 10.5px; font-weight: 700; display: grid; place-items: center; box-shadow: 0 0 0 2px #fff; overflow: hidden; }
    .an-badge span { grid-area: 1 / 1; }
    .an-thumb { position: absolute; left: 0; top: 0; width: 46px; height: 46px; margin: -23px 0 0 -23px; border-radius: 50%; background: #efe6da; box-shadow: 0 0 0 2px #fff, 0 6px 14px -4px rgba(20,30,60,.35); display: grid; place-items: center; opacity: 0; will-change: transform; }
    .an-thumb svg { width: 38px; height: 38px; }
  </style>
  <div class="an-board">
    <div class="an-img"><svg viewBox="0 0 100 100">${mug('#c9775a')}</svg></div>
    <div class="an-info"><h3>Stoneware mug</h3><p>Sand glaze · 350 ml</p><div class="an-price">€24</div>
      <div class="an-dots"><i style="background:#c9775a"></i><i style="background:#8aa39b"></i><i style="background:#e8e1d6"></i></div></div>
    <div class="an-btn"><span>Add to bag</span></div>
    <div class="an-bagbtn"><div class="an-bag"><svg class="an-handle" viewBox="0 0 8 8"><path d="M1 8V4a3 3 0 0 1 6 0v4" fill="none" stroke="#15171a" stroke-width="1.6"/></svg><svg viewBox="0 0 20 22" style="width:20px;height:22px"><path d="M2.5 7h15l-1 13a1.6 1.6 0 0 1-1.6 1.5H5.1A1.6 1.6 0 0 1 3.5 20z" fill="none" stroke="#15171a" stroke-width="1.6" stroke-linejoin="round"/></svg></div><div class="an-badge"><span>2</span></div></div>
    <div class="an-thumb"><svg viewBox="0 0 100 100">${mug('#c9775a')}</svg></div>
  </div>`;
  stage.append(root);
  const $ = s => root.querySelector(s);
  const board = $('.an-board'), thumb = $('.an-thumb'), bag = $('.an-bag'), handle = $('.an-handle'), badge = $('.an-badge'), btn = $('.an-btn');

  const fit = () => { const s = Math.min(stage.clientWidth / AW, stage.clientHeight / AH) * 0.92; board.style.transform = `translate(-50%, -50%) scale(${Math.min(s, 1.6)})`; };
  const ro = new ResizeObserver(fit); ro.observe(stage); fit();

  const easeOut = 'cubic-bezier(0.23, 1, 0.32, 1)';
  // A label swap: the old text rolls up and out of its box while the new one rolls in from below.
  const swap = (box, html, d) => {
    const old = box.lastElementChild, next = document.createElement('span'); next.innerHTML = html; box.append(next);
    old.animate([{ transform: 'none', opacity: 1 }, { transform: `translateY(-${reduce ? 0 : d}px)`, opacity: 0 }], { duration: 220, easing: easeOut, fill: 'forwards' }).onfinish = () => old.remove();
    next.animate([{ transform: `translateY(${reduce ? 0 : d}px)`, opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: 260, easing: easeOut });
  };

  const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
  const smooth = x => x * x * (3 - 2 * x);
  // damped sine: the wobble after an impact
  const wob = (t, z = 0.25, w = 18) => t <= 0 ? 0 : Math.exp(-z * w * t) * Math.sin(w * Math.sqrt(1 - z * z) * t);
  const S = { x: 120, y: 132 }, E = { x: 404, y: 36 }, R = 23, ARC = 86;
  const at = f => ({ x: S.x + (E.x - S.x) * f, y: S.y + (E.y - S.y) * f - 4 * ARC * f * (1 - f) });

  const CYCLE = 3.6; let raf, t0 = performance.now(), loop = -1, count = 2, pressed = false, landed = false;
  function frame(now) {
    const T = (now - t0) / 1000, n = Math.floor(T / CYCLE), t = T % CYCLE;
    if (n !== loop) { loop = n; pressed = landed = false; if (n > 0) swap(btn, 'Add to bag', 28); }
    // phases: rest · press .35 · appear .5 · crouch .62–.97 · flight .97–1.52 · land and settle
    if (!pressed && t > 0.35) { pressed = true; btn.animate([{ transform: 'scale(1)' }, { transform: 'scale(0.97)' }, { transform: 'scale(1)' }], { duration: reduce ? 0 : 200, easing: easeOut }); }
    const appear = clamp((t - 0.5) / 0.12), crouch = clamp((t - 0.62) / 0.35), flight = clamp((t - 0.97) / 0.55), landT = t - 1.52;
    let x = S.x, y = S.y, sx = 1, sy = 1, ang = 0, size = 1, op = appear;
    if (flight <= 0) {
      const c = smooth(crouch); sy = 1 - PARAMS.anticipation * c; sx = 1 + PARAMS.anticipation * 0.7 * c;
      y = S.y + R * (1 - sy); size = 0.95 + 0.05 * appear;
    } else if (flight < 1) {
      const f = flight * flight * (3 - 2 * flight) * 0.35 + flight * 0.65, p = at(f), q = at(Math.min(1, f + 0.02));
      x = p.x; y = p.y; ang = Math.atan2(q.y - p.y, q.x - p.x);
      const v = Math.sin(Math.PI * flight); sy = 1 + 0.32 * v; sx = 1 / sy; size = 1 - 0.45 * flight;
    } else { x = E.x; y = E.y; size = 0.55; op = clamp(1 - landT / 0.08); }
    // Reduced motion: no crouch or hop; the product fades in and out where it sits.
    if (reduce) { x = S.x; y = S.y; sx = sy = size = 1; ang = 0; op = flight <= 0 ? appear : clamp(1 - flight * 2); }
    thumb.style.opacity = op.toFixed(3);
    thumb.style.transform = `translate(${x.toFixed(2)}px, ${y.toFixed(2)}px) rotate(${ang}rad) scale(${(sy * size).toFixed(4)}, ${(sx * size).toFixed(4)}) rotate(${-ang}rad)`;
    if (flight <= 0) thumb.style.transform = `translate(${x.toFixed(2)}px, ${y.toFixed(2)}px) scale(${(sx * size).toFixed(4)}, ${(sy * size).toFixed(4)})`;

    // follow-through: the bag squashes on impact and its handle keeps swinging after the body stops
    const w = reduce ? 0 : wob(landT, 0.3, 16), wh = reduce ? 0 : wob(landT - 0.04, 0.16, 13);
    const bsy = 1 - PARAMS.overshoot * 1.6 * w;
    bag.style.transform = `scale(${(1 / Math.max(0.5, bsy)).toFixed(4)}, ${bsy.toFixed(4)})`;
    handle.style.transform = `rotate(${(wh * 140 * PARAMS.overshoot).toFixed(2)}deg)`;
    if (!landed && landT > 0) {
      landed = true; count = count % 9 + 1;
      swap(badge, String(count), 15);
      badge.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.25)' }, { transform: 'scale(1)' }], { duration: reduce ? 0 : 320, easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)' });
      swap(btn, '<svg viewBox="0 0 16 16" width="14" height="14"><path d="M3 8.5l3.2 3L13 4.5" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>Added', 28);
    }
    raf = requestAnimationFrame(frame);
  }
  raf = requestAnimationFrame(frame);
  return () => { cancelAnimationFrame(raf); ro.disconnect(); root.getAnimations({ subtree: true }).forEach(a => a.cancel()); root.remove(); };
}

function mug(c) {
  return `<ellipse cx="50" cy="84" rx="24" ry="3.6" fill="#000" opacity=".09"/><path d="M63 45h4.5a8.5 8.5 0 0 1 0 17H63" fill="none" stroke="${c}" stroke-width="5.5"/><path d="M29 37h36v34a11 11 0 0 1-11 11H40a11 11 0 0 1-11-11z" fill="${c}"/><path d="M51 37h14v34a11 11 0 0 1-11 11h-3z" fill="#000" opacity=".08"/><ellipse cx="47" cy="37" rx="18" ry="3.2" fill="#000" opacity=".18"/>`;
}
