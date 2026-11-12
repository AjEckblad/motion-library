// Portal: a stone ring stands on a dune, and through it you see a different world: a night sea under a ringed planet.
// It is not a picture on a disc. Every pixel's ray is traced through the desert, and if it passes through the ring
// before it hits anything, the rest of its journey is traced in the other world instead, from that point on, in the
// same direction. So the view through the portal shifts with perspective as the camera moves, and when the camera
// itself flies through, the worlds swap: now the ring stands on the sea and shows the desert. Then back again.
const PARAMS = { speed: 1, glow: 1, waves: 1 };

export default function (stage) {
  const canvas = document.createElement('canvas');
  canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block';
  stage.append(canvas);
  const gl = canvas.getContext('webgl2', { antialias: false });
  if (!gl) { stage.textContent = 'This needs WebGL2.'; return () => canvas.remove(); }
  const FS = `#version 300 es
  precision highp float; in vec2 uv; out vec4 o;
  uniform vec2 R; uniform float T, WORLD, GLOW, WAV; uniform vec3 CP, CF, CR, CU;
  const vec3 RC = vec3(0., 1.25, 0.); const float RR = 1.12, RT = .14;
  float h(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float n2(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f); return mix(mix(h(i), h(i + vec2(1, 0)), f.x), mix(h(i + vec2(0, 1)), h(i + 1.), f.x), f.y); }
  float dunes(vec2 p) { return .55 * sin(p.x * .35 + sin(p.y * .22) * 1.5) * cos(p.y * .18) + .25 * n2(p * .4) + .06 * n2(p * 2.1) - .1 * smoothstep(3., 0., length(p)); }
  float sea(vec2 p) { return WAV * (.05 * sin(p.x * 1.3 + T * 1.4) + .035 * sin(p.y * 1.9 - T * 1.1 + p.x * .5) + .02 * n2(p * 3. + T * .5)); }
  float ring(vec3 p) { vec3 q = p - RC; return length(vec2(length(q.xy) - RR, q.z)) - RT; }
  float map(vec3 p, float w) { return min(w < .5 ? (p.y - dunes(p.xz)) * .42 : (p.y - sea(p.xz)) * .6, ring(p)); }
  vec3 nrm(vec3 p, float w) { vec2 e = vec2(.004, 0); return normalize(vec3(map(p + e.xyy, w) - map(p - e.xyy, w), map(p + e.yxy, w) - map(p - e.yxy, w), map(p + e.yyx, w) - map(p - e.yyx, w))); }
  vec3 skyA(vec3 d) {                                            // the desert's sky: deep blue overhead, pale at the horizon, a high sun
    vec3 c = mix(vec3(.85, .82, .74), vec3(.22, .45, .82), smoothstep(-.02, .5, d.y));
    float s = max(dot(d, normalize(vec3(.4, .55, -.7))), 0.); return c + vec3(1., .9, .7) * (pow(s, 300.) * 4. + pow(s, 8.) * .25);
  }
  vec3 skyB(vec3 d) {                                            // the other world: night, stars, a ringed planet, an aurora
    vec3 c = mix(vec3(.02, .03, .07), vec3(.0, .005, .02), smoothstep(0., .6, d.y));
    vec2 sp = vec2(atan(d.x, d.z), asin(d.y)) * 260., ci = floor(sp); vec3 p3 = fract(vec3(ci.xyx) * .1031); p3 += dot(p3, p3.yzx + 33.33); float st = fract((p3.x + p3.y) * p3.z);
    c += vec3(.8, .85, 1.) * step(.993, st) * (st - .993) * 110. * smoothstep(.45, .1, length(fract(sp) - .5)) * step(0., d.y);
    c += vec3(.1, .9, .5) * .35 * exp(-pow((d.y - .28 - .06 * sin(d.x * 6. + T * .2)) / .07, 2.)) * n2(vec2(d.x * 14. + T * .3, 0.)) * step(0., d.y);
    vec3 pc = normalize(vec3(-.5, .32, -1.)); float pr = .2, cosA = dot(d, pc);
    if (cosA > cos(pr)) { vec3 n = normalize(d - pc * cosA); c = mix(vec3(.85, .55, .35), vec3(.6, .3, .25), .5 + .5 * sin(dot(d, vec3(0, 1, 0)) * 80.)) * (.25 + .75 * max(dot(n, normalize(vec3(.6, .5, .2))), 0.)); }
    float ringR = length(cross(d, vec3(.3, .9, -.2))) ; c += vec3(.8, .7, .6) * .25 * smoothstep(.02, 0., abs(acos(clamp(dot(d, pc), -1., 1.)) - .33)) * step(.3, ringR) * step(cosA, cos(pr));
    return c;
  }
  vec3 shade(vec3 ro, vec3 rd, float w, float tmax, out float tHit) {
    float t = .02; tHit = 1e9;
    for (int i = 0; i < 190; i++) { float d = map(ro + rd * t, w); if (d < .002 * (1. + t * .05)) { tHit = t; break; } t += d; if (t > tmax) break; }
    if (tHit > 1e8) return w < .5 ? skyA(rd) : skyB(rd);
    vec3 p = ro + rd * tHit, n = nrm(p, w);
    if (ring(p) < .01) {                                          // the ring: dark stone with a glowing inner edge
      vec3 q = p - RC; float inner = smoothstep(.06, -.02, length(q.xy) - RR + RT * .55);
      vec3 sun = w < .5 ? normalize(vec3(.4, .55, -.7)) : normalize(vec3(-.5, .32, -1.));
      vec3 c = vec3(.18, .17, .16) * (.25 + .75 * max(dot(n, sun), 0.)) * (w < .5 ? 1.2 : .45);
      return c + vec3(.3, .85, 1.) * inner * 1.6 * GLOW * (.7 + .3 * sin(T * 3. + atan(q.y, q.x) * 6.));
    }
    if (w < .5) {                                                 // sand
      float dif = max(dot(n, normalize(vec3(.4, .55, -.7))), 0.);
      vec3 c = vec3(.86, .66, .42) * (.35 + .85 * dif) * (.92 + .08 * n2(p.xz * 30.));
      return mix(c, skyA(rd) * .95, 1. - exp(-tHit * .018));
    }
    vec3 r = reflect(rd, n); float fr = .04 + .96 * pow(1. - max(dot(n, -rd), 0.), 5.);   // night sea: mostly reflection
    return mix(vec3(.004, .01, .02) + skyB(r) * fr, skyB(rd) * .6, 1. - exp(-tHit * .02));
  }
  void main() {
    vec2 q = (uv * 2. - 1.) * vec2(R.x / R.y, 1.);
    vec3 rd = normalize(CF * 1.8 + CR * q.x + CU * q.y), ro = CP;
    // where (if anywhere) the ray goes through the ring's opening
    float tp = abs(rd.z) > 1e-4 ? -ro.z / rd.z : -1.; vec3 pp = ro + rd * tp;
    bool through = tp > 0. && length(pp.xy - RC.xy) < RR - RT * .4;
    float tHit; vec3 col = shade(ro, rd, WORLD, through ? tp : 60., tHit);
    if (through && tHit > tp) { float t2; col = shade(pp, rd, 1. - WORLD, 60., t2); }   // the rest of the journey is in the other world
    col = col / (1. + col * .3);
    o = vec4(pow(col, vec3(1. / 2.2)), 1);
  }`;
  const VS = `#version 300 es
  in vec2 p; out vec2 uv; void main() { uv = p * .5 + .5; gl_Position = vec4(p, 0, 1); }`;
  const sh = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s)); return s; };
  const p = gl.createProgram(); gl.attachShader(p, sh(gl.VERTEX_SHADER, VS)); gl.attachShader(p, sh(gl.FRAGMENT_SHADER, FS)); gl.bindAttribLocation(p, 0, 'p'); gl.linkProgram(p);
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
  gl.useProgram(p); const U = n => gl.getUniformLocation(p, n);
  gl.bindVertexArray(gl.createVertexArray()); gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW); gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  let W = 1, H = 1;
  const resize = () => { const w = stage.clientWidth || 1, h = stage.clientHeight || 1, d = Math.min(devicePixelRatio, 2, Math.max(0.5, Math.sqrt(340000 / (w * h)))); W = canvas.width = Math.max(1, (w * d) | 0); H = canvas.height = Math.max(1, (h * d) | 0); gl.viewport(0, 0, W, H); };
  const ro = new ResizeObserver(resize); ro.observe(stage); resize();
  // the camera's loop: approach, fly through, turn round, look back, fly back through, turn round
  const path = c => {
    const L = 18, k = c % L, ease = x => x * x * (3 - 2 * x);
    if (k < 7) { const u = ease(k / 7); return { z: 6.5 - 10.5 * u, yaw: Math.PI, sway: Math.sin(k * 0.6) * 0.6 }; }
    if (k < 9) { const u = ease((k - 7) / 2); return { z: -4, yaw: Math.PI + Math.PI * u, sway: 0 }; }
    if (k < 16) { const u = ease((k - 9) / 7); return { z: -4 + 10.5 * u, yaw: 0, sway: Math.sin((k - 9) * 0.6) * 0.6 }; }
    const u = ease((k - 16) / 2); return { z: 6.5, yaw: Math.PI * u, sway: 0 };
  };
  let raf, last = performance.now(), t = 0, world = 0, prevZ = 6.5;
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000); last = now; t += dt * PARAMS.speed;
    const c = path(t), x = c.sway, y = 1.25 + 0.15 * Math.sin(t * 0.7);
    // crossing the plane of the ring inside its opening swaps which world we are standing in
    if (Math.sign(c.z) !== Math.sign(prevZ) && Math.hypot(x, y - 1.25) < 1) world = 1 - world;
    prevZ = c.z;
    const yaw = c.yaw + 0.12 * Math.sin(t * 0.4), CF = [Math.sin(yaw), -0.04, Math.cos(yaw)], fl = Math.hypot(...CF); CF.forEach((v, i) => CF[i] = v / fl);
    const CR = [CF[2], 0, -CF[0]], rl = Math.hypot(CR[0], CR[2]); CR[0] /= rl; CR[2] /= rl;
    const CU = [CF[1] * CR[2] - CF[2] * CR[1], CF[2] * CR[0] - CF[0] * CR[2], CF[0] * CR[1] - CF[1] * CR[0]];
    gl.uniform2f(U('R'), W, H); gl.uniform1f(U('T'), t); gl.uniform1f(U('WORLD'), world); gl.uniform1f(U('GLOW'), PARAMS.glow); gl.uniform1f(U('WAV'), PARAMS.waves);
    gl.uniform3f(U('CP'), x, y, c.z); gl.uniform3f(U('CF'), ...CF); gl.uniform3f(U('CR'), ...CR.map(v => -v)); gl.uniform3f(U('CU'), ...CU);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    raf = requestAnimationFrame(frame);
  }
  raf = requestAnimationFrame(frame);
  return () => { cancelAnimationFrame(raf); ro.disconnect(); gl.getExtension('WEBGL_lose_context')?.loseContext(); canvas.remove(); };
}
