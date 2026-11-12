// Rotating word, in a shared calendar's landing-page hero: one word of the headline cycles through who the product is for, sliding up through a clipped line with a touch of blur, and the calendar beside it changes to match.
// Only the word that changes moves, so the sentence stays readable; the clip hides the handover, and a few pixels of blur turn two words passing each other into one soft motion. The word sits at the end of a left-aligned line, so nothing else on the line has to shift.
const PARAMS = { hold: 2200, duration: 480, blur: 6 };

export default function (stage) {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const AH = 340, MINW = 400;
  const sets = [
    { word: 'families', ev: [['Mon', '08:15', 'School run', '#ffb86b'], ['Tue', '17:30', 'Swimming lessons', '#7cc4ff'], ['Thu', '10:00', 'Dentist, both kids', '#ff8fa3'], ['Sun', '13:00', 'Lunch at Gran\'s', '#a3e08f']] },
    { word: 'flatmates', ev: [['Mon', '07:00', 'Bins out', '#a3e08f'], ['Wed', 'All day', 'Rent due', '#ff8fa3'], ['Thu', '18:30', 'Room viewing', '#7cc4ff'], ['Fri', '20:00', 'Quiz night', '#ffb86b']] },
    { word: 'clubs', ev: [['Tue', '19:00', 'Training, pitch 2', '#7cc4ff'], ['Thu', '19:00', 'Training, pitch 2', '#7cc4ff'], ['Fri', '17:00', 'Kit wash rota', '#a3e08f'], ['Sat', '14:00', 'Away game', '#ffb86b']] },
    { word: 'teams', ev: [['Mon', '09:30', 'Stand-up', '#a3e08f'], ['Tue', '14:00', 'Design review', '#ff8fa3'], ['Wed', '11:00', '1:1 with Ali', '#7cc4ff'], ['Fri', '16:00', 'Sprint demo', '#ffb86b']] },
  ];
  const root = document.createElement('div');
  root.className = 'rw-root';
  root.innerHTML = `<style>
    .rw-root { position: absolute; inset: 0; overflow: hidden; background: #f3f1ff; color: #1d1a45; font-family: "Mona Sans", system-ui, -apple-system, sans-serif; }
    .rw-art { position: absolute; left: 0; top: 0; height: ${AH}px; transform-origin: 0 0; }
    .rw-nav { position: absolute; left: 28px; right: 24px; top: 18px; display: flex; align-items: center; gap: 16px; font-size: 12px; font-weight: 560; color: #4c4880; }
    .rw-nav svg { width: 22px; height: 22px; margin-right: auto; }
    .rw-nav b { font-weight: 640; color: #fff; background: #5b3df5; padding: 7px 13px; border-radius: 999px; }
    .rw-left { position: absolute; left: 28px; top: 76px; }
    .rw-badge { display: inline-flex; gap: 6px; align-items: center; padding: 5px 10px; border-radius: 999px; background: #fff; font-size: 11px; font-weight: 600; color: #4c4880; box-shadow: 0 1px 2px rgba(29,26,69,.08); }
    .rw-badge i { width: 6px; height: 6px; border-radius: 50%; background: #5b3df5; }
    .rw-h { margin: 14px 0 12px; font-weight: 760; font-stretch: 106%; letter-spacing: -0.035em; line-height: 1.04; }
    .rw-l2 { display: flex; white-space: pre; }
    .rw-slot { position: relative; overflow: hidden; padding: 0 .08em .14em 0; margin-bottom: -.14em; }
    .rw-w { position: absolute; left: 0; top: 0; color: #5b3df5; will-change: transform, opacity, filter; }
    .rw-under { position: absolute; left: 0; bottom: .02em; height: .2em; width: 100%; }
    .rw-sub { width: 230px; font-size: 13px; line-height: 1.45; color: #57538a; }
    .rw-cta { margin-top: 16px; display: flex; gap: 8px; font-size: 12px; font-weight: 640; }
    .rw-cta span { padding: 9px 14px; border-radius: 999px; background: #1d1a45; color: #fff; }
    .rw-cta span + span { background: #fff; color: #1d1a45; box-shadow: 0 1px 2px rgba(29,26,69,.1); }
    .rw-cal { position: absolute; right: 22px; top: 78px; width: 36%; max-width: 210px; min-width: 140px; padding: 10px; border-radius: 14px; background: #fff; box-shadow: 0 1px 2px rgba(29,26,69,.06), 0 20px 40px -22px rgba(45,30,140,.45); box-sizing: border-box; }
    .rw-cal header { display: flex; justify-content: space-between; font-size: 11px; font-weight: 650; margin-bottom: 8px; }
    .rw-cal header span { color: #8a86b3; font-weight: 560; }
    .rw-grid { position: relative; height: 196px; }
    .rw-ev { position: absolute; left: 0; right: 0; height: 42px; display: grid; grid-template-columns: 34px 1fr; align-items: center; gap: 6px; padding: 0 8px 0 0; border-radius: 9px; box-sizing: border-box; font-size: 10.5px; line-height: 1.2; }
    .rw-ev small { display: grid; place-items: center; height: 100%; border-radius: 9px 0 0 9px; font-size: 9px; font-weight: 700; color: #1d1a45; }
    .rw-ev b { display: block; font-weight: 650; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .rw-ev span { color: #6f6b9c; font-size: 9.5px; }
    .rw-ev div { min-width: 0; }
  </style>
  <div class="rw-art">
    <div class="rw-nav"><svg viewBox="0 0 22 22" aria-hidden="true"><rect x="2.5" y="4" width="17" height="15" rx="4" fill="none" stroke="#1d1a45" stroke-width="1.8"/><path d="M2.5 9h17" stroke="#1d1a45" stroke-width="1.8"/><circle cx="14.5" cy="14" r="2" fill="#5b3df5"/></svg><span>Product</span><span>Pricing</span><span>Sign in</span><b>Get started</b></div>
    <div class="rw-left">
      <span class="rw-badge"><i></i>New: shared availability</span>
      <div class="rw-h"><div>One calendar</div><div class="rw-l2">for <span class="rw-slot"><span class="rw-sizer"></span><svg class="rw-under" viewBox="0 0 100 10" preserveAspectRatio="none" aria-hidden="true"><path d="M2 7 C 30 3, 60 2, 98 5" fill="none" stroke="#5b3df5" stroke-opacity=".35" stroke-width="3" stroke-linecap="round"/></svg></span></div></div>
      <div class="rw-sub">See who is free, book the dentist, plan the trip. Everyone sees the same week.</div>
      <div class="rw-cta"><span>Start free</span><span>See how it works</span></div>
    </div>
    <div class="rw-cal"><header>This week<span>9 – 15 Mar</span></header><div class="rw-grid"></div></div>
  </div>`;
  stage.append(root);
  const art = root.querySelector('.rw-art'), head = root.querySelector('.rw-h'), slot = root.querySelector('.rw-slot');
  const sizer = root.querySelector('.rw-sizer'), under = root.querySelector('.rw-under'), grid = root.querySelector('.rw-grid');
  const words = sets.map(s => { const w = document.createElement('span'); w.className = 'rw-w'; w.textContent = s.word + '.'; w.style.opacity = 0; slot.append(w); return w; });
  const fit = () => {
    const W = stage.clientWidth, H = stage.clientHeight, s = Math.min(H / AH, W / MINW) || 1, aw = W / s;
    art.style.width = aw + 'px'; art.style.top = (H - AH * s) / 2 + 'px'; art.style.transform = `scale(${s})`;
    // the headline is sized so the longest word still fits beside the calendar
    const col = aw - 28 - Math.max(140, Math.min(210, aw * 0.36)) - 22 - 18;
    head.style.fontSize = Math.min(42, col / 6.4).toFixed(1) + 'px';
  };
  const ro = new ResizeObserver(fit); ro.observe(stage); fit();

  const easeOut = 'cubic-bezier(0.23, 1, 0.32, 1)';
  const paintCal = (s, animate) => {
    const old = [...grid.children];
    old.forEach(e => e.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 160, easing: easeOut, fill: 'forwards' }).onfinish = () => e.remove());
    s.ev.forEach(([day, time, label, c], i) => {
      const e = document.createElement('div'); e.className = 'rw-ev';
      e.innerHTML = `<small style="background:${c}">${day}</small><div><b>${label}</b><span>${time}</span></div>`;
      e.style.cssText = `top:${i * 49}px;background:color-mix(in srgb, ${c} 22%, #fff)`;
      grid.append(e);
      if (animate) e.animate([{ opacity: 0, transform: reduce ? 'none' : 'translateY(6px) scale(0.97)' }, { opacity: 1, transform: 'none' }], { duration: 260, delay: 60 + i * 50, easing: easeOut, fill: 'backwards' });
    });
  };
  let k = 0, timer;
  const B = () => `blur(${PARAMS.blur}px)`;
  function show(i, first) {
    const w = words[i], s = sets[i];
    sizer.textContent = s.word + '.';
    sizer.style.visibility = 'hidden';
    w.getAnimations().forEach(a => a.cancel());
    if (first) { w.style.opacity = 1; paintCal(s, false); }
    else {
      w.style.opacity = 1;
      w.animate([{ transform: reduce ? 'none' : 'translateY(70%)', opacity: 0, filter: B() }, { transform: 'none', opacity: 1, filter: 'blur(0)' }], { duration: PARAMS.duration, delay: 60, easing: easeOut, fill: 'backwards' });
      // the underline wipes in under the new word once it has landed
      under.animate(reduce ? [{ opacity: 0 }, { opacity: 1 }] : [{ clipPath: 'inset(0 100% 0 0)' }, { clipPath: 'inset(0 0 0 0)' }], { duration: 420, delay: 60 + PARAMS.duration * 0.6, easing: easeOut, fill: 'backwards' });
      paintCal(s, true);
    }
    timer = setTimeout(() => {
      // leaving: up and out of the clip, a little faster than the arrival
      w.animate([{ transform: 'none', opacity: 1, filter: 'blur(0)' }, { transform: reduce ? 'none' : 'translateY(-70%)', opacity: 0, filter: B() }], { duration: PARAMS.duration * 0.75, easing: easeOut, fill: 'forwards' });
      k = (k + 1) % sets.length; show(k, false);
    }, PARAMS.hold + PARAMS.duration);
  }
  show(0, true);
  return () => { clearTimeout(timer); ro.disconnect(); root.getAnimations({ subtree: true }).forEach(a => a.cancel()); root.remove(); };
}
