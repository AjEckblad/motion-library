// Pin art: the pin-screen toy, in 3D. Three thousand steel pins slide through a frame. Something pushes up from
// behind (a hand, then a face, then a ripple) and every pin it touches slides forward, so the shape appears in relief.
// The pins only move one way: when the shape pulls back, its imprint stays. Then a sweep flattens the board for the
// next one. Each pin is an instanced cylinder with a domed head, shaded like polished steel, and darkened where taller
// neighbours shade it. Press with the pointer to push pins back in and draw into the relief.
const PARAMS = { pins: 72, depth: 1.2, speed: 1 };

export default function (stage) {
  const canvas = document.createElement('canvas');
  canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block;touch-action:none';
  stage.append(canvas);
  const gl = canvas.getContext('webgl2', { antialias: true });
  if (!gl) { stage.textContent = 'This needs WebGL2.'; return () => canvas.remove(); }
  const NX = Math.max(16, Math.round(PARAMS.pins)), NY = Math.round(NX * 0.68), N = NX * NY, HMAX = 8 * PARAMS.depth;
  const h = new Float32Array(N), occ = new Float32Array(N);

  // the shapes that push from behind, as height fields over the board (x across −1..1, y up −0.68..0.68)
  const cap = (px, py, ax, ay, bx, by, r) => { const dx = bx - ax, dy = by - ay, t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy))), qx = px - ax - dx * t, qy = py - ay - dy * t, d2 = qx * qx + qy * qy; return d2 < r * r ? Math.sqrt(r * r - d2) / r : 0; };
  const SHAPES = [
    (x, y) => {                                                   // a hand, fingers spread
      let v = cap(x, y, 0.02, -0.5, 0.02, -0.12, 0.27) * 0.9;
      const F = [[-0.27, -0.12, -0.52, 0.12, 0.075], [-0.14, 0.04, -0.2, 0.5, 0.075], [0.02, 0.06, 0.03, 0.56, 0.08], [0.16, 0.04, 0.24, 0.48, 0.075], [0.27, -0.02, 0.42, 0.33, 0.065]];
      for (const [ax, ay, bx, by, r] of F) v = Math.max(v, cap(x, y, ax, ay, bx, by, r) * 0.75);
      return v;
    },
    (x, y) => {                                                   // a face, like a mask
      const e = (x * x) / 0.16 + ((y + 0.02) ** 2) / 0.3; if (e > 1) return 0;
      let v = Math.sqrt(1 - e) * 0.7;
      v += 0.28 * Math.exp(-((x * x) / 0.004 + ((y + 0.05) ** 2) / 0.03));                         // nose
      v -= 0.16 * (Math.exp(-(((x - 0.15) ** 2) + ((y - 0.12) ** 2)) / 0.006) + Math.exp(-(((x + 0.15) ** 2) + ((y - 0.12) ** 2)) / 0.006));   // eye sockets
      v += 0.08 * (Math.exp(-(((x - 0.15) ** 2) / 0.012 + ((y - 0.22) ** 2) / 0.0015)) + Math.exp(-(((x + 0.15) ** 2) / 0.012 + ((y - 0.22) ** 2) / 0.0015)));   // brows
      v += 0.1 * Math.exp(-((x * x) / 0.014 + ((y + 0.3) ** 2) / 0.002)) - 0.05 * Math.exp(-((x * x) / 0.02 + ((y + 0.33) ** 2) / 0.0004));   // lips
      return Math.max(0, v);
    },
    (x, y) => { const r = Math.hypot(x, y); return r > 0.62 ? 0 : (0.5 + 0.5 * Math.cos(r * 26)) * (1 - r / 0.62) * 0.9; },   // a ripple
  ];
  const ptr = { x: 0, y: 0, down: false };
  let shape = 0, phaseT = 0;

  // GL
  const sh = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s)); return s; };
  const prog = (vs, fs) => {
    const p = gl.createProgram(); gl.attachShader(p, sh(gl.VERTEX_SHADER, vs)); gl.attachShader(p, sh(gl.FRAGMENT_SHADER, fs)); gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
    const u = {}; for (let i = 0, n = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS); i < n; i++) { const nm = gl.getActiveUniform(p, i).name; u[nm] = gl.getUniformLocation(p, nm); }
    return { p, u };
  };
  const ENV = `
  // a studio: dark floor, soft grey walls, one big window up and to the left
  vec3 env(vec3 r) {
    vec3 c = mix(vec3(.012, .012, .015), vec3(.11, .115, .13), smoothstep(-.3, .6, r.y));
    c += vec3(2.6, 2.45, 2.2) * smoothstep(.82, .93, dot(r, normalize(vec3(-.55, .65, .5))));   // the key: a big softbox up-left
    c += vec3(.55, .42, .3) * smoothstep(.72, .95, dot(r, normalize(vec3(.85, .05, .5))));       // a warm kicker from the right
    return c;
  }`;
  const pinVS = `#version 300 es
  layout(location = 0) in vec3 P; layout(location = 1) in vec3 Nrm;    // unit pin: shaft along z 0..1, head beyond
  layout(location = 2) in vec2 G; layout(location = 3) in float Hh; layout(location = 4) in float O;
  uniform mat4 M; uniform float SP; out vec3 n; out vec3 w; out float oc; out float head;
  void main() {
    vec3 p = vec3(G * SP, 0) + vec3(P.xy, P.z <= 1. ? P.z * (Hh + 1.) : Hh + 1. + (P.z - 1.));
    n = Nrm; w = p; oc = O; head = step(1.001, P.z);
    gl_Position = M * vec4(p, 1);
  }`;
  const pinFS = `#version 300 es
  precision highp float; in vec3 n; in vec3 w; in float oc; in float head; out vec4 o; uniform vec3 E;
  ${ENV}
  void main() {
    vec3 N = normalize(n), V = normalize(E - w), R = reflect(-V, N);
    float fr = .55 + .45 * pow(1. - max(dot(N, V), 0.), 5.);
    vec3 c = env(R) * vec3(.82, .84, .88) * fr;
    c *= mix(1., .12, oc) * mix(.7, 1., head) * (.7 + .5 * clamp(w.z / 8., 0., 1.));   // shadowed by taller neighbours; the furthest-out pins catch the most light
    o = vec4(pow(c / (1. + c * .3), vec3(1. / 2.2)), 1);
  }`;
  const boardFS = `#version 300 es
  precision highp float; in vec2 v; out vec4 o; uniform vec2 R;
  void main() { vec2 q = v; vec3 c = mix(vec3(.012, .012, .014), vec3(.003, .003, .004), length(q * vec2(.7, 1.))); o = vec4(pow(c, vec3(1. / 2.2)), 1); }`;
  const plateP = prog(`#version 300 es
  layout(location = 0) in vec3 P; uniform mat4 M; out vec2 g; void main() { g = P.xy; gl_Position = M * vec4(P, 1); }`, `#version 300 es
  precision highp float; in vec2 g; out vec4 o; uniform vec2 S;
  void main() { vec2 k = g / S; float edge = max(abs(k.x), abs(k.y)); vec3 c = vec3(.04, .04, .045) * (1. - .3 * length(k)) * (edge > .97 ? 1.8 : 1.); o = vec4(pow(c, vec3(1. / 2.2)), 1); }`);
  const pinP = prog(pinVS, pinFS), boardP = prog(`#version 300 es
  in vec2 p; out vec2 v; void main() { v = p; gl_Position = vec4(p, .9999, 1); }`, boardFS);

  // one pin: an 10-sided shaft and a rounded head, a little wider
  const SEG = 10, R0 = 0.26, RH = 0.47, verts = [];
  const ring = (z, r, nz) => Array.from({ length: SEG + 1 }, (_, i) => { const a = (i / SEG) * Math.PI * 2; return [Math.cos(a) * r, Math.sin(a) * r, z, Math.cos(a) * (1 - Math.abs(nz)), Math.sin(a) * (1 - Math.abs(nz)), nz]; });
  const band = (A, B) => { for (let i = 0; i < SEG; i++) verts.push(...A[i], ...B[i], ...A[i + 1], ...A[i + 1], ...B[i], ...B[i + 1]); };
  band(ring(0, R0, 0), ring(1, R0, 0));                                   // shaft
  band(ring(1.0001, R0, -0.6), ring(1.05, RH, -0.2)); band(ring(1.05, RH, 0), ring(1.3, RH, 0));                      // head: flare, side
  const dome = [0.3, 0.6, 0.85, 1].map((k, j) => ring(1.3 + Math.sin(k * Math.PI / 2) * 0.22, RH * Math.cos(k * Math.PI / 2) + 0.001, Math.sin(k * Math.PI / 2)));
  band(ring(1.3, RH, 0.05), dome[0]); band(dome[0], dome[1]); band(dome[1], dome[2]); band(dome[2], dome[3]);
  const mesh = new Float32Array(verts), VCOUNT = mesh.length / 6;
  const grid = new Float32Array(N * 2); for (let j = 0; j < NY; j++) for (let i = 0; i < NX; i++) grid.set([i - (NX - 1) / 2, j - (NY - 1) / 2], (j * NX + i) * 2);
  const vao = gl.createVertexArray(); gl.bindVertexArray(vao);
  const buf = (data, loc, size, stride, off, div, usage = gl.STATIC_DRAW) => { const b = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b); gl.bufferData(gl.ARRAY_BUFFER, data, usage); return b; };
  const mb = buf(mesh); gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 24, 0); gl.enableVertexAttribArray(1); gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 24, 12);
  buf(grid); gl.enableVertexAttribArray(2); gl.vertexAttribPointer(2, 2, gl.FLOAT, false, 0, 0); gl.vertexAttribDivisor(2, 1);
  const hb = buf(h.byteLength, 0, 0, 0, 0, 0, gl.DYNAMIC_DRAW); gl.enableVertexAttribArray(3); gl.vertexAttribPointer(3, 1, gl.FLOAT, false, 0, 0); gl.vertexAttribDivisor(3, 1);
  const ob = buf(occ.byteLength, 0, 0, 0, 0, 0, gl.DYNAMIC_DRAW); gl.enableVertexAttribArray(4); gl.vertexAttribPointer(4, 1, gl.FLOAT, false, 0, 0); gl.vertexAttribDivisor(4, 1);
  gl.bindVertexArray(null);
  const bx = NX / 2 + 1.2, by = NY / 2 + 1.2;
  const pv = gl.createVertexArray(); gl.bindVertexArray(pv); buf(new Float32Array([-bx, -by, 0, bx, -by, 0, -bx, by, 0, bx, -by, 0, bx, by, 0, -bx, by, 0])); gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0); gl.bindVertexArray(null);
  const qv = gl.createVertexArray(); gl.bindVertexArray(qv); buf(new Float32Array([-1, -1, 3, -1, -1, 3])); gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0); gl.bindVertexArray(null);

  let W = 1, H = 1;
  const resize = () => { const d = Math.min(devicePixelRatio, 2); W = canvas.width = Math.max(1, (stage.clientWidth * d) | 0); H = canvas.height = Math.max(1, (stage.clientHeight * d) | 0); };
  const ro = new ResizeObserver(resize); ro.observe(stage); resize();
  // camera: in front of the board, a little left and above, so the relief reads
  const SP = 1;
  let EYE = [0, 0, 0];
  const matrix = t => {
    const az = -0.5 + 0.12 * Math.sin(t * 0.21), el = 0.32, dist = NX * 1.02;
    EYE = [Math.sin(az) * Math.cos(el) * dist, Math.sin(el) * dist, Math.cos(az) * Math.cos(el) * dist];
    const T = [0, 0, HMAX * 0.25], f = EYE.map((v, i) => T[i] - v), fl = Math.hypot(...f); f.forEach((v, i) => f[i] = v / fl);
    const rl0 = Math.hypot(f[2], f[0]), r = [-f[2] / rl0, 0, f[0] / rl0];   // right = forward × up
    const u = [r[1] * f[2] - r[2] * f[1], r[2] * f[0] - r[0] * f[2], r[0] * f[1] - r[1] * f[0]];
    const V = [r[0], u[0], -f[0], 0, r[1], u[1], -f[1], 0, r[2], u[2], -f[2], 0, -(r[0] * EYE[0] + r[1] * EYE[1] + r[2] * EYE[2]), -(u[0] * EYE[0] + u[1] * EYE[1] + u[2] * EYE[2]), f[0] * EYE[0] + f[1] * EYE[1] + f[2] * EYE[2], 1];
    const F = 1 / Math.tan(0.36), A = W / H, n = 1, fa = 600, nf = 1 / (n - fa);
    const P = [F / A, 0, 0, 0, 0, F, 0, 0, 0, 0, (fa + n) * nf, -1, 0, 0, 2 * fa * n * nf, 0], out = new Float32Array(16);
    for (let c = 0; c < 4; c++) for (let rr = 0; rr < 4; rr++) { let s = 0; for (let k = 0; k < 4; k++) s += P[k * 4 + rr] * V[c * 4 + k]; out[c * 4 + rr] = s; }
    return out;
  };
  // pointer: find the pin under it (on the board plane, at mid relief) and press nearby pins back
  const move = e => {
    const r = canvas.getBoundingClientRect(); ptr.sx = ((e.clientX - r.left) / r.width) * 2 - 1; ptr.sy = 1 - ((e.clientY - r.top) / r.height) * 2;
  };
  const down = e => { ptr.down = true; move(e); canvas.setPointerCapture(e.pointerId); };
  const up = () => { ptr.down = false; };
  canvas.addEventListener('pointerdown', down); canvas.addEventListener('pointermove', move); canvas.addEventListener('pointerup', up); canvas.addEventListener('pointercancel', up);

  let raf, last = performance.now(), t = 0, M = null;
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000) * PARAMS.speed; last = now; t += dt; phaseT += dt;
    // a cycle: push in (3 s), pull back leaving the imprint (hold 3 s), then sweep the board flat (1.5 s)
    const f = SHAPES[shape], push = phaseT < 3 ? phaseT / 3 : phaseT < 4 ? 1 - (phaseT - 3) : 0;
    const sweep = phaseT > 6.2 ? (phaseT - 6.2) / 1.5 : -1;
    if (phaseT > 7.9) { phaseT = 0; shape = (shape + 1) % SHAPES.length; }
    const pushE = push * push * (3 - 2 * push);
    for (let j = 0; j < NY; j++) for (let i = 0; i < NX; i++) {
      const k = j * NX + i, x = (i / (NX - 1)) * 2 - 1, y = ((j / (NY - 1)) * 2 - 1) * (NY / NX);
      if (sweep >= 0) { if ((x + 1) / 2 < sweep * 1.15 - 0.08) h[k] += (0 - h[k]) * Math.min(1, dt * 14); continue; }   // a palm sweeps them flat, left to right
      const target = f(x, y) * HMAX * (0.25 + 0.75 * pushE) * (push > 0 ? 1 : 0);
      if (target > h[k]) h[k] += Math.min(target - h[k], dt * 26);   // pins only ever get pushed forward
    }
    if (ptr.down && M) {                                           // press: pins near the pointer go back in
      for (let k = 0; k < N; k++) {
        const gx = grid[k * 2], gy = grid[k * 2 + 1], z = h[k] + 1.5;
        const cx = M[0] * gx + M[4] * gy + M[8] * z + M[12], cy = M[1] * gx + M[5] * gy + M[9] * z + M[13], cw = M[3] * gx + M[7] * gy + M[11] * z + M[15];
        const d = Math.hypot(cx / cw - ptr.sx, (cy / cw - ptr.sy) * H / W);
        if (d < 0.05) h[k] = Math.max(0, h[k] - dt * 30 * (1 - d / 0.05));
      }
    }
    // occlusion: a pin standing lower than its neighbours sits in their shade
    for (let j = 0; j < NY; j++) for (let i = 0; i < NX; i++) {
      const k = j * NX + i; let m = 0, c = 0;
      for (let dj = -1; dj <= 1; dj++) for (let di = -1; di <= 1; di++) { const ii = i + di, jj = j + dj; if (ii < 0 || jj < 0 || ii >= NX || jj >= NY || (!di && !dj)) continue; m += h[jj * NX + ii]; c++; }
      // and a raking light from the upper left: a taller pin a step or three that way casts this one into shadow
      let sh = 0; for (let st = 1; st <= 4; st++) { const ii = i - st, jj = j + st; if (ii < 0 || jj >= NY) break; sh = Math.max(sh, (h[jj * NX + ii] - h[k] - st * 0.9) / 1.5); }
      occ[k] = Math.min(1, Math.max(0, (m / c - h[k]) / 2.2, sh));
    }
    gl.bindFramebuffer(gl.FRAMEBUFFER, null); gl.viewport(0, 0, W, H);
    gl.clearColor(0.03, 0.03, 0.035, 1); gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT); gl.enable(gl.DEPTH_TEST);
    gl.useProgram(boardP.p); gl.bindVertexArray(qv); gl.drawArrays(gl.TRIANGLES, 0, 3);
    M = matrix(t);
    gl.useProgram(plateP.p); gl.uniformMatrix4fv(plateP.u.M, false, M); gl.uniform2f(plateP.u.S, bx, by); gl.bindVertexArray(pv); gl.drawArrays(gl.TRIANGLES, 0, 6);
    gl.useProgram(pinP.p); gl.uniformMatrix4fv(pinP.u.M, false, M); gl.uniform1f(pinP.u.SP, SP); gl.uniform3f(pinP.u.E, ...EYE);
    gl.bindVertexArray(vao);
    gl.bindBuffer(gl.ARRAY_BUFFER, hb); gl.bufferSubData(gl.ARRAY_BUFFER, 0, h);
    gl.bindBuffer(gl.ARRAY_BUFFER, ob); gl.bufferSubData(gl.ARRAY_BUFFER, 0, occ);
    gl.drawArraysInstanced(gl.TRIANGLES, 0, VCOUNT, N);
    gl.bindVertexArray(null); gl.disable(gl.DEPTH_TEST);
    raf = requestAnimationFrame(frame);
  }
  raf = requestAnimationFrame(frame);
  return () => {
    cancelAnimationFrame(raf); ro.disconnect();
    canvas.removeEventListener('pointerdown', down); canvas.removeEventListener('pointermove', move); canvas.removeEventListener('pointerup', up); canvas.removeEventListener('pointercancel', up);
    gl.getExtension('WEBGL_lose_context')?.loseContext(); canvas.remove();
  };
}
