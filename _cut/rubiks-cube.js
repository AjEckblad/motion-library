// Rubik's cube in CSS 3D: 27 little cubes (cubies), each a div with six faces. A cubie stores where it is and how it is
// turned; a move turns one layer of nine a quarter turn with a strong ease-in-out, and when it lands the turn is
// baked into each cubie's position and orientation (rounded back to whole numbers, so errors never pile up). It
// scrambles with random moves, pauses, then plays them backwards to solve itself. Only outward faces carry stickers.
const PARAMS = { moves: 14, turn: 0.42 };

export default function (stage) {
  const wrap = document.createElement('div');
  wrap.style.cssText = 'position:absolute;inset:0;perspective:900px;background:radial-gradient(circle at 50% 40%,#2b3140,#0e1016 75%);overflow:hidden';
  const scene = document.createElement('div');
  scene.style.cssText = 'position:absolute;left:50%;top:50%;width:0;height:0;transform-style:preserve-3d';
  wrap.append(scene); stage.append(wrap);
  let S = 60;
  const resize = () => { S = Math.min(stage.clientWidth, stage.clientHeight) * 0.17; build(); };
  const COL = { px: '#c4151c', nx: '#ff7a00', py: '#ffffff', ny: '#ffd500', pz: '#009b48', nz: '#0046ad' };
  const DIRS = [['px', [1, 0, 0], 'rotateY(90deg)'], ['nx', [-1, 0, 0], 'rotateY(-90deg)'], ['py', [0, -1, 0], 'rotateX(90deg)'], ['ny', [0, 1, 0], 'rotateX(-90deg)'], ['pz', [0, 0, 1], ''], ['nz', [0, 0, -1], 'rotateY(180deg)']];
  let cubies = [];
  function build() {
    scene.replaceChildren(); cubies = [];
    for (let x = -1; x <= 1; x++) for (let y = -1; y <= 1; y++) for (let z = -1; z <= 1; z++) {
      const el = document.createElement('div');
      el.style.cssText = `position:absolute;left:${-S / 2}px;top:${-S / 2}px;width:${S}px;height:${S}px;transform-style:preserve-3d`;
      for (const [k, d, rot] of DIRS) {
        const f = document.createElement('div'), outward = d[0] === x && x || d[1] === y && y || d[2] === z && z;
        f.style.cssText = `position:absolute;inset:0;background:#111;transform:${rot} translateZ(${S / 2}px);backface-visibility:hidden;border-radius:${S * 0.08}px`;
        if (outward) { const st = document.createElement('div'); st.style.cssText = `position:absolute;inset:${S * 0.06}px;border-radius:${S * 0.1}px;background:${COL[k]};box-shadow:inset 0 0 ${S * 0.2}px rgba(0,0,0,.18)`; f.append(st); }
        el.append(f);
      }
      scene.append(el);
      cubies.push({ el, p: [x, y, z], m: [1, 0, 0, 0, 1, 0, 0, 0, 1] });   // position and a 3×3 orientation (row-major)
    }
  }
  const ro = new ResizeObserver(resize); ro.observe(stage); resize();
  // rotation matrix for a quarter turn (or part of one) about axis a (0 x, 1 y, 2 z)
  const R = (a, ang) => { const c = Math.cos(ang), s = Math.sin(ang); return a === 0 ? [1, 0, 0, 0, c, -s, 0, s, c] : a === 1 ? [c, 0, s, 0, 1, 0, -s, 0, c] : [c, -s, 0, s, c, 0, 0, 0, 1]; };
  const mm = (A, B) => { const o = []; for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) o.push(A[i * 3] * B[j] + A[i * 3 + 1] * B[3 + j] + A[i * 3 + 2] * B[6 + j]); return o; };
  const mv = (A, v) => [A[0] * v[0] + A[1] * v[1] + A[2] * v[2], A[3] * v[0] + A[4] * v[1] + A[5] * v[2], A[6] * v[0] + A[7] * v[1] + A[8] * v[2]];
  const css = (m, p) => `matrix3d(${m[0]},${m[3]},${m[6]},0,${m[1]},${m[4]},${m[7]},0,${m[2]},${m[5]},${m[8]},0,${p[0] * S * 1.04},${p[1] * S * 1.04},${p[2] * S * 1.04},1)`;
  const ease = x => x < 0.5 ? 4 * x * x * x : 1 - (-2 * x + 2) ** 3 / 2;   // strong ease-in-out: a decisive flick
  let queue = [], hist = [], cur = null, phase = 'scramble', wait = 0.6;
  const plan = () => { queue = []; let lastA = -1; for (let i = 0; i < Math.round(PARAMS.moves); i++) { let a; do a = Math.random() * 3 | 0; while (a === lastA); lastA = a; queue.push({ a, layer: (Math.random() * 3 | 0) - 1, dir: Math.random() < 0.5 ? 1 : -1 }); } };
  plan();
  let raf, last = performance.now();
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    const t = now / 1000;
    if (!cur) {
      if (wait > 0) wait -= dt;
      else if (queue.length) { cur = { ...queue.shift(), k: 0 }; }
      else if (phase === 'scramble') { phase = 'solve'; queue = hist.reverse().map(m => ({ ...m, dir: -m.dir })); hist = []; wait = 0.9; }
      else { phase = 'scramble'; plan(); wait = 1.6; }
    }
    let turnM = null;
    if (cur) {
      cur.k = Math.min(1, cur.k + dt / Math.max(0.12, PARAMS.turn));
      turnM = R(cur.a, cur.dir * Math.PI / 2 * ease(cur.k));
      if (cur.k >= 1) {                                                    // bake the turn in, snapped to whole numbers
        const Q = R(cur.a, cur.dir * Math.PI / 2).map(Math.round);
        for (const c of cubies) if (c.p[cur.a] === cur.layer) { c.p = mv(Q, c.p).map(Math.round); c.m = mm(Q, c.m).map(Math.round); }
        if (phase === 'scramble') hist.push({ a: cur.a, layer: cur.layer, dir: cur.dir });
        cur = null; turnM = null; wait = phase === 'solve' ? 0.04 : 0.08;
      }
    }
    const view = mm(R(0, -0.5 + Math.sin(t * 0.3) * 0.12), R(1, 0.65 + t * 0.25));   // a slow orbit
    for (const c of cubies) {
      let m = c.m, p = c.p;
      if (turnM && c.p[cur.a] === cur.layer) { m = mm(turnM, m); p = mv(turnM, p); }
      c.el.style.transform = css(mm(view, m), mv(view, p));
    }
    raf = requestAnimationFrame(frame);
  }
  raf = requestAnimationFrame(frame);
  return () => { cancelAnimationFrame(raf); ro.disconnect(); wrap.remove(); };
}
