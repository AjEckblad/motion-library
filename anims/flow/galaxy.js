// Spiral galaxy: stars placed on logarithmic spiral arms, scattered into density waves, orbiting with a flat
// rotation curve (inner stars lap the outer ones). Additive points let the core bloom by itself.
const PARAMS = { stars: 40000, arms: 3, twist: 2 };

export default function (stage) {
  const canvas = document.createElement('canvas');
  canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block';
  stage.append(canvas);
  const gl = canvas.getContext('webgl2', { antialias: false, premultipliedAlpha: false });
  if (!gl) { stage.textContent = 'This needs WebGL2.'; return () => canvas.remove(); }

  const N = Math.round(PARAMS.stars), arms = Math.round(PARAMS.arms);
  const data = new Float32Array(N * 8);              // radius, angle, height, size, r, g, b, speed
  const gauss = () => { let u = 0, v = 0; while (!u) u = Math.random(); while (!v) v = Math.random(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); };
  for (let i = 0; i < N; i++) {
    const core = i < N * 0.18;
    const r = core ? Math.abs(gauss()) * 0.12 : 0.06 + Math.pow(Math.random(), 1.6) * 0.94;
    const arm = Math.floor(Math.random() * arms);
    const spread = (0.35 + r * 0.9) * 0.32;
    const a = arm * (Math.PI * 2 / arms) + Math.log(r + 0.02) * PARAMS.twist + gauss() * spread * (core ? 6 : 1);
    const z = gauss() * (core ? 0.05 : 0.018) * (1 - r * 0.6);
    const hot = !core && Math.random() < 0.03;          // pink star-forming knots along the arms
    let col;
    if (core) col = [1, 0.86 + Math.random() * 0.1, 0.62 + Math.random() * 0.15];
    else if (hot) col = [1, 0.45, 0.7];
    else { const t = Math.random(); col = [0.62 + 0.35 * t, 0.75 + 0.2 * t, 1]; }
    const o = i * 8;
    data[o] = r; data[o + 1] = a; data[o + 2] = z; data[o + 3] = (core ? 1.6 : 1) * (0.6 + Math.random() * 1.6) * (hot ? 2.4 : 1);
    data[o + 4] = col[0]; data[o + 5] = col[1]; data[o + 6] = col[2];
    data[o + 7] = 0.22 / (r + 0.08);                     // flat rotation curve: angular speed ∝ 1/r
  }
  const vs = `#version 300 es
  in vec4 a; in vec4 b; uniform float T, D; uniform vec2 R; out vec3 c; out float fade;
  void main() {
    float ang = a.y + T * b.w * .25;
    vec3 p = vec3(cos(ang) * a.x, a.z, sin(ang) * a.x);
    float tilt = .95, ct = cos(tilt), st = sin(tilt);
    p = vec3(p.x, p.y * ct - p.z * st, p.y * st + p.z * ct);
    float yaw = T * .03, cy = cos(yaw), sy = sin(yaw);
    p = vec3(p.x * cy - p.z * sy, p.y, p.x * sy + p.z * cy);
    float z = p.z + 2.2;
    gl_Position = vec4(p.x / z * 2.6 * R.y / R.x, p.y / z * 2.6, 0, 1);
    gl_PointSize = a.w * D * 2.2 / z;
    c = b.xyz; fade = clamp(1.6 - z * .45, .25, 1.);
  }`;
  const fs = `#version 300 es
  precision mediump float; in vec3 c; in float fade; out vec4 o;
  void main() { vec2 q = gl_PointCoord - .5; float d = dot(q, q); float k = exp(-d * 18.); o = vec4(c * k * .55 * fade, 1); }`;
  const sh = (t, s) => { const x = gl.createShader(t); gl.shaderSource(x, s); gl.compileShader(x); if (!gl.getShaderParameter(x, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(x)); return x; };
  const prog = gl.createProgram(); gl.attachShader(prog, sh(gl.VERTEX_SHADER, vs)); gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, fs));
  gl.bindAttribLocation(prog, 0, 'a'); gl.bindAttribLocation(prog, 1, 'b'); gl.linkProgram(prog); gl.useProgram(prog);
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer()); gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 4, gl.FLOAT, false, 32, 0);
  gl.enableVertexAttribArray(1); gl.vertexAttribPointer(1, 4, gl.FLOAT, false, 32, 16);
  gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE);
  const uT = gl.getUniformLocation(prog, 'T'), uR = gl.getUniformLocation(prog, 'R'), uD = gl.getUniformLocation(prog, 'D');
  let dpr = 1;
  const resize = () => { dpr = Math.min(devicePixelRatio, 2); canvas.width = stage.clientWidth * dpr | 0; canvas.height = stage.clientHeight * dpr | 0; gl.viewport(0, 0, canvas.width, canvas.height); };
  const ro = new ResizeObserver(resize); ro.observe(stage); resize();
  let raf;
  function frame(now) {
    gl.clearColor(0.012, 0.016, 0.035, 1); gl.clear(gl.COLOR_BUFFER_BIT);
    gl.uniform1f(uT, now / 1000); gl.uniform2f(uR, canvas.width, canvas.height); gl.uniform1f(uD, dpr * Math.min(canvas.width, canvas.height) / 500);
    gl.drawArrays(gl.POINTS, 0, N);
    raf = requestAnimationFrame(frame);
  }
  raf = requestAnimationFrame(frame);
  return () => { cancelAnimationFrame(raf); ro.disconnect(); gl.getExtension('WEBGL_lose_context')?.loseContext(); canvas.remove(); };
}
