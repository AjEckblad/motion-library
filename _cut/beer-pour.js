// Beer pour: a pint is pulled from the tap, the glass fills and the head builds, the pour stops and the head settles,
// then three sips leave rings of lace on the glass. The glass has a little optics: the beer is a deeper amber where
// it is thicker, the warm lights behind the bar show through it refracted and upside down, and condensation beads
// only where the glass has been cold. Bubbles are particles: they leave nucleation points in chains, and each one
// grows as it rises and so rises faster (a bubble's speed goes up with its size), so the chains spread out as they
// climb; the pour knocks in a cloud of bigger ones that churn up white. The head grows while the pour churns, then
// slowly drains back into the beer.
const PARAMS = { bubbles: 1, head: 1, speed: 1 };

export default function (stage) {
  const canvas = document.createElement('canvas');
  canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block';
  stage.append(canvas);
  const gl = canvas.getContext('webgl2', { antialias: true });
  if (!gl) { stage.textContent = 'This needs WebGL2.'; return () => canvas.remove(); }
  const sh = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s)); return s; };
  const prog = (vs, fs) => {
    const p = gl.createProgram(); gl.attachShader(p, sh(gl.VERTEX_SHADER, vs)); gl.attachShader(p, sh(gl.FRAGMENT_SHADER, fs)); gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
    const u = {}; for (let i = 0, n = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS); i < n; i++) { const nm = gl.getActiveUniform(p, i).name; u[nm.replace('[0]', '')] = gl.getUniformLocation(p, nm); }
    return { p, u };
  };
  // the glass: a nonic pint, its outline as a function of height, shared by the shader and the bubbles
  const BASE = -0.74, TOP = 0.66, WALL = 0.012, FLOOR = 0.07, SX = -0.03;
  const rad = y => { const k = Math.min(1, Math.max(0, (y - BASE) / (TOP - BASE))); return 0.29 + 0.07 * k + 0.022 * Math.exp(-(((k - 0.86) / 0.05) ** 2)); };
  const YB = BASE + FLOOR, YT = TOP - 0.02, level = lv => YB + lv * (YT - YB);
  const GEO = `const float BASE = ${BASE.toFixed(3)}, TOP = ${TOP.toFixed(3)}, WALL = ${WALL}, YB = ${YB.toFixed(3)}, YT = ${YT.toFixed(3)}, SX = ${SX};
  float rad(float y) { float k = clamp((y - BASE) / (TOP - BASE), 0., 1.); return .29 + .07 * k + .022 * exp(-pow((k - .86) / .05, 2.)); }`;
  const sceneP = prog(`#version 300 es
  layout(location = 0) in vec2 p; out vec2 uv; void main() { uv = p * .5 + .5; gl_Position = vec4(p, 0, 1); }`, `#version 300 es
  precision highp float; in vec2 uv; out vec4 o;
  uniform vec2 R; uniform float T, YL, FH, SW, POUR, MAXY, FADE; uniform float LACE[4]; const float ZOOM = .84;
  ${GEO}
  float h21(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float n2(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f); return mix(mix(h21(i), h21(i + vec2(1, 0)), f.x), mix(h21(i + vec2(0, 1)), h21(i + 1.), f.x), f.y); }
  // warm lights behind the bar, out of focus
  vec3 bokeh(vec2 p) {
    vec3 c = vec3(0);
    for (int i = 0; i < 14; i++) {
      float fi = float(i); vec2 cp = vec2(h21(vec2(fi, 1.3)) * 3.6 - 1.8, h21(vec2(fi, 7.1)) * 1.3 - .05);
      float r = .05 + .09 * h21(vec2(fi, 3.7)), d = length(p - cp);
      vec3 lc = mix(vec3(1., .62, .25), vec3(1., .85, .55), h21(vec2(fi, 9.2)));
      c += lc * (smoothstep(r, r * .82, d) * .32 + .05 * exp(-d * d / (r * r * 4.)));
    }
    return c;
  }
  vec3 room(vec2 p) {
    vec3 c = mix(vec3(.03, .018, .012), vec3(.1, .055, .03), smoothstep(-1., 1., p.y));
    c *= .85 + .15 * smoothstep(.0, .02, abs(fract(p.x * 2.2) - .5) - .47);   // panelling
    return c + bokeh(p);
  }
  float vor(vec2 p) { vec2 i = floor(p), f = fract(p); float m = 9.;
    for (int y = -1; y <= 1; y++) for (int x = -1; x <= 1; x++) { vec2 g = vec2(x, y), q = g + vec2(h21(i + g), h21(i + g + 7.)) - f; m = min(m, dot(q, q)); } return sqrt(m); }
  // the glass and what is in it at p: rgb and how much of it there is
  vec4 glass(vec2 p) {
    float ro = rad(p.y), ri = ro - WALL, ax = abs(p.x);
    if (p.y < BASE || p.y > TOP + .012 || ax > ro + .003) return vec4(0);
    float xr = clamp(p.x / ri, -1., 1.), th = sqrt(max(0., 1. - xr * xr));
    vec3 behind = room(vec2(p.x * 1.08, p.y)) * .9;                       // through empty glass: nearly what is behind
    vec3 c = behind;
    float ftop = YL + FH + .03 * th * step(.002, FH);                     // the head domes a little
    bool inside = ax < ri && p.y > YB;
    if (inside && p.y < YL) {
      // beer: deeper amber where it is thicker and lower down, the room's lights refracted upside down through it
      vec3 beer = mix(vec3(1., .8, .34), vec3(.72, .34, .04), .25 + .7 * th) * (1. - .18 * clamp(YL - p.y, 0., 1.));
      beer += beer * room(vec2(-p.x * .55, -p.y * .6 + .45)) * 1.1;
      float churn = POUR * exp(-pow(p.x - SX, 2.) / .012) * smoothstep(YL - .5, YL, p.y);   // the pour knocks in a white cloud
      beer = mix(beer, vec3(1., .93, .76), churn * .55 * (.6 + .4 * n2(p * 30. + vec2(0, T * 4.))));
      beer = mix(beer, vec3(1., .95, .82), smoothstep(YL - .03, YL, p.y) * step(.002, FH) * .5);   // tiny bubbles under the head
      c = beer;
    } else if (inside && p.y < ftop) {
      // the head: fine bubbles at the bottom, coarser at the top, shaded round the glass
      float k = clamp((p.y - YL) / max(FH, .01), 0., 1.), cell = vor(p * mix(140., 70., k) + vec2(0, T * .05));
      c = vec3(.99, .96, .88) * (.86 + .14 * smoothstep(.1, .45, cell)) * (.72 + .28 * th);
      c *= 1. - .25 * smoothstep(ftop - .015, ftop, p.y) * (1. - th);
    } else if (inside) {
      // empty glass above: lace left by each sip
      for (int i = 0; i < 4; i++) {
        float L = LACE[i]; if (L < -5. || p.y < ftop) continue;
        float band = smoothstep(.045, .0, abs(p.y - L - .012 * sin(p.x * 23. + L * 40.)));
        c = mix(c, vec3(.97, .94, .86), band * smoothstep(.4, .62, n2(p * vec2(55, 70) + L * 13.)) * smoothstep(.25, .5, n2(p * vec2(160, 200))) * .9);
      }
    }
    // the glass itself: a bright edge where it turns away, two highlights from the bar's lights, a rim, a thick base
    float edge = smoothstep(.9, 1., ax / ro);
    c = mix(c, vec3(.9, .85, .78), edge * .35);
    c += vec3(1., .95, .85) * (smoothstep(.04, .0, abs(p.x / ro + .7)) * .5 + smoothstep(.02, .0, abs(p.x / ro - .82)) * .75 + smoothstep(.12, .0, abs(p.x / ro + .45)) * .06) * smoothstep(BASE + .02, BASE + .2, p.y);
    if (p.y > TOP - .006) c += vec3(.5);
    if (p.y < YB) c = mix(behind, vec3(.85, .8, .72), .25 + .3 * smoothstep(YB, BASE, p.y)) + vec3(1., .9, .7) * .2 * smoothstep(.02, 0., abs(p.y - YB + .01));
    // condensation, only where the glass has been cold
    vec2 g = p * vec2(26., 18.); vec2 gi = floor(g), gf = fract(g) - .5;
    float hd = h21(gi), dr = (.12 + .2 * h21(gi + 3.1)) * step(.45, hd), dd = length((gf - (vec2(h21(gi + 1.7), h21(gi + 5.3)) - .5) * .5) * vec2(1., 1.4));
    float cold = smoothstep(MAXY + .02, MAXY - .05, p.y) * step(YB - .02, p.y);
    if (dd < dr && cold > 0. && ax < ro - .006) {
      vec2 dn = (gf - (vec2(h21(gi + 1.7), h21(gi + 5.3)) - .5) * .5) / dr;
      float rim = smoothstep(.7, 1., length(dn));
      c = mix(c, c * 1.12 + vec3(.05), cold * .7) * (1. - .35 * rim * cold) + vec3(1.) * smoothstep(.3, .0, length(dn - vec2(-.3, .35))) * .55 * cold;   // a droplet: lighter, a dark edge, a glint
    }
    return vec4(c, smoothstep(ro + .003, ro - .002, ax));
  }
  void main() {
    vec2 p = (uv * 2. - 1.) * vec2(R.x / R.y, 1.) * ZOOM; p /= min(1., R.x / R.y / .85);
    vec3 col = room(p);
    // the bar top: dark glossy wood, with the glass mirrored in it
    if (p.y < BASE) {
      float g = n2(vec2(p.x * 3., p.y * 40.)) * .5 + n2(vec2(p.x * 9., p.y * 90.)) * .25;
      col = mix(vec3(.09, .045, .02), vec3(.2, .1, .045), g) * (1. - .45 * smoothstep(BASE - .05, -1., p.y));
      vec4 rf = glass(vec2(p.x, 2. * BASE - p.y)); col = mix(col, rf.rgb, rf.a * .28 * smoothstep(BASE - .35, BASE, p.y));
      col += bokeh(vec2(p.x, 2. * BASE - p.y + .9)) * .12;
    }
    vec4 gc = glass(p); col = mix(col, gc.rgb, gc.a);
    // the tap above, and the stream of beer from it
    if (abs(p.x - SX) < .035 && p.y > .76) col = vec3(.55, .56, .6) * (.6 + .5 * smoothstep(.035, -.02, p.x - SX)) + .4 * smoothstep(.01, .0, abs(p.x - SX + .012));
    float sw = SW * (1. + .15 * sin(p.y * 40. + T * 30.));
    if (SW > .0005 && p.y < .76 && p.y > YL + FH * .5 && abs(p.x - SX) < sw) {
      float s = (p.x - SX) / sw;
      col = mix(vec3(.95, .62, .15), vec3(1., .86, .5), .5 + .5 * sin(p.y * 90. + T * 60.)) * (.75 + .25 * (1. - s * s)) + .35 * smoothstep(.3, .0, abs(s + .45));
    }
    col = mix(vec3(.02, .012, .008), col, FADE);
    o = vec4(pow(col, vec3(.95)), 1);
  }`);
  // bubbles: points, each a thin bright ring with a glint
  const bubP = prog(`#version 300 es
  layout(location = 0) in vec3 B; uniform vec2 S; uniform float PX; out float a;
  void main() { gl_Position = vec4(B.x * S.x, B.y * S.y, 0, 1); gl_PointSize = max(1.5, B.z * 2. * PX); a = clamp(B.z * 260., .35, 1.); }`, `#version 300 es
  precision mediump float; in float a; out vec4 o;
  void main() { vec2 q = gl_PointCoord * 2. - 1.; float d = length(q); if (d > 1.) discard;
    float ring = smoothstep(.55, .95, d) * smoothstep(1., .9, d), glint = smoothstep(.35, .0, length(q - vec2(-.35, -.35)));
    o = vec4(vec3(1., .95, .8), (ring * .7 + glint * .9 + .08) * a); }`);
  const qv = gl.createVertexArray(); gl.bindVertexArray(qv); gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW); gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  const MAXB = 4000, bdata = new Float32Array(MAXB * 3);
  const bv = gl.createVertexArray(); gl.bindVertexArray(bv); const bb = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, bb); gl.bufferData(gl.ARRAY_BUFFER, bdata.byteLength, gl.DYNAMIC_DRAW);
  gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0); gl.bindVertexArray(null);

  // nucleation points: scratches on the bottom and the walls, each with its own rhythm
  const sites = Array.from({ length: 12 }, (_, i) => {
    const wall = i >= 6, y = wall ? YB + 0.04 + Math.random() * 0.55 : YB + 0.006, side = Math.random() < 0.5 ? -1 : 1;
    return { x: wall ? side * (rad(y) - WALL - 0.008) : (Math.random() - 0.5) * 0.4, y, every: 0.06 + Math.random() * 0.1, next: Math.random() * 0.1 };
  });
  let bubbles = [];
  let W = 1, H = 1;
  const resize = () => { const d = Math.min(devicePixelRatio, 2); W = canvas.width = Math.max(1, (stage.clientWidth * d) | 0); H = canvas.height = Math.max(1, (stage.clientHeight * d) | 0); };
  const ro = new ResizeObserver(resize); ro.observe(stage); resize();
  const sm = k => { k = Math.min(1, Math.max(0, k)); return k * k * (3 - 2 * k); };
  // the pint's story, as the beer's level (0 to 1 of the glass), the head's height and the stream's width
  const story = c => {
    const s = { lv: 0, fh: 0, sw: 0, pour: 0, fade: 1 };
    const head = PARAMS.head;
    if (c < 0.6) { s.sw = 0.025 * sm(c / 0.6) * (c > 0.3 ? 1 : 0); }
    else if (c < 6.5) { const k = (c - 0.6) / 5.9; s.lv = 0.86 * Math.pow(k, 0.92); s.fh = (0.015 + 0.13 * k) * head; s.sw = 0.025; s.pour = 1; }
    else if (c < 7) { const k = (c - 6.5) / 0.5; s.lv = 0.86 + 0.015 * k; s.fh = (0.145 + 0.02 * k) * head; s.sw = 0.025 * (1 - k); s.pour = 1 - k; }
    else if (c < 10.2) { const k = (c - 7) / 3.2; s.lv = 0.875 + 0.01 * k; s.fh = (0.165 - 0.035 * sm(k)) * head; }
    else {
      // three sips, the head thinning each time
      const sips = [10.4, 11.8, 13.2]; let lv = 0.885, fh = 0.13 * head;
      for (const at of sips) { const k = sm((c - at) / 0.6); lv -= 0.26 * k; fh *= 1 - 0.32 * k; }
      s.lv = Math.max(0, lv); s.fh = fh; s.fade = 1 - sm((c - 15.1) / 0.8);
    }
    return s;
  };
  let raf, last = performance.now(), t = 0, cycle = -1, lace = [], maxY = YB;
  function frame(now) {
    const dt = Math.min(0.04, (now - last) / 1000) * PARAMS.speed; last = now; t += dt;
    const L = 16, c = t % L;
    if (Math.floor(t / L) !== cycle) { cycle = Math.floor(t / L); bubbles = []; lace = []; maxY = YB; }
    const s = story(c), YL = level(s.lv), ftop = YL + s.fh;
    maxY = Math.max(maxY, YL);
    // a ring of lace is left on the glass where the head stood before each sip
    for (const at of [10.4, 11.8, 13.2]) if (c > at && c < at + 0.1 && !lace.some(l => l.at === at)) lace.push({ at, y: ftop - 0.005 });
    // bubbles: chains from the sites while the beer covers them, and a cloud from the pour
    for (const st of sites) { st.next -= dt; if (st.next <= 0) { st.next = st.every / PARAMS.bubbles; if (st.y < YL - 0.02 && bubbles.length < MAXB) bubbles.push({ x: st.x, y: st.y, r: 0.0015, ph: Math.random() * 6.3 }); } }
    if (s.pour > 0 && YL > YB + 0.03) for (let i = 0; i < 160 * dt * s.pour * PARAMS.bubbles && bubbles.length < MAXB; i++) {
      const y = YL - Math.random() * Math.min(0.5, YL - YB - 0.01), x = SX + (Math.random() + Math.random() - 1) * 0.12;
      if (Math.abs(x) < rad(y) - WALL - 0.01) bubbles.push({ x, y, r: 0.002 + Math.random() * 0.006, ph: Math.random() * 6.3 });
    }
    let n = 0;
    bubbles = bubbles.filter(b => {
      b.r += dt * 0.0035; b.y += (0.05 + 2000 * b.r * b.r) * dt; b.x += Math.sin(t * 7 + b.ph + b.y * 30) * 0.0011;   // bigger rises faster
      const lim = rad(b.y) - WALL - b.r; if (Math.abs(b.x) > lim) b.x = Math.sign(b.x) * lim;
      if (b.y > YL - b.r) return false;
      if (n < MAXB) { bdata[n * 3] = b.x; bdata[n * 3 + 1] = b.y; bdata[n * 3 + 2] = b.r; n++; }
      return true;
    });
    gl.bindFramebuffer(gl.FRAMEBUFFER, null); gl.viewport(0, 0, W, H);
    gl.useProgram(sceneP.p);
    gl.uniform2f(sceneP.u.R, W, H); gl.uniform1f(sceneP.u.T, t); gl.uniform1f(sceneP.u.YL, YL); gl.uniform1f(sceneP.u.FH, s.fh); gl.uniform1f(sceneP.u.SW, s.sw);
    gl.uniform1f(sceneP.u.POUR, s.pour); gl.uniform1f(sceneP.u.MAXY, maxY); gl.uniform1f(sceneP.u.FADE, s.fade);
    gl.uniform1fv(sceneP.u.LACE, [0, 1, 2, 3].map(i => lace[i] ? lace[i].y : -10));
    gl.bindVertexArray(qv); gl.drawArrays(gl.TRIANGLES, 0, 3);
    // the bubbles, in the same frame of reference as the scene
    const A = W / H, k = 1 / Math.min(1, A / 0.85);
    gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.useProgram(bubP.p); gl.uniform2f(bubP.u.S, 1 / (A * k * 0.84), 1 / (k * 0.84)); gl.uniform1f(bubP.u.PX, H / 2 / (k * 0.84));
    gl.bindVertexArray(bv); gl.bindBuffer(gl.ARRAY_BUFFER, bb); gl.bufferSubData(gl.ARRAY_BUFFER, 0, bdata, 0, n * 3);
    if (s.fade > 0.5) gl.drawArrays(gl.POINTS, 0, n);
    gl.disable(gl.BLEND); gl.bindVertexArray(null);
    raf = requestAnimationFrame(frame);
  }
  raf = requestAnimationFrame(frame);
  return () => { cancelAnimationFrame(raf); ro.disconnect(); gl.getExtension('WEBGL_lose_context')?.loseContext(); canvas.remove(); };
}
