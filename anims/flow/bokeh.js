// Bokeh: points of light seen through a lens that isn’t focused on them. A point off the focal plane spreads into a
// disc (the circle of confusion) whose size grows with its distance from that plane and whose shape is the aperture:
// round, or a polygon set by the number of blades. The same light spread wider is dimmer, so total brightness is kept
// by area. Each disc has a slightly brighter rim, as real lenses give. The lights drift in depth layers, near ones
// faster (parallax), while the focus slowly pulls through the scene so discs shrink to sharp points and bloom again.
const PARAMS = { blades: 6, count: 75, focus: 1 };

export default function (stage) {
  const canvas = document.createElement('canvas');
  canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block';
  stage.append(canvas);
  const ctx = canvas.getContext('2d');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let W = 0, H = 0, D = 1;
  const resize = () => { D = Math.min(devicePixelRatio, 2); W = stage.clientWidth || 1; H = stage.clientHeight || 1; canvas.width = Math.round(W * D); canvas.height = Math.round(H * D); };
  const ro = new ResizeObserver(resize); ro.observe(stage); resize();

  // one white sprite of the aperture shape, tinted per colour: flat body, brighter rim, soft anti-aliased edge
  const S = 256, blades = Math.round(PARAMS.blades);
  const shape = (c, r) => {
    c.beginPath();
    if (blades < 3) c.arc(S / 2, S / 2, r, 0, 6.2832);
    else for (let i = 0; i <= blades; i++) { const a = i / blades * 6.2832 + 0.3; i ? c.lineTo(S / 2 + Math.cos(a) * r, S / 2 + Math.sin(a) * r) : c.moveTo(S / 2 + Math.cos(a) * r, S / 2 + Math.sin(a) * r); }
  };
  const tints = ['#ffad42', '#ff6a8e', '#ffc552', '#3fd0ff', '#ff9e5e', '#ff4f6e'];
  const sprites = tints.map(col => {
    const c = document.createElement('canvas'); c.width = c.height = S; const g = c.getContext('2d');
    g.fillStyle = col;
    g.filter = 'blur(1.5px)'; g.globalAlpha = 0.5; shape(g, S * 0.46); g.fill();
    g.filter = 'blur(2px)'; g.globalAlpha = 0.95; g.lineWidth = S * 0.03; g.strokeStyle = col; shape(g, S * 0.445); g.stroke();
    // a faint brighter centre-offset sheen, like coating reflections
    g.filter = 'blur(12px)'; g.globalAlpha = 0.18; g.beginPath(); g.arc(S * 0.42, S * 0.42, S * 0.2, 0, 6.2832); g.fillStyle = '#fff'; g.fill();
    return c;
  });
  const dotSprite = (() => {
    const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d');
    const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.15, 'rgba(255,255,255,0.6)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = gr; g.fillRect(0, 0, 64, 64); return c;
  })();

  const n = Math.max(5, Math.round(PARAMS.count));
  const lights = Array.from({ length: n }, () => ({ x: Math.random(), y: Math.random(), z: Math.random(), c: Math.random() * tints.length | 0, ph: Math.random() * 6.28, f: 0.4 + Math.random() * 0.8 }));

  let raf; const t0 = performance.now();
  function frame(now) {
    const t = (now - t0) / 1000 * (reduce ? 0.08 : 1);
    ctx.setTransform(D, 0, 0, D, 0, 0);
    ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
    const bg = ctx.createLinearGradient(0, 0, W, H); bg.addColorStop(0, '#0a0712'); bg.addColorStop(1, '#04060c');
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
    ctx.globalCompositeOperation = 'lighter';
    const m = Math.min(W, H), focal = 0.5 + 0.42 * Math.sin(t * 0.22 * PARAMS.focus);   // the focus plane pulls back and forth
    // far first, so near discs layer over them
    lights.sort((a, b) => a.z - b.z);
    for (const L of lights) {
      const sp = 0.004 + L.z * 0.02;                                   // parallax: near lights drift faster
      const x = ((L.x * 1.2 + t * sp) % 1.2 - 0.1) * W, y = ((L.y * 1.2 + Math.sin(t * 0.3 + L.ph) * 0.02 - t * sp * 0.25 + 12) % 1.2 - 0.1) * H;
      const coc = Math.abs(L.z - focal);                              // circle of confusion
      const r = m * (0.005 + coc * (0.04 + L.z * 0.22));
      const tw = 0.75 + 0.25 * Math.sin(t * L.f * 2 + L.ph);
      // brightness spread over the disc: smaller discs are brighter per pixel
      const a = Math.min(1, tw * Math.pow(m * 0.06 / r, 0.5)) * (0.5 + 0.5 * L.z);
      if (r < m * 0.012) {
        ctx.globalAlpha = Math.min(1, a * 1.4); const s = r * 6;
        ctx.drawImage(dotSprite, x - s / 2, y - s / 2, s, s);
        ctx.globalAlpha = Math.min(1, a); ctx.drawImage(sprites[L.c], x - r, y - r, r * 2, r * 2);
      } else {
        ctx.globalAlpha = a; ctx.drawImage(sprites[L.c], x - r * 1.087, y - r * 1.087, r * 2.174, r * 2.174);
      }
    }
    raf = requestAnimationFrame(frame);
  }
  raf = requestAnimationFrame(frame);
  return () => { cancelAnimationFrame(raf); ro.disconnect(); canvas.remove(); };
}
