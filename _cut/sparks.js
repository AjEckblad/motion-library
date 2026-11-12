// Grinder sparks: hot particles thrown from a spinning disc, pulled down by gravity, bouncing off the floor with most
// of their speed lost, and now and then bursting into smaller sparks. Each is drawn as a streak from where it was a
// moment ago (motion blur), and its colour follows its temperature: white, yellow, orange, then a dull red as it cools.
const PARAMS = { rate: 320, gravity: 1 };

export default function (stage) {
  const canvas = document.createElement('canvas');
  canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block';
  stage.append(canvas);
  const ctx = canvas.getContext('2d');
  let W = 0, H = 0;
  const resize = () => { const d = Math.min(devicePixelRatio, 2); W = stage.clientWidth || 1; H = stage.clientHeight || 1; canvas.width = W * d; canvas.height = H * d; ctx.setTransform(d, 0, 0, d, 0, 0); };
  const ro = new ResizeObserver(resize); ro.observe(stage); resize();

  const MAX = 2600, p = [];
  // temperature 1..0 to a blackbody-ish colour
  const heat = k => k > 0.8 ? [255, 250, 235] : k > 0.55 ? [255, 214 + (k - 0.55) * 140, 120 + (k - 0.55) * 400] : k > 0.3 ? [255, 120 + (k - 0.3) * 376, 40 + (k - 0.3) * 320] : [140 + k * 380, 30 + k * 300, 10];
  let raf, last = performance.now(), carry = 0;
  function emit(x, y, ang, speed, temp, small) {
    if (p.length >= MAX) return;
    p.push({ x, y, px: x, py: y, vx: Math.cos(ang) * speed, vy: Math.sin(ang) * speed, k: temp, life: 0, small, split: !small && Math.random() < 0.06 });
  }
  function frame(now) {
    const dt = Math.min(0.033, (now - last) / 1000); last = now;
    const t = now / 1000, S = Math.min(W, H), floor = H * 0.86, g = 900 * PARAMS.gravity * (S / 500);
    // the contact point sweeps slowly along the work piece
    const cx = W * (0.32 + Math.sin(t * 0.5) * 0.08), cy = H * 0.42 + Math.sin(t * 1.3) * H * 0.02;
    carry += PARAMS.rate * dt;
    for (; carry >= 1; carry--) {
      const a = -0.2 + (Math.random() - 0.5) * 0.55, sp = S * (1.1 + Math.random() * 1.4);   // thrown off tangentially, in a fan
      emit(cx, cy, a, sp, 0.85 + Math.random() * 0.15, false);
    }
    // a dark workshop: fade instead of clearing, so the brightest streaks leave a short glow
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = 'rgba(12,10,12,.42)'; ctx.fillRect(0, 0, W, H);
    const fl = ctx.createLinearGradient(0, floor, 0, H); fl.addColorStop(0, 'rgba(40,30,28,.5)'); fl.addColorStop(1, 'rgba(14,11,12,.5)');
    ctx.fillStyle = fl; ctx.fillRect(0, floor, W, H - floor);
    // the work piece and the grinder
    ctx.fillStyle = '#2a2a2e'; ctx.fillRect(cx - W, cy + 3, W, H * 0.05);
    ctx.save(); ctx.translate(cx + S * 0.05, cy - S * 0.07); ctx.rotate(t * 40);
    ctx.fillStyle = '#3a3a40'; ctx.beginPath(); ctx.arc(0, 0, S * 0.085, 0, 7); ctx.fill();
    ctx.strokeStyle = '#55555c'; ctx.lineWidth = 2; for (let i = 0; i < 6; i++) { ctx.rotate(1.047); ctx.beginPath(); ctx.moveTo(S * 0.02, 0); ctx.lineTo(S * 0.08, 0); ctx.stroke(); }
    ctx.restore();
    ctx.globalCompositeOperation = 'lighter';
    // the glow where the disc bites
    const gl = ctx.createRadialGradient(cx, cy, 0, cx, cy, S * 0.12); gl.addColorStop(0, 'rgba(255,220,160,.9)'); gl.addColorStop(1, 'rgba(255,120,40,0)');
    ctx.fillStyle = gl; ctx.fillRect(cx - S * 0.12, cy - S * 0.12, S * 0.24, S * 0.24);
    ctx.lineCap = 'round';
    for (let i = p.length - 1; i >= 0; i--) {
      const s = p[i];
      s.px = s.x; s.py = s.y;
      s.vy += g * dt; s.vx *= 1 - 0.5 * dt;
      s.x += s.vx * dt; s.y += s.vy * dt;
      s.life += dt; s.k -= dt * (s.small ? 1.5 : 0.75);
      if (s.y > floor) { s.y = floor; s.vy *= -0.32; s.vx *= 0.7; s.k -= 0.12; }   // the floor eats most of the energy
      if (s.split && s.life > 0.25 + Math.random() * 0.3) {                      // a burst: three or four smaller sparks
        s.split = false;
        for (let j = 0; j < 3 + (Math.random() * 2 | 0); j++) emit(s.x, s.y, Math.random() * 6.28, S * (0.25 + Math.random() * 0.4), Math.min(1, s.k + 0.2), true);
      }
      if (s.k <= 0 || s.x < -50 || s.x > W + 50) { p[i] = p[p.length - 1]; p.pop(); continue; }
      const [r, gg, b] = heat(s.k);
      ctx.strokeStyle = `rgba(${r | 0},${gg | 0},${b | 0},${Math.min(1, s.k * 1.4)})`;
      ctx.lineWidth = (s.small ? 0.9 : 1.6) * (0.6 + s.k);
      ctx.beginPath(); ctx.moveTo(s.px - s.vx * dt * 0.8, s.py - s.vy * dt * 0.8); ctx.lineTo(s.x, s.y); ctx.stroke();
      if (s.y >= floor - 1 && s.k > 0.3) { ctx.fillStyle = `rgba(255,140,60,${s.k * 0.08})`; ctx.fillRect(s.x - 6, floor, 12, 3); }   // the glow they cast on the floor
    }
    raf = requestAnimationFrame(frame);
  }
  raf = requestAnimationFrame(frame);
  return () => { cancelAnimationFrame(raf); ro.disconnect(); canvas.remove(); };
}
