// Wheat field in wind: about a hundred thousand stalks drawn in one instanced call, each a thin strip that the vertex
// shader bends. The wind is a noise field sliding across the field, so gusts travel as waves you can follow, and a
// bent stalk shows more of its ear to the low sun, so every gust rolls across as a wave of brighter gold. The sun sits
// ahead of the camera: stalks between you and it glow at the rim, the way backlit wheat does. The pointer brushes
// a path through the stalks.
const PARAMS = { stalks: 110000, wind: 1, gusts: 1 };

export default function (stage) {
  const canvas = document.createElement('canvas');
  canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block;touch-action:none';
  stage.append(canvas);
  const gl = canvas.getContext('webgl2', { antialias: true });
  if (!gl) { stage.textContent = 'This needs WebGL2.'; return () => canvas.remove(); }
  const N = Math.max(5000, Math.round(PARAMS.stalks));

  const COMMON = `
  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float noise(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f); return mix(mix(hash(i), hash(i + vec2(1, 0)), f.x), mix(hash(i + vec2(0, 1)), hash(i + 1.), f.x), f.y); }
  float fbm(vec2 p) { return noise(p) * .55 + noise(p * 2.03 + 7.1) * .3 + noise(p * 4.1 - 3.3) * .15; }
  uniform float T, WIND, GUST; uniform vec3 PTR;               // PTR: the pointer on the field (x, z) and its strength
  const vec2 WD = vec2(.94, .34);                               // the wind's direction
  // the wind at a point: a slow sway everywhere plus gusts, which are blobs of noise sliding downwind
  vec3 wind(vec2 p) {
    float g = smoothstep(.42, .82, fbm(p * .05 - WD * T * .5 * WIND)) * GUST;
    float sway = sin(T * 1.7 * WIND + dot(p, vec2(.8, .35))) * .5 + .5;
    return vec3(WD * (.05 + .32 * g + .05 * sway) * (.4 + .6 * WIND), g);
  }
  uniform vec3 SUN, CAM;
  const vec3 HAZE = vec3(1., .78, .52);
  // gently rolling land: flat where you stand, swelling into low hills further out
  float terr(vec2 p) { return (fbm(p * .012 + 3.1) - .45) * 7. * smoothstep(6., 90., p.y) + p.y * .006; }`;

  // the sky, the sun and a line of far hills with trees, from each pixel's view ray
  const skyVS = `#version 300 es
  in vec2 p; out vec2 v; void main() { v = p; gl_Position = vec4(p, .9999, 1); }`;
  const skyFS = `#version 300 es
  precision highp float; in vec2 v; out vec4 o; uniform vec3 RT, UP, FW; uniform float F, A;
  ${COMMON}
  void main() {
    vec3 d = normalize(FW * F + RT * v.x * A + UP * v.y);
    float el = d.y, az = atan(d.x, d.z);
    vec3 sky = mix(HAZE, vec3(.86, .6, .52), smoothstep(.0, .2, el));
    sky = mix(sky, vec3(.34, .36, .55), smoothstep(.12, .75, el));
    float s = max(dot(d, SUN), 0.);
    sky += vec3(1., .62, .3) * (pow(s, 8.) * .45 + pow(s, 90.) * .6) + vec3(1., .95, .85) * smoothstep(.9994, .9997, s) * 2.;
    float cl = fbm(vec2(az * 4., el * 18.) + vec2(T * .01, 0)) * smoothstep(.02, .12, el) * smoothstep(.45, .15, el);   // a few thin streaks of cloud
    sky = mix(sky, mix(vec3(1., .72, .5), vec3(.9, .55, .45), el * 3.), smoothstep(.55, .8, cl) * .5);
    float hill = .012 + .018 * fbm(vec2(az * 5., 1.)) + .01 * fbm(vec2(az * 13., 4.));
    float trees = hill + .011 * pow(smoothstep(.4, .9, fbm(vec2(az * 70., 2.))), .6) * smoothstep(.35, .55, fbm(vec2(az * 6., 9.)));
    vec3 far = mix(vec3(.5, .4, .4), HAZE, .35 + .55 * pow(s, 4.));
    if (el < trees) sky = far * vec3(.72, .7, .74);                  // the tree line is a little darker than the hills
    if (el < hill) sky = far;
    o = vec4(sky, 1);
  }`;
  // the field's surface beyond the stalks: the same colours and the same gusts, so distance hides where stalks end
  const groundVS = `#version 300 es
  in vec2 p; uniform mat4 M; out vec3 w;
  ${COMMON}
  void main() { w = vec3(p.x, terr(p), p.y); gl_Position = M * vec4(w, 1); }`;
  const groundFS = `#version 300 es
  precision highp float; in vec3 w; out vec4 o;
  ${COMMON}
  void main() {
    vec3 g = wind(w.xz); float dist = length(w - CAM);
    vec3 v = normalize(w - CAM); float back = pow(max(dot(v, SUN), 0.), 6.);
    // near: soil in the shade between stalks; far: the tops of the ears, all you see at a grazing angle
    vec3 c = mix(vec3(.06, .04, .02), vec3(.46, .32, .13) * (.8 + .4 * fbm(w.xz * .25)), smoothstep(2., 45., dist));
    c *= .72 + .6 * g.z + .9 * back * smoothstep(2., 45., dist);
    o = vec4(mix(c, HAZE * .95, 1. - exp(-dist * .011)), 1);
  }`;
  // one stalk: a strip that faces the camera, thin along the stem and swelling into the ear at the top
  const stalkVS = `#version 300 es
  layout(location = 0) in vec2 m;                               // m.x: -1 or 1 (side), m.y: 0..1 up the stalk
  layout(location = 1) in vec4 I;                               // x, z, height, random
  uniform mat4 M; out vec3 col; out vec2 sv; out float fog, back, gust;
  ${COMMON}
  void main() {
    vec2 base = I.xy; float L = I.z, r = I.w, v = m.y;
    vec3 wd = wind(base);
    vec2 bend = wd.xy + (vec2(fract(r * 13.7), fract(r * 71.3)) - .5) * .12;   // its own lean
    vec2 pd = base - PTR.xy; float pl = length(pd);
    bend += pd / max(pl, .01) * PTR.z * exp(-pl * pl / 1.4) * .9;   // the pointer parts the stalks
    float b = length(bend), k = v * v;
    vec3 p = vec3(base.x + bend.x * L * k, terr(base) + L * v * (1. - .28 * b * b * k), base.y + bend.y * L * k);
    vec3 toCam = CAM - p; float dist = length(toCam);
    vec3 side = normalize(cross(vec3(0, 1, 0), toCam));
    float ear = smoothstep(.74, .8, v) * (1. - smoothstep(.88, .93, v)), awn = step(.915, v);
    float wdt = mix(.0022, .0075, ear) * (1. - awn * .55) + dist * .0009;            // far stalks widen so they never shimmer below a pixel
    p += side * m.x * wdt;
    gl_Position = M * vec4(p, 1);
    // backlit: we see the shaded side of every stalk, so the body is dark and the light comes through the ears and edges
    float cs = max(dot(normalize(p - CAM), SUN), 0.);
    back = pow(cs, 16.) * 2.2 + pow(cs, 3.) * .3;
    vec3 stem = mix(vec3(.1, .075, .035), vec3(.36, .27, .12), smoothstep(.0, .8, v));
    col = mix(stem, vec3(.4, .27, .11) * (.85 + .3 * fract(r * 5.3)), max(ear, awn));
    sv = vec2(m.x, max(ear, awn * .8)); gust = wd.z; fog = 1. - exp(-dist * .012);
  }`;
  const stalkFS = `#version 300 es
  precision mediump float; in vec3 col; in vec2 sv; in float fog, back, gust; out vec4 o;
  const vec3 HAZE = vec3(1., .78, .52);
  void main() {
    float rim = pow(abs(sv.x), 3.);                                // edges catch the sun
    vec3 glow = vec3(1., .68, .3) * back * (sv.y * (.75 + .8 * gust) + rim * (.12 + 1.1 * sv.y));
    vec3 c = col * (.62 + .75 * gust * sv.y) + glow + vec3(.05, .045, .05);
    o = vec4(mix(c, HAZE * .95, fog), 1);
  }`;

  const sh = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s)); return s; };
  const prog = (vs, fs) => {
    const p = gl.createProgram(); gl.attachShader(p, sh(gl.VERTEX_SHADER, vs)); gl.attachShader(p, sh(gl.FRAGMENT_SHADER, fs)); gl.bindAttribLocation(p, 0, 'p'); gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
    const u = {}; for (let i = 0, n = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS); i < n; i++) { const nm = gl.getActiveUniform(p, i).name; u[nm] = gl.getUniformLocation(p, nm); }
    return { p, u };
  };
  const skyP = prog(skyVS, skyFS), groundP = prog(groundVS, groundFS), stalkP = prog(stalkVS, stalkFS);

  // geometry
  const vao = (fn) => { const v = gl.createVertexArray(); gl.bindVertexArray(v); fn(); gl.bindVertexArray(null); return v; };
  const buf = (data, loc, size, divisor = 0) => { gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer()); gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, size, gl.FLOAT, false, 0, 0); gl.vertexAttribDivisor(loc, divisor); };
  const skyV = vao(() => buf(new Float32Array([-1, -1, 3, -1, -1, 3]), 0, 2));
  // the ground: a grid whose rows get further apart with distance and whose width follows the view
  const GR = 140, GC = 90, gv = [], gi = [];
  for (let i = 0; i <= GR; i++) { const z = 0.3 * Math.pow(3000, i / GR); for (let j = 0; j <= GC; j++) gv.push((j / GC * 2 - 1) * Math.max(3, z * 1.4), z); }
  for (let i = 0; i < GR; i++) for (let j = 0; j < GC; j++) { const a = i * (GC + 1) + j, b = a + GC + 1; gi.push(a, b, a + 1, a + 1, b, b + 1); }
  const groundV = vao(() => { buf(new Float32Array(gv), 0, 2); gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, gl.createBuffer()); gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint32Array(gi), gl.STATIC_DRAW); });
  // stem 0–0.76, ear 0.76–0.92, then a thin tuft of awns to the tip
  const STOPS = [0, 0.25, 0.5, 0.7, 0.76, 0.8, 0.85, 0.89, 0.92, 0.96, 1], SEG = STOPS.length - 1, strip = [];
  for (const v of STOPS) strip.push(-1, v, 1, v);
  // stalks are spread so their density on screen is roughly even: more of them near, fewer per square metre far away
  const inst = new Float32Array(N * 4);
  for (let i = 0; i < N; i++) {
    const z = 0.9 * Math.pow(260 / 0.9, Math.random()), x = (Math.random() * 2 - 1) * z * 1.05 + (Math.random() - 0.5) * 0.4;
    inst.set([x, z, 0.85 + Math.random() * 0.3, Math.random()], i * 4);
  }
  const stalkV = vao(() => { buf(new Float32Array(strip), 0, 2); buf(inst, 1, 4, 1); });

  let W = 1, H = 1;
  const resize = () => { const d = Math.min(devicePixelRatio, 2); W = canvas.width = Math.max(1, (stage.clientWidth * d) | 0); H = canvas.height = Math.max(1, (stage.clientHeight * d) | 0); };
  const ro = new ResizeObserver(resize); ro.observe(stage); resize();

  // camera: standing in the field, looking out toward the low sun
  const CAM = [0, 1.32, 0], pitch = -0.065, F = 1 / Math.tan(0.42);
  const FW = [0, Math.sin(pitch), Math.cos(pitch)], RT = [1, 0, 0], UP = [0, Math.cos(pitch), -Math.sin(pitch)];
  const SUN = (() => { const a = -0.2, e = 0.045; return [Math.sin(a) * Math.cos(e), Math.sin(e), Math.cos(a) * Math.cos(e)]; })();
  const matrix = () => {
    const A = W / H, n = 0.05, f = 1200, nf = 1 / (n - f);
    const V = [RT[0], UP[0], -FW[0], 0, RT[1], UP[1], -FW[1], 0, RT[2], UP[2], -FW[2], 0,
      -(RT[0] * CAM[0] + RT[1] * CAM[1] + RT[2] * CAM[2]), -(UP[0] * CAM[0] + UP[1] * CAM[1] + UP[2] * CAM[2]), FW[0] * CAM[0] + FW[1] * CAM[1] + FW[2] * CAM[2], 1];
    const P = [F / A, 0, 0, 0, 0, F, 0, 0, 0, 0, (f + n) * nf, -1, 0, 0, 2 * f * n * nf, 0], M = new Float32Array(16);
    for (let c = 0; c < 4; c++) for (let r = 0; r < 4; r++) { let s = 0; for (let k = 0; k < 4; k++) s += P[k * 4 + r] * V[c * 4 + k]; M[c * 4 + r] = s; }
    return M;
  };

  // the pointer: cast a ray from the camera to the height of the ears
  const ptr = { x: 0, z: 0, s: 0, on: false };
  const move = e => {
    const r = canvas.getBoundingClientRect(), nx = ((e.clientX - r.left) / r.width) * 2 - 1, ny = 1 - ((e.clientY - r.top) / r.height) * 2, A = r.width / r.height;
    const d = [FW[0] * F + RT[0] * nx * A + UP[0] * ny, FW[1] * F + RT[1] * nx * A + UP[1] * ny, FW[2] * F + RT[2] * nx * A + UP[2] * ny];
    if (d[1] >= -0.001) { ptr.on = false; return; }
    const t = (0.9 - CAM[1]) / d[1]; ptr.x = CAM[0] + d[0] * t; ptr.z = CAM[2] + d[2] * t; ptr.on = true;
  };
  const leave = () => { ptr.on = false; };
  canvas.addEventListener('pointermove', move); canvas.addEventListener('pointerleave', leave);

  const common = (P, t) => {
    gl.uniform1f(P.u.T, t); gl.uniform1f(P.u.WIND, PARAMS.wind); gl.uniform1f(P.u.GUST, PARAMS.gusts);
    gl.uniform3f(P.u.SUN, ...SUN); gl.uniform3f(P.u.CAM, ...CAM); gl.uniform3f(P.u.PTR, ptr.x, ptr.z, ptr.s);
  };
  let raf, last = performance.now(), t = 0;
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000); last = now; t += dt;
    ptr.s += ((ptr.on ? 1 : 0) - ptr.s) * Math.min(1, dt * 6);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null); gl.viewport(0, 0, W, H);
    gl.enable(gl.DEPTH_TEST); gl.depthFunc(gl.LEQUAL); gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    const M = matrix();
    gl.useProgram(skyP.p); common(skyP, t); gl.uniform3f(skyP.u.RT, ...RT); gl.uniform3f(skyP.u.UP, ...UP); gl.uniform3f(skyP.u.FW, ...FW); gl.uniform1f(skyP.u.F, F); gl.uniform1f(skyP.u.A, W / H);
    gl.bindVertexArray(skyV); gl.drawArrays(gl.TRIANGLES, 0, 3);
    gl.useProgram(groundP.p); common(groundP, t); gl.uniformMatrix4fv(groundP.u.M, false, M); gl.bindVertexArray(groundV); gl.drawElements(gl.TRIANGLES, gi.length, gl.UNSIGNED_INT, 0);
    gl.useProgram(stalkP.p); common(stalkP, t); gl.uniformMatrix4fv(stalkP.u.M, false, M); gl.bindVertexArray(stalkV);
    gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, (SEG + 1) * 2, N);
    gl.bindVertexArray(null);
    raf = requestAnimationFrame(frame);
  }
  raf = requestAnimationFrame(frame);
  return () => { cancelAnimationFrame(raf); ro.disconnect(); canvas.removeEventListener('pointermove', move); canvas.removeEventListener('pointerleave', leave); gl.getExtension('WEBGL_lose_context')?.loseContext(); canvas.remove(); };
}
