// States of matter: 950 atoms and one force law (Lennard-Jones: strong repulsion up close, gentle attraction a
// little further out). A thermostat slowly lowers the temperature. Hot, the atoms are a gas bouncing round the box;
// cooler, they stick in droplets that rain into a pool; colder still, the pool freezes into a hexagonal crystal with
// grain boundaries where crystals that started in different places meet. Then it heats up and melts again. Atoms are
// coloured by speed (that is temperature), and bonds are drawn between close neighbours, so you see the lattice form.
const PARAMS = { atoms: 950, gravity: 1, cycle: 1 };

export default function (stage) {
  const canvas = document.createElement('canvas');
  canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block;background:#06080c';
  stage.append(canvas);
  const ctx = canvas.getContext('2d');
  let W = 1, H = 1;
  const N = Math.max(200, Math.round(PARAMS.atoms));
  // reduced units: σ = 1 (atom size), ε = 1, mass 1. The box is 34 σ tall, as wide as the stage allows
  let BX = 56, BY = 34;
  const x = new Float32Array(N), y = new Float32Array(N), vx = new Float32Array(N), vy = new Float32Array(N), fx = new Float32Array(N), fy = new Float32Array(N);
  const nb = new Uint8Array(N);
  function place() {
    const cols = Math.ceil(Math.sqrt(N * BX / BY)), dx = BX / cols, rows = Math.ceil(N / cols), dy = BY / rows;
    for (let i = 0; i < N; i++) { x[i] = ((i % cols) + 0.5) * dx; y[i] = (((i / cols) | 0) + 0.5) * dy; const a = Math.random() * 6.283, s = 1.4; vx[i] = Math.cos(a) * s; vy[i] = Math.sin(a) * s; }
  }
  const resize = () => {
    const d = Math.min(devicePixelRatio, 2); W = stage.clientWidth || 1; H = stage.clientHeight || 1;
    canvas.width = Math.max(1, (W * d) | 0); canvas.height = Math.max(1, (H * d) | 0); ctx.setTransform(d, 0, 0, d, 0, 0);
    const nbx = Math.max(30, Math.min(80, Math.round(34 * W / H))); if (nbx !== BX) { BX = nbx; place(); }
  };
  place();
  const ro = new ResizeObserver(resize); ro.observe(stage); resize();

  const RC = 2.5, RC2 = RC * RC, CELL = RC;
  let gx = 1, gy = 1, head = new Int32Array(1), next = new Int32Array(N);
  function forces() {
    gx = Math.max(1, Math.floor(BX / CELL)); gy = Math.max(1, Math.floor(BY / CELL));
    if (head.length !== gx * gy) head = new Int32Array(gx * gy);
    head.fill(-1);
    for (let i = 0; i < N; i++) { const c = Math.min(gx - 1, Math.max(0, (x[i] / BX * gx) | 0)) * gy + Math.min(gy - 1, Math.max(0, (y[i] / BY * gy) | 0)); next[i] = head[c]; head[c] = i; }
    fx.fill(0); fy.fill(0); nb.fill(0);
    const G = 0.14 * PARAMS.gravity;
    for (let cxI = 0; cxI < gx; cxI++) for (let cyI = 0; cyI < gy; cyI++) {
      for (let i = head[cxI * gy + cyI]; i >= 0; i = next[i]) {
        for (let ox = 0; ox <= 1; ox++) for (let oy = -1; oy <= 1; oy++) {
          if (ox === 0 && oy < 0) continue;                       // each neighbouring pair of cells once
          const ncx = cxI + ox, ncy = cyI + oy; if (ncx >= gx || ncy < 0 || ncy >= gy) continue;
          for (let j = head[ncx * gy + ncy]; j >= 0; j = next[j]) {
            if (ox === 0 && oy === 0 && j <= i) continue;
            const dx = x[j] - x[i], dy = y[j] - y[i], r2 = dx * dx + dy * dy;
            if (r2 > RC2 || r2 < 1e-6) continue;
            const ir2 = 1 / Math.max(r2, 0.64), ir6 = ir2 * ir2 * ir2, f = 24 * ir2 * ir6 * (2 * ir6 - 1);   // −dU/dr ÷ r for U = 4(r⁻¹² − r⁻⁶)
            fx[i] -= f * dx; fy[i] -= f * dy; fx[j] += f * dx; fy[j] += f * dy;
            if (r2 < 1.44) { nb[i]++; nb[j]++; }
          }
        }
      }
      for (let i = head[cxI * gy + cyI]; i >= 0; i = next[i]) fy[i] += G;   // gravity pulls toward the floor (down the screen)
    }
  }
  forces();
  // the thermostat's target: hot gas → cooling → frozen → reheating, on a loop
  const targetT = s => { const c = 40 / PARAMS.cycle, p = (s % c) / c; return p < 0.12 ? 1.6 : p < 0.55 ? 1.6 - 1.45 * ((p - 0.12) / 0.43) : p < 0.82 ? 0.15 : 0.15 + 1.45 * ((p - 0.82) / 0.18); };
  const stateOf = T => T > 1.0 ? 'gas' : T > 0.43 ? 'liquid' : 'solid';

  let raf, last = performance.now(), time = 0, Tnow = 1.6;
  function frame(now) {
    const fdt = Math.min(0.05, (now - last) / 1000); last = now; time += fdt;
    const h = 0.005, T0 = targetT(time);
    for (let s = 0; s < 8; s++) {                                 // velocity Verlet
      for (let i = 0; i < N; i++) { vx[i] += 0.5 * h * fx[i]; vy[i] += 0.5 * h * fy[i]; x[i] += h * vx[i]; y[i] += h * vy[i];
        if (x[i] < 0.5) { x[i] = 0.5; vx[i] = Math.abs(vx[i]); } else if (x[i] > BX - 0.5) { x[i] = BX - 0.5; vx[i] = -Math.abs(vx[i]); }
        if (y[i] < 0.5) { y[i] = 0.5; vy[i] = Math.abs(vy[i]); } else if (y[i] > BY - 0.5) { y[i] = BY - 0.5; vy[i] = -Math.abs(vy[i]); } }
      forces();
      let ke = 0;
      for (let i = 0; i < N; i++) { vx[i] += 0.5 * h * fx[i]; vy[i] += 0.5 * h * fy[i]; ke += vx[i] * vx[i] + vy[i] * vy[i]; }
      Tnow = ke / (2 * N);                                          // 2D: kT = ⟨v²⟩ / 2
      const lam = Math.sqrt(1 + (h / 0.4) * (T0 / Math.max(Tnow, 1e-3) - 1));   // Berendsen: nudge every speed toward the target
      for (let i = 0; i < N; i++) { vx[i] *= lam; vy[i] *= lam; }
    }
    // draw: fit the box to the stage
    const sc = Math.min(W / BX, H / BY), ox = (W - BX * sc) / 2, oy = (H - BY * sc) / 2;
    ctx.fillStyle = '#06080c'; ctx.fillRect(0, 0, W, H);
    // bonds between close neighbours: the lattice
    ctx.lineWidth = Math.max(0.7, sc * 0.11); ctx.strokeStyle = 'rgba(150,205,255,.5)'; ctx.beginPath();
    for (let c = 0; c < gx * gy; c++) for (let i = head[c]; i >= 0; i = next[i]) {
      const cxI = (c / gy) | 0, cyI = c % gy;
      for (let ox2 = 0; ox2 <= 1; ox2++) for (let oy2 = -1; oy2 <= 1; oy2++) {
        if (ox2 === 0 && oy2 < 0) continue; const ncx = cxI + ox2, ncy = cyI + oy2; if (ncx >= gx || ncy < 0 || ncy >= gy) continue;
        for (let j = head[ncx * gy + ncy]; j >= 0; j = next[j]) {
          if (ox2 === 0 && oy2 === 0 && j <= i) continue;
          const dx = x[j] - x[i], dy = y[j] - y[i]; if (dx * dx + dy * dy < 1.3) { ctx.moveTo(ox + x[i] * sc, oy + y[i] * sc); ctx.lineTo(ox + x[j] * sc, oy + y[j] * sc); }
        }
      }
    }
    ctx.stroke();
    // atoms: colour by speed; six close neighbours means sitting in a hexagonal crystal, which gets a cool highlight
    const r = Math.max(1.4, sc * 0.25);
    for (let i = 0; i < N; i++) {
      const v = Math.sqrt(vx[i] * vx[i] + vy[i] * vy[i]), k = Math.min(1, v / 2.4);
      const cr = 70 + 185 * k, cg = 150 + 40 * k - 60 * k * k, cb = 255 - 200 * k;
      ctx.fillStyle = nb[i] >= 6 ? `rgb(${Math.min(255, cr * 0.7 + 60)},${Math.min(255, cg + 70)},255)` : `rgb(${cr | 0},${cg | 0},${cb | 0})`;
      ctx.beginPath(); ctx.arc(ox + x[i] * sc, oy + y[i] * sc, r, 0, 6.283); ctx.fill();
    }
    ctx.strokeStyle = 'rgba(200,215,235,.18)'; ctx.lineWidth = 1; ctx.strokeRect(ox, oy, BX * sc, BY * sc);
    // a thermometer
    const tx = ox + 12, ty = oy + 14, th = Math.min(120, BY * sc * 0.4), fill = Math.min(1, Tnow / 1.8);
    ctx.fillStyle = 'rgba(255,255,255,.08)'; ctx.fillRect(tx, ty, 6, th);
    ctx.fillStyle = `rgb(${90 + 165 * fill | 0},${150 - 40 * fill | 0},${255 - 200 * fill | 0})`; ctx.fillRect(tx, ty + th * (1 - fill), 6, th * fill);
    ctx.fillStyle = 'rgba(225,232,245,.75)'; ctx.font = '500 12px ui-monospace, Menlo, monospace'; ctx.textBaseline = 'top';
    ctx.fillText(`T ${Tnow.toFixed(2)}  ${stateOf(Tnow)}`, tx + 14, ty);
    raf = requestAnimationFrame(frame);
  }
  raf = requestAnimationFrame(frame);
  return () => { cancelAnimationFrame(raf); ro.disconnect(); canvas.remove(); };
}
