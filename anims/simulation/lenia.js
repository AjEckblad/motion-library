// Lenia: a drop of water under a fluorescence microscope, and the creatures in it are not animals at all but Bert
// Chan's Lenia, a cellular automaton with continuous space, state and time. Every cell holds a value from 0 to 1.
// Each step, every cell takes a weighted average of its neighbourhood through a soft ring-shaped kernel (radius 20
// cells, about 1,250 neighbours), and a growth function, a narrow bump around a target density, turns that average
// into growth or decay; the cell moves a small step that way. Nothing else is programmed in, yet the right numbers
// grow organisms that hold their shape, glide, rotate, and heal when cut. They are seeded from Chan's published
// catalogue: Orbium (the crescent glider), Kronium, the six-toothed Hexadentium that turns on the spot and the
// five-armed Asterium. Each species lives in its own colour channel with its own kernel rings and growth numbers,
// all four computed in one GPU pass (the kernel is round, so a quarter of it is stored and each weight serves four
// neighbours). The channels are four focal planes in the drop: creatures of different species drift over one
// another, while the same species collide, merge or die. The slide drifts slowly. A census runs on the GPU a few
// times a second from 16-cell block sums: a species that runs short is reseeded out of view, and a region holding
// more than three and a half creatures' worth (a soup boiling over) is eaten away, so the drop never empties or
// fills with noise. Each dye glows by how much creature is there, membranes glow where the field is steep, the
// growing front of each creature glows brighter than its fading wake, and the out-of-focus planes melt into soft
// halos (B-splines on coarser mip levels). Move the pointer up and down to rack the focus; drag across a creature to
// wound it: a light wound heals over in seconds.
const PARAMS = { speed: 1, population: 1, glow: 1 };

