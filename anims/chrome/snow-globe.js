// Snow globe: a water-filled glass globe on a turned wooden base, a cabin with a lit window and three pines inside.
// Now and then it is given a shake: the snow is thrown up in a swirl, tumbles, and settles back over the scene.
// Drag sideways across it to shake it yourself.
// The scene inside is ray-marched from signed distance functions, but only after the ray has been bent into the
// water at the glass (Snell's law, water against air), so the cabin is magnified and wraps at the rim the way it
// does in a real globe. The flakes are 900 particles in a swirling flow that decays with time: they are dragged by
// the water, sink slowly, rest when they land, and are lifted again when it moves. They are drawn as soft discs,
// pushed out from the centre by the same lens. A last pass lays the glass over everything: a Fresnel reflection of
// the studio's softboxes and the sharp highlights that make the sphere read as glass.
const PARAMS = { flakes: 900, shake: 1, every: 9 };

export default function (stage) {
  const canvas = document.createElement('canvas');
  canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block;touch-action:pan-y;cursor:grab';
  stage.append(canvas);
  const gl = canvas.getContext('webgl2', { antialias: false, premultipliedAlpha: false, alpha: false });
  if (!gl) { stage.textContent = 'This needs WebGL2.'; return () => canvas.remove(); }
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  const COMMON = `
  const vec3 C = vec3(0., .22, 0.); const float R = 1.;
  uniform vec2 RES; uniform vec3 EYE, FWD, RGT, UPV; uniform float FOC, T, SWAY;
  vec3 rayDir(vec2 fc) { vec2 p = (fc - .5 * RES) / RES.y; return normalize(FWD * FOC + RGT * p.x + UPV * p.y); }
  vec2 sph(vec3 ro, vec3 rd, vec3 c, float r) { vec3 oc = ro - c; float b = dot(oc, rd), h = b * b - dot(oc, oc) + r * r; if (h < 0.) return vec2(-1.); h = sqrt(h); return vec2(-b - h, -b + h); }
  // the studio: two softboxes (a big key above left, a strip to the right) on a dark grey sweep
  vec3 studio(vec3 d) {
    vec3 c = mix(vec3(.01, .01, .012), vec3(.035, .034, .038), smoothstep(-.3, .6, d.y)) * 1.;
    // a square softbox up and to the left: sharp edges, so its reflection reads as a window on the glass
    vec3 kd = normalize(vec3(-.55, .75, .55)), ku = normalize(cross(cross(kd, vec3(0, 1, 0)), kd)), kr = cross(kd, ku);
    float kz = dot(d, kd); vec2 kq = vec2(dot(d, kr), dot(d, ku)) / max(kz, 1e-3);
    c += vec3(1., .97, .92) * 60. * step(0., kz) * smoothstep(.2, .17, abs(kq.x)) * smoothstep(.14, .11, abs(kq.y));
    float strip = smoothstep(.035, .015, abs(d.x - .8)) * smoothstep(-.05, .1, d.y) * smoothstep(.7, .45, d.y) * step(0., d.z);
    c += vec3(.85, .9, 1.) * 22. * strip;
    return c;
  }`;

  // pass 1: backdrop, base, and the scene inside the globe (seen through the water)
  const FS_SCENE = `#version 300 es
  precision highp float; out vec4 o;
  ${COMMON}
  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float noise(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f); return mix(mix(hash(i), hash(i + vec2(1, 0)), f.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), f.x), f.y); }
  float sdBox(vec3 p, vec3 b) { vec3 q = abs(p) - b; return length(max(q, 0.)) + min(max(q.x, max(q.y, q.z)), 0.); }
  float sdCone(vec3 p, float h, float r) { float q = length(p.xz); return max(dot(vec2(h, r) / length(vec2(h, r)), vec2(q, p.y - h)) , -p.y); }
  // the scene in globe coordinates (centre at the origin)
  vec2 scene(vec3 p) {
    float ground = p.y + .42 - .09 * exp(-dot(p.xz, p.xz) * 2.6) - .02 * noise(p.xz * 6.);
    vec2 r = vec2(ground, 1.);
    vec3 q = p - vec3(.1, -.27, -.04);
    float house = sdBox(q, vec3(.17, .1, .13)) - .006;
    vec3 rq = q - vec3(0., .1, 0.); float roof = max(abs(rq.x) * .78 + rq.y * .9 - .15, abs(rq.z) - .155); roof = max(roof, -rq.y - .01);
    float chimney = sdBox(q - vec3(-.09, .2, .05), vec3(.025, .06, .025));
    float cabin = min(min(house, roof - .004), chimney);
    if (cabin < r.x) r = vec2(cabin, roof - .004 < house ? 3. : 2.);
    for (int i = 0; i < 3; i++) {
      vec3 tp = i == 0 ? vec3(-.42, -.33, .12) : i == 1 ? vec3(-.22, -.32, -.38) : vec3(.48, -.33, -.22);
      float hh = i == 1 ? .52 : .42;
      vec3 lp = p - tp; float tr = sdCone(lp - vec3(0, .04, 0), hh, hh * .34);
      tr = min(tr, sdCone(lp - vec3(0, .18, 0), hh * .72, hh * .27));
      float trunk = sdBox(lp, vec3(.02, .06, .02));
      tr = min(tr, trunk);
      if (tr < r.x) r = vec2(tr, 4.);
    }
    return r;
  }
  vec3 nrm(vec3 p) { vec2 e = vec2(.0015, 0); return normalize(vec3(scene(p + e.xyy).x - scene(p - e.xyy).x, scene(p + e.yxy).x - scene(p - e.yxy).x, scene(p + e.yyx).x - scene(p - e.yyx).x)); }
  vec3 inside(vec3 ro, vec3 rd, float tmax) {
    float t = .0; vec2 h = vec2(1., 0.);
    for (int i = 0; i < 80; i++) { h = scene(ro + rd * t); if (h.x < .0012 || t > tmax) break; t += h.x * .9; }
    vec3 water = vec3(.018, .03, .062);                                // night-blue water against the far glass
    if (t > tmax) return water * (.8 + .2 * rd.y) + studio(reflect(rd, normalize(ro + rd * tmax))) * .008;
    vec3 p = ro + rd * t, n = nrm(p), col;
    vec3 L = normalize(vec3(-.5, .8, .35)), lamp = vec3(.1, -.27, .1);   // the key, and the cabin's window glow
    float dif = max(dot(n, L), 0.), ao = clamp(scene(p + n * .05).x / .05, 0., 1.), up = smoothstep(.2, .8, n.y);
    vec3 snow = vec3(.78, .84, .98);                                   // moonlit: cool, the window warms it
    if (h.y < 1.5) col = snow * (.3 + .75 * dif) * (.85 + .15 * noise(p.xz * 40.));
    else if (h.y < 2.5) { col = vec3(.38, .2, .11) * (.25 + .7 * dif);
      vec3 q = p - vec3(.1, -.27, -.04);
      float win = step(abs(q.x - .05), .04) * step(abs(q.y + .01), .035) * step(.12, q.z);
      float door = step(abs(q.x + .07), .028) * step(q.y, .03) * step(.12, q.z);
      col = mix(col, vec3(1., .62, .25) * 2.2, win); col = mix(col, vec3(.2, .1, .05), door); }
    else if (h.y < 3.5) col = mix(vec3(.3, .16, .1), snow, up) * (.3 + .75 * dif);
    else col = mix(vec3(.05, .17, .1), snow, up * smoothstep(.4, .7, noise(p.xz * 30. + p.y * 9.))) * (.28 + .8 * dif);
    // warm light from the window falls on the snow in front of the cabin
    float dl = length(p - lamp - vec3(0, 0, .15)); col += vec3(1., .55, .2) * .55 / (1. + dl * dl * 45.) * (1. - step(2.5, h.y) * .5);
    col *= .55 + .45 * ao;
    return mix(water, col, exp(-t * .22));
  }
  void main() {
    vec3 rd = rayDir(gl_FragCoord.xy), ro = EYE, col;
    // the floor and its sweep
    float tf = (-1.02 - ro.y) / rd.y; vec3 fp = ro + rd * max(tf, 0.);
    col = studio(rd) * .25;
    if (tf > 0.) { float r = length(fp.xz);
      vec3 fl = vec3(.022, .021, .023) + vec3(.07, .06, .052) * exp(-r * r * .22);
      fl *= 1. - .75 * smoothstep(1.15, .82, r);                      // the base's contact shadow
      col = mix(fl, col, smoothstep(5., 11., tf)); }
    // the base: a turned wooden plinth (a cylinder with a rounded top edge)
    vec2 bc = vec2(1e9);
    { vec3 oc = ro - vec3(0, -.85, 0); float a = dot(rd.xz, rd.xz), b = dot(oc.xz, rd.xz), c = dot(oc.xz, oc.xz) - .82 * .82, h = b * b - a * c;
      if (h > 0.) { float t = (-b - sqrt(h)) / a; vec3 p = ro + rd * t; if (abs(p.y + .85) < .17) bc = vec2(t, 0.); }
      float tt = (-.68 - ro.y) / rd.y; vec3 p = ro + rd * tt; if (tt > 0. && length(p.xz) < .82 && tt < bc.x) bc = vec2(tt, 1.); }
    vec2 g = sph(ro, rd, C, R);
    bool glass = g.x > 0. && g.x < bc.x;
    if (bc.x < 1e8 && !glass) {
      vec3 p = ro + rd * bc.x, n = bc.y > .5 ? vec3(0, 1, 0) : normalize(vec3(p.x, 0, p.z));
      float grain = noise(vec2(atan(p.z, p.x) * 3., p.y * 90.)) * .5 + noise(vec2(atan(p.z, p.x) * 40., p.y * 300.)) * .5;
      vec3 wood = mix(vec3(.16, .075, .035), vec3(.3, .15, .07), grain) * .9;
      vec3 L = normalize(vec3(-.55, .75, .35)); float d = max(dot(n, L), 0.);
      col = wood * (.18 + .9 * d) + studio(reflect(rd, n)) * .012;
      col *= 1. - .6 * smoothstep(.3, .0, length(p.xz) - .55) * step(.5, bc.y);   // the globe's contact shadow on the top
    }
    if (glass) {
      vec3 p = ro + rd * g.x, n = normalize(p - C);
      vec3 rr = refract(rd, n, 1. / 1.33);
      vec2 g2 = sph(p + rr * 1e-3, rr, C, R * .975);
      float tmax = max(g2.y, .0);
      vec3 lp = (p - C) + rr * 1e-3;
      // the water sways for a moment after a shake: tilt the scene the other way, a touch
      float s = SWAY; mat2 sw = mat2(cos(s), -sin(s), sin(s), cos(s)); lp.xy = sw * lp.xy; vec3 lr = rr; lr.xy = sw * lr.xy;
      col = inside(lp, lr, tmax);
      col *= mix(1., .45, pow(1. - max(dot(-rd, n), 0.), 2.5));      // the glass thickens toward the rim
    }
    o = vec4(col, 1.);
  }`;

  // pass 2: the flakes, as soft discs
  const VS_FLAKE = `#version 300 es
  layout(location=0) in vec4 a;                                       // xyz in the globe, w: size
  uniform mat4 VP; uniform vec2 RES; out float sz, dep;
  void main() {
    vec3 p = a.xyz; float r = length(p);
    p *= 1. + .26 * (1. - r * r);                                     // the water lens magnifies toward the middle
    vec4 c = VP * vec4(p + vec3(0., .22, 0.), 1.);
    gl_Position = c; sz = a.w; dep = c.w;
    gl_PointSize = a.w * RES.y * .017 / c.w;
  }`;
  const FS_FLAKE = `#version 300 es
  precision highp float; in float sz, dep; out vec4 o;
  void main() { vec2 q = gl_PointCoord * 2. - 1.; float d = dot(q, q); if (d > 1.) discard;
    float a = smoothstep(1., .3, d) * .9; o = vec4(vec3(.95, .97, 1.) * (.75 + .25 * (1. - q.y)), a); }`;

  // pass 3: the glass itself, reflections and highlights over everything
  const FS_GLASS = `#version 300 es
  precision highp float; out vec4 o;
  ${COMMON}
  void main() {
    vec3 rd = rayDir(gl_FragCoord.xy); vec2 g = sph(EYE, rd, C, R);
    if (g.x < 0.) discard;
    vec3 p = EYE + rd * g.x, n = normalize(p - C);
    float f = .04 + .96 * pow(1. - max(dot(-rd, n), 0.), 5.);
    vec3 refl = studio(reflect(rd, n));
    vec3 col = refl * f * 1.3 + vec3(.6, .7, .8) * pow(1. - max(dot(-rd, n), 0.), 3.) * .06;
    float a = clamp(max(max(col.r, col.g), col.b), 0., 1.);
    o = vec4(col / max(a, 1e-3), a);
  }`;
  const FS_POST = `#version 300 es
  precision highp float; out vec4 o; uniform sampler2D S; uniform vec2 RES;
  void main() { vec2 uv = gl_FragCoord.xy / RES; vec3 c = texture(S, uv).rgb;
    c = c * (2.51 * c + .03) / (c * (2.43 * c + .59) + .14);            // ACES-ish tone curve
    float v = length(uv - .5); c *= 1. - .35 * v * v;
    o = vec4(pow(clamp(c, 0., 1.), vec3(1. / 2.2)), 1.); }`;
  const VS_FULL = `#version 300 es
  void main() { vec2 p = vec2((gl_VertexID << 1) & 2, gl_VertexID & 2); gl_Position = vec4(p * 2. - 1., 0., 1.); }`;

  const sh = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s)); return s; };
  const program = (vs, fs) => { const p = gl.createProgram(); gl.attachShader(p, sh(gl.VERTEX_SHADER, vs)); gl.attachShader(p, sh(gl.FRAGMENT_SHADER, fs)); gl.linkProgram(p); if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p)); const u = {}; return { p, u: n => (u[n] ??= gl.getUniformLocation(p, n)) }; };
  const pScene = program(VS_FULL, FS_SCENE), pGlass = program(VS_FULL, FS_GLASS), pPost = program(VS_FULL, FS_POST), pFlake = program(VS_FLAKE, FS_FLAKE);
  const empty = gl.createVertexArray();

  // HDR target (linear light), then tone mapped to the canvas
  const half = !!gl.getExtension('EXT_color_buffer_float') || !!gl.getExtension('EXT_color_buffer_half_float');
  let fbo = null, tex = null, W = 1, H = 1;
  const resize = () => {
    const w = stage.clientWidth || 1, h = stage.clientHeight || 1, d = Math.min(devicePixelRatio, 2, Math.max(0.6, Math.sqrt(900000 / (w * h))));
    W = canvas.width = Math.max(1, (w * d) | 0); H = canvas.height = Math.max(1, (h * d) | 0);
    if (tex) gl.deleteTexture(tex); if (fbo) gl.deleteFramebuffer(fbo);
    tex = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, half ? gl.RGBA16F : gl.RGBA8, W, H, 0, gl.RGBA, half ? gl.HALF_FLOAT : gl.UNSIGNED_BYTE, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    fbo = gl.createFramebuffer(); gl.bindFramebuffer(gl.FRAMEBUFFER, fbo); gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0); gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  };
  const ro = new ResizeObserver(resize); ro.observe(stage); resize();

  // ---- the snow: positions inside the globe (radius .94), a decaying swirl in the water
  const N = Math.max(200, Math.min(3000, Math.round(PARAMS.flakes)));
  const fp = new Float32Array(N * 4), fv = new Float32Array(N * 3), rest = new Uint8Array(N);
  let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const groundY = (x, z) => -0.42 + 0.09 * Math.exp(-(x * x + z * z) * 2.6);
  for (let i = 0; i < N; i++) {
    // start settled on the ground, with a few still drifting
    const a = rnd() * Math.PI * 2, r = Math.sqrt(rnd()) * 0.86, x = Math.cos(a) * r, z = Math.sin(a) * r;
    fp[i * 4] = x; fp[i * 4 + 2] = z; fp[i * 4 + 1] = Math.max(groundY(x, z), -Math.sqrt(Math.max(0, 0.9 - x * x - z * z))) + 0.004; fp[i * 4 + 3] = 0.5 + rnd() * 1.1; rest[i] = 1;
  }
  const fbuf = gl.createBuffer(), fvao = gl.createVertexArray(); gl.bindVertexArray(fvao); gl.bindBuffer(gl.ARRAY_BUFFER, fbuf); gl.bufferData(gl.ARRAY_BUFFER, fp, gl.DYNAMIC_DRAW); gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 4, gl.FLOAT, false, 0, 0);
  let swirl = 0, swirlAxis = 1, turb = 0, sway = 0, swayV = 0;
  const shake = (power, dir = 1) => {
    swirl = Math.min(3, swirl + 1.6 * power); swirlAxis = dir; turb = Math.min(2.5, turb + 1.4 * power); swayV += 1.4 * power * dir;
    for (let i = 0; i < N; i++) if (rest[i] && rnd() < 0.85 * Math.min(1, power)) { rest[i] = 0; fv[i * 3 + 1] = 0.4 + rnd() * 1.1 * power; fv[i * 3] = (rnd() - 0.5) * power; fv[i * 3 + 2] = (rnd() - 0.5) * power; }
  };
  const step = dt => {
    swirl *= Math.exp(-dt * 0.42); turb *= Math.exp(-dt * 0.55);
    swayV += (-30 * sway - 3.2 * swayV) * dt; sway += swayV * dt;
    for (let i = 0; i < N; i++) {
      if (rest[i]) continue;
      const k = i * 4, j = i * 3; let x = fp[k], y = fp[k + 1], z = fp[k + 2];
      // the water: a swirl about the vertical axis plus an overturning roll, and some eddies
      const ux = (-z * swirl * swirlAxis + Math.sin(y * 5 + i) * turb * 0.25), uz = (x * swirl * swirlAxis + Math.cos(x * 4 + i * 0.7) * turb * 0.25);
      const uy = (Math.sin(x * 3.1 + z * 2.3 + i * 0.13) * turb * 0.35) - 0.03;
      const drag = 2.6;
      fv[j] += (ux - fv[j]) * drag * dt; fv[j + 1] += (uy - fv[j + 1]) * drag * dt - 0.05 * dt; fv[j + 2] += (uz - fv[j + 2]) * drag * dt;
      x += fv[j] * dt; y += fv[j + 1] * dt; z += fv[j + 2] * dt;
      // the glass: keep inside, slide along it
      const r = Math.hypot(x, y, z); if (r > 0.94) { x *= 0.94 / r; y *= 0.94 / r; z *= 0.94 / r; }
      // the ground and the scene: land and rest when the water is calm enough
      const gy = groundY(x, z);
      if (y < gy + 0.004) { y = gy + 0.004; if (Math.hypot(fv[j], fv[j + 2]) < 0.25 + turb * 0.1) { rest[i] = 1; fv[j] = fv[j + 1] = fv[j + 2] = 0; } else fv[j + 1] = Math.abs(fv[j + 1]) * 0.3; }
      fp[k] = x; fp[k + 1] = y; fp[k + 2] = z;
    }
  };

  // ---- camera
  const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]], dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  const norm = a => { const l = Math.hypot(...a) || 1; return a.map(x => x / l); };
  let cam = {};
  const camera = yaw => {
    const a = W / H, d = Math.max(5.6, 5.0 / Math.min(1, a * 0.62));
    const eye = [Math.sin(yaw) * d, 0.62, Math.cos(yaw) * d], at = [0, 0.1, 0];
    const f = norm(sub(at, eye)), r = norm(cross(f, [0, 1, 0])), u = cross(r, f), FOC = 2.0;
    // the same lens as the rays: a pixel's offset from the centre in units of the height is (x, y) · FOC / depth
    const P = [2 * FOC / a, 0, 0, 0, 0, 2 * FOC, 0, 0, 0, 0, -1.0004, -1, 0, 0, -0.02, 0];
    const V = [r[0], u[0], -f[0], 0, r[1], u[1], -f[1], 0, r[2], u[2], -f[2], 0, -dot(r, eye), -dot(u, eye), dot(f, eye), 1];
    const VP = new Array(16); for (let c = 0; c < 4; c++) for (let rr = 0; rr < 4; rr++) { let s = 0; for (let k = 0; k < 4; k++) s += P[k * 4 + rr] * V[c * 4 + k]; VP[c * 4 + rr] = s; }
    cam = { eye, f, r, u, FOC, VP };
  };

  // ---- shaking: drag sideways across the globe (speed = how hard), or it is shaken now and then on its own
  let dragging = false, lastX = 0, lastT = 0;
  const onDown = e => { dragging = true; lastX = e.clientX; lastT = performance.now(); canvas.setPointerCapture(e.pointerId); canvas.style.cursor = 'grabbing'; };
  const onMove = e => {
    if (!dragging) return; const now = performance.now(), dx = e.clientX - lastX, v = dx / Math.max(8, now - lastT);
    lastX = e.clientX; lastT = now; if (Math.abs(v) > 0.15) shake(Math.min(1, Math.abs(v) * 0.35) * PARAMS.shake, Math.sign(v)); nextShake = t + PARAMS.every;
  };
  const onUp = () => { dragging = false; canvas.style.cursor = 'grab'; };
  canvas.addEventListener('pointerdown', onDown); canvas.addEventListener('pointermove', onMove); canvas.addEventListener('pointerup', onUp); canvas.addEventListener('pointercancel', onUp);

  const setCommon = P => {
    gl.uniform2f(P.u('RES'), W, H); gl.uniform3fv(P.u('EYE'), cam.eye); gl.uniform3fv(P.u('FWD'), cam.f); gl.uniform3fv(P.u('RGT'), cam.r); gl.uniform3fv(P.u('UPV'), cam.u);
    gl.uniform1f(P.u('FOC'), cam.FOC); gl.uniform1f(P.u('T'), t); gl.uniform1f(P.u('SWAY'), sway * 0.12);
  };
  let raf, last = performance.now(), t = 0, nextShake = 1.2;
  if (reduce) { shake(0.6); for (let i = 0; i < 150; i++) step(1 / 60); }    // a still with snow mid-fall
  function frame(now) {
    const dt = Math.min(1 / 30, (now - last) / 1000); last = now;
    if (!reduce) { t += dt; if (t > nextShake && !dragging) { shake(0.9 * PARAMS.shake, rnd() < 0.5 ? -1 : 1); nextShake = t + PARAMS.every; } step(dt); }
    camera(reduce ? 0.12 : 0.18 * Math.sin(t * 0.11));
    gl.bindBuffer(gl.ARRAY_BUFFER, fbuf); gl.bufferSubData(gl.ARRAY_BUFFER, 0, fp);
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo); gl.viewport(0, 0, W, H);
    gl.disable(gl.BLEND); gl.useProgram(pScene.p); setCommon(pScene); gl.bindVertexArray(empty); gl.drawArrays(gl.TRIANGLES, 0, 3);
    gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.useProgram(pFlake.p); gl.uniformMatrix4fv(pFlake.u('VP'), false, cam.VP); gl.uniform2f(pFlake.u('RES'), W, H); gl.bindVertexArray(fvao); gl.drawArrays(gl.POINTS, 0, N);
    gl.useProgram(pGlass.p); setCommon(pGlass); gl.bindVertexArray(empty); gl.drawArrays(gl.TRIANGLES, 0, 3);
    gl.disable(gl.BLEND);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null); gl.viewport(0, 0, W, H);
    gl.useProgram(pPost.p); gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, tex); gl.uniform1i(pPost.u('S'), 0); gl.uniform2f(pPost.u('RES'), W, H); gl.drawArrays(gl.TRIANGLES, 0, 3);
    if (!reduce) raf = requestAnimationFrame(frame);
  }
  if (reduce) frame(performance.now()); else raf = requestAnimationFrame(frame);
  const ro2 = reduce ? new ResizeObserver(() => frame(performance.now())) : null; ro2?.observe(stage);

  return () => {
    cancelAnimationFrame(raf); ro.disconnect(); ro2?.disconnect();
    canvas.removeEventListener('pointerdown', onDown); canvas.removeEventListener('pointermove', onMove); canvas.removeEventListener('pointerup', onUp); canvas.removeEventListener('pointercancel', onUp);
    gl.getExtension('WEBGL_lose_context')?.loseContext(); canvas.remove();
  };
}
