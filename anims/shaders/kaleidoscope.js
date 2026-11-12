// Kaleidoscope: fold the plane into N mirrored wedges. Convert each pixel to polar coordinates, take the angle modulo
// one wedge, and mirror every other wedge, so whatever is drawn in one slice repeats round the circle with perfect
// symmetry. The slice holds drifting glass chips (soft-edged cells of a moving Voronoi pattern) and a light leak; the
// whole thing slowly turns and breathes in and out, and the edges of the chips split slightly into colour fringes.
const PARAMS = { mirrors: 8, zoom: 1 };

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
  uniform vec2 R; uniform float T, N, Z;
  vec2 hash2(vec2 p) { p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3))); return fract(sin(p) * 43758.5453); }
  // the glass chips: nearest and second-nearest cell distance, and the cell's id
  vec3 chips(vec2 p) {
    vec2 i = floor(p), f = fract(p); float d1 = 8., d2 = 8.; vec2 best = vec2(0);
    for (int y = -1; y <= 1; y++) for (int x = -1; x <= 1; x++) {
      vec2 g = vec2(x, y), o = hash2(i + g); o = .5 + .45 * sin(T * .5 + 6.2831 * o);
      float d = length(g + o - f); if (d < d1) { d2 = d1; d1 = d; best = i + g; } else if (d < d2) d2 = d;
    }
    return vec3(d2 - d1, best);
  }
  vec3 slice(vec2 p) {
    vec3 c = chips(p * 2.2 + vec2(T * .15, 0));
    vec3 tint = .55 + .45 * cos(6.2831 * (hash2(c.yz).x + vec3(0, .33, .67)));
    float edge = smoothstep(.0, .06, c.x);
    vec3 col = tint * edge * (.6 + .4 * hash2(c.yz + 3.).y);
    col += vec3(1., .85, .6) * .25 * exp(-length(p - vec2(.8, .1)) * 2.);   // a warm light leak
    return col;
  }
  vec3 fold(vec2 q, float k) {
    float r = length(q), a = atan(q.y, q.x) + T * .05;
    float w = 6.2831 / N; a = mod(a, w); a = min(a, w - a);                // one wedge, mirrored at its edges
    vec2 p = vec2(cos(a), sin(a)) * r * k;
    return slice(p);
  }
  void main() {
    vec2 q = (uv * 2. - 1.) * vec2(R.x / R.y, 1.);
    float k = Z * (1.4 + .25 * sin(T * .23));                             // breathing zoom
    vec3 col = vec3(fold(q * 1.006, k).r, fold(q, k).g, fold(q * .994, k).b);   // slight colour fringing, like cheap mirrors
    col *= smoothstep(1.35, .7, length(q));                                // the tube's dark rim
    o = vec4(pow(col, vec3(.95)), 1);
  }`;
  const sh = (t, s) => { const x = gl.createShader(t); gl.shaderSource(x, s); gl.compileShader(x); if (!gl.getShaderParameter(x, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(x)); return x; };
  const prog = gl.createProgram(); gl.attachShader(prog, sh(gl.VERTEX_SHADER, vs)); gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, fs)); gl.bindAttribLocation(prog, 0, 'p'); gl.linkProgram(prog); gl.useProgram(prog);
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer()); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  const U = {}; ['R', 'T', 'N', 'Z'].forEach(n => U[n] = gl.getUniformLocation(prog, n));
  const resize = () => { const d = Math.min(devicePixelRatio, 2); canvas.width = (stage.clientWidth || 1) * d | 0; canvas.height = (stage.clientHeight || 1) * d | 0; gl.viewport(0, 0, canvas.width, canvas.height); };
  const ro = new ResizeObserver(resize); ro.observe(stage); resize();
  let raf; const t0 = performance.now();
  function frame(now) {
    gl.uniform2f(U.R, canvas.width, canvas.height); gl.uniform1f(U.T, (now - t0) / 1000); gl.uniform1f(U.N, Math.round(PARAMS.mirrors)); gl.uniform1f(U.Z, PARAMS.zoom);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    raf = requestAnimationFrame(frame);
  }
  raf = requestAnimationFrame(frame);
  return () => { cancelAnimationFrame(raf); ro.disconnect(); gl.getExtension('WEBGL_lose_context')?.loseContext(); canvas.remove(); };
}
