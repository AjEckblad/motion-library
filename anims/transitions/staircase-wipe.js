// Staircase wipe: on a homeware shop's website, clicking "Next collection" sends bars down over the page one after another; the page swaps while it's hidden and the bars carry on out the bottom.
// The bars take the colour of the collection you're heading to, so the wipe already hints at the next page. They never reverse, which keeps the motion moving forward like turning a page.
const PARAMS = { bars: 6, stagger: 60, duration: 500 };

export default function (stage) {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const sh = w => `<ellipse cx="50" cy="86" rx="${w}" ry="3.6" fill="#000" opacity=".12"/>`;
  const pages = [
    { n: '01', title: 'Summer<br>linen', sub: 'Washed flax for long, warm evenings. 24 pieces, cut and sewn in Lithuania.', next: 'Stoneware', bg: '#efe6da', ink: '#2b2118', disc: '#e4d6c3', accent: '#59613f',
      art: `${sh(30)}<rect x="20" y="64" width="60" height="18" rx="6" fill="#8a9a6b"/><rect x="23" y="47" width="56" height="18" rx="6" fill="#f4efe6"/><rect x="26" y="30" width="52" height="18" rx="6" fill="#c9b28f"/><path d="M66 30v18M66 64v18" stroke="#fff" stroke-width="3" stroke-opacity=".6"/><path d="M62 47v18" stroke="#c9b28f" stroke-width="3"/>` },
    { n: '02', title: 'Hand-thrown<br>stoneware', sub: 'Mugs, bowls and vases made in small batches. 18 pieces, each one a little different.', next: 'Lighting', bg: '#f3dfd3', ink: '#3a1f14', disc: '#ebcdbb', accent: '#b5532f',
      art: `${sh(34)}<path d="M50 30C49 22 47 15 41 10" stroke="#5f7d55" stroke-width="1.6" fill="none"/><path d="M46 16c-6-1-9-5-9-8 5 0 8 3 9 8z" fill="#7d9a6b"/><path d="M28 28h12v6c0 4 12 9 12 24 0 14-8 24-18 24s-18-10-18-24c0-15 12-20 12-24z" fill="#7f9cb3" transform="translate(6 0)"/><path d="M62 45h4a8 8 0 0 1 0 16h-4" fill="none" stroke="#c9775a" stroke-width="5"/><path d="M44 42h20v30a10 10 0 0 1-10 10h0a10 10 0 0 1-10-10z" fill="#c9775a" transform="translate(4 0)"/><ellipse cx="58" cy="42" rx="10" ry="2.2" fill="#000" opacity=".18"/>` },
    { n: '03', title: 'Lighting for<br>dark months', sub: 'Brass and linen lamps with a warm, low glow. 9 pieces, all dimmable.', next: 'Summer linen', bg: '#1d2023', ink: '#f3efe6', disc: '#2a2e32', accent: '#c99a3b',
      art: `<ellipse cx="50" cy="62" rx="30" ry="20" fill="#ffe6a8" opacity=".18"/><ellipse cx="50" cy="58" rx="18" ry="12" fill="#ffe6a8" opacity=".25"/>${sh(22)}<ellipse cx="50" cy="82" rx="15" ry="4" fill="#c99a3b"/><rect x="48.6" y="46" width="2.8" height="36" fill="#8a7a5a"/><path d="M28 48c0-14 10-22 22-22s22 8 22 22z" fill="#d9a441"/><path d="M50 26c12 0 22 8 22 22H50z" fill="#000" opacity=".1"/><ellipse cx="50" cy="48" rx="22" ry="3" fill="#fff4d0"/>` },
  ];
  const root = document.createElement('div');
  root.className = 'sw-root';
  root.innerHTML = `<style>
    .sw-root { position: absolute; inset: 0; overflow: hidden; background: radial-gradient(120% 100% at 50% 0%, #eef6f5, #d5e8e5); font-family: "Mona Sans", system-ui, -apple-system, sans-serif; }
    .sw-win { position: absolute; inset: 5% 4%; border-radius: 12px; overflow: hidden; background: #fff; box-shadow: 0 0 0 1px rgba(8,45,42,.08), 0 30px 60px -28px rgba(8,45,42,.45); display: flex; flex-direction: column; }
    .sw-chrome { flex: none; height: max(20px, 6.5%); display: flex; align-items: center; gap: 6px; padding: 0 12px; background: #f1f3f5; border-bottom: 1px solid #e1e5e9; }
    .sw-chrome i { width: 9px; height: 9px; border-radius: 50%; background: #d3d7dc; }
    .sw-url { margin: 0 auto; width: 46%; height: 62%; border-radius: 6px; background: #fff; display: grid; place-items: center; font-size: max(7.5px, 1.5vmin); color: #5b6066; white-space: nowrap; overflow: hidden; }
    .sw-view { position: relative; flex: 1; container-type: size; overflow: hidden; }
    .sw-page { position: absolute; inset: 0; padding: 4cqh 5cqw; box-sizing: border-box; }
    .sw-nav { display: flex; justify-content: space-between; font-size: max(7.5px, 3.4cqh); font-weight: 600; opacity: .85; }
    .sw-nav span { display: flex; gap: 3.5cqw; }
    .sw-nav b { font-weight: 800; letter-spacing: -0.01em; }
    .sw-copy { position: absolute; left: 5cqw; top: 20cqh; width: 50cqw; }
    .sw-n { font-size: max(7px, 3cqh); font-weight: 650; letter-spacing: .08em; opacity: .7; }
    .sw-copy h2 { margin: 2.5cqh 0 0; font-size: min(12.5cqh, 6.4cqw); line-height: .95; font-weight: 780; letter-spacing: -0.035em; font-stretch: 110%; }
    .sw-copy p { margin: 3.5cqh 0 0; max-width: 42cqw; font-size: max(7.5px, 3.5cqh); line-height: 1.4; opacity: .78; }
    .sw-btn { display: inline-flex; margin-top: 4.5cqh; height: 8.5cqh; padding: 0 3.5cqw; align-items: center; border-radius: 999px; font-size: max(7.5px, 3.3cqh); font-weight: 650; }
    .sw-art { position: absolute; right: 5cqw; top: 15cqh; width: min(64cqh, 40cqw); height: min(64cqh, 40cqw); border-radius: 50%; display: grid; place-items: center; }
    .sw-art svg { width: 86%; height: 86%; }
    .sw-next { position: absolute; right: 5cqw; bottom: 5cqh; font-size: max(7.5px, 3.3cqh); font-weight: 650; display: flex; gap: 1.2cqw; align-items: center; }
    .sw-next u { text-decoration: none; opacity: .65; font-weight: 500; }
    .sw-bars { position: absolute; inset: 0; display: flex; pointer-events: none; z-index: 2; }
    .sw-bars i { flex: 1; transform: translateY(-101%); margin-right: -1px; }
    .sw-cur { position: absolute; z-index: 3; width: max(14px, 4.5cqh); left: 0; top: 0; pointer-events: none; filter: drop-shadow(0 1px 1.5px rgba(0,0,0,.3)); }
  </style>
  <div class="sw-win"><div class="sw-chrome"><i></i><i></i><i></i><span class="sw-url">/collections</span></div>
    <div class="sw-view"><section class="sw-page"></section><div class="sw-bars"></div>
      <svg class="sw-cur" viewBox="0 0 16 22"><path d="M1.5 1.5v16l4.2-4 2.8 6.4 2.6-1.1-2.7-6.3h5.8z" fill="#fff" stroke="#15171a" stroke-width="1.3" stroke-linejoin="round"/></svg></div></div>`;
  stage.append(root);
  const page = root.querySelector('.sw-page'), barsEl = root.querySelector('.sw-bars'), view = root.querySelector('.sw-view'), cur = root.querySelector('.sw-cur'), url = root.querySelector('.sw-url');
  const n = Math.round(PARAMS.bars);
  const bars = Array.from({ length: n }, () => barsEl.appendChild(document.createElement('i')));
  let k = 0;
  const arrow = '<svg width="1em" height="1em" viewBox="0 0 16 16"><path d="M3 8h10M9 4l4 4-4 4" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  const paint = p => {
    page.style.background = p.bg; page.style.color = p.ink;
    url.textContent = '/collections/' + p.title.replace('<br>', ' ').toLowerCase().replace(/[^a-z]+/g, '-');
    page.innerHTML = `<div class="sw-nav"><span><b>Collections</b><span>Shop</span><span>Journal</span></span><span><span>Search</span><span>Bag (2)</span></span></div>
      <div class="sw-copy"><div class="sw-n">${p.n} / 03 · NEW SEASON</div><h2>${p.title}</h2><p>${p.sub}</p><span class="sw-btn" style="background:${p.ink};color:${p.bg}">Shop the collection</span></div>
      <div class="sw-art" style="background:${p.disc}"><svg viewBox="0 0 100 100">${p.art}</svg></div>
      <div class="sw-next"><u>Next</u>${p.next} ${arrow}</div>`;
  };
  paint(pages[0]);
  // The cursor rests on "Next collection", bottom right.
  const place = () => { const w = view.clientWidth, h = view.clientHeight; cur.style.transform = `translate(${w * 0.9}px, ${h * 0.93}px)`; };
  const ro = new ResizeObserver(place); ro.observe(view); place();

  const ease = 'cubic-bezier(0.77, 0, 0.175, 1)';
  const timers = new Set();
  const later = (fn, ms) => { const id = setTimeout(() => { timers.delete(id); fn(); }, ms); timers.add(id); };
  function wipe() {
    const next = pages[(k + 1) % pages.length];
    cur.animate([{ scale: '1' }, { scale: '0.86' }, { scale: '1' }], { duration: reduce ? 0 : 200, easing: 'ease' });
    bars.forEach((b, i) => {
      b.style.background = next.accent;
      // Reduced motion: each bar fades in where it lands instead of dropping; the stagger stays.
      b.animate(reduce ? [{ transform: 'translateY(0)', opacity: 0 }, { transform: 'translateY(0)', opacity: 1 }] : [{ transform: 'translateY(-101%)' }, { transform: 'translateY(0)' }], { duration: PARAMS.duration, delay: 120 + i * PARAMS.stagger, easing: ease, fill: 'forwards' });
    });
    const covered = 120 + PARAMS.duration + (n - 1) * PARAMS.stagger;
    later(() => {
      k = (k + 1) % pages.length; paint(pages[k]);
      bars.forEach((b, i) => b.animate(reduce ? [{ transform: 'translateY(0)', opacity: 1 }, { transform: 'translateY(0)', opacity: 0 }] : [{ transform: 'translateY(0)' }, { transform: 'translateY(101%)' }],
        { duration: PARAMS.duration, delay: i * PARAMS.stagger, easing: ease, fill: 'forwards' }));
    }, covered + 80);
    later(wipe, covered * 2 + 1900);
  }
  later(wipe, 900);
  return () => { timers.forEach(clearTimeout); ro.disconnect(); root.getAnimations({ subtree: true }).forEach(a => a.cancel()); root.remove(); };
}
