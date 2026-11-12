// Pendulum wave: the hero of a sleep app's "Wind down" screen is a row of glowing pendulums. Pendulum n swings (base + n) times per cycle, so the row starts together, drifts into travelling waves and snakes, and lines up again.
// Nothing here is random: the slow, predictable drift gives the eye something to follow without asking anything of you, which is exactly what a screen meant to calm you down should do. Real pendulums would need length ∝ 1 / frequency², so the strings are drawn that way.
const PARAMS = { count: 15, cycle: 30 };

export default function (stage) {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const K = 'pdw', BG = 'radial-gradient(120% 100% at 50% 0%,#fff3e8,#f3dcc8)', SC = 'linear-gradient(180deg,#0c1029 0%,#191a45 60%,#2a2350 100%)', SBC = '#fff';
  const CSS = `.pdw-hd{position:absolute;left:20px;right:20px;top:52px;color:#fff}.pdw-hd small{font-size:11px;font-weight:650;letter-spacing:.08em;text-transform:uppercase;color:#a9a6e0}.pdw-hd b{display:block;font-size:27px;font-weight:720;letter-spacing:-.02em;margin-top:2px}
    .pdw-hero{position:absolute;left:12px;right:12px;top:112px;height:270px;border-radius:24px;background:radial-gradient(90% 70% at 50% 100%,rgba(255,180,140,.16),transparent 70%),rgba(255,255,255,.04);box-shadow:inset 0 0 0 1px rgba(255,255,255,.06);overflow:hidden}
    .pdw-hero canvas{position:absolute;inset:0;width:100%;height:100%}
    .pdw-br{position:absolute;left:0;right:0;top:396px;text-align:center;color:#fff;height:40px}.pdw-br span{position:absolute;left:0;right:0;font-size:17px;font-weight:600;transition:opacity .9s cubic-bezier(.23,1,.32,1),transform .9s cubic-bezier(.23,1,.32,1)}.pdw-br small{position:absolute;left:0;right:0;top:24px;font-size:11.5px;color:#a9a6e0}
    .pdw-ch{position:absolute;left:0;right:0;top:446px;display:flex;justify-content:center;gap:6px}.pdw-ch span{font-size:11.5px;font-weight:600;color:#d8d6f5;padding:6px 11px;border-radius:99px;background:rgba(255,255,255,.07)}.pdw-ch span.on{background:#e9e4ff;color:#1b1840}
    .pdw-go{position:absolute;left:20px;right:20px;top:490px;height:46px;border-radius:23px;background:linear-gradient(90deg,#f6b38c,#e48aa6);color:#1b1235;display:flex;align-items:center;justify-content:center;gap:8px;font-size:14.5px;font-weight:700}`;
  const HTML = `<div class="pdw-hd"><small>Tonight · 22:40</small><b>Wind down</b></div><div class="pdw-hero"><canvas></canvas></div>
    <div class="pdw-br"><span>Breathe in</span><span style="opacity:0">Breathe out</span><small>Follow the wave · lights out in 20 min</small></div>
    <div class="pdw-ch"><span class="on">Rain</span><span>Brown noise</span><span>Ocean</span></div><div class="pdw-go">▶&nbsp; Start · 10 min</div>`;
  // ── phone shell: a 280 × 580 phone drawn in CSS, scaled to fit the stage (screen is 266 × 566)
  const root = document.createElement('div');
  root.className = K + '-root';
  root.innerHTML = `<style>
    .${K}-root{position:absolute;inset:0;overflow:hidden;background:${BG};font-family:system-ui,-apple-system,"Segoe UI",sans-serif;color:#15171a;user-select:none;-webkit-user-select:none}
    .${K}-ph{position:absolute;left:50%;top:0;width:280px;height:580px;border-radius:46px;background:#0f1113;box-shadow:inset 0 0 0 1.5px #2b2f34,0 40px 80px -30px rgba(70,30,5,.45),0 12px 30px -12px rgba(70,30,5,.3);transform-origin:50% 0}
    .${K}-sc{position:absolute;inset:7px;border-radius:39px;overflow:hidden;background:${SC};isolation:isolate;touch-action:none}
    .${K}-is{position:absolute;left:50%;top:17px;width:76px;height:22px;margin-left:-38px;border-radius:12px;background:#000;z-index:30}
    .${K}-sb{position:absolute;left:0;right:0;top:0;height:44px;padding:0 26px 0 34px;display:flex;align-items:center;justify-content:space-between;font-size:13px;font-weight:650;z-index:29;pointer-events:none;color:${SBC}}
    .${K}-sb i{width:22px;height:11px;border-radius:3.5px;border:1.2px solid currentColor;box-sizing:border-box;padding:1px;opacity:.85}.${K}-sb i:after{content:"";display:block;height:100%;width:78%;background:currentColor;border-radius:1.5px}
    .${K}-f{position:absolute;left:0;top:0;width:34px;height:34px;margin:-17px 0 0 -17px;border-radius:50%;background:rgba(60,60,67,.32);box-shadow:0 0 0 1.5px rgba(255,255,255,.85),0 4px 12px rgba(0,0,0,.18);z-index:40;pointer-events:none;opacity:0;transition:opacity .2s}
    ${CSS}
  </style><div class="${K}-ph"><div class="${K}-sc"><div class="${K}-sb"><span>9:41</span><i></i></div>${HTML}<div class="${K}-f"></div></div><div class="${K}-is"></div></div>`;
  stage.append(root);
  const $ = s => root.querySelector('.' + K + '-' + s), $$ = s => [...root.querySelectorAll('.' + K + '-' + s)];
  const phone = $('ph'), scr = $('sc'), fingerEl = $('f');
  let scale = 1;
  const fit = () => { const W = stage.clientWidth, H = stage.clientHeight; scale = Math.min(H * 0.94 / 580, W * 0.9 / 280); phone.style.transform = `translate(-50%, ${(H - 580 * scale) / 2}px) scale(${scale})`; };
  const ro = new ResizeObserver(fit); ro.observe(stage); fit();
  const finger = (x, y, on, press) => { fingerEl.style.opacity = on ? 1 : 0; fingerEl.style.transform = `translate(${x}px,${y}px) scale(${press ? 0.84 : 1})`; };
  // a damped spring step (semi-implicit Euler, 4 substeps) and Apple's rubber-band curve
  const spring = (s, to, k, c, dt) => { for (let i = 0; i < 4; i++) { const h = dt / 4; s.v += (-k * (s.x - to) - c * s.v) * h; s.x += s.v * h; } };
  const rubber = (o, d, c) => o * d * c / (d + c * Math.abs(o));
  // the simulated finger: keys are [ms, x, y, state(0 hidden, 1 hover, 2 pressed), linear?]; real touches take over for 2.5 s
  const track = (keys, t) => { let i = 0; while (i < keys.length - 2 && t >= keys[i + 1][0]) i++; const a = keys[i], b = keys[i + 1]; let u = Math.min(1, Math.max(0, (t - a[0]) / ((b[0] - a[0]) || 1))); if (!a[4]) u = u < .5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2; return [a[1] + (b[1] - a[1]) * u, a[2] + (b[2] - a[2]) * u, a[3]]; };
  const U = { on: false, x: 0, y: 0, last: -1e9 };
  const toLocal = e => { const r = scr.getBoundingClientRect(); return [(e.clientX - r.left) / scale, (e.clientY - r.top) / scale]; };
  const pd = e => { U.on = true; [U.x, U.y] = toLocal(e); U.last = performance.now(); try { scr.setPointerCapture(e.pointerId); } catch (_) {} };
  const pm = e => { if (!U.on) return; [U.x, U.y] = toLocal(e); U.last = performance.now(); };
  const pu = () => { if (U.on) { U.on = false; U.last = performance.now(); } };
  scr.addEventListener('pointerdown', pd); scr.addEventListener('pointermove', pm); scr.addEventListener('pointerup', pu); scr.addEventListener('pointercancel', pu);
  const unlisten = () => { scr.removeEventListener('pointerdown', pd); scr.removeEventListener('pointermove', pm); scr.removeEventListener('pointerup', pu); scr.removeEventListener('pointercancel', pu); };
  let T0 = performance.now(), wasUser = false;
  const input = (now, keys, loop) => {
    if (now - U.last < 2500) { wasUser = true; finger(0, 0, false); return { x: U.x, y: U.y, down: U.on, t: -1, n: 0 }; }
    if (wasUser) { wasUser = false; T0 = now; }
    const t = (now - T0) % loop, [x, y, st] = track(keys, t);
    finger(x, y, st > 0, st === 2);
    return { x, y, down: st === 2, t, n: Math.floor((now - T0) / loop) };
  };
  const cv = root.querySelector('canvas'), ctx = cv.getContext('2d'), words = root.querySelectorAll('.pdw-br span');
  const W = 242, H = 270, n = Math.round(PARAMS.count), base = 16, A = 0.24;
  let raf, bw = 0, drawn = 0; const t0 = performance.now();
  function frame(now) {
    const want = Math.round(W * Math.min(devicePixelRatio, 2) * scale);
    if (want !== bw) { bw = want; cv.width = want; cv.height = Math.round(want * H / W); ctx.setTransform(want / W, 0, 0, want / W, 0, 0); }
    const t = (now - t0) / 1000, tp = reduce ? PARAMS.cycle / Math.max(1, n) : t;   // reduced motion: one still frame, the row as a single wave
    if (!reduce || drawn !== bw) {
      drawn = bw;
      ctx.clearRect(0, 0, W, H);
      const top = 22, x0 = 44, x1 = W - 44;
      ctx.fillStyle = 'rgba(233,228,255,.35)'; ctx.fillRect(x0 - 8, top - 2, x1 - x0 + 16, 2);
      for (let i = 0; i < n; i++) {
        const N = base + i;                                        // swings per cycle
        const len = (H - 70) * Math.pow(base / N, 2) + 28;         // length ∝ 1 / frequency²
        const ang = A * Math.cos(2 * Math.PI * N * tp / PARAMS.cycle);
        const ax = x0 + (x1 - x0) * (i / Math.max(1, n - 1)), bx = ax + Math.sin(ang) * len, by = top + Math.cos(ang) * len;
        ctx.strokeStyle = 'rgba(200,196,255,.22)'; ctx.lineWidth = 0.8;
        ctx.beginPath(); ctx.moveTo(ax, top); ctx.lineTo(bx, by); ctx.stroke();
        const hue = (250 + i * (125 / Math.max(1, n - 1))) % 360, r = Math.max(2.5, Math.min(6.5, (x1 - x0) / n * 0.34));
        const g = ctx.createRadialGradient(bx, by, 0, bx, by, r * 3.2);
        g.addColorStop(0, `hsla(${hue},90%,78%,.55)`); g.addColorStop(1, `hsla(${hue},90%,70%,0)`);
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(bx, by, r * 3.2, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = `hsl(${hue},85%,86%)`; ctx.beginPath(); ctx.arc(bx, by, r, 0, Math.PI * 2); ctx.fill();
      }
    }
    const inhale = Math.floor(t / 4) % 2 === 0;                  // 4 s in, 4 s out
    words[0].style.opacity = inhale ? 1 : 0; words[1].style.opacity = inhale ? 0 : 1;
    if (!reduce) { words[0].style.transform = `translateY(${inhale ? 0 : -6}px)`; words[1].style.transform = `translateY(${inhale ? 6 : 0}px)`; }   // reduced motion: the words only crossfade
    raf = requestAnimationFrame(frame);
  }
  raf = requestAnimationFrame(frame);
  return () => { cancelAnimationFrame(raf); ro.disconnect(); unlisten(); root.remove(); };
}
