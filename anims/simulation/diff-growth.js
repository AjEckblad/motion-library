// Differential growth: a line that keeps getting longer in a space that does not, so it has to fold. It starts as a
// small closed loop (or three) and buckles outward into a branching maze until the frame is full. The curve is a
// chain of nodes in linked rings. Every step each node is pushed away from every other node closer than a set
// distance (a spatial grid finds them, so the cost stays linear), pulled toward the midpoint of its two neighbours
// (which keeps the line smooth) and kept inside the frame. Edges that stretch past a limit split in two, and a node
// with room around it (neighbours within reach, less the ones that are just its own stretch of curve) now and then
// splits an edge anyway. Length grows where there is room, repulsion keeps the curve from crossing itself, and the
// only way to fit is to fold, until nowhere has room. Then it holds, the ink fades, and it starts again from the other
// seed. It is drawn like a pen-plotter print on warm paper. On the GPU each edge is an instanced quad whose fragments
// work out their exact distance to the segment; the depth test keeps the nearest edge, so every pixel knows how far it
// is from the curve. A fan of triangles from one point to every edge flips an inside mask (even-odd fill). The shader
// inks the curve as a fine line and nests offset contours inside it. Each new node remembers how full the frame was
// when it was born, so the ink runs from deep blue at the old centre through teal and ochre to vermilion at the newest
// edge, like growth rings.
const PARAMS = { growth: 1, spacing: 1 };

