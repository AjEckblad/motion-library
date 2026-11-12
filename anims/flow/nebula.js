// Nebula: emission gas built from domain-warped fractal noise (fbm fed its own output as coordinates, which folds it
// into filaments and pillars), in two depth layers that drift at different rates for parallax. Volume is faked with
// one extra sample: the density a little way toward the bright star, subtracted from the density here, lights the
// edges facing the star and leaves the far sides dark, as if light were scattering through the cloud. A third noise
// field carves dark dust lanes. Colour follows emission lines: hydrogen red-magenta outside, oxygen teal near the
// star. Stars are hashed per grid cell, twinkle on their own clocks, and the brightest get diffraction spikes.
const PARAMS = { drift: 1, density: 1, stars: 1 };

export default function (stage) {
  const canvas = document.createElement('canvas');
  canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block';
  stage.append(canvas);
  const gl = canvas.getContext('webgl2', { antialias: false });
  if (!gl) { stage.textContent = 'This needs WebGL2.'; return () => canvas.remove(); }
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const vs = `#version 300 es
  in vec2 p; out vec2 uv; void main() { uv = p * .5 + .5; gl_Position = vec4(p, 0, 1); }`;
  const fs = `#version 300 es
  precision highp float; in vec2 uv; out vec4 o;
  uniform vec2 R; uniform float T, DEN, ST;
  float h21(vec2 p) { p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
  float noise(vec2 p) {
    vec2 i = floor(p), f = fract(p), u = f * f * (3. - 2. * f);
    return mix(mix(h21(i), h21(i + vec2(1, 0)), u.x), mix(h21(i + vec2(0, 1)), h21(i + vec2(1, 1)), u.x), u.y);
  }
  const mat2 M = mat2(1.6, 1.2, -1.2, 1.6);
  float fbm(vec2 p) { float s = 0., a = .5; for (int i = 0; i < 5; i++) { s += a * noise(p); p = M * p + 3.1; a *= .5; } return s; }
  // one gas layer: warped fbm, plus the same field sampled a step toward the light for edge lighting
  vec2 gas(vec2 p, vec2 toL, float t) {
    vec2 q = vec2(fbm(p + vec2(0, t)), fbm(p + vec2(5.2, 1.3) - vec2(t * .7, 0)));
    float d = fbm(p + 1.7 * q);
    float dl = fbm(p + toL * .09 + 1.7 * q);
    return vec2(d, clamp((d - dl) * 4. + .35, 0., 1.));
  }
  vec3 stars(vec2 p, float scale, float T) {
    vec2 g = p * scale, id = floor(g), f = fract(g) - .5;
    float h = h21(id), on = step(1. - .42 * ST, h);
    vec2 off = vec2(h21(id + 7.1), h21(id + 3.7)) - .5; vec2 d = f - off * .7;
    float tw = .55 + .45 * sin(T * (1. + h * 3.) + h * 40.);
    float b = pow(fract(h * 17.3), 6.);                         // a few bright, many faint
    float core = exp(-dot(d, d) * (900. - b * 700.)) * (.45 + b * 2.4);
    float spikes = b > .55 ? (exp(-abs(d.x) * 120.) * exp(-abs(d.y) * 9.) + exp(-abs(d.y) * 120.) * exp(-abs(d.x) * 9.)) * b * .8 : 0.;
    vec3 tint = mix(vec3(.75, .85, 1.), vec3(1., .85, .7), fract(h * 91.));
    return tint * (core + spikes) * tw * on;
  }
  void main() {
    vec2 a = vec2(R.x / R.y, 1.), p = (uv - .5) * a;
    vec2 L = vec2(.18, .06);                                    // the bright star that lights the cloud
    vec2 toL = normalize(L - p + 1e-4);
    float t = T * .015;
    vec2 g1 = gas(p * 2.2 + vec2(t * 2., t * .6), toL, t);       // far layer, slow
    vec2 g2 = gas(p * 3.4 + vec2(9.1 + t * 3.6, 2.7 - t), toL, t * 1.3);  // near layer, faster
    float dust = smoothstep(.45, .75, fbm(p * 2.8 + vec2(-t * 2.8, 4.4) + g2.x));
    float dl = length(p - L);
    float glow = exp(-dl * 2.6);
    // density shaped into clouds; the edge-light term shades the side facing the star
    float d1 = smoothstep(.42, .88, g1.x) * DEN, d2 = smoothstep(.5, .9, g2.x) * DEN;
    vec3 ha = vec3(.95, .08, .3), o3 = vec3(.05, .8, .85), deep = vec3(.22, .06, .5);
    vec3 em1 = mix(deep, ha, g1.y) * d1 * (.35 + 1.4 * g1.y * (.4 + glow));
    vec3 em2 = mix(ha, o3, glow * 1.4) * d2 * (.25 + 1.6 * g2.y * (.3 + glow * 1.4));
    vec3 col = vec3(.006, .006, .016) + vec3(.02, .012, .04) * max(0., 1. - length(p));
    col += stars(p + vec2(t * .5, 0), 26., T) * .9;            // background stars, dimmed by gas
    col = col * (1. - d1 * .6) + em1;
    col *= 1. - dust * .9 * max(d1, .4);
    col += em2 * (1. - dust * .85);
    col += vec3(1., .8, .65) * exp(-dl * 5.) * .14 + vec3(.7, .95, 1.) * exp(-dl * 30.) * 1.2;
    col += stars(p + vec2(t * 1.2, 0) + 31.7, 12., T) * 1.2;   // foreground stars
    col = 1. - exp(-col * 1.7);                                 // soft tone map
    o = vec4(pow(col, vec3(1.15)), 1);
  }`;
  const sh = (t, s) => { const x = gl.createShader(t); gl.shaderSource(x, s); gl.compileShader(x); if (!gl.getShaderParameter(x, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(x)); return x; };
  const prog = gl.createProgram(); gl.attachShader(prog, sh(gl.VERTEX_SHADER, vs)); gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, fs)); gl.bindAttribLocation(prog, 0, 'p'); gl.linkProgram(prog); gl.useProgram(prog);
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer()); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  const U = {}; ['R', 'T', 'DEN', 'ST'].forEach(n => U[n] = gl.getUniformLocation(prog, n));
  const resize = () => { const d = Math.min(devicePixelRatio, 2); canvas.width = (stage.clientWidth || 1) * d | 0; canvas.height = (stage.clientHeight || 1) * d | 0; gl.viewport(0, 0, canvas.width, canvas.height); };
  const ro = new ResizeObserver(resize); ro.observe(stage); resize();
  let raf, last = performance.now(), T = 20;
  function frame(now) {
    T += Math.min(0.05, (now - last) / 1000) * PARAMS.drift * (reduce ? 0.08 : 1); last = now;
    gl.uniform2f(U.R, canvas.width, canvas.height); gl.uniform1f(U.T, T); gl.uniform1f(U.DEN, PARAMS.density); gl.uniform1f(U.ST, PARAMS.stars);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    raf = requestAnimationFrame(frame);
  }
  raf = requestAnimationFrame(frame);
  return () => { cancelAnimationFrame(raf); ro.disconnect(); gl.getExtension('WEBGL_lose_context')?.loseContext(); canvas.remove(); };
}
