// Digital rain: every column drops a bright head that writes glyphs as it falls; the cells behind it fade out
// over a tail. Glyphs (mirrored half-width katakana + digits) are drawn once with fillText into a cached atlas at
// device resolution, then stamped with drawImage, so thousands of glyphs a frame stay crisp and cheap. Columns
// get a depth value: far ones are dimmer and slower, which reads as parallax.
const PARAMS = { speed: 1, size: 18, density: 0.7 };

export default function (stage) {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const canvas = document.createElement('canvas');
  canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block';
  stage.append(canvas);
  const ctx = canvas.getContext('2d');
  const KANA = 'ｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙﾚﾛﾜﾝ', DIG = '0123456789:.=+<>*';
  const glyphs = [...KANA, ...DIG], NK = [...KANA].length, NG = glyphs.length;
  let W = 0, H = 0, D = 1, S = 18, px = 18, pad = 0, cols = 0, rows = 0, grid, drops = [], tail, head, glow;

  const makeAtlas = (fill, blur, padding) => {
    const cell = px + padding * 2, c = document.createElement('canvas');
    c.width = cell * NG; c.height = cell;
    const g = c.getContext('2d');
    g.font = `${Math.round(px * 0.86)}px "Hiragino Kaku Gothic ProN","Hiragino Sans","Yu Gothic","Noto Sans JP","MS Gothic",monospace`;
    g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = fill;
    if (blur) { g.shadowColor = fill; g.shadowBlur = blur; }
    glyphs.forEach((ch, i) => {
      g.save(); g.translate(i * cell + cell / 2, cell / 2 + px * 0.04);
      if (i < NK) g.scale(-1, 1);                       // the film's glyphs are mirrored
      g.fillText(ch, 0, 0);
      if (blur) g.fillText(ch, 0, 0);
      g.restore();
    });
    return c;
  };
  const spawn = (d, first) => {
    d.depth = 0.3 + Math.random() * 0.7;
    d.v = (7 + Math.random() * 16) * (0.45 + 0.55 * d.depth);
    d.len = 8 + Math.random() * 22 | 0;
    d.y = first ? Math.random() * (rows + d.len) - d.len * 0.5 : -Math.random() * rows * (1.4 - PARAMS.density);
    d.last = Math.floor(d.y);
  };
  const resize = () => {
    D = Math.min(devicePixelRatio, 2); W = stage.clientWidth || 1; H = stage.clientHeight || 1;
    canvas.width = W * D | 0; canvas.height = H * D | 0;
    S = Math.max(8, Math.round(PARAMS.size)); px = Math.round(S * D); pad = Math.round(px * 0.45);
    tail = makeAtlas('#35f06a', 0, 0); head = makeAtlas('#f2fff4', 0, 0); glow = makeAtlas('#6dff95', px * 0.5, pad);
    cols = Math.ceil(W / S); rows = Math.ceil(H / S) + 1;
    grid = new Uint8Array(cols * rows); for (let i = 0; i < grid.length; i++) grid[i] = Math.random() * NG | 0;
    drops = [];
    for (let c = 0; c < cols; c++) {
      const n = Math.random() < PARAMS.density * 0.6 ? 2 : 1;
      for (let k = 0; k < n; k++) { const d = { c }; spawn(d, true); drops.push(d); }
    }
  };
  const ro = new ResizeObserver(resize); ro.observe(stage); resize();

  let raf, last = performance.now();
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000) * (reduce ? 0.08 : 1); last = now;
    // glyph churn: a few cells change at random, like the film
    const churn = grid.length * dt * (reduce ? 0.02 : 0.6);
    for (let i = 0; i < churn; i++) grid[Math.random() * grid.length | 0] = Math.random() * NG | 0;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
    ctx.fillStyle = '#020704'; ctx.fillRect(0, 0, canvas.width, canvas.height);
    const cell = px + pad * 2;
    for (const d of drops) {
      d.y += d.v * PARAMS.speed * dt;
      const hy = Math.floor(d.y);
      if (hy !== d.last) { for (let r = d.last + 1; r <= hy; r++) if (r >= 0 && r < rows) grid[d.c * rows + r] = Math.random() * NG | 0; d.last = hy; }
      if (hy - d.len > rows) { spawn(d, false); continue; }
      const x = d.c * px;
      for (let k = d.len; k >= 1; k--) {
        const r = hy - k; if (r < 0 || r >= rows) continue;
        const f = 1 - k / d.len; ctx.globalAlpha = Math.pow(f, 1.6) * (0.3 + 0.7 * d.depth);
        const gi = grid[d.c * rows + r];
        ctx.drawImage(k <= 2 ? head : tail, gi * px, 0, px, px, x, r * px, px, px);
        if (k <= 2) { ctx.globalAlpha *= 0.5; ctx.drawImage(tail, gi * px, 0, px, px, x, r * px, px, px); }
      }
      if (hy >= 0 && hy < rows) {
        const gi = (Math.random() < 0.2 && !reduce) ? (grid[d.c * rows + hy] = Math.random() * NG | 0) : grid[d.c * rows + hy];
        ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.95 * d.depth;
        ctx.drawImage(glow, gi * cell, 0, cell, cell, x - pad, hy * px - pad, cell, cell);
        ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 0.4 + 0.6 * d.depth;
        ctx.drawImage(head, gi * px, 0, px, px, x, hy * px, px, px);
      }
    }
    raf = requestAnimationFrame(frame);
  }
  raf = requestAnimationFrame(frame);
  return () => { cancelAnimationFrame(raf); ro.disconnect(); canvas.remove(); };
}
