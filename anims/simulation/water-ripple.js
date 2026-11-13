// Water ripples: a height field run through the discrete wave equation on the GPU. Each step a cell moves toward the
// average of its four neighbours (by less than the fastest stable amount, so the rings travel slowly enough to
// follow), minus its own previous height, then loses a little energy; two textures hold "now" and "before" and swap.
// The surface’s slope bends the view of a tiled floor beneath it (refraction), the curvature focuses light into
// caustic brightening, and a specular term catches the crests. Move to drag a wake, click for a big drop; with no
// pointer, a drop falls now and then, so each ring can be followed as it spreads.
const PARAMS = { damping: 0.985, refraction: 1, rain: 1, speed: 0.55 };

export default function (stage) {
  const canvas = document.createElement('canvas');
  canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block;touch-action:none';
  stage.append(canvas);
  const gl = canvas.getContext('webgl2', { antialias: false });
  if (!gl || !gl.getExtension('EXT_color_buffer_float')) { stage.textContent = 'This needs WebGL2 with float render targets.'; return () => canvas.remove(); }
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const vs = `#version 300 es
  in vec2 p; out vec2 uv; void main() { uv = p * .5 + .5; gl_Position = vec4(p, 0, 1); }`;
  const simFS = `#version 300 es
  precision highp float; in vec2 uv; out vec4 o;
  uniform sampler2D S; uniform vec2 px; uniform float damp, K; uniform vec4 drops[8]; uniform float aspect;
  void main() {
    vec2 c = texture(S, uv).rg;
    float n = texture(S, uv + vec2(px.x, 0)).r + texture(S, uv - vec2(px.x, 0)).r + texture(S, uv + vec2(0, px.y)).r + texture(S, uv - vec2(0, px.y)).r;
    float h = (2. * c.r + K * (n - 4. * c.r) - c.g) * damp;   // K = .5 is the fastest stable speed
    for (int i = 0; i < 8; i++) {
      vec4 d = drops[i]; if (d.w == 0.) continue;
      vec2 q = (uv - d.xy) * vec2(aspect, 1);
      h += d.w * exp(-dot(q, q) / (d.z * d.z));
    }
    o = vec4(h, c.r, 0, 1);
  }`;
  const viewFS = `#version 300 es
  precision highp float; in vec2 uv; out vec4 o;
  uniform sampler2D S; uniform vec2 px, R; uniform float refr, T;
  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  vec3 floorCol(vec2 p) {
    // a crisp line grid with dots at the crossings, tinted cyan to violet across the field
    float N = 12.;
    vec2 q = p * N, f = abs(fract(q) - .5);
    float w = fwidth(q.x) * .9;
    float line = smoothstep(.5 - w * 1.6, .5, max(f.x, f.y));
    vec2 q4 = p * N * 4.; vec2 f4 = abs(fract(q4) - .5); float w4 = fwidth(q4.x);
    float fine = smoothstep(.5 - w4, .5, max(f4.x, f4.y)) * .14;
    float dot_ = smoothstep(.065 + w, .065 - w, length(fract(q) - .5 - sign(fract(q) - .5) * .5));
    vec3 tint = mix(vec3(.25, .95, 1.), vec3(.75, .45, 1.), clamp(p.x * .6 + p.y * .3 - .1, 0., 1.));
    vec3 col = vec3(.012, .02, .035) + vec3(.02, .04, .07) * (1. - length(p - vec2(.6, .5)));
    col += tint * (line * .55 + fine * .5);
    col += vec3(1) * dot_ * .9;
    return col;
  }
  void main() {
    float h = texture(S, uv).r;
    float hx = texture(S, uv + vec2(px.x, 0)).r - texture(S, uv - vec2(px.x, 0)).r;
    float hy = texture(S, uv + vec2(0, px.y)).r - texture(S, uv - vec2(0, px.y)).r;
    float lap = texture(S, uv + vec2(px.x, 0)).r + texture(S, uv - vec2(px.x, 0)).r + texture(S, uv + vec2(0, px.y)).r + texture(S, uv - vec2(0, px.y)).r - 4. * h;
    vec3 n = normalize(vec3(-hx * 6., -hy * 6., 1.));
    vec2 asp = vec2(R.x / R.y, 1);
    vec2 p = uv * asp + n.xy * .09 * refr;
    vec3 col = floorCol(p);
    col *= 1. + clamp(-lap * 40., -.6, 2.);
    col += vec3(.15, .4, .6) * clamp(-lap * 25., 0., 1.) * .5;                   // converging surface focuses light: caustics
    vec3 L = normalize(vec3(-.4, .6, .7)), V = vec3(0, 0, 1), Hh = normalize(L + V);
    col += vec3(.9, .97, 1.) * pow(max(dot(n, Hh), 0.), 180.) * 1.4;
    col += vec3(.1, .3, .5) * smoothstep(.0, .25, abs(n.x) + abs(n.y)) * .3;
    float vig = smoothstep(1.25, .35, length((uv - .5) * asp));
    o = vec4(pow(col * (.55 + .45 * vig), vec3(.95)), 1);
  }`;
  const sh = (t, s) => { const x = gl.createShader(t); gl.shaderSource(x, s); gl.compileShader(x); if (!gl.getShaderParameter(x, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(x)); return x; };
  const mk = fs => { const pr = gl.createProgram(); gl.attachShader(pr, sh(gl.VERTEX_SHADER, vs)); gl.attachShader(pr, sh(gl.FRAGMENT_SHADER, fs)); gl.bindAttribLocation(pr, 0, 'p'); gl.linkProgram(pr); return pr; };
  const sim = mk(simFS), view = mk(viewFS);
  const u = (pr, n) => gl.getUniformLocation(pr, n);
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer()); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

  let tex = [], fbo = [], SW = 0, SH = 0;
  const makeTargets = () => {
    tex.forEach(t => gl.deleteTexture(t)); fbo.forEach(f => gl.deleteFramebuffer(f)); tex = []; fbo = [];
    for (let i = 0; i < 2; i++) {
      const t = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, t);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA16F, SW, SH, 0, gl.RGBA, gl.HALF_FLOAT, null);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      const f = gl.createFramebuffer(); gl.bindFramebuffer(gl.FRAMEBUFFER, f); gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, t, 0);
      gl.clearColor(0, 0, 0, 1); gl.clear(gl.COLOR_BUFFER_BIT);
      tex.push(t); fbo.push(f);
    }
  };
  const resize = () => {
    const d = Math.min(devicePixelRatio, 2); canvas.width = (stage.clientWidth || 1) * d | 0; canvas.height = (stage.clientHeight || 1) * d | 0;
    const s = Math.min(1, 420 / Math.max(stage.clientWidth, stage.clientHeight, 1));
    const w = Math.max(16, Math.round((stage.clientWidth || 1) * s)), h = Math.max(16, Math.round((stage.clientHeight || 1) * s));
    if (w !== SW || h !== SH) { SW = w; SH = h; makeTargets(); }
  };
  const ro = new ResizeObserver(resize); ro.observe(stage); resize();

  // drops queued for the next sim step: [x, y, radius, amplitude] in uv space
  let queue = [];
  const drop = (x, y, r, a) => { if (queue.length < 8) queue.push([x, y, r, a]); };
  let lastPointer = -1e9, lx = -1, ly = -1;
  const toUV = e => { const r = canvas.getBoundingClientRect(); return [(e.clientX - r.left) / r.width, 1 - (e.clientY - r.top) / r.height]; };
  const pm = e => {
    const [x, y] = toUV(e); lastPointer = performance.now();
    if (lx >= 0) { const dd = Math.hypot(x - lx, y - ly); if (dd > 0.002) drop(x, y, 0.012, Math.min(0.5, dd * 6)); }
    lx = x; ly = y;
  };
  const pd = e => { const [x, y] = toUV(e); lastPointer = performance.now(); drop(x, y, 0.03, 1.6); };
  const pl = () => { lx = -1; };
  stage.addEventListener('pointermove', pm); stage.addEventListener('pointerdown', pd); stage.addEventListener('pointerleave', pl);

  let cur = 0, raf, frameN = 0, nextRain = 0; const t0 = performance.now();
  const dropArr = new Float32Array(32);
  function frame(now) {
    const t = (now - t0) / 1000; frameN++;
        if (t > nextRain && PARAMS.rain > 0 && !reduce) {
      drop(0.12 + Math.random() * 0.76, 0.12 + Math.random() * 0.76, 0.013 + Math.random() * 0.008, 0.6 + Math.random() * 0.5);
      nextRain = t + (0.9 + Math.random() * 1.6) / PARAMS.rain;
    }
    // reduced motion: three drops run on for a moment and then the surface holds still, unless the pointer stirs it
    if (reduce && frameN === 1) { drop(0.3, 0.6, 0.02, 1); drop(0.68, 0.38, 0.018, 0.9); drop(0.55, 0.72, 0.014, 0.7); }
    const steps = reduce ? (frameN === 1 ? 70 : now - lastPointer < 3000 ? 1 : 0) : 1;
    gl.useProgram(sim); gl.viewport(0, 0, SW, SH);
    gl.uniform2f(u(sim, 'px'), 1 / SW, 1 / SH); const K = 0.5 * Math.max(0.1, Math.min(1, PARAMS.speed)) ** 2;   // speed is the fraction of the fastest
    // (damping is per step; slower rings take more steps per cell, so it is scaled to fade over the same distance)
    gl.uniform1f(u(sim, 'damp'), Math.min(0.999, PARAMS.damping) ** Math.sqrt(K / 0.5)); gl.uniform1f(u(sim, 'K'), K); gl.uniform1f(u(sim, 'aspect'), SW / SH);
    for (let s = 0; s < steps; s++) {
      dropArr.fill(0);
      if (s === 0) queue.forEach((d, i) => dropArr.set(d, i * 4));
      gl.uniform4fv(u(sim, 'drops'), dropArr);
      gl.bindFramebuffer(gl.FRAMEBUFFER, fbo[1 - cur]); gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, tex[cur]);
      gl.drawArrays(gl.TRIANGLES, 0, 3); cur = 1 - cur;
    }
    if (steps) queue = [];
    gl.bindFramebuffer(gl.FRAMEBUFFER, null); gl.viewport(0, 0, canvas.width, canvas.height);
    gl.useProgram(view); gl.bindTexture(gl.TEXTURE_2D, tex[cur]);
    gl.uniform2f(u(view, 'px'), 1 / SW, 1 / SH); gl.uniform2f(u(view, 'R'), canvas.width, canvas.height);
    gl.uniform1f(u(view, 'refr'), PARAMS.refraction); gl.uniform1f(u(view, 'T'), t);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    raf = requestAnimationFrame(frame);
  }
  raf = requestAnimationFrame(frame);
  return () => { cancelAnimationFrame(raf); ro.disconnect(); stage.removeEventListener('pointermove', pm); stage.removeEventListener('pointerdown', pd); stage.removeEventListener('pointerleave', pl); gl.getExtension('WEBGL_lose_context')?.loseContext(); canvas.remove(); };
}
