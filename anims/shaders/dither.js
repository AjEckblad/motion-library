// Ordered dithering: a lit 3D scene (a torus knot-ish ring and a sphere over a floor, raymarched) reduced to a couple
// of ink tones per pixel. Each screen pixel compares its brightness with a fixed threshold from an 8×8 Bayer matrix;
// the matrix spreads thresholds so evenly that, from a distance, the on/off pattern reads as smooth grey. Pixels are
// drawn big on purpose, and the two-colour palette is an old paper-and-ink one.
const PARAMS = { pixel: 2, tones: 2 };

export default function (stage) {
  const canvas = document.createElement('canvas');
  canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block;image-rendering:pixelated';
  stage.append(canvas);
  const gl = canvas.getContext('webgl2', { antialias: false });
  if (!gl) { stage.textContent = 'This needs WebGL2.'; return () => canvas.remove(); }
  const vs = `#version 300 es
  in vec2 p; out vec2 uv; void main() { uv = p * .5 + .5; gl_Position = vec4(p, 0, 1); }`;
  const fs = `#version 300 es
  precision highp float; in vec2 uv; out vec4 o;
  uniform vec2 R; uniform float T, LV;
  mat2 rot(float a) { float c = cos(a), s = sin(a); return mat2(c, -s, s, c); }
  float map(vec3 p) {
    vec3 q = p - vec3(0, 1.1, 0); q.xz *= rot(T * .5); q.xy *= rot(T * .3);
    vec2 t = vec2(length(q.xz) - .8, q.y);
    float a = atan(q.z, q.x); t = rot(a * 1.5 + T) * t;                     // a twisted ring with a squared section
    float ring = length(max(abs(t) - vec2(.12, .26), 0.)) - .04;
    float ball = length(p - vec3(sin(T * .7) * 1.6, .45 + abs(sin(T * 1.8)) * .5, cos(T * .7) * .8)) - .42;
    return min(min(ring, ball), p.y);
  }
  vec3 nrm(vec3 p) { vec2 e = vec2(.001, -.001); return normalize(e.xyy * map(p + e.xyy) + e.yyx * map(p + e.yyx) + e.yxy * map(p + e.yxy) + e.xxx * map(p + e.xxx)); }
  float shadow(vec3 ro, vec3 rd) { float r = 1., t = .03; for (int i = 0; i < 40; i++) { float h = map(ro + rd * t); r = min(r, 8. * h / t); t += clamp(h, .02, .3); if (r < .002 || t > 6.) break; } return clamp(r, 0., 1.); }
  float bayer(vec2 p) {                                                     // the 8×8 Bayer threshold, built bit by bit
    ivec2 i = ivec2(mod(p, 8.)); int v = 0;
    for (int b = 0; b < 3; b++) { int x = (i.x >> b) & 1, y = (i.y >> b) & 1; v |= ((x ^ y) << (2 * (2 - b) + 1)) | (y << (2 * (2 - b))); }
    return (float(v) + .5) / 64.;
  }
  void main() {
    vec2 q = (uv * 2. - 1.) * vec2(R.x / R.y, 1.);
    vec3 ro = vec3(sin(T * .1) * 3.3, 2.1, -cos(T * .1) * 3.3), ta = vec3(0, .85, 0);
    vec3 f = normalize(ta - ro), r = normalize(cross(vec3(0, 1, 0), f)), u = cross(f, r), rd = normalize(f * 1.6 + r * q.x + u * q.y);
    float t = 0., lum = .01 + .06 * uv.y;                                    // a dark backdrop: sparse dots, so the lit objects stand out
    for (int i = 0; i < 120; i++) { float d = map(ro + rd * t); if (d < .001) break; t += d; if (t > 20.) { t = -1.; break; } }
    if (t > 0.) {
      vec3 p = ro + rd * t, n = nrm(p), L = normalize(vec3(.6, 1, -.4));
      float dif = max(dot(n, L), 0.) * shadow(p + n * .003, L), sp = pow(max(dot(reflect(rd, n), L), 0.), 24.);
      lum = .02 + .85 * dif * dif + .6 * sp;                                // lit faces glow out of the dark ground
      if (p.y < .002) lum = (.03 + .26 * dif) * (1. - .4 * step(.5, fract(p.x * .5) + fract(p.z * .5) - .5));   // a faint checker floor
      lum = mix(lum, .01 + .06 * uv.y, smoothstep(5., 12., t));
    }
    lum = pow(clamp(lum, 0., 1.), .9);
    // quantise to LV tones, letting the Bayer threshold decide which way each pixel rounds
    float lv = max(LV - 1., 1.), v = floor(lum * lv + bayer(gl_FragCoord.xy)) / lv;
    vec3 ink = vec3(.04, .04, .06), paper = vec3(.95, .9, .78);   // light dots on black
    o = vec4(mix(ink, paper, clamp(v, 0., 1.)), 1);
  }`;
  const sh = (t, s) => { const x = gl.createShader(t); gl.shaderSource(x, s); gl.compileShader(x); if (!gl.getShaderParameter(x, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(x)); return x; };
  const prog = gl.createProgram(); gl.attachShader(prog, sh(gl.VERTEX_SHADER, vs)); gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, fs)); gl.bindAttribLocation(prog, 0, 'p'); gl.linkProgram(prog); gl.useProgram(prog);
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer()); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  const U = {}; ['R', 'T', 'LV'].forEach(n => U[n] = gl.getUniformLocation(prog, n));
  // the canvas is rendered at 1/pixel resolution and scaled up without smoothing: that is the chunky dither grid
  const resize = () => { const px = Math.max(1, PARAMS.pixel); canvas.width = Math.max(1, (stage.clientWidth || 1) / px | 0); canvas.height = Math.max(1, (stage.clientHeight || 1) / px | 0); gl.viewport(0, 0, canvas.width, canvas.height); };
  const ro = new ResizeObserver(resize); ro.observe(stage); resize();
  let raf; const t0 = performance.now();
  function frame(now) {
    gl.uniform2f(U.R, canvas.width, canvas.height); gl.uniform1f(U.T, (now - t0) / 1000); gl.uniform1f(U.LV, Math.round(PARAMS.tones));
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    raf = requestAnimationFrame(frame);
  }
  raf = requestAnimationFrame(frame);
  return () => { cancelAnimationFrame(raf); ro.disconnect(); gl.getExtension('WEBGL_lose_context')?.loseContext(); canvas.remove(); };
}
