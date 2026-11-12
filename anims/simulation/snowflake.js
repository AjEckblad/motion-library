// Snowflake growth: a single ice crystal grows out of nothing on a dark blue ground, lit from behind like a snow
// crystal photographed under a microscope. A tiny hexagon widens, its six corners reach out faster than its faces,
// the arms sprout side branches, ribs and ridges, and everything stays six-fold symmetric because the same physics
// acts in all six directions. When it is grown it rests for a moment, fades, and the next one starts; every loop
// grows a different crystal (a fern-like star, a plate with ribs, a broad sectored plate...).
// The trick: the Gravner-Griffeath mesoscopic model on a hexagonal lattice, run on the GPU. Each site holds water vapour,
// a thin quasi-liquid layer and frozen ice. Vapour diffuses; at the crystal's edge part of it freezes, part becomes
// the liquid layer; a site joins the crystal when that layer is thick enough, with an easier rule for sites tucked
// between three crystal neighbours (that is what makes flat facets) and none for sites with four. Corners sit in
// richer vapour than faces, so they outgrow them: the Mullins-Sekerka instability that makes dendrites. The frozen mass
// at each site, which varies with how the site was reached, is rendered as thickness: relief, refraction lines and rims.
const PARAMS = { size: 1, speed: 1 };

export default function (stage) {
  const canvas = document.createElement('canvas');
  canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block';
  stage.append(canvas);
  const gl = canvas.getContext('webgl2', { antialias: false, depth: false, alpha: false });
  if (!gl) { stage.textContent = 'This needs WebGL2.'; return () => canvas.remove(); }
  if (!gl.getExtension('EXT_color_buffer_float')) { stage.textContent = 'This needs WebGL2 float render targets.'; gl.getExtension('WEBGL_lose_context')?.loseContext(); return () => canvas.remove(); }
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  const N = 512;                                       // the hexagonal lattice, stored as a sheared square grid
  // parameter sets after Gravner & Griffeath: rho vapour, beta/alpha/theta attachment, kappa freezing, mu/gamma melting
  const PRESETS = [
    { rho: 0.635, beta: 1.6, alpha: 0.4, theta: 0.025, kappa: 0.0025, mu: 0.015, gamma: 0.0005, steps: 3450, r: 190 },
    { rho: 0.5, beta: 1.3, alpha: 0.08, theta: 0.025, kappa: 0.003, mu: 0.07, gamma: 0.00005, steps: 8700, r: 190 },
    { rho: 0.8, beta: 2.6, alpha: 0.006, theta: 0.005, kappa: 0.05, mu: 0.015, gamma: 0.0001, steps: 11000, r: 122 },   // seen closer up
    { rho: 0.65, beta: 1.75, alpha: 0.2, theta: 0.026, kappa: 0.15, mu: 0.015, gamma: 0.0001, steps: 9150, r: 190 },
  ];

  const VQ = `#version 300 es
  in vec2 p; void main() { gl_Position = vec4(p, 0, 1); }`;
  const HEAD = `#version 300 es
  precision highp float; precision highp int; precision highp sampler2D;
  uniform sampler2D S; uniform float RHO, BETA, ALPHA, THETA, KAPPA, MU, GAMMA;
  const ivec2 NB[6] = ivec2[6](ivec2(1, 0), ivec2(-1, 0), ivec2(0, 1), ivec2(0, -1), ivec2(1, -1), ivec2(-1, 1));
  vec4 at(ivec2 p) { return texelFetch(S, clamp(p, ivec2(0), textureSize(S, 0) - 1), 0); }
  `;
  // state: x = attached (0/1), y = boundary (quasi-liquid) mass, z = crystal mass, w = diffusive (vapour) mass
  const FS_INIT = HEAD + `
  out vec4 o;
  void main() { ivec2 p = ivec2(gl_FragCoord.xy), c = textureSize(S, 0) / 2; o = p == c ? vec4(1, 0, 1, 0) : vec4(0, 0, 0, RHO); }`;
  // 1. vapour diffuses (reflected off the crystal), 2. at the boundary it freezes, partly into the liquid layer
  const FS_A = HEAD + `
  out vec4 o;
  void main() {
    ivec2 p = ivec2(gl_FragCoord.xy), n = textureSize(S, 0);
    vec4 s = at(p);
    if (s.x > .5) { o = s; return; }
    if (min(min(p.x, p.y), min(n.x - 1 - p.x, n.y - 1 - p.y)) < 2) { o = vec4(0, 0, 0, RHO); return; }   // far vapour
    float d = s.w; int na = 0;
    for (int i = 0; i < 6; i++) { vec4 q = at(p + NB[i]); if (q.x > .5) { d += s.w; na++; } else d += q.w; }
    d /= 7.;
    if (na > 0) { s.y += (1. - KAPPA) * d; s.z += KAPPA * d; s.w = 0.; } else s.w = d;
    o = s;
  }`;
  // 3. attachment by the number of crystal neighbours, 4. melting back into vapour
  const FS_B = HEAD + `
  out vec4 o;
  void main() {
    ivec2 p = ivec2(gl_FragCoord.xy);
    vec4 s = at(p);
    if (s.x > .5) { o = s; return; }
    int na = 0; float ds = s.w;
    for (int i = 0; i < 6; i++) { vec4 q = at(p + NB[i]); if (q.x > .5) na++; ds += q.w; }
    if (na == 0) { o = s; return; }
    vec2 c = vec2(p - textureSize(S, 0) / 2); if (length(vec2(c.x + .5 * c.y, .866 * c.y)) > 205.) { o = s; return; }   // a safety ring
    bool join = na >= 4 || (na == 3 && (s.y >= 1. || (ds < THETA && s.y >= ALPHA))) || (na <= 2 && s.y >= BETA);
    if (join) { o = vec4(1, 0, s.y + s.z, 0); return; }
    o = vec4(0, (1. - MU) * s.y, (1. - GAMMA) * s.z, s.w + MU * s.y + GAMMA * s.z);
  }`;
  // a filterable copy for display: thickness, and the attached mask
  const FS_VIEW = HEAD + `
  out vec4 o;
  void main() { vec4 s = at(ivec2(gl_FragCoord.xy)); o = vec4(s.x * s.z, s.x, s.y, 0); }`;
  // backlit macro photograph: the ice is clear; what shows is how its thickness bends the light
  const FS_DRAW = `#version 300 es
  precision highp float; uniform sampler2D V; uniform vec2 R; uniform float SC, FADE, T; out vec4 o;
  vec4 lat(vec2 q) {                                    // a point in the plane -> the hexagonal lattice, sampled
    float j = q.y * 1.1547005, i = q.x - .5 * j;          // with a cubic B-spline so no lattice steps show
    vec2 n = vec2(textureSize(V, 0)), u = vec2(i, j) + n * .5, b = floor(u), f = u - b;
    vec2 w0 = (1. - f) * (1. - f) * (1. - f) / 6., w1 = (4. - 6. * f * f + 3. * f * f * f) / 6., w2 = (1. + 3. * f + 3. * f * f - 3. * f * f * f) / 6., w3 = f * f * f / 6.;
    vec2 g0 = w0 + w1, g1 = w2 + w3, h0 = (b - .5 + w1 / g0) / n, h1 = (b + 1.5 + w3 / g1) / n;
    return g0.y * (g0.x * texture(V, h0) + g1.x * texture(V, vec2(h1.x, h0.y))) + g1.y * (g0.x * texture(V, vec2(h0.x, h1.y)) + g1.x * texture(V, h1));
  }
  float hsh(vec2 p) { vec3 q = fract(p.xyx * .1031); q += dot(q, q.yzx + 33.33); return fract((q.x + q.y) * q.z); }
  void main() {
    vec2 uv = gl_FragCoord.xy / R, q = (gl_FragCoord.xy - R * .5) / SC;
    // the ground: deep blue, lighter where the lamp is behind the crystal
    vec2 bc = (uv - vec2(.5, .55)) * vec2(R.x / R.y, 1.);
    vec3 bg = mix(vec3(.004, .012, .045), vec3(.035, .11, .3), exp(-dot(bc, bc) * 2.4));
    float e = .7;
    vec4 c = lat(q), cx = lat(q + vec2(e, 0)), cy = lat(q + vec2(0, e)), cx2 = lat(q - vec2(e, 0)), cy2 = lat(q - vec2(0, e));
    vec2 g = vec2(cx.x - cx2.x, cy.x - cy2.x) / (2. * e), ga = vec2(cx.y - cx2.y, cy.y - cy2.y) / (2. * e);
    float m = smoothstep(.25, .75, c.y), th = c.x;
    // thickness relative to its own surroundings: ribs, ridges and steps, as a backlit lens would show them
    float lap = (cx.x + cx2.x + cy.x + cy2.x - 4. * c.x) / (e * e) * m;
    vec2 L = normalize(vec2(-.55, .85));
    float emb = dot(g, L) * 2.2, rid = clamp(-lap * .9, -1., 1.);
    vec3 ice = bg * 1.35 + vec3(.05, .085, .13) + vec3(.05, .07, .09) * clamp(th - 1., 0., 2.);
    ice += vec3(.42, .55, .7) * vec3(max(emb + .05, 0.), max(emb, 0.), max(emb - .05, 0.));   // a slight prism split
    ice -= vec3(.05, .045, .03) * max(-emb, 0.) * 1.6;
    ice += vec3(.5, .62, .78) * max(rid, 0.) * .55 - vec3(.04, .035, .02) * max(-rid, 0.);
    float edge = length(ga);
    vec3 col = mix(bg, ice, m);
    col += vec3(.75, .88, 1.) * edge * smoothstep(.45, .85, c.y) * .9;     // a bright line just inside the rim
    col *= 1. - .55 * edge * smoothstep(.55, .15, c.y);                     // light bent away just outside it
    col = mix(bg, col, FADE);
    col = col / (1. + col * .4);
    col *= 1. - .25 * pow(length(uv - .5) * 1.3, 2.4);
    o = vec4(pow(col, vec3(1. / 2.2)) + (hsh(gl_FragCoord.xy) - .5) / 255., 1);
  }`;

  const shader = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s)); return s; };
  const program = fs => {
    const p = gl.createProgram(); gl.attachShader(p, shader(gl.VERTEX_SHADER, VQ)); gl.attachShader(p, shader(gl.FRAGMENT_SHADER, fs));
    gl.bindAttribLocation(p, 0, 'p'); gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
    const u = {}, n = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS);
    for (let i = 0; i < n; i++) { const a = gl.getActiveUniform(p, i); u[a.name] = gl.getUniformLocation(p, a.name); }
    return { p, u };
  };
  const P = { init: program(FS_INIT), a: program(FS_A), b: program(FS_B), view: program(FS_VIEW), draw: program(FS_DRAW) };
  const vao = gl.createVertexArray(); gl.bindVertexArray(vao);
  const vbo = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  const tex = (fmt, filter) => {
    const t = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, t); gl.texStorage2D(gl.TEXTURE_2D, 1, fmt, N, N);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filter); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filter);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    return t;
  };
  const fbo = t => { const f = gl.createFramebuffer(); gl.bindFramebuffer(gl.FRAMEBUFFER, f); gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, t, 0); return f; };
  const st = [tex(gl.RGBA32F, gl.NEAREST), tex(gl.RGBA32F, gl.NEAREST)], sf = st.map(fbo);
  const view = tex(gl.RGBA16F, gl.LINEAR), vf = fbo(view);
  let cur = 0;
  const quad = () => gl.drawArrays(gl.TRIANGLES, 0, 3);
  const setP = (u, pr) => { gl.uniform1f(u.RHO, pr.rho); gl.uniform1f(u.BETA, pr.beta); gl.uniform1f(u.ALPHA, pr.alpha); gl.uniform1f(u.THETA, pr.theta); gl.uniform1f(u.KAPPA, pr.kappa); gl.uniform1f(u.MU, pr.mu); gl.uniform1f(u.GAMMA, pr.gamma); };
  let pr = PRESETS[0];
  function start(k) {
    // each crystal: one of the parameter sets, nudged a little so no two loops repeat exactly
    const base = PRESETS[k % PRESETS.length], h = x => { const v = Math.sin((k + 1) * 12.9898 + x * 78.233) * 43758.5453; return v - Math.floor(v); };
    pr = { ...base, rho: base.rho * (0.97 + 0.06 * h(1)), beta: base.beta * (0.96 + 0.08 * h(2)), kappa: base.kappa * (0.85 + 0.3 * h(3)) };
    gl.viewport(0, 0, N, N);
    const u = (gl.useProgram(P.init.p), P.init.u);
    gl.bindFramebuffer(gl.FRAMEBUFFER, sf[0]); gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, st[1]); gl.uniform1i(u.S, 0); setP(u, pr); quad();
    cur = 0;
  }
  function steps(n) {
    gl.viewport(0, 0, N, N); gl.activeTexture(gl.TEXTURE0);
    for (let i = 0; i < n; i++) {
      for (const pg of [P.a, P.b]) {
        gl.useProgram(pg.p); setP(pg.u, pr); gl.uniform1i(pg.u.S, 0);
        gl.bindFramebuffer(gl.FRAMEBUFFER, sf[1 - cur]); gl.bindTexture(gl.TEXTURE_2D, st[cur]); quad(); cur = 1 - cur;
      }
    }
  }

  let W = 1, H = 1;
  const resize = () => { const w = stage.clientWidth || 1, h = stage.clientHeight || 1, d = Math.min(devicePixelRatio, 2, Math.max(0.5, Math.sqrt(2200000 / (w * h)))); W = canvas.width = Math.max(1, (w * d) | 0); H = canvas.height = Math.max(1, (h * d) | 0); dirty = true; };
  let dirty = true;
  const ro = new ResizeObserver(resize); ro.observe(stage); resize();

  function draw(fade) {
    gl.viewport(0, 0, N, N);
    let u = (gl.useProgram(P.view.p), P.view.u);
    gl.bindFramebuffer(gl.FRAMEBUFFER, vf); gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, st[cur]); gl.uniform1i(u.S, 0); quad();
    u = (gl.useProgram(P.draw.p), P.draw.u);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null); gl.viewport(0, 0, W, H);
    gl.bindTexture(gl.TEXTURE_2D, view); gl.uniform1i(u.V, 0); gl.uniform2f(u.R, W, H);
    gl.uniform1f(u.SC, Math.min(W, H) * 0.42 / pr.r * Math.max(0.6, Math.min(1.25, PARAMS.size))); gl.uniform1f(u.FADE, fade);
    quad();
  }

  // the loop: grow, rest, fade, and start the next crystal
  const GROW = 13 / Math.max(0.6, Math.min(1.4, PARAMS.speed)), REST = 2.4, FADE_T = 1.1, LOOP = GROW + REST + FADE_T;
  let t = 0, last = performance.now(), loopK = -1, done = 0, raf;
  if (reduce) { start(0); steps(pr.steps); done = pr.steps; loopK = 0; }
  function frame(now) {
    const dt = Math.min(1 / 30, Math.max(0, (now - last) / 1000)); last = now;
    if (reduce) { if (dirty) { draw(1); dirty = false; } raf = requestAnimationFrame(frame); return; }
    t += dt;
    const k = Math.floor(t / LOOP), lt = t - k * LOOP;
    if (k !== loopK) { loopK = k; start(k); done = 0; }
    // a crystal's radius grows about linearly with model steps, so steps are spread evenly over the growth
    const want = Math.round(pr.steps * Math.min(1, lt / GROW));
    if (want > done) { const n = Math.min(30, want - done); steps(n); done += n; }
    const fade = lt < 0.25 ? lt / 0.25 : lt > GROW + REST ? Math.max(0, 1 - (lt - GROW - REST) / FADE_T) : 1;
    draw(fade * fade * (3 - 2 * fade));
    raf = requestAnimationFrame(frame);
  }
  raf = requestAnimationFrame(frame);
  return () => { cancelAnimationFrame(raf); ro.disconnect(); gl.getExtension('WEBGL_lose_context')?.loseContext(); canvas.remove(); };
}
