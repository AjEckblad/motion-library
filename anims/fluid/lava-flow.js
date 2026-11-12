// Lava flow, seen from above at night: lava wells out of a vent and creeps downhill over black rock, a crust forms on
// it and tears open into glowing cracks. It is a simulation on the GPU. Each cell holds a thickness and a temperature;
// lava flows to lower neighbours at a rate that grows steeply with its thickness (how thin films of syrup move)
// and collapses as it cools, because cold lava is hundreds of times stiffer. Thin edges cool fastest and stall into
// levees while the hot middle keeps a channel open, and the front buds into lobes. The crust is a skin: each cell
// also carries how long its surface has been out in the air, reset at the vent and torn back to fresh where the flow
// runs fast. Its pattern is drawn on coordinates the flow carries along, so plates drift, stretch and tear apart.
const PARAMS = { flow: 1, cooling: 1, speed: 1 };

export default function (stage) {
  const canvas = document.createElement('canvas');
  canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block';
  stage.append(canvas);
  const gl = canvas.getContext('webgl2', { antialias: false });
  if (!gl || !gl.getExtension('EXT_color_buffer_float')) { stage.textContent = 'This needs WebGL2 with float render targets.'; return () => canvas.remove(); }
  const sh = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s)); return s; };
  const VS = `#version 300 es
  layout(location = 0) in vec2 p; out vec2 uv; void main() { uv = p * .5 + .5; gl_Position = vec4(p, 0, 1); }`;
  const prog = fs => {
    const p = gl.createProgram(); gl.attachShader(p, sh(gl.VERTEX_SHADER, VS)); gl.attachShader(p, sh(gl.FRAGMENT_SHADER, fs)); gl.bindAttribLocation(p, 0, 'p'); gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
    const u = {}; for (let i = 0, n = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS); i < n; i++) { const nm = gl.getActiveUniform(p, i).name; u[nm] = gl.getUniformLocation(p, nm); }
    return { p, u };
  };
  const NX = 320, NY = 200;
  const COMMON = `#version 300 es
  precision highp float; in vec2 uv; out vec4 o;
  uniform sampler2D S, Z, M; const ivec2 N = ivec2(${NX}, ${NY});
  vec4 st(ivec2 c) { return texelFetch(S, clamp(c, ivec2(0), N - 1), 0); }
  float zz(ivec2 c) { return texelFetch(Z, clamp(c, ivec2(0), N - 1), 0).x; }
  // how easily a cell's lava moves: steeply more the thicker it is (capped, for a stable step), stiffening as it cools
  float mob(vec4 s) { return min(s.x * s.x, 2.) * exp(-6. * (1. - s.y)); }
  // lava moving from a to b this step: driven by the difference in surface height, at the upstream cell's ease
  float flux(ivec2 a, ivec2 b, float C) {
    vec4 sa = st(a), sb = st(b); float Ha = zz(a) + sa.x, Hb = zz(b) + sb.x;
    if (b.y < 0) Hb = Ha - 1.;                                       // the bottom edge is open: it runs off the screen
    return C * (Ha > Hb ? mob(sa) : mob(sb)) * (Ha - Hb);
  }
  vec4 bil(sampler2D t, vec2 c) {                                    // bilinear, by hand (32-bit textures may not filter)
    vec2 f = c - .5, i = floor(f), w = f - i; ivec2 a = ivec2(i);
    return mix(mix(texelFetch(t, clamp(a, ivec2(0), N - 1), 0), texelFetch(t, clamp(a + ivec2(1, 0), ivec2(0), N - 1), 0), w.x),
               mix(texelFetch(t, clamp(a + ivec2(0, 1), ivec2(0), N - 1), 0), texelFetch(t, clamp(a + 1, ivec2(0), N - 1), 0), w.x), w.y);
  }`;
  // the ground: a slope down the screen with hummocks and gullies, made once
  const groundP = prog(`${COMMON}
  float h21(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float n2(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f); return mix(mix(h21(i), h21(i + vec2(1, 0)), f.x), mix(h21(i + vec2(0, 1)), h21(i + 1.), f.x), f.y); }
  uniform float SEED;
  void main() { vec2 c = gl_FragCoord.xy, q = c / 38. + SEED; float f = 0., a = 1.; for (int i = 0; i < 5; i++) { f += a * n2(q); q = q * 2.03 + 7.1; a *= .5; }
    o = vec4(.34 * c.y + 4.5 * f, 0, 0, 1); }`);
  // one step of the flow: thickness and heat, moved between neighbours, cooled (thin lava fastest), fed at the vent
  const flowP = prog(`${COMMON} uniform float C, COOL, SRC; uniform vec2 VENT;
  void main() {
    ivec2 c = ivec2(gl_FragCoord.xy); vec4 s = st(c);
    float dh = 0., dE = 0., dA = 0., fast = 0.;
    for (int k = 0; k < 4; k++) {
      ivec2 d = k == 0 ? ivec2(1, 0) : k == 1 ? ivec2(-1, 0) : k == 2 ? ivec2(0, 1) : ivec2(0, -1), n = c + d;
      if (n.x < 0 || n.x >= N.x || n.y >= N.y) continue;            // closed sides and top
      float q = -flux(c, n, C); dh += q; dE += q * (q > 0. ? st(n).y : s.y); dA += q * (q > 0. ? st(n).z : s.z); fast = max(fast, abs(q));
    }
    float h = max(0., s.x + dh), E = max(0., s.x * s.y + dE), T = h > 1e-5 ? clamp(E / h, 0., 1.) : 0.;
    float age = h > 1e-5 ? max(0., (s.x * s.z + dA) / h) : 0.;
    age = (age + 1.) * (1. - clamp(fast / max(h, .1) * 2. - .03, 0., .08));   // older each step; only fast flow tears the skin
    vec2 dv = vec2(c) - VENT; float g = exp(-dot(dv, dv) / 18.);
    h += SRC * g; T = mix(T, 1., clamp(SRC * g * 6., 0., 1.)); age *= 1. - clamp(SRC * g * 40., 0., 1.);
    T = max(0., T - COOL * T / (h + .25));
    o = vec4(h, T, min(age, 5000.), 1);
  }`);
  // the crust's coordinates, carried by the flow (bare ground and still-molten surface use their own position, so a
  // plate's pattern is fixed where it forms and then drifts with it)
  const matP = prog(`${COMMON} uniform float C, K; uniform vec2 VENT;
  void main() {
    ivec2 c = ivec2(gl_FragCoord.xy); vec4 s = st(c);
    vec2 v = .5 * vec2(flux(c - ivec2(1, 0), c, C) + flux(c, c + ivec2(1, 0), C), flux(c - ivec2(0, 1), c, C) + flux(c, c + ivec2(0, 1), C)) / max(s.x, .1);
    vec2 m = mix(bil(M, vec2(c) + .5 - v * K).xy, vec2(c), .012);    // drift with the flow, relaxing back: plates can't smear forever
    if (s.x < .03 || length(vec2(c) - VENT) < 4.) m = vec2(c);
    o = vec4(m, 0, 1);
  }`);
  // what glows, at the simulation's size; its mipmaps make the light it throws on the rock
  const emitP = prog(`${COMMON}
  void main() { vec4 s = bil(S, uv * vec2(N)); float hot = smoothstep(.35, 1., s.y) * min(s.x * 2.5, 1.); o = vec4(vec3(1., .35, .06) * hot * hot, 1); }`);
  const renP = prog(`${COMMON} uniform sampler2D EM; uniform vec2 R; uniform float FADE;
  float h21(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float n2(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f); return mix(mix(h21(i), h21(i + vec2(1, 0)), f.x), mix(h21(i + vec2(0, 1)), h21(i + 1.), f.x), f.y); }
  vec3 vor(vec2 p) { vec2 i = floor(p), f = fract(p); float d1 = 9., d2 = 9., id = 0.;   // nearest, second nearest, the plate's id
    for (int y = -1; y <= 1; y++) for (int x = -1; x <= 1; x++) { vec2 g = vec2(x, y), r = g + vec2(h21(i + g), h21(i + g + 3.7)) - f; float d = dot(r, r); if (d < d1) { d2 = d1; d1 = d; id = h21(i + g + 11.); } else if (d < d2) d2 = d; }
    return vec3(sqrt(d1), sqrt(d2), id); }
  vec3 heat(float T) { return T > .82 ? mix(vec3(1., .55, .12), vec3(1., .93, .6), (T - .82) / .18) : T > .6 ? mix(vec3(.75, .12, .02), vec3(1., .55, .12), (T - .6) / .22) : mix(vec3(.12, .015, .0), vec3(.75, .12, .02), max(0., T - .35) / .25); }
  vec3 aces(vec3 x) { return clamp((x * (2.51 * x + .03)) / (x * (2.43 * x + .59) + .14), 0., 1.); }
  void main() {
    // fill the frame with the simulation (it is 1.6 times wider than tall)
    vec2 sc = vec2(R.x / R.y, 1.) / vec2(1.6, 1.); vec2 q = (uv - .5) * (sc / max(sc.x, sc.y)) + .5;
    vec2 c = q * vec2(N);
    vec4 s = bil(S, c); float h = s.x, T = s.y, age = s.z;
    // black basalt with a little relief, lit faintly by the sky and strongly by the lava's glow
    float z0 = bil(Z, c).x, zx = bil(Z, c + vec2(1, 0)).x - z0, zy = bil(Z, c + vec2(0, 1)).x - z0;
    vec3 nrm = normalize(vec3(-zx * .25, -(zy - .25) * .25, 1.));
    float rough = n2(c * .7) * .6 + n2(c * 2.3) * .4;
    vec3 glow = vec3(0); for (int i = 0; i < 9; i++) { vec2 o9 = vec2(i % 3 - 1, i / 3 - 1); glow += textureLod(EM, q + o9 * .012, 2.).rgb + textureLod(EM, q + o9 * .03, 3.5).rgb * .7; } glow *= .11;
    vec3 col = vec3(.014, .013, .014) * (.6 + .6 * rough) * (.5 + .5 * max(dot(nrm, normalize(vec3(-.4, .5, .8))), 0.)) + vec3(.004, .005, .008) + glow * (.3 + .45 * rough);
    if (h > .02) {
      // the crust: plates on the carried coordinates, darker and thicker as the lava cools, cracked open to the heat
      vec2 m = bil(M, c).xy / 7.5; vec3 v = vor(m), v2 = vor(m * 2.7 + 5.);
      float crust = max(smoothstep(4., 30., age), smoothstep(.6, .42, T));
      float live = smoothstep(.3, .6, T) * (1. - .75 * smoothstep(200., 3000., age));       // seams glow brighter near the heat
      float crack = clamp(smoothstep(.05 + .12 * (1. - crust), .0, v.y - v.x) * (.55 + .45 * h21(vec2(v.z * 91.))) + smoothstep(.03, .0, v2.y - v2.x) * .4, 0., 1.) * live;
      vec3 plate = vec3(.016, .015, .016) * (.45 + 1.1 * v.z) * (.7 + .5 * n2(m * 9.));   // each plate tilted, catching a little light
      plate = mix(plate, vec3(.12, .02, .006), 1. - smoothstep(5., 60., age));             // brand-new crust: dull red
      vec3 lava = heat(min(T, .93)) * (1. + .55 * n2(m * 3.) + .25 * n2(m * 11.));      // the open channel, its surface streaming past
      vec3 lc = mix(lava, mix(plate + glow * .04, heat(.6 + .28 * live) * 1.3, crack), crust);
      col = mix(col, lc, smoothstep(.02, .12, h));
    }
    col *= FADE * (1. - .35 * dot(uv - .5, uv - .5));
    o = vec4(pow(aces(col * 1.1), vec3(1. / 2.2)), 1);
  }`);

  // targets: 32-bit for the simulation (read exactly), 16-bit with mipmaps for the glow
  const target = (w, h, fmt, mips) => {
    const t = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, t);
    const levels = mips ? Math.floor(Math.log2(Math.max(w, h))) + 1 : 1; gl.texStorage2D(gl.TEXTURE_2D, levels, fmt, w, h);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, mips ? gl.LINEAR_MIPMAP_LINEAR : gl.NEAREST); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, mips ? gl.LINEAR : gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    const f = gl.createFramebuffer(); gl.bindFramebuffer(gl.FRAMEBUFFER, f); gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, t, 0);
    return { t, f, w, h };
  };
  const pair = () => { let a = target(NX, NY, gl.RGBA32F), b = target(NX, NY, gl.RGBA32F); return { get r() { return a; }, get w() { return b; }, swap() { [a, b] = [b, a]; }, all: () => [a, b] }; };
  const S = pair(), M = pair(), Zt = target(NX, NY, gl.RGBA32F), EM = target(NX, NY, gl.RGBA16F, true);
  gl.bindVertexArray(gl.createVertexArray()); gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW); gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  let W = 1, H = 1;
  const resize = () => { const d = Math.min(devicePixelRatio, 2); W = canvas.width = Math.max(1, (stage.clientWidth * d) | 0); H = canvas.height = Math.max(1, (stage.clientHeight * d) | 0); };
  const ro = new ResizeObserver(resize); ro.observe(stage); resize();
  const run = (pr, out, set) => {
    gl.useProgram(pr.p); gl.bindFramebuffer(gl.FRAMEBUFFER, out ? out.f : null); gl.viewport(0, 0, out ? out.w : W, out ? out.h : H);
    let unit = 0;
    set((name, v) => {
      const loc = pr.u[name]; if (loc == null) return;
      if (v && v.t) { gl.activeTexture(gl.TEXTURE0 + unit); gl.bindTexture(gl.TEXTURE_2D, v.t); gl.uniform1i(loc, unit++); }
      else if (Array.isArray(v)) gl.uniform2f(loc, v[0], v[1]); else gl.uniform1f(loc, v);
    });
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  };
  const VENT = [NX * 0.47, NY * 0.9];
  const reset = seed => {
    for (const t of [...S.all(), ...M.all()]) { gl.bindFramebuffer(gl.FRAMEBUFFER, t.f); gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT); }
    run(groundP, Zt, u => u('SEED', seed));
  };
  let raf, last = performance.now(), t = 0, cycle = -1;
  function frame(now) {
    const dt = Math.min(1 / 30, (now - last) / 1000) * PARAMS.speed; last = now; t += dt;
    // a cycle: the vent pours for 20 s, then stops; what is out there creeps on and darkens; fade, and a new flow
    const L = 26, c = t % L;
    if (Math.floor(t / L) !== cycle) { cycle = Math.floor(t / L); reset(cycle * 3.7 + 1.3); }
    const src = c < 20 ? 0.016 * PARAMS.flow * Math.min(1, c / 0.8) : 0, steps = Math.round(12 * Math.min(2, dt * 60));
    for (let i = 0; i < steps; i++) {
      run(flowP, S.w, u => { u('S', S.r); u('Z', Zt); u('C', 0.06); u('COOL', 0.00003 * PARAMS.cooling); u('SRC', src); u('VENT', VENT); }); S.swap();
    }
    run(matP, M.w, u => { u('S', S.r); u('Z', Zt); u('M', M.r); u('C', 0.06); u('K', steps); u('VENT', VENT); }); M.swap();
    run(emitP, EM, u => { u('S', S.r); }); gl.bindTexture(gl.TEXTURE_2D, EM.t); gl.generateMipmap(gl.TEXTURE_2D);
    const fade = Math.min(1, c / 0.6) * (1 - Math.max(0, (c - 25.2) / 0.8));
    run(renP, null, u => { u('S', S.r); u('Z', Zt); u('M', M.r); u('EM', EM); u('R', [W, H]); u('FADE', fade); });
    raf = requestAnimationFrame(frame);
  }
  raf = requestAnimationFrame(frame);
  return () => { cancelAnimationFrame(raf); ro.disconnect(); gl.getExtension('WEBGL_lose_context')?.loseContext(); canvas.remove(); };
}
