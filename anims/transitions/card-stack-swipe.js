// Card stack swipe: in a photo app's clean-up mode, each photo is dragged right to keep or left to delete, thrown off screen, and the next card springs up from the stack.
// While dragged, the card tilts with the finger and a KEEP or DELETE stamp fades in, so you see the decision before you make it. The throw eases out fast; the cards behind ride springs, so the stack settles with a little life instead of snapping.
const PARAMS = { throwDuration: 320, stiffness: 260, damping: 24 };

export default function (stage) {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let uid = 0;
  const tag = Math.random().toString(36).slice(2, 7);
  // A landscape photo drawn in SVG: a sky gradient, an optional sun, layered ridges and optional water.
  const photo = p => {
    const id = `cs${tag}${uid++}`, W = 120, H = 90;
    let s = `<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid slice"><defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${p.sky[0]}"/><stop offset="1" stop-color="${p.sky[1]}"/></linearGradient></defs><rect width="${W}" height="${H}" fill="url(#${id})"/>`;
    if (p.sun) s += `<circle cx="${p.sun[0]}" cy="${p.sun[1]}" r="${p.sun[2]}" fill="${p.sun[3]}"/>`;
    p.ridges.forEach((c, i) => {
      const base = H * (p.y0 + i * p.dy), amp = p.amp * (1 - i * 0.22);
      let d = `M0 ${H}`;
      for (let x = 0; x <= W; x += 3) d += ` L${x} ${(base - amp * (Math.sin(x * 0.045 + p.seed + i * 1.7) * 0.6 + Math.sin(x * 0.11 + p.seed * 2 + i) * 0.3 + Math.sin(x * 0.23 + i * 3) * 0.1)).toFixed(1)}`;
      s += `<path d="${d} L${W} ${H}Z" fill="${c}"/>`;
    });
    if (p.water) s += `<rect y="${H * p.water[0]}" width="${W}" height="${H}" fill="${p.water[1]}"/>`;
    return s + '</svg>';
  };
  const shots = [
    ['Lofoten, Norway', '14 August 2026 · 18:42', { sky: ['#f4b39a', '#fde4cc'], sun: [86, 38, 7, '#fff3df'], ridges: ['#c48f95', '#8f6a83', '#4d3f5e'], y0: 0.5, dy: 0.13, amp: 16, seed: 1 }],
    ['Lake Vättern, Sweden', '22 July 2026 · 21:05', { sky: ['#8fc3dc', '#e4f1f4'], ridges: ['#8db1bf', '#557f8e'], water: [0.66, '#5b8796'], y0: 0.5, dy: 0.08, amp: 10, seed: 2 }],
    ['Dolomites, Italy', '9 September 2026 · 07:30', { sky: ['#5d9de4', '#d8eafb'], ridges: ['#eef3f8', '#93a7bd', '#4f6378'], y0: 0.36, dy: 0.17, amp: 22, seed: 6 }],
    ['Atacama, Chile', '18 May 2026 · 17:12', { sky: ['#f0a35e', '#f9dcb0'], sun: [30, 32, 9, '#fff1d0'], ridges: ['#e49a5f', '#cc7443', '#9c4f2e'], y0: 0.55, dy: 0.14, amp: 8, seed: 3 }],
    ['Hossa, Finland', '2 October 2026 · 08:15', { sky: ['#cbd8cd', '#eef2ea'], ridges: ['#a9bfaa', '#7a977d', '#46634e'], y0: 0.4, dy: 0.16, amp: 14, seed: 4 }],
    ['Kyoto, Japan', '3 April 2026 · 16:48', { sky: ['#bfb0e3', '#f2e7f5'], sun: [40, 34, 7, '#fffaf4'], ridges: ['#a08bcb', '#7460a6', '#4a3d78'], y0: 0.5, dy: 0.13, amp: 14, seed: 9 }],
  ];
  const CW = 226, CH = 300, CX = 20, CY = 128;
  const root = document.createElement('div');
  root.className = 'cs-root';
  root.innerHTML = `<style>
    .cs-root { position: absolute; inset: 0; overflow: hidden; background: radial-gradient(120% 100% at 50% 0%, #1b1b1e, #0d0d0f); font-family: "Mona Sans", system-ui, -apple-system, sans-serif; color: #15171a; }
    .cs-phone { position: absolute; left: 50%; top: 0; width: 280px; height: 580px; border-radius: 46px; background: #0f1113; box-shadow: inset 0 0 0 1.5px #3a3f46, 0 0 0 1px rgba(255,255,255,.13), 0 40px 80px -30px rgba(0,0,0,.8); transform-origin: 50% 0; }
    .cs-screen { position: absolute; inset: 7px; border-radius: 39px; overflow: hidden; background: #f4f5f7; isolation: isolate; }
    .cs-island { position: absolute; left: 50%; top: 17px; width: 76px; height: 22px; margin-left: -38px; border-radius: 12px; background: #000; z-index: 9; }
    .cs-sb { height: 44px; padding: 0 24px 0 32px; display: flex; align-items: center; justify-content: space-between; font-size: 13px; font-weight: 650; }
    .cs-top { display: flex; justify-content: space-between; align-items: baseline; margin: 6px 16px 0; }
    .cs-top h2 { margin: 0; font-size: 26px; font-weight: 750; letter-spacing: -0.02em; }
    .cs-top span { font-size: 13px; color: #0e9488; font-weight: 600; }
    .cs-prog { display: flex; align-items: center; gap: 10px; margin: 8px 16px 0; font-size: 12px; color: #5b6066; font-variant-numeric: tabular-nums; }
    .cs-bar { flex: 1; height: 4px; border-radius: 2px; background: #e1e5e9; overflow: hidden; }
    .cs-bar i { display: block; height: 100%; width: 100%; background: #0e9488; transform-origin: 0 0; transition: transform 300ms cubic-bezier(0.23, 1, 0.32, 1); }
    .cs-card { position: absolute; left: ${CX}px; top: ${CY}px; width: ${CW}px; height: ${CH}px; border-radius: 20px; overflow: hidden; background: #ddd; box-shadow: 0 1px 2px rgba(0,0,0,.08), 0 14px 30px -14px rgba(10,30,40,.45); will-change: transform; }
    .cs-card svg { display: block; width: 100%; height: 100%; }
    .cs-cap { position: absolute; left: 0; right: 0; bottom: 0; padding: 40px 16px 14px; background: linear-gradient(transparent, rgba(0,0,0,.5)); color: #fff; font-size: 14px; font-weight: 650; }
    .cs-cap small { display: block; margin-top: 2px; font-size: 11.5px; font-weight: 500; opacity: .85; }
    .cs-stamp { position: absolute; top: 22px; padding: 4px 10px; border-radius: 8px; border: 2.5px solid; font-size: 17px; font-weight: 800; letter-spacing: .06em; background: rgba(255,255,255,.18); opacity: 0; }
    .cs-keep { left: 16px; color: #2b8a3e; border-color: #2b8a3e; transform: rotate(-14deg); }
    .cs-del { right: 16px; color: #e03131; border-color: #e03131; transform: rotate(14deg); }
    .cs-btns { position: absolute; left: 0; right: 0; top: ${CY + CH + 36}px; display: flex; justify-content: center; align-items: center; gap: 22px; }
    .cs-btns span { width: 54px; height: 54px; border-radius: 50%; background: #fff; display: grid; place-items: center; box-shadow: 0 6px 16px -8px rgba(10,30,40,.4); }
    .cs-btns span.cs-undo { width: 38px; height: 38px; }
    .cs-tap { position: absolute; width: 32px; height: 32px; margin: -16px 0 0 -16px; border-radius: 50%; background: rgba(60,60,67,.3); box-shadow: 0 0 0 1.5px rgba(255,255,255,.8); opacity: 0; z-index: 30; pointer-events: none; }
  </style>
  <div class="cs-phone"><div class="cs-screen">
    <div class="cs-sb"><span>9:41</span><svg width="58" height="12" viewBox="0 0 58 12"><g fill="#15171a"><rect x="0" y="8" width="3" height="4" rx=".8"/><rect x="4.5" y="6" width="3" height="6" rx=".8"/><rect x="9" y="3.5" width="3" height="8.5" rx=".8"/><rect x="13.5" y="1" width="3" height="11" rx=".8"/><path d="M26 3.6a8.5 8.5 0 0 1 11 0l-1.3 1.4a6.6 6.6 0 0 0-8.4 0zM28.4 6.3a5 5 0 0 1 6.2 0l-1.3 1.4a3 3 0 0 0-3.6 0zM31.5 11.5l-1.6-1.8a2.4 2.4 0 0 1 3.2 0z"/><rect x="40.5" y=".8" width="15" height="10.4" rx="3" fill="none" stroke="#15171a" stroke-opacity=".45"/><rect x="42" y="2.3" width="10" height="7.4" rx="1.6"/></g></svg></div>
    <div class="cs-top"><h2>Clean up</h2><span>Done</span></div>
    <div class="cs-prog"><span class="cs-bar"><i></i></span><span class="cs-count"></span></div>
    <div class="cs-btns">
      <span class="cs-no"><svg width="20" height="20" viewBox="0 0 20 20"><path d="M5 5l10 10M15 5L5 15" stroke="#e03131" stroke-width="2.6" stroke-linecap="round"/></svg></span>
      <span class="cs-undo"><svg width="16" height="16" viewBox="0 0 20 20"><path d="M7 5L3 9l4 4M3.5 9H12a5 5 0 0 1 0 10H9" fill="none" stroke="#868e96" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></span>
      <span class="cs-yes"><svg width="22" height="22" viewBox="0 0 24 24"><path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z" fill="#2b8a3e"/></svg></span></div>
    <div class="cs-tap"></div>
  </div><div class="cs-island"></div></div>`;
  stage.append(root);
  const $ = s => root.querySelector(s);
  const phone = $('.cs-phone'), screen = $('.cs-screen'), tapEl = $('.cs-tap'), bar = $('.cs-bar i'), count = $('.cs-count'), btnNo = $('.cs-no'), btnYes = $('.cs-yes');

  const fit = () => {
    const W = stage.clientWidth, H = stage.clientHeight, f = Math.min(1, Math.max(0.66, 0.66 + (H - 260) / 240 * 0.34));
    const s = Math.min(H * 0.92 / (580 * f), W * 0.86 / 280), top = f >= 1 ? (H - 580 * s) / 2 : H * 0.05;
    phone.style.transform = `translate(-50%, ${top}px) scale(${s})`;
  };
  const ro = new ResizeObserver(fit); ro.observe(stage); fit();

  // Four cards are recycled: slot 0 is on top, 1 and 2 peek out below, 3 waits hidden at the back.
  let next = 0;
  const fill = c => { const [place, when, p] = shots[next++ % shots.length]; c.el.innerHTML = `${photo(p)}<div class="cs-cap">${place}<small>${when}</small></div><b class="cs-stamp cs-keep">KEEP</b><b class="cs-stamp cs-del">DELETE</b>`; c.keep = c.el.querySelector('.cs-keep'); c.del = c.el.querySelector('.cs-del'); };
  const cards = [0, 1, 2, 3].map(i => { const el = document.createElement('div'); el.className = 'cs-card'; screen.insertBefore(el, tapEl); const c = { el, slot: i, p: i, v: 0, x: 0, y: 0, rot: 0, out: false }; fill(c); return c; });
  let done = 3;
  const progress = () => { count.textContent = `${done} of 24`; bar.style.transform = `scaleX(${done / 24})`; };
  progress();

  const bez = (x1, y1, x2, y2) => { const cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx, cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by; return x => { let t = x; for (let i = 0; i < 8; i++) { const X = ((ax * t + bx) * t + cx) * t - x, d = (3 * ax * t + 2 * bx) * t + cx; if (Math.abs(d) < 1e-6) break; t -= X / d; } t = Math.min(1, Math.max(0, t)); return ((ay * t + by) * t + cy) * t; }; };
  const easeOut = bez(0.23, 1, 0.32, 1), inOut = bez(0.77, 0, 0.175, 1);
  const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));

  // One swipe: hold, finger down, drag 72px, release and throw. Directions alternate keep / delete / keep.
  const CYCLE = 2300, DRAG0 = 450, DRAG1 = 1000, dirs = [1, -1, 1, 1, -1];
  let t0 = performance.now(), last = t0, swipe = -1, released = false, thrown = null, raf;
  function frame(now) {
    const dt = Math.min(0.032, (now - last) / 1000); last = now;
    const n = Math.floor((now - t0) / CYCLE), t = (now - t0) % CYCLE, dir = dirs[n % dirs.length];
    const top = cards.find(c => c.slot === 0);
    if (n !== swipe) { swipe = n; released = false; tapEl.style.opacity = 0; }
    // Drag: the card follows the finger and tilts; the matching stamp fades in.
    if (t >= DRAG0 && t < DRAG1 && top) {
      const d = inOut(clamp((t - DRAG0) / (DRAG1 - DRAG0)));
      top.x = dir * 72 * d; top.y = -6 * d; top.rot = top.x * 0.08;
      if (reduce) top.x = top.y = top.rot = 0; // reduced motion: the card stays put; only the stamp fades in
      const appear = clamp((t - DRAG0) / 90);
      tapEl.style.opacity = appear; tapEl.style.transform = `translate(${CX + CW / 2 + top.x}px, ${CY + CH * 0.62 + top.y}px) scale(${0.85 + 0.15 * appear})`;
      tapEl.style.left = '0px'; tapEl.style.top = '0px';
      (dir > 0 ? top.keep : top.del).style.opacity = d;
    }
    // Release: throw the top card away and move every other card up a slot.
    if (t >= DRAG1 && top && !released) {
      released = true; top.out = true; thrown = { c: top, x0: top.x, y0: top.y, r0: top.rot, dir, t: now };
      tapEl.style.opacity = 0;
      const b = dir > 0 ? btnYes : btnNo;
      b.animate([{ transform: 'scale(1)' }, { transform: 'scale(0.9)' }, { transform: 'scale(1.06)' }, { transform: 'scale(1)' }], { duration: reduce ? 0 : 300, easing: 'cubic-bezier(0.23, 1, 0.32, 1)' });
      cards.forEach(c => { if (c !== top) c.slot -= 1; });
      done = done % 24 + 1; progress();
    }
    if (thrown) {
      const k = clamp((now - thrown.t) / PARAMS.throwDuration), e = easeOut(k), c = thrown.c;
      c.x = thrown.x0 + (thrown.dir * 380 - thrown.x0) * e; c.y = thrown.y0 + 30 * e; c.rot = thrown.r0 + (thrown.dir * 24 - thrown.r0) * e;
      if (reduce) { c.x = c.y = c.rot = 0; c.fade = 1 - e; } // fades out in place instead of being thrown
      if (k >= 1) { c.out = false; c.slot = 3; c.p = 3.4; c.v = 0; c.x = c.y = c.rot = 0; fill(c); thrown = null; }
    }
    for (const c of cards) {
      if (!c.out && reduce) { c.p = c.slot; c.v = 0; } // springs settle instantly
      else if (!c.out) for (let i = 0; i < 4; i++) { const h = dt / 4, a = -PARAMS.stiffness * (c.p - c.slot) - PARAMS.damping * c.v; c.v += a * h; c.p += c.v * h; }
      const p = Math.max(0, c.p), s = 1 - 0.05 * Math.min(p, 3), y = 22 * Math.min(p, 2.6);
      c.el.style.zIndex = c.out ? 20 : 10 - c.slot;
      c.el.style.opacity = c.out ? (reduce ? c.fade ?? 1 : 1) : clamp(3 - p);
      c.el.style.transform = `translate(${c.x.toFixed(2)}px, ${(c.y + y).toFixed(2)}px) rotate(${c.rot.toFixed(2)}deg) scale(${s.toFixed(4)})`;
      if (!c.out && c.slot !== 0) { c.keep.style.opacity = 0; c.del.style.opacity = 0; }
    }
    raf = requestAnimationFrame(frame);
  }
  raf = requestAnimationFrame(frame);

  return () => { cancelAnimationFrame(raf); ro.disconnect(); root.getAnimations({ subtree: true }).forEach(a => a.cancel()); root.remove(); };
}
