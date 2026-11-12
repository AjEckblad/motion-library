// Klein bottle: a surface with no inside or outside. The neck bends round and passes through the wall to join the
// base from within, so a path along it ends up on the "other" side. It is built from its parametric equations as a
// triangle mesh (normals from the derivative directions), drawn with depth testing and lit on both faces, since every
// face is seen from both sides. Glowing grid lines follow the parameter lines, which makes the twist readable.
const PARAMS = { spin: 1, grid: 1 };

export default function (stage) {
  const canvas = document.createElement('canvas');
  canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block';
  stage.append(canvas);
  const gl = canvas.getContext('webgl2', { antialias: true });
  if (!gl) { stage.textContent = 'This needs WebGL2.'; return () => canvas.remove(); }
  // the classic "bottle" parametrisation, u in [0, π), v in [0, 2π)
  const K = (u, v) => {
    const cu = Math.cos(u), su = Math.sin(u), cv = Math.cos(v), sv = Math.sin(v);
    const x = -2 / 15 * cu * (3 * cv - 30 * su + 90 * cu ** 4 * su - 60 * cu ** 6 * su + 5 * cu * cv * su);
    const y = -1 / 15 * su * (3 * cv - 3 * cu ** 2 * cv - 48 * cu ** 4 * cv + 48 * cu ** 6 * cv - 60 * su + 5 * cu * cv * su - 5 * cu ** 3 * cv * su - 80 * cu ** 5 * cv * su + 80 * cu ** 7 * cv * su);
    const z = 2 / 15 * (3 + 5 * cu * su) * sv;
    return [x, y, z];
  };
  const NU = 160, NV = 48, pos = [], nor = [], tex = [], idx = [];
  for (let i = 0; i <= NU; i++) for (let j = 0; j <= NV; j++) {
    const u = i / NU * Math.PI, v = j / NV * Math.PI * 2, e = 1e-4, p = K(u, v), pu = K(u + e, v), pv = K(u, v + e);
    const a = pu.map((c, k) => c - p[k]), b = pv.map((c, k) => c - p[k]);
    let n = [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]; const l = Math.hypot(...n) || 1; n = n.map(c => c / l);
    pos.push(...p); nor.push(...n); tex.push(i / NU, j / NV);
  }
  // centre it and scale it to a unit-ish size
  const lo = [1e9, 1e9, 1e9], hi = [-1e9, -1e9, -1e9];
  for (let i = 0; i < pos.length; i++) { lo[i % 3] = Math.min(lo[i % 3], pos[i]); hi[i % 3] = Math.max(hi[i % 3], pos[i]); }
  const mid = lo.map((v, k) => (v + hi[k]) / 2), span = Math.max(...hi.map((v, k) => v - lo[k]));
  for (let i = 0; i < pos.length; i++) pos[i] = (pos[i] - mid[i % 3]) / span * 4.6;
  for (let i = 0; i < NU; i++) for (let j = 0; j < NV; j++) { const a = i * (NV + 1) + j, b = a + NV + 1; idx.push(a, b, a + 1, b, b + 1, a + 1); }
  const vs = `#version 300 es
  in vec3 P, N; in vec2 UV; uniform mat4 M, V; out vec3 n, w; out vec2 uv;
  void main() { vec4 wp = M * vec4(P, 1); w = wp.xyz; n = mat3(M) * N; uv = UV; gl_Position = V * wp; }`;
  const fs = `#version 300 es
  precision highp float; in vec3 n, w; in vec2 uv; uniform vec3 E; uniform float G, T; out vec4 o;
  void main() {
    vec3 N = normalize(n) * (gl_FrontFacing ? 1. : -1.), vd = normalize(E - w);
    if (dot(N, vd) < 0.) N = -N;                                           // lit from whichever side we see
    vec3 L = normalize(vec3(.5, .9, -.4));
    float dif = max(dot(N, L), 0.), rim = pow(1. - max(dot(N, vd), 0.), 3.);
    vec3 base = .5 + .5 * cos(6.28 * (uv.x * .9 + uv.y * .15 + vec3(0, .33, .67)) + T * .3);   // hue flows along the bottle
    // a see-through hologram: faint body, bright rims and grid lines, all added up, so the neck shows passing through the wall
    vec3 col = base * (.05 + .12 * dif) + base * rim * .55 + pow(max(dot(reflect(-L, N), vd), 0.), 40.) * .25;
    vec2 g = abs(fract(uv * vec2(32., 16.)) - .5) / fwidth(uv * vec2(32., 16.));
    float line = 1. - min(min(g.x, g.y), 1.);
    col += mix(base, vec3(1), .5) * line * .32 * G;
    o = vec4(col, 1);
  }`;
  const sh = (t, s) => { const x = gl.createShader(t); gl.shaderSource(x, s); gl.compileShader(x); if (!gl.getShaderParameter(x, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(x)); return x; };
  const prog = gl.createProgram(); gl.attachShader(prog, sh(gl.VERTEX_SHADER, vs)); gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, fs));
  gl.bindAttribLocation(prog, 0, 'P'); gl.bindAttribLocation(prog, 1, 'N'); gl.bindAttribLocation(prog, 2, 'UV'); gl.linkProgram(prog); gl.useProgram(prog);
  const buf = (data, loc, size) => { gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer()); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.STATIC_DRAW); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, size, gl.FLOAT, false, 0, 0); };
  buf(pos, 0, 3); buf(nor, 1, 3); buf(tex, 2, 2);
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, gl.createBuffer()); gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint32Array(idx), gl.STATIC_DRAW);
  gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE);                     // additive: no sorting needed, every layer shows
  const U = {}; ['M', 'V', 'E', 'G', 'T'].forEach(n => U[n] = gl.getUniformLocation(prog, n));
  const resize = () => { const d = Math.min(devicePixelRatio, 2); canvas.width = (stage.clientWidth || 1) * d | 0; canvas.height = (stage.clientHeight || 1) * d | 0; gl.viewport(0, 0, canvas.width, canvas.height); };
  const ro = new ResizeObserver(resize); ro.observe(stage); resize();
  const mul = (a, b) => { const o = new Float32Array(16); for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) { let s = 0; for (let k = 0; k < 4; k++) s += a[k * 4 + j] * b[i * 4 + k]; o[i * 4 + j] = s; } return o; };
  let raf, last = performance.now(), ang = 0;
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000); last = now; ang += dt * 0.4 * PARAMS.spin;
    const t = now / 1000, asp = canvas.width / canvas.height, f = 1 / Math.tan(0.5), near = 0.1, far = 50;
    const P = new Float32Array([f / asp, 0, 0, 0, 0, f, 0, 0, 0, 0, (far + near) / (near - far), -1, 0, 0, 2 * far * near / (near - far), 0]);
    const dist = 5.2 * Math.max(1, 1.1 / asp), E = [0, 0.4, dist];
    const Vw = new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, -E[0], -E[1], -E[2], 1]);
    const ca = Math.cos(ang), sa = Math.sin(ang), tb = 0.35 + Math.sin(t * 0.2) * 0.2, cb = Math.cos(tb), sb = Math.sin(tb);
    const Ry = new Float32Array([ca, 0, -sa, 0, 0, 1, 0, 0, sa, 0, ca, 0, 0, 0, 0, 1]), Rx = new Float32Array([1, 0, 0, 0, 0, cb, sb, 0, 0, -sb, cb, 0, 0, 0, 0, 1]);
    gl.clearColor(0.015, 0.018, 0.035, 1); gl.clear(gl.COLOR_BUFFER_BIT);
    gl.uniformMatrix4fv(U.M, false, mul(Rx, Ry)); gl.uniformMatrix4fv(U.V, false, mul(P, Vw));
    gl.uniform3fv(U.E, E); gl.uniform1f(U.G, PARAMS.grid); gl.uniform1f(U.T, t);
    gl.drawElements(gl.TRIANGLES, idx.length, gl.UNSIGNED_INT, 0);
    raf = requestAnimationFrame(frame);
  }
  raf = requestAnimationFrame(frame);
  return () => { cancelAnimationFrame(raf); ro.disconnect(); gl.getExtension('WEBGL_lose_context')?.loseContext(); canvas.remove(); };
}
