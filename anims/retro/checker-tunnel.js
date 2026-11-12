// The demoscene tunnel: no geometry at all. Each pixel’s angle around the centre becomes the texture’s u and
// 1/distance becomes v (depth), so a flat checkerboard wraps into an endless tube. Scrolling v flies you forward,
// adding v to u twists it, and moving the centre for the far pixels more than the near ones bends the tube.
// The checker is box-filtered with screen derivatives, so it stays crisp out to the vanishing point, where fog
// swallows it.
const PARAMS = { speed: 1, twist: 1, tiles: 8 };

export default function (stage) {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const canvas = document.createElement('canvas');
  canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block';
  stage.append(canvas);
  const gl = canvas.getContext('webgl2', { antialias: false });
  if (!gl) { stage.textContent = 'This needs WebGL2.'; return () => canvas.remove(); }
  const vs = `#version 300 es
  in vec2 p; void main() { gl_Position = vec4(p, 0, 1); }`;
  const fs = `#version 300 es
  precision highp float; out vec4 o;
  uniform vec2 R; uniform float T, TW, K;
  // box-filtered checkerboard (exact integral of the pattern over the pixel footprint)
  float checker(vec2 uv, vec2 w) {
    vec2 i = 2. * (abs(fract((uv - .5 * w) * .5) - .5) - abs(fract((uv + .5 * w) * .5) - .5)) / w;
    return .5 - .5 * i.x * i.y;
  }
  void main() {
    vec2 p = (gl_FragCoord.xy - .5 * R) / R.y;
    // bend: the far end of the tube (small radius) is pulled further off-centre than the near end
    vec2 c = vec2(.13 * sin(T * .31), .08 * sin(T * .43 + 1.3));
    float r0 = length(p);
    p -= c * exp(-r0 * 2.6);
    float r = length(p), a = atan(p.y, p.x);
    float depth = .45 / r;
    float v = depth + T * 1.1;
    float tw = TW * (depth * .12 + .06 * sin(T * .27));
    float u = a / 6.2832 * K + tw * K;
    // the atan seam: take derivatives from a second branch so the filter width stays sane across it
    float u2 = (atan(-p.y, -p.x) + 3.1416) / 6.2832 * K + tw * K;
    vec2 uv = vec2(u, v * K / 3.);
    vec2 w = vec2(min(fwidth(u), fwidth(u2)), fwidth(uv.y)) + 1e-4;
    float ch = checker(uv, w);
    // two-tone tiles; each ring of tiles takes a hue that slides along the tube
    float ring = floor(uv.y * .5);
    vec3 hot = .55 + .45 * cos(6.2832 * (vec3(0., .33, .67) + ring * .07 + T * .03));
    vec3 col = mix(vec3(.02, .02, .05), hot, ch);
    // lighting: brighter near the viewer, fog swallowing the depth
    float fog = exp(-depth * .38);
    col *= fog * (.78 + .32 * cos(a - 2.2 - T * .1));              // a light from one side of the tube
    col += vec3(.6, .7, 1.) * .05 * exp(-r * 18.);
    col = mix(vec3(.01, .008, .02), col, smoothstep(.0, .05, r));
    o = vec4(pow(col, vec3(.95)), 1);
  }`;
  const sh = (t, s) => { const x = gl.createShader(t); gl.shaderSource(x, s); gl.compileShader(x); if (!gl.getShaderParameter(x, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(x)); return x; };
  const prog = gl.createProgram(); gl.attachShader(prog, sh(gl.VERTEX_SHADER, vs)); gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, fs)); gl.bindAttribLocation(prog, 0, 'p'); gl.linkProgram(prog); gl.useProgram(prog);
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer()); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  const U = {}; ['R', 'T', 'TW', 'K'].forEach(n => U[n] = gl.getUniformLocation(prog, n));
  const resize = () => { const d = Math.min(devicePixelRatio, 2); canvas.width = (stage.clientWidth || 1) * d | 0; canvas.height = (stage.clientHeight || 1) * d | 0; gl.viewport(0, 0, canvas.width, canvas.height); };
  const ro = new ResizeObserver(resize); ro.observe(stage); resize();
  let raf, last = performance.now(), t = 3;
  function frame(now) {
    t += Math.min(0.05, (now - last) / 1000) * PARAMS.speed * (reduce ? 0.06 : 1); last = now;
    gl.uniform2f(U.R, canvas.width, canvas.height); gl.uniform1f(U.T, t); gl.uniform1f(U.TW, PARAMS.twist); gl.uniform1f(U.K, Math.round(PARAMS.tiles) * 2);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    raf = requestAnimationFrame(frame);
  }
  raf = requestAnimationFrame(frame);
  return () => { cancelAnimationFrame(raf); ro.disconnect(); gl.getExtension('WEBGL_lose_context')?.loseContext(); canvas.remove(); };
}
