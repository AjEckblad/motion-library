// Guilloche spirograph: a hypotrochoid (a pen on a small circle rolling inside a big one), drawn as a ribbon
// of slightly offset lines, like the engraving on a banknote. Whole-number R and r close the loop.
const PARAMS = { R: 7, r: 4, d: 5.2, lines: 7 };

export default function (stage) {
  const canvas = document.createElement('canvas');
  canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block';
  stage.append(canvas);
  const ctx = canvas.getContext('2d');
  let W = 0, H = 0;
  const resize = () => { const d = Math.min(devicePixelRatio, 2); W = stage.clientWidth; H = stage.clientHeight; canvas.width = W * d; canvas.height = H * d; ctx.setTransform(d, 0, 0, d, 0, 0); };
  const ro = new ResizeObserver(resize); ro.observe(stage); resize();

  const gcd = (a, b) => b ? gcd(b, a % b) : a;
  const R = Math.round(PARAMS.R), r = Math.max(1, Math.min(R - 1, Math.round(PARAMS.r)));
  const turns = r / gcd(R, r);                                   // full turns until the curve closes
  const N = 2600, lines = Math.round(PARAMS.lines);
  const point = (t, d) => [(R - r) * Math.cos(t) + d * Math.cos(((R - r) / r) * t), (R - r) * Math.sin(t) - d * Math.sin(((R - r) / r) * t)];
  let raf; const t0 = performance.now(), CYCLE = 6500;
  function frame(now) {
    const ph = ((now - t0) % CYCLE) / CYCLE;
    const draw = Math.min(1, ph / 0.7), fade = ph > 0.85 ? 1 - (ph - 0.85) / 0.15 : 1;
    const ease = 1 - Math.pow(1 - draw, 2.2);
    ctx.fillStyle = '#0c0d0b'; ctx.fillRect(0, 0, W, H);
    const scale = (Math.min(W, H) * 0.44) / (R - r + PARAMS.d + lines * 0.12);
    ctx.save(); ctx.translate(W / 2, H / 2); ctx.rotate(now / 9000);
    ctx.globalAlpha = fade; ctx.lineWidth = 1;
    const upto = Math.floor(N * ease);
    for (let l = 0; l < lines; l++) {
      const d = PARAMS.d + (l - (lines - 1) / 2) * 0.12;
      ctx.strokeStyle = l % 2 ? '#eef79a' : '#b5d44a';
      ctx.beginPath();
      for (let i = 0; i <= upto; i++) { const [x, y] = point((i / N) * Math.PI * 2 * turns, d); i ? ctx.lineTo(x * scale, y * scale) : ctx.moveTo(x * scale, y * scale); }
      ctx.stroke();
    }
    if (draw < 1) { const [x, y] = point((upto / N) * Math.PI * 2 * turns, PARAMS.d); ctx.fillStyle = '#ff7a3d'; ctx.beginPath(); ctx.arc(x * scale, y * scale, 4, 0, 7); ctx.fill(); }
    ctx.restore();
    raf = requestAnimationFrame(frame);
  }
  raf = requestAnimationFrame(frame);
  return () => { cancelAnimationFrame(raf); ro.disconnect(); canvas.remove(); };
}
