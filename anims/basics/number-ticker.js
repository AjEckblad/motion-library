// Number ticker: switch a revenue card between Week, Month and Quarter and each digit rolls to its new value like an odometer, one column after another.
// Every digit is a strip of 0 to 9 behind a short window; only translateY moves. A small left-to-right stagger reads as one change sweeping across the figure, and a soft fade at the window edges hides the strip's ends.
const PARAMS = { duration: 700, stagger: 45 };

export default function (stage) {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const AW = 440, AH = 286;
  const periods = [
    { key: 'Week', value: 12480, delta: '+8.1% vs last week', from: 'Aug 25', to: 'This week', bars: [0.42, 0.5, 0.46, 0.58, 0.55, 0.62, 0.6, 0.71, 0.66, 0.74, 0.69, 0.8] },
    { key: 'Month', value: 48920, delta: '+12.4% vs October', from: 'Dec 2025', to: 'Nov 2026', bars: [0.3, 0.34, 0.41, 0.38, 0.47, 0.52, 0.5, 0.58, 0.63, 0.61, 0.72, 0.86] },
    { key: 'Quarter', value: 96315, delta: '+21.0% vs Q3', from: 'Q1 2024', to: 'Q4 2026', bars: [0.18, 0.22, 0.27, 0.31, 0.36, 0.42, 0.47, 0.55, 0.6, 0.68, 0.79, 0.95] },
  ];
  const root = document.createElement('div');
  root.className = 'nt-root';
  root.innerHTML = `<style>
    .nt-root { position: absolute; inset: 0; background: radial-gradient(120% 100% at 50% 0%, #1b1b1e, #0d0d0f); overflow: hidden; color: #15171a; font-family: "Mona Sans", system-ui, -apple-system, sans-serif; }
    .nt-board { position: absolute; left: 50%; top: 50%; width: ${AW}px; height: ${AH}px; box-sizing: border-box; padding: 18px 20px; background: #fff; border-radius: 18px; box-shadow: 0 1px 2px rgba(20,30,60,.06), 0 18px 40px -24px rgba(20,30,60,.35); }
    .nt-head { display: flex; justify-content: space-between; align-items: center; }
    .nt-label { display: flex; align-items: center; gap: 8px; font-size: 13px; font-weight: 620; color: #33373c; }
    .nt-label i { width: 24px; height: 24px; border-radius: 7px; background: #e7ecfb; display: grid; place-items: center; }
    .nt-seg { position: relative; display: flex; padding: 3px; border-radius: 10px; background: #f1f3f6; }
    .nt-seg span { position: relative; z-index: 1; width: 64px; height: 26px; display: grid; place-items: center; font-size: 12px; font-weight: 600; color: #5b6066; transition: color 160ms ease; }
    .nt-seg span.on { color: #15171a; }
    .nt-pill { position: absolute; left: 3px; top: 3px; width: 64px; height: 26px; border-radius: 7px; background: #fff; box-shadow: 0 1px 2px rgba(20,30,60,.12), 0 2px 6px -2px rgba(20,30,60,.14); transition: transform 240ms cubic-bezier(0.23, 1, 0.32, 1); }
    .nt-num { display: flex; align-items: flex-end; margin-top: 16px; font-size: 48px; font-weight: 720; letter-spacing: -0.03em; line-height: 1.1; font-variant-numeric: tabular-nums; font-stretch: 104%; }
    .nt-num > span { display: block; height: 1.1em; }
    .nt-cur { font-size: 30px; font-weight: 640; color: #5b6066; margin-right: 4px; line-height: 1.6; margin-bottom: 3px; }
    .nt-col { overflow: hidden; -webkit-mask-image: linear-gradient(transparent, #000 22%, #000 78%, transparent); mask-image: linear-gradient(transparent, #000 22%, #000 78%, transparent); }
    .nt-strip { display: block; will-change: transform; }
    .nt-strip b { display: block; height: 1.1em; font-weight: inherit; }
    .nt-delta { position: relative; height: 22px; margin-top: 6px; }
    .nt-delta span { position: absolute; left: 0; top: 0; display: inline-flex; align-items: center; gap: 4px; height: 22px; padding: 0 8px; border-radius: 999px; background: #dcf3e4; color: #1f7a45; font-size: 11.5px; font-weight: 650; white-space: nowrap; }
    .nt-chart { position: relative; display: grid; grid-template-columns: repeat(12, 1fr); gap: 7px; align-items: end; height: 70px; margin-top: 18px; }
    .nt-chart i { height: 100%; border-radius: 4px 4px 2px 2px; background: #c9d4f6; transform-origin: 50% 100%; }
    .nt-chart i:last-child { background: #3b5bdb; }
    .nt-axis { position: relative; display: flex; justify-content: space-between; height: 14px; margin-top: 6px; font-size: 10.5px; color: #8a9096; }
    .nt-axis span { position: absolute; top: 0; white-space: nowrap; }
  </style>
  <div class="nt-board">
    <div class="nt-head"><span class="nt-label"><i><svg viewBox="0 0 16 16" width="13" height="13"><path d="M2 12l4-4 3 3 5-6" fill="none" stroke="#3b5bdb" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg></i>Revenue</span>
      <div class="nt-seg"><i class="nt-pill"></i>${periods.map(p => `<span>${p.key}</span>`).join('')}</div></div>
    <div class="nt-num"><span class="nt-cur">€</span></div>
    <div class="nt-delta"><span></span></div>
    <div class="nt-chart">${'<i></i>'.repeat(12)}</div>
    <div class="nt-axis"><span style="left:0"></span><span style="right:0"></span></div>
  </div>`;
  stage.append(root);
  const $ = s => root.querySelector(s);
  const board = $('.nt-board'), num = $('.nt-num'), pill = $('.nt-pill'), delta = $('.nt-delta');
  const segs = [...root.querySelectorAll('.nt-seg span')], bars = [...root.querySelectorAll('.nt-chart i')], axis = [...root.querySelectorAll('.nt-axis span')];

  // Five digit columns and a fixed comma: 00,000.
  const cols = [];
  for (let i = 0; i < 5; i++) {
    if (i === 2) { const c = document.createElement('span'); c.textContent = ','; num.append(c); }
    const col = document.createElement('span'); col.className = 'nt-col';
    col.innerHTML = `<span class="nt-strip">${[...'0123456789'].map(d => `<b>${d}</b>`).join('')}</span>`;
    num.append(col); cols.push({ strip: col.firstChild, d: 0 });
  }

  const fit = () => { const s = Math.min(stage.clientWidth / AW, stage.clientHeight / AH) * 0.92; board.style.transform = `translate(-50%, -50%) scale(${Math.min(s, 1.6)})`; };
  const ro = new ResizeObserver(fit); ro.observe(stage); fit();
  if (reduce) pill.style.transition = 'none';

  const easeOut = 'cubic-bezier(0.23, 1, 0.32, 1)';
  const swapText = (box, text, animate) => {
    const old = box.firstElementChild, next = document.createElement('span'); next.textContent = text; box.append(next);
    if (!animate) { old.remove(); return; }
    old.animate([{ opacity: 1 }, { opacity: 0, transform: reduce ? 'none' : 'translateY(-4px)' }], { duration: 140, easing: easeOut, fill: 'forwards' }).onfinish = () => old.remove();
    next.animate([{ opacity: 0, transform: reduce ? 'none' : 'translateY(4px)' }, { opacity: 1, transform: 'none' }], { duration: 260, delay: 100, easing: easeOut, fill: 'backwards' });
  };

  function show(k, animate) {
    const p = periods[k];
    segs.forEach((el, i) => el.classList.toggle('on', i === k));
    pill.style.transform = `translateX(${k * 64}px)`;
    const digits = String(p.value).padStart(5, '0').split('').map(Number);
    let n = 0;
    cols.forEach((c, i) => {
      const to = digits[i];
      if (to === c.d) return;
      // Reduced motion: no roll; the digit is set and fades in.
      if (reduce) { c.strip.animate([{ transform: `translateY(${-to * 10}%)` }, { transform: `translateY(${-to * 10}%)` }], { duration: 0, fill: 'both' }); c.strip.parentNode.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 260, easing: easeOut }); c.d = to; return; }
      c.strip.animate([{ transform: `translateY(${-c.d * 10}%)` }, { transform: `translateY(${-to * 10}%)` }],
        { duration: PARAMS.duration, delay: n++ * PARAMS.stagger, easing: easeOut, fill: 'both' });
      c.d = to;
    });
    swapText(delta, `↑ ${p.delta}`, animate);
    axis[0].textContent = p.from; axis[1].textContent = p.to;
    bars.forEach((b, i) => {
      const from = b._s ?? 0.04, to = p.bars[i];
      b.animate([{ transform: `scaleY(${from})` }, { transform: `scaleY(${to})` }], { duration: 520, delay: i * 18, easing: easeOut, fill: 'both' });
      b._s = to;
    });
  }

  const timers = new Set();
  const later = (fn, ms) => { const id = setTimeout(() => { timers.delete(id); fn(); }, ms); timers.add(id); };
  let k = 0;
  swapText(delta, '↑ ' + periods[0].delta, false);
  later(() => show(0, false), 300);
  const step = () => {
    k = (k + 1) % periods.length;
    segs[k].animate([{ transform: 'scale(1)' }, { transform: 'scale(0.95)' }, { transform: 'scale(1)' }], { duration: reduce ? 0 : 200, easing: easeOut });
    show(k, true);
    later(step, PARAMS.duration + PARAMS.stagger * 4 + 1800);
  };
  later(step, 300 + PARAMS.duration + 1700);

  return () => { timers.forEach(clearTimeout); ro.disconnect(); root.getAnimations({ subtree: true }).forEach(a => a.cancel()); root.remove(); };
}
