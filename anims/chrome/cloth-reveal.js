// Cloth reveal: a silk sheet falls over something on a plinth, tents over its points, and is whipped off by one corner
// to unveil a chrome star: a small stellated dodecahedron mounted on one of its twelve spikes. The sheet is a grid
// of points joined by distance constraints (neighbours, diagonals, and every second point, so it resists folding too
// sharply), moved with Verlet integration and solved a few times a frame; it collides with the star's core and with
// each spike as a cone, so the silk hangs from the tips. The star's faces are flat mirrors of a lit studio.
const PARAMS = { grid: 46, stiffness: 1, speed: 1 };

export default function (stage) {
  const canvas = document.createElement('canvas');
  canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block';
  stage.append(canvas);
  const gl = canvas.getContext('webgl2', { antialias: true });
  if (!gl) { stage.textContent = 'This needs WebGL2.'; return () => canvas.remove(); }
  const G = Math.max(16, Math.min(70, Math.round(PARAMS.grid))), NP = G * G, SIZE = 3.4, SC = [0, 1.55, 0], PED = 0.55;
  // the star: a dodecahedron with a five-sided pyramid on every face, each pyramid's sides in the planes of the
  // neighbouring faces. Its spikes point along an icosahedron's vertices, √5 times the core's inradius out.
  const A = 0.86, D = A / Math.sqrt(5), BR = D * 0.7639, CORE = D * 1.08, MG = 0.035, PHI = (1 + Math.sqrt(5)) / 2;
  const turn = (() => {                                        // mount it on a spike: one spike straight up, one straight down
    const ax = [-1, 0, 0], an = Math.acos(1 / Math.sqrt(1 + PHI * PHI)), c = Math.cos(an), sn = Math.sin(an), yaw = 0.35;
    return v => { const d = ax[0] * v[0] + ax[1] * v[1] + ax[2] * v[2], cr = [ax[1] * v[2] - ax[2] * v[1], ax[2] * v[0] - ax[0] * v[2], ax[0] * v[1] - ax[1] * v[0]];
      const r = v.map((x, i) => x * c + cr[i] * sn + ax[i] * d * (1 - c)); return [r[0] * Math.cos(yaw) - r[2] * Math.sin(yaw), r[1], r[0] * Math.sin(yaw) + r[2] * Math.cos(yaw)]; };
  })();
  const nz = v => { const l = Math.hypot(...v); return v.map(x => x / l); };
  const AX = [];
  for (const a of [-1, 1]) for (const b of [-PHI, PHI]) AX.push(nz([0, a, b]), nz([a, b, 0]), nz([b, 0, a]));
  const SPIKE = AX.map(turn), PT = SC[1] - A * 0.62;          // the plinth top, with the lowest spike sunk into it
  const x = new Float32Array(NP * 3), px = new Float32Array(NP * 3), cons = [];
  const id = (i, j) => j * G + i;
  for (let j = 0; j < G; j++) for (let i = 0; i < G; i++) {
    if (i < G - 1) cons.push(id(i, j), id(i + 1, j)); if (j < G - 1) cons.push(id(i, j), id(i, j + 1));
    if (i < G - 1 && j < G - 1) { cons.push(id(i, j), id(i + 1, j + 1)); cons.push(id(i + 1, j), id(i, j + 1)); }
    if (i < G - 2) cons.push(id(i, j), id(i + 2, j)); if (j < G - 2) cons.push(id(i, j), id(i, j + 2));
  }
  const C = new Int32Array(cons), rest = new Float32Array(C.length / 2);
  // silk snags on sharp points: the first bit of cloth to reach each upward tip stays caught there until the whip
  let snags = [], released = false;
  const mid = Uint8Array.from({ length: G * G }, (_, i) => Math.abs((i % G) / (G - 1) - 0.5) < 0.07 && Math.abs(Math.floor(i / G) / (G - 1) - 0.5) < 0.07 ? 1 : 0);
  function drop() {
    snags = []; released = false;
    for (let j = 0; j < G; j++) for (let i = 0; i < G; i++) { const k = id(i, j) * 3; x[k] = (i / (G - 1) - 0.5) * SIZE + (Math.random() - 0.5) * 0.002; x[k + 1] = 3.3; x[k + 2] = (j / (G - 1) - 0.5) * SIZE; px[k] = x[k]; px[k + 1] = x[k + 1]; px[k + 2] = x[k + 2]; }
    for (let c = 0; c < rest.length; c++) { const a = C[c * 2] * 3, b = C[c * 2 + 1] * 3; rest[c] = Math.hypot(x[a] - x[b], x[a + 1] - x[b + 1], x[a + 2] - x[b + 2]); }
  }
  drop();
  const collide = k => {
    let ox = x[k] - SC[0], oy = x[k + 1] - SC[1], oz = x[k + 2] - SC[2], hit = false;
    const out = (cx, cy, cz, vx, vy, vz, r) => { const l = Math.hypot(vx, vy, vz) || 1e-6; if (l >= r) return false; { x[k] = cx + vx * r / l; x[k + 1] = cy + vy * r / l; x[k + 2] = cz + vz * r / l; ox = x[k] - SC[0]; oy = x[k + 1] - SC[1]; oz = x[k + 2] - SC[2]; hit = true; return true; } };
    if (Math.hypot(ox, oy, oz) < A + MG) {
      out(SC[0], SC[1], SC[2], ox, oy, oz, CORE + MG);                // the core, roughly a ball
      for (let si = 0; si < 12; si++) {                               // each spike: a cone narrowing to its tip, and the tip itself
        const a = SPIKE[si];
        const s = ox * a[0] + oy * a[1] + oz * a[2];
        if (s > D * 0.7 && s < A) out(SC[0] + a[0] * s, SC[1] + a[1] * s, SC[2] + a[2] * s, ox - a[0] * s, oy - a[1] * s, oz - a[2] * s, BR * 0.9 * (A - s) / (A - D) + MG);
        else if (s >= A) out(SC[0] + a[0] * A, SC[1] + a[1] * A, SC[2] + a[2] * A, ox - a[0] * A, oy - a[1] * A, oz - a[2] * A, 0.08);   // wider than the grid's gaps, so no tip pokes through
        // the top tip catches the middle of the sheet as it lands, so the silk hangs from it like a tent
        if (!released && a[1] > 0.9 && mid[k / 3] && Math.hypot(ox - a[0] * A, oy - a[1] * A, oz - a[2] * A) < 0.11 && !snags.some(q => q.si === si)) snags.push({ si, k, p: [x[k], x[k + 1], x[k + 2]] });
      }
    }
    if (hit) { px[k] += (x[k] - px[k]) * 0.75; px[k + 1] += (x[k + 1] - px[k + 1]) * 0.75; px[k + 2] += (x[k + 2] - px[k + 2]) * 0.75; }   // silk catches on the points: friction every way
    const rr = Math.hypot(x[k], x[k + 2]);
    if (rr < PED + MG && x[k + 1] < PT + MG) { if (x[k + 1] > PT - 0.12) x[k + 1] = PT + MG; else { const f = (PED + MG) / rr; x[k] *= f; x[k + 2] *= f; } }
    if (x[k + 1] < 0.01) { x[k + 1] = 0.01; px[k] += (x[k] - px[k]) * 0.8; px[k + 2] += (x[k + 2] - px[k + 2]) * 0.8; }
  };
  function step(h, pin) {
    for (let i = 0; i < NP; i++) {
      const k = i * 3, vx = (x[k] - px[k]) * 0.995, vy = (x[k + 1] - px[k + 1]) * 0.995, vz = (x[k + 2] - px[k + 2]) * 0.995;
      px[k] = x[k]; px[k + 1] = x[k + 1]; px[k + 2] = x[k + 2];
      x[k] += vx; x[k + 1] += vy - 9.8 * h * h; x[k + 2] += vz;
    }
    const st = Math.min(1, PARAMS.stiffness);
    for (let it = 0; it < 10; it++) {
      for (let c = 0; c < rest.length; c++) {
        const a = C[c * 2] * 3, b = C[c * 2 + 1] * 3, dx = x[b] - x[a], dy = x[b + 1] - x[a + 1], dz = x[b + 2] - x[a + 2], d = Math.hypot(dx, dy, dz) || 1e-6;
        const f = (d - rest[c]) / d * 0.5 * st;
        x[a] += dx * f; x[a + 1] += dy * f; x[a + 2] += dz * f; x[b] -= dx * f; x[b + 1] -= dy * f; x[b + 2] -= dz * f;
      }
      if (pin) { const k = id(G - 1, G - 1) * 3; x[k] = pin[0]; x[k + 1] = pin[1]; x[k + 2] = pin[2]; }
      for (const q of snags) { x[q.k] = q.p[0]; x[q.k + 1] = q.p[1]; x[q.k + 2] = q.p[2]; px[q.k] = q.p[0]; px[q.k + 1] = q.p[1]; px[q.k + 2] = q.p[2]; }
      for (let i = 0; i < NP; i++) collide(i * 3);
    }
  }

  const sh = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s)); return s; };
  const prog = (vs, fs) => {
    const p = gl.createProgram(); gl.attachShader(p, sh(gl.VERTEX_SHADER, vs)); gl.attachShader(p, sh(gl.FRAGMENT_SHADER, fs)); gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
    const u = {}; for (let i = 0, n = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS); i < n; i++) { const nm = gl.getActiveUniform(p, i).name; u[nm] = gl.getUniformLocation(p, nm); }
    return { p, u };
  };
  // the studio the chrome reflects: a grey room, an overhead softbox, warm and cool strips, a white strip, and a bright
  // wall behind the camera with a horizon, so every facet catches something different
  const ENV = `vec3 env(vec3 d) {
    vec3 c = mix(vec3(.008, .008, .01), vec3(.1, .1, .115), smoothstep(-.15, .75, d.y));
    vec2 q = d.xz / max(d.y, .05);
    c += vec3(3.) * smoothstep(.04, .0, abs(q.x - .1) - .6) * smoothstep(.04, .0, abs(q.y + .2) - .2) * step(0., d.y);   // overhead softbox
    float az = atan(d.x, d.z), band = smoothstep(-.1, .15, d.y) * smoothstep(.85, .4, d.y);
    c += vec3(1., .55, .3) * 2.2 * smoothstep(.12, .03, abs(az - 1.9)) * band;                                          // warm strip
    c += vec3(.35, .6, 1.) * 2. * smoothstep(.12, .03, abs(az + 1.6)) * band;                                           // cool strip
    c += vec3(1.) * 1.6 * smoothstep(.05, .0, abs(fract(az * 1.9) - .5) - .44) * band * step(abs(az), 1.2);            // thin white strips ahead
    return c + vec3(1.3) * smoothstep(.2, .7, d.z) * smoothstep(-.12, -.05, d.y) * smoothstep(.9, .3, d.y);             // a wall of light behind us
  }`;
  const VS = `#version 300 es
  layout(location = 0) in vec3 P; layout(location = 1) in vec3 Nn; uniform mat4 M; out vec3 n; out vec3 w; void main() { n = Nn; w = P; gl_Position = M * vec4(P, 1); }`;
  const clothP = prog(VS, `#version 300 es
  precision highp float; in vec3 n; in vec3 w; out vec4 o; uniform vec3 E;
  void main() {
    vec3 V = normalize(E - w), N = normalize(n); if (dot(N, V) < 0.) N = -N;   // two-sided
    vec3 L = normalize(vec3(-.4, .9, .5)), H = normalize(L + V);
    float dif = max(dot(N, L), 0.) * .8 + .2, sheen = pow(1. - max(dot(N, V), 0.), 2.5), spec = pow(max(dot(N, H), 0.), 24.);
    vec3 silk = vec3(.42, .03, .07);
    vec3 c = silk * dif + vec3(.9, .3, .35) * sheen * .55 + vec3(1., .85, .85) * spec * .35;
    c *= .6 + .4 * smoothstep(-.05, .6, w.y);                     // folds near the floor sit in shadow
    o = vec4(pow(c, vec3(1. / 2.2)), 1);
  }`);
  const chromeP = prog(VS, `#version 300 es
  precision highp float; in vec3 n; in vec3 w; out vec4 o; uniform vec3 E; uniform float MAT;
  ${ENV}
  void main() {
    vec3 V = normalize(E - w), N = normalize(n), R = reflect(-V, N);
    vec3 c = MAT < .5 ? env(R) * vec3(.92, .94, .98) * (.6 + .4 * pow(1. - max(dot(N, V), 0.), 4.)) : vec3(.06, .055, .05) * (.4 + .6 * max(dot(N, normalize(vec3(-.4, .9, .5))), 0.)) + env(R) * .05;
    o = vec4(pow(c / (1. + c * .25), vec3(1. / 2.2)), 1);
  }`);
  const floorP = prog(`#version 300 es
  layout(location = 0) in vec2 P; uniform mat4 M; out vec2 g; void main() { g = P; gl_Position = M * vec4(P.x, 0, P.y, 1); }`, `#version 300 es
  precision highp float; in vec2 g; out vec4 o; void main() { float r = length(g); vec3 c = vec3(.07, .065, .07) * (1. - .55 * exp(-r * r * 1.4)) * smoothstep(9., 2., r); o = vec4(pow(c, vec3(1. / 2.2)), 1); }`);
  // meshes: the cloth (updated every frame), a sphere for the sculpture, a cylinder for the plinth
  const idx = []; for (let j = 0; j < G - 1; j++) for (let i = 0; i < G - 1; i++) idx.push(id(i, j), id(i + 1, j), id(i, j + 1), id(i + 1, j), id(i + 1, j + 1), id(i, j + 1));
  const cv = gl.createVertexArray(); gl.bindVertexArray(cv);
  const cb = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, cb); gl.bufferData(gl.ARRAY_BUFFER, NP * 24, gl.DYNAMIC_DRAW);
  gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 24, 0); gl.enableVertexAttribArray(1); gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 24, 12);
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, gl.createBuffer()); gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(idx), gl.STATIC_DRAW);
  const mesh = data => { const v = gl.createVertexArray(); gl.bindVertexArray(v); gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer()); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.STATIC_DRAW); gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 24, 0); gl.enableVertexAttribArray(1); gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 24, 12); return { v, n: data.length / 6 }; };
  // the star's mesh: over each face of the core, five flat triangles up to that face's spike tip
  const star = [], dv = [];
  for (const a of [-1, 1]) for (const b of [-1, 1]) { for (const c of [-1, 1]) dv.push([a, b, c]); dv.push([0, a / PHI, b * PHI], [a / PHI, b * PHI, 0], [a * PHI, 0, b / PHI]); }
  const sc = D / 1.37638;                                          // those twenty vertices sit 1.37638 from each face's plane
  const dot = (p, q) => p[0] * q[0] + p[1] * q[1] + p[2] * q[2];
  for (const n of AX) {
    const u = nz([n[1] - n[2], n[2] - n[0], n[0] - n[1]]), w = [n[1] * u[2] - n[2] * u[1], n[2] * u[0] - n[0] * u[2], n[0] * u[1] - n[1] * u[0]];
    const face = dv.slice().sort((p, q) => dot(q, n) - dot(p, n)).slice(0, 5).sort((p, q) => Math.atan2(dot(p, w), dot(p, u)) - Math.atan2(dot(q, w), dot(q, u)));
    const tip = turn(n.map(v => v * A));
    for (let i = 0; i < 5; i++) {
      const p0 = turn(face[i].map(v => v * sc)), p1 = turn(face[(i + 1) % 5].map(v => v * sc)), e1 = p1.map((v, j) => v - p0[j]), e2 = tip.map((v, j) => v - p0[j]);
      let fn = nz([e1[1] * e2[2] - e1[2] * e2[1], e1[2] * e2[0] - e1[0] * e2[2], e1[0] * e2[1] - e1[1] * e2[0]]);
      if (dot(fn, [p0[0] + p1[0] + tip[0], p0[1] + p1[1] + tip[1], p0[2] + p1[2] + tip[2]]) < 0) fn = fn.map(v => -v);   // facing out
      for (const q of [p0, p1, tip]) star.push(q[0] + SC[0], q[1] + SC[1], q[2] + SC[2], ...fn);
    }
  }
  const cyl = [];
  for (let b = 0; b < 48; b++) {
    const a0 = (b / 48) * Math.PI * 2, a1 = ((b + 1) / 48) * Math.PI * 2;
    for (const [a, y] of [[a0, 0], [a1, 0], [a0, PT], [a0, PT], [a1, 0], [a1, PT]]) cyl.push(Math.cos(a) * PED, y, Math.sin(a) * PED, Math.cos(a), 0, Math.sin(a));
    cyl.push(0, PT, 0, 0, 1, 0, Math.cos(a1) * PED, PT, Math.sin(a1) * PED, 0, 1, 0, Math.cos(a0) * PED, PT, Math.sin(a0) * PED, 0, 1, 0);   // the top
  }
  const sphM = mesh(star), cylM = mesh(cyl);
  const fv = gl.createVertexArray(); gl.bindVertexArray(fv); gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer()); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-12, -12, 12, -12, -12, 12, 12, -12, 12, 12, -12, 12]), gl.STATIC_DRAW); gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  gl.bindVertexArray(null);

  let W = 1, H = 1;
  const resize = () => { const d = Math.min(devicePixelRatio, 2); W = canvas.width = Math.max(1, (stage.clientWidth * d) | 0); H = canvas.height = Math.max(1, (stage.clientHeight * d) | 0); };
  const ro = new ResizeObserver(resize); ro.observe(stage); resize();
  let E = [0, 0, 0];
  const matrix = t => {
    const az = 0.5 + 0.15 * Math.sin(t * 0.2), el = 0.26, dist = 5.4; E = [Math.sin(az) * Math.cos(el) * dist, 1.0 + Math.sin(el) * dist, Math.cos(az) * Math.cos(el) * dist]; const T = [0, 1.4, 0];
    const f = T.map((v, i) => v - E[i]), fl = Math.hypot(...f); for (let i = 0; i < 3; i++) f[i] /= fl;
    const rl = Math.hypot(f[2], f[0]), r = [-f[2] / rl, 0, f[0] / rl], u = [r[1] * f[2] - r[2] * f[1], r[2] * f[0] - r[0] * f[2], r[0] * f[1] - r[1] * f[0]];
    const V = [r[0], u[0], -f[0], 0, r[1], u[1], -f[1], 0, r[2], u[2], -f[2], 0, -(r[0] * E[0] + r[1] * E[1] + r[2] * E[2]), -(u[0] * E[0] + u[1] * E[1] + u[2] * E[2]), f[0] * E[0] + f[1] * E[1] + f[2] * E[2], 1];
    const F = 1 / Math.tan(0.38), A = W / H, n = 0.1, fa = 60, nf = 1 / (n - fa), P = [F / A, 0, 0, 0, 0, F, 0, 0, 0, 0, (fa + n) * nf, -1, 0, 0, 2 * fa * n * nf, 0], out = new Float32Array(16);
    for (let c = 0; c < 4; c++) for (let rr = 0; rr < 4; rr++) { let s = 0; for (let k = 0; k < 4; k++) s += P[k * 4 + rr] * V[c * 4 + k]; out[c * 4 + rr] = s; }
    return out;
  };
  const verts = new Float32Array(NP * 6), nrm = new Float32Array(NP * 3);
  let raf, last = performance.now(), t = 0, c = 0, grab = null;
  function frame(now) {
    const dt = Math.min(0.033, (now - last) / 1000) * PARAMS.speed; last = now; t += dt; c += dt;
    // falls and drapes (3.2 s), a corner is grabbed and whipped up and away (1.8 s), the sculpture alone (2.6 s), again
    let pin = null;
    if (c > 3.2 && c < 5) {
      if (!grab) { const k = id(G - 1, G - 1) * 3; grab = [x[k], x[k + 1], x[k + 2]]; released = true; snags = []; }
      const u = (c - 3.2) / 1.8, e = u * u;
      pin = [grab[0] + 5.5 * e, grab[1] + 4.5 * Math.sin(Math.min(1, u * 1.3) * Math.PI / 2) + 1.5 * e, grab[2] - 3 * e];   // up and away, past the star's right
    }
    if (c > 7.6) { c = 0; grab = null; drop(); }
    const sub = 2; for (let s = 0; s < sub; s++) step(dt / sub, pin);
    // normals for the silk
    nrm.fill(0);
    for (let q = 0; q < idx.length; q += 3) {
      const a = idx[q] * 3, b = idx[q + 1] * 3, d = idx[q + 2] * 3, ux = x[b] - x[a], uy = x[b + 1] - x[a + 1], uz = x[b + 2] - x[a + 2], vx = x[d] - x[a], vy = x[d + 1] - x[a + 1], vz = x[d + 2] - x[a + 2];
      const nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
      for (const k of [a, b, d]) { nrm[k] += nx; nrm[k + 1] += ny; nrm[k + 2] += nz; }
    }
    for (let i = 0; i < NP; i++) { verts.set([x[i * 3], x[i * 3 + 1], x[i * 3 + 2], nrm[i * 3], nrm[i * 3 + 1], nrm[i * 3 + 2]], i * 6); }
    gl.bindFramebuffer(gl.FRAMEBUFFER, null); gl.viewport(0, 0, W, H); gl.clearColor(0.025, 0.024, 0.027, 1); gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT); gl.enable(gl.DEPTH_TEST);
    const M = matrix(t);
    gl.useProgram(floorP.p); gl.uniformMatrix4fv(floorP.u.M, false, M); gl.bindVertexArray(fv); gl.drawArrays(gl.TRIANGLES, 0, 6);
    gl.useProgram(chromeP.p); gl.uniformMatrix4fv(chromeP.u.M, false, M); gl.uniform3f(chromeP.u.E, ...E);
    gl.uniform1f(chromeP.u.MAT, 0); gl.bindVertexArray(sphM.v); gl.drawArrays(gl.TRIANGLES, 0, sphM.n);
    gl.uniform1f(chromeP.u.MAT, 1); gl.bindVertexArray(cylM.v); gl.drawArrays(gl.TRIANGLES, 0, cylM.n);
    gl.useProgram(clothP.p); gl.uniformMatrix4fv(clothP.u.M, false, M); gl.uniform3f(clothP.u.E, ...E);
    gl.bindVertexArray(cv); gl.bindBuffer(gl.ARRAY_BUFFER, cb); gl.bufferSubData(gl.ARRAY_BUFFER, 0, verts); gl.drawElements(gl.TRIANGLES, idx.length, gl.UNSIGNED_SHORT, 0);
    gl.bindVertexArray(null); gl.disable(gl.DEPTH_TEST);
    raf = requestAnimationFrame(frame);
  }
  raf = requestAnimationFrame(frame);
  return () => { cancelAnimationFrame(raf); ro.disconnect(); gl.getExtension('WEBGL_lose_context')?.loseContext(); canvas.remove(); };
}
