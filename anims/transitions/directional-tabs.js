// Directional tabs: in a shop app's category tabs, the products slide in from the right when you pick a tab further along, and from the left when you go back.
// The direction mirrors where the tab sits, so the tabs feel like pages laid side by side. The content only travels part of the way and fades, which keeps the move quick and calm instead of a full-width shove.
const PARAMS = { duration: 240, distance: 0.3 };

export default function (stage) {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const sh = w => `<ellipse cx="50" cy="84" rx="${w}" ry="3.6" fill="#000" opacity=".09"/>`;
  const ART = {
    mug: c => `${sh(24)}<path d="M63 45h4.5a8.5 8.5 0 0 1 0 17H63" fill="none" stroke="${c}" stroke-width="5.5"/><path d="M29 37h36v34a11 11 0 0 1-11 11H40a11 11 0 0 1-11-11z" fill="${c}"/><path d="M51 37h14v34a11 11 0 0 1-11 11h-3z" fill="#000" opacity=".08"/><ellipse cx="47" cy="37" rx="18" ry="3.2" fill="#000" opacity=".18"/>`,
    carafe: c => `${sh(20)}<path d="M43 16h14v15c0 3 11 9 11 20v23a8 8 0 0 1-8 8H40a8 8 0 0 1-8-8V51c0-11 11-17 11-20z" fill="#fff" fill-opacity=".6" stroke="#fff" stroke-width="1.5"/><path d="M32.8 58h34.4v16a8 8 0 0 1-8 8H40.8a8 8 0 0 1-8-8z" fill="${c}" opacity=".6"/><path d="M38 49v21" stroke="#fff" stroke-width="2.5" stroke-linecap="round"/><rect x="42" y="12" width="16" height="5" rx="2.5" fill="#fff"/>`,
    board: c => `${sh(26)}<g transform="rotate(-10 50 55)"><rect x="43" y="15" width="12" height="22" rx="6" fill="${c}"/><rect x="27" y="31" width="44" height="52" rx="10" fill="${c}"/><circle cx="49" cy="22" r="2.6" fill="#fff" opacity=".75"/><path d="M33 44c8 3 22 3 32 0M33 58c8 3 22 3 32 0M33 72c8 3 22 3 32 0" stroke="#000" stroke-opacity=".08" stroke-width="1.4" fill="none"/></g>`,
    bowl: c => `${sh(28)}<circle cx="41" cy="50" r="8" fill="#f2c94c"/><circle cx="56" cy="48" r="8.5" fill="#e9b949"/><circle cx="49" cy="44" r="7" fill="#9bbf5a"/><path d="M22 54h56c0 16-13 28-28 28S22 70 22 54z" fill="${c}"/><path d="M50 54h28c0 16-13 28-28 28z" fill="#000" opacity=".07"/>`,
    vase: c => `${sh(18)}<path d="M50 28C49 20 47 13 41 8" stroke="#5f7d55" stroke-width="1.6" fill="none"/><path d="M46 14c-6-1-9-5-9-8 5 0 8 3 9 8z" fill="#7d9a6b"/><path d="M44 26h12v6c0 4 13 9 13 25 0 15-9 24-19 24s-19-9-19-24c0-16 13-21 13-25z" fill="${c}"/><path d="M50 26h6v6c0 4 13 9 13 25 0 15-9 24-19 24z" fill="#000" opacity=".08"/>`,
    lamp: c => `${sh(20)}<ellipse cx="50" cy="60" rx="20" ry="11" fill="#fff6d8" opacity=".55"/><ellipse cx="50" cy="80" rx="15" ry="4" fill="${c}"/><rect x="48.6" y="44" width="2.8" height="36" fill="#2d2f33"/><path d="M28 47c0-14 10-22 22-22s22 8 22 22z" fill="${c}"/><path d="M50 25c12 0 22 8 22 22H50z" fill="#000" opacity=".08"/><ellipse cx="50" cy="47" rx="22" ry="3" fill="#fff4d0"/>`,
    throw: c => `${sh(30)}<rect x="20" y="62" width="60" height="18" rx="7" fill="${c}"/><rect x="23" y="45" width="56" height="18" rx="7" fill="${c}"/><rect x="23" y="45" width="56" height="18" rx="7" fill="#fff" opacity=".16"/><rect x="26" y="28" width="52" height="18" rx="7" fill="${c}"/><path d="M34 28v18M40 28v18M34 45v18M40 45v18M34 62v18M40 62v18" stroke="#fff" stroke-opacity=".45" stroke-width="1.6"/>`,
    towels: c => `${sh(28)}<rect x="22" y="64" width="56" height="16" rx="5" fill="${c}"/><rect x="25" y="49" width="52" height="16" rx="5" fill="#fff" opacity=".9"/><rect x="28" y="34" width="48" height="16" rx="5" fill="${c}"/><path d="M64 34v16M64 64v16" stroke="#fff" stroke-width="3" stroke-opacity=".7"/>`,
    candle: c => `${sh(18)}<path d="M50 23c3.5 4 4.5 7.5 0 11-4.5-3.5-3.5-7 0-11z" fill="#f59f00"/><rect x="49.3" y="34" width="1.4" height="6" fill="#33373c"/><rect x="33" y="40" width="34" height="42" rx="6" fill="${c}"/><rect x="38" y="56" width="24" height="14" rx="2" fill="#fff" opacity=".88"/>`,
    plant: c => `${sh(20)}<path d="M50 58C44 45 34 40 26 40c2 10 12 17 24 18z" fill="#5c8a5a"/><path d="M50 58c6-13 16-18 24-18-2 10-12 17-24 18z" fill="#6f9e64"/><path d="M50 58c-4-16-2-29 6-37 4 12 2 25-6 37z" fill="#7fb06f"/><path d="M50 58c-8-12-10-25-4-35 6 10 8 23 4 35z" fill="#4f7a4c"/><path d="M35 58h30l-4 24H39z" fill="${c}"/><rect x="33" y="55" width="34" height="6" rx="2" fill="${c}"/>`,
  };
  const tabs = [
    { name: 'All', count: '64 items', items: [['Stoneware mug', '€24', 'mug', '#c9775a', '#efe6da'], ['Brass table lamp', '€120', 'lamp', '#d9a441', '#e9e7e3'], ['Wool throw', '€89', 'throw', '#b59a82', '#e2e9de'], ['Fern in clay pot', '€22', 'plant', '#e0b08b', '#f2e1e3']] },
    { name: 'Kitchen', count: '21 items', items: [['Glass carafe', '€32', 'carafe', '#7fa9c4', '#e1e8ef'], ['Oak serving board', '€45', 'board', '#c99a63', '#f4ecd2'], ['Fruit bowl', '€38', 'bowl', '#e8e1d6', '#f3dfd3'], ['Stoneware mug', '€24', 'mug', '#8aa39b', '#e2e9de']] },
    { name: 'Living', count: '17 items', items: [['Bud vase', '€19', 'vase', '#7f9cb3', '#f2e1e3'], ['Fig leaf candle', '€28', 'candle', '#49606e', '#e9e7e3'], ['Brass table lamp', '€120', 'lamp', '#33373c', '#f4ecd2'], ['Wool throw', '€89', 'throw', '#8a9a6b', '#efe6da']] },
    { name: 'Bath', count: '11 items', items: [['Linen towel set', '€38', 'towels', '#c9b28f', '#e1e8ef'], ['Cedar candle', '€26', 'candle', '#a3714f', '#efe6da'], ['Bathroom fern', '€22', 'plant', '#e8e1d6', '#e2e9de'], ['Waffle towels', '€34', 'towels', '#8aa39b', '#f2e1e3']] },
  ];
  const root = document.createElement('div');
  root.className = 'dt-root';
  root.innerHTML = `<style>
    .dt-root { position: absolute; inset: 0; overflow: hidden; background: radial-gradient(120% 100% at 50% 0%, #1b1b1e, #0d0d0f); font-family: "Mona Sans", system-ui, -apple-system, sans-serif; color: #15171a; }
    .dt-phone { position: absolute; left: 50%; top: 0; width: 280px; height: 580px; border-radius: 46px; background: #0f1113; box-shadow: inset 0 0 0 1.5px #3a3f46, 0 0 0 1px rgba(255,255,255,.13), 0 40px 80px -30px rgba(0,0,0,.8); transform-origin: 50% 0; }
    .dt-screen { position: absolute; inset: 7px; border-radius: 39px; overflow: hidden; background: #fff; isolation: isolate; padding-top: 44px; box-sizing: border-box; }
    .dt-island { position: absolute; left: 50%; top: 17px; width: 76px; height: 22px; margin-left: -38px; border-radius: 12px; background: #000; z-index: 9; }
    .dt-sb { position: absolute; left: 0; right: 0; top: 0; height: 44px; padding: 0 24px 0 32px; display: flex; align-items: center; justify-content: space-between; font-size: 13px; font-weight: 650; }
    .dt-top { display: flex; justify-content: space-between; align-items: center; margin: 6px 16px 8px; }
    .dt-top h2 { margin: 0; font-size: 27px; font-weight: 750; letter-spacing: -0.02em; }
    .dt-search { width: 34px; height: 34px; border-radius: 50%; background: #f1f3f5; display: grid; place-items: center; }
    .dt-tabs { position: relative; display: flex; gap: 20px; padding: 0 16px; border-bottom: 1px solid #ececf0; }
    .dt-tabs span { height: 36px; display: grid; place-items: center; font-size: 14px; font-weight: 640; color: #9aa0a6; transition: color 200ms ease; }
    .dt-tabs span.on { color: #15171a; }
    .dt-line { position: absolute; left: 0; bottom: -1px; width: 100px; height: 2.5px; border-radius: 2px; background: #15171a; transform-origin: 0 0; }
    .dt-body { position: relative; height: 420px; overflow: hidden; }
    .dt-pane { position: absolute; inset: 0; padding: 12px 12px 0; opacity: 0; }
    .dt-meta { display: flex; justify-content: space-between; margin: 0 4px 10px; font-size: 12px; color: #5b6066; }
    .dt-meta b { color: #15171a; font-weight: 600; }
    .dt-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px 10px; }
    .dt-img { height: 126px; border-radius: 12px; display: grid; place-items: center; }
    .dt-img svg { width: 74%; }
    .dt-grid b { display: block; margin: 7px 2px 0; font-size: 12.5px; font-weight: 620; white-space: nowrap; }
    .dt-grid small { display: block; margin: 2px 2px 0; font-size: 12px; color: #5b6066; }
    .dt-tap { position: absolute; width: 30px; height: 30px; margin: -15px 0 0 -15px; border-radius: 50%; background: rgba(60,60,67,.28); box-shadow: 0 0 0 1.5px rgba(255,255,255,.75); opacity: 0; z-index: 10; pointer-events: none; }
  </style>
  <div class="dt-phone"><div class="dt-screen">
    <div class="dt-sb"><span>9:41</span><svg width="58" height="12" viewBox="0 0 58 12"><g fill="#15171a"><rect x="0" y="8" width="3" height="4" rx=".8"/><rect x="4.5" y="6" width="3" height="6" rx=".8"/><rect x="9" y="3.5" width="3" height="8.5" rx=".8"/><rect x="13.5" y="1" width="3" height="11" rx=".8"/><path d="M26 3.6a8.5 8.5 0 0 1 11 0l-1.3 1.4a6.6 6.6 0 0 0-8.4 0zM28.4 6.3a5 5 0 0 1 6.2 0l-1.3 1.4a3 3 0 0 0-3.6 0zM31.5 11.5l-1.6-1.8a2.4 2.4 0 0 1 3.2 0z"/><rect x="40.5" y=".8" width="15" height="10.4" rx="3" fill="none" stroke="#15171a" stroke-opacity=".45"/><rect x="42" y="2.3" width="10" height="7.4" rx="1.6"/></g></svg></div>
    <div class="dt-top"><h2>Shop</h2><span class="dt-search"><svg width="14" height="14" viewBox="0 0 14 14"><circle cx="6" cy="6" r="4.5" fill="none" stroke="#15171a" stroke-width="1.6"/><path d="M9.5 9.5L13 13" stroke="#15171a" stroke-width="1.6" stroke-linecap="round"/></svg></span></div>
    <div class="dt-tabs">${tabs.map(t => `<span>${t.name}</span>`).join('')}<i class="dt-line"></i></div>
    <div class="dt-body">${tabs.map(t => `<div class="dt-pane"><div class="dt-meta"><span>${t.count}</span><span>Sort: <b>Popular</b></span></div><div class="dt-grid">${t.items.map(([n, p, a, c, bg]) => `<div><div class="dt-img" style="background:${bg}"><svg viewBox="0 0 100 100">${ART[a](c)}</svg></div><b>${n}</b><small>${p}</small></div>`).join('')}</div></div>`).join('')}</div>
    <div class="dt-tap"></div>
  </div><div class="dt-island"></div></div>`;
  stage.append(root);
  const $ = s => root.querySelector(s);
  const phone = $('.dt-phone'), line = $('.dt-line'), tapEl = $('.dt-tap');
  const tabEls = [...root.querySelectorAll('.dt-tabs span')], panes = [...root.querySelectorAll('.dt-pane')];

  const fit = () => {
    const W = stage.clientWidth, H = stage.clientHeight, f = Math.min(1, Math.max(0.66, 0.66 + (H - 260) / 240 * 0.34));
    const s = Math.min(H * 0.92 / (580 * f), W * 0.86 / 280), top = f >= 1 ? (H - 580 * s) / 2 : H * 0.05;
    phone.style.transform = `translate(-50%, ${top}px) scale(${s})`;
  };
  const ro = new ResizeObserver(fit); ro.observe(stage); fit();

  // The underline is a 100px bar moved and stretched onto the active label (offsetLeft/Width ignore the phone's scale).
  const lineFor = i => `translateX(${tabEls[i].offsetLeft}px) scaleX(${tabEls[i].offsetWidth / 100})`;
  let cur = 0;
  tabEls[0].classList.add('on'); panes[0].style.opacity = 1; line.style.transform = lineFor(0);

  const easeOut = 'cubic-bezier(0.23, 1, 0.32, 1)', inOut = 'cubic-bezier(0.77, 0, 0.175, 1)';
  function go(to) {
    const from = cur, dir = to > from ? 1 : -1, d = reduce ? 0 : PARAMS.distance * 100;
    cur = to;
    const el = tabEls[to];
    const bar = el.offsetParent;
    tapEl.style.left = bar.offsetLeft + el.offsetLeft + el.offsetWidth / 2 + 'px'; tapEl.style.top = bar.offsetTop + el.offsetTop + 18 + 'px';
    tapEl.animate([{ opacity: 0, transform: reduce ? 'none' : 'scale(0.8)' }, { opacity: 1, transform: 'scale(1)', offset: 0.3 }, { opacity: 0, transform: reduce ? 'none' : 'scale(1.2)' }], { duration: 460, easing: easeOut });
    tabEls.forEach((t, i) => t.classList.toggle('on', i === to));
    line.animate([{ transform: lineFor(from) }, { transform: lineFor(to) }], { duration: reduce ? 0 : PARAMS.duration, easing: inOut, fill: 'forwards' });
    // Going right, the old content leaves to the left and the new arrives from the right; going left, the mirror.
    panes[from].animate([{ opacity: 1, transform: 'none' }, { opacity: 0, transform: `translateX(${-dir * d}%)` }], { duration: PARAMS.duration * 0.5, easing: easeOut, fill: 'forwards' });
    panes[to].animate([{ opacity: 0, transform: `translateX(${dir * d}%)` }, { opacity: 1, transform: 'none' }], { duration: PARAMS.duration, delay: PARAMS.duration * 0.25, easing: easeOut, fill: 'both' });
  }

  const timers = new Set();
  const later = (fn, ms) => { const id = setTimeout(() => { timers.delete(id); fn(); }, ms); timers.add(id); };
  const order = [2, 1, 3, 0];
  let n = 0;
  const step = () => { go(order[n++ % order.length]); later(step, PARAMS.duration + 1600); };
  later(step, 900);

  return () => { timers.forEach(clearTimeout); ro.disconnect(); root.getAnimations({ subtree: true }).forEach(a => a.cancel()); root.remove(); };
}
