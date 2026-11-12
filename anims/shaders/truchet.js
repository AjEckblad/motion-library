// Truchet tiles: every square holds two quarter-circle arcs joining the midpoints of its sides, in one of two
// orientations chosen at random. Whatever the choice, the arcs always meet their neighbours', so the grid forms
// unbroken winding paths. Dashes flow along the paths; flipping the flow direction on alternate squares (a
// checkerboard) keeps it continuous across tiles. Now and then a tile turns a quarter, and the paths reroute.
const PARAMS = { tiles: 9, flow: 1 };

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
  uniform vec2 R; uniform float T, N, FL;
  float hash(vec2 p) { return fract(sin(dot(p, vec2(41.3, 289.1))) * 43758.5453); }
  void main() {
    vec2 p = (uv - .5) * vec2(R.x / R.y, 1.) * N;
    vec2 id = floor(p), f = fract(p) - .5;
    // each tile's orientation: random, re-rolled now and then, with a quarter-turn animation as it changes
    float h = hash(id), epoch = floor(T * .25 + h * 7.), h2 = hash(id + epoch * 1.7);
    float turn = smoothstep(.0, .35, fract(T * .25 + h * 7.)) * step(.8, hash(id + (epoch - 1.) * 1.7));
    float flip = step(.5, h2);
    float a = (flip + turn) * 1.5708; f = mat2(cos(a), -sin(a), sin(a), cos(a)) * f;
    // two arcs, centred on opposite corners
    vec2 c1 = f - vec2(.5), c2 = f + vec2(.5);
    float d1 = abs(length(c1) - .5), d2 = abs(length(c2) - .5), d = min(d1, d2);
    vec2 c = d1 < d2 ? c1 : c2;
    float ang = atan(c.y, c.x) * (d1 < d2 ? 1. : -1.);
    float par = mod(id.x + id.y, 2.) * 2. - 1.;                          // checkerboard: alternate the flow direction
    float dash = fract(ang / 1.5708 * 2. * par * (flip > .5 ? -1. : 1.) - T * FL * .8);
    float w = .11, line = smoothstep(w, w - 2.5 * N / R.y, d);
    float glow = exp(-d * 18.) * .5;
    vec3 base = .5 + .5 * cos(6.2832 * (vec3(0, .33, .67) + id.x * .03 + id.y * .05 + T * .03));
    vec3 col = vec3(.03, .03, .06) + base * glow * .5;
    col += base * line * (.35 + .9 * smoothstep(.55, .5, abs(dash - .5)) );
    col += vec3(1) * line * smoothstep(.05, .0, abs(dash - .5)) * .4;        // a bright head on each dash
    o = vec4(pow(col, vec3(.9)), 1);
  }`;
  const sh = (t, s) => { const x = gl.createShader(t); gl.shaderSource(x, s); gl.compileShader(x); if (!gl.getShaderParameter(x, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(x)); return x; };
  const prog = gl.createProgram(); gl.attachShader(prog, sh(gl.VERTEX_SHADER, vs)); gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, fs)); gl.bindAttribLocation(prog, 0, 'p'); gl.linkProgram(prog); gl.useProgram(prog);
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer()); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  const U = {}; ['R', 'T', 'N', 'FL'].forEach(n => U[n] = gl.getUniformLocation(prog, n));
  const resize = () => { const d = Math.min(devicePixelRatio, 2); canvas.width = (stage.clientWidth || 1) * d | 0; canvas.height = (stage.clientHeight || 1) * d | 0; gl.viewport(0, 0, canvas.width, canvas.height); };
  const ro = new ResizeObserver(resize); ro.observe(stage); resize();
  let raf; const t0 = performance.now();
  function frame(now) {
    gl.uniform2f(U.R, canvas.width, canvas.height); gl.uniform1f(U.T, (now - t0) / 1000); gl.uniform1f(U.N, PARAMS.tiles); gl.uniform1f(U.FL, PARAMS.flow);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    raf = requestAnimationFrame(frame);
  }
  raf = requestAnimationFrame(frame);
  return () => { cancelAnimationFrame(raf); ro.disconnect(); gl.getExtension('WEBGL_lose_context')?.loseContext(); canvas.remove(); };
}
