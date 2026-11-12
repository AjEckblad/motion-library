// Dynamic island: on a phone's lock screen, the black pill around the camera grows into whatever is happening: an
// incoming call you answer, the call's running timer, a song that opens into a player, a countdown. Tap the pill to
// open or close the music player yourself.
// The pill is one black box the size of its largest state, cut down by clip-path to the current width, height and
// corner radius. Each of the three numbers is a spring (stiffness 340, damping ratio 0.72), so the shape overshoots a
// little and settles, the way a soft object does, and a change of state mid-way just retargets the springs. Contents
// cross-fade with a short blur: the old ones leave fast (120 ms), the new ones arrive a beat later (240 ms), so the
// shape leads and the content follows it.
const PARAMS = { stiffness: 340, bounce: 0.28, hold: 1 };

export default function (stage) {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const MW = 262, MH = 158;                                         // the island's largest box
  const root = document.createElement('div');
  root.className = 'di-root';
  const phoneIc = '<svg viewBox="0 0 24 24"><path d="M6.6 3.5h2.6l1.5 4.2-2 1.4a11 11 0 0 0 6.2 6.2l1.4-2 4.2 1.5v2.6a2 2 0 0 1-2.2 2A16.5 16.5 0 0 1 4.6 5.7a2 2 0 0 1 2-2.2z" fill="currentColor"/></svg>';
  root.innerHTML = `<style>
    .di-root { position: absolute; inset: 0; overflow: hidden; background: radial-gradient(120% 100% at 50% 0%, #1b1b1e, #0d0d0f); font-family: system-ui, -apple-system, "Segoe UI", sans-serif; color: #fff; -webkit-font-smoothing: antialiased; }
    .di-phone { position: absolute; left: 50%; top: 0; width: 280px; height: 580px; border-radius: 46px; background: #0f1113; box-shadow: inset 0 0 0 1.5px #3a3f46, 0 0 0 1px rgba(255,255,255,.13), 0 40px 80px -30px rgba(0,0,0,.8); transform-origin: 50% 0; }
    .di-screen { position: absolute; inset: 7px; border-radius: 39px; overflow: hidden; isolation: isolate;
      background: radial-gradient(90% 60% at 20% 18%, #3d6bd8 0%, transparent 60%), radial-gradient(80% 55% at 85% 40%, #b0469a 0%, transparent 62%),
                  radial-gradient(110% 70% at 40% 95%, #f08a3c 0%, transparent 58%), linear-gradient(180deg, #16204a, #3a1d4f 55%, #5b2a35); }
    .di-time { position: absolute; left: 0; right: 0; top: 92px; text-align: center; font-size: 74px; font-weight: 650; letter-spacing: -2.5px; line-height: 1; color: rgba(255,255,255,.92); }
    .di-date { position: absolute; left: 0; right: 0; top: 70px; text-align: center; font-size: 15px; font-weight: 600; color: rgba(255,255,255,.82); }
    .di-sb { position: absolute; left: 0; right: 0; top: 0; height: 44px; padding: 0 20px 0 28px; display: flex; align-items: center; justify-content: space-between; font-size: 13px; font-weight: 650; }
    .di-icons { display: flex; gap: 5px; align-items: center; } .di-icons svg { fill: #fff; color: #fff; }
    .di-dock { position: absolute; left: 34px; right: 34px; bottom: 34px; display: flex; justify-content: space-between; }
    .di-dock span { width: 46px; height: 46px; border-radius: 50%; background: rgba(20,20,30,.38); backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px); display: grid; place-items: center; }
    .di-dock svg { width: 20px; height: 20px; fill: none; stroke: #fff; stroke-width: 1.7; stroke-linecap: round; stroke-linejoin: round; }
    .di-bar { position: absolute; left: 50%; bottom: 9px; width: 116px; height: 4px; margin-left: -58px; border-radius: 3px; background: rgba(255,255,255,.85); }
    .di-island { position: absolute; left: 50%; top: 10px; width: ${MW}px; height: ${MH}px; margin-left: -${MW / 2}px; background: #000; z-index: 9; cursor: pointer; }
    .di-c { position: absolute; inset: 0; opacity: 0; filter: blur(6px); transform: scale(.94); transform-origin: 50% 0; pointer-events: none;
      transition: opacity .12s cubic-bezier(.23,1,.32,1), filter .12s cubic-bezier(.23,1,.32,1), transform .12s cubic-bezier(.23,1,.32,1); }
    .di-c.on { opacity: 1; filter: blur(0); transform: none; transition-duration: .24s; transition-delay: .07s; }
    .di-call .av { position: absolute; left: 14px; top: 14px; width: 44px; height: 44px; border-radius: 50%; background: linear-gradient(135deg, #f6b26b, #d9534f); display: grid; place-items: center; font-weight: 700; font-size: 16px; }
    .di-call .who { position: absolute; left: 68px; top: 17px; font-size: 12px; color: #9a9aa2; } .di-call .who b { display: block; margin-top: 1px; font-size: 16px; font-weight: 650; color: #fff; }
    .di-btn { position: absolute; top: 15px; width: 42px; height: 42px; border-radius: 50%; display: grid; place-items: center; }
    .di-btn svg { width: 20px; height: 20px; }
    .di-call .no { right: 64px; background: #ff3b30; } .di-call .no svg { transform: rotate(135deg); } .di-call .yes { right: 14px; background: #30d158; }
    .di-mini { position: absolute; top: 0; height: 30px; display: flex; align-items: center; gap: 6px; font-size: 13px; font-weight: 650; font-variant-numeric: tabular-nums; }
    .di-mini.l { left: 8px; } .di-mini.r { right: 10px; }
    .di-dot { width: 18px; height: 18px; border-radius: 50%; display: grid; place-items: center; } .di-dot svg { width: 11px; height: 11px; }
    .di-art { border-radius: 5px; background: conic-gradient(from 210deg, #ffcf5c, #ff6b6b, #7a5cff, #2ec4ff, #ffcf5c); }
    .di-wave { display: flex; align-items: center; gap: 2px; height: 14px; }
    .di-wave i { width: 3px; border-radius: 2px; background: #ff9f6b; height: 6px; animation: di-w .9s ease-in-out infinite alternate; }
    .di-wave i:nth-child(2) { animation-delay: -.3s; background: #ff7f8f; } .di-wave i:nth-child(3) { animation-delay: -.6s; background: #c48bff; } .di-wave i:nth-child(4) { animation-delay: -.15s; background: #7fb2ff; }
    @keyframes di-w { from { height: 4px; } to { height: 14px; } }
    .di-music .di-art.big { position: absolute; left: 16px; top: 16px; width: 52px; height: 52px; border-radius: 12px; }
    .di-music .song { position: absolute; left: 80px; top: 20px; font-size: 15px; font-weight: 650; } .di-music .song small { display: block; margin-top: 2px; font-size: 13px; font-weight: 500; color: #9a9aa2; }
    .di-music .di-wave { position: absolute; right: 18px; top: 30px; }
    .di-prog { position: absolute; left: 16px; right: 16px; top: 88px; display: flex; align-items: center; gap: 8px; font-size: 11px; color: #9a9aa2; font-variant-numeric: tabular-nums; }
    .di-prog div { flex: 1; height: 5px; border-radius: 3px; background: #3a3a3f; overflow: hidden; } .di-prog div i { display: block; height: 100%; width: 100%; background: #fff; border-radius: 3px; transform-origin: 0 50%; }
    .di-ctl { position: absolute; left: 0; right: 0; top: 112px; display: flex; justify-content: center; gap: 34px; }
    .di-ctl svg { width: 26px; height: 26px; fill: #fff; }
    .di-tap { position: absolute; width: 40px; height: 40px; margin: -20px 0 0 -20px; border-radius: 50%; background: rgba(255,255,255,.55); box-shadow: 0 0 0 1.5px rgba(255,255,255,.85); opacity: 0; pointer-events: none; z-index: 10; }
    ${reduce ? '.di-wave i { animation: none; height: 9px; } .di-c, .di-c.on { transform: none; filter: none; }' : ''}
  </style>
  <div class="di-phone"><div class="di-screen">
    <div class="di-sb"><span>9:41</span><span class="di-icons"><svg viewBox="0 0 18 12" width="17" height="11"><rect x="0" y="8" width="3" height="4" rx="1"/><rect x="5" y="5.5" width="3" height="6.5" rx="1"/><rect x="10" y="3" width="3" height="9" rx="1"/><rect x="15" y="0" width="3" height="12" rx="1"/></svg><svg viewBox="0 0 16 12" width="15" height="11"><path d="M8 11.5l2.3-2.6a3.2 3.2 0 0 0-4.6 0zM3.6 6.7a6.2 6.2 0 0 1 8.8 0l1.6-1.8a8.6 8.6 0 0 0-12 0zM.4 3.1a10.8 10.8 0 0 1 15.2 0L16 2.6A11.4 11.4 0 0 0 0 2.6z"/></svg><svg viewBox="0 0 27 12" width="25" height="11"><rect x=".6" y=".6" width="22.8" height="10.8" rx="3.2" fill="none" stroke="currentColor" stroke-opacity=".45" stroke-width="1.2"/><rect x="2.4" y="2.4" width="16" height="7.2" rx="1.8"/><path d="M25 4v4a2.2 2.2 0 0 0 0-4z" fill-opacity=".45"/></svg></span></div>
    <div class="di-date">Friday 13 November</div>
    <div class="di-time">9:41</div>
    <div class="di-dock"><span><svg viewBox="0 0 24 24"><path d="M9 3.5h6l-1 5.5h-4zM10 9h4v11.5h-4z"/></svg></span><span><svg viewBox="0 0 24 24"><rect x="3.5" y="7" width="17" height="12.5" rx="3"/><circle cx="12" cy="13.2" r="3.3"/><path d="M8.5 7l1.5-2.5h4L15.5 7"/></svg></span></div>
    <div class="di-bar"></div>
    <div class="di-island" role="button" tabindex="-1" aria-label="Dynamic island">
      <div class="di-c di-call" data-s="call"><div class="av">ML</div><div class="who">mobile<b>Maya Lin</b></div><span class="di-btn no">${phoneIc}</span><span class="di-btn yes">${phoneIc}</span></div>
      <div class="di-c" data-s="oncall"><div class="di-mini l"><span class="di-dot" style="background:#30d158">${phoneIc}</span><span style="color:#30d158" class="di-clock">0:00</span></div><div class="di-mini r"><span class="di-wave"><i></i><i></i><i></i><i></i></span></div></div>
      <div class="di-c" data-s="mini"><div class="di-mini l"><span class="di-art" style="width:20px;height:20px"></span></div><div class="di-mini r"><span class="di-wave"><i></i><i></i><i></i><i></i></span></div></div>
      <div class="di-c di-music" data-s="music"><span class="di-art big"></span><div class="song">Northern Lights<small>Ilse Varga</small></div><span class="di-wave"><i></i><i></i><i></i><i></i></span>
        <div class="di-prog"><span>1:12</span><div><i class="di-fill"></i></div><span>-2:31</span></div>
        <div class="di-ctl"><svg viewBox="0 0 24 24"><path d="M11 12l8-6v12zM5 6h2.5v12H5z"/></svg><svg viewBox="0 0 24 24"><path d="M6.5 5h4v14h-4zM13.5 5h4v14h-4z"/></svg><svg viewBox="0 0 24 24"><path d="M13 12L5 6v12zM16.5 6H19v12h-2.5z"/></svg></div></div>
      <div class="di-c" data-s="timer"><div class="di-mini l"><span class="di-dot" style="background:#ff9f0a"><svg viewBox="0 0 24 24"><circle cx="12" cy="13" r="7.5" fill="none" stroke="#000" stroke-width="2.6"/><path d="M12 13V9M10 2.8h4" stroke="#000" stroke-width="2.6" stroke-linecap="round"/></svg></span></div><div class="di-mini r" style="color:#ff9f0a"><span class="di-count">4:59</span></div></div>
    </div>
    <div class="di-tap"></div>
  </div></div>`;
  stage.append(root);
  const $ = s => root.querySelector(s);
  const phone = $('.di-phone'), island = $('.di-island'), tap = $('.di-tap'), contents = [...root.querySelectorAll('.di-c')];
  const fit = () => {
    const W = stage.clientWidth, H = stage.clientHeight, f = Math.min(1, Math.max(0.66, 0.66 + (H - 260) / 240 * 0.34));
    const s = Math.min(H * 0.92 / (580 * f), W * 0.86 / 280), top = f >= 1 ? (H - 580 * s) / 2 : H * 0.05;
    phone.style.transform = `translate(-50%, ${top}px) scale(${s})`;
  };
  const ro = new ResizeObserver(fit); ro.observe(stage); fit();

  // the shapes, and the script that walks through them
  const SHAPE = { idle: [80, 24, 12], call: [250, 72, 36], oncall: [128, 30, 15], mini: [128, 30, 15], music: [262, 158, 42], timer: [128, 30, 15] };   // compact ones leave room for the clock and battery
  const SCRIPT = [['idle', 1.3], ['call', 2.6, 'yes'], ['oncall', 2.6], ['idle', 0.9], ['mini', 1.4, 'island'], ['music', 3.4, 'island'], ['mini', 1.2], ['timer', 2.4], ['idle', 0.6]];
  const spring = (v) => ({ x: v, v: 0, to: v });
  const sp = { w: spring(80), h: spring(24), r: spring(12) };
  // each state's content sits in its own shape, centred in the island's box
  for (const c of contents) { const [w, h] = SHAPE[c.dataset.s]; Object.assign(c.style, { inset: 'auto', left: (MW - w) / 2 + 'px', top: '0px', width: w + 'px', height: h + 'px' }); }
  let state = 'idle', idx = 0, until = 0, t = 0, pausedUntil = 0, callStart = 0, timerStart = 0;
  const setState = s => {
    state = s; const [w, h, r] = SHAPE[s];
    sp.w.to = w; sp.h.to = h; sp.r.to = r;
    if (reduce) for (const k of ['w', 'h', 'r']) { sp[k].x = sp[k].to; sp[k].v = 0; }
    contents.forEach(c => c.classList.toggle('on', c.dataset.s === s));
    if (s === 'oncall') callStart = t; if (s === 'timer') timerStart = t;
  };
  // a fingertip: where the press will land, just before the state it causes
  const press = (x, y) => {
    tap.style.left = x + 'px'; tap.style.top = y + 'px';
    tap.animate([{ opacity: 0, transform: reduce ? 'none' : 'scale(.7)' }, { opacity: 1, transform: 'scale(1)', offset: .3 }, { opacity: 0, transform: reduce ? 'none' : 'scale(1.15)' }], { duration: 520, easing: 'cubic-bezier(.23,1,.32,1)' });
  };
  const clip = () => {
    const w = Math.max(10, sp.w.x), h = Math.max(10, sp.h.x), r = Math.max(4, Math.min(sp.r.x, h / 2, w / 2));
    const side = (MW - w) / 2;
    island.style.clipPath = `inset(0px ${side.toFixed(2)}px ${(MH - h).toFixed(2)}px ${side.toFixed(2)}px round ${r.toFixed(2)}px)`;
  };
  // tapping the pill opens or closes the player (and pauses the script for a while)
  const onTap = () => {
    pausedUntil = t + 6;
    setState(state === 'music' ? 'mini' : 'music');
  };
  island.addEventListener('click', onTap);

  let raf, last = performance.now();
  setState('idle'); clip(); until = SCRIPT[0][1];
  function frame(now) {
    const dt = Math.min(1 / 30, (now - last) / 1000); last = now; t += dt;
    if (t >= until && t >= pausedUntil) {
      idx = (idx + 1) % SCRIPT.length; const [s, hold, cue] = SCRIPT[idx];
      until = t + hold * PARAMS.hold;
      // the press that causes the next state lands a moment before it
      const prev = SCRIPT[(idx + SCRIPT.length - 1) % SCRIPT.length];
      // screen coordinates: the screen is 266 wide, the island box starts at x = 133 - MW / 2
      if (prev[2] === 'yes') press(133 - MW / 2 + (MW - 250) / 2 + 250 - 14 - 21, 10 + 15 + 21);
      else if (cue === 'island' && s === 'music') press(133, 10 + 15);
      setState(s);
    }
    // springs: stiffness k, damping from the bounce (bounce 0 = critical)
    const k = PARAMS.stiffness, zeta = 1 - Math.max(0, Math.min(0.8, PARAMS.bounce)), c = 2 * zeta * Math.sqrt(k);
    for (let i = 0; i < 4; i++) for (const key of ['w', 'h', 'r']) { const s = sp[key], a = k * (s.to - s.x) - c * s.v; s.v += a * dt / 4; s.x += s.v * dt / 4; }
    clip();
    if (state === 'oncall') { const e = Math.floor(t - callStart); $('.di-clock').textContent = `0:${String(e).padStart(2, '0')}`; }
    if (state === 'timer') { const left = Math.max(0, 299 - Math.floor(t - timerStart)); $('.di-count').textContent = `${Math.floor(left / 60)}:${String(left % 60).padStart(2, '0')}`; }
    $('.di-fill').style.transform = `scaleX(${(0.32 + (t % 60) / 60 * 0.05).toFixed(4)})`;
    raf = requestAnimationFrame(frame);
  }
  raf = requestAnimationFrame(frame);

  return () => { cancelAnimationFrame(raf); ro.disconnect(); island.removeEventListener('click', onTap); root.remove(); };
}
