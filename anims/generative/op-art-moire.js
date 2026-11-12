// Op-art moiré: two identical sets of fine concentric rings, their centres a few rings apart. Where the rings of the
// two sets line up, the light doubles; where they interleave, it cancels. That beat between two fine gratings is a
// moiré: broad hyperbolic fringes that swing a long way when a centre moves a little. One centre follows the pointer.
const PARAMS = { rings: 52, spread: 0.16, speed: 1 };

export default function (stage) {
  const canvas = document.createElement('canvas');
  canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block;touch-action:none';
  stage.append(canvas);
  const gl = canvas.getContext('webgl2', { antialias: false });
  if (!gl) { stage.textContent = 'This needs WebGL2.'; return () => canvas.remove(); }
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const vs = `#version 300 es
  in vec2 p; void main() { gl_Position = vec4(p, 0, 1); }`;
  const fs = `#version 300 es
  precision highp float; out vec4 o;
  uniform vec2 R, C1, C2; uniform float T, N;
  // a crisp 50% stripe from a phase value, antialiased by its own screen-space rate of change
  float stripe(float v) { float w = fwidth(v); float f = abs(fract(v) - .5) - .25; return smoothstep(w, -w, f); }
  void main() {
    float s = min(R.x, R.y) * .5;
    vec2 p = (gl_FragCoord.xy - R * .5) / s;
    float a = stripe(length(p - C1) * N);
    float b = stripe(length(p - C2) * N);
    vec3 col = vec3(.03, .03, .045);
    col += vec3(.95, .24, .38) * a * .13;               // each layer alone is a faint tint
    col += vec3(.2, .6, 1.) * b * .13;
    // the coincidence of the two layers is what draws the fringes: light it hard
    float fr = a * b;
    vec3 hot = mix(vec3(1., .55, .35), vec3(.85, .95, 1.), .5 + .5 * sin(length(p) * 2.2 - T * .4));
    col += hot * fr * .95;
    float vig = smoothstep(1.9, .4, length(p * vec2(.85, 1.)));
    o = vec4(pow(col * (.55 + .45 * vig), vec3(.92)), 1);
  }`;
  const sh = (t, s) => { const x = gl.createShader(t); gl.shaderSource(x, s); gl.compileShader(x); if (!gl.getShaderParameter(x, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(x)); return x; };
  const prog = gl.createProgram(); gl.attachShader(prog, sh(gl.VERTEX_SHADER, vs)); gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, fs)); gl.bindAttribLocation(prog, 0, 'p'); gl.linkProgram(prog); gl.useProgram(prog);
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer()); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  const U = {}; ['R', 'C1', 'C2', 'T', 'N'].forEach(n => U[n] = gl.getUniformLocation(prog, n));
  const resize = () => { const d = Math.min(devicePixelRatio, 2); canvas.width = (stage.clientWidth || 1) * d | 0; canvas.height = (stage.clientHeight || 1) * d | 0; gl.viewport(0, 0, canvas.width, canvas.height); };
  const ro = new ResizeObserver(resize); ro.observe(stage); resize();
  let ptr = null, lastMove = -1e9;
  const move = e => { const r = stage.getBoundingClientRect(), s = Math.min(r.width, r.height) * .5; ptr = [(e.clientX - r.left - r.width / 2) / s, -(e.clientY - r.top - r.height / 2) / s]; lastMove = performance.now(); };
  stage.addEventListener('pointermove', move); stage.addEventListener('pointerdown', move);
  const c2 = [0.3, 0];
  let raf; const t0 = performance.now();
  function frame(now) {
    const t = reduce ? 4 + (now - t0) / 1000 * .05 : (now - t0) / 1000 * PARAMS.speed;
    const c1 = [Math.sin(t * .13) * .12, Math.cos(t * .11) * .08];
    // ghost: the second centre circles the first at a breathing distance; the pointer takes over while it moves
    const sp = PARAMS.spread * (.6 + .4 * Math.sin(t * .29));
    let g = [c1[0] + Math.cos(t * .21) * sp, c1[1] + Math.sin(t * .21) * sp];
    if (ptr && now - lastMove < 2500) g = [c1[0] + ptr[0] * PARAMS.spread * 1.6, c1[1] + ptr[1] * PARAMS.spread * 1.6];
    const k = reduce ? 1 : .08; c2[0] += (g[0] - c2[0]) * k; c2[1] += (g[1] - c2[1]) * k;
    gl.uniform2f(U.R, canvas.width, canvas.height); gl.uniform2f(U.C1, c1[0], c1[1]); gl.uniform2f(U.C2, c2[0], c2[1]);
    gl.uniform1f(U.T, t); gl.uniform1f(U.N, PARAMS.rings);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    raf = requestAnimationFrame(frame);
  }
  raf = requestAnimationFrame(frame);
  return () => { cancelAnimationFrame(raf); ro.disconnect(); stage.removeEventListener('pointermove', move); stage.removeEventListener('pointerdown', move); gl.getExtension('WEBGL_lose_context')?.loseContext(); canvas.remove(); };
}
