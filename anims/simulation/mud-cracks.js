// Mud cracks: a flat of wet clay dries under a low sun and tears into curled plates, then rain closes it up and it
// begins again. Wet mud is dark and glossy; it dries unevenly, edges and high spots first, and as the drying front
// passes it pales to a grey-tan crust and tears. Clay shrinks the same way in every direction, so it breaks into
// plates of a fairly even size whose cracks meet in Y-junctions; later, smaller cracks run in from those first cracks
// and stop against them in T-junctions, splitting the big plates; last, a fine crazing appears on the driest tops.
// Each crack opens from its middle and runs out to the junctions, and keeps widening as the clay shrinks. Each plate
// curls up at its rim. The sun is low, from the upper left: rims and crack walls that face it light up, the walls
// that face away go dark, and the lifted rims throw hard shadows into the cracks, so cracks that run across the light
// are black and cracks that run along it show their pale silt floor. Then rain falls drop by drop, darkening the
// clay and pitting it with small craters; the plates soak and the cracks close, and the next drying starts on a new
// pattern, the raindrop pits still printed in it. Press and drag to wet a patch: its cracks close, and open as it dries.
// WebGL2, one fragment shader, no textures but a small moisture map. The crack network is a noise-warped Voronoi
// diagram measured as the exact distance to the nearest cell wall (so its edges are smooth at any size); each cell
// then splits into two or three by the walls between a few seeds of its own, which end where they meet the cell's
// walls. A crack is open where the local moisture has fallen below its threshold (later toward its ends, later for
// the small cracks, later still the farther they reach into a plate), and its width grows with the dryness. The
// plate height rises toward each open crack (the curl); its slope, a fine grain and the V-shaped crack walls are lit
// by the low sun, and a crack floor is in shadow when the rim on its sunward side stands taller than the sun's ray.
const PARAMS = { spacing: 1, speed: 1, curl: 1 };

