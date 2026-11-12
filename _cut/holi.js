// Holi powder: handfuls of coloured powder thrown up into a bright sky, billowing and drifting as they slow. Every
// burst is a few thousand soft puffs that drag to a stop, swell and swirl in turbulence. To make them read as clouds
// rather than flat blobs, the puffs shade each other: each frame their density is splatted into a coarse 3D grid,
// light is marched through the grid from the sun, and each puff is lit by what gets through. The sun is behind the
// powder, so thin edges glow and thick cores go dusky. Puffs are sorted far to near and drawn over one another.
const PARAMS = { bursts: 1, puffs: 1100, wind: 1 };

export default function (stage) {
  const canvas = document.createElement('canvas');
  canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block';
  stage.append(canvas);
  const gl = canvas.getContext('webgl2', { antialias: false, premultipliedAlpha: true });
  if (!gl) { stage.textContent = 'This needs WebGL2.'; return () => canvas.remove(); }
  const PAL = [[0.95, 0.12, 0.55], [1, 0.82, 0.08], [0.1, 0.55, 0.95], [0.15, 0.78, 0.35], [1, 0.45, 0.08], [0.55, 0.22, 0.9], [0.98, 0.3, 0.3]];
  const SUN = (() => { const v = [0.35, 0.55, 0.75]; const l = Math.hypot(...v); return v.map(x => x / l); })();   // high, a little right, behind the powder
  const MAXP = 14000;
  const P = { x: new Float32Array(MAXP), y: new Float32Array(MAXP), z: new Float32Array(MAXP), vx: new Float32Array(MAXP), vy: new Float32Array(MAXP), vz: new Float32Array(MAXP), age: new Float32Array(MAXP), life: new Float32Array(MAXP), s: new Float32Array(MAXP), r: new Float32Array(MAXP), g: new Float32Array(MAXP), b: new Float32Array(MAXP), rot: new Float32Array(MAXP), light: new Float32Array(MAXP) };
  let count = 0;
  const hands = [-3.6, -1.6, 0.4, 2.3, 4.1];
  function burst() {
    const n = Math.round(PARAMS.puffs), hx = hands[(Math.random() * hands.length) | 0] + (Math.random() - 0.5) * 0.6, hz = 7 + Math.random() * 2, col = PAL[(Math.random() * PAL.length) | 0];
    const ax = (Math.random() - 0.5) * 1.1, power = 10 + Math.random() * 5;
    for (let k = 0; k < n; k++) {
      let i = count < MAXP ? count++ : (Math.random() * MAXP) | 0;   // when full, overwrite an old puff
      const u = Math.random(), a = Math.random() * 6.283, spread = 0.62 * Math.sqrt(u);
      P.x[i] = hx; P.y[i] = -1.2; P.z[i] = hz;
      const sp = power * (0.35 + 0.65 * Math.random());
      P.vx[i] = (ax + Math.cos(a) * spread) * sp; P.vy[i] = sp; P.vz[i] = Math.sin(a) * spread * sp;
      P.age[i] = 0; P.life[i] = 4.5 + Math.random() * 3; P.s[i] = 0.08 + Math.random() * 0.08; P.rot[i] = Math.random() * 6.283;
      const j = (Math.random() - 0.5) * 0.12; P.r[i] = Math.min(1, col[0] + j); P.g[i] = Math.min(1, col[1] + j); P.b[i] = Math.min(1, col[2] + j);
    }
  }
  // the shadow grid over the space where powder flies
  const GX = 30, GY = 20, GZ = 16, X0 = -8, X1 = 8, Y0 = 0, Y1 = 9, Z0 = 3, Z1 = 13;
  const dens = new Float32Array(GX * GY * GZ), trans = new Float32Array(GX * GY * GZ);
  const cell = (x, y, z) => { const i = Math.floor((x - X0) / (X1 - X0) * GX), j = Math.floor((y - Y0) / (Y1 - Y0) * GY), k = Math.floor((z - Z0) / (Z1 - Z0) * GZ); return i < 0 || j < 0 || k < 0 || i >= GX || j >= GY || k >= GZ ? -1 : (k * GY + j) * GX + i; };
  function shade() {
    dens.fill(0);
    for (let i = 0; i < count; i++) { const c = cell(P.x[i], P.y[i], P.z[i]); if (c >= 0) dens[c] += alphaOf(i) * P.s[i] * P.s[i] * 3; }
    // march toward the sun from every cell, summing density: how much light reaches it
    const sx = SUN[0] / (X1 - X0) * GX, sy = SUN[1] / (Y1 - Y0) * GY, sz = SUN[2] / (Z1 - Z0) * GZ, sl = Math.max(Math.abs(sx), Math.abs(sy), Math.abs(sz)), dx = sx / sl, dy = sy / sl, dz = sz / sl;
    for (let k = 0; k < GZ; k++) for (let j = 0; j < GY; j++) for (let i = 0; i < GX; i++) {
      let x = i + 0.5, y = j + 0.5, z = k + 0.5, tau = 0;
      for (let s = 0; s < 20; s++) { x += dx; y += dy; z += dz; if (x < 0 || y < 0 || z < 0 || x >= GX || y >= GY || z >= GZ) break; tau += dens[((z | 0) * GY + (y | 0)) * GX + (x | 0)]; }
      trans[(k * GY + j) * GX + i] = Math.exp(-tau * 0.6);
    }
    for (let i = 0; i < count; i++) { const c = cell(P.x[i], P.y[i], P.z[i]); P.light[i] = c >= 0 ? trans[c] : 1; }
  }
  const alphaOf = i => { const a = P.age[i], l = P.life[i]; return Math.min(1, a / 0.15) * Math.max(0, 1 - a / l) * 0.55 / (1 + a * 0.6); };

  // GL: the sky and a crowd's silhouette; then the puffs as textured, rotated sprites
  const sh = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s)); return s; };
  const prog = (vs, fs) => {
    const p = gl.createProgram(); gl.attachShader(p, sh(gl.VERTEX_SHADER, vs)); gl.attachShader(p, sh(gl.FRAGMENT_SHADER, fs)); gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
    const u = {}; for (let i = 0, n = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS); i < n; i++) { const nm = gl.getActiveUniform(p, i).name; u[nm] = gl.getUniformLocation(p, nm); }
    return { p, u };
  };
  const QUAD = `#version 300 es
  layout(location = 0) in vec2 p; out vec2 uv; void main() { uv = p * .5 + .5; gl_Position = vec4(p, 0, 1); }`;
  const skyP = prog(QUAD, `#version 300 es
  precision highp float; in vec2 uv; out vec4 o; uniform vec2 R; uniform vec3 SUNS;
  void main() {
    vec3 c = mix(vec3(1., .9, .78), vec3(.36, .6, .93), smoothstep(.0, .95, uv.y));
    vec2 q = (uv - SUNS.xy) * vec2(R.x / R.y, 1.); float d = length(q);
    c += vec3(1., .95, .8) * (exp(-d * 9.) * .6 + smoothstep(.045, .035, d) * .9);
    o = vec4(c, 1);
  }`);
  const puffP = prog(`#version 300 es
  layout(location = 0) in vec2 c; layout(location = 1) in vec4 PS; layout(location = 2) in vec4 CL;   // PS: x y z size; CL: r g b alpha
  layout(location = 3) in vec2 RL;                               // rotation, light
  uniform float A, FOC; uniform vec3 SUN; out vec2 q; out vec4 col; out float lit, rot, back;
  void main() {
    vec3 p = PS.xyz; vec2 v = vec2(p.x, p.y - 2.2) / p.z * FOC;
    gl_Position = vec4((v.x + c.x * PS.w * FOC / p.z) / A, v.y + c.y * PS.w * FOC / p.z, 0, 1);
    q = c; col = CL; lit = RL.y; rot = RL.x;
    back = pow(max(0., dot(normalize(p), SUN)), 4.);             // looking toward the sun through thin powder
  }`, `#version 300 es
  precision highp float; in vec2 q; in vec4 col; in float lit, rot, back; out vec4 o; uniform sampler2D TX;
  void main() {
    float c = cos(rot), s = sin(rot); vec2 r = mat2(c, -s, s, c) * q;
    float tex = texture(TX, r * .5 + .5).r, a = col.a * tex;
    if (a < .004) discard;
    vec3 sky = vec3(.55, .7, .95), sunc = vec3(1., .93, .78);
    vec3 cc = col.rgb * (sky * .55 + sunc * (.25 + lit * .8)) + col.rgb * sunc * lit * back * (1. - tex) * 1.6;   // thin edges glow when backlit
    o = vec4(cc * a, a);
  }`);
  // a soft, lumpy puff texture: noise inside a falling-off disc
  const TS = 64, tdata = new Uint8Array(TS * TS * 4);
  const hh = (x, y) => { const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453; return s - Math.floor(s); };
  const vn = (x, y) => { const xi = Math.floor(x), yi = Math.floor(y), u = x - xi, v = y - yi, su = u * u * (3 - 2 * u), sv = v * v * (3 - 2 * v); return hh(xi, yi) * (1 - su) * (1 - sv) + hh(xi + 1, yi) * su * (1 - sv) + hh(xi, yi + 1) * (1 - su) * sv + hh(xi + 1, yi + 1) * su * sv; };
  for (let y = 0; y < TS; y++) for (let x = 0; x < TS; x++) {
    const u = (x / (TS - 1)) * 2 - 1, v = (y / (TS - 1)) * 2 - 1, r = Math.hypot(u, v), n = vn(u * 3 + 9, v * 3) * 0.6 + vn(u * 7, v * 7 + 4) * 0.4;
    const val = Math.max(0, Math.min(1, (1 - r) * 1.9 - 0.45 + (n - 0.5) * 1.3)) ** 1.1;
    tdata.set([val * 255, 0, 0, 255], (y * TS + x) * 4);
  }
  const tex = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, tex); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, TS, TS, 0, gl.RGBA, gl.UNSIGNED_BYTE, tdata);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  const quadV = gl.createVertexArray(); gl.bindVertexArray(quadV);
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer()); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW); gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  const puffV = gl.createVertexArray(); gl.bindVertexArray(puffV);
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer()); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW); gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  const inst = new Float32Array(MAXP * 10), ib = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, ib); gl.bufferData(gl.ARRAY_BUFFER, inst.byteLength, gl.DYNAMIC_DRAW);
  gl.enableVertexAttribArray(1); gl.vertexAttribPointer(1, 4, gl.FLOAT, false, 40, 0); gl.vertexAttribDivisor(1, 1);
  gl.enableVertexAttribArray(2); gl.vertexAttribPointer(2, 4, gl.FLOAT, false, 40, 16); gl.vertexAttribDivisor(2, 1);
  gl.enableVertexAttribArray(3); gl.vertexAttribPointer(3, 2, gl.FLOAT, false, 40, 32); gl.vertexAttribDivisor(3, 1);
  gl.bindVertexArray(null);

  let W = 1, H = 1;
  const resize = () => { const d = Math.min(devicePixelRatio, 2); W = canvas.width = Math.max(1, (stage.clientWidth * d) | 0); H = canvas.height = Math.max(1, (stage.clientHeight * d) | 0); };
  const ro = new ResizeObserver(resize); ro.observe(stage); resize();
  const FOC = 1.5;
  let raf, last = performance.now(), t = 0, next = 0, order = new Uint32Array(MAXP), depth = new Float32Array(MAXP);
  for (let i = 0; i < 4; i++) { burst(); for (let s = 0; s < 40 + i * 30; s++) step(1 / 60); }   // a sky already full of colour
  function step(dt) {
    t += dt;
    for (let i = 0; i < count; i++) {
      if (P.age[i] > P.life[i]) continue;
      const drag = Math.exp(-dt * (2.4 + P.age[i]));
      // turbulence: a smooth swirling field, plus a breeze to the right
      const tx = Math.sin(P.y[i] * 1.3 + t * 0.7) + Math.sin(P.z[i] * 0.9 - t * 0.4), ty = Math.sin(P.z[i] * 1.1 + t * 0.6) * 0.6, tz = Math.cos(P.x[i] * 1.2 - t * 0.5);
      P.vx[i] = P.vx[i] * drag + (tx * 0.9 + 0.6 * PARAMS.wind) * dt; P.vy[i] = P.vy[i] * drag + (ty * 0.9 - 0.25) * dt; P.vz[i] = P.vz[i] * drag + tz * 0.9 * dt;
      P.x[i] += P.vx[i] * dt; P.y[i] += P.vy[i] * dt; P.z[i] += P.vz[i] * dt;
      P.age[i] += dt; P.s[i] += dt * (0.14 + 0.3 / (1 + P.age[i] * 2)); P.rot[i] += dt * 0.3 * ((i & 1) * 2 - 1);
    }
  }
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    step(dt);
    if (t > next) { burst(); next = t + (0.7 + Math.random() * 0.9) / Math.max(0.2, PARAMS.bursts); }
    // compact out the dead now and then
    if (Math.random() < 0.05) { let j = 0; for (let i = 0; i < count; i++) if (P.age[i] <= P.life[i]) { if (i !== j) for (const k in P) P[k][j] = P[k][i]; j++; } count = j; }
    shade();
    // sort far to near, then pack the instance buffer
    let n = 0; for (let i = 0; i < count; i++) if (P.age[i] <= P.life[i]) { order[n] = i; depth[i] = P.z[i]; n++; }
    const ord = order.subarray(0, n).sort((a, b) => depth[b] - depth[a]);
    for (let k = 0; k < n; k++) { const i = ord[k], o = k * 10; inst[o] = P.x[i]; inst[o + 1] = P.y[i]; inst[o + 2] = P.z[i]; inst[o + 3] = P.s[i]; inst[o + 4] = P.r[i]; inst[o + 5] = P.g[i]; inst[o + 6] = P.b[i]; inst[o + 7] = alphaOf(i); inst[o + 8] = P.rot[i]; inst[o + 9] = P.light[i]; }
    gl.bindFramebuffer(gl.FRAMEBUFFER, null); gl.viewport(0, 0, W, H); gl.disable(gl.BLEND);
    gl.useProgram(skyP.p); gl.uniform2f(skyP.u.R, W, H);
    // where the sun sits on screen
    const sz = SUN[2], sv = [SUN[0] / sz * FOC / (W / H), (SUN[1] / sz) * FOC]; gl.uniform3f(skyP.u.SUNS, sv[0] * 0.5 + 0.5, Math.min(0.92, sv[1] * 0.5 + 0.5), 0);
    gl.bindVertexArray(quadV); gl.drawArrays(gl.TRIANGLES, 0, 3);
    gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    gl.useProgram(puffP.p); gl.uniform1f(puffP.u.A, W / H); gl.uniform1f(puffP.u.FOC, FOC); gl.uniform3f(puffP.u.SUN, ...SUN);
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, tex); gl.uniform1i(puffP.u.TX, 0);
    gl.bindVertexArray(puffV); gl.bindBuffer(gl.ARRAY_BUFFER, ib); gl.bufferSubData(gl.ARRAY_BUFFER, 0, inst, 0, n * 10);
    gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, n);
    gl.disable(gl.BLEND); gl.bindVertexArray(null);
    raf = requestAnimationFrame(frame);
  }
  raf = requestAnimationFrame(frame);
  return () => { cancelAnimationFrame(raf); ro.disconnect(); gl.getExtension('WEBGL_lose_context')?.loseContext(); canvas.remove(); };
}
