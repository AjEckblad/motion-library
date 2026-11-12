// Letter rise stagger, on a concert hall's season page: each slide's composer name rises out of a clipped line, one spring per letter, 40 ms apart.
// The stagger makes the name read left to right as it lands, and a spring (not a fixed curve) gives each letter a tiny overshoot, so the word feels set by hand rather than faded in.
const PARAMS = { stagger: 40, stiffness: 220, damping: 18 };

export default function (stage) {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const AH = 340, MINW = 400;
  const slides = [
    { word: 'Mahler', work: 'Symphony No. 5 in C-sharp minor', when: 'Sat 14 March · 19:30 · Main Hall', bg: '#4a1820', ink: '#f6e7da', art: '#e8a17a' },
    { word: 'Ravel', work: 'Boléro and Daphnis et Chloé', when: 'Fri 3 April · 19:30 · Main Hall', bg: '#14233f', ink: '#e6edff', art: '#8fb0ff' },
    { word: 'Brahms', work: 'Symphony No. 4 in E minor', when: 'Thu 21 May · 20:00 · Main Hall', bg: '#1e3a2b', ink: '#eef3df', art: '#c4d687' },
  ];
  const rings = c => {
    let s = '';
    for (let i = 0; i < 9; i++) s += `<circle cx="210" cy="190" r="${44 + i * 22}" fill="none" stroke="${c}" stroke-width="${i % 3 === 0 ? 2.2 : 1}" opacity="${(0.75 - i * 0.07).toFixed(2)}"/>`;
    return `<svg viewBox="0 0 400 380" aria-hidden="true"><circle cx="210" cy="190" r="34" fill="${c}"/>${s}<path d="M210 190 L400 120" stroke="${c}" stroke-width="1" opacity=".5"/></svg>`;
  };
  const root = document.createElement('div');
  root.className = 'lr-root';
  root.innerHTML = `<style>
    .lr-root { position: absolute; inset: 0; overflow: hidden; background: ${slides[0].bg}; font-family: "Mona Sans", system-ui, -apple-system, sans-serif; }
    .lr-art { position: absolute; left: 0; top: 0; height: ${AH}px; transform-origin: 0 0; overflow: hidden; }
    .lr-bgs { position: absolute; inset: 0; z-index: 0; isolation: isolate; }
    .lr-bg { position: absolute; inset: 0; opacity: 0; }
    .lr-nav, .lr-copy, .lr-cta, .lr-dots { z-index: 1; }
    .lr-bg svg { position: absolute; right: -150px; top: -10px; width: 400px; height: 380px; }
    .lr-nav { position: absolute; left: 28px; right: 22px; top: 18px; display: flex; align-items: center; gap: 18px; font-size: 12px; font-weight: 560; color: var(--ink); }
    .lr-mark { width: 22px; height: 22px; margin-right: auto; }
    .lr-nav span { opacity: .78; }
    .lr-nav b { font-weight: 640; padding: 7px 13px; border-radius: 999px; background: var(--ink); color: var(--bg); }
    .lr-copy { position: absolute; left: 28px; top: 92px; color: var(--ink); }
    .lr-when { font-size: 12px; font-weight: 600; letter-spacing: .02em; opacity: .8; }
    .lr-line { display: flex; overflow: hidden; margin: 6px 0 4px -3px; padding: 0 3px .06em; font-size: 88px; line-height: 1; font-weight: 820; font-stretch: 112%; letter-spacing: -0.03em; }
    .lr-line span { display: block; will-change: transform; transform: translateY(110%); }
    .lr-work { font-size: 15px; font-weight: 520; opacity: .9; }
    .lr-swap { will-change: transform, opacity; }
    .lr-cta { position: absolute; left: 28px; top: 252px; display: flex; align-items: center; gap: 14px; color: var(--ink); font-size: 12.5px; }
    .lr-cta b { font-weight: 650; padding: 10px 16px; border-radius: 999px; background: var(--ink); color: var(--bg); }
    .lr-cta span { opacity: .75; }
    .lr-dots { position: absolute; left: 28px; bottom: 22px; display: flex; gap: 6px; align-items: center; color: var(--ink); font-size: 11px; font-weight: 600; font-variant-numeric: tabular-nums; }
    .lr-bar { width: 34px; height: 2px; border-radius: 2px; background: color-mix(in srgb, var(--ink) 25%, transparent); overflow: hidden; }
    .lr-bar i { display: block; height: 100%; background: var(--ink); transform-origin: 0 50%; transform: scaleX(0); }
    .lr-dots em { font-style: normal; margin-left: 8px; opacity: .75; }
  </style>
  <div class="lr-art">
    <div class="lr-bgs">${slides.map(s => `<div class="lr-bg" style="background:${s.bg}">${rings(s.art)}</div>`).join('')}</div>
    <div class="lr-nav"><svg class="lr-mark" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="12" r="4" fill="currentColor"/></svg><span>Concerts</span><span>Season 26/27</span><span>Visit</span><b>Subscribe</b></div>
    <div class="lr-copy"><div class="lr-when lr-swap"></div><div class="lr-line" aria-live="polite"></div><div class="lr-work lr-swap"></div></div>
    <div class="lr-cta"><b>Book seats</b><span>From €24 · Under 26 €8</span></div>
    <div class="lr-dots">${slides.map(() => '<span class="lr-bar"><i></i></span>').join('')}<em>01 / 03</em></div>
  </div>`;
  stage.append(root);
  const art = root.querySelector('.lr-art'), line = root.querySelector('.lr-line');
  const when = root.querySelector('.lr-when'), work = root.querySelector('.lr-work'), count = root.querySelector('.lr-dots em');
  const bgs = [...root.querySelectorAll('.lr-bg')], bars = [...root.querySelectorAll('.lr-bar i')];
  const fit = () => {
    const W = stage.clientWidth, H = stage.clientHeight, s = Math.min(H / AH, W / MINW) || 1;
    art.style.width = W / s + 'px'; art.style.top = (H - AH * s) / 2 + 'px'; art.style.transform = `scale(${s})`;
  };
  const ro = new ResizeObserver(fit); ro.observe(stage); fit();

  const easeOut = 'cubic-bezier(0.23, 1, 0.32, 1)';
  const HOLD = 2600;
  let letters = [], k = -1, raf, last = performance.now(), timers = [];
  const later = (fn, ms) => timers.push(setTimeout(fn, ms));

  function show(i) {
    const s = slides[i], prev = bgs[(i + slides.length - 1) % slides.length];
    root.style.setProperty('--ink', s.ink); root.style.setProperty('--bg', s.bg);
    // the incoming colour field settles from 104% while the old one stays underneath
    bgs.forEach(b => { b.style.zIndex = 0; });
    prev.style.zIndex = 1; bgs[i].style.zIndex = 2;
    bgs[i].animate([{ opacity: 0, transform: reduce ? 'scale(1)' : 'scale(1.04)' }, { opacity: 1, transform: 'scale(1)' }], { duration: 700, easing: easeOut, fill: 'forwards' });
    line.replaceChildren();
    letters = [...s.word].map(ch => { const el = document.createElement('span'); el.textContent = ch; line.append(el); return { el, y: 110, v: 0, target: 110 }; });
    letters.forEach((l, j) => later(() => { l.target = 0; }, j * PARAMS.stagger));
    // Reduced motion: the letters do not rise one by one; the whole word fades in.
    if (reduce) { line.getAnimations().forEach(a => a.cancel()); line.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 500, easing: easeOut }); }
    when.textContent = s.when; work.textContent = s.work; count.textContent = `0${i + 1} / 0${slides.length}`;
    [when, work].forEach(el => el.getAnimations().forEach(a => a.cancel()));
    [when, work].forEach((el, j) => el.animate([{ opacity: 0, transform: reduce ? 'none' : 'translateY(8px)' }, { opacity: 1, transform: 'none' }], { duration: 300, delay: 120 + j * 60 + letters.length * PARAMS.stagger * 0.5, easing: easeOut, fill: 'backwards' }));
    bars.forEach((b, j) => { b.getAnimations().forEach(a => a.cancel()); b.style.transform = j < i ? 'scaleX(1)' : 'scaleX(0)'; });
    const dwell = HOLD + letters.length * PARAMS.stagger;
    bars[i].animate([{ transform: 'scaleX(0)' }, { transform: 'scaleX(1)' }], { duration: dwell + 300, easing: 'linear', fill: 'forwards' });
    later(leave, dwell);
  }
  function leave() {
    // the exit is quicker than the entrance: letters leave upward with a tighter stagger
    letters.forEach((l, j) => later(() => { l.target = -115; }, j * PARAMS.stagger * 0.5));
    if (reduce) line.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 260, easing: easeOut, fill: 'forwards' });
    [when, work].forEach(el => el.animate([{ opacity: 1, transform: 'none' }, { opacity: 0, transform: reduce ? 'none' : 'translateY(-6px)' }], { duration: 200, easing: easeOut, fill: 'forwards' }));
    later(next, 300 + letters.length * PARAMS.stagger * 0.5);
  }
  function next() { k = (k + 1) % slides.length; show(k); }
  function frame(now) {
    const dt = Math.min(0.032, (now - last) / 1000); last = now;
    for (const l of letters) {
      if (reduce) { l.el.style.transform = 'none'; continue; }
      for (let s = 0; s < 3; s++) { const h = dt / 3; l.v += (-PARAMS.stiffness * (l.y - l.target) - PARAMS.damping * l.v) * h; l.y += l.v * h; }
      l.el.style.transform = `translateY(${l.y.toFixed(2)}%)`;
    }
    raf = requestAnimationFrame(frame);
  }
  next();
  raf = requestAnimationFrame(frame);
  return () => { cancelAnimationFrame(raf); timers.forEach(clearTimeout); ro.disconnect(); root.getAnimations({ subtree: true }).forEach(a => a.cancel()); root.remove(); };
}
