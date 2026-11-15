// Slime mould maps Tokyo: a quarter of a million agents on the GPU, each one sensing a chemical trail ahead-left,
// ahead and ahead-right, turning toward the strongest, stepping forward and laying down more trail. That one rule is
// how the real Physarum polycephalum forages. In 2010 researchers put oat flakes where the cities around Tokyo are
// and the mould grew a network much like the rail system. Here the flakes leak food into the trail map, light (the
// bay) is avoided, and the network tightens from a fine mesh into trunk lines between the cities. The trail is
// rendered as a wet height field on a near-black ground, so the veins catch the light and glow; only the oat flakes
// and a faint coastline are drawn besides.
const PARAMS = { agents: 384, sensor: 0.39, decay: 0.9 };

export default function (stage) {
  const canvas = document.createElement('canvas');
  canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block;background:#0c0c0e';
  stage.append(canvas);
  const gl = canvas.getContext('webgl2', { antialias: false });
  if (!gl || !gl.getExtension('EXT_color_buffer_float')) { stage.textContent = 'This needs WebGL2 with float render targets.'; return () => canvas.remove(); }
  const G = Math.max(64, Math.round(PARAMS.agents)), COUNT = G * G, M = 768;   // agents = G², trail map M×M over the map

  // oat flakes: Tokyo in the middle and the towns around it, in map coordinates (-1..1, y up)
  const CITIES = [[0.02, 0.04], [-0.12, -0.12], [-0.2, -0.26], [0.2, 0.06], [0.3, 0.14], [0.02, 0.3], [-0.16, 0.36], [-0.38, 0.18], [-0.46, 0.0],
    [-0.36, -0.2], [-0.6, -0.36], [0.24, 0.42], [0.46, 0.4], [0.56, 0.12], [0.62, -0.1], [0.1, 0.56], [-0.3, 0.56], [-0.58, 0.32], [-0.66, 0.06],
    [0.36, 0.62], [0.72, 0.3], [-0.06, 0.16], [-0.24, 0.12], [0.16, 0.24], [-0.5, -0.5], [0.42, -0.34], [0.26, -0.5], [-0.02, -0.66]];
  // the bay and the open sea: lit in the real experiment, which the mould avoids
  const SEA = `
  float sea(vec2 p) {                                            // > 0 in the water
    float bay = .2 - length((p - vec2(.06, -.36)) * vec2(1.25, .85)) + .03 * sin(p.x * 13.) * sin(p.y * 9.);
    float mouth = min(.07 - abs(p.x - .08 + .12 * (p.y + .5)), -.46 - p.y);   // the bay opens south to the ocean
    float ocean = -.66 - p.y + .25 * p.x + .04 * sin(p.x * 11.);
    return max(max(bay, ocean), mouth);
  }`;
  const QUAD = `#version 300 es
  in vec2 p; out vec2 uv; void main() { uv = p * .5 + .5; gl_Position = vec4(p, 0, 1); }`;
  // the agents: sense, turn, step
  const agentFS = `#version 300 es
  precision highp float; in vec2 uv; out vec4 o; uniform sampler2D A, TR; uniform float F, SA, SD;
  ${SEA}
  float h(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float sense(vec2 p, float a) { return texture(TR, p + vec2(cos(a), sin(a)) * SD / ${M}.).r; }
  void main() {
    vec4 s = texture(A, uv); vec2 p = s.xy; float a = s.z;
    float l = sense(p, a + SA), c = sense(p, a), r = sense(p, a - SA), rnd = h(uv * 917. + F);
    float RA = .78;                                               // turn twice the sensor angle: Jones's network regime
    if (c > l && c > r) {} else if (c < l && c < r) a += (rnd < .5 ? 1. : -1.) * RA; else if (l > r) a += RA; else if (r > l) a -= RA;
    vec2 q = p + vec2(cos(a), sin(a)) * 1.05 / ${M}.;
    vec2 d = q * 2. - 1.;
    if (length(d) > .97 || sea(d) > 0.) { a = h(uv * 31. + F) * 6.2832; q = p; }   // hit the map's edge or the light: turn away
    o = vec4(q, a, 1);
  }`;
  // deposit: every agent adds a little chemical where it stands
  const depVS = `#version 300 es
  uniform sampler2D A; uniform int G;
  void main() { vec2 p = texelFetch(A, ivec2(gl_VertexID % G, gl_VertexID / G), 0).xy; gl_Position = vec4(p * 2. - 1., 0, 1); gl_PointSize = 1.; }`;
  const depFS = `#version 300 es
  precision mediump float; out vec4 o; void main() { o = vec4(.18, 0, 0, 0); }`;
  // the trail map: blur, fade, keep the food sources topped up, nothing survives in the light
  const trailFS = `#version 300 es
  precision highp float; in vec2 uv; out vec4 o; uniform sampler2D TR; uniform float DEC; uniform vec2 C[${CITIES.length}];
  ${SEA}
  void main() {
    vec2 e = vec2(1. / ${M}.); float s = 0.;
    for (int y = -1; y <= 1; y++) for (int x = -1; x <= 1; x++) s += texture(TR, uv + vec2(x, y) * e).r;
    float v = s / 9. * DEC;
    vec2 d = uv * 2. - 1.;
    for (int i = 0; i < ${CITIES.length}; i++) { float l = length(d - C[i]); v += 1.6 * smoothstep(.024, .008, l) + .045 * smoothstep(.16, .0, l); }   // a strong source and a faint halo agents can find   // the flakes feed the network
    if (sea(d) > 0. || length(d) > .98) v = 0.;
    o = vec4(min(v, 40.), 0, 0, 1);
  }`;
  // the picture: the mould alone on the page's near-black, a faint coastline and the oat flakes to read it by; the
  // trail is shaded as a wet height field, with a soft glow so the thin film between the veins still shows
  const showFS = `#version 300 es
  precision highp float; in vec2 uv; out vec4 o; uniform sampler2D TR; uniform vec2 R; uniform vec2 C[${CITIES.length}]; uniform float T;
  ${SEA}
  float h(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float n2(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f); return mix(mix(h(i), h(i + vec2(1, 0)), f.x), mix(h(i + vec2(0, 1)), h(i + 1.), f.x), f.y); }
  float slime(vec2 t) { return smoothstep(.15, 2.6, texture(TR, t).r); }
  void main() {
    float s = min(R.x, R.y);
    vec2 p = (uv * R - R * .5) / (s * .46);                       // map coordinates
    float rr = length(p);
    vec3 bg = vec3(.047, .047, .055), c = bg;
    vec2 t = p * .5 + .5, e = vec2(1.5 / ${M}.);
    if (rr < 1.02) {
      float hgt = slime(t);
      vec2 g = vec2(slime(t + vec2(e.x, 0)) - slime(t - vec2(e.x, 0)), slime(t + vec2(0, e.y)) - slime(t - vec2(0, e.y)));
      vec3 N = normalize(vec3(-g * 2.6, 1.));
      vec3 L = normalize(vec3(-.5, .6, .8)), H = normalize(L + vec3(0, 0, 1));
      float fade = smoothstep(1.0, .9, rr);                        // the map's edge melts into the page
      // a faint coastline round the bay and the open sea, which the mould keeps away from
      float w = sea(p);
      c += vec3(.55, .6, .66) * .07 * smoothstep(.012, .0, abs(w)) * fade;
      // oat flakes: small pale crumbs, under the mould
      for (int i = 0; i < ${CITIES.length}; i++) {
        vec2 q = p - C[i]; if (dot(q, q) > .0006) continue;               // (only near a flake is it worth the angle)
        float a = atan(q.y, q.x), rad = .016 + .005 * sin(a * 3. + float(i)) + .003 * sin(a * 7. + float(i) * 2.);
        c = mix(c, vec3(.78, .72, .58) * (.8 + .3 * n2(q * 200.)), smoothstep(rad, rad - .005, length(q)) * .75);
      }
      // the glow: a wide soft read of the trail
      float glow = 0.;
      for (int k = 0; k < 6; k++) { float an = float(k) * 1.047; glow += texture(TR, t + vec2(cos(an), sin(an)) * e * 7.).r; }
      glow = smoothstep(.1, 4., glow / 6.);
      float raw = texture(TR, t).r;
      c += vec3(1., .78, .28) * (smoothstep(.03, .8, raw) * .16 + glow * .22) * fade;   // the thin film, and the halo
      // the veins: thick ones saturate to deep yellow-orange, wet and lit from the upper left
      vec3 sl = mix(vec3(1., .86, .3), vec3(.95, .6, .1), smoothstep(.55, 1., hgt));
      sl *= .9 + .2 * n2(p * 90. + vec2(T * .7, -T * .4));          // grainy cytoplasm streaming through the tubes
      c = mix(c, sl * (.55 + .55 * max(dot(N, L), 0.)), smoothstep(.03, .35, hgt) * fade);
      c += vec3(1., .97, .85) * pow(max(dot(N, H), 0.), 60.) * .55 * smoothstep(.2, .6, hgt) * fade;   // wet highlights
    }
    o = vec4(pow(c, vec3(1.05)), 1);
  }`;

  const sh = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s)); return s; };
  const prog = (vs, fs) => {
    const p = gl.createProgram(); gl.attachShader(p, sh(gl.VERTEX_SHADER, vs)); gl.attachShader(p, sh(gl.FRAGMENT_SHADER, fs)); gl.bindAttribLocation(p, 0, 'p'); gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
    const u = {}; for (let i = 0, n = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS); i < n; i++) { const nm = gl.getActiveUniform(p, i).name.replace('[0]', ''); u[nm] = gl.getUniformLocation(p, nm); }
    return { p, u };
  };
  const agentP = prog(QUAD, agentFS), depP = prog(depVS, depFS), trailP = prog(QUAD, trailFS), showP = prog(QUAD, showFS);
  const quad = gl.createVertexArray(); gl.bindVertexArray(quad);
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer()); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  const empty = gl.createVertexArray();
  const target = (w, h, ifmt, type, filt, data = null) => {
    const t = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, t); gl.texImage2D(gl.TEXTURE_2D, 0, ifmt, w, h, 0, gl.RGBA, type, data);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filt); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filt);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    const fb = gl.createFramebuffer(); gl.bindFramebuffer(gl.FRAMEBUFFER, fb); gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, t, 0);
    return { t, fb };
  };
  // agents start spread over the land, pointing every which way (a seeded random: every run grows the same way)
  let rs = 7;
  const rnd = () => { rs = (rs + 0x6D2B79F5) | 0; let t = Math.imul(rs ^ (rs >>> 15), 1 | rs); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const init = new Float32Array(COUNT * 4);
  for (let i = 0; i < COUNT; i++) {
    let x, y; do { const a = rnd() * 6.283, r = Math.sqrt(rnd()) * 0.95; x = Math.cos(a) * r; y = Math.sin(a) * r; } while (y < -0.62 + 0.25 * x || Math.hypot((x - 0.06) * 1.25, (y + 0.36) * 0.85) < 0.2);
    init.set([x * 0.5 + 0.5, y * 0.5 + 0.5, rnd() * 6.283, 1], i * 4);
  }
  let A = target(G, G, gl.RGBA32F, gl.FLOAT, gl.NEAREST, init), B = target(G, G, gl.RGBA32F, gl.FLOAT, gl.NEAREST, init);
  let TA = target(M, M, gl.RGBA16F, gl.HALF_FLOAT, gl.LINEAR), TB = target(M, M, gl.RGBA16F, gl.HALF_FLOAT, gl.LINEAR);
  const cityArr = new Float32Array(CITIES.flat());

  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  // the simulation runs 120 steps a second of clock time (at most 4 a frame), so it grows at the same pace on any
  // screen and a given moment always looks the same
  let raf, steps = 0, t0 = performance.now();
  let W = 1, H = 1;
  const resize = () => { const d = Math.min(devicePixelRatio, 2); W = canvas.width = Math.max(1, (stage.clientWidth * d) | 0); H = canvas.height = Math.max(1, (stage.clientHeight * d) | 0); if (reduce && steps >= 1680) show(14); };
  const ro = new ResizeObserver(resize); ro.observe(stage); resize();

  function step(n) {
    gl.bindVertexArray(quad);
    for (let k = 0; k < n; k++) { const s = steps++ % 1000;
      // move the agents
      gl.disable(gl.BLEND); gl.useProgram(agentP.p); gl.bindFramebuffer(gl.FRAMEBUFFER, B.fb); gl.viewport(0, 0, G, G);
      gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, A.t); gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, TA.t);
      gl.uniform1i(agentP.u.A, 0); gl.uniform1i(agentP.u.TR, 1); gl.uniform1f(agentP.u.F, s); gl.uniform1f(agentP.u.SA, PARAMS.sensor); gl.uniform1f(agentP.u.SD, 9);
      gl.bindVertexArray(quad); gl.drawArrays(gl.TRIANGLES, 0, 3); [A, B] = [B, A];
      // they deposit into the trail
      gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE); gl.useProgram(depP.p); gl.bindFramebuffer(gl.FRAMEBUFFER, TA.fb); gl.viewport(0, 0, M, M);
      gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, A.t); gl.uniform1i(depP.u.A, 0); gl.uniform1i(depP.u.G, G);
      gl.bindVertexArray(empty); gl.drawArrays(gl.POINTS, 0, COUNT); gl.disable(gl.BLEND);
      // and the trail spreads and fades
      gl.useProgram(trailP.p); gl.bindFramebuffer(gl.FRAMEBUFFER, TB.fb); gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, TA.t);
      gl.uniform1i(trailP.u.TR, 0); gl.uniform1f(trailP.u.DEC, PARAMS.decay); gl.uniform2fv(trailP.u.C, cityArr);
      gl.bindVertexArray(quad); gl.drawArrays(gl.TRIANGLES, 0, 3); [TA, TB] = [TB, TA];
    }
  }
  function show(t) {
    gl.useProgram(showP.p); gl.bindFramebuffer(gl.FRAMEBUFFER, null); gl.viewport(0, 0, W, H); gl.bindVertexArray(quad);
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, TA.t); gl.uniform1i(showP.u.TR, 0); gl.uniform2f(showP.u.R, W, H);
    gl.uniform2fv(showP.u.C, cityArr); gl.uniform1f(showP.u.T, t);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }
  function frame(now) {
    const t = (now - t0) / 1000;
    step(Math.min(4, Math.round(t * 120) - steps));
    show(t);
    raf = requestAnimationFrame(frame);
  }
  if (!reduce) raf = requestAnimationFrame(frame);
  else {
    // reduced motion: grow the network to where the trunk lines have formed, a few hundred steps a frame out of
    // sight, then keep that still
    const grow = () => { step(240); if (steps < 1680) raf = requestAnimationFrame(grow); else show(14); };
    raf = requestAnimationFrame(grow);
  }
  return () => { cancelAnimationFrame(raf); ro.disconnect(); gl.getExtension('WEBGL_lose_context')?.loseContext(); canvas.remove(); };
}
