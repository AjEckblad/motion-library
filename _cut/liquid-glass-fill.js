// Liquid in a glass: the surface is a row of springs (a 1D wave equation). Tilting the glass pushes the
// surface and the wave sloshes back and forth; bubbles rise and the fill level breathes up and down.
const PARAMS = { slosh: 1, fill: 0.6 };

export default function (stage) {
  const canvas = document.createElement('canvas');
  canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block';
  stage.append(canvas);
  const ctx = canvas.getContext('2d');
  let W = 0, H = 0;
  const resize = () => { const d = Math.min(devicePixelRatio, 2); W = stage.clientWidth; H = stage.clientHeight; canvas.width = W * d; canvas.height = H * d; ctx.setTransform(d, 0, 0, d, 0, 0); };
  const ro = new ResizeObserver(resize); ro.observe(stage); resize();
  const N = 48, hgt = new Float32Array(N), vel = new Float32Array(N);
  let bubbles = [], tiltV = 0, prevTilt = 0, last = performance.now(), raf;
  function frame(now) {
    const dt = Math.min(0.033, (now - last) / 1000); last = now; const t = now / 1000;
    const tilt = Math.sin(t * 1.3) * 0.22 * PARAMS.slosh * (Math.sin(t * 0.31) > 0 ? 1 : 0.3);
    const tiltAcc = (tilt - prevTilt) / dt - tiltV; tiltV = (tilt - prevTilt) / dt; prevTilt = tilt;
    // springs: each column pulled to rest and to its neighbours; tilting acceleration shoves the water sideways
    for (let s = 0; s < 4; s++) {
      const h = dt / 4;
      for (let i = 0; i < N; i++) { const l = hgt[Math.max(0, i - 1)], r = hgt[Math.min(N - 1, i + 1)]; vel[i] += ((l + r - 2 * hgt[i]) * 900 - hgt[i] * 6 - vel[i] * 1.6 + (i / (N - 1) - 0.5) * tiltAcc * 14) * h; }
      for (let i = 0; i < N; i++) hgt[i] += vel[i] * h;
    }
    const S = Math.min(W, H), gw = S * 0.42, gh = S * 0.62, cx = W / 2, base = H * 0.85;
    const level = PARAMS.fill * (0.85 + 0.15 * Math.sin(t * 0.4));
    ctx.fillStyle = '#e9eef3'; ctx.fillRect(0, 0, W, H);
    ctx.save(); ctx.translate(cx, base); ctx.rotate(tilt);
    // glass: slightly tapered tumbler
    const glass = new Path2D(); glass.moveTo(-gw / 2, -gh); glass.lineTo(gw / 2, -gh); glass.lineTo(gw * 0.42, 0); glass.lineTo(-gw * 0.42, 0); glass.closePath();
    ctx.fillStyle = 'rgba(210, 225, 238, .35)'; ctx.fill(glass);
    ctx.save(); ctx.clip(glass);
    const top = -gh * level;
    ctx.beginPath(); ctx.moveTo(-gw, 4);
    for (let i = 0; i < N; i++) { const x = -gw / 2 + (gw * i) / (N - 1), y = top + hgt[i] - Math.sin(-tilt) * x * 0.95; ctx.lineTo(x, y); }   // the surface stays level as the glass tilts
    ctx.lineTo(gw, 4); ctx.closePath();
    const juice = ctx.createLinearGradient(0, top, 0, 0); juice.addColorStop(0, '#ffb347'); juice.addColorStop(1, '#f2711c');
    ctx.fillStyle = juice; ctx.fill();
    ctx.strokeStyle = 'rgba(255,240,200,.9)'; ctx.lineWidth = 2; ctx.stroke();
    if (Math.random() < dt * 18) bubbles.push({ x: (Math.random() - 0.5) * gw * 0.7, y: -4, r: 1 + Math.random() * 3, v: 30 + Math.random() * 40 });
    ctx.fillStyle = 'rgba(255, 245, 220, .7)';
    for (const b of bubbles) { b.y -= b.v * dt; b.x += Math.sin(b.y * 0.1) * 0.2; ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, 7); ctx.fill(); }
    bubbles = bubbles.filter(b => b.y > top + 6);
    ctx.restore();
    ctx.strokeStyle = 'rgba(120, 140, 160, .6)'; ctx.lineWidth = 3; ctx.stroke(glass);
    ctx.fillStyle = 'rgba(255,255,255,.55)'; ctx.fillRect(-gw * 0.36, -gh * 0.92, gw * 0.05, gh * 0.8);   // highlight
    ctx.restore();
    ctx.fillStyle = 'rgba(40, 50, 60, .1)'; ctx.beginPath(); ctx.ellipse(cx, base + 6, gw * 0.5, 8, 0, 0, 7); ctx.fill();
    raf = requestAnimationFrame(frame);
  }
  raf = requestAnimationFrame(frame);
  return () => { cancelAnimationFrame(raf); ro.disconnect(); canvas.remove(); };
}
