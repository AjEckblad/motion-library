// Snowfall at night: three depths of flakes under a street lamp. Far flakes are tiny and slow, near ones large, soft
// and fast (parallax sells the depth). Gusts push every layer, more so the near ones, and each flake sways on its own
// phase. Flakes inside the lamp's cone light up. Near flakes that land build a drift along the ground, column by column.
const PARAMS = { flakes: 700, wind: 0.6 };

export default function (stage) {
  const canvas = document.createElement('canvas');
  canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block';
  stage.append(canvas);
  const ctx = canvas.getContext('2d');
  let W = 0, H = 0, ground = new Float32Array(1), COL = 4;
  const resize = () => {
    const d = Math.min(devicePixelRatio, 2); W = stage.clientWidth || 1; H = stage.clientHeight || 1;
    canvas.width = W * d; canvas.height = H * d; ctx.setTransform(d, 0, 0, d, 0, 0);
    ground = new Float32Array(Math.ceil(W / COL) + 2);
  };
  const ro = new ResizeObserver(resize); ro.observe(stage); resize();

  // one soft sprite per depth band, drawn once (a radial falloff reads as an out-of-focus flake)
  const sprite = (r, soft) => {
    const c = document.createElement('canvas'), s = Math.ceil(r * 2 + 4); c.width = c.height = s;
    const g = c.getContext('2d'), gr = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, r);
    gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(soft, 'rgba(240,246,255,.85)'); gr.addColorStop(1, 'rgba(230,240,255,0)');
    g.fillStyle = gr; g.beginPath(); g.arc(s / 2, s / 2, r, 0, 7); g.fill();
    return c;
  };
  const sprites = [sprite(2, .5), sprite(4, .35), sprite(9, .15)];

  const make = top => { const z = Math.random() ** 1.6; return { x: Math.random() * 1.2 - 0.1, y: top ? -0.05 - Math.random() * 0.1 : Math.random(), z, ph: Math.random() * 6.28, sw: 0.5 + Math.random() } };
  const flakes = Array.from({ length: Math.round(PARAMS.flakes) }, () => make(false));
  const lamp = { x: 0.72, top: 0.22 };
  let raf, last = performance.now();
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    const t = now / 1000, lx = lamp.x * W, ly = lamp.top * H;
    // night sky and a far ridge
    const sky = ctx.createLinearGradient(0, 0, 0, H); sky.addColorStop(0, '#0a1020'); sky.addColorStop(1, '#1f2b40');
    ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#141d2e'; ctx.beginPath(); ctx.moveTo(0, H);
    for (let x = 0; x <= W; x += 8) ctx.lineTo(x, H * 0.78 - Math.sin(x * 0.006) * H * 0.04 - Math.sin(x * 0.017 + 1) * H * 0.02);
    ctx.lineTo(W, H); ctx.fill();
    // the lamp's cone of light
    const cone = ctx.createRadialGradient(lx, ly, 0, lx, ly, H * 0.85);
    cone.addColorStop(0, 'rgba(255,214,150,.38)'); cone.addColorStop(1, 'rgba(255,190,120,0)');
    ctx.fillStyle = cone; ctx.beginPath(); ctx.moveTo(lx - 6, ly); ctx.lineTo(lx + 6, ly); ctx.lineTo(lx + H * 0.42, H); ctx.lineTo(lx - H * 0.42, H); ctx.fill();
    ctx.fillStyle = '#0b0f18'; ctx.fillRect(lx - 2.5, ly, 5, H - ly); ctx.fillRect(lx - 14, ly - 6, 28, 7);
    ctx.fillStyle = '#ffe2b0'; ctx.shadowColor = '#ffcf87'; ctx.shadowBlur = 24; ctx.fillRect(lx - 10, ly, 20, 4); ctx.shadowBlur = 0;

    const gust = Math.sin(t * 0.23) * 0.6 + Math.sin(t * 0.61 + 1) * 0.3 + Math.sin(t * 1.7) * 0.1;   // layered swells, never a loop you can spot
    const wind = PARAMS.wind * (30 + 70 * gust);
    for (const f of flakes) {
      const v = 18 + f.z * 70;
      f.x += ((wind * (0.35 + f.z) + Math.sin(t * f.sw + f.ph) * (8 + f.z * 20)) * dt) / W;
      f.y += (v * dt) / H;
      const gx = Math.min(ground.length - 1, Math.max(0, Math.round((f.x * W) / COL)));
      const floor = H - ground[gx];
      if (f.y * H >= floor - (f.z > 0.55 ? 0 : H * 0.2 * (1 - f.z))) {
        // near flakes settle into the drift; the drift's top is smoothed so it piles in soft mounds
        if (f.z > 0.55 && f.y * H >= floor && ground[gx] < H * 0.13) {
          ground[gx] += 0.35;
          if (gx > 0) ground[gx - 1] += 0.12;
          if (gx < ground.length - 1) ground[gx + 1] += 0.12;
        }
        Object.assign(f, make(true));
      }
      if (f.x > 1.12) f.x -= 1.24; else if (f.x < -0.12) f.x += 1.24;
      const x = f.x * W, y = f.y * H, band = f.z < 0.35 ? 0 : f.z < 0.75 ? 1 : 2, sp = sprites[band];
      const dx = (x - lx) / Math.max(1, y - ly), inCone = y > ly && Math.abs(dx) < 0.42 ? 1 - Math.abs(dx) / 0.42 : 0;
      ctx.globalAlpha = Math.min(1, (0.25 + f.z * 0.75) * (0.55 + inCone * 0.9));
      const s = (0.5 + f.z) * sp.width * (band === 2 ? 0.8 : 1);
      ctx.drawImage(sp, x - s / 2, y - s / 2, s, s);
    }
    ctx.globalAlpha = 1;
    // the drift, smoothed each frame so it slumps instead of stacking columns
    for (let i = 1; i < ground.length - 1; i++) ground[i] += ((ground[i - 1] + ground[i + 1]) / 2 - ground[i]) * 0.04;
    const gr = ctx.createLinearGradient(0, H - H * 0.14, 0, H); gr.addColorStop(0, '#dbe6f5'); gr.addColorStop(1, '#8796b3');
    ctx.fillStyle = gr; ctx.beginPath(); ctx.moveTo(0, H);
    for (let i = 0; i < ground.length; i++) ctx.lineTo(i * COL, H - ground[i] - 2);
    ctx.lineTo(W, H); ctx.fill();
    raf = requestAnimationFrame(frame);
  }
  raf = requestAnimationFrame(frame);
  return () => { cancelAnimationFrame(raf); ro.disconnect(); canvas.remove(); };
}
