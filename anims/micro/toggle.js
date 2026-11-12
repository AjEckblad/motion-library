// Spring toggles in a notification settings panel: each knob rides a spring and stretches along its travel in proportion
// to its speed (a scaleX anchored at the trailing edge), and the track colour follows the knob's position, not a timer.
// It feels right because the knob has weight: it leans into the move, lands, and the colour can never disagree with it.
const PARAMS = { stiffness: 300, damping: 20 };

export default function (stage) {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const W = 540, H = 380;
  const rows = [['Push notifications', 'On this device'], ['Email digest', 'A summary every morning at 8'], ['Mentions only', 'Mute everything except @you'], ['Sounds', 'Play a chime for new messages']];
  const root = document.createElement('div');
  root.className = 'tg-root';
  root.innerHTML = `<style>
    .tg-root { position: absolute; inset: 0; overflow: hidden; background: #f3f0f2; font-family: system-ui, -apple-system, "Segoe UI", sans-serif; color: #15171a; }
    .tg-scene { position: absolute; left: 0; top: 0; width: ${W}px; height: ${H}px; transform-origin: 0 0; }
    .tg-panel { position: absolute; left: 70px; right: 70px; top: 36px; border-radius: 16px; background: #fff; box-shadow: 0 0 0 1px rgba(20,24,30,.06), 0 10px 30px -12px rgba(60,20,40,.18); padding: 20px 22px 8px; }
    .tg-panel h2 { margin: 0; font-size: 18px; font-weight: 700; letter-spacing: -0.02em; } .tg-panel > p { margin: 4px 0 10px; font-size: 12.5px; color: #6b7076; }
    .tg-row { display: flex; align-items: center; gap: 12px; padding: 13px 0; border-top: 1px solid #f0f1f3; }
    .tg-row b { display: block; font-size: 14px; font-weight: 600; } .tg-row span { display: block; margin-top: 2px; font-size: 12px; color: #7a7f85; }
    .tg-sw { margin-left: auto; position: relative; flex: none; width: 46px; height: 28px; border-radius: 14px; border: 0; padding: 0; cursor: pointer; background: #d6d9de; }
    .tg-knob { position: absolute; left: 3px; top: 3px; width: 22px; height: 22px; border-radius: 11px; background: #fff; box-shadow: 0 1px 3px rgba(60,10,30,.25); will-change: transform; }
  </style><div class="tg-scene"><div class="tg-panel"><h2>Notifications</h2><p>Choose how we get your attention.</p>
    ${rows.map(([t, d]) => `<div class="tg-row"><div><b>${t}</b><span>${d}</span></div><button class="tg-sw" type="button" role="switch" aria-checked="false" aria-label="${t}"><span class="tg-knob"></span></button></div>`).join('')}
  </div></div>`;
  stage.append(root);
  const scene = root.querySelector('.tg-scene');
  const fit = () => { const w = stage.clientWidth, h = stage.clientHeight, s = Math.min(w / W, h / H, 1.3); scene.style.transform = `translate(${(w - W * s) / 2}px, ${(h - H * s) / 2}px) scale(${s})`; };
  const ro = new ResizeObserver(fit); ro.observe(stage); fit();

  const sws = [...scene.querySelectorAll('.tg-sw')].map(el => ({ el, knob: el.firstElementChild, on: false, x: 0, v: 0 }));
  const set = (t, val) => { t.on = val; t.el.setAttribute('aria-checked', String(val)); };
  let manual = -1e9;
  const onClick = e => { const t = sws.find(t => t.el === e.currentTarget); set(t, !t.on); manual = performance.now(); };
  sws.forEach(t => t.el.addEventListener('click', onClick));
  // demo: flip switches one at a time with a beat between, always ending back where it started
  const order = [0, 1, 3, 1, 2, 0, 3, 2];
  let k = 0;
  const auto = setInterval(() => { if (performance.now() - manual < 3000) return; const t = sws[order[k++ % order.length]]; set(t, !t.on); }, 1100);
  const mix = (a, b, t) => `rgb(${a.map((c, i) => Math.round(c + (b[i] - c) * t)).join(',')})`;
  let last = performance.now(), raf;
  function frame(now) {
    const dt = Math.min(0.032, (now - last) / 1000); last = now;
    for (const t of sws) {
      // reduced motion: the knob doesn't slide or stretch; it fades in on its new side and the track colour eases over
      if (reduce) { const to = t.on ? 1 : 0; if (t.x !== to) { t.x = to; t.v = 0; t.el.style.transition = 'background-color .2s'; t.knob.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 160 }); } }
      else for (let i = 0; i < 4; i++) { const h = dt / 4; t.v += (-PARAMS.stiffness * (t.x - (t.on ? 1 : 0)) - PARAMS.damping * t.v) * h; t.x += t.v * h; }
      const stretch = Math.min(0.5, Math.abs(t.v) * 0.05);           // longer while moving fast
      t.knob.style.transformOrigin = t.v >= 0 ? '0 50%' : '100% 50%';  // grow from the trailing edge, toward the direction of travel
      t.knob.style.transform = `translateX(${t.x * 18}px) scaleX(${1 + stretch})`;
      t.el.style.background = mix([214, 217, 222], [214, 60, 116], Math.max(0, Math.min(1, t.x)));
    }
    raf = requestAnimationFrame(frame);
  }
  raf = requestAnimationFrame(frame);
  return () => { cancelAnimationFrame(raf); clearInterval(auto); ro.disconnect(); sws.forEach(t => t.el.removeEventListener('click', onClick)); root.remove(); };
}
