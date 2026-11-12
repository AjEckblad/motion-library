// Portal: a carved stone gate stands half-buried in a desert at golden hour, and through its opening you see another
// world: a night sea under a ringed planet and curtains of aurora. It is not a picture on a disc. Every pixel's ray is
// raymarched through the desert (dunes with wind ripples, long shadows, warm haze, heat shimmer on the horizon), and if
// it reaches the plane of the opening inside the ring, the rest of its journey is traced in the other world from that
// point, so the view through the gate has true parallax. The opening is a membrane: it bends those rays slightly, so it
// shimmers, and it rings with a wave when the camera breaks through. The camera flies a figure of eight whose crossing
// point is the centre of the gate: through into the night, a banking turn, back through into the day, so it loops with
// no cut. Each crossing flashes and the exposure adapts to the new world like eyes do. The planet is an analytic
// sphere with banded 3D noise, lit from one side, with rings that shadow it; the aurora is a stack of thin layers
// sampling curtain lines, each sample widened by its spacing so the curtains stay smooth; the sea's normals come
// from a sum of swells scaled by `waves`, and it reflects the sky, the gate and, through the opening, the day.
const PARAMS = { speed: 1, glow: 1, waves: 1 };

export default function (stage) {
  const canvas = document.createElement('canvas');
  canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block';
  stage.append(canvas);
  const gl = canvas.getContext('webgl2', { antialias: false });
  if (!gl) { stage.textContent = 'This needs WebGL2.'; return () => canvas.remove(); }
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const nrm = v => { const l = Math.hypot(...v); return v.map(x => x / l); };
  const v3 = v => `vec3(${v.map(x => x.toFixed(5)).join(', ')})`;
  const FS = `#version 300 es
  precision highp float; in vec2 uv; out vec4 o;
  uniform vec2 R; uniform float T, WORLD, GLOW, WAV, FLASH, EXPO, RIPT, NEAR; uniform vec3 CP, CF, CR, CU;
  #define PI 3.14159265
  const vec3 GC = vec3(0., 1.45, 0.);                       // the gate's centre; its opening lies in the plane z = 0
  const float RM = 1.25, RW = .2, RD = .19, RIN = 1.05, NB = 13., FOC = 1.8;
  const vec3 SUN = ${v3(nrm([-1, 0.26, -0.18]))};      // the desert's low sun
  const vec3 PD = ${v3(nrm([0.075, 0.118, -1]))};         // the night world's planet, and the light that falls on it
  const vec3 LP = ${v3(nrm([1, 0.3, 0.25]))};
  const vec3 PAX = ${v3(nrm([0.35, 1, 0.55]))};
  const float PS = .085;

  float h21(vec2 p) { vec3 q = fract(p.xyx * .1031); q += dot(q, q.yzx + 33.33); return fract((q.x + q.y) * q.z); }
  float h31(vec3 p) { p = fract(p * .1031); p += dot(p, p.zyx + 31.32); return fract((p.x + p.y) * p.z); }
  vec3 h33(vec3 p) { p = fract(p * vec3(.1031, .103, .0973)); p += dot(p, p.yxz + 33.33); return fract((p.xxy + p.yxx) * p.zyx); }
  float vn(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
    return mix(mix(h21(i), h21(i + vec2(1, 0)), f.x), mix(h21(i + vec2(0, 1)), h21(i + 1.), f.x), f.y); }
  float vn3(vec3 p) { vec3 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
    return mix(mix(mix(h31(i), h31(i + vec3(1, 0, 0)), f.x), mix(h31(i + vec3(0, 1, 0)), h31(i + vec3(1, 1, 0)), f.x), f.y),
               mix(mix(h31(i + vec3(0, 0, 1)), h31(i + vec3(1, 0, 1)), f.x), mix(h31(i + vec3(0, 1, 1)), h31(i + 1.), f.x), f.y), f.z); }
  float fbm(vec2 p) { float a = 0., b = .5; for (int i = 0; i < 4; i++) { a += b * vn(p); p = mat2(1.6, 1.2, -1.2, 1.6) * p; b *= .5; } return a; }
  float sg(vec2 p, vec2 a, vec2 b) { vec2 pa = p - a, ba = b - a; return length(pa - ba * clamp(dot(pa, ba) / dot(ba, ba), 0., 1.)); }
  vec3 aces(vec3 x) { return clamp((x * (2.51 * x + .03)) / (x * (2.43 * x + .59) + .14), 0., 1.); }

  // ---- the desert: a basin round the gate, great dunes beyond it, crests with a gentle windward face and a steep lee
  float dunes(vec2 p) {
    vec2 c = vec2(p.x * (p.x < 0. ? .6 : 1.15), p.y - clamp(p.y, -1.5, 8.8));     // a corridor kept clear for the flight
    float far = smoothstep(2.5, 15., length(c) + 3. * vn(p * .09) - 1.5);
    vec2 w = p + 13. * vec2(vn(p * .055), vn(p * .055 + 31.7));
    float f = fract(dot(w, vec2(.83, .55)) * .085);
    float rg = min(f / .7, (1. - f) / .3); rg = rg * rg * (2. - rg);
    return rg * (.35 + .65 * vn(p * .028 + 7.)) * mix(.55 * smoothstep(1.6, 4.5, length(p)), 3.4, far) + (vn(p * .017) - .45) * 5. * far + .22 * vn(p * .13) - .14;
  }
  float marchSand(vec3 ro, vec3 rd, float tmax) {
    float t = .01; tmax = min(tmax, 220.);
    for (int i = 0; i < 160; i++) {
      vec3 p = ro + rd * t; float d = p.y - dunes(p.xz);
      if (d < .0015 * t) return t;
      if (t > tmax || (p.y > 6.6 && rd.y > 0.)) break;
      t += max(d * .45, .003 * t);
    }
    return 1e9;
  }

  // ---- the gate: thirteen carved blocks round a ring with a keystone at the top, two footing blocks and a dais
  float sdBox(vec3 p, vec3 b, float r) { vec3 q = abs(p) - b + r; return length(max(q, 0.)) + min(max(q.x, max(q.y, q.z)), 0.) - r; }
  float ring(vec3 q) {
    float a = atan(q.y, q.x), s = (a + PI * .5) / (2. * PI) * NB, id = mod(floor(s), NB), fs = fract(s) - .5;
    float rl = length(q.xy), key = step(abs(id - 6.), .5);
    vec3 hb = h33(vec3(id, 3.1, 7.7));
    vec2 e = abs(vec2(length(q.xy) - RM - .06 * key - (hb.x - .5) * .03, q.z)) - vec2(RW + .06 * key, RD + .03 * key + (hb.y - .5) * .028) + .035;
    float d = length(max(e, 0.)) + min(max(e.x, e.y), 0.) - .035;
    float gd = (.5 - abs(fs)) * (2. * PI / NB) * rl - .009;        // the joint between two blocks
    return max(d, min(-gd, d + .03));
  }
  float gate(vec3 p) {
    float d = ring(p - GC);
    d = min(d, sdBox(vec3(abs(p.x) - .98, p.y - .32, p.z), vec3(.3), .03));
    return min(d, sdBox(p - vec3(0., -.06, 0.), vec3(1.75, .18, .62), .04));
  }
  vec2 boxT(vec3 ro, vec3 rd) {
    vec3 inv = 1. / rd, t0 = (vec3(-1.82, -.28, -.7) - ro) * inv, t1 = (vec3(1.82, 3.04, .7) - ro) * inv;
    vec3 a = min(t0, t1), b = max(t0, t1);
    return vec2(max(max(a.x, a.y), a.z), min(min(b.x, b.y), b.z));
  }
  float marchGate(vec3 ro, vec3 rd, float tmax) {
    vec2 b = boxT(ro, rd);
    if (b.x > b.y || b.y < 0. || b.x > tmax) return 1e9;
    float t = max(b.x, 0.), te = min(b.y, tmax);
    for (int i = 0; i < 90; i++) {
      float d = gate(ro + rd * t);
      if (d < .0007 * (1. + t)) return t;
      t += d; if (t > te) break;
    }
    return 1e9;
  }
  vec3 gateN(vec3 p) { vec2 e = vec2(.0015, -.0015); return normalize(e.xyy * gate(p + e.xyy) + e.yyx * gate(p + e.yyx) + e.yxy * gate(p + e.yxy) + e.xxx * gate(p + e.xxx)); }

  float shadowA(vec3 p) {                 // toward the sun: the dunes, then the gate if the ray passes near it
    float s = 1., t = .04;
    for (int i = 0; i < 24; i++) {
      vec3 q = p + SUN * t; float h = q.y - dunes(q.xz);
      s = min(s, 9. * h / t);
      if (s < .01 || q.y > 6.6) break;
      t += .08 + t * .28;
    }
    vec2 b = boxT(p, SUN);
    if (b.x < b.y && b.y > 0. && s > .01) {
      float t = max(b.x, .02);
      for (int i = 0; i < 28; i++) { float d = gate(p + SUN * t); s = min(s, 7. * d / t); if (s < .01 || t > b.y) break; t += clamp(d, .015, .3); }
    }
    return smoothstep(0., 1., clamp(s, 0., 1.));
  }

  // ---- skies
  vec3 skyBaseA(vec3 d) {
    float s = max(dot(d, SUN), 0.);
    float y = smoothstep(-.02, .65, d.y), az = .5 + .5 * dot(normalize(vec3(d.x, 0., d.z) + 1e-4), normalize(vec3(SUN.x, 0., SUN.z)));
    vec3 hor = mix(vec3(.5, .42, .5), vec3(1., .56, .27), az * az);             // mauve away from the sun, gold toward it
    vec3 c = mix(mix(hor, mix(vec3(.38, .45, .6), vec3(.6, .56, .52), az), smoothstep(0., .3, y)), vec3(.08, .2, .5), smoothstep(.2, 1., y));
    c = mix(c, vec3(1.25, .62, .28), pow(s, 4.) * .7 * smoothstep(.5, -.05, d.y));     // the horizon burns where the sun is
    float anti = max(dot(normalize(vec3(-d.x, 0., -d.z) + 1e-4), normalize(vec3(SUN.x, 0., SUN.z))), 0.);
    c += vec3(.3, .1, .14) * anti * anti * exp(-max(d.y - .04, 0.) * 9.) * smoothstep(-.02, .06, d.y);   // the pink band opposite the sun
    return c + vec3(1., .5, .2) * pow(s, 30.) * .7;
  }
  vec3 skyA(vec3 d) {
    vec3 c = skyBaseA(d);
    float s = max(dot(d, SUN), 0.);
    c += vec3(1., .85, .6) * pow(s, 500.) * 2.5 + vec3(30.) * smoothstep(.99985, .99993, s);
    if (d.y > 0.) {                      // thin high cirrus, combed by the wind and lit from below by the low sun
      vec2 cp = d.xz / (d.y + .1) * .8;
      float cl = fbm(vec2(dot(cp, vec2(.55, -.83)) * 1.1, dot(cp, vec2(.83, .55)) * 4.) + vec2(T * .004, 0.));
      cl = smoothstep(.58, .9, cl) * smoothstep(0., .25, d.y);
      c = mix(c, mix(vec3(.95, .62, .5), vec3(1.5, .8, .42), pow(s, 3.)), cl * .45);
    }
    return mix(c, vec3(.9, .66, .46), exp(-abs(d.y) * 16.) * .25);   // dust low on the horizon
  }
  vec3 stars(vec3 d) {
    vec3 c = vec3(0); float px = 1. / (FOC * R.y);
    for (int l = 0; l < 2; l++) {
      float sc = l == 0 ? 55. : 130., th = l == 0 ? .93 : .9;
      vec3 p = d * sc, id = floor(p), r = h33(id + float(l) * 41.);
      if (r.x < th) continue;
      vec3 sp = normalize(id + .25 + .5 * r.zxy) * sc;
      if (any(notEqual(floor(sp), id))) continue;
      float dd = length(p - sp) / sc, b = pow((r.x - th) / (1. - th), 4.) * (l == 0 ? 3.5 : .9);
      c += mix(vec3(.7, .8, 1.), vec3(1., .84, .66), r.y) * b * exp(-dd * dd / (px * px * .5)) * (.75 + .25 * sin(T * (1.5 + 3. * r.z) + r.y * 40.));
    }
    return c;
  }
  float ringD(float rr) {                // the planet's rings: opacity at a radius, in planet radii
    if (rr < 1.32 || rr > 2.3) return 0.;
    float d = .6 + .25 * sin(rr * 41.) * sin(rr * 13. + 1.) + .15 * sin(rr * 29. + 2.);
    return clamp(d * smoothstep(1.32, 1.45, rr) * smoothstep(2.3, 2.12, rr) * (1. - .9 * smoothstep(.05, .0, abs(rr - 1.9))), 0., 1.);
  }
  vec4 planet(vec3 d, float soft) {                  // a sphere at distance 1 and radius PS, its rings in the plane square to PAX
    float b = dot(d, PD), disc = b * b - 1. + PS * PS, px = soft / (FOC * R.y);
    vec4 res = vec4(0); float tp = 1e9;
    if (disc > -.0006 * soft) {
      tp = b - sqrt(max(disc, 0.));
      vec3 h = d * tp, n = normalize(h - PD);
      float lat = dot(n, PAX), l2 = lat + (vn3(n * 4. + vec3(T * .006, 0., 0.)) + .5 * vn3(n * 11.) - .75) * .07;
      vec3 al = mix(vec3(.78, .6, .42), vec3(.95, .87, .72), smoothstep(-.3, .3, sin(l2 * 24.)));
      al = mix(al, vec3(.6, .34, .22), smoothstep(.2, 1., sin(l2 * 9. + 1.3)) * .7);
      al = mix(al, vec3(.5, .58, .66), smoothstep(.65, .95, abs(lat)));
      float ndl = dot(n, LP), lit = smoothstep(-.06, .3, ndl) * (.35 + .65 * max(ndl, 0.));
      float ts = dot(PD - h, PAX) / dot(LP, PAX);
      if (ts > 0.) lit *= 1. - .75 * ringD(length(h + LP * ts - PD) / PS);     // the rings' shadow on the globe
      vec3 col = al * lit * 1.3 + al * .012 + vec3(.45, .6, .9) * pow(1. - max(dot(n, -d), 0.), 3.) * smoothstep(-.3, .4, ndl) * .5;
      float cov = clamp(disc / (2. * PS) / px + .5, 0., 1.);
      res = vec4(col * cov, cov);
    }
    float dn = dot(d, PAX), tr = abs(dn) > 1e-4 ? dot(PD, PAX) / dn : -1.;
    if (tr > 0.) {
      vec3 rp = d * tr, v = rp - PD; float den = ringD(length(v) / PS);
      if (den > 0.) {
        float al = dot(v, LP), shad = al < 0. && length(v - LP * al) < PS ? .06 : 1.;   // the globe's shadow on the rings
        vec3 rc = mix(vec3(.62, .52, .42), vec3(.88, .82, .72), .5 + .5 * sin(length(v) / PS * 23.)) * shad * (.25 + .7 * abs(dot(LP, PAX)));
        float ra = den * .85;
        res = tr < tp ? vec4(rc * ra + res.rgb * (1. - ra), ra + res.a * (1. - ra)) : vec4(res.rgb + rc * ra * (1. - res.a), res.a + ra * (1. - res.a));
      }
    }
    return res;
  }
  vec3 aurora(vec3 ro, vec3 d, int N) {  // thin layers between two heights, each sampling a family of writhing curtains
    if (d.y < .012) return vec3(0);
    float fN = float(N), jit = h21(gl_FragCoord.xy), spread = 12. / fN * length(d.xz) / d.y;
    float w = 1.1, we = sqrt(w * w + .3 * spread * spread), keep = w / we;     // a sample covers its spacing: no stripes
    vec3 acc = vec3(0);
    for (int i = 0; i < 26; i++) {
      if (i >= N) break;
      float fi = (float(i) + jit) / fN;
      vec2 p = ro.xz + d.xz * ((8. + 12. * fi - ro.y) / d.y);
      float g = p.y * .03 + .55 * sin(p.x * .018 + T * .05) + .3 * sin(p.x * .043 - T * .07 + 1.3) + .45 * vn(p * .012 + T * .01);
      float k = floor(g + .5), dist = abs(g - k) / .03;
      float act = vn(vec2(p.x * .016 + k * 3.7, k * 1.3 + T * .03)), rays = vn(vec2(p.x * .9 + k * 13. + T * .3, k * 5.));
      rays = .25 + .75 * rays * rays + .35 * vn(vec2(p.x * 2.3 - T * .5, k));
      float dens = exp(-dist * dist / (we * we)) * keep * act * act * rays * smoothstep(0., .035, fi) * exp(-fi * 2.6);
      vec3 col = mix(vec3(.15, 1., .48), vec3(.1, .5, .85), smoothstep(.15, .55, fi));
      acc += mix(col, vec3(.65, .16, .6), smoothstep(.5, 1., fi)) * dens;
    }
    return acc * (2.6 / fN) * smoothstep(.012, .12, d.y);
  }
  vec3 skyB(vec3 ro, vec3 d, bool hi, float soft) {
    vec3 c = mix(vec3(.011, .019, .032), vec3(.0015, .003, .009), pow(smoothstep(-.02, .5, d.y), .5));
    c += vec3(.003, .012, .008) * exp(-max(d.y, 0.) * 12.);                // airglow low on the horizon
    if (hi) c += stars(d) * smoothstep(-.01, .15, d.y);
    vec4 pl = planet(d, soft); c = c * (1. - pl.a) + pl.rgb;
    if (!hi) { float an = 1. - dot(d, PD); c += vec3(.55, .45, .35) * (exp(-an * 160.) * .3 + exp(-an * 30.) * .05); }
    return c + aurora(ro, d, hi ? 24 : 8);
  }

  // ---- shading
  vec3 heat(vec3 rd) {                  // shimmer over the hot sand, only near the horizon
    float n = vn(vec2(rd.x * 70. + rd.z * 49., rd.y * 420. - T * 5.)) - .5;
    rd.y += n * .003 * exp(-abs(rd.y + .01) * 30.);
    return normalize(rd);
  }
  vec3 fogA(vec3 c, vec3 rd, float t) {
    vec3 fc = skyBaseA(normalize(vec3(rd.x, .015, rd.z)));
    return mix(c, mix(fc, vec3(.9, .66, .46), .3), 1. - exp(-t * .009));
  }
  vec3 shadeGate(vec3 p, vec3 rd, float w) {
    vec3 n = gateN(p), q = p - GC;
    float rl = length(q.xy), a = atan(q.y, q.x), s = (a + PI * .5) / (2. * PI) * NB, id = mod(floor(s), NB), fs = fract(s) - .5;
    // on the ring if the ring is the nearest part: a fixed distance test failed where the march stops short of it, on
    // the inner face seen edge-on, which then lost its glow and went dark and speckled
    bool rp = ring(q) <= min(sdBox(vec3(abs(p.x) - .98, p.y - .32, p.z), vec3(.3), .03), sdBox(p - vec3(0., -.06, 0.), vec3(1.75, .18, .62), .04));
    vec3 hb = h33(vec3(id, 3.1, 7.7));
    float m = vn(p.xy * 3.1 + p.z * 2.) * .6 + vn(p.zy * 11. + p.x * 5.) * .4;
    vec3 alb = vec3(.11, .1, .09) * (.65 + .7 * m) * (rp ? .8 + .4 * hb.z : 1.);
    n = normalize(n + .16 * (vec3(vn(p.yz * 14.), vn(p.zx * 14.), vn(p.xy * 14.)) - .5));
    float dust = smoothstep(.8, .97, n.y) * (.3 + .7 * m);
    alb = mix(alb, vec3(.55, .38, .23), dust * .7);
    float gd = rp ? (.5 - abs(fs)) * (2. * PI / NB) * rl : 1.;
    float ao = (.45 + .55 * smoothstep(0., .03, gd)) * (.55 + .45 * smoothstep(-.15, .6, p.y));
    vec3 radial = vec3(q.xy / max(rl, 1e-3), 0.);
    float inner = rp ? max(dot(n, -radial), 0.) * smoothstep(RM - RW * .2, RM - RW * .9, rl) : 0.;
    vec3 gc = w < .5 ? vec3(.35, .72, 1.) : vec3(1., .68, .36);           // the far world's light
    // runes cut into both faces of every block, one glyph each from a small invented script, lit from inside
    float mk = 0.;
    if (rp && abs(n.z) > .5) {
      vec2 g = vec2(fs / .21, (rl - RM) / (RW * .5));
      if (abs(g.x) < 1.3 && abs(g.y) < 1.3) {
        vec3 a1 = h33(vec3(id, sign(q.z), 5.)), a2 = h33(vec3(id, sign(q.z), 9.));
        float d = a1.x > .45 ? abs(length(g - vec2(0, -.15)) - .38) : sg(g, vec2(0, -.95), vec2(0, .95));
        if (a1.y > .5) d = min(d, max(abs(length(g - vec2(0, -.15)) - .78), .3 - g.y));      // an arc over it
        else d = min(d, sg(g, vec2(-.6, .62), vec2(.6, .62)));                               // or a bar
        if (a1.z > .5) d = min(d, min(sg(g, vec2(-.55, -.95), vec2(0, -.62)), sg(g, vec2(0, -.62), vec2(.55, -.95))));
        if (a2.x > .4) d = min(d, length(g - vec2(a2.y > .5 ? .62 : -.62, -.1)) - .07);     // a dot beside it
        if (a2.z > .6) d = min(d, length(g - vec2(0, .98)) - .07);
        mk = smoothstep(.13, .06, d);
      }
    }
    alb *= 1. - .5 * mk;
    float fr = pow(1. - max(dot(n, -rd), 0.), 4.);
    vec3 c;
    if (w < .5) {
      float sh = shadowA(p + n * .015), dif = max(dot(n, SUN), 0.) * sh;
      c = alb * (dif * vec3(2.5, 1.45, .75) * 1.5 + (.55 + .45 * n.y) * vec3(.2, .27, .4) * ao + (.5 - .5 * n.y) * vec3(.32, .2, .11) * .7 * ao);
      c += vec3(1., .6, .3) * pow(1. - max(dot(n, -rd), 0.), 2.5) * smoothstep(0., .5, dot(n, SUN)) * 1.6 * sh;   // rim light from the low sun
      c += vec3(1., .8, .6) * pow(max(dot(reflect(rd, n), SUN), 0.), 18.) * .25 * sh * (1. - dust);
      c += gc * alb * inner * 1.5 * GLOW;
    } else {
      float wet = smoothstep(.5, .08, p.y);
      alb *= 1. - .45 * wet;
      c = alb * (max(dot(n, PD), 0.) * vec3(.5, .46, .4) * .6 + (.55 + .45 * n.y) * vec3(.03, .085, .075) * ao + vec3(.008, .012, .02));
      c += vec3(.05, .16, .12) * fr * .25 * (1. - abs(n.y));                    // the aurora's light on the edges
      c += vec3(.9, .8, .65) * pow(max(dot(reflect(rd, n), PD), 0.), 10.) * .05 * wet;
      c += gc * alb * inner * (3. + 1.5 * GLOW);                                // daylight pouring through the opening
    }
    float pulse = .6 + .4 * sin(a * 2. - T * 1.3);
    c += gc * mk * GLOW * (.12 + .5 * NEAR) * pulse;
    c += gc * inner * smoothstep(.04, .012, abs(q.z)) * GLOW * .9;          // a channel round the opening, alight
    return c;
  }
  vec3 shadeSand(vec3 p, vec3 rd, float t) {
    float e = .01 + t * .0015;
    vec3 n = normalize(vec3(dunes(p.xz - vec2(e, 0)) - dunes(p.xz + vec2(e, 0)), 2. * e, dunes(p.xz - vec2(0, e)) - dunes(p.xz + vec2(0, e))));
    // wind ripples on the gentle faces, none on the steep lee slopes, fading out before they could shimmer
    float rip = smoothstep(.3, .08, 1. - n.y) * smoothstep(9., 1.5, t) * smoothstep(.15, .6, vn(p.xz * .35 + 3.));
    vec2 rp = p.xz + .45 * vec2(vn(p.xz * .9), vn(p.xz * .9 + 9.));
    float ph = dot(rp, vec2(.83, .55)) * 68. + 7. * vn(p.xz * 1.3) + 3. * vn(p.xz * 3.7);
    n = normalize(n - vec3(.83, 0., .55) * rip * .09 * (cos(ph) + .35 * cos(2. * ph + .8)));
    float sh = shadowA(p + n * .02), dif = max(dot(n, SUN), 0.) * sh;
    vec3 alb = vec3(.78, .5, .29) * (.88 + .24 * vn(p.xz * .4));
    float ao = 1.;
    if (abs(p.x) < 3.2 && abs(p.z) < 2.2) ao = .5 + .5 * smoothstep(0., .5, gate(p));   // sand banked against the stone
    vec3 c = alb * (dif * vec3(2.5, 1.45, .75) * 1.4 + (.55 + .45 * n.y) * vec3(.17, .25, .42) * ao + max(dot(n, -vec3(SUN.x, 0., SUN.z)), 0.) * vec3(.26, .15, .08) * .3);
    c += vec3(1., .7, .45) * pow(1. - max(dot(n, -rd), 0.), 5.) * dif * .25;    // a sheen where the sun grazes
    // the event surface glows faintly onto the sand in the gate's shadow
    vec3 dv = p - GC; float dl = length(dv);
    c += vec3(.35, .72, 1.) * GLOW * .05 * abs(dv.z) / dl * 3.46 / (dl * dl + .6) * alb;
    return c;
  }
  vec3 dayView(vec3 r) {                // the desert seen in the sea, through the reflected opening
    vec3 c = skyBaseA(r) + vec3(1., .8, .55) * pow(max(dot(r, SUN), 0.), 300.) * 2.;
    return mix(c, vec3(.78, .56, .38), smoothstep(.06, .0, r.y + .015 * sin(r.x * 23.) + .01 * sin(r.z * 41.)) * .85);
  }
  const vec4 WV[5] = vec4[5](vec4(.96, .28, 1.25, .065), vec4(-.37, .93, 2.1, .036), vec4(.66, -.75, 3.6, .018), vec4(-.98, -.2, 6.3, .009), vec4(.2, .98, 10.5, .0045));
  vec3 shadeSea(vec3 p, vec3 rd, float t) {
    vec2 g = vec2(0);
    for (int i = 0; i < 5; i++) {            // swells with sharp crests; the smallest fade out with distance
      vec4 w = WV[i];
      float ph = dot(w.xy, p.xz) * w.z + T * sqrt(9.8 * w.z) * .5 + float(i) * 1.7;
      g += w.xy * w.z * w.w * cos(ph) * exp(sin(ph) - 1.) * exp(-w.z * t * .012);
    }
    for (int i = 0; i < 2; i++) {            // two octaves of drifting noise break up the swells
      float f = i == 0 ? 1.3 : 4.2, a = (i == 0 ? .05 : .014) * exp(-f * t * .02);
      vec2 x = p.xz * f + vec2(T * .25, -T * .18) * float(i + 1) + float(i) * 17.;
      float c0 = vn(x);
      g += vec2(vn(x + vec2(.07, 0)) - c0, vn(x + vec2(0, .07)) - c0) / .07 * f * a;
    }
    vec3 n = normalize(vec3(-g * WAV, 1.).xzy);
    float fr = .02 + .98 * pow(1. - max(dot(n, -rd), 0.), 5.);
    vec3 r = reflect(rd, n); r.y = abs(r.y) + .002; r = normalize(r);
    vec3 rc = skyB(p, r, false, min(5. + t * 3.5, 50.));       // far away the waves blur the planet's image into a glade
    float tg = marchGate(p + vec3(0, .01, 0), r, 16.), tq = p.z * r.z < 0. ? -p.z / r.z : 1e9;
    if (tq < tg && length((p + r * tq).xy - GC.xy) < RIN) rc = dayView(r);
    else if (tg < 1e8) rc = vec3(.005, .008, .01) + vec3(.1, .2, .17) * .04;
    vec3 c = mix(vec3(.002, .008, .012) + vec3(.01, .03, .03) * max(dot(n, PD), 0.), rc, fr);
    vec3 dv = p - GC; float dl = length(dv);           // the opening as a light: area times cosine over distance squared
    c += vec3(1., .7, .42) * .045 * abs(dv.z) / dl * 3.46 / (dl * dl + .5) * (.4 + .6 * max(dot(n, -dv / dl), 0.));
    if (abs(p.x) < 2.3 && abs(p.z) < 1.2) {             // foam where the swell meets the stone
      float dg = gate(vec3(p.x, .03, p.z));
      c += vec3(.4, .5, .55) * smoothstep(.15, 0., dg) * (.5 + .5 * sin(dg * 60. - T * 2.4 + vn(p.xz * 7.) * 6.)) * .22 * min(WAV + .25, 1.);
    }
    return c;
  }

  // ---- one segment of a ray's journey, in world w (0 desert, 1 night); a hit beyond tmax is no hit
  vec3 world(vec3 ro, vec3 rd, float w, float tmax, float t0, bool sky, out float th) {
    th = 1e9;
    if (w < .5) {
      rd = heat(rd);
      float tg = marchGate(ro, rd, tmax), ts = marchSand(ro, rd, min(tg + .3, tmax)), t = min(tg, ts);
      if (t > min(tmax, 1e8)) return sky ? skyA(rd) : vec3(0);
      th = t; vec3 p = ro + rd * t;
      return fogA(tg <= ts ? shadeGate(p, rd, 0.) : shadeSand(p, rd, t + t0), rd, t + t0);
    }
    float tsea = rd.y < 0. ? -ro.y / rd.y : 1e9, tg = marchGate(ro, rd, min(tsea, tmax)), t = min(tg, tsea);
    if (t > min(tmax, 1e8)) return sky ? skyB(ro, rd, true, 1.) : vec3(0);
    th = t; vec3 p = ro + rd * t;
    vec3 c = tg < tsea ? shadeGate(p, rd, 1.) : shadeSea(p, rd, t + t0);
    return mix(c, vec3(.014, .031, .04), 1. - exp(-(t + t0) * .006));
  }

  void main() {
    vec2 q = (uv * 2. - 1.) * vec2(R.x / R.y, 1.);
    vec3 rd = normalize(CF * FOC + CR * q.x + CU * q.y), ro = CP;
    float tp = abs(rd.z) > 1e-6 ? -ro.z / rd.z : -1.;
    vec2 dq = (ro + rd * tp).xy - GC.xy; float rr = length(dq);
    bool through = tp > 0. && rr < RIN;
    float th; vec3 col = world(ro, rd, WORLD, through ? tp : 1e9, 0., !through, th);
    if (through && th > tp) {
      // the membrane: a standing shimmer, stronger toward the rim, and a ring wave from where the camera breaks it
      float e = rr / RIN; vec2 dir = dq / max(rr, 1e-4);
      vec2 bend = dir * cos(rr * 17. - T * 2.3) * (.003 + .02 * smoothstep(.55, 1., e));
      bend += (vec2(vn(dq * 4. + T * .5), vn(dq * 4. - T * .45 + 7.)) - .5) * .012;
      float x = rr - 1.4 * (RIPT + 1.1) + .06 * vn(dq * 6. + T), wave = exp(-x * x * 18.) * smoothstep(-1.1, -.5, RIPT) * exp(-max(RIPT, 0.) * 2.5);
      bend += dir * cos(x * 24.) * wave * .07 + dir * sin(rr * 26. - T * 5.) * .007 * NEAR * NEAR;   // the surface stirs as you come close
      vec3 rd2 = normalize(rd + vec3(bend, 0.)), pp = vec3(GC.xy + dq, 0.);
      float t2; col = world(pp, rd2, 1. - WORLD, 1e9, tp, true, t2);
      vec3 gc = WORLD < .5 ? vec3(.4, .75, 1.) : vec3(1., .72, .42);
      col *= WORLD < .5 ? 1. : .62;
      col += gc * GLOW * (exp(-(1. - e) * 40.) * .7 + exp(-(1. - e) * 6.) * .04 + pow(max(sin(x * 24.), 0.), 8.) * wave * .14);
    }
    // the crossing flash is an exposure surge, not added light: added light lifts the night's blacks into a flat grey veil
    col *= EXPO * (1. + FLASH * 6. * (WORLD < .5 ? vec3(1., .9, .75) : vec3(.8, .9, 1.)));
    col = aces(col) * (1. - .3 * pow(length(uv - .5) * 1.2, 2.5));
    o = vec4(pow(col, vec3(1. / 2.2)) + (h21(gl_FragCoord.xy) - .5) / 255., 1);
  }`;
  const VS = `#version 300 es
  in vec2 p; out vec2 uv; void main() { uv = p * .5 + .5; gl_Position = vec4(p, 0, 1); }`;
  const sh = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s)); return s; };
  const prog = gl.createProgram(); gl.attachShader(prog, sh(gl.VERTEX_SHADER, VS)); gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FS)); gl.bindAttribLocation(prog, 0, 'p'); gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog));
  gl.useProgram(prog);
  const U = {}; ['R', 'T', 'WORLD', 'GLOW', 'WAV', 'FLASH', 'EXPO', 'RIPT', 'NEAR', 'CP', 'CF', 'CR', 'CU'].forEach(n => U[n] = gl.getUniformLocation(prog, n));
  gl.bindVertexArray(gl.createVertexArray()); gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW); gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  let W = 1, H = 1;
  const resize = () => { const w = stage.clientWidth || 1, h = stage.clientHeight || 1, d = Math.min(devicePixelRatio, 2, Math.max(0.5, Math.sqrt(340000 / (w * h)))); W = canvas.width = Math.max(1, (w * d) | 0); H = canvas.height = Math.max(1, (h * d) | 0); gl.viewport(0, 0, W, H); };
  const ro = new ResizeObserver(resize); ro.observe(stage); resize();

  // The camera flies a figure of eight, x = A/2 sin 2θ, z = L sin θ, whose crossing point is the centre of the gate:
  // the lobe at z > 0 is in the desert, the lobe at z < 0 in the night world. Just after each crossing it looks where
  // it is going; then it banks round until it faces the gate, and keeps it in view all the way back through.
  const LOOP = 26, A = 4.2, L = 7.2, GY = 1.45, TAU = Math.PI * 2, TH0 = 0.3 * Math.PI;
  const sm = (a, b, x) => { const u = Math.min(1, Math.max(0, (x - a) / (b - a))); return u * u * (3 - 2 * u); };
  const mod = (x, m) => ((x % m) + m) % m;
  const cam = { x: 0, y: 0, z: 0, yaw: 0, pitch: 0 };
  const pose = th => {
    const s = Math.sin(th), c = Math.cos(th), tx = A * Math.cos(2 * th), tz = L * c;
    cam.x = A / 2 * Math.sin(2 * th); cam.y = GY - 0.3 * s * s; cam.z = L * s;
    const yT = Math.atan2(tx, tz), yG = Math.atan2(-cam.x, -cam.z), ph = mod(th, TAU), f = ph % Math.PI;
    const w = sm(0.02 * Math.PI, 0.55 * Math.PI, f) * (1 - sm(0.86 * Math.PI, 0.97 * Math.PI, f));
    const d = ph > Math.PI ? mod(yG - yT + 0.5, TAU) - 0.5 : -(mod(yT - yG + 0.5, TAU) - 0.5);   // turn the way the path bends
    const pT = 0.5 * Math.atan2(-0.6 * s * c, Math.hypot(tx, tz)), pG = Math.atan2(GY - cam.y, Math.hypot(cam.x, cam.z));
    cam.yaw = yT + w * d; cam.pitch = pT + w * (pG - pT);
  };
  let raf, last = performance.now(), t = 0;
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000); last = now; t += dt * PARAMS.speed;
    const th = reduce ? Math.PI * 0.5 + 0.09 * Math.sin(t * 0.2) : TH0 + TAU * t / LOOP;
    pose(th + 0.004); const y1 = cam.yaw; pose(th - 0.004); const y0 = cam.yaw; pose(th);
    const roll = Math.max(-0.1, Math.min(0.1, (mod(y1 - y0 + Math.PI, TAU) - Math.PI) / 0.008 * 0.03));   // bank into the turn
    const yaw = cam.yaw + 0.012 * Math.sin(t * 0.53), pitch = cam.pitch + 0.008 * Math.sin(t * 0.71 + 1);
    const fx = Math.sin(yaw) * Math.cos(pitch), fy = Math.sin(pitch), fz = Math.cos(yaw) * Math.cos(pitch);
    const rl = Math.hypot(fz, fx), rx = -fz / rl, rz = fx / rl;                               // right = F x up
    const upx = -rz * fy, upy = rz * fx - rx * fz, upz = rx * fy;                               // up = right x F
    const cr = Math.cos(roll), sr = Math.sin(roll);
    const inB = mod(th, TAU) > Math.PI && !reduce;
    // the crossing: a flash, a ring wave on the membrane, and the exposure adapting to the new world
    let expo = 0.85, flash = 0, ript = -9;
    if (!reduce) {
      const ph = mod(th, TAU), rate = TAU / LOOP;
      const since = (ph - (inB ? Math.PI : 0)) / rate, until = ((inB ? TAU : Math.PI) - ph) / rate;
      expo = inB ? 1.1 - 0.85 * Math.exp(-since / 0.9) : 0.85 + 1.8 * Math.exp(-since / 0.5);
      flash = until < since ? Math.exp(-((until / 0.05) ** 2)) : Math.exp(-since / 0.06);
      ript = until < since ? -until : since;
    }
    gl.uniform2f(U.R, W, H); gl.uniform1f(U.T, reduce ? t * 0.35 : t); gl.uniform1f(U.WORLD, inB ? 1 : 0);
    gl.uniform1f(U.GLOW, PARAMS.glow); gl.uniform1f(U.WAV, PARAMS.waves); gl.uniform1f(U.FLASH, flash); gl.uniform1f(U.EXPO, expo); gl.uniform1f(U.RIPT, ript);
    gl.uniform1f(U.NEAR, Math.exp(-Math.hypot(cam.x, cam.y - GY, cam.z) / 2.5));
    gl.uniform3f(U.CP, cam.x, cam.y, cam.z); gl.uniform3f(U.CF, fx, fy, fz);
    gl.uniform3f(U.CR, rx * cr + upx * sr, upy * sr, rz * cr + upz * sr);
    gl.uniform3f(U.CU, upx * cr - rx * sr, upy * cr, upz * cr - rz * sr);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    raf = requestAnimationFrame(frame);
  }
  raf = requestAnimationFrame(frame);
  return () => { cancelAnimationFrame(raf); ro.disconnect(); gl.getExtension('WEBGL_lose_context')?.loseContext(); canvas.remove(); };
}
