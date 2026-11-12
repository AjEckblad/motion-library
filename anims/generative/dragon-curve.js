// Heighway dragon, unfolding: fold a strip of paper in half again and again, then open every crease to the same
// angle. Here it happens fold by fold: the whole curve so far is copied, and the copy swings out around the
// curve’s end until it stands at the fold angle. At 90° the curve never crosses itself, and after n folds its 2ⁿ
// segments tile the plane. Colour runs along the strip, so each swing shows which half is the new copy.
// The pointer, left to right, opens every crease from 60° to 150° (90°, the dragon, catches in the middle).
const PARAMS = { folds: 13, angle: 90, speed: 1 };

export default function (stage) {
  const canvas = document.createElement('canvas');
  canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block';
  stage.append(canvas);
  const ctx = canvas.getContext('2d');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let W = 0, H = 0, D = 1;
  const resize = () => { D = Math.min(devicePixelRatio, 2); W = stage.clientWidth || 1; H = stage.clientHeight || 1; canvas.width = W * D | 0; canvas.height = H * D | 0; };
  const ro = new ResizeObserver(resize); ro.observe(stage); resize();
  const MAXP = (1 << 16) + 1, X = new Float64Array(MAXP), Y = new Float64Array(MAXP);
  const ease = x => x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
  // build the curve: `full` folds opened completely, then one more opened by fraction f
  function build(full, f, deg) {
    const A = deg * Math.PI / 180;
    X[0] = 0; Y[0] = 0; X[1] = 1; Y[1] = 0; let n = 2;
    for (let k = 0; k < full + (f > 0 ? 1 : 0); k++) {
      const th = k < full ? A : A * f, c = Math.cos(th), s = Math.sin(th), px = X[n - 1], py = Y[n - 1];
      for (let i = n - 2; i >= 0; i--) { const dx = X[i] - px, dy = Y[i] - py; X[n] = px + dx * c - dy * s; Y[n] = py + dx * s + dy * c; n++; }
    }
    return n;
  }
  const STEP = 1.15, HOLD = 2.8, BACK = .22;
  let cam = null, raf, last = performance.now(), gt = 0;
  // the pointer sets the fold angle; while you steer the curve unfolds all the way, and when you let go it holds
  // that shape for a moment and the idle cycle (hold, fold up, unfold again) carries on
  let tx = .5, mx = .5, ma = 0, lv = 0, lastMove = -1e9, wasLive = false;
  const onMove = e => { const b = canvas.getBoundingClientRect(); tx = (e.clientX - b.left) / b.width; lastMove = performance.now(); };
  const onLeave = () => { lastMove = -1e9; };
  canvas.addEventListener('pointermove', onMove); canvas.addEventListener('pointerdown', onMove); canvas.addEventListener('pointerleave', onLeave);
  const pal = [[255, 92, 120], [255, 170, 80], [250, 230, 120], [90, 220, 170], [70, 160, 255], [160, 110, 255], [255, 92, 120]];
  const colour = u => { const h = u * (pal.length - 1), i = Math.min(pal.length - 2, Math.floor(h)), f = h - i, A = pal[i], B = pal[i + 1];
    return `rgb(${A[0] + (B[0] - A[0]) * f | 0},${A[1] + (B[1] - A[1]) * f | 0},${A[2] + (B[2] - A[2]) * f | 0})`; };
  function frame(now) {
    const dts = Math.min(.25, (now - last) / 1000), dt = Math.min(.05, dts); last = now;
    const L = Math.max(1, Math.min(16, Math.round(PARAMS.folds)));
    const grow = L * STEP, cyc = grow + HOLD + L * BACK + .4;
    const live = now - lastMove < 2500;
    if (live && ma < .01) mx = tx;
    mx += (tx - mx) * (1 - Math.exp(-dt * 14)); ma += ((live ? 1 : 0) - ma) * (1 - Math.exp(-dt * (live ? 6 : 2.5)));
    if (wasLive && !live) gt = Math.floor(gt / cyc) * cyc + grow;   // let go: hold the full curve, then fold up as usual
    wasLive = live;
    if (!live && !reduce) gt += dts * PARAMS.speed;
    let t = reduce ? grow + 1 : gt % cyc, level;
    if (t < grow) { const k = Math.floor(t / STEP), u = Math.min(1, (t - k * STEP) / (STEP * .8)); level = k + ease(u); }
    else if (t < grow + HOLD) level = L;
    else level = Math.max(0, L - ease(Math.min(1, (t - grow - HOLD) / (L * BACK))) * L);   // fold it all back up
    if (ma < .01) lv = level; else lv += (L - lv) * (1 - Math.exp(-dt * 2.5));
    const e = ma * ma * (3 - 2 * ma), u = Math.max(-.5, Math.min(.5, mx - .5));
    const pdeg = 90 + Math.sign(u) * Math.max(0, Math.abs(u) - .04) / .46 * (u < 0 ? 30 : 60), deg = PARAMS.angle + (pdeg - PARAMS.angle) * e;
    level += (lv - level) * e;
    const full = Math.floor(level), f = level - full, n = build(full, f, deg);
    // counter-rotate by 45° per fold so the dragon stays upright as it grows; fit the camera to its bounds smoothly
    const rot = -level * Math.PI / 4 * (deg / 90), c = Math.cos(rot), s = Math.sin(rot);
    let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
    for (let i = 0; i < n; i++) { const x = X[i] * c - Y[i] * s, y = X[i] * s + Y[i] * c; X[i] = x; Y[i] = y; if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
    const target = { cx: (x0 + x1) / 2, cy: (y0 + y1) / 2, sc: Math.min(W * .8 / Math.max(1e-6, x1 - x0), H * .8 / Math.max(1e-6, y1 - y0)) };
    if (!cam || reduce) cam = { ...target };
    else { const k = .2; cam.cx += (target.cx - cam.cx) * k; cam.cy += (target.cy - cam.cy) * k; cam.sc *= Math.pow(target.sc / cam.sc, k); }
    ctx.setTransform(D, 0, 0, D, 0, 0);
    ctx.fillStyle = '#09090e'; ctx.fillRect(0, 0, W, H);
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.lineWidth = Math.max(.7, Math.min(6 * Math.min(1, Math.pow(deg / 90, 3)), cam.sc * .3));   // tight folds overlap: thinner
    const segs = n - 1, B = Math.min(64, segs);
    for (let b = 0; b < B; b++) {
      const i0 = Math.floor(b * segs / B), i1 = Math.floor((b + 1) * segs / B);
      ctx.strokeStyle = colour(b / Math.max(1, B - 1)); ctx.beginPath();
      for (let i = i0; i <= i1; i++) { const x = W / 2 + (X[i] - cam.cx) * cam.sc, y = H / 2 + (Y[i] - cam.cy) * cam.sc; i === i0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y); }
      ctx.stroke();
    }
    if (ma > .01) {
      ctx.font = '600 12px ui-monospace, SFMono-Regular, Menlo, monospace'; ctx.textBaseline = 'bottom';
      ctx.fillStyle = `rgba(240,236,228,${.7 * ma})`; ctx.fillText(`fold angle ${deg.toFixed(1)}°`, 18, H - 16);
    }
    raf = requestAnimationFrame(frame);
  }
  raf = requestAnimationFrame(frame);
  return () => { cancelAnimationFrame(raf); ro.disconnect(); canvas.removeEventListener('pointermove', onMove); canvas.removeEventListener('pointerdown', onMove); canvas.removeEventListener('pointerleave', onLeave); canvas.remove(); };
}