const SPECIES = [
  { name: 'Orbium unicaudatus', R: 13, b: [1], m: 0.15, s: 0.015, rle: '7.MD6.qL$6.pKqEqFURpApBRAqQ$5.VqTrSsBrOpXpWpTpWpUpCrQ$4.CQrQsTsWsApITNPpGqGvL$3.IpIpWrOsGsBqXpJ4.LsFrL$A.DpKpSpJpDqOqUqSqE5.ExD$qL.pBpTT2.qCrGrVrWqM5.sTpP$.pGpWpD3.qUsMtItQtJ6.tL$.uFqGH3.pXtOuR2vFsK5.sM$.tUqL4.GuNwAwVxBwNpC4.qXpA$2.uH5.vBxGyEyMyHtW4.qIpL$2.wV5.tIyG3yOxQqW2.FqHpJ$2.tUS4.rM2yOyJyOyHtVpPMpFqNV$2.HsR4.pUxAyOxLxDxEuVrMqBqGqKJ$3.sLpE3.pEuNxHwRwGvUuLsHrCqTpR$3.TrMS2.pFsLvDvPvEuPtNsGrGqIP$4.pRqRpNpFpTrNtGtVtStGsMrNqNpF$5.pMqKqLqRrIsCsLsIrTrFqJpHE$6.RpSqJqPqVqWqRqKpRXE$8.OpBpIpJpFTK!' },
  { name: 'Kronium solidus', R: 18, b: [1, 1/3], m: 0.24, s: 0.029, rle: '9.GL2OGB$6.BpPrIsM2tDsPrVqTpPO$5.pKsRvRyD4yOxHvRtVrVpUE$4.qEuS10yOwFtLqRJ$3.OuF6yOyL5yOxHuCqTE$3.sFyG3yOxEuCtDtTvJxHyL3yOxHtQpX$2.pPwX3yOsC3.BqHtBvWyG3yOwIsFO$2.uP3yO7.pIsMvRyG2yOyLuFpS$.qMyI2yO9.pPtBwN3yOvWrA$.vGyOwN4.qJsHrQqEB2.qTuNyB2yOxCrSB$pPxMyOpN3.yLwSqMpUrIrA2.TsUxC2yOxRsFG$sHyGvEJ2.xWxC3.GrXL2.rQwL2yOxRsCE$sUxEtVJ.tVuXpN4.sPO2.qWwN2yOxErN$rIvRuFpFrIqRsHpU3.pDtT3.rAxP2yOvWqM$pItTuUwFqMrAsFrQpD2.yBqE3.tG3yOuApF$.tVyGwFvMtBrVrXsHtQyOsK3.ByG2yOxUrQB$.sWtVyLyOvBqTpFvJwDpD4.yB3yOuCpF$2.tBxCyOvJpDqWqM5.4yOwAqE$2.qTuUwVuAsRTB.BLsW4yOwLqM$3.rGsHvWuAsUsCsPuI4yOxHuNpX$4.2sCuIvMwSyLyOyLxWvWtJqOB$6.qJsKuKuStTsHpP$7.B!' },
  { name: 'Hexadentium rotans', R: 18, b: [1, 3/4], m: 0.27, s: 0.039, rle: '11.JtByOyDwNtTqE$9.EtO4yOyDwDsUO$8.VuU6yOyLwVtQpD2.EpIqJqCG$7.GsMyL9yOxWuUrGpUsUvTxUxPtG$7.pFtLyL19yOO$7.VsW4yOyIwFsWpPErI11yO$7.qM6yOwIrI3.qCxM9yOxW$6.rG7yOxMsF3.JuF4yOyL4yOxMrN$2.2pSqHtJyG7yOyItG3.GtT4yOxPxR3yOwNsW$2.tTuFvWyL2yOvEtLuUyD2yOyLtJ3.LuI3yOyBvMuU3yOvJqR$.wQxHxW3yOrL2.pArVvTxUtB4.BsW2yOyGvMrVqEwD2yOuNG$.yL4yOuI4.BpD8.sCxHuSqT2.pA2yOuP$tQ4yOyBqW21.2yOwA$xP4yOwStVrIO18.O2yOyI$yL4yOyDxPwSvErQ16.ErG3yOqEG$xC8yOxE15.pNsFwN3yOvWrGpA$uK9yO14.qOwA6yOvRsF$rLxE7yOvB14.uI8yOwDL$VsPuN4yOxPuAqJ14.vE9yOpN$.pAqC3yOxErIQ15.tLxCyDyI2yL4yOqC$3.wA2yOsMB17.rAtOvEwLyD4yOpK$3.sW2yOpX20.qJuN5yO$3.rQ2yOsK3.pKtD16.wV5yO$3.rQyByOxU2.rDvRyGyOsM6.qCsPqEB3.sP3yOyIyDqO$2.EsMxP2yOsPsHvTyI2yOxJpX4.wV2yOwLrXpNpDrV2yOyLwVvTvM$2.qEtVxU2yOxJwIyB3yOxEpX3.qWxP4yOxE3yOyDuNsCrQ$3.vMyG3yOyI4yOwSpP3.qJwX7yOyDrX$3.wN9yOyLqR3.pIvOyL6yOqE$4.10yOvJpD2.pKuPxW5yOrA$4.pA11yOxPtVuIwIyD4yOvGqMB$5.OwX3yOwNwQ13yOwAqO$7.qRuCuKsMpUBpAsUvWyB8yOuCO$9.JL4.pFtBwIyI5yOuXO$16.pNtGwLyG3yOrG$17.pU2rSqC!' },
  { name: 'Asterium solidus', R: 27, b: [1, 1/2, 1], m: 0.27, s: 0.037, rle: '23.BQpAVOE$20.BJpKrDsRtJtBsFqTpKG$6.OpFpKpALB2.BLpDpUqJqWrGsFuIxC3yOxUvRtGqTQ$4.pIrQtJuAtOsKrDqHqCqRsCtVvMwQxCxExH8yOyGuPrIT$2.ErDuXxU2yOyBwNvGuXvWyG17yOuSqWJ$2.rQwS28yOtLpN$.qEwL29yOwAqRB$.tO2xWyG27yOyDrNE$.uSvEvOxH19yOxUxExW6yOsHJ$.qTrAsWxC4yOwLvWxE11yOxJuNuIwN6yOtGT$3.rIxW3yOtLpXrIvT4yOxPwIwAwNxHxPwXsUqErQwA6yOvBqC$3.rNyL2yOuI2.TxU3yOwLrLpFpKqWsWuIrX2.qTwS6yOyGsFJ$3.sW3yO3.rV4yOL5.pS3.rVxP7yOvGpP$3.uK2yOtO3.4yOtO10.tDxE8yOrS$3.vR2yOqC2.tO4yO7.pPqEG.sCvBxR7yOuIQ$3.wQ2yOqM2.4yOwL5.TtTwSuCT2.qWuXyD6yOxEqC$2.BxH2yOqW.vTyG3yOqH4.rN3yOxRT3.qWwF7yOrQB$2.pNxM2yOqE.uCwDxHxUuU3.pFuS5yOL4.uAyL6yOtLpA$2.qExP2yOOJpSrStBtO3.qWxC6yOG4.sPyL6yOvOqOL$2.qMxR2yO8.qCxW7yOB4.tQ7yOyDsWqHL$2.qOxUyOxJ8.vM7yOwXB4.9yOwDtDqJE$2.rAyDyOwIB6.qJ8yOuUB3.wI3yOyLxU5yOwNtBpI$2.rVyLyOwSQ3.VpIpD9yOtGE2.rI4yOvEuSxP5yOvWrA$2.tO2yOyIqMOpKsRvBuUxJyOyBxCxJyI4yOrL2.qM4yOwXpFqRwD6yOsPE$2.wL3yOtTsPwL4yOyDtOrXtGvTyD2yOwNB2.yL4yO3.vT6yOtQJ$.qT4yOyB5yOyLqM3.sHwV2yOpS2.ExU3yOtT3.yD6yOuCJ$.wN9yOxWpN4.pAwIyOvT3.rVvWyDyOyL3.rI4yOyL2yOtLE$qHyL8yOwVpX6.xUyOqHB2.BsRvOwV4.4yOxMxJyIyOrX$vOyB7yOwXpX6.pI2yOtQpF3.GrStJ2.pD4yOwFuAvJxPwDpN$tTwQyL6yOuC7.uF2yOxRqW6.OsM3yOyLuU2qEtDwLsF$qHtTwXyL5yOtTqHE5.wL3yOrX5.pIxE3yOxWtD3.qWrS$.pKtLwVyL5yOwVtBpN4.xH3yOsC4.qO4yOwVrG$2.OsUwAxP3yDyG2yOvWrXV.rSxW3yOsKVJpIuA3yOyDvEpF$4.rDtLuFtVtOuCvOxMyOyGuSqWxC4yOuPtDuN3yOyLwNsU$10.pXtDwLyL12yOxRuFqE$12.sRwX11yOwLrQ$12.TuNyD9yOvWpN$13.rVwV8yOxJpA$13.VuCxHyL6yOrA$14.pPtGvTxHyByI2yLvB$16.qEsKuFvO2wI$18.QqWsKB!' },
];

