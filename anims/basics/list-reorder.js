// List reorder (FLIP): a running club's weekly leaderboard re-ranks when you sort by distance, pace or climb, and every row glides to its new place.
// Each row is measured, moved in the layout, then shifted back with a transform and played to zero, so only transform animates. Rows that climb lift slightly and pass over the ones going down, so you can follow who moved.
const PARAMS = { duration: 300, lift: 0.03 };

export default function (stage) {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const AW = 440, AH = 318;
  const people = [
    { name: 'Maya Okafor', ini: 'MO', c: '#e8590c', km: 42.6, pace: 312, climb: 410 },
    { name: 'Jonas Berg', ini: 'JB', c: '#3b5bdb', km: 38.1, pace: 288, climb: 655 },
    { name: 'Priya Nair', ini: 'PN', c: '#0e9488', km: 35.4, pace: 331, climb: 290 },
    { name: 'Tom Ellis', ini: 'TE', c: '#b8359a', km: 29.8, pace: 276, climb: 520 },
    { name: 'Ines Duarte', ini: 'ID', c: '#2f9e44', km: 24.3, pace: 305, climb: 735 },
  ];
  const sorts = [
    { key: 'Distance', by: (a, b) => b.km - a.km, val: p => `${p.km.toFixed(1)} km`, frac: p => p.km / 45 },
    { key: 'Pace', by: (a, b) => a.pace - b.pace, val: p => `${Math.floor(p.pace / 60)}:${String(p.pace % 60).padStart(2, '0')} /km`, frac: p => (360 - p.pace) / 100 },
    { key: 'Climb', by: (a, b) => b.climb - a.climb, val: p => `${p.climb} m`, frac: p => p.climb / 780 },
  ];
  const root = document.createElement('div');
  root.className = 'lr-root';
  root.innerHTML = `<style>
    .lr-root { position: absolute; inset: 0; background: #e9edf7; overflow: hidden; color: #15171a; font-family: "Mona Sans", system-ui, -apple-system, sans-serif; }
    .lr-board { position: absolute; left: 50%; top: 50%; width: ${AW}px; height: ${AH}px; box-sizing: border-box; padding: 16px 16px 12px; background: #fff; border-radius: 18px; box-shadow: 0 1px 2px rgba(20,30,60,.06), 0 18px 40px -24px rgba(20,30,60,.35); }
    .lr-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; }
    .lr-head h3 { margin: 0; font-size: 16px; font-weight: 700; letter-spacing: -0.015em; font-stretch: 106%; }
    .lr-head p { margin: 2px 0 0; font-size: 11.5px; color: #5b6066; }
    .lr-seg { position: relative; display: flex; padding: 3px; border-radius: 10px; background: #f1f3f6; }
    .lr-seg span { position: relative; z-index: 1; width: 62px; height: 26px; display: grid; place-items: center; font-size: 12px; font-weight: 600; color: #5b6066; }
    .lr-seg span.on { color: #15171a; }
    .lr-pill { position: absolute; left: 3px; top: 3px; width: 62px; height: 26px; border-radius: 7px; background: #fff; box-shadow: 0 1px 2px rgba(20,30,60,.12), 0 2px 6px -2px rgba(20,30,60,.14); transition: transform 240ms cubic-bezier(0.23, 1, 0.32, 1); }
    .lr-list { position: relative; }
    .lr-ranks { position: absolute; left: 0; top: 0; }
    .lr-ranks b { display: grid; place-items: center; width: 22px; height: 44px; margin-bottom: 4px; font-size: 12.5px; font-weight: 700; color: #9aa0a6; font-variant-numeric: tabular-nums; }
    .lr-ranks b:nth-child(-n+3) { color: #b07a00; }
    .lr-rows { margin-left: 28px; }
    .lr-row { position: relative; height: 44px; margin-bottom: 4px; border-radius: 11px; display: grid; grid-template-columns: 30px 1fr 110px 72px; align-items: center; gap: 10px; padding: 0 10px; box-sizing: border-box; background: #fff; }
    .lr-row::before { content: ""; position: absolute; inset: 0; border-radius: inherit; background: #f6f7f9; }
    .lr-row::after { content: ""; position: absolute; inset: 0; border-radius: inherit; box-shadow: 0 10px 22px -10px rgba(20,30,60,.35), 0 0 0 1px rgba(20,30,60,.06); background: #fff; opacity: var(--up, 0); transition: opacity 160ms ease; }
    .lr-row > * { position: relative; z-index: 1; }
    .lr-av { width: 30px; height: 30px; border-radius: 50%; display: grid; place-items: center; color: #fff; font-size: 11px; font-weight: 700; }
    .lr-name { font-size: 13px; font-weight: 620; white-space: nowrap; }
    .lr-bar { height: 6px; border-radius: 3px; background: #e6e9ef; overflow: hidden; }
    .lr-bar i { display: block; height: 100%; border-radius: 3px; transform-origin: 0 50%; transition: transform 300ms cubic-bezier(0.77, 0, 0.175, 1); }
    .lr-val { position: relative; height: 16px; text-align: right; font-size: 12.5px; font-weight: 640; font-variant-numeric: tabular-nums; }
    .lr-val span { position: absolute; right: 0; top: 0; white-space: nowrap; }
  </style>
  <div class="lr-board">
    <div class="lr-head"><div><h3>Running club</h3><p>This week · 5 members</p></div>
      <div class="lr-seg"><i class="lr-pill"></i>${sorts.map(s => `<span>${s.key}</span>`).join('')}</div></div>
    <div class="lr-list"><div class="lr-ranks">${people.map((_, i) => `<b>${i + 1}</b>`).join('')}</div><div class="lr-rows"></div></div>
  </div>`;
  stage.append(root);
  const board = root.querySelector('.lr-board'), rowsEl = root.querySelector('.lr-rows'), pill = root.querySelector('.lr-pill');
  const segs = [...root.querySelectorAll('.lr-seg span')];
  people.forEach(p => {
    const el = document.createElement('div'); el.className = 'lr-row';
    el.innerHTML = `<span class="lr-av" style="background:${p.c}">${p.ini}</span><span class="lr-name">${p.name}</span><span class="lr-bar"><i style="background:${p.c}"></i></span><span class="lr-val"><span></span></span>`;
    p.el = el; p.bar = el.querySelector('.lr-bar i'); p.val = el.querySelector('.lr-val');
  });

  let scale = 1;
  const fit = () => { const s = Math.min(stage.clientWidth / AW, stage.clientHeight / AH) * 0.92; scale = Math.min(s, 1.6); board.style.transform = `translate(-50%, -50%) scale(${scale})`; };
  const ro = new ResizeObserver(fit); ro.observe(stage); fit();
  if (reduce) pill.style.transition = 'none';

  const easeOut = 'cubic-bezier(0.23, 1, 0.32, 1)', inOut = 'cubic-bezier(0.77, 0, 0.175, 1)';
  const setVal = (p, text, animate) => {
    const old = p.val.firstElementChild, next = document.createElement('span'); next.textContent = text; p.val.append(next);
    if (!animate) { old.remove(); return; }
    old.animate([{ opacity: 1 }, { opacity: 0, transform: reduce ? 'none' : 'translateY(-5px)' }], { duration: 140, easing: easeOut, fill: 'forwards' }).onfinish = () => old.remove();
    next.animate([{ opacity: 0, transform: reduce ? 'none' : 'translateY(5px)' }, { opacity: 1, transform: 'none' }], { duration: 240, delay: 80, easing: easeOut, fill: 'backwards' });
  };

  function sortBy(k, animate) {
    const s = sorts[k];
    segs.forEach((el, i) => el.classList.toggle('on', i === k));
    pill.style.transform = `translateX(${k * 62}px)`;
    // First: where every row is now.
    const first = new Map(people.map(p => [p, p.el.getBoundingClientRect().top]));
    // Last: put them in their new order.
    [...people].sort(s.by).forEach(p => rowsEl.append(p.el));
    people.forEach(p => {
      setVal(p, s.val(p), animate);
      p.bar.style.transform = `scaleX(${Math.max(0.06, Math.min(1, s.frac(p))).toFixed(3)})`;
      if (!animate) return;
      // Reduced motion: rows land in their new places and fade up instead of gliding.
      if (reduce) { p.el.animate([{ opacity: 0.35 }, { opacity: 1 }], { duration: 240, easing: easeOut }); return; }
      // Invert, then Play: transform each row back to where it was and animate to zero.
      const dy = (first.get(p) - p.el.getBoundingClientRect().top) / scale;
      if (Math.abs(dy) < 1) return;
      const up = dy > 0;
      p.el.style.zIndex = up ? 2 : 1;
      p.el.style.setProperty('--up', up ? 1 : 0);
      const lift = up ? 1 + PARAMS.lift : 1;
      p.el.animate([
        { transform: `translateY(${dy}px)` },
        { transform: `translateY(${dy * 0.5}px) scale(${lift})`, offset: 0.5 },
        { transform: 'none' },
      ], { duration: PARAMS.duration, easing: inOut }).onfinish = () => { p.el.style.zIndex = ''; p.el.style.setProperty('--up', 0); };
    });
  }

  const timers = new Set();
  const later = (fn, ms) => { const id = setTimeout(() => { timers.delete(id); fn(); }, ms); timers.add(id); };
  let k = 0;
  sortBy(0, false);
  const step = () => {
    k = (k + 1) % sorts.length;
    segs[k].animate([{ transform: 'scale(1)' }, { transform: 'scale(0.95)' }, { transform: 'scale(1)' }], { duration: reduce ? 0 : 200, easing: easeOut });
    sortBy(k, true);
    later(step, PARAMS.duration + 1900);
  };
  later(step, 1200);

  return () => { timers.forEach(clearTimeout); ro.disconnect(); root.getAnimations({ subtree: true }).forEach(a => a.cancel()); root.remove(); };
}
