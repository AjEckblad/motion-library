// Blur crossfade: switch a shop category between grid and list view and the two layouts melt into each other through a short blur.
// The layouts share nothing that could morph, and a plain crossfade would show two sets of products on top of each other. Blurring both during the swap hides that double image, so the eye reads one view changing into the other.
const PARAMS = { duration: 260, blur: 8 };

export default function (stage) {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const sh = w => `<ellipse cx="50" cy="84" rx="${w}" ry="3.6" fill="#000" opacity=".09"/>`;
  const ART = {
    vase: c => `${sh(18)}<path d="M50 28C49 20 47 13 41 8" stroke="#5f7d55" stroke-width="1.6" fill="none"/><path d="M46 14c-6-1-9-5-9-8 5 0 8 3 9 8z" fill="#7d9a6b"/><path d="M44 26h12v6c0 4 13 9 13 25 0 15-9 24-19 24s-19-9-19-24c0-16 13-21 13-25z" fill="${c}"/><path d="M50 26h6v6c0 4 13 9 13 25 0 15-9 24-19 24z" fill="#000" opacity=".08"/>`,
    candle: c => `${sh(18)}<path d="M50 23c3.5 4 4.5 7.5 0 11-4.5-3.5-3.5-7 0-11z" fill="#f59f00"/><rect x="49.3" y="34" width="1.4" height="6" fill="#33373c"/><rect x="33" y="40" width="34" height="42" rx="6" fill="${c}"/><rect x="38" y="56" width="24" height="14" rx="2" fill="#fff" opacity=".88"/>`,
    lamp: c => `${sh(20)}<ellipse cx="50" cy="60" rx="20" ry="11" fill="#fff6d8" opacity=".55"/><ellipse cx="50" cy="80" rx="15" ry="4" fill="${c}"/><rect x="48.6" y="44" width="2.8" height="36" fill="#2d2f33"/><path d="M28 47c0-14 10-22 22-22s22 8 22 22z" fill="${c}"/><path d="M50 25c12 0 22 8 22 22H50z" fill="#000" opacity=".08"/><ellipse cx="50" cy="47" rx="22" ry="3" fill="#fff4d0"/>`,
    throw: c => `${sh(30)}<rect x="20" y="62" width="60" height="18" rx="7" fill="${c}"/><rect x="23" y="45" width="56" height="18" rx="7" fill="${c}"/><rect x="23" y="45" width="56" height="18" rx="7" fill="#fff" opacity=".16"/><rect x="26" y="28" width="52" height="18" rx="7" fill="${c}"/><path d="M34 28v18M40 28v18M34 45v18M40 45v18M34 62v18M40 62v18" stroke="#fff" stroke-opacity=".45" stroke-width="1.6"/>`,
    plant: c => `${sh(20)}<path d="M50 58C44 45 34 40 26 40c2 10 12 17 24 18z" fill="#5c8a5a"/><path d="M50 58c6-13 16-18 24-18-2 10-12 17-24 18z" fill="#6f9e64"/><path d="M50 58c-4-16-2-29 6-37 4 12 2 25-6 37z" fill="#7fb06f"/><path d="M50 58c-8-12-10-25-4-35 6 10 8 23 4 35z" fill="#4f7a4c"/><path d="M35 58h30l-4 24H39z" fill="${c}"/><rect x="33" y="55" width="34" height="6" rx="2" fill="${c}"/>`,
  };
  const items = [
    ['Bud vase', 'Glazed clay · 18 cm', '€19', '4.7', 'vase', '#7f9cb3', '#f2e1e3'],
    ['Fig leaf candle', '40 hour burn', '€28', '4.9', 'candle', '#49606e', '#e9e7e3'],
    ['Brass table lamp', 'Dimmable · 42 cm', '€120', '4.8', 'lamp', '#d9a441', '#f4ecd2'],
    ['Wool throw', '130 × 170 cm', '€89', '4.6', 'throw', '#8a9a6b', '#efe6da'],
    ['Ceramic planter', 'With saucer · 14 cm', '€26', '4.8', 'plant', '#e0b08b', '#e2e9de'],
  ];
  const svg = (a, c) => `<svg viewBox="0 0 100 100">${ART[a](c)}</svg>`;
  const root = document.createElement('div');
  root.className = 'bc-root';
  root.innerHTML = `<style>
    .bc-root { position: absolute; inset: 0; overflow: hidden; background: radial-gradient(120% 100% at 50% 0%, #1b1b1e, #0d0d0f); font-family: "Mona Sans", system-ui, -apple-system, sans-serif; color: #15171a; }
    .bc-phone { position: absolute; left: 50%; top: 0; width: 280px; height: 580px; border-radius: 46px; background: #0f1113; box-shadow: inset 0 0 0 1.5px #3a3f46, 0 0 0 1px rgba(255,255,255,.13), 0 40px 80px -30px rgba(0,0,0,.8); transform-origin: 50% 0; }
    .bc-screen { position: absolute; inset: 7px; border-radius: 39px; overflow: hidden; background: #fff; isolation: isolate; padding-top: 44px; box-sizing: border-box; }
    .bc-island { position: absolute; left: 50%; top: 17px; width: 76px; height: 22px; margin-left: -38px; border-radius: 12px; background: #000; z-index: 9; }
    .bc-sb { position: absolute; left: 0; right: 0; top: 0; height: 44px; padding: 0 24px 0 32px; display: flex; align-items: center; justify-content: space-between; font-size: 13px; font-weight: 650; }
    .bc-nav { height: 30px; display: flex; align-items: center; gap: 3px; padding: 0 10px; color: #0e9488; font-size: 14px; }
    .bc-top { display: flex; justify-content: space-between; align-items: flex-end; margin: 2px 14px 12px 16px; }
    .bc-top h2 { margin: 0; font-size: 26px; font-weight: 750; letter-spacing: -0.02em; }
    .bc-top p { margin: 2px 0 0; font-size: 12px; color: #5b6066; }
    .bc-seg { position: relative; display: flex; padding: 3px; border-radius: 10px; background: #f1f3f5; }
    .bc-seg span { position: relative; z-index: 1; width: 32px; height: 26px; display: grid; place-items: center; }
    .bc-pill { position: absolute; left: 3px; top: 3px; width: 32px; height: 26px; border-radius: 7px; background: #fff; box-shadow: 0 1px 2px rgba(20,30,60,.12), 0 2px 6px -2px rgba(20,30,60,.14); }
    .bc-body { position: relative; height: 460px; }
    .bc-view { position: absolute; inset: 0; padding: 0 12px; will-change: filter, opacity, transform; }
    .bc-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px 10px; }
    .bc-img { height: 140px; border-radius: 12px; display: grid; place-items: center; }
    .bc-img svg { width: 76%; }
    .bc-grid b { display: block; margin: 7px 2px 0; font-size: 12.5px; font-weight: 620; white-space: nowrap; }
    .bc-grid small { display: block; margin: 2px 2px 0; font-size: 12px; color: #5b6066; }
    .bc-row { display: flex; align-items: center; gap: 12px; padding: 7px 4px; border-bottom: 1px solid #f0f1f3; }
    .bc-thumb { width: 58px; height: 58px; border-radius: 10px; display: grid; place-items: center; flex: none; }
    .bc-thumb svg { width: 50px; }
    .bc-row div { flex: 1; min-width: 0; }
    .bc-row b { display: block; font-size: 13px; font-weight: 620; }
    .bc-row small { display: block; margin-top: 2px; font-size: 11.5px; color: #5b6066; }
    .bc-row em { display: block; margin-top: 4px; font-style: normal; font-size: 11px; color: #5b6066; }
    .bc-row em::before { content: "★ "; color: #f59f00; }
    .bc-row strong { font-size: 13px; font-weight: 660; }
    .bc-tap { position: absolute; width: 30px; height: 30px; margin: -15px 0 0 -15px; border-radius: 50%; background: rgba(60,60,67,.28); box-shadow: 0 0 0 1.5px rgba(255,255,255,.75); opacity: 0; z-index: 10; pointer-events: none; }
  </style>
  <div class="bc-phone"><div class="bc-screen">
    <div class="bc-sb"><span>9:41</span><svg width="58" height="12" viewBox="0 0 58 12"><g fill="#15171a"><rect x="0" y="8" width="3" height="4" rx=".8"/><rect x="4.5" y="6" width="3" height="6" rx=".8"/><rect x="9" y="3.5" width="3" height="8.5" rx=".8"/><rect x="13.5" y="1" width="3" height="11" rx=".8"/><path d="M26 3.6a8.5 8.5 0 0 1 11 0l-1.3 1.4a6.6 6.6 0 0 0-8.4 0zM28.4 6.3a5 5 0 0 1 6.2 0l-1.3 1.4a3 3 0 0 0-3.6 0zM31.5 11.5l-1.6-1.8a2.4 2.4 0 0 1 3.2 0z"/><rect x="40.5" y=".8" width="15" height="10.4" rx="3" fill="none" stroke="#15171a" stroke-opacity=".45"/><rect x="42" y="2.3" width="10" height="7.4" rx="1.6"/></g></svg></div>
    <div class="bc-nav"><svg width="10" height="17" viewBox="0 0 10 17"><path d="M8.5 1.5L2 8.5l6.5 7" fill="none" stroke="#0e9488" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>Shop</div>
    <div class="bc-top"><div><h2>Living</h2><p>17 items · free delivery</p></div>
      <div class="bc-seg"><i class="bc-pill"></i>
        <span><svg width="14" height="14" viewBox="0 0 14 14" fill="#15171a"><rect x="0" y="0" width="6" height="6" rx="1.5"/><rect x="8" y="0" width="6" height="6" rx="1.5"/><rect x="0" y="8" width="6" height="6" rx="1.5"/><rect x="8" y="8" width="6" height="6" rx="1.5"/></svg></span>
        <span><svg width="14" height="14" viewBox="0 0 14 14" fill="#15171a"><rect x="0" y="0.5" width="3.5" height="3.5" rx="1"/><rect x="5" y="1" width="9" height="2.4" rx="1.2"/><rect x="0" y="5.3" width="3.5" height="3.5" rx="1"/><rect x="5" y="5.8" width="9" height="2.4" rx="1.2"/><rect x="0" y="10" width="3.5" height="3.5" rx="1"/><rect x="5" y="10.5" width="9" height="2.4" rx="1.2"/></svg></span></div></div>
    <div class="bc-body">
      <div class="bc-view"><div class="bc-grid">${items.slice(0, 4).map(([n, , p, , a, c, bg]) => `<div><div class="bc-img" style="background:${bg}">${svg(a, c)}</div><b>${n}</b><small>${p}</small></div>`).join('')}</div></div>
      <div class="bc-view" style="opacity:0">${items.map(([n, m, p, r, a, c, bg]) => `<div class="bc-row"><span class="bc-thumb" style="background:${bg}">${svg(a, c)}</span><div><b>${n}</b><small>${m}</small><em>${r}</em></div><strong>${p}</strong></div>`).join('')}</div>
    </div>
    <div class="bc-tap"></div>
  </div><div class="bc-island"></div></div>`;
  stage.append(root);
  const $ = s => root.querySelector(s);
  const phone = $('.bc-phone'), screen = $('.bc-screen'), pill = $('.bc-pill'), tapEl = $('.bc-tap');
  const views = [...root.querySelectorAll('.bc-view')], segs = [...root.querySelectorAll('.bc-seg span')];

  const fit = () => {
    const W = stage.clientWidth, H = stage.clientHeight, f = Math.min(1, Math.max(0.66, 0.66 + (H - 260) / 240 * 0.34));
    const s = Math.min(H * 0.92 / (580 * f), W * 0.86 / 280), top = f >= 1 ? (H - 580 * s) / 2 : H * 0.05;
    phone.style.transform = `translate(-50%, ${top}px) scale(${s})`;
  };
  const ro = new ResizeObserver(fit); ro.observe(stage); fit();

  const easeOut = 'cubic-bezier(0.23, 1, 0.32, 1)';
  let cur = 0;
  function swap() {
    const from = cur, to = 1 - cur, B = PARAMS.blur, D = PARAMS.duration;
    cur = to;
    const seg = segs[to], sr = screen.getBoundingClientRect(), r = seg.getBoundingClientRect(), k = sr.width / 266;
    tapEl.style.left = (r.left - sr.left + r.width / 2) / k + 'px'; tapEl.style.top = (r.top - sr.top + r.height / 2) / k + 'px';
    tapEl.animate([{ opacity: 0, transform: reduce ? 'none' : 'scale(0.8)' }, { opacity: 1, transform: 'scale(1)', offset: 0.3 }, { opacity: 0, transform: reduce ? 'none' : 'scale(1.2)' }], { duration: 460, easing: easeOut });
    pill.animate([{ transform: `translateX(${from * 32}px)` }, { transform: `translateX(${to * 32}px)` }], { duration: reduce ? 0 : 240, easing: easeOut, fill: 'forwards' });
    // Both views blur during the overlap; the old one shrinks a touch, the new one settles from a touch larger.
    views[from].animate([{ opacity: 1, filter: 'blur(0px)', transform: 'none' }, { opacity: 0, filter: `blur(${B}px)`, transform: reduce ? 'none' : 'scale(0.98)' }], { duration: D, easing: easeOut, fill: 'forwards' });
    views[to].animate([{ opacity: 0, filter: `blur(${B}px)`, transform: reduce ? 'none' : 'scale(1.02)' }, { opacity: 1, filter: 'blur(0px)', transform: 'none' }], { duration: D, delay: D * 0.15, easing: easeOut, fill: 'both' });
  }

  const timers = new Set();
  const later = (fn, ms) => { const id = setTimeout(() => { timers.delete(id); fn(); }, ms); timers.add(id); };
  const step = () => { swap(); later(step, PARAMS.duration + 1800); };
  later(step, 1000);

  return () => { timers.forEach(clearTimeout); ro.disconnect(); root.getAnimations({ subtree: true }).forEach(a => a.cancel()); root.remove(); };
}
