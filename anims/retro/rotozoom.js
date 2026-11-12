// Rotozoom: the whole screen is one texture lookup through a rotation-and-scale matrix that changes every frame,
// the effect every 90s demo opened with. The texture is the classic XOR pattern (x ^ y), built once on the CPU
// at 256×256 and coloured with a palette. Nearest-neighbour magnification keeps the texels hard-edged when you
// zoom in; mipmaps keep it from shimmering when you zoom out.
const PARAMS = { speed: 1, zoom: 1 };

export default function (stage) {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const canvas = document.createElement('canvas');
  canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block';
  stage.append(canvas);
  const gl = canvas.getContext('webgl2', { antialias: false });
  if (!gl) { stage.textContent = 'This needs WebGL2.'; return () => canvas.remove(); }
  // the texture: XOR of the coordinates → nested squares at every power of two
  const N = 256, px = new Uint8Array(N * N * 4);
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    const v = ((x ^ y) & 255) / 255, i = (y * N + x) * 4;
    // a three-stop ramp, navy → hot pink → pale gold, over the XOR value
    const k = v < 0.55 ? v / 0.55 : (v - 0.55) / 0.45, A = v < 0.55 ? [10, 8, 48] : [255, 58, 128], B = v < 0.55 ? [255, 58, 128] : [255, 226, 150];
    const e = k * k * (3 - 2 * k);
    for (let c = 0; c < 3; c++) px[i + c] = A[c] + (B[c] - A[c]) * e;
    px[i + 3] = 255;
  }
  const tex = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, N, N, 0, gl.RGBA, gl.UNSIGNED_BYTE, px);
  gl.generateMipmap(gl.TEXTURE_2D);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);

  const vs = `#version 300 es
  in vec2 p; void main() { gl_Position = vec4(p, 0, 1); }`;
  const fs = `#version 300 es
  precision highp float; out vec4 o;
  uniform vec2 R; uniform float T, Z; uniform sampler2D S;
  void main() {
    vec2 p = (gl_FragCoord.xy - .5 * R) / R.y;
    float a = T * .35 + .6 * sin(T * .21);
    float s = exp(1.4 * sin(T * .29)) * .55 / Z;             // zoom breathes in and out, ~16× end to end
    mat2 m = mat2(cos(a), sin(a), -sin(a), cos(a)) * s;
    vec2 uv = m * p + vec2(T * .11, T * .07);
    vec3 col = texture(S, uv).rgb;
    // CRT-ish finish: slight vignette
    col *= 1. - .35 * dot(p, p);
    o = vec4(col, 1);
  }`;
  const sh = (t, s) => { const x = gl.createShader(t); gl.shaderSource(x, s); gl.compileShader(x); if (!gl.getShaderParameter(x, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(x)); return x; };
  const prog = gl.createProgram(); gl.attachShader(prog, sh(gl.VERTEX_SHADER, vs)); gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, fs)); gl.bindAttribLocation(prog, 0, 'p'); gl.linkProgram(prog); gl.useProgram(prog);
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer()); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  const U = {}; ['R', 'T', 'Z', 'S'].forEach(n => U[n] = gl.getUniformLocation(prog, n));
  gl.uniform1i(U.S, 0);
  const resize = () => { const d = Math.min(devicePixelRatio, 2); canvas.width = (stage.clientWidth || 1) * d | 0; canvas.height = (stage.clientHeight || 1) * d | 0; gl.viewport(0, 0, canvas.width, canvas.height); };
  const ro = new ResizeObserver(resize); ro.observe(stage); resize();
  let raf, last = performance.now(), t = 2;
  function frame(now) {
    t += Math.min(0.05, (now - last) / 1000) * PARAMS.speed * (reduce ? 0.06 : 1); last = now;
    gl.uniform2f(U.R, canvas.width, canvas.height); gl.uniform1f(U.T, t); gl.uniform1f(U.Z, PARAMS.zoom);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    raf = requestAnimationFrame(frame);
  }
  raf = requestAnimationFrame(frame);
  return () => { cancelAnimationFrame(raf); ro.disconnect(); gl.deleteTexture(tex); gl.getExtension('WEBGL_lose_context')?.loseContext(); canvas.remove(); };
}
