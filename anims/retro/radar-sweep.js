// PPI radar: the beam turns clockwise and the screen remembers it. Nothing is accumulated; each pixel works out
// how far (in angle) the beam has travelled since it last passed over it, and glows by exp(−that), which is the
// phosphor decay. Targets move, but the screen only learns their new position when the beam sweeps them, so each
// blip flares, then fades as the beam moves on, and jumps a little on the next pass, like the real thing.
const PARAMS = { speed: 1, decay: 1, targets: 7 };

export default function (stage) {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const canvas = document.createElement('canvas');
  canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block';
  stage.append(canvas);
  const gl = canvas.getContext('webgl2', { antialias: false });
  if (!gl) { stage.textContent = 'This needs WebGL2.'; return () => canvas.remove(); }
  const MAXB = 12;
  const vs = `#version 300 es
  in vec2 p; void main() { gl_Position = vec4(p, 0, 1); }`;
  const fs = `#version 300 es
  precision highp float; out vec4 o;
  uniform vec2 R; uniform float B, DK, NB, PX; uniform vec2 BL[${MAXB}];
  const float TAU = 6.28318530718;
  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float noise(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
    return mix(mix(hash(i), hash(i + vec2(1, 0)), f.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1)), f.x), f.y); }
  float behind(vec2 q) { float a = atan(q.x, q.y); return mod(B - a, TAU); }   // clockwise from north
  void main() {
    float S = min(R.x, R.y) * .46;
    vec2 q = (gl_FragCoord.xy - .5 * R) / S;                                    // 1 = scope edge
    float r = length(q), px = PX / S;
    float bh = behind(q);
    vec3 green = vec3(.25, 1., .55);
    vec3 col = vec3(.008, .02, .014);
    float inside = smoothstep(1. + px, 1. - px, r);
    // the sweep: a sharp leading edge and a long phosphor tail behind it
    float trail = exp(-bh * 2.4 / DK);
    float edge = exp(-bh * 90.) * (.6 + .4 * smoothstep(1., .0, r));
    col += green * (trail * .22 + edge * .9) * inside;
    // ground clutter near the centre, only visible as the beam refreshes it
    float cl = smoothstep(.62, .82, noise(q * 9.) * .7 + noise(q * 23.) * .3) * smoothstep(.55, .1, r);
    col += green * cl * exp(-bh * 1.1 / DK) * .55 * inside;
    // targets
    for (int i = 0; i < ${MAXB}; i++) {
      if (float(i) >= NB) break;
      vec2 b = BL[i]; float g = exp(-behind(b) * .75 / DK);
      float d = length(q - b);
      col += green * g * (smoothstep(.022 + px, .022 - px, d) * 1.1 + exp(-d * d * 900.) * .6);
      col += vec3(.8, 1., .9) * g * g * exp(-d * d * 9000.) * .8;
    }
    // range rings, bearing ticks, crosshair
    float ring = 0.;
    for (int k = 1; k <= 4; k++) ring = max(ring, smoothstep(px * 1.2, 0., abs(r - float(k) * .25)));
    float ang = atan(q.x, q.y) / TAU * 72.;
    float tick = step(.955, r) * step(r, 1.) * smoothstep(px * 1.2, 0., abs(fract(ang + .5) - .5) * TAU / 72. * r);
    float major = step(.92, r) * step(r, 1.) * smoothstep(px * 1.4, 0., abs(fract(ang / 6. + .5) - .5) * TAU / 12. * r);
    float cross = smoothstep(px, 0., min(abs(q.x), abs(q.y))) * step(r, 1.);
    col += green * (ring * .22 + tick * .35 + major * .5 + cross * .1) * inside;
    col += green * .5 * smoothstep(px * 1.5, 0., abs(r - 1.));                   // scope rim
    col *= 1. - .2 * smoothstep(.5, 1., r);
    col += (hash(gl_FragCoord.xy + B) - .5) * .015;
    o = vec4(col, 1);
  }`;
  const sh = (t, s) => { const x = gl.createShader(t); gl.shaderSource(x, s); gl.compileShader(x); if (!gl.getShaderParameter(x, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(x)); return x; };
  const prog = gl.createProgram(); gl.attachShader(prog, sh(gl.VERTEX_SHADER, vs)); gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, fs)); gl.bindAttribLocation(prog, 0, 'p'); gl.linkProgram(prog); gl.useProgram(prog);
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer()); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  const U = {}; ['R', 'B', 'DK', 'NB', 'PX', 'BL'].forEach(n => U[n] = gl.getUniformLocation(prog, n));
  let dpr = 1;
  const resize = () => { dpr = Math.min(devicePixelRatio, 2); canvas.width = (stage.clientWidth || 1) * dpr | 0; canvas.height = (stage.clientHeight || 1) * dpr | 0; gl.viewport(0, 0, canvas.width, canvas.height); };
  const ro = new ResizeObserver(resize); ro.observe(stage); resize();

  // targets: true positions drift on straight tracks; shown positions update only when swept
  const n = Math.max(1, Math.min(MAXB, Math.round(PARAMS.targets)));
  const TAU = Math.PI * 2;
  const T = Array.from({ length: n }, (_, i) => {
    const a = Math.random() * TAU, r = 0.25 + Math.random() * 0.65, h = Math.random() * TAU, v = 0.012 + Math.random() * 0.03;
    return { x: Math.sin(a) * r, y: Math.cos(a) * r, vx: Math.sin(h) * v, vy: Math.cos(h) * v, sx: Math.sin(a) * r, sy: Math.cos(a) * r };
  });
  const shown = new Float32Array(MAXB * 2);
  const behind = (beam, x, y) => (((beam - Math.atan2(x, y)) % TAU) + TAU) % TAU;
  let raf, last = performance.now(), beam = 1.2;
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    const k = reduce ? 0.06 : 1, prev = beam;
    beam += dt * 1.25 * PARAMS.speed * k;
    for (let i = 0; i < n; i++) {
      const t = T[i];
      t.x += t.vx * dt * k; t.y += t.vy * dt * k;
      if (Math.hypot(t.x, t.y) > 0.95) { t.vx *= -1; t.vy *= -1; }
      if (behind(beam, t.x, t.y) < beam - prev + 1e-4) { t.sx = t.x; t.sy = t.y; }   // the beam just crossed it
      shown[i * 2] = t.sx; shown[i * 2 + 1] = t.sy;
    }
    gl.uniform2f(U.R, canvas.width, canvas.height); gl.uniform1f(U.B, beam % TAU); gl.uniform1f(U.DK, PARAMS.decay);
    gl.uniform1f(U.NB, n); gl.uniform1f(U.PX, dpr); gl.uniform2fv(U.BL, shown);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    raf = requestAnimationFrame(frame);
  }
  raf = requestAnimationFrame(frame);
  return () => { cancelAnimationFrame(raf); ro.disconnect(); gl.getExtension('WEBGL_lose_context')?.loseContext(); canvas.remove(); };
}
