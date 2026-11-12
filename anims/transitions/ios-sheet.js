// iOS sheet: on a product page, tapping "Choose size" slides a sheet up from the bottom while the page behind shrinks back, rounds its corners and dims, just like iOS.
// The sheet and the page move on the same drawer curve (fast start, long soft landing), so they read as one physical stack: the page steps back to make room, and the black gap around it tells you it's still there underneath.
const PARAMS = { duration: 500, backScale: 0.92, dim: 0.25 };

export default function (stage) {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const sbIcons = c => `<svg width="58" height="12" viewBox="0 0 58 12"><g fill="${c}"><rect x="0" y="8" width="3" height="4" rx=".8"/><rect x="4.5" y="6" width="3" height="6" rx=".8"/><rect x="9" y="3.5" width="3" height="8.5" rx=".8"/><rect x="13.5" y="1" width="3" height="11" rx=".8"/><path d="M26 3.6a8.5 8.5 0 0 1 11 0l-1.3 1.4a6.6 6.6 0 0 0-8.4 0zM28.4 6.3a5 5 0 0 1 6.2 0l-1.3 1.4a3 3 0 0 0-3.6 0zM31.5 11.5l-1.6-1.8a2.4 2.4 0 0 1 3.2 0z"/><rect x="40.5" y=".8" width="15" height="10.4" rx="3" fill="none" stroke="${c}" stroke-opacity=".45"/><rect x="42" y="2.3" width="10" height="7.4" rx="1.6"/></g></svg>`;
  const shirt = c => `<ellipse cx="50" cy="86" rx="30" ry="3.6" fill="#000" opacity=".09"/><path d="M38 18l-14 7-9 19 10 5 6-9v46h38V40l6 9 10-5-9-19-14-7c-2 5-6 8-12 8s-10-3-12-8z" fill="${c}"/><path d="M38 18c2 5 6 8 12 8s10-3 12-8l-3-1.5c-2 3.5-5 5.5-9 5.5s-7-2-9-5.5z" fill="#000" opacity=".14"/><path d="M50 26v60" stroke="#000" stroke-opacity=".1" stroke-width="1.2"/><g fill="#fff" opacity=".75"><circle cx="52.5" cy="36" r="1.2"/><circle cx="52.5" cy="48" r="1.2"/><circle cx="52.5" cy="60" r="1.2"/><circle cx="52.5" cy="72" r="1.2"/></g><rect x="57" y="38" width="10" height="10" rx="1.5" fill="#000" opacity=".08"/>`;
  const sizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
  const root = document.createElement('div');
  root.className = 'is-root';
  root.innerHTML = `<style>
    .is-root { position: absolute; inset: 0; overflow: hidden; background: radial-gradient(120% 100% at 50% 0%, #1b1b1e, #0d0d0f); font-family: "Mona Sans", system-ui, -apple-system, sans-serif; color: #15171a; }
    .is-phone { position: absolute; left: 50%; top: 0; width: 280px; height: 580px; border-radius: 46px; background: #0f1113; box-shadow: inset 0 0 0 1.5px #3a3f46, 0 0 0 1px rgba(255,255,255,.13), 0 40px 80px -30px rgba(0,0,0,.8); transform-origin: 50% 0; }
    .is-screen { position: absolute; inset: 7px; border-radius: 39px; overflow: hidden; background: #000; isolation: isolate; }
    .is-island { position: absolute; left: 50%; top: 17px; width: 76px; height: 22px; margin-left: -38px; border-radius: 12px; background: #000; z-index: 9; }
    .is-sb { position: absolute; left: 0; right: 0; top: 0; height: 44px; padding: 0 24px 0 32px; display: flex; align-items: center; justify-content: space-between; font-size: 13px; font-weight: 650; z-index: 8; }
    .is-sb.w { color: #fff; opacity: 0; }
    .is-page { position: absolute; inset: 0; background: #fff; transform-origin: 50% 0; clip-path: inset(0px round 39px); will-change: transform; }
    .is-hero { height: 286px; background: #e2e9de; display: grid; place-items: center; }
    .is-hero svg { width: 210px; height: 210px; margin-top: 30px; }
    .is-btn { position: absolute; top: 50px; width: 32px; height: 32px; border-radius: 50%; background: rgba(255,255,255,.85); display: grid; place-items: center; }
    .is-badge { position: absolute; right: -3px; top: -3px; min-width: 15px; height: 15px; border-radius: 999px; background: #0e9488; color: #fff; font-size: 9.5px; font-weight: 700; display: grid; place-items: center; opacity: 0; }
    .is-info { padding: 16px 18px 0; }
    .is-info h3 { margin: 0; font-size: 20px; font-weight: 720; letter-spacing: -0.02em; font-stretch: 106%; }
    .is-meta { display: flex; justify-content: space-between; align-items: baseline; margin-top: 3px; font-size: 12.5px; color: #5b6066; }
    .is-meta b { font-size: 17px; color: #15171a; font-weight: 680; }
    .is-pick { position: relative; margin-top: 14px; height: 44px; border-radius: 12px; box-shadow: inset 0 0 0 1px #dfe3e8; display: flex; align-items: center; justify-content: space-between; padding: 0 14px; font-size: 13.5px; font-weight: 600; }
    .is-pick span { color: #5b6066; font-weight: 500; display: flex; gap: 6px; align-items: center; }
    .is-info p { margin: 14px 0 0; font-size: 12.5px; line-height: 1.5; color: #33373c; }
    .is-dim { position: absolute; inset: 0; background: #000; opacity: 0; pointer-events: none; }
    .is-sheet { position: absolute; left: 0; right: 0; top: 54px; bottom: 0; background: #fff; border-radius: 14px 14px 0 0; padding: 8px 18px 0; box-sizing: border-box; transform: translateY(101%); will-change: transform; }
    .is-grab { width: 36px; height: 5px; border-radius: 3px; background: #d4d6da; margin: 0 auto 14px; }
    .is-sheet h4 { margin: 0; display: flex; justify-content: space-between; align-items: baseline; font-size: 18px; font-weight: 720; letter-spacing: -0.015em; }
    .is-sheet h4 span { font-size: 12.5px; font-weight: 600; color: #0e9488; letter-spacing: 0; }
    .is-sub { margin-top: 4px; font-size: 12px; color: #5b6066; }
    .is-sizes { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin-top: 16px; }
    .is-sizes i { height: 46px; border-radius: 11px; box-shadow: inset 0 0 0 1px #dfe3e8; display: grid; place-items: center; font-style: normal; font-size: 14px; font-weight: 640; }
    .is-sizes i.on { background: #15171a; color: #fff; box-shadow: none; }
    .is-sizes i.out { color: #b6bbc1; text-decoration: line-through; }
    .is-fit { margin-top: 16px; padding: 12px; border-radius: 12px; background: #f4f6f8; font-size: 12px; line-height: 1.45; color: #33373c; }
    .is-fit b { display: block; margin-bottom: 4px; font-size: 12.5px; color: #15171a; }
    .is-add { position: absolute; left: 18px; right: 18px; bottom: 28px; height: 46px; border-radius: 999px; background: #15171a; color: #fff; display: grid; place-items: center; font-size: 14px; font-weight: 640; }
    .is-tap { position: absolute; width: 30px; height: 30px; margin: -15px 0 0 -15px; border-radius: 50%; background: rgba(60,60,67,.28); box-shadow: 0 0 0 1.5px rgba(255,255,255,.75); opacity: 0; z-index: 10; pointer-events: none; }
  </style>
  <div class="is-phone"><div class="is-screen">
    <section class="is-page">
      <div class="is-hero"><svg viewBox="0 0 100 100">${shirt('#8aa58a')}</svg></div>
      <span class="is-btn" style="left:14px"><svg width="10" height="16" viewBox="0 0 10 17"><path d="M8.5 1.5L2 8.5l6.5 7" fill="none" stroke="#15171a" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg></span>
      <span class="is-btn" style="right:14px"><svg width="15" height="16" viewBox="0 0 20 22"><path d="M2.5 7h15l-1 13a1.6 1.6 0 0 1-1.6 1.5H5.1A1.6 1.6 0 0 1 3.5 20zM6.5 7V5.5a3.5 3.5 0 0 1 7 0V7" fill="none" stroke="#15171a" stroke-width="1.8" stroke-linejoin="round"/></svg><i class="is-badge">1</i></span>
      <div class="is-info"><h3>Linen overshirt</h3><div class="is-meta"><span>Sage · relaxed fit</span><b>€79</b></div>
        <div class="is-pick">Size<span>Choose size <svg width="7" height="12" viewBox="0 0 8 14"><path d="M1.5 1.5L6.5 7l-5 5.5" fill="none" stroke="#9aa0a6" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg></span></div>
        <p>Midweight washed linen with a boxy cut and two chest pockets. Wear it open over a tee or buttoned up.</p></div>
      <div class="is-dim"></div>
    </section>
    <div class="is-sheet"><div class="is-grab"></div>
      <h4>Choose size<span>Size guide</span></h4><div class="is-sub">Linen overshirt · Sage</div>
      <div class="is-sizes">${sizes.map(s => `<i class="${s === 'XXL' ? 'out' : ''}">${s}</i>`).join('')}</div>
      <div class="is-fit"><b>Fits roomy</b>Our model is 182 cm and wears M. Between sizes? Take the smaller one.</div>
      <div class="is-add">Add to bag · €79</div></div>
    <div class="is-sb"><span>9:41</span>${sbIcons('#15171a')}</div><div class="is-sb w"><span>9:41</span>${sbIcons('#fff')}</div>
    <div class="is-tap"></div>
  </div><div class="is-island"></div></div>`;
  stage.append(root);
  const $ = s => root.querySelector(s);
  const phone = $('.is-phone'), screen = $('.is-screen'), page = $('.is-page'), dim = $('.is-dim'), sheet = $('.is-sheet'), sbW = $('.is-sb.w'), tapEl = $('.is-tap');
  const pick = $('.is-pick'), add = $('.is-add'), badge = $('.is-badge'), sizeEls = [...root.querySelectorAll('.is-sizes i')];

  const fit = () => {
    const W = stage.clientWidth, H = stage.clientHeight, f = Math.min(1, Math.max(0.66, 0.66 + (H - 260) / 240 * 0.34));
    const s = Math.min(H * 0.92 / (580 * f), W * 0.86 / 280), top = f >= 1 ? (H - 580 * s) / 2 : H * 0.05;
    phone.style.transform = `translate(-50%, ${top}px) scale(${s})`;
  };
  const ro = new ResizeObserver(fit); ro.observe(stage); fit();

  const easeOut = 'cubic-bezier(0.23, 1, 0.32, 1)', drawer = 'cubic-bezier(0.32, 0.72, 0, 1)';
  const tap = el => {
    const sr = screen.getBoundingClientRect(), r = el.getBoundingClientRect(), s = sr.width / 266;
    tapEl.style.left = (r.left - sr.left + r.width / 2) / s + 'px'; tapEl.style.top = (r.top - sr.top + r.height / 2) / s + 'px';
    tapEl.animate([{ opacity: 0, transform: reduce ? 'none' : 'scale(0.8)' }, { opacity: 1, transform: 'scale(1)', offset: 0.3 }, { opacity: 0, transform: reduce ? 'none' : 'scale(1.2)' }], { duration: 460, easing: easeOut });
    el.animate([{ transform: 'scale(1)' }, { transform: 'scale(0.97)' }, { transform: 'scale(1)' }], { duration: reduce ? 0 : 200, easing: easeOut });
  };
  // The page card sits 40px down (just under the status bar) when it steps back.
  const back = reduce ? 'none' : `translateY(40px) scale(${PARAMS.backScale})`;
  function present(up) {
    const o = { duration: up ? PARAMS.duration : Math.round(PARAMS.duration * 0.85), easing: drawer, fill: 'forwards' };
    const [a, b] = up ? [0, 1] : [1, 0];
    // Reduced motion: the sheet fades in and out in place instead of sliding up.
    sheet.animate(reduce ? [{ transform: 'none', opacity: a }, { transform: 'none', opacity: b }] : [{ transform: up ? 'translateY(101%)' : 'none' }, { transform: up ? 'none' : 'translateY(101%)' }], o);
    page.animate([
      { transform: up ? 'none' : back, clipPath: `inset(0px round ${up ? 39 : 12}px)` },
      { transform: up ? back : 'none', clipPath: `inset(0px round ${up ? 12 : 39}px)` },
    ], o);
    dim.animate([{ opacity: a * PARAMS.dim }, { opacity: b * PARAMS.dim }], o);
    sbW.animate([{ opacity: a }, { opacity: b }], { ...o, duration: o.duration * 0.6 });
  }

  const timers = new Set();
  const later = (fn, ms) => { const id = setTimeout(() => { timers.delete(id); fn(); }, ms); timers.add(id); };
  let count = 0;
  function cycle() {
    later(() => tap(pick), 800);
    later(() => { sizeEls.forEach(el => el.classList.remove('on')); present(true); }, 920);
    later(() => { tap(sizeEls[2]); sizeEls[2].classList.add('on'); }, 920 + PARAMS.duration + 700);
    later(() => tap(add), 920 + PARAMS.duration + 1500);
    later(() => present(false), 920 + PARAMS.duration + 1650);
    later(() => {
      count = count % 9 + 1; badge.textContent = count;
      badge.animate([{ opacity: count > 1 ? 1 : 0, transform: reduce ? 'none' : 'scale(0.95)' }, { opacity: 1, transform: reduce ? 'none' : 'scale(1.2)' }, { opacity: 1, transform: 'scale(1)' }], { duration: 320, easing: easeOut, fill: 'forwards' });
    }, 920 + PARAMS.duration * 2 + 1650);
    later(cycle, 920 + PARAMS.duration * 2 + 1650 + 1200);
  }
  cycle();

  return () => { timers.forEach(clearTimeout); ro.disconnect(); root.getAnimations({ subtree: true }).forEach(a => a.cancel()); root.remove(); };
}
