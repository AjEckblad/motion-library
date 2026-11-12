// Play to pause: the triangle is cut into two four-point halves and pause is two four-point bars, so each half slides straight into a bar. A ring around the button fills with the episode, so the state change has a reason.
const PARAMS = { duration: 240, hold: 1800 };

export default function (stage) {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const root = document.createElement('div');
  root.className = 'pp-root';
  root.innerHTML = `<style>
    .pp-root { position: absolute; inset: 0; overflow: hidden; background: #f3eef2; font-family: system-ui, -apple-system, sans-serif; }
    .pp-b { position: absolute; left: 50%; top: 50%; width: 420px; height: 320px; transform-origin: 0 0; }
    .pp-card { position: absolute; left: 50px; top: 34px; width: 320px; height: 252px; border-radius: 22px; background: #fff; box-shadow: 0 1px 2px rgba(42,15,38,.08), 0 18px 40px -18px rgba(42,15,38,.35); }
    .pp-art { position: absolute; left: 20px; top: 20px; width: 84px; height: 84px; border-radius: 14px; background: linear-gradient(140deg, #2a0f26, #b8359a 70%, #f59fd0); overflow: hidden; }
    .pp-art i { position: absolute; bottom: 14px; width: 5px; border-radius: 3px; background: rgba(255,255,255,.85); }
    .pp-show { position: absolute; left: 120px; top: 26px; font-size: 11px; font-weight: 650; letter-spacing: .08em; text-transform: uppercase; color: #b8359a; }
    .pp-ttl { position: absolute; left: 120px; top: 44px; width: 180px; font-size: 16px; font-weight: 680; line-height: 1.2; color: #1d0b1a; }
    .pp-meta { position: absolute; left: 120px; top: 86px; font-size: 12px; color: #7a6676; }
    .pp-btn { position: absolute; left: 124px; top: 134px; width: 72px; height: 72px; border: 0; padding: 0; border-radius: 50%; background: none; cursor: pointer; }
    .pp-btn svg { position: absolute; inset: 0; width: 100%; height: 100%; overflow: visible; }
    .pp-skip { position: absolute; top: 158px; font-size: 12px; font-weight: 650; color: #5b4657; width: 40px; text-align: center; }
    .pp-time { position: absolute; top: 222px; font-size: 11px; color: #7a6676; font-variant-numeric: tabular-nums; }
    .pp-cur { position: absolute; left: 0; top: 0; width: 22px; height: 22px; pointer-events: none; transition: transform 700ms cubic-bezier(0.23, 1, 0.32, 1); }
    .pp-cur svg { width: 100%; height: 100%; transition: transform 120ms cubic-bezier(0.23, 1, 0.32, 1); }
    .pp-cur.down svg { transform: scale(.86); }
  </style>
  <div class="pp-b"><div class="pp-card">
    <div class="pp-art">${[18, 34, 26, 44, 30, 20, 38, 24].map((h, i) => `<i style="left:${14 + i * 8}px;height:${h}px"></i>`).join('')}</div>
    <div class="pp-show">Episode 112</div>
    <div class="pp-ttl">Why bridges sing in the wind</div>
    <div class="pp-meta">The Field Desk · 38 min</div>
    <div class="pp-skip" style="left:66px">−15</div><div class="pp-skip" style="left:214px">+30</div>
    <button class="pp-btn" type="button" aria-label="Play"><svg viewBox="0 0 72 72">
      <circle cx="36" cy="36" r="33" fill="none" stroke="#f1e4ee" stroke-width="4"/>
      <circle class="pp-ring" cx="36" cy="36" r="33" fill="none" stroke="#b8359a" stroke-width="4" stroke-linecap="round" transform="rotate(-90 36 36)" stroke-dasharray="207.3" stroke-dashoffset="207.3"/>
      <circle cx="36" cy="36" r="26" fill="#2a0f26"/>
      <g transform="translate(24 24)"><path class="pp-ico" fill="#fff"/></g></svg></button>
    <div class="pp-time" style="left:20px">12:04</div><div class="pp-time" style="right:20px">−25:56</div>
  </div><div class="pp-cur"><svg viewBox="0 0 24 24"><path d="M5 3l14 8-6.2 1.6L10 19z" fill="#1d0b1a" stroke="#fff" stroke-width="1.6" stroke-linejoin="round"/></svg></div></div>`;
  stage.append(root);
  const board = root.querySelector('.pp-b'), btn = root.querySelector('.pp-btn'), ico = root.querySelector('.pp-ico');
  const ring = root.querySelector('.pp-ring'), times = root.querySelectorAll('.pp-time'), cur = root.querySelector('.pp-cur');
  const fit = () => { const s = Math.min(stage.clientWidth / 420, stage.clientHeight / 320); board.style.transform = `scale(${s}) translate(-50%, -50%)`; };
  const ro = new ResizeObserver(fit); ro.observe(stage); fit();

  // 24x24 icon space. Play: two halves of a triangle. Pause: two bars. Four points each, same order.
  const play = [[[6, 3], [13, 7.5], [13, 16.5], [6, 21]], [[13, 7.5], [20, 12], [20, 12], [13, 16.5]]];
  const pause = [[[5, 4], [10, 4], [10, 20], [5, 20]], [[14, 4], [19, 4], [19, 20], [14, 20]]];
  const toD = v => play.map((poly, i) => 'M' + poly.map((p, j) => [p[0] + (pause[i][j][0] - p[0]) * v, p[1] + (pause[i][j][1] - p[1]) * v].map(n => n.toFixed(2)).join(' ')).join('L') + 'Z').join('');
  // cubic-bezier(0.77, 0, 0.175, 1) sampled by solving x for t
  const bez = (x1, y1, x2, y2) => x => { let t = x; for (let i = 0; i < 6; i++) { const cx = 3 * x1 * t * (1 - t) ** 2 + 3 * x2 * t * t * (1 - t) + t ** 3 - x, d = 3 * x1 * (1 - t) ** 2 + 6 * (x2 - x1) * t * (1 - t) + 3 * (1 - x2) * t * t; if (Math.abs(d) < 1e-6) break; t -= cx / d; } t = Math.min(1, Math.max(0, t)); return 3 * y1 * t * (1 - t) ** 2 + 3 * y2 * t * t * (1 - t) + t ** 3; };
  const ease = bez(0.77, 0, 0.175, 1);
  ico.setAttribute('d', toD(0));

  let from = 0, to = 0, start = -1e9, playing = false, pos = 724, last = performance.now(), raf, manual = -1e9;
  const fmt = s => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
  const toggle = () => { playing = !playing; from = from + (to - from) * ease(Math.min(1, (performance.now() - start) / PARAMS.duration)); to = playing ? 1 : 0; start = performance.now();
    if (reduce) { start = -1e9; ico.animate([{ opacity: 0 }, { opacity: 1 }], { duration: PARAMS.duration, easing: 'ease-out' }); }   // reduced motion: snap to the new icon and fade it in
    btn.setAttribute('aria-label', playing ? 'Pause' : 'Play'); };
  const onClick = () => { manual = performance.now(); toggle(); };
  btn.addEventListener('click', onClick);
  function frame(now) {
    const dt = (now - last) / 1000; last = now;
    if (playing) pos = (pos + dt * 40) % 2280;              // sped up so the ring visibly fills
    ring.setAttribute('stroke-dashoffset', (207.3 * (1 - pos / 2280)).toFixed(2));
    times[0].textContent = fmt(pos); times[1].textContent = '−' + fmt(2280 - pos);
    const k = ease(Math.min(1, (now - start) / PARAMS.duration));
    ico.setAttribute('d', toD(from + (to - from) * k));
    raf = requestAnimationFrame(frame);
  }
  raf = requestAnimationFrame(frame);

  const T = new Set(), after = (ms, f) => { const id = setTimeout(() => { T.delete(id); f(); }, ms); T.add(id); };
  const move = (x, y) => { cur.style.transform = `translate(${x}px, ${y}px)`; };
  move(330, 290);
  const tap = () => { cur.classList.add('down'); after(130, () => { cur.classList.remove('down'); if (performance.now() - manual > 4000) toggle(); }); };
  const cycle = () => {
    move(212, 204); after(800, tap);
    after(800 + PARAMS.hold, () => move(300, 262));
    after(1400 + PARAMS.hold * 1.6, () => move(214, 206));
    after(2200 + PARAMS.hold * 1.6, tap);
    after(2200 + PARAMS.hold * 2.4, () => move(330, 290));
    after(2900 + PARAMS.hold * 2.4, cycle);
  };
  after(200, cycle);
  return () => { cancelAnimationFrame(raf); T.forEach(clearTimeout); T.clear(); ro.disconnect(); btn.removeEventListener('click', onClick); root.remove(); };
}
