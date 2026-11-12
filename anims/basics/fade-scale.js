// Fade & scale in: tap a shop filter and the old cards leave fast, then the new ones rise from 94% scale one after another.
// Starting slightly small (never from zero) keeps every card readable on the way in, the strong ease-out makes the change feel instant, and a short exit means new results never wait on old ones.
const PARAMS = { duration: 300, startScale: 0.94, stagger: 60 };

export default function (stage) {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const AW = 440, AH = 286;
  const sh = w => `<ellipse cx="50" cy="84" rx="${w}" ry="3.6" fill="#000" opacity=".09"/>`;
  const ART = {
    mug: c => `${sh(24)}<path d="M63 45h4.5a8.5 8.5 0 0 1 0 17H63" fill="none" stroke="${c}" stroke-width="5.5"/><path d="M29 37h36v34a11 11 0 0 1-11 11H40a11 11 0 0 1-11-11z" fill="${c}"/><path d="M51 37h14v34a11 11 0 0 1-11 11h-3z" fill="#000" opacity=".08"/><ellipse cx="47" cy="37" rx="18" ry="3.2" fill="#000" opacity=".18"/>`,
    carafe: c => `${sh(20)}<path d="M43 16h14v15c0 3 11 9 11 20v23a8 8 0 0 1-8 8H40a8 8 0 0 1-8-8V51c0-11 11-17 11-20z" fill="#fff" fill-opacity=".6" stroke="#fff" stroke-width="1.5"/><path d="M32.8 58h34.4v16a8 8 0 0 1-8 8H40.8a8 8 0 0 1-8-8z" fill="${c}" opacity=".6"/><path d="M38 49v21" stroke="#fff" stroke-width="2.5" stroke-linecap="round"/><rect x="42" y="12" width="16" height="5" rx="2.5" fill="#fff"/>`,
    board: c => `${sh(26)}<g transform="rotate(-10 50 55)"><rect x="43" y="15" width="12" height="22" rx="6" fill="${c}"/><rect x="27" y="31" width="44" height="52" rx="10" fill="${c}"/><circle cx="49" cy="22" r="2.6" fill="#fff" opacity=".75"/><path d="M33 44c8 3 22 3 32 0M33 58c8 3 22 3 32 0M33 72c8 3 22 3 32 0" stroke="#000" stroke-opacity=".08" stroke-width="1.4" fill="none"/></g>`,
    vase: c => `${sh(18)}<path d="M50 28C49 20 47 13 41 8" stroke="#5f7d55" stroke-width="1.6" fill="none"/><path d="M46 14c-6-1-9-5-9-8 5 0 8 3 9 8z" fill="#7d9a6b"/><path d="M44 26h12v6c0 4 13 9 13 25 0 15-9 24-19 24s-19-9-19-24c0-16 13-21 13-25z" fill="${c}"/><path d="M50 26h6v6c0 4 13 9 13 25 0 15-9 24-19 24z" fill="#000" opacity=".08"/><ellipse cx="50" cy="26" rx="6" ry="1.6" fill="#000" opacity=".22"/>`,
    lamp: c => `${sh(20)}<ellipse cx="50" cy="60" rx="20" ry="11" fill="#fff6d8" opacity=".55"/><ellipse cx="50" cy="80" rx="15" ry="4" fill="${c}"/><rect x="48.6" y="44" width="2.8" height="36" fill="#2d2f33"/><path d="M28 47c0-14 10-22 22-22s22 8 22 22z" fill="${c}"/><path d="M50 25c12 0 22 8 22 22H50z" fill="#000" opacity=".08"/><ellipse cx="50" cy="47" rx="22" ry="3" fill="#fff4d0"/>`,
    throw: c => `${sh(30)}<rect x="20" y="62" width="60" height="18" rx="7" fill="${c}"/><rect x="23" y="45" width="56" height="18" rx="7" fill="${c}"/><rect x="23" y="45" width="56" height="18" rx="7" fill="#fff" opacity=".16"/><rect x="26" y="28" width="52" height="18" rx="7" fill="${c}"/><path d="M34 28v18M40 28v18M34 45v18M40 45v18M34 62v18M40 62v18" stroke="#fff" stroke-opacity=".45" stroke-width="1.6"/>`,
    towels: c => `${sh(28)}<rect x="22" y="64" width="56" height="16" rx="5" fill="${c}"/><rect x="25" y="49" width="52" height="16" rx="5" fill="#fff" opacity=".9"/><rect x="28" y="34" width="48" height="16" rx="5" fill="${c}"/><path d="M64 34v16M64 64v16" stroke="#fff" stroke-width="3" stroke-opacity=".7"/><path d="M60 49v16" stroke="${c}" stroke-width="3"/>`,
    candle: c => `${sh(18)}<path d="M50 23c3.5 4 4.5 7.5 0 11-4.5-3.5-3.5-7 0-11z" fill="#f59f00"/><path d="M50 27c1.6 2 2 3.6 0 5.2-2-1.6-1.6-3.2 0-5.2z" fill="#ffe8a3"/><rect x="49.3" y="34" width="1.4" height="6" fill="#33373c"/><rect x="33" y="40" width="34" height="42" rx="6" fill="${c}"/><rect x="33" y="40" width="34" height="7" rx="3.5" fill="#fff" opacity=".3"/><rect x="38" y="56" width="24" height="14" rx="2" fill="#fff" opacity=".88"/><path d="M42 61h16M44 65h12" stroke="#15171a" stroke-opacity=".35" stroke-width="1.2"/>`,
    plant: c => `${sh(20)}<path d="M50 58C44 45 34 40 26 40c2 10 12 17 24 18z" fill="#5c8a5a"/><path d="M50 58c6-13 16-18 24-18-2 10-12 17-24 18z" fill="#6f9e64"/><path d="M50 58c-4-16-2-29 6-37 4 12 2 25-6 37z" fill="#7fb06f"/><path d="M50 58c-8-12-10-25-4-35 6 10 8 23 4 35z" fill="#4f7a4c"/><path d="M35 58h30l-4 24H39z" fill="${c}"/><rect x="33" y="55" width="34" height="6" rx="2" fill="${c}"/><path d="M50 61h15l-4 21H50z" fill="#000" opacity=".08"/>`,
  };
  const sets = [
    { chip: 'Kitchen', count: '12 items', items: [
      ['Stoneware mug', '350 ml', '€24', 'mug', '#c9775a', '#efe6da'],
      ['Glass carafe', '1 litre', '€32', 'carafe', '#7fa9c4', '#e1e8ef'],
      ['Oak serving board', 'Oiled', '€45', 'board', '#c99a63', '#f4ecd2']] },
    { chip: 'Living', count: '9 items', items: [
      ['Bud vase', 'Glazed clay', '€19', 'vase', '#7f9cb3', '#f2e1e3'],
      ['Brass table lamp', 'Warm white', '€120', 'lamp', '#d9a441', '#e9e7e3'],
      ['Wool throw', '130 × 170', '€89', 'throw', '#b59a82', '#e2e9de']] },
    { chip: 'Bath', count: '7 items', items: [
      ['Linen towel set', 'Set of 2', '€38', 'towels', '#c9b28f', '#e1e8ef'],
      ['Fig leaf candle', '40 hours', '€28', 'candle', '#49606e', '#f2e1e3'],
      ['Fern in clay pot', '12 cm pot', '€22', 'plant', '#e0b08b', '#e2e9de']] },
  ];

  const root = document.createElement('div');
  root.className = 'fs-root';
  root.innerHTML = `<style>
    .fs-root { position: absolute; inset: 0; background: #e9edf7; overflow: hidden; color: #15171a; font-family: "Mona Sans", system-ui, -apple-system, sans-serif; }
    .fs-board { position: absolute; left: 50%; top: 50%; width: ${AW}px; height: ${AH}px; }
    .fs-head { display: flex; align-items: flex-end; justify-content: space-between; }
    .fs-head h3 { margin: 0; font-size: 21px; font-weight: 700; letter-spacing: -0.02em; font-stretch: 108%; }
    .fs-head p { margin: 3px 0 0; font-size: 12px; color: #5b6066; }
    .fs-count { font-size: 12px; font-weight: 560; color: #5b6066; }
    .fs-chips { display: flex; gap: 6px; margin: 12px 0 14px; }
    .fs-chip { height: 28px; padding: 0 13px; border-radius: 999px; background: #fff; color: #33373c; font-size: 12.5px; font-weight: 600; display: grid; place-items: center; box-shadow: inset 0 0 0 1px #dce1ea; }
    .fs-chip.on { background: #15171a; color: #fff; box-shadow: none; }
    .fs-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
    .fs-card { background: #fff; border-radius: 14px; padding: 7px 7px 11px; box-shadow: 0 1px 2px rgba(20,30,60,.06), 0 8px 18px -10px rgba(20,30,60,.22); opacity: 0; }
    .fs-img { position: relative; height: 108px; border-radius: 9px; display: grid; place-items: center; }
    .fs-img svg { width: 88px; height: 88px; }
    .fs-heart { position: absolute; right: 6px; top: 6px; width: 22px; height: 22px; border-radius: 50%; background: rgba(255,255,255,.85); display: grid; place-items: center; }
    .fs-heart svg { width: 12px; height: 12px; }
    .fs-name { margin: 9px 3px 0; font-size: 12.5px; font-weight: 620; white-space: nowrap; }
    .fs-meta { margin: 3px 3px 0; display: flex; justify-content: space-between; font-size: 11.5px; color: #5b6066; }
    .fs-meta b { color: #15171a; font-weight: 640; }
  </style>
  <div class="fs-board">
    <div class="fs-head"><div><h3>New in</h3><p>Hand-finished pieces, restocked every Thursday</p></div><span class="fs-count"></span></div>
    <div class="fs-chips">${sets.map(s => `<span class="fs-chip">${s.chip}</span>`).join('')}</div>
    <div class="fs-grid">${'<div class="fs-card"></div>'.repeat(3)}</div>
  </div>`;
  stage.append(root);

  const board = root.querySelector('.fs-board'), count = root.querySelector('.fs-count');
  const chips = [...root.querySelectorAll('.fs-chip')], cards = [...root.querySelectorAll('.fs-card')];
  const heart = '<svg viewBox="0 0 24 24"><path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z" fill="none" stroke="#33373c" stroke-width="2"/></svg>';
  const paint = k => {
    const s = sets[k];
    chips.forEach((c, i) => c.classList.toggle('on', i === k));
    count.textContent = s.count;
    s.items.forEach(([name, meta, price, art, c, bg], i) => {
      cards[i].innerHTML = `<div class="fs-img" style="background:${bg}"><svg viewBox="0 0 100 100">${ART[art](c)}</svg><span class="fs-heart">${heart}</span></div><div class="fs-name">${name}</div><div class="fs-meta"><span>${meta}</span><b>${price}</b></div>`;
    });
  };

  const fit = () => { const s = Math.min(stage.clientWidth / AW, stage.clientHeight / AH) * 0.92; board.style.transform = `translate(-50%, -50%) scale(${Math.min(s, 1.6)})`; };
  const ro = new ResizeObserver(fit); ro.observe(stage); fit();

  const easeOut = 'cubic-bezier(0.23, 1, 0.32, 1)';
  const timers = new Set();
  const later = (fn, ms) => { const id = setTimeout(() => { timers.delete(id); fn(); }, ms); timers.add(id); };
  let k = 0;

  function enter() {
    cards.forEach((card, i) => card.animate([
      { opacity: 0, transform: reduce ? 'none' : `translateY(12px) scale(${PARAMS.startScale})` },
      { opacity: 1, transform: 'none' },
    ], { duration: PARAMS.duration, delay: i * PARAMS.stagger, easing: easeOut, fill: 'both' }));
    later(leave, PARAMS.duration + PARAMS.stagger * 2 + 1700);
  }
  function leave() {
    // The tap: the next chip presses in, takes the active style, and the old cards get out of the way.
    k = (k + 1) % sets.length;
    chips[k].animate([{ transform: 'scale(1)' }, { transform: 'scale(0.95)' }, { transform: 'scale(1)' }], { duration: reduce ? 0 : 220, easing: easeOut });
    chips.forEach((c, i) => c.classList.toggle('on', i === k));
    const out = Math.round(PARAMS.duration * 0.6);
    cards.forEach((card, i) => card.animate([
      { opacity: 1, transform: 'none' },
      { opacity: 0, transform: reduce ? 'none' : 'translateY(-6px) scale(0.98)' },
    ], { duration: out, delay: i * 25, easing: easeOut, fill: 'both' }));
    later(() => { paint(k); enter(); }, out + 50 + 60);
  }
  paint(0);
  later(enter, 250);

  return () => { timers.forEach(clearTimeout); ro.disconnect(); root.getAnimations({ subtree: true }).forEach(a => a.cancel()); root.remove(); };
}
