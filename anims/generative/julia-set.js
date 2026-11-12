// Julia set: from every pixel z, iterate z → z² + c and see whether it escapes. The constant c walks slowly along a
// loop hugging the edge of the Mandelbrot set's main cardioid (c = w/2 − w²/4 for a point w on the unit circle,
// pushed a hair outwards and breathing in and out), which is where Julia sets are most intricate, so the shape keeps
// melting from fat filled lobes to spirals, dendrites and dust and back. Colour comes from the smooth (fractional)
// escape count; brightness from the distance estimate (|z|·log|z| / |dz/dz₀|), measured in pixels, so the set's edge
// glows and its finest filaments are drawn one pixel sharp at any size. Each pixel is sampled four times.
// The pointer is w, so it sets c: near the centre the set is a solid blob, on a ring round it lace, beyond it dust.
const PARAMS = { speed: 1, detail: 1 };

export default function (stage) {
  const canvas = document.createElement('canvas');
  canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block';
  stage.append(canvas);
  const gl = canvas.getContext('webgl2', { antialias: false });
  if (!gl) { stage.textContent = 'This needs WebGL2.'; return () => canvas.remove(); }
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const vs = `#version 300 es
  in vec2 p; void main() { gl_Position = vec4(p, 0, 1); }`;
  const fs = `#version 300 es
  precision highp float; out vec4 o;
  uniform vec2 R, M; uniform float T, D, MA, u_speed, u_detail;   // M is c, worked out on the CPU
  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  vec2 hash2(vec2 p) { return fract(sin(vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)))) * 43758.5453); }
  float noise(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
    return mix(mix(hash(i), hash(i + vec2(1, 0)), f.x), mix(hash(i + vec2(0, 1)), hash(i + 1.), f.x), f.y); }
  float fbm(vec2 p) { float s = 0., a = .5; mat2 m = mat2(1.6, 1.2, -1.2, 1.6); for (int i = 0; i < 5; i++) { s += a * noise(p); p = m * p; a *= .5; } return s; }
  vec3 pal(float t) {
    t = fract(t);
    vec3 a = vec3(.03, .04, .14), b = vec3(.12, .38, .85), c = vec3(.82, .93, 1.), d = vec3(1., .72, .32), e = vec3(.55, .1, .24);
    float s = t * 5.; float f = fract(s); f = f * f * (3. - 2. * f);
    return s < 1. ? mix(a, b, f) : s < 2. ? mix(b, c, f) : s < 3. ? mix(c, d, f) : s < 4. ? mix(d, e, f) : mix(e, a, f);
  }
  vec2 C; float PXS; float MI;
  vec3 shade(vec2 z) {
    vec2 dz = vec2(1, 0);
    float n = 0., m2 = 0., trap = 1e9;
    for (int i = 0; i < 1200; i++) {
      if (float(i) >= MI) break;
      dz = 2. * vec2(z.x * dz.x - z.y * dz.y, z.x * dz.y + z.y * dz.x);
      z = vec2(z.x * z.x - z.y * z.y, 2. * z.x * z.y) + C;
      m2 = dot(z, z);
      trap = min(trap, m2);
      if (m2 > 1e4) break;
      if (dot(dz, dz) < 1e-12) break;                             // pulled into an attracting cycle: inside, stop early
      n += 1.;
    }
    if (m2 <= 1e4) {   // inside: dark where orbits settle fast, glowing toward the edge where they take longest
      float f = 1. - exp(-n * .03);
      return vec3(.012, .014, .04) + vec3(.022, .04, .115) * f * f * f + vec3(.05, .09, .25) * exp(-trap * 6.) * (1. - f * .7);
    }
    float sn = n - log2(log2(m2)) + 4.;                            // smooth (fractional) escape count
    float de = .5 * sqrt(m2 / dot(dz, dz)) * log(m2);              // distance to the set, in plane units
    float g = clamp(log(max(de / PXS, 1.)) / log(300.), 0., 1.);    // 0 on the boundary, 1 far out (in pixels)
    vec3 col = pal(log2(sn) * .55 + .05) * mix(1.1, .03, pow(g, .5));
    col += vec3(1., .96, .9) * smoothstep(1.5, .2, de / PXS) * .35;   // filaments, one pixel sharp
    return col;
  }
  void main() {
    C = M;
    float ra = T * .025, cr = cos(ra), sr = sin(ra);
    mat2 rot = mat2(cr, sr, -sr, cr);
    float zoom = 2.7;
    PXS = zoom / R.y; MI = 260. * u_detail;
    vec3 col = vec3(0);
    for (int k = 0; k < 4; k++) {                                  // 2 × 2 samples per pixel
      vec2 off = vec2(float(k & 1), float(k >> 1)) - .5;
      vec2 p = (gl_FragCoord.xy + off * .5 - .5 * R) / R.y;
      col += shade(rot * p * zoom);
    }
    col /= 4.;
    col *= 1. - .25 * smoothstep(.4, .95, length((gl_FragCoord.xy - .5 * R) / R.y));
    o = vec4(pow(col, vec3(.95)), 1);
  }`;
  const sh = (t, s) => { const x = gl.createShader(t); gl.shaderSource(x, s); gl.compileShader(x); if (!gl.getShaderParameter(x, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(x)); return x; };
  const prog = gl.createProgram(); gl.attachShader(prog, sh(gl.VERTEX_SHADER, vs)); gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, fs)); gl.bindAttribLocation(prog, 0, 'p'); gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog));
  gl.useProgram(prog);
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer()); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  const U = {}; ['R', 'M', 'T', 'D', 'MA', 'u_speed', 'u_detail'].forEach(n => U[n] = gl.getUniformLocation(prog, n));
  let dpr = 1;
  const resize = () => { dpr = Math.min(devicePixelRatio, 2); canvas.width = (stage.clientWidth || 1) * dpr | 0; canvas.height = (stage.clientHeight || 1) * dpr | 0; gl.viewport(0, 0, canvas.width, canvas.height); };
  const ro = new ResizeObserver(resize); ro.observe(stage); resize();
  // the pointer is w, the multiplier of the fixed point: c = w/2 − w²/4 maps the unit disc onto the main cardioid,
  // so |w| < 1 (a disc round the centre of the stage) gives a solid set, |w| = 1 its lacy edge. Past the edge c is
  // pushed straight out from the cardioid (the map itself would fold back in at the cusp), into the bulbs and dust.
  let tx = 0, ty = 0, mx = 0, my = 0, ma = 0, lastMove = -1e9;
  const toLocal = e => { const b = canvas.getBoundingClientRect(); return [(e.clientX - b.left - b.width / 2) / b.height, (b.height / 2 - (e.clientY - b.top)) / b.height]; };
  const onMove = e => { [tx, ty] = toLocal(e); lastMove = performance.now(); };
  const cOf = (x, y, out) => {
    const RW = .27, r = Math.hypot(x, y) / RW, s = r < 1 ? 1 : 1 + .14 * Math.tanh((r - 1) / .45);
    const k = r < 1 ? 1 / RW : 1 / (RW * r), wx = x * k, wy = y * k;
    out[0] = (.5 * wx - .25 * (wx * wx - wy * wy)) * s; out[1] = (.5 * wy - .5 * wx * wy) * s; return out;
  };
  const pc = [0, 0];
  const onLeave = () => { lastMove = -1e9; };
  canvas.addEventListener('pointermove', onMove); canvas.addEventListener('pointerdown', onMove); canvas.addEventListener('pointerleave', onLeave);
  let raf, t = 0, last = performance.now();
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    t += dt * PARAMS.speed * (reduce ? 0.05 : 1);
    const live = now - lastMove < 2500;
    const k = 1 - Math.exp(-dt * 14);
    if (live && ma < .01) { mx = tx; my = ty; }                    // first touch: start from where the pointer is
    mx += (tx - mx) * k; my += (ty - my) * k; ma += ((live ? 1 : 0) - ma) * (1 - Math.exp(-dt * (live ? 6 : 2.5)));
    // idle: c walks the cardioid's edge, nudged outwards and breathing; steering: c from the pointer's w
    const a = t * .085, wx = Math.cos(a), wy = Math.sin(a), s = 1.015 + .02 * Math.sin(t * .21);
    const gx = (.5 * wx - .25 * (wx * wx - wy * wy)) * s, gy = (.5 * wy - .5 * wx * wy) * s;
    const [px, py] = cOf(mx, my, pc);
    const e = ma * ma * (3 - 2 * ma);
    gl.uniform2f(U.R, canvas.width, canvas.height); gl.uniform1f(U.T, t); gl.uniform1f(U.D, dpr);
    gl.uniform2f(U.M, gx + (px - gx) * e, gy + (py - gy) * e); gl.uniform1f(U.MA, ma);
    gl.uniform1f(U.u_speed, PARAMS.speed);
    gl.uniform1f(U.u_detail, PARAMS.detail);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    raf = requestAnimationFrame(frame);
  }
  raf = requestAnimationFrame(frame);
  return () => { cancelAnimationFrame(raf); ro.disconnect(); canvas.removeEventListener('pointermove', onMove); canvas.removeEventListener('pointerdown', onMove); canvas.removeEventListener('pointerleave', onLeave); gl.getExtension('WEBGL_lose_context')?.loseContext(); canvas.remove(); };
}
