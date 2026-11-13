// Terrain flyover: mountains that exist only as a function, height(x, z), built from layers of noise. Each layer adds
// finer detail, and layers are damped where the slope is already steep (the derivative trick), which carves sharp
// ridges and smooth valleys like real erosion. A ray steps forward until it drops below the ground. Snow sits on high,
// flat ground; rock shows on steep faces; a lake fills the lowest valleys; haze grows with distance and the sun is low.
// Smooth flight: the camera height is worked out on the CPU from the same terrain, looking 320 units ahead, and eased
// by a critically damped spring, so it glides over ridges instead of riding every bump (and never dips into the lake).
// Layers finer than about three pixels fade out with distance, so far slopes don't shimmer as they scroll past.
const PARAMS = { speed: 1, sun: 0.13 };

export default function (stage) {
  const canvas = document.createElement('canvas');
  canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block';
  stage.append(canvas);
  const gl = canvas.getContext('webgl2', { antialias: false });
  if (!gl) { stage.textContent = 'This needs WebGL2.'; return () => canvas.remove(); }
  const vs = `#version 300 es
  in vec2 p; out vec2 uv; void main() { uv = p * .5 + .5; gl_Position = vec4(p, 0, 1); }`;
  const fs = `#version 300 es
  precision highp float; in vec2 uv; out vec4 o;
  uniform vec2 R; uniform vec3 RO, TA; uniform float SUN;
  float hash(vec2 p) { p = 50. * fract(p * .3183099 + vec2(.71, .113)); return -1. + 2. * fract(p.x * p.y * (p.x + p.y)); }
  vec3 noised(vec2 x) {                                                   // value noise with its analytic derivative
    vec2 i = floor(x), f = fract(x), u = f * f * f * (f * (f * 6. - 15.) + 10.), du = 30. * f * f * (f * (f - 2.) + 1.);
    float a = hash(i), b = hash(i + vec2(1, 0)), c = hash(i + vec2(0, 1)), d = hash(i + 1.);
    return vec3(a + (b - a) * u.x + (c - a) * u.y + (a - b - c + d) * u.x * u.y, du * (vec2(b - a, c - a) + (a - b - c + d) * u.yx));
  }
  const mat2 M = mat2(.8, -.6, .6, .8);
  float terrain(vec2 x, float lod) {                                      // lod = layers; the last one fades in
    vec2 p = x * .0035; float a = 0., b = 1.; vec2 d = vec2(0);
    for (int i = 0; i < 11; i++) { float w = clamp(lod - float(i), 0., 1.); if (w <= 0.) break; vec3 n = noised(p); d += w * n.yz; a += w * b * n.x / (1. + dot(d, d)); b *= .5; p = M * p * 2.; }
    return 120. * a;
  }
  float lodAt(float t) { return log2(R.y * 76.2 / t); }                   // layers whose wavelength is still >= 3 px
  float ground(vec2 x, float lod) { return max(terrain(x, lod), -18.); }  // a lake fills the lowest ground
  vec3 nrm(vec3 p, float t, float lod) { vec2 e = vec2(.002 * t, 0); return normalize(vec3(terrain(p.xz - e.xy, lod) - terrain(p.xz + e.xy, lod), 2. * e.x, terrain(p.xz - e.yx, lod) - terrain(p.xz + e.yx, lod))); }
  vec3 aces(vec3 x) { return clamp((x * (2.51 * x + .03)) / (x * (2.43 * x + .59) + .14), 0., 1.); }
  void main() {
    vec2 q = (uv * 2. - 1.) * vec2(R.x / R.y, 1.);
    vec3 ro = RO, f = normalize(TA - ro), r = normalize(cross(vec3(0, 1, 0), f)), u = cross(f, r), rd = normalize(f * 1.6 + r * q.x + u * q.y);
    vec3 sd = normalize(vec3(-.8, SUN, .6));
    // a low sun turns the day into dusk: deep blue overhead, an ember band on the horizon, alpenglow on the peaks
    float dusk = smoothstep(.4, .1, SUN);
    vec3 sky = mix(vec3(.95, .72, .52), vec3(.32, .48, .72), pow(max(rd.y, 0.), .5)) + vec3(1., .7, .4) * pow(max(dot(rd, sd), 0.), 40.) * .8;
    vec3 skyDusk = mix(vec3(.6, .24, .14), vec3(.018, .026, .075), pow(smoothstep(-.02, .28, rd.y), .55)) + vec3(1., .42, .16) * (pow(max(dot(rd, sd), 0.), 40.) * 1.4 + pow(max(dot(rd, sd), 0.), 6.) * .25);
    sky = mix(sky, skyDusk, dusk);
    vec3 col = sky;
    float t = 1.; bool hit = false;
    for (int i = 0; i < 200; i++) { vec3 p = ro + rd * t; float h = p.y - ground(p.xz, min(lodAt(t) - .5, 8.)); if (h < .002 * t) break; t += .5 * h; if (t > 2800.) break; }
    hit = t < 2800.;                                                       // out of steps near a grazing ridge counts as ground
    if (hit) {
      vec3 p = ro + rd * t; float lod = min(lodAt(t), 11.);
      bool water = terrain(p.xz, min(lod, 8.)) <= -18.;                    // the lake is wherever the clamp holds
      vec3 n = water ? vec3(0, 1, 0) : nrm(p, t, lod);
      float dif = max(dot(n, sd), 0.);
      // shadow: step from the ground toward the sun
      float sh = 1.; for (float s = 4.; s < 300.; s *= 1.35) { vec3 sp = p + sd * s; float hh = sp.y - ground(sp.xz, 6.); sh = min(sh, 14. * hh / s); if (sh < 0.) break; } sh = clamp(sh, 0., 1.);
      vec3 rock = mix(vec3(.18, .14, .11), vec3(.32, .27, .22), smoothstep(-1., 1., sin(p.y * .3 + p.x * .02)));
      vec3 grass = vec3(.16, .2, .08);
      vec3 mat = mix(grass, rock, smoothstep(.65, .85, 1. - n.y) + smoothstep(10., 40., p.y) * .6);
      float snow = smoothstep(35., 55., p.y + 8. * n.y) * smoothstep(.55, .8, n.y);
      mat = mix(mat, vec3(.92, .94, 1.), snow);
      col = mat * (dif * sh * mix(vec3(1.6, 1.25, .95), vec3(2.2, 1., .5), dusk) + (.5 + .5 * n.y) * mix(vec3(.18, .24, .34), vec3(.035, .045, .09), dusk));
      if (water) col = mix(vec3(.04, .08, .1), sky * .9, .25 + .6 * pow(1. - max(-rd.y, 0.), 6.));
      col = mix(col, sky * (.95 - .4 * dusk) + vec3(.05) * (1. - dusk), 1. - exp(-t * .0011 * (1. - .35 * dusk)));   // aerial haze
    }
    col = aces(col);
    o = vec4(pow(col, vec3(1. / 2.2)) + (fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233))) * 43758.5453) - .5) / 255., 1);   // fixed dither: no banding in the haze
  }`;
  const sh = (t, s) => { const x = gl.createShader(t); gl.shaderSource(x, s); gl.compileShader(x); if (!gl.getShaderParameter(x, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(x)); return x; };
  const prog = gl.createProgram(); gl.attachShader(prog, sh(gl.VERTEX_SHADER, vs)); gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, fs)); gl.bindAttribLocation(prog, 0, 'p'); gl.linkProgram(prog); gl.useProgram(prog);
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer()); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  const U = {}; ['R', 'RO', 'TA', 'SUN'].forEach(n => U[n] = gl.getUniformLocation(prog, n));
  const resize = () => { const w = stage.clientWidth || 1, h = stage.clientHeight || 1, d = Math.min(devicePixelRatio, Math.max(0.6, Math.sqrt(260000 / (w * h)))); canvas.width = w * d | 0; canvas.height = h * d | 0; gl.viewport(0, 0, canvas.width, canvas.height); };
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const ro = new ResizeObserver(() => { resize(); if (reduce) draw(); }); ro.observe(stage); resize();   // reduced motion: redraw the still
  // the shader's terrain on the CPU (float32 hash so heights match), for the camera height along the flight path
  const f32 = Math.fround, fr = x => x - Math.floor(x);
  const hash = (x, y) => { x = f32(50 * fr(f32(x * .3183099 + .71))); y = f32(50 * fr(f32(y * .3183099 + .113))); return -1 + 2 * fr(f32(f32(x * y) * f32(x + y))); };
  const terrain = (x, z, oct) => {
    let px = x * .0035, py = z * .0035, a = 0, b = 1, dx = 0, dy = 0;
    for (let i = 0; i < oct; i++) {
      const ix = Math.floor(px), iy = Math.floor(py), fx = px - ix, fy = py - iy;
      const ux = fx * fx * fx * (fx * (fx * 6 - 15) + 10), uy = fy * fy * fy * (fy * (fy * 6 - 15) + 10), dux = 30 * fx * fx * (fx * (fx - 2) + 1), duy = 30 * fy * fy * (fy * (fy - 2) + 1);
      const ha = hash(ix, iy), hb = hash(ix + 1, iy), hc = hash(ix, iy + 1), k = ha - hb - hc + hash(ix + 1, iy + 1);
      dx += dux * (hb - ha + k * uy); dy += duy * (hc - ha + k * ux); a += b * (ha + (hb - ha) * ux + (hc - ha) * uy + k * ux * uy) / (1 + dx * dx + dy * dy);
      b *= .5; const nx = 2 * (.8 * px + .6 * py); py = 2 * (.8 * py - .6 * px); px = nx;
    }
    return 120 * a;
  };
  const pathX = z => Math.sin(z * .002) * 300;
  // the height to aim for: clear every ridge in the next 320 units by 44, on a 0.3 glide slope, through a soft max
  const aim = z => { const h = []; let m = -1e9, s = 0; for (let k = -3; k <= 16; k++) { const d = k * 20, v = Math.max(terrain(pathX(z + d), z + d, 6), -18) + 44 - .3 * Math.max(0, d - 30); h.push(v); m = Math.max(m, v); } for (const v of h) s += Math.exp((v - m) / 6); return m + 6 * Math.log(s / 1.5); };
  // a critically damped spring over distance flown (not time), solved exactly, so velocity and acceleration stay continuous at any speed
  const W = 1 / 50;
  let z = 0, y = aim(0), vy = 0, sdt = 1 / 60, spd = PARAMS.speed;
  const fly = dz => { const T = aim(z), c1 = y - T, c2 = vy + W * c1, e = Math.exp(-W * dz); y = T + (c1 + c2 * dz) * e; vy = (c2 - W * (c1 + c2 * dz)) * e; z += dz; };
  const draw = () => {
    gl.uniform2f(U.R, canvas.width, canvas.height); gl.uniform1f(U.SUN, PARAMS.sun);
    gl.uniform3f(U.RO, pathX(z), y, z); gl.uniform3f(U.TA, pathX(z + 120), y - 18 + 36 * vy, z + 120);   // nose follows the climb a little
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  };
  let raf, last = performance.now();
  function frame(now) {
    sdt += (Math.min(0.05, Math.max(0, now - last) / 1000) - sdt) * 0.12; last = now;   // smoothed frame time: one late frame doesn't lurch
    spd += (PARAMS.speed - spd) * 0.06; fly(sdt * 45 * spd);                               // the speed slider eases too
    draw();
    raf = requestAnimationFrame(frame);
  }
  if (reduce) { for (let i = 0; i < 150; i++) fly(45 / 60); draw(); }            // reduced motion: the view 2.5 s in, held
  else raf = requestAnimationFrame(frame);
  return () => { cancelAnimationFrame(raf); ro.disconnect(); gl.getExtension('WEBGL_lose_context')?.loseContext(); canvas.remove(); };
}
