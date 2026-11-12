// Barnsley fern: the chaos game with four affine maps. One squeezes everything to the stem, one copies the whole
// fern slightly smaller and higher (the next frond up), and two copy it shrunk and flipped into the first left and
// right leaflets. Pick a map at random (weighted 1/85/7/7), apply it, plot the point, repeat: the fern emerges
// from noise, coarse leaflets first, then finer and finer detail. Each pixel counts its hits, and the count is the shade.
// The pointer is wind: left or right turns the frond-copy map, so the fern leans that way and curls up.
const PARAMS = { rate: 1, hold: 4, glow: 1 };

export default function (stage) {
  const canvas = document.createElement('canvas');
  canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block';
  stage.append(canvas);
  const ctx = canvas.getContext('2d');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  // [a, b, c, d, e, f, p]: x′ = a·x + b·y + e, y′ = c·x + d·y + f
  const FERNS = [
    [[0, 0, 0, .16, 0, 0, .01], [.85, .04, -.04, .85, 0, 1.6, .85], [.2, -.26, .23, .22, 0, 1.6, .07], [-.15, .28, .26, .24, 0, .44, .07]],
    [[0, 0, 0, .25, 0, -.4, .02], [.95, .005, -.005, .93, -.002, .5, .84], [.035, -.2, .16, .04, -.09, .02, .07], [-.04, .2, .16, .04, .083, .12, .07]],
  ];
  let W = 0, H = 0, w = 0, h = 0, img = null, cnt = null, px = null, touched = null, nt = 0;
  // shade by hit count: deep moss → leaf green → pale lime → near white at the densest ribs
  const LUT = new Uint32Array(256);
  const stops = [[0, 10, 12, 16], [3, 16, 70, 40], [14, 46, 160, 82], [50, 150, 230, 120], [140, 228, 255, 196], [255, 250, 255, 236]];
  for (let n = 0; n < 256; n++) {
    let i = 0; while (i < stops.length - 2 && n > stops[i + 1][0]) i++;
    const A = stops[i], B = stops[i + 1], f = (n - A[0]) / (B[0] - A[0]);
    const r = A[1] + (B[1] - A[1]) * f, g = A[2] + (B[2] - A[2]) * f, b = A[3] + (B[3] - A[3]) * f;
    LUT[n] = (255 << 24) | (b << 16) | (g << 8) | r;
  }
  // the maps in play: a copy of the species' maps, with the frond map (index 1) turned by the wind
  const maps = [[0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0]];
  let fern = 0, cum, fit, x = 0, y = 0, born = 0, phase = 'grow', phaseT = 0, done = 0, wind = 0;
  function setWind(a) {
    const m = FERNS[fern][1], c = Math.cos(a), s = Math.sin(a), o = maps[1];
    o[0] = c * m[0] - s * m[2]; o[1] = c * m[1] - s * m[3]; o[2] = s * m[0] + c * m[2]; o[3] = s * m[1] + c * m[3];
    o[4] = c * m[4] - s * m[5]; o[5] = s * m[4] + c * m[5]; wind = a;
  }
  function start(k) {
    fern = k % FERNS.length; FERNS[fern].forEach((m, i) => { for (let j = 0; j < 7; j++) maps[i][j] = m[j]; }); setWind(0);
    cum = []; let s = 0; for (const m of maps) cum.push(s += m[6]);
    // bounds from a quick dry run
    let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9, a = 0, b = 0;
    for (let i = 0; i < 40000; i++) { [a, b] = step(a, b); if (i > 20) { x0 = Math.min(x0, a); x1 = Math.max(x1, a); y0 = Math.min(y0, b); y1 = Math.max(y1, b); } }
    const sc = Math.min(w * .8 / (x1 - x0), h * .9 / (y1 - y0));
    fit = { sc, ox: w / 2 - (x0 + x1) / 2 * sc, oy: h / 2 + (y0 + y1) / 2 * sc };
    clear(true); x = 0; y = 0;
  }
  function clear(all) {
    if (all || nt > w * h / 4) { cnt.fill(0); px.fill(LUT[0]); }
    else for (let i = 0; i < nt; i++) { const j = touched[i]; cnt[j] = 0; px[j] = LUT[0]; }
    nt = 0; done = 0;
  }
  function step(a, b) {
    const r = Math.random(); let k = 0; while (k < 3 && r > cum[k]) k++;
    const m = maps[k]; return [m[0] * a + m[1] * b + m[4], m[2] * a + m[3] * b + m[5]];
  }
  const resize = () => {
    const d = Math.min(devicePixelRatio, 2); W = stage.clientWidth || 1; H = stage.clientHeight || 1;
    w = canvas.width = W * d | 0; h = canvas.height = H * d | 0;
    img = ctx.createImageData(w, h); px = new Uint32Array(img.data.buffer); cnt = new Uint8Array(w * h); touched = new Int32Array(w * h);
    start(fern); phase = 'grow'; phaseT = 0;
    if (reduce) plot(Math.round(w * h * 1.6));   // reduced motion: the finished fern, still
  };
  function plot(n, inc = Math.ceil(Math.max(.3, PARAMS.glow) * 2)) {
    const { sc, ox, oy } = fit;
    for (let i = 0; i < n; i++) {
      const r = Math.random(); let k = 0; while (k < 3 && r > cum[k]) k++;
      const m = maps[k], nx = m[0] * x + m[1] * y + m[4]; y = m[2] * x + m[3] * y + m[5]; x = nx;
      const X = ox + x * sc | 0, Y = oy - y * sc | 0;
      if (X < 0 || Y < 0 || X >= w || Y >= h) continue;
      const j = Y * w + X; let c = cnt[j];
      if (c === 0) touched[nt++] = j;
      if (c < 255) { c = Math.min(255, c + inc); cnt[j] = c; px[j] = LUT[c]; }
    }
    done += n;
  }
  // the pointer, as wind: none in the middle, more turn per frond copy toward the edges (a lean that curls up). The
  // fern already curls right, so it takes less wind that way; a species with more, smaller copies takes less again
  let tx = .5, mx = .5, ma = 0, lastMove = -1e9;
  const onMove = e => { const b = canvas.getBoundingClientRect(); tx = (e.clientX - b.left) / b.width; lastMove = performance.now(); };
  const onLeave = () => { lastMove = -1e9; };
  canvas.addEventListener('pointermove', onMove); canvas.addEventListener('pointerdown', onMove); canvas.addEventListener('pointerleave', onLeave);
  const ro = new ResizeObserver(resize); ro.observe(stage); resize();
  let raf, last = performance.now();
  function frame(now) {
    const dt = Math.min(.05, (now - last) / 1000); last = now;
    const live = now - lastMove < 2500;
    if (live && ma < .01) mx = tx;
    mx += (tx - mx) * (1 - Math.exp(-dt * 14)); ma += ((live ? 1 : 0) - ma) * (1 - Math.exp(-dt * (live ? 8 : 2.5))); if (!live && ma < 1e-3) ma = 0;
    const budget = Math.max(60000, Math.min(260000, w * h * .3)) | 0, g = Math.ceil(Math.max(.3, PARAMS.glow) * 2);
    // a fresh frame has far fewer points than the finished fern, so each counts for more
    const incL = Math.min(255, Math.ceil(g * w * h * 1.6 / budget / 1.7));
    if (ma > 0 || phase === 'live') {
      const u = Math.max(-.5, Math.min(.5, mx - .5)), e = ma * ma * (3 - 2 * ma), m = FERNS[fern][1];
      const give = (1 - Math.sqrt(Math.abs(m[0] * m[3] - m[1] * m[2]))) / .15, a = -u * 2 * (u > 0 ? .15 : .23) * give * e;
      const moved = Math.abs(a - wind) > 1e-4; setWind(a);
      if (phase !== 'live') { phase = 'live'; phaseT = 0; }
      // wind changing: wipe and re-plot the fern every frame; still: keep adding until it is dense again
      if (moved) { clear(false); x = 0; y = 0; plot(20); clear(false); plot(budget, incL); }
      else if (done * incL < w * h * 1.6 * g) plot(budget, incL);
      else if (ma === 0) { phase = 'hold'; phaseT = 0; }   // calm and dense again: the idle cycle carries on
    } else if (!reduce) {
      phaseT += dt;
      if (phase === 'grow') {
        // accelerate: a few hundred points first so the structure visibly appears, then floods of them for detail
        const target = w * h * 1.6, n = Math.min(target - done, Math.round((120 + done * .012) * PARAMS.rate));
        if (n > 0) plot(n); else { phase = 'hold'; phaseT = 0; }
      } else if (phase === 'hold' && phaseT > PARAMS.hold) { phase = 'fade'; phaseT = 0; }
      else if (phase === 'fade' && phaseT > 1) { start(fern + 1); phase = 'grow'; phaseT = 0; }
    }
    ctx.globalAlpha = 1; ctx.putImageData(img, 0, 0);
    if (phase === 'fade') { ctx.fillStyle = `rgba(10,12,16,${Math.min(1, phaseT)})`; ctx.fillRect(0, 0, w, h); }
    raf = requestAnimationFrame(frame);
  }
  raf = requestAnimationFrame(frame);
  return () => { cancelAnimationFrame(raf); ro.disconnect(); canvas.removeEventListener('pointermove', onMove); canvas.removeEventListener('pointerdown', onMove); canvas.removeEventListener('pointerleave', onLeave); canvas.remove(); };
}
