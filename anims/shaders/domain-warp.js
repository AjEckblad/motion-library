// Domain warping (after Inigo Quilez): instead of reading noise at p, read it at p pushed by another noise, which was
// itself read at a pushed point: f(p + g(p + h(p))). Each layer of pushing folds the pattern into marbled, smoky
// filaments. The intermediate warp vectors are reused for colour, so the dye follows the folds, and everything drifts
// slowly so the marble keeps flowing.
const PARAMS = { warp: 1, speed: 1 };

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
  uniform vec2 R; uniform float T, K;
  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float noise(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f); return mix(mix(hash(i), hash(i + vec2(1, 0)), f.x), mix(hash(i + vec2(0, 1)), hash(i + 1.), f.x), f.y); }
  const mat2 M = mat2(.8, .6, -.6, .8);
  float fbm(vec2 p) { float s = 0., a = .5; for (int i = 0; i < 6; i++) { s += a * noise(p); p = M * p * 2.02; a *= .5; } return s; }
  void main() {
    vec2 p = (uv * 2. - 1.) * vec2(R.x / R.y, 1.) * 1.6;
    float t = T * .06;
    vec2 q = vec2(fbm(p + vec2(0, t)), fbm(p + vec2(5.2, 1.3) - t));                 // first push
    vec2 r = vec2(fbm(p + 4. * K * q + vec2(1.7, 9.2) + t * 1.5), fbm(p + 4. * K * q + vec2(8.3, 2.8) - t));   // pushed again
    float f = fbm(p + 4. * K * r);                                                   // read at the twice-pushed point
    vec3 col = mix(vec3(.10, .15, .32), vec3(.72, .38, .2), clamp(f * f * 3.2, 0., 1.));
    col = mix(col, vec3(.05, .05, .13), clamp(length(q), 0., 1.) * .7);
    col = mix(col, vec3(.95, .82, .62), clamp(abs(r.x) * r.x * 1.6, 0., 1.) * .8);
    col = mix(col, vec3(.2, .55, .6), smoothstep(.55, .9, r.y) * .5);
    col *= .55 + 1.1 * f;
    col = pow(col, vec3(.95));
    o = vec4(col, 1);
  }`;
  const sh = (t, s) => { const x = gl.createShader(t); gl.shaderSource(x, s); gl.compileShader(x); if (!gl.getShaderParameter(x, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(x)); return x; };
  const prog = gl.createProgram(); gl.attachShader(prog, sh(gl.VERTEX_SHADER, vs)); gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, fs)); gl.bindAttribLocation(prog, 0, 'p'); gl.linkProgram(prog); gl.useProgram(prog);
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer()); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  const U = {}; ['R', 'T', 'K'].forEach(n => U[n] = gl.getUniformLocation(prog, n));
  const resize = () => { const w = stage.clientWidth || 1, h = stage.clientHeight || 1, d = Math.min(devicePixelRatio, Math.max(1, Math.sqrt(500000 / (w * h)))); canvas.width = w * d | 0; canvas.height = h * d | 0; gl.viewport(0, 0, canvas.width, canvas.height); };
  const ro = new ResizeObserver(resize); ro.observe(stage); resize();
  let raf, last = performance.now(), t = 0;
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000); last = now; t += dt * PARAMS.speed;
    gl.uniform2f(U.R, canvas.width, canvas.height); gl.uniform1f(U.T, t); gl.uniform1f(U.K, PARAMS.warp);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    raf = requestAnimationFrame(frame);
  }
  raf = requestAnimationFrame(frame);
  return () => { cancelAnimationFrame(raf); ro.disconnect(); gl.getExtension('WEBGL_lose_context')?.loseContext(); canvas.remove(); };
}
