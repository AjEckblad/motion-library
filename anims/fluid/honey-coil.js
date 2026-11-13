// Honey pour: a thin thread of honey falls into a white porcelain bowl of honey in a dark studio, seen from a high
// three-quarter view. The thread tapers as it falls and speeds up (its radius goes as v^-1/2) to a thin neck just above
// the surface, where it bends over and swings round in a circle, laying itself down in loops, the way a rope of honey
// does (liquid-rope coiling); the loops stack, sink and slump into a mound that spreads into the pool, and the ridges
// they leave keep flattening for a few seconds. Move the pointer and the pour follows it: dragged along, the coil is
// laid out as a trail of loops, like a sewing machine stitching in honey.
// The trick: the coil is kinematic but physical. The contact point circles at the speed the rope arrives (its radius
// and pace wander, it tightens as the pile rises, and now and then it flattens into folding back and forth and may
// come out of it turning the other way, as real coiling does), so each fresh loop is a real tube (a chain of capsules)
// that rests on the surface or on the loop beneath it, like stacked rope, and sinks, faster the higher the stack
// stands. Once a loop has sunk by its radius it is melted into a height field as exactly the half that still shows;
// there it softens and fades, handing its volume to a smooth mound that spreads by the thin-film (lubrication)
// equation, solved implicitly on the CPU. Each pixel raymarches the thread, the loops and the surface as one liquid
// (the ropes are joined to the pool by a smooth union, so the stack fillets into it with no seam) and the bowl
// analytically (two half-ellipsoids and a rounded lip). Honey is coloured by Beer-Lambert absorption along the light's
// whole path through it, refracted down to the porcelain and back: pale gold where it is thin at the shore and in the
// thread, deep amber in the mound, a warm glow from the little light it scatters. A softbox low behind lays a broad
// glossy reflection across the pool that bends over the mound and its ridges; cards beside the bowl draw the crisp
// highlights along the thread and the loops.
const PARAMS = { flow: 1, loops: 1.5, spread: 1 };

