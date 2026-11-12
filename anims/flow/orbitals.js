// Hydrogen orbitals: a quarter of a million particles, each a guess at where the electron is. Every frame each one
// proposes a small random step and keeps it with probability |ψ(new)|² / |ψ(old)|² (the Metropolis rule), so the
// cloud's density always follows the exact wavefunction: the real solution of the Schrödinger equation, built from
// Laguerre polynomials and spherical harmonics. Colour is the phase of ψ, which turns with time. Between orbitals the
// atom is in a superposition of both, and the cloud flows from one shape into the next.
const PARAMS = { grid: 512, speed: 1, glow: 1 };

export default function (stage) {
  const canvas = document.createElement('canvas');
  canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block';
  const label = document.createElement('div');
  label.style.cssText = 'position:absolute;left:14px;bottom:12px;font:500 12px/1.3 ui-monospace,SFMono-Regular,Menlo,monospace;color:rgba(214,226,255,.62);letter-spacing:.04em;pointer-events:none;white-space:pre';
  stage.append(canvas, label);
  const gl = canvas.getContext('webgl2', { antialias: false });
  if (!gl || !gl.getExtension('EXT_color_buffer_float')) { stage.textContent = 'This needs WebGL2 with float render targets.'; return () => canvas.remove(); }
  const G = Math.max(64, Math.round(PARAMS.grid)), COUNT = G * G;

  // n, l, m: the order they appear in; the cloud flows from each into the next
  const STATES = [[2, 1, 1], [3, 2, 0], [3, 2, 2], [4, 3, 1], [3, 2, 1], [4, 3, 3], [4, 3, 0], [1, 0, 0], [2, 1, 0]];
  const HOLD = 5.5, MORPH = 4.5, SUB = 'spdf', name = s => `${s[0]}${SUB[s[1]]}`;
  const reach = s => 2.3 * s[0] * s[0] + 1.2;                    // how far out the cloud extends, in Bohr radii

  const ORB = `
  float fact(int n) { float f = 1.; for (int i = 2; i <= n; i++) f *= float(i); return f; }
  float lag(int k, float a, float x) {                            // generalised Laguerre polynomial L_k^a(x)
    float L0 = 1., L1 = 1. + a - x; if (k == 0) return L0;
    for (int i = 1; i < k; i++) { float L2 = ((2. * float(i) + 1. + a - x) * L1 - (float(i) + a) * L0) / float(i + 1); L0 = L1; L1 = L2; }
    return L1;
  }
  float leg(int l, int m, float x) {                              // associated Legendre polynomial P_l^m(x)
    float s = sqrt(max(0., 1. - x * x)), pmm = 1., f = 1.;
    for (int i = 0; i < m; i++) { pmm *= -f * s; f += 2.; }
    if (l == m) return pmm;
    float pm1 = x * float(2 * m + 1) * pmm; if (l == m + 1) return pm1;
    float pll = 0.;
    for (int ll = m + 2; ll <= l; ll++) { pll = (x * float(2 * ll - 1) * pm1 - float(ll + m - 1) * pmm) / float(ll - m); pmm = pm1; pm1 = pll; }
    return pll;
  }
  vec2 psi(vec3 p, ivec3 q) {                                     // the hydrogen eigenstate ψ_nlm, complex
    int n = q.x, l = q.y, m = q.z, am = abs(m);
    float r = length(p) + 1e-6, rho = 2. * r / float(n), rl = 1.;
    for (int i = 0; i < l; i++) rl *= rho;
    float R = sqrt(pow(2. / float(n), 3.) * fact(n - l - 1) / (2. * float(n) * fact(n + l))) * exp(-.5 * rho) * rl * lag(n - l - 1, float(2 * l + 1), rho);
    float Y = sqrt(float(2 * l + 1) / 12.566371 * fact(l - am) / fact(l + am)) * leg(l, am, p.z / r);
    float ph = float(m) * atan(p.y, p.x);
    return R * Y * vec2(cos(ph), sin(ph));
  }
  uniform ivec3 QA, QB; uniform float MIX, T;
  vec2 cmul(vec2 a, vec2 b) { return vec2(a.x * b.x - a.y * b.y, a.x * b.y + a.y * b.x); }
  vec2 wave(vec3 p) {                                             // the superposition, each part turning at its own energy
    float ea = -.5 / float(QA.x * QA.x), eb = -.5 / float(QB.x * QB.x), k = 3.14159;
    return cmul(psi(p, QA) * cos(MIX * 1.5708), vec2(cos(ea * T * k), -sin(ea * T * k)))
         + cmul(psi(p, QB) * sin(MIX * 1.5708), vec2(cos(eb * T * k), -sin(eb * T * k)));
  }`;
  const QUAD = `#version 300 es
  in vec2 p; out vec2 uv; void main() { uv = p * .5 + .5; gl_Position = vec4(p, 0, 1); }`;
  const simFS = `#version 300 es
  precision highp float; in vec2 uv; out vec4 o; uniform sampler2D S; uniform float F, SC;
  ${ORB}
  vec3 h3(vec3 p) { p = fract(p * vec3(.1031, .103, .0973)); p += dot(p, p.yxz + 33.33); return fract((p.xxy + p.yxx) * p.zyx); }
  void main() {
    vec3 p = texture(S, uv).xyz, r = h3(vec3(gl_FragCoord.xy, F)), r2 = h3(r * 91.7 + F * .13), q;
    if (r2.x < .05) {                                             // now and then a long jump anywhere, so lobes behind nodes still fill
      vec3 d = normalize(h3(r2 * 37.1 + 5.) - .5 + 1e-4); q = d * pow(r2.y, .333) * SC * 1.3;
    } else q = p + (r - .5) * SC * .1;
    vec2 a = wave(p), b = wave(q);
    float accept = dot(b, b) / max(dot(a, a), 1e-37);
    o = vec4(r2.z < accept ? q : p, 1);
  }`;
  const drawVS = `#version 300 es
  precision highp float; uniform sampler2D S; uniform int G; uniform mat4 M; uniform float PS, D, SC; out vec3 c;
  ${ORB}
  void main() {
    vec3 p = texelFetch(S, ivec2(gl_VertexID % G, gl_VertexID / G), 0).xyz;
    vec2 w = wave(p); float h = atan(w.y, w.x) / 6.2831853;
    c = .5 + .5 * cos(6.2831853 * (h + vec3(0., .33, .67)));     // phase → hue
    c = mix(vec3(.6, .7, 1.), c, .85);
    gl_Position = M * vec4(p, 1); gl_PointSize = PS;
    c *= 1.25 - .5 * smoothstep(-1., 1., (gl_Position.w - D) / SC);  // the far side of the cloud is dimmer: depth
  }`;
  const drawFS = `#version 300 es
  precision mediump float; in vec3 c; out vec4 o; uniform float K;
  void main() { vec2 q = gl_PointCoord * 2. - 1.; o = vec4(c * K * max(0., 1. - dot(q, q)), 1); }`;
  const downFS = `#version 300 es
  precision highp float; in vec2 uv; out vec4 o; uniform sampler2D S; uniform vec2 H;
  void main() { o = (texture(S, uv) * 4. + texture(S, uv - H) + texture(S, uv + H) + texture(S, uv + vec2(H.x, -H.y)) + texture(S, uv - vec2(H.x, -H.y))) / 8.; }`;
  const upFS = `#version 300 es
  precision highp float; in vec2 uv; out vec4 o; uniform sampler2D S; uniform vec2 H;
  void main() { o = (texture(S, uv + vec2(-2. * H.x, 0)) + texture(S, uv + vec2(2. * H.x, 0)) + texture(S, uv + vec2(0, 2. * H.y)) + texture(S, uv + vec2(0, -2. * H.y))
    + 2. * (texture(S, uv + H) + texture(S, uv - H) + texture(S, uv + vec2(H.x, -H.y)) + texture(S, uv - vec2(H.x, -H.y)))) / 12.; }`;
  const finalFS = `#version 300 es
  precision highp float; in vec2 uv; out vec4 o; uniform sampler2D S, B; uniform float K, T; uniform vec2 R;
  float h2(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  void main() {
    vec2 d = (uv - .5) * vec2(R.x / R.y, 1.);
    vec3 c = texture(S, uv).rgb; c = pow(c, vec3(1.65)) * 3.;     // steeper: lobes stand out, the thin fringe falls away
    c += texture(B, uv).rgb * K + vec3(.004, .006, .016) * (1. - length(d));
    c = (c * (2.51 * c + .03)) / (c * (2.43 * c + .59) + .14);
    o = vec4(pow(clamp(c, 0., 1.), vec3(1. / 2.2)) + (h2(uv * R + fract(T) * 91.) - .5) / 160., 1);
  }`;

  const sh = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s)); return s; };
  const prog = (vs, fs) => {
    const p = gl.createProgram(); gl.attachShader(p, sh(gl.VERTEX_SHADER, vs)); gl.attachShader(p, sh(gl.FRAGMENT_SHADER, fs)); gl.bindAttribLocation(p, 0, 'p'); gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
    const u = {}; for (let i = 0, n = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS); i < n; i++) { const nm = gl.getActiveUniform(p, i).name; u[nm] = gl.getUniformLocation(p, nm); }
    return { p, u };
  };
  const simP = prog(QUAD, simFS), drawP = prog(drawVS, drawFS), downP = prog(QUAD, downFS), upP = prog(QUAD, upFS), finalP = prog(QUAD, finalFS);

  const tex = (w, h, f, t, data = null, filt = gl.LINEAR) => {
    const x = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, x); gl.texImage2D(gl.TEXTURE_2D, 0, f, w, h, 0, gl.RGBA, t, data);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filt); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filt);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    const fb = gl.createFramebuffer(); gl.bindFramebuffer(gl.FRAMEBUFFER, fb); gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, x, 0);
    return { tex: x, fb, w, h };
  };
  // particles start as a loose ball and condense into the first orbital
  const init = new Float32Array(COUNT * 4), r0 = reach(STATES[0]);
  for (let i = 0; i < COUNT; i++) { const u = Math.random() * 2 - 1, a = Math.random() * 6.283, s = Math.sqrt(1 - u * u), r = Math.cbrt(Math.random()) * r0; init.set([Math.cos(a) * s * r, Math.sin(a) * s * r, u * r, 1], i * 4); }
  let A = tex(G, G, gl.RGBA32F, gl.FLOAT, init, gl.NEAREST), B = tex(G, G, gl.RGBA32F, gl.FLOAT, init, gl.NEAREST);

  const quad = gl.createVertexArray(); gl.bindVertexArray(quad);
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer()); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  const empty = gl.createVertexArray();

  let W = 1, H = 1, scene = null, mips = [];
  const resize = () => {
    const w = stage.clientWidth || 1, h = stage.clientHeight || 1, d = Math.min(devicePixelRatio, 2);
    W = canvas.width = Math.max(1, (w * d) | 0); H = canvas.height = Math.max(1, (h * d) | 0);
    for (const r of [scene, ...mips]) if (r) { gl.deleteTexture(r.tex); gl.deleteFramebuffer(r.fb); }
    scene = tex(W, H, gl.RGBA16F, gl.HALF_FLOAT); mips = [];
    let mw = W, mh = H; for (let i = 0; i < 5; i++) { mw = Math.max(1, mw >> 1); mh = Math.max(1, mh >> 1); mips.push(tex(mw, mh, gl.RGBA16F, gl.HALF_FLOAT)); }
  };
  const ro = new ResizeObserver(resize); ro.observe(stage); resize();

  const pass = (P, target, src) => {
    gl.useProgram(P.p); gl.bindFramebuffer(gl.FRAMEBUFFER, target ? target.fb : null); gl.viewport(0, 0, target ? target.w : W, target ? target.h : H);
    if (src) { gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, src); gl.uniform1i(P.u.S, 0); }
    gl.bindVertexArray(quad);
  };
  const setWave = (P, qa, qb, mix, t) => { gl.uniform3i(P.u.QA, ...qa); gl.uniform3i(P.u.QB, ...qb); gl.uniform1f(P.u.MIX, mix); gl.uniform1f(P.u.T, t); };
  // a camera circling the atom's z axis, looking slightly down on it
  const view = (az, el, dist, aspect) => {
    const ex = Math.cos(el) * Math.cos(az) * dist, ey = Math.cos(el) * Math.sin(az) * dist, ez = Math.sin(el) * dist;
    let fx = -ex, fy = -ey, fz = -ez; const fl = Math.hypot(fx, fy, fz); fx /= fl; fy /= fl; fz /= fl;
    let rx = fy * 1 - fz * 0, ry = fz * 0 - fx * 1, rz = 0; const rl = Math.hypot(rx, ry) || 1; rx /= rl; ry /= rl;
    const ux = ry * fz - rz * fy, uy = rz * fx - rx * fz, uz = rx * fy - ry * fx;
    const f = 1 / Math.tan(0.36), near = dist * 0.05, far = dist * 4, nf = 1 / (near - far);
    const V = [rx, ux, -fx, 0, ry, uy, -fy, 0, rz, uz, -fz, 0, -(rx * ex + ry * ey + rz * ez), -(ux * ex + uy * ey + uz * ez), fx * ex + fy * ey + fz * ez, 1];
    const P = [f / aspect, 0, 0, 0, 0, f, 0, 0, 0, 0, (far + near) * nf, -1, 0, 0, 2 * far * near * nf, 0];
    const M = new Float32Array(16);
    for (let c = 0; c < 4; c++) for (let r = 0; r < 4; r++) { let s = 0; for (let k = 0; k < 4; k++) s += P[k * 4 + r] * V[c * 4 + k]; M[c * 4 + r] = s; }
    return M;
  };

  let raf, last = performance.now(), t = 0, frameNo = 0, shown = '';
  const ease = x => x * x * (3 - 2 * x);
  function frame(now) {
    t += Math.min(0.05, (now - last) / 1000) * PARAMS.speed; last = now; frameNo++;
    // where we are in the sequence: holding one state, or flowing to the next
    const period = HOLD + MORPH, k = Math.floor(t / period), local = t - k * period;
    const qa = STATES[k % STATES.length], qb = STATES[(k + 1) % STATES.length];
    const mix = local < HOLD ? 0 : ease((local - HOLD) / MORPH);
    const sc = reach(qa) + (reach(qb) - reach(qa)) * mix;
    const txt = mix === 0 ? `${name(qa)}   n=${qa[0]}  l=${qa[1]}  m=${qa[2]}` : `${name(qa)} + ${name(qb)}   superposition`;
    if (txt !== shown) { label.textContent = txt; shown = txt; }

    gl.disable(gl.BLEND);
    for (let s = 0; s < 2; s++) {                                 // two Metropolis steps per frame
      pass(simP, B, A.tex); gl.uniform1f(simP.u.F, frameNo * 2 + s); gl.uniform1f(simP.u.SC, sc); setWave(simP, qa, qb, mix, t);
      gl.drawArrays(gl.TRIANGLES, 0, 3); [A, B] = [B, A];
    }
    gl.bindFramebuffer(gl.FRAMEBUFFER, scene.fb); gl.viewport(0, 0, W, H); gl.clearColor(0, 0, 0, 1); gl.clear(gl.COLOR_BUFFER_BIT);
    gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE);
    gl.useProgram(drawP.p); gl.bindVertexArray(empty); gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, A.tex);
    gl.uniform1i(drawP.u.S, 0); gl.uniform1i(drawP.u.G, G); setWave(drawP, qa, qb, mix, t);
    gl.uniformMatrix4fv(drawP.u.M, false, view(t * 0.16, 0.78 + 0.32 * Math.sin(t * 0.13), sc * 3.1, W / H));
    gl.uniform1f(drawP.u.PS, Math.max(1, H / 480)); gl.uniform1f(drawP.u.D, sc * 3.1); gl.uniform1f(drawP.u.SC, sc); gl.uniform1f(drawP.u.K, 0.05 * (262144 / COUNT) * Math.min(1, (H / 480) ** 2));   // the same glow at any size or count
    gl.drawArrays(gl.POINTS, 0, COUNT);
    let src = scene;
    gl.disable(gl.BLEND);
    for (const m of mips) { pass(downP, m, src.tex); gl.uniform2f(downP.u.H, 0.5 / src.w, 0.5 / src.h); gl.drawArrays(gl.TRIANGLES, 0, 3); src = m; }
    gl.enable(gl.BLEND);
    for (let i = mips.length - 1; i > 0; i--) { pass(upP, mips[i - 1], mips[i].tex); gl.uniform2f(upP.u.H, 0.5 / mips[i].w, 0.5 / mips[i].h); gl.drawArrays(gl.TRIANGLES, 0, 3); }
    gl.disable(gl.BLEND);
    pass(finalP, null, scene.tex); gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, mips[0].tex); gl.uniform1i(finalP.u.B, 1);
    gl.uniform1f(finalP.u.K, 0.35 * PARAMS.glow); gl.uniform1f(finalP.u.T, t); gl.uniform2f(finalP.u.R, W, H); gl.drawArrays(gl.TRIANGLES, 0, 3);
    gl.activeTexture(gl.TEXTURE0);
    raf = requestAnimationFrame(frame);
  }
  raf = requestAnimationFrame(frame);
  return () => { cancelAnimationFrame(raf); ro.disconnect(); gl.getExtension('WEBGL_lose_context')?.loseContext(); canvas.remove(); label.remove(); };
}
