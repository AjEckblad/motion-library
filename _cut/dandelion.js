// Dandelion clock: a sphere of seeds (spread evenly by the golden angle) turning slowly in 3D. Gusts tear seeds loose
// from the windward side; each one then floats on its parachute, tumbling slowly, carried by the gust and sinking a
// little. A seed is a thin stalk with a fan of fine filaments, drawn in perspective. When the head is bare it regrows.
const PARAMS = { seeds: 150, wind: 1 };

export default function (stage) {
  const canvas = document.createElement('canvas');
  canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block';
  stage.append(canvas);
  const ctx = canvas.getContext('2d');
  let W = 0, H = 0;
  const resize = () => { const d = Math.min(devicePixelRatio, 2); W = stage.clientWidth || 1; H = stage.clientHeight || 1; canvas.width = W * d; canvas.height = H * d; ctx.setTransform(d, 0, 0, d, 0, 0); };
  const ro = new ResizeObserver(resize); ro.observe(stage); resize();

  const N = Math.round(PARAMS.seeds), GA = Math.PI * (3 - Math.sqrt(5));
  let seeds = [];
  const grow = () => {
    seeds = Array.from({ length: N }, (_, i) => {
      const y = 1 - (i + 0.5) / N * 2, r = Math.sqrt(1 - y * y), a = i * GA;   // even points on a sphere
      return { d: [Math.cos(a) * r, y, Math.sin(a) * r], free: false, x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0, spin: 0, tilt: 0, fade: 1 };
    });
  };
  grow();
  let raf, last = performance.now(), regrow = 0;
  function frame(now) {
    const dt = Math.min(0.033, (now - last) / 1000); last = now;
    const t = now / 1000, S = Math.min(W, H), head = { x: W * 0.36, y: H * 0.45 }, R = S * 0.19;
    const gust = Math.max(0, Math.sin(t * 0.55) * 0.7 + Math.sin(t * 1.3) * 0.3) * PARAMS.wind;   // gusts come and go
    const bg = ctx.createLinearGradient(0, 0, W, H); bg.addColorStop(0, '#2f4d3f'); bg.addColorStop(1, '#14231d');
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
    // soft bokeh behind
    for (let i = 0; i < 9; i++) { const x = (i * 0.13 + 0.05) % 1 * W, y = ((i * 0.37) % 1) * H, r = S * (0.05 + (i % 3) * 0.03); const g = ctx.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, 'rgba(210,235,170,.10)'); g.addColorStop(1, 'rgba(210,235,170,0)'); ctx.fillStyle = g; ctx.fillRect(x - r, y - r, r * 2, r * 2); }
    // stem
    ctx.strokeStyle = '#6f8f5a'; ctx.lineWidth = S * 0.012; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(head.x, head.y); ctx.quadraticCurveTo(head.x - S * 0.04, head.y + S * 0.4, head.x + S * 0.02, H + 10); ctx.stroke();
    ctx.fillStyle = '#7d6b3c'; ctx.beginPath(); ctx.arc(head.x, head.y, S * 0.025, 0, 7); ctx.fill();
    const rot = t * 0.25, cr = Math.cos(rot), sr = Math.sin(rot), F = S * 2.2;
    const proj = (x, y, z) => { const k = F / (F + z * R); return [head.x + x * R * k, head.y - y * R * k, k]; };
    const list = [];
    let attached = 0;
    for (const s of seeds) {
      if (!s.free) {
        attached++;
        const dx = s.d[0] * cr - s.d[2] * sr, dz = s.d[0] * sr + s.d[2] * cr;
        // the wind takes seeds from the side it blows from, a few at a time
        if (gust > 0.4 && dx < -0.2 && Math.random() < gust * dt * 0.9) {
          Object.assign(s, { free: true, x: dx, y: s.d[1], z: dz, vx: 0.4 + gust * 1.2, vy: 0.2 + Math.random() * 0.4, vz: (Math.random() - 0.5) * 0.6, spin: (Math.random() - 0.5) * 2, tilt: Math.atan2(s.d[1], dx) });
        } else { list.push({ s, x: dx, y: s.d[1], z: dz, a: Math.atan2(s.d[1], dx), att: true }); continue; }
      }
      // floating: drag pulls it toward the wind's speed, it sinks slowly, and it tumbles a little
      s.vx += ((0.5 + gust * 1.6) - s.vx) * dt * 0.8; s.vy += (-0.12 - s.vy) * dt * 0.6 + Math.sin(t * 2 + s.spin * 9) * dt * 0.3; s.vz *= 1 - dt * 0.5;
      s.x += s.vx * dt; s.y += s.vy * dt; s.z += s.vz * dt; s.tilt += s.spin * dt * 0.6;
      if (head.x + s.x * R > W + 60 || head.y - s.y * R > H + 60) { s.fade = 0; continue; }
      list.push({ s, x: s.x, y: s.y, z: s.z, a: s.tilt + Math.sin(t + s.spin * 5) * 0.4, att: false });
    }
    list.sort((p, q) => q.z - p.z);                                         // far first
    for (const it of list) {
      const [x, y, k] = proj(it.x, it.y, it.z), len = R * 0.55 * k, ca = Math.cos(it.a), sa = Math.sin(it.a);
      // attached seeds point outward from the head; free ones hang under their parachute
      const ux = it.att ? ca : Math.sin(it.a * 0.3) * 0.5, uy = it.att ? -sa : -1;
      const bx = it.att ? head.x + (x - head.x) * 0.25 : x - ux * len * 0.6, by = it.att ? head.y + (y - head.y) * 0.25 : y - uy * len * 0.6;
      const tx = it.att ? x : x + ux * len * 0.4, ty = it.att ? y : y + uy * len * 0.4;
      const a = Math.min(1, 0.45 + k * 0.55);
      ctx.strokeStyle = `rgba(240,236,220,${a * 0.7})`; ctx.lineWidth = Math.max(0.5, k * 0.8);
      ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(tx, ty); ctx.stroke();
      ctx.fillStyle = `rgba(120,100,60,${a})`; ctx.beginPath(); ctx.arc(bx, by, 1.2 * k, 0, 7); ctx.fill();
      // the pappus: a fan of filaments, foreshortened by how it faces us
      ctx.strokeStyle = `rgba(255,255,250,${a * 0.55})`; ctx.lineWidth = 0.5;
      const pr = len * 0.42, dirA = Math.atan2(ty - by, tx - bx);
      ctx.beginPath();
      for (let j = 0; j < 14; j++) { const q = dirA + (j / 13 - 0.5) * 2.6; ctx.moveTo(tx, ty); ctx.lineTo(tx + Math.cos(q) * pr, ty + Math.sin(q) * pr * (0.55 + 0.45 * Math.abs(Math.cos(t * 0.3 + j)))); }
      ctx.stroke();
    }
    seeds = seeds.filter(s => s.fade > 0);
    if (!attached && !seeds.length) { regrow += dt; if (regrow > 1.2) { grow(); regrow = 0; } }
    raf = requestAnimationFrame(frame);
  }
  raf = requestAnimationFrame(frame);
  return () => { cancelAnimationFrame(raf); ro.disconnect(); canvas.remove(); };
}