export default function (stage) {
  const canvas = document.createElement('canvas');
  canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block;touch-action:pan-y';
  stage.append(canvas);
  const gl = canvas.getContext('webgl2', { antialias: false, depth: false, alpha: false, powerPreference: 'high-performance' });
  if (!gl) { stage.textContent = 'This needs WebGL2.'; return () => canvas.remove(); }
  if (!gl.getExtension('EXT_color_buffer_float')) { stage.textContent = 'This needs WebGL2 float render targets.'; gl.getExtension('WEBGL_lose_context')?.loseContext(); return () => canvas.remove(); }
  const linF = !!gl.getExtension('OES_texture_float_linear');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---------------------------------------------------------------- the physical set-up, in millimetres
  const H0 = 2.6;                                   // depth of the pool
  const FLOW = Math.max(0.5, Math.min(1.5, PARAMS.flow));
  const AL = 1.0 * Math.sqrt(FLOW), A1 = 0.55 * Math.sqrt(FLOW);   // laid rope radius, thread radius at its neck
  const FREQ = Math.max(0.8, Math.min(2.5, PARAMS.loops)), RC0 = 3.1;
  const TAU = 2.0;                                  // a melted loop lingers as a soft ridge for a few seconds
  const KB = 0.07 * Math.max(0.6, Math.min(2.5, PARAMS.spread));  // rho g / (3 mu), for a cold, thick honey
  const NB = 160, LB = 80, DXB = LB / NB;           // the mound: 80 mm square on the CPU
  const NR = 384, LR = 32;                          // the fresh rope: 32 mm square on the GPU

  // ---------------------------------------------------------------- GLSL
  const VQ = `#version 300 es
  in vec2 p; void main() { gl_Position = vec4(p, 0, 1); }`;
  const HEAD = `#version 300 es
  precision highp float; precision highp int; precision highp sampler2D;
  `;
  // fresh rope: blur a little and fade (its volume is handed to the mound on the CPU), then lay down the new rope
  const FS_BLUR = HEAD + `
  uniform sampler2D S; uniform vec2 DIR; uniform float K, BL; out vec4 o;
  void main() {
    ivec2 p = ivec2(gl_FragCoord.xy), n = textureSize(S, 0) - 1; ivec2 d = ivec2(DIR);
    float c = texelFetch(S, p, 0).r * .375 + (texelFetch(S, clamp(p + d, ivec2(0), n), 0).r + texelFetch(S, clamp(p - d, ivec2(0), n), 0).r) * .25
      + (texelFetch(S, clamp(p + 2 * d, ivec2(0), n), 0).r + texelFetch(S, clamp(p - 2 * d, ivec2(0), n), 0).r) * .0625;
    o = vec4(mix(texelFetch(S, p, 0).r, c, BL) * K, 0, 0, 1);
  }`;
  const FS_DEP = HEAD + `
  uniform sampler2D S, TB; uniform vec4 SEG[8]; uniform vec2 SY[8]; uniform int NS; uniform float LR, LB; out vec4 o;
  void main() {
    ivec2 p = ivec2(gl_FragCoord.xy); float n = float(textureSize(S, 0).x);
    vec2 x = (vec2(p) + .5) / n * LR - LR * .5;
    float h = texelFetch(S, p, 0).r, b = texture(TB, x / LB + .5).r;
    for (int i = 0; i < 8; i++) {
      if (i >= NS) break;
      vec2 a = SEG[i].xy, ab = SEG[i].zw - a; float l = dot(ab, ab);
      float t = l > 1e-9 ? clamp(dot(x - a, ab) / l, 0., 1.) : 0.;
      float d = length(x - a - ab * t), r = SY[i].x;
      if (d < r) h = max(h, SY[i].y + sqrt(r * r - d * d) - b);   // the upper half of the rope, as it stands (a union)
    }
    o = vec4(h, 0, 0, 1);
  }`;

  const FS_MAIN = HEAD + `
  uniform sampler2D TB, TR; uniform vec4 BZ[10]; uniform vec4 BS; uniform vec3 NZ; uniform vec4 LV[64]; uniform vec4 LG[8]; uniform vec4 LS; uniform int NLV;
  uniform float A1, HMAX, H0, LB, LR, EXPO, HL, RS; uniform vec2 CC; uniform float CA; uniform vec4 STK;
  uniform vec3 CP, CF, CR, CU; uniform float FOC; uniform vec2 R; out vec4 o;
  const vec3 SIG = vec3(.055, .19, .6);                  // honey's absorption per mm: blue goes first, then green
  const float ETA = 1.49, KF = .6;                       // KF: how wide the honey fillets a rope into the pool
  const vec3 LD = vec3(0., .94, -.342);                  // the main light: overhead, a little behind
  // the dish: white porcelain, inside and outside half-ellipsoids of revolution, standing on a dark table
  const float DA = 30., DB = 10., DC = 10., OA = 32.2, OB = 13., YRIM = 7.5, YT = -3., RIN = 29.05, ROUT = 31.6;
  const vec2 SPC = vec2(0., -7.);
  float yFl(vec2 x) { return DC - DB * sqrt(max(1. - dot(x, x) / (DA * DA), 0.)); }
  float lightE(vec2 x) { vec2 s = x - SPC; float q = dot(s, s); return exp(-q / 800.) * .9 + .1 * exp(-q / 8000.); }
  float hB(vec2 x) {                                    // cubic B-spline from four bilinear taps: smooth slopes
    vec2 n = vec2(textureSize(TB, 0)), u = (x / LB + .5) * n - .5, i = floor(u), f = u - i;
    vec2 w0 = (1. - f) * (1. - f) * (1. - f) / 6., w1 = (4. - 6. * f * f + 3. * f * f * f) / 6., w2 = (1. + 3. * f + 3. * f * f - 3. * f * f * f) / 6., w3 = f * f * f / 6.;
    vec2 g0 = w0 + w1, g1 = w2 + w3, h0 = (i - .5 + w1 / g0) / n, h1 = (i + 1.5 + w3 / g1) / n;
    return g0.y * (g0.x * texture(TB, vec2(h0.x, h0.y)).r + g1.x * texture(TB, vec2(h1.x, h0.y)).r)
         + g1.y * (g0.x * texture(TB, vec2(h0.x, h1.y)).r + g1.x * texture(TB, vec2(h1.x, h1.y)).r);
  }
  float hBf(vec2 x) { return texture(TB, x / LB + .5).r; }
  float hR(vec2 x) { vec2 u = x / LR + .5; return (u.x < 0. || u.y < 0. || u.x > 1. || u.y > 1.) ? 0. : texture(TR, u).r; }
  float H(vec2 x) { vec2 q = x - CC; return hB(x) + hR(x) + CA * .55 * exp(-dot(q, q) / (CA * CA * 2.2)); }
  float Hm(vec2 x) { vec2 q = x - CC; return hBf(x) + hR(x) + CA * .55 * exp(-dot(q, q) / (CA * CA * 2.2)); }
  vec3 Hn(vec2 x, float e) { float a = H(x + vec2(e, 0)), b = H(x - vec2(e, 0)), c = H(x + vec2(0, e)), d = H(x - vec2(0, e)); return normalize(vec3(b - a, 2. * e, d - c)); }
  vec3 Hnf(vec2 x, float e) { float a = Hm(x + vec2(e, 0)), b = Hm(x - vec2(e, 0)), c = Hm(x + vec2(0, e)), d = Hm(x - vec2(0, e)); return normalize(vec3(b - a, 2. * e, d - c)); }
  // ---- the studio: dark and warm; a softbox low behind (the pool's broad sheen), a big one overhead, a white card left
  float box(vec3 r, vec4 b, float s) {
    float el = asin(clamp(r.y, -1., 1.)), az = atan(r.x, -r.z);
    return smoothstep(b.x - s, b.x + s, el) * smoothstep(b.y + s, b.y - s, el) * smoothstep(b.z - s, b.z + s, az) * smoothstep(b.w + s, b.w - s, az);
  }
  vec3 studio(vec3 r, float sf) {
    vec3 c = vec3(.012, .008, .005) + vec3(.03, .02, .012) * smoothstep(-.1, .7, r.y);
    c += vec3(4., 3.7, 3.2) * box(r, vec4(.29, .43, -.12, .12), .012 * sf) * (.4 + .6 * smoothstep(.29, .43, asin(clamp(r.y, -1., 1.))));
    c += vec3(2.2, 2.1, 2.) * box(r, vec4(1., 1.6, -3.3, 3.3), .08 * sf);
    return c;
  }
  float card(vec3 o, vec3 r) {
    if (r.x > -.02) return -1.;
    float t = (-37. - o.x) / r.x; vec3 q = o + r * t;
    return (t > 0. && q.z > -45. && q.z < 30. && q.y > YT && q.y < 70.) ? t : -1.;
  }
  vec2 ell(vec3 ro, vec3 rd, float a, float b, float c) {
    float s = a / b; vec3 o = vec3(ro.x, (ro.y - c) * s, ro.z), d = vec3(rd.x, rd.y * s, rd.z);
    float A = dot(d, d), B = dot(o, d), C = dot(o, o) - a * a, h = B * B - A * C;
    if (h < 0.) return vec2(-1.);
    h = sqrt(h); return vec2(-B - h, -B + h) / A;
  }
  vec3 ellN(vec3 p, float a, float b) { return normalize(vec3(p.x / (a * a), (p.y - DC) / (b * b), p.z / (a * a))); }
  float traceDish(vec3 ro, vec3 rd, out vec3 n, out float m) {     // m: 1 porcelain, 2 table
    float t = 1e9; m = 0.; n = vec3(0, 1, 0);
    vec2 e = ell(ro, rd, OA, OB, DC);
    if (e.x > 0.) { vec3 p = ro + rd * e.x; if (p.y < YRIM) { t = e.x; n = ellN(p, OA, OB); m = 1.; } }
    if (rd.y < 0.) {
      float tl = (YRIM - ro.y) / rd.y; vec3 p = ro + rd * tl; float r = length(p.xz);
      if (tl > 0. && tl < t && r > RIN && r < ROUT) {   // the lip, a flat ring shaded as if rounded
        float u = clamp((r - (RIN + ROUT) * .5) / ((ROUT - RIN) * .5), -1., 1.); vec2 q = p.xz / r * u * .92;
        n = normalize(vec3(q.x, sqrt(max(1. - u * u * .85, .05)), q.y)); t = tl; m = 1.;
      }
      float tt = (YT - ro.y) / rd.y; if (tt > 0. && tt < t) { t = tt; n = vec3(0, 1, 0); m = 2.; }
    }
    e = ell(ro, rd, DA, DB, DC);
    if (e.y > 0. && e.y < t) { vec3 p = ro + rd * e.y; if (p.y < YRIM) { t = e.y; n = -ellN(p, DA, DB); m = 1.; } }
    return m > 0. ? t : -1.;
  }
  vec3 shadeDish(vec3 p, vec3 rd, vec3 n, float m, float sf) {
    float E = lightE(p.xz), c = max(dot(n, -rd), 0.), F = .04 + .96 * pow(1. - c, 5.);
    if (m > 1.5) {                                        // dark oiled wood; the light dies away from the dish
      float ao = .3 + .7 * smoothstep(OA - 1., OA + 10., length(p.xz));
      return vec3(.03, .019, .011) * (1.3 * E + .03) * ao + F * .07 * studio(reflect(rd, n), 8.);
    }
    float dif = .75 * max(dot(n, LD), 0.) + .25 * (.6 + .4 * n.y);
    vec3 col = vec3(.9, .87, .82) * dif * 1.0 * E;
    float r = length(p.xz);                               // the honey's glow on the porcelain just above its edge
    if (r < RIN) col += vec3(.5, .24, .05) * E * exp(-max(p.y - HL, 0.) * .9) * smoothstep(RS - 2., RS + .5, r);
    return col + F * studio(reflect(rd, n), sf);
  }
  vec3 poolFlat(vec3 q, vec3 r) {                         // the pool as seen in a reflection: level, at the shore's height
    float d = max(HL - yFl(q.xz), 0.), F = .04 + .96 * pow(1. - abs(r.y), 5.);
    vec3 t = refract(r, vec3(0, 1, 0), 1. / ETA); float L = d / max(-t.y, .3);
    return studio(reflect(r, vec3(0, 1, 0)), 2.) * F + (1. - F) * vec3(1., .95, .87) * 1.3 * lightE(q.xz) * exp(-SIG * (L + d * 1.1));
  }
  vec3 envScene(vec3 o, vec3 r, float sf) {
    vec3 n; float m, t = traceDish(o, r, n, m), tc = card(o, r);
    if (r.y < 0.) {
      float tp = (HL - o.y) / r.y; vec3 q = o + r * tp;
      if (tp > 0. && (t < 0. || tp < t) && (tc < 0. || tp < tc) && dot(q.xz, q.xz) < RS * RS) return poolFlat(q, r);
    }
    if (tc > 0. && (t < 0. || tc < t)) return vec3(1.15, 1.2, 1.3);
    if (t > 0.) return shadeDish(o + r * t, r, n, m, sf * 3.);
    return studio(r, sf);
  }
  // ---- the thread: a falling tube that thins as it speeds up (radius ~ v^-1/2), narrowest just above the coil
  float thR(float y) { return A1 * pow(1. + max(y - NZ.y, 0.) / 9., .42); }
  float traceThread(vec3 ro, vec3 rd) {
    vec2 oc = ro.xz - NZ.xz, d = rd.xz; float a = dot(d, d), b = dot(oc, d);
    float r = A1 * 2.6, t = -1.;
    for (int k = 0; k < 3; k++) {
      float c = dot(oc, oc) - r * r, h = b * b - a * c; if (h < 0.) return -1.;
      t = (-b - sqrt(h)) / a; r = thR(ro.y + rd.y * t);
    }
    return (t > 0. && ro.y + rd.y * t > NZ.y) ? t : -1.;
  }
  float sdSeg(vec3 p, vec4 a, vec4 b) {
    vec3 pa = p - a.xyz, ba = b.xyz - a.xyz; float h = clamp(dot(pa, ba) / dot(ba, ba), 0., 1.);
    return length(pa - ba * h) - mix(a.w, b.w, h);
  }
  float sdBend(vec3 p) {
    float d = 1e5;
    for (int i = 0; i < 9; i++) d = min(d, sdSeg(p, BZ[i], BZ[i + 1]));
    float top = length(p.xz - NZ.xz) - thR(p.y); d = min(d, max(top, NZ.y - p.y));
    return d;
  }
  float traceBend(vec3 ro, vec3 rd) {
    vec3 oc = ro - BS.xyz; float b = dot(oc, rd), c = dot(oc, oc) - BS.w * BS.w, h = b * b - c;
    if (h < 0.) return -1.;
    float t = max(-b - sqrt(h), 0.), t1 = -b + sqrt(h);
    for (int i = 0; i < 48; i++) { float d = sdBend(ro + rd * t); if (d < .01) return t; t += d * .9; if (t > t1) break; }
    return -1.;
  }
  float sdCap(vec3 p, vec3 a, vec3 b, float r) { vec3 pa = p - a, ba = b - a; float h = clamp(dot(pa, ba) / dot(ba, ba), 0., 1.); return length(pa - ba * h) - r; }
  float sdLive(vec3 p) {
    float d = 1e5;
    for (int g = 0; g < 8; g++) {
      if (g * 8 >= NLV - 1) break;
      if (length(p - LG[g].xyz) - LG[g].w > d) continue;
      for (int k = 0; k < 8; k++) { int i = g * 8 + k; if (i >= NLV - 1) break; d = min(d, sdCap(p, LV[i].xyz, LV[i + 1].xyz, LV[i].w)); }
    }
    return d;
  }
  vec3 qb(vec3 a, vec3 b, vec3 c, float u) { return mix(mix(a, b, u), mix(b, c, u), u); }
  vec3 qd(vec3 a, vec3 b, vec3 c, float u) { return mix(b - a, c - b, u); }
  void liveFrame(vec3 p, out vec3 nrm, out vec3 ax) {
    float d = 1e5, tk = 0.; int k = 0;
    for (int i = 0; i < 63; i++) {
      if (i >= NLV - 1) break;
      vec3 pa = p - LV[i].xyz, ba = LV[i + 1].xyz - LV[i].xyz; float h = clamp(dot(pa, ba) / dot(ba, ba), 0., 1.), e = length(pa - ba * h);
      if (e < d) { d = e; k = i; tk = h; }
    }
    vec3 a = LV[k].xyz, b = LV[k + 1].xyz, c = mix(a, b, tk), tg = b - a;
    if (tk < .5 && k > 0) { vec3 m0 = (LV[k - 1].xyz + a) * .5, m1 = (a + b) * .5; c = qb(m0, a, m1, tk + .5); tg = qd(m0, a, m1, tk + .5); }
    else if (tk >= .5 && k < NLV - 2) { vec3 m0 = (a + b) * .5, m1 = (b + LV[k + 2].xyz) * .5; c = qb(m0, b, m1, tk - .5); tg = qd(m0, b, m1, tk - .5); }
    ax = normalize(tg); vec3 r = p - c; r -= ax * dot(r, ax); nrm = normalize(r + 1e-5);
  }
  void bendFrame(vec3 p, out vec3 nrm, out vec3 ax, out float rad) {
    float d = 1e5, tk = 0.; int k = 0;
    for (int i = 0; i < 9; i++) {
      vec3 pa = p - BZ[i].xyz, ba = BZ[i + 1].xyz - BZ[i].xyz; float h = clamp(dot(pa, ba) / dot(ba, ba), 0., 1.), e = length(pa - ba * h);
      if (e < d) { d = e; k = i; tk = h; }
    }
    vec3 a = BZ[k].xyz, b = BZ[k + 1].xyz, c = mix(a, b, tk), tg = b - a; rad = mix(BZ[k].w, BZ[k + 1].w, tk);
    if (tk < .5 && k > 0) { vec3 m0 = (BZ[k - 1].xyz + a) * .5, m1 = (a + b) * .5; c = qb(m0, a, m1, tk + .5); tg = qd(m0, a, m1, tk + .5); }
    else if (tk >= .5 && k < 8) { vec3 m0 = (a + b) * .5, m1 = (b + BZ[k + 2].xyz) * .5; c = qb(m0, b, m1, tk - .5); tg = qd(m0, b, m1, tk - .5); }
    ax = normalize(tg); vec3 r = p - c; r -= ax * dot(r, ax); nrm = normalize(r + 1e-5);
    if (p.y > NZ.y + .3) { ax = vec3(0, 1, 0); nrm = normalize(vec3(p.x - NZ.x, 0., p.z - NZ.z)); rad = thR(p.y); }
  }
  float traceLive(vec3 ro, vec3 rd) {
    vec3 oc = ro - LS.xyz; float b = dot(oc, rd), c = dot(oc, oc) - LS.w * LS.w, h = b * b - c;
    if (h < 0. || NLV < 2) return -1.;
    float t = max(-b - sqrt(h), 0.), t1 = -b + sqrt(h);
    for (int i = 0; i < 48; i++) { float d = sdLive(ro + rd * t); if (d < .01) return t; t += d; if (t > t1) break; }
    return -1.;
  }
  // ---- the coil as one liquid: loops and bend joined to the pool surface by a smooth union (a fillet, no seam)
  float sdAll(vec3 p, out float h) {
    float a = min(sdLive(p), sdBend(p)), b = (p.y - Hm(p.xz)) * .8;
    h = clamp(.5 + .5 * (b - a) / KF, 0., 1.); return mix(b, a, h) - KF * h * (1. - h);
  }
  vec2 sph(vec3 ro, vec3 rd, vec4 s) { vec3 oc = ro - s.xyz; float b = dot(oc, rd), c = dot(oc, oc) - s.w * s.w, h = b * b - c; if (h < 0.) return vec2(1e9, -1.); h = sqrt(h); return vec2(-b - h, -b + h); }
  float traceCoil(vec3 ro, vec3 rd, float tmax) {
    vec2 s1 = NLV >= 2 ? sph(ro, rd, LS + vec4(0, 0, 0, KF)) : vec2(1e9, -1.), s2 = sph(ro, rd, BS + vec4(0, 0, 0, KF));
    float t0 = max(min(s1.y > 0. ? s1.x : 1e9, s2.y > 0. ? s2.x : 1e9), 0.), t1 = min(max(s1.y, s2.y), tmax + .05), h;
    if (t0 >= t1) return -1.;
    float t = t0;
    for (int i = 0; i < 90; i++) { float d = sdAll(ro + rd * t, h); if (d < .003 + t * 2e-5) return t; t += d * .85; if (t > t1) break; }
    return -1.;
  }
  // ---- the honey surface: a height field, marched from the top of the tallest pile, inside the bowl only
  float traceH(vec3 ro, vec3 rd, int N) {
    if (rd.y >= 0. && ro.y > HMAX) return -1.;
    float t = ro.y > HMAX ? (HMAX - ro.y) / rd.y : 0., tp = t;
    for (int i = 0; i < 110; i++) {
      if (i >= N) break;
      vec3 p = ro + rd * t; float d = p.y - Hm(p.xz);
      if (d < 0.) {
        for (int j = 0; j < 6; j++) { float tm = (tp + t) * .5; vec3 q = ro + rd * tm; if (q.y - Hm(q.xz) < 0.) t = tm; else tp = tm; }
        return t;
      }
      if (dot(p.xz, p.xz) > RIN * RIN && dot(p.xz, rd.xz) > 0.) return -1.;
      tp = t;
      bool near = max(abs(p.x), abs(p.z)) < LR * .55;
      t += clamp(d * .75 / max(-rd.y, .12), .03, near ? .4 + d * .6 : 8.);
    }
    return rd.y < 0. ? t : -1.;
  }
  // light reaching the porcelain under the honey: absorbed on its way down (amber shadows under the mound and the
  // coil), focused by the curved ropes (caustics), shaded where the thread is in the way
  vec3 floorLight(vec2 x) {
    float y0 = yFl(x);
    vec3 tl = refract(-LD, vec3(0, 1, 0), 1. / ETA), b = vec3(x.x, y0, x.y);
    float path = 0.;
    for (int i = 0; i < 5; i++) {
      vec3 q = b - tl * (float(i) + .5) * 1.8, o = vec3(.42, 0, -.16) * (float(i) + .5);
      path += .9 * (smoothstep(-.9, .9, Hm(q.xz + o.xz) - q.y) + smoothstep(-.9, .9, Hm(q.xz - o.xz) - q.y));
    }
    vec2 sk = x - STK.xy; path += STK.w * exp(-dot(sk, sk) / (STK.z * STK.z));
    float h = Hm(x) - y0, e = .55, lap = (hR(x + vec2(e, 0)) + hR(x - vec2(e, 0)) + hR(x + vec2(0, e)) + hR(x - vec2(0, e)) - 4. * hR(x)) / (e * e);
    float foc = clamp(1. / max(1. + h * (1. - 1. / ETA) * lap * .3, .5), .8, 1.3);
    vec3 thr = vec3(1);
    float ys = y0 + (x.y - NZ.z) * LD.y / -LD.z;
    if (ys > NZ.y - 4.) {
      float a = thR(ys), w = a + .45 * max(ys - h - y0, 0.), dd = abs(x.x - NZ.x), ch = 2. * a * sqrt(max(1. - dd * dd / (w * w), 0.));
      thr = mix(vec3(1), exp(-SIG * ch) * (.6 + 1.1 * exp(-pow(dd / (w * .25), 2.)) * a / w), smoothstep(w, w * .3, dd) * min(1., 2.4 * a / w) * smoothstep(NZ.y - 4., NZ.y + 6., ys));
    }
    return vec3(1., .95, .87) * 1.3 * lightE(x) * foc * exp(-SIG * path) * thr;
  }
  // honey is not quite clear: pollen and fine bubbles scatter a little light, so thick honey glows deep amber
  vec3 glow(float L, vec2 x) { return vec3(1., .62, .2) * .6 * lightE(x) * (1. - exp(-.16 * L)) * exp(-SIG * L * .45); }
  vec3 shadeSurf(vec3 p, vec3 rd, vec3 n, bool mirror) {
    float c = max(dot(n, -rd), 0.), F = .039 + .961 * pow(1. - c, 5.);
    vec3 rr = reflect(rd, n), refl = envScene(p + n * .02, rr, 1.);
    if (mirror) {                                         // the glossy pool mirrors the thread and the coil, dimly
      float tm = traceThread(p + rr * .05, rr);
      if (tm < 0.) tm = traceBend(p + rr * .05, rr);
      if (tm < 0.) tm = traceLive(p + rr * .05, rr);
      if (tm > 0.) refl = studio(rr, 4.) * exp(-SIG * 2.) * .4 + vec3(.9, .5, .15) * .2 * lightE(p.xz);
    }
    vec3 t = refract(rd, n, 1. / ETA);
    float d = max(p.y - yFl(p.xz), 0.), L = d / max(-t.y, .3);
    return refl * F + (floorLight(p.xz + t.xz * L) * exp(-SIG * L) + glow(L + d, p.xz)) * (1. - F);
  }
  vec3 behindAir(vec3 q, vec3 dv) {                        // what a ray leaving the honey into the air sees
    float t = traceH(q + dv * .05, dv, 40);
    if (t > 0.) {
      vec3 p = q + dv * (t + .05), n; float m, td = traceDish(q, dv, n, m);
      if (dot(p.xz, p.xz) < RIN * RIN && (td < 0. || td > t)) return shadeSurf(p, dv, Hnf(p.xz, .1), false);
    }
    return envScene(q, dv, 2.);
  }
  // light through a rope: across its chord, then on down through the honey it rests in, or out into the air behind
  vec3 transRope(vec3 p, vec3 rd, vec3 n, vec3 ax, float a) {
    vec3 t = refract(rd, n, 1. / ETA), tp = t - ax * dot(t, ax); float lp = length(tp);
    float L1 = min(2. * a * clamp(dot(-n, tp / max(lp, 1e-4)), 0., 1.) / max(lp, .2), 5. * a);
    vec3 q = p + t * L1;
    // does it come out into the honey beneath (on down to the porcelain) or into the air? blended across a band
    float wa = smoothstep(.0, .6, min(q.y - Hm(q.xz), sdLive(q))), L2 = max(q.y - yFl(q.xz), 0.) / max(-t.y, .3);
    vec3 cin = floorLight(q.xz + t.xz * L2) * exp(-SIG * (1.4 * L1 + .45 * L2)) + glow(1.4 * L1 + .45 * L2, q.xz);
    if (wa < .01) return cin;
    vec3 ra = ax * dot(rd, ax), rp = rd - ra; float lr = length(rp); vec3 u = rp / max(lr, 1e-5);
    float ci = clamp(dot(u, -n), 0., 1.), si = sqrt(1. - ci * ci), dv0 = 2. * (acos(ci) - asin(si / ETA));
    vec3 w = normalize(-n - ci * u + 1e-5 * ax), dv = normalize(ra + lr * (cos(dv0) * u + sin(dv0) * w));
    return mix(cin, behindAir(q, dv) * exp(-SIG * 1.6 * L1) + glow(1.6 * L1 + .6, q.xz), wa);
  }
  vec3 shadeHoney(vec3 p, vec3 rd, vec3 ns, vec3 nr, vec3 ax, float a, float h) {
    vec3 n = normalize(mix(ns, nr, h));
    float c = max(dot(n, -rd), 0.), F = .039 + .961 * pow(1. - c, 5.);
    vec3 refl = envScene(p + n * .03, reflect(rd, n), 1.), tr = vec3(0);
    vec3 rr = reflect(rd, n);            // two cards close by, left and right: the crisp lines along the thread and the loops
    refl += vec3(2.4, 2.5, 2.6) * box(rr, vec4(-.8, -.1, -2.1, -1.05), .03) + vec3(1.3, 1.1, .85) * box(rr, vec4(-.8, -.1, 1.15, 2.0), .03);
    if (h < .98) { vec3 t = refract(rd, n, 1. / ETA); float d = max(p.y - yFl(p.xz), 0.), L = d / max(-t.y, .3); tr = floorLight(p.xz + t.xz * L) * exp(-SIG * L) + glow(L + d, p.xz); }
    if (h > .02) tr = mix(tr, transRope(p, rd, n, ax, a), h);
    return refl * F + tr * (1. - F);
  }
  vec3 aces(vec3 x) { return clamp((x * (2.51 * x + .03)) / (x * (2.43 * x + .59) + .14), 0., 1.); }
  float hsh(vec2 p) { vec3 q = fract(p.xyx * .1031); q += dot(q, q.yzx + 33.33); return fract((q.x + q.y) * q.z); }
  void main() {
    vec2 sp = (gl_FragCoord.xy / R - .5) * vec2(R.x / R.y, 1.);
    vec3 rd = normalize(CF * FOC + CR * sp.x + CU * sp.y), ro = CP, nd; float md, td = traceDish(ro, rd, nd, md);
    if (td < 0.) td = 1e9;
    float th = traceH(ro, rd, 110);
    if (th > 0.) { vec3 p = ro + rd * th; if (dot(p.xz, p.xz) > RIN * RIN || th > td) th = 1e9; } else th = 1e9;
    float tc = traceCoil(ro, rd, min(th, td)), tt = traceThread(ro, rd);
    if (tc < 0.) tc = 1e9; if (tt < 0.) tt = 1e9;
    vec3 col;
    if (tt < tc && tt < th && tt < td) {
      vec3 p = ro + rd * tt, r = vec3(p.x - NZ.x, 0., p.z - NZ.z);
      vec3 n = normalize(r / max(length(r), 1e-4) - vec3(0, A1 * .047 * pow(1. + max(p.y - NZ.y, 0.) / 9., -.58), 0));
      col = shadeHoney(p, rd, n, n, vec3(0, 1, 0), thR(p.y), 1.);
    } else if (tc < 1e8 && tc <= th + .02 && tc < td) {
      vec3 p = ro + rd * tc, nr, ax; float h, a = CA; sdAll(p, h);
      if (h < .02) col = shadeSurf(p, rd, Hn(p.xz, .085), true);
      else {
        if (sdLive(p) < sdBend(p)) liveFrame(p, nr, ax); else bendFrame(p, nr, ax, a);
        // the normal from the gradient of the whole joined field: smooth across the bend's joint and the fillet
        const vec2 k = vec2(1, -1) * .03; float hh;
        vec3 ng = normalize(k.xyy * sdAll(p + k.xyy, hh) + k.yyx * sdAll(p + k.yyx, hh) + k.yxy * sdAll(p + k.yxy, hh) + k.xxx * sdAll(p + k.xxx, hh));
        col = shadeHoney(p, rd, ng, ng, ax, a, h);
      }
    } else if (th < td) { vec3 p = ro + rd * th; col = shadeSurf(p, rd, Hn(p.xz, .085), true); }
    else if (td < 1e8) col = shadeDish(ro + rd * td, rd, nd, md, 1.);
    else col = studio(rd, 1.);
    col = aces(col * EXPO);
    vec2 uv = gl_FragCoord.xy / R;
    col *= 1. - .35 * pow(length(uv - .5) * 1.3, 2.4);
    o = vec4(pow(col, vec3(1. / 2.2)) + (hsh(gl_FragCoord.xy) - .5) / 255., 1);
  }`;

  // ---------------------------------------------------------------- GL plumbing
  const shader = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s)); return s; };
  const program = fs => {
    const p = gl.createProgram(); gl.attachShader(p, shader(gl.VERTEX_SHADER, VQ)); gl.attachShader(p, shader(gl.FRAGMENT_SHADER, fs));
    gl.bindAttribLocation(p, 0, 'p'); gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
    const u = {}, n = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS);
    for (let i = 0; i < n; i++) { const a = gl.getActiveUniform(p, i); u[a.name.replace(/\[0\]$/, '')] = gl.getUniformLocation(p, a.name); }
    return { p, u };
  };
  const P = { blur: program(FS_BLUR), dep: program(FS_DEP), main: program(FS_MAIN) };
  const vao = gl.createVertexArray(); gl.bindVertexArray(vao);
  const vbo = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  const FMT = linF ? gl.R32F : gl.R16F;
  const mkTex = (n, fmt, filter) => {
    const t = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, t); gl.texStorage2D(gl.TEXTURE_2D, 1, fmt, n, n);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filter); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filter);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    return t;
  };
  const texB = mkTex(NB, FMT, gl.LINEAR);
  const rT = [mkTex(NR, FMT, gl.LINEAR), mkTex(NR, FMT, gl.LINEAR)];
  const rF = rT.map(t => { const f = gl.createFramebuffer(); gl.bindFramebuffer(gl.FRAMEBUFFER, f); gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, t, 0); gl.clearColor(0, 0, 0, 1); gl.clear(gl.COLOR_BUFFER_BIT); return f; });
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  const quad = () => { gl.bindVertexArray(vao); gl.drawArrays(gl.TRIANGLES, 0, 3); };
  const bind = (u, unit, t) => { gl.activeTexture(gl.TEXTURE0 + unit); gl.bindTexture(gl.TEXTURE_2D, t); gl.uniform1i(u, unit); };

  // ---------------------------------------------------------------- the mound: thin-film spreading, implicit (ADI)
  const B = new Float32Array(NB * NB).fill(H0);
  {                                                  // start from the steady dome that a constant pour builds
    const Q = Math.PI * AL * AL * 2 * Math.PI * RC0 * Math.sqrt(FLOW) * FREQ, c = 2 * Q / (Math.PI * KB), R0 = LB / 2;
    for (let j = 0; j < NB; j++) for (let i = 0; i < NB; i++) {
      const r = Math.hypot((i + 0.5) * DXB - R0, (j + 0.5) * DXB - R0), rr = Math.hypot(r, RC0 * 1.3);
      B[j * NB + i] = r >= R0 ? H0 : Math.pow(H0 ** 4 + c * Math.log(R0 / Math.min(rr, R0)), 0.25);
    }
  }
  const ta = new Float64Array(NB), tb = new Float64Array(NB), tc = new Float64Array(NB), td = new Float64Array(NB), tx = new Float64Array(NB);
  const thomas = n => { for (let i = 1; i < n; i++) { const m = ta[i] / tb[i - 1]; tb[i] -= m * tc[i - 1]; td[i] -= m * td[i - 1]; } tx[n - 1] = td[n - 1] / tb[n - 1]; for (let i = n - 2; i >= 0; i--) tx[i] = (td[i] - tc[i] * tx[i + 1]) / tb[i]; };
  let maxB = H0;
  function stepB(dt) {
    const r = dt / (DXB * DXB);
    for (let pass = 0; pass < 2; pass++) {
      const s0 = pass ? NB : 1, s1 = pass ? 1 : NB;            // pass 0 sweeps along x, pass 1 along z
      for (let j = 1; j < NB - 1; j++) {
        for (let i = 0; i < NB; i++) {
          const k = j * s0 + i * s1, h = B[k];
          if (i === 0 || i === NB - 1) { ta[i] = 0; tb[i] = 1; tc[i] = 0; td[i] = H0; continue; }
          const hm = (h + B[k - s1]) * 0.5, hp = (h + B[k + s1]) * 0.5;
          const dm = KB * hm * hm * hm * r, dp = KB * hp * hp * hp * r;
          ta[i] = -dm; tb[i] = 1 + dm + dp; tc[i] = -dp; td[i] = h;
        }
        thomas(NB);
        for (let i = 0; i < NB; i++) B[j * s0 + i * s1] = tx[i];
      }
    }
    maxB = H0; for (let i = 0; i < B.length; i++) if (B[i] > maxB) maxB = B[i];
  }
  const splatB = (x, z, vol) => {
    const fx = (x + LB / 2) / DXB - 0.5, fz = (z + LB / 2) / DXB - 0.5, i = Math.floor(fx), j = Math.floor(fz), u = fx - i, v = fz - j, h = vol / (DXB * DXB);
    if (i < 1 || j < 1 || i >= NB - 2 || j >= NB - 2) return;
    B[j * NB + i] += h * (1 - u) * (1 - v); B[j * NB + i + 1] += h * u * (1 - v); B[(j + 1) * NB + i] += h * (1 - u) * v; B[(j + 1) * NB + i + 1] += h * u * v;
  };
  const sampleB = (x, z) => {
    const fx = (x + LB / 2) / DXB - 0.5, fz = (z + LB / 2) / DXB - 0.5, i = Math.max(0, Math.min(NB - 2, Math.floor(fx))), j = Math.max(0, Math.min(NB - 2, Math.floor(fz))), u = Math.min(1, Math.max(0, fx - i)), v = Math.min(1, Math.max(0, fz - j));
    return (B[j * NB + i] * (1 - u) + B[j * NB + i + 1] * u) * (1 - v) + (B[(j + 1) * NB + i] * (1 - u) + B[(j + 1) * NB + i + 1] * u) * v;
  };

  // ---------------------------------------------------------------- the rope: fresh loops as tubes, then the field
  // A loop stays a round rope for TLIVE seconds while it sinks by its radius; it rests on the surface or on the loop
  // beneath it. Then it melts into the height field as exactly the half that still shows, and fades into the mound.
  const TLIVE = 1.25, SINK = AL / TLIVE;
  const live = [];                            // points along the fresh rope {x, y, z, age}, oldest first
  const rsegs = [];                           // rope melted into the field {x0, z0, x1, z1, rel, vol, age}
  const ropeAt = (x, z) => {                  // the field's rope height under a point (the GPU keeps the highest)
    let h = 0;
    for (const s of rsegs) {
      const ax = s.x1 - s.x0, az = s.z1 - s.z0, l = ax * ax + az * az, t = l > 1e-9 ? Math.max(0, Math.min(1, ((x - s.x0) * ax + (z - s.z0) * az) / l)) : 0;
      const dx = x - s.x0 - ax * t, dz = z - s.z0 - az * t, d2 = dx * dx + dz * dz;
      if (d2 < AL * AL) h = Math.max(h, (s.rel + Math.sqrt(AL * AL - d2)) * Math.exp(-s.age / TAU));
    }
    return h;
  };
  const landY = (x, z) => {
    let y = sampleB(x, z) + ropeAt(x, z) + AL;
    const recent = 0.3 / FREQ, r2 = 4 * AL * AL;
    for (const p of live) { if (p.age < recent) continue; const d2 = (p.x - x) ** 2 + (p.z - z) ** 2; if (d2 < r2) y = Math.max(y, p.y + Math.sqrt(r2 - d2)); }
    return y;
  };
  const DEP = new Float32Array(32), DEPY = new Float32Array(16); let nDep = 0;

  // the pour: a nozzle that drifts (or follows the pointer), a coil centre that lags it, a contact point circling
  const noz = { x: 0, z: 0, vx: 0, vz: 0 }, coil = { phi: 0, x: RC0, z: 0, dir: 1, fold: false };
  const hash1 = n => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
  const sstep = (a, b, x) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
  const nz1 = (t, k) => { const i = Math.floor(t), f = t - i, u = f * f * (3 - 2 * f); return hash1(i + k * 57) * (1 - u) + hash1(i + 1 + k * 57) * u; };   // smooth 1D noise in 0..1
  let simT = 0, contactY = H0 + AL;
  let px = 0.5, py = 0.5, lastMove = -1e9, held = false;
  function advance(dt, follow, target) {
    simT += dt;
    const tx_ = follow ? target[0] : 2.2 * Math.sin(simT * 0.19) + 0.7 * Math.sin(simT * 0.43), tz_ = follow ? target[1] : 1.5 * Math.sin(simT * 0.15 + 1.3);
    const sub = 4, h = dt / sub, spacing = Math.max(0.6, 2 * Math.PI * RC0 * Math.sqrt(FLOW) * FREQ * TLIVE / 58);
    for (let s = 0; s < sub; s++) {
      noz.vx += (40 * (tx_ - noz.x) - 11 * noz.vx) * h; noz.vz += (40 * (tz_ - noz.z) - 11 * noz.vz) * h;
      noz.x += noz.vx * h; noz.z += noz.vz * h;
      // the coil is never quite steady: its radius and pace wander, it tightens as the pile rises toward the nozzle,
      // and now and then it flattens into folding, the rope swinging back and forth, and may come out of it turning
      // the other way, as real coiling honey does
      const pile = Math.min(1, Math.max(0, (contactY - H0 - AL) / 6));
      const rc = RC0 * (0.8 + 0.34 * nz1(simT * 0.37, 1) + 0.05 * Math.sin(simT * 2.3)) * (1 - 0.22 * pile) * Math.sqrt(FLOW);
      coil.phi += coil.dir * 2 * Math.PI * FREQ * (0.84 + 0.3 * nz1(simT * 0.5, 2)) * h;
      const ecc = 0.9 * sstep(0.6, 0.82, nz1(simT * 0.12, 3)), psi = simT * 0.06 + 3 * nz1(simT * 0.05, 4);
      if (ecc > 0.8 && !coil.fold) { coil.fold = true; if (hash1(Math.floor(simT * 0.12) + 7.3) > 0.5) coil.dir = -coil.dir; }
      else if (ecc < 0.5) coil.fold = false;
      // the coil's centre trails the nozzle and slowly precesses, so loops land beside each other as well as on top
      let cx = noz.x - noz.vx * 0.32 + 1.2 * Math.cos(simT * 0.83), cz = noz.z - noz.vz * 0.32 + 1.2 * Math.sin(simT * 0.83);
      cx = Math.max(-12, Math.min(12, cx)); cz = Math.max(-12, Math.min(12, cz));
      const ux = rc * Math.cos(coil.phi), uz = rc * (1 - ecc) * Math.sin(coil.phi), cs = Math.cos(psi), sn = Math.sin(psi);
      coil.x = cx + ux * cs - uz * sn; coil.z = cz + ux * sn + uz * cs;
      const lp = live[live.length - 1];
      if (!lp || Math.hypot(coil.x - lp.x, coil.z - lp.z) >= spacing) live.push({ x: coil.x, z: coil.z, y: landY(coil.x, coil.z), age: 0 });
    }
    // rope sinks into the honey, and a stack sinks faster the higher it stands: its weight pushes it down
    for (const p of live) { p.age += dt; const above = Math.max(0, p.y - AL - sampleB(p.x, p.z)); p.y -= (SINK + 1.6 * above) * dt; }   // melted rope is too soft to hold it up
    nDep = 0;
    while (live.length > 2 && live[0].age > TLIVE && nDep < 8) {
      const a = live[0], b = live[1], len = Math.hypot(b.x - a.x, b.z - a.z), yc = (a.y + b.y) / 2, mx = (a.x + b.x) / 2, mz = (a.z + b.z) / 2;
      const rel = yc - sampleB(mx, mz), f = Math.max(0, Math.min(1, (rel + AL) / (2 * AL))), vol = Math.PI * AL * AL * len;
      DEP.set([a.x, a.z, b.x, b.z], nDep * 4); DEPY[nDep * 2] = AL; DEPY[nDep * 2 + 1] = yc; nDep++;
      splatB(mx, mz, vol * (1 - f));
      rsegs.push({ x0: a.x, z0: a.z, x1: b.x, z1: b.z, rel, vol: vol * f, age: 0 });
      live.shift();
    }
    // melted rope fades on the GPU at the same rate; the volume it loses goes into the mound
    const k = Math.exp(-dt / TAU);
    for (let i = rsegs.length - 1; i >= 0; i--) {
      const s = rsegs[i], e0 = Math.exp(-s.age / TAU);
      s.age += dt;
      const gone = s.age > 5 * TAU;
      splatB((s.x0 + s.x1) / 2, (s.z0 + s.z1) / 2, gone ? s.vol * e0 : s.vol * e0 * (1 - k));
      if (gone) rsegs.splice(i, 1);
    }
    stepB(dt);
    contactY += (landY(coil.x, coil.z) - contactY) * Math.min(1, dt * 25);
    return k;
  }
  // the GPU side of one step: blur and fade the melted rope, then melt in the loops that have sunk
  let cur = 0;
  function gpuStep(k) {
    gl.viewport(0, 0, NR, NR);
    let u = (gl.useProgram(P.blur.p), P.blur.u);
    gl.bindFramebuffer(gl.FRAMEBUFFER, rF[1 - cur]); bind(u.S, 0, rT[cur]); gl.uniform2f(u.DIR, 1, 0); gl.uniform1f(u.K, k); gl.uniform1f(u.BL, 0.35); quad();
    gl.bindFramebuffer(gl.FRAMEBUFFER, rF[cur]); bind(u.S, 0, rT[1 - cur]); gl.uniform2f(u.DIR, 0, 1); gl.uniform1f(u.K, 1); quad();
    u = (gl.useProgram(P.dep.p), P.dep.u);
    gl.bindFramebuffer(gl.FRAMEBUFFER, rF[1 - cur]); bind(u.S, 0, rT[cur]); bind(u.TB, 1, texB);
    gl.uniform4fv(u.SEG, DEP); gl.uniform2fv(u.SY, DEPY); gl.uniform1i(u.NS, nDep); gl.uniform1f(u.LR, LR); gl.uniform1f(u.LB, LB); quad();
    cur = 1 - cur;
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  }
  const uploadB = () => { gl.bindTexture(gl.TEXTURE_2D, texB); gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, NB, NB, gl.RED, gl.FLOAT, B); };

  // ---------------------------------------------------------------- camera: low and close, a macro lens
  const FOC0 = 4.5, EL = 0.47, DIST = 125, TGT = [0, 9, -7];   // a high three-quarter view into the bowl
  let FOC = FOC0;
  const cam = { p: [TGT[0], TGT[1] + Math.sin(EL) * DIST, TGT[2] + Math.cos(EL) * DIST], f: [0, -Math.sin(EL), -Math.cos(EL)], r: [1, 0, 0], u: [0, Math.cos(EL), -Math.sin(EL)] };
  let W = 1, H = 1;
  const resize = () => { const w = stage.clientWidth || 1, h = stage.clientHeight || 1, d = Math.min(devicePixelRatio, 2, Math.max(0.5, Math.sqrt(580000 / (w * h)))); W = canvas.width = Math.max(1, (w * d) | 0); H = canvas.height = Math.max(1, (h * d) | 0); FOC = FOC0 * Math.min(1, w / h / 1.15); dirty = true; };
  let dirty = true;
  const ro = new ResizeObserver(resize); ro.observe(stage); resize();
  const onMove = e => { const b = canvas.getBoundingClientRect(); px = (e.clientX - b.left) / b.width; py = (e.clientY - b.top) / b.height; lastMove = performance.now(); held = e.pointerType === 'mouse'; };
  const onLeave = () => { held = false; };
  canvas.addEventListener('pointermove', onMove); canvas.addEventListener('pointerdown', onMove); canvas.addEventListener('pointerleave', onLeave);
  const pointerOnPool = () => {
    const a = W / H, sx = (px - 0.5) * a, sy = 0.5 - py, d = cam.f.map((f, i) => f * FOC + cam.r[i] * sx + cam.u[i] * sy);
    if (d[1] > -1e-3) return [0, 0];
    const t = (H0 + 2 - cam.p[1]) / d[1];
    return [Math.max(-11, Math.min(11, cam.p[0] + d[0] * t)), Math.max(-11, Math.min(9, cam.p[2] + d[2] * t))];
  };

  // ---------------------------------------------------------------- frame
  const BZU = new Float32Array(40);
  function bezier() {
    const rc = Math.hypot(coil.x - noz.x, coil.z - noz.z) || RC0, tgx = -Math.sin(coil.phi), tgz = Math.cos(coil.phi);
    const hb = 1.45 * rc + 1.6, yb = contactY + hb;
    const P0 = [noz.x, yb, noz.z], P1 = [noz.x, yb - 0.62 * hb, noz.z], P3 = [coil.x, contactY, coil.z], P2 = [coil.x - tgx * 0.95 * rc, contactY + 0.22 * hb, coil.z - tgz * 0.95 * rc];
    let cx = 0, cy = 0, cz = 0, rad = 0;
    for (let i = 0; i < 10; i++) {
      const t = i / 9, m = 1 - t, a = m * m * m, b = 3 * m * m * t, c = 3 * m * t * t, d = t * t * t;
      const x = a * P0[0] + b * P1[0] + c * P2[0] + d * P3[0], y = a * P0[1] + b * P1[1] + c * P2[1] + d * P3[1], z = a * P0[2] + b * P1[2] + c * P2[2] + d * P3[2];
      const r = A1 + (AL - A1) * t * t * (3 - 2 * t);
      BZU.set([x, y, z, r], i * 4); cx += x / 10; cy += y / 10; cz += z / 10;
    }
    for (let i = 0; i < 10; i++) rad = Math.max(rad, Math.hypot(BZU[i * 4] - cx, BZU[i * 4 + 1] - cy, BZU[i * 4 + 2] - cz) + BZU[i * 4 + 3]);
    return { yb, bs: [cx, cy, cz, rad + 0.3] };
  }
  const LVU = new Float32Array(256), LGU = new Float32Array(32);
  function packLive() {
    const pts = live.slice(-63); pts.push({ x: coil.x, y: contactY, z: coil.z });
    const n = pts.length; let cx = 0, cy = 0, cz = 0, rad = 0;
    pts.forEach((p, i) => { LVU.set([p.x, p.y, p.z, AL], i * 4); cx += p.x / n; cy += p.y / n; cz += p.z / n; });
    pts.forEach(p => { rad = Math.max(rad, Math.hypot(p.x - cx, p.y - cy, p.z - cz)); });
    for (let g = 0; g < 8; g++) {
      const i0 = g * 8, i1 = Math.min(n - 1, i0 + 8); if (i0 >= n - 1) { LGU.set([0, -1e4, 0, 0], g * 4); continue; }
      let gx = 0, gy = 0, gz = 0, gr = 0; for (let i = i0; i <= i1; i++) { gx += pts[i].x; gy += pts[i].y; gz += pts[i].z; }
      const m = i1 - i0 + 1; gx /= m; gy /= m; gz /= m;
      for (let i = i0; i <= i1; i++) gr = Math.max(gr, Math.hypot(pts[i].x - gx, pts[i].y - gy, pts[i].z - gz));
      LGU.set([gx, gy, gz, gr + AL + 0.05], g * 4);
    }
    let sh = 0; pts.forEach(p => { sh += Math.max(0, p.y + AL - sampleB(p.x, p.z)) / n; });
    return { n, ls: [cx, cy, cz, rad + AL + 0.2], stk: [cx, cz, Math.max(1.5, Math.hypot(coil.x - cx, coil.z - cz) + AL), sh * 0.45] };
  }
  function draw() {
    const bz = bezier(), lv = packLive();
    uploadB();
    const u = (gl.useProgram(P.main.p), P.main.u);
    gl.viewport(0, 0, W, H);
    bind(u.TB, 0, texB); bind(u.TR, 1, rT[cur]);
    gl.uniform4fv(u.BZ, BZU); gl.uniform4fv(u.BS, bz.bs); gl.uniform3f(u.NZ, noz.x, bz.yb, noz.z);
    gl.uniform4fv(u.LV, LVU); gl.uniform4fv(u.LG, LGU); gl.uniform1i(u.NLV, lv.n); gl.uniform4fv(u.LS, lv.ls);
    gl.uniform1f(u.A1, A1); gl.uniform1f(u.HMAX, Math.max(maxB, contactY + AL) + AL * 1.2 + 0.4); gl.uniform1f(u.H0, H0);
    gl.uniform1f(u.LB, LB); gl.uniform1f(u.LR, LR); gl.uniform1f(u.EXPO, 0.86);
    gl.uniform2f(u.CC, coil.x, coil.z); gl.uniform1f(u.CA, AL);
    const hl = (sampleB(0, -21) + sampleB(21, 0) + sampleB(-21, 0) + sampleB(0, 21)) / 4, rs = 30 * Math.sqrt(Math.max(0, 1 - ((10 - hl) / 10) ** 2));
    gl.uniform1f(u.HL, hl); gl.uniform1f(u.RS, rs); gl.uniform4fv(u.STK, lv.stk);
    gl.uniform3fv(u.CP, cam.p); gl.uniform3fv(u.CF, cam.f); gl.uniform3fv(u.CR, cam.r); gl.uniform3fv(u.CU, cam.u); gl.uniform1f(u.FOC, FOC); gl.uniform2f(u.R, W, H);
    quad();
  }
  // start with a mound already built: a few seconds of pouring before the first frame
  for (let i = 0; i < 300; i++) { gpuStep(advance(1 / 30, false, null)); if (i % 10 === 9) uploadB(); }
  let raf, last = performance.now();
  function frame(now) {
    const dt = Math.min(1 / 30, Math.max(0, (now - last) / 1000)); last = now;
    if (!reduce) {
      const live = held || now - lastMove < 1800;
      gpuStep(advance(dt, live, live ? pointerOnPool() : null));
      draw();
    } else if (dirty) { draw(); dirty = false; }
    raf = requestAnimationFrame(frame);
  }
  raf = requestAnimationFrame(frame);
  return () => {
    cancelAnimationFrame(raf); ro.disconnect();
    canvas.removeEventListener('pointermove', onMove); canvas.removeEventListener('pointerdown', onMove); canvas.removeEventListener('pointerleave', onLeave);
    gl.getExtension('WEBGL_lose_context')?.loseContext(); canvas.remove();
  };
}
