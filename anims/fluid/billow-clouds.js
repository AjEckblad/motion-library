// Kelvin–Helmholtz clouds: at sunset, a flat sheet of cloud sits where two layers of air slide past each other. A
// ripple on the boundary grows by itself (the shear feeds it), rolls up into a row of breaking waves, then tumbles
// into turbulence, and the sheet thins away. It is a fluid simulation on the GPU: the flow is carried along itself,
// the lower, heavier air is pulled back down by buoyancy (so the curls hold their shape for a while), a little of the
// spin lost to the grid is put back (vorticity confinement), and a pressure solve keeps it incompressible. The cloud
// is a dye the flow carries, lit by a low sun: each point looks toward the sun through the cloud to see how much
// light gets through, so the tops of the waves glow and their undersides go grey.
const PARAMS = { shear: 1, curl: 1, speed: 1 };

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
  // the sky is periodic left to right (the waves wrap round), with a floor and a lid; units are grid cells
  const NX = 384, NY = 192, Y0 = 100, DL = 5;
  const HEAD = `#version 300 es
  precision highp float; in vec2 uv; out vec4 o;
  const vec2 N = vec2(${NX}., ${NY}.);
  // x wraps round (the textures repeat), y stops at the floor and the lid
  vec4 at(sampler2D t, vec2 c) { return texture(t, vec2(c.x / N.x, clamp(c.y, .5, N.y - .5) / N.y)); }
  `;
  // 1. carry the flow along itself, add buoyancy and the put-back spin
  const advP = prog(`${HEAD} uniform sampler2D U, D, W; uniform float DT, B, EPS;
  void main() {
    vec2 c = uv * N, v = at(U, c).xy, w = at(U, c - v * DT).xy;
    float rho = at(D, c).g;                                          // + heavy (lower air), - light (upper air)
    w.y -= B * rho * DT;
    // vorticity confinement: push along the slope of |curl|, at right angles, so small whirls keep turning
    float wl = abs(at(W, c - vec2(1, 0)).x), wr = abs(at(W, c + vec2(1, 0)).x), wb = abs(at(W, c - vec2(0, 1)).x), wt = abs(at(W, c + vec2(0, 1)).x), w0 = at(W, c).x;
    vec2 g = vec2(wr - wl, wt - wb); g /= length(g) + 1e-5;
    w += EPS * vec2(g.y, -g.x) * w0 * DT;
    if (c.y < 1. || c.y > N.y - 1.) w.y = 0.;
    o = vec4(w, 0, 1);
  }`);
  const curlP = prog(`${HEAD} uniform sampler2D U; void main() { vec2 c = uv * N; o = vec4(.5 * (at(U, c + vec2(1, 0)).y - at(U, c - vec2(1, 0)).y - at(U, c + vec2(0, 1)).x + at(U, c - vec2(0, 1)).x), 0, 0, 1); }`);
  const divP = prog(`${HEAD} uniform sampler2D U; void main() { vec2 c = uv * N; o = vec4(.5 * (at(U, c + vec2(1, 0)).x - at(U, c - vec2(1, 0)).x + at(U, c + vec2(0, 1)).y - at(U, c - vec2(0, 1)).y), 0, 0, 1); }`);
  const jacP = prog(`${HEAD} uniform sampler2D PR, DV; void main() { vec2 c = uv * N;
    o = vec4((at(PR, c - vec2(1, 0)).x + at(PR, c + vec2(1, 0)).x + at(PR, c - vec2(0, 1)).x + at(PR, c + vec2(0, 1)).x - at(DV, c).x) * .25, 0, 0, 1); }`);
  const subP = prog(`${HEAD} uniform sampler2D U, PR; void main() { vec2 c = uv * N;
    vec2 v = at(U, c).xy - .5 * vec2(at(PR, c + vec2(1, 0)).x - at(PR, c - vec2(1, 0)).x, at(PR, c + vec2(0, 1)).x - at(PR, c - vec2(0, 1)).x);
    if (c.y < 1. || c.y > N.y - 1.) v.y = 0.; o = vec4(v, 0, 1); }`);
  // 2. the cloud (r) and the heaviness of the air (g), carried by the flow, MacCormack-style so the edges stay sharp
  const fwdP = prog(`${HEAD} uniform sampler2D U, D; uniform float DT; void main() { vec2 c = uv * N; o = at(D, c - at(U, c).xy * DT); }`);
  const bwdP = prog(`${HEAD} uniform sampler2D U, A; uniform float DT; void main() { vec2 c = uv * N; o = at(A, c + at(U, c).xy * DT); }`);
  const corP = prog(`${HEAD} uniform sampler2D U, D, A, B2; uniform float DT, FADE;
  void main() {
    vec2 c = uv * N, q = c - at(U, c).xy * DT, i0 = floor(q - .5) + .5;
    vec4 r = at(A, c) + .5 * (at(D, c) - at(B2, c));
    vec4 s0 = at(D, i0), s1 = at(D, i0 + vec2(1, 0)), s2 = at(D, i0 + vec2(0, 1)), s3 = at(D, i0 + 1.);
    r = clamp(r, min(min(s0, s1), min(s2, s3)), max(max(s0, s1), max(s2, s3)));
    o = vec4(r.r * FADE, r.g, 0, 1);
  }`);
  // 3. the sheet as it starts: two layers sliding past each other, the cloud just under their boundary, a faint ripple
  const initP = prog(`${HEAD} uniform float U0, SEED; uniform int WHAT;
  float h21(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  void main() {
    vec2 c = uv * N; float y = c.y - ${Y0}.;
    if (WHAT == 0) {
      float k = 6.2832 / N.x, rip = .5 * sin(c.x * k * 4. + SEED) + .25 * sin(c.x * k * 7. + SEED * 2.3) + .2 * (h21(floor(c / 3.) + SEED) - .5);
      o = vec4(U0 * tanh(y / ${DL}.) + U0 * .35, rip * U0 * .02 * exp(-y * y / 200.), 0, 1);
    } else o = vec4(smoothstep(-28., -16., y) * (1. - smoothstep(-2., 3., y)), -tanh(y / ${DL}.), 0, 1);
  }`);
  // 4. the sky: dusk, a low sun, mountains, and the cloud lit from the sun's side
  const renP = prog(`${HEAD} uniform sampler2D D; uniform vec2 R; uniform float T, SHIFT;
  float h21(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float n1(float x) { float i = floor(x), f = fract(x); f = f * f * (3. - 2. * f); return mix(h21(vec2(i, 1.)), h21(vec2(i + 1., 1.)), f); }
  float ridge(float x, float s) { float r = 0., a = .55, f = 2.2; for (int i = 0; i < 6; i++) { r += a * (1. - abs(2. * n1(x * f + s) - 1.)); f *= 2.15; a *= .48; } return r; }   // sharp-crested
  float cloud(vec2 c) { return at(D, c).r; }
  void main() {
    vec2 p = uv; float A = R.x / R.y;
    vec2 sun = vec2(.84, .2);
    // the sky: deep blue overhead, warm at the horizon, a glow round the sun
    vec3 col = mix(vec3(.98, .58, .32), vec3(.2, .3, .6), smoothstep(.05, .75, p.y));
    col = mix(col, vec3(.06, .09, .24), smoothstep(.6, 1., p.y));
    float sd = length((p - sun) * vec2(A, 1.));
    col += vec3(1., .65, .35) * (.5 * exp(-sd * 5.) + .25 * exp(-sd * 1.6)) + vec3(1., .95, .8) * smoothstep(.035, .028, sd);
    // the cloud layer fills the upper sky: the simulation spans the width, and its middle sits high
    vec2 c = vec2(fract(p.x * .999 + SHIFT) * N.x, (p.y - .12) / .86 * N.y);
    float d = c.y > 0. && c.y < N.y ? cloud(c) : 0.;
    if (d > .004) {
      // light reaching this point: march toward the sun through the cloud
      vec2 L = normalize(vec2(1., -.28)); float tau = 0.;
      for (int i = 1; i <= 7; i++) tau += cloud(c + L * float(i) * 2.6);
      float lit = exp(-tau * .55);
      vec3 cc = mix(vec3(.27, .24, .38), vec3(1.1, .7, .48), lit) + vec3(1., .5, .25) * .5 * lit * exp(-sd * 1.8);
      col = mix(col, cc, 1. - exp(-d * 3.4));
    }
    // two ranges of mountains
    float m1 = .06 + .17 * ridge(p.x * A * .5, 3.1), m2 = .02 + .11 * ridge(p.x * A * .5 + 4., 7.7);
    col = mix(col, mix(vec3(.17, .14, .28), col, .35), smoothstep(m1 + .003, m1 - .003, p.y));
    col = mix(col, vec3(.07, .055, .12), smoothstep(m2 + .003, m2 - .003, p.y));
    o = vec4(col, 1);
  }`);

  const target = (w, h) => {
    const t = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, t); gl.texStorage2D(gl.TEXTURE_2D, 1, gl.RGBA16F, w, h);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    const f = gl.createFramebuffer(); gl.bindFramebuffer(gl.FRAMEBUFFER, f); gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, t, 0);
    return { t, f, w, h };
  };
  const pair = () => { let a = target(NX, NY), b = target(NX, NY); return { get r() { return a; }, get w() { return b; }, swap() { [a, b] = [b, a]; } }; };
  const U = pair(), D = pair(), P = pair(), CURL = target(NX, NY), DIV = target(NX, NY), DA = target(NX, NY), DB = target(NX, NY);
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
      else if (Array.isArray(v)) gl.uniform2f(loc, v[0], v[1]); else if (name === 'WHAT') gl.uniform1i(loc, v); else gl.uniform1f(loc, v);
    });
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  };
  const U0 = 38;
  const reset = seed => {
    run(initP, U.r, u => { u('U0', U0 * PARAMS.shear); u('SEED', seed); u('WHAT', 0); });
    run(initP, D.r, u => { u('U0', U0); u('SEED', seed); u('WHAT', 1); });
    for (const t of [P.r, P.w]) { gl.bindFramebuffer(gl.FRAMEBUFFER, t.f); gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT); }
  };
  let raf, last = performance.now(), t = 0, cycle = -1, shift = 0;
  function frame(now) {
    const dt = Math.min(1 / 30, (now - last) / 1000) * PARAMS.speed; last = now; t += dt;
    // a cycle: the flat sheet, the ripple growing, the waves breaking, turbulence, the sheet thinning away
    const L = 17, c = t % L;
    if (Math.floor(t / L) !== cycle) { cycle = Math.floor(t / L); reset(cycle * 2.17 + 0.4); }
    const fade = c > 13.5 ? 0.985 : 1;
    run(curlP, CURL, u => u('U', U.r));
    run(advP, U.w, u => { u('U', U.r); u('D', D.r); u('W', CURL); u('DT', dt); u('B', 9); u('EPS', 2.2 * PARAMS.curl); }); U.swap();
    run(divP, DIV, u => u('U', U.r));
    for (let i = 0; i < 28; i++) { run(jacP, P.w, u => { u('PR', P.r); u('DV', DIV); }); P.swap(); }
    run(subP, U.w, u => { u('U', U.r); u('PR', P.r); }); U.swap();
    run(fwdP, DA, u => { u('U', U.r); u('D', D.r); u('DT', dt); });
    run(bwdP, DB, u => { u('U', U.r); u('A', DA); u('DT', dt); });
    run(corP, D.w, u => { u('U', U.r); u('D', D.r); u('A', DA); u('B2', DB); u('DT', dt); u('FADE', fade); }); D.swap();
    shift = (shift + dt * 0.004) % 1;                                // drift the view a little, as if the sky were passing
    run(renP, null, u => { u('D', D.r); u('R', [W, H]); u('T', t); u('SHIFT', shift); });
    raf = requestAnimationFrame(frame);
  }
  raf = requestAnimationFrame(frame);
  return () => { cancelAnimationFrame(raf); ro.disconnect(); gl.getExtension('WEBGL_lose_context')?.loseContext(); canvas.remove(); };
}
