// Low-poly planet: an icosahedron split three times into 1,280 faces, each vertex pushed out by 3D noise.
// Faces are flat-shaded and coloured by height (sea, sand, grass, forest, rock, snow), pine trees sprout on
// the green faces, and puffy clouds orbit faster than the ground. Drag to spin it.
const PARAMS = { terrain: 1, sea: 0.5, spin: 1 };

export default function (stage) {
  const canvas = document.createElement('canvas');
  canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block;touch-action:none;cursor:grab';
  stage.append(canvas);
  const gl = canvas.getContext('webgl2', { antialias: true });
  if (!gl) { stage.textContent = 'This needs WebGL2.'; return () => canvas.remove(); }

  // ── geometry
  const perm = Uint8Array.from({ length: 256 }, () => Math.random() * 256);
  const hsh = (x, y, z) => perm[(perm[(perm[x & 255] + y) & 255] + z) & 255] / 255;
  const sm = t => t * t * (3 - 2 * t), lerp = (a, b, t) => a + (b - a) * t;
  const noise = (x, y, z) => {
    const X = Math.floor(x), Y = Math.floor(y), Z = Math.floor(z), u = sm(x - X), v = sm(y - Y), w = sm(z - Z);
    return lerp(lerp(lerp(hsh(X, Y, Z), hsh(X + 1, Y, Z), u), lerp(hsh(X, Y + 1, Z), hsh(X + 1, Y + 1, Z), u), v),
      lerp(lerp(hsh(X, Y, Z + 1), hsh(X + 1, Y, Z + 1), u), lerp(hsh(X, Y + 1, Z + 1), hsh(X + 1, Y + 1, Z + 1), u), v), w);
  };
  const fbm = (x, y, z) => { let s = 0, a = 0.5, f = 1; for (let i = 0; i < 4; i++) { s += a * noise(x * f + 11, y * f + 7, z * f + 3); a *= 0.5; f *= 2.1; } return s; };
  function icosphere(level) {
    const t = (1 + Math.sqrt(5)) / 2;
    let V = [[-1, t, 0], [1, t, 0], [-1, -t, 0], [1, -t, 0], [0, -1, t], [0, 1, t], [0, -1, -t], [0, 1, -t], [t, 0, -1], [t, 0, 1], [-t, 0, -1], [-t, 0, 1]].map(v => { const l = Math.hypot(...v); return v.map(c => c / l); });
    let F = [[0, 11, 5], [0, 5, 1], [0, 1, 7], [0, 7, 10], [0, 10, 11], [1, 5, 9], [5, 11, 4], [11, 10, 2], [10, 7, 6], [7, 1, 8], [3, 9, 4], [3, 4, 2], [3, 2, 6], [3, 6, 8], [3, 8, 9], [4, 9, 5], [2, 4, 11], [6, 2, 10], [8, 6, 7], [9, 8, 1]];
    for (let l = 0; l < level; l++) {
      const cache = new Map(), mid = (a, b) => { const k = a < b ? a + ',' + b : b + ',' + a; if (cache.has(k)) return cache.get(k); const m = V[a].map((c, i) => (c + V[b][i]) / 2), len = Math.hypot(...m); V.push(m.map(c => c / len)); cache.set(k, V.length - 1); return V.length - 1; };
      F = F.flatMap(([a, b, c]) => { const ab = mid(a, b), bc = mid(b, c), ca = mid(c, a); return [[a, ab, ca], [b, bc, ab], [c, ca, bc], [ab, bc, ca]]; });
    }
    return { V, F };
  }
  const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]], cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  const norm = a => { const l = Math.hypot(...a) || 1; return a.map(c => c / l); };
  const hex = h => [parseInt(h.slice(1, 3), 16) / 255, parseInt(h.slice(3, 5), 16) / 255, parseInt(h.slice(5, 7), 16) / 255];
  function pushTri(out, a, b, c, col, shine, ctr = [0, 0, 0]) {
    let n = norm(cross(sub(b, a), sub(c, a)));
    const m = [0, 1, 2].map(i => (a[i] + b[i] + c[i]) / 3 - ctr[i]);
    if (n[0] * m[0] + n[1] * m[1] + n[2] * m[2] < 0) n = n.map(x => -x);   // face outward from the shape's centre, whatever the winding
    for (const v of [a, b, c]) out.push(v[0], v[1], v[2], n[0], n[1], n[2], col[0], col[1], col[2], shine);
  }
  function buildPlanet() {
    const { V, F } = icosphere(3), sea = 0.38 + PARAMS.sea * 0.14, amp = 0.32 * PARAMS.terrain;
    const H = V.map(v => fbm(v[0] * 1.7, v[1] * 1.7, v[2] * 1.7));
    const P = V.map((v, i) => { const r = 1 + Math.max(0, H[i] - sea) * amp; return v.map(c => c * r); });
    const out = [], greens = [];
    F.forEach(([a, b, c]) => {
      const h = (H[a] + H[b] + H[c]) / 3 - sea, j = (Math.random() - 0.5) * 0.06;
      let col, shine = 0;
      if (h < 0) { col = h < -0.06 ? hex('#1c5a86') : hex('#2b86b0'); shine = 1; }
      else if (h < 0.025) col = hex('#e6cf8c');
      else if (h < 0.11) { col = hex('#6cb04f'); greens.push([a, b, c]); }
      else if (h < 0.17) { col = hex('#3f8a3c'); greens.push([a, b, c]); }
      else if (h < 0.24) col = hex('#8b7e70');
      else col = hex('#f1f3f6');
      pushTri(out, P[a], P[b], P[c], col.map(x => Math.min(1, Math.max(0, x + j))), shine);
    });
    // pine trees: a five-sided cone standing on the face's centre, pointing away from the core
    greens.sort(() => Math.random() - 0.5).slice(0, 140).forEach(([a, b, c]) => {
      const cen = [0, 1, 2].map(i => (P[a][i] + P[b][i] + P[c][i]) / 3), up = norm(cen), side = norm(cross(up, [0.3, 1, 0.1])), side2 = cross(up, side);
      const hgt = 0.05 + Math.random() * 0.04, rad = 0.018 + Math.random() * 0.01, tip = cen.map((x, i) => x + up[i] * hgt);
      const col = hex(Math.random() < 0.5 ? '#2f6e33' : '#3b7f37');
      for (let k = 0; k < 5; k++) {
        const a0 = k / 5 * 6.283, a1 = (k + 1) / 5 * 6.283;
        const p0 = cen.map((x, i) => x + (side[i] * Math.cos(a0) + side2[i] * Math.sin(a0)) * rad - up[i] * 0.004);
        const p1 = cen.map((x, i) => x + (side[i] * Math.cos(a1) + side2[i] * Math.sin(a1)) * rad - up[i] * 0.004);
        pushTri(out, p0, p1, tip, col, 0, cen);
      }
    });
    return new Float32Array(out);
  }
  function buildClouds() {
    const { V, F } = icosphere(0), out = [];
    for (let k = 0; k < 9; k++) {
      const th = Math.random() * 6.283, ph = Math.acos(Math.random() * 1.6 - 0.8), c = [Math.sin(ph) * Math.cos(th), Math.cos(ph), Math.sin(ph) * Math.sin(th)].map(x => x * 1.34);
      const side = norm(cross(c, [0, 1, 0]));
      for (let m = 0; m < 3 + (k % 3); m++) {
        const off = (m - 1.5) * 0.07, s = 0.05 + Math.random() * 0.045, ctr = c.map((x, i) => x + side[i] * off + (Math.random() - 0.5) * 0.03);
        F.forEach(([a, b, d]) => pushTri(out, ...[a, b, d].map(i => V[i].map((x, j) => ctr[j] + x * s * (j === 1 ? 0.75 : 1))), [0.97, 0.98, 1], 0, ctr));
      }
    }
    return new Float32Array(out);
  }

  // ── GL
  const sh = (t, s) => { const x = gl.createShader(t); gl.shaderSource(x, s); gl.compileShader(x); if (!gl.getShaderParameter(x, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(x)); return x; };
  const link = (v, f) => { const p = gl.createProgram(); gl.attachShader(p, sh(gl.VERTEX_SHADER, v)); gl.attachShader(p, sh(gl.FRAGMENT_SHADER, f)); gl.bindAttribLocation(p, 0, 'p'); gl.linkProgram(p); return p; };
  const meshProg = link(`#version 300 es
  in vec3 pos, nor, col; in float shine; uniform mat4 PV, M; uniform float T;
  out vec3 vN, vC, vW; out float vS;
  void main() { vec4 w = M * vec4(pos, 1); vW = w.xyz; vN = mat3(M) * nor; vC = col; vS = shine;
    if (shine > .5) vN = normalize(vN + .08 * vec3(sin(T * 2. + pos.x * 30.), cos(T * 1.7 + pos.y * 30.), sin(T * 1.9 + pos.z * 30.)));   // the sea glints
    gl_Position = PV * w; }`, `#version 300 es
  precision highp float; in vec3 vN, vC, vW; in float vS; out vec4 o;
  void main() {
    vec3 n = normalize(vN), L = normalize(vec3(-.6, .45, .65)), V = normalize(vec3(0, 0, 3.6) - vW);
    float d = max(0., dot(n, L)), rim = pow(1. - max(0., dot(n, V)), 3.);
    vec3 c = vC * (.16 + .95 * d) + vec3(.35, .55, 1.) * rim * .35;
    c += vS * pow(max(0., dot(reflect(-L, n), V)), 40.) * .8;
    o = vec4(pow(c, vec3(.92)), 1);
  }`);
  const bgProg = link(`#version 300 es
  in vec2 p; out vec2 uv; void main() { uv = p; gl_Position = vec4(p, .999, 1); }`, `#version 300 es
  precision highp float; in vec2 uv; out vec4 o; uniform vec2 R; uniform float RS;
  float h(vec2 p) { return fract(sin(dot(p, vec2(12.99, 78.23))) * 43758.55); }
  void main() {
    vec2 q = uv * vec2(R.x / R.y, 1.);
    vec3 c = mix(vec3(.02, .025, .06), vec3(.05, .04, .1), uv.y * .5 + .5);
    vec2 g = floor(gl_FragCoord.xy / 3.); float s = h(g); c += step(.996, s) * (.4 + .6 * h(g + 3.)) * vec3(.9, .95, 1.);
    float r = length(q);
    c += vec3(.25, .5, 1.) * exp(-max(0., r - RS) * 9.) * .55 * smoothstep(RS * .9, RS, r);   // atmosphere halo
    o = vec4(c, 1);
  }`);
  const quad = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, quad); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const bgVao = gl.createVertexArray(); gl.bindVertexArray(bgVao); gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  function meshVao(data) {
    const vao = gl.createVertexArray(); gl.bindVertexArray(vao);
    const b = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b); gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
    [['pos', 3, 0], ['nor', 3, 12], ['col', 3, 24], ['shine', 1, 36]].forEach(([n, s, o]) => { const l = gl.getAttribLocation(meshProg, n); gl.enableVertexAttribArray(l); gl.vertexAttribPointer(l, s, gl.FLOAT, false, 40, o); });
    return { vao, count: data.length / 10, buf: b };
  }
  const planet = meshVao(buildPlanet()), clouds = meshVao(buildClouds());
  const uPV = gl.getUniformLocation(meshProg, 'PV'), uM = gl.getUniformLocation(meshProg, 'M'), uT = gl.getUniformLocation(meshProg, 'T');
  const uBR = gl.getUniformLocation(bgProg, 'R'), uRS = gl.getUniformLocation(bgProg, 'RS');

  // ── tiny matrix kit (column-major)
  const mul = (a, b) => { const o = new Float32Array(16); for (let c = 0; c < 4; c++) for (let r = 0; r < 4; r++) { let s = 0; for (let k = 0; k < 4; k++) s += a[k * 4 + r] * b[c * 4 + k]; o[c * 4 + r] = s; } return o; };
  const persp = (fov, asp, n, f) => { const t = 1 / Math.tan(fov / 2); return new Float32Array([t / asp, 0, 0, 0, 0, t, 0, 0, 0, 0, (f + n) / (n - f), -1, 0, 0, 2 * f * n / (n - f), 0]); };
  const rotY = a => new Float32Array([Math.cos(a), 0, -Math.sin(a), 0, 0, 1, 0, 0, Math.sin(a), 0, Math.cos(a), 0, 0, 0, 0, 1]);
  const rotX = a => new Float32Array([1, 0, 0, 0, 0, Math.cos(a), Math.sin(a), 0, 0, -Math.sin(a), Math.cos(a), 0, 0, 0, 0, 1]);
  const trans = z => new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, z, 1]);

  const resize = () => { const d = Math.min(devicePixelRatio, 2); canvas.width = stage.clientWidth * d | 0; canvas.height = stage.clientHeight * d | 0; };
  const ro = new ResizeObserver(resize); ro.observe(stage); resize();
  let ang = 0.8, vel = 0, dragX = null;
  const onDown = e => { dragX = e.clientX; canvas.style.cursor = 'grabbing'; canvas.setPointerCapture?.(e.pointerId); };
  const onMove = e => { if (dragX == null) return; vel = (e.clientX - dragX) * 0.012; ang += vel; dragX = e.clientX; };
  const onUp = () => { dragX = null; canvas.style.cursor = 'grab'; };
  canvas.addEventListener('pointerdown', onDown); canvas.addEventListener('pointermove', onMove); canvas.addEventListener('pointerup', onUp); canvas.addEventListener('pointercancel', onUp);
  let raf, last = performance.now(); const t0 = last;
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000); last = now; const t = (now - t0) / 1000;
    if (dragX == null) { ang += vel + dt * 0.25 * PARAMS.spin; vel *= 0.94; }
    const asp = canvas.width / canvas.height, fov = 0.75, dist = 3.6;
    gl.viewport(0, 0, canvas.width, canvas.height); gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.disable(gl.DEPTH_TEST); gl.useProgram(bgProg); gl.bindVertexArray(bgVao);
    gl.uniform2f(uBR, canvas.width, canvas.height); gl.uniform1f(uRS, 1.12 / Math.tan(fov / 2) / Math.sqrt(dist * dist - 1));
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    gl.enable(gl.DEPTH_TEST); gl.useProgram(meshProg); gl.uniform1f(uT, t);
    gl.uniformMatrix4fv(uPV, false, mul(persp(fov, asp, 0.1, 20), trans(-dist)));
    gl.uniformMatrix4fv(uM, false, mul(rotX(0.35), rotY(ang)));
    gl.bindVertexArray(planet.vao); gl.drawArrays(gl.TRIANGLES, 0, planet.count);
    gl.uniformMatrix4fv(uM, false, mul(rotX(0.35), rotY(ang * 1.35 + t * 0.06)));
    gl.bindVertexArray(clouds.vao); gl.drawArrays(gl.TRIANGLES, 0, clouds.count);
    raf = requestAnimationFrame(frame);
  }
  raf = requestAnimationFrame(frame);
  return () => {
    cancelAnimationFrame(raf); ro.disconnect();
    canvas.removeEventListener('pointerdown', onDown); canvas.removeEventListener('pointermove', onMove); canvas.removeEventListener('pointerup', onUp); canvas.removeEventListener('pointercancel', onUp);
    gl.getExtension('WEBGL_lose_context')?.loseContext(); canvas.remove();
  };
}