export default function (stage) {
  const canvas = document.createElement('canvas');
  canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block;touch-action:none;background:#3a3129';
  stage.append(canvas);
  const gl = canvas.getContext('webgl2', { antialias: false, alpha: false });
  if (!gl) { stage.textContent = 'This needs WebGL2.'; return () => canvas.remove(); }
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  const vs = `#version 300 es
  in vec2 p; void main() { gl_Position = vec4(p, 0, 1); }`;
  const fs = `#version 300 es
  precision highp float; out vec4 o;
  uniform vec2 R, OFF, ROFF, MOS; uniform float DPR, S, CURL, RT, IMP; uniform sampler2D MO;
  vec2 h22(vec2 p) { vec3 q = fract(vec3(p.xyx) * vec3(.1031, .103, .0973)); q += dot(q, q.yzx + 33.33); return fract((q.xx + q.yz) * q.zy); }
  float h12(vec2 p) { return h22(p).x; }
  // value noise with its derivative (a cheap arithmetic hash is plenty here)
  float hq(vec2 p) { vec3 q = fract(vec3(p.xyx) * .1031); q += dot(q, q.yzx + 33.33); return fract((q.x + q.y) * q.z); }
  vec3 nd(vec2 x) { vec2 i = floor(x), f = fract(x), u = f * f * (3. - 2. * f), du = 6. * f * (1. - f);
    float a = hq(i), b = hq(i + vec2(1, 0)), c = hq(i + vec2(0, 1)), d = hq(i + 1.);
    return vec3(a + (b - a) * u.x + (c - a) * u.y + (a - b - c + d) * u.x * u.y, du * (vec2(b - a, c - a) + (a - b - c + d) * u.yx)); }
  vec2 jit(vec2 c) { return .5 + (h22(c + OFF) - .5) * .78; }
  vec3 lin(vec3 c) { return c * c; }

  // the first cracks: distance to the nearest Voronoi wall (cell units), the normal into this cell, the wall's id
  // hash, how far along the wall from its middle, and this cell
  float dP, dP2, ehP, alP; vec2 nP, cellA, seedA;
  void primary(vec2 x) {
    vec2 n = floor(x), f = fract(x), mr = vec2(0), mg = vec2(0), mb = vec2(1, 0), bg = vec2(1, 0); float md = 8., md2 = 8.;
    for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++) { vec2 g = vec2(i, j), r = g + jit(n + g) - f; float d = dot(r, r); if (d < md) { md = d; mr = r; mg = g; } }
    md = 8.;
    for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++) { vec2 g = mg + vec2(i, j), r = g + jit(n + g) - f, dr = r - mr;   // 3x3 is enough: seeds keep to the middle of their cells
      if (dot(dr, dr) > 1e-5) { float d = dot(.5 * (mr + r), normalize(dr)); if (d < md) { md2 = md; md = d; mb = r; bg = g; } else if (d < md2) md2 = d; } }
    vec2 e = normalize(mb - mr), A = n + mg, B = n + bg, mid = .5 * (mr + mb);
    dP = md; dP2 = md2; nP = -e; alP = abs(dot(mid, vec2(-e.y, e.x)));
    ehP = h12(vec2(A.x + B.x + 211. * abs(A.y - B.y), A.y + B.y + 157. * abs(A.x - B.x)) + OFF * 1.7);
    cellA = A; seedA = x + mr;
  }
  // the later cracks: walls between two or three seeds of this cell only, so they stop at its walls
  float d2, eh2; vec2 n2;
  void secondary(vec2 x) {
    float hk = h12(cellA * 1.31 + OFF + 71.); int k = hk < .2 ? 1 : hk < .72 ? 2 : 3;
    vec2 s[3]; for (int j = 0; j < 3; j++) s[j] = seedA + (h22(cellA * 3.1 + float(j) * 17.3 + OFF + 5.) - .5) * .9;
    int a = 0; float best = 9.;
    for (int j = 0; j < 3; j++) if (j < k) { float d = dot(s[j] - x, s[j] - x); if (d < best) { best = d; a = j; } }
    d2 = 9.; n2 = vec2(0, 1); eh2 = 0.;
    for (int b = 0; b < 3; b++) if (b < k && b != a) {
      vec2 ra = s[a] - x, rb = s[b] - x, e = normalize(rb - ra); float d = dot(.5 * (ra + rb), e);
      if (d < d2) { d2 = d; n2 = -e; eh2 = h12(cellA * 5.3 + float(a + b) * 13.1 + OFF + 3.); }
    }
  }
  // the finest crazing on the driest tops: a plain F2 - F1 network
  float craze(vec2 x) {
    vec2 n = floor(x), f = fract(x); float f1 = 8., f2 = 8.;
    for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++) { vec2 g = vec2(i, j), r = g + .5 + (h22(n + g + OFF * 2.3) - .5) * .9 - f; float d = dot(r, r);
      if (d < f1) { f2 = f1; f1 = d; } else if (d < f2) f2 = d; }
    return sqrt(f2) - sqrt(f1);
  }
  // raindrops: one per cell per layer, landing at a hashed time; returns the wet darkening and the pit's slope
  vec3 drops(vec2 p, float C, vec2 salt) {
    vec2 c = floor(p / C), hh = h22(c + ROFF + salt); vec2 pos = (c + .22 + .56 * hh) * C;
    float r = 1.8 + 3.4 * h12(c + ROFF + salt + 3.), tl = h12(c + ROFF + salt + 7.) * 5.2, age = (RT > 0. ? RT : 9.) - tl;
    if (age < 0. || h12(c + ROFF + salt + 11.) > .7) return vec3(0);
    vec2 q = p - pos; float d = length(q);
    float spot = smoothstep(r * 1.9, r * .9, d) * clamp(age * 5., 0., 1.);
    // a crater: a bowl with a low raised lip
    float u = d / r, s = u < 1. ? 2. * u / r * .9 : (u < 1.5 ? -(1.5 - u) / r * 1.6 : 0.);
    return vec3(spot, (d > 1e-4 ? q / d : vec2(0)) * s);
  }

  // inset from a plate's edge, with its corner between two walls rounded off
  float rmin(float a, float b, float r) { return (a < r && b < r) ? r - length(vec2(r) - vec2(a, b)) : min(a, b); }
  void main() {
    vec2 p = vec2(gl_FragCoord.x, R.y - gl_FragCoord.y) / DPR;           // CSS px, y down
    // moisture: 1 soaked, 0 just dry, < 0 shrinking; read from the coarse map with a smoothed lookup, so no blocks
    vec2 mc = p / MOS * vec2(textureSize(MO, 0)) + .5, mi = floor(mc), mf = fract(mc); mf = mf * mf * (3. - 2. * mf);
    float m = texture(MO, (mi + mf - .5) / vec2(textureSize(MO, 0))).r * 2.5 - 1.5;
    // warp the point so the walls wander and bow, plus a fine jag
    vec3 w1 = nd(p / (S * .8) + OFF * .37), w2 = nd(p / (S * .8) + 31.7 + OFF * .29);
    vec3 w3 = nd(p / (S * .3) + 5.1 + OFF * .41), w4 = nd(p / (S * .3) + 47.3 + OFF * .23);
    vec3 j1 = nd(p / 4.5), j2 = nd(p / 4.5 + 9.3);
    vec2 q = p + S * .26 * (vec2(w1.x, w2.x) - .5) + S * .07 * (vec2(w3.x, w4.x) - .5) + 1.7 * (vec2(j1.x, j2.x) - .5);
    vec2 x = q / S;
    primary(x);
    secondary(x + .06 * vec2(w3.x - w4.x, w3.x + w4.x - 1.));
    float DP = dP * S, DP2 = dP2 * S, D2 = d2 * S;
    // when each crack is open, and how wide
    float aN = clamp(alP / .55, 0., 1.);
    float oP = clamp((.34 - .3 * ehP - .42 * aN * aN - m) / .75, 0., 1.); oP = 1. - (1. - oP) * (1. - oP);
    float o2 = clamp((.02 - .42 * eh2 - 1.25 * min(dP, .5) - m) / .6, 0., 1.); o2 = 1. - (1. - o2) * (1. - o2);
    float hwP = oP * S * .048 * (.6 + .5 * ehP) * (.75 + .5 * w2.x);
    float hw2 = o2 * S * .03 * (.55 + .6 * eh2) * (.75 + .5 * w1.x);
    // inset from each crack's lip; plate corners round off as they shrink, so the junctions open into pits
    float eP = rmin(DP - hwP, DP2 - hwP, S * .05 * oP + .5), e2 = D2 - hw2;
    float E = rmin(eP, e2, S * .035 * o2 + .5);
    // the curl: the plate rises toward each open crack
    float RcP = S * .16, Rc2 = S * .11, LP = CURL * oP * S * .06, L2 = CURL * o2 * S * .04;
    float lP = LP * exp(-max(eP, 0.) / RcP), l2 = L2 * exp(-max(e2, 0.) / Rc2);
    vec2 gh = -(lP / RcP) * nP - (l2 / Rc2) * n2;
    // surface: blotchy drying front, rims dry first
    vec3 mt = vec3(w1.x * .6 + w4.x * .4), mt2 = nd(p / 17. + 11.);
    float ml = m + .16 * (w1.x - .5) + .08 * (mt2.x - .5) + .07 * (j1.x - .5) - .3 * oP * exp(-max(eP, 0.) / (S * .2)) - .2 * o2 * exp(-max(e2, 0.) / (S * .14));
    float wet = smoothstep(.12, .62, ml), damp = smoothstep(-.42, .12, ml);
    // raindrops falling now, and the pits left by the last rain
    vec3 dr = vec3(0);
    if (RT > 0. || IMP > 0.) dr = drops(p, 21., vec2(0));
    float rainNow = RT > 0. ? 1. : 0.;
    wet = max(wet, dr.x * rainNow * .75);
    // grain: fine silt bumps that a raking sun picks out; wet mud is smoother
    vec3 g1 = vec3(hq(floor(p * 1.3)), hq(floor(p * 1.3) + 7.) - .5, hq(floor(p * 1.3) + 3.) - .5), g2 = nd(p / 5.5 + 4.), g3 = nd(p / 16. + 8.);
    vec2 gg = (g1.yz * .18 + g2.yz / 5.5 * 1. + g3.yz / 16. * 1.8) * mix(1., .3, wet);
    gg += dr.yz * (rainNow + IMP) * .8;
    vec3 N = normalize(vec3(-(gh + gg), 1.));
    const vec2 Lh = vec2(-.74, -.67); const float el = .44;                 // toward the sun, upper left; about 25 degrees up
    vec3 L = normalize(vec3(Lh * cos(el), sin(el))); float tanE = tan(el);
    vec3 sun = vec3(1., .9, .76) * 2.35, sky = vec3(.55, .58, .64) * .62;
    // albedo: pale grey-tan crust, darker damp clay, dark wet mud; mottling and a little salt bloom on the dry tops
    vec3 dry = lin(vec3(.75, .68, .58)) * (.84 + .24 * mt.x + .08 * mt2.x);
    dry = mix(dry, lin(vec3(.86, .83, .78)), smoothstep(.62, .8, mt.x * .7 + g3.x * .3) * .5 * (1. - damp));
    vec3 alb = mix(dry, lin(vec3(.47, .4, .33)), damp);
    alb = mix(alb, lin(vec3(.27, .2, .14)), wet);
    float czk = smoothstep(-.5, -1.2, m) * smoothstep(.45, .7, mt2.x) * (1. - wet) * smoothstep(0., 6., E);
    if (czk > 0.) alb *= 1. - .32 * smoothstep(.045, .0, craze(x * 5.2 + .03 * vec2(j1.x, j2.x))) * czk;
    // shadow on the plate from a lifted rim between it and the sun
    float sh = 1.;
    { float c = dot(Lh, nP), t = c > 0. ? max(eP, 0.) / max(c, 1e-3) : (max(eP, 0.) + 2. * hwP) / max(-c, 1e-3);
      sh = min(sh, mix(1., smoothstep(-1.2, 1.2, t * tanE - (LP - lP) * 1.2), smoothstep(.3, 2., LP))); }
    { float c = dot(Lh, n2), t = c > 0. ? max(e2, 0.) / max(c, 1e-3) : (max(e2, 0.) + 2. * hw2) / max(-c, 1e-3);
      sh = min(sh, mix(1., smoothstep(-1.2, 1.2, t * tanE - (L2 - l2) * 1.2), smoothstep(.3, 2., L2))); }
    float dif = max(dot(N, L), 0.);
    vec3 col = alb * (sun * dif * sh + sky * (.55 + .45 * N.z));
    // wet mud holds the sky: a soft sheen and glints off the grain
    vec3 rf = reflect(vec3(0, 0, -1), N);
    float gl1 = pow(max(dot(rf, normalize(vec3(-Lh * .55, .83))), 0.), 30.);
    col += wet * (vec3(.5, .45, .4) * (.012 + .025 * smoothstep(.3, .9, ml)) + vec3(1., .93, .84) * gl1 * .45) * (.6 + .4 * sh);
    // a raindrop's splash: a brief bright ring
    if (RT > 0.) { vec2 c = floor(p / 21.); float tl = h12(c + ROFF + 7.) * 5.2, a = RT - tl;
      if (a > 0. && a < .2 && h12(c + ROFF + 11.) < .7) { vec2 pos = (c + .22 + .56 * h22(c + ROFF)) * 21.; float rr = (1.8 + 3.4 * h12(c + ROFF + 3.)) * (1. + a * 9.);
        col += vec3(.5, .52, .55) * (1. - a / .2) * smoothstep(1.2, 0., abs(length(p - pos) - rr)); } }

    // the cracks: V-shaped, walls lit or dark by which way they face, the floor in the rim's shadow or not
    bool sec = e2 < eP;
    float hw = sec ? hw2 : hwP, L0 = sec ? L2 : LP; vec2 n = sec ? n2 : nP;
    float aa = .75 / DPR + .3, hwv = max(hw, .5);
    float cover = smoothstep(aa, -aa, E) * clamp(hw * 2.2, 0., 1.);
    if (cover > 0.) {
      float u = clamp(1. + E / hwv, 0., 1.), Dp = hw * .75 + 1.5 + L0 * .35;   // a thin crust; a curled rim stands higher over the floor
      float z = Dp * clamp((1. - u) / .55, 0., 1.);                       // depth below the rim here: the walls slope in
      float c = dot(Lh, n), t = c > 0. ? max(-E, 0.) / max(c, 1e-3) : max(2. * hwv + E, 0.) / max(-c, 1e-3);
      float lit = smoothstep(-.8 - t * .12, .8 + t * .12, t * tanE - z);   // both rims stand about as high
      bool wall = u > .45;
      vec3 Nw = wall ? normalize(vec3(-n * (1.1 + .6 * u), 1.)) : vec3(0, 0, 1);
      float ao = mix(.25, 1., smoothstep(1., 10., hw)) * mix(.6, 1., u) * (.8 + .2 * smoothstep(0., hwv, t * abs(c)));
      vec3 silt = lin(vec3(.68, .62, .52)) * (.7 + .6 * g2.x) * (.85 + .3 * g1.x);
      vec3 cc = wall ? mix(alb, lin(vec3(.52, .45, .37)), .5) : silt;
      vec3 gcol = cc * (sun * max(dot(Nw, L), 0.) * lit + sky * .45 + vec3(.2, .15, .1) * .25) * ao;   // skylight and light bounced off the plates
      gcol *= mix(1., .35, wet);
      col = mix(col, gcol, cover);
    }
    // a hint of falloff toward the corners, and the tone curve
    vec2 v = gl_FragCoord.xy / R - .5; col *= 1. - .28 * dot(v, v);
    col = col / (1. + col * .62) * 1.25;
    o = vec4(sqrt(max(col, 0.)), 1);
  }`;
  const sh = (t, s) => { const x = gl.createShader(t); gl.shaderSource(x, s); gl.compileShader(x); if (!gl.getShaderParameter(x, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(x)); return x; };
  const vsh = sh(gl.VERTEX_SHADER, vs), fsh = sh(gl.FRAGMENT_SHADER, fs);
  const prog = gl.createProgram(); gl.attachShader(prog, vsh); gl.attachShader(prog, fsh); gl.bindAttribLocation(prog, 0, 'p'); gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog));
  gl.useProgram(prog);
  const buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const vao = gl.createVertexArray(); gl.bindVertexArray(vao); gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  const U = {}; for (const k of ['R', 'OFF', 'ROFF', 'MOS', 'DPR', 'S', 'CURL', 'RT', 'IMP', 'MO']) U[k] = gl.getUniformLocation(prog, k);
  const tex = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);

  // ── the moisture map: one cell per 8 CSS px, moisture from 1 (soaked) down to -1.5 (long dry, still shrinking)
  const CELL = 8, DRY = 0.095;
  let w = 1, h = 1, dpr = 1, MW = 1, MH = 1, moist = new Float32Array(1), rate = new Float32Array(1), bytes = new Uint8Array(1);
  let T = 0, phase = 'dry', phaseT = 0, cycle = 0, imp = 0, rainSalt = 0;
  const hash = (x, y, s) => { const k = Math.sin(x * 127.1 + y * 311.7 + s * 74.7) * 43758.5453; return k - Math.floor(k); };
  const vn = (x, y, s) => { const xi = Math.floor(x), yi = Math.floor(y), fx = x - xi, fy = y - yi, u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy);
    return (hash(xi, yi, s) * (1 - u) + hash(xi + 1, yi, s) * u) * (1 - v) + (hash(xi, yi + 1, s) * (1 - u) + hash(xi + 1, yi + 1, s) * u) * v; };
  function newCycle() {
    // a fresh flat of mud: soaked, with spots that will dry faster (the margins and the high ground)
    phase = 'dry'; phaseT = 0; const s = cycle * 1.37 + 0.5;
    for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++) {
      const e = Math.min(x, MW - 1 - x, y, MH - 1 - y) / Math.max(MW, MH);
      rate[y * MW + x] = 0.85 + vn(x / 16, y / 16, s) * 0.65 + vn(x / 5 + 3, y / 5, s) * 0.18 - e * 0.5;
      moist[y * MW + x] = 0.85;
    }
  }
  function sim(dt) {
    T += dt; phaseT += dt;
    if (phase === 'dry') {
      const k = dt * DRY * PARAMS.speed;
      for (let i = 0; i < moist.length; i++) moist[i] = Math.max(-1.5, moist[i] - k * rate[i]);
      imp = Math.max(0.35 * (imp > 0 ? 1 : 0), imp - dt * 0.04);
      if (phaseT > 26 / PARAMS.speed) { phase = 'hold'; phaseT = 0; }
    } else if (phase === 'hold') {
      if (phaseT > 4) { phase = 'rain'; phaseT = 0; rainSalt = (cycle * 53 + 17) % 997; }
    } else if (phase === 'rain') {
      // the flat soaks: slowly at first while the drops land, then all at once
      for (let i = 0; i < moist.length; i++) moist[i] = Math.min(1, moist[i] + dt * (0.08 + phaseT * phaseT * 0.05) * (0.8 + rate[i] * 0.2));
      if (phaseT > 6.5) { cycle++; imp = 0.9; newCycle(); }
    }
  }
  function resize() {
    // up to 2x, but no more than about 2.6 million pixels: the shader is the whole cost, and past that the grain is
    // already finer than the eye resolves
    w = stage.clientWidth || 1; h = stage.clientHeight || 1; dpr = Math.min(devicePixelRatio || 1, 2, Math.sqrt(2.6e6 / (w * h)));
    canvas.width = Math.max(1, Math.round(w * dpr)); canvas.height = Math.max(1, Math.round(h * dpr));
    MW = Math.ceil(w / CELL) + 1; MH = Math.ceil(h / CELL) + 1;
    moist = new Float32Array(MW * MH); rate = new Float32Array(MW * MH); bytes = new Uint8Array(MW * MH);
    // start over and run the clock up to where it was, so a resize keeps the moment (and posters stay exact)
    const t = T; T = 0; cycle = 0; imp = 0; rainSalt = 0; newCycle();
    for (let s = 0; s < t - 1e-6; s += 1 / 30) sim(Math.min(1 / 30, t - s));
    draw();
  }
  function draw() {
    for (let i = 0; i < moist.length; i++) bytes[i] = Math.max(0, Math.min(255, Math.round((moist[i] + 1.5) / 2.5 * 255)));
    gl.bindTexture(gl.TEXTURE_2D, tex); gl.texImage2D(gl.TEXTURE_2D, 0, gl.R8, MW, MH, 0, gl.RED, gl.UNSIGNED_BYTE, bytes);
    gl.viewport(0, 0, canvas.width, canvas.height);
    const S = 150 * PARAMS.spacing * Math.min(1.12, Math.max(0.62, Math.sqrt(w * h / (1280 * 720))));
    const off = (cycle * 373) % 997, offY = (cycle * 719) % 991;
    gl.uniform2f(U.R, canvas.width, canvas.height); gl.uniform1f(U.DPR, canvas.width / w); gl.uniform1f(U.S, S); gl.uniform1f(U.CURL, PARAMS.curl);
    gl.uniform2f(U.OFF, off, offY); gl.uniform2f(U.MOS, MW * CELL, MH * CELL); gl.uniform1i(U.MO, 0);
    const raining = phase === 'rain';
    gl.uniform2f(U.ROFF, rainSalt, (rainSalt * 61) % 89);   // the drops of this rain, or the pits of the last one
    gl.uniform1f(U.RT, raining ? phaseT : -1); gl.uniform1f(U.IMP, raining ? 0 : imp);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  // ── pointer: press and drag to wet a patch (a tap wets a spot)
  let down = false;
  const wetAt = e => { const b = canvas.getBoundingClientRect(), x = e.clientX - b.left, y = e.clientY - b.top, Rr = 60;
    for (let my = Math.max(0, ((y - Rr) / CELL) | 0); my <= Math.min(MH - 1, ((y + Rr) / CELL) | 0); my++) for (let mx = Math.max(0, ((x - Rr) / CELL) | 0); mx <= Math.min(MW - 1, ((x + Rr) / CELL) | 0); mx++) {
      const d = Math.hypot(mx * CELL - x, my * CELL - y); if (d < Rr) { const i = my * MW + mx, f = 1 - d / Rr, k = f * f * (3 - 2 * f); moist[i] = Math.max(moist[i], moist[i] + (1 - moist[i]) * k * 0.45, -0.6 + 1.55 * k); } }
    if (phase === 'hold') { phase = 'dry'; phaseT = 0; }
    if (reduce) draw(); };
  const onDown = e => { down = true; canvas.setPointerCapture?.(e.pointerId); wetAt(e); };
  const onMove = e => { if (down) wetAt(e); };
  const onUp = () => { down = false; };
  canvas.addEventListener('pointerdown', onDown); canvas.addEventListener('pointermove', onMove); canvas.addEventListener('pointerup', onUp); canvas.addEventListener('pointercancel', onUp);

  // reduced motion: a still of the flat well into its drying
  if (reduce) T = 21;
  const ro = new ResizeObserver(resize); ro.observe(stage);
  let raf = 0, last = performance.now();
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    sim(dt); draw();
    raf = requestAnimationFrame(frame);
  }
  if (!reduce) raf = requestAnimationFrame(frame);
  return () => {
    cancelAnimationFrame(raf); ro.disconnect();
    canvas.removeEventListener('pointerdown', onDown); canvas.removeEventListener('pointermove', onMove); canvas.removeEventListener('pointerup', onUp); canvas.removeEventListener('pointercancel', onUp);
    gl.deleteTexture(tex); gl.deleteBuffer(buf); gl.deleteVertexArray(vao); gl.deleteProgram(prog); gl.deleteShader(vsh); gl.deleteShader(fsh);
    gl.getExtension('WEBGL_lose_context')?.loseContext(); canvas.remove();
  };
}