export default function (stage) {
  const canvas = document.createElement('canvas');
  canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block;touch-action:pan-y';
  stage.append(canvas);
  const gl = canvas.getContext('webgl2', { antialias: false });
  if (!gl) { stage.textContent = 'This needs WebGL2.'; return () => canvas.remove(); }
  if (!gl.getExtension('EXT_color_buffer_float')) { stage.textContent = 'This needs WebGL2 with float render targets.'; return () => canvas.remove(); }
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---- the world: a torus of cells, larger than the view, so creatures that leave one side are out of sight
  // before they come back on the other, and new ones can be seeded where nobody is looking
  const KR = 20, WW = 272, WH = 192, BS = 16, BW = WW / BS, BH = WH / BS, DT = 1 / 25;
  const CH = [0, 1, 2, 3];                                   // which SPECIES entry lives in each channel
  const BASE = [7, 3, 2, 3];                                 // how many of each to keep alive
  const want = BASE.map(n => Math.max(1, Math.round(n * Math.max(0.3, Math.min(2.5, PARAMS.population)))));

  // ---- the published patterns, decoded from Chan's run-length code and resampled to our kernel radius
  const ch2val = c => c === '.' || c === 'b' ? 0 : c === 'o' ? 255 : c.length === 1 ? c.charCodeAt(0) - 64 : (c.charCodeAt(0) - 112) * 24 + c.charCodeAt(1) - 40;
  const decode = (st, R) => {
    const list = []; for (const [, n, c] of st.replace(/!$/, '').matchAll(/(\d*)([p-y]?[.boA-X$])/g)) for (let i = 0; i < (n ? +n : 1); i++) list.push(c);
    const rows = list.join(',').split('$').map(l => l.split(',').filter(c => c !== '').map(c => ch2val(c) / 255));
    const w = Math.max(...rows.map(r => r.length)), h = rows.length, s = KR / R, W = Math.round(w * s), H = Math.round(h * s);
    const at = (x, y) => (x < 0 || y < 0 || y >= h || x >= w) ? 0 : (rows[y][x] || 0);
    const d = new Float32Array(W * H);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const fx = (x + 0.5) / s - 0.5, fy = (y + 0.5) / s - 0.5, x0 = Math.floor(fx), y0 = Math.floor(fy), tx = fx - x0, ty = fy - y0;
      d[y * W + x] = (at(x0, y0) * (1 - tx) + at(x0 + 1, y0) * tx) * (1 - ty) + (at(x0, y0 + 1) * (1 - tx) + at(x0 + 1, y0 + 1) * tx) * ty;
    }
    let mass = 0; for (const v of d) mass += v;
    return { d, W, H, mass, rad: 0.42 * Math.max(W, H) };
  };
  const SP = CH.map(i => ({ ...SPECIES[i], pat: decode(SPECIES[i].rle, SPECIES[i].R) }));

  const VS = `#version 300 es
  in vec2 p; out vec2 uv; void main() { uv = p * .5 + .5; gl_Position = vec4(p, 0, 1); }`;
  const prog = (fs, outs) => {
    const sh = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s)); return s; };
    const p = gl.createProgram(); gl.attachShader(p, sh(gl.VERTEX_SHADER, VS)); gl.attachShader(p, sh(gl.FRAGMENT_SHADER, fs)); gl.bindAttribLocation(p, 0, 'p'); gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
    const u = {}, n = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS);
    for (let i = 0; i < n; i++) { const a = gl.getActiveUniform(p, i), nm = a.name.replace(/\[0\]$/, ''); u[nm] = gl.getUniformLocation(p, a.name); }
    return { p, u };
  };

  // one Lenia step for all four species at once. The kernel is round, so it is stored for one quarter of the disc
  // and each weight is applied to the four quarter-turns of its offset: 4 state reads per weight read
  const stepP = prog(`#version 300 es
  precision highp float; out vec4 o;
  uniform sampler2D S, KW, KILL; uniform vec2 WS; uniform vec4 M, SG, CUT; uniform float DT, CR;
  void main() {
    vec2 p = gl_FragCoord.xy, iw = 1. / WS;
    vec4 u = vec4(0);
    for (int dy = 0; dy < ${KR}; dy++) {
      int mx = int(sqrt(float(${KR * KR} - dy * dy) - .01));
      for (int dx = 1; dx <= mx; dx++) {
        vec4 w = texelFetch(KW, ivec2(dx - 1, dy), 0);
        vec2 a = vec2(dx, dy), b = vec2(-dy, dx);
        u += w * (texture(S, (p + a) * iw) + texture(S, (p + b) * iw) + texture(S, (p - a) * iw) + texture(S, (p - b) * iw));
      }
    }
    vec4 d = (u - M) / (3. * SG), g = 2. * pow(max(vec4(0), 1. - d * d), vec4(4)) - 1.;
    vec4 s = clamp(texture(S, p * iw) + DT * g, 0., 1.);
    s = max(s - texture(KILL, p * iw), 0.);                  // a runaway soup is dissolved where it boils
    if (CR > 0.) {                                           // the scalpel: a soft wound along the drag
      vec2 a = p - CUT.xy; a -= WS * floor(a / WS + .5);
      vec2 ab = CUT.zw - CUT.xy; float h = clamp(dot(a, ab) / max(dot(ab, ab), 1e-4), 0., 1.);
      s *= mix(.3, 1., smoothstep(CR * .4, CR, length(a - ab * h)));
    }
    o = s;
  }`);
  // seeding: a creature's pattern, turned and placed, written into one channel
  const stampP = prog(`#version 300 es
  precision highp float; out vec4 o;
  uniform sampler2D S, PT, SM; uniform vec2 WS, C, PS; uniform vec4 MASK; uniform float ANG, WANT, MASS, FREE;
  void main() {
    vec2 p = gl_FragCoord.xy, d = p - C; d -= WS * floor(d / WS + .5);
    vec2 q = mat2(cos(ANG), -sin(ANG), sin(ANG), cos(ANG)) * d + PS * .5;
    o = texture(S, p / WS);
    if (q.x <= 0. || q.y <= 0. || q.x >= PS.x || q.y >= PS.y) return;
    if (WANT > 0.) {
      // a census on the GPU: seed only if this species is short, and nobody of any species is near the spot
      ivec2 n = textureSize(SM, 0); float tot = 0., near = 0.;
      for (int y = 0; y < n.y; y++) for (int x = 0; x < n.x; x++) {
        vec4 b = texelFetch(SM, ivec2(x, y), 0); tot += dot(b, MASK);
        vec2 e = (vec2(x, y) + .5) * ${BS}. - C; e -= WS * floor(e / WS + .5);
        if (length(e) < FREE) near += b.r + b.g + b.b + b.a;
      }
      if (tot / MASS > WANT - .6 || near > 2.) return;
    }
    o = max(o, MASK * texture(PT, q / PS).r);
  }`);
  // block sums, read back now and then: how much of each species is where
  const sumP = prog(`#version 300 es
  precision highp float; out vec4 o; uniform sampler2D S;
  void main() { ivec2 b = ivec2(gl_FragCoord.xy) * ${BS}; vec4 s = vec4(0);
    for (int y = 0; y < ${BS}; y++) for (int x = 0; x < ${BS}; x++) s += texelFetch(S, b + ivec2(x, y), 0);
    o = s; }`);
  // a soup boiling over, found on the GPU: a creature can only pack so much into an 80-cell square, so more than three
  // and a half creatures' worth there, two reads running, is eaten away there and a block around it
  const heatP = prog(`#version 300 es
  precision highp float; out vec4 o; uniform sampler2D SM, HP; uniform vec4 PK, MS;
  void main() { ivec2 b = ivec2(gl_FragCoord.xy), n = textureSize(SM, 0); vec4 v = texelFetch(SM, b, 0), nb = vec4(0);
    for (int j = -2; j <= 2; j++) for (int i = -2; i <= 2; i++) nb += texelFetch(SM, (b + ivec2(i, j) + n) % n, 0);
    vec4 hot = max(step(PK * 1.6, v), step(MS * 3.4, nb)) * step(1., v);
    o = hot * min(texelFetch(HP, b, 0) + 1., vec4(4)); }`);
  const killP = prog(`#version 300 es
  precision highp float; out vec4 o; uniform sampler2D HT;
  void main() { ivec2 b = ivec2(gl_FragCoord.xy), n = textureSize(HT, 0); vec4 h = texelFetch(HT, b, 0), nr = vec4(0);
    for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++) nr = max(nr, texelFetch(HT, (b + ivec2(i, j) + n) % n, 0));
    o = max(step(2., h) * .08, step(2., nr) * .06); }`);
  // a half-float copy with mipmaps for the lens (out of focus planes read coarser levels), and the growth this step
  const copyP = prog(`#version 300 es
  precision highp float; layout(location = 0) out vec4 o; layout(location = 1) out vec4 g;
  uniform sampler2D S, SO;
  void main() { ivec2 p = ivec2(gl_FragCoord.xy); vec4 a = texelFetch(S, p, 0); o = a; g = (a - texelFetch(SO, p, 0)) * 25.; }`);

  const renP = prog(`#version 300 es
  precision highp float; in vec2 uv; out vec4 o;
  uniform sampler2D V, GR; uniform vec2 WS, VO, VZ, R; uniform vec4 DF, GL; uniform float T, FADE;
  float h21(vec2 p) { vec3 q = fract(p.xyx * .1031); q += dot(q, q.yzx + 33.33); return fract((q.x + q.y) * q.z); }
  // cubic B-spline through four bilinear taps, on mip level L: smooth values and smooth gradients between cells
  vec4 cub(vec2 c, float L) {
    float k = exp2(L); vec2 ws = WS / k; c = c / k - .5;
    vec2 i = floor(c), f = c - i, f2 = f * f, f3 = f2 * f;
    vec2 w0 = (1. - 3. * f + 3. * f2 - f3) / 6., w1 = (4. - 6. * f2 + 3. * f3) / 6., w2 = (1. + 3. * f + 3. * f2 - 3. * f3) / 6., w3 = f3 / 6.;
    vec2 g0 = w0 + w1, g1 = w2 + w3, h0 = (i - .5 + w1 / g0) / ws, h1 = (i + 1.5 + w3 / g1) / ws;
    return g0.y * (g0.x * textureLod(V, h0, L) + g1.x * textureLod(V, vec2(h1.x, h0.y), L)) + g1.y * (g0.x * textureLod(V, vec2(h0.x, h1.y), L) + g1.x * textureLod(V, h1, L));
  }
  // the field at one focus level, with its gradient (per cell)
  void lvl(vec2 c, float L, out vec4 v, out vec4 gx, out vec4 gy) {
    float e = exp2(L); v = cub(c, L);
    gx = (cub(c + vec2(e, 0), L) - cub(c - vec2(e, 0), L)) / (2. * e); gy = (cub(c + vec2(0, e), L) - cub(c - vec2(0, e), L)) / (2. * e);
  }
  // the colours of the four species, and how each one scatters light
  const vec3 TINT[4] = vec3[4](vec3(.2, 1., .55), vec3(1., .5, .12), vec3(.25, .4, 1.), vec3(1., .22, .66));
  const float GAIN[4] = float[4](1., .9, .62, .8);
  void main() {
    vec2 c = VO + uv * VZ;                                  // this pixel, in cells of the drop
    float px = VZ.x / R.x;
    // three focus levels of the field: sharp, soft and very soft (B-splines on mip levels 0, 1 and 2)
    vec4 s0, sx, sy, s1, s1x, s1y, s2, s2x, s2y;
    lvl(c, 0., s0, sx, sy); lvl(c, 1., s1, s1x, s1y); lvl(c, 2., s2, s2x, s2y);
    vec4 a1 = clamp(DF * 2., 0., 1.), a2 = clamp(DF * 2. - 1., 0., 1.);
    vec4 v = mix(mix(s0, s1, a1), s2, a2), gx = mix(mix(sx, s1x, a1), s2x, a2), gy = mix(mix(sy, s1y, a1), s2y, a2);
    vec4 gr = texture(GR, c / WS);
    // the water: black, a faint glow of stray light in the middle, and specks of autofluorescent debris that drift
    // with the slide, each in its own plane, so they blur and sharpen as the focus racks
    vec2 q = uv - .5; q.x *= R.x / R.y;
    vec3 col = vec3(.0011, .0015, .0026) * (1. + 2. * exp(-dot(q, q) * 2.));
    for (int k = 0; k < 3; k++) {
      float sc = 30. + float(k) * 17.; vec2 g = c / sc + float(k) * 7.3, id = floor(g), f = fract(g) - .5;
      float hh = h21(id + float(k) * 13.1), dz = fract(hh * 7.13);
      vec2 jit = vec2(h21(id + 3.1), h21(id + 9.7)) - .5 + .06 * vec2(sin(T * .5 + hh * 40.), cos(T * .43 + hh * 31.));
      float rr = length(f - jit * .7) * sc, bl = abs(dz - GL.x) * 5. + .6;
      if (hh > .6) col += mix(vec3(.4, .55, .8), vec3(.8, .6, .4), fract(hh * 31.)) * .05 * smoothstep(bl, bl * .4, rr) / (bl * bl * .6 + .4);
    }
    vec3 L = normalize(vec3(-.5, .6, .62));
    for (int i = 0; i < 4; i++) {
      float val = v[i], df = DF[i];
      vec2 g = vec2(gx[i], gy[i]);
      float gm = length(g);
      if (val < .001 && gm < .0004) continue;
      float sharp = 1. - df;
      vec3 tn = TINT[i];
      // fluorescence: brightness follows how much of the creature is there, deep colour in the thin parts and paler
      // where it is dense, so the inner structure reads
      vec3 ramp = mix(tn * tn, mix(tn, vec3(1), .3), smoothstep(.2, .9, val));
      vec3 e = ramp * (.07 * smoothstep(0., .06, val) + 1.1 * pow(val, 1.3));
      // membranes: steep edges glow as a thin bright skin, only in focus
      float rim = smoothstep(.03, .16, gm) * sharp * sharp;
      e += mix(tn, vec3(1), .35) * rim * .35;
      // a little relief, as if the gel were lit from the upper left, and a wet sheen on the dense parts
      vec3 n = normalize(vec3(-g * 7., 1.));
      float dif = max(dot(n, L), 0.), sp = pow(max(dot(reflect(-L, n), vec3(0, 0, 1)), 0.), 30.);
      e *= .7 + .45 * dif;
      e += vec3(.85, .92, 1.) * sp * smoothstep(.15, .5, val) * .12 * sharp * sharp;
      // the growing front of each creature glows brighter and whiter; its fading wake dims
      float gw = clamp(gr[i] * 1.5, -1., 1.) * (.3 + .7 * sharp);
      e *= 1. + max(gw, 0.) * 1.1 - max(-gw, 0.) * .3;
      e += mix(tn, vec3(1), .5) * max(gw, 0.) * .18 * smoothstep(0., .08, val);
      col += e * GAIN[i] * (1. - .25 * df) * GL.y;
    }
    o = vec4(col * FADE, 1);
  }`);
  const compP = prog(`#version 300 es
  precision highp float; in vec2 uv; out vec4 o;
  uniform sampler2D SC; uniform vec2 R; uniform float BL;
  float h21(vec2 p) { vec3 q = fract(p.xyx * .1031); q += dot(q, q.yzx + 33.33); return fract((q.x + q.y) * q.z); }
  vec3 aces(vec3 x) { return clamp((x * (2.51 * x + .03)) / (x * (2.43 * x + .59) + .14), 0., 1.); }
  vec3 tap(vec2 u, float l) { vec2 t = exp2(l) / R; vec3 c = textureLod(SC, u, l).rgb * .25;
    c += (textureLod(SC, u + t * vec2(.9, .4), l).rgb + textureLod(SC, u + t * vec2(-.4, .9), l).rgb + textureLod(SC, u + t * vec2(-.9, -.4), l).rgb + textureLod(SC, u + t * vec2(.4, -.9), l).rgb) * .1875;
    return c; }
  void main() {
    vec2 d = uv - .5;
    // a touch of lateral colour toward the edge of the field, as in a real objective
    float ca = .0035 * dot(d, d);
    vec3 c = vec3(textureLod(SC, uv + d * ca, 0.).r, textureLod(SC, uv, 0.).g, textureLod(SC, uv - d * ca, 0.).b);
    vec3 bl = tap(uv, 1.5) * .3 + tap(uv, 3.) * .3 + tap(uv, 4.5) * .25 + tap(uv, 6.) * .15;
    c += bl * .3 * BL;
    c = aces(c * 1.2);
    c *= 1. - .55 * pow(length(d * vec2(1., R.y / R.x)) * 1.25, 2.4);
    o = vec4(pow(c, vec3(1. / 2.2)) + (h21(gl_FragCoord.xy + fract(R.x * .37)) - .5) / 255., 1);
  }`);

  // ---- textures and targets
  const tex = (w, h, fmt, filt, wrap, mips) => {
    const t = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, t);
    const levels = mips ? Math.floor(Math.log2(Math.max(w, h))) + 1 : 1; gl.texStorage2D(gl.TEXTURE_2D, levels, fmt, w, h);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, mips ? gl.LINEAR_MIPMAP_LINEAR : filt); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filt);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, wrap); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, wrap);
    return t;
  };
  const target = (w, h, fmt, filt, wrap, mips) => { const t = tex(w, h, fmt, filt, wrap, mips), f = gl.createFramebuffer(); gl.bindFramebuffer(gl.FRAMEBUFFER, f); gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, t, 0); return { t, f, w, h }; };
  const all = [];
  const keep = x => (all.push(x), x);
  let A = keep(target(WW, WH, gl.RGBA32F, gl.NEAREST, gl.REPEAT)), B = keep(target(WW, WH, gl.RGBA32F, gl.NEAREST, gl.REPEAT));
  const SUM = keep(target(BW, BH, gl.RGBA32F, gl.NEAREST, gl.CLAMP_TO_EDGE));
  const Vt = keep(target(WW, WH, gl.RGBA16F, gl.LINEAR, gl.REPEAT, true)), Gt = tex(WW, WH, gl.RGBA16F, gl.LINEAR, gl.REPEAT);
  const copyF = gl.createFramebuffer(); gl.bindFramebuffer(gl.FRAMEBUFFER, copyF);
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, Vt.t, 0); gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT1, gl.TEXTURE_2D, Gt, 0);
  gl.drawBuffers([gl.COLOR_ATTACHMENT0, gl.COLOR_ATTACHMENT1]);
  // the kernels: one quarter of the disc, four species in RGBA. Chan's polynomial shell, with each species' rings
  const KW = tex(KR, KR, gl.RGBA32F, gl.NEAREST, gl.CLAMP_TO_EDGE);
  { const k = new Float32Array(KR * KR * 4), sum = [0, 0, 0, 0];
    for (let dy = 0; dy < KR; dy++) for (let dx = 1; dx <= KR; dx++) for (let c = 0; c < 4; c++) {
      const r = Math.hypot(dx, dy) / KR; if (r >= 1) continue;
      const b = SP[c].b, kr = b.length * r, w = Math.pow(4 * (kr % 1) * (1 - kr % 1), 4) * b[Math.min(b.length - 1, Math.floor(kr))];
      k[(dy * KR + dx - 1) * 4 + c] = w; sum[c] += 4 * w;
    }
    for (let i = 0; i < k.length; i++) k[i] /= sum[i % 4];
    gl.bindTexture(gl.TEXTURE_2D, KW); gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, KR, KR, gl.RGBA, gl.FLOAT, k); }
  const PT = SP.map(s => { const t = tex(s.pat.W, s.pat.H, gl.R16F, gl.LINEAR, gl.CLAMP_TO_EDGE); gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, s.pat.W, s.pat.H, gl.RED, gl.FLOAT, s.pat.d); return t; });
  let HA = target(BW, BH, gl.RGBA16F, gl.NEAREST, gl.CLAMP_TO_EDGE), HB = target(BW, BH, gl.RGBA16F, gl.NEAREST, gl.CLAMP_TO_EDGE);
  const KILL = target(BW, BH, gl.RGBA16F, gl.LINEAR, gl.REPEAT);

  gl.bindVertexArray(gl.createVertexArray()); gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW); gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  const run = (pr, fb, w, h, set) => {
    gl.useProgram(pr.p); gl.bindFramebuffer(gl.FRAMEBUFFER, fb); gl.viewport(0, 0, w, h);
    let unit = 0;
    set((name, v, isTex) => {
      const loc = pr.u[name]; if (loc == null) return;
      if (isTex) { gl.activeTexture(gl.TEXTURE0 + unit); gl.bindTexture(gl.TEXTURE_2D, v); gl.uniform1i(loc, unit++); }
      else if (typeof v === 'number') gl.uniform1f(loc, v);
      else if (v.length === 2) gl.uniform2f(loc, v[0], v[1]); else gl.uniform4f(loc, v[0], v[1], v[2], v[3]);
    });
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  };

  let W = 1, H = 1, SC = null;
  const resize = () => {
    const w = stage.clientWidth || 1, h = stage.clientHeight || 1, d = Math.min(devicePixelRatio, 2, Math.max(0.5, Math.sqrt(900000 / (w * h))));
    W = canvas.width = Math.max(1, (w * d) | 0); H = canvas.height = Math.max(1, (h * d) | 0);
    if (SC) { gl.deleteTexture(SC.t); gl.deleteFramebuffer(SC.f); }
    SC = target(W, H, gl.RGBA16F, gl.LINEAR, gl.CLAMP_TO_EDGE, true);
  };
  const ro = new ResizeObserver(resize); ro.observe(stage); resize();

  // ---- the view: the largest window of the stage's shape that leaves a hidden band around it
  const view = () => { const a = W / H, mw = WW - 64, mh = WH - 64; return a > mw / mh ? [mw, mw / a] : [mh * a, mh]; };
  let vox = 20, voy = 30;
  const wrapD = (d, n) => d - n * Math.round(d / n);
  const hidden = (x, y, r) => {
    const [vw, vh] = view(), cx = vox + vw / 2, cy = voy + vh / 2;
    const dx = Math.max(0, Math.abs(wrapD(x - cx, WW)) - vw / 2), dy = Math.max(0, Math.abs(wrapD(y - cy, WH)) - vh / 2);
    return Math.hypot(dx, dy) > r + 2;
  };
  let seed = reduce ? 11 : 7;
  const rnd = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
  // wanted > 0: the GPU decides from the block sums whether this species is short and the spot is free
  const stamp = (c, x, y, ang, wanted = 0) => {
    const p = SP[c].pat, m = [0, 0, 0, 0]; m[c] = 1;
    run(stampP, B.f, WW, WH, u => { u('S', A.t, 1); u('PT', PT[c], 1); u('SM', SUM.t, 1); u('WS', [WW, WH]); u('C', [x, y]); u('PS', [p.W, p.H]); u('MASK', m); u('ANG', ang);
      u('WANT', wanted); u('MASS', p.mass); u('FREE', p.rad + KR + BS * 0.72); });
    [A, B] = [B, A];
  };
  // block sums from the last read, plus creatures placed since: is a spot free of every species?
  const blocks = new Float32Array(BW * BH * 4), fresh = [];
  const freeAt = (x, y, r) => {
    for (const f of fresh) if (Math.hypot(wrapD(x - f[0], WW), wrapD(y - f[1], WH)) < r + f[2] + KR + 6) return false;
    const n = Math.ceil((r + KR) / BS) + 1, bx = Math.floor(x / BS), by = Math.floor(y / BS); let s = 0;
    for (let j = -n; j <= n; j++) for (let i = -n; i <= n; i++) {
      if (Math.hypot(wrapD((bx + i + 0.5) * BS - x, WW), wrapD((by + j + 0.5) * BS - y, WH)) > r + KR + BS * 0.72) continue;
      const k = (((by + j) % BH + BH) % BH * BW + ((bx + i) % BW + BW) % BW) * 4; s += blocks[k] + blocks[k + 1] + blocks[k + 2] + blocks[k + 3];
    }
    return s < 2;
  };
  const spawn = (c, mustHide) => {
    const r = SP[c].pat.rad;
    for (let k = 0; k < 60; k++) {
      const x = rnd() * WW, y = rnd() * WH;
      if (mustHide && !hidden(x, y, r)) continue;
      if (!freeAt(x, y, r)) continue;
      stamp(c, x, y, rnd() * Math.PI * 2); fresh.push([x, y, r]);
      return true;
    }
    return false;
  };
  const PK = SP.map(s => { const p = s.pat; let mx = 0;
    for (let y = -BS; y < p.H; y += 2) for (let x = -BS; x < p.W; x += 2) { let t = 0; for (let j = 0; j < BS; j++) for (let i = 0; i < BS; i++) { const X = x + i, Y = y + j; if (X >= 0 && Y >= 0 && X < p.W && Y < p.H) t += p.d[Y * p.W + X]; } mx = Math.max(mx, t); }
    return mx; });
  // every quarter second each species gets one proposed spot out of sight, far from the other proposals; the GPU
  // seeds it only if that species is short and the spot is empty
  const propose = () => {
    const taken = [];
    for (let c = 0; c < 4; c++) {
      const r = SP[c].pat.rad;
      for (let k = 0, got = 0; k < 40 && got < (want[c] > 2 ? 2 : 1); k++) {
        const x = rnd() * WW, y = rnd() * WH;
        if (!hidden(x, y, r) || taken.some(f => Math.hypot(wrapD(x - f[0], WW), wrapD(y - f[1], WH)) < r + f[2] + KR + 6)) continue;
        stamp(c, x, y, rnd() * Math.PI * 2, want[c]); taken.push([x, y, r]); got++;
      }
    }
  };
  const step = cut => {
    run(stepP, B.f, WW, WH, u => { u('S', A.t, 1); u('KW', KW, 1); u('KILL', KILL.t, 1); u('WS', [WW, WH]); u('M', SP.map(s => s.m)); u('SG', SP.map(s => s.s)); u('DT', DT);
      u('CUT', cut ? cut : [0, 0, 0, 0]); u('CR', cut ? 3 : 0); });
    [A, B] = [B, A];
  };
  // block sums, then the soup check and the census, all on the GPU, a few times a second
  const sum = () => {
    run(sumP, SUM.f, BW, BH, u => u('S', A.t, 1));
    run(heatP, HB.f, BW, BH, u => { u('SM', SUM.t, 1); u('HP', HA.t, 1); u('PK', PK); u('MS', SP.map(s => s.pat.mass)); }); [HA, HB] = [HB, HA];
    run(killP, KILL.f, BW, BH, u => u('HT', HA.t, 1));
  };

  // first creatures, anywhere; then a short warm-up so they settle into shape before the first frame
  for (const t of [A, B]) { gl.bindFramebuffer(gl.FRAMEBUFFER, t.f); gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT); }
  for (let c = 0; c < 4; c++) for (let i = 0; i < want[c]; i++) spawn(c, false);
  for (let i = 0; i < 40; i++) step(null);

  // ---- pointer: up and down racks the focus; a drag with a button down (or a finger) is a scalpel
  let px = 0.5, py = 0.5, lastMove = -1e9, held = false, cutting = false, cutFrom = null, cutSeg = null;
  const toWorld = () => { const [vw, vh] = view(); return [vox + px * vw, voy + (1 - py) * vh]; };
  const onMove = e => {
    const b = canvas.getBoundingClientRect(); px = (e.clientX - b.left) / b.width; py = (e.clientY - b.top) / b.height;
    lastMove = performance.now(); held = e.pointerType === 'mouse';
    if (cutting) { const w = toWorld(); if (cutFrom) cutSeg = [cutFrom[0], cutFrom[1], w[0], w[1]]; cutFrom = w; }
  };
  const onDown = e => { onMove(e); cutting = true; cutFrom = toWorld(); cutSeg = [cutFrom[0], cutFrom[1], cutFrom[0], cutFrom[1]]; };
  const onUp = () => { cutting = false; cutFrom = null; };
  const onLeave = () => { held = false; onUp(); };
  canvas.addEventListener('pointermove', onMove); canvas.addEventListener('pointerdown', onDown); canvas.addEventListener('pointerleave', onLeave);
  addEventListener('pointerup', onUp); addEventListener('pointercancel', onUp);

  const DEPTH = [0.2, 0.55, 0.85, 0.35];                    // each species' plane in the drop, 0 = top
  let focus = 0.3, focusV = 0, acc = 0, frames = 0, t = 0, last = null, raf;
  function frame(now) {
    if (last === null) last = now;
    const dt = Math.min(1 / 30, (now - last) / 1000); last = now;
    const live = held || now - lastMove < 1800;
    if (!reduce) {
      t += dt;
      acc = Math.min(3, acc + dt * 60 * Math.max(0.1, PARAMS.speed));
      let n = 0;
      while (acc >= 1 && n < 3) { step(cutSeg); cutSeg = null; acc -= 1; n++; }
      if (n) { run(copyP, copyF, WW, WH, u => { u('S', A.t, 1); u('SO', B.t, 1); }); gl.bindTexture(gl.TEXTURE_2D, Vt.t); gl.generateMipmap(gl.TEXTURE_2D); }
      if (++frames % 15 === 0) { sum(); propose(); }
      // the slide drifts slowly, on a gently wandering heading
      const hd = 0.7 + 0.9 * Math.sin(t * 0.031) + 0.4 * Math.sin(t * 0.077);
      vox = (vox + Math.cos(hd) * 2.6 * dt + WW) % WW; voy = (voy + Math.sin(hd) * 2.6 * dt + WH) % WH;
    } else if (frames++ === 0) {
      for (let i = 0; i < 240; i++) { step(null); if (i % 15 === 14) sum(); }
      // the still: the slide is moved to where the window holds the most life
      run(sumP, SUM.f, BW, BH, u => u('S', A.t, 1)); gl.readPixels(0, 0, BW, BH, gl.RGBA, gl.FLOAT, blocks);
      const [vw, vh] = view(); let best = -1;
      for (let oy = 0; oy < WH; oy += 8) for (let ox = 0; ox < WW; ox += 8) {
        let m = 0, kinds = 0;
        for (let c = 0; c < 4; c++) { let mc = 0;
          for (let by = Math.ceil(oy / BS); (by + 1) * BS <= oy + vh; by++) for (let bx = Math.ceil(ox / BS); (bx + 1) * BS <= ox + vw; bx++) mc += blocks[((by % BH) * BW + bx % BW) * 4 + c] / SP[c].pat.mass;
          m += Math.min(mc, 3); kinds += mc > 0.5 ? 1 : 0; }
        if (m + kinds > best) { best = m + kinds; vox = ox; voy = oy; }
      }
      run(copyP, copyF, WW, WH, u => { u('S', A.t, 1); u('SO', B.t, 1); }); gl.bindTexture(gl.TEXTURE_2D, Vt.t); gl.generateMipmap(gl.TEXTURE_2D);
    }
    // the focus racks slowly through the drop on its own; the pointer's height takes it over, on a spring
    const auto = reduce ? 0.45 : 0.5 + 0.42 * Math.sin(t * 2 * Math.PI / 26 - 1.2);
    const ft = live ? Math.max(0, Math.min(1, py)) : auto;
    focusV += (60 * (ft - focus) - 2 * Math.sqrt(60) * focusV) * dt; focus += focusV * dt;
    const DF = DEPTH.map(d => Math.min(1, Math.abs(d - focus) * (reduce ? 0.7 : 1.35)));
    const [vw, vh] = view();
    run(renP, SC.f, W, H, u => { u('V', Vt.t, 1); u('GR', Gt, 1); u('WS', [WW, WH]); u('VO', [vox, voy]); u('VZ', [vw, vh]); u('R', [W, H]);
      u('DF', DF); u('GL', [focus, 1, 0, 0]); u('T', t); u('FADE', Math.min(1, reduce ? 1 : t / 0.8)); });
    gl.bindTexture(gl.TEXTURE_2D, SC.t); gl.generateMipmap(gl.TEXTURE_2D);
    run(compP, null, W, H, u => { u('SC', SC.t, 1); u('R', [W, H]); u('BL', PARAMS.glow); });
    raf = requestAnimationFrame(frame);
  }
  raf = requestAnimationFrame(frame);
  return () => {
    cancelAnimationFrame(raf); ro.disconnect();
    canvas.removeEventListener('pointermove', onMove); canvas.removeEventListener('pointerdown', onDown); canvas.removeEventListener('pointerleave', onLeave);
    removeEventListener('pointerup', onUp); removeEventListener('pointercancel', onUp);
    gl.getExtension('WEBGL_lose_context')?.loseContext(); canvas.remove();
  };
}
