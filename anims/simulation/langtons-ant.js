// Langton’s ant: one ant on a grid of two-colour cells. On an empty cell it turns right, on a filled cell left; it
// flips the cell it leaves and steps forward. Nothing else. For about ten thousand steps it builds a symmetric then
// chaotic blob, and then, always, it locks into a 104-step cycle that drives a diagonal "highway" off forever. Filled
// cells are coloured by when the ant last touched them, so the newest work glows and the old blob cools. The grid
// wraps, so the highway eventually crashes back into the blob and the chaos restarts.
const PARAMS = { speed: 120, cell: 5 };

export default function (stage) {
  const canvas = document.createElement('canvas');
  canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block';
  stage.append(canvas);
  const ctx = canvas.getContext('2d');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const off = document.createElement('canvas'), octx = off.getContext('2d');
  let W = 0, H = 0, D = 1, C = 0, R = 0, cell, touched, img, grid, ax, ay, dir, steps;
  const cp = () => Math.max(2, Math.round(PARAMS.cell));
  // age ramp for filled cells: 0 = just flipped (white-hot) .. 1 = old (deep violet)
  const stops = [[0, [255, 250, 225]], [0.04, [255, 196, 90]], [0.2, [240, 100, 60]], [0.5, [170, 45, 110]], [1, [62, 30, 96]]];
  const LUT = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    const t = i / 255; let k = 0; while (k < stops.length - 2 && t > stops[k + 1][0]) k++;
    const [t0, a] = stops[k], [t1, b] = stops[k + 1], u = (t - t0) / (t1 - t0);
    const c = a.map((v, j) => Math.round(v + (b[j] - v) * u));
    LUT[i] = 0xff000000 | (c[2] << 16) | (c[1] << 8) | c[0];
  }
  const BG = 0xff000000 | (14 << 16) | (9 << 8) | 8, VISITED = 0xff000000 | (30 << 16) | (18 << 8) | 17;
  const reset = () => {
    cell = new Uint8Array(C * R); touched = new Float64Array(C * R).fill(-1);
    ax = C >> 1; ay = R >> 1; dir = 0; steps = 0;
  };
  const resize = () => {
    D = Math.min(devicePixelRatio, 2); W = stage.clientWidth || 1; H = stage.clientHeight || 1;
    canvas.width = Math.round(W * D); canvas.height = Math.round(H * D);
    const c = Math.ceil(W / cp()), r = Math.ceil(H / cp());
    if (c === C && r === R) return;
    C = c; R = r;
    off.width = C; off.height = R; img = octx.createImageData(C, R); reset();
    const s = Math.round(cp() * D), g = document.createElement('canvas'); g.width = g.height = s;
    const gc = g.getContext('2d'), w = Math.max(1, Math.round(D * 0.75));
    gc.fillStyle = '#080506'; gc.fillRect(0, 0, s, w); gc.fillRect(0, 0, w, s);
    grid = ctx.createPattern(g, 'repeat');
  };
  const ro = new ResizeObserver(resize); ro.observe(stage); resize();

  const DX = [0, 1, 0, -1], DY = [-1, 0, 1, 0];
  const advance = n => {
    for (let k = 0; k < n; k++) {
      const i = ay * C + ax, s = cell[i];
      dir = (dir + (s ? 3 : 1)) & 3;          // empty: turn right, filled: turn left
      cell[i] = s ^ 1; touched[i] = steps++;
      ax = (ax + DX[dir] + C) % C; ay = (ay + DY[dir] + R) % R;
    }
  };

  const draw = () => {
    const px = new Uint32Array(img.data.buffer), span = Math.max(4000, steps * 0.6);
    for (let i = 0; i < C * R; i++) {
      const t = touched[i];
      if (t < 0) px[i] = BG;
      else if (!cell[i]) px[i] = VISITED;
      else px[i] = LUT[Math.min(255, ((steps - t) / span) * 255) | 0];
    }
    octx.putImageData(img, 0, 0);
    ctx.imageSmoothingEnabled = false;
    const s = cp() * D;
    ctx.fillStyle = '#0e0908'; ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(off, 0, 0, C * s, R * s);
    ctx.fillStyle = grid; ctx.fillRect(0, 0, canvas.width, canvas.height);
    // the ant: a bright cell with a soft halo
    const x = (ax + 0.5) * s, y = (ay + 0.5) * s;
    const g = ctx.createRadialGradient(x, y, 0, x, y, s * 5);
    g.addColorStop(0, 'rgba(120,255,230,0.55)'); g.addColorStop(1, 'rgba(120,255,230,0)');
    ctx.fillStyle = g; ctx.fillRect(x - s * 5, y - s * 5, s * 10, s * 10);
    ctx.fillStyle = '#c8fff2'; ctx.fillRect(ax * s, ay * s, s, s);
  };

  let raf, hold = 0;
  function frame() {
    if (hold > 0) { hold--; if (!hold) reset(); }
    else {
      if (reduce && steps === 0) advance(12000);                 // reduced motion: start where the highway leaves
      advance(Math.max(1, Math.round(PARAMS.speed * (reduce ? 0.05 : 1))));
      // after the highway has wrapped around a few times the board gets busy: pause on it, then start over
      if (steps > C * R * 9) hold = 90;
    }
    draw();
    raf = requestAnimationFrame(frame);
  }
  raf = requestAnimationFrame(frame);
  return () => { cancelAnimationFrame(raf); ro.disconnect(); canvas.remove(); };
}
