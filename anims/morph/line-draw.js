// Line draw-on: set each line's dash to its full length and offset it by the same amount, and it disappears; slide the offset to zero and it draws itself. On an analytics card the lines trace the week left to right, the way you would read them, and the labels arrive only once there is a line to label.
const PARAMS = { duration: 1600 };

export default function (stage) {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const root = document.createElement('div');
  root.className = 'ldr-root';
  const visits = [42, 48, 45, 58, 64, 61, 78], signups = [8, 11, 9, 14, 13, 18, 22];
  const X = i => 30 + i * 52, Yv = v => 150 - v * 1.6, Ys = v => 150 - v * 4;
  const smooth = pts => pts.reduce((d, p, i) => { if (!i) return `M${p[0]} ${p[1]}`; const q = pts[i - 1], mx = (q[0] + p[0]) / 2; return d + `C${mx} ${q[1]} ${mx} ${p[1]} ${p[0]} ${p[1]}`; }, '');
  const pv = visits.map((v, i) => [X(i), Yv(v)]), ps = signups.map((v, i) => [X(i), Ys(v)]);
  root.innerHTML = `<style>
    .ldr-root { position: absolute; inset: 0; overflow: hidden; background: #f1ecf0; font-family: system-ui, -apple-system, sans-serif; }
    .ldr-b { position: absolute; left: 50%; top: 50%; width: 420px; height: 320px; transform-origin: 0 0; }
    .ldr-card { position: absolute; left: 20px; top: 22px; width: 380px; height: 276px; border-radius: 18px; background: #fff; box-shadow: 0 1px 2px rgba(42,15,38,.07), 0 16px 36px -18px rgba(42,15,38,.3); }
    .ldr-h { position: absolute; left: 20px; top: 18px; font-size: 14px; font-weight: 700; color: #1d0b1a; }
    .ldr-s { position: absolute; left: 20px; top: 38px; font-size: 11px; color: #8a7686; }
    .ldr-lg { position: absolute; right: 18px; top: 20px; display: flex; gap: 12px; font-size: 11px; font-weight: 600; color: #5b4657; }
    .ldr-lg i { display: inline-block; width: 10px; height: 3px; border-radius: 2px; margin-right: 5px; vertical-align: middle; }
    .ldr-card svg { position: absolute; left: 0; top: 66px; width: 380px; height: 196px; overflow: visible; }
    .ldr-f { opacity: 0; transition: opacity 300ms cubic-bezier(0.23, 1, 0.32, 1), transform 300ms cubic-bezier(0.23, 1, 0.32, 1); }
    .ldr-tag { transform: translateY(4px); }
    .ldr-card.on .ldr-f { opacity: 1; transform: none; }
    .ldr-card.out .ldr-fade { opacity: 0; transition: opacity 300ms ease-out; }
    ${reduce ? '.ldr-tag { transform: none; }' : ''}
  </style>
  <div class="ldr-b"><div class="ldr-card">
    <div class="ldr-h">Store visits and sign-ups</div><div class="ldr-s">This week · thousands / hundreds</div>
    <div class="ldr-lg"><span><i style="background:#b8359a"></i>Visits</span><span><i style="background:#2b74c9"></i>Sign-ups</span></div>
    <svg viewBox="0 0 380 196" fill="none">
      ${[30, 70, 110, 150].map(y => `<line x1="30" x2="342" y1="${y}" y2="${y}" stroke="#f1e8ef"/>`).join('')}
      <g class="ldr-fade">
        <path class="ldr-l" d="${smooth(pv)}" stroke="#b8359a" stroke-width="2.6" stroke-linecap="round"/>
        <path class="ldr-l" d="${smooth(ps)}" stroke="#2b74c9" stroke-width="2.6" stroke-linecap="round"/>
        <g class="ldr-f ldr-tag"><circle cx="${pv[6][0]}" cy="${pv[6][1]}" r="4.5" fill="#fff" stroke="#b8359a" stroke-width="2.4"/><rect x="${pv[6][0] - 40}" y="${pv[6][1] - 32}" width="44" height="20" rx="6" fill="#2a0f26"/><text x="${pv[6][0] - 18}" y="${pv[6][1] - 18}" fill="#fff" font-size="11" font-weight="700" text-anchor="middle">78.4k</text></g>
        <g class="ldr-f ldr-tag" style="transition-delay:80ms"><circle cx="${ps[6][0]}" cy="${ps[6][1]}" r="4.5" fill="#fff" stroke="#2b74c9" stroke-width="2.4"/><text x="${ps[6][0] - 10}" y="${ps[6][1] + 20}" fill="#2b74c9" font-size="11" font-weight="700" text-anchor="middle">2,214</text></g>
      </g>
      ${['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d, i) => `<text x="${X(i)}" y="176" fill="#9a8996" font-size="10" text-anchor="middle">${d}</text>`).join('')}
    </svg>
  </div></div>`;
  stage.append(root);
  const board = root.querySelector('.ldr-b'), card = root.querySelector('.ldr-card');
  const lines = [...root.querySelectorAll('.ldr-l')];
  const fit = () => { const s = Math.min(stage.clientWidth / 420, stage.clientHeight / 320); board.style.transform = `scale(${s}) translate(-50%, -50%)`; };
  const ro = new ResizeObserver(fit); ro.observe(stage); fit();
  const lens = lines.map(p => p.getTotalLength());
  const anims = new Set(), T = new Set(), after = (ms, f) => { const id = setTimeout(() => { T.delete(id); f(); }, ms); T.add(id); };
  const run = () => {
    card.classList.remove('on', 'out'); anims.forEach(a => a.cancel()); anims.clear();
    lines.forEach((p, i) => {
      // reduced motion: the finished line fades in instead of drawing itself
      if (reduce) { anims.add(p.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 600, delay: i * 120, easing: 'ease-out', fill: 'both' })); return; }
      p.style.strokeDasharray = lens[i] + ' ' + lens[i];
      // A line being drawn is on screen the whole time, so ease-in-out reads like a steady hand.
      anims.add(p.animate([{ strokeDashoffset: lens[i] }, { strokeDashoffset: 0 }], { duration: PARAMS.duration, delay: i * PARAMS.duration * 0.18, easing: 'cubic-bezier(0.77, 0, 0.175, 1)', fill: 'both' }));
    });
    after(PARAMS.duration * 1.12, () => card.classList.add('on'));
    after(PARAMS.duration * 1.18 + 2400, () => card.classList.add('out'));
    after(PARAMS.duration * 1.18 + 2800, run);
  };
  run();
  return () => { T.forEach(clearTimeout); T.clear(); anims.forEach(a => a.cancel()); anims.clear(); ro.disconnect(); root.remove(); };
}
