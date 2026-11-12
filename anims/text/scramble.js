// Scramble decode, on a launch page for encrypted file sharing: each character cycles through random glyphs until its turn, then locks, left to right.
// Decoding is the product's own story told in type, and locking in reading order keeps the line legible the whole time; a monospaced face means nothing shifts while it churns.
const PARAMS = { speed: 34, settle: 3 };

export default function (stage) {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const AH = 340, MINW = 400;
  const phrases = [
    { lines: ['Encrypted', 'by default.'], file: 'board-deck-q3.pdf', size: '2.4 MB' },
    { lines: ['Your keys,', 'your device.'], file: 'contract-final.docx', size: '318 KB' },
    { lines: ['Links that', 'expire.'], file: 'site-photos.zip', size: '86 MB' },
  ];
  const glyphs = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#%&*+=<>/';
  const hex = '0123456789ABCDEF';
  const root = document.createElement('div');
  root.className = 'sc-root';
  root.innerHTML = `<style>
    .sc-root { position: absolute; inset: 0; overflow: hidden; background: #0f1218; color: #eef1f5; font-family: "Mona Sans", system-ui, -apple-system, sans-serif; }
    .sc-art { position: absolute; left: 0; top: 0; height: ${AH}px; transform-origin: 0 0; background: radial-gradient(420px 260px at 85% 40%, #1d2433 0%, transparent 70%); }
    .sc-nav { position: absolute; left: 28px; right: 24px; top: 18px; display: flex; align-items: center; gap: 18px; font-size: 12px; font-weight: 540; color: #aab3c0; }
    .sc-nav svg { width: 20px; height: 20px; margin-right: auto; }
    .sc-nav b { color: #0f1218; background: #eef1f5; padding: 7px 13px; border-radius: 999px; font-weight: 640; }
    .sc-left { position: absolute; left: 28px; top: 74px; }
    .sc-pill { display: inline-flex; gap: 7px; align-items: center; padding: 5px 10px 5px 6px; border-radius: 999px; background: #1b2130; font-size: 11px; font-weight: 600; color: #cfd6df; }
    .sc-pill i { font-style: normal; padding: 2px 6px; border-radius: 999px; background: #ffb85c; color: #241a08; font-size: 10px; font-weight: 700; }
    .sc-h { margin: 14px 0 12px; font: 600 34px/1.12 ui-monospace, "SF Mono", Menlo, monospace; letter-spacing: -0.02em; white-space: pre; }
    .sc-h b, .sc-fp b { color: #ffb85c; font-weight: inherit; }
    .sc-sub { width: 250px; font-size: 13px; line-height: 1.45; color: #9aa4b2; }
    .sc-cta { margin-top: 18px; display: flex; gap: 10px; font-size: 12px; font-weight: 640; }
    .sc-cta span { padding: 9px 15px; border-radius: 999px; background: #ffb85c; color: #241a08; }
    .sc-cta span + span { background: none; color: #cfd6df; box-shadow: inset 0 0 0 1px #2c3445; }
    .sc-card { position: absolute; right: 24px; top: 88px; width: 32%; max-width: 186px; min-width: 128px; padding: 12px; border-radius: 12px; background: #171c26; box-shadow: inset 0 0 0 1px #262e3d, 0 18px 40px -16px #000; font-size: 11px; }
    .sc-file { display: flex; gap: 9px; align-items: center; }
    .sc-file svg { flex: none; width: 24px; height: 28px; }
    .sc-file b { display: block; font-weight: 620; font-size: 11.5px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .sc-file span { color: #8791a0; }
    .sc-file div { min-width: 0; }
    .sc-lbl { margin: 12px 0 5px; padding-top: 10px; border-top: 1px solid #262e3d; color: #8791a0; font-size: 10px; font-weight: 600; letter-spacing: .06em; text-transform: uppercase; }
    .sc-fp { font: 500 11.5px/1.5 ui-monospace, "SF Mono", Menlo, monospace; color: #dfe5ec; white-space: pre; }
    .sc-state { margin-top: 10px; display: flex; align-items: center; gap: 6px; font-weight: 600; color: #8791a0; }
    .sc-state svg { width: 13px; height: 13px; }
    .sc-state.on { color: #ffb85c; }
    .sc-shack { transform-origin: 9px 9px; transition: transform .22s cubic-bezier(0.23, 1, 0.32, 1); }
    .sc-state:not(.on) .sc-shack { transform: translateY(-2px); }
  </style>
  <div class="sc-art">
    <div class="sc-nav"><svg viewBox="0 0 20 20" aria-hidden="true"><path d="M10 1.5l7 2.6v5.2c0 4.3-3 7.6-7 9.2-4-1.6-7-4.9-7-9.2V4.1z" fill="none" stroke="#eef1f5" stroke-width="1.7"/><path d="M7 10l2 2 4-4.2" fill="none" stroke="#ffb85c" stroke-width="1.8" stroke-linecap="round"/></svg><span>Product</span><span>Security</span><span>Pricing</span><b>Sign in</b></div>
    <div class="sc-left">
      <span class="sc-pill"><i>New</i>End-to-end sharing is live</span>
      <div class="sc-h" aria-live="polite"></div>
      <div class="sc-sub">Files are sealed on your device before they leave it. We never hold the keys.</div>
      <div class="sc-cta"><span>Start sharing</span><span>Read the audit</span></div>
    </div>
    <div class="sc-card">
      <div class="sc-file"><svg viewBox="0 0 24 28" aria-hidden="true"><path d="M3 1h12l6 6v19a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1z" fill="#252d3c"/><path d="M15 1v6h6" fill="#3a4559"/><rect x="6" y="15" width="12" height="2" rx="1" fill="#55627a"/><rect x="6" y="19" width="8" height="2" rx="1" fill="#55627a"/></svg><div><b class="sc-name"></b><span class="sc-size"></span></div></div>
      <div class="sc-lbl">Key fingerprint</div>
      <div class="sc-fp"></div>
      <div class="sc-state"><svg viewBox="0 0 18 18" aria-hidden="true"><path class="sc-shack" d="M5.5 8V6a3.5 3.5 0 0 1 7 0v2" fill="none" stroke="currentColor" stroke-width="1.8"/><rect x="3.5" y="8" width="11" height="8" rx="2" fill="currentColor"/></svg><span>Sealing on this device</span></div>
    </div>
  </div>`;
  stage.append(root);
  const art = root.querySelector('.sc-art'), head = root.querySelector('.sc-h'), fp = root.querySelector('.sc-fp');
  const state = root.querySelector('.sc-state'), name = root.querySelector('.sc-name'), size = root.querySelector('.sc-size');
  const fit = () => {
    const W = stage.clientWidth, H = stage.clientHeight, s = Math.min(H / AH, W / MINW) || 1;
    art.style.width = W / s + 'px'; art.style.top = (H - AH * s) / 2 + 'px'; art.style.transform = `scale(${s})`;
  };
  const ro = new ResizeObserver(fit); ro.observe(stage); fit();

  const rnd = set => set[Math.floor(Math.random() * set.length)];
  const newKey = () => Array.from({ length: 2 }, () => Array.from({ length: 3 }, () => Array.from({ length: 4 }, () => rnd(hex)).join('')).join(' ')).join('\n');
  // locks characters in reading order: everything before `step / settle` is final, the rest churns
  const render = (target, step, settle, set) => {
    let html = '', done = true, n = 0;
    for (const ch of target) {
      if (ch === ' ' || ch === '\n') { html += ch; continue; }
      n++;
      if (step >= n * settle) html += ch;
      else { done = false; html += `<b>${rnd(set)}</b>`; }
    }
    return { html, done };
  };
  let p = 0, step = 0, pause = 0, key = newKey(), timer;
  const load = () => { const ph = phrases[p]; name.textContent = ph.file; size.textContent = ph.size + ' · expires in 7 days'; key = newKey(); state.classList.remove('on'); state.lastChild.textContent = 'Sealing on this device'; };
  load();
  timer = setInterval(() => {
    if (pause > 0) { pause--; if (pause === 0) { p = (p + 1) % phrases.length; step = 0; load(); } return; }
    step++;
    const h = render(phrases[p].lines.join('\n'), step, PARAMS.settle, glyphs);
    const f = render(key, step, Math.max(1, PARAMS.settle * 0.75), hex);
    // Reduced motion: no churning glyphs; the finished phrase and key fade in on the first tick, timing unchanged.
    if (!reduce) { head.innerHTML = h.html; fp.innerHTML = f.html; }
    else if (step === 1) { head.textContent = phrases[p].lines.join('\n'); fp.textContent = key; [head, fp].forEach(el => el.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 360, easing: 'ease-out' })); }
    if (f.done && !state.classList.contains('on')) { state.classList.add('on'); state.lastChild.textContent = 'Sealed · only you hold the key'; }
    if (h.done && f.done) pause = Math.round(2200 / PARAMS.speed);
  }, PARAMS.speed);
  return () => { clearInterval(timer); ro.disconnect(); root.remove(); };
}
