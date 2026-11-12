// Terrain flyover: mountains that exist only as a function, height(x, z), built from layers of noise. Each layer adds
// finer detail, and layers are damped where the slope is already steep (the derivative trick), which carves sharp
// ridges and smooth valleys like real erosion. A ray steps forward until it drops below the ground. Snow sits on high,
// flat ground; rock shows on steep faces; a lake fills the lowest valleys; haze grows with distance and the sun is low.
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
  uniform vec2 R; uniform float Z, SUN;
  float hash(vec2 p) { p = 50. * fract(p * .3183099 + vec2(.71, .113)); return -1. + 2. * fract(p.x * p.y * (p.x + p.y)); }
  vec3 noised(vec2 x) {                                                   // value noise with its analytic derivative
    vec2 i = floor(x), f = fract(x), u = f * f * f * (f * (f * 6. - 15.) + 10.), du = 30. * f * f * (f * (f - 2.) + 1.);
    float a = hash(i), b = hash(i + vec2(1, 0)), c = hash(i + vec2(0, 1)), d = hash(i + 1.);
    return vec3(a + (b - a) * u.x + (c - a) * u.y + (a - b - c + d) * u.x * u.y, du * (vec2(b - a, c - a) + (a - b - c + d) * u.yx));
  }
  const mat2 M = mat2(.8, -.6, .6, .8);
  float terrain(vec2 x, int oct) {
    vec2 p = x * .0035; float a = 0., b = 1.; vec2 d = vec2(0);
    for (int i = 0; i < 11; i++) { if (i >= oct) break; vec3 n = noised(p); d += n.yz; a += b * n.x / (1. + dot(d, d)); b *= .5; p = M * p * 2.; }
    return 120. * a;
  }
  float ground(vec2 x) { return max(terrain(x, 8), -18.); }               // a lake fills the lowest ground
  vec3 nrm(vec3 p, float t) { vec2 e = vec2(.002 * t, 0); return normalize(vec3(terrain(p.xz - e.xy, 11) - terrain(p.xz + e.xy, 11), 2. * e.x, terrain(p.xz - e.yx, 11) - terrain(p.xz + e.yx, 11))); }
  vec3 aces(vec3 x) { return clamp((x * (2.51 * x + .03)) / (x * (2.43 * x + .59) + .14), 0., 1.); }
  void main() {
    vec2 q = (uv * 2. - 1.) * vec2(R.x / R.y, 1.);
    vec3 ro = vec3(sin(Z * .002) * 300., 0, Z); ro.y = terrain(ro.xz, 6) + 55.;
    vec3 ta = vec3(sin((Z + 120.) * .002) * 300., ro.y - 18., Z + 120.);
    vec3 f = normalize(ta - ro), r = normalize(cross(vec3(0, 1, 0), f)), u = cross(f, r), rd = normalize(f * 1.6 + r * q.x + u * q.y);
    vec3 sd = normalize(vec3(-.8, SUN, .6));
    // a low sun turns the day into dusk: deep blue overhead, an ember band on the horizon, alpenglow on the peaks
    float dusk = smoothstep(.4, .1, SUN);
    vec3 sky = mix(vec3(.95, .72, .52), vec3(.32, .48, .72), pow(max(rd.y, 0.), .5)) + vec3(1., .7, .4) * pow(max(dot(rd, sd), 0.), 40.) * .8;
    vec3 skyDusk = mix(vec3(.6, .24, .14), vec3(.018, .026, .075), pow(smoothstep(-.02, .28, rd.y), .55)) + vec3(1., .42, .16) * (pow(max(dot(rd, sd), 0.), 40.) * 1.4 + pow(max(dot(rd, sd), 0.), 6.) * .25);
    sky = mix(sky, skyDusk, dusk);
    vec3 col = sky;
    float t = 1.; bool hit = false;
    for (int i = 0; i < 200; i++) { vec3 p = ro + rd * t; float h = p.y - ground(p.xz); if (h < .002 * t) { hit = true; break; } t += .45 * h; if (t > 2800.) break; }
    if (hit) {
      vec3 p = ro + rd * t;
      bool water = p.y < -17.9;
      vec3 n = water ? vec3(0, 1, 0) : nrm(p, t);
      float dif = max(dot(n, sd), 0.);
      // shadow: step from the ground toward the sun
      float sh = 1.; for (float s = 4.; s < 300.; s *= 1.35) { vec3 sp = p + sd * s; float hh = sp.y - ground(sp.xz); sh = min(sh, 14. * hh / s); if (sh < 0.) break; } sh = clamp(sh, 0., 1.);
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
    o = vec4(pow(col, vec3(1. / 2.2)), 1);
  }`;
  const sh = (t, s) => { const x = gl.createShader(t); gl.shaderSource(x, s); gl.compileShader(x); if (!gl.getShaderParameter(x, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(x)); return x; };
  const prog = gl.createProgram(); gl.attachShader(prog, sh(gl.VERTEX_SHADER, vs)); gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, fs)); gl.bindAttribLocation(prog, 0, 'p'); gl.linkProgram(prog); gl.useProgram(prog);
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer()); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  const U = {}; ['R', 'Z', 'SUN'].forEach(n => U[n] = gl.getUniformLocation(prog, n));
  const resize = () => { const w = stage.clientWidth || 1, h = stage.clientHeight || 1, d = Math.min(devicePixelRatio, Math.max(0.6, Math.sqrt(260000 / (w * h)))); canvas.width = w * d | 0; canvas.height = h * d | 0; gl.viewport(0, 0, canvas.width, canvas.height); };
  const ro = new ResizeObserver(resize); ro.observe(stage); resize();
  let raf, last = performance.now(), z = 0;
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000); last = now; z += dt * 45 * PARAMS.speed;
    gl.uniform2f(U.R, canvas.width, canvas.height); gl.uniform1f(U.Z, z); gl.uniform1f(U.SUN, PARAMS.sun);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    raf = requestAnimationFrame(frame);
  }
  raf = requestAnimationFrame(frame);
  return () => { cancelAnimationFrame(raf); ro.disconnect(); gl.getExtension('WEBGL_lose_context')?.loseContext(); canvas.remove(); };
}