export default function (stage) {
  const canvas = document.createElement('canvas');
  canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block';
  stage.append(canvas);
  const gl = canvas.getContext('webgl2', { antialias: false, premultipliedAlpha: false });
  if (!gl) { stage.textContent = 'This needs WebGL2.'; return () => canvas.remove(); }
  const floatOK = !!gl.getExtension('EXT_color_buffer_float');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---- the seeds, in turn: one loop with wide folds, or three with finer ones
  const LOOKS = [
    { seed: 'circle', rr: 30, ins: 0.009, room: 1.5 },
    { seed: 'three', rr: 24, ins: 0.008, room: 1.5 },
  ];

  // ---- the curve: nodes in linked rings, so a node can be inserted anywhere at no cost
  const MAX = 16000;
  const X = new Float32Array(MAX), Y = new Float32Array(MAX), NX = new Float32Array(MAX), NY = new Float32Array(MAX);
  const NEXT = new Int32Array(MAX), PREV = new Int32Array(MAX), BORN = new Float32Array(MAX), CROWD = new Float32Array(MAX);
  const SM = new Float32Array(MAX), SM2 = new Float32Array(MAX);
  let N = 0, heads = [];
  let seed = 3;
  const rnd = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
  let w = 1, h = 1, look = 0, L = LOOKS[0], RR = 12, DMAX = 6, t = 0, grown = 0;

  const ring = (cx, cy, rx, ry, n) => {
    const first = N;
    for (let i = 0; i < n; i++) {
      const a = i / n * Math.PI * 2, k = N++;
      X[k] = cx + Math.cos(a) * rx * (1 + 0.04 * (rnd() - 0.5)); Y[k] = cy + Math.sin(a) * ry * (1 + 0.04 * (rnd() - 0.5));
      NEXT[k] = i === n - 1 ? first : k + 1; PREV[k] = i === 0 ? first + n - 1 : k - 1; BORN[k] = 0;
    }
    heads.push(first);
  };
  const reseed = () => {
    L = LOOKS[look % LOOKS.length]; N = 0; heads = []; grown = 0;
    const S = Math.sqrt(w * h / (1280 * 760));
    RR = L.rr * Math.max(0.5, Math.min(2, PARAMS.spacing)) * Math.max(0.6, Math.min(1.4, S)); DMAX = RR * 0.42;
    const cx = w / 2, cy = h / 2, m = Math.min(w, h);
    const ringN = r => Math.max(12, Math.round(2 * Math.PI * r / (DMAX * 0.7)));
    if (L.seed === 'circle') { const r = Math.max(m * 0.05, RR * 1.7); ring(cx, cy, r, r, ringN(r)); }
    else for (let i = 0; i < 3; i++) { const a = i * 2.094 + 0.4, r = Math.max(m * 0.035, RR * 1.7); ring(cx + Math.cos(a) * m * 0.2 * (w / h > 1 ? 1.4 : 0.8), cy + Math.sin(a) * m * 0.2, r, r, ringN(r)); }
  };

  // ---- the spatial grid for repulsion
  let GW = 1, GH = 1, cellStart = new Int32Array(2), cellOf = new Int32Array(MAX), order = new Int32Array(MAX);
  const buildGrid = () => {
    GW = Math.max(1, Math.ceil(w / RR) + 2); GH = Math.max(1, Math.ceil(h / RR) + 2);
    if (cellStart.length < GW * GH + 1) cellStart = new Int32Array(GW * GH + 1); else cellStart.fill(0);
    for (let i = 0; i < N; i++) { const c = (Math.min(GH - 1, Math.max(0, ((Y[i] / RR) | 0) + 1))) * GW + Math.min(GW - 1, Math.max(0, ((X[i] / RR) | 0) + 1)); cellOf[i] = c; cellStart[c + 1]++; }
    for (let c = 0; c < GW * GH; c++) cellStart[c + 1] += cellStart[c];
    const fill = cellStart.slice(0, GW * GH);
    for (let i = 0; i < N; i++) order[fill[cellOf[i]]++] = i;
  };
  // one step of growth
  const step = () => {
    buildGrid();
    const R2 = RR * RR, KR = 0.42, KA = 0.32, M = RR * 0.9;
    for (let i = 0; i < N; i++) {
      const xi = X[i], yi = Y[i], p = PREV[i], n = NEXT[i];
      let fx = 0, fy = 0, cr = 0;
      const c = cellOf[i], cx = c % GW, cy = (c / GW) | 0;
      for (let gy = Math.max(0, cy - 1); gy <= Math.min(GH - 1, cy + 1); gy++) for (let gx = Math.max(0, cx - 1); gx <= Math.min(GW - 1, cx + 1); gx++) {
        const cc = gy * GW + gx;
        for (let k = cellStart[cc], e = cellStart[cc + 1]; k < e; k++) {
          const j = order[k]; if (j === i || j === p || j === n) continue;
          const dx = xi - X[j], dy = yi - Y[j], d2 = dx * dx + dy * dy;
          if (d2 < R2 && d2 > 1e-6) { const d = Math.sqrt(d2), f = (RR - d) / RR / d; fx += dx * f; fy += dy * f; cr++; }
        }
      }
      // pull toward the neighbours' midpoint, so the ridge stays smooth
      const mx = (X[p] + X[n]) * 0.5 - xi, my = (Y[p] + Y[n]) * 0.5 - yi;
      let ux = fx * KR * RR * 0.18 + mx * KA, uy = fy * KR * RR * 0.18 + my * KA;
      const ul = Math.hypot(ux, uy), cap = RR * 0.12; if (ul > cap) { ux *= cap / ul; uy *= cap / ul; }
      let x = xi + ux, y = yi + uy;
      // the frame is a soft wall
      if (x < M) x += (M - x) * 0.25; else if (x > w - M) x -= (x - (w - M)) * 0.25;
      if (y < M) y += (M - y) * 0.25; else if (y > h - M) y -= (y - (h - M)) * 0.25;
      // crowding: neighbours within reach, less the ones that are just this stretch of the curve itself
      const le = 0.5 * (Math.hypot(X[n] - xi, Y[n] - yi) + Math.hypot(X[p] - xi, Y[p] - yi)) + 1e-3;
      NX[i] = x; NY[i] = y; CROWD[i] = cr - 2 * (RR / le - 1) + (x < M * 1.3 || x > w - M * 1.3 || y < M * 1.3 || y > h - M * 1.3 ? 4 : 0);
    }
    X.set(NX.subarray(0, N)); Y.set(NY.subarray(0, N));
    // stretched edges split; now and then a random one does too, which seeds new folds
    const n0 = N, pr = L.ins * Math.max(0.1, PARAMS.growth);
    for (let i = 0; i < n0 && N < MAX - 1; i++) {
      const j = NEXT[i], dx = X[j] - X[i], dy = Y[j] - Y[i], d2 = dx * dx + dy * dy;
      // growth needs room: a node hemmed in by others (or by the frame) does not add length
      const stretched = d2 > DMAX * DMAX;
      if (stretched || (CROWD[i] <= L.room && rnd() < pr && d2 > DMAX * DMAX * 0.2)) {
        // a stretched edge just fills in with the stage of its ends; a node splitting because it has room is new growth
        const k = N++; X[k] = (X[i] + X[j]) * 0.5; Y[k] = (Y[i] + Y[j]) * 0.5; BORN[k] = stretched ? (BORN[i] + BORN[j]) * 0.5 : grown;
        NEXT[i] = k; PREV[k] = i; NEXT[k] = j; PREV[j] = k;
      }
    }
  };

  // ---- drawing: a distance field and an inside mask, then inked onto paper
  const sh = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s)); return s; };
  const prog = (vs, fs) => {
    const p = gl.createProgram(); gl.attachShader(p, sh(gl.VERTEX_SHADER, vs)); gl.attachShader(p, sh(gl.FRAGMENT_SHADER, fs)); gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
    const u = {}, n = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS); for (let i = 0; i < n; i++) { const a = gl.getActiveUniform(p, i); u[a.name] = gl.getUniformLocation(p, a.name); }
    return { p, u };
  };
  // each edge is one instance: a quad around the segment, and the fragment works out its exact distance to the
  // segment. The depth test keeps the nearest edge, so every pixel ends up with its distance to the curve and the
  // growth stage of the stretch of curve it is nearest to
  const capP = prog(`#version 300 es
  layout(location = 0) in vec2 q; layout(location = 1) in vec4 seg; layout(location = 2) in vec2 age;
  uniform vec2 VS; uniform float RAD;
  out vec2 P; flat out vec4 S; flat out vec2 G;
  void main() {
    vec2 a = seg.xy, b = seg.zw, d = b - a; float l = length(d); vec2 t = l > 1e-4 ? d / l : vec2(1, 0), n = vec2(-t.y, t.x);
    vec2 p = mix(a, b, q.x * .5 + .5) + t * q.x * RAD + n * q.y * RAD;
    P = p; S = seg; G = age;
    gl_Position = vec4(p / VS * 2. - 1., 0, 1); gl_Position.y = -gl_Position.y;
  }`, `#version 300 es
  precision highp float; in vec2 P; flat in vec4 S; flat in vec2 G; out vec4 o; uniform float RAD;
  void main() {
    vec2 pa = P - S.xy, ba = S.zw - S.xy; float k = clamp(dot(pa, ba) / max(dot(ba, ba), 1e-6), 0., 1.);
    float d = length(pa - ba * k) / RAD; if (d >= 1.) discard;
    gl_FragDepth = d;
    o = vec4(d, mix(G.x, G.y, k), 0, 0);
  }`);
  // inside or out: a fan of triangles from one point to every edge, each flipping the mask (even-odd fill)
  const fanP = prog(`#version 300 es
  layout(location = 1) in vec4 seg; uniform vec2 VS;
  void main() {
    vec2 p = gl_VertexID == 0 ? VS * .5 : gl_VertexID == 1 ? seg.xy : seg.zw;
    gl_Position = vec4(p / VS * 2. - 1., 0, 1); gl_Position.y = -gl_Position.y;
  }`, `#version 300 es
  precision highp float; out vec4 o; void main() { o = vec4(0, 0, 0, 1); }`);
  const VSQ = `#version 300 es
  in vec2 p; void main() { gl_Position = vec4(p, 0, 1); }`;
  const shadeP = prog(VSQ, `#version 300 es
  precision highp float; out vec4 o;
  uniform sampler2D F; uniform vec2 R; uniform float FADE, RADP, DPR, GAP;
  float h21(vec2 p) { vec3 q = fract(p.xyx * .1031); q += dot(q, q.yzx + 33.33); return fract((q.x + q.y) * q.z); }
  float vn(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
    return mix(mix(h21(i), h21(i + vec2(1, 0)), f.x), mix(h21(i + vec2(0, 1)), h21(i + vec2(1, 1)), f.x), f.y); }
  // the inks, by when that stretch of curve was laid down: oldest at the centre, newest at the growing edge
  vec3 ink(float g) {
    g = clamp(g, 0., 1.);
    vec3 a = vec3(.10, .17, .38), b = vec3(.07, .39, .44), c = vec3(.82, .53, .18), d = vec3(.77, .24, .14);
    return g < .4 ? mix(a, b, smoothstep(0., .4, g)) : g < .72 ? mix(b, c, smoothstep(.4, .72, g)) : mix(c, d, smoothstep(.72, 1., g));
  }
  void main() {
    vec2 fc = gl_FragCoord.xy, uv = fc / R;
    vec4 f = texelFetch(F, ivec2(fc), 0);
    float dp = f.r * RADP, inside = step(.5, f.a);
    // paper: warm, faintly mottled, with a fine tooth
    vec2 cp = fc / DPR;
    vec3 col = vec3(.955, .935, .897) * (.985 + .03 * vn(cp * .012) + .012 * (vn(cp * .9) - .5) + .01 * (h21(cp) - .5));
    col *= 1. - .1 * pow(length(uv - .5) * 1.25, 2.4);
    vec3 k = ink(f.g);
    // a pale wash of the ink inside the shape
    col *= mix(vec3(1), mix(vec3(1), k, .06), inside * FADE);
    // nested offset contours inside, each one thinner and fainter than the last
    float cw = .38 * DPR, cont = 0.;
    for (int i = 1; i <= 3; i++) {
      float fi = float(i), c = clamp(cw + .5 - abs(dp - fi * GAP), 0., 1.) * (1. - .2 * fi);
      cont = max(cont, c);
    }
    col *= mix(vec3(1), mix(vec3(1), k, .62), cont * inside * FADE);
    // the curve itself: a fine ink line, a hair darker where it is fresh
    float lw = .8 * DPR, line = clamp(lw + .5 - dp, 0., 1.);
    col *= mix(vec3(1), k * .92, line * FADE);
    o = vec4(col + (h21(fc + 7.) - .5) / 255., 1);
  }`);

  // geometry: a unit quad, and one instance per edge
  const vao = gl.createVertexArray(); gl.bindVertexArray(vao);
  const quadB = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, quadB);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, 1, 1, -1, -1, 1, 1, -1, 1]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  const segData = new Float32Array(MAX * 4), ageData = new Float32Array(MAX * 2);
  const segB = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, segB); gl.bufferData(gl.ARRAY_BUFFER, segData.byteLength, gl.DYNAMIC_DRAW);
  gl.enableVertexAttribArray(1); gl.vertexAttribPointer(1, 4, gl.FLOAT, false, 0, 0); gl.vertexAttribDivisor(1, 1);
  const ageB = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, ageB); gl.bufferData(gl.ARRAY_BUFFER, ageData.byteLength, gl.DYNAMIC_DRAW);
  gl.enableVertexAttribArray(2); gl.vertexAttribPointer(2, 2, gl.FLOAT, false, 0, 0); gl.vertexAttribDivisor(2, 1);
  const vaoQ = gl.createVertexArray(); gl.bindVertexArray(vaoQ);
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer()); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

  // the field: distance to the curve (r), growth stage of the nearest stretch (g) and the inside mask (a), at full
  // device resolution so the lines stay sharp
  let W = 1, H = 1, FT = null, FB = null, DB = null, dpr = 1;
  const resize = () => {
    const cw = stage.clientWidth || 1, ch = stage.clientHeight || 1;
    dpr = Math.min(devicePixelRatio, 2, Math.max(0.5, Math.sqrt(4200000 / (cw * ch))));
    W = canvas.width = Math.max(1, (cw * dpr) | 0); H = canvas.height = Math.max(1, (ch * dpr) | 0);
    if (FT) { gl.deleteTexture(FT); gl.deleteFramebuffer(FB); gl.deleteRenderbuffer(DB); }
    FT = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, FT);
    gl.texStorage2D(gl.TEXTURE_2D, 1, floatOK ? gl.RGBA16F : gl.RGBA8, W, H);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    DB = gl.createRenderbuffer(); gl.bindRenderbuffer(gl.RENDERBUFFER, DB); gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT24, W, H);
    FB = gl.createFramebuffer(); gl.bindFramebuffer(gl.FRAMEBUFFER, FB);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, FT, 0);
    gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, DB);
    const nw = cw, nh = ch;
    if (Math.abs(nw - w) > 2 || Math.abs(nh - h) > 2) { w = nw; h = nh; reseed(); }
  };
  const ro = new ResizeObserver(resize); ro.observe(stage); resize();

  const draw = fade => {
    // the edges, as instances: endpoints and the growth stage at which each end was born
    // the stage is softened along the curve first (three passes of a 1-2-1 blur), so the inks shade into each other
    for (let i = 0; i < N; i++) SM[i] = BORN[i];
    for (let r = 0; r < 3; r++) { for (let i = 0; i < N; i++) SM2[i] = (SM[PREV[i]] + 2 * SM[i] + SM[NEXT[i]]) * 0.25; SM.set(SM2.subarray(0, N)); }
    let m = 0;
    for (const h0 of heads) { let i = h0; do { const j = NEXT[i];
      segData[m * 4] = X[i]; segData[m * 4 + 1] = Y[i]; segData[m * 4 + 2] = X[j]; segData[m * 4 + 3] = Y[j];
      ageData[m * 2] = SM[i]; ageData[m * 2 + 1] = SM[j]; m++; i = j; } while (i !== h0 && m < MAX); }
    gl.bindVertexArray(vao);
    gl.bindBuffer(gl.ARRAY_BUFFER, segB); gl.bufferSubData(gl.ARRAY_BUFFER, 0, segData, 0, m * 4);
    gl.bindBuffer(gl.ARRAY_BUFFER, ageB); gl.bufferSubData(gl.ARRAY_BUFFER, 0, ageData, 0, m * 2);
    gl.bindFramebuffer(gl.FRAMEBUFFER, FB); gl.viewport(0, 0, W, H);
    gl.clearColor(1, 0, 0, 0); gl.clearDepth(1); gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    const rad = RR * 0.56;
    gl.colorMask(true, true, true, false); gl.enable(gl.DEPTH_TEST); gl.depthFunc(gl.LESS);
    gl.useProgram(capP.p); gl.uniform2f(capP.u.VS, w, h); gl.uniform1f(capP.u.RAD, rad);
    gl.drawArraysInstanced(gl.TRIANGLES, 0, 6, m);
    gl.disable(gl.DEPTH_TEST);
    // alpha flips 0 <-> 1 under every fan triangle: out = 1 - dst
    gl.colorMask(false, false, false, true); gl.enable(gl.BLEND); gl.blendFuncSeparate(gl.ZERO, gl.ONE, gl.ONE_MINUS_DST_ALPHA, gl.ZERO);
    gl.useProgram(fanP.p); gl.uniform2f(fanP.u.VS, w, h);
    gl.drawArraysInstanced(gl.TRIANGLES, 0, 3, m);
    gl.disable(gl.BLEND); gl.colorMask(true, true, true, true);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null); gl.viewport(0, 0, W, H);
    gl.useProgram(shadeP.p); gl.bindVertexArray(vaoQ);
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, FT); gl.uniform1i(shadeP.u.F, 0);
    gl.uniform2f(shadeP.u.R, W, H); gl.uniform1f(shadeP.u.FADE, fade);
    gl.uniform1f(shadeP.u.RADP, rad * dpr); gl.uniform1f(shadeP.u.DPR, dpr); gl.uniform1f(shadeP.u.GAP, RR * 0.135 * dpr);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  };

  // full: the curve's length against what the frame can hold at this spacing (a finished print ends near 1)
  const fullness = () => { let len = 0; for (let i = 0; i < N; i++) { const j = NEXT[i]; len += Math.hypot(X[j] - X[i], Y[j] - Y[i]); } return len * RR / (w * h * 1.05); };
  let raf, last = null, acc = 0, phase = 0, phaseT = 0, frames = 0, lastN = 0;
  // reduced motion: grow a print almost to the edges at once, then hold it still
  if (reduce) { for (let i = 0; i < 4000 && grown < 0.9; i++) { if (i % 5 === 0) grown = fullness(); t += 1 / 60; step(); } }
  function frame(now) {
    if (last === null) last = now;
    const dt = Math.min(1 / 30, (now - last) / 1000); last = now;
    let fade = 1;
    if (!reduce) {
      t += dt;
      if (phase === 0) {
        acc = Math.min(4, acc + dt * 60); grown = fullness();
        while (acc >= 1) { step(); acc -= 1; }
        if (++frames % 60 === 0) {
          // full: the curve has stopped finding room to grow, or it has run out of nodes, or time is up
          const grew = N - lastN; lastN = N;
          if ((grew < N * 0.009 && t > 15) || N > MAX - 400 || t > 60) { phase = 1; phaseT = 0; }
        }
        fade = Math.min(1, t / 0.6);
      } else {
        // hold the finished print, let the ink fade back into the paper, and start over from the other seed
        phaseT += dt;
        fade = 1 - Math.max(0, Math.min(1, (phaseT - 3) / 0.8));
        if (phaseT > 3.85) { look++; seed += 101; t = 0; reseed(); phase = 0; fade = 0; lastN = 0; }
      }
    }
    draw(fade);
    raf = requestAnimationFrame(frame);
  }
  raf = requestAnimationFrame(frame);
  return () => { cancelAnimationFrame(raf); ro.disconnect(); gl.getExtension('WEBGL_lose_context')?.loseContext(); canvas.remove(); };
}
