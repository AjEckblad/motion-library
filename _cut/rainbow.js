// Rainbow from raindrops: the sun is low behind you and rain falls in front. Light that enters a drop, bounces once
// inside and comes back out leaves at about 42° from the direction opposite the sun, red a little wider than violet.
// So each falling drop sends you one colour only at the moment it crosses that angle, and the bow is simply the place
// where thousands of drops agree. A second bounce makes the fainter outer bow at about 51°, colours reversed, and the
// sky between the two (Alexander's band) is darker, because no drop sends light from there. The drops are drawn as
// streaks, each coloured by its angle from the anti-solar point.
const PARAMS = { drops: 24000, rain: 1, bow: 1 };

export default function (stage) {
  const canvas = document.createElement('canvas');
  canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block';
  stage.append(canvas);
  const gl = canvas.getContext('webgl2', { antialias: true });
  if (!gl) { stage.textContent = 'This needs WebGL2.'; return () => canvas.remove(); }
  const N = Math.max(2000, Math.round(PARAMS.drops));
  // the sun: low (11°), behind and a little to the right; the bow is centred opposite it, below the horizon
  const SUN = (() => { const e = 0.19, a = 0.06; return [Math.sin(a) * Math.cos(e), Math.sin(e), -Math.cos(a) * Math.cos(e)]; })();
  const PITCH = 0.13, FOC = 1 / Math.tan(0.62), EYE = 1.7;
  const COMMON = `
  uniform vec3 SUN; uniform float PITCH, FOC, A, T, BOW;
  vec3 hsv(float h, float s, float v) { vec3 k = clamp(abs(fract(h + vec3(0., 2. / 3., 1. / 3.)) * 6. - 3.) - 1., 0., 1.); return v * mix(vec3(1), k, s); }
  // what a drop at angle th (degrees) from the anti-solar point sends back
  vec3 bow(float th) {
    vec3 c = vec3(0);
    float x = (th - 40.4) / 2.1;                                 // primary: violet inside, red outside
    c += hsv(.78 * (1. - clamp(x, 0., 1.)), .9, 1.) * smoothstep(-.35, .25, x) * (1. - smoothstep(.92, 1.12, x));
    float y = (53.6 - th) / 2.9;                                  // secondary: reversed, and fainter
    c += hsv(.78 * (1. - clamp(y, 0., 1.)), .85, .42) * smoothstep(-.35, .25, y) * (1. - smoothstep(.92, 1.12, y));
    c += vec3(.16) * smoothstep(10., 40.5, th) * step(th, 40.6);  // inside the bow the sky is brighter
    return c;
  }
  vec3 ray(vec2 q) { float cp = cos(PITCH), sp = sin(PITCH); return normalize(vec3(q.x, q.y * cp + FOC * sp, -q.y * sp + FOC * cp)); }`;
  // the sky (a storm, lit from behind the viewer), the bow's faint continuous glow, sunlit hills
  const sceneFS = `#version 300 es
  precision highp float; in vec2 uv; out vec4 o; uniform vec2 R;
  ${COMMON}
  float h(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float n2(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f); return mix(mix(h(i), h(i + vec2(1, 0)), f.x), mix(h(i + vec2(0, 1)), h(i + 1.), f.x), f.y); }
  float fbm(vec2 p) { float s = 0., a = .5; for (int i = 0; i < 5; i++) { s += a * n2(p); p = p * 2.03 + 7.1; a *= .5; } return s; }
  void main() {
    vec2 q = (uv * 2. - 1.) * vec2(A, 1.);
    vec3 d = ray(q);
    float th = degrees(acos(clamp(dot(d, -SUN), -1., 1.)));
    vec3 col;
    float hill1 = .02 + .07 * fbm(vec2(d.x / d.z * 1.4, 3.)), hill2 = .004 + .035 * fbm(vec2(d.x / d.z * 3.1, 9.));
    if (d.y > hill1) {
      float cl = fbm(vec2(d.x / max(d.y + .25, .05) * .6 + T * .006, d.y * 4.));
      col = mix(vec3(.2, .22, .26), vec3(.36, .38, .42), cl);     // the storm: slate, lit from behind you
      col = mix(col, vec3(.44, .46, .5), smoothstep(.55, .0, d.y) * .35);
      col *= 1. - .28 * smoothstep(42.6, 44., th) * (1. - smoothstep(49.5, 51., th));   // Alexander's dark band
      col += bow(th) * .16 * BOW;                                 // the glow of countless drops too far to see
    } else {
      // the land: two lines of hills in low gold light, then a meadow
      float near = step(d.y, hill2);
      vec3 far = mix(vec3(.38, .42, .3), vec3(.5, .5, .32), fbm(vec2(d.x / d.z * 6., 1.)));
      vec3 hill = mix(vec3(.3, .38, .14), vec3(.56, .52, .2), fbm(vec2(d.x / d.z * 9., d.y * 60.)));
      col = mix(far, hill, near);
      float shade = fbm(vec2(d.x / d.z * 2. + T * .01, 5.)); col *= .7 + .45 * smoothstep(.35, .7, shade);   // cloud shadows drifting over
      if (d.y < -.01) {                                           // the meadow up close, fading into the hills
        float z = EYE_ / -d.y; vec2 g = vec2(d.x * z, z);
        vec3 m = mix(vec3(.26, .32, .11), vec3(.44, .46, .17), fbm(g * .06)) * (.88 + .2 * n2(g * .5));
        col = mix(m, col, smoothstep(25., 120., z));
      }
      col = mix(col, vec3(.48, .5, .52), smoothstep(.0, -.12, -abs(d.y)) * .35);
    }
    o = vec4(pow(col, vec3(.95)), 1);
  }`.replace('EYE_', EYE.toFixed(2));
  // rain: each drop a short streak (two vertices per drop, instanced), coloured by its angle to the anti-solar point
  const rainVS = `#version 300 es
  layout(location = 0) in float end;                            // 0 = head, 1 = tail
  layout(location = 1) in vec4 D;                               // x, starting height, z, phase
  ${COMMON}
  uniform float SPD; out vec3 col; out float a;
  void main() {
    float fall = mod(D.y - (T * SPD * 9. + D.w * 40.), 40.);
    vec3 p = vec3(D.x + fall * .12, fall - ${EYE.toFixed(2)}, D.z);
    p -= vec3(.12, -1., 0.) * end * .33 * SPD;                    // the streak a drop draws in one exposure
    float cp = cos(PITCH), sp = sin(PITCH);
    vec3 c = vec3(p.x, p.y * cp - p.z * sp, p.y * sp + p.z * cp);   // into the camera's frame
    gl_Position = vec4(c.x * FOC / (c.z * A), c.y * FOC / c.z, 0, 1);
    vec3 d = normalize(p);
    float th = degrees(acos(clamp(dot(d, -SUN), -1., 1.)));
    col = bow(th) * BOW * 1.6 + vec3(.1, .11, .12);
    a = smoothstep(150., 20., D.z) * (1. - end * .7);
  }`;
  const rainFS = `#version 300 es
  precision mediump float; in vec3 col; in float a; out vec4 o; void main() { o = vec4(col * a, 1); }`;
  const QUAD = `#version 300 es
  in vec2 p; out vec2 uv; void main() { uv = p * .5 + .5; gl_Position = vec4(p, 0, 1); }`;

  const sh = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s)); return s; };
  const prog = (vs, fs) => {
    const p = gl.createProgram(); gl.attachShader(p, sh(gl.VERTEX_SHADER, vs)); gl.attachShader(p, sh(gl.FRAGMENT_SHADER, fs)); gl.bindAttribLocation(p, 0, 'p'); gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
    const u = {}; for (let i = 0, n = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS); i < n; i++) { const nm = gl.getActiveUniform(p, i).name; u[nm] = gl.getUniformLocation(p, nm); }
    return { p, u };
  };
  const sceneP = prog(QUAD, sceneFS), rainP = prog(rainVS, rainFS);
  const quad = gl.createVertexArray(); gl.bindVertexArray(quad);
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer()); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  // drops fill a slab in front of the viewer; more of them near, where each is bigger
  const inst = new Float32Array(N * 4);
  for (let i = 0; i < N; i++) { const z = 8 + 140 * Math.pow(Math.random(), 1.6); inst.set([(Math.random() * 2 - 1) * z * 1.15, Math.random() * 40, z, Math.random()], i * 4); }
  const rv = gl.createVertexArray(); gl.bindVertexArray(rv);
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer()); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([0, 1]), gl.STATIC_DRAW); gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 1, gl.FLOAT, false, 0, 0);
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer()); gl.bufferData(gl.ARRAY_BUFFER, inst, gl.STATIC_DRAW); gl.enableVertexAttribArray(1); gl.vertexAttribPointer(1, 4, gl.FLOAT, false, 0, 0); gl.vertexAttribDivisor(1, 1);
  gl.bindVertexArray(null);

  let W = 1, H = 1;
  const resize = () => { const d = Math.min(devicePixelRatio, 2); W = canvas.width = Math.max(1, (stage.clientWidth * d) | 0); H = canvas.height = Math.max(1, (stage.clientHeight * d) | 0); };
  const ro = new ResizeObserver(resize); ro.observe(stage); resize();
  const common = (P, t) => { gl.uniform3f(P.u.SUN, ...SUN); gl.uniform1f(P.u.PITCH, PITCH); gl.uniform1f(P.u.FOC, FOC); gl.uniform1f(P.u.A, W / H); gl.uniform1f(P.u.T, t); gl.uniform1f(P.u.BOW, PARAMS.bow); };
  let raf, last = performance.now(), t = 0;
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000); last = now; t += dt;
    gl.bindFramebuffer(gl.FRAMEBUFFER, null); gl.viewport(0, 0, W, H); gl.disable(gl.BLEND);
    gl.useProgram(sceneP.p); common(sceneP, t); gl.uniform2f(sceneP.u.R, W, H); gl.bindVertexArray(quad); gl.drawArrays(gl.TRIANGLES, 0, 3);
    gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE);
    gl.useProgram(rainP.p); common(rainP, t); gl.uniform1f(rainP.u.SPD, PARAMS.rain); gl.bindVertexArray(rv);
    gl.drawArraysInstanced(gl.LINES, 0, 2, Math.round(N * Math.min(1, PARAMS.rain + 0.2)));
    gl.bindVertexArray(null); gl.disable(gl.BLEND);
    raf = requestAnimationFrame(frame);
  }
  raf = requestAnimationFrame(frame);
  return () => { cancelAnimationFrame(raf); ro.disconnect(); gl.getExtension('WEBGL_lose_context')?.loseContext(); canvas.remove(); };
}
