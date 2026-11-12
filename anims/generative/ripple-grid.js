// Ripple grid: a fine square grid, drawn per pixel as the lines of a coordinate system, and that coordinate system
// is what gets disturbed. Each ripple is a damped ring wave travelling outwards from where it was dropped; summed,
// they give a radial displacement at every pixel, and the grid is drawn at the displaced position, so the lines
// bunch up and spread apart as the rings pass, like a sheet of graph paper floating on water. Lines are drawn with
// screen-space derivatives so they stay one crisp pixel thick however hard they are stretched, and the slope of the
// wave lights them: compressed lines glow hot, stretched ones dim. Click to drop a big one; moving drops small ones.
const PARAMS = { cells: 36, speed: 1, depth: 1 };

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
  uniform vec2 R, M; uniform float T, D, MA, u_cells, u_speed, u_depth;
  uniform vec4 EV[8];
  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  vec2 hash2(vec2 p) { return fract(sin(vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)))) * 43758.5453); }
  float noise(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
    return mix(mix(hash(i), hash(i + vec2(1, 0)), f.x), mix(hash(i + vec2(0, 1)), hash(i + 1.), f.x), f.y); }
  float fbm(vec2 p) { float s = 0., a = .5; mat2 m = mat2(1.6, 1.2, -1.2, 1.6); for (int i = 0; i < 5; i++) { s += a * noise(p); p = m * p; a *= .5; } return s; }
  void main() {
    vec2 p = (gl_FragCoord.xy - .5 * R) / R.y;
    vec2 disp = vec2(0); float lit = 0., energy = 0.;
    for (int i = 0; i < 8; i++) {
      vec4 e = EV[i];
      float age = T - e.z;
      if (age < 0. || age > 6. || e.w <= 0.) continue;
      vec2 dv = p - e.xy; float r = length(dv);
      float front = age * .32;                                  // ring radius
      float x = r - front;
      float env = exp(-x * x * 55.) * exp(-age * .55) * e.w * smoothstep(0., .25, age);
      float wv = sin(x * 42.) * env;                             // a short train of waves around the front
      disp += normalize(dv + 1e-5) * wv * .028 * u_depth;
      lit += cos(x * 42.) * env; energy += env;                                 // the wave's slope: where lines bunch, they glow
    }
    vec2 q = (p + disp) * u_cells;
    vec2 fw = fwidth(q);
    vec2 g = abs(fract(q - .5) - .5) / fw;                       // distance to the nearest line, in pixels
    float line = 1. - min(min(g.x, g.y), 1.);
    vec2 q5 = q / 5.; vec2 g5 = abs(fract(q5 - .5) - .5) / fwidth(q5);
    float major = 1. - min(min(g5.x, g5.y), 1.);
    vec3 bg = vec3(.018, .02, .032);
    float L = clamp(lit * u_depth * 1.4, -1., 1.), E = clamp(energy * 1.6, 0., 1.);
    vec3 base = vec3(.16, .2, .34);                                // the calm grid: dim slate
    vec3 hot = mix(vec3(.2, .75, 1.), vec3(1., .96, .88), smoothstep(.4, 1., L));
    vec3 lc = mix(base, hot, smoothstep(.0, .5, L) * E + .0);
    lc = mix(lc, base * .5, smoothstep(0., -.7, L) * E);           // stretched lines fade
    vec3 col = bg + lc * (line * (.75 + .6 * max(L, 0.) * E) + major * .35);
    col += vec3(.05, .25, .4) * max(L, 0.) * E * .3;                // a faint sheen on the crests
    o = vec4(col, 1);
  }`;
  const sh = (t, s) => { const x = gl.createShader(t); gl.shaderSource(x, s); gl.compileShader(x); if (!gl.getShaderParameter(x, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(x)); return x; };
  const prog = gl.createProgram(); gl.attachShader(prog, sh(gl.VERTEX_SHADER, vs)); gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, fs)); gl.bindAttribLocation(prog, 0, 'p'); gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog));
  gl.useProgram(prog);
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer()); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  const U = {}; ['R', 'M', 'T', 'D', 'MA', 'u_cells', 'u_speed', 'u_depth', 'EV'].forEach(n => U[n] = gl.getUniformLocation(prog, n));
  let dpr = 1;
  const resize = () => { dpr = Math.min(devicePixelRatio, 2); canvas.width = (stage.clientWidth || 1) * dpr | 0; canvas.height = (stage.clientHeight || 1) * dpr | 0; gl.viewport(0, 0, canvas.width, canvas.height); };
  const ro = new ResizeObserver(resize); ro.observe(stage); resize();
  // the pointer, in shader space (units of stage height, origin at the centre, y up); an idle "ghost" takes over
  // when nobody is pointing, so the card is never static
  let tx = 0, ty = 0, mx = 0, my = 0, ma = 0, lastMove = -1e9, gt = 0;
  const toLocal = e => { const b = canvas.getBoundingClientRect(); return [(e.clientX - b.left - b.width / 2) / b.height, (b.height / 2 - (e.clientY - b.top)) / b.height]; };
  const onMove = e => { [tx, ty] = toLocal(e); lastMove = performance.now(); };
  const onLeave = () => { lastMove = -1e9; };
  const onDown = e => { onMove(e); spawn(tx, ty, 1.2); sx = tx; sy = ty; lastSpawn = performance.now(); };
  canvas.addEventListener('pointermove', onMove); canvas.addEventListener('pointerdown', onDown); canvas.addEventListener('pointerleave', onLeave);
  // ripples: a ring buffer of [x, y, birth time, strength]; a few are seeded so the first frame already has rings
  const ev = new Float32Array(4 * 8); let evi = 0, lastSpawn = -1e9, sx = 9, sy = 9, nextAuto = 0.9;
  const spawn = (x, y, s) => { ev.set([x, y, t, s], evi * 4); evi = (evi + 1) % 8; };
  for (const [x, y, a, s] of [[-0.35, 0.12, 1.6, 1], [0.42, -0.18, 0.9, 0.9], [0.05, 0.3, 0.35, 0.8]]) { ev.set([x, y, -a, s], evi * 4); evi++; }
  for (let i = evi; i < 8; i++) ev.set([0, 0, -99, 0], i * 4);
  let raf, t = 0, last = performance.now();
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    t += dt * PARAMS.speed * (reduce ? 0.05 : 1);
    const live = now - lastMove < 2500, asp = canvas.width / canvas.height;
    if (!reduce) gt += dt;
    if (!live) { tx = asp * 0.3 * Math.sin(gt * 0.41) + 0.06 * Math.sin(gt * 1.3); ty = 0.24 * Math.sin(gt * 0.67 + 1.2); }
    const k = 1 - Math.exp(-dt * (live ? 14 : 3));
    mx += (tx - mx) * k; my += (ty - my) * k; ma += ((live ? 1 : 0) - ma) * (1 - Math.exp(-dt * 4));
    // the pointer drops a ripple whenever it has travelled far enough; idle, the ghost drops them on its own beat
    if (live && Math.hypot(tx - sx, ty - sy) > 0.14 && now - lastSpawn > 220) { spawn(tx, ty, 0.55); sx = tx; sy = ty; lastSpawn = now; }
    if (!live && !reduce && t > nextAuto) { spawn(mx, my, 0.8); nextAuto = t + 1.25; }
    gl.uniform2f(U.R, canvas.width, canvas.height); gl.uniform1f(U.T, t); gl.uniform1f(U.D, dpr);
    gl.uniform2f(U.M, mx, my); gl.uniform1f(U.MA, ma);
    gl.uniform1f(U.u_cells, PARAMS.cells);
    gl.uniform1f(U.u_speed, PARAMS.speed);
    gl.uniform1f(U.u_depth, PARAMS.depth);
    gl.uniform4fv(U.EV, ev);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    raf = requestAnimationFrame(frame);
  }
  raf = requestAnimationFrame(frame);
  return () => { cancelAnimationFrame(raf); ro.disconnect(); canvas.removeEventListener('pointermove', onMove); canvas.removeEventListener('pointerdown', onDown); canvas.removeEventListener('pointerleave', onLeave); gl.getExtension('WEBGL_lose_context')?.loseContext(); canvas.remove(); };
}
