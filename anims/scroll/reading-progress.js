// Reading progress, on a long explainer article: a thin bar under the header fills as you read, and an estimate of the minutes left counts down, swapping each number with a short slide.
// The bar is one element scaled on the x axis (never resized), eased toward the true position so small scroll jitters don't make it twitch. Minutes left are counted from the words still below the fold, which is more honest than a percentage. The page scrolls itself at a reading pace; a real wheel or swipe takes over.
const PARAMS = { follow: 0.18, swap: 220 };

export default function (stage) {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const AH = 340, MINW = 400, WPM = 230;
  const sections = [
    ['', 'A heat pump does not make heat. It moves heat that is already there, from the cold air outside into a warm room, the way a fridge moves heat out of its box and into your kitchen.'],
    ['', 'That sounds impossible on a frosty morning, but air at minus five still holds plenty of warmth compared with the coldest thing in the machine: a liquid called the refrigerant, which boils at around minus forty.'],
    ['The loop', 'Outside, the refrigerant soaks up warmth from the air and boils into a gas. A compressor then squeezes that gas, and squeezing a gas makes it hot, hot enough to warm water for your radiators.'],
    ['', 'Inside, the hot gas gives its heat to the water and condenses back into a liquid. It passes through a valve that drops its pressure, it turns very cold again, and the loop starts over.'],
    ['Why it is cheap to run', 'The electricity only drives the compressor and the fans. For every unit of power it uses, a good heat pump delivers three to four units of heat, because most of that heat came from outside for free.'],
    ['', 'That ratio falls as the weather gets colder, which is why installers size the pump for the coldest week of the year, not the average one.'],
    ['What to ask an installer', 'Ask for a heat-loss survey of every room, the expected running cost at your local electricity price, and how loud the outdoor unit is at one metre. A good installer will answer all three without being pushed.'],
  ];
  const words = sections.reduce((n, [h, p]) => n + (h + ' ' + p).split(/\s+/).length, 0) + 600;
  const root = document.createElement('div');
  root.className = 'rp-root';
  root.innerHTML = `<style>
    .rp-root { position: absolute; inset: 0; overflow: hidden; background: #fff; color: #1a1d21; font-family: "Mona Sans", system-ui, -apple-system, sans-serif; }
    .rp-art { position: absolute; left: 0; top: 0; height: ${AH}px; transform-origin: 0 0; }
    .rp-scroll { position: absolute; inset: 0; overflow-y: auto; overflow-x: hidden; scrollbar-width: none; }
    .rp-scroll::-webkit-scrollbar { display: none; }
    .rp-bar { position: sticky; top: 0; z-index: 2; height: 40px; display: flex; align-items: center; gap: 12px; padding: 0 20px; background: #fff; font-size: 11.5px; font-weight: 600; }
    .rp-bar strong { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-weight: 650; }
    .rp-left { position: relative; display: inline-flex; align-items: center; gap: 6px; height: 22px; padding: 0 10px; border-radius: 999px; background: #eef3f1; color: #1f6f5c; overflow: hidden; font-variant-numeric: tabular-nums; }
    .rp-left span { display: inline-block; }
    .rp-track { position: absolute; left: 0; right: 0; bottom: 0; height: 3px; background: #eceff1; }
    .rp-fill { position: absolute; inset: 0; background: #1f8a6e; transform-origin: 0 50%; transform: scaleX(0); }
    .rp-body { max-width: 500px; margin: 0 auto; padding: 22px 24px 60px; font: 400 14px/1.62 ui-serif, "Iowan Old Style", Georgia, serif; }
    .rp-body small { font: 700 10.5px/1 "Mona Sans", system-ui, sans-serif; letter-spacing: .12em; color: #1f8a6e; }
    .rp-body h1 { margin: 8px 0 8px; font: 700 30px/1.05 "Mona Sans", system-ui, sans-serif; letter-spacing: -0.03em; }
    .rp-by { margin: 0 0 18px; font: 500 11.5px/1.4 "Mona Sans", system-ui, sans-serif; color: #6a7178; }
    .rp-body h2 { margin: 22px 0 6px; font: 680 16px/1.2 "Mona Sans", system-ui, sans-serif; letter-spacing: -0.01em; }
    .rp-body p { margin: 0 0 12px; }
    .rp-fig { margin: 16px 0; padding: 12px; border-radius: 10px; background: #f3f6f5; }
    .rp-fig svg { display: block; width: 100%; height: 110px; }
    .rp-fig figcaption { margin-top: 6px; font: 500 11px/1.4 "Mona Sans", system-ui, sans-serif; color: #6a7178; }
  </style>
  <div class="rp-art"><div class="rp-scroll">
    <div class="rp-bar"><strong>How a heat pump moves warmth uphill</strong><span class="rp-left"><svg width="11" height="11" viewBox="0 0 12 12" aria-hidden="true"><circle cx="6" cy="6" r="4.8" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M6 3.4V6l1.8 1.2" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg><span class="rp-n"></span></span><div class="rp-track"><i class="rp-fill"></i></div></div>
    <article class="rp-body">
      <small>EXPLAINER · HOME ENERGY</small>
      <h1>How a heat pump moves warmth uphill</h1>
      <p class="rp-by">By Jonas Weber · Updated 2 February</p>
      ${sections.map(([h, p], i) => `${h ? `<h2>${h}</h2>` : ''}<p>${p}</p>${i === 2 ? `<figure class="rp-fig"><svg viewBox="0 0 300 110" aria-hidden="true"><rect x="10" y="20" width="70" height="70" rx="10" fill="#dbe8f4"/><rect x="220" y="20" width="70" height="70" rx="10" fill="#f6e0d2"/><path d="M80 40h140" stroke="#d9534f" stroke-width="5" stroke-linecap="round"/><path d="M220 70H80" stroke="#3b82c4" stroke-width="5" stroke-linecap="round"/><circle cx="150" cy="40" r="14" fill="#1a1d21"/><path d="M144 40h12M152 35l5 5-5 5" stroke="#fff" stroke-width="2" fill="none"/><path d="M150 62l-7 8h14z" fill="#1a1d21"/><text x="45" y="102" font-size="10" text-anchor="middle" fill="#6a7178" font-family="system-ui">outside</text><text x="255" y="102" font-size="10" text-anchor="middle" fill="#6a7178" font-family="system-ui">inside</text></svg><figcaption>Warmth is picked up outside, squeezed hotter by the compressor, and handed over inside.</figcaption></figure>` : ''}`).join('')}
    </article>
  </div></div>`;
  stage.append(root);
  const box = root.querySelector('.rp-art'), sc = root.querySelector('.rp-scroll'), fill = root.querySelector('.rp-fill'), num = root.querySelector('.rp-n');
  const fit = () => {
    const W = stage.clientWidth, H = stage.clientHeight, s = Math.min(H / AH, W / MINW) || 1;
    box.style.width = W / s + 'px'; box.style.top = (H - AH * s) / 2 + 'px'; box.style.transform = `scale(${s})`;
  };
  const ro = new ResizeObserver(fit); ro.observe(stage); fit();

  // Simulated reader: read a screen, scroll a little, read again; at the end, back to the top.
  const stops = [[0, 0, 1100]];
  for (let i = 1; i <= 6; i++) stops.push([i / 6, 650, i === 6 ? 1600 : 650]);
  stops.push([0, 1500, 500]);
  const ease = t => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  let seg = null, si = 0, userUntil = 0, raf;
  const take = () => { userUntil = performance.now() + 3000; seg = null; };
  ['wheel', 'touchstart', 'pointerdown'].forEach(e => sc.addEventListener(e, take, { passive: true }));
  function drive(now) {
    if (now < userUntil) return;
    if (!seg) { const [at, dur, hold] = stops[si++ % stops.length]; seg = { from: sc.scrollTop, to: at * (sc.scrollHeight - sc.clientHeight), t0: now, dur, hold }; }
    const k = seg.dur ? Math.min(1, (now - seg.t0) / seg.dur) : 1;
    sc.scrollTop = seg.from + (seg.to - seg.from) * ease(k);
    if (now - seg.t0 >= seg.dur + seg.hold) seg = null;
  }
  const easeOut = 'cubic-bezier(0.23, 1, 0.32, 1)';
  let shown = null, bar = 0;
  const label = p => p > 0.985 ? 'Done' : `${Math.max(1, Math.ceil(words * (1 - p) / WPM))} min left`;
  function swap(text, down) {
    // the old label slides out the way the reader is going, the new one follows it in
    if (shown === null) { num.textContent = text; shown = text; return; }
    const d = reduce ? 0 : down ? 1 : -1; shown = text;   // reduced motion: a crossfade, no slide
    num.animate([{ transform: 'none', opacity: 1 }, { transform: `translateY(${-8 * d}px)`, opacity: 0 }], { duration: PARAMS.swap * 0.6, easing: easeOut }).onfinish = () => {
      num.textContent = text;
      num.animate([{ transform: `translateY(${8 * d}px)`, opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: PARAMS.swap, easing: easeOut });
    };
  }
  let lastP = 0;
  function frame(now) {
    drive(now);
    const max = sc.scrollHeight - sc.clientHeight, p = max > 0 ? sc.scrollTop / max : 0;
    bar += (p - bar) * PARAMS.follow;
    fill.style.transform = `scaleX(${bar.toFixed(4)})`;
    const t = label(p);
    if (t !== shown) swap(t, p >= lastP);
    lastP = p;
    raf = requestAnimationFrame(frame);
  }
  raf = requestAnimationFrame(frame);
  return () => { cancelAnimationFrame(raf); ro.disconnect(); root.getAnimations({ subtree: true }).forEach(a => a.cancel()); root.remove(); };
}
