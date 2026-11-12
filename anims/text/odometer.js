// Odometer counter, on a tree-planting charity's live total: each gift rolls the number up digit by digit, like the wheels of a car's mileage counter.
// Each digit is a wheel, and a wheel only turns while the one to its right is passing from 9 to 0, so the carries ripple left exactly like a mechanical counter. The roll eases out, so a big gift spins fast and then settles where you can read it.
const PARAMS = { roll: 1800, gap: 2400 };

export default function (stage) {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const AH = 340, MINW = 400, GOAL = 3000000, DIGITS = 7;
  const gifts = [['Ana', 'Porto', 12], ['Kofi', 'Accra', 3], ['Ingrid', 'Bergen', 40], ['Mei', 'Taipei', 7], ['Lucas', 'Curitiba', 25], ['Sara', 'Malmö', 120], ['Omar', 'Amman', 5], ['Priya', 'Pune', 60]];
  const root = document.createElement('div');
  root.className = 'od-root';
  root.innerHTML = `<style>
    .od-root { position: absolute; inset: 0; overflow: hidden; background: #edf2e8; color: #13261c; font-family: "Mona Sans", system-ui, -apple-system, sans-serif; }
    .od-art { position: absolute; left: 0; top: 0; height: ${AH}px; transform-origin: 0 0; }
    .od-nav { position: absolute; left: 28px; right: 24px; top: 18px; display: flex; align-items: center; gap: 18px; font-size: 12px; font-weight: 560; color: #4a5d51; }
    .od-nav svg { width: 22px; height: 22px; margin-right: auto; }
    .od-nav b { font-weight: 640; color: #fff; background: #1f6b43; padding: 7px 13px; border-radius: 999px; }
    .od-main { position: absolute; left: 28px; top: 78px; }
    .od-live { display: inline-flex; align-items: center; gap: 7px; font-size: 11px; font-weight: 650; letter-spacing: .06em; text-transform: uppercase; color: #1f6b43; }
    .od-dot { position: relative; width: 7px; height: 7px; border-radius: 50%; background: #2f9e5a; }
    .od-dot::after { content: ""; position: absolute; inset: 0; border-radius: 50%; background: #2f9e5a; animation: od-ping 1.6s cubic-bezier(0.23, 1, 0.32, 1) infinite; }
    @keyframes od-ping { from { transform: scale(1); opacity: .55; } to { transform: scale(3); opacity: 0; } }
    .od-label { margin: 12px 0 4px; font-size: 14px; font-weight: 560; color: #3c5245; }
    .od-num { display: flex; align-items: flex-start; font-size: 52px; font-weight: 740; font-stretch: 106%; letter-spacing: -0.02em; line-height: 1; font-variant-numeric: tabular-nums; }
    .od-wheel { height: 1.08em; overflow: hidden; -webkit-mask: linear-gradient(transparent, #000 18%, #000 82%, transparent); mask: linear-gradient(transparent, #000 18%, #000 82%, transparent); }
    .od-wheel div { will-change: transform; }
    .od-wheel span { display: block; height: 1.08em; line-height: 1.08em; }
    .od-sep { line-height: 1.08em; margin-right: .02em; }
    .od-goal { margin-top: 16px; width: 250px; }
    .od-bar { height: 8px; border-radius: 8px; background: #d3e0d1; overflow: hidden; }
    .od-bar i { display: block; height: 100%; border-radius: 8px; background: #2f8a55; transform-origin: 0 50%; transition: transform .6s cubic-bezier(0.23, 1, 0.32, 1); }
    .od-goal p { margin: 7px 0 0; display: flex; justify-content: space-between; font-size: 11.5px; color: #4a5d51; font-variant-numeric: tabular-nums; }
    .od-cta { margin-top: 18px; display: flex; gap: 8px; }
    .od-cta span { padding: 9px 14px; border-radius: 999px; font-size: 12px; font-weight: 640; box-shadow: inset 0 0 0 1px #bfd0c2; }
    .od-cta span:first-child { background: #13261c; color: #fff; box-shadow: none; }
    .od-feed { position: absolute; right: 24px; top: 82px; width: 30%; max-width: 180px; min-width: 120px; height: 200px; }
    .od-feed h4 { margin: 0 0 10px; font-size: 11px; font-weight: 650; color: #4a5d51; }
    .od-item { position: absolute; left: 0; right: 0; top: 26px; display: flex; gap: 8px; align-items: center; padding: 8px; border-radius: 10px; background: #fff; box-shadow: 0 1px 2px rgba(19,38,28,.08); font-size: 11px; line-height: 1.3; transition: transform .3s cubic-bezier(0.77, 0, 0.175, 1), opacity .3s cubic-bezier(0.23, 1, 0.32, 1); }
    .od-item i { flex: none; width: 24px; height: 24px; border-radius: 50%; display: grid; place-items: center; font-style: normal; font-size: 10px; font-weight: 700; color: #fff; }
    .od-item b { display: block; font-weight: 640; }
    .od-item span { color: #5d6f63; }
  </style>
  <div class="od-art">
    <div class="od-nav"><svg viewBox="0 0 22 22" aria-hidden="true"><path d="M11 2c4.5 3 6 6.5 6 9.5a6 6 0 0 1-12 0C5 8.5 6.5 5 11 2z" fill="#2f8a55"/><path d="M11 8v12" stroke="#edf2e8" stroke-width="1.6"/></svg><span>Projects</span><span>Reports</span><span>About</span><b>Plant a tree</b></div>
    <div class="od-main">
      <span class="od-live"><i class="od-dot"></i>Live total</span>
      <div class="od-label">Trees planted this year</div>
      <div class="od-num" aria-live="polite"></div>
      <div class="od-goal"><div class="od-bar"><i></i></div><p><span class="od-pct"></span><span>Goal 3,000,000</span></p></div>
      <div class="od-cta"><span>Plant from €1</span><span>See the sites</span></div>
    </div>
    <div class="od-feed"><h4>Just now</h4></div>
  </div>`;
  stage.append(root);
  const art = root.querySelector('.od-art'), num = root.querySelector('.od-num'), bar = root.querySelector('.od-bar i');
  const pct = root.querySelector('.od-pct'), feed = root.querySelector('.od-feed');
  const fit = () => {
    const W = stage.clientWidth, H = stage.clientHeight, s = Math.min(H / AH, W / MINW) || 1;
    art.style.width = W / s + 'px'; art.style.top = (H - AH * s) / 2 + 'px'; art.style.transform = `scale(${s})`;
  };
  const ro = new ResizeObserver(fit); ro.observe(stage); fit();

  // seven wheels, most significant first, each a strip 0-9 plus a second 0 for the wrap
  const wheels = [];
  for (let i = 0; i < DIGITS; i++) {
    if (i === 1 || i === 4) { const s = document.createElement('span'); s.className = 'od-sep'; s.textContent = ','; num.append(s); }
    const w = document.createElement('div'); w.className = 'od-wheel';
    const strip = document.createElement('div'); strip.innerHTML = '01234567890'.split('').map(d => `<span>${d}</span>`).join('');
    w.append(strip); num.append(w); wheels.unshift(strip);
  }
  const paint = v => {
    // wheel 0 turns continuously; every wheel above it only turns while the one below goes from 9 to 10
    let below = v % 10;
    wheels[0].style.transform = `translateY(${(-below * 100 / 11).toFixed(3)}%)`;
    for (let i = 1; i < DIGITS; i++) {
      const p = Math.floor(v / 10 ** i) % 10 + Math.max(0, below - 9);
      wheels[i].style.transform = `translateY(${(-p * 100 / 11).toFixed(3)}%)`;
      below = p;
    }
  };
  let value = 2418991, from = value, to = value, t0 = 0, raf, timer, g = 0;
  const items = [];
  const place = () => items.forEach((it, i) => { it.style.transform = `translateY(${i * 50}px)`; it.style.opacity = i > 2 ? 0 : 1; });
  function give() {
    const [who, where, n] = gifts[g++ % gifts.length];
    from = value; to = value + n; t0 = performance.now();
    if (reduce) num.animate([{ opacity: 0.25 }, { opacity: 1 }], { duration: 320, easing: 'ease-out' }); // the new total fades in instead of rolling
    bar.style.transform = `scaleX(${(to / GOAL).toFixed(4)})`; pct.textContent = `${(to / GOAL * 100).toFixed(1)}% of this year's goal`;
    const it = document.createElement('div'); it.className = 'od-item';
    it.innerHTML = `<i style="background:hsl(${(g * 67) % 360} 38% 42%)">${who[0]}</i><div><b>${who} · ${n} ${n === 1 ? 'tree' : 'trees'}</b><span>${where}</span></div>`;
    it.style.transform = 'translateY(-10px) scale(0.95)'; it.style.opacity = 0;
    if (reduce) it.style.transition = 'opacity .3s cubic-bezier(0.23, 1, 0.32, 1)'; // rows change place without sliding
    feed.append(it); items.unshift(it);
    it.getBoundingClientRect();
    place();
    if (items.length > 4) items.pop().remove();
    timer = setTimeout(give, PARAMS.gap + PARAMS.roll);
  }
  const ease = t => 1 - Math.pow(1 - t, 3);
  function frame(now) {
    const k = Math.min(1, (now - t0) / PARAMS.roll);
    value = reduce ? to : from + (to - from) * ease(k);
    paint(value);
    raf = requestAnimationFrame(frame);
  }
  pct.textContent = `${(value / GOAL * 100).toFixed(1)}% of this year's goal`; bar.style.transform = `scaleX(${(value / GOAL).toFixed(4)})`;
  paint(value);
  timer = setTimeout(give, 500);
  raf = requestAnimationFrame(frame);
  return () => { cancelAnimationFrame(raf); clearTimeout(timer); ro.disconnect(); root.getAnimations({ subtree: true }).forEach(a => a.cancel()); root.remove(); };
}
