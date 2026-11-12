// Harmonograph: the Victorian drawing machine. Two pendulums move the pen left-right and up-down, and a third swings
// the paper; each is a decaying sine. When their frequencies sit near a simple ratio (2:3, 3:4, 1:2) the pen traces
// a slowly precessing rosette, and the tiny detuning is what makes the loops creep round. As the swing dies down the
// figure spirals into the centre; then the paper is changed and a new ratio is drawn.
const PARAMS = { speed: 1, decay: 0.6 };

export default function (stage) {
  const canvas = document.createElement('canvas');
  canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block';
  stage.append(canvas);
  const ctx = canvas.getContext('2d');
  const paper = document.createElement('canvas'), pctx = paper.getContext('2d');
  let W = 0, H = 0, d = 1;
  const resize = () => { d = Math.min(devicePixelRatio, 2); W = stage.clientWidth || 1; H = stage.clientHeight || 1; canvas.width = paper.width = W * d; canvas.height = paper.height = H * d; ctx.setTransform(d, 0, 0, d, 0, 0); pctx.setTransform(d, 0, 0, d, 0, 0); fresh(); };
  const RATIOS = [[2, 3], [3, 4], [1, 2], [3, 5], [4, 5], [1, 3], [2, 5]];
  const INKS = ['#7fb4ff', '#ff7aa8', '#6fe3c0', '#c3a4ff', '#ffb36b'];   // light inks on dark stock
  let pend, time = 0, prev = null, ink, nth = 0;
  function fresh() {
    const [p, q] = RATIOS[nth % RATIOS.length], base = 1.6, det = () => (Math.random() - 0.5) * 0.012;
    pend = [
      { f: base * p + det(), ph: Math.random() * 6.28, a: 1 },                          // pen x
      { f: base * q + det(), ph: Math.random() * 6.28, a: 1 },                          // pen y
      { f: base * p + det() * 2, ph: Math.random() * 6.28, a: 0.35 + Math.random() * 0.2 },   // paper x
      { f: base * q + det() * 2, ph: Math.random() * 6.28, a: 0.35 + Math.random() * 0.2 },   // paper y
    ];
    ink = INKS[nth % INKS.length]; nth++; time = 0; prev = null;
    pctx.fillStyle = '#0e0d12'; pctx.fillRect(0, 0, W, H);
    for (let i = 0; i < 600; i++) { pctx.fillStyle = `rgba(200,190,230,${Math.random() * 0.05})`; pctx.fillRect(Math.random() * W, Math.random() * H, 1, 1); }   // paper grain
  }
  const ro = new ResizeObserver(resize); ro.observe(stage); resize();
  const pos = t => {
    const k = 0.01 + 0.05 * PARAMS.decay, e = Math.exp(-k * t), S = Math.min(W, H) * 0.42;
    const [a, b, c, dd] = pend;
    return [W / 2 + S * e * (a.a * Math.sin(a.f * t + a.ph) + c.a * Math.sin(c.f * t + c.ph)) / 1.5, H / 2 + S * e * (b.a * Math.sin(b.f * t + b.ph) + dd.a * Math.sin(dd.f * t + dd.ph)) / 1.5, e];
  };
  let raf, last = performance.now(), hold = 0;
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    if (hold > 0) { hold -= dt; if (hold <= 0) fresh(); }
    else {
      // many small sub-steps per frame keep the curve smooth
      const steps = 80, h = dt * PARAMS.speed * 5 / steps;
      pctx.strokeStyle = ink; pctx.lineCap = 'round'; pctx.lineJoin = 'round';
      for (let i = 0; i < steps; i++) {
        time += h; const [x, y, e] = pos(time);
        if (prev) { pctx.globalAlpha = 0.55 + 0.4 * e; pctx.lineWidth = 0.55 + 0.5 * e; pctx.beginPath(); pctx.moveTo(prev[0], prev[1]); pctx.lineTo(x, y); pctx.stroke(); }
        prev = [x, y];
        if (e < 0.04) { hold = 1.6; break; }                               // the swing has died: admire it, then change the paper
      }
      pctx.globalAlpha = 1;
    }
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.drawImage(paper, 0, 0); ctx.setTransform(d, 0, 0, d, 0, 0);
    if (prev && hold <= 0) {                                              // the pen nib
      ctx.fillStyle = ink; ctx.beginPath(); ctx.arc(prev[0], prev[1], 3, 0, 7); ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,.18)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(prev[0], prev[1]); ctx.lineTo(prev[0] + 40, prev[1] - 60); ctx.stroke();
    }
    raf = requestAnimationFrame(frame);
  }
  raf = requestAnimationFrame(frame);
  return () => { cancelAnimationFrame(raf); ro.disconnect(); canvas.remove(); };
}
