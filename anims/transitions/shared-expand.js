// Shared-element expand (FLIP): in a shop app, the product photo you tap grows out of its card into the top of the product page, and shrinks back into the same card when you go back.
// Measure the card (First), lay the photo out as the page header (Last), transform it back onto the card (Invert), then animate to zero (Play). Scaling stays uniform and a clip trims the extra height, so the product never stretches.
const PARAMS = { duration: 520 };

export default function (stage) {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const sh = w => `<ellipse cx="50" cy="84" rx="${w}" ry="3.6" fill="#000" opacity=".09"/>`;
  const products = [
    { name: 'Stoneware mug', price: '€24', meta: 'Sand glaze · 350 ml', bg: '#efe6da', text: 'Thrown by hand in Porto and glazed in warm sand. Holds a generous morning coffee and keeps it hot.', dots: ['#c9775a', '#8aa39b', '#e8e1d6'],
      art: `${sh(24)}<path d="M63 45h4.5a8.5 8.5 0 0 1 0 17H63" fill="none" stroke="#c9775a" stroke-width="5.5"/><path d="M29 37h36v34a11 11 0 0 1-11 11H40a11 11 0 0 1-11-11z" fill="#c9775a"/><path d="M51 37h14v34a11 11 0 0 1-11 11h-3z" fill="#000" opacity=".08"/><ellipse cx="47" cy="37" rx="18" ry="3.2" fill="#000" opacity=".18"/>` },
    { name: 'Bud vase', price: '€19', meta: 'Glazed clay · 18 cm', bg: '#f2e1e3', text: 'A small vase for one or two stems. Every glaze runs a little differently in the kiln, so no two match.', dots: ['#7f9cb3', '#c9775a', '#e8e1d6'],
      art: `${sh(18)}<path d="M50 28C49 20 47 13 41 8" stroke="#5f7d55" stroke-width="1.6" fill="none"/><path d="M46 14c-6-1-9-5-9-8 5 0 8 3 9 8z" fill="#7d9a6b"/><path d="M44 26h12v6c0 4 13 9 13 25 0 15-9 24-19 24s-19-9-19-24c0-16 13-21 13-25z" fill="#7f9cb3"/><path d="M50 26h6v6c0 4 13 9 13 25 0 15-9 24-19 24z" fill="#000" opacity=".08"/><ellipse cx="50" cy="26" rx="6" ry="1.6" fill="#000" opacity=".22"/>` },
    { name: 'Brass table lamp', price: '€120', meta: 'Warm white · dimmable', bg: '#e9e7e3', text: 'A solid brass base under a linen-lined shade that throws a soft, low pool of light.', dots: ['#d9a441', '#33373c'],
      art: `${sh(20)}<ellipse cx="50" cy="60" rx="20" ry="11" fill="#fff6d8" opacity=".55"/><ellipse cx="50" cy="80" rx="15" ry="4" fill="#d9a441"/><rect x="48.6" y="44" width="2.8" height="36" fill="#2d2f33"/><path d="M28 47c0-14 10-22 22-22s22 8 22 22z" fill="#d9a441"/><path d="M50 25c12 0 22 8 22 22H50z" fill="#000" opacity=".08"/><ellipse cx="50" cy="47" rx="22" ry="3" fill="#fff4d0"/>` },
    { name: 'Glass carafe', price: '€32', meta: '1 litre · with lid', bg: '#e1e8ef', text: 'Mouth-blown glass with a cork-lined lid. Slim enough to stand in the fridge door.', dots: ['#7fa9c4', '#c9b28f'],
      art: `${sh(20)}<path d="M43 16h14v15c0 3 11 9 11 20v23a8 8 0 0 1-8 8H40a8 8 0 0 1-8-8V51c0-11 11-17 11-20z" fill="#fff" fill-opacity=".6" stroke="#fff" stroke-width="1.5"/><path d="M32.8 58h34.4v16a8 8 0 0 1-8 8H40.8a8 8 0 0 1-8-8z" fill="#7fa9c4" opacity=".6"/><path d="M38 49v21" stroke="#fff" stroke-width="2.5" stroke-linecap="round"/><rect x="42" y="12" width="16" height="5" rx="2.5" fill="#fff"/>` },
  ];
  const HW = 266, HH = 300;
  const root = document.createElement('div');
  root.className = 'fx-root';
  root.innerHTML = `<style>
    .fx-root { position: absolute; inset: 0; overflow: hidden; background: radial-gradient(120% 100% at 50% 0%, #eef6f5, #d5e8e5); font-family: "Mona Sans", system-ui, -apple-system, sans-serif; color: #15171a; }
    .fx-phone { position: absolute; left: 50%; top: 0; width: 280px; height: 580px; border-radius: 46px; background: #0f1113; box-shadow: inset 0 0 0 1.5px #2b2f34, 0 40px 80px -30px rgba(8,45,42,.45), 0 12px 30px -12px rgba(8,45,42,.3); transform-origin: 50% 0; }
    .fx-screen { position: absolute; inset: 7px; border-radius: 39px; overflow: hidden; background: #fff; isolation: isolate; }
    .fx-island { position: absolute; left: 50%; top: 17px; width: 76px; height: 22px; margin-left: -38px; border-radius: 12px; background: #000; z-index: 9; }
    .fx-sb { position: absolute; left: 0; right: 0; top: 0; height: 44px; padding: 0 24px 0 32px; display: flex; align-items: center; justify-content: space-between; font-size: 13px; font-weight: 650; z-index: 8; }
    .fx-list { position: absolute; inset: 0; padding: 44px 12px 0; }
    .fx-top { display: flex; justify-content: space-between; align-items: center; margin: 6px 4px 10px; }
    .fx-top h2 { margin: 0; font-size: 27px; font-weight: 750; letter-spacing: -0.02em; }
    .fx-bag { width: 34px; height: 34px; border-radius: 50%; background: #f1f3f5; display: grid; place-items: center; }
    .fx-chips { display: flex; gap: 6px; margin: 0 0 12px; }
    .fx-chips span { height: 26px; padding: 0 11px; border-radius: 999px; display: grid; place-items: center; font-size: 12px; font-weight: 600; background: #f1f3f5; color: #33373c; }
    .fx-chips span:first-child { background: #15171a; color: #fff; }
    .fx-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px 10px; }
    .fx-card .fx-img { height: 128px; border-radius: 12px; display: grid; place-items: center; }
    .fx-img svg { width: 74%; }
    .fx-card b { display: block; margin: 7px 2px 0; font-size: 12.5px; font-weight: 620; white-space: nowrap; }
    .fx-card small { display: block; margin: 2px 2px 0; font-size: 12px; color: #5b6066; }
    .fx-detail { position: absolute; inset: 0; pointer-events: none; }
    .fx-paper { position: absolute; inset: 0; background: #fff; opacity: 0; }
    .fx-hero { position: absolute; left: 0; top: 0; width: ${HW}px; height: ${HH}px; display: grid; place-items: center; transform-origin: 0 0; visibility: hidden; will-change: transform, clip-path; }
    .fx-btn { position: absolute; top: 50px; width: 32px; height: 32px; border-radius: 50%; background: rgba(255,255,255,.85); display: grid; place-items: center; opacity: 0; }
    .fx-info { position: absolute; left: 18px; right: 18px; top: ${HH + 16}px; }
    .fx-info > * { opacity: 0; }
    .fx-info h3 { margin: 0; font-size: 21px; font-weight: 720; letter-spacing: -0.02em; font-stretch: 106%; }
    .fx-row { display: flex; justify-content: space-between; align-items: baseline; margin-top: 4px; font-size: 12.5px; color: #5b6066; }
    .fx-row b { font-size: 17px; color: #15171a; font-weight: 680; }
    .fx-info p { margin: 12px 0 0; font-size: 12.5px; line-height: 1.5; color: #33373c; }
    .fx-dots { display: flex; gap: 8px; margin-top: 14px; }
    .fx-dots i { width: 18px; height: 18px; border-radius: 50%; box-shadow: inset 0 0 0 1px rgba(0,0,0,.08); }
    .fx-dots i:first-child { box-shadow: 0 0 0 2px #fff, 0 0 0 3.5px #15171a; }
    .fx-add { position: absolute; left: 18px; right: 18px; bottom: 26px; height: 46px; border-radius: 999px; background: #15171a; color: #fff; display: grid; place-items: center; font-size: 14px; font-weight: 640; opacity: 0; }
    .fx-tap { position: absolute; width: 30px; height: 30px; margin: -15px 0 0 -15px; border-radius: 50%; background: rgba(60,60,67,.28); box-shadow: 0 0 0 1.5px rgba(255,255,255,.75); opacity: 0; z-index: 10; pointer-events: none; }
  </style>
  <div class="fx-phone"><div class="fx-screen">
    <div class="fx-list"><div class="fx-top"><h2>Shop</h2><span class="fx-bag"><svg width="16" height="18" viewBox="0 0 20 22"><path d="M2.5 7h15l-1 13a1.6 1.6 0 0 1-1.6 1.5H5.1A1.6 1.6 0 0 1 3.5 20zM6.5 7V5.5a3.5 3.5 0 0 1 7 0V7" fill="none" stroke="#15171a" stroke-width="1.7" stroke-linejoin="round"/></svg></span></div>
      <div class="fx-chips"><span>All</span><span>Kitchen</span><span>Living</span><span>Bath</span></div>
      <div class="fx-grid">${products.map(p => `<div class="fx-card"><div class="fx-img" style="background:${p.bg}"><svg viewBox="0 0 100 100">${p.art}</svg></div><b>${p.name}</b><small>${p.price}</small></div>`).join('')}</div></div>
    <div class="fx-detail"><div class="fx-paper"></div>
      <div class="fx-info"><h3></h3><div class="fx-row"><span></span><b></b></div><p></p><div class="fx-dots"></div></div>
      <div class="fx-add"></div>
      <div class="fx-hero"><svg viewBox="0 0 100 100" style="width:74%"></svg></div>
      <span class="fx-btn" style="left:14px"><svg width="10" height="16" viewBox="0 0 10 17"><path d="M8.5 1.5L2 8.5l6.5 7" fill="none" stroke="#15171a" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg></span>
      <span class="fx-btn" style="right:14px"><svg width="15" height="15" viewBox="0 0 24 24"><path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z" fill="none" stroke="#15171a" stroke-width="2"/></svg></span></div>
    <div class="fx-sb"><span>9:41</span><svg width="58" height="12" viewBox="0 0 58 12"><g fill="#15171a"><rect x="0" y="8" width="3" height="4" rx=".8"/><rect x="4.5" y="6" width="3" height="6" rx=".8"/><rect x="9" y="3.5" width="3" height="8.5" rx=".8"/><rect x="13.5" y="1" width="3" height="11" rx=".8"/><path d="M26 3.6a8.5 8.5 0 0 1 11 0l-1.3 1.4a6.6 6.6 0 0 0-8.4 0zM28.4 6.3a5 5 0 0 1 6.2 0l-1.3 1.4a3 3 0 0 0-3.6 0zM31.5 11.5l-1.6-1.8a2.4 2.4 0 0 1 3.2 0z"/><rect x="40.5" y=".8" width="15" height="10.4" rx="3" fill="none" stroke="#15171a" stroke-opacity=".45"/><rect x="42" y="2.3" width="10" height="7.4" rx="1.6"/></g></svg></div>
    <div class="fx-tap"></div>
  </div><div class="fx-island"></div></div>`;
  stage.append(root);
  const $ = s => root.querySelector(s);
  const phone = $('.fx-phone'), screen = $('.fx-screen'), list = $('.fx-list'), paper = $('.fx-paper'), hero = $('.fx-hero'), heroSvg = hero.firstElementChild, tapEl = $('.fx-tap');
  const info = $('.fx-info'), add = $('.fx-add'), btns = [...root.querySelectorAll('.fx-btn')];
  const tiles = [...root.querySelectorAll('.fx-img')];

  const fit = () => {
    const W = stage.clientWidth, H = stage.clientHeight, f = Math.min(1, Math.max(0.66, 0.66 + (H - 260) / 240 * 0.34));
    const s = Math.min(H * 0.92 / (580 * f), W * 0.86 / 280), top = f >= 1 ? (H - 580 * s) / 2 : H * 0.05;
    phone.style.transform = `translate(-50%, ${top}px) scale(${s})`;
  };
  const ro = new ResizeObserver(fit); ro.observe(stage); fit();

  // A rect in the screen's own (unscaled) pixels.
  const local = el => { const sr = screen.getBoundingClientRect(), r = el.getBoundingClientRect(), k = sr.width / 266; return { x: (r.left - sr.left) / k, y: (r.top - sr.top) / k, w: r.width / k, h: r.height / k }; };
  // Invert: the transform and clip that make the header look exactly like the card's photo.
  const inverted = t => {
    const k = Math.max(t.w / HW, t.h / HH), ix = (HW - t.w / k) / 2, iy = (HH - t.h / k) / 2;
    return { transform: `translate(${t.x - k * ix}px, ${t.y - k * iy}px) scale(${k})`, clipPath: `inset(${iy}px ${ix}px ${iy}px ${ix}px round ${12 / k}px)` };
  };
  const played = { transform: 'translate(0px, 0px) scale(1)', clipPath: 'inset(0px 0px 0px 0px round 0px)' };
  const easeOut = 'cubic-bezier(0.23, 1, 0.32, 1)', curve = 'cubic-bezier(0.32, 0.72, 0, 1)';
  const tap = (x, y) => {
    tapEl.style.left = x + 'px'; tapEl.style.top = y + 'px';
    tapEl.animate([{ opacity: 0, transform: reduce ? 'none' : 'scale(0.8)' }, { opacity: 1, transform: 'scale(1)', offset: 0.3 }, { opacity: 0, transform: reduce ? 'none' : 'scale(1.2)' }], { duration: 460, easing: easeOut });
  };

  function open(i) {
    const p = products[i], tile = tiles[i], t = local(tile);
    hero.style.background = p.bg; heroSvg.innerHTML = p.art;
    info.querySelector('h3').textContent = p.name; info.querySelector('.fx-row span').textContent = p.meta; info.querySelector('.fx-row b').textContent = p.price;
    info.querySelector('p').textContent = p.text; info.querySelector('.fx-dots').innerHTML = p.dots.map(c => `<i style="background:${c}"></i>`).join('');
    add.textContent = `Add to bag · ${p.price}`;
    hero.style.visibility = 'visible'; tile.style.visibility = 'hidden';
    const o = { duration: PARAMS.duration, easing: curve, fill: 'both' };
    // Reduced motion: the header fades in at full size instead of growing out of the card.
    hero.animate(reduce ? [{ ...played, opacity: 0 }, { ...played, opacity: 1 }] : [inverted(t), played], o);
    paper.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 240, easing: easeOut, fill: 'both' });
    list.animate([{ opacity: 1, transform: 'none' }, { opacity: 0, transform: reduce ? 'none' : 'scale(0.97)' }], { duration: 300, easing: easeOut, fill: 'both' });
    [...info.children, add].forEach((el, j) => el.animate([{ opacity: 0, transform: reduce ? 'none' : 'translateY(14px)' }, { opacity: 1, transform: 'none' }],
      { duration: 360, delay: PARAMS.duration * 0.35 + j * 45, easing: easeOut, fill: 'both' }));
    btns.forEach(b => b.animate([{ opacity: 0, transform: reduce ? 'none' : 'scale(0.9)' }, { opacity: 1, transform: 'none' }], { duration: 240, delay: PARAMS.duration * 0.6, easing: easeOut, fill: 'both' }));
  }
  function close(i) {
    const tile = tiles[i], t = local(tile);
    const o = { duration: PARAMS.duration, easing: curve, fill: 'both' };
    [...info.children, add, ...btns].forEach(el => el.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 120, easing: easeOut, fill: 'both' }));
    paper.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 260, delay: 80, easing: easeOut, fill: 'both' });
    list.animate([{ opacity: 0, transform: reduce ? 'none' : 'scale(0.97)' }, { opacity: 1, transform: 'none' }], { duration: 320, delay: 60, easing: easeOut, fill: 'both' });
    if (reduce) tile.style.visibility = ''; // the card is already back under the fading header
    hero.animate(reduce ? [{ ...played, opacity: 1 }, { ...played, opacity: 0 }] : [played, inverted(t)], o).onfinish = () => { tile.style.visibility = ''; hero.style.visibility = 'hidden'; };
  }

  const timers = new Set();
  const later = (fn, ms) => { const id = setTimeout(() => { timers.delete(id); fn(); }, ms); timers.add(id); };
  const order = [0, 3, 1, 2];
  let n = 0;
  function cycle() {
    const i = order[n++ % order.length], t = local(tiles[i]);
    later(() => { tap(t.x + t.w / 2, t.y + t.h / 2); tiles[i].parentElement.animate([{ transform: 'scale(1)' }, { transform: 'scale(0.97)' }, { transform: 'scale(1)' }], { duration: reduce ? 0 : 200, easing: easeOut }); }, 700);
    later(() => open(i), 820);
    later(() => tap(30, 66), 820 + PARAMS.duration + 1700);
    later(() => close(i), 820 + PARAMS.duration + 1800);
    later(cycle, 820 + PARAMS.duration * 2 + 1800 + 500);
  }
  cycle();

  return () => { timers.forEach(clearTimeout); ro.disconnect(); root.getAnimations({ subtree: true }).forEach(a => a.cancel()); root.remove(); };
}
