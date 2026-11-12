// Torus knot: a tube swept along a (p, q) knot that winds p times around the axis and q times through the hole.
// The tube's frame is carried along by parallel transport (no sudden flips, unlike Frenet frames). It is shaded
// as chrome that shifts hue with viewing angle, like a thin film, and stripes flow along it.
const PARAMS = { p: 2, q: 3, flow: 1 };

export default function (stage) {
  const canvas = document.createElement('canvas');
  canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block';
  stage.append(canvas);
  const gl = canvas.getContext('webgl2', { antialias: true });
  if (!gl) { stage.textContent = 'This needs WebGL2.'; return () => canvas.remove(); }
  const P = Math.max(1, Math.round(PARAMS.p)), Q = Math.max(1, Math.round(PARAMS.q)), SEG = 520, RAD = 28, tube = 0.34;
  const curve = t => { const r = 2 + Math.cos(Q * t); return [r * Math.cos(P * t), r * Math.sin(P * t), Math.sin(Q * t) * 1.1].map(v => v * 0.55); };
  const sub = (a, b) => a.map((v, i) => v - b[i]), nrm = a => { const l = Math.hypot(...a) || 1; return a.map(v => v / l); };
  const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]], dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  // parallel transport: carry the normal along, removing its component along each new tangent
  const pts = [], T = [], N = [], B = [];
  for (let i = 0; i <= SEG; i++) { const t = i / SEG * Math.PI * 2; pts.push(curve(t)); T.push(nrm(sub(curve(t + 1e-3), curve(t - 1e-3)))); }
  let n = nrm(cross(T[0], [0, 0, 1]));
  for (let i = 0; i <= SEG; i++) { n = nrm(sub(n, T[i].map(v => v * dot(n, T[i])))); N.push(n); B.push(cross(T[i], n)); }
  // close the loop: spread the leftover twist evenly so the seam meets
  const twist = Math.atan2(dot(cross(N[SEG], N[0]), T[0]), dot(N[SEG], N[0]));
  const verts = [], idx = [];
  for (let i = 0; i <= SEG; i++) {
    const tw = twist * i / SEG;
    for (let j = 0; j <= RAD; j++) {
      const a = j / RAD * Math.PI * 2 + tw, c = Math.cos(a), s = Math.sin(a), d = N[i].map((v, k) => v * c + B[i][k] * s);
      verts.push(pts[i][0] + d[0] * tube, pts[i][1] + d[1] * tube, pts[i][2] + d[2] * tube, d[0], d[1], d[2], i / SEG, j / RAD);
    }
  }
  for (let i = 0; i < SEG; i++) for (let j = 0; j < RAD; j++) { const a = i * (RAD + 1) + j, b = a + RAD + 1; idx.push(a, b, a + 1, b, b + 1, a + 1); }

  const sh = (t, s) => { const x = gl.createShader(t); gl.shaderSource(x, s); gl.compileShader(x); if (!gl.getShaderParameter(x, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(x)); return x; };
  const link = (v, f) => { const p = gl.createProgram(); gl.attachShader(p, sh(gl.VERTEX_SHADER, v)); gl.attachShader(p, sh(gl.FRAGMENT_SHADER, f)); gl.bindAttribLocation(p, 0, 'p'); gl.linkProgram(p); return p; };
  const prog = link(`#version 300 es
  in vec3 pos, nor; in vec2 st; uniform mat4 PV, M; out vec3 vN, vW; out vec2 vS;
  void main() { vec4 w = M * vec4(pos, 1); vW = w.xyz; vN = mat3(M) * nor; vS = st; gl_Position = PV * w; }`, `#version 300 es
  precision highp float; in vec3 vN, vW; in vec2 vS; out vec4 o; uniform float T, F;
  vec3 env(vec3 d) {
    vec3 c = mix(vec3(.05, .05, .07), vec3(.5, .52, .58), smoothstep(-.3, .9, d.y));
    c += vec3(1.) * 2. * smoothstep(.1, .0, abs(d.x + .3) - .25) * smoothstep(.55, .75, d.y);
    c += vec3(1., .6, .35) * 1.2 * smoothstep(.08, .0, abs(d.z - .2) - .06) * smoothstep(-.2, .1, d.y) * smoothstep(.5, .2, d.y);
    return c;
  }
  void main() {
    vec3 n = normalize(vN), v = normalize(vec3(0, 0, 6.5) - vW), r = reflect(-v, n);
    float fr = pow(1. - max(0., dot(n, v)), 2.);
    vec3 film = .5 + .5 * cos(6.2832 * (fr * 1.4 + vec3(0., .33, .67) + vS.x * 2.));      // hue slides with the viewing angle
    vec3 c = env(r) * mix(vec3(.9), film, .55);
    float stripe = smoothstep(.45, .5, abs(fract(vS.x * 24. - T * .35 * F) - .5));       // stripes flowing along the knot
    c *= .82 + .18 * stripe;
    c += pow(max(0., dot(r, normalize(vec3(-.4, .8, .5)))), 60.) * .8;
    o = vec4(pow(c / (1. + c * .35), vec3(1. / 1.8)), 1);
  }`);
  const bg = link(`#version 300 es
  in vec2 p; out vec2 uv; void main() { uv = p * .5 + .5; gl_Position = vec4(p, .999, 1); }`, `#version 300 es
  precision highp float; in vec2 uv; out vec4 o; void main() { vec3 c = mix(vec3(.05, .05, .08), vec3(.16, .14, .2), uv.y); c += vec3(.25, .15, .3) * exp(-length(uv - vec2(.5, .55)) * 3.); o = vec4(c, 1); }`);
  const quadVao = gl.createVertexArray(); gl.bindVertexArray(quadVao);
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer()); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  const vao = gl.createVertexArray(); gl.bindVertexArray(vao);
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer()); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(verts), gl.STATIC_DRAW);
  [['pos', 3, 0], ['nor', 3, 12], ['st', 2, 24]].forEach(([nm, s, o]) => { const l = gl.getAttribLocation(prog, nm); gl.enableVertexAttribArray(l); gl.vertexAttribPointer(l, s, gl.FLOAT, false, 32, o); });
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, gl.createBuffer()); gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint32Array(idx), gl.STATIC_DRAW);
  const uPV = gl.getUniformLocation(prog, 'PV'), uM = gl.getUniformLocation(prog, 'M'), uT = gl.getUniformLocation(prog, 'T'), uF = gl.getUniformLocation(prog, 'F');
  // tiny matrix kit (column-major)
  const mul = (a, b) => { const o = new Float32Array(16); for (let c = 0; c < 4; c++) for (let r = 0; r < 4; r++) { let s = 0; for (let k = 0; k < 4; k++) s += a[k * 4 + r] * b[c * 4 + k]; o[c * 4 + r] = s; } return o; };
  const persp = (fov, asp, nr, f) => { const t = 1 / Math.tan(fov / 2); return new Float32Array([t / asp, 0, 0, 0, 0, t, 0, 0, 0, 0, (f + nr) / (nr - f), -1, 0, 0, 2 * f * nr / (nr - f), 0]); };
  const rotY = a => new Float32Array([Math.cos(a), 0, -Math.sin(a), 0, 0, 1, 0, 0, Math.sin(a), 0, Math.cos(a), 0, 0, 0, 0, 1]);
  const rotX = a => new Float32Array([1, 0, 0, 0, 0, Math.cos(a), Math.sin(a), 0, 0, -Math.sin(a), Math.cos(a), 0, 0, 0, 0, 1]);
  const trans = z => new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, z, 1]);
  const resize = () => { const d = Math.min(devicePixelRatio, 2); canvas.width = stage.clientWidth * d | 0; canvas.height = stage.clientHeight * d | 0; };
  const ro = new ResizeObserver(resize); ro.observe(stage); resize();
  let raf; const t0 = performance.now();
  function frame(now) {
    const t = (now - t0) / 1000, asp = canvas.width / canvas.height;
    gl.viewport(0, 0, canvas.width, canvas.height); gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.disable(gl.DEPTH_TEST); gl.useProgram(bg); gl.bindVertexArray(quadVao); gl.drawArrays(gl.TRIANGLES, 0, 3);
    gl.enable(gl.DEPTH_TEST); gl.useProgram(prog); gl.bindVertexArray(vao);
    const fit = Math.max(1, 1.25 / asp);                                              // pull back on tall stages
    gl.uniformMatrix4fv(uPV, false, mul(persp(0.7, asp, 0.1, 30), trans(-6.5 * fit)));
    gl.uniformMatrix4fv(uM, false, mul(rotX(0.9 + Math.sin(t * 0.3) * 0.25), rotY(t * 0.4)));
    gl.uniform1f(uT, t); gl.uniform1f(uF, PARAMS.flow);
    gl.drawElements(gl.TRIANGLES, idx.length, gl.UNSIGNED_INT, 0);
    raf = requestAnimationFrame(frame);
  }
  raf = requestAnimationFrame(frame);
  return () => { cancelAnimationFrame(raf); ro.disconnect(); gl.getExtension('WEBGL_lose_context')?.loseContext(); canvas.remove(); };
}
