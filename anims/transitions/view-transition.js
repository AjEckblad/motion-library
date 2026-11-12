// View Transitions morph: in a photo app, an album's cover and name in the list morph into the big header and title of the album you open, and back again.
// document.startViewTransition() snapshots the screen, runs the DOM change, then animates every element that shares a view-transition-name from its old box to its new one; everything else cross-fades. Browsers without it simply swap.
const PARAMS = { duration: 500 };

export default function (stage) {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let uid = 0;
  const tag = Math.random().toString(36).slice(2, 7);
  // A landscape photo drawn in SVG: a sky gradient, an optional sun, layered ridges and optional water.
  const photo = p => {
    const id = `vt${tag}${uid++}`, W = 120, H = 90;
    let s = `<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid slice"><defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${p.sky[0]}"/><stop offset="1" stop-color="${p.sky[1]}"/></linearGradient></defs><rect width="${W}" height="${H}" fill="url(#${id})"/>`;
    if (p.sun) s += `<circle cx="${p.sun[0]}" cy="${p.sun[1]}" r="${p.sun[2]}" fill="${p.sun[3]}"/>`;
    p.ridges.forEach((c, i) => {
      const base = H * (p.y0 + i * p.dy), amp = p.amp * (1 - i * 0.22);
      let d = `M0 ${H}`;
      for (let x = 0; x <= W; x += 3) d += ` L${x} ${(base - amp * (Math.sin(x * 0.045 + p.seed + i * 1.7) * 0.6 + Math.sin(x * 0.11 + p.seed * 2 + i) * 0.3 + Math.sin(x * 0.23 + i * 3) * 0.1)).toFixed(1)}`;
      s += `<path d="${d} L${W} ${H}Z" fill="${c}"/>`;
    });
    if (p.water) s += `<rect y="${H * p.water[0]}" width="${W}" height="${H}" fill="${p.water[1]}"/><path d="M20 ${H * p.water[0] + 6}h22M66 ${H * p.water[0] + 10}h30M34 ${H * p.water[0] + 16}h18" stroke="#fff" stroke-opacity=".25" stroke-width="1.2"/>`;
    return s + '</svg>';
  };
  const P = {
    dawn: { sky: ['#f4b39a', '#fde4cc'], sun: [86, 42, 9, '#fff3df'], ridges: ['#c48f95', '#8f6a83', '#4d3f5e'], y0: 0.55, dy: 0.11, amp: 16, seed: 1 },
    fjord: { sky: ['#8fc3dc', '#e4f1f4'], ridges: ['#8db1bf', '#557f8e', '#2d4f5b'], water: [0.8, '#5b8796'], y0: 0.42, dy: 0.12, amp: 22, seed: 2 },
    dunes: { sky: ['#f0a35e', '#f9dcb0'], sun: [30, 34, 10, '#fff1d0'], ridges: ['#e49a5f', '#cc7443', '#9c4f2e'], y0: 0.6, dy: 0.12, amp: 8, seed: 3 },
    mist: { sky: ['#cbd8cd', '#eef2ea'], ridges: ['#a9bfaa', '#7a977d', '#46634e'], y0: 0.42, dy: 0.15, amp: 14, seed: 4 },
    dusk: { sky: ['#2f3a68', '#e08a6a'], sun: [62, 60, 8, '#ffd59a'], ridges: ['#28305a'], water: [0.66, '#34416f'], y0: 0.64, dy: 0, amp: 5, seed: 5 },
    alps: { sky: ['#5d9de4', '#d8eafb'], ridges: ['#eef3f8', '#93a7bd', '#4f6378'], y0: 0.4, dy: 0.15, amp: 24, seed: 6 },
    meadow: { sky: ['#b9dcef', '#f2f8ef'], ridges: ['#b7d48c', '#88b462', '#5f8c43'], y0: 0.55, dy: 0.12, amp: 10, seed: 8 },
    lilac: { sky: ['#bfb0e3', '#f2e7f5'], sun: [40, 38, 8, '#fffaf4'], ridges: ['#a08bcb', '#7460a6', '#4a3d78'], y0: 0.52, dy: 0.12, amp: 14, seed: 9 },
  };
  const albums = [
    { name: 'Lofoten', meta: 'August 2026 · 248 photos', cover: 'dawn', grid: ['fjord', 'alps', 'dawn', 'mist', 'fjord', 'dusk'] },
    { name: 'Kyoto in spring', meta: 'April 2026 · 312 photos', cover: 'lilac', grid: ['lilac', 'meadow', 'mist', 'dawn', 'lilac', 'meadow'] },
    { name: 'Summer at the lake', meta: 'July 2026 · 86 photos', cover: 'fjord', grid: ['meadow', 'fjord', 'dusk', 'mist', 'alps', 'fjord'] },
    { name: 'Road trip south', meta: 'May 2026 · 141 photos', cover: 'dunes', grid: ['dunes', 'dusk', 'dunes', 'alps', 'dawn', 'dunes'] },
  ];
  const sb = '<div class="vt-sb"><span>9:41</span><svg width="58" height="12" viewBox="0 0 58 12"><g fill="#15171a"><rect x="0" y="8" width="3" height="4" rx=".8"/><rect x="4.5" y="6" width="3" height="6" rx=".8"/><rect x="9" y="3.5" width="3" height="8.5" rx=".8"/><rect x="13.5" y="1" width="3" height="11" rx=".8"/><path d="M26 3.6a8.5 8.5 0 0 1 11 0l-1.3 1.4a6.6 6.6 0 0 0-8.4 0zM28.4 6.3a5 5 0 0 1 6.2 0l-1.3 1.4a3 3 0 0 0-3.6 0zM31.5 11.5l-1.6-1.8a2.4 2.4 0 0 1 3.2 0z"/><rect x="40.5" y=".8" width="15" height="10.4" rx="3" fill="none" stroke="#15171a" stroke-opacity=".45"/><rect x="42" y="2.3" width="10" height="7.4" rx="1.6"/></g></svg></div>';

  const root = document.createElement('div');
  root.className = 'vt-root';
  root.innerHTML = `<style>
    .vt-root { position: absolute; inset: 0; overflow: hidden; background: radial-gradient(120% 100% at 50% 0%, #1b1b1e, #0d0d0f); font-family: "Mona Sans", system-ui, -apple-system, sans-serif; color: #15171a; }
    .vt-phone { position: absolute; left: 50%; top: 0; width: 280px; height: 580px; border-radius: 46px; background: #0f1113; box-shadow: inset 0 0 0 1.5px #3a3f46, 0 0 0 1px rgba(255,255,255,.13), 0 40px 80px -30px rgba(0,0,0,.8); transform-origin: 50% 0; }
    .vt-screen { position: absolute; inset: 7px; border-radius: 39px; overflow: hidden; background: #fff; }
    .vt-island { position: absolute; left: 50%; top: 17px; width: 76px; height: 22px; margin-left: -38px; border-radius: 12px; background: #000; z-index: 9; }
    .vt-sb { height: 44px; padding: 0 24px 0 32px; display: flex; align-items: center; justify-content: space-between; font-size: 13px; font-weight: 650; }
    .vt-view { position: absolute; inset: 0; }
    .vt-cov svg, .vt-head svg, .vt-grid svg { display: block; width: 100%; height: 100%; }
    .vt-big { margin: 6px 16px 4px; font-size: 27px; font-weight: 750; letter-spacing: -0.02em; }
    .vt-sub { margin: 0 16px 12px; font-size: 12.5px; color: #8a8a8f; }
    .vt-row { position: relative; display: flex; align-items: center; gap: 12px; padding: 8px 16px; }
    .vt-row + .vt-row::before { content: ""; position: absolute; left: 92px; right: 0; top: 0; height: 1px; background: #ececf0; }
    .vt-cov { width: 64px; height: 64px; border-radius: 10px; overflow: hidden; flex: none; }
    .vt-name { font-size: 14.5px; font-weight: 640; width: fit-content; }
    .vt-meta { margin-top: 3px; font-size: 12px; color: #8a8a8f; }
    .vt-nav { height: 36px; display: flex; align-items: center; justify-content: space-between; padding: 0 12px 0 8px; color: #007aff; font-size: 14px; }
    .vt-nav span { display: flex; align-items: center; gap: 3px; }
    .vt-head { height: 176px; margin: 2px 12px 0; border-radius: 16px; overflow: hidden; }
    .vt-title { margin: 14px 16px 0; font-size: 24px; font-weight: 750; letter-spacing: -0.02em; width: fit-content; }
    .vt-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 3px; margin: 12px 12px 0; }
    .vt-grid div { aspect-ratio: 1; overflow: hidden; }
    .vt-grid div:first-child { border-top-left-radius: 8px; } .vt-grid div:nth-child(3) { border-top-right-radius: 8px; }
    .vt-tap { position: absolute; width: 30px; height: 30px; margin: -15px 0 0 -15px; border-radius: 50%; background: rgba(60,60,67,.28); box-shadow: 0 0 0 1.5px rgba(255,255,255,.75); opacity: 0; z-index: 10; pointer-events: none; }
  </style><style class="vt-dur"></style>
  <div class="vt-phone"><div class="vt-screen"><div class="vt-view"></div><div class="vt-tap"></div></div><div class="vt-island"></div></div>`;
  stage.append(root);
  const phone = root.querySelector('.vt-phone'), screen = root.querySelector('.vt-screen'), view = root.querySelector('.vt-view'), tapEl = root.querySelector('.vt-tap');
  root.querySelector('.vt-dur').textContent = `::view-transition-group(*), ::view-transition-old(*), ::view-transition-new(*) { animation-duration: ${PARAMS.duration}ms; animation-timing-function: cubic-bezier(0.32, 0.72, 0, 1); }`
    // Reduced motion: shared elements snap to their new box (no morph); the old and new views only cross-fade.
    + (reduce ? ' ::view-transition-group(*) { animation-duration: 0s; }' : '');
  const covers = albums.map(a => photo(P[a.cover]));

  const fit = () => {
    const W = stage.clientWidth, H = stage.clientHeight, f = Math.min(1, Math.max(0.66, 0.66 + (H - 260) / 240 * 0.34));
    const s = Math.min(H * 0.92 / (580 * f), W * 0.86 / 280), top = f >= 1 ? (H - 580 * s) / 2 : H * 0.05;
    phone.style.transform = `translate(-50%, ${top}px) scale(${s})`;
  };
  const ro = new ResizeObserver(fit); ro.observe(stage); fit();

  let k = 0, detail = false;
  const named = (on, n) => on ? `view-transition-name:${n}${tag}` : '';
  function render() {
    if (detail) {
      const a = albums[k];
      view.innerHTML = `${sb}<div class="vt-nav"><span><svg width="10" height="17" viewBox="0 0 10 17"><path d="M8.5 1.5L2 8.5l6.5 7" fill="none" stroke="#007aff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>Albums</span><span>Select</span></div>
        <div class="vt-head" style="${named(true, 'cov')}">${covers[k]}</div><div class="vt-title" style="${named(true, 'ttl')}">${a.name}</div><div class="vt-sub" style="margin-top:3px">${a.meta}</div>
        <div class="vt-grid">${a.grid.map(g => `<div>${photo(P[g])}</div>`).join('')}</div>`;
    } else {
      view.innerHTML = `${sb}<div class="vt-big">Albums</div><div class="vt-sub">My albums · ${albums.length}</div>
        ${albums.map((a, i) => `<div class="vt-row"><div class="vt-cov" style="${named(i === k, 'cov')}">${covers[i]}</div><div><div class="vt-name" style="${named(i === k, 'ttl')}">${a.name}</div><div class="vt-meta">${a.meta}</div></div></div>`).join('')}`;
    }
  }
  render();

  const easeOut = 'cubic-bezier(0.23, 1, 0.32, 1)';
  const tapAt = el => {
    const sr = screen.getBoundingClientRect(), r = el.getBoundingClientRect(), s = sr.width / 266;
    tapEl.style.left = (r.left - sr.left + r.width / 2) / s + 'px'; tapEl.style.top = (r.top - sr.top + r.height / 2) / s + 'px';
    tapEl.animate([{ opacity: 0, transform: reduce ? 'none' : 'scale(0.8)' }, { opacity: 1, transform: 'scale(1)', offset: 0.3 }, { opacity: 0, transform: reduce ? 'none' : 'scale(1.2)' }], { duration: 460, easing: easeOut });
  };
  const change = () => { detail = !detail; render(); };
  const timers = new Set();
  const later = (fn, ms) => { const id = setTimeout(() => { timers.delete(id); fn(); }, ms); timers.add(id); };
  let opens = 0;
  function step() {
    // Before opening the next album, move the names onto its row (no visible change) so the morph starts there.
    if (!detail && opens++) { k = (k + 1) % albums.length; render(); }
    tapAt(detail ? view.querySelector('.vt-nav span') : view.querySelectorAll('.vt-row')[k]);
    later(() => {
      if (document.startViewTransition) document.startViewTransition(change);
      else change(); // no support: swap instantly
    }, 120);
    later(step, PARAMS.duration + (detail ? 1100 : 1900));
  }
  later(step, 700);

  return () => { timers.forEach(clearTimeout); ro.disconnect(); root.remove(); };
}
