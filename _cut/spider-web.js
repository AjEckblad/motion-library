// Spider web at dawn: an orb weaver builds its web in the order real ones do. A bridge line, a frame, radial
// spokes out from the hub one at a time, then the sticky capture spiral, laid from the outside in as a chain of
// straight steps between spokes. Then dew condenses on the spiral: the beads weigh each strand down into a little
// curve, and every bead is a lens that catches the low sun. Silk glints where it lies across the light, with a faint
// rainbow sheen. A breeze rocks the whole web; then a fresh morning and a fresh web.
const PARAMS = { spokes: 30, turns: 34, breeze: 1 };

export default function (stage) {
  const canvas = document.createElement('canvas');
  canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block;background:#1d2a20';
  stage.append(canvas);
  const ctx = canvas.getContext('2d');
  let W = 1, H = 1, bg = null, web = null;
  const rnd = (a, b) => a + Math.random() * (b - a);
  // a garden out of focus at dawn: dark leaves, warm light coming in from the upper left, soft bokeh
  function paintBg() {
    const d = Math.min(devicePixelRatio, 2); bg = document.createElement('canvas'); bg.width = canvas.width; bg.height = canvas.height;
    const g = bg.getContext('2d'); g.setTransform(d, 0, 0, d, 0, 0);
    const lg = g.createLinearGradient(0, 0, W, H); lg.addColorStop(0, '#5c5a33'); lg.addColorStop(0.45, '#22301f'); lg.addColorStop(1, '#0e1a14');
    g.fillStyle = lg; g.fillRect(0, 0, W, H);
    for (let i = 0; i < 40; i++) {
      const x = rnd(-0.1, 1.1) * W, y = rnd(-0.1, 1.1) * H, r = rnd(0.03, 0.12) * Math.min(W, H), warm = 1 - (x / W + y / H) / 2;
      const c = warm > 0.55 ? `rgba(255,214,140,${rnd(0.08, 0.22)})` : `rgba(120,170,110,${rnd(0.04, 0.12)})`;
      const rg = g.createRadialGradient(x, y, r * 0.7, x, y, r); rg.addColorStop(0, c); rg.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = rg; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill();
    }
    // twigs at the edges holding the web
    g.strokeStyle = '#120d08'; g.lineCap = 'round';
    for (const [x0, y0, x1, y1, w] of [[-0.05, 0.06, 0.32, 0.12, 9], [0.62, -0.05, 1.05, 0.2, 8], [0.97, 0.3, 0.86, 1.05, 10], [-0.05, 0.85, 0.24, 1.05, 9]]) { g.lineWidth = w; g.beginPath(); g.moveTo(x0 * W, y0 * H); g.quadraticCurveTo(((x0 + x1) / 2 + 0.03) * W, ((y0 + y1) / 2 - 0.03) * H, x1 * W, y1 * H); g.stroke(); }
  }
  // build a new web: anchors on the twigs, a hub, spokes, and the spiral as steps between spokes
  function plan() {
    const hub = [W * rnd(0.47, 0.55), H * rnd(0.45, 0.53)];
    const anchors = [[0.2 * W, 0.105 * H], [0.86 * W, 0.12 * H], [0.92 * W, 0.62 * H], [0.12 * W, 0.93 * H]];
    const frame = anchors.map(([x, y], i) => { const [nx, ny] = anchors[(i + 1) % 4]; return [x, y, nx, ny]; });
    const S = Math.max(8, Math.round(PARAMS.spokes)), spokes = [];
    // where a ray from the hub meets the frame
    const reach = a => { let best = 1e9; const dx = Math.cos(a), dy = Math.sin(a);
      for (const [x1, y1, x2, y2] of frame) { const ex = x2 - x1, ey = y2 - y1, den = dx * ey - dy * ex; if (Math.abs(den) < 1e-9) continue; const t = ((x1 - hub[0]) * ey - (y1 - hub[1]) * ex) / den, u = ((x1 - hub[0]) * dy - (y1 - hub[1]) * dx) / den; if (t > 0 && u >= 0 && u <= 1) best = Math.min(best, t); }
      return best; };
    for (let i = 0; i < S; i++) { const a = (i / S) * Math.PI * 2 + rnd(-0.05, 0.05); spokes.push({ a, r: reach(a) }); }
    const T = Math.max(8, Math.round(PARAMS.turns)), spiral = [];
    // outside in: radius at each spoke shrinks a little every step
    const steps = T * S;
    // near the rim the spiral follows the frame; toward the hub it rounds into circles, as real ones do
    const rmin = Math.min(...spokes.map(s => s.r));
    for (let k = 0; k <= steps; k++) { const s = spokes[k % S], f = 0.9 - (k / steps) * 0.76, shape = Math.pow(f / 0.9, 1.6); spiral.push({ a: s.a, f, r: f * (rmin + (s.r - rmin) * shape) }); }
    const dew = [];
    for (let k = 0; k < spiral.length - 1; k++) { const n = 1 + ((Math.random() * 3) | 0); for (let j = 0; j < n; j++) dew.push({ k, t: (j + Math.random()) / n, r: rnd(0.8, 2.6) * (Math.random() < 0.08 ? 2 : 1), d: Math.random() }); }
    web = { hub, anchors, frame, spokes, spiral, dew, t: 0 };
  }
  const resize = () => { const d = Math.min(devicePixelRatio, 2); W = stage.clientWidth || 1; H = stage.clientHeight || 1; canvas.width = Math.max(1, (W * d) | 0); canvas.height = Math.max(1, (H * d) | 0); ctx.setTransform(d, 0, 0, d, 0, 0); paintBg(); plan(); };
  const ro = new ResizeObserver(resize); ro.observe(stage); resize();

  // one dew bead, drawn once: a lens showing the bright sky upside down, a dark rim, and a glint
  const bead = document.createElement('canvas'); bead.width = bead.height = 32;
  { const g = bead.getContext('2d'), lens = g.createRadialGradient(16, 21, 0, 16, 16, 15); lens.addColorStop(0, 'rgba(255,236,190,.9)'); lens.addColorStop(0.7, 'rgba(160,190,150,.5)'); lens.addColorStop(1, 'rgba(20,30,25,.65)');
    g.fillStyle = lens; g.beginPath(); g.arc(16, 16, 15, 0, 7); g.fill(); g.fillStyle = 'rgba(255,255,255,.95)'; g.beginPath(); g.arc(10.5, 10.3, 4.2, 0, 7); g.fill(); }
  const SUN = Math.atan2(1, 1.3);                                 // direction of the light across the picture
  // silk glints where a thread lies across the light, with a faint diffraction rainbow
  const silk = (x1, y1, x2, y2, base) => {
    const a = Math.atan2(y2 - y1, x2 - x1), g = Math.pow(Math.abs(Math.sin(a - SUN)), 6);
    const hue = (a * 180 / Math.PI * 3 + 360) % 360;
    return g > 0.25 ? `hsla(${hue},70%,86%,${base + g * 0.5})` : `rgba(225,232,236,${base})`;
  };
  let raf, last = performance.now(), time = 0;
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000); last = now; time += dt;
    const w = web; w.t += dt;
    // the timeline: frame 0–3 s, spokes 3–9 s, spiral 9–21 s, dew 21–26 s, rest, then a new morning
    const T = w.t, tFrame = Math.min(1, T / 3), tSpoke = Math.min(1, Math.max(0, (T - 3) / 6)), tSpiral = Math.min(1, Math.max(0, (T - 9) / 12)), tDew = Math.min(1, Math.max(0, (T - 20.5) / 5));
    const fade = T > 33 ? Math.max(0, 1 - (T - 33) / 1.5) : 1;
    if (T > 34.5) plan();
    // breeze: the web rocks a little about the top
    const sway = Math.sin(time * 0.9) * 0.012 * PARAMS.breeze + Math.sin(time * 2.3) * 0.004 * PARAMS.breeze;
    const P = (x, y) => [x + (y - w.hub[1] + H * 0.4) * sway, y];
    ctx.globalAlpha = 1; ctx.drawImage(bg, 0, 0, W, H);
    ctx.globalAlpha = fade; ctx.lineCap = 'round';
    let tip = null;
    // frame lines
    ctx.lineWidth = 1.1;
    w.frame.forEach(([x1, y1, x2, y2], i) => {
      const k = Math.min(1, Math.max(0, tFrame * 4 - i)); if (k <= 0) return;
      const [a, b] = P(x1, y1), [c, d] = P(x1 + (x2 - x1) * k, y1 + (y2 - y1) * k);
      ctx.strokeStyle = silk(a, b, c, d, 0.42); ctx.beginPath(); ctx.moveTo(a, b); ctx.lineTo(c, d); ctx.stroke(); if (k < 1) tip = [c, d];
    });
    // spokes, one after another (not in order round the hub: a spider alternates sides to keep the tension even)
    const S = w.spokes.length, order = Array.from({ length: S }, (_, i) => (i % 2 ? Math.floor(i / 2) + Math.ceil(S / 2) : i / 2) | 0);
    ctx.lineWidth = 0.9;
    for (let n = 0; n < S; n++) {
      const k = Math.min(1, Math.max(0, tSpoke * S - n)); if (k <= 0) break;
      const s = w.spokes[order[n] % S], [a, b] = P(w.hub[0], w.hub[1]), [c, d] = P(w.hub[0] + Math.cos(s.a) * s.r * k, w.hub[1] + Math.sin(s.a) * s.r * k);
      ctx.strokeStyle = silk(a, b, c, d, 0.36); ctx.beginPath(); ctx.moveTo(a, b); ctx.lineTo(c, d); ctx.stroke(); if (k < 1) tip = [c, d];
    }
    // the capture spiral, sagging under its dew
    const sp = w.spiral, upto = tSpiral * (sp.length - 1);
    ctx.lineWidth = 0.75;
    const pos = q => P(w.hub[0] + Math.cos(q.a) * q.r, w.hub[1] + Math.sin(q.a) * q.r);
    for (let k = 0; k < Math.min(sp.length - 1, Math.ceil(upto)); k++) {
      const part = Math.min(1, upto - k), [a, b] = pos(sp[k]), [c0, d0] = pos(sp[k + 1]), c = a + (c0 - a) * part, d = b + (d0 - b) * part;
      const sag = tDew * Math.hypot(c - a, d - b) * 0.09;
      ctx.strokeStyle = silk(a, b, c, d, 0.3); ctx.beginPath(); ctx.moveTo(a, b); ctx.quadraticCurveTo((a + c) / 2, (b + d) / 2 + sag, c, d); ctx.stroke();
      if (part < 1) tip = [c, d];
    }
    // dew: every bead a tiny lens, dark rim, bright inverted sky, and a glint
    if (tDew > 0) for (const dw of w.dew) {
      const grow = Math.min(1, Math.max(0, tDew * 1.6 - dw.d * 0.6)); if (grow <= 0) continue;
      const [a, b] = pos(sp[dw.k]), [c, d] = pos(sp[dw.k + 1]), t = dw.t, sag = tDew * Math.hypot(c - a, d - b) * 0.09 * 4 * t * (1 - t);
      const x = a + (c - a) * t, y = b + (d - b) * t + sag, r = dw.r * grow * Math.min(W, H) / 560;
      ctx.drawImage(bead, x - r, y - r, r * 2, r * 2);
    }
    // the spider, at whatever it is spinning (or resting at the hub)
    const [sx, sy] = tip ?? P(w.hub[0], w.hub[1]), s = Math.min(W, H) / 120;
    ctx.fillStyle = '#100c0a'; ctx.strokeStyle = '#100c0a'; ctx.lineWidth = Math.max(0.8, s * 0.22);
    for (let l = 0; l < 8; l++) { const side = l < 4 ? -1 : 1, k = (l % 4) - 1.5, a = side * (0.5 + k * 0.35) + Math.PI / 2 * (side > 0 ? 0 : 0); const bend = Math.sin(time * 14 + l) * (tip ? 0.25 : 0);
      ctx.beginPath(); ctx.moveTo(sx, sy); ctx.quadraticCurveTo(sx + side * s * 1.6, sy + k * s * 1.1 - s, sx + side * s * 2.6, sy + k * s * 1.5 + bend * s); ctx.stroke(); }
    ctx.beginPath(); ctx.ellipse(sx, sy - s * 0.4, s * 0.55, s * 0.6, 0, 0, 7); ctx.fill();
    ctx.beginPath(); ctx.ellipse(sx, sy + s * 0.8, s * 0.95, s * 1.15, 0, 0, 7); ctx.fill();
    ctx.globalAlpha = 1;
    raf = requestAnimationFrame(frame);
  }
  raf = requestAnimationFrame(frame);
  return () => { cancelAnimationFrame(raf); ro.disconnect(); canvas.remove(); };
}
