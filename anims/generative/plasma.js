// Plasma, the demoscene classic: four sine waves added per pixel, one along x, one along y, one diagonal and one
// circular around a point that wanders, each drifting at its own speed. The sum swells and folds into soft lobes.
// The old trick was to cycle a rainbow palette through it; here the value goes through a cosine into a four-stop
// ramp that runs dark-light-dark, so the lobes get lit rims, and a slower mix of the same waves blends between a
// warm ramp (plum, coral, peach) and a cool one (indigo, blue, ice) instead of every hue at once.
// A second, finer copy of the field adds a faint sheen of tight contour bands on top.
// The pointer (or, idle, the old wandering point) is the centre of the circular wave, so the rings spread from it.
const PARAMS = { scale: 1.3, speed: 1, bands: 1 };

export default function (stage) {
  const canvas = document.createElement('canvas');
  canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block';
  stage.append(canvas);
  const gl = canvas.getContext('webgl2', { antialias: false });
  if (!gl) { stage.textContent = 'This needs WebGL2.'; return () => canvas.remove(); }
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const vs = `#version 300 es
  in vec2 p; void main() { gl_Position = vec4(p, 0, 1); }`;
  const fs = `#version 300 es
  precision highp float; out vec4 o;
  uniform vec2 R, M; uniform float T, D, MA, u_scale, u_speed, u_bands;
  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  vec2 hash2(vec2 p) { return fract(sin(vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)))) * 43758.5453); }
  float noise(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
    return mix(mix(hash(i), hash(i + vec2(1, 0)), f.x), mix(hash(i + vec2(0, 1)), hash(i + 1.), f.x), f.y); }
  float fbm(vec2 p) { float s = 0., a = .5; mat2 m = mat2(1.6, 1.2, -1.2, 1.6); for (int i = 0; i < 5; i++) { s += a * noise(p); p = m * p; a *= .5; } return s; }
  vec3 ramp(float x, vec3 b, vec3 c, vec3 d) {
    vec3 a = vec3(.025, .02, .06);
    return x < .4 ? mix(a, b, x / .4) : x < .75 ? mix(b, c, (x - .4) / .35) : mix(c, d, (x - .75) / .25);
  }
  void main() {
    vec2 p = (gl_FragCoord.xy - .5 * R) / R.y * 6. * u_scale;
    vec2 c = M * 6. * u_scale;                                    // the circular wave's centre: the pointer
    float v = sin(p.x * 1.1 + T * .7)
            + sin(p.y * 1.3 - T * .5)
            + sin((p.x + p.y) * .8 + T * .37)
            + (1. + .6 * MA) * sin(sqrt(dot(p - c, p - c) + .05) * 1.9 - T * .9);   // softened so the centre has no cusp
    float x = pow(.5 + .5 * cos(v * 2.1), 1.5);                  // −4…4 → a smooth 0…1 that crests several times
    x = x * x * (3. - 2. * x);
    // two colour families, warm and cool, chosen by a second, slower combination of the same waves
    float fam = smoothstep(-.8, .8, sin(p.x * .45 - T * .21) + sin(p.y * .55 + T * .17));
    vec3 warm = ramp(x, vec3(.32, .07, .38), vec3(.95, .38, .32), vec3(1., .86, .66));
    vec3 cool = ramp(x, vec3(.08, .1, .4), vec3(.2, .55, .9), vec3(.75, .95, 1.));
    vec3 col = mix(cool, warm, fam);
    float fine = .5 + .5 * cos(v * 9.);                           // tight bands riding the same field
    col += vec3(1., .8, .7) * pow(fine, 12.) * .14 * u_bands * smoothstep(.3, .8, x);
    col *= .85 + .15 * smoothstep(1.2, .0, length((gl_FragCoord.xy - .5 * R) / R.y));
    o = vec4(col, 1);
  }`;
  const sh = (t, s) => { const x = gl.createShader(t); gl.shaderSource(x, s); gl.compileShader(x); if (!gl.getShaderParameter(x, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(x)); return x; };
  const prog = gl.createProgram(); gl.attachShader(prog, sh(gl.VERTEX_SHADER, vs)); gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, fs)); gl.bindAttribLocation(prog, 0, 'p'); gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog));
  gl.useProgram(prog);
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer()); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  const U = {}; ['R', 'M', 'T', 'D', 'MA', 'u_scale', 'u_speed', 'u_bands'].forEach(n => U[n] = gl.getUniformLocation(prog, n));
  let dpr = 1;
  const resize = () => { dpr = Math.min(devicePixelRatio, 2); canvas.width = (stage.clientWidth || 1) * dpr | 0; canvas.height = (stage.clientHeight || 1) * dpr | 0; gl.viewport(0, 0, canvas.width, canvas.height); };
  const ro = new ResizeObserver(resize); ro.observe(stage); resize();
  // the pointer, in shader space (units of stage height, origin at the centre, y up). When nobody is pointing, the
  // ghost is the classic plasma's own wandering point, so the idle piece looks as it always did
  const ghostX = tt => Math.sin(tt * 0.23) * 3 / (6 * PARAMS.scale), ghostY = tt => Math.cos(tt * 0.31) * 2 / (6 * PARAMS.scale);
  let tx = ghostX(0), ty = ghostY(0), mx = tx, my = ty, ma = 0, lastMove = -1e9;
  const toLocal = e => { const b = canvas.getBoundingClientRect(); return [(e.clientX - b.left - b.width / 2) / b.height, (b.height / 2 - (e.clientY - b.top)) / b.height]; };
  const onMove = e => { [tx, ty] = toLocal(e); lastMove = performance.now(); };
  const onLeave = () => { lastMove = -1e9; };
  const onDown = e => { onMove(e); };
  canvas.addEventListener('pointermove', onMove); canvas.addEventListener('pointerdown', onDown); canvas.addEventListener('pointerleave', onLeave);
  let raf, t = 0, last = performance.now();
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    t += dt * PARAMS.speed * (reduce ? 0.05 : 1);
    const live = now - lastMove < 2500;
    if (!live) { tx = ghostX(t); ty = ghostY(t); }
    const k = 1 - Math.exp(-dt * (live ? 14 : 3));
    mx += (tx - mx) * k; my += (ty - my) * k; ma += ((live ? 1 : 0) - ma) * (1 - Math.exp(-dt * 4));

    gl.uniform2f(U.R, canvas.width, canvas.height); gl.uniform1f(U.T, t); gl.uniform1f(U.D, dpr);
    gl.uniform2f(U.M, mx, my); gl.uniform1f(U.MA, ma);
    gl.uniform1f(U.u_scale, PARAMS.scale);
    gl.uniform1f(U.u_speed, PARAMS.speed);
    gl.uniform1f(U.u_bands, PARAMS.bands);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    raf = requestAnimationFrame(frame);
  }
  raf = requestAnimationFrame(frame);
  return () => { cancelAnimationFrame(raf); ro.disconnect(); canvas.removeEventListener('pointermove', onMove); canvas.removeEventListener('pointerdown', onDown); canvas.removeEventListener('pointerleave', onLeave); gl.getExtension('WEBGL_lose_context')?.loseContext(); canvas.remove(); };
}
