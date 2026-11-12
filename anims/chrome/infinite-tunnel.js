// Infinite tunnel: the camera flies down a winding tube lined with bevelled metal panels. The tube is a
// distance field around a curved path, the panels are cut from its angle and depth, and light pulses race
// along the seams. Coloured lights travel with you, so the panels glint as they pass.
const PARAMS = { speed: 1, twist: 1, glow: 1 };

export default function (stage) {
  const canvas = document.createElement('canvas');
  canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block';
  stage.append(canvas);
  const gl = canvas.getContext('webgl2', { antialias: false });
  if (!gl) { stage.textContent = 'This needs WebGL2.'; return () => canvas.remove(); }
  const vs = `#version 300 es
  in vec2 p; out vec2 uv; void main() { uv = p * .5 + .5; gl_Position = vec4(p, 0, 1); }`;
  const fs = `#version 300 es
  precision highp float; in vec2 uv; out vec4 o; uniform vec2 R; uniform float T, Z, TW, G;
  vec2 path(float z) { return vec2(sin(z * .13) * 2.2 + sin(z * .051) * 1.5, cos(z * .09) * 1.6); }
  // panel coordinates on the wall: 14 around, staggered rows along the tube, twisting slowly with depth
  vec3 panel(vec3 p) {
    vec2 q = p.xy - path(p.z);
    float a = atan(q.y, q.x) / 6.2832 + p.z * .012 * TW, v = p.z * .9;
    float row = floor(v), u = a * 14. + mod(row, 2.) * .5;
    vec2 f = vec2(fract(u), fract(v));
    float e = min(min(f.x, 1. - f.x) / 14. * 6.2832 * 1.5, min(f.y, 1. - f.y) / .9);   // distance to the panel's edge
    return vec3(e, floor(u), row);
  }
  float map(vec3 p) {
    vec2 q = p.xy - path(p.z);
    float e = panel(p).x;
    return 1.5 - length(q) - smoothstep(0., .07, e) * .045;     // panels stand proud of the seams
  }
  vec3 nrm(vec3 p) { vec2 k = vec2(.003, -.003); return normalize(k.xyy * map(p + k.xyy) + k.yyx * map(p + k.yyx) + k.yxy * map(p + k.yxy) + k.xxx * map(p + k.xxx)); }
  float hash(vec2 p) { return fract(sin(dot(p, vec2(41.7, 289.3))) * 43758.5); }
  vec3 aces(vec3 x) { return clamp((x * (2.51 * x + .03)) / (x * (2.43 * x + .59) + .14), 0., 1.); }
  void main() {
    vec2 q = (uv - .5) * vec2(R.x / R.y, 1.);
    vec3 ro = vec3(path(Z), Z), ta = vec3(path(Z + 2.5), Z + 2.5);
    vec3 f = normalize(ta - ro), up = vec3(sin(Z * .05) * .3, 1, 0), r = normalize(cross(up, f)), u = cross(f, r);
    vec3 rd = normalize(f * 1.2 + r * q.x + u * q.y);
    float t = 0.; vec3 p = ro;
    for (int i = 0; i < 90; i++) { p = ro + rd * t; float d = map(p); if (d < .002) break; t += d * .9; if (t > 40.) break; }
    vec3 n = nrm(p), pa = panel(p);
    float id = hash(pa.yz);
    vec3 base = mix(vec3(.05, .055, .07), vec3(.12, .12, .14), id);
    vec3 col = base * .2;
    // three lights that ride along ahead of the camera
    for (int i = 0; i < 3; i++) {
      float lz = Z + 2. + float(i) * 5.5;
      vec3 lp = vec3(path(lz) + vec2(sin(T + float(i) * 2.) * .6, cos(T * .8 + float(i)) * .5), lz);
      vec3 lc = i == 0 ? vec3(1., .25, .6) : i == 1 ? vec3(.2, .8, 1.) : vec3(1., .65, .25);
      vec3 L = lp - p; float dl = length(L); L /= dl;
      float att = 1. / (1. + dl * dl * .35);
      col += lc * att * (base * max(0., dot(n, L)) * 3. + pow(max(0., dot(reflect(rd, n), L)), 40.) * (1.5 + id * 2.));
    }
    // seams glow, with pulses racing down them
    float seam = 1. - smoothstep(0., .035, pa.x);
    float pulse = pow(.5 + .5 * sin(p.z * .7 - T * 6. + pa.y * 1.3), 10.);
    vec3 neon = mix(vec3(1., .2, .55), vec3(.2, .75, 1.), .5 + .5 * sin(pa.y * .9 + p.z * .05));
    col += neon * seam * (.25 + 2.2 * pulse) * G;
    col = mix(col, vec3(.01, .008, .02), 1. - exp(-t * .09));        // fog into the distance
    col += neon * .08 * G / (1. + t * .3) * exp(-length(q) * 3.);
    col = aces(col * 1.2);
    col *= 1. - .35 * pow(length(uv - .5) * 1.25, 2.);
    o = vec4(pow(col, vec3(1. / 2.2)), 1);
  }`;
  const sh = (t, s) => { const x = gl.createShader(t); gl.shaderSource(x, s); gl.compileShader(x); if (!gl.getShaderParameter(x, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(x)); return x; };
  const prog = gl.createProgram(); gl.attachShader(prog, sh(gl.VERTEX_SHADER, vs)); gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, fs)); gl.bindAttribLocation(prog, 0, 'p'); gl.linkProgram(prog); gl.useProgram(prog);
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer()); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  const U = {}; ['R', 'T', 'Z', 'TW', 'G'].forEach(n => U[n] = gl.getUniformLocation(prog, n));
  const resize = () => { const d = Math.min(devicePixelRatio, 1.25); canvas.width = stage.clientWidth * d | 0; canvas.height = stage.clientHeight * d | 0; gl.viewport(0, 0, canvas.width, canvas.height); };
  const ro = new ResizeObserver(resize); ro.observe(stage); resize();
  let raf, z = 0, last = performance.now(); const t0 = last;
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000); last = now; z += dt * 3.2 * PARAMS.speed;   // distance travelled, so the speed slider never jumps
    gl.uniform2f(U.R, canvas.width, canvas.height); gl.uniform1f(U.T, (now - t0) / 1000); gl.uniform1f(U.Z, z);
    gl.uniform1f(U.TW, PARAMS.twist); gl.uniform1f(U.G, PARAMS.glow);
    gl.drawArrays(gl.TRIANGLES, 0, 3); raf = requestAnimationFrame(frame);
  }
  raf = requestAnimationFrame(frame);
  return () => { cancelAnimationFrame(raf); ro.disconnect(); gl.getExtension('WEBGL_lose_context')?.loseContext(); canvas.remove(); };
}
