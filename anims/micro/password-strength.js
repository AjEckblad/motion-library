// Password strength on a sign-up form: as the password is typed, a four-part meter fills segment by segment and changes
// colour, the verdict word updates, and each rule in the checklist ticks itself off the moment it is met.
// It feels right because the feedback arrives per keystroke and says exactly what is missing, so the form coaches instead of scolding.
const PARAMS = { typeSpeed: 95, meterMs: 240 };

export default function (stage) {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const W = 540, H = 380;
  const rules = [['8 or more characters', p => p.length >= 8], ['A number', p => /\d/.test(p)], ['An uppercase letter', p => /[A-Z]/.test(p)], ['A symbol', p => /[^A-Za-z0-9]/.test(p)]];
  const levels = [['Too short', '#adb5bd'], ['Weak', '#e03131'], ['Fair', '#f08c00'], ['Good', '#74b816'], ['Strong', '#2f9e44']];
  const root = document.createElement('div');
  root.className = 'pw-root';
  root.innerHTML = `<style>
    .pw-root { position: absolute; inset: 0; overflow: hidden; background: #f4f1f3; font-family: system-ui, -apple-system, "Segoe UI", sans-serif; color: #15171a; }
    .pw-scene { position: absolute; left: 0; top: 0; width: ${W}px; height: ${H}px; transform-origin: 0 0; }
    .pw-card { position: absolute; left: 100px; right: 100px; top: 22px; border-radius: 16px; background: #fff; box-shadow: 0 0 0 1px rgba(20,24,30,.06), 0 10px 30px -12px rgba(60,20,40,.18); padding: 20px 22px; }
    .pw-card h2 { margin: 0 0 14px; font-size: 18px; font-weight: 700; letter-spacing: -0.02em; }
    .pw-card label { display: block; font-size: 12px; font-weight: 600; margin-bottom: 5px; }
    .pw-in { height: 38px; border-radius: 9px; border: 1px solid #dfe2e6; padding: 0 12px; display: flex; align-items: center; font-size: 13.5px; margin-bottom: 12px; }
    .pw-in.focus { border-color: #d63c74; box-shadow: 0 0 0 3px rgba(214,60,116,.15); }
    .pw-caret { display: inline-block; width: 1.5px; height: 17px; background: #15171a; margin-left: 1px; animation: pw-blink 1s steps(1) infinite; } @keyframes pw-blink { 50% { opacity: 0; } }
    .pw-meter { display: grid; grid-template-columns: repeat(4, 1fr); gap: 5px; margin: 2px 0 7px; }
    .pw-seg { height: 5px; border-radius: 3px; background: #eceef1; overflow: hidden; } .pw-seg i { display: block; height: 100%; transform: scaleX(0); transform-origin: 0 50%; }
    .pw-verdict { font-size: 12px; color: #6b7076; margin-bottom: 12px; } .pw-verdict b { font-weight: 650; }
    .pw-rules { list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: 1fr 1fr; gap: 8px 10px; font-size: 12px; color: #6b7076; }
    .pw-rules li { display: flex; align-items: center; gap: 7px; transition: color .2s; } .pw-rules li.ok { color: #15171a; }
    .pw-dot { position: relative; width: 16px; height: 16px; flex: none; }
    .pw-dot::before { content: ''; position: absolute; inset: 0; border-radius: 50%; border: 1.5px solid #ced4da; box-sizing: border-box; }
    .pw-dot svg { position: absolute; inset: 0; opacity: 0; transform: ${reduce ? 'none' : 'scale(0.95)'}; transition: opacity .2s cubic-bezier(.23,1,.32,1), transform .2s cubic-bezier(.23,1,.32,1); }
    .ok .pw-dot svg { opacity: 1; transform: none; }
  </style><div class="pw-scene"><div class="pw-card"><h2>Create your account</h2>
    <label>Email</label><div class="pw-in">jordan@example.com</div>
    <label>Password</label><div class="pw-in focus"><span class="pw-text"></span><i class="pw-caret"></i></div>
    <div class="pw-meter">${'<div class="pw-seg"><i></i></div>'.repeat(4)}</div>
    <div class="pw-verdict">Strength: <b>Too short</b></div>
    <ul class="pw-rules">${rules.map(([t]) => `<li><span class="pw-dot"><svg viewBox="0 0 16 16"><circle cx="8" cy="8" r="8" fill="#2f9e44"/><path d="M4.8 8.3l2.2 2.2 4.2-4.6" fill="none" stroke="#fff" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg></span>${t}</li>`).join('')}</ul>
  </div></div>`;
  stage.append(root);
  const scene = root.querySelector('.pw-scene');
  const fit = () => { const w = stage.clientWidth, h = stage.clientHeight, s = Math.min(w / W, h / H, 1.3); scene.style.transform = `translate(${(w - W * s) / 2}px, ${(h - H * s) / 2}px) scale(${s})`; };
  const ro = new ResizeObserver(fit); ro.observe(stage); fit();
  const text = root.querySelector('.pw-text'), bars = [...root.querySelectorAll('.pw-seg i')], verdict = root.querySelector('.pw-verdict b'), items = [...root.querySelectorAll('.pw-rules li')];
  const anims = new Set();
  let score = 0, pw = '';
  function update() {
    text.textContent = pw;
    const met = rules.map(([, f]) => f(pw));
    met.forEach((m, i) => items[i].classList.toggle('ok', m));
    const next = pw.length < 8 ? 0 : met.filter(Boolean).length;      // nothing counts until it is long enough
    if (next === score) return;
    const [word, colour] = levels[next];
    verdict.textContent = word; verdict.style.color = colour;
    bars.forEach((b, i) => {
      const was = i < score ? 1 : 0, now = i < next ? 1 : 0;
      b.style.background = colour;
      if (was !== now) { const a = b.animate([{ transform: `scaleX(${was})` }, { transform: `scaleX(${now})` }], { duration: PARAMS.meterMs, easing: 'cubic-bezier(0.23, 1, 0.32, 1)', fill: 'forwards', delay: Math.abs(i - score) * 40 }); anims.add(a); }
    });
    score = next;
  }
  // demo: type a password in bursts, pausing as each rule is met, hold on Strong, then clear and start again
  const target = 'tidepool7K!', pauses = { 8: 700, 9: 700, 10: 700 };
  let timer = 0, i = 0;
  function tick() {
    if (i < target.length) { pw = target.slice(0, ++i); update(); timer = setTimeout(tick, PARAMS.typeSpeed + (pauses[i] || 0) + (i % 3 === 0 ? 40 : 0)); }
    else timer = setTimeout(() => { pw = ''; i = 0; update(); timer = setTimeout(tick, 900); }, 2000);
  }
  timer = setTimeout(tick, 500);
  return () => { clearTimeout(timer); anims.forEach(a => a.cancel()); ro.disconnect(); root.remove(); };
}
