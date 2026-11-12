// Meadow: a hillside of long grass at the end of the day. Gusts roll across it in waves you can watch travel, each
// one bending the blades over so their paler, sunlit sides show, and the blades along the crest glow where the low
// sun shines through them. Move across it to turn the wind.
// Sixty thousand blades are drawn as one instanced strip: each blade is seven segments, and every segment bends a
// little more than the one below it, by an amount the vertex shader works out from the wind at that blade's root.
// The wind is a slow prevailing push plus gusts: bands of noise that travel downwind across the field, so a gust
// visibly moves from one side to the other. Blades nearer the camera are placed more densely, the hill is a sum of
// low waves, and the light is a low sun behind the hill: back-lit blades let it through, the haze takes the distance.
const PARAMS = { blades: 60000, wind: 1, gusts: 1 };

export default function (stage) {
  const canvas = document.createElement('canvas');
  canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block;touch-action:pan-y';
  stage.append(canvas);
  const gl = canvas.getContext('webgl2', { antialias: true, alpha: false });
  if (!gl) { stage.textContent = 'This needs WebGL2.'; return () => canvas.remove(); }
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  const HILL = `
  float hill(vec2 p) { return .9 * sin(p.x * .11 + .6) * cos(p.y * .09) + .55 * sin(p.x * .27 - p.y * .21 + 1.3) + .2 * sin(p.x * .7 + p.y * .53) + p.y * .07; }`;
  // ---- blades
  const VS = `#version 300 es
  layout(location=0) in vec2 seg;                                     // x: -1/+1 side, y: 0..1 up the blade
  layout(location=1) in vec4 inst;                                    // root x, z, height, width
  layout(location=2) in vec2 inst2;                                   // facing angle, random
  uniform mat4 VP; uniform float T, WIND, GUST; uniform vec2 WDIR; uniform vec3 EYE;
  out vec3 wp, nrm; out float along, rnd, bend;
  ${HILL}
  float h1(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float n2(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f); return mix(mix(h1(i), h1(i + vec2(1, 0)), f.x), mix(h1(i + vec2(0, 1)), h1(i + vec2(1, 1)), f.x), f.y); }
  void main() {
    vec2 root = inst.xy; float H = inst.z, Wd = inst.w, face = inst2.x; rnd = inst2.y;
    // the wind at the root: a steady push plus gust bands carried downwind
    vec2 q = root - WDIR * T * 3.2;
    float gust = n2(q * .09) * .65 + n2(q * .23 + 7.) * .35;
    gust = smoothstep(.35, .85, gust) * GUST;
    float sway = sin(T * 2.3 + rnd * 6.28 + root.x * .3) * .06;
    float w = WIND * (.1 + .78 * gust) + sway;
    bend = gust;
    // the blade: each step up leans further over (a cantilever bending under load)
    float t = seg.y, lean = w * t * t * 1.25 + .18 * (rnd - .5) * t;
    vec2 side = vec2(cos(face), sin(face));
    vec3 dirUp = vec3(0, 1, 0);
    vec3 dirW = normalize(vec3(WDIR.x, 0., WDIR.y) + vec3(side.x, 0., side.y) * .25 * (rnd - .5));
    float ang = min(1.35, lean);
    vec3 base = vec3(root.x, hill(root), root.y);
    // integrate the curve in closed form: height and downwind offset of a uniformly bending arc
    float a = ang, len = H * t;
    vec3 p = base + dirUp * len * (a < 1e-3 ? 1. : sin(a) / a) + dirW * len * (a < 1e-3 ? 0. : (1. - cos(a)) / a);
    float wTaper = Wd * (1. - t * .92);
    vec3 across = normalize(vec3(-side.y, 0., side.x));
    p += across * seg.x * wTaper;
    wp = p; along = t;
    vec3 tangent = normalize(dirUp * cos(a) + dirW * sin(a));
    nrm = normalize(cross(across, tangent));
    if (dot(nrm, EYE - p) < 0.) nrm = -nrm;
    gl_Position = VP * vec4(p, 1.);
  }`;
  const FS = `#version 300 es
  precision highp float;
  in vec3 wp, nrm; in float along, rnd, bend; out vec4 o;
  uniform vec3 EYE, SUN; uniform float FOGD;
  vec3 tm(vec3 c) { c *= .62; c = c * (2.51 * c + .03) / (c * (2.43 * c + .59) + .14); return pow(clamp(c, 0., 1.), vec3(1. / 2.2)); }   // exposure, ACES, gamma
  void main() {
    vec3 n = normalize(nrm), v = normalize(EYE - wp);
    vec3 root = vec3(.012, .022, .006), mid = vec3(.07, .13, .03), tip = mix(vec3(.3, .3, .08), vec3(.42, .33, .1), rnd);
    vec3 col = along < .5 ? mix(root, mid, along * 2.) : mix(mid, tip, (along - .5) * 2.);
    float dif = max(dot(n, SUN), 0.);
    // light through the blade toward the low sun, only near the tips; and the sheen of a blade bent over by a gust
    float toward = max(dot(-v, SUN), 0.);
    float back = pow(toward, 10.) * along * along;
    float rim = pow(1. - abs(dot(n, v)), 2.) * toward * toward * along * along;   // edges glow against the low sun
    float sheen = pow(max(dot(reflect(-SUN, n), v), 0.), 24.) * .25 * along;
    vec3 sunC = vec3(1., .68, .36), sky = vec3(.3, .36, .5);
    vec3 c = col * (sky * .32 + dif * sunC * .8) + col * (back * 3.4 + rim * 2.2) * sunC + sheen * sunC + bend * along * along * vec3(.2, .14, .05);
    float d = length(EYE - wp);
    vec3 haze = vec3(.55, .38, .24);
    c = mix(c, haze, (1. - exp(-d / FOGD)) * .7);
    o = vec4(tm(c), 1.);
  }`;
  // ---- sky and ground (one full-screen pass behind the blades)
  const VS2 = `#version 300 es
  void main() { vec2 p = vec2((gl_VertexID << 1) & 2, gl_VertexID & 2); gl_Position = vec4(p * 2. - 1., 1., 1.); }`;
  const FS2 = `#version 300 es
  precision highp float; out vec4 o;
  uniform vec2 RES; uniform vec3 EYE, FWD, RGT, UPV, SUN; uniform float FOC, FOGD;
  ${HILL}
  vec3 tm(vec3 c) { c *= .62; c = c * (2.51 * c + .03) / (c * (2.43 * c + .59) + .14); return pow(clamp(c, 0., 1.), vec3(1. / 2.2)); }   // exposure, ACES, gamma
  void main() {
    vec2 uv = (gl_FragCoord.xy - .5 * RES) / RES.y;
    vec3 rd = normalize(FWD * FOC + RGT * uv.x + UPV * uv.y);
    // the hill under the grass: march the height field
    float t = .1; bool hit = false;
    for (int i = 0; i < 90; i++) { vec3 p = EYE + rd * t; float h = p.y - hill(p.xz); if (h < .002) { hit = true; break; } t += max(.03, h * .6); if (t > 260.) break; }
    vec3 col;
    if (hit) { col = mix(vec3(.3, .24, .08), vec3(.55, .38, .24), (1. - exp(-t / FOGD)) * .7); }   // distant grass, too far for blades: its sunlit tips
    else {
      float s = max(dot(rd, SUN), 0.);
      col = mix(vec3(.9, .42, .14), vec3(.2, .22, .36), smoothstep(-.01, .14, rd.y));
      col = mix(col, vec3(.06, .09, .22), smoothstep(.14, .45, rd.y));
      col += vec3(1., .66, .34) * (pow(s, 40.) * .7 + pow(s, 900.) * 9.);
    }
    vec2 q = gl_FragCoord.xy / RES - .5;
    o = vec4(tm(col) * (1. - .5 * dot(q, q)), 1.);
  }`;
  const sh = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s)); return s; };
  const program = (vs, fs) => { const p = gl.createProgram(); gl.attachShader(p, sh(gl.VERTEX_SHADER, vs)); gl.attachShader(p, sh(gl.FRAGMENT_SHADER, fs)); gl.linkProgram(p); if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p)); const u = {}; return { p, u: n => (u[n] ??= gl.getUniformLocation(p, n)) }; };
  const pBlade = program(VS, FS), pSky = program(VS2, FS2);

  // one blade: 7 segments as a triangle strip
  const SEG = 7, strip = [];
  for (let i = 0; i <= SEG; i++) { const t = i / SEG; strip.push(-1, t, 1, t); }
  // the blades: dense near the camera, sparser further off, on a wedge in front of it
  const N = Math.max(5000, Math.min(150000, Math.round(PARAMS.blades)));
  const inst = new Float32Array(N * 4), inst2 = new Float32Array(N * 2);
  let seed = 11; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  for (let i = 0; i < N; i++) {
    const d = 0.6 + Math.pow(rnd(), 2.3) * 78, a = (rnd() - 0.5) * (1.25 + 0.6 / (0.3 + d * 0.15));
    const x = Math.sin(a) * d, z = -Math.cos(a) * d;
    inst[i * 4] = x; inst[i * 4 + 1] = z; inst[i * 4 + 2] = (0.42 + rnd() * 0.42) * (1 + d * 0.012); inst[i * 4 + 3] = (0.012 + rnd() * 0.012) * (1 + d * 0.045);
    inst2[i * 2] = rnd() * Math.PI * 2; inst2[i * 2 + 1] = rnd();
  }
  const vao = gl.createVertexArray(); gl.bindVertexArray(vao);
  const buf = (data, loc, size, div) => { const b = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b); gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, size, gl.FLOAT, false, 0, 0); gl.vertexAttribDivisor(loc, div); };
  buf(new Float32Array(strip), 0, 2, 0); buf(inst, 1, 4, 1); buf(inst2, 2, 2, 1);
  const empty = gl.createVertexArray();

  let W = 1, H = 1;
  const resize = () => { const w = stage.clientWidth || 1, h = stage.clientHeight || 1, d = Math.min(devicePixelRatio, 2, Math.max(0.6, Math.sqrt(1300000 / (w * h)))); W = canvas.width = Math.max(1, (w * d) | 0); H = canvas.height = Math.max(1, (h * d) | 0); };
  const ro = new ResizeObserver(resize); ro.observe(stage); resize();

  // the pointer turns the wind; a resting mouse holds it, leaving lets it swing back
  let px = 0, lastMove = -1e9, held = false;
  const onMove = e => { const b = canvas.getBoundingClientRect(); px = ((e.clientX - b.left) / b.width) * 2 - 1; lastMove = performance.now(); held = e.pointerType === 'mouse'; };
  const onLeave = () => { held = false; };
  canvas.addEventListener('pointermove', onMove); canvas.addEventListener('pointerdown', onMove); canvas.addEventListener('pointerleave', onLeave);

  const norm = a => { const l = Math.hypot(...a) || 1; return a.map(x => x / l); };
  const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  const hill = (x, z) => 0.9 * Math.sin(x * 0.11 + 0.6) * Math.cos(z * 0.09) + 0.55 * Math.sin(x * 0.27 - z * 0.21 + 1.3) + 0.2 * Math.sin(x * 0.7 + z * 0.53) + z * 0.07;
  const SUN = norm([0.25, 0.09, -1]);                                // low, ahead: the field is back-lit
  let raf, last = performance.now(), t = reduce ? 6 : 0, wa = 0, wv = 0;
  function frame(now) {
    const dt = Math.min(1 / 30, (now - last) / 1000); last = now;
    if (!reduce) t += dt;
    const live = held || now - lastMove < 1800;
    const target = live ? px * 0.9 : 0.35 * Math.sin(t * 0.05);
    wv += (9 * (target - wa) - 6 * wv) * dt; wa += wv * dt;
    const wdir = [Math.sin(wa + 0.35), -Math.cos(wa + 0.35) * 0.4 + 0.6];   // mostly across the view, a little toward us
    const wl = Math.hypot(...wdir); wdir[0] /= wl; wdir[1] /= wl;
    const a = W / H, FOC = 1.35 * Math.min(1, a / 1.2) + 0.25;
    const eye = [0, hill(0, 0) + 1.05, 0.4], at = [0.6, hill(0, -12) + 0.9, -12];
    const f = norm([at[0] - eye[0], at[1] - eye[1], at[2] - eye[2]]), r = norm(cross(f, [0, 1, 0])), u = cross(r, f);
    const P = [2 * FOC / a, 0, 0, 0, 0, 2 * FOC, 0, 0, 0, 0, -(300 + 0.05) / (300 - 0.05), -1, 0, 0, -2 * 300 * 0.05 / (300 - 0.05), 0];
    const V = [r[0], u[0], -f[0], 0, r[1], u[1], -f[1], 0, r[2], u[2], -f[2], 0, -dot(r, eye), -dot(u, eye), dot(f, eye), 1];
    const VP = new Array(16); for (let c = 0; c < 4; c++) for (let k = 0; k < 4; k++) { let s = 0; for (let m = 0; m < 4; m++) s += P[m * 4 + k] * V[c * 4 + m]; VP[c * 4 + k] = s; }
    const FOGD = 70;
    gl.viewport(0, 0, W, H);
    gl.clearColor(0, 0, 0, 1); gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    // sky and hill first, at the far plane
    gl.disable(gl.DEPTH_TEST); gl.useProgram(pSky.p); gl.bindVertexArray(empty);
    gl.uniform2f(pSky.u('RES'), W, H); gl.uniform3fv(pSky.u('EYE'), eye); gl.uniform3fv(pSky.u('FWD'), f); gl.uniform3fv(pSky.u('RGT'), r); gl.uniform3fv(pSky.u('UPV'), u);
    gl.uniform3fv(pSky.u('SUN'), SUN); gl.uniform1f(pSky.u('FOC'), FOC); gl.uniform1f(pSky.u('FOGD'), FOGD);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    // the grass
    gl.enable(gl.DEPTH_TEST); gl.disable(gl.CULL_FACE);
    gl.useProgram(pBlade.p); gl.bindVertexArray(vao);
    gl.uniformMatrix4fv(pBlade.u('VP'), false, VP); gl.uniform1f(pBlade.u('T'), t); gl.uniform1f(pBlade.u('WIND'), PARAMS.wind); gl.uniform1f(pBlade.u('GUST'), PARAMS.gusts);
    gl.uniform2f(pBlade.u('WDIR'), wdir[0], wdir[1]); gl.uniform3fv(pBlade.u('EYE'), eye); gl.uniform3fv(pBlade.u('SUN'), SUN); gl.uniform1f(pBlade.u('FOGD'), FOGD);
    gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, (SEG + 1) * 2, N);
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
