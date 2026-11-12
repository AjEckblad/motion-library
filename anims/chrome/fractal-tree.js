// 3D fractal tree: a trunk that splits into three branches, each turned about the parent's axis by the golden angle
// and tilted outward, each shorter and thinner, eight levels deep. The whole tree grows in: a branch only starts once
// its parent is full length, with an ease-out so each one shoots then settles. Wind sways every branch by an amount
// that grows toward the tips, blossoms open at the ends, petals drift down, and the camera circles the tree.
const PARAMS = { depth: 7, wind: 1 };

export default function (stage) {
  const canvas = document.createElement('canvas');
  canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block';
  stage.append(canvas);
  const ctx = canvas.getContext('2d');
  let W = 0, H = 0;
  const resize = () => { const d = Math.min(devicePixelRatio, 2); W = stage.clientWidth || 1; H = stage.clientHeight || 1; canvas.width = W * d; canvas.height = H * d; ctx.setTransform(d, 0, 0, d, 0, 0); };
  const ro = new ResizeObserver(resize); ro.observe(stage); resize();
  // build the branch list once: each with a level, a parent, a direction offset and a length
  const GA = Math.PI * (3 - Math.sqrt(5)), D = Math.round(PARAMS.depth), branches = [];
  let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  (function grow(parent, level, yaw, pitch, len) {
    const b = { parent, level, yaw, pitch, len, i: branches.length }; branches.push(b);
    if (level >= D) return;
    for (let k = 0; k < 3; k++) grow(b, level + 1, yaw + k * 2.1 + GA * level + (rnd() - 0.5) * 0.6, 0.45 + rnd() * 0.25, len * (0.68 + rnd() * 0.1));
  })(null, 0, 0, 0, 1);
  const petals = Array.from({ length: 60 }, () => ({ x: (rnd() - 0.5) * 3, y: rnd() * 3, z: (rnd() - 0.5) * 3, ph: rnd() * 6.28 }));
  const ease = x => 1 - (1 - Math.min(1, Math.max(0, x))) ** 3;
  let raf; const t0 = performance.now();
  function frame(now) {
    const t = (now - t0) / 1000, S = Math.min(W, H), cycle = 16, g = (t % cycle) * 1.6;   // grow, hold, regrow
    const bg = ctx.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, '#1b1530'); bg.addColorStop(1, '#3a2340');
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.beginPath(); ctx.ellipse(W / 2, H * 0.93, S * 0.24, S * 0.03, 0, 0, 7); ctx.fill();
    const cam = t * 0.15, cc = Math.cos(cam), cs = Math.sin(cam);
    const proj = p => { const x = p[0] * cc - p[2] * cs, z = p[0] * cs + p[2] * cc, k = 4 / (4 + z); return [W / 2 + x * S * 0.17 * k, H * 0.93 - p[1] * S * 0.17 * k, z, k]; };
    // positions: walk the list (parents come first), building each branch's frame from its parent's
    const P = new Array(branches.length), segs = [];
    for (const b of branches) {
      const grown = ease(g - b.level * 0.55);                                // each level waits for the one before
      if (grown <= 0) continue;
      const sway = Math.sin(t * 1.3 + b.level * 0.7 + b.yaw) * 0.04 * b.level * PARAMS.wind;
      const base = b.parent ? P[b.parent.i].end : [0, 0, 0];
      const pd = b.parent ? P[b.parent.i].dir : [0, 1, 0];
      if (!base) continue;
      // tilt away from the parent's direction by pitch, around it by yaw
      const up = pd, side = Math.abs(up[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0];
      let a = [up[1] * side[2] - up[2] * side[1], up[2] * side[0] - up[0] * side[2], up[0] * side[1] - up[1] * side[0]]; const al = Math.hypot(...a); a = a.map(v => v / al);
      const c2 = [up[1] * a[2] - up[2] * a[1], up[2] * a[0] - up[0] * a[2], up[0] * a[1] - up[1] * a[0]];
      const yw = b.yaw + sway, pt = b.level ? b.pitch + sway * 0.5 : sway * 0.3;
      const dir = up.map((u, k) => u * Math.cos(pt) + (a[k] * Math.cos(yw) + c2[k] * Math.sin(yw)) * Math.sin(pt));
      const L = b.len * grown, end = base.map((v, k) => v + dir[k] * L);
      P[b.i] = { end: grown >= 1 ? end : end, dir };
      segs.push({ a: base, b: end, w: (D + 1 - b.level) ** 1.5 * 0.9, level: b.level, tip: b.level === D, grown });
    }
    const pr = segs.map(s => ({ s, A: proj(s.a), B: proj(s.b) }));
    pr.sort((x, y) => (y.A[2] + y.B[2]) - (x.A[2] + x.B[2]));               // far first
    ctx.lineCap = 'round';
    for (const { s, A, B } of pr) {
      const shade = 60 + s.level * 9 - (A[2] + B[2]) * 12;
      ctx.strokeStyle = `rgb(${shade + 30},${shade},${shade - 10})`; ctx.lineWidth = Math.max(0.6, s.w * A[3] * S / 500);
      ctx.beginPath(); ctx.moveTo(A[0], A[1]); ctx.lineTo(B[0], B[1]); ctx.stroke();
      if (s.tip && s.grown >= 1) {                                         // blossoms open at the tips
        const open = Math.min(1, (g - (D + 1) * 0.55) * 0.8);
        if (open > 0) { ctx.fillStyle = `rgba(255,${170 + (s.level * 13) % 40},${200},${0.75 * open})`; ctx.beginPath(); ctx.arc(B[0], B[1], S * 0.0055 * B[3] * (0.6 + open), 0, 7); ctx.fill(); }
      }
    }
    // petals falling
    ctx.fillStyle = 'rgba(255,190,215,.8)';
    for (const p of petals) {
      p.y -= 0.004; p.x += Math.sin(t + p.ph) * 0.004 * PARAMS.wind; if (p.y < 0) p.y = 3;
      if (g < (D + 2) * 0.55) continue;
      const [x, y, , k] = proj([p.x, p.y, p.z]); ctx.beginPath(); ctx.ellipse(x, y, 2.2 * k, 1.3 * k, t + p.ph, 0, 7); ctx.fill();
    }
    raf = requestAnimationFrame(frame);
  }
  raf = requestAnimationFrame(frame);
  return () => { cancelAnimationFrame(raf); ro.disconnect(); canvas.remove(); };
}
