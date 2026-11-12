// Diffusion-limited aggregation: particles wander at random until they touch the crystal, then stick where they hit.
// Tips stick out further into the wandering particles than the hollows between them, so they catch more and grow
// faster: that feedback is what grows the branching, coral-like fractal. Walkers start on a circle just outside the
// crystal and are dropped if they stray too far. Colour follows the order things stuck, so you can read its growth.
const PARAMS = { speed: 1, stickiness: 1 };

export default function (stage) {
  const canvas = document.createElement('canvas');
  canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block;image-rendering:auto';
  stage.append(canvas);
  const ctx = canvas.getContext('2d');
  let W = 0, H = 0, GW = 0, GH = 0, grid, img, ictx, idata, cx, cy, rmax, count;
  const CELL = 2;
  const reset = () => {
    GW = Math.max(16, Math.ceil(W / CELL)); GH = Math.max(16, Math.ceil(H / CELL));
    grid = new Uint8Array(GW * GH); img = document.createElement('canvas'); img.width = GW; img.height = GH;
    ictx = img.getContext('2d'); idata = ictx.createImageData(GW, GH);
    for (let i = 0; i < GW * GH; i++) { idata.data[i * 4] = 8; idata.data[i * 4 + 1] = 10; idata.data[i * 4 + 2] = 20; idata.data[i * 4 + 3] = 255; }
    cx = GW >> 1; cy = GH >> 1; rmax = 2; count = 0; stick(cx, cy);
  };
  const resize = () => { const d = Math.min(devicePixelRatio, 2); W = stage.clientWidth || 1; H = stage.clientHeight || 1; canvas.width = W * d; canvas.height = H * d; ctx.setTransform(d, 0, 0, d, 0, 0); reset(); };
  // colour along the growth: deep blue at the seed through cyan to a pale ice at the tips
  const hue = k => { const s = Math.min(1, k); return [40 + 160 * s ** 1.5, 90 + 150 * s, 200 + 55 * s]; };
  function stick(x, y) {
    grid[y * GW + x] = 1; count++;
    const r = Math.hypot(x - cx, y - cy); rmax = Math.max(rmax, r);
    const [R, G, B] = hue(r / (Math.min(GW, GH) * 0.48)), k = (y * GW + x) * 4;
    idata.data[k] = R; idata.data[k + 1] = G; idata.data[k + 2] = B;
  }
  const ro = new ResizeObserver(resize); ro.observe(stage); resize();
  const touching = (x, y) => grid[y * GW + x - 1] | grid[y * GW + x + 1] | grid[(y - 1) * GW + x] | grid[(y + 1) * GW + x];
  let raf, done = 0;
  function frame() {
    if (done > 0) { done--; if (!done) reset(); }
    else {
      const limit = Math.min(GW, GH) / 2 - 3;
      // a budget of random-walk steps per frame; each walker is released near the crystal so few steps are wasted
      let budget = 160000 * PARAMS.speed, x = 0, y = 0, alive = false;
      while (budget > 0) {
        if (!alive) { const a = Math.random() * 6.28, r = rmax + 6; x = Math.round(cx + Math.cos(a) * r); y = Math.round(cy + Math.sin(a) * r); alive = true; }
        const s = Math.random() * 4 | 0; x += s === 0 ? 1 : s === 1 ? -1 : 0; y += s === 2 ? 1 : s === 3 ? -1 : 0; budget--;
        const d = Math.hypot(x - cx, y - cy);
        if (d > rmax + 18 || x < 1 || y < 1 || x >= GW - 1 || y >= GH - 1) { alive = false; continue; }   // strayed: drop it
        if (touching(x, y) && Math.random() < 0.35 + 0.65 * Math.min(1, PARAMS.stickiness)) { stick(x, y); alive = false; if (rmax > limit) { done = 120; break; } }
      }
      ictx.putImageData(idata, 0, 0);
    }
    ctx.fillStyle = '#080a14'; ctx.fillRect(0, 0, W, H);
    ctx.imageSmoothingEnabled = false; ctx.drawImage(img, 0, 0, GW * CELL, GH * CELL);
    // a soft bloom: the same image, blurred and added
    ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.35; ctx.filter = 'blur(4px)'; ctx.drawImage(img, 0, 0, GW * CELL, GH * CELL);
    ctx.filter = 'none'; ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
    raf = requestAnimationFrame(frame);
  }
  raf = requestAnimationFrame(frame);
  return () => { cancelAnimationFrame(raf); ro.disconnect(); canvas.remove(); };
}
