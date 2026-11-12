// Clifford attractor: the map x′ = sin(a·y) + c·cos(a·x), y′ = sin(b·x) + d·cos(b·y), applied over and over. Almost
// any start point is drawn onto the same filigree, but it never lands on the same spot twice. Every frame a million
// GPU threads each start from a random point, iterate the map in the vertex shader and add one point of light to a
// float buffer; the buffer fades a little each frame, so it holds many millions of hits. A log tone map turns hit
// counts into brightness, and colour comes from how far each point jumped. a, b, c, d drift, so the shape flows.
// The pointer sets a (left to right) and d (bottom to top), so the attractor reshapes under your hand.
const PARAMS = { points: 1, drift: 1, exposure: 1 };

export default function (stage) {
  const canvas = document.createElement('canvas');
  canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block';
  stage.append(canvas);
  const gl = canvas.getContext('webgl2', { antialias: false, premultipliedAlpha: false });
  if (!gl || !gl.getExtension('EXT_color_buffer_float')) { stage.textContent = 'This needs WebGL2 with float render targets.'; return () => canvas.remove(); }
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const sh = (t, s) => { const x = gl.createShader(t); gl.shaderSource(x, s); gl.compileShader(x); if (!gl.getShaderParameter(x, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(x)); return x; };
  const link = (v, f) => { const p = gl.createProgram(); gl.attachShader(p, sh(gl.VERTEX_SHADER, v)); gl.attachShader(p, sh(gl.FRAGMENT_SHADER, f)); gl.bindAttribLocation(p, 0, 'p'); gl.linkProgram(p); if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p)); return p; };
  // pass 1: every vertex is one orbit; no attributes, just gl_VertexID
  const ptsProg = link(`#version 300 es
  precision highp float;
  uniform vec4 P; uniform float SEED; uniform vec2 SCALE, CTR;
  out float hue;
  uint pcg(uint v) { uint s = v * 747796405u + 2891336453u; uint w = ((s >> ((s >> 28u) + 4u)) ^ s) * 277803737u; return (w >> 22u) ^ w; }
  vec2 f(vec2 q) {
    return vec2(sin(P.x * q.y) + P.z * cos(P.x * q.x), sin(P.y * q.x) + P.w * cos(P.y * q.y));
  }
  void main() {
    uint h1 = pcg(uint(gl_VertexID) ^ (uint(SEED) * 2654435761u)), h2 = pcg(h1);
    vec2 q = vec2(float(h1), float(h2)) / 4294967295. * 4. - 2.;   // integer hash: a million distinct starts
    for (int i = 0; i < 24; i++) q = f(q);                     // fall onto the attractor
    vec2 n = f(q);
    hue = length(n - q);                                       // how far this point jumps on its next step
    gl_Position = vec4((n - CTR) * SCALE, 0, 1); gl_PointSize = 1.;
  }`, `#version 300 es
  precision highp float; in float hue; out vec4 o;
  void main() { o = vec4(1., hue, 0., 0.); }`);
  // pass 2: fade the accumulator (multiply by a constant through the blend unit)
  const quadVS = `#version 300 es
  in vec2 p; void main() { gl_Position = vec4(p, 0, 1); }`;
  const fadeProg = link(quadVS, `#version 300 es
  precision highp float; out vec4 o; void main() { o = vec4(0); }`);
  // pass 3: tone map hit counts to the screen
  const showProg = link(quadVS, `#version 300 es
  precision highp float; out vec4 o; uniform sampler2D A; uniform float K;
  void main() {
    vec4 s = texelFetch(A, ivec2(gl_FragCoord.xy), 0);
    float n = s.r, j = n > 0. ? s.g / n : 0.;
    float v = log(1. + n * K) / log(1. + 220. * K);           // log density
    v = clamp(v, 0., 1.);
    // jump length picks the hue: short hops cool blue-violet, long leaps hot amber
    float h = clamp(j / 2.6, 0., 1.);
    vec3 cool = vec3(.28, .38, 1.), mid = vec3(.95, .3, .55), hot = vec3(1., .78, .4);
    vec3 c = mix(mix(cool, mid, smoothstep(0., .55, h)), hot, smoothstep(.5, 1., h));
    vec3 col = vec3(.03, .028, .045) + c * pow(v, 1.15) * 1.15 + vec3(1.) * pow(v, 5.) * .55;
    o = vec4(col, 1);
  }`);
  const buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const vao = gl.createVertexArray(); gl.bindVertexArray(vao); gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  const empty = gl.createVertexArray();
  let tex = null, fbo = null, d = 1;
  const resize = () => {
    d = Math.min(devicePixelRatio, 2); canvas.width = (stage.clientWidth || 1) * d | 0; canvas.height = (stage.clientHeight || 1) * d | 0;
    if (tex) { gl.deleteTexture(tex); gl.deleteFramebuffer(fbo); }
    tex = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, tex); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA16F, canvas.width, canvas.height, 0, gl.RGBA, gl.HALF_FLOAT, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    fbo = gl.createFramebuffer(); gl.bindFramebuffer(gl.FRAMEBUFFER, fbo); gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
    gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
  };
  const ro = new ResizeObserver(resize); ro.observe(stage); resize();
  const BASE = [-1.4, 1.6, 1.0, .7], AMP = [.12, .1, .2, .2];
  // the attractor isn’t centred on the origin, so a few thousand CPU iterations a frame track its real bounds
  const box = [-2, -2, 2, 2]; let cx = 0, cy = 0, fx = 2, fy = 2, qx = .1, qy = .1, boxInit = false;
  function track(p, ease) {
    let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
    for (let i = 0; i < 6000; i++) {
      const nx = Math.sin(p[0] * qy) + p[2] * Math.cos(p[0] * qx), ny = Math.sin(p[1] * qx) + p[3] * Math.cos(p[1] * qy); qx = nx; qy = ny;
      if (i > 20) { x0 = Math.min(x0, qx); x1 = Math.max(x1, qx); y0 = Math.min(y0, qy); y1 = Math.max(y1, qy); }
    }
    const k = boxInit ? ease : 1; boxInit = true;
    box[0] += (x0 - box[0]) * k; box[1] += (y0 - box[1]) * k; box[2] += (x1 - box[2]) * k; box[3] += (y1 - box[3]) * k;
    cx = (box[0] + box[2]) / 2; cy = (box[1] + box[3]) / 2; fx = (box[2] - box[0]) / 2; fy = (box[3] - box[1]) / 2;
  }
  // the pointer, as 0..1 across and up the stage; an idle ghost (the slow drift) takes over when nobody is pointing
  let tx = .5, ty = .5, mx = .5, my = .5, ma = 0, lastMove = -1e9;
  const toLocal = e => { const b = canvas.getBoundingClientRect(); return [(e.clientX - b.left) / b.width, 1 - (e.clientY - b.top) / b.height]; };
  const onMove = e => { [tx, ty] = toLocal(e); lastMove = performance.now(); };
  const onLeave = () => { lastMove = -1e9; };
  canvas.addEventListener('pointermove', onMove); canvas.addEventListener('pointerdown', onMove); canvas.addEventListener('pointerleave', onLeave);
  const p = [0, 0, 0, 0];
  let still = 0;   // reduced motion: frames the parameters have been at rest (the still image is rebuilt after a change)
  const U = n => gl.getUniformLocation(ptsProg, n);
  const uP = U('P'), uSeed = U('SEED'), uScale = U('SCALE'), uCtr = U('CTR');
  const uA = gl.getUniformLocation(showProg, 'A'), uK = gl.getUniformLocation(showProg, 'K');
  let raf, frameNo = 0, last = performance.now(); const t0 = performance.now();
  function frame(now) {
    const dt = Math.min(.05, (now - last) / 1000); last = now;
    const t = reduce ? 0 : (now - t0) / 1000 * PARAMS.drift;
    const live = now - lastMove < 2500;
    if (live && ma < .01) { mx = tx; my = ty; }
    const k = 1 - Math.exp(-dt * 14);
    mx += (tx - mx) * k; my += (ty - my) * k;
    const ma0 = ma; ma += ((live ? 1 : 0) - ma) * (1 - Math.exp(-dt * (live ? 6 : 2.5)));
    const e = ma * ma * (3 - 2 * ma);
    for (let i = 0; i < 4; i++) p[i] = BASE[i] + AMP[i] * Math.sin(t * (.05 + i * .013) + i * 1.9);
    // steering: a runs −1.95 → −1.15 left to right, d .45 → 1.35 bottom to top (a range that stays chaotic)
    p[0] += (-1.95 + .8 * mx - p[0]) * e; p[3] += (.45 + .9 * my - p[3]) * e;
    const moving = ma > .002 && (live || Math.abs(ma - ma0) > 1e-4);
    track(p, moving ? .14 : .04);
    const asp = canvas.width / canvas.height, fit = .9 / Math.max(fx / asp, fy);
    const n = Math.round(1e6 * PARAMS.points);
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo); gl.viewport(0, 0, canvas.width, canvas.height);
    gl.enable(gl.BLEND);
    // fade what is there: dst *= decay. Reduced motion keeps one still image, rebuilt over 12 frames after you steer.
    const hold = reduce && !moving;
    if (reduce) { if (moving) still = 0; else if (still === 0) { gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT); } }
    const decay = hold ? 1 : .86;
    gl.useProgram(fadeProg); gl.bindVertexArray(vao); gl.blendColor(decay, decay, decay, decay); gl.blendFunc(gl.ZERO, gl.CONSTANT_COLOR); gl.drawArrays(gl.TRIANGLES, 0, 3);
    if (!hold || still < 12) {
      gl.useProgram(ptsProg); gl.bindVertexArray(empty); gl.blendFunc(gl.ONE, gl.ONE);
      gl.uniform4f(uP, p[0], p[1], p[2], p[3]); gl.uniform1f(uSeed, frameNo % 100003); gl.uniform2f(uScale, fit / asp, fit); gl.uniform2f(uCtr, cx, cy);
      gl.drawArrays(gl.POINTS, 0, n);
    }
    gl.disable(gl.BLEND);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null); gl.viewport(0, 0, canvas.width, canvas.height);
    gl.useProgram(showProg); gl.bindVertexArray(vao); gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, tex); gl.uniform1i(uA, 0);
    // exposure normalised by how many hits a pixel gets on average, so it looks the same at any size or count
    const per = n / (canvas.width * canvas.height) / (1 - (hold ? .0 : .86) || 1 / 12);
    gl.uniform1f(uK, PARAMS.exposure * 3 / Math.max(.05, per));
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    frameNo++; if (hold) still++;
    raf = requestAnimationFrame(frame);
  }
  raf = requestAnimationFrame(frame);
  return () => { cancelAnimationFrame(raf); ro.disconnect(); canvas.removeEventListener('pointermove', onMove); canvas.removeEventListener('pointerdown', onMove); canvas.removeEventListener('pointerleave', onLeave); gl.deleteTexture(tex); gl.deleteFramebuffer(fbo); gl.getExtension('WEBGL_lose_context')?.loseContext(); canvas.remove(); };
}
