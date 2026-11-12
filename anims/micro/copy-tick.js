// Copy to clipboard in a settings page: pressing Copy swaps the two-squares icon for a tick that draws itself, and a small
// "Copied" label rises above the button; after a moment both quietly swap back.
// It feels right because the confirmation appears exactly where you clicked, fast enough to feel instant and gone before it nags.
const PARAMS = { duration: 200, hold: 1600 };

export default function (stage) {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const W = 540, H = 380;
  const field = (label, value, hint) => `<div class="ck-f"><label>${label}</label><div class="ck-row"><div class="ck-val">${value}</div><button class="ck-btn" type="button" aria-label="Copy ${label}"><span class="ck-tip">Copied</span>
    <svg class="ck-copy" viewBox="0 0 20 20"><rect x="7" y="7" width="9.5" height="9.5" rx="2" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M13 4.5v-.5A1.5 1.5 0 0 0 11.5 2.5h-7A1.5 1.5 0 0 0 3 4v7a1.5 1.5 0 0 0 1.5 1.5H5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>
    <svg class="ck-tick" viewBox="0 0 20 20"><path d="M4.5 10.5l3.5 3.5 7.5-8" fill="none" stroke="#2f9e44" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></button></div><p>${hint}</p></div>`;
  const root = document.createElement('div');
  root.className = 'ck-root';
  root.innerHTML = `<style>
    .ck-root { position: absolute; inset: 0; overflow: hidden; background: radial-gradient(120% 100% at 50% 0%, #1b1b1e, #0d0d0f); font-family: system-ui, -apple-system, "Segoe UI", sans-serif; color: #15171a; }
    .ck-scene { position: absolute; left: 0; top: 0; width: ${W}px; height: ${H}px; transform-origin: 0 0; }
    .ck-card { position: absolute; left: 60px; right: 60px; top: 40px; border-radius: 16px; background: #fff; box-shadow: 0 0 0 1px rgba(20,24,30,.06), 0 10px 30px -12px rgba(60,20,40,.18); padding: 22px 22px 8px; }
    .ck-card h2 { margin: 0; font-size: 18px; font-weight: 700; letter-spacing: -0.02em; } .ck-card > p { margin: 4px 0 18px; font-size: 12.5px; color: #6b7076; }
    .ck-f { margin-bottom: 16px; } .ck-f label { display: block; font-size: 12px; font-weight: 600; margin-bottom: 6px; } .ck-f p { margin: 6px 0 0; font-size: 11.5px; color: #8a8f94; }
    .ck-row { display: flex; gap: 8px; }
    .ck-val { flex: 1; height: 40px; border-radius: 9px; background: #f6f7f9; border: 1px solid #e6e8eb; padding: 0 12px; display: flex; align-items: center; font: 12.5px ui-monospace, Menlo, monospace; color: #33373c; }
    .ck-btn { position: relative; width: 40px; height: 40px; flex: none; border-radius: 9px; border: 1px solid #e0e3e7; background: #fff; color: #33373c; cursor: pointer; padding: 0; transition: transform .14s cubic-bezier(.23,1,.32,1); }
    .ck-btn:active { transform: ${reduce ? 'none' : 'scale(0.97)'}; }
    .ck-btn svg { position: absolute; left: 10px; top: 10px; width: 20px; height: 20px; }
    .ck-tick { opacity: 0; }
    .ck-tip { position: absolute; left: 50%; bottom: calc(100% + 8px); margin-left: -30px; width: 60px; text-align: center; padding: 5px 0; border-radius: 7px; background: #15171a; color: #fff; font-size: 11.5px; font-weight: 600; opacity: 0; pointer-events: none; transform-origin: 50% 100%; }
    .ck-tip::after { content: ''; position: absolute; left: 50%; top: 100%; margin-left: -4px; border: 4px solid transparent; border-top-color: #15171a; }
  </style><div class="ck-scene"><div class="ck-card"><h2>Share and connect</h2><p>Bring teammates in, or connect your own tools.</p>
    ${field('Invite link', 'https://app.example.com/join/7f3k-29qa', 'Anyone with this link can join as an editor.')}
    ${field('API key', 'sk_live_•••••••••••••••••4c2e', 'Keep this secret. Rotate it if it leaks.')}
  </div></div>`;
  stage.append(root);
  const scene = root.querySelector('.ck-scene');
  const fit = () => { const w = stage.clientWidth, h = stage.clientHeight, s = Math.min(w / W, h / H, 1.3); scene.style.transform = `translate(${(w - W * s) / 2}px, ${(h - H * s) / 2}px) scale(${s})`; };
  const ro = new ResizeObserver(fit); ro.observe(stage); fit();
  const ease = 'cubic-bezier(0.23, 1, 0.32, 1)', D = PARAMS.duration, anims = new Set();
  // reduced motion: no press or scale; the icon swap, tick draw and tooltip still fade
  const go = (el, kf, o = {}) => { const a = el.animate(reduce ? kf.map(({ transform, ...f }) => f) : kf, { duration: D, easing: ease, fill: 'forwards', ...o }); anims.add(a); a.onfinish = () => anims.delete(a); };
  const btns = [...root.querySelectorAll('.ck-btn')].map(el => {
    const path = el.querySelector('.ck-tick path'), len = path.getTotalLength();
    path.style.strokeDasharray = len; path.style.strokeDashoffset = len;
    return { el, copy: el.querySelector('.ck-copy'), tick: el.querySelector('.ck-tick'), path, len, tip: el.querySelector('.ck-tip'), timer: 0 };
  });
  function copied(b) {
    clearTimeout(b.timer);
    go(b.el, [{ transform: 'scale(1)' }, { transform: 'scale(0.97)', offset: 0.4 }, { transform: 'scale(1)' }], { duration: 180, fill: 'none' });
    go(b.copy, [{ opacity: 1, transform: 'scale(1)' }, { opacity: 0, transform: 'scale(0.95)' }], { duration: D * 0.6 });
    go(b.tick, [{ opacity: 0, transform: 'scale(0.95)' }, { opacity: 1, transform: 'scale(1)' }]);
    go(b.path, [{ strokeDashoffset: b.len }, { strokeDashoffset: 0 }], { duration: D * 1.2, delay: 40 });
    go(b.tip, [{ opacity: 0, transform: 'translateY(4px) scale(0.95)' }, { opacity: 1, transform: 'none' }]);
    b.timer = setTimeout(() => {
      go(b.tip, [{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'translateY(2px)' }], { duration: 150 });
      go(b.tick, [{ opacity: 1 }, { opacity: 0 }], { duration: 150 });
      go(b.copy, [{ opacity: 0, transform: 'scale(0.95)' }, { opacity: 1, transform: 'scale(1)' }], { delay: 80 });
    }, PARAMS.hold);
  }
  let manual = -1e9;
  const onClick = e => { copied(btns.find(b => b.el === e.currentTarget)); manual = performance.now(); };
  btns.forEach(b => b.el.addEventListener('click', onClick));
  let k = 0;
  const auto = setInterval(() => { if (performance.now() - manual > 3000) copied(btns[k++ % 2]); }, PARAMS.hold + 1000);
  const first = setTimeout(() => copied(btns[k++]), 600);
  return () => { clearTimeout(first); clearInterval(auto); btns.forEach(b => { clearTimeout(b.timer); b.el.removeEventListener('click', onClick); }); anims.forEach(a => a.cancel()); ro.disconnect(); root.remove(); };
}
