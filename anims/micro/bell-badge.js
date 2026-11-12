// Notification bell: each new notification makes the bell swing on its hook in a quick damped ring, and the badge pops in
// (or its number rolls up to the next one). Opening the bell clears the badge and drops the list down from the bell itself.
// It feels right because the ring is short and decaying, like a real bell, so it catches the eye without demanding a click.
const PARAMS = { swing: 14, ringMs: 650 };

export default function (stage) {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const W = 540, H = 380;
  const notes = [['MJ', '#d63c74', '<b>Maya</b> commented on <b>Homepage v2</b>', '2 min ago'], ['SK', '#1c7ed6', '<b>Sam</b> assigned you <b>Fix checkout copy</b>', '5 min ago'], ['AL', '#2f9e44', '<b>Alex</b> approved your changes', '12 min ago']];
  const root = document.createElement('div');
  root.className = 'bb-root';
  root.innerHTML = `<style>
    .bb-root { position: absolute; inset: 0; overflow: hidden; background: #f4f1f3; font-family: system-ui, -apple-system, "Segoe UI", sans-serif; color: #15171a; }
    .bb-scene { position: absolute; left: 0; top: 0; width: ${W}px; height: ${H}px; transform-origin: 0 0; }
    .bb-app { position: absolute; left: 30px; right: 30px; top: 26px; bottom: 26px; border-radius: 14px; background: #fff; box-shadow: 0 0 0 1px rgba(20,24,30,.06); overflow: hidden; }
    .bb-top { height: 56px; display: flex; align-items: center; gap: 12px; padding: 0 16px; border-bottom: 1px solid #f0f1f3; }
    .bb-search { flex: 1; max-width: 220px; height: 32px; border-radius: 8px; background: #f4f5f7; display: flex; align-items: center; padding: 0 10px; font-size: 12.5px; color: #8a8f94; }
    .bb-bell { position: relative; margin-left: auto; width: 40px; height: 40px; border-radius: 9px; border: 0; background: transparent; display: grid; place-items: center; color: #33373c; padding: 0; }
    .bb-bell.open { background: #f4f5f7; }
    .bb-bell svg { width: 23px; height: 23px; transform-origin: 50% 2px; }
    .bb-badge { position: absolute; right: 3px; top: 3px; min-width: 17px; height: 17px; border-radius: 9px; background: #e5294c; color: #fff; font-size: 10.5px; font-weight: 700; box-shadow: 0 0 0 2px #fff; overflow: hidden; opacity: 0; }
    .bb-badge span { position: absolute; inset: 0; display: grid; place-items: center; font-variant-numeric: tabular-nums; }
    .bb-av { width: 30px; height: 30px; border-radius: 50%; background: #e9d8fd; display: grid; place-items: center; font-size: 11px; font-weight: 700; color: #5f3dc4; }
    .bb-body { padding: 18px 20px; } .bb-body h3 { margin: 0 0 12px; font-size: 16px; font-weight: 700; }
    .bb-task { height: 34px; border-radius: 8px; background: #f8f9fa; margin-bottom: 8px; display: flex; align-items: center; padding: 0 12px; font-size: 12.5px; color: #495057; gap: 8px; } .bb-task i { width: 12px; height: 12px; border-radius: 4px; border: 1.5px solid #ced4da; }
    .bb-pop { position: absolute; right: 60px; top: 70px; width: 270px; border-radius: 12px; background: #fff; box-shadow: 0 0 0 1px rgba(20,24,30,.08), 0 16px 40px -12px rgba(30,20,40,.3); padding: 8px; transform-origin: 85% 0; opacity: 0; pointer-events: none; }
    .bb-pop h4 { margin: 4px 8px 6px; font-size: 12.5px; font-weight: 650; }
    .bb-n { display: flex; gap: 10px; padding: 8px; border-radius: 8px; font-size: 12px; line-height: 1.35; color: #3a3e43; } .bb-n:first-of-type { background: #fdf2f6; }
    .bb-n i { width: 26px; height: 26px; flex: none; border-radius: 50%; color: #fff; font-style: normal; font-size: 10px; font-weight: 700; display: grid; place-items: center; }
    .bb-n b { font-weight: 650; color: #15171a; } .bb-n small { display: block; color: #8a8f94; font-size: 11px; margin-top: 2px; }
  </style><div class="bb-scene"><div class="bb-app">
    <div class="bb-top"><div class="bb-search">Search tasks and people</div><button class="bb-bell" type="button" aria-label="Notifications"><svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M5 8a5 5 0 0 1 10 0c0 4.5 1.8 6 1.8 6H3.2S5 12.5 5 8z"/><path d="M8.3 17a1.9 1.9 0 0 0 3.4 0"/></svg><span class="bb-badge"><span>1</span></span></button><div class="bb-av">JD</div></div>
    <div class="bb-body"><h3>Today</h3><div class="bb-task"><i></i>Review pricing page copy</div><div class="bb-task"><i></i>Reply to Sam about the launch date</div><div class="bb-task"><i></i>Export icons for the app store</div><div class="bb-task"><i></i>Book user interviews for next week</div></div>
  </div><div class="bb-pop"><h4>Notifications</h4>${notes.map(([a, c, t, w]) => `<div class="bb-n"><i style="background:${c}">${a}</i><div>${t}<small>${w}</small></div></div>`).join('')}</div></div>`;
  stage.append(root);
  const scene = root.querySelector('.bb-scene');
  const fit = () => { const w = stage.clientWidth, h = stage.clientHeight, s = Math.min(w / W, h / H, 1.3); scene.style.transform = `translate(${(w - W * s) / 2}px, ${(h - H * s) / 2}px) scale(${s})`; };
  const ro = new ResizeObserver(fit); ro.observe(stage); fit();
  const bell = root.querySelector('.bb-bell'), icon = bell.querySelector('svg'), badge = root.querySelector('.bb-badge'), pop = root.querySelector('.bb-pop');
  const ease = 'cubic-bezier(0.23, 1, 0.32, 1)', anims = new Set();
  // reduced motion: no swing, pop, roll or press; the badge, count and panel still fade in and out
  const go = (el, kf, o) => { const a = el.animate(reduce ? kf.map(({ transform, ...f }) => f) : kf, { easing: ease, fill: 'forwards', ...o }); anims.add(a); a.onfinish = () => anims.delete(a); return a; };
  let count = 0;
  function ring() {
    const s = PARAMS.swing;   // a decaying swing on the hook
    go(icon, [0, s, -s * 0.8, s * 0.55, -s * 0.35, s * 0.15, 0].map(d => ({ transform: `rotate(${d}deg)` })), { duration: PARAMS.ringMs, easing: 'ease-out', fill: 'none' });
  }
  function arrive() {
    ring(); count++;
    if (count === 1) {
      badge.firstElementChild.textContent = count;
      go(badge, [{ opacity: 0, transform: 'scale(0.6)' }, { opacity: 1, transform: 'scale(1.15)', offset: 0.6 }, { opacity: 1, transform: 'scale(1)' }], { duration: 300, delay: 60 });
    } else {
      // the old number rolls up and out while the new one rolls in from below
      const old = badge.firstElementChild, next = old.cloneNode(); next.textContent = count; badge.append(next);
      go(old, [{ transform: 'none', opacity: 1 }, { transform: 'translateY(-100%)', opacity: 0 }], { duration: 220, delay: 60 }).finished.then(() => old.remove(), () => {});
      go(next, [{ transform: 'translateY(100%)', opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: 220, delay: 60 });
    }
  }
  function open() {
    bell.classList.add('open');
    go(bell, [{ transform: 'scale(1)' }, { transform: 'scale(0.97)', offset: 0.4 }, { transform: 'scale(1)' }], { duration: 180, fill: 'none' });
    go(badge, [{ opacity: 1, transform: 'scale(1)' }, { opacity: 0, transform: 'scale(0.8)' }], { duration: 160 });
    go(pop, [{ opacity: 0, transform: 'translateY(-4px) scale(0.95)' }, { opacity: 1, transform: 'none' }], { duration: 220 });
  }
  function close() {
    bell.classList.remove('open');
    go(pop, [{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'scale(0.97)' }], { duration: 160 });
  }
  let timers = [];
  function cycle() {
    timers = []; count = 0;
    [...badge.children].slice(1).forEach(c => c.remove());
    const t = (ms, fn) => timers.push(setTimeout(fn, ms));
    t(600, arrive); t(2000, arrive); t(3300, arrive); t(4800, open); t(7000, close);
    timers.push(setTimeout(cycle, 7800));
  }
  cycle();
  return () => { timers.forEach(clearTimeout); anims.forEach(a => a.cancel()); ro.disconnect(); root.remove(); };
}
