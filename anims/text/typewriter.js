// Typewriter, in a trip planner's search box: example requests type themselves with uneven keystrokes, a pause at every comma and full stop, and a caret that blinks only while idle.
// Real typing is never metronomic, so jitter and punctuation pauses make the placeholder feel like a person thinking; when the request is done it splits into filter chips, which shows what the box will do with your words.
const PARAMS = { cps: 16, jitter: 0.5 };

export default function (stage) {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const AH = 340, MINW = 400;
  const queries = [
    { text: 'A weekend in Lisbon, under €400.', chips: ['Lisbon', 'Fri – Sun', 'Under €400'] },
    { text: 'A cabin by a lake, sleeps six.', chips: ['Lakeside', 'Cabin', '6 guests'] },
    { text: 'Direct flights to Tokyo in April.', chips: ['Tokyo', 'Direct only', 'April'] },
  ];
  const icon = {
    pin: '<path d="M8 14s5-4.4 5-8.2a5 5 0 0 0-10 0C3 9.6 8 14 8 14z" fill="none" stroke="currentColor" stroke-width="1.6"/><circle cx="8" cy="5.8" r="1.7" fill="currentColor"/>',
    tag: '<path d="M2.5 2.5h5.2l6 6-5.2 5.2-6-6z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><circle cx="5.4" cy="5.4" r="1.1" fill="currentColor"/>',
    cal: '<rect x="2" y="3" width="12" height="11" rx="2" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M2 6.5h12M5.5 1.5v3M10.5 1.5v3" stroke="currentColor" stroke-width="1.6"/>',
  };
  const chipIcons = ['pin', 'cal', 'tag'];
  const root = document.createElement('div');
  root.className = 'tw-root';
  root.innerHTML = `<style>
    .tw-root { position: absolute; inset: 0; overflow: hidden; background: #e6eef8; color: #14213a; font-family: "Mona Sans", system-ui, -apple-system, sans-serif; }
    .tw-art { position: absolute; left: 0; top: 0; height: ${AH}px; transform-origin: 0 0; }
    .tw-sky { position: absolute; inset: 0; background: linear-gradient(#e6eef8 40%, #f6e9df); }
    .tw-sky svg { position: absolute; left: 0; bottom: 0; width: 100%; height: 90px; }
    .tw-nav { position: absolute; left: 28px; right: 24px; top: 18px; display: flex; align-items: center; gap: 18px; font-size: 12px; font-weight: 560; color: #44526b; }
    .tw-nav svg { width: 20px; height: 20px; margin-right: auto; }
    .tw-nav b { font-weight: 640; color: #14213a; padding: 7px 13px; border-radius: 999px; box-shadow: inset 0 0 0 1px #c3cfdf; }
    .tw-hero { position: absolute; left: 28px; right: 28px; top: 74px; display: grid; justify-items: center; text-align: center; }
    .tw-hero h2 { margin: 0; font-size: 36px; line-height: 1.05; font-weight: 760; font-stretch: 108%; letter-spacing: -0.03em; }
    .tw-hero p { margin: 8px 0 18px; font-size: 13px; color: #52607a; }
    .tw-box { width: 100%; max-width: 480px; height: 52px; box-sizing: border-box; display: flex; align-items: center; gap: 10px; padding: 0 6px 0 16px; border-radius: 16px; background: #fff; box-shadow: 0 1px 2px rgba(20,33,58,.08), 0 16px 34px -18px rgba(20,33,58,.45); text-align: left; }
    .tw-box > svg { flex: none; width: 18px; height: 18px; color: #2b6cd9; }
    .tw-line { flex: 1; min-width: 0; font-size: 15px; font-weight: 520; white-space: nowrap; overflow: hidden; }
    .tw-caret { display: inline-block; width: 2px; height: 1.15em; margin-left: 1px; vertical-align: -0.2em; border-radius: 1px; background: #2b6cd9; }
    .tw-idle .tw-caret { animation: tw-blink 1s steps(1) infinite; }
    @keyframes tw-blink { 50% { opacity: 0; } }
    .tw-go { flex: none; height: 40px; padding: 0 16px; border-radius: 11px; background: #2b6cd9; color: #fff; font-size: 13px; font-weight: 640; display: grid; place-items: center; }
    .tw-chips { display: flex; gap: 7px; margin-top: 14px; min-height: 28px; }
    .tw-chip { display: inline-flex; align-items: center; gap: 6px; height: 28px; padding: 0 11px 0 9px; border-radius: 999px; background: #fff; font-size: 12px; font-weight: 600; color: #22314d; box-shadow: 0 1px 2px rgba(20,33,58,.1); opacity: 0; }
    .tw-chip svg { width: 13px; height: 13px; color: #2b6cd9; }
  </style>
  <div class="tw-art">
    <div class="tw-sky"><svg viewBox="0 0 400 90" preserveAspectRatio="none" aria-hidden="true"><path d="M0 60 C60 40 110 70 170 52 S290 30 400 56 V90 H0z" fill="#f1d9c7"/><path d="M0 74 C80 58 150 84 230 70 S340 60 400 72 V90 H0z" fill="#ead0bd"/></svg></div>
    <div class="tw-nav"><svg viewBox="0 0 20 20" aria-hidden="true"><circle cx="10" cy="10" r="8.2" fill="none" stroke="#14213a" stroke-width="1.7"/><path d="M6 12.5l8-5-3.2 7-1.3-2.7z" fill="#2b6cd9"/></svg><span>Stays</span><span>Flights</span><span>Trips</span><b>Log in</b></div>
    <div class="tw-hero">
      <h2>Where to next?</h2>
      <p>Describe the trip in your own words. We will find the rest.</p>
      <div class="tw-box"><svg viewBox="0 0 18 18" aria-hidden="true"><circle cx="8" cy="8" r="5.6" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M12.2 12.2l3.6 3.6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg><div class="tw-line"><span class="tw-text"></span><span class="tw-caret"></span></div><span class="tw-go">Search</span></div>
      <div class="tw-chips">${'<span class="tw-chip"></span>'.repeat(3)}</div>
    </div>
  </div>`;
  stage.append(root);
  const art = root.querySelector('.tw-art'), text = root.querySelector('.tw-text'), line = root.querySelector('.tw-line');
  const chips = [...root.querySelectorAll('.tw-chip')];
  const fit = () => {
    const W = stage.clientWidth, H = stage.clientHeight, s = Math.min(H / AH, W / MINW) || 1;
    art.style.width = W / s + 'px'; art.style.top = (H - AH * s) / 2 + 'px'; art.style.transform = `scale(${s})`;
  };
  const ro = new ResizeObserver(fit); ro.observe(stage); fit();

  const easeOut = 'cubic-bezier(0.23, 1, 0.32, 1)';
  let qi = 0, timer;
  const delay = ch => {
    const base = 1000 / PARAMS.cps, j = 1 + (Math.random() * 2 - 1) * PARAMS.jitter;
    return base * j + (/[,.!?]/.test(ch) ? base * 6 : 0);
  };
  function type(i = 0) {
    const q = queries[qi], s = q.text;
    line.classList.remove('tw-idle');
    // Reduced motion: the whole request fades in at once instead of being typed.
    if (reduce && i === 0) { text.getAnimations().forEach(a => a.cancel()); text.textContent = s; text.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 400, easing: easeOut }); i = s.length + 1; }
    if (i <= s.length) { text.textContent = s.slice(0, i); timer = setTimeout(() => type(i + 1), delay(s[i - 1] || '')); return; }
    // done: the caret starts blinking and the request splits into filters, one after another
    line.classList.add('tw-idle');
    chips.forEach((c, k) => {
      c.innerHTML = `<svg viewBox="0 0 16 16" aria-hidden="true">${icon[chipIcons[k]]}</svg>${q.chips[k]}`;
      c.getAnimations().forEach(a => a.cancel());
      c.animate([{ opacity: 0, transform: reduce ? 'none' : 'translateY(6px) scale(0.95)' }, { opacity: 1, transform: 'none' }], { duration: 260, delay: 160 + k * 60, easing: easeOut, fill: 'both' });
    });
    timer = setTimeout(() => erase(s.length), reduce ? 3200 : 2200);
  }
  function erase(i) {
    line.classList.remove('tw-idle');
    if (i === queries[qi].text.length) chips.forEach(c => c.animate([{ opacity: 1, transform: 'none' }, { opacity: 0, transform: reduce ? 'none' : 'scale(0.95)' }], { duration: 160, easing: easeOut, fill: 'forwards' }));
    if (reduce && i >= 0) { text.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 220, easing: easeOut, fill: 'forwards' }); timer = setTimeout(() => erase(-1), 240); return; } // fades out instead of deleting
    if (i >= 0) { text.textContent = queries[qi].text.slice(0, i); timer = setTimeout(() => erase(i - 1), 18); return; }
    qi = (qi + 1) % queries.length; line.classList.add('tw-idle');
    timer = setTimeout(() => type(0), 600);
  }
  type(0);
  return () => { clearTimeout(timer); ro.disconnect(); root.getAnimations({ subtree: true }).forEach(a => a.cancel()); root.remove(); };
}
