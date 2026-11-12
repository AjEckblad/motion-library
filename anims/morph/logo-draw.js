// Logo draw: each stroke of the mark has its dash set to its own length and offset by the same amount, so it starts invisible; sliding the offset to zero draws it like a pen. Once every stroke is down the shapes fill in, which turns a sketch into a finished brand mark on the launch screen.
const PARAMS = { draw: 1500, stagger: 160 };

export default function (stage) {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const root = document.createElement('div');
  root.className = 'ld-root';
  root.innerHTML = `<style>
    .ld-root { position: absolute; inset: 0; overflow: hidden; background: #1d0b1a; font-family: system-ui, -apple-system, sans-serif; }
    .ld-b { position: absolute; left: 50%; top: 50%; width: 420px; height: 320px; transform-origin: 0 0; }
    .ld-glow { position: absolute; left: 110px; top: 20px; width: 200px; height: 200px; border-radius: 50%; background: radial-gradient(circle, rgba(184,53,154,.35), transparent 70%); opacity: 0; transition: opacity 600ms ease-out; }
    .ld-b svg { position: absolute; left: 150px; top: 46px; width: 120px; height: 120px; overflow: visible; }
    .ld-b path, .ld-b circle { fill-opacity: 0; transition: fill-opacity 500ms cubic-bezier(0.23, 1, 0.32, 1); }
    .ld-b.filled path.f, .ld-b.filled circle.f { fill-opacity: 1; }
    .ld-name { position: absolute; left: 0; right: 0; top: 186px; text-align: center; font-size: 30px; font-weight: 760; letter-spacing: -.02em; color: #fff; }
    .ld-name span { display: inline-block; opacity: 0; transform: translateY(8px); transition: opacity 300ms cubic-bezier(0.23, 1, 0.32, 1), transform 400ms cubic-bezier(0.23, 1, 0.32, 1); }
    .ld-tag { position: absolute; left: 0; right: 0; top: 232px; text-align: center; font-size: 13px; color: #d9a6c8; opacity: 0; transition: opacity 400ms ease-out 200ms; }
    .ld-bar { position: absolute; left: 170px; top: 276px; width: 80px; height: 3px; border-radius: 2px; background: rgba(255,255,255,.12); overflow: hidden; }
    .ld-bar i { position: absolute; inset: 0; background: #e57cc4; transform-origin: 0 50%; transform: scaleX(.02); }
    .ld-b.filled .ld-glow, .ld-b.named .ld-tag { opacity: 1; }
    .ld-b.named .ld-name span { opacity: 1; transform: none; }
    .ld-b.out > * { opacity: 0 !important; transition: opacity 350ms ease-out !important; }
    ${reduce ? '.ld-name span { transform: none !important; }' : ''}
  </style>
  <div class="ld-b"><div class="ld-glow"></div>
    <svg viewBox="0 0 120 120" fill="none" stroke-linecap="round" stroke-linejoin="round">
      <circle class="s f" cx="60" cy="60" r="54" stroke="#e57cc4" stroke-width="3" fill="#2a0f26"/>
      <path class="s f" d="M22 84 L48 44 L62 64 L74 50 L98 84 Z" stroke="#fff" stroke-width="3.2" fill="#b8359a"/>
      <path class="s f" d="M48 44 L42 60 L52 56 L56 66" stroke="#fff" stroke-width="2.6" fill="#f7d6ea"/>
      <circle class="s f" cx="84" cy="34" r="8" stroke="#ffd36e" stroke-width="3" fill="#ffd36e"/>
      <path class="s" d="M30 94 C 48 88, 72 100, 92 92" stroke="#e57cc4" stroke-width="3"/>
    </svg>
    <div class="ld-name">${[...'Switchback'].map((c, i) => `<span style="transition-delay:${i * 35}ms">${c}</span>`).join('')}</div>
    <div class="ld-tag">Trail maps that work offline</div>
    <div class="ld-bar"><i></i></div>
  </div>`;
  stage.append(root);
  const board = root.querySelector('.ld-b'), bar = root.querySelector('.ld-bar i');
  const strokes = [...root.querySelectorAll('.s')];
  const fit = () => { const s = Math.min(stage.clientWidth / 420, stage.clientHeight / 320); board.style.transform = `scale(${s}) translate(-50%, -50%)`; };
  const ro = new ResizeObserver(fit); ro.observe(stage); fit();
  const lens = strokes.map(p => p.getTotalLength());
  const anims = new Set();
  const T = new Set(), after = (ms, f) => { const id = setTimeout(() => { T.delete(id); f(); }, ms); T.add(id); };
  const run = () => {
    board.classList.remove('filled', 'named', 'out');
    anims.forEach(a => a.cancel()); anims.clear();
    // A pen accelerates and settles: ease-in-out per stroke, staggered so they overlap like one hand.
    strokes.forEach((p, i) => {
      const L = lens[i];
      // reduced motion: each finished stroke fades in instead of being traced
      if (reduce) { anims.add(p.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 600, delay: i * 80, easing: 'ease-out', fill: 'both' })); return; }
      p.style.strokeDasharray = L + ' ' + L;
      const a = p.animate([{ strokeDashoffset: L }, { strokeDashoffset: 0 }], { duration: PARAMS.draw * (i === 0 ? 1 : 0.7), delay: i * PARAMS.stagger, easing: 'cubic-bezier(0.77, 0, 0.175, 1)', fill: 'both' });
      anims.add(a);
    });
    const drawn = reduce ? 1000 : PARAMS.draw + strokes.length * PARAMS.stagger;
    const b = bar.animate([{ transform: 'scaleX(.02)' }, { transform: 'scaleX(1)' }], { duration: drawn + 1500, easing: 'cubic-bezier(0.23, 1, 0.32, 1)', fill: 'both' }); anims.add(b);
    after(drawn - 150, () => board.classList.add('filled'));
    after(drawn + 150, () => board.classList.add('named'));
    after(drawn + 3400, () => board.classList.add('out'));
    after(drawn + 3850, run);
  };
  run();
  return () => { T.forEach(clearTimeout); T.clear(); anims.forEach(a => a.cancel()); anims.clear(); ro.disconnect(); root.remove(); };
}
