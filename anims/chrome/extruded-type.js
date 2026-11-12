// Extruded type: a word drawn once into a mask, then stacked back to front as dozens of layers. Each layer is
// placed by the same 3D rotation (an exact orthographic projection is just a 2D affine transform), so the
// stack reads as solid letters with depth. The face gets a moving chrome sweep; the sides darken with depth.
const PARAMS = { depth: 1, layers: 36, tilt: 1 };

export default function (stage) {
  const canvas = document.createElement('canvas');
  canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block';
  stage.append(canvas);
  const ctx = canvas.getContext('2d');
  let W = 0, H = 0, mask, side, sideLit, face, mw = 0, mh = 0;
  const WORD = 'DEPTH';
  function build() {
    const fs = Math.min(W * 0.19, H * 0.36);
    mask = document.createElement('canvas'); const m = mask.getContext('2d');
    m.font = `900 ${fs}px "Mona Sans", system-ui, sans-serif`;
    mw = Math.ceil(m.measureText(WORD).width + fs * 0.2); mh = Math.ceil(fs * 1.1);
    mask.width = mw; mask.height = mh;
    m.font = `900 ${fs}px "Mona Sans", system-ui, sans-serif`; m.fontStretch = 'expanded';
    m.textAlign = 'center'; m.textBaseline = 'middle'; m.fillStyle = '#fff'; m.fillText(WORD, mw / 2, mh * 0.53);
    const tint = c => { const k = document.createElement('canvas'); k.width = mw; k.height = mh; const g = k.getContext('2d'); g.drawImage(mask, 0, 0); g.globalCompositeOperation = 'source-in'; g.fillStyle = c; g.fillRect(0, 0, mw, mh); return k; };
    side = tint('#341a6e'); sideLit = tint('#a07bff');
    face = document.createElement('canvas'); face.width = mw; face.height = mh;
  }
  const resize = () => { const d = Math.min(devicePixelRatio, 2); W = stage.clientWidth; H = stage.clientHeight; canvas.width = W * d; canvas.height = H * d; ctx.setTransform(d, 0, 0, d, 0, 0); build(); };
  const ro = new ResizeObserver(resize); ro.observe(stage); resize();
  let px = 0, py = 0, lastMove = -1e9;
  const onMove = e => { const b = canvas.getBoundingClientRect(); px = (e.clientX - b.left) / b.width * 2 - 1; py = (e.clientY - b.top) / b.height * 2 - 1; lastMove = performance.now(); };
  canvas.addEventListener('pointermove', onMove);
  let ry = 0, rx = 0, raf; const t0 = performance.now();
  function frame(now) {
    const t = (now - t0) / 1000, d = Math.min(devicePixelRatio, 2);
    const idle = now - lastMove > 1500;
    const ty = (idle ? Math.sin(t * 0.7) * 0.55 : px * 0.7) * PARAMS.tilt, tx = (idle ? Math.sin(t * 0.45 + 1) * 0.28 : py * 0.4) * PARAMS.tilt;
    ry += (ty - ry) * 0.08; rx += (tx - rx) * 0.08;
    const bg = ctx.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, '#0b0a10'); bg.addColorStop(1, '#16121f');   // dark studio
    ctx.setTransform(d, 0, 0, d, 0, 0); ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
    // rotation (Y then X); orthographic projection of the text plane = this 2x2 matrix plus a per-layer offset
    const cy = Math.cos(ry), sy = Math.sin(ry), cx = Math.cos(rx), sx = Math.sin(rx);
    const a = cy, b = sx * sy, c = 0, dd = cx, ox = sy, oy = -cy * sx;           // where the x and y axes land on screen, and how far one unit of depth shifts
    const depth = Math.min(W, H) * 0.16 * PARAMS.depth, L = Math.max(4, Math.round(PARAMS.layers));
    // on the dark floor the letters throw a soft violet bounce of light rather than a shadow
    ctx.save(); ctx.translate(W / 2 + ry * 20, H * 0.8); ctx.scale(1, 0.18); const sg = ctx.createRadialGradient(0, 0, 0, 0, 0, mw * 0.5);
    sg.addColorStop(0, 'rgba(139,92,246,.28)'); sg.addColorStop(1, 'rgba(139,92,246,0)'); ctx.fillStyle = sg; ctx.fillRect(-mw, -mw, mw * 2, mw * 2); ctx.restore();
    const light = 0.5 + 0.5 * Math.sin(ry + 0.6);                                   // sides facing the light read brighter
    for (let i = L; i >= 1; i--) {
      const z = depth * i / L, persp = 1 - z * 0.0009 * (1 + sx);
      ctx.setTransform(d * a * persp, d * b * persp, d * c, d * dd * persp, d * (W / 2 + ox * z), d * (H / 2 - 8 + oy * z));
      ctx.globalAlpha = 1; ctx.drawImage(side, -mw / 2, -mh / 2);
      ctx.globalAlpha = (1 - i / L) * 0.55 + light * 0.35; ctx.drawImage(sideLit, -mw / 2, -mh / 2);
    }
    // the face: chrome bands sweeping across, clipped to the letters
    const f = face.getContext('2d'); f.globalCompositeOperation = 'source-over'; f.clearRect(0, 0, mw, mh); f.drawImage(mask, 0, 0); f.globalCompositeOperation = 'source-in';
    const sweep = (t * 0.25 + ry * 0.4) % 1, g = f.createLinearGradient(0, 0, mw, mh * 0.6);
    [[0, '#d9d2ff'], [0.25, '#6d4fd6'], [0.45, '#ffffff'], [0.55, '#b9a8ff'], [0.8, '#4b2fa8'], [1, '#e8e2ff']].forEach(([o, col]) => g.addColorStop((o + sweep) % 1, col));
    f.fillStyle = g; f.fillRect(0, 0, mw, mh);
    ctx.globalAlpha = 1; ctx.setTransform(d * a, d * b, d * c, d * dd, d * W / 2, d * (H / 2 - 8));
    ctx.drawImage(face, -mw / 2, -mh / 2);
    ctx.globalAlpha = 1;
    raf = requestAnimationFrame(frame);
  }
  raf = requestAnimationFrame(frame);
  return () => { cancelAnimationFrame(raf); ro.disconnect(); canvas.removeEventListener('pointermove', onMove); canvas.remove(); };
}
