// Type ribbon: a band of bold type twists through space on a Möbius strip, the words running round it endlessly.
// A Möbius strip has one side, so the line of type runs round the loop twice, once on each face, before it
// meets its own start, and every twist turns the next stretch of words toward you.
// The path is a closed figure-eight lifted at the crossing so the band never cuts itself. Its frame (which way
// "across" points) is carried along by parallel transport, which never spins on its own; the one rotation left
// over after a lap is cancelled and replaced by exactly half a turn per lap (or 3, 5...), the Möbius twist.
// The mesh is built over two laps: lap two is the same strip with "across" reversed, so it is the other face of
// the band, and back-face culling lets each lap draw only its own face. The words are drawn once into a canvas,
// mipmapped with anisotropic filtering so letters stay crisp edge-on, and slid along the band by offsetting u.
const PARAMS = { speed: 1, twists: 1, width: 1 };

export default function (stage) {
  const canvas = document.createElement('canvas');
  canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block;touch-action:pan-y';
  stage.append(canvas);
  const gl = canvas.getContext('webgl2', { antialias: true, alpha: false });
  if (!gl) { stage.textContent = 'This needs WebGL2.'; return () => canvas.remove(); }
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---- the path: a figure-eight, lifted where it crosses itself
  const path = t => [1.62 * Math.sin(t), 0.42 * Math.cos(t), 0.86 * Math.sin(2 * t)];
  const N = 900;                                                  // samples per lap
  const P = [], T = [];
  for (let i = 0; i < N; i++) P.push(path((i / N) * Math.PI * 2));
  const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
  const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  const norm = a => { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };
  for (let i = 0; i < N; i++) T.push(norm(sub(P[(i + 1) % N], P[(i + N - 1) % N])));
  // arc length, so the type keeps an even pitch however fast the curve runs
  const S = [0];
  for (let i = 1; i <= N; i++) S.push(S[i - 1] + Math.hypot(...sub(P[i % N], P[i - 1])));
  const LAP = S[N];
  // parallel transport: rotate the previous normal by the turn from one tangent to the next (no spin of its own)
  const Nrm = [norm(cross(T[0], [0, 1, 0]))];
  for (let i = 1; i <= N; i++) {
    const t0 = T[i - 1], t1 = T[i % N], n = Nrm[i - 1];
    const v = cross(t0, t1), c = dot(t0, t1);
    // Rodrigues for the rotation taking t0 to t1, applied to n
    const k = 1 / (1 + c);
    const vxn = cross(v, n), vvn = cross(v, vxn);
    Nrm.push(norm([n[0] + vxn[0] + vvn[0] * k, n[1] + vxn[1] + vvn[1] * k, n[2] + vxn[2] + vvn[2] * k]));
  }
  // the frame comes home rotated by some angle about the tangent: measure it, to cancel it along the way
  const B0 = cross(T[0], Nrm[0]);
  const drift = Math.atan2(dot(Nrm[N], B0), dot(Nrm[N], Nrm[0]));

  // ---- mesh: 2 laps × N segments × 2 across; each vertex: lap position s (0..2), across v (0..1)
  const ACROSS = 2;
  // columns 0..2N inclusive: the last one sits at s = 2, where the type has run exactly two laps (no wrap to squash it)
  const verts = new Float32Array((2 * N + 1) * ACROSS * 2);
  for (let i = 0, k = 0; i <= 2 * N; i++) for (let j = 0; j < ACROSS; j++) { verts[k++] = i / N; verts[k++] = j / (ACROSS - 1); }
  const idx = new Uint32Array(2 * N * (ACROSS - 1) * 6);
  for (let i = 0, k = 0; i < 2 * N; i++) {
    const a = i * ACROSS, b = (i + 1) * ACROSS;
    for (let j = 0; j < ACROSS - 1; j++) { idx[k++] = a + j; idx[k++] = b + j; idx[k++] = a + j + 1; idx[k++] = a + j + 1; idx[k++] = b + j; idx[k++] = b + j + 1; }
  }
  // the curve goes to the GPU as a texture: centre, tangent, normal, arc length per sample
  const curve = new Float32Array(N * 4 * 3);
  for (let i = 0; i < N; i++) {
    curve.set([P[i][0], P[i][1], P[i][2], S[i] / LAP], i * 4);
    curve.set([T[i][0], T[i][1], T[i][2], 0], (N + i) * 4);
    curve.set([Nrm[i][0], Nrm[i][1], Nrm[i][2], 0], (2 * N + i) * 4);
  }

  const VS = `#version 300 es
  precision highp float;
  layout(location=0) in vec2 a;                                   // x: lap position 0..2, y: across 0..1
  uniform sampler2D C; uniform mat4 VP; uniform float DRIFT, TWIST, W, N, PITCH, U0, MIRROR, FLOOR;
  out vec2 uv; out vec3 wp, nrm; out float hgt;
  vec4 at(float row, float s) { float x = fract(s) * N; float i = floor(x), f = x - i;
    vec4 p0 = texelFetch(C, ivec2(int(mod(i, N)), int(row)), 0), p1 = texelFetch(C, ivec2(int(mod(i + 1., N)), int(row)), 0);
    return mix(p0, p1, f); }
  void main() {
    float s = a.x, lap = floor(s), f = fract(s);
    vec4 c = at(0., s); vec3 t = normalize(at(1., s).xyz), n0 = normalize(at(2., s).xyz);
    n0 = normalize(n0 - t * dot(n0, t)); vec3 b0 = cross(t, n0);
    // undo the transport drift, then add the twist (half turns per lap); lap 2 is the reverse face
    float ang = -DRIFT * f + TWIST * 3.14159265 * f + lap * TWIST * 3.14159265;
    vec3 across = cos(ang) * n0 + sin(ang) * b0;
    float v = a.y - .5;
    wp = c.xyz + across * v * W;
    nrm = cross(t, across);
    hgt = wp.y - FLOOR;
    // the reflection pass: the same band mirrored in the glossy floor
    if (MIRROR > .5) { wp.y = FLOOR - hgt; nrm.y = -nrm.y; }
    // arc length along both laps, in tiles of type; the canvas's top row is the band's top edge
    uv = vec2((lap + c.w) * PITCH + U0, 1. - a.y);
    gl_Position = VP * vec4(wp, 1.);
  }`;
  const FS = `#version 300 es
  precision highp float;
  in vec2 uv; in vec3 wp, nrm; in float hgt; out vec4 o;
  uniform sampler2D TX; uniform vec3 EYE, PAPER, INK; uniform float FOG, MIRROR;
  void main() {
    vec3 n = normalize(nrm); vec3 v = normalize(EYE - wp);
    if (dot(n, v) < 0.) n = -n;                                     // lit from whichever face we see
    vec4 type = texture(TX, uv, MIRROR * 1.6);                     // the reflection is a little soft
    vec3 base = mix(PAPER, INK, type.r);
    // a soft studio: a big key from the upper left, a cool fill from below, a rim behind
    vec3 L = normalize(vec3(-.55, .8, .45)), F = normalize(vec3(.5, -.6, .4)), R = normalize(vec3(.2, .35, -1.));
    float key = max(dot(n, L), 0.), fill = max(dot(n, F), 0.), rim = pow(1. - max(dot(n, v), 0.), 3.);
    vec3 h = normalize(L + v); float spec = pow(max(dot(n, h), 0.), 60.) * (1. - type.r * .7);
    vec3 col = base * (.34 + .78 * key + .16 * fill * vec3(.85, .92, 1.)) + spec * .22 + rim * .12 * vec3(.9, .95, 1.) * max(dot(-v, R) + .4, 0.);
    // farther stretches of band sink into the dark
    float d = length(EYE - wp); col *= mix(1., .45, smoothstep(FOG - 1.2, FOG + 1.4, d));
    // in the floor: dimmer the higher the band rises above it, and tinted by the dark lacquer
    if (MIRROR > .5) col *= .2 * exp(-hgt * 1.6) * vec3(.9, .93, 1.);
    o = vec4(pow(col, vec3(1. / 2.2)), 1.);
  }`;
  const sh = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s)); return s; };
  const prog = gl.createProgram();
  gl.attachShader(prog, sh(gl.VERTEX_SHADER, VS)); gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FS)); gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog));
  const U = {}; ['C', 'VP', 'DRIFT', 'TWIST', 'W', 'N', 'PITCH', 'U0', 'TX', 'EYE', 'PAPER', 'INK', 'FOG', 'MIRROR', 'FLOOR'].forEach(n => U[n] = gl.getUniformLocation(prog, n));

  const vao = gl.createVertexArray(); gl.bindVertexArray(vao);
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer()); gl.bufferData(gl.ARRAY_BUFFER, verts, gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, gl.createBuffer()); gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, idx, gl.STATIC_DRAW);

  const curveTex = gl.createTexture(); gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, curveTex);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA32F, N, 3, 0, gl.RGBA, gl.FLOAT, curve);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

  // ---- the type: one line, drawn once, white on black (the shader maps it to ink on paper)
  const TW = 6144, TH = 384, line = 'MOTION · TYPE · IN · A · LOOP · ';
  const tc = document.createElement('canvas'); tc.width = TW; tc.height = TH;
  const g = tc.getContext('2d');
  g.fillStyle = '#000'; g.fillRect(0, 0, TW, TH); g.fillStyle = '#fff'; g.textBaseline = 'middle';
  let fs = 300; const face = s => `900 ${s}px "Helvetica Neue", "Arial Black", Arial, system-ui, sans-serif`;
  g.font = face(fs); const w0 = g.measureText(line).width; fs = Math.min(279, fs * TW / w0);
  g.font = face(fs);
  // letter-spaced to fill the tile exactly, so the line repeats with no seam
  const chars = [...line], widths = chars.map(c => g.measureText(c).width), total = widths.reduce((a, b) => a + b, 0), gap = (TW - total) / chars.length;
  for (let i = 0, x = gap / 2; i < chars.length; i++) { g.fillText(chars[i], x, TH * 0.54); x += widths[i] + gap; }
  // two thin rules along the edges, the way a printed band is finished
  g.fillRect(0, 15, TW, 9); g.fillRect(0, TH - 24, TW, 9);
  const typeTex = gl.createTexture(); gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, typeTex);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.R8, TW, TH, 0, gl.RED, gl.UNSIGNED_BYTE, (() => { const d = g.getImageData(0, 0, TW, TH).data, r = new Uint8Array(TW * TH); for (let i = 0; i < r.length; i++) r[i] = d[i * 4]; return r; })());
  gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
  gl.generateMipmap(gl.TEXTURE_2D);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  const an = gl.getExtension('EXT_texture_filter_anisotropic');
  if (an) gl.texParameterf(gl.TEXTURE_2D, an.TEXTURE_MAX_ANISOTROPY_EXT, Math.min(16, gl.getParameter(an.MAX_TEXTURE_MAX_ANISOTROPY_EXT)));

  let W = 1, H = 1;
  const resize = () => { const w = stage.clientWidth || 1, h = stage.clientHeight || 1, d = Math.min(devicePixelRatio, 2, Math.max(0.75, Math.sqrt(1600000 / (w * h)))); W = canvas.width = Math.max(1, (w * d) | 0); H = canvas.height = Math.max(1, (h * d) | 0); };
  const ro = new ResizeObserver(resize); ro.observe(stage); resize();

  // the pointer leans the camera; a resting mouse holds the lean, leaving lets it drift back
  let px = 0, py = 0, lastMove = -1e9, held = false;
  const onMove = e => { const b = canvas.getBoundingClientRect(); px = ((e.clientX - b.left) / b.width) * 2 - 1; py = ((e.clientY - b.top) / b.height) * 2 - 1; lastMove = performance.now(); held = e.pointerType === 'mouse'; };
  const onLeave = () => { held = false; };
  canvas.addEventListener('pointermove', onMove); canvas.addEventListener('pointerdown', onMove); canvas.addEventListener('pointerleave', onLeave);

  const persp = (fov, a, n, f) => { const t = 1 / Math.tan(fov / 2); return [t / a, 0, 0, 0, 0, t, 0, 0, 0, 0, (f + n) / (n - f), -1, 0, 0, 2 * f * n / (n - f), 0]; };
  const lookAt = (e, c, up) => { const z = norm(sub(e, c)), x = norm(cross(up, z)), y = cross(z, x); return [x[0], y[0], z[0], 0, x[1], y[1], z[1], 0, x[2], y[2], z[2], 0, -dot(x, e), -dot(y, e), -dot(z, e), 1]; };
  const mul = (a, b) => { const o = new Array(16); for (let c = 0; c < 4; c++) for (let r = 0; r < 4; r++) { let s = 0; for (let k = 0; k < 4; k++) s += a[k * 4 + r] * b[c * 4 + k]; o[c * 4 + r] = s; } return o; };

  const twists = Math.max(1, Math.round(PARAMS.twists)) | 1;       // odd: half turns per lap, so the band has one side
  const width = 0.5 * Math.max(0.4, Math.min(1.8, PARAMS.width));
  const pitch = Math.max(1, Math.round((2 * LAP) / (width * TW / TH * 0.92)));   // whole tiles over both laps: no seam
  let raf, last = performance.now(), t = reduce ? 3.2 : 0, yaw = 0, yv = 0, pitchA = 0, pv = 0;
  function frame(now) {
    const dt = Math.min(1 / 30, (now - last) / 1000); last = now;
    if (!reduce) t += dt;
    const live = held || now - lastMove < 1800;
    // springs toward the pointer (or a slow orbit when left alone)
    const ty = live ? px * 0.75 : 0.42 * Math.sin(t * 0.21), tp = live ? -py * 0.32 : 0.06 * Math.sin(t * 0.17 + 1);
    const k = 18, z = 2 * Math.sqrt(k) * 0.9;
    yv += (k * (ty - yaw) - z * yv) * dt; yaw += yv * dt; pv += (k * (tp - pitchA) - z * pv) * dt; pitchA += pv * dt;
    const a = W / H, R = Math.max(5.1, 6.9 / a), el = 0.3 + pitchA;
    const spin = t * 0.12 + yaw;
    const eye = [Math.sin(spin) * Math.cos(el) * R, Math.sin(el) * R, Math.cos(spin) * Math.cos(el) * R];
    const VP = mul(persp(0.62, a, 0.1, 40), lookAt(eye, [0, -0.34, 0], [0, 1, 0]));
    gl.viewport(0, 0, W, H);
    gl.clearColor(0.043, 0.043, 0.05, 1); gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.enable(gl.DEPTH_TEST); gl.enable(gl.CULL_FACE); gl.cullFace(gl.BACK);
    gl.useProgram(prog); gl.bindVertexArray(vao);
    gl.uniform1i(U.C, 0); gl.uniform1i(U.TX, 1);
    gl.uniformMatrix4fv(U.VP, false, VP);
    gl.uniform1f(U.DRIFT, drift); gl.uniform1f(U.TWIST, twists); gl.uniform1f(U.W, width); gl.uniform1f(U.N, N);
    gl.uniform1f(U.PITCH, pitch / 2); gl.uniform1f(U.U0, -t * 0.09 * PARAMS.speed * (reduce ? 0 : 1));
    gl.uniform3fv(U.EYE, eye); gl.uniform1f(U.FOG, R);
    gl.uniform3f(U.PAPER, 0.93, 0.89, 0.82); gl.uniform3f(U.INK, 0.06, 0.06, 0.07);
    gl.uniform1f(U.FLOOR, -0.86);
    // the reflection first (mirroring flips the winding, so cull the other face), then the band itself
    gl.uniform1f(U.MIRROR, 1); gl.cullFace(gl.FRONT); gl.drawElements(gl.TRIANGLES, idx.length, gl.UNSIGNED_INT, 0);
    gl.uniform1f(U.MIRROR, 0); gl.cullFace(gl.BACK); gl.drawElements(gl.TRIANGLES, idx.length, gl.UNSIGNED_INT, 0);
    if (!reduce) raf = requestAnimationFrame(frame);
  }
  if (reduce) frame(performance.now()); else raf = requestAnimationFrame(frame);
  const ro2 = reduce ? new ResizeObserver(() => frame(performance.now())) : null; ro2?.observe(stage);

  return () => {
    cancelAnimationFrame(raf); ro.disconnect(); ro2?.disconnect();
    canvas.removeEventListener('pointermove', onMove); canvas.removeEventListener('pointerdown', onMove); canvas.removeEventListener('pointerleave', onLeave);
    gl.getExtension('WEBGL_lose_context')?.loseContext(); canvas.remove();
  };
}
