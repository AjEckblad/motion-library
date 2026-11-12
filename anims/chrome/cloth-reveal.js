// Cloth reveal (rewrite in progress)
const PARAMS = { grid: 46, stiffness: 1, speed: 1 };

export default function (stage) {
  const canvas = document.createElement('canvas');
  canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block';
  stage.append(canvas);
  const gl = canvas.getContext('webgl2', { antialias: true, alpha: false });
  if (!gl) { stage.textContent = 'This needs WebGL2.'; return () => canvas.remove(); }
  const still = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ── the star: a small stellated dodecahedron mounted on one spike, on a plinth
  const PHI = (1 + Math.sqrt(5)) / 2, A = 0.86, D = A / Math.sqrt(5), SC = [0, 1.55, 0], PED = 0.55, PT = SC[1] - A * 0.62;
  const nz = v => { const l = Math.hypot(...v); return v.map(q => q / l); };
  const turn = (() => {                                        // one spike straight up, one straight down
    const ax = [-1, 0, 0], an = Math.acos(1 / Math.sqrt(1 + PHI * PHI)), c = Math.cos(an), sn = Math.sin(an), yaw = 0.757;
    return v => { const d = ax[0] * v[0] + ax[1] * v[1] + ax[2] * v[2], cr = [ax[1] * v[2] - ax[2] * v[1], ax[2] * v[0] - ax[0] * v[2], ax[0] * v[1] - ax[1] * v[0]];
      const r = v.map((q, i) => q * c + cr[i] * sn + ax[i] * d * (1 - c)); return [r[0] * Math.cos(yaw) - r[2] * Math.sin(yaw), r[1], r[0] * Math.sin(yaw) + r[2] * Math.cos(yaw)]; };
  })();
  const AX = [];
  for (const a of [-1, 1]) for (const b of [-PHI, PHI]) AX.push(nz([0, a, b]), nz([a, b, 0]), nz([b, 0, a]));
  const U = new Float32Array(36); AX.forEach((a, i) => U.set(turn(a), i * 3));

  // ── the sheet: a G×G grid of points, 4.4 units square, joined by stretch, shear and bend constraints
  const G = Math.max(16, Math.min(70, Math.round(PARAMS.grid))), NP = G * G, SIZE = 4.4, SP = SIZE / (G - 1);
  const id = (i, j) => j * G + i;
  // the star as the silk feels it: twelve round cones from the centre to each tip, thicker than the grid's gaps so no
  // point slips between two particles (that is what tore the old sheet into a crumpled ball)
  const TB = SP * 0.5, TT = SP * 1.0, R1 = A * 0.531 + TB, R2 = TT, SPH = (R1 - R2) / A, CPH = Math.sqrt(1 - SPH * SPH), RB = A + TT;
  const PR = PED + TB, PY = PT + TB, FY = TB * 0.6;
  const x = new Float32Array(NP * 3), px = new Float32Array(NP * 3), nrm = new Float32Array(NP * 3), vel = new Float32Array(NP * 3), air = new Float32Array(NP * 3);
  const inv = new Float32Array(NP).fill(1), kd = new Float32Array(NP), tmax = new Float32Array(NP);
  const cl = [], kl = [], rl = [];
  const add = (a, b, r, k) => { cl.push(a, b); rl.push(r); kl.push(k); };
  for (let j = 0; j < G; j++) for (let i = 0; i < G; i++) {
    if (i < G - 1) add(id(i, j), id(i + 1, j), SP, 1);
    if (j < G - 1) add(id(i, j), id(i, j + 1), SP, 1);
    if (i < G - 1 && j < G - 1) { add(id(i, j), id(i + 1, j + 1), SP * Math.SQRT2, 0.06); add(id(i + 1, j), id(i, j + 1), SP * Math.SQRT2, 0.06); }
  }
  const C = Int32Array.from(cl), REST = Float32Array.from(rl), K = Float32Array.from(kl), NC = REST.length;
  // bending: each point is pulled toward the midpoint of its two neighbours along a row or column (a discrete
  // Laplacian), which resists every fold, even the one-point zigzag that distance-two springs cannot feel
  const BL = []; for (let j = 0; j < G; j++) for (let i = 1; i < G - 1; i++) BL.push(id(i - 1, j), id(i, j), id(i + 1, j), id(j, i - 1), id(j, i), id(j, i + 1));
  const BEND = Int32Array.from(BL), NB = BEND.length / 3, KB = 0.016 * Math.max(0.3, Math.min(1, PARAMS.stiffness));
  // air: silk is light, so the air pushes on it across its face (a little less right at the hem, which flutters)
  for (let j = 0; j < G; j++) for (let i = 0; i < G; i++) { const u = i / (G - 1) * 2 - 1, v = j / (G - 1) * 2 - 1; kd[id(i, j)] = 0.009 * (1 - 0.25 * Math.max(Math.abs(u), Math.abs(v)) ** 6); }

  // ── the loop (seconds): the sheet floats down and settles, a beat, a corner is drawn up and away, the star turns
  const FR = 1 / 60, N = 12, TG = 4.2, TPARK = 8.2, TURN0 = 7.8, TURN1 = 10.8, LOOP = 12.2, LF = Math.round(LOOP / FR);
  const DROPY = 4.7, HANDDIR = 2.2, STILL = Math.round(4 / FR);
  let ph = -1, parked = false, fc = 0;
  const HB = new Float32Array(3), hand = new Float32Array(3);
  function drop() {
    for (let j = 0; j < G; j++) for (let i = 0; i < G; i++) {
      // bent along one axis into a shallow arc, which is exactly as long as the flat sheet, so nothing starts strained
      const k = id(i, j) * 3, u = (i / (G - 1) - 0.5) * SIZE, v = (j / (G - 1) - 0.5) * SIZE, RA = 6;
      x[k] = RA * Math.sin(u / RA); x[k + 1] = DROPY - RA * (1 - Math.cos(u / RA)); x[k + 2] = v;
      px[k] = x[k]; px[k + 1] = x[k + 1] + 1.1 * FR / N; px[k + 2] = x[k + 2];            // already drifting down
    }
    inv.fill(1); ph = -1; parked = false;
  }
  function grab() {
    // the corner furthest to the right and back, as the camera sees it, is taken up and away from the camera
    const hx = Math.sin(HANDDIR), hz = Math.cos(HANDDIR);
    let best = -1e9;
    for (const c of [id(0, 0), id(G - 1, 0), id(0, G - 1), id(G - 1, G - 1)]) { const s = x[c * 3] * hx + x[c * 3 + 2] * hz; if (s > best) { best = s; ph = c; } }
    inv[ph] = 0;
    const ci = ph % G, cj = (ph / G) | 0;
    for (let j = 0; j < G; j++) for (let i = 0; i < G; i++) tmax[id(i, j)] = Math.hypot(i - ci, j - cj) * SP * 1.01;
    HB[0] = x[ph * 3]; HB[1] = x[ph * 3 + 1]; HB[2] = x[ph * 3 + 2]; hd = 0;
    hand.set(HB);
  }
  // the hand: lifts the corner off the floor, then draws it away to the side at a walking pace while the silk slides
  // over the points, and speeds up once the sheet is clear
  let hd = 0;
  const sstep = (a, b, v) => { const q = Math.min(1, Math.max(0, (v - a) / (b - a))); return q * q * (3 - 2 * q); };
  function handAt(t, h) {
    const u = t - TG, lift = sstep(0, 1.2, u);
    hd += (2.1 * sstep(0.7, 1.6, u) + 3.4 * sstep(2.6, 3.6, u)) * h;
    const hx = Math.sin(HANDDIR), hz = Math.cos(HANDDIR);
    hand[0] = HB[0] + hx * (0.3 * lift + hd); hand[1] = HB[1] + (2.5 - HB[1]) * lift + 0.16 * hd; hand[2] = HB[2] + hz * (0.3 * lift + hd);
  }
  function contact(k, nx, ny, nz, depth, mu) {
    // push out along the surface normal, then friction from the same contact: small slides stop, larger ones slow
    x[k] += nx * depth; x[k + 1] += ny * depth; x[k + 2] += nz * depth;
    const dx = x[k] - px[k], dy = x[k + 1] - px[k + 1], dz = x[k + 2] - px[k + 2], dn = dx * nx + dy * ny + dz * nz;
    const tx = dx - dn * nx, ty = dy - dn * ny, tz = dz - dn * nz, tl = Math.sqrt(tx * tx + ty * ty + tz * tz), lim = mu * depth;
    const f = tl <= lim ? 1 : lim / tl;
    x[k] -= tx * f; x[k + 1] -= ty * f; x[k + 2] -= tz * f;
  }
  let fwd = 0;
  function substep(h, held) {
    const g = -9.8 * h * h;
    for (let i = 0, k = 0; i < NP; i++, k += 3) {
      if (inv[i] === 0) continue;
      let vx = (x[k] - px[k]) * 0.9995, vy = (x[k + 1] - px[k + 1]) * 0.9995, vz = (x[k + 2] - px[k + 2]) * 0.9995;
      vx += air[k]; vy += air[k + 1]; vz += air[k + 2];
      px[k] = x[k]; px[k + 1] = x[k + 1]; px[k + 2] = x[k + 2];
      x[k] += vx; x[k + 1] += vy + g; x[k + 2] += vz;
    }
    if (held) { const k = ph * 3; px[k] = x[k]; px[k + 1] = x[k + 1]; px[k + 2] = x[k + 2]; x[k] = hand[0]; x[k + 1] = hand[1]; x[k + 2] = hand[2]; }
    fwd ^= 1;
    for (let n = 0; n < NC; n++) {
      const c = fwd ? n : NC - 1 - n, a = C[c * 2], b = C[c * 2 + 1], wa = inv[a], wb = inv[b];
      const a3 = a * 3, b3 = b * 3, dx = x[b3] - x[a3], dy = x[b3 + 1] - x[a3 + 1], dz = x[b3 + 2] - x[a3 + 2], d = Math.sqrt(dx * dx + dy * dy + dz * dz);
      if (d < 1e-9 || wa + wb === 0) continue;
      const s = (d - REST[c]) / (d * (wa + wb)) * K[c];
      x[a3] += dx * s * wa; x[a3 + 1] += dy * s * wa; x[a3 + 2] += dz * s * wa;
      x[b3] -= dx * s * wb; x[b3 + 1] -= dy * s * wb; x[b3 + 2] -= dz * s * wb;
    }
    for (let n = 0; n < NB; n++) {
      const c = (fwd ? n : NB - 1 - n) * 3, a = BEND[c] * 3, m = BEND[c + 1] * 3, b = BEND[c + 2] * 3;
      if (inv[BEND[c + 1]] === 0) continue;
      const lx = (x[m] - 0.5 * (x[a] + x[b])) * KB, ly = (x[m + 1] - 0.5 * (x[a + 1] + x[b + 1])) * KB, lz = (x[m + 2] - 0.5 * (x[a + 2] + x[b + 2])) * KB;
      x[m] -= lx; x[m + 1] -= ly; x[m + 2] -= lz;
      const wa = 0.5 * inv[BEND[c]], wb = 0.5 * inv[BEND[c + 2]];
      x[a] += lx * wa; x[a + 1] += ly * wa; x[a + 2] += lz * wa; x[b] += lx * wb; x[b + 1] += ly * wb; x[b + 2] += lz * wb;
    }
    if (held) {
      // tethers: no point may be further from the hand than it is across the flat sheet, so the pull never stretches it
      for (let i = 0, k = 0; i < NP; i++, k += 3) {
        const dx = x[k] - hand[0], dy = x[k + 1] - hand[1], dz = x[k + 2] - hand[2], d = Math.sqrt(dx * dx + dy * dy + dz * dz);
        if (d > tmax[i] && i !== ph) { const f = (d - tmax[i]) / d; x[k] -= dx * f; x[k + 1] -= dy * f; x[k + 2] -= dz * f; }
      }
    }
    for (let i = 0, k = 0; i < NP; i++, k += 3) {
      if (inv[i] === 0) continue;
      const ox = x[k] - SC[0], oy = x[k + 1] - SC[1], oz = x[k + 2] - SC[2], r2 = ox * ox + oy * oy + oz * oz;
      if (r2 < RB * RB) {
        const rl = Math.sqrt(r2) || 1e-6;
        let best = 1e9, bx = 0, by = 1, bz = 0;
        for (let s = 0; s < 36; s += 3) {
          const ux = U[s], uy = U[s + 1], uz = U[s + 2], y = ox * ux + oy * uy + oz * uz;
          if (y <= 0) continue;
          const qx = ox - y * ux, qy = oy - y * uy, qz = oz - y * uz, q = Math.sqrt(qx * qx + qy * qy + qz * qz), along = y * CPH - q * SPH;
          let d, nx, ny, nz;
          if (along < 0) { d = rl - R1; nx = ox / rl; ny = oy / rl; nz = oz / rl; }
          else if (along > A * CPH) { const ex = ox - A * ux, ey = oy - A * uy, ez = oz - A * uz, el = Math.sqrt(ex * ex + ey * ey + ez * ez) || 1e-6; d = el - R2; nx = ex / el; ny = ey / el; nz = ez / el; }
          else { const iq = q > 1e-6 ? CPH / q : 0; d = y * SPH + q * CPH - R1; nx = SPH * ux + qx * iq; ny = SPH * uy + qy * iq; nz = SPH * uz + qz * iq; }
          if (d < best) { best = d; bx = nx; by = ny; bz = nz; }
        }
        if (best < 0) contact(k, bx, by, bz, -best, 0.5);
      }
      const X = x[k], Y = x[k + 1], Z = x[k + 2], pr2 = X * X + Z * Z;
      if (Y < PY && pr2 < PR * PR) { const pr = Math.sqrt(pr2) || 1e-6, side = PR - pr, top = PY - Y; if (top < side) contact(k, 0, 1, 0, top, 0.6); else contact(k, X / pr, 0, Z / pr, side, 0.6); }
      if (x[k + 1] < FY) contact(k, 0, 1, 0, FY - x[k + 1], 0.9);
    }
  }
  // the air's push, worked out once a frame and kept smooth across the sheet, as real air pressure is: normals from
  // points two apart and the speed through the air averaged over each point's neighbours (per-point drag from
  // per-point normals feeds back into a grid-fine ripple)
  function aero(wx, wz) {
    for (let j = 0; j < G; j++) for (let i = 0; i < G; i++) {
      const a = id(Math.min(i + 2, G - 1), j) * 3, b = id(Math.max(i - 2, 0), j) * 3, c = id(i, Math.min(j + 2, G - 1)) * 3, d = id(i, Math.max(j - 2, 0)) * 3;
      const ux = x[a] - x[b], uy = x[a + 1] - x[b + 1], uz = x[a + 2] - x[b + 2], vx = x[c] - x[d], vy = x[c + 1] - x[d + 1], vz = x[c + 2] - x[d + 2];
      const nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz2 = ux * vy - uy * vx, l = Math.sqrt(nx * nx + ny * ny + nz2 * nz2) || 1, k = id(i, j) * 3;
      nrm[k] = nx / l; nrm[k + 1] = ny / l; nrm[k + 2] = nz2 / l;
      vel[k] = x[k] - px[k] - wx; vel[k + 1] = x[k + 1] - px[k + 1]; vel[k + 2] = x[k + 2] - px[k + 2] - wz;
    }
    for (let j = 0; j < G; j++) for (let i = 0; i < G; i++) {
      const k = id(i, j) * 3; let sx = 0, sy = 0, sz = 0, n = 0;
      for (let b = Math.max(j - 1, 0); b <= Math.min(j + 1, G - 1); b++) for (let a = Math.max(i - 1, 0); a <= Math.min(i + 1, G - 1); a++) { const q = id(a, b) * 3; sx += vel[q]; sy += vel[q + 1]; sz += vel[q + 2]; n++; }
      const vn = (sx * nrm[k] + sy * nrm[k + 1] + sz * nrm[k + 2]) / n * kd[k / 3];
      air[k] = -vn * nrm[k]; air[k + 1] = -vn * nrm[k + 1]; air[k + 2] = -vn * nrm[k + 2];
    }
  }
  function tick() {
    const f = fc % LF, t = f * FR;
    if (f === 0) drop();
    if (t >= TG && ph < 0) grab();
    if (t >= TPARK) parked = true;
    if (!parked) {
      const dr = Math.min(1, Math.max(0, (t - 2.2) / 1.5)) * FR / N;   // a faint draught once it has landed
      aero(dr * (0.35 * Math.sin(t * 1.3) + 0.15 * Math.sin(t * 2.9)), dr * 0.3 * Math.sin(t * 0.9 + 1));
      for (let s = 1; s <= N; s++) {
        const held = ph >= 0;
        if (held) handAt(t + s * FR / N, FR / N);
        substep(FR / N, held);
      }
    }
    fc++;
  }
  // ── end of physics

  const sh = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s)); return s; };
  const prog = (vs, fs) => {
    const p = gl.createProgram(); gl.attachShader(p, sh(gl.VERTEX_SHADER, vs)); gl.attachShader(p, sh(gl.FRAGMENT_SHADER, fs)); gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
    const u = {}; for (let i = 0, n = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS); i < n; i++) { const nm = gl.getActiveUniform(p, i).name; u[nm] = gl.getUniformLocation(p, nm); }
    return { p, u };
  };
  // the studio the chrome reflects: a dark room, an overhead softbox, warm and cool strips, thin white strips and a
  // bright wall behind the camera, so every facet catches something different as the star turns
  const ENV = `vec3 env(vec3 d) {
    float az = atan(d.x, d.z), el = asin(clamp(d.y, -1., 1.));
    vec3 c = mix(vec3(.004, .004, .005), vec3(.03, .031, .036), smoothstep(-.02, .9, d.y));
    vec2 fl = d.xz * ${SC[1]} / max(-d.y, .02);                                  // below the horizon: the lit floor
    c += vec3(.07, .068, .072) * exp(-dot(fl, fl) * .09) * smoothstep(.0, -.08, d.y);
    vec2 q = d.xz / max(d.y, .05) - vec2(.1, -.2);                               // overhead softbox, hot in the middle
    c += vec3(2.8) * smoothstep(.06, 0., max(abs(q.x) - .55, abs(q.y) - .25)) * (.55 + .45 * exp(-dot(q, q) * 4.)) * step(0., d.y);
    float fa = az - .5;                                                          // a tall fill behind the camera, falling off
    c += vec3(1.5, 1.46, 1.4) * exp(-fa * fa * 5.) * smoothstep(-.12, .05, el) * smoothstep(.8, .15, el);
    float tall = smoothstep(-.1, .2, el) * smoothstep(.95, .35, el);              // warm strip right, cool strip left
    c += vec3(1., .55, .3) * 2.6 * smoothstep(.1, .02, abs(az - 1.9)) * tall + vec3(.35, .6, 1.) * 2.3 * smoothstep(.1, .02, abs(az + 1.6)) * tall;
    c += vec3(1.5) * smoothstep(.035, .0, abs(fract(az * 1.6) - .5) - .46) * smoothstep(.03, .0, abs(el - .1) - .14);   // a ring of thin strips
    return c;
  }`;
  // the star and plinth: turned about the vertical through the star, mirrored under the floor for the reflection
  const solidP = prog(`#version 300 es
  layout(location = 0) in vec3 P; layout(location = 1) in vec3 Nn; uniform mat4 M; uniform float YAW, MIR; out vec3 n; out vec3 w;
  void main() { float c = cos(YAW), s = sin(YAW); mat3 R = mat3(c, 0, -s, 0, 1, 0, s, 0, c);
    w = R * (P - vec3(0, ${SC[1]}, 0)) + vec3(0, ${SC[1]}, 0); n = R * Nn; gl_Position = M * vec4(w.x, w.y * MIR, w.z, 1); }`, `#version 300 es
  precision highp float; in vec3 n; in vec3 w; out vec4 o; uniform vec3 E; uniform float MAT, FADE;
  ${ENV}
  void main() {
    vec3 V = normalize(E - w), N = normalize(n), R = reflect(-V, N);
    vec3 c = MAT < .5 ? env(R) * vec3(.92, .94, .98) * (.55 + .45 * pow(1. - max(dot(N, V), 0.), 4.))
                      : vec3(.035, .033, .032) * (.35 + .65 * max(dot(N, normalize(vec3(.1, 1., -.2))), 0.)) + env(R) * .04;
    c *= mix(1., exp(-1.6 * w.y) * .5, FADE);
    o = vec4(pow(c / (1. + c * .25), vec3(1. / 2.2)), 1);
  }`);
  // the silk: the grid's points go up as a float texture and the vertex shader draws a cubic B-spline surface over
  // them at three times the resolution (smooth to the second derivative, so no facets), with exact tangents for the
  // normal and the weave, and curvature to shade the folds
  const clothP = prog(`#version 300 es
  layout(location = 0) in vec2 UV; uniform highp sampler2D X; uniform mat4 M; uniform float MIR;
  out vec3 w; out vec3 n; out vec3 tu; out float cav;
  vec3 F(int i, int j) { return texelFetch(X, ivec2(i, j), 0).xyz; }
  vec3 Fi(int i, int j) { int g = ${G}; if (i < 0) return 2. * F(0, j) - F(1, j); if (i >= g) return 2. * F(g - 1, j) - F(g - 2, j); return F(i, j); }
  vec3 Pt(int i, int j) { int g = ${G}; if (j < 0) return 2. * Fi(i, 0) - Fi(i, 1); if (j >= g) return 2. * Fi(i, g - 1) - Fi(i, g - 2); return Fi(i, j); }
  vec4 cw(float t) { float s = 1. - t, t2 = t * t, t3 = t2 * t; return vec4(s * s * s, 3. * t3 - 6. * t2 + 4., -3. * t3 + 3. * t2 + 3. * t + 1., t3) / 6.; }
  vec4 cd(float t) { float s = 1. - t, t2 = t * t; return vec4(-s * s, 3. * t2 - 4. * t, -3. * t2 + 2. * t + 1., t2) * .5; }
  vec4 cs(float t) { return vec4(1. - t, 3. * t - 2., 1. - 3. * t, t); }
  void main() {
    vec2 c = min(floor(UV), vec2(${G - 2})), t = UV - c; ivec2 b = ivec2(c);
    vec4 wu = cw(t.x), wv = cw(t.y), du = cd(t.x), dv = cd(t.y), su = cs(t.x), sv = cs(t.y);
    vec3 p = vec3(0), pu = vec3(0), pv = vec3(0), pp = vec3(0);
    for (int j = 0; j < 4; j++) for (int i = 0; i < 4; i++) {
      vec3 q = Pt(b.x - 1 + i, b.y - 1 + j);
      p += wu[i] * wv[j] * q; pu += du[i] * wv[j] * q; pv += wu[i] * dv[j] * q; pp += (su[i] * wv[j] + wu[i] * sv[j]) * q;
    }
    n = cross(pu, pv); tu = pu; w = p; cav = dot(pp, normalize(n)) / ${(SP * SP).toFixed(6)};
    gl_Position = M * vec4(p.x, p.y * MIR, p.z, 1);
  }`, `#version 300 es
  precision highp float; in vec3 w; in vec3 n; in vec3 tu; in float cav; out vec4 o; uniform vec3 E; uniform float FADE;
  vec3 lit(vec3 N, vec3 T, vec3 B, vec3 V, vec3 L, vec3 col, vec3 base) {
    vec3 H = normalize(L + V); float nl = dot(N, L), th = dot(T, H), bh = dot(B, H);
    float aniso = pow(max(1. - th * th, 0.), 40.) * .3 + pow(max(1. - bh * bh, 0.), 160.) * .22;   // warp and weft highlights
    return col * (base * max((nl + .3) / 1.3, 0.) + vec3(.9, .28, .3) * aniso * smoothstep(-.1, .4, nl));
  }
  void main() {
    vec3 V = normalize(E - w), N = normalize(n); float k = cav;
    if (dot(N, V) < 0.) { N = -N; k = -k; }                                     // two-sided
    vec3 T = normalize(tu - N * dot(N, tu)), B = cross(N, T);
    vec3 base = vec3(.2, .01, .022);
    vec3 c = lit(N, T, B, V, normalize(vec3(.1, 1., -.2)), vec3(1.25), base)    // the overhead softbox
           + lit(N, T, B, V, normalize(vec3(.95, .3, -.32)), vec3(.9, .55, .35), base)   // warm strip, right
           + lit(N, T, B, V, normalize(vec3(-1., .3, -.03)), vec3(.25, .4, .7), base)     // cool strip, left
           + lit(N, T, B, V, normalize(vec3(.2, .25, 1.)), vec3(.3), base);               // the bright wall behind us
    c += vec3(.55, .1, .13) * pow(1. - max(dot(N, V), 0.), 4.) * .5;            // sheen at grazing angles
    c *= clamp(1. - k * .022, .35, 1.15);                                        // folds' valleys dim, ridges catch light
    c *= .55 + .45 * smoothstep(-.05, 1.2, w.y);
    c *= mix(1., exp(-1.6 * w.y) * .5, FADE);
    o = vec4(pow(c / (1. + c * .25), vec3(1. / 2.2)), 1);
  }`);
  const floorP = prog(`#version 300 es
  layout(location = 0) in vec2 P; uniform mat4 M; out vec2 g; void main() { g = P; gl_Position = M * vec4(P.x, 0, P.y, 1); }`, `#version 300 es
  precision highp float; in vec2 g; out vec4 o;
  void main() {
    // a pool of light under the star that fades into the dark, with a soft contact shadow round the plinth
    float r = length(g);
    vec3 c = vec3(.07, .068, .072) * exp(-r * r * .09) * (1. - .55 * exp(-pow(max(r - ${PED}, 0.) * 4., 2.)));
    o = vec4(pow(c, vec3(1. / 2.2)), .84);
  }`);

  // meshes: the star (over each face of the core, five flat triangles up to that face's tip), the plinth, the floor
  const solid = data => { const v = gl.createVertexArray(); gl.bindVertexArray(v); gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer()); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.STATIC_DRAW); gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 24, 0); gl.enableVertexAttribArray(1); gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 24, 12); return { v, n: data.length / 6 }; };
  const star = [], dv = [], dot = (p, q) => p[0] * q[0] + p[1] * q[1] + p[2] * q[2];
  for (const a of [-1, 1]) for (const b of [-1, 1]) { for (const c of [-1, 1]) dv.push([a, b, c]); dv.push([0, a / PHI, b * PHI], [a / PHI, b * PHI, 0], [a * PHI, 0, b / PHI]); }
  const sc = D / 1.37638;                                          // those twenty vertices sit 1.37638 from each face's plane
  for (const n of AX) {
    const u = nz([n[1] - n[2], n[2] - n[0], n[0] - n[1]]), w = [n[1] * u[2] - n[2] * u[1], n[2] * u[0] - n[0] * u[2], n[0] * u[1] - n[1] * u[0]];
    const face = dv.slice().sort((p, q) => dot(q, n) - dot(p, n)).slice(0, 5).sort((p, q) => Math.atan2(dot(p, w), dot(p, u)) - Math.atan2(dot(q, w), dot(q, u)));
    const tip = turn(n.map(v => v * A));
    for (let i = 0; i < 5; i++) {
      const p0 = turn(face[i].map(v => v * sc)), p1 = turn(face[(i + 1) % 5].map(v => v * sc)), e1 = p1.map((v, j) => v - p0[j]), e2 = tip.map((v, j) => v - p0[j]);
      let fn = nz([e1[1] * e2[2] - e1[2] * e2[1], e1[2] * e2[0] - e1[0] * e2[2], e1[0] * e2[1] - e1[1] * e2[0]]);
      if (dot(fn, [p0[0] + p1[0] + tip[0], p0[1] + p1[1] + tip[1], p0[2] + p1[2] + tip[2]]) < 0) fn = fn.map(v => -v);
      for (const q of [p0, p1, tip]) star.push(q[0] + SC[0], q[1] + SC[1], q[2] + SC[2], ...fn);
    }
  }
  const cyl = [];
  for (let b = 0; b < 64; b++) {
    const a0 = (b / 64) * Math.PI * 2, a1 = ((b + 1) / 64) * Math.PI * 2;
    for (const [a, y] of [[a0, 0], [a1, 0], [a0, PT], [a0, PT], [a1, 0], [a1, PT]]) cyl.push(Math.cos(a) * PED, y, Math.sin(a) * PED, Math.cos(a), 0, Math.sin(a));
    cyl.push(0, PT, 0, 0, 1, 0, Math.cos(a1) * PED, PT, Math.sin(a1) * PED, 0, 1, 0, Math.cos(a0) * PED, PT, Math.sin(a0) * PED, 0, 1, 0);
  }
  const starM = solid(star), cylM = solid(cyl);
  const fv = gl.createVertexArray(); gl.bindVertexArray(fv); gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer()); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-14, -14, 14, -14, -14, 14, 14, -14, 14, 14, -14, 14]), gl.STATIC_DRAW); gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  // the silk's drawing grid
  const S3 = 3, RG = (G - 1) * S3 + 1, uvs = new Float32Array(RG * RG * 2), idx = new Uint16Array((RG - 1) * (RG - 1) * 6);
  for (let j = 0; j < RG; j++) for (let i = 0; i < RG; i++) { uvs[(j * RG + i) * 2] = i / S3; uvs[(j * RG + i) * 2 + 1] = j / S3; }
  for (let j = 0, q = 0; j < RG - 1; j++) for (let i = 0; i < RG - 1; i++, q += 6) { const a = j * RG + i; idx.set([a, a + 1, a + RG, a + 1, a + RG + 1, a + RG], q); }
  const cv = gl.createVertexArray(); gl.bindVertexArray(cv);
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer()); gl.bufferData(gl.ARRAY_BUFFER, uvs, gl.STATIC_DRAW); gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, gl.createBuffer()); gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, idx, gl.STATIC_DRAW);
  gl.bindVertexArray(null);
  const tex = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB32F, G, G, 0, gl.RGB, gl.FLOAT, null);
  for (const p of [gl.TEXTURE_MIN_FILTER, gl.TEXTURE_MAG_FILTER]) gl.texParameteri(gl.TEXTURE_2D, p, gl.NEAREST);
  for (const p of [gl.TEXTURE_WRAP_S, gl.TEXTURE_WRAP_T]) gl.texParameteri(gl.TEXTURE_2D, p, gl.CLAMP_TO_EDGE);

  let W = 1, H = 1;
  const E = new Float32Array(3), EM = new Float32Array(3), MV = new Float32Array(16), f = [0, 0, 0], r = [0, 0, 0], u = [0, 0, 0], V = new Float32Array(16), Pm = new Float32Array(16);
  function matrix(t) {
    const az = 0.5 + 0.1 * Math.sin(t * 0.17), el = 0.22, dist = 5.0;
    E[0] = Math.sin(az) * Math.cos(el) * dist; E[1] = 1.0 + Math.sin(el) * dist; E[2] = Math.cos(az) * Math.cos(el) * dist;
    EM[0] = E[0]; EM[1] = -E[1]; EM[2] = E[2];
    f[0] = -E[0]; f[1] = 1.3 - E[1]; f[2] = -E[2]; const fl = Math.hypot(f[0], f[1], f[2]); f[0] /= fl; f[1] /= fl; f[2] /= fl;
    const rl = Math.hypot(f[2], f[0]); r[0] = -f[2] / rl; r[1] = 0; r[2] = f[0] / rl;
    u[0] = r[1] * f[2] - r[2] * f[1]; u[1] = r[2] * f[0] - r[0] * f[2]; u[2] = r[0] * f[1] - r[1] * f[0];
    V.set([r[0], u[0], -f[0], 0, r[1], u[1], -f[1], 0, r[2], u[2], -f[2], 0, -(r[0] * E[0] + r[1] * E[1] + r[2] * E[2]), -(u[0] * E[0] + u[1] * E[1] + u[2] * E[2]), f[0] * E[0] + f[1] * E[1] + f[2] * E[2], 1]);
    const F = 1 / Math.tan(0.38), asp = W / H, n = 0.1, fa = 60, nf = 1 / (n - fa);
    Pm.set([F / asp, 0, 0, 0, 0, F, 0, 0, 0, 0, (fa + n) * nf, -1, 0, 0, 2 * fa * n * nf, 0]);
    for (let c = 0; c < 4; c++) for (let rr = 0; rr < 4; rr++) { let s = 0; for (let k = 0; k < 4; k++) s += Pm[k * 4 + rr] * V[c * 4 + k]; MV[c * 4 + rr] = s; }
  }
  function starYaw() {
    const loops = Math.floor(fc / LF), t = (fc % LF) * FR, e = Math.min(1, Math.max(0, (t - TURN0) / (TURN1 - TURN0)));
    return (loops + e * e * (3 - 2 * e)) * Math.PI * 2 / 5;   // a fifth of a turn each loop: the star looks the same again
  }
  function scene(mir) {
    const yaw = starYaw(), eye = mir < 0 ? EM : E, fade = mir < 0 ? 1 : 0;
    gl.useProgram(solidP.p); gl.uniformMatrix4fv(solidP.u.M, false, MV); gl.uniform3fv(solidP.u.E, eye); gl.uniform1f(solidP.u.MIR, mir); gl.uniform1f(solidP.u.FADE, fade);
    gl.uniform1f(solidP.u.MAT, 0); gl.uniform1f(solidP.u.YAW, yaw); gl.bindVertexArray(starM.v); gl.drawArrays(gl.TRIANGLES, 0, starM.n);
    gl.uniform1f(solidP.u.MAT, 1); gl.uniform1f(solidP.u.YAW, 0); gl.bindVertexArray(cylM.v); gl.drawArrays(gl.TRIANGLES, 0, cylM.n);
    if (parked) return;
    gl.useProgram(clothP.p); gl.uniformMatrix4fv(clothP.u.M, false, MV); gl.uniform3fv(clothP.u.E, eye); gl.uniform1f(clothP.u.MIR, mir); gl.uniform1f(clothP.u.FADE, fade);
    gl.uniform1i(clothP.u.X, 0); gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.bindVertexArray(cv); gl.drawElements(gl.TRIANGLES, idx.length, gl.UNSIGNED_SHORT, 0);
  }
  function draw() {
    matrix(fc * FR);
    gl.bindTexture(gl.TEXTURE_2D, tex); gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, G, G, gl.RGB, gl.FLOAT, x);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null); gl.viewport(0, 0, W, H); gl.clearColor(0, 0, 0, 1); gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT); gl.enable(gl.DEPTH_TEST);
    scene(-1);                                                         // the reflection in the polished floor
    gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.useProgram(floorP.p); gl.uniformMatrix4fv(floorP.u.M, false, MV); gl.bindVertexArray(fv); gl.drawArrays(gl.TRIANGLES, 0, 6);
    gl.disable(gl.BLEND);
    scene(1);
    gl.bindVertexArray(null); gl.disable(gl.DEPTH_TEST);
  }
  const resize = () => { const d = Math.min(devicePixelRatio, 2); W = canvas.width = Math.max(1, (stage.clientWidth * d) | 0); H = canvas.height = Math.max(1, (stage.clientHeight * d) | 0); if (still) draw(); };

  let raf = 0, last = performance.now(), acc = 0;
  function frame(now) {
    acc += Math.min(0.1, (now - last) / 1000) * PARAMS.speed; last = now;
    let n = 0; while (acc >= FR && n < 4) { tick(); acc -= FR; n++; }
    if (n === 4) acc = 0;
    draw();
    raf = requestAnimationFrame(frame);
  }
  drop();
  if (still) { while (fc < STILL) tick(); } else raf = requestAnimationFrame(frame);
  const ro = new ResizeObserver(resize); ro.observe(stage); resize();
  return () => { cancelAnimationFrame(raf); ro.disconnect(); gl.getExtension('WEBGL_lose_context')?.loseContext(); canvas.remove(); };
}
