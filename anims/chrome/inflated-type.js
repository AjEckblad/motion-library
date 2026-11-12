// Inflated type: a word blown up like a foil balloon, then let down again. The letters are drawn once to a canvas,
// and a distance transform turns that into a field of distances to the nearest edge. Raymarched in 3D, each point
// is inside the balloon if it is inside a letter and closer to the letter's mid-plane than a thickness that grows
// with the square root of how deep into the letter it is: thin at the seams, fat in the middle, the way a sealed foil
// balloon puffs. While it is soft the seams crinkle. The foil is holographic: its colour shifts with the angle.
const PARAMS = { inflate: 1, wobble: 1, sheen: 1 };
const WORDS = ['PUFF', 'BLOB', 'AIR'];

export default function (stage) {
  const canvas = document.createElement('canvas');
  canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block';
  stage.append(canvas);
  const gl = canvas.getContext('webgl2', { antialias: false });
  if (!gl) { stage.textContent = 'This needs WebGL2.'; return () => canvas.remove(); }
  const TW = 512, TH = 192;
  // signed distance to the letters, in pixels (positive outside), by an exact Euclidean distance transform
  function field(word) {
    const c = document.createElement('canvas'); c.width = TW; c.height = TH; const g = c.getContext('2d');
    g.fillStyle = '#fff'; g.font = `900 ${Math.round(TH * 0.8)}px "Arial Black", "Arial Rounded MT Bold", system-ui, sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText(word, TW / 2, TH * 0.54, TW * 0.9);
    const px = g.getImageData(0, 0, TW, TH).data, INF = 1e10;
    const edt = inside => {
      const f = new Float64Array(TW * TH); for (let i = 0; i < TW * TH; i++) f[i] = (px[i * 4 + 3] > 127) === inside ? 0 : INF;
      const n = Math.max(TW, TH), v = new Int32Array(n), z = new Float64Array(n + 1), tmp = new Float64Array(n), out = new Float64Array(n);
      const pass = (get, set, len) => {
        for (let q = 0; q < len; q++) tmp[q] = get(q);
        let k = 0; v[0] = 0; z[0] = -INF; z[1] = INF;
        for (let q = 1; q < len; q++) { let s; while ((s = ((tmp[q] + q * q) - (tmp[v[k]] + v[k] * v[k])) / (2 * q - 2 * v[k])) <= z[k]) k--; k++; v[k] = q; z[k] = s; z[k + 1] = INF; }
        k = 0; for (let q = 0; q < len; q++) { while (z[k + 1] < q) k++; out[q] = (q - v[k]) ** 2 + tmp[v[k]]; set(q, out[q]); }
      };
      for (let x = 0; x < TW; x++) pass(y => f[y * TW + x], (y, val) => { f[y * TW + x] = val; }, TH);
      for (let y = 0; y < TH; y++) pass(x => f[y * TW + x], (x, val) => { f[y * TW + x] = val; }, TW);
      return f;
    };
    const depth = edt(false), away = edt(true);                  // depth inside a letter; distance from one outside
    // the balloon's height: a membrane under pressure (solve ∇²h = −p inside the letters, h = 0 at the seams) on a
    // half-size grid. Its square root is round across every stroke, where the plain depth would leave a sharp ridge.
    const hw = TW >> 1, hh = TH >> 1, inside = new Uint8Array(hw * hh); let m = new Float32Array(hw * hh), m2 = new Float32Array(hw * hh);
    for (let y = 0; y < hh; y++) for (let x = 0; x < hw; x++) { const i = (y * 2) * TW + x * 2; inside[y * hw + x] = px[i * 4 + 3] > 127 ? 1 : 0; m[y * hw + x] = inside[y * hw + x] ? Math.sqrt(depth[i]) * 0.5 : 0; }
    for (let it = 0; it < 220; it++) {
      for (let y = 1; y < hh - 1; y++) for (let x = 1; x < hw - 1; x++) { const i = y * hw + x; m2[i] = inside[i] ? (m[i - 1] + m[i + 1] + m[i - hw] + m[i + hw]) * 0.25 + 0.25 : 0; }
      [m, m2] = [m2, m];
    }
    const d = new Float32Array(TW * TH * 2);
    for (let i = 0; i < TW * TH; i++) {
      const row = (i / TW) | 0, col = i % TW, o = ((TH - 1 - row) * TW + col) * 2;   // rows flipped: textures start at the bottom
      const fx = Math.min(hw - 1.001, col / 2), fy = Math.min(hh - 1.001, row / 2), x0 = fx | 0, y0 = fy | 0, ax = fx - x0, ay = fy - y0;
      const hv = m[y0 * hw + x0] * (1 - ax) * (1 - ay) + m[y0 * hw + x0 + 1] * ax * (1 - ay) + m[(y0 + 1) * hw + x0] * (1 - ax) * ay + m[(y0 + 1) * hw + x0 + 1] * ax * ay;
      d[o] = Math.sqrt(away[i]) - Math.sqrt(depth[i]); d[o + 1] = Math.sqrt(Math.max(0, hv)) * 2;   // distance; height in full-size pixels
    }
    return d;
  }
  const QUAD = `#version 300 es
  in vec2 p; out vec2 uv; void main() { uv = p * .5 + .5; gl_Position = vec4(p, 0, 1); }`;
  const FS = `#version 300 es
  precision highp float; in vec2 uv; out vec4 o;
  uniform sampler2D F; uniform vec2 R; uniform float T, INF, WOB, SHEEN, MIX;
  const float SX = 5., SY = 5. * ${TH}. / ${TW}., PX = 5. / ${TW}.;
  float h(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float n3(vec3 p) { vec3 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f); vec2 q = i.xy + i.z * 37.;
    return mix(mix(mix(h(q), h(q + vec2(1, 0)), f.x), mix(h(q + vec2(0, 1)), h(q + 1.), f.x), f.y), mix(mix(h(q + 37.), h(q + vec2(38, 37)), f.x), mix(h(q + vec2(37, 38)), h(q + 38.), f.x), f.y), f.z); }
  float sd2(vec2 p) {                                            // distance to the letters (outside the canvas: to its box)
    vec2 t = vec2(p.x / SX + .5, p.y / SY + .5);
    vec2 b = abs(p) - vec2(SX, SY) * .5;
    if (max(b.x, b.y) > 0.) return length(max(b, 0.)) + 1.;
    return texture(F, t).r * PX;
  }
  float puff(vec2 p) { return texture(F, vec2(p.x / SX + .5, p.y / SY + .5)).g * PX; }
  mat2 rot(float a) { float c = cos(a), s = sin(a); return mat2(c, -s, s, c); }
  vec3 tf(vec3 p) { p.xz *= rot(.32 * sin(T * .45) * WOB); p.y -= .08 * sin(T * 1.1) * WOB; return p; }
  float map(vec3 p) {
    p = tf(p);
    float d = sd2(p.xy), depth = max(-d, 0.);
    float thick = INF * .55 * puff(p.xy) + .004;                     // a balloon: the membrane's height, round across each stroke
    float crinkle = (1. - INF) * .035 * n3(p * 9.) * smoothstep(.12, .0, depth);   // soft foil crinkles near the seams
    return max(d, abs(p.z) - thick + crinkle) * .6;
  }
  vec3 nrm(vec3 p) { vec2 e = vec2(.004, 0); return normalize(vec3(map(p + e.xyy) - map(p - e.xyy), map(p + e.yxy) - map(p - e.yxy), map(p + e.yyx) - map(p - e.yyx))); }
  vec3 env(vec3 d) {                                             // a dark studio: black walls, two softboxes and a rim strip
    vec3 c = mix(vec3(.05, .04, .06), vec3(.09, .08, .14), smoothstep(-.3, .8, d.y));
    c += vec3(1.9) * smoothstep(.75, .95, dot(d, normalize(vec3(-.4, .8, .45))));
    c += vec3(1.3, 1.1, 1.4) * smoothstep(.85, .97, dot(d, normalize(vec3(.8, .3, .5))));
    c += vec3(.55, .7, 1.2) * smoothstep(.9, .99, dot(d, normalize(vec3(.1, .25, -1.))));   // the rim strip behind the word
    c += vec3(.75, .72, .85) * smoothstep(.55, .98, dot(d, normalize(vec3(-.25, .45, 1.))));   // a big soft key over the camera
    c *= .75 + .25 * smoothstep(-.6, .2, d.y);
    return c;
  }
  void main() {
    vec2 q = (uv * 2. - 1.) * vec2(R.x / R.y, 1.);
    vec3 ro = vec3(0, .2, 4.6), rd = normalize(vec3(q, -2.35)); rd.yz *= rot(-.05);
    // the backdrop: a near-black sweep; under the word the foil throws a faint coloured bounce onto the floor
    vec3 col = mix(vec3(.05, .045, .065), vec3(.022, .02, .03), uv.y);
    float tf0 = (-1.15 - ro.y) / rd.y;
    if (tf0 > 0.) { vec3 fp = ro + rd * tf0; col += vec3(.09, .06, .12) * INF * exp(-dot(fp.xz * vec2(.3, 1.6), fp.xz * vec2(.3, 1.6))); }
    float t = 0.; bool hit = false;
    for (int i = 0; i < 110; i++) { float d = map(ro + rd * t); if (d < .0015) { hit = true; break; } t += d; if (t > 12.) break; }
    if (hit) {
      vec3 p = ro + rd * t, n = nrm(p), r = reflect(rd, n);
      float fr = pow(1. - max(dot(n, -rd), 0.), 3.);
      // holographic foil: thin-film colour that shifts with the viewing angle
      vec3 film = .5 + .5 * cos(6.2831 * (fr * 1.4 + p.x * .08 + vec3(0., .33, .67) + MIX * .2));
      vec3 base = mix(vec3(1., .62, .86), vec3(.62, .78, 1.), uv.x);
      vec3 foil = mix(base, film, .45 * SHEEN);
      float dif = max(dot(n, normalize(vec3(-.4, .8, .45))), 0.);
      col = foil * (.2 + .85 * dif) + env(r) * (.45 + .75 * fr) * mix(vec3(1), foil, .5);
      col += film * fr * .7;                                      // iridescent rim glowing against the dark
      col += vec3(1.) * pow(max(dot(r, normalize(vec3(-.4, .8, .45))), 0.), 40.) * 1.6 + vec3(1.) * pow(max(dot(r, normalize(vec3(.8, .3, .5))), 0.), 30.) * .7;
    }
    o = vec4(pow(col / (1. + col * .18), vec3(.92)), 1);
  }`;
  const sh = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s)); return s; };
  const p = gl.createProgram(); gl.attachShader(p, sh(gl.VERTEX_SHADER, QUAD)); gl.attachShader(p, sh(gl.FRAGMENT_SHADER, FS)); gl.bindAttribLocation(p, 0, 'p'); gl.linkProgram(p);
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
  gl.useProgram(p);
  const U = n => gl.getUniformLocation(p, n);
  gl.bindVertexArray(gl.createVertexArray());
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer()); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  const tex = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  const fields = WORDS.map(field);
  const load = i => { gl.bindTexture(gl.TEXTURE_2D, tex); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RG16F, TW, TH, 0, gl.RG, gl.FLOAT, fields[i]); };
  let word = 0; load(0);
  let W = 1, H = 1;
  const resize = () => { const w = stage.clientWidth || 1, h = stage.clientHeight || 1, d = Math.min(devicePixelRatio, 2, Math.max(0.6, Math.sqrt(520000 / (w * h)))); W = canvas.width = Math.max(1, (w * d) | 0); H = canvas.height = Math.max(1, (h * d) | 0); gl.viewport(0, 0, W, H); };
  const ro = new ResizeObserver(resize); ro.observe(stage); resize();
  let raf, last = performance.now(), t = 0, cyc = 0;
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000); last = now; t += dt; cyc += dt;
    // blow up with a springy overshoot, hold, let down, swap the word
    let inf;
    if (cyc < 2.2) { const k = cyc / 2.2; inf = 1 - Math.exp(-5 * k) * Math.cos(9 * k); }
    else if (cyc < 6.5) inf = 1 + 0.015 * Math.sin(cyc * 3);
    else if (cyc < 8) inf = 1 - (cyc - 6.5) / 1.5 * 0.92;
    else { cyc = 0; word = (word + 1) % WORDS.length; load(word); inf = 0.08; }
    gl.uniform1i(U('F'), 0); gl.uniform2f(U('R'), W, H); gl.uniform1f(U('T'), t); gl.uniform1f(U('INF'), Math.max(0.06, inf * PARAMS.inflate));
    gl.uniform1f(U('WOB'), PARAMS.wobble); gl.uniform1f(U('SHEEN'), PARAMS.sheen); gl.uniform1f(U('MIX'), word);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    raf = requestAnimationFrame(frame);
  }
  raf = requestAnimationFrame(frame);
  return () => { cancelAnimationFrame(raf); ro.disconnect(); gl.getExtension('WEBGL_lose_context')?.loseContext(); canvas.remove(); };
}
