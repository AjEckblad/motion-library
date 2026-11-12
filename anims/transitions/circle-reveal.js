// Circle reveal: in Display & Brightness, tapping Dark (or Light) floods the new theme over the screen in a circle that grows from your finger.
// The new version of the screen sits on top, clipped to a circle of radius 0 at the tap; the radius grows until it covers the farthest corner. Starting at the finger ties the whole change to your touch. Click anywhere on the phone to pick the origin yourself.
const PARAMS = { duration: 450 };

export default function (stage) {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const sb = '<div class="cr-sb"><span>9:41</span><svg width="58" height="12" viewBox="0 0 58 12"><g fill="currentColor"><rect x="0" y="8" width="3" height="4" rx=".8"/><rect x="4.5" y="6" width="3" height="6" rx=".8"/><rect x="9" y="3.5" width="3" height="8.5" rx=".8"/><rect x="13.5" y="1" width="3" height="11" rx=".8"/><path d="M26 3.6a8.5 8.5 0 0 1 11 0l-1.3 1.4a6.6 6.6 0 0 0-8.4 0zM28.4 6.3a5 5 0 0 1 6.2 0l-1.3 1.4a3 3 0 0 0-3.6 0zM31.5 11.5l-1.6-1.8a2.4 2.4 0 0 1 3.2 0z"/><rect x="40.5" y=".8" width="15" height="10.4" rx="3" fill="none" stroke="currentColor" stroke-opacity=".45"/><rect x="42" y="2.3" width="10" height="7.4" rx="1.6"/></g></svg></div>';
  const chev = '<svg class="cr-chev" viewBox="0 0 8 14"><path d="M1.5 1.5L6.5 7l-5 5.5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  const sw = on => `<i class="cr-sw${on ? ' on' : ''}"></i>`;
  const thumb = (dark, on) => `<div class="cr-th" data-t="${dark ? 'dark' : 'light'}"><i class="cr-mini ${dark ? 'd' : 'l'}"><b></b><u></u><u></u><u></u></i><span>${dark ? 'Dark' : 'Light'}</span><em class="${on ? 'on' : ''}"></em></div>`;
  const page = theme => `<section class="cr-page ${theme}">${sb}
    <div class="cr-nav"><span class="cr-back"><svg width="10" height="17" viewBox="0 0 10 17"><path d="M8.5 1.5L2 8.5l6.5 7" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>Settings</span>Display &amp; Brightness</div>
    <div class="cr-cap">APPEARANCE</div>
    <div class="cr-group"><div class="cr-pick">${thumb(false, theme === 'light')}${thumb(true, theme === 'dark')}</div>
      <div class="cr-row"><span>Automatic</span>${sw(false)}</div></div>
    <div class="cr-cap">TEXT</div>
    <div class="cr-group"><div class="cr-row"><span>Text size</span>${chev}</div><div class="cr-row"><span>Bold text</span>${sw(false)}</div></div>
    <div class="cr-cap">BRIGHTNESS</div>
    <div class="cr-group"><div class="cr-row cr-bright"><svg viewBox="0 0 24 24" width="13"><circle cx="12" cy="12" r="4" fill="currentColor"/></svg><span class="cr-slider"><i></i></span><svg viewBox="0 0 24 24" width="19"><circle cx="12" cy="12" r="4.5" fill="currentColor"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M5 19l2-2M17 7l2-2" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg></div>
      <div class="cr-row"><span>True tone</span>${sw(true)}</div></div>
  </section>`;

  const root = document.createElement('div');
  root.className = 'cr-root';
  root.innerHTML = `<style>
    .cr-root { position: absolute; inset: 0; overflow: hidden; background: radial-gradient(120% 100% at 50% 0%, #eef6f5, #d5e8e5); font-family: "Mona Sans", system-ui, -apple-system, sans-serif; cursor: crosshair; }
    .cr-phone { position: absolute; left: 50%; top: 0; width: 280px; height: 580px; border-radius: 46px; background: #0f1113; box-shadow: inset 0 0 0 1.5px #2b2f34, 0 40px 80px -30px rgba(8,45,42,.45), 0 12px 30px -12px rgba(8,45,42,.3); transform-origin: 50% 0; }
    .cr-screen { position: absolute; inset: 7px; border-radius: 39px; overflow: hidden; isolation: isolate; }
    .cr-island { position: absolute; left: 50%; top: 17px; width: 76px; height: 22px; margin-left: -38px; border-radius: 12px; background: #000; z-index: 9; }
    .cr-page { position: absolute; inset: 0; --bg: #f2f2f7; --card: #fff; --ink: #15171a; --muted: #8a8a8f; --line: #e6e6ea; --off: #e9e9ea; background: var(--bg); color: var(--ink); }
    .cr-page.dark { --bg: #000; --card: #1c1c1e; --ink: #f5f5f7; --muted: #8d8d93; --line: #38383a; --off: #39393d; }
    .cr-sb { height: 44px; padding: 0 24px 0 32px; display: flex; align-items: center; justify-content: space-between; font-size: 13px; font-weight: 650; }
    .cr-nav { position: relative; height: 40px; display: flex; align-items: center; justify-content: flex-end; padding-right: 22px; font-size: 14px; font-weight: 650; }
    .cr-back { position: absolute; left: 6px; top: 0; height: 40px; display: flex; align-items: center; gap: 3px; color: #0a84ff; font-size: 14px; font-weight: 500; }
    .cr-cap { margin: 10px 28px 6px; font-size: 11px; color: var(--muted); letter-spacing: .02em; }
    .cr-group { margin: 0 12px; border-radius: 12px; background: var(--card); overflow: hidden; }
    .cr-row { position: relative; height: 40px; display: flex; align-items: center; justify-content: space-between; padding: 0 12px 0 14px; font-size: 13.5px; }
    .cr-row + .cr-row::before, .cr-pick + .cr-row::before { content: ""; position: absolute; left: 14px; right: 0; top: 0; height: 1px; background: var(--line); }
    .cr-chev { width: 7px; height: 12px; color: var(--muted); opacity: .6; }
    .cr-sw { position: relative; width: 40px; height: 24px; border-radius: 999px; background: var(--off); }
    .cr-sw::after { content: ""; position: absolute; left: 2px; top: 2px; width: 20px; height: 20px; border-radius: 50%; background: #fff; box-shadow: 0 2px 4px rgba(0,0,0,.2); }
    .cr-sw.on { background: #34c759; } .cr-sw.on::after { transform: translateX(16px); }
    .cr-pick { display: flex; justify-content: space-around; padding: 14px 20px 12px; }
    .cr-th { display: grid; justify-items: center; gap: 7px; font-size: 12px; }
    .cr-mini { position: relative; width: 54px; height: 96px; border-radius: 11px; overflow: hidden; box-shadow: 0 0 0 1px var(--line); }
    .cr-mini.l { background: #fff; } .cr-mini.d { background: #111; }
    .cr-mini b { position: absolute; left: 0; right: 0; top: 0; height: 40px; background: linear-gradient(160deg, #6ec6c0, #0e9488 60%, #0b5f59); }
    .cr-mini.d b { background: linear-gradient(160deg, #2c5f8a, #172b4d 60%, #0b1220); }
    .cr-mini u { display: block; margin: 7px 6px 0; height: 8px; border-radius: 3px; background: #e7e7ea; }
    .cr-mini u:first-of-type { margin-top: 46px; }
    .cr-mini.d u { background: #2a2a2e; }
    .cr-th em { width: 18px; height: 18px; border-radius: 50%; box-shadow: inset 0 0 0 1.5px var(--muted); }
    .cr-th em.on { background: #fff; box-shadow: inset 0 0 0 5px #0a84ff; }
    .cr-bright { gap: 10px; color: var(--muted); justify-content: flex-start; }
    .cr-slider { flex: 1; height: 5px; border-radius: 3px; background: var(--off); position: relative; }
    .cr-slider i { position: absolute; left: 0; top: 0; bottom: 0; width: 64%; border-radius: inherit; background: #0a84ff; }
    .cr-slider i::after { content: ""; position: absolute; right: -11px; top: -8.5px; width: 22px; height: 22px; border-radius: 50%; background: #fff; box-shadow: 0 1px 4px rgba(0,0,0,.25); }
    .cr-over { z-index: 2; }
    .cr-tap { position: absolute; width: 30px; height: 30px; margin: -15px 0 0 -15px; border-radius: 50%; background: rgba(120,120,128,.4); box-shadow: 0 0 0 1.5px rgba(255,255,255,.75); opacity: 0; z-index: 10; pointer-events: none; }
  </style>
  <div class="cr-phone"><div class="cr-screen"><div class="cr-under"></div><div class="cr-over"></div><div class="cr-tap"></div></div><div class="cr-island"></div></div>`;
  stage.append(root);
  const $ = s => root.querySelector(s);
  const phone = $('.cr-phone'), screen = $('.cr-screen'), under = $('.cr-under'), over = $('.cr-over'), tapEl = $('.cr-tap');
  let theme = 'light', busy = false;
  under.innerHTML = page('light');

  const fit = () => {
    const W = stage.clientWidth, H = stage.clientHeight, f = Math.min(1, Math.max(0.66, 0.66 + (H - 260) / 240 * 0.34));
    const s = Math.min(H * 0.92 / (580 * f), W * 0.86 / 280), top = f >= 1 ? (H - 580 * s) / 2 : H * 0.05;
    phone.style.transform = `translate(-50%, ${top}px) scale(${s})`;
  };
  const ro = new ResizeObserver(fit); ro.observe(stage); fit();

  const easeOut = 'cubic-bezier(0.23, 1, 0.32, 1)';
  // x, y are in the screen's own (unscaled) pixels, 266 × 566.
  function reveal(x, y) {
    if (busy) return; busy = true;
    const next = theme === 'light' ? 'dark' : 'light';
    tapEl.style.left = x + 'px'; tapEl.style.top = y + 'px';
    tapEl.animate([{ opacity: 0, transform: reduce ? 'none' : 'scale(0.8)' }, { opacity: 1, transform: 'scale(1)', offset: 0.3 }, { opacity: 0, transform: reduce ? 'none' : 'scale(1.2)' }], { duration: 460, easing: easeOut });
    over.innerHTML = page(next);
    const w = 266, h = 566, r = Math.hypot(Math.max(x, w - x), Math.max(y, h - y));
    const a = over.firstElementChild.animate(reduce ? [{ opacity: 0 }, { opacity: 1 }] : [{ clipPath: `circle(0px at ${x}px ${y}px)` }, { clipPath: `circle(${r}px at ${x}px ${y}px)` }],
      { duration: PARAMS.duration, delay: 90, easing: 'cubic-bezier(0.32, 0.72, 0, 1)', fill: 'both' });
    a.onfinish = () => { theme = next; under.innerHTML = page(next); over.innerHTML = ''; busy = false; };
  }
  // Auto: tap the thumbnail of the theme you're not in.
  const autoTap = () => {
    const el = under.querySelector(`.cr-th[data-t="${theme === 'light' ? 'dark' : 'light'}"] .cr-mini`);
    const sr = screen.getBoundingClientRect(), r = el.getBoundingClientRect(), k = sr.width / 266;
    reveal((r.left - sr.left + r.width / 2) / k, (r.top - sr.top + r.height * 0.6) / k);
  };
  let manual = -1e9;
  const onDown = e => {
    const sr = screen.getBoundingClientRect(), k = sr.width / 266;
    const x = Math.min(266, Math.max(0, (e.clientX - sr.left) / k)), y = Math.min(566, Math.max(0, (e.clientY - sr.top) / k));
    manual = performance.now(); reveal(x, y);
  };
  root.addEventListener('pointerdown', onDown);
  let first = setTimeout(autoTap, 800);
  const auto = setInterval(() => { if (performance.now() - manual > 3000) autoTap(); }, PARAMS.duration + 1900);

  return () => { clearTimeout(first); clearInterval(auto); ro.disconnect(); root.removeEventListener('pointerdown', onDown); root.getAnimations({ subtree: true }).forEach(a => a.cancel()); root.remove(); };
}
