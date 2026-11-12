// Icon morph: each icon pair is drawn with the same points in the same order, so one can be blended into the other point by point. In a podcast library the download arrow folds into a check when the episode is saved, and the list icon's four bars regroup into the grid's four squares as the view changes.
const PARAMS = { duration: 280 };

export default function (stage) {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const root = document.createElement('div');
  root.className = 'im-root';
  const eps = [['Why bridges sing in the wind', 'The Field Desk · 38 min', '#b8359a', '#f59fd0'], ['A short history of the fridge', 'Small Things · 24 min', '#2b74c9', '#9fc3e8'], ['Night trains are back', 'Slow Travel · 41 min', '#d9601a', '#f3c98b'], ['How bees vote', 'Wild Questions · 19 min', '#0e9488', '#9fe0d6']];
  root.innerHTML = `<style>
    .im-root { position: absolute; inset: 0; overflow: hidden; background: #f1ecf0; font-family: system-ui, -apple-system, sans-serif; }
    .im-b { position: absolute; left: 50%; top: 50%; width: 420px; height: 320px; transform-origin: 0 0; }
    .im-card { position: absolute; left: 34px; top: 16px; width: 352px; height: 288px; border-radius: 20px; background: #fff; overflow: hidden; box-shadow: 0 1px 2px rgba(42,15,38,.07), 0 16px 36px -18px rgba(42,15,38,.3); }
    .im-hd { position: absolute; left: 18px; right: 14px; top: 14px; height: 34px; display: flex; align-items: center; }
    .im-hd b { flex: 1; font-size: 18px; font-weight: 740; letter-spacing: -.02em; color: #1d0b1a; }
    .im-ib { width: 34px; height: 34px; border: 0; padding: 0; border-radius: 10px; background: #f6eff4; display: grid; place-items: center; cursor: pointer; }
    .im-ib svg { width: 20px; height: 20px; }
    .im-v { position: absolute; left: 14px; right: 14px; top: 58px; bottom: 0; transition: opacity 220ms cubic-bezier(0.23, 1, 0.32, 1), transform 280ms cubic-bezier(0.23, 1, 0.32, 1); }
    .im-row { display: flex; align-items: center; gap: 12px; height: 54px; padding: 0 4px; border-bottom: 1px solid #f4ecf2; }
    .im-th { flex: none; border-radius: 9px; }
    .im-row .im-th { width: 40px; height: 40px; }
    .im-t { flex: 1; min-width: 0; } .im-t b { display: block; font-size: 13px; font-weight: 650; color: #1d0b1a; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; } .im-t span { font-size: 11px; color: #8a7686; }
    .im-dl { width: 32px; height: 32px; border: 0; padding: 0; border-radius: 50%; background: none; cursor: pointer; position: relative; }
    .im-dl svg { position: absolute; inset: 0; width: 100%; height: 100%; overflow: visible; }
    .im-grid { display: grid; grid-template-columns: minmax(0,1fr) minmax(0,1fr); gap: 10px; }
    .im-tile .im-th { height: 70px; } .im-tile .im-t { margin-top: 6px; } .im-tile .im-t span { display: none; }
    .im-v.off { opacity: 0; transform: translateY(8px); pointer-events: none; }
    .im-cur { position: absolute; left: 0; top: 0; width: 22px; height: 22px; pointer-events: none; transition: transform 650ms cubic-bezier(0.23, 1, 0.32, 1); }
    .im-cur svg { width: 100%; height: 100%; transition: transform 120ms; } .im-cur.down svg { transform: scale(.86); }
    ${reduce ? '.im-v.off { transform: none; }' : ''}
  </style>
  <div class="im-b"><div class="im-card">
    <div class="im-hd"><b>Your library</b><button class="im-ib" type="button" aria-label="Show as grid"><svg viewBox="0 0 24 24">${'<rect rx="1.2" fill="#1d0b1a"/>'.repeat(4)}</svg></button></div>
    <div class="im-v im-list">${eps.map(([t, m, a, b], i) => `<div class="im-row"><div class="im-th" style="background:linear-gradient(140deg,${a},${b})"></div><div class="im-t"><b>${t}</b><span>${m}</span></div>${i === 0 ? `<button class="im-dl" type="button" aria-label="Download"><svg viewBox="0 0 32 32"><circle cx="16" cy="16" r="14" fill="none" stroke="#f1e4ee" stroke-width="2.2"/><circle class="im-bg" cx="16" cy="16" r="15" fill="#b8359a" opacity="0"/><circle class="im-ring" cx="16" cy="16" r="14" fill="none" stroke="#b8359a" stroke-width="2.2" stroke-linecap="round" transform="rotate(-90 16 16)" stroke-dasharray="88" stroke-dashoffset="88"/><g transform="translate(4 4)" fill="none" stroke="#1d0b1a" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path class="im-a"/><path class="im-c"/></g></svg></button>` : ''}</div>`).join('')}</div>
    <div class="im-v im-grid off">${eps.map(([t, , a, b]) => `<div class="im-tile"><div class="im-th" style="background:linear-gradient(140deg,${a},${b})"></div><div class="im-t"><b>${t}</b></div></div>`).join('')}</div>
  </div><div class="im-cur"><svg viewBox="0 0 24 24"><path d="M5 3l14 8-6.2 1.6L10 19z" fill="#1d0b1a" stroke="#fff" stroke-width="1.6" stroke-linejoin="round"/></svg></div></div>`;
  stage.append(root);
  const $ = s => root.querySelector(s);
  const board = $('.im-b'), cur = $('.im-cur'), vb = $('.im-ib'), dl = $('.im-dl'), ring = $('.im-ring'), bg = $('.im-bg'), pa = $('.im-a'), pc = $('.im-c');
  const rects = [...vb.querySelectorAll('rect')], list = $('.im-list'), grid = $('.im-grid');
  const fit = () => { const s = Math.min(stage.clientWidth / 420, stage.clientHeight / 320); board.style.transform = `scale(${s}) translate(-50%, -50%)`; };
  const ro = new ResizeObserver(fit); ro.observe(stage); fit();

  // Download: stem + chevron + tray. Check: the chevron becomes the tick, stem and tray shrink into its corner.
  const dA = [[[12, 3.5], [12, 14.5]], [[7.5, 10], [12, 14.5], [16.5, 10]]], dC = [[[9.8, 16.6], [9.8, 16.6]], [[5.6, 12.4], [9.8, 16.6], [18.4, 8]]];
  const tray = [[5, 19.5], [19, 19.5]], trayC = [[9.8, 16.6], [9.8, 16.6]];
  const L = (a, b, t) => a + (b - a) * t, pl = (pts) => 'M' + pts.map(p => p.map(n => n.toFixed(2)).join(' ')).join('L');
  // List: four bars. Grid: four squares. Same four rects, x/y/w/h blended.
  const R0 = [[3, 3.5, 18, 3], [3, 8.5, 18, 3], [3, 13.5, 18, 3], [3, 18.5, 18, 3]], R1 = [[3, 3, 8, 8], [13, 3, 8, 8], [3, 13, 8, 8], [13, 13, 8, 8]];
  const bez = (x1, y1, x2, y2) => x => { let t = x; for (let i = 0; i < 6; i++) { const cx = 3 * x1 * t * (1 - t) ** 2 + 3 * x2 * t * t * (1 - t) + t ** 3 - x, d = 3 * x1 * (1 - t) ** 2 + 6 * (x2 - x1) * t * (1 - t) + 3 * (1 - x2) * t * t; if (Math.abs(d) < 1e-6) break; t -= cx / d; } t = Math.min(1, Math.max(0, t)); return 3 * y1 * t * (1 - t) ** 2 + 3 * y2 * t * t * (1 - t) + t ** 3; };
  const ease = bez(0.77, 0, 0.175, 1);
  // reduced motion: the icons snap to their new shape and fade in (see fadeIn) instead of morphing point by point
  const fadeIn = (...els) => { if (reduce) els.forEach(el => el.animate([{ opacity: 0 }, { opacity: 1 }], { duration: PARAMS.duration, easing: 'ease-out' })); };
  const tw = () => ({ from: 0, to: 0, start: -1e9, val(now) { if (reduce) return this.to; return this.from + (this.to - this.from) * ease(Math.min(1, (now - this.start) / PARAMS.duration)); }, go(v) { const n = performance.now(); this.from = this.val(n); this.to = v; this.start = n; } });
  const dlT = tw(), gT = tw();
  let prog = 0, loading = false, raf, last = performance.now(), manual = -1e9;
  const setGrid = g => { gT.go(g ? 1 : 0); fadeIn(vb.querySelector('svg')); list.classList.toggle('off', g); grid.classList.toggle('off', !g); vb.setAttribute('aria-label', g ? 'Show as list' : 'Show as grid'); };
  const startDl = () => { if (dlT.to || loading) return; loading = true; prog = 0; dl.setAttribute('aria-label', 'Downloading'); };
  const resetDl = () => { loading = false; prog = 0; dlT.to = dlT.from = 0; dl.setAttribute('aria-label', 'Download'); };
  const onView = () => { manual = performance.now(); setGrid(!gT.to); };
  const onDl = () => { manual = performance.now(); dlT.to ? resetDl() : startDl(); };
  vb.addEventListener('click', onView); dl.addEventListener('click', onDl);
  function frame(now) {
    const dt = now - last; last = now;
    if (loading) { prog = Math.min(1, prog + dt / 900); if (prog >= 1) { loading = false; dlT.go(1); fadeIn(pa.parentNode, bg); dl.setAttribute('aria-label', 'Downloaded'); } }
    const v = dlT.val(now);
    ring.setAttribute('stroke-dashoffset', (88 * (1 - (dlT.to ? 1 : prog))).toFixed(1)); ring.style.opacity = 1 - v;
    bg.setAttribute('opacity', v.toFixed(3));
    pa.setAttribute('d', dA.map((s, i) => pl(s.map((p, j) => [L(p[0], dC[i][j][0], v), L(p[1], dC[i][j][1], v)]))).join(''));
    pc.setAttribute('d', pl(tray.map((p, j) => [L(p[0], trayC[j][0], v), L(p[1], trayC[j][1], v)]))); pc.style.opacity = 1 - v;
    pa.parentNode.setAttribute('stroke', v > 0.5 ? '#fff' : '#1d0b1a');
    const g = gT.val(now);
    rects.forEach((r, i) => { const a = R0[i], b = R1[i]; r.setAttribute('x', L(a[0], b[0], g)); r.setAttribute('y', L(a[1], b[1], g)); r.setAttribute('width', L(a[2], b[2], g)); r.setAttribute('height', L(a[3], b[3], g)); });
    raf = requestAnimationFrame(frame);
  }
  raf = requestAnimationFrame(frame);

  const T = new Set(), after = (ms, f) => { const id = setTimeout(() => { T.delete(id); f(); }, ms); T.add(id); };
  const move = (x, y) => { cur.style.transform = `translate(${x}px, ${y}px)`; };
  const auto = () => performance.now() - manual > 4000;
  const press = f => { cur.classList.add('down'); after(120, () => { cur.classList.remove('down'); if (auto()) f(); }); };
  move(250, 260);
  const cycle = () => {
    move(346, 106); after(650, () => press(startDl));
    after(2600, () => move(352, 48)); after(3250, () => press(() => setGrid(true)));
    after(3600, () => move(260, 240)); after(3900, () => { if (auto()) resetDl(); });
    after(5000, () => move(352, 48)); after(5650, () => press(() => setGrid(false)));
    after(6000, () => move(250, 260));
    after(6900, cycle);
  };
  after(150, cycle);
  return () => { cancelAnimationFrame(raf); T.forEach(clearTimeout); T.clear(); ro.disconnect(); vb.removeEventListener('click', onView); dl.removeEventListener('click', onDl); root.remove(); };
}
