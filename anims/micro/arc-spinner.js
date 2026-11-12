// Arc spinners in a checkout summary: the shipping line waits on a small spinner, then the Pay button carries a larger one
// while the payment goes through. Each ring rotates while its arc grows and shrinks on a different period, so it never
// quite repeats. It feels right because the wait sits exactly where the answer will appear, and the changing arc reads as progress.
const PARAMS = { speed: 1 };

export default function (stage) {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const W = 540, H = 380;
  const rot = (1.6 / PARAMS.speed).toFixed(2), dash = (1.4 / PARAMS.speed).toFixed(2);
  const spinner = (size, colour) => `<svg class="as-spin" width="${size}" height="${size}" viewBox="25 25 50 50"><circle cx="50" cy="50" r="20" stroke="${colour}"/></svg>`;
  const root = document.createElement('div');
  root.className = 'as-root';
  root.innerHTML = `<style>
    .as-root { position: absolute; inset: 0; overflow: hidden; background: radial-gradient(120% 100% at 50% 0%, #1b1b1e, #0d0d0f); font-family: system-ui, -apple-system, "Segoe UI", sans-serif; color: #15171a; }
    .as-scene { position: absolute; left: 0; top: 0; width: ${W}px; height: ${H}px; transform-origin: 0 0; }
    .as-card { position: absolute; left: 100px; right: 100px; top: 26px; border-radius: 16px; background: #fff; box-shadow: 0 0 0 1px rgba(20,24,30,.06), 0 10px 30px -12px rgba(60,20,40,.18); padding: 18px 20px 20px; }
    .as-card h2 { margin: 0 0 12px; font-size: 17px; font-weight: 700; letter-spacing: -0.02em; }
    .as-item { display: flex; align-items: center; gap: 10px; padding: 7px 0; font-size: 13px; } .as-item i { width: 36px; height: 36px; border-radius: 8px; flex: none; }
    .as-item small { display: block; font-size: 11.5px; color: #7a7f85; } .as-item b { margin-left: auto; font-weight: 600; }
    .as-line { display: flex; justify-content: space-between; align-items: center; height: 26px; font-size: 13px; color: #5b6066; }
    .as-line:first-of-type { margin-top: 8px; border-top: 1px solid #f0f1f3; padding-top: 8px; }
    .as-val { position: relative; min-width: 60px; height: 20px; text-align: right; color: #15171a; font-variant-numeric: tabular-nums; }
    .as-val > * { position: absolute; right: 0; top: 0; bottom: 0; display: flex; align-items: center; }
    .as-total { font-size: 15px; font-weight: 700; color: #15171a; border-top: 1px solid #f0f1f3; margin-top: 6px; height: 36px; }
    .as-pay { position: relative; width: 100%; height: 44px; margin-top: 12px; border: 0; border-radius: 11px; background: #15171a; color: #fff; font: 650 14px system-ui, -apple-system, sans-serif; overflow: hidden; }
    .as-pay > span { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; gap: 10px; }
    .as-spin { animation: as-rot ${rot}s linear infinite; } .as-spin circle { fill: none; stroke-width: 5; stroke-linecap: round; animation: as-dash ${dash}s ease-in-out infinite; }
    ${reduce ? `.as-spin { animation: as-pulse ${rot}s ease-in-out infinite alternate; } .as-spin circle { animation: none; stroke-dasharray: 70 200; } @keyframes as-pulse { to { opacity: .35; } }` : ''}
    @keyframes as-rot { to { transform: rotate(360deg); } }
    @keyframes as-dash { 0% { stroke-dasharray: 1 200; stroke-dashoffset: 0; } 50% { stroke-dasharray: 90 200; stroke-dashoffset: -35; } 100% { stroke-dasharray: 90 200; stroke-dashoffset: -124; } }
    .as-secure { margin-top: 10px; text-align: center; font-size: 11.5px; color: #8a8f94; }
  </style><div class="as-scene"><div class="as-card"><h2>Order summary</h2>
    <div class="as-item"><i style="background:linear-gradient(135deg,#ffd8a8,#e8590c)"></i><div>Canvas tote bag<small>Natural · Qty 1</small></div><b>$34.00</b></div>
    <div class="as-item"><i style="background:linear-gradient(135deg,#d0ebff,#1c7ed6)"></i><div>Cotton socks, 3 pairs<small>Navy · Qty 2</small></div><b>$36.00</b></div>
    <div class="as-line">Subtotal<span class="as-val"><span>$70.00</span></span></div>
    <div class="as-line">Shipping<span class="as-val as-ship"><span class="w">${spinner(16, '#d63c74')}</span><span class="d" style="opacity:0">$4.90</span></span></div>
    <div class="as-line as-total">Total<span class="as-val as-tot"><span class="w" style="color:#adb5bd">—</span><span class="d" style="opacity:0">$74.90</span></span></div>
    <button class="as-pay" type="button"><span class="p1">Pay $74.90</span><span class="p2" style="opacity:0">${spinner(20, '#fff')}Processing payment</span><span class="p3" style="opacity:0;background:#2f9e44">Payment complete</span></button>
    <div class="as-secure">Payments are encrypted end to end.</div>
  </div></div>`;
  stage.append(root);
  const scene = root.querySelector('.as-scene');
  const fit = () => { const w = stage.clientWidth, h = stage.clientHeight, s = Math.min(w / W, h / H, 1.3); scene.style.transform = `translate(${(w - W * s) / 2}px, ${(h - H * s) / 2}px) scale(${s})`; };
  const ro = new ResizeObserver(fit); ro.observe(stage); fit();
  const q = sel => root.querySelector(sel);
  const ease = 'cubic-bezier(0.23, 1, 0.32, 1)', anims = new Set();
  const still = k => reduce ? k.map(({ transform, ...f }) => f) : k;   // reduced motion: keep the fades and colour, drop the movement
  const show = (el, on) => { const a = el.animate(still([{ opacity: on ? 0 : 1, transform: `translateY(${on ? 4 : 0}px)` }, { opacity: on ? 1 : 0, transform: `translateY(${on ? 0 : -4}px)` }]), { duration: 220, easing: ease, fill: 'forwards' }); anims.add(a); };
  const swap = (a, b) => { show(a, false); show(b, true); };
  let timers = [];
  const later = (ms, fn) => timers.push(setTimeout(fn, ms));
  function cycle() {
    anims.forEach(a => a.cancel()); anims.clear(); timers = [];
    later(1700, () => { swap(q('.as-ship .w'), q('.as-ship .d')); swap(q('.as-tot .w'), q('.as-tot .d')); });
    later(2700, () => { const b = q('.as-pay'); anims.add(b.animate(still([{ transform: 'scale(1)' }, { transform: 'scale(0.97)', offset: 0.4 }, { transform: 'scale(1)' }]), { duration: 200, easing: ease })); swap(q('.p1'), q('.p2')); });
    later(5000, () => swap(q('.p2'), q('.p3')));
    later(6600, () => { [q('.as-ship .d'), q('.as-tot .d'), q('.p3')].forEach(el => show(el, false)); [q('.as-ship .w'), q('.as-tot .w'), q('.p1')].forEach(el => show(el, true)); });
    timers.push(setTimeout(cycle, 7200));
  }
  cycle();
  return () => { timers.forEach(clearTimeout); anims.forEach(a => a.cancel()); ro.disconnect(); root.remove(); };
}
