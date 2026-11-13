// Water ripples on a pond: a height field run through the discrete wave equation on the GPU. Each step a cell becomes
// the average of its four neighbours, times two, minus its own previous height, then loses a little energy; two
// textures hold "now" and "before" and swap. Seen from above on a sunny day: the surface's slope bends the view of
// the pebbles and sand on the bed (refraction), sunlight through the water draws slow caustics on it, the ripples'
// curvature focuses that light into bright rings, the sky and its clouds lie on the water as a soft reflection, and
// the sun glints off the flanks of every ring. A single drop falls at a steady pace (one every 1.25 s by default; the
// slider sets the gap), so each ring can be followed as it spreads. Move to drag a wake, click for a big drop.
const PARAMS = { damping: 0.985, refraction: 1, every: 1.25 };

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
  uniform sampler2D S; uniform vec2 px; uniform float damp; uniform vec4 drops[8]; uniform float aspect;
  void main() {
    vec2 c = texture(S, uv).rg;
    float n = texture(S, uv + vec2(px.x, 0)).r + texture(S, uv - vec2(px.x, 0)).r + texture(S, uv + vec2(0, px.y)).r + texture(S, uv - vec2(0, px.y)).r;
    float h = (n * .5 - c.g) * damp;
    for (int i = 0; i < 8; i++) {
      vec4 d = drops[i]; if (d.w == 0.) continue;
      vec2 q = (uv - d.xy) * vec2(aspect, 1);
      h += d.w * exp(-dot(q, q) / (d.z * d.z));
    }
    o = vec4(h, c.r, 0, 1);
  }`;
  const viewFS = `#version 300 es
  precision highp float; in vec2 uv; out vec4 o;
  uniform sampler2D S, B; uniform vec2 px, R; uniform float refr, T;
  vec2 h22(vec2 p) { p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3))); return fract(sin(p) * 43758.5453); }
  float vn(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
    float a = h22(i).x, b = h22(i + vec2(1, 0)).x, c = h22(i + vec2(0, 1)).x, d = h22(i + vec2(1, 1)).x; return mix(mix(a, b, f.x), mix(c, d, f.x), f.y); }
  float fbm(vec2 p) { float s = 0., a = .5; for (int i = 0; i < 4; i++) { s += a * vn(p); p = p * 2.03 + 1.7; a *= .5; } return s; }
  const vec3 SUN = vec3(-.48, .42, .77);
  // the bed: fine sand with pebbles lying in it, lit by the sun from the upper left, each casting a soft shadow.
  // Every cell of a jittered grid may hold one pebble, an oval of its own size, turn and colour; a point takes the
  // highest pebble over it among the nine cells around, so a pebble is never cut off at its cell's edge
  vec3 bed(vec2 p) {
    float s = fbm(p * 14.);
    vec3 col = mix(vec3(.66, .58, .44), vec3(.8, .72, .56), s) * (.92 + .08 * vn(p * 140.));
    col *= .88 + .12 * smoothstep(.3, .7, fbm(p * 3. + 4.));                     // darker drifts of silt
    vec2 g = p * 5.5, ig = floor(g), fg = fract(g);
    float top = 0., shade = 0.; vec3 pn = vec3(0, 0, 1), pc = vec3(0);
    for (int y = -1; y <= 1; y++) for (int x = -1; x <= 1; x++) {
      vec2 c = vec2(x, y), hh = h22(ig + c + 9.3), h3 = h22(ig + c + 31.7);
      if (hh.y < .36) continue;                                                  // (bare sand here)
      vec2 d = fg - (c + .5 + .5 * (h22(ig + c) - .5));
      float an = h3.x * 6.283, cs = cos(an), sn = sin(an);
      vec2 rad = (.13 + .24 * hh.x * hh.x) * vec2(1., .62 + .3 * h3.y);         // mostly small, a few large; oval
      vec2 v = vec2(cs * d.x + sn * d.y, -sn * d.x + cs * d.y) / rad;
      float e = length(v);
      shade = max(shade, smoothstep(1.35, .95, length(v + vec2(cs * SUN.x + sn * SUN.y, -sn * SUN.x + cs * SUN.y) * .5)));
      float ht = sqrt(max(0., 1. - e * e)) * rad.y;
      if (e < 1. && ht > top) {
        top = ht;
        vec2 gv = v / rad; gv = vec2(cs * gv.x - sn * gv.y, sn * gv.x + cs * gv.y);   // the slope, back in the bed's frame
        pn = normalize(vec3(gv * rad.y * .9, sqrt(max(0., 1. - e * e)) + .12));
        float k = fract(h3.y * 7.3 + hh.x * 3.1);
        pc = k < .5 ? mix(vec3(.52, .45, .36), vec3(.68, .58, .44), h3.x) : k < .8 ? vec3(.5, .5, .47) : vec3(.42, .34, .27);
        pc *= .86 + .22 * vn(p * 48. + hh * 40.);
      }
    }
    col *= 1. - .4 * shade * step(top, 0.);
    if (top > 0.) {
      float lit = .32 + .82 * max(dot(pn, SUN), 0.) + .22 * pow(max(dot(reflect(-SUN, pn), vec3(0, 0, 1)), 0.), 14.);
      float edge = smoothstep(0., .012, top);                                    // (a soft rim where it meets the sand)
      col = mix(col, pc * lit, edge);
    }
    return col;
  }
  // sunlight through a gently moving surface: a slow, faint web of caustics on the bed
  float caustic(vec2 p, float t) {
    float c = 0.;
    for (int k = 0; k < 2; k++) {
      float fk = float(k);
      vec2 q = p * (4.5 + 2.5 * fk) + vec2(t * .05, -t * .035) * (1. + fk);
      q += 1.1 * vec2(vn(q * .45 + t * .06), vn(q * .45 - t * .06 + 5.)) - .55;
      vec2 iq = floor(q), fq = fract(q); float d1 = 9., d2 = 9.;
      for (int y = -1; y <= 1; y++) for (int x = -1; x <= 1; x++) {
        vec2 cc = vec2(x, y), r = cc + .5 + .42 * sin(t * .25 + 6.28 * h22(iq + cc)) - fq; float d = dot(r, r);
        if (d < d1) { d2 = d1; d1 = d; } else if (d < d2) d2 = d;
      }
      c += exp(-(sqrt(d2) - sqrt(d1)) * 9.);
    }
    return c * .5;
  }
  // the sky over the pond, as the water mirrors it above the point p: blue, paler low, slow drifting clouds
  vec3 sky(vec2 p, vec3 r) {
    vec3 c = mix(vec3(.78, .87, .96), vec3(.45, .65, .9), smoothstep(.3, 1., r.z));
    float cl = smoothstep(.45, .8, fbm((p + r.xy * 1.5) * 1.3 + vec2(T * .012, T * .004)));
    return mix(c, vec3(.97, .98, 1.), cl * .85);
  }
  void main() {
    float h = texture(S, uv).r;
    float hx = texture(S, uv + vec2(px.x, 0)).r - texture(S, uv - vec2(px.x, 0)).r;
    float hy = texture(S, uv + vec2(0, px.y)).r - texture(S, uv - vec2(0, px.y)).r;
    float lap = texture(S, uv + vec2(px.x, 0)).r + texture(S, uv - vec2(px.x, 0)).r + texture(S, uv + vec2(0, px.y)).r + texture(S, uv - vec2(0, px.y)).r - 4. * h;
    vec3 n = normalize(vec3(-hx * 6., -hy * 6., 1.));
    vec2 asp = vec2(R.x / R.y, 1), p0 = uv * asp;
    vec2 p = p0 + n.xy * .09 * refr;
    vec3 col = texture(B, p / asp).rgb;                                         // (the bed, drawn once: see bedTex)
    col *= .82 + .5 * caustic(p, T);
    col *= 1. + clamp(-lap * 32., -.4, .9);                                    // a ring focuses the sunlight it passes
    // a shallow, clear pond: the water takes a little red out and adds a faint green-blue haze
    col = col * vec3(.88, .95, .9) + vec3(.015, .05, .05);
    vec3 r = reflect(vec3(0, 0, -1), n);
    float fr = .07 + .3 * smoothstep(0., .25, 1. - n.z);   // (steeper water mirrors more sky, softly capped: a fresh splash is not a white disc)
    col = mix(col, sky(p0, r), fr);
    vec3 Hh = normalize(SUN + vec3(0, 0, 1));
    col += vec3(1., .97, .9) * pow(max(dot(n, Hh), 0.), 300.) * 1.8;            // the sun glinting off a ring's flank
    float vig = smoothstep(1.4, .4, length((uv - .5) * asp));
    o = vec4(pow(col * (.86 + .14 * vig), vec3(.92)), 1);
  }`;
  const sh = (t, s) => { const x = gl.createShader(t); gl.shaderSource(x, s); gl.compileShader(x); if (!gl.getShaderParameter(x, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(x)); return x; };
  const mk = fs => { const pr = gl.createProgram(); gl.attachShader(pr, sh(gl.VERTEX_SHADER, vs)); gl.attachShader(pr, sh(gl.FRAGMENT_SHADER, fs)); gl.bindAttribLocation(pr, 0, 'p'); gl.linkProgram(pr); return pr; };
  // the bed never changes, so it is drawn once into a texture (again on resize) and the water only looks it up
  const bedFS = viewFS.slice(0, viewFS.lastIndexOf('void main()')) + 'void main() { o = vec4(bed(uv * vec2(R.x / R.y, 1)), 1); }';
  const sim = mk(simFS), view = mk(viewFS), bedP = mk(bedFS);
  let bedTex = null, bedFbo = null, bedDirty = true;
  const drawBed = () => {
    if (bedTex) { gl.deleteTexture(bedTex); gl.deleteFramebuffer(bedFbo); }
    bedTex = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, bedTex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, canvas.width, canvas.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    bedFbo = gl.createFramebuffer(); gl.bindFramebuffer(gl.FRAMEBUFFER, bedFbo); gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, bedTex, 0);
    gl.viewport(0, 0, canvas.width, canvas.height); gl.useProgram(bedP); gl.uniform2f(u(bedP, 'R'), canvas.width, canvas.height);
    gl.drawArrays(gl.TRIANGLES, 0, 3); bedDirty = false;
  };
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
    const cw = stage.clientWidth || 1, ch = stage.clientHeight || 1, d = Math.max(1, Math.min(devicePixelRatio, 2, Math.sqrt(2.4e6 / (cw * ch))));
    bedDirty = true; canvas.width = (stage.clientWidth || 1) * d | 0; canvas.height = (stage.clientHeight || 1) * d | 0;
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
    // one drop at a time, at a steady pace (a little uneven, as drops off a branch are)
    if (t > nextRain && !reduce) {
      drop(0.12 + Math.random() * 0.76, 0.12 + Math.random() * 0.76, 0.013 + Math.random() * 0.008, 0.6 + Math.random() * 0.5);
      nextRain = t + Math.max(0.5, PARAMS.every) * (0.9 + Math.random() * 0.2);
    }
    // reduced motion: three drops run on for a moment and then the surface holds still, unless the pointer stirs it
    if (reduce && frameN === 1) { drop(0.3, 0.6, 0.02, 1); drop(0.68, 0.38, 0.018, 0.9); drop(0.55, 0.72, 0.014, 0.7); }
    const steps = reduce ? (frameN === 1 ? 70 : now - lastPointer < 3000 ? 1 : 0) : 2;
    gl.useProgram(sim); gl.viewport(0, 0, SW, SH);
    gl.uniform2f(u(sim, 'px'), 1 / SW, 1 / SH); gl.uniform1f(u(sim, 'damp'), Math.min(0.999, PARAMS.damping)); gl.uniform1f(u(sim, 'aspect'), SW / SH);
    for (let s = 0; s < steps; s++) {
      dropArr.fill(0);
      if (s === 0) queue.forEach((d, i) => dropArr.set(d, i * 4));
      gl.uniform4fv(u(sim, 'drops'), dropArr);
      gl.bindFramebuffer(gl.FRAMEBUFFER, fbo[1 - cur]); gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, tex[cur]);
      gl.drawArrays(gl.TRIANGLES, 0, 3); cur = 1 - cur;
    }
    if (steps) queue = [];
    gl.bindFramebuffer(gl.FRAMEBUFFER, null); gl.viewport(0, 0, canvas.width, canvas.height);
    if (bedDirty) drawBed();
    gl.bindFramebuffer(gl.FRAMEBUFFER, null); gl.viewport(0, 0, canvas.width, canvas.height);
    gl.useProgram(view); gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, bedTex); gl.uniform1i(u(view, 'B'), 1);
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, tex[cur]); gl.uniform1i(u(view, 'S'), 0);
    gl.uniform2f(u(view, 'px'), 1 / SW, 1 / SH); gl.uniform2f(u(view, 'R'), canvas.width, canvas.height);
    gl.uniform1f(u(view, 'refr'), PARAMS.refraction); gl.uniform1f(u(view, 'T'), t);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    raf = requestAnimationFrame(frame);
  }
  raf = requestAnimationFrame(frame);
  return () => { cancelAnimationFrame(raf); ro.disconnect(); stage.removeEventListener('pointermove', pm); stage.removeEventListener('pointerdown', pd); stage.removeEventListener('pointerleave', pl); gl.getExtension('WEBGL_lose_context')?.loseContext(); canvas.remove(); };
}
