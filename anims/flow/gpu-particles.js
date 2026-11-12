// GPU particles: 262,144 particles whose positions live in a float texture. A fragment shader moves every one
// through 3D curl noise each frame (ping-pong between two textures); the vertex shader reads them back as points.
const PARAMS = { size: 512, speed: 1 };

export default function (stage) {
  const canvas = document.createElement('canvas');
  canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block';
  stage.append(canvas);
  const gl = canvas.getContext('webgl2', { antialias: false });
  if (!gl || !gl.getExtension('EXT_color_buffer_float')) { stage.textContent = 'This needs WebGL2 with float render targets.'; return () => canvas.remove(); }
  const N = Math.max(64, Math.round(PARAMS.size)), COUNT = N * N;
  const quadVS = `#version 300 es
  in vec2 p; out vec2 uv; void main() { uv = p * .5 + .5; gl_Position = vec4(p, 0, 1); }`;
  const simFS = `#version 300 es
  precision highp float; in vec2 uv; out vec4 o; uniform sampler2D S; uniform float T, dt;
  vec3 h3(vec3 p) { p = fract(p * vec3(.1031, .103, .0973)); p += dot(p, p.yxz + 33.33); return fract((p.xxy + p.yxx) * p.zyx) * 2. - 1.; }
  float n3(vec3 p) { vec3 i = floor(p), f = fract(p), u = f * f * (3. - 2. * f);
    return mix(mix(mix(dot(h3(i), f), dot(h3(i + vec3(1,0,0)), f - vec3(1,0,0)), u.x), mix(dot(h3(i + vec3(0,1,0)), f - vec3(0,1,0)), dot(h3(i + vec3(1,1,0)), f - vec3(1,1,0)), u.x), u.y),
               mix(mix(dot(h3(i + vec3(0,0,1)), f - vec3(0,0,1)), dot(h3(i + vec3(1,0,1)), f - vec3(1,0,1)), u.x), mix(dot(h3(i + vec3(0,1,1)), f - vec3(0,1,1)), dot(h3(i + vec3(1,1,1)), f - vec3(1,1,1)), u.x), u.y), u.z); }
  vec3 pot(vec3 p) { return vec3(n3(p), n3(p + 31.4), n3(p - 17.9)); }
  vec3 curl(vec3 p) { const float e = .05; vec3 dx = vec3(e, 0, 0), dy = vec3(0, e, 0), dz = vec3(0, 0, e);
    vec3 a = (pot(p + dy) - pot(p - dy)), b = (pot(p + dz) - pot(p - dz)), c = (pot(p + dx) - pot(p - dx));
    return vec3(a.z - b.y, b.x - c.z, c.y - a.x) / (2. * e); }
  void main() {
    vec4 s = texture(S, uv); vec3 p = s.xyz; float life = s.w - dt * .12;
    p += curl(p * 1.1 + T * .05) * dt * .18;
    p -= p * dt * .05 * dot(p, p);                                   // a soft pull keeps the cloud together
    if (life < 0.) { vec3 r = h3(vec3(uv * 91.7, T)); p = normalize(r) * .35 * (.5 + .5 * fract(r.x * 7.)); life = 1.; }
    o = vec4(p, life);
  }`;
  const drawVS = `#version 300 es
  uniform sampler2D S; uniform int N; uniform float T; uniform vec2 R; out float k; out float l;
  void main() {
    ivec2 c = ivec2(gl_VertexID % N, gl_VertexID / N); vec4 s = texelFetch(S, c, 0); vec3 p = s.xyz;
    float a = T * .15, ca = cos(a), sa = sin(a); p = vec3(p.x * ca - p.z * sa, p.y, p.x * sa + p.z * ca);
    float z = p.z + 2.2;
    gl_Position = vec4(p.x / z * 2.4 * R.y / R.x, p.y / z * 2.4, 0, 1); gl_PointSize = R.y / 700. + 1.;
    k = clamp(length(s.xyz) * 1.4, 0., 1.); l = s.w;
  }`;
  const drawFS = `#version 300 es
  precision mediump float; in float k; in float l; out vec4 o;
  void main() { vec3 c = mix(vec3(1., .55, .18), vec3(.25, .65, 1.), k); o = vec4(c * .09 * smoothstep(0., .2, l) * smoothstep(1., .85, l), 1); }`;
  const sh = (t, s) => { const x = gl.createShader(t); gl.shaderSource(x, s); gl.compileShader(x); if (!gl.getShaderParameter(x, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(x)); return x; };
  const mk = (v, f) => { const p = gl.createProgram(); gl.attachShader(p, sh(gl.VERTEX_SHADER, v)); gl.attachShader(p, sh(gl.FRAGMENT_SHADER, f)); gl.bindAttribLocation(p, 0, 'p'); gl.linkProgram(p); return p; };
  const sim = mk(quadVS, simFS), draw = mk(drawVS, drawFS);
  const quad = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, quad); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const init = new Float32Array(COUNT * 4);
  for (let i = 0; i < COUNT; i++) { const r = Math.cbrt(Math.random()) * 0.6, t = Math.random() * 6.28, u = Math.random() * 2 - 1, s = Math.sqrt(1 - u * u); init.set([Math.cos(t) * s * r, u * r, Math.sin(t) * s * r, Math.random()], i * 4); }
  const tgt = () => { const tex = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, tex); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA32F, N, N, 0, gl.RGBA, gl.FLOAT, init);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    const fb = gl.createFramebuffer(); gl.bindFramebuffer(gl.FRAMEBUFFER, fb); gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0); return { tex, fb }; };
  let A = tgt(), B = tgt();
  const vao = gl.createVertexArray();
  const resize = () => { const d = Math.min(devicePixelRatio, 2); canvas.width = stage.clientWidth * d | 0; canvas.height = stage.clientHeight * d | 0; };
  const ro = new ResizeObserver(resize); ro.observe(stage); resize();
  let last = performance.now(), raf;
  function frame(now) {
    const dt = Math.min(0.033, (now - last) / 1000) * PARAMS.speed; last = now;
    gl.disable(gl.BLEND); gl.useProgram(sim); gl.bindBuffer(gl.ARRAY_BUFFER, quad); gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    gl.bindFramebuffer(gl.FRAMEBUFFER, B.fb); gl.viewport(0, 0, N, N); gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, A.tex);
    gl.uniform1i(gl.getUniformLocation(sim, 'S'), 0); gl.uniform1f(gl.getUniformLocation(sim, 'T'), now / 1000); gl.uniform1f(gl.getUniformLocation(sim, 'dt'), dt);
    gl.drawArrays(gl.TRIANGLES, 0, 3); [A, B] = [B, A];
    gl.bindFramebuffer(gl.FRAMEBUFFER, null); gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0.015, 0.018, 0.03, 1); gl.clear(gl.COLOR_BUFFER_BIT);
    gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE); gl.useProgram(draw); gl.bindVertexArray(vao);
    gl.bindTexture(gl.TEXTURE_2D, A.tex); gl.uniform1i(gl.getUniformLocation(draw, 'S'), 0); gl.uniform1i(gl.getUniformLocation(draw, 'N'), N);
    gl.uniform1f(gl.getUniformLocation(draw, 'T'), now / 1000); gl.uniform2f(gl.getUniformLocation(draw, 'R'), canvas.width, canvas.height);
    gl.drawArrays(gl.POINTS, 0, COUNT); gl.bindVertexArray(null);
    raf = requestAnimationFrame(frame);
  }
  raf = requestAnimationFrame(frame);
  return () => { cancelAnimationFrame(raf); ro.disconnect(); gl.getExtension('WEBGL_lose_context')?.loseContext(); canvas.remove(); };
}
