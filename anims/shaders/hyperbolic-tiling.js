// A hyperbolic tiling in the Poincaré disk, the model Escher used for his Circle Limit prints. Three seven-sided tiles
// meet at every corner, which cannot happen on a flat sheet, so in this map of the curved plane the tiles shrink toward
// the rim, which is infinitely far away. Each pixel is folded back into one small triangle by
// mirror reflections: rotate into a wedge, flip over its edge line, invert through the tile's curved side, repeat
// until it stops moving. The number of flips says which mirror image it was. The triangle holds one piece of a woven
// star pattern (Hankin's method: straps leave every edge midpoint at an angle and meet their neighbours), so the
// reflections build stars everywhere. The whole plane glides with a Möbius transformation, the hyperbolic version of
// sliding, by exactly one symmetry step per loop, so it streams toward the rim forever without a seam.
const PARAMS = { p: 7, q: 3, speed: 1 };

export default function (stage) {
  const canvas = document.createElement('canvas');
  canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block';
  stage.append(canvas);
  const gl = canvas.getContext('webgl2', { antialias: false });
  if (!gl) { stage.textContent = 'This needs WebGL2.'; return () => canvas.remove(); }
  const vs = `#version 300 es
  in vec2 p; void main() { gl_Position = vec4(p, 0, 1); }`;
  const fs = `#version 300 es
  precision highp float; out vec4 o;
  uniform vec2 R; uniform float T, PN, QN; uniform vec4 MA, MB, MC, MD;   // the Möbius map (a z + b) / (c z + d)
  const float PI = 3.14159265;
  vec2 cmul(vec2 a, vec2 b) { return vec2(a.x * b.x - a.y * b.y, a.x * b.y + a.y * b.x); }
  vec2 cdiv(vec2 a, vec2 b) { return vec2(a.x * b.x + a.y * b.y, a.y * b.x - a.x * b.y) / dot(b, b); }
  float seg(vec2 p, vec2 a, vec2 b) { vec2 pa = p - a, ba = b - a; return length(pa - ba * clamp(dot(pa, ba) / dot(ba, ba), 0., 1.)); }
  vec3 shade(vec2 z, float pxs) {
    // the Möbius glide; |dw/dz| tells how much it stretched this spot, for anti-aliasing later
    vec2 num = cmul(MA.xy, z) + MB.xy, den = cmul(MC.xy, z) + MD.xy;
    vec2 w = cdiv(num, den);
    float scale = length(cmul(MA.xy, MD.xy) - cmul(MB.xy, MC.xy)) / dot(den, den);
    float A = PI / PN, B = PI / QN;
    // the fundamental triangle: the real axis, the line at angle π/p, and a circle (a straight line in this geometry)
    float cx = 1. / sqrt(1. - pow(sin(A), 2.) / pow(cos(B), 2.)), cr = cx * sin(A) / cos(B);
    vec2 C = vec2(cx, 0), u = vec2(cos(A), sin(A));
    float flips = 0.;
    for (int i = 0; i < 80; i++) {
      float a = atan(w.y, w.x);
      float k = floor(a / (2. * A) + .0); a = k * 2. * A;               // rotate into the wedge [0, 2π/p)
      w = vec2(cos(a) * w.x + sin(a) * w.y, -sin(a) * w.x + cos(a) * w.y);
      if (w.y * u.x - w.x * u.y > 0.) { w = 2. * dot(w, u) * u - w; flips++; }   // above the π/p line: mirror it
      vec2 d = w - C; float d2 = dot(d, d);
      if (d2 >= cr * cr) break;
      w = C + d * cr * cr / d2; scale *= cr * cr / d2; flips++;   // inside the circle: invert through it
    }
    float px = pxs * scale;                                                 // one screen pixel, in triangle units
    float par = mod(flips, 2.);
    // the motif inside the triangle O-M-V (centre, edge midpoint, corner)
    float x0 = cx - cr;
    vec2 M = vec2(x0, 0), V = u * (cx * u.x - sqrt(cx * cx * u.x * u.x - 1.));
    vec2 P = V * .58;                                                       // where neighbouring straps meet
    vec2 dir = normalize(P - M);
    float side = dir.x * (w.y - M.y) - dir.y * (w.x - M.x);                 // >0: the star's side of the strap
    float rv = length(w - V), ro = length(w);
    vec3 star = par < .5 ? vec3(.93, .72, .32) : vec3(.66, .4, .14);         // a lit facet and a shaded facet: the stars look carved
    vec3 gap = par < .5 ? vec3(.07, .34, .38) : vec3(.04, .22, .27);
    vec3 col = mix(gap, star, smoothstep(-px, px, side));
    // a small rosette at every tile centre and a jewel at every corner
    float rc = x0 * .36;
    col = mix(col, par < .5 ? vec3(.62, .11, .14) : vec3(.45, .06, .1), smoothstep(px, -px, ro - rc));
    col = mix(col, vec3(.98, .86, .5), smoothstep(px, -px, ro - rc * .3));
    float rj = length(V - P) * .34;
    col = mix(col, par < .5 ? vec3(.1, .16, .42) : vec3(.06, .1, .3), smoothstep(px, -px, rv - rj));
    // straps: an ivory band with a dark edge and a rounded top, along the Hankin line and around the rosette
    float sw = x0 * .07, ow = x0 * .035;
    float ds = min(seg(w, M, P + dir * .002), abs(ro - rc));
    // at each edge midpoint two straps cross in an X. They weave: along a strand, crossings alternate over and under.
    // The strand on top is the one whose pixels took an even number of flips to get here, so all four arms agree
    vec2 d2d = normalize(vec2(M.x - P.x, P.y));
    float dx = seg(w, M - d2d * sw * 4., M + d2d * sw * 4.);
    bool over = par < .5;
    float first = over ? dx : ds, second = over ? ds : dx;
    float sh = sw * 1.6;                                    // a soft contact shadow: the straps sit above the tiles
    col *= 1. - .45 * smoothstep(sw + ow + sh, sw + ow, first);
    col = mix(col, vec3(.09, .06, .05), smoothstep(px, -px, first - sw - ow));
    col = mix(col, vec3(.97, .93, .83) * (1. - .3 * pow(first / sw, 2.)), smoothstep(px, -px, first - sw));
    col *= 1. - .5 * smoothstep(sw + ow + sh, sw + ow, second);
    col = mix(col, vec3(.09, .06, .05), smoothstep(px, -px, second - sw - ow));
    col = mix(col, vec3(1., .96, .86) * (1. - .3 * pow(second / sw, 2.)), smoothstep(px, -px, second - sw));
    col = mix(col, vec3(.09, .06, .05), smoothstep(px, -px, abs(rv - rj) - x0 * .02));
    // far toward the rim the tiles are smaller than a pixel: fade to their average colour instead of noise
    vec3 avg = vec3(.42, .38, .28);
    col = mix(col, avg, smoothstep(.1, .45, px / x0));
    return col;
  }
  void main() {
    float s = .5 * min(R.x, R.y) * .94;
    vec2 z = (gl_FragCoord.xy - .5 * R) / s;
    float r = length(z), pxs = 1. / s;
    vec3 bg = mix(vec3(.05, .05, .07), vec3(.1, .09, .1), smoothstep(1.6, .0, length((gl_FragCoord.xy - .5 * R) / R.y)));
    vec3 col = bg;
    if (r < 1. + 2. * pxs) {
      // 2 samples per pixel, offset diagonally: the near-rim detail stays clean
      vec3 c = shade(z + vec2(.25, .25) * pxs, pxs) + shade(z - vec2(.25, .25) * pxs, pxs);
      c *= .5;
      c *= 1. - .45 * smoothstep(.55, 1., r);                               // the rim is infinitely far: let it sink a little
      col = mix(col, c, smoothstep(1., 1. - 1.5 * pxs, r));
    }
    // a thin gold ring at the boundary circle
    col = mix(col, vec3(.85, .68, .33), smoothstep(2.2 * pxs, .4 * pxs, abs(r - 1. - 3. * pxs)));
    col += vec3(.9, .6, .25) * .06 * exp(-abs(r - 1.) * 18.) * step(1., r);
    o = vec4(pow(col, vec3(.95)), 1);
  }`;
  const sh = (t, s) => { const x = gl.createShader(t); gl.shaderSource(x, s); gl.compileShader(x); if (!gl.getShaderParameter(x, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(x)); return x; };
  const prog = gl.createProgram(); gl.attachShader(prog, sh(gl.VERTEX_SHADER, vs)); gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, fs)); gl.bindAttribLocation(prog, 0, 'p'); gl.linkProgram(prog); gl.useProgram(prog);
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer()); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  const U = {}; ['R', 'T', 'PN', 'QN', 'MA', 'MB', 'MC', 'MD'].forEach(n => U[n] = gl.getUniformLocation(prog, n));
  const resize = () => { const w = stage.clientWidth || 1, h = stage.clientHeight || 1, d = Math.min(devicePixelRatio, 2); canvas.width = w * d | 0; canvas.height = h * d | 0; gl.viewport(0, 0, canvas.width, canvas.height); };
  const ro = new ResizeObserver(resize); ro.observe(stage); resize();

  // ── complex numbers and Möbius maps as 2×2 complex matrices [a, b, c, d]
  const C = (re, im = 0) => [re, im], mul = (a, b) => [a[0] * b[0] - a[1] * b[1], a[0] * b[1] + a[1] * b[0]], add = (a, b) => [a[0] + b[0], a[1] + b[1]];
  const conj = a => [a[0], -a[1]], neg = a => [-a[0], -a[1]];
  const mm = (X, Y) => [add(mul(X[0], Y[0]), mul(X[1], Y[2])), add(mul(X[0], Y[1]), mul(X[1], Y[3])), add(mul(X[2], Y[0]), mul(X[3], Y[2])), add(mul(X[2], Y[1]), mul(X[3], Y[3]))];
  const inv = X => [X[3], neg(X[1]), neg(X[2]), X[0]];
  const apply = (X, z) => { const n = add(mul(X[0], z), X[1]), d = add(mul(X[2], z), X[3]), dd = d[0] * d[0] + d[1] * d[1]; return [(n[0] * d[0] + n[1] * d[1]) / dd, (n[1] * d[0] - n[0] * d[1]) / dd]; };
  const slide = s => { const t = Math.tanh(s / 2); return [C(1), C(t), C(t), C(1)]; };          // glide along the real axis by distance s
  const turn = a => [C(Math.cos(a / 2), Math.sin(a / 2)), C(0), C(0), C(Math.cos(a / 2), -Math.sin(a / 2))];
  const toOrigin = m => [C(1), neg(m), neg(conj(m)), C(1)];                                     // the map sending m to 0
  let key = '', V = null, D2 = 1, P = 7, Q = 3;
  function setup() {
    P = Math.max(3, Math.round(PARAMS.p)); Q = Math.max(3, Math.round(PARAMS.q));
    if (1 / P + 1 / Q >= 0.5) Q = Math.floor(2 * P / (P - 2)) + 1;      // only hyperbolic pairs fit in the disk
    key = PARAMS.p + ',' + PARAMS.q;
    const A = Math.PI / P, B = Math.PI / Q, cx = 1 / Math.sqrt(1 - Math.sin(A) ** 2 / Math.cos(B) ** 2), x0 = cx - cx * Math.sin(A) / Math.cos(B);
    // two edge midpoints of the central tile; a half-turn about each is a symmetry, and two half-turns make a glide
    const m0 = C(x0), j = Math.floor(P / 2), m1 = C(x0 * Math.cos(2 * A * j), x0 * Math.sin(2 * A * j));
    const Wm = toOrigin(m0), u = apply(Wm, m1), ang = Math.atan2(u[1], u[0]), D = 2 * Math.atanh(Math.hypot(u[0], u[1]));
    const W = mm(slide(-D / 2), mm(turn(-ang), Wm));    // m0→m1 now lies on the real axis, centred on the origin
    V = inv(W); D2 = 2 * D;                             // gliding 2D along it maps the tiling onto itself
  }
  let raf, s = 0, last = performance.now();
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    if (key !== PARAMS.p + ',' + PARAMS.q) setup();
    s = (s + dt * 0.11 * D2 * PARAMS.speed) % D2;
    const M = mm(V, mm(slide(s), turn(now / 1000 * 0.06)));
    gl.uniform2f(U.R, canvas.width, canvas.height); gl.uniform1f(U.T, now / 1000); gl.uniform1f(U.PN, P); gl.uniform1f(U.QN, Q);
    gl.uniform4f(U.MA, M[0][0], M[0][1], 0, 0); gl.uniform4f(U.MB, M[1][0], M[1][1], 0, 0); gl.uniform4f(U.MC, M[2][0], M[2][1], 0, 0); gl.uniform4f(U.MD, M[3][0], M[3][1], 0, 0);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    raf = requestAnimationFrame(frame);
  }
  raf = requestAnimationFrame(frame);
  return () => { cancelAnimationFrame(raf); ro.disconnect(); gl.getExtension('WEBGL_lose_context')?.loseContext(); canvas.remove(); };
}
